import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC } from './chongHopAm'
import { chonCau, diemCau, DONG_CHO, dungHaiTay, dungTayPhai, LO_TU, MAN, MAU_SLASH, MOC_MAC_DINH, MOC_ROI, soCanCham, soNotLo, taoCau, taoCauSlash, thoiGianRoi } from './gameChong'
import { lopHop } from './slashChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const mau = (id: string) => MAU_SLASH.find((m) => m.id === id)!
const pc = (x: number) => ((x % 12) + 12) % 12

describe('game Mưa hợp âm — logic', () => {
  it('bảy màn: năm họ chia hết 26 loại, màn slash có bảng quy luật riêng, màn trộn', () => {
    const nam = MAN.slice(0, 5).flatMap((m) => m.ids)
    expect(nam.length).toBe(26)
    expect(new Set(nam).size).toBe(26)
    expect(MAN.map((m) => m.ten)).toContain('Hợp âm slash')
    expect(MAN[5]!.ids).toEqual(MAU_SLASH.map((m) => `slash:${m.id}`))
    expect(MAN[5]!.meo!.length).toBeGreaterThan(MAU_SLASH.length)
    expect([...MAN[6]!.ids].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
  })

  it('câu chồng F♯13♭9: gợi ý cộng gốc, lời giải theo gốc thật, chấm tay phải theo lớp cao độ', () => {
    const cau = taoCau(ct('13b9'), 6)
    expect([cau.ten, cau.khungTen, cau.goiY, cau.dapAnTen, cau.lo]).toEqual(['F♯13♭9', 'tay trái F♯7', '+ trưởng · lùi 3 phím', 'D♯', 'tay phải D♯'])
    expect([cau.loi, cau.nho]).toEqual(['F♯13♭9 = F♯7 + D♯', 'Fa♯ lùi 3 phím → D♯'])
    expect(cau.meo).toBe(
      'Fa♯ lùi 3 phím = Rê♯ (cặp thứ song song F♯ ↔ D♯m) → trưởng trên Rê♯: D♯ (Rê♯ – Sol – La♯). Mọi gốc: 13♭9 = tay trái gốc – 3 – ♭7 + tay phải trưởng trên gốc lùi 3 phím.',
    )
    expect(cau.nhan).toEqual({ trai: 'F♯7', traiPhu: 'Fa♯ – La♯ – Mi', phai: 'D♯', phaiPhu: 'Rê♯ – Sol – La♯' })
    expect(dungTayPhai([63, 67, 70], cau)).toBe(true) // Mi♭ Sol Si♭ = D♯ trưởng, thế nào cũng được
    expect(dungTayPhai([...cau.trai, ...cau.phai], cau)).toBe(true)
    expect(dungTayPhai([63, 66, 70], cau)).toBe(false) // D♯ thứ — là F♯13
    expect(soCanCham(cau, false)).toBe(3)
  })

  it('bốn nút chọn tên mang nốt: nút đúng là chính đáp án; nút nhiễu giữ tay trái, tay phải là hợp âm khác đặt ngay trên', () => {
    for (const id of ['13b9', 'maj7', '69', 'm11b5']) {
      const cau = taoCau(ct(id), 2)
      const ten = cau.luaChon.map((l) => l.ten)
      expect([id, ten.length, new Set(ten).size]).toEqual([id, 4, 4])
      const dung = cau.luaChon.find((l) => l.ten === cau.dapAnTen)!
      expect([dung.trai, dung.phai]).toEqual([cau.trai, cau.phai])
      for (const l of cau.luaChon.filter((x) => x !== dung)) {
        expect([id, l.ten, l.trai]).toEqual([id, l.ten, cau.trai])
        expect([id, l.ten, Math.min(...l.phai) > Math.max(...l.trai), dungTayPhai(l.phai, cau)]).toEqual([id, l.ten, true, false])
        expect(l.nhan.phai).toBe(l.ten)
      }
    }
  })

  it('hai tay: đủ nốt và nốt thấp nhất là gốc', () => {
    const c = taoCau(ct('13b9'), 0)
    expect(dungHaiTay([48, 52, 58, 69, 73, 76], c)).toBe(true)
    expect(dungHaiTay([52, 58, 60, 69, 73, 76], c)).toBe(false)
  })

  it('câu slash: tên và nghĩa đúng quy luật; bass thế đảo ghi theo chữ của hợp âm (E/G♯ chứ không E/A♭)', () => {
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
    expect(t('dao1', 8)).toEqual(['E/G♯', 'E đảo 1'])
    const c = taoCauSlash(mau('maj7'), 0, () => 0.3)
    expect([c.khungTen, c.goiY, c.lo, c.nho, c.nhan]).toEqual([
      'bass Đô',
      'bass lạ · lên 4 phím tới gốc Em',
      '= Cmaj7',
      'Đô lên 4 phím → Em',
      { trai: 'Đô', traiPhu: 'bass', phai: 'Em', phaiPhu: 'Mi – Sol – Si' },
    ])
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
        const c = taoCauSlash(m, y)
        expect([m.id, y, pc(c.trai[0]!), dungHaiTay([...c.trai, ...c.phai], c)]).toEqual([m.id, y, y, true])
      }
  })

  it('câu slash bấm hai tay: bass dưới, hợp âm trên; sai bass là sai; bốn nghĩa mang nốt riêng', () => {
    const c = taoCauSlash(mau('9sus4'), 7, () => 0.3)
    expect(c.haiTayBuoc).toBe(true)
    expect(dungHaiTay([...c.trai, ...c.phai], c)).toBe(true)
    expect(dungHaiTay([43, 65, 69, 72], c)).toBe(true) // Sol2 + Fa – La – Đô
    expect(dungHaiTay([53, 55, 69, 72], c)).toBe(false) // nốt thấp nhất Fa, không phải Sol
    expect(soCanCham(c, true)).toBe(4)
    for (const m of MAU_SLASH) {
      const k = taoCauSlash(m, 2, () => 0.6)
      const ten = k.luaChon.map((l) => l.ten)
      expect([m.id, ten.length, new Set(ten).size, ten.includes(k.dapAnTen)]).toEqual([m.id, 4, 4, true])
      const dung = k.luaChon.find((l) => l.ten === k.dapAnTen)!
      expect([m.id, dung.trai, dung.phai]).toEqual([m.id, k.trai, k.phai])
    }
    // C/E: nút "C thế gốc" bấm bass Đô, "C đảo 2" bấm bass Sol — cùng hợp âm C ở tay phải
    const ce = taoCauSlash(mau('dao1'), 4, () => 0.3)
    const bass = (ten: string) => pc(ce.luaChon.find((l) => l.ten === ten)!.trai[0]!)
    expect([bass('C đảo 1'), bass('C thế gốc'), bass('C đảo 2')]).toEqual([4, 0, 7])
  })

  it('chọn câu: câu vừa sai nặng hơn, không lặp câu vừa rồi; chọn được cả câu slash', () => {
    const sai = new Map([['m9', 10]])
    expect(chonCau(['maj9', 'm9', '9'], [0], sai, null, () => 0.5).id).toBe('m9') // nặng 1 · 21 · 1
    expect(chonCau(['maj9', 'm9'], [0], new Map(), 'maj9', () => 0.1).id).toBe('m9')
    expect(chonCau(['slash:9sus4'], [7], new Map(), null, () => 0.2).ten).toBe('F/G')
  })

  it('điểm, mốc tốc độ, đáp án hiện dần', () => {
    expect([diemCau(0), diemCau(4), diemCau(5), diemCau(12)]).toEqual([10, 10, 20, 30])
    expect(MOC_ROI).toContain(MOC_MAC_DINH.meo)
    expect(MOC_ROI).toContain(MOC_MAC_DINH.thi)
    expect([thoiGianRoi(14), thoiGianRoi(10, true), thoiGianRoi(30)]).toEqual([14000, 12000, 30000])
    expect([LO_TU, DONG_CHO]).toEqual([0.6, 0.9])
    expect([0.59, 0.6, 0.75, 0.85, 0.95].map((p) => soNotLo(p, 3))).toEqual([0, 1, 2, 3, 3])
    expect([0.65, 0.89, 1].map((p) => soNotLo(p, 4))).toEqual([1, 4, 4])
  })
})
