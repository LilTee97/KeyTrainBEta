import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { suggestScales } from '../phraseScale'
import { khungChayNgon, raiLinhNhi } from '../raiLinhNhi'
import { soloLeftHand } from '../soloLeftHand'
import { getStyle } from '../styleLibrary'
import type { TimelineEvent } from '../types'

/*
  TAY PHẢI GIANG TẤU BÁM VÀO TAY TRÁI.

  Bộ sinh trước cho tay phải bốc nốt từ thang gam mà KHÔNG hề biết tay trái đang
  giữ nốt gì ở thời điểm ấy, rồi mới để `interlockHands` xen vào tỉa bớt. Hai
  luồng xa lạ ghép lại, và người dùng nghe ra ngay: "tay phải quá rời rạc với
  tay trái".

  Đo mười ô giang tấu bản ký âm Linh Nhi:

    mốc gõ có CẢ HAI tay   55%   (phiên khúc chỉ 45% — vào giang tấu thì hai
                                  tay gõ cùng nhau NHIỀU HƠN, không ít hơn)
    nốt trùng lớp cao độ   47%   (phiên khúc 31%)
    khe hai tay            24 nửa cung, hẹp nhất 9
    tay phải xuống dưới     0%
    hai tay cùng hướng     52%   — tức đường nét ĐỘC LẬP

  Hai tay khoá nhau ở NHỊP và LỚP CAO ĐỘ; đường nét thì tự do.

  CỠ MẪU: một bài, một người soạn, một đoạn mười ô, và là bản độc tấu.
*/

const CHORDS = parseChordInput('Bm F#m Em D Bm Em F#m D A').chords
const STYLE = getStyle('bolero-linh-nhi-2')!
const BAR = STYLE.beatsPerMeasure

function dung(take: number) {
  const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
  const right = raiLinhNhi({
    left,
    chords: CHORDS,
    beatsPerChord: BAR,
    range: { low: 57, high: 95 },
    take,
  })
  return { left, right }
}

/** Gom hai tay theo mốc gõ. */
function mocGo(left: readonly TimelineEvent[], right: readonly TimelineEvent[]) {
  const at = new Map<number, { l: number[]; r: number[] }>()
  const bo = (list: readonly TimelineEvent[], tay: 'l' | 'r') => {
    for (const event of list) {
      const key = Number(event.startBeat.toFixed(3))
      const o = at.get(key) ?? { l: [], r: [] }
      o[tay].push(...event.notes)
      at.set(key, o)
    }
  }
  bo(left, 'l')
  bo(right, 'r')
  return [...at.values()]
}

const trungBinh = (f: (take: number) => number) =>
  Array.from({ length: 12 }, (_, take) => f(take)).reduce((a, b) => a + b, 0) / 12

