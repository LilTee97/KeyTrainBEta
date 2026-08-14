import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'
import { analyzeInKey, degreeOf } from '../degreeAnalysis'
import { bestKey, detectKey, isAmbiguous, scaleTones } from '../keyDetection'
import { reharmonize } from '../reharmPipeline'

function chords(input: string): ParsedChord[] {
  return parseChordInput(input).chords
}

/** Tên các hợp âm sau khi chạy đường ống. */
function final(input: string, options = {}): string[] {
  return reharmonize(chords(input), options).final.map((chord) => chord.symbol)
}

describe('dò giọng', () => {
  it('nhận ra giọng đô trưởng từ vòng pop quen thuộc', () => {
    expect(bestKey(chords('C Am F G'))?.label).toBe('C trưởng')
  })

  it('nhận ra giọng qua vòng hai năm một', () => {
    expect(bestKey(chords('Dm7 G7 Cmaj7'))?.label).toBe('C trưởng')
  })

  it('nhận ra giọng sol trưởng từ vòng trong tài liệu', () => {
    // Vòng bài Cứ Chill Thôi, tài liệu ghi rõ là dạy ở giọng G trưởng
    expect(bestKey(chords('Am11 D9sus4 E9sus4 Em7'))?.label).toBe('G trưởng')
  })

  it('nhận ra giọng fa trưởng từ vòng bossa nova', () => {
    // Tài liệu ghi bài Người Hãy Quên Em Đi ở giọng F trưởng
    expect(bestKey(chords('Dm9 Gm7 C7 FM7 BbM7'))?.label).toBe('F trưởng')
  })

  it('nhận ra giọng thứ', () => {
    expect(bestKey(chords('Am7 Dm7 E7 Am7'))?.scale).toBe('minor')
  })

  it('hợp âm bảy át đúng bậc năm là dấu hiệu mạnh', () => {
    const withDominant = bestKey(chords('C F G7 C'))
    expect(withDominant?.label).toBe('C trưởng')
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
    expect(reharmonize(chords('C Am F G')).colored[0].symbol).toBe('Cadd9')
  })

  it('cùng một hợp âm được tô khác nhau tuỳ vai trò trong giọng', () => {
    // G là bậc năm ở giọng đô, nhưng là chủ âm ở giọng sol
    const asDominant = reharmonize(chords('C Am F G')).colored[3]
    const asTonic = reharmonize(chords('G Em C D'), {
      key: { tonic: 7, scale: 'major' },
    }).colored[0]

    expect(asDominant.symbol).not.toBe(asTonic.symbol)
    expect(asTonic.symbol).toBe('Gadd9')
    expect(asDominant.quality.intervals).toContain(10)
  })

  it('bậc hai nhận hợp âm mười một, đúng lối Am11 trong tài liệu', () => {
    const result = reharmonize(chords('G Am C D'), {
      key: { tonic: 7, scale: 'major' },
    })
    expect(result.colored[1].symbol).toBe('Am11')
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
    expect(result.colored[0].symbol).toBe('Cadd9')
  })
})

describe('màu cho hợp âm trưởng đứng yên', () => {
  it('mặc định dùng add9', () => {
    expect(reharmonize(chords('C Am F G')).colored[0].symbol).toBe('Cadd9')
  })

  it('đổi được sang các màu khác trong bảng', () => {
    const cases: [string, string][] = [
      ['maj7', 'Cmaj7'],
      ['maj9', 'Cmaj9'],
      ['6', 'C6'],
      ['69', 'C6/9'],
      ['sus2', 'Csus2'],
      ['sus4', 'Csus4'],
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
    for (const color of ['add9', '6', 'sus2', 'sus4', 'maj7'] as const) {
      const result = reharmonize(chords('C Am F G'), { majorColor: color })
      expect(result.colored[3].quality.intervals).toContain(10)
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
    expect(result.key?.label).toBe('A thứ')
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
