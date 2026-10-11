import { describe, expect, it } from 'vitest'
import { giangHop, hopAmHoc, MEO_SOLO, notTrenHop, phanBo, THAY_HOC, vaiNot, type HopHoc } from '../hocSolo/chonNot'
import { baiArp, baiGam, baiNamNgon, baiTapNgon, cauScale, chamNgon, GAM, ngonArp, ngonGam, notDung } from '../hocSolo/gamNgon'

const den = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12)

describe('Ngón chạy gam — ngón chuẩn sách piano', () => {
  it('gam Đô trưởng tay phải khớp kho PianoBrain: lên 1 2 3 1 2 3 4 5, xuống 5 4 3 2 1 3 2 1', () => {
    const b = baiGam('truong', 0, 'phai')
    expect(b.ngon).toEqual([1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1])
    expect(b.notes).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60])
  })
  it('12 gốc × trưởng · thứ · thứ hòa thanh × hai tay: ngón cái không bao giờ đặt lên phím đen; luồn ngón đúng kiểu', () => {
    for (const loai of ['truong', 'thu', 'thu-hoa-thanh'] as const)
      for (let g = 0; g < 12; g += 1)
        for (const tay of ['phai', 'trai'] as const) {
          const ngon = ngonGam(loai, g, tay)!
          const notes = [...GAM.find((x) => x.id === loai)!.iv, 12].map((x) => 60 + g + x)
          expect(ngon.length).toBe(8)
          notes.forEach((m, k) => {
            if (ngon[k] === 1) expect(den(m), `${loai} ${g} ${tay} nốt ${k}`).toBe(false)
          })
          for (let k = 1; k < 8; k += 1) {
            const [a, b] = [ngon[k - 1]!, ngon[k]!]
            if (tay === 'phai') expect(b === a + 1 || (b === 1 && a >= 3), `${loai} ${g} phải ${k}`).toBe(true)
            else expect(b === a - 1 || (a === 1 && b >= 3), `${loai} ${g} trái ${k}`).toBe(true)
          }
        }
  })
  it('Fa trưởng tay phải 1 2 3 4 1 2 3 4 (nốt thứ tư Si♭ là phím đen); Si♭ trưởng ngón cái trên Đô và Fa', () => {
    expect(ngonGam('truong', 5, 'phai')).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
    const ngon = ngonGam('truong', 10, 'phai')!
    const notes = [0, 2, 4, 5, 7, 9, 11, 12].map((x) => 70 + x)
    expect(notes.filter((_, k) => ngon[k] === 1).map((m) => m % 12)).toEqual([0, 5])
  })
  it('ngũ cung, blues không có ngón chuẩn; hợp âm rải chỉ gốc phím trắng (1 2 3 5 · 5 4 2 1)', () => {
    expect(ngonGam('ngu-cung-truong', 0, 'phai')).toBeNull()
    expect(ngonGam('blues', 9, 'phai')).toBeNull()
    expect(ngonArp('truong', 0, 'phai')).toEqual([1, 2, 3, 5])
    expect(ngonArp('thu', 9, 'trai')).toEqual([5, 4, 2, 1])
    expect(ngonArp('truong', 1, 'phai')).toBeNull()
  })
})

describe('Bài tập game chạy ngón', () => {
  it('năm ngón, rải hợp âm: lên rồi xuống, ngón khớp từng nốt', () => {
    const a = baiNamNgon(9, true, 'trai')
    expect(a.notes).toEqual([57, 59, 60, 62, 64, 62, 60, 59, 57])
    expect(a.ngon).toEqual([5, 4, 3, 2, 1, 2, 3, 4, 5])
    const r = baiArp('thu', 2, 'phai')!
    expect(r.notes).toEqual([62, 65, 69, 74, 69, 65, 62])
    expect(r.ngon).toEqual([1, 2, 3, 5, 3, 2, 1])
  })
  it('mỗi tay 45 bài (7 năm ngón · 12 gam trưởng · 12 gam thứ · 14 rải); nốt nào cũng có ngón', () => {
    for (const tay of ['phai', 'trai'] as const) {
      const ds = baiTapNgon(tay)
      expect(ds.length).toBe(45)
      expect(new Set(ds.map((b) => b.id)).size).toBe(45)
      for (const b of ds) expect(b.ngon.length).toBe(b.notes.length)
    }
  })
  it('chấm: đều và đủ nhanh 3★; lệch nhịp hay sai nốt thì ít sao', () => {
    const deu = Array.from({ length: 15 }, (_, k) => 1000 + k * 250)
    expect(chamNgon(deu, 0, 4).sao).toBe(3)
    expect(chamNgon(deu, 0, 5).sao).toBe(2)
    expect(chamNgon(deu, 0, 6).sao).toBe(1)
    const lech = deu.map((t, k) => t + (k % 2 ? 120 : 0))
    expect(chamNgon(lech, 0, 4).sao).toBeLessThan(3)
    expect(chamNgon(deu, 3, 4).sao).toBe(1)
    expect(chamNgon(deu, 5, 4).sao).toBe(0)
    expect(chamNgon(deu, 0, 4).chinhXac).toBe(1)
  })
})

