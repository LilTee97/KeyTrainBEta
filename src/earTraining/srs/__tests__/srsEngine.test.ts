import { describe, expect, it } from 'vitest'
import type { ReviewItem } from '../../../shared/persistence/db'
import {
  BOX_INTERVALS_DAYS,
  BOX_LABELS,
  MAX_BOX_LEVEL,
  accuracyOf,
  applyAnswer,
  chordItemId,
  countDue,
  createReviewItem,
  dueDateFor,
  isDue,
  isMastered,
  nextBoxLevel,
  progressionItemId,
  selectDueItems,
} from '../srsEngine'

const MS_PER_DAY = 24 * 60 * 60 * 1000
/** Mốc thời gian cố định để test không phụ thuộc lúc chạy. */
const DAY_ZERO = new Date(2026, 0, 1).getTime()

const days = (count: number) => DAY_ZERO + count * MS_PER_DAY

describe('cấu hình hộp', () => {
  it('có sáu mức, mỗi mức một tên gọi', () => {
    expect(BOX_INTERVALS_DAYS).toHaveLength(6)
    expect(BOX_LABELS).toHaveLength(6)
    expect(MAX_BOX_LEVEL).toBe(5)
  })

  it('hộp đầu tiên gặp lại ngay trong buổi', () => {
    expect(BOX_INTERVALS_DAYS[0]).toBe(0)
  })

  it('khoảng cách ôn tăng dần', () => {
    for (let level = 1; level < BOX_INTERVALS_DAYS.length; level += 1) {
      expect(BOX_INTERVALS_DAYS[level]).toBeGreaterThan(
        BOX_INTERVALS_DAYS[level - 1],
      )
    }
  })
})

describe('nextBoxLevel', () => {
  it('trả lời đúng thì lên một hộp', () => {
    expect(nextBoxLevel(0, true)).toBe(1)
    expect(nextBoxLevel(3, true)).toBe(4)
  })

  it('không vượt quá hộp cao nhất', () => {
    expect(nextBoxLevel(MAX_BOX_LEVEL, true)).toBe(MAX_BOX_LEVEL)
  })

  it('trả lời sai thì về thẳng hộp đầu, không phải lùi một hộp', () => {
    // Đây là điểm mấu chốt: sai nghĩa là chưa nhớ, phải gặp lại ngay,
    // chứ lùi từ 30 ngày xuống 14 ngày thì vẫn đợi hai tuần.
    expect(nextBoxLevel(MAX_BOX_LEVEL, false)).toBe(0)
    expect(nextBoxLevel(3, false)).toBe(0)
    expect(nextBoxLevel(0, false)).toBe(0)
  })

  it('chịu được mức hộp không hợp lệ', () => {
    expect(nextBoxLevel(-5, true)).toBe(1)
    expect(nextBoxLevel(99, true)).toBe(MAX_BOX_LEVEL)
  })
})

describe('dueDateFor', () => {
  it('hộp đầu đến hạn ngay lập tức', () => {
    expect(dueDateFor(0, DAY_ZERO)).toBe(DAY_ZERO)
  })

  it('các hộp sau cách đúng số ngày đã định', () => {
    expect(dueDateFor(1, DAY_ZERO)).toBe(days(1))
    expect(dueDateFor(2, DAY_ZERO)).toBe(days(3))
    expect(dueDateFor(5, DAY_ZERO)).toBe(days(30))
  })

  it('ép mức hộp về khoảng hợp lệ', () => {
    expect(dueDateFor(-1, DAY_ZERO)).toBe(dueDateFor(0, DAY_ZERO))
    expect(dueDateFor(99, DAY_ZERO)).toBe(dueDateFor(MAX_BOX_LEVEL, DAY_ZERO))
  })
})

describe('createReviewItem', () => {
  it('mục mới nằm ở hộp thấp nhất và đến hạn ngay', () => {
    const item = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)

    expect(item.boxLevel).toBe(0)
    expect(isDue(item, DAY_ZERO)).toBe(true)
    expect(item.totalReps).toBe(0)
    expect(item.correctStreak).toBe(0)
  })
})

