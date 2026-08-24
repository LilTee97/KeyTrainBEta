import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import { MAJOR_DEGREES, MINOR_DEGREES } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { parseChordInput } from '../input/chordInputParser'
import type { ParsedChord } from '../types'
import { voiceLeadTwoHands, type TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'

export type DrillKind = 'named' | 'degrees'
export type DrillPalette = 'basic' | 'color'

const ROMAN: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
}

const COLOR_MAJOR: Record<number, string> = {
  1: 'add9',
  2: 'm7',
  3: 'm7',
  4: 'add9',
  5: '7',
  6: 'madd9',
  7: 'm7b5',
}

const COLOR_MINOR: Record<number, string> = {
  1: 'madd9',
  2: 'm7b5',
  3: 'add9',
  4: 'm7',
  5: '7',
  6: 'maj7',
  7: 'm7',
}

function tokenKind(token: string): DrillKind | 'skip' {
  if (/^[1-7]$/.test(token)) return 'degrees'
  if (/^[b#]?[ivx]+$/i.test(token)) return 'degrees'
  if (/^[A-Ga-g]/.test(token)) return 'named'
  return 'skip'
}

export function classifyInput(text: string): DrillKind | null {
  const tokens = text.split(/[\s,|]+/).filter(Boolean)
  const kinds = tokens.map(tokenKind).filter((k) => k !== 'skip')
  if (kinds.length === 0) return null
  return kinds.every((k) => k === 'degrees') ? 'degrees' : 'named'
}

function degreeOf(token: string): number | null {
  if (/^[1-7]$/.test(token)) return Number(token)
  const m = /^[b#]?([ivx]+)$/i.exec(token)
  if (!m) return null
  return ROMAN[m[1].toLowerCase()] ?? null
}

function makeChord(root: PitchClass, qualityId: string, source: string): ParsedChord | null {
  const quality = getChordQuality(qualityId)
  if (!quality) return null
  const symbol = `${pitchClassName(root, 'sharp')}${quality.symbol}`
  return { root, quality, source, symbol }
}

export function expandDegrees(
  text: string,
  tonic: PitchClass,
  scale: 'major' | 'minor',
  palette: DrillPalette,
): ParsedChord[] {
  const table = scale === 'minor' ? MINOR_DEGREES : MAJOR_DEGREES
  const colors = scale === 'minor' ? COLOR_MINOR : COLOR_MAJOR
  const chords: ParsedChord[] = []
  for (const token of text.split(/[\s,|]+/).filter(Boolean)) {
    const degree = degreeOf(token)
    if (!degree) continue
    const entry = table[degree - 1]
    if (!entry) continue
    const root = normalizePitchClass(tonic + entry.semitones)
    const qualityId =
      palette === 'color'
        ? (colors[degree] ?? entry.triadQualityId)
        : entry.triadQualityId
    const chord = makeChord(root, qualityId, token)
    if (chord) chords.push(chord)
  }
  return chords
}

export function parseNamed(text: string): ParsedChord[] {
  return parseChordInput(text).chords
}

export function drillVoicings(chords: readonly ParsedChord[]): TwoHandVoicing[] {
  return voiceLeadTwoHands(chords, { leftHandShare: 'drill' })
}

export type DrillSkill = 'chords' | 'scale' | 'arp'

export function drillScaleVoicing(
  tonic: PitchClass,
  scale: 'major' | 'minor',
): TwoHandVoicing {
  const steps = scale === 'minor' ? [0, 2, 3, 5, 7, 8, 10, 12] : [0, 2, 4, 5, 7, 9, 11, 12]
  const notes = steps.map((step) => (48 + tonic + step) as MidiNote)
  return { left: notes.slice(0, 3), right: notes.slice(3), symbol: scale === 'minor' ? 'Gam thứ' : 'Gam trưởng' }
}

export function drillArpVoicing(chord: ParsedChord): TwoHandVoicing {
  return drillVoicings([chord])[0]!
}

export function requiredNotes(voicing: TwoHandVoicing): MidiNote[] {
  return [...voicing.left, ...voicing.right].sort((a, b) => a - b)
}

/** Khớp đủ nốt thế bấm (cùng pitch class). Thừa nốt ngoài hợp âm = chưa đúng. */
export function isVoicingMatched(
  held: readonly MidiNote[],
  voicing: TwoHandVoicing,
): boolean {
  const need = new Set(requiredNotes(voicing).map((n) => n % 12))
  const got = new Set(held.map((n) => n % 12))
  if (need.size === 0) return false
  for (const pc of need) if (!got.has(pc)) return false
  for (const pc of got) if (!need.has(pc)) return false
  return true
}

export const PALETTE_HINTS = [
  { id: 'basic' as const, label: 'Cơ bản (tam âm)' },
  { id: 'color' as const, label: 'Màu (add9 / 7 / m7)' },
]
