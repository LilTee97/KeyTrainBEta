import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { phraseChords } from '../phraseChords'

/*
  Đoạn dạo đầu và đoạn kết lấy hợp âm **trong bài**.

  Trước đây hai đoạn này dựng theo bậc `I - V - vi - IV` của giọng, nên bài chạy
  `Am(add9) - Dm9 - Cadd2 - Em7` mà dạo đầu lại kêu `C - G - Am - F`: đúng giọng,
  đúng lý thuyết, và nghe ra là hai bài khác nhau dán cạnh nhau. Màu hợp âm là
  thứ người nghe nhận ra bài, không phải bậc.
*/

const KEY = { tonic: 9, scale: 'minor' } as const
const SONG = 'Am(add9) Dm9 Cadd2 Em7 Fadd2 Am(add9)'

const chords = () => parseChordInput(SONG).chords
const symbols = (list: readonly { symbol: string }[]) => list.map((c) => c.symbol)

describe('hợp âm đoạn dạo mượn từ bài', () => {
  it('dạo đầu chỉ dùng hợp âm có thật trong bài', () => {
    const song = chords()
    const intro = phraseChords('intro', KEY, { songChords: song })
    expect(intro.length).toBeGreaterThan(0)
    for (const chord of intro) {
      expect(symbols(song), chord.symbol).toContain(chord.symbol)
    }
  })

  it('dạo đầu giữ nguyên màu của bài, không rút về ba nốt', () => {
    const intro = phraseChords('intro', KEY, { songChords: chords() })
    expect(intro.some((chord) => chord.quality.id !== 'maj' && chord.quality.id !== 'min')).toBe(true)
  })

  /*
    KẾT BÀI DÀI TÁM Ô TỪ 9/9/2026 — TRƯỚC ĐÓ BA Ô, LUẬT ẤY KHÔNG CÒN.

    Hình ba ô (một ô dẫn rồi hai ô đậu) được đặt lúc chưa có bản ký âm nào của đoạn
    kết để đối chiếu. Đo 9 đoạn kết giọng thứ của cả ba thầy
    (`PianoBrain/tools/sheet/ket_thu.py`, có `--kiem`): **3 tới 12 ô, trung bình
    8,1**; và **chỉ 4 trên 9 bài kết trên hợp âm bậc 1**.

    Cùng lý do với hai lưới "rút hợp âm về chất cơ bản" đã xoá bên dưới: người dùng
    chốt rằng luật họ tự đặt trước khi có tài liệu thì nhường cho số đo, bỏ hẳn chứ
    không dung hoà. Triệu chứng để lùi: đoạn kết nghe cụt, vừa vào đã hết.

    Giữ nguyên hai điều đã đúng: ô đầu là ô **dẫn** (khác hợp âm chủ), và ô cuối đậu
    trên hợp âm chủ **của chính bài** — giữ màu, không phải La thứ trần.
  */
  it('kết bài: ô dẫn ở đầu, tám ô, đậu trên hợp âm chủ của chính bài', () => {
    const outro = phraseChords('outro', KEY, { songChords: chords() })
    expect(outro).toHaveLength(8)
    const cuoi = outro[outro.length - 1]!
    expect(cuoi.root).toBe(9)
    // Màu của bài, không phải La thứ trần.
    expect(cuoi.quality.id).not.toBe('min')
    expect(outro[0]!.symbol).not.toBe(cuoi.symbol)
  })

  it('không có bài thì vẫn dựng theo bậc như cũ', () => {
    expect(symbols(phraseChords('intro', KEY))).toEqual(['C', 'G', 'Am', 'F'])
  })

  /*
    ĐÃ XOÁ HAI LƯỚI "rút hợp âm về chất cơ bản" — LUẬT ẤY KHÔNG CÒN.

    Cờ `plain` / `plainChords` được đặt lúc chưa có bản ký âm của thầy nào. Đo bảy
    bản ký âm Linh Nhi thì đoạn solo giữ **78%** hợp âm trơn còn đoạn hát **77%** —
    tỉ lệ y hệt, tức chị ấy KHÔNG rút hợp âm đoạn không lời về chất trơn.

    Người dùng chốt: luật họ tự đặt trước khi có tài liệu thì nhường cho số đo, và
    bỏ hẳn chứ không dung hoà. Cờ đã xoá khỏi `phraseChords.ts` và `phraseSection.ts`;
    số đo ghi ở đầu `interludeChords.ts`.

    Thứ duy nhất chị ấy tránh ở đoạn solo là `maj7` (20 lần ở đoạn hát, 0 lần trong
    30 hợp âm màu của đoạn solo) — lưới cho nó nằm ở `vonHopAmLinhNhi.test.ts`.
  */
})

