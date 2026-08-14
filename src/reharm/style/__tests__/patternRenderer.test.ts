import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import {
  eventsForHand,
  renderPattern,
  timelineLengthBeats,
} from '../patternRenderer'
import { BALLAD } from '../styleLibrary/ballad'
import type { StylePattern } from '../types'

function voicings(input: string): TwoHandVoicing[] {
  return voiceLeadTwoHands(parseChordInput(input).chords)
}

/** Điệu giả có mẫu tiết tấu cố định, để test nhánh còn lại. */
const FAKE_CELL_STYLE: StylePattern = {
  id: 'test-cell',
  name: 'Điệu thử',
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  feel: 'syncopated-3-3-2',
  verified: false,
  cell: {
    lengthBeats: 4,
    right: [
      { beat: 0, durationBeats: 1 },
      { beat: 2, durationBeats: 1 },
    ],
    left: [{ beat: 0, durationBeats: 2 }],
  },
  note: 'Chỉ dùng cho test.',
}

describe('dữ liệu điệu ballad', () => {
  it('không có mẫu tiết tấu cố định', () => {
    // Đây là kết luận cốt lõi của tài liệu về ballad, không phải thiếu sót
    expect(BALLAD.cell).toBeNull()
  })

  it('được đánh dấu là đã xác nhận từ video', () => {
    expect(BALLAD.verified).toBe(true)
    expect(BALLAD.sourceVideos?.length).toBeGreaterThan(0)
  })

  it('là nhịp bốn bốn, cảm giác thẳng', () => {
    expect(BALLAD.beatsPerMeasure).toBe(4)
    expect(BALLAD.feel).toBe('straight-block-chord')
  })
})

describe('renderPattern — nhánh ballad', () => {
  it('chuỗi rỗng cho dòng thời gian rỗng', () => {
    expect(renderPattern([], BALLAD)).toEqual([])
  })

  it('sinh tiếng đàn cho cả hai tay', () => {
    const events = renderPattern(voicings('Dm7 G7 Cmaj7'), BALLAD)

    expect(events.some((event) => event.hand === 'left')).toBe(true)
    expect(events.some((event) => event.hand === 'right')).toBe(true)
  })

  it('hai tay đánh cùng lúc, đúng lối hợp âm khối', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD)

    const leftStarts = events
      .filter((event) => event.hand === 'left')
      .map((event) => event.startBeat)
    const rightStarts = events
      .filter((event) => event.hand === 'right')
      .map((event) => event.startBeat)

    expect(leftStarts).toEqual(rightStarts)
  })

  it('mỗi hợp âm chiếm trọn một ô nhịp theo mặc định', () => {
    const events = renderPattern(voicings('Dm7 G7 Cmaj7'), BALLAD)
    expect(timelineLengthBeats(events)).toBeGreaterThan(11)
    expect(timelineLengthBeats(events)).toBeLessThanOrEqual(12)
  })

  it('hợp âm ngân trọn ô nhịp thì được đánh lại ở giữa', () => {
    const events = renderPattern(voicings('Cmaj7'), BALLAD)
    const rightHits = events.filter((event) => event.hand === 'right')

    expect(rightHits).toHaveLength(2)
    expect(rightHits[0].startBeat).toBe(0)
    expect(rightHits[1].startBeat).toBe(2)
  })

  it('lần đánh lại nhẹ hơn lần đầu để nghe ra chỗ đổi hợp âm', () => {
    const events = renderPattern(voicings('Cmaj7'), BALLAD)
    const rightHits = events.filter((event) => event.hand === 'right')

    expect(rightHits[1].velocity).toBeLessThan(rightHits[0].velocity)
  })

  it('hợp âm đổi dày thì không đánh lại, chỉ một tiếng mỗi hợp âm', () => {
    // Hai hợp âm mỗi ô nhịp
    const events = renderPattern(voicings('Dm7 G7'), BALLAD, {
      beatsPerChord: 2,
    })
    const rightHits = events.filter((event) => event.hand === 'right')

    expect(rightHits).toHaveLength(2)
  })

  it('tay trái đánh nhẹ hơn tay phải', () => {
    const events = renderPattern(voicings('Dm7'), BALLAD)

    const left = events.find((event) => event.hand === 'left')!
    const right = events.find((event) => event.hand === 'right')!
    expect(left.velocity).toBeLessThan(right.velocity)
  })

  it('cắt bớt độ ngân để hai hợp âm không chồng tiếng', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD, {
      beatsPerChord: 2,
    })

    for (const event of events) {
      expect(event.durationBeats).toBeLessThan(2)
    }
  })

  it('dùng đúng nốt của thế bấm hai tay', () => {
    const chords = voicings('Cmaj7')
    const events = renderPattern(chords, BALLAD)

    const right = events.find((event) => event.hand === 'right')!
    const left = events.find((event) => event.hand === 'left')!

    expect(right.notes).toEqual(chords[0].right)
    expect(left.notes).toEqual(chords[0].left)
  })

  it('sự kiện luôn xếp theo thời gian tăng dần', () => {
    const events = renderPattern(voicings('Am11 D9sus4 E9sus4 Em7'), BALLAD)

    for (let index = 1; index < events.length; index += 1) {
      expect(events[index].startBeat).toBeGreaterThanOrEqual(
        events[index - 1].startBeat,
      )
    }
  })

  it('mọi lực nhấn nằm trong dải MIDI hợp lệ', () => {
    const events = renderPattern(voicings('Dm7 G7 Cmaj7'), BALLAD)

    for (const event of events) {
      expect(event.velocity).toBeGreaterThanOrEqual(1)
      expect(event.velocity).toBeLessThanOrEqual(127)
    }
  })
})

