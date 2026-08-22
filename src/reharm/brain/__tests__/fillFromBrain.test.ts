import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { brainFill } from '../fillFromBrain'

/**
 * Câu lót hỏi não thì phải ra đúng luật của thầy Kingsley, và **hỏi hụt thì
 * không được làm hỏng bài** — KeyTrain lùi về câu fill cũ của chính nó.
 */
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

const line = (text: string, at: number, useBrain: boolean) =>
  generateFillLine(parseChordInput(text).chords, {
    beatsPerChord: 4,
    density: 'dense',
    key: C_MAJOR,
    breaths: new Set([at]),
    brainFill: useBrain
      ? (request) => brainFill({ ...request, key: C_MAJOR })
      : undefined,
  })

describe('câu lót hỏi não Kingsley', () => {
  it('C sang Am: ô trước bậc vi đúng là bậc I nên được 1-7-5-3', () => {
    const notes = line('C Am F G', 0, true)
    const midis = notes.filter((n) => !n.isGrace).map((n) => n.note)
    // C5 B4 G4 E4 — bậc 1-7-5-3 dựng trên C, đi xuống.
    expect(midis.slice(0, 4)).toEqual([72, 71, 67, 64])
  })

  it('G sang Am: ô trước bậc vi là bậc V nên KHÔNG được 1-7-5-3', () => {
    const midis = line('C G Am F', 1, true)
      .filter((n) => !n.isGrace)
      .map((n) => n.note)
    expect(midis.slice(0, 4)).not.toEqual([72, 71, 67, 64])
    // preceding 3-2-1 dựng trên chính hợp âm G: B4 A4 G4.
    expect(midis.slice(0, 3)).toEqual([71, 69, 67])
  })

  it('hợp âm ngoài giọng thì trả null, không đoán bừa', () => {
    const chords = parseChordInput('Db Ab').chords
    expect(
      brainFill({
        chord: chords[0],
        next: chords[1],
        chordStartBeat: 0,
        key: C_MAJOR,
      }),
    ).toBeNull()
  })

  it('tắt não thì câu fill cũ của KeyTrain giữ nguyên', () => {
    const off = line('C Am F G', 0, false)
    expect(off.length).toBeGreaterThan(0)
    expect(off.map((n) => n.note)).not.toEqual(
      line('C Am F G', 0, true).map((n) => n.note),
    )
  })

  it('não hụt luật thì vẫn có câu fill, không im tiếng', () => {
    // Không giọng nào -> não trả null ngay từ cửa.
    const notes = generateFillLine(parseChordInput('C Am F G').chords, {
      beatsPerChord: 4,
      density: 'dense',
      key: null,
      breaths: new Set([0]),
      brainFill: (request) => brainFill({ ...request, key: null }),
    })
    expect(notes.length).toBeGreaterThan(0)
  })
})
