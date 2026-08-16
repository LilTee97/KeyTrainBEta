import type { SectionKind, SongTimeline, TimeSegment } from './songStructure'
import { interludeAccompaniment } from './songStructure'
import type { TimelineEvent } from './types'

/**
 * Thứ tự chơi của một bài: đoạn nào trước, đoạn nào lặp lại, kết ở đâu.
 *
 * Bản nhạc chỉ mô tả được **các đoạn có gì**, không mô tả được **chơi theo thứ
 * tự nào**. Rất nhiều bài chơi xong giang tấu thì quay lại điệp khúc rồi mới
 * kết — mà trên lời thì điệp khúc chỉ viết một lần, nên đánh dấu trên lời
 * không bao giờ diễn tả nổi chuyện đó.
 *
 * Tách riêng thứ tự chơi ra giải quyết luôn cả chuyện **giang tấu nằm ở khoảng
 * trống**: chỗ đó không có lời cũng chẳng có hợp âm để quét, nên thay vì bắt
 * người dùng đánh dấu lên một chỗ trống, họ chèn thẳng một bước giang tấu vào
 * danh sách rồi chọn nó **mượn vòng hợp âm của đoạn nào**.
 */

/**
 * Nghỉ mặc định sau đoạn giang tấu: **một phách**.
 *
 * Đủ để tai chuyển từ lối nghe độc tấu sang lối nghe bài hát, mà chưa đứt mạch.
 * Trọn một ô nhịp thì dài quá — và nó còn làm mất câu quay đầu, vì cách nhau
 * cả ô im lặng thì câu dẫn chẳng dẫn vào đâu.
 */
export const DEFAULT_REST_AFTER = 1

/** Sai số khi so mốc phách, tránh lỗi làm tròn số thực. */
const EPSILON = 0.001

/** Một đoạn có thật trong bài, đã biết nó chiếm khoảng nào trên dòng thời gian. */
export interface SourceSection {
  name: string
  kind: SectionKind
  startBeat: number
  lengthBeats: number
}

/** Một bước trong thứ tự chơi. */
export type ArrangementStep =
  /** Chơi một đoạn có thật, đúng như nó vốn có. */
  | { type: 'section'; source: number }
  /**
   * Chèn một đoạn giang tấu, chơi trên vòng hợp âm của đoạn `over`.
   *
   * Giang tấu vốn là chỗ trống giữa bài, không có vòng hợp âm riêng — nó mượn
   * vòng của một đoạn khác, thường là điệp khúc.
   */
  | {
      type: 'interlude'
      over: number
      loops: number
      /**
       * Im mấy phách sau khi hết ngẫu hứng, trước khi vào bước kế tiếp.
       *
       * Bỏ trống thì lấy mặc định của cả bài. Để riêng từng bước vì mỗi chỗ
       * giang tấu một khác: chỗ trả bài lại cho người hát cần nhiều chỗ thở,
       * chỗ nối sang một đoạn nhạc khác thì gần như không cần.
       */
      restAfter?: number
    }

/** Thứ tự mặc định: chơi lần lượt từng đoạn đúng một lượt. */
export function defaultArrangement(
  sources: readonly SourceSection[],
): ArrangementStep[] {
  return sources.map((_, index) => ({ type: 'section', source: index }))
}

/** Nhãn hiện trên giao diện cho một bước. */
export function stepLabel(
  step: ArrangementStep,
  sources: readonly SourceSection[],
): string {
  if (step.type === 'section') {
    return sources[step.source]?.name || 'Đoạn không tên'
  }

  const over = sources[step.over]?.name ?? 'đoạn đầu'
  const times = step.loops > 1 ? ` ×${step.loops}` : ''
  // Ghi rõ "4 hợp âm" vì giang tấu không còn mượn trọn vòng của đoạn nữa.
  return `Giang tấu (4 hợp âm của ${over})${times}`
}

/**
 * Đoạn nào vang lên ngay sau bước thứ `index`.
 *
 * Bước sau có thể lại là một giang tấu nữa, và giang tấu mượn vòng của đoạn
 * khác — nên cái thật sự vang lên tiếp theo là đoạn nó mượn.
 */
