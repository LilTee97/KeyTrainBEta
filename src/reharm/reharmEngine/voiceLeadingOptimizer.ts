import { chordNotes } from '../../shared/musicTheory/chordDefinitions'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Chọn thế bấm sao cho tay di chuyển ít nhất — nguyên lý gốc của phong cách.
 *
 * Tài liệu Reference/phongcachdemhatkhabu.md gọi đây là "tiến hành bè / dẫn bè"
 * và chỉ rõ nó là lý do đằng sau **mọi** kỹ thuật khác: hợp âm treo, hợp âm
 * chồng trên bass, hợp âm giảm lướt, câu fill — tất cả đều là các cách cụ thể
 * để đạt được chuyển động mượt giữa hai hợp âm, thay vì nhảy quãng xa.
 *
 * Vì vậy module này là nền: mọi luật tái hòa âm về sau, khi chèn hoặc đổi hợp
 * âm, đều phải gọi lại nó để chọn thế bấm.
 */

/** Dải nốt hợp lý cho tay phải khi đệm hát. */
export const RIGHT_HAND_LOW: MidiNote = 55
export const RIGHT_HAND_HIGH: MidiNote = 84

/**
 * Trọng tâm mong muốn của thế bấm tay phải.
 *
 * Không có ràng buộc này thì chuỗi hợp âm dễ trôi dần lên cao hoặc xuống thấp:
 * mỗi bước đều chọn thế gần nhất với bước trước, nhưng cộng dồn lại thì cả
 * đoạn lệch hẳn khỏi vùng dễ chơi.
 */
const TARGET_CENTER: MidiNote = 67

/** Mức phạt cho mỗi nửa cung lệch khỏi trọng tâm. Nhẹ hơn hẳn chi phí di chuyển. */
const CENTER_PENALTY = 0.15

/**
 * Khoảng cách giữa hai thế bấm, tính bằng tổng quãng đường các ngón phải đi.
 *
 * Với mỗi nốt của thế bấm mới, lấy khoảng cách tới nốt gần nhất của thế bấm cũ.
 * Cách đo này chịu được việc hai hợp âm có số nốt khác nhau — chuyện thường
 * gặp khi đi từ hợp âm ba sang hợp âm chín.
 */
export function voicingDistance(
  previous: readonly MidiNote[],
  candidate: readonly MidiNote[],
): number {
  if (previous.length === 0 || candidate.length === 0) return 0

  let total = 0
  for (const note of candidate) {
    let nearest = Number.POSITIVE_INFINITY
    for (const other of previous) {
      nearest = Math.min(nearest, Math.abs(note - other))
    }
    total += nearest
  }

  return total
}

/** Trung bình cao độ của một thế bấm. */
function centerOf(notes: readonly MidiNote[]): number {
  if (notes.length === 0) return TARGET_CENTER
  return notes.reduce((sum, note) => sum + note, 0) / notes.length
}

/**
 * Mọi thế bấm khả dĩ của một hợp âm trong dải cho trước.
 *
 * Sinh bằng cách đảo hợp âm rồi dịch quãng tám, nên mọi ứng viên đều giữ
 * nguyên đủ các nốt của hợp âm — không bỏ bớt nốt ở bước này.
 */
export function voicingCandidates(
  chord: ParsedChord,
  low: MidiNote = RIGHT_HAND_LOW,
  high: MidiNote = RIGHT_HAND_HIGH,
): MidiNote[][] {
  const base = chordNotes(chord.root, chord.quality)
  const noteCount = base.length
  const candidates: MidiNote[][] = []
  const seen = new Set<string>()

  for (let inversion = 0; inversion < noteCount; inversion += 1) {
    // Đảo hợp âm: đưa `inversion` nốt dưới cùng lên quãng tám trên.
    const inverted = base.map((note, index) =>
      index < inversion ? note + 12 : note,
    )

    for (let octave = 0; octave <= 8; octave += 1) {
      const shifted = inverted
        .map((note) => note + octave * 12)
        .sort((a, b) => a - b)

      if (shifted[0] < low) continue
      if (shifted[shifted.length - 1] > high) continue

      const key = shifted.join(',')
      if (seen.has(key)) continue

      seen.add(key)
      candidates.push(shifted)
    }
  }

  return candidates
}

export interface ChooseVoicingOptions {
  low?: MidiNote
  high?: MidiNote
  /** Trọng tâm mong muốn, dùng cho hợp âm đầu tiên và để chống trôi cao độ. */
  targetCenter?: MidiNote
}

/**
 * Thế bấm hợp lý nhất cho một hợp âm, xét cả độ mượt so với hợp âm trước.
 *
 * `previous` bằng null nghĩa là hợp âm đầu tiên — lúc đó chỉ xét việc nằm gần
 * trọng tâm, vì chưa có gì để nối tiếp.
 */
export function chooseVoicing(
  chord: ParsedChord,
  previous: readonly MidiNote[] | null,
  options: ChooseVoicingOptions = {},
): MidiNote[] {
  const {
    low = RIGHT_HAND_LOW,
    high = RIGHT_HAND_HIGH,
    targetCenter = TARGET_CENTER,
  } = options

  const candidates = voicingCandidates(chord, low, high)
  if (candidates.length === 0) return chordNotes(chord.root, chord.quality)

  let best = candidates[0]
  let bestCost = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    const movement = previous ? voicingDistance(previous, candidate) : 0
    const drift = Math.abs(centerOf(candidate) - targetCenter) * CENTER_PENALTY

    const cost = movement + drift
    if (cost < bestCost) {
      bestCost = cost
      best = candidate
    }
  }

  return best
}

/** Chọn thế bấm cho cả một chuỗi hợp âm, mỗi hợp âm nối mượt vào hợp âm trước. */
export function voiceLeadSequence(
  chords: readonly ParsedChord[],
  options: ChooseVoicingOptions = {},
): MidiNote[][] {
  const result: MidiNote[][] = []
  let previous: MidiNote[] | null = null

  for (const chord of chords) {
    const voicing = chooseVoicing(chord, previous, options)
    result.push(voicing)
    previous = voicing
  }

  return result
}

/**
 * Thế bấm mộc: luôn xếp chồng từ nốt gốc, không đảo.
 *
 * Dùng để đối chiếu cho người học nghe ra khác biệt giữa có và không dẫn bè.
 */
export function plainSequence(
  chords: readonly ParsedChord[],
  low: MidiNote = RIGHT_HAND_LOW,
): MidiNote[][] {
  return chords.map((chord) => {
    // Đặt nốt gốc ở quãng tám thấp nhất của dải, cùng một chỗ cho mọi hợp âm.
    const rootNote = low + ((chord.root - (low % 12) + 12) % 12)
    return chordNotes(rootNote, chord.quality)
  })
}

/** Tổng quãng đường di chuyển của cả chuỗi, dùng để so sánh và để test. */
export function totalMovement(voicings: readonly MidiNote[][]): number {
  let total = 0
  for (let index = 1; index < voicings.length; index += 1) {
    total += voicingDistance(voicings[index - 1], voicings[index])
  }
  return total
}
