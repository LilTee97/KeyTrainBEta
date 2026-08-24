import { useEffect, useMemo, useRef, useState } from 'react'
import { readSetting, writeSetting } from '../../shared/persistence/localSettings'
import {
  SYNC_LIMIT_MS,
  defaultSyncOffsetMs,
  getPlaybackBeats,
  playChord,
  setSyncOffsetMs,
  startAudio,
  useAudioStore,
  usePlaybackStore,
} from '../../shared/audio/audioEngine'
import { setBpm, useMetronomeStore } from '../../shared/audio/metronome'
import { PlaybackToolbar } from '../input/ChordOverview'
import { usePracticeStore } from './practiceStore'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { FallingNotes } from './FallingNotes'
import { MidiConnect } from '../../shared/midi/MidiConnect'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { getKeyboardRange, KEYBOARD_SIZES } from '../../shared/midi/onScreenPiano/layout'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import { midiToName } from '../../shared/musicTheory/pitch'
import { scaleLabelForSymbol } from '../brain/chordScale'
import type { TimelineEvent } from '../style/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { PracticeHand } from './noteGatedPlaybackEngine'
import {
  advance,
  buildGatedSteps,
  currentStep,
  isStepMatched,
  missingNotes,
  notesHittingAt,
  progressOf,
  registerMiss,
  restart,
  startGatedSession,
} from './noteGatedPlaybackEngine'

export interface NoteGatedPracticeProps {
  timeline: readonly TimelineEvent[]
  voicings: readonly TwoHandVoicing[]
  beatsPerChord: number
  /** Lưới hợp âm theo phách nguồn — để ghi tên hợp âm đúng khi bài đã sắp. */
  perBeat?: readonly string[]
}

const HAND_LABELS: Record<PracticeHand, string> = {
  right: 'Tay phải',
  left: 'Tay trái',
  both: 'Hai tay',
}

/**
 * Luyện đệm theo lối chờ đánh đúng nốt mới cho qua.
 *
 * Không có đồng hồ chạy: bấm đúng thì đi tiếp, dừng lại suy nghĩ thì mọi thứ
 * đứng yên chờ. Nhờ vậy người học tập được đúng thế tay mà không bị nhạc nền
 * bỏ lại phía sau.
 */
