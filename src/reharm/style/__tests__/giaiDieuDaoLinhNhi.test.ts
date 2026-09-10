import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi, vonO } from '../giaiDieuDaoLinhNhi'
import { TUYEN_SOLO } from '../tuyenSolo'
import { SOLO_RANGE } from '../../fillSoloGenerator/soloGenerator'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { minorIntroSourceForTake } from '../minorSoloSource'

/*
  ĐOẠN DẠO LINH NHI — GHÉP MẢNH TỪ NHỮNG Ô NHỊP CÓ THẬT.

  Bốn bản trước đều hỏng theo cùng một kiểu: rút ra luật rồi soạn nốt theo luật, hoặc
  dán nguyên một câu lên bài mà không đếm xỉa vòng hoà thanh. Bản này chọn cho mỗi ô
  của bài một ô nhịp CÓ THẬT trong bảy câu dạo, theo bậc hợp âm và theo phép nối giọng.

  Ba chốt chặn của file này:

  1. GHÉP NGƯỢC — ghép vào đúng vòng hoà thanh của một bản ký âm thì phải ra lại đúng
     từng nốt câu gốc.
  2. MỌI NỐT ĐỀU THẬT — không có nốt nào do luật sinh ra. Kiểm bằng cách đối chiếu
     ngược từng ô ra bảng.
  3. TRƯỞNG RA TRƯỞNG, THỨ RA THỨ — ô của bài trưởng không bao giờ lọt vào bài thứ.
*/

/*
  BẢNG CŨ `tuyenDaoLinhNhi.ts` ĐÃ XOÁ — vốn ô nay lấy từ `tuyenSolo.ts`, sinh lại bằng
  `tools/tuyen_o.py`. Bảng cũ chỉ khớp `data/sheet-solos` 118/276 nốt, bảng mới 285/285.
*/
const TUYEN_DAO = TUYEN_SOLO.filter(
  (t) => t.thay === 'linh-nhi' && t.doan === 'intro',
)

/**
 * VỐN Ô THẬT SỰ của bộ ghép — cả ba đoạn, không riêng đoạn dạo.
 *
 * Lấy riêng đoạn dạo thì có bậc chỉ còn MỘT ô: giọng trưởng bậc IV có đúng một ô, và ô
 * ấy mang sẵn quãng ba tăng, nên mọi bài giọng trưởng đều chói ở chỗ ấy. Gộp ba đoạn
 * thành 8 ô, 6 trong đó sạch. Xem `vonO()` trong `giaiDieuDaoLinhNhi.ts`.
 */
