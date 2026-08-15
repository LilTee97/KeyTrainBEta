import type { TimelineEvent } from './types'

/**
 * Cấu trúc bài hát, và chỗ đặt đoạn giang tấu.
 *
 * Giang tấu **không phải** ngẫu hứng suốt cả bài. Nó là một **đoạn riêng**:
 * hát xong điệp khúc thì có một khoảng trống trước khi quay lại phiên khúc, và
 * đó là chỗ nhạc cụ chơi thay giọng hát. Tài liệu về cấu trúc bài hát nói đúng
 * điều này — đoạn xen kẽ hầu như luôn là đoạn không lời, đặt giữa điệp khúc và
 * phiên khúc mới, để ca sĩ có chỗ lấy hơi.
 *
 * Hệ quả cho phần sinh giai điệu: **câu solo chỉ chơi trong đoạn giang tấu**,
 * còn đoạn có lời thì chỉ chêm câu fill ngắn ở khe hở giữa các hợp âm. Chơi
 * solo suốt bài là đè lên giọng hát.
 */

export type SectionKind =
  /** Đoạn kể chuyện, có lời. */
  | 'verse'
  /** Đoạn cao trào, có lời. */
  | 'chorus'
  /** Đoạn không lời, chỗ ngẫu hứng. */
  | 'interlude'

export const SECTION_LABELS: Record<SectionKind, string> = {
  verse: 'Phiên khúc',
  chorus: 'Điệp khúc',
  interlude: 'Giang tấu',
}

export interface SongSection {
  kind: SectionKind
  /** Số lượt lặp vòng hợp âm trong đoạn này. */
  loops: number
}

export interface SongForm {
  id: string
  name: string
  description: string
  sections: readonly SongSection[]
}

/**
 * Các dạng cấu trúc dựng sẵn.
 *
 * Ở đây cả bài dùng **chung một vòng hợp âm** vì app chưa nhận lời bài hát để
 * tách phiên khúc với điệp khúc. Cái phân biệt các đoạn là **cách chơi**: đoạn
 * có lời thì chừa chỗ cho giọng hát, đoạn giang tấu thì nhạc cụ chơi thay.
 */
export const SONG_FORMS: readonly SongForm[] = [
  {
    id: 'loop-only',
    name: 'Chỉ lặp vòng',
    description: 'Lặp vòng hợp âm đều đặn, không có đoạn giang tấu nào.',
    sections: [{ kind: 'verse', loops: 1 }],
  },
  {
    id: 'two-then-interlude',
    name: 'Hai lượt rồi giang tấu',
    description:
      'Phiên khúc, điệp khúc, rồi một lượt giang tấu trước khi quay lại. Dạng gọn nhất để luyện.',
    sections: [
      { kind: 'verse', loops: 1 },
      { kind: 'chorus', loops: 1 },
      { kind: 'interlude', loops: 1 },
    ],
  },
  {
    id: 'full-pop',
    name: 'Đầy đủ kiểu pop',
    description:
      'Hai vòng phiên khúc và điệp khúc, giang tấu đặt sau điệp khúc thứ hai, rồi về lại điệp khúc cuối.',
    sections: [
      { kind: 'verse', loops: 1 },
      { kind: 'chorus', loops: 1 },
      { kind: 'verse', loops: 1 },
      { kind: 'chorus', loops: 1 },
      { kind: 'interlude', loops: 1 },
      { kind: 'chorus', loops: 1 },
    ],
  },
  {
    id: 'long-interlude',
    name: 'Giang tấu dài',
    description:
      'Giang tấu kéo hai lượt vòng hợp âm, đủ chỗ để triển khai câu nhạc.',
    sections: [
      { kind: 'verse', loops: 1 },
      { kind: 'chorus', loops: 1 },
      { kind: 'interlude', loops: 2 },
    ],
  },
]

export function getSongForm(id: string): SongForm | undefined {
  return SONG_FORMS.find((form) => form.id === id)
}

/** Một đoạn đã được đặt vào dòng thời gian. */
export interface PlacedSection {
  kind: SectionKind
  startBeat: number
  lengthBeats: number
}

export interface BuildSongOptions {
  /** Phần đệm của **một** lượt vòng hợp âm. */
  accompaniment: readonly TimelineEvent[]
  /** Câu fill, chỉ dùng ở đoạn có lời. */
  fills: readonly TimelineEvent[]
  /** Câu solo, chỉ dùng ở đoạn giang tấu. */
  solo: readonly TimelineEvent[]
  /** Độ dài một lượt vòng hợp âm, tính bằng phách. */
  loopLengthBeats: number
  form: SongForm
}

export interface SongTimeline {
  events: TimelineEvent[]
  totalBeats: number
  sections: PlacedSection[]
}

/** Dời một nhóm sự kiện sang vị trí khác trên dòng thời gian. */
function shift(
  events: readonly TimelineEvent[],
  offset: number,
): TimelineEvent[] {
  return events.map((event) => ({
    ...event,
    startBeat: event.startBeat + offset,
  }))
}

/**
 * Dựng dòng thời gian cho cả bài theo cấu trúc đã chọn.
 *
 * Mỗi lượt lặp đều có phần đệm; phần giai điệu thì tuỳ đoạn — đoạn có lời
 * nhận câu fill, đoạn giang tấu nhận câu solo.
 */
export function buildSongTimeline(options: BuildSongOptions): SongTimeline {
  const { accompaniment, fills, solo, loopLengthBeats, form } = options

  const events: TimelineEvent[] = []
  const sections: PlacedSection[] = []
  let cursor = 0

  for (const section of form.sections) {
    const lengthBeats = section.loops * loopLengthBeats
    sections.push({ kind: section.kind, startBeat: cursor, lengthBeats })

    for (let loop = 0; loop < section.loops; loop += 1) {
      const offset = cursor + loop * loopLengthBeats

      events.push(...shift(accompaniment, offset))
      events.push(
        ...shift(section.kind === 'interlude' ? solo : fills, offset),
      )
    }

    cursor += lengthBeats
  }

  return {
    events: events.sort((a, b) => a.startBeat - b.startBeat),
    totalBeats: cursor,
    sections,
  }
}
