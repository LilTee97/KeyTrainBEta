import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { parseNoteName, pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import type { ChordParseError, ChordSequence, ParsedChord } from '../types'

/**
 * Đọc chuỗi hợp âm người dùng gõ thành dữ liệu dùng được.
 *
 * Đây là một trong ba cách nhập của phần tái hòa âm (gõ tay, chạm bảng chọn,
 * nhập theo bậc), và cả ba đều đổ về cùng một kiểu `ChordSequence` — nhờ vậy
 * bộ máy tái hòa âm phía sau không cần biết người dùng nhập bằng cách nào.
 */

/**
 * Tách cụm theo khoảng trắng, dấu phẩy và vạch nhịp.
 *
 * Cố ý **không** tách theo dấu gạch ngang, vì gạch ngang là một cách viết hợp
 * âm thứ quen thuộc trong nhạc jazz: 'C-7' nghĩa là Cm7.
 */
const SEPARATOR = /[\s,|]+/

/** Nhận diện nốt gốc ở đầu cụm: chữ cái nốt kèm các dấu hoá. */
const ROOT_PATTERN = /^([A-Ga-g][#b♯♭]*)/

/**
 * Tách phần hợp âm và phần nốt bass ở một cụm dạng 'C/E'.
 *
 * Phải cẩn thận vì có tính chất hợp âm chứa sẵn dấu gạch chéo — '6/9'. Cách
 * phân biệt: chỉ coi là nốt bass khi phần sau dấu gạch chéo cuối cùng đọc
 * được thành tên nốt.
 */
function splitBass(token: string): { chordPart: string; bassPart?: string } {
  const slashAt = token.lastIndexOf('/')
  if (slashAt <= 0) return { chordPart: token }

  const after = token.slice(slashAt + 1)
  const parsed = parseNoteName(after)

  // 'C6/9' thì '9' không phải tên nốt nên giữ nguyên cả cụm làm tính chất.
  if (!parsed) return { chordPart: token }

  return { chordPart: token.slice(0, slashAt), bassPart: after }
}

/** Đọc một cụm thành hợp âm, hoặc trả về lý do không đọc được. */
export function parseChordToken(
  token: string,
  accidentalStyle: AccidentalStyle = 'sharp',
): ParsedChord | ChordParseError['reason'] {
  const trimmed = token.trim()
  if (trimmed.length === 0) return 'unknown-root'

  const { chordPart, bassPart } = splitBass(trimmed)

  const rootMatch = ROOT_PATTERN.exec(chordPart)
  if (!rootMatch) return 'unknown-root'

  const rootParsed = parseNoteName(rootMatch[1])
  if (!rootParsed) return 'unknown-root'

  const qualitySuffix = chordPart.slice(rootMatch[1].length)
  const quality = findQualityBySymbol(qualitySuffix)
  if (!quality) return 'unknown-quality'

  const bass = bassPart ? parseNoteName(bassPart)?.pitchClass : undefined

  const base = `${pitchClassName(rootParsed.pitchClass, accidentalStyle)}${quality.symbol}`
  const symbol =
    bass !== undefined && bass !== rootParsed.pitchClass
      ? `${base}/${pitchClassName(bass, accidentalStyle)}`
      : base

  return {
    root: rootParsed.pitchClass,
    quality,
    // Bass trùng nốt gốc thì không phải hợp âm chồng trên bass.
    bass: bass !== undefined && bass !== rootParsed.pitchClass ? bass : undefined,
    source: trimmed,
    symbol,
  }
}

/**
 * Đọc cả một dòng hoặc một đoạn chuỗi hợp âm.
 * Cụm nào không đọc được thì ghi vào `errors` chứ không làm hỏng cả chuỗi —
 * người dùng gõ sai một hợp âm vẫn thấy được các hợp âm còn lại.
 */
export function parseChordInput(
  input: string,
  accidentalStyle: AccidentalStyle = 'sharp',
): ChordSequence {
  const tokens = input.split(SEPARATOR).filter((token) => token.length > 0)

  const chords: ParsedChord[] = []
  const errors: ChordParseError[] = []

  tokens.forEach((token, index) => {
    const result = parseChordToken(token, accidentalStyle)

    if (typeof result === 'string') {
      errors.push({ source: token, index, reason: result })
    } else {
      chords.push(result)
    }
  })

  return { chords, errors }
}

/** Ghép chuỗi hợp âm trở lại thành văn bản, để hiện trong ô nhập. */
export function formatChordSequence(sequence: ChordSequence): string {
  return sequence.chords.map((chord) => chord.symbol).join(' ')
}
