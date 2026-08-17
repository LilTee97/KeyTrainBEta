import { describe, expect, it } from 'vitest'
import { getChordQuality } from '../../../shared/musicTheory/chordDefinitions'
import { parseChordInput } from '../../input/chordInputParser'
import { transposeChords } from '../../transpose'
import type { ParsedChord } from '../../types'
import { analyzeInKey, degreeOf } from '../degreeAnalysis'
import { bestKey, detectKey, isAmbiguous, scaleTones } from '../keyDetection'
import { reharmonize } from '../reharmPipeline'
import {
  DOMINANT_COLOR_OPTIONS,
  MAJOR_COLOR_OPTIONS,
  MINOR_COLOR_OPTIONS,
} from '../staticVoicingRules'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

/** Tên các hợp âm sau khi chạy đường ống. */
function final(input: string, options = {}): string[] {
  return reharmonize(chords(input), options).final.map((chord) => chord.symbol)
}

describe('dò giọng', () => {
  it('nhận ra giọng đô trưởng từ vòng pop quen thuộc', () => {
    expect(bestKey(chords('C Am F G'))?.label).toBe('C')
  })

  it('nhận ra giọng qua vòng hai năm một', () => {
    expect(bestKey(chords('Dm7 G7 Cmaj7'))?.label).toBe('C')
  })

  it('nhận ra giọng sol trưởng từ vòng trong tài liệu', () => {
    // Vòng bài Cứ Chill Thôi, tài liệu ghi rõ là dạy ở giọng G trưởng
    expect(bestKey(chords('Am11 D9sus4 E9sus4 Em7'))?.label).toBe('G')
  })

  it('nhận ra giọng fa trưởng từ vòng bossa nova', () => {
    // Tài liệu ghi bài Người Hãy Quên Em Đi ở giọng F trưởng
    expect(bestKey(chords('Dm9 Gm7 C7 FM7 BbM7'))?.label).toBe('F')
  })

  it('nhận ra giọng thứ', () => {
    expect(bestKey(chords('Am7 Dm7 E7 Am7'))?.scale).toBe('minor')
  })

  it('hợp âm bảy át đúng bậc năm là dấu hiệu mạnh', () => {
    const withDominant = bestKey(chords('C F G7 C'))
    expect(withDominant?.label).toBe('C')
  })

  it('kết ở chủ âm được cộng điểm', () => {
    // Cùng bộ hợp âm nhưng kết khác nhau thì giọng đoán ra khác nhau
    const endingOnC = bestKey(chords('Am F G C'))
    expect(endingOnC?.tonic).toBe(0)
  })

  it('vòng rỗng thì không đoán được gì', () => {
    expect(bestKey([])).toBeNull()
    expect(detectKey([])).toEqual([])
  })

  it('xếp hạng đủ hai mươi tư giọng', () => {
    expect(detectKey(chords('C F G'))).toHaveLength(24)
  })

  it('điểm xếp giảm dần', () => {
    const candidates = detectKey(chords('C Am F G'))

    for (let index = 1; index < candidates.length; index += 1) {
      expect(candidates[index - 1].score).toBeGreaterThanOrEqual(
        candidates[index].score,
      )
    }
  })

  it('báo phân vân khi hai giọng sát điểm nhau', () => {
    // Giọng trưởng và giọng thứ song song dùng chung bộ nốt
    const candidates = detectKey(chords('C F'))
    expect(isAmbiguous(candidates)).toBe(true)
  })
})

describe('scaleTones', () => {
  it('gam trưởng có bảy nốt', () => {
    expect(scaleTones(0, 'major').size).toBe(7)
  })

  it('gam thứ tính thêm bậc bảy nâng cao', () => {
    // Bảy nốt của gam thứ tự nhiên cộng bậc bảy nâng cao
    const tones = scaleTones(9, 'minor')
    expect(tones.size).toBe(8)
    // Nốt Sol thăng, bậc bảy nâng cao của giọng La thứ
    expect(tones.has(8)).toBe(true)
  })

  it('gam đô trưởng đúng bảy nốt trắng', () => {
    expect([...scaleTones(0, 'major')].sort((a, b) => a - b)).toEqual([
      0, 2, 4, 5, 7, 9, 11,
    ])
  })
})

