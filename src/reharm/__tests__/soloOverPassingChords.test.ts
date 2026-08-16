import { describe, expect, it } from 'vitest'
import { mainChordSpans } from '../chordTiming'
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
 * - Nốt solo bám **hợp âm chính**, không bám hợp âm lướt.
 * - Không nốt nào ngân tràn sang hợp âm chính kế tiếp.
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

const soloOf = (chords: ReturnType<typeof withPassing>) =>
  generateSolo(chords, {
    beatsPerChord: 4,
    key: { tonic: 0, scale: 'major' },
    chordsPerPhrase: 2,
  })

describe('giang tấu trên vòng có hợp âm lướt', () => {
  it('nốt solo bám hợp âm chính, không bám hợp âm lướt', () => {
    /*
      Luật do người dùng đặt: hợp âm lướt là việc của tay đệm, còn câu solo vẫn
      lấy nốt trong vòng hợp âm chính. Chạy theo từng hợp âm lướt dài một phách
      thì câu nhạc bị băm vụn và chất liệu đổi liên tục theo những hợp âm chỉ
      thoáng qua.
    */
    for (const text of PROGRESSIONS) {
      const chords = withPassing(text)
      const spans = mainChordSpans(chords, 4)

      for (const note of soloOf(chords).filter((entry) => !entry.isGrace)) {
        let span = spans[0]
        for (let index = spans.length - 1; index >= 0; index -= 1) {
          if (note.startBeat >= spans[index].start - 1e-6) {
            span = spans[index]
            break
          }
        }

        expect(
          chordMaterial(span.chord),
          `${span.chord.symbol} ở phách ${note.startBeat}`,
        ).toContain(note.note % 12)
      }
    }
  })

  it('không mẫu câu nào lấy hợp âm lướt làm chất liệu', () => {
    const chords = withPassing('C Am F G Em Dm G7 C')
    const spans = mainChordSpans(chords, 4)

    const mainTones = new Set(
      spans.flatMap((span) => chordMaterial(span.chord)),
    )
    for (const note of soloOf(chords).filter((entry) => !entry.isGrace)) {
      expect(mainTones).toContain(note.note % 12)
    }
  })

  it('không nốt nào ngân tràn sang hợp âm chính kế tiếp', () => {
    for (const text of PROGRESSIONS) {
      const chords = withPassing(text)
      const spans = mainChordSpans(chords, 4)

      for (const note of soloOf(chords)) {
        const next = spans.find((span) => span.start > note.startBeat + 1e-6)
        if (!next) continue

        expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(
          next.start + 0.01,
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

          /*
            Nốt láy cố ý nằm ngoài lưới — nó là cái vuốt vào phách, vang ở khe
            ngay trước nốt chính. Cái phải đúng lưới là **nốt chính**.
          */
          for (const note of solo.filter((entry) => !entry.isGrace)) {
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
