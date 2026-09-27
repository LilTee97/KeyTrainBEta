import type { StylePattern } from '../types'
import { BLUES_DUC_THINH } from './bluesDucThinh'

// Khung Claude đã có; màu hợp âm và câu đáp mới là biên soạn Codex, không phải phiên âm video.
export const BLUES_CODEX_1: StylePattern = {
  ...BLUES_DUC_THINH,
  id: 'blues-codex-1', name: 'Blues Codex 1', family: 'blues-codex-1', familyName: 'Blues Codex 1',
  fillBeats: 1.5,
  cell: {
    ...BLUES_DUC_THINH.cell!,
    left: BLUES_DUC_THINH.cell!.left.map(hit => ({ ...hit })),
    // Nhắp rồi nhả: chừa chỗ cho câu đáp, giữ đúng vị trí đánh của khung gốc.
    right: BLUES_DUC_THINH.cell!.right.map(hit => ({ ...hit, durationBeats: 1.2 })),
  },
  note: 'Codex biên soạn trên khung Blues Đức Thịnh của Claude: bass giữ nhịp, hợp âm nhắp có màu 6/9 hoặc 7/9 theo hòa âm; xen câu đáp, nốt láy Blues, bè đôi và run. Fill theo chỗ nghỉ và mật độ; có thể chọn Fill/Run ở từng hợp âm. Chờ nghe duyệt.',
}
