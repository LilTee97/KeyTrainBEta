import { inferChordNet } from './chordNet'
import type { ImportedChord } from './importedTrack'

function l2(values: number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
}

/** Cấu hình Krumhansl–Schmuckler: chroma trung bình của cả bài → giọng. */
const KEY_PROFILE_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KEY_PROFILE_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

function pearson(left: readonly number[], right: readonly number[]): number {
  const size = left.length
  let meanLeft = 0
  let meanRight = 0
  for (let index = 0; index < size; index += 1) {
    meanLeft += left[index]
    meanRight += right[index]
  }
  meanLeft /= size
  meanRight /= size
  let num = 0
  let denLeft = 0
  let denRight = 0
  for (let index = 0; index < size; index += 1) {
    const a = left[index] - meanLeft
    const b = right[index] - meanRight
    num += a * b
    denLeft += a * a
    denRight += b * b
  }
  const den = Math.sqrt(denLeft * denRight)
  return den === 0 ? 0 : num / den
}

/** Dò giọng Krumhansl–Schmuckler (tương quan, không nhân thô). */
export function estimateKey(
  chromaAverage: readonly number[],
): { root: number; minor: boolean } | null {
  if (l2([...chromaAverage]) < 1e-6) return null

  let bestRoot = 0
  let bestMinor = false
  let best = -Infinity
  for (let shift = 0; shift < 12; shift += 1) {
    const aligned = KEY_PROFILE_MAJOR.map(
      (_, bin) => chromaAverage[(bin + shift) % 12],
    )
    for (const [minor, profile] of [
      [false, KEY_PROFILE_MAJOR],
      [true, KEY_PROFILE_MINOR],
    ] as const) {
      const score = pearson(aligned, profile)
      if (score > best) {
        best = score
        bestRoot = shift
        bestMinor = minor
      }
    }
  }
  return { root: bestRoot, minor: bestMinor }
}

export interface MatchKey {
  root: number
  minor: boolean
}

export function matchChroma(
  chroma: number[],
  key?: MatchKey | null,
): { symbol: string; root: number; score: number } | null {
  return inferChordNet(chroma, key)
}

/**
 * HarmTrace-lite: hợp âm đổi ở phách yếu 1 nhịp rồi về cũ thì nuốt —
 * Chordify giả định đổi hợp âm ở phách mạnh.
 */
export function smoothBeatChords(
  symbols: readonly string[],
  meter: 3 | 4,
): string[] {
  if (symbols.length < 3) return [...symbols]
  const out = [...symbols]
  for (let index = 1; index < out.length - 1; index += 1) {
    if (out[index] === out[index - 1]) continue
    if (out[index - 1] !== out[index + 1]) continue
    if (index % meter === 0) continue
    out[index] = out[index - 1]
  }
  return out
}

/** Gộp các phách liền nhau cùng hợp âm. */
export function expandToBeats(
  chords: readonly { symbol: string; beats?: number }[],
  fallbackBeats: number,
): string[] {
  const beats: string[] = []
  for (const chord of chords) {
    const length = Math.max(1, Math.round(chord.beats ?? fallbackBeats))
    for (let index = 0; index < length; index += 1) beats.push(chord.symbol)
  }
  return beats
}

/** Gộp các phách liền nhau cùng hợp âm. */
export function mergeBeatChords(perBeat: readonly string[]): ImportedChord[] {
  const merged: ImportedChord[] = []
  for (const symbol of perBeat) {
    const last = merged.at(-1)
    if (last && last.symbol === symbol) {
      last.beats += 1
      continue
    }
    merged.push({ symbol, beats: 1 })
  }
  return merged
}

/** Ghi lưới: một ô một ô nhịp; cả ô cùng hợp âm thì ghi một lần. */
export function beatsToGrid(
  perBeat: readonly string[],
  meter: 3 | 4,
): string {
  if (perBeat.length === 0) return ''
  const lines: string[] = []
  for (let start = 0; start < perBeat.length; start += meter) {
    const slice = perBeat.slice(start, start + meter)
    const same = slice.every((symbol) => symbol === slice[0])
    lines.push(same ? `| ${slice[0]} |` : `| ${slice.join(' ')} |`)
  }
  return lines.join('\n')
}
