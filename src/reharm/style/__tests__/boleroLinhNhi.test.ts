import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { getStyle } from '../styleLibrary'

/*
  BOLERO / RUMBA TRỮ TÌNH — đặc tả người dùng đưa vào, đọc từ video
  *Đừng Xa Em Đêm Nay — Linh Nhi Piano Solo*.

  Phiên khúc  phách 1 bass gốc (đen) · phách 2 bậc 5 -> bậc 8 (hai móc đơn)
              phách 3 bậc 10 (đen) · phách 4 bậc 9 hoặc 5 (móc đơn dẫn)
  Cao trào    phách 1, 3 dậm quãng tám bass
              phách 2, 4 rải móc đơn liên tục, Forte

  Test đo BẬC THẬT SỰ KÊU LÊN, không đọc lại bảng ô nhịp — đọc lại bảng thì chỉ
  chứng minh mình chép đúng chính mình. Bản engine mà người dùng dán vào hỏng
  đúng ở tầng này: nó viết cứng tên nốt A / F / E, tức bậc 5, 10, 9 của riêng
  hợp âm Rê thứ, nên mọi hợp âm khác đều ra sai nốt.
*/

const bassOf = (styleId: string, chordText: string) => {
  const style = getStyle(styleId)!
  const chords = parseChordInput(chordText).chords
  const events = renderPattern(voiceLeadTwoHands(chords, {}), style)
  const root = ((chords[0]!.root % 12) + 12) % 12

  return events
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => ({
      beat: event.startBeat,
      /** Khoảng cách tới nốt gốc, tính bằng nửa cung — đây mới là BẬC. */
      degrees: event.notes
        .map((note) => (((note % 12) + 12) % 12 - root + 12) % 12)
        .sort((a, b) => a - b),
      voices: event.notes.length,
    }))
}

/** Nốt tay trái theo thứ tự phách, mỗi cú gõ một cao độ. */
const pitches = (styleId: string, chordText: string) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chordText).chords, {}), getStyle(styleId)!)
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => Math.min(...event.notes))

describe('bolero trữ tình — phiên khúc', () => {
  it('rải đúng bậc 1 - 5 - 8 - 10 - 12 trên hợp âm ba nốt', () => {
    for (const chord of ['Dm', 'Gm', 'F']) {
      const hits = bassOf('bolero-linh-nhi', chord)
      expect(hits.map((hit) => hit.beat), chord).toEqual([0, 1, 1.5, 2, 3])

      const [root, fifth, octave, tenth, twelfth] = hits
      expect(root!.degrees, `${chord} phách 1`).toEqual([0])
      expect(fifth!.degrees, `${chord} phách 2`).toEqual([7])
      expect(octave!.degrees, `${chord} phách 2,5`).toEqual([0])
      // Bậc 10 là bậc ba nâng một quãng tám: trưởng 4 nửa cung, thứ 3.
      expect([3, 4], `${chord} phách 3`).toContain(tenth!.degrees[0])
      expect(twelfth!.degrees, `${chord} phách 4`).toEqual([7])
    }
  })

  it('đường rải ĐI LÊN suốt ô nhịp, không quẩn tại chỗ', () => {
    for (const chord of ['Dm', 'Gm', 'F']) {
      const left = pitches('bolero-linh-nhi', chord)
      for (let at = 1; at < left.length; at += 1) {
        expect(left[at], `${chord} phách ${at}`).toBeGreaterThan(left[at - 1]!)
      }
    }
  })

  /*
    HAI CHỖ HỎNG CÓ SẴN TRONG `patternRenderer`, không do điệu này đẻ ra. Ghi
    thành test để chúng nhìn thấy được, và để ngày sửa thì test đỏ có chủ ý chứ
    không im lặng đổi nghĩa.

    Cả hai đụng `degreeTone`, và cả hai cũng dính điệu `slow-rock-duc-thinh-1` —
    điệu đang dùng chung thế 1-5-8-10.

    (a) HỢP ÂM BẢY. Trên A7, bậc 5 ở phách 2 ra Mi quãng tám 2 = 40, nằm DƯỚI
        nốt gốc La quãng tám 2 = 45. Đúng cái mà chú thích dài trong `degreeTone`
        nói là phải chặn — "bậc năm nằm dưới nốt gốc, tai nghe ra hợp âm đã đảo".
        Vòng chọn quãng tám ở đó bỏ qua mọi ứng viên <= nốt gốc, nên đáng lẽ phải
        ra 52. Ba hợp âm ba nốt đi qua đúng; chỉ hợp âm bốn nốt lọt.

    (b) TRẦN 64. Trên Si giáng, bậc 5 nâng quãng tám cần 65 — vượt `leftHandTop`
        một nửa cung — nên nó gấp xuống 53, thành ra phách 4 lặp đúng nốt phách
        2. Đặc tả cho phép "bậc 9 HOẶC bậc 5" nên nốt không sai hoà âm, nhưng
        đường đi lên thì gãy. Nới trần lên 67 là chạm tầm tay phải, nên chỗ này
        cần một cách khác chứ không phải một con số khác.
  */
  it('CHƯA SỬA: hợp âm bảy cho bậc 5 rơi dưới nốt gốc', () => {
    const [root, fifth] = pitches('bolero-linh-nhi', 'A7')
    expect(fifth).toBeLessThan(root!) // lẽ ra phải lớn hơn
    expect(root).toBe(45)
    expect(fifth).toBe(40)
  })

  it('CHƯA SỬA: hợp âm gốc cao đụng trần thì phách 4 gấp xuống', () => {
    const left = pitches('bolero-linh-nhi', 'Bb')
    expect(left[4]).toBe(left[1]) // phách 4 lặp đúng nốt phách 2
    expect(left[4]).toBeLessThan(left[3]!)
  })

  /*
    Bản độc tấu: tay phải giữ giai điệu suốt bài nên ô nhịp không có phần tay
    phải. Đặc tả ghi thẳng — "tuyệt đối không dậm chát chát liên tục làm đục dải
    tần". Đây là chỗ khác hẳn `bolero-1` của Tuấn Lưu, điệu dập bảy điểm Pùng-Pắp.
  */
  it('không dập hợp âm tay phải', () => {
    expect(getStyle('bolero-linh-nhi')!.cell!.right).toHaveLength(0)
    expect(getStyle('bolero-1')!.cell!.right!.length).toBeGreaterThan(0)
  })

  it('đứng cạnh bolero-1 chứ không thay nó', () => {
    expect(getStyle('bolero-1')?.id).toBe('bolero-1')
    expect(getStyle('bolero')?.id).toBe('bolero-1')
  })
})

