import { describe, expect, it } from 'vitest'
import { chonCau, dungTayPhai, soCanCham, type CauGame } from './gameChong'
import { BAI_251, BAI_LUOT, MAN_251, MAN_LUOT, MAU_251, MAU_LUOT, taoCauNoi } from './hopAmLuot'

const pc = (x: number) => ((x % 12) + 12) % 12
const lop = (ns: readonly number[]) => [...new Set(ns.map(pc))].sort((a, b) => a - b)

/** Một câu một hợp âm: bốn nút khác tên, có đáp án; nốt đáp án đúng, nốt mọi nút nhiễu sai. */
function kiemCau(c: CauGame, nhan: string) {
  const ten = c.luaChon.map((l) => l.ten)
  expect([nhan, ten.length, new Set(ten).size, ten.includes(c.dapAnTen)]).toEqual([nhan, 4, 4, true])
  expect([nhan, c.trai.length, c.haiTayBuoc, dungTayPhai(c.phai, c)]).toEqual([nhan, 0, false, true])
  for (const l of c.luaChon.filter((x) => x.ten !== c.dapAnTen)) expect([nhan, l.ten, dungTayPhai(l.phai, c)]).toEqual([nhan, l.ten, false])
  expect([nhan, soCanCham(c, false)]).toEqual([nhan, lop(c.phai).length])
}

