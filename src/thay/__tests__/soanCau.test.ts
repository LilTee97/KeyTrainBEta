import { describe, expect, it } from 'vitest'
import type { LuotTap } from '../../shared/persistence/db'
import {
  bacMoSolo,
  bacThay,
  buocSolo,
  chuyenThay,
  duLieuSoanCau,
  dungHopAm,
  khacLyThuyet,
  lyThuyetBac,
  N_TOI_THIEU,
  oDem,
  phanBoNot,
  tenBac,
  tenNotBac,
  vongCuaThay,
  vongLyThuyet,
  xepNot,
} from '../soanCau/soanCau'

const ln = duLieuSoanCau('linh-nhi')!
const LA = 9

describe('Học cách soạn câu — lý thuyết piano', () => {
  it('hợp âm bậc 1 quyết định cả bảng: hợp âm ba · hợp âm bảy · bộ màu chuẩn', () => {
    expect(lyThuyetBac(0, false, '').dong.map((d) => d.hopAm)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
    expect(lyThuyetBac(0, false, 'maj7').dong.map((d) => d.hopAm)).toEqual(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'])
    const add9 = lyThuyetBac(0, false, 'add9')
    expect(add9.dong.map((d) => d.hopAm)).toEqual(['Cadd2', 'Dm7', 'Em7', 'Fadd2', 'G9sus4', 'Am7', 'Bm7b5'])
    expect(add9.moTa).toContain('Pop ballad')
  })

  it('giọng thứ: gam thứ tự nhiên, thêm V của gam thứ hòa âm; số La Mã ghi như cột thầy', () => {
    expect(lyThuyetBac(LA, true, 'm').dong.map((d) => d.hopAm)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'E', 'F', 'G'])
    expect(lyThuyetBac(LA, true, 'm').dong.map((d) => d.laMa)).toEqual(['i', 'ii°', '♭III', 'iv', 'v', 'V', '♭VI', '♭VII'])
    expect(lyThuyetBac(LA, true, 'm7').dong.map((d) => d.laMa)).toEqual(['i7', 'iiø7', '♭IIImaj7', 'iv7', 'v7', 'V7', '♭VImaj7', '♭VII7'])
    expect(lyThuyetBac(0, false, '').dong.map((d) => d.laMa)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    expect(lyThuyetBac(LA, true, 'm7').dong.map((d) => d.hopAm)).toContain('E7')
  })

  it('11 vòng lý thuyết dựng đúng giọng', () => {
    const truong = vongLyThuyet(0, false, false)
    expect(truong.find((v) => v.id === 'I-V-vi-IV')!.hopAm).toEqual(['C', 'G', 'Am', 'F'])
    expect(vongLyThuyet(LA, true, false).find((v) => v.id === 'i-iv-V')!.hopAm).toEqual(['Am', 'Dm', 'E7'])
    expect(truong.length + vongLyThuyet(LA, true, false).length).toBe(11)
  })
})

describe('Học cách soạn câu — Linh Nhi: phong cách đặt hợp âm (số đo md 13d)', () => {
  it('số đo khớp md: thứ i 101 đoạn (trơn 41), ♭VI 46 (có maj7 21); bậc 1 bài bị loại', () => {
    const thu = bacThay(ln, LA, true)
    expect(thu[0]).toMatchObject({ laMa: 'i', hopAm: 'Am', n: 101, bai: 5, tron: 41 })
    expect(thu.find((d) => d.laMa === '♭VI')).toMatchObject({ hopAm: 'F', n: 46, mau: expect.arrayContaining([['7 (maj7)', 21]]) })
    expect(thu.every((d) => d.bai >= 2 && d.n >= 5)).toBe(true)
    expect(thu.find((d) => d.laMa === 'iii°')!.nghi).toContain('chưa kiểm tay')
  })

  it('khác lý thuyết: thứ — V trưởng có ♭7, I trưởng; trưởng — II7; bậc nghi ngờ không vào', () => {
    const thu = khacLyThuyet(ln, LA, true)
    expect(thu.some((s) => s.includes('V (E) 24 đoạn') && s.includes('♭7 17/24'))).toBe(true)
    expect(thu.some((s) => s.includes('I (A) 10 đoạn'))).toBe(true)
    expect(thu.some((s) => s.includes('iii°'))).toBe(false)
    expect(khacLyThuyet(ln, 0, false).some((s) => s.includes('II (D) 10 đoạn') && s.includes('♭7 10/10'))).toBe(true)
  })

  it('bước chuyển hay gặp, chỉ bước có ở ≥ 2 bài', () => {
    const chuyen = chuyenThay(ln, LA, true)
    expect(chuyen[0]).toEqual({ tu: 'i (Am)', den: '♭VI (F)', n: 20, bai: 4 })
    expect(chuyen.every((c) => c.bai >= 2)).toBe(true)
  })

  it('vòng thật từ sheet: 4 ô, ≥ 3 hợp âm khác nhau', () => {
    const thu = vongCuaThay(ln, LA, true)
    expect(thu.find((v) => v.ten === 'Một Cõi Đi Về · dạo ô 1–4')!.hopAm).toEqual(['Am', 'Dm', 'F', 'E7'])
    for (const v of [...thu, ...vongCuaThay(ln, 0, false)]) {
      expect(v.hopAm).toHaveLength(4)
      expect(new Set(v.hopAm).size).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('Học cách soạn câu — Linh Nhi: chọn nốt bám sheet', () => {
  it('ngữ cảnh ít số đo thì gộp và nói rõ; không bao giờ dưới ngưỡng', () => {
    const m = phanBoNot(ln, 'slow rock', true, 'm', 'ca')
    expect([m.n, m.gop]).toEqual([109, false])
    const dim = phanBoNot(ln, 'slow rock', true, 'dim', 'ca')
    expect(dim.gop).toBe(true)
    expect(dim.moTa).toContain('gộp mọi điệu giọng thứ')
    const maj7 = phanBoNot(ln, 'slow rock', true, 'maj7', 'ca')
    expect(maj7.moTa).toContain('gộp thay cho hợp âm maj7')
    for (const p of [m, dim, maj7]) expect(p.n).toBeGreaterThanOrEqual(N_TOI_THIEU)
  })

  it('xếp nốt: "hay dùng" gộp tới ~70 %, rồi "có dùng", rồi "chưa gặp"', () => {
    const xep = xepNot(phanBoNot(ln, 'slow rock', true, 'm', 'ca'))
    const hay = xep.filter((x) => x.muc === 'hay')
    expect(hay.reduce((s, x) => s + x.phanTram, 0)).toBeGreaterThanOrEqual(0.7)
    expect(hay.slice(0, -1).reduce((s, x) => s + x.phanTram, 0)).toBeLessThan(0.7)
    expect(xep.filter((x) => x.muc === 'chua').every((x) => x.dem === 0)).toBe(true)
  })

  it('tên bậc: nốt của hợp âm gọi theo hợp âm, nốt ngoài gọi theo nốt căng', () => {
    expect([tenBac(3, 'm'), tenBac(2, 'm'), tenBac(10, '7'), tenBac(6, 'dim'), tenBac(5, '')]).toEqual(['♭3', '9', '♭7', '♭5', '11'])
    // La thứ viết dấu thăng, nhưng tên nốt gọi theo chữ của bậc: ♭9 của Rê là Mi♭, 11 của Fa là Si♭, ♯11 của Fa là Si.
    expect([tenNotBac(2, 1, 'm', LA, true), tenNotBac(2, 10, 'm', LA, true), tenNotBac(5, 6, '', LA, true), tenNotBac(2, 7, 'm', LA, true)]).toEqual(['Eb', 'C', 'B', 'A'])
    expect([tenNotBac(5, 5, '', LA, true), tenNotBac(4, 8, '7', LA, true), tenNotBac(0, 3, '', 0, false), tenNotBac(4, 4, '7', LA, true)]).toEqual(['Bb', 'C', 'D#', 'G#'])
  })

  it('tập nốt được nhận theo bậc: bậc 1–2 ba nốt chị dùng nhiều nhất, có gợi ý; bậc 3 nhóm hay dùng, tắt gợi ý', () => {
    const vong = ln.vong.find((v) => v.ten === 'Một Cõi Đi Về · dạo ô 1–4')!
    const b1 = buocSolo(ln, vong, LA, 1)
    expect(b1).toHaveLength(1)
    expect(b1[0]).toMatchObject({ hopAm: 'Am', goiY: true, can: 3 })
    expect(b1[0]!.nhan).toHaveLength(3)
    expect(buocSolo(ln, vong, LA, 2).map((b) => b.hopAm)).toEqual(['Am', 'Dm'])
    const b3 = buocSolo(ln, vong, LA, 3)
    expect(b3.map((b) => b.hopAm)).toEqual(['Am', 'Dm', 'F', 'E7'])
    expect(b3.every((b) => !b.goiY && b.can === 2 && b.nhan.length >= 2)).toBe(true)
  })
})

describe('Học cách soạn câu — quiz và thang bậc', () => {
  it('bấm đúng hợp âm: đủ tên nốt, không thừa, bỏ quãng tám', () => {
    expect(dungHopAm([57, 60, 64], [9, 0, 4])).toBe(true)
    expect(dungHopAm([45, 60, 64, 69, 76], [9, 0, 4])).toBe(true)
    expect(dungHopAm([57, 60, 64, 67], [9, 0, 4])).toBe(false)
    expect(dungHopAm([57, 60], [9, 0, 4])).toBe(false)
  })

  it('ô đệm: phach là SỐ phách mỗi hợp âm — ô k bắt đầu ở tổng các ô trước, dời về 0, không ô nào rỗng', () => {
    const su = (startBeat: number, notes: number[]) => ({ notes, startBeat, durationBeats: 0.5, hand: 'left' as const, velocity: 80 })
    const vong = { phach: [6, 6, 6, 6], doDai: 24, timeline: [0, 3, 6, 9, 12, 18, 23.5].map((b) => su(b, [40 + b])) }
    expect(oDem(vong, 0)).toEqual({ su: [0, 3].map((b) => ({ notes: [40 + b], startBeat: b, durationBeats: 0.5, velocity: 80 })), dai: 6 })
    expect(oDem(vong, 1).su.map((e) => e.startBeat)).toEqual([0, 3])
    expect(oDem(vong, 3).su.map((e) => [e.startBeat, e.notes[0]])).toEqual([[0, 58], [5.5, 63.5]])
    for (const k of [0, 1, 2, 3]) expect(oDem(vong, k).su.length).toBeGreaterThan(0)
  })

  it('qua bậc trước mới mở bậc sau', () => {
    const luot = (bac: number, dat: boolean): LuotTap => ({ timestamp: 0, day: '2026-10-04', styleId: 'soan-cau:linh-nhi:x', bac, dat, soDo: {} })
    expect(bacMoSolo([], 'soan-cau:linh-nhi:x').mo).toBe(1)
    expect(bacMoSolo([luot(1, true)], 'soan-cau:linh-nhi:x').mo).toBe(2)
    expect(bacMoSolo([luot(1, true), luot(2, false)], 'soan-cau:linh-nhi:x').mo).toBe(2)
    expect(bacMoSolo([luot(1, true), luot(2, true)], 'soan-cau:linh-nhi:x').mo).toBe(3)
    expect(bacMoSolo([luot(1, true)], 'soan-cau:linh-nhi:y').mo).toBe(1)
  })
})
