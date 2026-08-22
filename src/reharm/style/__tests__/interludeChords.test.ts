import { describe, expect, it } from 'vitest'
import { isPlainInterludeQuality, plainForInterlude } from '../interludeChords'
import { chooseInterludeWindow, pullStrength } from '../interludeLoop'
import { brainInterludeWindow } from '../../brain/interlude'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { parseChordInput } from '../../input/chordInputParser'

/**
 * Giang tấu lấy **vòng hợp âm gốc**, không lấy bản đã tô màu.
 *
 * Đoạn có lời thì màu của anh Khá đúng chỗ: giọng hát là đường giai điệu, hợp âm
 * dày lên nghe đầy. Giang tấu thì không có ai hát — cây đàn tự chạy câu, và nốt
 * màu chồng lên nền solo làm câu chạy nghe lạc. Luật gốc ở kho PianoBrain, item
 * `rule-interlude-plain-harmony`.
 */
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

describe('rút hợp âm về màu cơ bản', () => {
  it('bỏ màu thêm nốt', () => {
    for (const [từ, thành] of [
      ['Cadd9', 'maj'],
      ['C6', 'maj'],
      ['C69', 'maj'],
      ['Cmaj9', 'maj7'],
      ['C13', '7'],
      ['C9', '7'],
      ['Am9', 'm7'],
      ['Am11', 'm7'],
    ] as const) {
      const chord = parseChordInput(từ).chords[0]
      expect(plainForInterlude(chord).quality.id, từ).toBe(thành)
    }
  })

  it('hợp âm bảy biến âm rút về bảy thường', () => {
    for (const từ of ['C7b9', 'C7#5', 'C13b9', 'C7#11']) {
      const chord = parseChordInput(từ).chords[0]
      expect(plainForInterlude(chord).quality.id, từ).toBe('7')
    }
  })

  it('hợp âm giảm rút về nửa giảm', () => {
    for (const từ of ['Bdim', 'Bdim7']) {
      const chord = parseChordInput(từ).chords[0]
      expect(plainForInterlude(chord).quality.id, từ).toBe('m7b5')
    }
  })

  it('màu cơ bản giữ nguyên, không rút nhầm', () => {
    for (const từ of ['C', 'Am', 'C7', 'Cmaj7', 'Am7', 'Bm7b5', 'Csus2', 'Csus4']) {
      const chord = parseChordInput(từ).chords[0]
      expect(plainForInterlude(chord).quality.id, từ).toBe(chord.quality.id)
      expect(isPlainInterludeQuality(chord.quality.id), từ).toBe(true)
    }
  })

  it('nốt gốc không đổi khi rút màu', () => {
    for (const từ of ['Cadd9', 'Am9', 'C7b9', 'Bdim7']) {
      const chord = parseChordInput(từ).chords[0]
      expect(plainForInterlude(chord).root, từ).toBe(chord.root)
    }
  })
})

describe('bài đã tái hòa âm đầy màu, giang tấu vẫn lấy vòng gốc', () => {
  const GỐC = 'C Am F G'

  /** Vòng sau khi anh Khá tô màu — đây là thứ đoạn có lời đang chơi. */
  const final = reharmonize(parseChordInput(GỐC).chords, {
    // `full` là mức duy nhất thả hết màu ra: add2, m9, 13.
    intensity: 'full',
    tonicColor: 'add9',
    majorColor: 'add9',
    minorColor: 'm9',
    dominantColor: '13',
    key: C_MAJOR,
  }).final.filter((chord) => !chord.passing)

  it('phần có lời vẫn được tô màu như cũ — không đụng tới', () => {
    const coloured = final.filter(
      (chord) => !isPlainInterludeQuality(chord.quality.id),
    )
    expect(coloured.length, 'tái hòa âm phải còn tô màu').toBeGreaterThan(0)
  })

  it('vòng giang tấu rút từ gốc thì không còn màu nào', () => {
    const forInterlude = parseChordInput(GỐC).chords.map(plainForInterlude)
    for (const chord of forInterlude) {
      expect(isPlainInterludeQuality(chord.quality.id), chord.symbol).toBe(true)
    }
  })

  it('rút từ bản đã tô màu cũng ra màu cơ bản, không sót', () => {
    // Lỡ có đường nào truyền nhầm bản final vào thì bộ lọc vẫn chặn được.
    for (const chord of final.map(plainForInterlude)) {
      expect(isPlainInterludeQuality(chord.quality.id), chord.symbol).toBe(true)
    }
  })

  it('não từ chối chọn khi vòng còn màu, nhận khi đã rút gọn', () => {
    const key = C_MAJOR
    const dài = parseChordInput('C Am Dm G C F Em Dm G').chords

    const cònMàu = dài.map((chord, at) =>
      at === 5 ? parseChordInput('Fadd9').chords[0] : chord,
    )
    expect(brainInterludeWindow({ chords: cònMàu, key })).toBeNull()

    const đãRút = cònMàu.map(plainForInterlude)
    expect(brainInterludeWindow({ chords: đãRút, key })).not.toBeNull()
  })
})

describe('khung KeyTrain giữ nguyên: 4 ô, ô cuối hút đoạn sau', () => {
  it('vẫn chọn đúng bốn hợp âm', () => {
    const chords = parseChordInput('C Am F G C Am F G').chords.map(plainForInterlude)
    const window = chooseInterludeWindow(chords, chords[0], 4)
    expect(window).not.toBeNull()
    expect(window!.to - window!.from + 1).toBe(4)
  })

  it('ô cuối hút về hợp âm đầu đoạn sau', () => {
    const chords = parseChordInput('C F Am G').chords.map(plainForInterlude)
    const target = parseChordInput('C').chords[0]
    const window = chooseInterludeWindow(chords, target, 4)!
    // G hút về C mạnh hơn hẳn: bậc năm đi về chủ âm.
    expect(window.pull).toBeGreaterThanOrEqual(pullStrength(chords[3], target))
    expect(pullStrength(chords[3], target)).toBeGreaterThan(
      pullStrength(chords[2], target),
    )
  })

  it('rút màu không làm mất sức hút của hợp âm bậc năm', () => {
    const g13 = parseChordInput('G13').chords[0]
    const target = parseChordInput('C').chords[0]
    expect(pullStrength(plainForInterlude(g13), target)).toBe(
      pullStrength(g13, target),
    )
  })
})
