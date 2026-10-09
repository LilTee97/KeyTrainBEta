import { describe, expect, it } from 'vitest'
import { BAM_THAY, hopTheoNot, LOI_BAM_THAY, ngonGoiY } from './bamNhuThay'

const so = (k: 'linh-nhi' | 'ca-phao' | 'blues') => BAM_THAY[k].so
const dem = (ds: [string, number][], k: string) => ds.find((x) => x[0] === k)?.[1]

describe('bấm như thầy', () => {
  it('ngón gợi ý: hợp âm ba ba thế, bốn nốt, tay trái soi gương', () => {
    expect(ngonGoiY([60, 64, 67], 'phai')).toEqual([1, 3, 5])
    expect(ngonGoiY([64, 67, 72], 'phai')).toEqual([1, 2, 5])
    expect(ngonGoiY([67, 72, 76], 'phai')).toEqual([1, 3, 5])
    expect(ngonGoiY([60, 64, 65, 69], 'phai')).toEqual([1, 2, 3, 5])
    expect(ngonGoiY([36, 43, 48], 'trai')).toEqual([5, 3, 1])
    expect(ngonGoiY([36, 43, 48, 52], 'trai')).toEqual([5, 3, 2, 1])
    expect(ngonGoiY([38], 'trai')).toEqual([5])
    expect(ngonGoiY([60, 61, 62, 63, 64, 65], 'phai')).toBeNull()
  })

  it('tên theo nốt bấm thật: verse Người Hãy Quên Em Đi ra Dm9 · Gm7 · C9 — đúng như đã soát tay', () => {
    const d = BAM_THAY['ca-phao'].doan.find((x) => x.bai === 'Người hãy quên em đi' && x.doan === 'verse')!
    const ten = d.hop.map((h, k) => hopTheoNot(d.tonic, h, d.the[k]!).chat)
    expect(ten.slice(0, 3)).toEqual(['m9', 'm7', '9'])
    expect(d.the[0]!.phai).toEqual([60, 64, 65, 69])
  })

  it('mọi con số trong lời đọc kết quả đúng với số đo', () => {
    const ln = so('linh-nhi')
    expect([dem(ln.trai_dau, '0'), dem(ln.trai_dau, '0-12'), ln.co_trai, dem(ln.trai_mau, '0-7-12')]).toEqual([500, 123, 672, 73])
    expect(dem(ln.trai_mau, '0-7-12-16')! + dem(ln.trai_mau, '0-7-12-15')!).toBe(79)
    expect([ln.co_phai, ln.khuc, dem(ln.phai_day, '1'), dem(ln.phai_day, '5'), dem(ln.phai_day, '3')! + dem(ln.phai_day, '♭3')!, ln.phai_kep]).toEqual([139, 676, 40, 36, 32, 43])
    expect([dem(ln.bass_bac, '1'), dem(ln.bass_bac, '5'), ln.slash.find((x) => x[0] === 'v/♭3')?.[1]]).toEqual([485, 53, 17])
    expect(LOI_BAM_THAY['linh-nhi']).toContain('485/672 (72%)')
    const cp = so('ca-phao')
    expect([dem(cp.trai_dau, '0'), cp.co_trai, cp.co_phai, cp.khuc, dem(cp.phai_day, '♭7'), dem(cp.phai_day, '9'), dem(cp.phai_day, '4'), cp.phai_kep]).toEqual([
      345, 430, 254, 438, 46, 17, 17, 116,
    ])
    expect([cp.chuyen.giu, cp.chuyen.n, cp.chuyen.doi_tb]).toEqual([77, 147, 3.1])
    const bl = so('blues')
    expect([dem(bl.trai_dau, '0'), dem(bl.trai_dau, '0-12'), bl.co_trai, dem(bl.phai_day, '♭7'), bl.co_phai, bl.chuyen.giu, bl.chuyen.n, bl.chuyen.doi_tb]).toEqual([
      120, 73, 224, 22, 113, 39, 66, 2.7,
    ])
  })

  it('đoạn đánh theo: nốt thật đủ hai tay, Linh Nhi chỉ một đoạn', () => {
    expect(BAM_THAY['linh-nhi'].doan).toHaveLength(1)
    for (const k of ['linh-nhi', 'ca-phao', 'blues'] as const)
      for (const d of BAM_THAY[k].doan) {
        expect(d.the).toHaveLength(d.hop.length)
        for (const t of d.the) expect(t.trai.length > 0 && t.phai.length >= 3).toBe(true)
      }
  })
})
