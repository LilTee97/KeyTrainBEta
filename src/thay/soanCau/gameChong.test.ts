import { describe, expect, it } from 'vitest'
import { CONG_THUC } from './chongHopAm'
import { chonCau, diemCau, dungHaiTay, dungTayPhai, luaChonTen, MAN, soCanCham, taoCau, thoiGianRoi } from './gameChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!

describe('game Mưa hợp âm — logic', () => {
  it('năm màn đầu chia hết 26 công thức, không trùng; màn 6 là tất cả', () => {
    const nam = MAN.slice(0, 5).flatMap((m) => m.ct)
    expect(nam.length).toBe(26)
    expect(new Set(nam).size).toBe(26)
    expect([...MAN[5]!.ct].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(MAN[2]!.ct).toContain('13b9')
  })

  it('câu F♯13♭9: gợi ý đúng quy luật, chấm tay phải theo lớp cao độ', () => {
    const cau = taoCau(ct('13b9'), 6)
    expect(cau.goiY).toBe('tay phải trên bậc 6 · trưởng')
    expect(cau.chong.nhan.phai).toBe('D♯')
    expect(dungTayPhai([63, 67, 70], cau.chong)).toBe(true) // Mi♭ Sol Si♭ = D♯ trưởng, thế nào cũng được
    expect(dungTayPhai([75, 79, 82], cau.chong)).toBe(true)
    expect(dungTayPhai([...cau.chong.trai, ...cau.chong.phai], cau.chong)).toBe(true)
    expect(dungTayPhai([63, 66, 70], cau.chong)).toBe(false) // D♯ thứ — là F♯13, không phải 13♭9
    expect(soCanCham(cau.chong, false)).toBe(3)
  })

  it('hai tay (Khó): đủ nốt và bass là gốc', () => {
    const c = taoCau(ct('13b9'), 0).chong
    expect(dungHaiTay([48, 52, 58, 69, 73, 76], c)).toBe(true)
    expect(dungHaiTay([52, 58, 60, 69, 73, 76], c)).toBe(false)
  })

  it('chọn câu: công thức vừa sai nặng hơn, không lặp câu vừa rồi', () => {
    const sai = new Map([['m9', 10]])
    expect(chonCau(['maj9', 'm9', '9'], [0], sai, null, () => 0.5).ct.id).toBe('m9') // nặng 1 · 21 · 1
    expect(chonCau(['maj9', 'm9'], [0], new Map(), 'maj9', () => 0.1).ct.id).toBe('m9')
  })

  it('bốn lựa chọn tên: đủ 4, không trùng, có đáp án, câu hợp âm ba không lẫn chùm nốt', () => {
    for (const id of ['13b9', 'maj7', 'm11', 'add9']) {
      const cau = taoCau(ct(id), 2)
      const ds = luaChonTen(cau, () => 0.3)
      expect(ds).toHaveLength(4)
      expect(new Set(ds).size).toBe(4)
      expect(ds).toContain(cau.chong.nhan.phai)
      if (id !== 'add9') expect(ds.some((x) => x.startsWith('chùm'))).toBe(false)
    }
  })

  it('điểm và tốc độ', () => {
    expect([diemCau(0), diemCau(4), diemCau(5), diemCau(12)]).toEqual([10, 10, 20, 30])
    expect(thoiGianRoi('de', 0)).toBe(14000)
    expect(thoiGianRoi('vua', 10)).toBeLessThan(thoiGianRoi('vua', 0))
    expect(thoiGianRoi('kho', 200)).toBe(4000)
  })
})
