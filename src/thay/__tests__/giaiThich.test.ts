import { describe, expect, it } from 'vitest'
import { chordPitchClasses, findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC } from '../soanCau/chongHopAm'
import { loiThay, lyDoThay, lyThuyetCacBac, nguCanh, theBamHop, type Hop } from '../soanCau/giaiThich'

const LA = 9
const RE = 2
const pc = (x: number) => ((x % 12) + 12) % 12
const noi = (ds: { giai: string; coSo: string; viDu?: string }[]) => ds.map((d) => `${d.giai} ${d.viDu ?? ''} ${d.coSo}`).join(' ')

describe('Gọi tên trong giọng', () => {
  it('hợp âm và nốt gọi đúng chữ ở giọng có dấu', () => {
    expect(nguCanh(RE, true).h(8, 'maj7')).toBe('B♭maj7')
    expect(nguCanh(RE, true).n(11, 7)).toBe('Đô♯')
    expect(nguCanh(0, false).h(1, '7')).toBe('D♭7')
    expect(nguCanh(0, false).h(0, '', 4)).toBe('C/E')
    expect(nguCanh(0, false).h(7, '13b9#11')).toBe('G13♭9♯11')
    expect(nguCanh(LA, true).songSong).toBe('Đô trưởng')
  })
})

describe('Lý thuyết từng bậc — vì sao là hợp âm ấy, thay bằng gì', () => {
  it('đủ bảy bậc ở cả hai giọng; lập luận nói đúng nốt của giọng đang chọn', () => {
    expect(lyThuyetCacBac(0, false).map((b) => b.goc)).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(lyThuyetCacBac(LA, true).map((b) => b.goc)).toEqual([0, 2, 3, 5, 7, 8, 10])
    const c = (tonic: number, thu: boolean, goc: number) => lyThuyetCacBac(tonic, thu).find((b) => b.goc === goc)!.viSao
    expect(c(0, false, 2)).toContain('Dm7 là F đặt trên bass Rê')
    expect(c(0, false, 7)).toMatch(/Si.*Fa.*ba cung/)
    expect(c(LA, true, 2)).toContain('Bm7♭5 là Dm đặt trên bass Si')
    expect(c(LA, true, 8)).toContain('Fmaj7 chính là Am trên bass Fa')
    expect(c(LA, true, 7)).toContain('Sol♯')
  })

  it('V của giọng trưởng có lối Jeff (13♭9♯11) và thay thế ba cung D♭7', () => {
    const v = lyThuyetCacBac(0, false).find((b) => b.goc === 7)!
    expect(v.thay.some((t) => t.chat === '13b9#11')).toBe(true)
    expect(v.thay.some((t) => t.goc === 1 && t.chat === '7')).toBe(true)
  })

  it('mọi hợp âm thay — ở bậc và ở các lối thay — đều phát được tiếng, đúng nốt', () => {
    const hop: Hop[] = []
    for (const thu of [false, true]) {
      for (const b of lyThuyetCacBac(LA, thu)) hop.push(...b.thay)
      for (const l of loiThay(LA, thu)) hop.push(...l.goc, ...l.thay)
    }
    for (const x of hop) {
      const ct = CONG_THUC.find((c) => c.kyHieu === x.chat)
      const q = findQualityBySymbol(x.chat)
      expect(ct ?? q, `đọc được "${x.chat}"`).toBeTruthy()
      const not = theBamHop(LA, x)
      expect(not.length).toBeGreaterThanOrEqual(3)
      const goc = pc(LA + x.goc)
      if (!ct && q) {
        const pcs = chordPitchClasses(goc, q)
        for (const m of x.bass === undefined ? not : not.slice(1)) expect(pcs).toContain(pc(m))
      }
      if (x.bass !== undefined) expect(pc(not[0]!)).toBe(pc(LA + x.bass))
    }
  })

  it('lối 4 là đúng vòng trong video: Dm11 – G13♭9♯11 – Cmaj9', () => {
    const { h } = nguCanh(0, false)
    const l = loiThay(0, false)[3]!
    expect(l.thay.map((x) => h(x.goc, x.chat))).toEqual(['Dm11', 'G13♭9♯11', 'Cmaj9'])
  })
})

