import { describe, expect, it } from 'vitest'
import evidence from '../../../../Reference/CA-PHAO-BALLAD-SONGS.json'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { CP_BALLAD_SONG_STYLES as styles, CP_BALLAD_SONG_FAMILIES } from '../styleLibrary/caPhaoBalladSongs'
import { getStyle, styleFamilies } from '../styleLibrary'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'
import { renderPattern } from '../patternRenderer'

// 30/9/2026: người dùng xoá nút Ngày mai em đi và Ballad ACDD — nhóm sheet Codex chỉ còn Có Em Chờ. 2/10/2026: bỏ bản điệp
// (ô 25–26), chỉ còn phiên.
const sourceBars = [[9, 10]]

describe('CP ballad song-specific reductions', () => {
  it('preserves consecutive source LH attacks and durations', () => {
    styles.forEach((style, index) => {
      const song = evidence.songs.find(song => song.file.startsWith('Co Em Cho'))!
      const bars: Partial<Record<string, { attacks: {
        at: number; dur: number; hand: number; grace: boolean; ties: string[]
      }[] }>> = song.representatives
      const expected = sourceBars[index].flatMap((bar, measure) => {
        const notes = bars[bar]!.attacks.filter(n => n.hand === 2 && !n.grace && !n.ties.includes('stop'))
        return [...new Set(notes.map(n => n.at))].sort((a, b) => a - b)
          .map(at => [measure * 4 + at, Math.max(...notes.filter(n => n.at === at).map(n => n.dur))])
      })
      expect(style.cell!.left.map(hit => [hit.beat, hit.durationBeats]), style.id).toEqual(expected)
      expect(style.bpm).toBe(song.tempos[0])
      expect(style.releaseRatio).toBe(1)
    })
  })

  it('registers the song family — one rhythm, the chorus plays the verse (chorus rhythm dropped 2/10/2026)', () => {
    expect(styleFamilies(styles).map(family => family.family)).toEqual(CP_BALLAD_SONG_FAMILIES)
    expect(styles).toHaveLength(1)
    for (const style of styles) {
      expect(getStyle(style.id)).toBe(style)
      expect(hoCuaDieu(style.id)).toBe('ballad')
      expect(isBalladStyle(style.id)).toBe(true)
      expect(resolveStyleForSection(style.id, 'chorus')).toBe(style.id)
    }
    expect(kieuTrongHo('ballad').filter(style => CP_BALLAD_SONG_FAMILIES.includes(style.family)))
      .toEqual([styles[0]])
  })

  it('keeps the reduced RH (including omitted melody/tie-stop) with CP chord colors in all keys', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const quality of ['maj7', 'm7']) {
        for (const style of styles) {
          const chords = parseChordInput(Array(style.cell!.lengthBeats / 4).fill(`${root}${quality}`).join(' ')).chords
            .map(chord => ({ ...chord, voicingStyle: 'ca-phao' as const }))
          const events = renderPattern(voiceLeadTwoHands(chords), style)
          for (const hand of ['left', 'right'] as const) {
            expect(events.filter(e => e.hand === hand).map(e => e.startBeat), `${style.id}/${hand}/${root}`)
              .toEqual(style.cell![hand].map(hit => hit.beat))
          }
          for (const event of events) {
            expect(event.durationBeats).toBeGreaterThan(0)
            expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(style.cell!.lengthBeats)
            const hit = style.cell![event.hand].find(hit => hit.beat === event.startBeat)!
            expect(event.notes).toHaveLength(hit.tones!.length)
            expect(event.notes.every(n => Number.isInteger(n) && n >= 21 && n <= 84)).toBe(true)
          }
        }
      }
    }
  })

  it('retains slash bass and clips notes at short chord boundaries', () => {
    for (const style of styles) {
      const chords = parseChordInput('C/E Dm7 G7 Cmaj7').chords
      const events = renderPattern(voiceLeadTwoHands(chords), style, { beatsEach: [2, 1, 1, 4] })
      expect(Math.min(...events.find(e => e.hand === 'left' && e.startBeat === 0)!.notes) % 12).toBe(4)
      for (const [start, end] of [[0, 2], [2, 3], [3, 4], [4, 8]]) {
        const inChord = events.filter(e => e.startBeat >= start && e.startBeat < end)
        expect(inChord.some(e => e.hand === 'left')).toBe(true)
        for (const event of inChord) expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
      }
    }
  })
})
