export interface DocStatus {
  file: string
  status: 'ok' | 'partial' | 'unread'
  usedAs: string
  note: string
}

/**
 * Tài liệu Licky đã thử đọc. `unread` / `partial` = cần file khác nếu muốn clone thêm.
 */
export const LICKY_DOCS: readonly DocStatus[] = [
  {
    file: 'Reference/52 Piano Jazz Blues Licks.mxl',
    status: 'ok',
    usedAs: '49 câu clone (tay phải)',
    note: 'Nhãn OCR lộn xộn; lấy hình nốt, không lấy tên thương mại.',
  },
  {
    file: 'Reference/phongcachdemhatkhabu.md',
    status: 'ok',
    usedAs: 'luật fill / nốt dẫn / dim7',
    note: 'Không có câu nốt để clone.',
  },
  {
    file: 'Reference/pianoimprovnotes.md',
    status: 'ok',
    usedAs: 'phrasing, ngũ cung, blues',
    note: 'Không có câu nốt để clone.',
  },
  {
    file: 'Reference/nguoi ay.mxl',
    status: 'partial',
    usedAs: 'chỗ lấy hơi + nốt dẫn',
    note: 'Bài hát, không phải sổ lick — chỉ đo thống kê.',
  },
  {
    file: 'Reference/nguoihayquenemdi.mxl',
    status: 'partial',
    usedAs: 'dò giọng',
    note: 'Bài hát, chưa tách câu lick.',
  },
  {
    file: 'Reference/mo.mxl',
    status: 'unread',
    usedAs: '',
    note: 'Không đọc được thành sổ lick (không nhãn câu). Đổi file lick-only nếu muốn clone.',
  },
  {
    file: 'Reference/hongkong1.mxl',
    status: 'unread',
    usedAs: '',
    note: 'Không đọc được thành sổ lick. Đổi file nếu muốn clone.',
  },
  {
    file: 'Reference/dieu ballad thay hai.md',
    status: 'unread',
    usedAs: '',
    note: 'Mật độ ballad, không phải câu nốt.',
  },
  {
    file: 'Reference/ballad kha bu.md',
    status: 'unread',
    usedAs: '',
    note: 'Mật độ ballad, không phải câu nốt.',
  },
]

export function blockedDocs(): DocStatus[] {
  return LICKY_DOCS.filter((doc) => doc.status !== 'ok')
}
