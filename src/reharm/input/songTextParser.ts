import type { ParsedChord } from '../types'
import { parseChordToken } from './chordInputParser'

/**
 * Đọc lời bài hát có gắn hợp âm.
 *
 * Chỉ nhận **đúng hai định dạng**, không đoán mò thêm. Đây là quyết định có ý
 * thức: text người dùng dán vào từ các trang hợp âm rất lộn xộn — khoảng trắng
 * lẫn tab, ký tự full-width, dòng nhạc cụ không có lời. Cố đoán mọi kiểu thì
 * sai âm thầm, mà sai âm thầm ở chỗ này nghĩa là cả bài lệch hợp âm.
 *
 * 1. **Hai dòng canh cột** — dòng hợp âm nằm trên dòng lời, canh theo khoảng
 *    trắng. Đây là định dạng các trang hợp âm Việt Nam đang dùng.
 *
 *    ```
 *    [Phiên khúc]
 *       Am7          D9sus4
 *    Ánh nắng chiều nay rơi xuống phố
 *    ```
 *
 * 2. **ChordPro** — hợp âm đặt trong ngoặc vuông ngay giữa dòng lời:
 *    `Ánh nắng [Am7]chiều nay [D9sus4]rơi xuống phố`
 *
 * Kết quả luôn kèm **cảnh báo** cho những cụm không đọc được, để người dùng
 * xem lại trước khi dùng chứ không nuốt lỗi.
 */

/** Một hợp âm đã neo vào vị trí của nó trên dòng lời. */
export interface ChordAnchor {
  /** Đúng cụm người dùng gõ, giữ lại để hiện khi không đọc được. */
  source: string
  /** Vị trí ký tự trên dòng lời mà hợp âm rơi vào. */
  charOffset: number
  /** Hợp âm đã đọc được; rỗng nghĩa là không đọc được. */
  chord: ParsedChord | null
}

export interface SongLine {
  lyric: string
  chords: ChordAnchor[]
}

/**
 * Loại đoạn.
 *
 * Nhận cả tên tiếng Việt lẫn tiếng Anh vì text dán vào từ đủ nguồn. Không nhận
 * ra thì xếp vào `other` và **giữ nguyên tên** người dùng gõ — đừng ép một
 * đoạn tên lạ thành phiên khúc.
 */
export type SongSectionKind =
  | 'intro'
  | 'verse'
  | 'prechorus'
  | 'chorus'
  | 'bridge'
  | 'interlude'
  | 'outro'
  | 'other'

export interface SongSection {
  /** Tên đúng như trong text, ví dụ `Điệp khúc 2`. */
  name: string
  kind: SongSectionKind
  lines: SongLine[]
}

export type SongFormat = 'two-line' | 'chordpro' | 'chords-only'

export interface ParsedSong {
  format: SongFormat
  sections: SongSection[]
  /** Toàn bộ hợp âm theo thứ tự xuất hiện, để nạp vào phần tái hoà âm. */
  chords: ParsedChord[]
  /** Cụm không đọc được thành hợp âm, kèm chỗ nó nằm. */
  warnings: string[]
}

/** Từ khoá nhận diện tên đoạn, tiếng Việt trước vì đó là nguồn chính. */
const SECTION_KEYWORDS: readonly (readonly [SongSectionKind, readonly string[]])[] =
  [
    ['prechorus', ['tiền điệp khúc', 'pre-chorus', 'prechorus', 'pre chorus']],
    ['chorus', ['điệp khúc', 'chorus', 'refrain', 'đk']],
    ['verse', ['phiên khúc', 'verse', 'lời', 'pk']],
    ['interlude', ['giang tấu', 'interlude', 'solo', 'dạo giữa']],
    ['bridge', ['bridge', 'cầu nối']],
    ['intro', ['intro', 'dạo đầu', 'mở đầu']],
    ['outro', ['outro', 'kết', 'ending', 'coda']],
  ]

function sectionKindOf(name: string): SongSectionKind {
  const lower = name.toLowerCase()
  for (const [kind, keywords] of SECTION_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) return kind
  }
  return 'other'
}

/** Cụm này đọc được thành hợp âm không. */
function asChord(token: string): ParsedChord | null {
  const parsed = parseChordToken(token)
  return typeof parsed === 'string' ? null : parsed
}

/**
 * Dòng chỉ toàn tên đoạn, ví dụ `[Điệp khúc]` hay `Verse 2:`.
 *
 * Phải kiểm **không đọc được thành hợp âm** trước, vì ở định dạng ChordPro thì
 * `[Am]` cũng nằm trong ngoặc vuông y hệt.
 */
function sectionHeaderOf(line: string): string | null {
  const trimmed = line.trim()

  const bracket = /^\[(.+)\]$/.exec(trimmed)
  if (bracket) return asChord(bracket[1]) ? null : bracket[1].trim()

  const colon = /^([\p{L}\p{N} ]{2,30}):$/u.exec(trimmed)
  if (colon && sectionKindOf(colon[1]) !== 'other') return colon[1].trim()

  return null
}

/** Cụm chữ kèm vị trí cột của nó trên dòng. */
function tokensWithColumns(line: string): { text: string; column: number }[] {
  const tokens: { text: string; column: number }[] = []
  const pattern = /\S+/g

  let match = pattern.exec(line)
  while (match) {
    tokens.push({ text: match[0], column: match.index })
    match = pattern.exec(line)
  }

  return tokens
}

