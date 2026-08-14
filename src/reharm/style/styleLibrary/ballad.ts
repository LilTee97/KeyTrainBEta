import type { StylePattern } from '../types'

/**
 * Điệu ballad — điệu mặc định của kênh, dùng cho đa số bài.
 *
 * Điểm đặc biệt: `cell` bằng null. Sau khi xem trực tiếp ba bài ballad
 * (Nàng Thơ, Tháng Tư Là Lời Nói Dối Của Em, Hết Thời), tài liệu nguồn kết
 * luận ballad **không có một mẫu tiết tấu chuyển giao được giữa các bài** —
 * khác hẳn bossa nova hay valse vốn có đúng một mẫu dùng cho mọi bài.
 *
 * Thay vào đó, ballad vận hành theo nguyên tắc: **nốt càng dài khi hợp âm ngân
 * lâu, nốt càng ngắn khi hợp âm đổi dày, chỗ trống thì chèn câu nối**. Tức là
 * tiết tấu đệm phục vụ hòa âm, không phải một khuôn tiết tấu độc lập áp lên
 * mọi hợp âm.
 */
export const BALLAD: StylePattern = {
  id: 'ballad',
  name: 'Ballad',
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  feel: 'straight-block-chord',
  verified: true,
  sourceVideos: [
    'NÀNG THƠ - HOÀNG DŨNG || Hướng Dẫn Đệm Hát Piano',
    'HẾT THỜI - NGỌT || Hướng Dẫn Đệm Hát Piano Tutorial',
    'Tháng Tư Là Lời Nói Dối Của Em - Hà Anh Tuấn || Hướng Dẫn Đệm Hát Piano',
  ],
  cell: null,
  note: 'Hợp âm khối bám theo nhịp đổi hợp âm. Hợp âm ngân lâu thì nốt dài, hợp âm đổi dày thì nốt ngắn.',
}
