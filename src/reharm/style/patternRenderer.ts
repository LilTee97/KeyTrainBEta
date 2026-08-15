import type { MidiNote } from '../../shared/musicTheory/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { HitVoice, StylePattern, TimelineEvent } from './types'

/**
 * Biến chuỗi thế bấm hai tay thành dòng thời gian các tiếng đàn.
 *
 * Có hai nhánh, đúng theo cách tài liệu nguồn phân loại điệu:
 *
 * - Điệu **có mẫu tiết tấu cố định** (bossa, valse, swing): lặp lại mẫu đó
 *   bất kể hợp âm là gì.
 * - Điệu **không có mẫu** (ballad): tiết tấu bám theo nhịp đổi hợp âm của
 *   từng bài, nốt dài khi hợp âm ngân lâu và ngắn khi hợp âm đổi dày.
 */

/** Lực nhấn chuẩn của tiếng đàn trong phần đệm. */
const BASE_VELOCITY = 80

/** Tay trái đánh nhẹ hơn tay phải để giai điệu và hợp âm nổi lên trên. */
const LEFT_HAND_SCALE = 0.85

export interface RenderOptions {
  /** Số phách mỗi hợp âm chiếm. Mặc định trọn một ô nhịp. */
  beatsPerChord?: number
  /**
   * Số phách của **từng** hợp âm, khi chúng không dài bằng nhau.
   *
   * Cần cho hợp âm lướt: chúng mượn nửa sau ô nhịp của hợp âm đứng trước chứ
   * không chiếm trọn một ô như hợp âm chính. Bỏ trống thì mọi hợp âm dài bằng
   * `beatsPerChord`.
   */
  beatsEach?: readonly number[]
  /** Cắt bớt độ ngân để hai hợp âm liền nhau không chồng tiếng. */
  releaseRatio?: number
}

function clampVelocity(value: number): number {
  return Math.max(1, Math.min(127, Math.round(value)))
}

/**
 * Chọn nốt cho một tiếng đàn: cả hợp âm, hay chỉ nốt trên cùng hoặc dưới cùng.
 *
 * Điệu swing cần lấy riêng nốt trên cùng cho những tiếng ở chỗ nảy — đó chính
 * là phần "nốt đơn" xen kẽ giữa các hợp âm.
 */
function notesForVoice(
  notes: readonly MidiNote[],
  voice: HitVoice = 'chord',
): MidiNote[] {
  if (notes.length === 0) return []

  switch (voice) {
    case 'top':
      return [notes[notes.length - 1]]
    case 'bottom':
      return [notes[0]]
    default:
      return [...notes]
  }
}

/**
 * Nhánh ballad: hợp âm khối, hai tay đánh cùng lúc theo nhịp đổi hợp âm.
 *
 * Khi một hợp âm chiếm trọn từ một ô nhịp trở lên, hợp âm được đánh lại ở giữa
 * quãng đó thay vì ngân suốt — đúng với giá trị nốt trắng quan sát được trong
 * các bản notate của tài liệu, và giữ cho phần đệm khỏi chết lặng.
 */
function renderBlockChords(
  voicings: readonly TwoHandVoicing[],
  durations: readonly number[],
  starts: readonly number[],
  beatsPerMeasure: number,
  releaseRatio: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  voicings.forEach((voicing, index) => {
    const chordStart = starts[index]
    const chordBeats = durations[index]

    // Hợp âm ngân từ một ô nhịp trở lên thì chia đôi để đánh lại.
    const strikeCount = chordBeats >= beatsPerMeasure ? 2 : 1
    const strikeLength = chordBeats / strikeCount

    for (let strike = 0; strike < strikeCount; strike += 1) {
      const startBeat = chordStart + strike * strikeLength
      const durationBeats = strikeLength * releaseRatio

      // Lần đánh lại nhẹ hơn lần đầu, để nghe ra đâu là chỗ đổi hợp âm.
      const emphasis = strike === 0 ? 1 : 0.8

      events.push({
        notes: voicing.right,
        startBeat,
        durationBeats,
        hand: 'right',
        velocity: clampVelocity(BASE_VELOCITY * emphasis),
      })

      events.push({
        notes: voicing.left,
        startBeat,
        durationBeats,
        hand: 'left',
        velocity: clampVelocity(BASE_VELOCITY * emphasis * LEFT_HAND_SCALE),
      })
    }
  })

  return events
}

/**
 * Nhánh điệu có mẫu tiết tấu cố định: lặp mẫu, mỗi lần lặp lấy thế bấm của hợp
 * âm đang vang tại thời điểm đó.
 */
function renderWithCell(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  durations: readonly number[],
  starts: readonly number[],
  releaseRatio: number,
): TimelineEvent[] {
  const cell = pattern.cell
  if (!cell) return []

  const totalBeats = starts[starts.length - 1] + durations[durations.length - 1]
  const events: TimelineEvent[] = []

  /** Hợp âm nào đang vang tại một thời điểm, khi chúng dài ngắn khác nhau. */
  const voicingAt = (beat: number) => {
    for (let index = starts.length - 1; index >= 0; index -= 1) {
      if (beat >= starts[index] - 0.0001) return voicings[index]
    }
    return voicings[0]
  }

  for (let offset = 0; offset < totalBeats; offset += cell.lengthBeats) {
    for (const hand of ['right', 'left'] as const) {
      const hits = hand === 'right' ? cell.right : cell.left

      for (const hit of hits) {
        const startBeat = offset + hit.beat
        if (startBeat >= totalBeats) continue

        const voicing = voicingAt(startBeat)
        if (!voicing) continue

        const source = hand === 'right' ? voicing.right : voicing.left
        const notes = notesForVoice(source, hit.voice)
        const handScale = hand === 'left' ? LEFT_HAND_SCALE : 1

        events.push({
          notes,
          startBeat,
          durationBeats: hit.durationBeats * releaseRatio,
          hand,
          velocity: clampVelocity(
            BASE_VELOCITY * (hit.velocityScale ?? 1) * handScale,
          ),
        })
      }
    }
  }

  return [
    ...events,
    ...missingChordHits(events, voicings, starts, releaseRatio),
  ]
}

