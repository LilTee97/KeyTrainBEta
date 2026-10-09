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
    // Trước 7/10/2026 Cà Pháo, Blues cũng null — nay có thẻ (khối Cà Pháo, Blues dưới). Tuấn không có sheet.
    expect(lyDoThay('tuan', 0, false)).toBeNull()
    expect(lyDoThay('tuan', LA, true)).toBeNull()
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

describe('Cà Pháo — bài ghi gì, anh bấm gì, nghe ra sao (viết lại 8/10/2026; số đo `tach_lua_chon.py --thay ca-phao --kiem`)', () => {
  const ai = (ds: { ai: string }[]) => ds.map((d) => d.ai).join(' ')
  const tua = (ds: { y: string }[]) => ds.map((d) => d.y).join(' | ')

  it('nguyên tắc: khung của bài, màu ở tay phải — số so với Linh Nhi cùng cách đo; soát tay 41/60', () => {
    const ly = lyDoThay('ca-phao', LA, true)!
    const nt = ly.nguyenTac.map((x) => x.tom).join(' ')
    expect(nt).toMatch(/309\/400.*140\/172.*137\/302.*16 chỗ chỉ anh bấm.*12 máy đọc lệch/)
    expect(nt).toMatch(/145\/248.*27\/253/)
  })

  it('giọng thứ: tựa mỗi ý ghi rõ bài ghi gì → anh bấm gì (La thứ)', () => {
    const ly = lyDoThay('ca-phao', LA, true)!
    expect(tua(ly.bac[0]!)).toContain('Bài ghi Am → anh bấm Am7, Am9')
    expect(tua(ly.bac[0]!)).toContain('Bài ghi Am ngay trước Dm → anh bấm A7, có khi cả cụm Em7 – A7 – Dm7')
    expect(tua(ly.bac[2]!)).toContain('Bài ghi Bdim trước V → anh bấm B7 (có chỗ B7♭5)')
    expect(tua(ly.bac[8]!)).toContain('Bài ghi F → anh đổi hẳn thành Dm9 (hạ bass một quãng ba)')
    expect(noi(ly.bac[8]!)).toContain('Tay phải anh vẫn bấm Fmaj7 của bài, chỉ bass hạ từ Fa xuống Rê')
    expect(ai(ly.bac[8]!)).toMatch(/45\/45.*không bản phổ biến nào ghi iv ở cả 8 chỗ/)
    expect(ai(ly.bac[2]!)).toContain('không bản phổ biến nào ghi II ở cả 3 chỗ')
    expect(ai(ly.bac[7]!)).toContain('V có cảm âm là của bài (15/20)')
    expect(ai(ly.bac[0]!)).toMatch(/28\/28.*24\/24.*53\/55.*3\/5/)
  })

  it('giọng thứ: lời nói khi nào nên chọn và khi nào không (chỗ chỏi với giai điệu)', () => {
    const ly = lyDoThay('ca-phao', LA, true)!
    expect(noi(ly.bac[2]!)).toContain('Đừng chọn nếu giai điệu đang hát Rê đúng chỗ ấy')
    expect(noi(ly.bac[0]!)).toContain('giai điệu không có Đô — Đô♯ đụng Đô của giai điệu sẽ chỏi nửa cung')
    expect(noi(ly.bac[7]!)).toContain('khi giai điệu trên V đang hát Đô')
  })

  it('giọng trưởng: theo bài gần như trọn; đổi hẳn chỉ I → II13 trước V (Đô trưởng)', () => {
    const ly = lyDoThay('ca-phao', 0, false)!
    expect(ly.nguyenTac[2]!.tom).toMatch(/13\/22.*11 là máy đọc lệch/)
    expect(tua(ly.bac[0]!)).toContain('Bài ghi C ngay trước V → anh đổi thành D13')
    expect(ai(ly.bac[0]!)).toContain('không bản phổ biến nào ghi II ở cả 2 chỗ')
    expect(noi(ly.bac[5]!)).toContain('Fmaj7 trong tay anh là Am đặt trên bass Fa')
    expect(tua(ly.bac[7]!)).toContain('Bài ghi G → anh bấm G7sus4 rồi G13')
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
    expect(v).toContain('sheet ghi "Csus4/G"')
    expect(v).not.toContain('Asus4/E')
    // Rê thứ đang chọn: lời chung gọi Gm9, ví dụ Chúng Ta (La thứ) vẫn là Dm9.
    const vi = noi(lyDoThay('ca-phao', RE, true)!.bac[8]!)
    expect(vi).toContain('thành Gm9')
    expect(vi).toContain('Em7 → Dm9 (tay trái Rê2')
  })
})

