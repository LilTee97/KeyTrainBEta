import { describe, expect, it } from 'vitest'
import { readSnapshot, titleFromText } from '../songSnapshot'

describe('đọc lại ảnh chụp đã lưu', () => {
  const valid = { version: 1, sourceText: 'C G\nHôm qua' }

  it('ảnh chụp đúng phiên bản thì đọc được', () => {
    expect(readSnapshot(valid)).toEqual(valid)
  })

  it('bài lưu từ bản cũ chưa có ảnh chụp thì bỏ qua, không vỡ', () => {
    expect(readSnapshot(undefined)).toBeNull()
    expect(readSnapshot(null)).toBeNull()
  })

  it('phiên bản lạ thì bỏ qua', () => {
    // Bài đã lưu sống lâu hơn code, nên phải chịu được cấu trúc không đọc nổi
    expect(readSnapshot({ ...valid, version: 99 })).toBeNull()
  })

  it('thiếu lời gốc thì bỏ qua', () => {
    // Không có lời thì không dựng lại được gì cả
    expect(readSnapshot({ version: 1 })).toBeNull()
  })

  it('không phải đối tượng thì bỏ qua', () => {
    expect(readSnapshot('C G Am')).toBeNull()
    expect(readSnapshot(7)).toBeNull()
  })
})

describe('đặt tên bài từ lời', () => {
  it('lấy dòng đầu tiên có chữ', () => {
    expect(titleFromText('Người Ấy\nC G\nHôm qua')).toBe('Người Ấy')
  })

  it('bỏ qua dòng trống ở đầu', () => {
    expect(titleFromText('\n\n  Người Ấy\nC G')).toBe('Người Ấy')
  })

  it('bỏ qua tên đoạn trong ngoặc vuông', () => {
    // "[Phiên khúc]" là nhãn cấu trúc, không phải tên bài
    expect(titleFromText('[Phiên khúc]\nHôm qua anh thấy')).toBe(
      'Hôm qua anh thấy',
    )
  })

  it('cắt bớt dòng quá dài', () => {
    const title = titleFromText('x'.repeat(200))

    expect(title.length).toBeLessThanOrEqual(61)
    expect(title.endsWith('…')).toBe(true)
  })

  it('không có dòng nào thì vẫn ra một cái tên', () => {
    // Hai bài không tên vẫn phải phân biệt được với nhau
    expect(titleFromText('   \n\n')).toContain('Bài ngày')
  })
})
