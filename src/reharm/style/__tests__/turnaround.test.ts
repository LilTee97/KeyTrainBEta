import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { SourceSection, TurnaroundTake } from '../arrangement'
import { buildArrangedSong } from '../arrangement'
import type { TimelineEvent } from '../types'
import { arpeggioRun } from '../../fillSoloGenerator/leadIn'
import { pullChordFor, turnaroundInto } from '../turnaround'

const chord = (text: string) => parseChordInput(text).chords[0]

describe('cụm hợp âm quay đầu', () => {
  it('chơi đủ vòng hai-năm-một, kể cả hợp âm đích', () => {
    /*
      Bản đầu chỉ chơi hai hợp âm đầu rồi để đoạn sau tự vào ở hợp âm đích —
      nghe như câu nói bỏ lửng, vì vòng chưa được đóng lại. Hợp âm đích vang
      hai lần, và đó đúng là cách người ta chốt một câu rồi bắt đầu câu tiếp
      theo trên cùng hợp âm.
    */
    const plan = turnaroundInto(chord('C'), 2)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G9sus4', 'C'])
  })

  it('hợp âm cuối cụm đúng là hợp âm của đoạn sắp vào', () => {
    for (const symbol of ['Cadd9', 'Fmaj7', 'Am9']) {
      const plan = turnaroundInto(chord(symbol), 2)!
      expect(plan.chords.at(-1)!.symbol).toBe(symbol)
    }
  })

  it('bậc năm mang màu treo đúng như câu Khá Bự dạy', () => {
    /*
      Tài liệu phần 15 ghi lại `Dm7 → G9sus4 → CM7 → C7`. Hợp âm treo là một
      trong năm kỹ thuật lõi, nên bậc năm ở đây không dùng hợp âm bảy trơn.
    */
    const plan = turnaroundInto(chord('C'), 2)!

    expect(plan.chords[1].quality.id).toBe('9sus4')
  })

  it('một khe thì bỏ bậc hai, giữ bậc năm và hợp âm đích', () => {
    // Bậc năm mới là chỗ tạo sức hút, bậc hai chỉ dọn đường
    const plan = turnaroundInto(chord('C'), 1)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['G9sus4', 'C'])
  })

  it('hút về hợp âm thứ thì đổi sang nửa-giảm và bậc năm giáng chín', () => {
    const plan = turnaroundInto(chord('Am'), 2)!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Bm7b5', 'E7b9', 'Am'])
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
    expect(turnaroundInto(chord('C'), 2)!.label).toBe('Dm7 → G9sus4 → C')
  })
})

