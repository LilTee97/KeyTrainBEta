import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import { parseChordInput } from '../input/chordInputParser'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import type { ParsedChord } from '../types'
import { chordStarts, mainChordSpans } from '../chordTiming'
import kho from './bluesClaudeO.json'
import khoSun from './blueSunO.json'
import { renderPattern } from './patternRenderer'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

/*
  BỘ SOẠN BLUES (lượt 5, 28/9/2026) — một chỗ lo cả CÂU SOLO (dạo · giang · kết) lẫn CÂU SOLO NGẮN CHÈN vào phần đệm hát.
  Người dùng: *"Hãy train bộ soạn lại cho các câu solo để soạn nốt giai điệu màu Blues chuẩn hơn vì giai điệu còn phô. Hãy tạo
  một Bộ Soạn Blues chuyên đảm nhận soạn câu solo và chèn những đoạn solo ngắn trong phần đệm hát."* Phần đệm (Bùm₁ – Chát₄)
  người dùng đã nghe "tạm ổn" — không đụng (styleLibrary/bluesClaude.ts).

  VẬT LIỆU — tay phải nguyên từng nửa ô *Rockhouse* (Ray Charles) = một ô 6/8 = một hợp âm (`bluesClaudeO.json`, sinh bằng
  `scripts/phan_tich_blues_nua_o.py --kho`). Mỗi nốt trả lời được "nửa ô nào của Rockhouse".

  NỐT BLUES BÁM CHỦ ÂM, KHÔNG BÁM HỢP ÂM (số đo `scripts/phan_tich_blues_giai_dieu.py`, nốt đỉnh tay phải, so chủ âm):
    · Rockhouse n=810: I → 1 37% · 5 16% · 6 13% · 3 10% · 2 8% · b3 6% · b7 4%; IV → 1 26% · 6 16% · b3 15% · 2 15% · 5 12%;
      V → 5 27% · 2 13% · 1 12% · 6 10% · b7 8% · 4 8%. Phách mạnh: I 1 · 6 · 3; IV 6 · 1 · b3; V 5 · 1 · 6.
    · TRÊN IV BẬC 3 TRƯỞNG CỦA CHỦ BỊ HẠ THÀNH b3 — Rockhouse 3 lần / b3 31 lần (199 nốt); Robert 0 / 25 (110 nốt). Trên I
      dùng cả hai: Rockhouse 52 / 33, Robert 18 / 19. (b3 của chủ = b7 của IV.)
    · Nốt blue đi đâu: b3 → 2 (18) · 1 (16) · trượt lên 3 (12); b7 → 5 (17/34); b6 → 6 (5/8).
  → Dời câu theo GIỌNG bài (một phép dời cho cả đoạn), không theo gốc từng hợp âm; chọn câu hợp hợp âm bằng bộ lọc.
  Lượt 4 dời câu chèn theo gốc TỪNG hợp âm và hạ bậc 3/7 trên hợp âm thứ — đo trên 6 vòng bài × 6 lượt: câu chèn LẠC GIỌNG
  9,3% (giọng thứ 14,7%); solo 12 giọng × 2 × 3 đoạn × 9 lượt: lạc giọng 7,5% (thứ 12,0%), chỏi hợp âm 4,6%.

  GIỌNG THỨ — không có sheet blues thứ. Ngũ cung trưởng của giọng trưởng TƯƠNG ĐỐI trùng hẳn ngũ cung thứ của bài (Đô:
  C D E G A = La thứ: A C D E G), và nốt blue b3 của Đô (Eb) chính là b5 — nốt blue của La thứ. Nên câu của Ray đặt vào
  giọng trưởng tương đối (chủ + 3) thành âm giai blues thứ mà KHÔNG sửa nốt nào. Chức năng: i · bIII ← câu I của Ray;
  iv ← câu IV hoặc I; bVI ← câu IV (IV của trưởng tương đối); V7 · bVII ← câu V (V của trưởng tương đối — trên E7 ra G = #9,
  F = b9, C = b13: màu E7#9 của đoạn đàn mẫu thứ trong video Đức Thịnh). Đây là suy luận của Claude trên lý thuyết âm giai.

  TIN RAY TRÊN HỢP ÂM CỦA RAY: giọng trưởng, hợp âm I · IV · V dùng nửa ô Ray cùng chức năng — không lọc (`cuaRay`), chỉ
  giữ LUẬT BẬC BA BLUE trên IV (không bậc 3 trưởng của chủ, trừ cặp láy b3+3 — `baBlueIV`).
  BỘ LỌC (chỗ Ray chưa chơi: giọng thứ, hợp âm ngoài I · IV · V; `hopVoi`): mọi nốt thuộc giọng + nốt blue (trưởng: bỏ b2 ·
  b6; thứ: bỏ b2 · 3 · 6 · 7 trưởng, 7 chỉ được trên V); không nốt nào chỏi hẳn (b9 — trừ V7 giọng thứ —, 3 trưởng trên hợp
  âm thứ, 7 trưởng NGÂN trên hợp âm bảy); nốt ở phách 1 · 4 hoặc ngân ≥ 2 móc đơn không phải nốt tránh (trưởng/bảy: b9 · 4 ·
  #4 · b6; thứ: b9 · 3 · b5 · 7). NỐT LÁY (láy chồng, trượt nửa cung) được miễn luật phách mạnh (giọng trưởng: cả luật lạc
  giọng); chủ âm trên V và b5 của chủ trên I được miễn ở phách mạnh — cả ba là lối của Ray đã đo (xem `hopVoi`).

  KHUNG 12 Ô — AAB, số đo Rockhouse 9 vòng: nhịp ô 1 → ô 5 (I → IV) giống 0,66 (4/9 vòng trùng hẳn), ô 1 → ô 9 (I → V)
  0,46; nét ô 1 → ô 5 0,14. Tức câu A' ở IV giữ nhịp câu A, đổi nốt; câu B ở V là chất liệu mới. Nên mỗi ô của đoạn đàn
  nhắm đúng VỊ TRÍ khung trong vòng nhà của Ray: A (ô 1–4) ← ô 1–2 của Ray; A' (ô 5–8) ← ô 5 và ô 7; B (ô 9–11) ← ô 9 · 10 · 11.
  Một ô 4/4 của Ray = hai ô 6/8 (hai hợp âm) của người dùng.
*/

type Su = [number, number, number[]]
export type NuaO = {
  id: string; gi: number; vong: number; goc: number; ham: number; doi: boolean; tex: 'riff' | 'don' | 'doi' | 'nghi'
  su: Su[]; vao: boolean; hoDau: number; hoCuoi: number; dau: number | null; cuoi: number | null
}
export const KHO_O: readonly NuaO[] = (kho as unknown as { o: NuaO[] }).o
export type SuDat = { t: number; d: number; notes: number[] }
type Giong = { tonic: number; scale: string }

/** Rockhouse ở giọng Sol. */
const NGUON = 7
/** Tầm tay phải (MIDI). Rockhouse chạy câu từ G3 tới G5, riff chạm C6. */
const THAP = 45, CAO = 88
const pc = (n: number) => ((n % 12) + 12) % 12
/*
  NỐT CHÓI so hợp âm đang vang (Bản Blues rút gọn, 29/9/2026). Người dùng, bài "Thành phố buồn", ô D9 hết câu ("…làm hồng môi em"):
  *"khi chơi điệu Blues Sun mặc định thì chỗ D9 chơi ko bị chói tai … Khi tick vào ô Blues rút gọn thì chỗ D9 chơi nghe chói tai hơn"*.
  Đo (Bm7 D9 X Em9, D9 hết câu, X ∈ 5 hợp âm × 3 lượt): tay trái đi chuỗi G3 · F#3 vào Em — G3 trên D9 là bậc 11, chồng nửa cung lên
  F# của hợp âm, ở bè trầm, lực 66; tay phải đáp C5+E5 trên Em9 (C = b13 — bộ lọc cũ chỉ xét nốt đỉnh E5); G4 · G5 ngân trên D9.
  `tranhVang`: không phải nốt hợp âm mà nửa cung TRÊN một nốt hợp âm — b9 · 11 trên hợp âm trưởng · b13 (nốt tránh của lý thuyết hoà
  âm). `satNuaCung`: rộng hơn — nửa cung trên HOẶC dưới (thêm 13 trên hợp âm bảy · 7 trưởng trên hợp âm 6), dùng cho tay trái vì bè
  trầm chồng nửa cung là chói nhất.
*/
const hopPc = (c: ParsedChord) => c.quality.intervals.map(v => pc(v + c.root))
const tranhVang = (c: ParsedChord, x: number) => !hopPc(c).includes(pc(x)) && hopPc(c).includes(pc(x - 1))
const satNuaCung = (c: ParsedChord, x: number) => !hopPc(c).includes(pc(x)) && (hopPc(c).includes(pc(x - 1)) || hopPc(c).includes(pc(x + 1)))

export function laHopAmThu(chord: ParsedChord) {
  const iv = chord.quality.intervals
  return iv.includes(3) && !iv.includes(4)
}
const laHopAmBay = (chord: ParsedChord) => chord.quality.intervals.includes(10) && chord.quality.intervals.includes(4)

/** Phá thế hoà giữa các nửa ô ngang điểm theo lượt — không quyết nốt nào. */
export const bam = (a: number, b: number) => (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)) >>> 0

const vaoTam = (tat: number[], doi: number) => {
  while (Math.max(...tat) + doi > CAO) doi -= 12
  while (Math.min(...tat) + doi < THAP) doi += 12
  return Math.max(...tat) + doi > CAO ? null : doi
}

/** Chủ âm của vật liệu: giọng trưởng → chủ âm bài; giọng thứ → giọng trưởng tương đối (chủ + 3). */
const chuVatLieu = (g: Giong) => (g.scale === 'minor' ? pc(g.tonic + 3) : g.tonic)

/**
 * Dời NGUYÊN một nửa ô theo GIỌNG bài (không theo gốc hợp âm): quãng tám gần nguồn nhất (−5..+6 nửa cung) rồi nắn cả nửa
 * ô vào tầm. Không sửa nốt nào. `null` = không vừa tầm. `t`, `d`: móc đơn tính từ đầu ô; `d` có thể vượt vạch ô.
 */
export function datTheoGiong(o: NuaO, g: Giong): SuDat[] | null {
  const tat = o.su.flatMap(s => s[2])
  if (!tat.length) return []
  let doi = pc(chuVatLieu(g) - NGUON)
  if (doi > 6) doi -= 12
  const d = vaoTam(tat, doi)
  if (d === null) return null
  return o.su.map(([t, dd, ns]) => ({ t, d: dd, notes: [...new Set(ns.map(n => n + d))].sort((a, b) => a - b) }))
}

/**
 * Chỉ dùng cho ĐUÔI KẾT chép nguyên (Rockhouse ô 113–114): dời theo gốc hợp âm; hợp âm thứ → bậc 3 · 7 trưởng hạ nửa cung.
 * Câu đuôi là câu blues trên chính chủ âm (G · C# · F · D …) nên dời theo gốc I / IV cũng là dời theo giọng.
 */
export function datNuaO(o: NuaO, goc: number, thu: boolean): SuDat[] | null {
  const tat = o.su.flatMap(s => s[2])
  if (!tat.length) return []
  let doi = pc(goc - o.goc)
  if (doi > 6) doi -= 12
  const d = vaoTam(tat, doi)
  if (d === null) return null
  return o.su.map(([t, dd, ns]) => ({
    t, d: dd,
    notes: [...new Set(ns.map(n => {
      const m = n + d
      const r = pc(m - goc)
      return thu && (r === 4 || r === 11) ? m - 1 : m
    }))].sort((a, b) => a - b),
  }))
}

/** Nốt lạc giọng (so chủ âm): trưởng — b2 · b6; thứ — b2 · 3 · 6 · 7 trưởng (7 trưởng được trên hợp âm V). */
export function lacGiong(note: number, g: Giong, chord: ParsedChord) {
  const p = pc(note - g.tonic)
  if (g.scale !== 'minor') return p === 1 || p === 8
  return p === 1 || p === 4 || p === 9 || (p === 11 && pc(chord.root - g.tonic) !== 7)
}

/** Nốt tránh so gốc hợp âm — không đặt ở phách 1 · 4 hay ngân dài. */
export function notTranh(p: number, chord: ParsedChord) {
  return laHopAmThu(chord) ? [1, 4, 6, 11].includes(p) : [1, 5, 6, 8].includes(p) || (laHopAmBay(chord) && p === 11)
}

/**
 * NỐT LÁY (kỹ thuật blues của Ray — láy chồng 13 cặp trong 12/74 câu; b3 → 3 trượt 12 lần; b6 → 6 trượt 5/8): nốt thấp
 * của cặp nửa cung đánh CÙNG LÚC (Eb+E, Bb+B, C#+D), hoặc nốt ngắn (≤ 1 móc đơn) trượt nửa cung vào nốt ngay sau nó.
 */
export function laNotLay(dat: readonly SuDat[], i: number, n: number) {
  const s = dat[i]!
  if (s.notes.includes(n + 1)) return true
  const sau = dat[i + 1]
  return !!sau && s.d <= 1 + 1e-9 && sau.t - s.t <= 1 + 1e-9 && (sau.notes.includes(n + 1) || sau.notes.includes(n - 1))
}