describe('applyAnswer', () => {
  const item = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)

  it('trả lời đúng thì lên hộp và đẩy hạn ôn ra xa', () => {
    const after = applyAnswer(item, true, DAY_ZERO)

    expect(after.boxLevel).toBe(1)
    expect(after.nextDueAt).toBe(days(1))
    expect(after.correctStreak).toBe(1)
    expect(after.totalCorrect).toBe(1)
    expect(after.totalReps).toBe(1)
  })

  it('trả lời sai thì về hộp đầu và đứt chuỗi đúng', () => {
    const strong = { ...item, boxLevel: 4, correctStreak: 7 }
    const after = applyAnswer(strong, false, DAY_ZERO)

    expect(after.boxLevel).toBe(0)
    expect(after.correctStreak).toBe(0)
    expect(after.nextDueAt).toBe(DAY_ZERO)
  })

  it('sai vẫn được tính là một lần luyện', () => {
    const after = applyAnswer(item, false, DAY_ZERO)
    expect(after.totalReps).toBe(1)
    expect(after.totalCorrect).toBe(0)
  })

  it('giữ nguyên số liệu tích luỹ dù về hộp đầu', () => {
    // Một lần sai không xoá thành quả đã ghi nhận
    const experienced = { ...item, totalReps: 20, totalCorrect: 18, boxLevel: 5 }
    const after = applyAnswer(experienced, false, DAY_ZERO)

    expect(after.totalCorrect).toBe(18)
    expect(after.totalReps).toBe(21)
  })

  it('không sửa vào bản ghi cũ', () => {
    const before = { ...item }
    applyAnswer(item, true, DAY_ZERO)
    expect(item).toEqual(before)
  })
})

describe('mô phỏng nhiều ngày', () => {
  it('đúng liên tục sáu lần thì lên tới hộp cao nhất', () => {
    let item = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)
    let now = DAY_ZERO

    for (let round = 0; round < 6; round += 1) {
      // Ôn đúng vào ngày đến hạn
      now = item.nextDueAt
      item = applyAnswer(item, true, now)
    }

    expect(item.boxLevel).toBe(MAX_BOX_LEVEL)
    expect(item.correctStreak).toBe(6)
  })

  it('lịch ôn giãn ra đúng theo bảng khoảng cách', () => {
    let item = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)
    const gaps: number[] = []

    for (let round = 0; round < 5; round += 1) {
      const reviewedAt = item.nextDueAt
      item = applyAnswer(item, true, reviewedAt)
      gaps.push((item.nextDueAt - reviewedAt) / MS_PER_DAY)
    }

    expect(gaps).toEqual([1, 3, 7, 14, 30])
  })

  it('sai giữa chừng thì quay lại ôn ngay trong buổi', () => {
    let item = createReviewItem('chord:m7b5', 'chord', 'Nửa giảm', DAY_ZERO)

    // Đúng ba lần liên tiếp, đã lên hộp 3
    for (let round = 0; round < 3; round += 1) {
      item = applyAnswer(item, true, item.nextDueAt)
    }
    expect(item.boxLevel).toBe(3)

    // Rồi sai một lần
    const failedAt = item.nextDueAt
    item = applyAnswer(item, false, failedAt)

    expect(item.boxLevel).toBe(0)
    expect(isDue(item, failedAt)).toBe(true)
  })

  it('mục hay sai xuất hiện dày hơn mục đã thuộc', () => {
    let weak = createReviewItem('chord:13b9', 'chord', 'Biến âm', DAY_ZERO)
    let strong = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)

    // Mục yếu: đúng rồi sai liên tục
    for (let round = 0; round < 6; round += 1) {
      weak = applyAnswer(weak, round % 2 === 0, weak.nextDueAt)
    }
    // Mục mạnh: đúng hết
    for (let round = 0; round < 6; round += 1) {
      strong = applyAnswer(strong, true, strong.nextDueAt)
    }

    expect(weak.boxLevel).toBeLessThan(strong.boxLevel)
  })
})

