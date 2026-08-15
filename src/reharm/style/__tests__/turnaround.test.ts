import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { SourceSection, TurnaroundTake } from '../arrangement'
import { buildArrangedSong } from '../arrangement'
import type { TimelineEvent } from '../types'
import { turnaroundInto } from '../turnaround'

const chord = (text: string) => parseChordInput(text).chords[0]

describe('cụm hợp âm quay đầu', () => {
  it('hai khe thì dùng đủ cặp bậc hai – bậc năm', () => {
    // Về Đô trưởng: bậc hai là Rê thứ, bậc năm là Sol
    const plan = turnaroundInto(chord('C'), 2)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G9sus4'])
  })

  it('bậc năm mang màu treo đúng như câu Khá Bự dạy', () => {
    /*
      Tài liệu phần 15 ghi lại `Dm7 → G9sus4 → CM7 → C7`. Hợp âm treo là một
      trong năm kỹ thuật lõi, nên bậc năm ở đây không dùng hợp âm bảy trơn.
    */
    const plan = turnaroundInto(chord('C'), 2)!

    expect(plan.chords[1].quality.id).toBe('9sus4')
  })

  it('một khe thì bỏ bậc hai, giữ bậc năm', () => {
    // Bậc năm mới là chỗ tạo sức hút, bậc hai chỉ dọn đường
    const plan = turnaroundInto(chord('C'), 1)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['G9sus4'])
  })

  it('hút về hợp âm thứ thì đổi sang nửa-giảm và bậc năm giáng chín', () => {
    const plan = turnaroundInto(chord('Am'), 2)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Bm7b5', 'E7b9'])
  })

  it('không dùng hợp âm treo khi hút về hợp âm thứ', () => {
    // Treo xoá mất quãng ba, tức xoá luôn cái làm nên màu thứ của chỗ sắp về
    const plan = turnaroundInto(chord('Am7'), 2)!

    expect(plan.chords[1].quality.intervals).toContain(4)
  })

  it('bậc năm luôn cách hợp âm đích đúng quãng năm', () => {
    for (const symbol of ['C', 'F', 'Bb', 'Eb', 'A', 'Db']) {
      const target = chord(symbol)
      const plan = turnaroundInto(target, 1)!

      expect((plan.chords[0].root - target.root + 12) % 12).toBe(7)
    }
  })

  it('không còn khe nào thì không dựng gì', () => {
    expect(turnaroundInto(chord('C'), 0)).toBeNull()
  })

  it('nhãn ghi đủ các hợp âm trong cụm', () => {
    expect(turnaroundInto(chord('C'), 2)!.label).toBe('Dm7 → G9sus4')
  })
})

describe('khi vòng đã kết sẵn ở bậc năm', () => {
  /*
    Đây là chính bài người dùng đang dựng: điệp khúc kết `G7` rồi vào lại
    `Cadd9`. G7 đã hút về C rồi, việc còn lại chỉ là dọn đường cho nó.
  */
  it('giữ nguyên hợp âm đang có, chỉ chèn thêm bậc hai phía trước', () => {
    const plan = turnaroundInto(chord('Cadd9'), 2, chord('G7'))!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G7'])
  })

  it('không thay bậc năm bằng hợp âm treo', () => {
    /*
      `G7` có quãng ba nên hút mạnh hơn `G9sus4`. Thay nó bằng hợp âm treo là
      làm yếu đi đúng cái mình đang muốn mạnh lên.
    */
    const plan = turnaroundInto(chord('Cadd9'), 2, chord('G7'))!

    expect(plan.chords[1].quality.id).toBe('7')
  })

  it('không còn khe để chèn thêm thì không đụng vào', () => {
    expect(turnaroundInto(chord('Cadd9'), 1, chord('G7'))).toBeNull()
  })

  it('kết ở hợp âm khác thì vẫn dựng đủ cụm mới', () => {
    const plan = turnaroundInto(chord('C'), 2, chord('F'))!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G9sus4'])
  })

  it('nhãn ghi đúng hợp âm được giữ lại', () => {
    expect(turnaroundInto(chord('Cadd9'), 2, chord('G7'))!.label).toBe(
      'Dm7 → G7',
    )
  })

  it('hút về hợp âm thứ mà đã sẵn bậc năm thì cũng giữ nguyên', () => {
    const plan = turnaroundInto(chord('Am'), 2, chord('E7'))!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Bm7b5', 'E7'])
  })
})

