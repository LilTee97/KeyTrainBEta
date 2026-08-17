import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import {
  eventsForHand,
  renderPattern,
  timelineLengthBeats,
} from '../patternRenderer'
import { BALLAD, balladCellFor, balladDensityOf } from '../styleLibrary/ballad'
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
  it('có mẫu cell Khá Bự (phách 1 và 3)', () => {
    expect(BALLAD.cell).not.toBeNull()
    expect(BALLAD.cell!.lengthBeats).toBe(4)
    expect(BALLAD.cell!.left.map((hit) => hit.beat)).toEqual([0, 2])
  })

  it('được đánh dấu là đã xác nhận từ video', () => {
    expect(BALLAD.verified).toBe(true)
    expect(BALLAD.sourceVideos?.length).toBeGreaterThan(0)
  })

  it('là nhịp bốn bốn, hợp âm khối', () => {
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

  it('lặp mẫu cell: có cả left và right theo cell', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD)
    // cell Khá Bự: left+right cùng phách 1 và 3
    expect(events.some((e) => e.hand === 'left')).toBe(true)
    expect(events.some((e) => e.hand === 'right')).toBe(true)
  })

  it('đầu ô nhịp có left theo cell (root bass)', () => {
    const events = renderPattern(voicings('Dm7'), BALLAD)
    const downbeat = events.filter((event) => event.startBeat === 0)

    expect(downbeat.length).toBeGreaterThanOrEqual(1)
    expect(downbeat.some((e) => e.hand === 'left')).toBe(true)
  })

  it('mỗi hợp âm chiếm trọn một ô nhịp theo mặc định', () => {
    const events = renderPattern(voicings('Dm7 G7 Cmaj7'), BALLAD)
    expect(timelineLengthBeats(events)).toBeGreaterThan(11)
    expect(timelineLengthBeats(events)).toBeLessThanOrEqual(12)
  })

  it('hợp âm ngân trọn ô nhịp thì lặp cell nhiều lần', () => {
    const events = renderPattern(voicings('Cmaj7'), BALLAD)
    const rightHits = events.filter((event) => event.hand === 'right')

    // cell right hits at 0.75, 1.75, 3  per bar; over 4 beats expect several
    expect(rightHits.length).toBeGreaterThan(1)
    expect(rightHits[0].startBeat).toBeCloseTo(0)
  })

  it('các hit trong cell có velocity scale khác nhau', () => {
    const events = renderPattern(voicings('Cmaj7'), BALLAD)
    const right = events.filter((e) => e.hand === 'right')
    // different scales in cell (0.8, 1, 0.75)
    expect(right.length).toBeGreaterThan(1)
  })

  it('hợp âm đổi dày vẫn áp cell (có thể ít hit hơn nếu ngắn)', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD, {
      beatsPerChord: 2,
    })
    const rightHits = events.filter((event) => event.hand === 'right')

    // với cell 4-beat, khi mỗi hợp âm chỉ 2 beat, số hit giảm
    expect(rightHits.length).toBeLessThanOrEqual(4)
  })

  it('tay trái đánh nhẹ hơn tay phải theo LEFT_HAND_SCALE', () => {
    const events = renderPattern(voicings('Dm7'), BALLAD)
    const leftHit = events.find((e) => e.hand === 'left' && e.startBeat === 0)!
    expect(leftHit.velocity).toBeLessThan(80)
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

describe('ballad mật độ theo đoạn', () => {
  it('map kind → verse / pre / chorus', () => {
    expect(balladDensityOf('verse')).toBe('verse')
    expect(balladDensityOf('intro')).toBe('verse')
    expect(balladDensityOf('prechorus')).toBe('pre')
    expect(balladDensityOf('chorus')).toBe('chorus')
    expect(balladDensityOf('bridge')).toBe('chorus')
  })

  it('chorus dày hơn verse', () => {
    const verse = renderPattern(voicings('C'), BALLAD)
    const chorus = renderPattern(voicings('C'), BALLAD, {
      cellAt: () => balladCellFor('chorus'),
    })
    expect(chorus.length).toBeGreaterThan(verse.length)
  })

  it('đổi cell giữa bài: nửa đầu verse, nửa sau chorus', () => {
    const events = renderPattern(voicings('C Am'), BALLAD, {
      cellAt: (beat) => balladCellFor(beat < 4 ? 'verse' : 'chorus'),
    })
    const first = events.filter((e) => e.startBeat < 4)
    const second = events.filter((e) => e.startBeat >= 4)
    expect(second.length).toBeGreaterThan(first.length)
  })
})
