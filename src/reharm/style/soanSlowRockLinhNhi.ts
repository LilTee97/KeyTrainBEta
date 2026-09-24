import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { parseChordInput } from '../input/chordInputParser'
import type { ParsedChord } from '../types'
import type { PhraseSection } from './phraseSection'
import type { TimelineEvent } from './types'
import { NGUON_SOLO_SR, type NguonSR, type OSR } from './slowRockLinhNhiNguon'

/*
  BỘ SOẠN CÂU SOLO SLOW ROCK LINH NHI — soạn câu MỚI trên tiết tấu slow rock của chị.
  Ý kiến khi nghe: md Linh Nhi mục 16S (tách khỏi Bolero). Số đo: 13e, 13f.

  Người dùng 24/9/2026, ba lượt:
    1. *"đừng lấy những phần từ câu solo của điệu khác rồi dồn ép vào"* — tiết tấu phải của slow rock.
    2. *"ưu tiên phải soạn câu solo mới trên tiết tấu điệu Slow rock Lá Thư"*.
    3. *"Vòng hợp âm phải được đổi mới … Bạn có hợp âm và giai điệu từ các sheet bolero nữa nên hãy
       tận dụng chúng"* · *"có quyền điều chỉnh lại sao cho giai điệu khớp với tiết tấu của điệu"*.
  Cách hiểu (của tôi): TIẾT TẤU luôn là ô slow rock của chị; bolero góp VÒNG HỢP ÂM và ĐƯỜNG CAO ĐỘ,
  đặt lên tiết tấu slow rock — không còn đổi nhịp bolero sang 12/8.

  1. NẮN NHỊP (`nanNhip`). Bản ký âm Một Cõi hỏng nhịp: 31 mốc tay phải lệch lưới 6/8 trong 14/29 ô
     (ba nốt nhét vào chỗ hai móc đơn, cả ô trượt 0,375 phách); Lá Thư 0/20 ô. Người dùng nghe ra
     "bóp nhanh … lệch tiết tấu" ở 4/4 câu Chưa ổn (#1374 · #1376 · #1377 · #1378). Ô hỏng dời mọi mốc
     về móc đơn gần nhất; móc kép chỉ giữ khi nằm trong câu chạy liền; nốt dư thì bỏ, bỏ nốt hoa mỹ trước,
     giữ nốt quãng tám / chồng nốt sau cùng. Ô sạch chỉ bỏ nốt hoa mỹ lệch lưới.
  2. VÒNG MỚI MỖI LƯỢT (`vongMoi`): ghép ĐẦU một vòng solo thật của chị với ĐUÔI một vòng thật cùng loại
     đoạn, nối ở một hợp âm hai vòng cùng có; vòng thật cùng giọng của cả slow rock lẫn bolero, mỗi hợp
     âm một ô 6/8 (nhịp hoà âm slow rock 48/49 ô). Bỏ vòng trùng nguyên một vòng có sẵn; chỗ nối vào cử
     chỉ kết phải là bước chị đã đi. Lượt `take` xoay qua các vòng khớp vốn bài nhất.
  3. VẬT LIỆU NỐT: ô slow rock (Lá Thư, Một Cõi — đã nắn) + ô LAI: đường cao độ một ô bolero cùng giọng
     đặt lên tiết tấu một ô slow rock có số mốc gần nhất (bỏ tối đa 3 nốt, giữ nốt đầu và cuối); nốt
     quãng tám và chồng nốt theo đúng ô slow rock ấy. Mỗi ô đặt lên hợp âm đích bằng chuyển bậc theo gam,
     nốt bậc 3 · 5 · 7 lệch nửa cung về nốt hợp âm.
  4. CHỌN Ô bằng điểm phạt theo quy luật đo (md 13e, trên 6 đoạn slow rock): nối ô ≤ 2 nửa cung 23/43;
     phách mạnh nốt hợp âm 67/81, phách nhẹ 165/194; không lặp hình ô trước (0/49); ô nghỉ ≥ nửa ô 1/49;
     ô thưa ≤ 2 mốc 4/49; câu chạy ở nửa sau 8/12. HỆ SỐ PHẠT là biên soạn, chưa đo.
  5. Ô KẾT: cử chỉ kết thật của chị (đã nắn nhịp), giữ hợp âm của nó.
*/

type Doan = 'intro' | 'interlude' | 'outro'
type H = OSR['h'][number]
type Go = OSR['r'][number]
type O6 = OSR
/** Một ô đem ghép: `src.o[i]`; `giaiDieu` · `nhip` ghi nguồn cho `compositionSources`. */
type Nguon = { src: NguonSR; i: number; mo: boolean; giaiDieu: string; nhip: string; lai: boolean; khoa: string }
type Not = { at: number; dur: number; notes: number[] }

const O = 3
const VELO_PHAI = 76
const VELO_TRAI = 62
const GAM_THU = [0, 2, 3, 5, 7, 8, 10]
const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
const EPS = 1e-6

export const nhom = (quang: readonly number[]): string => {
  const q = new Set(quang.map((x) => ((x % 12) + 12) % 12))
  if (q.has(3) && q.has(6) && !q.has(7)) return 'dim'
  if (q.has(3)) return 'm'
  if (q.has(4) && q.has(10)) return '7'
  if (q.has(4)) return 'M'
  return 'sus'
}

