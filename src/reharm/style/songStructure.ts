import type { TimelineEvent } from './types'
import { LEFT_HAND_HIGH } from '../voicingGenerator/handSplitVoicing'

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
 *
 * Và quan trọng không kém: vào đoạn giang tấu thì **tay phải thôi quạt hợp
 * âm** để rảnh tay chơi giai điệu — xem `interludeAccompaniment` bên dưới.
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
  /** Câu fill, chỉ dùng ở đoạn có lời. Hàm thì mỗi lượt một câu khác. */
  fills:
    | readonly TimelineEvent[]
    | ((take: number) => readonly TimelineEvent[])
  /**
   * Câu solo cho **lượt giang tấu thứ mấy**, đếm từ 0.
   *
   * Là một hàm chứ không phải một mảng cố định, vì mỗi lượt giang tấu phải
   * chơi một đoạn khác nhau — lặp y nguyên nghe ra ngay là máy phát lại băng.
   * Nhận số lượt thay vì tự sinh ngẫu nhiên để cùng một bài phát lại vẫn ra
   * đúng đoạn cũ, người học mới tập theo được.
   */
  solo: (take: number) => readonly TimelineEvent[]
  /** Độ dài một lượt vòng hợp âm, tính bằng phách. */
  loopLengthBeats: number
  form: SongForm
  /**
   * Phần đệm dùng riêng cho đoạn giang tấu, dựng trên **vòng hợp âm chính**.
   *
   * Bỏ trống thì lấy luôn `accompaniment`. Cần tách ra vì đoạn giang tấu không
   * chơi hợp âm lướt: câu solo đã bám vòng chính, mà tay đệm lại chơi hợp âm
   * lướt thì hai tay đánh nhau — tay trái vang `Bm7b5` trong khi tay phải chơi
   * nốt của `Cadd9`.
   *
   * Nói rộng hơn: hợp âm lướt là đồ trang trí cho **đoạn hát**. Vào giang tấu
   * thì phần đệm rút về khung hoà âm gốc để nhường chỗ cho ngẫu hứng.
   */
  interlude?: readonly TimelineEvent[]
  /**
   * Số lượt giang tấu đã dùng hết trước khi dựng bài này.
   *
   * Cần cho việc **phát lặp cả bài**: lần phát lại thứ hai phải nối tiếp số
   * lượt của lần thứ nhất, chứ không đếm lại từ 0 — không thì nghe lặp y
   * nguyên đúng cái đang muốn tránh.
   */
  takeOffset?: number
}

/**
 * Một mảnh dòng thời gian và chỗ nó được cắt ra từ vòng hợp âm gốc.
 *
 * Cần cái này để **tra ngược** từ vị trí đang phát về hợp âm nào đang vang.
 * Bài đã sắp lại thứ tự thì hai bên không còn chạy song song nữa: một đoạn có
 * thể chơi hai lần ở hai chỗ khác nhau, giang tấu chen vào giữa và lại chỉ
 * mượn bốn hợp âm — nên lấy vị trí phát chia dư cho độ dài vòng là ra sai chỗ.
 */
export interface TimeSegment {
  /** Mốc trên dòng thời gian đã sắp. */
  startBeat: number
  lengthBeats: number
  /** Mốc tương ứng trên vòng hợp âm gốc. */
  sourceBeat: number
}

export interface SongTimeline {
  events: TimelineEvent[]
  totalBeats: number
  sections: PlacedSection[]
  /** Bản đồ tra ngược về vòng hợp âm gốc, xếp theo thứ tự thời gian. */
  segments: TimeSegment[]
  /** Số lượt giang tấu bài này dùng hết, để lần phát sau nối tiếp. */
  soloTakes: number
}

/** Vị trí tương ứng trên vòng hợp âm gốc của một mốc đang phát. */
export function sourceBeatAt(
  segments: readonly TimeSegment[],
  beat: number,
): number | null {
  for (const segment of segments) {
    if (
      beat >= segment.startBeat &&
      beat < segment.startBeat + segment.lengthBeats
    ) {
      return segment.sourceBeat + (beat - segment.startBeat)
    }
  }

  return null
}

/**
 * Phách trên bài đã sắp, ứng với một mốc trên vòng hợp âm gốc.
 *
 * Bấm hợp âm trên bản lời là bấm **mốc gốc**; phát nhạc chạy trên dòng đã sắp
 * (điệp trước phiên, giang tấu chen giữa). Không đổi thì phát nhầm đoạn.
 * Ưu tiên đoạn có lời — giang tấu cũng mượn cùng mốc đó.
 */
