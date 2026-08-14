import { describe, expect, it } from 'vitest'
import {
  MAX_BPM,
  MIN_BPM,
  beatPositionOf,
  clampBpm,
} from '../metronome'

describe('clampBpm', () => {
  it('giữ nguyên nhịp độ trong khoảng cho phép', () => {
    expect(clampBpm(120)).toBe(120)
    expect(clampBpm(MIN_BPM)).toBe(MIN_BPM)
    expect(clampBpm(MAX_BPM)).toBe(MAX_BPM)
  })

  it('ép về hai đầu khi vượt khoảng', () => {
    expect(clampBpm(10)).toBe(MIN_BPM)
    expect(clampBpm(500)).toBe(MAX_BPM)
    expect(clampBpm(-30)).toBe(MIN_BPM)
  })

  it('làm tròn số lẻ', () => {
    expect(clampBpm(120.4)).toBe(120)
    expect(clampBpm(120.6)).toBe(121)
  })

  it('trả về nhịp độ thấp nhất khi nhận giá trị không phải số', () => {
    expect(clampBpm(Number.NaN)).toBe(MIN_BPM)
  })

  it('khoảng nhịp độ đúng như thiết kế', () => {
    expect(MIN_BPM).toBe(30)
    expect(MAX_BPM).toBe(240)
  })
})

describe('beatPositionOf', () => {
  it('phách đầu tiên là phách mạnh', () => {
    expect(beatPositionOf(0, 4)).toEqual({
      beat: 0,
      measure: 0,
      isAccent: true,
    })
  })

  it('đếm hết một ô nhịp bốn phách', () => {
    const beats = [0, 1, 2, 3].map((tick) => beatPositionOf(tick, 4))
    expect(beats.map((position) => position.beat)).toEqual([0, 1, 2, 3])
    expect(beats.map((position) => position.isAccent)).toEqual([
      true,
      false,
      false,
      false,
    ])
  })

  it('sang ô nhịp mới thì quay lại phách mạnh', () => {
    expect(beatPositionOf(4, 4)).toEqual({
      beat: 0,
      measure: 1,
      isAccent: true,
    })
  })

  it('đếm đúng số ô nhịp đã đi qua', () => {
    expect(beatPositionOf(11, 4).measure).toBe(2)
    expect(beatPositionOf(12, 4).measure).toBe(3)
  })

  it('đếm đúng nhịp ba bốn của điệu valse', () => {
    const beats = [0, 1, 2, 3].map((tick) => beatPositionOf(tick, 3))
    expect(beats.map((position) => position.beat)).toEqual([0, 1, 2, 0])
    expect(beats[3].measure).toBe(1)
  })

  it('đếm đúng nhịp sáu tám', () => {
    expect(beatPositionOf(6, 6)).toEqual({
      beat: 0,
      measure: 1,
      isAccent: true,
    })
  })

  it('mỗi ô nhịp có đúng một phách mạnh', () => {
    for (const beatsPerMeasure of [2, 3, 4, 6, 8]) {
      const accents = Array.from({ length: beatsPerMeasure * 3 }, (_, tick) =>
        beatPositionOf(tick, beatsPerMeasure),
      ).filter((position) => position.isAccent)

      expect(accents).toHaveLength(3)
    }
  })

  it('không vỡ khi số phách mỗi ô nhịp không hợp lệ', () => {
    expect(beatPositionOf(5, 0).beat).toBe(0)
    expect(beatPositionOf(5, -2).beat).toBe(0)
  })

  it('làm tròn xuống số phách lẻ', () => {
    expect(beatPositionOf(4, 4.7)).toEqual(beatPositionOf(4, 4))
  })
})
