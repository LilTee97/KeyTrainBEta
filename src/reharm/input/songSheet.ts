import type { ParsedChord } from '../types'
import type {
  ParsedSong,
  SongLine,
  SongSection,
  SongSectionKind,
} from './songTextParser'

/**
 * Gắn hợp âm **đã tái hoà âm** trở lại đúng vị trí của nó trên lời bài hát.
 *
 * Bộ tái hoà âm làm việc trên một mảng hợp âm phẳng, còn lời bài hát thì neo
 * hợp âm theo từng chữ. Module này nối hai thứ lại.
 *
 * Dùng vòng **`colored`** chứ không dùng vòng đã chèn hợp âm lướt: `colored`
 * giữ đúng số lượng và thứ tự hợp âm gốc nên khớp một-một với các neo trên
 * lời. Hợp âm lướt thì không có chữ nào để neo vào — nó nằm ở nửa sau ô nhịp,
 * giữa hai chữ — nên bản nhạc chép tay cũng không ghi nó lên đầu chữ.
 */

/** Một neo hợp âm sau khi đã tái hoà âm. */
export interface SheetAnchor {
  /** Ký hiệu hiện lên trên lời. */
  symbol: string
  charOffset: number
  /**
   * Vị trí của hợp âm này trong cả bài, đếm từ 0.
   *
   * Dùng để tô sáng khi phát: bộ phát biết đang chơi tới hợp âm thứ mấy.
   * Rỗng nghĩa là cụm này không đọc được thành hợp âm.
   */
  chordIndex: number | null
  /** Không đọc được thì vẫn hiện, nhưng đánh dấu để người dùng biết. */
  broken: boolean
  /**
   * Hợp âm **lướt** chèn thêm, không thuộc vòng hợp âm gốc.
   *
   * Nó không neo vào chữ nào — chỗ của nó là nửa sau ô nhịp, giữa hai chữ —
   * nên hiện ngay trước hợp âm mà nó dẫn tới, và tô màu khác để phân biệt với
   * hợp âm chính.
   */
  passing?: boolean
  /** Cùng gốc ngân nhiều ô — hiện đủ chuỗi `Cadd2 → CM7`. */
  heldLabel?: string
  /** Một nốt trong dãy cùng gốc đang xoay màu. */
  holdRun?: boolean
}

export interface SheetLine {
  lyric: string
  anchors: SheetAnchor[]
}

export interface SheetSection {
  name: string
  kind: SongSection['kind']
  lines: SheetLine[]
}

export interface SongSheet {
  sections: SheetSection[]
  /** Tổng số hợp âm đọc được, để đối chiếu với vòng đã tái hoà âm. */
  chordCount: number
}

/**
 * Dựng bản nhạc từ lời đã đọc và vòng hợp âm đã tái hoà âm.
 *
 * `reharmonized` phải cùng số lượng và cùng thứ tự với `song.chords`. Lệch số
 * lượng thì giữ nguyên hợp âm gốc thay vì gán bừa — gán lệch một chỗ là lệch
 * hết phần còn lại của bài.
 */
export function buildSongSheet(
  song: ParsedSong,
  reharmonized: readonly ParsedChord[],
  /**
   * Vòng đã chèn hợp âm lướt, để hiện luôn chúng lên bản nhạc.
   *
   * Bỏ trống thì chỉ hiện hợp âm chính. Hợp âm lướt được gắn vào **ngay trước
   * hợp âm mà nó dẫn tới**, vì chỗ thật của nó là nửa sau ô nhịp — giữa hai
   * chữ, không có chữ nào để neo.
   */
  withPassing?: readonly ParsedChord[],
): SongSheet {
  const aligned = reharmonized.length === song.chords.length
  const passingBefore = passingByTarget(withPassing)

  // Đếm riêng, vì chỉ neo nào đọc được mới có mặt trong vòng hợp âm.
  let chordIndex = 0

  const convertLine = (line: SongLine): SheetLine => {
    const raw = line.chords.flatMap((anchor): SheetAnchor[] => {
      if (anchor.chord === null) {
        return [
          {
            symbol: anchor.source,
            charOffset: anchor.charOffset,
            chordIndex: null,
            broken: true,
          },
        ]
      }

      const index = chordIndex
      chordIndex += 1

      const lead = (passingBefore[index] ?? []).map(
        (symbol): SheetAnchor => ({
          symbol,
          charOffset: anchor.charOffset,
          chordIndex: null,
          broken: false,
          passing: true,
        }),
      )

      return [
        ...lead,
        {
          symbol: aligned
            ? (reharmonized[index]?.symbol ?? anchor.chord.symbol)
            : anchor.chord.symbol,
          charOffset: anchor.charOffset,
          chordIndex: index,
          broken: false,
          heldLabel: reharmonized[index]?.heldLabel,
          holdRun: reharmonized[index]?.holdRun,
        },
      ]
    })
    const anchors: SheetAnchor[] = []
    for (const anchor of raw) {
      const prev = anchors[anchors.length - 1]
      if (
        prev &&
        !anchor.passing &&
        !prev.passing &&
        prev.symbol === anchor.symbol
      ) {
        continue
      }
      anchors.push(anchor)
    }
    return { lyric: line.lyric, anchors }
  }

  return {
    sections: song.sections.map((section) => ({
      name: section.name,
      kind: section.kind,
      lines: section.lines.map(convertLine),
    })),
    chordCount: chordIndex,
  }
}

