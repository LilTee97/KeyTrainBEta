import { describe, expect, it } from 'vitest'
import type { ArrangementStep, SourceSection } from '../arrangement'
import {
  buildArrangedSong,
  defaultArrangement,
  stepLabel,
} from '../arrangement'
import type { TimelineEvent } from '../types'

/**
 * Thứ tự chơi: đoạn nào trước, đoạn nào lặp lại, kết ở đâu.
 *
 * Bản nhạc chỉ mô tả được các đoạn **có gì**, không mô tả được chơi **theo thứ
 * tự nào** — mà rất nhiều bài chơi xong giang tấu thì quay lại điệp khúc rồi
 * mới kết, trong khi trên lời điệp khúc chỉ viết một lần.
 */

function event(
  label: 'accompaniment' | 'fill' | 'solo',
  startBeat: number,
  hand: TimelineEvent['hand'] = 'right',
): TimelineEvent {
  return {
    notes: [60],
    startBeat,
    durationBeats: 1,
    hand,
    velocity: label === 'accompaniment' ? 10 : label === 'fill' ? 20 : 30,
  }
}

/** Bài gốc mười sáu phách: phiên khúc tám phách rồi điệp khúc tám phách. */
const SOURCES: SourceSection[] = [
  { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 8 },
  { name: 'Điệp khúc', kind: 'chorus', startBeat: 8, lengthBeats: 8 },
]

const ACCOMPANIMENT = [0, 4, 8, 12].flatMap((beat) => [
  event('accompaniment', beat, 'left'),
  event('accompaniment', beat, 'right'),
])
const FILLS = [3, 7, 11, 15].map((beat) => event('fill', beat))
const soloFor = (take: number): TimelineEvent[] =>
  [0, 4, 8, 12].map((beat) => ({ ...event('solo', beat), notes: [60 + take] }))

const build = (steps: readonly ArrangementStep[]) =>
  buildArrangedSong({
    accompaniment: ACCOMPANIMENT,
    fills: FILLS,
    solo: soloFor,
    sources: SOURCES,
    steps,
  })

describe('thứ tự mặc định', () => {
  it('chơi lần lượt từng đoạn đúng một lượt', () => {
    expect(defaultArrangement(SOURCES)).toEqual([
      { type: 'section', source: 0 },
      { type: 'section', source: 1 },
    ])
  })

  it('dựng lại đúng độ dài bài gốc', () => {
    const song = build(defaultArrangement(SOURCES))
    expect(song.totalBeats).toBe(16)
  })
})

describe('đoạn lặp lại', () => {
  /*
    Đây là thứ đánh dấu trên lời không làm được: điệp khúc chỉ viết một lần
    nhưng chơi hai lần.
  */
  it('chơi được cùng một đoạn nhiều lần', () => {
    const song = build([
      { type: 'section', source: 0 },
      { type: 'section', source: 1 },
      { type: 'section', source: 1 },
    ])

    expect(song.totalBeats).toBe(24)
    expect(song.sections.map((section) => section.startBeat)).toEqual([0, 8, 16])
  })

  it('lần chơi sau nối ngay sau lần trước, không hở không chồng', () => {
    const song = build([
      { type: 'section', source: 1 },
      { type: 'section', source: 0 },
    ])

    let expected = 0
    for (const section of song.sections) {
      expect(section.startBeat).toBe(expected)
      expected += section.lengthBeats
    }
    expect(song.totalBeats).toBe(expected)
  })

  it('đổi thứ tự thì đoạn nào đứng trước chơi trước', () => {
    const song = build([
      { type: 'section', source: 1 },
      { type: 'section', source: 0 },
    ])

    expect(song.sections.map((section) => section.kind)).toEqual([
      'chorus',
      'verse',
    ])
  })
})

