import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { chordStarts } from '../chordTiming'
import { stepInScale } from '../fillSoloGenerator/graceNoteOrnamenter'
import type { TransitionRun } from '../fillSoloGenerator/soloGenerator'
import type { SongKey } from '../fillSoloGenerator/soloVocabulary'
import { scaleTones } from '../reharmEngine/keyDetection'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'

type ConnectionOptions = {
  beatsPerChord: number
  transitions: ReadonlyMap<number, TransitionRun>
  key?: SongKey | null
  muteWindows?: readonly { from: number; to: number }[]
}
type ConnectionPlan = { backing: TimelineEvent[]; protectedWindows: { start: number; end: number }[] }

/** Accompaniment policy, independent of chord color, CP Lick and solo length. */
export function planCpBalladBacking(backing: readonly TimelineEvent[], chords: readonly ParsedChord[],
  options: ConnectionOptions & { style: StylePattern; walkingOn?: boolean }): ConnectionPlan {
  if (!options.style.cpBalladChordLeads || options.walkingOn)
    return { backing: [...backing], protectedWindows: [] }
  return planBalladChordLeads(backing, chords, options)
}

const pc = (pitch: number) => ((pitch % 12) + 12) % 12

/** ACDD 16 LH: Db3-F3-Ab3-B3 | Bb3-G3-E3-C3, not the RH vocal octaves. Câu chạy của Ballad cứ đi (cpLick, cuDiFill). */
export function acddRunPitches(chord: ParsedChord, next: ParsedChord): number[] {
  const intervals = new Set(chord.quality.intervals.map(pc))
  const nextIntervals = new Set(next.quality.intervals.map(pc))
  const minorCadence = pc(next.root - chord.root) === 5 && nextIntervals.has(3)
  const sourceCadence = minorCadence && intervals.has(4) && intervals.has(10)
    && !intervals.has(1) && !intervals.has(8)
  // Sus input is an arrangement adaptation: do not inject the source's major third/b9.
  const third = intervals.has(3) ? 3 : intervals.has(4) ? 4 : intervals.has(5) ? 5 : 2
  const fifth = intervals.has(7) ? 7 : intervals.has(6) ? 6 : intervals.has(8) ? 8 : third
  const seventh = intervals.has(10) ? 10 : intervals.has(11) ? 11 : 12
  const color = intervals.has(2) ? 2 : third
  const shape = sourceCadence ? [1, 5, 8, 11, 10, 7, 4, 0]
    : [color, third, fifth, seventh, fifth, third, color, 0]
  let root = 48 + chord.root
  while (root + Math.max(...shape) > 67) root -= 12
  return shape.map(interval => root + interval)
}

/** Replace LH inside a window, clip held LH, and leave other accompaniment intact. */
function replaceLeft(backing: readonly TimelineEvent[], from: number, to: number, notes: TimelineEvent[]): TimelineEvent[] {
  return [...backing.flatMap(event => {
    if (event.hand !== 'left' || event.startBeat >= to || event.startBeat + event.durationBeats <= from) return [event]
    return event.startBeat < from ? [{ ...event, durationBeats: from - event.startBeat }] : []
  }), ...notes].sort((a, b) => a.startBeat - b.startBeat)
}

/** One-beat bass links for Co Em Cho; section runs keep priority. */
export function balladChordLeads(
  backing: readonly TimelineEvent[],
  chords: readonly ParsedChord[],
  options: ConnectionOptions,
): TimelineEvent[] {
  return planBalladChordLeads(backing, chords, options).backing
}

function planBalladChordLeads(backing: readonly TimelineEvent[], chords: readonly ParsedChord[],
  options: ConnectionOptions): ConnectionPlan {
  const { beatsPerChord, transitions, key, muteWindows = [] } = options
  const starts = chordStarts(chords, beatsPerChord)
  let result = [...backing]
  const protectedWindows: ConnectionPlan['protectedWindows'] = []
  let mainIndex = -1
  for (let index = 0; index < chords.length - 1; index++) {
    const chord = chords[index], next = chords[index + 1]
    if (!chord.passing) mainIndex++
    if (next.passing || transitions.has(mainIndex)) continue
    const start = starts[index], end = starts[index + 1]
    if (chord.passing || end - start < 4 || (chord.bass ?? chord.root) === (next.bass ?? next.root)) continue
    const from = end - 1
    if (muteWindows.some(w => w.from < end && w.to > from)) continue
    protectedWindows.push({ start: from, end })
    // Already running at the end? Keep it, instead of stacking another phrase on top.
    if (backing.filter(e => e.hand === 'left' && e.startBeat >= from && e.startBeat < end).length > 1) continue
    const tones = key ? scaleTones(key.tonic, key.scale) : new Set(chordPitchClasses(chord.root, chord.quality))
    const target = 48 + (next.bass ?? next.root)
    const approach = stepInScale(target, 'down', tones)
    const current = new Set(chordPitchClasses(chord.root, chord.quality))
    const below = Array.from({ length: 24 }, (_, i) => approach - 24 + i)
      .filter(note => note >= 36 && current.has(pc(note))).slice(-2)
    if (below.length !== 2) continue
    // De Em Roi Xa 19: last-beat .5/.25/.25; pitches adapt to the destination bass.
    const notes = [...below, approach].map((pitch, i): TimelineEvent => ({
      hand: 'left', notes: [pitch], startBeat: from + [0, .5, .75][i],
      durationBeats: [.5, .25, .25][i], velocity: [48, 50, 54][i],
    }))
    result = replaceLeft(result, from, end, notes)
  }
  return { backing: result, protectedWindows }
}
