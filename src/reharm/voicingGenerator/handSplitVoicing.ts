import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { ChooseVoicingOptions } from '../reharmEngine/voiceLeadingOptimizer'
import { voiceLeadSequence } from '../reharmEngine/voiceLeadingOptimizer'

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
 * Thứ tự bỏ nốt khi hợp âm quá dày, tính bằng quãng so với nốt gốc.
 *
 * Theo đúng thứ tự ưu tiên của lối bấm jazz:
 * 1. **Quãng năm đúng** — nốt ít thông tin nhất, bỏ đi hợp âm vẫn nguyên chất.
 * 2. **Nốt gốc** — tay trái đã giữ rồi, giữ thêm ở tay phải chỉ làm đục tiếng.
 * 3. **Bậc chín**, rồi **bậc mười một** — các nốt màu, bỏ sau cùng.
 *
 * Bậc ba và bậc bảy không bao giờ bị bỏ: hai nốt đó quyết định tính chất hợp
 * âm, mất chúng là mất luôn hợp âm.
 */
const OMISSION_ORDER = [7, 0, 2, 5] as const

/**
 * Bỏ bớt nốt cho vừa tay.
 *
 * Hợp âm treo được bảo vệ riêng: với hợp âm không có bậc ba, nốt treo chính là
 * thứ thay thế bậc ba nên bỏ đi là hỏng hợp âm.
 */
export function limitHandSize(
  notes: readonly MidiNote[],
  chord: ParsedChord,
  maxNotes: number = DEFAULT_MAX_HAND_NOTES,
): MidiNote[] {
  if (notes.length <= maxNotes) return [...notes]

  const intervals = new Set(chord.quality.intervals.map((i) => i % 12))
  const hasThird = intervals.has(3) || intervals.has(4)

  const result = [...notes]

  for (const interval of OMISSION_ORDER) {
    if (result.length <= maxNotes) break

    // Hợp âm treo giữ nguyên nốt treo, vì nó đứng thay bậc ba.
    if (!hasThird && (interval === 2 || interval === 5)) continue

    const target = normalizePitchClass(chord.root + interval)
    const index = result.findIndex((note) => note % 12 === target)
    if (index >= 0) result.splice(index, 1)
  }

  // Vẫn thừa thì bỏ từ dưới lên, vì nốt cao mang màu rõ hơn.
  while (result.length > maxNotes) result.shift()

  return result
}

export interface TwoHandOptions extends ChooseVoicingOptions {
  /** Số nốt nhiều nhất tay phải bấm. Mặc định bốn. */
  maxRightHandNotes?: number
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
  const {
    dropRootFromRightHand = false,
    maxRightHandNotes = DEFAULT_MAX_HAND_NOTES,
    ...voicingOptions
  } = options

  const rightVoicings = voiceLeadSequence(chords, voicingOptions)

  return chords.map((chord, index) => {
    let right = rightVoicings[index] ?? []

    if (dropRootFromRightHand) {
      const withoutRoot = right.filter((note) => note % 12 !== chord.root)
      // Giữ lại nốt gốc nếu bỏ đi thì hợp âm mỏng quá.
      if (withoutRoot.length >= 3) right = withoutRoot
    }

    // Bỏ bớt nốt cho vừa tay — bước cuối, sau mọi lựa chọn khác.
    right = limitHandSize(right, chord, maxRightHandNotes)

    return {
      left: [bassNoteFor(chord)],
      right,
      symbol: chord.symbol,
    }
  })
}

/** Gộp hai tay thành một danh sách nốt, dùng khi phát tiếng. */
export function flattenHands(voicing: TwoHandVoicing): MidiNote[] {
  return [...voicing.left, ...voicing.right].sort((a, b) => a - b)
}
