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
    left: BLUES_DUC_THINH.cell!.left.map(hit => ({ ...hit })),
    // Nhắp rồi nhả: chừa chỗ cho câu đáp, giữ đúng vị trí đánh của khung gốc.
    right: BLUES_DUC_THINH.cell!.right.map(hit => ({ ...hit, durationBeats: 1.2 })),
  },
  note: 'Blues Codex 1: bass giữ nền Đức Thịnh 6/8; tay phải xen hợp âm với câu chạy liền 4–6 nốt, có câu qua vạch ô và nghỉ cuối câu. Soạn từ hướng câu ở Rockhouse 35/45/47 và Robert 31/82, không cần bật Fill. Thiếu chỗ thì bớt nốt, không tăng tốc. Chờ nghe duyệt.',
}
