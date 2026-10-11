import type { TimelineEvent } from '../../reharm/style/types'
import type { TwoHandVoicing } from '../../reharm/voicingGenerator/handSplitVoicing'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { gocDep, vn } from '../soanCau/chongHopAm'
import { nguCanh, type Hop } from '../soanCau/giaiThich'
import { kieuDau } from '../vongThay'

/*
  SCALE · ARPEGGIO · NGÓN — trang Học Solo (người dùng 11/10/2026: "Có phải Scales và Apreggios là cơ sở để chọn nốt ko, nếu đúng thì hãy
  dạy tôi về chúng luôn" · "Hãy thêm Game chạy ngón và Game Scale"). Gam, hợp âm rải là lý thuyết; NGÓN là ngón chuẩn sách piano (kiểu
  ABRSM) — kỹ thuật chung, KHÔNG phải số đo thầy. Kho PianoBrain chỉ có ngón gam Đô trưởng (`fingering-rh-major-scale-1oct.json`: lên
  1 2 3 1 2 3 4 5, xuống 5 4 3 2 1 3 2 1) — khớp bảng dưới; gam phím đen kho ghi "chưa có", nên bảng dưới là của sách, Claude chép lại.
*/

const pc = (x: number) => ((x % 12) + 12) % 12
export type Tay = 'phai' | 'trai'

export type LoaiGam = 'truong' | 'thu' | 'thu-hoa-thanh' | 'ngu-cung-truong' | 'ngu-cung-thu' | 'blues'
export interface Gam {
  id: LoaiGam
  ten: string
  iv: readonly number[]
  bac: readonly string[]
  congThuc: string
  dung: string
  /** Gọi tên nốt theo giọng thứ (dấu hóa). */
  thu: boolean
}
export const GAM: readonly Gam[] = [
  {
    id: 'truong',
    ten: 'Gam trưởng',
    iv: [0, 2, 4, 5, 7, 9, 11],
    bac: ['1', '2', '3', '4', '5', '6', '7'],
    congThuc: 'cung · cung · nửa · cung · cung · cung · nửa',
    dung: 'Nốt gam của mọi hợp âm trong bài trưởng — giữ một gam cho cả bài, không đổi gam theo từng hợp âm.',
    thu: false,
  },
  {
    id: 'thu',
    ten: 'Gam thứ tự nhiên',
    iv: [0, 2, 3, 5, 7, 8, 10],
    bac: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
    congThuc: 'cung · nửa · cung · cung · nửa · cung · cung',
    dung: 'Nền của bài thứ. Cùng bảy nốt với gam trưởng song song (La thứ = Đô trưởng), chỉ khác nốt "nhà".',
    thu: true,
  },
  {
    id: 'thu-hoa-thanh',
    ten: 'Gam thứ hòa thanh',
    iv: [0, 2, 3, 5, 7, 8, 11],
    bac: ['1', '2', '♭3', '4', '5', '♭6', '7'],
    congThuc: 'như gam thứ tự nhiên, bậc 7 nâng nửa cung (nốt cảm)',
    dung: 'Dùng khi hợp âm V đang vang ở bài thứ (E7 ở La thứ): bậc 7 nâng (Sol♯) kéo lên nốt nhà.',
    thu: true,
  },
  {
    id: 'ngu-cung-truong',
    ten: 'Ngũ cung trưởng',
    iv: [0, 2, 4, 7, 9],
    bac: ['1', '2', '3', '5', '6'],
    congThuc: 'gam trưởng bỏ bậc 4 và bậc 7 — hai nốt dễ cọ nửa cung',
    dung: 'Gam của Blues: 81 % nốt câu solo của Ray Charles (Rockhouse, 503 nốt) nằm trong ngũ cung trưởng của chủ âm.',
    thu: false,
  },
  {
    id: 'ngu-cung-thu',
    ten: 'Ngũ cung thứ',
    iv: [0, 3, 5, 7, 10],
    bac: ['1', '♭3', '4', '5', '♭7'],
    congThuc: 'gam thứ bỏ bậc 2 và bậc ♭6',
    dung: 'Cùng năm nốt với ngũ cung trưởng của giọng song song (La thứ ngũ cung = Đô trưởng ngũ cung).',
    thu: true,
  },
  {
    id: 'blues',
    ten: 'Gam blues (thứ)',
    iv: [0, 3, 5, 6, 7, 10],
    bac: ['1', '♭3', '4', '♭5', '5', '♭7'],
    congThuc: 'ngũ cung thứ thêm ♭5 — nốt blue',
    dung: 'Blues giọng thứ: trên hợp âm i của Rising Sun, các nốt 1 · ♭3 · 4 · ♭5 · 5 · ♭7 chiếm gần hết (n=49).',
    thu: true,
  },
]
export const gamCua = (id: LoaiGam) => GAM.find((g) => g.id === id)!

