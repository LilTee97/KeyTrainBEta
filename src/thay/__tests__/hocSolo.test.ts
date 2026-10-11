import { describe, expect, it } from 'vitest'
import { giangHop, hopAmHoc, MEO_SOLO, notTrenHop, phanBo, THAY_HOC, vaiNot, type HopHoc } from '../hocSolo/chonNot'
import {
  baiArp,
  baiChayDon,
  baiChayVong,
  baiGam,
  baiNamNgon,
  baiTapNgon,
  cauScale,
  GAM,
  lapLai,
  ngonArp,
  ngonGam,
  notDung,
  saoChoDung,
  saoTheoNhip,
} from '../hocSolo/gamNgon'
import { baiCauThay, loiBoSoan } from '../hocSolo/cauThay'
import { PHAN_TICH_THAY } from '../hocSolo/meoThay'
import { docVong } from '../soanCau/thayTrongVong'

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
})

describe('Game chạy ngón — dòng thời gian cho khung nốt rơi', () => {
  const pc = (m: number) => ((m % 12) + 12) % 12
  it('hợp âm riêng lẻ: nốt bài tập móc đơn mang số ngón; máy giữ hợp âm ở tay kia mỗi ô 4 phách', () => {
    const bai = baiNamNgon(0, false, 'phai')
    const c = baiChayDon(bai)
    const tap = c.timeline.filter((x) => x.hand === 'right')
    expect(c.tay).toBe('right')
    expect(tap.map((x) => x.notes[0])).toEqual(bai.notes)
    expect(tap.map((x) => x.ngon)).toEqual(bai.ngon)
    expect(tap.map((x) => x.startBeat)).toEqual(bai.notes.map((_, k) => k * 0.5))
    expect(c.beatsPerChord).toBe(8)
    expect(c.timeline.filter((x) => x.hand === 'left').map((x) => [x.startBeat, x.notes])).toEqual([
      [0, [36, 48, 52, 55]],
      [4, [36, 48, 52, 55]],
    ])
    expect(c.perBeat).toEqual(Array(8).fill('C'))
    const t = baiChayDon(baiNamNgon(9, true, 'trai'))
    expect(t.tay).toBe('left')
    expect(t.timeline.find((x) => x.hand === 'right')!.notes).toEqual([81, 84, 88])
    expect(t.perBeat[0]).toBe('Am')
  })
  it('theo vòng, năm ngón: mỗi hợp âm 4 phách; đầu phách nốt hợp âm, giữa phách nốt gam; tay trái bùm – chát', () => {
    const hop = [
      { goc: 0, chat: '' },
      { goc: 9, chat: 'm' },
      { goc: 5, chat: '' },
      { goc: 7, chat: '7' },
    ]
    const v = baiChayVong(hop, 0, false, 'nam-ngon', 'x')
    expect(v.id).toBe('vong-x-0-truong-nam-ngon')
    expect(v.beatsPerChord).toBe(4)
    expect(v.perBeat).toEqual(['C', 'Am', 'F', 'G7'].flatMap((x) => [x, x, x, x]))
    const tap = v.timeline.filter((x) => x.hand === 'right')
    expect(tap.length).toBe(32)
    expect(tap.slice(0, 8).map((x) => x.notes[0])).toEqual([60, 62, 64, 65, 67, 65, 64, 62])
    hop.forEach((x, i) => {
      const tru = x.chat === 'm' ? [0, 3, 7] : [0, 4, 7]
      tap.slice(i * 8, i * 8 + 8).forEach((e, t) => {
        expect(e.ngon).toBe([1, 2, 3, 4, 5, 4, 3, 2][t])
        expect(e.startBeat).toBe(i * 4 + t * 0.5)
        if (t % 2 === 0) expect(tru, `${i} ${t}`).toContain(pc(e.notes[0]! - x.goc))
        else expect([0, 2, 4, 5, 7, 9, 11], `${i} ${t}`).toContain(pc(e.notes[0]!))
      })
    })
    expect(v.timeline.filter((x) => x.hand === 'left' && x.startBeat < 4).map((x) => [x.startBeat, x.notes])).toEqual([
      [0, [36]],
      [1, [43, 48, 52]],
      [2, [36]],
      [3, [43, 48, 52]],
    ])
  })
  it('giọng thứ: trên V7 nốt đi qua lấy gam thứ hòa thanh (E7 ở La thứ: Mi Fa Sol♯ La Si); rải và mỗi phách một nốt đúng ngón', () => {
    const e7 = baiChayVong([{ goc: 7, chat: '7' }], 9, true, 'nam-ngon', 'y')
    expect(e7.timeline.filter((x) => x.hand === 'right').map((x) => x.notes[0])).toEqual([64, 65, 68, 69, 71, 69, 68, 65])
    const rai = baiChayVong([{ goc: 0, chat: '' }], 0, false, 'rai', 'z').timeline.filter((x) => x.hand === 'right')
    expect(rai.map((x) => x.notes[0])).toEqual([60, 64, 67, 72, 67, 64, 60, 64])
    expect(rai.map((x) => x.ngon)).toEqual([1, 2, 3, 5, 3, 2, 1, 2])
    const phach = baiChayVong([{ goc: 0, chat: '' }], 0, false, 'phach', 'z').timeline.filter((x) => x.hand === 'right')
    expect(phach.map((x) => [x.startBeat, x.notes[0], x.ngon])).toEqual([
      [0, 60, 1],
      [1, 64, 3],
      [2, 67, 5],
      [3, 64, 3],
    ])
  })
  it('lặp lượt nối liền; sao theo nhịp và sao chờ đúng nốt đúng ngưỡng', () => {
    const v = baiChayVong([{ goc: 0, chat: '' }], 0, false, 'phach', 'z')
    const hai = lapLai(v.timeline, 4, 2)
    expect(hai.length).toBe(v.timeline.length * 2)
    expect(hai.slice(v.timeline.length).map((x) => x.startBeat)).toEqual(v.timeline.map((x) => x.startBeat + 4))
    const s = (hit: number, medianAbsMs: number | null) => saoTheoNhip({ total: 20, hit, medianAbsMs })
    expect([s(18, 40), s(18, 41), s(15, 80), s(15, 81), s(10, null), s(9, 10)]).toEqual([3, 2, 2, 1, 1, 0])
    expect(saoTheoNhip({ total: 0, hit: 0, medianAbsMs: null })).toBe(0)
    expect([saoChoDung({ chang: 20, vap: 0 }), saoChoDung({ chang: 20, vap: 2 }), saoChoDung({ chang: 20, vap: 3 }), saoChoDung({ chang: 5, vap: 1 })]).toEqual([3, 2, 1, 2])
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

describe('Game chạy ngón — câu theo thầy (bộ soạn của app trên vòng người dùng)', () => {
  const VONG: [string, number, boolean][] = [
    ['C Am F G', 0, false],
    ['Am Dm E7 Am', 9, true],
  ]
  it('ba thầy × hai vòng: có câu tay phải trong tầm đàn 61 phím, có đệm tay trái, đúng số phách mỗi hợp âm', () => {
    for (const thay of ['ca-phao', 'linh-nhi', 'blues'] as const)
      for (const [chu, tonic, thu] of VONG) {
        const hop = docVong(chu, tonic)!
        const bai = baiCauThay(thay, hop, tonic, thu, 0, 'x')!
        const o = thay === 'blues' ? 3 : 4
        expect(bai, `${thay} ${chu}`).not.toBeNull()
        expect(bai.perBeat.length).toBe(hop.length * o)
        expect(bai.meter).toBe(thay === 'blues' ? 3 : 4)
        const phai = bai.timeline.filter((e) => e.hand === 'right')
        expect(phai.length, `${thay} ${chu}`).toBeGreaterThan(hop.length * 3)
        expect(bai.timeline.some((e) => e.hand === 'left')).toBe(true)
        for (const e of phai) {
          expect(e.startBeat).toBeLessThan(hop.length * o)
          for (const m of e.notes) expect(m >= 36 && m <= 96, `${thay} ${chu} ${m}`).toBe(true)
        }
        expect(loiBoSoan(thay, thu)).toMatch(/Đệm: /)
      }
  })
  it('cùng lượt ra cùng một câu (giữ câu tới khi bấm Đổi câu); Cà Pháo · Linh Nhi đổi lượt là đổi câu', () => {
    const hop = docVong('C Am F G', 0)!
    for (const thay of ['ca-phao', 'linh-nhi', 'blues'] as const)
      expect(JSON.stringify(baiCauThay(thay, hop, 0, false, 2, 'x'))).toBe(JSON.stringify(baiCauThay(thay, hop, 0, false, 2, 'x')))
    for (const thay of ['ca-phao', 'linh-nhi'] as const) {
      const cau = [0, 1, 2, 3].map((t) => JSON.stringify(baiCauThay(thay, hop, 0, false, t, 'x')!.timeline.filter((e) => e.hand === 'right')))
      expect(new Set(cau).size, thay).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('Mẹo & quy tắc theo từng thầy', () => {
  it('ba thầy, mỗi thầy đủ phân tích · quy tắc · mẹo; mọi cơ sở có số; ký hiệu đẹp; không gọi nhịp lệch là "giật"', () => {
    expect(PHAN_TICH_THAY.map((t) => t.id)).toEqual(['ca-phao', 'linh-nhi', 'blues'])
    for (const t of PHAN_TICH_THAY) {
      expect(t.soDo.length, t.id).toBeGreaterThanOrEqual(10)
      expect(t.quyTac.length, t.id).toBeGreaterThanOrEqual(7)
      expect(t.meo.length, t.id).toBeGreaterThanOrEqual(8)
      expect(t.nguon).toMatch(/\d/)
      for (const x of t.soDo) expect(x.so, `${t.id} ${x.muc}`).toMatch(/\d/)
      for (const m of [...t.quyTac, ...t.meo]) {
        expect(m.coSo, `${t.id} ${m.ten}`).toMatch(/\d/)
        expect(m.cau.length, `${t.id} ${m.ten}`).toBeGreaterThan(30)
      }
      const chu = JSON.stringify(t)
      expect(chu).not.toMatch(/#|\bb\d|phách giật/)
    }
  })
})
