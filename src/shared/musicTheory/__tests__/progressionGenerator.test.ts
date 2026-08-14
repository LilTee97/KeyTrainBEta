import { describe, expect, it } from 'vitest'
import {
  KEY_FLOW_OPTIONS,
  PROGRESSION_TEMPLATES,
  buildProgression,
  getProgressionTemplate,
  nextTonic,
  randomProgressionSteps,
  randomProgressionTemplate,
} from '../progressionGenerator'
import { degreesOf } from '../scales'

/** Nguồn ngẫu nhiên tất định. */
function fakeRandom(values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]
}

describe('danh sách vòng dựng sẵn', () => {
  it('mọi định danh đều duy nhất', () => {
    const ids = PROGRESSION_TEMPLATES.map((template) => template.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi bậc đều nằm trong khoảng 1 tới 7', () => {
    for (const template of PROGRESSION_TEMPLATES) {
      for (const step of template.steps) {
        expect(step.degree).toBeGreaterThanOrEqual(1)
        expect(step.degree).toBeLessThanOrEqual(7)
      }
    }
  })

  it('mọi vòng đều có ít nhất ba hợp âm', () => {
    for (const template of PROGRESSION_TEMPLATES) {
      expect(template.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('có cả vòng giọng trưởng lẫn giọng thứ', () => {
    const scales = new Set(
      PROGRESSION_TEMPLATES.map((template) => template.scale),
    )
    expect(scales).toContain('major')
    expect(scales).toContain('minor')
  })

  it('có mặt các vòng mà tài liệu phong cách nhắc tới', () => {
    for (const id of ['ii-V-I', 'ii-V-I-vi', 'canon', 'ii-V-i-minor']) {
      expect(getProgressionTemplate(id)).toBeDefined()
    }
  })

  it('tra định danh không có thì trả về undefined', () => {
    expect(getProgressionTemplate('không-có-thật')).toBeUndefined()
  })
})

describe('buildProgression', () => {
  it('dựng đúng vòng hai năm một trong giọng đô trưởng', () => {
    const chords = buildProgression(getProgressionTemplate('ii-V-I')!, 0, {
      useSevenths: true,
    })
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'Dm7',
      'G7',
      'Cmaj7',
    ])
  })

  it('dựng được vòng dạng hợp âm ba', () => {
    const chords = buildProgression(getProgressionTemplate('I-V-vi-IV')!, 0)
    expect(chords.map((chord) => chord.symbol)).toEqual(['C', 'G', 'Am', 'F'])
  })

  it('ghi đè tính chất hợp âm cho bậc năm của giọng thứ', () => {
    const chords = buildProgression(
      getProgressionTemplate('ii-V-i-minor')!,
      9,
      { useSevenths: true },
    )
    // Bậc năm phải là E7 chứ không phải Em7
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'Bm7b5',
      'E7',
      'Am7',
    ])
  })

  it('dịch giọng thì cả vòng dịch theo', () => {
    const template = getProgressionTemplate('I-V-vi-IV')!
    const inC = buildProgression(template, 0).map((chord) => chord.root)
    const inG = buildProgression(template, 7).map((chord) => chord.root)
    expect(inG).toEqual(inC.map((root) => (root + 7) % 12))
  })

  it('ký hiệu bậc không đổi khi dịch giọng', () => {
    const template = getProgressionTemplate('ii-V-I')!
    const inC = buildProgression(template, 0).map((chord) => chord.roman)
    const inF = buildProgression(template, 5).map((chord) => chord.roman)
    expect(inF).toEqual(inC)
  })

  it('mọi vòng dựng sẵn đều dựng được ở cả mười hai giọng', () => {
    for (const template of PROGRESSION_TEMPLATES) {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        const chords = buildProgression(template, tonic, { useSevenths: true })
        expect(chords).toHaveLength(template.steps.length)
      }
    }
  })
})

