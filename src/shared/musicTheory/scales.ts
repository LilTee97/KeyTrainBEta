import { getChordQuality } from './chordDefinitions'
import { normalizePitchClass, pitchClassName } from './pitch'
import type {
  AccidentalStyle,
  ChordQuality,
  PitchClass,
} from './types'

/**
 * Bảng bậc hợp âm của gam trưởng và gam thứ.
 *
 * Đây là "ngân hàng hợp âm" mà tài liệu phong cách gọi tới ở bước dò hợp âm:
 * dựng bảy hợp âm bậc của giọng rồi thử từng cái xem cái nào ôm được nốt giai
 * điệu. Cũng là nền để sinh vòng hợp âm và để đọc tên bậc La Mã.
 */

export type ScaleType = 'major' | 'minor'

/** Ký hiệu La Mã của bảy bậc, dạng chữ hoa. */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

export interface DiatonicDegree {
  /** Bậc trong giọng, đếm từ 1. */
  degree: number
  /** Khoảng cách nửa cung từ chủ âm tới nốt gốc của bậc này. */
  semitones: number
  /** Tính chất hợp âm ba của bậc. */
  triadQualityId: string
  /** Tính chất hợp âm bảy của bậc. */
  seventhQualityId: string
}

/** Bảy bậc của gam trưởng. */
export const MAJOR_DEGREES: readonly DiatonicDegree[] = [
  { degree: 1, semitones: 0, triadQualityId: 'maj', seventhQualityId: 'maj7' },
  { degree: 2, semitones: 2, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 3, semitones: 4, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 4, semitones: 5, triadQualityId: 'maj', seventhQualityId: 'maj7' },
  { degree: 5, semitones: 7, triadQualityId: 'maj', seventhQualityId: '7' },
  { degree: 6, semitones: 9, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 7, semitones: 11, triadQualityId: 'dim', seventhQualityId: 'm7b5' },
]

/**
 * Bảy bậc của gam thứ tự nhiên.
 *
 * Lưu ý: trong thực tế đệm hát, bậc V của giọng thứ gần như luôn được đổi
 * thành hợp âm bảy át (V7, lấy từ gam thứ hoà thanh) để tạo lực kéo về chủ âm.
 * Bảng này giữ đúng gam tự nhiên, còn chỗ nào cần V7 thì vòng hợp âm sẽ tự
 * ghi đè tính chất.
 */
export const MINOR_DEGREES: readonly DiatonicDegree[] = [
  { degree: 1, semitones: 0, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 2, semitones: 2, triadQualityId: 'dim', seventhQualityId: 'm7b5' },
  { degree: 3, semitones: 3, triadQualityId: 'maj', seventhQualityId: 'maj7' },
  { degree: 4, semitones: 5, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 5, semitones: 7, triadQualityId: 'min', seventhQualityId: 'm7' },
  { degree: 6, semitones: 8, triadQualityId: 'maj', seventhQualityId: 'maj7' },
  { degree: 7, semitones: 10, triadQualityId: 'maj', seventhQualityId: '7' },
]

export function degreesOf(scale: ScaleType): readonly DiatonicDegree[] {
  return scale === 'minor' ? MINOR_DEGREES : MAJOR_DEGREES
}

/** Một hợp âm cụ thể trong một giọng. */
export interface Chord {
  root: PitchClass
  quality: ChordQuality
  /** Nốt bass khác nốt gốc, dùng cho hợp âm chồng trên bass. */
  bass?: PitchClass
  /** Tên hợp âm để hiển thị, ví dụ 'Am7'. */
  symbol: string
  /** Ký hiệu bậc La Mã trong giọng đang xét, ví dụ 'ii7'. */
  roman: string
}

/**
 * Ký hiệu La Mã cho một bậc, viết hoa hay thường tuỳ tính chất hợp âm.
 * Quy ước quen thuộc: bậc trưởng viết hoa, bậc thứ và bậc giảm viết thường.
 */
export function romanFor(degree: number, quality: ChordQuality): string {
  const base = ROMAN_NUMERALS[degree - 1] ?? '?'

  // Xét quãng ba thứ trong cấu tạo hợp âm, không so tên: tên 'maj7' cũng bắt
  // đầu bằng chữ m nên so chuỗi sẽ biến hợp âm trưởng thành chữ thường.
  // Hợp âm treo không có bậc ba nên theo quy ước viết hoa.
  const hasMinorThird = quality.intervals.includes(3)
  const numeral = hasMinorThird ? base.toLowerCase() : base

  // Hợp âm ba trưởng và ba thứ đã thể hiện đủ qua chữ hoa/thường,
  // nên không cần ghi thêm hậu tố.
  if (quality.id === 'maj' || quality.id === 'min') return numeral

  return `${numeral}${quality.symbol}`
}

/**
 * Dựng hợp âm của một bậc trong giọng cho trước.
 * `qualityOverride` dùng khi vòng hợp âm cần tính chất khác mặc định của gam,
 * ví dụ bậc V trong giọng thứ đổi thành hợp âm bảy át.
 */
export function chordAtDegree(
  tonic: PitchClass,
  scale: ScaleType,
  degree: number,
  options: {
    useSevenths?: boolean
    qualityOverride?: string
    accidentalStyle?: AccidentalStyle
  } = {},
): Chord | null {
  const {
    useSevenths = false,
    qualityOverride,
    accidentalStyle = 'sharp',
  } = options

  const entry = degreesOf(scale).find((item) => item.degree === degree)
  if (!entry) return null

  const qualityId =
    qualityOverride ??
    (useSevenths ? entry.seventhQualityId : entry.triadQualityId)

  const quality = getChordQuality(qualityId)
  if (!quality) return null

  const root = normalizePitchClass(tonic + entry.semitones)

  return {
    root,
    quality,
    symbol: `${pitchClassName(root, accidentalStyle)}${quality.symbol}`,
    roman: romanFor(degree, quality),
  }
}

/** Bảy hợp âm bậc của một giọng. */
export function diatonicChords(
  tonic: PitchClass,
  scale: ScaleType,
  options: {
    useSevenths?: boolean
    accidentalStyle?: AccidentalStyle
  } = {},
): Chord[] {
  return degreesOf(scale)
    .map((entry) => chordAtDegree(tonic, scale, entry.degree, options))
    .filter((chord): chord is Chord => chord !== null)
}
