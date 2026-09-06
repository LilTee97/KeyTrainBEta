import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { TUYEN_SOLO } from '../tuyenSolo'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  BẢNG TUYẾN MỚI — sinh lại từ bản ký âm bằng `tools/tuyen_o.py`.

  Vì sao có file này: bảng cũ `tuyenDaoLinhNhi.ts` cũng ghi là "sinh bằng script" nhưng
  script ấy không ai lưu, và khi dựng được bộ sinh thì bảng cũ KHÔNG tái lập nổi — nó
  khớp `PianoBrain/data/sheet-solos` 118/276 nốt, trong khi bảng này khớp 285/285.

  Ba chốt chặn:

  1. BẢNG ĐỦ — cả ba thầy, cả ba đoạn, không tuyến nào rỗng.
  2. MỌI Ô HỢP LỆ — bậc trong 0-11, ô chia đôi có đủ cả `bac2` lẫn `chia`.
  3. BỘ GHÉP CHẠY ĐƯỢC trên vốn ô của từng thầy, và trả RỖNG đúng ở chỗ đã biết là
     không có vốn (Tôn Hùng giọng trưởng) — đó là lý do nút của anh bị khoá ở bài giọng
     trưởng chứ không phải mượn ô của thầy khác.
*/

const THAY = ['ca-phao', 'linh-nhi', 'ton-hung'] as const
const DOAN = ['intro', 'interlude', 'outro'] as const

const chay = (
  chordText: string,
  tonic: number,
  minor: boolean,
  thay: (typeof THAY)[number],
  doan: (typeof DOAN)[number] = 'intro',
) =>
  giaiDieuDaoLinhNhi({
    left: [],
    chords: parseChordInput(chordText).chords,
    beatsPerChord: 4,
    barBeats: 4,
    range: { low: 57, high: 95 },
    tonic: tonic as PitchClass,
    minor,
    thay,
    doan,
  })

