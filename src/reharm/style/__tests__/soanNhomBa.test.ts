import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { mainChordSpans } from '../../chordTiming'
import { chayBlueSun, chayBluesClaude, KHO_NHOM, nhuongTayTrai, soanCauBlues } from '../boSoanBlues'
import { renderPattern } from '../patternRenderer'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { reharmonize } from '../../reharmEngine/reharmPipeline'

/*
  Bộ Soạn Blues lượt 6 — SOẠN tay phải từ NHÓM BA (3 móc đơn) của Rockhouse và The House of the Rising Sun (ô tick nghe thử).
  Số đo đứng sau các luật: `scripts/phan_tich_blues_ba_sheet.py`.
*/
const pc = (n: number) => ((n % 12) + 12) % 12
// Nốt không thuộc hợp âm mà nửa cung trên (`tranh`: b9 · 11 trên hợp âm trưởng · b13) / trên hoặc dưới (`choi`) một nốt hợp âm.
const hopPc = (c: { root: number; quality: { intervals: readonly number[] } }) => c.quality.intervals.map(v => pc(v + c.root))
const tranh = (c: Parameters<typeof hopPc>[0], x: number) => !hopPc(c).includes(pc(x)) && hopPc(c).includes(pc(x - 1))
const choi = (c: Parameters<typeof hopPc>[0], x: number) => !hopPc(c).includes(pc(x)) && (hopPc(c).includes(pc(x - 1)) || hopPc(c).includes(pc(x + 1)))
const T = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const nm = (m: number) => T[m % 12]! + String(Math.floor(m / 12) - 1)
const BAI = [
  ['Em C D Em Am Em B7 Em Em G A7 C7 Em G B7 B7', { tonic: 4, scale: 'minor' }],
  ['Am Dm E7 Am F G C E7 Am Dm Am E7', { tonic: 9, scale: 'minor' }],
  ['C Am F G7 C Am Dm G7 C C7 F Fm C G7 C C', { tonic: 0, scale: 'major' }],
  ['G G7 C C G Em A7 D7 G C G D7', { tonic: 7, scale: 'major' }],
] as const
const theoId = new Map(KHO_NHOM.map(n => [n.id, n]))
const soan = (vong: string, key: { tonic: number; scale: string }, take: number, nguon: 'ray' | 'sun', bamHop = false) =>
  soanCauBlues(mainChordSpans(parseChordInput(vong).chords, 3), {
    key, take, uuTien: nguon, tam: nguon === 'sun' ? [55, 96] : [45, 88], chiGiaiDieu: nguon === 'sun',
    day: o => o % 4 === 3, muc: nguon === 'sun' ? { thua: [3, 6], day: [5, 9] } : { thua: [1, 3], day: [3, 6] }, luc: () => 70, bamHop,
  })

