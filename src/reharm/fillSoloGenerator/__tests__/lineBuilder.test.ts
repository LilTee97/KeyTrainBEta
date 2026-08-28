import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../../style/styleLibrary'
import { accentBeats } from '../../style/soloLeftHand'
import { bluesChoice, suggestScales } from '../../style/phraseScale'
import { generateSolo } from '../soloGenerator'
import { pulseForStyle, soloFeelFor } from '../soloFeel'
import { buildLine } from '../lineBuilder'
import { CA_PHAO_RANGE, profileLine, within, type LineProfile } from '../styleProfile'

/*
  Bộ sinh câu dựng bằng NHỊP TRƯỚC, chạy song song sổ mẫu Licky.

  Chưa thay mặc định. Điều kiện đặt ra từ đầu là hai bộ cùng bị một cái thước
  chấm, rồi mới nói bộ nào hơn — không đổi vì cảm giác.
*/

const KEY = { tonic: 9 as const, scale: 'minor' as const }
const SONG = 'Am Dm E7 Am F G C E7 Am F Dm E7 Am C G Am'
const STYLES = ['slow-rock-duc-thinh-3', 'bossa-nova-1', 'bolero-1', 'pop-1'] as const
const TAKES = 16

function setup(styleId: string) {
  const style = getStyle(styleId)!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const chords = parseChordInput(SONG).chords
  const scale = (suggestScales(chords, KEY)[0] ?? bluesChoice(KEY)!).pitchClasses
  return { bar, chords, scale, anchors: accentBeats(style) }
}

function score(styleId: string, kind: 'moi' | 'licky'): LineProfile {
  const { bar, chords, scale, anchors } = setup(styleId)
  const pulse = pulseForStyle(styleId)
  const notes: { startBeat: number; note: number }[] = []

  for (let take = 0; take < TAKES; take += 1) {
    const offset = take * chords.length * bar
    const line =
      kind === 'moi'
        ? buildLine({
            chords,
            beatsPerChord: bar,
            barBeats: bar,
            anchors,
            scale,
            range: { low: 60, high: 84 },
            take,
          })
        : generateSolo(chords, {
            beatsPerChord: bar,
            density: 'medium',
            key: KEY,
            take,
            interlude: true,
            noteSource: 'keyPentatonic',
            singleScale: scale,
            feel: soloFeelFor(styleId),
            ...(pulse.length > 0 ? { pulse, pulseBar: bar } : {}),
          })
    for (const note of line) {
      notes.push({ startBeat: note.startBeat + offset, note: note.note })
    }
  }

  return profileLine({
    notes,
    chords: Array.from({ length: TAKES }, () => chords).flat(),
    beatsPerChord: bar,
    pulse: anchors,
    beatsPerBar: bar,
  })
}

/** Lệch bao xa khỏi khoảng người thật; 0 là nằm trong khoảng. */
const miss = (value: number, range: readonly [number, number]) =>
  value < range[0] ? range[0] - value : value > range[1] ? value - range[1] : 0

const shapeMiss = (profile: LineProfile) =>
  miss(profile.scale, CA_PHAO_RANGE.scale) +
  miss(profile.arpeggio, CA_PHAO_RANGE.arpeggio) +
  miss(profile.mixed, CA_PHAO_RANGE.mixed)

