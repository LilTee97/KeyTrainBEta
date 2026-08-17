import type { MidiNote } from '../../shared/musicTheory/types'
import {
  LEFT_HAND_HIGH,
  LEFT_HAND_LOW,
  clampToHandRegister,
  settleHands,
  type TwoHandVoicing,
} from '../voicingGenerator/handSplitVoicing'
import type { HitVoice, RhythmCell, StylePattern, TimelineEvent } from './types'

/**
 * Biến chuỗi thế bấm hai tay thành dòng thời gian các tiếng đàn.
 *
 * - Điệu có `cell`: lặp mẫu cố định (ballad Khá Bự, bossa, valse, swing).
 * - renderBlockChords chỉ còn cho trường hợp cell=null.
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
  /**
   * Các hợp âm mà **ô nhịp cuối** của chúng không quạt hợp âm nữa.
   *
   * Dùng cho ô nối sang đoạn mới: ô đó dành trọn cho một câu chạy ngón, nên
   * phần đệm phải im hẳn — cả hợp âm lẫn nốt bass — không thì câu chạy vừa bị
   * lấp vừa nghe dày.
   *
    * Lọc sau khi dựng chứ không cài vào từng nhánh dựng, để **mọi điệu đều
    * theo**: điệu có mẫu tiết tấu cố định cũng phải nhường ô đó như ballad.
    *
    * `Map` thì value là số phách đầu ô nối **vẫn đệm** (hợp âm chơi rồi mới
    * chạy ngón). `Set` = im cả ô.
    */
  barsWithoutComping?: ReadonlySet<number> | ReadonlyMap<number, number>
  /** Im đệm trong các khoảng phách này — cắt cả nốt ngân sang. */
  muteWindows?: readonly { from: number; to: number }[]
  /** Đổi mẫu theo từng ô nhịp (ballad Khá Bự: verse/pre/chorus). */
  cellAt?: (beat: number) => RhythmCell
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
function pickTone(
  notes: readonly MidiNote[],
  toneIndex: number,
  semitones = 0,
): MidiNote {
  const index = ((toneIndex % notes.length) + notes.length) % notes.length
  return (notes[index] + semitones) as MidiNote
}

function notesForVoice(
  notes: readonly MidiNote[],
  voice: HitVoice = 'chord',
  toneIndex?: number,
  tones?: readonly { toneIndex: number; semitones?: number }[],
): MidiNote[] {
  if (notes.length === 0) return []
  if (tones?.length) {
    return tones.map((spec) =>
      pickTone(notes, spec.toneIndex, spec.semitones ?? 0),
    )
  }
  if (toneIndex !== undefined) {
    return [pickTone(notes, toneIndex)]
  }

  switch (voice) {
    case 'top':
      return [notes[notes.length - 1]]
    case 'bottom':
      return [notes[0]]
    default:
      return [...notes]
  }
}

/** Cú đẩy nằm cách vạch nhịp sau **nửa phách**, tức phách 4,5 của ô bốn bốn. */
const PUSH_BEFORE_BAR = 0.5

/**
 * Nhánh block chords (dùng khi style.cell === null).
 */
