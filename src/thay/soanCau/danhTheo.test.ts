import { describe, expect, it } from 'vitest'
import { doiThe, theBamVong } from './danhTheo'
import { docBacMau } from './nhanVong'

const H = (s: string) => s.split(' ').map((t) => docBacMau(t).hop)

describe('theBamVong — thế bấm đánh theo vòng', () => {
  it('Đô trưởng I–V–vi–IV: tay phải đi thế đảo gần nhất (C · G/B · Am/C · F/C), tay trái bass Fa2–Mi3', () => {
    const t = theBamVong(0, H('I V vi IV'))
    expect(t.map((x) => x.phai)).toEqual([
      [60, 64, 67],
      [59, 62, 67],
      [60, 64, 69],
      [60, 65, 69],
    ])
    expect(t.map((x) => x.trai)).toEqual([[48], [43], [45], [41]])
    expect(t.map((x) => x.dao)).toEqual([0, 1, 1, 2])
  })

  it('hợp âm bảy đủ 4 nốt tay phải; hợp âm 13 bỏ gốc và quãng 5 ở tay phải; slash lấy bass ở tay trái', () => {
    const [g7, g13, cE] = theBamVong(0, [
      { goc: 7, chat: '7' },
      { goc: 7, chat: '13' },
      { goc: 0, chat: '', bass: 4 },
    ])
    expect(g7!.phai).toHaveLength(4)
    expect(g13!.phai.map((m) => m % 12)).not.toContain(7)
    expect(g13!.phai.map((m) => m % 12)).not.toContain(2)
    expect(cE!.trai).toEqual([52])
    expect(cE!.pcs.sort()).toEqual([0, 4, 7])
  })

  it('doiThe: giữ nốt chung, cặp các nốt dời', () => {
    expect(doiThe([60, 64, 67], [59, 62, 67])).toEqual({ giu: [67], doi: [[60, 59], [64, 62]], them: [], bo: [] })
  })
})