/** Dòng này toàn hợp âm, tức là dòng hợp âm của định dạng hai dòng. */
function isChordLine(line: string): boolean {
  const tokens = tokensWithColumns(line)
  if (tokens.length === 0) return false
  return tokens.every((token) => asChord(token.text) !== null)
}

/** Có dấu hiệu ChordPro không: hợp âm nằm trong ngoặc vuông giữa dòng. */
function looksLikeChordPro(lines: readonly string[]): boolean {
  return lines.some((line) => {
    if (sectionHeaderOf(line) !== null) return false
    const matches = line.match(/\[([^\]]+)\]/g)
    if (!matches) return false
    return matches.some((raw) => asChord(raw.slice(1, -1)) !== null)
  })
}

/** Đọc một dòng ChordPro thành lời trơn kèm các hợp âm đã neo vị trí. */
function parseChordProLine(line: string, warnings: string[]): SongLine {
  const chords: ChordAnchor[] = []
  let lyric = ''
  let index = 0

  while (index < line.length) {
    if (line[index] !== '[') {
      lyric += line[index]
      index += 1
      continue
    }

    const close = line.indexOf(']', index)
    if (close === -1) {
      lyric += line.slice(index)
      break
    }

    const source = line.slice(index + 1, close)
    const chord = asChord(source)
    if (!chord) warnings.push(`Không đọc được hợp âm "${source}"`)

    chords.push({ source, charOffset: lyric.length, chord })
    index = close + 1
  }

  return { lyric, chords }
}

/**
 * Ghép một dòng hợp âm với dòng lời ngay dưới nó.
 *
 * Vị trí cột của cụm hợp âm được dùng thẳng làm vị trí ký tự trên dòng lời.
 * Cách này chỉ đúng khi text dùng phông đều — mà đó chính là cách các trang
 * hợp âm trình bày, nên chấp nhận được. Cột vượt quá độ dài dòng lời thì kẹp
 * về cuối dòng.
 */
function pairChordLine(
  chordLine: string,
  lyric: string,
  warnings: string[],
): SongLine {
  const chords = tokensWithColumns(chordLine).map((token) => {
    const chord = asChord(token.text)
    if (!chord) warnings.push(`Không đọc được hợp âm "${token.text}"`)

    return {
      source: token.text,
      charOffset: Math.min(token.column, lyric.length),
      chord,
    }
  })

  return { lyric, chords }
}

export function parseSongText(text: string): ParsedSong {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const warnings: string[] = []
  const sections: SongSection[] = []

  /** Đoạn đang gom; chưa gặp tên đoạn nào thì gom vào một đoạn không tên. */
  let current: SongSection = { name: '', kind: 'other', lines: [] }
  const pushCurrent = () => {
    if (current.lines.length > 0 || current.name !== '') sections.push(current)
  }

  const chordPro = looksLikeChordPro(lines)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    const header = sectionHeaderOf(line)
    if (header !== null) {
      pushCurrent()
      current = { name: header, kind: sectionKindOf(header), lines: [] }
      continue
    }

    if (line.trim().length === 0) continue

    if (chordPro) {
      current.lines.push(parseChordProLine(line, warnings))
      continue
    }

    if (!isChordLine(line)) {
      // Dòng lời không có hợp âm nào ở trên.
      current.lines.push({ lyric: line.trimEnd(), chords: [] })
      continue
    }

    /*
      Dòng hợp âm: lấy dòng ngay sau làm lời, trừ khi dòng đó lại là dòng hợp
      âm hoặc tên đoạn — lúc đó đây là đoạn nhạc không lời.
    */
    const next = lines[index + 1]
    const nextIsLyric =
      next !== undefined &&
      next.trim().length > 0 &&
      sectionHeaderOf(next) === null &&
      !isChordLine(next)

    current.lines.push(pairChordLine(line, nextIsLyric ? next.trimEnd() : '', warnings))
    if (nextIsLyric) index += 1
  }

  pushCurrent()

  const chords = sections
    .flatMap((section) => section.lines)
    .flatMap((line) => line.chords)
    .map((anchor) => anchor.chord)
    .filter((chord): chord is ParsedChord => chord !== null)

  const hasLyric = sections.some((section) =>
    section.lines.some((line) => line.lyric.trim().length > 0),
  )

  return {
    format: chordPro ? 'chordpro' : hasLyric ? 'two-line' : 'chords-only',
    sections,
    chords,
    warnings,
  }
}

/** Chèn một bản sao hợp âm ngay sau vị trí `at`. */
export function insertChordAfter(
  song: ParsedSong,
  at: number,
  chord: ParsedChord,
): ParsedSong {
  let n = 0
  const sections = song.sections.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({
      ...line,
      chords: line.chords.flatMap((anchor) => {
        if (anchor.chord === null) return [anchor]
        const i = n
        n += 1
        return i === at
          ? [
              anchor,
              {
                source: chord.source,
                charOffset: anchor.charOffset,
                chord,
              },
            ]
          : [anchor]
      }),
    })),
  }))
  return {
    ...song,
    sections,
    chords: [
      ...song.chords.slice(0, at + 1),
      chord,
      ...song.chords.slice(at + 1),
    ],
  }
}
