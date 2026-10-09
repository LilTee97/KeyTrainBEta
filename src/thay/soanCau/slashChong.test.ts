import { describe, expect, it } from 'vitest'
import { lopHop, SLASH_DAO, SLASH_MAU, theSlash } from './slashChong'

const pc = (x: number) => ((x % 12) + 12) % 12

describe('hợp âm slash', () => {
  it('thế đảo: bass là nốt của chính hợp âm', () => {
    for (const v of SLASH_DAO) expect([v.ten, lopHop(v.goc, v.chat).includes(pc(v.bass))]).toEqual([v.ten, true])
  })

  it('bass lạ = hợp âm màu viết tắt: nốt khớp đúng, chỉ thiếu đúng các bậc đã ghi', () => {
    for (const v of SLASH_MAU) {
      const slash = new Set([...lopHop(v.goc, v.chat), pc(v.bass)])
      const mau = lopHop(v.la.goc, v.la.chat)
      expect([v.ten, lopHop(v.goc, v.chat).includes(pc(v.bass))]).toEqual([v.ten, false])
      expect([v.ten, [...slash].every((p) => mau.includes(p))]).toEqual([v.ten, true])
      const thieu = mau.filter((p) => !slash.has(p)).map((p) => pc(p - v.la.goc))
      expect([v.ten, thieu.sort()]).toEqual([v.ten, [...v.la.thieu].sort()])
    }
  })

  it('thế bấm để xem: bass dưới, hợp âm trên, không chồng tay', () => {
    const t = theSlash(SLASH_MAU.find((v) => v.ten === 'F/G')!)
    expect(t.trai.map(pc)).toEqual([7])
    expect(t.phai.map(pc).sort()).toEqual([0, 5, 9])
    expect(Math.max(...t.trai)).toBeLessThan(Math.min(...t.phai))
  })
})
