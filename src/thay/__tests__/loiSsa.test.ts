import { describe, expect, it } from 'vitest'
import { LOAI_KHUNG } from '../hocSolo/khungNot'
import {
  chamSsa,
  CHIA_TAY,
  CHONG,
  chonCauSsa,
  DINH,
  MAN_SSA,
  mauSsa,
  SO_NOT_CHAY,
  taoCauNhuAnh,
  taoCauSsa,
  tenNhuAnh,
  xongChong,
  type KetQuaSsa,
} from '../hocSolo/loiSsa'
import duNhuAnh from '../hocSolo/ssaNhuAnh.json'
import { THAY_CHAY } from '../hocSolo/cauThay'
import { MAN_KHUNG } from '../hocSolo/mauKhung'
import { manThay } from '../hocSolo/thayNhac'
import { chonCauQuyTacChong, taoCauChong, taoCauThayChong, vongNhuAnh, vongThay, type CauSsa } from '../hocSolo/loiSsa'
import { DOAN as DOAN_THAY } from '../hocSolo/thayNhac'

const pc = (x: number) => ((x % 12) + 12) % 12

/** Bấm lần lượt `ds` trên viên `c`, trả kết quả cuối và chuỗi nốt đã nhận. */
function bam(c: ReturnType<typeof taoCauSsa>, ds: readonly number[]) {
  let daChay: number[] = []
  let r: KetQuaSsa = { kq: 'tiep', daChay }
  for (const m of ds) {
    r = chamSsa(c, daChay, m)
    if (r.kq === 'tiep') daChay = r.daChay
  }
  return { r, daChay }
}

