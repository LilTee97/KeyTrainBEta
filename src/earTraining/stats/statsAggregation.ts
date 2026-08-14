import type { StatsEvent } from '../../shared/persistence/db'

/**
 * Tổng hợp lịch sử trả lời thành các con số hiển thị được.
 * Toàn hàm thuần, không đụng cơ sở dữ liệu, nên test được thoải mái.
 */

export interface Summary {
  correct: number
  total: number
  /** Tỉ lệ đúng, 0-1. Bằng 0 khi chưa trả lời câu nào. */
  accuracy: number
  /** Thời gian trả lời trung bình, tính bằng mili giây. */
  averageResponseMs: number
}

export interface CategorySummary extends Summary {
  category: string
}

export interface DaySummary extends Summary {
  day: string
}

const EMPTY: Summary = {
  correct: 0,
  total: 0,
  accuracy: 0,
  averageResponseMs: 0,
}

function summarize(events: readonly StatsEvent[]): Summary {
  if (events.length === 0) return { ...EMPTY }

  let correct = 0
  let responseTotal = 0

  for (const event of events) {
    if (event.correct) correct += 1
    responseTotal += event.responseMs
  }

  return {
    correct,
    total: events.length,
    accuracy: correct / events.length,
    averageResponseMs: Math.round(responseTotal / events.length),
  }
}

/** Tổng hợp toàn bộ. */
export function summarizeTotals(events: readonly StatsEvent[]): Summary {
  return summarize(events)
}

/**
 * Tổng hợp theo nhóm hợp âm, xếp nhóm yếu nhất lên đầu.
 *
 * Xếp theo tỉ lệ đúng tăng dần để nhóm cần luyện nhất nằm ngay trên cùng —
 * đó mới là thông tin đáng xem, chứ không phải nhóm đã thuộc.
 */
export function summarizeByCategory(
  events: readonly StatsEvent[],
): CategorySummary[] {
  const buckets = new Map<string, StatsEvent[]>()

  for (const event of events) {
    const bucket = buckets.get(event.category)
    if (bucket) bucket.push(event)
    else buckets.set(event.category, [event])
  }

  return [...buckets.entries()]
    .map(([category, list]) => ({ category, ...summarize(list) }))
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
      // Cùng tỉ lệ thì nhóm luyện nhiều hơn xếp trước, vì số liệu đáng tin hơn.
      return b.total - a.total
    })
}

/** Tổng hợp theo ngày, ngày mới nhất xếp đầu. */
export function summarizeByDay(events: readonly StatsEvent[]): DaySummary[] {
  const buckets = new Map<string, StatsEvent[]>()

  for (const event of events) {
    const bucket = buckets.get(event.day)
    if (bucket) bucket.push(event)
    else buckets.set(event.day, [event])
  }

  return [...buckets.entries()]
    .map(([day, list]) => ({ day, ...summarize(list) }))
    .sort((a, b) => b.day.localeCompare(a.day))
}

/** Lọc theo loại mục, để tách riêng hợp âm rời và vòng hợp âm. */
export function filterByKind(
  events: readonly StatsEvent[],
  kind: StatsEvent['itemKind'],
): StatsEvent[] {
  return events.filter((event) => event.itemKind === kind)
}

/** Tỉ lệ phần trăm đã làm tròn, tiện cho việc hiển thị. */
export function percentOf(summary: Summary): number {
  return Math.round(summary.accuracy * 100)
}
