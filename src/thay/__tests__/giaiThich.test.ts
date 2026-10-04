import { describe, expect, it } from 'vitest'
import { giaiThichLyThuyet, giaiThichThay, notGam, vn } from '../soanCau/giaiThich'
import { bacThay, duLieuSoanCau, lyThuyetBac } from '../soanCau/soanCau'

const ln = duLieuSoanCau('linh-nhi')!
const LA = 9
const noi = (ds: string[]) => ds.join(' ')

describe('Thẻ giải thích — lý thuyết (đúng cho mọi giọng)', () => {
  it('tên nốt: tên Việt; gam gọi theo chữ liền nhau ở giọng có dấu', () => {
    expect([vn('Bb'), vn('C#'), vn('E')]).toEqual(['Si♭', 'Đô♯', 'Mi'])
    expect(notGam(5, false)).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E'])
    expect(notGam(2, true)).toEqual(['D', 'E', 'F', 'G', 'A', 'Bb', 'C'])
    expect(notGam(11, false)).toEqual(['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'])
  })

  it('Đô trưởng bậc 2: nốt, nửa cung, loại thứ, vì sao gam quyết định, hạ át', () => {
    const ii = noi(giaiThichLyThuyet(0, false, lyThuyetBac(0, false, '').dong.find((d) => d.bac === 2)!))
    for (const y of ['D – F – A (Rê – Fa – La)', '3 nửa cung — quãng ba thứ', '7 nửa cung — quãng năm đúng', 'hợp âm THỨ', 'gam quyết định', 'HẠ ÁT', '2-5-1']) {
      expect(ii).toContain(y)
    }
  })

  it('chủ thay thế chỉ ra nốt chung; vii° có nốt cảm âm', () => {
    const dong = lyThuyetBac(0, false, '').dong
    expect(noi(giaiThichLyThuyet(0, false, dong.find((d) => d.bac === 6)!))).toContain('chung 2 nốt (Đô, Mi)')
    expect(noi(giaiThichLyThuyet(0, false, dong.find((d) => d.bac === 7)!))).toMatch(/GIẢM.*NỐT CẢM ÂM/)
  })

  it('La thứ: V của gam thứ hòa âm có Sol♯ — nốt cảm âm; ♭VII là át yếu', () => {
    const dong = lyThuyetBac(LA, true, 'm').dong
    const v = noi(giaiThichLyThuyet(LA, true, dong.find((d) => d.chucNang.includes('hòa âm'))!))
    for (const y of ['E – G# – B', 'Sol♯', 'gam thứ tự nhiên có Sol', 'HÒA ÂM', 'NỐT CẢM ÂM']) expect(v.toLowerCase()).toContain(y.toLowerCase())
    expect(noi(giaiThichLyThuyet(LA, true, dong.find((d) => d.bac === 7)!))).toContain('ÁT nhưng YẾU')
  })

  it('nốt màu gọi theo quãng thật: 6 là 6, 13 là 13 (không gộp quãng tám)', () => {
    expect(noi(giaiThichLyThuyet(LA, false, lyThuyetBac(LA, false, '6').dong[0]!))).toContain('nốt 6 của hợp âm) để tô màu: ngọt')
    const v13 = lyThuyetBac(0, false, 'maj9').dong.find((d) => d.bac === 5)!
    expect(v13.hopAm).toBe('G13')
    expect(noi(giaiThichLyThuyet(0, false, v13))).toContain('nốt 13 của hợp âm')
    expect(noi(giaiThichLyThuyet(0, false, v13))).not.toContain('nốt 6 của hợp âm')
  })
})

describe('Thẻ giải thích — Linh Nhi (số đo md 13c, 13d)', () => {
  it('V giọng thứ: 24 đoạn, ♭7 17/24, lối gam thứ hòa âm, bước chuyển về i', () => {
    const v = noi(giaiThichThay(ln, 'linh-nhi', LA, true, bacThay(ln, LA, true).find((r) => r.khoa === 'V')!))
    for (const y of ['24 đoạn, trong 5 bài', '17/24', 'gam thứ hòa âm', 'Sol♯', 'i (Am) 11 lần, 4 bài']) expect(v).toContain(y)
  })

  it('II giọng trưởng: II7 là át của V, nâng Fa lên Fa♯', () => {
    const ii = noi(giaiThichThay(ln, 'linh-nhi', 0, false, bacThay(ln, 0, false).find((r) => r.khoa === 'II')!))
    for (const y of ['10/10', 'Fa♯', 'át của V', 'ÁT PHỤ']) expect(ii).toContain(y)
  })

  it('♭VI khớp lý thuyết; ghi chú điệp khúc maj7 13/21 có nhãn nguồn và tách suy luận', () => {
    const vi = noi(giaiThichThay(ln, 'linh-nhi', LA, true, bacThay(ln, LA, true).find((r) => r.khoa === 'bVI')!))
    for (const y of ['Khớp lý thuyết: trong gam, bậc này là ♭VI (F)', '13/21', 'số đo md 13d', 'suy luận của Claude']) expect(vi).toContain(y)
  })

  it('bậc có số đo đáng ngờ thì nói rõ', () => {
    const iii = giaiThichThay(ln, 'linh-nhi', LA, true, bacThay(ln, LA, true).find((r) => r.khoa === 'iii°')!)
    expect(iii.at(-1)).toMatch(/^Lưu ý số đo: .*chưa kiểm tay/)
  })
})
