import { describe, expect, it } from 'vitest'
import { cueStrike } from '../phraseCue'
import { khungChayNgon } from '../raiLinhNhi'
import { cueChord } from '../phraseChords'
import { pullChordFor } from '../turnaround'
import { parseChordInput } from '../../input/chordInputParser'
import { normalizePitchClass } from '../../../shared/musicTheory/pitch'

/**
 * Hợp âm báo cuối dạo đầu có đúng **một** việc: đẩy ca sĩ vào.
 *
 * Nó phải mang đủ **quãng ba trưởng và quãng bảy thứ** tính từ nốt gốc của chính
 * nó. Cặp tam cung ấy mới là lực kéo; thiếu một trong hai thì hợp âm chỉ còn là
 * một mảng màu. Đo trên bậc năm là Sol:
 *
 *     G9sus4 = G C D F A     KHÔNG có B  -> mất nốt cảm, không hút
 *     Gadd9  = G B D A       KHÔNG có F  -> không có tam cung, không hút
 *     G7b9   = G B D F Ab    đủ cả hai, cộng sức căng
 *
 * Kiểm bằng **nốt**, không kiểm bằng tên hợp âm: đổi bảng màu thì tên đổi theo,
 * mà luật nhạc thì không đổi.
 */
const chord = (symbol: string) => parseChordInput(symbol).chords[0]!

const TRUONG = ['C', 'Cmaj7', 'Cadd9', 'Fmaj7', 'Bb', 'Eadd9']
const THU = ['Am', 'Am7', 'Cm', 'F#m7', 'Bbm', 'Em']

describe('hợp âm báo cuối dạo đầu', () => {
  it('luôn có nốt cảm và tam cung, dù đích trưởng hay thứ', () => {
    for (const symbol of [...TRUONG, ...THU]) {
      const cue = cueChord(chord(symbol))
      expect(cue, `${symbol}: không dựng được hợp âm báo`).not.toBeNull()

      const bac = new Set(
        cue!.quality.intervals.map((step) => normalizePitchClass(step)),
      )
      expect(bac.has(4), `${symbol} -> ${cue!.quality.id}: thiếu quãng ba trưởng`).toBe(true)
      expect(bac.has(10), `${symbol} -> ${cue!.quality.id}: thiếu quãng bảy thứ`).toBe(true)
    }
  })

  it('dựng trên bậc năm của hợp âm đích', () => {
    for (const symbol of [...TRUONG, ...THU]) {
      const target = chord(symbol)
      expect(cueChord(target)!.root).toBe(normalizePitchClass(target.root + 7))
    }
  })

  it('không bao giờ ra màu treo hay màu đã yên vị', () => {
    // `9sus4` mất nốt cảm; `13` và `add9` nghe đã đến nơi rồi.
    for (const symbol of [...TRUONG, ...THU]) {
      expect(['9sus4', '13sus4', '7sus4', '13', 'add9', '69']).not.toContain(
        cueChord(chord(symbol))!.quality.id,
      )
    }
  })
})

describe('quay đầu giữa bài giữ nguyên lối của thầy', () => {
  /*
    Quay đầu là để **đi tiếp**, không phải để đẩy ai vào — nên `9sus4` ở đó vẫn
    đúng, và bảng màu cũ không được đổi theo bảng mạnh.
  */
  it('đích trưởng vẫn ra 9sus4', () => {
    expect(pullChordFor(chord('C'))!.quality.id).toBe('9sus4')
    expect(pullChordFor(chord('Cadd9'))!.quality.id).toBe('9sus4')
  })

  it('đích thứ vẫn ra 7b9', () => {
    expect(pullChordFor(chord('Am7'))!.quality.id).toBe('7b9')
  })

  it('hai bảng ra khác nhau ở đúng chỗ đáng khác', () => {
    const thuong = pullChordFor(chord('C'))!
    const manh = pullChordFor(chord('C'), { strong: true })!
    expect(thuong.root).toBe(manh.root)
    expect(thuong.quality.id).not.toBe(manh.quality.id)
  })
})

/*
  HỢP ÂM BÁO ĐI SAU CÂU CHẠY NGÓN, KHÔNG ĐÈ LÊN NÓ.

  Cuối giang tấu là một câu chạy sáu móc kép rồi tới hợp âm báo. Rải mặc định
  đi NGƯỢC thời gian để nốt trên cùng rơi đúng mốc — đúng khi mốc là vạch nhịp,
  sai khi mốc là chỗ câu chạy vừa dứt: cụm rải khi ấy đè lên nốt chót của câu
  chạy, đục đúng chỗ vừa dọn sạch.

  Người dùng bảo "gom cái báo vào sau phần chạy nốt cuối giang tấu rồi rải kiểu
  outro" — nên hình rải giữ nguyên, chỉ dịch sang phải đúng bề rộng của nó.
*/
describe('rải hợp âm báo sau một mốc', () => {
  const NOTES = [60, 64, 67, 72] as const
  const MOC = 12

  it('rải thường đáp XUỐNG mốc: có nốt đi trước mốc', () => {
    const truoc = cueStrike(NOTES, MOC, { roll: true })
    expect(Math.min(...truoc.map((e) => e.startBeat))).toBeLessThan(MOC)
    // Nốt trên cùng vẫn rơi đúng mốc — đó là lý do tồn tại của lối rải ngược.
    expect(Math.max(...truoc.map((e) => e.startBeat))).toBeCloseTo(MOC, 6)
  })

  it('rải `sau` thì KHÔNG nốt nào đi trước mốc', () => {
    const sau = cueStrike(NOTES, MOC, { roll: true, sau: true })
    for (const event of sau) expect(event.startBeat).toBeGreaterThanOrEqual(MOC - 1e-6)
    expect(Math.min(...sau.map((e) => e.startBeat))).toBeCloseTo(MOC, 6)
  })

  it('hình rải không đổi, chỉ dịch chỗ', () => {
    const truoc = cueStrike(NOTES, MOC, { roll: true })
    const sau = cueStrike(NOTES, MOC, { roll: true, sau: true })
    expect(sau.map((e) => e.notes)).toEqual(truoc.map((e) => e.notes))
    expect(sau.map((e) => e.velocity)).toEqual(truoc.map((e) => e.velocity))
    const lech = sau.map((e, at) => e.startBeat - truoc[at]!.startBeat)
    for (const one of lech) expect(one).toBeCloseTo(lech[0]!, 9)
  })

  /*
    Câu chạy dứt đúng vạch ô cuối; hợp âm báo phải nằm gọn trong ô ấy chứ không
    tràn sang đoạn sau. Bốn nốt rải cách nhau nhiều nhất 0,08 phách nên cả cụm
    rộng chưa tới một phần tư phách.
  */
  it('cụm rải nằm gọn trong ô sau câu chạy', () => {
    const khung = khungChayNgon(40, 4)!
    const sau = cueStrike(NOTES, khung.den, { roll: true, sau: true })
    expect(Math.max(...sau.map((e) => e.startBeat))).toBeLessThan(khung.den + 1)
  })
})
