import { describe, expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { coEmChoFramework } from '../coEmChoComposition'
import { getStyle } from '../styleLibrary'
import sources from '../caPhaoFullSolos.json'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import { planCpBalladBacking } from '../cpBalladConnections'
import { planCpLicks } from '../../licky/cpLick'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'

const base: PhraseSectionOptions = { kind: 'intro', key: { tonic: 3, scale: 'major' },
  style: getStyle('ca-phao-ballad-co-em-cho')!, caPhaoCompose: true, thay: 'ca-phao',
  beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [],
  caPhaoKeyboardRange: { low: 21, high: 108 } }
const original = (kind: string) => sources.sections.find(s => s.song === 'Co Em Cho' && s.kind === kind)!
const fingerprint = () => JSON.stringify(sources)

describe('Co Em Cho source-first solo', () => {
  it('removes only the confirmed vocal pickups/carry; never learns from sung RH', () => {
    const intro = coEmChoFramework('intro')
    expect(intro.events).toEqual(original('intro').events.filter(e => e.hand !== 'right' || e.at < 31.5)
      .sort((a, b) => a.at - b.at))
    expect(intro.events.filter(e => e.hand === 'left')).toEqual(original('intro').events.filter(e => e.hand === 'left'))
    const interlude = coEmChoFramework('interlude')
    expect(interlude.events.filter(e => e.at < 32)).toEqual(original('interlude').events
      .filter(e => e.hand !== 'right' || e.at >= .25).sort((a, b) => a.at - b.at))
    expect(interlude.events.filter(e => e.hand === 'right' && e.at >= 32).map(e => [e.at, e.tones, e.gates]))
      .toEqual([[32, [55, 62], [1, 1]], [33, [55, 60], [3, 3]]])
    expect(interlude.lengthBeats).toBe(36)
    expect(coEmChoFramework('outro').events).toEqual([...original('outro').events].sort((a, b) => a.at - b.at))
  })

  it('keeps source onsets, pitches and gates of BOTH hands at baseline, including triplets and ties', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const source = coEmChoFramework(kind)
      const made = buildPhraseSection({ ...base, kind, take: 0 })!
      const expected = source.events.flatMap(e => e.tones.map((n, i) => ({
        startBeat: e.at, notes: [n + 3], durationBeats: e.gates[i], hand: e.hand,
        velocity: e.articulations.includes('accent') ? 80 : e.hand === 'left' ? 64 : 72,
      }))).sort((a, b) => a.startBeat - b.startBeat)
      expect(source.events.some(e => e.arpeggiate || e.articulations.includes('staccato'))).toBe(false)
      expect(made.events).toEqual(expected)
      expect(made.compositionSources!.every(s => s.melody.startsWith('Co Em Cho-Ca Phao:') &&
        s.rhythm.includes('both-hands'))).toBe(true)
    }
  })

  it('varies only the source-proven IVmaj7 gesture, without breaking either hand or the chord timeline', () => {
    for (const kind of ['intro', 'interlude'] as const) {
      const from = kind === 'intro' ? 20 : 16, start = kind === 'intro' ? 16 : 20
      const donor = original(kind === 'intro' ? 'interlude' : 'intro')
      for (const src of [original(kind), donor]) {
        const boundary = src === donor ? from : start
        expect(src.events.some(e => [boundary, boundary + 4].some(at =>
          e.at < at && e.at + Math.max(...e.gates) > at + .0001))).toBe(false)
      }
      const zero = buildPhraseSection({ ...base, kind, take: 0 })!
      const one = buildPhraseSection({ ...base, kind, take: 1 })!
      expect(one.chords).toEqual(zero.chords)
      expect(one.beatsEach).toEqual(zero.beatsEach)
      expect(one.events.filter(e => e.startBeat < start || e.startBeat >= start + 4))
        .toEqual(zero.events.filter(e => e.startBeat < start || e.startBeat >= start + 4))
      const expected = donor.events.filter(e => e.at >= from && e.at < from + 4)
        .flatMap(e => e.tones.map((n, i) => [start + e.at - from, e.hand, n + 3, e.gates[i]]))
        .sort((a, b) => Number(a[0]) - Number(b[0]))
      expect(one.events.filter(e => e.startBeat >= start && e.startBeat < start + 4)
        .map(e => [e.startBeat, e.hand, e.notes[0], e.durationBeats])).toEqual(expected)
      expect(one.events).not.toEqual(zero.events)
      expect(one).toEqual(buildPhraseSection({ ...base, kind, take: 1 }))
    }
  })

  it('transposes every note/chord together to all major keys; no random progression or scale snapping', () => {
    const before = fingerprint()
    for (let tonic = 0; tonic < 12; tonic++) for (const kind of ['intro', 'interlude', 'outro'] as const)
      for (const take of [0, 1]) for (const caPhaoFull of [false, true]) {
        const made = buildPhraseSection({ ...base, kind, take, caPhaoFull, key: { tonic: tonic as PitchClass, scale: 'major' } })!
        const ref = buildPhraseSection({ ...base, kind, take, caPhaoFull, key: { tonic: 0, scale: 'major' } })!
        expect(made.unavailableReason).toBeUndefined()
        expect(made.lengthBeats).toBe(kind === 'intro' ? 32 : kind === 'interlude' ? 36 : 28)
        expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBe(made.lengthBeats)
        expect(parseChordInput(made.chords.join(' ')).errors).toEqual([])
        const octaveShift = made.events[0].notes[0] - tonic - ref.events[0].notes[0]
        expect(Math.abs(octaveShift % 12)).toBe(0)
        expect(made.events.map(e => e.notes[0] - tonic - octaveShift)).toEqual(ref.events.map(e => e.notes[0]))
        for (const e of made.events) {
          expect(e.startBeat).toBeGreaterThanOrEqual(0)
          expect(e.durationBeats).toBeGreaterThan(0)
          expect(e.startBeat + e.durationBeats).toBeLessThanOrEqual(made.lengthBeats + .0001)
          expect(e.notes.every(n => n >= 21 && n <= 108)).toBe(true)
        }
      }
    expect(fingerprint()).toBe(before)
  })

  it('uses measured ii-V bass timing, not the reversed printed labels', () => {
    const intro = coEmChoFramework('intro').harmony.filter(h => h.at >= 24 && h.at < 28)
    expect(intro.map(h => [h.at, h.root, h.suffix])).toEqual([[24, 2, 'm7'], [25.75, 7, '9sus4'], [26.25, 7, '9']])
    const outro = coEmChoFramework('outro')
    expect(outro.tonic).toBe(4) // E major, NOT C# minor just because the bass visits vi
    expect(outro.harmony.at(-1)!.root).toBe(0)
  })

  it('reports unsupported minor instead of disguising unrelated minor donors as Co Em Cho', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const made = buildPhraseSection({ ...base, kind, key: { tonic: 9, scale: 'minor' } })!
      expect(made.events).toEqual([])
      expect(made.unavailableReason).toContain('giọng thứ')
    }
    expect(buildPhraseSection({ ...base, key: null })!.unavailableReason).toBeTruthy()
    expect(buildPhraseSection({ ...base, caPhaoKeyboardRange: { low: 70, high: 84 } })!.unavailableReason).toBeTruthy()
  })

  it('fits the actual full-solo keyboard without dropping notes or changing their pitch classes', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) for (let tonic = 0; tonic < 12; tonic++) {
      const wide = buildPhraseSection({ ...base, kind, key: { tonic: tonic as PitchClass, scale: 'major' } })!
      const made = buildPhraseSection({ ...base, kind, key: { tonic: tonic as PitchClass, scale: 'major' },
        caPhaoKeyboardRange: { low: 36, high: 96 } })!
      expect(made.unavailableReason).toBeUndefined()
      expect(made.events.map(e => [e.startBeat, e.durationBeats, e.hand, e.notes[0] % 12]))
        .toEqual(wide.events.map(e => [e.startBeat, e.durationBeats, e.hand, e.notes[0] % 12]))
      expect(made.events.every(e => e.notes.every(n => n >= 36 && n <= 96))).toBe(true)
    }
  })

  it('assembles the new full solo route without losing sung chord leads or relabeling it free composition', () => {
    const key = { tonic: 0 as const, scale: 'major' as const }, style = base.style
    const chords = parseChordInput('Cmaj7 Am7 Fmaj7 G7').chords
      .map(c => ({ ...c, voicingStyle: 'ca-phao' as const }))
    const connected = planCpBalladBacking(renderPattern(voiceLeadTwoHands(chords), style), chords,
      { style, key, beatsPerChord: 4, transitions: new Map() })
    const plan = planCpLicks({ chords, style, key, ...connected, beatsPerChord: 4,
      fullTransitions: true, extraRuns: new Set([0, 1, 2]), take: 1 })
    const song = buildBossaSoloSong(plan.backing, 16,
      [{ name: 'Verse', kind: 'verse', startBeat: 0, lengthBeats: 16 }],
      [{ type: 'intro' }, { type: 'section', source: 0 }, { type: 'interlude', over: 0, loops: 1 },
        { type: 'section', source: 0 }, { type: 'outro' }],
      (kind, take) => buildPhraseSection({ ...base, kind, key, take, caPhaoFull: true, opening: chords[0] })!, plan.events, true)
    expect(song.phraseWarnings).toEqual([])
    expect(song.phraseSources.some(s => s.includes('biến thể Co Em Cho'))).toBe(true)
    expect(song.phraseSources.some(s => s.includes('câu mới CP'))).toBe(false)
    expect(connected.protectedWindows.length).toBeGreaterThan(0)
    const verses = song.sections.filter(s => s.kind === 'verse')
    expect(verses).toHaveLength(2)
    for (const verse of verses) for (const window of connected.protectedWindows) {
      for (const note of connected.backing.filter(e => e.startBeat >= window.start && e.startBeat < window.end))
        expect(song.events).toContainEqual({ ...note, startBeat: note.startBeat + verse.startBeat })
    }
  })
})
