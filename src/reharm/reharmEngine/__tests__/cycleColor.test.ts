import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { compatibleColorIds, nextColorId } from '../staticVoicingRules'

const C = parseChordInput('Cadd9').chords[0]!
const Am = parseChordInput('Am9').chords[0]!
const G7 = parseChordInput('G9').chords[0]!
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

describe('đổi màu từng hợp âm', () => {
  it('chỉ xoay màu cùng họ và trong giọng', () => {
    const ids = compatibleColorIds(C, C_MAJOR)
    expect(ids[0]).toBe('add9')
    expect(ids).toContain('maj7')
    expect(ids).not.toContain('m7')
    expect(ids).not.toContain('7')
  })

  it('xoay hết vòng thì về màu ban đầu', () => {
    const start = C.quality.id
    const cycle = compatibleColorIds(C, C_MAJOR)
    let id = start
    for (let step = 0; step < cycle.length; step += 1) {
      id = nextColorId(C, C_MAJOR, id)
    }
    expect(id).toBe(start)
  })

  it('hợp âm át không nhảy sang trưởng nghỉ', () => {
    const ids = compatibleColorIds(G7, C_MAJOR)
    expect(ids.every((id) => !id.startsWith('maj') && id !== 'add9')).toBe(true)
  })

  it('hợp âm thứ không nhảy sang trưởng', () => {
    const ids = compatibleColorIds(Am, C_MAJOR)
    expect(ids.every((id) => id.startsWith('m') || id === Am.quality.id)).toBe(
      true,
    )
  })
})
