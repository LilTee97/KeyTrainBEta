import { describe, expect, it } from 'vitest'
import { scaleTones } from '../../reharmEngine/keyDetection'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  DENSITY_OPTIONS,
  densityOption,
  ornamentLine,
  stepInScale,
} from '../graceNoteOrnamenter'
import {
  NOTE_SOURCE_OPTIONS,
  generateFillLine,
  generateSolo,
  soloToTimeline,
} from '../soloGenerator'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

const C_MAJOR = scaleTones(0, 'major')

describe('stepInScale', () => {
  it('đi lên đúng nốt liền bậc trong gam', () => {
    // Trong gam đô trưởng, trên nốt Mi là nốt Fa, cách nửa cung
    expect(stepInScale(64, 'up', C_MAJOR)).toBe(65)
    // Trên nốt Đô là nốt Rê, cách một cung
    expect(stepInScale(60, 'up', C_MAJOR)).toBe(62)
  })

  it('đi xuống đúng nốt liền bậc trong gam', () => {
    expect(stepInScale(60, 'down', C_MAJOR)).toBe(59)
    expect(stepInScale(64, 'down', C_MAJOR)).toBe(62)
  })

  it('nốt láy luôn nằm trong gam', () => {
    for (let note = 60; note <= 72; note += 1) {
      for (const way of ['up', 'down'] as const) {
        const grace = stepInScale(note, way, C_MAJOR)
        expect(C_MAJOR.has(((grace % 12) + 12) % 12)).toBe(true)
      }
    }
  })

  it('cách nốt chính không quá một cung', () => {
    // Tài liệu ghi là một bậc, tức quãng hai trưởng hoặc thứ
    for (let note = 60; note <= 72; note += 1) {
      for (const way of ['up', 'down'] as const) {
        expect(Math.abs(stepInScale(note, way, C_MAJOR) - note)).toBeLessThanOrEqual(2)
      }
    }
  })

  it('không có gam thì lùi về một cung', () => {
    expect(stepInScale(60, 'up', new Set())).toBe(62)
    expect(stepInScale(60, 'down', new Set())).toBe(58)
  })
})

describe('ornamentLine', () => {
  const line = [60, 62, 64, 65, 67, 69, 71, 72]

  it('mật độ dày thì mọi nốt đều được láy', () => {
    const result = ornamentLine(line, { density: 'dense', scaleTones: C_MAJOR })
    expect(result.every((entry) => entry.grace !== null)).toBe(true)
  })

  it('mật độ vừa thì láy cách nốt', () => {
    const result = ornamentLine(line, { density: 'medium', scaleTones: C_MAJOR })
    const ornamented = result.filter((entry) => entry.grace !== null)
    expect(ornamented).toHaveLength(line.length / 2)
  })

  it('mật độ thưa thì láy ít nhất', () => {
    const dense = ornamentLine(line, { density: 'dense' })
    const sparse = ornamentLine(line, { density: 'sparse' })

    const count = (list: typeof dense) =>
      list.filter((entry) => entry.grace !== null).length
    expect(count(sparse)).toBeLessThan(count(dense))
  })

  it('giữ nguyên nốt chính, chỉ thêm nốt láy', () => {
    const result = ornamentLine(line, { density: 'dense' })
    expect(result.map((entry) => entry.main)).toEqual(line)
  })

  it('láy từ dưới thì nốt láy luôn thấp hơn nốt chính', () => {
    const result = ornamentLine(line, {
      direction: 'below',
      density: 'dense',
      scaleTones: C_MAJOR,
    })

    for (const entry of result) {
      expect(entry.grace!).toBeLessThan(entry.main)
    }
  })

  it('láy từ trên thì nốt láy luôn cao hơn nốt chính', () => {
    const result = ornamentLine(line, {
      direction: 'above',
      density: 'dense',
      scaleTones: C_MAJOR,
    })

    for (const entry of result) {
      expect(entry.grace!).toBeGreaterThan(entry.main)
    }
  })

  it('kiểu xen kẽ đổi chiều sau mỗi nốt được láy', () => {
    // Ở mật độ thưa, nếu đổi chiều theo mọi nốt thì sẽ luôn ra cùng một chiều
    const result = ornamentLine(line, {
      direction: 'mixed',
      density: 'sparse',
      scaleTones: C_MAJOR,
    })

    const ornamented = result.filter((entry) => entry.grace !== null)
    const directions = ornamented.map((entry) =>
      entry.grace! < entry.main ? 'down' : 'up',
    )
    expect(new Set(directions).size).toBe(2)
  })

  it('câu rỗng cho kết quả rỗng', () => {
    expect(ornamentLine([])).toEqual([])
  })

  it('ba mức mật độ đều có mô tả', () => {
    expect(DENSITY_OPTIONS).toHaveLength(3)
    for (const option of DENSITY_OPTIONS) {
      expect(option.description.length).toBeGreaterThan(0)
    }
  })

  it('mật độ không hợp lệ thì lùi về mức vừa', () => {
    expect(densityOption('không-có' as never).id).toBe('medium')
  })
})

