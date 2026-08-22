import { describe, expect, it } from 'vitest'
import {
  CHORUS_PAIRS,
  hasChorusVariant,
  isSplitAwareStyle,
  resolveStyleForSection,
} from '../sectionStyles'
import { getStyle } from '../styleLibrary'
import { renderPattern } from '../patternRenderer'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { SectionKind } from '../songStructure'
import type { TimelineEvent } from '../types'

/**
 * Vào điệp khúc thì phần đệm tự đổi sang bản điệp khúc của chính điệu đang
 * chọn, hết điệp khúc thì quay về. Người dùng không phải bấm tay giữa bài.
 */
const BEATS_PER_CHORD = 4

/** Bài giả: hai ô phiên khúc, hai ô điệp khúc, hai ô phiên khúc. */
const SECTIONS: { kind: SectionKind; startBeat: number; lengthBeats: number }[] = [
  { kind: 'verse', startBeat: 0, lengthBeats: 8 },
  { kind: 'chorus', startBeat: 8, lengthBeats: 8 },
  { kind: 'verse', startBeat: 16, lengthBeats: 8 },
]

const kindAt = (beat: number): SectionKind =>
  SECTIONS.find(
    (s) => beat >= s.startBeat - 0.001 && beat < s.startBeat + s.lengthBeats - 0.001,
  )?.kind ?? 'verse'

/** Dựng phần đệm đúng như `ReharmHome` làm, để kiểm cùng một đường đi. */
function play(styleId: string): TimelineEvent[] {
  const style = getStyle(styleId)!
  const chords = parseChordInput('C Am F G C Am').chords
  const voicings = voiceLeadTwoHands(chords)
  const swaps = hasChorusVariant(styleId)

  return renderPattern(voicings, style, {
    beatsPerChord: BEATS_PER_CHORD,
    ...(swaps
      ? {
          cellAt: (beat: number) =>
            getStyle(resolveStyleForSection(styleId, kindAt(beat)))?.cell ?? style.cell!,
          cellBreaks: SECTIONS.map((s) => s.startBeat),
        }
      : {}),
  })
}

/** Tiếng đàn rơi vào những phách nào, trong một khoảng. */
const beatsIn = (events: readonly TimelineEvent[], from: number, to: number) =>
  [
    ...new Set(
      events
        .filter((e) => e.startBeat >= from - 0.001 && e.startBeat < to - 0.001)
        .map((e) => Number((e.startBeat - from).toFixed(3))),
    ),
  ].sort((a, b) => a - b)

describe('bảng ghép phiên khúc - điệp khúc', () => {
  it('mọi cặp trong bảng đều trỏ tới điệu có thật', () => {
    for (const [verse, chorus] of Object.entries(CHORUS_PAIRS)) {
      expect(getStyle(verse)?.id, verse).toBe(verse)
      expect(getStyle(chorus)?.id, chorus).toBe(chorus)
    }
  })

  it('đoạn điệp khúc ra bản điệp khúc, đoạn khác ra bản chính', () => {
    for (const [verse, chorus] of Object.entries(CHORUS_PAIRS)) {
      expect(resolveStyleForSection(verse, 'chorus')).toBe(chorus)
      expect(resolveStyleForSection(verse, 'verse')).toBe(verse)
      // Giang tấu là chỗ nghỉ giữa hai lần cao trào, không phải cao trào.
      expect(resolveStyleForSection(verse, 'interlude')).toBe(verse)
    }
  })

  it('bấm sẵn bản điệp khúc thì phiên khúc vẫn tự lùi về bản chính', () => {
    for (const [verse, chorus] of Object.entries(CHORUS_PAIRS)) {
      expect(resolveStyleForSection(chorus, 'verse')).toBe(verse)
      expect(resolveStyleForSection(chorus, 'chorus')).toBe(chorus)
    }
  })

  it('điệu không có bản điệp khúc thì giữ nguyên cả bài', () => {
    for (const id of ['hai-tango', 'pop-1', 'swing-1', 'hai-rumba', 'hai-16-beat']) {
      expect(hasChorusVariant(id), id).toBe(false)
      for (const kind of ['verse', 'chorus', 'interlude'] as const) {
        expect(resolveStyleForSection(id, kind), `${id}/${kind}`).toBe(id)
      }
    }
  })

  it('alias quy về cùng một mối', () => {
    expect(resolveStyleForSection('hai-pop-ballad-1', 'chorus')).toBe(
      'hai-pop-ballad-chorus',
    )
    expect(resolveStyleForSection('ballad', 'chorus')).toBe('pop-1')
  })
})

