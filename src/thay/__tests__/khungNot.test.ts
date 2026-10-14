import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { pcsTong } from '../soanCau/chongHopAm'
import { docHop } from '../soanCau/thayTrongVong'
import { chongDuoi, congThucCua, goiYDinh, khungCua, khungLoai, LOAI_KHUNG, nenVong, SSA, tenPhim, VONG_KHUNG, type Khung } from '../hocSolo/khungNot'

const pc = (x: number) => ((x % 12) + 12) % 12
const tenGam = (k: Khung) => k.not.map((n) => `${n.ten}:${n.muc}`).join(' ')
const khungVong = (v: (typeof VONG_KHUNG)[number]) =>
  docHop(v.chu)!.map((c) =>
    khungCua(v.tonic, v.thu, {
      goc: pc(c.root - v.tonic),
      chat: c.quality.symbol,
      ...(c.bass !== undefined && c.bass !== c.root ? { bass: pc(c.bass - v.tonic) } : {}),
    }),
  )

describe('Khung nốt theo loại hợp âm (game chạy ngón)', () => {
  it('mọi loại × 12 gốc: nốt hợp âm đều là nốt chính, không trùng lớp cao độ, 6–8 nốt, nốt đỉnh gợi ý nằm trong khung', () => {
    for (const l of LOAI_KHUNG)
      for (let g = 0; g < 12; g++) {
        const k = khungLoai(l, g)
        const ten = `${l.id} gốc ${g}`
        expect(k.goc, ten).toBe(g)
        const lop = k.not.map((n) => n.p)
        expect(new Set(lop).size, `${ten}: ${tenGam(k)}`).toBe(lop.length)
        expect(lop.length, ten).toBeGreaterThanOrEqual(6)
        expect(lop.length, ten).toBeLessThanOrEqual(8)
        const quang = findQualityBySymbol(l.id)!.intervals.map(pc)
        for (const iv of quang) expect(k.not.find((n) => n.p === pc(g + iv))?.muc, `${ten} thiếu nốt hợp âm ${iv}: ${tenGam(k)}`).toBe('chinh')
        expect(k.dinh.length, ten).toBeGreaterThan(0)
        for (const iv of k.dinh) expect(k.not.find((n) => n.iv === iv)?.muc, `${ten} đỉnh ${iv}`).not.toBe('khong')
      }
  })
  it('công thức chồng của loại có đủ nốt hợp âm (bỏ được bậc 5, và bậc 9 khi có 13 — như cách app gọi tên hợp âm đang bấm)', () => {
    for (const l of LOAI_KHUNG) {
      const ct = congThucCua(l)
      if (!ct) continue
      const co = new Set(pcsTong(ct, 0))
      const quang = findQualityBySymbol(l.id)!.intervals.map(pc)
      for (const iv of quang.filter((x) => x !== 7 && !(x === 2 && quang.includes(9) && quang.includes(10))))
        expect(co.has(iv), `${l.id} ← ${ct.id} thiếu ${iv}`).toBe(true)
    }
  })
  it('lý thuyết: nốt tránh, tên gam, gam riêng', () => {
    const k = (id: string) => khungLoai(LOAI_KHUNG.find((l) => l.id === id)!, 0)
    const muc = (x: Khung, ten: string) => x.not.find((n) => n.ten === ten)?.muc
    expect(k('maj7').gam).toMatch(/Ionian/)
    expect(muc(k('maj7'), 'F')).toBe('khong')
    expect(k('m7').gam).toMatch(/Dorian/)
    expect(muc(k('m7'), 'A')).toBe('phu')
    expect(muc(k('7sus4'), 'E')).toBe('khong')
    expect(k('7b9').gam).toMatch(/Phrygian dominant/)
    expect(muc(k('7b9'), 'D♭')).toBe('chinh')
    expect(k('m7b5').gam).toMatch(/Locrian/)
    expect(muc(k('m7b5'), 'D♭')).toBe('khong')
    expect(k('m7b5').not.find((n) => n.ten === 'A♭')?.bac).toBe('♭13')
    expect(k('maj7#11').gam).toMatch(/Lydian/)
    expect(k('7#11').gam).toMatch(/Lydian dominant/)
    expect(k('dim7').not.map((n) => n.ten)).toEqual(['C', 'D', 'E♭', 'F', 'G♭', 'A♭', 'A', 'B'])
    expect(k('dim7').not.some((n) => n.muc === 'khong')).toBe(false)
    expect(k('13b9').not.map((n) => n.ten)).toEqual(['C', 'D♭', 'D♯', 'E', 'F♯', 'G', 'A', 'B♭'])
    expect(k('7#5').not.map((n) => n.ten)).toEqual(['C', 'D', 'E', 'F♯', 'G♯', 'B♭'])
    expect(k('m(maj7)').not.map((n) => n.ten)).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A', 'B'])
    // Tên nốt theo gam của khung: maj7 gốc La có Sol♯ (không phải La♭).
    expect(khungLoai(LOAI_KHUNG.find((l) => l.id === 'maj7')!, 9).not.map((n) => n.ten)).toContain('G♯')
  })
  it('số đo SSA: tổng số lần nốt giai điệu bằng cỡ mẫu của mỗi họ', () => {
    for (const [ho, x] of Object.entries(SSA)) expect(x.giaiDieu.reduce((s, [, d]) => s + d, 0), ho).toBe(x.n)
  })
  it('vòng SSA và vòng cơ bản: đọc được; gợi ý nốt đỉnh trong khung, khác tên nhau, trong tầm; thế chồng tay phải là nốt hợp âm dưới đỉnh', () => {
    for (const v of VONG_KHUNG) {
      const ks = khungVong(v)
      expect(ks.length, v.id).toBeGreaterThanOrEqual(4)
      let truoc: number | null = null
      ks.forEach((k, i) => {
        const g = goiYDinh(k, truoc, ks[(i + 1) % ks.length]!)
        expect(g.length, `${v.id} ${k.ten}`).toBeGreaterThan(0)
        expect(new Set(g.map((x) => pc(x.m))).size).toBe(g.length)
        for (const x of g) {
          expect(x.m >= 64 && x.m <= 81, `${k.ten} ${x.ten}`).toBe(true)
          expect(k.not.find((n) => n.p === pc(x.m))?.muc, `${k.ten} ${x.ten}`).not.toBe('khong')
          const chong = chongDuoi(k, x.m)
          expect(chong.at(-1)).toBe(x.m)
          expect(Math.max(...chong) - Math.min(...chong), `${k.ten} ${chong.map((m) => tenPhim(k, m))}`).toBeLessThanOrEqual(12)
          for (const m of chong.slice(0, -1)) expect(k.not.find((n) => n.p === pc(m))?.muc, `${k.ten} chồng ${tenPhim(k, m)}`).toBe('chinh')
          expect(chong.slice(0, -1).some((m) => x.m - m === 1), `${k.ten} nốt sát dưới đỉnh`).toBe(false)
        }
        truoc = g[0]!.m
      })
    }
  })
  it('có nốt trước thì gợi ý đầu tiên đi liền bậc (≤ 2 nửa cung) khi khung có nốt chính gần như vậy', () => {
    for (const v of VONG_KHUNG)
      for (const k of khungVong(v))
        for (const truoc of [67, 70, 72, 76]) {
          const coGan = k.not.some((n) => n.muc === 'chinh' && [0, 1, 2, 10, 11].includes(pc(n.p - truoc)))
          if (!coGan) continue
          expect(Math.abs(goiYDinh(k, truoc, null)[0]!.m - truoc), `${v.id} ${k.ten} sau ${truoc}`).toBeLessThanOrEqual(2)
        }
  })
  it('nền: mỗi hợp âm bass đúng (gốc hay bass gạch chéo) ở phách đầu, tay trái dưới Đô giữa, nằm trong vòng', () => {
    for (const v of VONG_KHUNG) {
      const ks = khungVong(v)
      for (const nhip of [2, 4])
        for (const day of [false, true]) {
          const hits = nenVong(ks, nhip, day)
          expect(hits.length).toBe(ks.length * (1 + (nhip - 1) + (day ? 1 : 0)))
          for (const h of hits) expect(h.startBeat).toBeLessThan(ks.length * nhip)
          ks.forEach((k, i) => {
            const dau = hits.find((h) => h.startBeat === i * nhip && Math.max(...h.notes) < 60)!
            expect(pc(dau.notes[0]!), `${v.id} ${k.ten}`).toBe(k.bass ?? k.goc)
          })
          for (const h of hits.filter((x) => x.velocity > 40)) for (const m of h.notes) expect(m < 60, `${v.id} ${m}`).toBe(true)
        }
    }
  })
})
