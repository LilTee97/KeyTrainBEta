import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC } from '../soanCau/chongHopAm'
import { dapAn, doanGiong, LUAT, MEO_CHUNG, oChu, PHONG_CACH, taoDo, type PhongCach } from '../soanCau/doTaiHoaAm'
import { lyDoThay, nguCanh, type Hop } from '../soanCau/giaiThich'
import { docHop, docVong } from '../soanCau/thayTrongVong'

const giong = (chu: string) => doanGiong(docHop(chu)!).map((g) => nguCanh(g.tonic, g.thu).giong)
/** Đáp án cả vòng theo phong cách `p`, ở giọng app đoán; ô chủ âm trong ngoặc vuông. */
const vong = (p: PhongCach, chu: string) => {
  const g = doanGiong(docHop(chu)!)[0]!
  const v = docVong(chu, g.tonic)!
  const { h } = nguCanh(g.tonic, g.thu)
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  return taoDo(p, v, g.tonic, g.thu).map((c) => (c.laChu ? `[${ten(c.dap.dap)}]` : ten(c.dap.dap)))
}
const choiDuoc = (x: Hop) => CONG_THUC.some((c) => c.kyHieu === x.chat) || findQualityBySymbol(x.chat) !== undefined

describe('Đố tái hòa âm — đoán chủ âm của vòng lặp (người dùng 11/10/2026: "ko phải lúc nào âm chủ cũng nằm ở ngay đầu vòng")', () => {
  it('chủ âm không đứng đầu vòng', () => {
    expect(giong('Dm G C Am')[0]).toBe('Đô trưởng')
    expect(giong('F G Em Am')[0]).toBe('La thứ')
    expect(giong('F G Am')[0]).toBe('La thứ')
    expect(giong('Am Dm G C')[0]).toBe('Đô trưởng')
  })
  it('át phụ không bị tính là hợp âm ngoài giọng; blues lấy I7 làm chủ; giọng thứ không có cảm âm vẫn đọc được', () => {
    expect(giong('C E7 Am F G')[0]).toBe('Đô trưởng')
    expect(giong('C7 F7 C7 G7')[0]).toBe('Đô trưởng')
    expect(giong('Am Dm E7 Am')[0]).toBe('La thứ')
    expect(giong('Dm Bb C Dm')[0]).toBe('Rê thứ')
    expect(giong('Bb F Gm Eb')[0]).toBe('Si♭ trưởng')
  })
  it('chỉ đề xuất giọng có hợp âm chủ nằm trong vòng — "F G Am" không có Đô trưởng', () => {
    expect(giong('F G Am')).toEqual(['La thứ', 'Sol trưởng', 'Fa trưởng'])
  })
  it('ô chủ âm: hợp âm chủ đúng họ; giọng trưởng không có I trưởng thì lấy I7 (blues); A7 ở La thứ không phải chủ', () => {
    expect(oChu(docVong('Am F C G', 0)!, false)).toEqual([false, false, true, false])
    expect(oChu(docVong('C7 F7 C7 G7', 0)!, false)).toEqual([true, false, true, false])
    expect(oChu(docVong('Am A7 Dm E7', 9)!, true)).toEqual([true, false, false, false])
  })
})

describe('Đáp án theo bốn phong cách — đúng luật đã thiết kế', () => {
  it('Đô trưởng ii – V – I – vi', () => {
    expect(vong('ca-phao', 'Dm G C Am')).toEqual(['Dm7', 'G7sus4 – G13', '[Cadd9]', 'Am7'])
    expect(vong('linh-nhi', 'Dm G C Am')).toEqual(['Dm7', 'G', '[C – C/B]', 'Am – Em'])
    expect(vong('blues', 'Dm G C Am')).toEqual(['Dm7', 'G7♯9', '[C7]', 'Am7'])
    expect(vong('claude', 'Dm G C Am')).toEqual(['Dm11', 'D♭9', '[Cmaj9 – G/B]', 'A7♭9'])
  })
  it('La thứ ♭VI – ♭VII – v – i', () => {
    expect(vong('ca-phao', 'F G Em Am')).toEqual(['Fmaj7', 'G7', 'Em7', '[Am7]'])
    expect(vong('linh-nhi', 'F G Em Am')).toEqual(['Fmaj7', 'G', 'Em', '[Am – G]'])
    expect(vong('blues', 'F G Em Am')).toEqual(['F7', 'G7', 'Em7', '[Am11]'])
    expect(vong('claude', 'F G Em Am')).toEqual(['Fmaj9', 'Gadd9', 'E7♭9', '[Am9 – Am7/G]'])
  })
  it('La thứ i – iv – V7 – i: Cà Pháo "bẻ lái" i thành I7 trước iv; Linh Nhi chèn ii° trước V; V7 sẵn thì thêm ♭13', () => {
    expect(vong('ca-phao', 'Am Dm E7 Am')).toEqual(['[A7]', 'Dm7', 'E7♭13', '[Am7]'])
    expect(vong('linh-nhi', 'Am Dm E7 Am')).toEqual(['[Am(add9)]', 'Dm – Bm7♭5', 'E7♭13', '[Am(add9)]'])
    expect(vong('claude', 'Am Dm E7 Am')).toEqual(['[Am9 – A7/C♯]', 'Dm9 – F7', 'E7♭9', '[Am9]'])
  })
  it('át phụ trên chủ âm ở giọng thứ (A7 → Dm) và hợp âm đảo giữ bass của bài', () => {
    expect(vong('ca-phao', 'Am A7 Dm E7')[1]).toBe('Em7 – A7')
    expect(vong('claude', 'Am A7 Dm E7')[1]).toBe('A7♭9')
    expect(vong('ca-phao', 'C/E F G C')[0]).toBe('[C7/E]')
  })
})

