import type { ReviewItem } from '../../shared/persistence/db'

/**
 * Bộ máy lên lịch ôn tập theo mô hình hộp Leitner.
 *
 * Chọn Leitner thay vì các thuật toán tinh vi hơn (SM-2 của Anki) vì tập mục
 * cần nhớ ở đây nhỏ và có giới hạn — vài chục loại hợp âm và vòng hợp âm,
 * không phải hàng nghìn thẻ. Với quy mô đó, Leitner đủ tốt mà lại dễ hiểu,
 * dễ test, và dễ giải thích cho người học.
 *
 * Toàn bộ hàm ở đây đều thuần: nhận trạng thái cũ, trả về trạng thái mới,
 * không đụng tới cơ sở dữ liệu.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Khoảng cách ôn lại của từng hộp, tính bằng ngày.
 *
 * Hộp 0 có khoảng cách 0 nghĩa là "gặp lại ngay trong buổi này" — mục vừa sai
 * phải được nhìn lại trước khi buổi học kết thúc, chứ không đợi sang hôm sau.
 */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30] as const

export const MAX_BOX_LEVEL = BOX_INTERVALS_DAYS.length - 1

/** Tên gọi từng mức để hiển thị cho người học. */
export const BOX_LABELS = [
  'Mới học',
  'Đang nhớ',
  'Nhớ khá',
  'Nhớ tốt',
  'Gần thuộc',
  'Đã thuộc',
] as const

/** Định danh của một mục cần nhớ. */
export function chordItemId(qualityId: string): string {
  return `chord:${qualityId}`
}

export function progressionItemId(templateId: string): string {
  return `progression:${templateId}`
}

/**
 * Mức hộp sau khi trả lời.
 *
 * Trả lời đúng thì lên một hộp; trả lời sai thì **về thẳng hộp 0**, không phải
 * lùi một hộp. Lý do: sai nghĩa là chưa nhớ, mà lùi một hộp từ mức 30 ngày
 * xuống mức 14 ngày thì vẫn phải đợi hai tuần mới gặp lại thứ mình vừa quên.
 *
 * Đổi lại, mức độ thành thạo dùng cho huy hiệu được tính từ số liệu tích luỹ
 * (`totalCorrect`, `correctStreak`) chứ không từ mức hộp hiện tại — nên một
 * lần sai không xoá sạch thành quả đã ghi nhận.
 */
export function nextBoxLevel(currentLevel: number, correct: boolean): number {
  if (!correct) return 0

  const safeLevel = Math.max(0, Math.min(MAX_BOX_LEVEL, currentLevel))
  return Math.min(MAX_BOX_LEVEL, safeLevel + 1)
}

/** Thời điểm đến hạn ôn lại của một mức hộp. */
export function dueDateFor(boxLevel: number, from: number): number {
  const safeLevel = Math.max(0, Math.min(MAX_BOX_LEVEL, boxLevel))
  return from + BOX_INTERVALS_DAYS[safeLevel] * MS_PER_DAY
}

/** Mục đã đến hạn ôn chưa. */
export function isDue(item: ReviewItem, now: number = Date.now()): boolean {
  return item.nextDueAt <= now
}

/** Dựng một mục ôn tập mới, bắt đầu từ hộp thấp nhất. */
export function createReviewItem(
  id: string,
  kind: ReviewItem['kind'],
  category: string,
  now: number = Date.now(),
): ReviewItem {
  return {
    id,
    kind,
    category,
    boxLevel: 0,
    lastReviewedAt: now,
    nextDueAt: dueDateFor(0, now),
    correctStreak: 0,
    totalReps: 0,
    totalCorrect: 0,
  }
}

/** Trạng thái mới của một mục sau khi người học trả lời. */
export function applyAnswer(
  item: ReviewItem,
  correct: boolean,
  now: number = Date.now(),
): ReviewItem {
  const boxLevel = nextBoxLevel(item.boxLevel, correct)

  return {
    ...item,
    boxLevel,
    lastReviewedAt: now,
    nextDueAt: dueDateFor(boxLevel, now),
    correctStreak: correct ? item.correctStreak + 1 : 0,
    totalReps: item.totalReps + 1,
    totalCorrect: item.totalCorrect + (correct ? 1 : 0),
  }
}

/**
 * Chọn các mục cho một buổi ôn.
 *
 * Xếp mục yếu nhất lên trước (hộp thấp trước), rồi tới mục quá hạn lâu nhất.
 * Cách này đưa đúng những thứ đang quên lên đầu buổi, lúc người học còn tập
 * trung nhất.
 */
export function selectDueItems(
  items: readonly ReviewItem[],
  options: { now?: number; limit?: number } = {},
): ReviewItem[] {
  const { now = Date.now(), limit = 15 } = options

  return items
    .filter((item) => isDue(item, now))
    .sort((a, b) => {
      if (a.boxLevel !== b.boxLevel) return a.boxLevel - b.boxLevel
      return a.nextDueAt - b.nextDueAt
    })
    .slice(0, Math.max(0, limit))
}

/** Tỉ lệ đúng tích luỹ của một mục, 0-1. */
export function accuracyOf(item: ReviewItem): number {
  return item.totalReps === 0 ? 0 : item.totalCorrect / item.totalReps
}

/**
 * Mục này đã coi là thuộc chưa.
 *
 * Không chỉ dựa vào mức hộp: cần cả một chuỗi đúng liên tiếp đủ dài và số lần
 * luyện đủ nhiều, để tránh trường hợp đoán mò trúng vài lần rồi được coi là
 * thuộc.
 */
export function isMastered(item: ReviewItem): boolean {
  return (
    item.boxLevel >= MAX_BOX_LEVEL &&
    item.correctStreak >= 3 &&
    item.totalReps >= 5
  )
}

/** Số mục đến hạn, dùng để hiện chấm báo trên nút vào buổi ôn. */
export function countDue(
  items: readonly ReviewItem[],
  now: number = Date.now(),
): number {
  return items.filter((item) => isDue(item, now)).length
}
