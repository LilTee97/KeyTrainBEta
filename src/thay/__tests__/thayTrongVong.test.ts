import { describe, expect, it } from 'vitest'
import { cacLuaChon, canhVong, docVong, LOAI, loiChon, vongLyThuyetHop } from '../soanCau/thayTrongVong'
import { nguCanh, type Hop } from '../soanCau/giaiThich'

const C = 0
const LA = 9
const ten = (tonic: number, thu: boolean, ds: readonly Hop[]) => ds.map((x) => nguCanh(tonic, thu).h(x.goc, x.chat, x.bass)).join(' – ')
const I_V_vi_IV: Hop[] = [{ goc: 0, chat: '' }, { goc: 7, chat: '' }, { goc: 9, chat: 'm' }, { goc: 5, chat: '' }]

describe('Vòng + lựa chọn thay — lựa chọn đúng nhạc lý ở đúng vị trí (người dùng 8/10/2026)', () => {
  it('Đô trưởng I – V – vi – IV, ô I (trước G): màu, họ hàng, át phụ D7, ii – V, giảm lướt — không treo, không thay tam cung', () => {
    const ds = cacLuaChon(I_V_vi_IV, 0, false)
    const theo = (l: string) => ds.filter((x) => x.loai === l).map((x) => ten(C, false, x.thay))
    expect(theo('mau')).toEqual(expect.arrayContaining(['Cmaj7', 'Cmaj9', 'C6', 'Cadd9']))
    expect(theo('ho-hang')).toEqual(['Am', 'Em'])
    expect(theo('at-phu')).toEqual(['D7'])
    expect(theo('ii-v')).toEqual(['Am7 – D7'])
    expect(theo('giam-luot')).toEqual(['C – F♯dim7'])
    expect(theo('treo')).toEqual([])
    expect(theo('tam-cung')).toEqual([])
  })

  it('ô V (trước Am): át phụ E7, mượn ♭VII, treo; V không phải át của Am nên không thay tam cung', () => {
    const ds = cacLuaChon(I_V_vi_IV, 1, false)
    const theo = (l: string) => ds.filter((x) => x.loai === l).map((x) => ten(C, false, x.thay))
    expect(theo('at-phu')).toEqual(['E7'])
    expect(theo('ii-v')).toEqual(['Bm7♭5 – E7'])
    expect(theo('muon')).toEqual(['B♭'])
    expect(theo('treo')).toEqual(['G7sus4 – G7'])
    expect(theo('tam-cung')).toEqual([])
  })

  it('La thứ i – iv – V: iv trước V có lối "nghiêng" của Linh Nhi; V trước i thay tam cung B♭7; i có Picardy', () => {
    const v: Hop[] = [{ goc: 0, chat: 'm' }, { goc: 5, chat: 'm' }, { goc: 7, chat: '' }]
    const theo = (i: number, l: string) => cacLuaChon(v, i, true).filter((x) => x.loai === l).map((x) => ten(LA, true, x.thay))
    expect(theo(1, 'nghieng')).toEqual(['Dm – Bm7♭5'])
    expect(theo(1, 'muon')).toEqual(['D'])
    expect(theo(2, 'tam-cung')).toEqual(['B♭7'])
    expect(theo(2, 'at-phu')).toEqual([])
    expect(theo(0, 'muon')).toEqual(['A'])
  })

  it('La thứ i → ♭VI: lối "cầu thang" chèn G cho bass đi xuống liền bậc', () => {
    const v: Hop[] = [{ goc: 0, chat: 'm' }, { goc: 8, chat: '' }, { goc: 7, chat: '' }]
    expect(cacLuaChon(v, 0, true).filter((x) => x.loai === 'cau-thang').map((x) => ten(LA, true, x.thay))).toEqual(['Am – G'])
  })

  it('câu tính nói đúng nốt: bass đi, nốt chung, nốt dẫn, nốt ngoài gam', () => {
    const atPhu = cacLuaChon(I_V_vi_IV, 0, false).find((x) => x.loai === 'at-phu')!
    const c = canhVong(I_V_vi_IV, 0, atPhu, C, false)
    expect(c[0]).toBe('Bass: Fa → Rê → Sol (xuống quãng ba thứ, lên quãng bốn).')
    expect(c[1]).toContain('với F: La, Đô')
    expect(c[1]).toContain('với G: Rê')
    expect(c.join(' ')).toContain('Fa♯ → Sol')
    expect(c.join(' ')).toContain('Nốt ngoài gam: Fa♯')
  })

  it('mỗi loại có lời nghe ra sao, hướng của vòng, thầy nào dùng; màu lấy lời "khi nào nên chọn" riêng', () => {
    for (const l of Object.values(LOAI)) for (const k of [l.nghe, l.huong('G'), l.thay]) expect(k.length).toBeGreaterThan(20)
    expect(LOAI['at-phu'].huong('G')).toContain('G thành đích')
    const mau = cacLuaChon(I_V_vi_IV, 0, false).find((x) => x.ct?.id === 'maj7')!
    expect(loiChon(mau)).toContain('mơ màng')
  })

  it('đọc vòng tự điền và vòng lý thuyết có sẵn', () => {
    expect(docVong('C G Am F', C)).toEqual(I_V_vi_IV)
    expect(docVong('Dm7, G7 | Cmaj7', C)).toEqual([{ goc: 2, chat: 'm7' }, { goc: 7, chat: '7' }, { goc: 0, chat: 'maj7' }])
    expect(docVong('C Xq', C)).toBeNull()
    expect(vongLyThuyetHop(C, false).find((v) => v.id === 'I-V-vi-IV')?.hop).toEqual(I_V_vi_IV)
  })
})
