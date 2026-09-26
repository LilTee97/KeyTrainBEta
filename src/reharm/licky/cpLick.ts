import type { ParsedChord } from '../types'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { SongKey } from '../fillSoloGenerator/soloVocabulary'
import { scaleTones } from '../reharmEngine/keyDetection'
import { beatsOf, chordStarts } from '../chordTiming'
import { hoCuaDieu } from '../style/hoDieu'
import type { StylePattern, TimelineEvent } from '../style/types'
import data from './cpPhrases.json'

export type CpPhrase = (typeof data.phrases)[number]
export const cpPhrases: readonly CpPhrase[] = data.phrases
export const cpInventory = data.inventory
export const cpTransitions: readonly CpPhrase[] = data.transitions
const pc = (n: number) => ((n % 12) + 12) % 12
const overlap = (a: TimelineEvent, b: TimelineEvent) =>
  a.startBeat < b.startBeat + b.durationBeats - 1e-6 && b.startBeat < a.startBeat + a.durationBeats - 1e-6

/** Fill must fit the backing, never the other way around (including cross-hand same keys). */
export function cpFits(events: readonly TimelineEvent[], backing: readonly TimelineEvent[]): boolean {
  return !events.some(note => backing.some(comp => overlap(note, comp) &&
    (note.hand === comp.hand || note.notes.some(pitch => comp.notes.includes(pitch)))))
}

/** A source-derived two-hand cell replaces backing ONLY in its half-open window. */
export function cpBacking(backing: readonly TimelineEvent[], windows: readonly { start: number; end: number }[]): TimelineEvent[] {
  return backing.flatMap(event => {
    const window = windows.find(w => event.startBeat < w.end - 1e-6 &&
      event.startBeat + event.durationBeats > w.start + 1e-6)
    if (!window) return [event]
    if (event.startBeat >= window.start - 1e-6) return []
    // Release the old harmony at entry; never invent a new attack at the exit.
    return [{ ...event, durationBeats: window.start - event.startBeat }]
  })
}

export function cpGenre(style: StylePattern): string | null {
  return hoCuaDieu(style.id) ?? (style.id.includes('bossa') ? 'bossa' : null)
}

export function cpAvailability(style: StylePattern, key: SongKey | null): string | null {
  if (!key || !['major', 'minor'].includes(key.scale)) return 'CP Lick cần chọn giọng trưởng hoặc thứ.'
  if (!cpPhrases.some(p => p.genre === cpGenre(style))) return 'CP Lick chưa có sheet Cà Pháo đủ dữ liệu cho điệu này; không mượn câu khác điệu.'
  return null
}

function nearest(wanted: number, allowed: readonly number[]): number {
  return allowed.reduce((best, n) => Math.abs(n - wanted) < Math.abs(best - wanted) ? n : best)
}