/**
 * Nửa ô (đã đặt) dùng được trên hợp âm này không. `dai` = số móc đơn tối đa một nốt được ngân trong ô.
 *
 * Luật "nốt tránh" của nhạc lý jazz TRÁI với lối blues đã đo — lượt 5 bản đầu lọc theo nó thì loại 90/203 nửa ô của chính
 * Ray trên chính hợp âm của Ray (b6 láy 29 · bậc 4 phách mạnh trên I 25 — riff IV-trên-I · 7 trưởng lướt 22 · b5 phách mạnh
 * trên I 15 · chủ âm phách mạnh trên V 14). Nên: nốt láy được miễn; chủ âm trên V (Ray: phách mạnh trên V 17% là chủ âm)
 * và b5 của chủ trên I (nốt blue) được miễn ở phách mạnh. Còn lại giữ: lạc giọng, 3 trưởng trên hợp âm thứ, 7 trưởng ngân
 * trên hợp âm bảy, b9 (trừ V7 giọng thứ), nốt tránh ở phách 1 · 4 / nốt ngân.
 */
export function hopVoi(dat: readonly SuDat[], chord: ParsedChord, g: Giong, dai = 6) {
  const iv = chord.quality.intervals
  if ((iv.includes(6) || iv.includes(8)) && !iv.includes(7)) return false
  const v7Thu = g.scale === 'minor' && laHopAmBay(chord)
  const f = pc(chord.root - g.tonic)
  if (g.scale !== 'minor' && f === 5 && !baBlueIV(dat, g)) return false
  return dat.every((s, i) => s.notes.every(n => {
    const p = pc(n - chord.root)
    const k = pc(n - g.tonic)
    const ngan = Math.min(s.d, dai - s.t) >= 2
    // Chỏi cứng — nốt láy cũng không được miễn.
    if ((p === 1 && !v7Thu) || (laHopAmThu(chord) && p === 4) || (laHopAmBay(chord) && p === 11 && ngan)) return false
    // Giọng thứ: nốt láy KHÔNG được miễn luật lạc giọng — vật liệu ở giọng trưởng tương đối biến b5 blue của Ray thành bậc 6
    // trưởng, láy b6 → 6 thành 7 → 1 (đo bằng mắt La thứ lượt 0: F#→F và G#+A trên Am7, lạc với bài thứ dùng F · G thường).
    const lay = laNotLay(dat, i, n)
    if (lacGiong(n, g, chord) && !(lay && g.scale !== 'minor')) return false
    if (lay) return true
    const manh = Math.abs(s.t) < 1e-6 || Math.abs(s.t - 3) < 1e-6 || ngan
    if (!manh) return true
    if ((f === 7 && k === 0) || (f === 0 && k === 6)) return true
    return !notTranh(p, chord)
  }))
}

/**
 * LUẬT BẬC BA BLUE — trên hợp âm IV không có bậc 3 trưởng của CHỦ (Rockhouse 3 lần / b3 31 lần trong 199 nốt; Robert 0 /
 * 25 trong 110), trừ khi nó là nốt trên của cặp láy b3+3 đánh cùng lúc. Áp cả cho câu của Ray.
 */
const baBlueIV = (dat: readonly SuDat[], g: Giong) =>
  dat.every(s => s.notes.every(n => pc(n - g.tonic) !== 4 || s.notes.includes(n - 1)))

/** Nửa ô của Ray đặt trên CHÍNH hợp âm cùng chức năng của Ray (giọng trưởng, I · IV · V) — nốt của Ray, tin Ray, chỉ giữ
 *  luật bậc ba blue trên IV. */
const cuaRay = (o: NuaO, dat: readonly SuDat[], chord: ParsedChord, g: Giong) =>
  g.scale !== 'minor' && !laHopAmThu(chord) && pc(chord.root - g.tonic) === o.ham && (o.ham !== 5 || baBlueIV(dat, g))

/**
 * Chức năng câu nguồn (0 · 5 · 7 = câu trên I · IV · V của Rockhouse) ưu tiên cho một hợp âm. Trưởng: I/IV/V đúng chức
 * năng, hợp âm khác thử cả ba (qua bộ lọc). Thứ (vật liệu ở giọng trưởng tương đối): i · bIII ← I; iv ← IV, I; bVI ← IV;
 * V · bVII ← V.
 */
export function hamUuTien(chord: ParsedChord, g: Giong): number[] {
  const f = pc(chord.root - g.tonic)
  if (g.scale === 'minor') {
    return f === 0 || f === 3 ? [0] : f === 5 ? [5, 0] : f === 8 ? [5] : f === 7 || f === 10 ? [7] : [0, 5, 7]
  }
  return !laHopAmThu(chord) && [0, 5, 7].includes(f) ? [f] : [0, 5, 7]
}

/**
 * CÂU SOLO NGẮN CHÈN VÀO ĐOẠN HÁT (chỗ fill — app đặt ở chỗ ca sĩ hết câu, `breaths`: đúng lối hỏi–đáp của blues). Một nửa
 * ô Rockhouse nốt đơn / bè đôi (riff để dành cho đoạn đàn) đặt lên ô 6/8 cuối của hợp âm, giữ NGUYÊN vị trí phách trong ô,
 * dời theo giọng bài, qua bộ lọc hợp âm. Chỉ nhận nửa ô có mọi cú trong cửa sổ fill; ưu tiên đúng chức năng, rồi nửa ô chừa
 * phách 1 cho bass. `null` = không có nửa ô vừa (không dồn câu, không vá nốt).
 */
export function chayBluesClaude(o: {
  chord: ParsedChord
  next: ParsedChord
  endBeat: number
  beats: number
  take: number
  key: Giong | null
  mocDon: number
  /** Lượt 6 (ô tick): SOẠN từ nhóm ba (`soanCauBlues`) các nhóm ba nằm trọn trong cửa sổ fill. */
  soan?: boolean
}): { note: number; startBeat: number; durationBeats: number; hand: 'right' }[] | null {
  if (!o.key) return null
  const key = o.key
  const dauO = o.endBeat - 6 * o.mocDon
  const tu = Math.max(0, 6 - o.beats / o.mocDon - 1e-6)
  if (o.soan) {
    const nhom = Math.ceil(tu / 3 - 1e-6)
    if (nhom >= 2) return null
    const r = soanCauBlues([{ chord: o.chord, start: dauO + nhom * 3 * o.mocDon, beats: (2 - nhom) * 3 * o.mocDon }], {
      key, take: o.take, mocDon: o.mocDon, uuTien: 'ray', tam: [THAP, CAO], chiGiaiDieu: true,
      day: () => true, muc: { thua: [2, 5], day: [2, 5] }, luc: () => 80,
    })
    return r.events.length
      ? r.events.flatMap(e => e.notes.map(note => ({ note, startBeat: e.startBeat, durationBeats: e.durationBeats, hand: 'right' as const })))
      : null
  }
  const uu = hamUuTien(o.chord, key)
  const ung = KHO_O.flatMap(n => {
    if (n.doi || n.vao || (n.tex !== 'don' && n.tex !== 'doi') || n.hoDau < tu) return []
    const dat = datTheoGiong(n, key)?.map(s => ({ ...s, d: Math.min(s.d, 6 - s.t) }))
    return dat && dat.length && (cuaRay(n, dat, o.chord, key) || hopVoi(dat, o.chord, key)) ? [{ n, dat }] : []
  })
  if (!ung.length) return null
  const dung = ung.filter(u => uu.includes(u.n.ham))
  const a = dung.length ? dung : ung
  const chua = a.filter(u => u.n.hoDau >= 1)
  const nhom = (chua.length ? chua : a).sort((x, y) => bam(o.take, x.n.gi) - bam(o.take, y.n.gi))
  return nhom[0]!.dat.flatMap(s => s.notes.map(note => ({
    note, startBeat: dauO + s.t * o.mocDon, durationBeats: s.d * o.mocDon, hand: 'right' as const,
  })))
}

/*
  BLUE SUN — TAY PHẢI CHẠY NGÓN MỖI Ô (28/9/2026). Người dùng: *"Trong lúc đệm tác giả cũng chạy ngón chứ ko đơn thuần dặm hợp
  âm"* · *"riff có được dùng nhiều trong các sheet Blues ko, nếu có hãy thêm vào"*. Kho `blueSunO.json` = tay phải NGUYÊN từng ô
  *The House of the Rising Sun* (bản sheet sạch, `scripts/phan_tich_rising_sun.py --kho`): 16 ô — câu chạy 6 · riff 5 · câu
  thưa 5. Nốt bám chủ âm (âm giai blues thứ Mi trên mọi hợp âm), nên dời NGUYÊN ô theo GIỌNG bài: giọng thứ → chủ âm bài; giọng
  trưởng → giọng thứ tương đối (chủ + 9; âm giai blues thứ của La = âm giai blues trưởng của Đô). Không sửa nốt.

  Chọn ô (biên soạn của Claude trên số đo):
    · TIN SHEET: ô Rising Sun đặt đúng chức năng của nó (gốc hợp âm so chủ âm thứ, cùng tính thứ/trưởng) thì không lọc; còn
      lại qua bộ lọc hợp âm (`hopVoi`) — như "tin Ray trên hợp âm của Ray";
    · RIFF KÉO SANG Ô KẾ tối đa 2 ô (Rockhouse vòng 9 lặp một hình 8 ô liền; Rising Sun ô 9 → 10 riff chạy xuyên chỗ đổi hợp âm);
    · giữ tỉ lệ kiểu gần sheet (chạy 6/16 · riff 5/16 · thưa 5/16): +1,5 cho kiểu đang thiếu; −2 ba ô cùng kiểu; −3 ô vừa dùng
      trong 3 ô gần nhất; hàm băm theo lượt chỉ phá thế hoà.
  Tầm: nắn cả ô theo quãng tám vào 55–96 (Rising Sun chạy G4–G7; trên giọng hát). Lực (biên soạn): nốt phách 1 · 4 = 74, còn
  lại 66 — nhẹ hơn bass phách 1 (82) để giọng hát nổi.
*/
type OSun = { id: string; o: number; goc: number; ham: number; thu: boolean; kieu: 'chay' | 'riff' | 'thua'; su: Su[] }
export const KHO_SUN: readonly OSun[] = (khoSun as unknown as { o: OSun[] }).o
const SUN_TONIC = 4

/** Dời NGUYÊN một ô tay phải Rising Sun theo giọng bài, nắn cả ô vào tầm 55–96. `null` = không vừa tầm. */
export function datSun(o: OSun, g: Giong): SuDat[] | null {
  const tat = o.su.flatMap(x => x[2])
  if (!tat.length) return []
  let doi = pc((g.scale === 'minor' ? g.tonic : g.tonic + 9) - SUN_TONIC)
  if (doi > 6) doi -= 12
  while (Math.max(...tat) + doi > 96) doi -= 12
  while (Math.min(...tat) + doi < 55) doi += 12
  if (Math.max(...tat) + doi > 96) return null
  return o.su.map(([t, d, ns]) => ({ t, d, notes: ns.map(n => n + doi) }))
}

/**
 * Câu chạy ngón tay phải cho CẢ đoạn (mọi ô 6/8 của mọi hợp âm chính), trên vòng hợp âm có mốc thời gian (`mainChordSpans`).
 * `[]` khi chưa có giọng. Ô không có câu nào hợp thì để trống (không vá nốt).
 */