export type LoaiArp = 'truong' | 'thu' | 'maj7' | 'm7' | '7' | 'm7b5'
export const ARP: readonly { id: LoaiArp; ten: string; iv: readonly number[]; bac: readonly string[]; dung: string; thu: boolean }[] = [
  { id: 'truong', ten: 'Rải hợp âm trưởng', iv: [0, 4, 7], bac: ['1', '3', '5'], dung: 'Khung của mọi hợp âm trưởng (I, IV, ♭III, ♭VI…).', thu: false },
  { id: 'thu', ten: 'Rải hợp âm thứ', iv: [0, 3, 7], bac: ['1', '♭3', '5'], dung: 'Khung của mọi hợp âm thứ (ii, iii, vi, i, iv).', thu: true },
  { id: 'maj7', ten: 'Rải maj7', iv: [0, 4, 7, 11], bac: ['1', '3', '5', '7'], dung: 'I, IV của bài trưởng; ♭III, ♭VI của bài thứ — màu mơ màng.', thu: false },
  { id: 'm7', ten: 'Rải m7', iv: [0, 3, 7, 10], bac: ['1', '♭3', '5', '♭7'], dung: 'Hợp âm thứ có ♭7 — Cà Pháo đánh ♭7 trên hợp âm thứ 19 %.', thu: true },
  { id: '7', ten: 'Rải hợp âm 7 (át)', iv: [0, 4, 7, 10], bac: ['1', '3', '5', '♭7'], dung: 'Hợp âm V — cặp 3 và ♭7 kéo về nhà; Blues dùng cho cả I, IV, V.', thu: false },
  { id: 'm7b5', ten: 'Rải m7♭5', iv: [0, 3, 6, 10], bac: ['1', '♭3', '♭5', '♭7'], dung: 'ii° của bài thứ, đứng trước V (Bm7♭5 → E7 ở La thứ).', thu: true },
]
export const arpCua = (id: LoaiArp) => ARP.find((a) => a.id === id)!

