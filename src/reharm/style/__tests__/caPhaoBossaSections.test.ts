import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { buildArrangedSong, type SourceSection } from '../arrangement'
import { renderPattern } from '../patternRenderer'
import { hasChorusVariant, hasTonicVariant, resolveStyleForSection, sectionCellBreaks } from '../sectionStyles'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED as style } from '../styleLibrary/caPhaoBossa'
import type { TimelineEvent } from '../types'

const rhythm = (events: readonly TimelineEvent[], start: number, length: number) =>
  events.filter(e => e.startBeat >= start && e.startBeat < start + length)
    .map(({ startBeat, durationBeats, hand, velocity }) => ({
      startBeat: startBeat - start, durationBeats, hand, velocity,
    }))

describe('Bossa CP cải tiến qua ranh giới phiên khúc', () => {
  it('phiên khúc 2 và lượt lặp mở đúng ô A dù đoạn trước có 3 ô nhịp', () => {
    const sources: SourceSection[] = [
      { name: 'Phiên khúc 1', kind: 'verse', startBeat: 0, lengthBeats: 12 },
      { name: 'Phiên khúc 2', kind: 'verse', startBeat: 12, lengthBeats: 12 },
    ]
    const hands = voiceLeadTwoHands(parseChordInput('Am7 Dm7 E7 Am7 Dm7 E7').chords)
    // Đường cũ: chạy liên tục từ 0, đoạn 2 bắt đầu ở ô B (12 % 8 = 4).
    const continuous = renderPattern(hands, style, { beatsPerChord: 4 })
    expect(rhythm(continuous, 12, 8)).not.toEqual(rhythm(continuous, 0, 8))

    const accompaniment = renderPattern(hands, style, {
      beatsPerChord: 4, cellBreaks: sectionCellBreaks(style.id, sources),
    })
    const song = buildArrangedSong({
      accompaniment, fills: [], solo: () => [], sources,
      steps: [0, 1, 1].map(source => ({ type: 'section' as const, source })),
    })
    expect(rhythm(song.events, 12, 12)).toEqual(rhythm(song.events, 0, 12))
    expect(rhythm(song.events, 24, 12)).toEqual(rhythm(song.events, 0, 12))
    expect(song.totalBeats).toBe(36)
    expect(song.events.every(e => e.startBeat + e.durationBeats <= 36)).toBe(true)
  })

  it.each([4, 6, 12, 14, 20])('đầu đoạn tại beat %s mở mẫu gốc, không mất tiếng hoặc ngân hợp âm cũ', boundary => {
    const hands = voiceLeadTwoHands(parseChordInput('E7 Am7 Dm7 E7').chords)
    const events = renderPattern(hands, style, {
      beatsEach: [boundary, 4, 4, 4],
      cellBreaks: sectionCellBreaks(style.id, [{ startBeat: 0 }, { startBeat: boundary }]),
    })
    const standalone = renderPattern(hands.slice(1), style, { beatsPerChord: 4 })
    expect(rhythm(events, boundary, 12)).toEqual(rhythm(standalone, 0, 12))
    expect(events.filter(e => e.startBeat < boundary)
      .every(e => e.startBeat + e.durationBeats <= boundary)).toBe(true)
  })

  it('không giả tạo biến thể điệp khúc hoặc đổi chính sách của điệu khác', () => {
    const sections = [{ startBeat: 0 }, { startBeat: 12 }]
    expect(sectionCellBreaks(style.id, sections)).toEqual([0, 12])
    expect(sectionCellBreaks(style.id, null)).toEqual([])
    expect(hasChorusVariant(style.id)).toBe(false)
    expect(hasTonicVariant(style.id)).toBe(false)
    for (const section of ['verse', 'chorus', 'interlude'] as const) {
      expect(resolveStyleForSection(style.id, section)).toBe(style.id)
    }
    expect(sectionCellBreaks(CA_PHAO_BOSSA.id, sections)).toEqual([])
    expect(sectionCellBreaks('bossa-1', sections)).toEqual([])
    expect(sectionCellBreaks('ca-phao-ballad-co-em-cho', sections)).toEqual([0, 12])
    expect(sectionCellBreaks('bolero-linh-nhi-2', sections)).toEqual([0, 12])
  })
})