/*
  MẬT ĐỘ (lượt 3, 28/9/2026).
  · Lượt 1: mọi ô chép trọn tay phải một ô Rising Sun theo lưới bản dựng từ ảnh (3 nốt mỗi móc đơn ở ♩ 97 = 9,7 nốt/giây).
    Người dùng: *"nên bớt số nốt chạy lại … tham khảo 2 sheet Rockhouse và Robert"*.
  · Lượt 2: ô chạy chỉ nửa ô sau ở 1/4 số ô, ô khác mô-típ ≤ 3 cú — trung vị 3 cú mỗi ô (1,6 cú/giây). Người dùng: *"bạn đã bớt
    quá nhiều nốt tay phải, tôi nhớ trong các sheet Blues đâu có đánh giai điệu ít vậy"*.
  · Số đo cú tay phải mỗi giây: Rockhouse 2,9 · Robert 2,0 · Rising Sun 4,6 (`scripts/phan_tich_chay_not_blues.py`,
    `phan_tich_rising_sun.py --that`); ô có câu chạy dày Rockhouse 25% · Robert 8% · Rising Sun 100%.
  · Lượt 3 — kho dựng lại từ BẢN CĂN ÂM THANH theo THỜI GIAN THẬT (câu chạy thật 7,8 nốt/giây — người dùng: "đã được điều chỉnh
    lại tempo và đánh ko bị dồn nhanh"). BIÊN SOẠN của Claude: MỌI Ô có giai điệu — trọn tay phải một ô Rising Sun; chỉ bớt Ô
    DÀY (câu chạy liền / riff, 10/16 ô sheet) xuống khoảng 1/4 số ô như Rockhouse: đoạn hát — ô cuối của hợp âm mà câu hát kết ở
    đó (`breaths`, giọng hỏi đàn đáp); chưa có lời → ô thứ 4 mỗi dòng 4 ô; đoạn đàn (dạo · giang · kết) — mỗi 2 ô. Ô khác lấy ô
    CÂU THƯA của sheet (3–9 cú, có chỗ nghỉ; 6/16 ô). Không ô nào hợp kiểu mong muốn thì lấy ô hợp khác (không để trống).
*/
export function chayBlueSun(chords: readonly ParsedChord[], o: {
  key: Giong | null
  beatsPerChord: number
  take: number
  mocDon?: number
  /** Hợp âm chính (theo thứ tự) mà câu hát kết ở đó — chỗ đặt câu chạy trong đoạn hát. */
  breaths?: ReadonlySet<number>
  /** 'dan' = dạo · giang · kết (không có giọng): câu chạy mỗi 2 ô. */
  doan?: 'hat' | 'dan'
  /** Lượt 6 (ô tick): SOẠN từ nhóm ba thay cho chép trọn ô — cùng luật chỗ đặt ô dày như lượt 3. */
  soan?: boolean
  /** "Bản Blues rút gọn" (lượt 12, ô tick): câu chạy cuối câu hát rơi đúng phách 1 hợp âm mới, nốt nhẹ đều trong câu hát, TAY
   *  TRÁI nối sang hợp âm sau (`traiNoiBlueSun`). Trả cả nốt tay trái. */
  luot12?: boolean
  /** Hợp âm chính mà giọng hát đang vang (`singingChords`). */
  singing?: ReadonlySet<number>
}): TimelineEvent[] {
  if (!o.key) return []
  const g = o.key
  const MOC = o.mocDon ?? .5
  /*
    "BẢN BLUES RÚT GỌN" — LƯỢT 12 (29/9/2026). Người dùng nghe lượt 11: *"Trong video của thầy Thịnh tôi nhận thấy là khi mỗi cuối câu
    hát thì thầy mới chạy ngón. Các câu chạy ngón thường rất trọn vẹn và rơi đúng phách để chuyển hợp âm. Trong câu ca sĩ đang hát thì
    thầy cũng có chạy nốt nhẹ và chia đều cho tiết tấu đệm hát … Lượt soạn 11 vẫn rất dở và tiết tấu ko có sự liên kết, trong lúc hát
    thì tay trái chỉ biết dặm tiết tấu chứ ko liên kết gì tới hợp âm kế tiếp"*. Chỗ đặt theo lời tả của người dùng (tai người dùng
    thắng phép đo máy: đo theo giây trên đoạn giọng máy tách chẻ câu hát và tính lúc ngân chữ cuối là "đang hát" —
    `do_cho_chay_video_blues.py`):
      · ô HẾT CÂU (ô cuối của hợp âm hết câu): nửa sau CÂU CHẠY 4–7 cú; 1/3 số lần chạy từ nửa đầu ô (dưới chữ ngân); ô sau: nhóm
        NỐI bắt buộc — 1–2 cú đáp đúng phách 1, nốt của hợp âm mới (câu trọn · nối: xem `noiHop` trong `soanCauBlues`);
      · ô đang hát: nửa sau 1–2 NỐT NHẸ (lực 46, không ở phách mạnh, tầm C4–C5) — video: nốt tay phải lực < 45 lúc giọng vang
        0,53/giây ≈ một nhóm nhỏ mỗi ô, cao độ F4 · C#4 · C4 · G4 (bài Fa thứ);
      · dòng không lời: như lượt 7 (câu thưa); chưa dán lời: hai ô một câu hát.
    Lượt 7–11 (bám hợp âm · chừa chỗ · thưa hơn · theo số đo video · nối hợp âm) đã GỠ theo người dùng 29/9/2026: "Bỏ từ lượt 7 đến 11
    đi chỉ giữ lượt 12 và đặt tên cho ô tick là Bản Blues rút gọn" — lịch sử và số đo ở `Reference/BLUES-CLAUDE.md`.
  */
  let truoc12: { i: number; k: KieuNhom } | null = null
  const loai12 = (j: number, i: number, cuoi: boolean, nua: number): KieuNhom => {
    const coLoi = !!o.breaths?.size
    const hetCau = coLoi ? o.breaths!.has(i) : j % 2 === 1
    const dangHat = coLoi ? !!o.singing?.has(i) : j % 2 === 0
    let k: KieuNhom
    if (coLoi && !hetCau && !dangHat) k = 'thua'
    else if (hetCau && cuoi) k = nua === 1 || bam(o.take, j * 11 + 1) % 3 === 0 ? 'day' : 'nghi'
    else k = nua === 1 ? 'nhe' : 'nghi'
    if (nua === 0 && truoc12 && truoc12.i !== i && truoc12.k === 'day' && k !== 'thua') k = 'noi'
    truoc12 = { i, k }
    return k
  }
  // Hợp âm đang vang ở mỗi phách — kể cả hợp âm lướt (Blue Sun "hợp âm lướt Blues cuối đoạn").
  const moc = chordStarts(chords, o.beatsPerChord)
  const hopTai = (t: number) => chords[Math.max(0, moc.findLastIndex(x => x <= t + 1e-6))]!
  if (o.soan && o.luot12 && o.doan !== 'dan') {
    const spans = mainChordSpans(chords, o.beatsPerChord)
    const phai = soanCauBlues(spans, { hopTai,
      key: g, take: o.take, mocDon: MOC, uuTien: 'sun', tam: [55, 96], chiGiaiDieu: true, day: () => false, loai: loai12,
      muc: { thua: [3, 6], day: [4, 7], dap: [2, 4], nhe: [1, 2], noi: [1, 2] },
      // Tầm theo loại: câu chạy G4–C7 (video: câu chạy đỉnh ≥ C5), nốt nhẹ C4–C5. Chung một tầm 55–96 thì câu chạy sau nốt thấp bị
      // kéo xuống G3–E4, đè tầng hợp âm tay trái phách 4 (đo ở lượt 10).
      tamKieu: { nhe: [60, 72], day: [67, 96], noi: [60, 96] }, lucKieu: { nhe: 46 },
      luc: manh => (manh ? 74 : 66), bamHop: true, noiHop: true, noiBat: true, doiLuot: 2.5,
    }).events
    return [...phai, ...traiNoiBlueSun(spans, { key: g, take: o.take, mocDon: MOC, breaths: o.breaths, hopTai, phai })]
  }
  if (o.soan) {
    // Mật độ đặt cho CÙNG lượt 3 (đo 3 vòng × 6 lượt: ô thưa trung vị 8 cú, ô dày 15 — lượt 6 ra 8 · 15) để ô tick chỉ đổi CÁCH
    // SOẠN, không đổi độ dày. Lượt 2 bị bác ở 3 cú mỗi ô. Thử 4–6 · 5–11 ra 10 · 18 (dày hơn lượt 3) — bỏ.
    return soanCauBlues(mainChordSpans(chords, o.beatsPerChord), {
      key: g, take: o.take, mocDon: MOC, uuTien: 'sun', tam: [55, 96], chiGiaiDieu: true,
      day: (j, i, cuoi) => o.doan === 'dan' ? j % 2 === 1 : o.breaths?.size ? cuoi && o.breaths.has(i) : j % 4 === 3,
      muc: { thua: [3, 6], day: [5, 9], dap: [2, 4] }, luc: manh => (manh ? 74 : 66),
    }).events
  }
  const OO = 6 * MOC
  const chuThu = g.scale === 'minor' ? g.tonic : pc(g.tonic + 9)
  const out: TimelineEvent[] = []
  const dem = { chay: 0, riff: 0, thua: 0 }
  const gan: number[] = []
  let truoc: OSun | undefined, truoc2: OSun | undefined, lap = 0, j = 0
  for (const [i, span] of mainChordSpans(chords, o.beatsPerChord).entries()) {
    for (let at = span.start; at < span.start + span.beats - 1e-6; at += OO, j++) {
      const dai = Math.min(OO, span.start + span.beats - at) / MOC
      const cuoi = at + OO >= span.start + span.beats - 1e-6
      const day = o.doan === 'dan' ? j % 2 === 1 : o.breaths?.size ? cuoi && o.breaths.has(i) : j % 4 === 3
      const dungKieu = (x: OSun) => (x.kieu === 'thua') !== day
      const ung = KHO_SUN.flatMap(x => {
        const dat = datSun(x, g)?.filter(q => q.t < dai - 1e-6).map(q => ({ ...q, d: Math.min(q.d, dai - q.t) }))
        if (!dat || !dat.length) return []
        const tin = pc(span.chord.root - chuThu) === x.ham && x.thu === laHopAmThu(span.chord)
        return tin || hopVoi(dat, span.chord, g, dai) ? [{ x, dat, tin }] : []
      })
      if (!ung.length) {
        truoc2 = truoc
        truoc = undefined
        continue
      }
      // ô dày: câu chạy và riff lần lượt (kiểu nào đang ít hơn được +1,5)
      const thieu = dem.chay <= dem.riff ? 'chay' : 'riff'
      const diem = (u: typeof ung[number]) => {
        let s = (dungKieu(u.x) ? 10 : 0) + (u.tin ? 3 : 0) + (bam(o.take, j * 37 + u.x.o) % 1000) / 1000
        if (u.x === truoc) s += truoc.kieu === 'riff' && lap < 2 ? 5 : -6
        else if (gan.includes(u.x.o)) s -= 3
        if (day && u.x.kieu === thieu) s += 1.5
        if (truoc && truoc2 && truoc.kieu === u.x.kieu && truoc2.kieu === u.x.kieu) s -= 2
        return s
      }
      const tot = ung.reduce((a, b) => (diem(b) > diem(a) ? b : a))
      lap = tot.x === truoc ? lap + 1 : 1
      dem[tot.x.kieu]++
      for (const q of tot.dat) {
        const manh = Math.abs(q.t) < 1e-6 || Math.abs(q.t - 3) < 1e-6
        out.push({ hand: 'right', startBeat: at + q.t * MOC, durationBeats: q.d * MOC, notes: q.notes as MidiNote[],
          velocity: manh ? 74 : 66 })
      }
      truoc2 = truoc
      truoc = tot.x
      gan.push(tot.x.o)
      if (gan.length > 3) gan.shift()
    }
  }
  return out
}

