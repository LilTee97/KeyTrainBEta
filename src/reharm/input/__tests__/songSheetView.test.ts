import { describe, expect, it } from 'vitest'
import { selectedLineBounds } from '../SongSheetView'

describe('chọn dòng để đánh dấu đoạn', () => {
  it('giữ cả câu ở hai mép khi vùng bôi chỉ cắt các câu ở giữa', () => {
    expect(selectedLineBounds([1, 2], [0, 3])).toEqual({ from: 0, to: 3 })
  })
})
