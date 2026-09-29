import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { buildPhraseSection } from '../phraseSection'
import { TWIST } from '../styleLibrary/twist'
import { chayBlueSun, chayTwistBlues } from '../boSoanBlues'

/*
  Twist · Bộ Soạn Blues — mặc định từ 29/9/2026 (cùng ngày là ô tick nghe thử). Người dùng: câu chạy "ít nốt hơn trong Slow Blues nhưng vẫn giữ đủ kết cấu",
  "thưa ra, chủ yếu đặt ở cuối câu hát và nên có nốt dẫn qua hợp âm kế tiếp", riff kiểu Blues, và kỹ thuật Blues khác trong đệm hát.
*/
const pc = (n: number) => ((n % 12) + 12) % 12
const BAI = [
  ['C Am F G C Am Dm G', { tonic: 0, scale: 'major' }],
  ['G C D7 G Em A7 D7 G', { tonic: 7, scale: 'major' }],
  ['Am Dm E7 Am F G C E7', { tonic: 9, scale: 'minor' }],
  ['Em C D Em Am Em B7 Em', { tonic: 4, scale: 'minor' }],
] as const
const breaths = new Set([1, 3, 5, 7])
const sectionEnds = new Set([3])
const LUOT = 6
const trongPhach = (t: number) => [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4].some(x => Math.abs(pc12(t) - x) < 1e-6)
const pc12 = (t: number) => t - Math.floor(t + 1e-9)
const tv = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]!

