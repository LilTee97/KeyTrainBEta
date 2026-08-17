import type { StylePattern } from '../types'
import { BALLAD } from './ballad'
import { BOSSA_NOVA } from './bossaNova'
import { SWING } from './swing'
import { VALSE } from './valse'

/**
 * Thư viện điệu đệm.
 *
 * Chia làm hai nhóm rõ ràng, theo đúng yêu cầu ở mục 19.3 của tài liệu nguồn:
 * điệu đã xem tận mắt từ video, và điệu chỉ nghe tên qua kiến thức nhạc lý phổ
 * thông. Nhóm thứ hai để `cell` bằng null và `verified` bằng false, nên KeyTrain
 * **không bao giờ bịa ra mẫu tiết tấu** cho điệu chưa kiểm chứng — thà báo là
 * chưa có còn hơn dạy sai.
 *
 * ## Thêm một điệu, hoặc xác thực một điệu đang treo
 *
 * - **Điệu đang treo** (bolero, slow rock, cha cha, march): khi có bản ký âm,
 *   điền `cell` và đổi `verified: true` ngay tại chỗ khai bên dưới. Không đụng
 *   file nào khác — giao diện tự bỏ làm mờ.
 * - **Điệu hoàn toàn mới**: thêm một file cạnh `ballad.ts`, rồi đăng ký vào
 *   `VERIFIED_STYLES`. Hết.
 *
 * Lưu ý một chỗ chưa ai thử: `renderPattern` mới chạy qua nhịp 4/4 và 3/4.
 * Nhịp 6/8 và 2/4 có thể cần chỉnh, nên khi xác thực điệu ở nhịp đó thì nghe
 * kỹ trước khi tin.
 */

/** Các điệu đã xác nhận trực tiếp từ video của kênh. */
export const VERIFIED_STYLES: readonly StylePattern[] = [
  BALLAD,
  BOSSA_NOVA,
  VALSE,
  SWING,
]

/**
 * Các điệu phổ biến khác, chưa xác nhận được mẫu tiết tấu từ nguồn.
 *
 * Liệt kê để người dùng thấy lộ trình, và để khung phân loại theo nhịp có chỗ
 * mở rộng. Chưa chơi được cho tới khi có người xem video và notate lại mẫu.
 */
export const UNVERIFIED_STYLES: readonly StylePattern[] = [
  {
    id: 'bolero',
    name: 'Bolero',
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    feel: 'straight-block-chord',
    verified: false,
    cell: null,
    note: 'Chưa có mẫu tiết tấu xác thực từ nguồn.',
  },
  {
    id: 'slow-rock',
    name: 'Slow Rock',
    timeSignature: '6/8',
    beatsPerMeasure: 6,
    feel: 'swing',
    verified: false,
    cell: null,
    note: 'Chưa có mẫu tiết tấu xác thực từ nguồn.',
  },
  {
    id: 'cha-cha',
    name: 'Cha Cha Cha',
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    feel: 'syncopated-3-3-2',
    verified: false,
    cell: null,
    note: 'Chưa có mẫu tiết tấu xác thực từ nguồn.',
  },
  {
    id: 'march',
    name: 'March',
    timeSignature: '2/4',
    beatsPerMeasure: 2,
    feel: 'straight-block-chord',
    verified: false,
    cell: null,
    note: 'Chưa có mẫu tiết tấu xác thực từ nguồn.',
  },
]

export const ALL_STYLES: readonly StylePattern[] = [
  ...VERIFIED_STYLES,
  ...UNVERIFIED_STYLES,
]

export function getStyle(id: string): StylePattern | undefined {
  if (id === 'ballad-pre' || id === 'ballad-chorus') return BALLAD
  return ALL_STYLES.find((style) => style.id === id)
}

/**
 * Điệu này có chơi được không.
 *
 * Ballad chơi được dù `cell` bằng null, vì tài liệu đã xác nhận nguyên tắc
 * đệm của nó (hợp âm khối bám nhịp đổi hợp âm). Điệu chưa xác thực thì không.
 */
export function isPlayable(style: StylePattern): boolean {
  return style.verified
}

export { BALLAD, BOSSA_NOVA, SWING, VALSE }
export { balladCellFor } from './ballad'
