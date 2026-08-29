import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { resolveStyleForSection } from '../sectionStyles'
import { getStyle } from '../styleLibrary'

/*
  BOLERO / RUMBA TRỮ TÌNH — Gemini lần 2, video
  *Đừng Xa Em Đêm Nay — Linh Nhi Piano Solo*.

  Phiên khúc  1 (đen) · 5 (đen) · 8+10 giữ hai phách
  Cao trào    tám móc đơn 1-5-8-10-12-10-8-5, octave bass phách 1
*/

const bassOf = (styleId: string, chordText: string) => {
  const style = getStyle(styleId)!
  const chords = parseChordInput(chordText).chords
  const events = renderPattern(voiceLeadTwoHands(chords, {}), style)
  const root = ((chords[0]!.root % 12) + 12) % 12

  return events
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => ({
      beat: event.startBeat,
      degrees: event.notes
        .map((note) => (((note % 12) + 12) % 12 - root + 12) % 12)
        .sort((a, b) => a - b),
      voices: event.notes.length,
    }))
}

const pitches = (styleId: string, chordText: string) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(chordText).chords, {}), getStyle(styleId)!)
    .filter((event) => event.hand === 'left')
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((event) => Math.min(...event.notes))

describe('bolero trữ tình — phiên khúc', () => {
  it('rải 1 - 5 rồi 8+10 giữ trên hợp âm ba nốt', () => {
    for (const chord of ['Dm', 'Gm', 'F']) {
      const hits = bassOf('bolero-linh-nhi', chord)
      expect(hits.map((hit) => hit.beat), chord).toEqual([0, 1, 2, 2])

      const [root, fifth, octave, tenth] = hits
      expect(root!.degrees, `${chord} phách 1`).toEqual([0])
      expect(fifth!.degrees, `${chord} phách 2`).toEqual([7])
      expect(octave!.degrees, `${chord} bậc 8`).toEqual([0])
      expect([3, 4], `${chord} bậc 10`).toContain(tenth!.degrees[0])
    }
  })

  it('đường rải ĐI LÊN suốt ô nhịp, không quẩn tại chỗ', () => {
    for (const chord of ['Dm', 'Gm', 'F']) {
      const left = renderPattern(
        voiceLeadTwoHands(parseChordInput(chord).chords, {}),
        getStyle('bolero-linh-nhi')!,
      )
        .filter((event) => event.hand === 'left')
        .sort((a, b) => a.startBeat - b.startBeat)
        .map((event) => Math.max(...event.notes))
      for (let at = 1; at < left.length; at += 1) {
        expect(left[at], `${chord} phách ${at}`).toBeGreaterThan(left[at - 1]!)
      }
    }
  })

  /*
    ĐÃ SỬA. Trên A7 bậc 5 từng ra Mi quãng tám 2 = 40, nằm DƯỚI nốt gốc La quãng
    tám 2 = 45 — đúng thứ mà chú thích dài trong `degreeTone` nói là phải chặn.

    Thủ phạm không phải `degreeTone`. Câu rải chọn đúng Mi quãng tám 3 = 52, rồi
    `settleHands` hạ nó một quãng tám để nhường chỗ cho thế bấm tay phải của A7
    (La quãng tám 3 = 57, chỉ cách 5 nửa cung, dưới ngưỡng 7; nâng tay phải thì
    hai tay dang 27 nửa cung, vượt tầm với). Mà điệu này KHÔNG có phần tay phải
    — nó đang né một cái bóng. Xem `patternRenderer`, cờ `twoHanded`.

    Kiểm cả mười hai giọng: một nốt tay trái nằm dưới nốt gốc là hỏng hoà âm, và
    nó chỉ lộ ra ở vài giọng nên rất dễ lọt.
  */
  it('bậc 5 luôn nằm trên nốt gốc, mọi giọng, kể cả hợp âm bảy', () => {
    for (const chord of ['C7', 'Db7', 'D7', 'Eb7', 'E7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'B7']) {
      const [root, fifth] = pitches('bolero-linh-nhi', chord)
      expect(fifth, `${chord} bậc 5 rơi dưới nốt gốc`).toBeGreaterThan(root!)
    }
  })

  it('không dập hợp âm tay phải', () => {
    expect(getStyle('bolero-linh-nhi')!.cell!.right).toHaveLength(0)
    expect(getStyle('bolero-1')!.cell!.right!.length).toBeGreaterThan(0)
  })

  it('đứng cạnh bolero-1 chứ không thay nó', () => {
    expect(getStyle('bolero-1')?.id).toBe('bolero-1')
    expect(getStyle('bolero')?.id).toBe('bolero-1')
  })

  it('hợp âm chia đôi: mỗi nửa chỉ rải 1-5', () => {
    const events = renderPattern(
      voiceLeadTwoHands(parseChordInput('C F').chords, {}),
      getStyle('bolero-linh-nhi')!,
      { beatsPerChord: 4, beatsEach: [2, 2], cellBreaks: [0, 2] },
    )
      .filter((event) => event.hand === 'left')
      .sort((a, b) => a.startBeat - b.startBeat)

    expect(events.map((event) => event.startBeat)).toEqual([0, 1, 2, 3])
    const c = ((parseChordInput('C').chords[0]!.root % 12) + 12) % 12
    const f = ((parseChordInput('F').chords[0]!.root % 12) + 12) % 12
    const pc = (note: number, root: number) => (((note % 12) + 12) % 12 - root + 12) % 12
    expect(events[0]!.notes.map((n) => pc(n, c))).toEqual([0])
    expect(events[1]!.notes.map((n) => pc(n, c))).toEqual([7])
    expect(events[2]!.notes.map((n) => pc(n, f))).toEqual([0])
    expect(events[3]!.notes.map((n) => pc(n, f))).toEqual([7])
  })
})

describe('bolero trữ tình — cao trào', () => {
  it('dậm quãng tám ở phách 1, không ở phách 3', () => {
    const events = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      getStyle('bolero-linh-nhi-chorus')!,
    ).filter((event) => event.hand === 'left')

    const first = events.find((event) => event.startBeat === 0)!
    expect(first.notes.some((low) => first.notes.includes((low + 12) as never))).toBe(true)

    const mid = events.find((event) => event.startBeat === 2)
    if (mid) {
      expect(mid.notes.some((low) => mid.notes.includes((low + 12) as never))).toBe(false)
    }
  })

  it('tám móc đơn một ô, sóng 1-5-8-10 rồi xuống', () => {
    const beats = bassOf('bolero-linh-nhi-chorus', 'Dm').map((hit) => hit.beat)
    expect(beats).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
  })

  /*
    ĐÃ SỬA. Đỉnh sóng là bậc 12, cách nốt gốc 19 nửa cung. Trần cũ 64 làm đúng
    hai giọng gãy — Si giáng cần 65, Si cần 66 — và chỗ gãy không phải một nốt
    lạc mà là đỉnh sóng gấp ngược xuống, thành ra nốt thứ năm tụt xuống dưới nốt
    thứ tư. Nới trần bản cao trào lên 67.
  */
  it('sóng lên tới đỉnh rồi mới xuống, mọi giọng', () => {
    for (const chord of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) {
      const wave = pitches('bolero-linh-nhi-chorus', chord)
      const peak = wave.indexOf(Math.max(...wave))
      for (let at = 1; at <= peak; at += 1) {
        expect(wave[at], `${chord} lên tới đỉnh`).toBeGreaterThan(wave[at - 1]!)
      }
      for (let at = peak + 1; at < wave.length; at += 1) {
        expect(wave[at], `${chord} về sau đỉnh`).toBeLessThan(wave[at - 1]!)
      }
    }
  })

  it('nện dày hơn phiên khúc', () => {
    const heavy = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      getStyle('bolero-linh-nhi-chorus')!,
    ).filter((event) => event.hand === 'left')
    const light = renderPattern(
      voiceLeadTwoHands(parseChordInput('Dm').chords, {}),
      getStyle('bolero-linh-nhi')!,
    ).filter((event) => event.hand === 'left')

    expect(heavy.length).toBeGreaterThan(light.length)
  })

  it('giang tấu dùng bản cao trào, phiên khúc thì không', () => {
    expect(resolveStyleForSection('bolero-linh-nhi', 'interlude')).toBe(
      'bolero-linh-nhi-chorus',
    )
    expect(resolveStyleForSection('bolero-linh-nhi', 'verse')).toBe('bolero-linh-nhi')
  })
})
