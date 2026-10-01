import { pitchClassOf } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { TimelineEvent } from '../style/types'
import type { PracticeHand } from './noteGatedPlaybackEngine'

/**
 * Chấm chế độ chơi THEO NHỊP — nhạc chạy, đánh sai không dừng, hết lượt mới chấm.
 *
 * Chế độ chờ đánh đúng nốt (`noteGatedPlaybackEngine`) không có đồng hồ nên chỉ biết đúng phím. Ở đây biết
 * thêm sớm hay muộn bao nhiêu mili giây — mà điệu chính là tiết tấu. Kế hoạch: `Reference/KE-HOACH-LUYEN-TAP.md`.
 *
 * Toàn bộ hàm thuần: test được không cần âm thanh hay đàn.
 */

/** Một nốt phải đánh. */
export interface ExpectedNote {
  note: MidiNote
  /** Phách của dòng thời gian. */
  beat: number
  hand: 'left' | 'right'
}

/** Một phím đã bấm, đã quy ra phách của đồng hồ phát nhạc (`beatAtPerformanceTime`). */
export interface PlayedNote {
  note: MidiNote
  beat: number
  velocity: number
}

export interface TimedScoreOptions {
  /** Mili giây mỗi phách ở nhịp độ đang tập. */
  msPerBeat: number
  /** Độ trễ đo bằng lượt gõ theo click (loa + đàn + thói quen sớm/muộn) — trừ đi trước khi chấm. */
  latencyMs: number
  /** Lệch quá chừng này thì không còn là đánh nốt ấy: nốt ấy tính trượt, phím ấy tính thừa. */
  windowMs?: number
  ignoreOctave?: boolean
}

export interface TimedScore {
  /** Số nốt phải đánh. */
  total: number
  /** Số nốt đánh đúng phím, trong cửa sổ. */
  hit: number
  missed: ExpectedNote[]
  /** Phím bấm thừa hoặc sai, trong lúc bài đang chạy. */
  extra: PlayedNote[]
  /** Lệch có dấu của từng nốt trúng, đã trừ độ trễ. Âm = sớm, dương = muộn. */
  errorsMs: number[]
  /** Trung vị lệch có dấu — thói quen đánh sớm hay muộn. */
  medianMs: number | null
  /** Trung vị lệch tuyệt đối — độ đều tay. */
  medianAbsMs: number | null
}

/**
 * Cửa sổ ghép phím bấm với nốt — ĐOÁN, chưa đo (1/10/2026).
 *
 * Rộng hơn ngưỡng đạt nhiều lần vì nó chỉ trả lời "phím này có phải để đánh nốt kia không"; đều tay hay
 * không là việc của `medianAbsMs`. Lùi khi: nốt móc kép cùng phím lặp sát nhau bị ghép chéo (thu hẹp lại),
 * hay đánh đúng mà vẫn báo trượt ở nhịp chậm (nới ra).
 */
export const MATCH_WINDOW_MS = 150

/**
 * Ngưỡng tạm của cửa đạt bậc 4–7 — ĐOÁN, chưa đo (`KE-HOACH-LUYEN-TAP.md` mục 2). Chốt sau khi đọc
 * `LuyenTap.json` từ những lượt người dùng tập thật.
 */
export const PASS_HIT_RATIO = 0.9
export const PASS_MEDIAN_ABS_MS = 40

