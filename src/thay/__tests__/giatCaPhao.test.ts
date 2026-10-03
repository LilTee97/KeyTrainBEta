import { describe, expect, it } from 'vitest'
import type { TimedScore } from '../../reharm/playback/timedScoring'
import type { LuotTap } from '../../shared/persistence/db'
import { BAC_GIAT, GIAT_CA_PHAO, boGiat, chamGiat, khoaGiat, lapDoan, trangThaiGiat } from '../kyThuat/giatCaPhao'

const score = (hit: number, total: number, medianAbsMs: number, extra = 0): TimedScore => ({
  total,
  hit,
  missed: [],
  extra: Array.from({ length: extra }, () => ({ note: 60, beat: 0, velocity: 80 })),
  errorsMs: [],
  medianMs: 0,
  medianAbsMs,
})

describe('Đánh giật kiểu Cà Pháo — dữ liệu cắt từ sheet Người hãy quên em đi', () => {
  it('9 đoạn, đoạn nào cũng có giật ở tay phải; nốt giật vang nửa trường độ ghi', () => {
    expect(GIAT_CA_PHAO.bai).toHaveLength(9)
    expect(GIAT_CA_PHAO.bai.reduce((sum, one) => sum + one.soCuGiat, 0)).toBe(66)
    for (const doan of GIAT_CA_PHAO.bai) {
      expect(doan.giatPhai).toBeGreaterThan(0)
      for (const event of doan.events.filter((one) => one.giat)) expect(event.durationBeats * 2).toBeCloseTo(event.ghiBeats!)
      const cuoi = Math.max(...doan.events.map((event) => event.startBeat))
      expect(cuoi).toBeLessThan(doan.doDai)
    }
  })

  it('xếp dễ trước: số cú mỗi phách không giảm', () => {
    const cu = GIAT_CA_PHAO.bai.map((one) => one.cuMoiPhach)
    expect(cu).toEqual([...cu].sort((a, b) => a - b))
  })

  it('mỗi lượt ≥ 16 phách; bản bỏ giật vang đủ trường độ ghi', () => {
    for (const doan of GIAT_CA_PHAO.bai) {
      const lap = lapDoan(doan)
      expect(Math.max(...lap.map((event) => event.startBeat))).toBeGreaterThanOrEqual(16 - doan.doDai)
      expect(boGiat(doan.events).some((event) => event.giat)).toBe(false)
    }
  })
})

describe('chamGiat — thang 4 bậc', () => {
  const bac1 = BAC_GIAT[0]!
  it('đạt khi đủ cả năm cột; cột giật phải có nốt để chấm', () => {
    const nhac = { giatTong: 8, giatDung: 6, nganTong: 4, nganDung: 3 }
    expect(chamGiat(bac1, score(17, 20, 50), nhac).dat).toBe(true)
    expect(chamGiat(bac1, score(17, 20, 50), { ...nhac, giatDung: 5 }).dat).toBe(false)
    expect(chamGiat(bac1, score(17, 20, 50), { ...nhac, giatTong: 0, giatDung: 0 }).dat).toBe(false)
    expect(chamGiat(bac1, score(17, 20, 50), { ...nhac, nganTong: 0, nganDung: 0 }).dat).toBe(true)
    expect(chamGiat(bac1, score(17, 20, 70), nhac).dat).toBe(false)
  })

  it('qua bậc trước mới mở bậc sau, mỗi đoạn một khoá riêng', () => {
    const luot = (bac: number, dat: boolean, id = 'o8'): LuotTap => ({
      timestamp: 0,
      day: '2026-10-03',
      styleId: khoaGiat(id),
      bac,
      dat,
      soDo: {},
    })
    expect(trangThaiGiat([], 'o8')).toEqual(['mo', 'khoa', 'khoa', 'khoa'])
    expect(trangThaiGiat([luot(1, true), luot(2, false)], 'o8')).toEqual(['qua', 'mo', 'khoa', 'khoa'])
    expect(trangThaiGiat([luot(1, true, 'o16')], 'o8')).toEqual(['mo', 'khoa', 'khoa', 'khoa'])
  })
})
