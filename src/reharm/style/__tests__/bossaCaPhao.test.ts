// Chỉ khóa hành vi ID cũ để mở bài lưu; KHÔNG xác nhận nó đúng với sheet.
// Các số đo onset/tie cũ đã bị bác trong Reference/CA-PHAO-BOSSA-AUDIT.md.
import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'

const CHORDS = parseChordInput('Cmaj7 Fmaj7 Dm7 G7').chords
const dung = () =>
  renderPattern(voiceLeadTwoHands(CHORDS), getStyle('bossa-ca-phao-som')!, { beatsPerChord: 4 })
const tai = (beat: number, hand: 'left' | 'right') =>
  dung().filter((e) => Math.abs(e.startBeat - beat) < 1e-6 && e.hand === hand)

describe('điệu bossa nova Cà Pháo', () => {
  it('tay trái gõ bốn mốc của bản cũ: 1 · 2& · 3 · 4', () => {
    const moc = [...new Set(dung().filter((e) => e.hand === 'left').map((e) => e.startBeat % 4))]
    expect(moc.sort((a, b) => a - b)).toEqual([0, 1.5, 2, 3])
  })

  it('quạt hợp âm năm mốc của bản cũ, có 3,5', () => {
    const moc = [...new Set(dung().filter((e) => e.hand === 'right').map((e) => e.startBeat % 4))]
    expect(moc.sort((a, b) => a - b)).toEqual([0, 1, 2, 2.5, 3.5])
  })

  it('nốt vào sớm ở 3,5 mang hợp âm KẾ TIẾP, không phải hợp âm đang chạy', () => {
    const som = tai(3.5, 'right')
    expect(som).toHaveLength(1)
    expect(som[0]!.som).toBe(true)

    const sau = tai(4, 'right')[0]!
    const dangChay = tai(0, 'right')[0]!
    // Mọi nốt của tiếng vào sớm đều nằm trong hợp âm sắp tới…
    for (const note of som[0]!.notes) expect(sau.notes).toContain(note)
    // …và KHÔNG phải chỉ là hợp âm đang chạy gõ lại.
    expect(som[0]!.notes).not.toEqual(dangChay.notes)
  })

  it('nốt vào sớm mỏng hơn cú quạt ở phách 1', () => {
    expect(tai(3.5, 'right')[0]!.notes.length).toBeLessThan(tai(4, 'right')[0]!.notes.length)
  })

  it('cờ som được đánh dấu để clipToChords chừa ra', () => {
    expect(tai(3.5, 'right')[0]!.som).toBe(true)
    for (const beat of [0, 1, 2, 2.5]) {
      expect(tai(beat, 'right')[0]?.som, `phách ${beat}`).toBeFalsy()
    }
  })

  it('đứng trong họ bossa, không thành họ riêng', () => {
    expect(hoCuaDieu('bossa-ca-phao-som')).toBe('bossa')
    expect(kieuTrongHo('bossa').map((one) => one.id)).toContain('bossa-ca-phao-som')
  })
})
