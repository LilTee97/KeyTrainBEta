import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { NutTiengPhim } from '../../shared/audio/NutTiengPhim'

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> }

const orientation = (): LockableOrientation | undefined =>
  typeof screen === 'undefined' ? undefined : (screen.orientation as LockableOrientation | undefined)

/**
 * Toàn màn hình cho khung `ref`: `full` khi chính khung ấy đang toàn màn hình, `toggle` bật / tắt. `ngang` thì xin xoay ngang
 * (`screen.orientation.lock`): Android chỉ cho khoá chiều khi đang toàn màn hình, máy tính thì từ chối — bỏ qua lặng lẽ. Thoát toàn
 * màn hình thì trả chiều xoay về tự do. Dùng Fullscreen API (Chrome máy tính lẫn Android, cả app đã cài ra màn hình chính).
 */
function useToanManHinh(ref: RefObject<HTMLDivElement | null>, ngang: boolean) {
  const [full, setFull] = useState(false)

  useEffect(() => {
    const sync = () => {
      const on = document.fullscreenElement !== null && document.fullscreenElement === ref.current
      setFull(on)
      if (!on && ngang) orientation()?.unlock?.()
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [ref, ngang])

  const toggle = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    await ref.current?.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    if (ngang) await orientation()?.lock?.('landscape').catch(() => {})
  }

  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled
  return { full, toggle, canFull }
}

const NUT_TOAN_MAN = 'rounded-lg border border-line bg-black/70 px-3 py-1.5 text-xs text-cream hover:bg-black/90'

/**
 * Khung tập — nốt rơi + bàn phím + dòng hợp âm — có nút TOÀN MÀN HÌNH.
 *
 * Người dùng 2/10/2026: *"Hãy làm cho khung phím nút fullscreen để hiển thị full màn và xoay ngang. Làm cho cả phần
 * android cũng có thể fullscreen"*. Toàn màn hình rồi xin xoay ngang (`useToanManHinh`).
 *
 * Lúc toàn màn hình chỉ còn khung này trên màn, nên nút điều khiển chính phải nằm trong nó: `bar`. `children` nhận
 * `full` để nốt rơi lấp chỗ trống và bàn phím cao theo màn. Toàn màn hình thì cuối hàng `bar` có nút tắt tiếng phím (16/10/2026 —
 * nút ở `MidiConnect` nằm ngoài khung) và nút thoát, cùng dòng chảy với hàng: máy không cho xoay ngang (khoá chiều bị từ chối) thì
 * màn dọc 360 px vẫn đủ chỗ. Cũ (tới 16/10/2026): nút thoát nằm đè góc phải, hàng chừa sẵn `pr-44` cho nó.
 */
export function PracticeStage({
  bar,
  children,
}: {
  bar: ReactNode
  children: (full: boolean) => ReactNode
}) {
  const stage = useRef<HTMLDivElement>(null)
  const { full, toggle, canFull } = useToanManHinh(stage, true)

  return (
    <div ref={stage} className={`relative ${full ? 'flex h-full w-full flex-col gap-1 bg-ink p-2' : ''}`}>
      {full && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
          {bar}
          <span className="ml-auto flex gap-1.5">
            <NutTiengPhim />
            <button type="button" onClick={() => void toggle()} className={NUT_TOAN_MAN}>
              ✕ Thoát toàn màn hình
            </button>
          </span>
        </div>
      )}
      {!full && canFull && (
        <button type="button" onClick={() => void toggle()} className={`absolute top-2 right-2 z-10 ${NUT_TOAN_MAN}`}>
          ⛶ Toàn màn hình
        </button>
      )}
      {children(full)}
    </div>
  )
}

/**
 * Khung TOÀN MÀN HÌNH cho cả một game — người dùng 16/10/2026: *"Hãy làm nút fullscreen cho tất cả game"*. Bọc cả game (màn chọn lẫn
 * màn chơi), không chỉ vùng chơi: dừng rồi chơi lại vẫn ở toàn màn hình, nút chọn tốc độ ở màn chọn vẫn bấm được. Không khoá xoay
 * (khác `PracticeStage`): cầm dọc thì điện thoại vừa vùng mưa + bàn phím hai quãng tám, xoay ngang thì bàn phím rộng hơn — người dùng tự
 * chọn. Toàn màn hình thì khung cuộn được, nút tắt tiếng phím đứng ngay đầu khung (nút ở `MidiConnect` nằm cuối game); vùng mưa
 * (`VungRoi`) tự đổi chiều cao bằng CSS `:fullscreen`.
 */
export function KhungGame({ children }: { children: ReactNode }) {
  const khung = useRef<HTMLDivElement>(null)
  const { full, toggle, canFull } = useToanManHinh(khung, false)

  return (
    <div ref={khung} className={full ? 'h-full w-full overflow-y-auto bg-ink p-2' : ''}>
      {canFull && (
        <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
          {full && <NutTiengPhim />}
          <button type="button" onClick={() => void toggle()} className={NUT_TOAN_MAN}>
            {full ? '✕ Thoát toàn màn hình' : '⛶ Toàn màn hình'}
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
