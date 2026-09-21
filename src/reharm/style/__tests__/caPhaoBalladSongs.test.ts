import { describe, expect, it } from 'vitest'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-SONGS.json'
import acddEvidence from '../../../../Reference/CA-PHAO-BALLAD-ACDD.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { ACDD_MAIN, ACDD_EIGHT, CP_BALLAD_SONG_STYLES as styles, CP_BALLAD_SONG_FAMILIES } from '../styleLibrary/caPhaoBalladSongs'
import { getStyle, styleFamilies } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { sectionCellBreaks, resolveStyleForSection, transitionMuteWindows } from '../sectionStyles'
import { giveCompingToLeft, renderPattern, yieldToFill } from '../patternRenderer'
import { bossaFillsInGaps } from '../styleLibrary/caPhaoBossa'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { buildArrangedSong } from '../arrangement'

const sourceBars = [[9, 10], [25, 26], [21, 22], [35, 36], [40], acddEvidence.arrangement.chorusBars]

describe('CP ballad song-specific reductions', () => {
  it('preserves consecutive source LH attacks and durations, joining ACDD ties', () => {
    styles.forEach((style, index) => {
      const song = index >= 4 ? acddEvidence
        : evidence.songs.find(song => song.file.startsWith(index < 2 ? 'Co Em Cho' : 'Ngay mai'))!
      const bars: Partial<Record<string, { attacks: {
        at: number; dur: number; hand: number; grace: boolean; ties: string[]
      }[] }>> = song.representatives
      const expected = sourceBars[index].flatMap((bar, measure) => {
        const notes = index >= 4
          ? acddEvidence.representatives[String(bar) as keyof typeof acddEvidence.representatives].joinedAttacks.filter(n => n.hand === 2)
          : bars[bar]!.attacks.filter(n => n.hand === 2 && !n.grace && !n.ties.includes('stop'))
        return [...new Set(notes.map(n => n.at))].sort((a, b) => a - b)
          .map(at => [measure * 4 + at, Math.max(...notes.filter(n => n.at === at).map(n => n.dur))])
      })
      const cell = index === 4 ? ACDD_MAIN : style.cell!
      expect(cell.left.map(hit => [hit.beat, hit.durationBeats]), style.id).toEqual(expected)
      expect(style.bpm).toBe(song.tempos[0])
      expect(style.releaseRatio).toBe(1)
    })
  })

  it('registers three song families with automatic verse/chorus pairs', () => {
    expect(styleFamilies(styles).map(family => family.family)).toEqual(CP_BALLAD_SONG_FAMILIES)
    expect(styles).toHaveLength(6)
    for (const style of styles) {
      expect(getStyle(style.id)).toBe(style)
      expect(hoCuaDieu(style.id)).toBe('ballad')
      expect(isBalladStyle(style.id)).toBe(true)
    }
    expect(kieuTrongHo('ballad').filter(style => CP_BALLAD_SONG_FAMILIES.includes(style.family)))
      .toEqual([styles[0], styles[2], styles[4]])
    for (const index of [0, 2, 4]) {
      const verse = styles[index], chorus = styles[index + 1]
      expect(verse.cell).not.toEqual(chorus.cell)
      expect(verse.family).toBe(chorus.family)
      expect(resolveStyleForSection(verse.id, 'chorus')).toBe(chorus.id)
      expect(resolveStyleForSection(chorus.id, 'verse')).toBe(verse.id)
      expect(resolveStyleForSection(chorus.id, 'interlude')).toBe(verse.id)
    }
  })

  it('changes immediately to chorus A after an odd number of verse bars, then returns to verse A', () => {
    for (const index of [0, 2, 4]) {
      const verse = styles[index], chorus = styles[index + 1]
      const returnBeat = 12 + chorus.cell!.lengthBeats
      const endBeat = returnBeat + verse.cell!.lengthBeats
      const chords = parseChordInput(Array(endBeat / 4).fill('Cm7').join(' ')).chords
      const cellBreaks = sectionCellBreaks(verse.id, [{ startBeat: 0 }, { startBeat: 12 }, { startBeat: returnBeat }])
      const events = renderPattern(voiceLeadTwoHands(chords), verse, {
        beatsPerChord: 4, cellBreaks,
        cellAt: beat => (beat >= 12 && beat < returnBeat ? chorus : verse).cell!,
      })
      expect(events.filter(e => e.hand === 'left' && e.startBeat >= 12 && e.startBeat < returnBeat)
        .map(e => e.startBeat - 12)).toEqual(chorus.cell!.left.map(hit => hit.beat))
      expect(events.filter(e => e.hand === 'left' && e.startBeat >= returnBeat)
        .map(e => e.startBeat - returnBeat)).toEqual(verse.cell!.left.map(hit => hit.beat))
      for (const event of events) {
        const end = event.startBeat < 12 ? 12 : event.startBeat < returnBeat ? returnBeat : endBeat
        expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
      }
    }
  })

  it('keeps the reduced RH (including omitted melody/tie-stop) with CP chord colors in all keys', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7']) {
        for (const style of styles) {
          const chords = parseChordInput(Array(style.cell!.lengthBeats / 4).fill(`${root}${quality}`).join(' ')).chords
            .map(chord => ({ ...chord, voicingStyle: 'ca-phao' as const }))
          const events = renderPattern(voiceLeadTwoHands(chords), style)
          for (const hand of ['left', 'right'] as const) {
            expect(events.filter(e => e.hand === hand).map(e => e.startBeat), `${style.id}/${hand}/${root}`)
              .toEqual(style.cell![hand].map(hit => hit.beat))
          }
          for (const event of events) {
            expect(event.durationBeats).toBeGreaterThan(0)
            expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(style.cell!.lengthBeats)
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

  it('uses the selected chordal gesture as the main pattern, retaining chorus inner voice', () => {
    const verse = styles[4], chorus = styles[5]
    expect(acddEvidence.arrangement.versePatternOrder).toEqual(['main', 'main', 'eight', 'main', 'main', 'eight', 'main', 'main'])
    acddEvidence.arrangement.versePatternOrder.forEach((name, bar) => {
      const expected = name === 'main' ? ACDD_MAIN : ACDD_EIGHT
      for (const hand of ['left', 'right'] as const) {
        expect(verse.cell![hand].filter(hit => hit.beat >= bar * 4 && hit.beat < (bar + 1) * 4)
          .map(hit => ({ ...hit, beat: hit.beat - bar * 4 }))).toEqual(expected[hand])
      }
    })
    const hands = voiceLeadTwoHands(parseChordInput('Fm Bbm Eb7 Abmaj7').chords)
    const events = renderPattern(hands, chorus)
    expect(events.filter(event => event.hand === 'right' && event.startBeat < 4).map(event => event.startBeat)).toEqual([3])
    expect(events.some(event => event.hand === 'left' && event.startBeat === 0)).toBe(true)
  })

  it('keeps complete selected RH gestures, chord sizes and ties from the score', () => {
    for (const index of [4, 5]) {
      const expected = sourceBars[index].flatMap((bar, measure) => {
        const notes = acddEvidence.arrangement.selectedRight[String(bar) as keyof typeof acddEvidence.arrangement.selectedRight]
        return [...new Set(notes.map(n => n.at))].sort((a, b) => a - b).map(at => {
          const atBeat = notes.filter(n => n.at === at)
          return [measure * 4 + at, Math.max(...atBeat.map(n => n.dur)), atBeat.length]
        })
      })
      const cell = index === 4 ? ACDD_MAIN : styles[index].cell!
      expect(cell.right.map(hit => [hit.beat, hit.durationBeats, hit.tones!.length])).toEqual(expected)
    }
  })

  it('preserves the selected main chord sizes, register and tied answer', () => {
    const hands = voiceLeadTwoHands(parseChordInput('Eb7').chords)
    const events = renderPattern(hands, { ...styles[4], cell: ACDD_MAIN })
    expect(events.find(e => e.hand === 'right' && e.startBeat === 1)!.notes).toEqual([58, 61, 67])
    expect(events.find(e => e.hand === 'right' && e.startBeat === 2.75)!.durationBeats).toBe(.75)
    expect(events.some(e => e.hand === 'right' && e.startBeat === 3)).toBe(false)
    expect(events.find(e => e.hand === 'left' && e.startBeat === 3)!.notes).toHaveLength(2)
  })

  it('does not add a foreign flat seventh to add2 chords when reusing the main gesture', () => {
    for (const symbol of ['Cadd2', 'Gadd2']) {
      const chords = parseChordInput(symbol).chords
      for (const cell of [ACDD_MAIN, ACDD_EIGHT]) {
        const events = renderPattern(voiceLeadTwoHands(chords), { ...styles[4], cell })
        const flatSeventh = (chords[0].root + 10) % 12
        expect(events.flatMap(e => e.notes).some(note => note % 12 === flatSeventh)).toBe(false)
      }
    }
  })

  it('joins eight attacks without gaps, accents 1/5/8 and removes the ascending vocal contour', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7', 'm7b5', '9sus4']) {
        const hands = voiceLeadTwoHands(parseChordInput(`${root}${quality}`).chords)
        const events = renderPattern(hands, { ...styles[4], cell: ACDD_EIGHT })
        const eight = events.filter(e => e.startBeat < 2).sort((a, b) => a.startBeat - b.startBeat)
        expect(eight.map(e => e.startBeat)).toEqual([0, .25, .5, .75, 1, 1.25, 1.5, 1.75])
        expect(eight.map(e => e.hand)).toEqual(['left', 'left', 'left', 'left', 'right', 'right', 'right', 'right'])
        const weak = Math.max(...[1, 2, 3, 5, 6].map(i => eight[i].velocity))
        for (const index of [0, 4, 7]) expect(eight[index].velocity).toBeGreaterThan(weak)
        for (const event of events) {
          const next = events.find(e => e.startBeat > event.startBeat)
          if (next) expect(event.startBeat + event.durationBeats + 1e-8).toBeGreaterThanOrEqual(next.startBeat)
        }
        // A compact oscillating chord figure, not the old Db4-F4-Ab4-Db5 ascent.
        expect(eight[4].notes).toEqual(eight[6].notes)
        expect(eight[7].notes).toEqual([...eight[5].notes, ...eight[6].notes])
        expect(Math.max(...eight.slice(4).flatMap(e => e.notes)) - Math.min(...eight.slice(4).flatMap(e => e.notes)))
          .toBeLessThan(12)
      }
    }
  })

  it('keeps both F#m7b5 gestures and B9sus4 audible when a transition has no fill', () => {
    const verse = styles[4], chorus = styles[5]
    const row = 'Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4'
    const chords = parseChordInput(`${row} ${row} Em(add9)`).chords
    expect(chords).toHaveLength(17)
    const transitions = new Map([[15, { octaves: 2, restBeats: 2 }]])
    const spans = chords.map((_, index) => ({ start: index * 4, beats: 4 }))
    expect(transitionMuteWindows('hai-pop-ballad', spans, transitions)).toEqual([{ from: 60, to: 64 }])
    expect(transitionMuteWindows(chorus.id, spans, transitions)).toEqual([])
    const backing = renderPattern(voiceLeadTwoHands(chords), verse, {
      beatsPerChord: 4, cellBreaks: [0, 64],
      cellAt: beat => beat < 64 ? verse.cell! : chorus.cell!,
      muteWindows: transitionMuteWindows(verse.id, spans, transitions),
    })
    const mainFsharp = renderPattern(voiceLeadTwoHands([chords[6]]), { ...verse, cell: ACDD_MAIN })
    for (const start of [24, 56]) {
      expect(backing.filter(e => e.startBeat >= start && e.startBeat < start + 4)
        .map(e => ({ ...e, startBeat: e.startBeat - start }))).toEqual(mainFsharp)
    }
    const fill = generateFillLine(chords, { beatsPerChord: 4, sectionEnds: transitions, vocal: 'full' })
    expect(fill).toEqual([])
    const arranged = yieldToFill(giveCompingToLeft(backing, []), [])
    expect(arranged).toEqual(backing)
    for (const hand of ['left', 'right'] as const) {
      expect(arranged.filter(e => e.hand === hand && e.startBeat >= 60 && e.startBeat < 64)
        .map(e => e.startBeat - 60)).toEqual(ACDD_MAIN[hand].map(hit => hit.beat))
    }
    expect(arranged.some(e => e.hand === 'left' && e.startBeat === 64)).toBe(true)
    const song = buildArrangedSong({
      accompaniment: arranged, fills: [], solo: () => [], styleId: verse.id,
      sources: [
        { name: 'Verse', kind: 'verse', startBeat: 0, lengthBeats: 64 },
        { name: 'Chorus', kind: 'chorus', startBeat: 64, lengthBeats: 4 },
      ],
      steps: [{ type: 'section', source: 0 }, { type: 'section', source: 1 }],
    })
    // Arrangement re-labels high LH notes as RH; sounding notes/timing must survive.
    const sounding = (events: typeof arranged) => events.filter(e => e.startBeat >= 60 && e.startBeat < 64)
      .map(e => [e.startBeat, e.durationBeats, e.notes, e.velocity])
    expect(sounding(song.events)).toEqual(sounding(arranged))
  })

  it('does not replace the two-hand gesture with an automatically generated fill', () => {
    const hands = voiceLeadTwoHands(parseChordInput('Fm Bbm Eb7 Ab Db Bbm Eb7 Ab').chords)
    const backing = renderPattern(hands, styles[4])
    const overlapping = backing.filter(e => e.hand === 'right' && e.startBeat >= 5 && e.startBeat < 6)
    const accepted = bossaFillsInGaps(overlapping, backing)
    expect(accepted).toEqual([])
    expect(yieldToFill(giveCompingToLeft(backing, accepted), accepted)).toEqual(backing)
    const free = [{ ...overlapping[0], startBeat: 1.75, durationBeats: .125 }]
    expect(bossaFillsInGaps(free, backing)).toEqual(free)
  })
})
