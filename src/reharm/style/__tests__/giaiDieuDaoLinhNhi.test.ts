import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { TUYEN_DAO } from '../tuyenDaoLinhNhi'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  ĐOẠN DẠO LINH NHI — GHÉP MẢNH TỪ NHỮNG Ô NHỊP CÓ THẬT.

  Bốn bản trước đều hỏng theo cùng một kiểu: rút ra luật rồi sinh nốt theo luật, hoặc
  dán nguyên một câu lên bài mà không đếm xỉa vòng hoà thanh. Bản này chọn cho mỗi ô
  của bài một ô nhịp CÓ THẬT trong bảy câu dạo, theo bậc hợp âm và theo phép nối giọng.

  Ba chốt chặn của file này:

  1. GHÉP NGƯỢC — ghép vào đúng vòng hoà thanh của một bản ký âm thì phải ra lại đúng
     từng nốt câu gốc.
  2. MỌI NỐT ĐỀU THẬT — không có nốt nào do luật sinh ra. Kiểm bằng cách đối chiếu
     ngược từng ô ra bảng.
  3. TRƯỞNG RA TRƯỞNG, THỨ RA THỨ — ô của bài trưởng không bao giờ lọt vào bài thứ.
*/

const N = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const ten = (n: number) => `${N[n % 12]}${Math.floor(n / 12) - 1}`

const chay = (chordText: string, tonic: number, minor: boolean, take = 0) =>
  giaiDieuDaoLinhNhi({
    left: [],
    chords: parseChordInput(chordText).chords,
    beatsPerChord: 4,
    barBeats: 4,
    range: { low: 57, high: 95 },
    tonic: tonic as PitchClass,
    minor,
    take,
  })

const oCua = (ev: ReturnType<typeof chay>, bar: number) =>
  ev.filter((e) => Math.floor(e.startBeat / 4) === bar - 1).map((e) => ten(e.notes[0]!))

const DUNG_XA = 'Dm | C | Bb | F | Gm | Dm | A7 | Dm | Dm'
const MUA_XUAN = 'G | Em | Bm | D | G | Bm | G | D'

/**
 * Ô này có phải một ô nhịp có thật của một câu dạo cùng thứ/trưởng không?
 *
 * Chuyển giọng dịch đều mọi cao độ, và phép gập quãng tám không đổi tên nốt — nên hiệu
 * `tên nốt ra − tên nốt bảng` phải là MỘT hằng số cho cả ô. Chỗ duy nhất được lệch là
 * nốt bị nâng nốt cảm bậc V, và nó lệch đúng `+1`.
 *
 * Lần đầu viết bài kiểm này tôi cho "lệch tối đa một nốt", tưởng phép nâng chỉ chạm một
 * nốt mỗi ô. Sai: một ô có thể chứa bậc ♭7 nhiều lần và cả mấy lần đều bị nâng.
 */
const laODuocChep = (
  moc: readonly { at: number; pc: number }[],
  thu: boolean,
  phach: number,
) =>
  TUYEN_DAO.filter((t) => t.thu === thu && t.phach === phach).some((t) =>
    t.o.some((o) => {
      if (o.n.length !== moc.length || o.n.length === 0) return false
      if (o.n.some((n, i) => Math.abs(n[0] - moc[i]!.at) > 1e-6)) return false
      const lech = o.n.map((n, i) => ((((moc[i]!.pc - n[1]) % 12) + 12) % 12))
      const dem = new Map<number, number>()
      for (const d of lech) dem.set(d, (dem.get(d) ?? 0) + 1)
      const nen = [...dem.entries()].sort((a, b) => b[1] - a[1])[0]![0]
      return lech.every((d) => d === nen || d === (nen + 1) % 12)
    }),
  )

const theoO = (ev: ReturnType<typeof chay>, barBeats = 4) => {
  const m = new Map<number, { at: number; pc: number }[]>()
  for (const e of ev) {
    const o = Math.floor(e.startBeat / barBeats)
    const v = m.get(o) ?? []
    v.push({ at: e.startBeat - o * barBeats, pc: ((e.notes[0]! % 12) + 12) % 12 })
    m.set(o, v)
  }
  return [...m.values()]
}

