import { describe, expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { TWIST } from '../styleLibrary/twist'
import { buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'

const make = (kind: PhraseSectionOptions['kind'], tonic = 0, take = 0, extra: Partial<PhraseSectionOptions> = {}) =>
  buildPhraseSection({ kind, key: { tonic, scale: 'major' }, style: TWIST,
    beatsPerChord: 8, opening: null, dropRoot: false, solo: () => { throw Error('Legacy solo called') },
    take, range: { low: 60, high: 84 }, ...extra })!

// Soạn 144 đoạn bằng Bộ Soạn Blues: chạy riêng 1,8 s, chạy chung cả bộ quá 5 s — nới thời hạn như `soanNhomBa.test.ts`.
describe('Twist Blues composed phrases', { timeout: 30_000 }, () => {
  // 29/9/2026: tay phải do Bộ Soạn Blues soạn (mặc định) — câu chọn theo giọng, không còn cùng một nét dời nguyên qua 12 giọng như
  // bộ mô-típ cũ; các khẳng định riêng của bộ mô-típ (bè đôi > 60%, pickup nối ô 3/5/7/9, ô 2 = ô 6) đã bỏ. Xem twistBlues.test.ts.
  it('renders all three sections in 12 keys and keeps hands/gates/rests valid', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const source = make(kind)
      expect(source.lengthBeats).toBe(kind === 'interlude' ? 48 : 16)
      expect(source.beatsEach.reduce((a, b) => a + b, 0)).toBe(source.lengthBeats)
      expect(source.chords.length).toBe(source.beatsEach.length)
      for (let tonic = 0; tonic < 12; tonic++) for (let take = 0; take < 4; take++) {
        const made = make(kind, tonic, take)
        expect(made.unavailableReason).toBeUndefined()
        expect(made.events.length).toBeGreaterThan(30)
        for (const e of made.events) {
          expect(e.startBeat).toBeGreaterThanOrEqual(0)
          expect(e.durationBeats).toBeGreaterThan(0)
          expect(e.startBeat + e.durationBeats).toBeLessThanOrEqual(made.lengthBeats + 1e-8)
          if (e.hand === 'right') for (const n of e.notes) {
            expect(n).toBeGreaterThanOrEqual(60)
            expect(n).toBeLessThanOrEqual(84)
          }
          // Neither hand retriggers a held key, including tied pickups and grace.
          for (const later of made.events.filter(x => x !== e && x.startBeat > e.startBeat + 1e-8
            && x.startBeat < e.startBeat + e.durationBeats - 1e-8)) {
            expect(later.notes.some(n => e.notes.includes(n))).toBe(false)
          }
        }
      }
    }
  })

  it('keeps the 12-bar I/IV/V frame and changes takes reproducibly', () => {
    const phrase = make('interlude')
    expect(phrase.chords).toEqual(['C6', 'C6', 'C6', 'C6', 'F9', 'F9', 'C6', 'C6', 'G7', 'F9', 'C6', 'G7'])
    expect(new Set(Array.from({ length: 4 }, (_, take) => JSON.stringify(make('interlude', 0, take).events))).size).toBe(4)
    expect(make('interlude', 0, 2)).toEqual(make('interlude', 0, 2))
    expect(make('interlude', 0, 0, { beatsPerChord: 4 })).toEqual(phrase)
  })

  it('ends with a shared rest and one held tonic chord; cues the actual next chord', () => {
    const outro = make('outro')
    expect(outro.events.some(e => e.startBeat < 11 && e.startBeat + e.durationBeats > 10 + 1e-8)).toBe(false)
    expect(outro.events.filter(e => e.startBeat === 11).map(e => e.durationBeats)).toEqual([5, 5])
    expect(outro.events.some(e => e.startBeat >= 12)).toBe(false)
    // Các bass chạy cuối câu đổi ký hiệu đúng onset swing, không còn lưới .5 đều.
    let beat = 0
    const starts = outro.beatsEach.map(duration => { const start = beat; beat += duration; return start })
    const bassRun = outro.events.filter(e => e.hand === 'left' && e.startBeat >= 8 && e.startBeat < 10)
    bassRun.forEach((event, i) => expect(starts[5 + i]).toBeCloseTo(event.startBeat))
    const opening = parseChordInput('Dm').chords[0]!
    for (const kind of ['intro', 'interlude'] as const) {
      const phrase = make(kind, 0, 0, { opening })
      expect(phrase.chords.at(-1)).toBe('A7')
      expect(Math.max(...phrase.events.map(e => e.startBeat + e.durationBeats))).toBe(phrase.lengthBeats - 1)
    }
  })

  it('owns Twist even with saved teacher/CP flags, explicitly adapts minor, and reports missing key/range', () => {
    const baseline = make('intro')
    expect(make('intro', 0, 0, { thay: 'ca-phao', caPhaoFull: true, caPhaoCompose: true, linhNhiSolo: true })).toEqual(baseline)
    for (let tonic = 0; tonic < 12; tonic++) for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const minor = make(kind, tonic, 1, { key: { tonic, scale: 'minor' } })
      expect(minor.unavailableReason).toBeUndefined()
      expect(minor.adaptationNote).toContain('chuyển dụng')
      expect(minor.chords[0]).toContain('m6')
    }
    expect(make('intro', 0, 0, { key: null }).unavailableReason).toBeTruthy()
    expect(make('intro', 0, 0, { range: { low: 62, high: 65 } }).events).toEqual([])
  })

  it('uses the real composed arrangement path with both hands, exact symbols and 8/4-beat sung chords', () => {
    const chords = parseChordInput('G C D G').chords
    const first = chords[0]!
    for (const beatsPerChord of [8, 4]) {
      const accompaniment = renderPattern(voiceLeadTwoHands(chords), TWIST, { beatsPerChord })
      const bodyLength = chords.length * beatsPerChord
      const song = buildBossaSoloSong(accompaniment, bodyLength, null, [],
        (kind, take) => make(kind, 7, take, { opening: first }), [], true)
      expect(song.soloSpans.map(s => s.kind)).toEqual(['intro', 'interlude', 'interlude', 'outro'])
      expect(song.totalBeats).toBe(16 + bodyLength + 96 + 16)
      for (const span of song.soloSpans) {
        const events = song.events.filter(e => e.startBeat >= span.startBeat && e.startBeat < span.startBeat + span.lengthBeats)
          .map(e => ({ ...e, startBeat: e.startBeat - span.startBeat }))
        const take = span.kind === 'interlude' ? song.soloSpans.filter(s => s.kind === 'interlude').indexOf(span) : 0
        const expected = make(span.kind, 7, take, { opening: first })
        expect(span.chords).toEqual(expected.chords)
        expect(events.map(e => [e.notes, e.hand])).toEqual(expected.events.map(e => [e.notes, e.hand]))
        events.forEach((e, i) => {
          expect(e.startBeat).toBeCloseTo(expected.events[i]!.startBeat)
          expect(e.durationBeats).toBeCloseTo(expected.events[i]!.durationBeats)
        })
      }
    }
  })
})
