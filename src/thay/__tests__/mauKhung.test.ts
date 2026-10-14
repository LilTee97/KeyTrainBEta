import { describe, expect, it } from 'vitest'
import { khungLoai, LOAI_KHUNG } from '../hocSolo/khungNot'
import { CHA, chonCauKhung, duKhung, MAN_KHUNG, ngoaiKhung, taoCauKhung } from '../hocSolo/mauKhung'

const lop = (c: { k: { not: { p: number }[] } }) => new Set(c.k.not.map((n) => n.p))
const lech = (a: Set<number>, b: Set<number>) => [...a].filter((p) => !b.has(p)).length + [...b].filter((p) => !a.has(p)).length

describe('Mưa khung nốt — quy tắc nối các nhóm đuôi', () => {
  it('mọi màn × mọi bước × 12 gốc: tạo được câu; 4 tên khung khác nhau, có đáp án; có lời quy tắc', () => {
    MAN_KHUNG.forEach((m, mi) =>
      m.buoc.forEach((_, b) => {
        for (let g = 0; g < 12; g++) {
          const c = taoCauKhung(mi, b, g, () => 0.4)
          expect(c.luaChon.length, `${m.ten} ${c.ten}`).toBe(4)
          expect(new Set(c.luaChon.map((x) => x.ten)).size, `${m.ten} ${c.ten}`).toBe(4)
          expect(c.luaChon.some((x) => x.ten === c.dapAnTen)).toBe(true)
          expect(c.quyTac.length).toBeGreaterThan(5)
          expect(c.k.goc).toBe(g)
        }
      }),
    )
  })
  it('mọi loại có cha trong bảng (trừ gốc maj7), và cha nằm trong 28 loại', () => {
    for (const l of LOAI_KHUNG) {
      if (l.id === 'maj7') continue
      expect(CHA[l.id], l.id).toBeDefined()
      expect(LOAI_KHUNG.some((x) => x.id === CHA[l.id]), l.id).toBe(true)
    }
  })
  it('bảy khung: mỗi bước hạ đúng một nốt (ở mọi gốc); lời quy tắc là một mũi tên', () => {
    const mi = MAN_KHUNG.findIndex((m) => m.chuoi)
    for (let g = 0; g < 12; g++)
      for (let b = 1; b < MAN_KHUNG[mi]!.buoc.length; b++) {
        const truoc = taoCauKhung(mi, b - 1, g)
        const nay = taoCauKhung(mi, b, g)
        expect(lech(lop(truoc), lop(nay)), `${truoc.ten} → ${nay.ten}`).toBe(2)
        expect(nay.quyTac, nay.ten).toMatch(/^từ .+: \S+ → \S+$/)
      }
  })
  it('cầu thang 9 · 11 · 13: khung giữ nguyên như loại cha', () => {
    for (const id of ['maj9', 'maj13', '9', '13', 'm9', 'm11', 'm13'])
      for (let g = 0; g < 12; g++) {
        const con = khungLoai(LOAI_KHUNG.find((l) => l.id === id)!, g)
        const cha = khungLoai(LOAI_KHUNG.find((l) => l.id === CHA[id])!, g)
        expect(lech(new Set(con.not.map((n) => n.p)), new Set(cha.not.map((n) => n.p))), id).toBe(0)
      }
  })
  it('một nốt: maj7 → 7, 7 → m7, 7 → 7♯11, m7 → m(maj7) ở hợp âm; khung maj7 → 7 → m7 → 7♯11 cũng một nốt', () => {
    const mi = 0
    expect(taoCauKhung(mi, 1, 0).quyTac).toBe('từ Cmaj7: B → B♭')
    expect(taoCauKhung(mi, 2, 0).quyTac).toBe('từ C7: E → E♭')
    const k = (id: string) => new Set(khungLoai(LOAI_KHUNG.find((l) => l.id === id)!, 0).not.map((n) => n.p))
    expect(lech(k('maj7'), k('7'))).toBe(2)
    expect(lech(k('7'), k('m7'))).toBe(2)
    expect(lech(k('7'), k('7#11'))).toBe(2)
  })
  it('chấm: đủ khung là đúng; nốt ngoài khung là sai; chọn câu không lặp đúng bước vừa rồi, bước sai quay lại nhiều hơn', () => {
    const c = taoCauKhung(0, 1, 0)
    expect(duKhung(new Set([0, 2, 4, 5, 7, 9]), c)).toBe(false)
    expect(duKhung(new Set([0, 2, 4, 5, 7, 9, 10]), c)).toBe(true)
    expect(ngoaiKhung(71, c)).toBe(true)
    expect(ngoaiKhung(70, c)).toBe(false)
    let r = 1
    const rand = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646
    const dem = new Map<string, number>()
    let truoc: string | null = null
    for (let k = 0; k < 600; k++) {
      const x = chonCauKhung(0, [0], new Map([['0:2', 5]]), truoc, rand)
      expect(x.id).not.toBe(truoc)
      dem.set(x.id, (dem.get(x.id) ?? 0) + 1)
      truoc = x.id
    }
    expect(dem.get('0:2')!).toBeGreaterThan(dem.get('0:0')!)
  })
})