describe('generateSolo — cấu trúc câu nhạc', () => {
  const options = { beatsPerChord: 4, key: { tonic: 0, scale: 'major' as const } }
  const LONG = 'C Am F G Em Dm G7 C'

  it('vòng rỗng cho câu rỗng', () => {
    expect(generateSolo([], options)).toEqual([])
  })

  it('có khoảng nghỉ lấy hơi giữa các câu', () => {
    // Đây là điều tài liệu nhấn mạnh nhất, và là chỗ bản đầu sai:
    // chơi liên tục không nghỉ nghe như máy chứ không như người
    const solo = generateSolo(chords(LONG), {
      ...options,
      chordsPerPhrase: 2,
      interlude: false,
    })
    const mains = solo.filter((note) => !note.isGrace)

    const gaps: number[] = []
    for (let index = 1; index < mains.length; index += 1) {
      const previous = mains[index - 1]
      gaps.push(
        mains[index].startBeat - (previous.startBeat + previous.durationBeats),
      )
    }

    // Phải có ít nhất vài chỗ hở đáng kể, đó là chỗ lấy hơi
    expect(gaps.filter((gap) => gap > 0.5).length).toBeGreaterThanOrEqual(2)
  })

  it('mỗi câu kết ở nốt ổn định của hợp âm đang vang', () => {
    // Tài liệu: tránh dừng ở nốt lơ lửng khiến câu nghe dở dang
    const list = chords(LONG)
    const solo = generateSolo(list, { ...options, chordsPerPhrase: 2 })
    const mains = solo.filter((note) => !note.isGrace)

    /*
      Cuối câu là nốt cuối cùng rơi vào **hợp âm cuối của câu** — hai hợp âm
      một câu, nên đó là các hợp âm ở vị trí lẻ. Xác định theo cấu trúc chứ
      không đoán theo chỗ hở, vì có mẫu câu ngân dài giữa câu cũng tạo chỗ hở.
    */
    const phraseEnds = list
      .map((_, index) => index)
      .filter((index) => index % 2 === 1)
      .map((index) =>
        mains
          .filter(
            (note) =>
              note.startBeat >= index * 4 && note.startBeat < (index + 1) * 4,
          )
          .at(-1),
      )
      .filter((note) => note !== undefined)

    expect(phraseEnds.length).toBeGreaterThan(0)

    for (const ending of phraseEnds) {
      const chordIndex = Math.min(
        list.length - 1,
        Math.floor(ending.startBeat / 4),
      )
      const chord = list[chordIndex]
      const stable = [0, 3, 4, 7]
        .filter((interval) =>
          chord.quality.intervals.some((i) => i % 12 === interval),
        )
        .map((interval) => (chord.root + interval) % 12)

      expect(stable).toContain(ending.note % 12)
    }
  })

  it('đổi quãng âm giữa các câu để tạo kịch tính', () => {
    const solo = generateSolo(chords(LONG), {
      ...options,
      chordsPerPhrase: 2,
    })
    const mains = solo.filter((note) => !note.isGrace)

    const lowest = Math.min(...mains.map((note) => note.note))
    const highest = Math.max(...mains.map((note) => note.note))

    // Trải ít nhất hơn một quãng tám, không dồn cả câu vào một chỗ
    expect(highest - lowest).toBeGreaterThan(12)
  })

  it('nốt cuối câu ngân dài hơn các nốt trước', () => {
    const solo = generateSolo(chords('C Am'), {
      ...options,
      chordsPerPhrase: 2,
      density: 'medium',
      interlude: false,
    })
    const mains = solo.filter((note) => !note.isGrace)
    const last = mains[mains.length - 1]

    const others = mains.slice(0, -1)
    const averageLength =
      others.reduce((sum, note) => sum + note.durationBeats, 0) / others.length

    expect(last.durationBeats).toBeGreaterThan(averageLength)
  })

  it('câu nhạc đi từng bước, không nhảy quãng xa', () => {
    const solo = generateSolo(chords(LONG), options)
    const mains = solo.filter((note) => !note.isGrace)

    for (let index = 1; index < mains.length; index += 1) {
      expect(
        Math.abs(mains[index].note - mains[index - 1].note),
      ).toBeLessThanOrEqual(14)
    }
  })

  it('mọi nốt nằm trong tầm giai điệu, cao hơn phần đệm', () => {
    for (const note of generateSolo(chords(LONG), options)) {
      expect(note.note).toBeGreaterThanOrEqual(60)
      expect(note.note).toBeLessThanOrEqual(96)
    }
  })

  it('các nốt xếp theo thời gian tăng dần', () => {
    const solo = generateSolo(chords(LONG), options)

    for (let index = 1; index < solo.length; index += 1) {
      expect(solo[index].startBeat).toBeGreaterThanOrEqual(
        solo[index - 1].startBeat,
      )
    }
  })

  it('mật độ dày sinh nhiều nốt hơn mật độ thưa', () => {
    const dense = generateSolo(chords(LONG), {
      ...options,
      density: 'dense',
      interlude: false,
    })
    const sparse = generateSolo(chords(LONG), {
      ...options,
      density: 'sparse',
      interlude: false,
    })

    expect(dense.length).toBeGreaterThan(sparse.length)
  })
})

