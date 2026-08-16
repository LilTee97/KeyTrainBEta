import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { renderPattern } from '../../style/patternRenderer'
import { BALLAD, VALSE } from '../../style/styleLibrary'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import type { GatedStep } from '../noteGatedPlaybackEngine'
import type { TimelineEvent } from '../../style/types'
import {
  advance,
  buildGatedSteps,
  currentStep,
  isStepMatched,
  missingNotes,
  progressOf,
  registerMiss,
  restart,
  startGatedSession,
} from '../noteGatedPlaybackEngine'

function voicings(input: string): TwoHandVoicing[] {
  return voiceLeadTwoHands(parseChordInput(input).chords)
}

/** Dựng các chặng từ một vòng hợp âm và điệu. */
function stepsFor(
  input: string,
  hand: 'both' | 'left' | 'right' = 'both',
): GatedStep[] {
  const chords = voicings(input)
  const events = renderPattern(chords, BALLAD, { beatsPerChord: 4 })
  return buildGatedSteps(events, chords, { hand, beatsPerChord: 4 })
}

describe('buildGatedSteps', () => {
  it('gom các tiếng đàn cùng thời điểm làm một chặng', () => {
    const steps = stepsFor('Cmaj7')

    // Ballad đánh hai tay cùng lúc, nên mỗi thời điểm chỉ là một chặng
    for (const step of steps) {
      expect(step.leftNotes.length + step.rightNotes.length).toBe(
        step.notes.length,
      )
    }
  })

  it('chặng xếp theo thời gian tăng dần', () => {
    const steps = stepsFor('Dm7 G7 Cmaj7')

    for (let index = 1; index < steps.length; index += 1) {
      expect(steps[index].startBeat).toBeGreaterThan(
        steps[index - 1].startBeat,
      )
    }
  })

  it('mỗi chặng ghi tên hợp âm đang vang', () => {
    const steps = stepsFor('Dm7 G7')

    expect(steps[0].symbol).toBe('Dm7')
    expect(steps[steps.length - 1].symbol).toBe('G7')
  })

  it('lọc riêng tay trái thì chỉ còn nốt tay trái', () => {
    const steps = stepsFor('Dm7 G7', 'left')

    for (const step of steps) {
      expect(step.rightNotes).toEqual([])
      expect(step.leftNotes.length).toBeGreaterThan(0)
    }
  })

  it('lọc riêng tay phải thì chỉ còn nốt tay phải', () => {
    const steps = stepsFor('Dm7 G7', 'right')

    for (const step of steps) {
      expect(step.leftNotes).toEqual([])
      expect(step.rightNotes.length).toBeGreaterThan(0)
    }
  })

  it('luyện một tay thì ít nốt hơn luyện hai tay', () => {
    const both = stepsFor('Dm7 G7')
    const rightOnly = stepsFor('Dm7 G7', 'right')

    const countNotes = (steps: GatedStep[]) =>
      steps.reduce((sum, step) => sum + step.notes.length, 0)

    expect(countNotes(rightOnly)).toBeLessThan(countNotes(both))
  })

  it('không có chặng rỗng', () => {
    for (const hand of ['both', 'left', 'right'] as const) {
      for (const step of stepsFor('Dm7 G7 Cmaj7', hand)) {
        expect(step.notes.length).toBeGreaterThan(0)
      }
    }
  })

  it('không có nốt trùng trong một chặng', () => {
    for (const step of stepsFor('Cmaj7 Am7')) {
      expect(new Set(step.notes).size).toBe(step.notes.length)
    }
  })

  it('dựng được chặng cho điệu có mẫu tiết tấu cố định', () => {
    const chords = voicings('C F G')
    const events = renderPattern(chords, VALSE, { beatsPerChord: 3 })
    const steps = buildGatedSteps(events, chords, { beatsPerChord: 3 })

    expect(steps.length).toBeGreaterThan(0)
    // Điệu valse hai tay không đánh cùng lúc nên có chặng chỉ một tay
    expect(
      steps.some((step) => step.leftNotes.length === 0),
    ).toBe(true)
  })

  it('dòng thời gian rỗng cho danh sách chặng rỗng', () => {
    expect(buildGatedSteps([], [], { beatsPerChord: 4 })).toEqual([])
  })
})