/*
  TAY TRÁI NỐI SANG HỢP ÂM SAU (lượt 12). Người dùng: *"trong lúc hát thì tay trái chỉ biết dặm tiết tấu chứ ko liên kết gì tới hợp
  âm kế tiếp"*. Cell Blue Sun có một nốt dẫn ở phách 6 — LUÔN nửa cung dưới gốc mới, lực 51 (bass phách 1: 82, hợp âm phách 4: 71),
  sát bè trầm → chìm dưới câu chạy và giọng hát. Video Đức Thịnh (`do_cho_chay_video_blues.py`, 88 chỗ đổi gốc bass trong đoạn hát):
  trước chỗ đổi có nốt dẫn cách gốc mới ≤ 1 cung 28% · nốt hợp âm cũ rồi nhảy 22% · đi chuỗi 2% · không nối 46% (máy chép — chỉ báo).
  Nốt tay trái cuối trước gốc mới (n=47): một cung dưới 9 · một cung trên 8 · bậc 5 của hợp âm mới 7 · vào sớm gốc mới 6 · nửa cung
  trên 5 · nửa cung dưới 5 — thường ở QUÃNG TÁM 3 rồi rơi xuống gốc trầm (Ab3 → G2, G3 → F2, B3 → Bb1); cuối câu có lúc đi chuỗi
  (C3 · B3 · Bb3 · Ab3 → Db).
  BIÊN SOẠN của Claude: mỗi chỗ đổi hợp âm (hợp âm sau vào đúng vạch, gốc khác) → một nốt dẫn ở phách 6, quãng tám 3 (C3–C4), lực 70,
  kiểu chọn theo tỉ lệ trên (hàm băm theo lượt phát); nốt cách một cung không thuộc giọng → đổi thành nửa cung cùng phía. Ô hết câu
  → đi 2 nốt (phách 5 · 6) nửa cung một vào gốc mới, từ dưới hoặc từ trên. Nốt dẫn cũ của cell ở đó bị bỏ (`nhuongTayTrai`).
*/
export function traiNoiBlueSun(spans: readonly SpanBlues[], o: {
  key: Giong; take: number; mocDon: number; breaths?: ReadonlySet<number>
  /** Hợp âm đang vang ở một phách (có hợp âm lướt) — nốt nối không được chói với nó. */
  hopTai?: (beat: number) => ParsedChord
  /** Câu tay phải đã soạn — nốt nối không chồng nửa cung (quãng 9 thứ) lên nốt tay phải đang vang. */
  phai?: readonly TimelineEvent[]
}): TimelineEvent[] {
  /*
    BẢN 2 (29/9/2026) — nốt nối TRONG GIỌNG. Người dùng nghe bản 1 cùng ô tick "Bản Blues rút gọn": *"các hợp âm khi đánh đệm nghe bị
    phô"*. Bản 1 lấy một cung / nửa cung quanh gốc mới theo cao độ tuyệt đối, và ô hết câu đi 2 nốt NỬA CUNG — trên bài người dùng
    (Mi thứ) ra toàn nốt ngoài giọng ở quãng tám 3, lực 70: Db4 → B · Ab3 → G · Bb3 → A · F3 → E · Eb3 → D. Video Đức Thịnh (bài Fa
    thứ) phần lớn là nốt TRONG giọng: Ab3 → G2 · G3 → F2 · G3 → C2 · Ab3 → C#2; nửa cung chỉ lướt trong chuỗi (C3 B3 Bb3 Ab3 → Db).
    Nên bản 2: nốt kề DƯỚI / TRÊN gốc mới trong ÂM GIAI của bài (một cung hay nửa cung tuỳ âm giai) · bậc 5 của hợp âm mới (nếu trong
    giọng) · gốc mới vào sớm; tỉ lệ theo video (dưới 9 + 5 · trên 8 + 5 · bậc 5: 7 · vào sớm: 6); ô hết câu đi HAI BẬC ÂM GIAI vào gốc
    mới; lực 66 (cũ 70). Cũ — bản 1: triệu chứng để lùi là "tay trái nối nghe nhạt, không kéo sang hợp âm sau".
  */
  const out: TimelineEvent[] = []
  const g = o.key
  const giong = new Set((g.scale === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map(x => pc(x + g.tonic)))
  const keDuoi = (m: number) => { for (let x = m - 1; x >= m - 3; x--) if (giong.has(pc(x))) return x; return m - 2 }
  const keTren = (m: number) => { for (let x = m + 1; x <= m + 3; x++) if (giong.has(pc(x))) return x; return m + 2 }
  const KIEU: readonly (readonly ['duoi' | 'tren' | 'nam' | 'som', number])[] = [['duoi', 14], ['tren', 13], ['nam', 7], ['som', 6]]
  const tong = KIEU.reduce((a, [, n]) => a + n, 0)
  spans.forEach((s, i) => {
    const sau = spans[i + 1]
    if (!sau || Math.abs(s.start + s.beats - sau.start) > 1e-6 || pc(sau.chord.root) === pc(s.chord.root)) return
    const goc = 48 + pc(sau.chord.root)                          // gốc mới ở quãng tám 3 (C3–B3)
    /*
      BẢN 3 — nốt nối không CHÓI với hợp âm đang vang (`satNuaCung`): phía / kiểu hàm băm chọn mà chói thì đổi phía, rồi đổi kiểu;
      hết cách thì bỏ nốt nối (cell đệm giữ nốt của nó). Cũ (bản 2): chỉ xét nốt trong giọng — D9 → Em đi từ trên ra G3 · F#3, G3
      chồng nửa cung lên F# của D9 (người dùng: "chỗ D9 … nghe chói tai hơn"). Để lùi: "tay trái nối ít đổi hướng, nghe đều đều".
    */
    // Nốt hợp âm cũng chói khi chồng quãng 9 thứ lên nốt tay phải (F#3 dưới G4 trên Em9 · D3 dưới D#4 trên B7#9 — đo cả bài 7/1042).
    const em = (n: number, t: number) => !satNuaCung(o.hopTai?.(t) ?? s.chord, n) && !o.phai?.some(e =>
      e.startBeat < t + o.mocDon - 1e-6 && e.startBeat + e.durationBeats > t + 1e-6 && e.notes.some(x => [1, 11].includes(pc(x - n))))
    if (o.breaths?.size && o.breaths.has(i)) {
      const tren = bam(o.take, i * 23 + 7) % 2 === 0
      for (const phia of [tren, !tren]) {
        const a = phia ? keTren(goc) : keDuoi(goc)
        const b = phia ? keTren(a) : keDuoi(a)
        const moc2 = [b, a].map((n, k) => ({ n, t: sau.start - (2 - k) * o.mocDon }))
        if (!moc2.every(x => em(x.n, x.t))) continue
        moc2.forEach(x => out.push({ hand: 'left', startBeat: x.t, durationBeats: o.mocDon, notes: [x.n as MidiNote], velocity: 66 }))
        return
      }
    }
    let r = bam(o.take, i * 17 + 3) % tong
    let kieu: typeof KIEU[number][0] = 'duoi'
    for (const [k, n] of KIEU) {
      if (r < n) { kieu = k; break }
      r -= n
    }
    const nam = goc + 7 > 60 ? goc - 5 : goc + 7
    const notKieu = (k: typeof kieu) => k === 'duoi' ? keDuoi(goc) : k === 'tren' ? keTren(goc) : k === 'som' ? goc
      : giong.has(pc(nam)) ? nam : keDuoi(goc)
    const t = sau.start - o.mocDon
    const n = [kieu, ...KIEU.map(([k]) => k).filter(k => k !== kieu)].map(notKieu).find(x => em(x, t))
    if (n === undefined) return
    out.push({ hand: 'left', startBeat: t, durationBeats: o.mocDon, notes: [n as MidiNote], velocity: 66 })
  })
  return out
}

/** Nốt đệm tay trái bắt đầu trong khoảng một nốt tay trái của câu nối (`traiNoiBlueSun`) thì bỏ — không chồng hai nốt dẫn. */
export function nhuongTayTrai<T extends Su2>(backing: readonly T[], fill: readonly Su2[]): T[] {
  const noi = fill.filter(f => f.hand === 'left')
  if (!noi.length) return [...backing]
  return backing.filter(e => e.hand !== 'left' ||
    !noi.some(f => e.startBeat >= f.startBeat - 1e-6 && e.startBeat < f.startBeat + f.durationBeats - 1e-6))
}

type Su2 = { hand: string; startBeat: number; durationBeats: number }

/**
 * Blues: tay phải chạy câu thì THÔI ĐỆM. Hợp âm đệm tay phải bắt đầu trong lúc câu tay phải đang vang thì bỏ; bắt đầu
 * trước và ngân vào câu thì cắt tới chỗ câu vào. Rockhouse: trong lúc tay phải chạy câu, tay trái vẫn đi bass. Cũ
 * (`giveCompingToLeft`, mọi điệu): dời hợp âm tay phải bị đè xuống tay trái — thế 3-5-b7 chồng lên bass đi, đục.
 */
export function nhuongTayPhai<T extends Su2>(backing: readonly T[], fill: readonly Su2[]): T[] {
  const cau = fill.filter(f => f.hand === 'right')
  if (!cau.length) return [...backing]
  return backing.flatMap(e => {
    if (e.hand !== 'right') return [e]
    const de = cau.filter(f => f.startBeat < e.startBeat + e.durationBeats - 1e-6 && f.startBeat + f.durationBeats > e.startBeat + 1e-6)
    if (!de.length) return [e]
    const vao = Math.min(...de.map(f => f.startBeat))
    return vao > e.startBeat + 1e-6 ? [{ ...e, durationBeats: vao - e.startBeat }] : []
  })
}

/*
  TWIST · BỘ SOẠN BLUES — ĐỆM HÁT (mặc định của Twist từ 29/9/2026; từng là ô tick nghe thử cùng ngày).
  Người dùng: *"dùng bộ soạn Blues để soạn các câu solo và các câu fill cho điệu Twist … Hãy học từ điệu Slow Blues để chèn các câu chạy nốt vào lúc đệm hát và chèn cho khớp với nhịp phách của điệu Twist
  … Các câu chạy nốt nên ít nốt hơn trong Slow Blues nhưng vẫn giữ đủ kết cấu. Các chỗ chạy nốt nên thưa ra, chủ yếu đặt ở cuối câu hát
  và nên có nốt dẫn qua hợp âm kế tiếp. Ngoài các câu chạy nốt thì cũng hãy chèn những kỹ thuật khác của Blues vào tiết tấu đệm hát"*.

  NHỊP: một nhóm ba = MỘT PHÁCH swing của Twist (móc = ⅓ phách). Rockhouse vốn là 4/4 lưới chùm ba (♩ 88): 735/810 cú đúng lưới, và
  swing 2:1 của Twist đặt tiếng "và" ở ⅔ phách = móc thứ ba của nhóm. Rising Sun chép theo thời gian thật (25/185 cú đúng lưới) — bỏ.

  Ba kỹ thuật (chỗ đặt theo lối "Bản Blues rút gọn" của Slow Blues; con số là BIÊN SOẠN của Claude, không phải số đo):
   · CÂU CHẠY cuối câu hát: 2 phách cuối hợp âm hết câu (1/3 số lần 3 phách), 1–3 cú mỗi phách — Slow Blues: 4–7 cú trong MỘT nhóm
     ba. Nốt cuối câu cách cú đáp ≤ 2 nửa cung (nốt dẫn); cú đáp đúng phách 1 hợp âm sau, toàn nốt hợp âm mới, vang cùng cú chặn tay
     phải của mẫu đệm. Chưa dán lời → mỗi 16 phách một câu. Trong lúc chạy tay phải thôi chặn (cú 3& ô cuối).
   · LÁY BLUES vào cú chặn đầu mỗi hợp âm: nốt blue của giọng (trưởng b3 · b5 · b7; thứ b5 · b7) nửa cung dưới bậc 3 / bậc 5 có trong
     thế chặn — sheet Boogie ô 25 · 29 láy [Eb,Gb] → [E,G], ô 1 · 2 · 17 Eb → E. Mẫu đệm ô 6–16 của sheet KHÔNG có láy: chèn thêm.
   · ĐI BASS CUỐI ĐOẠN: ô cuối trước đoạn mới, tay trái bỏ mẫu boogie, đi quãng tám bốn nốt đen — gốc rồi ba nốt nửa cung lên gốc mới
     (sheet ô 4 · 20: C–E–F–F# vào G; ô 32: F · F# nảy). Gốc mới cách gốc cũ < 4 nửa cung (đi lên) thì không đi.
  Trả cả PHẦN ĐỆM đã nhường chỗ (`backing`) để nơi gọi không phải tự cắt.
*/
export function chayTwistBlues(chords: readonly ParsedChord[], o: {
  key: Giong | null; beatsPerChord: number; take: number
  /** Hợp âm chính mà câu hát kết ở đó. */
  breaths?: ReadonlySet<number>
  /** Hợp âm chính cuối mỗi đoạn (mốc chuyển đoạn). */
  sectionEnds?: ReadonlySet<number>
  /** Phần đệm Twist cả bài. */
  backing: readonly TimelineEvent[]
}): { events: TimelineEvent[]; backing: TimelineEvent[] } {
  if (!o.key) return { events: [], backing: [...o.backing] }
  const g = o.key
  const spans = mainChordSpans(chords, o.beatsPerChord)
  const coLoi = !!o.breaths?.size
  const moc16 = (x: number) => Math.floor(x / 16 + 1e-6)
  const hetCau = (i: number) => coLoi ? o.breaths!.has(i) : moc16(spans[i]!.start + spans[i]!.beats) > moc16(spans[i]!.start)
  let iTruoc = -1, k = 0, truoc: KieuNhom = 'nghi'
  const loai = (_: number, i: number): KieuNhom => {
    const moi = i !== iTruoc
    k = moi ? 0 : k + 1
    iTruoc = i
    const n = Math.round(spans[i]!.beats)
    const dai = bam(o.take, i * 11 + 1) % 3 === 0 ? 3 : 2
    const kieu: KieuNhom = moi && truoc === 'day' ? 'noi' : hetCau(i) && n >= dai && k >= n - dai ? 'day' : 'nghi'
    truoc = kieu
    return kieu
  }
  const phai = soanCauBlues(spans, {
    key: g, take: o.take, mocDon: 1 / 3, uuTien: 'ray', chiNguon: 'ray', tam: [60, 91], day: () => false, loai,
    muc: { thua: [1, 2], day: [1, 3], noi: [1, 2] }, tamKieu: { day: [67, 91], noi: [64, 91] },
    luc: manh => (manh ? 74 : 66), bamHop: true, noiHop: true, noiBat: true, noiBuoc: [1, 2], notToiDa: 2, lapMoiNhom: true, doiLuot: 2.5,
  }).events
  // Cú đáp (nửa phách đầu hợp âm) vang CÙNG cú chặn — không bắt cú chặn nhường.
  const dauHop = (t: number) => spans.some(s => t >= s.start - 1e-6 && t < s.start + .5 + 1e-6)
  let backing = nhuongTayPhai(o.backing, phai.filter(e => !dauHop(e.startBeat)))

  const blue = new Set((g.scale === 'minor' ? [6, 10] : [3, 6, 10]).map(x => pc(x + g.tonic)))
  const lay: TimelineEvent[] = []
  for (const s of spans) {
    const chan = s.start >= .12 && o.backing.find(e => e.hand === 'right' && Math.abs(e.startBeat - s.start) < 1e-6)
    if (!chan) continue
    const iv = s.chord.quality.intervals
    const ba = iv.includes(4) ? 4 : iv.includes(3) ? 3 : -1
    const notes = chan.notes.flatMap(x => {
      const r = pc(x - s.chord.root)
      return (r === ba || r === 7) && blue.has(pc(x - 1)) && !hopPc(s.chord).includes(pc(x - 1)) ? [x - 1] : []
    })
    if (notes.length) lay.push({ hand: 'right', startBeat: s.start - .12, durationBeats: .12, notes: notes as MidiNote[], velocity: 67, grace: true })
  }

  const trai: TimelineEvent[] = []
  for (const i of o.sectionEnds ?? []) {
    const s = spans[i], sau = spans[i + 1]
    if (!s || !sau || s.beats < 4 - 1e-6) continue
    const len = pc(sau.chord.root - s.chord.root)
    if (len < 4) continue
    const den = 36 + pc(sau.chord.root)
    let di = [den - len, den - 3, den - 2, den - 1]
    if (di[0]! < 28) di = di.map(x => x + 12)
    const t0 = sau.start - 4
    backing = backing.filter(e => e.hand !== 'left' || e.startBeat < t0 - 1e-6 || e.startBeat >= sau.start - 1e-6)
    di.forEach((n, q) => trai.push({ hand: 'left', startBeat: t0 + q, durationBeats: q > 1 ? .65 : 1, notes: [n, n + 12] as MidiNote[], velocity: 77 }))
  }
  return { events: [...phai, ...lay, ...trai].sort((a, b) => a.startBeat - b.startBeat), backing }
}

/*
  DẠO · GIANG · KẾT.

  ĐƠN VỊ: một ô 6/8 = 6 móc đơn = 3 phách máy = MỘT hợp âm = MỘT nửa ô Rockhouse.
  HAI TAY: tay trái = cell tay trái của điệu (Slow Blues: bass phách 1 · hợp âm phách 4 · dẫn phách 6); tay phải = nửa ô Ray.

  VÒNG HỢP ÂM (đổi theo lượt — người dùng: vòng hợp âm phải đổi mới mỗi lượt):
    · khung Rockhouse (ô 32–43, Codex chia): I I I I · IV IV · I I · V IV · I · (báo);
    · khung Robert (chorus C ô 56–79): đổi sang IV ngay ô 2;
    · giọng thứ (video Đức Thịnh: Am · F7 · E7#9 = i · bVI7 · V7): i i i i · iv iv · i i · bVI7 V7 · i · (báo);
    · dạo = 8 ô cuối khung (IV IV I I V IV I · báo); kết = V IV I rồi đuôi kết chép Rockhouse ô 113–115.

  CHỌN NỬA Ô — tìm chùm (rộng 30) trên cả đoạn. Ứng viên: nửa ô có tay phải, đúng chức năng ưu tiên (thiếu thì mọi chức năng,
  −2), qua bộ lọc hợp âm. Điểm:
    · +6 đúng VỊ TRÍ KHUNG AAB trong vòng nhà (ô Ray tương ứng, xem `O_RAY`);
    · +4 liền sau nửa ô trước trong sheet (giữ mạch câu của Ray);
    · nối không liền: −3 vạch nối không có khoảng nghỉ ≥ 1 móc đơn (98/211 vạch của Rockhouse có), −2 nửa ô mở bằng nốt đang
      ngân, −1,5 cao độ nhảy > 9 nửa cung;
    · +2 thuộc vòng nhà (lượt % 9 + 1); −1 ba ô cùng kết cấu; −1 ô trước ô báo mà câu chưa dứt trước vạch;
    · câu dứt trong ô (nghỉ ≥ 1 móc đơn trước vạch) mà nốt cuối là nốt hợp âm (1 · 3 · 5): +1 — Ray kết ở gốc / bậc 5 của
      hợp âm 34/74 câu; ô cuối (trước ô báo / đuôi) nốt cuối là bậc 1 · 5 của giọng: +2 — giữ trọng tâm giọng thứ (vật liệu
      ở giọng trưởng tương đối dễ kéo trọng tâm về b3);
    · không dùng lại nửa ô; hàm băm theo lượt ≤ 0,8 — chỉ phá thế hoà.
  Nốt Ray ngân qua vạch chỉ được giữ khi nửa ô kế liền nguồn VÀ cùng hợp âm; không thì cắt ở vạch.

  Ô BÁO (cuối dạo, cuối giang): V7 của hợp âm vào hát, một cú mỗi tay ở phách 1, có bậc 3, tắt trước phách 6.
  ĐUÔI KẾT: ô 113 phách 1 (I, nửa ô 224) · ô 113 phách 3 (IV, nửa ô 225, bass C · C# dẫn lên) · ô V → bII7 (bass D · Eb ·
  Ab hai quãng tám, tay phải G3 rồi Gb-C-Eb, nửa ô 226) · I13(#11) C#-F-B-E ngân hai ô (giọng thứ: im6/9 — Claude suy).
*/

const MOC = .5
const O = 6 * MOC

type Bac = { bac: number; thu: boolean }
const I: Bac = { bac: 0, thu: false }, IV: Bac = { bac: 5, thu: false }, V: Bac = { bac: 7, thu: false }
const i_: Bac = { bac: 0, thu: true }, iv: Bac = { bac: 5, thu: true }, bVI: Bac = { bac: 8, thu: false }
const III: Bac = { bac: 3, thu: false }, IV7: Bac = { bac: 5, thu: false }

const KHUNG = {
  truong: {
    intro: [[IV, IV, I, I, V, IV, I]],
    interlude: [[I, I, I, I, IV, IV, I, I, V, IV, I], [I, IV, I, I, IV, IV, I, I, V, IV, I]],
    outro: [[V, IV, I]],
  },
  thu: {
    intro: [[iv, iv, i_, i_, bVI, V, i_]],
    interlude: [[i_, i_, i_, i_, iv, iv, i_, i_, bVI, V, i_], [i_, iv, i_, i_, iv, iv, i_, i_, bVI, V, i_]],
    outro: [[bVI, V, i_]],
  },
} as const

/**
 * Khung Rising Sun — sheet blues THỨ thật (ô 9–15: i · III7 · IV7 · bVI7 | i · V7 · i; mọi hợp âm ngoài i là hợp âm bảy — ký hiệu in
 * im 5 · III7 3 · IV7 2 · bVI7 2 · V7 2 lần, n=15). Chỉ lượt 6 (ô tick), đổi lượt với khung video Đức Thịnh.
 */
const KHUNG_SUN = { intro: [i_, III, IV7, bVI, i_, V, i_], interlude: [i_, III, IV7, bVI, i_, V, i_], outro: [bVI, V, i_] } as const

/** Vị trí khung AAB: ô thân thứ j của đoạn nhắm [ô 4/4 trong vòng Ray (1–12), nửa ô]. */
const O_RAY = {
  interlude: [[1, 0], [1, 1], [2, 0], [2, 1], [5, 0], [5, 1], [7, 0], [7, 1], [9, 0], [10, 0], [11, 0]],
  intro: [[5, 0], [5, 1], [7, 0], [7, 1], [9, 0], [10, 0], [11, 0]],
  outro: [[9, 0], [10, 0], [11, 0]],
} as const

/** Nửa ô chép nguyên cho đuôi kết (chỉ số `gi` trong kho). */
const DUOI = { i: 224, iv: 225, bII: 226 }
const VONG = 9
const DAU_VONG = Array.from({ length: VONG }, (_, v) => Math.min(...KHO_O.filter(o => o.vong === v + 1).map(o => o.gi)))

type Chon = { o: NuaO; dat: SuDat[] }

function chonNuaO(
  hop: readonly ParsedChord[], g: Giong, take: number, dich: readonly (readonly [number, number])[], cuoiMo: boolean,
  chiGiaiDieu = false,
): Chon[] | null {
  const nha = (take % VONG) + 1
  const ung = hop.map((chord, j) => {
    const uu = hamUuTien(chord, g)
    const cung = !!hop[j + 1] && hop[j + 1]!.symbol === chord.symbol
    const tim = (moiHam: boolean, moiKieu: boolean) => KHO_O.flatMap(o => {
      // Bỏ nửa ô tay phải trắng (Rockhouse 6/212) — người dùng muốn câu phong phú, không ngắt quãng.
      if (o.doi || !o.su.length || (!moiHam && !uu.includes(o.ham)) || Object.values(DUOI).includes(o.gi)) return []
      if (chiGiaiDieu && !moiKieu && o.tex === 'riff') return []
      const dat = datTheoGiong(o, g)
      return dat && (cuaRay(o, dat, chord, g) || hopVoi(dat, chord, g, cung ? 12 : 6)) ? [{ o, dat, lech: !uu.includes(o.ham) }] : []
    })
    for (const [moiHam, moiKieu] of [[false, false], [true, false], [false, true], [true, true]] as const) {
      const dung = tim(moiHam, moiKieu)
      if (dung.length) return dung
    }
    return []
  })
  if (ung.some(u => !u.length)) return null
  type Nhanh = { duong: Chon[]; diem: number }
  let chum: Nhanh[] = [{ duong: [], diem: 0 }]
  hop.forEach((_, j) => {
    const [oRay, nua] = dich[j] ?? [0, 0]
    const giDich = oRay ? DAU_VONG[nha - 1]! + (oRay - 1) * 2 + nua : -1
    const moi: Nhanh[] = []
    for (const n of chum) {
      const truoc = n.duong.at(-1)?.o
      const truoc2 = n.duong.at(-2)?.o
      for (const c of ung[j]!) {
        if (n.duong.some(d => d.o.gi === c.o.gi)) continue
        let s = n.diem + (c.o.vong === nha ? 2 : 0) + (bam(take, c.o.gi) % 1000) / 1250 - (c.lech ? 2 : 0)
        if (c.o.gi === giDich) s += 6
        const lien = truoc !== undefined && c.o.gi === truoc.gi + 1
        if (lien) s += 4
        else {
          if (truoc) {
            if (truoc.hoCuoi + c.o.hoDau < 1) s -= 3
            if (truoc.cuoi !== null && c.o.dau !== null && Math.abs(c.o.dau - truoc.cuoi) > 9) s -= 1.5
          }
          if (c.o.vao) s -= 2
        }
        if (truoc && truoc2 && truoc.tex === c.o.tex && truoc2.tex === c.o.tex) s -= 1
        if (cuoiMo && j === hop.length - 1 && c.o.hoCuoi < 1) s -= 1
        // Kết câu vào nốt hợp âm (Ray kết ở gốc / bậc 5 của hợp âm 34/74 câu); ô cuối trước ô báo: kết ở bậc 1 / 5 của GIỌNG.
        const cuoi = c.dat.at(-1)?.notes.at(-1)
        if (cuoi !== undefined && c.o.hoCuoi >= 1) {
          const r = pc(cuoi - hop[j]!.root)
          if (r === 0 || r === 7 || r === 3 || r === 4) s += 1
          if (j === hop.length - 1 && [0, 7].includes(pc(cuoi - g.tonic))) s += 2
        }
        moi.push({ duong: [...n.duong, { o: c.o, dat: c.dat }], diem: s })
      }
    }
    chum = moi.sort((a, b) => b.diem - a.diem).slice(0, 30)
  })
  return chum[0]?.duong ?? null
}

export function bluesClaudeSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (reason: string): PhraseSection => ({ events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason: reason })
  if (!options.key) return empty('Blues Claude cần xác định giọng trước khi soạn dạo / giang / kết.')
  const g: Giong = options.key
  const { tonic } = g
  const minor = g.scale === 'minor'
  const { kind, style } = options
  const take = Math.abs(Math.trunc(options.take ?? 0))
  const ten = (p: number) => pitchClassName(normalizePitchClass(p), 'flat')
  const kyHieu = (b: Bac) => `${ten(tonic + b.bac)}${b.thu ? 'm7' : '7'}`

  const soan = !!options.bluesSoan
  const khung: readonly (readonly Bac[])[] = soan && minor ? [...KHUNG.thu[kind], KHUNG_SUN[kind]] : (minor ? KHUNG.thu : KHUNG.truong)[kind]
  const vong = khung[(soan ? take : Math.floor(take / VONG)) % khung.length]!
  const hop = parseChordInput(vong.map(kyHieu).join(' ')).chords
  if (hop.length !== vong.length) return empty('Không đọc được vòng hợp âm Blues của giọng này.')
  /*
    Điệu mà tay trái lo trọn phần đệm (tay phải của cell trống — Blues Claude · Rising Sun): tay phải chỉ chơi GIAI ĐIỆU —
    nửa ô nốt đơn / bè đôi, không riff hợp âm (The House of the Rising Sun: tay phải không đệm hợp âm ô nào, 14 ô). Ô không
    có nửa ô giai điệu nào vừa thì mới dùng riff.
  */
  const chiGiaiDieu = !!style.cell && style.cell.right.length === 0
  const chon = soan ? [] : chonNuaO(hop, g, take, O_RAY[kind], kind !== 'outro', chiGiaiDieu)
  if (!chon) return empty('Không đủ nửa ô Rockhouse hợp giọng và hợp âm cho giọng này.')

  const ky = vong.map(kyHieu)
  const beatsEach: number[] = vong.map(() => O)
  // Dời theo chủ âm về gần G (giọng Rockhouse) nhất — cho đuôi kết và bass dựng tay.
  const d = ((tonic - 7 + 17) % 12) - 5
  const G1 = 31 + d
  const trai: TimelineEvent[] = []
  const phai: TimelineEvent[] = []
  const go = (tay: TimelineEvent[], hand: 'left' | 'right', at: number, dai: number, notes: number[], velocity: number) =>
    tay.push({ hand, startBeat: at, durationBeats: dai, notes: notes as MidiNote[], velocity })
  const datTayPhai = (o: number, dat: SuDat[], ngan = false) => {
    for (const s of dat) {
      const chinh = Math.abs(s.t) < 1e-6 || Math.abs(s.t - 3) < 1e-6
      go(phai, 'right', o * O + s.t * MOC, (ngan ? s.d : Math.min(s.d, 6 - s.t)) * MOC, s.notes,
        chinh ? 92 : s.notes.length >= 3 ? 86 : 80)
    }
  }
  // Blue Sun: tay phải là câu chạy ngón Rising Sun (cả nút một nguồn); còn lại là nửa ô Ray đã chọn.
  let nhomDung: string[] = []
  if (style.family === 'blue-sun') phai.push(...chayBlueSun(hop, { key: g, beatsPerChord: O, take, doan: 'dan', soan }))
  else if (soan) {
    // Lượt 6: nhóm ba nguồn Rockhouse trước; mật độ như Ray (trung vị 4 cú mỗi ô 6/8), ô dày mỗi 2 ô.
    const r = soanCauBlues(hop.map((chord, k) => ({ chord, start: k * O, beats: O })), {
      key: g, take, mocDon: MOC, uuTien: 'ray', tam: [THAP, CAO], chiGiaiDieu,
      day: j => j % 2 === 1, muc: { thua: [1, 3], day: [3, 6] }, luc: (manh, n) => (manh ? 92 : n >= 3 ? 86 : 80),
    })
    phai.push(...r.events)
    nhomDung = r.nguon
  } else chon.forEach((c, o) => datTayPhai(o, c.dat, chon[o + 1]?.o.gi === c.o.gi + 1 && ky[o + 1] === ky[o]))

  // Tay trái: cell cho mọi ô thường (giữ pha cell liền mạch), ô đặc biệt dựng tay.
  const oThuong = [...vong]
  if (kind === 'outro') oThuong.push(minor ? i_ : I)
  const hopThuong = parseChordInput(oThuong.map(kyHieu).join(' ')).chords
  const dem = renderPattern(voiceLeadTwoHands(hopThuong, { dropRootFromRightHand: options.dropRoot }), style, { beatsPerChord: O })
  trai.push(...dem.filter(e => e.hand === 'left'))

  let so = vong.length
  if (kind === 'outro') {
    const nua = (gi: number, b: Bac) => {
      const o = KHO_O.find(x => x.gi === gi)
      return o ? datNuaO(o, normalizePitchClass(tonic + b.bac), b.thu) : null
    }
    const oI = nua(DUOI.i, minor ? i_ : I), oIV = nua(DUOI.iv, minor ? iv : IV), oBII = nua(DUOI.bII, I)
    if (!oI || !oIV || !oBII) return empty('Thiếu nửa ô đuôi kết Rockhouse trong kho.')
    // ô 113 phách 1 — I
    datTayPhai(so, oI); ky.push(kyHieu(minor ? i_ : I)); beatsEach.push(O); so += 1
    // ô 113 phách 3 — IV, bass quay đầu C · C# (dẫn lên V)
    datTayPhai(so, oIV); ky.push(kyHieu(minor ? iv : IV)); beatsEach.push(O)
    go(trai, 'left', so * O, 3 * MOC, [G1 + 5], 80); go(trai, 'left', so * O + 3 * MOC, 2 * MOC, [G1 + 6], 78)
    go(trai, 'left', so * O + 5 * MOC, MOC, [G1 + 6], 72)
    so += 1
    // ô 114 phách 1 — V (bass D · Eb) rồi bII7 (Ab hai quãng tám; tay phải G3 · Gb-C-Eb của Ray)
    const k = so * O
    go(trai, 'left', k, MOC, [G1 + 7], 84); go(trai, 'left', k + 2 * MOC, MOC, [G1 + 8], 76)
    go(trai, 'left', k + 3 * MOC, 3 * MOC, [G1 + 1, G1 + 13], 88)
    datTayPhai(so, oBII)
    ky.push(`${ten(tonic + 7)}7`, `${ten(tonic + 1)}7`); beatsEach.push(3 * MOC, 3 * MOC)
    so += 1
    // ô 114 phách 3 → ô 115: I13(#11) / im6/9 ngân hai ô
    const c = so * O
    go(trai, 'left', c, O, [G1, G1 + 12], 90); go(trai, 'left', c + O, O, [G1, G1 + 12], 80)
    go(phai, 'right', c, 2 * O, minor ? [G1 + 26, G1 + 27, G1 + 31, G1 + 33] : [G1 + 18, G1 + 22, G1 + 28, G1 + 33], 84)
    ky.push(minor ? `${ten(tonic)}m6/9` : `${ten(tonic)}13`); beatsEach.push(2 * O)
    so += 2
  } else {
    // Ô báo: V7 của hợp âm vào hát, một cú hai tay ở phách 1 có bậc 3, tắt trước phách 6.
    const goc = normalizePitchClass((kind === 'intro' ? options.opening?.root ?? tonic : tonic) + 7)
    const bao = parseChordInput(`${ten(goc)}7`).chords
    const tt = bao.length ? voiceLeadTwoHands(bao, { dropRootFromRightHand: false })[0] : undefined
    if (!tt) return empty('Không dựng được hợp âm báo.')
    const ba = tt.right.some(n => normalizePitchClass(n - goc) === 4)
      ? [...tt.right] : [...tt.right, tt.right[0]! + normalizePitchClass(goc + 4 - tt.right[0]!)].sort((a, b) => a - b)
    go(trai, 'left', so * O, 5 * MOC, [...tt.left], 90)
    go(phai, 'right', so * O, 5 * MOC, ba, 88)
    ky.push(`${ten(goc)}7`); beatsEach.push(O)
    so += 1
  }

  const events = [...trai, ...phai].sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand))
  const robert = !minor && khung.length > 1 && vong === khung[1]
  if (soan) {
    return {
      events, chords: ky, beatsEach, lengthBeats: beatsEach.reduce((a, b) => a + b, 0),
      sourcePhrase: { id: 'blues-soan-nhom-ba', song: 'Rockhouse · Rising Sun', fromBar: 1, barCount: so, method: 'source-variation' },
      adaptationNote: `Bộ Soạn Blues lượt 6 (soạn từ nhóm ba) · khung ${vong === KHUNG_SUN[kind] ? 'Rising Sun' : minor ? 'Đức Thịnh' :
        robert ? 'Robert (IV ở ô 2)' : 'Rockhouse'}` + (nhomDung.length ? ` · nhóm ba: ${nhomDung.map(x => x.replace('Rockhouse:', 'R').replace('RisingSun:', 'S')).join(' ')}` : '') + '.',
    }
  }
  return {
    events, chords: ky, beatsEach, lengthBeats: beatsEach.reduce((a, b) => a + b, 0),
    sourcePhrase: { id: 'blues-claude-rockhouse', song: 'Rockhouse', fromBar: Math.floor(chon[0]!.o.gi / 2) + 1,
      barCount: so, method: 'source-variation' },
    adaptationNote: `Bộ Soạn Blues · vòng nhà ${(take % VONG) + 1} · khung ${robert ? 'Robert (IV ở ô 2)' : 'Rockhouse'} · ` +
      `nửa ô: ${chon.map(c => c.o.id.replace('Rockhouse:', '')).join(' · ')}.` +
      (minor ? ' Giọng thứ: câu của Ray đặt ở giọng trưởng tương đối (Claude suy, chưa có sheet blues thứ).' : ''),
  }
}

