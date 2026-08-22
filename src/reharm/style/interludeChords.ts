import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import type { ParsedChord } from '../types'

/**
 * Rút hợp âm về **tính chất cơ bản** cho đoạn giang tấu.
 *
 * Đoạn có lời giữ nguyên bảng màu đã chọn cho cả bài — chỗ này không đụng tới.
 * Nhưng giang tấu là chỗ ngẫu hứng: tai người nghe bám vào đường giai điệu chứ
 * không bám vào màu hợp âm. Chồng add9, 6/9, 13 hay hợp âm giảm lên nền solo thì
 * nốt ngoài giọng nhiều tới mức câu chạy nghe lạc, và người đệm mất chỗ tựa.
 *
 * Luật gốc nằm ở kho PianoBrain, item `rule-interlude-plain-harmony`. Bảng dưới
 * đây là chỗ thi hành nó.
 *
 * Ba nhóm rút gọn:
 *
 * - **Hợp âm bảy biến âm** (7b9, 7#5, 13b9…) rút về bảy thường. Lực kéo về chủ
 *   âm nằm ở quãng ba cung của hợp âm bảy, không nằm ở nốt biến âm.
 * - **Màu thêm nốt** (add9, 6/9, 9, 11, 13) rút về ba nốt hoặc về bảy. Chúng là
 *   màu, không phải chức năng.
 * - **Hợp âm giảm** rút về nửa giảm — dạng duy nhất của họ giảm mà luật cho
 *   phép, vì bậc hai giáng năm là hợp âm có thật trong vòng, còn hợp âm giảm
 *   đầy đủ thì mỗi nốt cách nhau đều nhau nên không neo được câu solo vào đâu.
 */
const PLAIN_QUALITY: Readonly<Record<string, string>> = {
  add9: 'maj',
  '6': 'maj',
  '69': 'maj',
  aug: 'maj',
  madd9: 'min',
  m6: 'min',
  maj9: 'maj7',
  maj13: 'maj7',
  'maj7#11': 'maj7',
  mMaj7: 'm7',
  m9: 'm7',
  m11: 'm7',
  m13: 'm7',
  '9': '7',
  '11': '7',
  '13': '7',
  '7b5': '7',
  '7#5': '7',
  '7b9': '7',
  '7#9': '7',
  '7#11': '7',
  '7b13': '7',
  '13b9': '7',
  dim: 'm7b5',
  dim7: 'm7b5',
  '9sus4': 'sus4',
  '13sus4': 'sus4',
  '7b9sus4': 'sus4',
}

/** Những tính chất được giữ nguyên: đã đủ cơ bản. */
const KEEP = new Set(['maj', 'min', '7', 'maj7', 'm7', 'm7b5', 'sus2', 'sus4', '7sus4'])

/** Tính chất này dùng thẳng cho giang tấu được chưa. */
export function isPlainInterludeQuality(qualityId: string): boolean {
  return KEEP.has(qualityId)
}

/**
 * Hợp âm dùng cho giang tấu.
 *
 * Không nhận ra tính chất thì **giữ nguyên** chứ không đoán: thà để một màu lạ
 * lọt qua còn hơn rút nhầm thành hợp âm khác hẳn.
 */
export function plainForInterlude(chord: ParsedChord): ParsedChord {
  const id = chord.quality.id
  if (KEEP.has(id)) return chord

  const target = PLAIN_QUALITY[id]
  if (!target) return chord

  const quality = getChordQuality(target)
  if (!quality) return chord

  const symbol = chord.symbol.replace(chord.quality.symbol, quality.symbol)
  return { ...chord, quality, symbol: symbol || `${chord.symbol}` }
}
