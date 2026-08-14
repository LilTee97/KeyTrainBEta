import { create } from 'zustand'
import type { StatsEvent } from '../../shared/persistence/db'
import { addStatsEvent } from '../../shared/persistence/db'

/**
 * Ghi lại từng câu trả lời.
 *
 * Việc ghi là bất đồng bộ, còn giao diện thống kê thì cần biết khi nào có dữ
 * liệu mới. Thay vì bắt mọi màn hình tự hỏi lại cơ sở dữ liệu, kho này giữ một
 * số đếm; màn hình thống kê theo dõi số đếm đó và tải lại khi nó đổi.
 */
export interface StatsState {
  /** Tăng một đơn vị mỗi khi có câu trả lời mới được ghi. */
  revision: number
}

export const useStatsStore = create<StatsState>(() => ({
  revision: 0,
}))

export type RecordAnswerInput = Omit<StatsEvent, 'id' | 'day' | 'timestamp'> & {
  timestamp?: number
}

/**
 * Ghi một câu trả lời.
 *
 * Không ném lỗi ra ngoài: ghi thống kê hỏng thì cùng lắm mất số liệu, không
 * đáng làm gián đoạn buổi luyện tập của người học.
 */
export async function recordAnswer(input: RecordAnswerInput): Promise<void> {
  try {
    await addStatsEvent({
      ...input,
      timestamp: input.timestamp ?? Date.now(),
    })
    useStatsStore.setState((state) => ({ revision: state.revision + 1 }))
  } catch {
    // Bỏ qua, buổi luyện vẫn tiếp tục bình thường.
  }
}

/** Báo cho màn hình thống kê tải lại, dùng sau khi xoá dữ liệu. */
export function notifyStatsChanged(): void {
  useStatsStore.setState((state) => ({ revision: state.revision + 1 }))
}
