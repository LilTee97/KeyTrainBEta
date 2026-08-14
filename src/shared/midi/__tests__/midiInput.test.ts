import { describe, expect, it } from 'vitest'
import { parseMidiMessage } from '../midiInput'

/** Byte trạng thái gồm loại thông điệp ở 4 bit cao và kênh ở 4 bit thấp. */
function status(command: number, channel = 0): number {
  return command | channel
}

describe('parseMidiMessage', () => {
  it('đọc được lệnh bật nốt', () => {
    expect(parseMidiMessage([status(0x90), 60, 100])).toEqual({
      type: 'noteOn',
      note: 60,
      velocity: 100,
    })
  })

  it('đọc được lệnh tắt nốt', () => {
    expect(parseMidiMessage([status(0x80), 60, 0])).toEqual({
      type: 'noteOff',
      note: 60,
    })
  })

  it('coi lệnh bật nốt với lực nhấn 0 là lệnh tắt nốt', () => {
    // Nhiều đàn không gửi note-off mà gửi note-on lực nhấn 0.
    expect(parseMidiMessage([status(0x90), 60, 0])).toEqual({
      type: 'noteOff',
      note: 60,
    })
  })

  it('nhận nốt từ mọi kênh MIDI', () => {
    for (let channel = 0; channel < 16; channel += 1) {
      expect(parseMidiMessage([status(0x90, channel), 64, 80])).toEqual({
        type: 'noteOn',
        note: 64,
        velocity: 80,
      })
    }
  })

  it('nhận lệnh nhả toàn bộ nốt', () => {
    expect(parseMidiMessage([status(0xb0), 123, 0])).toEqual({
      type: 'allNotesOff',
    })
    expect(parseMidiMessage([status(0xb0), 120, 0])).toEqual({
      type: 'allNotesOff',
    })
  })

  it('bỏ qua các bộ điều khiển khác', () => {
    // Bàn đạp ngân (CC 64) chưa dùng tới ở bước này.
    expect(parseMidiMessage([status(0xb0), 64, 127])).toBeNull()
  })

  it('bỏ qua các thông điệp không liên quan tới nốt', () => {
    // Bánh xe cao độ, đổi tiếng đàn, đồng hồ đồng bộ.
    expect(parseMidiMessage([status(0xe0), 0, 64])).toBeNull()
    expect(parseMidiMessage([status(0xc0), 5])).toBeNull()
    expect(parseMidiMessage([0xf8])).toBeNull()
  })

  it('không vỡ khi dữ liệu rỗng hoặc thiếu', () => {
    expect(parseMidiMessage(null)).toBeNull()
    expect(parseMidiMessage(undefined)).toBeNull()
    expect(parseMidiMessage([])).toBeNull()
    expect(parseMidiMessage([0x90])).toBeNull()
  })

  it('coi lệnh bật nốt thiếu byte lực nhấn là lệnh tắt nốt', () => {
    expect(parseMidiMessage([status(0x90), 60])).toEqual({
      type: 'noteOff',
      note: 60,
    })
  })

  it('đọc được Uint8Array đúng như mảng số thường', () => {
    const data = new Uint8Array([status(0x90), 67, 90])
    expect(parseMidiMessage(data)).toEqual({
      type: 'noteOn',
      note: 67,
      velocity: 90,
    })
  })
})
