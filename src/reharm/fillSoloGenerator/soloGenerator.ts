import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { scaleTones } from '../reharmEngine/keyDetection'
import type { TimelineEvent } from '../style/types'
import type { ParsedChord } from '../types'
import type { ApproachDirection, OrnamentDensity } from './graceNoteOrnamenter'
import { densityOption, ornamentLine } from './graceNoteOrnamenter'

/**
 * Sinh câu solo hoặc câu dạo theo phong cách.
 *
 * **Đây là phần mô phỏng, không phải chép công thức.** Tài liệu mô tả cách
 * chơi giai điệu ở mức nguyên lý — dùng nốt láy quanh nốt đích, chọn nốt đích
 * trong hợp âm — chứ không cho một thuật toán sinh câu. Nên chất lượng ở đây
 * là *một cách hiện thực hoá hợp lý*, đáng để nghe thử và chỉnh, không phải
 * chuẩn mực.
 *
 * Cách làm: mỗi hợp âm góp vài **nốt đích** lấy từ chính nốt của hợp âm đó,
 * ưu tiên nốt màu (bậc chín, mười một, mười ba) vì đó là thứ làm câu nhạc
 * nghe ra phong cách; các nốt đích nối nhau theo đường ngắn nhất để câu nhạc
 * không nhảy loạn; rồi gắn nốt láy lên trên.
 */

/** Tầm giai điệu, cao hơn hẳn phần đệm để nghe tách bạch. */
const MELODY_LOW: MidiNote = 67
const MELODY_HIGH: MidiNote = 88

/** Độ dài nốt láy, tính bằng phách. Rất ngắn, chỉ như một cái vuốt. */
const GRACE_DURATION = 0.12

export interface SoloOptions {
  /** Số phách mỗi hợp âm chiếm. */
  beatsPerChord: number
  /** Số nốt đích mỗi hợp âm. */
  notesPerChord?: number
  direction?: ApproachDirection
  density?: OrnamentDensity
  key?: { tonic: PitchClass; scale: ScaleType } | null
}

/**
 * Xếp hạng nốt của hợp âm theo mức đáng làm nốt đích.
 *
 * Nốt màu xếp trên nốt gốc và quãng năm: nốt gốc thì phần đệm đã vang rồi, còn
 * quãng năm gần như không nói lên điều gì. Bậc ba và bậc bảy xếp giữa vì chúng
 * quyết định tính chất hợp âm.
 */
function targetPriority(interval: number): number {
  const folded = interval % 12
  if (folded === 0) return 3
  if (folded === 7) return 4
  if (folded === 3 || folded === 4) return 1
  if (folded === 10 || folded === 11) return 1
  // Nốt màu: bậc chín, mười một, mười ba
  return 0
}

/** Chọn các lớp cao độ đáng làm nốt đích cho một hợp âm. */
function targetPitchClasses(chord: ParsedChord, count: number): PitchClass[] {
  return [...chord.quality.intervals]
    .sort((a, b) => targetPriority(a) - targetPriority(b))
    .slice(0, Math.max(1, count))
    .map((interval) => (chord.root + interval) % 12)
}

/**
 * Đưa một lớp cao độ về nốt cụ thể gần nốt trước nhất.
 * Nhờ vậy câu nhạc đi từng bước thay vì nhảy quãng xa.
 */
function nearestNote(pitchClass: PitchClass, previous: MidiNote): MidiNote {
  let best = MELODY_LOW + ((pitchClass - (MELODY_LOW % 12) + 12) % 12)

  for (let note = best; note <= MELODY_HIGH; note += 12) {
    if (Math.abs(note - previous) < Math.abs(best - previous)) best = note
  }

  return best
}

export interface SoloNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  /** Nốt láy hay nốt chính. */
  isGrace: boolean
}

/** Sinh câu solo cho cả vòng hợp âm. */
export function generateSolo(
  chords: readonly ParsedChord[],
  options: SoloOptions,
): SoloNote[] {
  const {
    beatsPerChord,
    notesPerChord = 2,
    direction = 'mixed',
    density = 'medium',
    key = null,
  } = options

  if (chords.length === 0) return []

  const tones = key ? scaleTones(key.tonic, key.scale) : new Set<PitchClass>()

  // Chọn nốt đích cho từng hợp âm, nối nhau theo đường ngắn nhất.
  const targets: MidiNote[] = []
  let previous: MidiNote = MELODY_LOW + 7

  for (const chord of chords) {
    for (const pitchClass of targetPitchClasses(chord, notesPerChord)) {
      const note = nearestNote(pitchClass, previous)
      targets.push(note)
      previous = note
    }
  }

  const ornamented = ornamentLine(targets, { direction, density, scaleTones: tones })

  // Rải đều các nốt đích trong quãng thời gian của từng hợp âm.
  const slot = beatsPerChord / Math.max(1, notesPerChord)
  const result: SoloNote[] = []

  ornamented.forEach((entry, index) => {
    const startBeat = index * slot

    if (entry.grace !== null) {
      result.push({
        note: entry.grace,
        startBeat,
        durationBeats: GRACE_DURATION,
        isGrace: true,
      })
    }

    // Nốt chính vào ngay sau nốt láy, chiếm phần còn lại của ô.
    const mainStart = entry.grace !== null ? startBeat + GRACE_DURATION : startBeat
    result.push({
      note: entry.main,
      startBeat: mainStart,
      durationBeats: Math.max(0.1, slot - (mainStart - startBeat)) * 0.9,
      isGrace: false,
    })
  })

  return result
}

/** Đổi câu solo thành dòng thời gian để phát cùng phần đệm. */
export function soloToTimeline(
  solo: readonly SoloNote[],
  velocity = 72,
): TimelineEvent[] {
  return solo.map((note) => ({
    notes: [note.note],
    startBeat: note.startBeat,
    durationBeats: note.durationBeats,
    hand: 'right' as const,
    // Nốt láy đánh nhẹ hơn hẳn, nó chỉ là cái vuốt vào nốt chính.
    velocity: Math.round(note.isGrace ? velocity * 0.6 : velocity),
  }))
}

/** Các nốt của hợp âm, dùng cho phần hiển thị. */
export function chordToneNames(chord: ParsedChord): PitchClass[] {
  return chordPitchClasses(chord.root, chord.quality)
}

export { densityOption }