describe('Mưa khung nốt · lối SSA', () => {
  it('thế chồng là hợp âm ba anh dựng trên một bậc của bass', () => {
    expect(taoCauSsa('maj7', 0).khungTen).toBe('C + Em')
    expect(taoCauSsa('maj9', 0).khungTen).toBe('C + Em7')
    expect(taoCauSsa('m7', 2).khungTen).toBe('D + F')
    expect(taoCauSsa('m9', 2).khungTen).toBe('D + Fmaj7')
    expect(taoCauSsa('9sus4', 7).khungTen).toBe('G + F')
    expect(taoCauSsa('13sus4', 7).khungTen).toBe('G + Fmaj7')
    expect(taoCauSsa('m7b5', 11).khungTen).toBe('B + Dm')
    expect(taoCauSsa('maj7', 1).khungTen).toBe('C♯ + E♯m') // gốc 1 app gọi C♯ (khungLoai) — bậc 3 của C♯ là E♯
  })

  it('gợi ý khắp đàn: mọi thế đủ nốt, nằm trong tầm tay phải của anh, trải hơn một quãng tám; bass đứng trước và thấp hơn', () => {
    for (const id of Object.keys(CHONG))
      for (let g = 0; g < 12; g++) {
        const c = taoCauSsa(id, g)
        const { the, lo, chong } = c.ssa
        expect(the.length).toBeGreaterThanOrEqual(4)
        for (const t of the) {
          expect(new Set(t.map(pc))).toEqual(new Set(chong))
          expect(t[0]).toBeGreaterThanOrEqual(52)
          expect(t[0]).toBeLessThanOrEqual(71)
          expect(t[t.length - 1]! - t[0]!).toBeLessThan(12)
        }
        expect(the[the.length - 1]![0]! - the[0]![0]!).toBeGreaterThanOrEqual(12)
        expect(lo[0]).toBe(36 + g)
        expect(lo.filter((m) => pc(m) === g && m < 52).every((m) => m < the[0]![0]!)).toBe(true)
      }
  })

  it('gợi ý hai tay: tay trái bass rồi 5 – 8 dưới Mi3, tay phải thế chồng từ Mi3 — hai phần không lẫn', () => {
    for (const id of Object.keys(CHONG))
      for (let g = 0; g < 12; g++) {
        const { loTrai, lo, the } = taoCauSsa(id, g).ssa
        expect(loTrai[0]).toBe(36 + g)
        expect(loTrai.every((m) => m < CHIA_TAY && [0, 7].includes(pc(m - g)))).toBe(true)
        expect(lo.slice(0, loTrai.length)).toEqual(loTrai)
        expect(lo.slice(loTrai.length).every((m) => m >= CHIA_TAY && the.some((t) => t.includes(m)))).toBe(true)
      }
    expect(taoCauSsa('maj7', 0).ssa.loTrai).toEqual([36, 43, 48]) // Đô2 – Sol2 – Đô3
    expect(taoCauSsa('maj7', 11).ssa.loTrai).toEqual([47]) // gốc Si: chỉ còn Si2
  })

  it('chồng rồi chạy: bass trước, thế ở trên (cùng lúc hay rải), rồi đủ nốt chạy là đúng', () => {
    const c = taoCauSsa('maj7', 0)
    const chong = bam(c, [36, 52, 55, 59])
    expect(chong.r).toMatchObject({ kq: 'tiep', chu: expect.stringContaining('Chồng đủ') })
    expect(xongChong(c, chong.daChay)).toBe(3)
    expect(bam(c, [36, 52, 55, 59, 71, 74, 76]).r.kq).toBe('tiep')
    expect(bam(c, [36, 52, 55, 59, 71, 74, 76, 72]).r).toEqual({ kq: 'dung' })
    // rải lộn thứ tự, bass ở giữa chừng vẫn được — miễn thế nằm trên bass
    expect(xongChong(c, [64, 48, 67, 71])).toBe(3)
  })

  it('thế phải nằm trên bass: bass Đô 4 trên thế Mi3 – Sol3 – Si3 thì chưa chồng xong', () => {
    const c = taoCauSsa('maj7', 0)
    expect(xongChong(c, [52, 55, 59, 60])).toBe(-1)
    expect(xongChong(c, [52, 55, 59, 60, 64, 67, 71])).toBe(6)
  })

  it('nốt tránh là sai; nốt khung anh ít đặt trên đỉnh và gõ lại cùng phím thì không tính', () => {
    const cmaj7 = taoCauSsa('maj7', 0)
    expect(chamSsa(cmaj7, [], 53).kq).toBe('sai') // Fa trên Cmaj7
    const dm7 = taoCauSsa('m7', 2)
    const xong = bam(dm7, [38, 53, 57, 60]).daChay
    expect(xongChong(dm7, xong)).toBe(3)
    expect(chamSsa(dm7, xong, 71).kq).toBe('bo') // Si (13) — anh đặt trên đỉnh 1/83 lần
    const mot = chamSsa(dm7, xong, 76)
    expect(mot.kq).toBe('tiep')
    expect(chamSsa(dm7, mot.kq === 'tiep' ? mot.daChay : [], 76).kq).toBe('bo')
  })

  it('màn: mỗi loại có thế chồng, có trong bảng loại của app; câu chọn đúng màn', () => {
    for (const m of MAN_SSA)
      for (const id of m.loai ?? []) {
        expect(CHONG[id]).toBeDefined()
        expect(LOAI_KHUNG.some((l) => l.id === id)).toBe(true)
      }
    for (let i = 0; i < 30; i++) {
      const c = chonCauSsa(1, [0, 2, 4], new Map(), null)
      expect(['m7', 'm9']).toContain(c.id.slice(4))
    }
  })

  it('mẫu nghe: bass + thế, rồi bốn nốt đỉnh anh hay đặt, đi lên', () => {
    const c = taoCauSsa('m7', 2)
    const mau = mauSsa(c)
    expect(mau[0]![0]).toBe(38)
    expect(new Set(mau[0]!.slice(1).map(pc))).toEqual(new Set(c.ssa.chong))
    const chay = mau.slice(1).map((x) => x[0]!)
    expect(chay).toHaveLength(SO_NOT_CHAY)
    expect(chay.map((m) => pc(m - 2))).toEqual(DINH.thu.slice(0, SO_NOT_CHAY))
    expect(chay.every((m, i) => i === 0 || m > chay[i - 1]!)).toBe(true)
  })
})