function nextSection(
  steps: readonly ArrangementStep[],
  index: number,
  sources: readonly SourceSection[],
): SourceSection | null {
  const step = steps[index + 1]
  if (!step) return null
  return sources[step.type === 'section' ? step.source : step.over] ?? null
}

/** Cắt lấy các sự kiện của một khoảng rồi dời về vị trí mới. */
function slice(
  events: readonly TimelineEvent[],
  from: number,
  length: number,
  offset: number,
): TimelineEvent[] {
  return events
    .filter(
      (event) =>
        event.startBeat >= from - EPSILON &&
        event.startBeat < from + length - EPSILON,
    )
    .map((event) => ({
      ...event,
      startBeat: event.startBeat - from + offset,
    }))
}

/** Câu quay đầu đã dựng xong, các mốc tính từ phách 0. */
export interface TurnaroundTake {
  events: readonly TimelineEvent[]
  /** Chiếm bao nhiêu phách **cuối** vòng giang tấu. */
  beats: number
}

export interface BuildArrangedSongOptions {
  /** Phần đệm của cả bài, đã nằm đúng vị trí trên dòng thời gian gốc. */
  accompaniment: readonly TimelineEvent[]
  /** Phần đệm dùng cho đoạn giang tấu, cũng của cả bài. */
  interlude?: readonly TimelineEvent[]
  fills: readonly TimelineEvent[]
  solo: (take: number) => readonly TimelineEvent[]
  sources: readonly SourceSection[]
  steps: readonly ArrangementStep[]
  /**
   * Câu quay đầu ở cuối lượt giang tấu **cuối cùng**, hút về đoạn ngay sau.
   *
   * Chỉ lượt cuối mới đổi: các lượt trước còn phải chạy tiếp nên giữ nguyên
   * vòng hợp âm, đổi sớm thì lượt sau vào lại nghe như bắt đầu nhầm chỗ.
   *
   * Trả `null` nghĩa là chỗ này không cần quay đầu — thường vì vòng đã kết sẵn
   * ở bậc năm của đoạn sau.
   */
  turnaround?: (
    over: SourceSection,
    next: SourceSection,
  ) => TurnaroundTake | null
  /**
   * Vòng ngắn mà giang tấu thật sự chạy trên đó.
   *
   * Mượn trọn cả đoạn thì giang tấu dài lê thê — xem `interludeLoop.ts`. Bên
   * gọi nhặt ra một vòng ngắn hơn nằm trong đoạn rồi trả về khoảng đó.
   *
   * Trả `null` thì mượn trọn đoạn như cũ.
   */
  interludeRange?: (
    over: SourceSection,
    next: SourceSection | null,
  ) => { startBeat: number; lengthBeats: number } | null
  /**
   * Im hẳn mấy phách sau đoạn giang tấu, trước khi vào bước kế tiếp.
   *
   * Hết ngẫu hứng mà đoạn hát vào ngay thì không có chỗ nào để tai chuyển từ
   * lối nghe *độc tấu* sang lối nghe *bài hát*. Một ô nhịp trống làm việc đó.
   *
   * Nghỉ **trọn một ô nhịp** thì bỏ câu quay đầu: câu quay đầu sinh ra để dẫn
   * thẳng vào hợp âm ngay sau nó, mà cách nhau cả ô nhịp im lặng thì nó chẳng
   * dẫn vào đâu, lại nghe như bị cắt ngang.
   *
   * Nghỉ ngắn hơn thì **giữ câu quay đầu**: một hai phách chỉ là chỗ lấy hơi,
   * tai vẫn nối được câu dẫn với hợp âm đến sau.
   *
   * Từng bước giang tấu ghi đè được bằng `restAfter` của chính nó.
   */
  restAfterInterlude?: number
  /** Một ô nhịp dài mấy phách, để biết thế nào là nghỉ trọn ô. */
  beatsPerMeasure?: number
}

/**
 * Dựng dòng thời gian theo đúng thứ tự chơi đã chỉ định.
 *
 * Mỗi bước lấy sự kiện của đoạn nguồn rồi **dời về sau bước trước**, nên một
 * đoạn chơi được nhiều lần ở nhiều chỗ khác nhau mà không phải nhân bản dữ
 * liệu. Bài kết thúc ngay sau bước cuối cùng — không có bước nào thì không có
 * gì để chơi.
 */
