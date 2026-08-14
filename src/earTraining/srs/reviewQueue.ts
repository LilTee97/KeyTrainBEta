import type { ReviewItem } from '../../shared/persistence/db'
import {
  getDb,
  getReviewItem,
  putReviewItem,
} from '../../shared/persistence/db'
import {
  applyAnswer,
  chordItemId,
  createReviewItem,
  progressionItemId,
  selectDueItems,
} from './srsEngine'

/**
 * Hàng đợi ôn tập lưu trong cơ sở dữ liệu.
 *
 * Tách khỏi `srsEngine.ts`: phần tính toán lịch ôn là hàm thuần và test được
 * độc lập, còn file này chỉ lo việc đọc ghi.
 */

/** Toàn bộ mục đang theo dõi. */
export async function allReviewItems(): Promise<ReviewItem[]> {
  const db = await getDb()
  return db.getAll('reviewItems')
}

/**
 * Ghi nhận kết quả một lần trả lời.
 *
 * Mục chưa từng gặp sẽ được tạo mới ngay tại đây, nên chỉ cần luyện tập bình
 * thường là hàng đợi ôn tập tự hình thành, người học không phải khai báo gì.
 */
export async function recordReviewResult(
  id: string,
  kind: ReviewItem['kind'],
  category: string,
  correct: boolean,
  now: number = Date.now(),
): Promise<ReviewItem> {
  const existing = await getReviewItem(id)
  const base = existing ?? createReviewItem(id, kind, category, now)

  // Nhóm có thể đổi tên qua các phiên bản, nên luôn lấy nhóm mới nhất.
  const updated = applyAnswer({ ...base, category }, correct, now)

  await putReviewItem(updated)
  return updated
}

/** Ghi nhận kết quả cho một loại hợp âm. */
export async function recordChordResult(
  qualityId: string,
  category: string,
  correct: boolean,
  now: number = Date.now(),
): Promise<ReviewItem> {
  return recordReviewResult(
    chordItemId(qualityId),
    'chord',
    category,
    correct,
    now,
  )
}

/** Ghi nhận kết quả cho một vòng hợp âm. */
export async function recordProgressionResult(
  templateId: string,
  category: string,
  correct: boolean,
  now: number = Date.now(),
): Promise<ReviewItem> {
  return recordReviewResult(
    progressionItemId(templateId),
    'progression',
    category,
    correct,
    now,
  )
}

/** Các mục nên đưa vào buổi ôn tới. */
export async function buildReviewSession(
  options: { now?: number; limit?: number } = {},
): Promise<ReviewItem[]> {
  return selectDueItems(await allReviewItems(), options)
}

/** Định danh của loại hợp âm rút ra từ định danh mục, để ra lại đề. */
export function qualityIdFromItemId(itemId: string): string | null {
  return itemId.startsWith('chord:') ? itemId.slice('chord:'.length) : null
}

/** Định danh vòng hợp âm rút ra từ định danh mục. */
export function templateIdFromItemId(itemId: string): string | null {
  return itemId.startsWith('progression:')
    ? itemId.slice('progression:'.length)
    : null
}