const VON = TUYEN_SOLO.filter((t) => t.thay === 'linh-nhi')

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
  VON.filter((t) => t.thu === thu && t.phach === phach).some((t) =>
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
  it('bảng có tám câu dạo, năm thứ ba trưởng', () => {
    /*
      Biển Tình ĐÃ TỪNG bị đọc nhầm là Si thứ vì đoạn dạo mở trên Bm. Đếm cả bài thì
      `D=19` nhiều nhất, `Bm=13`, và bài đóng trên D — vòng D-Bm-F#m-Em-A-D là
      I-vi-iii-ii-V-I. Rê TRƯỞNG, đoạn dạo chỉ mở trên bậc vi.

      Đọc giọng theo hợp âm MỞ ĐẦU đoạn dạo là cái bẫy; phải đếm cả bài và xem bài đóng
      ở đâu.
    */
    expect(TUYEN_DAO).toHaveLength(8)
    expect(TUYEN_DAO.filter((t) => t.thu)).toHaveLength(5)
    expect(TUYEN_DAO.filter((t) => !t.thu)).toHaveLength(3)
    expect(TUYEN_DAO.find((t) => t.id === 'bien-tinh-intro')!.thu).toBe(false)
    for (const t of TUYEN_DAO) {
      expect(t.o.length).toBeGreaterThanOrEqual(5)
      /*
        Mật độ phải nằm quanh 5-9 nốt một ô. Có lúc đã thử giữ HẾT nốt của khuông tay
        phải cho "chính xác hơn": ô 1 Đừng Xa phình lên 20 nốt, vì `A4+D5+E5+F5` là nắm
        hợp âm chứ không phải giai điệu. Giai điệu là nốt trên cùng mỗi mốc gõ.
      */
      const tong = t.o.reduce((a, o) => a + o.n.length, 0)
      expect(tong / t.o.length).toBeLessThan(12)
    }
  })

  /** Tên nốt bỏ quãng tám — `F5` và `F6` cùng thành `F`. */
  const khongOct = (v: readonly string[]) => v.map((x) => x.replace(/-?\d+$/, ''))

  it('GHÉP NGƯỢC về vòng hoà thanh gốc thì ra lại đúng câu của bản ký âm', () => {
    /*
      SỐ ĐÃ ĐỔI khi bỏ bảng cũ `tuyenDaoLinhNhi.ts` sang `tuyenSolo.ts`.

      Không phải nới test cho qua: sáu ô dưới đây được kiểm là **trùng khít từng nốt với
      chính bảng** (`dung-xa-em-dem-nay-intro`), mà bảng ấy khớp `data/sheet-solos` của
      PianoBrain 285/285 nốt. Bảng cũ khớp 118/276 — số cũ ở đây là số SAI được đóng
      băng thành kỳ vọng.
    */
    /*
      SO TÊN NỐT, BỎ QUÃNG TÁM. Phép căn quãng tám nay chạy theo TỪNG Ô để chỗ nối hai ô
      không thành cú nhảy không ai soạn ra — nên ghép ngược ra đúng những nốt ấy nhưng có
      thể ở quãng tám khác. Người dùng cũng đã chốt **cấm chép nguyên câu intro**, nên
      đòi trùng khít cả quãng tám là đòi đúng thứ vừa bị cấm.

      Ràng buộc "mọi nốt đều thật" không mất: bài kiểm ngay dưới ghim từng ô về một ô CÓ
      THẬT trong bảng, chỉ cho lệch một hằng số dịch giọng cho cả ô.
    */
    const ev = chay(DUNG_XA, 2, true, 0)
    expect(khongOct(oCua(ev, 1))).toEqual(['A', 'F', 'F', 'D', 'F', 'F', 'E', 'G'])
    expect(khongOct(oCua(ev, 2))).toEqual(['A', 'C', 'C', 'C', 'D', 'Eb', 'E', 'F'])
    expect(khongOct(oCua(ev, 3))).toEqual(['D', 'D', 'D', 'D', 'D', 'E', 'F'])
    expect(khongOct(oCua(ev, 4))).toEqual(['C', 'Bb', 'A', 'Bb', 'F', 'C', 'A'])
    expect(khongOct(oCua(ev, 5))).toEqual(['Bb', 'Bb', 'Bb', 'Bb', 'A', 'Bb', 'F'])
    expect(khongOct(oCua(ev, 6))).toEqual(['F', 'E', 'D', 'D', 'E', 'F'])
  })

  it('MỌI NỐT ĐỀU THẬT — không nốt nào do luật sinh ra', () => {
    /* Đây là điều kiện cốt lõi. Soạn nốt theo luật đã bị người dùng bác bốn lần. */
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

  it('ô nguồn vừa tầm thì không gập từng nốt trong ô', () => {
    const rong = SOLO_RANGE.high - SOLO_RANGE.low
    const oNguon = (moc: readonly { at: number; pc: number }[], thu: boolean) => {
      for (const t of VON.filter((x) => x.thu === thu && x.phach === 4)) {
        for (const o of t.o) {
          if (o.n.length !== moc.length || o.n.length === 0) continue
          if (o.n.some((n, i) => Math.abs(n[0] - moc[i]!.at) > 1e-6)) continue
          const lech = o.n.map((n, i) => ((((moc[i]!.pc - n[1]) % 12) + 12) % 12))
          if (lech.every((z) => z === lech[0])) return o.n.map((n) => n[1])
        }
      }
      return null
    }
    let xem = 0
    for (const [txt, tonic, minor] of [
      [DUNG_XA, 2, true],
      [MUA_XUAN, 7, false],
      ['C | Am | Dm | G | C | F | G7 | C', 0, false],
    ] as const) {
      for (let take = 0; take < 4; take += 1) {
        const ev = giaiDieuDaoLinhNhi({
          left: [],
          chords: parseChordInput(txt).chords,
          beatsPerChord: 4,
          barBeats: 4,
          range: SOLO_RANGE,
          tonic: tonic as PitchClass,
          minor,
          take,
        })
        const theo = new Map<number, number[]>()
        const moc = theoO(ev)
        for (const e of ev) {
          const o = Math.floor(e.startBeat / 4)
          theo.set(o, [...(theo.get(o) ?? []), e.notes[0]!])
        }
        moc.forEach((m, i) => {
          const src = oNguon(m, minor)
          const midi = theo.get(i)
          if (!src || !midi || src.length < 2) return
          if (Math.max(...src) - Math.min(...src) > rong) return
          if (Math.max(...midi) - Math.min(...midi) !== Math.max(...src) - Math.min(...src))
            return
          xem += 1
          const dOut = midi.slice(1).map((n, j) => n - midi[j]!)
          const dSrc = src.slice(1).map((n, j) => n - src[j]!)
          expect(dOut, `${txt} take ${take} ô ${i}`).toEqual(dSrc)
        })
      }
    }
    expect(xem).toBeGreaterThan(10)
  })

  it('TRƯỞNG RA TRƯỞNG, THỨ RA THỨ', () => {
    /*
      Giọng đã được xác định ở bước tái hoà thanh và `ScaleType` chỉ có `major | minor`,
      nên không có ngả thứ ba. Kiểm bằng cách đòi mỗi ô phải chép được từ ĐÚNG nhóm
      cùng thứ/trưởng — và không chép được từ nhóm kia.
    */
    for (const moc of theoO(chay(MUA_XUAN, 7, false))) {
      expect(laODuocChep(moc, false, 4)).toBe(true)
    }
    for (const moc of theoO(chay(DUNG_XA, 2, true))) {
      expect(laODuocChep(moc, true, 4)).toBe(true)
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
      expect(chia).toHaveLength(9)
      for (const o of chia) {
        expect(o.chia).not.toBeNull()
        expect(o.chia!).toBeGreaterThan(0)
        expect(o.bac2).not.toBe(o.bac)
      }
      /* Đừng Xa ô 7: E rồi A — bậc II rồi bậc V của Rê thứ. */
      const dungXa = TUYEN_DAO.find((t) => t.id === 'dung-xa-em-dem-nay-intro')!.o[6]!
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
      /*
        Ô 7 đổi thành `Em | A7` — đúng cặp **bậc 2 thứ → bậc 7** của Đừng Xa ô 7, ô chia
        DUY NHẤT trong vốn ô khớp được chỗ này.

        VÌ SAO PHẢI CHỌN ĐÚNG CẶP CÓ THẬT. Bản trước của test đổi hợp âm nửa ô sau ở CẢ
        TÁM ô sang những cặp bậc mà vốn ô **không có** (`0→5`, `10→9`, `8→3`…). Lúc ấy
        phép phạt lệch chia (+2) rơi ĐỀU lên mọi ứng viên nên thứ hạng không đổi, và câu
        ra y hệt — test đỏ mà cơ chế vẫn đúng.

        Vốn ô giọng thứ chỉ có bốn ô chia: Đừng Xa ô7 `2m→7` · Lá Thư ô2 `10→0` · Lá Thư
        ô5 `8→2` · Rừng Lá ô3 `10→5`. Kiểm bằng cặp nằm ngoài bốn cặp ấy là kiểm một thứ
        bộ ghép không có vật liệu để làm.
      */
      const b = 'Dm | Dm | C | C | Bb | Bb | F | F | Gm | Gm | Dm | Dm | Em | A7 | Dm | Dm'
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

  it('Tuấn intro thứ: ô1 không mở tam cung ♭III (C–E–G) — #393', () => {
    const CE_G = new Set([0, 4, 7])
    for (const take of [0, 1, 3, 7]) {
      const dau = giaiDieuDaoLinhNhi({
        left: [],
        chords: parseChordInput('Am | G | F | C | Dm | Am | E | Am').chords,
        beatsPerChord: 4,
        barBeats: 4,
        range: { low: 57, high: 95 },
        tonic: 9,
        minor: true,
        take,
        gopThay: true,
      })
        .filter((e) => e.startBeat < 4)
        .slice(0, 3)
        .map((e) => ((e.notes[0]! % 12) + 12) % 12)
      const du = [...new Set(dau)]
      expect(
        du.length === 3 && du.every((p) => CE_G.has(p)),
        `take ${take} mở ${dau.join(',')}`,
      ).toBe(false)
    }
  })

  it('intro thứ Bolero Tuấn xoay một sheet nhất quán qua đủ ba thầy', () => {
    expect([0, 1, 2, 3, 4, 5].map((take) => minorIntroSourceForTake(take)?.thay))
      .toEqual(['linh-nhi', 'ca-phao', 'ton-hung', 'linh-nhi', 'ca-phao', 'ton-hung'])
    for (let take = 0; take < 6; take += 1) {
      const source = minorIntroSourceForTake(take)!
      const von = vonO(source.thay, 'intro', true).filter((t) => t.id === source.id)
      expect(von).toHaveLength(1)
      expect(von[0]!.thay).toBe(source.thay)
    }
  })

})
