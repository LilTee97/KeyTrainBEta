import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { accentBeats } from '../../style/soloLeftHand'
import { suggestScales } from '../../style/phraseScale'
import { getStyle } from '../../style/styleLibrary'
import { buildLine, type LineNote } from '../lineBuilder'

/*
  RẢI MỞ RỘNG — lối tay phải ở đoạn giang tấu.

  Đo trên mười ô giang tấu bản ký âm Linh Nhi, và nó ngược hẳn dự đoán: giang
  tấu KHÔNG phải chạy ngón nhanh. Móc kép GIẢM năm lần (30% xuống 6%), thay vào
  đó là nhảy quãng rộng và chồng nhiều nốt, trải hơn hai quãng tám.

  |                 | phiên khúc | giang tấu |
  |-----------------|-----------|-----------|
  | bước nhảy xa    | 16%       | 57%       |
  | quãng ba        | 34%       | 17%       |
  | liền bậc        | 34%       | 16%       |
  | cú gõ chồng nốt | 17%       | 36%       |
  | tầm             | 52-83     | 57-95     |

  CỠ MẪU: một bài, một người soạn, một đoạn mười ô, và là bản độc tấu nên tay
  phải không phải nhường ai. Đây là lối chơi CỦA ĐOẠN NÀY, chưa phải luật chung
  của giang tấu bolero.
*/

const KEY = { tonic: 2 as const, scale: 'major' as const }
const CHORDS = parseChordInput('Bm F#m Em D Bm Em F#m D A').chords
const STYLE = getStyle('bolero-linh-nhi-2')!

function dung(moRong: boolean, take = 0): LineNote[] {
  return buildLine({
    chords: CHORDS,
    beatsPerChord: STYLE.beatsPerMeasure,
    barBeats: STYLE.beatsPerMeasure,
    anchors: accentBeats(STYLE),
    scale: suggestScales(CHORDS, KEY)[0]!.pitchClasses,
    range: { low: 57, high: 79 },
    take,
    moRong,
  })
}

/**
 * Cỡ bước giữa hai CHỖ GÕ liền nhau.
 *
 * Bỏ những cặp cùng một chỗ gõ — đó là nốt CHỒNG, không phải một bước. Phép đo
 * đầu tiên của tôi quét từng cặp liền nhau trong mảng và đếm nốt chồng thành
 * "bước quãng ba", nên nó báo 41% nhảy xa trong khi thật ra là 57%. Suýt nữa
 * tôi vặn bộ sinh để chữa một lỗi nằm ở cái thước.
 */
function buoc(line: readonly LineNote[]): number[] {
  const out: number[] = []
  for (let at = 1; at < line.length; at += 1) {
    if (line[at]!.startBeat === line[at - 1]!.startBeat) continue
    const xa = Math.abs(line[at]!.note - line[at - 1]!.note)
    if (xa > 0) out.push(xa)
  }
  return out
}

const gop = (moRong: boolean) =>
  Array.from({ length: 12 }, (_, take) => dung(moRong, take)).flatMap(buoc)

const ti = (xs: readonly number[], loc: (x: number) => boolean) =>
  xs.filter(loc).length / xs.length

describe('rải mở rộng đạt phân bố của bản ký âm', () => {
  it('phần lớn là bước nhảy xa', () => {
    expect(ti(gop(true), (x) => x >= 7)).toBeGreaterThan(0.45)
  })

  it('liền bậc còn ít, đúng như bản gốc', () => {
    expect(ti(gop(true), (x) => x <= 2)).toBeLessThan(0.28)
  })

  it('lối thường thì NGƯỢC HẲN — đây là chỗ hai lối khác nhau', () => {
    const thuong = gop(false)
    expect(ti(thuong, (x) => x >= 7)).toBeLessThan(0.1)
    expect(ti(thuong, (x) => x <= 2)).toBeGreaterThan(0.4)
  })

  it('chồng nốt đúng khoảng đo được', () => {
    let chong = 0
    for (let take = 0; take < 12; take += 1) {
      const at = new Map<number, number>()
      for (const n of dung(true, take)) at.set(n.startBeat, (at.get(n.startBeat) ?? 0) + 1)
      chong += [...at.values()].filter((v) => v > 1).length / at.size
    }
    expect(chong / 12).toBeGreaterThan(0.25)
    expect(chong / 12).toBeLessThan(0.45)
  })

  it('lối thường không chồng nốt bao giờ', () => {
    for (let take = 0; take < 6; take += 1) {
      const at = new Set<number>()
      const line = dung(false, take)
      for (const n of line) at.add(n.startBeat)
      expect(at.size).toBe(line.length)
    }
  })

  /*
    Nới trần CHỈ trong chế độ này. Con số 79 đến từ bảy bản ký âm Cà Pháo; con
    số 95 từ MỘT bài. Lấy một bài đè lên bảy bài là đi lùi, nên trần cũ giữ
    nguyên cho mọi lối khác.
  */
  it('nới trần chỉ khi mở rộng', () => {
    const cao = Math.max(...Array.from({ length: 12 }, (_, t) => dung(true, t)).flat().map((n) => n.note))
    const thuong = Math.max(...Array.from({ length: 12 }, (_, t) => dung(false, t)).flat().map((n) => n.note))
    expect(cao).toBeGreaterThan(79)
    expect(thuong).toBeLessThanOrEqual(79)
  })

  it('mọi nốt vẫn nằm trong gam đã chọn', () => {
    const gam = suggestScales(CHORDS, KEY)[0]!.pitchClasses
    for (const n of dung(true, 3)) expect(gam).toContain(((n.note % 12) + 12) % 12)
  })
})
