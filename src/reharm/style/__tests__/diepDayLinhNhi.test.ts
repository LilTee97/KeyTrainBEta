import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { getStyle } from '../styleLibrary'

/*
  ĐIỆP KHÚC DÀY THEO CHIỀU DỌC — đo năm bản ký âm bolero Linh Nhi.

  Tỉ lệ mốc gõ có TỪ HAI NỐT TAY TRÁI TRỞ LÊN:

    Đường xưa lối cũ   18% → 76%    mốc gõ 8,3 → 8,3
    Rừng lá thấp       24% → 67%    mốc gõ 7,4 → 8,7
    Mùa xuân           22% → 32%
    Đừng Xa            14% → 16%
    Biển Tình           2% →  5%

  Hai bài đổi, ba bài không. Chỗ đáng học nằm ở SỐ MỐC GÕ GẦN NHƯ KHÔNG ĐỔI:
  điệp khúc dày theo chiều dọc, không theo chiều ngang.
*/

const trai = (styleId: string, chord = 'C') =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chord).chords, {}), getStyle(styleId)!)
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)

const PHIEN = 'bolero-linh-nhi-3'
const DIEP = 'bolero-linh-nhi-3-chorus'

describe('điệp khúc dày theo chiều dọc', () => {
  /* Luật cốt lõi. Thêm cú gõ là lấp mất khoảng trống, hỏng đúng chỗ đáng học. */
  it('SỐ MỐC GÕ không đổi giữa phiên và điệp', () => {
    expect(trai(DIEP).map((e) => e.startBeat)).toEqual(trai(PHIEN).map((e) => e.startBeat))
  })

  it('điệp chồng nốt NHIỀU HƠN phiên, nhưng phiên cũng có chồng', () => {
    /*
      SỐ ĐO CŨ n=1 ĐÃ BỊ THAY. Bài kiểm này từng đòi phiên khúc chồng dưới 20% số mốc,
      tức gần như không chồng — số ấy đo trên MỘT đoạn của MỘT bài (Đường Xưa ô 41-58).
      Đo lại cả bảy sheet, 2125 mốc gõ tay trái ở phiên khúc và 1026 ở điệp khúc:

        phiên khúc **1,22** nốt mỗi mốc · điệp khúc **1,60**

      Phiên khúc CÓ chồng, chỉ là chồng thưa hơn. Ép nó về 0 là sai bản ký âm.
    */
    const tren = (id: string) =>
      trai(id).reduce((a, e) => a + e.notes.length, 0) / trai(id).length
    expect(tren(PHIEN)).toBeGreaterThan(1.1)
    expect(tren(PHIEN)).toBeLessThan(1.35)
    expect(tren(DIEP)).toBeGreaterThan(1.45)
    expect(tren(DIEP)).toBeLessThan(1.75)
    expect(tren(DIEP)).toBeGreaterThan(tren(PHIEN))
  })

  it('phách mạnh giữ bass đơn, mốc yếu chồng ĐÔI', () => {
    /*
      Hướng thì đúng từ đầu, chỉ sai độ dày. Đo bảy sheet, nốt mỗi mốc ở điệp khúc theo
      vị trí phách:

        phách 0 → 1,32 · phách 2 → 1,30 · phách 3 → 1,45
        off-beat 0,5 → 1,74 · 0,75 → 1,80 · 1,5 → 1,74 · 2,5 → 1,74 · 2,75 → 1,96 · 3,5 → 1,78

      Phách mạnh là chỗ bass trụ, chị ấy để MỘT nốt; mốc yếu chồng khoảng HAI, không
      phải ba. Số cũ đòi ≥3 và đo trên một đoạn của một bài.
    */
    const tai = new Map(trai(DIEP).map((e) => [e.startBeat, e.notes.length]))
    for (const beat of [0, 2, 3]) expect(tai.get(beat), `phách ${beat}`).toBe(1)
    for (const beat of [0.5, 0.75, 1, 1.5, 2.5, 3.5]) {
      expect(tai.get(beat), `mốc ${beat}`).toBe(2)
    }
  })

  it('nốt chồng nằm TRÊN bass, không chui xuống dưới', () => {
    const bass = Math.min(...trai(DIEP)[0]!.notes)
    for (const e of trai(DIEP).filter((x) => x.notes.length >= 2)) {
      expect(Math.min(...e.notes), `mốc ${e.startBeat}`).toBeGreaterThan(bass)
    }
  })

  it('app tự đổi sang bản dày khi vào điệp khúc', () => {
    expect(resolveStyleForSection(PHIEN, 'chorus')).toBe(DIEP)
    expect(resolveStyleForSection(PHIEN, 'verse')).toBe(PHIEN)
  })

  /* n = 2 nên nó ĐỨNG CẠNH, không thay ho nào đang có. */
  it('không thay họ Linh Nhi nào đang có', () => {
    for (const id of ['bolero-linh-nhi', 'bolero-linh-nhi-2', 'bolero-linh-nhi-2-chorus']) {
      expect(getStyle(id)?.id, id).toBe(id)
    }
    expect(resolveStyleForSection('bolero-linh-nhi-2', 'chorus')).toBe('bolero-linh-nhi-2-chorus')
  })

  it('phiên khúc dùng lại đúng lưới chín cú gõ của bolero-linh-nhi-2', () => {
    expect(trai(PHIEN).map((e) => e.startBeat))
      .toEqual(trai('bolero-linh-nhi-2').map((e) => e.startBeat))
  })
})
