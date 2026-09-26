import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { autoFillSkip } from '../../fillSoloGenerator/soloGenerator'
import { soloTeacherOf } from '../../fillSoloGenerator/soloTeacher'
import { parseChordInput } from '../../input/chordInputParser'
import { parseSongText } from '../../input/songTextParser'
import { buildSongSheet, sectionChordRanges } from '../../input/songSheet'
import { chordDurations, mainChordSpans } from '../../chordTiming'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { StylePicker } from '../StylePicker'
import { isBalladStyle } from '../balladFamily'
import { hoCuaDieu } from '../hoDieu'
import { renderPattern } from '../patternRenderer'
import { ALL_STYLES, getStyle, isCodexStyle } from '../styleLibrary'

const onsets = [0, 2 / 3, 1, 5 / 3, 2, 8 / 3, 3, 11 / 3]
const durations = [2 / 3, 1 / 3, 2 / 3, 1 / 3, 2 / 3, 1 / 3, 2 / 3, 1 / 3]
const majorBass = [0, 0, 3, 4, 7, 0, 9, 7]
const minorBass = [0, 0, 2, 3, 7, 0, 9, 7]
const round = (n: number) => Number(n.toFixed(6))
const render = (input: string, beatsEach?: number[]) => renderPattern(
  voiceLeadTwoHands(parseChordInput(input).chords), getStyle('twist')!, { beatsEach },
)

