import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import { getStyle } from '../styleLibrary'
import { accentBeats, patternOnsets, patternStrikes, soloLeftHand } from '../soloLeftHand'

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

/*
  Hai tay CÀI vào nhau, không GÕ CHỒNG.

  Đo trên bản ký âm của Cà Pháo, đoạn giang tấu: chỉ 32-73% số nốt tay phải rơi
  trúng một cú gõ tay trái — quá nửa còn lại rơi vào khe giữa hai cú. Đó là chỗ
  khác nhau giữa hai bè cài vào nhau và hai bè đè lên nhau.

  App trước khi sửa: 51-99%, bossa tới 99% — mỗi nốt giai điệu nhân đôi một
  tiếng bass. Người dùng nghe ra là "dồn nốt rối tai" và tưởng do quá nhiều
  nốt; thật ra tay phải của app còn THƯA HƠN người thật một nửa (tỉ lệ phải trên
  trái 0,6-1,0 so với 1,9-2,8). Cái sai nằm ở chỗ rơi, không ở số lượng.
*/
describe('giai điệu neo vào cú gõ mạnh, không vào mọi cú', () => {
  it.each(STYLES)('%s: chỗ neo là tập con của chỗ gõ', (styleId) => {
    const style = getStyle(styleId)!
    const all = patternOnsets(style)
    const accents = accentBeats(style)
    expect(accents.length).toBeGreaterThanOrEqual(2)
    expect(accents.length).toBeLessThanOrEqual(all.length)
    for (const beat of accents) expect(all).toContain(beat)
  })

  /*
    Trần sáu cú gõ mỗi ô: đo trên người thật ra 3,4-5,8. Gộp cả hai tay của ô
    nhịp bossa ra tám, kín hết tám móc đơn, và giai điệu hết khe để lách.
  */
  it.each(STYLES)('%s: không quá sáu cú gõ mỗi ô nhịp', (styleId) => {
    expect(patternOnsets(getStyle(styleId)!).length).toBeLessThanOrEqual(6)
  })

  /*
    Mẫu Slow Rock 3 của thầy Đức Thịnh: phách 4 vào SỚM ở 1,45, không phải 1,5.
    Đó là chỗ giật cục của mẫu, và người dùng đã nắn nó bằng tai. Bản trước của
    hàm này thay cả hàng bằng một lưới đều tăm tắp và xoá mất nó.
  */
  it('giữ chỗ vào sớm 1,45 của thầy Đức Thịnh', () => {
    expect(patternOnsets(getStyle('slow-rock-duc-thinh-3')!)).toContain(1.45)
  })

  it('giữ trường độ và độ nhấn của chính ô nhịp điệu', () => {
    const strikes = patternStrikes(getStyle('slow-rock-duc-thinh-3')!)
    const real = strikes.filter((strike) => !strike.filler)
    // Bốn cú gõ thật, mỗi cú một trường độ khác nhau — không bị làm phẳng.
    expect(new Set(real.map((strike) => strike.durationBeats)).size).toBeGreaterThan(2)
    expect(new Set(real.map((strike) => strike.velocityScale)).size).toBeGreaterThan(2)
    // Nốt chèn phải nhẹ hơn mọi cú gõ thật.
    const filler = strikes.filter((strike) => strike.filler)
    expect(filler.length).toBe(2)
    for (const one of filler) {
      expect(one.velocityScale).toBeLessThan(
        Math.min(...real.map((strike) => strike.velocityScale)),
      )
    }
  })
})
