import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import { getStyle } from '../styleLibrary'
import { patternOnsets, soloLeftHand } from '../soloLeftHand'

/*
  Tay trái gánh trọn mẫu đệm ở đoạn không lời.

  Đo trên bảy bản ký âm của Cà Pháo, tay trái ở đoạn giang tấu: 4,9-6,0 cú gõ
  mỗi ô, tầm đi 23-40 nửa cung, 1,04-1,20 nốt mỗi lần gõ. Tay trái của app
  trước khi sửa: bolero 2,0 cú gõ đi 7 nửa cung, bossa 4,0 đi 12, slow rock
  3,0 đi 16 — nó ĐẶT nốt chứ không ĐI.
*/

const STYLES = [
  'pop-1',
  'bossa-nova-1',
  'bolero-1',
  'slow-rock-duc-thinh-3',
  'hai-slow-rock',
] as const

const build = (styleId: string, input = 'Am Dm G C') => {
  const style = getStyle(styleId)!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const chords = parseChordInput(input).chords
  return {
    style,
    bar,
    chords,
    events: soloLeftHand({ chords, beatsEach: chords.map(() => bar), style }),
  }
}

describe('tay trái gánh mẫu đệm ở đoạn không lời', () => {
  it.each(STYLES)('%s: đi ít nhất hai quãng tám', (styleId) => {
    const notes = build(styleId).events.flatMap((event) => event.notes)
    expect(Math.max(...notes) - Math.min(...notes)).toBeGreaterThanOrEqual(23)
  })

  it.each(STYLES)('%s: gõ ít nhất bốn lần mỗi ô nhịp', (styleId) => {
    const { events, chords } = build(styleId)
    expect(events.length / chords.length).toBeGreaterThanOrEqual(4)
  })

  /*
    Luật người dùng đã ra và không đổi: đoạn không lời chơi đúng điệu đang chọn.
    Tay trái nhận thêm phần tay phải bỏ lại, KHÔNG mượn tiết tấu của điệu khác.
  */
  it.each(STYLES)('%s: gõ đúng mạch của chính điệu ấy', (styleId) => {
    const { events, bar } = build(styleId)
    const beats = [
      ...new Set(events.map((event) => Number((event.startBeat % bar).toFixed(3)))),
    ].sort((a, b) => a - b)
    expect(beats).toEqual(patternOnsets(getStyle(styleId)!))
  })

  /* Nhịp kép: sáu phách phải nghe thấy đủ sáu, không phải bốn. */
  it.each(['slow-rock-duc-thinh-3', 'hai-slow-rock', 'slow-rock-2'] as const)(
    '%s: nhịp 6/8 gõ đủ sáu phách',
    (styleId) => {
      expect(patternOnsets(getStyle(styleId)!)).toHaveLength(6)
    },
  )

  it.each(STYLES)('%s: mỗi lần gõ một nốt, không phải chùm bass', (styleId) => {
    for (const event of build(styleId).events) {
      expect(event.notes).toHaveLength(1)
    }
  })

  it.each(STYLES)('%s: chỉ nốt của hợp âm đang vang', (styleId) => {
    const { events, chords, bar } = build(styleId)
    for (const event of events) {
      const chord = chords[Math.min(chords.length - 1, Math.floor(event.startBeat / bar))]!
      const allowed = chordPitchClasses(chord.root, chord.quality)
      expect(allowed, `${styleId} @${event.startBeat}`).toContain(
        ((event.notes[0]! % 12) + 12) % 12,
      )
    }
  })

  /*
    Luật "tay trái không chạm Đô quãng tám 4" đã BỎ, theo yêu cầu người dùng và
    theo số đo: hai tay của Cà Pháo chồng tầm 3-12 nửa cung ở đoạn giang tấu.
    Thứ còn giữ là tầm tay người với tới được.
  */
  it.each(STYLES)('%s: nằm trong tầm một bàn tay trái với tới', (styleId) => {
    for (const note of build(styleId).events.flatMap((event) => event.notes)) {
      expect(note).toBeLessThanOrEqual(64)
      expect(note).toBeGreaterThanOrEqual(36)
    }
  })

  /*
    Hợp âm chia đôi vẫn phải nghe ra là nửa ô: chỉ lấy những cú gõ còn nằm
    trong nó, không bóp cả ô nhịp vào nửa ô.
  */
  it('hợp âm nửa ô chỉ lấy nửa số cú gõ', () => {
    const style = getStyle('bolero-1')!
    const bar = style.beatsPerMeasure
    const chords = parseChordInput('Am Dm').chords
    const full = soloLeftHand({ chords, beatsEach: [bar, bar], style })
    const half = soloLeftHand({ chords, beatsEach: [bar / 2, bar / 2], style })
    expect(half.length).toBeLessThan(full.length)
    expect(half.every((event) => event.startBeat < bar)).toBe(true)
  })
})
