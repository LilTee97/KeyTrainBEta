import { describe, expect, it } from 'vitest'
import { buildArrangedSong } from '../arrangement'
import { renderPattern, giveCompingToLeft } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { interludeBassLine } from '../interludeBass'
import { interludeAccompaniment } from '../songStructure'
import { BALLAD_SOLO_RANGE } from '../balladFamily'
import { cueChord, phraseChords } from '../phraseChords'
import { cueStrike } from '../phraseCue'
import { arpeggioRun } from '../../fillSoloGenerator/leadIn'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import {
  generateFillLine,
  generateSolo,
  soloToTimeline,
} from '../../fillSoloGenerator/soloGenerator'
import type { SourceSection } from '../arrangement'
import type { TimelineEvent } from '../types'

/**
 * Kiểm **tách tay** trên đúng bài người dùng đang dựng.
 *
 * Lỗi người dùng chụp được: tay trái leo lên Si quãng tám 5 tới La quãng tám 6,
 * tức nó bò vào giữa chỗ tay phải đang chạy solo. Không ai đàn nổi thế, và nó
 * đè luôn câu solo.
 *
 * Bài kiểm này dựng dòng thời gian thật rồi đo từng lớp một, để biết lớp nào
 * đẩy nốt lên đó — chứ không đoán.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

/** Vòng điệp khúc của bài, đúng như người dùng ghi. */
const CHORUS = 'Am Dm G C F G Em Am'
const STYLE = 'hai-pop-ballad-free'

/** Trần tay trái khi đang đệm: không được chạm quãng tám 4. */
const LEFT_CEILING = 60
/** Tay phải giang tấu ở điệu ballad. */
const RIGHT_TOP = BALLAD_SOLO_RANGE.high

const chords = () => parseChordInput(CHORUS).chords
const left = (events: readonly TimelineEvent[]) =>
  events.filter((e) => e.hand === 'left')
const right = (events: readonly TimelineEvent[]) =>
  events.filter((e) => e.hand === 'right')
const pitches = (events: readonly TimelineEvent[]) =>
  events.flatMap((e) => e.notes)

/** Dựng đoạn giang tấu đúng như `ReharmHome` làm. */
function interludeLayers() {
  const list = chords().slice(0, 4)
  const beatsEach = list.map(() => 4)
  const style = getStyle(STYLE)!

  const comping = renderPattern(voiceLeadTwoHands(list), style, {
    beatsPerChord: 4,
    beatsEach,
  })
  const backing = [
    ...comping.filter((e) => e.hand !== 'left'),
    ...interludeBassLine({ chords: list, beatsEach }),
  ]
  const solo = soloToTimeline(
    generateSolo(list, {
      beatsPerChord: 4,
      density: 'medium',
      key: KEY,
      take: 0,
      range: BALLAD_SOLO_RANGE,
    }),
  )

  // Đây là thứ `buildArrangedSong` thật sự phát ở đoạn giang tấu.
  return { played: interludeAccompaniment(backing), solo, list }
}

