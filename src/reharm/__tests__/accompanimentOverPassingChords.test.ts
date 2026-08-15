import { describe, expect, it } from 'vitest'
import { chordDurations, chordStarts } from '../chordTiming'
import { parseChordInput } from '../input/chordInputParser'
import { reharmonize } from '../reharmEngine/reharmPipeline'
import { renderPattern } from '../style/patternRenderer'
import { getStyle } from '../style/styleLibrary'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'

/**
 * Phần đệm phải nghe được **mọi** hợp âm, kể cả hợp âm lướt chỉ dài một phách.
 *
 * Mẫu tiết tấu cố định đánh vào vị trí cố định trong ô nhịp, còn hợp âm lướt
 * đổi ở giữa ô — hai thứ không biết nhau. Đo trước khi sửa: điệu swing đánh
 * bass ở phách 0, 4, 8, 12 trong khi hợp âm đổi ở mười chỗ khác nhau, nên
 * **sáu trên mười hợp âm không có nốt bass nào**.
 */

const STYLES = ['ballad', 'bossa-nova', 'valse', 'swing']

function build(text: string, withPassing: boolean) {
  const chords = parseChordInput(text).chords
  const first = reharmonize(chords, {})
  const accepted = withPassing
    ? first.passingSuggestions.filter((s) => s.technique === 'secondary-ii-V')
    : []

  const reharm = reharmonize(chords, {
    acceptedPassing: accepted,
    beatsPerChord: 4,
  })

  return {
    chords: reharm.final,
    hands: voiceLeadTwoHands(reharm.final, { dropRootFromRightHand: true }),
    durations: chordDurations(reharm.final, 4),
    starts: chordStarts(reharm.final, 4),
  }
}

describe('phần đệm khi có hợp âm lướt', () => {
  it('mỗi hợp âm đều được đánh ít nhất một tiếng ở mỗi tay', () => {
    for (const styleId of STYLES) {
      const { chords, hands, durations, starts } = build('C Am F G', true)
      const events = renderPattern(hands, getStyle(styleId)!, {
        beatsPerChord: 4,
        beatsEach: durations,
      })

      chords.forEach((chord, index) => {
        const from = starts[index]
        const to = from + durations[index]

        for (const hand of ['left', 'right'] as const) {
          const hits = events.filter(
            (event) =>
              event.hand === hand &&
              event.notes.length > 0 &&
              event.startBeat >= from - 0.001 &&
              event.startBeat < to - 0.001,
          )

          expect(
            hits.length,
            `${styleId}: ${chord.symbol} ở phách ${from} không có tiếng ${hand}`,
          ).toBeGreaterThan(0)
        }
      })
    }
  })

  it('không tiếng nào ngân đè sang hợp âm sau', () => {
    for (const styleId of STYLES) {
      const { hands, durations, starts } = build('C Am F G', true)
      const events = renderPattern(hands, getStyle(styleId)!, {
        beatsPerChord: 4,
        beatsEach: durations,
      })

      for (const event of events) {
        const nextStart = starts.find((start) => start > event.startBeat + 0.001)
        if (nextStart === undefined) continue

        expect(
          event.startBeat + event.durationBeats,
          `${styleId}: tiếng ở phách ${event.startBeat} ngân qua ${nextStart}`,
        ).toBeLessThanOrEqual(nextStart + 0.001)
      }
    }
  })

  it('vòng không chèn gì thì phần đệm y như cũ', () => {
    /*
      Quan trọng không kém: bản sửa chỉ được động tới trường hợp có hợp âm
      lướt, không được đổi tiếng của điệu ở trường hợp thường.
    */
    const expected: Record<string, number> = {
      ballad: 8,
      'bossa-nova': 8,
      valse: 6,
      swing: 4,
    }

    for (const styleId of STYLES) {
      const { hands, durations } = build('C Am F G', false)
      const events = renderPattern(hands, getStyle(styleId)!, {
        beatsPerChord: 4,
        beatsEach: durations,
      })

      const left = events.filter((event) => event.hand === 'left')
      expect(left.length, styleId).toBe(expected[styleId])
    }
  })
})