describe('tay phải giang tấu bám vào tay trái', () => {
  it('quá nửa số mốc gõ có CẢ HAI tay', () => {
    const ti = trungBinh((take) => {
      const { left, right } = dung(take)
      const moc = mocGo(left, right)
      return moc.filter((v) => v.l.length && v.r.length).length / moc.length
    })
    expect(ti).toBeGreaterThan(0.45)
    expect(ti).toBeLessThan(0.65)
  })

  /*
    Đây là chỗ hai tay dính vào nhau: tay phải chơi lại chính lớp cao độ tay
    trái đang giữ, nâng lên cao. Không có nó thì hai tay lại thành hai luồng.
  */
  it('gần một nửa số mốc chung có nốt trùng lớp cao độ', () => {
    const ti = trungBinh((take) => {
      const { left, right } = dung(take)
      const ca = mocGo(left, right).filter((v) => v.l.length && v.r.length)
      return ca.filter((v) => v.r.some((x) => v.l.some((y) => (x - y) % 12 === 0))).length / ca.length
    })
    expect(ti).toBeGreaterThan(0.35)
    expect(ti).toBeLessThan(0.65)
  })

  /*
    LUẬT CỨNG, không phải xu hướng: số đo cho đúng 0% số mốc tay phải xuống dưới
    tay trái. Bắt chéo tay là thứ bản gốc không làm lần nào.
  */
  it('tay phải KHÔNG BAO GIỜ xuống dưới tay trái', () => {
    for (let take = 0; take < 12; take += 1) {
      const { left, right } = dung(take)
      for (const v of mocGo(left, right)) {
        if (!v.l.length || !v.r.length) continue
        expect(Math.min(...v.r)).toBeGreaterThan(Math.max(...v.l))
      }
    }
  })

  it('khe giữa hai tay quanh hai quãng tám', () => {
    const khe: number[] = []
    for (let take = 0; take < 12; take += 1) {
      const { left, right } = dung(take)
      for (const v of mocGo(left, right)) {
        if (v.l.length && v.r.length) khe.push(Math.min(...v.r) - Math.max(...v.l))
      }
    }
    khe.sort((a, b) => a - b)
    const giua = khe[Math.floor(khe.length / 2)]!
    expect(giua).toBeGreaterThanOrEqual(17)
    expect(giua).toBeLessThanOrEqual(30)
    expect(Math.min(...khe)).toBeGreaterThanOrEqual(9)
  })

  it('chồng nốt đúng khoảng đo được', () => {
    const ti = trungBinh((take) => {
      const { right } = dung(take)
      const at = new Map<number, number>()
      for (const e of right) {
        const k = Number(e.startBeat.toFixed(3))
        at.set(k, (at.get(k) ?? 0) + e.notes.length)
      }
      return [...at.values()].filter((v) => v > 1).length / at.size
    })
    expect(ti).toBeGreaterThan(0.25)
    expect(ti).toBeLessThan(0.5)
  })

  it('mật độ tay phải gần bản gốc', () => {
    const moiO = trungBinh((take) => dung(take).right.length / CHORDS.length)
    expect(moiO).toBeGreaterThan(7)
    expect(moiO).toBeLessThan(11)
  })

  it('không có tay trái thì không sinh gì', () => {
    expect(raiLinhNhi({ left: [], chords: CHORDS, beatsPerChord: BAR, range: { low: 57, high: 95 } }))
      .toEqual([])
  })

  it('mỗi lượt cho một đường khác nhau', () => {
    const cua = (take: number) => dung(take).right.map((e) => e.notes.join()).join('|')
    expect(cua(0)).not.toBe(cua(1))
    expect(cua(3)).toBe(cua(3))
  })
})

/*
  PHÁCH 1 LUÔN CÓ NỐT — luật cứng, không phải xác suất.

  Người dùng nhận ra trước khi tôi đo, và ví von rất đúng: ca sĩ luôn biết chọn
  điểm rơi của mẫu đệm mà vào. Đếm trên bản ký âm thì đúng tuyệt đối — 16/16 ô
  ở phiên khúc và 10/10 ô ở giang tấu, không sót ô nào.

  Bản trước chỉ gõ chung 64% số mốc, nên cứ ba ô lại có một ô vào trống phách 1.
  Đó là một phần lý do nó nghe rời rạc.
*/
describe('phách 1 và trọng số trong ô', () => {
  it('ô nào cũng có nốt tay phải đúng phách 1', () => {
    for (let take = 0; take < 12; take += 1) {
      const { right } = dung(take)
      const coNot = new Set(right.map((e) => Math.floor(e.startBeat / BAR)))
      const coPhachMot = new Set(
        right.filter((e) => Math.abs(e.startBeat % BAR) < 0.03).map((e) => Math.floor(e.startBeat / BAR)),
      )
      expect(coPhachMot.size, `lượt ${take}`).toBe(coNot.size)
    }
  })

  /*
    Nửa đầu ô THƯA, nửa sau DÀY. Đếm trên mười ô giang tấu:

      phách 1 → 10   1& → 5    2 → 10   2& → 5
      phách 3 → 15   3& → 15   4 → 13   4& → 14

    Tay trái thì đều tăm tắp 8-10 ở mọi vị trí, nên cái nhấp nhô này là của
    riêng tay phải — nó giữ thưa lúc mở ô rồi dồn lại về cuối ô.
  */
  /*
    Bỏ Ô CUỐI ra khỏi phép đếm: nó là ô cửa ra, có hình riêng — chồng hợp âm ở
    phách 1& và 2, tức dồn vào nửa ĐẦU. Tính cả nó thì đang đo hai luật khác
    nhau bằng một con số.
  */
  it('nửa sau ô dày hơn nửa đầu', () => {
    const oCuoi = Math.floor((CHORDS.length * BAR - 1e-6) / BAR) * BAR
    let dau = 0
    let sau = 0
    for (let take = 0; take < 12; take += 1) {
      for (const e of dung(take).right) {
        if (e.startBeat >= oCuoi) continue
        if (e.startBeat % BAR < BAR / 2) dau += 1
        else sau += 1
      }
    }
    const tiSau = sau / (dau + sau)
    expect(tiSau).toBeGreaterThan(0.58)
    expect(tiSau).toBeLessThan(0.75)
  })
})