describe('isStepMatched', () => {
  const step: GatedStep = {
    startBeat: 0,
    notes: [40, 60, 64, 67],
    leftNotes: [40],
    rightNotes: [60, 64, 67],
    symbol: 'C',
  }

  it('bấm đúng đủ nốt là qua', () => {
    expect(isStepMatched([40, 60, 64, 67], step)).toBe(true)
  })

  it('thứ tự bấm không quan trọng', () => {
    expect(isStepMatched([67, 40, 64, 60], step)).toBe(true)
  })

  it('thiếu nốt thì chưa qua', () => {
    expect(isStepMatched([40, 60, 64], step)).toBe(false)
  })

  it('thừa nốt thì chưa qua', () => {
    expect(isStepMatched([40, 60, 64, 67, 71], step)).toBe(false)
  })

  it('chưa bấm gì thì chưa qua', () => {
    expect(isStepMatched([], step)).toBe(false)
  })

  it('mặc định đòi đúng quãng tám', () => {
    // Bấm đúng lớp cao độ nhưng sai quãng tám
    expect(isStepMatched([52, 72, 76, 79], step)).toBe(false)
  })

  it('bỏ qua quãng tám khi được yêu cầu', () => {
    expect(
      isStepMatched([52, 72, 76, 79], step, { ignoreOctave: true }),
    ).toBe(true)
  })

  it('bỏ qua quãng tám vẫn bắt đúng số lớp cao độ', () => {
    expect(
      isStepMatched([52, 72, 76], step, { ignoreOctave: true }),
    ).toBe(false)
  })

  it('chặng rỗng không bao giờ tính là qua', () => {
    const empty: GatedStep = {
      startBeat: 0,
      notes: [],
      leftNotes: [],
      rightNotes: [],
      symbol: '',
    }
    expect(isStepMatched([], empty)).toBe(false)
  })
})

describe('missingNotes', () => {
  const step: GatedStep = {
    startBeat: 0,
    notes: [40, 60, 64, 67],
    leftNotes: [40],
    rightNotes: [60, 64, 67],
    symbol: 'C',
  }

  it('chỉ ra đúng nốt còn thiếu', () => {
    expect(missingNotes([40, 60], step)).toEqual([64, 67])
  })

  it('bấm đủ thì không còn thiếu gì', () => {
    expect(missingNotes([40, 60, 64, 67], step)).toEqual([])
  })

  it('nốt thừa không ảnh hưởng tới danh sách thiếu', () => {
    expect(missingNotes([40, 60, 64, 67, 99], step)).toEqual([])
  })
})

