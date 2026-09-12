import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { CA_PHAO_BOSSA_IMPROVED, CA_PHAO_BOSSA_TEST_1, laBossaCP } from '../styleLibrary/caPhaoBossa'
import { renderPattern } from '../patternRenderer'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'

/*
  "Bossa test 1" là bản DỰNG LẠI Bossa CP cải tiến từ ghi chép 12/9/2026, làm nút riêng.
  Kiểm: (1) cell tái tạo đúng bằng bản đã duyệt — nếu sau này người dùng đổi test 1 thì
  sửa kỳ vọng này, đừng sửa bản cũ; (2) mọi cổng nhận diện đi qua laBossaCP nên nút mới
  ra đúng intro/giang/outro thứ như nút cũ.
*/
describe('Bossa test 1 — nút dựng lại', () => {
  it('cell tái tạo bằng đúng cell đã duyệt, chỉ khác id/tên/họ', () => {
    // Cùng tập sự kiện; bản cũ xếp mảng tay trái không theo phách, nên so theo tập.
    const tap = (cell: NonNullable<typeof CA_PHAO_BOSSA_TEST_1.cell>, hand: 'left' | 'right') =>
      cell[hand].map((e) => JSON.stringify(e)).sort()
    expect(tap(CA_PHAO_BOSSA_TEST_1.cell!, 'left')).toEqual(tap(CA_PHAO_BOSSA_IMPROVED.cell!, 'left'))
    expect(tap(CA_PHAO_BOSSA_TEST_1.cell!, 'right')).toEqual(tap(CA_PHAO_BOSSA_IMPROVED.cell!, 'right'))
    // Và tiếng phát ra y hệt — thứ tự mảng không đổi kết quả dựng.
    const chords = parseChordInput('Dm7 G7 Cmaj7 Am7').chords
    const dung = (id: string) => renderPattern(voiceLeadTwoHands(chords), getStyle(id)!, { beatsPerChord: 4 })
      .map((e) => ({ ...e })).sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand) || (a.notes?.join?.(',') ?? '').localeCompare(b.notes?.join?.(',') ?? ''))
    expect(dung('ca-phao-bossa-test-1')).toEqual(dung('ca-phao-bossa-improved'))
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
  it('intro/giang/outro thứ của test 1 giống hệt nút cũ (cùng take)', () => {
    const chords = parseChordInput('Am Dm E7 Am').chords
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const make = (id: string) => buildPhraseSection({
        kind, key: { tonic: 9, scale: 'minor' }, style: getStyle(id)!, thay: 'ca-phao',
        beatsPerChord: 4, dropRoot: true, opening: chords[0]!, songChords: chords, solo: () => [], take: 2,
      })
      expect(make('ca-phao-bossa-test-1')).toEqual(make('ca-phao-bossa-improved'))
      expect(make('ca-phao-bossa-test-1')?.events.length ?? 0).toBeGreaterThan(0)
    }
  })
})
