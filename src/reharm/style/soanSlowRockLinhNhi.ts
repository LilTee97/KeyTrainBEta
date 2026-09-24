import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { parseChordInput } from '../input/chordInputParser'
import type { ParsedChord } from '../types'
import type { PhraseSection } from './phraseSection'
import type { TimelineEvent } from './types'
import { NGUON_SOLO_SR, type NguonSR, type OSR } from './slowRockLinhNhiNguon'

/*
  BỘ SOẠN CÂU SOLO SLOW ROCK LINH NHI — soạn câu MỚI, vật liệu nốt chỉ từ sheet slow rock của chị.

  Người dùng 24/9/2026: *"đừng lấy những phần từ câu solo của điệu khác rồi dồn ép vào"*; vật liệu
  lấy từ sheet CÙNG ĐIỆU; quy luật soạn nốt học từ mọi sheet; câu *"ko bị phô, bị trùng lặp hoặc
  ngắt quãng"*.

  VẬT LIỆU: 49 ô 6/8 của 6 đoạn solo slow rock (Lá Thư, Một Cõi — `slowRockLinhNhiNguon.ts`). Mỗi ô
  đặt lên hợp âm đích bằng CHUYỂN BẬC THEO GAM (mọi nốt dời cùng số bậc, như câu nhắc tiến) rồi dời
  cả ô một quãng tám nếu cần. Nốt đứng ở bậc 3 · 5 · 7 của hợp âm đích mà lệch nửa cung do gam (V
  trưởng trong giọng thứ, II7 trong giọng trưởng) thì về đúng nốt hợp âm — nắn theo HỢP ÂM, không
  nắn cho đẹp. Mỗi ô ghi nguồn trong `compositionSources`.

  VÒNG HỢP ÂM (tri thức hoà âm, không phải vật liệu nốt): một vòng solo thật của chị cùng giọng,
  cùng loại đoạn, khớp vốn bài nhất; slow rock trước. Giọng trưởng: chị KHÔNG có sheet slow rock
  trưởng (0/2 bài) nên lấy vòng bolero trưởng, mỗi hợp âm một ô 6/8 (nhịp hoà âm slow rock, md 13d),
  nốt vẫn là ô slow rock thứ chuyển bậc sang gam trưởng — BIÊN SOẠN, chưa có sheet để đối chiếu.

  CHỌN Ô giữa đoạn theo quy luật đo trên 6 đoạn solo slow rock (`tools/quy_luat_not_linh_nhi.py`,
  md 13e) — điểm phạt, thấp nhất thắng, lượt `take` xoay trong nhóm cách đầu ≤ 1 điểm:
    · nối ô: nốt đầu cách nốt cuối ô trước ≤ 2 nửa cung ở 23/43 chỗ nối;
    · phách mạnh (móc đơn 1 và 4) vào nốt hợp âm 67/81 = 83%, phách nhẹ 165/194 = 85%;
    · ô lặp hình ô ngay trước: 0/49 — phạt; một ô không dùng hai lần trong đoạn;
    · ô nghỉ ≥ nửa ô giữa đoạn: 1/49 — phạt;
    · ô thưa (≤ 2 cú gõ tay phải): 4/49 — phạt nhẹ;
    · câu chạy nằm nửa sau đoạn 8/12 — phạt nhẹ câu chạy ở nửa đầu;
    · tầm cao theo đường của đoạn làm vòng (slow rock), không thì theo dạo Lá Thư.
  HỆ SỐ PHẠT (0,5 · 1 · 1,5 · 2 · 3 · 4 · 5) là BIÊN SOẠN, chưa đo — chỉnh khi tai nghe thấy lệch.
  Ô KẾT: cử chỉ kết thật của chị, giữ nguyên hợp âm của nó — ô dập V (Lá Thư c7/c80), chạy V7 rồi
  ngân V (Một Cõi o9–o10), kết chủ trưởng Picardy (Lá Thư c142–c143), ngân i (Một Cõi o7–o9).
*/

type Doan = 'intro' | 'interlude' | 'outro'
type H = OSR['h'][number]
type Nguon = { src: NguonSR; i: number }
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

