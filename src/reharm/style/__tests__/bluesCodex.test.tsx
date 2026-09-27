import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { bluesCodexPass, colorBluesCodexBacking, composeBluesCodexPhrase, generateBluesCodexFills, weaveBluesCodexBacking } from '../bluesCodex'
import { renderPattern } from '../patternRenderer'
import { buildSongTimeline, SONG_FORMS } from '../songStructure'
import { buildArrangedSong } from '../arrangement'
import { ALL_STYLES, getStyle, isCodexStyle } from '../styleLibrary'
import { StylePicker } from '../StylePicker'
import { hoCuaDieu } from '../hoDieu'
import type { TimelineEvent } from '../types'

const style = getStyle('blues-codex-1')!
const original = getStyle('blues-duc-thinh')!
const parse = (input: string) => {
  const result = parseChordInput(input)
  expect(result.errors).toEqual([])
  return result.chords
}
const end = (event: TimelineEvent) => event.startBeat + event.durationBeats
const overlap = (a: TimelineEvent, b: TimelineEvent) => a.startBeat < end(b) - 1e-6 && b.startBeat < end(a) - 1e-6
const backing = (input: string) => {
  const chords = parse(input)
  return weaveBluesCodexBacking(renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 3 }), chords, 3)
}

describe('Blues Codex 1: đệm và câu đáp soạn chung cho hai tay', () => {
  it('có nút hồng riêng; giữ bass và mốc nhắp của Claude, rút ngắn ngân tay phải', () => {
    expect(isCodexStyle(style.id)).toBe(true)
    expect(isCodexStyle(original.id)).toBe(false)
    expect(hoCuaDieu(style.id)).toBeNull()
    const html = renderToStaticMarkup(<StylePicker styles={ALL_STYLES} selectedId={style.id} onSelect={() => {}} />)
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*text-pink-100[^>]*>Blues Codex 1<\/button>/)
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Blues Đức Thịnh<\/button>/)
    const hands = voiceLeadTwoHands(parse('C7 F7'))
    const old = renderPattern(hands, original, { beatsPerChord: 3 })
    const now = renderPattern(hands, style, { beatsPerChord: 3 })
    expect(now.filter(e => e.hand === 'left')).toEqual(old.filter(e => e.hand === 'left'))
    expect(now.filter(e => e.hand === 'right').map(e => e.startBeat)).toEqual([1.45, 4.45])
    for (const e of now.filter(e => e.hand === 'right')) expect(e.durationBeats).toBeCloseTo(0.6)
    expect(original.cell!.right[0].durationBeats).toBe(3.1)
  })

  it('đổi thế nhắp theo trưởng/thứ/7/maj7/6, giữ sus, dim, altered và bass slash', () => {
    const expected = new Map([
      ['C', [4, 7, 9]], ['C7', [4, 7, 10]], ['Cm', [3, 7, 10]],
      ['Cmaj7', [4, 7, 11]], ['Cm6', [3, 7, 9]], ['C/E', [4, 7, 9]],
    ])
    for (const [symbol, notes] of expected) {
      const chords = parse(symbol)
      const raw = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 3 })
      const colored = colorBluesCodexBacking(raw, chords, 3)
      expect(colored.find(e => e.hand === 'right')!.notes.map(n => n % 12), symbol).toEqual(notes)
      expect(colored.filter(e => e.hand === 'left'), symbol).toEqual(raw.filter(e => e.hand === 'left'))
    }
    for (const symbol of ['Csus4', 'Cdim7', 'C7b9', 'C7#9', 'Caug']) {
      const chords = parse(symbol)
      const raw = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 3 })
      expect(colorBluesCodexBacking(raw, chords, 3), symbol).toEqual(raw)
    }
  })

  it('lick/run đổi giọng, có nghỉ, láy nhẹ và bè đôi; kết trong hợp âm và đúng cửa sổ', () => {
    let graces = 0, doubles = 0
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['7', 'm7', 'maj7']) for (const run of [false, true]) {
        const chord = parse(root + quality)[0]
        const signatures = new Set<string>()
        for (let take = 0; take < 4; take++) {
          const phrase = composeBluesCodexPhrase({ chord, next: parse('F7')[0], beats: run ? 3 : 1.5, endBeat: 6, take }, run)
          expect(phrase.length).toBeGreaterThan(1)
          signatures.add(JSON.stringify(phrase))
          expect(phrase.some((e, i) => i > 0 && e.startBeat - end(phrase[i - 1]) > 0.1)).toBe(true)
          const main = phrase.filter(e => !e.grace)
          for (let i = 1; i < main.length; i++) expect(main[i].startBeat - main[i - 1].startBeat).toBeGreaterThanOrEqual(0.45)
          for (const [i, e] of phrase.entries()) {
            expect(e.hand).toBe('right')
            expect(e.startBeat).toBeGreaterThanOrEqual(run ? 3 : 4.5)
            expect(end(e)).toBeLessThanOrEqual(6)
            expect(e.durationBeats).toBeGreaterThan(0)
            if (i > 0) expect(e.startBeat + 1e-6).toBeGreaterThanOrEqual(end(phrase[i - 1]))
            const steps = e.notes.map(n => (n - chord.root) % 12)
            if (quality === 'm7') expect(steps).not.toContain(4)
            if (quality === 'maj7') expect(steps).not.toContain(10)
            if (quality === '7') expect(steps).not.toContain(11)
            expect(Math.max(...e.notes) - Math.min(...e.notes)).toBeLessThanOrEqual(12)
            expect(Math.min(...e.notes)).toBeGreaterThanOrEqual(60)
            expect(Math.max(...e.notes)).toBeLessThanOrEqual(84)
            if (e.grace) { graces++; expect(e.velocity).toBeLessThan(55) }
            if (e.notes.length > 1) doubles++
          }
          for (const note of phrase.at(-1)!.notes) expect(chord.quality.intervals.map(n => n % 12)).toContain((note - chord.root) % 12)
        }
        expect(signatures.size).toBeGreaterThanOrEqual(run ? 2 : 4)
      }
    }
    expect(graces).toBeGreaterThan(0)
    expect(doubles).toBeGreaterThan(0)
  })

  it('chỉ thêm Fill/Run riêng khi được chọn; thiếu chỗ thì bớt nốt, không nén run', () => {
    const chords = parse('C7 F7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7')
    const options = { beatsPerChord: 3, density: 'medium' as const, take: 0 }
    const auto = generateBluesCodexFills(chords, options)
    expect(auto).toEqual([])
    expect(style.autoFills).toBe(false)
    expect(generateBluesCodexFills(chords, { ...options, vocal: 'full' })).toEqual([])
    expect(generateBluesCodexFills(chords, { ...options, skipFills: new Set(chords.map((_, i) => i)) })).toEqual([])
    const manual = generateBluesCodexFills(chords, { ...options, vocal: 'full', extraRuns: new Set([1]), fillRests: new Map([[1, 0.5]]) })
    expect(manual.length).toBe(5)
    expect(manual.every(e => e.startBeat >= 3 && end(e) <= 5.5)).toBe(true)
    const transition = generateBluesCodexFills(chords, { ...options, breaths: new Set(), sectionEnds: new Map([[1, { octaves: 1, restBeats: 0.5, delayBeats: 1.5 }]]) })
    expect(transition.length).toBeGreaterThan(0)
    expect(transition.every(e => e.startBeat >= 4.5 && end(e) <= 5.5)).toBe(true)
    expect(generateBluesCodexFills(chords, { ...options, breaths: new Set(), sectionEnds: new Map([[1, { octaves: 0, restBeats: 0 }]]) })).toEqual([])
    const split = chords.map((c, i) => ({ ...c, beats: i === 0 ? 1.5 : 3 }))
    expect(generateBluesCodexFills(split, options).some(e => e.startBeat < 1.5)).toBe(false)
    expect(composeBluesCodexPhrase({ chord: chords[0], next: chords[1], beats: 0.2, endBeat: 3, take: 0 })).toEqual([])
    for (const beats of [0.25, 0.5, 0.75, 1, 1.5, 2, 3]) {
      const phrase = composeBluesCodexPhrase({ chord: chords[0], next: chords[1], beats, endBeat: 3, take: 0 }, true)
      const main = phrase.filter(e => !e.grace)
      expect(main.length).toBe(Math.floor(beats / 0.5))
      for (let i = 1; i < main.length; i++) expect(main[i].startBeat - main[i - 1].startBeat).toBeGreaterThanOrEqual(0.45)
    }
  })

  it('có dòng chạy liền 4–6 nốt qua vạch ô dù không bật Fill; giữ LH và chỗ thở', () => {
    const chords = parse('C7 C7 C7 C7')
    const raw = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 3 })
    const plan = weaveBluesCodexBacking(raw, chords, 3)
    expect(plan.filter(e => e.hand === 'left')).toEqual(raw.filter(e => e.hand === 'left'))
    const right = plan.filter(e => e.hand === 'right')
    // Regression: bản cũ chỉ G–A / cụm / G ngắn, không có dòng 4 nốt liền.
    const firstRun = right.filter(e => e.startBeat >= 2 && e.startBeat < 4)
    expect(firstRun.map(e => e.notes)).toEqual([[67], [68], [69], [72]])
    expect(firstRun.map(e => e.startBeat)).toEqual([2, 2.5, 3, 3.5])
    expect(firstRun.slice(0, -1).every(e => e.durationBeats >= 0.47)).toBe(true)
    expect(firstRun.every(e => e.velocity >= 74)).toBe(true)
    const secondRun = right.filter(e => e.startBeat >= 6.5 && e.startBeat <= 9)
    expect(secondRun.map(e => e.notes)).toEqual([[74], [72], [74], [72], [69], [67]])
    expect(right.filter(e => e.notes.length > 1).map(e => e.startBeat)).toEqual([1.45, 4.45, 10.45])
    expect(right.some((e, i) => i > 0 && e.startBeat - end(right[i - 1]) > 0.5)).toBe(true)
    for (let i = 1; i < right.length; i++) {
      expect(right[i].startBeat - right[i - 1].startBeat).toBeGreaterThanOrEqual(0.45)
      expect(overlap(right[i - 1], right[i])).toBe(false)
    }
    const noFills = generateBluesCodexFills(chords, { beatsPerChord: 3, density: 'medium', vocal: 'full' })
    expect(noFills).toEqual([])
    const song = buildSongTimeline({ accompaniment: plan, fills: noFills, solo: () => [], loopLengthBeats: 12, form: SONG_FORMS[0] })
    for (const note of firstRun) expect(song.events).toContainEqual(note)
    // Vòng chỉ một ô vẫn phải có câu chạy, không chờ đủ hai ô mới sinh.
    for (const beats of [1.5, 3]) {
      const short = chords.slice(0, 1).map(c => ({ ...c, beats }))
      const base = renderPattern(voiceLeadTwoHands(short), style, { beatsPerChord: beats })
      const notes = weaveBluesCodexBacking(base, short, beats).filter(e => e.hand === 'right' && e.notes.length === 1)
      expect(notes.length).toBeGreaterThanOrEqual(3)
      expect(notes.every(e => end(e) <= beats)).toBe(true)
      for (let i = 1; i < notes.length; i++) expect(notes[i].startBeat - notes[i - 1].startBeat).toBeCloseTo(0.5)
    }
  })

  it('giai điệu theo hợp âm đang vang, nghỉ và mốc mở ô lẻ; không tràn hợp âm ngắn', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      const chords = parse(`${root}m7 ${root}maj7 ${root}7b9 ${root}sus4`)
        .map((c, i) => ({ ...c, beats: i === 0 ? 1.25 : 3 }))
      const muteWindows = [{ from: 2, to: 3.4 }, { from: 7, to: 8.2 }]
      const cellBreaks = [1.25, 4.25, 7.25]
      const raw = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: 3, beatsEach: chords.map(c => c.beats), muteWindows, cellBreaks })
      const plan = weaveBluesCodexBacking(raw, chords, 3, { muteWindows, cellBreaks })
      expect(plan.filter(e => e.hand === 'left')).toEqual(raw.filter(e => e.hand === 'left'))
      const right = plan.filter(e => e.hand === 'right')
      for (const event of right) {
        expect(Math.min(...event.notes)).toBeGreaterThanOrEqual(60)
        expect(Math.max(...event.notes)).toBeLessThanOrEqual(83)
        expect(muteWindows.every(w => end(event) <= w.from + 1e-6 || event.startBeat >= w.to)).toBe(true)
        const index = [0, 1.25, 4.25, 7.25].findLastIndex(b => b <= event.startBeat + 1e-6)
        const steps = event.notes.map(n => (n - chords[index].root + 120) % 12)
        if (index === 0) { expect(steps).not.toContain(4); expect(end(event)).toBeLessThanOrEqual(1.25) }
        if (index === 1) expect(steps).not.toContain(10)
        if (index === 2) expect(steps).not.toContain(2)
        if (index === 3) expect(steps).not.toContain(4)
      }
      for (let i = 1; i < right.length; i++) expect(right[i].startBeat - right[i - 1].startBeat).toBeGreaterThanOrEqual(0.45 - 1e-6)
    }
  })

  it('cả phát vòng và bài có đoạn đều nhả RH đúng câu đang phát, giữ bass và nốt láy', () => {
    const input = 'C7 F7 G7 C7'
    const chords = parse(input)
    const base = backing(input)
    for (let take = 0; take < 4; take++) {
      const fills = generateBluesCodexFills(chords, { beatsPerChord: 3, density: 'dense', take, extraFills: new Set([0, 1, 2, 3]) })
      const plan = bluesCodexPass(base, fills)
      expect(plan.backing.filter(e => e.hand === 'left')).toEqual(base.filter(e => e.hand === 'left'))
      expect(plan.backing.filter(e => e.hand === 'right').every(e => e.durationBeats >= 0.12)).toBe(true)
      expect(plan.backing.filter(e => e.hand === 'right').every(e => fills.every(f => !overlap(e, f)))).toBe(true)
      const loop = buildSongTimeline({ accompaniment: plan.backing, fills: plan.events, solo: () => [], loopLengthBeats: 12, form: SONG_FORMS[0] })
      const arranged = buildArrangedSong({ accompaniment: plan.backing, fills: () => plan.events, solo: () => [],
        sources: [{ name: 'Blues', kind: 'verse', startBeat: 0, lengthBeats: 12 }],
        steps: [{ type: 'section', source: 0 }, { type: 'section', source: 0 }], styleId: style.id })
      for (const song of [loop, arranged]) {
        const right = song.events.filter(e => e.hand === 'right')
        for (let i = 1; i < right.length; i++) expect(overlap(right[i - 1], right[i])).toBe(false)
        const main = right.filter(e => !e.grace)
        for (let i = 1; i < main.length; i++) expect(main[i].startBeat - main[i - 1].startBeat).toBeGreaterThanOrEqual(0.45 - 1e-6)
      }
      expect(arranged.totalBeats).toBe(24)
      expect(arranged.events.length).toBe(loop.events.length * 2)
    }
  })
})
