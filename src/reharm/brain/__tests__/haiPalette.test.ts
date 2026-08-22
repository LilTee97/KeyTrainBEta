import { describe, expect, it } from 'vitest'
import { deriveHaiPalette, haiPalette } from '../haiPalette'
import { brain } from '../index'

describe('bảng màu thầy Hải', () => {
  it('đọc ra được từ kho, đúng thứ thầy dùng nhiều nhất', () => {
    const p = haiPalette()
    expect(p).not.toBeNull()
    expect(p).toMatchObject({ major: 'maj7', minor: 'm7', dominant: '7', susDominant: false })
  })

  it('chỉ đếm item extracted của hai-joseph', () => {
    const others = brain().items.filter((i) => i.source?.teacher_id !== 'hai-joseph')
    expect(deriveHaiPalette(others)).toBeNull()
  })

  it('kho trống thì trả null chứ không đoán bừa', () => {
    expect(deriveHaiPalette([])).toBeNull()
  })
})
