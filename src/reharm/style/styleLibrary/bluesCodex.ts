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
  note: 'Codex biên soạn trên khung Blues Đức Thịnh 6/8: bass giữ nhịp, giai điệu nốt đơn/bè đôi xen hợp âm trong từng ô, nhắc câu rồi nghỉ. Tham khảo cách phối hợp hai tay ở Rockhouse và Robert Van; không chép timing 4/4. Fill/Run tự chọn đi thưa, không nén câu chạy. Chờ nghe duyệt.',
}
