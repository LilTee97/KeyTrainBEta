import { describe, expect, it } from 'vitest'
import { arcDungXa, hutDungXa } from '../daoDungXa'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import type { TimelineEvent } from '../types'

/*
  CÂU DẠO ĐỪNG XA EM ĐÊM NAY — Linh Nhi, ô 1–9, Rê thứ.

  Số trong tệp này lấy thẳng từ `data/sheet-solos/
  linh-nhi-dung-xa-em-dem-nay-linh-nhi-intro.json` (PianoBrain), không suy diễn.
*/

/** Mẫu chín cú gõ của `bolero-linh-nhi-2` — thứ mà vòng cung phải nắn lại. */
const CELL = [0, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5]

/** Số mốc còn lại của một ô thưa. */
const MOC_MO_DAI = 5

const trai = (bars: number): TimelineEvent[] =>
  Array.from({ length: bars }, (_, bar) =>
    CELL.map((at) => ({
      notes: [40 + bar],
      startBeat: bar * 4 + at,
      durationBeats: 0.45,
      hand: 'left' as const,
      velocity: 70,
    })),
  ).flat()

const phai = (bars: number): TimelineEvent[] =>
  Array.from({ length: bars }, (_, bar) =>
    CELL.map((at) => ({
      notes: [70 + bar],
      startBeat: bar * 4 + at,
      durationBeats: 0.45,
      hand: 'right' as const,
      velocity: 70,
    })),
  ).flat()

const oCua = (events: readonly TimelineEvent[], bar: number) =>
  events
    .filter((e) => Math.floor(e.startBeat / 4 + 1e-6) === bar)
    .sort((a, b) => a.startBeat - b.startBeat)

const arc8 = () => arcDungXa({ left: trai(8), melody: phai(8), barBeats: 4, bars: 8 })

/** Ô nào đã bị rút còn năm mốc. */
const oThua = () =>
  [0, 1, 2, 3, 4, 5, 6, 7].filter(
    (bar) => oCua(arc8().left, bar).length <= MOC_MO_DAI,
  )

describe('vòng cung mật độ', () => {
  const arc = arc8()

  /*
    Ô thưa bỏ cặp móc kép 0,5/0,75 — mẫu chín cú gõ đặt cặp ấy ở mọi ô, tức
    tiêu ngay từ ô đầu thứ để dành cho chỗ dày.
  */
  it('ô thưa còn năm mốc, bỏ cặp móc kép', () => {
    for (const bar of [0, 1, 4]) {
      expect(oCua(arc.left, bar).map((e) => e.startBeat - bar * 4), `ô ${bar + 1}`)
        .toEqual([0, 0.5, 2, 3, 3.5])
    }
  })

  /* Chữ ký ô thưa: bậc 5 ở phách 1& ngân QUA phách 2, không phải móc kép. */
  it('nốt phách 1& của ô thưa ngân 1,5 phách', () => {
    for (const bar of [0, 1, 4]) {
      const at = oCua(arc.left, bar).find((e) => e.startBeat === bar * 4 + 0.5)
      expect(at?.durationBeats, `ô ${bar + 1}`).toBe(1.5)
    }
  })

  /*
    Người dùng: "2 ô dày nối tiếp nhau rồi tới thưa" — chu kỳ BA, không phải
    hai. Rồi: "thôi ô 5 cho thưa 100% đi" — nên chỗ thưa là CỐ ĐỊNH, không rút
    thăm theo lượt nữa. Vòng dạo 8 ô thì đúng ba ô thưa: hai ô mở và ô 5.
  */
  it('đúng ba ô thưa: cặp ô mở và ô 5', () => {
    expect(oThua()).toEqual([0, 1, 4])
  })

  /* Ô áp chót là chỗ lấy đà cho ô hút — thưa ở đó thì mất cú vào. */
  it('ô dồn không thưa', () => {
    expect(oThua()).not.toContain(7)
  })

  it('hai ô dày đứng liền trước ô thưa của thân bài', () => {
    for (const bar of [2, 3]) {
      expect(oCua(arc.left, bar).map((e) => e.startBeat - bar * 4), `ô ${bar + 1}`)
        .toEqual(CELL)
    }
  })

  it('ô dày giữ nguyên mẫu chín cú gõ', () => {
    for (const bar of [2, 3, 5, 6]) {
      expect(oCua(arc.left, bar).map((e) => e.startBeat - bar * 4), `ô ${bar + 1}`)
        .toEqual(CELL)
    }
  })

  /*
    Ô 8 bản ký âm: tay trái 16 nốt (chồng bè từ nửa sau ô), tay phải còn 4.
    Hai tay ĐỔI VAI — đó là chỗ lấy đà cho ô hút.
  */
  it('ô áp chót: tay trái chồng bè ở nửa sau, tay phải rút còn bốn nốt', () => {
    const don = oCua(arc.left, 7)
    for (const e of don) {
      const trongO = e.startBeat - 28
      expect(e.notes.length, `phách ${trongO}`).toBe(trongO >= 2 ? 2 : 1)
    }
    expect(oCua(arc.melody, 7)).toHaveLength(4)
  })

  it('tay phải các ô khác không bị rút', () => {
    for (const bar of [0, 2, 6]) {
      expect(oCua(arc.melody, bar), `ô ${bar + 1}`).toHaveLength(CELL.length)
    }
  })
})

