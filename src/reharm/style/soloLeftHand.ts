import { LEFT_HAND_LOW } from '../voicingGenerator/handSplitVoicing'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'

/**
 * Tay trái **gánh trọn mẫu đệm** ở đoạn không lời.
 *
 * Ở đoạn có lời, tay trái chỉ đặt nền còn tay phải quạt hợp âm — hai tay chia
 * nhau mẫu đệm. Đoạn không lời thì tay phải bỏ hẳn phần quạt để lên chạy giai
 * điệu, nên nếu tay trái vẫn chơi đúng phần cũ thì mẫu đệm mất một nửa và cả
 * đoạn nghe rỗng. Người dùng nghe ra trước khi đo: "tay trái chơi bass khá ít
 * nên tạo ra cảm giác solo khá đơn điệu."
 *
 * Đo trên bảy bản ký âm của Cà Pháo (`tools/sheet/profile.py` bên PianoBrain),
 * tay trái ở đoạn giang tấu:
 *
 * | | mốc gõ mỗi ô | tầm đi | nốt mỗi lần gõ |
 * |---|---|---|---|
 * | Cà Pháo | 4,9 - 6,0 | **23 - 40 nửa cung** | 1,04 - 1,20 |
 * | KeyTrain, bolero | 2,0 | **7** | 1,00 |
 * | KeyTrain, bossa | 4,0 | 12 | 1,00 |
 * | KeyTrain, slow rock | 3,0 | 16 | 1,00 |
 *
 * Hai chỗ lệch, và chúng khác nhau:
 *
 * - **Số cú gõ**: bolero chỉ hai lần một ô nhịp. Đó là phần bass của một mẫu
 *   đệm hai tay, không phải cả mẫu đệm.
 * - **Tầm đi**: tay trái người thật chạy hai tới ba quãng tám. Tay trái của app
 *   quanh quẩn một quãng năm tới một quãng tám — nó ĐẶT nốt chứ không ĐI.
 *
 * ## Cách dựng
 *
 * Chỗ gõ lấy từ **hợp cả hai tay của chính ô nhịp điệu ấy**. Đây là điểm phải
 * giữ: người dùng đã ra luật đoạn không lời phải chơi đúng điệu đang chọn, và
 * luật ấy vẫn nguyên — tay trái nhận thêm phần tay phải bỏ lại, chứ không mượn
 * tiết tấu của điệu khác. Slow rock sáu phách thì tay trái gõ đủ sáu; bolero
 * thì gõ đủ hình Pùng-Pắp; bossa thì giữ chỗ đảo phách của chính nó.
 *
 * Cao độ đi theo **hình rải lên rồi về**, trải trên tầm đã cho. Đi lên rồi về
 * chứ không đi lên mãi, vì nốt cuối ô phải đứng cạnh nốt gốc ô sau — không thì
 * mỗi vạch nhịp là một cú nhảy. Tài liệu `Reference/pianoimprovnotes.md` ghi
 * đúng hai điều này: rải hợp âm dùng được cho cả tay trái, và phải "thay đổi
 * quãng âm — lúc cao lúc thấp — để tạo kịch tính".
 */

/**
 * Trần tay trái khi nó gánh mẫu đệm.
 *
 * Luật cũ của app: tay trái không chạm Đô quãng tám 4. Người dùng bỏ luật ấy,
 * và số đo đứng về phía họ — trên bản ký âm của Cà Pháo, hai tay CHỒNG TẦM ở
 * đoạn giang tấu: trần tay trái cao hơn sàn tay phải 3 tới 12 nửa cung ở bốn
 * trên sáu bài.
 *
 * | | trần tay trái | sàn tay phải |
 * |---|---|---|
 * | Hồng Kông 1 | 64 | 60 |
 * | Người hãy quên | 62 | 57 |
 * | Bèo dạt mây trôi | 63 | 60 |
 * | Kém duyên | 70 | 58 |
 *
 * Ràng buộc thật của người chơi là **hai tay không cùng bấm một phím một lúc**,
 * không phải hai tầm rời hẳn nhau. Bàn tay người chia nhau khoảng giữa đàn.
 *
 * 64 là trung vị hơi lệch lên của số đo trên. Cho tầm đi 28 nửa cung, nằm giữa
 * khoảng 23-40 của người thật, thay vì 23 khi còn bị Đô quãng tám 4 chặn.
 */
const SOLO_LEFT_TOP = 64

export interface SoloLeftHandOptions {
  chords: readonly ParsedChord[]
  /** Số phách mỗi hợp âm chiếm, theo đúng thứ tự hợp âm. */
  beatsEach: readonly number[]
  style: StylePattern
  /** Trần tay trái. Bỏ trống là hai quãng tám kể từ sàn. */
  top?: number
}

/**
 * Chỗ gõ của mẫu đệm trong một ô nhịp, **gộp cả hai tay**, quy về nốt đen.
 *
 * Nhịp kép (mẫu số 8) thì lấy **trọn mọi phách**, không chỉ những chỗ ô nhịp
 * gõ. Slow rock 6/8 là sáu phách, và ở đoạn không lời thì cả sáu phải nghe
 * thấy — người dùng ra luật ấy. Mẫu đệm chỉ gõ bốn trong sáu chỗ vì hai chỗ
 * kia là chỗ NGHỈ dành cho giọng hát; không có ai hát thì chỗ nghỉ ấy hết lý
 * do tồn tại, và bỏ trống hai phách trong sáu là đúng chỗ đoạn solo nghe hụt.
 */
