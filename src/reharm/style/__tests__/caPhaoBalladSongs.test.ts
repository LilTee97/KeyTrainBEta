import { describe, expect, it } from 'vitest'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-SONGS.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { CP_BALLAD_SONG_STYLES as styles, CP_BALLAD_SONG_FAMILIES } from '../styleLibrary/caPhaoBalladSongs'
import { getStyle, styleFamilies } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { sectionCellBreaks, resolveStyleForSection } from '../sectionStyles'
import { renderPattern } from '../patternRenderer'

const sourceBars = [[9, 10], [25, 26], [21, 22], [35, 36]]

describe('CP ballad song-specific reductions', () => {
  it('preserves consecutive source LH attacks and written durations for all four cells', () => {
    styles.forEach((style, index) => {
      const song = evidence.songs.find(song => song.file.startsWith(index < 2 ? 'Co Em Cho' : 'Ngay mai'))!
      const bars: Partial<Record<string, { attacks: {
        at: number; dur: number; hand: number; grace: boolean; ties: string[]
      }[] }>> = song.representatives
      const expected = sourceBars[index].flatMap((bar, measure) => {
        const notes = bars[bar]!.attacks.filter(n => n.hand === 2 && !n.grace && !n.ties.includes('stop'))
        return [...new Set(notes.map(n => n.at))].sort((a, b) => a - b)
          .map(at => [measure * 4 + at, Math.max(...notes.filter(n => n.at === at).map(n => n.dur))])
      })
      expect(style.cell!.left.map(hit => [hit.beat, hit.durationBeats]), style.id).toEqual(expected)
      expect(style.bpm).toBe(song.tempos[0])
      expect(style.releaseRatio).toBe(1)
    })
  })

  it('adds exactly two families, each with verse/chorus, not another synthetic CP button', () => {
    expect(styleFamilies(styles).map(family => family.family)).toEqual(CP_BALLAD_SONG_FAMILIES)
    expect(styles).toHaveLength(4)
    for (const style of styles) {
      expect(getStyle(style.id)).toBe(style)
      expect(hoCuaDieu(style.id)).toBe('ballad')
      expect(isBalladStyle(style.id)).toBe(true)
    }
    expect(kieuTrongHo('ballad').filter(style => CP_BALLAD_SONG_FAMILIES.includes(style.family)))
      .toEqual([styles[0], styles[2]])
    for (const index of [0, 2]) {
      const verse = styles[index], chorus = styles[index + 1]
      expect(verse.cell).not.toEqual(chorus.cell)
      expect(verse.family).toBe(chorus.family)
      expect(resolveStyleForSection(verse.id, 'chorus')).toBe(chorus.id)
      expect(resolveStyleForSection(chorus.id, 'verse')).toBe(verse.id)
      expect(resolveStyleForSection(chorus.id, 'interlude')).toBe(verse.id)
    }
  })

  it('changes immediately to chorus A after an odd number of verse bars, then returns to verse A', () => {
    for (const index of [0, 2]) {
      const verse = styles[index], chorus = styles[index + 1]
      const chords = parseChordInput('Cm7 Cm7 Cm7 Cm7 Cm7 Cm7 Cm7').chords
      const cellBreaks = sectionCellBreaks(verse.id, [{ startBeat: 0 }, { startBeat: 12 }, { startBeat: 20 }])
      const events = renderPattern(voiceLeadTwoHands(chords), verse, {
        beatsPerChord: 4, cellBreaks,
        cellAt: beat => (beat >= 12 && beat < 20 ? chorus : verse).cell!,
      })
      expect(events.filter(e => e.hand === 'left' && e.startBeat >= 12 && e.startBeat < 20)
        .map(e => e.startBeat - 12)).toEqual(chorus.cell!.left.map(hit => hit.beat))
      expect(events.filter(e => e.hand === 'left' && e.startBeat >= 20)
        .map(e => e.startBeat - 20)).toEqual(verse.cell!.left.map(hit => hit.beat))
      for (const event of events) {
        const end = event.startBeat < 12 ? 12 : event.startBeat < 20 ? 20 : 28
        expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
      }
    }
  })

  it('keeps the reduced RH (including omitted melody/tie-stop) with CP chord colors in all keys', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7']) {
        const chords = parseChordInput(`${root}${quality} ${root}${quality}`).chords
          .map(chord => ({ ...chord, voicingStyle: 'ca-phao' as const }))
        for (const style of styles) {
          const events = renderPattern(voiceLeadTwoHands(chords), style)
          for (const hand of ['left', 'right'] as const) {
            expect(events.filter(e => e.hand === hand).map(e => e.startBeat), `${style.id}/${hand}/${root}`)
              .toEqual(style.cell![hand].map(hit => hit.beat))
          }
          for (const event of events) {
            expect(event.durationBeats).toBeGreaterThan(0)
            expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(8)
            const hit = style.cell![event.hand].find(hit => hit.beat === event.startBeat)!
            expect(event.notes).toHaveLength(hit.tones!.length)
            expect(event.notes.every(n => Number.isInteger(n) && n >= 21 && n <= 84)).toBe(true)
          }
        }
      }
    }
    expect(styles[1].cell!.right.some(hit => hit.beat === 4)).toBe(false)
  })

  it('retains slash bass and clips notes at short chord boundaries', () => {
    for (const style of styles) {
      const chords = parseChordInput('C/E Dm7 G7 Cmaj7').chords
      const events = renderPattern(voiceLeadTwoHands(chords), style, { beatsEach: [2, 1, 1, 4] })
      expect(Math.min(...events.find(e => e.hand === 'left' && e.startBeat === 0)!.notes) % 12).toBe(4)
      for (const [start, end] of [[0, 2], [2, 3], [3, 4], [4, 8]]) {
        const inChord = events.filter(e => e.startBeat >= start && e.startBeat < end)
        expect(inChord.some(e => e.hand === 'left')).toBe(true)
        for (const event of inChord) expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
      }
    }
  })
})