describe('renderPattern — nhánh điệu có mẫu tiết tấu', () => {
  it('lặp mẫu suốt cả đoạn', () => {
    const events = renderPattern(voicings('Dm7 G7'), FAKE_CELL_STYLE)
    const rightHits = events.filter((event) => event.hand === 'right')

    // Mẫu dài bốn phách, hai tiếng mỗi lần lặp, hai ô nhịp
    expect(rightHits).toHaveLength(4)
    expect(rightHits.map((hit) => hit.startBeat)).toEqual([0, 2, 4, 6])
  })

  it('mỗi tiếng lấy thế bấm của hợp âm đang vang lúc đó', () => {
    const chords = voicings('Dm7 G7')
    const events = renderPattern(chords, FAKE_CELL_STYLE)

    const atBeatZero = events.find(
      (event) => event.startBeat === 0 && event.hand === 'right',
    )!
    const atBeatFour = events.find(
      (event) => event.startBeat === 4 && event.hand === 'right',
    )!

    expect(atBeatZero.notes).toEqual(chords[0].right)
    expect(atBeatFour.notes).toEqual(chords[1].right)
  })

  it('không sinh tiếng vượt quá độ dài đoạn', () => {
    const events = renderPattern(voicings('Dm7'), FAKE_CELL_STYLE)

    for (const event of events) {
      expect(event.startBeat).toBeLessThan(4)
    }
  })
})

describe('eventsForHand', () => {
  it('lọc được riêng từng tay', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD)

    expect(
      eventsForHand(events, 'left').every((event) => event.hand === 'left'),
    ).toBe(true)
    expect(
      eventsForHand(events, 'right').every((event) => event.hand === 'right'),
    ).toBe(true)
  })

  it('lấy cả hai tay thì giữ nguyên số sự kiện', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD)
    expect(eventsForHand(events, 'both')).toHaveLength(events.length)
  })
})

describe('timelineLengthBeats', () => {
  it('dòng thời gian rỗng có độ dài bằng không', () => {
    expect(timelineLengthBeats([])).toBe(0)
  })

  it('tính theo tiếng đàn kết thúc muộn nhất', () => {
    expect(
      timelineLengthBeats([
        { notes: [60], startBeat: 0, durationBeats: 2, hand: 'right', velocity: 80 },
        { notes: [60], startBeat: 4, durationBeats: 1, hand: 'right', velocity: 80 },
      ]),
    ).toBe(5)
  })
})
