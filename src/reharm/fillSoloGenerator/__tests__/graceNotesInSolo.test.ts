import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateSolo } from '../soloGenerator'

/**
 * Nốt láy — kỹ thuật số 4 trong năm kỹ thuật của phong cách.
 *
 * `graceNoteOrnamenter.ts` dựng sẵn luật chọn nốt láy từ lâu nhưng chưa ai gọi
 * tới: ô "Mật độ nốt láy" trên giao diện thật ra chỉ điều khiển mật độ nốt của
 * câu solo.
 */

const CHORDS = 'Cadd9 Am9 Fadd9 G7'
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

const solo = (density: 'sparse' | 'medium' | 'dense' = 'medium') =>
  generateSolo(parseChordInput(CHORDS).chords, {
    beatsPerChord: 4,
    density,
    key: C_MAJOR,
  })

describe('nốt láy trong câu solo', () => {
  const line = solo()
  const grace = line.filter((note) => note.isGrace)

  it('có nốt láy', () => {
    expect(grace.length).toBeGreaterThan(0)
  })

  it('nốt chính vẫn rơi đúng lưới nốt kép', () => {
    /*
      Đây là chỗ bản đầu làm sai: nó cắt đoạn đầu của nốt chính cho nốt láy nên
      nốt chính bị dời sang phách 0,125, cả câu trôi khỏi lưới và nghe lệch với
      nhịp đệm.
    */
    for (const note of line.filter((entry) => !entry.isGrace)) {
      expect(Math.abs((note.startBeat / 0.25) % 1)).toBeLessThan(0.001)
    }
  })

  it('nốt láy vang ngay trước nốt chính của nó', () => {
    for (const note of grace) {
      const after = line.find(
        (entry) =>
          !entry.isGrace &&
          Math.abs(entry.startBeat - (note.startBeat + note.durationBeats)) <
            0.001,
      )

      expect(after).toBeDefined()
    }
  })

  it('nốt láy cách nốt chính đúng một bậc trong giọng', () => {
    for (const note of grace) {
      const main = line.find(
        (entry) =>
          !entry.isGrace &&
          Math.abs(entry.startBeat - (note.startBeat + note.durationBeats)) <
            0.001,
      )!

      const step = Math.abs(main.note - note.note)
      expect(step).toBeGreaterThan(0)
      expect(step).toBeLessThanOrEqual(2)
    }
  })

  it('nốt láy ngắn, chỉ là cái vuốt vào phách', () => {
    // Dài hơn thì tai đếm nó thành một nốt của câu nhạc
    for (const note of grace) expect(note.durationBeats).toBeLessThanOrEqual(0.125)
  })

  it('nốt đứng trước được cắt đuôi, không chồng lên nốt láy', () => {
    const sorted = [...line].sort((a, b) => a.startBeat - b.startBeat)

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]
      const end = previous.startBeat + previous.durationBeats
      expect(end).toBeLessThanOrEqual(sorted[index].startBeat + 0.001)
    }
  })

  it('nốt đầu câu không có nốt láy vì chưa có chỗ phía trước', () => {
    expect(line[0].isGrace).toBe(false)
    expect(line[0].startBeat).toBe(0)
  })

  it('không có nốt láy nào rơi vào trước lúc bắt đầu', () => {
    for (const note of line) expect(note.startBeat).toBeGreaterThanOrEqual(0)
  })

  it('láy dày hơn thì nhiều nốt láy hơn', () => {
    const count = (density: 'sparse' | 'medium' | 'dense') =>
      solo(density).filter((note) => note.isGrace).length

    expect(count('sparse')).toBeLessThan(count('medium'))
    expect(count('medium')).toBeLessThan(count('dense'))
  })

  it('không tràn ra ngoài vòng hợp âm', () => {
    /*
      Nốt láy mượn đuôi nốt đứng trước chứ không chèn thêm thời gian, nên câu
      nhạc phải nằm gọn trong bốn ô nhịp của vòng như khi chưa có nó.
    */
    for (const density of ['sparse', 'medium', 'dense'] as const) {
      for (const note of solo(density)) {
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(16.001)
      }
    }
  })
})
