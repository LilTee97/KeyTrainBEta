import { useEffect, useMemo, useRef, useState } from 'react'
import {
  beatAtPerformanceTime,
  getPlaybackBeats,
  startAudio,
  startTimelineLoop,
  stopTimelineLoop,
  usePlaybackStore,
  type ScheduledHit,
} from '../../shared/audio/audioEngine'
import { startMetronome, stopMetronome, useMetronomeStore } from '../../shared/audio/metronome'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { MidiConnect } from '../../shared/midi/MidiConnect'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { getKeyboardRange } from '../../shared/midi/onScreenPiano/layout'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../../shared/musicTheory/types'
import { readSetting, writeSetting } from '../../shared/persistence/localSettings'
import type { TimelineEvent } from '../style/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import { FallingNotes } from './FallingNotes'
import { PracticeStage } from './PracticeStage'
import { buildGatedSteps, notesSoundingAt, type PracticeHand } from './noteGatedPlaybackEngine'
import { usePracticeStore } from './practiceStore'
import {
  MIN_TAPS,
  PASS_HIT_RATIO,
  PASS_MEDIAN_ABS_MS,
  expectedNotesOf,
  latencyFromTaps,
  median,
  passes,
  scoreTimed,
  type LatencyMeasure,
  type PlayedNote,
  type TimedScore,
} from './timedScoring'

/** Nhịp độ tập so với nhịp bài — bậc 4 · 5 · 6 của thang (`Reference/KE-HOACH-LUYEN-TAP.md` mục 2). */
const TEMPO_STEPS = [60, 80, 100] as const
type TempoStep = (typeof TEMPO_STEPS)[number]

/** Đo độ trễ: 80 BPM, 4 tiếng click để vào nhịp rồi 16 tiếng gõ theo. */
const CAL_BPM = 80
const CAL_COUNT_IN = 4
const CAL_TAPS = 16

const HAND_LABELS: Record<PracticeHand, string> = {
  left: 'Tay trái',
  right: 'Tay phải',
  both: 'Hai tay',
}

type Phase = 'idle' | 'playing' | 'calibrating'

