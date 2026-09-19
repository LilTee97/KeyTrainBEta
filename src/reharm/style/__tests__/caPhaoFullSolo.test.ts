import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { CA_PHAO_BOSSA_IMPROVED as bossa } from '../styleLibrary/caPhaoBossa'
import { ALL_STYLES } from '../styleLibrary'
import { cpGenre } from '../../licky/cpLick'
import sources from '../caPhaoFullSolos.json'
import { renderPattern } from '../patternRenderer'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { parseChordInput } from '../../input/chordInputParser'
import { bossaSoloSteps, buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { readSnapshot } from '../../persistence/songSnapshot'
import { scaleTones } from '../../reharmEngine/keyDetection'

const ballad = ALL_STYLES.find(s => cpGenre(s) === 'ballad')!
const base: PhraseSectionOptions = { kind: 'interlude', key: { tonic: 2, scale: 'minor' },
  style: bossa, thay: 'ca-phao', beatsPerChord: 4, opening: null, dropRoot: true,
  solo: () => [], take: 0, caPhaoFull: true, caPhaoKeyboardRange: { low: 21, high: 108 } }
const expectedNotes = (source: typeof sources.sections[number]) => source.events
  .filter(e => source.vocalPickupAt === null || e.hand !== 'right' || e.at < source.vocalPickupAt)
  .reduce((n,e) => n+e.tones.length, source.graces.length + (source.vocalPickupAt === null ? 0 : 6))

it('full Bossa includes all bars 41–48, ties, chord gestures, triplets, chromatic run and grace', () => {
  const made = buildPhraseSection(base)!
  const source = sources.sections.find(s => s.genre === 'bossa nova' && s.kind === 'interlude')!
  expect(made.lengthBeats).toBe(32)
  expect(made.sourcePhrase).toMatchObject({ fromBar: 41, barCount: 8, method: 'full-sheet' })
  expect(made.events).toHaveLength(expectedNotes(source))
  expect(made.events.filter(e => e.hand === 'right' && e.startBeat === 1)).toHaveLength(4)
  expect(made.events.filter(e => e.hand === 'right' && e.startBeat === 0).map(e => e.notes[0]).sort()).toEqual([65, 74])
  expect(made.events.some(e => Math.abs(e.startBeat - 22 - 1 / 3) < 1e-4)).toBe(true)
  expect(made.events.filter(e => e.hand === 'right' && e.startBeat >= 25.75 && e.startBeat < 28).map(e => e.notes[0]))
    .toEqual([67, 68, 69, 76, 73, 74, 76, 77, 78])
  expect(made.events.filter(e => e.hand === 'right' && e.startBeat >= 29.5 && e.startBeat < 30).map(e => e.notes[0]))
    .toEqual([73, 74])
})

it('every confirmed full source retains duration/note count on different keyboards and in 12 keys', () => {
  const coverage = new Set<string>()
  for (const style of [bossa, ballad]) for (const scale of ['minor', 'major'] as const)
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const pool = sources.sections.filter(s => s.genre === (style === bossa ? 'bossa nova' : 'ballad') && s.mode === scale && s.kind === kind)
      for (let take = 0; take < pool.length; take++) for (const range of [{ low: 48, high: 84 }, { low: 36, high: 84 },
        { low: 36, high: 96 }, { low: 28, high: 103 }, { low: 21, high: 108 }]) for (let tonic = 0; tonic < 12; tonic++) {
        const made = buildPhraseSection({ ...base, style, key: { tonic: tonic as PitchClass, scale }, kind, take,
          caPhaoFullSource: pool[take].song, caPhaoKeyboardRange: range })!
        expect(made.unavailableReason, `${style.id}/${scale}/${kind}/${take}/${tonic}/${range.low}`).toBeUndefined()
        const source = pool.find(s => s.id === made.sourcePhrase?.id)!
        coverage.add(source.id)
        expect(made.lengthBeats).toBe(source.lengthBeats)
        expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBe(source.lengthBeats)
        expect(parseChordInput(made.chords.join(' ')).errors, source.id).toEqual([])
        expect(made.events).toHaveLength(expectedNotes(source))
        for (const event of made.events) {
          expect(event.notes.every(n => n >= range.low && n <= range.high)).toBe(true)
          expect(event.durationBeats).toBeGreaterThan(0)
          expect(event.startBeat).toBeGreaterThanOrEqual(0)
          expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(made.lengthBeats + 1e-5)
        }
      }
    }
  expect(coverage.size).toBe(21)
}, 20000)

