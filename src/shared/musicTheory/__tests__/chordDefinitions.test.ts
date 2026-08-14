import { describe, expect, it } from 'vitest'
import {
  CHORD_QUALITIES,
  chordNotes,
  chordPitchClasses,
  findQualityBySymbol,
  getChordQuality,
  qualitiesByFamily,
} from '../chordDefinitions'
import { MIDDLE_C, nameToMidi } from '../pitch'

/** Tiện ích cho test: dựng hợp âm từ tên nốt gốc và định danh tính chất. */
function notesOf(rootName: string, qualityId: string): number[] {
  const quality = getChordQuality(qualityId)
  if (!quality) throw new Error(`Không có tính chất hợp âm '${qualityId}'`)

  const root = nameToMidi(rootName)
  if (root === null) throw new Error(`Tên nốt sai: '${rootName}'`)

  return chordNotes(root, quality)
}

describe('tính toàn vẹn của từ vựng hợp âm', () => {
  it('mọi định danh đều duy nhất', () => {
    const ids = CHORD_QUALITIES.map((quality) => quality.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi hợp âm đều bắt đầu từ nốt gốc', () => {
    for (const quality of CHORD_QUALITIES) {
      expect(quality.intervals[0]).toBe(0)
    }
  })

  it('các quãng luôn xếp tăng dần', () => {
    for (const quality of CHORD_QUALITIES) {
      const sorted = [...quality.intervals].sort((a, b) => a - b)
      expect(quality.intervals).toEqual(sorted)
    }
  })

  it('không hợp âm nào có quãng trùng nhau', () => {
    for (const quality of CHORD_QUALITIES) {
      expect(new Set(quality.intervals).size).toBe(quality.intervals.length)
    }
  })

  it('mọi hợp âm đều có ít nhất ba nốt', () => {
    for (const quality of CHORD_QUALITIES) {
      expect(quality.intervals.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('getChordQuality', () => {
  it('tra được theo định danh', () => {
    expect(getChordQuality('maj7')?.intervals).toEqual([0, 4, 7, 11])
    expect(getChordQuality('m7')?.intervals).toEqual([0, 3, 7, 10])
  })

  it('trả về undefined với định danh không có', () => {
    expect(getChordQuality('không-tồn-tại')).toBeUndefined()
  })
})

describe('findQualityBySymbol', () => {
  it('chuỗi rỗng là hợp âm ba trưởng', () => {
    expect(findQualityBySymbol('')?.id).toBe('maj')
  })

  it('tra được theo hậu tố chuẩn', () => {
    expect(findQualityBySymbol('m7')?.id).toBe('m7')
    expect(findQualityBySymbol('9sus4')?.id).toBe('9sus4')
    expect(findQualityBySymbol('dim7')?.id).toBe('dim7')
  })

  it('tra được theo các tên gọi khác', () => {
    expect(findQualityBySymbol('M7')?.id).toBe('maj7')
    expect(findQualityBySymbol('Δ7')?.id).toBe('maj7')
    expect(findQualityBySymbol('-7')?.id).toBe('m7')
    expect(findQualityBySymbol('ø')?.id).toBe('m7b5')
    expect(findQualityBySymbol('add2')?.id).toBe('add9')
  })

  it('phân biệt hoa thường ở chỗ ký hiệu hợp âm cần phân biệt', () => {
    // Đây là cặp dễ nhầm nhất: chữ M hoa là trưởng, m thường là thứ.
    expect(findQualityBySymbol('M7')?.id).toBe('maj7')
    expect(findQualityBySymbol('m7')?.id).toBe('m7')
    expect(findQualityBySymbol('M')?.id).toBe('maj')
    expect(findQualityBySymbol('m')?.id).toBe('min')
  })

  it('bỏ qua hoa thường khi chuỗi không khớp chính xác', () => {
    expect(findQualityBySymbol('  MAJ7 ')?.id).toBe('maj7')
    expect(findQualityBySymbol('Min7')?.id).toBe('m7')
    expect(findQualityBySymbol('DIM7')?.id).toBe('dim7')
  })

  it('trả về undefined với hậu tố lạ', () => {
    expect(findQualityBySymbol('xyz')).toBeUndefined()
  })

  it('mọi hậu tố chuẩn đều tra ngược về đúng hợp âm của nó', () => {
    for (const quality of CHORD_QUALITIES) {
      expect(findQualityBySymbol(quality.symbol)?.id).toBe(quality.id)
    }
  })
})

describe('chordNotes', () => {
  it('dựng đúng hợp âm ba trưởng', () => {
    // C trưởng ở quãng tám đô giữa: C4 E4 G4
    expect(notesOf('C4', 'maj')).toEqual([60, 64, 67])
  })

  it('dựng đúng hợp âm ba thứ', () => {
    expect(notesOf('A3', 'min')).toEqual([57, 60, 64])
  })

  it('dựng đúng hợp âm bảy trưởng', () => {
    // Cmaj7: C E G B
    expect(notesOf('C4', 'maj7')).toEqual([60, 64, 67, 71])
  })

  it('đặt nốt mở rộng ở quãng tám trên', () => {
    // C9: C E G Bb D — nốt D nằm cao hơn nốt gốc một quãng tám
    expect(notesOf('C4', '9')).toEqual([60, 64, 67, 70, 74])
  })

  it('hợp âm mười một át bỏ bậc ba để tránh nghịch với bậc mười một', () => {
    const quality = getChordQuality('11')
    expect(quality?.intervals).not.toContain(4)
  })

  it('dựng đúng các hợp âm treo hay dùng trong phong cách này', () => {
    // D9sus4: D G A C E
    expect(notesOf('D4', '9sus4')).toEqual([62, 67, 69, 72, 76])
  })

  it('hợp âm bảy giảm là chuỗi bốn quãng ba thứ chồng lên nhau', () => {
    const intervals = getChordQuality('dim7')!.intervals
    for (let index = 1; index < intervals.length; index += 1) {
      expect(intervals[index] - intervals[index - 1]).toBe(3)
    }
  })
})

describe('chordPitchClasses', () => {
  it('gập nốt mở rộng về cùng một quãng tám', () => {
    // C9 gồm 5 nốt nhưng chỉ có 5 lớp cao độ riêng biệt: C E G Bb D
    expect(chordPitchClasses(0, getChordQuality('9')!).sort((a, b) => a - b))
      .toEqual([0, 2, 4, 7, 10])
  })

  it('bỏ trùng lặp khi nốt mở rộng gập về trùng nốt sẵn có', () => {
    // C6/9 gồm C E G A D — không có nốt nào trùng nhau
    const classes = chordPitchClasses(0, getChordQuality('69')!)
    expect(new Set(classes).size).toBe(classes.length)
  })

  it('dịch giọng hợp âm thì các lớp cao độ dịch theo', () => {
    const inC = chordPitchClasses(0, getChordQuality('maj')!)
    const inD = chordPitchClasses(2, getChordQuality('maj')!)
    expect(inD).toEqual(inC.map((pitchClass) => (pitchClass + 2) % 12))
  })
})

describe('qualitiesByFamily', () => {
  it('lọc được theo nhóm', () => {
    const suspended = qualitiesByFamily('suspended')
    expect(suspended.length).toBeGreaterThan(0)
    for (const quality of suspended) {
      expect(quality.family).toBe('suspended')
    }
  })

  it('tổng các nhóm bằng đúng toàn bộ từ vựng', () => {
    const families = [
      'triad',
      'sixth',
      'seventh',
      'extended',
      'altered',
      'suspended',
    ] as const

    const total = families.reduce(
      (sum, family) => sum + qualitiesByFamily(family).length,
      0,
    )
    expect(total).toBe(CHORD_QUALITIES.length)
  })
})

describe('các hợp âm mà tài liệu phong cách nhắc tới đều có trong từ vựng', () => {
  // Rút từ Reference/phongcachdemhatkhabu.md — đây là những hợp âm
  // xuất hiện trực tiếp trong các video đã phân tích.
  const REQUIRED = [
    'm11',
    '9sus4',
    'dim7',
    'm7b5',
    '7b9',
    '7#5',
    '13b9',
    '7b13',
    'add9',
    '6',
    'maj7',
    'm9',
    'maj9',
  ]

  it.each(REQUIRED)("có hợp âm '%s'", (id) => {
    expect(getChordQuality(id)).toBeDefined()
  })
})

describe('chordNotes giữ nguyên vị trí tương đối khi đổi nốt gốc', () => {
  it('dịch nốt gốc lên bao nhiêu thì cả hợp âm dịch lên bấy nhiêu', () => {
    const quality = getChordQuality('m7')!
    const fromC = chordNotes(MIDDLE_C, quality)
    const fromD = chordNotes(MIDDLE_C + 2, quality)
    expect(fromD).toEqual(fromC.map((note) => note + 2))
  })
})
