import type { SectionKind, SongTimeline } from './songStructure'
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
  | { type: 'interlude'; over: number; loops: number }

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
  return `Giang tấu (vòng ${over})${times}`
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

export interface BuildArrangedSongOptions {
  /** Phần đệm của cả bài, đã nằm đúng vị trí trên dòng thời gian gốc. */
  accompaniment: readonly TimelineEvent[]
  /** Phần đệm dùng cho đoạn giang tấu, cũng của cả bài. */
  interlude?: readonly TimelineEvent[]
  fills: readonly TimelineEvent[]
  solo: (take: number) => readonly TimelineEvent[]
  sources: readonly SourceSection[]
  steps: readonly ArrangementStep[]
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
  const { accompaniment, interlude, fills, solo, sources, steps } = options

  const forInterlude = interludeAccompaniment(interlude ?? accompaniment)

  const events: TimelineEvent[] = []
  const sections: SongTimeline['sections'] = []
  let cursor = 0
  let take = 0

  for (const step of steps) {
    if (step.type === 'section') {
      const source = sources[step.source]
      if (!source) continue

      sections.push({
        kind: source.kind,
        startBeat: cursor,
        lengthBeats: source.lengthBeats,
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

    const loops = Math.max(1, Math.floor(step.loops))
    sections.push({
      kind: 'interlude',
      startBeat: cursor,
      lengthBeats: over.lengthBeats * loops,
    })

    for (let loop = 0; loop < loops; loop += 1) {
      const at = cursor + loop * over.lengthBeats

      events.push(
        ...slice(forInterlude, over.startBeat, over.lengthBeats, at),
        // Mỗi lượt một câu ngẫu hứng khác, không lặp lại y nguyên.
        ...slice(solo(take), over.startBeat, over.lengthBeats, at),
      )
      take += 1
    }

    cursor += over.lengthBeats * loops
  }

  return {
    events: events.sort((a, b) => a.startBeat - b.startBeat),
    totalBeats: cursor,
    sections,
    soloTakes: take,
  }
}
