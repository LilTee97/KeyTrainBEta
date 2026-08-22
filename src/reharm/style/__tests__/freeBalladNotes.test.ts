import { describe, expect, it } from 'vitest'
import { getStyle } from '../styleLibrary'
import { renderPattern } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { ParsedChord } from '../../types'
import type { SectionKind } from '../songStructure'

/**
 * Hai điệu rải tự do, kiểm trên **đúng đường app chạy**: tái hòa âm trước, rồi
 * mới dựng thế bấm.
 *
 * Bài kiểm cũ dùng hợp âm trơn nên không thấy lỗi — mà lỗi chỉ hiện ra khi thế
 * bấm đã được tô màu: `Cadd2` bấm `C4 D4 E4 G4` thì con số thứ hai trong ô nhịp
 * trỏ vào nốt Rê, tức bậc chín, và câu rải hoá thành chùm liền bậc.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const FREE = 'hai-pop-ballad-free'
const CHORUS = 'hai-pop-ballad-free-chorus'
const pc = (midi: number) => ((midi % 12) + 12) % 12

/** Vòng sau khi anh Khá tô màu đậm nhất — thứ đang thật sự vang. */
function coloured(text: string): ParsedChord[] {
  return reharmonize(parseChordInput(text).chords, {
    intensity: 'full',
    tonicColor: 'add9',
    majorColor: 'add9',
    minorColor: 'm9',
    dominantColor: '13',
    key: KEY,
  }).final.filter((chord) => !chord.passing)
}

const play = (chords: readonly ParsedChord[], id: string, extra = {}) =>
  renderPattern(voiceLeadTwoHands(chords), getStyle(id)!, {
    beatsPerChord: 4,
    ...extra,
  })

/** Cao độ của hợp âm đang vang ở một phách. */
function tonesAt(chords: readonly ParsedChord[], beat: number): Set<number> {
  const chord = chords[Math.min(chords.length - 1, Math.floor(beat / 4))]
  return new Set(chord.quality.intervals.map((step) => (chord.root + step) % 12))
}

describe('BUG 1 — mọi nốt phải là nốt của hợp âm đang vang', () => {
  for (const text of ['C Am F G', 'Cmaj7 Am7 Dm7 G7', 'C Em Am D7 F G']) {
    for (const id of [FREE, CHORUS]) {
      it(`${id} trên ${text}: không nốt nào lạc`, () => {
        const chords = coloured(text)
        const events = play(chords, id)
        expect(events.length).toBeGreaterThan(0)

        for (const event of events) {
          const tones = tonesAt(chords, event.startBeat)
          for (const note of event.notes) {
            expect(
              tones.has(pc(note)),
              `${id} @ ${event.startBeat}: cao độ ${pc(note)}`,
            ).toBe(true)
          }
        }
      })
    }
  }

  it('ô Đô trưởng rải đúng 1-3-5-8, không dính bậc chín của add2', () => {
    const chords = coloured('C Am F G')
    expect(chords[0].symbol).toBe('Cadd2')

    for (const id of [FREE, CHORUS]) {
      const trongÔ = play(chords, id)
        .filter((event) => event.startBeat < 4)
        .flatMap((event) => event.notes.map(pc))

      // Rê là bậc chín của Đô: có trong thế bấm, nhưng câu rải không được lấy.
      expect(new Set(trongÔ), id).toEqual(new Set([0, 4, 7]))
    }
  })

  it('tay trái chỉ đi nốt gốc và quãng năm, không chromatic', () => {
    const chords = coloured('C Am F G')
    for (const id of [FREE, CHORUS]) {
      for (const event of play(chords, id).filter((e) => e.hand === 'left')) {
        const chord = chords[Math.min(3, Math.floor(event.startBeat / 4))]
        const cho = [0, 7].map((step) => (chord.root + step) % 12)
        expect(cho, `${id} @ ${event.startBeat}`).toContain(pc(event.notes[0]))
      }
    }
  })

  it('thế bấm thiếu bậc ba thì lùi sang bậc bảy, không đập nốt gốc', () => {
    // Am9 hay được bấm E-G-B: không có bậc ba nào để lấy.
    const chords = coloured('C Am F G')
    expect(chords[1].symbol).toBe('Am9')

    const trongÔ = play(chords, FREE)
      .filter((e) => e.hand === 'right' && e.startBeat >= 4 && e.startBeat < 8)
      .map((e) => pc(e.notes[0]))

    // Ít nhất ba cao độ khác nhau: câu rải, không phải gõ một nốt.
    expect(new Set(trongÔ).size).toBeGreaterThanOrEqual(3)
  })
})

