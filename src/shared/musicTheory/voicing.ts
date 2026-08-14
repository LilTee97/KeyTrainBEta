import { chordNotes } from './chordDefinitions'
import type { ChordQuality, MidiNote } from './types'

/**
 * Dựng thế bấm cụ thể cho một hợp âm.
 *
 * Một hợp âm có nhiều cách bấm hợp lý tuỳ ngữ cảnh nhạc — nhất là hợp âm
 * bảy và hợp âm mở rộng — nên module này trả về **một thế bấm cụ thể** theo
 * kiểu được chọn, chứ không phải tập nốt trừu tượng. Giao diện dựa vào đó để
 * chỉ cho người học đúng một hình dạng tay.
 */

export type VoicingType =
  /** Xếp chồng từ nốt gốc lên, không đảo. */
  | 'close'
  /** Đưa vài nốt dưới cùng lên quãng tám trên. */
  | 'inversion'
  /** Chỉ giữ gốc, bậc 3 và bậc 7 — lối bấm rút gọn kinh điển của jazz. */
  | 'shell'
  /** Bỏ nốt gốc, dành nốt gốc cho tay trái hoặc cây bass. */
  | 'rootless'
  /** Hạ nốt cao thứ hai xuống một quãng tám, cho hợp âm thoáng hơn. */
  | 'drop2'

export interface VoicingOption {
  id: VoicingType
  label: string
  description: string
}

export const VOICING_OPTIONS: readonly VoicingOption[] = [
  {
    id: 'close',
    label: 'Thế gốc',
    description: 'Xếp chồng từ nốt gốc lên, dễ nhận dạng nhất.',
  },
  {
    id: 'inversion',
    label: 'Thế đảo',
    description: 'Nốt gốc không nằm dưới cùng, giúp tay di chuyển ít hơn.',
  },
  {
    id: 'shell',
    label: 'Shell',
    description: 'Chỉ gốc, bậc 3 và bậc 7 — đủ nói lên màu hợp âm.',
  },
  {
    id: 'rootless',
    label: 'Bỏ nốt gốc',
    description: 'Nhường nốt gốc cho tay trái, tay phải chơi phần màu.',
  },
  {
    id: 'drop2',
    label: 'Drop 2',
    description: 'Hạ nốt cao thứ hai xuống một quãng tám cho thoáng.',
  },
]

/** Dải nốt của bàn phím hiển thị mặc định (C3 tới C6). */
export const DEFAULT_KEYBOARD_LOW: MidiNote = 48
export const DEFAULT_KEYBOARD_HIGH: MidiNote = 84

export interface BuildVoicingOptions {
  /** Số bậc đảo cụ thể. Bỏ trống thì chọn ngẫu nhiên. */
  inversion?: number
  /** Nguồn ngẫu nhiên, tách ra để test cho tất định. */
  random?: () => number
  keyboardLow?: MidiNote
  keyboardHigh?: MidiNote
}

function ascending(notes: readonly MidiNote[]): MidiNote[] {
  return [...notes].sort((a, b) => a - b)
}

/**
 * Đảo hợp âm `times` lần: mỗi lần đưa nốt thấp nhất lên quãng tám trên.
 * Sắp xếp lại sau mỗi lần vì hợp âm mở rộng có nốt trải rộng hơn một quãng tám.
 */
function invert(notes: readonly MidiNote[], times: number): MidiNote[] {
  let result = ascending(notes)

  for (let step = 0; step < times; step += 1) {
    const [lowest, ...rest] = result
    result = ascending([...rest, lowest + 12])
  }

  return result
}

/**
 * Thế bấm rút gọn: nốt gốc, bậc 3 (hoặc nốt treo thay bậc 3) và bậc 7.
 * Hợp âm không có bậc 7 thì giữ nguyên thế gốc, vì shell chỉ có nghĩa với
 * hợp âm bảy trở lên.
 */