/** Keep a source rhythm intact; compose pitches against actual harmony, not its XML label. */
export function placeCpPhrase(phrase: CpPhrase, chord: ParsedChord, next: ParsedChord | undefined,
  key: SongKey, start: number, take: number, keyboard?: { low: number; high: number }): TimelineEvent[] {
  const low = keyboard?.low ?? (phrase.hand === 'left' ? 36 : 60)
  const high = keyboard?.high ?? (phrase.hand === 'left' ? 60 : 84)
  if (!Number.isInteger(low) || !Number.isInteger(high) || low < 0 || high > 127 || low > high) return []
  const classes = new Set<number>(scaleTones(key.tonic, key.scale))
  const chordClasses = new Set(chord.quality.intervals.map(n => pc(chord.root + n)))
  // Explicit altered/secondary-dominant tones are legitimate; don't force E7 to Em in Am.
  for (const n of chordClasses) classes.add(n)
  // Prevent scale's third fighting the explicit chord third (minor vs major/dominant).
  if (chord.quality.intervals.includes(3)) classes.delete(pc(chord.root + 4))
  else if (chord.quality.intervals.includes(4)) classes.delete(pc(chord.root + 3))
  const range = Array.from({ length: high - low + 1 }, (_, i) => i + low)
  const ladder = range.filter(n => classes.has(pc(n)))
  const stable = range.filter(n => chordClasses.has(pc(n)))
  if (!ladder.length || !stable.length) return []
  const original = phrase.notes.flatMap(n => n.tones.map(t => 60 + key.tonic + t))
  // Shift the WHOLE gesture by an octave, never fold individual peaks down.
  const center = keyboard ? low + (high-low) * (phrase.hand === 'left' ? .25 : .68) : (low+high)/2
  const shifts = Array.from({length: 21}, (_, i) => (i-10)*12).filter(o =>
    Math.min(...original)+o >= low && Math.max(...original)+o <= high)
  const shift = keyboard ? shifts.sort((a,b) => Math.abs((Math.min(...original)+Math.max(...original))/2+a-center) -
    Math.abs((Math.min(...original)+Math.max(...original))/2+b-center))[0] :
    12 * Math.round((center - (Math.min(...original) + Math.max(...original)) / 2) / 12)
  if (shift === undefined) return []
  if (Math.min(...original) + shift < low || Math.max(...original) + shift > high) return []
  // Prefer exact transposition when it fits both mode and harmony; otherwise recompose.
  const clone = phrase.mode === key.scale && original.every(n => classes.has(pc(n))) &&
    chordClasses.has(pc(original[0])) && chordClasses.has(pc(original.at(-1)!)) && take % 2 === 0
  const targetClasses = new Set(next?.quality.intervals.map(n => pc(next.root + n)) ?? [])
  const common = stable.filter(n => targetClasses.has(pc(n)))
  const guide = common.length ? common : stable
  const groups = phrase.notes.map((note, index) => {
    const last = index === phrase.notes.length - 1
    const strong = Math.abs(start + note.at - Math.round(start + note.at)) < 1e-5
    const allowed = last ? guide : strong ? stable : ladder
    const pitches = note.tones.map(t => {
      const wanted = 60 + key.tonic + t + shift
      return (clone ? wanted : nearest(wanted, allowed)) as MidiNote
    })
    return pitches
  })
  // Resolve backwards so a following approach cannot later invalidate its predecessor.
  for (let i = groups.length - 2; i >= 0; i--) {
    const note = phrase.notes[i]
    const following = phrase.notes[i + 1]
    const delta = following.tones[0] - note.tones[0]
    if (groups[i].length === 1 && groups[i + 1].length === 1 && Math.abs(delta) === 1 &&
      note.dur <= .25 && following.at - note.at <= .5 &&
      Math.abs(start + note.at - Math.round(start + note.at)) > .01 &&
      classes.has(pc(groups[i + 1][0]))) {
      const approach = groups[i + 1][0] - delta
      if (approach >= low && approach <= high) groups[i] = [approach as MidiNote]
    }
  }
  // Recomposition must not turn a chord into duplicate simultaneous key presses.
  if (groups.some(group => new Set(group).size !== group.length)) return []
  // Individual gates survive even inside a source chord with mixed note lengths.
  return phrase.notes.flatMap((note, index) => groups[index].map((pitch, n): TimelineEvent => ({
    notes: [pitch], startBeat: start + note.at, durationBeats: note.gates[n],
    hand: phrase.hand as 'left' | 'right', velocity: index === phrase.notes.length - 1 ? 58 : 52,
  })))
}

/** KT advanced arrangement: a longer local gesture, not a sped-up full run.
 * Keep consecutive source notes/turns; do not cut a chromatic approach from its target.
 * The existing harmonic mapper composes pitches afterward. Raw corpus stays untouched.
 */
export function advancedCpRuns(source: CpPhrase, take: number, available: number): CpPhrase[] {
  const variants: CpPhrase[] = []
  for (let count = 8; count <= 12; count++) for (let from = 0; from + count <= source.notes.length; from++) {
    const motif = source.notes.slice(from, from + count)
    if (motif.some(n => n.tones.length !== 1)) continue
    const pitches = motif.map(n => n.tones[0])
    if (Math.max(...pitches) - Math.min(...pitches) > 24) continue
    if (pitches.some((n,i) => i > 0 && (n === pitches[i-1] || Math.abs(n-pitches[i-1]) > 12))) continue
    if (from && Math.abs(source.notes[from-1].tones[0]-pitches[0]) === 1) continue
    if (from+count < source.notes.length && Math.abs(source.notes[from+count].tones[0]-pitches.at(-1)!) === 1) continue
    let at = 0
    const notes = motif.map((n,i) => {
      const note = { ...n, at, dur: .25, gates: [.25] }
      // Keep source sixteenths/rests; cap denser 32nds at one attack per quarter beat.
      at += i+1 < count ? Math.max(.25, Math.ceil((motif[i+1].at-n.at)*4)/4) : .25
      return note
    })
    if (at > Math.min(4,available)+1e-6) continue
    // Simplify the sheet's bass support to its first single bass, held under the gesture.
    const bass = source.support[0]
    const support = bass ? [{ ...bass, at: 0, tones: [bass.tones[0]], dur: at, gates: [at] }] : []
    variants.push({ ...source, notes, support, span: at })
  }
  // Seeded shuffle: a take stays identical for preview/build, new takes vary the length/motif.
  let seed = (Math.trunc(take) ^ Math.imul(source.bar, 2654435761)) >>> 0
  for (let i = variants.length-1; i > 0; i--) {
    seed = (Math.imul(seed,1664525)+1013904223) >>> 0
    const j = seed % (i+1)
    ;[variants[i],variants[j]] = [variants[j],variants[i]]
  }
  return variants
}

