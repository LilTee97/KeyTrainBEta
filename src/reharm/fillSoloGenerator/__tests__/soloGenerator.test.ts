import { describe, expect, it } from 'vitest'
import { scaleTones } from '../../reharmEngine/keyDetection'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  DENSITY_OPTIONS,
  densityOption,
  ornamentLine,
  stepInScale,
} from '../graceNoteOrnamenter'
import { generateSolo, soloToTimeline } from '../soloGenerator'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

const C_MAJOR = scaleTones(0, 'major')

describe('stepInScale', () => {
  it('đi lên đúng nốt liền bậc trong gam', () => {
    // Trong gam đô trưởng, trên nốt Mi là nốt Fa, cách nửa cung
    expect(stepInScale(64, 'up', C_MAJOR)).toBe(65)
    // Trên nốt Đô là nốt Rê, cách một cung
    expect(stepInScale(60, 'up', C_MAJOR)).toBe(62)
  })

  it('đi xuống đúng nốt liền bậc trong gam', () => {
    expect(stepInScale(60, 'down', C_MAJOR)).toBe(59)
    expect(stepInScale(64, 'down', C_MAJOR)).toBe(62)
  })

  it('nốt láy luôn nằm trong gam', () => {
    for (let note = 60; note <= 72; note += 1) {
      for (const way of ['up', 'down'] as const) {
        const grace = stepInScale(note, way, C_MAJOR)
        expect(C_MAJOR.has(((grace % 12) + 12) % 12)).toBe(true)
      }
    }
  })

  it('cách nốt chính không quá một cung', () => {
    // Tài liệu ghi là một bậc, tức quãng hai trưởng hoặc thứ
    for (let note = 60; note <= 72; note += 1) {
      for (const way of ['up', 'down'] as const) {
        expect(Math.abs(stepInScale(note, way, C_MAJOR) - note)).toBeLessThanOrEqual(2)
      }
    }
  })

  it('không có gam thì lùi về một cung', () => {
    expect(stepInScale(60, 'up', new Set())).toBe(62)
    expect(stepInScale(60, 'down', new Set())).toBe(58)
  })
})

describe('ornamentLine', () => {
  const line = [60, 62, 64, 65, 67, 69, 71, 72]

  it('mật độ dày thì mọi nốt đều được láy', () => {
    const result = ornamentLine(line, { density: 'dense', scaleTones: C_MAJOR })
    expect(result.every((entry) => entry.grace !== null)).toBe(true)
  })

  it('mật độ vừa thì láy cách nốt', () => {
    const result = ornamentLine(line, { density: 'medium', scaleTones: C_MAJOR })
    const ornamented = result.filter((entry) => entry.grace !== null)
    expect(ornamented).toHaveLength(line.length / 2)
  })

  it('mật độ thưa thì láy ít nhất', () => {
    const dense = ornamentLine(line, { density: 'dense' })
    const sparse = ornamentLine(line, { density: 'sparse' })

    const count = (list: typeof dense) =>
      list.filter((entry) => entry.grace !== null).length
    expect(count(sparse)).toBeLessThan(count(dense))
  })

  it('giữ nguyên nốt chính, chỉ thêm nốt láy', () => {
    const result = ornamentLine(line, { density: 'dense' })
    expect(result.map((entry) => entry.main)).toEqual(line)
  })

  it('láy từ dưới thì nốt láy luôn thấp hơn nốt chính', () => {
    const result = ornamentLine(line, {
      direction: 'below',
      density: 'dense',
      scaleTones: C_MAJOR,
    })

    for (const entry of result) {
      expect(entry.grace!).toBeLessThan(entry.main)
    }
  })

  it('láy từ trên thì nốt láy luôn cao hơn nốt chính', () => {
    const result = ornamentLine(line, {
      direction: 'above',
      density: 'dense',
      scaleTones: C_MAJOR,
    })

    for (const entry of result) {
      expect(entry.grace!).toBeGreaterThan(entry.main)
    }
  })

  it('kiểu xen kẽ đổi chiều sau mỗi nốt được láy', () => {
    // Ở mật độ thưa, nếu đổi chiều theo mọi nốt thì sẽ luôn ra cùng một chiều
    const result = ornamentLine(line, {
      direction: 'mixed',
      density: 'sparse',
      scaleTones: C_MAJOR,
    })

    const ornamented = result.filter((entry) => entry.grace !== null)
    const directions = ornamented.map((entry) =>
      entry.grace! < entry.main ? 'down' : 'up',
    )
    expect(new Set(directions).size).toBe(2)
  })

  it('câu rỗng cho kết quả rỗng', () => {
    expect(ornamentLine([])).toEqual([])
  })

  it('ba mức mật độ đều có mô tả', () => {
    expect(DENSITY_OPTIONS).toHaveLength(3)
    for (const option of DENSITY_OPTIONS) {
      expect(option.description.length).toBeGreaterThan(0)
    }
  })

  it('mật độ không hợp lệ thì lùi về mức vừa', () => {
    expect(densityOption('không-có' as never).id).toBe('medium')
  })
})

