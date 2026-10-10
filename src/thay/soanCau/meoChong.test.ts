import { describe, expect, it } from 'vitest'
import { BA, CONG_THUC, pcsDuoi, pcsTong, pcsTren, quangTren, tenHaiTay, tenTren } from './chongHopAm'
import { bacCua, bangCongLoai, bangTheoLoai, congLoai, dangTrai, HO_LOAI, LUAT_SO, meoCua, MEO_VANG, QUY_TAC_HO, trungCongLoai } from './meoChong'

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

describe('điểm chung theo họ — mỗi câu đối chiếu 26 công thức (gốc Đô)', () => {
  const nhac = (id: string) => pcsTong(ct(id), 0)
  const ho = (k: number) => HO_LOAI[k]!.ids
  const coDu = (id: string, ps: readonly number[]) => ps.every((p) => nhac(id).includes(p))
  const tenPhai = (id: string) => tenHaiTay(ct(id), 'C', 'flat').phai.join(' ')

  it('mỗi họ có nốt dấu hiệu', () => {
    expect(ho(0).every((id) => coDu(id, [0, 4, 7]) && !nhac(id).includes(10))).toBe(true) // trưởng: nguyên C, không Si♭
    expect(ho(1).every((id) => coDu(id, [0, 3]))).toBe(true) // thứ: Đô, Mi♭
    expect(ho(1).filter((id) => !nhac(id).includes(7))).toEqual(['m13']) // nên không nói "nguyên Cm"
    expect(ho(2).every((id) => coDu(id, [0, 3, 6]))).toBe(true) // nửa giảm & giảm: nguyên Cdim
    expect([...ho(3), ...ho(4)].every((id) => coDu(id, [0, 10]))).toBe(true) // cả 10 loại át có Si♭
    expect(ho(3).filter((id) => nhac(id).includes(4))).toEqual(['7', '9', '13'])
    expect(coDu('9sus4', [5]) && !nhac('9sus4').includes(4)).toBe(true)
    expect(ho(4).every((id) => coDu(id, [0, 4, 10]) && [1, 6, 8].some((p) => nhac(id).includes(p)))).toBe(true)
  })

  it('cầu thang 7 → 9 → 11 → 13: tay phải loại sau giữ đúng hai nốt trên của loại trước; lời ghi đúng nốt', () => {
    const phai = (id: string) => quangTren(ct(id)).map((x) => x % 12)
    const CAU_THANG: readonly (readonly string[])[] = [
      ['maj7', 'maj9', 'maj9#11'],
      ['m7', 'm9', 'm11', 'm13'],
      ['7', '9', '9sus4'],
    ]
    CAU_THANG.forEach((day, k) => {
      for (let i = 1; i < day.length; i++) {
        const [a, b] = [phai(day[i - 1]!), phai(day[i]!)]
        expect([day[i], b[0], new Set(b.filter((p) => a.includes(p)))]).toEqual([day[i], a[1], new Set(a.slice(1))])
      }
      expect(HO_LOAI[[0, 1, 3][k]!]!.chung.join(' ')).toContain(day.map(tenPhai).join(' → '))
    })
  })

  it('đổi một nốt tay phải, tay trái giữ nguyên: đúng 19 cặp, gồm mọi cặp lời đã nêu', () => {
    const motNot = (a: string, b: string) => {
      if (pcsDuoi(ct(a), 0).join() !== pcsDuoi(ct(b), 0).join()) return false
      const [A, B] = [pcsTren(ct(a), 0), pcsTren(ct(b), 0)]
      const bo = A.filter((p) => !B.includes(p)).length
      const them = B.filter((p) => !A.includes(p)).length
      return bo <= 1 && them <= 1 && bo + them > 0
    }
    const ids = CONG_THUC.map((c) => c.id)
    expect(ids.flatMap((a, i) => ids.slice(i + 1).filter((b) => motNot(a, b))).length).toBe(19)
    for (const [a, b] of [
      ['6', '69'], ['69', 'add9'], ['6', 'm6'], ['add9', 'madd9'], ['m7', 'mMaj7'], ['m7', 'm7b5'], ['m7b5', 'dim7'], ['maj7', '7'],
      ['m7', '7'], ['7', '7b9'], ['7', '7b5'], ['13', '13b9'], ['13b9', '13b9#11'], ['13#11', '13b9#11'], ['13', '7b13'],
    ] as const)
      expect([a, b, motNot(a, b)]).toEqual([a, b, true])
  })

  it('ba tay phải dùng chung giữa các họ, chỉ tay trái khác', () => {
    const theoPhai = new Map<string, string[]>()
    for (const c of CONG_THUC) {
      const k = [...pcsTren(c, 0)].sort((x, y) => x - y).join()
      theoPhai.set(k, [...(theoPhai.get(k) ?? []), c.id])
    }
    const chung = [...theoPhai.values()].filter((v) => v.length > 1)
    expect(chung.map((v) => [...v].sort()).sort()).toEqual([['13', '6'], ['9', 'm9'], ['9sus4', 'm11']])
    expect(chung.every(([a, b]) => pcsDuoi(ct(a!), 0).join() !== pcsDuoi(ct(b!), 0).join())).toBe(true)
    expect(QUY_TAC_HO).toHaveLength(4)
  })

  it('bảy giảm chỉ có 3 hợp âm khác nhau; họ trưởng ở gốc Đô toàn phím trắng trừ maj9♯11; nốt căng chia hai dạng tay trái', () => {
    expect(new Set([...Array(12).keys()].map((g) => [...pcsTong(ct('dim7'), g)].sort((x, y) => x - y).join())).size).toBe(3)
    const trang = [0, 2, 4, 5, 7, 9, 11]
    expect(ho(0).filter((id) => !nhac(id).every((p) => trang.includes(p)))).toEqual(['maj9#11'])
    expect(ho(4).map((id) => dangTrai(ct(id)))).toEqual(['nốt gốc', 'nốt gốc', 'khung 7', 'khung 7', 'khung 7', 'khung 7'])
  })
})
