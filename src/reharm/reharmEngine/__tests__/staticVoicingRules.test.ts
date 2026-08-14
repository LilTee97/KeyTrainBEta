import { describe, expect, it } from 'vitest'
import { chordPitchClasses, getChordQuality } from '../../../shared/musicTheory/chordDefinitions'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  bestUpperStructure,
  colorChord,
  colorSequence,
  findUpperStructures,
} from '../staticVoicingRules'

function chord(input: string): ParsedChord {
  const parsed = parseChordInput(input).chords[0]
  if (!parsed) throw new Error(`Không đọc được '${input}'`)
  return parsed
}

/** Tên hợp âm sau khi thêm màu. */
function colored(input: string, intensity: 'light' | 'full' = 'full'): string {
  return colorChord(chord(input), { intensity }).symbol
}

describe('colorChord — mức tắt', () => {
  it('giữ nguyên hợp âm', () => {
    expect(colorChord(chord('C'), { intensity: 'off' }).symbol).toBe('C')
    expect(colorChord(chord('Dm7'), { intensity: 'off' }).symbol).toBe('Dm7')
  })
})

describe('colorChord — hợp âm ba trơn', () => {
  it('không để hợp âm ba trơn ở mức đậm', () => {
    // Đây là chữ ký số một của phong cách
    expect(colored('C')).toBe('Cadd9')
    expect(colored('Am')).toBe('Am9')
  })

  it('mức nhẹ chỉ thêm bậc bảy', () => {
    expect(colored('C', 'light')).toBe('Cmaj7')
    expect(colored('Am', 'light')).toBe('Am7')
  })

  it('cả hai mức đều làm hợp âm dày hơn hợp âm ba', () => {
    for (const intensity of ['light', 'full'] as const) {
      const result = colorChord(chord('C'), { intensity })
      expect(result.quality.intervals.length).toBeGreaterThan(3)
    }
  })
})

describe('colorChord — hợp âm bảy', () => {
  it('đẩy hợp âm bảy lên hợp âm chín', () => {
    expect(colored('Cmaj7')).toBe('Cmaj9')
    expect(colored('Dm7')).toBe('Dm9')
  })

  it('hợp âm bảy át lên mười ba ở mức đậm', () => {
    expect(colored('G7')).toBe('G13')
    expect(colored('G7', 'light')).toBe('G9')
  })

  it('hợp âm chín thứ lên mười một, đúng lối Am11 của tài liệu', () => {
    expect(colored('Am9')).toBe('Am11')
  })
})

describe('colorChord — hợp âm bảy át chuyển sang treo', () => {
  it('đổi sang chín treo bậc bốn khi được bật', () => {
    const result = colorChord(chord('D7'), {
      intensity: 'full',
      susDominant: true,
    })
    expect(result.symbol).toBe('D9sus4')
  })

  it('mức nhẹ cho bảy treo bậc bốn', () => {
    const result = colorChord(chord('D7'), {
      intensity: 'light',
      susDominant: true,
    })
    expect(result.symbol).toBe('D7sus4')
  })

  it('không đụng tới hợp âm không phải bảy át', () => {
    const result = colorChord(chord('Cmaj7'), {
      intensity: 'full',
      susDominant: true,
    })
    expect(result.symbol).toBe('Cmaj9')
  })

  it('tắt mặc định vì đây là lựa chọn mạnh tay', () => {
    expect(colored('G7')).toBe('G13')
  })
})

describe('colorChord — giữ nguyên những gì cần giữ', () => {
  it('giữ nguyên nốt gốc', () => {
    for (const input of ['C', 'Am', 'F#m7', 'Bb7']) {
      expect(colorChord(chord(input)).root).toBe(chord(input).root)
    }
  })

  it('giữ nguyên nốt bass của hợp âm chồng trên bass', () => {
    const result = colorChord(chord('C/E'))
    expect(result.bass).toBe(4)
    expect(result.symbol).toBe('Cadd9/E')
  })

  it('hợp âm không có luật nào thì để nguyên', () => {
    // Hợp âm biến âm đã đủ màu, không cần thêm
    expect(colored('C13b9')).toBe('C13b9')
    expect(colored('Bdim7')).toBe('Bdim7')
  })

  it('không bao giờ làm hợp âm mỏng đi', () => {
    for (const input of ['C', 'Am', 'G7', 'Cmaj7', 'Dm7', 'Am9', 'C6']) {
      const before = chord(input)
      const after = colorChord(before)
      expect(after.quality.intervals.length).toBeGreaterThanOrEqual(
        before.quality.intervals.length,
      )
    }
  })
})

