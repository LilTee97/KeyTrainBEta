import { create } from 'zustand'
import type { ProgressRecord } from '../../shared/persistence/db'
import { dayKeyOf, getProgress, putProgress } from '../../shared/persistence/db'
import { emptyProgress, levelForXp, updateStreak } from './gamificationEngine'

/**
 * Tiến trình game hoá của phần luyện tai.
 *
 * Lưu riêng khỏi phần đệm hát: hai mảng kỹ năng khác nhau nên đo bằng hai
 * thước đo độc lập, người học nhìn ra ngay mình mạnh yếu ở đâu.
 */

export interface GamificationState {
  progress: ProgressRecord
  loaded: boolean
  /** Số câu đúng liên tiếp trong buổi hiện tại. Không lưu xuống ổ đĩa. */
  comboStreak: number
  /** Điểm kiếm được trong buổi hiện tại. */
  sessionXp: number
  /** Cấp tại thời điểm bắt đầu buổi, để biết có lên cấp hay không. */
  levelAtSessionStart: number
}

export const useGamificationStore = create<GamificationState>(() => ({
  progress: emptyProgress('ear'),
  loaded: false,
  comboStreak: 0,
  sessionXp: 0,
  levelAtSessionStart: 1,
}))

/** Đọc tiến trình đã lưu. Gọi nhiều lần vô hại. */
export async function loadProgress(): Promise<void> {
  try {
    const stored = await getProgress('ear')
    const progress = stored ?? emptyProgress('ear')

    useGamificationStore.setState({
      progress,
      loaded: true,
      levelAtSessionStart: progress.level,
    })
  } catch {
    useGamificationStore.setState({ loaded: true })
  }
}

/** Bắt đầu một buổi mới: xoá combo và điểm của buổi trước. */
export function beginSession(): void {
  useGamificationStore.setState((state) => ({
    comboStreak: 0,
    sessionXp: 0,
    levelAtSessionStart: state.progress.level,
  }))
}

export interface AwardResult {
  xpGained: number
  /** Combo sau câu này. */
  comboStreak: number
  /** Có lên cấp nhờ câu này không. */
  leveledUp: boolean
  newLevel: number
}

/**
 * Cộng điểm cho một câu trả lời và lưu lại tiến trình.
 *
 * Trả về kết quả để giao diện hiển thị hiệu ứng ngay, không phải chờ ghi xong.
 */
export async function awardAnswer(
  xpGained: number,
  correct: boolean,
): Promise<AwardResult> {
  const state = useGamificationStore.getState()

  const comboStreak = correct ? state.comboStreak + 1 : 0
  const xp = state.progress.xp + xpGained
  const newLevel = levelForXp(xp)
  const leveledUp = newLevel > state.progress.level

  const progress: ProgressRecord = {
    ...state.progress,
    xp,
    level: newLevel,
  }

  useGamificationStore.setState({
    progress,
    comboStreak,
    sessionXp: state.sessionXp + xpGained,
  })

  try {
    await putProgress(progress)
  } catch {
    // Không lưu được thì buổi học vẫn tiếp tục, chỉ là tiến trình không bền.
  }

  return { xpGained, comboStreak, leveledUp, newLevel }
}

/**
 * Đánh dấu hôm nay có hoạt động, cập nhật chuỗi ngày.
 * Gọi khi người học hoàn thành một buổi ôn.
 */
export async function markActiveToday(
  today: string = dayKeyOf(),
): Promise<ProgressRecord> {
  const state = useGamificationStore.getState()
  const streak = updateStreak(state.progress, today)

  const progress: ProgressRecord = { ...state.progress, ...streak }
  useGamificationStore.setState({ progress })

  try {
    await putProgress(progress)
  } catch {
    // Bỏ qua.
  }

  return progress
}
