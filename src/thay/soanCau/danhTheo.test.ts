import { describe, expect, it } from 'vitest'
import { CHORD_QUALITIES } from '../../shared/musicTheory/chordDefinitions'
import { BAM_THAY } from './bamNhuThay'
import { CONG_THUC, chongTuDo, kieuCuaHop, LOAI_TU_DO, theBamChong } from './chongHopAm'
import { chonLop, doiThe, gonTay, theBamVong } from './danhTheo'
import { theBamHop } from './giaiThich'
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

describe('mỗi tay tối đa 4 nốt (người dùng 9/10/2026)', () => {
  it('gonTay: bỏ nốt trùng quãng tám trước, thế hẹp nhất — Dm9 của Cà Pháo Đô4 Fa4 La4 Đô5 Mi5 thành Fa4 La4 Đô5 Mi5', () => {
    expect(gonTay([60, 65, 69, 72, 76], 2)).toEqual([65, 69, 72, 76])
    expect(gonTay([60, 64, 67], 0)).toEqual([60, 64, 67])
  })

  it('gonTay / chonLop: quá 4 lớp thì bỏ gốc rồi bậc 5, giữ 3 · 7 · màu — G Blues F4 B♭4 B4 D5 E5 G5', () => {
    expect(gonTay([65, 70, 71, 74, 76, 79], 7)).toEqual([65, 70, 71, 76])
    expect(chonLop([0, 4, 7, 10, 2], 0).sort((a, b) => a - b)).toEqual([2, 4, 7, 10])
  })

  it('mọi thế bấm app bắt đánh: không tay nào quá 4 nốt', () => {
    const g12 = [...Array(12).keys()]
    const tat: { trai: readonly number[]; phai: readonly number[] }[] = [
      ...CONG_THUC.flatMap((c) => g12.map((g) => theBamChong(c, g))),
      ...g12.flatMap((g) => LOAI_TU_DO.map((q) => chongTuDo(g, q.id, kieuCuaHop(g, q.id))!)),
      // theBamHop: hợp âm có công thức chồng đã tính ở theBamChong (tay trái 2–3 nốt); còn lại tay trái là nốt đầu
      ...g12.flatMap((g) =>
        CHORD_QUALITIES.filter((q) => !CONG_THUC.some((c) => c.kyHieu === q.symbol))
          .map((q) => theBamHop(0, { goc: g, chat: q.symbol }))
          .map((n) => ({ trai: n.slice(0, 1), phai: n.slice(1) })),
      ),
      ...g12.flatMap((g) => theBamVong(0, CHORD_QUALITIES.map((q) => ({ goc: g, chat: q.symbol })))),
      ...(['linh-nhi', 'ca-phao', 'blues'] as const).flatMap((k) =>
        BAM_THAY[k].doan.flatMap((d) => d.the.map((t, i) => ({ trai: gonTay(t.trai, (d.tonic + d.hop[i]![0]) % 12), phai: gonTay(t.phai, (d.tonic + d.hop[i]![0]) % 12) }))),
      ),
    ]
    expect(tat.filter((x) => x.trai.length > 4 || x.phai.length > 4)).toEqual([])
    expect(tat.length).toBeGreaterThan(1400) // 312 công thức + 444 tự do + 192 thế nghe + 444 thế Claude + 80 thế thầy (9/10/2026)
  })
})

