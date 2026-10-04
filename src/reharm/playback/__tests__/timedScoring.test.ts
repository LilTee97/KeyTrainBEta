import { describe, expect, it } from 'vitest'
import type { TimelineEvent } from '../../style/types'
import {
  chamHopAm,
  chamLay,
  chamLuc,
  chamNhacPhim,
  expectedNotesOf,
  gopLopCaoDo,
  hopAmTheoPhach,
  latencyFromTaps,
  passes,
  scoreTimed,
  type ExpectedNote,
  type PlayedNote,
} from '../timedScoring'

/** 120 BPM: 500 ms mỗi phách. */
const MS = 500
const opts = { msPerBeat: MS, latencyMs: 0 }

const want = (note: number, beat: number): ExpectedNote => ({ note, beat, hand: 'left' })
const got = (note: number, beat: number): PlayedNote => ({ note, beat, velocity: 80 })

describe('expectedNotesOf', () => {
  const events: TimelineEvent[] = [
    { notes: [48, 55], startBeat: 1, durationBeats: 1, hand: 'left', velocity: 80 },
    { notes: [64], startBeat: 0, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [63], startBeat: 0.9, durationBeats: 0.1, hand: 'right', velocity: 60, grace: true },
  ]

  it('lọc theo tay, bỏ nốt láy, xếp theo thời gian', () => {
    expect(expectedNotesOf(events, 'right').map((n) => n.note)).toEqual([64])
    expect(expectedNotesOf(events, 'left').map((n) => n.note)).toEqual([48, 55])
    expect(expectedNotesOf(events, 'both').map((n) => n.note)).toEqual([64, 48, 55])
  })
})

describe('scoreTimed', () => {
  const line = [want(48, 0), want(52, 1), want(55, 2), want(60, 3)]

  it('đánh khít nhịp: trúng hết, lệch 0', () => {
    const score = scoreTimed(line, line.map((n) => got(n.note, n.beat)), opts)
    expect(score).toMatchObject({ total: 4, hit: 4, medianMs: 0, medianAbsMs: 0 })
    expect(score.extra).toEqual([])
    expect(passes(score)).toBe(true)
  })

  it('trừ độ trễ đã đo trước khi chấm', () => {
    // Trễ 120 ms đều mọi tiếng = đánh khít nhịp.
    const late = line.map((n) => got(n.note, n.beat + 120 / MS))
    const score = scoreTimed(line, late, { msPerBeat: MS, latencyMs: 120 })
    expect(score.hit).toBe(4)
    expect(score.medianAbsMs).toBe(0)
  })

  it('lệch có dấu: âm là sớm, dương là muộn', () => {
    const score = scoreTimed(line, [
      got(48, -0.06), got(52, 1 - 0.06), got(55, 2 - 0.06), got(60, 3 + 0.02),
    ], opts)
    expect(score.medianMs).toBe(-30)
    expect(score.medianAbsMs).toBe(30)
  })

  it('sai phím: nốt ấy trượt, phím ấy thừa', () => {
    const score = scoreTimed(line, [got(48, 0), got(53, 1), got(55, 2), got(60, 3)], opts)
    expect(score.hit).toBe(3)
    expect(score.missed.map((n) => n.note)).toEqual([52])
    expect(score.extra.map((n) => n.note)).toEqual([53])
    expect(passes(score)).toBe(false)
  })

  it('lệch quá cửa sổ thì không tính là đánh nốt ấy', () => {
    // C3 bấm muộn 200 ms (> 150 ms): nốt ấy trượt, phím ấy thừa; ba nốt sau vẫn trúng.
    const score = scoreTimed(line, [got(48, 0.4), got(52, 1), got(55, 2), got(60, 3)], opts)
    expect(score.hit).toBe(3)
    expect(score.missed.map((n) => n.note)).toEqual([48])
    expect(score.extra.map((n) => n.note)).toEqual([48])
  })

  it('hai nốt cùng phím đứng sát nhau: mỗi nốt lấy đúng phím bấm gần nó', () => {
    // Móc kép lặp C3 ở phách 0 và 0.25 (125 ms). Phím thứ nhất bấm muộn 50 ms.
    const score = scoreTimed(
      [want(48, 0), want(48, 0.25)],
      [got(48, 0.1), got(48, 0.25)],
      opts,
    )
    expect(score.hit).toBe(2)
    expect(score.errorsMs).toEqual([50, 0])
  })

  it('dạo phím trước khi bài vào thì không tính thừa', () => {
    const score = scoreTimed(line, [got(70, -3), ...line.map((n) => got(n.note, n.beat))], opts)
    expect(score.extra).toEqual([])
  })

  it('bỏ qua quãng tám khi được bật', () => {
    const score = scoreTimed([want(48, 0)], [got(60, 0)], { ...opts, ignoreOctave: true })
    expect(score.hit).toBe(1)
  })

  it('cú vượt tầm một bàn tay (quãng 10 C2+E3) chấm bỏ quãng tám riêng nó; nốt khác vẫn đúng phím', () => {
    const events: TimelineEvent[] = [
      { notes: [36, 52], startBeat: 0, durationBeats: 0.25, hand: 'left', velocity: 80 },
      { notes: [43], startBeat: 1, durationBeats: 1, hand: 'left', velocity: 80 },
    ]
    const expected = expectedNotesOf(events, 'left')
    expect(expected.map((n) => n.tuDoQuangTam ?? false)).toEqual([true, true, false])
    const score = scoreTimed(expected, [got(48, 0), got(52, 0), got(55, 1)], opts)
    expect(score.hit).toBe(2)
    expect(score.extra.map((n) => n.note)).toEqual([55])
  })

  it('đánh trượt quá một phần mười thì chưa đạt dù đều tay', () => {
    const score = scoreTimed(line, line.slice(0, 3).map((n) => got(n.note, n.beat)), opts)
    expect(score.hit).toBe(3)
    expect(passes(score)).toBe(false)
  })
})

