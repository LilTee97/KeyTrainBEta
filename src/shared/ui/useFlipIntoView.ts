import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Giữ một khung nổi **nằm trọn trong màn hình**.
 *
 * Menu chuột phải đặt thẳng vào toạ độ con trỏ thì bấm gần mép phải hay mép
 * dưới là bị cắt mất một phần, và phần bị cắt thường lại là mấy mục quan
 * trọng nhất — chúng nằm cuối danh sách.
 *
 * Cách xử lý quen thuộc: chỗ nào không đủ chỗ thì **lật khung sang phía bên
 * kia con trỏ**. Bấm gần mép phải thì khung mọc sang trái, bấm gần đáy thì
 * mọc lên trên. Lật hẳn chứ không đẩy dịch, vì đẩy dịch làm khung che mất
 * chính thứ vừa bấm.
 *
 * Phải đo sau khi vẽ mới biết khung to bao nhiêu, nên dùng `useLayoutEffect`:
 * nó chạy trước lúc trình duyệt tô màn hình, nhờ vậy mắt không kịp thấy khung
 * nhảy từ chỗ sai sang chỗ đúng.
 */

/** Chừa một chút mép cho khung không dính sát cạnh màn hình. */
const MARGIN = 8

export function useFlipIntoView<T extends HTMLElement>(x: number, y: number) {
  const ref = useRef<T>(null)
  const [placed, setPlaced] = useState({ left: x, top: y })
  const [maxHeight, setMaxHeight] = useState<number>()

  useLayoutEffect(() => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return

    const room = { width: window.innerWidth, height: window.innerHeight }

    const left =
      x + box.width > room.width - MARGIN
        ? Math.max(MARGIN, x - box.width)
        : x

    /*
      Khung cao hơn cả màn hình thì lật lên cũng không cứu được — lúc đó ghim
      nó ở mép trên và cho cuộn bên trong.
    */
    const tooTall = box.height > room.height - MARGIN * 2
    const top = tooTall
      ? MARGIN
      : y + box.height > room.height - MARGIN
        ? Math.max(MARGIN, y - box.height)
        : y

    setPlaced({ left, top })
    setMaxHeight(tooTall ? room.height - MARGIN * 2 : undefined)
  }, [x, y])

  return {
    ref,
    style: {
      left: placed.left,
      top: placed.top,
      maxHeight,
      overflowY: maxHeight === undefined ? undefined : ('auto' as const),
    },
  }
}