describe('selectDueItems', () => {
  /** Dựng mục ôn tập với mức hộp và hạn ôn cho trước. */
  function itemAt(id: string, boxLevel: number, dueAt: number): ReviewItem {
    return {
      ...createReviewItem(id, 'chord', 'Nhóm', DAY_ZERO),
      boxLevel,
      nextDueAt: dueAt,
    }
  }

  it('bỏ qua mục chưa đến hạn', () => {
    const items = [
      itemAt('đến-hạn', 1, days(1)),
      itemAt('chưa-tới', 1, days(10)),
    ]

    const selected = selectDueItems(items, { now: days(2) })
    expect(selected.map((item) => item.id)).toEqual(['đến-hạn'])
  })

  it('xếp mục ở hộp thấp lên trước', () => {
    const items = [
      itemAt('thuộc-rồi', 4, days(1)),
      itemAt('mới-học', 0, days(1)),
      itemAt('đang-nhớ', 2, days(1)),
    ]

    const selected = selectDueItems(items, { now: days(2) })
    expect(selected.map((item) => item.id)).toEqual([
      'mới-học',
      'đang-nhớ',
      'thuộc-rồi',
    ])
  })

  it('cùng mức hộp thì mục quá hạn lâu hơn xếp trước', () => {
    const items = [
      itemAt('quá-hạn-ít', 1, days(5)),
      itemAt('quá-hạn-nhiều', 1, days(1)),
    ]

    const selected = selectDueItems(items, { now: days(10) })
    expect(selected[0].id).toBe('quá-hạn-nhiều')
  })

  it('tôn trọng số lượng tối đa của một buổi', () => {
    const items = Array.from({ length: 40 }, (_, index) =>
      itemAt(`mục-${index}`, 0, days(1)),
    )

    expect(selectDueItems(items, { now: days(2), limit: 10 })).toHaveLength(10)
  })

  it('mặc định mỗi buổi mười lăm mục', () => {
    const items = Array.from({ length: 40 }, (_, index) =>
      itemAt(`mục-${index}`, 0, days(1)),
    )

    expect(selectDueItems(items, { now: days(2) })).toHaveLength(15)
  })

  it('không có mục nào đến hạn thì trả về danh sách rỗng', () => {
    expect(selectDueItems([], { now: DAY_ZERO })).toEqual([])
  })
})

describe('accuracyOf và isMastered', () => {
  const base = createReviewItem('chord:maj7', 'chord', 'Hợp âm bảy', DAY_ZERO)

  it('chưa luyện lần nào thì tỉ lệ đúng bằng không', () => {
    expect(accuracyOf(base)).toBe(0)
  })

  it('tính đúng tỉ lệ tích luỹ', () => {
    expect(accuracyOf({ ...base, totalReps: 4, totalCorrect: 3 })).toBe(0.75)
  })

  it('coi là thuộc khi đủ cả ba điều kiện', () => {
    expect(
      isMastered({
        ...base,
        boxLevel: MAX_BOX_LEVEL,
        correctStreak: 3,
        totalReps: 5,
        totalCorrect: 5,
      }),
    ).toBe(true)
  })

  it('lên hộp cao nhất mà luyện quá ít thì chưa tính là thuộc', () => {
    // Chống trường hợp đoán mò trúng vài lần liên tiếp
    expect(
      isMastered({
        ...base,
        boxLevel: MAX_BOX_LEVEL,
        correctStreak: 3,
        totalReps: 3,
        totalCorrect: 3,
      }),
    ).toBe(false)
  })

  it('chuỗi đúng ngắn thì chưa tính là thuộc', () => {
    expect(
      isMastered({
        ...base,
        boxLevel: MAX_BOX_LEVEL,
        correctStreak: 1,
        totalReps: 20,
        totalCorrect: 15,
      }),
    ).toBe(false)
  })
})

describe('countDue', () => {
  it('đếm đúng số mục đến hạn', () => {
    const items = [
      { ...createReviewItem('a', 'chord', 'x', DAY_ZERO), nextDueAt: days(1) },
      { ...createReviewItem('b', 'chord', 'x', DAY_ZERO), nextDueAt: days(9) },
    ]

    expect(countDue(items, days(5))).toBe(1)
  })
})

describe('định danh mục', () => {
  it('phân biệt hợp âm và vòng hợp âm', () => {
    expect(chordItemId('maj7')).toBe('chord:maj7')
    expect(progressionItemId('ii-V-I')).toBe('progression:ii-V-I')
  })
})
