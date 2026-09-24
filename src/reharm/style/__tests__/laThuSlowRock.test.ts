import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { LINH_NHI_SLOW_ROCK } from '../styleLibrary/linhNhiSlowRock'
import { renderPattern } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import type { TimelineEvent } from '../types'

const [verse, chorus] = LINH_NHI_SLOW_ROCK
const render = (chords: string, style = verse, options = {}) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), style, options)
const hand = (events: TimelineEvent[], which: 'left' | 'right') =>
  events.filter(e => e.hand === which).map(e => [e.startBeat, e.notes])

describe('Slow Rock Lá thư (Linh Nhi) — hai tay', () => {
  it('verse: LH rolls sheet cells c15–c16, RH sets one voice-led chord on beat 1 and lets it ring 3 eighths', () => {
    const events = render('Bb C')
    expect(hand(events, 'left').slice(0, 6))
      .toEqual([[0, [46]], [.5, [50]], [1, [53]], [1.5, [58]], [2, [53]], [2.5, [50]]])
    const [bb, c] = voiceLeadTwoHands(parseChordInput('Bb C').chords)
    expect(hand(events, 'right')).toEqual([[0, bb.right], [3, c.right]])
    for (const rh of events.filter(e => e.hand === 'right')) expect(rh.durationBeats).toBe(1.5)
  })

  it('never has both hands strike the same key at the same moment, in all 12 roots', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const style of [verse, chorus]) {
        const events = render(`${root} ${root}m`, style)
        for (const r of events.filter(e => e.hand === 'right')) {
          const clash = events.filter(l => l.hand === 'left' && Math.abs(l.startBeat - r.startBeat) < 1e-6)
            .flatMap(l => l.notes).filter(n => r.notes.includes(n))
          expect(clash, `${style.id} ${root} @${r.startBeat}`).toEqual([])
        }
      }
    }
  })

  it('chorus keeps the thumb inner voice of c41–c42 (A4 · D4 · D4 · D4) without the melody above it', () => {
    const events = render('D7 Gm', chorus)
    expect(hand(events, 'right')).toEqual([[0, [69]], [2.25, [62]], [3, [62]], [3.75, [62]]])
  })

  it('scales the section cell supplied by cellAt with gridUnit, like the main cell', () => {
    const events = render('D7 Gm', verse, { cellAt: () => chorus.cell! })
    expect(events.filter(e => e.hand === 'left').map(e => e.startBeat))
      .toEqual(chorus.cell!.left.map(hit => hit.beat / 2))
  })

  it('keeps the b7 of D7 in the chorus pulse and never doubles a pitch in one attack', () => {
    for (const chords of ['D7 Gm', 'D Gm', 'B7 E', 'Bb F', 'C Am', 'E A']) {
      for (const style of [verse, chorus]) {
        for (const event of render(chords, style)) {
          expect(new Set(event.notes).size, `${style.id} ${chords}`).toBe(event.notes.length)
        }
      }
    }
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