describe('nextTonic', () => {
  it('vòng quãng bốn đi lên năm nửa cung mỗi lượt', () => {
    // C → F → Bb → Eb
    expect(nextTonic(0, 'circleOfFourths')).toBe(5)
    expect(nextTonic(5, 'circleOfFourths')).toBe(10)
    expect(nextTonic(10, 'circleOfFourths')).toBe(3)
  })

  it('vòng quãng năm đi lên bảy nửa cung mỗi lượt', () => {
    // C → G → D → A
    expect(nextTonic(0, 'circleOfFifths')).toBe(7)
    expect(nextTonic(7, 'circleOfFifths')).toBe(2)
    expect(nextTonic(2, 'circleOfFifths')).toBe(9)
  })

  it('vòng quãng bốn và quãng năm đi hết đủ mười hai giọng', () => {
    for (const flow of ['circleOfFourths', 'circleOfFifths'] as const) {
      const visited = new Set<number>()
      let tonic = 0
      for (let step = 0; step < 12; step += 1) {
        visited.add(tonic)
        tonic = nextTonic(tonic, flow)
      }
      expect(visited.size).toBe(12)
      // Sau mười hai lượt phải quay về chỗ cũ
      expect(tonic).toBe(0)
    }
  })

  it('đi nửa cung, nguyên cung và quãng ba thứ đúng bước', () => {
    expect(nextTonic(0, 'chromatic')).toBe(1)
    expect(nextTonic(0, 'wholeStep')).toBe(2)
    expect(nextTonic(0, 'minorThird')).toBe(3)
  })

  it('nguyên cung quay lại sau sáu lượt', () => {
    let tonic = 0
    for (let step = 0; step < 6; step += 1) {
      tonic = nextTonic(tonic, 'wholeStep')
    }
    expect(tonic).toBe(0)
  })

  it('ngẫu nhiên không bao giờ lặp lại đúng giọng vừa luyện', () => {
    for (let value = 0; value < 1; value += 0.05) {
      expect(nextTonic(3, 'random', () => value)).not.toBe(3)
    }
  })

  it('ngẫu nhiên luôn cho ra giọng hợp lệ', () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const tonic = nextTonic(0, 'random')
      expect(tonic).toBeGreaterThanOrEqual(0)
      expect(tonic).toBeLessThan(12)
    }
  })

  it('mọi cách đi đều có mô tả cho người dùng', () => {
    expect(KEY_FLOW_OPTIONS).toHaveLength(6)
    for (const option of KEY_FLOW_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0)
      expect(option.description.length).toBeGreaterThan(0)
    }
  })
})

describe('randomProgressionSteps', () => {
  it('luôn bắt đầu từ bậc chủ âm', () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      expect(randomProgressionSteps(4, 'major')[0].degree).toBe(1)
    }
  })

  it('luôn kết bằng bậc năm hoặc bậc chủ âm', () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const steps = randomProgressionSteps(4, 'major')
      expect([1, 5]).toContain(steps[steps.length - 1].degree)
    }
  })

  it('đúng độ dài yêu cầu', () => {
    for (const length of [2, 3, 4, 6, 8]) {
      expect(randomProgressionSteps(length, 'major')).toHaveLength(length)
    }
  })

  it('không lặp lại ngay hợp âm vừa dùng', () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const steps = randomProgressionSteps(8, 'major')
      for (let index = 1; index < steps.length; index += 1) {
        expect(steps[index].degree).not.toBe(steps[index - 1].degree)
      }
    }
  })

  it('mọi bậc đều nằm trong gam', () => {
    const valid = new Set(degreesOf('minor').map((entry) => entry.degree))
    for (const step of randomProgressionSteps(8, 'minor')) {
      expect(valid.has(step.degree)).toBe(true)
    }
  })

  it('độ dài quá nhỏ vẫn ra vòng dùng được', () => {
    expect(randomProgressionSteps(0, 'major').length).toBeGreaterThanOrEqual(2)
    expect(randomProgressionSteps(1, 'major').length).toBeGreaterThanOrEqual(2)
  })

  it('cùng một nguồn ngẫu nhiên cho ra cùng một vòng', () => {
    const first = randomProgressionSteps(5, 'major', fakeRandom([0.3, 0.7]))
    const second = randomProgressionSteps(5, 'major', fakeRandom([0.3, 0.7]))
    expect(first).toEqual(second)
  })
})

describe('randomProgressionTemplate', () => {
  it('dựng được thành hợp âm thật', () => {
    const template = randomProgressionTemplate(4, 'major')
    const chords = buildProgression(template, 0, { useSevenths: true })
    expect(chords).toHaveLength(4)
    expect(chords[0].roman).toBe('Imaj7')
  })

  it('giữ đúng gam được yêu cầu', () => {
    expect(randomProgressionTemplate(4, 'minor').scale).toBe('minor')
  })
})
