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

  it('điệp chồng nốt, phiên thì không', () => {
    const day = (id: string) =>
      trai(id).filter((e) => e.notes.length >= 2).length / trai(id).length
    expect(day(PHIEN)).toBeLessThan(0.2)
    expect(day(DIEP)).toBeGreaterThan(0.6)
  })

  /* Đo Đường xưa ô 41-58: bass đơn ở phách 1, 3, 4; chồng ở các mốc yếu. */
  it('phách mạnh giữ bass đơn, mốc yếu chồng bộ ba', () => {
    const tai = new Map(trai(DIEP).map((e) => [e.startBeat, e.notes.length]))
    for (const beat of [0, 2, 3]) expect(tai.get(beat), `phách ${beat}`).toBe(1)
    for (const beat of [0.5, 0.75, 1, 1.5, 2.5, 3.5]) {
      expect(tai.get(beat), `mốc ${beat}`).toBeGreaterThanOrEqual(3)
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
