import { describe, expect, it } from 'vitest'
import { createPhraseTakeSequence } from '../phraseTakes'

describe('lượt soạn giang: một nguồn đếm cho bấm phát và vòng tiếp', () => {
  it('lưu rồi phát cùng câu; bấm lần sau tiến một bước, không hai bước', () => {
    const sequence = createPhraseTakeSequence(101)
    const first = sequence.start()
    expect(first(0)).toBe(101)
    expect(first(0)).toBe(101)
    expect(sequence.start()(0)).toBe(102)
    expect(sequence.start()(0)).toBe(103)
  })
  it('bấm lại sau nhiều vòng tự động tiếp sau lượt cuối đã dùng', () => {
    const sequence = createPhraseTakeSequence()
    const play = sequence.start(2)
    expect([play(0), play(1), play(2), play(3)]).toEqual([0, 2, 4, 6])
    expect(play(0)).toBe(0)
    expect(sequence.start(2)(0)).toBe(8)
  })
})
