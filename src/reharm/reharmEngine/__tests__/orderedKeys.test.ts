import { describe, expect, it } from 'vitest'
import { keyLabel, orderedKeys } from '../keyDetection'

/**
 * Ô chọn giọng bày theo **bộ khoá**, không bày theo điểm khớp.
 *
 * `detectKey` trả về danh sách xếp theo mức khớp với vòng hợp âm — hợp lý cho
 * việc đoán, nhưng bày lên ô chọn thì nhìn như xếp lung tung.
 */

describe('thứ tự các giọng trong ô chọn', () => {
  const keys = orderedKeys()

  it('có đủ hai mươi tư giọng, không trùng nhau', () => {
    expect(keys).toHaveLength(24)

    const ids = keys.map((key) => `${key.tonic}:${key.scale}`)
    expect(new Set(ids).size).toBe(24)
  })

  it('mở đầu bằng Đô trưởng và La thứ', () => {
    // Bộ khoá không dấu, chỗ ai cũng tìm trước tiên
    expect(keyLabel(keys[0].tonic, keys[0].scale)).toBe('C trưởng')
    expect(keyLabel(keys[1].tonic, keys[1].scale)).toBe('A thứ')
  })

  it('mỗi giọng trưởng đi liền giọng thứ song song của nó', () => {
    // Phân vân giữa trưởng và thứ thì hai lựa chọn nằm ngay cạnh nhau
    for (let index = 0; index < keys.length; index += 2) {
      const major = keys[index]
      const minor = keys[index + 1]

      expect(major.scale).toBe('major')
      expect(minor.scale).toBe('minor')
      expect((major.tonic - minor.tonic + 12) % 12).toBe(3)
    }
  })

  it('các giọng trưởng đi theo vòng quãng năm', () => {
    const majors = keys.filter((key) => key.scale === 'major')

    for (let index = 1; index < majors.length; index += 1) {
      const step = (majors[index].tonic - majors[index - 1].tonic + 12) % 12
      expect(step).toBe(7)
    }
  })

  it('phủ hết mười hai nốt gốc ở cả hai tính chất', () => {
    for (const scale of ['major', 'minor'] as const) {
      const roots = keys.filter((key) => key.scale === scale).map((k) => k.tonic)
      expect(new Set(roots).size).toBe(12)
    }
  })
})
