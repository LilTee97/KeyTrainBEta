import type { Feel, RhythmCell, RhythmHit, StylePattern } from '../types'
import { cellFromArps, cellFromCycle } from './arpToCell'

/**
 * Điệu OneMotion: tab Styles + General (Once, Basic 1–4) + Chord (Arp).
 * Chưa lấy tab Bass.
 * https://www.onemotion.com/chord-player/
 */

const SOURCE = ['OneMotion Chord Player'] as const

type ChordKind = string | 'beat' | 'backbeat' | 'offbeat'
type BassKind = string | 'octaves' | 'boogie'

interface Def {
  id: string
  family: string
  familyName: string
  variant: number
  name: string
  bar?: number
  ts?: string
  feel?: Feel
  cStep?: number
  bStep?: number
  bpm?: number
  chord: ChordKind
  bass: BassKind
}

function make(def: Def): StylePattern {
  const bar = def.bar ?? 4
  return {
    id: def.id,
    name: def.name,
    family: def.family,
    familyName: def.familyName,
    variant: def.variant,
    timeSignature: def.ts ?? '4/4',
    beatsPerMeasure: Number((def.ts ?? '4/4').split('/')[0]),
    bpm: def.bpm ?? 120,
    feel: def.feel ?? 'straight-block-chord',
    verified: true,
    sourceVideos: [...SOURCE],
    cell: cellFromArps(
      def.chord,
      def.bass,
      def.cStep ?? 0.25,
      def.bStep ?? 0.25,
      bar,
    ),
    note: `OneMotion ${def.name}`,
  }
}

