import { scaleFor } from '@pianobrain/mrhai/scaleFor.js'
import { brain, brainReady } from './index'
import { formatChordSymbol } from '../../shared/musicTheory/chordDetection'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { SongKey } from '../fillSoloGenerator/soloVocabulary'
import type { ParsedChord } from '../types'

/**
 * Giọng của bài, viết theo lối bộ não đọc được: `"C"`, `"Am"`.
 *
 * Não cần giọng để chọn **bậc thể** cho hợp âm ba nốt mở rộng. Cùng một chất,
 * hai nốt gốc, hai gam khác nhau: trong giọng Đô thì `Am(add9)` chạy La thứ tự
 * nhiên còn `Dm(add9)` chạy Rê Dorian — Dorian trên La cho Fa thăng, Aeolian
 * trên Rê cho Si giáng, cả hai đều lạc giọng. Không nói giọng cho não thì nó
 * đành im, vì im còn hơn kêu lạc.
 */
function keyText(key: SongKey | null | undefined): string | null {
  if (!key) return null
  return `${pitchClassName(key.tonic, 'flat')}${key.scale === 'minor' ? 'm' : ''}`
}

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
export function scaleForChord(
  chord: ParsedChord,
  key?: SongKey | null,
): PitchClass[] | null {
  if (!brainReady()) return null
  try {
    const answer = scaleFor(formatChordSymbol(chord.root, chord.quality), brain(), {
      requireValidated: true,
      key: keyText(key),
    })
    const pitches = answer.best?.pitch_classes
    return pitches && pitches.length > 0 ? (pitches as PitchClass[]) : null
  } catch {
    return null
  }
}

/** Tên gam kho chọn cho hợp âm, để hiện khi giang tấu / rải. */
export function scaleLabelForSymbol(
  symbol: string,
  key?: SongKey | null,
): string | null {
  if (!brainReady()) return null
  try {
    const answer = scaleFor(symbol, brain(), {
      requireValidated: true,
      key: keyText(key),
    })
    return answer.best?.label ?? answer.best?.name ?? null
  } catch {
    return null
  }
}

export function scaleLabelForChord(
  chord: ParsedChord,
  key?: SongKey | null,
): string | null {
  return scaleLabelForSymbol(formatChordSymbol(chord.root, chord.quality), key)
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
export function scaleGaps(
  chords: readonly ParsedChord[],
  key?: SongKey | null,
): string[] {
  const gaps: string[] = []
  for (const chord of chords) {
    if (scaleForChord(chord, key)) continue
    const symbol = formatChordSymbol(chord.root, chord.quality)
    if (!gaps.includes(symbol)) gaps.push(symbol)
  }
  return gaps
}

/** Tên gam và mốc nguồn, để giao diện dẫn được thầy nào dạy chỗ này. */
export function scaleCredit(
  chord: ParsedChord,
  key?: SongKey | null,
): { label: string; itemId: string; sourceId: string; locator: string | null } | null {
  if (!brainReady()) return null
  try {
    const best = scaleFor(formatChordSymbol(chord.root, chord.quality), brain(), {
      requireValidated: true,
      key: keyText(key),
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
