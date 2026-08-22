import { describe, expect, it } from 'vitest'
import { getStyle } from '../styleLibrary'
import { renderPattern } from '../patternRenderer'
import { BALLAD_SOLO_RANGE } from '../balladFamily'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import type { ParsedChord } from '../../types'
import type { TimelineEvent } from '../types'

/**
 * Câu rải phải **đàn được**: một cột thời gian một nốt, tay với tới, không vọt
 * lên quãng tám thứ sáu.
 *
 * Đây là bộ canh cho hai điệu rải tự do. Nó đo trên bản đã tô màu đậm nhất, vì
 * đó là lúc thế bấm dày nhất và dễ sinh chồng nốt nhất.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const FREE = ['hai-pop-ballad-free', 'hai-pop-ballad-free-chorus'] as const

function coloured(text: string): ParsedChord[] {
  return reharmonize(parseChordInput(text).chords, {
    intensity: 'full',
    tonicColor: 'add9',
    majorColor: 'add9',
    minorColor: 'm9',
    dominantColor: '13',
    key: KEY,
  }).final
}

const play = (id: string, chords: readonly ParsedChord[], extra = {}) =>
  renderPattern(voiceLeadTwoHands(chords), getStyle(id)!, {
    beatsPerChord: 4,
    ...extra,
  })

const right = (events: readonly TimelineEvent[]) =>
  events.filter((event) => event.hand === 'right')

/** Những nốt tay phải còn đang vang tại một thời điểm. */
function ringingAt(events: readonly TimelineEvent[], beat: number): number[] {
  return right(events)
    .filter(
      (event) =>
        event.startBeat <= beat && event.startBeat + event.durationBeats > beat,
    )
    .flatMap((event) => event.notes)
}

describe('một cột thời gian, một nốt tay phải', () => {
  for (const id of FREE) {
    it(`${id}: không cột nào quá 2 nốt`, () => {
      const events = right(play(id, coloured('C Am F G')))
      const byBeat = new Map<number, number>()
      for (const event of events) {
        const key = Number(event.startBeat.toFixed(3))
        byBeat.set(key, (byBeat.get(key) ?? 0) + event.notes.length)
      }
      for (const [beat, count] of byBeat) {
        expect(count, `${id} @ phách ${beat}`).toBeLessThanOrEqual(2)
      }
    })

    it(`${id}: không gõ trùng cao độ trong cùng một cột`, () => {
      const events = right(play(id, coloured('C Am F G')))
      const seen = new Map<string, number>()
      for (const event of events) {
        for (const note of event.notes) {
          const key = `${event.startBeat.toFixed(3)}:${note}`
          seen.set(key, (seen.get(key) ?? 0) + 1)
        }
      }
      for (const [key, count] of seen) {
        expect(count, `${id} @ ${key}`).toBe(1)
      }
    })
  }
})