export function arrangedBeatAt(
  segments: readonly TimeSegment[],
  sourceBeat: number,
  sections: readonly PlacedSection[] = [],
): number | null {
  let interludeHit: number | null = null

  for (const segment of segments) {
    const from = segment.sourceBeat
    const to = from + segment.lengthBeats
    if (sourceBeat < from || sourceBeat >= to) continue

    const at = segment.startBeat + (sourceBeat - from)
    const interlude = sections.some(
      (section) =>
        section.kind === 'interlude' &&
        at >= section.startBeat &&
        at < section.startBeat + section.lengthBeats,
    )
    if (!interlude) return at
    interludeHit ??= at
  }

  return interludeHit
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

/** Đáy của nốt bass nhân đôi — dưới nữa thì nghe đục chứ không dày thêm. */
const OCTAVE_BASS_FLOOR = 28

/**
 * Phần đệm dùng riêng cho đoạn giang tấu: **bỏ hẳn phần tay phải**.
 *
 * Đây là điểm khác biệt lớn nhất giữa đoạn hát và đoạn giang tấu, và cũng là
 * chỗ bản đầu làm sai: nó cho nguyên phần đệm hai tay chạy tiếp rồi chồng câu
 * solo lên trên, thành ra tay phải vừa quạt hợp âm vừa chạy giai điệu — không
 * ai chơi vậy được, và nghe cũng đục.
 *
 * Đối chiếu hai bản ký âm thì thấy rõ: ở đoạn giang tấu, **tay trái vẫn làm
 * việc y như cũ** (số lần vào mỗi ô nhịp gần như không đổi — 3.3 lên 3.4 ở
 * bài *Mơ*, 5.1 lên 5.5 ở *Hồng Kông 1*), còn **tay phải bỏ hẳn mẫu đệm** để
 * lên tầm cao chơi giai điệu (trần cao độ tay phải nhảy từ khoảng 76 lên
 * 95-100). Tức là chỉ có một tay đổi việc, không phải cả hai.
 *
 * Bù lại, tay trái **nhân đôi nốt bass xuống một quãng tám** cho chắc nền —
 * bề rộng tay trái ở đoạn giang tấu rộng hơn hẳn đoạn hát (bài *Mơ*: 15.9 lên
 * 20.6 nửa cung), và ô nhịp 41 của bài đó bass đúng là chồng quãng tám `A1+A2`.
 */
/**
 * Nốt tay trái nằm hẳn trong vùng tay phải thì **nhãn tay ấy sai**, không phải
 * cao độ sai.
 *
 * Người dùng chụp được cảnh này: giữa câu solo tay phải có mấy nốt mang màu tay
 * trái đứng ở Sol quãng tám 4. Không bàn tay trái nào vừa giữ bass Rê quãng tám
 * 2 vừa với lên đó, và trên bản nhạc luyện ngón thì nó chỉ sai một ngón tay.
 *
 * Quét mọi điệu, bốn giọng, ba tầng tiếng — đệm hát, giang tấu, walking bass —
 * không tầng nào hiện tại sinh ra nốt như vậy; trần tay trái khoá ở Sol quãng
 * tám 3 và mọi đường đều tôn trọng nó. Nhưng luật thì rõ dù thủ phạm chưa rõ,
 * nên chặn ở chỗ mọi tầng đổ về thay vì canh từng tầng một.
 *
 * Chỉ đổi **nhãn tay**, không đổi cao độ: ai đặt nốt lên đó là cố ý cho nó vang
 * ở đó, chỉ có điều đó là việc của tay phải. Và chỉ đổi khi **cả cụm** nằm trên
 * trần — cụm có nốt trầm thì vẫn là tay trái thật, dời nhãn đi là hỏng bè trầm.
 */
export function fixHandByRegister(
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  return events.map((event) =>
    event.hand === 'left' && Math.min(...event.notes) > LEFT_HAND_HIGH
      ? { ...event, hand: 'right' as const }
      : event,
  )
}

export function interludeAccompaniment(
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  return events
    .filter((event) => event.hand === 'left')
    .map((event) => {
      const lowest = Math.min(...event.notes)
      const doubled = lowest - 12

      return doubled >= OCTAVE_BASS_FLOOR
        ? { ...event, notes: [doubled, ...event.notes] }
        : event
    })
}

/**
 * Dựng dòng thời gian cho cả bài theo cấu trúc đã chọn.
 *
 * Mỗi lượt lặp đều có phần đệm; phần giai điệu thì tuỳ đoạn — đoạn có lời
 * nhận câu fill, đoạn giang tấu nhận câu solo.
 */
export function buildSongTimeline(options: BuildSongOptions): SongTimeline {
  const {
    accompaniment,
    fills,
    solo,
    loopLengthBeats,
    form,
    interlude,
    takeOffset = 0,
  } = options

  const events: TimelineEvent[] = []
  const sections: PlacedSection[] = []
  const segments: TimeSegment[] = []
  let cursor = 0

  // Dựng sẵn một lần, đỡ phải lọc lại ở mỗi lượt lặp.
  const forInterlude = interludeAccompaniment(interlude ?? accompaniment)

  /*
    Đếm **liên tục qua cả bài**, không đếm lại từ đầu ở mỗi đoạn. Nhờ vậy lượt
    giang tấu thứ hai của đoạn sau vẫn khác lượt thứ hai của đoạn trước.
  */
  let take = takeOffset
  let fillTake = takeOffset

  for (const section of form.sections) {
    const lengthBeats = section.loops * loopLengthBeats
    const isInterlude = section.kind === 'interlude'
    sections.push({ kind: section.kind, startBeat: cursor, lengthBeats })

    for (let loop = 0; loop < section.loops; loop += 1) {
      const offset = cursor + loop * loopLengthBeats

      // Luồng này lặp nguyên vòng nên mọi lượt đều tra về đầu vòng.
      segments.push({
        startBeat: offset,
        lengthBeats: loopLengthBeats,
        sourceBeat: 0,
      })

      events.push(
        ...shift(isInterlude ? forInterlude : accompaniment, offset),
      )

      if (isInterlude) {
        events.push(...shift(solo(take), offset))
        take += 1
      } else {
        events.push(
          ...shift(
            typeof fills === 'function' ? fills(fillTake) : fills,
            offset,
          ),
        )
        fillTake += 1
      }
    }

    cursor += lengthBeats
  }

  return {
    events: fixHandByRegister(events).sort((a, b) => a.startBeat - b.startBeat),
    totalBeats: cursor,
    sections,
    segments,
    soloTakes: take - takeOffset,
  }
}
