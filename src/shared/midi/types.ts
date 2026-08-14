import type { MidiNote } from '../musicTheory/types'

/** Nguồn phát ra nốt — đàn MIDI thật hay bàn phím ảo trên màn hình. */
export type NoteSource = 'hardware' | 'onscreen'

/** Tình trạng kết nối với hệ thống MIDI của trình duyệt. */
export type MidiStatus =
  /** Chưa yêu cầu quyền truy cập. */
  | 'idle'
  /** Đang chờ trình duyệt trả lời. */
  | 'requesting'
  /** Đã kết nối, có thể nhận nốt. */
  | 'ready'
  /** Trình duyệt không hỗ trợ Web MIDI (Safari, Firefox). */
  | 'unsupported'
  /** Người dùng từ chối cấp quyền. */
  | 'denied'
  /** Lỗi khác khi truy cập. */
  | 'error'

/** Thông tin rút gọn của một cổng MIDI vào, đủ để hiển thị và chọn. */
export interface MidiDeviceInfo {
  id: string
  name: string
  manufacturer: string
  connected: boolean
}

/** Một sự kiện nốt đã được chuẩn hoá, không phụ thuộc nguồn phát. */
export interface NoteEvent {
  note: MidiNote
  /** 0-127. Bàn phím ảo dùng một giá trị cố định. */
  velocity: number
  source: NoteSource
  /** Mốc thời gian theo `performance.now()`. */
  time: number
}
