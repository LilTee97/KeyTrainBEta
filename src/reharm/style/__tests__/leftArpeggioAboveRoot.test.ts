import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { ALL_STYLES } from '../styleLibrary'

/*
  CÂU RẢI TAY TRÁI KHÔNG ĐƯỢC TỤT XUỐNG DƯỚI NỐT GỐC.

  Thế 1-5-8-10 của đệm hát đi LÊN. Bậc năm nằm dưới nốt gốc thì tai nghe ra hợp
  âm đã đảo — như đổi sang hợp âm khác — chứ không nghe ra bè trầm của hợp âm
  đang vang. `degreeTone` có hẳn một chú thích dài về chuyện này và có vòng lặp
  chặn nó.

  Vòng chặn ấy đúng. Chỗ hỏng nằm SAU nó: `settleHands` hạ tay trái một quãng
  tám để giữ khoảng cách với tay phải, và nó không biết bậc nào là bậc nào — nó
  chỉ thấy hai con số gần nhau. Lỗi lộ ra ở hợp âm BẢY giọng CAO, nơi thế bấm
  tay phải nằm thấp:

    bolero trữ tình  A7   bậc 5 ra 40, nốt gốc 45
    slow rock 1 & 3  Lab7 La7 Sib7 Si7 — cùng một cơ chế

  Bốn trên mười chín giọng, chỉ ở hợp âm bảy. Đủ hiếm để lọt qua mọi lượt nghe
  thử, đủ sai để hỏng hoà âm khi nó xảy ra. Nên canh bằng test, và canh trên
  MỌI điệu chứ không riêng điệu vừa sửa — điệu mới thêm sau này được canh sẵn.
*/

/** Điệu nào có câu rải tay trái đặt bậc theo nốt gốc. */
const ARPEGGIO_STYLES = ALL_STYLES.filter((style) =>
  style.cell?.left.some((hit) => hit.tones?.some((tone) => tone.fromRoot)),
)

const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

describe('câu rải tay trái nằm trên nốt gốc', () => {
  it('có điệu để kiểm', () => {
    expect(ARPEGGIO_STYLES.length).toBeGreaterThan(0)
  })

  it.each(ARPEGGIO_STYLES.map((style) => style.id))('%s', (styleId) => {
    const style = ALL_STYLES.find((one) => one.id === styleId)!

    for (const root of ROOTS) {
      for (const quality of ['', 'm', '7']) {
        const chords = parseChordInput(root + quality).chords
        const left = renderPattern(voiceLeadTwoHands(chords, {}), style)
          .filter((event) => event.hand === 'left')
          .sort((a, b) => a.startBeat - b.startBeat)
        if (left.length < 2) continue

        const bass = Math.min(...left[0]!.notes)
        for (const event of left.slice(1)) {
          expect(
            Math.min(...event.notes),
            `${styleId} ${root}${quality} phách ${event.startBeat}`,
          ).toBeGreaterThanOrEqual(bass)
        }
      }
    }
  })
})
