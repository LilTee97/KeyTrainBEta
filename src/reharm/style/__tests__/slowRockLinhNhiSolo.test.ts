import { describe, expect, it } from 'vitest'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { parseChordInput } from '../../input/chordInputParser'
import { NGUON_SOLO_SR } from '../slowRockLinhNhiNguon'
import { chumBa, nguonChoBai, slowRockLinhNhiSolo } from '../slowRockLinhNhiSolo'
import { buildPhraseSection } from '../phraseSection'
import { LINH_NHI_SLOW_ROCK } from '../styleLibrary/linhNhiSlowRock'

const style = LINH_NHI_SLOW_ROCK[0]!
const RONG = { low: 36, high: 108 } as const
const soan = (kind: 'intro' | 'interlude' | 'outro', tonic: number, minor: boolean, take = 0, song = '') =>
  slowRockLinhNhiSolo({
    kind, key: { tonic: tonic as PitchClass, scale: minor ? 'minor' : 'major' }, style, take, range: RONG,
    songChords: song ? parseChordInput(song).chords : [],
  })

describe('bộ soạn Slow Rock Linh Nhi', () => {
  it('ghép ngược về giọng gốc ra đúng từng nốt tay phải và tay trái của mọi đoạn slow rock', () => {
    const native = NGUON_SOLO_SR.filter((s) => s.dieu === 'slow rock')
    expect(native.map((s) => s.id).sort()).toEqual([
      'la-thu-tran-the-interlude', 'la-thu-tran-the-intro', 'la-thu-tran-the-outro',
      'mot-coi-di-ve-interlude', 'mot-coi-di-ve-intro', 'mot-coi-di-ve-outro',
    ])
    for (const src of native) {
      const pool = nguonChoBai(src.doan, src.thu, src.chuGoc as PitchClass, [])
      const take = pool.findIndex((u) => u.src.id === src.id)
      const made = soan(src.doan, src.chuGoc, src.thu, take)
      expect(made.sourcePhrase?.id).toBe(src.id)
      for (const tay of ['r', 'l'] as const) {
        const hand = tay === 'r' ? 'right' : 'left'
        const want = src.o.flatMap((o, i) => o[tay].map((g) => [i * 3 + g[0], g[2].map((n) => n + 60 + src.chuGoc)]))
        const got = made.events.filter((e) => e.hand === hand).map((e) => [e.startBeat, e.notes])
        expect(got, `${src.id} ${hand}`).toEqual(want)
      }
      expect(made.lengthBeats).toBe(src.o.length * 3)
    }
  })

  it('giọng trưởng chỉ lấy nguồn trưởng, giọng thứ chỉ lấy nguồn thứ — cả ba loại đoạn, mọi lượt', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      for (const minor of [true, false]) {
        for (let take = 0; take < 6; take += 1) {
          const id = soan(kind, 4, minor, take).sourcePhrase!.id
          const src = NGUON_SOLO_SR.find((s) => s.id === id)!
          expect(src.thu, `${kind} ${minor} ${id}`).toBe(minor)
          expect(src.doan).toBe(kind)
        }
      }
    }
  })

  it('mọi nguồn ở cả 12 giọng: đọc được vòng hợp âm, đủ độ dài, không nốt nào rơi', () => {
    for (const src of NGUON_SOLO_SR) {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        const pool = nguonChoBai(src.doan, src.thu, tonic as PitchClass, [])
        const made = soan(src.doan, tonic, src.thu, pool.findIndex((u) => u.src.id === src.id))
        expect(made.unavailableReason, `${src.id} @${tonic}`).toBeUndefined()
        const cells = src.oPhach === 3 ? src.o.length : src.o.reduce((n, o) => n + o.d / 2, 0)
        expect(made.lengthBeats).toBe(cells * 3)
        expect(made.beatsEach.reduce((a, b) => a + b, 0)).toBeCloseTo(made.lengthBeats, 6)
        expect(parseChordInput(made.chords.join(' ')).chords).toHaveLength(made.chords.length)
        const rh = src.o.reduce((n, o) => n + o.r.length, 0)
        expect(made.events.filter((e) => e.hand === 'right')).toHaveLength(rh)
      }
    }
  })

  it('ưu tiên đoạn có bậc hợp âm nằm trong vốn của bài', () => {
    // Vốn Sol thứ của Một Cõi: i · iv · ♭VI · V7 · ii°.
    const made = soan('intro', 7, true, 0, 'Gm Cm Eb D7 Am7b5')
    expect(made.sourcePhrase!.id).toBe('mot-coi-di-ve-intro')
    // Vốn Rê thứ của Lá Thư: i · ♭VII · ♭III · iv · ♭VI · ii° · V7.
    expect(soan('intro', 2, true, 0, 'Dm C F Gm Bb Edim A7').sourcePhrase!.id).toBe('la-thu-tran-the-intro')
    // Slow rock gốc khớp ≥ nửa vốn thì đứng trước bolero chuyển nhịp, dù bolero khớp hơn.
    for (let take = 0; take < 4; take += 1) {
      expect(soan('outro', 4, true, take, 'Em(add9) Am9 B7 C D G').sourcePhrase!.id).toBe('mot-coi-di-ve-outro')
    }
  })

  it('đổi ô bolero sang 12/8: phách giữ chỗ, móc đơn thành dài–ngắn chùm ba', () => {
    expect([0, 0.25, 0.5, 1, 1.5, 3.5, 4].map(chumBa)).toEqual([0, 0.5, 1, 1.5, 2.5, 5.5, 6])
    const bien = NGUON_SOLO_SR.find((s) => s.id === 'bien-tinh-intro')!
    const pool = nguonChoBai('intro', false, 2 as PitchClass, [])
    const made = soan('intro', 2, false, pool.findIndex((u) => u.src.id === bien.id))
    expect(made.lengthBeats).toBe(bien.o.length * 6)
    expect(made.adaptationNote).toContain('12/8')
  })

  it('buildPhraseSection chuyển thẳng sang bộ soạn khi bật cờ', () => {
    const built = buildPhraseSection({
      kind: 'outro', key: { tonic: 9 as PitchClass, scale: 'minor' }, style, slowRockLinhNhi: true,
      beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take: 0, range: RONG,
    })!
    expect(built.sourcePhrase?.id).toMatch(/-outro$/)
    expect(NGUON_SOLO_SR.find((s) => s.id === built.sourcePhrase!.id)!.thu).toBe(true)
  })
})