/** Ghi sang `LuyenTap.json` qua máy chủ dev. Bản dựng tĩnh không có máy chủ — bỏ qua trong im lặng. */
function ghi(bang: 'luot' | 'do-tre', than: Record<string, unknown>): void {
  void fetch(`/__luyen-tap/${bang}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(than),
  }).catch(() => {})
}

/**
 * Nghe phím bấm (đàn thật lẫn phím ảo), quy ra phách của đồng hồ phát nhạc.
 *
 * `handlingMs` = lúc app xử lý − lúc trình duyệt nhận tín hiệu đàn (`timeStamp`): phần trễ MIDI đo được từ trong
 * trình duyệt. Đoạn phím → USB → Windows → trình duyệt thì phần mềm không đo được. Phép chấm không dính phần này
 * (chấm theo `timeStamp`), nhưng tiếng phím bấm thì phát lúc xử lý — nên đo để biết nó có góp vào trễ nghe không.
 */
function listenPresses(onPress: (press: PlayedNote, handlingMs: number) => void): () => void {
  return useMidiStore.subscribe((state, previous) => {
    const event = state.lastEvent
    if (!event || event === previous.lastEvent || event.velocity === 0) return
    onPress(
      { note: event.note, beat: beatAtPerformanceTime(event.time), velocity: event.velocity },
      performance.now() - event.time,
    )
  })
}

const round2 = (beat: number) => Math.round(beat * 100) / 100

export interface TimedPracticeProps {
  title: string
  timeline: readonly TimelineEvent[]
  voicings: readonly TwoHandVoicing[]
  beatsPerChord: number
  perBeat?: readonly string[]
  meter: 3 | 4
  /**
   * Vòng KHÔNG do tab Tái hòa âm dựng (trang thầy): nhịp 100% của vòng — thay BPM chung (là của bài ở tab ấy). Có thì tên
   * hợp âm đọc thẳng `perBeat` (một vòng, lặp theo phách) thay vì qua bộ phát của tab ấy.
   */
  vongBpm?: number
}

/**
 * Luyện đệm THEO NHỊP: máy chơi phần tay không tập kèm tiếng click, người tập đánh phần tay mình; đánh sai
 * không dừng, hết lượt mới chấm — đúng nốt bao nhiêu, sớm muộn bao nhiêu mili giây.
 *
 * Khác chế độ chờ đánh đúng nốt (`NoteGatedPractice`) ở chỗ có đồng hồ: giữ được nhịp đi qua chỗ sai mới là
 * đệm hát (`Reference/KE-HOACH-LUYEN-TAP.md` mục 1.5). Mỗi lượt ghi vào `LuyenTap.json` để chốt ngưỡng đạt
 * bằng số đo thật.
 */
export function TimedPractice({
  title,
  timeline,
  voicings,
  beatsPerChord,
  perBeat = [],
  meter,
  vongBpm,
}: TimedPracticeProps) {
  const storeBpm = useMetronomeStore((state) => state.bpm)
  const bpm = vongBpm ?? storeBpm
  const looping = usePlaybackStore((state) => state.looping)
  const storeTransport = usePracticeStore((state) => state.transport)
  const transport = vongBpm ? null : storeTransport

  useLiveSound()
  useComputerKeyboard(60)

  const [hand, setHand] = useState<PracticeHand>('both')
  const [tempo, setTempo] = useState<TempoStep>(60)
  const [ignoreOctave, setIgnoreOctave] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [latencyMs, setLatencyMs] = useState(() => readSetting('latencyMs'))
  const [calibration, setCalibration] = useState<LatencyMeasure | 'few' | null>(null)
  const [taps, setTaps] = useState(0)
  const [result, setResult] = useState<{ score: TimedScore; bpm: number } | null>(null)
  const [nowSymbol, setNowSymbol] = useState('')
  const [hitting, setHitting] = useState<{ left: MidiNote[]; right: MidiNote[] }>({
    left: [],
    right: [],
  })

  const presses = useRef<PlayedNote[]>([])
  const handling = useRef<number[]>([])
  const [handlingMedian, setHandlingMedian] = useState<number | null>(null)
  const unlisten = useRef<(() => void) | null>(null)
  const aborted = useRef(false)
  const calTimer = useRef<number | null>(null)
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase

  const stopListening = () => {
    unlisten.current?.()
    unlisten.current = null
  }

  /* Một ô click đếm vào trước khi bài vào: dời cả bài ra sau `meter` phách. */
  const countIn = meter
  const shifted = useMemo(
    () => timeline.map((event) => ({ ...event, startBeat: event.startBeat + countIn })),
    [timeline, countIn],
  )
  const endBeat = useMemo(
    () =>
      shifted.reduce<number>((end, event) => Math.max(end, event.startBeat + event.durationBeats), countIn),
    [shifted, countIn],
  )
  const practiceBpm = Math.max(20, Math.round((bpm * tempo) / 100))

  const steps = useMemo(
    () =>
      buildGatedSteps(shifted, voicings, {
        hand,
        beatsPerChord,
        symbolAt: (beat) => {
          const at = beat - countIn
          if (vongBpm) return perBeat[Math.max(0, Math.floor(at)) % Math.max(1, perBeat.length)] ?? ''
          const source = transport?.sourceBeat?.(at)
          if (source != null) {
            const name = perBeat[Math.max(0, Math.floor(source))]
            if (name) return name
          }
          return perBeat[Math.max(0, Math.floor(at))] ?? ''
        },
      }),
    [shifted, voicings, hand, beatsPerChord, transport, perBeat, countIn, vongBpm],
  )
  const expected = useMemo(() => expectedNotesOf(shifted, hand), [shifted, hand])

  /* Máy chơi phần tay KHÔNG tập; tay đang tập im để nghe rõ tay mình. Tập hai tay thì chỉ còn tiếng click. */
  const backing = useMemo<ScheduledHit[]>(
    () => [
      ...(hand === 'both' ? [] : shifted.filter((event) => event.hand !== hand)).map((event) => ({
        notes: event.notes,
        startBeat: event.startBeat,
        durationBeats: event.durationBeats,
        velocity: event.velocity,
      })),
      // Mốc rỗng ở cuối bài: vòng phát đủ dài kể cả khi không có tiếng nào để phát (tập hai tay).
      { notes: [], startBeat: endBeat, durationBeats: 0, velocity: 0 },
    ],
    [shifted, hand, endBeat],
  )

  /** Tiếng để vẽ nốt rơi và sáng phím: tay đang tập, kể cả nốt láy (không chấm, chỉ vẽ). */
  const shown = useMemo(
    () => (hand === 'both' ? shifted : shifted.filter((event) => event.hand === hand)),
    [shifted, hand],
  )

  const fallRange = useMemo(() => {
    let { low, high } = getKeyboardRange(readSetting('midiKeyboardKeys'))
    for (const event of shown) {
      for (const note of event.notes) {
        low = Math.min(low, note) as MidiNote
        high = Math.max(high, note) as MidiNote
      }
    }
    return { low, high }
  }, [shown])

  /* Phím sáng đúng lúc tiếng kêu, suốt độ ngân. */
  useEffect(() => {
    if (phase !== 'playing' || !looping) {
      setHitting({ left: [], right: [] })
      return
    }
    let frame = 0
    let last = ''
    const tick = () => {
      const next = notesSoundingAt(shown, getPlaybackBeats())
      const key = `${next.left.join()}/${next.right.join()}`
      if (key !== last) {
        last = key
        setHitting(next)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [phase, looping, shown])

  const begin = async () => {
    await startAudio()
    stopTimelineLoop()
    stopMetronome()
    aborted.current = false
    presses.current = []
    handling.current = []
    setResult(null)
    stopListening()
    unlisten.current = listenPresses((press, handlingMs) => {
      presses.current.push(press)
      handling.current.push(handlingMs)
    })
    startTimelineLoop(backing, practiceBpm, undefined, 0, true)
    // Sau vòng phát: vòng phát đặt đồng hồ về phách 0, tiếng click bám theo từ đó.
    await startMetronome(practiceBpm)
    setPhase('playing')
  }

  /* Vòng phát một lượt tự dừng sau cuối bài (hay bị bấm Dừng) → chấm. */
  useEffect(() => {
    if (phase !== 'playing' || looping) return
    stopListening()
    stopMetronome()
    setPhase('idle')
    if (aborted.current) return

    const score = scoreTimed(expected, presses.current, {
      msPerBeat: 60000 / practiceBpm,
      latencyMs: latencyMs ?? 0,
      ignoreOctave,
    })
    setResult({ score, bpm: practiceBpm })
    ghi('luot', {
      bai: title,
      tay: hand,
      bpm: practiceBpm,
      phanTram: tempo,
      doTreMs: latencyMs,
      tong: score.total,
      trung: score.hit,
      thua: score.extra.length,
      lechTrungViMs: score.medianMs,
      lechTuyetDoiMs: score.medianAbsMs,
      lechMs: score.errorsMs,
      truot: score.missed.map((note) => [round2(note.beat - countIn), note.note]),
      phimThua: score.extra.map((note) => [round2(note.beat - countIn), note.note]),
      // Mọi phím đã bấm, kể cả ngoài lúc bài chạy — để soi lại một lượt mà không phải đoán.
      phim: presses.current.map((press) => [round2(press.beat - countIn), press.note, press.velocity]),
      xuLyMs: handling.current.map(Math.round),
    })
  }, [phase, looping, expected, practiceBpm, latencyMs, ignoreOctave, title, hand, tempo, countIn])

  const calibrate = async () => {
    await startAudio()
    stopTimelineLoop()
    stopMetronome()
    setCalibration(null)
    setHandlingMedian(null)
    setTaps(0)
    const tapBeats: number[] = []
    const tapHandling: number[] = []
    stopListening()
    unlisten.current = listenPresses(({ beat }, handlingMs) => {
      if (beat < CAL_COUNT_IN - 0.5) return
      tapBeats.push(beat)
      tapHandling.push(handlingMs)
      setTaps(tapBeats.length)
    })
    await startMetronome(CAL_BPM)
    setPhase('calibrating')
    calTimer.current = window.setTimeout(
      () => {
        calTimer.current = null
        stopListening()
        stopMetronome()
        setPhase('idle')
        const found = latencyFromTaps(tapBeats, 60000 / CAL_BPM)
        setCalibration(found ?? 'few')
        const handlingMs = median(tapHandling)
        setHandlingMedian(handlingMs === null ? null : Math.round(handlingMs * 10) / 10)
        if (!found) return
        setLatencyMs(found.latencyMs)
        writeSetting('latencyMs', found.latencyMs)
        ghi('do-tre', {
          bpm: CAL_BPM,
          doTreMs: found.latencyMs,
          daoDongMs: found.spreadMs,
          soLanGo: found.n,
          lechMs: found.errorsMs,
          xuLyMs: tapHandling.map((ms) => Math.round(ms * 10) / 10),
        })
      },
      ((CAL_COUNT_IN + CAL_TAPS + 0.5) * 60000) / CAL_BPM,
    )
  }

  const cancel = () => {
    if (phase === 'playing') {
      aborted.current = true
      stopTimelineLoop()
      return
    }
    if (calTimer.current !== null) window.clearTimeout(calTimer.current)
    calTimer.current = null
    stopListening()
    stopMetronome()
    setPhase('idle')
  }

  /* Rời tab giữa chừng thì tắt hết. */
  useEffect(
    () => () => {
      if (calTimer.current !== null) window.clearTimeout(calTimer.current)
      unlisten.current?.()
      if (phaseRef.current !== 'idle') {
        stopTimelineLoop()
        stopMetronome()
      }
    },
    [],
  )

  const busy = phase !== 'idle'
  const score = result?.score
  const button = (on: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
      on
        ? 'border-amber-key bg-amber-key/15 text-amber-key'
        : 'border-line bg-white/4 text-dim hover:bg-white/8'
    }`

  /* Nút chính khi toàn màn hình — lúc ấy chỉ còn khung nốt rơi + bàn phím trên màn. */
  const fullscreenBar = (
    <>
      {phase === 'playing' ? (
        <>
          <span className="text-cream">Đang chơi — đánh sai cứ đi tiếp.</span>
          <button type="button" onClick={cancel} className={button(false)}>
            Dừng
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={busy || latencyMs === null || expected.length === 0}
          onClick={() => void begin()}
          className="rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
        >
          Bắt đầu ({practiceBpm} BPM)
        </button>
      )}
      {phase === 'calibrating' && <span className="text-cream">Đang đo độ trễ — đã gõ {taps}</span>}
      {latencyMs === null && phase === 'idle' && (
        <span className="text-rose-300">Chưa đo độ trễ — thoát toàn màn hình để đo.</span>
      )}
      {score && phase === 'idle' && (
        <span className="font-mono text-dim">
          Đúng {score.hit}/{score.total} · lệch {score.medianAbsMs ?? '—'} ms ·{' '}
          <span className={passes(score) ? 'text-teal-key' : 'text-rose-300'}>
            {passes(score) ? 'Đạt' : 'Chưa đạt'}
          </span>
        </span>
      )}
    </>
  )

  return (
    <div className="rounded-xl border border-line bg-black/25 p-4">
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Luyện đệm · theo nhịp
      </h3>
      <div className="mb-3">
        <MidiConnect />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {/* Trái bên trái, phải bên phải — như hai bàn tay (người dùng 2/10/2026). */}
          {(['left', 'both', 'right'] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              onClick={() => setHand(value)}
              className={button(hand === value)}
            >
              {HAND_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TEMPO_STEPS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              onClick={() => setTempo(value)}
              className={button(tempo === value)}
              title={`${Math.round((bpm * value) / 100)} BPM`}
            >
              {value}%
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-dim">
          <input
            type="checkbox"
            disabled={busy}
            checked={ignoreOctave}
            onChange={(event) => setIgnoreOctave(event.target.checked)}
            className="accent-amber-key"
          />
          Bỏ qua quãng tám
        </label>
      </div>

      {/* Độ trễ: loa + đàn + thói quen sớm/muộn — chưa đo thì chưa chấm được nhịp. */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        {phase === 'calibrating' ? (
          <>
            <span className="text-cream">
              Gõ một phím bất kỳ đúng theo tiếng click — {CAL_COUNT_IN} tiếng đầu chỉ nghe, rồi gõ{' '}
              {CAL_TAPS} tiếng. Đã gõ {taps}.
            </span>
            <button type="button" onClick={cancel} className={button(false)}>
              Huỷ
            </button>
          </>
        ) : (
          <>
            <span className={latencyMs === null ? 'text-rose-300' : 'text-dim'}>
              {latencyMs === null
                ? 'Chưa đo độ trễ đàn và loa — đo trước khi tập theo nhịp.'
                : `Độ trễ: ${latencyMs} ms`}
            </span>
            <button type="button" disabled={busy} onClick={() => void calibrate()} className={button(false)}>
              {latencyMs === null ? 'Đo độ trễ' : 'Đo lại'}
            </button>
            {calibration === 'few' && (
              <span className="text-rose-300">Gõ được dưới {MIN_TAPS} tiếng — đo lại.</span>
            )}
            {calibration && calibration !== 'few' && (
              <span className="text-dim">
                Vừa đo: {calibration.latencyMs} ms, dao động ±{calibration.spreadMs} ms ({calibration.n}{' '}
                lần gõ). Đổi loa hay tai nghe thì đo lại.
              </span>
            )}
            {handlingMedian !== null && (
              <span className="text-dim">
                Trình duyệt nhận tín hiệu đàn → app xử lý: trung vị {handlingMedian} ms.
              </span>
            )}
          </>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {phase === 'playing' ? (
          <>
            <span className="text-sm text-cream">Đang chơi — đánh sai cứ đi tiếp.</span>
            <button type="button" onClick={cancel} className={button(false)}>
              Dừng
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy || latencyMs === null || expected.length === 0}
            onClick={() => void begin()}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40"
          >
            Bắt đầu ({practiceBpm} BPM, đếm vào {countIn} phách)
          </button>
        )}
      </div>

      {score && (
        <div className="mb-3 rounded-lg border border-line bg-black/30 p-3 text-sm">
          <p>
            Đúng nốt: <b>{score.hit}</b>/{score.total} (
            {score.total ? Math.round((score.hit / score.total) * 100) : 0}%)
          </p>
          <p>
            Lệch nhịp:{' '}
            {score.medianAbsMs === null ? (
              '—'
            ) : (
              <>
                trung vị <b>{score.medianAbsMs} ms</b> · thói quen{' '}
                {score.medianMs! < 0 ? `sớm ${-score.medianMs!}` : `muộn ${score.medianMs}`} ms
              </>
            )}
          </p>
          <p>Phím thừa hoặc sai: {score.extra.length}</p>
          <p className="mt-1 text-xs text-dim">
            Ngưỡng tạm — đoán, chưa đo: ≥ {PASS_HIT_RATIO * 100}% đúng nốt và lệch ≤ {PASS_MEDIAN_ABS_MS} ms →{' '}
            <span className={passes(score) ? 'text-teal-key' : 'text-rose-300'}>
              {passes(score) ? 'Đạt' : 'Chưa đạt'}
            </span>
          </p>
        </div>
      )}

      <PracticeStage bar={fullscreenBar}>
        {(full) => (
          <>
            <div className={full ? 'min-h-0 flex-1' : ''}>
              <FallingNotes
                events={shown}
                steps={steps}
                index={0}
                live={phase === 'playing' && looping}
                lowNote={fallRange.low}
                highNote={fallRange.high}
                onSymbol={setNowSymbol}
                fill={full}
              />
            </div>
            <div className={full ? 'h-[38vh] max-h-80 min-h-28 shrink-0' : ''}>
              <OnScreenPiano
                lowNote={fallRange.low}
                highNote={fallRange.high}
                leftHandNotes={hitting.left}
                rightHandNotes={hitting.right}
                height={full ? '100%' : undefined}
              />
            </div>
            <div className="shrink-0 rounded-b-lg border border-t-0 border-line bg-black/50 px-2 py-1.5 text-center">
              <span className="font-sans text-lg font-bold text-amber-key">{nowSymbol || '—'}</span>
            </div>
          </>
        )}
      </PracticeStage>
    </div>
  )
}