const DEFS: Def[] = [
  { id: 'pop-1', family: 'pop', familyName: 'Pop', variant: 1, name: 'Pop 1', chord: 'beat', bass: '1!1+! . . . . . . @1f! 1!1+! . . . . 1s1+s . .', bStep: 0.5 },
  { id: 'pop-2', family: 'pop', familyName: 'Pop', variant: 2, name: 'Pop 2', bpm: 90, chord: 'x . . . . x? . . 0# . . . . x . .', bass: '11+ . . 1 . . 1+m? 1fm? 11+ . . 1 1+ . 1+m 1fm' },
  { id: 'pop-3', family: 'pop', familyName: 'Pop', variant: 3, name: 'Pop 3', bpm: 90, chord: 'xs . . . 1s3s 2s . @xs . . . . 12 . 3- .', bass: '1s1+s . . 1+! . . @1s . . . . 1+! . 1+! . .' },
  { id: 'pop-4', family: 'pop', familyName: 'Pop', variant: 4, name: 'Pop 4', bpm: 90, chord: 'x . . . xm . . . xm . . . xm . . .', bass: '1 . . @1f# . . . .', bStep: 0.5 },

  { id: 'dance-1', family: 'dance', familyName: 'Dance', variant: 1, name: 'Dance 1', chord: 'x . . @x . . @x . . x . . x . . x', bass: 'octaves' },
  { id: 'dance-2', family: 'dance', familyName: 'Dance', variant: 2, name: 'Dance 2', chord: '. . x . . x . . x . . x . 1 2 1', bass: 'x . . . x . . @x . . x . . . . .' },

  { id: 'rock-1', family: 'rock', familyName: 'Rock', variant: 1, name: 'Rock 1', chord: 'xs . . . . . . . . . x! . . x! . .', bass: 'boogie' },
  { id: 'rock-2', family: 'rock', familyName: 'Rock', variant: 2, name: 'Rock 2', chord: 'xs . . xs . . x! .', cStep: 0.5, bass: '1s . . . 1+ . . . . . 1s . 1+ . . .' },
  { id: 'rock-3', family: 'rock', familyName: 'Rock', variant: 3, name: 'Rock 3', chord: '. . . . xs . . @2 . 13 . . x . 2 13', bass: '1 . . . . . . . . . 1 . . . . .' },
  { id: 'rock-4', family: 'rock', familyName: 'Rock', variant: 4, name: 'Rock 4', chord: '234 . 234 . 1 234 . @234', cStep: 0.5, bass: 'octaves' },

  { id: 'swing-1', family: 'swing', familyName: 'Swing', variant: 1, name: 'Swing 1', feel: 'swing', bpm: 130, chord: '. . . xs# . . 0!# .', cStep: 0.5, bass: '1s . . . . . . @1f&', bStep: 0.5 },
  { id: 'swing-2', family: 'swing', familyName: 'Swing', variant: 2, name: 'Swing 2', feel: 'swing', bpm: 130, chord: 'x! . . @xs . . . . . x! . . . x! . .', cStep: 0.5, bass: '1s . 1fs . 1+s 1 1fs# .', bStep: 0.5 },

  { id: 'reggae-1', family: 'reggae', familyName: 'Reggae', variant: 1, name: 'Reggae', feel: 'syncopated-3-3-2', bpm: 80, chord: '. . x! . . . x! . . . x! 231+ . . x! .', bass: '1 1 . . . 1+! . .' },

  { id: 'salsa-1', family: 'salsa', familyName: 'Salsa', variant: 1, name: 'Salsa 1', feel: 'syncopated-3-3-2', chord: '14 2 3 14 . 23 @0 14 . 23 . @14 . 23 @0 14', bass: '1s . . @1f&s# . . @1s . . . . @1f&s# . . @1s' },
  { id: 'salsa-2', family: 'salsa', familyName: 'Salsa', variant: 2, name: 'Salsa 2', feel: 'syncopated-3-3-2', chord: '3# . 4 1# . 2 @0 3m# . 4 . @1# . 2 @0 3', bass: '1s . . @1f&s# . . @1s . . . . @1f&s# . . @1s' },

  { id: 'bossa-nova-1', family: 'bossa', familyName: 'Bossa Nova', variant: 1, name: 'Bossa Nova 1', feel: 'syncopated-3-3-2', chord: 'x! . xs . . x . @x! . xs . . x! . x! .', cStep: 0.5, bass: '1s . . 1 1fs# . . @1s', bStep: 0.5, bar: 8 },
  { id: 'bossa-nova-2', family: 'bossa', familyName: 'Bossa Nova', variant: 2, name: 'Bossa Nova 2', feel: 'syncopated-3-3-2', chord: '. . . . x . . . . . x! . . . . . . . . . xs . . . . . . . x! . . .', bass: '1! . . . . . 1f! . 1fs# . . . . . @1s .' },

  { id: 'samba-1', family: 'samba', familyName: 'Samba', variant: 1, name: 'Samba', feel: 'syncopated-3-3-2', chord: 'x! . x @1! . x! . @x! . x! . @x! . x! . 1!', cStep: 0.5, bass: '1s . . . 1f&s# . . .', bStep: 0.5, bar: 8 },

  { id: 'merengue-1', family: 'merengue', familyName: 'Merengue', variant: 1, name: 'Merengue', feel: 'syncopated-3-3-2', chord: '. x! . x! . . x! . . . x! . . . x! .', bass: '1s . . . 1f&s# . . . 1s . . . 1f&s# . . .' },

  { id: 'cumbia-1', family: 'cumbia', familyName: 'Cumbia', variant: 1, name: 'Cumbia', feel: 'syncopated-3-3-2', bpm: 100, chord: '. x!', cStep: 0.5, bass: '1 . 2! 3!', bStep: 0.5 },

  { id: 'reggaeton-1', family: 'reggaeton', familyName: 'Reggaeton', variant: 1, name: 'Reggaeton', feel: 'syncopated-3-3-2', bpm: 100, chord: '. . . x! . . x .', bass: '1 . 1f&# . 1 . 1f&# 1?', bStep: 0.5 },

  { id: 'tango-1', family: 'tango', familyName: 'Tango', variant: 1, name: 'Tango', chord: '. . . 1 2*! . 1 . . . . 1 2*! . 2*! .', cStep: 0.5, bass: '1s . . 1f# 1+# . 1f# .', bStep: 0.5 },

  { id: 'flamenco-1', family: 'flamenco', familyName: 'Flamenco', variant: 1, name: 'Flamenco 1', ts: '6/8', bar: 6, feel: 'waltz-oom-pah-pah', bpm: 100, chord: '. xs .', cStep: 1, bass: '11f . 1+s', bStep: 1 },
  { id: 'flamenco-2', family: 'flamenco', familyName: 'Flamenco', variant: 2, name: 'Flamenco 2', ts: '6/8', bar: 6, feel: 'waltz-oom-pah-pah', bpm: 100, chord: '. . 13 2 1s3s . . . 1m3 . 2s .', cStep: 0.5, bass: '11f . . . . . 1s1fs . . . . .', bStep: 0.5 },
  { id: 'flamenco-3', family: 'flamenco', familyName: 'Flamenco', variant: 3, name: 'Flamenco 3', bpm: 100, chord: '. . . . 1s 2s 3s 4s', cStep: 0.25, bass: '1s . 2s 3s', bStep: 1 },

  { id: 'ragtime-1', family: 'ragtime', familyName: 'Ragtime', variant: 1, name: 'Ragtime', feel: 'swing', chord: 'offbeat', bass: '1 . 1f- . 1 . 1f- .', bStep: 0.5 },

  { id: 'country-1', family: 'country', familyName: 'Country', variant: 1, name: 'Country 1', feel: 'swing', chord: 'backbeat', bass: '1s . . @2 3 . 2 3', bStep: 0.5 },
  { id: 'country-2', family: 'country', familyName: 'Country', variant: 2, name: 'Country 2', feel: 'swing', chord: '. . 123 1 . 1 23 1', cStep: 0.5, bass: '1s . . . 1f . 1f> .', bStep: 0.5 },

  { id: 'boogie-1', family: 'boogie', familyName: 'Boogie', variant: 1, name: 'Boogie', feel: 'swing', chord: '. x! . . x . . . x . . @x! . . . .', cStep: 0.5, bass: 'boogie' },

  { id: 'funk-1', family: 'funk', familyName: 'Funk', variant: 1, name: 'Funk 1', feel: 'syncopated-3-3-2', chord: 'backbeat', bass: '1s . . . . . @1<+! . 1+! . 1f<! 1f! . 1<+! 1+ .' },
  { id: 'funk-2', family: 'funk', familyName: 'Funk', variant: 2, name: 'Funk 2', feel: 'syncopated-3-3-2', chord: 'backbeat', bass: '1s . . . . . @1f<! 1f! 1<+! . . 1+! . .' },
  { id: 'funk-3', family: 'funk', familyName: 'Funk', variant: 3, name: 'Funk 3', feel: 'syncopated-3-3-2', chord: 'backbeat', bass: '1s . . 1!m . . @1<+! . 1+! . . . . . . .' },
  { id: 'funk-4', family: 'funk', familyName: 'Funk', variant: 4, name: 'Funk 4', feel: 'syncopated-3-3-2', chord: 'backbeat', bass: '1s . . 1+! . 1ms! @1<+m! . 1+! . . . . . . .' },
  { id: 'funk-5', family: 'funk', familyName: 'Funk', variant: 5, name: 'Funk 5', feel: 'syncopated-3-3-2', chord: 'xs . . @x! . . . . . . . . x! . . .', bass: '1 . . . . . . @1<+ 1+! 1<+ 1f! 1f<! . . @1< .' },

  { id: 'strumming-1', family: 'strumming', familyName: 'Strumming', variant: 1, name: 'Strumming 1', chord: 'x . x . x . x .', cStep: 0.5, bass: '1 . . . 1 . . .', bStep: 0.5 },
  { id: 'strumming-2', family: 'strumming', familyName: 'Strumming', variant: 2, name: 'Strumming 2', chord: 'x x x x x x x x', cStep: 0.5, bass: '1 . 1 . 1 . 1 .', bStep: 0.5 },

  { id: 'waltz-1', family: 'waltz', familyName: 'Waltz', variant: 1, name: 'Waltz 1', ts: '3/4', bar: 3, feel: 'waltz-oom-pah-pah', chord: '. x x', cStep: 1, bass: '1 . .', bStep: 1 },
  { id: 'waltz-2', family: 'waltz', familyName: 'Waltz', variant: 2, name: 'Waltz 2', ts: '3/4', bar: 3, feel: 'waltz-oom-pah-pah', chord: '. . x . x .', cStep: 0.5, bass: '1 . .', bStep: 1 },
  { id: 'waltz-3', family: 'waltz', familyName: 'Waltz', variant: 3, name: 'Waltz 3', ts: '3/4', bar: 3, feel: 'waltz-oom-pah-pah', chord: '. 1 2* . 2* .', cStep: 0.5, bass: '1 . .', bStep: 1 },
  { id: 'jazz-waltz-1', family: 'jazz-waltz', familyName: 'Jazz Waltz', variant: 1, name: 'Jazz Waltz', ts: '3/4', bar: 3, feel: 'swing', chord: '. x! . . xs .', cStep: 0.5, bass: '1 . . @1 . @1f', bStep: 0.5 },

  { id: 'habanera', family: 'habanera', familyName: 'Habanera', variant: 1, name: 'Habanera', feel: 'syncopated-3-3-2', chord: 'x . . x! x . x .', cStep: 0.5, bass: '1 . . 1 . . 1 .', bStep: 0.5 },
  { id: 'tresillo-1', family: 'tresillo', familyName: 'Tresillo', variant: 1, name: 'Tresillo', feel: 'syncopated-3-3-2', chord: 'x . . x . . x! .', bass: '1 . . 1+s . . 1+ .', bStep: 0.25 },
  { id: 'cinquillo', family: 'cinquillo', familyName: 'Cinquillo', variant: 1, name: 'Cinquillo', feel: 'syncopated-3-3-2', chord: 'x . x! @x . x! x .', cStep: 0.5, bass: '1 . . . 1 . . .', bStep: 0.5 },
  { id: 'son-clave-3-2', family: 'son-clave', familyName: 'Son Clave', variant: 1, name: 'Son Clave 3-2', feel: 'syncopated-3-3-2', chord: 'x . . x . . @x . . . x . x . . .', bass: '1 . . . 1 . . . 1 . . . 1 . . .', bar: 8 },
  { id: 'son-clave-2-3', family: 'son-clave', familyName: 'Son Clave', variant: 2, name: 'Son Clave 2-3', feel: 'syncopated-3-3-2', chord: '. . x . . x . . x . . x . . x .', bass: '1 . . . 1 . . . 1 . . . 1 . . .', bar: 8 },
  { id: 'bossa-nova-clave-3-2', family: 'bossa-clave', familyName: 'Bossa Clave', variant: 1, name: 'Bossa Clave 3-2', feel: 'syncopated-3-3-2', chord: 'x . . x . . @x . . . x . . x . .', bass: '1s . . 1 1fs# . . @1s', bStep: 0.5, bar: 8 },
  { id: 'bossa-nova-clave-2-3', family: 'bossa-clave', familyName: 'Bossa Clave', variant: 2, name: 'Bossa Clave 2-3', feel: 'syncopated-3-3-2', chord: '. . x . . x . . x . . x . . x .', bass: '1s . . 1 1fs# . . @1s', bStep: 0.5, bar: 8 },
]

