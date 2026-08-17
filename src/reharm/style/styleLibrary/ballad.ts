import type { RhythmCell, StylePattern } from '../types'

export type BalladDensity = 'verse' | 'pre' | 'chorus'

/** Verse / intro / outro — khối phách 1 và 3, tối giản. */
export const BALLAD_VERSE: RhythmCell = {
  lengthBeats: 4,
  left: [
    { beat: 0, durationBeats: 2, voice: 'bottom' },
    { beat: 2, durationBeats: 2, voice: 'bottom' },
  ],
  right: [
    { beat: 0, durationBeats: 2 },
    { beat: 2, durationBeats: 2 },
  ],
}

/** Pre-chorus — móc đơn, denser. */
export const BALLAD_PRE: RhythmCell = {
  lengthBeats: 4,
  left: [
    { beat: 0, durationBeats: 0.9, voice: 'bottom' },
    { beat: 1, durationBeats: 0.9, velocityScale: 0.9, voice: 'bottom' },
    { beat: 2, durationBeats: 0.9, voice: 'bottom' },
    { beat: 3, durationBeats: 0.9, velocityScale: 0.9, voice: 'bottom' },
  ],
  right: [
    { beat: 0, durationBeats: 0.9 },
    { beat: 1, durationBeats: 0.45, velocityScale: 0.8, voice: 'top' },
    { beat: 1.5, durationBeats: 0.45, velocityScale: 0.75 },
    { beat: 2, durationBeats: 0.9, velocityScale: 0.95 },
    { beat: 3, durationBeats: 0.45, velocityScale: 0.8, voice: 'top' },
    { beat: 3.5, durationBeats: 0.4, velocityScale: 0.75 },
  ],
}

/** Chorus / bridge — LH 1-5-8, RH rải móc đơn. */
export const BALLAD_CHORUS: RhythmCell = {
  lengthBeats: 4,
  left: [
    { beat: 0, durationBeats: 0.9, voice: 'bottom' },
    { beat: 1, durationBeats: 0.9, velocityScale: 0.9, voice: 'bottom' },
    { beat: 2, durationBeats: 0.9, voice: 'bottom' },
  ],
  right: [
    { beat: 0.5, durationBeats: 0.4, velocityScale: 0.75, voice: 'top' },
    { beat: 1, durationBeats: 0.4, velocityScale: 0.85 },
    { beat: 1.5, durationBeats: 0.4, velocityScale: 0.75, voice: 'top' },
    { beat: 2, durationBeats: 0.4, velocityScale: 0.9 },
    { beat: 2.5, durationBeats: 0.4, velocityScale: 0.75, voice: 'top' },
    { beat: 3, durationBeats: 0.4, velocityScale: 0.85 },
    { beat: 3.5, durationBeats: 0.4, velocityScale: 0.7, voice: 'top' },
  ],
}

const CELLS: Record<BalladDensity, RhythmCell> = {
  verse: BALLAD_VERSE,
  pre: BALLAD_PRE,
  chorus: BALLAD_CHORUS,
}

export function balladDensityOf(kind: string): BalladDensity {
  if (kind === 'chorus' || kind === 'bridge') return 'chorus'
  if (kind === 'prechorus') return 'pre'
  return 'verse'
}

export function balladCellFor(kind: string): RhythmCell {
  return CELLS[balladDensityOf(kind)]
}

export const BALLAD: StylePattern = {
  id: 'ballad',
  name: 'Ballad',
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  feel: 'straight-block-chord',
  verified: true,
  sourceVideos: ['Hệ thống quy tắc đệm Ballad Piano — kênh Khá Bự'],
  cell: BALLAD_VERSE,
  note: 'Khá Bự: tự đổi mật độ theo đoạn — Verse tối giản, Pre móc đơn, Chorus rải 1–5–8.',
}