/* Ngón chuẩn một quãng tám ĐI LÊN, 8 nốt (đi xuống: đọc ngược). Khoá: lớp cao độ của nốt gốc. */
type BangNgon = Readonly<Record<number, { phai: readonly number[]; trai: readonly number[] }>>
const TRANG_P = [1, 2, 3, 1, 2, 3, 4, 5]
const TRANG_T = [5, 4, 3, 2, 1, 3, 2, 1]
const NGON_TRUONG: BangNgon = {
  0: { phai: TRANG_P, trai: TRANG_T }, // Đô
  7: { phai: TRANG_P, trai: TRANG_T }, // Sol
  2: { phai: TRANG_P, trai: TRANG_T }, // Rê
  9: { phai: TRANG_P, trai: TRANG_T }, // La
  4: { phai: TRANG_P, trai: TRANG_T }, // Mi
  11: { phai: TRANG_P, trai: [4, 3, 2, 1, 4, 3, 2, 1] }, // Si
  6: { phai: [2, 3, 4, 1, 2, 3, 1, 2], trai: [4, 3, 2, 1, 3, 2, 1, 4] }, // Fa♯ / Sol♭
  1: { phai: [2, 3, 1, 2, 3, 4, 1, 2], trai: [3, 2, 1, 4, 3, 2, 1, 3] }, // Rê♭
  8: { phai: [3, 4, 1, 2, 3, 1, 2, 3], trai: [3, 2, 1, 4, 3, 2, 1, 3] }, // La♭
  3: { phai: [3, 1, 2, 3, 4, 1, 2, 3], trai: [3, 2, 1, 4, 3, 2, 1, 3] }, // Mi♭
  10: { phai: [4, 1, 2, 3, 1, 2, 3, 4], trai: [3, 2, 1, 4, 3, 2, 1, 3] }, // Si♭ — nốt đầu ngón 4 như khi chạy nhiều quãng tám (có sách cho ngón 2)
  5: { phai: [1, 2, 3, 4, 1, 2, 3, 4], trai: TRANG_T }, // Fa
}
/** Gam thứ tự nhiên — gam thứ hòa thanh dùng cùng ngón (bậc 7 nâng không đổi chỗ ngón cái). */
const NGON_THU: BangNgon = {
  9: { phai: TRANG_P, trai: TRANG_T }, // La
  4: { phai: TRANG_P, trai: TRANG_T }, // Mi
  2: { phai: TRANG_P, trai: TRANG_T }, // Rê
  7: { phai: TRANG_P, trai: TRANG_T }, // Sol
  0: { phai: TRANG_P, trai: TRANG_T }, // Đô
  11: { phai: TRANG_P, trai: [4, 3, 2, 1, 4, 3, 2, 1] }, // Si
  6: { phai: [3, 4, 1, 2, 3, 1, 2, 3], trai: [4, 3, 2, 1, 3, 2, 1, 4] }, // Fa♯
  1: { phai: [3, 4, 1, 2, 3, 1, 2, 3], trai: [3, 2, 1, 4, 3, 2, 1, 3] }, // Đô♯
  8: { phai: [3, 4, 1, 2, 3, 1, 2, 3], trai: [3, 2, 1, 3, 2, 1, 4, 3] }, // Sol♯
  3: { phai: [3, 1, 2, 3, 4, 1, 2, 3], trai: [2, 1, 4, 3, 2, 1, 3, 2] }, // Mi♭ / Rê♯
  10: { phai: [4, 1, 2, 3, 1, 2, 3, 4], trai: [2, 1, 3, 2, 1, 4, 3, 2] }, // Si♭ — nốt đầu ngón 4 (có sách cho ngón 2)
  5: { phai: [1, 2, 3, 4, 1, 2, 3, 4], trai: TRANG_T }, // Fa
}

/** Ngón chuẩn một quãng tám đi lên (8 nốt) — chỉ gam trưởng và gam thứ; ngũ cung, blues không có ngón chuẩn (null). */
export function ngonGam(loai: LoaiGam, goc: number, tay: Tay): readonly number[] | null {
  const bang = loai === 'truong' ? NGON_TRUONG : loai === 'thu' || loai === 'thu-hoa-thanh' ? NGON_THU : null
  return bang ? bang[pc(goc)]![tay] : null
}

const phimDen = (m: number) => [1, 3, 6, 8, 10].includes(pc(m))
/** Ngón rải hợp âm ba một quãng tám (1 · 3 · 5 · 8): phải 1 2 3 5, trái 5 4 2 1 — chỉ gốc phím trắng (gốc phím đen đổi ngón, app chưa có). */
export function ngonArp(loai: LoaiArp, goc: number, tay: Tay): readonly number[] | null {
  if ((loai !== 'truong' && loai !== 'thu') || phimDen(goc)) return null
  return tay === 'phai' ? [1, 2, 3, 5] : [5, 4, 2, 1]
}

