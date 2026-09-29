import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chayBluesClaude, datTheoGiong, KHO_O } from '../boSoanBlues'

/*
  Bộ Soạn Blues — thước đo "phô" (người dùng 28/9/2026: "giai điệu còn phô"):
    · LẠC GIỌNG: nốt ngoài giọng + nốt blue — trưởng: b2 · b6; thứ: b2 · 3 · 6 trưởng, 7 trưởng ngoài hợp âm V.
    · CHỎI HỢP ÂM: nốt ở phách 1 · 4 hoặc ngân ≥ 1 phách máy là nốt tránh so gốc hợp âm — trưởng/bảy: b9 · 4 · #4 · b6
      (+ 7 trưởng trên hợp âm bảy); thứ: b9 · 3 · b5 · 7.
  Thước CHẶT (không trừ gì), cùng cách đo hai lượt — lượt 4 (câu dời theo gốc từng hợp âm) → lượt 5:
    solo thứ lạc 12,0% → 0 · chỏi 3,3% → 2,3%; câu chèn thứ lạc 14,7% → 0; giọng trưởng ngang nhau (solo 3,3% · 5,7% →
    3,0% · 5,4%: nốt láy và lối của chính Ray). Test dưới đây dùng thước ĐÃ TRỪ nốt láy, chủ âm trên V, b5 của chủ trên I.
*/
const pc = (n: number) => ((n % 12) + 12) % 12
const lac = (p: number, minor: boolean, laV: boolean) =>
  minor ? [1, 4, 9].includes(p) || (p === 11 && !laV) : [1, 8].includes(p)
const choi = (p: number, thu: boolean, bay: boolean) =>
  thu ? [1, 4, 6, 11].includes(p) : [1, 5, 6, 8].includes(p) || (bay && p === 11)
// Nốt láy (láy chồng nửa cung / trượt nửa cung vào nốt sau) — kỹ thuật của Ray, không tính là phô.
type Ev = { startBeat: number; durationBeats: number; notes: readonly number[] }
const lay = (evs: readonly Ev[], i: number, n: number) => {
  const e = evs[i]!
  if (e.notes.includes(n + 1)) return true
  const s = evs[i + 1]
  return !!s && e.durationBeats <= .5 + 1e-9 && s.startBeat - e.startBeat <= .5 + 1e-9 && (s.notes.includes(n + 1) || s.notes.includes(n - 1))
}
// Chủ âm trên V (Ray: 17% phách mạnh trên V) và b5 của chủ trên I (nốt blue) không tính là chỏi.
const mien = (f: number, k: number) => (f === 7 && k === 0) || (f === 0 && k === 6)
// Test solo dạo · giang · kết của nút Blues Claude (nửa ô Ray) đã xoá cùng nút 29/9/2026 — Slow Blues có test riêng ở bluesClaude.test.ts.

describe('Bộ Soạn Blues — không phô', () => {
  it('câu chèn đoạn hát: 0 nốt lạc giọng, 0 nốt tránh — 6 vòng bài Việt (3 thứ, 3 trưởng) × 6 lượt, không hợp âm nào trống', () => {
    const bai = [['minor', 9, 'Am Dm E7 Am F G C E7'], ['minor', 4, 'Em Am B7 Em C D G B7'], ['minor', 2, 'Dm Gm A7 Dm Bb C F A7'],
      ['major', 0, 'C Am F G Em Dm G7 C'], ['major', 7, 'G Em C D Bm Am D7 G'], ['major', 5, 'F Dm Bb C Am Gm C7 F']] as const
    for (const [scale, tonic, vong] of bai) {
      const ch = parseChordInput(vong).chords
      ch.forEach((c, i) => {
        for (let take = 0; take < 6; take++) {
          const ra = chayBluesClaude({ chord: c, next: ch[(i + 1) % ch.length]!, endBeat: 3, beats: 3, take, key: { tonic, scale }, mocDon: .5 })
          expect(ra, `${vong} · ${c.symbol} lượt ${take}`).not.toBeNull()
          const thu = c.quality.intervals.includes(3) && !c.quality.intervals.includes(4)
          const f = pc(c.root - tonic)
          const by = new Map<number, number[]>(), du = new Map<number, number>()
          for (const x of ra!) { by.set(x.startBeat, [...(by.get(x.startBeat) ?? []), x.note]); du.set(x.startBeat, x.durationBeats) }
          const evs = [...by].sort((a, b) => a[0] - b[0]).map(([t, ns]) => ({ startBeat: t, durationBeats: du.get(t)!, notes: ns }))
          evs.forEach((e, idx) => {
            for (const note of e.notes) {
              if (scale === 'minor') expect(lac(pc(note - tonic), true, f === 7), `${c.symbol}: lạc (cả nốt láy)`).toBe(false)
              if (lay(evs, idx, note)) continue
              expect(lac(pc(note - tonic), scale === 'minor', f === 7), `${c.symbol}: lạc`).toBe(false)
              const manh = Math.abs((e.startBeat / 1.5) % 1) < 1e-6 || e.durationBeats >= 1 - 1e-9
              if (manh && !mien(f, pc(note - tonic))) {
                expect(choi(pc(note - c.root), thu, c.quality.intervals.includes(10)), `${c.symbol}: chỏi`).toBe(false)
              }
            }
          })
        }
      })
    }
  })

  it('bám giọng, không bám hợp âm: câu chèn trên mọi hợp âm là nửa ô Ray dời MỘT phép theo giọng (ngược lại ra đúng nốt sheet)', () => {
    const key = { tonic: 7, scale: 'major' }
    for (const ten of ['G', 'C7', 'D7', 'Em', 'Am']) {
      const ra = chayBluesClaude({ chord: parseChordInput(ten).chords[0]!, next: parseChordInput('G').chords[0]!, endBeat: 3, beats: 3,
        take: 0, key, mocDon: .5 })!
      const nguon = new Set(KHO_O.flatMap(o => o.su.flatMap(s => s[2].map(n => pc(n)))))
      for (const x of ra) expect(nguon.has(pc(x.note))).toBe(true)
    }
    // Giọng thứ: vật liệu ở giọng trưởng tương đối — La thứ dùng câu Ray dời sang Đô (G → C), không sửa nốt.
    const o = KHO_O.find(x => x.su.length > 3 && x.ham === 0)!
    const la = datTheoGiong(o, { tonic: 9, scale: 'minor' })!
    const doTruong = datTheoGiong(o, { tonic: 0, scale: 'major' })!
    expect(la.map(s => s.notes)).toEqual(doTruong.map(s => s.notes))
  })

})
