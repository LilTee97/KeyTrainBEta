import { describe, expect, it } from 'vitest'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { parseChordInput } from '../../input/chordInputParser'
import { NGUON_SOLO_SR, type NguonSR } from '../slowRockLinhNhiNguon'
import { linhNhiSolo, nguonChoBai, nhipCuaDieu, slowRockSoanLinhNhi } from '../linhNhiSolo'
import { nanNhip, nhomHau, vongMoi } from '../soanSlowRockLinhNhi'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { LINH_NHI_SLOW_ROCK } from '../styleLibrary/linhNhiSlowRock'
import type { StylePattern } from '../types'

const slowRock = LINH_NHI_SLOW_ROCK[0]!
const slowRock6 = getStyle('slow-rock-2')!
const bolero = getStyle('bolero-linh-nhi-2')!
const pop = getStyle('pop-1')!
const RONG = { low: 21, high: 108 } as const
const KINDS = ['intro', 'interlude', 'outro'] as const
type Kind = (typeof KINDS)[number]
const soan = (style: StylePattern, kind: Kind, tonic: number, minor: boolean, take = 0, song = '') =>
  linhNhiSolo({
    kind, key: { tonic: tonic as PitchClass, scale: minor ? 'minor' : 'major' }, style, take, range: RONG,
    songChords: song ? parseChordInput(song).chords : [],
  })
/** Lượt chọn đúng đoạn bolero `src` khi bài không có vốn hợp âm (mọi nguồn hoà điểm). */
const takeOf = (src: NguonSR, tonic = src.chuGoc) =>
  nguonChoBai(src.doan, src.thu, tonic as PitchClass, []).filter((u) => u.src.dieu === 'bolero')
    .findIndex((u) => u.src.id === src.id)
const dauO = (src: NguonSR) => src.o.map((_, i) => src.o.slice(0, i).reduce((n, o) => n + o.d, 0))
const SR_ID = /^(la-thu-tran-the|mot-coi-di-ve)-/
/** Nguồn giai điệu của một ô: `<id đoạn> ô <n>` → đoạn ấy. */
const nguonGiaiDieu = (melody: string) => NGUON_SOLO_SR.find((s) => melody.startsWith(`${s.id} ô `))!
const khoaHop = (h: readonly [number, number, string, number | null]) => `${h[1]}${nhomHau(h[2])}`
const gon = (xs: readonly string[]) => xs.filter((x, k) => k === 0 || x !== xs[k - 1]).join(' ')

/** Mọi câu slow rock soạn ra: 3 loại đoạn × trưởng/thứ × 12 giọng × 6 lượt, trên điệu Lá Thư. */
const TAT_CA_SR = KINDS.flatMap((kind) => [true, false].flatMap((minor) =>
  Array.from({ length: 12 * 6 }, (_, j) => ({ kind, minor, tonic: j % 12, take: Math.floor(j / 12) }))))
  .map((c) => ({ ...c, made: soan(slowRock, c.kind, c.tonic, c.minor, c.take) }))

