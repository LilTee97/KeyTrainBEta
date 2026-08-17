import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
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
 *
 * ## Mọi dấu hiệu đều quy về thang 0-1 trước khi cộng
 *
 * Bản đầu cộng thẳng điểm khớp gam của **từng nốt trong từng hợp âm**, nên
 * điểm ấy lớn dần theo độ dài bài, trong khi các dấu hiệu cấu trúc — mở ở hợp
 * âm nào, đóng ở hợp âm nào — là con số cố định. Hệ quả: với bài 114 hợp âm,
 * bằng chứng mạnh nhất của nhạc điệu tính chỉ còn đáng chưa tới một phần trăm
 * tổng điểm, tức bị nuốt mất.
 *
 * Đo trên ba bản ký âm trong `Reference/`, cách cũ sai bài blues: vòng
 * `C7-F7-G7` bị đọc thành **Fa trưởng**, vì hợp âm chủ của blues là một hợp âm
 * bảy át nên nhìn giống bậc năm của giọng hạ át. Bài mở và đóng đều ở Đô, mà
 * dấu hiệu đó chỉ đáng năm điểm trên tổng gần một trăm.
 *
 * Nay mỗi dấu hiệu được quy về thang 0-1 rồi mới nhân trọng số, nên độ dài bài
 * không còn làm lệch cán cân giữa chúng.
 */

export interface KeyCandidate {
  tonic: PitchClass
  scale: ScaleType
  score: number
  /** Tên giọng để hiển thị, ví dụ 'C trưởng'. */
  label: string
}

/**
 * Trọng số của từng dấu hiệu.
 *
 * Đặt theo mức tin cậy của từng dấu hiệu trong nhạc điệu tính, rồi chỉnh lại
 * theo kết quả đo trên ba bản ký âm thật ở `Reference/`.
 */

/** Hợp âm của bài có nằm trong gam không — dấu hiệu nền, luôn có mặt. */
const FIT_WEIGHT = 10
/** Bài đậu bao lâu trên hợp âm mang gốc là chủ âm. */
const TONIC_WEIGHT = 4
/** Bài mở ở hợp âm chủ. */
const OPEN_WEIGHT = 2
/** Bài đóng ở hợp âm chủ — dấu hiệu mạnh nhất, vì câu nhạc kết ở chỗ nghỉ. */
const CLOSE_WEIGHT = 3
/** Có bậc năm thật sự **giải quyết** về chủ âm. */
const CADENCE_WEIGHT = 3

/**
 * Dài bao nhiêu hợp âm thì mới tin hẳn vào chỗ bài mở và bài đóng.
 *
 * Hai dấu hiệu ấy mạnh **vì bài dừng ở đó**. Nhưng người dùng cũng hay gõ vào
 * một vòng bốn hợp âm để nghe thử, mà vòng lặp thì không có chỗ dừng nào cả —
 * hợp âm cuối chỉ là hợp âm thứ tư của vòng. Cho nó trọn điểm kết là đọc ra
 * một câu kết không hề tồn tại.
 *
 * Đây chính là chỗ làm hỏng vòng `Am11 D9sus4 E9sus4 Em7` của bài *Cứ Chill
 * Thôi*: tài liệu ghi rõ bài dạy ở **Sol trưởng**, nhưng vòng kết ở Em7 nên
 * chấm trọn điểm thì ra Mi thứ.
 */
const TRUSTED_LENGTH = 8

/** Trừ điểm cho mỗi nốt nằm ngoài gam. Nặng hơn điểm cộng để phạt giọng sai. */
const OUT_OF_SCALE_PENALTY = 1.5

/**
 * Trừ điểm giọng thứ khi cả vòng không có lấy một nốt bậc bảy nâng cao.
 *
 * Đây là chỗ phân biệt một giọng thứ với giọng trưởng song song của nó — hai
 * giọng dùng **chung hệt bộ nốt** nên đếm nốt không tách được. Thứ duy nhất
 * chỉ giọng thứ mới có là bậc bảy nâng cao, xuất hiện qua hợp âm bậc năm
 * (E7 trong giọng La thứ). Vắng hẳn dấu hiệu đó thì nhiều khả năng bài đang ở
 * giọng trưởng song song chứ không phải giọng thứ.
 */
const MINOR_WITHOUT_LEADING_TONE_PENALTY = 4

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

/**
 * Hợp âm này có đúng là hợp âm chủ của giọng đang xét không, cho điểm 0-1.
 *
 * Chia hai nửa vì hai chuyện khác nhau. Gốc hợp âm trùng chủ âm đã là bằng
 * chứng rồi, nên nửa điểm cho riêng chuyện đó. Nửa còn lại xét quãng ba có
 * đúng màu của giọng không.
 *
 * Không đòi khớp cả hai mới tính, vì hai lối bấm rất thường gặp sẽ bị loại
 * oan: hợp âm chủ của blues là hợp âm **bảy át** (C7 trong bài blues giọng
 * Đô), và bài giọng thứ hay kết bằng hợp âm **trưởng** cùng gốc — lối "quãng
 * ba Picardy", thấy ngay ở hợp âm cuối của *Người hãy quên em đi*.
 */
