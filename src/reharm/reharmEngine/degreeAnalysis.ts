import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import { degreesOf, romanFor } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Xác định mỗi hợp âm đóng vai gì trong giọng.
 *
 * Đây là khâu mà mọi luật tái hòa âm phía sau dựa vào. Không có nó thì luật
 * chạy mù chức năng: cùng một hợp âm G trưởng sẽ bị đối xử y hệt dù nó đang là
 * chủ âm hay đang là bậc năm cần kéo về chủ âm.
 */

/** Vai trò hoà thanh của một bậc. */
export type HarmonicFunction =
  /** Chỗ nghỉ, cảm giác đã về nhà. */
  | 'tonic'
  /** Rời khỏi chủ âm, chuẩn bị căng. */
  | 'subdominant'
  /** Căng, đòi giải quyết về chủ âm. */
  | 'dominant'

export interface AnalyzedChord {
  chord: ParsedChord
  /** Bậc trong giọng, 1-7. Bằng null khi hợp âm nằm ngoài giọng. */
  degree: number | null
  function: HarmonicFunction | null
  /** Ký hiệu bậc La Mã, hoặc tên hợp âm nếu nằm ngoài giọng. */
  roman: string
  /**
   * Hợp âm ngoài giọng này có đang đóng vai bậc năm phụ không.
   *
   * Nhận ra bằng ngữ cảnh: hợp âm trưởng hoặc bảy át, mà hợp âm ngay sau lại
   * nằm cách nó một quãng bốn đi lên — tức là nó đang giải quyết như một bậc
   * năm. Biết điều này để không tô màu nó như một hợp âm nghỉ.
   */
  actsAsDominant: boolean
}

/** Vai trò của từng bậc trong giọng trưởng. */
const MAJOR_FUNCTIONS: Record<number, HarmonicFunction> = {
  1: 'tonic',
  2: 'subdominant',
  3: 'tonic',
  4: 'subdominant',
  5: 'dominant',
  6: 'tonic',
  7: 'dominant',
}

/** Vai trò của từng bậc trong giọng thứ. */
const MINOR_FUNCTIONS: Record<number, HarmonicFunction> = {
  1: 'tonic',
  2: 'subdominant',
  3: 'tonic',
  4: 'subdominant',
  5: 'dominant',
  6: 'tonic',
  7: 'dominant',
}

/** Bậc của một nốt gốc trong giọng, hoặc null nếu không thuộc giọng. */
export function degreeOf(
  root: PitchClass,
  tonic: PitchClass,
  scale: ScaleType,
): number | null {
  const interval = normalizePitchClass(root - tonic)
  const entry = degreesOf(scale).find((item) => item.semitones === interval)
  return entry?.degree ?? null
}

/** Hợp âm mang tính chất trưởng hoặc bảy át. */
function isMajorish(chord: ParsedChord): boolean {
  return chord.quality.intervals.includes(4)
}

/**
 * Phân tích cả vòng hợp âm trong một giọng.
 *
 * Cần cả vòng chứ không phân tích từng hợp âm rời, vì việc nhận ra bậc năm phụ
 * phải nhìn vào hợp âm đứng ngay sau.
 */
export function analyzeInKey(
  chords: readonly ParsedChord[],
  tonic: PitchClass,
  scale: ScaleType,
): AnalyzedChord[] {
  const functions = scale === 'minor' ? MINOR_FUNCTIONS : MAJOR_FUNCTIONS

  return chords.map((chord, index) => {
    const degree = degreeOf(chord.root, tonic, scale)
    const next = chords[index + 1]

    // Giải quyết đi lên quãng bốn là chuyển động đặc trưng của bậc năm.
    const resolvesLikeDominant =
      next !== undefined &&
      normalizePitchClass(next.root - chord.root) === 5 &&
      isMajorish(chord)

    // Bậc năm chính thức của giọng thì đã có vai trò riêng, không cần gắn thêm.
    const actsAsDominant = resolvesLikeDominant && degree !== 5

    return {
      chord,
      degree,
      function: degree === null ? null : functions[degree],
      roman:
        degree === null
          ? chord.symbol
          : romanFor(degree, chord.quality),
      actsAsDominant,
    }
  })
}
