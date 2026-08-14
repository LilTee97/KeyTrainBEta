import { describe, expect, it } from 'vitest'
import {
  CHORD_QUALITIES,
  getChordQuality,
} from '../../../shared/musicTheory/chordDefinitions'
import { parseChordInput } from '../../input/chordInputParser'
import { analyzeColorConflicts, conflictsByIndex } from '../colorConflicts'
import { analyzeInKey } from '../degreeAnalysis'
import { reharmonize } from '../reharmPipeline'
import { PALETTE_BY_TONIC_COLOR } from '../staticVoicingRules'

/** Dò xung đột cho một vòng hợp âm trong một giọng. */
function conflictsFor(input: string, tonic = 0, scale: 'major' | 'minor' = 'major') {
  const chords = parseChordInput(input).chords
  return analyzeColorConflicts(chords, analyzeInKey(chords, tonic, scale), {
    tonic,
    scale,
  })
}

describe('nốt tránh — bậc mười một đâm vào bậc ba', () => {
  /**
   * Luật này hiện **không bao giờ kích hoạt**, và đó là dấu hiệu tốt: từ vựng
   * hợp âm đã được dựng sao cho không loại nào chứa đồng thời bậc ba trưởng và
   * bậc mười một tự nhiên. Bộ dò giữ lại như một cái chốt cho tương lai, phòng
   * khi ai đó thêm một loại hợp âm phạm luật.
   */
  it('không loại hợp âm nào trong từ vựng phạm luật này', () => {
    for (const quality of CHORD_QUALITIES) {
      const folded = new Set(
        quality.intervals.map((interval) => interval % 12),
      )
      const clashes = folded.has(4) && folded.has(5)
      expect(clashes).toBe(false)
    }
  })

  it('hợp âm mười một át bỏ bậc ba nên không đụng độ', () => {
    // Đây chính là cách nhạc lý chữa vấn đề: bỏ bậc ba đi
    expect(getChordQuality('11')!.intervals).not.toContain(4)
    expect(
      conflictsFor('C11').some(
        (conflict) => conflict.kind === 'avoid-note-11',
      ),
    ).toBe(false)
  })

  it('hợp âm thứ có bậc mười một thì hoàn toàn không sao', () => {
    // Bậc mười một không phải nốt tránh với hợp âm thứ — đó là lý do m11 là
    // xương sống của neo-soul, và cũng xác nhận Am11 trong tài liệu là đúng
    expect(
      conflictsFor('Dm11').some(
        (conflict) => conflict.kind === 'avoid-note-11',
      ),
    ).toBe(false)
  })

  it('thăng bậc mười một lên là cách chữa còn lại', () => {
    const quality = getChordQuality('maj7#11')!
    expect(quality.intervals.map((interval) => interval % 12)).toContain(6)
    expect(
      conflictsFor('Cmaj7#11').some(
        (conflict) => conflict.kind === 'avoid-note-11',
      ),
    ).toBe(false)
  })
})

describe('chủ âm phải nghe như chỗ nghỉ', () => {
  it('cảnh báo khi chủ âm mang nốt bậc bảy thứ', () => {
    const conflicts = conflictsFor('C7 F G C')
    const warning = conflicts.find(
      (conflict) => conflict.kind === 'tonic-not-resting',
    )

    expect(warning).toBeDefined()
    expect(warning?.severity).toBe('warning')
    expect(warning?.index).toBe(0)
  })

  it('chủ âm với bậc bảy trưởng thì không sao', () => {
    const conflicts = conflictsFor('Cmaj7 F G C')
    expect(
      conflicts.some((conflict) => conflict.kind === 'tonic-not-resting'),
    ).toBe(false)
  })

  it('hợp âm bảy át ở bậc năm thì không bị cảnh báo', () => {
    // Chỉ chủ âm mới cần cảm giác nghỉ
    const conflicts = conflictsFor('C F G7 C')
    expect(
      conflicts.some((conflict) => conflict.kind === 'tonic-not-resting'),
    ).toBe(false)
  })
})

