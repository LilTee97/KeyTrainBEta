import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassOf } from '../../shared/musicTheory/pitch'
import type { ChordQuality, MidiNote } from '../../shared/musicTheory/types'
import type { VoicingType } from '../../shared/musicTheory/voicing'
import type { ChordTask } from '../shared/chordTask'
import { makeChordTask } from '../shared/chordTask'

/**
 * Ra đề cho bài luyện nhận diện hợp âm.
 * Phần chấm bài nằm ở `../shared/chordTask` vì dùng chung với bài luyện vòng.
 */

export type { AnswerCheck, Strictness } from '../shared/chordTask'
export { checkAnswer } from '../shared/chordTask'

/** Một câu hỏi chính là một hợp âm cần bấm đúng. */
export type DrillQuestion = ChordTask

/** Dải nốt gốc khi ra đề, đủ thấp để nốt mở rộng vẫn nằm trên bàn phím. */
const ROOT_RANGE_LOW: MidiNote = 48
const ROOT_RANGE_HIGH: MidiNote = 59

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

    return makeChordTask(rootNote, quality, voicing, random)
  }

  return makeChordTask(randomRootNote(), pick(qualities, random), voicing, random)
}
