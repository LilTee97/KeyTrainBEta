import { describe, expect, it } from 'vitest'
import { scaleForChord, scaleGaps } from '../chordScale'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'

/**
 * Hỏi não **kèm giọng của bài**.
 *
 * Cùng một chất hợp âm, hai nốt gốc, hai gam khác nhau — cái quyết định là bậc
 * của hợp âm trong giọng, thứ chỉ bên này biết. Trong giọng Đô: `Am(add9)` chạy
 * La thứ tự nhiên, `Dm(add9)` chạy Rê Dorian. Dorian trên La cho Fa thăng,
 * Aeolian trên Rê cho Si giáng — cả hai đều lạc.
 *
 * Không nói giọng cho não thì nó đành im, và im còn hơn kêu lạc giọng.
 */
const C_MAJOR = { tonic: 0 as PitchClass, scale: 'major' as const }
const chord = (symbol: string) => parseChordInput(symbol).chords[0]!
const TRONG_GIONG_C = new Set([0, 2, 4, 5, 7, 9, 11])

describe('gam của kho, hỏi kèm giọng', () => {
  it('hợp âm ba nốt mở rộng nay có gam, và gam không lạc giọng', () => {
    for (const symbol of ['Am(add9)', 'Dm(add9)', 'Csus4', 'Gsus4', 'Dm6']) {
      const scale = scaleForChord(chord(symbol), C_MAJOR)
      expect(scale, `${symbol} không có gam khi đã nói giọng`).not.toBeNull()
      for (const pc of scale!) {
        expect(TRONG_GIONG_C.has(pc), `${symbol}: nốt ${pc} lạc giọng Đô`).toBe(true)
      }
    }
  })

  it('không nói giọng thì im như cũ — không kêu bừa', () => {
    for (const symbol of ['Am(add9)', 'Dm(add9)', 'Csus4', 'Gsus4', 'Dm6']) {
      expect(scaleForChord(chord(symbol)), symbol).toBeNull()
    }
  })

  it('hợp âm MƯỢN vẫn im, dù đã nói giọng', () => {
    // Em(add9) và Am6 đều cần Fa thăng — không nằm trong giọng Đô.
    for (const symbol of ['Em(add9)', 'Am6', 'Bdim']) {
      expect(scaleForChord(chord(symbol), C_MAJOR), symbol).toBeNull()
    }
  })

  it('hợp âm ba nốt trơn không đổi gì: ngũ cung vốn không lạc bao giờ', () => {
    for (const symbol of ['C', 'Am', 'F', 'G']) {
      const khong = scaleForChord(chord(symbol))
      const co = scaleForChord(chord(symbol), C_MAJOR)
      expect(co, symbol).toEqual(khong)
      expect(co!.length, `${symbol} phải là ngũ cung`).toBe(5)
    }
  })

  it('danh sách hợp âm thiếu gam ngắn lại khi biết giọng', () => {
    const chords = parseChordInput('Cadd9 Am(add9) Dm(add9) Csus4 Bdim').chords
    const khong = scaleGaps(chords)
    const co = scaleGaps(chords, C_MAJOR)
    expect(co.length, `${khong.join()} -> ${co.join()}`).toBeLessThan(khong.length)
    // Bdim vẫn thiếu thật: bậc thể của nó là Locrian, kho chưa có bản đã rà.
    expect(co).toContain('Bdim')
  })
})