describe('generateSolo', () => {
  const options = { beatsPerChord: 4, key: { tonic: 0, scale: 'major' as const } }

  it('vòng rỗng cho câu rỗng', () => {
    expect(generateSolo([], options)).toEqual([])
  })

  it('sinh nốt cho mọi hợp âm', () => {
    const solo = generateSolo(chords('C Am F G'), options)
    expect(solo.length).toBeGreaterThanOrEqual(8)
  })

  it('nốt chính luôn nằm trong hợp âm đang vang', () => {
    const list = chords('Cmaj7 Am7')
    const solo = generateSolo(list, { ...options, notesPerChord: 2 })

    const mains = solo.filter((note) => !note.isGrace)
    // Hai nốt đầu thuộc hợp âm thứ nhất, hai nốt sau thuộc hợp âm thứ hai
    const firstChordTones = new Set(
      list[0].quality.intervals.map((i) => (list[0].root + i) % 12),
    )
    expect(firstChordTones.has(mains[0].note % 12)).toBe(true)
    expect(firstChordTones.has(mains[1].note % 12)).toBe(true)
  })

  it('ưu tiên nốt màu hơn nốt gốc và quãng năm', () => {
    // Cmaj9 có nốt màu là bậc chín, tức nốt Rê
    const solo = generateSolo(chords('Cmaj9'), {
      ...options,
      notesPerChord: 1,
      density: 'sparse',
    })

    const main = solo.find((note) => !note.isGrace)!
    expect(main.note % 12).toBe(2)
  })

  it('câu nhạc đi từng bước, không nhảy quãng xa', () => {
    const solo = generateSolo(chords('C Am F G Em Dm'), options)
    const mains = solo.filter((note) => !note.isGrace)

    for (let index = 1; index < mains.length; index += 1) {
      expect(Math.abs(mains[index].note - mains[index - 1].note)).toBeLessThanOrEqual(9)
    }
  })

  it('mọi nốt nằm trong tầm giai điệu, cao hơn phần đệm', () => {
    for (const note of generateSolo(chords('C Am F G'), options)) {
      expect(note.note).toBeGreaterThanOrEqual(60)
      expect(note.note).toBeLessThanOrEqual(92)
    }
  })

  it('nốt láy rất ngắn và đứng ngay trước nốt chính', () => {
    const solo = generateSolo(chords('C Am'), { ...options, density: 'dense' })

    for (let index = 0; index < solo.length - 1; index += 1) {
      if (!solo[index].isGrace) continue

      expect(solo[index].durationBeats).toBeLessThan(0.3)
      expect(solo[index + 1].isGrace).toBe(false)
      expect(solo[index + 1].startBeat).toBeGreaterThan(solo[index].startBeat)
    }
  })

  it('các nốt xếp theo thời gian tăng dần', () => {
    const solo = generateSolo(chords('C Am F G'), options)

    for (let index = 1; index < solo.length; index += 1) {
      expect(solo[index].startBeat).toBeGreaterThanOrEqual(
        solo[index - 1].startBeat,
      )
    }
  })

  it('mật độ dày sinh nhiều nốt hơn mật độ thưa', () => {
    const dense = generateSolo(chords('C Am F G'), {
      ...options,
      density: 'dense',
    })
    const sparse = generateSolo(chords('C Am F G'), {
      ...options,
      density: 'sparse',
    })

    expect(dense.length).toBeGreaterThan(sparse.length)
  })
})

describe('soloToTimeline', () => {
  it('đổi được sang dòng thời gian', () => {
    const solo = generateSolo(chords('C Am'), {
      beatsPerChord: 4,
      key: { tonic: 0, scale: 'major' },
    })
    const timeline = soloToTimeline(solo)

    expect(timeline).toHaveLength(solo.length)
    for (const event of timeline) {
      expect(event.notes).toHaveLength(1)
      expect(event.hand).toBe('right')
      expect(event.velocity).toBeGreaterThan(0)
    }
  })

  it('nốt láy đánh nhẹ hơn nốt chính', () => {
    const solo = generateSolo(chords('C'), {
      beatsPerChord: 4,
      density: 'dense',
      key: { tonic: 0, scale: 'major' },
    })
    const timeline = soloToTimeline(solo)

    const graceIndex = solo.findIndex((note) => note.isGrace)
    const mainIndex = solo.findIndex((note) => !note.isGrace)

    expect(timeline[graceIndex].velocity).toBeLessThan(
      timeline[mainIndex].velocity,
    )
  })
})
