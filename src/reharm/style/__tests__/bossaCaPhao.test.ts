import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'

/*
  BOSSA NOVA CÀ PHÁO — bản dựng lại sau khi bản đầu bị người dùng bác:
  "nghe không ra chất bossa nova".

  Ba chỗ đo kỹ hơn, cả ba đổi kết luận:

  1. HAI BÀI KHÁC NHAU, đừng trộn trung bình. Tay trái *Hồng Kông 1* gõ gần
     như móc đơn đều; *Người hãy quên em đi* mới có đảo phách thật. Bản này
     lấy bài thứ hai.

  2. TÁCH ĐƯỢC PHẦN QUẠT KHỎI GIAI ĐIỆU. Bản ký âm không tách bè, nhưng có nốt
     chồng: mốc từ hai nốt trở lên là quạt, mốc một nốt là giai điệu.

  3. CỬ CHỈ CHÍNH LÀ NỐT VÀO SỚM. Đếm số lần tiếng ngân vượt HẲN vạch nhịp:

       mốc 3,5   12/13 (phiên khúc)   5/11 (điệp khúc)
       mốc 3      0/3                  0/5
       mốc 2,5    0/9                  0/10
       mốc 0      0/12                 0/12

     Chỉ mốc 3,5 làm việc ấy. Bản đầu có mốc 3,5 nhưng dứt ĐÚNG vạch nhịp nên
     nó chỉ là một cú dặm thêm.
*/

const CHORDS = parseChordInput('Cmaj7 Fmaj7 Dm7 G7').chords
const dung = () =>
  renderPattern(voiceLeadTwoHands(CHORDS), getStyle('bossa-ca-phao-som')!, { beatsPerChord: 4 })
const tai = (beat: number, hand: 'left' | 'right') =>
  dung().filter((e) => Math.abs(e.startBeat - beat) < 1e-6 && e.hand === hand)

describe('điệu bossa nova Cà Pháo', () => {
  it('tay trái gõ đúng bốn mốc đo được: 1 · 2& · 3 · 4', () => {
    const moc = [...new Set(dung().filter((e) => e.hand === 'left').map((e) => e.startBeat % 4))]
    expect(moc.sort((a, b) => a - b)).toEqual([0, 1.5, 2, 3])
  })

  it('quạt hợp âm đúng năm mốc đo được, có 3,5', () => {
    const moc = [...new Set(dung().filter((e) => e.hand === 'right').map((e) => e.startBeat % 4))]
    expect(moc.sort((a, b) => a - b)).toEqual([0, 1, 2, 2.5, 3.5])
  })

  /*
    ĐÂY LÀ TEST QUAN TRỌNG NHẤT của điệu này, và là chỗ bản đầu hỏng.

    Nốt vào sớm phải là hoà âm của hợp âm KẾ TIẾP, không phải hợp âm đang chạy.
    Đánh lại hợp âm cũ thì chỉ thêm một cú gõ, không kéo hoà âm tới sớm.
  */
  it('nốt vào sớm ở 3,5 mang hợp âm KẾ TIẾP, không phải hợp âm đang chạy', () => {
    const som = tai(3.5, 'right')
    expect(som).toHaveLength(1)
    expect(som[0]!.som).toBe(true)

    const sau = tai(4, 'right')[0]!
    const dangChay = tai(0, 'right')[0]!
    // Mọi nốt của tiếng vào sớm đều nằm trong hợp âm sắp tới…
    for (const note of som[0]!.notes) expect(sau.notes).toContain(note)
    // …và KHÔNG phải chỉ là hợp âm đang chạy gõ lại.
    expect(som[0]!.notes).not.toEqual(dangChay.notes)
  })

  /*
    Nốt vào sớm MỎNG hơn cú quạt phách 1: 20 cặp đo được, cặp hay gặp nhất là
    (2 nốt, 3 nốt), và 0/10 lần ở phiên khúc trùng đúng thế bấm.
  */
  it('nốt vào sớm mỏng hơn cú quạt ở phách 1', () => {
    expect(tai(3.5, 'right')[0]!.notes.length).toBeLessThan(tai(4, 'right')[0]!.notes.length)
  })

  /*
    `clipToChords` cắt mọi tiếng vang sang hợp âm sau — đúng cho mọi tiếng
    khác, sai cho tiếng này. Cờ `som` là ngoại lệ duy nhất.

    LƯU Ý THẬT: tiếng vào sớm vẫn bị `holdUntilStruckAgain` rút còn nửa phách,
    vì đúng những phím ấy bị gõ lại ở phách 1 — trên đàn thật thì không giữ
    phím rồi gõ lại phím ấy được. Nên cái ĐẾN SỚM ở đây là HOÀ ÂM, không phải
    tiếng ngân vắt qua vạch; muốn ngân thật thì phải có mô hình pedal, chưa có.
  */
  it('cờ som được đánh dấu để clipToChords chừa ra', () => {
    expect(tai(3.5, 'right')[0]!.som).toBe(true)
    for (const beat of [0, 1, 2, 2.5]) {
      expect(tai(beat, 'right')[0]?.som, `phách ${beat}`).toBeFalsy()
    }
  })

  it('đứng trong họ bossa, không thành họ riêng', () => {
    expect(hoCuaDieu('bossa-ca-phao-som')).toBe('bossa')
    expect(kieuTrongHo('bossa').map((one) => one.id)).toContain('bossa-ca-phao-som')
  })
})
