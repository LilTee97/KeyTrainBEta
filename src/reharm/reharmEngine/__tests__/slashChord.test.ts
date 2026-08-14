import { describe, expect, it } from 'vitest'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { ParsedChord } from '../../types'
import { reharmonize } from '../reharmPipeline'
import { toSlashChord, toSlashSequence } from '../staticVoicingRules'

function chord(input: string): ParsedChord {
  const parsed = parseChordInput(input).chords[0]
  if (!parsed) throw new Error(`Không đọc được '${input}'`)
  return parsed
}

describe('toSlashChord', () => {
  it('quy hợp âm mở rộng về hợp âm ba chồng trên bass', () => {
    // Tài liệu ghi: E9sus4 = Rê trưởng chồng trên bass Mi
    const slash = toSlashChord(chord('E9sus4'))!

    expect(slash.symbol).toBe('D/E')
    expect(slash.root).toBe(2)
    expect(slash.bass).toBe(4)
  })

  it('giữ nốt bass là nốt gốc của hợp âm cũ', () => {
    for (const input of ['Am11', 'D9sus4', 'Cmaj9', 'G13']) {
      const source = chord(input)
      const slash = toSlashChord(source)!
      expect(slash.bass).toBe(source.root)
    }
  })

  it('hợp âm mới đơn giản hơn hợp âm cũ', () => {
    for (const input of ['Am11', 'D9sus4', 'E9sus4', 'Cmaj9']) {
      const source = chord(input)
      const slash = toSlashChord(source)!

      expect(slash.quality.intervals.length).toBeLessThan(
        source.quality.intervals.length,
      )
    }
  })

  it('mọi nốt của hợp âm mới đều nằm trong hợp âm cũ', () => {
    for (const input of ['Am11', 'D9sus4', 'E9sus4', 'G13']) {
      const source = chord(input)
      const slash = toSlashChord(source)!

      const original = new Set(
        chordPitchClasses(source.root, source.quality),
      )
      for (const pitch of chordPitchClasses(slash.root, slash.quality)) {
        expect(original.has(pitch)).toBe(true)
      }
    }
  })

  it('hợp âm đã đủ đơn giản thì không quy đổi', () => {
    expect(toSlashChord(chord('C'))).toBeNull()
    expect(toSlashChord(chord('Am'))).toBeNull()
    expect(toSlashChord(chord('C/E'))).toBeNull()
  })

  it('giữ lại chuỗi gốc người dùng gõ', () => {
    expect(toSlashChord(chord('Am11'))?.source).toBe('Am11')
  })
})

describe('toSlashSequence', () => {
  it('quy đổi được cả vòng', () => {
    const chords = parseChordInput('Am11 D9sus4 E9sus4').chords
    const slashed = toSlashSequence(chords)

    for (const entry of slashed) {
      expect(entry.symbol).toContain('/')
    }
  })

  it('hợp âm không quy đổi được thì giữ nguyên', () => {
    const chords = parseChordInput('C Am11 F').chords
    const slashed = toSlashSequence(chords)

    expect(slashed[0].symbol).toBe('C')
    expect(slashed[2].symbol).toBe('F')
    expect(slashed[1].symbol).toContain('/')
  })
})

describe('đường ống có bật lối bấm chồng trên bass', () => {
  it('mặc định tắt', () => {
    const result = reharmonize(parseChordInput('C Am F G').chords)
    for (const entry of result.final) {
      expect(entry.symbol).not.toContain('/')
    }
  })

  it('bật lên thì vòng cuối chuyển sang dạng chồng trên bass', () => {
    const result = reharmonize(parseChordInput('C Am F G').chords, {
      useSlashChords: true,
    })

    expect(
      result.final.some((entry) => entry.symbol.includes('/')),
    ).toBe(true)
  })

  it('không đụng tới khâu thêm màu, chỉ đổi cách bấm', () => {
    const chords = parseChordInput('C Am F G').chords

    const plain = reharmonize(chords)
    const slashed = reharmonize(chords, { useSlashChords: true })

    // Vòng đã thêm màu vẫn y nguyên, chỉ khâu cuối khác
    expect(slashed.colored.map((entry) => entry.symbol)).toEqual(
      plain.colored.map((entry) => entry.symbol),
    )
  })

  it('vẫn chạy được cùng lúc với hợp âm lướt', () => {
    const chords = parseChordInput('C Am F G').chords
    const first = reharmonize(chords)

    const result = reharmonize(chords, {
      useSlashChords: true,
      acceptedPassing: [first.passingSuggestions[0]],
    })

    expect(result.final.length).toBeGreaterThan(first.colored.length)
  })
})

describe('cách bấm thật sự đổi theo', () => {
  it('tay trái giữ nốt bass gốc, tay phải bấm hợp âm ba', () => {
    const slashed = reharmonize(parseChordInput('Am11').chords, {
      useSlashChords: true,
      intensity: 'off',
    })
    const [voicing] = voiceLeadTwoHands(slashed.final)

    // Tay trái vẫn là nốt La, nốt gốc của hợp âm ban đầu
    expect(voicing.left[0] % 12).toBe(9)
    // Tay phải chỉ còn ba nốt thay vì sáu
    expect(voicing.right).toHaveLength(3)
  })

  it('bấm ít nốt hơn hẳn so với hợp âm đầy đủ', () => {
    const chords = parseChordInput('Am11 D9sus4 E9sus4').chords

    const full = voiceLeadTwoHands(
      reharmonize(chords, { intensity: 'off' }).final,
    )
    const slashed = voiceLeadTwoHands(
      reharmonize(chords, { intensity: 'off', useSlashChords: true }).final,
    )

    const countNotes = (list: typeof full) =>
      list.reduce(
        (sum, voicing) => sum + voicing.left.length + voicing.right.length,
        0,
      )

    expect(countNotes(slashed)).toBeLessThan(countNotes(full))
  })
})
