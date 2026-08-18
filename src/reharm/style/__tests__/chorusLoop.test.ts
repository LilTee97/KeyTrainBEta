import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chooseChorusLoop } from '../interludeLoop'

const list = (text: string) => parseChordInput(text).chords

describe('chooseChorusLoop', () => {
  it('bài móc Am Dm G C lặp hai lần thì lấy đúng móc đó', () => {
    const chords = list(
      'Amadd9 Dm9 G9 Cadd9 Fadd9 G9 Em7 Amadd9 Dm9 E9sus4 Amadd9 Dm9 G9 Cadd9',
    )
    const window = chooseChorusLoop(chords, 4)
    expect(window).toEqual({ from: 0, to: 3 })
    expect(chords.slice(0, 4).map((chord) => chord.root)).toEqual([9, 2, 7, 0])
  })
})
