import { useCallback, useEffect, useRef, useState } from 'react'
import {
  playChord,
  startAudio,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { usePersistentState } from '../../shared/persistence/usePersistentState'
import { QUALITY_GROUPS, groupLabelFor, qualityIdsForGroups } from '../shared/qualityGroups'
import { recordChordResult } from '../srs/reviewQueue'
import { recordAnswer } from '../stats/statsStore'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import { VOICING_OPTIONS } from '../../shared/musicTheory/voicing'
import type { DrillQuestion, Strictness } from './drillEngine'
import { checkAnswer, createQuestion } from './drillEngine'

type Phase = 'answering' | 'correct'

export function ChordRecognitionDrill() {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const audioReady = useAudioStore((state) => state.ready)

  useLiveSound()
  useComputerKeyboard(60)

  const [selectedGroups, setSelectedGroups] =
    usePersistentState('drillGroups')
  const [strictnessSetting, setStrictness] =
    usePersistentState('drillStrictness')
  const [voicingSetting, setVoicing] = usePersistentState('drillVoicing')
  /** Số giây trước khi tự lộ đáp án trên bàn phím. 0 nghĩa là không tự lộ. */
  const [revealAfter, setRevealAfter] = usePersistentState('drillRevealAfter')

  const strictness = strictnessSetting as Strictness
  const voicing = voicingSetting as VoicingType

  const [question, setQuestion] = useState<DrillQuestion | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const qualityKey = qualityIdsForGroups(selectedGroups).join(',')

  /** Thời điểm ra câu hỏi, để đo thời gian trả lời. */
  const askedAtRef = useRef(0)

  /**
   * Câu hiện tại, đọc qua ref để `nextQuestion` không cần phụ thuộc vào nó —
   * nếu đưa vào deps thì hàm bị tạo lại sau mỗi câu, còn nếu bỏ qua mà đọc
   * trực tiếp thì lại đọc phải giá trị cũ.
   */
  const questionRef = useRef<DrillQuestion | null>(null)
  useEffect(() => {
    questionRef.current = question
  }, [question])

  /**
   * Chỉ bắt đầu chấm sau khi người học nhả hết phím của câu trước.
   * Không có chốt này thì bấm "Câu tiếp" lúc còn đang giữ hợp âm cũ có thể
   * làm câu mới tự tính là đúng.
   */
  const armedRef = useRef(true)

  const nextQuestion = useCallback(() => {
    const created = createQuestion(qualityKey ? qualityKey.split(',') : [], {
      avoid: questionRef.current,
      voicing,
    })
    questionRef.current = created
    armedRef.current = false
    askedAtRef.current = performance.now()

    setQuestion(created)
    setPhase('answering')
    setRevealed(false)
    if (created) playChord(created.notes)
  }, [qualityKey, voicing])

  /** Ra câu đầu tiên ngay khi âm thanh sẵn sàng. */
  useEffect(() => {
    if (audioReady && !question) nextQuestion()
  }, [audioReady, question, nextQuestion])

  /** Hẹn giờ tự lộ đáp án cho câu đang hỏi. */
  useEffect(() => {
    if (!question || phase !== 'answering' || revealAfter === 0) return

    const timer = setTimeout(() => setRevealed(true), revealAfter * 1000)
    return () => clearTimeout(timer)
  }, [question, phase, revealAfter])

  /** Chấm bài mỗi khi tập nốt đang bấm thay đổi. */
  useEffect(() => {
    if (!question || phase !== 'answering') return

    // Nhả hết phím thì mở chốt, từ đó trở đi mới nhận câu trả lời.
    if (heldNotes.length === 0) {
      armedRef.current = true
      return
    }
    if (!armedRef.current) return

    if (checkAnswer(heldNotes, question, strictness).correct) {
      setPhase('correct')
      setScore((current) => ({
        correct: current.correct + 1,
        total: current.total + 1,
      }))

      const category = groupLabelFor(question.quality.id)
      void recordAnswer({
        mode: 'practice',
        itemKind: 'chord',
        category,
        correct: true,
        responseMs: Math.round(performance.now() - askedAtRef.current),
      })
      // Luyện bình thường cũng nuôi hàng đợi ôn tập, người học không phải
      // khai báo gì thêm.
      void recordChordResult(question.quality.id, category, true)
    }
  }, [heldNotes, question, phase, strictness])

  const check = question
    ? checkAnswer(heldNotes, question, strictness)
    : null

  const toggleGroup = (label: string) => {
    setSelectedGroups(
      selectedGroups.includes(label)
        ? selectedGroups.filter((item) => item !== label)
        : [...selectedGroups, label],
    )
  }

  const giveUp = () => {
    setRevealed(true)
    setScore((current) => ({ ...current, total: current.total + 1 }))
    setPhase('correct')

    if (question) {
      const category = groupLabelFor(question.quality.id)
      void recordAnswer({
        mode: 'practice',
        itemKind: 'chord',
        category,
        correct: false,
        responseMs: Math.round(performance.now() - askedAtRef.current),
      })
      void recordChordResult(question.quality.id, category, false)
    }
  }

  if (!audioReady) {
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Nhận diện hợp âm</h2>
        <p className="text-sm text-dim">
          Bài tập sẽ phát một hợp âm, việc của bạn là bấm lại đúng hợp âm đó.
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

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Nhận diện hợp âm</h2>
        <span className="font-mono text-xs text-dim">
          Đúng {score.correct}/{score.total}
          {score.total > 0 && (
            <> · {Math.round((score.correct / score.total) * 100)}%</>
          )}
        </span>
      </div>

      {/* Khu vực câu hỏi */}
      <div className="rounded-xl border border-line bg-black/25 p-5">
        {!question ? (
          <p className="text-sm text-dim">
            Chọn ít nhất một nhóm hợp âm ở dưới để bắt đầu.
          </p>
        ) : phase === 'correct' ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-serif text-3xl font-semibold text-teal-key">
              {question.symbol}
            </span>
            <span className="text-sm text-dim">{question.quality.label}</span>
            <button
              type="button"
              onClick={nextQuestion}
              className="ml-auto rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
            >
              Câu tiếp →
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playChord(question.notes)}
              className="rounded-lg border border-line bg-white/6 px-4 py-2 text-sm text-cream hover:bg-white/12"
            >
              ♪ Nghe lại
            </button>

            <span className="text-sm text-dim">
              {revealed ? (
                <>
                  Đáp án:{' '}
                  <span className="font-serif text-lg text-amber-key">
                    {question.symbol}
                  </span>
                </>
              ) : (
                'Bấm lại hợp âm vừa nghe.'
              )}
            </span>

            {!revealed && (
              <button
                type="button"
                onClick={giveUp}
                className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
              >
                Chịu, cho xem đáp án
              </button>
            )}
          </div>
        )}

        {/* Gợi ý tiến độ khi đang trả lời */}
        {question && phase === 'answering' && check && heldNotes.length > 0 && (
          <p className="mt-3 font-mono text-[11px] text-dim">
            {check.wrongInversion ? (
              <span className="text-amber-key">
                Đúng nốt rồi, nhưng cần nốt {pitchClassName(question.root)} ở
                dưới cùng.
              </span>
            ) : (
              <>
                {check.missing.length > 0 && (
                  <>còn thiếu {check.missing.length} nốt </>
                )}
                {check.extra.length > 0 && (
                  <span className="text-rose-300">
                    · {check.extra.length} nốt lạ
                  </span>
                )}
              </>
            )}
          </p>
        )}
      </div>

      <OnScreenPiano
        highlightNotes={
          revealed || phase === 'correct' ? question?.notes : undefined
        }
        chordTones={question?.chordTones}
      />

      {/* Cài đặt */}
      <div className="flex flex-col gap-4 border-t border-line pt-5">
        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Luyện những nhóm nào
          </h3>
          <div className="flex flex-wrap gap-2">
            {QUALITY_GROUPS.map((group) => (
              <button
                key={group.label}
                type="button"
                onClick={() => toggleGroup(group.label)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  selectedGroups.includes(group.label)
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Thế bấm
          </h3>
          <div className="flex flex-wrap gap-2">
            {VOICING_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVoicing(option.id)}
                title={option.description}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  voicing === option.id
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">
            {VOICING_OPTIONS.find((option) => option.id === voicing)
              ?.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
              Mức chặt
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStrictness('pitchClass')}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  strictness === 'pitchClass'
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim'
                }`}
              >
                Thế nào cũng được
              </button>
              <button
                type="button"
                onClick={() => setStrictness('rootPosition')}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  strictness === 'rootPosition'
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim'
                }`}
              >
                Bắt đúng thế nguyên vị
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
              Tự lộ đáp án sau
            </h3>
            <label className="flex items-center gap-3 text-xs text-dim">
              <input
                type="range"
                min={0}
                max={30}
                step={5}
                value={revealAfter}
                onChange={(event) => setRevealAfter(Number(event.target.value))}
                className="accent-amber-key"
              />
              <span className="w-16 font-mono text-cream">
                {revealAfter === 0 ? 'không' : `${revealAfter}s`}
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