/*
  BỘ SOẠN BLUES LƯỢT 6 (28/9/2026, ô tick nghe thử) — SOẠN câu mới từ NHÓM BA của ba sheet.
  Người dùng: *"phân tích kỹ cách đặt hợp âm và soạn nốt giai điệu Blues mà các tác giả của 3 sheet đã làm … sử dụng những kiến
  thức học được từ 3 sheets và khả năng tư duy của bạn hãy train lại bộ soạn Blues để soạn nốt theo phong cách Blues"*.

  Lượt 5 (Blues Claude) chép NGUYÊN nửa ô Rockhouse; lượt 3 (Blue Sun) chép TRỌN ô Rising Sun — kho 16 ô, một bài 60–80 ô thì
  mỗi ô lặp ≈ 4 lần. Lượt 6 soạn theo NHÓM BA = 3 móc đơn = một phách lớn 6/8 (phách 1–3 hoặc 4–6).

  VẬT LIỆU: nhóm ba THẬT — Rockhouse 212 nửa ô × 2 (bỏ nửa ô đổi hợp âm giữa chừng và ba nửa ô đuôi kết) · Rising Sun 16 ô × 2.
  Robert nhịp chẵn: chỉ góp LUẬT. Mỗi nhóm chỉ dời theo GIỌNG bài (Rockhouse: chủ trưởng / trưởng tương đối; Rising Sun: chủ thứ /
  thứ tương đối) và QUÃNG TÁM cả nhóm — không sửa nốt. Mỗi nốt trả lời được "nhóm nào của ô nào, sheet nào" (`nguon` trả về).

  LUẬT CHỌN VÀ NỐI — số đo `scripts/phan_tich_blues_ba_sheet.py` (một cách đo cho cả ba sheet):
   · hợp hợp âm: tin nhóm trên đúng chức năng của nó (+1), còn lại qua `hopVoi` — như lượt 5;
   · NỐT PHÁCH 1 · 4 theo chức năng, so CHỦ (`PHACH_*`): trưởng — Rockhouse n=182/76/46 · Robert n=62/45/28 (I/IV/V);
     thứ — Rising Sun, sheet blues thứ THẬT: mọi nốt i n=49 · III7 35 · IV7 34 · V7 35 · bVI7 17. Rising Sun giữ âm giai blues thứ
     của CHỦ trên mọi hợp âm: trên A7 (IV7) không có C#, trên B7 (V7) nốt nhiều nhất là D (b7 của chủ = #9 của B7), không có D#;
   · NỐT BLUE GIẢI (`GIAI`): trưởng b3 → 2 · 3 · 1 (Rockhouse n=35), b7 → 5 (62%, n=26), b5 → b3 · 1, b6 → 6 (71%, n=7);
     thứ b5 → 5 (77%, n=13) · 4, b7 → 4 · 1 · 5 (n=22);
   · NỐI GIỮA CÂU: hai nhóm liền trong sheet đi 1–2 nửa cung nhiều nhất (Rockhouse 29%, n=364 · Rising Sun 45%, n=29) → chọn
     quãng tám cho nhóm để nốt đầu gần nốt cuối nhóm trước; bước 1–2 +0,5, ≥ 5 −0,5;
   · NGUỒN LIỀN (nhóm kế đúng nhóm sau trong sheet) +3 — giữ mạch câu thật; tới 4 nhóm liền (2 ô) thì −2 — buộc SOẠN nối mới
     (đo trên 4 vòng × 6 lượt: ≈ 1/2 chỗ nối đi đúng câu sheet, 1/2 nối mới);
   · VÀO LẤY ĐÀ: câu vào ở móc 2 · 5 (Rockhouse 47%, n=197 câu) → +0,5 khi trước đó là chỗ nghỉ;
   · NHẮC NHỊP 4 Ô (hỏi–đáp AAB): Rockhouse ô u → u+4 nhịp giống 0,57 (trùng hẳn 38/198) vs u → u+1 0,43 (5/199) → nhóm cùng nhịp
     với nhóm 8 phách lớn trước (khác nhóm) +1;
   · kết đoạn ở bậc 1 · 5 của giọng +2, bậc 3 (b3 ở giọng thứ) +1 (Rockhouse câu kết 1 34% · 5 17% · b3 14% · 3 12%, n=118);
   · không dùng lại nhóm trong 16 nhóm gần nhất (−4), trừ riff lặp liền tối đa 2 lần (+1,5);
   · MẬT ĐỘ theo từng ô (thưa / dày) do nơi gọi đặt: trong khoảng +2, lệch −1 mỗi cú (tối đa −4).
  Nguồn ưu tiên (+1): Blues Claude ← Rockhouse, Blue Sun ← Rising Sun; bài giọng thứ thêm +1 cho Rising Sun. Chọn bằng tìm chùm
  (rộng 16) trên cả đoạn; hàm băm theo lượt ≤ 0,8 chỉ phá thế hoà. Các trọng số là BIÊN SOẠN của Claude trên số đo.

  Ô tick: người dùng duyệt thì GIỮ ô tick; chỉ gộp vào mặc định (và xoá ô tick) khi người dùng bảo.
*/
type Nhom = {
  id: string; nguon: 'ray' | 'sun'; ham: number; thu: boolean; kieu: string; su: Su[]; ke: string | null; nhip: string
  /** Trong sheet gốc: nhóm MỞ câu (lặng ≥ 1 móc ngay trước cú đầu) · KẾT câu (lặng ≥ 1 móc sau cú cuối, hoặc cú cuối ngân ≥ 1,5 móc). */
  mo: boolean; ket: boolean
}