describe('bậc 7 — chấm theo hợp âm (b)', () => {
  const am = () => ({ lop: new Set([9, 0, 4]), bass: 9 })

  it('gộp nốt cùng tên trong một lúc: khuôn A2+A3 (+A4 tay phải) chỉ cần một La', () => {
    const notes: ExpectedNote[] = [want(45, 0), want(57, 0), { note: 69, beat: 0, hand: 'right' }, want(52, 1)]
    expect(gopLopCaoDo(notes).map((n) => n.note)).toEqual([45, 52])
  })

  it('đọc hợp âm theo phách sau ô đếm vào, lặp theo vòng; gạch chéo thì bass là nốt sau gạch', () => {
    const at = hopAmTheoPhach(['Am7', 'Am7', 'Dm/F', 'Dm/F'], 4)
    expect(at(3)).toBeNull() // đang đếm vào
    expect(at(4.2)!.bass).toBe(9)
    expect([...at(4.2)!.lop].sort((a, b) => a - b)).toEqual([0, 4, 7, 9])
    expect(at(6.5)!.bass).toBe(5)
    expect(at(8)!.bass).toBe(9)
  })

  it('bass: nốt thấp nhất quanh tiếng bass phải cùng tên bass; nốt đi bass (bậc 5) không kiểm', () => {
    const events: TimelineEvent[] = [
      { notes: [45], startBeat: 0, durationBeats: 1, hand: 'left', velocity: 80 }, // A2 — bass của Am
      { notes: [52], startBeat: 1, durationBeats: 1, hand: 'left', velocity: 80 }, // E3 — bậc 5, không kiểm
    ]
    const dung = chamHopAm(events, [got(57, 0), got(64, 0), got(40, 1)], [], { ...opts, hopAmAt: am })
    expect([dung.bassTong, dung.bassDung]).toEqual([1, 1]) // A3 thấp nhất: thế bấm khác vẫn đúng bass
    const sai = chamHopAm(events, [got(64, 0), got(69, 0)], [], { ...opts, hopAmAt: am })
    expect([sai.bassTong, sai.bassDung]).toEqual([1, 0]) // thấp nhất E4 — La4 tay phải không tính là bass La
  })

  it('nốt sai: phím thừa ngoài hợp âm mới tính; thừa là nốt của hợp âm (bè khác) thì không', () => {
    expect(chamHopAm([], [], [got(60, 0.5), got(63, 0.5)], { ...opts, hopAmAt: am }).notSai).toBe(1)
  })
})

describe('latencyFromTaps', () => {
  const MS80 = 750

  it('lấy trung vị lệch so với tiếng click', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat + 150 / MS80)
    expect(latencyFromTaps(taps, MS80)).toMatchObject({ latencyMs: 150, spreadMs: 0, n: 8 })
  })

  it('gõ đón trước tiếng click ra số âm, không nhảy sang tiếng sau', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat - 30 / MS80)
    expect(latencyFromTaps(taps, MS80)?.latencyMs).toBe(-30)
  })

  it('trễ lớn (tai nghe không dây) vẫn tính đúng chiều', () => {
    const taps = [4, 5, 6, 7, 8, 9, 10, 11].map((beat) => beat + 400 / MS80)
    expect(latencyFromTaps(taps, MS80)?.latencyMs).toBe(400)
  })

  it('ít hơn tám lần gõ thì không tin', () => {
    expect(latencyFromTaps([4.2, 5.2, 6.2], MS80)).toBeNull()
  })
})