export function patternOnsets(style: StylePattern): number[] {
  if (!style.cell) return []
  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid

  if (style.timeSignature.endsWith('/8')) {
    return Array.from({ length: style.beatsPerMeasure }, (_, at) =>
      Number((at * grid).toFixed(3)),
    )
  }

  const beats = [...style.cell.left, ...style.cell.right].map((hit) =>
    Number(((((hit.beat * grid) % bar) + bar) % bar).toFixed(3)),
  )
  return [...new Set(beats)].sort((a, b) => a - b)
}

/**
 * Thang nốt của hợp âm trong tầm tay trái, xếp tăng dần.
 *
 * Chỉ nốt của chính hợp âm — tay trái đang giữ hoà âm, không phải chỗ để chèn
 * nốt ngoài. Nốt màu là việc của tay phải.
 */
function ladder(chord: ParsedChord, low: number, high: number): MidiNote[] {
  const tones = new Set(chordPitchClasses(chord.root, chord.quality))
  const bass = chord.bass ?? chord.root
  tones.add(((bass % 12) + 12) % 12)

  const out: MidiNote[] = []
  for (let note = low; note <= high; note += 1) {
    if (tones.has((((note % 12) + 12) % 12) as never)) out.push(note as MidiNote)
  }
  return out
}

/**
 * Hình đi lên rồi về, đúng `count` bước, trải hết thang.
 *
 * Trải hết chứ không đi từng bậc liền: thang một hợp âm trong hai quãng tám có
 * chừng bảy tám bậc, mà một ô nhịp chỉ có hai tới sáu cú gõ — đi từng bậc thì
 * chỉ bò được nửa dưới và tầm đi teo lại đúng chỗ đang muốn mở ra.
 */
function upAndBack(steps: number, count: number): number[] {
  if (count <= 1) return [0]
  const out: number[] = []
  // Đỉnh rơi vào khoảng hai phần ba câu: lên thong thả, về nhanh hơn.
  const peak = Math.max(1, Math.round((count - 1) * 0.66))
  for (let at = 0; at < count; at += 1) {
    const ratio = at <= peak ? at / peak : (count - 1 - at) / Math.max(1, count - 1 - peak)
    out.push(Math.round(ratio * (steps - 1)))
  }
  return out
}

export function soloLeftHand(options: SoloLeftHandOptions): TimelineEvent[] {
  const { chords, beatsEach, style } = options
  const onsets = patternOnsets(style)
  if (onsets.length === 0 || chords.length === 0) return []

  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid
  const top = options.top ?? SOLO_LEFT_TOP
  const events: TimelineEvent[] = []
  let cursor = 0

  chords.forEach((chord, index) => {
    const beats = beatsEach[index] ?? bar
    const steps = ladder(chord, LEFT_HAND_LOW, top)
    if (steps.length === 0) {
      cursor += beats
      return
    }

    /*
      Ô nhịp ngắn hơn một ô của điệu thì chỉ lấy những cú gõ còn nằm trong nó —
      hợp âm chia đôi vẫn phải nghe ra là nửa ô, không phải một ô bị bóp.
    */
    const hits: number[] = []
    for (let at = 0; at < beats - 1e-6; at += bar) {
      for (const onset of onsets) {
        if (at + onset < beats - 1e-6) hits.push(at + onset)
      }
    }
    if (hits.length === 0) hits.push(0)

    const shape = upAndBack(steps.length, hits.length)
    hits.forEach((offset, at) => {
      const next = hits[at + 1] ?? beats
      events.push({
        notes: [steps[Math.min(steps.length - 1, shape[at]!)]!],
        startBeat: cursor + offset,
        durationBeats: Math.max(0.05, (next - offset) * 0.92),
        hand: 'left',
        // Phách đầu ô nặng hơn: nó vẫn là chỗ hợp âm đổi.
        velocity: offset % bar < 1e-6 ? 86 : 70,
      })
    })

    cursor += beats
  })

  return events
}

/**
 * Tay trái **nhường một quãng tám** khi trùng phím với giai điệu.
 *
 * Bỏ luật "tay trái không chạm Đô quãng tám 4" thì hai tầm chồng nhau, và chồng
 * tầm là chuyện bình thường — người chơi thật vẫn vậy. Thứ KHÔNG bình thường là
 * hai tay cùng bấm một phím vào cùng một lúc: trên đàn thật thì một ngón chặn
 * ngón kia, trong MIDI thì tiếng trước bị cắt ngang hoặc kẹt luôn.
 *
 * Giai điệu thắng, vì nó là thứ người nghe đang theo. Tay trái là nốt rải nên
 * hạ một quãng tám vẫn đúng cao độ của hợp âm, chỉ đổi tầng — không mất gì.
 *
 * CHƯA PHỦ ĐOẠN GIANG TẤU. Đoạn dạo đầu và kết bài ráp cả hai bè trong
 * `buildPhraseSection` nên gọi được hàm này; giang tấu thì phần đệm và câu solo
 * đi hai đường rồi mới gặp nhau trong `buildArrangedSong`, chỗ ấy chưa có móc
 * để chen vào. Đo ra 1 va chạm trên 32 lượt — thấp, nhưng không phải không.
 */
export function avoidMelodyClash(
  left: readonly TimelineEvent[],
  melody: readonly TimelineEvent[],
  low = LEFT_HAND_LOW,
): TimelineEvent[] {
  if (melody.length === 0) return [...left]

  return left.map((event) => {
    const busy = new Set(
      melody
        .filter((line) => Math.abs(line.startBeat - event.startBeat) < 0.02)
        .flatMap((line) => line.notes),
    )
    if (busy.size === 0 || !event.notes.some((note) => busy.has(note))) return event

    const moved = event.notes.map((note) => {
      const down = note - 12
      return (down >= low && !busy.has(down as MidiNote) ? down : note) as MidiNote
    })
    return { ...event, notes: moved }
  })
}