function blockOnce(): RhythmCell {
  return {
    lengthBeats: 4,
    right: [{ beat: 0, durationBeats: 3.8 }],
    left: [{ beat: 0, durationBeats: 3.8, voice: 'bottom', velocityScale: 0.88 }],
  }
}

function split231(): RhythmCell {
  const right: RhythmHit[] = []
  for (let slot = 0; slot < 8; slot += 1) {
    const beat = slot * 0.5
    if (slot % 2 === 0) {
      right.push(
        { beat, durationBeats: 0.45, toneIndex: 1, velocityScale: 0.9 },
        { beat, durationBeats: 0.45, toneIndex: 2, velocityScale: 0.9 },
      )
    } else {
      right.push({ beat, durationBeats: 0.45, toneIndex: 0, velocityScale: 0.85 })
    }
  }
  return {
    lengthBeats: 4,
    right,
    left: [{ beat: 0, durationBeats: 4, voice: 'bottom', velocityScale: 0.88 }],
  }
}

const ARP_CYCLES: readonly { id: string; name: string; cycle: number[] }[] = [
  { id: 'arp-1-2', name: 'Arp 1-2', cycle: [1, 2] },
  { id: 'arp-1-2-3', name: 'Arp 1-2-3', cycle: [1, 2, 3] },
  { id: 'arp-1-3-2', name: 'Arp 1-3-2', cycle: [1, 3, 2] },
  { id: 'arp-1-2-3-2', name: 'Arp 1-2-3-2', cycle: [1, 2, 3, 2] },
  { id: 'arp-1-2-3-4', name: 'Arp 1-2-3-4', cycle: [1, 2, 3, 4] },
  { id: 'arp-1-2-4-3', name: 'Arp 1-2-4-3', cycle: [1, 2, 4, 3] },
  { id: 'arp-1-3-2-3', name: 'Arp 1-3-2-3', cycle: [1, 3, 2, 3] },
  { id: 'arp-1-3-2-4', name: 'Arp 1-3-2-4', cycle: [1, 3, 2, 4] },
  { id: 'arp-1-4-3-2', name: 'Arp 1-4-3-2', cycle: [1, 4, 3, 2] },
  { id: 'arp-2-1-2-3', name: 'Arp 2-1-2-3', cycle: [2, 1, 2, 3] },
  { id: 'arp-1-2-3-4-3-2', name: 'Arp 1-2-3-4-3-2', cycle: [1, 2, 3, 4, 3, 2] },
  { id: 'arp-1-2-3-1-2-4', name: 'Arp 1-2-3-1-2-4', cycle: [1, 2, 3, 1, 2, 4] },
  { id: 'arp-1-2-3-2-3-2', name: 'Arp 1-2-3-2-3-2', cycle: [1, 2, 3, 2, 3, 2] },
  { id: 'arp-1-3-2-3-4-3', name: 'Arp 1-3-2-3-4-3', cycle: [1, 3, 2, 3, 4, 3] },
  { id: 'arp-2-1-2-3-4-3', name: 'Arp 2-1-2-3-4-3', cycle: [2, 1, 2, 3, 4, 3] },
  { id: 'arp-1-3-2-3-4-3-2-3', name: 'Arp 1-3-2-3-4-3-2-3', cycle: [1, 3, 2, 3, 4, 3, 2, 3] },
]

