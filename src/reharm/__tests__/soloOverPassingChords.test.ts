import { describe, expect, it } from 'vitest'
import { beatsOf, chordStarts } from '../chordTiming'
import { generateSolo } from '../fillSoloGenerator/soloGenerator'
import { chordMaterial } from '../fillSoloGenerator/soloVocabulary'
import { parseChordInput } from '../input/chordInputParser'
import {
  applySuggestions,
  suggestPassingChords,
} from '../reharmEngine/passingChordRules'

/**
 * Ba bất biến nghe được của đoạn giang tấu, kiểm trên vòng **đã chèn hợp âm
 * lướt** — vì đó là lúc chúng từng hỏng:
 *
 * - Không nốt nào xung đột với hợp âm đang vang.
 * - Không nốt nào ngân tràn sang hợp âm sau.
 * - Mọi nốt rơi đúng lưới móc kép.
 *
 * Lần đo đầu tiên cho 0 xung đột, 0 tràn, nhưng **36 trên 47 nốt lệch lưới** —
 * con số đó chính là cảm giác lệch nhịp người dùng nghe thấy.
 */

const GRID = 0.25

function withPassing(text: string) {
  const plain = parseChordInput(text).chords
  const iiV = suggestPassingChords(plain, {}).filter(
    (suggestion) => suggestion.technique === 'secondary-ii-V',
  )
  return applySuggestions(plain, [iiV[0]], 4)
}

const PROGRESSIONS = [
  'C Am F G Em Dm G7 C',
  'Cmaj7 Am7 Dm7 G7',
  'Am Dm E7 Am',
]

const sources = ['chordTone', 'chordPentatonic', 'blues'] as const
const densities = ['sparse', 'medium', 'dense'] as const

describe('giang tấu trên vòng có hợp âm lướt', () => {
  it('không nốt chính nào xung đột với hợp âm đang vang', () => {
    for (const text of PROGRESSIONS) {
      const chords = withPassing(text)
      const starts = chordStarts(chords, 4)
      const solo = generateSolo(chords, {
        beatsPerChord: 4,
        key: { tonic: 0, scale: 'major' },
        chordsPerPhrase: 2,
      })

      for (const note of solo.filter((entry) => !entry.isGrace)) {
        let index = 0
        for (let position = starts.length - 1; position >= 0; position -= 1) {
          if (note.startBeat >= starts[position] - 1e-6) {
            index = position
            break
          }
        }

        expect(
          chordMaterial(chords[index]),
          `${chords[index].symbol} ở phách ${note.startBeat}`,
        ).toContain(note.note % 12)
      }
    }
  })

  it('không nốt nào ngân tràn sang hợp âm sau', () => {
    for (const text of PROGRESSIONS) {
      const chords = withPassing(text)
      const starts = chordStarts(chords, 4)
      const solo = generateSolo(chords, {
        beatsPerChord: 4,
        key: { tonic: 0, scale: 'major' },
        chordsPerPhrase: 2,
      })

      for (const note of solo) {
        let index = 0
        for (let position = starts.length - 1; position >= 0; position -= 1) {
          if (note.startBeat >= starts[position] - 1e-6) {
            index = position
            break
          }
        }

        const end = starts[index] + beatsOf(chords[index], 4)
        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(
          end + 0.01,
        )
      }
    }
  })

  it('mọi nốt rơi đúng lưới móc kép', () => {
    for (const text of PROGRESSIONS) {
      for (const noteSource of sources) {
        for (const density of densities) {
          const solo = generateSolo(withPassing(text), {
            beatsPerChord: 4,
            key: { tonic: 0, scale: 'major' },
            chordsPerPhrase: 2,
            noteSource,
            density,
          })

          for (const note of solo) {
            const steps = note.startBeat / GRID
            expect(
              Math.abs(steps - Math.round(steps)),
              `${noteSource}/${density} nốt ở phách ${note.startBeat}`,
            ).toBeLessThan(0.001)
          }
        }
      }
    }
  })
})

describe('bậc chín tự nhiên chỉ thêm khi không chối tai', () => {
  const chordOf = (text: string) => parseChordInput(text).chords[0]

  it('hợp âm át có bậc chín giáng thì không thêm bậc chín tự nhiên', () => {
    // E7b9 đã vang nốt Fa; thêm Fa thăng là hai nốt cách nửa cung cùng vang
    const material = chordMaterial(chordOf('E7b9'))
    expect(material).toContain(5)
    expect(material).not.toContain(6)
  })

  it('hợp âm nửa giảm không thêm bậc chín tự nhiên', () => {
    // Bậc chín tự nhiên của Si là Đô thăng, ngoài giọng Đô trưởng
    expect(chordMaterial(chordOf('Bm7b5'))).not.toContain(1)
  })

  it('hợp âm thường vẫn nhận bậc chín', () => {
    expect(chordMaterial(chordOf('Cmaj7'))).toContain(2)
    expect(chordMaterial(chordOf('Am7'))).toContain(11)
    expect(chordMaterial(chordOf('G7'))).toContain(9)
  })
})
