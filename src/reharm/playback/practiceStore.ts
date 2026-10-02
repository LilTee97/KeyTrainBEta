import { create } from 'zustand'
import type { SongSnapshot } from '../persistence/songSnapshot'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { TimelineEvent } from '../style/types'
import type { PassingOption, TransitionOption } from '../input/SongSheetView'
import type { ParsedSong } from '../input/songTextParser'

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

export interface PracticeTransport {
  /**
   * Phát từ một mốc trên **vòng hợp âm gốc** — bấm vào hợp âm nào thì phát từ đó.
   *
   * KHÔNG dùng được để phát cả bài: `playFrom(0)` tra qua `segments`, mà đoạn dạo
   * không đẩy `segments` nào cả nên mốc 0 rơi vào chỗ bài hát vào — tức **bỏ qua đoạn
   * dạo**. Muốn phát từ đầu thì gọi `playAll`.
   */
  playFrom: (beat: number) => void
  /** Phát cả bài từ phách 0 của dòng thời gian đã sắp, có cả dạo · giang · kết. */
  playAll: () => void
  pause: () => void
  stop: () => void
  onTone: (delta: number) => void
  toneLabel: string
  sourceBeat?: (arrangedBeat: number) => number | null
}

export interface PracticeGrid {
  chordIndexAt: (beat: number) => number | null
  chordCount: number
  pairedChords?: ReadonlySet<number>
  pairPlacesAt?: (chordIndex: number) => number
  passingOptionsFor?: (chordIndex: number) => PassingOption[]
  onSetChordSpan?: (
    chordIndex: number,
    span: 'full' | 'half',
    scope: 'here' | 'all',
  ) => void
  onTogglePassing?: (id: string) => void
  onAddPassingHere?: (slotId: string, hostKeepBeats?: number) => void
  onRemovePassingHere?: (slotId: string) => void
  fillAt?: (chordIndex: number) => boolean | null
  onToggleFill?: (chordIndex: number) => void
  cpLick?: boolean
  runAt?: (chordIndex: number) => boolean | null
  onToggleRun?: (chordIndex: number) => void
  fillRestAt?: (chordIndex: number) => number
  onSetFillRest?: (chordIndex: number, beats: number) => void
  colorHintAt?: (chordIndex: number) => string | null
  onCycleColor?: (chordIndex: number) => void
  slashHintAt?: (chordIndex: number) => string | null
  onToggleSlash?: (chordIndex: number) => void
  transitionAt?: (chordIndex: number) => TransitionOption | null
  onToggleTransition?: (chordIndex: number) => void
  onSetTransition?: (chordIndex: number, run: TransitionOption) => void
  onRemoveChord?: (index: number) => void
  onDuplicateChord?: (index: number, beats: 2 | 4) => void
}

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
  /** Lưới hợp âm đã tái hòa âm, từng phách. */
  perBeat: string[]
  meter: 3 | 4
  leadIn?: { label: string; chords: readonly string[] }
  leadOut?: { label: string; chords: readonly string[] }
  /** Hợp âm đoạn giang tấu — khoảng bốn hợp âm được mượn từ vòng của bài. */
  interlude?: { label: string; chords: readonly string[] }
}

/**
 * Lời nhờ mở một bài, do tab Luyện đệm đặt ra và tab Tái hoà âm nhận lấy.
 *
 * Mở một bài đã lưu không phải là nạp thẳng dòng thời gian: ảnh chụp chỉ ghi
 * **lựa chọn** của người dùng — lời bài hát, cách chia đoạn, màu hợp âm, mật độ
 * câu fill — còn dòng thời gian thì phải dựng lại từ đó qua cả chuỗi luật tái
 * hoà âm, sinh voicing và soạn câu fill. Chuỗi ấy nằm trong tab Tái hoà âm.
 *
 * Nên tab Luyện đệm **nhờ** thay vì tự dựng. Chép chuỗi dựng sang đây thì có
 * hai bản, và hai bản sẽ lệch nhau ngay lần sửa luật kế tiếp — bài tập ra một
 * kiểu, bài dựng ra một kiểu khác.
 */
export interface OpenRequest {
  snapshot: SongSnapshot
  /** Khoá trong kho; rỗng khi bài mở từ file, chưa nằm trong kho. */
  id: string | null
  /** `null` = bài chưa đặt tên. */
  title: string | null
  /** Chỉ có khi trả lại bài cũ sau một lần dựng vòng (`src/thay/dungVong.ts`) — xem `GiuNguyen`. */
  giu?: GiuNguyen
}

/**
 * Phần tab Tái hòa âm có mà ảnh chụp KHÔNG ghi — để dựng vòng xong trả lại ĐÚNG bài cũ. Thiếu thì (đo 2/10/2026, n=1)
 * vòng mặc định `C Am F G` chưa dán bài trả về thành bài rỗng 0 tiếng; hợp âm đã xoá / nhân đôi trên bản nhạc thì
 * `sourceText` không ghi, mở lại là mất.
 */
export interface GiuNguyen {
  input: string
  pastedSong: ParsedSong | null
  lineSolo: boolean
  lockSongBpm: boolean
  /** Dựng vòng điệu không phải ballad thì tab ấy tắt hai công tắc này (rời họ ballad) — trả bài phải bật lại. */
  walkingBass: boolean
  brainFills: boolean
}

interface PracticeState {
  song: PracticeSong | null
  setSong: (song: PracticeSong | null) => void
  transport: PracticeTransport | null
  setTransport: (transport: PracticeTransport | null) => void
  grid: PracticeGrid | null
  setGrid: (grid: PracticeGrid | null) => void

  request: OpenRequest | null
  /** Nhờ tab Tái hoà âm dựng lại bài này rồi đăng sang đây. */
  requestOpen: (request: OpenRequest) => void
  /** Tab Tái hoà âm gọi sau khi đã nhận lời nhờ, để không dựng lại hai lần. */
  clearRequest: () => void

  /**
   * Lời nhờ mở lại ĐÚNG bài đang mở ở tab Tái hoà âm (do tab ấy đăng). Trang thầy dựng vòng tự tạo bằng cách sửa ảnh chụp
   * trong đó rồi nhờ dựng (`src/thay/dungVong.ts`), xong gửi lại lời nhờ này — bài người dùng đang làm không mất.
   */
  chupBai: (() => OpenRequest) | null
  setChupBai: (chupBai: (() => OpenRequest) | null) => void
}

export const usePracticeStore = create<PracticeState>((set) => ({
  song: null,
  setSong: (song) => set({ song }),
  transport: null,
  setTransport: (transport) => set({ transport }),
  grid: null,
  setGrid: (grid) => set({ grid }),

  request: null,
  requestOpen: (request) => set({ request }),
  clearRequest: () => set({ request: null }),

  chupBai: null,
  setChupBai: (chupBai) => set({ chupBai }),
}))
