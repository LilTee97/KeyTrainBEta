import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ParsedChord } from '../types'
import type { AnalyzedChord } from './degreeAnalysis'

/** Chỉ màu hóa triad; giữ màu/đảo bass người dùng đã ghi trong bản gốc.
 * Bossa: Người hãy quên ô 9,10,43 (m9/m11); ballad: Chúng Ta / Chưa Bao Giờ
 * (i7, iv7, v thứ). Trưởng: Có Em Chờ 1–4, Ngày Mai 35–37 (maj7, m7, V7).
 * Chưa có giai điệu hát đầu vào để quyết định mọi tension: V mặc định 7.
 */
export function colorCaPhao(
  analyzed: AnalyzedChord,
  minor: boolean,
  genre: 'ballad' | 'bossa' = 'ballad',
): ParsedChord {
  const { chord, degree, actsAsDominant } = analyzed
  let target = chord.quality.id
  if (target === 'min') {
    target = genre === 'bossa' && degree === 1 && minor ? 'm9'
      : genre === 'bossa' && degree === 4 && minor ? 'm11' : 'm7'
  } else if (target === 'maj') {
    // G→C trong Am là V/bIII; G không về C vẫn có thể là bVII trơn.
    target = actsAsDominant || degree === 5 ? '7'
      : degree !== null && (minor ? degree === 3 || degree === 6 : degree === 1 || degree === 4)
        ? 'maj7' : 'maj'
  } else if (target === 'dim' && minor && degree === 2) target = 'm7b5'
  const quality = getChordQuality(target) ?? chord.quality
  const symbol = pitchClassName(chord.root) + quality.symbol +
    (chord.bass === undefined ? '' : '/' + pitchClassName(chord.bass))
  return { ...chord, quality, symbol, voicingStyle: 'ca-phao' }
}

/** Quãng RH từ gốc: các thế cụ thể và biến thể rút gọn từ sheet, không là
 * "hợp âm ba / bass" giả tương đương. Phần bass giữ nguyên root/slash thực.
 * m9: Người hãy quên 9 C–E–F–A/D; m11: ô 43 C–E–G/D, KT thêm b3 từ ô 9.
 * maj9: Có Em Chờ 1 G–Bb–C/Ab; maj7: Hongkong 1, rút bộ 3–5–7.
 * 7/7b13/9: Người hãy quên 97; m7b5: ô 48. Các màu chưa đo dùng bộ chung.
 */
export const CA_PHAO_VOICINGS: Readonly<Record<string, readonly number[]>> = {
  maj: [4, 7, 12], min: [3, 7, 12],
  maj7: [4, 7, 11], maj9: [11, 14, 16], add9: [7, 14, 16],
  m7: [3, 7, 10], m9: [10, 14, 15, 19], m11: [10, 14, 15, 17],
  '7': [4, 7, 10], '9': [4, 10, 14], '7b13': [10, 16, 20],
  m7b5: [3, 6, 10],
}