describe('đoạn dạo Linh Nhi — ghép mảnh', () => {
  it('bảng có bảy câu, chia đúng bốn thứ ba trưởng', () => {
    /*
      Biển Tình ĐÃ TỪNG bị đọc nhầm là Si thứ vì đoạn dạo mở trên Bm. Đếm cả bài thì
      `D=19` nhiều nhất, `Bm=13`, và bài đóng trên D — vòng D-Bm-F#m-Em-A-D là
      I-vi-iii-ii-V-I. Rê TRƯỞNG, đoạn dạo chỉ mở trên bậc vi.

      Đọc giọng theo hợp âm MỞ ĐẦU đoạn dạo là cái bẫy; phải đếm cả bài và xem bài đóng
      ở đâu.
    */
    expect(TUYEN_DAO).toHaveLength(7)
    expect(TUYEN_DAO.filter((t) => t.thu)).toHaveLength(4)
    expect(TUYEN_DAO.filter((t) => !t.thu)).toHaveLength(3)
    expect(TUYEN_DAO.find((t) => t.id === 'bien-tinh')!.thu).toBe(false)
    for (const t of TUYEN_DAO) {
      expect(t.o.length).toBeGreaterThanOrEqual(6)
      /*
        Mật độ phải nằm quanh 5-9 nốt một ô. Có lúc đã thử giữ HẾT nốt của khuông tay
        phải cho "chính xác hơn": ô 1 Đừng Xa phình lên 20 nốt, vì `A4+D5+E5+F5` là nắm
        hợp âm chứ không phải giai điệu. Giai điệu là nốt trên cùng mỗi mốc gõ.
      */
      const tong = t.o.reduce((a, o) => a + o.n.length, 0)
      expect(tong / t.o.length).toBeLessThan(10)
    }
  })

  it('GHÉP NGƯỢC về vòng hoà thanh gốc thì ra lại đúng câu của bản ký âm', () => {
    const ev = chay(DUNG_XA, 2, true, 0)
    expect(oCua(ev, 1)).toEqual(['F5', 'F5', 'F4', 'F5', 'F5', 'D4', 'G5', 'A5'])
    expect(oCua(ev, 2)).toEqual(['E5', 'C5', 'E4', 'D5', 'Eb5', 'E5', 'Bb4'])
    expect(oCua(ev, 3)).toEqual(['D5', 'D5', 'D4', 'D5', 'D5', 'E5', 'F5'])
    expect(oCua(ev, 4)).toEqual(['C5', 'Bb4', 'A4', 'Bb4', 'C5', 'G4', 'A4'])
    expect(oCua(ev, 5)).toEqual(['Bb4', 'Bb4', 'Bb4', 'Bb4', 'A4', 'Bb4', 'A4'])
    expect(oCua(ev, 6)).toEqual(['F5', 'E5', 'D5', 'A4', 'E5', 'F5'])
  })

  it('MỌI NỐT ĐỀU THẬT — không nốt nào do luật sinh ra', () => {
    /* Đây là điều kiện cốt lõi. Sinh nốt theo luật đã bị người dùng bác bốn lần. */
    for (const [txt, tonic, minor] of [
      [DUNG_XA, 2, true],
      ['Am | Dm | G | C | F | Bdim | E7 | Am', 9, true],
      ['Bm | G | A | F#m | Bm | Em | F#7 | Bm', 11, true],
      [MUA_XUAN, 7, false],
      ['C | Am | Dm | G | C | F | G7 | C', 0, false],
    ] as const) {
      for (let take = 0; take < 4; take += 1) {
        for (const moc of theoO(chay(txt, tonic, minor, take))) {
          expect(laODuocChep(moc, minor, 4), `${txt} / lượt ${take}`).toBe(true)
        }
      }
    }
  })

  it('TRƯỞNG RA TRƯỞNG, THỨ RA THỨ', () => {
    /*
      Giọng đã được xác định ở bước tái hoà thanh và `ScaleType` chỉ có `major | minor`,
      nên không có ngả thứ ba. Kiểm bằng cách đòi mỗi ô phải chép được từ ĐÚNG nhóm
      cùng thứ/trưởng — và không chép được từ nhóm kia.
    */
    for (const moc of theoO(chay(MUA_XUAN, 7, false))) {
      expect(laODuocChep(moc, false, 4)).toBe(true)
      expect(laODuocChep(moc, true, 4)).toBe(false)
    }
    for (const moc of theoO(chay(DUNG_XA, 2, true))) {
      expect(laODuocChep(moc, true, 4)).toBe(true)
      expect(laODuocChep(moc, false, 4)).toBe(false)
    }
  })

  it('bài chưa dò ra giọng vẫn nhận đúng thứ/trưởng từ hợp âm đầu', () => {
    const khong = giaiDieuDaoLinhNhi({
      left: [],
      chords: parseChordInput(DUNG_XA).chords,
      beatsPerChord: 4,
      barBeats: 4,
      range: { low: 57, high: 95 },
      minor: false,
    })
    expect(khong.map((e) => e.notes[0])).toEqual(chay(DUNG_XA, 2, true, 0).map((e) => e.notes[0]))
  })

  it('mọi giọng, mọi lượt đều nằm trong tầm tay phải và không rỗng', () => {
    for (let take = 0; take < 8; take += 1) {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        for (const [txt, minor] of [
          [DUNG_XA, true],
          ['C | Am | Dm | G | C | F | G7 | C', false],
        ] as const) {
          const ev = chay(txt, tonic, minor, take)
          expect(ev.length, `lượt ${take} / chủ âm ${tonic}`).toBeGreaterThan(0)
          for (const e of ev) {
            expect(e.notes[0]!).toBeGreaterThanOrEqual(57)
            expect(e.notes[0]!).toBeLessThanOrEqual(95)
          }
        }
      }
    }
  })

  it('bài 3 phách chỉ ghép ô của bản ký âm 3 phách', () => {
    /* Một Cõi Đi Về là bản 3 phách duy nhất; ghép ô 4 phách vào là lệch phách toàn bộ. */
    const ev = giaiDieuDaoLinhNhi({
      left: [],
      chords: parseChordInput('Gm | Cm | Gm | D7 | Gm | Cm | D7 | Gm').chords,
      beatsPerChord: 3,
      barBeats: 3,
      range: { low: 57, high: 95 },
      tonic: 7 as PitchClass,
      minor: true,
    })
    expect(ev.length).toBeGreaterThan(0)
    for (const moc of theoO(ev, 3)) expect(laODuocChep(moc, true, 3)).toBe(true)
  })

  it('CHƠI LÂU VẪN CÒN ĐỔI — lượt tăng mãi thì phép chọn phải quay vòng', () => {
    /*
      Lỗi đã gặp: luật "lượt thứ N lấy ứng viên hạng N" viết bằng `Math.min(take, n-1)`.
      `playSpin` tăng mãi, nên chơi vài lượt là `take` vượt số ứng viên, mọi ô kẹt ở ô
      hạng chót và ĐỨNG YÊN VĨNH VIỄN. Người dùng nghe ra ngay: "sao mỗi lần phát intro
      giờ không đổi khác nữa."

      Bài kiểm này chạy tới lượt 40 — quá xa mọi ngưỡng kẹp — và đòi hai điều: không
      lượt nào giống hệt lượt liền trước, và tổng số câu khác nhau phải nhiều.
    */
    for (const [txt, tonic, minor] of [
      [DUNG_XA, 2, true],
      ['C | Am | Dm | G | C | F | G7 | C', 0, false],
    ] as const) {
      const van: string[] = []
      for (let take = 0; take < 40; take += 1) {
        van.push(chay(txt, tonic, minor, take).map((e) => `${e.startBeat}:${e.notes[0]}`).join(','))
      }
      for (let i = 1; i < van.length; i += 1) {
        expect(van[i], `${txt} / lượt ${i} giống hệt lượt ${i - 1}`).not.toBe(van[i - 1])
      }
      expect(new Set(van).size, txt).toBeGreaterThan(30)
    }
  })

  it('cùng một lượt thì ra đúng một câu — đổi mới chứ không ngẫu nhiên', () => {
    for (let take = 0; take < 4; take += 1) {
      expect(chay(DUNG_XA, 2, true, take).map((e) => e.notes[0])).toEqual(
        chay(DUNG_XA, 2, true, take).map((e) => e.notes[0]),
      )
    }
  })

  describe('ô chia đôi', () => {
    /* Tám ô, mỗi hợp âm nửa ô — `beatsPerChord: 2`. */
    const chiaDoi = (txt: string) =>
      giaiDieuDaoLinhNhi({
        left: [],
        chords: parseChordInput(txt).chords,
        beatsPerChord: 2,
        barBeats: 4,
        range: { low: 57, high: 95 },
        tonic: 2 as PitchClass,
        minor: true,
        take: 0,
      })
    const van = (txt: string) => chiaDoi(txt).map((e) => `${e.startBeat}:${e.notes[0]}`).join(',')

    it('bảng ghi cả bậc của hợp âm nửa ô sau', () => {
      /*
        Ghi mỗi ô một bậc là mất đúng hợp âm quyết định hướng câu: Đừng Xa ô 7 vào bảng
        thành `II` (E) trong khi nửa sau là `V` (A). Đo bảy đoạn dạo được 6/59 ô chia.
      */
      const chia = TUYEN_DAO.flatMap((t) => t.o).filter((o) => o.bac2 !== null)
      expect(chia).toHaveLength(6)
      for (const o of chia) {
        expect(o.chia).not.toBeNull()
        expect(o.chia!).toBeGreaterThan(0)
        expect(o.bac2).not.toBe(o.bac)
      }
      /* Đừng Xa ô 7: E rồi A — bậc II rồi bậc V của Rê thứ. */
      const dungXa = TUYEN_DAO.find((t) => t.id === 'dung-xa')!.o[6]!
      expect(dungXa.bac).toBe(2)
      expect(dungXa.bac2).toBe(7)
    })

    it('ĐỔI HỢP ÂM NỬA Ô SAU thì giai điệu phải đổi theo', () => {
      /*
        Bản cũ tra thẳng `chords[floor(o * barBeats / beatsPerChord)]`, tức giả định mọi
        hợp âm dài bằng nhau — hợp âm nửa ô sau không bao giờ được đọc. Đo được: đổi
        TOÀN BỘ hợp âm nửa ô sau của một bài 8 ô mà giai điệu ra y hệt, không đổi một nốt.
      */
      const a = 'Dm | Dm | C | C | Bb | Bb | F | F | Gm | Gm | Dm | Dm | A7 | A7 | Dm | Dm'
      const b = 'Dm | Gm | C | Am | Bb | Eb | F | Bdim | Gm | Cm | Dm | Bb | A7 | E7 | Dm | Gm'
      expect(van(a)).not.toBe(van(b))
    })

    it('nốt cảm bậc V vẫn ra khi bậc V nằm ở NỬA Ô SAU', () => {
      /*
        Đừng Xa ô 7 là `E` rồi `A`: bậc V ở nửa sau. Chỉ tra hợp âm đầu ô thì mất sạch
        nốt cảm ở đúng chỗ cần nó nhất.
      */
      const txt = 'Dm | Dm | C | C | Bb | Bb | F | F | Gm | Gm | Dm | Dm | E | A7 | Dm | Dm'
      const o7 = chiaDoi(txt)
        .filter((e) => Math.floor(e.startBeat / 4) === 6)
        .map((e) => ((e.notes[0]! % 12) + 12) % 12)
      /* C# = 1, nốt cảm của Rê thứ. */
      expect(o7).toContain(1)
    })

    it('bài chia đôi vẫn đếm đúng số ô', () => {
      const txt = 'Dm | Gm | C | Am | Bb | Eb | F | Bdim | Gm | Cm | Dm | Bb | A7 | E7 | Dm | Gm'
      const soO = chiaDoi(txt).reduce((m, e) => Math.max(m, Math.floor(e.startBeat / 4) + 1), 0)
      expect(soO).toBe(8)
    })
  })
})
