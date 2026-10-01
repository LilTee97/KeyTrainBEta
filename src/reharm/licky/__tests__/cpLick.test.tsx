import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { cpBacking, cpFits, cpInventory, cpPhrases, cpTransitions, advancedCpRuns, placeCpPhrase, planCpLicks } from '../cpLick'
import { parseChordInput } from '../../input/chordInputParser'
import { CA_PHAO_BOSSA_IMPROVED as bossa } from '../../style/styleLibrary/caPhaoBossa'
import { getStyle } from '../../style/styleLibrary'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../../style/patternRenderer'
import { buildBossaRhythmOnly } from '../../playback/bossaRhythmOnly'
import { ChordContextMenu } from '../../input/SongSheetView'
import { readSnapshot } from '../../persistence/songSnapshot'
import type { PitchClass } from '../../../shared/musicTheory/types'
import type { TimelineEvent } from '../../style/types'
import type { SongKey } from '../../fillSoloGenerator/soloVocabulary'
import { scaleTones } from '../../reharmEngine/keyDetection'

// Điệu họ ballad còn giữ (30/9/2026). Cũ: Pop 1 — đã xoá.
const ballad = getStyle('ca-phao-ballad-co-em-cho')!
const chords = parseChordInput('Am9 Dm9 E7 Am9').chords
const key: SongKey = { tonic: 9, scale: 'minor' }