function renderBlockChords(
  voicings: readonly TwoHandVoicing[],
  durations: readonly number[],
  starts: readonly number[],
  beatsPerMeasure: number,
  releaseRatio: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  /** Một tiếng hai tay cùng lúc, dùng cho hợp âm ngắn hơn một ô nhịp. */
  const strikeBoth = (
    voicing: TwoHandVoicing,
    at: number,
    beats: number,
    emphasis: number,
  ) => {
    events.push({
      notes: voicing.right,
      startBeat: at,
      durationBeats: beats * releaseRatio,
      hand: 'right',
      velocity: clampVelocity(BASE_VELOCITY * emphasis),
    })

    events.push({
      notes: voicing.left,
      startBeat: at,
      durationBeats: beats * releaseRatio,
      hand: 'left',
      velocity: clampVelocity(BASE_VELOCITY * emphasis * LEFT_HAND_SCALE),
    })
  }

  voicings.forEach((voicing, index) => {
    const chordStart = starts[index]
    const chordBeats = durations[index]
    const measures = Math.floor(chordBeats / beatsPerMeasure)

    /*
      Hợp âm ngắn hơn một ô nhịp — ô đã chia đôi cho hợp âm lướt chẳng hạn —
      thì chỉ một tiếng. Chỗ đó vốn đã dày vì hợp âm đổi nhanh, nhồi đủ ba
      tiếng vào chỉ thành rối.
    */
    if (measures === 0) {
      strikeBoth(voicing, chordStart, chordBeats, 1)
      return
    }

    const half = beatsPerMeasure / 2

    for (let measure = 0; measure < measures; measure += 1) {
      const barStart = chordStart + measure * beatsPerMeasure

      // Nốt thấp nhất của tay trái, đánh trơ một mình ở đầu ô.
      events.push({
        notes: [voicing.left[0]],
        startBeat: barStart,
        durationBeats: half * releaseRatio,
        hand: 'left',
        velocity: clampVelocity(BASE_VELOCITY * LEFT_HAND_SCALE),
      })

      // Hoà âm mở ra ở giữa ô nhịp.
      strikeBoth(voicing, barStart + half, half, 0.85)

      events.push({
        notes: voicing.right,
        startBeat: barStart + beatsPerMeasure - PUSH_BEFORE_BAR,
        durationBeats: PUSH_BEFORE_BAR * releaseRatio,
        hand: 'right',
        // Nhẹ hơn hẳn hai tiếng chính: nó bắc cầu, không phải chỗ nhấn.
        velocity: clampVelocity(BASE_VELOCITY * 0.6),
      })
    }

    // Phần dư không đủ một ô nhịp thì đánh một tiếng cho khỏi trống.
    const tail = chordBeats - measures * beatsPerMeasure
    if (tail > 0) {
      strikeBoth(voicing, chordStart + measures * beatsPerMeasure, tail, 0.85)
    }
  })

  return events
}

/**
 * Nhánh điệu có mẫu tiết tấu cố định: lặp mẫu, mỗi lần lặp lấy thế bấm của hợp
 * âm đang vang tại thời điểm đó.
 */
function inMuteWindow(
  beat: number,
  windows: readonly { from: number; to: number }[] | undefined,
): boolean {
  if (!windows?.length) return false
  return windows.some(
    (window) => beat >= window.from - EPSILON && beat < window.to - EPSILON,
  )
}

