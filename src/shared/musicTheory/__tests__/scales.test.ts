import { describe, expect, it } from 'vitest'
import { getChordQuality } from '../chordDefinitions'
import {
  MAJOR_DEGREES,
  MINOR_DEGREES,
  chordAtDegree,
  degreesOf,
  diatonicChords,
  romanFor,
} from '../scales'

describe('bảng bậc', () => {
  it('cả hai gam đều có bảy bậc', () => {
    expect(MAJOR_DEGREES).toHaveLength(7)
    expect(MINOR_DEGREES).toHaveLength(7)
  })

  it('bậc được đánh số liên tục từ 1 tới 7', () => {
    for (const table of [MAJOR_DEGREES, MINOR_DEGREES]) {
      expect(table.map((entry) => entry.degree)).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('khoảng cách nửa cung đúng với gam trưởng', () => {
    expect(MAJOR_DEGREES.map((entry) => entry.semitones)).toEqual([
      0, 2, 4, 5, 7, 9, 11,
    ])
  })

  it('khoảng cách nửa cung đúng với gam thứ tự nhiên', () => {
    expect(MINOR_DEGREES.map((entry) => entry.semitones)).toEqual([
      0, 2, 3, 5, 7, 8, 10,
    ])
  })

  it('mọi tính chất hợp âm trong bảng đều tồn tại', () => {
    for (const table of [MAJOR_DEGREES, MINOR_DEGREES]) {
      for (const entry of table) {
        expect(getChordQuality(entry.triadQualityId)).toBeDefined()
        expect(getChordQuality(entry.seventhQualityId)).toBeDefined()
      }
    }
  })

  it('gam trưởng chỉ có đúng một bậc là hợp âm bảy át', () => {
    const dominants = MAJOR_DEGREES.filter(
      (entry) => entry.seventhQualityId === '7',
    )
    expect(dominants).toHaveLength(1)
    expect(dominants[0].degree).toBe(5)
  })

  it('degreesOf trả về đúng bảng theo gam', () => {
    expect(degreesOf('major')).toBe(MAJOR_DEGREES)
    expect(degreesOf('minor')).toBe(MINOR_DEGREES)
  })
})

describe('chordAtDegree', () => {
  it('dựng đúng hợp âm ba của giọng đô trưởng', () => {
    const symbols = [1, 2, 3, 4, 5, 6, 7].map(
      (degree) => chordAtDegree(0, 'major', degree)?.symbol,
    )
    expect(symbols).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
  })

  it('dựng đúng hợp âm bảy của giọng đô trưởng', () => {
    const symbols = [1, 2, 3, 4, 5, 6, 7].map(
      (degree) =>
        chordAtDegree(0, 'major', degree, { useSevenths: true })?.symbol,
    )
    expect(symbols).toEqual([
      'Cmaj7',
      'Dm7',
      'Em7',
      'Fmaj7',
      'G7',
      'Am7',
      'Bm7b5',
    ])
  })

  it('dựng đúng hợp âm bảy của giọng la thứ', () => {
    const symbols = [1, 2, 3, 4, 5, 6, 7].map(
      (degree) =>
        chordAtDegree(9, 'minor', degree, { useSevenths: true })?.symbol,
    )
    expect(symbols).toEqual([
      'Am7',
      'Bm7b5',
      'Cmaj7',
      'Dm7',
      'Em7',
      'Fmaj7',
      'G7',
    ])
  })

  it('ghi đè được tính chất hợp âm', () => {
    // Bậc năm của giọng thứ đổi thành bảy át
    const chord = chordAtDegree(9, 'minor', 5, { qualityOverride: '7' })
    expect(chord?.symbol).toBe('E7')
    expect(chord?.roman).toBe('V7')
  })

  it('ghi tên bằng dấu giáng khi được yêu cầu', () => {
    const chord = chordAtDegree(0, 'major', 4, { accidentalStyle: 'flat' })
    expect(chord?.symbol).toBe('F')

    const inEb = chordAtDegree(3, 'major', 1, { accidentalStyle: 'flat' })
    expect(inEb?.symbol).toBe('Eb')
  })

  it('trả về null với bậc không hợp lệ', () => {
    expect(chordAtDegree(0, 'major', 0)).toBeNull()
    expect(chordAtDegree(0, 'major', 8)).toBeNull()
  })

  it('dịch giọng thì mọi bậc dịch theo', () => {
    const inC = diatonicChords(0, 'major').map((chord) => chord.root)
    const inD = diatonicChords(2, 'major').map((chord) => chord.root)
    expect(inD).toEqual(inC.map((root) => (root + 2) % 12))
  })
})

describe('romanFor', () => {
  const maj = getChordQuality('maj')!
  const min = getChordQuality('min')!
  const dim = getChordQuality('dim')!
  const maj7 = getChordQuality('maj7')!
  const m7 = getChordQuality('m7')!
  const dom7 = getChordQuality('7')!
  const m7b5 = getChordQuality('m7b5')!

  it('bậc trưởng viết hoa, bậc thứ viết thường', () => {
    expect(romanFor(1, maj)).toBe('I')
    expect(romanFor(2, min)).toBe('ii')
  })

  it('bậc giảm viết thường', () => {
    expect(romanFor(7, dim)).toBe('viidim')
  })

  it('hợp âm ba không ghi thêm hậu tố', () => {
    expect(romanFor(4, maj)).toBe('IV')
    expect(romanFor(6, min)).toBe('vi')
  })

  it('hợp âm bảy ghi kèm hậu tố', () => {
    expect(romanFor(1, maj7)).toBe('Imaj7')
    expect(romanFor(2, m7)).toBe('iim7')
    expect(romanFor(5, dom7)).toBe('V7')
    expect(romanFor(7, m7b5)).toBe('viim7b5')
  })

  it('không nhầm hợp âm trưởng thành thứ chỉ vì tên bắt đầu bằng chữ m', () => {
    // maj, maj7, maj9… đều bắt đầu bằng chữ m nhưng là hợp âm trưởng
    for (const id of ['maj', 'maj7', 'maj9', 'maj13', 'maj7#11']) {
      expect(romanFor(1, getChordQuality(id)!).startsWith('I')).toBe(true)
    }
  })

  it('hợp âm treo viết hoa vì không có bậc ba', () => {
    expect(romanFor(5, getChordQuality('sus4')!)).toBe('Vsus4')
    expect(romanFor(5, getChordQuality('9sus4')!)).toBe('V9sus4')
  })

  it('mọi hợp âm có quãng ba thứ đều viết thường', () => {
    for (const id of ['min', 'm7', 'm9', 'm11', 'm6', 'dim', 'dim7', 'm7b5']) {
      expect(romanFor(2, getChordQuality(id)!).startsWith('i')).toBe(true)
    }
  })
})

describe('diatonicChords', () => {
  it('trả về đủ bảy hợp âm', () => {
    expect(diatonicChords(0, 'major')).toHaveLength(7)
    expect(diatonicChords(0, 'minor')).toHaveLength(7)
  })

  it('hợp âm đầu tiên là chủ âm', () => {
    expect(diatonicChords(7, 'major')[0].root).toBe(7)
    expect(diatonicChords(7, 'major')[0].roman).toBe('I')
  })

  it('mọi hợp âm đều có nốt gốc khác nhau', () => {
    const roots = diatonicChords(0, 'major').map((chord) => chord.root)
    expect(new Set(roots).size).toBe(7)
  })
})
