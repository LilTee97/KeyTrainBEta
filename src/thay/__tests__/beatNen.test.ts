import { describe, expect, it } from 'vitest'
import { BEAT_NEN, nenBeat, vongQuyTacBeat } from '../hocSolo/beatNen'
import { MAN_KHUNG } from '../hocSolo/mauKhung'

describe('nền beat (người dùng 15/10/2026: "backing track ko cần chơi giai điệu nhiều mà chỉ có beat")', () => {
  const lofi = BEAT_NEN.find((b) => b.id === 'lofi-4-4')!

  it('lo-fi 4/4 đúng khuôn đo từ video: kick phách 1 · cuối phách 2 · phách 3; snare phách 2 · 4; hi-hat đều 8 móc đơn', () => {
    const cho = (m: number) => lofi.o.filter((x) => x.m === m).map((x) => x.phach).sort((a, b) => a - b)
    expect(cho(36)).toEqual([0, 1.75, 2])
    expect(cho(38)).toEqual([1, 3])
    expect(cho(42)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
    expect(lofi.o.every((x) => x.luc >= 1 && x.luc <= 127 && x.phach >= 0 && x.phach < lofi.phachO)).toBe(true)
    // Kick cuối phách 2 là tiếng mạnh nhất của dải kick (độ vọt 9/9), snare phách 2 mạnh hơn phách 4 (9 · 7).
    expect(lofi.o.find((x) => x.m === 36 && x.phach === 1.75)!.luc).toBe(Math.max(...lofi.o.filter((x) => x.m === 36).map((x) => x.luc)))
  })

  it('nền trải đủ số phách — ô lặp liền nhau, mọi tiếng gõ bằng bộ trống', () => {
    const n = nenBeat(lofi, 16)
    expect(n).toHaveLength(4 * lofi.o.length)
    expect(n.every((h) => h.trong && h.startBeat >= 0 && h.startBeat < 16)).toBe(true)
    expect(nenBeat(lofi, 6).every((h) => h.startBeat < 6)).toBe(true)
  })

  it('vòng màn quy tắc trên nền beat: đủ số hợp âm, mỗi hợp âm N ô, không lặp hợp âm vừa rồi; nền là một ô trống lặp mãi, có đếm vào', () => {
    MAN_KHUNG.forEach((m, mi) => {
      const v = vongQuyTacBeat(mi, [0, 5, 7], lofi, 2, 20)
      expect(v.cau).toHaveLength(20)
      expect(v.nhip.every((x) => x === 8)).toBe(true)
      if (m.buoc.length >= 2) expect(v.cau.every((c, i) => i === 0 || c.id !== v.cau[i - 1]!.id)).toBe(true)
      expect(v.cau.every((c) => c.ssa.loai === 'quy-tac')).toBe(true)
      // Một ô 4/4 lặp mãi — mỗi lượt chỉ dựng 13 tiếng thay vì ≈ 840 tiếng của cả vòng.
      expect(v.chuKyNen).toBe(4)
      expect(v.nen).toHaveLength(lofi.o.length)
      expect(v.nen.every((h) => h.startBeat < 4)).toBe(true)
      expect(v.demTrong).toBe(true)
    })
  })
})
