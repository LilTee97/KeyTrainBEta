import { describe, expect, it } from 'vitest'
import type { TimelineEvent } from '../../style/types'
import {
  expectedNotesOf,
  latencyFromTaps,
  passes,
  scoreTimed,
  type ExpectedNote,
  type PlayedNote,
} from '../timedScoring'

/** 120 BPM: 500 ms mỗi phách. */
const MS = 500
const opts = { msPerBeat: MS, latencyMs: 0 }

const want = (note: number, beat: number): ExpectedNote => ({ note, beat, hand: 'left' })
const got = (note: number, beat: number): PlayedNote => ({ note, beat, velocity: 80 })

describe('expectedNotesOf', () => {
  const events: TimelineEvent[] = [
    { notes: [48, 55], startBeat: 1, durationBeats: 1, hand: 'left', velocity: 80 },
    { notes: [64], startBeat: 0, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [63], startBeat: 0.9, durationBeats: 0.1, hand: 'right', velocity: 60, grace: true },
  ]

  it('lọc theo tay, bỏ nốt láy, xếp theo thời gian', () => {
    expect(expectedNotesOf(events, 'right').map((n) => n.note)).toEqual([64])
    expect(expectedNotesOf(events, 'left').map((n) => n.note)).toEqual([48, 55])
    expect(expectedNotesOf(events, 'both').map((n) => n.note)).toEqual([64, 48, 55])
  })
})

describe('scoreTimed', () => {
  const line = [want(48, 0), want(52, 1), want(55, 2), want(60, 3)]

  it('đánh khít nhịp: trúng hết, lệch 0', () => {
    const score = scoreTimed(line, line.map((n) => got(n.note, n.beat)), opts)
    expect(score).toMatchObject({ total: 4, hit: 4, medianMs: 0, medianAbsMs: 0 })
    expect(score.extra).toEqual([])
    expect(passes(score)).toBe(true)
  })

  it('trừ độ trễ đã đo trước khi chấm', () => {
    // Trễ 120 ms đều mọi tiếng = đánh khít nhịp.
    const late = line.map((n) => got(n.note, n.beat + 120 / MS))
    const score = scoreTimed(line, late, { msPerBeat: MS, latencyMs: 120 })
    expect(score.hit).toBe(4)
    expect(score.medianAbsMs).toBe(0)
  })

  it('lệch có dấu: âm là sớm, dương là muộn', () => {
    const score = scoreTimed(line, [
      got(48, -0.06), got(52, 1 - 0.06), got(55, 2 - 0.06), got(60, 3 + 0.02),
    ], opts)
    expect(score.medianMs).toBe(-30)
    expect(score.medianAbsMs).toBe(30)
  })

  it('sai phím: nốt ấy trượt, phím ấy thừa', () => {
    const score = scoreTimed(line, [got(48, 0), got(53, 1), got(55, 2), got(60, 3)], opts)
    expect(score.hit).toBe(3)
    expect(score.missed.map((n) => n.note)).toEqual([52])
    expect(score.extra.map((n) => n.note)).toEqual([53])
    expect(passes(score)).toBe(false)
  })

  it('lệch quá cửa sổ thì không tính là đánh nốt ấy', () => {
    // C3 bấm muộn 200 ms (> 150 ms): nốt ấy trượt, phím ấy thừa; ba nốt sau vẫn trúng.
    const score = scoreTimed(line, [got(48, 0.4), got(52, 1), got(55, 2), got(60, 3)], opts)
    expect(score.hit).toBe(3)
    expect(score.missed.map((n) => n.note)).toEqual([48])
    expect(score.extra.map((n) => n.note)).toEqual([48])
  })

  it('hai nốt cùng phím đứng sát nhau: mỗi nốt lấy đúng phím bấm gần nó', () => {
    // Móc kép lặp C3 ở phách 0 và 0.25 (125 ms). Phím thứ nhất bấm muộn 50 ms.
    const score = scoreTimed(
      [want(48, 0), want(48, 0.25)],
      [got(48, 0.1), got(48, 0.25)],
      opts,
    )
    expect(score.hit).toBe(2)
    expect(score.errorsMs).toEqual([50, 0])
  })

  it('dạo phím trước khi bài vào thì không tính thừa', () => {
    const score = scoreTimed(line, [got(70, -3), ...line.map((n) => got(n.note, n.beat))], opts)
    expect(score.extra).toEqual([])
  })

  it('bỏ qua quãng tám khi được bật', () => {
    const score = scoreTimed([want(48, 0)], [got(60, 0)], { ...opts, ignoreOctave: true })
    expect(score.hit).toBe(1)
  })

  it('đánh trượt quá một phần mười thì chưa đạt dù đều tay', () => {
    const score = scoreTimed(line, line.slice(0, 3).map((n) => got(n.note, n.beat)), opts)
    expect(score.hit).toBe(3)
    expect(passes(score)).toBe(false)
  })
})

describe('latencyFromTaps', () => {
  const MS80 = 750

  it('lấy trung vị lệch so với tiếng click', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat + 150 / MS80)
    expect(latencyFromTaps(taps, MS80)).toMatchObject({ latencyMs: 150, spreadMs: 0, n: 8 })
  })

  it('gõ đón trước tiếng click ra số âm, không nhảy sang tiếng sau', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat - 30 / MS80)
    expect(latencyFromTaps(taps, MS80)?.latencyMs).toBe(-30)
  })

  it('trễ lớn (tai nghe không dây) vẫn tính đúng chiều', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat + 400 / MS80)
    expect(latencyFromTaps(taps, MS80)?.latencyMs).toBe(400)
  })

  it('ít hơn tám lần gõ thì không tin', () => {
    expect(latencyFromTaps([4.2, 5.2, 6.2], MS80)).toBeNull()
  })
})
