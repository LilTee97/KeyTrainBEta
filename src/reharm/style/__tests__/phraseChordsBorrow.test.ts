import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { phraseChords } from '../phraseChords'

/*
  Đoạn dạo đầu và đoạn kết lấy hợp âm **trong bài**.

  Trước đây hai đoạn này dựng theo bậc `I - V - vi - IV` của giọng, nên bài chạy
  `Am(add9) - Dm9 - Cadd2 - Em7` mà dạo đầu lại kêu `C - G - Am - F`: đúng giọng,
  đúng lý thuyết, và nghe ra là hai bài khác nhau dán cạnh nhau. Màu hợp âm là
  thứ người nghe nhận ra bài, không phải bậc.
*/

const KEY = { tonic: 9, scale: 'minor' } as const
const SONG = 'Am(add9) Dm9 Cadd2 Em7 Fadd2 Am(add9)'

const chords = () => parseChordInput(SONG).chords
const symbols = (list: readonly { symbol: string }[]) => list.map((c) => c.symbol)

describe('hợp âm đoạn dạo mượn từ bài', () => {
  it('dạo đầu chỉ dùng hợp âm có thật trong bài', () => {
    const song = chords()
    const intro = phraseChords('intro', KEY, { songChords: song })
    expect(intro.length).toBeGreaterThan(0)
    for (const chord of intro) {
      expect(symbols(song), chord.symbol).toContain(chord.symbol)
    }
  })

  it('dạo đầu giữ nguyên màu của bài, không rút về ba nốt', () => {
    const intro = phraseChords('intro', KEY, { songChords: chords() })
    expect(intro.some((chord) => chord.quality.id !== 'maj' && chord.quality.id !== 'min')).toBe(true)
  })

  /*
    Kết bài giữ hình ba ô — một ô dẫn rồi hai ô đậu lại — vì bộ não soạn câu rải
    ngược trên hai ô chủ âm, và `OUTRO_LEAD_BARS` đếm đúng một ô dẫn ấy.
  */
  it('kết bài: một ô dẫn rồi hai ô đậu trên hợp âm chủ của chính bài', () => {
    const outro = phraseChords('outro', KEY, { songChords: chords() })
    expect(outro).toHaveLength(3)
    expect(outro[1]!.symbol).toBe(outro[2]!.symbol)
    expect(outro[1]!.root).toBe(9)
    // Màu của bài, không phải La thứ trần.
    expect(outro[1]!.quality.id).not.toBe('min')
    expect(outro[0]!.symbol).not.toBe(outro[1]!.symbol)
  })

  it('không có bài thì vẫn dựng theo bậc như cũ', () => {
    expect(symbols(phraseChords('intro', KEY))).toEqual(['C', 'G', 'Am', 'F'])
  })

  /*
    Rút gọn là **tuỳ chọn**, không mặc định: người dùng có thể muốn đoạn dạo giữ
    nguyên bảng màu của bài.
  */
  it('bật rút gọn thì hợp âm về chất cơ bản', () => {
    const plain = phraseChords('intro', KEY, { songChords: chords(), plain: true })
    for (const chord of plain) {
      expect(['maj', 'min', '7', 'maj7', 'm7', 'm7b5', 'sus2', 'sus4', '7sus4'], chord.symbol)
        .toContain(chord.quality.id)
    }
  })

  it('rút gọn vẫn giữ đúng nốt gốc — chỉ bỏ màu', () => {
    const song = chords()
    const rich = phraseChords('intro', KEY, { songChords: song })
    const plain = phraseChords('intro', KEY, { songChords: song, plain: true })
    expect(plain.map((c) => c.root)).toEqual(rich.map((c) => c.root))
  })
})

/*
  DẠO ĐẦU CHƠI ĐÚNG VÒNG PHIÊN KHÚC.

  Bản trước quét cả phiên khúc rồi chấm điểm chọn khoảng bốn hợp âm hút mạnh
  nhất về hợp âm mở bài. Không ngẫu nhiên, nhưng cũng không phải vòng của bài:
  khoảng thắng cuộc vắt qua hai lượt vòng được, nên dạo đầu ra một vòng không
  đoạn nào trong bài từng chơi. Người dùng bác: dạo đầu phải dựng TRÊN vòng hợp
  âm của phiên khúc.
*/
describe('dạo đầu dựng trên vòng phiên khúc', () => {
  const VONG = parseChordInput('Am(add9) Fadd2 Cadd2 Em7').chords

  it('chơi đúng vòng ấy, đúng thứ tự, không cắt không đảo', () => {
    const intro = phraseChords('intro', KEY, {
      songChords: chords(),
      vongPhienKhuc: VONG,
    })
    expect(symbols(intro)).toEqual(['Am(add9)', 'Fadd2', 'Cadd2', 'Em7'])
  })

  it('vòng phiên khúc thắng phép chấm điểm cũ', () => {
    const cu = phraseChords('intro', KEY, { songChords: chords() })
    const moi = phraseChords('intro', KEY, {
      songChords: chords(),
      vongPhienKhuc: VONG,
    })
    expect(symbols(moi)).not.toEqual(symbols(cu))
  })

  it('vẫn rút về màu cơ bản khi được yêu cầu', () => {
    const intro = phraseChords('intro', KEY, {
      vongPhienKhuc: VONG,
      plain: true,
    })
    // `plainForInterlude` rút add9 / 9sus4 / 13, nhưng GIỮ bảy: Em7 vẫn là Em7.
    expect(symbols(intro)).toEqual(['Am', 'F', 'C', 'Em7'])
  })

  /* Chưa chia đoạn thì không có vòng phiên khúc — phải lui về lối cũ, không rỗng. */
  it('không có vòng phiên khúc thì giữ nguyên lối cũ', () => {
    const intro = phraseChords('intro', KEY, { songChords: chords(), vongPhienKhuc: [] })
    expect(intro.length).toBeGreaterThan(0)
  })

  it('kết bài KHÔNG lấy vòng phiên khúc', () => {
    const outro = phraseChords('outro', KEY, {
      songChords: chords(),
      vongPhienKhuc: VONG,
    })
    expect(symbols(outro)).not.toEqual(symbols(VONG))
  })
})
