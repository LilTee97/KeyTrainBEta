import {
  CHORD_QUALITIES,
  chordPitchClasses,
  getChordQuality,
} from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import type { ScaleType } from '../../shared/musicTheory/scales'
import { degreesOf } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { AnalyzedChord } from './degreeAnalysis'
import { scaleTones } from './keyDetection'

/**
 * Kỹ thuật 1 của phong cách: làm dày hợp âm và tư duy hợp âm chồng trên bass.
 *
 * Tài liệu nguồn phát biểu rất dứt khoát: *"Không dùng triad trơn — luôn thêm
 * màu bằng sus2/sus4, 9, 11, maj7/add2 vào mọi hợp âm chính."* Đây là chữ ký
 * dễ nhận ra nhất của phong cách, và là lý do một vòng hợp âm bình thường khi
 * qua tay anh lại nghe khác hẳn.
 */

/**
 * Bảng đổi màu hợp âm theo hai mức.
 *
 * Mức nhẹ chỉ thêm bậc bảy — đủ để bớt trơ mà vẫn giữ nguyên tính chất. Mức
 * đậm thêm nốt bậc chín trở lên, đúng vốn từ mà tài liệu ghi nhận.
 */
const COLOR_RULES: Record<string, { light?: string; full?: string }> = {
  // Hợp âm ba trơn — chỗ luật này có tác dụng rõ nhất.
  maj: { light: 'maj7', full: 'add9' },
  min: { light: 'm7', full: 'm9' },

  // Hợp âm bảy đã có sẵn màu, chỉ đẩy thêm một bậc.
  maj7: { full: 'maj9' },
  m7: { full: 'm9' },
  '7': { light: '9', full: '13' },

  // Hợp âm chín đẩy tiếp lên mười một, đúng lối Am11 trong tài liệu.
  m9: { full: 'm11' },
  maj9: { full: 'maj13' },
  '9': { full: '13' },

  // Hợp âm sáu và hợp âm treo.
  '6': { full: '69' },
  sus4: { light: '7sus4', full: '9sus4' },
  sus2: { light: 'add9' },
  '7sus4': { full: '9sus4' },
}

/**
 * Bảng đổi màu **theo bậc trong giọng** — bảng chính khi đã biết giọng.
 *
 * Đây là chỗ sửa một lỗi nghiêm trọng của bản đầu: bảng theo tính chất ở trên
 * mù chức năng, nên biến bậc năm thành add9 và làm mất hết lực kéo về chủ âm.
 * Đối chiếu tài liệu, **mọi hợp âm bậc năm trong các bài anh Khá dạy đều có
 * nốt bậc bảy** (D9sus4, C7, A7b13, E7b9) — không có chỗ nào dùng add9 cho bậc
 * năm. Ngược lại add9 và maj7 lại đúng cho chủ âm (Cadd2, CM7, C6).
 */
const MAJOR_DEGREE_RULES: Record<number, { light: string; full: string }> = {
  // Chủ âm: thêm màu nhưng phải giữ cảm giác nghỉ, nên không thêm bậc bảy át.
  1: { light: 'maj7', full: 'add9' },
  // Bậc hai: tài liệu dùng Am11 ở đúng vai trò này.
  2: { light: 'm7', full: 'm11' },
  3: { light: 'm7', full: 'm9' },
  4: { light: 'maj7', full: 'maj9' },
  // Bậc năm: bắt buộc có bậc bảy, nếu không thì mất lực kéo về chủ âm.
  5: { light: '7', full: '13' },
  6: { light: 'm7', full: 'm9' },
  7: { light: 'm7b5', full: 'm7b5' },
}

const MINOR_DEGREE_RULES: Record<number, { light: string; full: string }> = {
  // Chủ âm thứ: không thêm bậc bảy thứ — nghe như át, mất cảm giác về nhà.
  1: { light: 'min', full: 'madd9' },
  2: { light: 'm7b5', full: 'm7b5' },
  3: { light: 'maj7', full: 'maj9' },
  4: { light: 'm7', full: 'm9' },
  // Bậc năm giọng thứ dùng nốt giáng chín, đúng lối A7b9 kéo về Dm9.
  5: { light: '7', full: '7b9' },
  6: { light: 'maj7', full: 'maj9' },
  7: { light: '7', full: '9' },
}

export type ColorIntensity = 'off' | 'light' | 'full'

