import { create } from 'zustand'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { TimelineEvent } from '../style/types'

/**
 * Bài đang mở, để tab **Luyện đệm** dùng chung với tab **Tái hoà âm**.
 *
 * Hai tab nhìn cùng một bài nhưng làm hai việc khác nhau: một bên dựng, một
 * bên tập. Tách được là vì khung luyện tập chỉ cần **kết quả cuối** — dòng
 * thời gian và thế bấm — chứ không cần biết vòng hợp âm được dựng ra sao.
 *
 * Đặt ở kho dùng chung chứ không truyền qua props, vì hai tab không có tổ tiên
 * chung nào ngoài `AppShell`, mà nhồi cả bài hát qua đó thì `AppShell` phải
 * biết những thứ chẳng liên quan gì tới việc chuyển tab.
 */

export interface PracticeSong {
  /** Tên bài, để tab luyện tập biết mình đang tập cái gì. */
  title: string
  /** Dòng thời gian đầy đủ: đệm, câu fill, câu solo. */
  timeline: TimelineEvent[]
  /** Thế bấm hai tay của từng hợp âm, để hiện tên hợp âm ở mỗi chặng. */
  voicings: TwoHandVoicing[]
  /** Số phách mỗi hợp âm, để quy chặng về đúng hợp âm. */
  beatsPerChord: number
}

interface PracticeState {
  song: PracticeSong | null
  setSong: (song: PracticeSong | null) => void
}

export const usePracticeStore = create<PracticeState>((set) => ({
  song: null,
  setSong: (song) => set({ song }),
}))