describe('ô hút — bậc V dặm MỘT lần', () => {
  /* Bậc V của Rê thứ = La. Ô 9 đặt ở phách 32 (sau tám ô bốn phách). */
  const hut = hutDungXa({ at: 32, hut: 9, barBeats: 4 })

  /* Thế bấm lấy của cú dặm SAU bản ký âm: La2 tay trái, La3 + Đô#4 tay phải. */
  it('một cú, đúng thế bấm cú dặm sau của bản ký âm', () => {
    expect(hut.map((e) => [e.startBeat - 32, e.hand, ...e.notes])).toEqual([
      [0, 'left', 45],
      [0, 'right', 57, 61],
    ])
  })

  /*
    Người dùng: "đừng dặm 2 lần E tràn qua ô hát ca sĩ khó vào hát." Hai luật
    ra từ một câu ấy, và cả hai đều phải có lưới giữ.
  */
  it('không dặm lần hai', () => {
    expect(new Set(hut.map((e) => e.startBeat)).size).toBe(1)
  })

  it('tắt trước vạch nhịp, chừa hơi cho ca sĩ vào', () => {
    for (const e of hut) {
      expect(e.startBeat + e.durationBeats).toBeLessThan(36)
    }
  })

  /*
    Còn một cú thì cú ấy PHẢI mang bậc 3. Bản gốc để dành bậc 3 cho cú sau, mà
    bậc 3 mới là nốt cảm âm kéo về chủ âm — bỏ nó thì ô này chẳng hút gì.
  */
  it('có bậc 3 — nốt cảm âm kéo về chủ âm', () => {
    const bac = hut.flatMap((e) => e.notes).map((n) => ((n % 12) - 9 + 12) % 12)
    expect(bac).toContain(4)
  })

  it('mọi giọng đều dựng được, không rơi ra ngoài đàn', () => {
    for (let pc = 0; pc < 12; pc += 1) {
      const o = hutDungXa({ at: 0, hut: pc as never, barBeats: 4 })
      const notes = o.flatMap((e) => e.notes)
      expect(Math.min(...notes), `bậc V lớp ${pc}`).toBeGreaterThanOrEqual(21)
      expect(Math.max(...notes), `bậc V lớp ${pc}`).toBeLessThanOrEqual(108)
      /* Tay trái luôn dưới tay phải. */
      expect(Math.max(...o[0]!.notes)).toBeLessThan(Math.min(...o[1]!.notes))
    }
  })
})


