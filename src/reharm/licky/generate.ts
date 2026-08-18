import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import {
  inKeyMaterial,
  keepInKey,
  ladderOf,
  nearestStep,
} from '../fillSoloGenerator/soloVocabulary'
import type { ParsedChord } from '../types'
import library from './phrases.json'
import type { LickPhrase, PlaceOptions, PlacedNote } from './types'

const ANCHOR = 72
const LOW = 55
const HIGH = 93
const HAND_SPLIT = 60
const FILL_GRID = 0.25
const RUN_GRID = 0.25

const phrases = (library as { phrases: LickPhrase[] }).phrases

export function lickyPhrases(): readonly LickPhrase[] {
  return phrases
}

function scramble(take: number): number {
  return Math.imul(take + 1, 2654435761) >>> 0
}

function pick(kind: PlaceOptions['kind'], take: number): LickPhrase {
  const pool =
    kind === 'run'
      ? phrases.filter((phrase) => phrase.notes.length >= 6)
      : phrases
  return pool[scramble(take) % pool.length] ?? phrases[0]!
}

function gridOf(kind: PlaceOptions['kind']): number {
  return kind === 'run' ? RUN_GRID : FILL_GRID
}

function noteCount(kind: PlaceOptions['kind'], beats: number): number {
  const packed = Math.max(1, Math.round(beats / gridOf(kind)))
  return kind === 'fill'
    ? Math.max(3, Math.min(6, packed))
    : Math.max(4, Math.min(8, packed))
}

/** Lấy hình interval, cắt/nối cho đủ số nốt. */
function shape(phrase: LickPhrase, count: number, take: number): number[] {
  const src = phrase.notes
  if (src.length === 0) return Array.from({ length: count }, () => 0)

  const origin = scramble(take) % src.length

  const slice = Array.from(
    { length: Math.min(count, src.length) },
    (_, index) => src[(origin + index) % src.length]!,
  )
  const zero = slice[0]!.interval
  const intervals = slice.map((note) => note.interval - zero)

  while (intervals.length < count) {
    const last = intervals[intervals.length - 1] ?? 0
    const prev = intervals[intervals.length - 2] ?? last - 2
    const delta = last - prev || 2
    intervals.push(last + delta)
  }
  return intervals
}

function stepLadder(
  ladder: readonly MidiNote[],
  from: MidiNote,
  delta: number,
): MidiNote {
  if (ladder.length === 0) return from
  if (delta === 0) {
    const stay = ladder[nearestStep(ladder, from)]
    return stay ?? from
  }

  const want = from + delta
  const dir = Math.sign(delta)
  let best = from
  let bestDist = 99
  for (const note of ladder) {
    if (dir > 0 && note < from) continue
    if (dir < 0 && note > from) continue
    const dist = Math.abs(note - want)
    if (dist < bestDist) {
      best = note
      bestDist = dist
    }
  }

  if (best === from) {
    const index = nearestStep(ladder, from)
    const next = ladder[index + dir]
    if (next !== undefined) return next
  }
  return best
}

function paint(
  intervals: readonly number[],
  ladder: readonly MidiNote[],
  start: MidiNote,
): MidiNote[] {
  if (ladder.length === 0) return []
  const line: MidiNote[] = [ladder[nearestStep(ladder, start)] ?? start]
  for (let index = 1; index < intervals.length; index += 1) {
    const delta = intervals[index]! - intervals[index - 1]!
    line.push(stepLadder(ladder, line[index - 1]!, delta))
  }
  return line
}

function land(
  chord: ParsedChord,
  next: ParsedChord | undefined,
  near: MidiNote,
  key?: PlaceOptions['key'],
): MidiNote {
  const stables = new Set(
    keepInKey(
      chord.quality.intervals
        .filter((step) => step < 12)
        .map((step) => normalizePitchClass(chord.root + step)),
      key,
    ),
  )
  if (next) {
    const third = normalizePitchClass(
      next.root + (next.quality.intervals.includes(3) ? 3 : 4),
    )
    const approach = normalizePitchClass(third + 1)
    if (stables.has(approach)) stables.add(approach)
  }
  const classes =
    stables.size > 0 ? [...stables] : inKeyMaterial(chord, key)
  const ladder = ladderOf(classes, LOW, HIGH)
  return ladder[nearestStep(ladder, near)] ?? near
}

/**
 * Đặt câu Licky: hình nốt từ sổ, cao độ bám hợp âm đang vang, đủ nốt theo phách.
 */
export function placeLick(options: PlaceOptions): PlacedNote[] {
  const {
    chord,
    next,
    startBeat,
    beats,
    take = 0,
    mode = 'clone',
    kind,
    key = null,
  } = options
  if (beats <= 0) return []

  const count = noteCount(kind, beats)
  let intervals = shape(
    pick(kind, mode === 'create' ? take + 19 : take),
    count,
    take,
  )
  if (mode === 'create') {
    intervals = intervals.map((interval) => -interval)
  }

  const material = [...new Set(inKeyMaterial(chord, key))]
  const ladder = ladderOf(material, LOW, HIGH)
  const root = (ANCHOR + normalizePitchClass(chord.root)) as MidiNote
  const startAt =
    ladder[
      (nearestStep(ladder, root > 78 ? ((root - 12) as MidiNote) : root) +
        (scramble(take + 3) % Math.max(1, Math.min(4, ladder.length)))) %
        Math.max(1, ladder.length)
    ] ?? root
  if (scramble(take + 5) % 2 === 1) {
    intervals = intervals.map((interval) => -interval)
  }
  const pitches = paint(intervals, ladder, startAt)
  if (pitches.length > 0) {
    pitches[pitches.length - 1] = land(
      chord,
      next,
      pitches[pitches.length - 1]!,
      key,
    )
  }

  const grid = gridOf(kind)
  return pitches.map((note, index) => {
    const at = startBeat + index * grid
    const last = index === pitches.length - 1
    return {
      note,
      startBeat: at,
      durationBeats: last
        ? Math.max(grid, startBeat + beats - at) * 0.95
        : grid * 0.9,
      isGrace: false as const,
      hand: note < HAND_SPLIT ? ('left' as const) : ('right' as const),
    }
  })
}
