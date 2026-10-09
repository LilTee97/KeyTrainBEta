import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC } from './chongHopAm'
import { chonCau, diemCau, dungHaiTay, dungTayPhai, MAN, MAU_SLASH, soCanCham, taoCau, taoCauSlash, thoiGianRoi } from './gameChong'
import { lopHop } from './slashChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const mau = (id: string) => MAU_SLASH.find((m) => m.id === id)!
const pc = (x: number) => ((x % 12) + 12) % 12

describe('game Mưa hợp âm — logic', () => {
  it('bảy màn: năm họ chia hết 26 loại, màn slash, màn trộn', () => {
    const nam = MAN.slice(0, 5).flatMap((m) => m.ids)
    expect(nam.length).toBe(26)
    expect(new Set(nam).size).toBe(26)
    expect(MAN.map((m) => m.ten)).toContain('Hợp âm slash')
    expect(MAN[5]!.ids).toEqual(MAU_SLASH.map((m) => `slash:${m.id}`))
    expect([...MAN[6]!.ids].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(MAN.every((m) => m.meo.length > 0)).toBe(true)
  })

  it('câu chồng F♯13♭9: gợi ý theo loại, chấm tay phải theo lớp cao độ', () => {
    const cau = taoCau(ct('13b9'), 6)
    expect([cau.ten, cau.goiY, cau.dapAnTen, cau.khungTen]).toEqual(['F♯13♭9', 'tay phải 13·♭9·3 · trưởng', 'D♯', 'khung F♯7'])
    expect(dungTayPhai([63, 67, 70], cau)).toBe(true) // Mi♭ Sol Si♭ = D♯ trưởng, thế nào cũng được
    expect(dungTayPhai([...cau.trai, ...cau.phai], cau)).toBe(true)
    expect(dungTayPhai([63, 66, 70], cau)).toBe(false) // D♯ thứ — là F♯13
    expect(soCanCham(cau, false)).toBe(3)
    expect(cau.luaChon).toHaveLength(4)
    expect(cau.luaChon).toContain('D♯')
  })

  it('hai tay: đủ nốt và nốt thấp nhất là gốc', () => {
    const c = taoCau(ct('13b9'), 0)
    expect(dungHaiTay([48, 52, 58, 69, 73, 76], c)).toBe(true)
    expect(dungHaiTay([52, 58, 60, 69, 73, 76], c)).toBe(false)
  })

  it('câu slash: tên và nghĩa đúng quy luật ở gốc Đô / Sol / Mi', () => {
    const t = (id: string, y: number) => {
      const c = taoCauSlash(mau(id), y, () => 0.3)
      return [c.ten, c.dapAnTen]
    }
    expect(t('maj7', 0)).toEqual(['Em/C', 'Cmaj7'])
    expect(t('m7', 0)).toEqual(['E♭/C', 'Cm7'])
    expect(t('7', 0)).toEqual(['Edim/C', 'C7'])
    expect(t('9sus4', 7)).toEqual(['F/G', 'G9sus4'])
    expect(t('maj9', 0)).toEqual(['G/C', 'Cmaj9 (thiếu 3)'])
    expect(t('dao1', 4)).toEqual(['C/E', 'C đảo 1'])
    expect(t('dao2', 7)).toEqual(['C/G', 'C đảo 2'])
    expect(t('dao1m', 0)).toEqual(['Am/C', 'Am đảo 1'])
  })

  it('mọi mẫu slash ở cả 12 bass: thế đảo có bass trong hợp âm; bass lạ khớp nốt hợp âm màu', () => {
    const MAU_CHAT: Record<string, string> = { maj7: 'maj7', m7: 'm7', '7': '7', '9sus4': '9sus4', maj9: 'maj9' }
    for (const m of MAU_SLASH)
      for (let y = 0; y < 12; y++) {
        const x = lopHop(y + m.cach, m.chat)
        if (m.loai === 'dao') expect([m.id, y, x.includes(y)]).toEqual([m.id, y, true])
        else {
          expect([m.id, y, x.includes(y)]).toEqual([m.id, y, false])
          const mauPcs = lopHop(y, findQualityBySymbol(MAU_CHAT[m.id]!)!.symbol)
          expect([m.id, y, [...x, y].every((p) => mauPcs.includes(pc(p)))]).toEqual([m.id, y, true])
        }
      }
  })

  it('câu slash bấm hai tay: bass dưới, hợp âm trên; sai bass là sai; bốn lựa chọn có đáp án', () => {
    const c = taoCauSlash(mau('9sus4'), 7, () => 0.3)
    expect(c.haiTayBuoc).toBe(true)
    expect(dungHaiTay([...c.trai, ...c.phai], c)).toBe(true)
    expect(dungHaiTay([43, 65, 69, 72], c)).toBe(true) // Sol2 + Fa – La – Đô
    expect(dungHaiTay([53, 55, 69, 72], c)).toBe(false) // nốt thấp nhất Fa, không phải Sol
    expect(soCanCham(c, true)).toBe(4)
    for (const m of MAU_SLASH) {
      const k = taoCauSlash(m, 2, () => 0.6)
      expect([m.id, k.luaChon.length, new Set(k.luaChon).size, k.luaChon.includes(k.dapAnTen)]).toEqual([m.id, 4, 4, true])
    }
  })

  it('chọn câu: câu vừa sai nặng hơn, không lặp câu vừa rồi; chọn được cả câu slash', () => {
    const sai = new Map([['m9', 10]])
    expect(chonCau(['maj9', 'm9', '9'], [0], sai, null, () => 0.5).id).toBe('m9') // nặng 1 · 21 · 1
    expect(chonCau(['maj9', 'm9'], [0], new Map(), 'maj9', () => 0.1).id).toBe('m9')
    expect(chonCau(['slash:9sus4'], [7], new Map(), null, () => 0.2).ten).toBe('F/G')
  })

  it('điểm và tốc độ', () => {
    expect([diemCau(0), diemCau(4), diemCau(5), diemCau(12)]).toEqual([10, 10, 20, 30])
    expect([thoiGianRoi('meo', 0), thoiGianRoi('meo', 500)]).toEqual([14000, 9000])
    expect([thoiGianRoi('thi', 0), thoiGianRoi('thi', 0, true)]).toEqual([10000, 12000])
    expect(thoiGianRoi('thi', 200)).toBe(4000)
  })
})
