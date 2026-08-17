import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { TransitionRun } from '../soloGenerator'
import { fillPositions, generateFillLine } from '../soloGenerator'

/**
 * Chỗ chuyển đoạn: hợp âm cuối đoạn được cấp **thêm một ô nhịp**, và ô thêm
 * ấy chạy ngón thay vì quạt hợp âm.
 *
 * Đo trên `reference/nguoi ay.mxl`: từ chữ hát cuối cùng tới lúc đoạn mới vào,
 * bản ký âm cho 1,5 đến 3 phách. Bản ký âm có được khoảng đó vì câu hát kết
 * sớm trong ô nhịp; ở đây không ép người hát ngừng sớm được nên phải cấp hẳn
 * một ô. Ô nhịp là đơn vị nguyên, không thêm lẻ một phách được.
 */

const CHORDS = 'Fadd9 Dm7 G7 Cadd9'
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

/** Hợp âm cuối đoạn là số 2, đã được cấp thêm một ô nhịp nên dài 8 phách. */
const chords = () => {
  const list = parseChordInput(CHORDS).chords
  return list.map((chord, index) =>
    index === 2 ? { ...chord, beats: 8 } : chord,
  )
}

const mark = (index: number, octaves = 2, restBeats = 2) =>
  new Map([[index, { octaves, restBeats }]])

const fill = (sectionEnds?: ReadonlyMap<number, TransitionRun>) =>
  generateFillLine(chords(), {
    beatsPerChord: 4,
    density: 'medium',
    key: C_MAJOR,
    breaths: new Set([2]),
    sectionEnds,
  })

