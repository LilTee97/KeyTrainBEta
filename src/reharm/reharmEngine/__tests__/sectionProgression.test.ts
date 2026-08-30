import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ChordSpan } from '../../chordTiming'
import { doVongHoaThanh, khungHopAm, motLuot } from '../sectionProgression'

/*
  VÒNG HOÀ THANH TỪNG ĐOẠN.

  Trước đây app chỉ dò giọng cho cả bản, nên bài nào điệp khúc ngả sang giọng
  khác thì bậc La Mã của đoạn ấy sai vai trò.

  Và luật của người dùng về hợp âm nửa ô: gặp cặp chia đôi thì chỉ tính bậc cho
  hợp âm ĐẦU cặp — `Am - Em` là bậc của `Am`.
*/

/** Dựng khung thời gian: mỗi hợp âm ngân đúng số phách cho kèm. */
function spans(text: string, beats: readonly number[]): ChordSpan[] {
  const chords = parseChordInput(text).chords
  let at = 0
  return chords.map((chord, index) => {
    const dai = beats[index] ?? 4
    const span = { chord, start: at, beats: dai }
    at += dai
    return span
  })
}

const O = 4

describe('khung hợp âm bỏ hợp âm nửa ô', () => {
  it('cặp chia đôi chỉ còn hợp âm đầu cặp', () => {
    const khung = khungHopAm(spans('Am Em F C', [2, 2, 2, 2]), O)
    expect(khung.map((one) => one.chord.symbol)).toEqual(['Am', 'F'])
  })

  it('ô không chia thì giữ nguyên', () => {
    const khung = khungHopAm(spans('Am F C G', [4, 4, 4, 4]), O)
    expect(khung.map((one) => one.chord.symbol)).toEqual(['Am', 'F', 'C', 'G'])
  })

  it('hợp âm ngân qua nhiều ô chỉ đếm một lần', () => {
    const khung = khungHopAm(spans('Am F', [8, 4]), O)
    expect(khung.map((one) => one.chord.symbol)).toEqual(['Am', 'F'])
  })

  /*
    Chia ba, chia tư cũng theo luật ấy. Người dùng nói "cặp chia đôi", nhưng
    lý do — hợp âm nửa ô sau là màu đi qua chứ không phải một bậc — không đổi
    khi ô chia nhỏ hơn.
  */
  it('ô chia tư cũng chỉ giữ hợp âm ở vạch nhịp', () => {
    const khung = khungHopAm(spans('Am Em F C G', [1, 1, 1, 1, 4]), O)
    expect(khung.map((one) => one.chord.symbol)).toEqual(['Am', 'G'])
  })
})

describe('dò vòng hoà thanh', () => {
  it('không tính bậc cho hợp âm nửa ô sau', () => {
    const vong = doVongHoaThanh(spans('C G Am Em F C G G', [2, 2, 2, 2, 2, 2, 2, 2]), O)
    expect(vong.chords.map((one) => one.symbol)).toEqual(['C', 'Am', 'F', 'G'])
    expect(vong.bac).toEqual([1, 6, 4, 5])
    expect(vong.ten).toBe('1-6-4-5')
  })

  it('nhận ra chu kỳ lặp, kể cả khi đuôi dở dang', () => {
    const day = 'C Am F G C Am F G C'
    const vong = doVongHoaThanh(spans(day, day.split(' ').map(() => 4)), O)
    expect(vong.lap).toBe(4)
    expect(motLuot(vong).map((one) => one.symbol)).toEqual(['C', 'Am', 'F', 'G'])
  })

  it('vòng không lặp thì báo 0, và một lượt là cả đoạn', () => {
    const vong = doVongHoaThanh(spans('C F Dm G Em', [4, 4, 4, 4, 4]), O)
    expect(vong.lap).toBe(0)
    expect(motLuot(vong)).toHaveLength(5)
  })

  /*
    ĐÂY LÀ CHỖ CẢ BÀI KHÔNG BẮT ĐƯỢC. Phiên khúc La thứ, điệp khúc ngả sang Đô
    trưởng: dò chung một lượt thì một trong hai đoạn đọc sai vai trò mọi hợp âm.
  */
  it('mỗi đoạn dò giọng riêng, nên bắt được đoạn chuyển giọng', () => {
    const phien = doVongHoaThanh(spans('Am Dm E Am', [4, 4, 4, 4]), O)
    const diep = doVongHoaThanh(spans('C F G C', [4, 4, 4, 4]), O)
    expect(phien.key!.label).toBe('Am')
    expect(diep.key!.label).toBe('C')
    expect(phien.bac[0]).toBe(1)
    expect(diep.bac[0]).toBe(1)
  })

  it('đoạn rỗng không nổ, trả về vòng rỗng', () => {
    const vong = doVongHoaThanh([], O)
    expect(vong.key).toBe(null)
    expect(vong.chords).toEqual([])
    expect(motLuot(vong)).toEqual([])
  })
})
