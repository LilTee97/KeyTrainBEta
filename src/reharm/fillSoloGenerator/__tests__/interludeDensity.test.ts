import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../../style/styleLibrary'
import { generateSolo } from '../soloGenerator'
import { LONG_INTERLUDE_BARS, interludeDensity, pulseForStyle, soloFeelFor } from '../soloFeel'
import { chooseChorusLoop } from '../../style/interludeLoop'

/*
  Đoạn giang tấu dài bao nhiêu thì câu solo dày bấy nhiêu.

  Đo trên bảy bản ký âm của Cà Pháo (`tools/sheet/profile.py` bên PianoBrain):
  sáu đoạn giang tấu tách hoàn hảo theo ĐỘ DÀI, không theo thể loại — 9, 10, 10
  ô thì THƯA HƠN đoạn hát 3-6%; 18 và 20 ô thì dày thêm 65% và 31%.

  Hai điểm dữ liệu ở giữa (10 ô) được người dùng gửi SAU KHI luật đã phát biểu
  và nói rõ cần loại nào, nên đây là phép thử trước chứ không phải vẽ luật sau
  khi nhìn xong.

  Bản đầu của luật định TẮT HẲN câu solo ở đoạn ngắn. Sai — xem chú thích ở
  `soloFeel.ts`: tay phải của Cà Pháo luôn chơi giai điệu, còn tay phải của
  KeyTrain đang quạt hợp âm, nên "giữ nguyên kết cấu" ở hai bên ra hai kết quả
  khác hẳn nhau.
*/

const KEY = { tonic: 9 as const, scale: 'minor' as const }
const SONG = 'Am Dm E7 Am'

function noteCount(bars: number): number {
  const style = getStyle('pop-1')!
  const pulse = pulseForStyle('pop-1')
  let total = 0
  for (let take = 0; take < 12; take += 1) {
    total += generateSolo(parseChordInput(SONG).chords, {
      beatsPerChord: 4,
      density: interludeDensity(bars),
      key: KEY,
      take,
      interlude: true,
      feel: soloFeelFor('pop-1'),
      ...(pulse.length > 0 ? { pulse, pulseBar: style.beatsPerMeasure } : {}),
    }).length
  }
  return total
}

describe('độ dài giang tấu quyết định mật độ câu solo', () => {
  it.each([4, 8, 11])('%s ô là cầu nối, câu thưa', (bars) => {
    expect(interludeDensity(bars)).toBe('sparse')
  })

  it.each([18, 20, 32])('%s ô là bản độc tấu, câu dày', (bars) => {
    expect(interludeDensity(bars)).toBe('medium')
  })

  /*
    Ranh giới là con số CHỌN, không phải đo được: người thật cho 11 ô ở một bên
    và 18 ô ở bên kia, khoảng giữa chưa có điểm dữ liệu nào.
  */
  it('ranh giới nằm trong khoảng người thật để trống', () => {
    expect(LONG_INTERLUDE_BARS).toBeGreaterThan(11)
    expect(LONG_INTERLUDE_BARS).toBeLessThan(18)
  })

  /*
    SỬA ĐƯỢC MỘT NỬA, ghi lại phần còn lại.

    Gốc đã tìm ra và sửa: lick `enclosure` — thứ dựng phần lớn câu giang tấu —
    KHÔNG nhận `notesPerBeat` một lần nào, nên nó luôn ra đúng chín nốt bất kể
    mật độ. Trước khi sửa, `sparse` và `medium` cho ra từng nốt trùng khít.

    Sửa xong thì mật độ CÓ tác dụng, nhưng chỉ khoảng 4%. Người thật chênh
    30-60% giữa đoạn ngắn và đoạn dài. Phần còn lại của số nốt do chính HÌNH
    LICK quyết định — mỗi lick có độ dài riêng, không phải một tham số — nên
    nút mật độ không với tới được.

    Đây là cùng một gốc với chuyện rải hợp âm quá nhiều: câu được dập từ một
    hình có sẵn, rồi mới đi hỏi hoàn cảnh. Muốn điều khiển được mật độ thì câu
    phải được DỰNG theo số nốt cần, tức bộ sinh cọc-và-nối ở bước 3.
  */
  it('mật độ có tác dụng, nhưng chưa đủ để nghe ra', () => {
    const short = noteCount(4)
    const long = noteCount(20)
    expect(long).toBeGreaterThan(short)
    // Còn xa mục tiêu: người thật chênh 30-60%.
    expect(long / short).toBeLessThan(1.3)
  })

  /*
    Giang tấu của app hiện dài 4 ô, hoặc 8 ô khi vòng lặp hai lượt — luôn nằm ở
    phía cầu nối. Test này ghi lại chuyện đó: muốn có một câu solo thật thì phải
    kéo dài chính đoạn giang tấu, không phải chỉnh bộ sinh câu.
  */
  it('giang tấu mặc định của app thuộc phía cầu nối', () => {
    expect(interludeDensity(4)).toBe('sparse')
    expect(interludeDensity(8)).toBe('sparse')
  })
})

/*
  Chuỗi nối: người dùng chọn giang tấu mượn mấy hợp âm -> ra bao nhiêu ô nhịp
  -> ra mật độ câu solo.

  Bốn hợp âm — mặc định, và là con số người dùng chọn bằng tai sau khi bác bản
  mượn nguyên vòng — ra 4 ô, tức luôn ở phía cầu nối. Mười sáu hợp âm mới đủ
  dài để luật nói được điều gì.
*/
describe('độ dài giang tấu chọn được, và nó dẫn tới mật độ', () => {
  const song = parseChordInput(
    'Am Dm G C F Bm7b5 E7 Am Dm G C F E7 Am Dm E7',
  ).chords

  it.each([4, 8, 12, 16])('mượn %s hợp âm thì cửa sổ đúng bấy nhiêu', (size) => {
    const window = chooseChorusLoop(song, size)!
    expect(window.to - window.from + 1).toBe(size)
  })

  it('không đòi nhiều hơn số hợp âm bài có', () => {
    const window = chooseChorusLoop(song.slice(0, 5), 16)!
    expect(window.to - window.from + 1).toBe(5)
  })

  /* Một hợp âm một ô nhịp: bốn hợp âm là cầu nối, mười sáu là bản độc tấu. */
  it('bốn hợp âm ra cầu nối, mười sáu ra độc tấu', () => {
    expect(interludeDensity(4)).toBe('sparse')
    expect(interludeDensity(16)).toBe('medium')
  })
})
