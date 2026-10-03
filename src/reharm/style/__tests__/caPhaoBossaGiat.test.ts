import { describe, expect, it } from 'vitest'
import { getStyle } from '../styleLibrary'
import { CA_PHAO_BOSSA_IMPROVED, giatKieuCaPhao } from '../styleLibrary/caPhaoBossa'

describe('Bossa CP — giật kiểu Cà Pháo (ô tick nghe thử 3/10/2026)', () => {
  it('chỉ CHÁT 11 (tay phải, phách 4 ô B) ngắn lại một nửa; mọi cú khác giữ nguyên', () => {
    const giat = giatKieuCaPhao(CA_PHAO_BOSSA_IMPROVED)
    const cu = CA_PHAO_BOSSA_IMPROVED.cell!
    expect(giat.cell!.left).toEqual(cu.left)
    const doi = giat.cell!.right.filter((hit, i) => hit.durationBeats !== cu.right[i]!.durationBeats)
    expect(doi.map((hit) => [hit.beat, hit.durationBeats])).toEqual([[7, 0.25]])
  })

  it('điệu khác không đổi', () => {
    const khac = getStyle('twist')!
    expect(giatKieuCaPhao(khac)).toBe(khac)
  })
})
