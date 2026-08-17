import type { RhythmCell, RhythmHit } from '../types'

/** Token không phải rest thì thành một tiếng đàn. */
function isHit(token: string): boolean {
  if (!token || token === '.') return false
  return /[x0-9]/i.test(token)
}

/** `13` → nốt 1+3; `1f` gốc+5; `1+` gốc lên 8; `x`/`0` cả hợp âm. */
function parseTones(
  token: string,
): { toneIndex: number; semitones?: number }[] | undefined {
  if (/x/i.test(token) || !/[1-9]/.test(token)) return undefined
  const tones: { toneIndex: number; semitones?: number }[] = []
  for (const part of token.matchAll(/([1-9])([f+]*)/g)) {
    let semitones = 0
    if (part[2].includes('+')) semitones += 12
    if (part[2].includes('f')) semitones += 7
    tones.push({
      toneIndex: Number(part[1]) - 1,
      ...(semitones ? { semitones } : {}),
    })
  }
  return tones.length ? tones : undefined
}

function hitsFromArp(
  arp: string,
  step: number,
  lengthBeats: number,
): RhythmHit[] {
  const tokens = arp.trim().split(/\s+/)
  const cycle = tokens.length * step
  const repeats = cycle > 0 ? Math.ceil(lengthBeats / cycle) : 1
  const hits: RhythmHit[] = []
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    tokens.forEach((token, index) => {
      if (!isHit(token)) return
      const beat = repeat * cycle + index * step
      if (beat >= lengthBeats) return
      const accent = token.includes('!')
      const short = /s/i.test(token) && !accent
      const tones = parseTones(token)
      hits.push({
        beat,
        durationBeats: Math.max(0.18, step * (short ? 0.7 : 1.4)),
        velocityScale: accent ? 1 : short ? 0.78 : 0.88,
        ...(tones ? { tones } : {}),
      })
    })
  }
  return hits
}

function namedChordHits(
  kind: 'beat' | 'backbeat' | 'offbeat',
  bar: number,
): RhythmHit[] {
  if (kind === 'beat') {
    return Array.from({ length: bar }, (_, beat) => ({
      beat,
      durationBeats: 0.7,
      velocityScale: beat % 2 === 0 ? 1 : 0.82,
    }))
  }
  if (kind === 'backbeat') {
    return [
      { beat: 1, durationBeats: 0.8, velocityScale: 1 },
      { beat: 3, durationBeats: 0.8, velocityScale: 0.92 },
    ]
  }
  return [0.5, 1.5, 2.5, 3.5].map((beat) => ({
    beat,
    durationBeats: 0.35,
    velocityScale: 0.92,
  }))
}

function namedBassHits(kind: 'octaves' | 'boogie', bar: number): RhythmHit[] {
  if (kind === 'octaves') {
    return Array.from({ length: bar }, (_, beat) => ({
      beat,
      durationBeats: 0.85,
      velocityScale: beat % 2 === 0 ? 1 : 0.85,
      voice: 'bottom' as const,
    }))
  }
  return Array.from({ length: bar * 2 }, (_, index) => ({
    beat: index * 0.5,
    durationBeats: 0.4,
    velocityScale: index % 2 === 0 ? 1 : 0.72,
    voice: 'bottom' as const,
  }))
}

/** Rải theo vòng nốt 1-based (1 = nốt thấp). Bass ngân một nốt cả ô. */
export function cellFromCycle(
  cycle: readonly number[],
  step: number,
  lengthBeats: number,
  mirror = false,
): RhythmCell {
  const sequence = mirror
    ? [...cycle, ...[...cycle].reverse()]
    : [...cycle]
  const slots = Math.round(lengthBeats / step)
  const right: RhythmHit[] = []
  for (let index = 0; index < slots; index += 1) {
    const tone = sequence[index % sequence.length]
    right.push({
      beat: index * step,
      durationBeats: Math.min(step * 0.95, lengthBeats - index * step),
      toneIndex: tone - 1,
      velocityScale: index % 4 === 0 ? 1 : 0.84,
    })
  }
  return {
    lengthBeats,
    right,
    left: [
      {
        beat: 0,
        durationBeats: lengthBeats,
        voice: 'bottom',
        velocityScale: 0.88,
      },
    ],
  }
}

export function cellFromArps(
  chord: string | 'beat' | 'backbeat' | 'offbeat',
  bass: string | 'octaves' | 'boogie',
  chordStep: number,
  bassStep: number,
  lengthBeats: number,
): RhythmCell {
  const right =
    chord === 'beat' || chord === 'backbeat' || chord === 'offbeat'
      ? namedChordHits(chord, lengthBeats)
      : hitsFromArp(chord, chordStep, lengthBeats)
  const left =
    bass === 'octaves' || bass === 'boogie'
      ? namedBassHits(bass, lengthBeats)
      : hitsFromArp(bass, bassStep, lengthBeats).map((hit) => ({
          ...hit,
          voice: 'bottom' as const,
        }))

  const fit = (hits: RhythmHit[]) =>
    hits
      .filter((hit) => hit.beat < lengthBeats)
      .map((hit) => ({
        ...hit,
        durationBeats: Math.min(hit.durationBeats, lengthBeats - hit.beat),
      }))

  return { lengthBeats, right: fit(right), left: fit(left) }
}
