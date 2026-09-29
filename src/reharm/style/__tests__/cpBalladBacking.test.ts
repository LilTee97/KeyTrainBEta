import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { planCpLicks } from '../../licky/cpLick'
import { buildBossaSoloSong } from '../../playback/bossaRhythmOnly'
import { caPhaoFullSolo } from '../caPhaoSolo'
import { planCpBalladBacking } from '../cpBalladConnections'
import { renderPattern } from '../patternRenderer'
import { CP_BALLAD_SONG_STYLES } from '../styleLibrary/caPhaoBalladSongs'
import { getStyle } from '../styleLibrary'
import type { TimelineEvent } from '../types'

const chords = parseChordInput('Gadd2 D9/F# Em(add9) D9 Cadd2 B9sus4 Em(add9)').chords
  .map(c => ({ ...c, voicingStyle: 'ca-phao' as const }))
const key = { tonic: 4 as const, scale: 'minor' as const }
const inWindow = (e: TimelineEvent, w: { start: number; end: number }) =>
  e.startBeat < w.end - 1e-6 && e.startBeat + e.durationBeats > w.start + 1e-6

describe('CP sheet ballads retain connections under color, licks and full solos', () => {
  it('protects all sheet variants across normal and advanced CP lick routes, including full vocals', () => {
    for (const style of CP_BALLAD_SONG_STYLES) {
      expect(style.cpBalladChordLeads, style.id).toBe(true)
      const plain = renderPattern(voiceLeadTwoHands(chords), style)
      const transitions = new Map([[5, { octaves: 2, restBeats: 2 }]])
      const connected = planCpBalladBacking(plain, chords, { style, key, beatsPerChord: 4, transitions })
      expect(connected.protectedWindows).toContainEqual({ start: 3, end: 4 })
      for (const fullTransitions of [false, true]) for (const vocal of [undefined, 'full' as const]) {
        for (const take of [0, 1, 5, 12]) {
          const plan = planCpLicks({ chords, style, key, backing: connected.backing,
            protectedWindows: connected.protectedWindows, beatsPerChord: 4,
            fullTransitions, vocal, sectionEnds: new Set([5]), take,
            extraFills: new Set([0, 2]), extraRuns: new Set([1, 3, 5]) })
          for (const w of connected.protectedWindows) {
            expect(plan.placements.every(p => p.end <= w.start + 1e-6 || p.start >= w.end - 1e-6)).toBe(true)
            expect(plan.backing.filter(e => e.startBeat >= w.start && e.startBeat < w.end))
              .toEqual(connected.backing.filter(e => e.startBeat >= w.start && e.startBeat < w.end))
            expect(plan.events.some(e => inWindow(e, w))).toBe(false)
          }
        }
      }
      if (style.family === 'ca-phao-ballad-acdd') {
        const run = connected.backing.filter(e => e.hand === 'left' && e.startBeat >= 22 && e.startBeat < 24)
        expect(run.map(e => e.startBeat)).toEqual([22, 22.25, 22.5, 22.75, 23, 23.25, 23.5, 23.75])
        expect(run.at(-1)!.startBeat + run.at(-1)!.durationBeats).toBe(24)
      }
    }
  })

  it('keeps the sung links after assembling real full solo sections', () => {
    for (const id of ['ca-phao-ballad-co-em-cho', 'ca-phao-ballad-acdd']) {
      const style = getStyle(id)!
      const connected = planCpBalladBacking(renderPattern(voiceLeadTwoHands(chords), style), chords,
        { style, key, beatsPerChord: 4, transitions: new Map() })
      const plan = planCpLicks({ chords, style, key, ...connected, beatsPerChord: 4,
        fullTransitions: true, extraRuns: new Set([0, 1, 2, 3]), take: 3 })
      const song = buildBossaSoloSong(plan.backing, 28,
        [{ name: 'Verse', kind: 'verse', startBeat: 0, lengthBeats: 28 }],
        [{ type: 'intro' }, { type: 'section', source: 0 }, { type: 'outro' }],
        kind => caPhaoFullSolo({ kind, key, style, thay: 'ca-phao', caPhaoFull: true,
          beatsPerChord: 4, dropRoot: true, opening: chords[0], solo: () => [], take: 3 }), plan.events, true)
      expect(song.phraseWarnings).toEqual([])
      const firstSource = song.sections.find(s => s.kind === 'verse')!
      expect(firstSource).toBeDefined()
      const offset = firstSource.startBeat
      for (const w of connected.protectedWindows) {
        const expected = connected.backing.filter(e => e.startBeat >= w.start && e.startBeat < w.end)
          .map(e => ({ ...e, startBeat: e.startBeat + offset }))
        for (const note of expected) expect(song.events).toContainEqual(note)
      }
    }
  })

  it('lets a future sheet style inherit the policy, without touching Bossa or walking', () => {
    const source = getStyle('ca-phao-ballad-co-em-cho')!
    const future = { ...source, id: 'future-cp-sheet', family: 'future-cp-sheet' }
    const plain = renderPattern(voiceLeadTwoHands(chords), source)
    const options = { key, beatsPerChord: 4, transitions: new Map() }
    expect(planCpBalladBacking(plain, chords, { ...options, style: future }).protectedWindows.length).toBeGreaterThan(0)
    for (const style of [getStyle('ca-phao-bossa-improved')!, getStyle('pop-1')!])
      expect(planCpBalladBacking(plain, chords, { ...options, style })).toEqual({ backing: plain, protectedWindows: [] })
    expect(planCpBalladBacking(plain, chords, { ...options, style: source, walkingOn: true }))
      .toEqual({ backing: plain, protectedWindows: [] })
  })

  it('wires the shared plan through playback and practice without gating it on CP Lick', () => {
    const app = readFileSync(new URL('../../ReharmHome.tsx', import.meta.url), 'utf8')
    expect(app).toContain("const cpLick = intensity === 'caPhao' || cpLickSelected")
    expect(app).toContain('const plan = planCpBalladBacking(rawBacking, withPassing, {')
    expect(app).toContain('protectedWindows: accompanimentPlan.protectedWindows')
    expect(app).toContain('const accompaniment = accompanimentPlan.backing')
    expect(app).not.toContain("style.family === 'ca-phao-ballad-acdd' && !cpLick")
    expect(app).not.toContain("style.family === 'ca-phao-ballad-co-em-cho' && !cpLick")
  })
})
