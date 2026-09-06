import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { TUYEN_SOLO } from '../tuyenSolo'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  ĐOẠN DẠO GIỌNG TRƯỞNG — SO VỚI CHÍNH BẢN KÝ ÂM CỦA LINH NHI.

  Người dùng đặt: *"train bộ soạn trên 10 vòng hợp âm trưởng theo các màu khác nhau cho
  đến khi nào chúng sinh ra giai điệu đúng cao độ… Cấm không được copy nguyên câu intro."*

  MỐC ĐO là ba đoạn dạo giọng trưởng của chị — Biển Tình · Đường Xưa Lối Cũ · Mùa Xuân
  Đầu Tiên, **141 nốt**:

  | | bản ký âm |
  |---|---|
  | nốt của hợp âm đang vang | 68,1% |
  | nốt LẠC (ngoài gam VÀ ngoài hợp âm) | 1,4% |
  | cao độ trung bình | 75,3 |
  | quãng ba tăng với gốc (`♭5`) | 2,2% |
  | bước: liền bậc · quãng ba · nhảy 8+ · quãng 4-5 · lặp | 32 · 25 · 25 · 13 · 6 |

  MƯỜI VÒNG khác màu: trơn · add2/9 · maj7 · nặng bậc IV · canon · có ♭VII · treo · át
  phụ, và hai vòng ở giọng khác (Sol, Rê) để bắt lỗi bám một chủ âm.

  KHOẢNG DUNG SAI đặt rộng có chủ ý — cỡ mẫu bản ký âm chỉ 141 nốt, siết chặt hơn là siết
  vào nhiễu chứ không phải vào nét đàn.
*/

const VONG: readonly [string, number][] = [
  ['C | Am | Dm | G | C | Am | Dm | G', 0],
  ['Cadd2 | Am9 | Dm11 | Fadd2 | Em7 | G9sus4 | Cadd2 | G9sus4', 0],
  ['Cmaj7 | Am7 | Dm7 | G7 | Cmaj7 | Fmaj7 | Dm7 | G7', 0],
  ['C | F | C | F | Dm | G | C | F', 0],
  ['C | G | Am | Em | F | C | F | G', 0],
  ['C | Bb | F | C | Am | Bb | F | G', 0],
  ['Csus4 | C | F | Fmaj7 | G7sus4 | G7 | C | G', 0],
  ['Cmaj7 | A7 | Dm9 | G7 | Cmaj7 | Em7 | A7 | Dm7', 0],
  ['G | Em | C | D | G | Bm | C | D', 7],
  ['D | Bm | G | A | D | F#m | G | A', 2],
]

const GAM = [0, 2, 4, 5, 7, 9, 11]
const LUOT = 6

const chay = (txt: string, tonic: number, take: number) =>
  giaiDieuDaoLinhNhi({
    left: [],
    chords: parseChordInput(txt).chords,
    beatsPerChord: 4,
    barBeats: 4,
    range: { low: 57, high: 95 },
    tonic: tonic as PitchClass,
    minor: false,
    take,
  })

/** Đo cả mười vòng một lượt, trả về các tỉ lệ để so với bản ký âm. */
function do10() {
  let n = 0, hop = 0, lac = 0, cao = 0, b5 = 0
  const buoc: Record<string, number> = {}
  for (const [txt, tonic] of VONG) {
    const chords = parseChordInput(txt).chords
    for (let take = 0; take < LUOT; take += 1) {
      const ev = chay(txt, tonic, take)
      const notes = ev.map((e) => ({ b: e.startBeat, m: e.notes[0]! }))
      for (const { b, m } of notes) {
        n += 1
        cao += m
        const ch = chords[Math.min(chords.length - 1, Math.floor(b / 4))]!
        const rel = (((m - ch.root) % 12) + 12) % 12
        const trongHop = ch.quality.intervals.includes(rel)
        if (trongHop) hop += 1
        if (rel === 6) b5 += 1
        /* Nốt ngoài gam mà THUỘC hợp âm thì đúng — vòng có `Bb` hay `A7` chẳng hạn. */
        if (!GAM.includes((((m - tonic) % 12) + 12) % 12) && !trongHop) lac += 1
      }
      for (let i = 1; i < notes.length; i += 1) {
        const dd = Math.abs(notes[i]!.m - notes[i - 1]!.m)
        const k =
          dd === 0 ? 'lặp' : dd <= 2 ? 'liền' : dd <= 4 ? 'ba' : dd <= 7 ? 'bốnNăm' : 'nhảy'
        buoc[k] = (buoc[k] ?? 0) + 1
      }
    }
  }
  const tb = Object.values(buoc).reduce((a, b) => a + b, 0)
  const ti = (k: string) => (buoc[k] ?? 0) / tb
  return {
    n,
    hop: hop / n,
    lac: lac / n,
    cao: cao / n,
    b5: b5 / n,
    lien: ti('liền'),
    ba: ti('ba'),
    nhay: ti('nhảy'),
  }
}

