import { describe, expect, it } from 'vitest'
import { keyLabel, orderedKeys } from '../keyDetection'

/**
 * Ô chọn giọng bày theo thứ tự từ C, ghép cặp trưởng/thứ.
 */

describe('thứ tự các giọng trong ô chọn', () => {
  const keys = orderedKeys()

  it('có đủ hai mươi tư giọng, không trùng nhau', () => {
    expect(keys).toHaveLength(24)

    const ids = keys.map((key) => `${key.tonic}:${key.scale}`)
    expect(new Set(ids).size).toBe(24)
  })

  it('mở đầu bằng C và Am', () => {
    // Bắt đầu từ Đô
    expect(keyLabel(keys[0].tonic, keys[0].scale)).toBe('C')
    expect(keyLabel(keys[1].tonic, keys[1].scale)).toBe('Am')
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

  it('các giọng trưởng đi theo thứ tự từ C (nửa cung)', () => {
    const majors = keys.filter((key) => key.scale === 'major')

    for (let index = 1; index < majors.length; index += 1) {
      const step = (majors[index].tonic - majors[index - 1].tonic + 12) % 12
      expect(step).toBe(1)
    }
  })

  it('giọng giáng viết bằng giáng', () => {
    expect(keyLabel(8, 'major')).toBe('Ab')
    expect(keyLabel(10, 'major')).toBe('Bb')
  })

  it('phủ hết mười hai nốt gốc ở cả hai tính chất', () => {
    for (const scale of ['major', 'minor'] as const) {
      const roots = keys.filter((key) => key.scale === scale).map((k) => k.tonic)
      expect(new Set(roots).size).toBe(12)
    }
  })
})