/** Sai số khi so mốc phách, tránh lỗi làm tròn số thực. */
const EPSILON = 0.001

/**
 * Bù tiếng đàn cho những hợp âm mà mẫu tiết tấu bỏ sót.
 *
 * Mẫu tiết tấu cố định đánh vào **vị trí cố định trong ô nhịp**, còn hợp âm
 * lướt thì đổi ở giữa ô. Hai thứ không biết nhau, nên hợp âm lướt có thể trôi
 * qua mà không được đánh tiếng nào.
 *
 * Đo trên vòng `C Am F G` sau khi chèn ba vòng hai-năm lướt: điệu swing đánh
 * bass ở phách 0, 4, 8, 12 trong khi hợp âm đổi ở phách 0, 2, 3, 4, 6, 7, 8,
 * 10, 11, 12 — **sáu trên mười hợp âm không có nốt bass nào**. Người dùng nghe
 * ra đúng là mất tiếng bass.
 *
 * Bù một tiếng ngay tại chỗ đổi hợp âm cho tay nào đang bị bỏ sót. Hợp âm được
 * chèn vào là để **nghe thấy**; không đánh tiếng nào thì chèn làm gì.
 */
function missingChordHits(
  events: readonly TimelineEvent[],
  voicings: readonly TwoHandVoicing[],
  starts: readonly number[],
  releaseRatio: number,
): TimelineEvent[] {
  const extra: TimelineEvent[] = []

  voicings.forEach((voicing, index) => {
    const chordStart = starts[index]
    const chordEnd = starts[index + 1] ?? Number.POSITIVE_INFINITY

    for (const hand of ['right', 'left'] as const) {
      const covered = events.some(
        (event) =>
          event.hand === hand &&
          event.startBeat >= chordStart - EPSILON &&
          event.startBeat < chordEnd - EPSILON,
      )
      if (covered) continue

      const notes = hand === 'right' ? voicing.right : voicing.left
      if (notes.length === 0) continue

      // Ngân tới hết phần thời gian của hợp âm, hoặc tới tiếng kế tiếp.
      const nextHit = events
        .filter((event) => event.startBeat > chordStart + EPSILON)
        .reduce(
          (soonest, event) => Math.min(soonest, event.startBeat),
          Number.POSITIVE_INFINITY,
        )
      const until = Math.min(chordEnd, nextHit)

      extra.push({
        notes,
        startBeat: chordStart,
        durationBeats:
          Math.max(0.25, until - chordStart) * releaseRatio,
        hand,
        velocity: clampVelocity(
          BASE_VELOCITY * (hand === 'left' ? LEFT_HAND_SCALE : 1),
        ),
      })
    }
  })

  return extra
}

/**
 * Cắt độ ngân để không tiếng nào vang sang hợp âm sau.
 *
 * Cùng lý do: mẫu tiết tấu ghi độ ngân theo ô nhịp, không biết hợp âm đổi giữa
 * chừng. Bass của hợp âm cũ ngân đè lên hợp âm mới vừa làm đục vừa sai hoà âm.
 */
function clipToChords(
  events: readonly TimelineEvent[],
  starts: readonly number[],
): TimelineEvent[] {
  return events.map((event) => {
    const nextStart = starts.find((start) => start > event.startBeat + EPSILON)
    if (nextStart === undefined) return event

    const room = nextStart - event.startBeat
    return event.durationBeats <= room
      ? event
      : { ...event, durationBeats: Math.max(0.05, room) }
  })
}

/** Dựng dòng thời gian cho cả đoạn. */
export function renderPattern(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  options: RenderOptions = {},
): TimelineEvent[] {
  const {
    beatsPerChord = pattern.beatsPerMeasure,
    beatsEach,
    releaseRatio = 0.92,
  } = options

  if (voicings.length === 0) return []

  // Thời lượng từng hợp âm, và phách bắt đầu tính dồn từ đó.
  const durations = voicings.map(
    (_, index) => beatsEach?.[index] ?? beatsPerChord,
  )
  const starts: number[] = []
  let cursor = 0
  for (const beats of durations) {
    starts.push(cursor)
    cursor += beats
  }

  const events = pattern.cell
    ? renderWithCell(voicings, pattern, durations, starts, releaseRatio)
    : renderBlockChords(
        voicings,
        durations,
        starts,
        pattern.beatsPerMeasure,
        releaseRatio,
      )

  return clipToChords(events, starts).sort(
    (a, b) => a.startBeat - b.startBeat,
  )
}

/** Tổng độ dài của dòng thời gian, tính bằng phách. */
export function timelineLengthBeats(events: readonly TimelineEvent[]): number {
  let last = 0
  for (const event of events) {
    last = Math.max(last, event.startBeat + event.durationBeats)
  }
  return last
}

/** Lọc theo tay, dùng cho chế độ luyện tay trái hoặc tay phải riêng. */
export function eventsForHand(
  events: readonly TimelineEvent[],
  hand: 'left' | 'right' | 'both',
): TimelineEvent[] {
  if (hand === 'both') return [...events]
  return events.filter((event) => event.hand === hand)
}
