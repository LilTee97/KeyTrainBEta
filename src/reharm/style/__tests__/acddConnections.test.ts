import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChordContextMenu } from '../../input/SongSheetView'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-TRANSITIONS.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { acddConnections, acddRunPitches } from '../acddConnections'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { bossaFillsInGaps } from '../styleLibrary/caPhaoBossa'
import { buildArrangedSong } from '../arrangement'

const style = getStyle('ca-phao-ballad-acdd')!
const chorus = getStyle('ca-phao-ballad-acdd-chorus')!
const parse = (text: string) => parseChordInput(text).chords
const pc = (n: number) => ((n % 12) + 12) % 12

describe('ACDD connections from CP boundary evidence', () => {
  it('audits all nine available ballads without claiming unknown chorus boundaries', () => {
    expect(evidence.songs).toHaveLength(9)
    expect(evidence.songs.find(s => s.song === 'Kém duyên')!.status).toContain('no verse/chorus')
    const acdd = evidence.songs.find(s => s.song === 'Anh Cu Di Di')!
    const bars: Partial<Record<string, { hands: { '2': string[] } }>> = acdd.boundaries[0].bars
    const source = bars['16']!.hands['2'].slice(-8)
    expect(source).toEqual(['2:Db3(0.25)', '2.25:F3(0.25)', '2.5:Ab3(0.25)', '2.75:B3(0.25)',
      '3:Bb3(0.25)', '3.25:G3(0.25)', '3.5:E3(0.25)', '3.75:C3(0.25)'])
    const [c, f] = parse('C7 Fm')
    expect(acddRunPitches(c, f)).toEqual([49, 53, 56, 59, 58, 55, 52, 48])
  })

  it('adapts the source turn to B9sus4 without importing C7 altered notes or a major third', () => {
    const [b, e] = parse('B9sus4 Em(add9)')
    const notes = acddRunPitches(b, e)
    const allowed = chordPitchClasses(b.root, b.quality)
    expect(notes).toHaveLength(8)
    expect(notes.every(n => allowed.includes(pc(n)))).toBe(true)
    expect(notes.some(n => pc(n) === 3)).toBe(false) // No D# in a suspended B chord.
    expect(notes[3]).toBeGreaterThan(notes[0])
    expect(notes[7]).toBeLessThan(notes[3])
    expect(pc(notes[7])).toBe(11)
  })

  it('plays the B9sus4 run even with full vocals, then enters the chorus on time', () => {
    const row = 'Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4'
    const chords = parse(`${row} ${row} Em(add9)`)
    const transitions = new Map([[15, { octaves: 2, restBeats: 0 }]])
    const plain = renderPattern(voiceLeadTwoHands(chords), style, {
      cellBreaks: [0, 64], cellAt: beat => beat < 64 ? style.cell! : chorus.cell!,
    })
    const connected = acddConnections(plain, chords, { beatsPerChord: 4, transitions })
    const notes = connected.filter(e => e.hand === 'left' && e.startBeat >= 62 && e.startBeat < 64)
    expect(notes.map(e => e.startBeat)).toEqual([62, 62.25, 62.5, 62.75, 63, 63.25, 63.5, 63.75])
    expect(notes.every(e => e.notes.length === 1 && e.durationBeats === .25)).toBe(true)
    expect(connected.filter(e => e.startBeat >= 64)).toEqual(plain.filter(e => e.startBeat >= 64))
    expect(generateFillLine(chords, { beatsPerChord: 4, vocal: 'full' })).toEqual([])
    expect(bossaFillsInGaps(notes, connected)).toEqual([]) // A second automatic line cannot erase the run.
    const song = buildArrangedSong({ accompaniment: connected, fills: [], solo: () => [],
      sources: [{ name: 'Verse', kind: 'verse', startBeat: 0, lengthBeats: 64 },
        { name: 'Chorus', kind: 'chorus', startBeat: 64, lengthBeats: 4 }],
      steps: [{ type: 'section', source: 0 }, { type: 'section', source: 1 }], styleId: style.id,
    })
    expect(song.events.filter(e => e.startBeat >= 62 && e.startBeat < 64).map(e => [e.startBeat, e.notes]))
      .toEqual(connected.filter(e => e.startBeat >= 62 && e.startBeat < 64).map(e => [e.startBeat, e.notes]))
  })

  it('runs into the next chord despite legacy rests, and honors delay/disabled transitions', () => {
    const chords = parse('B9sus4 Em')
    const plain = renderPattern(voiceLeadTwoHands(chords), style)
    for (const transition of [{ octaves: 2, restBeats: 2 }, { octaves: 2, restBeats: 1, delayBeats: 1 }]) {
      const out = acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map([[0, transition]]) })
      const run = out.filter(e => e.hand === 'left' && e.startBeat >= 2 && e.startBeat < 4)
      expect(run).toHaveLength(8)
      expect(run.at(-1)!.startBeat + run.at(-1)!.durationBeats).toBe(4)
      expect(out.some(e => e.hand === 'left' && e.startBeat === 4)).toBe(true)
    }
    for (const transition of [{ octaves: 0, restBeats: 2 }, { octaves: 2, restBeats: 0, delayBeats: 4 }]) {
      expect(acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map([[0, transition]]) })).toEqual(plain)
    }
  })

  it('places a run at the end of a held eight-beat chord without creating a gap', () => {
    const chords = parse('B9sus4 Em').map((c, i) => ({ ...c, beats: i === 0 ? 8 : 4 }))
    const plain = renderPattern(voiceLeadTwoHands(chords), style, { beatsEach: [8, 4] })
    const out = acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map([[0, { octaves: 2, restBeats: 2 }]]) })
    expect(out.filter(e => e.startBeat < 6)).toEqual(plain.filter(e => e.startBeat < 6))
    const run = out.filter(e => e.hand === 'left' && e.startBeat >= 6 && e.startBeat < 8)
    expect(run.map(e => e.startBeat)).toEqual([6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75])
    expect(run.at(-1)!.startBeat + run.at(-1)!.durationBeats).toBe(8)
    expect(out.some(e => e.startBeat === 8 && e.hand === 'left')).toBe(true)
  })

  it('shows a CP run toggle instead of inactive octave/rest controls, preserving the old menu elsewhere', () => {
    const props = { menu: { chordIndex: 0, x: 0, y: 0 }, paired: false, isLast: false,
      pairPlaces: 1, passing: [], fill: null, canMarkTransition: true,
      transition: { octaves: 2, restBeats: 2 }, onSetTransition: () => {} }
    const cp = renderToStaticMarkup(createElement(ChordContextMenu, { ...props, cpBalladTransition: true }))
    expect(cp).toContain('Câu chuyển đoạn CP')
    expect(cp).not.toContain('Im mấy phách cuối ô nối')
    expect(cp).not.toContain('Chạy mấy quãng tám ở ô nối')
    const other = renderToStaticMarkup(createElement(ChordContextMenu, props))
    expect(other).toContain('Im mấy phách cuối ô nối')
    expect(other).toContain('Chạy mấy quãng tám ở ô nối')
  })

  it('adds only one beat of low linking notes to the pictured progression, targeting slash bass', () => {
    const chords = parse('Gadd2 D9/F# Em(add9) D9 Cadd2')
    const plain = renderPattern(voiceLeadTwoHands(chords), style)
    const out = acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map(), key: { tonic: 7, scale: 'major' } })
    expect(out.filter(e => e.hand === 'right')).toEqual(plain.filter(e => e.hand === 'right'))
    for (const start of [3, 7, 11, 15]) {
      const line = out.filter(e => e.hand === 'left' && e.startBeat >= start && e.startBeat < start + 1)
      expect(line.map(e => e.startBeat - start)).toEqual([0, .5, .75])
      expect(line.map(e => e.durationBeats)).toEqual([.5, .25, .25])
      expect(line.every(e => e.notes.length === 1)).toBe(true)
      expect(out.filter(e => e.hand === 'left' && e.startBeat < start && e.startBeat >= start - 3)
        .every(e => e.startBeat + e.durationBeats <= start)).toBe(true)
    }
    expect(out.filter(e => e.hand === 'left' && e.startBeat >= 3 && e.startBeat < 4).map(e => e.notes[0]))
      .toEqual([47, 50, 52]) // B2-D3-E3 leads to F#, not D.
    expect(Math.max(...out.map(e => e.startBeat + e.durationBeats))).toBe(20)
  })

  it('does not decorate short/repeated chords, explicit rests, a final chord or existing running bass', () => {
    for (const chords of [parse('C C'), parse('C')]) {
      const plain = renderPattern(voiceLeadTwoHands(chords), style)
      expect(acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map() })).toEqual(plain)
    }
    const short = parse('G D').map(c => ({ ...c, beats: 2 }))
    const shortBacking = renderPattern(voiceLeadTwoHands(short), style, { beatsEach: [2, 2] })
    expect(acddConnections(shortBacking, short, { beatsPerChord: 4, transitions: new Map() })).toEqual(shortBacking)
    const chords = parse('G D')
    const plain = renderPattern(voiceLeadTwoHands(chords), style)
    expect(acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map(), muteWindows: [{ from: 3, to: 4 }] })).toEqual(plain)
    const running = [...plain, { hand: 'left' as const, startBeat: 3.5, durationBeats: .5, notes: [50], velocity: 50 }]
    expect(acddConnections(running, chords, { beatsPerChord: 4, transitions: new Map() })).toEqual(running)
  })

  it('preserves a passing chain and uses only its final harmony for a short transition', () => {
    const chords = parse('C F#m7b5 B9sus4 Em').map((c, i) => ({ ...c, beats: i === 0 ? 2 : i < 3 ? 1 : 4, passing: i === 1 || i === 2 }))
    const plain = renderPattern(voiceLeadTwoHands(chords), style, { beatsEach: [2, 1, 1, 4] })
    const out = acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map([[0, { octaves: 2, restBeats: 0 }]]) })
    expect(out.filter(e => e.startBeat < 3)).toEqual(plain.filter(e => e.startBeat < 3))
    expect(out.filter(e => e.hand === 'left' && e.startBeat >= 3 && e.startBeat < 4).map(e => e.startBeat))
      .toEqual([3, 3.25, 3.5, 3.75])
  })

  it('keeps all keys finite, within bass register and inside the original chord spans', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7', 'm7b5', '9sus4']) {
        const chords = parse(`${root}${quality} Em`)
        const plain = renderPattern(voiceLeadTwoHands(chords), style)
        const out = acddConnections(plain, chords, { beatsPerChord: 4, transitions: new Map([[0, { octaves: 2, restBeats: 0 }]]) })
        const run = out.filter(e => e.hand === 'left' && e.startBeat >= 2 && e.startBeat < 4)
        expect(run).toHaveLength(8)
        expect(run.every(e => e.notes.every(n => Number.isInteger(n) && n >= 36 && n <= 67))).toBe(true)
        expect(out.every(e => e.durationBeats > 0 && e.startBeat + e.durationBeats <= (e.startBeat < 4 ? 4 : 8))).toBe(true)
      }
    }
  })
})