// Test quét nhiều bài × lượt: chạy riêng 1–3 s, chạy chung cả bộ tới 7,6 s — nới thời hạn như `boSoanBlues.test.ts`.
describe('Bộ Soạn Blues lượt 6 — soạn từ nhóm ba của ba sheet', { timeout: 30_000 }, () => {
  it('kho nhóm ba: Rockhouse (nửa ô × 2, bỏ nửa ô đổi hợp âm và đuôi kết) + Rising Sun 16 ô × 2; mọi cú nằm trong 3 móc đơn', () => {
    expect(KHO_NHOM.filter(n => n.nguon === 'sun').length).toBe(32)
    expect(KHO_NHOM.filter(n => n.nguon === 'ray').length).toBeGreaterThan(400)
    for (const n of KHO_NHOM) {
      for (const [t] of n.su) expect(t >= -1e-6 && t < 3 - 1e-6, n.id).toBe(true)
      if (n.ke) expect(theoId.has(n.ke), `${n.id} → ${n.ke}`).toBe(true)
    }
  })

  it('MỖI NỐT truy được nguồn (lượt 6 và 7): nhóm ba của sheet, chỉ dời theo giọng + quãng tám cả nhóm — không sửa nốt', () => {
    for (const [vong, key] of BAI) for (const nguon of ['ray', 'sun'] as const) for (const [take, bamHop] of [[0, false], [1, true], [2, true]] as const) {
      const r = soan(vong, key, take, nguon, bamHop)
      const theoNhom = new Map<number, typeof r.events>()
      for (const e of r.events) {
        const j = Math.floor(e.startBeat / 1.5 + 1e-6)
        theoNhom.set(j, [...(theoNhom.get(j) ?? []), e])
      }
      r.nguon.forEach((id, j) => {
        const ev = theoNhom.get(j) ?? []
        if (id === 'nghi') return expect(ev).toEqual([])
        const n = theoId.get(id)!
        const goc = n.su.filter(s => s[0] < 3 - 1e-6)
        expect(ev.length, `${vong} ${id}`).toBe(goc.length)
        // Một phép dời cho cả nhóm, và phép dời ấy ≡ phép dời theo giọng (mod 12).
        const doi = new Set(ev.flatMap((e, k) => e.notes.map((x, m) => x - goc[k]![2][m]!)))
        expect(doi.size, `${vong} ${id}`).toBe(1)
        const theoGiong = n.nguon === 'ray' ? (key.scale === 'minor' ? key.tonic + 3 : key.tonic) - 7 : (key.scale === 'minor' ? key.tonic : key.tonic + 9) - 4
        expect(pc([...doi][0]! - theoGiong), `${vong} ${id}`).toBe(0)
        ev.forEach((e, k) => expect(Math.abs((e.startBeat - j * 1.5) * 2 - goc[k]![0])).toBeLessThan(1e-6))
      })
    }
  })

  it('SOẠN chứ không chép: khoảng một nửa chỗ nối đi đúng câu sheet, còn lại nối mới; không chép liền quá 2 ô', () => {
    for (const nguon of ['ray', 'sun'] as const) {
      let lien = 0, noi = 0, dai = 0
      for (const [vong, key] of BAI) for (let take = 0; take < 6; take++) {
        const r = soan(vong, key, take, nguon)
        let run = 1
        r.nguon.forEach((id, j) => {
          if (!j || id === 'nghi' || r.nguon[j - 1] === 'nghi') return
          if (theoId.get(r.nguon[j - 1]!)!.ke === id) { lien++; run++ } else { noi++; run = 1 }
          dai = Math.max(dai, run)
        })
      }
      console.log(`lượt 6 (${nguon}): nối đúng câu sheet ${lien} · nối mới ${noi} · chép liền dài nhất ${dai} nhóm`)
      expect(lien / (lien + noi)).toBeGreaterThan(.25)
      expect(lien / (lien + noi)).toBeLessThan(.65)
      expect(dai).toBeLessThanOrEqual(5)
    }
  })

  it('Blue Sun: cùng độ dày lượt 3 (ô thưa trung vị 8 cú, ô dày 15) — ô tick chỉ đổi cách soạn; phách 1 · 4 trên i là 1 · b3 · 5', () => {
    const cu = { day: [] as number[], thua: [] as number[] }
    let tot = 0, tong = 0
    for (const [vong, key] of BAI.slice(0, 3)) for (let take = 0; take < 6; take++) {
      const chords = parseChordInput(vong).chords
      const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take, soan: true })
      chords.forEach((c, o) => {
        const r = ev.filter(e => e.startBeat >= o * 3 - 1e-9 && e.startBeat < o * 3 + 3 - 1e-9)
        cu[o % 4 === 3 ? 'day' : 'thua'].push(r.length)
        if (key.scale !== 'minor' || pc(c.root - key.tonic) !== 0) return
        for (const e of r) {
          const t = (e.startBeat - o * 3) * 2
          if (Math.abs(t) > .2 && Math.abs(t - 3) > .2 && t < 5.8) continue
          tong++
          if ([0, 3, 7].includes(pc(e.notes.at(-1)! - key.tonic))) tot++
        }
      })
    }
    const md = (a: number[]) => [...a].sort((x, y) => x - y)[a.length >> 1]!
    console.log(`Blue Sun lượt 6: ô thưa trung vị ${md(cu.thua)} cú · ô dày ${md(cu.day)} · phách 1·4 trên i là 1·b3·5 ${tot}/${tong}`)
    expect(md(cu.thua)).toBeGreaterThanOrEqual(6)
    expect(md(cu.thua)).toBeLessThanOrEqual(10)
    expect(md(cu.day)).toBeGreaterThan(md(cu.thua))
    // Phách mạnh ±0,2 móc (như phép đo trên sheet). Bản đầu chỉ tính cú đúng phách, ra 87/89 — sai; đúng: 112/130.
    expect(tot / tong).toBeGreaterThan(.8)
  })

  it('có lời: ô dày ở ô ca sĩ hết câu', () => {
    const chords = parseChordInput('Em G7 A7 C7').chords
    for (let take = 0; take < 6; take++) {
      const ev = chayBlueSun(chords, { key: { tonic: 4, scale: 'minor' }, beatsPerChord: 3, take, breaths: new Set([1, 3]), soan: true })
      const so = [0, 1, 2, 3].map(o => ev.filter(e => e.startBeat >= o * 3 - 1e-9 && e.startBeat < o * 3 + 3 - 1e-9).length)
      expect(Math.min(so[1]!, so[3]!), `lượt ${take}: ${so}`).toBeGreaterThan(Math.max(so[0]!, so[2]!) - 3)
      expect(so[1]! + so[3]!, `lượt ${take}: ${so}`).toBeGreaterThan(so[0]! + so[2]!)
    }
  })

  it('không phô: bài giọng thứ — 0 nốt lạc giọng (bậc b2 · 3 · 6 trưởng), trừ nốt lướt nửa cung của sheet', () => {
    for (const [vong, key] of BAI.slice(0, 2)) for (const nguon of ['ray', 'sun'] as const) for (let take = 0; take < 6; take++) {
      const ev = soan(vong, key, take, nguon).events
      ev.forEach((e, i) => {
        for (const n of e.notes) {
          const ke = [...(ev[i - 1]?.notes ?? []), ...(ev[i + 1]?.notes ?? []), ...e.notes]
          if (ke.includes(n - 1) || ke.includes(n + 1)) continue
          expect([1, 4, 9].includes(pc(n - key.tonic)), `${vong} ${nguon} lượt ${take} ${nm(n)}`).toBe(false)
        }
      })
    }
  })

  it('dạo · giang · kết qua ô tick: hai nút, hai giọng, ba đoạn — có tay phải; giọng thứ đổi lượt hai khung Đức Thịnh và khung Rising Sun (III7)', () => {
    for (const id of ['blue-sun']) {
      const style = getStyle(id)!
      for (const scale of ['major', 'minor']) for (const kind of ['intro', 'interlude', 'outro'] as const) {
        const s = buildPhraseSection({ kind, key: { tonic: 7, scale } as never, style, beatsPerChord: 3, dropRoot: false, opening: null,
          solo: () => [], take: 0, bluesSoan: true })!
        expect(s.unavailableReason, `${id} ${scale} ${kind}`).toBeUndefined()
        expect(s.events.some(e => e.hand === 'right'), `${id} ${scale} ${kind}`).toBe(true)
        expect(s.adaptationNote).toContain('lượt 6')
      }
      const hai = [0, 1, 2].map(take => buildPhraseSection({ kind: 'interlude', key: { tonic: 4, scale: 'minor' } as never, style,
        beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take, bluesSoan: true })!.chords)
      expect(hai.some(k => k.includes('G7')), JSON.stringify(hai)).toBe(true)
    }
  })

  it('câu chèn Blues Claude: nằm trọn trong cửa sổ fill, không quá vạch ô; cửa sổ ngắn hơn một nhóm ba → null', () => {
    const chord = parseChordInput('C7').chords[0]!
    for (let take = 0; take < 6; take++) {
      const r = chayBluesClaude({ chord, next: chord, endBeat: 12, beats: 3, take, key: { tonic: 0, scale: 'major' }, mocDon: .5, soan: true })
      expect(r).not.toBeNull()
      for (const n of r!) {
        expect(n.startBeat).toBeGreaterThanOrEqual(9 - 1e-9)
        expect(n.startBeat + n.durationBeats).toBeLessThanOrEqual(12 + 1e-9)
      }
      const ngan = chayBluesClaude({ chord, next: chord, endBeat: 12, beats: 1.2, take, key: { tonic: 0, scale: 'major' }, mocDon: .5, soan: true })
      expect(ngan).toBeNull()
    }
  })

  it('đủ nhanh cho một bài dài (72 ô)', () => {
    const chords = parseChordInput(Array(9).fill('Em C D Em Am Em B7 Em').join(' ')).chords
    const t0 = performance.now()
    chayBlueSun(chords, { key: { tonic: 4, scale: 'minor' }, beatsPerChord: 3, take: 5, soan: true })
    expect(performance.now() - t0).toBeLessThan(2000)
  })
})

