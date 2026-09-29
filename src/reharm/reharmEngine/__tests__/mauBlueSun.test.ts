import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { colorBlueSun, luotBlueSun } from '../mauBlueSun'
import { reharmonize } from '../reharmPipeline'

/*
  Màu Blues cho nút Blue Sun — số đo ba sheet ở `scripts/phan_tich_blues_ba_sheet.py --mau` (chú thích đầu `mauBlueSun.ts`).
  Bản 2 (người dùng: "các hợp âm khi đánh đệm nghe bị phô"): màu thử theo thứ tự số đo, bỏ màu nào thêm nốt NGOÀI GIỌNG.
*/
const parse = (s: string) => parseChordInput(s).chords
const ten = (s: string, key: { tonic: number; scale: 'major' | 'minor' } | null) => colorBlueSun(parse(s), key).map(c => c.symbol)
const pc = (n: number) => ((n % 12) + 12) % 12

describe('Blue Sun — tô màu hợp âm Blues (bản 2: trong giọng)', () => {
  it('bài người dùng thử (Mi thứ): i → m9 · III → 6/9 · v thứ giữ m7 · iv giàu sẵn giữ · bVII giữ 9 — mọi nốt trong giọng', () => {
    const k = { tonic: 4, scale: 'minor' as const }
    const c = colorBlueSun(parse('Em(add9) Gadd2 Bm7 Em(add9) Gadd2 Em(add9) Am9 Em(add9) D9 Bm7'), k)
    expect(c.map(x => x.symbol)).toEqual(['Em9', 'G6/9', 'Bm7', 'Em9', 'G6/9', 'Em9', 'Am9', 'Em9', 'D9', 'Bm7'])
    const giong = new Set([0, 2, 3, 5, 7, 8, 10].map(x => pc(x + 4)))
    for (const x of c) for (const v of x.quality.intervals) expect(giong.has(pc(v + x.root)), x.symbol).toBe(true)
  })

  it('giọng trưởng: I → 6/9 · IV → 6/9 · V → 9 · thứ → m9 (m7 nếu 9 ngoài giọng) · trưởng khác → 7 nếu b7 trong giọng', () => {
    // Bộ đọc hợp âm của app gọi Bb là A# ngay từ đầu vào (mọi nút) — giữ đúng cách gọi ấy.
    expect(ten('C Am F G7 Dm E Cmaj7 Bdim Gsus4 A Bb Em', { tonic: 0, scale: 'major' }))
      .toEqual(['C6/9', 'Am9', 'F6/9', 'G9', 'Dm9', 'E7', 'C6/9', 'Bdim', 'Gsus4', 'A7', 'A#6/9', 'Em7'])
  })

  it('giọng thứ: V trưởng → 7#9 · iv → m9 · bVI · III → 6/9 · bVII · IV trưởng → 9 · nửa giảm giữ', () => {
    expect(ten('Am Dm E F G C D Bm7b5 E7', { tonic: 9, scale: 'minor' }))
      .toEqual(['Am9', 'Dm9', 'E7#9', 'F6/9', 'G9', 'C6/9', 'D9', 'Bm7b5', 'E7#9'])
  })

  it('không hạ màu; giữ bass của hợp âm gạch chéo; hợp âm lướt giữ nguyên; chưa biết giọng thì không đổi', () => {
    expect(ten('Dm11 G13 C/E', { tonic: 0, scale: 'major' })).toEqual(['Dm11', 'G13', 'C6/9/E'])
    const c = parse('C G')
    c[1] = { ...c[1]!, passing: true }
    expect(colorBlueSun(c, { tonic: 0, scale: 'major' }).map(x => x.symbol)).toEqual(['C6/9', 'G'])
    expect(ten('C F G', null)).toEqual(['C', 'F', 'G'])
  })

  it('qua `reharmonize` với harmonyStyle "blue-sun"', () => {
    const key = { tonic: 4, scale: 'minor' as const }
    expect(reharmonize(parse('Em Gadd2 Bm7 Am'), { key, harmonyStyle: 'blue-sun', beatsPerChord: 3 }).colored.map(c => c.symbol))
      .toEqual(['Em9', 'G6/9', 'Bm7', 'Am9'])
  })
})

describe('Blue Sun — hợp âm lướt Blues ở cuối đoạn (ô tick)', () => {
  const key = { tonic: 4, scale: 'minor' as const }
  it('ô cuối đoạn: đoạn sau mở bằng chủ — ô cuối là V → bII7, không phải V → V7#9; mở bằng hợp âm khác → giảm bảy nửa cung dưới', () => {
    const c = parse('Em G B7 Em Am D Em G Am')
    const s = luotBlueSun(c, key, [{ from: 0, to: 2 }, { from: 3, to: 5 }, { from: 6, to: 7 }, { from: 8, to: 8 }], 3)
    expect(s.map(x => [x.insertBeforeIndex, x.chords[0]!.symbol, x.hostKeepBeats])).toEqual([
      [3, 'F7', 1.5], // B7 → Em: thay tritone
      [6, 'B7#9', 1.5], // D → Em: V7#9 của chủ
      [8, 'G#dim7', 1.5], // G → Am: giảm nửa cung dưới
    ])
  })

  it('bật cờ: hợp âm lướt vào bài, chiếm NỬA SAU ô cuối đoạn (hợp âm chủ giữ nửa đầu); tắt cờ: không chèn', () => {
    const sectionRanges = [{ kind: 'verse', from: 0, to: 1 }, { kind: 'chorus', from: 2, to: 3 }]
    const r = reharmonize(parse('Em B7 Em Am'), { key, harmonyStyle: 'blue-sun', bluesLuot: true, beatsPerChord: 3, sectionRanges })
    expect(r.harmonic.map(c => `${c.symbol}${c.passing ? '·lướt' : ''}:${c.beats ?? 3}`)).toEqual(['Em9:3', 'B7#9:1.5', 'F7·lướt:1.5', 'Em9:3', 'Am9:3'])
    const tat = reharmonize(parse('Em B7 Em Am'), { key, harmonyStyle: 'blue-sun', beatsPerChord: 3, sectionRanges })
    expect(tat.harmonic.some(c => c.passing)).toBe(false)
  })
})
