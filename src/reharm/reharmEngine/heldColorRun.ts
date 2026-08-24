import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Xoay màu khi cùng gốc ngân: **chia đôi** với hợp âm gốc.
 *
 * Nửa đầu giữ màu đang có. Nửa sau một nấc trên bánh add2 / maj7 / 6.
 * Không trải cả bánh trên bốn ô — tránh Cadd2 Cadd2 rồi chồng chữ.
 */

const WHEEL = ['add9', 'maj7', '6'] as const

function accidentalStyleOf(symbol: string): AccidentalStyle {
  return /^[A-G]b/.test(symbol) ? 'flat' : 'sharp'
}

function isRestingMajor(chord: ParsedChord): boolean {
  const intervals = chord.quality.intervals
  return intervals.includes(4) && !intervals.includes(10)
}

function startQuality(startId: string): string {
  return WHEEL.includes(startId as (typeof WHEEL)[number]) ? startId : WHEEL[0]
}

function nextQuality(startId: string): string {
  const start = startQuality(startId)
  return WHEEL[(WHEEL.indexOf(start as (typeof WHEEL)[number]) + 1) % WHEEL.length]
}

function qualityAt(startId: string, offset: number, run: number): string {
  return offset < Math.ceil(run / 2) ? startQuality(startId) : nextQuality(startId)
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
  /** Ô đã chuột phải bỏ xoay màu — giữ đúng hợp âm gốc. */
  skipHeldAt?: ReadonlySet<number>
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
    const skipped = options.skipHeldAt
      ? Array.from({ length: run }, (_, offset) => index + offset).some((at) =>
          options.skipHeldAt!.has(at),
        )
      : false

    if (skipped) {
      index = end
      continue
    }

    if (run >= 2) {
      const labels: string[] = []
      for (let offset = 0; offset < run; offset += 1) {
        next[index + offset] = {
          ...retone(next[index + offset], qualityAt(startId, offset, run)),
          holdRun: true,
        }
        labels.push(next[index + offset].symbol)
      }
      const unique = [...new Set(labels)]
      if (unique.length < 2) {
        for (let offset = 0; offset < run; offset += 1) {
          next[index + offset] = {
            ...next[index + offset],
            holdRun: undefined,
            heldLabel: undefined,
          }
        }
        index = end
        continue
      }
      const heldLabel = unique.join(' → ')
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
      qualities.push(startQuality(startId), nextQuality(startId))
      for (const qualityId of qualities) {
        labels.push(retone(head, qualityId).symbol)
      }
      const unique = [...new Set(labels)]
      if (unique.length >= 2) {
        next[index] = {
          ...retone(head, qualities[0]),
          heldLabel: labels.join(' → '),
          heldQualities: qualities,
        }
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
    if (!qualities || qualities.length < 2 || new Set(qualities).size < 2) {
      out.push(chord)
      continue
    }

    const total = chord.beats ?? beatsPerChord
    const each = total / qualities.length

    for (const qualityId of qualities) {
      out.push({
        ...retone(chord, qualityId),
        beats: each,
        passing: chord.passing,
        heldLabel: undefined,
        heldQualities: undefined,
        holdRun: undefined,
      })
    }
  }

  return out
}
