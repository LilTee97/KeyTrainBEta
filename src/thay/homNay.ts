import { getStyle } from '../reharm/style/styleLibrary'
import type { LuotTap } from '../shared/persistence/db'
import { bacKeTiep, tienDoBai, type TienDoBai } from './loTrinh'
import { TEACHERS, THU_TU_TAP, type TeacherId } from './teachers'

/**
 * Buổi tập hôm nay — trang Hôm nay (`Reference/KE-HOACH-LUYEN-TAP.md` mục 1.7, GĐ 1 bước 8). Hàm thuần đọc nhật ký lượt tập.
 *
 * Thứ tự trên trang là lời gia sư: LƯỢT NGUỘI trước (mỗi bài một lượt, chưa khởi động — tập bậc khác của bài ấy trước thì tay đã
 * nóng), rồi bài ĐANG HỌC, rồi mới tới BÀI MỚI.
 */

/** Học song song tối đa chừng này bài chưa tới tempo thật (bậc 6) — quyết định của Claude trong vai gia sư, chưa đo. */
export const HOC_TOI_DA = 2

export interface MucHomNay {
  styleId: string
  thay: TeacherId
  /** Bậc nên tập. */
  bac: number
  tienDo: TienDoBai
}

export interface KeHoachHomNay {
  /** Lượt nguội chưa làm hôm nay — xác nhận Đã thuộc, hay kiểm lại bậc thuộc cao nhất. */
  nguoi: (MucHomNay & { viec: 'xac-nhan' | 'kiem-lai' })[]
  /** Lượt nguội đã làm hôm nay. */
  daNguoi: (MucHomNay & { dat: boolean })[]
  /** Bài đã bắt đầu, chưa qua hết 7 bậc — bậc kế tiếp. */
  dangHoc: MucHomNay[]
  /** Bài mới nên mở (bài dễ nhất chưa tập) — `null` khi đang học đủ `HOC_TOI_DA` bài chưa qua bậc 6, hay đã mở hết. */
  baiMoi: string | null
  /** Số bài đang học chưa qua bậc 6 — để nói vì sao chưa mở bài mới. */
  dangHocDuoi6: number
}

export function thayCua(styleId: string): TeacherId {
  return TEACHERS.find((teacher) => teacher.styleIds.includes(styleId))?.id ?? 'ca-phao'
}

/** Tên ngắn của bài — tên nút trên bảng chọn điệu (vd "Bolero Tuấn"), không phải tên video nguồn. */
export function tenBai(styleId: string): string {
  return getStyle(styleId)?.familyName ?? styleId
}

const daQua = (tt: string | undefined) => tt === 'qua' || tt === 'thuoc'

export function keHoachHomNay(luot: readonly LuotTap[], homNay: string): KeHoachHomNay {
  const ke: KeHoachHomNay = { nguoi: [], daNguoi: [], dangHoc: [], baiMoi: null, dangHocDuoi6: 0 }
  let chuaTap: string | null = null
  for (const styleId of THU_TU_TAP) {
    const tienDo = tienDoBai(luot, styleId, homNay)
    const muc = { styleId, thay: thayCua(styleId), tienDo }
    if (tienDo.bacNguoi !== null) {
      ke.nguoi.push({ ...muc, bac: tienDo.bacNguoi, viec: tienDo.bacNguoi > tienDo.thuocCaoNhat ? 'xac-nhan' : 'kiem-lai' })
    }
    if (tienDo.nguoiHomNay) ke.daNguoi.push({ ...muc, bac: tienDo.nguoiHomNay.bac, dat: tienDo.nguoiHomNay.dat })
    const daTap = luot.some((one) => one.styleId === styleId)
    if (!daTap) {
      chuaTap ??= styleId
      continue
    }
    if (!tienDo.trangThai.every(daQua)) ke.dangHoc.push({ ...muc, bac: bacKeTiep(tienDo.trangThai) })
    if (!daQua(tienDo.trangThai[5])) ke.dangHocDuoi6 += 1
  }
  ke.baiMoi = ke.dangHocDuoi6 < HOC_TOI_DA ? chuaTap : null
  return ke
}
