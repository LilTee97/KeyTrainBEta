import { describe, expect, it } from 'vitest'
import {
  beatsToGrid,
  estimateKey,
  expandToBeats,
  matchChroma,
  mergeBeatChords,
  smoothBeatChords,
} from '../chromaMatch'

function peak(...pcs: number[]): number[] {
  const bins = Array.from({ length: 12 }, () => 0.05)
  for (const pc of pcs) bins[pc] = 1
  return bins
}

describe('khớp chroma với hợp âm', () => {
  it('C E G ra C', () => {
    expect(matchChroma(peak(0, 4, 7))?.symbol).toBe('C')
  })

  it('A C E ra Am', () => {
    expect(matchChroma(peak(9, 0, 4))?.symbol).toBe('Am')
  })

  it('im lặng thì không đoán', () => {
    expect(matchChroma(Array.from({ length: 12 }, () => 0))).toBeNull()
  })

  it('G B D ra G, không ra Gmaj7', () => {
    expect(matchChroma(peak(7, 11, 2))?.symbol).toBe('G')
  })
})

describe('dò giọng từ chroma trung bình', () => {
  it('bài nặng chủ âm G trưởng ra G', () => {
    const avg = Array.from({ length: 12 }, () => 0.1)
    avg[7] = 4
    avg[11] = 2.5
    avg[2] = 2.5
    avg[0] = 1.2
    avg[4] = 0.8
    avg[9] = 1
    expect(estimateKey(avg)).toEqual({ root: 7, minor: false })
  })

  it('nuốt hợp âm lẻ 1 phách yếu', () => {
    expect(smoothBeatChords(['G', 'D', 'G', 'G'], 4)).toEqual([
      'G',
      'G',
      'G',
      'G',
    ])
  })

  it('im lặng thì không đoán', () => {
    expect(estimateKey(Array.from({ length: 12 }, () => 0))).toBeNull()
  })
})

describe('gộp phách và ghi lưới', () => {
  it('bung hợp âm ra từng phách', () => {
    expect(expandToBeats([{ symbol: 'Cadd2', beats: 2 }, { symbol: 'G' }], 4)).toEqual(
      ['Cadd2', 'Cadd2', 'G', 'G', 'G', 'G'],
    )
  })

  it('cùng hợp âm liền nhau gộp phách', () => {
    expect(mergeBeatChords(['C', 'C', 'C', 'C', 'Am', 'Am'])).toEqual([
      { symbol: 'C', beats: 4 },
      { symbol: 'Am', beats: 2 },
    ])
  })

  it('ô đồng nhất ghi một hợp âm, ô đổi ghi từng phách', () => {
    expect(beatsToGrid(['C', 'C', 'C', 'C', 'C', 'Am', 'F', 'G'], 4)).toBe(
      '| C |\n| C Am F G |',
    )
  })
})
