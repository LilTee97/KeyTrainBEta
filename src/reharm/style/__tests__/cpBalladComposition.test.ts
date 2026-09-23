import { describe, expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { cpBalladApproaches, cpBalladEvidence, cpBalladGestures, holdCpBalladVoices } from '../cpBalladComposition'
import corpus from '../cpBalladSolos.json'
import { getStyle } from '../styleLibrary'
import { CP_BALLAD_SONG_STYLES } from '../styleLibrary/caPhaoBalladSongs'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { planCpBalladBacking } from '../cpBalladConnections'
import { planCpLicks } from '../../licky/cpLick'
import { buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import type { PitchClass } from '../../../shared/musicTheory/types'

const base: PhraseSectionOptions = { kind: 'interlude', key: { tonic: 4, scale: 'minor' },
  style: getStyle('ca-phao-ballad-co-em-cho')!, caPhaoCompose: true, caPhaoFull: true,
  thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [] }

describe('shared, source-audited CP ballad composer', () => {
  it('establishes major and connects episode registers for the saved G-major feedback', () => {
    for (let take = 0; take < 24; take++) for (const kind of ['intro', 'interlude'] as const) {
      const made = buildPhraseSection({ ...base, kind, take, key: { tonic: 7, scale: 'major' } })!
      expect(made.unavailableReason).toBeUndefined()
      let cursor = 0
      const opening = made.chords.filter((_, i) => { const at = cursor; cursor += made.beatsEach[i]; return at < 8 })
      expect(parseChordInput(opening.join(' ')).chords.some(c => c.root === 7 && c.quality.intervals.includes(4))).toBe(true)
      const right = made.events.filter(e => e.hand === 'right' && !e.grace)
      for (let beat = 8; beat < made.lengthBeats; beat += 8) {
        const before = Math.max(...right.filter(e => e.startBeat < beat).map(e => e.startBeat))
        const after = Math.min(...right.filter(e => e.startBeat >= beat).map(e => e.startBeat))
        const last = Math.max(...right.filter(e => e.startBeat === before).flatMap(e => e.notes))
        const next = Math.max(...right.filter(e => e.startBeat === after).flatMap(e => e.notes))
        expect(Math.abs(next - last)).toBeLessThanOrEqual(7)
      }
    }
  })
  it('inventories all divided ballad solos, without inventing keys or learning vocal pickups', () => {
    expect(cpBalladEvidence).toMatchObject({ sheets: 9, sections: 25, knownModeSections: 20 })
    expect(cpBalladEvidence.harmonicGestures).toBeGreaterThan(20)
    expect(cpBalladEvidence.rhythmOnlyGestures).toBeGreaterThan(10)
    const cec = corpus.sections.find(s => s.song === 'Co Em Cho' && s.kind === 'intro')!
    expect(cec.events.every(e => e.at < 31.5)).toBe(true)
    expect(cec.harmony.filter(h => h.at >= 24 && h.at < 28).map(h => [h.at, h.root, h.suffix]))
      .toEqual([[24, 2, 'm7'], [25.75, 7, '9sus4'], [26.25, 7, '9']])
    const acdd = corpus.sections.filter(s => s.song === 'Anh Cu Di Di')
    expect(acdd.map(s => s.kind)).toEqual(['interlude', 'outro'])
    expect(acdd[0].start).toBe(1.5)
    expect(acdd[0].end).toBe(18.5)
    for (const s of corpus.sections) {
      expect(s.events.every(e => e.at >= s.start && e.at < s.end)).toBe(true)
      if (s.mode === 'unknown') expect(s.harmony).toEqual([])
    }
    for (const g of cpBalladGestures) {
      expect(g.source.bars.filter(b => b.at >= g.from && b.at < g.from + 8).map(b => b.length)).toEqual([4, 4])
      expect(g.right.every(e => !e.clipped && e.at >= 0 && e.gates.every(d => e.at + d <= 8.001))).toBe(true)
      expect(g.source.events.some(e => e.hand === 'right' && e.at < g.from && e.gates.some(d => e.at + d > g.from + .001))).toBe(false)
    }
  })

  it('composes all CP ballad variants and future flagged styles in every major/minor key', () => {
    const future = { ...base.style, id: 'future-ballad', family: 'future-ballad' }
    for (const style of [...CP_BALLAD_SONG_STYLES, future, getStyle('pop-1')!])
      for (const scale of ['major', 'minor'] as const) for (let tonic = 0; tonic < 12; tonic++)
        for (const kind of ['intro', 'interlude', 'outro'] as const) {
          const keyboard = tonic % 2 ? { low: 48, high: 84 } : { low: 36, high: 96 }
          const made = buildPhraseSection({ ...base, style, kind, key: { tonic: tonic as PitchClass, scale },
            take: tonic, caPhaoKeyboardRange: keyboard })!
          expect(made.unavailableReason, `${style.id}/${scale}/${tonic}/${kind}`).toBeUndefined()
          expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBe(made.lengthBeats)
          expect(made.sourcePhrase?.method).toBe('cp-composition')
          expect(made.events.every(e => e.durationBeats > 0 && e.startBeat >= 0 &&
            e.startBeat + e.durationBeats <= made.lengthBeats + .001 &&
            e.notes.every(n => Number.isInteger(n) && n >= keyboard.low && n <= keyboard.high))).toBe(true)
          for (const trace of made.compositionSources!) {
            const source = cpBalladGestures.find(g => g.id === trace.melody)!
            expect(source.source.mode).toBe(scale)
            expect(trace.rhythm).toContain(` -> ${style.id}@`)
          }
          const right = made.events.filter(e => e.hand === 'right')
          for (const l of made.events.filter(e => e.hand === 'left'))
            for (const r of right.filter(r => r.startBeat < l.startBeat + l.durationBeats - .001 && r.startBeat + r.durationBeats > l.startBeat + .001))
              expect(Math.max(...l.notes)).toBeLessThanOrEqual(Math.min(...r.notes) - 2)
        }
  }, 30000)

  it('varies harmonic routes, source contours and rhythms, including cross-sheet timing only donors', () => {
    for (const scale of ['major', 'minor'] as const) {
      const takes = Array.from({ length: 20 }, (_, take) => buildPhraseSection({ ...base, take, key: { tonic: 4, scale } })!)
      expect(takes.every(s => !s.unavailableReason)).toBe(true)
      expect(new Set(takes.map(s => JSON.stringify(s.chords))).size).toBeGreaterThan(5)
      expect(new Set(takes.map(s => JSON.stringify(s.events.filter(e => e.hand === 'right').map(e => e.notes)))).size).toBeGreaterThan(5)
      expect(new Set(takes.map(s => JSON.stringify(s.events.filter(e => e.hand === 'right').map(e => e.startBeat)))).size).toBeGreaterThan(5)
      const trace = takes.flatMap(s => s.compositionSources!)
      expect(new Set(trace.map(t => cpBalladGestures.find(g => g.id === t.melody)!.source.song)).size).toBeGreaterThan(1)
      expect(trace.some(t => cpBalladGestures.find(g => t.rhythm.startsWith(g.id + ' ->'))?.source.mode === 'unknown')).toBe(true)
      expect(buildPhraseSection({ ...base, key: { tonic: 4, scale }, take: 3 })).toEqual(takes[3])
    }
  })

  it('keeps every target bass attack, with only source-attested punches or held-melody answers added', () => {
    const rhythms = new Set<string>()
    for (const style of CP_BALLAD_SONG_STYLES) {
      const made = buildPhraseSection({ ...base, style, take: 2 })!
      expect(made.unavailableReason).toBeUndefined()
      const chords = parseChordInput(made.chords.join(' ')).chords.map(c => ({ ...c, voicingStyle: 'ca-phao' as const }))
      const reference = renderPattern(voiceLeadTwoHands(chords, { dropRootFromRightHand: true }), style, { beatsEach: made.beatsEach })
      const bass = [...new Set(made.events.filter(e => e.hand === 'left').map(e => e.startBeat))]
      const original = [...new Set(reference.filter(e => e.hand === 'left').map(e => e.startBeat))]
      expect(bass).toEqual(expect.arrayContaining(original))
      for (const at of bass.filter(at => !original.includes(at))) {
        const trace = made.compositionSources!.find(t => at >= t.start && at < t.end)!
        const source = cpBalladGestures.find(g => trace.rhythm.startsWith(g.id + ' ->'))!
        const local = at % 8
        const answer = made.compositionTechniques?.find(t => t.kind === 'left-answer' && t.startBeat === at)
        if (answer) {
          expect(answer.source).toBe(source.id)
          expect(source.left.some(l => l.tones.length >= 2 && Math.abs(l.at - local) <= .501 &&
            source.right.some(r => r.at < l.at && r.at + Math.max(...r.gates) > l.at + .125))).toBe(true)
          expect(made.events.some(e => e.hand === 'right' && e.startBeat < at && e.startBeat + e.durationBeats > at + .125)).toBe(true)
        } else {
          expect(made.events.some(e => e.hand === 'right' && Math.abs(e.startBeat - at) < .001)).toBe(true)
          expect(source.right.some(r => r.tones.length >= 3 && Math.abs(r.at - local) <= .501 &&
            source.left.some(l => Math.abs(l.at - r.at) < .001))).toBe(true)
        }
      }
      rhythms.add(JSON.stringify(made.events.filter(e => e.hand === 'right').map(e => e.startBeat)))
    }
    expect(rhythms.size).toBeGreaterThan(3)
  })

  it('does not mistake ending decay for an active melody or hide RH gaps behind a sounding bass', () => {
    for (const scale of ['major', 'minor'] as const) for (const kind of ['intro', 'interlude', 'outro'] as const)
      for (let take = 0; take < 12; take++) {
        const made = buildPhraseSection({ ...base, kind, take, key: { tonic: 4, scale } })!
        expect(made.unavailableReason).toBeUndefined()
        const right = made.events.filter(e => e.hand === 'right')
        let until = 0
        for (const e of right) {
          expect(e.startBeat - until, `${scale}/${kind}/${take} at ${e.startBeat}`).toBeLessThanOrEqual(1.5)
          until = Math.max(until, e.startBeat + e.durationBeats)
        }
        for (const trace of made.compositionSources!) {
          const g = cpBalladGestures.find(g => trace.rhythm.startsWith(g.id + ' ->'))!
          expect(g.right.at(-1)!.at).toBeGreaterThanOrEqual(6)
          for (const start of [0, 4]) expect(g.right.filter(e => e.at >= start && e.at < start + 4).length).toBeGreaterThanOrEqual(3)
        }
      }
  })

  it('recovers written subdivisions, melodic development and two-hand gestures in CEC solos', () => {
    let triplets = 0, joint = 0, octaves = 0
    for (let take = 0; take < 8; take++) {
      const made = buildPhraseSection({ ...base, kind: 'intro', take, key: { tonic: 3, scale: 'major' } })!
      const right = made.events.filter(e => e.hand === 'right')
      const onsets = [...new Set(right.map(e => e.startBeat))]
      const tops = onsets.map(at => Math.max(...right.filter(e => e.startBeat === at).flatMap(e => e.notes)))
      const sourceAttacks = made.compositionSources!.filter(t => t.start % 8 === 0).reduce((sum, t) =>
        sum + cpBalladGestures.find(g => t.rhythm.startsWith(g.id + ' ->'))!.right.length, 0)
      // Density belongs to the selected written phrase, not an arbitrary quota.
      // Only the final half-beat may be replaced by the composed cadence.
      expect(onsets.length).toBeGreaterThanOrEqual(sourceAttacks - 3)
      expect(Math.max(...tops) - Math.min(...tops)).toBeGreaterThanOrEqual(12)
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(36)
      for (const at of onsets) {
        const notes = right.filter(e => e.startBeat === at).flatMap(e => e.notes)
        if (Math.abs(at * 4 - Math.round(at * 4)) > .01) triplets++
        if (notes.some(n => notes.includes(n + 12))) octaves++
        if (notes.length >= 3 && made.events.some(e => e.hand === 'left' && Math.abs(e.startBeat - at) < .001)) joint++
      }
    }
    expect(triplets).toBeGreaterThan(0)
    expect(joint).toBeGreaterThan(0)
    expect(octaves).toBeGreaterThan(0)
  })

  it('retains the held melody when only an inner chord voice is struck again', () => {
    const held = holdCpBalladVoices([
      { hand: 'right', notes: [60, 64, 67], startBeat: 0, durationBeats: 4, velocity: 78 },
      { hand: 'right', notes: [60, 65], startBeat: 1, durationBeats: .5, velocity: 74 },
    ])
    expect(held).toContainEqual({ hand: 'right', notes: [60], startBeat: 0, durationBeats: 1, velocity: 78 })
    expect(held).toContainEqual({ hand: 'right', notes: [64, 67], startBeat: 0, durationBeats: 4, velocity: 78 })
  })

  it('transfers CEC technique timing into minor without borrowing its major melody or harmony', () => {
    for (let take = 0; take < 8; take++) {
      const made = buildPhraseSection({ ...base, take })!
      const borrowed = made.compositionSources!.filter(t => t.rhythm.startsWith('Co Em Cho'))
      expect(borrowed.length).toBeGreaterThan(0)
      for (const trace of borrowed) {
        expect(cpBalladGestures.find(g => g.id === trace.melody)!.source.mode).toBe('minor')
        if (!trace.harmony.startsWith('cadence:'))
          expect(cpBalladGestures.find(g => g.id === trace.harmony)!.source.mode).toBe('minor')
      }
    }
  })

  it('spreads complementary source techniques through CEC interludes instead of repeatedly choosing only easy cells', () => {
    for (const scale of ['major', 'minor'] as const) {
      let complete = 0
      for (let take = 0; take < 12; take++) {
        const made = buildPhraseSection({ ...base, take, key: { tonic: 4, scale } })!
        const techniques = new Set(made.compositionTechniques?.map(t => t.kind))
        if (techniques.size >= 3) complete++
        expect(techniques.has('octave-line')).toBe(true)
        expect(techniques.size).toBeGreaterThanOrEqual(2)
      }
      // No quota forces a chromatic ornament when its harmony cannot resolve it.
      expect(complete).toBeGreaterThanOrEqual(scale === 'major' ? 10 : 6)
    }
  })

  it('preserves moving source contours instead of collapsing them into repeated notes', () => {
    for (const scale of ['major', 'minor'] as const) {
      let moving = 0, collapsed = 0, attacks = 0, repeated = 0
      for (let take = 0; take < 12; take++) {
        const made = buildPhraseSection({ ...base, take, key: { tonic: 4, scale } })!
        expect(made.unavailableReason).toBeUndefined()
        const right = made.events.filter(e => e.hand === 'right' && !e.grace)
        const onsets = [...new Set(right.map(e => e.startBeat))].sort((a, b) => a - b)
        const tops = onsets.map(at => Math.max(...right.filter(e => e.startBeat === at).flatMap(e => e.notes)))
        for (let i = 1; i < onsets.length; i++) {
          attacks++
          if (tops[i] === tops[i - 1]) repeated++
          const at = onsets[i], trace = made.compositionSources!.find(t => t.start <= at && at < t.end)!
          // Compare native timing only: cross-sheet contours are interpolated.
          if (!trace.rhythm.startsWith(trace.melody + ' ->') || at % 8 === 0 || at >= made.lengthBeats - .5) continue
          const g = cpBalladGestures.find(g => g.id === trace.melody)!
          const ix = g.right.findIndex(e => Math.abs(e.at - at % 8) < .001)
          if (ix <= 0 || Math.abs(g.right[ix - 1].at - onsets[i - 1] % 8) > .001) continue
          if (Math.max(...g.right[ix].tones) !== Math.max(...g.right[ix - 1].tones)) {
            moving++
            if (tops[i] === tops[i - 1]) collapsed++
          }
        }
      }
      expect(moving).toBeGreaterThan(200)
      expect(collapsed / moving).toBeLessThan(.08)
      expect(repeated / attacks).toBeLessThan(scale === 'major' ? .12 : .21)
    }
  })

  it('transfers written thirds/sixths and contextual semitone approaches, with traceable source evidence', () => {
    const found = new Set<string>()
    for (const scale of ['major', 'minor'] as const) for (let take = 0; take < 12; take++) {
      const made = buildPhraseSection({ ...base, take, key: { tonic: 4, scale } })!
      const right = made.events.filter(e => e.hand === 'right' && !e.grace)
      for (const t of made.compositionTechniques ?? []) {
        if (!['third-dyad', 'sixth-dyad', 'semitone-approach'].includes(t.kind)) continue
        found.add(t.kind)
        const g = cpBalladGestures.find(g => g.id === t.source)!
        const notes = right.filter(e => Math.abs(e.startBeat - t.startBeat) < .001).flatMap(e => e.notes)
        if (t.kind === 'semitone-approach') {
          const nextAt = Math.min(...right.filter(e => e.startBeat > t.startBeat + .001).map(e => e.startBeat))
          const next = Math.max(...right.filter(e => e.startBeat === nextAt).flatMap(e => e.notes))
          const direction = next - Math.max(...notes)
          expect(Math.abs(direction)).toBe(1)
          expect(cpBalladApproaches.some(a => a.source === g.source.id && a.mode === scale &&
            Math.abs(a.at - (g.from + t.startBeat % 8)) <= .501 && a.direction === direction)).toBe(true)
          expect(right.filter(e => e.startBeat === t.startBeat).every(e => e.durationBeats <= .334)).toBe(true)
        } else {
          const intervals = t.kind === 'third-dyad' ? [3, 4] : [8, 9]
          expect(notes.length).toBe(2)
          expect(intervals).toContain(Math.max(...notes) - Math.min(...notes))
          expect(g.right.some(e => Math.abs(e.at - t.startBeat % 8) <= .501 && e.tones.length === 2 &&
            intervals.includes(e.tones[1] - e.tones[0]))).toBe(true)
        }
      }
      // A newly voiced semitone must not leave the old melodic pitch ringing.
      const onsets = [...new Set(right.map(e => e.startBeat))].sort((a, b) => a - b)
      for (let i = 1; i < onsets.length; i++) {
        const at = onsets[i], prior = onsets[i - 1]
        const top = Math.max(...right.filter(e => e.startBeat === at).flatMap(e => e.notes))
        const oldTop = Math.max(...right.filter(e => e.startBeat === prior).flatMap(e => e.notes))
        if (![1, 11].includes((top - oldTop + 120) % 12)) continue
        for (const old of right.filter(e => e.startBeat === prior && e.notes.includes(oldTop)))
          expect(old.startBeat + old.durationBeats).toBeLessThanOrEqual(at + .125 + .001)
      }
    }
    expect(found).toEqual(new Set(['third-dyad', 'sixth-dyad', 'semitone-approach']))
    expect(cpBalladApproaches.some(a => a.source === 'Co Em Cho-Ca Phao:intro' && a.direction === -1)).toBe(true)
  })

  it('renders source-attested neighbour clusters briefly, with a stronger melody and nearby resolution in both modes', () => {
    for (const scale of ['major', 'minor'] as const) {
      let clusters = 0, answers = 0
      for (let take = 0; take < 12; take++) {
        const made = buildPhraseSection({ ...base, take, key: { tonic: 4, scale } })!
        const right = made.events.filter(e => e.hand === 'right')
        const chordAt = (at: number) => {
          let cursor = 0
          const index = made.beatsEach.findIndex(b => { cursor += b; return at < cursor - .00001 })
          return parseChordInput(made.chords[index]).chords[0]
        }
        for (const t of made.compositionTechniques ?? []) {
          if (t.kind === 'left-answer') { answers++; continue }
          if (t.kind !== 'neighbor-cluster') continue
          clusters++
          const source = cpBalladGestures.find(g => g.id === t.source)!
          expect(source.right.some(e => Math.abs(e.at - t.startBeat % 8) <= .501 &&
            e.tones.includes(Math.max(...e.tones) - 1))).toBe(true)
          const sounding = right.filter(e => Math.abs(e.startBeat - t.startBeat) < .001)
          const top = Math.max(...sounding.flatMap(e => e.notes))
          const lead = sounding.find(e => e.notes.includes(top))!
          const neighbor = sounding.find(e => e.notes.includes(top - 1))!
          expect(neighbor).toBeDefined()
          expect(neighbor.durationBeats).toBeLessThanOrEqual(.125)
          expect(neighbor.velocity).toBeLessThan(lead.velocity)
          const c = chordAt(t.startBeat)
          expect(c.quality.intervals.some(n => (c.root + n) % 12 === top % 12)).toBe(true)
          const nextAt = Math.min(...right.filter(e => e.startBeat > t.startBeat + .001).map(e => e.startBeat))
          const next = Math.max(...right.filter(e => e.startBeat === nextAt).flatMap(e => e.notes))
          expect(Math.abs(next - top)).toBeLessThanOrEqual(3)
          const nc = chordAt(nextAt)
          expect(nc.quality.intervals.some(n => (nc.root + n) % 12 === next % 12)).toBe(true)
        }
      }
      expect(clusters).toBeGreaterThan(0)
      expect(answers).toBeGreaterThan(0)
    }
  })

  it('resolves to the real next chord and closes outros on the correct mode tonic', () => {
    for (const scale of ['minor', 'major'] as const) for (const symbol of ['Em', 'Am', 'C', 'G']) {
      const opening = parseChordInput(symbol).chords[0]
      for (const kind of ['intro', 'interlude', 'outro'] as const) {
        const made = buildPhraseSection({ ...base, kind, opening, key: { tonic: 4, scale }, take: 7 })!
        const chord = parseChordInput(made.chords.at(-1)!).chords[0]
        expect(chord.root).toBe(kind === 'outro' ? 4 : (opening.root + 7) % 12)
        const last = made.events.filter(e => e.hand === 'right').at(-1)!
        expect(last.startBeat + last.durationBeats).toBeCloseTo(made.lengthBeats)
        if (kind === 'outro') {
          expect(chord.quality.intervals.includes(3)).toBe(scale === 'minor')
          expect(last.notes.at(-1)! % 12).toBe(4)
        } else expect([11, 2]).toContain((last.notes.at(-1)! - opening.root + 120) % 12)
      }
    }
  })

  it('rejects unsupported feel, invalid key/range and runs compressed beyond the tempo limit', () => {
    for (const patch of [{ key: null }, { style: { ...base.style, beatsPerMeasure: 3 } },
      { style: { ...base.style, feel: 'swing' as const } }, { style: { ...base.style, gridUnit: .5 } },
      { caPhaoKeyboardRange: { low: 75, high: 84 } }, { bpm: 0 }, { bpm: 2000 }]) {
      const made = buildPhraseSection({ ...base, ...patch })!
      expect(made.unavailableReason).toBeTruthy()
      expect(made.events).toEqual([])
    }
  })

  it('keeps runs playable at ballad tempos, leaves no accidental gap at joins and supports chord/octave gestures', () => {
    let octave = 0, punch = 0, leftSupport = 0
    for (const style of CP_BALLAD_SONG_STYLES) for (const bpm of [60, 75, 90, 120])
      for (const scale of ['minor', 'major'] as const) {
        const made = buildPhraseSection({ ...base, style, bpm, key: { tonic: 4, scale }, take: bpm % 17 })!
        expect(made.unavailableReason, `${style.id}/${bpm}/${scale}`).toBeUndefined()
        const right = made.events.filter(e => e.hand === 'right' && !e.grace)
        for (const at of new Set(right.map(e => e.startBeat))) {
          const notes = right.filter(e => e.startBeat === at).flatMap(e => e.notes)
          octave += Number(notes.some(n => notes.includes(n + 12)))
          punch += Number(notes.length >= 3)
        }
        leftSupport += made.events.filter(e => e.hand === 'left' && e.notes.length > 1).length
        for (let beat = 8; beat < made.lengthBeats; beat += 8) {
          const before = Math.max(...made.events.filter(e => e.startBeat < beat).map(e => e.startBeat + e.durationBeats))
          const after = Math.min(...made.events.filter(e => e.startBeat >= beat).map(e => e.startBeat))
          expect(Math.max(0, after - before)).toBeLessThanOrEqual(.5)
        }
        const onsets = [...new Set(right.map(e => e.startBeat))].sort((a, b) => a - b)
        // Written chord rolls use short internal offsets, not separate melody attacks.
        for (let i = 1; i < onsets.length; i++) if (onsets[i] - onsets[i - 1] >= .12)
          expect((onsets[i] - onsets[i - 1]) * 60 / bpm).toBeGreaterThanOrEqual(.075)
      }
    expect(octave).toBeGreaterThan(0)
    expect(punch).toBeGreaterThan(0)
    expect(leftSupport).toBeGreaterThan(0)
  })

  it('retains protected sung connecting beats after assembling newly composed solos', () => {
    for (const style of [base.style, getStyle('ca-phao-ballad-acdd')!]) {
      const chords = parseChordInput('Em9 Am9 F#m7b5 B9sus4').chords.map(c => ({ ...c, voicingStyle: 'ca-phao' as const }))
      const connected = planCpBalladBacking(renderPattern(voiceLeadTwoHands(chords), style), chords,
        { style, key: base.key!, beatsPerChord: 4, transitions: new Map() })
      const plan = planCpLicks({ chords, style, key: base.key!, ...connected, beatsPerChord: 4, fullTransitions: true, take: 3 })
      const song = buildBossaSoloSong(plan.backing, 16,
        [{ name: 'Verse', kind: 'verse', startBeat: 0, lengthBeats: 16 }],
        [{ type: 'intro' }, { type: 'section', source: 0 }, { type: 'interlude', over: 0, loops: 1 },
          { type: 'section', source: 0 }, { type: 'outro' }],
        (kind, take) => buildPhraseSection({ ...base, style, kind, take, opening: chords[0] })!, plan.events, true)
      expect(song.phraseWarnings).toEqual([])
      expect(song.phraseSources.some(s => s.includes('câu mới CP'))).toBe(true)
      for (const verse of song.sections.filter(s => s.kind === 'verse'))
        for (const w of connected.protectedWindows)
          for (const e of connected.backing.filter(e => e.startBeat >= w.start && e.startBeat < w.end))
            expect(song.events).toContainEqual({ ...e, startBeat: e.startBeat + verse.startBeat })
    }
  })
})
