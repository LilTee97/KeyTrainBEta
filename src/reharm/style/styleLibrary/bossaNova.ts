import type { StylePattern } from '../types'

/**
 * Điệu bossa nova.
 *
 * Vị trí tay phải lấy đúng theo tài liệu mục 2.1, vốn ghi theo vị trí móc đơn:
 * ô nhịp thứ nhất đánh vào móc 1, 3, 6, 8; ô nhịp thứ hai đánh vào móc 3 và 6.
 * Đổi sang phách (một móc đơn bằng nửa phách) thì ra các mốc dưới đây.
 *
 * Đây là chỗ khác hẳn ballad: mẫu tiết tấu **cố định**, lặp lại y hệt mỗi hai ô
 * nhịp bất kể hợp âm là gì. Cảm giác 3+3+2 lệch phách chính là thứ làm nên
 * bossa, nên phải học thuộc mẫu chứ không ứng biến.
 *
 * Lưu ý về tay trái: tài liệu chỉ mô tả là "nốt bass so le, cũng lệch phách"
 * chứ không notate rõ từng vị trí. Các mốc tay trái ở đây là cách đặt bass
 * bossa thông dụng, chưa phải trích nguyên từ nguồn.
 */
export const BOSSA_NOVA: StylePattern = {
  id: 'bossa-nova',
  name: 'Bossa Nova',
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  feel: 'syncopated-3-3-2',
  verified: true,
  sourceVideos: [
    '[Piano] Đệm hát Bossa Nova || Người Hãy Quên Em Đi - Mỹ Tâm',
  ],
  cell: {
    // Mẫu trải dài hai ô nhịp.
    lengthBeats: 8,
    right: [
      // Ô nhịp 1: móc 1, 3, 6, 8
      { beat: 0, durationBeats: 0.5, velocityScale: 1 },
      { beat: 1, durationBeats: 0.5, velocityScale: 0.9 },
      { beat: 2.5, durationBeats: 0.5, velocityScale: 0.95 },
      { beat: 3.5, durationBeats: 0.5, velocityScale: 0.85 },
      // Ô nhịp 2: móc 3, 6
      { beat: 5, durationBeats: 0.5, velocityScale: 0.9 },
      { beat: 6.5, durationBeats: 0.5, velocityScale: 0.95 },
    ],
    left: [
      { beat: 0, durationBeats: 1.5 },
      { beat: 2.5, durationBeats: 1.5, velocityScale: 0.9 },
      { beat: 4, durationBeats: 1.5 },
      { beat: 6.5, durationBeats: 1.5, velocityScale: 0.9 },
    ],
  },
  note: 'Mẫu cố định 3+3+2 lệch phách, lặp mỗi hai ô nhịp. Cả hai tay đều không rơi đúng phách mạnh đều đặn.',
}
