import { describe, expect, it } from 'vitest'
import { fixHandByRegister } from '../songStructure'
import type { MidiNote } from '../../../shared/musicTheory/types'
import type { TimelineEvent } from '../types'

/**
 * Nốt mang nhãn **tay trái** mà nằm hẳn trong vùng tay phải thì nhãn ấy sai.
 *
 * Người dùng chụp được cảnh này: giữa câu solo tay phải có mấy nốt màu tay trái
 * đứng ở Sol quãng tám 4, trong khi cùng lúc tay trái đang giữ bass Rê quãng tám
 * 2. Không bàn tay nào với được cả hai, và trên bản luyện ngón thì nó chỉ sai
 * đúng một ngón.
 *
 * Quét mọi điệu, bốn giọng, ba tầng tiếng thì không tầng nào hiện tại sinh ra nốt
 * như vậy — trần tay trái khoá ở Sol quãng tám 3 và mọi đường đều tôn trọng nó.
 * Nhưng luật thì rõ dù thủ phạm chưa rõ, nên chặn ở chỗ mọi tầng đổ về.
 */
const at = (notes: number[], hand: 'left' | 'right'): TimelineEvent => ({
  notes: notes as MidiNote[],
  startBeat: 0,
  durationBeats: 1,
  hand,
  velocity: 80,
  grace: false,
})

describe('nhãn tay phải khớp vùng phím', () => {
  it('cụm tay trái nằm hẳn trên trần thì đổi thành tay phải', () => {
    // Sol quãng tám 4 và La quãng tám 4 — đúng chỗ trong ảnh người dùng chụp.
    const [fixed] = fixHandByRegister([at([67, 69], 'left')])
    expect(fixed.hand).toBe('right')
    // Chỉ đổi nhãn, KHÔNG đổi cao độ: ai đặt nốt lên đó là cố ý cho nó vang ở đó.
    expect(fixed.notes).toEqual([67, 69])
  })

  it('cụm còn nốt trầm thì vẫn là tay trái thật', () => {
    // Dời nhãn của cụm này đi là hỏng bè trầm.
    const [kept] = fixHandByRegister([at([38, 67], 'left')])
    expect(kept.hand).toBe('left')
  })

  it('C4 còn tay trái; trên C4 mới đổi — rải Slow Rock thầy Hải lên tới bậc 10', () => {
    expect(fixHandByRegister([at([60], 'left')])[0].hand).toBe('left')
    expect(fixHandByRegister([at([61], 'left')])[0].hand).toBe('right')
  })

  it('không đụng gì tới tay phải', () => {
    for (const notes of [[36], [67], [40, 55]]) {
      expect(fixHandByRegister([at(notes, 'right')])[0].hand).toBe('right')
    }
  })

  it('giữ nguyên mọi trường khác của tiếng đàn', () => {
    const before = at([67], 'left')
    const [after] = fixHandByRegister([before])
    expect({ ...after, hand: 'left' }).toEqual(before)
  })
})
