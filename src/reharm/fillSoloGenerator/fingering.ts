import type { MidiNote } from '../../shared/musicTheory/types'

/**
 * Số ngón cho câu chạy tay phải.
 *
 * Đoạn giang tấu trước đây ra nốt mà **không ra ngón**: `SoloNote` chỉ có cao
 * độ, phách, trường độ. Người tập nhìn piano roll thấy một dãy nốt rồi tự đoán
 * ngón, và đoán sai liên tục vì đường nhạc không được dựng theo vị trí tay.
 *
 * ## Đây là quy ước soạn, không phải bài của thầy nào
 *
 * Kho PianoBrain **có** thế ngón thật của thầy Hải cho gam trưởng, ngũ cung và
 * chromatic, nhưng không có cho gam bebop 8 nốt, gam altered, whole tone hay
 * diminished — mà đó đúng là mấy gam đoạn giang tấu đang chạy. Chỗ này vì thế
 * là **luật soạn của KeyTrain**, dựng trên nguyên tắc chung ai học piano cũng
 * biết, và không được dán tên thầy nào:
 *
 * - Một vị trí tay là **năm ngón**; đi trong đó thì mỗi bước đổi một ngón.
 * - Đi lên hết ngón 5 thì **luồn ngón cái** xuống dưới, mở vị trí mới.
 * - Đi xuống hết ngón 1 thì **vắt ngón 3** qua ngón cái.
 * - Nhảy xa hơn một quãng bốn thì nhấc tay đặt lại, không cố với.
 *
 * Muốn có thế ngón *của thầy* cho gam jazz thì phải ingest nguồn dạy nó — đó là
 * việc riêng, và cho tới lúc ấy chỗ này không được nói dối là của ai.
 */

/** Ngón 1 là ngón cái, ngón 5 là ngón út. */
export type Finger = 1 | 2 | 3 | 4 | 5

/** Bước nhỏ hơn quãng ba thì tay không cần rời chỗ. */
const STEP = 2
/** Quãng ba: đi trong vị trí nhưng nhảy hai ngón. */
const SKIP = 4

const clamp = (finger: number): Finger => Math.max(1, Math.min(5, finger)) as Finger

/**
 * Ngón cho nốt kế, biết ngón đang bấm và khoảng cách tới nốt kế.
 *
 * Trả về ngón, kèm cờ báo đây có phải chỗ **đổi vị trí tay** không — luồn ngón
 * cái, vắt ngón, hay nhấc tay hẳn. Bên gọi cần biết để đếm: một câu chạy đổi vị
 * trí quá dày là câu chạy không đàn nổi, dù từng ngón đều hợp lệ.
 */
export function nextFinger(
  current: Finger,
  interval: number,
): { finger: Finger; shift: boolean } {
  const distance = Math.abs(interval)

  if (distance === 0) return { finger: current, shift: false }

  /*
    Nhảy xa hơn quãng bốn: nhấc tay, đặt lại từ đầu vị trí.

    Đi lên thì đặt ngón cái ở nốt mới (còn bốn ngón để đi tiếp lên), đi xuống
    thì đặt ngón út. Nhưng **không được trùng ngón đang bấm**: nhấc tay rồi đặt
    lại đúng ngón vừa nhấc lên thì trên bản nhạc thành một ngón bấm hai phím.
  */
  if (distance > 5) {
    if (interval > 0) return { finger: current === 1 ? 2 : 1, shift: true }
    return { finger: current === 5 ? 4 : 5, shift: true }
  }

  const stride = distance <= STEP ? 1 : distance <= SKIP ? 2 : 3
  const wanted = interval > 0 ? current + stride : current - stride

  if (wanted > 5) {
    // Hết ngón khi đang đi lên: luồn ngón cái xuống, mở vị trí mới.
    return { finger: 1, shift: true }
  }
  if (wanted < 1) {
    /*
      Hết ngón khi đang đi xuống.

      Từ ngón cái thì **vắt ngón 3** qua — thế quen tay nhất, đúng cách xuống
      của gam trưởng (5-4-3-2-1-3-2-1). Đang ở ngón khác mà đã hết chỗ nghĩa là
      bước vừa rồi xa hơn số ngón còn lại: nhấc tay đặt lại, và phải đặt vào một
      ngón **khác ngón đang bấm** — cùng một ngón bấm hai phím khác nhau là
      chuyện không làm được, mà bản trước trả về ngón 3 cho cả khi đang ở ngón 3.
    */
    if (current === 1) return { finger: 3, shift: true }
    return { finger: current === 4 ? 5 : 4, shift: true }
  }

  return { finger: clamp(wanted), shift: false }
}

