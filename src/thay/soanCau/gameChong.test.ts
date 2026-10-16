import { describe, expect, it } from 'vitest'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { CONG_THUC } from './chongHopAm'
import { NHOM_DUOI, QUY_TAC_DUOI } from './meoChong'
import { bacDoRo, CHA_CHONG, chonCau, diemCau, DO_RO_DAU, DONG_CHO, doRoGoiY, dungHaiTay, dungTayPhai, MAN, MAN_QUY_TAC, MAU_SLASH, MOC_MAC_DINH, MOC_ROI, soCanCham, taoCau, taoCauQuyTac, taoCauSlash, thoiGianRoi } from './gameChong'
import { chordPitchClasses, getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pcsTong } from './chongHopAm'
import { lopHop } from './slashChong'

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
const mau = (id: string) => MAU_SLASH.find((m) => m.id === id)!
const pc = (x: number) => ((x % 12) + 12) % 12

describe('game Mưa hợp âm — logic', () => {
  it('18 màn: 16 nhóm đuôi đúng thứ tự bảng, màn slash có quy luật riêng, màn trộn cả 32 hợp âm', () => {
    expect(MAN).toHaveLength(18)
    expect(MAN.slice(0, 16).map((m) => [m.ten, m.nhom, m.ids])).toEqual(NHOM_DUOI.map((n) => [n.ten, n.ten, n.ids]))
    expect(MAN[16]!.ids).toEqual(MAU_SLASH.map((m) => `slash:${m.id}`))
    expect(MAN[16]!.meo!.length).toBeGreaterThan(MAU_SLASH.length)
    expect(MAN[17]!.ids).toHaveLength(32)
    expect(MAN[17]!.ids.filter((id) => !id.startsWith('q:')).sort()).toEqual(CONG_THUC.map((c) => c.id).sort())
    expect(MAN[17]!.quyTac).toBe(QUY_TAC_DUOI)
    // mọi hợp âm của mọi màn đều tạo được viên rơi ở cả 12 gốc
    for (const id of MAN[17]!.ids)
      for (let g = 0; g < 12; g++) {
        const c = chonCau([id], [g], new Map(), null, () => 0.4)
        expect([id, g, c.luaChon.length, new Set(c.luaChon.map((l) => l.ten)).size, c.luaChon.some((l) => l.ten === c.dapAnTen)]).toEqual([id, g, 4, 4, true])
      }
  })

  it('câu chồng F♯13♭9: viên ghi tên hai tay + đuôi mang lại nốt nào ở chính gốc ấy (không đếm phím), chấm tay phải theo lớp cao độ', () => {
    const cau = taoCau(ct('13b9'), 6)
    expect([cau.ten, cau.khungTen, cau.goiY, cau.dapAnTen]).toEqual(['F♯13♭9', 'F♯7 + D♯', '♭9 → Sol', 'D♯'])
    expect([cau.loi, cau.nho]).toEqual(['F♯13♭9 = F♯7 + D♯', '♭9 → Sol'])
    expect(cau.meo).toBe('Nốt của đuôi ♭9: Sol — nằm ở tay phải D♯.')
    expect(taoCau(ct('maj7'), 9).goiY).toBe('maj7 → Sol♯')
    expect(taoCau(ct('m11b5'), 0).meo).toBe('Nốt của đuôi Giảm: Mi♭ (tay phải E♭sus2) + Sol♭ (tay trái Đô – Sol♭).')
    expect(`${cau.khungTen} ${cau.goiY} ${cau.meo}`).not.toMatch(/phím|bậc|gam/)
    expect(cau.nhan).toEqual({ trai: 'F♯7', traiPhu: 'Fa♯ – La♯ – Mi', phai: 'D♯', phaiPhu: 'Rê♯ – Sol – La♯' })
    expect(dungTayPhai([63, 67, 70], cau)).toBe(true) // Mi♭ Sol Si♭ = D♯ trưởng, thế nào cũng được
    expect(dungTayPhai([...cau.trai, ...cau.phai], cau)).toBe(true)
    expect(dungTayPhai([63, 66, 70], cau)).toBe(false) // D♯ thứ — là F♯13
    expect(soCanCham(cau, false)).toBe(3)
  })

  it('bốn nút chọn tên mang nốt: nút đúng là chính đáp án; nút nhiễu giữ tay trái, tay phải là hợp âm khác đặt ngay trên', () => {
    for (const id of ['13b9', 'maj7', '69', 'm11b5']) {
      const cau = taoCau(ct(id), 2)
      const ten = cau.luaChon.map((l) => l.ten)
      expect([id, ten.length, new Set(ten).size]).toEqual([id, 4, 4])
      const dung = cau.luaChon.find((l) => l.ten === cau.dapAnTen)!
      expect([dung.trai, dung.phai]).toEqual([cau.trai, cau.phai])
      for (const l of cau.luaChon.filter((x) => x !== dung)) {
        expect([id, l.ten, l.trai]).toEqual([id, l.ten, cau.trai])
        expect([id, l.ten, Math.min(...l.phai) > Math.max(...l.trai), dungTayPhai(l.phai, cau)]).toEqual([id, l.ten, true, false])
        expect(l.nhan.phai).toBe(l.ten)
      }
    }
  })

  it('chùm nốt rời gọi bằng các nốt, không ghi bậc', () => {
    const cau = taoCau(ct('add9'), 4)
    expect([cau.khungTen, cau.goiY, cau.dapAnTen, cau.nhan.phai]).toEqual(['Mi – Si + Fa♯ – Sol♯ – Si', 'add9 → Fa♯', 'Fa♯ – Sol♯ – Si', 'chùm'])
    expect(cau.luaChon.map((l) => l.ten)).toContain('Fa♯ – Sol♯ – Si')
    expect(cau.meo).toBe('Nốt của đuôi add9: Fa♯ — nằm ở tay phải Fa♯ – Sol♯ – Si.')
  })

  it('hợp âm ba cơ bản: tay trái gốc, tay phải cả hợp âm; bốn nút là các hợp âm ba cùng gốc', () => {
    const c = chonCau(['q:min'], [9], new Map(), null, () => 0.4)
    expect([c.id, c.ten, c.khungTen, c.goiY, c.dapAnTen, c.meo]).toEqual(['q:min', 'Am', 'La + Am', 'Thứ → Đô', 'Am', 'Nốt của đuôi Thứ: Đô — nằm ở tay phải Am.'])
    expect(dungTayPhai([57, 60, 64], c)).toBe(true) // La Đô Mi
    expect(dungTayPhai([57, 61, 64], c)).toBe(false) // A trưởng
    expect(c.luaChon.every((l) => l.trai.join() === c.trai.join() && Math.min(...l.phai) > Math.max(...l.trai))).toBe(true)
    const sus = (q: string) => chonCau([`q:${q}`], [0], new Map(), null, () => 0.4).goiY
    expect([sus('sus2'), sus('sus4'), sus('aug'), sus('dim')]).toEqual(['Treo → Rê', 'Treo → Fa', 'Tăng → Sol♯', 'Giảm → Mi♭ + Sol♭'])
  })

  it('hai tay: đủ nốt và nốt thấp nhất là gốc', () => {
    const c = taoCau(ct('13b9'), 0)
    expect(dungHaiTay([48, 52, 58, 69, 73, 76], c)).toBe(true)
    expect(dungHaiTay([52, 58, 60, 69, 73, 76], c)).toBe(false)
  })

  it('câu slash: tên và nghĩa đúng quy luật; bass thế đảo ghi theo chữ của hợp âm (E/G♯ chứ không E/A♭)', () => {
    const t = (id: string, y: number) => {
      const c = taoCauSlash(mau(id), y, () => 0.3)
      return [c.ten, c.dapAnTen]
    }
    expect(t('maj7', 0)).toEqual(['Em/C', 'Cmaj7'])
    expect(t('m7', 0)).toEqual(['E♭/C', 'Cm7'])
    expect(t('7', 0)).toEqual(['Edim/C', 'C7'])
    expect(t('9sus4', 7)).toEqual(['F/G', 'G9sus4'])
    expect(t('maj9', 0)).toEqual(['G/C', 'Cmaj9 (thiếu 3)'])
    expect(t('dao1', 4)).toEqual(['C/E', 'C đảo 1'])
    expect(t('dao2', 7)).toEqual(['C/G', 'C đảo 2'])
    expect(t('dao1m', 0)).toEqual(['Am/C', 'Am đảo 1'])
    expect(t('dao1', 8)).toEqual(['E/G♯', 'E đảo 1'])
    const c = taoCauSlash(mau('maj7'), 0, () => 0.3)
    expect([c.khungTen, c.goiY, c.nho, c.nhan]).toEqual([
      'Đô + Em',
      'bass + thứ = Cmaj7',
      'bass + thứ = Cmaj7',
      { trai: 'Đô', traiPhu: 'bass', phai: 'Em', phaiPhu: 'Mi – Sol – Si' },
    ])
    expect(MAU_SLASH.map((m) => m.luat).join(' ')).not.toMatch(/phím/)
  })

  it('mọi mẫu slash ở cả 12 bass: thế đảo có bass trong hợp âm; bass lạ khớp nốt hợp âm màu', () => {
    const MAU_CHAT: Record<string, string> = { maj7: 'maj7', m7: 'm7', '7': '7', '9sus4': '9sus4', maj9: 'maj9' }
    for (const m of MAU_SLASH)
      for (let y = 0; y < 12; y++) {
        const x = lopHop(y + m.cach, m.chat)
        if (m.loai === 'dao') expect([m.id, y, x.includes(y)]).toEqual([m.id, y, true])
        else {
          expect([m.id, y, x.includes(y)]).toEqual([m.id, y, false])
          const mauPcs = lopHop(y, findQualityBySymbol(MAU_CHAT[m.id]!)!.symbol)
          expect([m.id, y, [...x, y].every((p) => mauPcs.includes(pc(p)))]).toEqual([m.id, y, true])
        }
        const c = taoCauSlash(m, y)
        expect([m.id, y, pc(c.trai[0]!), dungHaiTay([...c.trai, ...c.phai], c)]).toEqual([m.id, y, y, true])
      }
  })

  it('câu slash bấm hai tay: bass dưới, hợp âm trên; sai bass là sai; bốn nghĩa mang nốt riêng', () => {
    const c = taoCauSlash(mau('9sus4'), 7, () => 0.3)
    expect(c.haiTayBuoc).toBe(true)
    expect(dungHaiTay([...c.trai, ...c.phai], c)).toBe(true)
    expect(dungHaiTay([43, 65, 69, 72], c)).toBe(true) // Sol2 + Fa – La – Đô
    expect(dungHaiTay([53, 55, 69, 72], c)).toBe(false) // nốt thấp nhất Fa, không phải Sol
    expect(soCanCham(c, true)).toBe(4)
    for (const m of MAU_SLASH) {
      const k = taoCauSlash(m, 2, () => 0.6)
      const ten = k.luaChon.map((l) => l.ten)
      expect([m.id, ten.length, new Set(ten).size, ten.includes(k.dapAnTen)]).toEqual([m.id, 4, 4, true])
      const dung = k.luaChon.find((l) => l.ten === k.dapAnTen)!
      expect([m.id, dung.trai, dung.phai]).toEqual([m.id, k.trai, k.phai])
    }
    // C/E: nút "C thế gốc" bấm bass Đô, "C đảo 2" bấm bass Sol — cùng hợp âm C ở tay phải
    const ce = taoCauSlash(mau('dao1'), 4, () => 0.3)
    const bass = (ten: string) => pc(ce.luaChon.find((l) => l.ten === ten)!.trai[0]!)
    expect([bass('C đảo 1'), bass('C thế gốc'), bass('C đảo 2')]).toEqual([4, 0, 7])
  })

  it('chọn câu: câu vừa sai nặng hơn, không lặp câu vừa rồi; chọn được cả câu slash', () => {
    const sai = new Map([['m9', 10]])
    expect(chonCau(['maj9', 'm9', '9'], [0], sai, null, () => 0.5).id).toBe('m9') // nặng 1 · 21 · 1
    expect(chonCau(['maj9', 'm9'], [0], new Map(), 'maj9', () => 0.1).id).toBe('m9')
    expect(chonCau(['slash:9sus4'], [7], new Map(), null, () => 0.2).ten).toBe('F/G')
  })

  it('điểm, mốc tốc độ, gợi ý hiện ngay từ đầu — mờ rồi rõ dần tới vạch chờ', () => {
    expect([diemCau(0), diemCau(4), diemCau(5), diemCau(12)]).toEqual([10, 10, 20, 30])
    expect(MOC_ROI).toContain(MOC_MAC_DINH.meo)
    expect(MOC_ROI).toContain(MOC_MAC_DINH.thi)
    expect([thoiGianRoi(14), thoiGianRoi(10, true), thoiGianRoi(30)]).toEqual([14000, 12000, 30000])
    expect([DO_RO_DAU, DONG_CHO]).toEqual([0.2, 0.9])
    expect([0, 0.45, 0.9, 1].map((p) => Math.round(doRoGoiY(p) * 100) / 100)).toEqual([0.2, 0.6, 1, 1]) // hiện ngay khi viên sinh ra, rõ hẳn ở vạch chờ
    const tang = Array.from({ length: 10 }, (_, i) => doRoGoiY(i / 10))
    expect(tang.every((x, i) => i === 0 || x >= tang[i - 1]!)).toBe(true)
    expect([bacDoRo(0), bacDoRo(0.9)]).toEqual([4, 20])
  })
})

