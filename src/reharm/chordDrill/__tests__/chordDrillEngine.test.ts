import { describe, expect, it } from 'vitest'
import {
  classifyInput,
  expandDegrees,
  isVoicingMatched,
  parseNamed,
  requiredNotes,
  drillVoicings,
} from '../chordDrillEngine'

describe('học hợp âm — đọc vòng', () => {
  it('phân biệt tên hợp âm và bậc', () => {
    expect(classifyInput('C Am F G')).toBe('named')
    expect(classifyInput('I vi IV V')).toBe('degrees')
    expect(classifyInput('1 6 4 5')).toBe('degrees')
  })

  it('I IV V tông C cơ bản ra C F G', () => {
    const chords = expandDegrees('I IV V', 0, 'major', 'basic')
    expect(chords.map((c) => c.symbol)).toEqual(['C', 'F', 'G'])
  })

  it('I IV V tông C màu ra add9 / 7', () => {
    const chords = expandDegrees('I IV V', 0, 'major', 'color')
    expect(chords.map((c) => c.symbol)).toEqual(['Cadd2', 'Fadd2', 'G7'])
  })

  it('hợp âm 4–5 nốt: tay trái 2; 6 nốt: tay trái 3', () => {
    expect(drillVoicings(parseNamed('Cmaj7'))[0]!.left.length).toBe(2)
    expect(drillVoicings(parseNamed('Am9'))[0]!.left.length).toBe(2)
    expect(drillVoicings(parseNamed('G13'))[0]!.left.length).toBe(3)
  })

  it('đọc tên hợp âm hai tay có nốt', () => {
    const voicings = drillVoicings(parseNamed('C Am'))
    expect(voicings).toHaveLength(2)
    expect(requiredNotes(voicings[0]!).length).toBeGreaterThanOrEqual(3)
  })

  it('khớp đủ lớp cao độ, thừa nốt lạ thì sai', () => {
    const [voicing] = drillVoicings(parseNamed('C'))
    const need = requiredNotes(voicing!)
    expect(isVoicingMatched(need, voicing!)).toBe(true)
    expect(isVoicingMatched([...need, 61 as never], voicing!)).toBe(false)
  })
})