/**
 * Gom hợp âm lướt theo **hợp âm chính mà nó dẫn tới**.
 *
 * Vòng đã chèn xen kẽ hợp âm chính và hợp âm lướt; đi một lượt là biết mỗi
 * hợp âm chính có bao nhiêu hợp âm lướt đứng ngay trước nó.
 */
function passingByTarget(
  withPassing: readonly ParsedChord[] | undefined,
): Record<number, string[]> {
  const table: Record<number, string[]> = {}
  if (!withPassing) return table

  let mainIndex = 0
  let pending: string[] = []

  for (const chord of withPassing) {
    if (chord.passing) {
      pending.push(chord.symbol)
      continue
    }

    if (pending.length > 0) {
      table[mainIndex] = pending
      pending = []
    }
    mainIndex += 1
  }

  return table
}

/**
 * Người dùng tự đánh dấu một khoảng dòng là đoạn gì.
 *
 * Bộ đọc tự nhận tên đoạn từ text, nhưng nhiều bài dán vào **không ghi tên
 * đoạn** hoặc ghi theo kiểu app không đoán ra. Cho người dùng quét chuột rồi
 * chỉ định thẳng vừa chắc chắn hơn đoán, vừa là cách duy nhất để KeyTrain biết
 * chính xác chỗ nào đặt đoạn giang tấu.
 */
export interface SectionMark {
  /** Chỉ số dòng toàn bài, đếm từ 0 xuyên qua mọi đoạn. */
  from: number
  to: number
  kind: SongSectionKind
}

/** Tên hiển thị mặc định cho từng loại đoạn người dùng chọn. */
export const SECTION_KIND_LABELS: Record<SongSectionKind, string> = {
  intro: 'Dạo đầu',
  verse: 'Phiên khúc',
  prechorus: 'Tiền điệp khúc',
  chorus: 'Điệp khúc',
  bridge: 'Cầu nối',
  interlude: 'Giang tấu',
  outro: 'Kết',
  other: 'Đoạn khác',
}

/**
 * Màu riêng cho từng loại đoạn.
 *
 * Bài hát dài thì nhìn vào toàn chữ như nhau, không biết đang ở đoạn nào. Cho
 * mỗi loại một màu thì lướt mắt là thấy ngay bố cục — nhất là sau khi người
 * dùng tự quét chia đoạn.
 *
 * Chọn màu phải né hai màu của hợp âm — **vàng gold** cho hợp âm chính và
 * **xanh ngọc** cho hợp âm lướt — vì hai hàng nằm sát nhau, trùng màu là không
 * phân biệt được cái nào nói về cái gì.
 *
 * Phiên khúc và điệp khúc lấy hai màu tách nhau xa nhất và nổi rõ nhất trên
 * nền tối, vì đó là hai đoạn chiếm gần hết bài: **xanh trời** cho phiên khúc và
 * **hồng tím** cho điệp khúc. Bản đầu để phiên khúc màu chữ mặc định nên không
 * nổi gì, còn điệp khúc lại trùng đúng màu vàng của hợp âm chính.
 */
export const SECTION_KIND_COLORS: Record<
  SongSectionKind,
  { text: string; border: string; lyric: string }
