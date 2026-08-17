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
    expect(VERIFIED_STYLES.length).toBeGreaterThanOrEqual(4)

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

describe('bí danh bài cũ', () => {
  it('ballad / bossa / valse / swing trỏ về biến thể OneMotion', () => {
    expect(getStyle('ballad')).toBe(BALLAD)
    expect(getStyle('ballad-pre')).toBe(BALLAD)
    expect(getStyle('bossa-nova')).toBe(BOSSA_NOVA)
    expect(getStyle('valse')).toBe(VALSE)
    expect(getStyle('swing')).toBe(SWING)
  })
})

describe('điệu OneMotion', () => {
  it('mỗi điệu có họ, biến thể và mẫu', () => {
    expect(VERIFIED_STYLES.length).toBeGreaterThan(30)
    for (const style of VERIFIED_STYLES) {
      expect(style.family.length).toBeGreaterThan(0)
      expect(style.variant).toBeGreaterThan(0)
      expect(style.cell).not.toBeNull()
      expect(isPlayable(style)).toBe(true)
    }
  })

  it('mỗi điệu có BPM OneMotion', () => {
    for (const style of VERIFIED_STYLES) {
      expect(style.bpm).toBeGreaterThanOrEqual(40)
      expect(style.bpm).toBeLessThanOrEqual(200)
    }
    expect(getStyle('pop-1')!.bpm).toBe(120)
    expect(getStyle('pop-2')!.bpm).toBe(90)
    expect(getStyle('swing-1')!.bpm).toBe(130)
    expect(getStyle('reggae-1')!.bpm).toBe(80)
    expect(getStyle('flamenco-1')!.bpm).toBe(100)
  })

  it('Rock / Pop / Funk có nhiều dạng', () => {
    expect(VERIFIED_STYLES.filter((style) => style.family === 'rock')).toHaveLength(4)
    expect(VERIFIED_STYLES.filter((style) => style.family === 'pop')).toHaveLength(4)
    expect(VERIFIED_STYLES.filter((style) => style.family === 'funk')).toHaveLength(5)
  })

  it('có Once và Basic 1–4', () => {
    expect(
      VERIFIED_STYLES.filter((style) => style.family === 'basic').map(
        (style) => style.id,
      ),
    ).toEqual(['once', 'basic-1', 'basic-2', 'basic-3', 'basic-4'])
  })

  it('Basic 2 rải từng nốt, 8 tiếng một ô', () => {
    const events = renderPattern(voicings('C'), getStyle('basic-2')!)
    const right = events.filter(
      (event) => event.hand === 'right' && event.startBeat < 4,
    )
    expect(right).toHaveLength(8)
    expect(right.every((event) => event.notes.length === 1)).toBe(true)
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

  it('điệu valse dựng theo nhịp ba bốn', () => {
    const events = renderPattern(voicings('C F G'), VALSE)
    expect(timelineLengthBeats(events)).toBeLessThanOrEqual(10)
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

  it('điệu 4/4 lặp mẫu cố định sang ô sau', () => {
    const pop = getStyle('pop-2')!
    const events = renderPattern(voicings('Dm7 G7'), pop)
    const firstBar = events
      .filter((event) => event.startBeat < 4)
      .map((event) => `${event.hand}:${event.startBeat.toFixed(2)}`)
    const secondBar = events
      .filter((event) => event.startBeat >= 4 && event.startBeat < 8)
      .map((event) => `${event.hand}:${(event.startBeat - 4).toFixed(2)}`)
    expect(secondBar).toEqual(firstBar)
  })
})
