import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { chordMaterial, chordPentatonic } from '../../fillSoloGenerator/soloVocabulary'
import { blockedDocs } from '../docs'
import { lickyPhrases, placeLick } from '../generate'

const C = parseChordInput('C7').chords[0]!

describe('Licky', () => {
  it('fill/run né nốt ngoài giọng', () => {
    const b9 = parseChordInput('B9sus4').chords[0]!
    const em = parseChordInput('Em').chords[0]!
    const key = { tonic: 4 as const, scale: 'minor' as const }
    for (const kind of ['fill', 'run'] as const) {
      const line = placeLick({
        chord: b9,
        next: em,
        startBeat: 0,
        beats: 2,
        take: 3,
        kind,
        key,
      })
      for (const note of line) {
        expect(note.note % 12).not.toBe(1)
      }
    }
  })

  it('sổ lick có câu để clone', () => {
    expect(lickyPhrases().length).toBeGreaterThan(10)
  })

  it('clone giữ hình interval', () => {
    const a = placeLick({
      chord: C,
      startBeat: 2,
      beats: 2,
      take: 0,
      mode: 'clone',
      kind: 'fill',
    })
    const b = placeLick({
      chord: C,
      startBeat: 2,
      beats: 2,
      take: 0,
      mode: 'clone',
      kind: 'fill',
    })
    expect(a.length).toBeGreaterThanOrEqual(3)
    expect(a.map((n) => n.note)).toEqual(b.map((n) => n.note))
  })

  it('fill bám nốt hợp âm, không còn 1 nốt', () => {
    const am = parseChordInput('Am').chords[0]!
    const g = parseChordInput('G').chords[0]!
    const line = placeLick({
      chord: am,
      next: g,
      startBeat: 2.5,
      beats: 1.5,
      take: 2,
      mode: 'clone',
      kind: 'fill',
    })
    const allowed = new Set([...chordMaterial(am), ...chordPentatonic(am)])
    expect(line.length).toBeGreaterThanOrEqual(3)
    for (const note of line) {
      expect(allowed.has((note.note % 12) as never)).toBe(true)
    }
  })

  it('run đủ nốt theo số phách', () => {
    const two = placeLick({
      chord: C,
      startBeat: 0,
      beats: 2,
      take: 0,
      mode: 'clone',
      kind: 'run',
    })
    const four = placeLick({
      chord: C,
      startBeat: 0,
      beats: 4,
      take: 0,
      mode: 'clone',
      kind: 'run',
    })
    expect(two.length).toBe(8)
    expect(four.length).toBe(8)
  })

  it('sáng tạo khác clone', () => {
    const clone = placeLick({
      chord: C,
      startBeat: 0,
      beats: 4,
      take: 1,
      mode: 'clone',
      kind: 'run',
    })
    const created = placeLick({
      chord: C,
      startBeat: 0,
      beats: 4,
      take: 1,
      mode: 'create',
      kind: 'run',
    })
    expect(created.map((n) => n.note).join(',')).not.toBe(
      clone.map((n) => n.note).join(','),
    )
  })

  it('Licky Fills chêm được vào ô đủ phách', () => {
    const chords = parseChordInput('C Am F G').chords
    const line = generateFillLine(chords, {
      beatsPerChord: 4,
      density: 'sparse',
      extraFills: new Set([1]),
      lickyFills: true,
      lickyMode: 'clone',
    })
    expect(line.length).toBeGreaterThan(0)
    expect(line.some((note) => note.startBeat >= 4 && note.startBeat < 8)).toBe(
      true,
    )
  })

  it('cùng chỗ hai lượt take ra câu khác nhau', () => {
    const a = placeLick({
      chord: C,
      startBeat: 0,
      beats: 2,
      take: 0,
      kind: 'run',
    })
    const b = placeLick({
      chord: C,
      startBeat: 0,
      beats: 2,
      take: 1,
      kind: 'run',
    })
    expect(a.map((n) => n.note).join(',')).not.toBe(b.map((n) => n.note).join(','))
  })

  it('báo tài liệu chưa đọc hết', () => {
    expect(blockedDocs().some((doc) => doc.status !== 'ok')).toBe(true)
  })
})