/** Các đoạn solo cùng giọng, cùng loại đoạn, khớp vốn hợp âm bài nhất đứng trước. */
export function nguonChoBai(doan: Doan, thu: boolean, tonic: PitchClass,
  songChords: readonly ParsedChord[]): { src: NguonSR; khop: number }[] {
  const bai = new Set(songChords.map((c) => `${((c.root - tonic) % 12 + 12) % 12}${nhom(c.quality.intervals)}`))
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

const SLOW = NGUON_SOLO_SR.filter((s) => s.dieu === 'slow rock')

/** Số ô cuối là cử chỉ kết — đặt cuối đoạn, không đem ghép giữa đoạn. */
const SO_O_KET: Record<string, number> = {
  'la-thu-tran-the-intro': 1, 'la-thu-tran-the-interlude': 1, 'la-thu-tran-the-outro': 2,
  'mot-coi-di-ve-intro': 2, 'mot-coi-di-ve-interlude': 2, 'mot-coi-di-ve-outro': 3,
}

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

/**
 * Quãng bậc 3 · 5 · 7 (theo số bậc trên gốc: 2 · 4 · 6), tập nốt hợp âm và nốt TRÁNH (bậc ba
 * trên hợp âm sus — nghe phô) — tất cả tính so với chủ âm.
 */
function hopAm(h: H): { tap: Set<number>; bac: Record<number, number>; tranh: Set<number> } {
  const g = nhomHau(h[2])
  const ba = g === 'm' || g === 'dim' ? 3 : g === 'sus' ? 5 : 4
  const nam = g === 'dim' || /b5/.test(h[2]) ? 6 : 7
  const bay = /maj7|Δ/.test(h[2]) ? 11 : /7|9|11|13/.test(h[2]) ? (g === 'dim' && !/m7/.test(h[2]) ? 9 : 10) : null
  const bac: Record<number, number> = { 2: ba, 4: nam }
  if (bay !== null) bac[6] = bay
  return {
    tap: new Set([0, ba, nam, ...(bay === null ? [] : [bay])].map((x) => (h[1] + x) % 12)),
    bac,
    tranh: new Set(g === 'sus' ? [(h[1] + 3) % 12, (h[1] + 4) % 12] : []),
  }
}

/** Hợp âm của ô kết sang giọng trưởng: chủ thứ thành chủ trưởng; V · V7 · I giữ nguyên. */
const hopAmKet = (h: H, thu: boolean): H =>
  !thu && h[1] === 0 && nhomHau(h[2]) === 'm' ? [h[0], 0, h[2].replace(/^m/, ''), h[3]] : h

/** Vòng hợp âm mỗi ô 6/8. Bolero: mỗi hợp âm một ô (nhịp hoà âm slow rock), bỏ ô chưa có hợp âm. */
const vongCua = (src: NguonSR): H[][] => src.dieu === 'slow rock'
  ? src.o.map((o) => [...o.h])
  : src.o.flatMap((o) => o.h.map((h) => [[0, h[1], h[2], h[3]] as H]))

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
  const dat = (g: OSR['r'][number], them: number): Not =>
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

  // 1. Vòng hợp âm.
  const vongUng = nguonChoBai(kind, thu, key.tonic, options.songChords ?? [])
  if (vongUng.length === 0) return rong(`Chưa có vòng ${kind} ${thu ? 'thứ' : 'trưởng'} nào của Linh Nhi.`)
  // Thứ tự: slow rock khớp ≥ nửa vốn bài · nguồn nào khớp ≥ nửa · slow rock · còn lại.
  const hang = (u: { src: NguonSR; khop: number }) => (u.khop >= 0.5 ? 0 : 2) + (u.src.dieu === 'slow rock' ? 0 : 1)
  const tot = vongUng.filter((u) => hang(u) === Math.min(...vongUng.map(hang)))
  const vongSrc = tot[take % tot.length]!.src

  // 2. Ô kết: cử chỉ kết thật của chị, xoay theo lượt; giữ hợp âm của chính nó.
  const ketUng = SLOW.filter((s) => s.doan === kind)
  const ketSrc = ketUng[(take + (kind === 'outro' ? 0 : 1)) % ketUng.length]!
  const soKet = SO_O_KET[ketSrc.id] ?? 1
  const oKet: Nguon[] = Array.from({ length: soKet }, (_, j) => ({ src: ketSrc, i: ketSrc.o.length - soKet + j }))
  const vongGiua = vongCua(vongSrc).slice(0, -soKet)
  const vong: H[][] = [...vongGiua, ...oKet.map((ng) => ng.src.o[ng.i]!.h.map((h) => hopAmKet(h, thu)))]
  const n = vong.length

  // 3. Đường tầm cao (MIDI tuyệt đối ở giọng đích).
  const mauTam = vongSrc.dieu === 'slow rock' ? vongSrc : SLOW.find((s) => s.id === 'la-thu-tran-the-intro')!
  const tamO = mauTam.o.map((o) => (o.r.length ? o.r.reduce((a, g) => a + Math.max(...g[2]), 0) / o.r.length : null))
  const tamMacDinh = tamO.find((x) => x !== null) ?? 16
  const tamDich = (i: number) =>
    mocCua(mauTam) + (tamO[Math.min(tamO.length - 1, Math.round((i * (tamO.length - 1)) / Math.max(1, n - 1)))] ?? tamMacDinh)

  // 4. Kho ô giữa đoạn: mọi ô solo slow rock trừ ô kết.
  const kho: Nguon[] = SLOW.flatMap((src) =>
    src.o.map((_, i) => ({ src, i })).filter(({ i }) => i < src.o.length - (SO_O_KET[src.id] ?? 1)))

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
      if (!laKet && daDung.has(`${ng.src.id}#${ng.i}`)) continue
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
          if ((ng.i === 0) !== (i === 0)) cost += 1
        }
        ung.push({ nguon: ng, ...d, tam, cost })
      }
    }
    if (ung.length === 0) return rong(`Không có ô slow rock nào đặt được lên ô ${i + 1} (${dich.map((h) => h[2]).join('→')}) của đoạn ${kind}.`)
    ung.sort((a, b) => a.cost - b.cost
      || `${a.nguon.src.id}#${a.nguon.i}#${a.tam}`.localeCompare(`${b.nguon.src.id}#${b.nguon.i}#${b.tam}`))
    const gan = ung.filter((u) => u.cost <= ung[0]!.cost + 1)
    const chon = gan[(take + i * 3) % gan.length]!
    ra.push(chon)
    daDung.add(`${chon.nguon.src.id}#${chon.nguon.i}`)
    const top = dinh(chon.phai)
    if (top.length) truocDinh = top[top.length - 1]!
    truocHinh = hinh(chon.phai)
  }

  // 5. Ký hiệu hợp âm theo giọng đích.
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
  const lengthBeats = n * O * k
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
  events.sort((a, b) => a.startBeat - b.startBeat)

  return {
    events,
    lengthBeats,
    chords,
    beatsEach,
    sourcePhrase: { id: `soan:${vongSrc.id}`, fromBar: 1, barCount: n, song: vongSrc.bai, method: 'cp-composition' },
    compositionSources: ra.map((c, i) => ({
      bar: i + 1, start: i * O * k, end: (i + 1) * O * k,
      harmony: i < vongGiua.length ? `vòng ${vongSrc.id} ô ${i + 1}` : `kết ${ketSrc.id}`,
      melody: `${c.nguon.src.id} ô ${c.nguon.i + 1}, chuyển ${c.doi >= 0 ? '+' : ''}${c.doi} bậc${c.tam ? `, ${c.tam > 0 ? '+' : '−'}1 quãng tám` : ''}`,
      rhythm: `${c.nguon.src.id} ô ${c.nguon.i + 1}`,
      donorGenre: c.nguon.src.dieu, mode: thu ? 'minor' : 'major', sourceKind: c.nguon.src.doan,
    })),
    adaptationNote: `Soạn mới từ ô solo slow rock của Linh Nhi trên vòng ${vongSrc.doan} ${vongSrc.bai} (${vongSrc.dieu}), kết bằng ${ketSrc.bai}.`,
  }
}