const VONG = ['Dm G C Am', 'F G Em Am', 'Am F C G', 'C E7 Am F G', 'Am Dm E7 Am', 'C7 F7 C7 G7', 'Bb F Gm Eb', 'Em C G D', 'Dm Bb C Dm', 'Am A7 Dm E7', 'C/E F G C', 'F#m D A E', 'Cm Ab Bb G7', 'Ebmaj7 Cm7 Fm7 Bb7']

describe('Bài đố — mọi vòng × mọi phong cách × mọi giọng ứng viên', () => {
  it('ô thường: 2–4 phương án khác tên, đúng một đáp án, không có phương án "cũng đúng" nào bị đưa làm phương án sai; ô chủ âm không hỏi', () => {
    let soO = 0
    for (const chu of VONG)
      for (const g of doanGiong(docHop(chu)!))
        for (const p of PHONG_CACH) {
          const { h } = nguCanh(g.tonic, g.thu)
          const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
          for (const c of taoDo(p.id, docVong(chu, g.tonic)!, g.tonic, g.thu)) {
            expect(c.dap.y && c.dap.giai && c.dap.coSo && c.dap.goiY).toBeTruthy()
            expect([c.dap.dap, ...c.dap.cung].flat().every(choiDuoc)).toBe(true)
            if (c.laChu) {
              expect(c.luaChon).toEqual([])
              continue
            }
            soO += 1
            const tenLc = c.luaChon.map((l) => ten(l.hop))
            expect(c.luaChon.length).toBeGreaterThanOrEqual(2)
            expect(c.luaChon.length).toBeLessThanOrEqual(4)
            expect(new Set(tenLc).size).toBe(tenLc.length)
            expect(tenLc[c.dung]).toBe(ten(c.dap.dap))
            for (const x of c.dap.cung) expect(tenLc).not.toContain(ten(x))
          }
        }
    expect(soO).toBeGreaterThan(400)
  })
})

describe('Bảng luật', () => {
  it('luật ba thầy trỏ đúng lời đã duyệt (lyDoThay); luật không trỏ thì có lời riêng; nốt nào cũng bấm được', () => {
    for (const p of PHONG_CACH)
      for (const thu of [false, true])
        for (const l of LUAT[p.id](0, thu)) {
          if (l.diem && p.id !== 'claude') expect(lyDoThay(p.id, 0, thu)!.bac[l.diem[0]]?.[l.diem[1]], `${p.id} ${thu} ${l.diem}`).toBeDefined()
          else expect(l.loi, `${p.id} ${thu} bậc ${l.bac}`).toBeDefined()
          expect([l.dap, ...(l.cung ?? [])].flat().every(choiDuoc)).toBe(true)
        }
  })
  it('gợi ý không lộ tên hợp âm đáp án', () => {
    for (const p of PHONG_CACH)
      for (const [tonic, thu] of [
        [0, false],
        [9, true],
      ] as const)
        for (const l of LUAT[p.id](tonic, thu)) {
          const { h } = nguCanh(tonic, thu)
          for (const x of l.dap) if (x.chat) expect(l.goiY, `${p.id} bậc ${l.bac}`).not.toContain(h(x.goc, x.chat, x.bass))
        }
  })
  it('lời gia sư và mẹo (người dùng 11/10/2026): luật nào cũng có lời gia sư và một mẹo có thật; ký hiệu viết đẹp (♭, ♯), không lộ "b13", "#11"', () => {
    const ids = new Set(MEO_CHUNG.map((m) => m.id))
    expect(ids.size).toBe(MEO_CHUNG.length)
    const dung = new Set<string>()
    for (const p of PHONG_CACH)
      for (const [tonic, thu] of [
        [0, false],
        [9, true],
        [3, false],
        [6, true],
      ] as const)
        for (const l of LUAT[p.id](tonic, thu)) {
          expect(l.giang.length, `${p.id} bậc ${l.bac}`).toBeGreaterThan(40)
          expect(l.giang, `${p.id} bậc ${l.bac}`).not.toMatch(/#|\db\d|\bb\d/)
          expect(ids.has(l.meo)).toBe(true)
          dung.add(l.meo)
        }
    // Mẹo nào cũng có chỗ dùng: trong luật, hay ở lối chung (bậc không có luật) của từng thầy.
    for (const chu of VONG)
      for (const g of doanGiong(docHop(chu)!))
        for (const p of PHONG_CACH) {
          const v = docVong(chu, g.tonic)!
          v.forEach((_, i) => {
            const d = dapAn(p.id, v, i, g.tonic, g.thu)
            expect(d.giang.length).toBeGreaterThan(30)
            expect(d.giang).not.toMatch(/#|\db\d|\bb\d/)
            dung.add(d.meo)
          })
        }
    expect([...ids].filter((id) => !dung.has(id))).toEqual([])
  })
  it('đáp án không phụ thuộc giọng đang gõ: vòng dịch giọng thì đáp án dịch theo (Đô → Mi♭)', () => {
    for (const p of PHONG_CACH) {
      const a = docVong('Dm G C Am', 0)!
      const b = docVong('Fm Bb Eb Cm', 3)!
      expect(a.map((_, i) => dapAn(p.id, a, i, 0, false).dap)).toEqual(b.map((_, i) => dapAn(p.id, b, i, 3, false).dap))
    }
  })
})
