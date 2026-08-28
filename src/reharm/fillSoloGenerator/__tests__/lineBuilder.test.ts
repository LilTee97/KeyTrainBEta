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
  Bộ sinh câu dựng bằng CỌC VÀ NỐI, chạy song song sổ mẫu Licky.

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

describe('bộ sinh cọc-và-nối', () => {
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
    HAI ĐIỆU ĐÃ VÀO HẲN KHOẢNG, sau lượt nắn cỡ bước theo cửa sổ.

    |              | gam | rải | trộn |
    |--------------|-----|-----|------|
    | người thật   | 6-22% | 2-11% | 68-82% |
    | slow rock 3  | 18% | 9%  | 73% |
    | pop-1        | 21% | 10% | 68% |
  */
  it.each(['slow-rock-duc-thinh-3', 'pop-1'] as const)(
    '%s: hình câu vào hẳn khoảng người thật',
    (styleId) => {
      expect(shapeMiss(score(styleId, 'moi'))).toBe(0)
    },
  )

  /*
    BOLERO CÒN LỆCH: 35% gam · 22% rải · 43% trộn.

    Nguyên nhân nằm ở chỗ đóng cọc, không ở đường nối. Cú gõ mạnh của bolero rơi
    vào phách 0 · 0,5 · 2, tức có một cặp cọc chỉ cách nhau NỬA PHÁCH. Khe ấy
    không đủ chỗ cho một nốt nối nào, nên mỗi ô nhịp có một bước cọc-sang-cọc
    trần trụi mà lượt nắn không với tới.

    Ngày nào chỗ này hết lệch thì test đỏ, và lúc ấy gộp bolero vào lưới trên.
  */
  it('bolero còn lệch vì có cặp cọc cách nhau nửa phách', () => {
    expect(shapeMiss(score('bolero-1', 'moi'))).toBeGreaterThan(0)
    expect(accentBeats(getStyle('bolero-1')!)).toContain(0.5)
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
