import { describe, expect, it } from 'vitest'
import duNhuAnh from '../hocSolo/ssaNhuAnh.json'
import { dungTayPhai, soCanCham } from './gameChong'
import { BAI_SSA, MAN_HOP_SSA, taoCauHopSsa, THE_SSA } from './hopAmSsa'

const pc = (x: number) => ((x % 12) + 12) % 12
const lop = (ns: readonly number[]) => [...new Set(ns.map(pc))].sort((a, b) => a - b)

interface Doan {
  clip: string
  t: number
  goc: string
  loai: string
  bass: string | null
  trai: number[]
  the: number[]
}
const DOAN = (duNhuAnh as unknown as { doan: Doan[] }).doan
const PC: Readonly<Record<string, number>> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
/** Đếm lại số đo trích trong mục: hợp âm loại `loai` (tay phải ≥ 3 nốt) có đủ các bậc `bac` ở tay phải. */
function dem(loai: (l: string) => boolean, bac: readonly number[]) {
  const xs = DOAN.filter((d) => loai(d.loai) && d.the.length >= 3)
  const co = xs.filter((d) => bac.every((b) => d.the.some((m) => pc(m - PC[d.goc]!) === b)))
  return `${co.length}/${xs.length}`
}

describe('Hợp âm SSA — mục của Game công thức', () => {
  it('số đo trích trong màn và bài học đếm lại khớp ssaNhuAnh.json', () => {
    expect(dem((l) => l === 'Maj7', [4, 7, 11])).toBe('6/7')
    expect(dem((l) => l === 'min7', [3, 7, 10])).toBe('13/15')
    expect(dem((l) => l.startsWith('9sus4'), [10, 2, 5])).toBe('3/3')
    expect(dem((l) => l === 'Maj9', [4, 7, 11, 2])).toBe('8/9')
    expect(dem((l) => l === '13sus', [10, 2, 5, 9])).toBe('4/4')
    expect(dem((l) => l === 'min6', [0, 3, 7, 9])).toBe('3/3')
    expect(dem((l) => l === 'min9', [3, 7, 10, 2])).toBe('3/6')
    expect(dem((l) => l.startsWith('min7b5'), [3, 6, 10])).toBe('1/2')
    // giữ ≥ 2 lớp cao độ tay phải ở chỗ đổi bass (bass = nốt tay trái thấp nhất; không có tay trái thì bass của nhãn hay gốc)
    const bass = (d: Doan) => (d.trai.length ? pc(Math.min(...d.trai)) : PC[d.bass ?? d.goc]!)
    let doi = 0
    let giu = 0
    for (const clip of ['rai1', 'rai2', 'rai3']) {
      const xs = DOAN.filter((d) => d.clip === clip)
      xs.slice(1).forEach((b, i) => {
        const a = xs[i]!
        if (bass(a) === bass(b)) return
        doi++
        if (lop(a.the).filter((p) => lop(b.the).includes(p)).length >= 2) giu++
      })
    }
    expect(`${giu}/${doi}`).toBe('46/91')
    // các lời trong mục trích đúng những số ấy
    const chu = [...MAN_HOP_SSA.flatMap((m) => m.meo ?? []), ...BAI_SSA.flatMap((d) => d.loi)].join(' ')
    for (const s of ['6/7', '13/15', '3/3', '8/9', '4/4', '3/6', '1/2', '46/91']) expect([s, chu.includes(s)]).toEqual([s, true])
  })

  it('4 màn: ba thế gốc · thêm một nốt · đổi bass · trộn; ví dụ màn 2 viết từ câu thật', () => {
    expect(MAN_HOP_SSA.map((m) => m.ids.length)).toEqual([3, 2, 3, 8])
    expect(MAN_HOP_SSA[1]!.goiY).toBe('Cmaj9 = Đô + Em7 · G13sus4 = Sol + Fmaj7')
    expect(THE_SSA.filter((x) => x.cha).map((x) => [x.id, x.cha])).toEqual([
      ['maj9', 'maj7'],
      ['13sus', '9sus4'],
    ])
  })

  it('mọi câu ở cả 12 gốc: bốn nút khác tên có đáp án; nốt đáp án đúng, nốt nút nhiễu sai', () => {
    for (const id of MAN_HOP_SSA[3]!.ids)
      for (let g = 0; g < 12; g++) {
        const c = taoCauHopSsa(id, g, () => 0.37)
        const ten = c.luaChon.map((l) => l.ten)
        expect([id, g, ten.length, new Set(ten).size, ten.includes(c.dapAnTen)]).toEqual([id, g, 4, 4, true])
        expect([id, g, dungTayPhai([...c.trai, ...c.phai], c)]).toEqual([id, g, true])
        for (const l of c.luaChon.filter((x) => x.ten !== c.dapAnTen)) expect([id, g, l.ten, dungTayPhai([...l.trai, ...l.phai], c)]).toEqual([id, g, l.ten, false])
      }
  })

  it('thế bốn nốt của anh: Cmaj9 = Đô + Em7, C13sus4 = Đô + B♭maj7 — đủ nốt định chất, tay trái chỉ gốc', () => {
    const maj9 = taoCauHopSsa('ssa:maj9', 0, () => 0.37)
    expect([maj9.ten, maj9.dapAnTen, maj9.khungTen, maj9.goiY, lop(maj9.trai), lop(maj9.phai)]).toEqual(['Cmaj9', 'Em7', 'từ Cmaj7: Đô + Em', 'thêm Rê trên đỉnh tay phải', [0], [2, 4, 7, 11]])
    expect(maj9.luaChon.map((l) => l.ten)).toContain('Em') // tay phải của cha — lỗi quên thêm nốt
    const sus = taoCauHopSsa('ssa:13sus', 0, () => 0.37)
    expect([sus.ten, sus.dapAnTen, lop([...sus.trai, ...sus.phai])]).toEqual(['C13sus4', 'B♭maj7', [0, 2, 5, 9, 10]])
    const m7 = taoCauHopSsa('ssa:m7', 2, () => 0.37)
    expect([m7.ten, m7.khungTen, m7.goiY, m7.dapAnTen]).toEqual(['Dm7', 'bass + trưởng trên ♭3', '♭3 của Rê = Fa', 'F'])
    expect(dungTayPhai([65, 69, 72], m7)).toBe(true) // tay phải F, quãng tám nào cũng được
  })

  it('đổi bass: tay phải giữ nguyên, bass phải là nốt thấp nhất; nghe hợp âm cũ rồi mới', () => {
    const c = taoCauHopSsa('ssa:doi:m7>9sus4', 7, () => 0.37) // Dm7 → G9sus4 giữ F
    expect([c.ten, c.the, c.khungTen, c.goiY, c.dapAnTen, c.hoi]).toEqual(['Dm7 → G9sus4', 'giữ tay phải F', '9sus4: bass + trưởng trên ♭7', 'Fa là ♭7 của bass', 'bass Sol', 'bass mới dưới tay phải F'])
    expect(dungTayPhai([43, 65, 69, 72], c)).toBe(true) // Sol2 + Fa – La – Đô
    expect(dungTayPhai([65, 69, 72, 79], c)).toBe(false) // có Sol mà Sol không ở dưới
    expect(dungTayPhai([38, 65, 69, 72], c)).toBe(false) // vẫn bass Rê — chưa đổi
    expect(soCanCham(c, false)).toBe(4)
    expect(c.nghe!.map((h) => [pc(Math.min(...h)), lop(h.filter((m) => m !== Math.min(...h)))])).toEqual([
      [2, [0, 5, 9]],
      [7, [0, 5, 9]],
    ])
    // Fm7 → D♭maj9 giữ Fm7: đúng thế anh bấm ở Rai 3
    const d = taoCauHopSsa('ssa:doi:m7>maj9', 1, () => 0.37)
    expect([d.ten, d.loi.includes('giữ tay phải Fm7 (Fa – La♭ – Đô – Mi♭)')]).toEqual(['Fm7 → C♯maj9', true])
    // D♭maj9 → Fm7: chỉ bỏ bass Rê♭ — tay phải một mình (Fa thấp nhất) là đúng, thêm bass La♭ là sai
    const e = taoCauHopSsa('ssa:doi:maj9>m7', 5, () => 0.37)
    expect([e.ten, dungTayPhai([53, 56, 60, 63], e), dungTayPhai([44, 53, 56, 60, 63], e)]).toEqual(['D♭maj9 → Fm7', true, false])
  })

  it('bài học: ví dụ ▶ phát đúng nốt anh bấm (tay phải lúc đầy nhất + gốc, bậc 5, bass của nhãn); có ví dụ công thức ghi rõ', () => {
    const nghe = BAI_SSA.flatMap((d) => d.nghe)
    expect(nghe.map((n) => n.ten)).toEqual([
      'D♭maj7 (Rai 3 · 1:03)',
      'B♭m7 (Rai 2 · 0:54)',
      'E♭9sus4 (Rai 2 · 0:43)',
      'D♭maj9 (Rai 2 · 0:11)',
      'E♭13sus (Rai 2 · 0:16)',
      'Cmaj9 = Đô + Em7 (công thức)',
      'G13sus4 = Sol + Fmaj7 (công thức)',
      'Cmaj9 → Am9(11) (Rai 1 · 0:00)',
      'Fm7 → D♭maj9 (Rai 3 · 0:50)',
      'B♭m7 → E♭9sus4 (Rai 2 · 0:54)',
      'D♭maj7 → D♭9sus4(add3) → G♭maj9 (Rai 3 · 1:03)',
      'Fm7 → F7/A → B♭m7 (Rai 3 · 1:17)',
      'B♭m7 → B♭7 → E♭m9 (Rai 3 · 0:53)',
      'B♭7(♯11) → C (Rai 1 · 0:43)',
      'G♭m6 (Rai 3 · 0:03)',
      'A♭5 (Rai 2 · 0:00)',
    ])
    for (const n of nghe) for (const h of n.hop) expect([n.ten, h.length >= 2]).toEqual([n.ten, true])
    // D♭maj9 như anh: bass Rê♭, tay phải Fa – La♭ – Đô – Mi♭ (Fm7)
    const dbmaj9 = nghe.find((n) => n.ten === 'D♭maj9 (Rai 2 · 0:11)')!.hop[0]!
    expect([pc(Math.min(...dbmaj9)), lop(dbmaj9)]).toEqual([1, [0, 1, 3, 5, 8]])
    // F7/A: bỏ nốt tay trái đi dần (Sol – La♭) — bass là La
    const f7a = nghe.find((n) => n.ten.startsWith('Fm7 → F7/A'))!.hop[1]!
    expect([pc(Math.min(...f7a)), lop(f7a)]).toEqual([9, [0, 3, 5, 9]])
  })
})