describe('Passing chord — hợp âm lướt', () => {
  it('4 màn: át phụ 6 chỗ · giảm lướt 7 · ♭II7 4 · trộn 17; ví dụ của màn viết từ câu thật', () => {
    expect(MAN_LUOT.map((m) => m.ids.length)).toEqual([6, 7, 4, 17])
    expect(MAN_LUOT.slice(0, 3).map((m) => m.goiY)).toEqual(['Cmaj7 → A7 → Dm7', 'Cmaj7 → C♯dim7 → Dm7', 'Dm7 → D♭7 → Cmaj7'])
    expect(MAN_LUOT.every((m) => m.meo && m.meo.length > 0)).toBe(true)
  })

  it('mọi chỗ chen ở cả 12 giọng: bốn nút đúng / sai theo nốt, nghe cả ba hợp âm, viên ghi "trước → ? → đích"', () => {
    for (const m of MAU_LUOT)
      for (let g = 0; g < 12; g++) {
        const c = taoCauNoi(`luot:${m.id}`, g, () => 0.37)
        kiemCau(c, `${m.id}@${g}`)
        expect([m.id, g, c.nghe?.length, c.ten.split(' → ').length, c.ten.includes(' → ? → '), !!c.the]).toEqual([m.id, g, 3, 3, true, true])
        expect(lop(c.nghe![1]!)).toEqual(lop(c.phai))
      }
  })

  it('đúng luật nhạc ở mọi giọng: át phụ có bậc 3 sát dưới gốc đích · dim7 nằm giữa hai bass · ♭II7 trên đích nửa cung, chung cặp 3 – 7 với V7', () => {
    for (const m of MAU_LUOT)
      for (let g = 0; g < 12; g++) {
        const c = taoCauNoi(`luot:${m.id}`, g)
        const [tu, luot, den] = c.nghe!.map((h) => pc(Math.min(...h)))
        const lp = new Set(c.phai.map(pc))
        if (m.loai === 'at-phu') expect([m.id, g, pc(luot! - den!), lp.has(pc(den! - 1))]).toEqual([m.id, g, 7, true])
        else if (m.loai === 'giam') {
          const len = pc(den! - tu!) <= 6
          expect([m.id, g, pc(luot! - den!), pc(luot! - tu!), lp.size]).toEqual([m.id, g, len ? 11 : 1, len ? 1 : 11, 4])
        } else {
          const v = pc(den! + 7)
          expect([m.id, g, pc(luot! - den!), lp.has(pc(v + 4)), lp.has(pc(v + 10))]).toEqual([m.id, g, 1, true, true])
        }
      }
  })

  it('Đô trưởng: lời giải và mẹo nói đúng nốt — tên gốc theo chiều đi (lên ghi ♯, xuống ghi ♭)', () => {
    const c = (id: string, g = 0) => taoCauNoi(`luot:${id}`, g, () => 0.37)
    const ap = c('ap:I-ii')
    expect([ap.the, ap.ten, ap.khungTen, ap.goiY, ap.dapAnTen]).toEqual(['át phụ', 'Cmaj7 → ? → Dm7', 'V7 của Dm7', 'từ Rê đếm lên 5 chữ cái · loại 7', 'A7'])
    expect(ap.loi).toBe('Cmaj7 → A7 → Dm7: A7 là V7 của Dm7 — Đô♯ (bậc 3 của A7) nằm sát dưới Rê nửa cung nên kéo lên. Chồng: La + C♯dim')
    expect(ap.meo).toBe('Át phụ của Dm7: từ Rê đếm lên 5 chữ cái (Rê – Mi – Fa♯ – Sol – La) = La, loại 7 → A7 (La + C♯dim).')
    expect([c('gl:I-ii').dapAnTen, c('gl:iii-ii').dapAnTen, c('gl:ii-I').dapAnTen]).toEqual(['C♯dim7', 'E♭dim7', 'D♭dim7'])
    expect(c('gl:iii-ii').loi).toBe('Em7 → E♭dim7 → Dm7: bass Mi → Mi♭ → Rê đi liền từng nửa cung. Chồng: Mi♭ + G♭dim')
    const tt = c('tt:ii-I')
    expect([tt.the, tt.khungTen, tt.dapAnTen]).toEqual(['♭II7', 'thay cho G7', 'D♭7'])
    expect(tt.loi).toContain('chung cặp nốt Si – Fa')
    // nút nhiễu ♭II7 không lặp hợp âm trước: G7 → ? → Cmaj7 thì nút V7 (G7) đổi thành D♭maj7
    expect(c('tt:V-I').luaChon.map((l) => l.ten).sort()).toEqual(['B7', 'D♭7', 'D♭m7', 'D♭maj7'])
    // Fa trưởng: át phụ của Gm7 là D7, giảm lướt Fa → Sol là F♯dim7, ♭II7 về F là G♭7
    expect([c('ap:I-ii', 5).dapAnTen, c('gl:I-ii', 5).dapAnTen, c('tt:ii-I', 5).dapAnTen]).toEqual(['D7', 'F♯dim7', 'G♭7'])
  })

  it('chấm theo chức năng: thêm nốt màu cũng đúng, thiếu nốt 3 · 7 hay thêm nốt lạ là sai; dim7 thế đảo nào cũng được', () => {
    const ap = taoCauNoi('luot:ap:I-ii', 0) // A7
    expect(dungTayPhai([57, 61, 67], ap)).toBe(true) // La – Đô♯ – Sol (vỏ 1 · 3 · 7)
    expect(dungTayPhai([57, 61, 64, 67, 70], ap)).toBe(true) // A7♭9
    expect(dungTayPhai([57, 61, 66, 67], ap)).toBe(true) // A13 (bỏ 5)
    expect(dungTayPhai([57, 60, 64, 67], ap)).toBe(false) // Am7
    expect(dungTayPhai([57, 61, 64, 68], ap)).toBe(false) // Amaj7
    expect(dungTayPhai([61, 64, 67], ap)).toBe(false) // thiếu gốc
    const gl = taoCauNoi('luot:gl:I-ii', 0) // C♯dim7
    expect(dungTayPhai([52, 55, 58, 61], gl)).toBe(true) // Edim7 — cùng bốn nốt
    expect(dungTayPhai([49, 52, 55], gl)).toBe(false) // thiếu Si♭
  })
})

