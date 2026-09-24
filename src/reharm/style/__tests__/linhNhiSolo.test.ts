import { describe, expect, it } from 'vitest'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { parseChordInput } from '../../input/chordInputParser'
import { NGUON_SOLO_SR, type NguonSR } from '../slowRockLinhNhiNguon'
import { linhNhiSolo, nguonChoBai, nhipCuaDieu } from '../linhNhiSolo'
import { buildPhraseSection, type PhraseSection } from '../phraseSection'
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
const vongId = (made: PhraseSection) => made.sourcePhrase!.id.replace(/^soan:/, '')

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

  it('slow rock: mọi ô đến từ sheet slow rock của chị, soạn được ở mọi giọng', () => {
    for (const { kind, minor, tonic, take, made } of TAT_CA_SR) {
      const tag = `${kind} ${minor ? 'thứ' : 'trưởng'} @${tonic} #${take}`
      expect(made.unavailableReason, tag).toBeUndefined()
      expect(made.lengthBeats % 3, tag).toBe(0)
      expect(made.compositionSources, tag).toHaveLength(made.lengthBeats / 3)
      for (const c of made.compositionSources!) {
        expect(c.donorGenre, tag).toBe('slow rock')
        expect(c.melody, tag).toMatch(/^(la-thu-tran-the|mot-coi-di-ve)-/)
      }
      expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBeCloseTo(made.lengthBeats, 6)
      expect(parseChordInput(made.chords.join(' ')).chords, tag).toHaveLength(made.chords.length)
      expect(made.events.every((e) => e.startBeat < made.lengthBeats - 1e-6), tag).toBe(true)
      const src = NGUON_SOLO_SR.find((s) => s.id === vongId(made))!
      expect(src.thu, tag).toBe(minor)
      expect(src.doan, tag).toBe(kind)
    }
  })

  it('slow rock: không trùng lặp — không dùng một ô hai lần, không lặp hình ô trước, lượt khác ra câu khác', () => {
    for (const { kind, minor, tonic, take, made } of TAT_CA_SR) {
      const giua = made.compositionSources!.filter((c) => c.harmony.startsWith('vòng')).map((c) => c.rhythm)
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

  it('slow rock: vòng hợp âm ưu tiên đoạn slow rock khớp vốn bài', () => {
    expect(vongId(soan(slowRock, 'intro', 7, true, 0, 'Gm Cm Eb D7 Am7b5'))).toBe('mot-coi-di-ve-intro')
    expect(vongId(soan(slowRock, 'intro', 2, true, 0, 'Dm C F Gm Bb Edim A7'))).toBe('la-thu-tran-the-intro')
    for (let take = 0; take < 4; take += 1) {
      expect(vongId(soan(slowRock, 'outro', 4, true, take, 'Em(add9) Am9 B7 C D G'))).toBe('mot-coi-di-ve-outro')
      expect(NGUON_SOLO_SR.find((s) => s.id === vongId(soan(slowRock, 'intro', 9, true, take)))!.dieu).toBe('slow rock')
    }
  })

  it('buildPhraseSection chuyển thẳng sang bộ soạn khi bật cờ', () => {
    const built = buildPhraseSection({
      kind: 'outro', key: { tonic: 9 as PitchClass, scale: 'minor' }, style: slowRock, linhNhiSolo: true,
      beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take: 0, range: RONG,
    })!
    expect(vongId(built)).toMatch(/-outro$/)
    expect(NGUON_SOLO_SR.find((s) => s.id === vongId(built))!.thu).toBe(true)
    expect(built.compositionSources!.every((c) => c.donorGenre === 'slow rock')).toBe(true)
  })
})
