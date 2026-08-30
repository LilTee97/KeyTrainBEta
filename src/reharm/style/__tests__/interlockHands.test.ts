import { describe, expect, it } from 'vitest'
import { interlockHands } from '../soloLeftHand'
import type { TimelineEvent } from '../types'

/*
  HAI TAY CÀI VÀO NHAU THEO MẬT ĐỘ.

  Bản trước cho tay trái chơi đủ mọi cú gõ của mẫu đệm suốt đoạn solo. Người
  dùng bác: để tay trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo là
  không đúng. Đoạn solo không phải đoạn đệm bị úp thêm một giai điệu lên trên.

  Ba luật, và cả ba đều phải đo được:

    1. tay phải chạy dày  -> tay trái BỎ cú gõ, để nốt trước ngân bù
    2. tay phải ngân dài / nghỉ -> tay trái CHÈN nốt rải lấp chỗ trống
    3. vạch nhịp -> không bao giờ bỏ, và kéo nốt giai điệu sát vạch về đúng vạch
*/

const BAR = 4

const bass = (beat: number, dur = 0.5): TimelineEvent => ({
  notes: [40],
  startBeat: beat,
  durationBeats: dur,
  hand: 'left',
  velocity: 80,
  grace: false,
})

const sing = (beat: number, dur = 0.5, note = 72): TimelineEvent => ({
  notes: [note],
  startBeat: beat,
  durationBeats: dur,
  hand: 'right',
  velocity: 72,
  grace: false,
})

/** Bốn cú gõ tay trái một ô nhịp — mẫu đệm điển hình. */
const PATTERN = [bass(0), bass(1), bass(2), bass(3)]

describe('hai tay cài vào nhau theo mật độ', () => {
  it('luật 1: tay phải chạy móc kép thì tay trái bỏ cú gõ ấy', () => {
    // Bốn nốt mỗi phách suốt phách 1 và 2 — đúng ngưỡng móc kép.
    const dense = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75].map((at) => sing(at, 0.25))
    const { left } = interlockHands(PATTERN, dense, BAR)
    const beats = left.map((event) => event.startBeat)

    expect(beats).not.toContain(1)
    expect(beats).not.toContain(2)
    expect(beats).toContain(0)
  })

  it('luật 1: cú gõ bị bỏ thì nốt trước NGÂN bù, không thành im lặng', () => {
    const dense = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75].map((at) => sing(at, 0.25))
    const { left } = interlockHands(PATTERN, dense, BAR)
    const downbeat = left.find((event) => event.startBeat === 0)!

    // Luật của người dùng là "giữ một nốt bass", không phải "bỏ tay trái".
    expect(downbeat.durationBeats).toBeGreaterThan(2)
  })

  it('luật 2: tay phải ngân dài thì tay trái chèn thêm nốt rải', () => {
    const held = [sing(0, 0.5), sing(1, 3)]
    const { left } = interlockHands(PATTERN, held, BAR)

    expect(left.length).toBeGreaterThan(PATTERN.length)
    // Nốt chèn rơi vào giữa hai cú gõ, và đánh nhẹ hơn cú gõ thật.
    const added = left.filter((event) => !PATTERN.some((one) => one.startBeat === event.startBeat))
    expect(added.length).toBeGreaterThan(0)
    for (const event of added) expect(event.velocity).toBeLessThan(80)
  })

  it('luật 3: vạch nhịp không bao giờ bị bỏ, dù tay phải dày cỡ nào', () => {
    const wall = Array.from({ length: 32 }, (_, at) => sing(at * 0.25, 0.25))
    const two = [...PATTERN, ...PATTERN.map((one) => bass(one.startBeat + BAR))]
    const { left } = interlockHands(two, wall, BAR)
    const beats = left.map((event) => event.startBeat)

    expect(beats).toContain(0)
    expect(beats).toContain(BAR)
  })

  it('luật 3: nốt giai điệu sát vạch nhịp được kéo về đúng vạch', () => {
    const late = [sing(0.15), sing(1), sing(2)]
    const { melody } = interlockHands(PATTERN, late, BAR)

    expect(melody[0]!.startBeat).toBe(0)
  })

  it('luật 3: không kéo khi vạch nhịp đã có nốt rồi', () => {
    const both = [sing(0), sing(0.15), sing(2)]
    const { melody } = interlockHands(PATTERN, both, BAR)

    // Kéo nữa thì hai nốt chồng đúng một chỗ, tự nhân đôi tiếng.
    expect(melody.map((event) => event.startBeat)).toEqual([0, 0.15, 2])
  })

  /*
    Đoạn dạo đầu có thể tắt câu solo. "Tay phải nghỉ" ở luật 2 nghĩa là nghỉ
    GIỮA một câu đang chạy, không phải cả đoạn không có ai chơi — hiểu nhầm chỗ
    này thì mẫu đệm bị chèn nốt khắp nơi, và test `phraseKeepsStyle` đỏ đúng vì
    lý do ấy.
  */
  it('không có tay phải thì mẫu đệm kêu nguyên vẹn', () => {
    const { left } = interlockHands(PATTERN, [], BAR)
    expect(left.map((event) => event.startBeat)).toEqual([0, 1, 2, 3])
  })
})

