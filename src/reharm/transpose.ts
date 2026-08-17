import { pitchClassName } from '../shared/musicTheory/pitch'
import type { AccidentalStyle, PitchClass } from '../shared/musicTheory/types'
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
  style: AccidentalStyle = 'sharp',
): ParsedChord {
  const shift = fold(semitones)
  if (shift === 0) return chord

  const root = fold(chord.root + shift) as PitchClass
  const bass =
    chord.bass === undefined
      ? undefined
      : (fold(chord.bass + shift) as PitchClass)

  const base = `${pitchClassName(root, style)}${chord.quality.symbol}`
  const symbol =
    bass !== undefined && bass !== root
      ? `${base}/${pitchClassName(bass, style)}`
      : base

  return { ...chord, root, bass, symbol, source: symbol }
}

export function transposeChords(
  chords: readonly ParsedChord[],
  semitones: number,
  style: AccidentalStyle = 'sharp',
): ParsedChord[] {
  if (fold(semitones) === 0) return [...chords]
  return chords.map((chord) => transposeChord(chord, semitones, style))
}

/** Đổi giọng đang chọn theo cùng số nửa cung với nút TONE. */
export function shiftKeyId(key: string, semitones: number): string {
  if (!key) return key
  const [tonic, scale] = key.split(':')
  if (tonic === undefined || scale === undefined) return key
  return `${fold(Number(tonic) + semitones)}:${scale}`
}

/** Số nửa cung ngắn nhất để đi từ giọng này sang giọng kia, trong khoảng −6…+6. */
export function semitonesToKey(fromTonic: number, toTonic: number): number {
  let delta = fold(toTonic - fromTonic)
  if (delta > 6) delta -= 12
  return delta
}

/** Nhãn hiện trên nút, ví dụ `+2` hoặc `−3`. */
export function transposeLabel(semitones: number): string {
  if (semitones === 0) return 'gốc'
  return semitones > 0 ? `+${semitones}` : `−${Math.abs(semitones)}`
}
