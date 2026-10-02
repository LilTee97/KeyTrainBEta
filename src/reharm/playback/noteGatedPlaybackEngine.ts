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
  /** Ngân bao lâu — phím chỉ sáng trong khoảng này. */
  durationBeats: number
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
  /** Tên hợp âm tại một phách — bài đã sắp thì không còn đều `beatsPerChord`. */
  symbolAt?: (beat: number) => string
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
  const { hand = 'both', beatsPerChord, symbolAt } = options

  /*
    Bỏ nốt láy khỏi các chặng chờ.

    Nốt láy vang trước nốt chính đúng một nốt kép. Tính nó thành chặng riêng
    thì người tập phải bấm nó, chờ máy cho qua, rồi mới bấm nốt chính — mà nốt
    láy vốn là **một cú vuốt liền tay**, không phải hai lần bấm. Gộp chung vào
    một chặng cũng sai, vì thành ra phải giữ cả hai nốt cùng lúc.

    App vẫn phát nốt láy cho nghe; nó chỉ không nằm trong phần bị chấm.
  */
  const wanted = events.filter(
    (event) =>
      !event.grace && (hand === 'both' || event.hand === hand),
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
        durationBeats: Math.max(
          0.12,
          ...list.map((event) => event.durationBeats),
        ),
        notes: [...new Set([...leftNotes, ...rightNotes])].sort(
          (a, b) => a - b,
        ),
        leftNotes,
        rightNotes,
        symbol:
          symbolAt?.(startBeat) ||
          voicings[
            ((chordIndex % Math.max(1, voicings.length)) + Math.max(1, voicings.length)) %
              Math.max(1, voicings.length)
          ]?.symbol ||
          '',
      }
    })
    .filter((step) => step.notes.length > 0)
}

/** Nốt đang chạm vạch đáy tại một phách. */
export function notesHittingAt(
  steps: readonly GatedStep[],
  beat: number,
): { left: MidiNote[]; right: MidiNote[] } {
  const left: MidiNote[] = []
  const right: MidiNote[] = []
  for (const step of steps) {
    const away = step.startBeat - beat
    if (away > 0.05 || away < -0.2) continue
    left.push(...step.leftNotes)
    right.push(...step.rightNotes)
  }
  return { left, right }
}

/**
 * Nốt đang KÊU tại một phách — phím sáng đúng từ lúc tiếng vào tới hết độ ngân.
 *
 * Thay cho `notesHittingAt` ở bàn phím lúc phát: cửa sổ cố định "0,05 phách trước tới 0,2 phách sau" thì nốt ngân
 * dài chỉ nháy một cái, còn phím sáng sớm hơn tiếng — người dùng 2/10/2026 đòi hình khớp tiếng. Tắt sớm một chút
 * (tối đa 0,05 phách, không quá ⅕ độ ngân) để hai nốt cùng phím đánh liền nhau vẫn thấy phím nháy lại.
 */
export function notesSoundingAt(
  events: readonly TimelineEvent[],
  beat: number,
): { left: MidiNote[]; right: MidiNote[] } {
  const left = new Set<MidiNote>()
  const right = new Set<MidiNote>()
  for (const event of events) {
    const lit = event.durationBeats - Math.min(0.05, event.durationBeats * 0.2)
    if (beat < event.startBeat || beat >= event.startBeat + lit) continue
    for (const note of event.notes) (event.hand === 'left' ? left : right).add(note)
  }
  return { left: [...left], right: [...right] }
}

/** Hai tiếng sát nhau phổ biến của bài phải cách nhau chừng này điểm ảnh trên khung nốt rơi. */
const MIN_SPACING_PX = 18
const MIN_PX_PER_BEAT = 24
const MAX_PX_PER_BEAT = 160

/**
 * Thu phóng khung nốt rơi theo chính bài: điểm ảnh mỗi phách.
 *
 * Lấy khoảng cách giữa hai tiếng liền nhau ở bách phân vị 10 (bỏ nốt láy — nó sát nốt chính là chủ ý) rồi phóng
 * sao cho khoảng ấy được `MIN_SPACING_PX`: câu chạy móc kép thành chuỗi khối rời, không chồng lên nhau. Cũ: cố
 * định 22,5 px/phách (8 phách trên 180 px) — móc kép cách nhau 5,6 px mà khối cao 20 px.
 */
export function pxPerBeatFor(events: readonly TimelineEvent[]): number {
  const starts = [
    ...new Set(events.filter((event) => !event.grace).map((event) => Math.round(event.startBeat * 1000) / 1000)),
  ].sort((a, b) => a - b)
  const gaps = starts
    .slice(1)
    .map((start, i) => start - starts[i]!)
    .filter((gap) => gap > 0.02)
    .sort((a, b) => a - b)
  if (gaps.length === 0) return 30
  const tight = gaps[Math.floor(gaps.length * 0.1)]!
  return Math.min(MAX_PX_PER_BEAT, Math.max(MIN_PX_PER_BEAT, MIN_SPACING_PX / tight))
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
