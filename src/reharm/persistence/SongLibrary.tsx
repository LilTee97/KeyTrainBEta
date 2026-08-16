import { useCallback, useEffect, useState } from 'react'
import type { StoredSong } from '../../shared/persistence/db'
import { deleteSong, listSongs } from '../../shared/persistence/db'
import type { SongSnapshot } from './songSnapshot'
import { readSnapshot } from './songSnapshot'

/**
 * Danh sách bài đã lưu: **mở lại và xoá**.
 *
 * Việc lưu không nằm ở đây mà nằm ngay trên khung bản nhạc — xem
 * `SaveSongButton`. Nút lưu đặt cạnh thứ nó lưu thì không phải giải thích nó
 * lưu cái gì; còn danh sách thì đúng chỗ ở đây, cạnh ô dán lời, vì đó là lúc
 * người dùng đang chọn làm bài nào.
 */

interface SongLibraryProps {
  /** Đặt cả trang theo bài vừa mở. */
  onOpen: (saved: SongSnapshot, id: string, title: string) => void
  /** Bài đang mở; rỗng nghĩa là bài chưa lưu lần nào. */
  currentId: string | null
  /**
   * Đổi giá trị này thì danh sách đọc lại kho.
   *
   * Cần vì việc lưu xảy ra ở một khung khác hẳn — không có tín hiệu thì danh
   * sách ở đây vẫn hiện tên cũ sau khi người dùng vừa lưu xong.
   */
  reloadKey: number
}

export function SongLibrary({
  onOpen,
  currentId,
  reloadKey,
}: SongLibraryProps) {
  const [songs, setSongs] = useState<StoredSong[]>([])

  const refresh = useCallback(async () => {
    setSongs(await listSongs())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, reloadKey])

  const open = (song: StoredSong) => {
    const saved = readSnapshot(song.snapshot)
    if (!saved) return

    onOpen(saved, song.id, song.title)
  }

  const remove = async (id: string) => {
    await deleteSong(id)
    await refresh()
  }

  return (
    <div className="rounded-xl border border-line bg-black/25 p-4">
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Bài đã lưu
      </h3>

      {songs.length === 0 ? (
        <p className="text-xs text-dim">
          Chưa lưu bài nào. Dán lời, dựng xong rồi bấm <b>Lưu bài</b> ở khung
          bản nhạc — lần sau mở lại là còn nguyên cách chia đoạn, thứ tự chơi
          và hợp âm đã chèn.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {songs.map((song) => (
            <div
              key={song.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                song.id === currentId
                  ? 'border-amber-key/50 bg-amber-key/10'
                  : 'border-line bg-white/4'
              }`}
            >
              <button
                type="button"
                onClick={() => open(song)}
                disabled={readSnapshot(song.snapshot) === null}
                title={
                  readSnapshot(song.snapshot) === null
                    ? 'Bài này lưu từ bản cũ, chưa kèm phần dựng'
                    : 'Mở lại bài này'
                }
                className="flex-1 truncate text-left text-sm text-cream hover:text-amber-key disabled:opacity-40"
              >
                {song.title}
              </button>

              <span className="shrink-0 font-mono text-[10px] text-dim">
                {new Date(song.updatedAt).toLocaleDateString('vi-VN')}
              </span>

              <button
                type="button"
                onClick={() => void remove(song.id)}
                aria-label={`Xoá bài ${song.title}`}
                title="Xoá bài này"
                className="shrink-0 rounded px-1.5 text-xs text-dim hover:bg-white/8 hover:text-rose-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
