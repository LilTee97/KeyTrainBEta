import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'

/*
  Thế rải tay trái 1-5-8-10-8-5 của Slow Rock mẫu 1 (thầy Đức Thịnh).

  Ba luật của engine chặn nhau nối tiếp ở thế này, nên mỗi luật một cái bẫy:

  1. `degreeTone` neo bậc vào **nốt đáy thế bấm**. Dẫn giọng hay đặt thế bấm cao
     hơn chỗ câu rải mở, nên bậc năm bị đẩy lên thành quãng mười hai.
  2. Nốt gốc có dấu quãng tám rơi xuống luật "quãng tám gần nốt vừa chơi" viết
     cho tay phải, nên `+12` cộng lên trên một quãng tám đã bị nắn — bậc 8 ra
     cao hơn hai quãng tám.
  3. `clampToHandRegister` kẹp tay trái dưới Son quãng tám 3. Bậc mười của Fa
     quãng tám 2 là La quãng tám 3, trên trần ấy, nên bị gấp xuống một quãng tám
     và câu rải đang đi lên thì sụp.

  Cả ba đều ra một câu rải nghe "gần đúng" — vẫn đúng hợp âm, chỉ sai tầng. Nên
  test đo **khoảng cách tới nốt gốc**, không đo cao độ tuyệt đối.
*/

const SHAPE = [0, 7, 12, 16, 12, 7]
const SHAPE_MINOR = [0, 7, 12, 15, 12, 7]

function leftLine(symbol: string): number[] {
  const style = getStyle('slow-rock-duc-thinh-1')!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const events = renderPattern(
    voiceLeadTwoHands(parseChordInput(symbol).chords),
    style,
    { beatsPerChord: bar, beatsEach: [bar] },
  )
  return events
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => event.notes[0]!)
}

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

describe('câu rải tay trái 1-5-8-10-8-5', () => {
  it('đúng thế ở mọi giọng trưởng', () => {
    for (const key of KEYS) {
      const line = leftLine(key)
      expect(line, key).toHaveLength(6)
      expect(line.map((note) => note - line[0]!), key).toEqual(SHAPE)
    }
  })

  it('hợp âm thứ chỉ khác ở bậc mười', () => {
    for (const key of KEYS) {
      const line = leftLine(`${key}m`)
      expect(line.map((note) => note - line[0]!), key).toEqual(SHAPE_MINOR)
    }
  })

  /*
    Trần nới là nới cho ĐIỆU NÀY, không phải luật mới của app. Điệu khác — kể cả
    điệu bè trầm có dấu quãng tám như Pop 1 của OneMotion — vẫn giữ trần chung.
  */
  it('không nới trần tay trái cho điệu khác', () => {
    for (const key of KEYS) {
      const bass = renderPattern(
        voiceLeadTwoHands(parseChordInput(key).chords),
        getStyle('pop-1')!,
        { beatsPerChord: 4, beatsEach: [4] },
      ).filter((event) => event.hand === 'left')
      for (const event of bass) {
        expect(Math.max(...event.notes), `pop-1 ${key}`).toBeLessThanOrEqual(55)
      }
    }
  })

  it('nốt nào cũng nằm trong tầm tay trái của điệu', () => {
    for (const key of [...KEYS, ...KEYS.map((k) => `${k}m`), 'G7', 'F#m7b5']) {
      for (const note of leftLine(key)) {
        expect(note, key).toBeGreaterThanOrEqual(36)
        expect(note, key).toBeLessThanOrEqual(64)
      }
    }
  })
})
