import type { StylePattern } from '../types'

/**
 * Điệu valse.
 *
 * Lấy đúng theo tài liệu mục 12.1, một trong hai video có notate rõ khuông
 * nhạc cả hai tay:
 * - Tay trái: một nốt bass (nốt đen) vào phách 1, rồi nghỉ trắng.
 * - Tay phải: nghỉ đen ở phách 1, rồi hai hợp âm chặn vào phách 2 và 3.
 *
 * Đúng công thức "bùm – chát – chát". Điểm đáng nhớ mà tài liệu chỉ ra: chữ ký
 * thật sự của điệu này nằm ở **tay phải** (nghỉ – hợp âm – hợp âm), còn tay
 * trái co giãn được tuỳ đoạn — đoạn cao trào có thể ngân bass suốt cả ô nhịp.
 */
export const VALSE: StylePattern = {
  id: 'valse',
  name: 'Valse',
  timeSignature: '3/4',
  beatsPerMeasure: 3,
  feel: 'waltz-oom-pah-pah',
  verified: true,
  sourceVideos: [
    'EM DẠO NÀY - NGỌT || Hướng Dẫn Đệm Hát Piano điệu Valse',
  ],
  cell: {
    lengthBeats: 3,
    right: [
      // Phách 1 để trống, đây mới là chữ ký của điệu
      { beat: 1, durationBeats: 1, velocityScale: 0.9 },
      { beat: 2, durationBeats: 1, velocityScale: 0.85 },
    ],
    left: [{ beat: 0, durationBeats: 1, velocityScale: 1 }],
  },
  note: 'Bùm chát chát: tay trái một nốt bass ở phách 1, tay phải nghỉ phách 1 rồi hai hợp âm ở phách 2 và 3.',
}
