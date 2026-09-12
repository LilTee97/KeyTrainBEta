import { describe, expect, it } from 'vitest'
import { buildPhraseSection as build, type PhraseSectionOptions } from '../phraseSection'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED as style } from '../styleLibrary/caPhaoBossa'
import { parseChordInput } from '../../input/chordInputParser'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'

function buildPhraseSection(o: PhraseSectionOptions) {
  const result = build(o)
  if (!result) throw new Error('Intro mới không được rơi về fallback')
  return result
}

const options = (tonic = 9, take = 0): PhraseSectionOptions => ({
  kind: 'intro', key: { tonic: tonic as PitchClass, scale: 'minor' }, style,
  beatsPerChord: 4, dropRoot: true, take,
  opening: parseChordInput(pitchClassName(tonic as PitchClass) + 'm').chords[0]!,
  solo: () => { throw new Error('Không được rơi vào bộ solo trộn nguồn cũ') },
  range: { low: 62, high: 84 },
})

describe('Intro thứ Bossa CP cải tiến: bản ráp thật hai tay', () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))('giọng %i: đủ 8 ô, không rơi nốt, đúng nguồn', tonic => {
    for (let take = 0; take < 4; take++) {
      const o = options(tonic, take)
      const result = buildPhraseSection(o)
      expect(result.unavailableReason).toBeUndefined()
      expect(result.lengthBeats).toBe(32)
      expect(result.beatsEach.reduce((a, b) => a + b, 0)).toBe(32)
      expect(result.beatsEach).toHaveLength(result.chords.length)
      expect(result.sourcePhrase).toMatchObject({ id: 'nguoi-hay-quen-em-di-intro', fromBar: 1, barCount: 8 })
      expect(parseChordInput(result.chords[0]!).chords[0]!.root).toBe(tonic)
      expect(parseChordInput(result.chords.at(-1)!).chords[0]!.root).toBe((tonic + 7) % 12)
      expect(result.events.length).toBeGreaterThan(50)
      for (const e of result.events) {
        expect(e.startBeat).toBeGreaterThanOrEqual(0)
        expect(e.durationBeats).toBeGreaterThan(0)
        expect(e.startBeat + e.durationBeats).toBeLessThanOrEqual(32)
        expect(e.notes.every(n => n >= 0 && n <= 127 && Number.isInteger(n))).toBe(true)
      }
      expect(result.events.filter(e => e.hand === 'right' && e.startBeat >= 31)).toEqual([])
      const backing = renderPattern(voiceLeadTwoHands([
        ...result.chords.map(c => parseChordInput(c).chords[0]!), o.opening!,
      ], { dropRootFromRightHand: o.dropRoot }), style, {
        beatsEach: [...result.beatsEach, 4], beatsPerChord: 4,
      }).filter(e => e.hand === 'left' && e.startBeat < 32)
      expect(result.events.filter(e => e.hand === 'left')).toEqual(backing)
      expect(backing.at(-1)!.startBeat).toBe(31.5)
    }
  })

  it('4 biến thể nhất quán, chromatic ngắn giải lên, hút đúng hợp âm mở khác chủ âm', () => {
    const takes = [0, 1, 2, 3].map(take => buildPhraseSection(options(9, take)))
    expect(new Set(takes.map(t => JSON.stringify(t.events))).size).toBe(4)
    expect(buildPhraseSection(options())).toEqual(takes[0])
    const notes = takes[0]!.events.filter(e => e.hand === 'right')
    const approach = notes.find(e => e.startBeat === 24.25)!
    expect(approach.durationBeats).toBe(0.22)
    expect(notes.find(e => e.startBeat === 24.5)!.notes[0]! - approach.notes[0]!).toBe(1)
    const other = buildPhraseSection({ ...options(), opening: parseChordInput('Dm').chords[0]! })
    expect(other.unavailableReason).toBeUndefined()
    expect(other.chords.at(-1)).toBe('A7')
  })

  it('không âm thầm gập từng nốt khi tầm quá hẹp', () => {
    const result = buildPhraseSection({ ...options(), range: { low: 70, high: 74 } })
    expect(result.unavailableReason).toBeTruthy()
    expect(result.events).toEqual([])
  })

  it('La thứ phát được với trần 79 mặc định của app, cả hai lựa chọn bỏ gốc', () => {
    for (const dropRoot of [false, true]) {
      const result = buildPhraseSection({ ...options(), dropRoot, range: { low: 62, high: 79 } })
      expect(result.unavailableReason).toBeUndefined()
      expect(result.lengthBeats).toBe(32)
    }
  })

  it('không chiếm lựa chọn thầy khác, intro trưởng, điệu gốc hoặc giang/kết', () => {
    const overrides: Partial<PhraseSectionOptions>[] = [
      { thay: 'linh-nhi' }, { thay: 'ton-hung' }, { style: CA_PHAO_BOSSA },
      { key: { tonic: 0, scale: 'major' } }, { kind: 'interlude' }, { kind: 'outro' },
    ]
    for (const override of overrides) {
      const result = build({ ...options(), solo: () => [], ...override })
      expect(result?.sourcePhrase?.id).not.toBe('nguoi-hay-quen-em-di-intro')
    }
    expect(buildPhraseSection({ ...options(), thay: 'ca-phao' }).sourcePhrase?.id)
      .toBe('nguoi-hay-quen-em-di-intro')
  })
})
