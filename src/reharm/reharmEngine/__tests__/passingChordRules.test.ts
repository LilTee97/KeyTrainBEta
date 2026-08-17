import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  applySuggestions,
  suggestDim7Passing,
  suggestPassingChords,
  suggestSecondaryDominants,
  suggestSecondaryIiV,
} from '../passingChordRules'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

/** Vòng hợp âm sau khi áp dụng đề xuất, dạng tên hợp âm. */
function applied(
  input: string,
  suggest: (list: ParsedChord[]) => ReturnType<typeof suggestDim7Passing>,
): string[] {
  const list = chords(input)
  return applySuggestions(list, suggest(list)).map((chord) => chord.symbol)
}

describe('hợp âm giảm lướt', () => {
  it('nối hai hợp âm cách nhau một cung khi đi lên', () => {
    // Công thức 1 của tài liệu: bậc I lên bậc ii
    expect(applied('C Dm7', suggestDim7Passing)).toEqual([
      'C',
      'C#dim7',
      'Dm7',
    ])
  })

  it('nối hai hợp âm cách nhau một cung khi đi xuống', () => {
    // Công thức 2 của tài liệu: bậc iii xuống bậc ii
    expect(applied('Em7 Dm7', suggestDim7Passing)).toEqual([
      'Em7',
      'D#dim7',
      'Dm7',
    ])
  })

  it('nối được về bậc sáu', () => {
    // Công thức 3 của tài liệu: dẫn về bậc vi
    expect(applied('Em7 Am7', suggestDim7Passing)).toEqual([
      'Em7',
      'G#dim7',
      'Am7',
    ])
  })

  it('nối được cả những cặp hợp âm cách nhau quãng xa', () => {
    // Hợp âm giảm nghe trung tính nên nối được gần như bất kỳ hai hợp âm nào.
    // C lên F là quãng bốn đi lên nên tiếp cận từ nửa cung dưới.
    expect(applied('C F', suggestDim7Passing)).toEqual(['C', 'Edim7', 'F'])
  })

  it('chọn chiều theo quãng đường ngắn nhất giữa hai nốt gốc', () => {
    // C tới G ngắn nhất là đi xuống quãng bốn, nên tiếp cận từ nửa cung trên
    expect(applied('C G', suggestDim7Passing)).toEqual(['C', 'G#dim7', 'G'])
  })

  it('không chèn khi hai hợp âm đã sát nhau nửa cung', () => {
    // Chèn vào chỉ thành lặp lại chính hợp âm trước
    expect(suggestDim7Passing(chords('C C#m'))).toEqual([])
  })

  it('không chèn khi hai hợp âm cùng nốt gốc', () => {
    expect(suggestDim7Passing(chords('C Cmaj7'))).toEqual([])
  })

  it('hợp âm chèn luôn cách hợp âm đích đúng nửa cung', () => {
    for (const input of ['C Dm7', 'Em7 Dm7', 'Em7 Am7', 'C F', 'Am7 F']) {
      const list = chords(input)
      const [suggestion] = suggestDim7Passing(list)
      if (!suggestion) continue

      const gap = Math.abs(suggestion.chords[0].root - list[1].root)
      expect([1, 11]).toContain(gap)
    }
  })

  it('đi lên thì tiếp cận từ nửa cung dưới', () => {
    const list = chords('C Dm7')
    const [suggestion] = suggestDim7Passing(list)
    expect(suggestion.chords[0].root).toBe(1)
  })

  it('đi xuống thì tiếp cận từ nửa cung trên', () => {
    const list = chords('Em7 Dm7')
    const [suggestion] = suggestDim7Passing(list)
    expect(suggestion.chords[0].root).toBe(3)
  })

  it('luôn dùng hợp âm bảy giảm', () => {
    for (const suggestion of suggestDim7Passing(chords('C Dm7 Em7 Dm7'))) {
      expect(suggestion.chords[0].quality.id).toBe('dim7')
    }
  })

  it('giải thích ghi rõ đường đi của nốt bass', () => {
    const [suggestion] = suggestDim7Passing(chords('C Dm7'))
    expect(suggestion.explanation).toContain('C → C# → D')
  })

  it('dựng lại đúng cả bốn ví dụ trong tài liệu', () => {
    const examples: [string, string[]][] = [
      ['C Dm7', ['C', 'C#dim7', 'Dm7']],
      ['Em7 Dm7', ['Em7', 'D#dim7', 'Dm7']],
      ['Em7 Am7', ['Em7', 'G#dim7', 'Am7']],
      ['Bdim7 Dm7', ['Bdim7', 'C#dim7', 'Dm7']],
    ]

    for (const [input, expected] of examples) {
      expect(applied(input, suggestDim7Passing)).toEqual(expected)
    }
  })

  it('vòng một hợp âm thì không có gì để nối', () => {
    expect(suggestDim7Passing(chords('C'))).toEqual([])
    expect(suggestDim7Passing([])).toEqual([])
  })
})