describe('chamNhacPhim — chấm lúc nhấc phím (đánh giật, 3/10/2026)', () => {
  // ♩ = 120: 500 ms mỗi phách. Nốt giật ghi móc đơn (½ phách = 250 ms) → phải nhấc trong 150 ms (60 %, sàn 150 ms).
  const events: TimelineEvent[] = [
    { notes: [60, 64], startBeat: 0, durationBeats: 0.25, hand: 'right', velocity: 80, giat: true, ghiBeats: 0.5 },
    { notes: [67], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [72], startBeat: 2, durationBeats: 0.25, hand: 'right', velocity: 80 },
  ]
  const expected = expectedNotesOf(events, 'right')
  const bam = (note: number, beat: number, offBeat?: number): PlayedNote => ({ note, beat, velocity: 80, offBeat })

  it('giật nhấc sớm thì đúng, giữ lâu thì sai; ngân giữ đủ thì đúng; nốt ngắn không dấu không chấm', () => {
    const nhac = chamNhacPhim(events, expected, [bam(60, 0, 0.2), bam(64, 0, 0.45), bam(67, 1, 1.8), bam(72, 2, 2.1)], opts)
    expect(nhac).toEqual({ giatTong: 2, giatDung: 1, nganTong: 1, nganDung: 1 })
  })

  it('ngân mà nhấc sớm là sai; chưa nhấc khi hết lượt: ngân đủ, giật sai', () => {
    expect(chamNhacPhim(events, expected, [bam(67, 1, 1.3)], opts)).toEqual({ giatTong: 0, giatDung: 0, nganTong: 1, nganDung: 0 })
    expect(chamNhacPhim(events, expected, [bam(60, 0), bam(67, 1)], opts)).toEqual({
      giatTong: 1,
      giatDung: 0,
      nganTong: 1,
      nganDung: 1,
    })
  })

  it('chỉ chấm nốt bấm trúng — phím sai không tính', () => {
    expect(chamNhacPhim(events, expected, [bam(61, 0, 0.1)], opts)).toEqual({ giatTong: 0, giatDung: 0, nganTong: 0, nganDung: 0 })
  })

  it('ghepCap không đổi cách chấm cũ: scoreTimed vẫn ra như trước', () => {
    const score = scoreTimed(expected, [bam(60, 0), bam(64, 0.1), bam(67, 1), bam(72, 2)], opts)
    expect([score.hit, score.errorsMs]).toEqual([4, [0, 50, 0, 0]])
  })
})

