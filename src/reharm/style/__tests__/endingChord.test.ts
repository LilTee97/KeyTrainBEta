import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { SourceSection, TurnaroundTake } from '../arrangement'
import { buildArrangedSong } from '../arrangement'
import type { TimelineEvent } from '../types'
import { endingChordFor, endingChordLabel } from '../endingChord'

/**
 * Hợp âm cuối cùng của bài.
 *
 * Vòng hợp âm của đoạn kết chạy bình thường; chỉ hợp âm cuối được đổi, vì đó
 * là tiếng đàn còn đọng lại sau khi bài đã hết.
 */

const chord = (text: string) => parseChordInput(text).chords[0]

describe('màu hợp âm kết bài', () => {
  it('hợp âm trưởng kết bằng 6/9', () => {
    /*
      Tài liệu phần 12.2 ghi chuỗi `C → CM7 → C6 → CM7`, tức quãng sáu là màu
      dùng trên chủ âm. Các nguồn dạy jazz piano gọi 6/9 là hợp âm kết tiêu
      chuẩn: bỏ quãng bảy nên né hẳn câu hỏi trưởng hay át.
    */
    expect(endingChordFor(chord('Cadd9'), 'colored')!.quality.id).toBe('69')
  })

  it('hợp âm thứ kết bằng m6', () => {
    // Cùng ý tưởng chuyển sang màu thứ: thêm quãng sáu, không đụng quãng bảy
    expect(endingChordFor(chord('Am9'), 'colored')!.quality.id).toBe('m6')
  })

  it('kết trơn thì về đúng hợp âm ba', () => {
    expect(endingChordFor(chord('Cadd9'), 'plain')!.quality.id).toBe('maj')
    expect(endingChordFor(chord('Am9'), 'plain')!.quality.id).toBe('min')
  })

  it('giữ nguyên nốt gốc — đổi màu chứ không đổi hợp âm', () => {
    for (const symbol of ['Cadd9', 'Fmaj7', 'Am9', 'Ebm11']) {
      const before = chord(symbol)
      for (const mode of ['colored', 'plain'] as const) {
        const after = endingChordFor(before, mode)
        if (after) expect(after.root).toBe(before.root)
      }
    }
  })

  it('giữ nguyên tính chất trưởng hay thứ', () => {
    const minor = endingChordFor(chord('Am9'), 'colored')!
    const major = endingChordFor(chord('C'), 'colored')!

    expect(minor.quality.intervals).toContain(3)
    expect(major.quality.intervals).toContain(4)
  })

  it('bỏ nốt bass chồng dưới', () => {
    /*
      Hợp âm kết đứng trên nốt gốc của chính nó thì mới nghe ra là đã về nhà.
      Chồng trên bass khác là cách bấm cho câu còn đang đi tiếp.
    */
    expect(endingChordFor(chord('C/E'), 'colored')!.bass).toBeUndefined()
  })

  it('đã đúng màu rồi thì không đổi nữa', () => {
    expect(endingChordFor(chord('C69'), 'colored')).toBeNull()
    expect(endingChordFor(chord('C'), 'plain')).toBeNull()
  })

  it('nhãn ghi rõ đổi từ gì sang gì', () => {
    expect(endingChordLabel(chord('Cadd9'), 'colored')).toBe('Cadd9 → C6/9')
  })
})

/** Một sự kiện tối giản, chỉ cần mốc phách là đủ. */
const at = (startBeat: number): TimelineEvent => ({
  startBeat,
  durationBeats: 1,
  notes: [60],
  hand: 'left',
  velocity: 70,
})

const sources: SourceSection[] = [
  { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 8 },
  { name: 'Điệp khúc', kind: 'chorus', startBeat: 8, lengthBeats: 8 },
]

const backing = Array.from({ length: 16 }, (_, beat) => at(beat))

/** Hợp âm kết giả, chiếm bốn phách cuối, đánh dấu bằng nốt 99. */
const fakeEnding = (): TurnaroundTake => ({
  events: [{ ...at(0), notes: [99] }],
  beats: 4,
})

describe('ghép hợp âm kết vào đoạn kết bài', () => {
  const build = (ending?: 'colored' | 'plain') =>
    buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps: [{ type: 'section', source: 1, ending }],
      ending: fakeEnding,
    })

  it('hợp âm cuối được thay, phần còn lại giữ nguyên', () => {
    const song = build('colored')

    const kept = song.events
      .filter((event) => event.notes[0] !== 99)
      .map((event) => event.startBeat)

    // Đoạn dài 8 phách, hợp âm kết chiếm 4 phách cuối
    expect(kept).toEqual([0, 1, 2, 3])
    expect(song.events.some((event) => event.notes[0] === 99)).toBe(true)
  })

  it('không đánh dấu thì không đụng gì tới đoạn', () => {
    const song = build()

    expect(song.events.some((event) => event.notes[0] === 99)).toBe(false)
    expect(song.events).toHaveLength(8)
  })

  it('độ dài đoạn không đổi', () => {
    // Đổi màu hợp âm cuối chứ không kéo dài hay cắt ngắn bài
    expect(build('colored').totalBeats).toBe(build().totalBeats)
  })

  it('không cấp hàm dựng hợp âm kết thì bỏ qua, không vỡ', () => {
    const song = buildArrangedSong({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      sources,
      steps: [{ type: 'section', source: 1, ending: 'colored' }],
    })

    expect(song.events).toHaveLength(8)
  })
})