const DOAN = (duNhuAnh as unknown as { doan: { clip: string; t: number; loai: string; the: number[] }[] }).doan
const tim = (clip: string, t: number) => DOAN.findIndex((d) => d.clip === clip && d.t === t)

describe('Mưa khung nốt · lối SSA — như anh (đúng hợp âm, đúng phím anh bấm)', () => {
  it('tên anh ghi trên màn hình, viết dấu ♭ ♯', () => {
    expect(tenNhuAnh('Gb', 'Maj9(13)', null)).toBe('G♭maj9(13)')
    expect(tenNhuAnh('Bb', 'min7b5(9,11)', 'E')).toBe('B♭m7♭5(9,11)/E')
    expect(tenNhuAnh('Eb', '13sus(b9)', null)).toBe('E♭13sus(♭9)')
    expect(tenNhuAnh('G', '7(b9#5)', null)).toBe('G7(♭9♯5)')
    expect(tenNhuAnh('Ab', 'Maj(add2)', 'C')).toBe('A♭(add2)/C')
    expect(tenNhuAnh('F', 'minMaj7(13)', null)).toBe('Fm(maj7)(13)')
  })

  it('mọi hợp âm anh chơi có thế tay phải ≥ 2 nốt tạo được viên; tay trái, thế, nốt chạy của anh đều là nốt chính', () => {
    let n = 0
    DOAN.forEach((d, i) => {
      if (d.the.length < 2) return
      n++
      const c = taoCauNhuAnh(i)
      expect(c.ssa.loai).toBe('nhu-anh')
      expect([...c.ssa.loTrai, ...c.ssa.the[0]!, ...c.ssa.chay].every((m) => c.ssa.dinh.includes(pc(m)))).toBe(true)
      expect(c.ssa.soChay).toBeLessThanOrEqual(SO_NOT_CHAY)
      expect(c.ssa.lo.slice(0, c.ssa.loTrai.length)).toEqual(c.ssa.loTrai)
    })
    expect(n).toBe(110)
  })

  it('bấm đúng phím anh: G♭maj9 (Rai 3 · 0:15) chồng xong là đúng; D♭maj9 (0:36) phải chạy thêm 4 nốt anh chạy', () => {
    expect(taoCauNhuAnh(tim('rai3', 1.5)).khungTen).toBe('G♭ + B♭m11') // G♭maj9(13) = G♭ + B♭m11 — lối chồng của anh
    expect(taoCauNhuAnh(tim('rai3', 3.5)).khungTen).toBe('G♭ + G♭m6') // tên thế tay phải theo dấu giáng của giọng (không phải F♯m6)
    const gb = taoCauNhuAnh(tim('rai3', 15.5))
    expect(gb.ten).toBe('G♭maj9')
    expect(gb.ssa.soChay).toBe(0)
    expect(bam(gb, [42, ...gb.ssa.the[0]!]).r).toEqual({ kq: 'dung' })
    expect(chamSsa(gb, [], 43).kq).toBe('sai') // Sol: anh không đánh, không có trong G♭maj9
    const db = taoCauNhuAnh(tim('rai3', 36.5))
    expect(db.ssa.soChay).toBe(4)
    expect(bam(db, [37, ...db.ssa.the[0]!]).r.kq).toBe('tiep')
    expect(bam(db, [37, ...db.ssa.the[0]!, ...db.ssa.chay.slice(0, 4)]).r).toEqual({ kq: 'dung' })
  })

  it('màn theo thứ tự clip: viên sau là hợp âm kế tiếp; màn hợp âm lạ bỏ loại quen', () => {
    const mi = MAN_SSA.findIndex((m) => m.ten.startsWith('Như anh · Rai 3'))
    const a = chonCauSsa(mi, [0], new Map(), null)
    const sau = chonCauSsa(mi, [0], new Map(), a.id)
    expect(MAN_SSA[mi]!.doan!.indexOf(Number(a.id.slice(4)))).toBe(0)
    expect(MAN_SSA[mi]!.doan!.indexOf(Number(sau.id.slice(4)))).toBe(1)
    const la = MAN_SSA.find((m) => m.ten === 'Như anh · chỉ hợp âm màu lạ')!
    expect(la.doan!.every((i) => !['Maj7', 'Maj9', 'min7', 'min9', '7', '', 'min', '5'].includes(DOAN[i]!.loai))).toBe(true)
    expect(la.doan!.length).toBeGreaterThan(30)
  })
})