describe('nguồn nốt cho câu solo', () => {
  const options = { beatsPerChord: 4, key: { tonic: 0, scale: 'major' as const } }

  /*
    Điểm mấu chốt của cả nhóm test này: thang âm phải dựng trên **nốt gốc của
    hợp âm đang vang**, không phải trên chủ âm bài hát. Bản trước dựng trên chủ
    âm rồi giữ nguyên suốt đoạn, nên nghe lệch hoà âm.
  */
  it('ngũ cung dựng trên nốt gốc từng hợp âm, không phải trên chủ âm', () => {
    const list = chords('C Am F G')
    const solo = generateSolo(list, {
      ...options,
      noteSource: 'chordPentatonic',
      density: 'dense',
    })

    // Ngũ cung trưởng cho hợp âm trưởng, ngũ cung thứ cho hợp âm thứ
    const stepsFor = (index: number) =>
      list[index].quality.intervals.some((interval) => interval % 12 === 3)
        ? [0, 3, 5, 7, 10]
        : [0, 2, 4, 7, 9]

    for (const note of solo.filter((entry) => !entry.isGrace && !entry.ornament)) {
      const index = Math.min(list.length - 1, Math.floor(note.startBeat / 4))
      const chord = list[index]
      // Mẫu rải hợp âm dùng đúng nốt hợp âm, nên chấp nhận cả hai bộ
      const allowed = new Set([
        ...stepsFor(index).map((step) => (chord.root + step) % 12),
        ...chord.quality.intervals.map((i) => (chord.root + i) % 12),
      ])
      expect(allowed.has(note.note % 12)).toBe(true)
    }
  })

  it('màu blues thêm nốt blue tính từ nốt gốc hợp âm', () => {
    const list = chords('C7 F7 G7 C7')
    const solo = generateSolo(list, {
      ...options,
      noteSource: 'blues',
      density: 'dense',
    })

    /*
      Mẫu rải hợp âm cố ý dùng đúng nốt hợp âm chứ không theo thang âm — rải
      hợp âm mà chen nốt blue vào thì không còn là rải hợp âm nữa. Nên nốt hợp
      âm luôn được chấp nhận bên cạnh thang blues.
    */
    const allowed = new Set(
      list.flatMap((chord) => [
        ...chord.quality.intervals.map((step) => (chord.root + step) % 12),
        (chord.root + 2) % 12,
      ]),
    )
    for (const note of solo.filter((entry) => !entry.isGrace && !entry.ornament)) {
      expect(allowed.has(note.note % 12)).toBe(true)
    }
  })

  it('nốt blue thật sự xuất hiện khi chưa biết giọng', () => {
    const list = chords('C7 F7 G7 C7')
    const solo = generateSolo(list, {
      beatsPerChord: 4,
      noteSource: 'blues',
      density: 'dense',
      interlude: false,
    })

    const blueNotes = solo.filter((note) => {
      const index = Math.min(list.length - 1, Math.floor(note.startBeat / 4))
      return note.note % 12 === (list[index].root + 6) % 12
    })

    expect(blueNotes.length).toBeGreaterThan(0)
  })

  it('giang tấu chỉ dùng nốt của vòng đang chạy, không lấy cả giọng bài', () => {
    const list = chords('Am F G C')
    const solo = generateSolo(list, {
      beatsPerChord: 4,
      key: { tonic: 4, scale: 'minor' },
      noteSource: 'chordTone',
      density: 'dense',
    })
    const allowed = new Set([0, 2, 4, 5, 7, 9, 11])
    for (const note of solo.filter((entry) => !entry.isGrace && !entry.ornament)) {
      expect(allowed.has(note.note % 12)).toBe(true)
      expect(note.note % 12).not.toBe(6)
    }
  })

  it('nốt hợp âm lấy từ chính hợp âm đang vang', () => {
    const list = chords('Cmaj7')
    const solo = generateSolo(list, {
      ...options,
      noteSource: 'chordTone',
      density: 'dense',
    })

    // Bậc chín nằm trong danh sách 1-3-5-7-9 của `pianoimprovnotes.md` mục 3.1
    const allowed = new Set([
      ...list[0].quality.intervals.map((i) => (list[0].root + i) % 12),
      (list[0].root + 2) % 12,
    ])
    for (const note of solo.filter((entry) => !entry.isGrace && !entry.ornament)) {
      expect(allowed.has(note.note % 12)).toBe(true)
    }
  })

  it('mọi nguồn nốt đều có mô tả cho người dùng', () => {
    /*
      Ba nút: nốt hợp âm, ngũ cung của hợp âm, màu blues.

      `jazzScale` cố ý KHÔNG có mặt — nó là công tắc riêng bên `ReharmHome`, vì
      nó đọc kho, chỉ chạy ở đoạn không lời, và im lặng trên hợp âm nào kho chưa
      có gam. Xếp nó vào hàng nút này là nói bốn thứ cùng loại.
    */
    expect(NOTE_SOURCE_OPTIONS).toHaveLength(3)
    expect(NOTE_SOURCE_OPTIONS.map((o) => o.id)).not.toContain('storeScale')
    for (const option of NOTE_SOURCE_OPTIONS) {
      expect(option.description.length, option.id).toBeGreaterThan(0)
      expect(option.label.length, option.id).toBeGreaterThan(0)
    }
    // Trùng id thì ô chọn trong giao diện có hai mục chọn cùng một thứ.
    expect(new Set(NOTE_SOURCE_OPTIONS.map((o) => o.id)).size).toBe(NOTE_SOURCE_OPTIONS.length)
  })

  it('nốt hợp âm gồm cả bậc chín, đúng danh sách 1-3-5-7-9 của tài liệu', () => {
    const list = chords('Cmaj7')
    const solo = generateSolo(list, {
      ...options,
      noteSource: 'chordTone',
      density: 'dense',
      chordsPerPhrase: 1,
    })

    const allowed = new Set([
      ...list[0].quality.intervals.map((i) => (list[0].root + i) % 12),
      (list[0].root + 2) % 12,
    ])
    for (const note of solo.filter((entry) => !entry.isGrace && !entry.ornament)) {
      expect(allowed.has(note.note % 12)).toBe(true)
    }
  })
})