/*
  Ô THƯA THÌ TAY PHẢI CHỒNG NỐT.

  Người dùng nghe ô tay trái thưa rồi bảo thêm nốt cho tay phải. Bản ký âm Đừng
  Xa nói đúng vậy — ô 1 và 2 là hai ô tay trái thưa nhất, và cũng là hai ô tay
  phải chồng nốt nhiều nhất:

  | ô   | LH mốc | RH nốt/mốc | RH mốc chồng ≥2 |
  |-----|--------|------------|------------------|
  | 1   | 5      | 2,25       | 62%              |
  | 2   | 7      | 1,75       | 62%              |
  | 3–7 | 8–9    | 1,00–1,33  | 0–33%            |

  Điều quan trọng nhất nằm ở cột "RH mốc": bản gốc giữ 8, 8, 7, 7, 7, 6, 8 qua
  bảy ô — gần như KHÔNG đổi. Tay phải chồng nốt trên cùng một cú gõ chứ không
  thêm cú gõ. Thêm mốc là lấp mất khoảng trống tay trái vừa nhường.
*/
describe('ô thưa thì tay phải chồng nốt', () => {
  const HOP_AM = parseChordInput('Am G F C Am G F C').chords

  const chay = () =>
    arcDungXa({
      left: trai(8),
      melody: phai(8),
      barBeats: 4,
      bars: 8,
      chords: HOP_AM,
      beatsPerChord: 4,
    })

  const tyLeChong = (m: readonly TimelineEvent[], bar: number) => {
    const o = oCua(m, bar)
    return o.length === 0 ? 0 : o.filter((e) => e.notes.length >= 2).length / o.length
  }

  it('ô thưa chồng nhiều, ô dày không chồng', () => {
    const { melody } = chay()
    for (const bar of [0, 1, 4]) {
      expect(tyLeChong(melody, bar), `ô thưa ${bar + 1}`).toBeGreaterThan(0.3)
    }
    for (const bar of [2, 3, 5, 6]) {
      expect(tyLeChong(melody, bar), `ô dày ${bar + 1}`).toBe(0)
    }
  })

  /* Luật dễ làm hỏng nhất — chồng nốt, KHÔNG thêm mốc gõ. */
  it('số mốc gõ tay phải ở ô thưa không đổi', () => {
    const truoc = phai(8)
    const { melody } = chay()
    for (const bar of [0, 1, 4]) {
      expect(oCua(melody, bar).length, `ô ${bar + 1}`).toBe(oCua(truoc, bar).length)
    }
  })

  it('nốt chồng không bao giờ chui xuống dưới tay trái', () => {
    const { left, melody } = chay()
    for (const e of melody) {
      const truoc = left.filter((l) => l.startBeat <= e.startBeat + 1e-6)
      if (truoc.length === 0) continue
      const at = Math.max(...truoc.map((l) => l.startBeat))
      const tran = Math.max(
        ...left.filter((l) => Math.abs(l.startBeat - at) < 1e-6).flatMap((l) => l.notes),
      )
      expect(Math.min(...e.notes), `phách ${e.startBeat}`).toBeGreaterThan(tran)
    }
  })

  /* Không có hợp âm thì không chồng — mọi đường gọi cũ giữ nguyên hành vi. */
  it('không truyền hợp âm thì không chồng nốt nào', () => {
    const { melody } = arcDungXa({ left: trai(8), melody: phai(8), barBeats: 4, bars: 8 })
    expect(melody.every((e) => e.notes.length === 1)).toBe(true)
  })
})


/*
  CÂU DẠO ĐỪNG XA LÀ MẶC ĐỊNH CỦA THẦY LINH NHI — không còn ô tick.

  Người dùng nghe xong rồi cho thay hẳn câu dạo cũ, nên `motif: 'dung-xa'`, cờ
  `daoXa` và ô tick đã bị xoá.

  Lưới này giữ hai vế, và vế thứ hai là chỗ đã hỏng một lần: điều kiện phải đọc
  `thay` — thầy người dùng chọn thẳng — chứ không phải `thaySolo`, vì `thaySolo`
  lui về `soloTeacherOf(style.id)` và hàm ấy trả 'linh-nhi' cho MỌI điệu bật cờ
  rải-theo-tay-trái, bossa nova nằm trong đó. Dùng nhầm thì câu dạo bolero bị
  đắp lên bossa và đoạn dạo dài ra một ô.
*/
describe('mặc định cho thầy Linh Nhi', () => {
  const VONG = parseChordInput('Am Dm G C').chords
  const dung = (thay: 'linh-nhi' | undefined, styleId: string) =>
    buildPhraseSection({
      kind: 'intro',
      key: { tonic: 9, scale: 'minor' },
      style: getStyle(styleId)!,
      beatsPerChord: 4,
      dropRoot: false,
      opening: VONG[0]!,
      ...(thay ? { thay } : {}),
      take: 0,
      range: { low: 57, high: 95 },
      solo: () => [],
    })!

  it('chọn Linh Nhi thì tự có ô hút, không cần bật gì', () => {
    const co = dung('linh-nhi', 'bolero-linh-nhi-2')
    /* Vòng bốn ô cộng đúng một ô hút. */
    expect(co.lengthBeats).toBe(20)
    const cuoi = co.events.filter((e) => e.startBeat >= 16)
    expect(cuoi).toHaveLength(2)
    /* Bậc V của La thứ = Mi, và cú dặm mang cả bậc 3. */
    const bac = cuoi.flatMap((e) => e.notes).map((n) => ((n % 12) - 4 + 12) % 12)
    expect(bac).toContain(0)
    expect(bac).toContain(4)
  })

  it('điệu khác KHÔNG bị đắp câu dạo bolero lên', () => {
    expect(dung(undefined, 'bossa-nova-1').lengthBeats).toBe(16)
  })
})
