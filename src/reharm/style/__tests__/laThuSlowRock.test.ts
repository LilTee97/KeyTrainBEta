import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { generateFillLine, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import { LINH_NHI_SLOW_ROCK } from '../styleLibrary/linhNhiSlowRock'
import { giveCompingToLeft, renderPattern, swapAtFills, yieldToFill } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import type { StylePattern, TimelineEvent } from '../types'
import { transitionMuteWindows } from '../sectionStyles'
import { mainChordSpans } from '../../chordTiming'

const [verse, chorus] = LINH_NHI_SLOW_ROCK
const atFill = (style: StylePattern): StylePattern => ({ ...style, cell: style.fillCell! })
const render = (chords: string, style = verse, options = {}) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), style, options)
const hand = (events: TimelineEvent[], which: 'left' | 'right') =>
  events.filter(e => e.hand === which).map(e => [e.startBeat, e.notes])

describe('Slow Rock Lá thư (Linh Nhi)', () => {
  it('while singing: LH rolls sheet cells c15–c16, RH is left to the voice', () => {
    const events = render('Bb C')
    expect(hand(events, 'left').slice(0, 6))
      .toEqual([[0, [46]], [.5, [50]], [1, [53]], [1.5, [58]], [2, [53]], [2.5, [50]]])
    expect(hand(events, 'right')).toEqual([])
    expect(hand(render('D7 Gm', chorus), 'right')).toEqual([])
  })

  it('at a fill chord replays sheet cell c22 on A7 note for note (the 594e7f7 numbers)', () => {
    const events = render('A7', atFill(verse))
    expect(hand(events, 'left')).toEqual([
      [0, [45, 57]], [.5, [45]], [1, [45, 57]], [1.5, [45]], [2, [52]], [2.5, [45, 57]],
    ])
    expect(hand(events, 'right')).toEqual([
      [.5, [57, 61, 64, 69]], [.75, [57, 61, 64, 69]], [1, [61, 64, 69]], [1.5, [61, 64, 69]],
    ])
  })

  it('swapAtFills changes only the chords where a fill starts', () => {
    const backing = render('Bb C Dm')
    const fillBacking = render('Bb C Dm', atFill(verse))
    const fill: TimelineEvent[] = [{ notes: [48], startBeat: 4.5, durationBeats: .25, hand: 'left', velocity: 60 }]
    const out = swapAtFills(backing, fillBacking, fill, [3, 3, 3])
    const inside = (e: TimelineEvent, a: number, b: number) => e.startBeat >= a && e.startBeat < b
    expect(out.filter(e => inside(e, 0, 3))).toEqual(backing.filter(e => inside(e, 0, 3)))
    expect(out.filter(e => inside(e, 3, 6))).toEqual(fillBacking.filter(e => inside(e, 3, 6)))
    expect(out.filter(e => inside(e, 6, 9))).toEqual(backing.filter(e => inside(e, 6, 9)))
  })

  it('in the app pipeline the RH holds a chord as the bass fill starts, as in 594e7f7', () => {
    const chords = parseChordInput('Em(add9) Em(add9) Am9 Em(add9)').chords
    const voicings = voiceLeadTwoHands(chords)
    const fills = soloToTimeline(generateFillLine(chords, { beatsPerChord: 3, fillBassChance: .8, take: 0 }))
    const bassFill = fills.filter(e => e.hand === 'left')
    expect(bassFill.length).toBeGreaterThan(0)
    const out = yieldToFill(giveCompingToLeft(swapAtFills(
      renderPattern(voicings, verse), renderPattern(voicings, atFill(verse)), fills, [3, 3, 3, 3],
    ), fills, verse.beatsPerMeasure), fills)
    // Nốt ĐẦU của câu fill bè trầm trong mỗi hợp âm (3 nốt đen): v2 ngân hợp âm tay phải
    // 2 móc đơn từ tiếng 4, phủ phần đầu câu fill; hai nốt cuối chạy trần sang ô sau.
    const starts = bassFill.filter(f => !bassFill.some(g => g.startBeat < f.startBeat &&
      Math.floor(g.startBeat / 3) === Math.floor(f.startBeat / 3)))
    expect(starts.length).toBeGreaterThan(0)
    for (const f of starts) {
      const held = out.some(e => e.hand === 'right' &&
        e.startBeat <= f.startBeat + 1e-6 && e.startBeat + e.durationBeats > f.startBeat)
      expect(held, `fill @${f.startBeat}`).toBe(true)
    }
  })

  it('split chord (half a 6/8 bar): rolls three notes, no chord stabs, no swap to the fill cell', () => {
    // Người dùng 24/9/2026: "khi chia đôi hợp âm đừng đánh kiểu dặm hợp âm mà hãy theo kiểu rải".
    expect(verse.raiHopAmChiaDoi).toBe(true)
    const [em, am, b7] = parseChordInput('Em Am B7').chords
    const chords = [em!, { ...am!, beats: 1.5 }, { ...b7!, beats: 1.5 }, em!]
    const opts = { beatsPerChord: 3, fillBassChance: .8, take: 0 }
    const inSplit = (e: TimelineEvent) => e.hand === 'right' && e.startBeat >= 3 - 1e-6 && e.startBeat < 6 - 1e-6
    const notMoiMoc = (evs: TimelineEvent[]) => [...new Set(evs.map(e => e.startBeat))]
      .map(at => evs.filter(e => Math.abs(e.startBeat - at) < 1e-6).flatMap(e => e.notes).length)
    const cu = soloToTimeline(generateFillLine(chords, opts)).filter(inSplit)
    expect(notMoiMoc(cu)).toEqual([3, 3, 3, 3])
    const rai = soloToTimeline(generateFillLine(chords, { ...opts, raiChiaDoi: true })).filter(inSplit)
    expect(notMoiMoc(rai)).toEqual([1, 1, 1, 1, 1, 1])
    for (const [from, to] of [[3, 4.5], [4.5, 6]]) {
      const trong = rai.filter(e => e.startBeat >= from - 1e-6 && e.startBeat < to - 1e-6)
      expect(trong.map(e => e.startBeat - from)).toEqual([0, .5, 1])
      expect(trong.map(e => e.notes[0]!)).toEqual([...trong.map(e => e.notes[0]!)].sort((x, y) => x - y))
    }
    const backing = render('Em Am B7 Em')
    const fillBacking = render('Em Am B7 Em', atFill(verse))
    expect(swapAtFills(backing, fillBacking, rai, [3, 1.5, 1.5, 3], 3)).toEqual(backing)
  })

  it('two-hand trial: LH on strong eighths 1 · 4, RH chords on weak eighths 2 · 3 · 5 · 6', () => {
    // Người dùng 25/9/2026: "phách mạnh là phách 1 và 4, còn lại là phách nhẹ. Hãy chia đều ra để đánh
    // đệm phối hợp 2 tay".
    const haiTay = LINH_NHI_SLOW_ROCK.find(st => st.id === 'slow-rock-la-thu-hai-tay')!
    const diep = LINH_NHI_SLOW_ROCK.find(st => st.id === 'slow-rock-la-thu-hai-tay-chorus')!
    for (const st of [haiTay, diep]) {
      const events = render('Am Dm', st)
      expect([...new Set(events.filter(e => e.hand === 'left').map(e => e.startBeat % 3))]).toEqual([0, 1.5])
      expect([...new Set(events.filter(e => e.hand === 'right').map(e => e.startBeat % 3))]).toEqual([.5, 1, 2, 2.5])
    }
    expect(resolveStyleForSection('slow-rock-la-thu-hai-tay', 'chorus')).toBe('slow-rock-la-thu-hai-tay-chorus')
    expect(hoCuaDieu('slow-rock-la-thu-hai-tay')).toBe('slow-rock')
  })

  it('transition with "comp 2 beats · rest 0": comps first, the run lands on the barline, no silence after', () => {
    // Người dùng 25/9/2026: "vẫn ko hề đánh đệm mà chạy nốt luôn và chạy xong vẫn nghỉ phách".
    const chords = parseChordInput('Am Dm E7 Am F').chords.map(c => ({ ...c, beats: 6 }))
    const tr = new Map([[3, { octaves: 2, delayBeats: 1, restBeats: 0 }]])
    const spans = mainChordSpans(chords, 6)
    const mute = transitionMuteWindows(verse.id, spans, tr)
    const fills = soloToTimeline(generateFillLine(chords, { beatsPerChord: 6, fillBassChance: .8, take: 0, sectionEnds: tr }))
    const run = fills.filter(e => e.startBeat >= 18 - 1e-6 && e.startBeat <= 24 + 1e-6)
    expect(Math.max(...run.map(e => e.startBeat))).toBeCloseTo(24, 6)
    expect(mute).toEqual([{ from: Math.min(...run.map(e => e.startBeat)), to: 24 }])
    const dem = render('Am Dm E7 Am F', verse, { beatsPerChord: 6, beatsEach: [6, 6, 6, 6, 6], muteWindows: mute })
      .filter(e => e.startBeat >= 18 - 1e-6 && e.startBeat < mute[0]!.from - 1e-6)
    expect(dem.length).toBeGreaterThanOrEqual(6)
  })

  it('never has both hands strike the same key at the same moment, in all 12 roots', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const style of [verse, chorus, atFill(verse)]) {
        const events = render(`${root} ${root}m`, style)
        for (const r of events.filter(e => e.hand === 'right')) {
          const clash = events.filter(l => l.hand === 'left' && Math.abs(l.startBeat - r.startBeat) < 1e-6)
            .flatMap(l => l.notes).filter(n => r.notes.includes(n))
          expect(clash, `${style.id} ${root} @${r.startBeat}`).toEqual([])
        }
        for (const event of events) expect(new Set(event.notes).size, `${style.id} ${root}`).toBe(event.notes.length)
      }
    }
  })

  it('scales the section cell supplied by cellAt with gridUnit, like the main cell', () => {
    const events = render('D7 Gm', verse, { cellAt: () => chorus.cell! })
    expect(events.filter(e => e.hand === 'left').map(e => e.startBeat))
      .toEqual(chorus.cell!.left.map(hit => hit.beat / 2))
  })

  it('keeps the b7 of D7 in the chorus pulse', () => {
    const d7 = render('D7 Gm', chorus).find(e => e.hand === 'left' && e.startBeat === 1.5)!
    expect(d7.notes).toEqual([50, 54, 60])
  })

  it('is one Slow Rock button whose chorus variant switches in by section', () => {
    expect(hoCuaDieu(verse.id)).toBe('slow-rock')
    expect(kieuTrongHo('slow-rock')).toContain(verse)
    expect(kieuTrongHo('slow-rock')).not.toContain(chorus)
    expect(resolveStyleForSection(verse.id, 'chorus')).toBe(chorus.id)
    expect(resolveStyleForSection(chorus.id, 'verse')).toBe(verse.id)
  })
})
