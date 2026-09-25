import { describe, expect, it } from 'vitest'
import evidence from '../../../../Reference/BALLAD-DERX-EVIDENCE.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { BALLAD_DERX } from '../styleLibrary/balladDerx'
import { hoCuaDieu } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'

describe('Ballad DERX independent two-hand reduction', () => {
  it('retains measured onsets and tied gates of both hands', () => {
    for (const [index, bars] of [[0, ['4', '5']], [1, ['24', '25']]] as const) {
      for (const hand of ['left', 'right'] as const) {
        const expected = bars.flatMap((bar, i) => {
          const window = evidence.selected[bar]
          const notes = hand === 'left' ? window.notes.filter(n => n.hand === 2) : window.retainedRight
          return [...new Set(notes.map(n => n.at))].map(at => [
            +(at + i * 4).toFixed(5), +Math.max(...notes.filter(n => n.at === at).map(n => n.dur)).toFixed(5),
          ])
        })
        expect(BALLAD_DERX[index].cell![hand].map(h => [+h.beat.toFixed(5), +h.durationBeats.toFixed(5)]))
          .toEqual(expected)
      }
    }
  })

  it('holds RH F4 while LH runs A2 D3 E3 F3 E3 D3 C3', () => {
    const events = renderPattern(voiceLeadTwoHands(parseChordInput('Bbmaj7 Dm7').chords), BALLAD_DERX[0])
    const held = events.find(e => e.hand === 'right' && e.startBeat === 5.75)!
    expect(held.notes).toEqual([65])
    expect(held.durationBeats).toBe(2)
    expect(events.filter(e => e.hand === 'left' && e.startBeat >= 6.25)
      .map(e => [e.startBeat, e.durationBeats, e.notes])).toEqual([
      [6.25, .25, [45]], [6.5, .25, [50]], [6.75, .25, [52]], [7, .25, [53]],
      [7.25, .25, [52]], [7.5, .25, [50]], [7.75, .25, [48]],
    ])
  })

  it('preserves chorus inner voices and triplet rather than quantizing them', () => {
    const events = renderPattern(voiceLeadTwoHands(parseChordInput('Bb C A Dm7').chords), BALLAD_DERX[1],
      { beatsEach: [2, 2, 1.75, 2.25] })
    expect(events.filter(e => e.hand === 'right').map(e => [+e.startBeat.toFixed(3), e.notes])).toEqual([
      [0, [65]], [.75, [65]], [1.333, [65, 70]], [2, [64, 72]],
      [2.75, [60]], [3, [62, 67]], [3.25, [64]], [3.5, [60]],
      [4, [69, 73]], [4.5, [69]], [4.75, [69]], [5, [64]], [5.25, [73]],
      [5.75, [65, 69]], [7.25, [60]],
    ])
  })

  it('retains hand rhythm with CP colors in every key without crossing registers', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['', 'm', '7', 'maj7', 'm7']) {
        for (const cp of [false, true]) {
          for (const style of BALLAD_DERX) {
            const chords = parseChordInput(`${root}${quality} ${root}${quality}`).chords
              .map(chord => cp ? { ...chord, voicingStyle: 'ca-phao' as const } : chord)
            const events = renderPattern(voiceLeadTwoHands(chords), style)
            for (const hand of ['left', 'right'] as const) {
              expect(events.filter(e => e.hand === hand).map(e => e.startBeat)).toEqual(style.cell![hand].map(h => h.beat))
            }
            for (const event of events) {
              expect(event.durationBeats).toBeGreaterThan(0)
              expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(8)
              expect(event.notes.every(n => Number.isInteger(n) && (event.hand === 'left' ? n >= 36 && n <= 59 : n >= 60 && n <= 74)),
                `${style.id} ${root}${quality} ${event.hand} ${event.notes}`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('clips holds at short chord and section boundaries without adding RH attacks', () => {
    for (const style of BALLAD_DERX) {
      const chords = voiceLeadTwoHands(parseChordInput('C/E Dm7 G7 Cmaj7').chords)
      const events = renderPattern(chords, style, { beatsEach: [2, 1, 1, 4], cellBreaks: [0, 4] })
      for (const [start, end] of [[0, 2], [2, 3], [3, 4], [4, 8]]) {
        for (const event of events.filter(e => e.startBeat >= start && e.startBeat < end)) {
          expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
        }
      }
      expect(events.filter(e => e.hand === 'right').every(e =>
        style.cell!.right.some(h => Math.abs(h.beat - e.startBeat % 4) < 1e-6))).toBe(true)
    }
  })

  it('is a separate pink family with automatic chorus and no unsolicited bass-fill planner', () => {
    for (const style of BALLAD_DERX) {
      expect(isCodexStyle(style.id)).toBe(true)
      expect(isBalladStyle(style.id)).toBe(true)
      expect(hoCuaDieu(style.id)).toBe('ballad')
      expect(style.cpBalladChordLeads).not.toBe(true)
      expect(style.bpm).toBe(85)
    }
    expect(resolveStyleForSection('ballad-derx', 'chorus')).toBe('ballad-derx-chorus')
    expect(resolveStyleForSection('ballad-derx-chorus', 'verse')).toBe('ballad-derx')
    const old = getStyle('ca-phao-ballad-de-em-roi-xa')!
    expect(old.familyName).toBe('Ballad Để em')
    expect(isCodexStyle(old.id)).toBe(false)
    expect(old.cell).not.toEqual(BALLAD_DERX[0].cell)
  })
})
