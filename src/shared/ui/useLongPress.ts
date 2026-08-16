import { useCallback, useEffect, useRef } from 'react'

/**
 * Nhấn giữ trên màn cảm ứng thay cho bấm chuột phải.
 *
 * Cả phần dựng bài đều mở bảng lựa chọn bằng **chuột phải** — đổi thời lượng
 * hợp âm, chèn hợp âm lướt, đánh dấu đoạn kết bài. Trên điện thoại không có
 * chuột phải, nên nếu không có lối vào khác thì gần như toàn bộ phần chỉnh bài
 * không dùng được bằng ngón tay.
 *
 * Nhấn giữ là cử chỉ Android đã dùng sẵn cho đúng việc này, nên người dùng
 * không phải học thêm gì.
 *
 * ## Vì sao phải chặn cú bấm đi sau
 *
 * Nhả tay ra sau khi giữ đủ lâu, trình duyệt vẫn bắn một sự kiện `click` bình
 * thường. Mà chính những chỗ này đều đã có việc gắn với cú bấm — bấm vào hợp
 * âm là phát từ đó. Không chặn thì mỗi lần mở bảng lựa chọn lại phát nhạc kèm.
 */

export interface PressPoint {
  x: number
  y: number
}

/** Giữ bao lâu thì tính là nhấn giữ. Lấy theo mức Android vẫn dùng. */
const HOLD_MS = 500

/**
 * Nhúc nhích quá ngần này điểm ảnh thì thôi, coi như đang cuộn trang.
 *
 * Ngón tay không bao giờ đứng yên tuyệt đối, nên phải chừa sai số; nhưng chừa
 * rộng quá thì cuộn trang qua một hợp âm cũng bật bảng lựa chọn lên.
 */
const MOVE_TOLERANCE = 10

export interface LongPressHandlers {
  onContextMenu: (event: React.MouseEvent) => void
  onPointerDown: (event: React.PointerEvent) => void
  onPointerUp: () => void
  onPointerMove: (event: React.PointerEvent) => void
  onPointerCancel: () => void
  onClickCapture: (event: React.MouseEvent) => void
}

/**
 * Trả về hàm gắn cử chỉ cho từng phần tử.
 *
 * Là hàm gắn chứ không phải bộ sự kiện dựng sẵn, vì những chỗ dùng nó đều nằm
 * trong vòng lặp — mỗi hợp âm, mỗi bước trong thứ tự chơi là một phần tử,
 * không gọi hook riêng cho từng cái được. Dùng chung một cái hẹn giờ cũng
 * không sao: một lúc chỉ có một ngón đang giữ.
 */
export function useLongPress(): (
  onTrigger: (point: PressPoint) => void,
) => LongPressHandlers {
  const timer = useRef<number | null>(null)
  const start = useRef<PressPoint | null>(null)
  const fired = useRef(false)

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    start.current = null
  }, [])

  // Rời trang giữa lúc đang giữ thì cái hẹn giờ vẫn còn treo lại.
  useEffect(() => cancel, [cancel])

  return useCallback(
    (onTrigger: (point: PressPoint) => void): LongPressHandlers => ({
      onContextMenu: (event) => {
        event.preventDefault()
        onTrigger({ x: event.clientX, y: event.clientY })
      },

      onPointerDown: (event) => {
        /*
          Chuột đã có đường riêng qua `onContextMenu`. Đếm giờ cho cả chuột nữa
          thì giữ nút trái một lúc cũng bật bảng lựa chọn, mà trên máy tính đó
          là cử chỉ để **chọn chữ**.
        */
        if (event.pointerType === 'mouse') return

        fired.current = false
        start.current = { x: event.clientX, y: event.clientY }

        timer.current = window.setTimeout(() => {
          const point = start.current
          timer.current = null
          if (!point) return

          fired.current = true
          onTrigger(point)
        }, HOLD_MS)
      },

      onPointerMove: (event) => {
        const from = start.current
        if (!from) return

        const moved =
          Math.abs(event.clientX - from.x) > MOVE_TOLERANCE ||
          Math.abs(event.clientY - from.y) > MOVE_TOLERANCE
        if (moved) cancel()
      },

      onPointerUp: cancel,
      onPointerCancel: cancel,

      onClickCapture: (event) => {
        if (!fired.current) return

        // Nuốt đúng một cú bấm — cú bấm thật sau đó vẫn phải chạy bình thường.
        fired.current = false
        event.preventDefault()
        event.stopPropagation()
      },
    }),
    [cancel],
  )
}
