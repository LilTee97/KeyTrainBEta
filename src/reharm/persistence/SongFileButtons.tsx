import { useState } from 'react'
import type { SongSnapshot } from './songSnapshot'
import { downloadSong, packSong, readFileText } from './songFile'

/**
 * Hai nút **Mở file** và **Xuất file**, đặt ngay trên khung bản nhạc.
 *
 * Khác với nút *Lưu bài* bên cạnh: lưu là cất vào kho của **trình duyệt**, còn
 * xuất là cất thành một file **trên máy**. Hai chỗ khác nhau và dùng cho hai
 * việc khác nhau — kho trình duyệt tiện cho việc mở lại hằng ngày, còn file
 * mới mang được sang máy khác hay cất vào chỗ sao lưu.
 *
 * Xuất thẳng từ trạng thái đang dựng chứ không đòi lưu vào kho trước: muốn cất
 * bài ra máy thì không có lý do gì bắt phải lưu vào trình duyệt đã.
 */

interface SongFileButtonsProps {
  /** Chụp lại trạng thái hiện tại để xuất. */
  snapshot: () => SongSnapshot
  /** Tên bài đang mở; rỗng thì lấy tên đoán từ lời. */
  title: string | null
  /** Đặt cả trang theo bài vừa mở từ file. */
  onOpen: (saved: SongSnapshot, title: string) => void
}

export function SongFileButtons({
  snapshot,
  title,
  onOpen,
}: SongFileButtonsProps) {
  const [error, setError] = useState<string | null>(null)

  const open = async (file: File) => {
    const parsed = readFileText(await file.text())
    if (!parsed) {
      setError('File này không phải bài hát KeyTrain.')
      return
    }

    setError(null)
    onOpen(parsed.snapshot, parsed.title)
  }

  const save = () => {
    const current = snapshot()
    if (current.sourceText.trim().length === 0) return

    const name = title?.trim() || 'Bài chưa đặt tên'
    downloadSong(name, packSong(name, current))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/*
        Ô chọn file nấp dưới cái nhãn: trình duyệt vẽ `input type=file` mỗi nơi
        một kiểu và không tô màu theo được, nên bọc nó vào một nhãn trông như
        nút cho khớp với những nút bên cạnh.
      */}
      <label className="cursor-pointer rounded-lg border border-line bg-white/4 px-2.5 py-1 text-xs text-dim hover:bg-white/8 hover:text-cream">
        Mở file
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void open(file)
            // Xoá giá trị để chọn lại đúng file đó vẫn kích hoạt được.
            event.target.value = ''
          }}
        />
      </label>

      <button
        type="button"
        onClick={save}
        title="Cất bài này thành một file trên máy, mang sang máy khác được"
        className="rounded-lg border border-line bg-white/4 px-2.5 py-1 text-xs text-dim hover:bg-white/8 hover:text-cream"
      >
        Xuất file
      </button>

      {error && <span className="text-[10px] text-rose-300">{error}</span>}
    </div>
  )
}