describe('Linh Nhi — chọn gì, vì sao, AI chọn (số đo `tools/ly_do_hop_am_linh_nhi.py --kiem`, `tools/tach_lua_chon.py --kiem`)', () => {
  const ai = (ds: { ai: string }[]) => ds.map((d) => d.ai).join(' ')

  it('chỉ thầy có số đo mới có thẻ', () => {
    // Trước 7/10/2026 Cà Pháo cũng null — nay có thẻ (khối Cà Pháo dưới). Tuấn không có sheet, Blues không có sheet thầy.
    expect(lyDoThay('tuan', 0, false)).toBeNull()
    expect(lyDoThay('blues', 0, true)).toBeNull()
  })

  it('giọng thứ: số đo sau khi sửa lỗi đọc doc_trai (7/10/2026)', () => {
    const ly = lyDoThay('linh-nhi', LA, true)!
    expect(ly.nguyenTac).toHaveLength(4)
    expect(noi(ly.bac[8]!)).toContain('Fmaj7')
    expect(noi(ly.bac[8]!)).toMatch(/23 đoạn, 4 bài.*16\/23.*10\/23.*5\/23/)
    expect(noi(ly.bac[0]!)).toMatch(/A7.*Đô♯/)
    expect(noi(ly.bac[0]!)).toContain('8 chỗ sạch (soát tay) ở 3 bài')
    expect(noi(ly.bac[0]!)).toContain('0/8')
    expect(noi(ly.bac[7]!)).toContain('2/19')
    expect(noi(ly.bac[2]!)).toContain('Một Cõi Đi Về ô 49 → 51')
    expect(ly.bac[0]![0]!.giai).toContain('La – Mi – La – Si – Đô')
  })

  it('ai chọn — giọng thứ: V và I7 là của bài; ii°, maj7 trên ♭VI, màu trên i là của chị', () => {
    const ly = lyDoThay('linh-nhi', LA, true)!
    expect(ai(ly.bac[7]!)).toContain('V ở 33/38 chỗ cùng bản phổ biến')
    expect(ai(ly.bac[0]!)).toContain('bản phổ biến có I7 ở 8/10 chỗ')
    expect(ai(ly.bac[2]!)).toContain('0/12')
    expect(ai(ly.bac[8]!)).toContain('0/19')
    expect(ai(ly.bac[0]!)).toMatch(/40\/40.*22\/22/)
    expect(noi(ly.bac[0]!)).toContain('Sửa lời trước')
  })

  it('ai chọn — giọng trưởng: II của Mùa Xuân là của bài, II7 của Đường Xưa và hợp âm giảm thay V là của chị', () => {
    const ly = lyDoThay('linh-nhi', 0, false)!
    expect(ai(ly.bac[2]!)).toMatch(/Mùa Xuân.*3\/6.*Đường Xưa.*0\/3/)
    expect(ai(ly.bac[7]!)).toContain('0/3 bản có ♯iv°')
    expect(noi(ly.bac[0]!)).toContain('12/13')
    expect(noi(ly.bac[2]!)).toContain('7/12')
    expect(noi(ly.bac[2]!)).toContain('Sửa lời trước')
  })

  it('mọi ý đều có dòng ai chọn; thẻ nguyên tắc chỉ tới bậc có lời; không lời nào in lặp', () => {
    for (const thu of [false, true]) {
      const ly = lyDoThay('linh-nhi', LA, thu)!
      for (const nt of ly.nguyenTac) for (const g of nt.bac) expect(ly.bac[g]?.length, `${nt.y} → bậc ${g}`).toBeGreaterThan(0)
      const ds = Object.values(ly.bac).flatMap((x) => x!)
      expect(ds.every((d) => /Của (bài|chị)/.test(d.ai))).toBe(true)
      const y = ds.map((d) => d.y)
      expect(new Set(y).size).toBe(y.length)
    }
  })

  it('lời về một bài cụ thể không lấy tên hợp âm của giọng đang chọn làm tên trong bài', () => {
    const ii = lyDoThay('linh-nhi', LA, false)!.bac[2]![0]!.giai
    expect(ii).toContain('Đường Xưa: bản ghi ii hoặc V7, chị đổi thành II7')
    expect(ii).not.toContain('B7 có')
  })
})