function tagged(
  id: string,
  family: string,
  familyName: string,
  variant: number,
  name: string,
  cell: RhythmCell,
): StylePattern {
  return {
    id,
    name,
    family,
    familyName,
    variant,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 120,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: [...SOURCE],
    cell,
    note: `OneMotion ${name} — rải nốt hợp âm.`,
  }
}

const BASIC_STYLES: StylePattern[] = [
  tagged('once', 'basic', 'Basic', 1, 'Once', blockOnce()),
  tagged('basic-1', 'basic', 'Basic', 2, 'Basic 1', split231()),
  tagged('basic-2', 'basic', 'Basic', 3, 'Basic 2', cellFromCycle([1, 2, 3, 2], 0.5, 4)),
  tagged(
    'basic-3',
    'basic',
    'Basic',
    4,
    'Basic 3',
    cellFromCycle([1, 3, 2, 3], 0.5, 4, true),
  ),
  tagged(
    'basic-4',
    'basic',
    'Basic',
    5,
    'Basic 4',
    cellFromCycle([1, 2, 3, 1, 2, 4], 0.5, 4),
  ),
]

const ARP_STYLES: StylePattern[] = ARP_CYCLES.map((entry, index) =>
  tagged(
    entry.id,
    'arp',
    'Arp',
    index + 1,
    entry.name,
    cellFromCycle(entry.cycle, 0.5, 4),
  ),
)

