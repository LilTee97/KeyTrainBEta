import { describe, expect, it } from 'vitest'
import {
  formatChordSequence,
  parseChordInput,
  parseChordToken,
} from '../chordInputParser'

/** Tên các hợp âm đọc được từ một chuỗi. */
function symbols(input: string): string[] {
  return parseChordInput(input).chords.map((chord) => chord.symbol)
}

describe('đọc một hợp âm', () => {
  it('đọc hợp âm ba trưởng', () => {
    const chord = parseChordToken('C')
    expect(typeof chord).not.toBe('string')
    if (typeof chord === 'string') return

    expect(chord.root).toBe(0)
    expect(chord.quality.id).toBe('maj')
    expect(chord.symbol).toBe('C')
  })

  it('đọc hợp âm thứ và hợp âm bảy', () => {
    expect(symbols('Am')).toEqual(['Am'])
    expect(symbols('Cmaj7')).toEqual(['Cmaj7'])
    expect(symbols('G7')).toEqual(['G7'])
    expect(symbols('Dm7')).toEqual(['Dm7'])
  })

  it('đọc được dấu hoá ở nốt gốc', () => {
    expect(symbols('F#m7')).toEqual(['F#m7'])
    expect(symbols('Bbmaj7')).toEqual(['A#maj7'])
  })

  it('ghi tên bằng dấu giáng khi được yêu cầu', () => {
    const sequence = parseChordInput('Bbmaj7', 'flat')
    expect(sequence.chords[0].symbol).toBe('Bbmaj7')
  })

  it('đọc được ký hiệu thăng giáng Unicode', () => {
    expect(symbols('F♯m7')).toEqual(['F#m7'])
    expect(symbols('B♭maj7')).toEqual(['A#maj7'])
  })

  it('chấp nhận các cách viết tính chất khác nhau', () => {
    expect(symbols('CM7')).toEqual(['Cmaj7'])
    expect(symbols('C-7')).toEqual(['Cm7'])
    expect(symbols('CΔ7')).toEqual(['Cmaj7'])
    expect(symbols('Bø')).toEqual(['Bm7b5'])
  })

  it('đọc được các hợp âm mở rộng của phong cách này', () => {
    expect(symbols('Am11')).toEqual(['Am11'])
    expect(symbols('D9sus4')).toEqual(['D9sus4'])
    expect(symbols('E7b9')).toEqual(['E7b9'])
    expect(symbols('C13b9')).toEqual(['C13b9'])
    expect(symbols('Cadd2')).toEqual(['Cadd2'])
    expect(symbols('Cadd9')).toEqual(['Cadd2'])
  })
})

describe('hợp âm chồng trên bass', () => {
  it('tách được nốt bass', () => {
    const chord = parseChordToken('C/E')
    if (typeof chord === 'string') throw new Error('phải đọc được')

    expect(chord.root).toBe(0)
    expect(chord.bass).toBe(4)
    expect(chord.symbol).toBe('C/E')
  })

  it('đọc được hợp âm bảy chồng trên bass', () => {
    expect(symbols('Am7/G')).toEqual(['Am7/G'])
    expect(symbols('FM7/A')).toEqual(['Fmaj7/A'])
  })

  it('không nhầm hợp âm sáu chín thành hợp âm chồng trên bass', () => {
    // Dấu gạch chéo ở đây là một phần của tên tính chất, không phải nốt bass
    const chord = parseChordToken('C6/9')
    if (typeof chord === 'string') throw new Error('phải đọc được')

    expect(chord.quality.id).toBe('69')
    expect(chord.bass).toBeUndefined()
  })

  it('bass trùng nốt gốc thì không coi là hợp âm chồng trên bass', () => {
    const chord = parseChordToken('C/C')
    if (typeof chord === 'string') throw new Error('phải đọc được')

    expect(chord.bass).toBeUndefined()
    expect(chord.symbol).toBe('C')
  })

  it('đọc được bass có dấu hoá', () => {
    const chord = parseChordToken('A7b13/E')
    if (typeof chord === 'string') throw new Error('phải đọc được')
    expect(chord.bass).toBe(4)
  })
})