> = {
  intro: {
    text: 'text-slate-400',
    border: 'border-slate-400/40',
    lyric: 'text-slate-300',
  },
  verse: {
    text: 'text-sky-300',
    border: 'border-sky-300/50',
    lyric: 'text-sky-200',
  },
  prechorus: {
    text: 'text-lime-300',
    border: 'border-lime-300/50',
    lyric: 'text-lime-200',
  },
  chorus: {
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-300/50',
    lyric: 'text-fuchsia-200',
  },
  bridge: {
    text: 'text-violet-300',
    border: 'border-violet-300/40',
    lyric: 'text-violet-200',
  },
  interlude: {
    text: 'text-teal-key',
    border: 'border-teal-key/40',
    lyric: 'text-teal-200',
  },
  outro: {
    text: 'text-rose-300',
    border: 'border-rose-300/40',
    lyric: 'text-rose-200',
  },
  other: { text: 'text-dim', border: 'border-line', lyric: 'text-cream' },
}

/** Một dòng đã tách khỏi đoạn, kèm số thứ tự toàn bài. */
export interface FlatLine {
  line: SheetLine
  index: number
  name: string
  kind: SongSectionKind
}

/** Trải phẳng mọi dòng của bản nhạc, đánh số liên tục xuyên các đoạn. */
export function flattenLines(sheet: SongSheet): FlatLine[] {
  const flat: FlatLine[] = []

  for (const section of sheet.sections) {
    for (const line of section.lines) {
      flat.push({
        line,
        index: flat.length,
        name: section.name,
        kind: section.kind,
      })
    }
  }

  return flat
}

/**
 * Chia lại đoạn theo đánh dấu của người dùng.
 *
 * Dòng nằm trong một khoảng đã đánh dấu thì lấy loại đoạn của khoảng đó; dòng
 * còn lại giữ nguyên đoạn mà bộ đọc nhận ra. Sau đó các dòng liền nhau **cùng
 * nhãn** được gom lại thành một đoạn.
 *
 * Đánh dấu sau đè lên đánh dấu trước ở chỗ chồng nhau, để người dùng sửa lại
 * chỉ bằng cách quét đè lên chứ không phải xoá trước.
 */
export function resectionSheet(
  sheet: SongSheet,
  marks: readonly SectionMark[],
): SongSheet {
  if (marks.length === 0) return sheet

  const flat = flattenLines(sheet)

  const labelled = flat.map((entry) => {
    // Duyệt xuôi nên đánh dấu đứng sau tự nhiên ghi đè cái đứng trước.
    let kind = entry.kind
    let name = entry.name

    for (const mark of marks) {
      if (entry.index >= mark.from && entry.index <= mark.to) {
        kind = mark.kind
        name = SECTION_KIND_LABELS[mark.kind]
      }
    }

    return { ...entry, kind, name }
  })

  const sections: SheetSection[] = []
  for (const entry of labelled) {
    const last = sections[sections.length - 1]

    if (last && last.name === entry.name && last.kind === entry.kind) {
      last.lines.push(entry.line)
      continue
    }

    sections.push({ name: entry.name, kind: entry.kind, lines: [entry.line] })
  }

  return { sections, chordCount: sheet.chordCount }
}

/** Khoảng hợp âm mà một đoạn chiếm, tính theo số thứ tự hợp âm chính. */
export interface SectionChordRange {
  kind: SongSectionKind
  name: string
  /** Hợp âm đầu và hợp âm cuối của đoạn, đếm từ 0. */
  from: number
  to: number
}

/**
 * Mỗi đoạn chiếm những hợp âm nào.
 *
 * Đây là cầu nối giữa **lời bài hát** và **dòng thời gian**: đoạn được chia
 * theo dòng lời, còn nhạc thì chạy theo hợp âm. Nối được hai thứ nhờ mỗi neo
 * hợp âm đã mang sẵn số thứ tự của nó trong cả bài.
 *
 * Đoạn không có hợp âm nào bị bỏ qua — thường là dòng tiêu đề hoặc lời không
 * kèm hợp âm, không có gì để chơi.
 */
/** Gắn dạo đầu / kết bài lên bản lời — không đánh số vào vòng chính. */
export function attachPhraseToSheet(
  sheet: SongSheet,
  intro: readonly string[],
  outro: readonly string[],
): SongSheet {
  const sections = [...sheet.sections]
  if (intro.length > 0) {
    sections.unshift({
      name: 'Dạo đầu',
      kind: 'intro',
      lines: [
        {
          lyric: '',
          anchors: intro.map((symbol, at) => ({
            symbol,
            charOffset: at * 10,
            chordIndex: null,
            broken: false,
          })),
        },
      ],
    })
  }
  if (outro.length > 0) {
    sections.push({
      name: 'Kết bài',
      kind: 'outro',
      lines: [
        {
          lyric: '',
          anchors: outro.map((symbol, at) => ({
            symbol,
            charOffset: at * 10,
            chordIndex: null,
            broken: false,
          })),
        },
      ],
    })
  }
  return { ...sheet, sections }
}

