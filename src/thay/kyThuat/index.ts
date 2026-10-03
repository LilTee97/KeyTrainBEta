import type { TeacherId } from '../teachers'
import { CHAY_TRAI_LINH_NHI } from './chayTraiLinhNhi'
import { GIAT_CA_PHAO } from './giatCaPhao'
import type { KyThuat } from './kyThuat'
import { LICK_BE_BLUES } from './lickBeBlues'

/** Mọi kỹ thuật của tab Kỹ thuật đánh. Thầy không có kỹ thuật nào thì tab ẩn (câu E, 2/10/2026) — Tuấn: chưa có sheet. */
export const KY_THUAT: readonly KyThuat[] = [GIAT_CA_PHAO, CHAY_TRAI_LINH_NHI, LICK_BE_BLUES]

export function kyThuatCua(thay: TeacherId): KyThuat[] {
  return KY_THUAT.filter((kt) => kt.thay === thay)
}
