import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import type { ParsedChord } from '../types'
import type { MidiNote } from '../../shared/musicTheory/types'
import { isBalladStyle } from './balladFamily'
import type { TimelineEvent } from './types'

/**
 * Tuyến trầm cho đoạn giang tấu: **rải ngón** thay vì giữ một nốt bass.
 *
 * Đoạn hát thì tay trái chỉ cần giữ nền cho giọng người. Giang tấu thì không có
 * ai hát, tay phải bỏ hẳn mẫu đệm để lên chạy giai điệu — nếu tay trái cũng chỉ
 * đặt một nốt mỗi ô thì cả đoạn rỗng ruột, chỉ còn một dòng nốt lơ lửng không
 * có gì đỡ.
 *
 * Bản ký âm *Hồng Kông 1* — chính bản mà đoạn giang tấu của app đọc ngược ra —
 * cho **5,5 lần tay trái vào mỗi ô nhịp** ở đoạn giang tấu. Bốn nốt rải một ô
 * nằm đúng trong khoảng đó, và vẫn giữ tay trái ở tầm trầm 36-52 như bản nhạc.
 *
 * Hình rải là **gốc - quãng 5 - quãng 8 - quãng 5**: đi lên rồi quay về, nên nốt
 * cuối ô đứng cạnh nốt gốc ô sau, không nhảy. Đây là hình đệm **ballad**, chỉ
 * dùng khi điệu thuộc họ ballad. Bossa / swing / valse giữ nguyên tiết tấu tay
 * trái của điệu — rải đều bốn nốt một ô làm bossa nghe ra ballad.
 *
 * ## Vì sao quãng 4 và quãng 5, không phải quãng 3
 *
 * Hình này khớp một luật thứ hai, độc lập với bản ký âm: thầy Hải, Tập 1 bài 9
 * mốc `18:36-22:36` (`tap-01-bai-09-lesson-id-0009-05`, `validated`) — *"hòa âm
 * cho giai điệu dân ca ngũ cung nên ưu tiên hòa âm quãng 4, hoặc kết hợp quãng 4
 * và quãng 5 xếp chồng, để giữ màu mộc mạc và thoát khỏi tiếng hòa âm tam diện
 * kiểu phương Tây."*
 *
 * Từ khi hợp âm ba nốt lấy ngũ cung của thầy làm chất liệu chạy (xem
 * `rule-hai-triad-pentatonic` bên PianoBrain), luật ấy áp đúng vào đây. Đo trên
 * vòng `C Am F G`: tuyến trầm đi -5, +5, -5 nửa cung và **không chồng nốt nào**,
 * tức không có một quãng ba nào — đã đúng luật sẵn, không phải sửa.
 *
 * Ai định đổi hình này sang chồng quãng ba cho "dày" thì đọc lại đoạn trên: dày
 * lên là mất đúng cái màu thầy bảo phải giữ.
 */

/** Tầm tay trái ở đoạn giang tấu, đọc từ bản ký âm: 36-52. */
const BASS_LOW = 36
const BASS_HIGH = 52

/** Nốt gốc của hợp âm, đặt vào tầm trầm. */
function bassRoot(chord: ParsedChord): MidiNote {
  const pc = ((chord.bass ?? chord.root) % 12 + 12) % 12
  let note = BASS_LOW + ((pc - (BASS_LOW % 12) + 12) % 12)
  // Neo quanh giữa tầm để nốt quãng 8 phía trên còn chỗ.
  while (note + 12 <= BASS_HIGH) note += 12
  while (note > BASS_HIGH) note -= 12
  return note as MidiNote
}

export interface InterludeBassRequest {
  chords: readonly ParsedChord[]
  /** Số phách mỗi hợp âm chiếm, theo đúng thứ tự hợp âm. */
  beatsEach: readonly number[]
}

/**
 * Dựng tuyến trầm rải cho một vòng giang tấu.
 *
 * Ô ngắn hơn hai phách thì chỉ đặt nốt gốc: bốn nốt rải nhồi vào nửa ô thành
 * chuỗi nốt kép lộn xộn, không phải tuyến trầm.
 */
export function interludeBassLine(
  request: InterludeBassRequest,
): TimelineEvent[] {
  const { chords, beatsEach } = request
  const events: TimelineEvent[] = []
  let cursor = 0

  for (const [index, chord] of chords.entries()) {
    const beats = beatsEach[index] ?? 4
    const root = bassRoot(chord)
    const tones = chordPitchClasses(chord.root, chord.quality)

    /*
      Quãng 5 lấy từ **nốt đang vang của hợp âm**, không phải cộng bảy nửa cung
      cho mọi hợp âm: hợp âm nửa giảm có quãng năm giảm, cộng bừa là ra nốt
      ngoài hợp âm ngay ở bè trầm.
    */
    const fifthPc = tones.find(
      (pc) => ((pc - chord.root) % 12 + 12) % 12 === 7,
    ) ?? tones.find((pc) => ((pc - chord.root) % 12 + 12) % 12 === 6)
    const fifth = fifthPc === undefined
      ? root
      : (root + (((fifthPc - (root % 12)) % 12) + 12) % 12) as MidiNote

    /*
      Mọi nốt phải nằm trong tầm trầm đã khai ở trên.

      Bản trước cộng thẳng quãng tám vào nốt gốc mà không kiểm trần: gốc Rê ở
      quãng tám 3 cộng lên thành Rê quãng tám 4, tức tay trái bò vào chỗ tay
      phải đang chạy solo. Quãng năm cũng vậy — nó được tính từ nốt gốc rồi đẩy
      lên, chưa lần nào bị chặn.

      Không đủ chỗ cho nốt cao thì bỏ nó, chơi lại nốt gốc: thà tuyến trầm đơn
      điệu một nhịp còn hơn hai tay giẫm lên nhau.
    */
    const fit = (note: number): MidiNote =>
      (note > BASS_HIGH ? note - 12 : note) as MidiNote

    const octave = root + 12 <= BASS_HIGH ? ((root + 12) as MidiNote) : root
    const shape: MidiNote[] =
      beats < 2 ? [root] : [root, fit(fifth), octave, fit(fifth)]

    const step = beats / shape.length
    shape.forEach((note, at) => {
      events.push({
        notes: [note],
        startBeat: cursor + at * step,
        durationBeats: step * 0.9,
        hand: 'left',
        // Phách đầu ô nặng hơn, ba nốt sau đỡ nền.
        velocity: at === 0 ? 84 : 70,
        grace: false,
      })
    })

    cursor += beats
  }

  return events
}

/**
 * Tay trái đoạn giang tấu: ballad thì rải, điệu khác giữ đúng mẫu của điệu.
 */
export function interludeLeftHand(options: {
  chords: readonly ParsedChord[]
  beatsEach: readonly number[]
  styleId: string
  styleLeft: readonly TimelineEvent[]
}): TimelineEvent[] {
  return isBalladStyle(options.styleId)
    ? interludeBassLine(options)
    : [...options.styleLeft]
}
