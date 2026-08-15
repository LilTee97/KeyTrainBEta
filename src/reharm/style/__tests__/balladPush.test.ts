import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordDurations } from '../../chordTiming'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { BALLAD } from '../styleLibrary'

/**
 * Cú đẩy trước vạch nhịp.
 *
 * Đếm trên bản ký âm `reference/nguoi ay.mxl`: tay trái có đúng ba cú mỗi ô —
 * bass ở phách 1, hợp âm ở phách 3, và một cú đẩy ở phách 4,5 — lặp ở 24 trên
 * 28 ô nhịp. Thiếu cú thứ ba thì mỗi ô đứng lại một phách rưỡi và chỗ chuyển
 * đoạn nghe hụt hẳn.
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

describe('ba cú mỗi ô nhịp', () => {
  it('ô nhịp trọn vẹn có cú đẩy ở nửa phách trước vạch nhịp', () => {
    expect(beatsOf(render('C Am'))).toEqual([0, 2, 3.5, 4, 6, 7.5])
  })

  it('cú đẩy nhẹ hơn hẳn hai cú chính', () => {
    // Nó bắc cầu sang ô sau, không phải chỗ nhấn
    const events = render('C')
    const push = events.find((event) => event.startBeat === 3.5)!
    const downbeat = events.find((event) => event.startBeat === 0)!

    expect(push.velocity).toBeLessThan(downbeat.velocity)
  })

  it('cú đẩy ngắn, không ngân đè sang ô sau', () => {
    const push = render('C').find((event) => event.startBeat === 3.5)!

    expect(push.startBeat + push.durationBeats).toBeLessThanOrEqual(4)
  })

  it('hợp âm ngân hai ô thì mỗi ô được đủ hình ba tiếng', () => {
    // Không phải hai tiếng cách nhau bốn phách như bản đầu
    expect(beatsOf(render('C', [8]))).toEqual([0, 2, 3.5, 4, 6, 7.5])
  })

  it('ô đã chia đôi thì không đẩy', () => {
    /*
      Chỗ đó vốn đã dày vì hai hợp âm chung một ô, đẩy thêm chỉ thành rối.
    */
    expect(beatsOf(render('C Am', [2, 2]))).toEqual([0, 2])
  })

  it('cú đẩy không đẻ thêm ô nhịp nào', () => {
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
