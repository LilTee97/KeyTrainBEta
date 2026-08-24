import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { ChooseVoicingOptions } from '../reharmEngine/voiceLeadingOptimizer'
import {
  RIGHT_HAND_HIGH,
  voiceLeadSequence,
} from '../reharmEngine/voiceLeadingOptimizer'

/**
 * Chia thế bấm cho hai tay theo lối đệm hát piano.
 *
 * Tay trái giữ nốt bass, tay phải chơi phần hợp âm. Đây là cách chia mà tài
 * liệu phong cách mô tả ở mọi điệu: bass ở tay trái, hợp âm chặn ở tay phải.
 *
 * Việc tách bạch hai tay từ bây giờ phục vụ luôn cho chế độ luyện tay trái /
 * tay phải riêng ở các bước sau.
 */

/** Dải nốt hợp lý cho tay trái. */
export const LEFT_HAND_LOW: MidiNote = 36
export const LEFT_HAND_HIGH: MidiNote = 55

/** Hai tay không dang quá hai quãng tám. */
const MAX_HAND_SPAN = 24
/** Khe tối thiểu giữa ngón cao nhất tay trái và thấp nhất tay phải. */
const MIN_HAND_GAP = 7

/**
 * Đưa hai tay ra hai bên: trái dưới phải, khe ≥ 5 độ, không xa quá 2 quãng tám.
 * Trái tràn thì hạ trái trước, không đẩy phải lên chồng thêm.
 */
export function settleHands(
  left: readonly MidiNote[],
  right: readonly MidiNote[],
): { left: MidiNote[]; right: MidiNote[] } {
  if (left.length === 0 || right.length === 0) {
    return { left: [...left], right: [...right] }
  }

  let low = [...left]
  let high = [...right]

  for (let step = 0; step < 8; step += 1) {
    const topLeft = Math.max(...low)
    const bottomRight = Math.min(...high)
    if (bottomRight - topLeft < MIN_HAND_GAP) {
      if (Math.min(...low) - 12 >= LEFT_HAND_LOW) {
        low = low.map((note) => (note - 12) as MidiNote)
        continue
      }
      if (Math.max(...high) + 12 <= 84) {
        high = high.map((note) => (note + 12) as MidiNote)
        continue
      }
    }

    const span = Math.max(...high) - Math.min(...low)
    if (span > MAX_HAND_SPAN) {
      if (Math.min(...high) - 12 > Math.max(...low)) {
        high = high.map((note) => (note - 12) as MidiNote)
        continue
      }
      if (Math.max(...low) + 12 < Math.min(...high)) {
        low = low.map((note) => (note + 12) as MidiNote)
        continue
      }
    }
    break
  }

  return { left: low, right: high }
}

/** Trần tay trái / sàn tay phải — hai bên phím, không dùng chung quãng. */
const LEFT_REGISTER_TOP = 55
const RIGHT_REGISTER_FLOOR = 60

export function clampToHandRegister(
  note: MidiNote,
  hand: 'left' | 'right',
): MidiNote {
  if (hand === 'left') {
    let pitch = note
    while (pitch > LEFT_REGISTER_TOP) pitch -= 12
    while (pitch < LEFT_HAND_LOW) pitch += 12
    return pitch as MidiNote
  }
  let pitch = note
  while (pitch < RIGHT_REGISTER_FLOOR) pitch += 12
  while (pitch > 79) pitch -= 12
  return pitch as MidiNote
}

/**
 * Quãng tám neo của nốt bass.
 *
 * Đặt cao hơn đáy tầm tay trái một chút để hai tay nằm sát nhau — bass quá
 * thấp thì phần giữa bị hụt và hợp âm nghe rỗng.
 */
const BASS_ANCHOR: MidiNote = 43

export interface TwoHandVoicing {
  /** Nốt tay trái, thường là một nốt bass. */
  left: MidiNote[]
  /** Nốt tay phải, phần hợp âm. */
  right: MidiNote[]
  /** Tên hợp âm để hiển thị. */
  symbol: string
}

/**
 * Nốt bass của một hợp âm.
 *
 * Hợp âm chồng trên bass thì lấy nốt bass đã ghi, còn lại lấy nốt gốc. Đây
 * chính là chỗ tư duy slash chord của phong cách được thể hiện thành tiếng:
 * tay phải chơi một hợp âm đơn giản, tay trái đặt nốt bass khác bên dưới.
 */
export function bassNoteFor(
  chord: ParsedChord,
  anchor: MidiNote = BASS_ANCHOR,
): MidiNote {
  const pitchClass = chord.bass ?? chord.root

  // Đưa lớp cao độ về quãng tám neo, rồi kéo lên nếu rơi dưới dải tay trái.
  let note = anchor + ((pitchClass - (anchor % 12) + 12) % 12)
  while (note < LEFT_HAND_LOW) note += 12
  while (note > LEFT_HAND_HIGH) note -= 12

  return note
}

