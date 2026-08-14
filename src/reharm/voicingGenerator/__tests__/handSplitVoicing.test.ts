import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  DEFAULT_MAX_HAND_NOTES,
  LEFT_HAND_HIGH,
  LEFT_HAND_LOW,
  bassNoteFor,
  flattenHands,
  limitHandSize,
  voiceLeadTwoHands,
} from '../handSplitVoicing'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

describe('bassNoteFor', () => {
  it('lấy nốt gốc làm bass với hợp âm thường', () => {
    const [cmaj7] = chords('Cmaj7')
    expect(bassNoteFor(cmaj7) % 12).toBe(0)
  })

  it('lấy nốt bass đã ghi với hợp âm chồng trên bass', () => {
    const [slash] = chords('C/E')
    expect(bassNoteFor(slash) % 12).toBe(4)
  })

  it('nốt bass luôn nằm trong dải tay trái', () => {
    for (const chord of chords('C C#m D Eb F#m7b5 G7 Ab A Bb B/F#')) {
      const note = bassNoteFor(chord)
      expect(note).toBeGreaterThanOrEqual(LEFT_HAND_LOW)
      expect(note).toBeLessThanOrEqual(LEFT_HAND_HIGH)
    }
  })

  it('hợp âm F/G lấy đúng nốt sol làm bass', () => {
    // Hợp âm treo trên bass sol, hay gặp trước khi về chủ âm
    const [chord] = chords('F/G')
    expect(bassNoteFor(chord) % 12).toBe(7)
  })
})

describe('voiceLeadTwoHands', () => {
  it('trả về đúng số hợp âm', () => {
    expect(voiceLeadTwoHands(chords('Dm7 G7 Cmaj7'))).toHaveLength(3)
  })

  it('tay trái luôn có đúng một nốt bass', () => {
    for (const voicing of voiceLeadTwoHands(chords('Dm7 G7 Cmaj7'))) {
      expect(voicing.left).toHaveLength(1)
    }
  })

  it('tay trái luôn thấp hơn tay phải', () => {
    for (const voicing of voiceLeadTwoHands(chords('Dm7 G7 Cmaj7 Am11'))) {
      expect(Math.max(...voicing.left)).toBeLessThan(Math.min(...voicing.right))
    }
  })

  it('giữ tên hợp âm để hiển thị', () => {
    const voicings = voiceLeadTwoHands(chords('Dm7 G7 Cmaj7'))
    expect(voicings.map((voicing) => voicing.symbol)).toEqual([
      'Dm7',
      'G7',
      'Cmaj7',
    ])
  })

  it('bỏ nốt gốc ở tay phải khi được yêu cầu', () => {
    const [voicing] = voiceLeadTwoHands(chords('Cmaj7'), {
      dropRootFromRightHand: true,
    })

    expect(voicing.right.some((note) => note % 12 === 0)).toBe(false)
    // Tay trái vẫn giữ nốt gốc
    expect(voicing.left[0] % 12).toBe(0)
  })

  it('không bỏ nốt gốc nếu bỏ đi thì hợp âm mỏng quá', () => {
    // Hợp âm ba chỉ có ba nốt, bỏ gốc còn hai thì quá mỏng
    const [voicing] = voiceLeadTwoHands(chords('C'), {
      dropRootFromRightHand: true,
    })

    expect(voicing.right).toHaveLength(3)
  })

  it('tay phải vẫn được dẫn bè mượt', () => {
    const voicings = voiceLeadTwoHands(chords('Cmaj7 Am7 Dm7 G7'))

    for (let index = 1; index < voicings.length; index += 1) {
      const previous = voicings[index - 1].right
      const current = voicings[index].right

      // Mỗi nốt di chuyển trung bình dưới ba nửa cung
      let total = 0
      for (const note of current) {
        total += Math.min(...previous.map((other) => Math.abs(note - other)))
      }
      expect(total / current.length).toBeLessThan(3)
    }
  })

  it('hợp âm chồng trên bass cho tay trái nốt bass, tay phải hợp âm gốc', () => {
    const [voicing] = voiceLeadTwoHands(chords('C/E'))

    expect(voicing.left[0] % 12).toBe(4)
    // Tay phải vẫn là hợp âm đô trưởng đầy đủ
    expect(new Set(voicing.right.map((note) => note % 12))).toEqual(
      new Set([0, 4, 7]),
    )
  })
})