describe('tay với tới được', () => {
  for (const id of FREE) {
    it(`${id}: nốt cùng vang không quá 2, và cách nhau trong một quãng tám`, () => {
      const chords = coloured('C Am F G')
      const events = play(id, chords)

      for (const event of right(events)) {
        const ringing = ringingAt(events, event.startBeat + 1e-6)
        expect(
          ringing.length,
          `${id} @ phách ${event.startBeat}: ${ringing.length} nốt cùng vang`,
        ).toBeLessThanOrEqual(2)

        if (ringing.length > 1) {
          expect(
            Math.max(...ringing) - Math.min(...ringing),
            `${id} @ phách ${event.startBeat}: quãng tay`,
          ).toBeLessThanOrEqual(12)
        }
      }
    })

    it(`${id}: nằm trong tầm đệm, không vọt lên quãng tám 5 trở lên`, () => {
      const notes = right(play(id, coloured('C Am F G'))).flatMap((e) => e.notes)
      // Si quãng tám 5 là 83; câu rải đệm ballad không được chạm tới.
      expect(Math.max(...notes), id).toBeLessThan(83)
      expect(Math.min(...notes), id).toBeGreaterThanOrEqual(48)
    })

    it(`${id}: trong một ô, không bước nào quá một quãng tám`, () => {
      /*
        Đo **trong từng ô** vì đó là phạm vi ô nhịp quyết định được. Sang ô mới
        là hợp âm mới, và chỗ đặt quãng tám của hợp âm ấy do bộ dẫn giọng chọn,
        không phải ô nhịp — chỗ nối ô kiểm riêng bên dưới.

        Ngưỡng là một quãng tám chứ không phải quãng năm: ô nhịp có ký hiệu `+`
        để câu rải với lên quãng tám trên, đó là bước cố ý và tay vẫn với tới.
        Quá một quãng tám mới là nhảy hụt.
      */
      const events = right(play(id, coloured('C Am F G'))).sort(
        (a, b) => a.startBeat - b.startBeat,
      )

      for (let bar = 0; bar < 4; bar += 1) {
        const notes = events
          .filter((e) => e.startBeat >= bar * 4 && e.startBeat < (bar + 1) * 4)
          .map((e) => e.notes[0])

        for (let at = 1; at < notes.length; at += 1) {
          expect(
            Math.abs(notes[at] - notes[at - 1]),
            `${id} ô ${bar + 1}: bước từ nốt ${at - 1} sang ${at}`,
          ).toBeLessThanOrEqual(12)
        }
      }
    })

    it(`${id}: nối ô — nốt đầu ô sau không xa nốt cuối ô trước quá quãng tám`, () => {
      const events = right(play(id, coloured('C Am F G'))).sort(
        (a, b) => a.startBeat - b.startBeat,
      )
      const inBar = (bar: number) =>
        events.filter((e) => e.startBeat >= bar * 4 && e.startBeat < (bar + 1) * 4)

      for (let bar = 1; bar < 4; bar += 1) {
        const trước = inBar(bar - 1).at(-1)
        const sau = inBar(bar)[0]
        if (!trước || !sau) continue
        expect(
          Math.abs(sau.notes[0] - trước.notes[0]),
          `${id}: nối ô ${bar} sang ${bar + 1}`,
        ).toBeLessThanOrEqual(12)
      }
    })

    it(`${id}: tay phải luôn cao hơn tay trái`, () => {
      const events = play(id, coloured('C Am F G'))
      const lowestRight = Math.min(...right(events).flatMap((e) => e.notes))
      const highestLeft = Math.max(
        ...events.filter((e) => e.hand === 'left').flatMap((e) => e.notes),
      )
      expect(lowestRight, id).toBeGreaterThan(highestLeft)
    })
  }

  it('ô chia đôi cũng giữ đúng các luật trên', () => {
    for (const id of FREE) {
      const chords = coloured('C Am F G')
      const events = play(id, chords, {
        beatsEach: [2, 2, 4, 4],
        cellBreaks: [0, 2],
      })

      for (const event of right(events)) {
        expect(event.notes.length, `${id} @ ${event.startBeat}`).toBeLessThanOrEqual(2)
        const ringing = ringingAt(events, event.startBeat + 1e-6)
        expect(ringing.length, `${id} @ ${event.startBeat}`).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('câu solo trên điệu ballad không leo hết bàn phím', () => {
  const chords = parseChordInput('C Am F G').chords

  const rangeOf = (range?: typeof BALLAD_SOLO_RANGE) => {
    const notes: number[] = []
    for (let take = 0; take < 8; take += 1) {
      for (const note of soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take,
          ...(range ? { range } : {}),
        }),
      )) {
        notes.push(...note.notes)
      }
    }
    return { low: Math.min(...notes), high: Math.max(...notes) }
  }

  it('mọi điệu đều nằm trong tầm người đệm, không riêng ballad', () => {
    // Sol quãng tám 6 là tầm độc tấu, quá cao cho đệm hát.
    expect(rangeOf().high).toBeLessThanOrEqual(81)
  })

  it('ballad hạ trần xuống tầm tay người đệm', () => {
    const capped = rangeOf(BALLAD_SOLO_RANGE)
    // Si quãng tám 5 trở lên là chỗ người dùng báo nghe phi thực tế.
    expect(capped.high).toBeLessThan(83)
    expect(capped.low).toBeGreaterThanOrEqual(55)
  })
})