export const KHO_NHOM: readonly Nhom[] = (() => {
  const out: Nhom[] = []
  // Dòng cú của từng sheet theo móc đơn tuyệt đối (nửa ô Rockhouse / ô Rising Sun = 6 móc) — để biết nhóm mở / kết câu.
  const dongRay = KHO_O.flatMap(o => o.su.map(([t, d]) => [o.gi * 6 + t, d] as const)).sort((a, b) => a[0] - b[0])
  const dongSun = KHO_SUN.flatMap(x => x.su.map(([t, d]) => [x.o * 6 + t, d] as const)).sort((a, b) => a[0] - b[0])
  const cat = (id: string, nguon: Nhom['nguon'], ham: number, thu: boolean, kieu: string, su: readonly Su[], ke: string | null,
    nen: number) => {
    const dong = nguon === 'ray' ? dongRay : dongSun
    for (const h of [0, 1]) {
      const s = su.filter(([t]) => t >= h * 3 - 1e-6 && t < h * 3 + 3 - 1e-6).map(([t, d, ns]): Su => [t - h * 3, d, ns])
      let mo = true, ket = true
      if (s.length) {
        const a0 = nen + h * 3 + s[0]![0], [aL, dL] = [nen + h * 3 + s.at(-1)![0], s.at(-1)![1]]
        const truoc = dong.filter(x => x[0] < a0 - 1e-6).at(-1)
        const sau = dong.find(x => x[0] > aL + 1e-6)
        mo = !truoc || a0 - (truoc[0] + truoc[1]) >= 1 - 1e-6
        ket = !sau || sau[0] - (aL + dL) >= 1 - 1e-6 || dL >= 1.5 - 1e-6
      }
      out.push({ id: `${id}:${h ? 'b' : 'a'}`, nguon, ham, thu, kieu, su: s, ke: h ? ke : `${id}:b`,
        nhip: s.map(x => Math.round(x[0] * 3)).join(','), mo, ket })
    }
  }
  const dung = (o: NuaO | undefined) => !!o && !o.doi && !Object.values(DUOI).includes(o.gi)
  const theoGi = new Map(KHO_O.map(o => [o.gi, o]))
  for (const o of KHO_O) {
    if (!dung(o)) continue
    const sau = dung(theoGi.get(o.gi + 1)) ? theoGi.get(o.gi + 1) : undefined
    cat(o.id, 'ray', o.ham, false, o.tex, o.su, sau ? `${sau.id}:a` : null, o.gi * 6)
  }
  for (const x of KHO_SUN) {
    cat(x.id, 'sun', x.ham, x.thu, x.kieu, x.su, KHO_SUN.some(y => y.o === x.o + 1) ? `RisingSun:o${x.o + 1}:a` : null, x.o * 6)
  }
  return out
})()

/** Nốt phách 1 · 4 theo chức năng (gốc hợp âm so chủ): [tốt, được] — bậc so CHỦ. Ngoài bảng: so gốc hợp âm. */
const PHACH_TRUONG: Record<number, [number[], number[]]> = {
  0: [[0, 9, 4, 7], [3, 10, 5, 2]], 5: [[9, 0, 3], [2, 5, 7, 8, 6]], 7: [[7, 0, 9, 2], [10, 3, 4, 5]],
}
const PHACH_THU: Record<number, [number[], number[]]> = {
  0: [[0, 3, 7], [5, 10]], 3: [[0, 3], [5, 6, 7, 10]], 5: [[0, 3, 10], [5, 7, 6]], 8: [[0, 7], [3, 5]], 7: [[10, 7, 5], [6, 0, 3]],
}
const GIAI: Record<'major' | 'minor', Record<number, number[]>> = {
  major: { 3: [2, 4, 0], 10: [7], 6: [3, 0], 8: [9] },
  minor: { 6: [7, 5], 10: [5, 0, 7] },
}

