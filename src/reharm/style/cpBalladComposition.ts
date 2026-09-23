import corpus from './cpBalladSolos.json'
import { parseChordInput } from '../input/chordInputParser'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { holdUntilStruckAgain, renderPattern } from './patternRenderer'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { degreesOf } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

type Source = typeof corpus.sections[number]
type Harmony = Source['harmony'][number]
type Attack = Source['events'][number]
type Chord = ReturnType<typeof parseChordInput>['chords'][number]
const pc = (n: number) => ((n % 12 + 12) % 12) as PitchClass
const near = (a: number, b: number) => Math.abs(a - b) < .001
const chordOf = (h: Harmony, tonic = 0) => parseChordInput(
  pitchClassName(pc(tonic + h.root)) + h.suffix +
  (h.bass === null ? '' : '/' + pitchClassName(pc(tonic + h.bass))),
).chords[0]
const chordType = (c: Chord) => c.quality.intervals.includes(6) ? 'dim' :
  c.quality.intervals.includes(3) ? 'minor' : c.quality.intervals.includes(10) ? 'dominant' : 'major'
const functionOf = (h: Harmony) => `${h.root}:${chordType(chordOf(h))}`

/** Whole two-bar gestures; never enter or leave in the middle of an RH tie. */
export const cpBalladGestures = corpus.sections.flatMap(source => source.bars.flatMap(bar => {
  const from = bar.at, end = from + 8
  if (bar.length !== 4 || !source.bars.some(b => near(b.at, from + 4) && b.length === 4) ||
    from < source.start || end > source.end + .001) return []
  const right = source.events.filter(e => e.hand === 'right' && e.at >= from && e.at < end)
  if (right.length < 3 || right.some(e => e.clipped || e.gates.some(g => e.at + g > end + .001)) ||
    source.events.some(e => e.hand === 'right' && e.at < from && e.gates.some(g => e.at + g > from + .001))) return []
  const first = source.harmony.findLast(h => h.at <= from)
  const harmony = first ? [{ ...first, at: 0 }, ...source.harmony.filter(h => h.at > from && h.at < end)
    .map(h => ({ ...h, at: h.at - from }))] : []
  const relative = (e: Attack) => ({ ...e, at: e.at - from })
  return [{ id: `${source.id}:bars:${bar.bar}-${bar.bar + 1}`, source, from, harmony,
    right: right.map(relative), left: source.events.filter(e => e.hand === 'left' && e.at >= from && e.at < end).map(relative),
    graces: source.graces.filter(e => e.at >= from && e.at < end).map(e => ({ ...e, at: e.at - from })) }]
}))
type Gesture = typeof cpBalladGestures[number]

// A printed symbol is insufficient evidence: require the sounding bass to agree
// at most changes. Unknown keys supply timing, never harmonic or pitch evidence.
function reliableHarmony(g: Gesture) {
  if (!g.harmony.length || g.source.mode === 'unknown') return false
  const scale = new Set(degreesOf(g.source.mode as 'major' | 'minor').map(d => d.semitones))
  return g.harmony.every((h, i) => {
    const c = chordOf(h)
    if (!c) return false
    const end = g.harmony[i + 1]?.at ?? 8
    const bass = g.left.find(e => e.at >= h.at - .001 && e.at < Math.min(end, h.at + 1))
    if (bass && !c.quality.intervals.some(n => pc(c.root + n) === pc(Math.min(...bass.tones))) &&
      pc(Math.min(...bass.tones)) !== c.bass) return false
    // Borrowed/secondary dominants need their observed resolution INSIDE the cell.
    const foreign = c.quality.intervals.some(n => !scale.has(pc(h.root + n)))
    if (!foreign) return true
    const next = g.harmony[i + 1]
    return !!next && (pc(h.root - next.root) === 7 || pc(h.root - next.root) === 1)
  })
}
const harmonicGestures = cpBalladGestures.filter(reliableHarmony)
const edges = harmonicGestures.flatMap(g => g.harmony.slice(1).map((h, i) =>
  ({ mode: g.source.mode, from: functionOf(g.harmony[i]), to: functionOf(h) })))

/** Local preparations/resolutions, not a global bag of chromatic notes. */
export const cpBalladApproaches = corpus.sections.filter(s => s.mode !== 'unknown').flatMap(s => {
  const r = s.events.filter(e => e.hand === 'right')
  return r.slice(1, -1).flatMap((e, j) => {
    const before = r[j], next = r[j + 2], h = s.harmony.findLast(h => h.at <= e.at)
    if (!h || !chordOf(h) || e.tones.length !== 1 || Math.max(...e.gates) > .334 ||
      e.at - before.at > .501 || next.at - e.at > .501 || s.harmony.findLast(h => h.at <= next.at) !== h ||
      Math.abs(Math.max(...next.tones) - e.tones[0]) !== 1) return []
    return [{ source: s.id, at: e.at, direction: Math.max(...next.tones) - e.tones[0],
      mode: s.mode, root: h.root, type: chordType(chordOf(h)),
      from: pc(Math.max(...before.tones) - h.root), tone: pc(e.tones[0] - h.root),
      to: pc(Math.max(...next.tones) - h.root) }]
  })
})