describe('nốt ngoài giọng', () => {
  it('chỉ ra đúng nốt nằm ngoài giọng', () => {
    // Am6 trong giọng đô trưởng có nốt Fa thăng, nằm ngoài giọng
    const conflicts = conflictsFor('C Am6 F G')
    const info = conflicts.find((conflict) => conflict.kind === 'out-of-key')

    expect(info).toBeDefined()
    expect(info?.message).toContain('F#')
    expect(info?.severity).toBe('info')
  })

  it('vòng hoàn toàn trong giọng thì không báo gì', () => {
    const conflicts = conflictsFor('C Dm Em F G Am')
    expect(
      conflicts.some((conflict) => conflict.kind === 'out-of-key'),
    ).toBe(false)
  })

  it('giọng thứ chấp nhận bậc bảy nâng cao', () => {
    // E7 trong giọng La thứ có nốt Sol thăng, đó là bậc bảy nâng cao
    const conflicts = conflictsFor('Am Dm E7 Am', 9, 'minor')
    expect(
      conflicts.some((conflict) => conflict.kind === 'out-of-key'),
    ).toBe(false)
  })
})

describe('hợp âm át biến âm kéo về hợp âm trưởng', () => {
  it('cảnh báo khi bậc năm biến âm giải quyết về chủ âm trưởng', () => {
    const conflicts = conflictsFor('G7b9 C')
    expect(
      conflicts.some(
        (conflict) => conflict.kind === 'altered-dominant-to-major',
      ),
    ).toBe(true)
  })

  it('không cảnh báo khi bậc năm biến âm kéo về hợp âm thứ', () => {
    // Đúng lối tài liệu dùng: E7b9 về Am
    const conflicts = conflictsFor('E7b9 Am', 9, 'minor')
    expect(
      conflicts.some(
        (conflict) => conflict.kind === 'altered-dominant-to-major',
      ),
    ).toBe(false)
  })

  it('bậc năm không biến âm thì không cảnh báo', () => {
    const conflicts = conflictsFor('G13 C')
    expect(
      conflicts.some(
        (conflict) => conflict.kind === 'altered-dominant-to-major',
      ),
    ).toBe(false)
  })
})

describe('conflictsByIndex', () => {
  it('gom xung đột theo vị trí hợp âm', () => {
    const conflicts = conflictsFor('C7 Am6 F G')
    const map = conflictsByIndex(conflicts)

    for (const [index, list] of map) {
      for (const conflict of list) {
        expect(conflict.index).toBe(index)
      }
    }
  })

  it('không có xung đột thì bản đồ rỗng', () => {
    expect(conflictsByIndex([]).size).toBe(0)
  })
})

describe('bộ màu theo chủ âm', () => {
  it('mọi màu chủ âm đều có bộ màu tương ứng', () => {
    for (const color of [
      'add9',
      'maj7',
      'maj9',
      '6',
      '69',
      'sus2',
      'maj7#11',
    ] as const) {
      expect(PALETTE_BY_TONIC_COLOR[color]).toBeDefined()
      expect(PALETTE_BY_TONIC_COLOR[color].styleName.length).toBeGreaterThan(0)
    }
  })

  it('bộ màu hợp âm sáu nghiêng về lối cổ điển, dùng màu nhạt', () => {
    // Nhạc lý jazz coi hợp âm sáu là màu chủ âm kinh điển vì nghe đứng yên hơn
    const palette = PALETTE_BY_TONIC_COLOR['6']
    expect(palette.major).toBe('6')
    expect(palette.minor).toBe('m7')
    expect(palette.dominant).toBe('7')
  })

  it('bộ màu treo bật luôn hợp âm át thành treo cho ăn khớp', () => {
    expect(PALETTE_BY_TONIC_COLOR.sus2.susDominant).toBe(true)
  })
})

describe('màu riêng cho chủ âm', () => {
  it('chủ âm dùng màu riêng, các bậc trưởng khác dùng màu chung', () => {
    const result = reharmonize(parseChordInput('C Am F G').chords, {
      tonicColor: '6',
      majorColor: 'maj7',
    })

    expect(result.colored[0].symbol).toBe('C6')
    expect(result.colored[2].symbol).toBe('Fmaj7')
  })

  it('không chỉ định màu chủ âm thì dùng chung với các bậc trưởng khác', () => {
    const result = reharmonize(parseChordInput('C Am F G').chords, {
      majorColor: 'maj9',
    })

    expect(result.colored[0].symbol).toBe('Cmaj9')
    expect(result.colored[2].symbol).toBe('Fmaj9')
  })

  it('đường ống trả về danh sách xung đột', () => {
    const result = reharmonize(parseChordInput('C Am F G').chords)
    expect(Array.isArray(result.conflicts)).toBe(true)
  })

  it('vòng rỗng không có xung đột', () => {
    expect(reharmonize([]).conflicts).toEqual([])
  })
})
