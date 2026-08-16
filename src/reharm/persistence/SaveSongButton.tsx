import { useState } from 'react'
import { putSong } from '../../shared/persistence/db'
import type { SongSnapshot } from './songSnapshot'
import { titleFromText } from './songSnapshot'

/**
 * Nút lưu bài, đặt ngay trên khung bản nhạc đã tái hoà âm.
 *
 * Đặt ở đây chứ không ở một khung riêng vì **thứ đang lưu là cái đang nhìn**:
 * bản nhạc với hợp âm đã đổi, đã chia đoạn, đã sắp thứ tự chơi. Nút nằm cạnh
 * thứ nó lưu thì không phải giải thích nó lưu cái gì.
 *
 * Luôn hỏi tên trước khi lưu. Tên tự đoán từ dòng đầu của lời chỉ đúng khi
 * người dùng dán kèm tên bài; nhiều bản lời chép trên mạng mở đầu thẳng bằng
 * câu hát, nên tên tự đoán ra thành một câu hát cụt. Hỏi một câu rẻ hơn nhiều
 * so với một danh sách toàn tên khó nhận ra.
 */

interface SaveSongButtonProps {
  snapshot: () => SongSnapshot
  /** Bài đang mở; có thì ghi đè, rỗng thì tạo bản mới. */
  currentId: string | null
  /** Tên đang có của bài đang mở, để sửa lại thay vì gõ từ đầu. */
  currentTitle: string | null
  onSaved: (id: string, title: string) => void
}

export function SaveSongButton({
  snapshot,
  currentId,
  currentTitle,
  onSaved,
}: SaveSongButtonProps) {
  /** Đang mở ô đặt tên hay chưa. */
  const [naming, setNaming] = useState(false)
  const [title, setTitle] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const startNaming = () => {
    // Gợi sẵn tên cũ, hoặc tên đoán từ lời — người dùng sửa nhanh hơn gõ mới.
    setTitle(currentTitle ?? titleFromText(snapshot().sourceText))
    setNaming(true)
  }

  const save = async () => {
    const current = snapshot()
    const name = title.trim()
    if (name.length === 0) return

    const id = currentId ?? crypto.randomUUID()

    await putSong({
      id,
      title: name,
      sourceText: current.sourceText,
      updatedAt: Date.now(),
      snapshot: current,
    })

    setNaming(false)
    onSaved(id, name)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 1800)
  }

  if (!naming) {
    return (
      <button
        type="button"
        onClick={startNaming}
        title="Lưu bản nhạc này lại — hợp âm đã đổi, cách chia đoạn, thứ tự chơi, mọi thứ"
        className="rounded-lg border border-amber-key/50 bg-amber-key/10 px-2.5 py-1 text-xs text-amber-key hover:bg-amber-key/20"
      >
        {justSaved ? '✓ Đã lưu' : currentId ? 'Lưu đè' : 'Lưu bài'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void save()
          if (event.key === 'Escape') setNaming(false)
        }}
        // Mở ô ra là gõ được ngay, không phải bấm thêm một cái nữa.
        autoFocus
        placeholder="Tên bài"
        className="w-44 rounded-md border border-amber-key/50 bg-black/40 px-2 py-1 text-xs text-cream outline-none"
      />

      <button
        type="button"
        onClick={() => void save()}
        disabled={title.trim().length === 0}
        className="rounded-lg bg-amber-key px-2.5 py-1 text-xs font-semibold text-ink hover:brightness-110 disabled:opacity-40"
      >
        Lưu
      </button>

      <button
        type="button"
        onClick={() => setNaming(false)}
        className="rounded-lg border border-line px-2 py-1 text-xs text-dim hover:bg-white/8"
      >
        Thôi
      </button>
    </div>
  )
}
