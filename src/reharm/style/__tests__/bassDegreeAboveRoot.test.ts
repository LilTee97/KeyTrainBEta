import { describe, expect, it } from 'vitest'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import type { StylePattern } from '../types'

/*
  Bè trầm đi LÊN từ nốt gốc.

  `degreeTone` vốn đặt mọi nốt vào quãng tám **gần nốt vừa chơi nhất** — luật ấy
  viết cho câu rải tay phải, nơi cái cần là hai nốt liền nhau đừng nhảy cóc. Áp
  cho bè trầm thì hỏng hoà âm: từ La quãng tám 2, bậc năm Mi có hai chỗ đứng, và
  luật gần nhất chọn Mi **trầm hơn** — tức bậc năm nằm dưới nốt gốc, tai nghe ra
  hợp âm đã đảo chứ không nghe ra bè trầm của hợp âm cũ.

  Thế 1-5 của đệm hát đi lên. Đã đối chiếu tai với video Slow Rock bài 9 của
  thầy Đức Thịnh (nguồn `duc-thinh-bai-09-slow-rock` bên PianoBrain).
*/

/** Ô nhịp tối giản: gốc ở phách 1, một bậc bất kỳ ở phách 4, chỉ tay trái. */
function twoBassNotes(toneIndex: number): StylePattern {
  return {
    id: 'test-bass-degree',
    name: 'test',
    family: 'test',
    familyName: 'test',
    variant: 1,
    timeSignature: '6/8',
    beatsPerMeasure: 6,
    bpm: 75,
    feel: 'swing',
    verified: true,
    cell: {
      lengthBeats: 6,
      left: [
        {
          beat: 0,
          durationBeats: 3,
          voice: 'bottom',
          tones: [{ toneIndex: 0, fromRoot: true }],
        },
        {
          beat: 3,
          durationBeats: 3,
          voice: 'bottom',
          tones: [{ toneIndex, fromRoot: true }],
        },
      ],
      right: [],
    },
  }
}

function bassLine(voicing: TwoHandVoicing, toneIndex: number): number[] {
  return renderPattern([voicing], twoBassNotes(toneIndex), {
    beatsPerChord: 6,
    beatsEach: [6],
  })
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => event.notes[0])
}

describe('bè trầm đi lên từ nốt gốc', () => {
  it('bậc năm nằm TRÊN nốt gốc, không phải dưới', () => {
    // Dm: gốc Re quãng 8 thứ 2, bậc năm La phải cao hơn.
    const dm: TwoHandVoicing = { left: [38], right: [57, 62, 65], symbol: 'Dm' }
    const [root, fifth] = bassLine(dm, 2)
    expect(fifth).toBeGreaterThan(root)
    expect(fifth - root).toBe(7)
  })

  it('bậc ba cũng nằm trên nốt gốc', () => {
    const am: TwoHandVoicing = { left: [45], right: [60, 64, 69], symbol: 'Am' }
    const [root, third] = bassLine(am, 1)
    expect(third).toBeGreaterThan(root)
    expect(third - root).toBe(3)
  })

  it('bậc năm của Am lên quãng năm khi tay phải đủ cao', () => {
    const am: TwoHandVoicing = { left: [45], right: [60, 64, 69], symbol: 'Am' }
    const [root, fifth] = bassLine(am, 2)
    expect(fifth - root).toBe(7)
  })

  /*
    Giới hạn còn lại, ghi ra để ai đọc test biết nó là **luật khác**, không phải
    lỗi ở đây: `settleHands` giữ khoảng cách tối thiểu 7 nửa cung giữa nốt cao
    nhất tay trái và nốt thấp nhất tay phải. Thế bấm Am mà tay phải bắt đầu ở La
    quãng 8 thứ 3 thì bậc năm Mi quãng 8 thứ 3 chỉ cách 5 nửa cung, nên tay trái
    bị đẩy xuống một quãng tám. Muốn thế 1-5 mở rộng ở đây thì phải nâng thế bấm
    tay phải, không phải sửa `degreeTone`.
  */
  it('tay phải quá thấp thì hai tay bị tách ra, bậc năm tụt xuống', () => {
    const am: TwoHandVoicing = { left: [45], right: [57, 60, 64], symbol: 'Am' }
    const [root, fifth] = bassLine(am, 2)
    expect(fifth).toBeLessThan(root)
  })
})