describe('câu solo Linh Nhi chỉ lấy vật liệu từ sheet cùng điệu', () => {
  it('nhận nhịp; điệu không có sheet Linh Nhi thì báo, không mượn điệu khác', () => {
    expect(nhipCuaDieu(slowRock)).toEqual({ kep: true, o: 3 })
    expect(nhipCuaDieu(slowRock6)).toEqual({ kep: true, o: 6 })
    expect(nhipCuaDieu(bolero)).toEqual({ kep: false, o: 4 })
    for (const style of [getStyle('waltz-1')!, pop]) {
      expect(soan(style, 'intro', 0, false).unavailableReason).toContain('chưa có sheet')
      expect(soan(style, 'outro', 9, true).events).toHaveLength(0)
    }
  })

  it('bolero: ghép ngược về giọng gốc ra đúng từng nốt hai tay của mọi đoạn bolero', () => {
    for (const src of NGUON_SOLO_SR.filter((s) => s.dieu === 'bolero')) {
      const made = soan(bolero, src.doan, src.chuGoc, src.thu, takeOf(src))
      expect(made.sourcePhrase?.id).toBe(src.id)
      expect(made.sourcePhrase?.method).toBe('full-sheet')
      const dau = dauO(src)
      for (const tay of ['r', 'l'] as const) {
        const want = src.o.flatMap((o, i) => o[tay].map((g) => [dau[i]! + g[0], g[2].map((n) => n + 60 + src.chuGoc)]))
        const got = made.events.filter((e) => e.hand === (tay === 'r' ? 'right' : 'left')).map((e) => [e.startBeat, e.notes])
        expect(got, `${src.id} ${tay}`).toEqual(want)
      }
    }
  })

  it('bolero: không bao giờ lấy đoạn slow rock, mọi loại đoạn, hai giọng, 12 giọng', () => {
    for (const kind of KINDS) for (const minor of [true, false]) for (let tonic = 0; tonic < 12; tonic += 1) {
      for (let take = 0; take < 4; take += 1) {
        const made = soan(bolero, kind, tonic, minor, take)
        const src = NGUON_SOLO_SR.find((s) => s.id === made.sourcePhrase?.id)
        expect(src?.dieu, `${kind} ${minor} @${tonic} #${take}`).toBe('bolero')
        expect(src?.thu).toBe(minor)
        expect(parseChordInput(made.chords.join(' ')).chords).toHaveLength(made.chords.length)
      }
    }
  })

  it('slow rock: tiết tấu mọi ô từ ô slow rock của chị, giai điệu từ slow rock hoặc bolero cùng giọng', () => {
    for (const { kind, minor, tonic, take, made } of TAT_CA_SR) {
      const tag = `${kind} ${minor ? 'thứ' : 'trưởng'} @${tonic} #${take}`
      expect(made.unavailableReason, tag).toBeUndefined()
      expect(made.lengthBeats % 3, tag).toBe(0)
      expect(made.compositionSources, tag).toHaveLength(made.lengthBeats / 3)
      for (const c of made.compositionSources!) {
        expect(c.rhythm, tag).toMatch(SR_ID)
        const src = nguonGiaiDieu(c.melody)
        if (src.dieu === 'bolero') {
          expect(src.thu, tag).toBe(minor)
          expect(c.donorGenre, tag).toBe('bolero (giai điệu) · slow rock (tiết tấu)')
        } else expect(c.donorGenre, tag).toBe('slow rock')
      }
      expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBeCloseTo(made.lengthBeats, 6)
      expect(parseChordInput(made.chords.join(' ')).chords, tag).toHaveLength(made.chords.length)
      expect(made.events.every((e) => e.startBeat < made.lengthBeats - 1e-6), tag).toBe(true)
    }
  })

  it('slow rock: không trùng lặp — không dùng một giai điệu hai lần, lượt khác ra câu khác', () => {
    for (const { kind, minor, tonic, take, made } of TAT_CA_SR) {
      const giua = made.compositionSources!.filter((c) => c.harmony.startsWith('vòng')).map((c) => c.melody.split(',')[0])
      expect(new Set(giua).size, `${kind} ${minor} @${tonic} #${take}`).toBe(giua.length)
    }
    for (const kind of KINDS) for (const minor of [true, false]) {
      const cau = new Set(TAT_CA_SR.filter((c) => c.kind === kind && c.minor === minor && c.tonic === 2)
        .map((c) => c.made.compositionSources!.map((s) => s.melody).join('|')))
      expect(cau.size, `${kind} ${minor}`).toBeGreaterThanOrEqual(4)
    }
  })

  /*
    Ngưỡng từ số đo 6 đoạn solo slow rock của chị (tools/quy_luat_not_linh_nhi.py, md 13e):
    phách mạnh vào nốt hợp âm 67/81 = 83%; nối ô ≤ 4 nửa cung hoặc đúng quãng tám 29/43 = 67%;
    ô thưa ≤ 2 cú gõ 4/49 = 8%; ô nghỉ ≥ nửa ô giữa đoạn 1/49. Phách nhẹ sheet 165/194 = 85% —
    ngưỡng 80% là biên của tôi (bộ soạn đo 83–89%).
  */
  it('slow rock: bám hợp âm, liền mạch, không ngắt quãng — ít nhất bằng sheet', () => {
    let manh = 0, manhHop = 0, nhe = 0, nheHop = 0, noi = 0, noiEm = 0, o = 0, thua = 0, trong = 0
    for (const { made } of TAT_CA_SR) {
      const hop = parseChordInput(made.chords.join(' ')).chords
      const tu: number[] = []
      made.beatsEach.reduce((a, b) => (tu.push(a), a + b), 0)
      const phai = made.events.filter((e) => e.hand === 'right')
      for (const e of phai) {
        let j = 0
        while (j + 1 < tu.length && tu[j + 1]! <= e.startBeat + 1e-6) j += 1
        const top = Math.max(...e.notes)
        const la = hop[j]!.quality.intervals.some((x) => (hop[j]!.root + x) % 12 === top % 12)
        const f = e.startBeat % 3
        if (f < 1e-6 || Math.abs(f - 1.5) < 1e-6) { manh += 1; manhHop += Number(la) } else { nhe += 1; nheHop += Number(la) }
      }
      const giua = made.compositionSources!.filter((c) => c.harmony.startsWith('vòng')).length
      let truoc: number | null = null
      for (let i = 0; i < giua; i += 1) {
        const tops = phai.filter((e) => e.startBeat >= i * 3 - 1e-6 && e.startBeat < i * 3 + 3 - 1e-6).map((e) => Math.max(...e.notes))
        o += 1
        if (tops.length === 0) { trong += 1; continue }
        if (tops.length <= 2) thua += 1
        if (truoc !== null) { const d = Math.abs(tops[0]! - truoc); noi += 1; noiEm += Number(d <= 4 || d === 12) }
        truoc = tops[tops.length - 1]!
      }
    }
    expect(manhHop / manh).toBeGreaterThanOrEqual(0.83)
    expect(nheHop / nhe).toBeGreaterThanOrEqual(0.8)
    expect(noiEm / noi).toBeGreaterThanOrEqual(0.67)
    expect(thua / o).toBeLessThanOrEqual(0.08)
    expect(trong).toBe(0)
  })

  it('slow rock: điệu 6/8 ô 6 phách soạn đúng câu ấy, giãn gấp đôi', () => {
    for (const kind of KINDS) {
      const a = soan(slowRock, kind, 7, true, 1)
      const b = soan(slowRock6, kind, 7, true, 1)
      expect(b.lengthBeats).toBe(a.lengthBeats * 2)
      expect(b.chords).toEqual(a.chords)
      expect(b.events.map((e) => [e.startBeat / 2, e.durationBeats / 2, e.notes])).toEqual(
        a.events.map((e) => [e.startBeat, e.durationBeats, e.notes]))
    }
  })

  /*
    Người dùng 24/9/2026: *"Vòng hợp âm phải được đổi mới chứ ko phải giữ nguyên một vòng rồi đổi giai
    điệu"*. Giới hạn đo trên 23 vòng solo thật: dạo/giang 5–10 hợp âm khác nhau, dài 7–12 ô.
  */
  it('slow rock: vòng ghép mới — không trùng vòng có sẵn, mở như chị mở, đủ hợp âm, đổi theo lượt', () => {
    for (const minor of [true, false]) {
      const nguon = NGUON_SOLO_SR.filter((s) => s.thu === minor)
      const goc = new Set(nguon.map((s) => gon(s.o.flatMap((o) => o.h.map(khoaHop)))))
      for (const kind of KINDS) {
        const mo = new Set(nguon.filter((s) => s.doan === kind).map((s) => khoaHop(s.o.find((o) => o.h.length)!.h[0]!)))
        const ds = vongMoi(kind, minor, new Set(), [[0, 7, '7', null]])
        expect(ds.length, `${kind} ${minor}`).toBeGreaterThan(0)
        for (const v of ds) {
          const k = v.hs.map(khoaHop)
          expect(goc.has(gon(k)), v.tu).toBe(false)
          expect(mo.has(k[0]!), v.tu).toBe(true)
          expect(new Set(k).size, v.tu).toBeGreaterThanOrEqual(kind === 'outro' ? 3 : 5)
        }
      }
    }
    for (const kind of ['intro', 'interlude'] as const) {
      const vong = new Set(Array.from({ length: 40 }, (_, take) => soan(slowRock, kind, 4, true, take).chords.join(' ')))
      expect(vong.size, kind).toBeGreaterThanOrEqual(25)
    }
  })

  it('slow rock: nắn nhịp — mọi mốc tay phải nằm trên móc đơn hoặc móc kép', () => {
    for (const { kind, minor, tonic, take, made } of TAT_CA_SR) {
      const lech = made.events.filter((e) => Math.abs(e.startBeat * 4 - Math.round(e.startBeat * 4)) > 1e-6)
      expect(lech, `${kind} ${minor} @${tonic} #${take}`).toHaveLength(0)
    }
    // Một Cõi dạo ô 1 (ba nốt nhét vào chỗ hai móc đơn — #1374 · #1376 · #1378 chê "bóp nhanh").
    const moc = NGUON_SOLO_SR.find((s) => s.id === 'mot-coi-di-ve-intro')!
    expect(nanNhip(moc.o[0]!.r, true).map((g) => g[0])).toEqual([0, 0.5, 1, 1.5, 2, 2.5])
    // Câu chạy móc kép ô 4 giữ nguyên, chỉ bỏ nốt hoa mỹ và nốt lệch cuối câu.
    expect(nanNhip(moc.o[3]!.r, true).map((g) => g[0])).toEqual([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5])
    // Lá Thư sạch nhịp: không đổi.
    const la = NGUON_SOLO_SR.find((s) => s.id === 'la-thu-tran-the-intro')!
    for (const o of la.o) expect(nanNhip(o.r, true)).toEqual([...o.r])
  })

  it('Slow Rock Lá thư soạn câu mới cả khi chọn thầy Linh Nhi hoặc chưa chọn thầy nào', () => {
    // Lỗi 24/9/2026: chọn thầy Linh Nhi thì dạo/kết đi kiểu bolero, chép nguyên một câu sheet.
    expect(slowRockSoanLinhNhi(slowRock, false, 'linh-nhi')).toBe(true)
    expect(slowRockSoanLinhNhi(slowRock, false, null)).toBe(true)
    expect(slowRockSoanLinhNhi(slowRock, true, null)).toBe(true)
    expect(slowRockSoanLinhNhi(slowRock, false, 'ton-hung')).toBe(false)
    expect(slowRockSoanLinhNhi(slowRock6, false, null)).toBe(false)
    expect(slowRockSoanLinhNhi(slowRock6, true, null)).toBe(true)
    expect(slowRockSoanLinhNhi(bolero, true, 'linh-nhi')).toBe(false)
  })

  it('slow rock: mỗi lượt phát một câu mới trên một vòng mới', () => {
    const song = 'Em Am B7 Em C D G Em Am B7 Em'
    for (const kind of KINDS) {
      const cau = new Set<string>()
      const vong = new Set<string>()
      for (let take = 0; take < 20; take += 1) {
        const made = soan(slowRock, kind, 4, true, take, song)
        cau.add(made.compositionSources!.map((c) => c.melody).join('|'))
        vong.add(made.chords.join(' '))
      }
      expect(cau.size, kind).toBe(20)
      expect(vong.size, kind).toBeGreaterThanOrEqual(10)
    }
  })

  it('buildPhraseSection chuyển thẳng sang bộ soạn khi bật cờ', () => {
    const built = buildPhraseSection({
      kind: 'outro', key: { tonic: 9 as PitchClass, scale: 'minor' }, style: slowRock, linhNhiSolo: true,
      beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take: 0, range: RONG,
    })!
    expect(built.sourcePhrase!.id).toMatch(/^soan:/)
    expect(built.compositionSources!.every((c) => SR_ID.test(c.rhythm))).toBe(true)
  })
})