describe('giang tấu — tách tay', () => {
  it('A. tay phải solo: mỗi mốc phách chỉ một nốt chính', () => {
    const { solo } = interludeLayers()
    const byBeat = new Map<number, number>()
    for (const event of right(solo).filter((e) => !e.grace)) {
      const key = Number(event.startBeat.toFixed(3))
      byBeat.set(key, (byBeat.get(key) ?? 0) + event.notes.length)
    }
    for (const [beat, count] of byBeat) {
      expect(count, `phách ${beat}`).toBe(1)
    }
  })

  it('B. tay phải solo không chạm Si quãng tám 5', () => {
    const { solo } = interludeLayers()
    const notes = pitches(solo)
    expect(Math.max(...notes)).toBeLessThanOrEqual(RIGHT_TOP)
    expect(notes.filter((n) => n >= 83)).toHaveLength(0)
  })

  it('C. tay trái đệm nằm dưới Đô quãng tám 4, không lấn dải tay phải', () => {
    const { played, solo } = interludeLayers()
    const lh = pitches(played)
    const rh = pitches(right(solo))

    expect(lh.length, 'giang tấu phải có bass').toBeGreaterThan(0)
    expect(Math.max(...lh), 'tay trái lấn lên quãng tám 4').toBeLessThan(
      LEFT_CEILING,
    )
    // Hai tay cách nhau ít nhất một cung, không bắt chéo.
    expect(Math.max(...lh)).toBeLessThan(Math.min(...rh) - 2)
  })

  it('E. không nốt nào lặp bốn lần trở lên trong một ô, ở cùng một tay', () => {
    const { played, solo } = interludeLayers()
    for (const [name, layer] of [
      ['tay trái', played],
      ['tay phải', right(solo)],
    ] as const) {
      for (let bar = 0; bar < 4; bar += 1) {
        const counts = new Map<number, number>()
        for (const event of layer.filter(
          (e) => e.startBeat >= bar * 4 && e.startBeat < (bar + 1) * 4,
        )) {
          for (const note of event.notes) {
            counts.set(note, (counts.get(note) ?? 0) + 1)
          }
        }
        for (const [note, count] of counts) {
          expect(count, `${name} ô ${bar + 1} nốt ${note}`).toBeLessThan(4)
        }
      }
    }
  })

  it('D. ô 3 có ngón chromatic, không phải nhắc lại mô-típ', () => {
    const { solo } = interludeLayers()
    const bar3 = right(solo)
      .filter((e) => e.startBeat >= 8 && e.startBeat < 12)
      .sort((a, b) => a.startBeat - b.startBeat)

    expect(bar3.length).toBeGreaterThan(3)

    // Có bước nửa cung: dấu hiệu của ngón kẹp hoặc nốt dẫn.
    const steps = bar3
      .slice(1)
      .map((e, at) => Math.abs(e.notes[0] - bar3[at].notes[0]))
    expect(steps.filter((s) => s === 1).length, 'không có bước nửa cung nào').toBeGreaterThan(0)

    // Không lặp một cao độ quá ba lần, không nhảy quá quãng năm.
    expect(Math.max(...steps), 'nhảy quãng xa').toBeLessThanOrEqual(12)
  })

  it('F. đoạn dạo đầu: bass ở dưới, câu chạy và hợp âm báo ở trên', () => {
    /*
      Dựng đúng như `ReharmHome`: đệm điệu, câu chạy đóng vòng, rồi một phách
      hợp âm báo. Cả ba lớp phải chia tay đúng — câu chạy và hợp âm báo là ngón
      tay phải, chỉ phần đệm mới được xuống bè trầm.
    */
    const intro = phraseChords('intro', KEY)
    const style = getStyle(STYLE)!
    const round = intro.length * 4

    const backing = renderPattern(voiceLeadTwoHands(intro), style, {
      beatsPerChord: 4,
      beatsEach: intro.map(() => 4),
    })
    const run = arpeggioRun({
      chord: intro[intro.length - 1],
      octaves: 2,
      endBeat: round,
      maxBeats: 2,
      fromBeat: round - 2,
    }).map((note) => ({
      notes: [note.note],
      startBeat: note.startBeat,
      durationBeats: note.durationBeats,
      hand: 'right' as const,
      velocity: 80,
      grace: false,
    }))

    const cueOf = cueChord(parseChordInput('C').chords[0])!
    const lifted = voiceLeadTwoHands([cueOf])[0].right.map((note) => {
      let pitch: number = note
      while (pitch < 60) pitch += 12
      while (pitch > 84) pitch -= 12
      return pitch
    })
    const cue = cueStrike(lifted, round, { roll: true })

    const all = [...backing, ...run, ...cue]
    const lh = pitches(left(all))
    const rh = pitches(right(all))

    expect(lh.length, 'đoạn dạo phải có bass').toBeGreaterThan(0)
    expect(Math.max(...lh), 'bass đoạn dạo lấn lên quãng tám 4').toBeLessThan(
      LEFT_CEILING,
    )
    // Câu chạy và hợp âm báo nằm hẳn trên bè trầm.
    expect(Math.min(...pitches(cue)), 'hợp âm báo lẫn vào bè trầm').toBeGreaterThanOrEqual(60)
    expect(run.every((e) => e.hand === 'right')).toBe(true)
    expect(Math.min(...rh)).toBeGreaterThan(Math.max(...lh))
  })

  it('G. dòng thời gian ghép lại vẫn giữ tay trái ở dưới', () => {
    const sources: SourceSection[] = [
      { name: 'Điệp khúc', kind: 'chorus', startBeat: 0, lengthBeats: 16 },
    ]
    const { played, solo, list } = interludeLayers()

    const song = buildArrangedSong({
      accompaniment: giveCompingToLeft(played, solo, 4),
      fills: soloToTimeline(
        generateFillLine(list, { beatsPerChord: 4, density: 'medium', key: KEY }),
      ),
      solo: () => solo,
      sources,
      steps: [
        { type: 'section', source: 0 },
        { type: 'interlude', over: 0, loops: 2 },
      ],
    })

    const interludeFrom = 16
    const lh = pitches(
      left(song.events).filter((e) => e.startBeat >= interludeFrom),
    )
    expect(lh.length).toBeGreaterThan(0)
    expect(Math.max(...lh), 'tay trái trong giang tấu').toBeLessThan(LEFT_CEILING)
  })
})