/**
 * Màu dùng cho các bậc **trưởng đứng yên** — bậc I và IV của giọng trưởng,
 * bậc III và VI của giọng thứ.
 *
 * Tài liệu liệt kê nguyên văn ở mục 6: *"luôn thêm màu bằng sus2/sus4, 9, 11,
 * maj7/add2"*, và mục 12.2 cho thấy cùng một hợp âm C được đổi qua lại giữa
 * `C`, `CM7` và `C6`. Tức không có **một** màu đúng cho chủ âm — đó là lựa
 * chọn thẩm mỹ, nên để người chơi chọn.
 *
 * Hai thứ cố ý **không** nằm trong nhóm này:
 *
 * - **Bậc V**, vì nó cần nốt bậc bảy để giữ lực kéo về chủ âm.
 * - **sus4**, dù tài liệu có nhắc tên. Nốt bậc bốn treo luôn đòi giải quyết
 *   xuống bậc ba nên nó là **nốt treo cần giải quyết**, không phải màu đứng
 *   yên — không ai chơi chủ âm ở màu sus4. Tra lại thì mọi ví dụ sus cụ thể
 *   trong tài liệu đều nằm ở hợp âm bậc năm (`D9sus4`, `G7b9sus4`) hoặc ở
 *   dạng giải quyết (`Esus4 → E`, `G7sus4 → G7`).
 *
 * `sus2` thì giữ lại: nó không có nốt đòi giải quyết nên đứng yên được.
 */
export type MajorChordColor =
  | 'add9'
  | 'maj7'
  | 'maj9'
  | '6'
  | '69'
  | 'sus2'
  /** Màu lydian, không thấy trong tài liệu. */
  | 'maj7#11'

/**
 * Màu dùng cho các bậc **thứ đứng yên** — bậc ii, iii, vi của giọng trưởng và
 * bậc i, iv của giọng thứ.
 *
 * Bậc nửa giảm không nằm trong nhóm này vì nó có chức năng riêng, đổi màu sẽ
 * làm mất chất.
 */
export type MinorChordColor =
  | 'auto'
  | 'min'
  | 'madd9'
  | 'm7'
  | 'm9'
  | 'm11'
  /** Màu dorian, không thấy trong tài liệu. */
  | 'm6'
  /** Màu thứ hoà thanh, không thấy trong tài liệu. */
  | 'mMaj7'
  | 'dim'
  | 'dim7'

/**
 * Màu này lấy từ đâu.
 *
 * Phân biệt rõ để người học biết mình đang nghe phong cách anh Khá hay đang
 * nghe gu jazz nói chung — giống cách cờ `verified` phân biệt điệu đã xác thực
 * với điệu chưa. Mục tiêu của app là học **một phong cách cụ thể**, nên trộn
 * lẫn hai nguồn mà không nói rõ là làm hỏng mục tiêu đó.
 */
export type ColorSource =
  /** Có mặt trong các bài mà tài liệu phân tích. */
  | 'khaBu'
  /** Màu jazz hợp lệ nhưng không thấy trong tài liệu. */
  | 'jazz'

export interface ColorOptionBase {
  label: string
  description: string
  source: ColorSource
}

export interface MinorColorOption extends ColorOptionBase {
  id: MinorChordColor
}

export const MINOR_COLOR_OPTIONS: readonly MinorColorOption[] = [
  {
    id: 'auto',
    label: 'Theo bậc',
    description:
      'Bậc hai dùng m11 đúng lối Am11 trong tài liệu, các bậc thứ khác dùng m9. Chủ âm thứ luôn m(add9).',
    source: 'khaBu',
  },
  {
    id: 'min',
    label: 'm',
    description: 'Thứ trơn, không bảy — hết nốt ngoài giọng do bậc chín/mười một.',
    source: 'khaBu',
  },
  {
    id: 'madd9',
    label: 'm(add9)',
    description: 'Thêm chín, không bảy. Chủ âm thứ vẫn nghỉ.',
    source: 'khaBu',
  },
  {
    id: 'm7',
    label: 'm7',
    description: 'Chỉ thêm bậc bảy, màu nhạt nhất.',
    source: 'khaBu',
  },
  {
    id: 'm9',
    label: 'm9',
    description: 'Thêm bậc chín, màu mềm và tròn.',
    source: 'khaBu',
  },
  {
    id: 'm11',
    label: 'm11',
    description: 'Thêm cả bậc mười một, dày và mở. Đây là màu đặc trưng nhất.',
    source: 'khaBu',
  },
  {
    id: 'm6',
    label: 'm6',
    description:
      'Màu dorian, sáng hơn hợp âm thứ thường. Thêm nốt nằm ngoài giọng.',
    source: 'jazz',
  },
  {
    id: 'mMaj7',
    label: 'm(maj7)',
    description:
      'Thứ với bậc bảy trưởng, màu căng và bí ẩn. Thêm nốt nằm ngoài giọng.',
    source: 'jazz',
  },
  {
    id: 'dim',
    label: 'dim',
    description: 'Giữ hợp âm giảm ba nốt. Chỉ áp cho hợp âm vốn đã giảm.',
    source: 'khaBu',
  },
  {
    id: 'dim7',
    label: 'dim7',
    description: 'Giảm bảy — màu dim dày hơn. Chỉ áp cho hợp âm vốn đã giảm.',
    source: 'khaBu',
  },
]

