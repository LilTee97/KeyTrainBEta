import { describe, expect, it } from 'vitest'
import { BALLAD_FAMILY_IDS, isBalladStyle } from '../balladFamily'
import { getStyle } from '../styleLibrary'
import { walkingBassLine } from '../../brain/walkingBass'
import { parseChordInput } from '../../input/chordInputParser'

/**
 * Họ ballad quyết định chỗ nào được bày walking 1-2-3-5 và câu lót Kingsley.
 * Sai danh sách này là mấy thủ pháp đệm chậm rơi sang swing hoặc bossa.
 */
describe('họ ballad', () => {
  it('điệu ballad thì đúng', () => {
    expect(isBalladStyle('ca-phao-ballad-cu-di')).toBe(true)
    expect(isBalladStyle('ca-phao-ballad-co-em-cho')).toBe(true)
    expect(isBalladStyle('ca-phao-ballad-de-em-roi-xa')).toBe(true)
    for (const id of BALLAD_FAMILY_IDS) expect(isBalladStyle(id), id).toBe(true)
  })

  it('điệu không phải ballad thì sai', () => {
    for (const id of [
      'ca-phao-bossa-improved',
      'twist',
      'blue-sun',
      'slow-rock-la-thu-hai-tay',
      'bolero-tu-n-improv-bai-04-00001',
      'tango-tu-n-improv-bai-04-00004',
    ]) {
      expect(isBalladStyle(id), id).toBe(false)
    }
  })

  it('id không có thật, rỗng, hay bỏ trống đều là không', () => {
    expect(isBalladStyle('không-có-điệu-này')).toBe(false)
    expect(isBalladStyle('')).toBe(false)
    expect(isBalladStyle(undefined)).toBe(false)
    expect(isBalladStyle(null)).toBe(false)
  })

  it('mọi id trong danh sách đều là điệu có thật (Tôn Hùng là khuôn ngầm, không có nút)', () => {
    for (const id of BALLAD_FAMILY_IDS) {
      expect(getStyle(id)?.id, id).toBe(id)
    }
  })
})

describe('đổi điệu đi rồi về không để walking chạy ngầm', () => {
  /*
    Đây là cách giao diện tính giá trị thật sự dùng: `walkingBass && ballad`.
    Kiểm ngay công thức ấy, vì chính nó là thứ chặn tuyến trầm 1-2-3-5 rò sang
    swing khi người dùng quên tắt ô tick.
  */
  const effective = (walkingBass: boolean, styleId: string) =>
    walkingBass && isBalladStyle(styleId)

  it('bật ở ballad, đổi sang twist thì tắt, quay lại ballad thì mới bật lại', () => {
    expect(effective(true, 'ca-phao-ballad-cu-di')).toBe(true)
    expect(effective(true, 'twist')).toBe(false)
    expect(effective(true, 'ca-phao-bossa-improved')).toBe(false)
    expect(effective(true, 'ca-phao-ballad-cu-di')).toBe(true)
  })

  it('điệu ngoài họ ballad thì không dựng nổi một nốt trầm nào', () => {
    const chords = parseChordInput('C Am').chords
    const walk = effective(true, 'twist')
      ? walkingBassLine({ chords, beatsPerChord: 4 })
      : null
    expect(walk).toBeNull()
  })
})
