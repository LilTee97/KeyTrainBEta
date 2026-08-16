import { useEffect, useMemo, useRef, useState } from 'react'
import {
  playChord,
  startAudio,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { FallingNotes } from './FallingNotes'
import { MidiConnect } from '../../shared/midi/MidiConnect'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import { midiToName } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { TimelineEvent } from '../style/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { PracticeHand } from './noteGatedPlaybackEngine'
import {
  advance,
  buildGatedSteps,
  currentStep,
  isStepMatched,
  missingNotes,
  progressOf,
  registerMiss,
  restart,
  startGatedSession,
} from './noteGatedPlaybackEngine'

export interface NoteGatedPracticeProps {
  timeline: readonly TimelineEvent[]
  voicings: readonly TwoHandVoicing[]
  beatsPerChord: number
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
}: NoteGatedPracticeProps) {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const audioReady = useAudioStore((state) => state.ready)

  useLiveSound()
  useComputerKeyboard(60)

  const [hand, setHand] = useState<PracticeHand>('right')
  const [ignoreOctave, setIgnoreOctave] = useState(false)
  const [active, setActive] = useState(false)

  const steps = useMemo(
    () => buildGatedSteps(timeline, voicings, { hand, beatsPerChord }),
    [timeline, voicings, hand, beatsPerChord],
  )

  /*
    Dải phím phải trùm hết nốt của bài: nốt rơi mà không có phím để đáp xuống
    thì người tập nhìn thấy nó biến mất giữa chừng. Nới ra tròn quãng tám
    (Đô tới Si) cho bàn phím trông đúng hình, và giữ tối thiểu 3 quãng tám để
    bài ít nốt không co lại thành một bàn phím tí hon.
  */
  const range = useMemo(() => {
    const notes = steps.flatMap((step) => step.notes)
    if (notes.length === 0) return { low: 48 as MidiNote, high: 84 as MidiNote }

    const low = Math.floor(Math.min(...notes) / 12) * 12
    const high = Math.ceil((Math.max(...notes) + 1) / 12) * 12 - 1

    return {
      low: Math.min(low, 60) as MidiNote,
      high: Math.max(high, 83) as MidiNote,
    }
  }, [steps])

  const [session, setSession] = useState(() => startGatedSession(steps))

  /** Dựng lại lượt khi đổi vòng hợp âm, điệu hoặc chế độ tay. */
  useEffect(() => {
    setSession(startGatedSession(steps))
  }, [steps])

  const step = currentStep(session)

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
              <span className="font-serif text-2xl font-semibold text-amber-key">
                {step.symbol}
              </span>
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
          Nốt rơi dựng ngay trên bàn phím và dùng chung dải nốt với nó, nên nốt
          rơi thẳng hàng với đúng phím mà nó sẽ đáp xuống.
        */}
        {active && (
          <FallingNotes
            steps={steps}
            index={session.currentIndex}
            lowNote={range.low}
            highNote={range.high}
          />
        )}

        <OnScreenPiano
          lowNote={range.low}
          highNote={range.high}
          leftHandNotes={active && step ? step.leftNotes : undefined}
          rightHandNotes={active && step ? step.rightNotes : undefined}
        />

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
