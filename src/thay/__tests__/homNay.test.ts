import { describe, expect, it } from 'vitest'
import type { LuotTap } from '../../shared/persistence/db'
import { HOC_TOI_DA, keHoachHomNay, tenBai } from '../homNay'
import { THU_TU_TAP } from '../teachers'

let t = 0
const lt = (styleId: string, day: string, bac: number, dat: boolean): LuotTap => ({ timestamp: ++t, day, styleId, bac, dat, soDo: {} })

describe('buổi tập hôm nay', () => {
  it('chưa tập gì: không lượt nguội, không bài đang học, mở bài dễ nhất', () => {
    const ke = keHoachHomNay([], '2026-10-03')
    expect([ke.nguoi, ke.daNguoi, ke.dangHoc]).toEqual([[], [], []])
    expect(ke.baiMoi).toBe(THU_TU_TAP[0])
  })

  it('qua bậc hôm qua: lượt nguội xác nhận đi trước; vẫn đang học bậc kế; còn chỗ thì mở bài mới', () => {
    const ke = keHoachHomNay([lt('twist', '2026-10-02', 1, true)], '2026-10-03')
    expect(ke.nguoi.map((m) => [m.styleId, m.bac, m.viec])).toEqual([['twist', 1, 'xac-nhan']])
    expect(ke.dangHoc.map((m) => [m.styleId, m.bac])).toEqual([['twist', 2]])
    expect(ke.baiMoi).toBe(THU_TU_TAP[0])
  })

  it('đang học đủ bài chưa qua bậc 6 thì chưa mở bài mới; qua bậc 6 rồi thì không tính vào giới hạn', () => {
    const hai = [lt('twist', '2026-10-03', 1, true), lt('blue-sun', '2026-10-03', 1, true)]
    expect(HOC_TOI_DA).toBe(2)
    expect(keHoachHomNay(hai, '2026-10-03').baiMoi).toBeNull()
    const quaSau = [1, 2, 3, 4, 5, 6].map((bac) => lt('twist', '2026-10-03', bac, true))
    const ke = keHoachHomNay([...quaSau, lt('blue-sun', '2026-10-03', 1, true)], '2026-10-03')
    expect(ke.dangHocDuoi6).toBe(1)
    expect(ke.baiMoi).toBe(THU_TU_TAP[0])
    expect(ke.dangHoc.find((m) => m.styleId === 'twist')!.bac).toBe(7)
  })

  it('lượt nguội đã làm hôm nay thì sang danh sách đã làm', () => {
    const ke = keHoachHomNay([lt('twist', '2026-10-02', 1, true), lt('twist', '2026-10-03', 1, false)], '2026-10-03')
    expect(ke.nguoi).toEqual([])
    expect(ke.daNguoi.map((m) => [m.styleId, m.bac, m.dat])).toEqual([['twist', 1, false]])
  })

  it('tên bài là tên nút, không phải tên video nguồn', () => {
    expect(tenBai('bolero-tu-n-improv-bai-04-00001')).toBe('Bolero Tuấn')
    expect(tenBai('blue-sun')).toBe('Slow Blues')
  })
})