function slowRockBass(): RhythmHit[] {
  return [0, 3].map((beat, index) => ({
    beat,
    durationBeats: 2.7,
    voice: 'bottom' as const,
    toneIndex: index === 0 ? 0 : 2,
    velocityScale: 1,
  }))
}

const SLOW_ROCK_META = {
  family: 'slow-rock' as const,
  familyName: 'Slow Rock',
  timeSignature: '6/8' as const,
  beatsPerMeasure: 6,
  bpm: 66,
  feel: 'straight-block-chord' as const,
  verified: true,
}

const SLOW_ROCK_STYLES: StylePattern[] = [
  {
    ...SLOW_ROCK_META,
    id: 'slow-rock-2',
    name: 'Slow Rock điệp',
    variant: 1,
    sourceVideos: ['6/8 slow-rock piano điệp: quạt móc đơn, mạnh 1 và 4'],
    cell: {
      lengthBeats: 6,
      right: [0, 1, 2, 3, 4, 5].map((beat) => ({
        beat,
        durationBeats: 0.85,
        velocityScale: beat === 0 || beat === 3 ? 1 : 0.55,
      })),
      left: slowRockBass(),
    },
    note: 'Slow Rock 6/8 điệp — quạt móc đơn, nhấn 1 và 4.',
  },
  {
    ...SLOW_ROCK_META,
    id: 'slow-rock-3',
    name: 'Slow Rock rải',
    variant: 2,
    sourceVideos: ['6/8 rải: gốc–5–8–3–5–8'],
    cell: {
      lengthBeats: 6,
      right: [
        { toneIndex: 0 },
        { toneIndex: 2 },
        { tones: [{ toneIndex: 0, semitones: 12 }] },
        { toneIndex: 1 },
        { toneIndex: 2 },
        { tones: [{ toneIndex: 0, semitones: 12 }] },
      ].map((tone, beat) => ({
        beat,
        durationBeats: 0.95,
        velocityScale: beat === 0 || beat === 3 ? 1 : 0.8,
        ...tone,
      })),
      left: [{ beat: 0, durationBeats: 5.5, voice: 'bottom', toneIndex: 0, velocityScale: 0.9 }],
    },
    note: 'Slow Rock 6/8 rải — gốc 5 8 3 5 8.',
  },
  {
    ...SLOW_ROCK_META,
    id: 'slow-rock-4',
    name: 'Slow Rock hai tay',
    variant: 3,
    sourceVideos: ['6/8 hai tay: bass 1+4, rải 2-3 và 5-6'],
    cell: {
      lengthBeats: 6,
      right: [
        { beat: 1, toneIndex: 1 },
        { beat: 2, toneIndex: 2 },
        { beat: 4, tones: [{ toneIndex: 1, semitones: 12 }] },
        { beat: 5, tones: [{ toneIndex: 2, semitones: 12 }] },
      ].map((hit) => ({
        ...hit,
        durationBeats: 0.9,
        velocityScale: 0.88,
      })),
      left: slowRockBass(),
    },
    note: 'Slow Rock 6/8 hai tay — bass phách 1 và 4, tay phải rải lệch.',
  },
]

export const ONEMOTION_STYLES: readonly StylePattern[] = [
  ...BASIC_STYLES,
  ...DEFS.map(make),
  ...ARP_STYLES,
  ...SLOW_ROCK_STYLES,
]

export function styleFamilies(
  styles: readonly StylePattern[],
): { family: string; familyName: string; styles: StylePattern[] }[] {
  const map = new Map<string, StylePattern[]>()
  for (const style of styles) {
    const list = map.get(style.family) ?? []
    list.push(style)
    map.set(style.family, list)
  }
  return [...map.entries()].map(([family, group]) => ({
    family,
    familyName: group[0].familyName,
    styles: group,
  }))
}
