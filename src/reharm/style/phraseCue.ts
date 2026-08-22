import { scaleTones } from '../reharmEngine/keyDetection'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

/**
 * Hai chỗ đóng khung một bài đệm: **báo ca sĩ vào** và **kết cho tình cảm**.
 *
 * Cả hai đều là việc của người đệm chứ không phải của bộ não — kho chưa có luật
 * nào của thầy nói về chúng, nên chỗ này ghi thẳng là kỹ thuật soạn, không dán
 * tên ai.
 */

/** Tầm câu báo hiệu: quanh giữa đàn, chỗ tai bắt rõ nhất. */
const CUE_LOW = 60
const CUE_HIGH = 79

/**
 * Câu chạy báo ca sĩ chuẩn bị vào, đặt ở phách cuối đoạn dạo đầu.
 *
 * Người đệm thật báo bằng hai thứ cùng lúc: một **hợp âm hút** (đã lo ở ô cuối
 * của `phraseChords`) và một **câu chạy đi lên** đâm thẳng vào vạch nhịp. Câu
 * đi lên vì đi lên thì tai đếm được còn mấy nốt nữa là tới đích; đi xuống nghe
 * như đang kết chứ không như đang mời vào.
 *
 * Bốn nốt móc kép ở phách chót, leo liền bậc trong giọng lên nốt gốc của hợp âm
 * mở bài. Ngắn thôi — dài quá thì thành một câu nhạc riêng, và ca sĩ lại phải
 * chờ nó xong.
 */
export function singerCue(
  chords: readonly ParsedChord[],
  lengthBeats: number,
  key: { tonic: PitchClass; scale: ScaleType } | null,
): TimelineEvent[] {
  const last = chords[chords.length - 1]
  if (!last || !key || lengthBeats < 1) return []

  /*
    Đích là nốt gốc của hợp âm **hút**, tức nốt mà hợp âm mở bài sắp giải quyết
    về. Leo tới đó rồi buông, để chính giọng hát là thứ chạm vạch nhịp.
  */
  const scale = scaleTones(key.tonic, key.scale)
  const targetPc = ((last.root + 5) % 12) as PitchClass

  let top = CUE_LOW
  for (let note = CUE_LOW; note <= CUE_HIGH; note += 1) {
    if (((note % 12) + 12) % 12 === targetPc) top = note
  }
  while (top - 12 >= CUE_LOW + 7) top -= 12

  // Bốn bậc liền nhau trong giọng, đếm ngược từ đích xuống.
  const steps: MidiNote[] = [top as MidiNote]
  let note = top
  while (steps.length < 4 && note > CUE_LOW) {
    note -= 1
    if (scale.has((((note % 12) + 12) % 12) as PitchClass)) {
      steps.unshift(note as MidiNote)
    }
  }
  if (steps.length < 2) return []

  const start = lengthBeats - 1
  const step = 1 / steps.length

  return steps.map((pitch, at) => ({
    notes: [pitch],
    startBeat: start + at * step,
    durationBeats: step * 0.9,
    hand: 'right' as const,
    // To dần: nốt cuối là chỗ ca sĩ lấy hơi vào.
    velocity: 74 + at * 6,
    grace: false,
  }))
}

/**
 * Kết chậm rãi: **giãn nốt cuối ra và bớt lực**.
 *
 * Đoạn kết đi thẳng cùng nhịp với thân bài thì nghe như bài bị cắt ngang chứ
 * không như một câu kết. Người đệm thật chậm dần ở ô chót và buông nốt cuối cho
 * ngân — chỗ này làm đúng vậy: nốt trong ô cuối được kéo dài dần, và tiếng chót
 * ngân trọn phần còn lại.
 *
 * Không đổi cao độ, không thêm nốt. Chỉ đổi trường độ và lực — kết là chỗ bớt
 * lại, không phải chỗ thêm vào.
 */
export function slowClose(
  events: readonly TimelineEvent[],
  lengthBeats: number,
): TimelineEvent[] {
  if (events.length === 0) return []

  const lastBarFrom = Math.max(0, lengthBeats - 4)
  const inLastBar = events.filter((event) => event.startBeat >= lastBarFrom)
  if (inLastBar.length === 0) return [...events]

  const finalBeat = Math.max(...inLastBar.map((event) => event.startBeat))

  return events.map((event) => {
    if (event.startBeat < lastBarFrom) return event

    // Càng về cuối càng giãn: nốt chót ngân hết phần còn lại của đoạn.
    const isFinal = event.startBeat >= finalBeat - 1e-6
    const spread = 1 + (event.startBeat - lastBarFrom) / 4
    return {
      ...event,
      durationBeats: isFinal
        ? Math.max(event.durationBeats, lengthBeats - event.startBeat)
        : event.durationBeats * spread,
      velocity: Math.max(40, Math.round(event.velocity * (isFinal ? 0.8 : 0.9))),
    }
  })
}

/**
 * Một phách hợp âm **báo**, đánh sau khi vòng dạo đầu đã chạy trọn.
 *
 * Hai cách đánh, và cách nào cũng có người dùng thật:
 *
 * - **Dặm một lượt**: cả hợp âm vang cùng lúc. Dứt khoát, hợp với điệu có nhịp
 *   rõ — người hát bắt được ngay vạch nhịp.
 * - **Rải ngón** (rolling): các nốt rơi lần lượt từ dưới lên, cách nhau một chút
 *   xíu. Mềm hơn, hợp với ballad; nốt trên cùng rơi đúng phách nên vẫn báo được
 *   giờ, mà không nện một cú vào chỗ ca sĩ sắp lấy hơi.
 *
 * Chọn theo điệu chứ không chọn bừa: ballad thì rải, điệu khác thì dặm.
 */
export function cueStrike(
  notes: readonly MidiNote[],
  startBeat: number,
  options: { roll: boolean; beats?: number },
): TimelineEvent[] {
  if (notes.length === 0) return []

  const beats = options.beats ?? 1
  const sorted = [...notes].sort((a, b) => a - b)

  if (!options.roll) {
    return [
      {
        notes: sorted,
        startBeat,
        durationBeats: beats * 0.95,
        hand: 'right' as const,
        velocity: 92,
        grace: false,
      },
    ]
  }

  /*
    Rải ngược thời gian: nốt **trên cùng** rơi đúng phách, mấy nốt dưới đi
    trước. Rải xuôi thì cả cụm đến muộn và phách bị nhoè.
  */
  const gap = Math.min(0.08, beats / (sorted.length * 3))

  return sorted.map((note, at) => ({
    notes: [note],
    startBeat: startBeat - (sorted.length - 1 - at) * gap,
    durationBeats: beats * 0.95 + (sorted.length - 1 - at) * gap,
    hand: 'right' as const,
    // Nốt trên cùng to nhất: đó là nốt tai bám vào để vào nhịp.
    velocity: 78 + at * 5,
    grace: false,
  }))
}
