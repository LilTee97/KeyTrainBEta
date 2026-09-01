import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { chiecLaMotif } from '../chiecLaMotif'

const chords = parseChordInput('C F G C').chords

describe('motif Chiếc Lá', () => {
  it('Gm: Bb A D', () => {
    const notes = chiecLaMotif({
      chords,
      beatsPerChord: 4,
      tonic: 7,
      scale: 'minor',
    }).slice(0, 3).map((e) => e.notes[0])
    expect(notes).toEqual([82, 81, 74])
  })

  it('C: C B E', () => {
    const notes = chiecLaMotif({
      chords,
      beatsPerChord: 4,
      tonic: 0,
      scale: 'major',
    }).slice(0, 3).map((e) => e.notes[0])
    expect(notes).toEqual([72, 71, 64])
  })

  it('4 ô không nhảy quãng tám', () => {
    const notes = chiecLaMotif({
      chords,
      beatsPerChord: 4,
      tonic: 0,
      scale: 'major',
    })
    const first = notes[0]!.notes[0]!
    const later = notes[notes.length - 1]!.notes[0]!
    expect(Math.abs(later - first)).toBeLessThan(12)
  })

  it('ô 1: nghỉ phách 3', () => {
    const beats = chiecLaMotif({
      chords: chords.slice(0, 1),
      beatsPerChord: 4,
      tonic: 10,
      scale: 'major',
    }).map((e) => e.startBeat)
    expect(beats).toEqual([0, 0.5, 1, 1.5, 2.5, 3, 3.5])
  })

  it('chỉ dạo, không kết', () => {
    const style = getStyle('ton-hung-ballad')!
    const song = parseChordInput('C F G C').chords
    const base = {
      key: { tonic: 0, scale: 'major' as const },
      style,
      thay: 'ton-hung' as const,
      motif: 'chiec-la' as const,
      beatsPerChord: 4,
      dropRoot: true,
      opening: song[0]!,
      solo: () =>
        [{ notes: [60], startBeat: 0, durationBeats: 1, hand: 'right' as const, velocity: 50 }],
      songChords: song,
    }
    const dao = buildPhraseSection({ ...base, kind: 'intro' })!
      .events.filter((e) => e.hand === 'right')
      .slice(0, 3)
      .map((e) => e.notes[0])
    const ket = buildPhraseSection({ ...base, kind: 'outro' })!
      .events.filter((e) => e.hand === 'right')
      .map((e) => e.notes[0])
    expect(dao).toEqual([72, 71, 64])
    expect(ket).not.toEqual(dao)
  })
})