export interface MajorColorOption extends ColorOptionBase {
  id: MajorChordColor
}

/**
 * Màu cho **bậc năm**.
 *
 * Tài liệu dùng khá nhiều hợp âm át biến âm mà bản đầu của app bỏ sót:
 * `E7#5` ở bài Cứ Chill Thôi, `C13b9` ở Nàng Thơ, `A7b13/E` ở Em Dạo Này.
 * Mọi lựa chọn ở đây đều giữ nốt bậc bảy để không mất lực kéo về chủ âm.
 */
export type DominantChordColor =
  | 'auto'
  | '7'
  | '9'
  | '13'
  | '7b9'
  | '13b9'
  | '7#5'
  | '7b13'
  /** Màu lydian át, không thấy trong tài liệu. */
  | '7#11'
  /** Màu blues, không thấy trong tài liệu. */
  | '7#9'
  | '7b5'
  | '9sus4'

export interface DominantColorOption extends ColorOptionBase {
  id: DominantChordColor
}

export const DOMINANT_COLOR_OPTIONS: readonly DominantColorOption[] = [
  {
    id: 'auto',
    label: 'Theo bậc',
    description:
      'Giọng trưởng dùng 13, giọng thứ dùng 7b9 cho lực kéo mạnh hơn.',
    source: 'khaBu',
  },
  {
    id: '7',
    label: '7',
    description: 'Bảy át trơn, màu cơ bản nhất.',
    source: 'khaBu',
  },
  {
    id: '9',
    label: '9',
    description: 'Thêm bậc chín, mềm hơn bảy trơn.',
    source: 'khaBu',
  },
  {
    id: '13',
    label: '13',
    description: 'Thêm bậc mười ba, màu rộng và sang.',
    source: 'khaBu',
  },
  {
    id: '7b9',
    label: '7b9',
    description: 'Giáng chín tạo lực kéo mạnh, hay dùng khi về hợp âm thứ.',
    source: 'khaBu',
  },
  {
    id: '13b9',
    label: '13b9',
    description: 'Vừa rộng vừa căng. Tài liệu dùng ở bài Nàng Thơ.',
    source: 'khaBu',
  },
  {
    id: '7#5',
    label: '7#5',
    description:
      'Thăng năm, màu chông chênh. Tài liệu dùng trong chuỗi giải quyết hợp âm treo.',
    source: 'khaBu',
  },
  {
    id: '7b13',
    label: '7b13',
    description: 'Giáng mười ba, tối và nặng. Tài liệu dùng ở bài Em Dạo Này.',
    source: 'khaBu',
  },
  {
    id: '7#11',
    label: '7#11',
    description: 'Màu lydian át, sáng và lơ lửng.',
    source: 'jazz',
  },
  {
    id: '7#9',
    label: '7#9',
    description: 'Màu blues gắt, va chạm giữa bậc ba trưởng và thứ.',
    source: 'jazz',
  },
  {
    id: '7b5',
    label: '7b5',
    description: 'Giáng năm, màu mờ ảo.',
    source: 'jazz',
  },
  {
    id: '9sus4',
    label: '9sus4',
    description: 'Treo bậc bốn cộng chín. Lối D9sus4, E9sus4 của Khá Bự.',
    source: 'khaBu',
  },
]

