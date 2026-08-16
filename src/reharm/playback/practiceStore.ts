import { create } from 'zustand'
import type { SongSnapshot } from '../persistence/songSnapshot'
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
  /** Khoá của bài trong kho; rỗng nghĩa là bài chưa lưu lần nào. */
  id: string | null
  /** Tên bài, để tab luyện tập biết mình đang tập cái gì. */
  title: string
  /** Dòng thời gian đầy đủ: đệm, câu fill, câu solo. */
  timeline: TimelineEvent[]
  /** Thế bấm hai tay của từng hợp âm, để hiện tên hợp âm ở mỗi chặng. */
  voicings: TwoHandVoicing[]
  /** Số phách mỗi hợp âm, để quy chặng về đúng hợp âm. */
  beatsPerChord: number
}

/**
 * Lời nhờ mở một bài, do tab Luyện đệm đặt ra và tab Tái hoà âm nhận lấy.
 *
 * Mở một bài đã lưu không phải là nạp thẳng dòng thời gian: ảnh chụp chỉ ghi
 * **lựa chọn** của người dùng — lời bài hát, cách chia đoạn, màu hợp âm, mật độ
 * câu fill — còn dòng thời gian thì phải dựng lại từ đó qua cả chuỗi luật tái
 * hoà âm, sinh voicing và sinh câu fill. Chuỗi ấy nằm trong tab Tái hoà âm.
 *
 * Nên tab Luyện đệm **nhờ** thay vì tự dựng. Chép chuỗi dựng sang đây thì có
 * hai bản, và hai bản sẽ lệch nhau ngay lần sửa luật kế tiếp — bài tập ra một
 * kiểu, bài dựng ra một kiểu khác.
 */
export interface OpenRequest {
  snapshot: SongSnapshot
  /** Khoá trong kho; rỗng khi bài mở từ file, chưa nằm trong kho. */
  id: string | null
  title: string
}

interface PracticeState {
  song: PracticeSong | null
  setSong: (song: PracticeSong | null) => void

  request: OpenRequest | null
  /** Nhờ tab Tái hoà âm dựng lại bài này rồi đăng sang đây. */
  requestOpen: (request: OpenRequest) => void
  /** Tab Tái hoà âm gọi sau khi đã nhận lời nhờ, để không dựng lại hai lần. */
  clearRequest: () => void
}

export const usePracticeStore = create<PracticeState>((set) => ({
  song: null,
  setSong: (song) => set({ song }),

  request: null,
  requestOpen: (request) => set({ request }),
  clearRequest: () => set({ request: null }),
}))
