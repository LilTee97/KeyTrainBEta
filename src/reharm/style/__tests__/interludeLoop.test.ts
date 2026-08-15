import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleTones } from '../../reharmEngine/keyDetection'
import type { PitchClass } from '../../../shared/musicTheory/types'
import {
  chooseInterludeWindow,
  leadInNotes,
  pullStrength,
} from '../interludeLoop'

const chords = (text: string) => parseChordInput(text).chords
const chord = (text: string) => chords(text)[0]

describe('chấm điểm sức hút giữa hai hợp âm', () => {
  it('bậc năm mang tính chất át là mạnh nhất', () => {
    expect(pullStrength(chord('G7'), chord('C'))).toBe(6)
  })

  it('bậc năm không mang tính át thì yếu hơn một bậc', () => {
    // Thiếu quãng ba cung nên không có gì đòi giải quyết
    expect(pullStrength(chord('G'), chord('C'))).toBe(5)
  })

  it('hai hợp âm hạ át đứng ngang nhau', () => {
    expect(pullStrength(chord('Dm7'), chord('C'))).toBe(
      pullStrength(chord('F'), chord('C')),
    )
  })

  it('bậc năm hút mạnh hơn hạ át', () => {
    expect(pullStrength(chord('G7'), chord('C'))).toBeGreaterThan(
      pullStrength(chord('F'), chord('C')),
    )
  })

  it('cách nửa cung vẫn hút được nhờ chuyển động bán cung', () => {
    expect(pullStrength(chord('Db'), chord('C'))).toBe(2)
    expect(pullStrength(chord('B'), chord('C'))).toBe(2)
  })

  it('cùng nốt gốc là tệ nhất vì không có chuyển động nào', () => {
    // Không đổi gì thì không có gì báo hiệu sắp sang đoạn khác
    expect(pullStrength(chord('C'), chord('Cadd9'))).toBe(0)
  })
})

describe('nhặt vòng ngắn cho giang tấu', () => {
  it('lấy đúng bốn hợp âm', () => {
    const list = chords('C Am F G Em Dm G7 C')
    const window = chooseInterludeWindow(list, chord('C'))!

    expect(window.to - window.from + 1).toBe(4)
  })

  it('chọn khoảng có hợp âm cuối hút mạnh nhất về đoạn sau', () => {
    /*
      Đoạn sau bắt đầu ở Đô, nên khoảng kết ở G7 phải thắng khoảng kết ở Dm —
      G7 là bậc năm mang tính át, Dm chỉ là hạ át.
    */
    const list = chords('C Am F Dm Em Am G7 Em')
    const window = chooseInterludeWindow(list, chord('C'))!

    expect(list[window.to].symbol).toBe('G7')
  })

  it('hoà điểm thì lấy khoảng nằm sau cùng', () => {
    // Đó là đoạn người nghe vừa nghe xong nên vào lại thấy liền mạch nhất
    const list = chords('C Am F G7 Em Dm Am G7')
    const window = chooseInterludeWindow(list, chord('C'))!

    // Hai khoảng cùng kết ở G7, cùng điểm cao nhất — phải lấy khoảng sau
    expect(list[window.to].symbol).toBe('G7')
    expect(window.to).toBe(7)
  })

  it('đoạn ngắn hơn bốn hợp âm thì lấy trọn', () => {
    const list = chords('C F G')
    const window = chooseInterludeWindow(list, chord('C'))!

    expect([window.from, window.to]).toEqual([0, 2])
  })

  it('đoạn rỗng thì không nhặt được gì', () => {
    expect(chooseInterludeWindow([], chord('C'))).toBeNull()
  })

  it('đổi được số hợp âm nếu cần', () => {
    const list = chords('C Am F G Em Dm G7 C')
    const window = chooseInterludeWindow(list, chord('C'), 2)!

    expect(window.to - window.from + 1).toBe(2)
  })
})

describe('câu báo hiệu vào hát', () => {
  const cMajor = scaleTones(0, 'major')

  const line = (target: PitchClass = 0) =>
    leadInNotes({ target, tones: cMajor, startBeat: 3, beats: 1 })

  it('đi lên liền bậc, không nhảy quãng', () => {
    // Đi lên kéo tai về phía trước; đi xuống nghe như đã kết thúc
    const notes = line().map((entry) => entry.note)

    for (let index = 1; index < notes.length; index += 1) {
      const step = notes[index] - notes[index - 1]
      expect(step).toBeGreaterThan(0)
      expect(step).toBeLessThanOrEqual(2)
    }
  })

  it('không chạm vào nốt đích, để dành cho phách mạnh đoạn mới', () => {
    const notes = line(0).map((entry) => entry.note % 12)

    expect(notes).not.toContain(0)
  })

  it('kết ngay cạnh nốt đích, cách một bậc', () => {
    const notes = line(0)
    const last = notes[notes.length - 1].note

    // Nốt đích ở quãng tám thứ năm là 72
    expect(72 - last).toBeLessThanOrEqual(2)
    expect(72 - last).toBeGreaterThan(0)
  })

  it('mọi hợp âm đích đều cho câu nằm cùng một tầm', () => {
    /*
      Cộng thẳng nốt gốc vào nốt neo thì đích Đô cho câu ở C5 còn đích Si cho
      câu ở B5 — cùng một bài mà mỗi lần vào hát câu báo hiệu lại một tầm khác.
    */
    const lows: number[] = []

    for (let target = 0; target < 12; target += 1) {
      const notes = line(target as PitchClass)
      lows.push(notes[0].note)
    }

    expect(Math.max(...lows) - Math.min(...lows)).toBeLessThanOrEqual(12)
  })

  it('nằm gọn trong khoảng thời gian được cấp', () => {
    for (const entry of line()) {
      expect(entry.startBeat).toBeGreaterThanOrEqual(3)
      expect(entry.startBeat + entry.durationBeats).toBeLessThanOrEqual(4.001)
    }
  })

  it('các nốt hở nhau để nghe ra từng bước chân', () => {
    const notes = line()

    for (let index = 1; index < notes.length; index += 1) {
      const previousEnd =
        notes[index - 1].startBeat + notes[index - 1].durationBeats
      expect(previousEnd).toBeLessThan(notes[index].startBeat + 0.001)
    }
  })

  it('mọi nốt đều thuộc âm giai của bài', () => {
    for (const entry of line()) {
      expect(cMajor.has((entry.note % 12) as PitchClass)).toBe(true)
    }
  })

  it('đổi hợp âm đích thì câu dịch theo', () => {
    const toC = line(0).map((entry) => entry.note)
    const toF = line(5).map((entry) => entry.note)

    expect(toF).not.toEqual(toC)
  })

  it('không có thời gian thì không đánh gì', () => {
    expect(
      leadInNotes({ target: 0, tones: cMajor, startBeat: 0, beats: 0 }),
    ).toEqual([])
  })
})
