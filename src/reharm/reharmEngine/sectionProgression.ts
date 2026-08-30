import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ChordSpan } from '../chordTiming'
import type { ParsedChord } from '../types'
import { analyzeInKey } from './degreeAnalysis'
import { detectKey, isAmbiguous, type KeyCandidate } from './keyDetection'

/**
 * VÒNG HOÀ THANH của cả bài và của TỪNG ĐOẠN.
 *
 * Trước đây app chỉ dò giọng cho cả bản: cả hai chỗ gọi `detectKey` đều truyền
 * vào vòng hợp âm của toàn bài. Bài nào điệp khúc ngả sang giọng khác thì bậc
 * La Mã của đoạn ấy sai vai trò — hợp âm đang là chủ âm của đoạn bị đọc thành
 * bậc sáu, và mọi luật tái hoà âm phía sau chạy theo cái sai ấy.
 */

/**
 * KHUNG HỢP ÂM: bỏ hợp âm nửa ô, chỉ giữ hợp âm đứng ở vạch nhịp.
 *
 * Luật của người dùng: gặp cặp hợp âm chia đôi ô thì chỉ tính bậc cho hợp âm
 * ĐẦU cặp. `Am - Em` trong một ô là bậc của `Am`, còn `Em` là màu đi qua chứ
 * không phải một bậc riêng trong vòng.
 *
 * Vì sao đúng: hợp âm nửa ô sau thường là hợp âm nối hoặc đảo của chính hợp âm
 * đầu. Đếm nó thành một bậc thì vòng bốn ô `Am F C G` bị đọc thành vòng tám
 * bậc, và phép tìm chu kỳ lặp ở dưới không bao giờ khớp.
 *
 * Cách nhận: giữ span nào KHỞI HÀNH đúng vạch nhịp. Hợp âm ngân qua nhiều ô
 * chỉ được đếm một lần vì nó chỉ khởi hành một lần; hợp âm rơi vào giữa ô bị
 * bỏ, kể cả khi ô ấy chia ba hay chia tư chứ không riêng chia đôi.
 */
export function khungHopAm(
  spans: readonly ChordSpan[],
  barBeats: number,
): ChordSpan[] {
  if (barBeats <= 0) return [...spans]
  /*
    Vạch nhịp đếm từ hợp âm ĐẦU KHOẢNG, không từ đầu bài.

    Một đoạn mở ra giữa ô — bài có nhịp lấy đà, hoặc người dùng quét nhãn lệch
    một hợp âm — mà đếm theo mốc cả bài thì chính hợp âm mở đoạn bị bỏ, và đoạn
    ấy mất bậc đầu tiên của nó. Đếm theo mốc riêng thì hợp âm mở đoạn luôn có
    mặt; hai lối chỉ khác nhau ở đúng ca lệch ấy.
  */
  const goc = spans[0]?.start ?? 0
  const tren = spans.filter(
    (span) => Math.abs((span.start - goc) % barBeats) < 1e-6,
  )
  // Cả đoạn không có nốt nào rơi đúng vạch là chuyện không xảy ra, nhưng đừng
  // trả về vòng rỗng rồi để phía sau tưởng đoạn này không có hợp âm.
  return tren.length > 0 ? tren : [...spans]
}

export interface VongHoaThanh {
  /** Giọng khớp nhất của riêng khoảng này. */
  key: KeyCandidate | null
  /** App có đang phân vân giữa hai giọng sát điểm không. */
  phanVan: boolean
  /** Hợp âm khung, đã bỏ hợp âm nửa ô. */
  chords: ParsedChord[]
  /** Bậc của từng hợp âm khung; `null` là hợp âm ngoài giọng. */
  bac: (number | null)[]
  /** Ký hiệu bậc La Mã của từng hợp âm khung. */
  roman: string[]
  /**
   * Độ dài chu kỳ lặp, tính bằng số hợp âm khung. Bằng 0 khi không thấy vòng
   * nào lặp lại.
   */
  lap: number
  /** Vòng gọn để bày ra, ví dụ `1-6-4-5`. Rỗng khi có bậc nằm ngoài giọng. */
  ten: string
}

/**
 * Chu kỳ lặp ngắn nhất của một dãy bậc.
 *
 * Đuôi dở dang vẫn tính là khớp: phiên khúc `Am F C G Am F C G Am` lặp bốn, ô
 * `Am` cuối là mở đầu vòng thứ ba chứ không phải bằng chứng chống lại nó.
 *
 * Yêu cầu dãy phải chạy trọn ÍT NHẤT HAI vòng, nếu không thì mọi dãy đều "lặp"
 * với chu kỳ bằng chính nó.
 */
function chuKy(bac: readonly (number | null)[]): number {
  for (let dai = 1; dai * 2 <= bac.length; dai += 1) {
    let khop = true
    for (let at = dai; at < bac.length && khop; at += 1) {
      if (bac[at] !== bac[at - dai]) khop = false
    }
    if (khop) return dai
  }
  return 0
}

/**
 * Dò vòng hoà thanh của một khoảng hợp âm.
 *
 * Dò giọng RIÊNG cho khoảng này, không nhận giọng của cả bài truyền xuống —
 * đó chính là chỗ để bắt được điệp khúc chuyển giọng. Trọng số vẫn là số phách
 * mỗi hợp âm khung ngân, nên hợp âm trụ nói lên giọng nhiều hơn hợp âm lướt.
 */
export function doVongHoaThanh(
  spans: readonly ChordSpan[],
  barBeats: number,
): VongHoaThanh {
  const khung = khungHopAm(spans, barBeats)
  const chords = khung.map((span) => span.chord)
  if (chords.length === 0) {
    return { key: null, phanVan: false, chords: [], bac: [], roman: [], lap: 0, ten: '' }
  }

  const ungVien = detectKey(chords, { beats: khung.map((span) => span.beats) })
  const key = ungVien[0] ?? null
  if (!key) {
    return { key: null, phanVan: false, chords, bac: [], roman: [], lap: 0, ten: '' }
  }

  const doc = analyzeInKey(chords, key.tonic, key.scale)
  const bac = doc.map((one) => one.degree)

  return {
    key,
    phanVan: isAmbiguous(ungVien),
    chords,
    bac,
    roman: doc.map((one) => one.roman),
    lap: chuKy(bac),
    ten: bac.every((one) => one !== null)
      ? bac.slice(0, chuKy(bac) || bac.length).join('-')
      : '',
  }
}

/**
 * MỘT LƯỢT của vòng — dùng làm hợp âm cho đoạn dạo đầu.
 *
 * Thấy chu kỳ thì cắt đúng một lượt; không thấy thì trả cả khung. Người dùng
 * đặt luật: dạo đầu dựng TRÊN vòng hợp âm của phiên khúc, không nhặt bừa vài
 * hợp âm trong đoạn ấy.
 */
export function motLuot(vong: VongHoaThanh): ParsedChord[] {
  return vong.lap > 0 ? vong.chords.slice(0, vong.lap) : [...vong.chords]
}

/** Giọng của khoảng này có khác giọng cả bài không, và có đáng tin không. */
export function doiGiong(
  doan: VongHoaThanh,
  caBai: { tonic: PitchClass; scale: ScaleType } | null,
): boolean {
  if (!doan.key || !caBai || doan.phanVan) return false
  return doan.key.tonic !== caBai.tonic || doan.key.scale !== caBai.scale
}
