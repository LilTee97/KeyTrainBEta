import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { TimedScore } from '../../reharm/playback/timedScoring'
import { docLuotTap, ghiLuotTap, type LuotTap } from '../../shared/persistence/db'
import bossa from '../baiTap/ca-phao-bossa-improved.json'
import type { BaiTap } from '../baiTap'
import {
  BAC,
  bacKeTiep,
  chamGated,
  chamTimed,
  congNgay,
  dichBac7,
  dichVong,
  tenGiong,
  tienDoBai,
  trangThaiBac,
  type Bac,
} from '../loTrinh'

const timed = (so: number) => BAC[so - 1] as Extract<Bac, { cheDo: 'timed' }>
const gated = (so: number) => BAC[so - 1] as Extract<Bac, { cheDo: 'gated' }>

const diem = (hit: number, total: number, medianAbsMs: number | null, extra = 0): TimedScore => ({
  total,
  hit,
  missed: [],
  extra: Array.from({ length: extra }, () => ({ note: 60, beat: 0, velocity: 80 })),
  errorsMs: [],
  medianMs: medianAbsMs,
  medianAbsMs,
})

const luot = (styleId: string, bac: number, dat: boolean): LuotTap => ({
  timestamp: 0,
  day: '2026-10-02',
  styleId,
  bac,
  dat,
  soDo: {},
})

