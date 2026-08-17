import type { RhythmCell, RhythmHit } from '../types'

/** Token không phải rest thì thành một tiếng đàn. */
function isHit(token: string): boolean {
  if (!token || token === '.') return false
  return /[x0-9]/i.test(token)
}

function hitsFromArp(arp: string, step: number): RhythmHit[] {
  const tokens = arp.trim().split(/\s+/)
  const hits: RhythmHit[] = []
  tokens.forEach((token, index) => {
    if (!isHit(token)) return
    const accent = token.includes('!')
    const short = /s/i.test(token) && !accent
    hits.push({
      beat: index * step,
      durationBeats: Math.max(0.18, step * (short ? 0.7 : 1.4)),
      velocityScale: accent ? 1 : short ? 0.78 : 0.88,
    })
  })
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
      : hitsFromArp(chord, chordStep)
  const left =
    bass === 'octaves' || bass === 'boogie'
      ? namedBassHits(bass, lengthBeats)
      : hitsFromArp(bass, bassStep).map((hit) => ({
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