describe('giới hạn số nốt mỗi tay', () => {
  it('tay phải không bao giờ quá bốn nốt', () => {
    // Bàn tay bấm năm nốt đã rất chật, sáu nốt thì không thể
    const dense = 'Am11 G13 Cmaj13 D13sus4 C13b9 Fm13'

    for (const voicing of voiceLeadTwoHands(chords(dense))) {
      expect(voicing.right.length).toBeLessThanOrEqual(DEFAULT_MAX_HAND_NOTES)
    }
  })

  it('hợp âm sáu nốt bị rút xuống còn bốn', () => {
    const [voicing] = voiceLeadTwoHands(chords('G13'))
    expect(voicing.right).toHaveLength(4)
  })

  it('hợp âm vốn ít nốt thì giữ nguyên', () => {
    const [triad] = voiceLeadTwoHands(chords('C'))
    expect(triad.right).toHaveLength(3)

    const [seventh] = voiceLeadTwoHands(chords('Cmaj7'))
    expect(seventh.right).toHaveLength(4)
  })

  it('đặt được giới hạn khác', () => {
    for (const voicing of voiceLeadTwoHands(chords('Am11 G13'), {
      maxRightHandNotes: 3,
    })) {
      expect(voicing.right.length).toBeLessThanOrEqual(3)
    }
  })
})

describe('limitHandSize — thứ tự bỏ nốt', () => {
  it('bỏ quãng năm trước tiên', () => {
    const [chord] = chords('G13')
    // G13 đầy đủ: G B D F A E, quãng năm là nốt Rê
    const full = [55, 59, 62, 65, 69, 76]
    const limited = limitHandSize(full, chord, 5)

    expect(limited.map((note) => note % 12)).not.toContain(2)
  })

  it('bỏ tiếp nốt gốc, vì tay trái đã giữ rồi', () => {
    const [chord] = chords('G13')
    const full = [55, 59, 62, 65, 69, 76]
    const limited = limitHandSize(full, chord, 4)

    expect(limited.map((note) => note % 12)).not.toContain(7)
  })

  it('không bao giờ bỏ bậc ba và bậc bảy', () => {
    // Hai nốt này quyết định tính chất hợp âm
    for (const input of ['G13', 'Am11', 'Cmaj13', 'C13b9']) {
      const [chord] = chords(input)
      const full = chord.quality.intervals.map(
        (interval) => 48 + chord.root + interval,
      )
      const limited = limitHandSize(full, chord, 4)
      const classes = new Set(limited.map((note) => note % 12))

      const third = chord.quality.intervals.find((i) => i === 3 || i === 4)
      const seventh = chord.quality.intervals.find(
        (i) => i === 9 || i === 10 || i === 11,
      )

      if (third !== undefined) {
        expect(classes.has((chord.root + third) % 12)).toBe(true)
      }
      if (seventh !== undefined) {
        expect(classes.has((chord.root + seventh) % 12)).toBe(true)
      }
    }
  })

  it('hợp âm treo giữ nguyên nốt treo, vì nó đứng thay bậc ba', () => {
    const [chord] = chords('D13sus4')
    const full = chord.quality.intervals.map(
      (interval) => 48 + chord.root + interval,
    )
    const limited = limitHandSize(full, chord, 4)

    // Nốt treo bậc bốn của Rê là nốt Sol
    expect(limited.map((note) => note % 12)).toContain((chord.root + 5) % 12)
  })

  it('không thêm nốt nào vào', () => {
    const [chord] = chords('Cmaj7')
    const notes = [60, 64, 67, 71]
    const limited = limitHandSize(notes, chord, 4)

    expect(limited).toEqual(notes)
  })

  it('mọi nốt còn lại đều nằm trong danh sách ban đầu', () => {
    const [chord] = chords('Am11')
    const full = chord.quality.intervals.map(
      (interval) => 48 + chord.root + interval,
    )
    const limited = limitHandSize(full, chord, 4)

    for (const note of limited) {
      expect(full).toContain(note)
    }
  })
})

describe('flattenHands', () => {
  it('gộp hai tay và xếp nốt tăng dần', () => {
    const notes = flattenHands({
      left: [40],
      right: [67, 60, 64],
      symbol: 'C',
    })

    expect(notes).toEqual([40, 60, 64, 67])
  })
})
