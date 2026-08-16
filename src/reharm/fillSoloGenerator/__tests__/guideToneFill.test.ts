import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../soloGenerator'

/**
 * Câu fill kết ở **nốt dẫn của hợp âm đang chơi**, để nó tự giải quyết sang
 * hợp âm sau.
 *
 * Đo trên bản ký âm `reference/nguoi ay.mxl`: vào điệp khúc, tuyến giai điệu
 * ngân F suốt hai phách cuối trên hợp âm G rồi buông xuống E — quãng ba của C
 * — ngay đầu ô nhịp sau.
 */

const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

/** Câu fill chêm ở hợp âm thứ `at` của vòng. */
const fillAt = (text: string, at: number) => {
  const chords = parseChordInput(text).chords

  return generateFillLine(chords, {
    beatsPerChord: 4,
    density: 'dense',
    key: C_MAJOR,
    breaths: new Set([at]),
  })
}

const lastClass = (text: string, at: number) => {
  const notes = fillAt(text, at)
  return notes[notes.length - 1].note % 12
}

describe('nốt kết của câu fill', () => {
  it('bậc năm dẫn về chủ âm thì kết ở quãng bảy', () => {
    // G7 → Cadd9: F là quãng bảy của G7, buông nửa cung xuống E
    expect(lastClass('Cadd9 Am9 Fadd9 G7', 3)).toBe(5)
  })

  it('vòng hai-năm cũng cho đúng cặp nốt dẫn', () => {
    // Dm7 → G7: C là quãng bảy của Dm7, buông nửa cung xuống B
    expect(lastClass('C Am Dm7 G7', 2)).toBe(0)
  })

  it('hợp âm bậc bốn về chủ âm thì kết ở nốt gốc của nó', () => {
    // F → C: F buông nửa cung xuống E
    expect(lastClass('C Am Fadd9 G7', 2)).toBe(0)
  })

  it('không chạm vào nốt của hợp âm sắp tới', () => {
    /*
      Bản đầu kết ngay trên nốt đích, tức đánh trước mất cái nốt đáng lẽ để
      dành cho phách mạnh của ô sau — nghe hết cả bất ngờ.
    */
    const chords = parseChordInput('Cadd9 Am9 Fadd9 G7').chords
    const next = chords[0]
    const third = (next.root + 4) % 12

    expect(lastClass('Cadd9 Am9 Fadd9 G7', 3)).not.toBe(third)
  })

  it('nốt kết luôn thuộc hợp âm đang chơi', () => {
    for (const at of [0, 1, 2, 3]) {
      const chords = parseChordInput('Cadd9 Am9 Fadd9 G7').chords
      const tones = chords[at].quality.intervals.map(
        (step) => (chords[at].root + step) % 12,
      )

      expect(tones).toContain(lastClass('Cadd9 Am9 Fadd9 G7', at))
    }
  })
})

describe('nhịp của câu fill', () => {
  const notes = fillAt('Cadd9 Am9 Fadd9 G7', 3)

  it('nốt kết ngân dài hơn hẳn mấy nốt chạy tới nó', () => {
    // Sức căng đến từ chỗ giữ lâu, không từ chỗ đánh đúng lúc chót
    const hold = notes[notes.length - 1].durationBeats
    for (const note of notes.slice(0, -1)) {
      expect(hold).toBeGreaterThan(note.durationBeats * 2)
    }
  })

  it('mọi nốt rơi đúng lưới nốt kép', () => {
    /*
      Lấy thẳng một phần tư quãng fill thì ra 0,375 phách — không phải nốt kép
      cũng chẳng phải nốt móc, nghe lệch hẳn khỏi nhịp đệm.
    */
    for (const note of notes) {
      expect(Math.abs((note.startBeat / 0.25) % 1)).toBeLessThan(0.001)
    }
  })

  it('nốt kết ngân trọn tới đúng chỗ hợp âm sau vào', () => {
    const last = notes[notes.length - 1]

    // Hợp âm thứ tư của vòng bốn ô, mỗi ô bốn phách, kết thúc ở phách 16
    expect(last.startBeat + last.durationBeats).toBeCloseTo(16, 5)
  })

  it('câu fill nằm gọn trong nửa sau của hợp âm', () => {
    for (const note of notes) expect(note.startBeat).toBeGreaterThanOrEqual(14)
  })

  it('ba hoặc bốn nốt, đủ nghe ra hướng mà không lấn phần hát', () => {
    // Số nốt đổi theo lượt phát, xem `fillVariation.test.ts`
    for (const at of [0, 1, 2, 3]) {
      const line = fillAt('Cadd9 Am9 Fadd9 G7', at)

      expect(line.length).toBeGreaterThanOrEqual(3)
      expect(line.length).toBeLessThanOrEqual(4)
    }
  })
})
