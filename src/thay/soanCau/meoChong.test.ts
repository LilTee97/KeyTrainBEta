import { describe, expect, it } from 'vitest'
import { BA, CONG_THUC, khungTrai, tenTren } from './chongHopAm'
import { demPhim, meoCua, meoTheoKhung, MEO_VANG } from './meoChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const tim = (cach: number, loai: string) =>
  CONG_THUC.filter((c) => !('iv' in c.tren) && c.tren.cach === cach && c.tren.loai === loai).map((c) => `${c.id}@${khungTrai(c)}`)
const lop = (goc: number, iv: readonly number[]) => [...new Set(iv.map((x) => (goc + x) % 12))].sort((a, b) => a - b)

describe('mẹo chồng hợp âm của gia sư', () => {
  it('đếm phím từ gốc', () => {
    expect([2, 3, 4, 6, 7, 8, 9, 10, 11].map(demPhim)).toEqual([
      'lên 2 phím',
      'lên 3 phím',
      'lên 4 phím',
      'cách 6 phím (nửa quãng tám)',
      'lên 7 phím (hay lùi 5)',
      'lùi 4 phím',
      'lùi 3 phím',
      'lùi 2 phím',
      'lùi 1 phím',
    ])
  })

  it('mọi công thức có mẹo, câu móc gọi đúng tên tay phải ở gốc Đô', () => {
    for (const c of CONG_THUC) {
      const m = meoCua(c)
      expect(m.length).toBeGreaterThan(10)
      if (!('iv' in c.tren)) expect(m).toContain(tenTren(c, 'C', 'flat'))
    }
    expect(meoCua(ct('13b9'))).toBe('lùi 3 phím · hợp âm trưởng — A trên C7 — cùng chỗ với C13 nhưng TRƯỞNG: Đô thành Đô♯ là thêm ♭9')
    expect(meoTheoKhung().flatMap((k) => k.ds.map((d) => d.ct.id)).sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
  })

  it('bảy mẹo vàng đúng với công thức thật', () => {
    expect(MEO_VANG).toHaveLength(7)
    expect(tim(9, 'm').sort()).toEqual(['13@khung7', '6@goc5']) // mẹo 2
    expect(tim(3, 'M')).toEqual(['m7@goc']) // mẹo 3
    expect([tim(9, 'm'), tim(9, 'M')].map((x) => x.filter((y) => y.endsWith('khung7')))).toEqual([['13@khung7'], ['13b9@khung7']]) // mẹo 4
    expect(tim(7, 'M')).toEqual(['maj9@ba']) // mẹo 5
    expect(tim(7, 'm').sort()).toEqual(['9@khung7', 'm9@ba'])
    expect(tim(10, 'M').sort()).toEqual(['9sus4@goc', 'm11@ba']) // mẹo 6
    // mẹo 7: A♭+ cùng nốt C+; Edim7 cùng nốt C♯dim7
    expect(lop(8, BA.aug.iv)).toEqual(lop(0, BA.aug.iv))
    expect(lop(4, BA.dim7.iv)).toEqual(lop(1, BA.dim7.iv))
    expect([tim(8, 'aug'), tim(4, 'dim7')]).toEqual([['7b13@khung7'], ['7b9@goc']])
  })
})
