import type { ParsedChord } from '../types'
import type { ParsedSong, SongLine, SongSection } from './songTextParser'

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
): SongSheet {
  const aligned = reharmonized.length === song.chords.length

  // Đếm riêng, vì chỉ neo nào đọc được mới có mặt trong vòng hợp âm.
  let chordIndex = 0

  const convertLine = (line: SongLine): SheetLine => ({
    lyric: line.lyric,
    anchors: line.chords.map((anchor) => {
      if (anchor.chord === null) {
        return {
          symbol: anchor.source,
          charOffset: anchor.charOffset,
          chordIndex: null,
          broken: true,
        }
      }

      const index = chordIndex
      chordIndex += 1

      return {
        symbol: aligned
          ? (reharmonized[index]?.symbol ?? anchor.chord.symbol)
          : anchor.chord.symbol,
        charOffset: anchor.charOffset,
        chordIndex: index,
        broken: false,
      }
    }),
  })

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