export function buildArrangedSong(
  options: BuildArrangedSongOptions,
): SongTimeline {
  const {
    accompaniment,
    interlude,
    fills,
    solo,
    sources,
    steps,
    turnaround,
    interludeRange,
    restAfterInterlude = 0,
    beatsPerMeasure = 4,
  } = options

  const forInterlude = interludeAccompaniment(interlude ?? accompaniment)

  const events: TimelineEvent[] = []
  const sections: SongTimeline['sections'] = []
  const segments: TimeSegment[] = []
  let cursor = 0
  let take = 0

  for (const [index, step] of steps.entries()) {
    if (step.type === 'section') {
      const source = sources[step.source]
      if (!source) continue

      sections.push({
        kind: source.kind,
        startBeat: cursor,
        lengthBeats: source.lengthBeats,
      })

      segments.push({
        startBeat: cursor,
        lengthBeats: source.lengthBeats,
        sourceBeat: source.startBeat,
      })

      events.push(
        ...slice(accompaniment, source.startBeat, source.lengthBeats, cursor),
        ...slice(fills, source.startBeat, source.lengthBeats, cursor),
      )

      cursor += source.lengthBeats
      continue
    }

    const over = sources[step.over]
    if (!over) continue

    /*
      Giang tấu là bước cuối thì không quay đầu về đâu cả — bài dừng ngay sau
      nó, chèn một cụm hút về chỗ không tồn tại chỉ làm bài kết lửng.
    */
    const next = nextSection(steps, index, sources)

    // Vòng ngắn nhặt từ đoạn, hoặc trọn đoạn nếu bên gọi không nhặt.
    const range = interludeRange?.(over, next) ?? over
    const loopBeats = range.lengthBeats
    const loops = Math.max(1, Math.floor(step.loops))

    sections.push({
      kind: 'interlude',
      startBeat: cursor,
      lengthBeats: loopBeats * loops,
    })

    const restAfter =
      next === null ? 0 : (step.restAfter ?? restAfterInterlude)

    // Nghỉ trọn ô nhịp thì thôi quay đầu — xem `restAfterInterlude`.
    const severed = restAfter >= beatsPerMeasure
    const turn = next && turnaround && !severed ? turnaround(over, next) : null
    const played = turn ? Math.max(0, loopBeats - turn.beats) : loopBeats

    for (let loop = 0; loop < loops; loop += 1) {
      const at = cursor + loop * loopBeats
      const last = loop === loops - 1
      const length = last && turn ? played : loopBeats

      /*
        Cả lượt tra về vòng ngắn đã nhặt, kể cả phần ô cuối đã đổi thành cụm
        quay đầu: hợp âm quay đầu không có mặt trong bản nhạc nên không neo
        vào đâu được, giữ sáng hợp âm cuối của vòng là gần đúng nhất.
      */
      segments.push({
        startBeat: at,
        lengthBeats: loopBeats,
        sourceBeat: range.startBeat,
      })

      events.push(
        ...slice(forInterlude, range.startBeat, length, at),
        // Mỗi lượt một câu ngẫu hứng khác, không lặp lại y nguyên.
        ...slice(solo(take), range.startBeat, length, at),
      )
      take += 1

      /*
        Cụm quay đầu chơi bằng **cả hai tay**, không rút gọn như phần còn lại
        của giang tấu. Suốt giang tấu tay phải để dành cho câu ngẫu hứng; đến
        chỗ này cả hai tay quay lại chơi hợp âm chính là dấu hiệu nghe ra ngay
        rằng phần ngẫu hứng đã hết và đoạn hát sắp vào.
      */
      if (last && turn) {
        for (const event of turn.events) {
          events.push({ ...event, startBeat: event.startBeat + at + played })
        }
      }
    }

    cursor += loopBeats * loops + restAfter
  }

  return {
    events: events.sort((a, b) => a.startBeat - b.startBeat),
    totalBeats: cursor,
    sections,
    segments,
    soloTakes: take,
  }
}
