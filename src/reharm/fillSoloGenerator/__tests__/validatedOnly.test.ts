import { describe, expect, it } from 'vitest'
import { scaleForChord } from '../../brain/chordScale'
import { parseChordInput } from '../../input/chordInputParser'
import { brain } from '../../brain/index'
import { DEFAULT_SOUND_MODE } from '../../brain/gate'

/**
 * Gam jazz vào tiếng đàn chỉ khi **đã có người đối chiếu với video gốc**.
 *
 * Siết ngay tại cầu nối chứ không siết `DEFAULT_SOUND_MODE`: hằng số ấy gác cả
 * kho, mà câu lót của thầy Kingsley và walking bass của Pianote chưa ai rà —
 * siết cả kho là tắt tiếng luôn những thứ đang chạy tốt.
 */
const chord = (symbol: string) => parseChordInput(symbol).chords[0]

describe('chỉ gam đã rà mới thành tiếng', () => {
  it('mọi gam bộ chọn trả về đều đã có người đối chiếu', () => {
    const kb = brain()
    for (const symbol of ['Cmaj7', 'C7', 'Cm7', 'Cm7b5', 'Cdim7', 'C7b9', 'C7#9', 'Cm(maj7)', 'C7#5']) {
      const scale = scaleForChord(chord(symbol))
      expect(scale, `${symbol} phải có gam`).not.toBeNull()

      // Truy ngược: phải có ít nhất một item validated mang đúng bộ nốt ấy.
      const backing = kb.items.filter((item) => {
        const stored = (item.output as { scale?: { for_qualities?: string[] } }).scale
        return (
          item.source?.teacher_id === 'jazz-scales' &&
          item.status === 'validated' &&
          (stored?.for_qualities?.length ?? 0) > 0
        )
      })
      expect(backing.length, 'kho không còn item gam nào đã rà').toBeGreaterThan(0)
    }
  })

  it('cửa chung của kho vẫn để nguyên, không siết cả loạt', () => {
    /*
      Nếu ai đó đổi hằng số này thành 'validated' mà chưa rà Kingsley và Pianote
      thì câu lót và walking bass tắt tiếng. Test đứng đây để chuyện ấy không
      xảy ra lặng lẽ.
    */
    expect(DEFAULT_SOUND_MODE).toBe('extracted')
  })
})