/*
  Dạo đầu CHỌN bốn hợp âm hút vào đầu phiên — không chép hết phiên khúc.
  Sheet: dạo 6–18 ô, phiên 16–32 ô.
*/
describe('dạo đầu chọn hợp âm, không copy phiên khúc', () => {
  const DAI = parseChordInput(
    'Am(add9) Fadd2 Cadd2 Em7 Am(add9) Dm9 Cadd2 G7 Am(add9) Fadd2 Cadd2 Em7',
  ).chords

  /*
    ĐÃ ĐỔI THIẾT KẾ, KHÔNG PHẢI NỚI TEST.

    Bản cũ đóng đinh dãy bậc CỐ ĐỊNH `i–♭VII–♭VI–III` = roots [9, 7, 5, 0], giống
    hệt nhau cho mọi bài. Đo bảy bản ký âm Linh Nhi thì ngược lại: **16 trên 20
    đoạn không lời KHÔNG dùng bậc nào ngoài đoạn hát của chính bài ấy**. Người dùng
    chốt đổi sang lối rút từ vốn hợp âm của bài — xem `style/vonHopAmLinhNhi.ts`.

    Vế "không Fadd2" của bản cũ cũng không đứng được: đếm chất hợp âm trên sheet
    thì đoạn solo giữ **78%** hợp âm trơn còn đoạn hát **77%** — tỉ lệ y hệt, tức
    chị ấy KHÔNG rút hợp âm solo về chất trơn. Thứ duy nhất chị ấy bỏ là `maj7`
    (20 lần ở đoạn hát, 0 lần trong 30 hợp âm màu của đoạn solo), và bộ mới đã bỏ.

    Còn giữ lại từ bản cũ: **mở trên hợp âm chủ** — đo bảy đoạn dạo, bốn mở trên
    i/I và một trên vi.
  */
  it('Linh Nhi dạo rút từ vốn hợp âm của bài, mở trên tonic', () => {
    const intro = phraseChords('intro', KEY, {
      songChords: DAI,
      vongPhienKhuc: DAI.slice(0, 8),
      thay: 'linh-nhi',
    })
    expect(intro[0]!.root).toBe(9)

    /* Không sinh bậc nào ngoài bài — trừ bậc V ở ô cuối làm cửa vào hát. */
    const cuaBai = new Set(DAI.map((c) => ((c.root % 12) + 12) % 12))
    const ngoai = intro
      .slice(0, -1)
      .map((c) => ((c.root % 12) + 12) % 12)
      .filter((pc) => !cuaBai.has(pc))
    expect(ngoai).toEqual([])

    /* Giữ trật tự của bài: Am → Fadd2 → Cadd2 → Em7. */
    expect(intro.map((c) => c.root).slice(0, 4)).toEqual([9, 5, 0, 4])
  })

  it('không cho Am(add9) nhảy sang Fadd2', () => {
    const intro = phraseChords('intro', KEY, {
      songChords: DAI,
      vongPhienKhuc: DAI.slice(0, 4),
    })
    for (let i = 1; i < intro.length; i += 1) {
      expect(`${intro[i - 1]!.symbol}→${intro[i]!.symbol}`).not.toBe('Am(add9)→Fadd2')
    }
  })

  it('intro đúng 4 hợp âm, không lấy hết phiên', () => {
    const intro = phraseChords('intro', KEY, {
      songChords: DAI,
      vongPhienKhuc: DAI.slice(0, 8),
    })
    expect(intro).toHaveLength(4)
    expect(symbols(intro)).not.toEqual(symbols(DAI.slice(0, 8)))
  })

  it('không có vòng phiên thì vẫn chọn 4 từ bài', () => {
    const intro = phraseChords('intro', KEY, { songChords: chords(), vongPhienKhuc: [] })
    expect(intro).toHaveLength(4)
  })

  it('kết bài vẫn là dẫn rồi đậu chủ, không copy phiên', () => {
    const VONG = parseChordInput('Am(add9) Fadd2 Cadd2 Em7').chords
    const outro = phraseChords('outro', KEY, {
      songChords: chords(),
      vongPhienKhuc: VONG,
    })
    expect(outro).toHaveLength(8)
    expect(symbols(outro)).not.toEqual(symbols(VONG))
  })
})
