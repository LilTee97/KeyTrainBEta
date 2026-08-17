import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { explodeHeldBars, varyHeldColors } from '../heldColorRun'
import { colorSequence } from '../staticVoicingRules'

const list = (text: string) => colorSequence(parseChordInput(text).chords)

describe('xoay màu khi cùng gốc ngân nhiều ô', () => {
  it('dựng lại đúng C → CM7 → C6 → CM7 của tài liệu', () => {
    const varied = varyHeldColors(list('C C C C'), {
      beatsOf: () => 4,
    })

    expect(varied.map((chord) => chord.symbol)).toEqual([
      'Cadd2',
      'Cmaj7',
      'C6',
      'Cmaj7',
    ])
    expect(varied.every((chord) => chord.holdRun)).toBe(true)
    expect(varied[0].heldLabel).toBe('Cadd2 → Cmaj7 → C6 → Cmaj7')
  })

  it('gốc khác thì ngắt dãy', () => {
    const varied = varyHeldColors(list('C C F F'), {
      beatsOf: () => 4,
    })

    expect(varied.map((chord) => chord.symbol)).toEqual([
      'Cadd2',
      'Cmaj7',
      'Fadd2',
      'Fmaj7',
    ])
  })

  it('một hợp âm ngân hai ô thì ghi đủ hai màu trên lời', () => {
    const varied = varyHeldColors(list('C'), {
      beatsOf: () => 8,
    })

    expect(varied).toHaveLength(1)
    expect(varied[0].symbol).toBe('Cadd2')
    expect(varied[0].heldLabel).toBe('Cadd2 → Cmaj7')
    expect(varied[0].heldQualities).toEqual(['add9', 'maj7'])
  })

  it('hợp âm át không xoay — phải giữ bậc bảy', () => {
    const varied = varyHeldColors(colorSequence(parseChordInput('G7 G7').chords), {
      beatsOf: () => 4,
    })

    expect(varied.every((chord) => chord.quality.intervals.includes(10))).toBe(
      true,
    )
    expect(varied.every((chord) => !chord.holdRun)).toBe(true)
  })
})

describe('tách ô khi phát', () => {
  it('một token hai ô thành hai hợp âm, ô sau đánh dấu lướt', () => {
    const [held] = varyHeldColors(list('C'), { beatsOf: () => 8 })
    const exploded = explodeHeldBars([{ ...held, beats: 8 }], 4)

    expect(exploded.map((chord) => chord.symbol)).toEqual(['Cadd2', 'Cmaj7'])
    expect(exploded.map((chord) => chord.beats)).toEqual([4, 4])
    expect(exploded[1].passing).toBe(true)
  })
})
