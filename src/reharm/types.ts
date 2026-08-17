import type { ChordQuality, PitchClass } from '../shared/musicTheory/types'

/** Kiểu dữ liệu dùng chung cho phần tái hòa âm. */

/** Một hợp âm đã đọc được từ chuỗi người dùng nhập. */
export interface ParsedChord {
  root: PitchClass
  quality: ChordQuality
  /**
   * Nốt bass khác nốt gốc, cho hợp âm chồng trên bass kiểu 'C/E'.
   * Đây là lối tư duy trung tâm của phong cách đang mô hình hoá, nên nốt bass
   * được giữ tách bạch chứ không gộp vào tính chất hợp âm.
   */
  bass?: PitchClass
  /**
   * Số phách hợp âm này chiếm. Bỏ trống thì lấy nhịp đổi hợp âm chung của vòng.
   *
   * Chỉ hợp âm **lướt** mới ghi trường này: chúng mượn thời gian của hợp âm
   * đứng trước chứ không thêm ô nhịp mới, nên độ dài vòng giữ nguyên. Xem
   * `chordTiming.ts`.
   */
  beats?: number
  /**
   * Đây là hợp âm **lướt** được chèn vào, không thuộc vòng hợp âm gốc.
   *
   * Phần giai điệu dựa vào cờ này để bỏ qua chúng: hợp âm lướt là việc của
   * tay đệm, còn câu solo vẫn bám vòng hợp âm chính.
   */
  passing?: boolean
  /** Đúng chuỗi người dùng đã gõ, giữ lại để hiện lỗi và để hiển thị. */
  source: string
  /** Tên hợp âm sau khi chuẩn hoá, ví dụ 'Am7' hoặc 'C/E'. */
  symbol: string
  /**
   * Cùng gốc ngân nhiều ô: ghi đủ chuỗi màu trên lời, ví dụ `Cadd2 → CM7`.
   *
   * `symbol` vẫn là màu ô đầu (để phát / neo lời 1-1). Chuỗi này chỉ để đọc.
   */
  heldLabel?: string
  /** Thuộc một dãy cùng gốc đang xoay màu (C C C C). */
  holdRun?: boolean
  /** Tính chất từng ô khi một token ngân nhiều ô — để tách lúc phát. */
  heldQualities?: string[]
}

/** Một cụm chữ không đọc được thành hợp âm. */
export interface ChordParseError {
  /** Chuỗi gốc gây lỗi. */
  source: string
  /** Vị trí của cụm này trong danh sách cụm đã tách, đếm từ 0. */
  index: number
  reason: 'unknown-root' | 'unknown-quality'
}

/** Kết quả đọc cả một chuỗi hợp âm. */
export interface ChordSequence {
  chords: ParsedChord[]
  errors: ChordParseError[]
}
