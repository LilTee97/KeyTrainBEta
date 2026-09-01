import type { PitchClass } from '../../shared/musicTheory/types'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

/** Bb–A–D Chiếc Lá ô 1: 0, −1, −8. */
const SHAPE = [0, -1, -8] as const
const AT = [0, 0.5, 1, 1.5, 2.5, 3, 3.5] as const

export function chiecLaMotif(options: {
  chords: readonly ParsedChord[]
  beatsPerChord: number
  tonic: PitchClass
  scale: ScaleType
}): TimelineEvent[] {
  const { chords, beatsPerChord, tonic, scale } = options
  const root = scale === 'minor' ? (tonic + 3) % 12 : tonic
  const start = 72 + root
  const events: TimelineEvent[] = []
  chords.forEach((_, bar) => {
    const oct = chords.length >= 8 && bar >= 4 ? -12 : 0
    AT.forEach((at, i) => {
      const next = AT[i + 1] ?? 4
      const midi = start + SHAPE[i % 3]! + oct
      events.push({
        notes: [midi],
        startBeat: bar * beatsPerChord + at * (beatsPerChord / 4),
        durationBeats: (next - at) * (beatsPerChord / 4) * 0.95,
        hand: 'right',
        velocity: 72,
      })
    })
  })
  return events
}