describe('bảng tuyến mới — đủ và hợp lệ', () => {
  it('có tuyến cho cả ba thầy ở cả ba đoạn', () => {
    for (const thay of THAY) {
      for (const doan of DOAN) {
        const co = TUYEN_SOLO.filter((t) => t.thay === thay && t.doan === doan)
        expect(co.length, `${thay} · ${doan}`).toBeGreaterThan(0)
      }
    }
  })

  it('không tuyến nào rỗng, không ô nào rỗng nốt', () => {
    for (const t of TUYEN_SOLO) {
      expect(t.o.length, t.id).toBeGreaterThan(0)
      expect(t.o.some((o) => o.n.length > 0), t.id).toBe(true)
    }
  })

  it('bậc nằm trong 0-11, ô chia đôi có đủ cả hai trường', () => {
    for (const t of TUYEN_SOLO) {
      for (const o of t.o) {
        if (o.bac !== null) expect(o.bac, t.id).toBeGreaterThanOrEqual(0)
        if (o.bac !== null) expect(o.bac, t.id).toBeLessThan(12)
        /* `bac2` và `chia` luôn đi đôi — thiếu một cái là mất hợp âm nửa ô sau. */
        expect(o.bac2 === null, t.id).toBe(o.chia === null)
        for (const [phach, , ngan] of o.n) {
          expect(phach, t.id).toBeGreaterThanOrEqual(0)
          expect(phach, t.id).toBeLessThan(t.phach)
          expect(ngan, t.id).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('bộ ghép chạy trên vốn ô của từng thầy', () => {
  const DUNG_XA = 'Dm | C | Bb | F | Gm | Dm | A7 | Dm'
  const MUA_XUAN = 'G | Em | Bm | D | G | Bm | G | D'

  it('Linh Nhi ra nốt ở cả bài thứ lẫn bài trưởng', () => {
    expect(chay(DUNG_XA, 2, true, 'linh-nhi').length).toBeGreaterThan(0)
    expect(chay(MUA_XUAN, 7, false, 'linh-nhi').length).toBeGreaterThan(0)
  })

  it('Cà Pháo ra nốt ở cả bài thứ lẫn bài trưởng', () => {
    expect(chay(DUNG_XA, 2, true, 'ca-phao').length).toBeGreaterThan(0)
    expect(chay(MUA_XUAN, 7, false, 'ca-phao').length).toBeGreaterThan(0)
  })

  it('Tôn Hùng ra nốt ở bài thứ', () => {
    expect(chay(DUNG_XA, 2, true, 'ton-hung').length).toBeGreaterThan(0)
  })

  it('Tôn Hùng KHÔNG có vốn ô giọng trưởng — nút của anh phải bị khoá ở đó', () => {
    const co = TUYEN_SOLO.filter((t) => t.thay === 'ton-hung' && !t.thu)
    expect(co.length, 'cả hai bài Tôn Hùng đều giọng thứ').toBe(0)
    expect(chay(MUA_XUAN, 7, false, 'ton-hung')).toEqual([])
  })

  it('đoạn kết cũng ghép được, không rơi về bộ sinh', () => {
    for (const thay of THAY) {
      const ra = chay(DUNG_XA, 2, true, thay, 'outro')
      expect(ra.length, `${thay} · outro`).toBeGreaterThan(0)
    }
  })
})

describe('NEO TẦM ÂM riêng cho từng thầy', () => {
  /*
    Số cũ là MỘT hằng số 73,6 cho mọi thầy mọi giọng, đo trên bảy đoạn dạo Linh Nhi. Cà
    Pháo chơi đoạn dạo thấp hơn hẳn — đo riêng đoạn dạo của anh: **70,8 giọng trưởng**
    (n=263, ba bài 70,7 · 71,5 · 70,4) và **68,0 giọng thứ** (n=62, một bài).

    Dùng neo của Linh Nhi cho anh thì câu cao hơn thầy thật gần nửa quãng tám.
  */
  /*
    Trung bình QUA SÁU LƯỢT. Một lượt lẻ không đủ: mỗi lượt ghép bộ ô khác nhau nên tâm
    thô đổi theo, và phép căn tầm chỉ dời được bội số 12 — đo một lượt thì con số nhảy tới
    3 nửa cung. Helper `chay` ở trên không nhận `take` nên gọi thẳng bộ soạn.
  */
  const tam = (
    txt: string,
    tonic: number,
    minor: boolean,
    thay: (typeof THAY)[number],
  ) => {
    let tong = 0
    let n = 0
    for (let take = 0; take < 6; take += 1) {
      const ev = giaiDieuDaoLinhNhi({
        left: [],
        chords: parseChordInput(txt).chords,
        beatsPerChord: 4,
        barBeats: 4,
        range: { low: 57, high: 95 },
        tonic: tonic as PitchClass,
        minor,
        take,
        thay,
        doan: 'intro',
      })
      for (const e of ev) {
        tong += e.notes[0]!
        n += 1
      }
    }
    return n === 0 ? null : tong / n
  }

  const TRUONG = 'C | Am | Dm | G | C | Am | Dm | G'
  const THU = 'Am | Dm | G | C | F | Bdim | E7 | Am'

  it('Cà Pháo đứng THẤP HƠN Linh Nhi ở cả hai giọng', () => {
    const cp = tam(TRUONG, 0, false, 'ca-phao')!
    const ln = tam(TRUONG, 0, false, 'linh-nhi')!
    expect(cp, `Cà Pháo ${cp.toFixed(1)}`).toBeLessThan(ln - 3)
    expect(Math.abs(cp - 70.8), `Cà Pháo trưởng ${cp.toFixed(1)}`).toBeLessThan(1.5)
  })

  it('Linh Nhi đứng đúng tầm đo được — 75,3 trưởng', () => {
    const v = tam(TRUONG, 0, false, 'linh-nhi')!
    expect(Math.abs(v - 75.3), `tâm ${v.toFixed(1)}`).toBeLessThan(1.5)
  })

  it('Tôn Hùng — 75,8 ở giọng thứ, và KHÔNG có gì ở giọng trưởng', () => {
    const v = tam(THU, 9, true, 'ton-hung')!
    expect(Math.abs(v - 75.8), `tâm ${v.toFixed(1)}`).toBeLessThan(1.5)
    expect(tam(TRUONG, 0, false, 'ton-hung')).toBeNull()
  })

  it('giọng thứ của Cà Pháo lệch tới 3 nửa cung — PHÉP DỜI CHỈ ĐI BỘI SỐ 12', () => {
    /*
      Đo được 71,0 so với neo 68,0. Không phải lỗi: phép căn tầm dời cả câu đi **bội số
      của 12**, nên sai số tối đa là nửa quãng tám. Muốn sát hơn thì phải nắn từng nốt —
      mà nắn nốt là thứ đã bị bác bốn lần.
    */
    const v = tam(THU, 9, true, 'ca-phao')!
    expect(Math.abs(v - 68.0), `tâm ${v.toFixed(1)}`).toBeLessThan(6)
  })
})

describe('mọi nốt đều có thật trong bảng', () => {
  it('không nốt nào do luật sinh ra — đối chiếu ngược ra bảng', () => {
    const DUNG_XA = 'Dm | C | Bb | F | Gm | Dm | A7 | Dm'
    const ra = chay(DUNG_XA, 2, true, 'linh-nhi')
    /*
      Mỗi nốt phát ra phải là một nốt của một ô nào đó trong bảng, sau khi dịch giọng.
      Ngoại lệ DUY NHẤT là nốt cảm bậc V (`NOT_CAM` trong `giaiDieuDaoLinhNhi.ts`), nên
      cho phép lệch 1 nửa cung ở đúng một hướng.
    */
    const von = new Set<number>()
    for (const t of TUYEN_SOLO.filter((x) => x.thay === 'linh-nhi' && x.thu)) {
      for (const o of t.o) for (const [, cao] of o.n) von.add(((cao % 12) + 12) % 12)
    }
    const la = (m: number) => ((((m - 62) % 12) + 12) % 12)
    const ngoai = ra.filter((e) => {
      const b = la(e.notes[0]!)
      return !von.has(b) && !von.has(((b - 1) % 12 + 12) % 12)
    })
    expect(ngoai.map((e) => e.notes[0]), 'nốt không có trong bảng').toEqual([])
  })
})
