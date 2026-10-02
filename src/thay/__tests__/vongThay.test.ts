import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../reharm/input/chordInputParser'
import { GOC, LOAI, kieuDau, soanVong, vongMau } from '../vongThay'

describe('vòng tự tạo', () => {
  it('mọi thầy có vòng mẫu cả trưởng lẫn thứ; Tuấn dùng kho Linh Nhi', () => {
    for (const thay of ['ca-phao', 'linh-nhi', 'tuan', 'blues'] as const) {
      expect(vongMau(thay, false).length, thay).toBeGreaterThan(0)
      expect(vongMau(thay, true).length, thay).toBeGreaterThan(0)
    }
    expect(vongMau('tuan', true)).toBe(vongMau('linh-nhi', true))
  })

  it('dịch vòng sang hợp âm chủ được chọn — Rê thứ: vòng La thứ lên 5 nửa cung', () => {
    const goc = vongMau('ca-phao', true)[0]!
    const re = soanVong('ca-phao', 2, true, 0)!
    expect(re.hopAm).toHaveLength(4)
    const g = (s: string) => parseChordInput(s).chords[0]!.root
    goc.hopAm.forEach((c, i) => expect((g(re.hopAm[i]!) - g(c) + 12) % 12).toBe(5))
  })

  it('soạn lại thì xoay sang vòng khác của kho, hết kho thì quay về đầu', () => {
    const n = vongMau('ca-phao', true).length
    expect(soanVong('ca-phao', 9, true, 1)!.hopAm).not.toEqual(soanVong('ca-phao', 9, true, 0)!.hopAm)
    expect(soanVong('ca-phao', 9, true, n)!.hopAm).toEqual(soanVong('ca-phao', 9, true, 0)!.hopAm)
  })

  it('giọng giáng ghi tên giáng: Fa trưởng có Bb, không A#', () => {
    expect(kieuDau(5, false)).toBe('flat')
    expect(kieuDau(7, false)).toBe('sharp')
    expect(kieuDau(2, true)).toBe('flat') // Rê thứ = hoá biểu Fa trưởng
    expect(soanVong('blues', 5, false, 1)!.hopAm).toContain('Bb7')
  })

  it('mọi loại hợp âm của bộ chọn đều đọc được', () => {
    for (const goc of GOC) {
      for (const loai of LOAI) {
        const parsed = parseChordInput(`${goc}${loai.kyHieu}`).chords
        expect(parsed, `${goc}${loai.kyHieu}`).toHaveLength(1)
      }
    }
  })
})
