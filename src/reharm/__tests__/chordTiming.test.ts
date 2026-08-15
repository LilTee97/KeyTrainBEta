import { describe, expect, it } from 'vitest'
import {
  beatsOf,
  chordDurations,
  chordIndexAt,
  chordStarts,
  splitBeats,
  totalBeatsOf,
} from '../chordTiming'
import { parseChordInput } from '../input/chordInputParser'
import {
  applySuggestions,
  suggestPassingChords,
} from '../reharmEngine/passingChordRules'

const chords = (text: string) => parseChordInput(text).chords

describe('thời lượng từng hợp âm', () => {
  it('hợp âm không ghi thời lượng thì lấy nhịp chung của vòng', () => {
    const [chord] = chords('C')
    expect(beatsOf(chord, 4)).toBe(4)
    expect(beatsOf({ ...chord, beats: 2 }, 4)).toBe(2)
  })

  it('mốc bắt đầu tính dồn theo thời lượng thật', () => {
    const list = chords('C Am F')
    list[0].beats = 2
    list[1].beats = 2

    expect(chordStarts(list, 4)).toEqual([0, 2, 4])
    expect(chordDurations(list, 4)).toEqual([2, 2, 4])
    expect(totalBeatsOf(list, 4)).toBe(8)
  })

  it('tra được hợp âm đang vang tại một thời điểm', () => {
    const list = chords('C Am F')
    list[0].beats = 2
    list[1].beats = 2

    expect(chordIndexAt(list, 4, 0)).toBe(0)
    expect(chordIndexAt(list, 4, 1.9)).toBe(0)
    expect(chordIndexAt(list, 4, 2)).toBe(1)
    expect(chordIndexAt(list, 4, 5)).toBe(2)
  })
})

describe('chia đôi ô nhịp cho hợp âm lướt', () => {
  /*
    Theo `phongcachdemhatkhabu.md` mục 14.2: hợp âm chủ giữ nửa đầu ô nhịp,
    các hợp âm lướt chia nhau nửa sau.
  */
  it('hợp âm chủ giữ nửa đầu, hai hợp âm lướt chia nửa sau', () => {
    expect(splitBeats(4, 2)).toEqual({ host: 2, passing: [1, 1] })
  })

  it('một hợp âm lướt thì lấy trọn nửa sau', () => {
    expect(splitBeats(4, 1)).toEqual({ host: 2, passing: [2] })
  })

  it('không có hợp âm lướt thì giữ nguyên', () => {
    expect(splitBeats(4, 0)).toEqual({ host: 4, passing: [] })
  })

  it('ô nhịp quá chật thì chia đều cho tất cả, không cố giữ nửa đầu', () => {
    // Nửa sau của 2 phách chia cho 2 hợp âm chỉ còn nửa phách mỗi cái
    expect(splitBeats(2, 2)).toEqual({
      host: 2 / 3,
      passing: [2 / 3, 2 / 3],
    })
  })
})

describe('chèn hợp âm lướt không làm dài thêm vòng', () => {
  /*
    Đây là lỗi được người dùng chỉ ra: vòng `C Am F G` bốn ô nhịp, sau khi chèn
    ba vòng hai-năm lướt, phình thành mười ô nhịp — phá cả cấu trúc bài.
  */
  const list = chords('C Am F G')
  const iiV = suggestPassingChords(list, {}).filter(
    (suggestion) => suggestion.technique === 'secondary-ii-V',
  )

  it('tổng độ dài vòng giữ nguyên', () => {
    const before = totalBeatsOf(list, 4)
    const after = totalBeatsOf(applySuggestions(list, iiV, 4), 4)

    expect(before).toBe(16)
    expect(after).toBe(16)
  })

  it('có thêm hợp âm nhưng vòng vẫn bốn ô nhịp', () => {
    const after = applySuggestions(list, iiV, 4)

    expect(after.length).toBeGreaterThan(list.length)
    expect(totalBeatsOf(after, 4) / 4).toBe(4)
  })

  it('hợp âm lướt ngắn hơn hợp âm chính', () => {
    const after = applySuggestions(list, iiV, 4)
    const inserted = after.filter((chord) => chord.beats !== undefined)

    expect(inserted.length).toBeGreaterThan(0)
    for (const chord of inserted) {
      expect(beatsOf(chord, 4)).toBeLessThanOrEqual(2)
    }
  })

  it('hợp âm đích vẫn rơi đúng đầu ô nhịp', () => {
    const after = applySuggestions(list, iiV, 4)
    const starts = chordStarts(after, 4)

    // Các hợp âm gốc phải nằm ở phách 0, 4, 8, 12
    const originalStarts = after
      .map((chord, index) => ({ chord, start: starts[index] }))
      .filter((entry) => entry.chord.beats === undefined)
      .map((entry) => entry.start)

    for (const start of originalStarts) expect(start % 4).toBe(0)
  })

  it('không chấp nhận gợi ý nào thì vòng y nguyên', () => {
    expect(applySuggestions(list, [], 4)).toEqual(list)
  })
})
