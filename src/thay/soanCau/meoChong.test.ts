import { describe, expect, it } from 'vitest'
import { BA, CONG_THUC, tenTren } from './chongHopAm'
import {
  bacCua,
  bangCongGoc,
  bangTheoLoai,
  cachTimTayPhai,
  capGoc,
  CONG_GOC,
  congThucChung,
  demPhim,
  HO_LOAI,
  loaiCuaCach,
  LUAT_SO,
  meoCua,
  meoNgan,
  MEO_VANG,
  nhoNgan,
} from './meoChong'

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

  it('quy luật con số đúng với mọi loại được nêu — cả bậc tay phải lẫn cách cộng gốc', () => {
    for (const l of LUAT_SO)
      l.ids.forEach((id, k) => {
        const c = ct(id)
        expect([id, bacCua(c).phai, 'loai' in c.tren ? c.tren.cach : null]).toEqual([id, [...l.phai[k]!], l.cach[k]])
      })
  })

  it('mọi loại có mẹo; câu mẹo gọi đúng tên tay phải ở gốc Đô', () => {
    for (const c of CONG_THUC) {
      const m = meoCua(c)
      expect(m.length).toBeGreaterThan(15)
      if (!('iv' in c.tren)) expect(m).toContain(tenTren(c, 'C', 'flat'))
    }
    expect(meoCua(ct('13b9'))).toBe('tay trái gốc – 3 – ♭7 + tay phải trưởng trên gốc lùi 3 phím — gốc Đô: khung C7 + A — như C13 (Am) nhưng Đô lên Đô♯')
    expect(demPhim(9)).toBe('lùi 3 phím')
  })

  it('mẹo vàng đúng với công thức thật', () => {
    expect(MEO_VANG).toHaveLength(6)
    const tren = (id: string) => ct(id).tren as { loai: keyof typeof BA; cach: number }
    // mẹo 1: đuôi số → cách cộng gốc
    expect(['6', 'maj7', 'm7', 'maj9', 'm11', 'm13', '13'].map((id) => tren(id).cach)).toEqual([9, 4, 3, 7, 10, 2, 9])
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

describe('mẹo cộng gốc — gốc nào cộng gốc nào ra hợp âm tổng', () => {
  it('9 cách cộng gốc phủ đủ 23 loại tay phải là hợp âm ba, mỗi loại đúng một cách; 3 loại còn lại là chùm nốt', () => {
    const ba = CONG_THUC.filter((c) => 'loai' in c.tren)
    expect([ba.length, CONG_THUC.length - ba.length, CONG_GOC.length]).toEqual([23, 3, 9])
    expect(CONG_GOC.flatMap((c) => loaiCuaCach(c.cach).map((x) => x.id)).sort()).toEqual(ba.map((c) => c.id).sort())
    // một dạng công thức dùng cho nhiều loại — số loại mỗi cách
    expect(Object.fromEntries(CONG_GOC.map((c) => [c.ten, loaiCuaCach(c.cach).length]))).toEqual({
      'lên 4 phím': 3,
      'lên 3 phím': 5,
      'lên 7 phím': 3,
      'lùi 3 phím': 5,
      'lùi 2 phím': 2,
      'lên 2 phím': 2,
      'lùi 1 phím': 1,
      'cách 6 phím': 1,
      'lùi 4 phím': 1,
    })
  })

  it('tên cách đếm đúng chiều: lên N là N nửa cung, lùi N là 12 − N', () => {
    for (const c of CONG_GOC) {
      const [huong, so] = c.ten.split(' ')
      const n = Number(so)
      expect([c.ten, huong === 'lên' ? n : huong === 'lùi' ? 12 - n : 6]).toEqual([c.ten, c.cach])
    }
  })

  it('cách tìm tay phải ở gốc cụ thể — B6/9 trong ảnh người dùng, Dmaj9, Cm11, C13♭9♯11, chùm Badd9', () => {
    expect(cachTimTayPhai(ct('69'), 'B', 'flat')).toBe('Si lùi 3 phím = Sol♯ (cặp thứ song song B ↔ G♯m) → treo 4 trên Sol♯: G♯sus4 (Sol♯ – Đô♯ – Rê♯).')
    expect(cachTimTayPhai(ct('maj9'), 'D', 'flat')).toBe('Rê lên 7 phím = La (nốt trên cùng của D: Rê – Fa♯ – La) → trưởng trên La: A (La – Đô♯ – Mi).')
    expect(cachTimTayPhai(ct('m11'), 'C', 'flat')).toBe('Đô lùi 2 phím = Si♭ (thấp hơn gốc một cung) → trưởng trên Si♭: B♭ (Si♭ – Rê – Fa).')
    expect(cachTimTayPhai(ct('maj7'), 'E', 'flat')).toBe('Mi lên 4 phím = Sol♯ (nốt giữa của E: Mi – Sol♯ – Si) → thứ trên Sol♯: G♯m (Sol♯ – Si – Rê♯).')
    expect(cachTimTayPhai(ct('13b9#11'), 'C', 'flat')).toContain('Đô cách 6 phím = Sol♭')
    expect(cachTimTayPhai(ct('add9'), 'B', 'flat')).toBe('Tay phải là chùm nốt rời: Si lên 2 phím = Đô♯, lên 4 phím = Rê♯, lên 7 phím = Fa♯ — bấm sát nhau Đô♯ – Rê♯ – Fa♯.')
  })

  it('công thức chung, dòng ngắn trên viên, nhắc sau khi đúng', () => {
    expect(congThucChung(ct('69'))).toBe('tay trái gốc – 5 + tay phải treo 4 trên gốc lùi 3 phím')
    expect([meoNgan(ct('69')), meoNgan(ct('maj9')), meoNgan(ct('add9'))]).toEqual(['+ treo 4 · lùi 3 phím', '+ trưởng · lên 7 phím', '+ chùm 2 · 4 · 7 phím'])
    expect(nhoNgan(ct('69'), 'B', 'flat')).toBe('Si lùi 3 phím → G♯sus4')
  })

  it('bảng cặp gốc ghi đúng chữ ở mọi gốc', () => {
    expect(capGoc(9, [0, 11, 3, 6])).toEqual(['C→A', 'B→G♯', 'E♭→C', 'F♯→D♯'])
    expect(capGoc(7, [0, 2, 6])).toEqual(['C→G', 'D→A', 'F♯→C♯'])
    expect(capGoc(10, [0, 2, 4])).toEqual(['C→B♭', 'D→C', 'E→D'])
  })

  it('bảng cộng gốc của một màn: gom theo chất tay phải, chùm để riêng', () => {
    const b = bangCongGoc(['6', '69', '13', '13b9', 'm6', 'maj7', 'add9'])
    expect(b.dong.map((d) => d.ten)).toEqual(['lên 4 phím', 'lùi 3 phím'])
    expect(b.dong[1]!.theoChat).toEqual([
      { chat: 'thứ', loai: ['6 (tay trái gốc – 5)', '13 (tay trái gốc – 3 – ♭7)'] },
      { chat: 'treo 4', loai: ['6/9 (tay trái gốc – 5)'] },
      { chat: 'giảm', loai: ['m6 (tay trái gốc – 5)'] },
      { chat: 'trưởng', loai: ['13♭9 (tay trái gốc – 3 – ♭7)'] },
    ])
    expect(b.chum).toEqual(['add9 = tay trái gốc – 5 + chùm nốt 2 · 4 · 7 phím trên gốc'])
  })
})
