import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chordTonesStrict } from '../../fillSoloGenerator/soloVocabulary'
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
    /*
      NGƯỠNG HẠ TỪ 0,35 XUỐNG 0,28, và đây là một ĐÁNH ĐỔI có chủ ý.

      Người dùng yêu cầu tăng hẳn số câu chạy trong giang tấu. Câu chạy ghi đè
      cao độ bằng bậc thang của gam, nên mỗi câu chạy là một đoạn tay phải KHÔNG
      nhân bản lớp cao độ tay trái. Nhiều câu chạy thì tất yếu ít nhân bản hơn:
      đo ra 47% (bản gốc) xuống 32%.

      Không thể vừa nhiều câu chạy vừa giữ 47% — hai thứ ăn vào cùng một quỹ
      nốt. Người dùng đã chọn câu chạy, nên ghi con số thật ra đây.
    */
    expect(ti).toBeGreaterThan(0.28)
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

  /*
    ĐO NGOÀI CÂU CHẠY, và đây là chỗ sửa THƯỚC chứ không phải nới ngưỡng.

    36% ở bản gốc đo trên đoạn giang tấu có ĐÚNG MỘT câu chạy trong cả 72 ô —
    tức nó gần như là tỉ lệ của phần KHÔNG chạy. Đoạn sinh ra giờ có sáu câu
    chạy, mà câu chạy vốn là bè đơn: 36 nốt đơn trên tổng 87 kéo tỉ lệ tổng
    xuống 12% một cách máy móc. Đem con số ấy so với 36% là so hai thứ khác
    nhau — đúng cái bẫy đã sập vài lần: so nhầm hai phép đo rồi tưởng thuật
    toán hỏng.

    Nên bỏ nốt móc kép ra khỏi cả tử lẫn mẫu, rồi mới so với bản gốc.
  */
  it('chồng nốt đúng khoảng đo được, tính ngoài câu chạy', () => {
    const ti = trungBinh((take) => {
      const { right } = dung(take)
      const at = new Map<number, number>()
      for (const e of right) {
        if (e.durationBeats <= 0.26) continue
        const k = Number(e.startBeat.toFixed(3))
        at.set(k, (at.get(k) ?? 0) + e.notes.length)
      }
      return [...at.values()].filter((v) => v > 1).length / at.size
    })
    expect(ti).toBeLessThan(0.25)
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
describe('nốt RH bám hợp âm đang vang', () => {
  it('phách 1 là nốt hợp âm của đúng ô đó', () => {
    for (let take = 0; take < 6; take += 1) {
      const { right } = dung(take)
      for (const e of right) {
        if (Math.abs(e.startBeat % BAR) > 0.08) continue
        const chord = CHORDS[Math.min(CHORDS.length - 1, Math.floor(e.startBeat / BAR))]!
        const pc = ((e.notes[0]! % 12) + 12) % 12
        expect(chordTonesStrict(chord), `take ${take} beat ${e.startBeat}`).toContain(pc)
      }
    }
  })

  it('không có gam thì không vỡ', () => {
    const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
    const right = raiLinhNhi({ left, chords: CHORDS, beatsPerChord: BAR, barBeats: BAR, range: { low: 57, high: 95 } })
    expect(right.length).toBeGreaterThan(0)
  })
})

/*
  CỬA RA — BỘ NÀY KHÔNG DẶM HỢP ÂM NỮA. Chỉ TIẾNG BÁO mới được dặm.

  Bộ này từng chồng năm nốt vào vạch ô cuối làm chỗ đáp cho câu chạy, hình lấy
  từ ô 53 và ô 71 bản ký âm. Số đo ấy đúng cho GIANG TẤU, nhưng đoạn dạo đầu và
  đoạn kết chạy qua cùng bộ sinh nên lĩnh luôn cái khối ấy — rồi cuối đoạn còn
  một tiếng báo nữa. Đo trên đoạn dạo `bolero-linh-nhi-2`: sáu nốt cùng rơi
  phách 12, tiếng báo ở phách 15. Hai lần thông báo cho một lần chuyển đoạn.

  Người dùng: "intro vẫn bị dặm hợp âm trước báo, hãy sửa để chỉ báo mới dặm
  hợp âm."

  Ở giang tấu còn nặng hơn: từ lượt dời hợp âm báo về ngay sau câu chạy, khối
  cửa ra và hợp âm báo rơi ĐÚNG CÙNG một phách — hai hợp âm khác nhau chồng lên
  nhau. Nên chỗ đáp của câu chạy nay chính là tiếng báo, và tiếng báo dựng ở
  ngoài bộ này (`ReharmHome` / `phraseSection`), không phải ở đây.
*/
describe('cửa ra cuối đoạn', () => {
  const oCuoi = Math.floor((CHORDS.length * BAR - 1e-6) / BAR) * BAR

  /*
    NGƯỠNG LẤY TỪ SỐ ĐO, KHÔNG ĐOÁN. Quét tám lượt, đếm số nốt rơi cùng một
    mốc trên cả đoạn: 513 mốc một nốt, 59 mốc hai nốt, KHÔNG mốc nào hơn.

    Mốc hai nốt là **chồng nốt** — nét đo được của chính phong cách này (36% ở
    bản gốc), có suốt đoạn chứ không riêng ô cuối, nên đòi mọi mốc chỉ một nốt
    là cấm luôn cả phong cách. Thứ người dùng nghe ra là khối năm sáu nốt.
  */
  it('ô cuối không có khối hợp âm nào dày hơn nét chồng nốt thường', () => {
    for (let take = 0; take < 8; take += 1) {
      const right = dung(take).right.filter((e) => e.startBeat >= oCuoi)
      const moc = new Map<string, number>()
      for (const e of right) {
        const k = e.startBeat.toFixed(3)
        moc.set(k, (moc.get(k) ?? 0) + e.notes.length)
      }
      for (const [k, n] of moc) expect(n, `lượt ${take} @ ${k}`).toBeLessThanOrEqual(2)
    }
  })

  /* Và cả đoạn cũng vậy: bộ này không dựng hợp âm dặm ở bất kỳ đâu. */
  it('cả đoạn không mốc nào quá hai nốt', () => {
    for (let take = 0; take < 8; take += 1) {
      const moc = new Map<string, number>()
      for (const e of dung(take).right) {
        const k = e.startBeat.toFixed(3)
        moc.set(k, (moc.get(k) ?? 0) + e.notes.length)
      }
      for (const [k, n] of moc) expect(n, `lượt ${take} @ ${k}`).toBeLessThanOrEqual(2)
    }
  })

  /*
    Câu chạy KHÔNG mất theo. Nó là cử chỉ người dùng đòi mãi mới có, và nó độc
    lập với khối hợp âm vừa bỏ — bỏ nhầm cả hai thì lại quay về chỗ cũ.
  */
  it('câu chạy cuối đoạn vẫn còn nguyên', () => {
    const k = khungChayNgon(CHORDS.length * BAR, BAR)!
    for (let take = 0; take < 8; take += 1) {
      const chay = dung(take).right.filter(
        (e) => e.startBeat >= k.tu - 1e-6 && e.startBeat < k.den - 1e-6,
      )
      expect(chay.length, `lượt ${take}`).toBeGreaterThanOrEqual(5)
    }
  })

  it('tay phải vẫn không bao giờ chui xuống dưới tay trái ở ô cuối', () => {
    for (let take = 0; take < 8; take += 1) {
      const { left, right } = dung(take)
      for (const e of right) {
        if (e.startBeat < oCuoi) continue
        const cungLuc = left.filter((one) => Math.abs(one.startBeat - e.startBeat) < 0.03)
        if (cungLuc.length === 0) continue
        expect(Math.min(...e.notes)).toBeGreaterThan(
          Math.max(...cungLuc.flatMap((one) => one.notes)),
        )
      }
    }
  })
})

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

/*
  CÂU CHẠY CHÈN PHẢI DÀI BẰNG CÂU Ở CỬA RA.

  Bản trước cắt câu chèn còn bốn nốt — gọn trong một phách — trong khi câu cửa
  ra giữ đủ sáu. Người dùng báo đúng triệu chứng ấy: "vẫn chưa thấy phần chạy
  nốt nào TRỪ cuối giang tấu". Bốn móc kép không vượt vạch phách thì lẫn vào
  chính cặp móc kép của mẫu đệm bolero, không đọc ra là một câu.
*/
describe('câu chạy chèn giữa đoạn', () => {
  it('chạy đủ sáu nốt, không bị cắt còn bốn', () => {
    const { right } = dung(0)
    const nhanh = right.filter((e) => e.durationBeats <= 0.26).map((e) => e.startBeat)
    const cum: number[][] = []
    for (const beat of nhanh) {
      const cuoi = cum[cum.length - 1]
      if (cuoi && Math.abs(beat - cuoi[cuoi.length - 1]!) <= 0.26) cuoi.push(beat)
      else cum.push([beat])
    }
    const dai = cum.filter((one) => one.length >= 4)
    expect(dai.length).toBeGreaterThanOrEqual(4)
    for (const one of dai) expect(one.length).toBe(6)
  })
})
