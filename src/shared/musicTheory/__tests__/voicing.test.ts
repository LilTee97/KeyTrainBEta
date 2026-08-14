import { describe, expect, it } from 'vitest'
import { getChordQuality } from '../chordDefinitions'
import { pitchClassOf } from '../pitch'
import {
  DEFAULT_KEYBOARD_HIGH,
  DEFAULT_KEYBOARD_LOW,
  VOICING_OPTIONS,
  buildVoicing,
  fitToKeyboard,
} from '../voicing'
import type { VoicingType } from '../voicing'

const maj = getChordQuality('maj')!
const maj7 = getChordQuality('maj7')!
const m7 = getChordQuality('m7')!
const m11 = getChordQuality('m11')!
const sus4 = getChordQuality('sus4')!

const ALL_TYPES = VOICING_OPTIONS.map((option) => option.id)

/** Lớp cao độ của một thế bấm, đã bỏ trùng và xếp tăng dần. */
function classesOf(notes: number[]): number[] {
  return [...new Set(notes.map(pitchClassOf))].sort((a, b) => a - b)
}

describe('quy tắc chung cho mọi kiểu thế bấm', () => {
  it.each(ALL_TYPES)("kiểu '%s' chỉ trả về một thế bấm cụ thể", (type) => {
    const notes = buildVoicing(60, maj7, type as VoicingType)

    // Đúng một cách bấm: không nốt nào lặp lại, và số nốt không vượt quá
    // số nốt của hợp âm.
    expect(new Set(notes).size).toBe(notes.length)
    expect(notes.length).toBeLessThanOrEqual(maj7.intervals.length)
    expect(notes.length).toBeGreaterThanOrEqual(3)
  })

  it.each(ALL_TYPES)("kiểu '%s' luôn xếp nốt tăng dần", (type) => {
    const notes = buildVoicing(60, m11, type as VoicingType)
    expect(notes).toEqual([...notes].sort((a, b) => a - b))
  })

  it.each(ALL_TYPES)("kiểu '%s' nằm lọt trong dải bàn phím", (type) => {
    for (let rootNote = 48; rootNote <= 59; rootNote += 1) {
      const notes = buildVoicing(rootNote, m11, type as VoicingType)
      for (const note of notes) {
        expect(note).toBeGreaterThanOrEqual(DEFAULT_KEYBOARD_LOW)
        expect(note).toBeLessThanOrEqual(DEFAULT_KEYBOARD_HIGH)
      }
    }
  })
})

describe('thế gốc', () => {
  it('xếp chồng từ nốt gốc lên', () => {
    expect(buildVoicing(60, maj, 'close')).toEqual([60, 64, 67])
    expect(buildVoicing(60, maj7, 'close')).toEqual([60, 64, 67, 71])
  })

  it('nốt gốc nằm dưới cùng', () => {
    const notes = buildVoicing(60, maj7, 'close')
    expect(pitchClassOf(notes[0])).toBe(0)
  })
})

describe('thế đảo', () => {
  it('đảo bậc 1 đưa nốt gốc lên trên', () => {
    const notes = buildVoicing(60, maj, 'inversion', { inversion: 1 })
    expect(notes).toEqual([64, 67, 72])
  })

  it('đảo bậc 2 đưa hai nốt dưới lên trên', () => {
    const notes = buildVoicing(60, maj, 'inversion', { inversion: 2 })
    expect(notes).toEqual([67, 72, 76])
  })

  it('giữ nguyên các lớp cao độ của hợp âm', () => {
    for (let times = 1; times <= 3; times += 1) {
      const inverted = buildVoicing(60, maj7, 'inversion', { inversion: times })
      expect(classesOf(inverted)).toEqual(classesOf([60, 64, 67, 71]))
    }
  })

  it('nốt gốc không còn nằm dưới cùng', () => {
    const notes = buildVoicing(60, maj7, 'inversion', { inversion: 1 })
    expect(pitchClassOf(notes[0])).not.toBe(0)
  })

  it('chọn ngẫu nhiên thì vẫn ra thế đảo chứ không phải thế gốc', () => {
    // random trả 0 nên chọn bậc đảo thấp nhất, tức là 1
    const notes = buildVoicing(60, maj7, 'inversion', { random: () => 0 })
    expect(pitchClassOf(notes[0])).not.toBe(0)
  })
})

describe('thế shell', () => {
  it('chỉ giữ gốc, bậc ba và bậc bảy', () => {
    // Cmaj7 shell = C E B, bỏ nốt sol
    expect(classesOf(buildVoicing(60, maj7, 'shell'))).toEqual([0, 4, 11])
  })

  it('bỏ đúng nốt bậc năm', () => {
    const notes = buildVoicing(60, m7, 'shell')
    expect(classesOf(notes)).not.toContain(7)
    expect(notes).toHaveLength(3)
  })

  it('hợp âm treo dùng nốt treo thay cho bậc ba', () => {
    const notes = buildVoicing(60, getChordQuality('7sus4')!, 'shell')
    // C7sus4 shell = C F Bb
    expect(classesOf(notes)).toEqual([0, 5, 10])
  })

  it('hợp âm ba không có bậc bảy nên giữ nguyên thế gốc', () => {
    expect(buildVoicing(60, maj, 'shell')).toEqual(
      buildVoicing(60, maj, 'close'),
    )
    expect(buildVoicing(60, sus4, 'shell')).toEqual(
      buildVoicing(60, sus4, 'close'),
    )
  })
})