export function NoteGatedPractice({
  timeline,
  voicings,
  beatsPerChord,
  perBeat = [],
}: NoteGatedPracticeProps) {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const audioReady = useAudioStore((state) => state.ready)
  const bpm = useMetronomeStore((state) => state.bpm)
  const looping = usePlaybackStore((state) => state.looping)
  const transport = usePracticeStore((state) => state.transport)

  useLiveSound()
  useComputerKeyboard(60)

  const [hand, setHand] = useState<PracticeHand>('both')
  const [ignoreOctave, setIgnoreOctave] = useState(false)
  const [active, setActive] = useState(false)

  const [keyboardKeys, setKeyboardKeys] = useState(() => readSetting('midiKeyboardKeys'))
  const [nowSymbol, setNowSymbol] = useState('')

  /*
    Mức bù lệch: lấy con số đã dò nếu có, không thì theo máy.

    `null` trong cài đặt nghĩa là **chưa ai dò** — khác hẳn với dò ra đúng 0.
    Phân biệt hai thứ ấy mới cho nút *Trả về mặc định* làm được đúng việc của
    nó: quên con số cũ đi và bám lại theo máy.
  */
  const [syncOffset, setSyncOffset] = useState(
    () => readSetting('syncOffsetMs') ?? defaultSyncOffsetMs(),
  )
  useEffect(() => {
    setSyncOffsetMs(syncOffset)
  }, [syncOffset])

  const applySyncOffset = (ms: number) => {
    const clamped = Math.max(-SYNC_LIMIT_MS, Math.min(SYNC_LIMIT_MS, Math.round(ms)))
    setSyncOffset(clamped)
    writeSetting('syncOffsetMs', clamped)
  }

  const steps = useMemo(
    () =>
      buildGatedSteps(timeline, voicings, {
        hand,
        beatsPerChord,
        symbolAt: (beat) => {
          const src = transport?.sourceBeat?.(beat)
          if (src != null) {
            const name = perBeat[Math.max(0, Math.floor(src))]
            if (name) return name
          }
          const name = perBeat[Math.max(0, Math.floor(beat))]
          return name ?? ''
        },
      }),
    [timeline, voicings, hand, beatsPerChord, perBeat, transport],
  )

  /** Dải phím dựa theo kích thước đàn MIDI thật người dùng đang cắm. */
  const keyboardRange = useMemo(
    () => getKeyboardRange(keyboardKeys),
    [keyboardKeys],
  )

  /*
    Dải hiển thị cho nốt rơi và bàn phím ảo dùng range của đàn thật.
    Nếu bài có nốt ngoài range đàn thì vẫn cố gắng hiển thị nhưng có thể bị cắt.
  */
  const range = keyboardRange
  const fallRange = useMemo(() => {
    let low = range.low
    let high = range.high
    for (const step of steps) {
      for (const note of step.notes) {
        if (note < low) low = note
        if (note > high) high = note
      }
    }
    return { low, high }
  }, [steps, range])

  const [session, setSession] = useState(() => startGatedSession(steps))

  /** Dựng lại lượt khi đổi vòng hợp âm, điệu hoặc chế độ tay. */
  useEffect(() => {
    setSession(startGatedSession(steps))
  }, [steps])

  const step = currentStep(session)

  const [hitting, setHitting] = useState<{
    left: number[]
    right: number[]
  }>({ left: [], right: [] })

  useEffect(() => {
    if (!looping) {
      setHitting(
        active && step
          ? { left: [...step.leftNotes], right: [...step.rightNotes] }
          : { left: [], right: [] },
      )
      return
    }

    let frame = 0
    let last = ''
    const tick = () => {
      const next = notesHittingAt(steps, getPlaybackBeats())
      const key = `${next.left.join()}/${next.right.join()}`
      if (key !== last) {
        last = key
        setHitting(next)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [looping, active, step, steps])

  /**
   * Chỉ chấm sau khi người học nhả hết phím của chặng trước, nếu không thì
   * giữ nguyên tay ở một hợp âm lặp lại sẽ tự động qua nhiều chặng liền.
   */
  const armedRef = useRef(true)
  useEffect(() => {
    armedRef.current = false
  }, [session.currentIndex])

  useEffect(() => {
    if (!active || !step) return

    if (heldNotes.length === 0) {
      armedRef.current = true
      return
    }
    if (!armedRef.current) return

    if (isStepMatched(heldNotes, step, { ignoreOctave })) {
      setSession((current) => advance(current))
      return
    }

    // Bấm đủ số nốt mà vẫn không khớp nghĩa là bấm sai, không phải chưa xong.
    if (heldNotes.length >= step.notes.length) {
      armedRef.current = false
      setSession((current) => registerMiss(current))
    }
  }, [heldNotes, step, active, ignoreOctave])

  const progress = progressOf(session)
  const missing = step ? missingNotes(heldNotes, step, { ignoreOctave }) : []

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Luyện đệm
        </h3>
        <p className="text-sm text-dim">
          Nhập vòng hợp âm ở trên để bắt đầu luyện.
        </p>
      </div>
    )
  }

  const nowGam = nowSymbol ? scaleLabelForSymbol(nowSymbol) : null

  return (
    <div className="rounded-xl border border-line bg-black/25 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Luyện đệm · chờ đánh đúng nốt
        </h3>
        <span className="font-mono text-xs text-dim">
          {progress.done}/{progress.total} chặng
        </span>
      </div>
      {/*
        Nút cắm đàn đặt ngay đây, cạnh chỗ dùng tới nó. Bàn phím ảo và phím máy
        tính vẫn chơi được mà không cần kết nối gì — đàn MIDI chỉ là một nguồn
        nốt nữa đổ vào cùng chỗ.
      */}
      <div className="mb-3">
        <MidiConnect />
      </div>

      {/* Chọn tay và mức chặt */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {(['right', 'left', 'both'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setHand(value)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                hand === value
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              {HAND_LABELS[value]}
            </button>
          ))}
        </div>

        <label
          className="flex items-center gap-2 text-xs text-dim"
          title="Bật khi luyện bằng bàn phím máy tính hoặc đàn ít phím"
        >
          <input
            type="checkbox"
            checked={ignoreOctave}
            onChange={(event) => setIgnoreOctave(event.target.checked)}
            className="accent-amber-key"
          />
          Bỏ qua quãng tám
        </label>
      </div>

      {/* Thanh tiến độ */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-teal-key transition-all"
          style={{ width: `${progress.ratio * 100}%` }}
        />
      </div>

      {!audioReady ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void startAudio()}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
          >
            Bật âm thanh để luyện
          </button>
          <span className="text-xs text-dim">
            Trình duyệt chỉ cho phát tiếng sau khi bạn chạm vào trang.
          </span>
        </div>
      ) : !active ? (
        <button
          type="button"
          onClick={() => {
            setSession(startGatedSession(steps))
            setActive(true)
          }}
          className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
        >
          Bắt đầu luyện
        </button>
      ) : session.finished ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-serif text-xl font-semibold text-teal-key">
            Xong cả lượt
          </span>
          {session.stumbled.length > 0 && (
            <span className="text-xs text-dim">
              vướng ở {session.stumbled.length} chặng
            </span>
          )}
          <button
            type="button"
            onClick={() => setSession((current) => restart(current))}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
          >
            Luyện lại
          </button>
          <button
            type="button"
            onClick={() => setActive(false)}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
          >
            Dừng
          </button>
        </div>
      ) : (
        step && (
          <div>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="font-mono text-xs text-dim">
                {step.notes.map((note) => midiToName(note)).join(' ')}
              </span>
              {session.attempts > 0 && (
                <span className="font-mono text-xs text-rose-300">
                  sai {session.attempts} lần
                </span>
              )}
            </div>

            <p className="mb-3 font-mono text-[11px] text-dim">
              {missing.length === 0
                ? 'Nhả phím ra rồi bấm lại.'
                : `còn thiếu ${missing.length} nốt`}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => playChord(step.notes)}
                className="rounded-lg border border-line bg-white/6 px-3 py-1.5 text-xs text-cream hover:bg-white/12"
              >
                ♪ Nghe chặng này
              </button>
              <button
                type="button"
                onClick={() => setSession((current) => advance(current))}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
              >
                Bỏ qua chặng →
              </button>
              <button
                type="button"
                onClick={() => setActive(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
              >
                Dừng
              </button>
            </div>
          </div>
        )
      )}

      <div className="mt-4">
        {/*
          Dò lệch tiếng và hình.

          Đồng hồ của Tone không phải đồng hồ của tai: nó đọc vị trí ở chỗ đang
          *xếp lịch*, sớm hơn chỗ loa đang *kêu*, và quãng đường từ trình duyệt
          tới màng loa thì mỗi máy một khác. Mặc định lấy con số máy tự tính;
          còn lại để tai người chơi dò, vì thứ cần khớp nằm trong đầu người nghe.
        */}
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-dim">
          <span title="Kéo cho tiếng đàn khớp với lúc nốt chạm lằn kẻ">
            Lệch tiếng ↔ hình:
          </span>
          <input
            type="range"
            min={-SYNC_LIMIT_MS}
            max={SYNC_LIMIT_MS}
            step={5}
            value={syncOffset}
            onChange={(event) => applySyncOffset(Number(event.target.value))}
            className="w-40 accent-amber-key"
          />
          <input
            type="number"
            min={-SYNC_LIMIT_MS}
            max={SYNC_LIMIT_MS}
            step={5}
            value={syncOffset}
            onChange={(event) => applySyncOffset(Number(event.target.value) || 0)}
            className="w-16 rounded border border-line bg-white/6 px-1 py-0.5 text-cream"
          />
          <span className="text-[10px] text-dim/70">ms</span>
          <button
            type="button"
            onClick={() => {
              writeSetting('syncOffsetMs', null)
              const back = defaultSyncOffsetMs()
              setSyncOffsetMs(back)
              setSyncOffset(back)
            }}
            className="rounded border border-line px-2 py-0.5 text-[11px] text-cream hover:bg-white/6"
            title={`Về mức máy tự tính (${defaultSyncOffsetMs()} ms)`}
          >
            Trả về mặc định
          </button>
          <span className="text-[10px] text-dim/70">
            {syncOffset > 0
              ? 'hình đang chạy trước — kéo hình chậm lại'
              : syncOffset < 0
                ? 'tiếng đang chạy trước — kéo hình nhanh lên'
                : 'không bù'}
          </span>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-dim">
          <span>Bàn phím MIDI:</span>
          <select
            value={keyboardKeys}
            onChange={(e) => {
              const n = Number(e.target.value)
              setKeyboardKeys(n)
              writeSetting('midiKeyboardKeys', n)
            }}
            className="rounded border border-line bg-white/6 px-2 py-0.5 text-cream"
          >
            {KEYBOARD_SIZES.map((k) => (
              <option key={k} value={k}>
                {k} phím
              </option>
            ))}
            {/* allow custom if not in list */}
            {!(KEYBOARD_SIZES as readonly number[]).includes(keyboardKeys) && (
              <option value={keyboardKeys}>{keyboardKeys} phím (tùy chỉnh)</option>
            )}
          </select>
          <input
            type="number"
            min={25}
            max={88}
            value={keyboardKeys}
            onChange={(e) => {
              const n = Math.max(25, Math.min(88, Number(e.target.value) || 61))
              setKeyboardKeys(n)
              writeSetting('midiKeyboardKeys', n)
            }}
            className="w-16 rounded border border-line bg-white/6 px-1 py-0.5 text-xs text-cream"
            title="Nhập số phím nếu đàn của bạn không có trong danh sách"
          />
          <span className="text-[10px] text-dim/70">phím</span>
        </div>

        {/*
          Nốt rơi dựng ngay trên bàn phím và dùng chung dải nốt với nó, nên nốt
          rơi thẳng hàng với đúng phím mà nó sẽ đáp xuống.
        */}
        <PlaybackToolbar
          canPlay={!!transport}
          onPlay={() => transport?.playFrom(0)}
          onPause={() => transport?.pause()}
          onStop={() => transport?.stop()}
          onTone={transport?.onTone}
          toneLabel={transport?.toneLabel}
          bpm={bpm}
          onBpm={setBpm}
        />

        <FallingNotes
          steps={steps}
          index={session.currentIndex}
          live={looping}
          lowNote={fallRange.low}
          highNote={fallRange.high}
          onSymbol={setNowSymbol}
        />

        <OnScreenPiano
          lowNote={fallRange.low}
          highNote={fallRange.high}
          leftHandNotes={hitting.left}
          rightHandNotes={hitting.right}
        />

        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 rounded-b-lg border border-t-0 border-line bg-black/50 px-2 py-1.5 text-center">
          <span className="font-sans text-lg font-bold text-amber-key">{nowSymbol || '—'}</span>
          {nowGam ? <span className="font-sans text-xs text-cream/80">Gam: {nowGam}</span> : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[10px] text-dim">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-left-hand" />
            tay trái
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-right-hand" />
            tay phải
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-key" />
            đang bấm
          </span>
        </div>
      </div>
    </div>
  )
}
