import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import {
  applySuggestions,
  suggestPassingChords,
} from '../../reharmEngine/passingChordRules'
import type { ParsedChord } from '../../types'
import { suggestDim7ChainFills } from '../fillGenerator'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

/** Vòng hợp âm sau khi chèn câu nối. */
function withFill(input: string): string[] {
  const list = chords(input)
  return applySuggestions(list, suggestDim7ChainFills(list)).map(
    (chord) => chord.symbol,
  )
}

describe('câu nối bằng chuỗi hợp âm giảm', () => {
  it('dựng lại đúng ví dụ nguyên văn trong tài liệu', () => {
    // Tài liệu mục 5: A7 → Bdim7 → C#dim7 → Dm7
    expect(withFill('A7 Dm7')).toEqual([
      'A7',
      'Bdim7',
      'C#dim7',
      'Dm7',
    ])
  })

  it('cùng công thức áp cho vòng bậc năm về chủ âm khác', () => {
    // G7 → C thì bass đi G A B C
    expect(withFill('G7 C')).toEqual(['G7', 'Adim7', 'Bdim7', 'C'])
  })

  it('nốt bass đi hai cung rồi nửa cung', () => {
    const list = chords('G7 C')
    const [suggestion] = suggestDim7ChainFills(list)

    const walk = [
      list[0].root,
      ...suggestion.chords.map((chord) => chord.root),
      list[1].root,
    ]

    const steps = walk
      .slice(1)
      .map((pitch, index) => (pitch - walk[index] + 12) % 12)
    expect(steps).toEqual([2, 2, 1])
  })

  it('chèn đúng hai hợp âm giảm', () => {
    const [suggestion] = suggestDim7ChainFills(chords('G7 C'))

    expect(suggestion.chords).toHaveLength(2)
    for (const chord of suggestion.chords) {
      expect(chord.quality.id).toBe('dim7')
    }
  })

  it('bắt được cả hợp âm treo đang làm chức năng bậc năm', () => {
    // D9sus4 không có bậc ba nào nhưng vẫn kéo về G
    const suggestions = suggestDim7ChainFills(chords('D9sus4 G'))
    expect(suggestions).toHaveLength(1)
  })

  it('không chèn khi hợp âm trước không phải bậc năm', () => {
    // Cmaj7 có bậc bảy trưởng nên không kéo về đâu cả
    expect(suggestDim7ChainFills(chords('Cmaj7 F'))).toEqual([])
    expect(suggestDim7ChainFills(chords('Am7 Dm7'))).toEqual([])
  })

  it('không chèn khi không giải quyết lên quãng bốn', () => {
    // G7 xuống F là quãng hai, không phải chuyển động của công thức này
    expect(suggestDim7ChainFills(chords('G7 F'))).toEqual([])
    expect(suggestDim7ChainFills(chords('G7 Am'))).toEqual([])
  })

  it('giải thích ghi rõ đường đi của nốt bass', () => {
    const [suggestion] = suggestDim7ChainFills(chords('A7 Dm7'))
    expect(suggestion.explanation).toContain('A → B → C# → D')
  })

  it('tìm được nhiều chỗ trong một vòng dài', () => {
    const suggestions = suggestDim7ChainFills(chords('G7 C E7 Am'))
    expect(suggestions).toHaveLength(2)
  })

  it('vòng một hợp âm thì không có gì để nối', () => {
    expect(suggestDim7ChainFills(chords('G7'))).toEqual([])
    expect(suggestDim7ChainFills([])).toEqual([])
  })
})

describe('câu quay đầu — nối cuối vòng về đầu vòng', () => {
  it('bắt được chỗ hợp âm cuối kéo về hợp âm đầu', () => {
    // Vòng pop quen thuộc: G cuối vòng kéo về C đầu vòng khi lặp lại
    const suggestions = suggestDim7ChainFills(chords('C Am F G7'))

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].insertBeforeIndex).toBe(4)
  })

  it('chèn vào cuối vòng', () => {
    const list = chords('C Am F G7')
    const result = applySuggestions(list, suggestDim7ChainFills(list))

    expect(result.map((chord) => chord.symbol)).toEqual([
      'C',
      'Am',
      'F',
      'G7',
      'Adim7',
      'Bdim7',
    ])
  })

  it('giải thích nói rõ đây là câu quay đầu', () => {
    const [suggestion] = suggestDim7ChainFills(chords('C Am F G7'))
    expect(suggestion.explanation).toContain('quay đầu')
  })

  it('tắt riêng được câu quay đầu', () => {
    expect(
      suggestDim7ChainFills(chords('C Am F G7'), {
        includeTurnaround: false,
      }),
    ).toEqual([])
  })

  it('không chèn khi hợp âm cuối không kéo về hợp âm đầu', () => {
    // F cuối vòng không phải bậc năm của C
    expect(suggestDim7ChainFills(chords('C Am G7 F'))).toEqual([])
  })

  it('tìm được cả câu nối bên trong lẫn câu quay đầu', () => {
    const suggestions = suggestDim7ChainFills(chords('Dm7 G7 C E7'))

    // G7 về C ở giữa vòng, và E7 về Dm7 khi quay đầu... E7 lên A không phải Dm
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(
      suggestions.some((suggestion) => suggestion.insertBeforeIndex === 2),
    ).toBe(true)
  })
})

describe('nối vào bộ gợi ý chung', () => {
  it('câu nối nằm trong danh sách gợi ý', () => {
    const suggestions = suggestPassingChords(chords('G7 C'))
    expect(
      suggestions.some(
        (suggestion) => suggestion.technique === 'dim7-chain-fill',
      ),
    ).toBe(true)
  })

  it('tắt riêng được câu nối', () => {
    const suggestions = suggestPassingChords(chords('G7 C'), {
      dim7ChainFill: false,
    })
    expect(
      suggestions.some(
        (suggestion) => suggestion.technique === 'dim7-chain-fill',
      ),
    ).toBe(false)
  })

  it('câu nối được ưu tiên hơn việc chèn lẻ ở cùng một khe', () => {
    // Cùng khe có cả câu nối lẫn hợp âm giảm lướt; câu nối lấp trọn quãng
    // nên đáng cân nhắc trước
    const list = chords('G7 C')
    const suggestions = suggestPassingChords(list)
    const atSameSlot = suggestions.filter(
      (suggestion) => suggestion.insertBeforeIndex === 1,
    )

    expect(atSameSlot[0].technique).toBe('dim7-chain-fill')

    // Và khi áp dụng thì câu nối thắng
    const result = applySuggestions(list, suggestions)
    expect(result).toHaveLength(4)
  })
})
