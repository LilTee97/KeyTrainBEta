import { describe, expect, it } from 'vitest'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { parseChordInput } from '../../input/chordInputParser'
import { NGUON_SOLO_SR, type NguonSR } from '../slowRockLinhNhiNguon'
import { chumBa, linhNhiSolo, nguonChoBai, nhipCuaDieu } from '../linhNhiSolo'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { LINH_NHI_SLOW_ROCK } from '../styleLibrary/linhNhiSlowRock'
import type { StylePattern } from '../types'

const slowRock = LINH_NHI_SLOW_ROCK[0]!
const bolero = getStyle('bolero-linh-nhi-2')!
const pop = getStyle('pop-1')!
const RONG = { low: 21, high: 108 } as const
type Kind = 'intro' | 'interlude' | 'outro'
const soan = (style: StylePattern, kind: Kind, tonic: number, minor: boolean, take = 0, song = '') =>
  linhNhiSolo({
    kind, key: { tonic: tonic as PitchClass, scale: minor ? 'minor' : 'major' }, style, take, range: RONG,
    songChords: song ? parseChordInput(song).chords : [],
  })
/** Lượt chọn đúng nguồn `src` khi bài không có vốn hợp âm (mọi nguồn hoà điểm). */
const takeOf = (src: NguonSR, tonic = src.chuGoc) =>
  nguonChoBai(src.doan, src.thu, tonic as PitchClass, []).findIndex((u) => u.src.id === src.id)
const dauO = (src: NguonSR) => src.o.map((_, i) => src.o.slice(0, i).reduce((n, o) => n + o.d, 0))