export const cpBalladEvidence = {
  sheets: new Set(corpus.sections.map(s => s.song)).size,
  sections: corpus.sections.length,
  knownModeSections: corpus.sections.filter(s => s.mode !== 'unknown').length,
  gestures: cpBalladGestures.length, harmonicGestures: harmonicGestures.length,
  rhythmOnlyGestures: cpBalladGestures.filter(g => g.source.mode === 'unknown').length,
}

/** Align source LH anchors to the active groove; reject destructive time warps. */
function adapt(g: Gesture, backing: TimelineEvent[], start: number, bpm: number, keepTiming = false) {
  const left = [...new Set(backing.filter(e => e.hand === 'left' && e.startBeat >= start && e.startBeat < start + 8)
    .map(e => e.startBeat - start))]
  const knots = [{ x: 0, y: 0 }]
  for (const x of [...new Set([...g.left.map(e => e.at), 4, 8])].sort((a, b) => a - b)) {
    if (x <= 0) continue
    const prior = knots.at(-1)!
    const targets = x === 4 || x === 8 ? [x] : left.filter(y => y > prior.y && Math.abs(x - y) <= .5 &&
      Math.floor(y / 4) === Math.floor(x / 4) && y < (x < 4 ? 4 : 8))
    const ranked = targets.filter(y => (y - prior.y) / (x - prior.x) >= .5 && (y - prior.y) / (x - prior.x) <= 2)
      .sort((a, b) => Math.abs(a - x) - Math.abs(b - x))
    if (ranked.length) knots.push({ x, y: ranked[0] })
  }
  if (knots.at(-1)!.x !== 8) return null
  const warp = (x: number) => {
    if (keepTiming) return x
    const i = Math.max(0, knots.findLastIndex(k => k.x <= x))
    const a = knots[i], b = knots[i + 1] ?? a
    const y = a === b ? a.y : a.y + (x - a.x) * (b.y - a.y) / (b.x - a.x)
    return near(x * 4, Math.round(x * 4)) ? Math.round(y * 4) / 4 : y
  }
  const right = g.right.map(e => ({ ...e, at: warp(e.at), gates: e.gates.map(d => warp(e.at + d) - warp(e.at)) }))
  if (right.some((e, i) => e.at < 0 || e.at >= 8 || e.gates.some(d => d <= 0) ||
    i > 0 && (e.at - right[i - 1].at < .12 || (e.at - right[i - 1].at) * 60 / bpm < .075)) ||
    right.some((e, i) => Math.abs(e.at - g.right[i].at) > .501)) return null
  let sourceEnd = 0, targetEnd = 0
  for (let i = 0; i < right.length; i++) {
    const sourceGap = Math.max(0, g.right[i].at - sourceEnd)
    if (Math.max(0, right[i].at - targetEnd) > sourceGap + .001) return null
    sourceEnd = Math.max(sourceEnd, g.right[i].at + Math.max(...g.right[i].gates))
    targetEnd = Math.max(targetEnd, right[i].at + Math.max(...right[i].gates))
  }
  // Off-grid source groups survive only under rigid translation, never as newly
  // invented tuplets created by squeezing straight notes onto unrelated accents.
  if (right.some((e, i) => !near(g.right[i].at * 4, Math.round(g.right[i].at * 4)) &&
    !near(e.at - g.right[i].at, right[Math.max(0, i - 1)].at - g.right[Math.max(0, i - 1)].at))) return null
  // Preserve written joint punches as solo support, not extra sung backing.
  const punches = g.right.flatMap((e, i) => e.tones.length >= 3 && g.left.some(l => near(l.at, e.at)) &&
    !left.some(t => near(t, right[i].at)) ? [right[i].at] : [])
  const matches = g.left.filter(e => left.some(t => near(t, warp(e.at)))).length
  return { right, warp, punches, cost: 1 - matches / Math.max(1, g.left.length) + punches.length * .08 +
    right.reduce((sum, e, i) => sum + Math.abs(e.at - g.right[i].at), 0) / right.length }
}

function fitGesture(g: Gesture, backing: TimelineEvent[], start: number, bpm: number) {
  // Already in 4/4: keep the written subdivisions unless aligning to this
  // groove is actually a better fit. Warping every bass note erased triplets.
  return [adapt(g, backing, start, bpm, true), adapt(g, backing, start, bpm)]
    .filter(f => f !== null).sort((a, b) => a.cost - b.cost)[0]
}

function activeGesture(g: Gesture) {
  // A closing flourish + a bar of decay belongs at the ending, not between
  // two active sentences. Inventory it, but don't recycle it as a body cell.
  let until = 0
  const continuous = g.right.every(e => {
    const gap = e.at - until
    until = Math.max(until, e.at + Math.max(...e.gates))
    return gap <= 1.5
  })
  return continuous && [0, 4].every(start => g.right.filter(e => e.at >= start && e.at < start + 4).length >= 3) &&
    g.right[0].at <= 1 && g.right.at(-1)!.at >= 6
}

function gestureTechniques(g: Gesture) {
  return [
    g.right.some(e => e.tones.some(n => e.tones.includes(n + 12))) && 'octaves',
    g.right.some(e => e.tones.includes(Math.max(...e.tones) - 1)) && 'clusters',
    g.right.some(e => !near(e.at * 4, Math.round(e.at * 4))) && 'subdivisions',
    g.right.some(e => e.tones.length >= 3 && g.left.some(l => near(l.at, e.at))) && 'punches',
    g.left.some(l => l.tones.length >= 2 && g.right.some(r => r.at < l.at &&
      r.at + Math.max(...r.gates) > l.at + .125)) && 'answers',
  ].filter((tag): tag is string => typeof tag === 'string')
}

