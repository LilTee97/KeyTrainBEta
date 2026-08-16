import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ParsedChord } from '../types'

/**
 * Hợp âm cuối cùng của bài.
 *
 * Vòng hợp âm của đoạn kết chạy bình thường; chỉ **hợp âm cuối** được đổi, vì
 * đó là tiếng đàn còn đọng lại sau khi bài đã hết. Hợp âm ba trơn ở chỗ đó
 * nghe như bị cắt ngang chứ không như một cái kết.
 *
 * ## Màu kết
 *
 * Hợp âm trưởng kết bằng **6/9** — hợp âm ba cộng cả quãng sáu và quãng chín,
 * không có quãng bảy. Hai nguồn nói cùng một điều:
 *
 * - Tài liệu phần 12.2 ghi chuỗi `C → CM7 → C6 → CM7`, tức quãng sáu là màu
 *   Khá Bự dùng trên chủ âm.
 * - Các nguồn dạy jazz piano gọi 6/9 là hợp âm kết tiêu chuẩn: bỏ quãng bảy
 *   nên **né hẳn câu hỏi trưởng hay át**, để lại một chủ âm ấm và mở.
 *
 * Hợp âm thứ kết bằng **m6** — cùng ý tưởng ấy chuyển sang màu thứ: thêm quãng
 * sáu vào hợp âm ba, không đụng tới quãng bảy.
 *
 * ## Vì sao có lựa chọn bỏ hết màu
 *
 * Có bài chỉ hợp khi kết bằng hợp âm ba trơn — nhạc mộc, hoặc bài mà cả đoạn
 * đã dày màu rồi nên chỗ kết cần sạch sẽ. Đó là quyết định của người chơi,
 * không phải chuyện đúng sai, nên KeyTrain bày cả hai chứ không chọn hộ.
 */

/** Cách kết bài. */
export type EndingMode =
  /** Đổi hợp âm cuối sang màu kết. */
  | 'colored'
  /** Gỡ hết màu, trả hợp âm cuối về hợp âm ba trơn. */
  | 'plain'

/** Hợp âm này có tính chất thứ không. */
function isMinorish(chord: ParsedChord): boolean {
  return chord.quality.intervals.includes(3)
}

/**
 * Đổi hợp âm cuối bài theo cách kết đã chọn.
 *
 * Giữ nguyên **nốt gốc** và **tính chất trưởng hay thứ** — đổi màu chứ không
 * đổi hợp âm. Trả `null` khi không có gì để đổi.
 */
export function endingChordFor(
  last: ParsedChord,
  mode: EndingMode,
): ParsedChord | null {
  const minor = isMinorish(last)

  const wanted =
    mode === 'plain' ? (minor ? 'min' : 'maj') : minor ? 'm6' : '69'

  if (last.quality.id === wanted) return null

  const quality = getChordQuality(wanted)
  if (!quality) return null

  /*
    Bỏ luôn nốt bass chồng dưới: hợp âm kết đứng trên nốt gốc của chính nó thì
    mới nghe ra là đã về nhà. Chồng trên bass khác là cách bấm cho câu còn đang
    đi tiếp.
  */
  const symbol = `${pitchClassName(last.root)}${quality.symbol}`
  return { root: last.root, quality, source: symbol, symbol }
}

/** Nhãn hiện trên giao diện, ví dụ `Cadd9 → C6/9`. */
export function endingChordLabel(
  last: ParsedChord,
  mode: EndingMode,
): string | null {
  const ending = endingChordFor(last, mode)
  return ending ? `${last.symbol} → ${ending.symbol}` : null
}