it('retains long Ballad interludes and does not import major sources into minor or Ballad into Bossa', () => {
  const major = buildPhraseSection({ ...base, style: ballad, key: { tonic: 0, scale: 'major' } })!
  const minor = buildPhraseSection({ ...base, style: ballad, key: { tonic: 9, scale: 'minor' } })!
  expect(major.lengthBeats).toBe(76)
  expect(minor.lengthBeats).toBe(64)
  expect(buildPhraseSection({ ...base, key: { tonic: 0, scale: 'major' } })!.unavailableReason).toContain('Chưa có')
  const outro = buildPhraseSection({ ...base, kind: 'outro' })!
  expect(outro.events.filter(e => e.startBeat >= 16).every(e => ![6, 11, 1].includes(e.notes[0] % 12))).toBe(true)
})

it('replaces the marked sung pickup with paired guides and aims V11 at the next section, not always tonic', () => {
  for (const kind of ['intro','interlude'] as const) for (const symbol of ['Dm','Am','Em','C','G','F']) {
    const opening = parseChordInput(symbol).chords[0]
    const made = buildPhraseSection({ ...base, kind, opening })!
    const finalChord = parseChordInput(made.chords.at(-1)!).chords[0]
    expect(finalChord.root).toBe((opening.root+7)%12)
    expect(finalChord.quality.intervals).toContain(17) // source V11 color
    const tail = made.events.filter(e => e.hand==='right' && e.startBeat>=30.5)
    expect(tail.map(e=>e.startBeat)).toEqual([30.5,30.5,31,31,31.5,31.5])
    expect(tail.slice(-2).map(e=>e.notes[0]%12).sort((a,b)=>a-b))
      .toEqual([(opening.root+11)%12,(opening.root+2)%12].sort((a,b)=>a-b))
    expect(made.lengthBeats).toBe(32)
    // Everything before the source cadence stays on the source phrase.
    const reference = buildPhraseSection({ ...base, kind })!
    const cadenceAt = kind === 'intro' ? 27.5 : 28
    expect(made.events.filter(e=>e.startBeat<cadenceAt)).toEqual(reference.events.filter(e=>e.startBeat<cadenceAt))
  }
})

it('only the last repeated full interlude leads to the following sung section', () => {
  const chords = parseChordInput('Em B7 Am B7').chords
  const backing = renderPattern(voiceLeadTwoHands(chords),bossa)
  const sections = [
    {name:'Điệp',kind:'chorus' as const,startBeat:0,lengthBeats:8},
    {name:'Phiên',kind:'verse' as const,startBeat:8,lengthBeats:8},
  ]
  const song = buildBossaSoloSong(backing,16,sections,[{type:'section',source:0},
    {type:'interlude',over:0,loops:2},{type:'section',source:1}],
    (kind,take,nextStart)=>buildPhraseSection({...base,key:{tonic:4,scale:'minor'},kind,take,
      opening:nextStart===undefined?null:chords[nextStart/4]})!,[],true)
  const interludes = song.soloSpans.filter(s=>s.kind==='interlude')
  expect(interludes.map(s=>s.lengthBeats)).toEqual([32,32])
  expect(interludes.map(s=>s.chords.at(-1))).toEqual(['B11','E11'])
})