describe('Game Scale — nốt đúng kế tiếp', () => {
  it('nốt đầu là gốc ở quãng tám nào cũng được; sau đó đúng nốt kế đi lên', () => {
    const c = cauScale('truong', 2)
    expect(c.ten).toBe('Gam trưởng Rê')
    expect(c.iv).toEqual([0, 2, 4, 5, 7, 9, 11, 12])
    expect(notDung(c, [], 74)).toBe(true)
    expect(notDung(c, [], 64)).toBe(false)
    expect(notDung(c, [74], 76)).toBe(true)
    expect(notDung(c, [74], 64)).toBe(false)
    expect(notDung(c, [74, 76], 78)).toBe(true)
    expect(notDung(c, [74, 76], 77)).toBe(false)
  })
  it('gam blues La: 1 ♭3 4 ♭5 5 ♭7 8; rải Đô thứ', () => {
    expect(cauScale('blues', 9).iv).toEqual([0, 3, 5, 6, 7, 10, 12])
    expect(cauScale('arp-thu', 0).ten).toBe('Rải hợp âm Đô thứ')
  })
})

describe('Chọn nốt theo thầy', () => {
  const C = (thu: boolean, goc: number, thay: 'gia-su' | 'ca-phao' | 'linh-nhi' | 'blues' = 'gia-su') =>
    hopAmHoc(thay, thu).find((x) => x.goc === goc)!
  it('Đô trưởng, hợp âm C: Mi khung, Rê · La · Si màu, Fa tránh (đứng sát trên Mi)', () => {
    const hop = C(false, 0)
    expect(vaiNot(4, hop, false, 'gia-su')).toBe('khung')
    expect([2, 9, 11].map((iv) => vaiNot(iv, hop, false, 'gia-su'))).toEqual(['mau', 'mau', 'mau'])
    expect(vaiNot(5, hop, false, 'gia-su')).toBe('tranh')
    expect(vaiNot(1, hop, false, 'gia-su')).toBe('ngoai')
  })
  it('G7 ở Đô trưởng: Đô là nốt nhà; E7 ở La thứ: Sol♯ khung, Fa (♭9) · Đô (♭13) màu, Sol ngoài gam', () => {
    expect(vaiNot(5, C(false, 7), false, 'gia-su')).toBe('nha')
    const e7 = C(true, 7)
    expect(vaiNot(4, e7, true, 'gia-su')).toBe('khung')
    expect(vaiNot(1, e7, true, 'gia-su')).toBe('mau')
    expect(vaiNot(8, e7, true, 'gia-su')).toBe('mau')
    expect(vaiNot(3, e7, true, 'gia-su')).toBe('ngoai')
  })
  it('Blues Đô: trên F7 bỏ Mi (tránh), Mi♭ là khung (♭7 của F7); trên C7 Mi♭ là nốt blue', () => {
    const f7 = C(false, 5, 'blues')
    expect(vaiNot(11, f7, false, 'blues')).toBe('tranh')
    expect(vaiNot(10, f7, false, 'blues')).toBe('khung')
    expect(vaiNot(3, C(false, 0, 'blues'), false, 'blues')).toBe('blue')
  })
  it('phân bố Blues đổi từ chủ âm sang gốc hợp âm: trên F7, Mi♭ (♭3 của chủ) 15 %', () => {
    expect(phanBo('blues', C(false, 5, 'blues'), false)!.pct[10]).toBe(15)
    expect(notTrenHop('ca-phao', C(false, 0, 'ca-phao'), false)[2]!.pct).toBe(15)
    expect(phanBo('gia-su', C(false, 0), false)).toBeNull()
    expect(phanBo('linh-nhi', C(false, 11, 'linh-nhi'), false)).toBeNull()
  })
  it('lời gia sư cho mọi thầy × mọi hợp âm × hai giọng × bốn chủ âm: có tên hợp âm, ký hiệu đẹp', () => {
    for (const t of THAY_HOC)
      for (const thu of [false, true])
        for (const tonic of [0, 2, 5, 9])
          for (const hop of hopAmHoc(t.id, thu) as HopHoc[]) {
            const g = giangHop(t.id, hop, tonic, thu)
            expect(g.length, `${t.id} ${thu} ${hop.laMa}`).toBeGreaterThan(80)
            expect(g).not.toMatch(/#|\db\d|\bb\d/)
          }
    expect(MEO_SOLO.length).toBeGreaterThanOrEqual(15)
    for (const m of MEO_SOLO) expect(m.coSo.length).toBeGreaterThan(20)
  })
})
