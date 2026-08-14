import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  addStatsEvent,
  clearPracticeData,
  dayKeyOf,
  dueReviewItems,
  getProgress,
  getReviewItem,
  putProgress,
  putReviewItem,
  statsEventsForDay,
} from '../db'
import type { ReviewItem } from '../db'

afterEach(async () => {
  await clearPracticeData()
})

/** Dựng một mục ôn tập với các giá trị hợp lý. */
function reviewItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: 'chord:0:maj7',
    kind: 'chord',
    category: 'Hợp âm bảy',
    boxLevel: 1,
    lastReviewedAt: Date.now(),
    nextDueAt: Date.now() + 86_400_000,
    correctStreak: 1,
    totalReps: 1,
    totalCorrect: 1,
    ...overrides,
  }
}

describe('dayKeyOf', () => {
  it('ghi ngày theo dạng năm-tháng-ngày', () => {
    expect(dayKeyOf(new Date(2026, 7, 14))).toBe('2026-08-14')
  })

  it('thêm số không ở đầu cho tháng và ngày một chữ số', () => {
    expect(dayKeyOf(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('dùng giờ địa phương chứ không phải giờ quốc tế', () => {
    // Cuối ngày theo giờ địa phương vẫn phải tính là ngày đó
    const lateEvening = new Date(2026, 7, 14, 23, 30)
    expect(dayKeyOf(lateEvening)).toBe('2026-08-14')
  })
})

describe('lịch sử trả lời', () => {
  it('ghi rồi đọc lại được theo ngày', async () => {
    const timestamp = new Date(2026, 7, 14, 10, 0).getTime()

    await addStatsEvent({
      timestamp,
      mode: 'practice',
      itemKind: 'chord',
      category: 'Hợp âm bảy',
      correct: true,
      responseMs: 1500,
    })

    const events = await statsEventsForDay('2026-08-14')
    expect(events).toHaveLength(1)
    expect(events[0].category).toBe('Hợp âm bảy')
    expect(events[0].correct).toBe(true)
  })

  it('tự suy ra ngày từ mốc thời gian', async () => {
    await addStatsEvent({
      timestamp: new Date(2026, 0, 5, 8, 0).getTime(),
      mode: 'practice',
      itemKind: 'chord',
      category: 'Hợp âm ba',
      correct: false,
      responseMs: 4000,
    })

    expect(await statsEventsForDay('2026-01-05')).toHaveLength(1)
  })

  it('tách được các ngày khác nhau', async () => {
    for (const day of [14, 15, 15]) {
      await addStatsEvent({
        timestamp: new Date(2026, 7, day, 9, 0).getTime(),
        mode: 'practice',
        itemKind: 'chord',
        category: 'Hợp âm ba',
        correct: true,
        responseMs: 1000,
      })
    }

    expect(await statsEventsForDay('2026-08-14')).toHaveLength(1)
    expect(await statsEventsForDay('2026-08-15')).toHaveLength(2)
  })

  it('ngày chưa có gì thì trả về danh sách rỗng', async () => {
    expect(await statsEventsForDay('2020-01-01')).toEqual([])
  })
})

describe('hàng đợi ôn tập', () => {
  it('ghi rồi đọc lại được theo định danh', async () => {
    await putReviewItem(reviewItem({ boxLevel: 3 }))

    const stored = await getReviewItem('chord:0:maj7')
    expect(stored?.boxLevel).toBe(3)
  })

  it('ghi đè bản ghi cũ cùng định danh', async () => {
    await putReviewItem(reviewItem({ boxLevel: 1 }))
    await putReviewItem(reviewItem({ boxLevel: 2 }))

    expect((await getReviewItem('chord:0:maj7'))?.boxLevel).toBe(2)
  })

  it('chỉ trả về những mục đã đến hạn', async () => {
    const now = Date.now()

    await putReviewItem(
      reviewItem({ id: 'quá-hạn', nextDueAt: now - 1000 }),
    )
    await putReviewItem(
      reviewItem({ id: 'đúng-hạn', nextDueAt: now }),
    )
    await putReviewItem(
      reviewItem({ id: 'chưa-tới-hạn', nextDueAt: now + 86_400_000 }),
    )

    const due = await dueReviewItems(now)
    const ids = due.map((item) => item.id).sort()
    expect(ids).toEqual(['quá-hạn', 'đúng-hạn'].sort())
  })

  it('chưa có mục nào đến hạn thì trả về danh sách rỗng', async () => {
    await putReviewItem(reviewItem({ nextDueAt: Date.now() + 86_400_000 }))
    expect(await dueReviewItems()).toEqual([])
  })

  it('mục không có thật thì trả về undefined', async () => {
    expect(await getReviewItem('không-có-thật')).toBeUndefined()
  })
})

describe('tiến trình game hoá', () => {
  it('lưu riêng tiến trình của hai hệ', async () => {
    await putProgress({
      id: 'ear',
      xp: 120,
      level: 2,
      currentStreakDays: 3,
      longestStreakDays: 5,
      lastActiveDay: '2026-08-14',
      badges: [],
    })

    await putProgress({
      id: 'comp',
      xp: 0,
      level: 0,
      currentStreakDays: 1,
      longestStreakDays: 1,
      lastActiveDay: '2026-08-14',
      badges: [{ id: 'bossa-3-sao', unlockedAt: Date.now() }],
    })

    expect((await getProgress('ear'))?.xp).toBe(120)
    expect((await getProgress('comp'))?.badges).toHaveLength(1)
    // Hai hệ không đụng vào nhau
    expect((await getProgress('ear'))?.badges).toHaveLength(0)
  })
})

describe('clearPracticeData', () => {
  it('xoá sạch lịch sử, hàng đợi ôn tập và tiến trình', async () => {
    await addStatsEvent({
      timestamp: new Date(2026, 7, 14).getTime(),
      mode: 'practice',
      itemKind: 'chord',
      category: 'Hợp âm ba',
      correct: true,
      responseMs: 1000,
    })
    await putReviewItem(reviewItem({ nextDueAt: 0 }))
    await putProgress({
      id: 'ear',
      xp: 50,
      level: 1,
      currentStreakDays: 1,
      longestStreakDays: 1,
      lastActiveDay: null,
      badges: [],
    })

    await clearPracticeData()

    expect(await statsEventsForDay('2026-08-14')).toEqual([])
    expect(await dueReviewItems()).toEqual([])
    expect(await getProgress('ear')).toBeUndefined()
  })
})