export interface CpLickOptions {
  chords: readonly ParsedChord[]
  style: StylePattern
  key: SongKey | null
  backing: readonly TimelineEvent[]
  /** Windows owned by the style's bass links/runs, not available for replacement. */
  protectedWindows?: readonly { start: number; end: number }[]
  beatsPerChord: number
  breaths?: ReadonlySet<number>
  vocal?: 'full' | ReadonlySet<number>
  sectionEnds?: ReadonlySet<number>
  extraFills?: ReadonlySet<number>
  extraRuns?: ReadonlySet<number>
  skip?: ReadonlySet<number>
  take?: number
  /** CP section-change composer (advanced reductions of the full source gestures). */
  fullTransitions?: boolean
  transitionDelays?: ReadonlyMap<number, number>
  /**
   * Nghỉ ĐÔN RA ở mốc chuyển đoạn (nốt đen, đã cộng vào hợp âm ở mốc): câu chạy CP kết trước vạch bấy nhiêu, đệm tắt suốt
   * chỗ nghỉ. Người dùng 26/9/2026: nghỉ đôn ra và nút "Mặc định" *"hãy áp dụng cho mọi điệu"*. Cũ: màu Cà Pháo bỏ qua.
   */
  transitionRests?: ReadonlyMap<number, number>
  keyboard?: { low: number; high: number }
}

