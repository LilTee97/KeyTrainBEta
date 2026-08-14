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
  /** Đúng chuỗi người dùng đã gõ, giữ lại để hiện lỗi và để hiển thị. */
  source: string
  /** Tên hợp âm sau khi chuẩn hoá, ví dụ 'Am7' hoặc 'C/E'. */
  symbol: string
  /**
   * Nốt treo vang **trước** rồi mới giải quyết về hợp âm này.
   *
   * Đây là cách duy nhất đúng để dùng sus4: tài liệu ghi `Esus4 → E` và
   * `G7sus4 → G7`, tức hợp âm treo luôn giải quyết chứ không đứng yên. Nốt bậc
   * bốn treo đòi xuống bậc ba, giữ nguyên nó thì câu nhạc không bao giờ nghỉ.
   */
  suspension?: ChordQuality
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
