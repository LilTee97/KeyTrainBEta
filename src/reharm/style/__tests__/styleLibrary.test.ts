import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { TwoHandVoicing } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern, timelineLengthBeats } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import {
  ALL_STYLES,
  DEFAULT_STYLE,
  getStyle,
  getVisibleStyles,
  styleFamilies,
  styleIdOrDefault,
} from '../styleLibrary'
import { MAU_BALLAD, MAU_VALSE } from './mauThu'

function voicings(input: string): TwoHandVoicing[] {
  return voiceLeadTwoHands(parseChordInput(input).chords)
}

describe('chín nút người dùng giữ (30/9/2026)', () => {
  const nut = () => styleFamilies(
    getVisibleStyles().filter((style) => resolveStyleForSection(style.id, 'verse') === style.id),
  ).map((family) => family.family)

  it('bảng chọn chỉ còn đúng chín họ, theo thứ tự cũ', () => {
    expect(nut()).toEqual([
      'ca-phao-bossa-improved',
      'ca-phao-ballad-co-em-cho',
      'ca-phao-ballad-de-em-roi-xa',
      'ca-phao-ballad-cu-di',
      'slow-rock-la-thu-hai-tay',
      'blue-sun',
      'twist',
      'bolero-tu-n',
      'tango-tu-n',
    ])
  })

  it('khuôn ngầm tra được nhưng không có nút', () => {
    const visible = new Set(getVisibleStyles().map((style) => style.id))
    for (const id of ['bolero-linh-nhi-2', 'bolero-linh-nhi-2-chorus', 'ton-hung-ballad', 'ton-hung-ballad-chorus',
      'ton-hung-ballad-giang', 'ton-hung-tinh-em-giang', 'ca-phao-bossa-sheet-9-10']) {
      expect(getStyle(id)?.id, id).toBe(id)
      expect(visible.has(id), id).toBe(false)
    }
  })

  it('điệu đã xoá không còn, bài lưu mang điệu ấy về Ballad cứ đi', () => {
    for (const id of ['pop-1', 'ballad', 'bolero-1', 'waltz-1', 'hai-pop-ballad', 'ca-phao-ballad-acdd', 'kim',
      'slow-rock-la-thu', 'slow-rock-duc-thinh-1']) {
      expect(getStyle(id), id).toBeUndefined()
      expect(styleIdOrDefault(id), id).toBe('ca-phao-ballad-cu-di')
    }
    expect(DEFAULT_STYLE.id).toBe('ca-phao-ballad-cu-di')
    // Khuôn ngầm cũng không được mở làm điệu đệm từ bài lưu.
    expect(styleIdOrDefault('bolero-linh-nhi-2')).toBe('ca-phao-ballad-cu-di')
    expect(styleIdOrDefault('twist')).toBe('twist')
    expect(styleIdOrDefault('ca-phao-ballad-co-em-cho-chorus')).toBe('ca-phao-ballad-co-em-cho-chorus')
  })
})

describe('tính toàn vẹn của thư viện điệu', () => {
  it('mọi định danh đều duy nhất', () => {
    const ids = ALL_STYLES.map((style) => style.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi điệu đều có nguồn và mẫu tiết tấu', () => {
    for (const style of ALL_STYLES) {
      expect(style.verified, style.id).toBe(true)
      expect(style.sourceVideos?.length, style.id).toBeGreaterThan(0)
      expect(style.cell, style.id).not.toBeNull()
    }
  })

  it('Ballad rải Tôn Hùng: 120 BPM, LH phiên 1 · 1& · 2', () => {
    const style = getStyle('ton-hung-ballad')
    expect(style?.name).toBe('Ballad rải (Tôn Hùng)')
    expect(style?.bpm).toBe(120)
    expect(style!.cell!.left.map((hit) => hit.beat)).toEqual([0, 0.5, 1])
  })

  it('Ballad rải Tôn Hùng điệp: LH dày hơn phiên', () => {
    expect(getStyle('ton-hung-ballad-chorus')!.cell!.left.map((hit) => hit.beat)).toEqual([
      0, 0.5, 1, 1.5, 2.5, 3,
    ])
  })

  it('Ballad Tôn Hùng giang: LH 8th, không bày trên bảng chọn', () => {
    const style = getStyle('ton-hung-ballad-giang')
    expect(style!.bpm).toBe(120)
    expect(style!.cell!.left.map((hit) => hit.beat)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
  })

  it('Giang Tình Em: LH móc 16 hai cụm', () => {
    const beats = getStyle('ton-hung-tinh-em-giang')!.cell!.left.map((hit) => hit.beat)
    expect(beats).toContain(0.25)
    expect(beats.length).toBeGreaterThan(8)
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
    expect(getStyle('twist')?.id).toBe('twist')
    expect(getStyle('không-có-thật')).toBeUndefined()
  })
})

describe('dựng phần đệm cho từng điệu', () => {
  it.each(ALL_STYLES.map((style) => [style.name, style] as const))(
    'điệu %s dựng được dòng thời gian',
    (_name, style) => {
      const events = renderPattern(voicings('Dm7 G7 Cmaj7'), style)

      expect(events.length).toBeGreaterThan(0)
      expect(events.some((event) => event.hand === 'left')).toBe(true)
      // Điệu có `fillCell` được để trống tay phải lúc hát; tay phải nằm ở ô fill.
      // Slow Blues (id `blue-sun`): tay phải là câu chạy ngón của Bộ Soạn Blues (`chayBlueSun`); cell tay phải trống.
      // Khuôn ngầm bolero rải Linh Nhi: bản độc tấu, tay phải giữ giai điệu — ô nhịp không có tay phải.
      expect(events.some((event) => event.hand === 'right') || (style.fillCell?.right.length ?? 0) > 0 ||
        style.family === 'blue-sun' || style.cell!.right.length === 0).toBe(true)
    },
  )

  it.each(ALL_STYLES.map((style) => [style.name, style] as const))(
    'điệu %s cho lực nhấn hợp lệ',
    (_name, style) => {
      for (const event of renderPattern(voicings('Dm7 G7'), style)) {
        expect(event.velocity).toBeGreaterThanOrEqual(1)
        expect(event.velocity).toBeLessThanOrEqual(127)
        expect(event.notes.length).toBeGreaterThan(0)
      }
    },
  )

  it('khuôn ba bốn dựng theo nhịp ba bốn', () => {
    const events = renderPattern(voicings('C F G'), MAU_VALSE)
    expect(timelineLengthBeats(events)).toBeLessThanOrEqual(10)
  })

  it('điệu có mẫu cố định lặp y hệt bất kể hợp âm', () => {
    const events = renderPattern(voicings('Dm7 G7'), MAU_VALSE)

    const firstMeasure = events
      .filter((event) => event.startBeat < 3)
      .map((event) => `${event.hand}:${event.startBeat}`)
    const secondMeasure = events
      .filter((event) => event.startBeat >= 3 && event.startBeat < 6)
      .map((event) => `${event.hand}:${event.startBeat - 3}`)

    expect(secondMeasure).toEqual(firstMeasure)
  })

  it('điệu 4/4 lặp mẫu cố định sang ô sau', () => {
    const events = renderPattern(voicings('Dm7 G7'), MAU_BALLAD)
    const firstBar = events
      .filter((event) => event.startBeat < 4)
      .map((event) => `${event.hand}:${event.startBeat.toFixed(2)}`)
    const secondBar = events
      .filter((event) => event.startBeat >= 4 && event.startBeat < 8)
      .map((event) => `${event.hand}:${(event.startBeat - 4).toFixed(2)}`)
    expect(secondBar).toEqual(firstBar)
  })
})
