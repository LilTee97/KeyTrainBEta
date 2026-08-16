import { isBlackKey } from '../../musicTheory/pitch'
import type { MidiNote } from '../../musicTheory/types'

/**
 * Tính bố cục phím đàn cho bàn phím ảo.
 *
 * Phím trắng xếp liền nhau thành hàng; phím đen nằm đè lên, ở khe giữa
 * hai phím trắng. Tách riêng thành hàm thuần để test được mà không cần
 * dựng giao diện.
 */

export interface WhiteKey {
  note: MidiNote
  /** Thứ tự phím trắng, tính từ 0 ở đầu bên trái. */
  index: number
}

export interface BlackKey {
  note: MidiNote
  /**
   * Vị trí tâm phím, tính theo tỉ lệ 0-1 trên toàn bộ chiều ngang bàn phím.
   * Dùng trực tiếp làm phần trăm khi đặt phím đen lên trên.
   */
  position: number
}

export interface KeyboardLayout {
  whiteKeys: WhiteKey[]
  blackKeys: BlackKey[]
}

/**
 * Dựng bố cục cho dải nốt từ `lowNote` tới `highNote`, tính cả hai đầu.
 *
 * Phím đen ở rìa (khi dải bắt đầu hoặc kết thúc bằng phím đen) bị bỏ đi,
 * vì không có đủ hai phím trắng hai bên để đặt vào khe.
 */
export function buildKeyboardLayout(
  lowNote: MidiNote,
  highNote: MidiNote,
): KeyboardLayout {
  const whiteKeys: WhiteKey[] = []
  const blackNotes: MidiNote[] = []

  for (let note = lowNote; note <= highNote; note += 1) {
    if (isBlackKey(note)) blackNotes.push(note)
    else whiteKeys.push({ note, index: whiteKeys.length })
  }

  const whiteCount = whiteKeys.length
  const blackKeys: BlackKey[] = []

  if (whiteCount > 0) {
    for (const note of blackNotes) {
      // Phím đen luôn nằm giữa phím trắng ngay dưới nó và phím trắng kế tiếp.
      const whiteBelow = whiteKeys.findLast((key) => key.note < note)
      if (!whiteBelow) continue

      const isLastWhite = whiteBelow.index === whiteCount - 1
      if (isLastWhite) continue

      blackKeys.push({
        note,
        position: (whiteBelow.index + 1) / whiteCount,
      })
    }
  }

  return { whiteKeys, blackKeys }
}

/**
 * Chỗ đứng ngang của một nốt trên bàn phím, tính theo phần trăm bề rộng.
 *
 * Dùng để vẽ **nốt rơi** thẳng hàng với phím mà nó sẽ đáp xuống. Phải tính lại
 * từ chính bố cục bàn phím chứ không ước lượng theo cao độ: phím trắng chia
 * đều bề ngang còn phím đen nằm chen vào khe, nên khoảng cách giữa hai nốt
 * cách nhau một nửa cung không phải lúc nào cũng bằng nhau.
 *
 * Trả `null` cho nốt nằm ngoài dải bàn phím đang vẽ.
 */
export function keyPlacement(
  layout: KeyboardLayout,
  note: MidiNote,
): { left: number; width: number } | null {
  const whiteCount = layout.whiteKeys.length
  if (whiteCount === 0) return null

  const black = layout.blackKeys.find((key) => key.note === note)
  if (black) {
    // Phím đen hẹp hơn và tâm nằm đúng khe, nên lùi lại nửa bề rộng của nó.
    const width = (100 / whiteCount) * 0.62
    return { left: black.position * 100 - width / 2, width }
  }

  const white = layout.whiteKeys.find((key) => key.note === note)
  if (!white) return null

  const width = 100 / whiteCount
  return { left: white.index * width, width }
}