/*
  CHẠY NGÓN — khuôn lấy nguyên từ lần chạy DUY NHẤT trong bản ký âm.

  Cả 72 ô chỉ có một ô chạy móc kép: ô 71, tức áp chót bài. Nên đây không phải
  thói quen thường xuyên của người soạn, nó là một cử chỉ hiếm. Người dùng muốn
  chen vào giang tấu thì cài đúng HÌNH của lần ấy và đúng TẦN SUẤT một lần mỗi
  đoạn, chứ không rải khắp nơi.

  Đo lần chạy ấy: 6 nốt móc kép, vào đúng nửa sau ô (offset 1,5), đi LÊN, bước
  [2,2,3,5,2] tức 60% liền bậc, trèo 14 nửa cung — và TAY TRÁI im hẳn, 0 nốt.
*/
describe('chạy ngón chen vào giang tấu', () => {
  const khung = () => khungChayNgon(CHORDS.length * BAR, BAR)!

  /*
    HẠ CÁNH ĐÚNG VẠCH NHỊP của ô cuối.

    Bản đầu đặt chạy ở offset 1,5-3,0 của ô áp chót rồi để trống một phách, sau
    đó cửa ra mới vào. Người dùng nghe ra ngay: "dặm hợp âm rồi nghỉ rồi đánh
    thêm hợp âm báo vào, nghe nó khựng lại rất dở". Một phách trống ở đúng chỗ
    ấy nghe như hụt chân.

    Nay chạy chiếm 1,5 phách CUỐI ô áp chót và đáp thẳng vào hợp âm báo đứng ở
    vạch nhịp — một cử chỉ liền, không có khe.
  */
  it('chiếm 1,5 phách cuối ô áp chót, đáp đúng vạch nhịp', () => {
    const k = khung()
    const vachOCuoi = (CHORDS.length - 1) * BAR
    expect(k.den).toBe(vachOCuoi)
    expect(k.den - k.tu).toBeCloseTo(1.5, 5)
  })

  it('sáu nốt móc kép, đi lên, phần lớn liền bậc', () => {
    const k = khung()
    for (let take = 0; take < 8; take += 1) {
      const chay = dung(take).right.filter(
        (e) => e.startBeat >= k.tu - 1e-6 && e.startBeat < k.den - 1e-6,
      )
      expect(chay.length, `lượt ${take}`).toBeGreaterThanOrEqual(5)
      for (const e of chay) expect(e.durationBeats).toBeLessThan(0.3)

      const cao = chay.map((e) => Math.min(...e.notes))
      for (let at = 1; at < cao.length; at += 1) {
        expect(cao[at], 'phải đi LÊN').toBeGreaterThan(cao[at - 1]!)
      }
      const buoc = cao.slice(1).map((x, at) => x - cao[at]!)
      const lienBac = buoc.filter((x) => x <= 2).length / buoc.length
      expect(lienBac).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('không nốt rải nào chen vào giữa câu chạy', () => {
    const k = khung()
    for (let take = 0; take < 8; take += 1) {
      const trong = dung(take).right.filter(
        (e) => e.startBeat > k.tu + 1e-6 && e.startBeat < k.den - 1e-6,
      )
      // Mọi nốt trong khoảng ấy phải là móc kép của chính câu chạy.
      for (const e of trong) expect(e.durationBeats).toBeLessThan(0.3)
    }
  })

  it('đoạn quá ngắn thì không chen', () => {
    expect(khungChayNgon(BAR * 2, BAR)).toBeNull()
  })
})

/*
  GIỮ NỬA Ô — tay phải ngân một nốt, tay trái đi tiếp bên dưới.

  Người dùng đề nghị "đảo vai": tay phải giữ hợp âm, tay trái chạy. Đo thì thấy
  NỬA ĐÚNG NỬA SAI:

    tay phải giữ nốt dài, tay trái đi tiếp   CÓ — 5/10 ô giang tấu, 23/72 cả bài
    tay trái CHẠY                            gần như không — 3 ô, và đó là cặp
                                             móc kép sẵn có của mẫu

  Nên cài phần đo được, bỏ phần tự nghĩ. Đo kỹ: trường độ đúng 2,0 phách — nửa
  ô, không hơn — vào ở phách 1 hoặc phách 3, và tay trái vẫn gõ 3,6 nốt trong
  lúc giữ.
*/
describe('giữ nửa ô', () => {
  it('có nốt ngân trọn nửa ô, ở khoảng một nửa số ô', () => {
    let coGiu = 0
    let tongO = 0
    for (let take = 0; take < 12; take += 1) {
      const { right } = dung(take)
      const theoO = new Map<number, boolean>()
      for (const e of right) {
        const o = Math.floor(e.startBeat / BAR)
        theoO.set(o, (theoO.get(o) ?? false) || e.durationBeats >= BAR / 2 - 0.1)
      }
      coGiu += [...theoO.values()].filter(Boolean).length
      tongO += theoO.size
    }
    const ti = coGiu / tongO
    expect(ti).toBeGreaterThan(0.3)
    expect(ti).toBeLessThan(0.7)
  })

  it('nốt ngân vào đúng đầu một nửa ô', () => {
    for (let take = 0; take < 12; take += 1) {
      for (const e of dung(take).right) {
        if (e.durationBeats < BAR / 2 - 0.1) continue
        const trongO = e.startBeat % BAR
        expect([0, BAR / 2]).toContain(trongO)
      }
    }
  })

  /*
    NGÂN, KHÔNG NGỪNG. Bản đầu tôi bỏ hết nốt còn lại trong nửa ô ấy và mật độ
    tụt từ 8,9 xuống 6,8. Đo lại bản gốc thì vô lý ngay: ô 53 có 10 nốt tay
    phải VÀ 2 nốt giữ cùng lúc, mà cả đoạn vẫn 9,3 nốt mỗi ô. Nốt giữ là MỘT
    NGÓN ngân, các ngón khác vẫn chạy tiếp.
  */
  it('giữ nốt KHÔNG làm tay phải thưa đi', () => {
    const moiO = trungBinh((take) => dung(take).right.length / CHORDS.length)
    expect(moiO).toBeGreaterThan(7)
  })
})

/*
  CHUỖI LIỀN BẬC — câu chạy scale.

  Người dùng nghe ra tay phải "quá đơn sơ và thiếu câu chạy scale". Đúng, và
  nguyên nhân là MỘT PHÉP ĐO HỎNG CỦA TÔI.

  Số đầu tiên tôi báo cho bản gốc — 57% nhảy xa, 16% liền bậc — tính theo từng
  cặp nốt liền nhau TRONG MẢNG, nên nốt CHỒNG (cùng một chỗ gõ, thấp hơn vài
  bậc) bị đếm thành một bước. Tôi đã tìm ra lỗi ấy khi đo BỘ SINH nhưng không
  áp lại cho BẢN GỐC, và cả chế độ "rải mở rộng" đứng trên con số hỏng ấy.

  Đo lại đường trên cùng, bỏ các cặp cùng chỗ gõ:

    liền bậc 39% · quãng ba 19% · quãng 4-5 9% · nhảy xa 33%

  Và trong mười ô có 5 chuỗi liền bậc từ 3 nốt trở lên, dài [3, 3, 4, 7, 3] —
  cứ hai ô một câu chạy, không phải một lần mỗi đoạn.
*/
describe('chuỗi liền bậc', () => {
  const KEY_SCALE = suggestScales(CHORDS, { tonic: 2, scale: 'major' })[0]!.pitchClasses

  const duongTren = (take: number) => {
    const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
    const right = raiLinhNhi({
      left,
      chords: CHORDS,
      beatsPerChord: BAR,
      barBeats: BAR,
      scale: KEY_SCALE,
      range: { low: 57, high: 95 },
      take,
    })
    const at = new Map<number, number[]>()
    for (const e of right) {
      const k = Number(e.startBeat.toFixed(3))
      at.set(k, [...(at.get(k) ?? []), ...e.notes])
    }
    return [...at.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => Math.max(...v))
  }

  const chuoiCua = (tren: readonly number[]) => {
    const out: number[] = []
    let cur = 1
    for (let at = 1; at < tren.length; at += 1) {
      const buoc = Math.abs(tren[at]! - tren[at - 1]!)
      if (buoc > 0 && buoc <= 2) cur += 1
      else {
        if (cur >= 3) out.push(cur)
        cur = 1
      }
    }
    if (cur >= 3) out.push(cur)
    return out
  }

  it('mỗi đoạn có vài câu chạy scale', () => {
    const soChuoi =
      Array.from({ length: 12 }, (_, take) => chuoiCua(duongTren(take)).length).reduce(
        (a, b) => a + b,
        0,
      ) / 12
    expect(soChuoi).toBeGreaterThan(3)
    expect(soChuoi).toBeLessThan(7)
  })

  it('có chuỗi dài hơn ba nốt', () => {
    const dai = Array.from({ length: 12 }, (_, take) => Math.max(0, ...chuoiCua(duongTren(take))))
    expect(Math.max(...dai)).toBeGreaterThanOrEqual(5)
  })

  it('bước liền bậc chiếm phần đáng kể', () => {
    let ti = 0
    for (let take = 0; take < 12; take += 1) {
      const tren = duongTren(take)
      const buoc = tren.slice(1).map((x, at) => Math.abs(x - tren[at]!)).filter((x) => x > 0)
      ti += buoc.filter((x) => x <= 2).length / buoc.length
    }
    expect(ti / 12).toBeGreaterThan(0.22)
  })

  it('không có gam thì không chạy chuỗi, và không vỡ', () => {
    const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
    const right = raiLinhNhi({ left, chords: CHORDS, beatsPerChord: BAR, barBeats: BAR, range: { low: 57, high: 95 } })
    expect(right.length).toBeGreaterThan(0)
  })
})

/*
  CỬA RA — ô cuối đoạn, hợp âm chồng dày để hút sang đoạn kế.

  Người dùng muốn cuối giang tấu có câu chạy cộng một hợp âm hút mạnh. Đo bản
  gốc thì hai việc ấy nằm ở HAI Ô KHÁC NHAU, và ô cuối giang tấu KHÔNG chạy:

    ô 61, cuối giang tấu, hợp âm A (bậc V):
      16 nốt tay phải — dày nhất bài — chồng 4 · 4 · 5 nốt ở phách 1&, 2, 3
    ô 71, áp chót đoạn kết, hợp âm D7:
      ngân 1,5 → chồng 3 nốt → 6 móc kép chạy lên → hạ cánh

  Nên cửa ra là CHỒNG HỢP ÂM, rơi vào ô CUỐI; câu chạy giữ chỗ cũ ở ô áp chót.
  Hai cử chỉ nối tiếp nhau đúng như bản gốc: chạy rồi mới chồng.
*/
describe('cửa ra cuối đoạn', () => {
  const oCuoi = Math.floor((CHORDS.length * BAR - 1e-6) / BAR) * BAR

  /*
    MỘT cú dặm rồi NGÂN, không lặp ba khối giống hệt.

    Bản đầu chồng đúng bốn nốt ấy ba lần ở phách 1, 1&, 2 rồi im tới phách 3&.
    Người dùng nghe ra: "dặm hợp âm rồi nghỉ rồi đánh thêm hợp âm báo vào, nghe
    nó khựng lại rất dở". Đo ra đúng thế — ba khối y hệt nhau rồi một phách
    rưỡi trống.

    Cử chỉ báo hiệu phải là MỘT cú, đủ dày, rồi để nó vang — và nó đứng đúng
    vạch nhịp để câu chạy đáp thẳng vào.
  */
  it('ô cuối có một cú chồng dày, đứng đúng vạch nhịp', () => {
    for (let take = 0; take < 8; take += 1) {
      const chong = new Map<number, number>()
      for (const e of dung(take).right) {
        if (e.startBeat < oCuoi) continue
        const k = Number((e.startBeat - oCuoi).toFixed(2))
        chong.set(k, (chong.get(k) ?? 0) + e.notes.length)
      }
      const day = [...chong.entries()].filter(([, n]) => n >= 4)
      expect(day.length, `lượt ${take}`).toBeGreaterThanOrEqual(1)
      for (const [at] of day) expect(at).toBe(0)
    }
  })

  it('cú chồng ấy NGÂN, không tắt ngay', () => {
    for (let take = 0; take < 8; take += 1) {
      const tai0 = dung(take).right.filter((e) => Math.abs(e.startBeat - oCuoi) < 1e-6)
      const dai = Math.max(...tai0.map((e) => e.durationBeats))
      expect(dai, `lượt ${take}`).toBeGreaterThan(BAR / 2)
    }
  })

  it('cú gõ chồng nằm trên tay trái tại chính lúc nó vang', () => {
    for (let take = 0; take < 8; take += 1) {
      const { left, right } = dung(take)
      for (const e of right) {
        if (e.startBeat < oCuoi) continue
        const cungLuc = left.filter((one) => Math.abs(one.startBeat - e.startBeat) < 0.03)
        if (cungLuc.length === 0) continue
        expect(Math.min(...e.notes)).toBeGreaterThan(Math.max(...cungLuc.flatMap((one) => one.notes)))
      }
    }
  })

  /*
    ĐẶT TRƯỚC khối chạy ngón, không phải sau. Lần đầu tôi để nó sau và nó thành
    CODE CHẾT: nhánh chạy ngón thoát ra bằng `return` sớm nên không bao giờ
    chạy tới. Đo ra 0 nốt cửa ra — và nếu không lần theo `velocity` riêng thì
    tưởng thuật toán sai chứ không phải luồng sai.
  */
  it('cửa ra và câu chạy cùng tồn tại, không cái nào nuốt cái nào', () => {
    const k = khungChayNgon(CHORDS.length * BAR, BAR)!
    for (let take = 0; take < 8; take += 1) {
      const right = dung(take).right
      const chay = right.filter((e) => e.startBeat >= k.tu - 1e-6 && e.startBeat < k.den - 1e-6)
      const cuaRa = right.filter((e) => e.startBeat >= oCuoi)
      expect(chay.length, `chạy, lượt ${take}`).toBeGreaterThanOrEqual(5)
      expect(cuaRa.length, `cửa ra, lượt ${take}`).toBeGreaterThan(4)
    }
  })
})

/*
  NỐT NHANH THÌ PHẢI ĐI BƯỚC NGẮN.

  Người dùng nghe "giai điệu quá sai, nhiều nốt bị phô". Đo hoà âm thì SẠCH:
  2% ngoài gam, 3% nghịch nửa cung với tay trái đang vang, 19% ngoài hợp âm ở
  phách chẵn — bản gốc 42%, tức bản dựng còn thuận tai hơn bản gốc.

  Không có nốt nào sai. Thứ sai là BƯỚC ĐI. In ra thì thấy:

      86 · 86 · 81 · 78 · 54          tụt 24 nửa cung giữa chuỗi móc kép
      71 · 59 · 62                    tụt 12
      62 · 64 · 66 · 69 · 59 · 57     lên bốn nốt rồi rơi 10

  Mọi nốt đều trong gam, nhưng nhảy hai quãng tám giữa một chuỗi móc kép thì
  tai nghe như hỏng.

  Và đây cũng là lý do người dùng "không thấy câu chạy nào": những cụm ấy nhanh
  về NHỊP nhưng không thành HÌNH, nên không ai nghe ra là câu chạy. Phép đếm cũ
  của tôi đếm khoảng cách thời gian mà không nhìn cao độ, nên báo 6 câu chạy
  mỗi đoạn trong khi thật ra chỉ có đúng một — câu ở cửa ra.
*/
describe('nốt nhanh đi bước ngắn', () => {
  /*
    Bỏ Ô CỬA RA khỏi phép đo: ở đó câu chạy đáp thẳng vào một hợp âm chồng năm
    nốt, nên bước từ nốt đỉnh xuống nốt đáy hợp âm là rất rộng — và đó là chủ
    ý, không phải lỗi. Ngưỡng năm nửa cung lấy đúng bước rộng nhất trong dãy
    [2,2,3,5,2] của câu chạy gốc.
  */
  const oCuaRa = Math.floor((CHORDS.length * BAR - 1e-6) / BAR) * BAR

  /** Đường trên cùng, gom theo MỐC GÕ — không phải theo thứ tự mảng. */
  const duongTren = (take: number) => {
    const at = new Map<number, number[]>()
    for (const e of dung(take).right) {
      const k = Number(e.startBeat.toFixed(3))
      at.set(k, [...(at.get(k) ?? []), ...e.notes])
    }
    return [...at.entries()].sort((a, b) => a[0] - b[0]).map(([b, v]) => [b, Math.max(...v)] as const)
  }

  /*
    THỨ TỰ ƯU TIÊN, và test này phải nói đúng nó.

    Luật bước ngắn xếp SAU luật không bắt chéo. Chỗ nào không tìm được nốt vừa
    gần nốt trước vừa còn trên trần tay trái thì để nguyên — thà một bước rộng
    còn hơn một nốt đè lên bè trầm.

    Nên đây không phải luật tuyệt đối mà là luật gần tuyệt đối. Đo ra hơn 97%
    số bước nhanh tuân thủ; phần còn lại là chỗ hai luật đụng nhau.
  */
  it('gần như mọi bước nhanh đều không quá quãng bốn', () => {
    let tuan = 0
    let tong = 0
    for (let take = 0; take < 12; take += 1) {
      const tren = duongTren(take)
      for (let at = 1; at < tren.length; at += 1) {
        if (tren[at]![0] >= oCuaRa) continue
        if (tren[at]![0] - tren[at - 1]![0] > 0.26) continue
        tong += 1
        if (Math.abs(tren[at]![1] - tren[at - 1]![1]) <= 5) tuan += 1
      }
    }
    expect(tong).toBeGreaterThan(50)
    expect(tuan / tong).toBeGreaterThan(0.95)
  })

  /*
    Cụm móc kép giờ phải THÀNH HÌNH: đo bề rộng cả cụm, không chỉ từng bước.
    Cụm năm nốt mà trải hơn hai quãng tám thì dù từng bước có ngắn cũng không
    phải một câu chạy.
  */
  it('cụm móc kép trải trong tầm một câu chạy thật', () => {
    for (let take = 0; take < 12; take += 1) {
      const tren = duongTren(take)
      let cum: number[] = []
      const xet = () => {
        if (cum.length >= 3) expect(Math.max(...cum) - Math.min(...cum)).toBeLessThanOrEqual(16)
        cum = []
      }
      for (let at = 1; at < tren.length; at += 1) {
        if (tren[at]![0] >= oCuaRa) break
        if (tren[at]![0] - tren[at - 1]![0] > 0.26) xet()
        else {
          if (cum.length === 0) cum.push(tren[at - 1]![1])
          cum.push(tren[at]![1])
        }
      }
      xet()
    }
  })
})
