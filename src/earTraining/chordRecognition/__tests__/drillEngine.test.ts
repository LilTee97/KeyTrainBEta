import { describe, expect, it } from 'vitest'
import { getChordQuality } from '../../../shared/musicTheory/chordDefinitions'
import { nameToMidi } from '../../../shared/musicTheory/pitch'
import type { DrillQuestion } from '../drillEngine'
import { checkAnswer, createQuestion } from '../drillEngine'

/** Sinh số ngẫu nhiên tất định, lặp lại theo danh sách cho trước. */
function fakeRandom(values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]
}

function notes(...names: string[]): number[] {
  return names.map((name) => {
    const note = nameToMidi(name)
    if (note === null) throw new Error(`Tên nốt sai: '${name}'`)
    return note
  })
}

/** Dựng câu hỏi cụ thể để test phần chấm bài. */
function question(root: number, qualityId: string): DrillQuestion {
  const quality = getChordQuality(qualityId)
  if (!quality) throw new Error(`Không có tính chất '${qualityId}'`)

  return {
    root,
    quality,
    notes: [],
    voicing: 'close',
    chordTones: quality.intervals.map((interval) => (root + interval) % 12),
    symbol: '',
  }
}

describe('createQuestion', () => {
  it('trả về null khi phạm vi luyện rỗng', () => {
    expect(createQuestion([])).toBeNull()
  })

  it('bỏ qua các định danh không tồn tại', () => {
    expect(createQuestion(['không-có-thật'])).toBeNull()
  })

  it('chỉ ra đề trong phạm vi được chọn', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = createQuestion(['maj7', 'm7'])
      expect(['maj7', 'm7']).toContain(result?.quality.id)
    }
  })

  it('nốt gốc luôn nằm trong dải dễ bấm', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = createQuestion(['maj'])!
      expect(result.notes[0]).toBeGreaterThanOrEqual(48)
      expect(result.notes[0]).toBeLessThanOrEqual(59)
    }
  })

  it('nốt phát mẫu đúng là các nốt của hợp âm', () => {
    const result = createQuestion(['maj7'], { random: fakeRandom([0]) })!
    // random = 0 nên chọn tính chất đầu tiên và nốt gốc thấp nhất (C3)
    expect(result.notes).toEqual([48, 52, 55, 59])
    expect(result.symbol).toBe('Cmaj7')
  })

  it('chỉ trả về một thế bấm cụ thể, không phải mọi cách bấm', () => {
    // Bốn nốt cho hợp âm bảy, không phải bốn lớp cao độ trải khắp bàn phím
    const result = createQuestion(['maj7'], { random: fakeRandom([0]) })!
    expect(result.notes).toHaveLength(4)
    expect(new Set(result.notes).size).toBe(4)
  })

  it('dựng thế bấm theo đúng kiểu được chọn', () => {
    const shell = createQuestion(['maj7'], {
      random: fakeRandom([0]),
      voicing: 'shell',
    })!
    // Shell bỏ bậc năm nên chỉ còn ba nốt
    expect(shell.notes).toHaveLength(3)
    expect(shell.voicing).toBe('shell')
  })

  it('ghi lại đủ các lớp cao độ của hợp âm dù thế bấm có bỏ bớt nốt', () => {
    const shell = createQuestion(['maj7'], {
      random: fakeRandom([0]),
      voicing: 'shell',
    })!
    // Thế bấm chỉ ba nốt, nhưng hợp âm vẫn có đủ bốn nốt để chấm bài
    expect(shell.chordTones).toHaveLength(4)
    expect(shell.chordTones.sort((a, b) => a - b)).toEqual([0, 4, 7, 11])
  })

  it('không hỏi trùng ngay câu vừa hỏi', () => {
    const previous = createQuestion(['maj'], { random: fakeRandom([0]) })!

    // Nguồn ngẫu nhiên luôn trả 0 sẽ ra đúng câu cũ; hàm phải thử lại
    // và cuối cùng vẫn phải trả về một câu hỏi hợp lệ.
    const next = createQuestion(['maj'], {
      avoid: previous,
      random: fakeRandom([0]),
    })
    expect(next).not.toBeNull()
  })

  it('đổi được câu khi phạm vi còn nhiều lựa chọn', () => {
    const previous = createQuestion(['maj'], { random: fakeRandom([0]) })!
    // Lần sau nguồn ngẫu nhiên trỏ tới nốt gốc khác
    const next = createQuestion(['maj'], {
      avoid: previous,
      random: fakeRandom([0, 0.9]),
    })!
    expect(next.root).not.toBe(previous.root)
  })
})