/** Bấm để đúng như người chơi thấy gợi ý: phím tay trái (bass trước — công thức có thể thêm 3 · 7 như C9 = Đô – Mi + Gm), thế đầu, rồi đủ
 *  nốt chạy (lớp cao độ `dinh`, đi lên trên thế, không lặp nốt liền). */
function bamDu(c: CauSsa) {
  const the = c.ssa.the[0]!
  let tren = Math.max(...the)
  // Nốt chính có thể ít hơn số nốt chạy (Linh Nhi Cm: Sol – Mi♭ – Đô) — đi vòng lên quãng tám như người chơi: Sol4 Đô5 Mi♭5 Sol5.
  const chay = Array.from({ length: c.ssa.soChay }, (_, i) => {
    const p = c.ssa.dinh[i % c.ssa.dinh.length]!
    let m = tren + 1
    while (pc(m) !== p) m++
    tren = m
    return m
  })
  const trai = c.ssa.loTrai.length ? c.ssa.loTrai : c.ssa.bass === null ? [] : [36 + c.ssa.bass]
  return bam(c, [...trai, ...the, ...chay])
}
/** Mọi nốt của thế chồng đều là nốt chính (không thì chồng không bao giờ xong); chỗ đặt thế chỉ gồm nốt thế và nốt gốc; bấm đủ là đúng. */
function kiemVien(c: CauSsa) {
  expect(c.ssa.the.length).toBeGreaterThan(0)
  expect(c.ssa.chong.every((p) => c.ssa.vai(60 + p) === 'chinh')).toBe(true)
  expect(c.ssa.the.every((t) => t.every((m) => c.ssa.chong.includes(pc(m)) || pc(m) === c.g))).toBe(true)
  expect(c.ssa.loTrai.length).toBeGreaterThan(0)
  expect(bamDu(c).r).toEqual({ kq: 'dung' })
}

