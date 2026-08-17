import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { detectKey, isAmbiguous } from '../keyDetection'

/**
 * Dò giọng, đối chiếu với **bản ký âm thật** trong thư mục `Reference/`.
 *
 * Vòng hợp âm dưới đây rút thẳng từ các thẻ hợp âm trong ba file `.mxl`, và
 * đáp án lấy từ bộ khoá ghi trong chính file đó. Đây là chỗ duy nhất trong bộ
 * test có đáp án đến từ ngoài mã nguồn, nên nó là thước đo thật chứ không phải
 * chép lại cách app đang chạy.
 */

const SONGS: { name: string; truth: string; chords: string }[] = [
  {
    name: 'nguoi ay.mxl',
    truth: 'C',
    chords:
      'C G/B Am Em/G F C/E Dm G Dm G C F C/E Dm G7 C F Em A7 Dm G C G/B Am Em/G F C/E Dm Dm G7 C',
  },
  {
    name: 'nguoihayquenemdi.mxl',
    truth: 'Dm',
    chords:
      'Dm9 Gm11 Dm11 Gm11 Dm9 Gm11 Dm11 Gm7 A11 D9 Gm9 C13 Fmaj9 A#maj9 Gm13 E7 A13 Dmaj9 Gm9 C Fmaj9 A#maj9 Gm11 E7 A11 Dm11 Gm7 A11 Dm Em11 A7/G Dm11 Gm7 A13 Dm Gm F# Fsus4 C9 Fmaj7 Emaj7 Fmaj7 A A#maj9 E A7 Dm F#/D# Dm11 E A7 Dm9 E Am Dm11 E A11 Dm9 Gm9 C7 Fmaj9 A#9 Gm9 E7 A11 D9 Gm11 C9 Fmaj7 A#9 Gm9 Em11 F9 A13 Dm11 Gmaj7 A11 Dm Em11 D A11 Dmaj7 Gm9 A13 Dm9 Gm7 C9 Fmaj7 A#maj9 E A11 Dm11 Gm7 A11 Dm A#maj7 A11 Dm9 Gm9 A13 Dm9 Gm9 C11 Fmaj7 A#maj7 Emaj7 A13 Dm11 D#9 A7 Dm C11/E A7 Dmaj9',
  },
  {
    name: '52 Piano Jazz Blues Licks.mxl',
    truth: 'C',
    chords:
      'C7 C7 C7 C7 C7 C7 C7 C7 C7 F7 F7 F7 F7 F7 F7 F7 F7 F7 F7 G7 G7 G7 G7 G7 G7 G7 G7 G7 G7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 C7 D C7 C7 C7 C7 C7',
  },
]

const guess = (chords: string) =>
  detectKey(parseChordInput(chords).chords)

describe('dò giọng trên bản ký âm thật', () => {
  for (const song of SONGS) {
    it(`đọc đúng giọng của ${song.name}`, () => {
      expect(guess(song.chords)[0]?.label).toBe(song.truth)
    })

    it(`không phân vân về giọng của ${song.name}`, () => {
      /*
        Cả bài dài mấy chục hợp âm thì phải quả quyết được. Còn báo phân vân
        nghĩa là dấu hiệu chưa đủ tách bạch, và người dùng phải tự chọn tay.
      */
      expect(isAmbiguous(guess(song.chords))).toBe(false)
    })
  }

  it('mọi ký hiệu hợp âm trong bản ký âm đều đọc được', () => {
    // Đọc hụt một hợp âm là dò giọng trên một bài khác với bài thật
    for (const song of SONGS) {
      expect(parseChordInput(song.chords).errors).toEqual([])
    }
  })
})

describe('vì sao bài blues từng bị đọc sai', () => {
  /*
    Hợp âm chủ của blues là một hợp âm **bảy át**, nên nhìn giống bậc năm của
    giọng hạ át: vòng C7-F7-G7 rất dễ bị đọc thành Fa trưởng. Cách cũ cộng
    thẳng điểm khớp gam của từng nốt nên điểm ấy lớn dần theo độ dài bài, nuốt
    mất bằng chứng "bài mở và đóng đều ở Đô".
  */
  const blues = SONGS[2]!

  it('không đọc thành giọng hạ át', () => {
    expect(guess(blues.chords)[0]?.label).not.toBe('F')
  })

  it('hợp âm chủ là hợp âm bảy át vẫn tính là hợp âm chủ', () => {
    // Bài mở và đóng đều ở C7; đòi hợp âm ba trưởng trơn thì mất dấu hiệu này
    expect(guess('C7 F7 G7 C7')[0]?.label).toBe('C')
  })
})

describe('vòng ngắn thì không đọc ra câu kết không có thật', () => {
  /*
    Người dùng hay gõ vào một vòng bốn hợp âm để nghe thử. Vòng lặp không có
    chỗ dừng nào cả — hợp âm cuối chỉ là hợp âm thứ tư của vòng.
  */
  it('vòng Cứ Chill Thôi ra đúng giọng tài liệu ghi', () => {
    // Tài liệu phần 1: bài gốc La giáng trưởng, dạy ở Sol trưởng
    expect(guess('Am11 D9sus4 E9sus4 Em7')[0]?.label).toBe('G')
  })

  it('hai hợp âm thì phải nói là chưa chắc', () => {
    expect(isAmbiguous(guess('C F'))).toBe(true)
  })

  it('cùng vòng ấy mà kết thật thì lại tin chỗ kết', () => {
    /*
      Bốn hợp âm lặp lại đủ dài thành một bài thì hợp âm cuối mới là câu kết —
      và lúc đó Mi thứ là câu trả lời đúng.
    */
    const looped = Array(4).fill('Am D E Em').join(' ')
    expect(guess(looped)[0]?.scale).toBe('minor')
  })
})

describe('bài hopamchuan Phố Không Em', () => {
  const pho =
    'G C D G Bm Em Am D G C D Bm Em Am D G G7 C D Bm Em Am D7 G G7 C Cm Bm E E7 Am Am D D G G Bm Bm C D G G7 C Cm Bm Em Am D7 G G C D G Bm Em Am D G C D Bm Em Am D7 D G'

  it('dò ra Sol trưởng, không lẫn sang Mi thứ hay La thứ', () => {
    expect(guess(pho)[0]?.label).toBe('G')
    expect(isAmbiguous(guess(pho))).toBe(false)
  })
})

describe('thời lượng hợp âm có tính vào', () => {
  it('hợp âm ngân lâu nói lên giọng nhiều hơn hợp âm lướt qua', () => {
    /*
      Cùng ba hợp âm Đô, Sol, Fa. Chia đều thì bài ở Đô trưởng; nhưng nếu bài
      đậu hẳn ở Sol thì Sol mới là chủ âm, còn Đô với Fa thành bậc bốn và bậc
      bảy. Không cân theo thời lượng thì hai trường hợp này không phân biệt
      được vì bộ hợp âm y hệt nhau.
    */
    const chords = parseChordInput('C G F').chords

    expect(detectKey(chords, { beats: [1, 1, 1] })[0]?.label).toBe('C')
    expect(detectKey(chords, { beats: [1, 12, 1] })[0]?.label).toBe('G')
  })
})
