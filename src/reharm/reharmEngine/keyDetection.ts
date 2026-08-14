import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import { degreesOf } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Dò giọng của một vòng hợp âm.
 *
 * Đây là bước 2 trong quy trình dò hợp âm mà tài liệu mô tả ở mục 18, và là
 * điều kiện bắt buộc để mọi luật tái hòa âm phía sau hoạt động đúng: cùng một
 * hợp âm G trưởng, ở giọng Đô thì là bậc năm nên cần nốt bậc bảy để kéo về chủ
 * âm, còn ở giọng Sol thì chính là chủ âm nên thêm add9 mới hợp.
 */

export interface KeyCandidate {
  tonic: PitchClass
  scale: ScaleType
  score: number
  /** Tên giọng để hiển thị, ví dụ 'C trưởng'. */
  label: string
}

/** Điểm cho mỗi nốt của hợp âm nằm trong gam. */
const IN_SCALE_POINTS = 1
/** Trừ điểm cho mỗi nốt nằm ngoài gam. Nặng hơn điểm cộng để phạt giọng sai. */
const OUT_OF_SCALE_PENALTY = 1.5
/** Hợp âm đầu vòng là chủ âm — dấu hiệu khá tốt. */
const FIRST_CHORD_BONUS = 2
/** Hợp âm cuối vòng là chủ âm — dấu hiệu mạnh hơn, vì câu nhạc hay kết ở chủ âm. */
const LAST_CHORD_BONUS = 3
/** Có mặt hợp âm bậc năm đúng chỗ — dấu hiệu rất đặc trưng của giọng. */
const DOMINANT_BONUS = 2

/**
 * Trừ điểm giọng thứ khi cả vòng không có lấy một nốt bậc bảy nâng cao.
 *
 * Đây là chỗ phân biệt một giọng thứ với giọng trưởng song song của nó — hai
 * giọng dùng **chung hệt bộ nốt** nên đếm nốt không tách được. Thứ duy nhất
 * chỉ giọng thứ mới có là bậc bảy nâng cao, xuất hiện qua hợp âm bậc năm
 * (E7 trong giọng La thứ). Vắng hẳn dấu hiệu đó thì nhiều khả năng bài đang ở
 * giọng trưởng song song chứ không phải giọng thứ.
 */
const MINOR_WITHOUT_LEADING_TONE_PENALTY = 3

/**
 * Các nốt thuộc một giọng.
 *
 * Giọng thứ tính thêm bậc bảy nâng cao, vì trong thực tế đệm hát bậc năm của
 * giọng thứ gần như luôn là hợp âm bảy át lấy từ gam thứ hoà thanh — không kể
 * vào thì mọi bài giọng thứ đều bị chấm điểm thấp oan.
 */
export function scaleTones(
  tonic: PitchClass,
  scale: ScaleType,
): Set<PitchClass> {
  const tones = new Set<PitchClass>()

  for (const entry of degreesOf(scale)) {
    tones.add(normalizePitchClass(tonic + entry.semitones))
  }

  if (scale === 'minor') {
    tones.add(normalizePitchClass(tonic + 11))
  }

  return tones
}

/**
 * Hợp âm này có đang làm chức năng bậc năm không.
 *
 * Nhận diện theo cấu tạo chứ không theo tên: có nốt bậc bảy thứ và không có
 * bậc ba thứ. Cách này bắt được cả hợp âm treo như D9sus4 — vốn không có bậc
 * ba nào nhưng vẫn đóng vai bậc năm, và xuất hiện dày đặc trong phong cách
 * đang mô hình hoá.
 */
function actsAsDominant(chord: ParsedChord): boolean {
  const intervals = chord.quality.intervals
  return intervals.includes(10) && !intervals.includes(3)
}

/** Chấm điểm một giọng ứng viên. */
function scoreKey(
  chords: readonly ParsedChord[],
  tonic: PitchClass,
  scale: ScaleType,
): number {
  const tones = scaleTones(tonic, scale)
  let score = 0

  for (const chord of chords) {
    for (const pitch of chordPitchClasses(chord.root, chord.quality)) {
      score += tones.has(pitch) ? IN_SCALE_POINTS : -OUT_OF_SCALE_PENALTY
    }

    // Nốt bass của hợp âm chồng trên bass cũng phải nằm trong giọng.
    if (chord.bass !== undefined) {
      score += tones.has(chord.bass) ? IN_SCALE_POINTS : -OUT_OF_SCALE_PENALTY
    }

    if (actsAsDominant(chord) && normalizePitchClass(chord.root - tonic) === 7) {
      score += DOMINANT_BONUS
    }
  }

  if (chords.length > 0) {
    if (chords[0].root === tonic) score += FIRST_CHORD_BONUS
    if (chords[chords.length - 1].root === tonic) score += LAST_CHORD_BONUS
  }

  if (scale === 'minor') {
    const leadingTone = normalizePitchClass(tonic + 11)
    const hasLeadingTone = chords.some((chord) =>
      chordPitchClasses(chord.root, chord.quality).includes(leadingTone),
    )

    if (!hasLeadingTone) score -= MINOR_WITHOUT_LEADING_TONE_PENALTY
  }

  return score
}

export function keyLabel(tonic: PitchClass, scale: ScaleType): string {
  return `${pitchClassName(tonic)} ${scale === 'minor' ? 'thứ' : 'trưởng'}`
}

/**
 * Xếp hạng toàn bộ hai mươi tư giọng theo mức khớp với vòng hợp âm.
 * Trả về danh sách để giao diện hiện được các ứng viên gần nhau, tránh việc
 * app quả quyết một giọng trong khi thực ra đang phân vân.
 */
export function detectKey(chords: readonly ParsedChord[]): KeyCandidate[] {
  if (chords.length === 0) return []

  const candidates: KeyCandidate[] = []

  for (let tonic = 0; tonic < 12; tonic += 1) {
    for (const scale of ['major', 'minor'] as const) {
      candidates.push({
        tonic,
        scale,
        score: scoreKey(chords, tonic, scale),
        label: keyLabel(tonic, scale),
      })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

/** Giọng khớp nhất, hoặc null khi chưa có hợp âm nào. */
export function bestKey(chords: readonly ParsedChord[]): KeyCandidate | null {
  return detectKey(chords)[0] ?? null
}

/**
 * App có đang phân vân giữa nhiều giọng không.
 *
 * Giọng trưởng và giọng thứ song song dùng chung bộ nốt nên điểm luôn sát nhau;
 * lúc đó nên nói rõ là chưa chắc thay vì quả quyết, để người dùng tự chọn.
 */
export function isAmbiguous(
  candidates: readonly KeyCandidate[],
  threshold = 2,
): boolean {
  if (candidates.length < 2) return false
  return candidates[0].score - candidates[1].score < threshold
}
