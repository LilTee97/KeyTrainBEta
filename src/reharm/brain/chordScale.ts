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
 * 2. **Chỉ lấy gam đã có người rà.** 28 item gam mà bộ chọn dùng tới đều đã
 *    được đối chiếu với video và mang `status: "validated"`; item nào thêm sau
 *    mà chưa rà thì tự động im, không phải nhớ chặn tay.
 *
 *    Siết ở đây chứ **không** siết `DEFAULT_SOUND_MODE` bên `gate.ts`: hằng số
 *    ấy gác cả kho, mà câu lót của thầy Kingsley, walking bass của Pianote và
 *    mấy nguồn còn lại chưa ai rà — siết cả kho là tắt tiếng luôn những thứ
 *    đang chạy tốt. Rà tới đâu siết tới đó.
 * 3. **Không ném lỗi.** Hàm này chạy trong lúc dựng câu nhạc; ném ở đây là tắt
 *    tiếng cả bài vì một hợp âm lạ.
 */

/**
 * Thang âm cho một hợp âm, dạng lớp cao độ đã dịch về nốt gốc hợp âm.
 *
 * Trả về `null` khi kho chưa có gam cho chất hợp âm này — và đó là phần lớn
 * hợp âm của nhạc pop: hợp âm ba nốt, sus, add9 đều chưa có nguồn nào dạy gam.
 */
export function scaleForChord(chord: ParsedChord): PitchClass[] | null {
  if (!brainReady()) return null
  try {
    const answer = scaleFor(formatChordSymbol(chord.root, chord.quality), brain(), {
      requireValidated: true,
    })
    const pitches = answer.best?.pitch_classes
    return pitches && pitches.length > 0 ? (pitches as PitchClass[]) : null
  } catch {
    return null
  }
}

/**
 * Những hợp âm trong bài mà kho **chưa có gam** cho chúng.
 *
 * Đây là phần lớn hợp âm nhạc pop: hợp âm ba nốt trưởng, `sus2`, `sus4`, `6`,
 * `m6`, `add9` — không nguồn nào trong kho dạy gam cho chúng. Mấy hợp âm ấy
 * quay về nốt hợp âm như cũ, và chuyện đó **phải nói ra**: người dùng bật công
 * tắc gam jazz rồi nghe không khác gì thì tưởng app hỏng, chứ không đoán được
 * là kho thiếu.
 *
 * Trả về ký hiệu hợp âm, không trùng lặp, theo đúng thứ tự gặp trong bài.
 */
export function scaleGaps(chords: readonly ParsedChord[]): string[] {
  const gaps: string[] = []
  for (const chord of chords) {
    if (scaleForChord(chord)) continue
    const symbol = formatChordSymbol(chord.root, chord.quality)
    if (!gaps.includes(symbol)) gaps.push(symbol)
  }
  return gaps
}

/** Tên gam và mốc nguồn, để giao diện dẫn được thầy nào dạy chỗ này. */
export function scaleCredit(
  chord: ParsedChord,
): { label: string; itemId: string; sourceId: string; locator: string | null } | null {
  if (!brainReady()) return null
  try {
    const best = scaleFor(formatChordSymbol(chord.root, chord.quality), brain(), {
      requireValidated: true,
    }).best
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
