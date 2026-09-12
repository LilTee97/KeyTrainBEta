import { describe, expect, it } from 'vitest'
import { reharmonize } from '../reharmPipeline'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../../style/patternRenderer'
import { CA_PHAO_BOSSA_IMPROVED } from '../../style/styleLibrary/caPhaoBossa'

const make = (input: string, bossa = false) => reharmonize(parseChordInput(input).chords, {
  intensity: 'caPhao', teacherGenre: bossa ? 'bossa' : 'ballad', key: { tonic: 9, scale: 'minor' },
})

describe('Màu + voicing Cà Pháo từ sheet', () => {
  it('giữ v thứ, V7 và màu đã chỉ định; không ép mọi V thành 9', () => {
    expect(make('Am Dm Em E7 G C F', true).colored.map(c => c.symbol))
      .toEqual(['Am9', 'Dm11', 'Em7', 'E7', 'G7', 'C7', 'Fmaj7'])
    expect(make('Am Dm Em E7 G Am').colored.map(c => c.symbol))
      .toEqual(['Am7', 'Dm7', 'Em7', 'E7', 'G', 'Am7'])
    expect(make('Am11 Dm9 E7b9 E9sus4 C/E').colored.map(c => c.symbol))
      .toEqual(['Am11', 'Dm9', 'E7b9', 'E9sus4', 'Cmaj7/E'])
  })

  it('Dm9 phát đúng cụm C–E–F–A của ô 9, không mất 9 hoặc b3 khi renderer chỉ lấy 3 tiếng', () => {
    const result = make('Dm9', true)
    const hands = voiceLeadTwoHands(result.final)
    expect(hands[0]!.right.map(n => n % 12)).toEqual([0, 4, 5, 9])
    const events = renderPattern(hands, CA_PHAO_BOSSA_IMPROVED, { beatsPerChord: 8 })
    const chords = events.filter(e => e.hand === 'right')
    expect(chords.length).toBeGreaterThan(3)
    expect(chords.every(e => JSON.stringify(e.notes.map(n => n % 12)) === '[0,4,5,9]')).toBe(true)
    expect(hands[0]!.right.at(-1)! - hands[0]!.right[0]!).toBeLessThanOrEqual(12)
  })

  it('maj9 giữ upper structure 7–9–3, và metadata sống qua đường hòa âm', () => {
    const result = make('Abmaj9 Dm11 A7b13')
    const hands = voiceLeadTwoHands(result.final)
    expect(hands[0]!.right.map(n => n % 12)).toEqual([7, 10, 0])
    expect(hands[1]!.right.map(n => n % 12)).toEqual([0, 4, 5, 7])
    expect(hands[2]!.right.map(n => n % 12)).toEqual([7, 1, 5])
    expect(result.final.every(c => c.voicingStyle === 'ca-phao')).toBe(true)
  })
})
