import { describe, expect, it } from 'vitest'
import { chordPitchClasses, getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC, pcsDuoi, pcsTong, pcsTren, quangTren, tenTren } from './chongHopAm'
import { bacCua, bangCongLoai, bangTheoDuoi, congLoai, dangTrai, duoiCua, HO_LOAI, NHOM_DUOI, QUY_TAC_DUOI, trungCongLoai } from './meoChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
/** Lớp cao độ ở gốc Đô của một hàng bảng: công thức chồng, hay hợp âm ba cơ bản `q:<loại>`. */
const nhac = (id: string) => (id.startsWith('q:') ? chordPitchClasses(0, getChordQuality(id.slice(2))!) : pcsTong(ct(id), 0))

describe('quy luật và mẹo', () => {
  it('năm họ (chia màn game) chia hết 26 loại, không trùng', () => {
    const ids = HO_LOAI.flatMap((h) => h.ids)
    expect(ids.length).toBe(26)
    expect([...ids].sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
  })

  it('bậc hai tay đúng nốt — vd 13♭9: tay trái 1 · 3 · ♭7, tay phải 13 · ♭9 · 3', () => {
    expect(bacCua(ct('13b9'))).toEqual({ trai: ['1', '3', '♭7'], phai: ['13', '♭9', '3'], caHai: ['1', '3', '♭7', '♭9', '13'] })
    expect(bacCua(ct('m11b5')).phai).toEqual(['♭3', '11', '♭7'])
    expect(bacCua(ct('dim7')).caHai).toEqual(['1', '♭3', '♭5', '𝄫7'])
  })
})

describe('theo đuôi — muốn chồng ra loại nào (gốc Đô)', () => {
  it('16 nhóm phủ đủ 26 công thức và 6 hợp âm ba cơ bản, mỗi hợp âm đúng một nhóm', () => {
    const ids = NHOM_DUOI.flatMap((n) => n.ids)
    expect(NHOM_DUOI).toHaveLength(16)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.filter((id) => !id.startsWith('q:')).sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(ids.filter((id) => id.startsWith('q:')).sort()).toEqual(['q:aug', 'q:dim', 'q:maj', 'q:min', 'q:sus2', 'q:sus4'])
    expect(ids.filter((id) => id.startsWith('q:')).every((id) => getChordQuality(id.slice(2)))).toBe(true)
  })

  it('nốt dấu hiệu của từng nhóm đúng với mọi hợp âm trong nhóm', () => {
    for (const n of NHOM_DUOI)
      for (const id of n.ids) {
        const p = nhac(id)
        expect([n.ten, id, n.co.filter((x) => !p.includes(x)), n.khong.filter((x) => p.includes(x)), !n.coMot || n.coMot.some((x) => p.includes(x))]).toEqual([
          n.ten,
          id,
          [],
          [],
          true,
        ])
      }
  })

  it('cách chồng: lời ghi đúng tên tay phải của từng công thức, và đúng chỗ dựng tay phải', () => {
    for (const n of bangTheoDuoi()) for (const d of n.dong.filter((x) => !x.id.startsWith('q:'))) expect([n.ten, d.id, n.cach.includes(d.phai)]).toEqual([n.ten, d.id, true])
    const cach = (id: string) => (ct(id).tren as { cach: number }).cach
    expect(['6', 'm6', '69', 'add9', 'madd9'].map((id) => dangTrai(ct(id)))).toEqual(Array(5).fill('gốc – 5')) // nhóm 6 và add9: tay trái Đô – Sol
    expect(['6', 'm6', '69'].map(cach)).toEqual([9, 9, 9]) // tay phải dựng trên La
    expect(['m7b5', 'dim7', 'm11b5'].map(cach)).toEqual([3, 3, 3]) // nhóm giảm: tay phải đứng trên Mi♭
    expect(['maj9', '9', 'm9'].map(cach)).toEqual([7, 7, 7]) // nhóm 9: tay phải dựng trên Sol
    expect(['7', 'm7', 'maj7', 'mMaj7'].map(cach)).toEqual([4, 3, 4, 3]) // nhóm 7, maj7: tay phải dựng trên nốt 3
    expect(['13', 'm13'].map((id) => [dangTrai(ct(id)), pcsTren(ct(id), 0).includes(9)])).toEqual([['khung 7', true], ['khung m7', true]])
  })

  it('hợp âm ba cơ bản: trưởng đổi một nốt ra thứ / tăng / sus4 / sus2; thứ hạ Sol ra giảm; tăng chia đều', () => {
    const q = (id: string, g = 0) => [...chordPitchClasses(g, getChordQuality(id)!)].sort((a, b) => a - b)
    const khac = (a: number[], b: number[]) => [a.filter((x) => !b.includes(x)), b.filter((x) => !a.includes(x))]
    expect(['min', 'aug', 'sus4', 'sus2'].map((id) => khac(q('maj'), q(id)))).toEqual([
      [[4], [3]],
      [[7], [8]],
      [[4], [5]],
      [[4], [2]],
    ])
    expect(khac(q('min'), q('dim'))).toEqual([[7], [6]])
    expect([q('aug', 4), q('aug', 8)]).toEqual([q('aug'), q('aug')])
    expect(new Set([...Array(12).keys()].map((g) => [...pcsTong(ct('dim7'), g)].sort((a, b) => a - b).join())).size).toBe(3) // 3 hợp âm bảy giảm
  })

  it('cầu thang 7 → 9 → 11 → 13: tay phải loại sau giữ đúng hai nốt trên của loại trước; lời ghi đúng tên', () => {
    const phai = (id: string) => quangTren(ct(id)).map((x) => x % 12)
    for (const day of [['maj7', 'maj9', 'maj9#11'], ['m7', 'm9', 'm11', 'm13'], ['7', '9', '9sus4']]) {
      for (let i = 1; i < day.length; i++) {
        const [a, b] = [phai(day[i - 1]!), phai(day[i]!)]
        expect([day[i], b[0], new Set(b.filter((p) => a.includes(p)))]).toEqual([day[i], a[1], new Set(a.slice(1))])
      }
      expect(QUY_TAC_DUOI[1]).toContain(day.map((id) => tenTren(ct(id), 'C', 'flat')).join(' → '))
    }
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
    expect(QUY_TAC_DUOI[2]).toContain('19 cặp')
    for (const [a, b] of [
      ['6', '69'], ['6', 'm6'], ['69', 'add9'], ['maj7', '7'], ['maj7', 'mMaj7'], ['m7', '7'], ['m7', 'm7b5'], ['m7b5', 'dim7'],
      ['7', '7b9'], ['7', '7b5'], ['13', '13b9'], ['13b9', '13b9#11'], ['maj9', 'maj9#11'], ['13', '7b13'],
    ] as const)
      expect([a, b, motNot(a, b)]).toEqual([a, b, true])
  })

  it('ba tay phải dùng chung, chỉ tay trái khác', () => {
    const theoPhai = new Map<string, string[]>()
    for (const c of CONG_THUC) {
      const k = [...pcsTren(c, 0)].sort((x, y) => x - y).join()
      theoPhai.set(k, [...(theoPhai.get(k) ?? []), c.id])
    }
    const chung = [...theoPhai.values()].filter((v) => v.length > 1)
    expect(chung.map((v) => [...v].sort()).sort()).toEqual([['13', '6'], ['9', 'm9'], ['9sus4', 'm11']])
    expect(chung.every(([a, b]) => pcsDuoi(ct(a!), 0).join() !== pcsDuoi(ct(b!), 0).join())).toBe(true)
  })

  it('bảng: tên hai tay ở gốc Đô; chùm nốt rời gọi bằng nốt; dòng ngắn cho màn game', () => {
    const dong = bangTheoDuoi().flatMap((n) => n.dong)
    const lay = (id: string) => dong.find((d) => d.id === id)!
    expect([lay('q:maj').tong, lay('q:maj').trai, lay('q:maj').phai]).toEqual(['C', 'Đô', 'C'])
    expect([lay('maj7').tong, lay('maj7').trai, lay('maj7').phai, lay('maj7').phaiPhu]).toEqual(['Cmaj7', 'Đô', 'Em', 'Mi – Sol – Si'])
    expect([lay('add9').phai, lay('add9').phaiPhu]).toEqual(['Rê – Mi – Sol', 'chùm nốt rời'])
    expect(duoiCua(['maj7', '6', 'add9', '69', 'maj9', 'maj9#11']).map((s) => s.split(' (')[0])).toEqual(['6', 'add9', 'maj7', '9', '♯11'])
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
    expect(bangCongLoai(['maj9', 'maj9#11', '6']).map((d) => [d.dang, d.viDu])).toEqual([
      ['gốc – 5', 'Đô – Sol'],
      ['trưởng', 'C'],
    ])
  })
})
