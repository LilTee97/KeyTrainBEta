import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { LickContext } from '../soloVocabulary'
import {
  LICKS,
  chordBlues,
  chordMaterial,
  chordPentatonic,
  getLick,
  ladderOf,
  nearestStep,
  resolvesUpFourth,
  stableToneOf,
  strongBeatPcs,
} from '../soloVocabulary'

const chordOf = (text: string) => parseChordInput(text).chords[0]

function contextFor(text: string, overrides: Partial<LickContext> = {}) {
  const chord = chordOf(text)
  return {
    chord,
    next: null,
    startBeat: 0,
    beats: 4,
    from: 74,
    low: 62,
    high: 90,
    scaleTones: new Set<never>(),
    previousShape: [],
    notesPerBeat: 1.4,
    material: chordMaterial(chord),
    ...overrides,
  } as LickContext
}

describe('chất liệu nốt lấy từ hợp âm đang vang', () => {
  it('nốt hợp âm gồm 1-3-5-7 và thêm bậc chín', () => {
    // pianoimprovnotes.md mục 3.1 liệt kê đúng bộ này
    const material = new Set(chordMaterial(chordOf('Cmaj7')))
    expect(material).toEqual(new Set([0, 4, 7, 11, 2]))
  })

  it('ngũ cung đổi trưởng thứ theo tính chất hợp âm', () => {
    expect(new Set(chordPentatonic(chordOf('C')))).toEqual(
      new Set([0, 2, 4, 7, 9]),
    )
    expect(new Set(chordPentatonic(chordOf('Am7')))).toEqual(
      new Set([9, 0, 2, 4, 7]),
    )
  })

  it('ngũ cung dựng trên nốt gốc hợp âm chứ không trên chủ âm', () => {
    // Cùng giọng Đô trưởng nhưng hai hợp âm cho hai bộ nốt khác nhau
    expect(new Set(chordPentatonic(chordOf('F')))).not.toEqual(
      new Set(chordPentatonic(chordOf('C'))),
    )
  })

  it('thang blues có nốt blue ở quãng năm giảm tính từ gốc hợp âm', () => {
    expect(chordBlues(chordOf('C7'))).toContain(6)
    expect(chordBlues(chordOf('F7'))).toContain(11)
  })

  it('nốt kết câu là nốt ổn định của hợp âm', () => {
    expect(stableToneOf(chordOf('Cmaj7'))).toBe(4)
    expect(stableToneOf(chordOf('Am7'))).toBe(0)
  })

  it('phách mạnh: ao nốt từng thầy', () => {
    expect(strongBeatPcs(chordOf('Cmaj7'), 'linh-nhi')).toEqual([4, 0, 7])
    expect(strongBeatPcs(chordOf('Am7'), 'linh-nhi')).toEqual([0, 9, 4])
    expect(strongBeatPcs(chordOf('Cmaj7'), 'ton-hung')).toEqual([0, 4, 7, 11])
    expect(strongBeatPcs(chordOf('G7'), 'ton-hung')).toEqual([7, 11, 2, 5])
    expect(strongBeatPcs(chordOf('Cmaj7'), 'ca-phao')[0]).toBe(2)
  })
})

describe('bậc thang nốt', () => {
  it('chỉ gồm nốt được phép, xếp tăng dần, nằm trong tầm', () => {
    const ladder = ladderOf([0, 4, 7], 60, 72)

    expect(ladder).toEqual([60, 64, 67, 72])
    for (let index = 1; index < ladder.length; index += 1) {
      expect(ladder[index]).toBeGreaterThan(ladder[index - 1])
    }
  })

  it('tìm được bậc gần một nốt nhất', () => {
    expect(nearestStep([60, 64, 67, 72], 66)).toBe(2)
  })
})