/** Chất trong bảng nguồn → nhóm, cùng thang với `nhom`. */
export const nhomHau = (hau: string): string => {
  if (/m7\(?b5|dim|°/.test(hau)) return 'dim'
  if (/^m(?!aj)/.test(hau)) return 'm'
  if (/^(7|9|13|11)/.test(hau)) return '7'
  if (/sus/.test(hau)) return 'sus'
  return 'M'
}

/** Hậu tố nguồn → hậu tố bộ đọc hợp âm của app hiểu. */
export const hauApp = (hau: string) =>
  hau === 'm7(b5)' ? 'm7b5' : hau === 'sus' ? 'sus4' : hau === 'mMaj7' ? 'm(maj7)' : hau

export const dauGiang = (tonic: PitchClass, thu: boolean) =>
  (thu ? [2, 7, 0, 5, 10, 3] : [5, 10, 3, 8, 1, 6]).includes(tonic) ? 'flat' : 'sharp'

const vonCuaBai = (tonic: PitchClass, songChords: readonly ParsedChord[]) =>
  new Set(songChords.map((c) => `${((c.root - tonic) % 12 + 12) % 12}${nhom(c.quality.intervals)}`))

/** Các đoạn solo cùng giọng, cùng loại đoạn, khớp vốn hợp âm bài nhất đứng trước. */
export function nguonChoBai(doan: Doan, thu: boolean, tonic: PitchClass,
  songChords: readonly ParsedChord[]): { src: NguonSR; khop: number }[] {
  const bai = vonCuaBai(tonic, songChords)
  return NGUON_SOLO_SR
    .filter((s) => s.thu === thu && s.doan === doan)
    .map((src) => {
      const von = [...new Set(src.o.flatMap((o) => o.h.map((x) => `${x[1]}${nhomHau(x[2])}`)))]
      const khop = bai.size === 0 || von.length === 0 ? 0 : von.filter((v) => bai.has(v)).length / von.length
      return { src, khop }
    })
    .sort((a, b) => b.khop - a.khop
      || (a.src.dieu === 'slow rock' ? 0 : 1) - (b.src.dieu === 'slow rock' ? 0 : 1)
      || a.src.id.localeCompare(b.src.id))
}

// ── 1. Nắn nhịp ──────────────────────────────────────────────────────────────────────────────

const tren = (p: number, u: number) => Math.abs(p / u - Math.round(p / u)) < EPS
const hoaMy = (g: Go) => g[1] <= 0.125 + EPS

/**
 * Nắn một tay của một ô 6/8 về lưới của điệu. Ô không có mốc lệch lưới móc kép thì giữ nguyên (chỉ
 * bỏ nốt hoa mỹ lệch lưới). Ô hỏng: gán mốc theo thứ tự vào móc đơn, móc kép chỉ cho nốt vốn nằm
 * đúng móc kép VÀ có nốt kề cách một móc kép (câu chạy); cực tiểu tổng quãng dời + phạt bỏ nốt.
 * Phạt bỏ (biên soạn): nốt hoa mỹ 0,1 · nốt thường 0,35 + 0,1 mỗi nốt chồng thêm.
 */
export function nanNhip(gs: readonly Go[], choMocKep: boolean): Go[] {
  const ev = [...gs].filter((g) => tren(g[0], 0.25) || !hoaMy(g)).sort((a, b) => a[0] - b[0])
  if (ev.every((g) => tren(g[0], 0.25))) return ev
  const dung = new Set(ev.filter((g) => tren(g[0], 0.25)).map((g) => g[0]))
  const cho = [0, 0.5, 1, 1.5, 2, 2.5]
  if (choMocKep) {
    for (const p of dung) if (!tren(p, 0.5) && (dung.has(p - 0.25) || dung.has(p + 0.25))) cho.push(p)
  }
  cho.sort((a, b) => a - b)
  const memo = new Map<number, { cost: number; gan: number[] }>()
  const best = (i: number, j: number): { cost: number; gan: number[] } => {
    if (i === ev.length) return { cost: 0, gan: [] }
    const nho = memo.get(i * 64 + j)
    if (nho) return nho
    const g = ev[i]!
    const bo = best(i + 1, j)
    let tot = { cost: (hoaMy(g) ? 0.1 : 0.35 + 0.1 * (g[2].length - 1)) + bo.cost, gan: [-1, ...bo.gan] }
    for (let k = j; k < cho.length; k += 1) {
      const s = cho[k]!
      const d = Math.abs(s - g[0])
      if ((!tren(s, 0.5) && d > EPS) || d > 0.5 + EPS) continue
      const sau = best(i + 1, k + 1)
      if (d + sau.cost < tot.cost - EPS) tot = { cost: d + sau.cost, gan: [k, ...sau.gan] }
    }
    memo.set(i * 64 + j, tot)
    return tot
  }
  const { gan } = best(0, 0)
  const giu = ev.flatMap((g, i) => (gan[i]! >= 0 ? [{ g, s: cho[gan[i]!]! }] : []))
  return giu.map(({ g, s }, i) => {
    const het = Math.max(s + 0.25, Math.round((g[0] + g[1]) * 4) / 4)
    const sau = giu[i + 1]?.s
    return [s, Math.max(0.25, Math.min(het, sau ?? het) - s), g[2]] as const
  })
}

const SLOW_GOC = NGUON_SOLO_SR.filter((s) => s.dieu === 'slow rock')
/** Ô slow rock đã nắn nhịp — `DA_NAN` giữ khoá các ô bị dời mốc để ghi vào nguồn. */
const DA_NAN = new Set<string>()
const SLOW: readonly NguonSR[] = SLOW_GOC.map((src) => ({
  ...src,
  o: src.o.map((o, i): O6 => {
    const r = nanNhip(o.r, true)
    const l = nanNhip(o.l, false)
    const doi = (a: readonly Go[], b: readonly Go[]) =>
      a.length !== b.length || a.some((g, k) => Math.abs(g[0] - b[k]![0]) > EPS)
    if (doi(r, o.r.filter((g) => tren(g[0], 0.25) || !hoaMy(g)))) DA_NAN.add(`${src.id}#${i}`)
    return { ...o, r, l }
  }),
}))

/** Số ô cuối là cử chỉ kết — đặt cuối đoạn, không đem ghép giữa đoạn. */
const SO_O_KET: Record<string, number> = {
  // Lá Thư kết = trọn cử chỉ Isus4 Isus4 → I I (c140–c143). Cũ: 2 (chỉ hai ô I) — không nối được vào
  // vòng giọng thứ nào vì i → I trưởng chưa từng có trong vòng của chị.
  'la-thu-tran-the-intro': 1, 'la-thu-tran-the-interlude': 1, 'la-thu-tran-the-outro': 4,
  // Một Cõi dạo/giang: chỉ giữ ô ngân V cuối (o10); ô chạy V7 trước nó soạn mới từ kho. Cũ: 2 — câu nào
  // cũng kết bằng đúng hai ô sheet, cộng ô dập Lá Thư là hai cái đuôi cố định luân phiên 10/10 lượt, người
  // dùng nghe "giang tấu vẫn ko đổi câu mới" (24/9/2026).
  'mot-coi-di-ve-intro': 1, 'mot-coi-di-ve-interlude': 1, 'mot-coi-di-ve-outro': 3,
}

// ── Gam, bậc, hợp âm ────────────────────────────────────────────────────────────────────────

const gamCua = (thu: boolean) => (thu ? GAM_THU : GAM_TRUONG)

/** Nửa cung so với chủ âm → bậc trong gam (đếm liên tục qua quãng tám) + dấu hoá. */
function bacCua(rel: number, gam: readonly number[]): { bac: number; hoa: number } {
  const q = Math.floor(rel / 12)
  const pc = ((rel % 12) + 12) % 12
  const s = gam.indexOf(pc)
  // Nốt ngoài gam = bậc ngay dưới thăng nửa cung (hai gam đều có bậc ngay dưới mọi nốt ngoài gam).
  return s >= 0 ? { bac: q * 7 + s, hoa: 0 } : { bac: q * 7 + gam.indexOf(pc - 1), hoa: 1 }
}

const caoCua = (bac: number, hoa: number, gam: readonly number[]) =>
  Math.floor(bac / 7) * 12 + gam[((bac % 7) + 7) % 7]! + hoa

const bacGoc = (goc: number, gam: readonly number[]) => ((bacCua(goc, gam).bac % 7) + 7) % 7

type HopAm = { tap: Set<number>; bac: Record<number, number>; tranh: Set<number> }
const HOP_AM = new Map<string, HopAm>()
/**
 * Quãng bậc 3 · 5 · 7 (theo số bậc trên gốc: 2 · 4 · 6), tập nốt hợp âm và nốt TRÁNH (bậc ba
 * trên hợp âm sus — nghe phô) — tất cả tính so với chủ âm.
 */
function hopAm(h: H): HopAm {
  const khoa = `${h[1]}|${h[2]}`
  const nho = HOP_AM.get(khoa)
  if (nho) return nho
  const g = nhomHau(h[2])
  const ba = g === 'm' || g === 'dim' ? 3 : g === 'sus' ? 5 : 4
  const nam = g === 'dim' || /b5/.test(h[2]) ? 6 : 7
  const bay = /maj7|Δ/.test(h[2]) ? 11 : /7|9|11|13/.test(h[2]) ? (g === 'dim' && !/m7/.test(h[2]) ? 9 : 10) : null
  const bac: Record<number, number> = { 2: ba, 4: nam }
  if (bay !== null) bac[6] = bay
  const ra = {
    tap: new Set([0, ba, nam, ...(bay === null ? [] : [bay])].map((x) => (h[1] + x) % 12)),
    bac,
    tranh: new Set(g === 'sus' ? [(h[1] + 3) % 12, (h[1] + 4) % 12] : []),
  }
  HOP_AM.set(khoa, ra)
  return ra
}

/** Hợp âm của ô kết sang giọng trưởng: chủ thứ thành chủ trưởng; V · V7 · I giữ nguyên. */
const hopAmKet = (h: H, thu: boolean): H =>
  !thu && h[1] === 0 && nhomHau(h[2]) === 'm' ? [h[0], 0, h[2].replace(/^m/, ''), h[3]] : h

const khoaHop = (h: H) => `${h[1]}${nhomHau(h[2])}`

// ── 2. Vòng hợp âm mới ──────────────────────────────────────────────────────────────────────

/** Vòng của một đoạn, mỗi hợp âm một ô 6/8; một hợp âm đứng quá hai ô liền thì gọn còn hai. */
function vongPhang(src: NguonSR): H[] {
  const hs = src.o.flatMap((o) => o.h.map((h) => [0, h[1], h[2], h[3]] as H))
  return hs.filter((h, k) => k < 2 || khoaHop(h) !== khoaHop(hs[k - 1]!) || khoaHop(h) !== khoaHop(hs[k - 2]!))
}

type VongMoi = { hs: H[]; tu: string; khop: number }

/**
 * Vòng mới = đầu vòng A (hợp âm 1…a) + đuôi vòng B cùng loại đoạn (sau hợp âm b), với A[a] và B[b]
 * cùng bậc cùng chất. Đuôi mất `soKet` hợp âm cuối để nhường cử chỉ kết `ket`.
 *
 * Giới hạn theo 23 vòng solo thật của chị (đo 24/9/2026): dạo/giang dài 7–12 ô, 5–10 hợp âm khác
 * nhau; kết dài 4–14, 2–7 hợp âm khác nhau (lấy sàn 3 — hai vòng kết 2 hợp âm là cử chỉ ngân, không
 * phải vòng). Hợp âm mở đầu phải là hợp âm chị từng mở loại đoạn ấy cùng giọng.
 */
export function vongMoi(kind: Doan, thu: boolean, bai: Set<string>, ket: readonly H[]): VongMoi[] {
  const nguon = NGUON_SOLO_SR.filter((s) => s.thu === thu).map((s) => ({ s, hs: vongPhang(s) }))
  // Bước gốc → gốc chị đã đi (nối vào cử chỉ kết xét theo gốc: chất V/V7, i/I Picardy do cử chỉ mang).
  const cap = new Set(nguon.flatMap(({ hs }) => hs.slice(1).map((h, k) => `${hs[k]![1]}>${h[1]}`)))
  // So "trùng vòng có sẵn" sau khi gộp hợp âm đứng liền — Am Am khác Am theo ô nhưng tai nghe là một.
  const gon = (khoa: readonly string[]) => khoa.filter((x, k) => k === 0 || x !== khoa[k - 1]).join(' ')
  const goc = new Set(nguon.map(({ hs }) => gon(hs.map(khoaHop))))
  // Thân vòng trùng khúc đầu một vòng có sẵn = vòng cũ cắt ngắn gắn kết khác — cũng là vòng cũ.
  const dauGoc = new Set(nguon.flatMap(({ hs }) => {
    const g = gon(hs.map(khoaHop)).split(' ')
    return g.map((_, k) => g.slice(0, k + 1).join(' '))
  }))
  const mo = new Set(nguon.filter(({ s }) => s.doan === kind).map(({ hs }) => khoaHop(hs[0]!)))
  const [dai0, dai1, khac0] = kind === 'outro' ? [5, 12, 3] : [7, 12, 5]
  const ra = new Map<string, VongMoi>()
  for (const A of nguon) {
    for (const B of nguon.filter((x) => x.s.doan === kind)) {
      for (let a = 1; a < A.hs.length; a += 1) {
        for (let b = 1; b < B.hs.length - 1; b += 1) {
          if (khoaHop(A.hs[a]!) !== khoaHop(B.hs[b]!)) continue
          const than = [...A.hs.slice(0, a + 1), ...B.hs.slice(b + 1)].slice(0, -ket.length || undefined)
          const hs = [...than, ...ket]
          if (than.length < 4 || hs.length < dai0 || hs.length > dai1) continue
          const khoa = hs.map(khoaHop)
          if (!mo.has(khoa[0]!) || new Set(khoa).size < khac0) continue
          if (goc.has(gon(khoa)) || dauGoc.has(gon(than.map(khoaHop)))) continue
          // Ba ô liền một hợp âm: chỉ xét phần vòng + ô kết đầu (Một Cõi kết tự ngân i i i).
          if (khoa.slice(0, than.length + 1).some((x, k) => k >= 2 && x === khoa[k - 1] && x === khoa[k - 2])) continue
          const cuoi = than[than.length - 1]![1]
          if (cuoi !== ket[0]![1] && !cap.has(`${cuoi}>${ket[0]![1]}`)) continue
          const ten = hs.map((h) => `${khoaHop(h)}${h[2]}`).join(' ')
          if (ra.has(ten)) continue
          const von = [...new Set(khoa)]
          const khop = bai.size === 0 ? 1 : von.filter((v) => bai.has(v)).length / von.length
          ra.set(ten, { hs, khop, tu: `${A.s.id} hợp âm 1–${a + 1} + ${B.s.id} từ hợp âm ${b + 2}` })
        }
      }
    }
  }
  const tat = [...ra.entries()].sort((x, y) => y[1].khop - x[1].khop || x[0].localeCompare(y[0])).map((x) => x[1])
  const dinh = tat[0]?.khop ?? 0
  return tat.filter((v) => v.khop >= dinh - 0.2 - EPS)
}

// ── 3. Kho ô: ô slow rock + ô lai (cao độ bolero trên tiết tấu slow rock) ─────────────────────

const tenO = (src: NguonSR, i: number) => `${src.id} ô ${i + 1}`
const nhipO = (src: NguonSR, i: number) => `${tenO(src, i)}${DA_NAN.has(`${src.id}#${i}`) ? ' (nắn nhịp)' : ''}`

/** Ô slow rock giữa đoạn (không phải cử chỉ kết), một hợp âm. */
const O_SLOW: readonly Nguon[] = SLOW.flatMap((src) => src.o.map((o, i) => ({ src, i, o })))
  .filter(({ src, i, o }) => i < src.o.length - (SO_O_KET[src.id] ?? 1) && o.h.length === 1 && o.r.length > 0)
  .map(({ src, i }) => ({ src, i, mo: i === 0, giaiDieu: tenO(src, i), nhip: nhipO(src, i), lai: false, khoa: `${src.id}#${i}` }))

const dinhGo = (gs: readonly Go[]) => [...gs].sort((a, b) => a[0] - b[0]).map((g) => Math.max(...g[2]))
const chieu = (t: readonly number[]) => t.slice(1).map((x, k) => Math.sign(x - t[k]!))

/** Ô lai: cao độ ô bolero `(dSrc, di)` trên tiết tấu ô slow rock `mau`. */
function laiO(dSrc: NguonSR, di: number, mau: Nguon): Nguon {
  const dO = dSrc.o[di]!
  const hD = dO.h[0]!
  const mO = mau.src.o[mau.i]!
  const tops = dinhGo(dO.r)
  const m = tops.length
  const k = mO.r.length
  const chon = Array.from({ length: k }, (_, j) => tops[k === 1 ? 0 : Math.round((j * (m - 1)) / (k - 1))]!)
  const { tap } = hopAm(hD)
  const r = mO.r.map((g, j): Go => {
    const cao = chon[j]!
    const dinhMau = Math.max(...g[2])
    const them: number[] = []
    let chong = 0
    for (const x of g[2]) {
      if (x === dinhMau) continue
      if (dinhMau - x === 12) them.push(cao - 12)
      else chong += 1
    }
    for (let y = cao - 1; y >= cao - 12 && chong > 0; y -= 1) {
      if (tap.has(((y % 12) + 12) % 12) && !them.includes(y)) { them.push(y); chong -= 1 }
    }
    return [g[0], g[1], [...them, cao].sort((a, b) => a - b)]
  })
  const doiTrai = hD[1] - mO.h[0]![1]
  const l = mO.l.map((g): Go => [g[0], g[1], g[2].map((x) => x + doiTrai)])
  const src: NguonSR = {
    id: `lai:${dSrc.id}#${di + 1}~${mau.src.id}#${mau.i + 1}`, bai: dSrc.bai, doan: dSrc.doan, thu: dSrc.thu,
    dieu: 'bolero', chuGoc: dSrc.chuGoc, oPhach: O, o: [{ d: O, h: [[0, hD[1], hD[2], hD[3]]], r, l }],
  }
  return { src, i: 0, mo: di === 0, giaiDieu: tenO(dSrc, di), nhip: mau.nhip, lai: true, khoa: `${dSrc.id}#${di}` }
}

const KHO = new Map<boolean, readonly Nguon[]>()
/** Kho ô cho một giọng: ô slow rock + mỗi ô bolero cùng giọng lai lên hai ô tiết tấu slow rock hợp nhất. */
function khoCua(thu: boolean): readonly Nguon[] {
  const nho = KHO.get(thu)
  if (nho) return nho
  const lai: Nguon[] = []
  for (const dSrc of NGUON_SOLO_SR.filter((s) => s.dieu === 'bolero' && s.thu === thu)) {
    dSrc.o.forEach((dO, di) => {
      if (dO.h.length !== 1 || dO.r.length < 3) return
      const tops = dinhGo(dO.r)
      const mau = O_SLOW.map((ng) => {
        const mr = ng.src.o[ng.i]!.r
        const k = mr.length
        if (k < 3 || k > tops.length || tops.length - k > 3) return null
        const chon = Array.from({ length: k }, (_, j) => tops[Math.round((j * (tops.length - 1)) / (k - 1))]!)
        const a = chieu(chon)
        const b = chieu(dinhGo(mr))
        return { ng, diem: tops.length - k + a.filter((x, q) => x !== b[q]).length }
      }).filter((x): x is { ng: Nguon; diem: number } => x !== null)
        .sort((x, y) => x.diem - y.diem || x.ng.khoa.localeCompare(y.ng.khoa))
      for (const { ng } of mau.slice(0, 2)) lai.push(laiO(dSrc, di, ng))
    })
  }
  const kho = [...O_SLOW, ...lai]
  KHO.set(thu, kho)
  return kho
}

/** Ô nguồn cùng hình hoà âm với ô đích: cùng số hợp âm, cùng chỗ đổi, cùng bước bậc giữa hai gốc. */
function cungHinh(nguon: readonly H[], dich: readonly H[], gamN: readonly number[], gamD: readonly number[]) {
  if (nguon.length !== dich.length) return false
  return nguon.every((h, k) => k === 0 || (Math.abs(h[0] - dich[k]![0]) < EPS
    && (bacGoc(h[1], gamN) - bacGoc(nguon[0]![1], gamN) + 7) % 7 === (bacGoc(dich[k]![1], gamD) - bacGoc(dich[0]![1], gamD) + 7) % 7))
}

/**
 * Đặt ô nguồn lên hợp âm đích: chuyển bậc theo gam + dời quãng tám cả ô (tay phải).
 * `moc` = MIDI chủ âm đích gần giọng nguồn. Nốt hoá bất thường chỉ giữ khi cùng giọng và không
 * chuyển bậc (cùng chức năng).
 */
function datO(nguon: Nguon, dich: readonly H[], thu: boolean, moc: number, tam: number) {
  const o = nguon.src.o[nguon.i]!
  const gamN = gamCua(nguon.src.thu)
  const gamD = gamCua(thu)
  let doi = bacGoc(dich[0]![1], gamD) - bacGoc(o.h[0]![1], gamN)
  if (doi > 3) doi -= 7
  if (doi < -3) doi += 7
  const giuHoa = nguon.src.thu === thu && doi === 0
  const doiNot = (rel: number, at: number) => {
    const { bac, hoa } = bacCua(rel, gamN)
    let cao = caoCua(bac + doi, giuHoa ? hoa : 0, gamD)
    const h = [...dich].reverse().find((x) => x[0] <= at + EPS) ?? dich[0]!
    const muon = hopAm(h).bac[(((bac + doi - bacGoc(h[1], gamD)) % 7) + 7) % 7]
    if (muon !== undefined) {
      const lech = ((((h[1] + muon - cao) % 12) + 18) % 12) - 6
      if (Math.abs(lech) === 1) cao += lech
    }
    return moc + cao
  }
  const dat = (g: Go, them: number): Not =>
    ({ at: g[0], dur: g[1], notes: g[2].map((n) => doiNot(n, g[0]) + them) })
  return { doi, phai: o.r.map((g) => dat(g, tam)), trai: o.l.map((g) => dat(g, 0)) }
}

const dinh = (ns: readonly Not[]) => [...ns].sort((a, b) => a.at - b.at).map((e) => Math.max(...e.notes))
const hinh = (ns: readonly Not[]) => { const t = dinh(ns); return t.slice(1).map((x, k) => x - t[k]!).join(',') }

/** Phạt chỗ nối ô theo khoảng cách nốt đầu với nốt cuối ô trước. */
function phatNoi(truoc: number | null, dau: number): number {
  if (truoc === null) return 0
  const d = Math.abs(dau - truoc)
  return d <= 2 ? 0 : d <= 4 ? 1 : d === 12 ? 1.5 : d <= 7 ? 3 : d < 12 ? 4 : 5
}

/** Khoảng lặng dài nhất của tay phải trong ô (kể cả cuối ô). */
function nghiDai(ns: readonly Not[]): number {
  let lang = 0
  let cuoi = 0
  for (const e of [...ns].sort((a, b) => a.at - b.at)) { lang = Math.max(lang, e.at - cuoi); cuoi = Math.max(cuoi, e.at + e.dur) }
  return Math.max(lang, O - cuoi)
}

/** Câu chạy: ≥ 4 nốt liền, cách nhau ≤ một móc đơn, cùng chiều lên, bước ≤ 5 nửa cung. */
function coChay(ns: readonly Not[]): boolean {
  const t = [...ns].sort((a, b) => a.at - b.at)
  let dai = 1
  for (let k = 1; k < t.length; k += 1) {
    const buoc = Math.max(...t[k]!.notes) - Math.max(...t[k - 1]!.notes)
    dai = t[k]!.at - t[k - 1]!.at <= 0.5 + EPS && buoc > 0 && buoc <= 5 ? dai + 1 : 1
    if (dai >= 4) return true
  }
  return false
}

export function soanSlowRockLinhNhi(options: {
  kind: Doan
  key: { tonic: PitchClass; scale: string }
  songChords?: readonly ParsedChord[]
  take?: number
  /** Một ô 6/8 dài mấy phách trong điệu (Lá Thư 3, điệu 6/8 không `gridUnit` 6). */
  oDieu?: number
}): PhraseSection {
  const { kind, key } = options
  const take = Math.max(0, options.take ?? 0)
  const k = (options.oDieu ?? O) / O
  const thu = key.scale === 'minor'
  const gam = gamCua(thu)
  const rong = (unavailableReason: string): PhraseSection =>
    ({ events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason })
  const doiGiong = (s: NguonSR) => ((((key.tonic - s.chuGoc) % 12) + 18) % 12) - 6
  const mocCua = (s: NguonSR) => 60 + s.chuGoc + doiGiong(s)
  const bai = vonCuaBai(key.tonic, options.songChords ?? [])

  // Ô kết: cử chỉ kết thật của chị (đã nắn nhịp), xoay theo lượt; giữ hợp âm của chính nó.
  const ketUng = SLOW.filter((s) => s.doan === kind)
  const ketSrc = ketUng[(take + (kind === 'outro' ? 0 : 1)) % ketUng.length]!
  const soKet = SO_O_KET[ketSrc.id] ?? 1
  const oKet: Nguon[] = Array.from({ length: soKet }, (_, j) => {
    const i = ketSrc.o.length - soKet + j
    return { src: ketSrc, i, mo: false, giaiDieu: tenO(ketSrc, i), nhip: nhipO(ketSrc, i), lai: false, khoa: `${ketSrc.id}#${i}` }
  })
  const ket = oKet.map((ng) => hopAmKet(ng.src.o[ng.i]!.h[0]!, thu))

  // Vòng hợp âm mới, xoay theo lượt. Không ghép được thì dùng vòng thật khớp vốn bài nhất.
  const moi = vongMoi(kind, thu, bai, ket)
  let vongTu: string
  let than: H[]
  if (moi.length > 0) {
    const v = moi[take % moi.length]!
    than = v.hs.slice(0, v.hs.length - soKet)
    vongTu = v.tu
  } else {
    const src = nguonChoBai(kind, thu, key.tonic, options.songChords ?? [])[0]?.src
    if (!src) return rong(`Chưa có vòng ${kind} ${thu ? 'thứ' : 'trưởng'} nào của Linh Nhi.`)
    than = vongPhang(src).slice(0, -soKet)
    vongTu = src.id
  }
  const vong: H[][] = [...than.map((h) => [h]), ...oKet.map((ng) => ng.src.o[ng.i]!.h.map((h) => hopAmKet(h, thu)))]
  const n = vong.length

  // Đường tầm cao (MIDI tuyệt đối ở giọng đích) theo một đoạn slow rock sạch nhịp cùng loại.
  const mauTam = SLOW.find((s) => s.id === (kind === 'outro' ? 'mot-coi-di-ve-outro' : `la-thu-tran-the-${kind}`))!
  const tamO = mauTam.o.map((o) => (o.r.length ? o.r.reduce((a, g) => a + Math.max(...g[2]), 0) / o.r.length : null))
  const tamMacDinh = tamO.find((x) => x !== null) ?? 16
  const tamDich = (i: number) =>
    mocCua(mauTam) + (tamO[Math.min(tamO.length - 1, Math.round((i * (tamO.length - 1)) / Math.max(1, n - 1)))] ?? tamMacDinh)

  const kho = khoCua(thu)
  type Chon = { nguon: Nguon; doi: number; tam: number; phai: Not[]; trai: Not[]; cost: number }
  const ra: Chon[] = []
  const daDung = new Set<string>()
  let truocDinh: number | null = null
  let truocHinh = ''
  for (let i = 0; i < n; i += 1) {
    const dich = vong[i]!
    const laKet = i >= n - soKet
    const ung: Chon[] = []
    for (const ng of laKet ? [oKet[i - (n - soKet)]!] : kho) {
      if (!laKet && daDung.has(ng.khoa)) continue
      if (!laKet && !cungHinh(ng.src.o[ng.i]!.h, dich, gamCua(ng.src.thu), gam)) continue
      for (const tam of [-12, 0, 12]) {
        const d = datO(ng, dich, thu, mocCua(ng.src), tam)
        // Ô kết được phép không gõ tay phải (Lá Thư c142–c143 ngân hợp âm Picardy từ ô trước).
        if (d.phai.length === 0 && !laKet) continue
        if (d.phai.length === 0 && tam !== 0) continue
        const tatCa = d.phai.flatMap((e) => e.notes)
        // Tầm lọc: ô kết Lá Thư c142 trải 37 nửa cung (F#4–G7) — hẹp hơn thì mất cử chỉ thật.
        if (tatCa.some((x) => x < 48 || x > 103)) continue
        const top = dinh(d.phai)
        let cost = top.length ? phatNoi(truocDinh, top[0]!) : 0
        if (top.length) cost += 0.15 * Math.abs(top.reduce((a, b) => a + b, 0) / top.length - tamDich(i))
        const bac = (x: number) => (((x - 60 - key.tonic) % 12) + 12) % 12
        const { tap } = hopAm(dich[0]!)
        for (const e of d.phai) {
          const manh = e.at < EPS || Math.abs(e.at - 1.5) < EPS
          if (!tap.has(bac(Math.max(...e.notes)))) cost += manh ? 2 : 0.5
        }
        cost += 2 * d.phai.filter((e) => {
          const { tranh } = hopAm([...dich].reverse().find((x) => x[0] <= e.at + EPS) ?? dich[0]!)
          return e.notes.some((x) => tranh.has(bac(x)))
        }).length
        if (!laKet) {
          if (truocHinh !== '' && hinh(d.phai) === truocHinh) cost += 4
          if (nghiDai(d.phai) >= O / 2 - EPS) cost += 3
          if (d.phai.length <= 2) cost += 1
          if (coChay(d.phai) && i < n / 2) cost += 0.5
          if (ng.mo !== (i === 0)) cost += 1
        }
        ung.push({ nguon: ng, ...d, tam, cost })
      }
    }
    if (ung.length === 0) return rong(`Không có ô slow rock nào đặt được lên ô ${i + 1} (${dich.map((h) => h[2]).join('→')}) của đoạn ${kind}.`)
    ung.sort((a, b) => a.cost - b.cost
      || `${a.nguon.src.id}#${a.nguon.i}#${a.tam}`.localeCompare(`${b.nguon.src.id}#${b.nguon.i}#${b.tam}`))
    /*
      Ô MỞ xoay theo lượt qua mọi ô mở đặt được (cách điểm tốt nhất ≤ 3), mỗi ô một lần trong danh sách;
      dạo và giang lệch nhau nửa vòng. Cũ: chọn trong nhóm cách tốt nhất ≤ 1 — 20 lượt liền thì 10 câu
      giang (và 9 câu dạo) mở bằng CÙNG một ô, đầu câu nghe y như lượt trước và y như câu dạo.
      Ô giữa: bước xoay 7 mỗi lượt (cũ 1) cho hai lượt liền nhau ít trùng ô. Ngưỡng 3 và bước 7: biên soạn.
    */
    const moUng = i === 0 && !laKet ? ung.filter((u) => u.nguon.mo) : []
    const moDinh = moUng.length ? Math.min(...moUng.map((u) => u.cost)) : 0
    const moDs = [...new Map(moUng.filter((u) => u.cost <= moDinh + 3).sort((a, b) => a.cost - b.cost)
      .reverse().map((u) => [u.nguon.khoa, u] as const)).values()].sort((a, b) => a.nguon.khoa.localeCompare(b.nguon.khoa))
    const gan = ung.filter((u) => u.cost <= ung[0]!.cost + 1)
    const chon = moDs.length > 0
      ? moDs[(take + (kind === 'interlude' ? Math.floor(moDs.length / 2) : 0)) % moDs.length]!
      : gan[(take * 7 + i * 3) % gan.length]!
    ra.push(chon)
    daDung.add(chon.nguon.khoa)
    const top = dinh(chon.phai)
    if (top.length) truocDinh = top[top.length - 1]!
    truocHinh = hinh(chon.phai)
  }

  // Ký hiệu hợp âm theo giọng đích.
  const dau = dauGiang(key.tonic, thu)
  const ten = (rel: number) => pitchClassName((((key.tonic + rel) % 12) + 12) % 12 as PitchClass, dau)
  const ky = (h: H) => `${ten(h[1])}${hauApp(h[2])}${h[3] === null ? '' : `/${ten(h[3])}`}`
  const chords: string[] = []
  const tu: number[] = []
  vong.forEach((hs, i) => hs.forEach((h, j) => {
    const sym = ky(h)
    if (chords[chords.length - 1] === sym) return
    chords.push(sym)
    tu.push((i * O + (j === 0 ? 0 : h[0])) * k)
  }))
  /*
    CÚ DẶM V7 SAU Ô DẬP LÁ THƯ — ý người dùng #70 (câu #1403, md 16S): *"ở E7 cuối thì nên thêm 1 cú dặm
    hợp âm E7 nữa rồi mới vào phiên khúc … nếu sau này có soạn lại câu theo khung này thì nhớ làm tương
    tự"*. Khung = dạo/giang kết bằng ô dập V7 của Lá Thư (c7 · c80). Thêm một ô: hai tay dặm V7 ở phách
    đầu, ngân nửa ô rồi tắt — chừa nửa ô cho ca sĩ lấy hơi (luật cũ: hợp âm hút cuối câu dạo tắt trước
    chỗ ca sĩ vào). Hợp âm, thế tay lấy từ cú dập đầu ô kết + bậc 7. Độ ngân nửa ô là BIÊN SOẠN.
  */
  const hKet = vong[n - 1]![vong[n - 1]!.length - 1]!
  const damV7 = kind !== 'outro' && ketSrc.id.startsWith('la-thu-tran-the-') && hKet[1] === 7 && /7/.test(hKet[2])
  const cuoi = ra[n - 1]!
  const dam: { phai: number[]; trai: number[] } | null = damV7 && cuoi.phai.length > 0
    ? (() => {
        // Bốn nốt V7 xếp liền dưới nốt đỉnh cú dập đầu ô kết (ô c80 mở bằng 5–7–1, thiếu nốt cảm).
        const dinhO = Math.max(...cuoi.phai[0]!.notes)
        const phai = [0, 4, 7, 10].map((q) => {
          let y = dinhO
          while (((y - key.tonic - 7 - q) % 12 + 12) % 12 !== 0) y -= 1
          return y
        }).sort((a, b) => a - b)
        let goc = 33
        while (((goc - key.tonic - 7) % 12 + 12) % 12 !== 0) goc += 1
        return { phai, trai: [goc, goc + 12] }
      })()
    : null
  const lengthBeats = (n + (dam ? 1 : 0)) * O * k
  const beatsEach = tu.map((a, j) => (j + 1 < tu.length ? tu[j + 1]! : lengthBeats) - a)
  if (parseChordInput(chords.join(' ')).chords.length !== chords.length) {
    return rong(`Không đọc được vòng hợp âm ${chords.join(' ')}`)
  }

  const events: TimelineEvent[] = []
  ra.forEach((c, i) => {
    for (const e of c.phai) {
      events.push({ notes: e.notes as MidiNote[], startBeat: (i * O + e.at) * k, durationBeats: e.dur * k, hand: 'right', velocity: VELO_PHAI })
    }
    for (const e of c.trai) {
      let notes = e.notes
      while (Math.max(...notes) > 67) notes = notes.map((x) => x - 12)
      while (Math.min(...notes) < 28) notes = notes.map((x) => x + 12)
      events.push({ notes: notes as MidiNote[], startBeat: (i * O + e.at) * k, durationBeats: e.dur * k, hand: 'left', velocity: VELO_TRAI })
    }
  })
  if (dam) {
    let trai = dam.trai
    while (trai.length && Math.max(...trai) > 67) trai = trai.map((x) => x - 12)
    events.push({ notes: dam.phai as MidiNote[], startBeat: n * O * k, durationBeats: (O / 2) * k, hand: 'right', velocity: VELO_PHAI })
    if (trai.length) events.push({ notes: trai as MidiNote[], startBeat: n * O * k, durationBeats: (O / 2) * k, hand: 'left', velocity: VELO_TRAI })
  }
  events.sort((a, b) => a.startBeat - b.startBeat)

  return {
    events,
    lengthBeats,
    chords,
    beatsEach,
    sourcePhrase: { id: `soan:${vongTu}`, fromBar: 1, barCount: n, song: 'Linh Nhi · slow rock', method: 'cp-composition' },
    compositionSources: ra.map((c, i) => ({
      bar: i + 1, start: i * O * k, end: (i + 1) * O * k,
      harmony: i < than.length ? `vòng ${vongTu}` : `kết ${ketSrc.id}`,
      melody: `${c.nguon.giaiDieu}, chuyển ${c.doi >= 0 ? '+' : ''}${c.doi} bậc${c.tam ? `, ${c.tam > 0 ? '+' : '−'}1 quãng tám` : ''}`,
      rhythm: c.nguon.nhip,
      donorGenre: c.nguon.lai ? 'bolero (giai điệu) · slow rock (tiết tấu)' : 'slow rock',
      mode: thu ? 'minor' : 'major', sourceKind: c.nguon.src.doan,
    })).concat(dam ? [{
      bar: n + 1, start: n * O * k, end: (n + 1) * O * k, harmony: `kết ${ketSrc.id} + cú dặm V7`,
      melody: 'cú dặm V7 thêm theo ý người dùng #70', rhythm: 'một cú dặm, ngân nửa ô',
      donorGenre: 'slow rock', mode: thu ? 'minor' : 'major', sourceKind: kind,
    }] : []),
    adaptationNote: `Vòng mới ${vongTu}; ô slow rock của Linh Nhi và giai điệu bolero đặt lên tiết tấu slow rock; kết bằng ${ketSrc.bai}.`,
  }
}