describe('phân tích bậc', () => {
  it('xác định đúng bậc trong giọng đô trưởng', () => {
    const analyzed = analyzeInKey(chords('C Dm Em F G Am'), 0, 'major')
    expect(analyzed.map((entry) => entry.degree)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gán đúng vai trò hoà thanh', () => {
    const analyzed = analyzeInKey(chords('C F G'), 0, 'major')
    expect(analyzed.map((entry) => entry.function)).toEqual([
      'tonic',
      'subdominant',
      'dominant',
    ])
  })

  it('hợp âm ngoài giọng không có bậc', () => {
    const analyzed = analyzeInKey(chords('C Eb'), 0, 'major')
    expect(analyzed[1].degree).toBeNull()
    expect(analyzed[1].function).toBeNull()
  })

  it('nhận ra bậc năm phụ nhờ ngữ cảnh', () => {
    // E7 ngoài giọng đô trưởng, nhưng giải quyết lên quãng bốn vào Am
    const analyzed = analyzeInKey(chords('C E7 Am'), 0, 'major')
    expect(analyzed[1].actsAsDominant).toBe(true)
  })

  it('không gắn nhãn bậc năm phụ cho bậc năm chính thức', () => {
    const analyzed = analyzeInKey(chords('G7 C'), 0, 'major')
    expect(analyzed[0].degree).toBe(5)
    expect(analyzed[0].actsAsDominant).toBe(false)
  })

  it('ghi ký hiệu bậc La Mã', () => {
    const analyzed = analyzeInKey(chords('Dm7 G7 Cmaj7'), 0, 'major')
    expect(analyzed.map((entry) => entry.roman)).toEqual([
      'iim7',
      'V7',
      'Imaj7',
    ])
  })

  it('degreeOf tra được bậc của một nốt gốc', () => {
    expect(degreeOf(0, 0, 'major')).toBe(1)
    expect(degreeOf(7, 0, 'major')).toBe(5)
    expect(degreeOf(1, 0, 'major')).toBeNull()
  })
})

describe('tô màu theo bậc — sửa lỗi mù chức năng', () => {
  it('bậc năm luôn có nốt bậc bảy, không bao giờ thành add9', () => {
    // Đây chính là lỗi của bản đầu: G ở giọng đô bị biến thành Gadd9,
    // mất hết lực kéo về chủ âm
    const result = reharmonize(chords('C Am F G'))
    const g = result.colored[3]

    expect(g.symbol).not.toBe('Gadd9')
    expect(g.quality.intervals).toContain(10)
  })

  it('chủ âm nhận add9, đúng lối Cadd2 trong tài liệu', () => {
    expect(reharmonize(chords('C Am F G')).colored[0].symbol).toBe('Cadd2')
  })

  it('cùng một hợp âm được tô khác nhau tuỳ vai trò trong giọng', () => {
    // G là bậc năm ở giọng đô, nhưng là chủ âm ở giọng sol
    const asDominant = reharmonize(chords('C Am F G')).colored[3]
    const asTonic = reharmonize(chords('G Em C D'), {
      key: { tonic: 7, scale: 'major' },
    }).colored[0]

    expect(asDominant.symbol).not.toBe(asTonic.symbol)
    expect(asTonic.symbol).toBe('Gadd2')
    expect(asDominant.quality.intervals).toContain(10)
  })

  it('hợp âm thứ mượn không bị đổi thành trưởng vì trùng nốt gốc', () => {
    const result = reharmonize(chords('G C Cm D'), {
      key: { tonic: 7, scale: 'major' },
    })
    expect(result.colored[2].quality.intervals).toContain(3)
    expect(result.colored[2].quality.intervals).not.toContain(4)
  })

  it('dịch bài Sol sang La thì chủ âm đi theo, không chỉ tô lại màu', () => {
    const moved = transposeChords(chords('G C D G Bm Em Am D'), 2)
    const result = reharmonize(moved)

    expect(moved.map((chord) => chord.symbol)).toEqual([
      'A',
      'D',
      'E',
      'A',
      'C#m',
      'F#m',
      'Bm',
      'E',
    ])
    expect(result.key?.label).toBe('A')
    expect(result.colored[0].symbol).toBe('Aadd2')
    expect(result.colored[5].quality.intervals).toContain(3)
  })

  it('bậc hai nhận hợp âm mười một, đúng lối Am11 trong tài liệu', () => {
    const result = reharmonize(chords('G Am C D'), {
      key: { tonic: 7, scale: 'major' },
    })
    expect(result.colored[1].symbol).toBe('Am11')
  })

  it('chủ âm thứ dùng m(add9), không m7', () => {
    const result = reharmonize(chords('Am Dm E Am'), {
      key: { tonic: 9, scale: 'minor' },
    })
    expect(result.colored[0].symbol).toBe('Am(add9)')
    expect(result.colored[3].symbol).toBe('Am(add9)')
    expect(
      result.conflicts.some((conflict) => conflict.kind === 'tonic-not-resting'),
    ).toBe(false)
  })

  it('A7 ở chủ âm thứ cũng về nhà, không thành A9sus4', () => {
    const result = reharmonize(chords('Am Em A7 Am'), {
      key: { tonic: 9, scale: 'minor' },
      susDominant: true,
      dominantColor: '9sus4',
    })
    expect(result.colored[2].symbol).toBe('Am(add9)')
    expect(result.colored[1].quality.id).not.toMatch(/sus/)
    expect(
      result.conflicts.some((conflict) => conflict.kind === 'tonic-not-resting'),
    ).toBe(false)
  })

  it('hợp âm giảm không bị đổi thành hợp âm thứ', () => {
    const result = reharmonize(chords('C Adim F G'), {
      key: { tonic: 0, scale: 'major' },
    })
    expect(result.colored[1].quality.id).toMatch(/^dim/)
  })

  it('bậc năm giọng thứ nhận nốt giáng chín', () => {
    const result = reharmonize(chords('Am Dm E Am'), {
      key: { tonic: 9, scale: 'minor' },
    })
    expect(result.colored[2].symbol).toBe('E7b9')
  })

  it('bậc năm phụ ngoài giọng cũng được cho bậc bảy', () => {
    const result = reharmonize(chords('C E7 Am F'))
    const secondary = result.colored[1]
    expect(secondary.quality.intervals).toContain(10)
  })

  it('không làm mỏng hợp âm người dùng đã nhập dày hơn', () => {
    const result = reharmonize(chords('Cmaj9 Am11 Fmaj9 G13'))

    for (let index = 0; index < result.original.length; index += 1) {
      expect(
        result.colored[index].quality.intervals.length,
      ).toBeGreaterThanOrEqual(result.original[index].quality.intervals.length)
    }
  })

  it('mức tắt thì giữ nguyên hoàn toàn', () => {
    expect(final('C Am F G', { intensity: 'off' })).toEqual([
      'C',
      'Am',
      'F',
      'G',
    ])
  })

  it('đổi bậc năm sang hợp âm treo khi được bật', () => {
    const result = reharmonize(chords('C Am F G'), { susDominant: true })
    expect(result.colored[3].symbol).toBe('G9sus4')
  })

  it('bật hợp âm treo không đụng tới các bậc khác', () => {
    const result = reharmonize(chords('C Am F G'), { susDominant: true })
    expect(result.colored[0].symbol).toBe('Cadd2')
  })
})

describe('màu cho hợp âm trưởng đứng yên', () => {
  it('mặc định dùng add9', () => {
    expect(reharmonize(chords('C Am F G')).colored[0].symbol).toBe('Cadd2')
  })

  it('đổi được sang các màu khác trong bảng', () => {
    const cases: [string, string][] = [
      ['maj7', 'Cmaj7'],
      ['maj9', 'Cmaj9'],
      ['6', 'C6'],
      ['69', 'C6/9'],
      ['sus2', 'Csus2'],
    ]

    for (const [color, expected] of cases) {
      const result = reharmonize(chords('C Am F G'), {
        majorColor: color as never,
      })
      expect(result.colored[0].symbol).toBe(expected)
    }
  })

  it('áp cho cả bậc bốn, không chỉ chủ âm', () => {
    const result = reharmonize(chords('C Am F G'), { majorColor: '6' })
    expect(result.colored[2].symbol).toBe('F6')
  })

  it('không bao giờ áp cho bậc năm', () => {
    // Bậc năm cần bậc bảy để kéo về chủ âm, không được thay bằng màu đứng yên
    for (const color of ['add9', '6', 'sus2', 'maj7'] as const) {
      const result = reharmonize(chords('C Am F G'), { majorColor: color })
      expect(result.colored[3].quality.intervals).toContain(10)
    }
  })

  it('sus2 vẫn còn vì nó không có nốt đòi giải quyết', () => {
    expect(
      MAJOR_COLOR_OPTIONS.some((option) => option.id === 'sus2'),
    ).toBe(true)
  })

  it('không màu nào chứa nốt treo bậc bốn', () => {
    // Nốt bậc bốn đúng luôn đòi giải quyết xuống bậc ba, nên nó là nốt treo
    // chứ không phải màu đứng yên — không ai chơi chủ âm ở màu sus4. Mọi ví dụ
    // sus trong tài liệu đều ở bậc năm hoặc ở dạng giải quyết.
    for (const option of MAJOR_COLOR_OPTIONS) {
      const quality = getChordQuality(option.id)!
      // Bậc bốn đúng là 5 nửa cung; bậc bốn tăng (6) thì không phải nốt treo
      expect(quality.intervals).not.toContain(5)
    }
  })

  it('không áp cho hợp âm thứ', () => {
    const result = reharmonize(chords('C Am F G'), { majorColor: 'sus2' })
    // Bậc sáu vẫn là hợp âm thứ, không bị biến thành treo
    expect(result.colored[1].quality.intervals).toContain(3)
  })

  it('áp cho bậc ba và bậc sáu của giọng thứ', () => {
    const result = reharmonize(chords('Am C E7 F'), {
      key: { tonic: 9, scale: 'minor' },
      majorColor: '6',
    })

    // C là bậc III, F là bậc VI của giọng La thứ
    expect(result.colored[1].symbol).toBe('C6')
    expect(result.colored[3].symbol).toBe('F6')
  })

  it('hợp âm treo bỏ bậc ba nhưng vẫn giữ nốt gốc', () => {
    const result = reharmonize(chords('C Am F G'), { majorColor: 'sus2' })
    const tonic = result.colored[0]

    expect(tonic.quality.intervals).not.toContain(4)
    expect(tonic.root).toBe(0)
  })

  it('không làm mỏng hợp âm người dùng đã nhập dày hơn', () => {
    // Người dùng nhập Cmaj9 mà chọn màu sus2 thì giữ nguyên Cmaj9
    const result = reharmonize(chords('Cmaj9 Am F G'), { majorColor: 'sus2' })
    expect(result.colored[0].symbol).toBe('Cmaj9')
  })

  it('mức nhẹ không dùng bảng màu này', () => {
    const result = reharmonize(chords('C Am F G'), {
      intensity: 'light',
      majorColor: '6',
    })
    expect(result.colored[0].symbol).toBe('Cmaj7')
  })
})

describe('màu cho hợp âm thứ', () => {
  it('mặc định theo bậc: bậc hai dùng m11, bậc sáu dùng m9', () => {
    // Vòng ở giọng đô trưởng: Dm là bậc ii, Am là bậc vi
    const result = reharmonize(chords('C Dm Am G'))

    expect(result.colored[1].symbol).toBe('Dm11')
    expect(result.colored[2].symbol).toBe('Am9')
  })

  it('ép được mọi hợp âm thứ về cùng một màu', () => {
    const cases: [string, string, string][] = [
      ['m7', 'Dm7', 'Am7'],
      ['m9', 'Dm9', 'Am9'],
      ['m11', 'Dm11', 'Am11'],
    ]

    for (const [color, expectedTwo, expectedSix] of cases) {
      const result = reharmonize(chords('C Dm Am G'), {
        minorColor: color as never,
      })
      expect(result.colored[1].symbol).toBe(expectedTwo)
      expect(result.colored[2].symbol).toBe(expectedSix)
    }
  })

  it('không đụng tới hợp âm nửa giảm', () => {
    // Bậc bảy của giọng trưởng có chức năng riêng, đổi màu sẽ mất chất
    const result = reharmonize(chords('C Bdim Am G'), { minorColor: 'm11' })
    expect(result.colored[1].symbol).toBe('Bm7b5')
  })

  it('không đụng tới hợp âm trưởng', () => {
    const result = reharmonize(chords('C Dm Am G'), { minorColor: 'm11' })
    expect(result.colored[0].symbol).toBe('Cadd2')
    expect(result.colored[3].quality.intervals).toContain(10)
  })

  it('áp cho bậc bốn của giọng thứ, chủ âm thứ không lấy m11', () => {
    const result = reharmonize(chords('Am Dm E7 Am'), {
      key: { tonic: 9, scale: 'minor' },
      minorColor: 'm11',
    })

    expect(result.colored[0].symbol).toBe('Am(add9)')
    expect(result.colored[1].symbol).toBe('Dm11')
  })

  it('mức nhẹ không dùng bảng màu này', () => {
    const result = reharmonize(chords('C Dm Am G'), {
      intensity: 'light',
      minorColor: 'm11',
    })
    expect(result.colored[1].symbol).toBe('Dm7')
  })
})

describe('hợp âm mười một của bậc năm nằm ở dạng hợp âm treo', () => {
  it('nốt treo bậc bốn chính là nốt bậc mười một', () => {
    const result = reharmonize(chords('C Am F G'), { susDominant: true })
    const dominant = result.colored[3]

    // G9sus4 chứa nốt Đô, vừa là bậc bốn treo vừa là bậc mười một của Sol
    expect(dominant.symbol).toBe('G9sus4')
    expect(dominant.quality.intervals).toContain(5)
    expect(dominant.quality.intervals).not.toContain(4)
  })
})

describe('màu cho bậc năm', () => {
  it('mặc định giọng trưởng dùng 13, giọng thứ dùng 7b9', () => {
    expect(reharmonize(chords('C Am F G')).colored[3].symbol).toBe('G13')

    const minor = reharmonize(chords('Am Dm E Am'), {
      key: { tonic: 9, scale: 'minor' },
    })
    expect(minor.colored[2].symbol).toBe('E7b9')
  })

  it('chọn được các màu át biến âm mà tài liệu dùng', () => {
    const cases: [string, string][] = [
      ['7', 'G7'],
      ['9', 'G9'],
      ['13b9', 'G13b9'],
      ['7#5', 'G7#5'],
      ['7b13', 'G7b13'],
    ]

    for (const [color, expected] of cases) {
      const result = reharmonize(chords('C Am F G'), {
        dominantColor: color as never,
      })
      expect(result.colored[3].symbol).toBe(expected)
    }
  })

  it('chọn được cả các màu jazz ngoài tài liệu', () => {
    for (const [color, expected] of [
      ['7#11', 'G7#11'],
      ['7#9', 'G7#9'],
      ['7b5', 'G7b5'],
    ] as const) {
      const result = reharmonize(chords('C Am F G'), {
        dominantColor: color,
      })
      expect(result.colored[3].symbol).toBe(expected)
    }
  })

  it('mọi màu bậc năm đều giữ nốt bậc bảy', () => {
    const colors = DOMINANT_COLOR_OPTIONS.map((option) => option.id)

    for (const color of colors) {
      const result = reharmonize(chords('C Am F G'), { dominantColor: color })
      expect(result.colored[3].quality.intervals).toContain(10)
    }
  })

  it('không đụng tới các bậc khác', () => {
    const result = reharmonize(chords('C Am F G'), { dominantColor: '7#9' })
    expect(result.colored[0].symbol).toBe('Cadd2')
    expect(result.colored[1].symbol).toBe('Am9')
  })
})

describe('phân nguồn màu', () => {
  it('mọi màu đều ghi rõ lấy từ đâu', () => {
    const all = [
      ...MAJOR_COLOR_OPTIONS,
      ...MINOR_COLOR_OPTIONS,
      ...DOMINANT_COLOR_OPTIONS,
    ]

    for (const option of all) {
      expect(['khaBu', 'jazz']).toContain(option.source)
    }
  })

  it('mỗi nhóm đều có ít nhất một màu ngoài tài liệu', () => {
    for (const group of [
      MAJOR_COLOR_OPTIONS,
      MINOR_COLOR_OPTIONS,
      DOMINANT_COLOR_OPTIONS,
    ]) {
      expect(group.some((option) => option.source === 'jazz')).toBe(true)
    }
  })

  it('lựa chọn mặc định luôn thuộc nhóm trong tài liệu', () => {
    // Người dùng không bật màu jazz thì không bao giờ vô tình dùng phải
    expect(
      MAJOR_COLOR_OPTIONS.find((option) => option.id === 'add9')?.source,
    ).toBe('khaBu')
    expect(
      MINOR_COLOR_OPTIONS.find((option) => option.id === 'auto')?.source,
    ).toBe('khaBu')
    expect(
      DOMINANT_COLOR_OPTIONS.find((option) => option.id === 'auto')?.source,
    ).toBe('khaBu')
  })

  it('mọi tính chất hợp âm trong bảng màu đều có thật trong từ vựng', () => {
    const all = [
      ...MAJOR_COLOR_OPTIONS,
      ...MINOR_COLOR_OPTIONS,
      ...DOMINANT_COLOR_OPTIONS,
    ]

    for (const option of all) {
      if (option.id === 'auto') continue
      expect(getChordQuality(option.id)).toBeDefined()
    }
  })
})

describe('đổi hợp âm kết trên lời', () => {
  const ranges = [
    { kind: 'verse', from: 0, to: 3 },
    { kind: 'chorus', from: 4, to: 7 },
    { kind: 'verse', from: 8, to: 11 },
    { kind: 'chorus', from: 12, to: 15 },
  ]

  it('phiên khúc 2 ghi E7b9 trên vòng colored', () => {
    const result = reharmonize(
      chords('C G Am Em  Am F G C  C G Am Em  Am F G C'),
      { varyOnRepeat: true, sectionRanges: ranges },
    )

    expect(result.colored[11].symbol).toBe('E7b9')
    expect(result.original[11].symbol).toBe('Em')
  })

  it('tắt thì giữ màu lượt đầu', () => {
    const result = reharmonize(
      chords('C G Am Em  Am F G C  C G Am Em  Am F G C'),
      { sectionRanges: ranges },
    )

    expect(result.colored[11].quality.id).not.toBe('7b9')
  })
})

describe('xoay màu cùng gốc trên đường ống', () => {
  it('C C C C ra Cadd2 CM7 C6 CM7 trên lời', () => {
    const result = reharmonize(chords('C C C C'))
    expect(result.colored.map((chord) => chord.symbol)).toEqual([
      'Cadd2',
      'Cmaj7',
      'C6',
      'Cmaj7',
    ])
  })

  it('tắt màu thì không xoay', () => {
    const result = reharmonize(chords('C C C C'), { intensity: 'off' })
    expect(result.colored.map((chord) => chord.symbol)).toEqual([
      'C',
      'C',
      'C',
      'C',
    ])
  })
})

describe('đường ống', () => {
  it('giữ lại vòng gốc để đối chiếu', () => {
    const result = reharmonize(chords('C Am F G'))
    expect(result.original.map((chord) => chord.symbol)).toEqual([
      'C',
      'Am',
      'F',
      'G',
    ])
  })

  it('ghi rõ giọng do dò ra hay do chỉ định', () => {
    expect(reharmonize(chords('C Am F G')).keySource).toBe('detected')
    expect(
      reharmonize(chords('C Am F G'), { key: { tonic: 0, scale: 'major' } })
        .keySource,
    ).toBe('manual')
  })

  it('giọng người dùng chỉ định thắng giọng app dò ra', () => {
    const result = reharmonize(chords('C Am F G'), {
      key: { tonic: 9, scale: 'minor' },
    })
    expect(result.key?.label).toBe('Am')
  })

  it('sinh gợi ý hợp âm lướt trên vòng đã thêm màu', () => {
    const result = reharmonize(chords('C Am F G'))
    expect(result.passingSuggestions.length).toBeGreaterThan(0)
  })

  it('chưa chấp nhận gợi ý nào thì vòng cuối bằng vòng đã thêm màu', () => {
    const result = reharmonize(chords('C Am F G'))
    expect(result.final).toEqual(result.colored)
  })

  it('chấp nhận gợi ý thì vòng cuối dài ra', () => {
    const withoutPassing = reharmonize(chords('C Am F G'))
    const withPassing = reharmonize(chords('C Am F G'), {
      acceptedPassing: [withoutPassing.passingSuggestions[0]],
    })

    expect(withPassing.final.length).toBeGreaterThan(
      withoutPassing.final.length,
    )
  })

  it('vòng rỗng chạy được mà không vỡ', () => {
    const result = reharmonize([])

    expect(result.final).toEqual([])
    expect(result.key).toBeNull()
    expect(result.keySource).toBe('none')
  })

  it('phân tích đủ mọi hợp âm của vòng', () => {
    const result = reharmonize(chords('C Am F G'))
    expect(result.analyzed).toHaveLength(4)
    expect(result.colored).toHaveLength(4)
  })
})