export function sectionChordRanges(sheet: SongSheet): SectionChordRange[] {
  const ranges: SectionChordRange[] = []

  for (const section of sheet.sections) {
    const indices = section.lines
      .flatMap((line) => line.anchors)
      .map((anchor) => anchor.chordIndex)
      .filter((index): index is number => index !== null)

    if (indices.length === 0) continue

    ranges.push({
      kind: section.kind,
      name: section.name,
      from: Math.min(...indices),
      to: Math.max(...indices),
    })
  }

  return ranges
}

/**
 * Xếp các ký hiệu hợp âm thành một dòng chữ canh cột trên dòng lời.
 *
 * Hợp âm sau khi tái hoà âm thường **dài hơn** hợp âm gốc (`C` thành `Cadd9`),
 * nên có thể đè lên nhau. Đẩy sang phải cho tới khi hết chồng, chấp nhận lệch
 * cột một chút — thà lệch còn hơn mất chữ.
 */
export function layoutAnchors(
  anchors: readonly SheetAnchor[],
): { anchor: SheetAnchor; column: number }[] {
  const placed: { anchor: SheetAnchor; column: number }[] = []
  let cursor = 0

  for (const anchor of anchors) {
    const column = Math.max(anchor.charOffset, cursor)
    placed.push({ anchor, column })
    // Chừa một khoảng trắng giữa hai ký hiệu cho khỏi dính nhau.
    cursor = column + anchor.symbol.length + 1
  }

  return placed
}

/**
 * Các hợp âm mà một câu hát **kết thúc** ở đó — chỗ ca sĩ ngắt nghỉ lấy hơi.
 *
 * Đây là chỗ chêm câu fill. `phongcachdemhatkhabu.md` phần 15 định nghĩa câu
 * fill đúng bằng chữ *"những câu nhạc chơi để lấp vào khoảng trống lúc ca sĩ
 * ngắt nghỉ lấy hơi"*, nên chỗ chêm do lời bài hát quyết định chứ không do
 * một con số đếm đều — xem `soloGenerator.fillPositions`.
 *
 * Lấy hợp âm **cuối** mỗi dòng lời, vì khoảng trống nằm ở đuôi dòng: hát hết
 * chữ cuối rồi mới nghỉ. Dòng không có lời thì bỏ qua — đó là dòng chỉ ghi
 * hợp âm, không có ai hát nên không có hơi nào để lấy.
 *
 * Hợp âm lướt cũng bỏ qua: nó không có chỗ riêng trong vòng hợp âm chính nên
 * không đánh số cùng hệ với những chỗ khác.
 */
/**
 * Những hợp âm mà **giọng hát đang vang**, suy từ lời đã dán.
 *
 * Nhìn ngược với `breathChords`: hàm kia trả về chỗ *hết* một câu hát, hàm này
 * trả về chỗ giọng còn đang chiếm. Cây đàn không lót vào những ô này, vì câu lót
 * vốn để lấp khoảng trống chứ không phải để chen vào giọng.
 *
 * Ô cuối mỗi dòng lời **không** tính là đang hát: chính đuôi ô đó là chỗ ca sĩ
 * buông ra lấy hơi, và đó là chỗ câu lót thuộc về.
 */
export function singingChords(sheet: SongSheet): Set<number> {
  const breaths = breathChords(sheet)
  const singing = new Set<number>()

  for (const section of sheet.sections) {
    for (const line of section.lines) {
      if (line.lyric.trim().length === 0) continue

      for (const anchor of line.anchors) {
        if (anchor.passing || anchor.broken || anchor.chordIndex === null) {
          continue
        }
        if (!breaths.has(anchor.chordIndex)) singing.add(anchor.chordIndex)
      }
    }
  }

  return singing
}

export function breathChords(sheet: SongSheet): Set<number> {
  const found = new Set<number>()

  for (const section of sheet.sections) {
    for (const line of section.lines) {
      if (line.lyric.trim().length === 0) continue

      let last: number | null = null
      for (const anchor of line.anchors) {
        if (anchor.passing || anchor.broken || anchor.chordIndex === null) {
          continue
        }
        if (last === null || anchor.chordIndex > last) last = anchor.chordIndex
      }

      if (last !== null) found.add(last)
    }
  }

  return found
}