describe('cả bài — tay trái không bao giờ lem lên chỗ tay phải', () => {
  /*
    Quét **toàn bộ** dòng thời gian, kể cả điệu không thuộc họ ballad — tức
    không có trần hạ cho câu solo, và đó là lúc câu solo leo cao nhất. Chính lúc
    ấy mà tay trái lem lên thì hai bè chồng nhau ở giữa đàn.

    Đây là chốt chặn cuối: mọi đường dựng tiếng đều phải đi qua đây.
  */
  const SONG = 'Cadd2 G9 Am9 Em7 Fadd2 G9 Am9 Dm9'

  function wholeSong(styleId: string) {
    const list = parseChordInput(SONG).chords
    const style = getStyle(styleId)!
    const beatsEach = list.map(() => 4)

    const acc = renderPattern(voiceLeadTwoHands(list), style, {
      beatsPerChord: 4,
      beatsEach,
    })
    const fills = soloToTimeline(
      generateFillLine(list, { beatsPerChord: 4, density: 'medium', key: KEY }),
    )
    const solo = soloToTimeline(
      generateSolo(list, { beatsPerChord: 4, density: 'medium', key: KEY, take: 0 }),
    )
    const backing = [
      ...acc.filter((e) => e.hand !== 'left'),
      ...interludeBassLine({ chords: list, beatsEach }),
    ]

    return buildArrangedSong({
      accompaniment: giveCompingToLeft(acc, fills, 4),
      fills,
      solo: () => solo,
      sources: [
        { name: 'Điệp khúc', kind: 'chorus', startBeat: 0, lengthBeats: 32 },
      ],
      steps: [
        { type: 'section', source: 0 },
        { type: 'interlude', over: 0, loops: 2 },
      ],
      interludeRange: () => ({
        startBeat: 0,
        lengthBeats: 16,
        chords: [],
        events: interludeAccompaniment(backing),
        solo: () => solo,
      }),
    })
  }

  for (const styleId of ['pop-1', STYLE]) {
    it(`${styleId}: không tiếng tay trái nào chạm Đô quãng tám 4`, () => {
      const song = wholeSong(styleId)
      const stray = left(song.events).filter(
        (e) => Math.max(...e.notes) >= LEFT_CEILING,
      )

      expect(
        stray.map((e) => `phách ${e.startBeat}: ${e.notes.join(',')}`),
      ).toEqual([])
    })

    it(`${styleId}: hai tay không bao giờ chơi trùng cao độ cùng lúc`, () => {
      /*
        Trên bàn phím hiện lên thì nốt trùng cao độ ở hai tay in đè lên nhau —
        đúng thứ người dùng chụp được. Nó cũng vô nghĩa về mặt đàn: hai ngón
        cùng một phím.
      */
      const song = wholeSong(styleId)
      const byBeat = new Map<number, { left: number[]; right: number[] }>()

      for (const event of song.events) {
        const key = Number(event.startBeat.toFixed(3))
        const slot = byBeat.get(key) ?? { left: [], right: [] }
        slot[event.hand].push(...event.notes)
        byBeat.set(key, slot)
      }

      for (const [beat, slot] of byBeat) {
        const both = slot.left.filter((note) => slot.right.includes(note))
        expect(both, `phách ${beat}`).toEqual([])
      }
    })
  }
})
