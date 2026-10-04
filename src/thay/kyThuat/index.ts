import type { TeacherId } from '../teachers'
import { BE_QUANG_4_CA_PHAO } from './beQuang4CaPhao'
import { CHAY_TRAI_LINH_NHI } from './chayTraiLinhNhi'
import { FILL_CA_PHAO } from './fillCaPhao'
import { GIAT_CA_PHAO } from './giatCaPhao'
import { LAY_BLUES } from './layBlues'
import { LAY_CA_PHAO } from './layCaPhao'
import { LAY_LINH_NHI } from './layLinhNhi'
import type { KyThuat } from './kyThuat'
import { LICK_BE_BLUES } from './lickBeBlues'

/**
 * Mọi kỹ thuật của tab Kỹ thuật đánh, mỗi thầy xếp dễ trước (vai gia sư): bè → láy → giật → câu dài. Thầy không có kỹ thuật nào thì tab ẩn
 * (câu E, 2/10/2026) — Tuấn: chưa có sheet.
 */
export const KY_THUAT: readonly KyThuat[] = [
  BE_QUANG_4_CA_PHAO,
  LAY_CA_PHAO,
  GIAT_CA_PHAO,
  FILL_CA_PHAO,
  CHAY_TRAI_LINH_NHI,
  LAY_LINH_NHI,
  LICK_BE_BLUES,
  LAY_BLUES,
]

export function kyThuatCua(thay: TeacherId): KyThuat[] {
  return KY_THUAT.filter((kt) => kt.thay === thay)
}
