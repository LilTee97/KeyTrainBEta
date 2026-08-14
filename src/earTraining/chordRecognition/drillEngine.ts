import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { formatChordSymbol } from '../../shared/musicTheory/chordDetection'
import { normalizePitchClass, pitchClassOf } from '../../shared/musicTheory/pitch'
import type {
  ChordQuality,
  MidiNote,
  PitchClass,
} from '../../shared/musicTheory/types'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import { buildVoicing } from '../../shared/musicTheory/voicing'

/**
 * Logic thuần của bài luyện nhận diện hợp âm: ra đề và chấm bài.
 * Tách khỏi giao diện để test được và để dùng lại cho phần ôn tập sau này.
 */

/** Dải nốt gốc khi ra đề, đủ thấp để nốt mở rộng vẫn nằm trên bàn phím. */
const ROOT_RANGE_LOW: MidiNote = 48
const ROOT_RANGE_HIGH: MidiNote = 59

export interface DrillQuestion {
  root: PitchClass
  quality: ChordQuality
  /**
   * Một thế bấm cụ thể — dùng cho cả phát mẫu lẫn chỉ đáp án trên bàn phím.
   * Luôn là một cách bấm duy nhất, không phải mọi cách bấm có thể.
   */
  notes: MidiNote[]
  /** Kiểu thế bấm đã dùng để dựng `notes`. */
  voicing: VoicingType
  /** Các lớp cao độ thuộc hợp âm, dùng để xác nhận người học bấm trúng. */
  chordTones: PitchClass[]
  /** Tên hợp âm để hiển thị khi lộ đáp án. */
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

/** Hàm sinh số ngẫu nhiên, tách ra để test cho tất định. */
export type RandomFn = () => number

function pick<T>(items: readonly T[], random: RandomFn): T {
  return items[Math.floor(random() * items.length)]
}

/**
 * Ra một câu hỏi mới.
 *
 * `avoid` là câu vừa hỏi — dùng để không hỏi trùng ngay câu kế tiếp, vì
 * lặp lại ngay lập tức không luyện được gì mà chỉ gây nhàm.
 */
export function createQuestion(
  qualityIds: readonly string[],
  options: {
    avoid?: DrillQuestion | null
    random?: RandomFn
    voicing?: VoicingType
  } = {},
): DrillQuestion | null {
  const { avoid = null, random = Math.random, voicing = 'close' } = options

  const qualities = qualityIds
    .map((id) => getChordQuality(id))
    .filter((quality): quality is ChordQuality => quality !== undefined)

  if (qualities.length === 0) return null

  function build(quality: ChordQuality, rootNote: MidiNote): DrillQuestion {
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

  function randomRootNote(): MidiNote {
    return (
      ROOT_RANGE_LOW +
      Math.floor(random() * (ROOT_RANGE_HIGH - ROOT_RANGE_LOW + 1))
    )
  }

  // Thử vài lần để tránh trùng câu trước; hết lượt thì chấp nhận trùng,
  // vì có thể phạm vi luyện chỉ còn đúng một khả năng.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const quality = pick(qualities, random)
    const rootNote = randomRootNote()

    const isSameAsPrevious =
      avoid !== null &&
      avoid.root === pitchClassOf(rootNote) &&
      avoid.quality.id === quality.id
    if (isSameAsPrevious) continue

    return build(quality, rootNote)
  }

  return build(pick(qualities, random), randomRootNote())
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
  question: DrillQuestion,
  strictness: Strictness = 'pitchClass',
): AnswerCheck {
  const expected = new Set(
    question.quality.intervals.map((interval) =>
      normalizePitchClass(question.root + interval),
    ),
  )
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
    pitchClassOf(Math.min(...playedNotes)) === question.root

  const wrongInversion =
    strictness === 'rootPosition' && notesAreRight && !bassIsRoot

  return {
    correct: notesAreRight && !wrongInversion,
    missing,
    extra,
    wrongInversion,
  }
}