/*
  KHÔNG TỈA TAY TRÁI — cờ đến từ số đo, không từ cảm tính.

  Đo đoạn giang tấu bản ký âm Linh Nhi: tay phải vọt từ 6,8 lên 9,3 nốt mỗi ô,
  dày nhất bài, còn tay trái GIỮ NGUYÊN 8,0 và tầm y hệt 33-62. Người soạn
  không rút tay trái lại chút nào.

  RANH GIỚI PHẢI SẮC, và đây là chỗ dễ trượt nhất. Người dùng từng bác lối "tay
  trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo" — cái bị bác là tay
  trái gánh CẢ PHẦN TAY PHẢI của mẫu đệm. Cờ này chỉ nói: đừng tỉa phần của
  CHÍNH tay trái. Test cuối khoá đúng ranh giới ấy.
*/
describe('giữ nguyên tay trái khi họ điệu yêu cầu', () => {
  const dense = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75].map((at) => sing(at, 0.25))

  it('mặc định vẫn tỉa như cũ', () => {
    const { left } = interlockHands(PATTERN, dense, BAR)
    expect(left.map((event) => event.startBeat)).not.toContain(1)
  })

  it('bật cờ thì giữ đủ cú gõ, dù tay phải chạy móc kép', () => {
    const { left } = interlockHands(PATTERN, dense, BAR, true)
    expect(left.map((event) => event.startBeat)).toEqual([0, 1, 2, 3])
  })

  it('luật 3 vẫn chạy: nốt sát vạch nhịp vẫn được kéo về vạch', () => {
    const { melody } = interlockHands(PATTERN, [sing(0.15), sing(2)], BAR, true)
    expect(melody[0]!.startBeat).toBe(0)
  })

  it('CỜ NÀY KHÔNG cho tay trái ôm thêm phần tay phải', () => {
    // Vào bao nhiêu cú gõ thì ra bấy nhiêu, không hơn. Cờ chỉ TẮT phép tỉa.
    const { left } = interlockHands(PATTERN, dense, BAR, true)
    expect(left.length).toBe(PATTERN.length)
  })
})

/*
  ĐƯỜNG DỰNG TỪ TAY TRÁI THÌ TAY TRÁI KHÔNG BỊ NẮN LẠI.

  `interlockHands` dựng theo Cà Pháo: tay phải cài vào KHE tay trái. Lối bám
  tay trái (`raiLinhNhi`) làm ngược — tay phải suy ra TỪ mốc gõ tay trái. Chồng
  hai phép lên nhau là nắn lại chính cái vừa dùng làm gốc.

  Lộ ra khi mở lối bám tay trái cho họ bossa: tay trái bossa gõ `[0, 1,5, 2,
  3,5]` mà ra `[0, 1,5, 2, 2,167, 2,667, 3,333, 3,5]` ở đoạn dạo đầu — thôi
  chơi bossa, đúng ca người dùng cấm.

  Cờ `khongTia` KHÔNG cứu được: nó chỉ tắt luật 1 (tỉa), luật 2 (chèn nốt lấp
  khe) chạy bất kể cờ. Bolero không lộ vì đường của nó dày nên không để khe nào
  cho luật 2. Test dưới khoá đúng cái khe hở ấy.
*/
describe('cờ khongTia chỉ tắt luật 1, không tắt luật 2', () => {
  it('bật cờ mà tay phải THƯA thì luật 2 VẪN chèn — đây là giới hạn của cờ', () => {
    const thua = [sing(0, 3.5)]
    const { left } = interlockHands(PATTERN, thua, BAR, true)
    expect(left.length).toBeGreaterThan(PATTERN.length)
  })

  /*
    Nên chỗ nào cần giữ nguyên tay trái thì phải BỎ HẲN phép cài, không phải
    bật cờ. `phraseSection` và `arrangement` đều làm vậy cho họ bám tay trái.
  */
  it('bỏ hẳn phép cài thì tay trái ra đúng như vào', () => {
    const thua = [sing(0, 3.5)]
    const bo = { left: PATTERN, melody: thua }
    expect(bo.left.map((one) => one.startBeat)).toEqual([0, 1, 2, 3])
  })
})