describe('colorSequence', () => {
  it('đổi màu cả vòng hợp âm', () => {
    const result = colorSequence(parseChordInput('C Am F G').chords)
    expect(result.map((entry) => entry.symbol)).toEqual([
      'Cadd9',
      'Am9',
      'Fadd9',
      'Gadd9',
    ])
  })

  it('vòng đã đủ màu thì gần như giữ nguyên', () => {
    const result = colorSequence(
      parseChordInput('Am11 D9sus4 E9sus4 Em7').chords,
    )
    expect(result.map((entry) => entry.symbol)).toEqual([
      'Am11',
      'D9sus4',
      'E9sus4',
      'Em9',
    ])
  })

  it('chuỗi rỗng cho kết quả rỗng', () => {
    expect(colorSequence([])).toEqual([])
  })
})

describe('findUpperStructures', () => {
  it('phần chồng bên trên luôn nằm gọn trong hợp âm gốc', () => {
    for (const input of ['Am11', 'D9sus4', 'E9sus4', 'Cmaj9', 'G13']) {
      const source = chord(input)
      const chordTones = new Set(
        chordPitchClasses(source.root, source.quality),
      )

      for (const structure of findUpperStructures(source)) {
        const quality = getChordQuality(structure.upperQualityId)!
        for (const pitch of chordPitchClasses(structure.upperRoot, quality)) {
          expect(chordTones.has(pitch)).toBe(true)
        }
      }
    }
  })

  it('phần chồng luôn đơn giản hơn hợp âm gốc', () => {
    const source = chord('Am11')

    for (const structure of findUpperStructures(source)) {
      const quality = getChordQuality(structure.upperQualityId)!
      expect(quality.intervals.length).toBeLessThan(
        source.quality.intervals.length,
      )
    }
  })

  it('không bao giờ lấy chính nốt gốc làm phần chồng', () => {
    for (const structure of findUpperStructures(chord('Am11'))) {
      expect(structure.upperRoot).not.toBe(9)
    }
  })

  it('hợp âm ba không quy đổi được vì đã đơn giản nhất', () => {
    expect(findUpperStructures(chord('C'))).toEqual([])
  })
})

describe('bestUpperStructure — đối chiếu với bảng quy đổi trong tài liệu', () => {
  it('D9sus4 quy về hợp âm dựng trên bậc bảy, chồng trên bass Rê', () => {
    // Tài liệu ghi: D9sus4 = Đô trưởng chồng trên bass Rê
    const best = bestUpperStructure(chord('D9sus4'))!

    expect(best.bass).toBe(2)
    expect(best.intervalFromRoot).toBe(10)
    expect(best.label).toContain('/ D')
  })

  it('E9sus4 quy về hợp âm dựng trên bậc bảy, chồng trên bass Mi', () => {
    // Tài liệu ghi: E9sus4 = Rê trưởng chồng trên bass Mi
    const best = bestUpperStructure(chord('E9sus4'))!

    expect(best.upperRoot).toBe(2)
    expect(best.upperQualityId).toBe('maj')
    expect(best.bass).toBe(4)
  })

  it('Am11 quy đổi được và bass vẫn là nốt La', () => {
    const best = bestUpperStructure(chord('Am11'))!
    expect(best.bass).toBe(9)
  })

  it('ưu tiên phần chồng dựng trên bậc bảy khi có', () => {
    // Điểm chung của mọi ví dụ trong bảng quy đổi của tài liệu
    for (const input of ['D9sus4', 'E9sus4', 'Am11']) {
      const best = bestUpperStructure(chord(input))
      expect(best?.intervalFromRoot).toBe(10)
    }
  })

  it('hợp âm không dựng được phần chồng trên bậc bảy thì lấy bậc khác', () => {
    // Cmaj9 có bậc bảy là nốt Si, mà mọi hợp âm ba dựng trên Si đều cần nốt
    // nằm ngoài hợp âm, nên phải lùi về bậc năm
    const best = bestUpperStructure(chord('Cmaj9'))!
    expect(best.intervalFromRoot).toBe(7)
    expect(best.label).toBe('G / C')
  })

  it('hợp âm quá đơn giản thì không quy đổi được', () => {
    expect(bestUpperStructure(chord('C'))).toBeNull()
    expect(bestUpperStructure(chord('Am'))).toBeNull()
  })

  it('nhãn ghi rõ phần chồng và nốt bass', () => {
    const best = bestUpperStructure(chord('E9sus4'))!
    expect(best.label).toBe('D / E')
  })
})
