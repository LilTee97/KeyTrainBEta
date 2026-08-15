import { stepInScale } from '../fillSoloGenerator/graceNoteOrnamenter'
import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
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
 * Câu báo hiệu vào hát — chạy ngón lên ngay trước khi đoạn mới bắt đầu.
 *
 * Đây là thứ bản đầu thiếu hẳn: giang tấu hết vòng rồi im, đoạn hát vào không
 * có gì dẫn nên nghe như nhảy cóc. Người đệm thật luôn đánh một câu lấy đà ở
 * phách cuối để người hát biết đường vào.
 *
 * Cách dựng lấy đúng ba nguyên tắc câu fill đã ghi trong `soloGenerator.ts`,
 * vốn rút ra từ tài liệu:
 *
 * 1. Nằm ở **cuối** khoảng thời gian, không trải đều.
 * 2. **Kết thúc ngay cạnh** nốt đích, cách một bậc — tai bị kéo sang chỗ mới.
 * 3. Đi **liền bậc theo âm giai của bài**, không nhảy quãng.
 *
 * Câu này cố ý **không chạm vào nốt đích**: nốt đích để dành cho phách mạnh
 * đầu đoạn mới, do phần đệm của đoạn đó đánh. Chạm trước là mất chỗ nhấn.
 *
 * Hướng đi lên vì đi lên nghe như một câu hỏi mở, kéo tai về phía trước; đi
 * xuống nghe như kết thúc, đúng ngược cái đang cần.
 */
export function leadInNotes(options: {
  /** Nốt gốc của hợp âm đầu tiên ở đoạn sắp vào. */
  target: PitchClass
  /** Các nốt thuộc âm giai của bài; rỗng thì đi từng nửa cung. */
  tones: ReadonlySet<PitchClass>
  /** Phách bắt đầu của câu, tính trong dòng thời gian của cụm quay đầu. */
  startBeat: number
  /** Câu dài bao nhiêu phách. */
  beats: number
  /** Bao nhiêu nốt; ít quá không nghe ra hướng, nhiều quá thành câu solo. */
  count?: number
}): { note: MidiNote; startBeat: number; durationBeats: number }[] {
  const { target, tones, startBeat, beats, count = 4 } = options
  if (beats <= 0 || count < 1) return []

  /*
    Neo quanh Đô quãng tám thứ năm — vùng người ta chạy câu dẫn, nghe rõ mà
    không lấn xuống chỗ tay trái.

    Phải **chọn quãng tám gần tâm nhất** chứ không cộng thẳng nốt gốc vào: cộng
    thẳng thì đích Đô cho câu ở C5 còn đích Si cho câu ở B5, chênh nhau gần cả
    quãng tám, nên cùng một bài mà mỗi lần vào hát câu báo hiệu lại nằm một
    tầm khác. Nốt gốc quá nửa quãng tám thì hạ xuống tầng dưới cho gần tâm.
  */
  const pitchClass = ((target % 12) + 12) % 12
  const landing = pitchClass <= 6 ? 72 + pitchClass : 60 + pitchClass

  // Dựng ngược từ nốt kết rồi lật lại, vì chỗ neo là điểm kết chứ không phải điểm đầu.
  const line: MidiNote[] = [stepInScale(landing, 'down', tones)]
  while (line.length < count) {
    line.unshift(stepInScale(line[0], 'down', tones))
  }

  const each = beats / line.length

  return line.map((note, index) => ({
    note,
    startBeat: startBeat + index * each,
    // Hở một chút giữa các nốt để nghe ra từng bước chân, không thành vệt liền.
    durationBeats: each * 0.85,
  }))
}
