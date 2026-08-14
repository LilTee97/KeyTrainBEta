/**
 * Ánh xạ phím máy tính sang nốt đàn.
 *
 * Chuột chỉ bấm được một phím tại một thời điểm, mà KeyTrain lại cần bấm
 * cả hợp âm cùng lúc — nên bàn phím máy tính là cách chơi hợp âm duy nhất
 * khi không có đàn MIDI.
 *
 * Bố cục theo quy ước quen thuộc của các phần mềm làm nhạc: hàng phím dưới
 * là một quãng tám, hàng phím trên là quãng tám kế tiếp, phím đen nằm đúng
 * vị trí tương ứng ở hàng số và hàng chữ phía trên.
 *
 * Dùng `KeyboardEvent.code` (vị trí phím vật lý) thay vì `key` để không phụ
 * thuộc vào kiểu gõ hay ngôn ngữ bàn phím người dùng đang bật.
 */
export const KEYBOARD_NOTE_OFFSETS: Readonly<Record<string, number>> = {
  // Hàng dưới — quãng tám thấp
  KeyZ: 0, // Đô
  KeyS: 1,
  KeyX: 2, // Rê
  KeyD: 3,
  KeyC: 4, // Mi
  KeyV: 5, // Fa
  KeyG: 6,
  KeyB: 7, // Sol
  KeyH: 8,
  KeyN: 9, // La
  KeyJ: 10,
  KeyM: 11, // Si
  Comma: 12,
  KeyL: 13,
  Period: 14,

  // Hàng trên — quãng tám cao hơn một quãng tám
  KeyQ: 12,
  Digit2: 13,
  KeyW: 14,
  Digit3: 15,
  KeyE: 16,
  KeyR: 17,
  Digit5: 18,
  KeyT: 19,
  Digit6: 20,
  KeyY: 21,
  Digit7: 22,
  KeyU: 23,
  KeyI: 24,
  Digit9: 25,
  KeyO: 26,
}

/**
 * Nốt tương ứng với một phím máy tính, hoặc null nếu phím đó không được
 * gán nốt nào.
 */
export function noteForKeyCode(
  code: string,
  baseNote: number,
): number | null {
  const offset = KEYBOARD_NOTE_OFFSETS[code]
  return offset === undefined ? null : baseNote + offset
}

/**
 * Có nên bỏ qua sự kiện bàn phím này không.
 *
 * Bỏ qua khi người dùng đang gõ vào ô nhập liệu, khi đang giữ phím tổ hợp
 * (để không nuốt mất phím tắt của trình duyệt), và khi phím tự lặp lại do
 * giữ lâu (chỉ tính lần nhấn đầu tiên).
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  if (event.repeat) return true
  if (event.ctrlKey || event.altKey || event.metaKey) return true

  // Nhận diện ô nhập liệu qua thuộc tính thay vì `instanceof HTMLElement`,
  // để hàm này chạy được cả ngoài trình duyệt (khi chạy test).
  const target = event.target as
    | { tagName?: unknown; isContentEditable?: unknown }
    | null

  if (target && typeof target === 'object') {
    const tag = typeof target.tagName === 'string' ? target.tagName : ''
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable === true) return true
  }

  return false
}
