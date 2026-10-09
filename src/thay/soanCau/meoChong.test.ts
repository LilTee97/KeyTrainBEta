import { describe, expect, it } from 'vitest'
import { BA, CONG_THUC, tenTren } from './chongHopAm'
import { bacCua, bangTheoLoai, demPhim, HO_LOAI, LUAT_SO, meoCua, MEO_VANG } from './meoChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const lop = (goc: number, iv: readonly number[]) => [...new Set(iv.map((x) => (goc + x) % 12))].sort((a, b) => a - b)

describe('quy luật và mẹo theo loại hợp âm', () => {
  it('năm họ chia hết 26 loại, không trùng', () => {
    const ids = HO_LOAI.flatMap((h) => h.ids)
    expect(ids.length).toBe(26)
    expect([...ids].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(bangTheoLoai().flatMap((h) => h.dong).length).toBe(26)
  })

  it('bậc hai tay đúng nốt — vd 13♭9: tay trái 1 · 3 · ♭7, tay phải 13 · ♭9 · 3', () => {
    expect(bacCua(ct('13b9'))).toEqual({ trai: ['1', '3', '♭7'], phai: ['13', '♭9', '3'], caHai: ['1', '3', '♭7', '♭9', '13'] })
    expect(bacCua(ct('m11b5')).phai).toEqual(['♭3', '11', '♭7'])
    expect(bacCua(ct('dim7')).caHai).toEqual(['1', '♭3', '♭5', '𝄫7'])
  })

  it('quy luật con số đúng với mọi loại được nêu', () => {
    for (const l of LUAT_SO) l.ids.forEach((id, k) => expect([id, bacCua(ct(id)).phai]).toEqual([id, [...l.phai[k]!]]))
  })

  it('mọi loại có mẹo; câu mẹo gọi đúng tên tay phải ở gốc Đô', () => {
    for (const c of CONG_THUC) {
      const m = meoCua(c)
      expect(m.length).toBeGreaterThan(15)
      if (!('iv' in c.tren)) expect(m).toContain(tenTren(c, 'C', 'flat'))
    }
    expect(meoCua(ct('13b9'))).toBe('khung C7 + A TRƯỞNG: như C13 (Am) nhưng Đô → Đô♯ là thêm ♭9 (lùi 3 phím · hợp âm trưởng)')
    expect(demPhim(9)).toBe('lùi 3 phím')
  })

  it('mẹo vàng đúng với công thức thật', () => {
    expect(MEO_VANG).toHaveLength(6)
    const tren = (id: string) => ct(id).tren as { loai: keyof typeof BA; cach: number }
    // mẹo 2: chất tay phải của loại 7
    expect(['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'].map((id) => BA[tren(id).loai].ten)).toEqual(['thứ', 'giảm', 'trưởng', 'thứ', 'giảm', 'tăng'])
    // mẹo 3: cùng chỗ, đổi chất
    expect(['maj7', '7', 'm7', 'm7b5'].map((id) => tren(id).cach)).toEqual([4, 4, 3, 3])
    // mẹo 4: hợp âm 9 — tay phải là hợp âm bậc V của gốc
    expect(['maj9', 'm9', '9'].map((id) => tenTren(ct(id), 'C', 'flat'))).toEqual(['G', 'Gm', 'Gm'])
    // mẹo 5: nốt căng = đổi một nốt
    expect([tenTren(ct('13'), 'C', 'flat'), tenTren(ct('13b9'), 'C', 'flat')]).toEqual(['Am', 'A'])
    // mẹo 6: tăng và bảy giảm nhiều tên cùng nốt
    expect(lop(8, BA.aug.iv)).toEqual(lop(0, BA.aug.iv))
    expect(lop(4, BA.dim7.iv)).toEqual(lop(1, BA.dim7.iv))
  })
})