describe('câu fill — chêm ở cuối hợp âm để dẫn sang hợp âm sau', () => {
  const options = {
    // Nhóm này kiểm đường guide-tone: kết vào nốt dẫn, đi liền bậc. Sổ Licky
    // không hứa hai điều ấy, mà nay nó là mặc định — nên phải khai rõ ở đây.
    lickyFills: false,
    beatsPerChord: 4,
    key: { tonic: 0, scale: 'major' as const },
    density: 'dense' as const,
  }

  it('mọi nốt nằm ở nửa sau quãng thời gian của hợp âm', () => {
    // Đây là điều phân biệt câu fill với giai điệu chạy suốt: nó lấp chỗ
    // trống ở cuối hợp âm, không trải đều
    const fills = generateFillLine(chords('C Am F G'), options)

    for (const note of fills) {
      const positionInChord = note.startBeat % 4
      expect(positionInChord).toBeGreaterThanOrEqual(2)
    }
  })

  it('câu fill kết thúc ngay cạnh nốt của hợp âm kế tiếp', () => {
    const list = chords('C Am')
    const fills = generateFillLine(list, { ...options, density: 'dense' })

    // Nốt cuối của câu fill đầu tiên phải là nốt thuộc hợp âm Am
    const firstFill = fills.filter((note) => note.startBeat < 4)
    const landing = firstFill[firstFill.length - 1]

    const amTones = new Set(
      list[1].quality.intervals.map((i) => (list[1].root + i) % 12),
    )
    expect(amTones.has(landing.note % 12)).toBe(true)
  })

  it('câu fill đi liền bậc, không nhảy quãng', () => {
    const fills = generateFillLine(chords('C Am F G'), options)

    for (let index = 1; index < fills.length; index += 1) {
      const gap = Math.abs(fills[index].note - fills[index - 1].note)
      // Nốt liền nhau trong cùng câu đi từng bậc; giữa hai câu thì cho phép nhảy
      if (fills[index].startBeat - fills[index - 1].startBeat < 1) {
        expect(gap).toBeLessThanOrEqual(2)
      }
    }
  })

  it('mật độ thưa thì thỉnh thoảng mới chêm một câu', () => {
    const dense = generateFillLine(chords('C Am F G Em Dm G7 C'), {
      ...options,
      density: 'dense',
    })
    const sparse = generateFillLine(chords('C Am F G Em Dm G7 C'), {
      ...options,
      density: 'sparse',
    })

    expect(sparse.length).toBeLessThan(dense.length)
  })

  it('hợp âm cuối dẫn về hợp âm đầu vì vòng được chơi lặp lại', () => {
    const fills = generateFillLine(chords('C G7'), options)
    // Có câu fill ở cả hai hợp âm, kể cả hợp âm cuối
    expect(fills.some((note) => note.startBeat >= 4)).toBe(true)
  })

  it('vòng một hợp âm thì không có gì để dẫn tới', () => {
    expect(generateFillLine(chords('C'), options)).toEqual([])
    expect(generateFillLine([], options)).toEqual([])
  })

  it('câu fill ngắn hơn hẳn đoạn giang tấu', () => {
    const list = chords('C Am F G')
    const fills = generateFillLine(list, options)
    const solo = generateSolo(list, options)

    expect(fills.length).toBeLessThan(solo.length)
  })

  it('mọi nốt nằm trong tầm giai điệu', () => {
    for (const note of generateFillLine(chords('C Am F G'), options)) {
      expect(note.note).toBeGreaterThanOrEqual(60)
      expect(note.note).toBeLessThanOrEqual(92)
    }
  })
})

