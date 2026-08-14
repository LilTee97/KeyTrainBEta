import type { ReviewItem } from '../../shared/persistence/db'

/**
 * Điều phối một buổi ôn tập.
 *
 * Chỉ lo thứ tự hỏi và việc đưa mục sai quay lại — không đụng tới cơ sở dữ
 * liệu, không đụng tới âm thanh, nên test được toàn bộ luồng của một buổi.
 */

/**
 * Mục trả lời sai được chèn lại cách vị trí hiện tại bấy nhiêu câu.
 *
 * Chèn lại ngay lập tức thì người học chỉ cần nhớ đáp án vừa thấy, không phải
 * nhớ thật; chèn quá xa thì có thể hết buổi mà chưa gặp lại. Cách vài câu là
 * đủ để đáp án trôi khỏi trí nhớ ngắn hạn.
 */
const RETRY_GAP = 3

export interface SessionState {
  /** Hàng đợi còn lại, phần tử đầu tiên là câu đang hỏi. */
  pending: ReviewItem[]
  /** Định danh các mục đã trả lời đúng và không phải hỏi lại. */
  finished: string[]
  /** Tổng số mục của buổi, tính cả mục sẽ phải hỏi lại. */
  totalItems: number
  /** Tổng số lần trả lời, kể cả lần hỏi lại. */
  answered: number
  /** Số lần trả lời đúng. */
  correct: number
  /** Định danh các mục từng trả lời sai trong buổi này. */
  missed: string[]
}

/** Bắt đầu buổi ôn với danh sách mục đã đến hạn. */
export function startSession(items: readonly ReviewItem[]): SessionState {
  return {
    pending: [...items],
    finished: [],
    totalItems: items.length,
    answered: 0,
    correct: 0,
    missed: [],
  }
}

/** Mục đang được hỏi, hoặc null khi buổi đã xong. */
export function currentItem(state: SessionState): ReviewItem | null {
  return state.pending[0] ?? null
}

export function isFinished(state: SessionState): boolean {
  return state.pending.length === 0
}

/**
 * Ghi nhận câu trả lời cho mục đang hỏi và chuyển sang mục kế tiếp.
 *
 * Trả lời đúng thì mục rời hàng đợi; trả lời sai thì mục được chèn lại vào
 * giữa hàng đợi để gặp lại trước khi hết buổi. Việc chèn lại này chỉ nằm
 * trong bộ nhớ của buổi — lịch ôn dài hạn do bộ máy Leitner lo riêng.
 */
export function answerCurrent(
  state: SessionState,
  correct: boolean,
): SessionState {
  const [current, ...rest] = state.pending
  if (!current) return state

  const answered = state.answered + 1
  const correctCount = state.correct + (correct ? 1 : 0)

  if (correct) {
    return {
      ...state,
      pending: rest,
      finished: [...state.finished, current.id],
      answered,
      correct: correctCount,
    }
  }

  // Chèn lại vào giữa hàng đợi; hàng đợi ngắn hơn khoảng cách thì đưa xuống cuối.
  const insertAt = Math.min(RETRY_GAP, rest.length)
  const pending = [...rest.slice(0, insertAt), current, ...rest.slice(insertAt)]

  return {
    ...state,
    pending,
    answered,
    correct: correctCount,
    missed: state.missed.includes(current.id)
      ? state.missed
      : [...state.missed, current.id],
  }
}

/** Tiến độ của buổi, dùng cho thanh chạy. */
export function progressOf(state: SessionState): {
  done: number
  total: number
  ratio: number
} {
  const done = state.finished.length
  const total = state.totalItems

  return {
    done,
    total,
    ratio: total === 0 ? 1 : done / total,
  }
}

/** Tỉ lệ trả lời đúng của cả buổi, 0-1. */
export function sessionAccuracy(state: SessionState): number {
  return state.answered === 0 ? 0 : state.correct / state.answered
}