/*
  Lượt 12 — theo lời người dùng tả video Đức Thịnh: câu chạy ở CUỐI mỗi câu hát, trọn, rơi đúng phách chuyển hợp âm; trong câu hát
  nốt nhẹ đều; TAY TRÁI nối sang hợp âm sau. Bài người dùng thử: "Thành phố nào nhớ không em" — mỗi dòng lời 2 hợp âm, mỗi hợp âm 1 ô.
*/
describe('Blue Sun — Bản Blues rút gọn (lượt 12): chạy ngón cuối câu hát, nốt nhẹ trong câu, tay trái nối hợp âm', { timeout: 60_000 }, () => {
  const vong = 'Em(add9) Gadd2 Bm7 Em(add9) Gadd2 Em(add9) Am9 Em(add9) D9 Bm7'
  const breaths = new Set([1, 3, 5, 7, 9])
  const singing = new Set([0, 2, 4, 6, 8])
  const key = { tonic: 4, scale: 'minor' }
  const dung = (take: number) => chayBlueSun(parseChordInput(vong).chords, { key, beatsPerChord: 3, take, breaths, singing, soan: true, luot12: true })
  const trong = <T extends { startBeat: number }>(ev: T[], tu: number, den: number) => ev.filter(e => e.startBeat >= tu - 1e-9 && e.startBeat < den - 1e-9)

  it('ô hết câu: câu chạy nửa sau ô; câu sau: nốt đáp ĐÚNG PHÁCH 1, là nốt của hợp âm mới', () => {
    const chords = parseChordInput(vong).chords
    for (let take = 0; take < 8; take++) {
      const phai = dung(take).filter(e => e.hand === 'right')
      for (const o of [1, 3, 5, 7]) {
        expect(trong(phai, o * 3 + 1.5, o * 3 + 3).length, `lượt ${take} ô ${o + 1}`).toBeGreaterThanOrEqual(4)
        const dap = trong(phai, (o + 1) * 3, (o + 1) * 3 + .15)
        expect(dap.length, `lượt ${take} — đáp phách 1 ô ${o + 2}`).toBeGreaterThan(0)
        const c = chords[o + 1]!
        expect(c.quality.intervals.map(pc).includes(pc(dap[0]!.notes.at(-1)! - c.root)), `lượt ${take} ô ${o + 2}`).toBe(true)
      }
    }
  })

  it('ô đang hát: ngoài nốt đáp đầu ô, chỉ nốt NHẸ (lực < 50), ≤ 2 cú, không ở phách mạnh', () => {
    for (let take = 0; take < 8; take++) {
      const phai = dung(take).filter(e => e.hand === 'right')
      for (const o of singing) {
        const r = trong(phai, o * 3 + .75, o * 3 + 3)
        expect(r.length, `lượt ${take} ô ${o + 1}`).toBeLessThanOrEqual(2)
        for (const e of r) {
          expect(e.velocity, `lượt ${take} ô ${o + 1}`).toBeLessThan(50)
          expect(Math.abs(e.startBeat - o * 3 - 1.5), `lượt ${take} ô ${o + 1} — phách 4`).toBeGreaterThan(.15)
        }
      }
    }
  })

  it('tay trái: chỗ đổi hợp âm có nốt nối TRONG GIỌNG, KHÔNG CHÓI, trước phách 1 hợp âm mới; ô hết câu đi 2 bậc âm giai vào gốc mới', () => {
    // Bản 2 (người dùng: "các hợp âm khi đánh đệm nghe bị phô"): bản 1 đi nửa cung theo cao độ tuyệt đối → Db4 · Ab3 · Bb3 · F3 · Eb3
    // ngoài giọng Mi thứ ở quãng tám 3. Bản 3 ("chỗ D9 … nghe chói tai hơn"): không nốt nào sạch thì bỏ nốt nối — nên không còn MỌI chỗ.
    const chords = parseChordInput(vong).chords
    const giong = new Set([0, 2, 3, 5, 7, 8, 10].map(x => pc(x + 4)))
    let co = 0, tong = 0
    for (let take = 0; take < 8; take++) {
      const ev = dung(take)
      const trai = ev.filter(e => e.hand === 'left')
      for (let o = 0; o < chords.length - 1; o++) {
        const r = trong(trai, o * 3 + 1.9, o * 3 + 3)
        const goc = chords[o + 1]!.root
        tong++
        if (r.length) co++
        for (const e of r) {
          expect(choi(chords[o]!, e.notes[0]!), `lượt ${take} ô ${o + 1}: ${nm(e.notes[0]!)} chói trên ${chords[o]!.symbol}`).toBe(false)
          expect(ev.some(p => p.hand === 'right' && p.startBeat < e.startBeat + e.durationBeats - 1e-6 &&
            p.startBeat + p.durationBeats > e.startBeat + 1e-6 && p.notes.some(x => [1, 11].includes(pc(x - e.notes[0]!)))),
          `lượt ${take} ô ${o + 1}: ${nm(e.notes[0]!)} chồng nửa cung lên tay phải`).toBe(false)
          expect(giong.has(pc(e.notes[0]!)), `lượt ${take} ô ${o + 1}: ${e.notes[0]}`).toBe(true)
          // quanh quãng tám 3 (gốc mới C3–B3; đi chuỗi từ dưới vào C3 thì xuống A2 · B2)
          expect(e.notes[0]!).toBeGreaterThanOrEqual(45)
          expect(e.notes[0]!).toBeLessThanOrEqual(62)
        }
        const cach = r.map(e => ((pc(e.notes[0]! - goc) + 6) % 12) - 6)
        if (!r.length) continue
        if (breaths.has(o) && r.length === 2) {
          // hai bậc âm giai đi về phía gốc mới: cùng phía, nốt sau gần gốc hơn, bước cuối ≤ 1 cung
          expect(Math.sign(cach[0]!) === Math.sign(cach[1]!) && Math.abs(cach[1]!) < Math.abs(cach[0]!) && Math.abs(cach[1]!) <= 2,
            `lượt ${take} ô ${o + 1}: ${cach}`).toBe(true)
        } else expect([-2, -1, 1, 2, -5, 0].includes(cach[0]!), `lượt ${take} ô ${o + 1}: ${cach}`).toBe(true)
      }
    }
    // Số đo (hai bài × 6 lượt, đo lúc sửa): 77/90 · 82/90 chỗ đổi hợp âm còn nốt nối.
    expect(co / tong, `${co}/${tong}`).toBeGreaterThanOrEqual(.75)
  })

  it('ô D9 hết câu ("Thành phố buồn"): tay trái không đi G3 chồng lên F#; tay phải không nốt tránh ở phách mạnh / ngân; đáp toàn nốt hợp âm', () => {
    // Người dùng: "Khi tick vào ô Blues rút gọn thì chỗ D9 chơi nghe chói tai hơn". Trước khi sửa: G3 · F#3 vào Em (G3 = bậc 11 trên
    // D9) · G4 / G5 ngân trên D9 · đáp C5+E5 trên Em9 (C = b13; bộ lọc cũ chỉ xét nốt đỉnh).
    for (const sau of ['Em9', 'G6/9', 'Am9', 'C6/9', 'Bm7']) {
      const chords = parseChordInput(`Bm7 D9 ${sau} Em9`).chords
      for (let take = 0; take < 4; take++) {
        const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take, breaths: new Set([1, 3]), singing: new Set([0, 2]), soan: true, luot12: true })
        const d9 = chords[1]!
        for (const e of trong(ev.filter(e => e.hand === 'left'), 3, 6)) for (const n of e.notes)
          expect(choi(d9, n), `→ ${sau} lượt ${take}: tay trái ${nm(n)}`).toBe(false)
        const phai = ev.filter(e => e.hand === 'right')
        for (const [k, e] of phai.entries()) {
          if (e.startBeat < 3 - 1e-6 || e.startBeat >= 6 - 1e-6) continue
          const vt = ((e.startBeat - 3) * 2) % 3
          const lo = vt < .2 || vt > 2.8 || e.durationBeats >= .5 - 1e-6 || !phai[k + 1] || phai[k + 1]!.startBeat >= 6 - 1e-6
          if (lo) for (const n of e.notes) expect(tranh(d9, n), `→ ${sau} lượt ${take}: tay phải ${nm(n)} ở ${e.startBeat}`).toBe(false)
        }
        const c = chords[2]!
        for (const e of trong(phai, 6, 6.15)) for (const n of e.notes)
          expect(c.quality.intervals.map(v => pc(v + c.root)).includes(pc(n)), `→ ${sau} lượt ${take}: đáp ${nm(n)}`).toBe(true)
      }
    }
  })

  it('nhuongTayTrai: bỏ nốt dẫn cũ phách 6 của cell, giữ bass phách 1 và hợp âm phách 4', () => {
    const chords = parseChordInput(vong).chords
    const dem = renderPattern(voiceLeadTwoHands(chords), getStyle('blue-sun')!, { beatsPerChord: 3 })
    const fill = dung(0)
    const con = nhuongTayTrai(dem, fill)
    for (let o = 0; o < chords.length - 1; o++) {
      const trai = trong(con.filter(e => e.hand === 'left'), o * 3, o * 3 + 3)
      expect(trai.some(e => Math.abs(e.startBeat - o * 3) < 1e-6), `ô ${o + 1} phách 1`).toBe(true)
      expect(trai.some(e => Math.abs(e.startBeat - o * 3 - 1.5) < 1e-6), `ô ${o + 1} phách 4`).toBe(true)
      expect(trai.some(e => Math.abs(e.startBeat - o * 3 - 2.5) < 1e-6), `ô ${o + 1} — nốt dẫn cũ phách 6`).toBe(false)
    }
  })

  it('mỗi lần bấm phát ra khác: câu chạy và kiểu nốt nối đổi giữa các lượt', () => {
    const ban = new Set([0, 1, 2, 3, 4, 5].map(t => dung(t).map(e => `${e.hand}${e.startBeat.toFixed(2)}:${e.notes.join('+')}`).join(' ')))
    expect(ban.size).toBeGreaterThanOrEqual(5)
  })
})