describe('Blues — khung của thể loại, gốc của bài, màu của người chơi (md Blues 2 · 6 · 7; `phan_tich_blues_ba_sheet.py --pho-bien`)', () => {
  it('giọng trưởng: hợp âm bảy là của thể loại; nốt blue nằm trong hợp âm bảy', () => {
    const ly = lyDoThay('blues', 7, false)!
    expect(ly.nguyenTac[0]!.tom).toMatch(/5\/9 vòng.*72\/116/)
    // Sol trưởng (Rockhouse): ♭7 của IV (C7) là Si♭ = ♭3 blue; ♯9 của V (D7) là Fa = ♭7 blue; ♭II7 = A♭7.
    expect(noi(ly.bac[5]!)).toContain('C7 có Si♭')
    expect(noi(ly.bac[7]!)).toMatch(/♯9 \(Fa\)/)
    expect(noi(ly.bac[7]!)).toContain('A♭7')
    expect(ly.bac[2]![0]!.ai).toContain('Ray: 0/116 ký hiệu ii')
  })

  it('giọng thứ: Rising Sun — gốc 14/14 của bài, hợp âm bảy của người phối; ♭VI7 mang nốt blue ♭5', () => {
    const ly = lyDoThay('blues', 4, true)!
    expect(ly.nguyenTac[0]!.tom).toContain('14/14')
    // Mi thứ: ♭VI7 = C7, ♭7 = Si♭ = ♭5 blue, đi lên Si (gốc của V).
    expect(noi(ly.bac[8]!)).toContain('C7 có Si♭')
    expect(noi(ly.bac[8]!)).toContain('Si♭ → Si')
    // V7♯9 = B7♯9: Rê♯ (cảm âm) và Rê (♯9) cùng vang.
    expect(noi(ly.bac[7]!)).toMatch(/Rê♯.*Rê \(♯9/)
  })

  it('mọi ý có dòng ai chọn; thẻ nguyên tắc chỉ tới bậc có lời; không lời nào in lặp', () => {
    for (const thu of [false, true]) {
      const ly = lyDoThay('blues', LA, thu)!
      for (const nt of ly.nguyenTac) for (const g of nt.bac) expect(ly.bac[g]?.length, `${nt.y} → bậc ${g}`).toBeGreaterThan(0)
      const ds = Object.values(ly.bac).flatMap((x) => x!)
      expect(ds.every((d) => /Của (thể loại|bài|Ray|Robert|người phối)/.test(d.ai))).toBe(true)
      const y = ds.map((d) => d.y)
      expect(new Set(y).size).toBe(y.length)
    }
  })
})

describe('Mẫu thẻ thầy người dùng duyệt (Cà Pháo 8/10, áp cho Linh Nhi · Blues 9/10): tựa bài ghi → thầy bấm, câu nghe so được', () => {
  const tua = (ds: { y: string }[]) => ds.map((d) => d.y).join(' | ')

  it.each(['linh-nhi', 'ca-phao', 'blues'] as const)('%s: mỗi ý có câu nghe bài ghi ≠ thầy bấm, mọi hợp âm phát được tiếng', (thay) => {
    for (const thu of [false, true]) {
      const ds = Object.values(lyDoThay(thay, LA, thu)!.bac).flatMap((x) => x!)
      for (const d of ds) {
        expect(d.nghe, d.y).toBeTruthy()
        expect(JSON.stringify(d.nghe!.bai), d.y).not.toBe(JSON.stringify(d.nghe!.thay))
        for (const x of [...d.nghe!.bai, ...d.nghe!.thay]) {
          expect(CONG_THUC.find((c) => c.kyHieu === x.chat) ?? findQualityBySymbol(x.chat), `"${x.chat}" ở ${d.y}`).toBeTruthy()
          const not = theBamHop(LA, x)
          expect(not.length).toBeGreaterThanOrEqual(3)
          if (x.bass !== undefined) expect(pc(not[0]!)).toBe(pc(LA + x.bass))
        }
      }
    }
  })

  it('Linh Nhi, La thứ: tựa ghi rõ bài ghi gì → chị bấm gì; lời có chỗ không nên', () => {
    const ly = lyDoThay('linh-nhi', LA, true)!
    expect(tua(ly.bac[0]!)).toContain('Bài ghi Am → chị bấm Am(add9), Am7 — nốt màu nằm trong hình rải tay trái')
    expect(tua(ly.bac[0]!)).toContain('Bài ghi A7 trước Dm → chị giữ, có chỗ đặt Đô♯ ở bass (A7/C♯)')
    expect(tua(ly.bac[2]!)).toContain('Bài đi thẳng Dm → E7 → chị chèn Bm7♭5 vào giữa')
    expect(tua(ly.bac[8]!)).toContain('chị bấm Fmaj7: giữ nguyên tay phải của i, chỉ bass bước xuống')
    expect(tua(ly.bac[10]!)).toContain('chị chèn G cho bass đi xuống liền bậc')
    expect(noi(ly.bac[2]!)).toContain('đừng chèn khi giai điệu đang ngân Đô')
    expect(noi(ly.bac[10]!)).toContain('La → Sol → Fa → Mi')
  })

  it('Linh Nhi, Đô trưởng: II7 chen giữa hai lần I, hợp âm giảm thay V, iv mượn ở đoạn kết', () => {
    const ly = lyDoThay('linh-nhi', 0, false)!
    expect(tua(ly.bac[2]!)).toContain('Bài ghi Dm hay G7 → chị bấm D7 (II7 có ♯4) rồi về thẳng I')
    expect(tua(ly.bac[7]!)).toContain('Bài ghi G → chị đặt F♯m7♭5 hay Bdim7: bass đi nửa cung')
    expect(tua(ly.bac[5]!)).toContain('đoạn kết chị đổi thành Fm (mượn Đô thứ)')
    expect(noi(ly.bac[5]!)).toContain('♭6 (La♭) rơi xuống bậc 5 (Sol)')
  })

  it('Blues: tựa ghi khung / bài ghi → người chơi bấm', () => {
    const t = lyDoThay('blues', 7, false)!
    expect(tua(t.bac[7]!)).toContain('Đuôi kết: khung ghi D7 → G → Ray đổi thành A♭7 → G13')
    expect(tua(t.bac[5]!)).toContain('Khung ghi C → người chơi bấm C7, C9; quay vòng thêm ♯IV°')
    const m = lyDoThay('blues', 4, true)!
    expect(tua(m.bac[8]!)).toContain('Bài ghi C → người phối bấm C7: ♭7 của nó chính là nốt blue ♭5')
    expect(tua(m.bac[7]!)).toContain('Bài ghi B → người phối bấm B7♯9')
  })
})