describe('câu chạy ở ô nối sang đoạn mới', () => {
  const run = fill(mark(2))

  it('mở và đóng cùng một nốt gốc của hợp âm', () => {
    /*
      Đây là điều làm câu chạy nghe trọn vẹn: tai nhận ra ngay nó đã đi hết một
      vòng. Bản trước kết ở nốt gốc của *đoạn sắp tới* — nghe như câu chưa nói
      xong đã bị cắt, vì nó bỏ dở hợp âm đang vang để với sang hợp âm chưa tới.
    */
    const root = chords()[2].root % 12

    expect(run[0].note % 12).toBe(root)
    expect(run[run.length - 1].note % 12).toBe(root)
  })

  it('hai quãng tám là đúng hai mươi bốn nửa cung', () => {
    expect(run[run.length - 1].note - run[0].note).toBe(24)
  })

  it('một quãng tám cũng mở và đóng cùng nốt gốc', () => {
    // Vòng ngắn nhất còn giữ được hình mở-đóng cùng một nốt
    const short = fill(mark(2, 1))
    const root = chords()[2].root % 12

    expect(short).toHaveLength(5)
    expect(short[0].note % 12).toBe(root)
    expect(short[short.length - 1].note % 12).toBe(root)
    expect(short[short.length - 1].note - short[0].note).toBe(12)
  })

  it('chạy càng ngắn thì nốt càng chậm, vì có nhiều chỗ hơn cho mỗi nốt', () => {
    /*
      Luật là lấy giá trị nốt **chậm nhất còn vừa chỗ**, nên một quãng tám ra
      nốt móc đơn, hai quãng tám ra nốt kép, ba quãng tám ra móc kép ba.
    */
    const gap = (octaves: number) => {
      const line = fill(mark(2, octaves))
      return line[1].startBeat - line[0].startBeat
    }

    expect(gap(1)).toBeGreaterThan(gap(2))
    expect(gap(2)).toBeGreaterThan(gap(3))
  })

  it('bốn quãng tám thì thấp hơn ba quãng tám đúng một quãng tám', () => {
    const four = fill(mark(2, 4))
    const three = fill(mark(2, 3))
    expect(four[0].note).toBe(three[0].note - 12)
    expect(four[four.length - 1].note).toBe(three[three.length - 1].note)
  })

  it('ba quãng tám thì kéo dài chân xuống, đỉnh giữ nguyên', () => {
    // Nhờ vậy mọi chỗ chuyển đoạn trong bài đều lên tới cùng một tầm
    const wider = fill(mark(2, 3))

    expect(wider[wider.length - 1].note).toBe(run[run.length - 1].note)
    expect(wider[0].note).toBe(run[0].note - 12)
  })

  it('bốn nốt mỗi quãng tám, nên hai quãng ra chín nốt', () => {
    expect(run).toHaveLength(9)
    expect(fill(mark(2, 3))).toHaveLength(13)
  })

  it('hợp âm ba cũng đủ bốn nốt mỗi quãng tám', () => {
    const triad = parseChordInput('C F G C').chords
    const line = generateFillLine(
      triad.map((chord, index) =>
        index === 2 ? { ...chord, beats: 8 } : chord,
      ),
      {
        beatsPerChord: 4,
        density: 'medium',
        key: C_MAJOR,
        breaths: new Set([2]),
        sectionEnds: mark(2, 1),
      },
    )
    expect(line.length).toBeGreaterThanOrEqual(5)
    const firstOctave = line.filter(
      (note) => note.note >= line[0].note && note.note < line[0].note + 12,
    )
    expect(firstOctave.length).toBeGreaterThanOrEqual(4)
  })

  it('chỉ lấy bốn nốt lõi, bỏ nốt màu', () => {
    /*
      Nốt chín, mười một, mười ba nằm ở quãng từ 12 nửa cung trở lên. Gộp chúng
      vào thì mỗi quãng tám có sáu nốt và câu chạy nghe ra thành thang âm chứ
      không còn là hợp âm rải.
    */
    const chord = chords()[2]
    const core = chord.quality.intervals
      .filter((step) => step < 12)
      .map((step) => (chord.root + step) % 12)

    for (const note of run) expect(core).toContain(note.note % 12)
  })

  it('đi lên một chiều, không ngoặt', () => {
    for (let i = 1; i < run.length; i += 1) {
      expect(run[i].note).toBeGreaterThan(run[i - 1].note)
    }
  })

  it('vắt qua cả hai tay, đúng như người ta chơi thật', () => {
    const hands = new Set(run.map((note) => note.hand))

    expect(hands.has('left')).toBe(true)
    expect(hands.has('right')).toBe(true)
  })

  it('chạy ngón sau N phách thì câu bắt đầu muộn hơn', () => {
    const delayed = fill(
      new Map([[2, { octaves: 2, restBeats: 2, delayBeats: 2 }]]),
    )
    expect(delayed[0].startBeat).toBeGreaterThan(run[0].startBeat)
  })

  it('im cả ô thì vẫn còn chỗ chạy ngón', () => {
    const line = fill(new Map([[2, { octaves: 2, restBeats: 4, delayBeats: 0 }]]))
    expect(line.length).toBeGreaterThan(0)
  })

  it('nốt cuối rơi đúng số phách nghỉ đã đặt', () => {
    // Ô nối kết thúc ở phách 16; nghỉ hai phách thì nốt cuối ở phách 14
    for (const restBeats of [1, 2, 3]) {
      const line = fill(mark(2, 2, restBeats))
      const last = line[line.length - 1]

      expect(last.startBeat).toBeCloseTo(16 - restBeats, 5)
    }
  })

  it('các nốt cách đều nhau', () => {
    const gaps = run
      .slice(1)
      .map((note, index) => note.startBeat - run[index].startBeat)

    expect(new Set(gaps.map((gap) => gap.toFixed(4))).size).toBe(1)
  })

  it('chạy dài hơn thì nốt nhanh hơn, để vẫn nhét vừa chỗ trống', () => {
    // Không phải vì muốn nhanh, mà vì chừng ấy nốt không vừa nếu đi chậm
    const wider = fill(mark(2, 3))

    const gap = run[1].startBeat - run[0].startBeat
    const widerGap = wider[1].startBeat - wider[0].startBeat
    expect(widerGap).toBeLessThan(gap)
  })

  it('không đệm thì chạy ngón ngay từ đầu hợp âm, không chờ quạt hết ô', () => {
    expect(run[0].startBeat).toBeCloseTo(8, 5)
    for (const note of run) {
      expect(note.startBeat).toBeLessThan(16)
    }
  })

  it('giữa đoạn vẫn là câu fill ngắn kết ở nốt dẫn', () => {
    // Chỉ chỗ chuyển đoạn mới đổi hình; số nốt đổi theo lượt phát
    const inside = fill()

    expect(inside.length).toBeGreaterThanOrEqual(3)
    expect(inside.length).toBeLessThanOrEqual(4)
    expect(inside.at(-1)!.note % 12).toBe(5)
  })
})