function renderWithCell(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  durations: readonly number[],
  starts: readonly number[],
  releaseRatio: number,
  cellAt?: (beat: number) => RhythmCell,
  muteWindows?: readonly { from: number; to: number }[],
): TimelineEvent[] {
  const fallback = pattern.cell
  if (!fallback && !cellAt) return []

  const totalBeats = starts[starts.length - 1] + durations[durations.length - 1]
  const events: TimelineEvent[] = []
  const step = fallback?.lengthBeats ?? 4

  /** Hợp âm nào đang vang tại một thời điểm, khi chúng dài ngắn khác nhau. */
  const voicingAt = (beat: number) => {
    for (let index = starts.length - 1; index >= 0; index -= 1) {
      if (beat >= starts[index] - 0.0001) return voicings[index]
    }
    return voicings[0]
  }

  for (let offset = 0; offset < totalBeats; offset += step) {
    const cell = cellAt?.(offset) ?? fallback
    if (!cell) continue

    for (const hand of ['right', 'left'] as const) {
      const hits = hand === 'right' ? cell.right : cell.left

      for (const hit of hits) {
        const startBeat = offset + hit.beat
        if (startBeat >= totalBeats) continue
        if (inMuteWindow(startBeat, muteWindows)) continue

        const voicing = voicingAt(startBeat)
        if (!voicing) continue

        const source = hand === 'right' ? voicing.right : voicing.left
        const raw = notesForVoice(source, hit.voice, hit.toneIndex, hit.tones)
        const split = settleHands(
          hand === 'left' ? raw : voicing.left,
          hand === 'right' ? raw : voicing.right,
        )
        const notes = hand === 'left' ? split.left : split.right
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
    ...missingChordHits(events, voicings, starts, releaseRatio).filter(
      (event) => !inMuteWindow(event.startBeat, muteWindows),
    ),
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
    barsWithoutComping,
    muteWindows,
    cellAt,
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

  const events = pattern.cell || cellAt
    ? renderWithCell(
        voicings,
        pattern,
        durations,
        starts,
        releaseRatio,
        cellAt,
        muteWindows,
      )
    : renderBlockChords(
        voicings,
        durations,
        starts,
        pattern.beatsPerMeasure,
        releaseRatio,
      )

  const dropped = barsWithoutComping?.size
    ? dropLastMeasure(
        events,
        durations,
        starts,
        pattern.beatsPerMeasure,
        barsWithoutComping,
      )
    : events
  const muted = muteWindows?.length ? applyMuteWindows(dropped, muteWindows) : dropped

  return clipToChords(muted, starts)
    .map((event) => ({
      ...event,
      notes: event.notes.map((note) => clampToHandRegister(note, event.hand)),
    }))
    .sort((a, b) => a.startBeat - b.startBeat)
}

function applyMuteWindows(
  events: readonly TimelineEvent[],
  windows: readonly { from: number; to: number }[],
): TimelineEvent[] {
  return events.flatMap((event) => {
    const start = event.startBeat
    const end = start + event.durationBeats
    if (windows.some((window) => start >= window.from - EPSILON && start < window.to - EPSILON)) {
      return []
    }
    let until = end
    for (const window of windows) {
      if (start < window.from && end > window.from) {
        until = Math.min(until, window.from)
      }
    }
    const durationBeats = until - start
    if (durationBeats <= 0.05) return []
    return durationBeats === event.durationBeats
      ? [event]
      : [{ ...event, durationBeats }]
  })
}

/** Bỏ các tiếng đàn rơi vào ô nhịp cuối của những hợp âm được chỉ định. */
function dropLastMeasure(
  events: readonly TimelineEvent[],
  durations: readonly number[],
  starts: readonly number[],
  beatsPerMeasure: number,
  chords: ReadonlySet<number> | ReadonlyMap<number, number>,
): TimelineEvent[] {
  const windows: { from: number; to: number }[] = []
  const keep =
    chords instanceof Map
      ? chords
      : new Map([...chords].map((index) => [index, 0]))

  for (const [index, lead] of keep) {
    const start = starts[index]
    const beats = durations[index]
    if (start === undefined || beats < beatsPerMeasure) continue

    const from = start + beats - beatsPerMeasure + Math.max(0, lead)
    if (from >= start + beats) continue
    windows.push({ from, to: start + beats })
  }

  if (windows.length === 0) return [...events]

  return events.filter(
    (event) =>
      !windows.some(
        (window) =>
          event.startBeat >= window.from - 0.001 &&
          event.startBeat < window.to - 0.001,
      ),
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

function overlaps(
  event: TimelineEvent,
  from: number,
  to: number,
): boolean {
  return event.startBeat < to - 0.001 && event.startBeat + event.durationBeats > from + 0.001
}

/**
 * Khi tay phải đang chạy fill / improvise / chạy ngón: bỏ quạt hợp âm tay phải,
 * chuyển khối đó sang tay trái (hạ vào dải bass).
 */
export function giveCompingToLeft(
  accompaniment: readonly TimelineEvent[],
  melody: readonly TimelineEvent[],
): TimelineEvent[] {
  if (melody.length === 0) return [...accompaniment]

  return accompaniment.map((event) => {
    if (event.hand !== 'right') return event
    const busy = melody.some((line) =>
      overlaps(event, line.startBeat, line.startBeat + line.durationBeats),
    )
    if (!busy) return event

    const notes = event.notes.map((note) => {
      let pitch = note
      while (pitch > LEFT_HAND_HIGH) pitch -= 12
      while (pitch < LEFT_HAND_LOW) pitch += 12
      return pitch as MidiNote
    })
    return { ...event, hand: 'left' as const, notes }
  })
}
