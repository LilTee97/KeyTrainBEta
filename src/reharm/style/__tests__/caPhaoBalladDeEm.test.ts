import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { hoCuaDieu } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'

// MIDI đo từ `PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl` trên ô THẬT
// (ô XML k phách 2 → ô k+1 phách 2), xem Reference/CA-PHAO-BALLAD-DE-EM.md.
const VERSE = 'ca-phao-ballad-de-em-roi-xa', CHORUS = 'ca-phao-ballad-de-em-roi-xa-chorus'
const play = (id: string, chords: string, beatsPerChord: number, hand: 'left' | 'right', from: number, to: number) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(id)!, { beatsPerChord })
    .filter(e => e.hand === hand && e.startBeat >= from - 1e-6 && e.startBeat < to - 1e-6)
    .map(e => [+e.startBeat.toFixed(3), [...e.notes].sort((a, b) => a - b)])

describe('Ballad Để em — Cà Pháo, Để Em Rời Xa', () => {
  it('phiên trên Dm7 ra đúng tay trái và bè tay phải ô thật 9', () => {
    expect(play(VERSE, 'Bb Dm7', 4, 'left', 4, 8)).toEqual([
      [4, [38]], [4.5, [48, 50]], [5.25, [57]], [5.75, [38]], [6.5, [50]], [7, [50]], [7.25, [57]]])
    expect(play(VERSE, 'Bb Dm7', 4, 'right', 4, 8)).toEqual([[5, [60, 65]], [7, [60, 65]]])
  })

  it('điệp trên Bb C A Dm7 (hai phách mỗi hợp âm) ra đúng bè tay phải ô thật 24–25', () => {
    expect(play(CHORUS, 'Bb C A Dm7', 2, 'right', 0, 5.5)).toEqual([
      [0, [65]], [.75, [65]], [1.333, [65, 70]], [2, [64, 72]],
      [2.75, [60]], [3, [62, 67]], [3.25, [64]], [3.5, [60]],
      [4, [69, 73]], [4.5, [69]], [4.75, [69]], [5, [64]], [5.25, [73]]])
  })

  it('tay trái không lên quá Bb3 của sheet, không trùng phím tay phải cùng lúc', () => {
    for (const [id, chords] of [[VERSE, 'Bb Dm7 C F'], [CHORUS, 'Bb C A7 Dm7'], [CHORUS, 'B E7 F#m G']]) {
      const events = renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(id)!, { beatsPerChord: 4 })
      expect(Math.max(...events.filter(e => e.hand === 'left').flatMap(e => e.notes)), id).toBeLessThanOrEqual(60)
      for (const l of events.filter(e => e.hand === 'left'))
        for (const r of events.filter(e => e.hand === 'right' && Math.abs(e.startBeat - l.startBeat) < 1e-6))
          expect(l.notes.filter(n => r.notes.includes(n)), `${id} ${l.startBeat}`).toEqual([])
    }
  })

  it('là một nút Ballad, tự đổi sang điệp, không mang màu Codex', () => {
    expect(hoCuaDieu(VERSE)).toBe('ballad')
    expect(isBalladStyle(VERSE)).toBe(true)
    expect(resolveStyleForSection(VERSE, 'chorus')).toBe(CHORUS)
    expect(resolveStyleForSection(CHORUS, 'verse')).toBe(VERSE)
    expect(isCodexStyle(VERSE) || isCodexStyle(CHORUS)).toBe(false)
    expect(getStyle(VERSE)!.bpm).toBe(85)
  })
})
