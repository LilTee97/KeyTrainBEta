import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { chamThay, choThay, chonCauThay, doThay, khungCho, manThay, nhomDuoi, taoCauThay } from '../hocSolo/thayNhac'

const THAY = ['ca-phao', 'linh-nhi', 'blues'] as const
const pc = (x: number) => ((x % 12) + 12) % 12

describe('Phong cách thầy — đo trên bộ soạn của thầy', () => {
  /* Ghi lại số đo: TAO_THAY_NHAC=1 npx vitest run src/thay/__tests__/thayNhac.test.ts */
  it.runIf(!!process.env.TAO_THAY_NHAC)(
    'ghi thayNhac.json',
    () => {
      const dong = THAY.map((t) => `  "${t}": [\n${doThay(t).map((x) => `    ${JSON.stringify(x)}`).join(',\n')}\n  ]`)
      writeFileSync('src/thay/hocSolo/thayNhac.json', `{\n${dong.join(',\n')}\n}\n`)
    },
    120000,
  )
  it('thayNhac.json khớp bộ soạn hiện tại (bộ soạn đổi thì chạy lại với TAO_THAY_NHAC=1)', () => {
    for (const t of THAY) expect(choThay(t), t).toEqual(doThay(t))
  }, 120000)
  it('mỗi thầy: vốn hợp âm riêng — Cà Pháo có m7 · maj7 · treo · m7♭5; Linh Nhi phần lớn hợp âm ba; Blues hợp âm bảy có màu ở I · IV · V', () => {
    const duoi = (t: (typeof THAY)[number]) => new Set(choThay(t).map((c) => c.duoi))
    expect([...duoi('ca-phao')]).toEqual(expect.arrayContaining(['m7', 'maj7', '9sus4', 'm7b5']))
    const ln = choThay('linh-nhi')
    const ba = ln.filter((c) => nhomDuoi(c.duoi) === 'Hợp âm ba').reduce((s, c) => s + c.soLan, 0)
    expect(ba / ln.reduce((s, c) => s + c.soLan, 0)).toBeGreaterThan(0.6)
    const bl = choThay('blues')
    for (const [duoi, goc] of [['13', 0], ['9', 5], ['9', 7]] as const) expect(bl.some((c) => c.duoi === duoi && c.goc === goc && !c.thu), `${duoi} ${goc}`).toBe(true)
  })
  it('khung thầy: nốt hợp âm luôn chính; chính · phụ · không tách rời; mọi màn × chỗ đứng × 12 chủ âm tạo được câu có gốc', () => {
    for (const t of THAY) {
      const mans = manThay(t)
      expect(mans.length, t).toBeGreaterThanOrEqual(3)
      mans.forEach((m, mi) =>
        m.cho.forEach((c, j) => {
          const kh = khungCho(c)
          for (const iv of findQualityBySymbol(c.duoi)!.intervals) expect(kh.chinh, `${t} ${c.duoi}`).toContain(pc(iv))
          expect(kh.chinh.some((b) => kh.khong.includes(b) || kh.phu.includes(b))).toBe(false)
          for (let g = 0; g < 12; g += 5) {
            const q = taoCauThay(t, mi, j, g)
            expect(q.chinh).toContain(q.g)
            expect(q.chinh.some((p) => q.tranh.includes(p))).toBe(false)
            expect(q.khungTen).toMatch(/ · giọng /)
          }
        }),
      )
    }
  })
  it('chấm màn thầy: nốt thầy không đánh sai, nốt đánh ít không tính, đủ nốt chính là đúng; chọn câu không lặp', () => {
    const q = taoCauThay('ca-phao', 0, 0, 0)
    if (q.tranh.length) expect(chamThay(q, 60 + q.tranh[0]!, []).kq).toBe('sai')
    const it_ = [...Array(12).keys()].find((p) => !q.chinh.includes(p) && !q.tranh.includes(p))
    if (it_ !== undefined) expect(chamThay(q, 60 + it_, []).kq).toBe('mo')
    expect(chamThay(q, 60 + q.chinh.at(-1)!, q.chinh.slice(0, -1).map((p) => 60 + p)).kq).toBe('dung')
    let r = 5
    const rand = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646
    let truoc: string | null = null
    for (let k = 0; k < 100; k++) {
      const c = chonCauThay('linh-nhi', 0, [0, 7], new Map(), truoc, rand)
      expect(c.id).not.toBe(truoc)
      truoc = c.id
    }
  })
})