describe('luồng một lượt luyện', () => {
  const steps = stepsFor('Dm7 G7')

  it('bắt đầu ở chặng đầu tiên', () => {
    const session = startGatedSession(steps)

    expect(session.currentIndex).toBe(0)
    expect(session.finished).toBe(false)
    expect(currentStep(session)).toBe(steps[0])
  })

  it('không có chặng nào thì coi như xong ngay', () => {
    const session = startGatedSession([])

    expect(session.finished).toBe(true)
    expect(currentStep(session)).toBeNull()
  })

  it('đi hết các chặng thì lượt kết thúc', () => {
    let session = startGatedSession(steps)
    for (let index = 0; index < steps.length; index += 1) {
      session = advance(session)
    }

    expect(session.finished).toBe(true)
    expect(currentStep(session)).toBeNull()
  })

  it('đi tiếp thì đếm lại số lần bấm sai từ đầu', () => {
    let session = startGatedSession(steps)
    session = registerMiss(session)
    session = registerMiss(session)
    expect(session.attempts).toBe(2)

    session = advance(session)
    expect(session.attempts).toBe(0)
  })

  it('ghi lại các chặng từng vướng, không ghi trùng', () => {
    let session = startGatedSession(steps)
    session = registerMiss(session)
    session = registerMiss(session)
    session = advance(session)
    session = registerMiss(session)

    expect(session.stumbled).toEqual([0, 1])
  })

  it('đã xong thì không đi tiếp được nữa', () => {
    let session = startGatedSession(steps)
    for (let index = 0; index < steps.length + 3; index += 1) {
      session = advance(session)
    }

    expect(session.currentIndex).toBe(steps.length)
  })

  it('bấm sai sau khi xong thì không ghi thêm gì', () => {
    let session = startGatedSession([])
    session = registerMiss(session)

    expect(session.attempts).toBe(0)
    expect(session.stumbled).toEqual([])
  })

  it('làm lại thì mọi thứ về đầu', () => {
    let session = startGatedSession(steps)
    session = registerMiss(session)
    session = advance(session)

    const fresh = restart(session)
    expect(fresh.currentIndex).toBe(0)
    expect(fresh.stumbled).toEqual([])
    expect(fresh.attempts).toBe(0)
  })

  it('không sửa vào trạng thái cũ', () => {
    const session = startGatedSession(steps)
    const snapshot = JSON.stringify(session)

    advance(session)
    registerMiss(session)

    expect(JSON.stringify(session)).toBe(snapshot)
  })
})

describe('progressOf', () => {
  const steps = stepsFor('Dm7 G7')

  it('mới bắt đầu thì tiến độ bằng không', () => {
    expect(progressOf(startGatedSession(steps)).ratio).toBe(0)
  })

  it('xong hết thì tiến độ đầy', () => {
    let session = startGatedSession(steps)
    for (let index = 0; index < steps.length; index += 1) {
      session = advance(session)
    }

    expect(progressOf(session).ratio).toBe(1)
    expect(progressOf(session).done).toBe(steps.length)
  })

  it('lượt rỗng coi như đã hoàn thành', () => {
    expect(progressOf(startGatedSession([])).ratio).toBe(1)
  })
})

describe('bấm đúng thế bấm mà app sinh ra thì luôn qua được', () => {
  it('đúng với mọi chặng của mọi chế độ tay', () => {
    for (const hand of ['both', 'left', 'right'] as const) {
      for (const step of stepsFor('Am11 D9sus4 E9sus4 Em7', hand)) {
        expect(isStepMatched(step.notes, step)).toBe(true)
      }
    }
  })
})

describe('chặng chờ nốt bỏ qua nốt láy', () => {
  /*
    Nốt láy vang trước nốt chính đúng một nốt kép. Tính nó thành chặng riêng
    thì người tập phải bấm nó, chờ máy cho qua, rồi mới bấm nốt chính — mà nốt
    láy vốn là một cú vuốt liền tay, không phải hai lần bấm.
  */
  const withGrace: TimelineEvent[] = [
    { notes: [71], startBeat: 0.875, durationBeats: 0.125, hand: 'right', velocity: 60, grace: true },
    { notes: [72], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 90 },
  ]

  it('nốt láy không thành chặng riêng', () => {
    const steps = buildGatedSteps(withGrace, [], { beatsPerChord: 4 })

    expect(steps).toHaveLength(1)
    expect(steps[0].startBeat).toBe(1)
  })

  it('nốt láy cũng không bị gộp vào chặng của nốt chính', () => {
    // Gộp chung thì thành ra phải giữ cả hai nốt cùng lúc
    const steps = buildGatedSteps(withGrace, [], { beatsPerChord: 4 })

    expect(steps[0].notes).toEqual([72])
  })

  it('nốt thường vẫn giữ nguyên chặng của mình', () => {
    const plain: TimelineEvent[] = [
      { notes: [60], startBeat: 0, durationBeats: 1, hand: 'left', velocity: 80 },
      { notes: [64], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 80 },
    ]

    expect(buildGatedSteps(plain, [], { beatsPerChord: 4 })).toHaveLength(2)
  })
})