describe('CP Lick — source, two-hand cells and backing outside fills', () => {
  it('replaces full runs 39/64 with advanced compositions of varying length at section changes', () => {
    const sources = cpTransitions.filter(p=>p.evidence==='confirmed-transition')
    expect(sources.map(p=>[p.bar,p.notes.length,p.span])).toEqual([[39,12,4],[64,22,4]])
    const seen = new Set<number>()
    const lengths = new Set<number>()
    const melodies = new Set<string>()
    const cs = parseChordInput('Dm A13 Dm').chords
    const backing = renderPattern(voiceLeadTwoHands(cs),bossa)
    for (let take=0;take<24;take++) {
      const plan = planCpLicks({ chords:cs,style:bossa,key:{tonic:2,scale:'minor'},backing,
        beatsPerChord:4,sectionEnds:new Set([1]),vocal:new Set([0,1,2]),fullTransitions:true,take })
      expect(plan.placements).toHaveLength(1)
      const p = plan.placements[0]
      seen.add(p.source.bar)
      expect(p.advanced).toBe(true)
      expect(p.end).toBe(8)
      expect(p.end-p.start).toBeGreaterThanOrEqual(2)
      expect(p.end-p.start).toBeLessThanOrEqual(4)
      lengths.add(p.end-p.start)
      const right = p.events.filter(e=>e.hand==='right')
      melodies.add(JSON.stringify(right.map(e=>e.notes)))
      expect(right.length).toBeGreaterThanOrEqual(8)
      expect(right.length).toBeLessThanOrEqual(12)
      expect(Math.max(...right.map(e=>e.notes[0]))-Math.min(...right.map(e=>e.notes[0]))).toBeLessThanOrEqual(24)
      right.slice(1).forEach((e,i)=>{
        expect(e.startBeat-right[i].startBeat).toBeGreaterThanOrEqual(.25)
        expect(Math.abs(e.notes[0]-right[i].notes[0])).toBeLessThanOrEqual(12)
        expect(Math.sign(e.notes[0]-right[i].notes[0])).toBe(Math.sign(p.source.notes[i+1].tones[0]-p.source.notes[i].tones[0]))
      })
      expect(p.events.filter(e=>e.hand==='right').map(e=>e.startBeat-p.start)).toEqual(p.source.notes.map(n=>n.at))
      expect(cpFits(plan.events,plan.backing)).toBe(true)
      expect(plan.backing.filter(e=>e.startBeat<4||e.startBeat>=8)).toEqual(backing.filter(e=>e.startBeat<4||e.startBeat>=8))
      expect(plan.events.every(e=>e.notes.every(n=>n>=36&&n<=96))).toBe(true)
      for (const e of backing) if (e.startBeat+e.durationBeats<=p.start || e.startBeat>=p.end)
        expect(plan.backing).toContainEqual(e)
    }
    expect([...seen].sort()).toEqual([39,64])
    expect(lengths.size).toBeGreaterThan(1)
    expect(melodies.size).toBeGreaterThan(3)
    const options = {chords:cs,style:bossa,key:{tonic:2 as PitchClass,scale:'minor' as const},backing,
      beatsPerChord:4,sectionEnds:new Set([1]),fullTransitions:true}
    expect(planCpLicks({...options,skip:new Set([1])}).events).toEqual([])
    expect(planCpLicks({...options,transitionDelays:new Map([[1,Infinity]])}).events).toEqual([])
    expect(planCpLicks({...options,vocal:'full'}).events).toEqual([])
    const narrow = planCpLicks({...options,transitionDelays:new Map([[1,2.5]])})
    expect(narrow.events).toEqual([]) // no dense fallback in the 1.5-beat remainder
    expect(narrow.skipped).toContain(1)
    const sameOptions = {...options,take:7}
    expect(planCpLicks(sameOptions)).toEqual(planCpLicks(sameOptions))
  })

  it('màu Cà Pháo: nghỉ ĐÔN RA ở mốc chuyển đoạn — câu chạy CP kết ở vạch cũ, đệm tắt suốt chỗ nghỉ', () => {
    // Người dùng 26/9/2026: nghỉ đôn ra và nút "Mặc định" "hãy áp dụng cho mọi điệu". A13 ở mốc 4 phách + nghỉ 2 = 6 (4 → 10).
    const [dm, a13] = parseChordInput('Dm A13 Dm').chords
    const cs = [dm!, { ...a13!, beats: 6 }, dm!]
    const backing = renderPattern(voiceLeadTwoHands(cs), bossa, { beatsEach: [4, 6, 4] })
    for (let take = 0; take < 8; take++) {
      const plan = planCpLicks({ chords: cs, style: bossa, key: { tonic: 2, scale: 'minor' }, backing, beatsPerChord: 4,
        sectionEnds: new Set([1]), vocal: new Set([0, 1, 2]), fullTransitions: true, transitionRests: new Map([[1, 2]]), take })
      expect(plan.placements, `take ${take}`).toHaveLength(1)
      expect(plan.placements[0].end).toBe(10)
      expect(Math.max(...plan.events.map(e => e.startBeat)), `take ${take}: câu chạy kết trước chỗ nghỉ`).toBeLessThan(8)
      expect(plan.backing.some(e => e.startBeat >= 8 - 1e-6 && e.startBeat < 10 - 1e-6), `take ${take}: đệm tắt khi nghỉ`).toBe(false)
    }
  })

  it('reductions keep contiguous source gestures and leave the raw sheet repertoire unchanged', () => {
    const before = JSON.stringify(cpTransitions)
    for (const source of cpTransitions) for (const phrase of advancedCpRuns(source,5,4)) {
      const pitches = phrase.notes.map(n=>n.tones[0])
      expect(source.notes.some((_,i)=>JSON.stringify(source.notes.slice(i,i+pitches.length).map(n=>n.tones[0]))===JSON.stringify(pitches))).toBe(true)
      expect(phrase.support.length).toBeLessThanOrEqual(1)
      expect(phrase.support.every(n=>n.tones.length===1)).toBe(true)
      expect(phrase.notes.every(n=>n.gates[0]===.25)).toBe(true)
    }
    expect(JSON.stringify(cpTransitions)).toBe(before)
  })
  it('measures every active sheet; unknown keys do not silently enter the phrase pool', () => {
    expect(cpInventory).toHaveLength(9)
    expect(cpInventory.every(row => row.status === 'measured')).toBe(true)
    expect(cpPhrases.length).toBeGreaterThan(100)
    expect(cpPhrases.every(p => p.evidence.startsWith('instrumental-') || p.evidence === 'confirmed-fill')).toBe(true)
    expect(cpPhrases.filter(p => ['Kém duyên', 'Yêu xa'].includes(p.song))).toEqual([])
    for (const p of cpPhrases) {
      expect(p.span).toBeLessThanOrEqual(2.001)
      for (const n of p.notes) {
        expect(n.at).toBeGreaterThanOrEqual(0)
        expect(n.gates).toHaveLength(n.tones.length)
        expect(n.gates.every(gate => gate > 0 && n.at + gate <= p.span + 1e-5)).toBe(true)
      }
    }
  })

  it('advanced transitions adapt to 12 major/minor keys and keyboard limits', () => {
    let placed = 0
    for (let tonic=0;tonic<12;tonic++) for (const scale of ['major','minor'] as const)
      for (const keyboard of [{low:48,high:84},{low:36,high:96}]) for (const style of [bossa,ballad]) {
        const k = {tonic:tonic as PitchClass,scale}
        const current = { ...parseChordInput('C7').chords[0],root:((tonic+7)%12) as PitchClass }
        const target = { ...parseChordInput(scale==='minor'?'Cm':'C').chords[0],root:tonic as PitchClass }
        const plan = planCpLicks({chords:[current,target],style,key:k,backing:[],beatsPerChord:4,
          sectionEnds:new Set([0]),fullTransitions:true,keyboard,take:tonic})
        expect(plan.placements.length).toBeGreaterThan(0)
        for (const p of plan.placements) {
          placed++
          expect(p.events.every(e=>e.notes.every(n=>n>=keyboard.low&&n<=keyboard.high))).toBe(true)
          const right = p.events.filter(e=>e.hand==='right')
          expect(right.length).toBeGreaterThanOrEqual(8)
          expect(right.length).toBeLessThanOrEqual(12)
          const allowed = new Set<number>(scaleTones(k.tonic,k.scale))
          current.quality.intervals.forEach(n=>allowed.add((current.root+n)%12))
          allowed.delete((current.root+3)%12)
          right.forEach((e,i)=>{
            if (allowed.has(e.notes[0]%12)) return
            expect(right[i+1]).toBeDefined()
            expect(Math.abs(e.notes[0]-right[i+1].notes[0])).toBe(1)
            expect(allowed.has(right[i+1].notes[0]%12)).toBe(true)
          })
          expect(right.map(e=>e.durationBeats)).toEqual(p.source.notes.flatMap(n=>n.gates))
        }
      }
    expect(placed).toBe(96)
  })

  it('Bossa CP only replaces source-cell windows across 12 keys, modes and takes, including repeats', () => {
    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    let placed = 0
    let changed = 0
    for (let tonic = 0; tonic < 12; tonic++) for (const scale of ['major', 'minor'] as const) {
      const cs = parseChordInput(Array(4).fill(roots[tonic] + (scale === 'minor' ? 'm9' : 'maj7')).join(' ')).chords
      const backing = renderPattern(voiceLeadTwoHands(cs), bossa)
      const before = JSON.stringify(backing)
      for (let take = 0; take < 6; take++) {
        const plan = planCpLicks({ chords: cs, style: bossa, key: { tonic: tonic as PitchClass, scale }, backing,
          beatsPerChord: 4, extraFills: new Set([1, 3]), take })
        placed += plan.placements.length
        expect(cpFits(plan.events, plan.backing)).toBe(true)
        if (JSON.stringify(plan.backing) !== before) changed++
        for (const event of backing) {
          if (!plan.placements.some(p => event.startBeat < p.end && event.startBeat + event.durationBeats > p.start)) {
            expect(plan.backing).toContainEqual(event)
          }
        }
        for (const placement of plan.placements) {
          expect(placement.source.supportComplete).toBe(true)
          expect(placement.start % bossa.beatsPerMeasure).toBeCloseTo(placement.source.offset % placement.source.meter)
          const sourceNotes = [...placement.source.notes, ...placement.source.support]
          expect(placement.events.map(e => e.durationBeats)).toEqual(sourceNotes.flatMap(n => n.gates))
          expect(placement.events.map(e => e.startBeat - placement.start)).toEqual(sourceNotes.flatMap(n => n.tones.map(() => n.at)))
        }
        expect(plan.placements.every(p => p.source.genre === 'bossa')).toBe(true)
        const sources = [{ name: 'Phiên', kind: 'verse' as const, startBeat: 0, lengthBeats: 16 }]
        const steps = [{ type: 'intro' as const }, { type: 'section' as const, source: 0 },
          { type: 'section' as const, source: 0 }, { type: 'outro' as const }]
        const off = buildBossaRhythmOnly(backing, 16, sources, steps)
        const on = buildBossaRhythmOnly(plan.backing, 16, sources, steps, plan.events)
        expect(on.totalBeats).toBe(off.totalBeats)
        expect(on.soloSpans).toEqual([])
        expect(on.events.length).toBe((plan.backing.length + plan.events.length) * 2)
      }
      expect(JSON.stringify(backing)).toBe(before)
    }
    expect(placed).toBeGreaterThan(0)
    expect(changed).toBeGreaterThan(0)
  })

  it('uses ballad sources only, honours vocal windows, and never changes backing beyond its source cell', () => {
    const options = { chords, style: ballad, key, backing: [], beatsPerChord: 4,
      breaths: new Set([1, 3]), vocal: new Set([0, 2]), take: 3 }
    const plan = planCpLicks(options)
    expect(plan.placements.length).toBeGreaterThan(0)
    expect(plan.placements.every(p => [1, 3].includes(p.mainIndex) && p.source.genre === 'ballad' && p.source.mode === 'minor')).toBe(true)
    expect(planCpLicks({ ...options, skip: new Set([1, 3]) }).events).toEqual([])
    expect(planCpLicks({ ...options, vocal: 'full', extraRuns: new Set([1]) }).events).toEqual([])
    const busy: TimelineEvent[] = ['left', 'right'].map(hand => ({
      hand: hand as 'left' | 'right', notes: [60], startBeat: 0, durationBeats: 16, velocity: 60,
    }))
    const blocked = planCpLicks({ ...options, backing: busy, extraRuns: new Set([1]) })
    expect(blocked.placements.some(p => p.mainIndex === 1)).toBe(false)
    expect(blocked.skipped).toContain(1)
    expect(planCpLicks({ ...options, style: { ...ballad, id: 'unknown-style' } }).reason).toBeTruthy()
    expect(planCpLicks({ ...options, key: null }).events).toEqual([])
    expect(planCpLicks(options)).toEqual(planCpLicks(options))
  })

  it('preserves source gates/onsets; chord tones land, chromatic notes resolve and new takes vary', () => {
    const source = cpPhrases.find(p => p.genre === 'bossa' && p.kind === 'run' && p.hand === 'right')!
    let tested = 0
    for (let tonic = 0; tonic < 12; tonic++) for (const scale of ['major', 'minor'] as const) {
      const k: SongKey = { tonic: tonic as PitchClass, scale }
      const chord = { ...chords[0], root: tonic as PitchClass,
        quality: parseChordInput(scale === 'minor' ? 'Cm9' : 'Cmaj7').chords[0].quality }
      const events = placeCpPhrase(source, chord, undefined, k, 2, 1)
      if (!events.length) continue
      tested++
      const allowed = new Set<number>(scaleTones(k.tonic, k.scale))
      chord.quality.intervals.forEach(n => allowed.add((tonic + n) % 12))
      for (let i = 0; i < events.length; i++) {
        expect(events[i].startBeat).toBeCloseTo(2 + source.notes[i].at)
        expect(events[i].durationBeats).toBe(source.notes[i].gates[0])
        const pitch = events[i].notes[0]
        if (!allowed.has(pitch % 12)) {
          expect(i).toBeLessThan(events.length - 1)
          expect(Math.abs(events[i + 1].notes[0] - pitch)).toBe(1)
          expect(allowed.has(events[i + 1].notes[0] % 12)).toBe(true)
        }
      }
      expect(chord.quality.intervals.map(n => (tonic + n) % 12)).toContain(events.at(-1)!.notes[0] % 12)
    }
    expect(tested).toBeGreaterThan(0)
    const variants = new Set(Array.from({ length: 8 }, (_, take) => JSON.stringify(planCpLicks({
      chords, style: ballad, key, backing: [], beatsPerChord: 4, extraRuns: new Set([1]), take,
    }).events)))
    expect(variants.size).toBeGreaterThan(1)
  })

  it('CP menu replaces Licky and takes precedence over Linh; setting survives save/load', () => {
    const props = { menu: { chordIndex: 0, x: 0, y: 0 }, paired: false, isLast: false,
      pairPlaces: 1, passing: [], fill: false, run: false, onToggleFill: () => {}, onToggleRun: () => {},
      transition: null, canMarkTransition: false }
    const cp = renderToStaticMarkup(<ChordContextMenu {...props} cpLick cauLinhNhi />)
    expect(cp).toContain('CP Lick')
    expect(cp).toContain('CP Run')
    expect(cp).not.toContain('Licky Fills')
    expect(cp).not.toContain('Linh Fill')
    expect(renderToStaticMarkup(<ChordContextMenu {...props} />)).toContain('Licky Fills')
    const saved = { version: 1, sourceText: 'Am Dm E7 Am', cpLick: true }
    expect(readSnapshot(JSON.parse(JSON.stringify(saved)))?.cpLick).toBe(true)
  })

  it('all source gestures retain their gates or are rejected, without duplicate keys or unresolved chromatic notes', () => {
    const dominant = parseChordInput('E7').chords[0]
    const allowed = new Set<number>(scaleTones(9, 'minor'))
    dominant.quality.intervals.forEach(n => allowed.add((4 + n) % 12))
    allowed.delete(7) // G conflicts with the explicit G# third of E7.
    for (const source of cpPhrases) {
      const events = placeCpPhrase(source, dominant, chords[0], key, 2, 1)
      if (!events.length) continue
      expect(events.map(e => e.durationBeats)).toEqual(source.notes.flatMap(n => n.gates))
      expect(new Set(events.map(e => `${e.startBeat}:${e.notes[0]}`)).size).toBe(events.length)
      for (const event of events) {
        const pitch = event.notes[0]
        if (allowed.has(pitch % 12)) continue
        const following = events.find(e => e.startBeat > event.startBeat)
        expect(following).toBeDefined()
        expect(Math.abs(following!.notes[0] - pitch)).toBe(1)
        expect(allowed.has(following!.notes[0] % 12)).toBe(true)
      }
    }
  })

  it('can arrange a Bossa CP Run with sheet support; outside-window notes remain byte-for-byte', () => {
    const backing = renderPattern(voiceLeadTwoHands(chords), bossa)
    const plans = Array.from({ length: 8 }, (_, take) => planCpLicks({
      chords, style: bossa, key, backing, beatsPerChord: 4, extraRuns: new Set([1, 3]), take,
    }))
    expect(plans.some(plan => plan.placements.some(p => p.kind === 'run'))).toBe(true)
    const before: TimelineEvent[] = [
      { notes: [48], hand: 'left', startBeat: 0, durationBeats: 2.5, velocity: 70 },
      { notes: [60], hand: 'right', startBeat: 2, durationBeats: .5, velocity: 65 },
      { notes: [62], hand: 'right', startBeat: 3, durationBeats: 1, velocity: 65 },
    ]
    expect(cpBacking(before, [{ start: 2, end: 3 }])).toEqual([
      { ...before[0], durationBeats: 2 }, before[2],
    ])
    expect(cpBacking(before, [])).toEqual(before)
    expect(before[0].durationBeats).toBe(2.5)
  })
})
