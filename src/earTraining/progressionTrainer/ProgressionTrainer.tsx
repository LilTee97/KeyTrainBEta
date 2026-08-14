import { useCallback, useEffect, useRef, useState } from 'react'
import {
  playChord,
  playChordSequence,
  startAudio,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import {
  startMetronome,
  stopMetronome,
  setBpm,
  useMetronomeStore,
} from '../../shared/audio/metronome'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import type { KeyFlow } from '../../shared/musicTheory/progressionGenerator'
import {
  KEY_FLOW_OPTIONS,
  PROGRESSION_TEMPLATES,
  nextTonic,
} from '../../shared/musicTheory/progressionGenerator'
import { VOICING_OPTIONS } from '../../shared/musicTheory/voicing'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import { usePersistentState } from '../../shared/persistence/usePersistentState'
import { checkAnswer } from '../shared/chordTask'
import { recordProgressionResult } from '../srs/reviewQueue'
import { recordAnswer } from '../stats/statsStore'
import type { ProgressionSession } from './progressionEngine'
import { createSession, secondsPerChord } from './progressionEngine'

export function ProgressionTrainer() {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const audioReady = useAudioStore((state) => state.ready)
  const bpm = useMetronomeStore((state) => state.bpm)
  const beatsPerMeasure = useMetronomeStore((state) => state.beatsPerMeasure)
  const metronomeRunning = useMetronomeStore((state) => state.running)

  useLiveSound()
  useComputerKeyboard(60)

  const [templateId, setTemplateId] = usePersistentState(
    'progressionTemplateId',
  )
  const [voicingSetting, setVoicing] = usePersistentState('progressionVoicing')
  const [keyFlowSetting, setKeyFlow] = usePersistentState('progressionKeyFlow')
  const [useSevenths, setUseSevenths] = usePersistentState(
    'progressionUseSevenths',
  )

  const voicing = voicingSetting as VoicingType
  const keyFlow = keyFlowSetting as KeyFlow

  const [tonic, setTonic] = useState(0)
  const [session, setSession] = useState<ProgressionSession | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [rounds, setRounds] = useState(0)

  const template =
    PROGRESSION_TEMPLATES.find((item) => item.id === templateId) ??
    PROGRESSION_TEMPLATES[0]

  const chordSeconds = secondsPerChord(bpm, beatsPerMeasure)

  /** Chỉ chấm sau khi người học nhả hết phím của hợp âm trước. */
  const armedRef = useRef(true)
  /** Thời điểm bắt đầu hợp âm hiện tại, để đo thời gian trả lời. */
  const stepStartedAtRef = useRef(0)

  const playSession = useCallback(
    (current: ProgressionSession) => {
      playChordSequence(
        current.steps.map((step) => step.notes),
        chordSeconds,
      )
    },
    [chordSeconds],
  )

  const startRound = useCallback(
    (atTonic: number) => {
      const created = createSession(template, atTonic, {
        useSevenths,
        voicing,
      })

      armedRef.current = false
      stepStartedAtRef.current = performance.now()
      setSession(created)
      setStepIndex(0)
      setFinished(false)
      playSession(created)
    },
    [template, useSevenths, voicing, playSession],
  )

  /** Bắt đầu lượt đầu tiên khi âm thanh sẵn sàng. */
  useEffect(() => {
    if (audioReady && !session) startRound(tonic)
  }, [audioReady, session, startRound, tonic])

  /** Dựng lại lượt khi đổi cài đặt. */
  useEffect(() => {
    if (audioReady) startRound(tonic)
    // Chỉ chạy lại khi cài đặt đổi, không chạy lại khi lượt đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, voicing, useSevenths])

  /** Chấm từng hợp âm trong vòng. */
  useEffect(() => {
    if (!session || finished) return

    if (heldNotes.length === 0) {
      armedRef.current = true
      return
    }
    if (!armedRef.current) return

    const step = session.steps[stepIndex]
    if (!step) return

    if (checkAnswer(heldNotes, step).correct) {
      armedRef.current = false

      void recordAnswer({
        mode: 'practice',
        itemKind: 'progression',
        category: session.template.name,
        correct: true,
        responseMs: Math.round(performance.now() - stepStartedAtRef.current),
      })
      stepStartedAtRef.current = performance.now()

      if (stepIndex + 1 >= session.steps.length) {
        setFinished(true)
        setRounds((count) => count + 1)
        // Cả vòng chơi trọn mới tính là một lần ôn cho vòng hợp âm này.
        void recordProgressionResult(
          session.template.id,
          session.template.name,
          true,
        )
      } else {
        setStepIndex(stepIndex + 1)
      }
    }
  }, [heldNotes, session, stepIndex, finished])

  const goToNextRound = () => {
    const next = nextTonic(tonic, keyFlow)
    setTonic(next)
    startRound(next)
  }

  const toggleClick = () => {
    if (metronomeRunning) stopMetronome()
    else void startMetronome()
  }

  if (!audioReady) {
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Luyện vòng hợp âm</h2>
        <p className="text-sm text-dim">
          KeyTrain phát một vòng hợp âm, việc của bạn là bấm lại từng hợp âm
          theo đúng thứ tự.
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

  const currentStep = session?.steps[stepIndex]

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Luyện vòng hợp âm</h2>
        <span className="font-mono text-xs text-dim">
          {rounds} vòng xong · giọng {session?.keyLabel}
        </span>
      </div>

      {/* Chuỗi hợp âm của vòng */}
      <div className="rounded-xl border border-line bg-black/25 p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {session?.steps.map((step, index) => {
            const done = finished || index < stepIndex
            const isCurrent = !finished && index === stepIndex

            return (
              <div
                key={`${step.symbol}-${index}`}
                className={`min-w-[84px] rounded-lg border px-3 py-2 text-center ${
                  isCurrent
                    ? 'border-amber-key bg-amber-key/15'
                    : done
                      ? 'border-teal-key/50 bg-teal-key/10'
                      : 'border-line bg-white/4'
                }`}
              >
                <span
                  className={`block font-serif text-lg ${
                    isCurrent
                      ? 'text-amber-key'
                      : done
                        ? 'text-teal-key'
                        : 'text-dim'
                  }`}
                >
                  {step.symbol}
                </span>
                <span className="block font-mono text-[10px] text-dim">
                  {step.roman}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => session && playSession(session)}
            className="rounded-lg border border-line bg-white/6 px-4 py-2 text-sm text-cream hover:bg-white/12"
          >
            ♪ Nghe cả vòng
          </button>

          {currentStep && !finished && (
            <button
              type="button"
              onClick={() => playChord(currentStep.notes)}
              className="rounded-lg border border-line bg-white/6 px-3 py-2 text-xs text-dim hover:bg-white/12"
            >
              Nghe riêng hợp âm này
            </button>
          )}

          {finished ? (
            <button
              type="button"
              onClick={goToNextRound}
              className="ml-auto rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
            >
              Vòng tiếp →
            </button>
          ) : (
            <span className="ml-auto font-mono text-xs text-dim">
              hợp âm {stepIndex + 1}/{session?.steps.length}
            </span>
          )}
        </div>

        {template.note && (
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-dim">
            {template.note}
          </p>
        )}
      </div>

      <OnScreenPiano
        highlightNotes={finished ? undefined : currentStep?.notes}
        chordTones={currentStep?.chordTones}
      />

      {/* Cài đặt */}
      <div className="flex flex-col gap-4 border-t border-line pt-5">
        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Vòng hợp âm
          </h3>
          <div className="flex flex-wrap gap-2">
            {PROGRESSION_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplateId(item.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  templateId === item.id
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Đổi giọng mỗi vòng
          </h3>
          <div className="flex flex-wrap gap-2">
            {KEY_FLOW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setKeyFlow(option.id)}
                title={option.description}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  keyFlow === option.id
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">
            {KEY_FLOW_OPTIONS.find((option) => option.id === keyFlow)
              ?.description}
          </p>
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
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-xs text-dim">
            <input
              type="checkbox"
              checked={useSevenths}
              onChange={(event) => setUseSevenths(event.target.checked)}
              className="accent-amber-key"
            />
            Dùng hợp âm bảy
          </label>

          <button
            type="button"
            onClick={toggleClick}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              metronomeRunning
                ? 'border-amber-key bg-amber-key/15 text-amber-key'
                : 'border-line bg-white/4 text-dim hover:bg-white/8'
            }`}
          >
            {metronomeRunning ? 'Tắt tiếng gõ nhịp' : 'Bật tiếng gõ nhịp'}
          </button>

          <label className="flex items-center gap-3 text-xs text-dim">
            Nhịp độ
            <input
              type="range"
              min={40}
              max={180}
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
              className="accent-amber-key"
            />
            <span className="w-16 font-mono text-cream">{bpm} BPM</span>
          </label>
        </div>

        <p className="text-xs leading-relaxed text-dim">
          Mỗi hợp âm vang trọn một ô nhịp, nên nhịp độ quyết định vòng chạy
          nhanh hay chậm.
        </p>
      </div>
    </section>
  )
}