describe('Twist · Bộ Soạn Blues — đệm hát', { timeout: 60_000 }, () => {
  const moi = (vong: string, key: { tonic: number; scale: string }, take: number) => {
    const chords = parseChordInput(vong).chords
    const backing = renderPattern(voiceLeadTwoHands(chords), TWIST, { beatsPerChord: 8 })
    return { chords, backing, r: chayTwistBlues(chords, { key, beatsPerChord: 8, take, breaths, sectionEnds, backing }) }
  }

  it('câu chạy CHỈ ở 2–3 phách cuối hợp âm hết câu; cú đáp đúng phách 1 hợp âm sau, là nốt hợp âm mới, cách nốt cuối câu 1–2 nửa cung', () => {
    let coDap = 0, tong = 0
    for (const [vong, key] of BAI) for (let take = 0; take < LUOT; take++) {
      const { chords, r } = moi(vong, key, take)
      const phai = r.events.filter(e => e.hand === 'right' && !e.grace)
      for (const e of phai) {
        const i = Math.floor(e.startBeat / 8 + 1e-9)
        const trongCau = breaths.has(i) && e.startBeat >= (i + 1) * 8 - 3 - 1e-6
        const dap = breaths.has(i - 1) && e.startBeat < i * 8 + .5 + 1e-6
        expect(trongCau || dap, `${vong} lượt ${take}: nốt ở phách ${e.startBeat}`).toBe(true)
        // Nốt đơn hoặc bè đôi — như tay phải solo của sheet Twist (76% bè đôi).
        expect(e.notes.length, `${vong} lượt ${take} phách ${e.startBeat}`).toBeLessThanOrEqual(2)
        expect(trongPhach(e.startBeat), `${vong} lượt ${take}: ${e.startBeat} lệch lưới chùm ba / móc kép`).toBe(true)
      }
      for (const i of [1, 3, 5]) {
        const cau = phai.filter(e => e.startBeat >= (i + 1) * 8 - 3 - 1e-6 && e.startBeat < (i + 1) * 8 - 1e-6)
        expect(cau.length, `${vong} lượt ${take} hợp âm ${i}`).toBeGreaterThanOrEqual(2)
        const dap = phai.filter(e => e.startBeat >= (i + 1) * 8 - 1e-6 && e.startBeat < (i + 1) * 8 + .1)
        tong++
        if (!dap.length) continue
        coDap++
        const c = chords[i + 1]!
        for (const n of dap[0]!.notes) expect(c.quality.intervals.map(pc).includes(pc(n - c.root)), `${vong} lượt ${take}: đáp ${n} trên ${c.symbol}`).toBe(true)
        const buoc = Math.abs(dap[0]!.notes.at(-1)! - cau.at(-1)!.notes.at(-1)!)
        expect(buoc >= 1 && buoc <= 2, `${vong} lượt ${take} hợp âm ${i}: bước ${buoc}`).toBe(true)
      }
    }
    // Đo lúc sửa: 72/72.
    expect(coDap / tong, `${coDap}/${tong}`).toBeGreaterThanOrEqual(.9)
  })

  it('câu chạy ÍT CÚ hơn Slow Blues (Bản Blues rút gọn) — đo cùng một cách trên cùng bài', () => {
    const cuTwist: number[] = [], cuSun: number[] = []
    for (const [vong, key] of BAI) for (let take = 0; take < LUOT; take++) {
      const { chords, r } = moi(vong, key, take)
      const sun = chayBlueSun(chords, { key, beatsPerChord: 3, take, breaths, singing: new Set([0, 2, 4, 6]), soan: true, luot12: true })
      for (const i of breaths) {
        cuTwist.push(r.events.filter(e => e.hand === 'right' && !e.grace && e.startBeat >= (i + 1) * 8 - 3 - 1e-6 && e.startBeat < (i + 1) * 8 - 1e-6).length)
        // Slow Blues: câu chạy ở ô hết câu (lực > 50 — bỏ nốt nhẹ trong câu hát).
        cuSun.push(sun.filter(e => e.hand === 'right' && e.velocity > 50 && e.startBeat >= i * 3 - 1e-6 && e.startBeat < (i + 1) * 3 - 1e-6).length)
      }
    }
    // Đo lúc sửa (4 bài × 6 lượt × 4 câu): Twist trung vị 4 (2–7) · Slow Blues 6 (4–13).
    expect(tv(cuTwist), `Twist ${tv(cuTwist)} · Slow Blues ${tv(cuSun)}`).toBeLessThan(tv(cuSun))
    expect(Math.min(...cuTwist)).toBeGreaterThanOrEqual(2)
  })

  it('riff: có câu lặp liền một hình (hình ngắn lặp lại như Slow Blues), không phải lúc nào cũng lặp', () => {
    let lap = 0, tong = 0
    for (const [vong, key] of BAI) for (let take = 0; take < LUOT; take++) {
      const { r } = moi(vong, key, take)
      for (const i of breaths) {
        const cau = r.events.filter(e => e.hand === 'right' && !e.grace && e.startBeat >= (i + 1) * 8 - 3 - 1e-6 && e.startBeat < (i + 1) * 8 - 1e-6)
        const hinh = (b: number) => cau.filter(e => Math.floor(e.startBeat + 1e-9) === b).map(e => `${pc12(e.startBeat).toFixed(2)}:${e.notes}`).join(' ')
        const b0 = (i + 1) * 8 - 2
        tong++
        if (hinh(b0) && hinh(b0) === hinh(b0 + 1)) lap++
      }
    }
    expect(lap, `${lap}/${tong}`).toBeGreaterThan(0)
    expect(lap / tong, `${lap}/${tong}`).toBeLessThan(.6)
  })

  it('phần đệm nhường: chỉ bỏ cú chặn tay phải trong lúc chạy; cú chặn đầu hợp âm (vang cùng cú đáp) giữ nguyên', () => {
    for (const [vong, key] of BAI) for (let take = 0; take < LUOT; take++) {
      const { backing, r } = moi(vong, key, take)
      const chanCu = backing.filter(e => e.hand === 'right')
      const chanMoi = r.backing.filter(e => e.hand === 'right')
      for (const e of chanCu) {
        const con = chanMoi.some(x => Math.abs(x.startBeat - e.startBeat) < 1e-6)
        if (Math.abs(e.startBeat % 8) < 1e-6) expect(con, `${vong} lượt ${take}: cú chặn đầu hợp âm ${e.startBeat}`).toBe(true)
        const bi = r.events.some(f => f.hand === 'right' && !f.grace && f.startBeat % 8 > .5 &&
          f.startBeat < e.startBeat + e.durationBeats - 1e-6 && f.startBeat + f.durationBeats > e.startBeat + 1e-6)
        expect(con, `${vong} lượt ${take}: cú chặn ${e.startBeat}`).toBe(!bi)
      }
    }
  })

  it('láy blues: nốt blue của giọng, nửa cung dưới một nốt của cú chặn đầu hợp âm, ngay trước phách 1', () => {
    for (const [vong, key] of BAI) {
      const { chords, backing, r } = moi(vong, key, 0)
      const blue = key.scale === 'minor' ? [6, 10] : [3, 6, 10]
      const lay = r.events.filter(e => e.grace)
      expect(lay.length, vong).toBeGreaterThan(0)
      for (const e of lay) {
        const i = Math.round((e.startBeat + .12) / 8)
        expect(e.startBeat + e.durationBeats, vong).toBeCloseTo(i * 8, 6)
        const chan = backing.find(x => x.hand === 'right' && Math.abs(x.startBeat - i * 8) < 1e-6)!
        for (const n of e.notes) {
          expect(blue.includes(pc(n - key.tonic)), `${vong}: láy ${n} trên ${chords[i]!.symbol}`).toBe(true)
          expect(chan.notes.includes(n + 1), `${vong}: láy ${n} không vào nốt nào của cú chặn`).toBe(true)
        }
      }
    }
    // C trưởng: C nhận láy đôi Eb+Gb → E+G như sheet Boogie ô 25 · 29; F không có nốt blue nửa cung dưới bậc 3 / 5.
    const { r } = moi('C Am F G C Am Dm G', { tonic: 0, scale: 'major' }, 0)
    expect(r.events.find(e => e.grace && Math.abs(e.startBeat - 31.88) < 1e-6)?.notes).toEqual([63, 66])
    expect(r.events.some(e => e.grace && Math.abs(e.startBeat - 15.88) < 1e-6)).toBe(false)
  })

  it('đi bass cuối đoạn: ô cuối trước đoạn mới — bốn nốt đen quãng tám, ba nốt cuối nửa cung một lên gốc mới; mẫu boogie ô ấy nhường', () => {
    for (const [vong, key] of BAI) {
      const { chords, r } = moi(vong, key, 0)
      const di = r.events.filter(e => e.hand === 'left')
      expect(di.map(e => e.startBeat), vong).toEqual([28, 29, 30, 31])
      for (const e of di) expect(e.notes[1]! - e.notes[0]!).toBe(12)
      const goc = chords[4]!.root
      expect(di.slice(1).map(e => pc(e.notes[0]! - goc)), vong).toEqual([9, 10, 11])
      expect(r.backing.some(e => e.hand === 'left' && e.startBeat >= 28 - 1e-6 && e.startBeat < 32 - 1e-6), vong).toBe(false)
    }
  })

  it('tái lập: cùng lượt ra cùng bản; các lượt khác nhau thì câu khác nhau', () => {
    const [vong, key] = BAI[0]
    const ban = (take: number) => JSON.stringify(moi(vong, key, take).r.events)
    expect(ban(3)).toBe(ban(3))
    expect(new Set(Array.from({ length: LUOT }, (_, t) => ban(t))).size).toBeGreaterThanOrEqual(4)
  })
})

