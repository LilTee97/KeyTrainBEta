import { describe, expect, it } from 'vitest'
import { generateSolo } from '../soloGenerator'
import { interludeMaterial } from '../soloVocabulary'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'
import type { PitchClass } from '../../../shared/musicTheory/types'
import type { ParsedChord } from '../../types'

/**
 * Gam jazz của kho vào tới câu giang tấu.
 *
 * Trước đây `interludeMaterial` có sẵn khe `extra` cho thang âm jazz, nhưng
 * không chỗ gọi nào truyền vào, và tầng nốt hợp âm luôn đủ ba nốt nên khe ấy
 * không bao giờ tới lượt. Kết quả đo được: G7b9 ra đúng bốn nốt y hệt G7.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const chord = (symbol: string): ParsedChord => parseChordInput(symbol).chords[0]
const pcs = (chordSymbol: string, extra?: readonly PitchClass[]) =>
  new Set(interludeMaterial(chord(chordSymbol), KEY, extra))

/** Xếp theo cao độ, không theo thứ tự chữ — `Array.sort()` trần coi 11 nhỏ hơn 4. */
const up = (set: ReadonlySet<PitchClass>) => [...set].sort((a, b) => a - b)

const C = 0 as PitchClass
const D = 2 as PitchClass
const E = 4 as PitchClass
const F = 5 as PitchClass
const FS = 6 as PitchClass
const G = 7 as PitchClass
const A = 9 as PitchClass
const BB = 10 as PitchClass
const B = 11 as PitchClass
const EB = 3 as PitchClass

describe('nốt của hợp âm không đi qua bộ lọc giọng', () => {
  it('Ebmaj7 trong bài giọng Đô giữ đủ nốt của chính nó', () => {
    /*
      Lỗi cũ: bộ lọc giọng cắt Mi giáng, Si giáng và Rê của Ebmaj7 vì chúng
      không thuộc giọng Đô, rồi tụt xuống tầng ngũ cung và trả về Fa Sol Đô —
      câu chạy không còn một nốt nào của hợp âm đang vang dưới tay trái.
    */
    const material = pcs('Ebmaj7')
    for (const note of [EB, G, BB, D]) {
      expect(material.has(note), `thiếu nốt ${note} của Ebmaj7`).toBe(true)
    }
  })

  it('hợp âm trong giọng thì không đổi gì', () => {
    expect(up(pcs('Cmaj7'))).toEqual([C, E, G, B])
    expect(up(pcs('G7'))).toEqual([D, F, G, B])
  })
})

describe('khe gam jazz đã thông', () => {
  it('có gam thì gam đứng đầu, và nốt ngoài giọng được giữ', () => {
    // C Lydian trong bài giọng Đô: nốt Fa thăng phải sống sót.
    const lydian = [C, D, E, FS, G, A, B] as PitchClass[]
    const material = pcs('Cmaj7', lydian)
    expect(material.has(FS)).toBe(true)
    expect(material.size).toBe(7)
  })

  it('không có gam thì chạy y như cũ', () => {
    expect(up(pcs('Cmaj7', []))).toEqual([C, E, G, B])
    expect(up(pcs('Cmaj7', undefined))).toEqual([C, E, G, B])
  })

  it('gam dưới ba nốt thì bỏ qua, không dựng câu trên hai nốt', () => {
    expect(up(pcs('Cmaj7', [C, E]))).toEqual([C, E, G, B])
  })
})

