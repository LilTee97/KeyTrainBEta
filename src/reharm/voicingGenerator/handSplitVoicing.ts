import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { ChooseVoicingOptions } from '../reharmEngine/voiceLeadingOptimizer'
import {
  chooseVoicing,
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

/** Quãng tám neo của nốt bass. */
const BASS_ANCHOR: MidiNote = 40

export interface TwoHandVoicing {
  /** Nốt tay trái, thường là một nốt bass. */
  left: MidiNote[]
  /** Nốt tay phải, phần hợp âm. */
  right: MidiNote[]
  /**
   * Thế bấm tay phải của **nốt treo**, vang trước rồi giải quyết về `right`.
   * Chỉ có khi hợp âm được đánh dấu là có nốt treo.
   */
  suspendedRight?: MidiNote[]
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

export interface TwoHandOptions extends ChooseVoicingOptions {
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
  const { dropRootFromRightHand = false, ...voicingOptions } = options

  const rightVoicings = voiceLeadSequence(chords, voicingOptions)

  return chords.map((chord, index) => {
    let right = rightVoicings[index] ?? []

    if (dropRootFromRightHand) {
      const withoutRoot = right.filter((note) => note % 12 !== chord.root)
      // Giữ lại nốt gốc nếu bỏ đi thì hợp âm mỏng quá.
      if (withoutRoot.length >= 3) right = withoutRoot
    }

    // Thế bấm của nốt treo: dựng ngay cạnh thế bấm đã giải quyết để hai bên
    // chỉ khác nhau đúng một nốt, nghe ra rõ chuyển động bậc bốn xuống bậc ba.
    let suspendedRight: MidiNote[] | undefined
    if (chord.suspension) {
      const susChord: ParsedChord = { ...chord, quality: chord.suspension }
      suspendedRight = chooseVoicing(susChord, right, voicingOptions)
    }

    return {
      left: [bassNoteFor(chord)],
      right,
      suspendedRight,
      symbol: chord.symbol,
    }
  })
}

/** Gộp hai tay thành một danh sách nốt, dùng khi phát tiếng. */
export function flattenHands(voicing: TwoHandVoicing): MidiNote[] {
  return [...voicing.left, ...voicing.right].sort((a, b) => a - b)
}
