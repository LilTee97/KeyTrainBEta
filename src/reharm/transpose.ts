import { pitchClassName } from '../shared/musicTheory/pitch'
import type { PitchClass } from '../shared/musicTheory/types'
import type { ParsedChord } from './types'

/**
 * Nâng hạ tone cả bài.
 *
 * Ca sĩ mỗi người một quãng giọng, nên cùng một bài phải chơi được ở nhiều
 * tone khác nhau — đây là việc người đệm hát làm thường xuyên nhất, và cũng là
 * lý do tài liệu nhắc đi nhắc lại chuyện luyện qua đủ mười hai giọng.
 *
 * Chỉ dịch **nốt gốc và nốt bass**; tính chất hợp âm giữ nguyên, vì dịch giọng
 * không đổi hợp âm trưởng thành hợp âm thứ.
 */

/** Đưa một quãng bất kỳ về khoảng 0-11. */
function fold(semitones: number): number {
  return ((semitones % 12) + 12) % 12
}

export function transposeChord(
  chord: ParsedChord,
  semitones: number,
): ParsedChord {
  const shift = fold(semitones)
  if (shift === 0) return chord

  const root = fold(chord.root + shift) as PitchClass
  const bass =
    chord.bass === undefined
      ? undefined
      : (fold(chord.bass + shift) as PitchClass)

  const base = `${pitchClassName(root)}${chord.quality.symbol}`
  const symbol =
    bass !== undefined && bass !== root
      ? `${base}/${pitchClassName(bass)}`
      : base

  return { ...chord, root, bass, symbol, source: symbol }
}

export function transposeChords(
  chords: readonly ParsedChord[],
  semitones: number,
): ParsedChord[] {
  if (fold(semitones) === 0) return [...chords]
  return chords.map((chord) => transposeChord(chord, semitones))
}

/** Nhãn hiện trên nút, ví dụ `+2` hoặc `−3`. */
export function transposeLabel(semitones: number): string {
  if (semitones === 0) return 'gốc'
  return semitones > 0 ? `+${semitones}` : `−${Math.abs(semitones)}`
}