/**
 * Bộ màu cho cả vòng, chọn theo màu của **chủ âm**.
 *
 * Chủ âm quyết định gu của cả bài: chọn hợp âm sáu là đang nghiêng về lối cổ
 * điển và bossa, chọn add9 là lối pop ballad, chọn maj9 hay 6/9 là lối jazz.
 * Nên đổi màu chủ âm thì các bậc khác cũng nên đổi theo cho ăn khớp.
 *
 * Cơ sở của từng bộ:
 * - **6 và 6/9**: nhạc lý jazz coi hợp âm sáu là màu chủ âm kinh điển vì nghe
 *   đứng yên và đã giải quyết hơn maj7, lại tránh được việc bậc bảy trưởng
 *   cọ vào nốt hát khi giai điệu rơi đúng nốt chủ âm. Tài liệu cũng dùng C6.
 * - **add9**: tài liệu dùng nhiều nhất, ghi là Cadd2.
 * - **maj7 và maj9**: màu jazz tiêu chuẩn, mềm và mơ.
 * - **sus2**: lối pop mở, không rõ trưởng thứ.
 */
export interface ColorPalette {
  major: MajorChordColor
  minor: MinorChordColor
  dominant: DominantChordColor
  /** Có nên đổi hợp âm át thành hợp âm treo không. */
  susDominant: boolean
  /** Tên gu để hiển thị. */
  styleName: string
}

export const PALETTE_BY_TONIC_COLOR: Record<MajorChordColor, ColorPalette> = {
  add9: {
    major: 'add9',
    minor: 'auto',
    dominant: '9sus4',
    susDominant: true,
    styleName: 'Pop ballad',
  },
  maj7: {
    major: 'maj7',
    minor: 'm9',
    dominant: '9',
    susDominant: false,
    styleName: 'Jazz nhẹ',
  },
  maj9: {
    major: 'maj9',
    minor: 'm9',
    dominant: '13',
    susDominant: false,
    styleName: 'Jazz',
  },
  '6': {
    major: '6',
    minor: 'm7',
    dominant: '7',
    susDominant: false,
    styleName: 'Cổ điển, bossa',
  },
  '69': {
    major: 'maj7',
    minor: 'm9',
    dominant: '13',
    susDominant: false,
    styleName: 'Jazz sáng',
  },
  sus2: {
    major: 'sus2',
    minor: 'm11',
    dominant: 'auto',
    susDominant: true,
    styleName: 'Pop mở, lơ lửng',
  },
  'maj7#11': {
    major: 'maj7#11',
    minor: 'm9',
    dominant: '7#11',
    susDominant: false,
    styleName: 'Lydian, ngoài tài liệu',
  },
}

export const MAJOR_COLOR_OPTIONS: readonly MajorColorOption[] = [
  {
    id: 'add9',
    label: 'add2',
    description: 'Thêm nốt bậc chín, giữ nguyên cảm giác nghỉ. Lối Cadd2.',
    source: 'khaBu',
  },
  {
    id: 'maj7',
    label: 'maj7',
    description: 'Thêm bậc bảy trưởng, màu mềm và mơ.',
    source: 'khaBu',
  },
  {
    id: 'maj9',
    label: 'maj9',
    description: 'Bảy trưởng cộng bậc chín, dày nhất trong nhóm này.',
    source: 'khaBu',
  },
  {
    id: '6',
    label: '6',
    description: 'Thêm bậc sáu, nghe cổ điển và dứt khoát hơn maj7.',
    source: 'khaBu',
  },
  {
    id: '69',
    label: '6/9',
    description: 'Sáu cộng chín, màu jazz sáng, hay dùng ở hợp âm kết.',
    source: 'khaBu',
  },
  {
    id: 'sus2',
    label: 'sus2',
    description:
      'Bỏ bậc ba, thay bằng bậc hai. Lơ lửng nhưng vẫn đứng yên được, không đòi giải quyết như sus4.',
    source: 'khaBu',
  },
  {
    id: 'maj7#11',
    label: 'maj7#11',
    description:
      'Màu lydian, sáng và mơ màng. Ở bậc bốn thì nốt thăng mười một vẫn nằm trong giọng, ở chủ âm thì nằm ngoài.',
    source: 'jazz',
  },
]

