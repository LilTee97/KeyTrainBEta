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
  LUC_RO,
  MIN_TAPS,
  PASS_HIT_RATIO,
  PASS_MEDIAN_ABS_MS,
  chamHopAm,
  chamLay,
  chamLuc,
  chamNhacPhim,
  expectedNotesOf,
  gopLopCaoDo,
  hopAmTheoPhach,
  latencyFromTaps,
  median,
  passes,
  scoreTimed,
  type ChamHopAm,
  type ChamLay,
  type ChamLuc,
  type ChamNhac,
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
function listenPresses(
  onPress: (press: PlayedNote, handlingMs: number) => void,
  /** Lúc nhấc phím — để chấm đánh giật (`chamNhacPhim`). */
  onRelease?: (note: MidiNote, beat: number) => void,
): () => void {
  return useMidiStore.subscribe((state, previous) => {
    const event = state.lastEvent
    if (!event || event === previous.lastEvent) return
    if (event.velocity === 0) {
      onRelease?.(event.note, beatAtPerformanceTime(event.time))
      return
    }
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
  /**
   * Bậc lộ trình (trang thầy): khoá tay · nhịp độ · quãng tám; `anNotRoi` (bậc 7) ẩn nốt rơi và phím đích, chỉ hiện tên hợp âm
   * đang chơi và hợp âm kế. Hết lượt thì chấm theo ngưỡng của bậc (`onXong` trả lời chấm để hiện).
   */
  bac?: {
    tay: PracticeHand
    tempo: TempoStep
    boQuaQuangTam: boolean
    anNotRoi: boolean
    /** Bậc 7 — chấm (b): gộp nốt cùng tên trong một lúc, kiểm bass và nốt ngoài hợp âm (`chamHopAm`). */
    theoHopAm: boolean
    /** Chấm cả lúc nhấc phím — nốt giật nhấc sớm, nốt ngân giữ đủ (`chamNhacPhim`; tab Kỹ thuật đánh). */
    chamNhac?: boolean
    /** Chấm nốt láy — bấm sát trước nốt chính, láy chồng bấm đủ hai nốt (`chamLay`; tab Kỹ thuật đánh). */
    chamLay?: boolean
    onXong: (
      score: TimedScore,
      hopAm: ChamHopAm | null,
      nhac: ChamNhac | null,
      lay: ChamLay | null,
      /** Nhận xét lực nhấn — chỉ để ghi nhật ký, không tính vào đạt. */
      luc: ChamLuc | null,
    ) => { dat: boolean; tomTat: string }
  }
  /** Tập tự do ở tab Kỹ thuật đánh: chấm nhấc phím / nốt láy dù không có bậc (có bậc thì theo cờ của bậc). */
  chamNhac?: boolean
  chamLay?: boolean
  /** Bên gọi tự chọn BPM (`vongBpm` = nhịp tập): ẩn nút 60 · 80 · 100 %, chơi đúng `vongBpm`. */
  anTempo?: boolean
}

/** Bậc 7 — chỉ tên hợp âm: hợp âm đang chơi và hợp âm kế (đọc trước, như đọc bảng hợp âm khi đệm hát). */
function HopAmLon({
  perBeat,
  countIn,
  playing,
  full,
}: {
  perBeat: readonly string[]
  countIn: number
  playing: boolean
  full: boolean
}) {
  const dau = { nay: perBeat[0] ?? '', ke: '', con: 0, demVao: true }
  const [vi, setVi] = useState(dau)
  useEffect(() => {
    const len = perBeat.length
    if (!playing || len === 0) {
      setVi({ nay: perBeat[0] ?? '', ke: '', con: 0, demVao: true })
      return
    }
    let frame = 0
    let last = ''
    const tick = () => {
      const at = getPlaybackBeats() - countIn
      const i = Math.max(0, Math.floor(at))
      const nay = perBeat[i % len] ?? ''
      let j = i + 1
      while (j < i + len && (perBeat[j % len] ?? '') === nay) j += 1
      const next = {
        nay,
        ke: j < i + len ? (perBeat[j % len] ?? '') : '',
        con: Math.max(0, Math.ceil(j - Math.max(at, 0))),
        demVao: at < 0,
      }
      const key = JSON.stringify(next)
      if (key !== last) {
        last = key
        setVi(next)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [perBeat, countIn, playing])
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-line bg-black/60 ${
        full ? 'min-h-0 flex-1' : 'h-[220px]'
      }`}
    >
      <span className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        {vi.demVao ? 'Đếm vào — hợp âm đầu' : 'Đang chơi'}
      </span>
      <span className="font-sans text-6xl font-bold text-amber-key">{vi.nay || '—'}</span>
      {vi.ke && (
        <span className="font-sans text-xl text-cream/80">
          kế: <b>{vi.ke}</b>
          <span className="ml-2 text-xs text-dim">sau {vi.con} phách</span>
        </span>
      )}
    </div>
  )
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
  bac,
  chamNhac: chamNhacTuDo = false,
  chamLay: chamLayTuDo = false,
  anTempo = false,
}: TimedPracticeProps) {
  const storeBpm = useMetronomeStore((state) => state.bpm)
  const bpm = vongBpm ?? storeBpm
  const looping = usePlaybackStore((state) => state.looping)
  const storeTransport = usePracticeStore((state) => state.transport)
  const transport = vongBpm ? null : storeTransport

  useLiveSound()
  useComputerKeyboard(60)

  const [handTuDo, setHand] = useState<PracticeHand>('both')
  const hand = bac?.tay ?? handTuDo
  const [tempoTuDo, setTempo] = useState<TempoStep>(60)
  const tempo = bac?.tempo ?? (anTempo ? 100 : tempoTuDo)
  const [ignoreOctaveTuDo, setIgnoreOctave] = useState(false)
  const ignoreOctave = bac?.boQuaQuangTam ?? ignoreOctaveTuDo
  const anNotRoi = bac?.anNotRoi ?? false
  const bacRef = useRef(bac)
  bacRef.current = bac
  /* Chấm nhấc phím / nốt láy: theo bậc nếu có, không thì theo cờ tập tự do. */
  const chamRef = useRef({ nhac: false, lay: false })
  chamRef.current = { nhac: bac?.chamNhac ?? chamNhacTuDo, lay: bac?.chamLay ?? chamLayTuDo }
  const [phase, setPhase] = useState<Phase>('idle')
  const [latencyMs, setLatencyMs] = useState(() => readSetting('latencyMs'))
  const [calibration, setCalibration] = useState<LatencyMeasure | 'few' | null>(null)
  const [taps, setTaps] = useState(0)
  const [result, setResult] = useState<{
    score: TimedScore
    bpm: number
    nhac: ChamNhac | null
    lay: ChamLay | null
    luc: ChamLuc | null
    ketQua: { dat: boolean; tomTat: string } | null
  } | null>(null)
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
    unlisten.current = listenPresses(
      (press, handlingMs) => {
        presses.current.push(press)
        handling.current.push(handlingMs)
      },
      (note, beat) => {
        // Nhấc phím: gắn vào lần bấm gần nhất của chính phím ấy còn đang giữ.
        for (let i = presses.current.length - 1; i >= 0; i--) {
          const press = presses.current[i]!
          if (press.note === note && press.offBeat === undefined) {
            press.offBeat = beat
            break
          }
        }
      },
    )
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

    const theoHopAm = bacRef.current?.theoHopAm === true
    const msPerBeat = 60000 / practiceBpm
    const opts = { msPerBeat, latencyMs: latencyMs ?? 0, ignoreOctave }
    /* Nốt láy chấm riêng; phím đã dùng để láy không còn là phím thừa. */
    const lay = chamRef.current.lay ? chamLay(shifted, expected, presses.current, opts) : null
    const daLay = new Set(lay?.phimLay ?? [])
    const score = scoreTimed(
      theoHopAm ? gopLopCaoDo(expected) : expected,
      presses.current.filter((_, i) => !daLay.has(i)),
      opts,
    )
    const hopAm = theoHopAm
      ? chamHopAm(shifted, presses.current, score.extra, {
          msPerBeat,
          latencyMs: latencyMs ?? 0,
          hopAmAt: hopAmTheoPhach(perBeat, countIn),
        })
      : null
    const nhac = chamRef.current.nhac
      ? chamNhacPhim(shifted, expected, presses.current, { msPerBeat, latencyMs: latencyMs ?? 0, ignoreOctave })
      : null
    const luc = chamLuc(shifted, expected, presses.current, opts)
    setResult({ score, bpm: practiceBpm, nhac, lay, luc, ketQua: bacRef.current?.onXong(score, hopAm, nhac, lay, luc) ?? null })
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
      phim: presses.current.map((press) => [
        round2(press.beat - countIn),
        press.note,
        press.velocity,
        press.offBeat === undefined ? null : round2(press.offBeat - countIn),
      ]),
      ...(nhac ? { nhac } : {}),
      ...(lay ? { lay: { tong: lay.layTong, dung: lay.layDung } } : {}),
      ...(luc ? { luc } : {}),
      xuLyMs: handling.current.map(Math.round),
    })
  }, [phase, looping, expected, shifted, perBeat, practiceBpm, latencyMs, ignoreOctave, title, hand, tempo, countIn])

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
  /* Bậc lộ trình chấm theo ngưỡng của bậc; tập tự do theo ngưỡng chung. */
  const dat = result?.ketQua ? result.ketQua.dat : score ? passes(score) : false
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
          <span className={dat ? 'text-teal-key' : 'text-rose-300'}>{dat ? 'Đạt' : 'Chưa đạt'}</span>
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

      {/* Bậc lộ trình đã định sẵn tay · nhịp độ · quãng tám. */}
      <div className={`mb-3 flex flex-wrap items-center gap-4 ${bac ? 'hidden' : ''}`}>
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
        <div className={`flex gap-1 ${anTempo ? 'hidden' : ''}`}>
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
          {result?.luc && (
            <p>
              Lực nhấn: tiếng nhấn <b>{result.luc.nhanTB}</b> · tiếng thường <b>{result.luc.thuongTB}</b> →{' '}
              {result.luc.chenh >= LUC_RO
                ? `nhấn rõ (+${result.luc.chenh})`
                : result.luc.chenh > 0
                  ? `nhấn chưa rõ (+${result.luc.chenh})`
                  : `tiếng nhấn chưa mạnh hơn tiếng thường (${result.luc.chenh})`}{' '}
              <span className="text-xs text-dim">— chỉ nhận xét, không tính vào đạt</span>
            </p>
          )}
          {result?.lay && (
            <p>
              Láy đúng: <b>{result.lay.layDung}</b>/{result.lay.layTong}
            </p>
          )}
          {result?.nhac && (
            <p>
              Giật đúng (nhấc sớm): <b>{result.nhac.giatDung}</b>/{result.nhac.giatTong} · Ngân đủ (giữ phím):{' '}
              <b>{result.nhac.nganDung}</b>/{result.nhac.nganTong}
            </p>
          )}
          {result?.ketQua ? (
            <p className="mt-1 text-xs text-dim">
              Ngưỡng của bậc: {result.ketQua.tomTat} →{' '}
              <span className={dat ? 'font-semibold text-teal-key' : 'font-semibold text-rose-300'}>
                {dat ? 'Đạt' : 'Chưa đạt'}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-dim">
              Ngưỡng tạm — đoán, chưa đo: ≥ {PASS_HIT_RATIO * 100}% đúng nốt và lệch ≤ {PASS_MEDIAN_ABS_MS} ms →{' '}
              <span className={dat ? 'text-teal-key' : 'text-rose-300'}>{dat ? 'Đạt' : 'Chưa đạt'}</span>
            </p>
          )}
        </div>
      )}

      <PracticeStage bar={fullscreenBar}>
        {(full) => (
          <>
            {/* Bậc 7 ẩn nốt rơi — chỉ còn tên hợp âm, như đệm hát thật. */}
            {anNotRoi ? (
              <HopAmLon perBeat={perBeat} countIn={countIn} playing={phase === 'playing' && looping} full={full} />
            ) : (
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
            )}
            <div className={full ? 'h-[38vh] max-h-80 min-h-28 shrink-0' : ''}>
              <OnScreenPiano
                lowNote={fallRange.low}
                highNote={fallRange.high}
                leftHandNotes={anNotRoi ? [] : hitting.left}
                rightHandNotes={anNotRoi ? [] : hitting.right}
                height={full ? '100%' : undefined}
              />
            </div>
            {!anNotRoi && (
              <div className="shrink-0 rounded-b-lg border border-t-0 border-line bg-black/50 px-2 py-1.5 text-center">
                <span className="font-sans text-lg font-bold text-amber-key">{nowSymbol || '—'}</span>
              </div>
            )}
          </>
        )}
      </PracticeStage>
    </div>
  )
}
