import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../handSplitVoicing'

/*
  Mỗi bàn tay bấm trong một quãng tám.

  Bàn tay người với được chừng ấy. Thế bấm rộng hơn thì trên giấy vẫn là hợp âm
  đúng, mà ngồi vào đàn là không bấm nổi. `MAX_HAND_SPAN` không chặn được ca này:
  nó đo từ nốt thấp nhất tay trái tới nốt cao nhất tay phải, nên một bàn tay dang
  mười lăm nửa cung vẫn lọt nếu tay kia đứng sát.
*/

const WIDE = 'C13 Cmaj9 Am11 F#m7b5 E7b9 Dm9 G13 Bbmaj7#11'

function hands(input: string) {
  return voiceLeadTwoHands(parseChordInput(input).chords)
}

const span = (notes: readonly number[]) =>
  notes.length < 2 ? 0 : Math.max(...notes) - Math.min(...notes)

describe('thế bấm hai tay', () => {
  it('mỗi tay không dang quá một quãng tám', () => {
    for (const voicing of hands(WIDE)) {
      expect(span(voicing.left), `${voicing.symbol} tay trái`).toBeLessThanOrEqual(12)
      expect(span(voicing.right), `${voicing.symbol} tay phải`).toBeLessThanOrEqual(12)
    }
  })

  it('hai tay cộng lại không dang quá hai quãng tám', () => {
    for (const voicing of hands(WIDE)) {
      const all = [...voicing.left, ...voicing.right]
      expect(span(all), `${voicing.symbol} cả hai tay`).toBeLessThanOrEqual(24)
    }
  })

  it('một bàn tay không bấm cùng một phím hai lần', () => {
    for (const voicing of hands(WIDE)) {
      expect(new Set(voicing.left).size, `${voicing.symbol} tay trái`).toBe(voicing.left.length)
      expect(new Set(voicing.right).size, `${voicing.symbol} tay phải`).toBe(voicing.right.length)
    }
  })

  /*
    Gấp quãng tám giữ **chất hợp âm**, chỉ đổi thế. Nốt nào cũng phải còn là một
    nốt của hợp âm ấy — nếu gấp làm rơi mất một bậc thì hợp âm đã thành hợp âm
    khác, và đó là lỗi chứ không phải một thế bấm hẹp hơn.
  */
  it('không đẻ ra lớp cao độ lạ', () => {
    const chords = parseChordInput(WIDE).chords
    hands(WIDE).forEach((voicing, index) => {
      const chord = chords[index]!
      const allowed = new Set(
        chord.quality.intervals.map((step) => (((chord.root + step) % 12) + 12) % 12),
      )
      for (const note of [...voicing.left, ...voicing.right]) {
        expect(allowed.has(((note % 12) + 12) % 12), `${voicing.symbol} có nốt lạ`).toBe(true)
      }
    })
  })
})