/**
 * Số nốt nhiều nhất một tay bấm được.
 *
 * Bàn tay có năm ngón nhưng bấm năm nốt cùng lúc đã rất chật, sáu nốt thì
 * không thể. Bốn nốt là mức tay người chơi thoải mái, và cũng đúng lối bấm
 * jazz tiêu chuẩn: tay phải chơi bốn nốt, tay trái giữ bass.
 */
export const DEFAULT_MAX_HAND_NOTES = 4

/**
 * Số nốt tay trái giữ, tuỳ theo hợp âm có mấy nốt.
 *
 * Hợp âm dày thì **chia cho cả hai tay** chứ không bỏ bớt nốt — bỏ nốt là làm
 * mất màu hợp âm, mà nhiều hợp âm phải vang đủ nốt mới đúng chất. Hợp âm năm
 * nốt chia hai–ba, sáu nốt chia ba–ba.
 *
 * Hợp âm từ bốn nốt trở xuống thì tay trái chỉ giữ nốt bass, tay phải bấm trọn
 * hợp âm — đây là lối đệm quen thuộc nhất, và nốt gốc nhân đôi ở hai tay nghe
 * bình thường.
 */
export function leftHandNoteCount(
  chordSize: number,
  share: 'comp' | 'drill' = 'comp',
): number {
  if (share === 'drill') {
    if (chordSize <= 3) return 1
    if (chordSize <= 5) return 2
    return 3
  }
  if (chordSize <= 4) return 1
  return Math.floor(chordSize / 2)
}

export interface TwoHandOptions extends ChooseVoicingOptions {
  leftHandShare?: 'comp' | 'drill'
  /**
   * Bỏ nốt gốc ở tay phải khi tay trái đã giữ nó.
   *
   * Nhân đôi nốt gốc ở hai tay làm hợp âm nghe nặng và đục; bỏ đi thì phần
   * màu của hợp âm nổi rõ hơn. Chỉ áp dụng khi hợp âm còn đủ từ ba nốt.
   */
  dropRootFromRightHand?: boolean
}

/** Chia hai tay cho cả một chuỗi hợp âm, tay phải đã được dẫn bè. */
export function voiceLeadTwoHands(
  chords: readonly ParsedChord[],
  options: TwoHandOptions = {},
): TwoHandVoicing[] {
  const { dropRootFromRightHand = false, leftHandShare = 'comp', ...voicingOptions } =
    options

  // Hợp âm ít nốt thì tay phải bấm trọn, nên vẫn dẫn bè được như cũ.
  const rightVoicings = voiceLeadSequence(chords, voicingOptions)

  return chords.map((chord, index) => {
    const chordSize = chord.quality.intervals.length
    const bassNote = bassNoteFor(chord)

    // Hợp âm dày: xếp chồng từ nốt bass rồi cắt đôi cho hai tay.
    if (leftHandNoteCount(chordSize, leftHandShare) > 1) {
      const stacked = fitStackedChord(bassNote, chord)
      const leftCount = leftHandNoteCount(chordSize, leftHandShare)

      const split = settleHands(
        stacked.slice(0, leftCount),
        stacked.slice(leftCount),
      )
      return { ...split, symbol: chord.symbol }
    }

    let right = rightVoicings[index] ?? []

    if (dropRootFromRightHand) {
      const withoutRoot = right.filter((note) => note % 12 !== chord.root)
      // Giữ lại nốt gốc nếu bỏ đi thì hợp âm mỏng quá.
      if (withoutRoot.length >= 3) right = withoutRoot
    }

    const split = settleHands([bassNote], right)
    return { ...split, symbol: chord.symbol }
  })
}

/**
 * Xếp chồng trọn hợp âm từ nốt bass, rồi dịch cho lọt vào tầm hai tay.
 *
 * Dùng cho hợp âm dày. Ở đây chấp nhận **không đảo hợp âm** — hợp âm năm sáu
 * nốt thì thế nguyên vị vốn là cách xếp chuẩn, và việc giữ nốt bass đúng chỗ
 * quan trọng hơn việc dẫn bè mượt giữa các hợp âm.
 */
function fitStackedChord(
  bassNote: MidiNote,
  chord: ParsedChord,
): MidiNote[] {
  const stacked = chord.quality.intervals.map(
    (interval) => bassNote + interval,
  )

  // Trôi lên quá cao thì hạ cả cụm xuống một quãng tám.
  const highest = stacked[stacked.length - 1]
  return highest > RIGHT_HAND_HIGH
    ? stacked.map((note) => note - 12)
    : stacked
}

/** Gộp hai tay thành một danh sách nốt, dùng khi phát tiếng. */
export function flattenHands(voicing: TwoHandVoicing): MidiNote[] {
  return [...voicing.left, ...voicing.right].sort((a, b) => a - b)
}