function shell(rootNote: MidiNote, quality: ChordQuality): MidiNote[] {
  const third = quality.intervals.find(
    (interval) => interval >= 2 && interval <= 5,
  )
  const seventh = quality.intervals.find(
    (interval) => interval >= 9 && interval <= 11,
  )

  if (third === undefined || seventh === undefined) {
    return chordNotes(rootNote, quality)
  }

  return [rootNote, rootNote + third, rootNote + seventh]
}

/**
 * Bỏ nốt gốc. Chỉ áp dụng cho hợp âm từ bốn nốt trở lên — bỏ gốc khỏi hợp âm
 * ba thì chỉ còn hai nốt, quá mỏng để nghe ra hợp âm.
 */
function rootless(rootNote: MidiNote, quality: ChordQuality): MidiNote[] {
  if (quality.intervals.length < 4) return chordNotes(rootNote, quality)

  return quality.intervals
    .slice(1)
    .map((interval) => rootNote + interval)
}

/**
 * Hạ nốt cao thứ hai xuống một quãng tám. Cần ít nhất bốn nốt mới có nghĩa.
 */
function drop2(rootNote: MidiNote, quality: ChordQuality): MidiNote[] {
  const notes = ascending(chordNotes(rootNote, quality))
  if (notes.length < 4) return notes

  const secondFromTop = notes.length - 2
  const dropped = [...notes]
  dropped[secondFromTop] -= 12

  return ascending(dropped)
}

/**
 * Dịch cả thế bấm theo quãng tám sao cho lọt vào dải bàn phím.
 * Nếu không có cách nào lọt trọn vẹn thì chọn cách lòi ra ít nốt nhất.
 */
export function fitToKeyboard(
  notes: readonly MidiNote[],
  low: MidiNote = DEFAULT_KEYBOARD_LOW,
  high: MidiNote = DEFAULT_KEYBOARD_HIGH,
): MidiNote[] {
  if (notes.length === 0) return []

  // Duyệt từ dịch chuyển nhỏ nhất trở đi (0, -1, +1, -2, +2…) để giữ nguyên
  // quãng tám gốc khi thế bấm đã vừa, và chỉ dịch tối thiểu khi cần.
  const shifts = [0, -1, 1, -2, 2, -3, 3]

  let best = ascending(notes)
  let bestOutside = Number.POSITIVE_INFINITY

  for (const shift of shifts) {
    const shifted = notes.map((note) => note + shift * 12)
    const outside = shifted.filter((note) => note < low || note > high).length

    if (outside < bestOutside) {
      bestOutside = outside
      best = ascending(shifted)
      if (outside === 0) break
    }
  }

  return best
}

/** Dựng thế bấm theo kiểu đã chọn, đã dịch vào dải bàn phím. */
export function buildVoicing(
  rootNote: MidiNote,
  quality: ChordQuality,
  type: VoicingType,
  options: BuildVoicingOptions = {},
): MidiNote[] {
  const {
    inversion,
    random = Math.random,
    keyboardLow = DEFAULT_KEYBOARD_LOW,
    keyboardHigh = DEFAULT_KEYBOARD_HIGH,
  } = options

  let notes: MidiNote[]

  switch (type) {
    case 'inversion': {
      const noteCount = quality.intervals.length
      // Thế đảo 0 chính là thế gốc, nên chỉ chọn từ 1 trở lên.
      const chosen =
        inversion ?? 1 + Math.floor(random() * Math.max(1, noteCount - 1))
      notes = invert(chordNotes(rootNote, quality), chosen)
      break
    }
    case 'shell':
      notes = shell(rootNote, quality)
      break
    case 'rootless':
      notes = rootless(rootNote, quality)
      break
    case 'drop2':
      notes = drop2(rootNote, quality)
      break
    case 'close':
    default:
      notes = chordNotes(rootNote, quality)
      break
  }

  return fitToKeyboard(notes, keyboardLow, keyboardHigh)
}
