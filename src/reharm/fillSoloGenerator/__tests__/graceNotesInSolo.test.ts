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

/**
 * Mật độ nốt láy tách hẳn khỏi mật độ nốt câu nhạc, nên test phải chỉ định
 * riêng — để mức dày ở ô này không kéo theo ô kia.
 */
const solo = (
  graceDensity: 'none' | 'sparse' | 'medium' | 'dense' = 'dense',
  density: 'sparse' | 'medium' | 'dense' = 'sparse',
) =>
  generateSolo(parseChordInput(CHORDS).chords, {
    beatsPerChord: 4,
    density,
    graceDensity,
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
    const sorted = [...solo()].sort((a, b) => a.startBeat - b.startBeat)

    for (let index = 1; index < sorted.length; index += 1) {
      if (!sorted[index]!.isGrace) continue
      const previous = sorted[index - 1]!
      const end = previous.startBeat + previous.durationBeats
      expect(end).toBeLessThanOrEqual(sorted[index]!.startBeat + 0.001)
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
    const count = (graceDensity: 'none' | 'sparse' | 'dense') =>
      solo(graceDensity).filter((note) => note.isGrace).length

    expect(count('none')).toBe(0)
    expect(count('sparse')).toBeLessThan(count('dense'))
  })

  it('tắt hẳn thì câu nhạc không đổi gì ngoài việc mất nốt láy', () => {
    // Có người chỉ muốn nghe đúng nốt của hợp âm
    const off = solo('none')
    const on = solo('dense')

    expect(off.some((note) => note.isGrace)).toBe(false)
    expect(off.length).toBeLessThan(on.length)
  })

  it('chỉ láy nốt đủ dài, không láy từng nốt của câu chạy nhanh', () => {
    /*
      Nốt láy là đồ trang trí cho nốt tai dừng lại ở đó. Gắn vào từng nốt của
      một câu chạy nhanh thì câu nhạc nhoè đi — đo được 76% số nốt có láy ở
      bản trước, và nghe ra là "láy nhiều quá".
    */
    const line = solo('dense', 'dense')
    const graced = new Set(
      line
        .filter((note) => note.isGrace)
        .map((note) => (note.startBeat + note.durationBeats).toFixed(3)),
    )

    for (const note of line.filter((entry) => !entry.isGrace)) {
      if (!graced.has(note.startBeat.toFixed(3))) continue
      expect(note.durationBeats).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('không tràn ra ngoài vòng hợp âm', () => {
    /*
      Nốt láy mượn đuôi nốt đứng trước chứ không chèn thêm thời gian, nên câu
      nhạc phải nằm gọn trong bốn ô nhịp của vòng như khi chưa có nó.
    */
    for (const density of ['sparse', 'medium', 'dense'] as const) {
      for (const note of solo('dense', density)) {
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(16.001)
      }
    }
  })
})