describe('checkAnswer — mức so theo lớp cao độ', () => {
  const cmaj7 = question(0, 'maj7')

  it('bấm đúng đủ nốt là đúng', () => {
    const result = checkAnswer(notes('C4', 'E4', 'G4', 'B4'), cmaj7)
    expect(result.correct).toBe(true)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
  })

  it('bấm ở quãng tám khác vẫn đúng', () => {
    expect(checkAnswer(notes('C2', 'E3', 'G5', 'B6'), cmaj7).correct).toBe(true)
  })

  it('bấm ở thế đảo vẫn đúng', () => {
    expect(checkAnswer(notes('E4', 'G4', 'B4', 'C5'), cmaj7).correct).toBe(true)
  })

  it('nhân đôi nốt ở quãng tám khác vẫn đúng', () => {
    expect(
      checkAnswer(notes('C3', 'C4', 'E4', 'G4', 'B4'), cmaj7).correct,
    ).toBe(true)
  })

  it('thiếu nốt là sai, và chỉ rõ nốt còn thiếu', () => {
    const result = checkAnswer(notes('C4', 'E4', 'G4'), cmaj7)
    expect(result.correct).toBe(false)
    expect(result.missing).toEqual([11])
    expect(result.extra).toEqual([])
  })

  it('thừa nốt là sai, và chỉ rõ nốt thừa', () => {
    const result = checkAnswer(notes('C4', 'E4', 'G4', 'B4', 'D5'), cmaj7)
    expect(result.correct).toBe(false)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([2])
  })

  it('chưa bấm gì thì chưa đúng', () => {
    const result = checkAnswer([], cmaj7)
    expect(result.correct).toBe(false)
    expect(result.missing).toHaveLength(4)
  })
})

describe('checkAnswer — mức bắt đúng thế nguyên vị', () => {
  const cmaj = question(0, 'maj')

  it('đúng nốt và nốt gốc nằm dưới cùng là đúng', () => {
    const result = checkAnswer(notes('C4', 'E4', 'G4'), cmaj, 'rootPosition')
    expect(result.correct).toBe(true)
    expect(result.wrongInversion).toBe(false)
  })

  it('đúng nốt nhưng sai thế bấm thì bị báo sai thế', () => {
    const result = checkAnswer(notes('E4', 'G4', 'C5'), cmaj, 'rootPosition')
    expect(result.correct).toBe(false)
    expect(result.wrongInversion).toBe(true)
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
  })

  it('sai nốt thì không tính là lỗi thế bấm', () => {
    const result = checkAnswer(notes('C4', 'E4'), cmaj, 'rootPosition')
    expect(result.wrongInversion).toBe(false)
  })

  it('nốt gốc ở quãng tám thấp hơn vẫn tính là thế nguyên vị', () => {
    const result = checkAnswer(notes('C2', 'E4', 'G4'), cmaj, 'rootPosition')
    expect(result.correct).toBe(true)
  })
})

describe('chấm bài cho hợp âm mở rộng', () => {
  it('chấm đúng hợp âm chín treo quãng bốn', () => {
    // D9sus4 = D G A C E
    const d9sus4 = question(2, '9sus4')
    expect(
      checkAnswer(notes('D4', 'G4', 'A4', 'C5', 'E5'), d9sus4).correct,
    ).toBe(true)
  })

  it('chấm đúng hợp âm mười một thứ', () => {
    const am11 = question(9, 'm11')
    expect(
      checkAnswer(notes('A3', 'C4', 'E4', 'G4', 'B4', 'D5'), am11).correct,
    ).toBe(true)
  })
})
