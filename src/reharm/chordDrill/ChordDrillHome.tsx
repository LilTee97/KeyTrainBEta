import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { MidiConnect } from '../../shared/midi/MidiConnect'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import { parseNoteName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import {
  classifyInput,
  drillVoicings,
  expandDegrees,
  isVoicingMatched,
  PALETTE_HINTS,
  parseNamed,
  drillScaleVoicing,
  type DrillPalette,
  type DrillSkill,
} from './chordDrillEngine'
import {
  buildArpFromScale,
  buildArpRun,
  nextNoteHit,
  SCALE_CATALOG,
  type ArpHand,
  type ArpKind,
  type ArpMode,
  type ScaleCatalogId,
} from './arpRun'

/**
 * Tab Học hợp âm — phản xạ hai tay, đàn trước rồi mới nghe.
 */
export function ChordDrillHome() {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  useLiveSound(true)
  useComputerKeyboard(60)

  const [raw, setRaw] = useState('C Am F G')
  const [tonicText, setTonicText] = useState('C')
  const [scale, setScale] = useState<'major' | 'minor'>('major')
  const [palette, setPalette] = useState<DrillPalette>('basic')
  const [skill, setSkill] = useState<DrillSkill>('chords')
  const [scaleId, setScaleId] = useState<ScaleCatalogId>('major')
  const [arpKind, setArpKind] = useState<ArpKind>('chord')
  const [arpHand, setArpHand] = useState<ArpHand>('both')
  const [arpFingers, setArpFingers] = useState<3 | 4>(3)
  const [arpMode, setArpMode] = useState<ArpMode>('loop')
  const [reps, setReps] = useState(2)
  const [repAt, setRepAt] = useState(0)
  const [leftAt, setLeftAt] = useState(0)
  const [rightAt, setRightAt] = useState(0)
  const prevHeld = useRef<number[]>([])
  const [revealAfter, setRevealAfter] = useState(3)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [started, setStarted] = useState(0)

  const kind = classifyInput(raw)
  const tonic = parseNoteName(tonicText)?.pitchClass ?? (0 as PitchClass)

  const chords = useMemo(() => {
    if (kind === 'degrees') return expandDegrees(raw, tonic, scale, palette)
    if (kind === 'named') return parseNamed(raw)
    return []
  }, [kind, raw, tonic, scale, palette])

  const pickedScale = SCALE_CATALOG.find((item) => item.id === scaleId) ?? SCALE_CATALOG[0]!

  const voicings = useMemo(() => {
    if (skill === 'scale') {
      const run = buildArpFromScale(tonic, pickedScale.pcs, pickedScale.label, 'both')
      return [{ left: run.left, right: run.right, symbol: `${tonicText} ${pickedScale.label}` }]
    }
    return drillVoicings(chords)
  }, [skill, chords, tonic, tonicText, pickedScale])

  const arpChord = chords[arpMode === 'single' ? Math.min(index, Math.max(0, chords.length - 1)) : index] ?? null
  const arp = useMemo(() => {
    if (skill !== 'arp') return null
    if (arpKind === 'scale') {
      return buildArpFromScale(tonic, pickedScale.pcs, `${tonicText} ${pickedScale.label}`, arpHand)
    }
    if (!arpChord) return null
    return buildArpRun(arpChord, arpKind, arpHand)
  }, [skill, arpChord, arpKind, arpHand, tonic, tonicText, pickedScale])
  const current = voicings[index] ?? null
  const chord = skill === 'scale' ? null : chords[index] ?? null
  const scored = useRef(false)

  useEffect(() => {
    setIndex(0)
    setShowAnswer(false)
    setStarted(Date.now())
    setLeftAt(0)
    setRightAt(0)
    setRepAt(0)
  }, [raw, tonic, scale, palette, skill, arpKind, arpHand, arpMode])

  useEffect(() => {
    setShowAnswer(false)
    setStarted(Date.now())
    scored.current = false
  }, [index])

  useEffect(() => {
    if (revealAfter <= 0) {
      setShowAnswer(true)
      return
    }
    const id = window.setTimeout(() => setShowAnswer(true), revealAfter * 1000)
    return () => window.clearTimeout(id)
  }, [revealAfter, started, index])

  useEffect(() => {
    if (skill === 'arp') return
    if (!current || scored.current) return
    if (!isVoicingMatched(heldNotes, current)) return
    scored.current = true
    setCorrect((n) => n + 1)
    setIndex((i) => (i + 1) % Math.max(1, voicings.length))
  }, [heldNotes, current, voicings.length, skill])

  useEffect(() => {
    if (skill !== 'arp' || !arp) {
      prevHeld.current = [...heldNotes]
      return
    }
    const prev = prevHeld.current
    let nextLeft = leftAt
    let nextRight = rightAt
    const expectL = arp.left[leftAt]
    const expectR = arp.right[rightAt]
    if (expectL !== undefined && nextNoteHit(heldNotes, prev, expectL)) nextLeft += 1
    if (expectR !== undefined && nextNoteHit(heldNotes, prev, expectR)) nextRight += 1
    prevHeld.current = [...heldNotes]
    if (nextLeft === leftAt && nextRight === rightAt) return
    setLeftAt(nextLeft)
    setRightAt(nextRight)
    const leftDone = arp.left.length === 0 || nextLeft >= arp.left.length
    const rightDone = arp.right.length === 0 || nextRight >= arp.right.length
    if (!leftDone || !rightDone) return
    setCorrect((n) => n + 1)
    setLeftAt(0)
    setRightAt(0)
    const finished = repAt + 1
    if (finished >= reps) {
      setRepAt(0)
      if (arpMode === 'loop' && chords.length > 0) {
        setIndex((i) => (i + 1) % chords.length)
      }
    } else {
      setRepAt(finished)
    }
  }, [heldNotes, skill, arp, leftAt, rightAt, repAt, reps, arpMode, chords.length])

  const skip = () => {
    setWrong((n) => n + 1)
    setIndex((i) => (i + 1) % Math.max(1, voicings.length))
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Học hợp âm</h2>
        <p className="text-sm leading-relaxed text-dim">
          Hợp âm, gam, hoặc rải. Đàn đủ hai tay đúng nốt mới sang — tiếng khi em
          bấm, không phát đáp án trước.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['chords', 'Hợp âm'],
            ['scale', 'Gam'],
            ['arp', 'Rải'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSkill(id)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              skill === id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(skill === 'scale' || (skill === 'arp' && arpKind === 'scale')) && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-dim">Tone</span>
            {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => setTonicText(note)}
                className={`rounded px-2 py-1 font-mono text-xs ${
                  tonicText === note ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {SCALE_CATALOG.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScaleId(item.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  scaleId === item.id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Vòng
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={2}
          className="rounded-lg bg-white/7 px-3 py-2 font-mono text-sm"
        />
      </label>

      {skill === 'arp' && (
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex gap-1">
            {(
              [
                ['chord', 'Nốt hợp âm'],
                ['scale', 'Theo gam'],
                ['chromatic', 'Chromatic'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setArpKind(id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  arpKind === id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(
              [
                ['left', 'Trái'],
                ['right', 'Phải'],
                ['both', 'Hai tay'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setArpHand(id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  arpHand === id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs text-dim">
            Ngón
            <select
              value={arpFingers}
              onChange={(event) => setArpFingers(Number(event.target.value) as 3 | 4)}
              className="rounded bg-white/7 px-2 py-1"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <div className="flex gap-1">
            {(
              [
                ['loop', 'Theo vòng'],
                ['single', 'Một hợp âm'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setArpMode(id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  arpMode === id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {arpMode === 'single' && chords.length > 0 && (
            <label className="flex items-center gap-1 text-xs text-dim">
              Hợp âm
              <select
                value={index}
                onChange={(event) => setIndex(Number(event.target.value))}
                className="rounded bg-white/7 px-2 py-1 font-mono"
              >
                {chords.map((item, at) => (
                  <option key={`${item.symbol}-${at}`} value={at}>
                    {item.symbol}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-1 text-xs text-dim">
            Số lần / hợp âm
            <input
              type="number"
              min={1}
              max={20}
              value={reps}
              onChange={(event) => setReps(Math.max(1, Number(event.target.value) || 1))}
              className="w-14 rounded bg-white/7 px-2 py-1"
            />
          </label>
        </div>
      )}

      {kind === 'degrees' && skill === 'chords' && (
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            Tone chủ
            <input
              value={tonicText}
              onChange={(event) => setTonicText(event.target.value)}
              className="w-16 rounded-lg bg-white/7 px-2 py-1 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            Giọng
            <select
              value={scale}
              onChange={(event) => setScale(event.target.value as 'major' | 'minor')}
              className="rounded-lg bg-white/7 px-2 py-1"
            >
              <option value="major">Trưởng</option>
              <option value="minor">Thứ</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {PALETTE_HINTS.map((hint) => (
              <button
                key={hint.id}
                type="button"
                onClick={() => setPalette(hint.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  palette === hint.id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim'
                }`}
              >
                {hint.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-teal-key">Đúng {correct}</span>
        <span className="text-rose-400">Sai {wrong}</span>
        <label className="ml-auto flex items-center gap-2 text-dim">
          Hiện đáp án sau
          <input
            type="number"
            min={0}
            max={15}
            value={revealAfter}
            onChange={(event) => setRevealAfter(Number(event.target.value))}
            className="w-14 rounded bg-white/7 px-2 py-1"
          />
          s
        </label>
        <button type="button" onClick={skip} className="rounded-lg bg-white/10 px-3 py-1">
          Bỏ qua
        </button>
      </div>

      <MidiConnect />

      {skill === 'arp' && arp ? (
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="font-mono text-2xl text-amber-key">
            {arpKind === 'scale' ? arp.scaleName : (arpChord?.symbol ?? arp.scaleName)}
          </p>
          {arpKind !== 'scale' && (
            <p className="text-sm text-amber-key">{arp.scaleName}</p>
          )}
          <p className="text-xs text-dim">
            Lần {repAt + 1}/{reps} · ngón {arpFingers} ·{' '}
            {arpMode === 'loop' ? `${index + 1}/${chords.length}` : 'một hợp âm'}
          </p>
        </div>
      ) : current ? (
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="font-mono text-2xl text-amber-key">
            {skill === 'scale' ? current.symbol : (chord?.symbol ?? current.symbol)}
          </p>
          <p className="text-xs text-dim">
            {index + 1}/{chords.length} · tay trái {current.left.length} · tay phải{' '}
            {current.right.length}
          </p>
        </div>
      ) : (
        <p className="text-sm text-dim">Chưa đọc được vòng. Thử C Am F G hoặc I vi IV V.</p>
      )}

      <OnScreenPiano
        lowNote={36}
        highNote={84}
        leftHandNotes={
          skill === 'arp'
            ? arp && showAnswer
              ? arp.left.slice(leftAt, leftAt + 1)
              : []
            : showAnswer
              ? current?.left
              : []
        }
        rightHandNotes={
          skill === 'arp'
            ? arp && showAnswer
              ? arp.right.slice(rightAt, rightAt + 1)
              : []
            : showAnswer
              ? current?.right
              : []
        }
        chordTones={
          skill === 'arp' && arp
            ? [...(arp.left.slice(leftAt, leftAt + 1) as number[]), ...(arp.right.slice(rightAt, rightAt + 1) as number[])].map(
                (n) => (n % 12) as PitchClass,
              )
            : current
              ? [...current.left, ...current.right].map((n) => (n % 12) as PitchClass)
              : []
        }
      />
    </section>
  )
}
