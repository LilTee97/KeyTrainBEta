import type { SectionMark } from '../input/songSheet'
import type { ArrangementStep } from '../style/arrangement'
import type { TransitionRun } from '../fillSoloGenerator/soloGenerator'

/**
 * Toàn bộ những gì người dùng đã dựng trên một bài hát.
 *
 * Lời bài hát chỉ là nguyên liệu; phần tốn công là những quyết định đặt lên
 * nó — chia đoạn ở đâu, chơi theo thứ tự nào, chèn hợp âm lướt chỗ nào, ô nhịp
 * nào chia đôi, chỗ nào là mốc chuyển đoạn, dịch mấy tone, điệu gì, màu hợp âm
 * ra sao. Không lưu chúng thì tải lại trang là mất sạch.
 *
 * Các tập hợp lưu thành **mảng** chứ không phải `Set`: dữ liệu nằm trong kho
 * lâu dài và có thể được đọc lại bởi phiên bản khác, nên giữ ở dạng đơn giản
 * nhất, dễ đọc nhất khi cần xem tay.
 */
export interface SongSnapshot {
  /**
   * Số phiên bản, tăng khi cấu trúc đổi kiểu không đọc ngược được.
   *
   * Có sẵn từ đầu vì bài đã lưu sống lâu hơn code: người dùng lưu hôm nay rồi
   * mở lại sau nhiều bản cập nhật.
   */
  version: 1

  /** Lời bài hát đúng như người dùng dán vào. */
  sourceText: string

  /** Nâng hạ tone cả bài, tính bằng nửa cung. */
  transpose: number
  /** Giọng người dùng chỉ định; rỗng nghĩa là để app tự dò. */
  manualKey: string

  /** Cách chia đoạn do người dùng quét trên lời. */
  sectionMarks: SectionMark[]
  /** Thứ tự chơi; rỗng nghĩa là dùng mặc định từng đoạn một lượt. */
  arrangement: ArrangementStep[] | null
  /** Mốc chuyển đoạn người dùng tự thêm hoặc gỡ. */
  transitionEdits: Record<number, TransitionRun | null>

  /** Các hợp âm mở đầu một ô nhịp dùng chung với hợp âm sau. */
  pairedChords: number[]
  /** Các chỗ người dùng đã tắt câu fill. */
  mutedFills: number[]
  /** Các chỗ tự chêm fill ngoài mật độ. Bỏ trống = bài cũ. */
  extraFills?: number[]
  extraRuns?: number[]
  colorEdits?: Record<number, string>
  slashEdits?: Record<number, boolean>
  lickyFills?: boolean
  lickyRuns?: boolean
  lickyMode?: string
  /** Các gợi ý hợp âm lướt đã chấp nhận, theo khoá vị trí và kỹ thuật. */
  acceptedPassing: string[]

  /** Điệu và nhịp đổi hợp âm. */
  styleId: string
  beatsPerChord: number
  /** Phách từng hợp âm khi nhập từ lưới; bỏ trống = dùng `beatsPerChord`. */
  chordDurations?: number[]
  /** BPM lúc nhập bài. Bỏ trống thì giữ BPM đang có trên máy. */
  bpm?: number

  /** Cách bấm. */
  smoothVoicing: boolean
  dropRoot: boolean
  useSlashChords: boolean
  /**
   * Đổi hợp âm kết ở lượt lặp lại của một đoạn.
   *
   * Bỏ trống với bài lưu từ trước khi có mục này; đọc lại thì theo mặc định
   * của phong cách là bật.
   */
  varyOnRepeat?: boolean

  /** Màu hợp âm. */
  allowJazzColors: boolean
  intensity: string
  susDominant: boolean
  tonicColor: string
  majorColor: string
  minorColor: string
  dominantColor: string

  /** Câu fill và đoạn giang tấu. */
  soloDensity: string
  /** Bỏ trống với bài lưu từ trước khi tách nốt láy ra khỏi mật độ nốt. */
  graceDensity?: string
  /** Bỏ trống với bài lưu từ trước khi tách câu fill ra khỏi mật độ nốt. */
  fillDensity?: string
  noteSource: string
  chordsPerPhrase: number
}

/** Bài lưu từ bản cũ chưa có phần này; đọc ra `null` thì bỏ qua, không vỡ. */
export function readSnapshot(value: unknown): SongSnapshot | null {
  if (typeof value !== 'object' || value === null) return null

  const snapshot = value as Partial<SongSnapshot>
  if (snapshot.version !== 1) return null
  if (typeof snapshot.sourceText !== 'string') return null

  return snapshot as SongSnapshot
}

/**
 * Tên bài suy ra từ dòng đầu tiên có chữ.
 *
 * Đủ dùng và không phải hỏi thêm một bước: người dán lời thường để tên bài ở
 * dòng đầu. Không có dòng nào thì lấy ngày giờ, để hai bài không tên còn phân
 * biệt được với nhau.
 */
export function titleFromText(text: string): string {
  const line = text
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0 && !entry.startsWith('['))

  if (!line) return `Bài ngày ${new Date().toLocaleDateString('vi-VN')}`
  return line.length > 60 ? `${line.slice(0, 60)}…` : line
}
