import { describe, expect, it } from 'vitest'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-EVIDENCE.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { CA_PHAO_BALLAD } from '../styleLibrary/caPhaoBallad'
import { getStyle, getVisibleStyles } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { sectionCellBreaks, resolveStyleForSection } from '../sectionStyles'
import { renderPattern } from '../patternRenderer'

const sourceBars = [
  ['Ngay mai em di', '21'], ['Ngay mai em di', '35'],
  ['Chúng Ta Không Thuộc Về Nhau', '27'], ['Co Em Cho', '10'],
  ['Chưa Bao Giờ (Trung Quân)', '69'],
] as const

describe('Ballad CP from measured sheets', () => {
  it('keeps the five source LH attack grids and written durations, excluding ties', () => {
    sourceBars.forEach(([name, bar], index) => {
      const song = evidence.songs.find(song => song.song === name)!
      const records = song.representatives as Record<string, { attacks: {
        at: number; dur: number; hand: number; ties: string[]; grace: boolean
      }[] }>
      const notes = records[bar].attacks.filter(note => note.hand === 2 && !note.grace && !note.ties.includes('stop'))
      const grouped = [...new Set(notes.map(note => note.at))].sort((a, b) => a - b)
        .map(at => [at, Math.max(...notes.filter(note => note.at === at).map(note => note.dur))])
      const style = CA_PHAO_BALLAD[index]
      expect(style.cell!.left.map(note => [note.beat, note.durationBeats]), style.id).toEqual(grouped)
    })
  })

  it('exposes six independent buttons in Ballad without automatic chorus substitution', () => {
    expect(CA_PHAO_BALLAD).toHaveLength(6)
    for (const style of CA_PHAO_BALLAD) {
      expect(getStyle(style.id)).toBe(style)
      expect(getVisibleStyles()).toContain(style)
      expect(kieuTrongHo('ballad')).toContain(style)
      expect(hoCuaDieu(style.id)).toBe('ballad')
      expect(isBalladStyle(style.id)).toBe(true)
      expect(resolveStyleForSection(style.id, 'chorus')).toBe(style.id)
      expect(style.familyName).toBe(style.name)
    }
    expect(new Set(CA_PHAO_BALLAD.map(style => style.family)).size).toBe(6)
  })

  it('builds the signature as two complete source reductions and restarts A at a section boundary', () => {
    const style = CA_PHAO_BALLAD[5]
    expect(style.name).toBe('Ballad nét CP')
    expect(style.cell!.lengthBeats).toBe(8)
    expect(sectionCellBreaks(style.id, [{ startBeat: 0 }, { startBeat: 12 }])).toEqual([0, 12])
    const chords = parseChordInput('C C C C C').chords
    const events = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 4, cellBreaks: [0, 12] })
    expect(events.filter(event => event.hand === 'left' && event.startBeat >= 12 && event.startBeat < 16)
      .map(event => event.startBeat - 12)).toEqual([0, .5, 1])
    for (const hand of ['left', 'right'] as const) {
      expect(style.cell![hand].filter(hit => hit.beat < 4)).toEqual(CA_PHAO_BALLAD[0].cell![hand])
      expect(style.cell![hand].filter(hit => hit.beat >= 4).map(hit => ({ ...hit, beat: hit.beat - 4 })))
        .toEqual(CA_PHAO_BALLAD[1].cell![hand])
    }
  })

  it('does not reattack the tied inner voice in Chua Bao Gio at beat 4', () => {
    const right = CA_PHAO_BALLAD[4].cell!.right
    expect(right.some(hit => hit.beat === 3)).toBe(false)
    expect(right.find(hit => hit.beat === 2.75)?.durationBeats).toBe(.5)
  })

  it('keeps reduced RH voices when the user selects Ca Phao chord colors', () => {
    const chords = parseChordInput('Cm7 Cm7').chords.map(chord => ({ ...chord, voicingStyle: 'ca-phao' as const }))
    const voicings = voiceLeadTwoHands(chords)
    expect(voicings.every(voicing => voicing.voicingStyle === 'ca-phao')).toBe(true)
    for (const style of CA_PHAO_BALLAD) {
      const right = renderPattern(voicings, style).filter(event => event.hand === 'right')
      for (const event of right) {
        const hit = style.cell!.right.find(hit => hit.beat === event.startBeat % style.cell!.lengthBeats)!
        expect(event.notes.length, `${style.id}/${event.startBeat}`).toBe(hit.tones!.length)
      }
    }
  })

  it('preserves the repeating LH rhythm across all keys and major/minor chords', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7']) {
        const chords = parseChordInput(`${root}${quality} ${root}${quality}`).chords
        for (const style of CA_PHAO_BALLAD) {
          const events = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 4 })
          const expected = style.cell!.left.map(hit => hit.beat)
          if (style.cell!.lengthBeats === 4) expected.push(...expected.map(beat => beat + 4))
          expect(events.filter(event => event.hand === 'left').map(event => event.startBeat), `${style.id}/${root}${quality}`)
            .toEqual(expected)
          for (const event of events) {
            expect(event.notes.length).toBeGreaterThan(0)
            expect(event.durationBeats).toBeGreaterThan(0)
            expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(8.00001)
            expect(event.velocity).toBeGreaterThan(0)
            expect(event.velocity).toBeLessThanOrEqual(127)
            for (const note of event.notes) {
              expect(Number.isInteger(note)).toBe(true)
              expect(note).toBeGreaterThanOrEqual(21)
              expect(note).toBeLessThanOrEqual(event.hand === 'left' ? 67 : 84)
            }
          }
        }
      }
    }
  })

  it('sounds short chords and slash bass without carrying an old chord past its boundary', () => {
    const chords = parseChordInput('C/E Dm7 G7 Cmaj7').chords
    const starts = [0, 2, 3, 4]
    for (const style of CA_PHAO_BALLAD) {
      const events = renderPattern(voiceLeadTwoHands(chords), style, { beatsEach: [2, 1, 1, 4] })
      const bass = events.find(event => event.hand === 'left' && event.startBeat === 0)!
      expect(Math.min(...bass.notes) % 12).toBe(4)
      for (let index = 0; index < starts.length; index++) {
        const start = starts[index], end = starts[index + 1] ?? 8
        const inChord = events.filter(event => event.startBeat >= start && event.startBeat < end)
        expect(inChord.some(event => event.hand === 'left')).toBe(true)
        for (const event of inChord) expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end + 1e-6)
      }
    }
  })
})
