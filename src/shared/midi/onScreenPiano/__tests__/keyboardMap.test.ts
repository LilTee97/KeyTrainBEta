import { describe, expect, it } from 'vitest'
import { isBlackKey, midiToName } from '../../../musicTheory/pitch'
import {
  KEYBOARD_NOTE_OFFSETS,
  noteForKeyCode,
  shouldIgnoreKeyboardEvent,
} from '../keyboardMap'

describe('noteForKeyCode', () => {
  it('phím Z là chính nốt gốc', () => {
    expect(noteForKeyCode('KeyZ', 60)).toBe(60)
  })

  it('hàng phím dưới chạy đúng một quãng tám của gam đô trưởng', () => {
    const whiteRow = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM']
    const notes = whiteRow.map((code) => noteForKeyCode(code, 60))
    expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71])
  })

  it('các phím xen giữa cho đúng nốt đen', () => {
    for (const code of ['KeyS', 'KeyD', 'KeyG', 'KeyH', 'KeyJ']) {
      const note = noteForKeyCode(code, 60)
      expect(note).not.toBeNull()
      expect(isBlackKey(note!)).toBe(true)
    }
  })

  it('hàng phím trên cao hơn hàng dưới đúng một quãng tám', () => {
    expect(noteForKeyCode('KeyQ', 60)).toBe(
      noteForKeyCode('KeyZ', 60)! + 12,
    )
    expect(noteForKeyCode('KeyW', 60)).toBe(
      noteForKeyCode('KeyX', 60)! + 12,
    )
    expect(noteForKeyCode('KeyE', 60)).toBe(
      noteForKeyCode('KeyC', 60)! + 12,
    )
  })

  it('đổi nốt gốc thì mọi phím dịch theo', () => {
    for (const code of Object.keys(KEYBOARD_NOTE_OFFSETS)) {
      expect(noteForKeyCode(code, 48)).toBe(noteForKeyCode(code, 60)! - 12)
    }
  })

  it('trả về null với phím không được gán nốt', () => {
    expect(noteForKeyCode('Space', 60)).toBeNull()
    expect(noteForKeyCode('Escape', 60)).toBeNull()
    expect(noteForKeyCode('KeyA', 60)).toBeNull()
  })

  it('bấm được đủ nốt của một hợp âm ba', () => {
    // Đô trưởng: bấm cùng lúc Z, C, B
    const chord = ['KeyZ', 'KeyC', 'KeyB'].map((code) =>
      noteForKeyCode(code, 60),
    )
    expect(chord.map((note) => midiToName(note!))).toEqual([
      'C4',
      'E4',
      'G4',
    ])
  })

  it('phủ được hơn hai quãng tám', () => {
    const offsets = Object.values(KEYBOARD_NOTE_OFFSETS)
    expect(Math.min(...offsets)).toBe(0)
    expect(Math.max(...offsets)).toBeGreaterThanOrEqual(24)
  })
})

/** Dựng sự kiện bàn phím giả lập, chỉ với các thuộc tính hàm cần đọc. */
function keyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    repeat: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: null,
    ...overrides,
  } as KeyboardEvent
}

describe('shouldIgnoreKeyboardEvent', () => {
  it('nhận sự kiện bình thường', () => {
    expect(shouldIgnoreKeyboardEvent(keyEvent())).toBe(false)
  })

  it('bỏ qua phím tự lặp khi giữ lâu', () => {
    expect(shouldIgnoreKeyboardEvent(keyEvent({ repeat: true }))).toBe(true)
  })

  it('bỏ qua khi đang giữ phím tổ hợp, để không nuốt phím tắt', () => {
    expect(shouldIgnoreKeyboardEvent(keyEvent({ ctrlKey: true }))).toBe(true)
    expect(shouldIgnoreKeyboardEvent(keyEvent({ altKey: true }))).toBe(true)
    expect(shouldIgnoreKeyboardEvent(keyEvent({ metaKey: true }))).toBe(true)
  })

  it('bỏ qua khi con trỏ đang ở trong ô nhập liệu', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      const event = keyEvent({ target: { tagName } as unknown as EventTarget })
      expect(shouldIgnoreKeyboardEvent(event)).toBe(true)
    }
  })

  it('bỏ qua khi con trỏ ở trong vùng văn bản sửa được', () => {
    const event = keyEvent({
      target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget,
    })
    expect(shouldIgnoreKeyboardEvent(event)).toBe(true)
  })

  it('vẫn nhận khi con trỏ ở trên thẻ thường', () => {
    const event = keyEvent({
      target: { tagName: 'BUTTON' } as unknown as EventTarget,
    })
    expect(shouldIgnoreKeyboardEvent(event)).toBe(false)
  })
})