function diemPhach(note: number, chord: ParsedChord, g: Giong) {
  const bang = (g.scale === 'minor' ? PHACH_THU : PHACH_TRUONG)[pc(chord.root - g.tonic)]
  const k = bang ? pc(note - g.tonic) : pc(note - chord.root)
  const [tot, duoc] = bang ?? [[0, 3, 4, 7], [10, 9, 2]]
  return tot.includes(k) ? 1.5 : duoc.includes(k) ? .3 : -1.5
}

const doiNhom = (n: Nhom, g: Giong) => {
  const d = n.nguon === 'ray' ? pc(chuVatLieu(g) - NGUON) : pc((g.scale === 'minor' ? g.tonic : g.tonic + 9) - SUN_TONIC)
  return d > 6 ? d - 12 : d
}

const tinNhom = (n: Nhom, dat: readonly SuDat[], chord: ParsedChord, g: Giong) => n.nguon === 'ray'
  ? g.scale !== 'minor' && !laHopAmThu(chord) && pc(chord.root - g.tonic) === n.ham && (n.ham !== 5 || baBlueIV(dat, g))
  : pc(chord.root - (g.scale === 'minor' ? g.tonic : g.tonic + 9)) === n.ham && n.thu === laHopAmThu(chord)

type SpanBlues = { chord: ParsedChord; start: number; beats: number }
/** Loại nhóm ba khi soạn: nghỉ · đáp ngắn / rải nhẹ · thưa · dày (câu chạy) · nối (1–2 nốt đáp vào phách 1 hợp âm mới, lượt 11). */
type KieuNhom = 'nghi' | 'dap' | 'thua' | 'day' | 'noi' | 'nhe'
type Ung = { n: Nhom | null; dat: SuDat[]; tin: boolean; lo: number; hi: number; bam: number }

/*
  LƯỢT 7 — BÁM HỢP ÂM (28/9/2026, ô tick riêng chồng lên lượt 6). Người dùng nghe lượt 6: *"tiết tấu đệm và phối hợp 2 tay đã
  ổn. Nhưng về giai điệu chạy nốt thì tạm được thôi (6/10 điểm). Tôi nghe thấy nốt chạy vẫn chưa bám hợp âm lắm. Hãy train lại
  bộ soạn để chạy nốt bám hợp âm hơn"*.
  Số đo (nốt đỉnh so GỐC hợp âm đang vang; `phan_tich_blues_ba_sheet.py --bam` và test `soanNhomBa.test.ts`, 5 vòng × 6 lượt):
                         phách 1·4 là nốt hợp âm · mọi nốt · hợp âm + ngũ cung của hợp âm · nốt đáp là nốt hợp âm
    Rockhouse             65% (n=304)         · 66%     · 88%                        · 64% (n=243)
    Rising Sun            73% (n=26)          · 59%     · 76%                        · 68% (n=19)
    Robert                66% (n=164)         · 65%     · 82%                        · 72% (n=111)
    Blue Sun lượt 6       61%                 · 53%     · 81%                        · 50%   ← nốt đáp hụt nhất
    Blue Sun lượt 7       98%                 · 73%     · 90%                        · 99%
  (phách mạnh ±0,2 móc — kho Rising Sun theo thời gian thật; bản đo đầu đòi đúng phách, bỏ sót cú lệch 1/12 móc.)
  Lượt 6 chỉ chấm NỐT ĐẦU nhóm, lại so CHỦ âm (`diemPhach`). Lượt 7 chấm MỌI NỐT so HỢP ÂM đang vang (`diemBam`): phách 1 · 4
  nốt hợp âm +2 / nốt blue 0 / khác −2; nốt đáp (lặng ≥ 1 móc sau nó, hoặc nhóm cuối trước chỗ đổi hợp âm) và nốt ngân ≥ 1,5 móc
  +1,5 / nốt blue 0 / khác −1,5; nốt lướt trong hợp âm + ngũ cung của hợp âm HOẶC nốt blue (so chủ: trưởng b3 · b5 · b7, thứ b5)
  +0,2, khác −0,3. Nốt blue ở khung được 0 chứ không bị trừ: Ray để b3 ở 9% phách mạnh trên I và 14% nốt kết câu. Hai bản thử
  bị bỏ: trừ nốt blue như nốt ngoài hợp âm → nốt blue Blues Claude 2% (lượt 6: 6%, Rockhouse 14%); trừ cả nốt blue lướt → như thế.
  Đích: rõ hơn cả ba sheet, vì tai người dùng nghe mức của sheet (lượt 6) là "chưa bám lắm". Trọng số là biên soạn của Claude.
*/
const nguCungHop = (c: ParsedChord) => {
  const iv = c.quality.intervals
  return new Set([...iv.map(pc), ...(laHopAmThu(c) ? [0, 2, 3, 5, 7, 10] : [0, 2, 4, 7, 9])])
}
function diemBam(dat: readonly SuDat[], chord: ParsedChord, g: Giong, dai: number, cuoiHop: boolean) {
  const ct = new Set(chord.quality.intervals.map(pc))
  const nc = nguCungHop(chord)
  const blue = g.scale === 'minor' ? [6] : [3, 6, 10]
  // Nốt KHUNG (phách mạnh · nốt đáp · nốt ngân) cộng dồn; nốt LƯỚT lấy trung bình × 2. Đo 5 vòng × 6 lượt, Blue Sun: cộng dồn cả
  // nhóm → ô 10 cú (lượt 3 · 6: 8 — nhóm nhiều nốt được lợi); trung bình cả nhóm × 4 → ô 5 cú, nốt blue Blues Claude còn 1%.
  let khung = 0, luot = 0, soLuot = 0
  dat.forEach((q, i) => {
    const r = pc(q.notes.at(-1)! - chord.root)
    const het = q.t + Math.min(q.d, dai - q.t)
    const dap = i === dat.length - 1 && (cuoiHop || dai - het >= 1 - 1e-6)
    // Phách mạnh ±0,2 móc — kho Rising Sun theo thời gian thật, cú "đầu phách" hay lệch 1/12 móc (cùng ngưỡng phép đo trên sheet).
    // Cú > 2,8 móc ở nhóm cuối trước chỗ đổi hợp âm là cú chồm sang hợp âm sau — chấm như nốt lướt.
    const laBlue = blue.includes(pc(q.notes.at(-1)! - g.tonic))
    if (q.t < .2 || (q.t > 2.8 && !cuoiHop)) khung += ct.has(r) ? 2 : laBlue ? 0 : -2
    else if (dap || het - q.t >= 1.5 - 1e-6) khung += ct.has(r) ? 1.5 : laBlue ? 0 : -1.5
    else {
      luot += nc.has(r) || laBlue ? .2 : -.3
      soLuot++
    }
  })
  return khung + (soLuot ? 2 * luot / soLuot : 0)
}

/**
 * SOẠN tay phải cho cả đoạn trên các hợp âm có mốc thời gian. `day(ô, hợp âm, ô cuối của hợp âm)` = ô dày (câu chạy / riff);
 * `muc` = số cú mỗi nhóm ba [ít nhất, nhiều nhất] cho ô thưa / ô dày. `nguon` = id nhóm từng nhóm ba đã dùng ('nghi' = nghỉ).
 */
