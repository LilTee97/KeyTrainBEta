import { describe, expect, it } from 'vitest'
import { cueChord } from '../phraseChords'
import { pullChordFor } from '../turnaround'
import { parseChordInput } from '../../input/chordInputParser'
import { normalizePitchClass } from '../../../shared/musicTheory/pitch'

/**
 * Hợp âm báo cuối dạo đầu có đúng **một** việc: đẩy ca sĩ vào.
 *
 * Nó phải mang đủ **quãng ba trưởng và quãng bảy thứ** tính từ nốt gốc của chính
 * nó. Cặp tam cung ấy mới là lực kéo; thiếu một trong hai thì hợp âm chỉ còn là
 * một mảng màu. Đo trên bậc năm là Sol:
 *
 *     G9sus4 = G C D F A     KHÔNG có B  -> mất nốt cảm, không hút
 *     Gadd9  = G B D A       KHÔNG có F  -> không có tam cung, không hút
 *     G7b9   = G B D F Ab    đủ cả hai, cộng sức căng
 *
 * Kiểm bằng **nốt**, không kiểm bằng tên hợp âm: đổi bảng màu thì tên đổi theo,
 * mà luật nhạc thì không đổi.
 */
const chord = (symbol: string) => parseChordInput(symbol).chords[0]!

const TRUONG = ['C', 'Cmaj7', 'Cadd9', 'Fmaj7', 'Bb', 'Eadd9']
const THU = ['Am', 'Am7', 'Cm', 'F#m7', 'Bbm', 'Em']

describe('hợp âm báo cuối dạo đầu', () => {
  it('luôn có nốt cảm và tam cung, dù đích trưởng hay thứ', () => {
    for (const symbol of [...TRUONG, ...THU]) {
      const cue = cueChord(chord(symbol))
      expect(cue, `${symbol}: không dựng được hợp âm báo`).not.toBeNull()

      const bac = new Set(
        cue!.quality.intervals.map((step) => normalizePitchClass(step)),
      )
      expect(bac.has(4), `${symbol} -> ${cue!.quality.id}: thiếu quãng ba trưởng`).toBe(true)
      expect(bac.has(10), `${symbol} -> ${cue!.quality.id}: thiếu quãng bảy thứ`).toBe(true)
    }
  })

  it('dựng trên bậc năm của hợp âm đích', () => {
    for (const symbol of [...TRUONG, ...THU]) {
      const target = chord(symbol)
      expect(cueChord(target)!.root).toBe(normalizePitchClass(target.root + 7))
    }
  })

  it('không bao giờ ra màu treo hay màu đã yên vị', () => {
    // `9sus4` mất nốt cảm; `13` và `add9` nghe đã đến nơi rồi.
    for (const symbol of [...TRUONG, ...THU]) {
      expect(['9sus4', '13sus4', '7sus4', '13', 'add9', '69']).not.toContain(
        cueChord(chord(symbol))!.quality.id,
      )
    }
  })
})

describe('quay đầu giữa bài giữ nguyên lối của thầy', () => {
  /*
    Quay đầu là để **đi tiếp**, không phải để đẩy ai vào — nên `9sus4` ở đó vẫn
    đúng, và bảng màu cũ không được đổi theo bảng mạnh.
  */
  it('đích trưởng vẫn ra 9sus4', () => {
    expect(pullChordFor(chord('C'))!.quality.id).toBe('9sus4')
    expect(pullChordFor(chord('Cadd9'))!.quality.id).toBe('9sus4')
  })

  it('đích thứ vẫn ra 7b9', () => {
    expect(pullChordFor(chord('Am7'))!.quality.id).toBe('7b9')
  })

  it('hai bảng ra khác nhau ở đúng chỗ đáng khác', () => {
    const thuong = pullChordFor(chord('C'))!
    const manh = pullChordFor(chord('C'), { strong: true })!
    expect(thuong.root).toBe(manh.root)
    expect(thuong.quality.id).not.toBe(manh.quality.id)
  })
})
