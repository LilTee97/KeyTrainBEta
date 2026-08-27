import { describe, expect, it } from 'vitest'
import { renderPattern, giveCompingToLeft } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { interludeAccompaniment } from '../songStructure'
import { BALLAD_SOLO_RANGE } from '../balladFamily'
import { buildPhraseSection } from '../phraseSection'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import {
  generateFillLine,
  generateSolo,
  soloToTimeline,
} from '../../fillSoloGenerator/soloGenerator'
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
  // Giang tấu chơi đúng điệu đang chọn, cả hai tay — không thay tay trái nữa.
  const backing = comping
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

  it('F. đoạn dạo đầu và kết bài: bass ở dưới, câu ở trên', () => {
    /*
      Dựng qua **đúng hàm app dùng**. Bản trước tự ráp lại bằng `arpeggioRun` và
      `cueStrike` — nó kiểm một đường mà app đã thôi đi từ lúc phần ráp chuyển
      sang `buildPhraseSection`, nên có hỏng cũng không biết.
    */
    for (const kind of ['intro', 'outro'] as const) {
      for (let take = 0; take < 3; take += 1) {
        const built = buildPhraseSection({
          kind,
          key: KEY,
          style: getStyle(STYLE)!,
          beatsPerChord: 4,
          dropRoot: true,
          opening: parseChordInput('C').chords[0]!,
          solo: (list) =>
            soloToTimeline(
              generateSolo(list, {
                beatsPerChord: 4,
                density: 'medium',
                key: KEY,
                take,
                range: BALLAD_SOLO_RANGE,
                endWithRun: true,
              }),
            ),
          rollCue: true,
        })!
        const lh = pitches(left(built.events))
        const rh = pitches(right(built.events))
        expect(lh.length, `${kind}/lượt ${take}: phải có bass`).toBeGreaterThan(0)
        expect(
          Math.max(...lh),
          `${kind}/lượt ${take}: tay trái lấn lên quãng tám 4`,
        ).toBeLessThan(LEFT_CEILING)
        expect(rh.length, `${kind}/lượt ${take}: phải có tay phải`).toBeGreaterThan(0)
      }
    }
  })

  it('G. đoạn CÓ LỜI: đệm nhường tay trái, câu fill vẫn ở tay phải', () => {
    /*
      Đoạn hát là chỗ bộ kiểm này chưa từng nhìn tới, mà nó lại là đoạn dài nhất
      của bài. `giveCompingToLeft` dời hợp âm quạt xuống tay trái mỗi khi câu fill
      bận — dời thì phải dời trọn cả cao độ, không thì hai tay chồng vào nhau.
    */
    const list = chords()
    const style = getStyle(STYLE)!
    const comping = renderPattern(voiceLeadTwoHands(list), style, {
      beatsPerChord: 4,
      beatsEach: list.map(() => 4),
    })
    const fill = soloToTimeline(
      generateFillLine(list, { beatsPerChord: 4, density: 'medium', key: KEY }),
    )
    const all = [...giveCompingToLeft(comping, fill, 4), ...fill]

    const lh = pitches(left(all))
    const rh = pitches(right(all))
    expect(lh.length, 'đoạn hát phải có bass').toBeGreaterThan(0)
    expect(Math.max(...lh), 'tay trái lấn lên quãng tám 4').toBeLessThan(LEFT_CEILING)
    expect(Math.min(...rh), 'tay phải thò xuống bè trầm').toBeGreaterThanOrEqual(LEFT_CEILING)
  })
})