/** Tên nốt Việt theo dấu hóa của giọng (gốc `goc`, trưởng / thứ). */
export const tenNot = (m: number, goc: number, thu: boolean) => vn(pitchClassName(pc(m), kieuDau(pc(goc), thu)))
export const tenGoc = (goc: number, thu: boolean) => tenNot(goc, goc, thu)

/* ---------------- Bài tập cho game chạy ngón ---------------- */

export interface BaiNgon {
  id: string
  ten: string
  nhom: 'Năm ngón' | 'Gam trưởng' | 'Gam thứ' | 'Rải hợp âm'
  tay: Tay
  notes: number[]
  ngon: number[]
  /** Gọi tên nốt theo giọng nào. */
  goc: number
  thu: boolean
}
const dayGoc = (goc: number, tay: Tay) => (tay === 'phai' ? 60 : 48) + pc(goc)
/** Đi lên rồi đi xuống, không lặp nốt đỉnh: ngón đi xuống là ngón đi lên đọc ngược. */
const lenXuong = (len: number[], ngon: readonly number[]) => ({
  notes: [...len, ...len.slice(0, -1).reverse()],
  ngon: [...ngon, ...ngon.slice(0, -1).reverse()],
})

export function baiNamNgon(goc: number, thu: boolean, tay: Tay): BaiNgon {
  const g = dayGoc(goc, tay)
  const len = (thu ? [0, 2, 3, 5, 7] : [0, 2, 4, 5, 7]).map((x) => g + x)
  const x = lenXuong(len, tay === 'phai' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1])
  return { id: `nam-${tay}-${pc(goc)}-${thu ? 'thu' : 'truong'}`, ten: `Năm ngón ${tenGoc(goc, thu)} ${thu ? 'thứ' : 'trưởng'}`, nhom: 'Năm ngón', tay, goc, thu, ...x }
}

export function baiGam(loai: 'truong' | 'thu', goc: number, tay: Tay): BaiNgon {
  const g = dayGoc(goc, tay)
  const len = [...gamCua(loai).iv, 12].map((x) => g + x)
  const x = lenXuong(len, ngonGam(loai, goc, tay)!)
  const thu = loai === 'thu'
  return { id: `gam-${loai}-${tay}-${pc(goc)}`, ten: `Gam ${tenGoc(goc, thu)} ${thu ? 'thứ' : 'trưởng'}`, nhom: thu ? 'Gam thứ' : 'Gam trưởng', tay, goc, thu, ...x }
}

export function baiArp(loai: 'truong' | 'thu', goc: number, tay: Tay): BaiNgon | null {
  const ngon = ngonArp(loai, goc, tay)
  if (!ngon) return null
  const g = dayGoc(goc, tay)
  const len = [...arpCua(loai).iv, 12].map((x) => g + x)
  const thu = loai === 'thu'
  return {
    id: `arp-${loai}-${tay}-${pc(goc)}`,
    ten: `Rải ${tenGoc(goc, thu)} ${thu ? 'thứ' : 'trưởng'}`,
    nhom: 'Rải hợp âm',
    tay,
    goc,
    thu,
    ...lenXuong(len, ngon),
  }
}

/** Vòng quãng năm — thứ tự học gam, ít dấu hóa trước. */
export const VONG_5_TRUONG = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
export const VONG_5_THU = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2]
const GOC_TRANG_TRUONG = [0, 7, 2, 9, 4, 5, 11]
const GOC_TRANG_THU = [9, 4, 2, 7, 0, 5, 11]

/** Mọi bài tập của game chạy ngón cho một tay, xếp dễ trước. */
export function baiTapNgon(tay: Tay): BaiNgon[] {
  return [
    ...[0, 7, 2, 5].map((g) => baiNamNgon(g, false, tay)),
    ...[9, 2, 4].map((g) => baiNamNgon(g, true, tay)),
    ...VONG_5_TRUONG.map((g) => baiGam('truong', g, tay)),
    ...VONG_5_THU.map((g) => baiGam('thu', g, tay)),
    ...GOC_TRANG_TRUONG.map((g) => baiArp('truong', g, tay)!),
    ...GOC_TRANG_THU.map((g) => baiArp('thu', g, tay)!),
  ]
}