export interface ColorOptions {
  intensity?: ColorIntensity
  /**
   * Đổi hợp âm bảy át thành hợp âm treo bậc bốn.
   *
   * Tách riêng khỏi mức đậm vì đây là lựa chọn mạnh tay hơn hẳn: bỏ bậc ba là
   * bỏ luôn cảm giác dẫn về chủ âm. Tài liệu dùng rất nhiều (D9sus4, E9sus4),
   * nhưng thường có giải quyết về hợp âm bảy thường ngay sau đó, nên để người
   * dùng tự bật.
   */
  susDominant?: boolean
  /**
   * Màu cho các bậc trưởng đứng yên. Bỏ trống thì dùng add9, đúng lối Cadd2
   * mà tài liệu dùng nhiều nhất.
   */
  majorColor?: MajorChordColor
  tonic?: PitchClass
  /** Ép nốt ngoài giọng về chất diatonic của bậc. Mặc định bật. */
  preferInKey?: boolean
  /**
   * Màu cho các bậc thứ đứng yên. Bỏ trống thì mỗi bậc dùng màu riêng của nó.
   */
  minorColor?: MinorChordColor
  /** Màu cho bậc năm. Bỏ trống thì theo bậc và theo giọng. */
  dominantColor?: DominantChordColor
  /**
   * Màu riêng cho **chủ âm**, tách khỏi các bậc trưởng đứng yên khác.
   *
   * Chủ âm quan trọng hơn hẳn: nó là chỗ nghỉ của cả bài, và màu của nó quyết
   * định gu chung. Bỏ trống thì dùng chung màu với các bậc trưởng khác.
   */
  tonicColor?: MajorChordColor
}

/**
 * Bậc này có phải hợp âm trưởng đứng yên không.
 *
 * Nhận ra bằng cách xem hợp âm bảy mặc định của bậc đó có phải bảy trưởng —
 * chỉ các bậc nghỉ mới vậy. Bậc năm có hợp âm bảy át nên tự động bị loại, đúng
 * ý: nó cần bậc bảy để kéo về chủ âm, không được thay bằng màu đứng yên.
 */
function isRestingMajorDegree(degree: number, scale: ScaleType): boolean {
  const entry = degreesOf(scale).find((item) => item.degree === degree)
  return entry?.seventhQualityId === 'maj7'
}

/**
 * Bậc này có phải hợp âm thứ đứng yên không.
 *
 * Nhận ra qua hợp âm bảy mặc định là bảy thứ. Bậc nửa giảm tự động bị loại vì
 * hợp âm bảy của nó là m7b5, không phải m7.
 */
function isRestingMinorDegree(degree: number, scale: ScaleType): boolean {
  const entry = degreesOf(scale).find((item) => item.degree === degree)
  return entry?.seventhQualityId === 'm7'
}

function accidentalStyleOf(symbol: string): AccidentalStyle {
  return /^[A-G]b/.test(symbol) ? 'flat' : 'sharp'
}

function thirdOf(intervals: readonly number[]): 'major' | 'minor' | null {
  if (intervals.includes(3)) return 'minor'
  if (intervals.includes(4)) return 'major'
  return null
}

/** Dựng lại một hợp âm với tính chất khác, giữ nguyên nốt gốc và nốt bass. */
function withQuality(chord: ParsedChord, qualityId: string): ParsedChord {
  const quality = getChordQuality(qualityId)
  if (!quality) return chord

  const style = accidentalStyleOf(chord.symbol)
  const base = `${pitchClassName(chord.root, style)}${quality.symbol}`
  const symbol =
    chord.bass !== undefined
      ? `${base}/${pitchClassName(chord.bass, style)}`
      : base

  return { ...chord, quality, symbol }
}

/**
 * Thêm màu cho một hợp âm.
 * Hợp âm không có luật nào áp dụng thì giữ nguyên — luật ở đây là gợi ý có
 * chọn lọc, không phải ép mọi hợp âm phải đổi.
 */
export function colorChord(
  chord: ParsedChord,
  options: ColorOptions = {},
): ParsedChord {
  const { intensity = 'full', susDominant = false } = options
  if (intensity === 'off') return chord

  // Hợp âm bảy át chuyển sang treo bậc bốn trước, rồi mới thêm màu tiếp.
  if (susDominant && (chord.quality.id === '7' || chord.quality.id === '9')) {
    return withQuality(chord, intensity === 'full' ? '9sus4' : '7sus4')
  }

  const rule = COLOR_RULES[chord.quality.id]
  if (!rule) return chord

  const target = intensity === 'full' ? (rule.full ?? rule.light) : rule.light
  return target ? withQuality(chord, target) : chord
}

