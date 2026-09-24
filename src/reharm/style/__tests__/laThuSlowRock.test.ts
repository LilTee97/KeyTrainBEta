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
const left = (events: TimelineEvent[]) => events.filter(e => e.hand === 'left')

describe('Slow Rock Lá thư (Linh Nhi)', () => {
  it('plays sheet cell c15 on Bb — Bb2 D3 F3 Bb3 F3 D3, one triplet eighth each — and leaves RH to the melody', () => {
    const events = render('Bb C')
    expect(left(events).slice(0, 6).map(e => [e.startBeat, e.notes]))
      .toEqual([[0, [46]], [.5, [50]], [1, [53]], [1.5, [58]], [2, [53]], [2.5, [50]]])
    expect(events.filter(e => e.hand === 'right')).toEqual([])
  })

  it('scales the section cell supplied by cellAt with gridUnit, like the main cell', () => {
    const events = render('D7 Gm', verse, { cellAt: () => chorus.cell! })
    expect(left(events).map(e => e.startBeat)).toEqual(chorus.cell!.left.map(hit => hit.beat / 2))
  })

  it('keeps the b7 of D7 in the chorus pulse and never doubles a pitch in one attack', () => {
    for (const chords of ['D7 Gm', 'D Gm', 'B7 E', 'Bb F', 'C Am']) {
      for (const event of left(render(chords, chorus))) {
        expect(new Set(event.notes).size, chords).toBe(event.notes.length)
      }
    }
    const d7 = left(render('D7 Gm', chorus)).find(e => e.startBeat === 1.5)!
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
