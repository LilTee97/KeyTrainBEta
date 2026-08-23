import { getStyle } from '../style/styleLibrary'

/**
 * Cách chia thời gian của câu chạy, theo điệu đang chọn.
 *
 * Trước đây bộ sinh câu **không nhìn thấy điệu** một lần nào: `soloGenerator.ts`
 * không import module điệu nào cả, nên câu giang tấu của bossa nova, slow rock,
 * swing và ballad giống hệt nhau từng nốt — chỉ phần đệm đổi. Nghe ra ngay là
 * một câu chạy vô danh tính đặt lên một nền có danh tính.
 *
 * Chỗ này **không đổi một nốt nào**, chỉ đổi chỗ nốt rơi. Cao độ là việc của
 * hoà âm, còn đây là việc của nhịp.
 */
export type SoloFeel =
  /** Móc đơn đều nhau. Ballad, slow rock, pop. */
  | 'straight'
  /** Móc đơn chia chùm ba, nốt lệch rơi ở 2/3 phách. Jazz, swing. */
  | 'swing'
  /** Móc đơn vẫn đều, nhưng nửa sau ô nhịp **tới sớm** một móc đơn. Bossa, samba. */
  | 'bossa'

/**
 * Điệu này thì câu chạy chia nhịp kiểu gì.
 *
 * Đọc `feel` của chính điệu trong thư viện, nên thêm điệu mới là tự có, không
 * phải nhớ cập nhật một bảng thứ hai ở đây.
 *
 * Bossa **không swing**: nhạc Brazil chơi móc đơn đều, chất của nó nằm ở chỗ
 * đảo phách chứ không ở chỗ nảy. Trộn swing vào bossa là lỗi nghe ra ngay.
 */
export function soloFeelFor(styleId: string | undefined | null): SoloFeel {
  if (!styleId) return 'straight'
  switch (getStyle(styleId)?.feel) {
    case 'swing':
      return 'swing'
    case 'syncopated-3-3-2':
      return 'bossa'
    default:
      // Ballad, slow rock, pop, valse: đều. Không mượn cái nảy của jazz sang.
      return 'straight'
  }
}

/** Tỉ lệ dài ngắn 2:1 — nốt lệch rơi ở hai phần ba phách. */
const SWING_OFFBEAT = 2 / 3

/** Bossa nghiêng về phía trước: nốt lệch tới sớm, ngược hẳn cái nảy của jazz. */
const BOSSA_OFFBEAT = 0.47

/** Nốt nào coi là "nốt lệch" của một phách: quanh giữa phách. */
const isOffBeat = (offset: number) => offset > 0.4 && offset < 0.6

export interface TimedNote {
  startBeat: number
  durationBeats: number
}

/**
 * Đặt lại chỗ rơi của từng nốt theo feel.
 *
 * Trường độ co giãn theo, để nốt không đè lên nốt sau — nhưng không nốt nào bị
 * bỏ đi và không nốt nào đổi cao độ.
 */
export function applyFeel<T extends TimedNote>(
  notes: readonly T[],
  feel: SoloFeel,
  beatsPerBar = 4,
): T[] {
  if (feel === 'straight') return [...notes]

  const starts = new Set(notes.map((note) => Number(note.startBeat.toFixed(4))))
  const moved = notes.map((note) => {
    const beat = Math.floor(note.startBeat)
    const offset = note.startBeat - beat

    if (feel === 'swing') {
      /*
        Chỉ **móc đơn** mới nảy. Đoạn chạy móc kép thì người chơi jazz đánh đều —
        nảy cả móc kép là thành lắp bắp, không phải swing.

        Nốt chính đứng ngay trước một nốt lệch thì dài ra đúng phần nốt lệch
        trượt đi: đó chính là cái nảy, dài rồi ngắn, 2 trên 1.
      */
      if (isOffBeat(offset)) return { ...note, startBeat: beat + SWING_OFFBEAT }
      if (offset > 1e-6) return note
      const hasOffBeat = notes.some(
        (other) => Math.abs(other.startBeat - (beat + 0.5)) < 1e-6,
      )
      return hasOffBeat
        ? { ...note, durationBeats: Math.max(note.durationBeats, SWING_OFFBEAT) }
        : note
    }

    /*
      Bossa, hai chuyện cùng lúc, và **không chuyện nào là swing**.

      1. **Nghiêng về phía trước.** Nốt lệch tới sớm một chút thay vì muộn.
         Đây là chỗ khác nhau rõ nhất giữa bossa và jazz: cùng móc đơn đều trên
         giấy, jazz nảy ra sau, bossa đẩy ra trước. Nghiêng ít thôi — nhiều là
         thành lệch nhịp chứ không thành chất.
      2. **Nửa sau ô nhịp tới sớm một móc đơn.** Nốt rơi đúng phách 3 dời lên
         chỗ "và của phách 2" — cú đảo phách làm nên chất Brazil. Chỉ dời khi
         chỗ tới còn trống; câu chạy dày kín móc kép thì không còn khe nào, và
         lúc ấy chỉ còn phần nghiêng ở trên.

      Cả hai đều là **quy ước soạn của KeyTrain**, không phải bài của thầy nào:
      kho có mẫu ĐỆM bossa của thầy Hải và của Peter Martin, nhưng không có bài
      nào dạy cách chia nhịp cho một câu chạy bossa.
    */
    const inBar = ((note.startBeat % beatsPerBar) + beatsPerBar) % beatsPerBar
    if (Math.abs(inBar - beatsPerBar / 2) < 1e-6) {
      const target = note.startBeat - 0.5
      if (!starts.has(Number(target.toFixed(4)))) {
        return { ...note, startBeat: target, durationBeats: note.durationBeats + 0.5 }
      }
    }
    if (!isOffBeat(offset)) return note
    return { ...note, startBeat: beat + BOSSA_OFFBEAT }
  })

  // Nốt nào bị nốt sau đuổi kịp thì cắt ngắn lại, đừng để chồng tiếng.
  return moved.map((note) => {
    let duration = note.durationBeats
    for (const other of moved) {
      const room = other.startBeat - note.startBeat
      if (room > 1e-6 && duration > room) duration = room
    }
    return duration === note.durationBeats ? note : { ...note, durationBeats: duration }
  })
}