describe('đọc cả chuỗi', () => {
  it('tách theo khoảng trắng', () => {
    expect(symbols('Am7 D9 Gmaj7')).toEqual(['Am7', 'D9', 'Gmaj7'])
  })

  it('tách theo dấu phẩy và vạch nhịp', () => {
    expect(symbols('Dm7, G7, Cmaj7')).toEqual(['Dm7', 'G7', 'Cmaj7'])
    expect(symbols('Dm7 | G7 | Cmaj7')).toEqual(['Dm7', 'G7', 'Cmaj7'])
  })

  it('tách theo xuống dòng', () => {
    expect(symbols('Dm7\nG7\nCmaj7')).toEqual(['Dm7', 'G7', 'Cmaj7'])
  })

  it('bỏ qua khoảng trắng thừa', () => {
    expect(symbols('   Dm7    G7   ')).toEqual(['Dm7', 'G7'])
  })

  it('không tách theo dấu gạch ngang vì đó là cách viết hợp âm thứ', () => {
    // 'C-7' nghĩa là Cm7, tách ra sẽ thành hai cụm vô nghĩa
    expect(symbols('C-7 F-7')).toEqual(['Cm7', 'Fm7'])
  })

  it('chuỗi rỗng cho kết quả rỗng', () => {
    expect(parseChordInput('')).toEqual({ chords: [], errors: [] })
    expect(parseChordInput('    ')).toEqual({ chords: [], errors: [] })
  })
})

describe('xử lý lỗi', () => {
  it('ghi lại cụm có nốt gốc không hợp lệ', () => {
    const sequence = parseChordInput('Hm7')

    expect(sequence.chords).toHaveLength(0)
    expect(sequence.errors[0].reason).toBe('unknown-root')
    expect(sequence.errors[0].source).toBe('Hm7')
  })

  it('ghi lại cụm có tính chất không nhận ra', () => {
    const sequence = parseChordInput('Cxyz')

    expect(sequence.errors[0].reason).toBe('unknown-quality')
  })

  it('một cụm sai không làm hỏng cả chuỗi', () => {
    const sequence = parseChordInput('Dm7 Xyz G7')

    expect(sequence.chords.map((chord) => chord.symbol)).toEqual(['Dm7', 'G7'])
    expect(sequence.errors).toHaveLength(1)
  })

  it('ghi đúng vị trí cụm sai trong chuỗi', () => {
    const sequence = parseChordInput('Dm7 Xyz G7')
    expect(sequence.errors[0].index).toBe(1)
  })

  it('giữ nguyên chuỗi gốc người dùng gõ để hiện lỗi', () => {
    const sequence = parseChordInput('Dm7 Qwerty')
    expect(sequence.errors[0].source).toBe('Qwerty')
  })
})

describe('formatChordSequence', () => {
  it('ghép lại thành văn bản', () => {
    expect(formatChordSequence(parseChordInput('Dm7 G7 Cmaj7'))).toBe(
      'Dm7 G7 Cmaj7',
    )
  })

  it('chuẩn hoá cách viết', () => {
    expect(formatChordSequence(parseChordInput('C-7 GM7'))).toBe('Cm7 Gmaj7')
  })

  it('bỏ qua các cụm sai', () => {
    expect(formatChordSequence(parseChordInput('Dm7 Xyz G7'))).toBe('Dm7 G7')
  })
})

describe('các vòng hợp âm thật từ tài liệu phong cách', () => {
  it('đọc được vòng của bài Cứ Chill Thôi', () => {
    expect(symbols('Am11 D9sus4 E9sus4 Em7')).toEqual([
      'Am11',
      'D9sus4',
      'E9sus4',
      'Em7',
    ])
  })

  it('đọc được vòng bossa nova giọng F trưởng', () => {
    expect(symbols('Dm9 Gm7 C7 FM7 BbM7')).toEqual([
      'Dm9',
      'Gm7',
      'C7',
      'Fmaj7',
      'A#maj7',
    ])
  })

  it('đọc được câu fill dùng chuỗi hợp âm giảm', () => {
    expect(symbols('A7 Bdim7 C#dim7 Dm7 F/G C')).toEqual([
      'A7',
      'Bdim7',
      'C#dim7',
      'Dm7',
      'F/G',
      'C',
    ])
  })
})