describe('lộ trình 7 bậc — ngưỡng từ dễ đến khó', () => {
  it('đúng thang trong kế hoạch: tách tay → hai tay chờ nốt → 60 · 80 · 100 % → tên hợp âm', () => {
    expect(BAC.map((bac) => bac.so)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(BAC.slice(0, 3).map((bac) => (bac.cheDo === 'gated' ? bac.tay : null))).toEqual(['left', 'right', 'both'])
    expect(BAC.slice(3).map((bac) => (bac.cheDo === 'timed' ? bac.tempo : null))).toEqual([60, 80, 100, 100])
    expect(BAC.map((bac) => bac.cheDo === 'timed' && bac.kiem)).toEqual([false, false, false, false, false, false, true])
  })

  it('siết dần: chặng được vấp không tăng ở bậc 1–3; đúng nốt, độ đều, phím thừa không nới ở bậc 4–6', () => {
    for (let so = 2; so <= 3; so += 1) expect(gated(so).vapToiDa).toBeLessThanOrEqual(gated(so - 1).vapToiDa)
    for (let so = 5; so <= 6; so += 1) {
      expect(timed(so).dungToiThieu).toBeGreaterThan(timed(so - 1).dungToiThieu)
      expect(timed(so).lechToiDa).toBeLessThan(timed(so - 1).lechToiDa)
      expect(timed(so).thuaToiDa!).toBeLessThan(timed(so - 1).thuaToiDa!)
    }
    // Bậc 7 không lỏng nhịp hơn bậc 6.
    expect(timed(7).lechToiDa).toBeLessThanOrEqual(timed(6).lechToiDa)
  })
})

describe('chấm một lượt', () => {
  it('chờ nốt: Tango tay trái 8 chặng, 15 % → được vấp 1 chặng', () => {
    expect(chamGated(0.15, 8, 1).dat).toBe(true)
    expect(chamGated(0.15, 8, 2).dat).toBe(false)
    expect(chamGated(0.15, 8, 2).tomTat).toBe('vấp 2/8 chặng (được ≤ 1)')
    expect(chamGated(0.1, 0, 0).dat).toBe(false)
  })

  it('theo nhịp: thiếu một tiêu chí là chưa đạt', () => {
    const bac4 = timed(4)
    expect(chamTimed(bac4, diem(86, 100, 55, 10)).dat).toBe(true)
    expect(chamTimed(bac4, diem(84, 100, 55, 10)).dat).toBe(false) // đúng 84 % < 85 %
    expect(chamTimed(bac4, diem(90, 100, 61, 0)).dat).toBe(false) // lệch 61 ms > 60
    expect(chamTimed(bac4, diem(90, 100, 30, 16)).dat).toBe(false) // thừa 16 % > 15 %
    expect(chamTimed(bac4, diem(90, 100, null, 0)).dat).toBe(false) // không trúng nốt nào thì không có độ đều
    expect(chamTimed(bac4, diem(86, 100, 55, 10)).tomTat).toBe(
      'đúng 86 % (cần ≥ 85) · lệch 55 ms (≤ 60) · thừa 10 % (≤ 15)',
    )
  })

  it('bậc 7 chưa chấm phím thừa (bước 7 thêm kiểm bass và nốt sai)', () => {
    expect(chamTimed(timed(7), diem(92, 100, 35, 60)).dat).toBe(true)
    expect(chamTimed(timed(7), diem(92, 100, 35, 60)).tomTat).not.toContain('thừa')
  })
})

describe('trạng thái bậc — đọc nhật ký', () => {
  it('chưa tập: mở bậc 1, khoá phần còn lại', () => {
    expect(trangThaiBac([], 'twist')).toEqual(['mo', 'khoa', 'khoa', 'khoa', 'khoa', 'khoa', 'khoa'])
    expect(bacKeTiep(trangThaiBac([], 'twist'))).toBe(1)
  })

  it('qua bậc trước mới mở bậc sau; lượt trượt không mở gì; bài khác không tính', () => {
    const nhatKy = [luot('twist', 1, false), luot('twist', 1, true), luot('twist', 2, false), luot('blue-sun', 2, true)]
    expect(trangThaiBac(nhatKy, 'twist')).toEqual(['qua', 'mo', 'khoa', 'khoa', 'khoa', 'khoa', 'khoa'])
    expect(bacKeTiep(trangThaiBac(nhatKy, 'twist'))).toBe(2)
  })

  it('qua hết thì bậc nên tập là bậc 7', () => {
    const nhatKy = BAC.map((bac) => luot('twist', bac.so, true))
    expect(trangThaiBac(nhatKy, 'twist').every((one) => one === 'qua')).toBe(true)
    expect(bacKeTiep(trangThaiBac(nhatKy, 'twist'))).toBe(7)
  })
})

describe('bậc 7 — giọng lạ', () => {
  it('mỗi lượt một giọng, xoay bốn giọng gần', () => {
    const nhatKy: LuotTap[] = []
    const giong = []
    for (let i = 0; i < 5; i += 1) {
      giong.push(tenGiong(dichBac7(nhatKy, 'bossa'), true))
      nhatKy.push(luot('bossa', 7, false))
    }
    expect(giong).toEqual(['Bm', 'Gm', 'Dm', 'Em', 'Bm'])
    expect(tenGiong(-2, false)).toBe('Bb')
  })

  it('dịch cả vòng: nốt, tên hợp âm (giọng giáng ghi tên giáng), thế bấm', () => {
    const kiem = (bossa as unknown as BaiTap).kiem
    const sol = dichVong(kiem, -2, true)
    expect(sol.timeline[0]!.notes).toEqual(kiem.timeline[0]!.notes.map((note) => note - 2))
    expect(sol.perBeat[0]).toBe('Gm9')
    expect(sol.hopAm).toContain('D7b13')
    expect(sol.voicings[0]!.left).toEqual(kiem.voicings[0]!.left.map((note) => note - 2))
  })
})

describe('Đã thuộc và kiểm lại — lượt nguội (bước 6)', () => {
  let t = 0
  const lt = (day: string, bac: number, dat: boolean): LuotTap => ({ timestamp: ++t, day, styleId: 'twist', bac, dat, soDo: {} })

  it('đạt trong buổi là Đã qua; lượt đầu ngày sau đạt thì Đã thuộc, kéo theo bậc dưới', () => {
    const nk = [lt('2026-10-01', 1, true), lt('2026-10-01', 2, true)]
    expect(tienDoBai(nk, 'twist', '2026-10-01').trangThai.slice(0, 3)).toEqual(['qua', 'qua', 'mo'])
    expect(tienDoBai(nk, 'twist', '2026-10-01').bacNguoi).toBeNull() // hôm nay đã tập — hết nguội
    expect(tienDoBai(nk, 'twist', '2026-10-02').bacNguoi).toBe(2) // ngày mới: kiểm bậc qua cao nhất trước tiên
    nk.push(lt('2026-10-02', 2, true))
    const td = tienDoBai(nk, 'twist', '2026-10-02')
    expect(td.trangThai.slice(0, 3)).toEqual(['thuoc', 'thuoc', 'mo'])
    expect([td.thuocCaoNhat, td.hop, td.han, td.denHan]).toEqual([2, 1, '2026-10-03', false])
    expect(td.nguoiHomNay).toEqual({ bac: 2, dat: true })
  })

  it('tập bậc khác của cùng bài trước thì không còn là lượt nguội', () => {
    const nk = [lt('2026-10-01', 1, true), lt('2026-10-01', 2, true), lt('2026-10-02', 1, true), lt('2026-10-02', 2, true)]
    expect(tienDoBai(nk, 'twist', '2026-10-02').trangThai.slice(0, 2)).toEqual(['thuoc', 'qua'])
  })

  it('kiểm lại theo hộp: đạt khi đến hạn lên hộp; đạt sớm không lên; trượt về hộp 0, hôm sau kiểm', () => {
    const nk = [lt('2026-10-01', 1, true), lt('2026-10-02', 1, true)] // thuộc bậc 1: hộp 1, hạn 10-03
    const ngay = (day: string) => tienDoBai(nk, 'twist', day)
    expect([ngay('2026-10-03').denHan, ngay('2026-10-03').bacNguoi]).toEqual([true, 1])
    nk.push(lt('2026-10-03', 1, true)) // đến hạn, đạt → hộp 2, +3 ngày
    expect([ngay('2026-10-03').hop, ngay('2026-10-03').han]).toEqual([2, '2026-10-06'])
    nk.push(lt('2026-10-04', 1, true)) // sớm hơn hạn → chỉ là tập
    expect([ngay('2026-10-04').hop, ngay('2026-10-04').han]).toEqual([2, '2026-10-06'])
    nk.push(lt('2026-10-05', 1, false)) // trượt → hộp 0, hôm sau kiểm
    expect([ngay('2026-10-05').hop, ngay('2026-10-05').han]).toEqual([0, '2026-10-06'])
    nk.push(lt('2026-10-06', 1, true))
    expect([ngay('2026-10-06').hop, ngay('2026-10-06').han]).toEqual([1, '2026-10-07'])
  })

  it('thuộc bậc cao hơn: xác nhận đi trước kiểm lại; bậc ấy thành bậc được kiểm, từ hộp 1', () => {
    const nk = [lt('2026-10-01', 1, true), lt('2026-10-02', 1, true), lt('2026-10-02', 2, true)]
    expect(tienDoBai(nk, 'twist', '2026-10-03').bacNguoi).toBe(2)
    nk.push(lt('2026-10-03', 2, true))
    const td = tienDoBai(nk, 'twist', '2026-10-03')
    expect([td.thuocCaoNhat, td.hop, td.han]).toEqual([2, 1, '2026-10-04'])
  })

  it('cộng ngày qua cuối tháng', () => {
    expect(congNgay('2026-10-30', 3)).toBe('2026-11-02')
  })
})

describe('nhật ký lượt tập trên máy (IndexedDB)', () => {
  it('ghi thêm rồi đọc lại đủ, kèm ngày địa phương', async () => {
    const truoc = (await docLuotTap()).length
    const ban = await ghiLuotTap({ timestamp: new Date(2026, 9, 2, 23, 30).getTime(), styleId: 'twist', bac: 1, dat: true, soDo: { chang: 12, vap: 1 } })
    expect(ban.id).toBeTypeOf('number')
    expect(ban.day).toBe('2026-10-02')
    const sau = await docLuotTap()
    expect(sau).toHaveLength(truoc + 1)
    expect(trangThaiBac(sau, 'twist')[1]).toBe('mo')
  })
})