it('off is identical to the current generator and full does not alter sung accompaniment', () => {
  for (const kind of ['intro', 'interlude', 'outro'] as const) {
    const old = { ...base, kind, caPhaoFull: undefined, take: 8 }
    expect(buildPhraseSection({ ...old, caPhaoFull: false })).toEqual(buildPhraseSection(old))
  }
  const backing = renderPattern(voiceLeadTwoHands(parseChordInput('Dm Gm A7 Dm').chords), bossa)
  const sections = [{ name: 'Phiên', kind: 'verse' as const, startBeat: 0, lengthBeats: 16 }]
  const steps = bossaSoloSteps([{ type: 'section', source: 0 }], sections)
  const song = buildBossaSoloSong(backing, 16, sections, steps,
    kind => buildPhraseSection({ ...base, kind, take: 1 })!, [], true)
  expect(song.phraseWarnings).toEqual([])
  for (const segment of song.segments) {
    if (!song.sections.some(s => s.startBeat === segment.startBeat && s.kind !== 'interlude')) continue
    const actual = song.events.filter(e => e.startBeat >= segment.startBeat && e.startBeat < segment.startBeat + segment.lengthBeats)
      .map(e => ({ ...e, startBeat: e.startBeat - segment.startBeat }))
    expect(actual).toEqual(backing)
  }
  for (const span of song.soloSpans) {
    const expected = buildPhraseSection({ ...base, kind: span.kind, take: 1 })!.events
    const actual = song.events.filter(e => e.startBeat >= span.startBeat && e.startBeat < span.startBeat + span.lengthBeats)
      .map(e => ({ ...e, startBeat: e.startBeat - span.startBeat }))
    expect(actual.length).toBe(expected.length)
    actual.forEach((e, i) => {
      expect(e.notes).toEqual(expected[i].notes)
      expect(e.hand).toBe(expected[i].hand)
      expect(e.startBeat).toBeCloseTo(expected[i].startBeat, 5)
    })
  }
})

it('the checkbox/range are saved and the real app playback branch passes both options', () => {
  const saved = { version: 1, sourceText: 'Dm A7', caPhaoFull: true, caPhaoKeyboardRange: { low: 36, high: 84 } }
  expect(readSnapshot(JSON.parse(JSON.stringify(saved)))).toEqual(saved)
  const app = readFileSync(new URL('../../ReharmHome.tsx', import.meta.url), 'utf8')
  expect(app).toContain('Câu solo Cà Pháo full')
  expect(app).toContain('setCaPhaoFull(saved.caPhaoFull ?? false)')
  expect(app).toContain('caPhaoFull: cpFullOn,')
  expect(app).toContain('caPhaoFullSource: cpFullSource,\n            caPhaoKeyboardRange,')
  expect(buildPhraseSection({ ...base, caPhaoKeyboardRange: { low: 80, high: 60 } })!.unavailableReason).toContain('không hợp lệ')
})

it('fresh full takes compose new notes but keep the same entire source structure and mode', () => {
  for (const source of sources.sections) {
      const style = source.genre === 'bossa nova' ? bossa : ballad
      const mode = source.mode as 'minor' | 'major'
      const kind = source.kind as PhraseSectionOptions['kind']
      const options = { ...base, style, key: { tonic: 2 as PitchClass, scale: mode }, kind, caPhaoFullSource: source.song }
      const reference = buildPhraseSection({ ...options, take: 0 })!
      const vocabulary = new Set(sources.sections.filter(s => s.genre === source.genre && s.mode === mode)
        .flatMap(s => s.events.filter(e => e.hand === 'right').flatMap(e => e.tones.map(n => (n + 2) % 12))))
      const signatures = new Set<string>()
      let previous = ''
      for (let take = 1; take <= 20; take++) {
        const made = buildPhraseSection({ ...options, take })!
        expect(made.lengthBeats).toBe(reference.lengthBeats)
        expect(made.chords).toEqual(reference.chords)
        expect(made.events.map(e => ({ ...e, notes: [] }))).toEqual(reference.events.map(e => ({ ...e, notes: [] })))
        const signature = JSON.stringify(made.events.map(e => e.notes))
        expect(signature, `${source.id}/${take}`).not.toBe(previous)
        made.events.forEach((e, i) => {
          if (e.notes[0] === reference.events[i].notes[0]) return
          const pc = e.notes[0] % 12
          const chordIndex = source.harmony.findLastIndex(h => h.at <= e.startBeat)
          const chord = parseChordInput(made.chords[chordIndex]).chords[0]
          const allowed = new Set<number>([...scaleTones(2, mode), ...chord.quality.intervals.map(n => (chord.root + n) % 12)])
          if (chord.quality.intervals.includes(3)) allowed.delete((chord.root + 4) % 12)
          else if (chord.quality.intervals.includes(4)) allowed.delete((chord.root + 3) % 12)
          expect(vocabulary.has(pc), source.id).toBe(true)
          expect(allowed.has(pc), source.id).toBe(true)
        })
        signatures.add(signature)
        previous = signature
        expect(buildPhraseSection({ ...options, take })).toEqual(made)
      }
      expect(signatures.size, source.id).toBeGreaterThan(1)
  }
})