describe('phần đệm đổi ô nhịp đúng ranh giới đoạn', () => {
  it('Pop Ballad (Hải): điệp khúc chơi hình khác phiên khúc', () => {
    const events = play('hai-pop-ballad')
    const verse = beatsIn(events, 0, 8)
    const chorus = beatsIn(events, 8, 16)
    const backToVerse = beatsIn(events, 16, 24)

    expect(chorus).not.toEqual(verse)
    // Hết điệp khúc thì quay về đúng hình của phiên khúc.
    expect(backToVerse).toEqual(verse)
  })

  it('biến tấu rải tự do cũng đổi được', () => {
    const events = play('hai-pop-ballad-free')
    expect(beatsIn(events, 8, 16)).not.toEqual(beatsIn(events, 0, 8))
  })

  it('điệp khúc vào ĐÚNG vạch đoạn, không trễ nhịp nào', () => {
    /*
      Ô nhịp phiên khúc của bản rải tự do dài 16 phách, dài hơn cả đoạn. Không
      cắt ở vạch thì nó tràn qua và điệp khúc phải chờ hết ô — trễ tám phách.
    */
    const events = play('hai-pop-ballad-free')
    expect(events.some((e) => Math.abs(e.startBeat - 8) < 0.001)).toBe(true)
  })

  it('điệu không có cặp thì cả bài đúng một hình', () => {
    const events = play('hai-tango')
    expect(beatsIn(events, 8, 16)).toEqual(beatsIn(events, 0, 8))
    expect(beatsIn(events, 16, 24)).toEqual(beatsIn(events, 0, 8))
  })

  it('đổi ô nhịp không làm mất tiếng: đoạn nào cũng có đủ hai tay', () => {
    for (const id of ['hai-pop-ballad', 'hai-pop-ballad-free']) {
      const events = play(id)
      for (const section of SECTIONS) {
        const inSection = events.filter(
          (e) =>
            e.startBeat >= section.startBeat - 0.001 &&
            e.startBeat < section.startBeat + section.lengthBeats - 0.001,
        )
        expect(
          inSection.some((e) => e.hand === 'left'),
          `${id} @ ${section.kind} ${section.startBeat}: mất tay trái`,
        ).toBe(true)
        expect(
          inSection.some((e) => e.hand === 'right'),
          `${id} @ ${section.kind} ${section.startBeat}: mất tay phải`,
        ).toBe(true)
      }
    }
  })
})

