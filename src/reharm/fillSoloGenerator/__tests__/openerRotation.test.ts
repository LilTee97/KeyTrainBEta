import { describe, expect, it } from 'vitest'
import { generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'

/**
 * Mẫu câu mới phải **thật sự được chọn**, không chỉ nằm trong danh sách.
 *
 * Đo ra mới thấy: `chooseLick` chỉ được gọi tới ở ô kết câu, còn ô mở câu bị
 * viết cứng đúng hai mẫu — nên `scale-run` và `bebop-pair` nằm trong vòng xoay
 * mà không lần nào chạy. Bài học: có mặt trong `LICKS` không có nghĩa là được
 * dùng; phải đo chỗ gọi.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

/** Hình dạng một ô: khoảng cách giữa các nốt chính, đủ để nhận ra ngón nào. */
const shapeOfBar = (prog: string, take: number, bar: number) => {
  const notes = generateSolo(parseChordInput(prog).chords, {
    beatsPerChord: 4,
    density: 'dense',
    chordsPerPhrase: 4,
    key: KEY,
    take,
    noteSource: 'storeScale',
    interlude: true,
    storeScale: scaleForChord,
  })
    .filter((n) => !n.isGrace && !n.ornament && n.startBeat >= bar * 4 && n.startBeat < (bar + 1) * 4)
    .map((n) => n.note)
  return notes.slice(1).map((note, at) => note - notes[at])
}

describe('ô mở câu xoay đủ bốn ngón', () => {
  it('ô 1 là cú quét cà pháo, nhiều nốt', () => {
    const bar1 = shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', 0, 0)
    expect(bar1.length).toBeGreaterThan(6)
  })

  it('lượt sau đổi ngón, không lặp lại lượt trước', () => {
    const takes = [0, 1, 2, 3].map((take) => shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', take, 0).join(','))
    expect(new Set(takes).size, `bốn lượt ra ${new Set(takes).size} hình`).toBeGreaterThan(2)
  })

  it('ô 3 chạy nhiều nốt, lượt chẵn và lẻ khác hình', () => {
    const even = shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', 0, 2)
    const odd = shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', 1, 2)
    expect(even.length).toBeGreaterThan(3)
    expect(odd.length).toBeGreaterThan(3)
    expect(even.join(',')).not.toBe(odd.join(','))
  })
})