/** Nốt phải đánh của một tay, theo thứ tự thời gian. */
export function expectedNotesOf(
  events: readonly TimelineEvent[],
  hand: PracticeHand,
): ExpectedNote[] {
  const notes: ExpectedNote[] = []
  for (const event of events) {
    // Nốt láy là cú vuốt liền tay vào nốt chính — chế độ chờ đúng nốt cũng không chấm nó.
    if (event.grace) continue
    if (hand !== 'both' && event.hand !== hand) continue
    for (const note of event.notes) notes.push({ note, beat: event.startBeat, hand: event.hand })
  }
  return notes.sort((a, b) => a.beat - b.beat || a.note - b.note)
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export function scoreTimed(
  expected: readonly ExpectedNote[],
  played: readonly PlayedNote[],
  options: TimedScoreOptions,
): TimedScore {
  const { msPerBeat, latencyMs, windowMs = MATCH_WINDOW_MS, ignoreOctave = false } = options
  const same = (a: MidiNote, b: MidiNote) =>
    ignoreOctave ? pitchClassOf(a) === pitchClassOf(b) : a === b
  // Mili giây nguyên: tai và đàn không phân biệt nhỏ hơn thế, mà số lẻ dấu phẩy động làm bẩn nhật ký.
  const errorOf = (want: ExpectedNote, got: PlayedNote) =>
    Math.round((got.beat - want.beat) * msPerBeat - latencyMs)

  /*
    Ghép cặp lệch ÍT NHẤT trước. Ghép lần lượt theo thời gian thì hai nốt cùng phím đứng sát nhau (móc kép
    lặp) có thể giành nhau một phím bấm: nốt trước lấy mất phím vốn đánh cho nốt sau.
  */
  const pairs: { want: number; got: number; error: number }[] = []
  expected.forEach((want, wantIndex) => {
    played.forEach((got, gotIndex) => {
      if (!same(want.note, got.note)) return
      const error = errorOf(want, got)
      if (Math.abs(error) <= windowMs) pairs.push({ want: wantIndex, got: gotIndex, error })
    })
  })
  pairs.sort((a, b) => Math.abs(a.error) - Math.abs(b.error))

  const errorByWant = new Map<number, number>()
  const usedGot = new Set<number>()
  for (const pair of pairs) {
    if (errorByWant.has(pair.want) || usedGot.has(pair.got)) continue
    errorByWant.set(pair.want, pair.error)
    usedGot.add(pair.got)
  }

  /* Phím thừa chỉ tính trong lúc bài chạy — dạo phím lúc đếm vào hay sau khi hết bài thì không. */
  const first = expected[0]?.beat ?? 0
  const last = expected[expected.length - 1]?.beat ?? 0
  const margin = windowMs / msPerBeat
  const latencyBeats = latencyMs / msPerBeat
  const extra = played.filter((got, gotIndex) => {
    if (usedGot.has(gotIndex)) return false
    const heard = got.beat - latencyBeats
    return heard >= first - margin && heard <= last + margin
  })

  const errorsMs = expected.flatMap((_, wantIndex) => {
    const error = errorByWant.get(wantIndex)
    return error === undefined ? [] : [error]
  })

  return {
    total: expected.length,
    hit: errorByWant.size,
    missed: expected.filter((_, wantIndex) => !errorByWant.has(wantIndex)),
    extra,
    errorsMs,
    medianMs: median(errorsMs),
    medianAbsMs: median(errorsMs.map(Math.abs)),
  }
}

/** Đạt ngưỡng tạm chưa. */
export function passes(score: TimedScore): boolean {
  return (
    score.total > 0 &&
    score.hit / score.total >= PASS_HIT_RATIO &&
    score.medianAbsMs !== null &&
    score.medianAbsMs <= PASS_MEDIAN_ABS_MS
  )
}

export interface LatencyMeasure {
  latencyMs: number
  /** Độ dao động: trung vị khoảng cách tới `latencyMs` (MAD). */
  spreadMs: number
  n: number
  /** Lệch từng lần gõ, để ghi nhật ký. */
  errorsMs: number[]
}

/** Lượt đo có ít lần gõ hơn thế này thì không tin. */
export const MIN_TAPS = 8

/**
 * Độ trễ từ lượt gõ theo tiếng click: mỗi lần gõ lệch bao nhiêu so với tiếng click, lấy trung vị.
 *
 * Gõ được quy về khoảng [−¼, +¾) phách quanh tiếng click: người gõ theo click thường đón trước một chút,
 * còn trễ loa + đàn thì đẩy tiếng gõ về sau — có khi tới vài trăm mili giây với tai nghe không dây.
 * Ở 80 BPM khoảng ấy là −187 … +562 ms.
 */
export function latencyFromTaps(tapBeats: readonly number[], msPerBeat: number): LatencyMeasure | null {
  if (tapBeats.length < MIN_TAPS) return null
  const errorsMs = tapBeats.map((beat) => {
    const phase = ((beat % 1) + 1) % 1
    return Math.round((phase >= 0.75 ? phase - 1 : phase) * msPerBeat)
  })
  const center = median(errorsMs)!
  return {
    latencyMs: Math.round(center),
    spreadMs: Math.round(median(errorsMs.map((error) => Math.abs(error - center)))!),
    n: errorsMs.length,
    errorsMs,
  }
}
