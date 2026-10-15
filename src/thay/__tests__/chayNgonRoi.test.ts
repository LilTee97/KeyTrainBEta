import { describe, expect, it } from 'vitest'
import { chamNot, chamO, chonCauNgon, chongSsa, duChong, khungVong, MAN_NGON, notVaoO, SO_NOT_CAU, taoCauNgon } from '../hocSolo/chayNgonRoi'
import { khungLoai, LOAI_KHUNG, mucCua, VONG_KHUNG } from '../hocSolo/khungNot'

const loai = (id: string) => LOAI_KHUNG.find((l) => l.id === id)!

describe('Game chạy ngón (thử) — phần 1 làm quen loại hợp âm', () => {
  it('màn: mỗi nhóm đuôi một màn, mỗi loại đúng một màn nhóm; màn trộn đủ 28 loại', () => {
    expect(MAN_NGON.at(-1)!.loai.length).toBe(LOAI_KHUNG.length)
    for (const l of LOAI_KHUNG) expect(MAN_NGON.slice(0, -1).filter((m) => m.loai.includes(l.id)).length, l.id).toBe(1)
  })
  it('mọi loại × 12 gốc × 3 cách: câu có tên, ≥ 3 nốt chính, phím hé lộ; thế chồng hai tay tự nó chấm đủ (không nốt không màu)', () => {
    for (const l of LOAI_KHUNG)
      for (let g = 0; g < 12; g++) {
        const k = khungLoai(l, g)
        expect(k.not.filter((n) => n.muc === 'chinh').length, `${k.ten}`).toBeGreaterThanOrEqual(3)
        for (const cach of ['chinh', 'cau', 'chong'] as const) {
          const c = taoCauNgon(0, l.id, g, cach)
          expect(c.lo.length, `${c.ten} ${cach}`).toBeGreaterThan(0)
          expect(c.goiY.length + c.khungTen.length + c.loi.length + c.meo.length).toBeGreaterThan(20)
        }
        const s = chongSsa(k)
        expect(duChong([...s.trai, ...s.phai], k), `${k.ten} = ${s.ten}`).toBe(true)
      }
  })
  it('nốt chính: Cmaj7 — Rê (phụ) sai, Fa (không màu) sai, Đô Mi Sol chưa đủ, thêm Si là đúng', () => {
    const k = khungLoai(loai('maj7'), 0)
    expect(chamNot('chinh', k, [], 62, []).kq).toBe('sai')
    expect(chamNot('chinh', k, [], 65, []).kq).toBe('sai')
    const r = chamNot('chinh', k, [60, 64], 67, [])
    expect(r).toEqual({ kq: 'tiep', daChay: [60, 64, 67] })
    expect(chamNot('chinh', k, [60, 64, 67], 71, []).kq).toBe('dung')
    expect(chamNot('chinh', k, [60, 64, 67], 72, []).kq).toBe('tiep')
  })
  it(`chạy câu: ${SO_NOT_CAU} nốt trong khung, dừng ở nốt chính; nốt không màu làm câu chạy lại`, () => {
    const k = khungLoai(loai('maj7'), 0)
    let da: number[] = []
    for (const m of [64, 62, 60, 62]) {
      const r = chamNot('cau', k, da, m, [])
      expect(r.kq).toBe('tiep')
      da = r.kq === 'tiep' ? r.daChay : da
    }
    const phu = chamNot('cau', k, da, 69, []) // La = 13, nốt phụ của Cmaj7: đủ 5 nốt mà chưa dừng ở nốt chính
    expect(phu.kq).toBe('tiep')
    expect(chamNot('cau', k, phu.kq === 'tiep' ? phu.daChay : [], 71, []).kq).toBe('dung')
    const sai = chamNot('cau', k, da, 65, [])
    expect(sai).toMatchObject({ kq: 'sai', daChay: [] })
  })
  it('chồng hai tay: Đô + Mi thứ là Cmaj7; thiếu bass gốc hay giữ nốt không màu thì chưa', () => {
    const k = khungLoai(loai('maj7'), 0)
    expect(duChong([48, 64, 67, 71], k)).toBe(true)
    expect(duChong([48, 64, 71], k)).toBe(true) // bỏ bậc 5
    expect(duChong([52, 60, 67, 71], k)).toBe(false) // bass Mi
    expect(duChong([48, 64, 65, 71], k)).toBe(false) // giữ Fa không màu
    const c13 = khungLoai(loai('13'), 0)
    expect(duChong([48, 64, 70, 81], c13)).toBe(true) // C13 bỏ 5 và 9
  })
  it('chọn câu: không lặp loại vừa rồi, loại sai quay lại nhiều hơn, gốc trong tập cho phép', () => {
    let r = 7
    const rand = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646
    const dem = new Map<string, number>()
    let truoc: string | null = null
    for (let k = 0; k < 600; k++) {
      const c = chonCauNgon(0, [0, 2, 4], new Map([['0:maj9', 5]]), truoc, 'chinh', rand)
      expect(c.id).not.toBe(truoc)
      expect([0, 2, 4]).toContain(c.g)
      dem.set(c.id, (dem.get(c.id) ?? 0) + 1)
      truoc = c.id
    }
    expect(dem.get('0:maj9')!).toBeGreaterThan(dem.get('0:maj7')!)
  })
})

describe('Game chạy ngón (thử) — phần 2 solo trên vòng', () => {
  it('mọi vòng có sẵn đọc được, mỗi hợp âm một khung có nốt chính', () => {
    for (const v of VONG_KHUNG) {
      const ks = khungVong(v.chu, v.tonic, v.thu)
      expect(ks.length, v.id).toBe(v.chu.split(/\s+/).length)
      for (const k of ks) expect(k.not.some((n) => n.muc === 'chinh'), k.ten).toBe(true)
    }
  })
  it('nốt vào ô: nốt cao nhất của cụm bấm đầu; không bấm thì nốt còn giữ', () => {
    expect(notVaoO([{ m: 64, b: 4.0 }, { m: 71, b: 4.05 }, { m: 74, b: 4.6 }], [])).toEqual({ m: 71, giu: false })
    expect(notVaoO([], [55, 67])).toEqual({ m: 67, giu: true })
    expect(notVaoO([], [])).toEqual({ m: null, giu: false })
  })
  it('chấm phách 1: nốt chính đạt; nốt phụ, không màu, không có nốt thì chưa', () => {
    const [cmaj9] = khungVong('Cmaj9', 0, false)
    expect(chamO(cmaj9!, 71).dat).toBe(true) // Si = 7
    expect(chamO(cmaj9!, 74).dat).toBe(true) // Rê = 9, có trong tên
    expect(chamO(cmaj9!, 69).dat).toBe(false) // La = 13, nốt phụ
    expect(mucCua(cmaj9!, 65)).toBe('khong')
    expect(chamO(cmaj9!, 65).dat).toBe(false)
    expect(chamO(cmaj9!, null).dat).toBe(false)
    expect(chamO(cmaj9!, 67, true).chu).toContain('nốt chung')
  })
})