describe('BUG 2a — hợp âm chia đôi', () => {
  const split = (id: string, chords: readonly ParsedChord[]) =>
    play(chords, id, { beatsEach: [2, 2, 4, 4], cellBreaks: [0, 2] })

  it('nửa 2 mở bằng nốt gốc hợp âm B, không kế nốt hợp âm A', () => {
    const chords = coloured('C Am F G')
    for (const id of [FREE, CHORUS]) {
      const đầuNửa2 = split(id, chords)
        .filter((e) => e.hand === 'right' && e.startBeat >= 2 && e.startBeat < 4)
        .sort((a, b) => a.startBeat - b.startBeat)[0]

      expect(đầuNửa2, id).toBeTruthy()
      expect(pc(đầuNửa2.notes[0]), `${id}: nửa 2 phải mở bằng nốt gốc`).toBe(
        chords[1].root,
      )
    }
  })

  it('nửa 2 chỉ dùng nốt của hợp âm B', () => {
    const chords = coloured('C Am F G')
    const tones = new Set(
      chords[1].quality.intervals.map((step) => (chords[1].root + step) % 12),
    )
    for (const id of [FREE, CHORUS]) {
      for (const event of split(id, chords).filter(
        (e) => e.startBeat >= 2 && e.startBeat < 4,
      )) {
        for (const note of event.notes) {
          expect(tones.has(pc(note)), `${id} @ ${event.startBeat}`).toBe(true)
        }
      }
    }
  })

  it('mỗi nửa có bass mạnh ở đầu nửa, và đó là tiếng to nhất của nửa', () => {
    const chords = coloured('C Am F G')
    for (const id of [FREE, CHORUS]) {
      for (const start of [0, 2]) {
        const bass = split(id, chords)
          .filter(
            (e) =>
              e.hand === 'left' &&
              e.startBeat >= start - 0.001 &&
              e.startBeat < start + 2 - 0.001,
          )
          .sort((a, b) => a.startBeat - b.startBeat)

        expect(
          bass.length,
          `${id}: nửa ở phách ${start} không có bass`,
        ).toBeGreaterThan(0)
        expect(bass[0].startBeat - start).toBeLessThan(0.001)
        for (const sau of bass.slice(1)) {
          expect(sau.velocity, `${id} @ ${sau.startBeat}`).toBeLessThan(
            bass[0].velocity,
          )
        }
      }
    }
  })

  it('hợp âm trơn: nửa 2 ra đúng A - C - E của Am', () => {
    const chords = parseChordInput('C Am F G').chords
    const nửa2 = split(FREE, chords)
      .filter((e) => e.hand === 'right' && e.startBeat >= 2 && e.startBeat < 4)
      .sort((a, b) => a.startBeat - b.startBeat)
      .map((e) => pc(e.notes[0]))

    expect(nửa2[0]).toBe(9)
    expect(new Set(nửa2)).toEqual(new Set([9, 0, 4]))
  })
})

describe('BUG 2b — đoạn điệp khúc tự đổi sang bản điệp khúc', () => {
  it('bảng ghép có free -> free-chorus', () => {
    expect(resolveStyleForSection(FREE, 'chorus')).toBe(CHORUS)
    expect(resolveStyleForSection(FREE, 'verse')).toBe(FREE)
    expect(resolveStyleForSection(CHORUS, 'verse')).toBe(FREE)
  })

  it('đoạn điệp khúc dựng ra ô nhịp KHÁC đoạn phiên khúc', () => {
    const chords = coloured('C Am F G C Am F G')
    const kindAt = (beat: number): SectionKind =>
      beat >= 16 ? 'chorus' : 'verse'

    const events = renderPattern(voiceLeadTwoHands(chords), getStyle(FREE)!, {
      beatsPerChord: 4,
      cellAt: (beat) =>
        getStyle(resolveStyleForSection(FREE, kindAt(beat)))!.cell!,
      cellBreaks: [0, 16],
    })

    const beatsIn = (from: number, to: number) =>
      [
        ...new Set(
          events
            .filter((e) => e.startBeat >= from && e.startBeat < to)
            .map((e) => Number((e.startBeat - from).toFixed(3))),
        ),
      ].sort((a, b) => a - b)

    const verse = beatsIn(0, 16)
    const chorus = beatsIn(16, 32)
    expect(chorus).not.toEqual(verse)
    // Điệp khúc dày hơn: nhiều mốc phách hơn trong cùng số ô.
    expect(chorus.length).toBeGreaterThan(verse.length)
  })

  it('điệu không có cặp thì không đổi gì, không vỡ', () => {
    expect(resolveStyleForSection('hai-pop-ballad', 'chorus')).toBe(
      'hai-pop-ballad-chorus',
    )
    for (const id of ['hai-tango', 'pop-1', 'swing-1']) {
      expect(resolveStyleForSection(id, 'chorus'), id).toBe(id)
    }
  })
})
