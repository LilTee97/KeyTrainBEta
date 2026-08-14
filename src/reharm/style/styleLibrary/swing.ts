import type { StylePattern } from '../types'

/**
 * Điệu swing, còn gọi là shuffle.
 *
 * Lấy theo tài liệu mục 17.1:
 * - Tay trái: một nốt bass **ngân nguyên ô nhịp**, giữ vai trò nốt neo.
 * - Tay phải: bốn cặp "hợp âm – nốt đơn" xen kẽ, hợp âm rơi vào phách còn nốt
 *   đơn rơi vào chỗ nảy ngay sau.
 *
 * Cảm giác swing nằm ở chỗ hai móc đơn không chia đều mà theo tỉ lệ 2:1 — móc
 * đầu dài gấp đôi móc sau. Ở đây tỉ lệ đó được nướng thẳng vào vị trí các
 * tiếng đàn (chỗ nảy rơi vào 2/3 phách) thay vì dựng một bộ máy swing riêng,
 * nên phần đệm nghe đúng cảm giác mà không cần xử lý gì thêm.
 */

/** Chỗ nảy của cảm giác swing: hai phần ba phách, không phải một nửa. */
const SWING_OFFSET = 2 / 3

function swingPair(beat: number, velocityScale: number) {
  return [
    // Hợp âm rơi đúng phách, ngân dài
    {
      beat,
      durationBeats: SWING_OFFSET,
      velocityScale,
      voice: 'chord' as const,
    },
    // Nốt đơn ở chỗ nảy, ngắn và nhẹ
    {
      beat: beat + SWING_OFFSET,
      durationBeats: 1 - SWING_OFFSET,
      velocityScale: velocityScale * 0.7,
      voice: 'top' as const,
    },
  ]
}

export const SWING: StylePattern = {
  id: 'swing',
  name: 'Swing / Shuffle',
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  feel: 'swing',
  verified: true,
  sourceVideos: ['CẦU HÔN - Văn Mai Hương || Hướng Dẫn Đệm Hát Piano Tutorial'],
  cell: {
    lengthBeats: 4,
    right: [
      ...swingPair(0, 1),
      ...swingPair(1, 0.85),
      ...swingPair(2, 0.95),
      ...swingPair(3, 0.85),
    ],
    // Nốt bass ngân nguyên ô nhịp, làm điểm tựa cho phần đảo phách bên trên.
    left: [{ beat: 0, durationBeats: 4, velocityScale: 0.9 }],
  },
  note: 'Móc đơn chia theo tỉ lệ 2:1 tạo cảm giác đong đưa. Tay trái ngân bass nguyên ô nhịp, tay phải xen kẽ hợp âm và nốt đơn.',
}