describe('bộ chọn gam của kho', () => {
  it('kho trả đúng gam cho từng chất hợp âm', () => {
    const lydian = scaleForChord(chord('Cmaj7'))
    expect(lydian, 'kho chưa nối được').not.toBeNull()
    expect(lydian).toContain(FS)

    /*
      Gam vang ra cho C7 **đổi theo tiến độ rà**, nên đừng khoá con số.

      Kho biết cả Mixolydian lẫn Bebop Dominant. Cái nào được chọn phụ thuộc item
      nào đã có người đối chiếu video — ingest thêm bài là phạm vi rà nở ra, và
      gam tám bậc quay lại khi mấy item mới được rà. Khoá cứng "8 nốt" là bắt
      test đỏ mỗi lần kho lớn lên, dù nhạc không sai chỗ nào.

      Thứ luôn đúng: có gam, và gam ấy chứa đủ nốt của C7.
    */
    const dominant = scaleForChord(chord('C7'))
    expect(dominant, 'C7 phải có gam').not.toBeNull()
    for (const tone of [C, E, G, BB]) {
      expect(dominant, `C7 thiếu nốt ${tone}`).toContain(tone)
    }
    // Bậc 7 tự nhiên là nốt riêng của gam bebop; có thì tốt, chưa có thì chờ rà.
    expect(dominant!.length).toBeGreaterThanOrEqual(7)
  })

  it('hợp âm kho chưa có gam thì trả null, không bịa', () => {
    expect(scaleForChord(chord('Csus4'))).toBeNull()
    expect(scaleForChord(chord('Cadd9'))).toBeNull()
  })

  it('gam luôn chứa đủ nốt của hợp âm', () => {
    for (const symbol of ['Cmaj7', 'C7', 'Cm7', 'Cm7b5', 'Cdim7', 'Ebmaj7']) {
      const scale = scaleForChord(chord(symbol))
      if (!scale) continue
      const parsed = chord(symbol)
      for (const tone of parsed.quality.intervals) {
        const pc = (((parsed.root + tone) % 12) + 12) % 12
        expect(scale, `${symbol} mất nốt ${pc}`).toContain(pc)
      }
    }
  })
})

describe('mặc định không đổi tiếng — item kho còn draft', () => {
  const notes = (noteSource: 'chordTone' | 'storeScale') =>
    new Set(
      generateSolo(parseChordInput('Cmaj7 C7 Fmaj7 G7').chords, {
        beatsPerChord: 4,
        density: 'dense',
        key: KEY,
        take: 3,
        noteSource,
        interlude: true,
        storeScale: scaleForChord,
      }).map((n) => ((n.note % 12) + 12) % 12),
    )

  it('nguồn nốt mặc định không đọc kho, dù đã nối hàm vào', () => {
    /*
      Toàn bộ item gam đang ở `status: "draft"`. Draft được tra, được đọc, nhưng
      không được tự thành tiếng — người dùng phải chọn đúng nguồn nốt gam jazz.
    */
    const plain = generateSolo(parseChordInput('Cmaj7 C7 Fmaj7 G7').chords, {
      beatsPerChord: 4,
      density: 'dense',
      key: KEY,
      take: 3,
      interlude: true,
    })
    const wired = generateSolo(parseChordInput('Cmaj7 C7 Fmaj7 G7').chords, {
      beatsPerChord: 4,
      density: 'dense',
      key: KEY,
      take: 3,
      interlude: true,
      storeScale: scaleForChord,
    })
    expect(wired.map((n) => n.note)).toEqual(plain.map((n) => n.note))
  })

  it('chọn gam jazz thì câu chạy mở ra nốt ngoài nốt hợp âm', () => {
    const jazz = notes('storeScale')
    const plain = notes('chordTone')
    // Fa thăng của C Lydian trên Cmaj7 — nốt mà bản cũ không thể có.
    expect(jazz.has(FS)).toBe(true)
    expect(plain.has(FS)).toBe(false)
    // Có nốt mới thì phải khác tập cũ, không chỉ khác vài chỗ trong cùng tập.
    expect([...jazz].some((pc) => !plain.has(pc))).toBe(true)
  })

  it('ballad giọng Đô, nốt hợp âm: không có Fa thăng bừa', () => {
    const plain = notes('chordTone')
    expect(plain.has(FS)).toBe(false)
  })
})

describe('câu lót giữa lời không đụng tới', () => {
  it('ngoài đoạn không lời, nguồn gam jazz chạy như nốt hợp âm', () => {
    const args = {
      beatsPerChord: 4,
      density: 'dense' as const,
      key: KEY,
      take: 1,
      interlude: false,
      storeScale: scaleForChord,
    }
    const chords = parseChordInput('Cmaj7 C7 Fmaj7 G7').chords
    expect(generateSolo(chords, { ...args, noteSource: 'storeScale' }).map((n) => n.note)).toEqual(
      generateSolo(chords, { ...args, noteSource: 'chordTone' }).map((n) => n.note),
    )
  })
})
