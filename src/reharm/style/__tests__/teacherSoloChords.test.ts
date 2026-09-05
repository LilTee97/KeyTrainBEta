import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { introChordsForTeacher, interludeChordsForTeacher } from '../teacherSoloChords'

const KEY = { tonic: 0, scale: 'major' } as const
const pool = () => parseChordInput('C Am F G C').chords
const symbols = (list: readonly { symbol: string }[]) => list.map((c) => c.symbol)

describe('vòng solo theo thầy', () => {
  it('Tôn Hùng có dạo gốc thì copy dạo', () => {
    const dao = parseChordInput('C F G C Am F G C').chords
    expect(symbols(introChordsForTeacher('ton-hung', KEY, pool(), pool(), dao))).toEqual(
      symbols(dao),
    )
  })

  it('Tôn Hùng dạo I–IV–V–I, không chép hết phiên', () => {
    const verse = parseChordInput('C Am F G Em Am Dm G').chords
    expect(symbols(introChordsForTeacher('ton-hung', KEY, pool(), verse))).toEqual([
      'C',
      'F',
      'G7',
      'C',
    ])
  })

  it('Tôn Hùng giang Chiếc Lá: i V7 iv i | bvii iv i V7', () => {
    expect(
      symbols(interludeChordsForTeacher('ton-hung', KEY, pool(), pool(), null, [], 'chiec-la')),
    ).toEqual(['Am', 'E7', 'Dm', 'Am', 'Gm', 'Dm', 'Am', 'E7'])
  })

  it('Tôn Hùng giang Tình Em: i VI vii° IΔ V7/V V7 v7 i', () => {
    expect(
      symbols(interludeChordsForTeacher('ton-hung', KEY, pool(), pool(), null, [], 'tinh-em')),
    ).toEqual(['Am', 'F', 'Bdim', 'Cmaj7', 'D7', 'E7', 'Em7', 'Am'])
  })

  it('Tôn Hùng giang hòa trộn: nửa Chiếc Lá + cadence Tình Em', () => {
    expect(symbols(interludeChordsForTeacher('ton-hung', KEY, pool(), pool()))).toEqual([
      'Am',
      'E7',
      'Dm',
      'Am',
      'Bdim',
      'D7',
      'E7',
      'Am',
    ])
  })

  it('Cà Pháo dạo I–V–I–V', () => {
    expect(symbols(introChordsForTeacher('ca-phao', KEY, pool(), pool()))).toEqual([
      'C',
      'G7',
      'C',
      'G7',
    ])
  })

  it('Linh Nhi dạo: bậc Đừng Xa trên tonic bài (C→Am), ô 1 = Am không phải Dm', () => {
    const verse = parseChordInput('C Am F G Em Dm').chords
    expect(symbols(introChordsForTeacher('linh-nhi', KEY, pool(), verse))).toEqual([
      'Am',
      'G',
      'F',
      'C',
      'Dm',
      'Am',
      'E7',
      'Am',
    ])
  })

  it('Linh Nhi có dạo gốc thì copy dạo', () => {
    const dao = parseChordInput('C G Am F C G Am F').chords
    expect(symbols(introChordsForTeacher('linh-nhi', KEY, pool(), pool(), dao))).toEqual(
      symbols(dao),
    )
  })

  it('Linh Nhi giang: bậc Đừng Xa trên tonic bài, không dán Dm', () => {
    const am = parseChordInput('Am').chords[0]!
    const giang = interludeChordsForTeacher('linh-nhi', KEY, pool(), pool(), am)
    expect(symbols(giang).slice(0, 7)).toEqual(['Fmaj7', 'Am', 'G', 'Fm', 'C', 'Dm', 'Am'])
    expect(giang[0]!.root).not.toBe(2)
    expect(giang.at(-1)!.root).toBe(4)
  })

  const AM = { tonic: 9, scale: 'minor' } as const

  it('Linh Nhi dạo bài Am: i=Am (Đừng Xa i=Dm đã dịch)', () => {
    expect(symbols(introChordsForTeacher('linh-nhi', AM, pool(), pool()))[0]).toBe('Am')
  })

  it('Linh Nhi giang bài Am: cùng bậc, i=Am', () => {
    const am = parseChordInput('Am').chords[0]!
    const giang = interludeChordsForTeacher('linh-nhi', AM, pool(), pool(), am)
    expect(symbols(giang).slice(0, 7)).toEqual(['Fmaj7', 'Am', 'G', 'Fm', 'C', 'Dm', 'Am'])
    expect(giang.some((c) => c.root === 9)).toBe(true)
  })
})
