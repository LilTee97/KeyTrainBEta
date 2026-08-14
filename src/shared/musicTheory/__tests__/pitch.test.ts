import { describe, expect, it } from 'vitest'
import {
  MIDDLE_C,
  isBlackKey,
  isValidMidiNote,
  midiToName,
  nameToMidi,
  normalizePitchClass,
  octaveOf,
  parseNoteName,
  pitchClassDistance,
  pitchClassName,
  pitchClassOf,
  transpose,
} from '../pitch'

describe('normalizePitchClass', () => {
  it('giữ nguyên giá trị đã nằm trong 0-11', () => {
    expect(normalizePitchClass(0)).toBe(0)
    expect(normalizePitchClass(11)).toBe(11)
  })

  it('gập số vượt quá một quãng tám về 0-11', () => {
    expect(normalizePitchClass(12)).toBe(0)
    expect(normalizePitchClass(25)).toBe(1)
  })

  it('xử lý đúng số âm', () => {
    expect(normalizePitchClass(-1)).toBe(11)
    expect(normalizePitchClass(-12)).toBe(0)
    expect(normalizePitchClass(-13)).toBe(11)
  })
})

describe('pitchClassOf và octaveOf', () => {
  it('đô giữa là C4', () => {
    expect(MIDDLE_C).toBe(60)
    expect(pitchClassOf(MIDDLE_C)).toBe(0)
    expect(octaveOf(MIDDLE_C)).toBe(4)
  })

  it('nốt thấp nhất của MIDI là C-1', () => {
    expect(pitchClassOf(0)).toBe(0)
    expect(octaveOf(0)).toBe(-1)
  })

  it('nốt cao nhất của MIDI là G9', () => {
    expect(pitchClassOf(127)).toBe(7)
    expect(octaveOf(127)).toBe(9)
  })
})

describe('isBlackKey', () => {
  it('nhận ra phím trắng', () => {
    // C D E F G A B ở quãng tám của đô giữa
    for (const note of [60, 62, 64, 65, 67, 69, 71]) {
      expect(isBlackKey(note)).toBe(false)
    }
  })

  it('nhận ra phím đen', () => {
    // C# D# F# G# A#
    for (const note of [61, 63, 66, 68, 70]) {
      expect(isBlackKey(note)).toBe(true)
    }
  })
})

describe('pitchClassName', () => {
  it('mặc định dùng dấu thăng', () => {
    expect(pitchClassName(1)).toBe('C#')
    expect(pitchClassName(6)).toBe('F#')
  })

  it('dùng dấu giáng khi được yêu cầu', () => {
    expect(pitchClassName(1, 'flat')).toBe('Db')
    expect(pitchClassName(6, 'flat')).toBe('Gb')
  })

  it('nốt tự nhiên viết giống nhau ở cả hai kiểu', () => {
    expect(pitchClassName(0, 'sharp')).toBe('C')
    expect(pitchClassName(0, 'flat')).toBe('C')
  })
})

describe('midiToName', () => {
  it('ghép tên nốt với quãng tám', () => {
    expect(midiToName(60)).toBe('C4')
    expect(midiToName(61)).toBe('C#4')
    expect(midiToName(61, 'flat')).toBe('Db4')
    expect(midiToName(59)).toBe('B3')
  })
})

describe('parseNoteName', () => {
  it('đọc tên nốt kèm quãng tám', () => {
    expect(parseNoteName('C4')).toEqual({ pitchClass: 0, octave: 4 })
    expect(parseNoteName('F#3')).toEqual({ pitchClass: 6, octave: 3 })
    expect(parseNoteName('Bb2')).toEqual({ pitchClass: 10, octave: 2 })
  })

  it('đọc tên nốt không kèm quãng tám', () => {
    expect(parseNoteName('G')).toEqual({ pitchClass: 7, octave: null })
    expect(parseNoteName('Eb')).toEqual({ pitchClass: 3, octave: null })
  })

  it('chấp nhận chữ thường và khoảng trắng thừa', () => {
    expect(parseNoteName('  a4 ')).toEqual({ pitchClass: 9, octave: 4 })
  })

  it('chấp nhận ký hiệu thăng giáng Unicode', () => {
    expect(parseNoteName('C♯4')).toEqual({ pitchClass: 1, octave: 4 })
    expect(parseNoteName('D♭4')).toEqual({ pitchClass: 1, octave: 4 })
  })

  it('cộng dồn nhiều dấu hoá', () => {
    expect(parseNoteName('C##')).toEqual({ pitchClass: 2, octave: null })
    expect(parseNoteName('Cbb')).toEqual({ pitchClass: 10, octave: null })
  })

  it('đọc được quãng tám âm', () => {
    expect(parseNoteName('C-1')).toEqual({ pitchClass: 0, octave: -1 })
  })

  it('trả về null với chuỗi không hợp lệ', () => {
    expect(parseNoteName('H')).toBeNull()
    expect(parseNoteName('')).toBeNull()
    expect(parseNoteName('Cmaj7')).toBeNull()
  })
})

describe('nameToMidi', () => {
  it('đổi tên nốt kèm quãng tám thành số MIDI', () => {
    expect(nameToMidi('C4')).toBe(60)
    expect(nameToMidi('A4')).toBe(69)
    expect(nameToMidi('C-1')).toBe(0)
    expect(nameToMidi('G9')).toBe(127)
  })

  it('dùng quãng tám mặc định khi chuỗi không ghi', () => {
    expect(nameToMidi('C')).toBe(60)
    expect(nameToMidi('C', 3)).toBe(48)
  })

  it('trả về null khi vượt ngoài dải MIDI', () => {
    expect(nameToMidi('C-2')).toBeNull()
    expect(nameToMidi('C10')).toBeNull()
  })

  it('trả về null với tên nốt sai', () => {
    expect(nameToMidi('X4')).toBeNull()
  })

  it('đi vòng qua midiToName rồi quay lại vẫn ra số cũ', () => {
    for (let note = 0; note <= 127; note += 1) {
      expect(nameToMidi(midiToName(note))).toBe(note)
      expect(nameToMidi(midiToName(note, 'flat'))).toBe(note)
    }
  })
})

describe('transpose', () => {
  it('dịch nốt lên và xuống', () => {
    expect(transpose(60, 12)).toBe(72)
    expect(transpose(60, -1)).toBe(59)
  })
})

describe('isValidMidiNote', () => {
  it('chấp nhận số nguyên trong dải 0-127', () => {
    expect(isValidMidiNote(0)).toBe(true)
    expect(isValidMidiNote(127)).toBe(true)
  })

  it('từ chối số ngoài dải hoặc không nguyên', () => {
    expect(isValidMidiNote(-1)).toBe(false)
    expect(isValidMidiNote(128)).toBe(false)
    expect(isValidMidiNote(60.5)).toBe(false)
  })
})

describe('pitchClassDistance', () => {
  it('khoảng cách tới chính nó bằng 0', () => {
    expect(pitchClassDistance(0, 0)).toBe(0)
  })

  it('đi đường ngắn nhất qua ranh giới quãng tám', () => {
    // B lên C chỉ cách nửa cung, không phải 11 nửa cung
    expect(pitchClassDistance(11, 0)).toBe(1)
    expect(pitchClassDistance(0, 11)).toBe(1)
  })

  it('khoảng cách lớn nhất là quãng 4 tăng', () => {
    expect(pitchClassDistance(0, 6)).toBe(6)
  })
})
