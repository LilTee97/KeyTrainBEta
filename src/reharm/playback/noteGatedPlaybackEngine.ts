import { pitchClassOf } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { TimelineEvent } from '../style/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'

/**
 * Chế độ chờ đánh đúng nốt mới cho qua nốt tiếp theo.
 *
 * Điểm mấu chốt về thiết kế: ở chế độ này **không có đồng hồ nào chạy**. Người
 * học bấm đúng thì đi tiếp, bấm sai hay dừng lại suy nghĩ thì mọi thứ đứng yên
 * chờ. Nhờ vậy tránh được hẳn bài toán đồng bộ giữa phần gate và đồng hồ âm
 * thanh — thứ vốn là rủi ro kỹ thuật lớn nhất của phần này nếu làm theo lối
 * chơi đuổi theo nhạc nền.
 *
 * Toàn bộ hàm ở đây đều thuần, nên luồng luyện tập test được trọn vẹn.
 */

/** Sai số khi gom các tiếng đàn cùng một thời điểm, tính bằng phách. */
const BEAT_EPSILON = 0.001

export type PracticeHand = 'both' | 'left' | 'right'

/** Một chặng phải bấm đúng mới đi tiếp. */
export interface GatedStep {
  /** Vị trí trong dòng thời gian, tính bằng phách. */
  startBeat: number
  /** Toàn bộ nốt cần bấm ở chặng này. */
  notes: MidiNote[]
  leftNotes: MidiNote[]
  rightNotes: MidiNote[]
  /** Tên hợp âm đang vang, để hiển thị. */
  symbol: string
}

export interface BuildStepsOptions {
  hand?: PracticeHand
  /** Số phách mỗi hợp âm chiếm, dùng để tra hợp âm nào đang vang. */
  beatsPerChord: number
}

/**
 * Gom dòng thời gian thành các chặng.
 *
 * Các tiếng đàn rơi cùng một thời điểm được gom làm một chặng, vì người học
 * phải bấm chúng cùng lúc chứ không lần lượt.
 */
export function buildGatedSteps(
  events: readonly TimelineEvent[],
  voicings: readonly TwoHandVoicing[],
  options: BuildStepsOptions,
): GatedStep[] {
  const { hand = 'both', beatsPerChord } = options

  const wanted = events.filter(
    (event) => hand === 'both' || event.hand === hand,
  )

  const groups = new Map<number, TimelineEvent[]>()
  for (const event of wanted) {
    // Làm tròn để các tiếng lệch nhau vì số thập phân vẫn gom được làm một.
    const key = Math.round(event.startBeat / BEAT_EPSILON) * BEAT_EPSILON
    const bucket = groups.get(key)
    if (bucket) bucket.push(event)
    else groups.set(key, [event])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startBeat, list]) => {
      const leftNotes = [
        ...new Set(
          list.filter((event) => event.hand === 'left').flatMap((e) => e.notes),
        ),
      ].sort((a, b) => a - b)

      const rightNotes = [
        ...new Set(
          list.filter((event) => event.hand === 'right').flatMap((e) => e.notes),
        ),
      ].sort((a, b) => a - b)

      const chordIndex = Math.floor(startBeat / Math.max(1, beatsPerChord))

      return {
        startBeat,
        notes: [...new Set([...leftNotes, ...rightNotes])].sort(
          (a, b) => a - b,
        ),
        leftNotes,
        rightNotes,
        symbol: voicings[chordIndex]?.symbol ?? '',
      }
    })
    .filter((step) => step.notes.length > 0)
}

export interface MatchOptions {
  /**
   * Bỏ qua quãng tám khi so nốt.
   *
   * Bật khi luyện bằng bàn phím máy tính hoặc đàn ít phím, nơi không phải nốt
   * nào cũng với tới được. Tắt khi muốn tập đúng thế tay thật.
   */
  ignoreOctave?: boolean
}

/** Người học đã bấm đúng chặng này chưa. */
export function isStepMatched(
  heldNotes: readonly MidiNote[],
  step: GatedStep,
  options: MatchOptions = {},
): boolean {
  const { ignoreOctave = false } = options
  if (step.notes.length === 0) return false

  const toKey = (note: MidiNote) => (ignoreOctave ? pitchClassOf(note) : note)

  const required = new Set(step.notes.map(toKey))
  const held = new Set(heldNotes.map(toKey))

  if (held.size !== required.size) return false
  for (const key of required) {
    if (!held.has(key)) return false
  }

  return true
}

/** Các nốt của chặng mà người học chưa bấm tới. */
export function missingNotes(
  heldNotes: readonly MidiNote[],
  step: GatedStep,
  options: MatchOptions = {},
): MidiNote[] {
  const { ignoreOctave = false } = options
  const toKey = (note: MidiNote) => (ignoreOctave ? pitchClassOf(note) : note)

  const held = new Set(heldNotes.map(toKey))
  return step.notes.filter((note) => !held.has(toKey(note)))
}

export interface GatedSession {
  steps: GatedStep[]
  currentIndex: number
  /** Số lần bấm sai ở chặng hiện tại, dùng để biết chỗ nào đang vướng. */
  attempts: number
  /** Chỉ số các chặng từng bấm sai trong lượt này. */
  stumbled: number[]
  finished: boolean
}

export function startGatedSession(steps: readonly GatedStep[]): GatedSession {
  return {
    steps: [...steps],
    currentIndex: 0,
    attempts: 0,
    stumbled: [],
    finished: steps.length === 0,
  }
}

export function currentStep(session: GatedSession): GatedStep | null {
  return session.finished ? null : (session.steps[session.currentIndex] ?? null)
}

/** Bấm đúng, đi tiếp một chặng. */
export function advance(session: GatedSession): GatedSession {
  if (session.finished) return session

  const nextIndex = session.currentIndex + 1

  return {
    ...session,
    currentIndex: nextIndex,
    attempts: 0,
    finished: nextIndex >= session.steps.length,
  }
}

/**
 * Bấm sai một lần.
 *
 * Không phạt gì, chỉ ghi lại để cuối lượt biết chỗ nào hay vướng — đúng tinh
 * thần phần đệm hát không game hoá.
 */
export function registerMiss(session: GatedSession): GatedSession {
  if (session.finished) return session

  return {
    ...session,
    attempts: session.attempts + 1,
    stumbled: session.stumbled.includes(session.currentIndex)
      ? session.stumbled
      : [...session.stumbled, session.currentIndex],
  }
}

/** Quay lại từ đầu. */
export function restart(session: GatedSession): GatedSession {
  return startGatedSession(session.steps)
}

/** Tiến độ của lượt luyện. */
export function progressOf(session: GatedSession): {
  done: number
  total: number
  ratio: number
} {
  const total = session.steps.length
  const done = session.finished ? total : session.currentIndex

  return { done, total, ratio: total === 0 ? 1 : done / total }
}
