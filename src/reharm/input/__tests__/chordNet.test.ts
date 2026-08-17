import { describe, expect, it } from 'vitest'
import { chordNetAccuracy } from '../chordNet'
import { matchChroma } from '../chromaMatch'

describe('mạng hợp âm train trên chroma gán nhãn', () => {
  it('đúng trên tập giữ lại', () => {
    expect(chordNetAccuracy()).toBeGreaterThan(0.85)
  })

  it('vẫn đọc triad sạch', () => {
    const c = Array.from({ length: 12 }, () => 0.05)
    c[0] = 1
    c[4] = 1
    c[7] = 1
    expect(matchChroma(c)?.symbol).toBe('C')
  })
})