/* ---------------- Game chạy ngón — dòng thời gian cho khung nốt rơi ----------------
  Người dùng 11/10/2026: "game chạy ngón làm kiểu nốt rơi và hiện bàn phím … chia ra làm 2 phần là chơi hợp âm riêng lẻ và chơi theo vòng
  hợp âm. Cho một vòng hợp âm có backing track và khi hợp âm nào rơi xuống thì hãy bắt tôi đánh solo các nốt tương ứng của hợp âm đó để cho
  khớp nhịp của track. Có chế độ chờ đánh đúng". Khung nốt rơi, chế độ chờ đúng nốt / theo nhịp, máy chơi tay kia là của app (tab Điệu) —
  ở đây chỉ dựng dòng thời gian: tay tập (có số ngón) + tay kia làm backing.
*/

export interface BaiChay {
  id: string
  ten: string
  /** Tay tập — máy chơi tay kia. */
  tay: 'left' | 'right'
  /** Một lượt. */
  timeline: TimelineEvent[]
  /** Tên hợp âm từng phách, một lượt. */
  perBeat: string[]
  voicings: TwoHandVoicing[]
  beatsPerChord: number
}

const tenHop = (goc: number, thu: boolean) => gocDep(pitchClassName(pc(goc), kieuDau(pc(goc), thu))) + (thu ? 'm' : '')

/** Phần 1 — một hợp âm: nốt bài tập móc đơn (ngón trên khối nốt rơi); tay kia giữ hợp âm của bài mỗi ô 4 phách. */
export function baiChayDon(bai: BaiNgon): BaiChay {
  const tay = bai.tay === 'phai' ? 'right' : 'left'
  const doDai = Math.ceil((bai.notes.length * 0.5) / 4) * 4
  const g = pc(bai.goc)
  const ba = bai.thu ? [0, 3, 7] : [0, 4, 7]
  const dem: TimelineEvent[] = []
  for (let phach = 0; phach < doDai; phach += 4)
    dem.push(
      tay === 'right'
        ? { notes: [36 + g, ...ba.map((x) => 48 + g + x)], startBeat: phach, durationBeats: 4, hand: 'left', velocity: 60 }
        : { notes: ba.map((x) => 72 + g + x), startBeat: phach, durationBeats: 4, hand: 'right', velocity: 55 },
    )
  const ten = tenHop(g, bai.thu)
  return {
    id: `don-${bai.id}`,
    ten: bai.ten,
    tay,
    timeline: [...dem, ...bai.notes.map((m, k): TimelineEvent => ({ notes: [m], startBeat: k * 0.5, durationBeats: 0.5, hand: tay, velocity: 85, ngon: bai.ngon[k] }))],
    perBeat: Array.from({ length: doDai }, () => ten),
    voicings: [{ left: [], right: [], symbol: ten }],
    beatsPerChord: doDai,
  }
}

export type KieuChay = 'phach' | 'nam-ngon' | 'rai'
export const KIEU_CHAY: readonly { id: KieuChay; ten: string; mo: string; ngon: readonly number[] }[] = [
  { id: 'phach', ten: 'Mỗi phách một nốt hợp âm', mo: 'nốt đen: gốc – 3 – 5 – 3 — chỉ đánh trụ, tập bám hợp âm và bám nhịp', ngon: [1, 3, 5, 3] },
  {
    id: 'nam-ngon',
    ten: 'Năm ngón quanh hợp âm',
    mo: 'móc đơn 1 2 3 4 5 4 3 2: đầu phách là nốt hợp âm (trụ), giữa phách là nốt gam đi qua (đường) — đúng mẹo "phách mạnh đặt nốt hợp âm"',
    ngon: [1, 2, 3, 4, 5, 4, 3, 2],
  },
  { id: 'rai', ten: 'Rải lên – xuống', mo: 'móc đơn gốc – 3 – 5 – 8 – 5 – 3 – gốc – 3: rải hợp âm (arpeggio) liền tay', ngon: [1, 2, 3, 5, 3, 2, 1, 2] },
]

