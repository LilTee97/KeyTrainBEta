import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordDurations } from '../../chordTiming'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { BALLAD } from '../styleLibrary'

/**
 * Kiểm tra render cell OneMotion (Pop 1) và im ô nhường fill.
 */

const render = (text: string, beatsEach?: number[]) => {
  const chords = parseChordInput(text).chords
  const hands = voiceLeadTwoHands(chords, {})

  return renderPattern(hands, BALLAD, {
    beatsPerChord: 4,
    beatsEach: beatsEach ?? chordDurations(chords, 4),
  })
}

/** Các mốc phách có sự kiện, không trùng lặp. */
const beatsOf = (events: { startBeat: number }[]) =>
  [...new Set(events.map((event) => event.startBeat))].sort((a, b) => a - b)

describe('mẫu cell rải ngắt mỗi ô nhịp', () => {
  it('ô nhịp trọn vẹn có tiếng đàn', () => {
    expect(beatsOf(render('C Am')).length).toBeGreaterThan(0)
  })

  it('các hit right có velocity khác nhau theo cell', () => {
    const events = render('C')
    const rights = events.filter((e) => e.hand === 'right')
    expect(rights.length).toBeGreaterThan(1)
  })

  it('hit cuối ô ngắn vừa đủ', () => {
    const lastHit = render('C').filter((e) => e.startBeat < 4).slice(-1)[0]
    expect(lastHit.startBeat + lastHit.durationBeats).toBeLessThanOrEqual(4)
  })

  it('hợp âm ngân hai ô thì lặp cell', () => {
    expect(beatsOf(render('C', [8])).length).toBeGreaterThan(
      beatsOf(render('C', [4])).length,
    )
  })

  it('hợp âm ngắn (chia đôi) sinh ít hit hơn', () => {
    expect(beatsOf(render('C Am', [2, 2])).length).toBeLessThan(
      beatsOf(render('C Am')).length,
    )
  })

  it('cell không kéo dài quá độ dài đoạn', () => {
    const events = render('C Am F G')
    const last = Math.max(
      ...events.map((event) => event.startBeat + event.durationBeats),
    )

    expect(last).toBeLessThanOrEqual(16)
  })
})

describe('ô nối sang đoạn mới không quạt hợp âm', () => {
  /*
    Ô đó dành trọn cho câu chạy ngón, nên phần đệm phải im hẳn — cả hợp âm lẫn
    nốt bass — không thì câu chạy vừa bị lấp vừa nghe dày.
  */
  const twoBars = () => {
    const chords = parseChordInput('C Am').chords
    return {
      hands: voiceLeadTwoHands(chords, {}),
      beatsEach: [8, 4],
    }
  }

  const renderWith = (barsWithoutComping?: Set<number>) => {
    const { hands, beatsEach } = twoBars()
    return renderPattern(hands, BALLAD, {
      beatsPerChord: 4,
      beatsEach,
      barsWithoutComping,
    })
  }

  it('ô nhịp cuối của hợp âm đó im hẳn', () => {
    const events = renderWith(new Set([0]))

    // Hợp âm đầu chạy từ phách 0 tới 8; ô cuối là phách 4 tới 8
    for (const event of events) {
      const inside = event.startBeat >= 4 && event.startBeat < 8
      expect(inside).toBe(false)
    }
  })

  it('ô nhịp đầu vẫn đệm như thường', () => {
    const events = renderWith(new Set([0]))
    const first = events.filter((event) => event.startBeat < 4)

    expect(first.length).toBeGreaterThan(0)
  })

  it('các hợp âm khác không bị đụng tới', () => {
    const events = renderWith(new Set([0]))
    const second = events.filter((event) => event.startBeat >= 8)

    expect(second.length).toBeGreaterThan(0)
  })

  it('không chỉ định thì không bỏ ô nào', () => {
    expect(renderWith().length).toBeGreaterThan(renderWith(new Set([0])).length)
  })

  it('hợp âm ngắn hơn một ô nhịp thì không có ô nào để nhường', () => {
    const chords = parseChordInput('C Am').chords
    const events = renderPattern(voiceLeadTwoHands(chords, {}), BALLAD, {
      beatsPerChord: 4,
      beatsEach: [2, 2],
      barsWithoutComping: new Set([0]),
    })

    expect(events.some((event) => event.startBeat === 0)).toBe(true)
  })
})
