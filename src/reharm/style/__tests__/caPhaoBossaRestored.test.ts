import { expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { CA_PHAO_BOSSA_IMPROVED as style } from '../styleLibrary/caPhaoBossa'
import { bossaSoloSteps, buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import { renderPattern } from '../patternRenderer'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { parseChordInput } from '../../input/chordInputParser'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import type { PitchClass } from '../../../shared/musicTheory/types'
import type { ArrangementStep, SourceSection } from '../arrangement'
import { scaleTones } from '../../reharmEngine/keyDetection'
import { cpPhrases } from '../../licky/cpLick'

function make(kind: PhraseSectionOptions['kind'], tonic: number, take: number, opening?: string) {
  return buildPhraseSection({ kind, key: { tonic: tonic as PitchClass, scale: 'minor' }, style,
    beatsPerChord: 4, dropRoot: true, range: { low: 62, high: 84 }, take,
    opening: opening ? parseChordInput(opening).chords[0] : null, thay: 'ca-phao', solo: () => [] })!
}

it('new composition keeps approved rhythm, harmony, bass and endings across 12 minor keys', () => {
  const coverage = new Set<string>()
  for (const kind of ['intro', 'interlude', 'outro'] as const) for (let tonic = 0; tonic < 12; tonic++) {
    const variants = new Set<string>()
    let previous = ''
    let developed = 0
    for (let take = 4; take < 28; take++) {
      const result = make(kind, tonic, take)
      const archived = make(kind, tonic, take % 4)
      expect(result.unavailableReason).toBeUndefined()
      expect(result.chords).toEqual(archived.chords)
      expect(result.beatsEach).toEqual(archived.beatsEach)
      expect(result.lengthBeats).toBe(archived.lengthBeats)
      expect(result.events.filter(e => e.hand === 'left')).toEqual(archived.events.filter(e => e.hand === 'left'))
      expect(result.events.map(e => ({ ...e, notes: [] }))).toEqual(archived.events.map(e => ({ ...e, notes: [] })))
      const tail = kind === 'outro' ? 20 : 28
      expect(result.events.filter(e => e.startBeat >= tail)).toEqual(archived.events.filter(e => e.startBeat >= tail))
      const traces = result.developmentSources ?? []
      developed += traces.length
      expect(new Set(traces.map(t => t.song)).size).toBeLessThanOrEqual(1)
      for (const trace of traces) {
        coverage.add(trace.song)
        expect(cpPhrases.find(p => p.id === trace.id)?.evidence).toBe(`instrumental-${kind}`)
      }
      for (const event of result.events) {
        expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(result.lengthBeats + 1e-6)
        if (event.hand !== 'right') continue
        const old = archived.events.find(e => e.hand === 'right' && e.startBeat === event.startBeat)
        if (JSON.stringify(old?.notes) === JSON.stringify(event.notes)) continue
        let start = 0
        const index = result.beatsEach.findIndex(beats => {
          const matches = start <= event.startBeat && event.startBeat < start + beats
          start += beats
          return matches
        })
        const chord = parseChordInput(result.chords[index]).chords[0]
        const allowed = new Set<number>([...scaleTones(tonic as PitchClass, 'minor'), ...chord.quality.intervals.map(n => (chord.root + n) % 12)])
        expect(event.notes.every(n => allowed.has(n % 12))).toBe(true)
        expect(event.notes.every(n => n >= 62 && n <= 84)).toBe(true)
        expect(result.events.some(left => left.hand === 'left' &&
          left.startBeat < event.startBeat + event.durationBeats - 1e-6 &&
          event.startBeat < left.startBeat + left.durationBeats - 1e-6 && left.notes.some(n => event.notes.some(r => Math.abs(n - r) <= 1)))).toBe(false)
      }
      const signature = JSON.stringify(result.events)
      expect(signature, `${kind}/${tonic}: consecutive plays must differ`).not.toBe(previous)
      previous = signature
      variants.add(signature)
      expect(make(kind, tonic, take)).toEqual(result)
    }
    expect(developed, `${kind}/${tonic}: must actually develop source phrases`).toBeGreaterThan(0)
    expect(variants.size, `${kind}/${tonic}: beyond the old four versions`).toBeGreaterThan(4)
  }
  expect(coverage.size).toBeGreaterThanOrEqual(4)
}, 15000) // 864 phrases + deterministic replay; the full suite shares CPU across 160+ files.

it('restores all three solo kinds, respects saved sung order and keeps odd-length section A phase', () => {
  const chords = parseChordInput('Am Dm E7 Am Dm E7 Am').chords
  const backing = renderPattern(voiceLeadTwoHands(chords), style, { cellBreaks: [12] })
  const sources: SourceSection[] = [
    { name: 'Phiên', kind: 'verse', startBeat: 0, lengthBeats: 12 },
    { name: 'Điệp', kind: 'chorus', startBeat: 12, lengthBeats: 16 },
  ]
  const saved: ArrangementStep[] = [{ type: 'section', source: 0 }, { type: 'section', source: 1 }, { type: 'section', source: 0 }]
  const steps = bossaSoloSteps(saved, sources)
  expect(steps.filter(s => s.type === 'section')).toEqual(saved)
  expect(bossaSoloSteps(steps, sources)).toEqual(steps)
  const makeSong = (take: number) => buildBossaSoloSong(backing, 28, sources, steps,
    (kind, variant, nextStart) => make(kind, 9, take + variant, nextStart === 12 ? 'Am' : nextStart === 0 ? 'Dm' : undefined))
  for (const take of [4, 9, 19]) {
    const song = makeSong(take)
    expect(song.phraseWarnings).toEqual([])
    expect(song.totalBeats).toBe(32 + 40 + 64 + 24)
    expect(song.sections.filter(s => s.kind === 'interlude').length).toBeGreaterThan(0)
    let checked = 0
    for (const segment of song.segments) {
      if (!song.sections.some(s => s.startBeat === segment.startBeat && s.kind !== 'interlude')) continue
      const source = sources.find(s => s.startBeat === segment.sourceBeat)
      if (!source) continue
      const expected = backing.filter(e => e.startBeat >= source.startBeat && e.startBeat < source.startBeat + source.lengthBeats)
        .map(e => ({ ...e, startBeat: e.startBeat - source.startBeat + segment.startBeat }))
      for (const event of expected) expect(song.events).toContainEqual(event)
      checked++
    }
    expect(checked).toBe(saved.length)
  }
  const plain = buildBossaSoloSong(backing, 28, null, [], (kind, take) => make(kind, 9, 4 + take))
  expect(plain.totalBeats).toBe(32 + 28 + 64 + 24)
})

it('major keys do not enter the minor Bossa composer', () => {
  const major = buildPhraseSection({ kind: 'intro', key: { tonic: 0, scale: 'major' }, style,
    beatsPerChord: 4, dropRoot: true, opening: parseChordInput(pitchClassName(0) + 'maj7').chords[0],
    thay: 'ca-phao', take: 7, solo: () => [] })
  expect(major?.sourcePhrase?.id).not.toBe('nguoi-hay-quen-em-di-intro')
  expect(major?.developmentSources).toBeUndefined()
})

it('fresh app-sized takes also work in the default A-minor D4–G5 range', () => {
  for (const kind of ['intro', 'interlude', 'outro'] as const) {
    let previous = ''
    const variants = new Set<string>()
    for (let play = 0; play < 24; play++) {
      const result = buildPhraseSection({ kind, key: { tonic: 9, scale: 'minor' }, style,
        beatsPerChord: 4, dropRoot: true, range: { low: 62, high: 79 },
        take: 413_123_987 + play * 529, opening: null, thay: 'ca-phao', solo: () => [] })!
      expect(result.unavailableReason).toBeUndefined()
      const signature = JSON.stringify(result.events)
      expect(signature).not.toBe(previous)
      variants.add(signature)
      previous = signature
    }
    expect(variants.size).toBeGreaterThan(4)
  }
})