describe('Twist extracted from the Boogie Woogie sheet', () => {
  it('is a separate selected pink button, with no borrowed teacher or ballad behavior', () => {
    const style = getStyle('twist')!
    expect(style).toMatchObject({
      family: 'twist', familyName: 'Twist', timeSignature: '4/4', beatsPerMeasure: 4,
      bpm: 180, feel: 'swing', releaseRatio: 1, soloMaxStrikes: 8, autoFills: false,
    })
    expect(hoCuaDieu(style.id)).toBe('twist')
    expect(isCodexStyle(style.id)).toBe(true)
    expect(isBalladStyle(style.id)).toBe(false)
    expect(soloTeacherOf(style.id)).toBeNull()
    const html = renderToStaticMarkup(
      <StylePicker styles={ALL_STYLES} selectedId={style.id} onSelect={() => {}} />,
    )
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
    const twist = buttons.filter(button => />Twist<\/button>/.test(button))
    expect(twist).toHaveLength(1)
    expect(twist[0]).toContain('aria-pressed="true"')
    expect(twist[0]).toContain('text-pink-100')
    // ReharmHome uses this helper for autoFills:false; explicitly chosen fills remain possible.
    expect([...autoFillSkip(4, new Set(), new Set([2]))]).toEqual([0, 1, 3])
  })

  it('renders the long-short bass and two RH attacks on C, F and G without filling its rests', () => {
    const events = render('C F G')
    for (const [bar, root] of [36, 41, 43].entries()) {
      const start = bar * 4
      const inBar = events.filter(event => event.startBeat >= start && event.startBeat < start + 4)
      const left = inBar.filter(event => event.hand === 'left')
      const right = inBar.filter(event => event.hand === 'right')
      expect(left.map(event => round(event.startBeat - start))).toEqual(onsets.map(round))
      expect(left.map(event => round(event.durationBeats))).toEqual(durations.map(round))
      expect(left.map(event => event.notes)).toEqual(majorBass.map(offset => [root + offset]))
      expect(right.map(event => round(event.startBeat - start))).toEqual([0, round(8 / 3)])
      expect(right.map(event => round(event.durationBeats))).toEqual([1, round(1 / 3)])
      for (const event of right) {
        expect(event.notes.length).toBeGreaterThanOrEqual(3)
        expect([...new Set(event.notes.map(note => (note - root + 120) % 12))].sort((a, b) => a - b))
          .toEqual([0, 4, 7])
      }
    }
  })

  it('transposes the same bass contour to every major and minor root, adapting the approach to the third', () => {
    const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    roots.forEach((root, pc) => {
      for (const minor of [false, true]) {
        const symbol = `${root}${minor ? 'm' : ''}`
        const left = render(symbol).filter(event => event.hand === 'left')
        expect(left.map(event => event.notes), symbol)
          .toEqual((minor ? minorBass : majorBass).map(offset => [36 + pc + offset]))
        expect(left.map(event => round(event.startBeat)), symbol).toEqual(onsets.map(round))
      }
    })
  })

  it.each([8, 4])('repeats both hands for a %i-beat chord before changing to the next root', (beatsPerChord) => {
    const events = renderPattern(
      voiceLeadTwoHands(parseChordInput('C F').chords), getStyle('twist')!, { beatsPerChord },
    )
    const repeats = beatsPerChord / 4
    for (const [index, root] of [36, 41].entries()) {
      const start = index * beatsPerChord
      const inChord = events.filter(event => event.startBeat >= start && event.startBeat < start + beatsPerChord)
      const left = inChord.filter(event => event.hand === 'left')
      const right = inChord.filter(event => event.hand === 'right')
      expect(left.map(event => event.notes)).toEqual(
        Array.from({ length: repeats }, () => majorBass.map(offset => [root + offset])).flat(),
      )
      expect(right.map(event => round(event.startBeat - start))).toEqual(
        Array.from({ length: repeats }, (_, bar) => [bar * 4, round(bar * 4 + 8 / 3)]).flat(),
      )
      expect(inChord.every(event => event.startBeat + event.durationBeats <= start + beatsPerChord + 1e-6)).toBe(true)
    }
  })

  it.each([8, 4])('keeps lyric anchors aligned through reharmonization at %i beats per chord', (beatsPerChord) => {
    // Lỗi thật: 60 Năm Cuộc Đời, Cadd2/Gadd2 bị tách add2→maj7 sau một lần đệm;
    // số hợp âm chính tăng làm neo lời lệch và cuối bài bị cắt theo số neo cũ.
    const parsed = parseSongText(
      'Em ơi có [G]bao nhiêu?\nSáu mươi năm [G]cuộc đời\n' +
      'Hai mươi năm [Csus2]đầu, sung sướng không bao [G]lâu\n' +
      'Hai mươi năm [D9]sau, sầu vương cao vời [C9]vợi\nHai mươi năm cuối là [G]bao',
    )
    const result = reharmonize(parsed.chords, {
      key: { tonic: 7, scale: 'major' }, intensity: 'full',
      tonicColor: 'add9', majorColor: 'add9', susDominant: true,
      beatsPerChord, beatsPerMeasure: 4,
      skipHeldAt: new Set(parsed.chords.map((_, index) => index)),
    })
    const spans = mainChordSpans(result.final, beatsPerChord)
    expect(spans).toHaveLength(parsed.chords.length)
    expect(result.colored.every(chord => !chord.heldLabel && !chord.heldQualities && !chord.holdRun)).toBe(true)
    expect(spans.map(span => span.chord.root)).toEqual(parsed.chords.map(chord => chord.root))
    expect(spans.map(span => span.start)).toEqual(parsed.chords.map((_, index) => index * beatsPerChord))
    const sheet = buildSongSheet(parsed, result.colored, result.final)
    const [section] = sectionChordRanges(sheet)
    const first = spans[section.from]
    const last = spans[section.to]
    expect(last.start + last.beats - first.start).toBe(parsed.chords.length * beatsPerChord)
    const events = renderPattern(voiceLeadTwoHands(result.final), getStyle('twist')!, {
      beatsPerChord, beatsEach: chordDurations(result.final, beatsPerChord),
    })
    for (const span of spans) {
      const inChord = events.filter(event => event.startBeat >= span.start && event.startBeat < span.start + span.beats)
      expect(inChord.filter(event => event.hand === 'left')).toHaveLength(beatsPerChord * 2)
      expect(inChord.filter(event => event.hand === 'right')).toHaveLength(beatsPerChord / 2)
    }
  })

  it('keeps the cell phase over split chords and does not invent an RH attack in a written rest', () => {
    const halfBars = render('C F', [2, 2])
    expect(halfBars.filter(event => event.hand === 'left').map(event => round(event.startBeat)))
      .toEqual(onsets.map(round))
    expect(halfBars.filter(event => event.hand === 'right').map(event => round(event.startBeat)))
      .toEqual([0, round(8 / 3)])
    const right = render('C F G', [1, 1, 2]).filter(event => event.hand === 'right')
    expect(right.map(event => round(event.startBeat))).toEqual([0, round(8 / 3)])
    expect(right[1].notes.every(note => [7, 11, 2].includes(note % 12))).toBe(true)
  })

  it('clips sounding notes at an off-grid chord change while preserving subsequent swing onsets', () => {
    const events = render('C F', [0.5, 3.5])
    const first = events.filter(event => event.startBeat === 0)
    expect(first).toHaveLength(2)
    expect(first.every(event => event.durationBeats === 0.5)).toBe(true)
    expect(events.filter(event => event.hand === 'left').map(event => round(event.startBeat)))
      .toEqual(onsets.map(round))
    expect(events.every(event => event.durationBeats > 0)).toBe(true)
  })
})
