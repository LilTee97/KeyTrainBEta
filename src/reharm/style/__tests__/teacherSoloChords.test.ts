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

  it('Linh Nhi không dạo gốc: vi–iii–ii–I, không I–V như Cà Pháo', () => {
    const verse = parseChordInput('C Am F G Em Dm').chords
    expect(symbols(introChordsForTeacher('linh-nhi', KEY, pool(), verse))).toEqual([
      'Am',
      'Em',
      'Dm',
      'C',
      'Am',
      'Em',
      'Dm',
      'C',
    ])
  })

  it('Linh Nhi có dạo gốc thì copy dạo', () => {
    const dao = parseChordInput('C G Am F C G Am F').chords
    expect(symbols(introChordsForTeacher('linh-nhi', KEY, pool(), pool(), dao))).toEqual(
      symbols(dao),
    )
  })

  it('Linh Nhi giang tấu = dạo sheet, ô cuối át vào đoạn sau', () => {
    const am = parseChordInput('Am').chords[0]!
    const giang = interludeChordsForTeacher('linh-nhi', KEY, pool(), pool(), am)
    expect(giang.map((c) => c.root).slice(0, 4)).toEqual([9, 4, 2, 0])
    expect(giang.at(-1)!.root).toBe(4)
    expect(giang.at(-1)!.quality.intervals).toContain(10)
  })
})
