import { brain } from './index'
import { flatNineAuthorities } from '@pianobrain/mrhai/derive.js'
import { itemMaySound } from './gate'
import type { SoundMode } from './gate'
import { degreeOf } from '../reharmEngine/degreeAnalysis'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PassingSuggestion } from '../reharmEngine/passingChordRules'
import type { ParsedChord } from '../types'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'

/**
 * Hợp âm lướt **thầy Hải đề xuất**, đứng cạnh đề xuất của anh Khá.
 *
 * Luật hợp âm giảm và ii-V phụ của anh Khá trong `passingChordRules.ts` giữ
 * nguyên, không sửa một dòng. Chỗ này chỉ nối thêm vào cùng danh sách đề xuất,
 * mang nhãn riêng, và cũng phải người dùng bấm nhận thì mới vào bài — mặc định
 * vẫn là bài của anh Khá, không có gì tự đổi.
 *
 * ## Vì sao 7b9
 *
 * Thầy Hải dạy dùng hợp âm át bảy giáng chín để kéo về hợp âm thứ (E7b9 về Am).
 * PianoBrain không chép sẵn từng cặp mà **suy** ra: `flatNineAuthorities()` lọc
 * xem trong kho có item nào của thầy nêu đúng quan hệ át - chủ ấy không. Kho
 * không có item nào cho phép thì hàm dưới đây trả mảng rỗng, và người dùng
 * không thấy gợi ý nào — thiếu thì nói thiếu, không tự nghĩ ra hợp âm.
 */

/** Bậc thứ đứng yên trong giọng trưởng: ii, iii, vi. Đây là chỗ 7b9 kéo về. */
const MINOR_DEGREES = new Set([2, 3, 6])

export interface BrainPassingRequest {
  chords: readonly ParsedChord[]
  key: { tonic: PitchClass; scale: ScaleType } | null
  /** Mức nguồn gốc tối thiểu để được thành tiếng. Xem `gate.ts`. */
  mode?: SoundMode
}

export function brainPassingSuggestions(
  request: BrainPassingRequest,
): PassingSuggestion[] {
  const { chords, key, mode } = request
  if (!key || chords.length === 0) return []

  /*
    Kho chưa có item nào của thầy nêu cặp 7b9 - hợp âm thứ: không gợi ý gì.

    Lọc qua cửa chặn nguồn gốc ngay từ đây, vì hợp âm lướt được nhận là **thành
    tiếng đàn** — không phải chỉ đọc. Suy luận chung không được vào loa.
  */
  const authorities = flatNineAuthorities(brain()).filter((item) =>
    itemMaySound(item, mode),
  )
  if (authorities.length === 0) return []

  const quality = getChordQuality('7b9')
  if (!quality) return []

  /*
    Giọng thứ quy về giọng trưởng song song trước khi tra bậc, cùng lý do như
    câu lót: kho của thầy đánh số bậc theo giọng trưởng.
  */
  const tonic: PitchClass =
    key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic

  const cited = [...new Set(authorities.map((item) => item.id))].slice(0, 2)
  const out: PassingSuggestion[] = []

  for (let index = 0; index < chords.length; index += 1) {
    const chord = chords[index]
    if (!chord.quality.intervals.includes(3)) continue

    const degree = degreeOf(chord.root, tonic, 'major')
    if (degree === null || !MINOR_DEGREES.has(degree)) continue

    // Hợp âm ngay trước đã là át của nó rồi thì chèn nữa là thừa.
    const before = chords[index === 0 ? chords.length - 1 : index - 1]
    if (before && normalizePitchClass(chord.root - before.root) === 5) continue

    const root = normalizePitchClass(chord.root + 7) as PitchClass
    const symbol = `${pitchClassName(root)}${quality.symbol}`

    out.push({
      insertBeforeIndex: index,
      chords: [{ root, quality, source: symbol, symbol }],
      technique: 'hai-7b9',
      authorizedBy: cited,
      explanation: `${symbol} kéo về ${chord.source} — hợp âm át bảy giáng chín của bậc thứ. Suy từ ${cited.join(', ')} trong kho thầy Hải.`,
    })
  }

  return out
}