describe('Twist · Bộ Soạn Blues — dạo · giang · kết', { timeout: 60_000 }, () => {
  const make = (kind: 'intro' | 'interlude' | 'outro', tonic: number, scale: 'major' | 'minor', take: number) =>
    buildPhraseSection({ kind, key: { tonic, scale }, style: TWIST, beatsPerChord: 4, opening: null, dropRoot: false,
      solo: () => [], take, range: { low: 60, high: 84 } })!
  // Ô soạn bằng Bộ Soạn Blues (các ô khác là khung Twist: đi bass, ô báo, hợp âm kết).
  const O_SOAN = { intro: [0, 1], interlude: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], outro: [0] } as const

  it('12 giọng × 2 thang × 3 đoạn × 3 lượt: đủ đoạn, tay phải trong tầm; ô soạn toàn nốt đơn / bè đôi đúng lưới, câu nhắc thở ở phách 4', () => {
    for (const scale of ['major', 'minor'] as const) for (let tonic = 0; tonic < 12; tonic++) for (const kind of ['intro', 'interlude', 'outro'] as const) {
      for (let take = 0; take < 3; take++) {
        const made = make(kind, tonic, scale, take)
        const ten = `${tonic} ${scale} ${kind} lượt ${take}`
        expect(made.unavailableReason, ten).toBeUndefined()
        expect(made.lengthBeats).toBe(kind === 'interlude' ? 48 : 16)
        expect(made.sourcePhrase?.id).toBe('twist-bo-soan-blues')
        const phai = made.events.filter(e => e.hand === 'right')
        for (const e of phai) for (const n of e.notes) {
          expect(n, ten).toBeGreaterThanOrEqual(60)
          expect(n, ten).toBeLessThanOrEqual(84)
        }
        for (const [k, bar] of O_SOAN[kind].entries()) {
          const trong = phai.filter(e => e.startBeat >= bar * 4 - 1e-6 && e.startBeat < bar * 4 + 4 - 1e-6)
          expect(trong.length, `${ten} ô ${bar}`).toBeGreaterThanOrEqual(2)
          for (const e of trong) {
            expect(e.notes.length, `${ten} ô ${bar}`).toBeLessThanOrEqual(2)
            expect(trongPhach(e.startBeat), `${ten} ô ${bar}: ${e.startBeat}`).toBe(true)
          }
          if (k % 2 === 0 || k === O_SOAN[kind].length - 1) {
            expect(trong.some(e => e.startBeat >= bar * 4 + 3 - 1e-6), `${ten} ô ${bar} — nghỉ phách 4`).toBe(false)
          }
        }
        // Tay trái ô soạn: bass boogie đủ 8 tiếng mỗi ô.
        for (const bar of O_SOAN[kind]) {
          expect(made.events.filter(e => e.hand === 'left' && e.startBeat >= bar * 4 - 1e-6 && e.startBeat < bar * 4 + 4 - 1e-6).length).toBe(8)
        }
      }
    }
  })

})