describe('bậc năm phụ', () => {
  it('chèn hợp âm bậc năm trước hợp âm đích', () => {
    expect(applied('C Am7', suggestSecondaryDominants)).toEqual([
      'C',
      'E7b9',
      'Am7',
    ])
  })

  it('đích là hợp âm trưởng thì dùng bậc năm thường', () => {
    const [suggestion] = suggestSecondaryDominants(chords('Am7 F'))
    expect(suggestion.chords[0].quality.id).toBe('7')
    expect(suggestion.chords[0].symbol).toBe('C7')
  })

  it('đích là hợp âm thứ thì dùng bậc năm có nốt giáng chín', () => {
    // Tài liệu dùng A7b9 kéo về Dm9, nốt b9 làm lực kéo mạnh hơn
    const [suggestion] = suggestSecondaryDominants(chords('C Dm9'))
    expect(suggestion.chords[0].symbol).toBe('A7b9')
  })

  it('không chèn khi đã sẵn quan hệ bậc năm', () => {
    // G7 vốn đã là bậc năm của C
    expect(suggestSecondaryDominants(chords('G7 C'))).toEqual([])
  })

  it('nốt gốc của hợp âm chèn cách đích một quãng năm', () => {
    for (const suggestion of suggestSecondaryDominants(chords('C Am7 F'))) {
      const target = suggestion.chords[0].root
      expect((target + 5) % 12).toBeDefined()
    }
  })
})

describe('vòng 2-5-1 lướt', () => {
  it('chèn cặp bậc hai và bậc năm trước hợp âm đích', () => {
    // Ví dụ trong tài liệu: C → Bm7b5 → E7 → Am7
    expect(applied('C Am7', suggestSecondaryIiV)).toEqual([
      'C',
      'Bm7b5',
      'E7b9',
      'Am7',
    ])
  })

  it('đích là hợp âm thứ thì bậc hai là hợp âm nửa giảm', () => {
    const [suggestion] = suggestSecondaryIiV(chords('C Am7'))
    expect(suggestion.chords[0].quality.id).toBe('m7b5')
  })

  it('đích là hợp âm trưởng thì bậc hai là hợp âm bảy thứ', () => {
    const [suggestion] = suggestSecondaryIiV(chords('Am7 F'))
    expect(suggestion.chords[0].quality.id).toBe('m7')
    expect(suggestion.chords[0].symbol).toBe('Gm7')
  })

  it('chèn đúng hai hợp âm', () => {
    for (const suggestion of suggestSecondaryIiV(chords('C Am7 F Dm7'))) {
      expect(suggestion.chords).toHaveLength(2)
    }
  })

  it('không chèn khi đã sẵn quan hệ bậc năm', () => {
    expect(suggestSecondaryIiV(chords('G7 C'))).toEqual([])
  })

  it('bậc hai và bậc năm cách nhau một quãng bốn', () => {
    const [suggestion] = suggestSecondaryIiV(chords('C Am7'))
    const [supertonic, dominant] = suggestion.chords

    expect((supertonic.root + 5) % 12).toBe(dominant.root)
  })

  it('giải thích nêu rõ hợp âm đích', () => {
    const [suggestion] = suggestSecondaryIiV(chords('C Am7'))
    expect(suggestion.explanation).toContain('Am7')
  })
})