describe('soloToTimeline', () => {
  it('đổi được sang dòng thời gian', () => {
    const solo = generateSolo(chords('C Am'), {
      beatsPerChord: 4,
      key: { tonic: 0, scale: 'major' },
    })
    const timeline = soloToTimeline(solo)

    expect(timeline).toHaveLength(solo.length)
    for (const event of timeline) {
      expect(event.notes).toHaveLength(1)
      expect(event.hand).toBe('right')
      expect(event.velocity).toBeGreaterThan(0)
    }
  })

  it('nốt tô điểm đánh nhẹ hơn nốt chính', () => {
    // Vòng đủ dài để chắc chắn có mẫu câu sinh nốt tô điểm (nốt dẫn, hình láy)
    const solo = generateSolo(chords('C Am F G Em Dm G7 C'), {
      beatsPerChord: 4,
      density: 'dense',
      graceDensity: 'dense',
      interlude: false,
      key: { tonic: 0, scale: 'major' },
    })
    const timeline = soloToTimeline(solo)

    const graceIndex = solo.findIndex((note) => note.isGrace)
    const mainIndex = solo.findIndex((note) => !note.isGrace)

    expect(graceIndex).toBeGreaterThanOrEqual(0)
    expect(timeline[graceIndex].velocity).toBeLessThan(
      timeline[mainIndex].velocity,
    )
  })
})
