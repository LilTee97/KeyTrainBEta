import { useCallback, useEffect, useRef, useState } from 'react'
import {
  playChord,
  playChordSequence,
  startAudio,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import { getProgressionTemplate } from '../../shared/musicTheory/progressionGenerator'
import type { ReviewItem } from '../../shared/persistence/db'
import { createQuestion } from '../chordRecognition/drillEngine'
import { createSession } from '../progressionTrainer/progressionEngine'
import type { ProgressionSession } from '../progressionTrainer/progressionEngine'
import { checkAnswer } from '../shared/chordTask'
import type { ChordTask } from '../shared/chordTask'
import { recordAnswer } from '../stats/statsStore'
import {
  buildReviewSession,
  qualityIdFromItemId,
  recordReviewResult,
  templateIdFromItemId,
} from './reviewQueue'
import type { SessionState } from './reviewSession'
import {
  answerCurrent,
  currentItem,
  isFinished,
  progressOf,
  sessionAccuracy,
  startSession,
} from './reviewSession'
import { BOX_LABELS } from './srsEngine'

/** Đề bài đang hỏi: một hợp âm rời, hoặc cả một vòng hợp âm. */
type Challenge =
  | { kind: 'chord'; task: ChordTask }
  | { kind: 'progression'; session: ProgressionSession }

/** Dựng đề bài cho một mục ôn tập. */
function buildChallenge(item: ReviewItem): Challenge | null {
  const qualityId = qualityIdFromItemId(item.id)
  if (qualityId) {
    const task = createQuestion([qualityId])
    return task ? { kind: 'chord', task } : null
  }

  const templateId = templateIdFromItemId(item.id)
  if (templateId) {
    const template = getProgressionTemplate(templateId)
    if (!template) return null

    // Mỗi lần ôn đổi sang một giọng khác, để nhớ vòng chứ không nhớ thế tay.
    const tonic = Math.floor(Math.random() * 12)
    return { kind: 'progression', session: createSession(template, tonic) }
  }

  return null
}

export function ReviewSessionPage() {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const audioReady = useAudioStore((state) => state.ready)

  useLiveSound()
  useComputerKeyboard(60)

  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<SessionState | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const armedRef = useRef(true)
  const askedAtRef = useRef(0)

  const loadSession = useCallback(async () => {
    setLoading(true)
    try {
      setState(startSession(await buildReviewSession()))
    } catch {
      setState(startSession([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const item = state ? currentItem(state) : null

  /** Dựng và phát đề cho mục đang hỏi. */
  useEffect(() => {
    if (!item || !audioReady) return

    const built = buildChallenge(item)
    setChallenge(built)
    setStepIndex(0)
    setRevealed(false)
    armedRef.current = false
    askedAtRef.current = performance.now()

    if (built?.kind === 'chord') playChord(built.task.notes)
    else if (built) {
      playChordSequence(
        built.session.steps.map((step) => step.notes),
        1.2,
      )
    }
  }, [item, audioReady])

  /** Ghi kết quả rồi chuyển sang mục kế tiếp. */
  const finishItem = useCallback(
    (correct: boolean) => {
      if (!state || !item) return

      void recordReviewResult(item.id, item.kind, item.category, correct)
      void recordAnswer({
        mode: 'review',
        itemKind: item.kind,
        category: item.category,
        correct,
        responseMs: Math.round(performance.now() - askedAtRef.current),
      })

      setState(answerCurrent(state, correct))
    },
    [state, item],
  )

  /** Chấm bài theo các nốt đang bấm. */
  useEffect(() => {
    if (!challenge || !state || revealed) return

    if (heldNotes.length === 0) {
      armedRef.current = true
      return
    }
    if (!armedRef.current) return

    if (challenge.kind === 'chord') {
      if (checkAnswer(heldNotes, challenge.task).correct) {
        armedRef.current = false
        finishItem(true)
      }
      return
    }

    const step = challenge.session.steps[stepIndex]
    if (!step) return

    if (checkAnswer(heldNotes, step).correct) {
      armedRef.current = false

      if (stepIndex + 1 >= challenge.session.steps.length) finishItem(true)
      else setStepIndex(stepIndex + 1)
    }
  }, [heldNotes, challenge, state, stepIndex, revealed, finishItem])

  if (!audioReady) {
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Ôn tập</h2>
        <p className="text-sm leading-relaxed text-dim">
          KeyTrain đưa lại những hợp âm và vòng hợp âm bạn đã luyện, đúng lúc
          sắp quên. Mục hay sai sẽ quay lại dày hơn.
        </p>
        <button
          type="button"
          onClick={() => void startAudio()}
          className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
        >
          Bắt đầu
        </button>
      </section>
    )
  }

  if (loading || !state) {
    return <p className="text-sm text-dim">Đang tải hàng đợi ôn tập…</p>
  }

  /* Không có gì đến hạn */
  if (state.totalItems === 0) {
    return (
      <section className="flex flex-col items-start gap-4">
        <h2 className="text-lg font-semibold">Ôn tập</h2>
        <p className="text-sm leading-relaxed text-dim">
          Chưa có gì đến hạn ôn. Cứ luyện ở tab Luyện tai hoặc Vòng hợp âm —
          những gì bạn luyện sẽ tự vào hàng đợi và quay lại đúng lúc sắp quên.
        </p>
        <button
          type="button"
          onClick={() => void loadSession()}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
        >
          Kiểm tra lại
        </button>
      </section>
    )
  }

  /* Đã ôn xong */
  if (isFinished(state)) {
    const accuracy = Math.round(sessionAccuracy(state) * 100)

    return (
      <section className="flex flex-col items-start gap-4">
        <h2 className="text-lg font-semibold">Xong buổi ôn</h2>

        <div className="rounded-xl border border-line bg-black/25 p-5">
          <p className="mb-2">
            <span className="font-serif text-3xl font-semibold text-teal-key">
              {state.totalItems}
            </span>
            <span className="ml-2 text-sm text-dim">mục đã ôn</span>
          </p>
          <p className="font-mono text-xs text-dim">
            {state.correct}/{state.answered} lần đúng · {accuracy}%
          </p>

          {state.missed.length > 0 && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-dim">
              Còn vấp ở {state.missed.length} mục — chúng sẽ quay lại sớm.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void loadSession()}
          className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
        >
          Ôn tiếp
        </button>
      </section>
    )
  }

  const progress = progressOf(state)
  const currentStep =
    challenge?.kind === 'progression'
      ? challenge.session.steps[stepIndex]
      : null

  const highlight =
    challenge?.kind === 'chord'
      ? challenge.task.notes
      : currentStep?.notes

  const chordTones =
    challenge?.kind === 'chord'
      ? challenge.task.chordTones
      : currentStep?.chordTones

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Ôn tập</h2>
        <span className="font-mono text-xs text-dim">
          {progress.done}/{progress.total} mục
        </span>
      </div>

      {/* Thanh tiến độ */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-teal-key transition-all"
          style={{ width: `${progress.ratio * 100}%` }}
        />
      </div>

      <div className="rounded-xl border border-line bg-black/25 p-5">
        {item && (
          <p className="mb-3 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
            {item.category} · {BOX_LABELS[item.boxLevel]}
          </p>
        )}

        {!challenge ? (
          <p className="text-sm text-dim">Không dựng được đề cho mục này.</p>
        ) : challenge.kind === 'chord' ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playChord(challenge.task.notes)}
              className="rounded-lg border border-line bg-white/6 px-4 py-2 text-sm text-cream hover:bg-white/12"
            >
              ♪ Nghe lại
            </button>
            <span className="text-sm text-dim">
              {revealed ? (
                <>
                  Đáp án:{' '}
                  <span className="font-serif text-lg text-amber-key">
                    {challenge.task.symbol}
                  </span>
                </>
              ) : (
                'Bấm lại hợp âm vừa nghe.'
              )}
            </span>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {challenge.session.steps.map((step, index) => (
                <span
                  key={`${step.symbol}-${index}`}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                    index < stepIndex
                      ? 'border-teal-key/50 bg-teal-key/10 text-teal-key'
                      : index === stepIndex
                        ? 'border-amber-key bg-amber-key/15 text-amber-key'
                        : 'border-line text-dim'
                  }`}
                >
                  {revealed || index < stepIndex ? step.symbol : step.roman}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                playChordSequence(
                  challenge.session.steps.map((step) => step.notes),
                  1.2,
                )
              }
              className="rounded-lg border border-line bg-white/6 px-4 py-2 text-sm text-cream hover:bg-white/12"
            >
              ♪ Nghe lại cả vòng
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
          {revealed ? (
            <button
              type="button"
              onClick={() => finishItem(false)}
              className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
            >
              Mục tiếp →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
            >
              Chịu, cho xem đáp án
            </button>
          )}
        </div>
      </div>

      <OnScreenPiano
        highlightNotes={revealed ? highlight : undefined}
        chordTones={chordTones}
      />
    </section>
  )
}
