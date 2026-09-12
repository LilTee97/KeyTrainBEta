import { expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { CA_PHAO_BOSSA_IMPROVED as style } from '../styleLibrary/caPhaoBossa'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { buildArrangedSong } from '../arrangement'

const make = (kind: 'interlude' | 'outro', tonic = 9, take = 0, opening = 'Am') =>
  buildPhraseSection({ kind, key: { tonic: tonic as PitchClass, scale: 'minor' }, style,
    beatsPerChord: 4, dropRoot: true, take, range: { low: 62, high: 84 },
    opening: parseChordInput(opening).chords[0]!,
    solo: () => { throw new Error('Không dùng fallback cũ') },
  } satisfies PhraseSectionOptions)!

it('Am dùng được trần 79 của app; tầm quá hẹp báo lỗi thay vì gập câu', () => {
  for (const kind of ['interlude', 'outro'] as const) {
    for (let take = 0; take < 4; take++) {
      const options: PhraseSectionOptions = { kind, key: { tonic: 9, scale: 'minor' }, style,
        beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [], take, range: { low: 62, high: 79 } }
      expect(buildPhraseSection(options)?.unavailableReason).toBeUndefined()
      expect(buildPhraseSection({ ...options, range: { low: 70, high: 74 } })?.events).toEqual([])
    }
  }
})

it.each(['interlude', 'outro'] as const)('%s: 12 giọng, 4 bản, nguyên câu và không cắt mất kết', kind => {
  for (let tonic = 0; tonic < 12; tonic++) {
    const takes = [0, 1, 2, 3].map(take => make(kind, tonic, take))
    expect(new Set(takes.map(t => JSON.stringify(t.events))).size).toBe(4)
    for (const result of takes) {
      expect(result.unavailableReason).toBeUndefined()
      expect(result.lengthBeats).toBe(kind === 'outro' ? 24 : 32)
      expect(result.beatsEach.reduce((a, b) => a + b, 0)).toBe(result.lengthBeats)
      expect(result.sourcePhrase?.id).toBe('nguoi-hay-quen-em-di-' + kind)
      for (const e of result.events) {
        expect(e.startBeat + e.durationBeats).toBeLessThanOrEqual(result.lengthBeats)
        expect(e.durationBeats).toBeGreaterThan(0)
        // RH đệm có tầm C4–C6 riêng; giai điệu yêu cầu D4–C6.
        if (e.hand === 'right') expect(e.notes.every(n => n >= 60 && n <= 84)).toBe(true)
      }
      for (const right of result.events.filter(e => e.hand === 'right')) {
        const clash = result.events.find(left => left.hand === 'left' &&
          left.startBeat < right.startBeat + right.durationBeats - 1e-6 &&
          right.startBeat < left.startBeat + left.durationBeats - 1e-6 &&
          left.notes.some(l => right.notes.some(r => Math.abs(l - r) === 1)))
        expect(clash, `giọng ${tonic}, RH ${JSON.stringify(right)}, LH ${JSON.stringify(clash)}`).toBeUndefined()
      }
      if (kind === 'outro') {
        const ending = result.events.filter(e => e.startBeat === 20)
        expect(ending).toHaveLength(2)
        expect(ending.every(e => e.durationBeats === 4)).toBe(true)
        expect(ending.find(e => e.hand === 'right')!.notes.map(n => (n - tonic + 120) % 12).sort((a, b) => a - b))
          .toEqual([0, 3, 7])
      } else {
        expect(result.events.filter(e => e.hand === 'right' && e.startBeat >= 31)).toEqual([])
        expect(result.events.filter(e => e.hand === 'right' && e.durationBeats === .22).length).toBeGreaterThan(16)
      }
    }
  }
})

it('giang hút về đích thật; cả bài giữ đủ hai vòng giang và 6 ô outro', () => {
  expect(make('interlude', 9, 0, 'Dm').chords.slice(-2)).toEqual(['Em7b5', 'A7'])
  const flags: (boolean | undefined)[] = []
  const song = buildArrangedSong({ accompaniment: [], fills: [], solo: () => [],
    sources: [{ kind: 'verse', name: 'Phiên', startBeat: 0, lengthBeats: 4 }],
    steps: [{ type: 'interlude', over: 0, loops: 2, restAfter: 0 }, { type: 'section', source: 0 }, { type: 'outro' }],
    phrase: () => make('outro'),
    interludeRange: (_over, _next, take, lastLoop) => {
      flags.push(lastLoop)
      const result = make('interlude', 9, take, lastLoop ? 'Dm' : 'Am')
      return { startBeat: 0, lengthBeats: result.lengthBeats, events: result.events,
        solo: () => [], composed: true, kyHieu: result.chords, kyHieuBeats: result.beatsEach }
    },
  })
  expect(flags).toEqual([false, true])
  expect(song.totalBeats).toBe(92)
  expect(Math.max(...song.events.map(e => e.startBeat + e.durationBeats))).toBe(92)
})
