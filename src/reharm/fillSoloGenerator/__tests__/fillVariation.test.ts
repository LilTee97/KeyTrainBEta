import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../soloGenerator'

/**
 * Câu fill đổi theo lượt phát.
 *
 * Nghe một bài hai lần mà câu chêm giống hệt nhau thì lộ ra ngay là máy đánh.
 * Lượt chỉ đổi **hướng đi** và **số nốt** chứ không đổi nốt đích — nốt đích là
 * chỗ hoà âm đòi hỏi, không phải chỗ để biến tấu.
 */

const CHORDS = 'Cadd9 Am9 Fadd9 G7'
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

const fill = (take: number) =>
  generateFillLine(parseChordInput(CHORDS).chords, {
    lickyFills: false,
    beatsPerChord: 4,
    density: 'dense',
    key: C_MAJOR,
    breaths: new Set([0, 1, 2, 3]),
    take,
  })

const shape = (take: number) =>
  fill(take)
    .map((note) => `${note.startBeat}:${note.note}`)
    .join(' ')

describe('biến tấu câu fill theo lượt', () => {
  it('bốn lượt liên tiếp không lượt nào giống lượt nào', () => {
    const shapes = [0, 1, 2, 3].map(shape)

    expect(new Set(shapes).size).toBe(4)
  })

  it('nốt kết vẫn giữ nguyên qua mọi lượt', () => {
    /*
      Nốt kết là nốt dẫn của hợp âm đang chơi, do hoà âm quyết định. Đổi nó thì
      không còn là biến tấu mà là chơi sai chỗ.
    */
    const endings = [0, 1, 2, 3].map((take) => {
      const line = fill(take)
      const last = new Map<number, number>()
      for (const note of line) last.set(Math.floor(note.startBeat / 4), note.note % 12)
      return [...last.entries()].sort((a, b) => a[0] - b[0])
    })

    for (const line of endings) expect(line).toEqual(endings[0])
  })

  it('vẫn nằm gọn trong vòng hợp âm', () => {
    for (const take of [0, 1, 2, 3]) {
      for (const note of fill(take)) {
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(16.001)
      }
    }
  })

  it('người dùng chọn hướng cố định thì lượt không đổi hướng nữa', () => {
    // Chọn tay thì phải thắng phần tự biến tấu
    const up = (take: number) =>
      generateFillLine(parseChordInput(CHORDS).chords, {
        lickyFills: false,
        beatsPerChord: 4,
        density: 'dense',
        direction: 'below',
        key: C_MAJOR,
        breaths: new Set([0]),
        take,
      })

    for (const take of [0, 1]) {
      const line = up(take)
      for (let i = 1; i < line.length; i += 1) {
        expect(line[i].note).toBeGreaterThan(line[i - 1].note)
      }
    }
  })
})
