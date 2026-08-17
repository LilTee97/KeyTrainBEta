import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Xoay màu khi cùng gốc ngân nhiều ô — kỹ thuật 5 cấp ô nhịp.
 *
 * Tài liệu mục 12.2: `C → CM7 → C6 → CM7`. Ô đầu giữ màu người dùng chọn,
 * các ô sau luân phiên hai màu còn lại trên bánh `add2 / maj7 / 6`.
 */

const WHEEL = ['add9', 'maj7', '6'] as const

function accidentalStyleOf(symbol: string): AccidentalStyle {
  return /^[A-G]b/.test(symbol) ? 'flat' : 'sharp'
}

function isRestingMajor(chord: ParsedChord): boolean {
  const intervals = chord.quality.intervals
  return intervals.includes(4) && !intervals.includes(10)
}

function heldQuality(startId: string, index: number): string {
  if (index === 0) return WHEEL.includes(startId as (typeof WHEEL)[number])
    ? startId
    : WHEEL[0]
  const rest = WHEEL.filter((id) => id !== (WHEEL.includes(startId as (typeof WHEEL)[number]) ? startId : WHEEL[0]))
  return rest[(index - 1) % rest.length]
}

function retone(chord: ParsedChord, qualityId: string): ParsedChord {
  const quality = getChordQuality(qualityId)
  if (!quality) return chord

  const style = accidentalStyleOf(chord.symbol)
  const base = `${pitchClassName(chord.root, style)}${quality.symbol}`
  const symbol =
    chord.bass !== undefined
      ? `${base}/${pitchClassName(chord.bass, style)}`
      : base

  return { ...chord, quality, symbol }
}

export interface HeldColorOptions {
  beatsOf: (index: number) => number
  beatsPerMeasure?: number
}

/**
 * Gán màu xoay cho dãy cùng gốc, và ghi nhãn khi một hợp âm ngân nhiều ô.
 */
export function varyHeldColors(
  chords: readonly ParsedChord[],
  options: HeldColorOptions,
): ParsedChord[] {
  const bar = options.beatsPerMeasure ?? 4
  const next = chords.map((chord) => ({ ...chord }))
  let index = 0

  while (index < next.length) {
    const head = next[index]
    if (!isRestingMajor(head)) {
      index += 1
      continue
    }

    let end = index + 1
    while (
      end < next.length &&
      next[end].root === head.root &&
      isRestingMajor(next[end])
    ) {
      end += 1
    }

    const run = end - index
    const startId = head.quality.id

    if (run >= 2) {
      const labels: string[] = []
      for (let offset = 0; offset < run; offset += 1) {
        next[index + offset] = {
          ...retone(next[index + offset], heldQuality(startId, offset)),
          holdRun: true,
        }
        labels.push(next[index + offset].symbol)
      }
      const heldLabel = labels.join(' → ')
      for (let offset = 0; offset < run; offset += 1) {
        next[index + offset] = { ...next[index + offset], heldLabel }
      }
      index = end
      continue
    }

    const bars = Math.max(1, Math.round(options.beatsOf(index) / bar))
    if (bars >= 2) {
      const qualities: string[] = []
      const labels: string[] = []
      for (let offset = 0; offset < bars; offset += 1) {
        const qualityId = heldQuality(startId, offset)
        qualities.push(qualityId)
        labels.push(retone(head, qualityId).symbol)
      }
      next[index] = {
        ...retone(head, qualities[0]),
        heldLabel: labels.join(' → '),
        heldQualities: qualities,
      }
    }

    index = end
  }

  return next
}

/** Tách hợp âm ngân nhiều ô thành từng ô một, để phần đệm chơi đúng từng màu. */
export function explodeHeldBars(
  chords: readonly ParsedChord[],
  beatsPerChord: number,
): ParsedChord[] {
  const out: ParsedChord[] = []

  for (const chord of chords) {
    const qualities = chord.heldQualities
    if (!qualities || qualities.length < 2) {
      out.push(chord)
      continue
    }

    const total = chord.beats ?? beatsPerChord
    const each = total / qualities.length

    for (const [offset, qualityId] of qualities.entries()) {
      out.push({
        ...retone(chord, qualityId),
        beats: each,
        passing: offset > 0 ? true : chord.passing,
        heldLabel: undefined,
        heldQualities: undefined,
        holdRun: undefined,
      })
    }
  }

  return out
}