function tonicAgreement(
  chord: ParsedChord,
  tonic: PitchClass,
  scale: ScaleType,
): number {
  if (chord.root !== tonic) return 0

  const intervals = chord.quality.intervals
  const wanted = scale === 'minor' ? 3 : 4

  if (intervals.includes(wanted)) return 1
  // Hợp âm treo không có quãng ba nào nên không nói lên màu trưởng hay thứ.
  if (!intervals.includes(3) && !intervals.includes(4)) return 0.75

  return 0.5
}

/**
 * Mức khớp gam, trung bình trên mỗi nốt, trong khoảng -1,5 đến 1.
 *
 * Chia cho số nốt nên hợp âm mười ba nốt dày không tự nhiên nặng ký hơn hợp âm
 * ba nốt, và chia cho tổng trọng số nên bài dài không nặng ký hơn bài ngắn.
 */
function scaleFit(
  chords: readonly ParsedChord[],
  weights: readonly number[],
  tones: Set<PitchClass>,
): number {
  let total = 0
  let span = 0

  for (const [index, chord] of chords.entries()) {
    const pitches = chordPitchClasses(chord.root, chord.quality)
    const notes = [...pitches]
    if (chord.bass !== undefined) notes.push(chord.bass)
    if (notes.length === 0) continue

    let fit = 0
    for (const pitch of notes) {
      fit += tones.has(pitch) ? 1 : -OUT_OF_SCALE_PENALTY
    }

    const weight = weights[index] ?? 1
    total += (fit / notes.length) * weight
    span += weight
  }

  return span === 0 ? 0 : total / span
}

/** Phần thời lượng bài đậu trên hợp âm mang gốc là chủ âm, trong khoảng 0-1. */
function tonicShare(
  chords: readonly ParsedChord[],
  weights: readonly number[],
  tonic: PitchClass,
): number {
  let on = 0
  let span = 0

  for (const [index, chord] of chords.entries()) {
    const weight = weights[index] ?? 1
    span += weight
    if (chord.root === tonic) on += weight
  }

  return span === 0 ? 0 : on / span
}

/**
 * Có bậc năm **giải quyết thật** về chủ âm không, cho điểm 0-1.
 *
 * Khác hẳn với việc chỉ đếm xem trong bài có hợp âm nào đứng ở bậc năm. Một
 * hợp âm bảy át nằm lửng chẳng nói lên điều gì — trong vòng blues thì C7 vừa
 * là bậc năm của Fa vừa là chủ âm của Đô. Cái phân biệt được là nó có **đi
 * xuống chủ âm ngay sau đó** hay không.
 *
 * Đếm số lần chuyển như vậy rồi so với một mức đủ dùng, chứ không cộng dồn:
 * hai ba lần kết đã đủ chỉ ra giọng, gấp đôi số đó cũng không chắc chắn hơn.
 */
const ENOUGH_CADENCES = 3

function cadenceStrength(
  chords: readonly ParsedChord[],
  tonic: PitchClass,
): number {
  const fifth = normalizePitchClass(tonic + 7)
  let found = 0

  for (let index = 0; index < chords.length - 1; index += 1) {
    const chord = chords[index]!
    const next = chords[index + 1]!

    if (chord.root !== fifth || next.root !== tonic) continue
    // Cùng một hợp âm lặp lại không phải là chuyển động về chủ âm.
    if (chord.symbol === next.symbol) continue

    /*
      Bậc năm mang nốt bảy thứ là dấu hiệu chắc; bậc năm trơn cũng hút về chủ
      âm nhưng yếu hơn, vì hợp âm trưởng cách bốn quãng năm nào cũng có thể nối
      nhau mà chẳng phải câu kết.
    */
    found += actsAsDominant(chord) ? 1 : 0.5
  }

  return Math.min(1, found / ENOUGH_CADENCES)
}

/** Chấm điểm một giọng ứng viên. */
function scoreKey(
  chords: readonly ParsedChord[],
  weights: readonly number[],
  tonic: PitchClass,
  scale: ScaleType,
): number {
  const tones = scaleTones(tonic, scale)

  let score =
    FIT_WEIGHT * scaleFit(chords, weights, tones) +
    TONIC_WEIGHT * tonicShare(chords, weights, tonic) +
    CADENCE_WEIGHT * cadenceStrength(chords, tonic)

  // Vòng càng ngắn thì chỗ mở và chỗ đóng càng ít có nghĩa — xem `TRUSTED_LENGTH`.
  const edges = Math.min(1, chords.length / TRUSTED_LENGTH)

  const first = chords[0]
  const last = chords[chords.length - 1]
  if (first) score += OPEN_WEIGHT * edges * tonicAgreement(first, tonic, scale)
  if (last) score += CLOSE_WEIGHT * edges * tonicAgreement(last, tonic, scale)

  if (scale === 'minor') {
    const leadingTone = normalizePitchClass(tonic + 11)
    const hasLeadingTone = chords.some((chord) =>
      chordPitchClasses(chord.root, chord.quality).includes(leadingTone),
    )

    if (!hasLeadingTone) score -= MINOR_WITHOUT_LEADING_TONE_PENALTY
  }

  return score
}

