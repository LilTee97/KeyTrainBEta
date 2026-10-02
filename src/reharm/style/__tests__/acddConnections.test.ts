import { describe, expect, it } from 'vitest'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-TRANSITIONS.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { acddRunPitches, balladChordLeads } from '../cpBalladConnections'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { bossaFillsInGaps } from '../styleLibrary/caPhaoBossa'

const parse = (text: string) => parseChordInput(text).chords
const pc = (n: number) => ((n % 12) + 12) % 12

// 30/9/2026: điệu Ballad ACDD đã xoá (cùng câu nối ACDD và nút "Câu chuyển đoạn CP"); câu chạy ACDD 16 vẫn là nguồn
// câu chạy của Ballad cứ đi (`cpLick`, `cuDiFill`).
describe('ACDD 16 run pitches from CP boundary evidence', () => {
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
})

describe('Co Em Cho one-beat chord leads', () => {
  it('links the pictured progression, preserving RH, earlier beats and slash bass', () => {
    const chords = parse('Gadd2 D9/F# Em(add9) D9 Cadd2 Bm7 Em(add9) Am9')
      .map((c, i) => ({ ...c, beats: i === 5 || i === 6 ? 2 : 4 }))
    for (const id of ['ca-phao-ballad-co-em-cho']) {
      const songStyle = getStyle(id)!
      const plain = renderPattern(voiceLeadTwoHands(chords), songStyle, { beatsEach: chords.map(c => c.beats) })
      const out = balladChordLeads(plain, chords, {
        beatsPerChord: 4, transitions: new Map(), key: { tonic: 7, scale: 'major' },
      })
      expect(out.filter(e => e.hand === 'right')).toEqual(plain.filter(e => e.hand === 'right'))
      for (const start of [3, 7, 11, 15, 19]) {
        const lead = out.filter(e => e.hand === 'left' && e.startBeat >= start && e.startBeat < start + 1)
        expect(lead.map(e => e.startBeat - start)).toEqual([0, .5, .75])
        expect(lead.map(e => e.durationBeats)).toEqual([.5, .25, .25])
        expect(lead.at(-1)!.startBeat + lead.at(-1)!.durationBeats).toBe(start + 1)
        expect(out.filter(e => e.startBeat >= start - 3 && e.startBeat < start)
          .map(e => [e.startBeat, e.notes, e.velocity]))
          .toEqual(plain.filter(e => e.startBeat >= start - 3 && e.startBeat < start)
            .map(e => [e.startBeat, e.notes, e.velocity]))
      }
      expect(out.filter(e => e.hand === 'left' && e.startBeat >= 3 && e.startBeat < 4).map(e => e.notes[0]))
        .toEqual([47, 50, 52])
      expect(out.filter(e => e.startBeat >= 20)).toEqual(plain.filter(e => e.startBeat >= 20))
      expect(Math.max(...out.map(e => e.startBeat + e.durationBeats)))
        .toBe(Math.max(...plain.map(e => e.startBeat + e.durationBeats)))
    }
  })

  it('keeps existing section transitions and rejects an optional fill colliding with the lead', () => {
    const chords = parse('Gadd2 D9/F# B9sus4 Em(add9)')
    const songStyle = getStyle('ca-phao-ballad-co-em-cho')!
    const muteWindows = [{ from: 8, to: 12 }]
    const plain = renderPattern(voiceLeadTwoHands(chords), songStyle, { muteWindows })
    const out = balladChordLeads(plain, chords, {
      beatsPerChord: 4, transitions: new Map([[2, { octaves: 2, restBeats: 2 }]]), muteWindows,
    })
    expect(out.filter(e => e.startBeat >= 8)).toEqual(plain.filter(e => e.startBeat >= 8))
    const note = { hand: 'left' as const, notes: [47], durationBeats: .25, velocity: 50 }
    const fills = [{ ...note, startBeat: 3.75 }, { ...note, startBeat: 9 }]
    expect(bossaFillsInGaps(fills, out)).toEqual([fills[1]])
  })
})
