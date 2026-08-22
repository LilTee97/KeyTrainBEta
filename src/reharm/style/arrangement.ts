import type { EndingMode } from './endingChord'
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
 * Nghỉ mặc định sau đoạn giang tấu: **không nghỉ thêm**.
 *
 * Chỗ nghỉ đã nằm sẵn trong cụm quay đầu — nửa sau ô nhịp thứ hai để trống cho
 * người hát lấy hơi. Cộng thêm một khoảng nữa ở đây thì thành nghỉ hai lần.
 *
 * Đặt thành trọn một ô nhịp thì **bỏ hẳn cụm quay đầu**: cách nhau cả ô im
 * lặng thì câu dẫn chẳng dẫn vào đâu.
 */
export const DEFAULT_REST_AFTER = 0

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
  | {
      type: 'section'
      source: number
      /**
       * Đoạn này là **đoạn kết bài**.
       *
       * Vòng hợp âm vẫn chạy bình thường; chỉ hợp âm cuối được đổi màu — xem
       * `endingChord.ts`. Bỏ trống nghĩa là đoạn thường.
       */
      ending?: EndingMode
    }
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
  /**
   * Đoạn dạo đầu hoặc đoạn kết, do bộ não PianoBrain soạn.
   *
   * Khác hẳn hai loại trên ở một điểm: nó **không mượn vòng hợp âm nào của
   * bài**. Bài chỉ nói "chỗ này có một đoạn dạo dài bấy nhiêu phách"; nốt thì
   * lấy sẵn từ não qua `phrase` trong `BuildArrangedSongOptions`. Não không có
   * luật nào cho phép thì `phrase` trả rỗng, bước này không kêu tiếng nào, và
   * bài vẫn chạy bình thường.
   */
  | {
      type: 'intro'
      /** Dài mấy phách. Bỏ trống thì lấy đúng độ dài não soạn ra. */
      lengthBeats?: number
      /**
       * Im mấy phách sau đoạn dạo đầu, trước khi bài hát vào.
       *
       * Hai lối đệm đều có người dùng thật: **vào ngay** (0 phách) thì hợp âm
       * báo nối thẳng vào câu hát, gọn và dứt khoát; **nghỉ một phách** thì
       * chừa cho ca sĩ một nhịp lấy hơi. Bỏ trống là vào ngay.
       */
      restAfter?: number
    }
  | {
      type: 'outro'
      lengthBeats?: number
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

  if (step.type === 'intro') return 'Dạo đầu (não soạn)'
  if (step.type === 'outro') return 'Kết bài (não soạn)'

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
  /*
    Đoạn dạo không mượn vòng của đoạn nào, nên nó không phải "đoạn vang lên
    tiếp theo" — nhìn xuyên qua nó tới bước sau nữa.
  */
  if (step.type === 'intro' || step.type === 'outro') {
    return nextSection(steps, index + 1, sources)
  }
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

/** Đặt dòng thời gian (đã tính từ phách 0) vào vị trí mới. */
function place(
  events: readonly TimelineEvent[],
  offset: number,
  length: number,
): TimelineEvent[] {
  return events
    .filter(
      (event) =>
        event.startBeat >= -EPSILON && event.startBeat < length - EPSILON,
    )
    .map((event) => ({ ...event, startBeat: event.startBeat + offset }))
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
  fills:
    | readonly TimelineEvent[]
    | ((take: number) => readonly TimelineEvent[])
  solo: (take: number) => readonly TimelineEvent[]
  sources: readonly SourceSection[]
  steps: readonly ArrangementStep[]
  /**
   * Nốt cho đoạn dạo đầu và đoạn kết, do bên gọi hỏi bộ não.
   *
   * Để bên gọi lo chứ không gọi thẳng não ở đây, vì tệp này là chỗ **xếp thời
   * gian**, không phải chỗ biết về kho kiến thức. Trả `null` thì bước dạo bị bỏ
   * qua, và bài chạy như không có nó.
   */
  phrase?: (kind: 'intro' | 'outro') => {
    events: readonly TimelineEvent[]
    lengthBeats: number
  } | null
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
  ) => {
    startBeat: number
    lengthBeats: number
    /** Đệm dựng từ phách 0 của vòng — cùng pha bass với phiên/điệp. */
    events?: readonly TimelineEvent[]
    /** Solo trên đúng vòng ngắn, cũng từ phách 0. */
    solo?: (take: number, lastLoop?: boolean) => readonly TimelineEvent[]
    /** Đệm vòng cuối: hợp âm cuối ngắn hơn, phách chót là hợp âm hút. */
    lastEvents?: readonly TimelineEvent[]
    /** Phách chót vòng cuối: hợp âm hút, cả hai tay. */
    exit?: readonly TimelineEvent[]
  } | null
  /**
   * Hợp âm cuối của **đoạn kết bài**, đã đổi màu.
   *
   * Dựng ở bên gọi vì chỗ này chỉ làm việc với mốc phách, còn muốn đổi màu thì
   * phải đọc được hợp âm thật.
   */
  ending?: (
    source: SourceSection,
    mode: EndingMode,
  ) => TurnaroundTake | null
  /**
   * Hợp âm kết **đổi màu ở mỗi lượt lặp lại** của cùng một đoạn.
   *
   * Kỹ thuật thứ năm trong tài liệu phong cách (§11 mục 5, §1): *"đổi hợp âm
   * kết ở mỗi lượt lặp câu nhạc (vd Em7 → E7b9) để tránh nhàm chán"*. §15 ghi
   * một ví dụ dài hơn: lượt đầu kết bằng Am9, lượt sau đổi thành cụm bốn hợp
   * âm khép về đầu vòng.
   *
   * Chỉ đổi ở lượt **thứ hai trở đi**: lượt đầu là câu nhạc như bài vốn có, có
   * nghe nó trước thì lượt sau đổi đi mới thành *biến tấu*. Đổi ngay từ lượt
   * đầu thì không có gì để so, chỉ thành một hợp âm lạ.
   *
   * Đoạn đã đánh dấu kết bài thì bỏ qua — chỗ đó cần đóng lại, không cần hút
   * đi tiếp.
   */
  repeatEnding?: (
    source: SourceSection,
    next: SourceSection,
    /** Lượt thứ mấy của đoạn này, tính từ 0. */
    pass: number,
  ) => TurnaroundTake | null
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
    phrase,
    restAfterInterlude = 0,
    beatsPerMeasure = 4,
    ending,
    repeatEnding,
  } = options

  const forInterlude = interludeAccompaniment(interlude ?? accompaniment)

  const events: TimelineEvent[] = []
  const sections: SongTimeline['sections'] = []
  const segments: TimeSegment[] = []
  let cursor = 0
  let take = 0

  /** Đoạn nào đã chơi mấy lượt rồi, để biết lượt nào là lượt lặp lại. */
  const passes = new Map<number, number>()

  for (const [index, step] of steps.entries()) {
    if (step.type === 'section') {
      const source = sources[step.source]
      if (!source) continue

      const pass = passes.get(step.source) ?? 0
      passes.set(step.source, pass + 1)

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

      /*
        Đoạn kết bài: vòng hợp âm chạy bình thường tới hợp âm cuối, chỗ đó mới
        đổi màu. Cắt đúng phần cuối rồi thay bằng hợp âm đã đổi.
      */
      /*
        Đoạn kết bài đóng lại bằng hợp âm kết; đoạn lặp lại thì đổi hợp âm kết
        để lượt sau không nghe y hệt lượt trước. Hai việc loại trừ nhau — chỗ
        kết bài không cần hút đi đâu nữa.
      */
      const repeat =
        !step.ending && repeatEnding && pass > 0
          ? (() => {
              const after = nextSection(steps, index, sources)
              return after ? repeatEnding(source, after, pass) : null
            })()
          : null

      const close =
        (step.ending && ending ? ending(source, step.ending) : null) ?? repeat
      const plain = close
        ? Math.max(0, source.lengthBeats - close.beats)
        : source.lengthBeats

      events.push(
        ...slice(accompaniment, source.startBeat, plain, cursor),
        ...slice(
          typeof fills === 'function' ? fills(pass) : fills,
          source.startBeat,
          plain,
          cursor,
        ),
      )

      if (close) {
        for (const event of close.events) {
          events.push({ ...event, startBeat: event.startBeat + cursor + plain })
        }
      }

      cursor += source.lengthBeats
      continue
    }

    if (step.type === 'intro' || step.type === 'outro') {
      /*
        Đoạn dạo lấy nốt sẵn từ não. Não không có luật cho phép thì `phrase`
        trả `null`, bước này chiếm 0 phách và coi như không có — bài vẫn chạy.
      */
      const made = phrase?.(step.type)
      if (!made || made.events.length === 0) continue

      const lengthBeats = step.lengthBeats ?? made.lengthBeats
      sections.push({ kind: 'interlude', startBeat: cursor, lengthBeats })
      for (const event of made.events) {
        events.push({ ...event, startBeat: event.startBeat + cursor })
      }
      /*
        Chỗ nghỉ sau đoạn dạo đầu là **khoảng im**, không phải phần của đoạn:
        nó nằm ngoài `lengthBeats` nên không kéo dài đoạn dạo, chỉ đẩy chỗ bài
        hát bắt đầu ra sau.
      */
      cursor += lengthBeats + (step.type === 'intro' ? (step.restAfter ?? 0) : 0)
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
    const range = interludeRange?.(over, next) ?? {
      startBeat: over.startBeat,
      lengthBeats: over.lengthBeats,
    }
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

      const backing =
        last && range.lastEvents ? range.lastEvents : range.events
      events.push(
        ...(backing
          ? place(interludeAccompaniment(backing), at, length)
          : slice(forInterlude, range.startBeat, length, at)),
        ...(range.solo
          ? place(range.solo(take, last), at, length)
          : slice(solo(take), range.startBeat, length, at)),
      )
      take += 1

      if (last && turn) {
        for (const event of turn.events) {
          events.push({ ...event, startBeat: event.startBeat + at + played })
        }
      }
      if (last && range.exit && range.exit.length > 0) {
        events.push(...place(range.exit, at + loopBeats - 1, 2))
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