describe('câu solo Linh Nhi theo nhịp điệu đang chơi', () => {
  it('nhận nhịp: 6/8 và 4/4 có nguồn, 3/4 thì không', () => {
    expect(nhipCuaDieu(slowRock)).toEqual({ kep: true, o: 3 })
    expect(nhipCuaDieu(bolero)).toEqual({ kep: false, o: 4 })
    const valse = getStyle('waltz-1')!
    expect(nhipCuaDieu(valse)).toBeNull()
    expect(soan(valse, 'intro', 0, false).unavailableReason).toContain('3/4')
  })

  it('6/8: ghép ngược về giọng gốc ra đúng từng nốt hai tay của mọi đoạn slow rock', () => {
    for (const src of NGUON_SOLO_SR.filter((s) => s.dieu === 'slow rock')) {
      const made = soan(slowRock, src.doan, src.chuGoc, src.thu, takeOf(src))
      expect(made.sourcePhrase?.id).toBe(src.id)
      for (const tay of ['r', 'l'] as const) {
        const want = src.o.flatMap((o, i) => o[tay].map((g) => [i * 3 + g[0], g[2].map((n) => n + 60 + src.chuGoc)]))
        const got = made.events.filter((e) => e.hand === (tay === 'r' ? 'right' : 'left')).map((e) => [e.startBeat, e.notes])
        expect(got, `${src.id} ${tay}`).toEqual(want)
      }
      expect(made.lengthBeats).toBe(src.o.length * 3)
    }
  })

  it('4/4: ghép ngược về giọng gốc ra đúng từng nốt hai tay của mọi đoạn bolero', () => {
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

  it('4/4: slow rock giữ chùm ba — ô 12/8 thành ô 4/4, mọi mốc tỉ lệ 2/3', () => {
    const src = NGUON_SOLO_SR.find((s) => s.id === 'la-thu-tran-the-intro')!
    const made = soan(pop, 'intro', 2, true, takeOf(src))
    expect(made.sourcePhrase?.id).toBe(src.id)
    expect(made.sourcePhrase?.method).toBe('source-variation')
    expect(made.lengthBeats).toBe(Math.ceil((src.o.length * 2) / 4) * 4)
    const want = src.o.flatMap((o, i) => o.r.map((g) => (i * 3 + g[0]) * 2 / 3))
    const got = made.events.filter((e) => e.hand === 'right').map((e) => e.startBeat)
    got.forEach((at, k) => expect(at).toBeCloseTo(want[k]!, 6))
  })

  it('mọi nguồn × hai nhịp × 12 giọng: đọc được vòng hợp âm, đủ ô, không rơi nốt', () => {
    for (const style of [slowRock, bolero]) {
      const oDieu = style.beatsPerMeasure * (style.gridUnit ?? 1)
      for (const src of NGUON_SOLO_SR) {
        for (let tonic = 0; tonic < 12; tonic += 1) {
          const made = soan(style, src.doan, tonic, src.thu, takeOf(src, tonic))
          expect(made.unavailableReason, `${style.id} ${src.id} @${tonic}`).toBeUndefined()
          expect(made.lengthBeats / oDieu).toBe(Math.round(made.lengthBeats / oDieu))
          expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBeCloseTo(made.lengthBeats, 6)
          expect(parseChordInput(made.chords.join(' ')).chords).toHaveLength(made.chords.length)
          expect(made.events.filter((e) => e.hand === 'right'))
            .toHaveLength(src.o.reduce((n, o) => n + o.r.length, 0))
          expect(made.events.every((e) => e.startBeat < made.lengthBeats + 1e-6)).toBe(true)
        }
      }
    }
  })

  it('giọng trưởng chỉ lấy nguồn trưởng, giọng thứ chỉ lấy nguồn thứ — hai nhịp, mọi loại đoạn', () => {
    for (const style of [slowRock, bolero]) {
      for (const kind of ['intro', 'interlude', 'outro'] as const) {
        for (const minor of [true, false]) {
          for (let take = 0; take < 6; take += 1) {
            const id = soan(style, kind, 4, minor, take).sourcePhrase!.id
            const src = NGUON_SOLO_SR.find((s) => s.id === id)!
            expect(src.thu, `${style.id} ${kind} ${minor} ${id}`).toBe(minor)
            expect(src.doan).toBe(kind)
          }
        }
      }
    }
  })

  it('ưu tiên nguồn cùng nhịp điệu và khớp vốn hợp âm bài', () => {
    expect(soan(slowRock, 'intro', 7, true, 0, 'Gm Cm Eb D7 Am7b5').sourcePhrase!.id).toBe('mot-coi-di-ve-intro')
    expect(soan(slowRock, 'intro', 2, true, 0, 'Dm C F Gm Bb Edim A7').sourcePhrase!.id).toBe('la-thu-tran-the-intro')
    for (let take = 0; take < 4; take += 1) {
      expect(soan(slowRock, 'outro', 4, true, take, 'Em(add9) Am9 B7 C D G').sourcePhrase!.id).toBe('mot-coi-di-ve-outro')
      const id = soan(bolero, 'intro', 2, true, take, 'Dm C Bb F Gm Edim A7').sourcePhrase!.id
      expect(NGUON_SOLO_SR.find((s) => s.id === id)!.dieu, id).toBe('bolero')
    }
  })

  it('đổi ô bolero sang 12/8: phách giữ chỗ, móc đơn thành dài–ngắn chùm ba', () => {
    expect([0, 0.25, 0.5, 1, 1.5, 3.5, 4].map(chumBa)).toEqual([0, 0.5, 1, 1.5, 2.5, 5.5, 6])
    const bien = NGUON_SOLO_SR.find((s) => s.id === 'bien-tinh-intro')!
    const made = soan(slowRock, 'intro', 2, false, takeOf(bien, 2))
    expect(made.lengthBeats).toBe(bien.o.length * 6)
    expect(made.adaptationNote).toContain('12/8')
  })

  it('buildPhraseSection chuyển thẳng sang bộ soạn khi bật cờ', () => {
    const built = buildPhraseSection({
      kind: 'outro', key: { tonic: 9 as PitchClass, scale: 'minor' }, style: slowRock, linhNhiSolo: true,
      beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take: 0, range: RONG,
    })!
    expect(built.sourcePhrase?.id).toMatch(/-outro$/)
    expect(NGUON_SOLO_SR.find((s) => s.id === built.sourcePhrase!.id)!.thu).toBe(true)
  })
})
