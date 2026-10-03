import { describe, expect, it } from 'vitest'
import { getStyle } from '../../reharm/style/styleLibrary'
import { THU_TU_TAP } from '../teachers'

/**
 * Mục 1.6 (`Reference/KE-HOACH-LUYEN-TAP.md`) — bài tập là bản ĐÓNG BĂNG: báo khi điệu của một bài đã duyệt bị sửa.
 *
 * Ảnh chụp phần NHẠC của điệu (ô đệm, nhịp độ, nhịp, cờ…) — bỏ chữ mô tả. ĐỎ = điệu đã khác lúc người dùng duyệt bài tập (2/10/2026):
 * tab Tái hòa âm chơi một đằng, bài tập ở tab Điệu một nẻo. Cách xử: người dùng nghe lại điệu → sinh lại bài tập
 * (`node tools/sinhBaiTap.mjs --ghi-de`) → người dùng duyệt lại → mới cập nhật ảnh chụp (`npx vitest run -u`).
 *
 * ponytail: chỉ bắt sửa DỮ LIỆU điệu; sửa máy dựng (renderPattern, voicing, bộ soạn) không bắt được. Dựng lại trong Chrome rồi so
 * cũng không dùng được: tay phải Slow Blues mỗi lần dựng một bản khác (`tools/sinhBaiTap.mjs`).
 */
const CHU = new Set(['name', 'note', 'familyName', 'sourceVideos', 'verified'])

describe('bài tập đã duyệt — điệu chưa bị sửa (mục 1.6)', () => {
  for (const styleId of THU_TU_TAP) {
    it(styleId, () => {
      const style = getStyle(styleId)
      expect(style, `không còn điệu ${styleId}`).toBeDefined()
      const nhac = JSON.parse(JSON.stringify(style, (key, value) => (CHU.has(key) ? undefined : value)))
      expect(nhac).toMatchSnapshot()
    })
  }
})
