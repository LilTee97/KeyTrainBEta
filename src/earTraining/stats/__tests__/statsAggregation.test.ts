import { describe, expect, it } from 'vitest'
import type { StatsEvent } from '../../../shared/persistence/db'
import {
  filterByKind,
  percentOf,
  summarizeByCategory,
  summarizeByDay,
  summarizeTotals,
} from '../statsAggregation'

/** Dựng một lần trả lời với các giá trị hợp lý. */
function event(overrides: Partial<StatsEvent> = {}): StatsEvent {
  return {
    timestamp: Date.now(),
    day: '2026-08-14',
    mode: 'practice',
    itemKind: 'chord',
    category: 'Hợp âm ba',
    correct: true,
    responseMs: 2000,
    ...overrides,
  }
}

describe('summarizeTotals', () => {
  it('không có dữ liệu thì mọi số bằng không', () => {
    expect(summarizeTotals([])).toEqual({
      correct: 0,
      total: 0,
      accuracy: 0,
      averageResponseMs: 0,
    })
  })

  it('đếm đúng số câu đúng và tổng số câu', () => {
    const summary = summarizeTotals([
      event({ correct: true }),
      event({ correct: false }),
      event({ correct: true }),
    ])

    expect(summary.correct).toBe(2)
    expect(summary.total).toBe(3)
  })

  it('tính đúng tỉ lệ đúng', () => {
    const summary = summarizeTotals([
      event({ correct: true }),
      event({ correct: false }),
    ])
    expect(summary.accuracy).toBe(0.5)
  })

  it('tính trung bình thời gian trả lời', () => {
    const summary = summarizeTotals([
      event({ responseMs: 1000 }),
      event({ responseMs: 3000 }),
    ])
    expect(summary.averageResponseMs).toBe(2000)
  })

  it('làm tròn thời gian trung bình về số nguyên', () => {
    const summary = summarizeTotals([
      event({ responseMs: 1000 }),
      event({ responseMs: 1001 }),
    ])
    expect(Number.isInteger(summary.averageResponseMs)).toBe(true)
  })

  it('đúng hết thì tỉ lệ bằng một', () => {
    expect(summarizeTotals([event(), event()]).accuracy).toBe(1)
  })
})

describe('summarizeByCategory', () => {
  it('gom theo đúng nhóm', () => {
    const rows = summarizeByCategory([
      event({ category: 'Hợp âm ba' }),
      event({ category: 'Hợp âm bảy' }),
      event({ category: 'Hợp âm ba' }),
    ])

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.total).reduce((a, b) => a + b)).toBe(3)
  })

  it('xếp nhóm yếu nhất lên đầu', () => {
    const rows = summarizeByCategory([
      // Nhóm giỏi: đúng cả hai
      event({ category: 'Giỏi', correct: true }),
      event({ category: 'Giỏi', correct: true }),
      // Nhóm yếu: sai cả hai
      event({ category: 'Yếu', correct: false }),
      event({ category: 'Yếu', correct: false }),
    ])

    expect(rows[0].category).toBe('Yếu')
    expect(rows[1].category).toBe('Giỏi')
  })

  it('cùng tỉ lệ thì nhóm luyện nhiều hơn xếp trước', () => {
    const rows = summarizeByCategory([
      event({ category: 'Ít', correct: true }),
      event({ category: 'Nhiều', correct: true }),
      event({ category: 'Nhiều', correct: true }),
      event({ category: 'Nhiều', correct: true }),
    ])

    expect(rows[0].category).toBe('Nhiều')
  })

  it('không có dữ liệu thì trả về danh sách rỗng', () => {
    expect(summarizeByCategory([])).toEqual([])
  })

  it('mỗi nhóm tính riêng thời gian trung bình', () => {
    const rows = summarizeByCategory([
      event({ category: 'Nhanh', responseMs: 500 }),
      event({ category: 'Chậm', responseMs: 8000 }),
    ])

    const fast = rows.find((row) => row.category === 'Nhanh')
    const slow = rows.find((row) => row.category === 'Chậm')
    expect(fast?.averageResponseMs).toBe(500)
    expect(slow?.averageResponseMs).toBe(8000)
  })
})

describe('summarizeByDay', () => {
  it('gom theo ngày và xếp ngày mới nhất lên đầu', () => {
    const rows = summarizeByDay([
      event({ day: '2026-08-13' }),
      event({ day: '2026-08-15' }),
      event({ day: '2026-08-14' }),
    ])

    expect(rows.map((row) => row.day)).toEqual([
      '2026-08-15',
      '2026-08-14',
      '2026-08-13',
    ])
  })

  it('gộp nhiều câu trong cùng một ngày', () => {
    const rows = summarizeByDay([
      event({ day: '2026-08-14', correct: true }),
      event({ day: '2026-08-14', correct: false }),
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0].total).toBe(2)
    expect(rows[0].correct).toBe(1)
  })
})

describe('filterByKind', () => {
  it('tách được hợp âm rời và vòng hợp âm', () => {
    const events = [
      event({ itemKind: 'chord' }),
      event({ itemKind: 'progression' }),
      event({ itemKind: 'chord' }),
    ]

    expect(filterByKind(events, 'chord')).toHaveLength(2)
    expect(filterByKind(events, 'progression')).toHaveLength(1)
  })
})

describe('percentOf', () => {
  it('đổi tỉ lệ thành phần trăm đã làm tròn', () => {
    expect(percentOf({ correct: 1, total: 3, accuracy: 1 / 3, averageResponseMs: 0 })).toBe(33)
    expect(percentOf({ correct: 2, total: 3, accuracy: 2 / 3, averageResponseMs: 0 })).toBe(67)
  })
})
