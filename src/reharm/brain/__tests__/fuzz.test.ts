import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { brainFill } from '../fillFromBrain'
import type { PitchClass } from '../../../shared/musicTheory/types'

/**
 * Câu lót không bao giờ được ném lỗi.
 *
 * Nó chạy trong lúc React dựng giao diện, nên một lỗi ở đây làm trắng cả trang
 * — đúng chuyện đã xảy ra khi bài đang mở ở giọng thứ và tên giọng "Am" được
 * đưa thẳng sang não. Không có luật nào khớp thì trả `null`, không ném.
 */
const CHORDS = 'C Dm Em F G Am Bdim C7 Fmaj7 Am7 G7 Bb Eb Ab Db F#m Cm Bm7b5'

describe('câu lót hỏi não không được làm sập trang', () => {
  it('mọi giọng, mọi cặp hợp âm: không ném lỗi lần nào', () => {
    const chords = parseChordInput(CHORDS).chords
    for (let tonic = 0; tonic < 12; tonic += 1)
      for (const scale of ['major', 'minor'] as const)
        for (const chord of chords)
          for (const next of chords) {
            expect(() =>
              brainFill({
                chord,
                next,
                chordStartBeat: 0,
                key: { tonic: tonic as PitchClass, scale },
              }),
            ).not.toThrow()
          }
  })

  it('bài giọng thứ quy về giọng trưởng song song: Am F C G ra đúng luật', () => {
    const chords = parseChordInput('C Am F G').chords
    const inC = brainFill({
      chord: chords[0],
      next: chords[1],
      chordStartBeat: 0,
      key: { tonic: 0, scale: 'major' },
    })
    // A thứ dùng chung bộ nốt với Đô trưởng, nên câu lót phải ra y hệt.
    const inAMinor = brainFill({
      chord: chords[0],
      next: chords[1],
      chordStartBeat: 0,
      key: { tonic: 9, scale: 'minor' },
    })
    expect(inAMinor).not.toBeNull()
    expect(inAMinor).toEqual(inC)
  })
})