/*
  Hợp âm lướt Blues ở cuối đoạn (ô tick) — tay trái đánh hợp âm lướt ở cú phách 4 (giữ tiết tấu Bùm₁ · Chát₄ · dẫn₆ đã duyệt), tay phải
  Bản Blues rút gọn soạn theo hợp âm ĐANG VANG (hợp âm lướt) chứ không theo hợp âm chính của nhịp.
*/
describe('Blue Sun — hợp âm lướt cuối đoạn: tay trái phách 4, tay phải theo hợp âm đang vang', { timeout: 60_000 }, () => {
  const key = { tonic: 4, scale: 'minor' as const }
  const sectionRanges = [{ kind: 'verse', from: 0, to: 3 }, { kind: 'chorus', from: 4, to: 7 }]
  const hop = reharmonize(parseChordInput('Em(add9) Gadd2 Bm7 B7 Em(add9) Am9 D9 Em(add9)').chords,
    { key, harmonyStyle: 'blue-sun', bluesLuot: true, beatsPerChord: 3, sectionRanges }).harmonic
  const lot = hop.find(c => c.passing)!

  it('hợp âm lướt F7 chiếm nửa sau ô cuối đoạn (ô 4); tay trái đánh nó ở phách 4, bass phách 1 vẫn là gốc hợp âm chính', () => {
    expect(lot.symbol).toBe('F7')
    const beatsEach = hop.map(c => c.beats ?? 3)
    const trai = renderPattern(voiceLeadTwoHands(hop), getStyle('blue-sun')!, { beatsPerChord: 3, beatsEach }).filter(e => e.hand === 'left')
    const p4 = trai.find(e => Math.abs(e.startBeat - 10.5) < 1e-6)!
    const p1 = trai.find(e => Math.abs(e.startBeat - 9) < 1e-6)!
    expect(p4.notes.map(pc).every(x => lot.quality.intervals.map(v => pc(v + lot.root)).includes(x)), JSON.stringify(p4.notes)).toBe(true)
    expect(pc(Math.min(...p1.notes))).toBe(11)
  })

  it('tay phải (Bản Blues rút gọn): nốt phách mạnh trong nửa ô hợp âm lướt là nốt của hợp âm lướt hoặc trong giọng', () => {
    const giong = new Set([0, 2, 3, 5, 7, 8, 10].map(x => pc(x + 4)))
    const ct = new Set(lot.quality.intervals.map(v => pc(v + lot.root)))
    for (let take = 0; take < 6; take++) {
      const phai = chayBlueSun(hop, { key, beatsPerChord: 3, take, breaths: new Set([1, 3, 5, 7]), singing: new Set([0, 2, 4, 6]),
        soan: true, luot12: true }).filter(e => e.hand === 'right' && e.startBeat >= 10.5 - 1e-6 && e.startBeat < 12 - 1e-6)
      for (const e of phai.filter(e => (e.startBeat - 10.5) * 2 < .2)) {
        for (const n of e.notes) expect(ct.has(pc(n)) || giong.has(pc(n)), `lượt ${take}: ${n}`).toBe(true)
      }
    }
  })
})
