import { describe, expect, it } from 'vitest'
import type { TimedScore } from '../../reharm/playback/timedScoring'
import type { LuotTap } from '../../shared/persistence/db'
import { KY_THUAT, kyThuatCua } from '../kyThuat'
import { CHAY_TRAI_LINH_NHI } from '../kyThuat/chayTraiLinhNhi'
import { GIAT_CA_PHAO } from '../kyThuat/giatCaPhao'
import { boGiat, chamKyThuat, khoaKyThuat, lapDoan, trangThaiKyThuat } from '../kyThuat/kyThuat'
import { LAY_BLUES } from '../kyThuat/layBlues'
import { LAY_LINH_NHI } from '../kyThuat/layLinhNhi'
import { LICK_BE_BLUES } from '../kyThuat/lickBeBlues'

const score = (hit: number, total: number, medianAbsMs: number, extra = 0): TimedScore => ({
  total,
  hit,
  missed: [],
  extra: Array.from({ length: extra }, () => ({ note: 60, beat: 0, velocity: 80 })),
  errorsMs: [],
  medianMs: 0,
  medianAbsMs,
})

describe('tab Kỹ thuật đánh — mọi kỹ thuật', () => {
  it('mỗi thầy có sheet một kỹ thuật; Tuấn chưa có (không có sheet)', () => {
    expect(kyThuatCua('ca-phao').map((kt) => kt.id)).toEqual(['giat-cp'])
    expect(kyThuatCua('linh-nhi').map((kt) => kt.id)).toEqual(['chay-trai-ln', 'lay-ln'])
    expect(kyThuatCua('blues').map((kt) => kt.id)).toEqual(['lick-be-blues', 'lay-blues'])
    expect(kyThuatCua('tuan')).toEqual([])
  })

  it('đoạn nằm trọn trong độ dài của nó, xếp dễ trước, mỗi lượt ≥ 16 phách, thang 4 bậc', () => {
    for (const kt of KY_THUAT) {
      const cu = kt.bai.map((one) => one.cuMoiPhach)
      expect(cu).toEqual([...cu].sort((a, b) => a - b))
      expect(kt.bac.map((bac) => bac.so)).toEqual([1, 2, 3, 4])
      for (const doan of kt.bai) {
        const that = doan.events.filter((event) => !event.grace)
        expect(that.length).toBeGreaterThan(0)
        for (const event of that) {
          expect(event.startBeat).toBeGreaterThanOrEqual(0)
          expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(doan.doDai + 1e-6)
        }
        expect(Math.max(...lapDoan(doan).map((event) => event.startBeat))).toBeGreaterThanOrEqual(16 - doan.doDai)
      }
    }
  })
})

describe('Cà Pháo — đánh giật (Người hãy quên em đi)', () => {
  it('9 đoạn, 66 cú giật, đoạn nào cũng giật ở tay phải; nốt giật vang nửa trường độ ghi; bản bỏ giật vang đủ', () => {
    expect(GIAT_CA_PHAO.bai).toHaveLength(9)
    expect(GIAT_CA_PHAO.bai.reduce((sum, one) => sum + one.soCuGiat, 0)).toBe(66)
    for (const doan of GIAT_CA_PHAO.bai) {
      expect(doan.giatPhai).toBeGreaterThan(0)
      for (const event of doan.events.filter((one) => one.giat)) expect(event.durationBeats * 2).toBeCloseTo(event.ghiBeats!)
      expect(boGiat(doan.events).some((event) => event.giat)).toBe(false)
    }
  })
})

describe('Linh Nhi — câu chạy tay trái (Lá Thư Trần Thế)', () => {
  it('đoạn nào cũng có ≥ 3 tiếng tay trái ngay trước vạch giữa đoạn và một tiếng tay trái đáp ở vạch', () => {
    expect(CHAY_TRAI_LINH_NHI.bai.length).toBeGreaterThanOrEqual(5)
    for (const doan of CHAY_TRAI_LINH_NHI.bai) {
      const vach = doan.doDai / 2
      const trai = doan.events.filter((event) => event.hand === 'left')
      expect(trai.filter((event) => event.startBeat >= vach - 2 - 1e-6 && event.startBeat < vach - 1e-6).length).toBeGreaterThanOrEqual(3)
      expect(trai.some((event) => event.startBeat >= vach - 1e-6 && event.startBeat <= vach + 0.5 + 1e-6)).toBe(true)
    }
  })
})

