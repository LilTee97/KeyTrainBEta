import { useEffect, useRef, useState, type ReactNode } from 'react'

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> }

const orientation = (): LockableOrientation | undefined =>
  typeof screen === 'undefined' ? undefined : (screen.orientation as LockableOrientation | undefined)

/**
 * Khung tập — nốt rơi + bàn phím + dòng hợp âm — có nút TOÀN MÀN HÌNH.
 *
 * Người dùng 2/10/2026: *"Hãy làm cho khung phím nút fullscreen để hiển thị full màn và xoay ngang. Làm cho cả phần
 * android cũng có thể fullscreen"*. Dùng Fullscreen API (Chrome máy tính lẫn Android, cả app đã cài ra màn hình chính)
 * rồi xin xoay ngang (`screen.orientation.lock`): Android chỉ cho khoá chiều khi đang toàn màn hình, máy tính thì từ
 * chối — bỏ qua lặng lẽ. Thoát toàn màn hình thì trả chiều xoay về tự do.
 *
 * Lúc toàn màn hình chỉ còn khung này trên màn, nên nút điều khiển chính phải nằm trong nó: `bar`. `children` nhận
 * `full` để nốt rơi lấp chỗ trống và bàn phím cao theo màn.
 */
export function PracticeStage({
  bar,
  children,
}: {
  bar: ReactNode
  children: (full: boolean) => ReactNode
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    const sync = () => {
      const on = document.fullscreenElement !== null && document.fullscreenElement === stage.current
      setFull(on)
      if (!on) orientation()?.unlock?.()
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    await stage.current?.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    await orientation()?.lock?.('landscape').catch(() => {})
  }

  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled

  return (
    <div ref={stage} className={`relative ${full ? 'flex h-full w-full flex-col gap-1 bg-ink p-2' : ''}`}>
      {full && <div className="flex shrink-0 flex-wrap items-center gap-2 pr-44 text-xs">{bar}</div>}
      {canFull && (
        <button
          type="button"
          onClick={() => void toggle()}
          className="absolute top-2 right-2 z-10 rounded-lg border border-line bg-black/70 px-3 py-1.5 text-xs text-cream hover:bg-black/90"
        >
          {full ? '✕ Thoát toàn màn hình' : '⛶ Toàn màn hình'}
        </button>
      )}
      {children(full)}
    </div>
  )
}
