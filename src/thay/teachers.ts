/**
 * Bốn thầy của Lộ trình tập và điệu của mỗi thầy — `Reference/KE-HOACH-LUYEN-TAP.md` mục 4c (ý người dùng 2/10/2026:
 * trang Cà Pháo · Linh Nhi · Tuấn · Blues; Blues coi như một thầy).
 *
 * Mỗi nút một bài. Có em chờ, Để em từng có bài điệp riêng (khác tiết tấu) — người dùng 2/10/2026 bỏ tiết tấu điệp của hai nút
 * này; Slow Rock Lá thư, Slow Blues điệp chỉ khác chút nên vốn chỉ lấy phiên.
 *
 * Thứ tự = THỨ TỰ TẬP, dễ trước — đo độ khó 2/10/2026 (`tools/doKhoBaiTap.mjs`, `SO-TAY.md` cùng ngày): cộng hạng 6 chỉ số trên
 * vòng tập, vòng kiểm ra cùng thứ tự. Đo lại sau khi bỏ hai bài điệp (9 bài): Để em 35,0 · Có em chờ 36,5 (vòng kiểm hoà 34,0) —
 * sát nhau, thứ tự giữa hai bài ấy không chắc. Cũ: thứ tự trên bảng chọn.
 */
export type TeacherId = 'ca-phao' | 'linh-nhi' | 'tuan' | 'blues'

export interface Teacher {
  id: TeacherId
  label: string
  /** Id điệu (`StylePattern.id`) — mỗi id là một bài tập điệu. */
  styleIds: readonly string[]
}

export const TEACHERS: readonly Teacher[] = [
  {
    id: 'ca-phao',
    label: 'Cà Pháo',
    styleIds: [
      'ca-phao-ballad-cu-di',
      'ca-phao-ballad-de-em-roi-xa',
      'ca-phao-ballad-co-em-cho',
      'ca-phao-bossa-improved',
    ],
  },
  { id: 'linh-nhi', label: 'Linh Nhi', styleIds: ['slow-rock-la-thu-hai-tay'] },
  { id: 'tuan', label: 'Tuấn', styleIds: ['bolero-tu-n-improv-bai-04-00001', 'tango-tu-n-improv-bai-04-00004'] },
  { id: 'blues', label: 'Blues', styleIds: ['twist', 'blue-sun'] },
]