describe('đoạn dạo giọng trưởng — đo trên 10 vòng khác màu', () => {
  const r = do10()

  it('cỡ mẫu đủ lớn để tin', () => {
    expect(r.n).toBeGreaterThan(2000)
  })

  it('CAO ĐỘ đúng tầm chị ấy — 75,3', () => {
    /*
      Số cũ dùng chung một hằng số 73,6 cho cả hai giọng, lấy trung bình bảy đoạn dạo.
      Tách ra thì trưởng 75,3 (75,2 · 74,5 · 76,0 — rất chụm) và thứ 73,2.
    */
    expect(Math.abs(r.cao - 75.3), `tầm ${r.cao.toFixed(1)}`).toBeLessThan(1.5)
  })

  it('NỐT LẠC không nhiều hơn bản ký âm — 1,4%', () => {
    /*
      Chỗ này từng là 3,6%: mở vốn ô sang giang tấu và đoạn kết để chữa bậc IV thì nhập
      luôn đám chromatic của hợp âm mượn. Xem luật "ô mượn phải sạch gam" trong `locO`.
    */
    expect(r.lac, `lạc ${(100 * r.lac).toFixed(1)}%`).toBeLessThan(0.02)
  })

  it('QUÃNG BA TĂNG với gốc hợp âm — bản ký âm 2,2%', () => {
    /* Chỗ `Fadd2` người dùng chỉ đích danh; từng là 31%. */
    expect(r.b5, `♭5 ${(100 * r.b5).toFixed(1)}%`).toBeLessThan(0.05)
  })

  it('NỐT HỢP ÂM quanh mức 68%', () => {
    expect(r.hop, `hợp âm ${(100 * r.hop).toFixed(1)}%`).toBeGreaterThan(0.6)
    expect(r.hop).toBeLessThan(0.76)
  })

  it('BƯỚC ĐI cùng dáng với bản ký âm', () => {
    /* Bản ký âm: liền 32% · quãng ba 25% · nhảy 8+ 25%. */
    expect(r.lien, `liền bậc ${(100 * r.lien).toFixed(0)}%`).toBeGreaterThan(0.25)
    expect(Math.abs(r.ba - 0.25), `quãng ba ${(100 * r.ba).toFixed(0)}%`).toBeLessThan(0.08)
    expect(r.nhay, `nhảy 8+ ${(100 * r.nhay).toFixed(0)}%`).toBeLessThan(0.32)
  })
})

describe('CẤM CHÉP NGUYÊN CÂU INTRO', () => {
  /*
    Người dùng chốt: *"Cấm không được copy nguyên câu intro."*

    Đọc cho đúng: cấm **dán lại nguyên một câu dạo có sẵn**, chứ không cấm dùng ô có thật
    — bộ ghép sống bằng ô thật, và luật "mọi nốt đều thật" vẫn còn nguyên ở
    `giaiDieuDaoLinhNhi.test.ts`.

    Nên kiểm hai điều: câu phải **ghép từ nhiều nguồn**, và **không được là một dãy ô liên
    tiếp của cùng một câu dạo**.
  */
  const von = TUYEN_SOLO.filter((t) => t.thay === 'linh-nhi' && !t.thu && t.phach === 4)

  const nguonCua = (ev: ReturnType<typeof chay>, soO: number) => {
    const ra: string[] = []
    for (let o = 0; o < soO; o += 1) {
      const moc = ev
        .filter((e) => Math.floor(e.startBeat / 4) === o)
        .map((e) => [Math.round((e.startBeat % 4) * 1000), e.notes[0]!] as const)
      const hop = von.flatMap((t) =>
        t.o.map((x, i) => ({ id: `${t.id}#${i}`, x })),
      ).filter(({ x }) => {
        if (x.n.length !== moc.length || moc.length === 0) return false
        if (x.n.some((nn, i) => Math.round(nn[0] * 1000) !== moc[i]![0])) return false
        const lech = x.n.map((nn, i) => ((((moc[i]![1] - nn[1]) % 12) + 12) % 12))
        return lech.every((z) => z === lech[0])
      })
      ra.push(hop[0]?.id ?? '?')
    }
    return ra
  }

  it('không câu nào là một dãy ô liên tiếp của cùng một câu dạo', () => {
    for (const [txt, tonic] of VONG) {
      const soO = parseChordInput(txt).chords.length
      for (let take = 0; take < LUOT; take += 1) {
        const nguon = nguonCua(chay(txt, tonic, take), soO)
        const biet = nguon.filter((x) => x !== '?')
        if (biet.length < 2) continue
        const bai = new Set(biet.map((x) => x.split('#')[0]))
        const soO2 = biet.map((x) => Number(x.split('#')[1]))
        const lienTiep =
          bai.size === 1 && soO2.every((v, i) => i === 0 || v === soO2[i - 1]! + 1)
        expect(lienTiep, `${txt} / lượt ${take}: ${nguon.join(' ')}`).toBe(false)
      }
    }
  })
})
