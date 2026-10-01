import { describe, expect, it } from 'vitest'
import {
  CHORUS_PAIRS,
  hasChorusVariant,
  hasTonicVariant,
  resolveStyleForChord,
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

  it('đoạn điệp khúc ra bản điệp khúc, phiên khúc ra bản chính', () => {
    for (const [verse, chorus] of Object.entries(CHORUS_PAIRS)) {
      expect(resolveStyleForSection(verse, 'chorus')).toBe(chorus)
      expect(resolveStyleForSection(verse, 'verse')).toBe(verse)
    }
  })

  /*
    Giang tấu là chỗ nghỉ giữa hai lần cao trào, không phải cao trào. Ngoại lệ duy nhất từng có — Bolero trữ tình
    (Linh Nhi), đặc tả gộp điệp khúc và giang tấu — đã xoá 30/9/2026 cùng điệu ấy.
  */
  it('giang tấu giữ bản chính', () => {
    for (const verse of Object.keys(CHORUS_PAIRS)) {
      expect(resolveStyleForSection(verse, 'interlude'), verse).toBe(verse)
    }
  })

  it('bấm sẵn bản điệp khúc thì phiên khúc vẫn tự lùi về bản chính', () => {
    for (const [verse, chorus] of Object.entries(CHORUS_PAIRS)) {
      expect(resolveStyleForSection(chorus, 'verse')).toBe(verse)
      expect(resolveStyleForSection(chorus, 'chorus')).toBe(chorus)
    }
  })

  it('điệu không có bản điệp khúc thì giữ nguyên cả bài', () => {
    for (const id of ['tango-tu-n-improv-bai-04-00004', 'twist', 'ca-phao-ballad-cu-di', 'ca-phao-bossa-improved',
      'bolero-tu-n-improv-bai-04-00001']) {
      expect(hasChorusVariant(id), id).toBe(false)
      for (const kind of ['verse', 'chorus', 'interlude'] as const) {
        expect(resolveStyleForSection(id, kind), `${id}/${kind}`).toBe(id)
      }
    }
  })
})

describe('phần đệm đổi ô nhịp đúng ranh giới đoạn', () => {
  // 30/9/2026: kiểm trên hai điệu còn giữ có bản điệp. Cũ: Pop Ballad (Hải) và bản rải tự do — đã xoá.
  it('Có Em Chờ: điệp khúc chơi hình khác phiên khúc', () => {
    const events = play('ca-phao-ballad-co-em-cho')
    const verse = beatsIn(events, 0, 8)
    const chorus = beatsIn(events, 8, 16)
    const backToVerse = beatsIn(events, 16, 24)

    expect(chorus).not.toEqual(verse)
    // Hết điệp khúc thì quay về đúng hình của phiên khúc.
    expect(backToVerse).toEqual(verse)
  })

  it('Để em cũng đổi được', () => {
    const events = play('ca-phao-ballad-de-em-roi-xa')
    expect(beatsIn(events, 8, 16)).not.toEqual(beatsIn(events, 0, 8))
  })

  it('điệp khúc vào ĐÚNG vạch đoạn, không trễ nhịp nào', () => {
    /*
      Ô nhịp dài hơn đoạn mà không cắt ở vạch thì tràn qua, điệp khúc phải chờ hết ô. Ca gốc (bản rải tự do 16 phách,
      Hải) đã xoá 30/9/2026; hai điệu còn giữ ô 8 phách, vừa khít đoạn — vẫn giữ kiểm tiếng vào đúng vạch.
    */
    for (const id of ['ca-phao-ballad-co-em-cho', 'ca-phao-ballad-de-em-roi-xa']) {
      const events = play(id)
      expect(events.some((e) => Math.abs(e.startBeat - 8) < 0.001), id).toBe(true)
    }
  })

  it('điệu không có cặp thì cả bài đúng một hình', () => {
    const events = play('tango-tu-n-improv-bai-04-00004')
    expect(beatsIn(events, 8, 16)).toEqual(beatsIn(events, 0, 8))
    expect(beatsIn(events, 16, 24)).toEqual(beatsIn(events, 0, 8))
  })

  it('đổi ô nhịp không làm mất tiếng: đoạn nào cũng có đủ hai tay', () => {
    for (const id of ['ca-phao-ballad-co-em-cho', 'ca-phao-ballad-de-em-roi-xa']) {
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

// 30/9/2026: bỏ nhóm test "hợp âm chia đôi" (`isSplitAwareStyle`) — chỉ Pop Ballad tự do (Hải) và Bolero trữ tình
// (Linh Nhi) dùng, cả hai đã xoá.

/*
  HAI PHÉP ĐỔI, HAI BẢN CHẤT KHÁC NHAU.

  Đổi theo ĐOẠN là quyết định phối khí của người dùng. Đổi theo HOÀ ÂM là thói
  quen đo được của người soạn. Trộn chúng làm một là mất đúng chỗ đáng học.

  Số đo trên bản ký âm Linh Nhi: 12 trên 19 ô dùng vòm cao rơi vào hợp âm Rê,
  chủ âm của bài. Còn đếm theo đoạn thì vòm thấp thắng ở MỌI đoạn — nên đổi
  theo đoạn không phải thứ người soạn làm.
*/
describe('đổi điệu theo hoà âm, khác với đổi theo đoạn', () => {
  const RE = 2
  const SI = 11

  it('hợp âm chủ thì mở vòm rộng', () => {
    expect(resolveStyleForChord('bolero-linh-nhi-2', RE, RE)).toBe('bolero-linh-nhi-2-chorus')
  })

  it('hợp âm khác chủ âm thì giữ vòm thấp', () => {
    for (const root of [SI, 6, 9, 4]) {
      expect(resolveStyleForChord('bolero-linh-nhi-2', root, RE), `goc ${root}`)
        .toBe('bolero-linh-nhi-2')
    }
  })

  it('điệu không khai vòm theo chủ âm thì không đổi gì', () => {
    for (const id of ['ca-phao-ballad-cu-di', 'bolero-tu-n-improv-bai-04-00001', 'ca-phao-ballad-co-em-cho']) {
      expect(hasTonicVariant(id), id).toBe(false)
      expect(resolveStyleForChord(id, RE, RE), id).toBe(id)
    }
    expect(hasTonicVariant('bolero-linh-nhi-2')).toBe(true)
  })

  it('hai phép đổi doc lập nhau', () => {
    // Cùng một điệu: theo đoạn thì điệp khúc mới đổi, theo hoà âm thì chủ âm
    // mới đổi. Hai câu hỏi khác nhau, hai câu trả lời khác nhau.
    expect(resolveStyleForSection('bolero-linh-nhi-2', 'verse')).toBe('bolero-linh-nhi-2')
    expect(resolveStyleForChord('bolero-linh-nhi-2', RE, RE)).toBe('bolero-linh-nhi-2-chorus')
  })
})