describe('Cà Pháo — chọn gì, vì sao, AI chọn (số đo `tools/tach_lua_chon.py --thay ca-phao --kiem`, soát tay 41/60 chỗ khác bản)', () => {
  const ai = (ds: { ai: string }[]) => ds.map((d) => d.ai).join(' ')

  it('nguyên tắc: khung của bài, màu ở tay phải — so với Linh Nhi cùng cách đo', () => {
    const ly = lyDoThay('ca-phao', LA, true)!
    expect(ly.nguyenTac[0]!.tom).toMatch(/309\/400.*16 chỗ chỉ anh bấm.*12 chỗ máy đọc lệch/)
    expect(ly.nguyenTac[1]!.tom).toMatch(/145\/248.*27\/253.*140\/172.*137\/302/)
  })

  it('giọng thứ: iv thay ♭VI và II7 là của anh; v7 ở Chúng Ta, V là của bài', () => {
    const ly = lyDoThay('ca-phao', LA, true)!
    expect(ai(ly.bac[5]!)).toContain('8/8')
    expect(noi(ly.bac[5]!)).toContain('Fmaj7 trên bass Rê là Dm9')
    expect(ai(ly.bac[2]!)).toContain('3/3')
    expect(ai(ly.bac[7]!)).toMatch(/V ở 15\/20.*2\/3 bản ghi v/)
    expect(ai(ly.bac[0]!)).toMatch(/53\/55.*28\/28.*24\/24.*3\/5/)
    expect(ai(ly.bac[8]!)).toContain('45/45')
  })

  it('giọng trưởng: theo bài gần như trọn — chỗ khác phần lớn là máy đọc lệch; II13 trước V là của anh', () => {
    const ly = lyDoThay('ca-phao', 0, false)!
    expect(ly.nguyenTac[2]!.tom).toMatch(/13\/22.*11 chỗ.*2 chỗ anh tự đổi/)
    expect(ai(ly.bac[2]!)).toContain('2/2')
    expect(noi(ly.bac[5]!)).toContain('Am đặt trên bass Fa chính là Fmaj7')
  })

  it('mọi ý có dòng ai chọn xưng "anh"; thẻ nguyên tắc chỉ tới bậc có lời; không lời nào in lặp', () => {
    for (const thu of [false, true]) {
      const ly = lyDoThay('ca-phao', LA, thu)!
      for (const nt of ly.nguyenTac) for (const g of nt.bac) expect(ly.bac[g]?.length, `${nt.y} → bậc ${g}`).toBeGreaterThan(0)
      const ds = Object.values(ly.bac).flatMap((x) => x!)
      expect(ds.every((d) => /Của (bài|anh)/.test(d.ai))).toBe(true)
      expect(ds.some((d) => /chị/.test(d.ai))).toBe(false)
      const y = ds.map((d) => d.y)
      expect(new Set(y).size).toBe(y.length)
    }
  })

  it('lời về một bài cụ thể giữ tên thật của bài, không đổi theo giọng đang chọn', () => {
    const v = noi(lyDoThay('ca-phao', LA, false)!.bac[7]!)
    expect(v).toContain('Hồng Kông 1: Csus4/G')
    expect(v).not.toContain('Asus4/E')
    expect(noi(lyDoThay('ca-phao', LA, true)!.bac[5]!)).toContain('Ở Chúng Ta, iv9 đứng sau v7: bass bậc 5 → bậc 4')
  })
})
