import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { hoCuaDieu } from '../hoDieu'
import { slowRockSoanLinhNhi } from '../linhNhiSolo'
import { resolveStyleForSection } from '../sectionStyles'

const verse = getStyle('slow-rock-lt')!
const chorus = getStyle('slow-rock-lt-chorus')!
const render = (chords: string, style = verse) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), style)

describe('independent Codex Slow Rock LT', () => {
  it('keeps the Claude style and saved IDs distinct', () => {
    const original = getStyle('slow-rock-la-thu')!
    expect(original.familyName).toBe('Slow Rock Lá thư')
    expect(verse.familyName).toBe('Slow Rock LT')
    expect(verse.cell).not.toBe(original.cell)
    expect(verse.fillCell).not.toBe(original.fillCell)
    expect(verse.cell!.lengthBeats).toBe(6)
    expect(original.cell!.lengthBeats).toBe(12)
    expect(isCodexStyle(verse.id)).toBe(true)
    expect(isCodexStyle(original.id)).toBe(false)
    expect(resolveStyleForSection(verse.id, 'chorus')).toBe(chorus.id)
    expect(resolveStyleForSection(chorus.id, 'verse')).toBe(verse.id)
    expect(resolveStyleForSection(original.id, 'chorus')).toBe('slow-rock-la-thu-chorus')
    expect(hoCuaDieu(verse.id)).toBe('slow-rock')
    expect(slowRockSoanLinhNhi(verse, false, null)).toBe(true)
    expect(slowRockSoanLinhNhi(verse, false, 'ton-hung')).toBe(false)
  })

  it('plays measured c15 as six even notes and leaves the melody hand free', () => {
    const events = render('Bb C')
    expect(events.filter(e => e.hand === 'right')).toEqual([])
    expect(events.map(e => [e.startBeat, e.notes])).toEqual([
      [0, [46]], [.5, [50]], [1, [53]], [1.5, [58]], [2, [53]], [2.5, [50]],
      // App đặt gốc C ở C2; giữ nguyên bậc và tiết tấu khi chuyển từ Bb.
      [3, [36]], [3.5, [40]], [4, [43]], [4.5, [48]], [5, [43]], [5.5, [40]],
    ])
  })

  it('plays c42 on Gm without importing the preceding D bass', () => {
    const events = render('Gm', chorus)
    expect(events.filter(e => e.hand === 'right')).toEqual([])
    expect(events.map(e => [e.startBeat, e.notes])).toEqual([
      [0, [43, 55]], [.5, [50, 58, 62]], [.75, [43, 50, 58]],
      [1, [50, 55, 58, 62]], [1.5, [43, 50, 55, 58, 62]],
      [2, [50, 55, 58, 62]], [2.5, [43, 55]],
    ])
  })

  it('keeps valid, distinct keys across all roots for verse, chorus and fill', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const style of [verse, chorus, { ...verse, cell: verse.fillCell! }]) {
        for (const event of render(`${root} ${root}m ${root}7`, style)) {
          expect(event.durationBeats).toBeGreaterThan(0)
          expect(event.notes.every(n => n >= 36 && n <= 79)).toBe(true)
          expect(new Set(event.notes).size).toBe(event.notes.length)
        }
      }
    }
  })
})