type Slot = { at: number; gate: number; gates: number[]; voices: number; octave: boolean; motion: number; sourceTone: number;
  sourceChord: Harmony; height: number; intervals: number[]; source: string; cluster: boolean;
  approach?: typeof cpBalladApproaches[number]; dyad: 'third' | 'sixth' | undefined;
  stepwise: boolean; staccato: boolean; roll: boolean; grace: boolean }

export function holdCpBalladVoices(events: TimelineEvent[]): TimelineEvent[] {
  // Retrigger only the repeated voice, not an entire chord containing it.
  const sustained = holdUntilStruckAgain(events.flatMap(e => e.notes.map(n => ({ ...e, notes: [n] }))))
  const grouped = new Map<string, TimelineEvent>()
  for (const e of sustained) {
    const id = JSON.stringify({ ...e, notes: [] }), prior = grouped.get(id)
    if (prior) prior.notes.push(...e.notes)
    else grouped.set(id, { ...e, notes: [...e.notes] })
  }
  return [...grouped.values()].sort((a, b) => a.startBeat - b.startBeat)
}

export function composeCpBallad(options: PhraseSectionOptions): PhraseSection {
  const empty = (unavailableReason: string): PhraseSection => ({ events: [], chords: [], beatsEach: [], lengthBeats: 0, unavailableReason })
  const { key, style, kind } = options
  if (!key || !['major', 'minor'].includes(key.scale)) return empty('Ballad CP cần xác định giọng trưởng hoặc thứ.')
  if (style.beatsPerMeasure !== 4 || (style.gridUnit ?? 1) !== 1 || style.feel !== 'straight-block-chord')
    return empty('Chưa có phép chuyển câu ballad CP phù hợp nhịp/feel này.')
  const keyboard = options.caPhaoKeyboardRange ?? { low: 36, high: 96 }
  const requested = options.caPhaoFull ? { low: keyboard.low + 14, high: keyboard.high } : options.range ?? { low: 60, high: 84 }
  const range = { low: Math.max(keyboard.low + 14, requested.low), high: Math.min(keyboard.high, requested.high) }
  if (![keyboard.low, keyboard.high, range.low, range.high].every(Number.isInteger) || keyboard.low < 0 ||
    keyboard.high > 127 || range.high - range.low < 12) return empty('Tầm đàn chưa đủ để tách hai tay cho solo ballad CP.')
  const bpm = options.bpm ?? style.bpm
  if (!Number.isFinite(bpm) || bpm <= 0) return empty('BPM không hợp lệ.')
  const take = Number.isFinite(options.take) ? Math.abs(Math.trunc(options.take!)) : 0
  let seed = Math.imul(take + 1, 7919) + key.tonic * 101 + kind.length * 47
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(random() * xs.length)]
  const bars = options.caPhaoFull ? kind === 'interlude' ? 12 : kind === 'intro' ? 8 : 6 : kind === 'interlude' ? 8 : 4
  const lengthBeats = bars * 4
  const ownSong = style.cpSoloSong ?? ''
  const native = cpBalladGestures.filter(g => g.source.mode === key.scale && activeGesture(g))
  const routes = harmonicGestures.filter(g => g.source.mode === key.scale)
  if (!routes.length || !native.length) return empty('Chưa đủ câu ballad có giọng/hòa âm kiểm chứng.')
  const harmony: Array<Harmony & { source: string }> = []
  const routeIds: string[] = []
  const canJoin = (a: Harmony, b: Harmony) => functionOf(a) === functionOf(b) ||
    edges.some(e => e.mode === key.scale && e.from === functionOf(a) && e.to === functionOf(b))
  const viability = new Map<string, boolean>()
  const canContinue = (previous: Harmony, blocks: number): boolean => {
    if (blocks === 0) return true
    const id = `${functionOf(previous)}:${blocks}`
    if (!viability.has(id)) viability.set(id, routes.some(g => canJoin(previous, g.harmony[0]) && canContinue(g.harmony.at(-1)!, blocks - 1)))
    return viability.get(id)!
  }
  for (let at = 0; at < lengthBeats - 8; at += 8) {
    const previous = harmony.at(-1)
    const joined = routes.filter(g => (!previous || canJoin(previous, g.harmony[0])) &&
      canContinue(g.harmony.at(-1)!, (lengthBeats - at - 16) / 8))
    if (!joined.length) return empty('Không nối được vòng hòa âm ballad đã học; bỏ câu thay vì ghép tùy ý.')
    // Establish major before visiting vi/iii; major-mode data alone can still
    // open with an unbroken relative-minor episode (#1299).
    const anchored = at === 0 && key.scale === 'major' && kind !== 'outro'
      ? joined.filter(g => g.harmony.some(h => h.root === 0 && chordOf(h).quality.intervals.includes(4))) : []
    const pool = anchored.length ? anchored : joined
    const preferred = pool.filter(g => g.source.song === ownSong && !routeIds.includes(g.id))
    const g = pick(preferred.length && random() < .4 ? preferred : pool)
    routeIds.push(g.id)
    harmony.push(...g.harmony.map(h => ({ ...h, at: at + h.at, source: g.id })))
  }
  const tonicSymbol = pitchClassName(key.tonic) + (key.scale === 'minor' ? 'm9' : 'maj9')
  const tonic = parseChordInput(tonicSymbol).chords[0]
  const target = kind === 'outro' ? tonic : options.opening ?? tonic
  const targetMinor = target.quality.intervals.includes(3)
  const cadenceAt = lengthBeats - 8
  // Functional adaptations of CEC ii-V-I and ACDD V-i, not borrowed absolute
  // major pitches. The actual next sung chord owns an intro/interlude's cadence.
  if (kind === 'outro') harmony.push(
    { at: cadenceAt, root: 7, suffix: take % 2 ? '7sus4' : '7', bass: null, source: 'cadence:ACDD-V-i/CEC-V-I' },
    ...(take % 2 ? [{ at: cadenceAt + 2, root: 7, suffix: '7', bass: null, source: 'cadence:sus-resolution' }] : []),
    { at: cadenceAt + 4, root: 0, suffix: key.scale === 'minor' ? 'm9' : 'maj9', bass: null, source: 'cadence:tonic' },
  )
  else harmony.push(
    { at: cadenceAt, root: pc(target.root + 2 - key.tonic), suffix: targetMinor ? 'm7b5' : 'm7', bass: null, source: 'cadence:CEC-ii-V:mode-adapted' },
    { at: cadenceAt + 4, root: pc(target.root + 7 - key.tonic), suffix: take % 2 ? '9sus4' : '7', bass: null, source: 'cadence:CEC-sus-V' },
    ...(take % 2 ? [{ at: cadenceAt + 6, root: pc(target.root + 7 - key.tonic), suffix: '7', bass: null, source: 'cadence:sus-resolution' }] : []),
  )
  const chords = harmony.map(h => ({ ...chordOf(h, key.tonic), voicingStyle: 'ca-phao' as const }))
  const beatsEach = harmony.map((h, i) => (harmony[i + 1]?.at ?? lengthBeats) - h.at)
  const chordIndex = (at: number) => Math.max(0, harmony.findLastIndex(h => h.at <= at + .00001))
  const backing = renderPattern(voiceLeadTwoHands(chords, { dropRootFromRightHand: options.dropRoot }), style, { beatsEach })
  const slots: Slot[] = [], traces: NonNullable<PhraseSection['compositionSources']> = []
  const techniques: NonNullable<PhraseSection['compositionTechniques']> = []
  const leftGestures: Array<{ at: number; gate: number; voices: number; octave: boolean; source: string; answer: boolean }> = []
  const soloPunches: number[] = []
  const used = new Set<string>()
  const usedTechniques = new Set<string>()
  let statement: Gesture | undefined
  let previousRhythm: Gesture | undefined
  let previousMelody: Gesture | undefined
  for (let start = 0; start < lengthBeats; start += 8) {
    const ranked = native.flatMap(g => {
      const fit = fitGesture(g, backing, start, bpm)
      if (!fit) return []
      const density = g.right.length / 8
      const route = harmony[chordIndex(start)].source
      const newTechniques = gestureTechniques(g).filter(tag => !usedTechniques.has(tag)).length
      const mismatch = g.right.reduce((sum, e) => {
        const source = g.harmony.findLast(h => h.at <= e.at)
        const target = harmony[chordIndex(start + fit.warp(e.at))]
        return sum + (source && functionOf(source) === functionOf(target) ? 0 : 1)
      }, 0) / g.right.length
      const previousDensity = previousRhythm?.right.filter(e => e.at >= 4).length ?? 0
      const firstDensity = g.right.filter(e => e.at < 4).length
      const slowdown = previousDensity ? Math.max(0, previousDensity / firstDensity - 1.5) : 0
      const continuation = previousMelody?.source.id === g.source.id && near(previousMelody.from + 8, g.from)
      return [{ g, fit, score: fit.cost + (used.has(g.id) ? .5 : 0) + (g.source.kind === kind ? 0 : .15) +
        mismatch * .65 + (g.id === route ? -.45 : 0) + (g.source.song === ownSong ? -.25 : 0) +
        slowdown * 1.2 - (continuation ? .4 : 0) +
        (density > 3 && !options.caPhaoFull ? .6 : 0) - newTechniques * .22 + random() * .75 }]
    }).sort((a, b) => a.score - b.score)
    if (!ranked.length) return empty('Không có câu nguồn chuyển được sang tiết tấu/BPM hiện tại mà vẫn giữ ý câu.')
    let { g, fit } = ranked[0]
    // Recall the statement once with new harmony/register, not independent random bars.
    if (start === lengthBeats - 16 && start > 8 && statement) {
      const recall = ranked.find(candidate => candidate.g === statement)
      if (recall && recall.score <= ranked[0].score + .2) { g = statement; fit = recall.fit }
    }
    statement ??= g
    used.add(g.id)
    let rhythm = g
    // The song's two-hand technique can cross mode, its melody/harmony cannot.
    // Try one local cell per phrase; the rest retains the minor donors' phrasing.
    if (ownSong && !native.some(t => t.source.song === ownSong) && start === 8) {
      const ownTiming = cpBalladGestures.filter(t => t.source.song === ownSong && activeGesture(t)).flatMap(t => {
        const adapted = fitGesture(t, backing, start, bpm)
        return adapted && (!previousRhythm || previousRhythm.right.filter(e => e.at >= 4).length <=
          2 * t.right.filter(e => e.at < 4).length) ? [{ t, adapted }] : []
      }).sort((a, b) => (a.adapted.cost - .22 * gestureTechniques(a.t).filter(t => !usedTechniques.has(t)).length) -
        (b.adapted.cost - .22 * gestureTechniques(b.t).filter(t => !usedTechniques.has(t)).length))
      if (ownTiming.length) { const t = pick(ownTiming.slice(0, 4)); rhythm = t.t; fit = t.adapted }
    }
    // Unknown-mode scores can teach coordinated timing only. Their pitches and
    // harmony never enter the line; resample the known-mode contour by phase.
    if (rhythm === g && random() < .25 && gestureTechniques(g).every(t => usedTechniques.has(t))) {
      const timing = cpBalladGestures.filter(t => t.source.mode === 'unknown' && activeGesture(t)).flatMap(t => {
        const adapted = fitGesture(t, backing, start, bpm)
        return adapted && Math.abs(t.right.length - g.right.length) <= 3 &&
          (!previousRhythm || previousRhythm.right.filter(e => e.at >= 4).length <=
            2 * t.right.filter(e => e.at < 4).length) ? [{ t, adapted }] : []
      })
      if (timing.length) { const t = pick(timing); rhythm = t.t; fit = t.adapted }
    }
    gestureTechniques(rhythm).forEach(t => usedTechniques.add(t))
    previousRhythm = rhythm
    previousMelody = g
    soloPunches.push(...fit.punches.map(at => start + at))
    const sourceTops = g.right.map(e => Math.max(...e.tones))
    const midpoint = (Math.min(...sourceTops) + Math.max(...sourceTops)) / 2
    const contourScale = Math.min(1, 24 / Math.max(1, Math.max(...sourceTops) - Math.min(...sourceTops)))
    // Different onset counts must not stamp the same sampled pitch repeatedly.
    // Interpolate the ordered contour only for a borrowed rhythm, not native ties.
    const positions = fit.right.map((_, i) => rhythm === g ? i : i * (g.right.length - 1) / (fit.right.length - 1))
    const tops = positions.map(p => sourceTops[Math.floor(p)] +
      (sourceTops[Math.ceil(p)] - sourceTops[Math.floor(p)]) * (p % 1))
    fit.right.forEach((e, i) => {
      const sourceIndex = Math.round(positions[i])
      const src = g.right[sourceIndex], before = g.right[Math.max(0, sourceIndex - 1)]
      const after = g.right[sourceIndex + 1]
      const rhythmNext = rhythm.right[i + 1]
      const h = g.source.harmony.findLast(h => h.at <= g.from + src.at)!
      slots.push({ at: start + e.at, gate: e.gates.at(-1)!, gates: e.gates, voices: Math.min(4, e.tones.length),
        octave: e.tones.some(n => e.tones.includes(n + 12)),
        motion: Math.max(-12, Math.min(12, (tops[i] - tops[Math.max(0, i - 1)]) * contourScale)),
        height: (tops[i] - midpoint) * contourScale,
        intervals: e.tones.map(n => n - Math.max(...e.tones)),
        source: rhythm.id,
        cluster: !!rhythmNext && rhythmNext.at - rhythm.right[i].at <= .751 &&
          Math.abs(Math.max(...rhythmNext.tones) - Math.max(...e.tones)) <= 4 &&
          e.tones.includes(Math.max(...e.tones) - 1),
        stepwise: !!after && after.at - src.at <= .501 && src.at - before.at <= .501 &&
          [Math.max(...src.tones) - Math.max(...before.tones), Math.max(...after.tones) - Math.max(...src.tones)]
            .every(d => Math.abs(d) > 0 && Math.abs(d) <= 2),
        sourceTone: pc(Math.max(...src.tones) - h.root), sourceChord: h,
        approach: rhythm === g ? cpBalladApproaches.find(a => a.source === g.source.id && near(a.at, g.from + src.at)) : undefined,
        dyad: e.tones.length === 2 ? [3, 4].includes(e.tones[1] - e.tones[0]) ? 'third' :
          [8, 9].includes(e.tones[1] - e.tones[0]) ? 'sixth' : undefined : undefined,
        staccato: e.articulations.some(a => a === 'staccato'), roll: e.arpeggiate,
        grace: rhythm.graces.some(n => n.hand === 'right' && near(n.at, rhythm.right[i].at)) })
    })
    leftGestures.push(...rhythm.left.map(e => ({ at: start + fit.warp(e.at), voices: Math.min(3, e.tones.length),
      gate: fit.warp(Math.min(8, e.at + Math.max(...e.gates))) - fit.warp(e.at),
      octave: e.tones.some(n => e.tones.includes(n + 12)), source: rhythm.id,
      answer: e.tones.length >= 2 && rhythm.right.some(r => r.at < e.at && r.at + Math.max(...r.gates) > e.at + .125) })))
    for (let half = 0; half < 2; half++) traces.push({ bar: start / 4 + half + 1, start: start + half * 4, end: start + half * 4 + 4,
      harmony: harmony[chordIndex(start + half * 4)].source, melody: g.id,
      rhythm: `${rhythm.id} -> ${style.id}@${start % (style.cell?.lengthBeats ?? 4)}`,
      donorGenre: 'ballad', mode: key.scale, sourceKind: g.source.kind })
  }
  // Finish a composed sentence, not the arbitrary tail of the last donor.
  const lastAt = lengthBeats - (kind === 'outro' ? 4 : .5)
  const finalSlot = { ...slots.at(-1)!, at: lastAt, gate: lengthBeats - lastAt, voices: kind === 'outro' ? 3 : 1,
    gates: Array(3).fill(lengthBeats - lastAt) as number[],
    motion: -2, octave: false, cluster: false, approach: undefined, dyad: undefined,
    staccato: false, roll: false, grace: false }
  const lineSlots = [...slots.filter(s => s.at < lastAt), finalSlot]
  const pitches = Array.from({ length: range.high - range.low + 1 }, (_, i) => i + range.low)
  const scale = new Set(degreesOf(key.scale).map(d => pc(key.tonic + d.semitones)))
  const stable = chords.map(c => new Set(c.quality.intervals.map(n => pc(c.root + n))))
  // Source-attested scalar runs may cross two passing tones before landing.
  // Forcing EVERY passing tone to land immediately turns scales into arpeggios.
  let paths = [{ notes: [] as number[], cost: 0, unresolved: 0 }]
  const centers = lineSlots.map(s => Math.max(range.low + 5, Math.min(range.high - 2,
    range.low + (range.high - range.low) * (.45 + .1 * Math.sin(s.at / lengthBeats * Math.PI)) + s.height)))
  for (let i = 0; i < lineSlots.length; i++) {
    const s = lineSlots[i], ci = chordIndex(s.at), c = chords[ci], final = i === lineSlots.length - 1
    const shortWeak = (s.at % 1 !== 0 || s.stepwise) &&
      Math.min(s.gate, (lineSlots[i + 1]?.at ?? lengthBeats) - s.at) <= .5 && (s.voices === 1 || s.octave)
    const candidates = pitches.filter(n => final ? (kind === 'outro' ? pc(n) === key.tonic :
      stable[ci].has(pc(n)) && [pc(target.root - 1), pc(target.root + 2)].includes(pc(n))) :
      stable[ci].has(pc(n)) || shortWeak && scale.has(pc(n)) &&
      !(c.quality.intervals.includes(3) && pc(n - c.root) === 4) && !(c.quality.intervals.includes(4) && pc(n - c.root) === 3))
    const allowed = candidates.length ? candidates : pitches.filter(n => stable[ci].has(pc(n)))
    const nextPaths = paths.flatMap(path => allowed.flatMap(n => {
      const before = path.notes.at(-1), prevSlot = lineSlots[i - 1]
      const passing = before !== undefined && !stable[chordIndex(prevSlot.at)].has(pc(before))
      if (before !== undefined && (Math.abs(n - before) > 12 || passing &&
        (Math.abs(n - before) > 2 || n === before || !stable[ci].has(pc(n)) &&
          (!s.stepwise || path.unresolved >= 2 || Math.sign(n - before) !== Math.sign(before - path.notes.at(-2)!))))) return []
      const delta = before === undefined ? 0 : n - before
      const repeat = path.notes.length >= 2 && n === path.notes.at(-1) && n === path.notes.at(-2)
      const loop = path.notes.length >= 3 && n === path.notes.at(-2) && path.notes.at(-1) === path.notes.at(-3)
      const role = chordType(c) === chordType(chordOf(s.sourceChord)) && pc(n - c.root) === s.sourceTone
      const leap = Math.max(0, Math.abs(delta) - 5)
      const nextAt = lineSlots[i + 1]?.at ?? lengthBeats
      const cut = harmony.findIndex((h, k) => k > ci && h.at < Math.min(s.at + s.gate, nextAt) && !stable[k].has(pc(n)))
      const silence = cut < 0 ? 0 : Math.max(0, nextAt - harmony[cut].at - .5)
      const collapsed = before !== undefined && delta === 0 && Math.abs(s.motion) >= 1
      const reversed = delta * s.motion < 0 && Math.abs(s.motion) >= 1
      const join = before !== undefined && Math.floor(prevSlot.at / 8) !== Math.floor(s.at / 8)
      const joinLeap = join ? Math.max(0, Math.abs(delta) - 4) * 3 : 0
      const cost = path.cost + Math.abs(delta - s.motion) * .55 + Math.abs(n - centers[i]) * .25 + leap * .3 +
        silence * 12 + joinLeap + (collapsed ? 2.5 : 0) + (reversed ? 1.5 : 0) +
        (repeat ? 5 : 0) + (loop ? 3 : 0) + (role ? -1.6 : 0) + (stable[ci].has(pc(n)) ? 0 : .6)
      return [{ notes: [...path.notes, n], cost, unresolved: stable[ci].has(pc(n)) ? 0 : path.unresolved + 1 }]
    })).sort((a, b) => a.cost - b.cost)
    if (!nextPaths.length) return empty('Không tìm được giai điệu nối đúng hòa âm trong tầm đàn; bỏ câu lỗi.')
    const endings = new Set<string>()
    paths = nextPaths.filter(p => {
      const id = `${p.notes.slice(-2)}:${p.unresolved}`
      if (endings.has(id)) return false
      endings.add(id)
      return true
    }).slice(0, 10)
    // Don't prune every stable branch just before the next harmonic change.
    const resolved = nextPaths.find(p => p.unresolved === 0)
    if (resolved && !paths.some(p => p.unresolved === 0)) paths[paths.length - 1] = resolved
  }
  const melody = paths[0].notes
  // Keep the donor's exact preparation/approach/resolution context in either
  // direction. No global sprinkling of chromatic notes onto unrelated slots.
  for (let i = 1; i < melody.length - 1; i++) {
    const s = lineSlots[i], a = s.approach, ci = chordIndex(s.at), c = chords[ci]
    if (!a) continue
    const n = melody[i + 1] - a.direction
    if (s.voices !== 1 || s.at % 1 === 0 || s.gate > .334 || lineSlots[i + 1].at - s.at > .334 ||
      chordIndex(lineSlots[i + 1].at) !== ci || !stable[ci].has(pc(melody[i + 1])) || n < range.low || n > range.high ||
      Math.abs(n - melody[i - 1]) > 4 || !stable[chordIndex(lineSlots[i - 1].at)].has(pc(melody[i - 1]))) continue
    if (a.mode === key.scale && a.type === chordType(c) && a.root === pc(c.root - key.tonic) &&
      a.from === pc(melody[i - 1] - c.root) && a.tone === pc(n - c.root) && a.to === pc(melody[i + 1] - c.root)) {
      melody[i] = n
      techniques.push({ source: s.source, startBeat: s.at, kind: 'semitone-approach' })
    }
  }
  const right: TimelineEvent[] = []
  lineSlots.forEach((s, i) => {
    const top = melody[i], ci = chordIndex(s.at), notes = [top]
    if (s.octave && top - 12 >= range.low) {
      notes.unshift(top - 12)
    }
    while (notes.length < s.voices) {
      const interval = s.intervals[Math.max(0, s.intervals.length - notes.length - 1)] ?? -4 * notes.length
      const choices = pitches.filter(n => n < top && n >= top - 12 &&
        (!s.dyad || (s.dyad === 'third' ? [3, 4] : [8, 9]).includes(top - n)) &&
        notes.every(held => Math.abs(held - n) >= 2) && stable[ci].has(pc(n)))
        .sort((a, b) => Math.abs(b - top - interval) - Math.abs(a - top - interval))
      if (!choices.length) break
      notes.push(choices.at(-1)!)
      notes.sort((a, b) => a - b)
    }
    const next = lineSlots[i + 1]?.at ?? lengthBeats
    const nextTop = melody[i + 1]
    // Written simultaneous semitone clusters are NOT grace notes in the score.
    // Recompose a brief lower neighbour only beside a stable landing voice,
    // followed by a nearby chord tone. Never sustain an invented altered chord.
    const neighbor = top - 1
    const cluster = s.cluster && nextTop !== undefined && next - s.at <= .751 &&
      stable[ci].has(pc(top)) && stable[chordIndex(next)].has(pc(nextTop)) &&
      Math.abs(nextTop - top) <= 3 && neighbor >= range.low &&
      !notes.includes(neighbor) && !stable[ci].has(pc(neighbor))
    if (cluster) {
      // The cluster replaces an inner voice rather than making every punch denser.
      if (notes.length >= s.voices && notes.length > 1) {
        const inner = notes.findIndex(n => n !== top && (!s.octave || n !== top - 12))
        if (inner >= 0) notes.splice(inner, 1)
      }
      notes.push(neighbor)
      notes.sort((a, b) => a - b)
      techniques.push({ source: s.source, startBeat: s.at, kind: 'neighbor-cluster' })
    }
    if (s.octave && notes.includes(top - 12)) techniques.push({ source: s.source, startBeat: s.at, kind: 'octave-line' })
    if (s.dyad && notes.length === 2 && (s.dyad === 'third' ? [3, 4] : [8, 9]).includes(top - notes[0]))
      techniques.push({ source: s.source, startBeat: s.at, kind: s.dyad === 'third' ? 'third-dyad' : 'sixth-dyad' })
    // Keep unequal inner/top holds. A changing chord clips only incompatible
    // voices, not the whole sonority; repeated punches are revoiced chord tones.
    const voiced = notes.map((n, j) => {
      const sourceIndex = Math.max(0, s.gates.length - notes.length + j)
      let gate = Math.min(s.gates[sourceIndex] ?? s.gate, lengthBeats - s.at)
      if (!s.staccato && next - s.at <= 1 && gate >= (next - s.at) * .7) gate = Math.max(gate, next - s.at)
      // A tiny written release after a held top voice must not become a hole
      // masked by inner-voice sustain (#1320/#1321). Keep actual rests/staccato.
      if (n === top && !s.staccato && gate >= .5 && next - s.at <= 2 && next - s.at - gate <= .251)
        gate = Math.max(gate, next - s.at)
      if (s.staccato) gate *= .55
      if (cluster && n === neighbor) gate = Math.min(gate, .125, next - s.at)
      if (n === top && nextTop !== undefined && [1, 11].includes(pc(nextTop - top)) && gate > next - s.at + .125)
        gate = next - s.at
      for (let k = ci + 1; k < harmony.length && harmony[k].at < s.at + gate; k++)
        if (!stable[k].has(pc(n))) { gate = harmony[k].at - s.at; break }
      const phraseLift = Math.round(4 * Math.sin(s.at / lengthBeats * Math.PI))
      const lead = 76 + phraseLift + (s.at % 1 === 0 ? 3 : 0) + (notes.length >= 3 ? 3 : 0)
      const velocity = cluster && n === neighbor ? lead - 21 : n === top ? lead : lead - 12
      return { n, gate, velocity }
    })
    const roll = s.roll && notes.length > 1 ? Math.min(.06, Math.min(...voiced.map(v => v.gate)) / (notes.length * 3)) : 0
    const groups = new Map<string, TimelineEvent>()
    voiced.forEach(({ n, gate, velocity }, j) => {
      const startBeat = s.at + j * roll, durationBeats = gate - j * roll
      const id = `${startBeat}:${durationBeats}:${velocity}`
      const event = groups.get(id)
      if (event) event.notes.push(n)
      else groups.set(id, { hand: 'right', notes: [n], startBeat, durationBeats, velocity })
    })
    right.push(...groups.values())
    if (s.grace && i > 0 && top > range.low && Math.abs(melody[i - 1] - top) <= 4 && s.at - lineSlots[i - 1].at >= .25 &&
      cpBalladApproaches.some(a => a.mode === key.scale && a.root === pc(chords[ci].root - key.tonic) &&
        a.type === chordType(chords[ci]) && a.from === pc(melody[i - 1] - chords[ci].root) &&
        a.tone === pc(top - 1 - chords[ci].root) && a.to === pc(top - chords[ci].root)))
      right.push({ hand: 'right', notes: [top - 1], startBeat: s.at - .1, durationBeats: .1, velocity: 54, grace: true })
  })
  // Keep every destination bass attack and add only source-attested joint
  // solo punches. Never add these to the sung accompaniment renderer.
  const bassEvents = backing.filter(e => e.hand === 'left')
  for (const at of [...new Set(soloPunches)]) {
    if (!right.some(e => near(e.startBeat, at)) || bassEvents.some(e => near(e.startBeat, at))) continue
    const c = chords[chordIndex(at)]
    bassEvents.push({ hand: 'left', startBeat: at, durationBeats: .5,
      notes: [36 + (c.bass ?? c.root)], velocity: 74 })
  }
  for (const g of leftGestures.filter(g => g.answer)) {
    if (bassEvents.some(e => near(e.startBeat, g.at)) ||
      !right.some(e => e.startBeat < g.at && e.startBeat + e.durationBeats > g.at + .125)) continue
    const c = chords[chordIndex(g.at)]
    bassEvents.push({ hand: 'left', startBeat: g.at, durationBeats: g.gate,
      notes: [48 + (c.bass ?? c.root)], velocity: 62 })
    techniques.push({ source: g.source, startBeat: g.at, kind: 'left-answer' })
  }
  const left = bassEvents.sort((a, b) => a.startBeat - b.startBeat).map(e => {
    const ci = chordIndex(e.startBeat), chord = chords[ci]
    const gesture = leftGestures.find(g => near(g.at, e.startBeat))
    const gate = Math.min(Math.max(e.durationBeats, gesture?.gate ?? 0),
      (harmony[ci + 1]?.at ?? lengthBeats) - e.startBeat)
    const overlap = right.filter(r => r.startBeat < e.startBeat + gate && r.startBeat + r.durationBeats > e.startBeat)
    const ceiling = Math.min(keyboard.high, overlap.length ? Math.min(...overlap.map(r => Math.min(...r.notes) - 2)) : range.low - 2)
    const pool = Array.from({ length: Math.max(0, ceiling - keyboard.low + 1) }, (_, i) => keyboard.low + i)
    const notes = [...new Set(e.notes.map(n => {
      const same = pool.filter(p => pc(p) === pc(n) && (stable[ci].has(pc(p)) || chord.bass === pc(p)))
      const choices = same.length ? same : pool.filter(p => pc(p) === (chord.bass ?? chord.root))
      return choices.sort((a, b) => Math.abs(a - n) - Math.abs(b - n))[0]
    }))].sort((a, b) => a - b)
    if (gesture?.octave && notes[0] + 12 <= ceiling && !notes.includes(notes[0] + 12)) notes.push(notes[0] + 12)
    while (notes.length < (gesture?.voices ?? 1)) {
      const more = pool.filter(n => n > notes[0] && n <= notes[0] + 12 && stable[ci].has(pc(n)) && notes.every(p => Math.abs(p - n) >= 3))
      if (!more.length) break
      notes.push(more[0])
    }
    return { ...e, notes: notes.sort((a, b) => a - b), durationBeats: gate }
  })
  if (left.some(e => e.notes.some(n => !Number.isFinite(n)))) return empty('Không đủ tầm bass cho câu solo này.')
  return { events: holdCpBalladVoices([...left, ...right]), lengthBeats,
    chords: chords.map(c => c.symbol), beatsEach, compositionSources: traces, compositionTechniques: techniques,
    sourcePhrase: { id: 'cp-original', fromBar: 1, barCount: bars, method: 'cp-composition' },
    adaptationNote: `Nguồn câu: ${[...new Set(traces.map(t => cpBalladGestures.find(g => g.id === t.melody)!.source.song))].join(', ')}.` }
}