describe('hợp âm chia đôi: mỗi nửa ô một hợp âm, mỗi nửa một phách mạnh', () => {
  const FREE = 'hai-pop-ballad-free'
  const FREE_CHORUS = 'hai-pop-ballad-free-chorus'

  /** Ô đầu chia đôi cho C và Am, hai ô sau nguyên vẹn. */
  const SPLIT_BEATS = [2, 2, 4, 4]

  /** Dựng đúng như `ReharmHome`: cắt ô nhịp ở đầu mỗi nửa. */
  function playSplit(styleId: string) {
    const style = getStyle(styleId)!
    const chords = parseChordInput('C Am F G').chords
    const voicings = voiceLeadTwoHands(chords)

    const starts: number[] = []
    let running = 0
    for (const beats of SPLIT_BEATS) {
      starts.push(running)
      running += beats
    }
    const splitStarts = isSplitAwareStyle(styleId)
      ? starts.filter((_, index) => SPLIT_BEATS[index] < 4)
      : []

    return renderPattern(voicings, style, {
      beatsPerChord: 4,
      beatsEach: SPLIT_BEATS,
      ...(splitStarts.length > 0 ? { cellBreaks: splitStarts } : {}),
    })
  }

  it('hai điệu rải tự do đều mở ô mới ở giữa ô, điệu khác thì không', () => {
    expect(isSplitAwareStyle(FREE)).toBe(true)
    expect(isSplitAwareStyle(FREE_CHORUS)).toBe(true)
    for (const id of ['hai-pop-ballad', 'pop-1', 'hai-tango']) {
      expect(isSplitAwareStyle(id), id).toBe(false)
    }
  })

  it('mỗi nửa ô có phách mạnh của chính nó: bass ngay đầu nửa', () => {
    for (const id of [FREE, FREE_CHORUS]) {
      const events = playSplit(id)
      for (const start of [0, 2]) {
        expect(
          events.some(
            (e) => e.hand === 'left' && Math.abs(e.startBeat - start) < 0.001,
          ),
          `${id}: nửa ô bắt đầu ở phách ${start} không có bass`,
        ).toBe(true)
        expect(
          events.some(
            (e) => e.hand === 'right' && Math.abs(e.startBeat - start) < 0.001,
          ),
          `${id}: nửa ô bắt đầu ở phách ${start} không mở rải`,
        ).toBe(true)
      }
    }
  })

  it('nửa ô chỉ có MỘT mốc mạnh, ở ngay đầu nửa', () => {
    /*
      Ô trọn vẹn có hai mốc: mạnh ở đầu ô, nhẹ ở giữa ô. Nửa ô chỉ được **một**
      mốc mạnh, đặt ở đầu nửa. Điệp khúc vẫn được chen tiếng bass giật chồm sau
      đó — nó là tiếng phụ, đánh nhẹ hơn, không phải mốc thứ hai; nên chỗ này đo
      lực nhấn chứ không đếm đầu tiếng.
    */
    for (const id of [FREE, FREE_CHORUS]) {
      const events = playSplit(id)
      for (const start of [0, 2]) {
        const bass = events
          .filter(
            (e) =>
              e.hand === 'left' &&
              e.startBeat >= start - 0.001 &&
              e.startBeat < start + 2 - 0.001,
          )
          .sort((a, b) => a.startBeat - b.startBeat)

        expect(bass.length, `${id}: nửa ô ở phách ${start} không có bass`).toBeGreaterThan(0)
        expect(bass[0].startBeat - start, `${id}: mốc mạnh không ở đầu nửa`).toBeLessThan(0.001)

        for (const later of bass.slice(1)) {
          expect(
            later.velocity,
            `${id} @ ${later.startBeat}: tiếng sau to ngang mốc mạnh`,
          ).toBeLessThan(bass[0].velocity)
        }
      }
    }
  })

  it('nửa sau MỞ LẠI câu rải từ nốt gốc hợp âm của nó', () => {
    /*
      Đây là chỗ dễ sai nhất. Thế bấm sắp theo cao độ chứ không theo bậc: La thứ
      bấm Đô - Mi - La, nên "nốt thứ nhất của thế bấm" ra nốt Đô. Nửa sau mở
      bằng nốt đó thì nghe y như còn dính hợp âm Đô của nửa trước, dù trên giấy
      đã sang La thứ.
    */
    const chords = parseChordInput('C Am F G').chords
    const rootOf = (index: number) => chords[index].root

    for (const id of [FREE, FREE_CHORUS]) {
      const events = playSplit(id)

      for (const [half, start] of [[0, 0], [1, 2]] as const) {
        const first = events
          .filter(
            (e) =>
              e.hand === 'right' &&
              e.startBeat >= start - 0.001 &&
              e.startBeat < start + 2 - 0.001,
          )
          .sort((a, b) => a.startBeat - b.startBeat)[0]

        expect(first, `${id}: nửa ${half + 1} không có tiếng rải nào`).toBeTruthy()
        expect(
          ((first.notes[0] % 12) + 12) % 12,
          `${id}: nửa ${half + 1} mở không đúng nốt gốc`,
        ).toBe(rootOf(half))
      }
    }
  })

  it('nửa sau không kế nốt giữa hay cuối hình rải của nửa trước', () => {
    for (const id of [FREE, FREE_CHORUS]) {
      const events = playSplit(id)
      const rh = (start: number) =>
        events
          .filter(
            (e) =>
              e.hand === 'right' &&
              e.startBeat >= start - 0.001 &&
              e.startBeat < start + 2 - 0.001,
          )
          .sort((a, b) => a.startBeat - b.startBeat)

      const first = rh(0)
      const second = rh(2)
      // Hai nửa mở cùng một vị trí trong hình rải, nên lệch phách đầu phải bằng nhau.
      expect(second[0].startBeat - 2, id).toBeCloseTo(first[0].startBeat - 0, 5)
      expect(second.length, id).toBe(first.length)
    }
  })

  it('hai nửa độc lập: nửa sau chơi nốt của hợp âm nửa sau', () => {
    const chords = parseChordInput('C Am F G').chords
    for (const id of [FREE, FREE_CHORUS]) {
      const events = playSplit(id)
      const second = events.filter(
        (e) => e.startBeat >= 2 - 0.001 && e.startBeat < 4 - 0.001,
      )
      expect(second.length, id).toBeGreaterThan(0)

      const am = new Set(
        chords[1].quality.intervals.map((step) => (chords[1].root + step) % 12),
      )
      for (const event of second) {
        for (const note of event.notes) {
          expect(
            am.has(((note % 12) + 12) % 12),
            `${id} @ ${event.startBeat}: không phải nốt của Am`,
          ).toBe(true)
        }
      }
    }
  })

  it('ô trọn vẹn vẫn giữ luật cũ: bass đầu ô và giữa ô', () => {
    const events = playSplit(FREE)
    const third = events.filter(
      (e) => e.hand === 'left' && e.startBeat >= 4 - 0.001 && e.startBeat < 8 - 0.001,
    )
    expect(third.map((e) => e.startBeat - 4)).toContain(0)
    expect(third.map((e) => e.startBeat - 4)).toContain(2)
  })
})