export interface FingeredNote {
  note: MidiNote
  startBeat: number
  isGrace?: boolean
  hand?: 'left' | 'right'
}

export interface FingerPlan<T> {
  notes: (T & { finger: Finger })[]
  /** Số lần phải đổi vị trí tay trong cả đoạn. */
  shifts: number
}

/**
 * Gán ngón cho cả một câu.
 *
 * Nốt tay trái bỏ qua — chỗ này chỉ lo tay phải, vì chỉ tay phải chạy câu.
 * Nốt láy nhận ngón kề nốt chính đi ngay sau nó: nốt láy là một cái vuốt, người
 * chơi không đổi vị trí tay vì nó.
 *
 * Nốt cùng phách (chồng quãng tám) tính theo cao độ: nốt dưới ngón lớn hơn.
 */
export function assignFingers<T extends FingeredNote>(notes: readonly T[]): FingerPlan<T> {
  const order = [...notes].sort((a, b) => a.startBeat - b.startBeat || a.note - b.note)
  const fingers = new Map<T, Finger>()

  /*
    Gán ngón trên **đường chính** trước, bỏ nốt láy ra ngoài.

    Nốt láy là một cái vuốt sát trước nốt chính: người chơi không đổi vị trí tay
    vì nó, và cũng không tính nó khi nhìn xem ngón nào đang rảnh. Để nó xen vào
    dãy thì hai nốt chính liền nhau lại tính ra cùng một ngón — tức một ngón
    bấm hai phím khác nhau, chuyện không làm được.
  */
  const main = order.filter((note) => note.hand !== 'left' && !note.isGrace)
  let current: Finger = 3
  let previous: T | null = null
  let shifts = 0

  for (const note of main) {
    if (!previous) {
      fingers.set(note, current)
      previous = note
      continue
    }

    // Chồng nốt cùng phách: nốt trên lấy ngón lớn hơn, tay không rời chỗ.
    if (Math.abs(note.startBeat - previous.startBeat) < 1e-6) {
      const above = note.note > previous.note
      fingers.set(note, clamp(above ? current + 2 : current - 2))
      continue
    }

    const step = nextFinger(current, note.note - previous.note)
    if (step.shift) shifts += 1
    current = step.finger
    fingers.set(note, current)
    previous = note
  }

  // Nốt láy mượn ngón kề của nốt chính đi ngay sau nó.
  for (const note of order) {
    if (fingers.has(note)) continue
    const after = main.find((other) => other.startBeat >= note.startBeat)
    const anchor = after ? (fingers.get(after) ?? 3) : current
    fingers.set(
      note,
      clamp(after && note.note > after.note ? anchor + 1 : anchor - 1),
    )
  }

  return {
    notes: order.map((note) => ({ ...note, finger: fingers.get(note) ?? 3 })),
    shifts,
  }
}

/**
 * Không quá **hai nốt tay phải cùng một phách**.
 *
 * Ba nốt trở lên cùng lúc là một hợp âm, và tay phải đang chạy câu thì không
 * bấm hợp âm — nó chỉ có năm ngón, mà bốn trong số đó đang đi tiếp. Giữ nốt
 * ngoài cùng của cụm (nốt cao nhất là nốt tai nghe thấy, nốt thấp nhất là nốt
 * dày thêm), bỏ mấy nốt kẹp giữa.
 */
export function capStack<T extends FingeredNote>(notes: readonly T[], limit = 2): T[] {
  const byBeat = new Map<number, T[]>()
  for (const note of notes) {
    if (note.hand === 'left') continue
    const key = Number(note.startBeat.toFixed(4))
    byBeat.set(key, [...(byBeat.get(key) ?? []), note])
  }

  const dropped = new Set<T>()
  for (const group of byBeat.values()) {
    if (group.length <= limit) continue
    const sorted = [...group].sort((a, b) => a.note - b.note)
    for (const note of sorted.slice(1, sorted.length - 1)) dropped.add(note)
  }

  return notes.filter((note) => !dropped.has(note))
}
