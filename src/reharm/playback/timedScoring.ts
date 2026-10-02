import { pitchClassOf } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import { parseChordInput } from '../input/chordInputParser'
import type { TimelineEvent } from '../style/types'
import { vuotTamTay, type PracticeHand } from './noteGatedPlaybackEngine'

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
  /** Nốt của một cú vượt tầm bàn tay (`vuotTamTay`) — chấm bỏ quãng tám riêng nốt này, như chế độ chờ đúng nốt. */
  tuDoQuangTam?: true
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
  const cu = new Map<string, MidiNote[]>()
  const khoa = (one: { hand: string; beat: number }) => `${one.hand}@${Math.round(one.beat * 1000)}`
  for (const event of events) {
    // Nốt láy là cú vuốt liền tay vào nốt chính — chế độ chờ đúng nốt cũng không chấm nó.
    if (event.grace) continue
    if (hand !== 'both' && event.hand !== hand) continue
    const key = khoa({ hand: event.hand, beat: event.startBeat })
    cu.set(key, [...(cu.get(key) ?? []), ...event.notes])
    for (const note of event.notes) notes.push({ note, beat: event.startBeat, hand: event.hand })
  }
  for (const one of notes) if (vuotTamTay(cu.get(khoa(one))!)) one.tuDoQuangTam = true
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
  const same = (want: ExpectedNote, got: PlayedNote) =>
    ignoreOctave || want.tuDoQuangTam ? pitchClassOf(want.note) === pitchClassOf(got.note) : want.note === got.note
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
      if (!same(want, got)) return
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

/**
 * Bậc 7 — chấm (b) (người dùng 1/10/2026, "câu 3 chọn b"): thế bấm tự chọn, miễn đúng NỐT của hợp âm, đúng BASS, đúng khung. Gộp
 * các nốt cùng tên trong một lúc (khuôn A2+A3, hay A2 tay trái + A4 tay phải) thành một: bấm một nốt La là đủ.
 */
export function gopLopCaoDo(expected: readonly ExpectedNote[]): ExpectedNote[] {
  const daCo = new Set<string>()
  return expected.filter((one) => {
    const khoa = `${Math.round(one.beat * 1000)}:${pitchClassOf(one.note)}`
    if (daCo.has(khoa)) return false
    daCo.add(khoa)
    return true
  })
}

/** Hợp âm đang vang: các tên nốt (lớp cao độ) của nó, và tên nốt bass — gốc, hay nốt sau gạch chéo (Am/C → C). */
export interface HopAmLuc {
  lop: ReadonlySet<number>
  bass: number
}

/** Hợp âm theo phách của dòng thời gian có `demVao` phách đếm vào, đọc từ lưới MỘT vòng `perBeat` (lặp theo phách). */
export function hopAmTheoPhach(perBeat: readonly string[], demVao: number): (beat: number) => HopAmLuc | null {
  const daDoc = new Map<string, HopAmLuc | null>()
  const doc = (symbol: string): HopAmLuc | null => {
    if (!daDoc.has(symbol)) {
      const chord = symbol ? parseChordInput(symbol).chords[0] : undefined
      daDoc.set(
        symbol,
        chord
          ? {
              lop: new Set([
                ...chord.quality.intervals.map((step) => (chord.root + step) % 12),
                ...(chord.bass !== undefined ? [chord.bass] : []),
              ]),
              bass: chord.bass ?? chord.root,
            }
          : null,
      )
    }
    return daDoc.get(symbol)!
  }
  return (beat) => {
    const i = Math.floor(beat - demVao + 1e-6)
    if (i < 0 || perBeat.length === 0) return null
    return doc(perBeat[i % perBeat.length] ?? '')
  }
}

export interface ChamHopAm {
  /** Tiếng bass của khuôn (cú tay trái mà nốt thấp nhất là bass của hợp âm) · số tiếng bấm đúng bass. */
  bassTong: number
  bassDung: number
  /** Phím thừa mang nốt NGOÀI hợp âm đang vang. */
  notSai: number
}

/**
 * Kiểm bass và nốt sai cho bậc 7.
 * - Tiếng bass = cú tay trái của khuôn mà nốt thấp nhất LÀ bass của hợp âm. Nốt đi bass khác (bậc 5, bậc 3, nốt rải …) không kiểm —
 *   thế bấm tự chọn. Đúng khi nốt THẤP NHẤT trong các phím bấm quanh đó (± cửa sổ, đã trừ độ trễ) cùng tên nốt bass: tay phải bấm La4
 *   trên một bass khác thì không tính là bass La.
 * - Nốt sai = phím thừa (không ghép được với nốt nào của khuôn) mang nốt NGOÀI hợp âm đang vang. Thừa mà là nốt của hợp âm (bè khác,
 *   gấp quãng tám) thì không tính.
 */
export function chamHopAm(
  events: readonly TimelineEvent[],
  played: readonly PlayedNote[],
  extra: readonly PlayedNote[],
  options: { msPerBeat: number; latencyMs: number; windowMs?: number; hopAmAt: (beat: number) => HopAmLuc | null },
): ChamHopAm {
  const { msPerBeat, latencyMs, windowMs = MATCH_WINDOW_MS, hopAmAt } = options
  const tre = latencyMs / msPerBeat
  const cua = windowMs / msPerBeat
  const thapNhat = new Map<number, MidiNote>()
  for (const event of events) {
    if (event.hand !== 'left' || event.grace || event.notes.length === 0) continue
    const khoa = Math.round(event.startBeat * 1000)
    thapNhat.set(khoa, Math.min(thapNhat.get(khoa) ?? Infinity, ...event.notes))
  }
  let bassTong = 0
  let bassDung = 0
  for (const [khoa, note] of thapNhat) {
    const beat = khoa / 1000
    const hopAm = hopAmAt(beat)
    if (!hopAm || pitchClassOf(note) !== hopAm.bass) continue
    bassTong += 1
    const quanh = played.filter((press) => Math.abs(press.beat - tre - beat) <= cua)
    if (quanh.length > 0 && pitchClassOf(Math.min(...quanh.map((press) => press.note))) === hopAm.bass) bassDung += 1
  }
  const notSai = extra.filter((press) => {
    const hopAm = hopAmAt(press.beat - tre)
    return hopAm !== null && !hopAm.lop.has(pitchClassOf(press.note))
  }).length
  return { bassTong, bassDung, notSai }
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
