import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import {
  RIGHT_HAND_HIGH,
  RIGHT_HAND_LOW,
  chooseVoicing,
  plainSequence,
  totalMovement,
  voiceLeadSequence,
  voicingCandidates,
  voicingDistance,
} from '../voiceLeadingOptimizer'

/** Đọc chuỗi hợp âm cho test. */
function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

describe('voicingDistance', () => {
  it('thế bấm giống hệt thì không phải di chuyển', () => {
    expect(voicingDistance([60, 64, 67], [60, 64, 67])).toBe(0)
  })

  it('mỗi nốt tính theo nốt gần nhất của thế bấm trước', () => {
    // Mỗi nốt nhích lên một nửa cung
    expect(voicingDistance([60, 64, 67], [61, 65, 68])).toBe(3)
  })

  it('nhảy cả quãng tám tốn kém hơn hẳn nhích nửa cung', () => {
    const nearby = voicingDistance([60, 64, 67], [61, 65, 68])
    const octaveAway = voicingDistance([60, 64, 67], [72, 76, 79])

    expect(octaveAway).toBeGreaterThan(nearby * 5)
  })

  it('đo theo nốt gần nhất chứ không ghép theo thứ tự', () => {
    // Nốt 72 gần nốt 67 nhất (cách 5), không phải ghép với nốt 60 (cách 12)
    expect(voicingDistance([60, 64, 67], [72])).toBe(5)
  })

  it('chịu được hai thế bấm khác số nốt', () => {
    const distance = voicingDistance([60, 64, 67], [60, 64, 67, 71])
    expect(Number.isFinite(distance)).toBe(true)
    // Ba nốt đầu trùng khớp, chỉ nốt thứ tư phải tính khoảng cách
    expect(distance).toBe(4)
  })

  it('thế bấm rỗng không gây lỗi', () => {
    expect(voicingDistance([], [60, 64])).toBe(0)
    expect(voicingDistance([60, 64], [])).toBe(0)
  })
})

describe('voicingCandidates', () => {
  const [cmaj7] = chords('Cmaj7')

  it('sinh ra nhiều thế bấm khác nhau', () => {
    expect(voicingCandidates(cmaj7).length).toBeGreaterThan(3)
  })

  it('mọi ứng viên đều nằm trong dải tay phải', () => {
    for (const candidate of voicingCandidates(cmaj7)) {
      expect(Math.min(...candidate)).toBeGreaterThanOrEqual(RIGHT_HAND_LOW)
      expect(Math.max(...candidate)).toBeLessThanOrEqual(RIGHT_HAND_HIGH)
    }
  })

  it('mọi ứng viên đều giữ đủ các nốt của hợp âm', () => {
    for (const candidate of voicingCandidates(cmaj7)) {
      const classes = new Set(candidate.map((note) => note % 12))
      expect(classes).toEqual(new Set([0, 4, 7, 11]))
    }
  })

  it('không sinh ứng viên trùng nhau', () => {
    const candidates = voicingCandidates(cmaj7)
    const keys = candidates.map((candidate) => candidate.join(','))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ứng viên luôn xếp nốt tăng dần', () => {
    for (const candidate of voicingCandidates(cmaj7)) {
      expect(candidate).toEqual([...candidate].sort((a, b) => a - b))
    }
  })

  it('dải quá hẹp thì không có ứng viên nào', () => {
    expect(voicingCandidates(cmaj7, 60, 62)).toEqual([])
  })
})

