import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Câu quay đầu (turnaround) ở cuối đoạn giang tấu.
 *
 * Giang tấu chạy hết vòng hợp âm rồi phải **trả bài lại cho người hát**. Chạy
 * hết vòng xong quay thẳng về đoạn sau thì không có gì báo hiệu, người hát
 * không biết khi nào vào — nên ô nhịp cuối được đổi thành một cụm hợp âm hút
 * mạnh về **hợp âm đầu tiên của đoạn kế tiếp**.
 *
 * Cụm dùng ở đây lấy thẳng từ `phongcachdemhatkhabu.md`:
 *
 * - Phần 8 gọi **vòng 2-5-1 lướt** là *"công thức mẹ"* — mượn cặp hợp âm bậc
 *   hai và bậc năm của một hợp âm bất kỳ rồi chèn ngay trước nó. Câu quay đầu
 *   chính là trường hợp riêng của nó: hợp âm đích là đoạn sắp vào.
 * - Phần 15 ghi lại đúng một câu quay đầu Khá Bự dạy — `Dm7 → G9sus4 → CM7 →
 *   C7` — trong đó **bậc năm mang màu 9sus4** rồi mới giải quyết. Đó là lý do
 *   ở đây bậc năm dùng `9sus4` chứ không dùng hợp âm bảy trơn: hợp âm treo là
 *   một trong năm kỹ thuật lõi của phong cách, và nó nghe "mềm" hơn đúng kiểu
 *   đệm hát nhạc Việt.
 * - Phần 11 (nguyên lý gốc) đòi voice leading mượt, nên cụm quay đầu đi theo
 *   quãng bốn xuống — bậc hai xuống bậc năm xuống hợp âm đích — là đường đi
 *   ngắn nhất.
 *
 * Với hợp âm đích **thứ**, cặp mượn đổi thành `iiø7 → V7♭9` đúng như phần 7
 * mô tả: nửa-giảm làm bậc hai của vòng 2-5-1 thứ, còn bậc năm mang ♭9 để nhấn
 * màu thứ. Hợp âm treo không dùng ở đây vì nó xoá mất quãng ba, tức xoá luôn
 * cái làm nên màu thứ của chỗ sắp về.
 *
 * ## Khi vòng đã kết sẵn ở bậc năm
 *
 * Nhiều bài kết đoạn ngay ở bậc năm — điệp khúc kết `G7` rồi vào lại `Cadd9`
 * chẳng hạn. Lúc đó **giữ nguyên hợp âm đang có, chỉ chèn thêm bậc hai phía
 * trước**: `G7` đã có quãng ba nên hút mạnh hơn `G9sus4`, thay nó bằng hợp âm
 * treo là làm yếu đi đúng cái mình đang muốn mạnh lên. Ô nhịp quá ngắn để chèn
 * thêm gì thì thôi không đụng vào — chỗ đó tự nó đã hút rồi.
 */

/** Dựng một hợp âm từ nốt gốc và định danh tính chất. */
function makeChord(root: PitchClass, qualityId: string): ParsedChord | null {
  const quality = getChordQuality(qualityId)
  if (!quality) return null

  const symbol = `${pitchClassName(root)}${quality.symbol}`
  return { root, quality, source: symbol, symbol }
}

/** Hợp âm này có tính chất thứ không. */
function isMinorish(chord: ParsedChord): boolean {
  return chord.quality.intervals.includes(3)
}

/**
 * Ô cuối của vòng đã là bậc năm của đoạn sau chưa.
 *
 * Đã là rồi thì nó tự hút về, việc còn lại chỉ là dọn đường cho nó bằng bậc
 * hai — không thay nó bằng hợp âm khác.
 */
export function alreadyLeadsInto(
  last: ParsedChord | undefined,
  target: ParsedChord,
): boolean {
  if (!last) return false
  return last.root === normalizePitchClass(target.root + 7)
}

export interface TurnaroundPlan {
  /** Các hợp âm sẽ chơi, xếp theo thứ tự. */
  chords: ParsedChord[]
  /** Mô tả ngắn cho giao diện, ví dụ `Dm7 → G9sus4`. */
  label: string
}

/**
 * Cụm hợp âm hút về `target`, gói trong `slots` khe hợp âm.
 *
 * `slots` là số hợp âm được phép dùng — một ô nhịp chia đôi thì được hai, ô
 * quá ngắn thì chỉ được một. Hai khe thì dùng đủ cặp bậc hai – bậc năm; một
 * khe thì bỏ bậc hai, giữ bậc năm, vì **bậc năm mới là chỗ tạo sức hút**, bậc
 * hai chỉ dọn đường cho nó.
 */
export function turnaroundInto(
  target: ParsedChord,
  slots: number,
  /** Hợp âm đang nằm ở ô cuối, nếu có — để biết vòng đã tự hút chưa. */
  last?: ParsedChord,
): TurnaroundPlan | null {
  if (slots < 1) return null

  const minor = isMinorish(target)
  const settled = alreadyLeadsInto(last, target)

  // Bậc năm của hợp âm đích: lên quãng năm đúng, tức bảy nửa cung.
  const dominantRoot = normalizePitchClass(target.root + 7) as PitchClass
  const dominant = settled ? last! : makeChord(dominantRoot, minor ? '7b9' : '9sus4')
  if (!dominant) return null

  if (slots < 2) {
    // Đang là bậc năm sẵn rồi mà không còn khe để chèn thêm thì khỏi đụng vào.
    return settled ? null : { chords: [dominant], label: dominant.symbol }
  }

  // Bậc hai của hợp âm đích: lên một cung.
  const supertonicRoot = normalizePitchClass(target.root + 2) as PitchClass
  const supertonic = makeChord(supertonicRoot, minor ? 'm7b5' : 'm7')
  if (!supertonic) {
    return settled ? null : { chords: [dominant], label: dominant.symbol }
  }

  return {
    chords: [supertonic, dominant],
    label: `${supertonic.symbol} → ${dominant.symbol}`,
  }
}