const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
const GAM_THU = [0, 2, 3, 5, 7, 8, 10]
const GAM_THU_HOA_THANH = [0, 2, 3, 5, 7, 8, 11]

/**
 * Phần 2 — theo vòng: mỗi hợp âm một ô 4 phách. Tay phải chạy nốt CỦA HỢP ÂM ẤY theo `kieu` (gốc chọn quãng tám gần gốc hợp âm trước,
 * trong Sol3–Sol4); nốt đi qua lấy từ gam của bài (bài thứ, trên V có bậc 3 trưởng: gam thứ hòa thanh). Tay trái làm backing "bùm – chát":
 * phách 1 · 3 bass, phách 2 · 4 chồng 5 – 8 – 10 (khuôn đệm của Claude, không phải điệu thầy).
 */
export function baiChayVong(hop: readonly Hop[], tonic: number, thu: boolean, kieu: KieuChay, id: string): BaiChay {
  const { h } = nguCanh(tonic, thu)
  const k = KIEU_CHAY.find((x) => x.id === kieu)!
  const timeline: TimelineEvent[] = []
  let truoc = 60
  hop.forEach((x, i) => {
    const iv = (findQualityBySymbol(x.chat) ?? findQualityBySymbol('')!).intervals
    const ba = iv.includes(4) ? 4 : iv.includes(3) ? 3 : 5
    const nam = iv.includes(7) ? 7 : iv.includes(6) ? 6 : 8
    const r = pc(tonic + x.goc)
    const goc = [r + 48, r + 60, r + 72].filter((m) => m >= 55 && m <= 67).sort((a, c) => Math.abs(a - truoc) - Math.abs(c - truoc))[0]!
    truoc = goc
    const gam = thu ? (x.goc === 7 && ba === 4 ? GAM_THU_HOA_THANH : GAM_THU) : GAM_TRUONG
    const trongGam = (m: number) => gam.includes(pc(m - tonic))
    /** Nốt gam nằm giữa hai nốt (gần chính giữa nhất); không có thì nốt giữa. */
    const giua = (a: number, c: number) => {
      const ds = Array.from({ length: Math.abs(c - a) - 1 }, (_, t) => Math.min(a, c) + 1 + t).filter(trongGam)
      return ds.sort((u, v) => Math.abs(u - (a + c) / 2) - Math.abs(v - (a + c) / 2))[0] ?? Math.round((a + c) / 2)
    }
    const notes =
      kieu === 'phach'
        ? [goc, goc + ba, goc + nam, goc + ba]
        : kieu === 'nam-ngon'
          ? [goc, giua(goc, goc + ba), goc + ba, giua(goc + ba, goc + nam), goc + nam, giua(goc + ba, goc + nam), goc + ba, giua(goc, goc + ba)]
          : [goc, goc + ba, goc + nam, goc + 12, goc + nam, goc + ba, goc, goc + ba]
    const buoc = 4 / notes.length
    notes.forEach((m, t) => timeline.push({ notes: [m], startBeat: i * 4 + t * buoc, durationBeats: buoc, hand: 'right', velocity: 85, ngon: k.ngon[t] }))
    const bass = 36 + r
    for (const p of [0, 2]) timeline.push({ notes: [bass], startBeat: i * 4 + p, durationBeats: 1, hand: 'left', velocity: 72 })
    for (const p of [1, 3]) timeline.push({ notes: [bass + 7, bass + 12, bass + 12 + ba], startBeat: i * 4 + p, durationBeats: 1, hand: 'left', velocity: 52 })
  })
  const ten = hop.map((x) => h(x.goc, x.chat, x.bass))
  return {
    id: `vong-${id}-${pc(tonic)}-${thu ? 'thu' : 'truong'}-${kieu}`,
    ten: ten.join(' – '),
    tay: 'right',
    timeline: timeline.sort((a, c) => a.startBeat - c.startBeat),
    perBeat: ten.flatMap((t) => [t, t, t, t]),
    voicings: ten.map((symbol) => ({ left: [], right: [], symbol })),
    beatsPerChord: 4,
  }
}

