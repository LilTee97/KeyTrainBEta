import { pitchClassName, normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Chọn **một gam** để ngẫu hứng trọn đoạn dạo đầu / kết bài / giang tấu.
 *
 * Hai lối chơi, cả hai đều có thật và không thay được nhau:
 *
 * - **Nhiều gam**: mỗi hợp âm một gam, đổi theo hoà âm. Đây là lối jazz, và
 *   engine đã làm sẵn — `chordPentatonic`, `blues`, hay gam kho `storeScale`.
 * - **Một gam**: một thang âm duy nhất chạy suốt cả vòng, mặc kệ hợp âm đổi.
 *   Đây là lối pop / rock / blues, và là lối dễ nghe ra câu nhạc hơn vì tai bám
 *   được một tập nốt cố định.
 *
 * Chỗ này lo lối thứ hai: **gam nào**. Trước đây lối một gam bị đóng cứng vào
 * ngũ cung của giọng bài hát, không chọn được — mà cùng một bài, ngũ cung thứ,
 * Dorian và Blues cho ba màu khác hẳn nhau.
 */

export interface ScaleFamily {
  id: string
  name: string
  /** Khoảng cách nửa cung từ nốt gốc gam. */
  steps: readonly number[]
}

/*
  Nốt blue là **bậc năm giáng**.

  Ghi theo item `duc-thinh-not-blues-la-bac-5-giang` bên PianoBrain — thầy Đức
  Thịnh nói nguyên văn: "Thực ra đó là điệu Blues nhưng mà nó không đánh nốt
  Blues thôi. Nốt Blues là nốt bậc 5 giáng." Phần còn lại của gam (ngũ cung thứ)
  là lý thuyết phổ thông, KHÔNG phải lời thầy, và không được dẫn như lời thầy.
*/
export const SCALE_FAMILIES: readonly ScaleFamily[] = [
  { id: 'blues', name: 'Blues', steps: [0, 3, 5, 6, 7, 10] },
  { id: 'pent-minor', name: 'Ngũ cung thứ', steps: [0, 3, 5, 7, 10] },
  { id: 'pent-major', name: 'Ngũ cung trưởng', steps: [0, 2, 4, 7, 9] },
  { id: 'aeolian', name: 'Thứ tự nhiên', steps: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'dorian', name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'ionian', name: 'Trưởng', steps: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
]

export interface ScaleChoice {
  /** `"blues:9"` — họ gam và nốt gốc. Dùng làm khoá lưu. */
  id: string
  label: string
  tonic: PitchClass
  familyId: string
  /** Lớp cao độ tuyệt đối, dùng thẳng làm nguồn nốt. */
  pitchClasses: PitchClass[]
  /**
   * Bao nhiêu phần nốt hợp âm của vòng nằm trong gam, từ 0 tới 1.
   *
   * Đây là thứ làm cho đề xuất "liên quan đến vòng hợp âm" chứ không phải một
   * danh sách gam chung chung: gam nào phủ được nhiều nốt của chính vòng đang
   * chơi thì câu chạy ít va vào hoà âm.
   */
  fit: number
  /** Những nốt hợp âm mà gam này KHÔNG có, viết bằng tên nốt. */
  missing: string[]
}

const pcsOf = (family: ScaleFamily, tonic: PitchClass): PitchClass[] =>
  family.steps.map((step) => normalizePitchClass(tonic + step))

/**
 * Đo độ khớp của một gam với vòng hợp âm.
 *
 * Đếm theo **nốt hợp âm có mặt**, không đếm theo hợp âm: một vòng đi qua `Dm9`
 * bốn lần thì Rê thứ đáng bốn phần, vì tai nghe nó bốn lần. Nốt bass khác nốt
 * gốc cũng tính — nó đang vang dưới tay trái.
 */
export function scaleFit(
  pitchClasses: readonly PitchClass[],
  chords: readonly ParsedChord[],
): { fit: number; missing: PitchClass[] } {
  const inScale = new Set(pitchClasses)
  let total = 0
  let hit = 0
  const missing = new Set<PitchClass>()

  for (const chord of chords) {
    const tones = new Set<PitchClass>(
      chord.quality.intervals.map((step) => normalizePitchClass(chord.root + step)),
    )
    if (chord.bass !== undefined) tones.add(chord.bass)
    for (const tone of tones) {
      total += 1
      if (inScale.has(tone)) hit += 1
      else missing.add(tone)
    }
  }

  return { fit: total === 0 ? 0 : hit / total, missing: [...missing] }
}

/**
 * Gam đề xuất cho một vòng hợp âm.
 *
 * Nốt gốc gam **không** duyệt cả mười hai: chỉ lấy chủ âm của bài, giọng song
 * song, và nốt gốc của những hợp âm có thật trong vòng. Duyệt cả mười hai thì
 * danh sách dài tới mức không ai đọc, mà những nốt gốc lạ thì gam dựng trên
 * chúng chẳng liên quan gì tới bài.
 *
 * Xếp hạng: khớp cao trước; hoà thì gam **ít nốt trước**, vì gam ít nốt để lại
 * nhiều chỗ trống hơn cho câu nhạc và khó chơi lạc hơn; hoà nữa thì theo thứ tự
 * họ gam trong bảng.
 */
export function suggestScales(
  chords: readonly ParsedChord[],
  key: { tonic: PitchClass; scale: ScaleType } | null,
  limit = 6,
): ScaleChoice[] {
  const roots = new Set<PitchClass>()
  if (key) {
    roots.add(key.tonic)
    roots.add(normalizePitchClass(key.tonic + (key.scale === 'minor' ? 3 : 9)))
  }
  for (const chord of chords) if (!chord.passing) roots.add(chord.root)
  if (roots.size === 0) return []

  const seen = new Set<string>()
  const out: ScaleChoice[] = []

  for (const tonic of roots) {
    for (const family of SCALE_FAMILIES) {
      const pitchClasses = pcsOf(family, tonic)
      const fingerprint = [...pitchClasses].sort((a, b) => a - b).join(',')
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)

      const { fit, missing } = scaleFit(pitchClasses, chords)
      out.push({
        id: `${family.id}:${tonic}`,
        familyId: family.id,
        tonic,
        label: `${pitchClassName(tonic, 'flat')} ${family.name}`,
        pitchClasses,
        fit,
        missing: missing.map((pc) => pitchClassName(pc, 'flat')),
      })
    }
  }

  const order = new Map(SCALE_FAMILIES.map((family, at) => [family.id, at]))
  out.sort(
    (a, b) =>
      b.fit - a.fit ||
      a.pitchClasses.length - b.pitchClasses.length ||
      (order.get(a.familyId) ?? 99) - (order.get(b.familyId) ?? 99),
  )
  return out.slice(0, limit)
}

/**
 * Gam Blues của giọng bài — gam mặc định của họ slow rock.
 *
 * Vì sao slow rock lấy Blues: thầy Đức Thịnh nói mẫu đệm slow rock của thầy
 * "thực ra là điệu Blues nhưng không đánh nốt Blues", và nốt còn thiếu ấy là
 * bậc năm giáng (item `duc-thinh-not-blues-la-bac-5-giang`). Tức tiết tấu đã là
 * Blues sẵn; đưa bậc năm giáng vào bè giai điệu là đủ ra chất, không phải đổi
 * gì ở tiết tấu. Đoạn dạo và giang tấu chính là chỗ bè giai điệu rảnh nhất.
 */
export function bluesChoice(
  key: { tonic: PitchClass; scale: ScaleType } | null,
): ScaleChoice | null {
  if (!key) return null
  const tonic =
    key.scale === 'minor' ? key.tonic : normalizePitchClass(key.tonic + 9)
  const family = SCALE_FAMILIES[0]!
  return {
    id: `${family.id}:${tonic}`,
    familyId: family.id,
    tonic,
    label: `${pitchClassName(tonic, 'flat')} ${family.name}`,
    pitchClasses: pcsOf(family, tonic),
    fit: 0,
    missing: [],
  }
}

/**
 * Điệu này có nên ngẫu hứng trên **một gam** ở đoạn không lời không.
 *
 * Bốn họ: slow rock, bolero, bossa nova, ballad. Căn cứ là số đo trên bốn bản
 * ký âm của Cà Pháo (nguồn `ca-phao-piano-covers` bên PianoBrain): **hai bài
 * bossa nova, một ballad, một slow rock nhịp 4/4** — không có bolero, và không
 * có bài slow rock nhịp kép 6/8 nào.
 *
 * Con số dưới đây là khoảng của **cả bốn bài**, cố ý không tách theo thể loại:
 * nhiều nhất hai bài một thể loại, và hai bài bossa đã tự trùm gần trọn khoảng
 * của cả corpus — nên cái nhìn như khác biệt thể loại không phân biệt được với
 * khác biệt giữa bài với bài.
 *
 * Thứ vững là **hình câu chạy**: nó gần như y hệt qua BA thể loại khác nhau,
 * chứ không phải qua bốn bài cùng một dòng. Đó là chỗ luật này đứng.
 *
 * | | nốt hợp âm ở phách mạnh | ngoài phách | câu rải hợp âm thuần |
 * |---|---|---|---|
 * | Cà Pháo, 4 bài | 56-69% | 49-59% | **2-9%** |
 * | KeyTrain, nguồn `chordTone` | **100%** | **99-100%** | **35-60%** |
 * | KeyTrain, nguồn theo gam | 53-55% | 49-50% | 4-16% |
 *
 * Nguồn `chordTone` khoá cứng vào nốt hợp âm ở **mọi** chỗ, nên không còn chỗ
 * nào để nốt hợp âm nổi bật lên — và nó rải hợp âm nhiều gấp bốn tới ba mươi
 * lần người thật. Nguồn theo gam thì khớp gần như chính xác, kể cả chỗ chênh
 * lệch nhỏ giữa phách mạnh và phách yếu.
 *
 * Đây là **mặc định**, không phải khoá: người dùng chọn gam khác hay chọn lối
 * nhiều gam thì lựa chọn của người dùng thắng.
 */
export function prefersSingleScale(style: { id: string; family: string }): boolean {
  return /slow-rock|bolero|bossa|ballad|^pop$/i.test(style.family) ||
    /ballad/i.test(style.id)
}

/** Điệu này có phải họ slow rock / nhịp kép không — chỗ Blues được ưu tiên. */
export function prefersBlues(style: {
  id: string
  family: string
  timeSignature: string
}): boolean {
  return (
    style.family.includes('slow-rock') ||
    style.id.includes('slow-rock') ||
    style.family.includes('blues')
  )
}
