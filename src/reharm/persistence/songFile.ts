import type { StoredSong } from '../../shared/persistence/db'
import type { SongSnapshot } from './songSnapshot'
import { readSnapshot } from './songSnapshot'

/**
 * Xuất và nhập bài hát dưới dạng **một file văn bản**.
 *
 * Dùng để chuyển bài giữa hai máy cùng chạy KeyTrain — chép sang điện thoại
 * Android rồi mở lại trên Windows, hoặc ngược lại. Bài lưu trong máy nằm ở
 * IndexedDB, mà kho đó gắn chặt với một trình duyệt trên một máy.
 *
 * ## Vì sao JSON chứ không phải MIDI hay MusicXML
 *
 * Hai định dạng kia mở được bằng app khác, nhưng chúng chỉ chứa **nốt nhạc** —
 * không có chỗ nào để ghi cách chia đoạn, thứ tự chơi, mốc chuyển đoạn, hợp âm
 * lướt đã chèn hay mật độ câu fill. Xuất ra đó là mất đúng phần tốn công nhất,
 * và mở lại thì không dựng tiếp được nữa.
 *
 * JSON là văn bản thuần nên hệ nào cũng đọc, và nó giữ **nguyên vẹn** ảnh chụp
 * bài — mở lại là dựng tiếp được ngay từ chỗ đang dở.
 */

/** Nhãn nhận dạng file, để không mở nhầm một file JSON bất kỳ. */
const FORMAT = 'keytrain-song'

export interface SongFile {
  format: typeof FORMAT
  /** Phiên bản của **vỏ file**, khác với phiên bản của ảnh chụp bên trong. */
  version: 1
  title: string
  snapshot: SongSnapshot
}

/**
 * Đóng gói một ảnh chụp thành nội dung file.
 *
 * Nhận thẳng ảnh chụp chứ không đòi bài phải nằm sẵn trong kho, để xuất được
 * **bài đang dựng dở** — người dùng muốn cất ra máy thì không nên bắt họ lưu
 * vào trình duyệt trước.
 */
export function packSong(title: string, snapshot: SongSnapshot): string {
  const file: SongFile = { format: FORMAT, version: 1, title, snapshot }

  // Xuống dòng và thụt lề để mở bằng trình soạn thảo cũng đọc được.
  return JSON.stringify(file, null, 2)
}

/** Đóng gói một bài đã lưu trong kho. */
export function toFileText(song: StoredSong): string | null {
  const snapshot = readSnapshot(song.snapshot)
  if (!snapshot) return null

  return packSong(song.title, snapshot)
}

/**
 * Đưa nội dung file cho người dùng tải xuống.
 *
 * Dựng đường dẫn tạm rồi bấm hộ một thẻ liên kết — đó là cách duy nhất để một
 * trang web đưa file cho người dùng mà không cần máy chủ. Thu hồi đường dẫn
 * ngay sau đó, không thì nội dung còn nằm trong bộ nhớ tới lúc đóng tab.
 */
export function downloadSong(title: string, text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = fileNameFor(title)
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Đọc nội dung file thành bài hát.
 *
 * Trả `null` cho mọi thứ không phải file bài hát KeyTrain — kể cả JSON hợp lệ
 * nhưng của thứ khác. Người dùng chọn nhầm file là chuyện thường, và nhầm thì
 * phải nói rõ chứ không được nhận bừa rồi hỏng ở đâu đó phía sau.
 */
export function readFileText(
  text: string,
): { title: string; snapshot: SongSnapshot } | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null

  const file = parsed as Partial<SongFile>
  if (file.format !== FORMAT) return null
  if (typeof file.title !== 'string' || file.title.length === 0) return null

  const snapshot = readSnapshot(file.snapshot)
  if (!snapshot) return null

  return { title: file.title, snapshot }
}

/**
 * Tên file gợi ý khi lưu xuống máy.
 *
 * Bỏ những ký tự mà Windows và Android không cho đặt tên file. Không bỏ dấu
 * tiếng Việt: cả hai hệ đều nhận, và bỏ dấu thì tên bài đọc lên khó nhận ra.
 */
export function fileNameFor(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|]/g, '').trim()
  return `${safe || 'bai-hat'}.keytrain.json`
}