describe('thế bỏ nốt gốc', () => {
  it('không còn nốt gốc trong thế bấm', () => {
    const notes = buildVoicing(60, maj7, 'rootless')
    expect(classesOf(notes)).not.toContain(0)
  })

  it('giữ lại đúng các nốt còn lại', () => {
    // Cmaj7 bỏ gốc còn E G B
    expect(classesOf(buildVoicing(60, maj7, 'rootless'))).toEqual([4, 7, 11])
  })

  it('hợp âm ba giữ nguyên thế gốc vì bỏ gốc thì quá mỏng', () => {
    expect(buildVoicing(60, maj, 'rootless')).toEqual(
      buildVoicing(60, maj, 'close'),
    )
  })
})

describe('thế drop 2', () => {
  it('hạ nốt cao thứ hai xuống một quãng tám', () => {
    // Cmaj7 thế gốc là C4 E4 G4 B4; hạ nốt sol xuống thành G3 C4 E4 B4
    const notes = buildVoicing(60, maj7, 'drop2')
    expect(classesOf(notes)).toEqual(classesOf([60, 64, 67, 71]))
    expect(notes[0]).toBe(55)
  })

  it('trải rộng hơn thế gốc', () => {
    const close = buildVoicing(60, maj7, 'close')
    const dropped = buildVoicing(60, maj7, 'drop2')
    const spread = (notes: number[]) => Math.max(...notes) - Math.min(...notes)
    expect(spread(dropped)).toBeGreaterThan(spread(close))
  })

  it('hợp âm ba giữ nguyên vì cần ít nhất bốn nốt', () => {
    expect(buildVoicing(60, maj, 'drop2')).toEqual(
      buildVoicing(60, maj, 'close'),
    )
  })
})

describe('fitToKeyboard', () => {
  it('giữ nguyên khi đã nằm trong dải', () => {
    expect(fitToKeyboard([60, 64, 67])).toEqual([60, 64, 67])
  })

  it('không tự ý dồn xuống quãng tám thấp nhất có thể', () => {
    // Cả 48 lẫn 72 đều nằm trong dải; hàm phải giữ đúng quãng tám được đưa vào
    expect(fitToKeyboard([72, 76, 79])).toEqual([72, 76, 79])
    expect(fitToKeyboard([48, 52, 55])).toEqual([48, 52, 55])
  })

  it('dịch ít nhất có thể khi phải dịch', () => {
    // Thấp hơn dải đúng một quãng tám thì chỉ nâng lên một quãng tám
    expect(fitToKeyboard([36, 40, 43])).toEqual([48, 52, 55])
  })

  it('nâng lên khi quá thấp', () => {
    expect(fitToKeyboard([24, 28, 31])).toEqual([48, 52, 55])
  })

  it('hạ xuống khi quá cao', () => {
    expect(fitToKeyboard([96, 100, 103])).toEqual([72, 76, 79])
  })

  it('giữ nguyên khoảng cách giữa các nốt', () => {
    const fitted = fitToKeyboard([24, 28, 31])
    expect(fitted[1] - fitted[0]).toBe(4)
    expect(fitted[2] - fitted[1]).toBe(3)
  })

  it('không vỡ với danh sách rỗng', () => {
    expect(fitToKeyboard([])).toEqual([])
  })

  it('chọn cách lòi ra ít nốt nhất khi không thể lọt trọn vẹn', () => {
    // Trải quá rộng so với dải bàn phím
    const fitted = fitToKeyboard([20, 110])
    const outside = fitted.filter(
      (note) => note < DEFAULT_KEYBOARD_LOW || note > DEFAULT_KEYBOARD_HIGH,
    )
    expect(outside.length).toBeLessThan(2)
  })
})

describe('mọi kiểu thế bấm đều giữ đúng màu hợp âm', () => {
  it.each(['close', 'inversion', 'drop2'] as VoicingType[])(
    "kiểu '%s' giữ nguyên toàn bộ nốt của hợp âm",
    (type) => {
      const notes = buildVoicing(60, maj7, type, { inversion: 1 })
      expect(classesOf(notes)).toEqual([0, 4, 7, 11])
    },
  )

  it('shell và rootless cố ý bỏ bớt nốt', () => {
    expect(classesOf(buildVoicing(60, maj7, 'shell')).length).toBeLessThan(4)
    expect(classesOf(buildVoicing(60, maj7, 'rootless')).length).toBeLessThan(4)
  })
})