/** Một sự kiện tối giản, chỉ cần mốc phách là đủ cho các test dưới đây. */
const at = (startBeat: number): TimelineEvent => ({
  startBeat,
  durationBeats: 1,
  notes: [60],
  hand: 'left',
  velocity: 0.7,
})

const sources: SourceSection[] = [
  { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 8 },
  { name: 'Điệp khúc', kind: 'verse', startBeat: 8, lengthBeats: 8 },
]

/** Câu quay đầu giả, chiếm hai phách cuối, đánh dấu bằng nốt 99. */
const fakeTurn = (): TurnaroundTake => ({
  events: [{ ...at(0), notes: [99] }],
  beats: 2,
})

const backing = Array.from({ length: 16 }, (_, beat) => at(beat))

function build(steps: Parameters<typeof buildArrangedSong>[0]['steps']) {
  return buildArrangedSong({
    accompaniment: backing,
    fills: [],
    solo: () => [],
    sources,
    steps,
    turnaround: fakeTurn,
  })
}

describe('ghép câu quay đầu vào cuối giang tấu', () => {
  it('chỉ lượt cuối mới đổi, các lượt trước giữ nguyên vòng', () => {
    /*
      Đổi sớm thì lượt sau vào lại nghe như bắt đầu nhầm chỗ: câu quay đầu báo
      hiệu "sắp hết", mà sau nó lại còn một lượt nữa.
    */
    const song = build([
      { type: 'interlude', over: 1, loops: 2 },
      { type: 'section', source: 1 },
    ])

    const marks = song.events
      .filter((event) => event.notes[0] === 99)
      .map((event) => event.startBeat)

    expect(marks).toEqual([14])
  })

  it('phần vòng bị cụm quay đầu chiếm chỗ thì không phát nữa', () => {
    // Hai thứ chồng lên nhau cùng một chỗ là hai hoà âm khác nhau đánh nhau
    const song = build([
      { type: 'interlude', over: 1, loops: 1 },
      { type: 'section', source: 1 },
    ])

    const backingBeats = song.events
      .filter((event) => event.notes[0] !== 99 && event.startBeat < 8)
      .map((event) => event.startBeat)

    expect(backingBeats).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('độ dài cả bài không đổi vì cụm quay đầu mượn chỗ chứ không thêm', () => {
    const steps = [
      { type: 'interlude' as const, over: 1, loops: 2 },
      { type: 'section' as const, source: 1 },
    ]

    const withTurn = build(steps)
    const without = buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps,
    })

    expect(withTurn.totalBeats).toBe(without.totalBeats)
  })

  it('giang tấu là bước cuối thì không quay đầu về đâu cả', () => {
    // Hút về một chỗ không tồn tại chỉ làm bài kết lửng
    const song = build([
      { type: 'section', source: 0 },
      { type: 'interlude', over: 1, loops: 1 },
    ])

    expect(song.events.some((event) => event.notes[0] === 99)).toBe(false)
  })

  it('bước sau lại là giang tấu thì hút về đoạn mà nó mượn vòng', () => {
    const seen: string[] = []

    buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps: [
        { type: 'interlude', over: 1, loops: 1 },
        { type: 'interlude', over: 0, loops: 1 },
      ],
      turnaround: (_over, next) => {
        seen.push(next.name)
        return null
      },
    })

    expect(seen).toEqual(['Phiên khúc'])
  })

  it('không cấp câu quay đầu thì dòng thời gian y như cũ', () => {
    const steps = [
      { type: 'interlude' as const, over: 1, loops: 1 },
      { type: 'section' as const, source: 0 },
    ]

    const plain = buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps,
    })

    expect(plain.events.filter((e) => e.startBeat < 8)).toHaveLength(8)
  })
})
