import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { AnalyzedChord } from './degreeAnalysis'
import { analyzeInKey } from './degreeAnalysis'
import type { KeyCandidate } from './keyDetection'
import { bestKey, detectKey, isAmbiguous, keyLabel } from './keyDetection'
import type { PassingSuggestion } from './passingChordRules'
import { applySuggestions, suggestPassingChords } from './passingChordRules'
import type { ColorOptions } from './staticVoicingRules'
import { colorAnalyzedSequence, colorSequence } from './staticVoicingRules'

/**
 * Đường ống tái hòa âm.
 *
 * Thứ tự các khâu quan trọng, và đúng thứ tự kế hoạch đã vạch:
 *
 *   đọc hợp âm → **dò giọng** → **phân tích bậc** → thêm màu theo bậc
 *   → gợi ý hợp âm lướt → (dẫn bè ở bước sau)
 *
 * Khâu dò giọng và phân tích bậc phải đứng trước khâu thêm màu. Bản đầu của
 * KeyTrain bỏ qua hai khâu này nên luật thêm màu chạy mù chức năng: nó biến
 * hợp âm bậc năm thành add9, làm mất hết lực kéo về chủ âm.
 */

export interface ReharmOptions extends ColorOptions {
  /**
   * Giọng do người dùng chỉ định. Bỏ trống thì app tự dò.
   * Luôn cho phép chỉ định tay vì việc dò giọng không bao giờ chắc chắn tuyệt
   * đối — nhất là giữa một giọng trưởng và giọng thứ song song của nó.
   */
  key?: { tonic: PitchClass; scale: ScaleType } | null
  /** Các gợi ý hợp âm lướt người dùng đã chấp nhận. */
  acceptedPassing?: readonly PassingSuggestion[]
}

export interface ReharmResult {
  /** Vòng hợp âm gốc, giữ nguyên để đối chiếu. */
  original: ParsedChord[]
  /** Giọng đang dùng, dù do dò ra hay do người dùng chỉ định. */
  key: { tonic: PitchClass; scale: ScaleType; label: string } | null
  /** Giọng do người dùng chỉ định hay do app tự dò. */
  keySource: 'manual' | 'detected' | 'none'
  /** Các giọng ứng viên, xếp hạng giảm dần. */
  keyCandidates: KeyCandidate[]
  /** App có đang phân vân giữa nhiều giọng không. */
  keyAmbiguous: boolean
  /** Từng hợp âm gốc kèm bậc và vai trò. */
  analyzed: AnalyzedChord[]
  /** Vòng sau khi thêm màu, chưa chèn hợp âm lướt. */
  colored: ParsedChord[]
  /** Mọi gợi ý hợp âm lướt áp dụng được cho vòng đã thêm màu. */
  passingSuggestions: PassingSuggestion[]
  /** Vòng cuối cùng, đã thêm màu và chèn các gợi ý được chấp nhận. */
  final: ParsedChord[]
}

/** Chạy toàn bộ đường ống tái hòa âm. */
export function reharmonize(
  chords: readonly ParsedChord[],
  options: ReharmOptions = {},
): ReharmResult {
  const { key: manualKey = null, acceptedPassing = [], ...colorOptions } = options

  const original = [...chords]

  if (original.length === 0) {
    return {
      original,
      key: null,
      keySource: 'none',
      keyCandidates: [],
      keyAmbiguous: false,
      analyzed: [],
      colored: [],
      passingSuggestions: [],
      final: [],
    }
  }

  // Khâu 1 — dò giọng, trừ khi người dùng đã chỉ định.
  const keyCandidates = detectKey(original)
  const detected = bestKey(original)

  const activeKey = manualKey ?? detected
  const keySource: ReharmResult['keySource'] = manualKey
    ? 'manual'
    : detected
      ? 'detected'
      : 'none'

  // Khâu 2 — phân tích bậc.
  const analyzed: AnalyzedChord[] = activeKey
    ? analyzeInKey(original, activeKey.tonic, activeKey.scale)
    : original.map((chord) => ({
        chord,
        degree: null,
        function: null,
        roman: chord.symbol,
        actsAsDominant: false,
      }))

  // Khâu 3 — thêm màu, theo bậc nếu biết giọng.
  const colored = activeKey
    ? colorAnalyzedSequence(analyzed, activeKey.scale, colorOptions)
    : colorSequence(original, colorOptions)

  // Khâu 4 — gợi ý hợp âm lướt trên vòng đã thêm màu.
  const passingSuggestions = suggestPassingChords(colored)
  const final = applySuggestions(colored, acceptedPassing)

  return {
    original,
    key: activeKey
      ? {
          tonic: activeKey.tonic,
          scale: activeKey.scale,
          label: keyLabel(activeKey.tonic, activeKey.scale),
        }
      : null,
    keySource,
    keyCandidates,
    keyAmbiguous: isAmbiguous(keyCandidates),
    analyzed,
    colored,
    passingSuggestions,
    final,
  }
}
