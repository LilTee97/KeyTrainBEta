import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../input/chordInputParser'
import {
  semitonesToKey,
  shiftKeyId,
  transposeChords,
  transposeLabel,
  transposeSymbol,
} from '../transpose'

const chords = (text: string) => parseChordInput(text).chords
const symbols = (
  text: string,
  semitones: number,
  style?: 'sharp' | 'flat',
) =>
  transposeChords(chords(text), semitones, style).map((chord) => chord.symbol)

describe('nâng hạ tone', () => {
  it('dịch nốt gốc đúng số nửa cung', () => {
    expect(symbols('C Am F G', 2)).toEqual(['D', 'Bm', 'G', 'A'])
    expect(transposeSymbol('Csus4', 2)).toBe('Dsus4')
  })

  it('hạ tone cũng đúng', () => {
    expect(symbols('D Bm G A', -2)).toEqual(['C', 'Am', 'F', 'G'])
  })

  it('giữ nguyên tính chất hợp âm', () => {
    // Dịch giọng không đổi hợp âm trưởng thành hợp âm thứ
    const before = chords('Cmaj7 Am7 Dm7b5 G7b9')
    const after = transposeChords(before, 5)

    expect(after.map((chord) => chord.quality.id)).toEqual(
      before.map((chord) => chord.quality.id),
    )
  })

  it('dịch cả nốt bass của hợp âm chồng trên bass', () => {
    expect(symbols('C/E', 2)).toEqual(['D/F#'])
  })

  it('vòng qua hết quãng tám thì quay lại đầu', () => {
    expect(symbols('C', 12)).toEqual(['C'])
    expect(symbols('B', 1)).toEqual(['C'])
    expect(symbols('C', -1)).toEqual(['B'])
  })

  it('không dịch gì thì giữ nguyên từng hợp âm', () => {
    const before = chords('C Am F G')
    expect(transposeChords(before, 0)).toEqual(before)
  })

  it('dịch đi rồi dịch về thì ra đúng vòng cũ', () => {
    const before = chords('Cmaj7 Am7 Dm7 G7')
    const round = transposeChords(transposeChords(before, 7), -7)

    expect(round.map((chord) => chord.symbol)).toEqual(
      before.map((chord) => chord.symbol),
    )
  })

  it('vòng rỗng thì không ném lỗi', () => {
    expect(transposeChords([], 3)).toEqual([])
  })
})

describe('nhãn trên nút', () => {
  it('không dịch thì ghi là gốc', () => {
    expect(transposeLabel(0)).toBe('gốc')
  })

  it('nâng thì có dấu cộng, hạ thì có dấu trừ', () => {
    expect(transposeLabel(3)).toBe('+3')
    expect(transposeLabel(-3)).toBe('−3')
  })
})

describe('đổi sang một giọng cụ thể', () => {
  it('lấy đường ngắn, không đi vòng cả quãng tám', () => {
    expect(semitonesToKey(7, 9)).toBe(2)
    expect(semitonesToKey(7, 5)).toBe(-2)
    expect(semitonesToKey(0, 11)).toBe(-1)
  })

  it('giọng giáng viết bằng giáng, không viết thăng', () => {
    expect(symbols('G C D', 1, 'flat')).toEqual(['Ab', 'Db', 'Eb'])
  })

  it('ô chọn giọng đi cùng nút TONE', () => {
    expect(shiftKeyId('7:major', 2)).toBe('9:major')
    expect(shiftKeyId('9:minor', -2)).toBe('7:minor')
    expect(shiftKeyId('', 3)).toBe('')
  })
})
