import { scaleFor } from '@pianobrain/mrhai/scaleFor.js'
import { brain, brainReady } from './index'
import { formatChordSymbol } from '../../shared/musicTheory/chordDetection'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Hỏi não: **hợp âm này chạy trên thang âm nào**.
 *
 * Kho PianoBrain có 40 item mang tập bậc rút từ 13 bài giảng jazz, nhưng trước
 * cầu nối này thì KeyTrain không đọc tới — đoạn giang tấu chạy đúng nốt hợp âm
 * 1-3-5-7 và không hơn, nên G7b9 nghe y hệt G7.
 *
 * Ba luật của cầu nối, cả ba đều là luật chống bịa kéo dài sang tiếng đàn:
 *
 * 1. **Kho không có thì trả `null`.** Không suy hộ, không lấy gam của chất hợp
 *    âm gần giống. Bên gọi tự lo bằng nốt hợp âm như cũ.
 * 2. **Không tự bật.** Toàn bộ item jazz đang ở `status: "draft"` — chưa ai đối
 *    chiếu lại video. Draft thì được đọc, được tra, nhưng không được tự thành
 *    tiếng đàn. Bên gọi phải chủ động xin.
 * 3. **Không ném lỗi.** Hàm này chạy trong lúc dựng câu nhạc; ném ở đây là tắt
 *    tiếng cả bài vì một hợp âm lạ.
 */

/**
 * Thang âm cho một hợp âm, dạng lớp cao độ đã dịch về nốt gốc hợp âm.
 *
 * Trả về `null` khi kho chưa có gam cho chất hợp âm này — và đó là phần lớn
 * hợp âm của nhạc pop: hợp âm ba nốt, sus, add9 đều chưa có nguồn nào dạy gam.
 */
export function jazzScaleFor(chord: ParsedChord): PitchClass[] | null {
  if (!brainReady()) return null
  try {
    const answer = scaleFor(formatChordSymbol(chord.root, chord.quality), brain())
    const pitches = answer.best?.pitch_classes
    return pitches && pitches.length > 0 ? (pitches as PitchClass[]) : null
  } catch {
    return null
  }
}

/** Tên gam và mốc nguồn, để giao diện dẫn được thầy nào dạy chỗ này. */
export function jazzScaleCredit(
  chord: ParsedChord,
): { label: string; itemId: string; sourceId: string; locator: string | null } | null {
  if (!brainReady()) return null
  try {
    const best = scaleFor(formatChordSymbol(chord.root, chord.quality), brain()).best
    if (!best) return null
    return {
      label: best.label ?? best.name ?? 'thang âm',
      itemId: best.item_id,
      sourceId: best.source_id,
      locator: best.locator,
    }
  } catch {
    return null
  }
}