describe('Vòng 2-5-1', () => {
  it('4 màn: trưởng · thứ · 2-5 lướt (5 đích) · trộn 7', () => {
    expect(MAN_251.map((m) => m.ids.length)).toEqual([1, 1, 5, 7])
    expect(MAN_251.slice(0, 3).map((m) => m.goiY)).toEqual(['Dm7 → G7 → Cmaj7', 'Dm7♭5 → G7 → Cm7', '→ Dm7: Em7♭5 → A7'])
  })

  it('mọi mẫu ở 12 giọng: viên hai bước, mỗi bước đúng / sai theo nốt; gốc nhảy lên quãng 4; nghe cả vòng', () => {
    for (const m of MAU_251)
      for (let g = 0; g < 12; g++) {
        const c = taoCauNoi(`v251:${m.id}`, g, () => 0.61)
        expect([m.id, g, c.buoc?.length, c.nghe?.length, !!c.the]).toEqual([m.id, g, 2, 3, true])
        c.buoc!.forEach((b, i) => kiemCau(b, `${m.id}@${g}#${i}`))
        const goc = c.nghe!.map((h) => pc(Math.min(...h)))
        expect([m.id, g, pc(goc[1]! - goc[0]!), pc(goc[2]! - goc[1]!)]).toEqual([m.id, g, 5, 5])
        const [b1, b2] = c.buoc!
        expect([b1!.ten.startsWith('? → ? → '), b2!.ten.startsWith(`${b1!.dapAnTen} → ? → `), c.ten]).toEqual([true, true, b1!.ten])
        // đích thứ: bậc 2 là m7♭5; bậc 5 luôn là 7 trưởng (có nốt cảm âm)
        const thu = m.den.q === 'm7'
        expect([m.id, g, b1!.dapAnTen.endsWith(thu ? 'm7♭5' : 'm7'), /^[A-G][♭♯]?7$/.test(b2!.dapAnTen)]).toEqual([m.id, g, true, true])
      }
  })

  it('Đô: trưởng Dm7 – G7, thứ Dm7♭5 – G7; nối mượt nốt 7 → nốt 3; chọn được qua chonCau', () => {
    const tr = taoCauNoi('v251:truong', 0, () => 0.61)
    expect(tr.buoc!.map((b) => [b.ten, b.khungTen, b.goiY, b.dapAnTen])).toEqual([
      ['? → ? → Cmaj7', 'bậc 2 của Cmaj7', 'trên Đô một cung · m7', 'Dm7'],
      ['Dm7 → ? → Cmaj7', 'bậc 5 của Cmaj7', 'từ Đô đếm lên 5 chữ cái · loại 7', 'G7'],
    ])
    expect(tr.loi).toBe(
      'Dm7 → G7 → Cmaj7: bậc 2 – bậc 5 – bậc 1, gốc nhảy lên quãng 4 mỗi bước (Rê → Sol → Đô). Nối mượt: Đô (7 của Dm7) xuống Si (3 của G7), Fa (7 của G7) xuống Mi (3 của Cmaj7).',
    )
    const th = taoCauNoi('v251:thu', 0, () => 0.61)
    expect([th.the, ...th.buoc!.map((b) => b.dapAnTen)]).toEqual(['2-5-1 thứ', 'Dm7♭5', 'G7'])
    expect(th.buoc![1]!.luaChon.map((l) => l.ten)).toContain('Gm7') // lỗi hay gặp: bậc 5 thứ
    expect(chonCau(['v251:luot:vi'], [0], new Map(), null, () => 0.2).buoc!.map((b) => b.dapAnTen)).toEqual(['Bm7♭5', 'E7'])
  })
})

describe('Bài giảng', () => {
  it('ví dụ ▶ nghe sinh từ cùng công thức với câu đố; mỗi hợp âm có nốt', () => {
    const ten = (bai: typeof BAI_LUOT) => bai.flatMap((d) => d.nghe.map((n) => n.ten))
    expect(ten(BAI_LUOT)).toEqual([
      'Cmaj7 → A7 → Dm7',
      'Cmaj7 → C7 → Fmaj7',
      'Fmaj7 → E7 → Am7',
      'Cmaj7 → C♯dim7 → Dm7',
      'Em7 → E♭dim7 → Dm7',
      'G7 → G♯dim7 → Am7',
      'Dm7 → D♭7 → Cmaj7',
      'Em7 → E♭7 → Dm7',
      'Am7 → A♭7 → G7',
    ])
    expect(ten(BAI_251)).toEqual([
      'Dm7 → G7 → Cmaj7',
      'Dm7 → G7 → Cmaj7',
      'Gm7 → C7 → Fmaj7',
      'Dm7♭5 → G7 → Cm7',
      'Dm11 → G13♭9♯11 → Cmaj9',
      'Bm7♭5 → E7 → Am7',
      'Gm7 → C7 → Fmaj7',
    ])
    for (const d of [...BAI_LUOT, ...BAI_251]) for (const n of d.nghe) expect([n.ten, n.hop.every((h) => h.length >= 3)]).toEqual([n.ten, true])
  })
})
