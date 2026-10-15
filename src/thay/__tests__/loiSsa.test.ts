import { describe, expect, it } from 'vitest'
import { LOAI_KHUNG } from '../hocSolo/khungNot'
import { chamSsa, CHIA_TAY, CHONG, chonCauSsa, DINH, MAN_SSA, mauSsa, SO_NOT_CHAY, taoCauSsa, xongChong, type KetQuaSsa } from '../hocSolo/loiSsa'

const pc = (x: number) => ((x % 12) + 12) % 12

/** Bấm lần lượt `ds` trên viên `c`, trả kết quả cuối và chuỗi nốt đã nhận. */
function bam(c: ReturnType<typeof taoCauSsa>, ds: readonly number[]) {
  let daChay: number[] = []
  let r: KetQuaSsa = { kq: 'tiep', daChay }
  for (const m of ds) {
    r = chamSsa(c, daChay, m)
    if (r.kq === 'tiep') daChay = r.daChay
  }
  return { r, daChay }
}

describe('Mưa khung nốt · lối SSA', () => {
  it('thế chồng là hợp âm ba anh dựng trên một bậc của bass', () => {
    expect(taoCauSsa('maj7', 0).khungTen).toBe('C + Em')
    expect(taoCauSsa('maj9', 0).khungTen).toBe('C + Em7')
    expect(taoCauSsa('m7', 2).khungTen).toBe('D + F')
    expect(taoCauSsa('m9', 2).khungTen).toBe('D + Fmaj7')
    expect(taoCauSsa('9sus4', 7).khungTen).toBe('G + F')
    expect(taoCauSsa('13sus4', 7).khungTen).toBe('G + Fmaj7')
    expect(taoCauSsa('m7b5', 11).khungTen).toBe('B + Dm')
    expect(taoCauSsa('maj7', 1).khungTen).toBe('C♯ + E♯m') // gốc 1 app gọi C♯ (khungLoai) — bậc 3 của C♯ là E♯
  })

  it('gợi ý khắp đàn: mọi thế đủ nốt, nằm trong tầm tay phải của anh, trải hơn một quãng tám; bass đứng trước và thấp hơn', () => {
    for (const id of Object.keys(CHONG))
      for (let g = 0; g < 12; g++) {
        const c = taoCauSsa(id, g)
        const { the, lo, chong } = c.ssa
        expect(the.length).toBeGreaterThanOrEqual(4)
        for (const t of the) {
          expect(new Set(t.map(pc))).toEqual(new Set(chong))
          expect(t[0]).toBeGreaterThanOrEqual(52)
          expect(t[0]).toBeLessThanOrEqual(71)
          expect(t[t.length - 1]! - t[0]!).toBeLessThan(12)
        }
        expect(the[the.length - 1]![0]! - the[0]![0]!).toBeGreaterThanOrEqual(12)
        expect(lo[0]).toBe(36 + g)
        expect(lo.filter((m) => pc(m) === g && m < 52).every((m) => m < the[0]![0]!)).toBe(true)
      }
  })

  it('gợi ý hai tay: tay trái bass rồi 5 – 8 dưới Mi3, tay phải thế chồng từ Mi3 — hai phần không lẫn', () => {
    for (const id of Object.keys(CHONG))
      for (let g = 0; g < 12; g++) {
        const { loTrai, lo, the } = taoCauSsa(id, g).ssa
        expect(loTrai[0]).toBe(36 + g)
        expect(loTrai.every((m) => m < CHIA_TAY && [0, 7].includes(pc(m - g)))).toBe(true)
        expect(lo.slice(0, loTrai.length)).toEqual(loTrai)
        expect(lo.slice(loTrai.length).every((m) => m >= CHIA_TAY && the.some((t) => t.includes(m)))).toBe(true)
      }
    expect(taoCauSsa('maj7', 0).ssa.loTrai).toEqual([36, 43, 48]) // Đô2 – Sol2 – Đô3
    expect(taoCauSsa('maj7', 11).ssa.loTrai).toEqual([47]) // gốc Si: chỉ còn Si2
  })

  it('chồng rồi chạy: bass trước, thế ở trên (cùng lúc hay rải), rồi đủ nốt chạy là đúng', () => {
    const c = taoCauSsa('maj7', 0)
    const chong = bam(c, [36, 52, 55, 59])
    expect(chong.r).toMatchObject({ kq: 'tiep', chu: expect.stringContaining('Chồng đủ') })
    expect(xongChong(c, chong.daChay)).toBe(3)
    expect(bam(c, [36, 52, 55, 59, 71, 74, 76]).r.kq).toBe('tiep')
    expect(bam(c, [36, 52, 55, 59, 71, 74, 76, 72]).r).toEqual({ kq: 'dung' })
    // rải lộn thứ tự, bass ở giữa chừng vẫn được — miễn thế nằm trên bass
    expect(xongChong(c, [64, 48, 67, 71])).toBe(3)
  })

  it('thế phải nằm trên bass: bass Đô 4 trên thế Mi3 – Sol3 – Si3 thì chưa chồng xong', () => {
    const c = taoCauSsa('maj7', 0)
    expect(xongChong(c, [52, 55, 59, 60])).toBe(-1)
    expect(xongChong(c, [52, 55, 59, 60, 64, 67, 71])).toBe(6)
  })

  it('nốt tránh là sai; nốt khung anh ít đặt trên đỉnh và gõ lại cùng phím thì không tính', () => {
    const cmaj7 = taoCauSsa('maj7', 0)
    expect(chamSsa(cmaj7, [], 53).kq).toBe('sai') // Fa trên Cmaj7
    const dm7 = taoCauSsa('m7', 2)
    const xong = bam(dm7, [38, 53, 57, 60]).daChay
    expect(xongChong(dm7, xong)).toBe(3)
    expect(chamSsa(dm7, xong, 71).kq).toBe('bo') // Si (13) — anh đặt trên đỉnh 1/83 lần
    const mot = chamSsa(dm7, xong, 76)
    expect(mot.kq).toBe('tiep')
    expect(chamSsa(dm7, mot.kq === 'tiep' ? mot.daChay : [], 76).kq).toBe('bo')
  })

  it('màn: mỗi loại có thế chồng, có trong bảng loại của app; câu chọn đúng màn', () => {
    for (const m of MAN_SSA)
      for (const id of m.loai) {
        expect(CHONG[id]).toBeDefined()
        expect(LOAI_KHUNG.some((l) => l.id === id)).toBe(true)
      }
    for (let i = 0; i < 30; i++) {
      const c = chonCauSsa(1, [0, 2, 4], new Map(), null)
      expect(['m7', 'm9']).toContain(c.id.slice(4))
    }
  })

  it('mẫu nghe: bass + thế, rồi bốn nốt đỉnh anh hay đặt, đi lên', () => {
    const c = taoCauSsa('m7', 2)
    const mau = mauSsa(c)
    expect(mau[0]![0]).toBe(38)
    expect(new Set(mau[0]!.slice(1).map(pc))).toEqual(new Set(c.ssa.chong))
    const chay = mau.slice(1).map((x) => x[0]!)
    expect(chay).toHaveLength(SO_NOT_CHAY)
    expect(chay.map((m) => pc(m - 2))).toEqual(DINH.thu.slice(0, SO_NOT_CHAY))
    expect(chay.every((m, i) => i === 0 || m > chay[i - 1]!)).toBe(true)
  })
})
