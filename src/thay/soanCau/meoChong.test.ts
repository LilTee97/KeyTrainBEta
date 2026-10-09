import { describe, expect, it } from 'vitest'
import { BA, CONG_THUC, tenTren } from './chongHopAm'
import { bacCua, bangCongLoai, bangTheoLoai, congLoai, dangTrai, HO_LOAI, LUAT_SO, meoCua, MEO_VANG, trungCongLoai } from './meoChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const lop = (goc: number, iv: readonly number[]) => [...new Set(iv.map((x) => (goc + x) % 12))].sort((a, b) => a - b)

describe('quy luật và mẹo theo loại hợp âm', () => {
  it('năm họ chia hết 26 loại, không trùng', () => {
    const ids = HO_LOAI.flatMap((h) => h.ids)
    expect(ids.length).toBe(26)
    expect([...ids].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(bangTheoLoai().flatMap((h) => h.dong).length).toBe(26)
  })

  it('bậc hai tay đúng nốt — vd 13♭9: tay trái 1 · 3 · ♭7, tay phải 13 · ♭9 · 3', () => {
    expect(bacCua(ct('13b9'))).toEqual({ trai: ['1', '3', '♭7'], phai: ['13', '♭9', '3'], caHai: ['1', '3', '♭7', '♭9', '13'] })
    expect(bacCua(ct('m11b5')).phai).toEqual(['♭3', '11', '♭7'])
    expect(bacCua(ct('dim7')).caHai).toEqual(['1', '♭3', '♭5', '𝄫7'])
  })

  it('quy luật con số đúng với mọi loại được nêu', () => {
    for (const l of LUAT_SO) l.ids.forEach((id, k) => expect([id, bacCua(ct(id)).phai]).toEqual([id, [...l.phai[k]!]]))
  })

  it('mọi loại có mẹo; câu mẹo gọi đúng tên tay phải ở gốc Đô', () => {
    for (const c of CONG_THUC) {
      const m = meoCua(c)
      expect(m.length).toBeGreaterThan(15)
      if (!('iv' in c.tren)) expect(m).toContain(tenTren(c, 'C', 'flat'))
    }
    expect(meoCua(ct('13b9'))).toBe('khung 7 + trưởng — gốc Đô: khung C7 + A — như C13 (Am) nhưng Đô lên Đô♯')
  })

  it('mẹo vàng đúng với công thức thật', () => {
    expect(MEO_VANG).toHaveLength(6)
    const tren = (id: string) => ct(id).tren as { loai: keyof typeof BA; cach: number }
    // mẹo 1: đuôi số → bậc tay phải (6 → bậc 6, 7 → bậc 3 / ♭3, 9 → bậc 5, 11 → ♭7, 13 → bậc 9 hay 13)
    expect(['6', 'maj7', 'm7', 'maj9', 'm11', 'm13', '13'].map((id) => tren(id).cach)).toEqual([9, 4, 3, 7, 10, 2, 9])
    // mẹo 2: chất tay phải của loại 7
    expect(['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'].map((id) => BA[tren(id).loai].ten)).toEqual(['thứ', 'giảm', 'trưởng', 'thứ', 'giảm', 'tăng'])
    // mẹo 3: cùng chỗ, đổi chất
    expect(['maj7', '7', 'm7', 'm7b5'].map((id) => tren(id).cach)).toEqual([4, 4, 3, 3])
    // mẹo 4: hợp âm 9 — tay phải là hợp âm bậc V của gốc
    expect(['maj9', 'm9', '9'].map((id) => tenTren(ct(id), 'C', 'flat'))).toEqual(['G', 'Gm', 'Gm'])
    // mẹo 5: nốt căng = đổi một nốt
    expect([tenTren(ct('13'), 'C', 'flat'), tenTren(ct('13b9'), 'C', 'flat')]).toEqual(['Am', 'A'])
    // mẹo 6: tăng và bảy giảm nhiều tên cùng nốt
    expect(lop(8, BA.aug.iv)).toEqual(lop(0, BA.aug.iv))
    expect(lop(4, BA.dim7.iv)).toEqual(lop(1, BA.dim7.iv))
  })
})

describe('mẹo cộng loại — loại tay trái + loại tay phải = loại tổng', () => {
  it('26 loại chỉ dùng 8 dạng tay trái; số loại mỗi dạng', () => {
    const dem: Record<string, number> = {}
    for (const c of CONG_THUC) dem[dangTrai(c)] = (dem[dangTrai(c)] ?? 0) + 1
    expect(dem).toEqual({ 'nốt gốc': 9, 'khung 7': 5, 'gốc – 5': 5, trưởng: 2, thứ: 2, 'khung m7': 1, 'gốc – 3': 1, 'gốc – ♭5': 1 })
  })

  it('phép cộng loại của từng công thức', () => {
    expect(['maj9#11', '13b9', '69', 'add9', 'maj7', 'm13'].map((id) => congLoai(ct(id)))).toEqual([
      'trưởng + thứ',
      'khung 7 + trưởng',
      'gốc – 5 + treo 4',
      'gốc – 5 + chùm',
      'nốt gốc + thứ',
      'khung m7 + thứ',
    ])
  })

  it('chỉ cộng loại thì có đúng 6 cặp trùng — 5 cặp hợp âm ba và cặp chùm add9 / m(add9)', () => {
    const cap = [...new Set(CONG_THUC.flatMap((c) => trungCongLoai(c).map((t) => [c.id, t.id].sort().join('|'))))].sort()
    expect(cap).toEqual(['13|13b9#11', '13#11|13b9', '7|dim7', '9sus4|m7', 'add9|madd9', 'm7b5|maj7'].sort())
  })

  it('bảng gom theo tay trái: một dạng tay trái + đổi loại tay phải = nhiều loại, ví dụ gốc Đô ghi tên hai tay', () => {
    const b = bangCongLoai(CONG_THUC.map((c) => c.id))
    expect(b.map((d) => d.dang)).toEqual(['nốt gốc', 'khung 7', 'gốc – 5', 'trưởng', 'thứ', 'khung m7', 'gốc – 3', 'gốc – ♭5'])
    expect(b[1]).toEqual({
      dang: 'khung 7',
      viDu: 'C7',
      theoChat: [
        { chat: 'thứ', loai: [{ ten: '13', viDu: 'C7 + Am' }, { ten: '13♭9♯11', viDu: 'C7 + G♭m' }] },
        { chat: 'trưởng', loai: [{ ten: '13♭9', viDu: 'C7 + A' }, { ten: '13♯11', viDu: 'C7 + D' }] },
        { chat: 'tăng', loai: [{ ten: '7♭13', viDu: 'C7 + A♭+' }] },
      ],
    })
    expect(b[2]!.theoChat.find((c) => c.chat === 'chùm')!.loai).toEqual([
      { ten: 'add9', viDu: 'Đô – Sol + Rê – Mi – Sol' },
      { ten: 'm(add9)', viDu: 'Đô – Sol + Rê – Mi♭ – Sol' },
    ])
    // một màn chỉ lấy loại của màn, giữ thứ tự dạng tay trái
    expect(bangCongLoai(['maj9', 'maj9#11', '6']).map((d) => [d.dang, d.viDu])).toEqual([
      ['gốc – 5', 'Đô – Sol'],
      ['trưởng', 'C'],
    ])
  })
})
