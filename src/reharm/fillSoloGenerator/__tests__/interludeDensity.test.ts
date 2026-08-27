import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../../style/styleLibrary'
import { generateSolo } from '../soloGenerator'
import { LONG_INTERLUDE_BARS, interludeDensity, pulseForStyle, soloFeelFor } from '../soloFeel'

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
    KHUYẾT TẬT ĐÃ BIẾT, ghi lại chứ chưa sửa được.

    Luật ở trên chọn `sparse` hay `medium` đúng theo độ dài đoạn, nhưng ở NHÁNH
    GIANG TẤU thì `density` hiện **không có tác dụng gì**. Đo trên vòng
    `Am Dm E7 Am`, tám lượt: `sparse`, `medium` và `dense` cho ra không chỉ cùng
    số nốt mà cùng TỪNG NỐT MỘT — chuỗi cao độ và mốc thời gian trùng khít.

    Đã lần theo hai nhánh đóng cứng `notesPerBeat` (`interlude && index === 0`
    và nhánh lick `enclosure` / `scale-run`) và sửa thử cả hai: không đổi một
    nốt nào, tức đường chạy thật nằm ở chỗ khác chưa tìm ra. Hai lần sửa ấy đã
    gỡ bỏ, không để lại mã không làm gì.

    Ngày nào tìm ra và sửa được thì test này ĐỎ. Lúc ấy hãy thay nó bằng phép đo
    thật: đoạn dài phải ra nhiều nốt hơn đoạn ngắn rõ rệt.
  */
  it('CHƯA SỬA ĐƯỢC: mật độ vô hiệu ở nhánh giang tấu', () => {
    expect(noteCount(4)).toBe(noteCount(20))
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