describe('khi vòng đã kết sẵn ở bậc năm', () => {
  /*
    Đây là chính bài người dùng đang dựng: điệp khúc kết `G7` rồi vào lại
    `Cadd9`. G7 đã hút về C rồi, việc còn lại chỉ là dọn đường cho nó.
  */
  it('giữ nguyên hợp âm đang có, chỉ chèn thêm bậc hai phía trước', () => {
    const plan = turnaroundInto(chord('Cadd9'), 2, chord('G7'))!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G7', 'Cadd9'])
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

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Dm7', 'G9sus4', 'C'])
  })

  it('nhãn ghi đúng hợp âm được giữ lại', () => {
    expect(turnaroundInto(chord('Cadd9'), 2, chord('G7'))!.label).toBe(
      'Dm7 → G7 → Cadd9',
    )
  })

  it('hút về hợp âm thứ mà đã sẵn bậc năm thì cũng giữ nguyên', () => {
    const plan = turnaroundInto(chord('Am'), 2, chord('E7'))!

    expect(plan.chords.map((c) => c.symbol)).toEqual(['Bm7b5', 'E7', 'Am'])
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

describe('nghỉ sau đoạn giang tấu', () => {
  /*
    Hết ngẫu hứng mà đoạn hát vào ngay thì không có chỗ nào để tai chuyển từ
    lối nghe độc tấu sang lối nghe bài hát. Một ô nhịp trống làm việc đó.
  */
  const rested = (steps: Parameters<typeof buildArrangedSong>[0]['steps']) =>
    buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps,
      turnaround: fakeTurn,
      restAfterInterlude: 4,
    })

  it('bài dài thêm đúng số phách đã nghỉ', () => {
    const steps = [
      { type: 'interlude' as const, over: 1, loops: 1 },
      { type: 'section' as const, source: 0 },
    ]

    expect(rested(steps).totalBeats).toBe(build(steps).totalBeats + 4)
  })

  it('khoảng nghỉ không có tiếng nào', () => {
    const song = rested([
      { type: 'interlude', over: 1, loops: 1 },
      { type: 'section', source: 0 },
    ])

    // Giang tấu chiếm phách 0-8, nghỉ từ 8 tới 12
    for (const event of song.events) {
      const inside = event.startBeat >= 8 && event.startBeat < 12
      expect(inside).toBe(false)
    }
  })

  it('nghỉ trọn ô nhịp thì bỏ câu quay đầu', () => {
    /*
      Câu quay đầu dẫn thẳng vào hợp âm ngay sau nó, mà cách nhau cả ô nhịp im
      lặng thì nó chẳng dẫn vào đâu, lại nghe như bị cắt ngang.
    */
    const song = rested([
      { type: 'interlude', over: 1, loops: 1 },
      { type: 'section', source: 0 },
    ])

    expect(song.events.some((event) => event.notes[0] === 99)).toBe(false)
  })

  it('nghỉ ngắn hơn một ô nhịp thì vẫn giữ câu quay đầu', () => {
    // Một hai phách chỉ là chỗ lấy hơi, tai vẫn nối được câu dẫn với hợp âm sau
    for (const restAfter of [0, 1, 2, 3]) {
      const song = buildArrangedSong({
        accompaniment: backing,
        fills: [],
        solo: () => [],
        sources,
        steps: [
          { type: 'interlude', over: 1, loops: 1, restAfter },
          { type: 'section', source: 0 },
        ],
        turnaround: fakeTurn,
        beatsPerMeasure: 4,
      })

      expect(song.events.some((event) => event.notes[0] === 99)).toBe(true)
    }
  })

  it('từng bước giang tấu tự đặt được khoảng nghỉ của mình', () => {
    /*
      Mỗi chỗ giang tấu một khác: chỗ trả bài lại cho người hát cần nhiều chỗ
      thở, chỗ nối sang một đoạn nhạc khác thì gần như không cần.
    */
    const song = buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps: [
        { type: 'interlude', over: 1, loops: 1, restAfter: 2 },
        { type: 'section', source: 0 },
      ],
      restAfterInterlude: 4,
      beatsPerMeasure: 4,
    })

    // Bước tự đặt 2 phách thì thắng mặc định 4 phách của cả bài
    expect(song.totalBeats).toBe(8 + 2 + 8)
  })

  it('giang tấu chơi trọn vòng vì không phải nhường chỗ cho câu quay đầu', () => {
    const song = rested([
      { type: 'interlude', over: 1, loops: 1 },
      { type: 'section', source: 0 },
    ])

    const beats = song.events
      .filter((event) => event.startBeat < 8)
      .map((event) => event.startBeat)

    expect(beats).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('giang tấu là bước cuối thì không nghỉ, vì không còn gì phía sau', () => {
    const steps = [
      { type: 'section' as const, source: 0 },
      { type: 'interlude' as const, over: 1, loops: 1 },
    ]

    expect(rested(steps).totalBeats).toBe(build(steps).totalBeats)
  })

  it('không đặt khoảng nghỉ thì mọi thứ y như cũ', () => {
    const steps = [
      { type: 'interlude' as const, over: 1, loops: 1 },
      { type: 'section' as const, source: 0 },
    ]

    expect(build(steps).totalBeats).toBe(16)
  })
})

describe('hợp âm rải mở cửa cho đoạn sau', () => {
  /*
    Cụm hai-năm-một vừa kết thúc một câu; chỗ nối sang đoạn hát cần một cú mở
    cửa chứ không phải một dấu chấm.
  */
  it('lấy bậc năm của hợp âm sắp chơi', () => {
    const pull = pullChordFor(chord('Cadd9'))!

    expect(pull.root).toBe(7)
  })

  it('đổi màu so với bậc năm vừa vang trong cụm', () => {
    /*
      Phần 12.2 nói thẳng nguyên tắc qua chuỗi `C → CM7 → C6 → CM7`: cùng một
      gốc thì đổi màu mỗi lần. Rải lại đúng màu vừa nghe thì thành đánh lặp.
    */
    const plan = turnaroundInto(chord('Cadd9'), 2, chord('G13'))!
    const pull = pullChordFor(chord('Cadd9'), plan.chords.at(-2))!

    expect(plan.chords.at(-2)!.quality.id).toBe('13')
    expect(pull.quality.id).not.toBe('13')
  })

  it('màu mặc định cho hợp âm trưởng là màu treo của phong cách', () => {
    // Phần 15 ghi lại `Dm7 → G9sus4 → CM7`
    expect(pullChordFor(chord('C'))!.quality.id).toBe('9sus4')
  })

  it('hợp âm đích thứ thì không dùng màu treo', () => {
    // Treo xoá mất quãng ba, tức xoá luôn cái làm nên màu thứ của chỗ sắp về
    const pull = pullChordFor(chord('Am7'))!

    expect(pull.quality.intervals).toContain(4)
  })

  it('mọi hợp âm đích đều chọn được một màu', () => {
    for (const symbol of ['C', 'Cadd9', 'Am7', 'Fmaj7', 'Bb', 'Ebm9']) {
      expect(pullChordFor(chord(symbol))).not.toBeNull()
    }
  })

  it('tránh được màu trùng thì vẫn còn màu khác để dùng', () => {
    for (const id of ['9sus4', '13', '7b9']) {
      const avoid = { ...chord('G7'), quality: chord(`G${id}`).quality }
      const pull = pullChordFor(chord('C'), avoid)!

      expect(pull.quality.id).not.toBe(id)
    }
  })
})

describe('cụm quay đầu trải hai ô nhịp', () => {
  /*
    Nhồi cả cụm hai-năm-một lẫn câu rải vào một ô thì mỗi hợp âm chỉ được một
    phách và câu rải chỉ được một phách — đánh vội tới mức không nghe ra hợp âm
    gì. Hai ô cho mỗi thứ một chỗ đứng riêng.
  */
  const bar = 4

  const layout = (target: string, last: string) => {
    const plan = turnaroundInto(chord(target), 2, chord(last))!
    const approach = plan.chords.slice(0, -1)
    const lead = bar / 2 / approach.length
    return [...approach.map(() => lead), bar / 2]
  }

  it('ba hợp âm chia một · một · hai phách trong ô thứ nhất', () => {
    expect(layout('Cadd9', 'G13')).toEqual([1, 1, 2])
  })

  it('mọi mốc đều rơi đúng lưới nốt kép', () => {
    // Chia đều ba hợp âm trong một ô thì ra 1,33 phách, lệch khỏi mọi lưới
    let at = 0
    for (const beats of layout('Cadd9', 'G13')) {
      expect(Math.abs((at / 0.25) % 1)).toBeLessThan(0.001)
      at += beats
    }

    expect(at).toBe(bar)
  })

  it('hợp âm đích ngân lâu nhất, vì nó là chỗ đậu lại', () => {
    const beats = layout('Cadd9', 'G13')

    for (const lead of beats.slice(0, -1)) {
      expect(beats.at(-1)!).toBeGreaterThan(lead)
    }
  })

  it('câu rải chiếm nửa đầu ô thứ hai, nửa sau để trống', () => {
    const plan = turnaroundInto(chord('Cadd9'), 2, chord('G13'))!
    const pull = pullChordFor(chord('Cadd9'), plan.chords.at(-2))!
    const run = arpeggioRun({
      chord: pull,
      octaves: 2,
      endBeat: bar + bar / 2,
      maxBeats: bar / 2,
    })

    expect(run[0].startBeat).toBeGreaterThanOrEqual(bar)
    // Nửa sau ô là chỗ người hát lấy hơi trước khi vào
    const end = run.at(-1)!.startBeat + run.at(-1)!.durationBeats
    expect(end).toBeLessThan(bar + bar / 2 + 0.5)
  })

  it('câu rải đi nốt kép, không phải móc kép ba', () => {
    // Chín nốt nhét vào một phách thì phải xuống móc kép ba, nghe như vấp
    const pull = pullChordFor(chord('Cadd9'))!
    const run = arpeggioRun({
      chord: pull,
      octaves: 2,
      endBeat: bar + bar / 2,
      maxBeats: bar / 2,
    })

    expect(run[1].startBeat - run[0].startBeat).toBeCloseTo(0.25, 5)
  })
})
