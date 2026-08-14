import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { AnalyzedChord } from './degreeAnalysis'
import { scaleTones } from './keyDetection'

/**
 * Dò các xung đột nhạc lý sinh ra khi đổi màu hợp âm.
 *
 * Cho người dùng tự chọn màu thì phải cho họ biết khi lựa chọn đó phạm quy
 * luật — nhưng **cảnh báo chứ không chặn**, vì có chỗ phá luật lại hay, và
 * người chơi mới là người nghe.
 */

export type ConflictKind =
  /** Bậc mười một tự nhiên đâm vào bậc ba của hợp âm trưởng. */
  | 'avoid-note-11'
  /** Hợp âm chứa nốt nằm ngoài giọng. */
  | 'out-of-key'
  /** Chủ âm mất cảm giác nghỉ. */
  | 'tonic-not-resting'
  /** Hợp âm bậc năm biến âm nhưng kéo về chủ âm trưởng. */
  | 'altered-dominant-to-major'

export interface ColorConflict {
  /** Vị trí hợp âm trong vòng. */
  index: number
  chordSymbol: string
  kind: ConflictKind
  /** Mức độ: 'warning' là nên xem lại, 'info' là chỉ để biết. */
  severity: 'warning' | 'info'
  message: string
}

/** Quãng của bậc ba trưởng và bậc mười một tự nhiên, tính bằng nửa cung. */
const MAJOR_THIRD = 4
const PERFECT_ELEVENTH = 5
const MINOR_SEVENTH = 10

/** Các quãng đặc trưng của hợp âm át biến âm. */
const ALTERED_TONES = [
  1, // giáng chín
  3, // thăng chín
  6, // giáng năm
  8, // thăng năm hoặc giáng mười ba
]

/**
 * Bậc mười một tự nhiên có đâm vào bậc ba không.
 *
 * Chỉ xảy ra với hợp âm **trưởng**: khoảng cách giữa bậc ba và bậc mười một là
 * quãng chín thứ, nghe chối ngay cả trong jazz. Cách chữa là thăng bậc mười
 * một lên, hoặc bỏ hẳn bậc ba — đó chính là lý do hợp âm treo tồn tại.
 *
 * Hợp âm **thứ** không bị vấn đề này, nên m11 dùng thoải mái.
 */
function hasAvoidNoteClash(chord: ParsedChord): boolean {
  const intervals = new Set(
    chord.quality.intervals.map((interval) => normalizePitchClass(interval)),
  )
  return intervals.has(MAJOR_THIRD) && intervals.has(PERFECT_ELEVENTH)
}

/** Các nốt của hợp âm nằm ngoài giọng. */
function outOfKeyTones(
  chord: ParsedChord,
  tonic: PitchClass,
  scale: ScaleType,
): PitchClass[] {
  const tones = scaleTones(tonic, scale)
  return chordPitchClasses(chord.root, chord.quality).filter(
    (pitch) => !tones.has(pitch),
  )
}

/** Hợp âm át này có mang nốt biến âm không. */
function isAlteredDominant(chord: ParsedChord): boolean {
  const intervals = new Set(
    chord.quality.intervals.map((interval) => normalizePitchClass(interval)),
  )
  if (!intervals.has(MINOR_SEVENTH)) return false
  return ALTERED_TONES.some((tone) => intervals.has(tone))
}

export interface ConflictOptions {
  tonic: PitchClass
  scale: ScaleType
}

/**
 * Dò xung đột trên cả vòng hợp âm đã tô màu.
 *
 * `colored` và `analyzed` phải cùng độ dài và cùng thứ tự — analyzed cho biết
 * mỗi hợp âm đóng vai bậc mấy, colored là hợp âm sau khi đã đổi màu.
 */
export function analyzeColorConflicts(
  colored: readonly ParsedChord[],
  analyzed: readonly AnalyzedChord[],
  options: ConflictOptions,
): ColorConflict[] {
  const { tonic, scale } = options
  const conflicts: ColorConflict[] = []

  colored.forEach((chord, index) => {
    const degree = analyzed[index]?.degree ?? null

    if (hasAvoidNoteClash(chord)) {
      conflicts.push({
        index,
        chordSymbol: chord.symbol,
        kind: 'avoid-note-11',
        severity: 'warning',
        message:
          'Bậc mười một tự nhiên đâm vào bậc ba, cách nhau quãng chín thứ nên nghe chối. Cách chữa là thăng bậc mười một lên, hoặc bỏ bậc ba đi thành hợp âm treo.',
      })
    }

    // Chủ âm phải nghe như chỗ nghỉ. Có bậc bảy thứ là thành hợp âm át,
    // mất hết cảm giác đã về nhà.
    if (
      degree === 1 &&
      chord.quality.intervals.includes(MINOR_SEVENTH)
    ) {
      conflicts.push({
        index,
        chordSymbol: chord.symbol,
        kind: 'tonic-not-resting',
        severity: 'warning',
        message:
          'Chủ âm mang nốt bậc bảy thứ nên nghe như hợp âm át, mất cảm giác đã về nhà.',
      })
    }

    const outside = outOfKeyTones(chord, tonic, scale)
    if (outside.length > 0 && degree !== null) {
      conflicts.push({
        index,
        chordSymbol: chord.symbol,
        kind: 'out-of-key',
        severity: 'info',
        message: `Có nốt ngoài giọng: ${outside
          .map((pitch) => pitchClassName(pitch))
          .join(', ')}. Không sai, nhưng sẽ nghe lạ so với phần còn lại.`,
      })
    }

    // Hợp âm át biến âm kéo về chủ âm trưởng.
    if (degree === 5 && isAlteredDominant(chord) && scale === 'major') {
      const next = colored[index + 1]
      const resolvesToMajor =
        next !== undefined &&
        normalizePitchClass(next.root - chord.root) === 5 &&
        next.quality.intervals.includes(MAJOR_THIRD)

      if (resolvesToMajor) {
        conflicts.push({
          index,
          chordSymbol: chord.symbol,
          kind: 'altered-dominant-to-major',
          severity: 'info',
          message:
            'Hợp âm át biến âm kéo về hợp âm trưởng. Theo lối đệm hát thường gặp, màu biến âm hợp khi kéo về hợp âm thứ hơn — tài liệu dùng E7b9 về Am, còn C7 về FM7.',
        })
      }
    }
  })

  return conflicts
}

/** Gom xung đột theo vị trí hợp âm, để giao diện hiện ngay cạnh hợp âm đó. */
export function conflictsByIndex(
  conflicts: readonly ColorConflict[],
): Map<number, ColorConflict[]> {
  const map = new Map<number, ColorConflict[]>()

  for (const conflict of conflicts) {
    const bucket = map.get(conflict.index)
    if (bucket) bucket.push(conflict)
    else map.set(conflict.index, [conflict])
  }

  return map
}