/**
 * Thứ tự từ Đô, theo nửa cung.
 *
 * Bắt đầu từ C và đi lên theo thứ tự nốt: C C# D D# E F F# G G# A A# B.
 * Mỗi giọng trưởng đi liền giọng thứ song song.
 */
const CHROMATIC: readonly PitchClass[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

/**
 * Cả hai mươi tư giọng, xếp theo **bộ khoá**: mỗi giọng trưởng đi liền giọng
 * thứ song song của nó.
 *
 * Đô trưởng và La thứ dùng chung bộ khoá không dấu, Sol trưởng và Mi thứ dùng
 * chung một dấu thăng, và cứ thế. Xếp cặp như vậy vì khi phân vân giữa trưởng
 * và thứ thì hai lựa chọn nằm ngay cạnh nhau, không phải dò khắp danh sách.
 *
 * Cần một thứ tự cố định vì `detectKey` trả về danh sách **xếp theo điểm khớp**
 * — hợp lý cho việc đoán, nhưng bày lên ô chọn thì nhìn như xếp lung tung.
 */
export function orderedKeys(): { tonic: PitchClass; scale: ScaleType }[] {
  return CHROMATIC.flatMap((tonic) => [
    { tonic, scale: 'major' as ScaleType },
    // Giọng thứ song song nằm dưới ba nửa cung.
    { tonic: normalizePitchClass(tonic - 3), scale: 'minor' as ScaleType },
  ])
}

/**
 * Giọng trưởng dùng thăng: C G D A E B F♯.
 * Còn lại (và giọng thứ song song của chúng) dùng giáng — Ab chứ không G#.
 */
const SHARP_MAJOR_TONICS = new Set<PitchClass>([0, 7, 2, 9, 4, 11, 6])

export function accidentalStyleFor(
  tonic: PitchClass,
  scale: ScaleType,
): AccidentalStyle {
  const majorTonic =
    scale === 'major' ? tonic : normalizePitchClass(tonic + 3)
  return SHARP_MAJOR_TONICS.has(majorTonic) ? 'sharp' : 'flat'
}

export function keyLabel(tonic: PitchClass, scale: ScaleType): string {
  const name = pitchClassName(tonic, accidentalStyleFor(tonic, scale))
  return scale === 'minor' ? `${name}m` : name
}

export interface DetectKeyOptions {
  /**
   * Mỗi hợp âm ngân mấy phách, cùng thứ tự với vòng hợp âm.
   *
   * Có thì dùng làm trọng số: hợp âm ngân trọn hai ô nhịp nói lên giọng nhiều
   * hơn hợp âm lướt qua nửa phách. Không có thì coi mọi hợp âm dài như nhau.
   */
  beats?: readonly number[]
}

/**
 * Xếp hạng toàn bộ hai mươi tư giọng theo mức khớp với vòng hợp âm.
 * Trả về danh sách để giao diện hiện được các ứng viên gần nhau, tránh việc
 * app quả quyết một giọng trong khi thực ra đang phân vân.
 */
export function detectKey(
  chords: readonly ParsedChord[],
  options: DetectKeyOptions = {},
): KeyCandidate[] {
  if (chords.length === 0) return []

  const weights = chords.map((_, index) => {
    const beats = options.beats?.[index]
    return beats !== undefined && beats > 0 ? beats : 1
  })

  const candidates: KeyCandidate[] = []

  for (let tonic = 0; tonic < 12; tonic += 1) {
    for (const scale of ['major', 'minor'] as const) {
      candidates.push({
        tonic: tonic as PitchClass,
        scale,
        score: scoreKey(chords, weights, tonic as PitchClass, scale),
        label: keyLabel(tonic as PitchClass, scale),
      })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

/** Giọng khớp nhất, hoặc null khi chưa có hợp âm nào. */
export function bestKey(
  chords: readonly ParsedChord[],
  options: DetectKeyOptions = {},
): KeyCandidate | null {
  return detectKey(chords, options)[0] ?? null
}

/**
 * App có đang phân vân giữa nhiều giọng không.
 *
 * Giọng trưởng và giọng thứ song song dùng chung bộ nốt nên điểm luôn sát nhau;
 * lúc đó nên nói rõ là chưa chắc thay vì quả quyết, để người dùng tự chọn.
 *
 * Ngưỡng tính theo thang điểm mới, nơi tổng điểm của một giọng khớp tốt nằm
 * quanh mức mười lăm — nên chênh dưới một điểm là sát nút thật.
 */
export function isAmbiguous(
  candidates: readonly KeyCandidate[],
  threshold = 1,
): boolean {
  if (candidates.length < 2) return false
  return candidates[0]!.score - candidates[1]!.score < threshold
}
