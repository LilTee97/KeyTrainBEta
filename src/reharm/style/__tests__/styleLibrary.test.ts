import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern, timelineLengthBeats } from '../patternRenderer'
import {
  ALL_STYLES,
  BALLAD,
  BOSSA_NOVA,
  SWING,
  UNVERIFIED_STYLES,
  VALSE,
  VERIFIED_STYLES,
  getStyle,
  isPlayable,
} from '../styleLibrary'

function voicings(input: string): TwoHandVoicing[] {
  return voiceLeadTwoHands(parseChordInput(input).chords)
}

describe('tính toàn vẹn của thư viện điệu', () => {
  it('mọi định danh đều duy nhất', () => {
    const ids = ALL_STYLES.map((style) => style.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('các điệu đã xác nhận đều có nguồn video', () => {
    expect(VERIFIED_STYLES).toHaveLength(4)

    for (const style of VERIFIED_STYLES) {
      expect(style.verified).toBe(true)
      expect(style.sourceVideos?.length).toBeGreaterThan(0)
    }
  })

  it('điệu chưa xác nhận không có mẫu tiết tấu', () => {
    // Thà báo là chưa có còn hơn bịa mẫu rồi dạy sai
    for (const style of UNVERIFIED_STYLES) {
      expect(style.verified).toBe(false)
      expect(style.cell).toBeNull()
      expect(style.sourceVideos).toBeUndefined()
    }
  })

  it('chỉ điệu đã xác nhận mới chơi được', () => {
    for (const style of VERIFIED_STYLES) expect(isPlayable(style)).toBe(true)
    for (const style of UNVERIFIED_STYLES) expect(isPlayable(style)).toBe(false)
  })

  it('số phách mỗi ô nhịp khớp với nhịp ghi trên nhãn', () => {
    for (const style of ALL_STYLES) {
      const numerator = Number(style.timeSignature.split('/')[0])
      expect(style.beatsPerMeasure).toBe(numerator)
    }
  })

  it('mọi tiếng đàn trong mẫu đều nằm trong độ dài mẫu', () => {
    for (const style of ALL_STYLES) {
      if (!style.cell) continue

      for (const hit of [...style.cell.right, ...style.cell.left]) {
        expect(hit.beat).toBeGreaterThanOrEqual(0)
        expect(hit.beat).toBeLessThan(style.cell.lengthBeats)
        expect(hit.durationBeats).toBeGreaterThan(0)
      }
    }
  })

  it('tra được điệu theo định danh', () => {
    expect(getStyle('valse')).toBe(VALSE)
    expect(getStyle('không-có-thật')).toBeUndefined()
  })
})

describe('ballad Khá Bự', () => {
  it('khối hợp âm phách 1 và 3', () => {
    expect(BALLAD.cell?.left.map((hit) => hit.beat)).toEqual([0, 2])
    expect(BALLAD.cell?.right.map((hit) => hit.beat)).toEqual([0, 2])
  })

  it('bài cũ lưu ballad-pre/chorus vẫn ra ballad', () => {
    expect(getStyle('ballad-pre')).toBe(BALLAD)
    expect(getStyle('ballad-chorus')).toBe(BALLAD)
  })
})

describe('bossa nova', () => {
  it('mẫu trải dài hai ô nhịp', () => {
    expect(BOSSA_NOVA.cell?.lengthBeats).toBe(8)
  })

  it('tay phải đánh đúng các mốc mà tài liệu ghi', () => {
    // Tài liệu ghi theo vị trí móc đơn: ô nhịp 1 vào móc 1 3 6 8,
    // ô nhịp 2 vào móc 3 6. Đổi sang phách thì ra các mốc này.
    expect(BOSSA_NOVA.cell?.right.map((hit) => hit.beat)).toEqual([
      0, 1, 2.5, 3.5, 5, 6.5,
    ])
  })

  it('có tiếng đàn rơi lệch phách, đúng chất bossa', () => {
    const offBeats = BOSSA_NOVA.cell!.right.filter(
      (hit) => !Number.isInteger(hit.beat),
    )
    expect(offBeats.length).toBeGreaterThan(0)
  })

  it('cả hai tay đều lệch phách', () => {
    const leftOffBeats = BOSSA_NOVA.cell!.left.filter(
      (hit) => !Number.isInteger(hit.beat),
    )
    expect(leftOffBeats.length).toBeGreaterThan(0)
  })
})

describe('valse', () => {
  it('nhịp ba bốn', () => {
    expect(VALSE.timeSignature).toBe('3/4')
    expect(VALSE.cell?.lengthBeats).toBe(3)
  })

  it('tay trái chỉ đánh một nốt bass ở phách 1', () => {
    expect(VALSE.cell?.left).toHaveLength(1)
    expect(VALSE.cell?.left[0].beat).toBe(0)
  })

  it('tay phải nghỉ phách 1 rồi đánh hai hợp âm', () => {
    // Đây mới là chữ ký thật sự của điệu, theo tài liệu
    expect(VALSE.cell?.right.map((hit) => hit.beat)).toEqual([1, 2])
  })

  it('hai tay không bao giờ đánh cùng lúc', () => {
    const leftBeats = new Set(VALSE.cell!.left.map((hit) => hit.beat))
    for (const hit of VALSE.cell!.right) {
      expect(leftBeats.has(hit.beat)).toBe(false)
    }
  })
})

describe('swing', () => {
  it('tay trái ngân bass nguyên ô nhịp', () => {
    expect(SWING.cell?.left).toHaveLength(1)
    expect(SWING.cell?.left[0].durationBeats).toBe(4)
  })

  it('tay phải xen kẽ hợp âm và nốt đơn', () => {
    const voices = SWING.cell!.right.map((hit) => hit.voice)
    expect(voices).toEqual([
      'chord',
      'top',
      'chord',
      'top',
      'chord',
      'top',
      'chord',
      'top',
    ])
  })

  it('nốt đơn rơi vào chỗ nảy theo tỉ lệ hai một', () => {
    const offBeat = SWING.cell!.right[1]
    expect(offBeat.beat).toBeCloseTo(2 / 3)
  })

  it('hợp âm dài gấp đôi nốt đơn, đúng cảm giác đong đưa', () => {
    const chordHit = SWING.cell!.right[0]
    const singleHit = SWING.cell!.right[1]

    expect(chordHit.durationBeats / singleHit.durationBeats).toBeCloseTo(2)
  })

  it('nốt đơn nhẹ hơn hợp âm', () => {
    expect(SWING.cell!.right[1].velocityScale!).toBeLessThan(
      SWING.cell!.right[0].velocityScale!,
    )
  })
})

describe('dựng phần đệm cho từng điệu', () => {
  it.each(VERIFIED_STYLES.map((style) => [style.name, style] as const))(
    'điệu %s dựng được dòng thời gian',
    (_name, style) => {
      const events = renderPattern(voicings('Dm7 G7 Cmaj7'), style)

      expect(events.length).toBeGreaterThan(0)
      expect(events.some((event) => event.hand === 'left')).toBe(true)
      expect(events.some((event) => event.hand === 'right')).toBe(true)
    },
  )

  it.each(VERIFIED_STYLES.map((style) => [style.name, style] as const))(
    'điệu %s cho lực nhấn hợp lệ',
    (_name, style) => {
      for (const event of renderPattern(voicings('Dm7 G7'), style)) {
        expect(event.velocity).toBeGreaterThanOrEqual(1)
        expect(event.velocity).toBeLessThanOrEqual(127)
        expect(event.notes.length).toBeGreaterThan(0)
      }
    },
  )

  it('điệu swing lấy đúng một nốt cho những tiếng ở chỗ nảy', () => {
    const events = renderPattern(voicings('Cmaj7'), SWING)
    const singleNotes = events.filter(
      (event) => event.hand === 'right' && event.notes.length === 1,
    )

    expect(singleNotes.length).toBeGreaterThan(0)
  })

  it('điệu valse dựng theo nhịp ba bốn', () => {
    const events = renderPattern(voicings('C F G'), VALSE)
    // Ba hợp âm, mỗi hợp âm ba phách
    expect(timelineLengthBeats(events)).toBeLessThanOrEqual(9)
  })

  it('điệu có mẫu cố định lặp y hệt bất kể hợp âm', () => {
    const events = renderPattern(voicings('Dm7 G7'), VALSE)

    const firstMeasure = events
      .filter((event) => event.startBeat < 3)
      .map((event) => `${event.hand}:${event.startBeat}`)
    const secondMeasure = events
      .filter((event) => event.startBeat >= 3 && event.startBeat < 6)
      .map((event) => `${event.hand}:${event.startBeat - 3}`)

    expect(secondMeasure).toEqual(firstMeasure)
  })

  it('ballad (cell) lặp mẫu cố định như các điệu khác', () => {
    const events = renderPattern(voicings('Dm7 G7'), BALLAD)
    // cell lặp lại y hệt bất kể hợp âm (như valse test bên trên)
    const firstBar = events.filter((e) => e.startBeat < 4).map((e) => `${e.hand}:${(e.startBeat % 4).toFixed(2)}`)
    const secondBar = events.filter((e) => e.startBeat >= 4 && e.startBeat < 8).map((e) => `${e.hand}:${((e.startBeat - 4) % 4).toFixed(2)}`)
    expect(secondBar).toEqual(firstBar)
  })
})
