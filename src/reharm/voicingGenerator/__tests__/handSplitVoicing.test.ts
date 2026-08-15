import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  DEFAULT_MAX_HAND_NOTES,
  LEFT_HAND_HIGH,
  LEFT_HAND_LOW,
  bassNoteFor,
  flattenHands,
  leftHandNoteCount,
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

describe('chia nốt cho hai tay', () => {
  const DENSE = 'Am11 G13 Cmaj13 D13sus4 C13b9 Fm13 Am9 Cmaj9'

  it('không tay nào bấm quá bốn nốt', () => {
    // Bàn tay bấm năm nốt đã rất chật, sáu nốt thì không thể
    for (const voicing of voiceLeadTwoHands(chords(DENSE))) {
      expect(voicing.left.length).toBeLessThanOrEqual(DEFAULT_MAX_HAND_NOTES)
      expect(voicing.right.length).toBeLessThanOrEqual(DEFAULT_MAX_HAND_NOTES)
    }
  })

  it('không bỏ sót nốt nào của hợp âm', () => {
    // Chia cho hai tay chứ không bỏ bớt — bỏ nốt là mất màu hợp âm
    for (const input of ['Am11', 'G13', 'C13b9', 'Cmaj13']) {
      const [chord] = chords(input)
      const [voicing] = voiceLeadTwoHands(chords(input))

      const played = new Set(
        [...voicing.left, ...voicing.right].map((note) => note % 12),
      )
      for (const interval of chord.quality.intervals) {
        expect(played.has((chord.root + interval) % 12)).toBe(true)
      }
    }
  })

  it('hợp âm năm nốt chia hai và ba', () => {
    const [voicing] = voiceLeadTwoHands(chords('Am9'))

    expect(voicing.left).toHaveLength(2)
    expect(voicing.right).toHaveLength(3)
  })

  it('hợp âm sáu nốt chia ba và ba', () => {
    const [voicing] = voiceLeadTwoHands(chords('G13'))

    expect(voicing.left).toHaveLength(3)
    expect(voicing.right).toHaveLength(3)
  })

  it('hợp âm bốn nốt trở xuống thì tay trái chỉ giữ bass', () => {
    for (const input of ['C', 'Cmaj7', 'Am7']) {
      const [voicing] = voiceLeadTwoHands(chords(input))
      expect(voicing.left).toHaveLength(1)
    }
  })

  it('leftHandNoteCount theo đúng quy tắc', () => {
    expect(leftHandNoteCount(3)).toBe(1)
    expect(leftHandNoteCount(4)).toBe(1)
    expect(leftHandNoteCount(5)).toBe(2)
    expect(leftHandNoteCount(6)).toBe(3)
  })
})

describe('hai tay không xếp xa nhau', () => {
  const ALL = 'C Cmaj7 Am7 Am9 G13 Am11 D9sus4 Cmaj13 F#m7b5 Bb13'

  it('tay trái luôn nằm dưới tay phải, không chồng lên nhau', () => {
    for (const voicing of voiceLeadTwoHands(chords(ALL))) {
      expect(Math.max(...voicing.left)).toBeLessThan(
        Math.min(...voicing.right),
      )
    }
  })

  it('cả hai tay gộp lại nằm gọn trong khoảng hai quãng tám', () => {
    // Người chơi thật xếp hai tay trong hai quãng tám kề nhau, không dang rộng
    for (const voicing of voiceLeadTwoHands(chords(ALL))) {
      const lowest = Math.min(...voicing.left)
      const highest = Math.max(...voicing.right)
      expect(highest - lowest).toBeLessThanOrEqual(26)
    }
  })

  it('mỗi tay không dang rộng quá một quãng tám rưỡi', () => {
    for (const voicing of voiceLeadTwoHands(chords(ALL))) {
      for (const hand of [voicing.left, voicing.right]) {
        if (hand.length < 2) continue
        expect(Math.max(...hand) - Math.min(...hand)).toBeLessThanOrEqual(18)
      }
    }
  })

  it('cả hai tay đều nằm trong tầm bàn phím', () => {
    for (const voicing of voiceLeadTwoHands(chords(ALL))) {
      for (const note of [...voicing.left, ...voicing.right]) {
        expect(note).toBeGreaterThanOrEqual(36)
        expect(note).toBeLessThanOrEqual(84)
      }
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
