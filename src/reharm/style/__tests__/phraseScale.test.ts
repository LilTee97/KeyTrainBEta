import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../styleLibrary'
import { bluesChoice, prefersBlues, prefersSingleScale, scaleFit, suggestScales, SCALE_FAMILIES } from '../phraseScale'
import type { PitchClass } from '../../../shared/musicTheory/types'

const KEY = { tonic: 9, scale: 'minor' } as const
const SONG = 'Am(add9) Dm9 Cadd2 Em7 Fadd2 E9sus4'
const chords = () => parseChordInput(SONG).chords

describe('đề xuất gam cho đoạn dạo', () => {
  it('đề xuất bám vào vòng của bài, không phải mười hai nốt gốc', () => {
    const roots = new Set<number>([9, 0, ...chords().map((chord) => chord.root)])
    for (const choice of suggestScales(chords(), KEY)) {
      expect(roots, choice.label).toContain(choice.tonic)
    }
  })

  it('gam khớp nhất đứng đầu', () => {
    const list = suggestScales(chords(), KEY)
    expect(list.length).toBeGreaterThan(1)
    for (let at = 1; at < list.length; at += 1) {
      expect(list[at]!.fit).toBeLessThanOrEqual(list[at - 1]!.fit)
    }
  })

  /*
    Độ khớp đếm theo **nốt hợp âm có mặt**, nên một gam chứa trọn mọi nốt của
    vòng phải ra đúng 1 — không phải "gần 1".
  */
  it('gam phủ trọn vòng thì khớp bằng 1, và không thiếu nốt nào', () => {
    const all = [...new Set(
      chords().flatMap((chord) =>
        chord.quality.intervals.map((step) => ((chord.root + step) % 12) as PitchClass),
      ),
    )]
    const { fit, missing } = scaleFit(all, chords())
    expect(fit).toBe(1)
    expect(missing).toEqual([])
  })

  it('gam thiếu nốt thì nói ra thiếu nốt nào', () => {
    const list = suggestScales(chords(), KEY)
    const thin = list.find((choice) => choice.fit < 1)
    expect(thin).toBeDefined()
    expect(thin!.missing.length).toBeGreaterThan(0)
  })

  it('hoà điểm thì gam ít nốt đứng trước', () => {
    const list = suggestScales(chords(), KEY, 20)
    for (let at = 1; at < list.length; at += 1) {
      if (list[at]!.fit !== list[at - 1]!.fit) continue
      expect(list[at]!.pitchClasses.length).toBeGreaterThanOrEqual(
        list[at - 1]!.pitchClasses.length,
      )
    }
  })

  it('không đề xuất trùng tập nốt', () => {
    const list = suggestScales(chords(), KEY, 30)
    const keys = list.map((choice) => [...choice.pitchClasses].sort((a, b) => a - b).join(','))
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('slow rock lấy gam Blues', () => {
  /*
    Nốt blue là bậc NĂM giáng — item `duc-thinh-not-blues-la-bac-5-giang` bên
    PianoBrain, thầy Đức Thịnh nói nguyên văn. Ngũ cung thứ thiếu đúng nốt ấy,
    và đó là toàn bộ chỗ khác nhau giữa hai gam.
  */
  it('gam Blues là ngũ cung thứ cộng bậc năm giáng', () => {
    const blues = SCALE_FAMILIES.find((family) => family.id === 'blues')!
    const pent = SCALE_FAMILIES.find((family) => family.id === 'pent-minor')!
    expect(blues.steps.filter((step) => !pent.steps.includes(step))).toEqual([6])
  })

  it('giọng thứ lấy Blues trên chính chủ âm', () => {
    expect(bluesChoice(KEY)!.tonic).toBe(9)
    expect(bluesChoice(KEY)!.label).toContain('Blues')
  })

  /* Giọng trưởng lấy Blues trên chủ âm giọng thứ song song, không trên chính nó. */
  it('giọng trưởng lấy Blues trên giọng thứ song song', () => {
    expect(bluesChoice({ tonic: 0, scale: 'major' })!.tonic).toBe(9)
  })

  it('nhận ra họ slow rock', () => {
    expect(prefersBlues(getStyle('slow-rock-duc-thinh-1')!)).toBe(true)
    expect(prefersBlues(getStyle('slow-rock-duc-thinh-3')!)).toBe(true)
    expect(prefersBlues(getStyle('pop-1')!)).toBe(false)
  })
})

/*
  Gam Blues được định nghĩa ở hai chỗ: `SCALE_FAMILIES` bên này (để hiện thành
  một lựa chọn có tên) và `keyBlues` bên `soloVocabulary` (để dựng nốt). Hai
  chỗ ấy phải là **cùng một gam**, không thì người dùng chọn "La Blues" mà đàn
  chơi ra một tập nốt khác.
*/
describe('hai định nghĩa gam Blues không được trôi khỏi nhau', () => {
  it('cùng một tập nốt', async () => {
    const { keyBlues } = await import('../../fillSoloGenerator/soloVocabulary')
    const mine = bluesChoice(KEY)!.pitchClasses
    expect([...mine].sort((a, b) => a - b)).toEqual(
      [...keyBlues({ tonic: 9, scale: 'minor' })].sort((a, b) => a - b),
    )
  })
})

/*
  Bốn họ điệu mặc định ngẫu hứng trên **một gam** ở đoạn không lời.

  Căn cứ là số đo trên bốn bản ký âm của Cà Pháo — item
  `ca-phao-cau-solo-tren-vong-hop-am` bên PianoBrain. Nguồn nốt cũ (`chordTone`)
  đặt nốt hợp âm 100% số lần ở cả phách mạnh lẫn phách yếu, trong khi người thật
  đặt 52-67% / 45-57%; và nó rải hợp âm thuần 35-60% số câu trong khi người thật
  chỉ 5%.
*/
describe('bốn họ điệu mặc định một gam', () => {
  it.each(['slow-rock-duc-thinh-3', 'bolero-1', 'bossa-nova-1', 'pop-1', 'hai-pop-ballad'] as const)(
    '%s: thuộc diện mặc định một gam',
    (styleId) => {
      expect(prefersSingleScale(getStyle(styleId)!)).toBe(true)
    },
  )

  it.each(['swing-1', 'waltz-1'] as const)('%s: không đổi mặc định', (styleId) => {
    expect(prefersSingleScale(getStyle(styleId)!)).toBe(false)
  })

  /* Slow rock vẫn ưu tiên Blues — luật riêng của nó, đứng trước luật chung. */
  it('slow rock lấy Blues chứ không lấy gam khớp nhất', () => {
    const style = getStyle('slow-rock-duc-thinh-3')!
    expect(prefersBlues(style) && prefersSingleScale(style)).toBe(true)
  })
})
