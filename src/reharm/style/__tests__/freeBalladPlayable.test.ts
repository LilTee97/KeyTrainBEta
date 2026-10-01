import { describe, expect, it } from 'vitest'
import { BALLAD_SOLO_RANGE } from '../balladFamily'
import { parseChordInput } from '../../input/chordInputParser'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'

// 30/9/2026: bỏ phần kiểm Pop Ballad tự do (Hải) — điệu ấy đã xoá; giữ phần tầm câu solo ballad, không gắn điệu nào.
const KEY = { tonic: 0 as const, scale: 'major' as const }

describe('câu solo trên điệu ballad không leo hết bàn phím', () => {
  const chords = parseChordInput('C Am F G').chords

  const rangeOf = (range?: typeof BALLAD_SOLO_RANGE) => {
    const notes: number[] = []
    for (let take = 0; take < 8; take += 1) {
      for (const note of soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take,
          ...(range ? { range } : {}),
        }),
      )) {
        notes.push(...note.notes)
      }
    }
    return { low: Math.min(...notes), high: Math.max(...notes) }
  }

  it('mọi điệu đều nằm trong tầm người đệm, không riêng ballad', () => {
    // Sol quãng tám 6 là tầm độc tấu, quá cao cho đệm hát.
    expect(rangeOf().high).toBeLessThanOrEqual(81)
  })

  it('ballad hạ trần xuống tầm tay người đệm', () => {
    const capped = rangeOf(BALLAD_SOLO_RANGE)
    // Si quãng tám 5 trở lên là chỗ người dùng báo nghe phi thực tế.
    expect(capped.high).toBeLessThan(83)
    expect(capped.low).toBeGreaterThanOrEqual(55)
  })
})
