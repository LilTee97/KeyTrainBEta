import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import { scaleForChord, scaleLabelForChord } from '../brain/chordScale'

export type ArpKind = 'chord' | 'scale' | 'chromatic'

export const SCALE_CATALOG = [
  { id: 'major', label: 'Trưởng / Ionian', pcs: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian', label: 'Dorian', pcs: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', label: 'Phrygian', pcs: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', label: 'Lydian', pcs: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', label: 'Mixolydian', pcs: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'aeolian', label: 'Thứ / Aeolian', pcs: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'locrian', label: 'Locrian', pcs: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'harm-min', label: 'Thứ hòa thanh', pcs: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'mel-min', label: 'Thứ giai điệu', pcs: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'penta-maj', label: 'Ngũ cung trưởng', pcs: [0, 2, 4, 7, 9] },
  { id: 'penta-min', label: 'Ngũ cung thứ', pcs: [0, 3, 5, 7, 10] },
  { id: 'blues', label: 'Blues', pcs: [0, 3, 5, 6, 7, 10] },
  { id: 'chromatic', label: 'Chromatic', pcs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
] as const

export type ScaleCatalogId = (typeof SCALE_CATALOG)[number]['id']
export type ArpHand = 'left' | 'right' | 'both'
export type ArpMode = 'loop' | 'single'

const LOW = 36
const HIGH = 84

function walk(
  allowed: ReadonlySet<number>,
  start: number,
  dir: 1 | -1,
  stop: number,
): number[] {
  const out: number[] = []
  let at = start
  const step = dir
  const beyond = (note: number) => (dir > 0 ? note > stop : note < stop)
  while (!beyond(at)) {
    if (allowed.has(((at % 12) + 12) % 12)) out.push(at)
    at += step
  }
  if (out.length === 0) return [start]
  const back = out.slice(0, -1).reverse()
  return [...out, ...back]
}

function chordClasses(chord: ParsedChord): Set<number> {
  return new Set(chord.quality.intervals.map((interval) => (chord.root + interval) % 12))
}

function nearestTone(start: number, allowed: ReadonlySet<number>): number {
  for (let gap = 0; gap < 12; gap += 1) {
    if (allowed.has((((start + gap) % 12) + 12) % 12)) return start + gap
    if (allowed.has((((start - gap) % 12) + 12) % 12)) return start - gap
  }
  return start
}

export interface ArpRun {
  left: number[]
  right: number[]
  scaleName: string
}

/** Rải 3/4 ngón: phải lên hết đàn rồi về; trái xuống hết đàn rồi về. */
export function buildArpRun(
  chord: ParsedChord,
  kind: ArpKind,
  hand: ArpHand,
): ArpRun {
  const scalePcs = kind === 'scale' ? scaleForChord(chord) : null
  const allowed =
    kind === 'chromatic'
      ? new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
      : kind === 'scale' && scalePcs && scalePcs.length > 0
        ? new Set(scalePcs)
        : chordClasses(chord)
  const start = nearestTone(60, allowed)
  const right = hand === 'left' ? [] : walk(allowed, start, 1, HIGH)
  const left = hand === 'right' ? [] : walk(allowed, start, -1, LOW)
  const scaleName =
    kind === 'chromatic'
      ? 'Chromatic'
      : kind === 'scale'
        ? (scaleLabelForChord(chord) ?? `Gam ${chord.symbol}`)
        : (scaleLabelForChord(chord) ?? `Rải ${chord.symbol}`)
  return { left: left as MidiNote[], right: right as MidiNote[], scaleName }
}

export function buildArpFromScale(
  tonic: number,
  pcs: readonly number[],
  name: string,
  hand: ArpHand,
): ArpRun {
  const allowed = new Set(pcs.map((pc) => (tonic + pc) % 12))
  const start = nearestTone(60, allowed)
  const right = hand === 'left' ? [] : walk(allowed, start, 1, HIGH)
  const left = hand === 'right' ? [] : walk(allowed, start, -1, LOW)
  return { left: left as MidiNote[], right: right as MidiNote[], scaleName: name }
}

export function nextNoteHit(
  held: readonly number[],
  previous: readonly number[],
  expected: number,
): boolean {
  return held.includes(expected) && !previous.includes(expected)
}