/** Nối `lan` lượt liền nhau (chế độ theo nhịp chơi vòng nhiều lượt). */
export const lapLai = (timeline: readonly TimelineEvent[], doDai: number, lan: number): TimelineEvent[] =>
  Array.from({ length: lan }, (_, k) => timeline.map((x) => ({ ...x, startBeat: x.startBeat + k * doDai }))).flat()

/*
  SAO — Claude đặt, CHƯA ĐO. Theo nhịp: 3★ trúng ≥ 90 % nốt và lệch trung vị ≤ 40 ms (bằng ngưỡng đạt tạm của app, `PASS_HIT_RATIO`,
  `PASS_MEDIAN_ABS_MS`); 2★ ≥ 75 % và ≤ 80 ms; 1★ ≥ 50 %. Chờ đúng nốt: 3★ không vấp chặng nào; 2★ vấp ≤ 10 % số chặng; còn lại 1★.
  Lùi khi: người dùng đàn đều mà mãi kẹt 2★ → nới 40 ms lên 50 ms.
*/
export function saoTheoNhip(score: { total: number; hit: number; medianAbsMs: number | null }): 0 | 1 | 2 | 3 {
  const trung = score.total ? score.hit / score.total : 0
  const lech = score.medianAbsMs ?? Infinity
  return trung >= 0.9 && lech <= 40 ? 3 : trung >= 0.75 && lech <= 80 ? 2 : trung >= 0.5 ? 1 : 0
}
export function saoChoDung(k: { chang: number; vap: number }): 1 | 2 | 3 {
  return k.vap === 0 ? 3 : k.vap <= Math.max(1, Math.round(k.chang * 0.1)) ? 2 : 1
}

/* ---------------- Game Scale ---------------- */

export type NhomScale = LoaiGam | 'arp-truong' | 'arp-thu'
export const NHOM_SCALE: readonly { id: NhomScale; ten: string }[] = [
  ...GAM.map((g) => ({ id: g.id, ten: g.ten })),
  { id: 'arp-truong', ten: 'Rải hợp âm trưởng' },
  { id: 'arp-thu', ten: 'Rải hợp âm thứ' },
]
export interface CauScale {
  nhom: NhomScale
  goc: number
  ten: string
  /** Quãng đi lên một quãng tám, kể cả nốt đỉnh (gam trưởng: 8 nốt). */
  iv: number[]
  thu: boolean
}
export function cauScale(nhom: NhomScale, goc: number): CauScale {
  if (nhom === 'arp-truong' || nhom === 'arp-thu') {
    const thu = nhom === 'arp-thu'
    return { nhom, goc: pc(goc), thu, ten: `Rải hợp âm ${tenGoc(goc, thu)} ${thu ? 'thứ' : 'trưởng'}`, iv: [...arpCua(thu ? 'thu' : 'truong').iv, 12] }
  }
  const g = gamCua(nhom)
  return { nhom, goc: pc(goc), thu: g.thu, ten: `${g.ten} ${tenGoc(goc, g.thu)}`, iv: [...g.iv, 12] }
}

/**
 * Nốt `not` có phải nốt đúng kế tiếp không, khi đã bấm đúng `daBam` (nốt tuyệt đối). Nốt đầu: nốt gốc ở quãng tám nào cũng được;
 * từ nốt thứ hai: đúng nốt kế trong gam, tính từ nốt gốc vừa bấm (đi lên).
 */
export function notDung(cau: CauScale, daBam: readonly number[], not: number): boolean {
  if (daBam.length >= cau.iv.length) return false
  if (daBam.length === 0) return pc(not) === cau.goc
  return not === daBam[0]! + cau.iv[daBam.length]!
}