/** Thêm màu cho cả một chuỗi hợp âm, khi chưa biết giọng. */
export function colorSequence(
  chords: readonly ParsedChord[],
  options: ColorOptions = {},
): ParsedChord[] {
  return chords.map((chord) => colorChord(chord, options))
}

/**
 * Thêm màu cho một hợp âm đã biết bậc trong giọng.
 *
 * Hợp âm nằm ngoài giọng thì rơi về bảng theo tính chất, trừ khi ngữ cảnh cho
 * thấy nó đang đóng vai bậc năm phụ — lúc đó phải cho nó bậc bảy như một hợp
 * âm bậc năm thật, chứ không tô như hợp âm nghỉ.
 */
const THINNER: Record<string, string> = {
  m11: 'm9',
  m9: 'm7',
  m7: 'min',
  madd9: 'min',
  maj13: 'maj9',
  maj9: 'maj7',
  maj7: 'add9',
  add9: 'maj',
  '69': '6',
  '6': 'maj',
  sus2: 'maj',
  '9sus4': '7sus4',
  '7sus4': 'sus4',
  '13': '9',
  '9': '7',
  '13b9': '7b9',
  '7b9': '7',
  '7#5': '7',
  '7b13': '7',
  m13: 'm11',
}

const KEEP_OUTSIDE = new Set([
  'm6',
  'mMaj7',
  'maj7#11',
  '7#11',
  '7#9',
  '7b5',
  '7b9',
  '13b9',
  '7#5',
  '7b13',
])

function fitsKey(
  root: ParsedChord['root'],
  qualityId: string,
  tonic: PitchClass,
  scale: ScaleType,
): boolean {
  const quality = getChordQuality(qualityId)
  if (!quality) return true
  const tones = scaleTones(tonic, scale)
  return chordPitchClasses(root, quality).every((pitch) => tones.has(pitch))
}

function inKeyQuality(
  root: ParsedChord['root'],
  qualityId: string,
  tonic: PitchClass,
  scale: ScaleType,
): string {
  if (KEEP_OUTSIDE.has(qualityId)) return qualityId
  let current = qualityId
  for (let step = 0; step < 8; step += 1) {
    if (fitsKey(root, current, tonic, scale)) return current
    const next = THINNER[current]
    if (!next || next === current) return current
    current = next
  }
  return current
}

