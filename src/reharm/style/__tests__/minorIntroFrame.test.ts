import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { TUYEN_SOLO } from '../tuyenSolo'
import { vonO } from '../giaiDieuDaoLinhNhi'
import { vonHopAmLinhNhi } from '../vonHopAmLinhNhi'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import type { PitchClass } from '../../../shared/musicTheory/types'

const makeIntro = (minor: boolean, take: number, tonic: PitchClass = minor ? 9 : 0, ceiling?: number) => {
  const delta = tonic - (minor ? 9 : 0)
  const chords = parseChordInput(minor ? 'Am Dm G C F E E7 Em' : 'C Am Dm G Em F').chords
    .map((c) => delta === 0 ? c : {
      ...c, root: ((c.root + delta + 12) % 12) as PitchClass,
      symbol: pitchClassName(((c.root + delta + 12) % 12) as PitchClass) + c.quality.symbol,
    })
  return buildPhraseSection({
    kind: 'intro', key: { tonic, scale: minor ? 'minor' : 'major' },
    style: getStyle('bolero-tu-n-improv-bai-04-00001')!,
    beatsPerChord: 4, dropRoot: true, opening: chords[0]!, songChords: chords,
    solo: () => [], take, daoTruong: !minor,
    ...(ceiling ? { range: { low: 57, high: ceiling } } : {}),
  })!
}

describe('intro thứ dựa trên khung trưởng đã duyệt #472/#480/#484', () => {
  it('giữ nguyên các câu trưởng trước lần sửa này', () => {
    const hash = createHash('sha256').update(JSON.stringify(
      Array.from({ length: 24 }, (_, take) => makeIntro(false, take)),
    )).digest('hex')
    expect(hash).toBe('7983ec0d8febfa8ce080d5eeefeba18b3b0827b0f76406e6fb3ba59fd8a819a1')
  })

  it('thứ: 1/3 ô dập, mở bằng giai điệu, không bỏ trắng ô cuối', () => {
    for (let take = 0; take < 24; take++) {
      const intro = makeIntro(true, take)
      const bars = Array.from({ length: 8 }, (_, bar) => intro.events.filter(
        (e) => e.hand === 'right' && e.startBeat >= bar * 4 && e.startBeat < bar * 4 + 4,
      ))
      const stacks = bars.filter((b) => b.some((e) => e.notes.length > 1)).length
      expect(stacks, `take ${take}`).toBeLessThanOrEqual(3)
      expect(bars[0]!.some((e) => e.notes.length === 1 && e.startBeat <= 0.5)).toBe(true)
      expect(bars[7]!.length, `take ${take}: ô cuối`).toBeGreaterThan(0)
      expect(intro.lengthBeats).toBe(36)
    }
  })

  it('Hoa Phượng: không lấy lời hát; ô 8 phách có vốn 4 phách đúng tốc độ', () => {
    const t = TUYEN_SOLO.find((t) => t.id === 'noi-buon-hoa-phuong-intro')!
    expect(t.o[4]!.n.every(([at]) => at < 5)).toBe(true)
    const normalized = vonO('linh-nhi', 'intro', true).find((s) => s.id === t.id)!
    expect(normalized.phach).toBe(4)
    expect(normalized.o[4]!.bac).toBe(7)
    expect(normalized.o[4]!.chat).toBe('7')
    expect(normalized.o[4]!.n.map(([at, pitch]) => [at, pitch])).toEqual(
      t.o[2]!.n.filter(([at]) => at < 4).map(([at, pitch]) => [at, pitch]),
    )
    const ending = vonO('linh-nhi', 'intro', true).find((s) => s.id === 'noi-buon-hoa-phuong-outro')!
    expect(ending.o[0]!.n).toHaveLength(0) // Ô 71 trước phách 4 là mô phỏng lời hát.
    expect(ending.o[1]!.n.length).toBeGreaterThan(0) // Nửa sau vẫn là solo, không được bỏ.
  })

  it('không đổi Em thành E, E7 thành E khi vốn bài thiếu chất hợp âm yêu cầu', () => {
    for (const take of [1, 2]) {
      const chords = vonHopAmLinhNhi({
        kind: 'intro', key: { tonic: 9, scale: 'minor' }, take, daoThu: true,
        songChords: parseChordInput('Am Dm G C F E').chords,
      })
      const dominant = chords.filter((c) => c.root === 4)
      expect(dominant.some((c) => c.quality.intervals.includes(take === 1 ? 3 : 10))).toBe(true)
    }
  })

  it('câu chạy mặc định là bốn nốt liền nhau của sheet thứ, không bẻ riêng cao độ', () => {
    const sources = vonO('linh-nhi', 'intro', true).filter((t) => t.thu && t.phach === 4)
      .flatMap((t) => t.o).flatMap((o) => o.n.map((_, i) => o.n.slice(i, i + 4)))
      .filter((n) => n.length === 4)
    let checked = 0
    for (let take = 0; take < 24; take++) {
      const run = makeIntro(true, take, 9, 79).events
        .filter((e) => e.hand === 'right' && e.velocity === 68 && e.startBeat < 32)
        .sort((a, b) => a.startBeat - b.startBeat)
      expect(run.length % 4).toBe(0)
      for (let i = 0; i < run.length; i += 4) {
        const part = run.slice(i, i + 4)
        expect(sources.some((n) => n.every(([at, pitch], k) =>
          Math.abs((at - n[0]![0]) - (part[k]!.startBeat - part[0]!.startBeat)) < 0.001 &&
          pitch - n[0]![1] === part[k]!.notes[0]! - part[0]!.notes[0]!,
        )), `take ${take}`).toBe(true)
        checked++
      }
    }
    expect(checked).toBe(48)
  })

  it('12 giọng × 24 lượt: màu thứ, không trắng ô, trần Sol5; còn biến thể khi take tăng', () => {
    for (let tonic = 0; tonic < 12; tonic++) {
      const variants = new Set<string>()
      for (let take = 0; take < 24; take++) {
        const intro = makeIntro(true, take, tonic as PitchClass, 79)
        const right = intro.events.filter((e) => e.hand === 'right' && e.startBeat < 32)
        const opening = parseChordInput(intro.chords[0]!).chords[0]!
        expect(opening.root).toBe(tonic)
        expect(opening.quality.intervals).toContain(3)
        const pitches = right.flatMap((e) => e.notes)
        expect(Math.max(...pitches)).toBeLessThanOrEqual(79)
        // Bậc ba trưởng không thuộc hợp âm đang vang thì không làm màu chủ đạo.
        const bright = right.filter((e) => e.notes.length === 1 &&
          (e.notes[0]! - tonic + 120) % 12 === 4).length
        expect(bright / right.length).toBeLessThan(0.08)
        for (let bar = 0; bar < 8; bar++) {
          expect(right.some((e) => e.startBeat >= bar * 4 && e.startBeat < bar * 4 + 4),
            `key ${tonic}, take ${take}, bar ${bar}`).toBe(true)
        }
        variants.add(JSON.stringify(right))
      }
      expect(variants.size).toBeGreaterThanOrEqual(12)
    }
  })
})
