import { describe, expect, it } from 'vitest'
import {
  PROGRESSION_TEMPLATES,
  getProgressionTemplate,
} from '../../../shared/musicTheory/progressionGenerator'
import {
  DEFAULT_KEYBOARD_HIGH,
  DEFAULT_KEYBOARD_LOW,
} from '../../../shared/musicTheory/voicing'
import { checkAnswer } from '../../shared/chordTask'
import { createSession, keyLabelOf, secondsPerChord } from '../progressionEngine'

const iiVI = getProgressionTemplate('ii-V-I')!

describe('createSession', () => {
  it('dựng đúng số bước theo khuôn vòng', () => {
    expect(createSession(iiVI, 0).steps).toHaveLength(3)
  })

  it('dựng đúng các hợp âm của vòng hai năm một trong giọng đô', () => {
    const session = createSession(iiVI, 0)
    expect(session.steps.map((step) => step.symbol)).toEqual([
      'Dm7',
      'G7',
      'Cmaj7',
    ])
  })

  it('giữ ký hiệu bậc La Mã cho từng bước', () => {
    const session = createSession(iiVI, 0)
    expect(session.steps.map((step) => step.roman)).toEqual([
      'iim7',
      'V7',
      'Imaj7',
    ])
  })

  it('dùng hợp âm ba khi tắt hợp âm bảy', () => {
    const session = createSession(iiVI, 0, { useSevenths: false })
    expect(session.steps.map((step) => step.symbol)).toEqual(['Dm', 'G', 'C'])
  })

  it('ghi tên giọng cho người đọc', () => {
    expect(createSession(iiVI, 5).keyLabel).toBe('F trưởng')
    expect(
      createSession(getProgressionTemplate('ii-V-i-minor')!, 9).keyLabel,
    ).toBe('A thứ')
  })

  it('mỗi bước là một thế bấm cụ thể, không phải tập nốt trừu tượng', () => {
    for (const step of createSession(iiVI, 0).steps) {
      expect(new Set(step.notes).size).toBe(step.notes.length)
      expect(step.notes.length).toBeLessThanOrEqual(step.quality.intervals.length)
    }
  })

  it('mọi nốt của cả vòng đều nằm trên bàn phím', () => {
    for (const template of PROGRESSION_TEMPLATES) {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        const session = createSession(template, tonic, { useSevenths: true })

        for (const step of session.steps) {
          for (const note of step.notes) {
            expect(note).toBeGreaterThanOrEqual(DEFAULT_KEYBOARD_LOW)
            expect(note).toBeLessThanOrEqual(DEFAULT_KEYBOARD_HIGH)
          }
        }
      }
    }
  })

  it('giữ đủ nốt hợp âm để chấm bài dù thế bấm bỏ bớt nốt', () => {
    const session = createSession(iiVI, 0, { voicing: 'shell' })

    for (const step of session.steps) {
      // Shell chỉ bấm ba nốt nhưng hợp âm bảy vẫn có đủ bốn nốt để chấm
      expect(step.chordTones).toHaveLength(4)
      expect(step.notes).toHaveLength(3)
    }
  })

  it('bấm đúng thế bấm được gợi ý thì chấm là đúng', () => {
    for (const step of createSession(iiVI, 0).steps) {
      expect(checkAnswer(step.notes, step).correct).toBe(true)
    }
  })

  it('dịch giọng thì cả vòng dịch theo', () => {
    const inC = createSession(iiVI, 0).steps.map((step) => step.root)
    const inG = createSession(iiVI, 7).steps.map((step) => step.root)
    expect(inG).toEqual(inC.map((root) => (root + 7) % 12))
  })

  it('ký hiệu bậc không đổi khi dịch giọng', () => {
    const inC = createSession(iiVI, 0).steps.map((step) => step.roman)
    const inEb = createSession(iiVI, 3).steps.map((step) => step.roman)
    expect(inEb).toEqual(inC)
  })
})

describe('keyLabelOf', () => {
  it('ghi rõ trưởng hay thứ', () => {
    expect(keyLabelOf(0, 'major')).toBe('C trưởng')
    expect(keyLabelOf(0, 'minor')).toBe('C thứ')
  })
})

describe('secondsPerChord', () => {
  it('một hợp âm chiếm trọn một ô nhịp', () => {
    // 120 BPM, nhịp bốn bốn: mỗi phách nửa giây, mỗi ô nhịp hai giây
    expect(secondsPerChord(120, 4)).toBe(2)
  })

  it('nhịp độ nhanh hơn thì hợp âm ngắn lại', () => {
    expect(secondsPerChord(240, 4)).toBe(1)
    expect(secondsPerChord(60, 4)).toBe(4)
  })

  it('nhịp ba bốn ngắn hơn nhịp bốn bốn ở cùng nhịp độ', () => {
    expect(secondsPerChord(120, 3)).toBeLessThan(secondsPerChord(120, 4))
  })

  it('không chia cho không khi nhận giá trị không hợp lệ', () => {
    expect(Number.isFinite(secondsPerChord(0, 4))).toBe(true)
    expect(Number.isFinite(secondsPerChord(120, 0))).toBe(true)
  })
})
