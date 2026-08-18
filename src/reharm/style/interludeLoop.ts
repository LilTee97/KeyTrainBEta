import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ParsedChord } from '../types'

/**
 * Giang tấu chạy trên **một vòng ngắn** chứ không mượn trọn cả đoạn.
 *
 * Bản đầu cho giang tấu mượn nguyên vòng hợp âm của một đoạn rồi lặp hai lượt.
 * Nghe thử thì hỏng hai chuyện cùng lúc: **dài lê thê**, và hết vòng thì đoạn
 * hát nhảy vào đột ngột chẳng có gì báo trước.
 *
 * Cách người ta làm thật, và cũng là cách người dùng chỉ ra: **nhặt ra bốn hợp
 * âm từ vòng của bài rồi ngẫu hứng trên đúng bốn hợp âm đó**, chọn sao cho hợp
 * âm cuối hút về hợp âm đầu tiên của đoạn kế tiếp. Bốn hợp âm là độ dài vừa đủ
 * để tai nhận ra một vòng tuần hoàn mà không kịp chán.
 *
 * Điều này khớp với chính tài liệu: phần 3 của `phongcachdemhatkhabu.md` ghi
 * lại một đoạn Intro độc tấu của Khá Bự đúng bốn hợp âm — `C – Fadd2/A –
 * Gadd2/B – C` — chứ không chạy nguyên vòng bài hát.
 */

/** Một khoảng liên tiếp trong vòng hợp âm, dùng làm vòng giang tấu. */
export interface LoopWindow {
  /** Chỉ số hợp âm đầu và cuối, tính trong mảng đã truyền vào. */
  from: number
  to: number
  /** Điểm sức hút của hợp âm cuối về hợp âm đích. */
  pull: number
}

/**
 * Hợp âm `from` hút về `to` mạnh cỡ nào, thang điểm 0-6.
 *
 * Xếp hạng theo sức hút hoà âm, mạnh nhất xuống yếu nhất:
 *
 * - **Bậc năm** là chỗ hút mạnh nhất, và mạnh thêm nữa nếu mang tính chất
 *   át (có quãng ba trưởng và bảy thứ) vì lúc đó có quãng ba cung đòi giải
 *   quyết. Đây là nền của mọi luật khác trong `phongcachdemhatkhabu.md`.
 * - **Bậc hai và bậc bốn** đều là hợp âm hạ át, dọn đường về chủ âm — yếu hơn
 *   bậc năm nhưng vẫn nghe ra hướng.
 * - **Cách nửa cung** hút bằng chuyển động bán cung, đúng nguyên lý hợp âm
 *   giảm lướt ở phần 3 của tài liệu.
 * - **Cùng nốt gốc** là tệ nhất: không có chuyển động nào thì không có gì báo
 *   hiệu sắp đổi đoạn.
 */
export function pullStrength(from: ParsedChord, to: ParsedChord): number {
  const distance = normalizePitchClass(from.root - to.root)

  if (distance === 0) return 0

  if (distance === 7) {
    const dominant =
      from.quality.intervals.includes(4) && from.quality.intervals.includes(10)
    return dominant ? 6 : 5
  }

  // Bậc hai và bậc bốn: hai hợp âm hạ át quen thuộc.
  if (distance === 2 || distance === 5) return 3

  // Cách nửa cung, từ trên xuống hoặc từ dưới lên.
  if (distance === 1 || distance === 11) return 2

  return 1
}

/**
 * Nhặt ra một vòng ngắn từ đoạn được mượn.
 *
 * Duyệt mọi khoảng `size` hợp âm liên tiếp rồi chấm điểm theo sức hút của hợp
 * âm cuối về hợp âm đích. Hoà thì **lấy khoảng nằm sau cùng**, vì đó là đoạn
 * người nghe vừa nghe xong nên vào lại thấy liền mạch nhất.
 *
 * Đoạn ngắn hơn `size` hợp âm thì lấy trọn — không có gì để chọn.
 */
export function chooseInterludeWindow(
  chords: readonly ParsedChord[],
  target: ParsedChord,
  size = 4,
): LoopWindow | null {
  if (chords.length === 0) return null

  if (chords.length <= size) {
    return {
      from: 0,
      to: chords.length - 1,
      pull: pullStrength(chords[chords.length - 1], target),
    }
  }

  let best: LoopWindow | null = null

  for (let from = 0; from + size <= chords.length; from += 1) {
    const to = from + size - 1
    const pull = pullStrength(chords[to], target)

    if (!best || pull >= best.pull) best = { from, to, pull }
  }

  return best
}

/**
 * Chọn 4 hợp âm từ điệp: ưu tiên móc lặp lại, cuối hút về đầu, hòa thì lấy đầu đoạn.
 */
export function chooseChorusLoop(
  chords: readonly ParsedChord[],
  size = 4,
): { from: number; to: number } | null {
  if (chords.length === 0) return null
  if (chords.length <= size) return { from: 0, to: chords.length - 1 }

  const keyOf = (from: number) =>
    chords
      .slice(from, from + size)
      .map((chord) => `${chord.root}`)
      .join('-')

  const counts = new Map<string, number>()
  for (let from = 0; from + size <= chords.length; from += 1) {
    const key = keyOf(from)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let best = { from: 0, to: size - 1, score: -1 }
  for (let from = 0; from + size <= chords.length; from += 1) {
    const to = from + size - 1
    const pull = pullStrength(chords[to]!, chords[from]!)
    const repeats = counts.get(keyOf(from)) ?? 1
    const score = pull + (repeats > 1 ? 3 : 0) + (from === 0 ? 2 : 0)
    if (score > best.score) best = { from, to, score }
  }
  return { from: best.from, to: best.to }
}