export function colorAnalyzedChord(
  analyzed: AnalyzedChord,
  scale: ScaleType,
  options: ColorOptions = {},
): ParsedChord {
  const {
    intensity = 'full',
    susDominant = false,
    majorColor = 'add9',
    minorColor = 'auto',
    dominantColor = 'auto',
    tonicColor,
    tonic,
    preferInKey = true,
  } = options
  if (intensity === 'off') return analyzed.chord

  const { chord, degree } = analyzed
  const qualityId = chord.quality.id

  if (
    (qualityId === 'dim' || qualityId === 'dim7') &&
    !(degree === 7 && scale === 'major')
  ) {
    if (minorColor === 'dim' || minorColor === 'dim7') {
      return withQuality(chord, minorColor)
    }
    if (intensity === 'full' && qualityId === 'dim') {
      return withQuality(chord, 'dim7')
    }
    return chord
  }

  if (qualityId === 'aug') return chord

  // Hợp âm ngoài giọng nhưng đang giải quyết như bậc năm.
  if (degree === null && analyzed.actsAsDominant) {
    if (susDominant) {
      return withQuality(chord, intensity === 'full' ? '9sus4' : '7sus4')
    }
    return withQuality(chord, intensity === 'full' ? '13' : '7')
  }

  if (degree === null) return colorChord(chord, options)

  const rules = scale === 'minor' ? MINOR_DEGREE_RULES : MAJOR_DEGREE_RULES
  const rule = rules[degree]
  if (!rule) return colorChord(chord, options)

  if (degree === 1 && scale === 'minor') {
    return withQuality(chord, intensity === 'full' ? 'madd9' : 'min')
  }

  if (degree === 5 && thirdOf(chord.quality.intervals) === 'minor') {
    const minorTarget =
      minorColor !== 'auto' && minorColor !== 'dim' && minorColor !== 'dim7'
        ? minorColor
        : intensity === 'full'
          ? 'm9'
          : 'm7'
    const clamped =
      preferInKey && tonic !== undefined
        ? inKeyQuality(chord.root, minorTarget, tonic, scale)
        : minorTarget
    return withQuality(chord, clamped)
  }

  // Chỉ đổi bậc năm sang hợp âm treo; các bậc khác giữ nguyên luật của mình.
  if (susDominant && degree === 5 && thirdOf(chord.quality.intervals) !== 'minor') {
    return withQuality(chord, intensity === 'full' ? '9sus4' : '7sus4')
  }

  // Bậc đứng yên thì dùng màu người chơi chọn, thay cho mặc định của bậc.
  let target: string
  if (intensity !== 'full') {
    target = rule.light
  } else if (degree === 5 && dominantColor !== 'auto') {
    target = dominantColor
  } else if (degree === 1 && isRestingMajorDegree(degree, scale)) {
    // Chủ âm có màu riêng nếu được chỉ định, vì nó là chỗ nghỉ của cả bài.
    target = tonicColor ?? majorColor
  } else if (isRestingMajorDegree(degree, scale)) {
    target = majorColor
  } else if (
    minorColor !== 'auto' &&
    minorColor !== 'dim' &&
    minorColor !== 'dim7' &&
    isRestingMinorDegree(degree, scale)
  ) {
    target = minorColor
  } else {
    target = rule.full
  }

  if (preferInKey && tonic !== undefined && degree !== null) {
    const diatonicThird = isRestingMinorDegree(degree, scale)
      ? 'minor'
      : isRestingMajorDegree(degree, scale)
        ? 'major'
        : null
    const chordThird = thirdOf(chord.quality.intervals)
    if (diatonicThird && chordThird && chordThird !== diatonicThird) {
      target =
        diatonicThird === 'minor'
          ? minorColor !== 'auto' && minorColor !== 'dim' && minorColor !== 'dim7'
            ? minorColor
            : intensity === 'full'
              ? rule.full
              : rule.light
          : majorColor
    }
    target = inKeyQuality(chord.root, target, tonic, scale)
  }

  const targetQuality = getChordQuality(target)
  if (!targetQuality) return chord
  // Hợp âm người dùng nhập đã dày hơn mức luật đề xuất thì giữ nguyên, không
  // làm mỏng đi.
  if (targetQuality.intervals.length < chord.quality.intervals.length) {
    return chord
  }
  // Bậc lấy từ nốt gốc; Cm ở bậc IV hay Em bị gán nhầm bậc V không được đổi
  // thành hợp âm trưởng.
  const fromThird = thirdOf(chord.quality.intervals)
  const toThird = thirdOf(targetQuality.intervals)
  if (fromThird && toThird && fromThird !== toThird) {
    return colorChord(chord, options)
  }

  return withQuality(chord, target)
}

/** Thêm màu cho cả vòng hợp âm đã phân tích bậc. */
export function colorAnalyzedSequence(
  analyzed: readonly AnalyzedChord[],
  scale: ScaleType,
  options: ColorOptions = {},
): ParsedChord[] {
  return analyzed.map((entry) => colorAnalyzedChord(entry, scale, options))
}

/** Một cách đọc hợp âm theo lối chồng trên bass. */
export interface UpperStructure {
  /** Hợp âm đơn giản mà tay phải sẽ bấm. */
  upperRoot: PitchClass
  upperQualityId: string
  /** Nốt bass mà tay trái giữ. */
  bass: PitchClass
  /** Cách viết cho người đọc, ví dụ 'G / A'. */
  label: string
  /** Khoảng cách từ nốt gốc hợp âm tới nốt gốc phần trên, tính bằng nửa cung. */
  intervalFromRoot: number
}

/** Các tính chất đủ đơn giản để làm phần chồng bên trên. */
const UPPER_CANDIDATES = ['maj', 'min', 'dim', 'aug', 'm7', 'maj7', '7']

/**
 * Tìm các cách đọc hợp âm phức tạp thành một hợp âm đơn giản chồng trên bass.
 *
 * Đây là cách quy đổi mà tài liệu lập hẳn bảng ở mục 1.2, ví dụ D9sus4 quy về
 * "Đô trưởng chồng trên bass Rê". Điểm chung của mọi ví dụ trong bảng đó:
 * **phần chồng bên trên là hợp âm dựng trên bậc bảy của hợp âm gốc**. Nên hàm
 * này xếp các ứng viên dựng trên bậc bảy lên đầu.
 *
 * Cách quy đổi này là lý do người mới chơi được hòa âm phức tạp mà không cần
 * thuộc công thức: chỉ cần bấm một hợp âm ba quen thuộc và đổi nốt bass.
 */