describe('màn quy tắc nhóm đuôi (thử) — học hợp âm cha rồi suy ra con', () => {
  const lopId = (id: string, g = 0) => (id.startsWith('q:') ? chordPitchClasses(g, getChordQuality(id.slice(2))!) : pcsTong(ct(id), g)).map(pc)
  const ids = MAN_QUY_TAC.flatMap((m) => m.ids.map((x) => x.slice(3))).slice(0, 32)

  it('7 màn, đủ 32 hợp âm như màn trộn cũ; cha luôn học trước con; con khác cha 1–3 nốt', () => {
    expect(MAN_QUY_TAC).toHaveLength(7)
    expect([...ids].sort()).toEqual([...MAN[17]!.ids].sort())
    expect(MAN_QUY_TAC[6]!.ids.map((x) => x.slice(3))).toEqual(ids)
    expect(ids.filter((id) => !CHA_CHONG[id])).toEqual(['q:maj'])
    for (const id of ids.filter((x) => CHA_CHONG[x])) {
      expect([id, ids.indexOf(CHA_CHONG[id]!) < ids.indexOf(id)]).toEqual([id, true])
      const a = new Set(lopId(CHA_CHONG[id]!))
      const c = new Set(lopId(id))
      const khac = [...a].filter((x) => !c.has(x)).length + [...c].filter((x) => !a.has(x)).length
      expect([id, khac >= 1 && khac <= 3]).toEqual([id, true])
    }
  })

  it('viên ghi cha + thế chồng của cha + thay đổi; mẹo nói tay nào đổi — ở gốc Đô và gốc La', () => {
    const c7 = taoCauQuyTac('7', 0, () => 0.3)
    expect([c7.id, c7.ten, c7.khungTen, c7.goiY, c7.dapAnTen]).toEqual(['qt:7', 'C7', 'từ Cmaj7: Đô + Em', 'Si → Si♭', 'Edim'])
    expect(c7.meo).toBe('C7 = Đô + Edim. Từ Cmaj7 (Đô + Em): Si → Si♭ — tay trái giữ Đô, tay phải Em → Edim.')
    expect(c7.loi).toBe('C7 = Đô + Edim — từ Cmaj7: Si → Si♭')
    expect(taoCauQuyTac('maj7', 9).goiY).toBe('thêm Sol♯')
    expect(taoCauQuyTac('7', 9).goiY).toBe('Sol♯ → Sol')
    expect(taoCauQuyTac('q:sus4', 0).goiY).toBe('Mi → Fa')
    expect(taoCauQuyTac('dim7', 0).goiY).toBe('Si♭ → La')
    expect(taoCauQuyTac('9sus4', 0).meo).toBe('C9sus4 = Đô + B♭. Từ C9 (Đô – Mi + Gm): bỏ Mi · bỏ Sol · thêm Fa — tay trái Đô – Mi → Đô, tay phải Gm → B♭.')
    expect(taoCauQuyTac('13', 0).meo).toContain('tay phải giữ Am')
    const goc = taoCauQuyTac('q:maj', 0)
    expect([goc.goiY, goc.loi]).toEqual(['gốc của cây — thuộc trước', 'C = Đô + C — gốc của cây'])
    expect(chonCau(['qt:m7'], [0], new Map(), null, () => 0.4).khungTen).toBe('từ C7: Đô + Edim')
  })

  it('bốn nút ở mọi gốc: đáp án như màn nhóm đuôi, luôn có tay phải của cha (khi khác đáp án); nút nhiễu sai', () => {
    for (const id of ids)
      for (let g = 0; g < 12; g++) {
        const c = taoCauQuyTac(id, g, () => 0.45)
        const ten = c.luaChon.map((l) => l.ten)
        expect([id, g, ten.length, new Set(ten).size, ten.includes(c.dapAnTen)]).toEqual([id, g, 4, 4, true])
        const cha = CHA_CHONG[id] ? taoCauQuyTac(CHA_CHONG[id]!, g, () => 0.45).dapAnTen : c.dapAnTen
        expect([id, g, ten.includes(cha)]).toEqual([id, g, true])
        for (const l of c.luaChon.filter((x) => x.ten !== c.dapAnTen)) expect([id, g, l.ten, dungTayPhai(l.phai, c)]).toEqual([id, g, l.ten, false])
        expect([id, g, dungTayPhai(c.phai, c)]).toEqual([id, g, true])
      }
  })
})
