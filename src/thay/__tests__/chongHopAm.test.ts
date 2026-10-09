import { describe, expect, it } from 'vitest'
import { chordPitchClasses, findQualityBySymbol, getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import {
  chongTuDo,
  CONG_THUC,
  DO_DUOC,
  KHI_CHON,
  LOAI_TU_DO,
  mauCuaHo,
  nhanHaiTay,
  nhanMau,
  pcsDuoi,
  pcsTong,
  pcsTren,
  quangTren,
  soThe,
  tenHaiTay,
  tenTren,
  tenTrongGiong,
  theBamChong,
} from '../soanCau/chongHopAm'
import { cungTap, docTay, traLoiTen } from '../soanCau/soanCau'

const pc = (x: number) => ((x % 12) + 12) % 12
const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
/** Lớp cao độ (so với gốc) mà công thức sinh ra — gộp mọi thế đảo của hai tầng. */
const sinh = (id: string) => {
  const c = ct(id)
  const iv = [...c.duoi.flat(), ...Array.from({ length: soThe(c) }, (_, k) => quangTren(c, k)).flat()]
  return [...new Set(iv.map(pc))].sort((a, b) => a - b)
}

/** Nốt mỗi công thức PHẢI sinh ra — viết tay theo lý thuyết; công thức sai thì test này đỏ. m13 · 13 · 7♭13 bỏ bậc 5 (thường gặp ở hợp âm mở rộng). */
const PHAI_RA: Record<string, number[]> = {
  maj7: [0, 4, 7, 11], maj9: [0, 2, 4, 7, 11], '6': [0, 4, 7, 9], '69': [0, 2, 4, 7, 9], add9: [0, 2, 4, 7], 'maj9#11': [0, 2, 4, 6, 7, 11],
  m7: [0, 3, 7, 10], m9: [0, 2, 3, 7, 10], m11: [0, 2, 3, 5, 7, 10], m13: [0, 2, 3, 5, 9, 10], m6: [0, 3, 7, 9], madd9: [0, 2, 3, 7],
  mMaj7: [0, 3, 7, 11], m7b5: [0, 3, 6, 10], m11b5: [0, 3, 5, 6, 10], dim7: [0, 3, 6, 9],
  '7': [0, 4, 7, 10], '9': [0, 2, 4, 7, 10], '13': [0, 4, 9, 10], '9sus4': [0, 2, 5, 10], '7b9': [0, 1, 4, 7, 10],
  '13b9': [0, 1, 4, 9, 10], '13#11': [0, 2, 4, 6, 9, 10], '7b13': [0, 4, 8, 10], '7b5': [0, 4, 6, 10], '13b9#11': [0, 1, 4, 6, 9, 10],
}

describe('Chồng hợp âm — công thức sinh đúng nốt', () => {
  it('mọi công thức sinh đúng tập nốt viết tay, và nằm trong hợp âm cùng tên của app', () => {
    expect(Object.keys(PHAI_RA).sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    for (const c of CONG_THUC) {
      expect(sinh(c.id), c.id).toEqual(PHAI_RA[c.id])
      const q = findQualityBySymbol(c.kyHieu)
      // m13 của app không ghi nốt 11; m13 đầy đủ có cả 9 – 11 – 13 (tầng trên Mi thứ trên Rê) — nốt 11 là chủ ý, không phải lỗi.
      const them = c.id === 'm13' ? [5] : []
      if (q) for (const x of sinh(c.id)) expect([...chordPitchClasses(0, q), ...them], `${c.id} có ${x}`).toContain(x)
    }
  })

  it('ba công thức của Jeff đúng như video: Dm11 = Dm + C, Cmaj9 = C + G, G13♭9♯11 = Si–Fa + Rê♭ thứ', () => {
    expect(ct('m11').nguon).toBe('jeff')
    expect(tenTren(ct('m11'), 'D', 'sharp')).toBe('C')
    expect(tenTren(ct('maj9'), 'C', 'sharp')).toBe('G')
    expect(tenTren(ct('13b9#11'), 'G', 'sharp')).toBe('D♭m')
    // Chuyển giọng như cuối video: Fm11 = Fm + E♭; trong Mi♭ trưởng B♭13♭9♯11 = Rê–La♭ + Mi thứ; E♭maj9 = E♭ + B♭.
    expect(tenTren(ct('m11'), 'F', 'flat')).toBe('E♭')
    expect(tenTren(ct('13b9#11'), 'Bb', 'flat')).toBe('Em')
    expect(tenTren(ct('maj9'), 'Eb', 'flat')).toBe('B♭')
    expect(tenHaiTay(ct('13b9#11'), 'Bb', 'flat').trai).toEqual(['Si♭', 'Rê', 'La♭'])
  })

  it('tầng trên gọi theo chữ cái của chính nó: La trưởng trên G7 là La – Đô♯ – Mi, không phải Rê♭', () => {
    expect(tenHaiTay(ct('13#11'), 'G', 'sharp').phai).toEqual(['La', 'Đô♯', 'Mi'])
    expect(tenHaiTay(ct('m7b5'), 'B', 'sharp').phai).toEqual(['Rê', 'Fa', 'La'])
    expect(tenHaiTay(ct('m11'), 'D', 'sharp', 2, 2).trai).toEqual(['La', 'Rê', 'Fa'])
  })

  it('thế bấm: tay phải nằm trên tay trái, trong tầm bàn phím, đúng lớp cao độ ở mọi gốc và mọi thế', () => {
    for (const c of CONG_THUC)
      for (let goc = 0; goc < 12; goc++)
        for (let dd = 0; dd < c.duoi.length; dd++)
          for (let dt = 0; dt < soThe(c); dt++) {
            const { trai, phai } = theBamChong(c, goc, dd, dt)
            expect(Math.min(...phai)).toBeGreaterThan(Math.max(...trai))
            expect(Math.min(...trai)).toBeGreaterThanOrEqual(36)
            expect(Math.max(...phai)).toBeLessThanOrEqual(96)
            for (const m of [...trai, ...phai]) expect(PHAI_RA[c.id]).toContain(pc(m - goc))
          }
  })

  it('đố chuyển giọng: chỉ hỏi công thức có tầng trên là một hợp âm; tên gõ vào chấm được', () => {
    expect(DO_DUOC.every((c) => !('iv' in c.tren))).toBe(true)
    expect(traLoiTen('Dbm', pcsTren(ct('13b9#11'), 7))).toBe('dung')
    expect(traLoiTen('C#m', pcsTren(ct('13b9#11'), 7))).toBe('dung')
    expect(traLoiTen('Eb+', pcsTren(ct('7b13'), 7))).toBe('dung')
    expect(traLoiTen('Bdim7', pcsTren(ct('7b9'), 7))).toBe('dung')
    expect(traLoiTen('Dsus2', pcsTren(ct('m11b5'), 11))).toBe('dung')
    expect(traLoiTen('Asus4', pcsTren(ct('69'), 0))).toBe('dung')
    expect(traLoiTen('C', pcsTren(ct('13b9#11'), 7))).toBe('sai')
  })

  it('tên nốt theo chữ cái: ♭II của Đô trưởng là Rê♭, nốt cảm âm Rê thứ là Đô♯', () => {
    expect(tenTrongGiong(0, false, 1)).toBe('Db')
    expect(tenTrongGiong(2, true, 11, 7)).toBe('C#')
    expect(tenTrongGiong(9, true, 11, 7)).toBe('G#')
    expect(tenTrongGiong(5, false, 10)).toBe('Eb')
  })
})

describe('Nhãn hai tay — tên tay trái, tên tay phải, hợp âm tổng (người dùng 8/10/2026)', () => {
  it('tay trái là hợp âm ba thì gọi tên hợp âm; tay phải là hợp âm chồng trên; tổng ở dưới', () => {
    expect(nhanHaiTay(ct('m11'), 'F', 'flat')).toMatchObject({ trai: 'Fm', traiPhu: 'Fa – La♭ – Đô', phai: 'E♭', tong: 'Fm11' })
    expect(nhanHaiTay(ct('maj9'), 'Eb', 'flat')).toMatchObject({ trai: 'E♭', phai: 'B♭', tong: 'E♭maj9' })
  })

  it('tay trái không phải hợp âm ba thì ghi nốt, kèm vai của chúng', () => {
    expect(nhanHaiTay(ct('7'), 'G', 'sharp')).toMatchObject({ trai: 'Sol', traiPhu: 'gốc', tong: 'G7' })
    expect(nhanHaiTay(ct('6'), 'C', 'sharp')).toMatchObject({ trai: 'Đô – Sol', traiPhu: 'gốc – 5', phai: 'Am', tong: 'C6' })
    expect(nhanHaiTay(ct('add9'), 'C', 'sharp').phai).toBe('chùm 9 – 3 – 5')
  })
})

describe('Trang Hợp âm — chấm đố chồng hợp âm (bước B)', () => {
  const F = 5
  it('tay trái, tay phải, hợp âm tổng của Fm11 = Fm + E♭', () => {
    expect(cungTap(pcsDuoi(ct('m11'), F), [5, 8, 0])).toBe(true)
    expect(cungTap(pcsTren(ct('m11'), F), [3, 7, 10])).toBe(true)
    expect(cungTap(pcsTong(ct('m11'), F), [5, 8, 0, 3, 7, 10])).toBe(true)
  })

  it('nhận hợp âm màu từ phím đang giữ — đủ nốt, thừa nhiều nhất bậc 5; hợp âm ba trơn không phải màu', () => {
    expect(nhanMau([0, 4, 7, 11, 2], 0, 'Trưởng')?.id).toBe('maj9')
    expect(nhanMau([0, 4, 7, 11], 0, 'Trưởng')?.id).toBe('maj7')
    expect(nhanMau([0, 4, 7], 0, 'Trưởng')).toBeNull()
    expect(nhanMau([2, 5, 9, 0, 4], 2, 'Thứ')?.id).toBe('m9')
    // G13 có giữ cả bậc 5 (Rê) vẫn nhận là 13; G7 trơn là gốc của họ Át, không tính màu.
    expect(nhanMau([7, 11, 2, 5, 4], 7, 'Át')?.id).toBe('13')
    expect(nhanMau([7, 11, 2, 5], 7, 'Át')).toBeNull()
    expect(mauCuaHo('Át').some((c) => c.id === '7')).toBe(false)
  })

  it('đọc câu trả lời một tay: tên hợp âm, một nốt (mọi cách hiểu), dãy nốt chữ cái hay tên Việt', () => {
    expect(docTay('Fm').some((x) => cungTap(x, [5, 8, 0]))).toBe(true)
    expect(docTay('F').some((x) => cungTap(x, [5]))).toBe(true)
    expect(docTay('F').some((x) => cungTap(x, [5, 9, 0]))).toBe(true)
    expect(docTay('Rê – La♭')).toEqual([[2, 8]])
    expect(docTay('F Ab C')).toEqual([[5, 8, 0]])
    expect(docTay('Do')).toEqual([[0]])
    expect(docTay('xyz')).toEqual([])
  })
})

describe('Tab Hợp âm màu — mỗi màu có lời "khi nào nên chọn" (người dùng 8/10/2026)', () => {
  it('đủ 26 công thức, mỗi lời đủ dài để nói khi nào', () => {
    for (const c of CONG_THUC) expect((KHI_CHON[c.id] ?? '').length, c.id).toBeGreaterThan(40)
  })
})

describe('Chọn hợp âm tự do — thế chồng hai tay cho mọi hợp âm của app (người dùng 9/10/2026)', () => {
  const lop = (ds: readonly number[]) => [...new Set(ds.map((m) => ((m % 12) + 12) % 12))].sort((a, b) => a - b)
  it('hợp âm ba trơn: tay trái gốc, tay phải bấm cả hợp âm', () => {
    const c = chongTuDo(0, 'maj', 'sharp')!
    expect(c.nhan).toMatchObject({ trai: 'Đô', traiPhu: 'gốc', phai: 'C', tong: 'C' })
    expect(lop(c.phai)).toEqual([0, 4, 7])
    expect(Math.min(...c.phai)).toBeGreaterThan(Math.max(...c.trai))
    expect(chongTuDo(9, 'min', 'sharp')!.nhan).toMatchObject({ phai: 'Am', tong: 'Am' })
  })

  it('có công thức chồng thì theo công thức (Fm11 = Fm + E♭)', () => {
    expect(chongTuDo(5, 'm11', 'flat')!.nhan).toMatchObject({ trai: 'Fm', phai: 'E♭', tong: 'Fm11' })
  })

  it('không có công thức: tay phải là hợp âm chồng trên nằm trọn trong hợp âm, tay trái gốc + nốt thiếu — đủ nốt của hợp âm', () => {
    for (const q of LOAI_TU_DO) {
      for (const g of [0, 7, 10]) {
        const c = chongTuDo(g, q.id, 'flat')!
        expect(c, `${g} ${q.id}`).toBeTruthy()
        const can = lop(chordPitchClasses(g, getChordQuality(q.id)!))
        const co = lop([...c.trai, ...c.phai])
        expect(((c.trai[0]! - g) % 12 + 12) % 12, `${g}${q.kyHieu}: bass phải là gốc`).toBe(0)
        // Đi qua công thức chồng thì nốt đã kiểm ở PHAI_RA (công thức mở rộng bỏ bậc 5, 13 bỏ cả 9). Nhánh tự dựng: đủ mọi nốt, trừ bậc 5.
        if (c.ct) continue
        expect(can.every((p) => co.includes(p) || p === (g + 7) % 12), `${g}${q.kyHieu}: thiếu nốt`).toBe(true)
      }
    }
  })
})
