import { describe, expect, it } from 'vitest'
import { getStyle } from '../../reharm/style/styleLibrary'
import { TEACHERS } from '../teachers'
import { BEAT_NEN, nenBeat, nguonNenBeat, vongBeat, vongQuyTacBeat, type BeatNen } from '../hocSolo/beatNen'
import { chonCauSsa, chonCauThayChong } from '../hocSolo/loiSsa'
import { MAN_KHUNG } from '../hocSolo/mauKhung'
import { manThay } from '../hocSolo/thayNhac'

const theo = (id: string) => BEAT_NEN.find((b) => b.id === id)!
const cho = (b: BeatNen, m: number) => b.o.filter((x) => x.m === m).map((x) => x.phach).sort((a, c) => a - c)

describe('nền beat (người dùng 15/10/2026: "backing track ko cần chơi giai điệu nhiều mà chỉ có beat")', () => {
  const lofi = theo('lofi-4-4')

  it('lo-fi 4/4 đúng khuôn đo từ video: kick phách 1 · cuối phách 2 · phách 3; snare phách 2 · 4; hi-hat đều 8 móc đơn', () => {
    expect(cho(lofi, 36)).toEqual([0, 1.75, 2])
    expect(cho(lofi, 38)).toEqual([1, 3])
    expect(cho(lofi, 42)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
    // Kick cuối phách 2 là tiếng mạnh nhất của dải kick (độ vọt 9/9).
    expect(lofi.o.find((x) => x.m === 36 && x.phach === 1.75)!.luc).toBe(Math.max(...lofi.o.filter((x) => x.m === 36).map((x) => x.luc)))
  })

  it('mọi nền: tiếng nằm trong chu kỳ, lực 1–127, chu kỳ là bội của ô, kick ở phách 1; nút ♩ có nhịp mặc định', () => {
    for (const b of BEAT_NEN) {
      expect(b.o.every((x) => x.luc >= 1 && x.luc <= 127 && x.phach >= 0 && x.phach < b.chuKy), b.id).toBe(true)
      expect(b.chuKy % b.phachO, b.id).toBe(0)
      expect(cho(b, 36)[0], b.id).toBe(0)
      expect(b.nhipChon, b.id).toContain(b.nhipMacDinh)
      expect(nenBeat(b), b.id).toHaveLength(b.o.length)
      expect(nenBeat(b).every((h) => h.trong), b.id).toBe(true)
    }
  })

  it('nền theo điệu (người dùng 16/10/2026): mỗi điệu của Cà Pháo · Linh Nhi · Blues có một nền, ở đúng tab thầy; Lối SSA có lo-fi + điệu Cà Pháo', () => {
    const NEN_DIEU: Readonly<Record<string, string>> = {
      'ca-phao-ballad-cu-di': 'cp-ballad-cu-di',
      'ca-phao-ballad-de-em-roi-xa': 'cp-ballad-de-em',
      'ca-phao-ballad-co-em-cho': 'cp-ballad-co-em-cho',
      'ca-phao-bossa-improved': 'cp-bossa',
      'slow-rock-la-thu-hai-tay': 'ln-slow-rock',
      twist: 'blues-twist',
      'blue-sun': 'blues-slow-blues',
    }
    for (const t of TEACHERS.filter((x) => x.id !== 'tuan'))
      for (const id of t.styleIds) {
        const b = theo(NEN_DIEU[id]!)
        expect(b.bo, id).toContain(t.id)
        // Nhịp, số phách mỗi ô, nhịp độ gốc theo điệu của app.
        expect(b.nhip, id).toBe(getStyle(id)!.timeSignature)
        expect(b.phachO, id).toBe(getStyle(id)!.beatsPerMeasure)
        expect(b.bpm, id).toBe(getStyle(id)!.bpm)
      }
    expect(BEAT_NEN.filter((b) => b.bo.includes('ssa')).map((b) => b.id)).toEqual(['lofi-4-4', 'cp-ballad-cu-di', 'cp-ballad-de-em', 'cp-ballad-co-em-cho', 'cp-bossa'])
    expect(BEAT_NEN.filter((b) => b.bo.includes('quy-tac-chong')).map((b) => b.id)).toEqual(['lofi-4-4'])
  })

  it('khung trống theo khung bùm – chát của điệu', () => {
    // Bossa: kick theo 5 bùm, gõ vành theo 6 chát (11 tiếng của điệu đã duyệt 13/9/2026).
    const bossa = theo('cp-bossa')
    expect(cho(bossa, 36)).toEqual([0, 1.5, 2, 4, 5.5])
    expect(cho(bossa, 37)).toEqual([1, 2.5, 3.5, 4.5, 6, 7])
    // Slow Rock · Slow Blues (6/8, móc đơn): bùm tiếng 1, chát tiếng 4; Slow Blues thêm bass dẫn tiếng 6.
    expect(cho(theo('ln-slow-rock'), 36)).toEqual([0])
    expect(cho(theo('ln-slow-rock'), 38)).toEqual([3])
    expect(cho(theo('blues-slow-blues'), 36)).toEqual([0, 5])
    // Twist: khung đo từ trống video — Bùm₁ chát₂ chát₂& Bùm₃ chát₄, swing 2:1.
    expect(cho(theo('blues-twist'), 36)).toEqual([0, 2])
    expect(cho(theo('blues-twist'), 38)).toEqual([1, 5 / 3, 3])
  })

  it('nền hai ô xoay đúng sau lượt đếm vào: lượt 1 mở bằng ô 2 của trống, lượt 2 bằng ô 1', () => {
    const deEm = theo('cp-ballad-de-em')
    const nen = nenBeat(deEm)
    const nguon = nguonNenBeat(nen, deEm.phachO, deEm.chuKy)
    const dau = nguon(0)
    // Lượt đầu: 4 tiếng hi-hat đếm vào (phách 0–3) rồi ô 1 của trống ở phách 4–7.
    expect(dau.filter((h) => h.startBeat < 4).map((h) => h.notes[0])).toEqual([42, 42, 42, 42])
    expect(dau.filter((h) => h.startBeat >= 4 && h.notes[0] === 36).map((h) => h.startBeat)).toEqual([4, 5.75, 7])
    // Lượt sau: ô 2 trước (kick 1 · 1e · 1a), rồi ô 1 (kick 1 · 2a · 4).
    const sau = nguon(1)
    expect(sau.filter((h) => h.notes[0] === 36).map((h) => h.startBeat)).toEqual([0, 0.25, 0.75, 4, 5.75, 7])
    // Nền một ô: lượt sau giữ nguyên.
    const r = theo('ln-slow-rock')
    expect(nguonNenBeat(nenBeat(r), r.phachO, r.chuKy)(1).map((h) => h.startBeat)).toEqual(nenBeat(r).map((h) => h.startBeat))
  })

  it('vòng trên nền beat: màn quy tắc · Lối SSA · ba thầy — đủ hợp âm, mỗi hợp âm N ô, không lặp hợp âm vừa rồi, đếm vào một ô', () => {
    MAN_KHUNG.forEach((m, mi) => {
      const v = vongQuyTacBeat(mi, [0, 5, 7], lofi, 2, 20)
      expect(v.cau).toHaveLength(20)
      expect(v.nhip.every((x) => x === 8)).toBe(true)
      if (m.buoc.length >= 2) expect(v.cau.every((c, i) => i === 0 || c.id !== v.cau[i - 1]!.id)).toBe(true)
      expect(v.chuKyNen).toBe(4)
      expect(v.demVao).toBe(4)
      expect(v.demTrong).toBe(true)
    })
    const ssa = vongBeat((truoc) => chonCauSsa(0, [0], new Map(), truoc), 'Lối SSA', theo('cp-bossa'), 2, 20)
    expect(ssa.cau).toHaveLength(20)
    expect(ssa.chuKyNen).toBe(8)
    expect(ssa.demVao).toBe(4)
    for (const [thay, beat] of [
      ['ca-phao', 'cp-ballad-cu-di'],
      ['linh-nhi', 'ln-slow-rock'],
      ['blues', 'blues-slow-blues'],
    ] as const) {
      const b = theo(beat)
      manThay(thay).forEach((_, mi) => {
        const v = vongBeat((truoc) => chonCauThayChong(thay, mi, [0], new Map(), truoc), thay, b, b.oMacDinh, 12)
        expect(v.cau.every((c) => c.ssa.loai === 'thay'), `${thay} ${mi}`).toBe(true)
        expect(v.nhip.every((x) => x === b.phachO * b.oMacDinh)).toBe(true)
      })
    }
  })
})