describe('giang tấu chèn vào chỗ trống', () => {
  /*
    Chỗ trống không có lời cũng chẳng có hợp âm để quét, nên giang tấu **mượn
    vòng hợp âm của một đoạn khác** — thường là điệp khúc.
  */
  const steps: ArrangementStep[] = [
    { type: 'section', source: 0 },
    { type: 'section', source: 1 },
    { type: 'interlude', over: 1, loops: 1 },
    { type: 'section', source: 1 },
  ]

  it('dài đúng bằng đoạn mà nó mượn vòng', () => {
    const song = build(steps)
    const interlude = song.sections[2]

    expect(interlude.kind).toBe('interlude')
    expect(interlude.lengthBeats).toBe(8)
    expect(song.totalBeats).toBe(32)
  })

  it('bỏ phần đệm tay phải, giữ tay trái', () => {
    const song = build(steps)
    const interlude = song.sections[2]
    const inside = song.events.filter(
      (item) =>
        item.startBeat >= interlude.startBeat &&
        item.startBeat < interlude.startBeat + interlude.lengthBeats,
    )

    expect(
      inside.some((item) => item.velocity === 10 && item.hand === 'right'),
    ).toBe(false)
    expect(
      inside.some((item) => item.velocity === 10 && item.hand === 'left'),
    ).toBe(true)
  })

  it('nhận câu solo, không nhận câu fill', () => {
    const song = build(steps)
    const interlude = song.sections[2]
    const inside = song.events.filter(
      (item) =>
        item.startBeat >= interlude.startBeat &&
        item.startBeat < interlude.startBeat + interlude.lengthBeats,
    )

    expect(inside.some((item) => item.velocity === 30)).toBe(true)
    expect(inside.some((item) => item.velocity === 20)).toBe(false)
  })

  it('lặp nhiều lượt thì dài gấp bấy nhiêu lần', () => {
    const song = build([{ type: 'interlude', over: 0, loops: 3 }])

    expect(song.sections[0].lengthBeats).toBe(24)
    expect(song.totalBeats).toBe(24)
  })

  it('mỗi lượt lặp là một câu ngẫu hứng khác nhau', () => {
    const song = build([{ type: 'interlude', over: 0, loops: 3 }])
    const notes = song.events
      .filter((item) => item.velocity === 30)
      .map((item) => item.notes[0])

    expect(new Set(notes).size).toBe(3)
    expect(song.soloTakes).toBe(3)
  })

  it('hai đoạn giang tấu rời nhau cũng không trùng câu', () => {
    const song = build([
      { type: 'interlude', over: 0, loops: 1 },
      { type: 'section', source: 1 },
      { type: 'interlude', over: 0, loops: 1 },
    ])

    const notes = song.events
      .filter((item) => item.velocity === 30)
      .map((item) => item.notes[0])

    expect(new Set(notes).size).toBe(2)
  })
})

describe('những trường hợp lệch lạc', () => {
  it('không có bước nào thì không có gì để chơi', () => {
    const song = build([])

    expect(song.events).toEqual([])
    expect(song.totalBeats).toBe(0)
  })

  it('bước trỏ vào đoạn không tồn tại thì bỏ qua, không ném lỗi', () => {
    const song = build([
      { type: 'section', source: 99 },
      { type: 'section', source: 0 },
    ])

    expect(song.sections).toHaveLength(1)
    expect(song.totalBeats).toBe(8)
  })

  it('số lượt nhỏ hơn một vẫn chơi một lượt', () => {
    const song = build([{ type: 'interlude', over: 0, loops: 0 }])
    expect(song.totalBeats).toBe(8)
  })
})

describe('nhãn hiện trên giao diện', () => {
  it('bước đoạn lấy tên của đoạn đó', () => {
    expect(stepLabel({ type: 'section', source: 1 }, SOURCES)).toBe('Điệp khúc')
  })

  it('bước giang tấu ghi rõ nó mượn vòng của đoạn nào', () => {
    expect(stepLabel({ type: 'interlude', over: 1, loops: 1 }, SOURCES)).toBe(
      'Giang tấu (vòng Điệp khúc)',
    )
  })

  it('lặp nhiều lượt thì ghi thêm số lượt', () => {
    expect(stepLabel({ type: 'interlude', over: 0, loops: 2 }, SOURCES)).toBe(
      'Giang tấu (vòng Phiên khúc) ×2',
    )
  })
})
