import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateSolo } from '../soloGenerator'

/**
 * Các bất biến "nghe được" của câu solo.
 *
 * Nhóm test này sinh ra từ một lần rà tay: in cả đoạn solo ra rồi đọc từng ô
 * nhịp. Cách đó lộ ngay hai lỗi mà các test cấu trúc không bắt được — câu nhạc
 * chìm dần rồi kẹt ở đáy tầm thành một dãy nốt trùng nhau, và có nốt ngân tràn
 * sang hợp âm sau. Giữ lại thành test để không tái diễn.
 */

const PROGRESSION = 'Fmaj7 Em7 Dm7 G7 Cmaj7 Am7 Dm7 G7'
const chords = (text: string) => parseChordInput(text).chords

const options = {
  beatsPerChord: 4,
  key: { tonic: 0 as const, scale: 'major' as const },
  chordsPerPhrase: 2,
}

const sources = ['chordTone', 'chordPentatonic', 'blues'] as const
const densities = ['sparse', 'medium', 'dense'] as const

describe('câu solo luôn chuyển động', () => {
  it('không có ba nốt giống hệt nhau liên tiếp', () => {
    for (const noteSource of sources) {
      for (const density of densities) {
        const solo = generateSolo(chords(PROGRESSION), {
          ...options,
          noteSource,
          density,
        })

        let run = 1
        for (let index = 1; index < solo.length; index += 1) {
          run = solo[index].note === solo[index - 1].note ? run + 1 : 1
          expect(
            run,
            `${noteSource}/${density} lặp nốt ${solo[index].note}`,
          ).toBeLessThan(3)
        }
      }
    }
  })

  it('dùng ít nhất năm cao độ khác nhau trong cả đoạn', () => {
    // Câu nhạc quanh quẩn hai ba nốt là dấu hiệu bộ sinh đang dính biên
    for (const noteSource of sources) {
      const solo = generateSolo(chords(PROGRESSION), { ...options, noteSource })
      const distinct = new Set(solo.map((note) => note.note))
      expect(distinct.size).toBeGreaterThanOrEqual(5)
    }
  })

  it('đi cả lên lẫn xuống, không trôi một chiều', () => {
    const solo = generateSolo(chords(PROGRESSION), options)

    let up = 0
    let down = 0
    for (let index = 1; index < solo.length; index += 1) {
      const gap = solo[index].note - solo[index - 1].note
      if (gap > 0) up += 1
      if (gap < 0) down += 1
    }

    expect(up).toBeGreaterThan(0)
    expect(down).toBeGreaterThan(0)
  })
})

describe('câu solo không tràn sang hợp âm khác', () => {
  it('mọi nốt tắt trước khi hợp âm đổi', () => {
    for (const density of densities) {
      const solo = generateSolo(chords(PROGRESSION), { ...options, density })

      for (const note of solo) {
        const chordIndex = Math.floor(note.startBeat / 4)
        const chordEnd = (chordIndex + 1) * 4
        // Cho phép sai số nhỏ do làm tròn số thực
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(
          chordEnd + 0.001,
        )
      }
    }
  })
})

describe('mỗi lượt giang tấu một khác', () => {
  const list = chords(PROGRESSION)
  const takeAt = (take: number) => generateSolo(list, { ...options, take })

  it('ba lượt đầu không lượt nào giống lượt nào', () => {
    const asText = [0, 1, 2].map((take) =>
      takeAt(take)
        .map((note) => `${note.startBeat.toFixed(2)}:${note.note}`)
        .join(' '),
    )

    expect(new Set(asText).size).toBe(3)
  })

  it('cùng một lượt luôn cho ra đúng một đoạn, để còn tập theo được', () => {
    expect(takeAt(1)).toEqual(takeAt(1))
  })

  /*
    Biến tấu chỉ được đổi **chất liệu câu nhạc**, không được đổi quãng âm hay
    mật độ. Bản trước cho lượt sau cao dần và dày dần, kết quả là ba trên bốn
    lượt đội trần bàn phím ở nốt 96 và nghe chói hơn hẳn lượt đầu.
  */
  it('mọi lượt đều nằm trong cùng một dải quãng âm', () => {
    const tops = [0, 1, 2, 3, 9].map((take) =>
      Math.max(...takeAt(take).map((note) => note.note)),
    )

    // Không lượt nào đội trần, và chênh lệch giữa các lượt không quá một quãng tám
    for (const top of tops) expect(top).toBeLessThan(96)
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(12)
  })

  it('mọi lượt có mật độ xấp xỉ nhau', () => {
    const counts = [0, 1, 2, 3].map((take) => takeAt(take).length)

    // Lượt dày nhất không được gấp rưỡi lượt thưa nhất
    expect(Math.max(...counts)).toBeLessThan(Math.min(...counts) * 1.5)
  })

  it('lượt nào cũng giữ nốt trong tầm đàn', () => {
    for (let take = 0; take < 6; take += 1) {
      for (const note of takeAt(take)) {
        expect(note.note).toBeGreaterThanOrEqual(48)
        expect(note.note).toBeLessThanOrEqual(96)
      }
    }
  })
})

describe('câu solo bám hợp âm đang vang', () => {
  it('nốt không phải nốt tô điểm đều nằm trong chất liệu của hợp âm đó', () => {
    const list = chords(PROGRESSION)
    const solo = generateSolo(list, { ...options, noteSource: 'chordTone' })

    for (const note of solo.filter((entry) => !entry.isGrace)) {
      const chord = list[Math.floor(note.startBeat / 4)]
      const material = new Set([
        ...chord.quality.intervals.map((i) => (chord.root + i) % 12),
        // Bậc chín, theo danh sách 1-3-5-7-9 của tài liệu
        (chord.root + 2) % 12,
      ])

      expect(
        material.has(note.note % 12),
        `${chord.symbol} không chứa ${note.note % 12}`,
      ).toBe(true)
    }
  })
})
