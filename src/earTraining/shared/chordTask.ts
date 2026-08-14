import { normalizePitchClass, pitchClassOf } from '../../shared/musicTheory/pitch'
import { formatChordSymbol } from '../../shared/musicTheory/chordDetection'
import type {
  ChordQuality,
  MidiNote,
  PitchClass,
} from '../../shared/musicTheory/types'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import { buildVoicing } from '../../shared/musicTheory/voicing'

/**
 * Một hợp âm cần bấm đúng, dùng chung cho mọi bài tập.
 *
 * Bài nhận diện hợp âm hỏi từng hợp âm rời, bài luyện vòng hợp âm hỏi một
 * chuỗi liên tiếp — nhưng cách dựng đề và cách chấm thì giống hệt nhau.
 */
export interface ChordTask {
  root: PitchClass
  quality: ChordQuality
  /**
   * Một thế bấm cụ thể, dùng cho cả phát mẫu lẫn chỉ đáp án trên bàn phím.
   * Luôn là một cách bấm duy nhất, không phải mọi cách bấm có thể.
   */
  notes: MidiNote[]
  /** Kiểu thế bấm đã dùng để dựng `notes`. */
  voicing: VoicingType
  /** Các lớp cao độ thuộc hợp âm, dùng để xác nhận người học bấm trúng. */
  chordTones: PitchClass[]
  /** Tên hợp âm để hiển thị, ví dụ 'Am7'. */
  symbol: string
}

export type Strictness =
  /** Bấm đủ nốt hợp âm, ở quãng tám nào và thế đảo nào cũng được. */
  | 'pitchClass'
  /** Phải bấm đúng nốt gốc ở dưới cùng, tức đúng thế nguyên vị. */
  | 'rootPosition'

export interface AnswerCheck {
  correct: boolean
  /** Nốt của hợp âm mà người học chưa bấm. */
  missing: PitchClass[]
  /** Nốt người học bấm nhưng không thuộc hợp âm. */
  extra: PitchClass[]
  /** Đúng nốt nhưng sai thế bấm — chỉ xảy ra ở mức chặt 'rootPosition'. */
  wrongInversion: boolean
}

/** Dựng một hợp âm cần bấm từ nốt gốc, tính chất và kiểu thế bấm. */
export function makeChordTask(
  rootNote: MidiNote,
  quality: ChordQuality,
  voicing: VoicingType = 'close',
  random: () => number = Math.random,
): ChordTask {
  const root = pitchClassOf(rootNote)

  return {
    root,
    quality,
    notes: buildVoicing(rootNote, quality, voicing, { random }),
    voicing,
    chordTones: quality.intervals.map((interval) =>
      normalizePitchClass(root + interval),
    ),
    symbol: formatChordSymbol(root, quality),
  }
}

/**
 * Chấm bài dựa trên các nốt người học đang bấm.
 *
 * So theo lớp cao độ chứ không so nốt tuyệt đối: bấm đúng hợp âm ở quãng
 * tám khác hay ở thế đảo khác vẫn là hiểu đúng hợp âm. Muốn khắt khe hơn
 * thì dùng mức 'rootPosition'.
 */
export function checkAnswer(
  playedNotes: readonly MidiNote[],
  task: ChordTask,
  strictness: Strictness = 'pitchClass',
): AnswerCheck {
  const expected = new Set(task.chordTones)
  const played = new Set(playedNotes.map(pitchClassOf))

  const missing = [...expected]
    .filter((pitchClass) => !played.has(pitchClass))
    .sort((a, b) => a - b)

  const extra = [...played]
    .filter((pitchClass) => !expected.has(pitchClass))
    .sort((a, b) => a - b)

  const notesAreRight = missing.length === 0 && extra.length === 0

  const bassIsRoot =
    playedNotes.length > 0 &&
    pitchClassOf(Math.min(...playedNotes)) === task.root

  const wrongInversion =
    strictness === 'rootPosition' && notesAreRight && !bassIsRoot

  return {
    correct: notesAreRight && !wrongInversion,
    missing,
    extra,
    wrongInversion,
  }
}