describe('Blues — lick bè 3/6 (Rockhouse)', () => {
  it('đoạn nào cũng có ≥ 2 cú tay phải là bè quãng 3/6', () => {
    expect(LICK_BE_BLUES.bai.length).toBeGreaterThanOrEqual(5)
    for (const doan of LICK_BE_BLUES.bai) {
      const be = doan.events.filter(
        (event) => event.hand === 'right' && event.notes.length === 2 && [3, 4, 8, 9].includes(event.notes[1]! - event.notes[0]!),
      )
      expect(be.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('chamKyThuat — thang 4 bậc', () => {
  const nhac = { giatTong: 8, giatDung: 6, nganTong: 4, nganDung: 3 }
  it('đánh giật: đủ năm cột; cột giật phải có nốt để chấm', () => {
    const bac1 = GIAT_CA_PHAO.bac[0]!
    expect(chamKyThuat(bac1, score(17, 20, 50), nhac).dat).toBe(true)
    expect(chamKyThuat(bac1, score(17, 20, 50), { ...nhac, giatDung: 5 }).dat).toBe(false)
    expect(chamKyThuat(bac1, score(17, 20, 50), { ...nhac, giatTong: 0, giatDung: 0 }).dat).toBe(false)
    expect(chamKyThuat(bac1, score(17, 20, 50), { ...nhac, nganTong: 0, nganDung: 0 }).dat).toBe(true)
    expect(chamKyThuat(bac1, score(17, 20, 70), nhac).dat).toBe(false)
  })

  it('kỹ thuật không giật: chỉ ba cột, không cần chấm nhấc phím', () => {
    const bac1 = CHAY_TRAI_LINH_NHI.bac[0]!
    expect(bac1.tay).toBe('left')
    expect(chamKyThuat(bac1, score(17, 20, 50), null).dat).toBe(true)
    expect(chamKyThuat(bac1, score(16, 20, 50), null).dat).toBe(false)
    expect(chamKyThuat(bac1, score(17, 20, 50), null).tomTat).not.toContain('giật')
    expect(LICK_BE_BLUES.bac[0]!.tay).toBe('right')
  })

  it('qua bậc trước mới mở bậc sau; mỗi kỹ thuật, mỗi đoạn một khoá riêng', () => {
    const doan = CHAY_TRAI_LINH_NHI.bai[0]!.id
    const luot = (bac: number, dat: boolean, styleId = khoaKyThuat(CHAY_TRAI_LINH_NHI, doan)): LuotTap => ({
      timestamp: 0,
      day: '2026-10-03',
      styleId,
      bac,
      dat,
      soDo: {},
    })
    expect(khoaKyThuat(GIAT_CA_PHAO, 'o96')).toBe('giat-cp:o96')
    expect(trangThaiKyThuat([], CHAY_TRAI_LINH_NHI, doan)).toEqual(['mo', 'khoa', 'khoa', 'khoa'])
    expect(trangThaiKyThuat([luot(1, true), luot(2, false)], CHAY_TRAI_LINH_NHI, doan)).toEqual(['qua', 'mo', 'khoa', 'khoa'])
    expect(trangThaiKyThuat([luot(1, true, `giat-cp:${doan}`)], CHAY_TRAI_LINH_NHI, doan)).toEqual(['mo', 'khoa', 'khoa', 'khoa'])
  })
})

describe('Luyến láy — Linh Nhi (Biển Tình) · Blues (Boogie, Rockhouse)', () => {
  const coLay = (events: readonly { grace?: boolean; hand: string; notes: number[] }[]) =>
    events.some(
      (event) =>
        event.grace ||
        (event.hand === 'right' && [...event.notes].sort((a, b) => a - b).some((note, i, all) => i > 0 && note - all[i - 1]! === 1)),
    )

  it('đoạn nào cũng có nốt láy để chấm; chấm láy bật, chấm nhấc phím tắt', () => {
    for (const kt of [LAY_LINH_NHI, LAY_BLUES]) {
      expect(kt.chamLay).toBe(true)
      expect(kt.chamNhac).toBe(false)
      expect(kt.bai.length).toBeGreaterThanOrEqual(5)
      for (const doan of kt.bai) expect(coLay(doan.events)).toBe(true)
    }
  })

  it('Linh Nhi: đoạn nào cũng có ít nhất một nốt láy quãng 3 thứ dưới nốt chính', () => {
    for (const doan of LAY_LINH_NHI.bai) {
      const that = doan.events.filter((event) => !event.grace && event.hand === 'right')
      const q3 = doan.events.filter((event) => {
        if (!event.grace) return false
        const chinh = that.find((one) => one.startBeat >= event.startBeat - 1e-6)
        return chinh !== undefined && Math.max(...chinh.notes) - event.notes[0]! === 3
      })
      expect(q3.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('Blues: đoạn Boogie chạy ♩ 140 như nút Twist, đoạn Rockhouse theo sheet', () => {
    for (const doan of LAY_BLUES.bai) expect(doan.bpm ?? LAY_BLUES.bpm).toBe(doan.id.startsWith('boogie') ? 140 : 88)
  })

  it('cột láy: thiếu nốt láy hay láy dưới ngưỡng là chưa đạt', () => {
    const bac1 = LAY_LINH_NHI.bac[0]!
    expect(chamKyThuat(bac1, score(17, 20, 50), null, { layTong: 10, layDung: 7, phimLay: [] }).dat).toBe(true)
    expect(chamKyThuat(bac1, score(17, 20, 50), null, { layTong: 10, layDung: 6, phimLay: [] }).dat).toBe(false)
    expect(chamKyThuat(bac1, score(17, 20, 50), null, null).dat).toBe(false)
  })
})
