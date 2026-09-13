import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED, CA_PHAO_BOSSA_TEST_1, laBossaCP } from '../styleLibrary/caPhaoBossa'
import { renderPattern } from '../patternRenderer'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'

/*
  "Bossa test 1" là bản DỰNG LẠI Bossa CP cải tiến từ ghi chép 12/9/2026, làm nút riêng.
  Từ 13/9, CP chính thức đã thêm quãng tám/bass đỡ/lực nhấn theo tai người dùng.
  Test 1 vẫn đối chiếu mốc 12/9, KHÔNG ép khung chính thức quay về bản cũ.
*/
const historicalStyle = { ...CA_PHAO_BOSSA_IMPROVED, cell: {
  ...CA_PHAO_BOSSA_IMPROVED.cell!,
  left: [...CA_PHAO_BOSSA.cell!.left.filter(hit => hit.beat < 4), ...CA_PHAO_BOSSA_IMPROVED.cell!.left.filter(hit => hit.beat >= 4)],
  right: [...CA_PHAO_BOSSA.cell!.right.filter(hit => hit.beat < 4), ...CA_PHAO_BOSSA_IMPROVED.cell!.right.filter(hit => hit.beat >= 4)],
} }
describe('Bossa test 1 — nút dựng lại', () => {
  it('cell tái tạo đúng mốc 12/9, độc lập với khung chính thức 13/9', () => {
    // Cùng tập sự kiện; bản cũ xếp mảng tay trái không theo phách, nên so theo tập.
    const tap = (cell: NonNullable<typeof CA_PHAO_BOSSA_TEST_1.cell>, hand: 'left' | 'right') =>
      cell[hand].map((e) => JSON.stringify(e)).sort()
    expect(tap(CA_PHAO_BOSSA_TEST_1.cell!, 'left')).toEqual(tap(historicalStyle.cell, 'left'))
    expect(tap(CA_PHAO_BOSSA_TEST_1.cell!, 'right')).toEqual(tap(historicalStyle.cell, 'right'))
    expect(CA_PHAO_BOSSA_TEST_1.cell).not.toEqual(CA_PHAO_BOSSA_IMPROVED.cell)
    // Và tiếng phát ra y hệt — thứ tự mảng không đổi kết quả dựng.
    const chords = parseChordInput('Dm7 G7 Cmaj7 Am7').chords
    const dung = (style: typeof historicalStyle) => renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 4 })
      .map((e) => ({ ...e })).sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand) || (a.notes?.join?.(',') ?? '').localeCompare(b.notes?.join?.(',') ?? ''))
    expect(dung({ ...CA_PHAO_BOSSA_TEST_1, cell: CA_PHAO_BOSSA_TEST_1.cell! })).toEqual(dung(historicalStyle))
    expect(CA_PHAO_BOSSA_TEST_1.id).not.toBe(CA_PHAO_BOSSA_IMPROVED.id)
    expect(CA_PHAO_BOSSA_TEST_1.family).not.toBe(CA_PHAO_BOSSA_IMPROVED.family)
    expect(getStyle('ca-phao-bossa-test-1')?.name).toBe('Bossa test 1')
  })
  it('laBossaCP nhận cả hai nút, không nhận điệu khác', () => {
    expect(laBossaCP(CA_PHAO_BOSSA_IMPROVED)).toBe(true)
    expect(laBossaCP('ca-phao-bossa-test-1')).toBe(true)
    expect(laBossaCP(getStyle('ca-phao-bossa-sheet-9-10'))).toBe(false)
    expect(laBossaCP(null)).toBe(false)
  })
  it('intro/giang/outro thứ của test 1 giữ mốc 12/9 (không bật lại ở nút chính thức)', () => {
    const chords = parseChordInput('Am Dm E7 Am').chords
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const make = (id: string) => buildPhraseSection({
        kind, key: { tonic: 9, scale: 'minor' }, style: id === CA_PHAO_BOSSA_IMPROVED.id ? historicalStyle : getStyle(id)!, thay: 'ca-phao',
        beatsPerChord: 4, dropRoot: true, opening: chords[0]!, songChords: chords, solo: () => [], take: 2,
      })
      expect(make('ca-phao-bossa-test-1')).toEqual(make('ca-phao-bossa-improved'))
      expect(make('ca-phao-bossa-test-1')?.events.length ?? 0).toBeGreaterThan(0)
    }
  })
})
