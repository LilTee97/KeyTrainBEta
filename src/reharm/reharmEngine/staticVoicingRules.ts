import {
  CHORD_QUALITIES,
  chordPitchClasses,
  getChordQuality,
} from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { AnalyzedChord } from './degreeAnalysis'

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
  1: { light: 'm7', full: 'm9' },
  2: { light: 'm7b5', full: 'm7b5' },
  3: { light: 'maj7', full: 'maj9' },
  4: { light: 'm7', full: 'm9' },
  // Bậc năm giọng thứ dùng nốt giáng chín, đúng lối A7b9 kéo về Dm9.
  5: { light: '7', full: '7b9' },
  6: { light: 'maj7', full: 'maj9' },
  7: { light: '7', full: '9' },
}

export type ColorIntensity = 'off' | 'light' | 'full'

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
}

/** Dựng lại một hợp âm với tính chất khác, giữ nguyên nốt gốc và nốt bass. */
function withQuality(chord: ParsedChord, qualityId: string): ParsedChord {
  const quality = getChordQuality(qualityId)
  if (!quality) return chord

  const base = `${pitchClassName(chord.root)}${quality.symbol}`
  const symbol =
    chord.bass !== undefined
      ? `${base}/${pitchClassName(chord.bass)}`
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
export function colorAnalyzedChord(
  analyzed: AnalyzedChord,
  scale: ScaleType,
  options: ColorOptions = {},
): ParsedChord {
  const { intensity = 'full', susDominant = false } = options
  if (intensity === 'off') return analyzed.chord

  const { chord, degree } = analyzed

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

  // Chỉ đổi bậc năm sang hợp âm treo; các bậc khác giữ nguyên luật của mình.
  if (susDominant && degree === 5) {
    return withQuality(chord, intensity === 'full' ? '9sus4' : '7sus4')
  }

  const target = intensity === 'full' ? rule.full : rule.light

  // Hợp âm người dùng nhập đã dày hơn mức luật đề xuất thì giữ nguyên, không
  // làm mỏng đi.
  const targetQuality = getChordQuality(target)
  if (
    targetQuality &&
    targetQuality.intervals.length < chord.quality.intervals.length
  ) {
    return chord
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

/** Danh sách tính chất mà bảng đổi màu có đụng tới, dùng cho tài liệu và test. */
export function coloredQualityIds(): string[] {
  return CHORD_QUALITIES.filter((quality) => quality.id in COLOR_RULES).map(
    (quality) => quality.id,
  )
}
