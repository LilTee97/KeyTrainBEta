import { describe, expect, it } from 'vitest'
import {
  LICKS,
  fallbackLick,
  licksFor,
  type LickRole,
} from '../soloVocabulary'

/**
 * Vốn từ vựng phải tự mô tả đủ về mình.
 *
 * Bản trước giữ hai danh sách `OPENERS`/`MIDDLES` viết tay ở `soloGenerator.ts`,
 * tách rời khỏi chỗ định nghĩa mẫu. Thêm mẫu mà quên thêm vào danh sách thì mẫu
 * đó không bao giờ được chọn — và chuyện đó đã xảy ra thật: có lúc **nửa vốn từ
 * vựng nằm chết** mà chỉ phát hiện được khi in kết quả ra đọc.
 *
 * Nay vai trò khai ngay trong mẫu, danh sách suy ra từ đó. Nhóm test này giữ
 * cho việc thêm mẫu mới về sau chỉ cần sửa đúng một chỗ.
 */

const ROLES: LickRole[] = ['opener', 'middle', 'ending', 'rest']

describe('khai báo của từng mẫu câu', () => {
  it('mẫu nào cũng khai vai trò, nguồn và nhãn', () => {
    for (const lick of LICKS) {
      expect(lick.roles.length, lick.id).toBeGreaterThan(0)
      expect(lick.source.length, lick.id).toBeGreaterThan(0)
      expect(lick.label.length, lick.id).toBeGreaterThan(0)
    }
  })

  it('mọi vai trò khai ra đều hợp lệ', () => {
    for (const lick of LICKS) {
      for (const role of lick.roles) expect(ROLES).toContain(role)
    }
  })

  it('định danh không trùng nhau', () => {
    const ids = LICKS.map((lick) => lick.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('danh sách xoay suy ra từ vốn từ vựng', () => {
  it('mọi vai trò đều có ít nhất một mẫu đang dùng', () => {
    // Thiếu một vai trò là bộ sinh sẽ lùi về mẫu nền tảng ở chỗ đó
    for (const role of ROLES) {
      expect(licksFor(role).length, role).toBeGreaterThan(0)
    }
  })

  it('chỉ lấy mẫu đã bật, đúng thứ tự khai trong vốn từ vựng', () => {
    for (const role of ROLES) {
      const derived = licksFor(role).map((lick) => lick.id)
      const expected = LICKS.filter(
        (lick) => lick.inRotation && lick.roles.includes(role),
      ).map((lick) => lick.id)

      expect(derived).toEqual(expected)
    }
  })

  it('mẫu chưa bật không lọt vào danh sách nào', () => {
    const waiting = LICKS.filter((lick) => !lick.inRotation)
    expect(waiting.length).toBeGreaterThan(0)

    for (const role of ROLES) {
      const ids = licksFor(role).map((lick) => lick.id)
      for (const lick of waiting) expect(ids).not.toContain(lick.id)
    }
  })

  it('mẫu lùi về là mẫu kết câu, vì nó luôn kết ở nốt ổn định', () => {
    expect(fallbackLick().roles).toContain('ending')
    expect(fallbackLick().inRotation).toBe(true)
  })

  it('thứ tự xoay hiện tại đúng như đã nghe duyệt', () => {
    // Khoá lại để lần sắp xếp sau không đổi âm thanh mà không ai biết
    expect(licksFor('opener').map((lick) => lick.id)).toEqual([
      'arpeggio',
      'chord-tone',
      'sweep',
    ])
    expect(licksFor('middle').map((lick) => lick.id)).toEqual([
      'turn',
      'approach',
      'echo',
    ])
  })
})
