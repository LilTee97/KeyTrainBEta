import type {
  KeyFlow,
  ProgressionTemplate,
} from '../../shared/musicTheory/progressionGenerator'
import { buildProgression } from '../../shared/musicTheory/progressionGenerator'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import type { ChordTask } from '../shared/chordTask'
import { makeChordTask } from '../shared/chordTask'

/**
 * Dựng một lượt luyện vòng hợp âm.
 *
 * Mỗi bước trong vòng là một hợp âm cần bấm đúng, dùng đúng kiểu dữ liệu với
 * bài nhận diện hợp âm rời — nên phần chấm bài dùng lại được nguyên vẹn.
 */

/** Quãng tám đặt nốt gốc của hợp âm đầu tiên trong vòng. */
const BASE_ROOT_NOTE: MidiNote = 48

export interface ProgressionStepTask extends ChordTask {
  /** Ký hiệu bậc La Mã trong giọng, ví dụ 'ii7'. */
  roman: string
}

export interface ProgressionSession {
  template: ProgressionTemplate
  tonic: PitchClass
  /** Tên giọng để hiển thị, ví dụ 'F trưởng'. */
  keyLabel: string
  steps: ProgressionStepTask[]
}

export interface CreateSessionOptions {
  useSevenths?: boolean
  voicing?: VoicingType
  random?: () => number
}

/** Tên giọng cho người đọc, ví dụ 'A thứ'. */
export function keyLabelOf(
  tonic: PitchClass,
  scale: ProgressionTemplate['scale'],
): string {
  return `${pitchClassName(tonic)} ${scale === 'minor' ? 'thứ' : 'trưởng'}`
}

/**
 * Dựng lượt luyện từ khuôn vòng và giọng.
 *
 * Nốt gốc của mỗi hợp âm được đặt trong cùng một quãng tám để cả vòng nằm
 * gọn trên bàn phím, thay vì trôi dần lên cao theo bậc.
 */
export function createSession(
  template: ProgressionTemplate,
  tonic: PitchClass,
  options: CreateSessionOptions = {},
): ProgressionSession {
  const { useSevenths = true, voicing = 'close', random = Math.random } = options

  const chords = buildProgression(template, tonic, { useSevenths })

  const steps = chords.map((chord) => {
    const rootNote = BASE_ROOT_NOTE + chord.root
    const task = makeChordTask(rootNote, chord.quality, voicing, random)

    return { ...task, roman: chord.roman, symbol: chord.symbol }
  })

  return {
    template,
    tonic,
    keyLabel: keyLabelOf(tonic, template.scale),
    steps,
  }
}

/**
 * Số giây cho mỗi hợp âm khi phát mẫu, tính theo nhịp độ.
 * Mỗi hợp âm chiếm trọn một ô nhịp — đúng nhịp đổi hợp âm thường gặp của
 * nhạc pop và ballad.
 */
export function secondsPerChord(bpm: number, beatsPerMeasure: number): number {
  const safeBpm = Math.max(1, bpm)
  const safeBeats = Math.max(1, beatsPerMeasure)
  return (60 / safeBpm) * safeBeats
}

/** Giọng của lượt kế tiếp, giữ nguyên chữ ký kiểu để phần gọi khỏi tự ép. */
export type { KeyFlow }