export function findUpperStructures(chord: ParsedChord): UpperStructure[] {
  const chordTones = new Set(chordPitchClasses(chord.root, chord.quality))
  const bass = chord.bass ?? chord.root
  const results: UpperStructure[] = []

  for (const candidateId of UPPER_CANDIDATES) {
    const quality = getChordQuality(candidateId)
    if (!quality) continue

    for (const tone of chordTones) {
      // Phần chồng bên trên phải khác nốt gốc, nếu không thì chẳng quy đổi gì.
      if (tone === chord.root) continue

      const upperTones = chordPitchClasses(tone, quality)
      const fitsInside = upperTones.every((pitch) => chordTones.has(pitch))
      if (!fitsInside) continue

      // Phần chồng phải đơn giản hơn hợp âm gốc mới đáng gọi là quy đổi.
      if (quality.intervals.length >= chord.quality.intervals.length) continue

      results.push({
        upperRoot: tone,
        upperQualityId: candidateId,
        bass,
        label: `${pitchClassName(tone)}${quality.symbol} / ${pitchClassName(bass)}`,
        intervalFromRoot: normalizePitchClass(tone - chord.root),
      })
    }
  }

  return results.sort((a, b) => {
    // Ưu tiên phần chồng dựng trên bậc bảy, đúng như mọi ví dụ trong tài liệu.
    const seventhScore = (entry: UpperStructure) =>
      entry.intervalFromRoot === 10 || entry.intervalFromRoot === 11 ? 0 : 1

    const byDegree = seventhScore(a) - seventhScore(b)
    if (byDegree !== 0) return byDegree

    // Rồi tới hợp âm ba đơn giản nhất.
    const sizeOf = (entry: UpperStructure) =>
      getChordQuality(entry.upperQualityId)?.intervals.length ?? 9
    return sizeOf(a) - sizeOf(b)
  })
}

/** Cách đọc chồng trên bass hợp lý nhất, hoặc null nếu không quy đổi được. */
export function bestUpperStructure(
  chord: ParsedChord,
): UpperStructure | null {
  return findUpperStructures(chord)[0] ?? null
}

/**
 * Đổi một hợp âm sang dạng chồng trên bass thật sự.
 *
 * Khác với `bestUpperStructure` vốn chỉ *gợi ý cách đọc*, hàm này trả về một
 * hợp âm mới để **bấm theo cách đó**: tay phải chơi hợp âm ba đơn giản, tay
 * trái giữ nốt bass gốc. Đây chính là điều tài liệu mô tả ở kỹ thuật 1 —
 * *"giúp người mới dễ bấm mà không cần thuộc công thức jazz phức tạp"*.
 *
 * Lưu ý về mặt âm thanh: cách bấm này **bỏ bớt nốt**. Am11 đầy đủ có sáu nốt,
 * còn G/A chỉ có bốn. Đó là chủ ý của kỹ thuật, không phải mất mát — người
 * chơi thật cũng chỉ bấm bấy nhiêu nốt.
 *
 * Trả về null khi hợp âm đã đủ đơn giản, không quy đổi được.
 */
export function toSlashChord(chord: ParsedChord): ParsedChord | null {
  const structure = bestUpperStructure(chord)
  if (!structure) return null

  const quality = getChordQuality(structure.upperQualityId)
  if (!quality) return null

  const upperName = `${pitchClassName(structure.upperRoot)}${quality.symbol}`

  return {
    root: structure.upperRoot,
    quality,
    bass: structure.bass,
    source: chord.source,
    symbol: `${upperName}/${pitchClassName(structure.bass)}`,
  }
}

/**
 * Đổi cả vòng sang dạng chồng trên bass.
 * Hợp âm nào không quy đổi được thì giữ nguyên, vì bản thân nó đã dễ bấm.
 */
export function toSlashSequence(
  chords: readonly ParsedChord[],
): ParsedChord[] {
  return chords.map((chord) => toSlashChord(chord) ?? chord)
}

/** Danh sách tính chất mà bảng đổi màu có đụng tới, dùng cho tài liệu và test. */
export function coloredQualityIds(): string[] {
  return CHORD_QUALITIES.filter((quality) => quality.id in COLOR_RULES).map(
    (quality) => quality.id,
  )
}