describe('bolero trữ tình — cao trào', () => {
  /*
    Sự kiện ở phách mạnh mang BA nốt chứ không phải hai: ngoài quãng tám còn một
    nốt đang ngân từ trước, do `holdUntilStruckAgain` gộp vào. Thứ phải kiểm là
    quãng tám CÓ MẶT, không phải sự kiện chỉ có đúng hai nốt.
  */
  it('dậm quãng tám ở phách 1 và 3', () => {
    const style = getStyle('bolero-linh-nhi-chorus')!
    const events = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      style,
    ).filter((event) => event.hand === 'left')

    for (const beat of [0, 2]) {
      const hit = events.find((event) => event.startBeat === beat)!
      const octave = hit.notes.some((low) => hit.notes.includes((low + 12) as never))
      expect(octave, `phách ${beat + 1} thiếu quãng tám`).toBe(true)
    }
  })

  it('phách 2 và 4 rải móc đơn, không để trống', () => {
    const beats = bassOf('bolero-linh-nhi-chorus', 'Dm').map((hit) => hit.beat)
    expect(beats).toEqual([0, 1, 1.5, 2, 3, 3.5])
  })

  it('nện mạnh hơn phiên khúc', () => {
    const heavy = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      getStyle('bolero-linh-nhi-chorus')!,
    ).filter((event) => event.hand === 'left')
    const light = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      getStyle('bolero-linh-nhi')!,
    ).filter((event) => event.hand === 'left')

    const loudest = (events: typeof heavy) => Math.max(...events.map((one) => one.velocity))
    expect(loudest(heavy)).toBeGreaterThanOrEqual(loudest(light))
    expect(heavy.length).toBeGreaterThan(light.length)
  })

  /*
    Đặc tả gộp điệp khúc và giang tấu làm một kết cấu. Đây là chỗ sửa lại cách
    hiểu cũ: người dùng bác lối "tay trái gánh trọn mẫu đệm ở đoạn solo", tôi đọc
    thành "tay trái phải mỏng đi". Đọc kỹ thì cái sai là chơi NGUYÊN mẫu đoạn
    hát — còn giang tấu có kết cấu riêng, và kết cấu ấy NẶNG hơn.
  */
  it('giang tấu dùng bản cao trào, phiên khúc thì không', () => {
    expect(resolveStyleForSection('bolero-linh-nhi', 'interlude')).toBe(
      'bolero-linh-nhi-chorus',
    )
    expect(resolveStyleForSection('bolero-linh-nhi', 'verse')).toBe('bolero-linh-nhi')
  })
})