describe('suggestPassingChords', () => {
  it('gom được nhiều loại đề xuất', () => {
    const suggestions = suggestPassingChords(chords('C Dm7 Am7'))
    const techniques = new Set(
      suggestions.map((suggestion) => suggestion.technique),
    )

    expect(techniques.size).toBeGreaterThan(1)
  })

  it('tắt được từng loại luật', () => {
    const list = chords('C Dm7')

    const onlyDim = suggestPassingChords(list, {
      secondaryDominant: false,
      secondaryIiV: false,
    })
    expect(
      onlyDim.every((suggestion) => suggestion.technique === 'dim7-passing'),
    ).toBe(true)
  })

  it('tắt hết thì không còn đề xuất nào', () => {
    expect(
      suggestPassingChords(chords('C Dm7 Am7'), {
        dim7Passing: false,
        secondaryDominant: false,
        secondaryIiV: false,
        dim7ChainFill: false,
      }),
    ).toEqual([])
  })

  it('đề xuất xếp theo vị trí chèn tăng dần', () => {
    const suggestions = suggestPassingChords(chords('C Dm7 Em7 Am7'))

    for (let index = 1; index < suggestions.length; index += 1) {
      expect(suggestions[index].insertBeforeIndex).toBeGreaterThanOrEqual(
        suggestions[index - 1].insertBeforeIndex,
      )
    }
  })

  it('không bao giờ đề xuất chèn trước hợp âm đầu tiên', () => {
    for (const suggestion of suggestPassingChords(chords('C Dm7 Em7'))) {
      expect(suggestion.insertBeforeIndex).toBeGreaterThan(0)
    }
  })
})

describe('applySuggestions', () => {
  it('không có đề xuất thì giữ nguyên vòng', () => {
    const list = chords('C Dm7')
    expect(applySuggestions(list, []).map((chord) => chord.symbol)).toEqual([
      'C',
      'Dm7',
    ])
  })

  it('mỗi khe chỉ nhận một đề xuất, cái đứng trước thắng', () => {
    const list = chords('C Am7')
    const suggestions = [
      ...suggestSecondaryIiV(list),
      ...suggestSecondaryDominants(list),
    ]

    const result = applySuggestions(list, suggestions)
    // Vòng 2-5-1 thắng nên chèn hai hợp âm, không phải ba
    expect(result).toHaveLength(4)
  })

  it('chèn nhiều khe cùng lúc mà không lệch vị trí', () => {
    const list = chords('C Dm7 Em7 Dm7')
    const result = applySuggestions(list, suggestDim7Passing(list))

    expect(result.map((chord) => chord.symbol)).toEqual([
      'C',
      'C#dim7',
      'Dm7',
      'D#dim7',
      'Em7',
      'D#dim7',
      'Dm7',
    ])
  })

  it('không sửa vào vòng gốc', () => {
    const list = chords('C Dm7')
    const before = list.map((chord) => chord.symbol)

    applySuggestions(list, suggestDim7Passing(list))
    expect(list.map((chord) => chord.symbol)).toEqual(before)
  })

  it('hostKeepBeats giữ đúng số phách host rồi mới lướt', () => {
    const list = chords('C Am7')
    const iiV = suggestSecondaryIiV(list).find(
      (suggestion) => suggestion.insertBeforeIndex === 1,
    )
    expect(iiV).toBeTruthy()
    const result = applySuggestions(list, [{ ...iiV!, hostKeepBeats: 2 }], 4)
    expect(result[0]?.beats).toBe(2)
    expect(result.filter((chord) => chord.passing).map((chord) => chord.beats)).toEqual([
      1, 1,
    ])
  })
})

describe('công thức câu fill trong tài liệu', () => {
  it('dựng lại được đoạn nối bằng chuỗi hợp âm giảm', () => {
    // Tài liệu mục 5: A7 → Bdim7 → C#dim7 → Dm7, bass đi lên A B C# D.
    // Luật hợp âm giảm lướt dựng được mắt xích cuối C#dim7 → Dm7.
    const list = chords('Bdim7 Dm7')
    const result = applySuggestions(list, suggestDim7Passing(list))

    expect(result.map((chord) => chord.symbol)).toEqual([
      'Bdim7',
      'C#dim7',
      'Dm7',
    ])
  })

  it('vòng pop trơn nhận được nhiều chỗ chèn', () => {
    const list = chords('C Am F G')
    expect(suggestPassingChords(list).length).toBeGreaterThan(2)
  })
})
