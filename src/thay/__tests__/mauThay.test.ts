import { describe, expect, it } from 'vitest'
import { chamThay, chonCauThay, MAN_THAY, taoCauThay } from '../hocSolo/mauThay'

describe('Game nốt rơi — màn thầy', () => {
  it('sáu màn (3 thầy × 2 giọng); mỗi màn ≥ 2 hợp âm có số đo; mọi hợp âm × 12 chủ âm: ≥ 3 nốt chính có gốc, chính và tránh không chung nốt', () => {
    expect(MAN_THAY.length).toBe(6)
    MAN_THAY.forEach((m, mi) => {
      expect(m.hop.length, m.ten).toBeGreaterThanOrEqual(2)
      m.hop.forEach((_, j) => {
        for (let t = 0; t < 12; t++) {
          const c = taoCauThay(mi, j, t)
          expect(c.chinh.length, `${m.ten} ${c.ten}`).toBeGreaterThanOrEqual(3)
          expect(c.chinh).toContain(c.g)
          expect(c.chinh.some((p) => c.tranh.includes(p)), `${m.ten} ${c.ten}`).toBe(false)
          expect(c.goiY).toMatch(/nốt chính của /)
        }
      })
    })
  })
  it('Cà Pháo trên Đô (I, giọng Đô trưởng): chính Đô Rê Mi Sol La Si (3 · 5 · 9 · 7 · 1 · 13 từ 10 %); Fa 5 % chỉ mờ; nốt đen ngoài gam là không màu', () => {
    const mi = MAN_THAY.findIndex((m) => m.thay === 'ca-phao' && !m.thu)
    const c = taoCauThay(mi, MAN_THAY[mi]!.hop.findIndex((h) => h.laMa === 'I'), 0)
    expect([...c.chinh].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9, 11])
    expect(c.tranh).not.toContain(5)
    expect([...c.tranh].sort((a, b) => a - b)).toEqual([1, 3, 6, 8, 10])
  })
  it('Linh Nhi trên Đô (I, giọng trưởng): chính chỉ ba nốt trụ; Fa (tránh, không số đo) là không màu', () => {
    const mi = MAN_THAY.findIndex((m) => m.thay === 'linh-nhi' && !m.thu)
    const c = taoCauThay(mi, 0, 0)
    expect([...c.chinh].sort((a, b) => a - b)).toEqual([0, 4, 7])
    expect(c.tranh).toContain(5)
  })
  it('chấm: nốt không màu sai, nốt mờ không tính, đủ nốt chính là đúng', () => {
    const mi = MAN_THAY.findIndex((m) => m.thay === 'ca-phao' && !m.thu)
    const c = taoCauThay(mi, 0, 0)
    expect(chamThay(c, 61, []).kq).toBe('sai')
    expect(chamThay(c, 65, []).kq).toBe('mo')
    expect(chamThay(c, 60, []).kq).toBe('tiep')
    expect(chamThay(c, 71, [60, 62, 64, 67, 69]).kq).toBe('dung')
  })
  it('chọn câu: không lặp hợp âm vừa rồi, chủ âm trong tập cho phép', () => {
    let r = 3
    const rand = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646
    let truoc: string | null = null
    for (let k = 0; k < 200; k++) {
      const c = chonCauThay(0, [0, 7], new Map(), truoc, rand)
      expect(c.id).not.toBe(truoc)
      truoc = c.id
    }
  })
})
