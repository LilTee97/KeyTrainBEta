import type { StylePattern } from '../types'
import { BLUES_DUC_THINH } from './bluesDucThinh'

// Khung Claude đã có; màu hợp âm và câu đáp mới là biên soạn Codex, không phải phiên âm video.
export const BLUES_CODEX_1: StylePattern = {
  ...BLUES_DUC_THINH,
  id: 'blues-codex-1', name: 'Blues Codex 1', family: 'blues-codex-1', familyName: 'Blues Codex 1',
  fillBeats: 1.5,
  autoFills: false,
  cell: {
    ...BLUES_DUC_THINH.cell!,
    // 28/9: neo rõ 1 và 4 trên sáu móc đơn; cú nhẹ ở 3 và 6 nối hai nhóm.
    // Rockhouse giữ bass dưới câu RH; đây là chuyển dụng sang Slow 6/8, không chép nhịp 4/4.
    left: [
      { ...BLUES_DUC_THINH.cell!.left[0] },
      { ...BLUES_DUC_THINH.cell!.left[1] },
      { ...BLUES_DUC_THINH.cell!.left[0], beat: 3, velocityScale: 0.95 },
      { ...BLUES_DUC_THINH.cell!.left[2] },
    ],
    // Chát phách 4 cùng bass; nhường khi RH đang chạy, bass vẫn giữ điểm tựa.
    right: BLUES_DUC_THINH.cell!.right.map(hit => ({ ...hit, beat: 3, durationBeats: 1.2 })),
  },
  note: 'Blues Codex 1: Slow 6/8 nhấn 1 và 4; hòa âm Blues theo giọng bài, tay phải xen hợp âm với câu chạy liền 4–6 nốt. Dạo/giang/kết soạn từ Rockhouse và Robert; có nghỉ, bè đôi và nốt kết ngân. Thiếu chỗ thì bớt nốt, không tăng tốc. Chờ nghe duyệt.',
}
