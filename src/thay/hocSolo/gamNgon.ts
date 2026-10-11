import { pitchClassName } from '../../shared/musicTheory/pitch'
import { vn } from '../soanCau/chongHopAm'
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

/* ---------------- Chấm game chạy ngón ---------------- */

/** Tốc độ đặt mục tiêu — nốt mỗi giây (móc đơn ở ♩ = 60 là 2 nốt/giây). */
export const TOC_DO = [
  { nps: 2, ten: 'Chậm', mo: 'móc đơn ở ♩ = 60' },
  { nps: 3, ten: 'Vừa', mo: 'móc đơn ở ♩ = 90' },
  { nps: 4, ten: 'Nhanh', mo: 'móc kép ở ♩ = 60' },
  { nps: 6, ten: 'Rất nhanh', mo: 'móc kép ở ♩ = 90' },
] as const

export interface KetQuaNgon {
  dung: number
  sai: number
  /** Tỉ lệ cú bấm đúng trên mọi cú bấm. */
  chinhXac: number
  /** Đều tay: độ lệch chuẩn khoảng cách giữa hai nốt chia trung bình (càng nhỏ càng đều). null khi chưa đủ 3 nốt. */
  lech: number | null
  /** Nốt mỗi giây (trung bình khoảng cách). */
  tocDo: number | null
  sao: 0 | 1 | 2 | 3
}

/**
 * Chấm một lượt. `luc`: thời điểm (mili giây) của các cú bấm đúng theo thứ tự. NGƯỠNG SAO — Claude đặt, CHƯA ĐO: 3★ chính xác ≥ 98 %,
 * lệch ≤ 0,20, đủ tốc độ mục tiêu; 2★ ≥ 90 %, lệch ≤ 0,35, ≥ 75 % tốc độ; 1★ ≥ 80 %. Lùi khi: người dùng đàn đều mà mãi không lên 3★
 * → nới ngưỡng lệch (0,20 → 0,25).
 */
export function chamNgon(luc: readonly number[], sai: number, mucTieu: number): KetQuaNgon {
  const dung = luc.length
  const chinhXac = dung + sai ? dung / (dung + sai) : 0
  const kc = luc.slice(1).map((t, i) => t - luc[i]!)
  let lech: number | null = null
  let tocDo: number | null = null
  if (kc.length >= 2) {
    const tb = kc.reduce((a, b) => a + b, 0) / kc.length
    const dl = Math.sqrt(kc.reduce((a, b) => a + (b - tb) ** 2, 0) / kc.length)
    lech = tb > 0 ? dl / tb : null
    tocDo = tb > 0 ? 1000 / tb : null
  }
  const sao: KetQuaNgon['sao'] =
    chinhXac >= 0.98 && lech !== null && lech <= 0.2 && tocDo !== null && tocDo >= mucTieu
      ? 3
      : chinhXac >= 0.9 && lech !== null && lech <= 0.35 && tocDo !== null && tocDo >= 0.75 * mucTieu
        ? 2
        : chinhXac >= 0.8
          ? 1
          : 0
  return { dung, sai, chinhXac, lech, tocDo, sao }
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