export function soanCauBlues(spans: readonly SpanBlues[], o: {
  key: Giong; take: number; mocDon?: number; uuTien: Nhom['nguon']; tam: readonly [number, number]
  chiGiaiDieu?: boolean; day: (o: number, i: number, cuoi: boolean) => boolean
  muc: {
    thua: readonly [number, number]; day: readonly [number, number]; dap?: readonly [number, number]; noi?: readonly [number, number]
    nhe?: readonly [number, number]
  }
  /** Lực riêng theo loại nhóm (lượt 12: nốt nhẹ trong câu hát). */
  lucKieu?: Partial<Record<KieuNhom, number>>
  /** Lượt 12: nhóm 'noi' BẮT BUỘC có nốt đáp (câu chạy cuối câu hát rơi đúng phách 1 hợp âm mới). */
  noiBat?: boolean
  /** Hợp âm ĐANG VANG ở một phách (có hợp âm lướt) — chọn nhóm ba theo nó thay cho hợp âm chính của nhịp. */
  hopTai?: (beat: number) => ParsedChord
  /** Lượt 8: loại từng nhóm ba — 'nghi' (chừa chỗ cho giọng hát: không nốt nào) · 'dap' (câu đáp ngắn) · 'thua' · 'dày'.
   *  `nua` = nhóm ba thứ mấy trong ô (0 = phách 1–3, 1 = phách 4–6); `soO` = số ô của hợp âm. Không khai thì theo `day`. */
  loai?: (o: number, i: number, cuoi: boolean, nua: number, soO: number) => KieuNhom
  /** Tầm riêng theo loại nhóm (lượt 10: rải nhẹ 'dap' DƯỚI giọng hát, câu chạy 'day' tầm cao). Không khai → `tam`. */
  tamKieu?: Partial<Record<Exclude<KieuNhom, 'nghi'>, readonly [number, number]>>
  /** Trọng số hàm băm theo lượt (mặc định 0,8 — chỉ phá thế hoà). Lượt 10: 2,5 để mỗi lần bấm phát đổi được nhiều ô hơn. */
  doiLuot?: number
  luc: (manh: boolean, soNot: number) => number
  /** Lượt 7: chấm mọi nốt so hợp âm đang vang (`diemBam`) thay cho chấm nốt đầu nhóm so chủ âm. */
  bamHop?: boolean
  /** Lượt 11: câu TRỌN (mở / kết đúng chỗ mở / kết câu trong sheet, nốt cuối câu ngân đủ) và DẪN NỐI qua hợp âm kế tiếp. */
  noiHop?: boolean
  /** Chỉ lấy nhóm ba của một sheet (Twist: Rockhouse — 735/810 cú đúng lưới chùm ba; Rising Sun theo thời gian thật chỉ 25/185). */
  chiNguon?: Nhom['nguon']
  /** Nhóm 'noi': cú đáp cách nốt cuối câu trước [ít nhất, nhiều nhất] nửa cung (mặc định [0, 5]). Twist: [1, 2] — nốt cuối câu là
   *  nốt DẪN vào hợp âm sau, không phải chính nốt đáp (bản đầu cho 0: nhiều câu kết bằng đúng nốt đáp, 81 → 81). */
  noiBuoc?: readonly [number, number]
  /** Số nốt tối đa mỗi cú (Twist: 2 — nốt đơn và bè đôi như sheet Twist; bản đầu có riff chùm 4 nốt của Ray lặp 4 lần). */
  notToiDa?: number
  /** Mọi nhóm lặp liền được như riff (tối đa 2 lần), không chỉ nhóm chùm hợp âm của Ray — riff Slow Blues là hình ngắn lặp lại
   *  (Rising Sun E–G ×3, E–B ×5), không phải chùm hợp âm. */
  lapMoiNhom?: boolean
}): { events: TimelineEvent[]; nguon: string[] } {
  const g = o.key
  const MOC = o.mocDon ?? .5
  const NHOM3 = 3 * MOC
  const giongSet = new Set((g.scale === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map(x => pc(x + g.tonic)))
  // Nhóm trống (nghỉ) luôn được — Rockhouse 35/424 nhóm ba trống: chỗ nghỉ có chủ đích.
  const cache = new Map<string, Ung[]>()
  const ungVien = (chord: ParsedChord, dai: number, cuoiHop: boolean) => {
    const khoa = `${chord.symbol}|${dai}|${cuoiHop}`
    let u = cache.get(khoa)
    if (!u) {
      u = [{ n: null, dat: [], tin: false, lo: 0, hi: 0, bam: 0 }]
      for (const n of KHO_NHOM) {
        if (o.chiGiaiDieu && n.kieu === 'riff' && n.nguon === 'ray') continue
        if (o.chiNguon && n.nguon !== o.chiNguon) continue
        if (o.notToiDa && n.su.some(s => new Set(s[2]).size > o.notToiDa!)) continue
        const d = doiNhom(n, g)
        const dat = n.su.filter(s => s[0] < dai - 1e-6).map(([t, dd, ns]) => ({ t, d: dd, notes: ns.map(x => x + d) }))
        if (!dat.length) continue
        const cat = dat.map(s => ({ ...s, d: Math.min(s.d, dai - s.t) }))
        const tin = tinNhom(n, cat, chord, g)
        if (!tin && !hopVoi(cat, chord, g, dai)) continue
        const tat = dat.flatMap(s => s.notes)
        u.push({ n, dat, tin, lo: Math.min(...tat), hi: Math.max(...tat), bam: o.bamHop ? diemBam(dat, chord, g, dai, cuoiHop) : 0 })
      }
      cache.set(khoa, u)
    }
    return u
  }

  type O = { chord: ParsedChord; i: number; at: number; dai: number; kieu: KieuNhom; cuoiHop: boolean; hetHop: number }
  const oList: O[] = []
  let soO = 0
  for (const [i, span] of spans.entries()) {
    const het = span.start + span.beats
    for (let at = span.start; at < het - 1e-6; at += NHOM3) {
      const oThu = Math.floor((at - span.start + 1e-6) / (2 * NHOM3))
      if (Math.abs(at - span.start - oThu * 2 * NHOM3) < 1e-6) soO++
      const cuoi = span.start + (oThu + 1) * 2 * NHOM3 >= het - 1e-6
      const nua = Math.round((at - span.start - oThu * 2 * NHOM3) / NHOM3)
      const kieu = o.loai
        ? o.loai(soO - 1, i, cuoi, nua, Math.ceil(span.beats / (2 * NHOM3) - 1e-6))
        : o.day(soO - 1, i, cuoi) ? 'day' : 'thua'
      // Nhóm 'noi': chỉ phần đầu 1,5 móc của một nhóm ba thật — nốt đáp vào phách 1 hợp âm mới.
      const dai = Math.min(NHOM3, het - at) / MOC
      oList.push({ chord: o.hopTai?.(at) ?? span.chord, i, at, dai: kieu === 'noi' ? Math.min(dai, 1.5) : dai, kieu,
        cuoiHop: at + NHOM3 >= het - 1e-6, hetHop: het })
    }
  }

  type Chon = { u: Ung; doi: number }
  // Nút chùm trỏ về nút cha (không chép cả đường mỗi ứng viên). `gan` = id 16 nhóm gần nhất.
  type Nut = { cha: Nut | null; c: Chon | null; diem: number; cuoi: number | null; het: number; lien: number; lap: number; gan: (string | undefined)[] }
  let chum: Nut[] = [{ cha: null, c: null, diem: 0, cuoi: null, het: -99, lien: 0, lap: 0, gan: [] }]
  const lui = (nut: Nut, k: number) => {
    let x: Nut | null = nut
    for (let i = 1; i < k && x; i++) x = x.cha
    return x?.c ?? null
  }
  oList.forEach((s, j) => {
    const moc0 = s.at / MOC
    const [it, nhieu] = s.kieu === 'nghi' ? [0, 0] : s.kieu === 'dap' ? o.muc.dap ?? [2, 4] : s.kieu === 'noi' ? o.muc.noi ?? [1, 2]
      : s.kieu === 'nhe' ? o.muc.nhe ?? [1, 2] : o.muc[s.kieu]
    const sauKieu = oList[j + 1]?.kieu
    const truocKieu = oList[j - 1]?.kieu
    const n0 = (u: Ung) => u.n !== null
    const moi: { nut: Nut; u: Ung; doi: number; diem: number; cuoi: number | null; het: number; lien: boolean; lap: boolean }[] = []
    for (const nut of chum) {
      const truoc = nut.c
      const cach8 = lui(nut, 8)?.u.n
      // Nhóm nghỉ: chỉ ứng viên trống — chừa chỗ cho giọng hát.
      for (const [k, u] of (s.kieu === 'nghi' ? ungVien(s.chord, s.dai, s.cuoiHop).slice(0, 1) : ungVien(s.chord, s.dai, s.cuoiHop)).entries()) {
        const n = u.n
        const cu = u.dat.length
        // Câu đáp khi chừa chỗ cho ca sĩ (`loai`): mức trên là trần cứng — trừ điểm nhẹ thì có câu đáp vượt (6 cú ở mức 4–5).
        if (o.loai && s.kieu !== 'thua' && cu > nhieu) continue
        // Lượt 11: câu chạy đủ số cú tối thiểu (trần DƯỚI cứng) — thưởng "kết câu" thắng điểm mật độ thì câu chạy teo còn 2–3 cú.
        if (o.noiHop && (s.kieu === 'day' || s.kieu === 'dap') && n0(u) && cu < it) continue
        // Chừa chỗ cho ca sĩ (`loai`, Bản Blues rút gọn): nốt ở phách 1 · 4 (cú ≤ 0,2 móc đầu nhóm) phải trong giọng hoặc là nốt hợp âm
        // — nốt blue chỉ LƯỚT giữa phách. Đo bài người dùng: Bb5 chồng B5 đúng phách 4 trên B3 tay trái → hợp âm chói ("nghe bị phô").
        if (o.loai && n0(u) && u.dat.some(q => q.t < .2 && q.notes.some(x => !giongSet.has(pc(x)) &&
          !s.chord.quality.intervals.some(v => pc(v + s.chord.root) === pc(x))))) continue
        // …và nốt ở phách 1 · 4, nốt ngân ≥ 1 móc, nốt cuối nhóm (vang tới nhóm sau) không là NỐT TRÁNH của hợp âm đang vang
        // (`tranhVang`: b9 · 11 trên hợp âm trưởng · b13). Đo ô D9 hết câu: G4 · G5 ngân trên D9 (bậc 11). Nốt tránh chỉ còn LƯỚT.
        if (o.loai && n0(u) && u.dat.some((q, k) => (q.t < .2 || q.d >= 1 - 1e-6 || k === u.dat.length - 1) &&
          q.notes.some(x => tranhVang(s.chord, x)))) continue
        // Nốt nhẹ trong câu hát: không đặt ở phách mạnh (cú đầu ≥ 0,4 móc) — xen giữa các cú tay trái phách 1 · 4; và chỉ nốt TRONG
        // GIỌNG hoặc nốt hợp âm — nốt nhẹ nằm dưới giọng hát, nốt blue để dành cho câu chạy cuối câu (người dùng: "nghe bị phô").
        if (s.kieu === 'nhe' && n0(u) && (u.dat[0]!.t < .4 || u.dat.some(q => q.notes.some(x => !giongSet.has(pc(x)) &&
          !s.chord.quality.intervals.some(v => pc(v + s.chord.root) === pc(x)))))) continue
        let d = nut.diem + (bam(o.take, j * 37 + k) % 1000) / 1000 * (o.doiLuot ?? .8)
        d += cu < it ? -Math.min(4, it - cu) : cu > nhieu ? -Math.min(4, cu - nhieu) : 2
        if (!n) {
          // Nhóm 'noi' để trống: dừng gọn khi câu trước đã kết đúng chỗ kết câu trong sheet (+1,5), câu còn dở thì bị trừ (−2).
          if (o.noiHop && s.kieu === 'noi') d += truoc?.u.n?.ket ? 1.5 : -2
          if (o.noiBat && s.kieu === 'noi') d -= 6
          moi.push({ nut, u, doi: 0, diem: d, cuoi: nut.cuoi, het: nut.het, lien: false, lap: false })
          continue
        }
        if (o.noiHop && s.kieu === 'noi' && truoc?.u.n && !truoc.u.n.ket) d += 1.5
        const lienNguon = truoc?.u.n?.ke === n.id
        const lapRiff = truoc?.u.n === n
        // Quãng tám cả nhóm: nối đúng câu sheet / lặp riff → giữ quãng tám nhóm trước; còn lại nốt đầu gần nốt cuối nhóm trước
        // (mở đoạn: giữa tầm).
        const dau = u.dat[0]!.notes.at(-1)!
        const [lo, hi] = (s.kieu !== 'nghi' && o.tamKieu?.[s.kieu]) || o.tam
        const giua = (lo + hi) / 2
        const vua = (q: number) => u.lo + q >= lo && u.hi + q <= hi
        const xa = (q: number) => nut.cuoi === null ? Math.abs((u.lo + u.hi) / 2 + q - giua) : Math.abs(dau + q - nut.cuoi)
        let doi: number | null = (lienNguon || lapRiff) && vua(truoc!.doi) ? truoc!.doi : null
        if (doi === null) for (let q = -36; q <= 36; q += 12) if (vua(q) && (doi === null || xa(q) < xa(doi))) doi = q
        if (doi === null) continue
        // Nhóm 'noi': cú đầu đúng phách 1 (±0,2 móc), là nốt của hợp âm mới, cách nốt cuối câu trước ≤ quãng 4 (5 nửa cung).
        // MỌI nốt của cú đáp là nốt hợp âm mới — cũ chỉ xét nốt đỉnh: C5+E5 đáp trên Em9 (C = b13, chói).
        if (s.kieu === 'noi' && (nut.cuoi === null || u.dat[0]!.t >= .2 || Math.abs(dau + doi - nut.cuoi) > (o.noiBuoc?.[1] ?? 5) ||
          Math.abs(dau + doi - nut.cuoi) < (o.noiBuoc?.[0] ?? 0) ||
          u.dat[0]!.notes.some(x => !hopPc(s.chord).includes(pc(x))))) continue
        const vao = moc0 + u.dat[0]!.t
        const noiGiua = nut.cuoi !== null && vao - nut.het < 1 - 1e-6
        if (u.tin) d += 1
        if (lienNguon) d += nut.lien < 3 ? 3 : -2
        else if (noiGiua) {
          const buoc = Math.abs(dau + doi - nut.cuoi!)
          d += buoc >= 1 && buoc <= 2 ? .5 : buoc >= 5 ? -.5 : 0
          const giai = GIAI[g.scale === 'minor' ? 'minor' : 'major'][pc(nut.cuoi! - g.tonic)]
          if (giai) d += giai.includes(pc(dau - g.tonic)) && buoc <= 3 ? 1 : -.5
        } else if (nut.cuoi !== null && u.dat[0]!.t >= 2 - 1e-6) d += .5
        if (o.bamHop) d += u.bam
        else if (u.dat[0]!.t < 1e-6) d += diemPhach(dau, s.chord, g)
        if (cach8 && cach8.id !== n.id && cach8.nhip === n.nhip) d += 1
        if (lapRiff) d += (n.kieu === 'riff' || o.lapMoiNhom) && nut.lap < 2 ? 1.5 : -4
        else if (nut.gan.includes(n.id)) d -= 4
        if (n.nguon === o.uuTien) d += 1
        if (g.scale === 'minor' && n.nguon === 'sun') d += 1
        const cuoiNot = u.dat.at(-1)!.notes.at(-1)! + doi
        if (o.noiHop) {
          /*
            CÂU TRỌN (lượt 11): nhóm kết câu đặt trước chỗ nghỉ / hết đoạn (+2, không kết −1,5); nhóm mở câu đặt sau chỗ nghỉ (+1,5).
            DẪN NỐI: nhóm đứng trước nhóm 'noi' — nốt cuối là nốt của hợp âm MỚI (vào sớm / nốt chung) hoặc cách một nốt hợp âm
            mới nửa cung mà không thuộc hợp âm cũ (nốt dẫn): +1. Số đo ba sheet: câu chạy xuyên vạch đổi hợp âm Rockhouse 41/63,
            Rising Sun 12/13, Robert 25/70; nốt cuối trước vạch: vào sớm 16–29% · nốt dẫn nửa cung 12–20% · nốt chung 7–42%.
          */
          if ((sauKieu === undefined || sauKieu === 'nghi') && s.kieu !== 'thua') d += n.ket ? 2 : -1.5
          if (truocKieu === 'nghi' || j === 0) d += n.mo || u.dat[0]!.t >= 1 ? 1.5 : 0
          if (sauKieu === 'noi') {
            const nx = oList[j + 1]!.chord
            const moi = new Set(nx.quality.intervals.map(x => pc(x + nx.root)))
            const cu = new Set(s.chord.quality.intervals.map(x => pc(x + s.chord.root)))
            const [it0, nhieu0] = o.noiBuoc ?? [0, 5]
            if (it0 >= 1) {
              // Twist (`noiBuoc` [1, 2]): nốt cuối là nốt DẪN — cách một nốt hợp âm mới 1–2 nửa cung, không phải chính nốt ấy. Kết đúng
              // nốt hợp âm mới thì hợp âm ba không còn cú đáp nào cách 1–2 nửa cung (F–A–C) → cú đáp trống (đo bản đầu).
              const dan = !moi.has(pc(cuoiNot)) &&
                Array.from({ length: nhieu0 - it0 + 1 }, (_, b) => b + it0).some(b => moi.has(pc(cuoiNot + b)) || moi.has(pc(cuoiNot - b)))
              d += dan ? 2 : -2
            } else if (moi.has(pc(cuoiNot)) || ((moi.has(pc(cuoiNot + 1)) || moi.has(pc(cuoiNot - 1))) && !cu.has(pc(cuoiNot)))) d += 1
          }
        }
        if (j === oList.length - 1) {
          const b = pc(cuoiNot - g.tonic)
          d += b === 0 || b === 7 ? 2 : b === (g.scale === 'minor' ? 3 : 4) ? 1 : 0
        }
        const het = Math.max(...u.dat.map(q => moc0 + q.t + Math.min(q.d, s.dai - q.t)))
        moi.push({ nut, u, doi, diem: d, cuoi: cuoiNot, het, lien: lienNguon, lap: lapRiff })
      }
    }
    chum = moi.sort((a, b) => b.diem - a.diem).slice(0, 16).map(m => ({
      cha: m.nut, c: { u: m.u, doi: m.doi }, diem: m.diem, cuoi: m.cuoi, het: m.het,
      lien: m.lien ? m.nut.lien + 1 : 0, lap: m.lap ? m.nut.lap + 1 : 0, gan: [...m.nut.gan.slice(-15), m.u.n?.id],
    }))
  })

  const tot: Chon[] = []
  for (let x: Nut | null = chum[0] ?? null; x?.c; x = x.cha) tot.unshift(x.c)
  const events: TimelineEvent[] = []
  tot.forEach((c, j) => {
    const s = oList[j]!
    const sau = tot[j + 1]
    // Nốt ngân qua vạch nhóm chỉ giữ khi nhóm kế là nhóm sau trong sheet VÀ cùng hợp âm; không thì cắt ở vạch nhóm.
    const giuNgan = !!sau?.u.n && c.u.n?.ke === sau.u.n.id && oList[j + 1]!.i === s.i
    // Lượt 11: nốt CUỐI CÂU (nhóm sau trống) ngân đủ như sheet, tới chỗ đổi hợp âm — cũ: cắt ở vạch nhóm → câu nghe cụt.
    const hetCau = o.noiHop && !sau?.u.n
    c.u.dat.forEach((q, k) => {
      const cuoiCau = hetCau && k === c.u.dat.length - 1
      const dai = giuNgan ? q.d : cuoiCau ? Math.min(q.d, (s.hetHop - s.at) / MOC - q.t) : Math.min(q.d, s.dai - q.t)
      events.push({ hand: 'right', startBeat: s.at + q.t * MOC, durationBeats: dai * MOC,
        notes: q.notes.map(x => x + c.doi) as MidiNote[], velocity: o.lucKieu?.[s.kieu] ?? o.luc(q.t < 1e-6, q.notes.length) })
    })
  })
  return { events, nguon: tot.map(c => c.u.n?.id ?? 'nghi') }
}
