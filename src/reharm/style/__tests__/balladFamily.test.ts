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
    expect(isBalladStyle('pop-1')).toBe(true)
    expect(isBalladStyle('slow-rock-2')).toBe(true)
    for (const id of BALLAD_FAMILY_IDS) expect(isBalladStyle(id), id).toBe(true)
  })

  it('mọi tên gọi khác của cùng một điệu đều ra cùng câu trả lời', () => {
    for (const alias of ['ballad', 'ballad-pre', 'ballad-chorus', 'slow-rock', 'slow-rock-1']) {
      expect(isBalladStyle(alias), alias).toBe(true)
    }
    // Alias phải trỏ về đúng điệu trong danh sách, không phải trùng tên ngẫu nhiên.
    expect(getStyle('ballad')?.id).toBe('pop-1')
    expect(getStyle('slow-rock')?.id).toBe('slow-rock-2')
  })

  it('điệu không phải ballad thì sai', () => {
    for (const id of [
      'bossa-nova-1',
      'swing-1',
      'waltz-1',
      'tango-1',
      'hai-tango',
      'hai-rumba',
      'hai-16-beat',
      'hai-bossa-nova',
      'hai-swing',
      'hai-waltz',
      'country-1',
      'boogie-1',
      'jazz-waltz-1',
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

  it('mọi id trong danh sách đều là điệu có thật trên bảng chọn', () => {
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

  it('bật ở ballad, đổi sang swing thì tắt, quay lại ballad thì mới bật lại', () => {
    expect(effective(true, 'pop-1')).toBe(true)
    expect(effective(true, 'swing-1')).toBe(false)
    expect(effective(true, 'hai-bossa-nova')).toBe(false)
    expect(effective(true, 'pop-1')).toBe(true)
  })

  it('điệu ngoài họ ballad thì không dựng nổi một nốt trầm nào', () => {
    const chords = parseChordInput('C Am').chords
    const walk = effective(true, 'swing-1')
      ? walkingBassLine({ chords, beatsPerChord: 4 })
      : null
    expect(walk).toBeNull()
  })
})
