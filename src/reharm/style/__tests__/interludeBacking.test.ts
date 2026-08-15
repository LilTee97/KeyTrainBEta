import { describe, expect, it } from 'vitest'
import { chordDurations, mainChordSpans } from '../../chordTiming'
import { parseChordInput } from '../../input/chordInputParser'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { buildSongTimeline, getSongForm } from '../songStructure'
import { getStyle } from '../styleLibrary'
import type { TimelineEvent } from '../types'

/**
 * Đoạn giang tấu **không chơi hợp âm lướt**.
 *
 * Câu solo đã bám vòng hợp âm chính; nếu tay đệm vẫn chơi hợp âm lướt thì hai
 * tay đánh nhau — tay trái vang `Bm7b5` trong khi tay phải chơi nốt của
 * `Cadd9`. Nói rộng hơn: hợp âm lướt là đồ trang trí cho **đoạn hát**; vào
 * giang tấu thì phần đệm rút về khung hoà âm gốc để nhường chỗ cho ngẫu hứng.
 */

function build(styleId: string) {
  const chords = parseChordInput('C Am F G').chords
  const first = reharmonize(chords, {})
  const reharm = reharmonize(chords, {
    acceptedPassing: first.passingSuggestions.filter(
      (suggestion) => suggestion.technique === 'secondary-ii-V',
    ),
    beatsPerChord: 4,
  })

  const style = getStyle(styleId)!
  const full = reharm.final
  const main = mainChordSpans(full, 4).map((span) => ({
    ...span.chord,
    beats: span.beats,
  }))

  const render = (list: typeof full) =>
    renderPattern(
      voiceLeadTwoHands(list, { dropRootFromRightHand: true }),
      style,
      { beatsPerChord: 4, beatsEach: chordDurations(list, 4) },
    )

  return {
    full,
    main,
    song: buildSongTimeline({
      accompaniment: render(full),
      interlude: render(main),
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

describe('phần đệm đoạn giang tấu', () => {
  it('không vang nốt gốc của hợp âm lướt nào', () => {
    for (const styleId of ['ballad', 'bossa-nova', 'valse', 'swing']) {
      const { full, song } = build(styleId)

      const passingRoots = new Set(
        full.filter((chord) => chord.passing).map((chord) => chord.root),
      )
      const mainRoots = new Set(
        full.filter((chord) => !chord.passing).map((chord) => chord.root),
      )

      // Chỉ xét nốt gốc riêng của hợp âm lướt, không trùng hợp âm chính nào
      const onlyPassing = [...passingRoots].filter(
        (root) => !mainRoots.has(root),
      )
      expect(onlyPassing.length).toBeGreaterThan(0)

      const bass = sectionEvents(song, 'interlude')
        .filter((event) => event.hand === 'left')
        .map((event) => Math.min(...event.notes) % 12)

      for (const root of onlyPassing) {
        expect(bass, `${styleId}`).not.toContain(root)
      }
    }
  })

  it('đoạn có lời vẫn chơi đủ hợp âm lướt', () => {
    const { full, song } = build('ballad')

    const passingRoots = full
      .filter((chord) => chord.passing)
      .map((chord) => chord.root)

    const bass = sectionEvents(song, 'verse')
      .filter((event) => event.hand === 'left')
      .map((event) => Math.min(...event.notes) % 12)

    for (const root of passingRoots) expect(bass).toContain(root)
  })

  it('giang tấu không còn ô nhịp bị chia đôi', () => {
    /*
      Hợp âm lướt mượn nửa ô nhịp; gỡ chúng ra thì hợp âm chính lấy lại trọn
      khoảng thời gian, nên mọi hợp âm ở đoạn giang tấu đều dài bằng nhau.
    */
    const { main } = build('ballad')

    expect(main).toHaveLength(4)
    for (const chord of main) expect(chord.beats).toBe(4)
  })

  it('đoạn giang tấu vẫn dài đúng bằng đoạn có lời', () => {
    const { song } = build('ballad')
    const lengths = song.sections.map((section) => section.lengthBeats)

    expect(new Set(lengths).size).toBe(1)
  })
})
