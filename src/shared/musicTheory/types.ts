/**
 * Kiểu dữ liệu nền tảng cho toàn bộ phần nhạc lý của KeyTrain.
 */

/** Số hiệu nốt MIDI, 0-127. Đô giữa (C4) = 60. */
export type MidiNote = number

/**
 * Lớp cao độ (pitch class): 0-11, C = 0.
 * Bỏ qua quãng tám — dùng khi chỉ quan tâm "nốt gì", không quan tâm "ở quãng nào".
 */
export type PitchClass = number

/** Cách hiển thị nốt đen: thăng (C#) hay giáng (Db). */
export type AccidentalStyle = 'sharp' | 'flat'

/**
 * Một loại hợp âm (tính chất hợp âm), ví dụ maj7, m7b5, 9sus4.
 * Không gắn với nốt gốc cụ thể — nốt gốc được cung cấp khi dựng hợp âm.
 */
export interface ChordQuality {
  /** Định danh nội bộ, ổn định, dùng làm khoá tra cứu. */
  id: string
  /** Hậu tố chuẩn hiển thị sau tên nốt gốc, ví dụ 'm7' trong 'Am7'. */
  symbol: string
  /** Các hậu tố khác cũng chấp nhận khi đọc chuỗi hợp âm người dùng nhập. */
  aliases: readonly string[]
  /**
   * Các quãng tính bằng nửa cung so với nốt gốc, luôn bắt đầu bằng 0.
   * Vượt quá 11 nghĩa là nốt đó nằm ở quãng tám trên (nốt mở rộng 9, 11, 13).
   */
  intervals: readonly number[]
  /** Tên đầy đủ để hiển thị cho người dùng. */
  label: string
  /** Nhóm phân loại, dùng để lọc khi luyện tập và thống kê theo nhóm. */
  family: ChordFamily
}

export type ChordFamily =
  | 'triad'
  | 'sixth'
  | 'seventh'
  | 'extended'
  | 'altered'
  | 'suspended'