describe('bộ lọc không được gạt chỗ chuyển đoạn', () => {
  const list = parseChordInput('C G Am Em F C Dm G').chords

  it('hợp âm dài hơn một ô nhịp vẫn chêm được', () => {
    /*
      Bản đầu loại mọi hợp âm có ghi thời lượng riêng, gộp hợp âm cuối đoạn
      cùng một rọ với hợp âm bị chia đôi cho hợp âm lướt — nên câu chạy chuyển
      đoạn không bao giờ được sinh ra.
    */
    const long = list.map((chord, index) =>
      index === 3 ? { ...chord, beats: 8 } : chord,
    )

    const found = fillPositions(long, {
      density: 'dense',
      beatsPerChord: 4,
      breaths: new Set([3]),
      always: new Set([3]),
    })

    expect(found.map((position) => position.mainIndex)).toContain(3)
  })

  it('fill thường bỏ hợp âm ngắn, mốc chuyển đoạn thì vẫn chạy', () => {
    const short = list.map((chord, index) =>
      index === 3 ? { ...chord, beats: 2 } : chord,
    )

    expect(
      fillPositions(short, {
        density: 'dense',
        beatsPerChord: 4,
        breaths: new Set([3]),
      }).map((position) => position.mainIndex),
    ).not.toContain(3)

    expect(
      fillPositions(short, {
        density: 'dense',
        beatsPerChord: 4,
        breaths: new Set([3]),
        always: new Set([3]),
      }).map((position) => position.mainIndex),
    ).toContain(3)
  })

  it('mọi mức mật độ đều chêm ở chỗ chuyển đoạn', () => {
    const breaths = new Set([1, 3, 5, 7])

    for (const density of ['sparse', 'medium', 'dense'] as const) {
      const found = fillPositions(list, {
        density,
        beatsPerChord: 4,
        breaths,
        always: new Set([7]),
      })

      expect(found.map((position) => position.mainIndex)).toContain(7)
    }
  })

  it('tắt fill không tắt câu chạy ở mốc chuyển đoạn', () => {
    const found = fillPositions(list, {
      density: 'dense',
      beatsPerChord: 4,
      breaths: new Set([7]),
      always: new Set([7]),
      skip: new Set([7]),
    })

    expect(found.map((position) => position.mainIndex)).toContain(7)
  })
})

describe('ô nối không chạy ngón', () => {
  /*
    Có chỗ chuyển đoạn không cần câu chạy — hợp âm cuối điệp khúc đi thẳng vào
    giang tấu chẳng hạn, vì ngay sau đó đã là phần ngẫu hứng rồi. Lúc ấy vẫn
    cần thêm một ô nhịp cho người hát ngân hết câu.
  */
  it('tắt fill thì mốc chuyển đoạn vẫn chạy ngón', () => {
    const line = generateFillLine(chords(), {
      beatsPerChord: 4,
      density: 'dense',
      key: C_MAJOR,
      breaths: new Set([2]),
      sectionEnds: mark(2, 2, 2),
      skipFills: new Set([2]),
    })
    expect(line.length).toBeGreaterThan(0)
  })

  it('chọn không quãng tám nào thì không sinh câu chạy', () => {
    expect(fill(mark(2, 0))).toHaveLength(0)
  })

  it('các chỗ ngắt khác vẫn chêm fill như thường', () => {
    const line = generateFillLine(chords(), {
      beatsPerChord: 4,
      density: 'dense',
      key: C_MAJOR,
      breaths: new Set([0, 2]),
      sectionEnds: mark(2, 0),
    })

    expect(line.length).toBeGreaterThan(0)
  })
})
