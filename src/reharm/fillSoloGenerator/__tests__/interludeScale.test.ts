import { describe, expect, it } from 'vitest'
import { generateFillLine, generateSolo } from '../soloGenerator'
import {
  chordMaterial,
  chordTonesStrict,
  interludeMaterial,
} from '../soloVocabulary'
import { parseChordInput } from '../../input/chordInputParser'
import type { ParsedChord } from '../../types'

/**
 * Nốt trên đoạn giang tấu đi theo bậc ưu tiên riêng: nốt hợp âm trước, rồi ngũ
 * cung, rồi thang âm của giọng.
 *
 * Đoạn có lời thì giọng hát là đường giai điệu nên hợp âm dày lên nghe đầy.
 * Giang tấu thì câu chạy **chính là** giai điệu — nó cần chỗ tựa chắc chứ không
 * cần màu.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const VÒNG = 'C Am F G'

/** Đếm nốt không thuộc hợp âm đang vang. */
function ngoàiHợpÂm(
  notes: readonly { note: number; startBeat: number }[],
  chords: readonly ParsedChord[],
  beatsPerChord: number,
): number {
  return notes.filter((note) => {
    const at = Math.min(
      chords.length - 1,
      Math.floor(note.startBeat / beatsPerChord),
    )
    const chord = chords[at]
    const tones = new Set(
      chord.quality.intervals.map((step) => (chord.root + step) % 12),
    )
    return !tones.has(((note.note % 12) + 12) % 12)
  }).length
}

const solo = (interlude: boolean) =>
  generateSolo(parseChordInput(VÒNG).chords, {
    beatsPerChord: 4,
    density: 'medium',
    key: KEY,
    noteSource: 'chordTone',
    take: 0,
    interlude,
  })

describe('bậc ưu tiên nốt', () => {
  it('tầng 1: nốt hợp âm, KHÔNG tự thêm bậc chín', () => {
    const c = parseChordInput('C').chords[0]
    // Đường cũ cộng bậc chín vào mọi hợp âm nhận được.
    expect(chordMaterial(c)).toContain(2)
    expect(chordTonesStrict(c)).not.toContain(2)
    expect(interludeMaterial(c, KEY)).not.toContain(2)
    expect(interludeMaterial(c, KEY).sort()).toEqual([0, 4, 7])
  })

  it('tầng 2: hợp âm bị bộ lọc giọng cắt còn ít nốt thì mở sang ngũ cung', () => {
    // Hợp âm ngoài giọng: nốt hợp âm gần như bị cắt sạch.
    const lạ = parseChordInput('Db').chords[0]
    expect(interludeMaterial(lạ, KEY).length).toBeGreaterThanOrEqual(3)
  })

  it('tầng 3 và thang âm thêm: không có thì bỏ qua, không bịa', () => {
    const c = parseChordInput('C').chords[0]
    // Kho không đưa thang âm nào — vẫn phải chạy, và vẫn ra tầng 1.
    expect(interludeMaterial(c, KEY, [])).toEqual(interludeMaterial(c, KEY))
    expect(interludeMaterial(c, KEY, undefined).length).toBeGreaterThan(0)
  })

  it('không giọng thì vẫn ra nốt hợp âm, không rỗng', () => {
    const c = parseChordInput('C').chords[0]
    expect(interludeMaterial(c, null).sort()).toEqual([0, 4, 7])
  })
})

describe('câu solo trên giang tấu', () => {
  it('ít nốt ngoài hợp âm hơn đường cũ', () => {
    const chords = parseChordInput(VÒNG).chords
    const trước = ngoàiHợpÂm(solo(false), chords, 4)
    const sau = ngoàiHợpÂm(solo(true), chords, 4)

    expect(sau).toBeLessThan(trước)
  })

  it('không còn bậc chín trên hợp âm ba nốt ở ô đầu', () => {
    // Bậc chín của Đô trưởng là Rê. Đường cũ rải nó ngay ô đầu.
    const ôĐầu = (interlude: boolean) =>
      solo(interlude)
        .filter((note) => note.startBeat < 4)
        .map((note) => ((note.note % 12) + 12) % 12)

    expect(ôĐầu(false)).toContain(2)
    expect(ôĐầu(true)).not.toContain(2)
  })

  it('câu vẫn kết vào nốt 1, 3 hay 5 của hợp âm cuối', () => {
    const chords = parseChordInput(VÒNG).chords
    const cuối = solo(true).at(-1)!
    const g = chords[3]
    const nềnTảng = [0, 4, 7].map((step) => (g.root + step) % 12)

    expect(nềnTảng).toContain(((cuối.note % 12) + 12) % 12)
  })

  it('vẫn sinh ra đủ nốt, không bị bộ lọc bóp thành im tiếng', () => {
    /*
      Không so bằng nhau tuyệt đối: bước gộp về một dòng giai điệu bỏ những nốt
      chồng cùng mốc phách, và hai chế độ chọn nốt khác nhau nên số nốt bị bỏ
      cũng khác. Điều cần canh là câu vẫn dày, không bị bóp còn lác đác.
    */
    const có = solo(true).length
    const không = solo(false).length
    expect(có).toBeGreaterThan(0)
    expect(có).toBeGreaterThan(không * 0.8)
  })

  it('người dùng chọn ngũ cung hay blues thì tôn lựa chọn ấy', () => {
    const pentatonic = generateSolo(parseChordInput(VÒNG).chords, {
      beatsPerChord: 4,
      density: 'medium',
      key: KEY,
      noteSource: 'chordPentatonic',
      take: 0,
      interlude: true,
    })
    // Ngũ cung trưởng có bậc chín; bậc ưu tiên giang tấu không được ép nó về 1-3-5.
    const ôĐầu = pentatonic
      .filter((note) => note.startBeat < 4)
      .map((note) => ((note.note % 12) + 12) % 12)
    expect(ôĐầu).toContain(2)
  })
})

describe('câu lót giữa lời không đổi', () => {
  it('generateFillLine không đọc cờ giang tấu', () => {
    const chords = parseChordInput(VÒNG).chords
    const args = {
      beatsPerChord: 4,
      density: 'dense' as const,
      key: KEY,
      breaths: new Set([1]),
    }
    const thường = generateFillLine(chords, args)
    const cóCờ = generateFillLine(chords, { ...args, interlude: true } as never)

    expect(cóCờ).toEqual(thường)
    expect(thường.length).toBeGreaterThan(0)
  })

  it('luật không đè lên giọng hát vẫn còn nguyên', () => {
    const chords = parseChordInput(VÒNG).chords
    expect(
      generateFillLine(chords, {
        beatsPerChord: 4,
        density: 'dense',
        key: KEY,
        vocal: 'full',
      }),
    ).toEqual([])
  })
})