describe('danh sách mẫu câu', () => {
  it('mọi mẫu đều ghi rõ nguồn', () => {
    for (const lick of LICKS) {
      expect(lick.source.length).toBeGreaterThan(0)
      expect(lick.label.length).toBeGreaterThan(0)
    }
  })

  it('định danh không trùng nhau', () => {
    const ids = LICKS.map((lick) => lick.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tra được theo định danh', () => {
    expect(getLick('sweep')?.label).toBe('Quét ngũ cung')
    expect(getLick('khong-co')).toBeUndefined()
  })
})

describe('mọi mẫu câu đều bám hợp âm đang vang', () => {
  /*
    Đây là bất biến quan trọng nhất của cả module, và là chỗ bản trước hỏng:
    câu nhạc phải dùng chất liệu của hợp âm đang vang, không phải của hợp âm
    khác hay của chủ âm bài hát.
  */
  const material = chordMaterial(chordOf('Fmaj7'))

  for (const lick of LICKS.filter((entry) => entry.id !== 'breath')) {
    it(`${lick.label} chỉ dùng chất liệu đã cho`, () => {
      const context = contextFor('Fmaj7', {
        beats: 4,
        material,
        previousShape: [-1, -1, 1],
      })
      const built = lick.build(context)

      /*
        Bất biến thật là: **nốt chính** phải bám hợp âm. Nốt tô điểm được phép
        ra ngoài hoà âm — nốt dẫn và nốt kẹp nửa cung sống nhờ đúng điều đó, và
        chúng luôn được đánh nhẹ nên tai nghe ra ngay là nốt lướt.
      */
      for (const note of built.notes.filter((entry) => !entry.soft)) {
        expect(material).toContain(note.note % 12)
      }
    })

    it(`${lick.label} nằm gọn trong tầm và trong khoảng thời gian được cấp`, () => {
      const context = contextFor('Fmaj7', {
        beats: 4,
        material,
        previousShape: [-1, -1, 1],
      })
      const built = lick.build(context)

      for (const note of built.notes) {
        expect(note.note).toBeGreaterThanOrEqual(context.low - 1)
        expect(note.note).toBeLessThanOrEqual(context.high)
        expect(note.startBeat).toBeGreaterThanOrEqual(0)
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(4.3)
      }
    })
  }
})

describe('mẫu câu nghỉ lấy hơi', () => {
  it('không sinh nốt nào', () => {
    expect(getLick('breath')!.build(contextFor('C')).notes).toEqual([])
  })
})

describe('mẫu nhắc lại mô-típ', () => {
  it('không có mô-típ trước thì không sinh gì', () => {
    const built = getLick('echo')!.build(
      contextFor('C', { previousShape: [] }),
    )
    expect(built.notes).toEqual([])
  })

  it('giữ nguyên đường nét của mô-típ trước', () => {
    const shape = [-1, -1, 2]
    const built = getLick('echo')!.build(
      contextFor('C', { previousShape: shape }),
    )

    expect(built.notes).toHaveLength(shape.length + 1)
    expect(built.shape).toEqual(shape)
  })

  it('đường nét giữ nguyên nhưng nốt đổi theo hợp âm mới', () => {
    const shape = [1, 1]
    const onC = getLick('echo')!.build(
      contextFor('C', { previousShape: shape, material: chordMaterial(chordOf('C')) }),
    )
    const onF = getLick('echo')!.build(
      contextFor('F', { previousShape: shape, material: chordMaterial(chordOf('F')) }),
    )

    expect(onF.shape).toEqual(onC.shape)
    expect(onF.notes.map((note) => note.note)).not.toEqual(
      onC.notes.map((note) => note.note),
    )
  })
})

describe('cú quét ngũ cung', () => {
  it('vắt qua nhiều quãng tám', () => {
    const chord = chordOf('Em7')
    const built = getLick('sweep')!.build(
      contextFor('Em7', { beats: 6, material: chordPentatonic(chord) }),
    )

    const octaves = new Set(
      built.notes.map((note) => Math.floor(note.note / 12)),
    )
    expect(octaves.size).toBeGreaterThanOrEqual(3)
  })

  it('đỉnh câu được ngân và chồng quãng tám', () => {
    const chord = chordOf('Em7')
    const built = getLick('sweep')!.build(
      contextFor('Em7', { beats: 6, material: chordPentatonic(chord) }),
    )

    const longest = built.notes.reduce((best, note) =>
      note.durationBeats > best.durationBeats ? note : best,
    )
    const stacked = built.notes.filter(
      (note) => Math.abs(note.startBeat - longest.startBeat) < 0.001,
    )

    expect(stacked.length).toBe(2)
    expect(Math.abs(stacked[0].note - stacked[1].note)).toBe(12)
  })
})

describe('kẹp nửa cung hai phía', () => {
  /*
    Đo trên tập 52 lick: 35% mọi bước đi là nửa cung. Đây là mẫu mang chất
    chromatic đó vào câu solo.
  */
  it('mỗi nốt đích được kẹp trên rồi kẹp dưới trước khi vào', () => {
    const chord = chordOf('Cmaj7')
    const built = getLick('enclosure')!.build(
      contextFor('Cmaj7', { material: chordMaterial(chord) }),
    )

    const mains = built.notes.filter((note) => !note.soft)
    expect(mains.length).toBeGreaterThan(0)

    for (const main of mains) {
      const before = built.notes.filter(
        (note) => note.soft && note.startBeat < main.startBeat,
      )
      const above = before.at(-2)
      const below = before.at(-1)

      expect(above!.note - main.note).toBe(1)
      expect(main.note - below!.note).toBe(1)
    }
  })

  it('nốt kẹp luôn đánh nhẹ hơn, còn nốt đích vẫn thuộc hợp âm', () => {
    const chord = chordOf('Cmaj7')
    const material = chordMaterial(chord)
    const built = getLick('enclosure')!.build(
      contextFor('Cmaj7', { material }),
    )

    for (const note of built.notes) {
      if (note.soft) continue
      expect(material).toContain(note.note % 12)
    }
    expect(built.notes.some((note) => note.soft)).toBe(true)
  })
})

describe('chùm ba', () => {
  it('ba nốt đều nhau trong mỗi phách', () => {
    const chord = chordOf('Cmaj7')
    const built = getLick('triplet')!.build(
      contextFor('Cmaj7', { beats: 4, material: chordMaterial(chord) }),
    )

    // Ba nốt đầu cách nhau đúng một phần ba phách
    expect(built.notes[1].startBeat - built.notes[0].startBeat).toBeCloseTo(
      1 / 3,
      5,
    )
    expect(built.notes[2].startBeat - built.notes[1].startBeat).toBeCloseTo(
      1 / 3,
      5,
    )
  })

  it('số nốt là bội của ba', () => {
    const chord = chordOf('Cmaj7')
    const built = getLick('triplet')!.build(
      contextFor('Cmaj7', { beats: 4, material: chordMaterial(chord) }),
    )

    expect(built.notes.length % 3).toBe(0)
  })

  it('không dùng nốt ngoài hợp âm', () => {
    const chord = chordOf('Cmaj7')
    const material = chordMaterial(chord)
    const built = getLick('triplet')!.build(
      contextFor('Cmaj7', { beats: 4, material }),
    )

    for (const note of built.notes) {
      expect(material).toContain(note.note % 12)
    }
  })
})

describe('nốt dẫn hướng của vòng V về I', () => {
  it('nhận ra bước quãng bốn đi lên', () => {
    expect(resolvesUpFourth(chordOf('G7'), chordOf('Cmaj7'))).toBe(true)
    expect(resolvesUpFourth(chordOf('Dm7'), chordOf('G7'))).toBe(true)
    expect(resolvesUpFourth(chordOf('Cmaj7'), chordOf('Am7'))).toBe(false)
    expect(resolvesUpFourth(chordOf('G7'), null)).toBe(false)
  })

  it('kết ở bậc bảy để buông xuống bậc ba của hợp âm sau', () => {
    const chord = chordOf('G7')
    const built = getLick('guide-tone')!.build(
      contextFor('G7', { material: chordMaterial(chord) }),
    )

    // Bậc bảy thứ của Sol bảy là Fa
    const last = built.notes[built.notes.length - 1]
    expect(last.note % 12).toBe(5)

    // Và nó nằm ngay trên bậc ba của Đô trưởng đúng một nửa cung
    expect((last.note - 1) % 12).toBe(4)
  })

  it('hợp âm ba không có bậc bảy thì lùi về kết ở nốt ổn định', () => {
    const chord = chordOf('G')
    const built = getLick('guide-tone')!.build(
      contextFor('G', { material: chordMaterial(chord) }),
    )

    const last = built.notes[built.notes.length - 1]
    expect([7, 11, 2]).toContain(last.note % 12)
  })

  it('không kết bằng hai nốt trùng nhau', () => {
    for (const symbol of ['G7', 'Dm7', 'C7', 'Am7', 'Fmaj7']) {
      const chord = chordOf(symbol)
      const built = getLick('guide-tone')!.build(
        contextFor(symbol, { material: chordMaterial(chord) }),
      )
      const notes = built.notes.map((note) => note.note)

      expect(notes[notes.length - 1]).not.toBe(notes[notes.length - 2])
    }
  })
})

describe('nốt dẫn nửa cung', () => {
  it('mỗi nốt đích có một nốt dẫn ngay dưới nửa cung, đánh nhẹ hơn', () => {
    const built = getLick('approach')!.build(contextFor('Cmaj7'))
    const softs = built.notes.filter((note) => note.soft)

    expect(softs.length).toBeGreaterThan(0)
    for (const soft of softs) {
      const target = built.notes.find(
        (note) => !note.soft && note.startBeat > soft.startBeat,
      )!
      expect(target.note - soft.note).toBe(1)
    }
  })
})