describe('chooseVoicing', () => {
  it('hợp âm đầu tiên nằm gần trọng tâm mong muốn', () => {
    const [chord] = chords('Cmaj7')
    const voicing = chooseVoicing(chord, null)

    const center = voicing.reduce((sum, note) => sum + note, 0) / voicing.length
    expect(Math.abs(center - 67)).toBeLessThan(8)
  })

  it('chọn thế bấm gần với hợp âm trước', () => {
    const [g7] = chords('G7')
    // Ép hợp âm trước nằm ở vùng cao
    const previous = [79, 83, 86]
    const voicing = chooseVoicing(g7, previous)

    expect(voicingDistance(previous, voicing)).toBeLessThan(
      voicingDistance(previous, [55, 59, 62, 65]),
    )
  })

  it('không bao giờ trả về thế bấm rỗng', () => {
    for (const chord of chords('Cmaj7 Am11 D9sus4 F#m7b5 C13b9')) {
      expect(chooseVoicing(chord, null).length).toBeGreaterThan(0)
    }
  })

  it('kết quả luôn giữ đủ nốt hợp âm', () => {
    const [am11] = chords('Am11')
    const voicing = chooseVoicing(am11, null)
    const classes = new Set(voicing.map((note) => note % 12))

    for (const interval of am11.quality.intervals) {
      expect(classes.has((am11.root + interval) % 12)).toBe(true)
    }
  })
})

describe('voiceLeadSequence', () => {
  it('trả về đúng số thế bấm', () => {
    expect(voiceLeadSequence(chords('Dm7 G7 Cmaj7'))).toHaveLength(3)
  })

  it('mượt hơn hẳn cách xếp chồng mộc', () => {
    const sequence = chords('Cmaj7 Am7 Dm7 G7 Cmaj7')

    const optimized = totalMovement(voiceLeadSequence(sequence))
    const plain = totalMovement(plainSequence(sequence))

    expect(optimized).toBeLessThan(plain)
  })

  it('mượt hơn ở mọi vòng hợp âm thật lấy từ tài liệu', () => {
    const progressions = [
      'Am11 D9sus4 E9sus4 Em7',
      'Dm9 Gm7 C7 FM7 BbM7',
      'C G Am Em F C F G',
      'Dm7 G7 Cmaj7 Am7',
    ]

    for (const input of progressions) {
      const sequence = chords(input)
      expect(totalMovement(voiceLeadSequence(sequence))).toBeLessThan(
        totalMovement(plainSequence(sequence)),
      )
    }
  })

  it('không để chuỗi trôi dần khỏi vùng dễ chơi', () => {
    // Vòng Canon lặp ba lần: cộng dồn dễ khiến cao độ trôi nếu không neo
    const sequence = chords('C G Am Em F C F G '.repeat(3))
    const voicings = voiceLeadSequence(sequence)

    for (const voicing of voicings) {
      expect(Math.min(...voicing)).toBeGreaterThanOrEqual(RIGHT_HAND_LOW)
      expect(Math.max(...voicing)).toBeLessThanOrEqual(RIGHT_HAND_HIGH)
    }
  })

  it('hợp âm liền nhau di chuyển ít', () => {
    const voicings = voiceLeadSequence(chords('Dm7 G7 Cmaj7'))

    for (let index = 1; index < voicings.length; index += 1) {
      // Mỗi bước chuyển trung bình dưới ba nửa cung một nốt
      const perNote =
        voicingDistance(voicings[index - 1], voicings[index]) /
        voicings[index].length
      expect(perNote).toBeLessThan(3)
    }
  })

  it('chuỗi rỗng cho kết quả rỗng', () => {
    expect(voiceLeadSequence([])).toEqual([])
  })

  it('một hợp âm vẫn chạy được', () => {
    expect(voiceLeadSequence(chords('Cmaj7'))).toHaveLength(1)
  })
})

describe('plainSequence', () => {
  it('luôn xếp chồng từ nốt gốc, không đảo', () => {
    const voicings = plainSequence(chords('Cmaj7 G7'))

    for (const voicing of voicings) {
      expect(voicing).toEqual([...voicing].sort((a, b) => a - b))
    }
  })

  it('giữ đủ nốt hợp âm', () => {
    const [voicing] = plainSequence(chords('Cmaj7'))
    expect(new Set(voicing.map((note) => note % 12))).toEqual(
      new Set([0, 4, 7, 11]),
    )
  })
})

describe('totalMovement', () => {
  it('chuỗi một hợp âm thì không có di chuyển', () => {
    expect(totalMovement([[60, 64, 67]])).toBe(0)
  })

  it('cộng dồn khoảng cách của từng bước', () => {
    expect(
      totalMovement([
        [60, 64, 67],
        [61, 65, 68],
        [62, 66, 69],
      ]),
    ).toBe(6)
  })
})