describe('lối chồng + chạy cho màn quy tắc và ba thầy (người dùng 15/10/2026: "Sao 3 thầy còn lại ko làm theo lối SSA")', () => {
  it('màn quy tắc: mọi màn × bước × 12 gốc — thế chồng đủ nốt chính, bấm bass + thế + 4 nốt chạy là đúng', () => {
    for (const m of MAN_KHUNG)
      for (const buoc of m.buoc)
        for (let g = 0; g < 12; g++) kiemVien(taoCauChong(LOAI_KHUNG.find((l) => l.id === buoc.id)!, g, buoc.nha))
  })

  it('màn quy tắc giữ lời quy tắc của màn; loại anh SSA có đo dùng thế anh, loại khác dùng công thức chồng (C7 = Đô + Mi–Sol–Si♭)', () => {
    const c7 = taoCauChong(LOAI_KHUNG.find((l) => l.id === '7')!, 0)
    expect(new Set(c7.ssa.chong)).toEqual(new Set([4, 7, 10]))
    expect(c7.ssa.nguonThe).toBe('công thức chồng của app')
    expect(taoCauChong(LOAI_KHUNG.find((l) => l.id === 'maj7')!, 0).ssa.nguonThe).toBe('thế anh SSA (đo bằng hình)')
    for (let i = 0; i < 20; i++) {
      const c = chonCauQuyTacChong(0, [0], new Map(), null)
      expect(c.khungTen === 'khung gốc — thuộc khung này trước' || c.khungTen.startsWith('từ C')).toBe(true)
      expect(c.ssa.loai).toBe('quy-tac')
    }
  })

  it('ba thầy: mọi màn × chỗ đứng × ba giọng — thế của thầy đủ nốt chính, bấm đủ là đúng', () => {
    for (const t of THAY_CHAY)
      for (const m of manThay(t.id))
        for (const c of m.cho) for (const tonic of [0, 5, 10]) kiemVien(taoCauThayChong(t.id, c, tonic))
  })

  it('thế thầy: Cà Pháo maj9 = 7 · 9 · 3 (sheet "Có Em Chờ"); Linh Nhi hợp âm ba; Blues 13 trải rộng thì gợi ý thế đảo gọn', () => {
    const cho = (t: (typeof THAY_CHAY)[number]['id'], duoi: string) => manThay(t).flatMap((m) => m.cho).find((c) => c.duoi === duoi)!
    const cp = taoCauThayChong('ca-phao', cho('ca-phao', 'maj9'), 0)
    expect(new Set(cp.ssa.chong.map((p) => pc(p - cp.g)))).toEqual(new Set([11, 2, 4]))
    expect(cp.ssa.nguonThe).toContain('Cà Pháo')
    const ln = taoCauThayChong('linh-nhi', cho('linh-nhi', ''), 0)
    expect(new Set(ln.ssa.chong.map((p) => pc(p - ln.g)))).toEqual(new Set([0, 4, 7]))
    const bl = taoCauThayChong('blues', cho('blues', '13'), 0)
    expect(bl.ssa.the.every((t) => t[t.length - 1]! - t[0]! <= 12)).toBe(true)
  })
})

describe('backing track — vòng nền (người dùng 15/10/2026: "có nhạc backing track để solo trên đó")', () => {
  it('Lối SSA: vòng đúng clip — mỗi hợp âm ≥ 2 phách, nền bass mỗi đầu ô đúng bass của viên, rải 5 – 8 sau đó', () => {
    const ds = MAN_SSA.flatMap((m, mi) => (m.clip ? [mi] : []))
    expect(ds).toHaveLength(3)
    for (const mi of ds) {
      const v = vongNhuAnh(mi)!
      expect(v.cau.length).toBe(MAN_SSA[mi]!.doan!.length)
      expect(v.nhip.every((x) => x >= 2)).toBe(true)
      let t = 0
      v.cau.forEach((c, i) => {
        const bass = v.nen.find((h) => h.startBeat === t && h.durationBeats === v.nhip[i])!
        expect(pc(bass.notes[0]!)).toBe(pc(c.ssa.bass ?? c.g))
        t += v.nhip[i]!
      })
      expect(Math.max(...v.nen.map((h) => h.startBeat + h.durationBeats))).toBeLessThanOrEqual(t)
    }
    // Rai 3 — mỗi ô một hợp âm, ~3,5 s ở phách 0,86 s → 4 phách
    const rai3 = vongNhuAnh(ds[2]!)!
    expect(rai3.nhip.filter((x) => x === 4).length).toBeGreaterThan(rai3.nhip.length / 3)
  })

  it('ba thầy × ba đoạn × hai giọng: bộ soạn ra vòng, mỗi viên bấm phím gợi ý + chạy là đúng; nền là tay trái + thế màu của thầy', () => {
    for (const t of THAY_CHAY)
      for (const kind of DOAN_THAY)
        for (const [tonic, thu] of [
          [0, false],
          [9, true],
        ] as const) {
          let v = null
          for (let take = 0; take < 6 && !v; take++) v = vongThay(t.id, tonic, thu, kind, take)
          expect(v, `${t.id} ${kind} ${tonic}`).not.toBeNull()
          expect(v!.cau.length).toBe(v!.nhip.length)
          expect(v!.nen.length).toBeGreaterThan(0)
          for (const c of v!.cau) kiemVien(c)
        }
  })
})