describe('bộ sinh nhịp-trước', () => {
  /*
    BA CHỈ SỐ NHỊP, cái mà bản trước hỏng và cái thước lúc ấy chưa nhìn ra.

    Bản chia đều đạt 16 trên 24 chỉ số hình câu rồi bị tai người dùng bác thẳng:
    "nghe loạn quá". Đo lại bằng thước có mắt nhìn nhịp:

    |               | cỡ nhịp | móc đơn | im lặng |
    |---------------|---------|---------|---------|
    | người thật    | 7-22    | 25-74%  | có      |
    | bản chia đều  | 3-4     | 14-39%  | 0%      |
    | nhịp-trước    | 10      | 63-66%  | 4-6%    |
  */
  it.each(STYLES)('%s: số cỡ nhịp đúng khoảng người thật', (styleId) => {
    expect(within(score(styleId, 'moi').rhythmSizes, CA_PHAO_RANGE.rhythmSizes)).toBe(true)
  })

  it.each(STYLES)('%s: tỉ lệ móc đơn đúng khoảng người thật', (styleId) => {
    expect(within(score(styleId, 'moi').eighthShare, CA_PHAO_RANGE.eighthShare)).toBe(true)
  })

  /*
    Phải có chỗ NGHỈ THẬT. Bản trước đo ra 0%: chỗ "thở" của nó chỉ bỏ một nốt
    nối, còn cọc vẫn gõ đều nên khe không bao giờ đủ rộng để tai nghe ra.
  */
  it.each(STYLES)('%s: có chỗ nghỉ thật, không chạy liền một mạch', (styleId) => {
    expect(score(styleId, 'moi').silence).toBeGreaterThan(0.02)
  })

  /*
    Lặp hình phải là motif THẬT — câu đáp lặp lại hình nhịp câu hỏi, đổi cao độ.

    Bản trước cũng đo ra 60%, nằm trong khoảng người thật, nhưng con số ấy nói
    dối: nó chỉ có ba cỡ nhịp nên trùng hình là đương nhiên. Chỉ số đã sửa để
    đếm cả nhịp lẫn cao độ, và giờ 37-41% là lặp có chủ ý.
  */
  it.each(STYLES)('%s: lặp hình đúng khoảng người thật', (styleId) => {
    expect(within(score(styleId, 'moi').motifReuse, CA_PHAO_RANGE.motifReuse)).toBe(true)
  })

  it.each(STYLES)('%s: câu dài đúng một hơi người thật', (styleId) => {
    expect(within(score(styleId, 'moi').medianRunLength, CA_PHAO_RANGE.medianRunLength)).toBe(true)
  })

  /*
    Cọc KHÔNG phải lúc nào cũng là nốt hợp âm — người thật chỉ 41-69%. Bản đầu
    cho cọc luôn là nốt hợp âm và đo ra 100%: mọi chỗ đều thuận tai từ đầu tới
    cuối, tức không còn chỗ nào căng để giải toả.
  */
  it.each(STYLES)('%s: nốt hợp âm ở phách mạnh đúng khoảng người thật', (styleId) => {
    expect(within(score(styleId, 'moi').chordToneOnPulse, CA_PHAO_RANGE.chordToneOnPulse)).toBe(true)
  })

  /*
    HÌNH CÂU: bộ mới gần người thật hơn sổ mẫu, nhưng CHƯA vào khoảng.

    Đo cùng một gam, mười sáu lượt:

    |            | gam    | rải    | trộn   |
    |------------|--------|--------|--------|
    | người thật | 6-22%  | 2-11%  | 68-82% |
    | cọc-và-nối | 24-46% | 14-28% | 30-48% |
    | sổ Licky   | 74-99% | 0-2%   | 1-24%  |

    Sổ mẫu gần như chỉ ra câu gam thuần vì nó tô một hình quãng có sẵn lên thang
    nốt. Bộ mới trộn được hai cỡ bước, nhưng phần PHA TRỘN vẫn thiếu: khoảng
    giữa hai cọc thì luân phiên đều, còn khoảng CỌC SANG CỌC thì chưa nắn — đo
    ra trung bình 3,7 nửa cung với một nửa là bước nhảy xa.

    Test này khoá chiều tiến bộ, không khoá con số: bộ mới phải gần khoảng người
    thật hơn sổ mẫu. Ngày nào nó vào hẳn khoảng thì đổi test sang `within`.
  */
  it.each(STYLES)('%s: hình câu gần người thật hơn sổ mẫu Licky', (styleId) => {
    expect(shapeMiss(score(styleId, 'moi'))).toBeLessThan(shapeMiss(score(styleId, 'licky')))
  })

  /*
    CỠ BƯỚC ĐÃ VÀO KHOẢNG, cả bốn điệu.

    Bước liền bậc 13-16%, người thật 6-22%. Có được nhờ hai chỗ cắt cùng chỗ với
    cái thước: lượt nắn quên hết mỗi khi sang câu mới, và phép luân phiên hẹp /
    rộng đếm lại từ mỗi cọc. Trước khi cắt đúng chỗ thì con số này là 23-31%.
  */
  it.each(STYLES)('%s: cỡ bước liền bậc đúng khoảng người thật', (styleId) => {
    expect(within(score(styleId, 'moi').scale, CA_PHAO_RANGE.scale)).toBe(true)
  })

  /*
    CÒN LỆCH MỘT CHỖ: câu rải thuần 15-19%, người thật 2-11%.

    Bản chia đều từng đạt 9-10% ở chỗ này. Đổi sang dựng nhịp trước thì câu ngắn
    lại — 6-7 nốt thay vì 8 — nên mỗi câu chỉ còn bốn năm bước, và một bước
    cọc-sang-cọc rộng đã kéo được cả câu sang "rải". Cọc lấy nốt hợp âm, mà nốt
    hợp âm cách nhau quãng ba.

    Ghi lại thành test để nó không lặng lẽ tệ thêm, và để lần sau biết chỗ này
    chưa xong. Đã thử ép bước ngay sau cọc phải hẹp: rải xuống còn 13-16% nhưng
    liền bậc vọt lên 23-26% và pha trộn tụt — đổi chỗ lệch này lấy chỗ lệch kia.
  */
  it.each(STYLES)('%s: câu rải còn nhiều hơn người thật', (styleId) => {
    const shape = score(styleId, 'moi').arpeggio
    expect(shape).toBeGreaterThan(CA_PHAO_RANGE.arpeggio[1])
    expect(shape).toBeLessThan(0.25)
  })

  it('bolero hết lệch riêng, dù có cặp cọc cách nhau nửa phách', () => {
    expect(accentBeats(getStyle('bolero-1')!)).toContain(0.5)
    expect(within(score('bolero-1', 'moi').scale, CA_PHAO_RANGE.scale)).toBe(true)
  })

  it('mỗi lượt cho một đường khác nhau', () => {
    const { chords, bar, scale, anchors } = setup('pop-1')
    const of = (take: number) =>
      buildLine({ chords, beatsPerChord: bar, barBeats: bar, anchors, scale, range: { low: 60, high: 84 }, take })
        .map((note) => note.note)
        .join()
    expect(of(0)).not.toBe(of(1))
    expect(of(3)).toBe(of(3))
  })

  it('mọi nốt nằm trong gam đã chọn và trong tầm', () => {
    for (const styleId of STYLES) {
      const { chords, bar, scale, anchors } = setup(styleId)
      for (const note of buildLine({ chords, beatsPerChord: bar, barBeats: bar, anchors, scale, range: { low: 60, high: 84 }, take: 5 })) {
        expect(scale, `${styleId} nốt lạ`).toContain(((note.note % 12) + 12) % 12)
        expect(note.note).toBeGreaterThanOrEqual(60)
        expect(note.note).toBeLessThanOrEqual(84)
      }
    }
  })
})