export function planCpLicks(options: CpLickOptions) {
  const { chords, style, key, backing, beatsPerChord, breaths, vocal, sectionEnds,
    extraFills, extraRuns, skip, take = 0 } = options
  const reason = cpAvailability(style, key)
  const placements: { mainIndex: number; kind: 'fill' | 'run'; source: CpPhrase; events: TimelineEvent[];
    start: number; end: number; advanced?: boolean }[] = []
  const skipped: number[] = []
  const protectedAt = (start: number, end: number) => options.protectedWindows?.some(w =>
    start < w.end - 1e-6 && end > w.start + 1e-6)
  if (reason || !key || vocal === 'full') return { events: [], backing: [...backing], placements, skipped, reason }
  const book = cpPhrases.filter(p => p.genre === cpGenre(style))
  const starts = chordStarts(chords, beatsPerChord)
  let main = -1
  let lastEnd = -Infinity
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i]
    if (chord.passing) continue
    main++
    const forced = extraFills?.has(main) || extraRuns?.has(main)
    const transition = options.fullTransitions && sectionEnds?.has(main) && i + 1 < chords.length
    if (skip?.has(main) || (vocal?.has(main) && !forced && !transition)) continue
    // ponytail: lyric/chord-end proxy only; exact vocal timestamps can replace this gate later.
    // Without lyrics, four main chords are a KT proxy, not an observed vocal rest.
    if (!forced && !sectionEnds?.has(main) && !(breaths ? breaths.has(main) : (main + 1) % 4 === 0)) continue
    const end = starts[i] + beatsOf(chord, beatsPerChord)
    // Câu chạy kết ở `exit`; [exit, end) là chỗ nghỉ đôn ra — nằm trong khung placement nên `cpBacking` tắt đệm ở đó.
    const nghi = sectionEnds?.has(main) ? options.transitionRests?.get(main) ?? 0 : 0
    const exit = end - nghi
    if (transition && !extraFills?.has(main)) {
      const windowStart = starts[i] + (options.transitionDelays?.get(main) ?? 0)
      // Prefer marked transition gestures; reduce BEFORE fitting the available rest.
      const candidates = cpTransitions.filter(p => p.meter === style.beatsPerMeasure)
      const rank = (p: CpPhrase) => (p.genre === cpGenre(style) ? 0 : 4) +
        (p.mode === key.scale ? 0 : 2) + (p.evidence === 'confirmed-transition' ? 0 : 1)
      candidates.sort((a,b) => rank(a)-rank(b))
      let done = false
      for (const priority of [...new Set(candidates.map(rank))]) {
        const pool = candidates.filter(p => rank(p) === priority)
        const offset = Math.abs(Math.trunc(take)+main) % pool.length
        for (const source of [...pool.slice(offset), ...pool.slice(0,offset)]) {
          for (const phrase of advancedCpRuns(source, take + main, exit-windowStart)) {
          const start = exit-phrase.span // variable run length, fixed entry into the next section
          if (protectedAt(start, end)) continue
          if (Math.abs(start*4-Math.round(start*4)) > .001) continue
          const keyboard = options.keyboard ?? { low: 36, high: 96 }
          const composeTake = Math.trunc(take)*2+1 // recompose; do not select the exact-note clone path
          const lead = placeCpPhrase(phrase,chord,chords[i+1],key,start,composeTake,keyboard)
          if (lead.length !== phrase.notes.length) continue
          const pitches = lead.map(e => e.notes[0])
          if (Math.max(...pitches)-Math.min(...pitches) > 24 || pitches.some((n,i) => i > 0 &&
            (Math.abs(n-pitches[i-1]) > 12 || Math.sign(n-pitches[i-1]) !==
              Math.sign(phrase.notes[i].tones[0]-phrase.notes[i-1].tones[0])))) continue
          let support = phrase.support.length ? placeCpPhrase({ ...phrase, notes: phrase.support, hand: 'left' },
            chord,chords[i+1],key,start,composeTake,keyboard) : []
          const clashes = () => lead.some(a => support.some(b => overlap(a,b) && a.notes.some(n => b.notes.includes(n))))
          if (clashes()) support = placeCpPhrase({ ...phrase, notes: phrase.support, hand: 'left' },
            chord,chords[i+1],key,start,composeTake,{low:keyboard.low,high:Math.min(...lead.flatMap(e=>e.notes))-1})
          if (!lead.length || (phrase.support.length && !support.length) ||
            clashes()) continue
          if (backing.some(e => e.startBeat < end && e.startBeat + e.durationBeats > end+1e-6 &&
            e.startBeat + e.durationBeats > start)) continue
          placements.push({ mainIndex:main,kind:'run',source:phrase,events:[...lead,...support],start,end,advanced:true })
          lastEnd=end
          done=true
          break
          }
          if (done) break
        }
        if (done) break
      }
      if (done) continue
      // Never squeeze a full dense sheet run into a window that cannot fit this arrangement.
      skipped.push(main)
      continue
    }
    if (!forced && end - lastEnd < style.beatsPerMeasure * 2) continue
    const wantRun = extraRuns?.has(main) || (!extraFills?.has(main) && sectionEnds?.has(main))
    const kinds = wantRun ? (forced ? ['run'] : ['run', 'fill']) : ['fill']
    let found = false
    for (const kind of kinds) {
      const byKind = book.filter(p => p.kind === kind && p.supportComplete && p.meter === style.beatsPerMeasure)
      const sameMode = byKind.filter(p => p.mode === key.scale)
      const pool = sameMode.length ? sameMode : byKind
      // Deterministic rotation across plays; no mutations of the corpus or backing.
      const offset = Math.abs(Math.trunc(take) * 37 + main * 7) % Math.max(1, pool.length)
      const ordered = [...pool.slice(offset), ...pool.slice(0, offset)]
      for (const phrase of ordered) {
        if (!phrase.supportComplete || phrase.meter !== style.beatsPerMeasure) continue
        if (phrase.span > Math.min(2, exit - starts[i]) + 1e-6) continue
        // Preserve source subdivisions and rests. Move as a whole, never compress a long run.
        for (let start = Math.floor((exit - phrase.span + 1e-6) * 4) / 4;
          start >= Math.max(starts[i] + (transition ? options.transitionDelays?.get(main) ?? 0 : 0), exit - 2) - 1e-6; start -= .25) {
          // Preserve the source's position inside the bar, not just its fast/slow durations.
          if (Math.abs(start % phrase.meter - phrase.offset % phrase.meter) > .001) continue
          if (protectedAt(start, start + phrase.span)) continue
          const lead = placeCpPhrase(phrase, chord, chords[i + 1], key, start, take)
          if (!lead.length) continue
          const support = phrase.support.length ? placeCpPhrase({ ...phrase, notes: phrase.support,
            hand: phrase.hand === 'right' ? 'left' : 'right' }, chord, chords[i + 1], key, start, take) : []
          if (phrase.support.length && !support.length) continue
          const events = [...lead, ...support]
          // Different hands cannot strike/hold the same physical key over one another.
          if (lead.some(a => support.some(b => overlap(a, b) && a.notes.some(n => b.notes.includes(n))))) continue
          const window = { start, end: nghi > 0 ? end : start + phrase.span }
          // A held note crossing the exit needs a longer source cell; do not silence it outside the cell.
          if (backing.some(e => overlap(e, { ...lead[0], startBeat: start, durationBeats: phrase.span }) &&
            e.startBeat + e.durationBeats > window.end + 1e-6)) continue
          placements.push({ mainIndex: main, kind: kind as 'fill' | 'run', source: phrase, events, ...window })
          lastEnd = end
          found = true
          break
        }
        if (found) break
      }
      if (found) break
    }
    if (!found && forced) skipped.push(main)
  }
  return { events: placements.flatMap(p => p.events), backing: cpBacking(backing, placements), placements, skipped, reason }
}
