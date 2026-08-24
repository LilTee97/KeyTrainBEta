import { describe, expect, it } from 'vitest'
import { chordDurations } from '../../chordTiming'
import { parseChordInput } from '../../input/chordInputParser'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { buildArrangedSong } from '../arrangement'
import { renderPattern } from '../patternRenderer'
import { buildSongTimeline, getSongForm } from '../songStructure'
import { getStyle } from '../styleLibrary'
import { interludeLeftHand } from '../interludeBass'
import type { TimelineEvent } from '../types'

function build(styleId: string, beatsPerChord = 4) {
  const chords = parseChordInput('C Am F G').chords
  const first = reharmonize(chords, {})
  const reharm = reharmonize(chords, {
    acceptedPassing: first.passingSuggestions.filter(
      (suggestion) => suggestion.technique === 'secondary-ii-V',
    ),
    beatsPerChord,
  })

  const style = getStyle(styleId)!
  const full = reharm.final
  const backing = renderPattern(
    voiceLeadTwoHands(full, { dropRootFromRightHand: true }),
    style,
    { beatsPerChord, beatsEach: chordDurations(full, beatsPerChord) },
  )

  return {
    full,
    song: buildSongTimeline({
      accompaniment: backing,
      fills: [],
      solo: () => [],
      loopLengthBeats: 16,
      form: getSongForm('two-then-interlude')!,
    }),
  }
}

const sectionEvents = (
  song: ReturnType<typeof build>['song'],
  kind: string,
): TimelineEvent[] => {
  const section = song.sections.find((entry) => entry.kind === kind)!
  return song.events.filter(
    (event) =>
      event.startBeat >= section.startBeat &&
      event.startBeat < section.startBeat + section.lengthBeats,
  )
}

const bassPhases = (
  song: ReturnType<typeof build>['song'],
  kind: string,
): number[] => {
  const section = song.sections.find((entry) => entry.kind === kind)!
  return sectionEvents(song, kind)
    .filter((event) => event.hand === 'left')
    .map((event) => event.startBeat - section.startBeat)
    .sort((a, b) => a - b)
}

describe('phần đệm đoạn giang tấu', () => {
  it.each(['pop-1', 'bossa-nova-1', 'waltz-1', 'swing-1'] as const)(
    '%s: tiết tấu bass giang tấu trùng đoạn hát',
    (styleId) => {
      const beats = styleId === 'waltz-1' ? 3 : 4
      const { song } = build(styleId, beats)
      expect(bassPhases(song, 'interlude')).toEqual(bassPhases(song, 'verse'))
    },
  )

  it('đoạn có lời vẫn chơi đủ hợp âm lướt', () => {
    const { full, song } = build('pop-1')

    const passingRoots = full
      .filter((chord) => chord.passing)
      .map((chord) => chord.root)

    const bass = sectionEvents(song, 'verse')
      .filter((event) => event.hand === 'left')
      .map((event) => Math.min(...event.notes) % 12)

    for (const root of passingRoots) expect(bass).toContain(root)
  })

  it.each(['waltz-1', 'pop-1', 'flamenco-1', 'slow-rock-2'] as const)(
    '%s: cửa sổ lệch ô vẫn cùng pha bass với phiên khúc',
    (styleId) => {
      const style = getStyle(styleId)!
      const beats = 4
      const chords = parseChordInput('C Am F G C Am F G').chords
      const reharm = reharmonize(chords, { beatsPerChord: beats })
      const full = reharm.final
      const hands = voiceLeadTwoHands(full, { dropRootFromRightHand: true })
      const backing = renderPattern(hands, style, {
        beatsPerChord: beats,
        beatsEach: chordDurations(full, beats),
      })
      const picked = full.slice(2, 6)
      const windowEvents = renderPattern(
        voiceLeadTwoHands(picked, { dropRootFromRightHand: true }),
        style,
        { beatsPerChord: beats, beatsEach: picked.map(() => beats) },
      )
      const song = buildArrangedSong({
        accompaniment: backing,
        fills: [],
        solo: () => [],
        sources: [
          { name: 'Phiên', kind: 'verse', startBeat: 0, lengthBeats: 16 },
          { name: 'Điệp', kind: 'chorus', startBeat: 16, lengthBeats: 16 },
        ],
        steps: [
          { type: 'section', source: 0 },
          { type: 'section', source: 1 },
          { type: 'interlude', over: 0, loops: 1 },
        ],
        interludeRange: () => ({
          startBeat: 8,
          lengthBeats: 16,
          events: windowEvents,
        }),
        beatsPerMeasure: style.beatsPerMeasure,
      })
      const bar = style.beatsPerMeasure
      const phase = (kind: string) =>
        bassPhases(song, kind)
          .filter((beat) => beat < bar * 2)
          .map((beat) => beat % bar)
      expect(phase('interlude')).toEqual(phase('verse'))
    },
  )

  it('bossa giữ bass đảo phách, không rải đều như ballad', () => {
    const chords = parseChordInput('C Am F G').chords
    const beatsEach = chords.map(() => 4)
    const style = getStyle('bossa-nova-1')!
    const styleLeft = renderPattern(
      voiceLeadTwoHands(chords, { dropRootFromRightHand: true }),
      style,
      { beatsPerChord: 4, beatsEach },
    ).filter((event) => event.hand === 'left')
    const bass = interludeLeftHand({
      chords,
      beatsEach,
      styleId: 'bossa-nova-1',
      styleLeft,
    })
    const phases = bass.map((event) => Number((event.startBeat % 4).toFixed(2)))
    expect(phases.slice(0, 4)).not.toEqual([0, 1, 2, 3])
    expect(phases.some((beat) => beat % 1 !== 0)).toBe(true)
  })

  it('ballad giang tấu vẫn rải gốc-5-8-5', () => {
    const chords = parseChordInput('C Am F G').chords
    const beatsEach = chords.map(() => 4)
    const bass = interludeLeftHand({
      chords,
      beatsEach,
      styleId: 'pop-1',
      styleLeft: [],
    })
    expect(
      bass.slice(0, 4).map((event) => Number(event.startBeat.toFixed(2))),
    ).toEqual([0, 1, 2, 3])
  })

  it('đoạn giang tấu vẫn dài đúng bằng đoạn có lời', () => {
    const { song } = build('pop-1')
    const lengths = song.sections.map((section) => section.lengthBeats)
    expect(new Set(lengths).size).toBe(1)
  })
})
