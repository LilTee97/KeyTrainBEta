import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateSolo } from '../soloGenerator'
import { bluesChoice, suggestScales } from '../../style/phraseScale'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  Lối chơi **một gam xuyên suốt**: một thang âm chạy hết cả vòng, không đổi theo
  hợp âm. Trước đây lối này đóng cứng vào ngũ cung của giọng — không chọn được
  gam nào, và nhánh trong `materialFor` còn không tới được vì mọi chỗ gọi đều
  truyền `null` vào ô giọng.

  Test đo thứ tai nghe: **mọi nốt của câu solo có nằm trong gam đã chọn không**.
*/

const KEY = { tonic: 9, scale: 'minor' } as const
const SONG = 'Am(add9) Dm9 Cadd2 Em7'

function solo(singleScale: readonly PitchClass[]) {
  return generateSolo(parseChordInput(SONG).chords, {
    beatsPerChord: 4,
    noteSource: 'keyPentatonic',
    singleScale,
    key: KEY,
    interlude: true,
    density: 'medium',
    take: 3,
  })
}

const pcsOf = (notes: readonly { note: number }[]) =>
  [...new Set(notes.map((n) => ((n.note % 12) + 12) % 12))].sort((a, b) => a - b)

describe('một gam xuyên suốt', () => {
  it('câu solo nằm trọn trong gam đã chọn', () => {
    const blues = bluesChoice(KEY)!.pitchClasses
    const notes = solo(blues)
    expect(notes.length).toBeGreaterThan(4)
    for (const pc of pcsOf(notes)) {
      expect(blues, `nốt lạc: ${pc}`).toContain(pc)
    }
  })

  /*
    Đổi gam phải đổi tiếng. Nếu không thì tham số bị nuốt ở đâu đó và người dùng
    chọn gì cũng nghe như nhau — đúng cái hỏng của bản trước.
  */
  it('chọn gam khác thì ra tập nốt khác', () => {
    const blues = bluesChoice(KEY)!.pitchClasses
    const major = suggestScales(parseChordInput(SONG).chords, KEY, 30)
      .find((choice) => choice.familyId === 'ionian')!
    expect(pcsOf(solo(blues))).not.toEqual(pcsOf(solo(major.pitchClasses)))
  })

  it('gam nào cũng giữ được luật: không nốt nào ngoài gam', () => {
    for (const choice of suggestScales(parseChordInput(SONG).chords, KEY, 6)) {
      for (const pc of pcsOf(solo(choice.pitchClasses))) {
        expect(choice.pitchClasses, `${choice.label} lạc nốt ${pc}`).toContain(pc)
      }
    }
  })

  /* Bỏ trống thì giữ nguyên hành vi cũ — ngũ cung của giọng. */
  it('không chọn gam thì vẫn là ngũ cung giọng như trước', () => {
    const notes = generateSolo(parseChordInput(SONG).chords, {
      beatsPerChord: 4,
      noteSource: 'keyPentatonic',
      key: KEY,
      interlude: true,
      take: 3,
    })
    for (const pc of pcsOf(notes)) {
      expect([9, 0, 2, 4, 7], `nốt lạc: ${pc}`).toContain(pc)
    }
  })
})