describe('chamLay — chấm nốt láy (GĐ 2 mục b, 3/10/2026)', () => {
  // ♩ = 120: 500 ms mỗi phách. Nốt láy B4 sát trước nốt chính D5 ở phách 1; láy đôi A5 → B5 → A5 ở phách 2.
  const events: TimelineEvent[] = [
    { notes: [71], startBeat: 0.9375, durationBeats: 0.0625, hand: 'right', velocity: 60, grace: true },
    { notes: [74], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [81], startBeat: 1.875, durationBeats: 0.0625, hand: 'right', velocity: 60, grace: true },
    { notes: [83], startBeat: 1.9375, durationBeats: 0.0625, hand: 'right', velocity: 60, grace: true },
    { notes: [81], startBeat: 2, durationBeats: 1, hand: 'right', velocity: 80 },
  ]
  const expected = expectedNotesOf(events, 'right')
  // Bản chép từ MIDI (không có nốt láy ghi riêng): láy chồng Mi♭ + Mi ở phách 3.
  const chong: TimelineEvent[] = [
    { notes: [74], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [63, 64], startBeat: 3, durationBeats: 0.5, hand: 'right', velocity: 80 },
  ]
  const expectedChong = expectedNotesOf(chong, 'right')
  const bam = (note: number, beat: number): PlayedNote => ({ note, beat, velocity: 80 })

  it('láy sát trước nốt chính thì đúng — kể cả láy cùng phím với nốt chính; láy chồng bấm đủ hai nốt', () => {
    const played = [bam(71, 0.95), bam(74, 1), bam(81, 1.88), bam(83, 1.94), bam(81, 2)]
    const lay = chamLay(events, expected, played, opts)
    expect([lay.layTong, lay.layDung]).toEqual([3, 3])
    expect(lay.phimLay.sort()).toEqual([0, 2, 3])
    // Phím láy bỏ ra thì không còn phím thừa.
    expect(scoreTimed(expected, played.filter((_, i) => !lay.phimLay.includes(i)), opts).extra).toEqual([])
    const layChong = chamLay(chong, expectedChong, [bam(74, 1), bam(63, 3), bam(64, 3)], opts)
    expect([layChong.layTong, layChong.layDung]).toEqual([1, 1])
  })

  it('láy sau nốt chính, láy xa quá 300 ms, thiếu một nốt láy chồng — đều sai', () => {
    // Bấm gần như cùng lúc (≤ 30 ms sau nốt chính) vẫn tính là láy — kiểu láy chồng; 60 ms sau là láy muộn.
    expect(chamLay(events, expected, [bam(74, 1), bam(71, 1.05)], opts).layDung).toBe(1)
    expect(chamLay(events, expected, [bam(74, 1), bam(71, 1.12)], opts).layDung).toBe(0)
    expect(chamLay(events, expected, [bam(71, 0.3), bam(74, 1)], opts).layDung).toBe(0)
    expect(chamLay(chong, expectedChong, [bam(74, 1), bam(63, 3)], opts).layDung).toBe(0)
  })

  it('bản đã ghi nốt láy riêng: cặp nửa cung trong hợp âm là thế bấm, không phải láy chồng', () => {
    // Đô–Mi–Fa–La (Mi–Fa cách nửa cung) như hợp âm tay phải Bossa Cà Pháo ô 57.
    const coHopAm: TimelineEvent[] = [...events, { notes: [60, 64, 65, 69], startBeat: 3, durationBeats: 0.5, hand: 'right', velocity: 80 }]
    expect(chamLay(coHopAm, expectedNotesOf(coHopAm, 'right'), [], opts).layTong).toBe(3)
  })

  it('chỉ chấm nốt láy của tay đang tập — láy tay trái không tính khi tập tay phải', () => {
    const haiTay: TimelineEvent[] = [
      ...events,
      { notes: [44], startBeat: 2.9375, durationBeats: 0.0625, hand: 'left', velocity: 60, grace: true },
      { notes: [45], startBeat: 3, durationBeats: 1, hand: 'left', velocity: 80 },
    ]
    const played = [bam(71, 0.95), bam(74, 1), bam(81, 1.88), bam(83, 1.94), bam(81, 2)]
    const phai = chamLay(haiTay, expectedNotesOf(haiTay, 'right'), played, opts)
    expect([phai.layTong, phai.layDung]).toEqual([3, 3])
    expect(chamLay(haiTay, expectedNotesOf(haiTay, 'both'), played, opts).layTong).toBe(4)
  })
})

describe('chamLuc — nhận xét lực nhấn (GĐ 0, chỉ nhận xét)', () => {
  const events: TimelineEvent[] = [
    { notes: [48], startBeat: 0, durationBeats: 1, hand: 'left', velocity: 110 },
    { notes: [64, 67], startBeat: 1, durationBeats: 1, hand: 'right', velocity: 80 },
    { notes: [48], startBeat: 2, durationBeats: 1, hand: 'left', velocity: 110 },
    { notes: [64, 67], startBeat: 3, durationBeats: 1, hand: 'right', velocity: 80 },
  ]
  const expected = expectedNotesOf(events, 'both')
  const bam = (note: number, beat: number, velocity: number): PlayedNote => ({ note, beat, velocity })

  it('so lực người tập bấm ở tiếng nhấn với tiếng thường, chỉ trên nốt bấm trúng', () => {
    const played = [bam(48, 0, 100), bam(64, 1, 70), bam(67, 1, 72), bam(48, 2, 96), bam(64, 3, 68), bam(67, 3, 70), bam(61, 3.5, 127)]
    expect(chamLuc(events, expected, played, opts)).toEqual({ nhanTB: 98, thuongTB: 70, chenh: 28, nhan: 2, thuong: 4 })
  })

  it('bài không có chênh lực, hay không bấm trúng tiếng nhấn nào, thì không nhận xét', () => {
    const phang = events.map((event) => ({ ...event, velocity: 90 }))
    expect(chamLuc(phang, expectedNotesOf(phang, 'both'), [bam(48, 0, 100)], opts)).toBeNull()
    expect(chamLuc(events, expected, [bam(64, 1, 70), bam(67, 1, 72)], opts)).toBeNull()
  })
})
