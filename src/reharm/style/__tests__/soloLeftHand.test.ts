import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import { getStyle } from '../styleLibrary'
import { accentBeats, patternOnsets, patternStrikes, soloLeftHand } from '../soloLeftHand'

/*
  Tay trái ở đoạn không lời: chơi PHẦN CỦA MÌNH, và ĐI chứ không đứng.

  Có một lượt trước đây tay trái gõ trọn mẫu đệm — gộp cả phần tay phải — vì đo
  ra nó quá thưa so với người thật (bolero 2,0 cú gõ mỗi ô so với 4,9-6,0 của Cà
  Pháo). Người dùng nghe rồi bác: để tay trái đảm nhiệm toàn bộ pattern điệu đệm
  trong lúc solo là không đúng.

  Nay chia lại: tay trái chơi đúng phần tay trái của mẫu đệm, còn chỗ thưa ra thì
  lấp bằng luật mật độ — chèn nốt rải vào đúng những khe tay phải đang nghỉ hoặc
  đang ngân. Xem `interlockHands` và `interlockHands.test.ts`.

  Thứ KHÔNG đổi, vì nó đến từ số đo chứ không từ thiết kế: tầm đi hai quãng tám
  (Cà Pháo 23-40 nửa cung, app cũ 7-16 — nó ĐẶT nốt chứ không ĐI), và nhịp kép
  phải nghe đủ sáu phách.
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

  /*
    Luật người dùng đã ra và không đổi: đoạn không lời chơi đúng điệu đang chọn.
    Nhưng chỉ chơi PHẦN TAY TRÁI của điệu ấy, không ôm luôn phần tay phải.
  */
  it.each(STYLES)('%s: gõ đúng mạch tay trái của chính điệu ấy', (styleId) => {
    const { events, bar } = build(styleId)
    const beats = [
      ...new Set(events.map((event) => Number((event.startBeat % bar).toFixed(3)))),
    ].sort((a, b) => a - b)
    expect(beats).toEqual(patternOnsets(getStyle(styleId)!, 'left'))
  })

  /*
    Chốt lại đúng chỗ người dùng bác: có ít nhất một điệu mà phần tay phải của
    mẫu đệm KHÔNG lọt sang tay trái. Nếu hai con số bằng nhau ở mọi điệu thì lối
    gánh trọn đã lẻn về.
  */
  it('không ôm phần tay phải của mẫu đệm sang tay trái', () => {
    const thinner = STYLES.filter((styleId) => {
      const style = getStyle(styleId)!
      return patternOnsets(style, 'left').length < patternOnsets(style, 'both').length
    })
    expect(thinner.length).toBeGreaterThan(0)
  })

  /* Nhịp kép: sáu phách phải nghe thấy đủ sáu, không phải bốn. */
  it.each(['slow-rock-duc-thinh-3', 'hai-slow-rock', 'slow-rock-2'] as const)(
    '%s: nhịp 6/8 gõ đủ sáu phách',
    (styleId) => {
      expect(patternOnsets(getStyle(styleId)!, 'left')).toHaveLength(6)
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
  /*
    Chỗ giật cục 1,45 là hợp âm tay PHẢI của mẫu (ô nhịp ghi beat 2,9 × lưới
    0,5). Tay trái không gõ nó nữa, nhưng mạch nhấn thì vẫn tính cả hai tay —
    nên giai điệu vẫn neo vào đúng chỗ ấy. Tính cách của mẫu chuyển sang tay
    phải, không mất đi.
  */
  it('giữ chỗ vào sớm 1,45 của thầy Đức Thịnh', () => {
    expect(patternOnsets(getStyle('slow-rock-duc-thinh-3')!)).toContain(1.45)
    expect(accentBeats(getStyle('slow-rock-duc-thinh-3')!)).toContain(1.45)
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

  it('Tôn Hùng dạo: chỉ phách 1', () => {
    const style = getStyle('ton-hung-ballad')!
    const chords = parseChordInput('C F G C').chords
    const events = soloLeftHand({
      chords,
      beatsEach: chords.map(() => 4),
      style,
      chiPhach1: true,
    })
    expect([
      ...new Set(events.map((event) => Number((event.startBeat % 4).toFixed(3)))),
    ]).toEqual([0])
  })

  it('Tôn Hùng giang dày hơn dạo', () => {
    expect(patternOnsets(getStyle('ton-hung-ballad-giang')!, 'left').length).toBeGreaterThan(
      patternOnsets(getStyle('ton-hung-ballad')!, 'left').length,
    )
  })
})
