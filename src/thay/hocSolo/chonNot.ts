import { nguCanh } from '../soanCau/giaiThich'

/*
  CHỌN NỐT TRÊN TỪNG HỢP ÂM — trang Học Solo. Người dùng 11/10/2026: "Bạn trong vai gia sư piano dạy cho tôi cách chọn nốt từ mỗi hợp âm
  để chạy nốt trên đàn Piano — Phân tích cách chọn nốt của 3 thầy để dạy tôi chọn và tại sao ở mỗi hợp âm lại nên chọn những nốt đó. Vậy
  là có 3 thầy và 1 gia sư, hãy làm thành 4 lựa chọn để học theo từng thầy … Sau khi phân tích lý thuyết thì hãy tổng hợp ra các quy luật
  rồi làm thành mẹo để tôi dễ học".
  SỐ ĐO (không đo mới — chép từ md đã chốt, PianoBrain): Cà Pháo md mục 2 (`tools/sheet/bac_not.py`, đoạn solo 4 bài, 828 nốt); Linh Nhi
  md mục 6b + "LUẬT SOẠN NỐT" (cùng tool, 7 bài, 1045 nốt); Blues md mục 3 + 7 (Rockhouse 810 nốt theo chức năng; Rising Sun nhỏ); luật
  chung `knowledge/LUAT-SOAN-NOT.md` (13 bản ký âm, 2169 nốt — Linh Nhi, Cà Pháo, Tôn Hùng). VAI NỐT (khung · màu · gam · tránh) là lý
  thuyết; lời "gia sư" là của Claude, mức học sinh lớp 6.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type ThayHoc = 'gia-su' | 'ca-phao' | 'linh-nhi' | 'blues'
export const THAY_HOC: readonly { id: ThayHoc; ten: string; tom: string; coSo: string }[] = [
  {
    id: 'gia-su',
    ten: 'Gia sư (Claude)',
    tom: 'Chọn nốt giống xây một cây cầu. TRỤ cầu là nốt của hợp âm — rải hợp âm (arpeggio) — đặt ở phách mạnh và ở chỗ dừng. MẶT cầu nối giữa hai trụ là nốt của gam của bài (scale) — đi qua ở phách nhẹ. MÀU là vài nốt thêm cho đẹp (9, 13 trên hợp âm trưởng; 9, 11, ♭7 trên hợp âm thứ). Nốt TRÁNH là nốt đứng sát trên một nốt trụ nửa cung — chỉ lướt qua, đừng ngân. Ba thầy làm khác nhau ở chỗ nặng nhẹ, còn bộ khung này thì ai cũng theo.',
    coSo: 'Luật chung (13 bản ký âm, 2169 nốt — Linh Nhi, Cà Pháo, Tôn Hùng): 97,2 % nốt nằm trong gam của bài; nốt hợp âm 64–73 % tùy thầy; bậc 4 trên hợp âm trưởng chỉ 5–6 % ở cả ba thầy. Lời gia sư là của Claude.',
  },
  {
    id: 'ca-phao',
    ten: 'Cà Pháo',
    tom: 'Anh bám hợp âm chặt (71 % nốt là nốt hợp âm) mà vẫn rất "màu": trên hợp âm trưởng, 9 và 13 chiếm một phần tư số nốt; trên hợp âm thứ anh đánh thẳng ♭7 và 11. Câu của anh rải hợp âm và nhảy quãng nhiều hơn đi liền bậc. Anh cũng đi ra ngoài gam nhiều nhất ba thầy (4,7 %) — chủ yếu nốt blue ♭7, ♭5, ♭3, ♭9.',
    coSo: 'md Cà Pháo mục 2: đoạn solo 4 bài, 828 nốt giai điệu (nốt cao nhất mỗi cú tay phải); nốt hợp âm 70,8 %, ngoài gam 4,7 %. Ballad 7 bài (mục Solo ballad): bước ≤ 2 nửa cung chỉ 22–41 %, bậc 9 gần ngang bậc 5.',
  },
  {
    id: 'linh-nhi',
    ten: 'Linh Nhi',
    tom: 'Chị neo vào giọng bài: 98 % nốt nằm trong gam của bài, và chị bám hợp âm lỏng nhất ba thầy (64 %) — gần bốn trên mười nốt nằm ngoài hợp âm mà vẫn trong gam. Câu ít nhảy (44 % đứng yên hoặc đi liền bậc). Bài trưởng chị bám chặt ba nốt trụ; bài thứ chị rải rộng sang 9, ♭7, 11 và lặp nốt nhiều gấp ba.',
    coSo: 'md Linh Nhi "Luật soạn nốt" + mục 6b: đoạn solo 7 bài, 1045 nốt; nốt hợp âm 63,6 %, ngoài gam 1,8 %; bài trưởng 70,2 % (n=406), bài thứ 59,9 % (n=601).',
  },
  {
    id: 'blues',
    ten: 'Blues',
    tom: 'Blues chọn nốt theo CHỦ ÂM chứ không theo từng hợp âm: giữ một gam cho cả vòng — ngũ cung trưởng của chủ (Đô – Rê – Mi – Sol – La ở Đô) — thêm nốt blue ♭3 làm màu. Sang IV thì bậc 3 đổi thành ♭3. Phách 1 · 4 vẫn là nốt hợp âm.',
    coSo: 'md Blues mục 3, 7: Ray Charles (Rockhouse, Sol trưởng) — 81 % nốt nằm trong ngũ cung trưởng của chủ (503 nốt câu lick); phách 1 · 4 là nốt hợp âm 69–77 % (3 sheet). Blues thứ: Rising Sun (Mi thứ), mẫu nhỏ.',
  },
]

export type LoaiHop = 'truong' | 'thu' | 'at' | 'giam'
export interface HopHoc {
  /** Gốc so với chủ âm, nửa cung. */
  goc: number
  chat: string
  loai: LoaiHop
  laMa: string
}
const H = (goc: number, chat: string, loai: LoaiHop, laMa: string): HopHoc => ({ goc, chat, loai, laMa })

/** Hợp âm để học — hợp âm của giọng; Blues: khung I · IV · V (thứ: i · IV7 · V7 · ♭VI7). */
export function hopAmHoc(thay: ThayHoc, thu: boolean): HopHoc[] {
  if (thay === 'blues')
    return thu
      ? [H(0, 'm', 'thu', 'i'), H(5, '7', 'at', 'IV7'), H(7, '7', 'at', 'V7'), H(8, '7', 'at', '♭VI7')]
      : [H(0, '7', 'at', 'I7'), H(5, '7', 'at', 'IV7'), H(7, '7', 'at', 'V7')]
  return thu
    ? [H(0, 'm', 'thu', 'i'), H(2, 'dim', 'giam', 'ii°'), H(3, '', 'truong', '♭III'), H(5, 'm', 'thu', 'iv'), H(7, '7', 'at', 'V7'), H(8, '', 'truong', '♭VI'), H(10, '', 'truong', '♭VII')]
    : [H(0, '', 'truong', 'I'), H(2, 'm', 'thu', 'ii'), H(4, 'm', 'thu', 'iii'), H(5, '', 'truong', 'IV'), H(7, '7', 'at', 'V7'), H(9, 'm', 'thu', 'vi'), H(11, 'dim', 'giam', 'vii°')]
}

export type VaiNot = 'khung' | 'mau' | 'gam' | 'tranh' | 'nha' | 'blue' | 'ngoai'
export const VAI: Readonly<Record<VaiNot, { ten: string; mo: string }>> = {
  khung: { ten: 'Khung', mo: 'nốt của hợp âm — rải hợp âm (arpeggio); đặt ở phách mạnh, chỗ dừng' },
  mau: { ten: 'Màu', mo: 'nốt thêm làm hợp âm đẹp hơn — dừng được' },
  gam: { ten: 'Gam', mo: 'nốt của gam bài — đi qua giữa hai nốt khung' },
  tranh: { ten: 'Tránh ngân', mo: 'đứng sát trên một nốt khung nửa cung — chỉ lướt qua' },
  nha: { ten: 'Nốt nhà', mo: 'chủ âm của bài, đánh trên V — như về nhà sớm' },
  blue: { ten: 'Nốt blue', mo: 'lướt rồi trượt sang nốt bên cạnh' },
  ngoai: { ten: 'Ngoài gam', mo: 'ít dùng' },
}

const KHUNG: Readonly<Record<LoaiHop, readonly number[]>> = { truong: [0, 4, 7], thu: [0, 3, 7], at: [0, 4, 7, 10], giam: [0, 3, 6] }
const MAU: Readonly<Record<LoaiHop, readonly number[]>> = { truong: [2, 9, 11, 6], thu: [2, 5, 10], at: [2, 9], giam: [10] }
const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
const GAM_THU = [0, 2, 3, 5, 7, 8, 10]
const GAM_THU_HOA_THANH = [0, 2, 3, 5, 7, 8, 11]

/** Tên bậc so với gốc hợp âm. */
export function tenBac(iv: number, loai: LoaiHop, blues = false): string {
  const t = ['1', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'][pc(iv)]!
  if (pc(iv) === 6 && (loai === 'giam' || blues)) return '♭5'
  if (pc(iv) === 3 && (loai === 'truong' || loai === 'at')) return '♯9'
  return t
}

/** Vai của nốt cách gốc hợp âm `iv` nửa cung (lý thuyết; Blues theo gam của chủ âm). */
export function vaiNot(iv: number, hop: HopHoc, thu: boolean, thay: ThayHoc): VaiNot {
  const i = pc(iv)
  const t = pc(hop.goc + i)
  if (KHUNG[hop.loai].includes(i)) return 'khung'
  if (thay === 'blues') {
    if (!thu && hop.goc === 5 && t === 4) return 'tranh'
    if ((thu ? [6] : [3, 6, 10]).includes(t)) return 'blue'
    return (thu ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]).includes(t) ? 'gam' : 'ngoai'
  }
  const gam = !thu ? GAM_TRUONG : hop.loai === 'at' && hop.goc === 7 ? GAM_THU_HOA_THANH : GAM_THU
  if (!gam.includes(t)) return 'ngoai'
  if (hop.loai === 'at' && hop.goc === 7 && t === 0) return 'nha'
  if (hop.loai === 'at' && thu && (i === 1 || i === 8)) return 'mau'
  if (KHUNG[hop.loai].some((k) => pc(k + 1) === i)) return 'tranh'
  return MAU[hop.loai].includes(i) ? 'mau' : 'gam'
}

/* Phân bố bậc (phần trăm) — so GỐC HỢP ÂM (Blues: so CHỦ ÂM, đổi sang gốc hợp âm khi dùng). */
type PhanBo = { pct: Readonly<Record<number, number>>; n: number; nguon: string }
const CP: Partial<Record<LoaiHop, PhanBo>> = {
  truong: { pct: { 4: 20, 7: 19, 2: 15, 11: 12, 0: 12, 9: 10, 5: 5 }, n: 422, nguon: 'Cà Pháo, hợp âm trưởng, đoạn solo 4 bài (md mục 2)' },
  thu: { pct: { 3: 20, 7: 19, 10: 19, 5: 13, 0: 8, 2: 8 }, n: 282, nguon: 'Cà Pháo, hợp âm thứ, đoạn solo 4 bài (md mục 2)' },
  at: { pct: { 7: 21, 4: 17, 5: 12, 10: 11, 8: 9, 2: 9, 9: 8 }, n: 66, nguon: 'Cà Pháo, hợp âm át, đoạn solo 4 bài (md mục 2) — mẫu mỏng' },
}
const LN: Readonly<Record<string, PhanBo>> = {
  'truong|truong': { pct: { 0: 28, 4: 26, 7: 21 }, n: 155, nguon: 'Linh Nhi, hợp âm trưởng trong bài trưởng (md mục 6b) — chỉ ghi ba bậc đầu' },
  'truong|thu': { pct: { 4: 23, 7: 17, 2: 15, 0: 13, 9: 7 }, n: 150, nguon: 'Linh Nhi, hợp âm trưởng trong bài thứ (md mục 6b)' },
  'thu|truong': { pct: { 0: 26, 3: 24, 7: 17 }, n: 207, nguon: 'Linh Nhi, hợp âm thứ trong bài trưởng (md mục 6b) — chỉ ghi ba bậc đầu' },
  'thu|thu': { pct: { 7: 21, 0: 19, 3: 14, 2: 13, 10: 11 }, n: 355, nguon: 'Linh Nhi, hợp âm thứ trong bài thứ (md mục 6b)' },
  at: { pct: { 0: 27, 5: 27, 7: 13, 4: 10, 10: 9, 8: 5 }, n: 93, nguon: 'Linh Nhi, hợp âm át, đoạn solo 7 bài (md "Luật soạn nốt")' },
}
/** Blues — so CHỦ ÂM. Rockhouse 810 nốt gộp I · IV · V (md mục 3); Rising Sun i n=49, V7 n=35 (md mục 3). */
const BLUES_TRUONG: Readonly<Record<number, Omit<PhanBo, 'n'> & { n: number }>> = {
  0: { pct: { 0: 37, 7: 16, 9: 13, 4: 10, 2: 8, 3: 6, 10: 4 }, n: 810, nguon: 'Ray Charles, Rockhouse — nốt trên I, so chủ âm (810 nốt gộp I · IV · V)' },
  5: { pct: { 0: 26, 9: 16, 3: 15, 2: 15, 7: 12, 5: 7 }, n: 810, nguon: 'Ray Charles, Rockhouse — nốt trên IV, so chủ âm (810 nốt gộp)' },
  7: { pct: { 7: 27, 2: 13, 0: 12, 9: 10, 10: 8, 5: 8 }, n: 810, nguon: 'Ray Charles, Rockhouse — nốt trên V, so chủ âm (810 nốt gộp)' },
}
const BLUES_THU: Readonly<Record<number, PhanBo>> = {
  0: { pct: { 3: 33, 0: 29, 5: 18, 7: 8, 10: 8, 6: 2 }, n: 49, nguon: 'Rising Sun — nốt trên i, so chủ âm (n=49, mẫu nhỏ)' },
  7: { pct: { 10: 29, 7: 23, 5: 20, 6: 17 }, n: 35, nguon: 'Rising Sun — nốt trên V7, so chủ âm (n=35, mẫu nhỏ)' },
}

/** Phân bố của thầy trên hợp âm này, đổi về so GỐC HỢP ÂM; null nếu chưa đo (Gia sư: không có số riêng). */
export function phanBo(thay: ThayHoc, hop: HopHoc, thu: boolean): PhanBo | null {
  if (thay === 'ca-phao') return CP[hop.loai] ?? null
  if (thay === 'linh-nhi') return hop.loai === 'at' ? LN.at! : hop.loai === 'giam' ? null : LN[`${hop.loai}|${thu ? 'thu' : 'truong'}`] ?? null
  if (thay === 'blues') {
    const b = (thu ? BLUES_THU : BLUES_TRUONG)[hop.goc]
    if (!b) return null
    const pct: Record<number, number> = {}
    for (const [t, v] of Object.entries(b.pct)) pct[pc(Number(t) - hop.goc)] = v
    return { ...b, pct }
  }
  return null
}

export interface NotHoc {
  /** So gốc hợp âm, 0–11. */
  iv: number
  bac: string
  vai: VaiNot
  pct: number | null
}
/** Bậc so CHỦ ÂM — Blues nghĩ theo chủ âm nên ghi bậc theo chủ âm. */
const BAC_CHU = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']
/** 12 nốt quanh hợp âm: vai và phần trăm thầy chọn. Bậc: so gốc hợp âm (Blues: so chủ âm). */
export function notTrenHop(thay: ThayHoc, hop: HopHoc, thu: boolean): NotHoc[] {
  const p = phanBo(thay, hop, thu)
  return Array.from({ length: 12 }, (_, iv) => ({
    iv,
    bac: thay === 'blues' ? BAC_CHU[pc(hop.goc + iv)]! : tenBac(iv, hop.loai),
    vai: vaiNot(iv, hop, thu, thay),
    pct: p?.pct[iv] ?? null,
  }))
}

/** Cảm giác nghe của từng nốt màu — lời gia sư. */
const CAM_GIAC: Readonly<Record<string, string>> = {
  'truong|2': 'mở, trong',
  'truong|9': 'ấm',
  'truong|11': 'mơ màng',
  'truong|6': 'lấp lánh',
  'thu|2': 'mềm, rộng',
  'thu|5': 'rộng, hiện đại',
  'thu|10': 'buồn mà ấm',
  'at|2': 'tròn',
  'at|9': 'ấm, gospel',
  'at|1': 'căng, như nấc',
  'at|8': 'tối, nghẹn',
  'giam|10': 'mềm lại',
}

/** Lời gia sư cho một hợp âm theo một thầy — tên nốt ở giọng đang học. */
export function giangHop(thay: ThayHoc, hop: HopHoc, tonic: number, thu: boolean): string {
  const { n, h } = nguCanh(tonic, thu)
  const r = (iv: number) => n(pc(hop.goc + iv))
  const ten = h(hop.goc, hop.chat)
  const nots = notTrenHop(thay, hop, thu)
  const khung = KHUNG[hop.loai].map(r).join(' – ')
  const mau = nots
    .filter((x) => x.vai === 'mau')
    .map((x) => `${r(x.iv)} (${x.bac}${CAM_GIAC[`${hop.loai}|${x.iv}`] ? ` — ${CAM_GIAC[`${hop.loai}|${x.iv}`]}` : ''})`)
    .join('; ')
  const tranh = nots.filter((x) => x.vai === 'tranh').map((x) => `${r(x.iv)} (${x.bac})`)

  const giaSu = (): string => {
    if (hop.loai === 'truong')
      return `${ten} là hợp âm trưởng — khung ${khung}. Đặt nốt khung ở phách mạnh và ở chỗ dừng: nghe chắc, rõ màu trưởng; ${r(4)} (bậc 3) là nốt "hát" nhất. Giữa hai nốt khung, đi bằng nốt gam của bài.${mau ? ` Màu: ${mau}.` : ''}${tranh.length ? ` Tránh ngân ${tranh.join(', ')}: đứng sát trên một nốt khung nửa cung nên cọ — chỉ lướt qua.` : ''}`
    if (hop.loai === 'thu')
      return `${ten} là hợp âm thứ — khung ${khung}; ${r(3)} (bậc ♭3) mang nỗi buồn. Hợp âm thứ dễ tô màu${mau ? `: ${mau}` : ''} — các nốt ấy không đứng sát trên nốt khung nên dừng được.${tranh.length ? ` Chỉ ${tranh.join(', ')} là nên lướt qua.` : ''}`
    if (hop.loai === 'at')
      return `${ten} là hợp âm kéo về nhà — khung ${khung}; ${r(4)} và ${r(10)} là cặp "nam châm" muốn về nhà.${hop.goc === 7 ? ` Đánh ${n(0)} (nốt nhà) trên ${ten} cũng hay — câu như về nhà sớm một nhịp.` : ''}${mau ? ` Màu: ${mau}.` : ''}${thu && hop.goc === 7 ? ` Bài thứ: ${r(4)} là nốt cảm — bậc 7 nâng của gam thứ hòa thanh; đừng đánh ${r(3)} ở đây, nó cọ với ${r(4)}.` : ''}`
    return `${ten} là hợp âm giảm — khung ${khung}; thêm ${r(10)} thành ${h(hop.goc, 'm7b5')}. Đây là hợp âm "đi qua": đánh nốt khung rồi đi tiếp sang hợp âm sau (thường là V).${tranh.length ? ` Lướt qua ${tranh.join(', ')}.` : ''}`
  }

  if (thay === 'gia-su') return giaSu()

  if (thay === 'ca-phao') {
    if (hop.loai === 'truong')
      return `Trên hợp âm trưởng (${ten}) anh Cà Pháo chọn khá đều: ${r(4)} (3) 20 %, ${r(7)} (5) 19 %, rồi ${r(2)} (9) 15 %, ${r(11)} (7) 12 %, ${r(0)} (gốc) 12 %, ${r(9)} (13) 10 %. Nốt gốc không nhiều hơn nốt màu — anh thích để câu đứng trên ${r(4)}, ${r(2)}, ${r(9)} hơn là trên ${r(0)}: nghe mở, sang, kiểu ballad nhạc trẻ. 9 và 13 cộng lại một phần tư số nốt — nhiều nhất ba thầy. ${r(5)} (bậc 4) chỉ 5 % — anh cũng tránh.`
    if (hop.loai === 'thu')
      return `Trên hợp âm thứ (${ten}): ${r(3)} (♭3) 20 %, ${r(7)} (5) 19 %, ${r(10)} (♭7) 19 %, ${r(5)} (11) 13 %, gốc chỉ 8 %. Anh đánh thẳng lên hợp âm bảy (${h(hop.goc, 'm7')}) và hay thêm 11 — nghe rộng, hiện đại; bậc 11 trên hợp âm thứ của anh cao nhất ba thầy.`
    if (hop.loai === 'at')
      return `Trên hợp âm V (${ten}): ${r(7)} (5) 21 %, ${r(4)} (3) 17 %, nốt nhà ${n(0)} (bậc 11 của ${ten}) 12 %, ${r(10)} (♭7) 11 %, ${r(8)} (♭13) 9 %. ♭13 làm V căng hơn, kiểu jazz. Mẫu nhỏ (n=66) — nghe thêm cho chắc.`
    return `Chưa có số đo nốt solo của anh trên hợp âm giảm. Lời gia sư: ${giaSu()}`
  }

  if (thay === 'linh-nhi') {
    if (hop.loai === 'truong')
      return thu
        ? `Bài thứ, trên hợp âm trưởng (${ten}): ${r(4)} 23 %, ${r(7)} 17 %, ${r(2)} (9) 15 %, ${r(0)} 13 %, ${r(9)} (13) 7 %. Chị rời nốt gốc và thêm 9 — nghe mơ, không "đóng" như ở bài trưởng.`
        : `Bài trưởng, trên hợp âm trưởng (${ten}): chị gần như chỉ đánh ba nốt trụ — ${r(0)} 28 %, ${r(4)} 26 %, ${r(7)} 21 % (cộng 75 %). Nghe chắc chắn, sáng sủa: cái "tươi" của bài trưởng chính là sự chắc chắn này. Câu đi liền bậc là chính.`
    if (hop.loai === 'thu')
      return thu
        ? `Bài thứ, trên hợp âm thứ (${ten}): ${r(7)} 21 %, ${r(0)} 19 %, ${r(3)} 14 %, ${r(2)} (9) 13 %, ${r(10)} (♭7) 11 %. Chị rải rộng sang 9 và ♭7, và lặp nốt nhiều — nốt đứng yên rồi mới bước, nghe ngân nga.`
        : `Bài trưởng, trên hợp âm thứ (${ten}): vẫn ba nốt trụ — ${r(0)} 26 %, ${r(3)} 24 %, ${r(7)} 17 %. Chị giữ câu chắc như trên hợp âm trưởng.`
    if (hop.loai === 'at')
      return `Trên V (${ten}): nốt nhà ${n(0)} (bậc 11 của ${ten}) 27 %, ${r(0)} (gốc) 27 %, ${r(7)} 13 %, ${r(4)} 10 %, ${r(10)} 9 %, ${r(8)} (♭13) 5 %. Chị neo vào giọng bài: khi V đang vang chị vẫn hay đánh nốt nhà.${thu ? ` Bài thứ: trên V dùng nốt cảm ${r(4)}; nốt ♭9 (${r(1)}), ♭13 (${r(8)}) của chị đều có sẵn trong gam.` : ''}`
    return `Chưa có số đo nốt solo của chị trên hợp âm giảm (chị để ii° có ♭7 — m7♭5). Lời gia sư: ${giaSu()}`
  }

  // Blues — theo chủ âm.
  if (!thu) {
    if (hop.goc === 0)
      return `Blues chọn nốt theo CHỦ ÂM, không theo từng hợp âm. Trên I (${ten}): ${n(0)} 37 %, ${n(7)} 16 %, ${n(9)} 13 %, ${n(4)} 10 %, ${n(2)} 8 %, ${n(3)} 6 % (nốt blue), ${n(10)} 4 %. Phách mạnh đặt ${n(0)}, ${n(9)}, ${n(4)}; nốt blue ${n(3)} lướt rồi rơi về ${n(2)}, ${n(0)} hay trượt lên ${n(4)} — cái "rên" của blues.`
    if (hop.goc === 5)
      return `Trên IV (${ten}): ${n(0)} 26 %, ${n(9)} 16 %, ${n(3)} 15 %, ${n(2)} 15 %, ${n(7)} 12 %. Sang IV thì ${n(4)} đổi thành ${n(3)} — vì ${n(4)} cọ với ${n(3)}, chính là ♭7 của ${ten}. Ray dùng ${n(4)} trên IV 3 lần, ${n(3)} 31 lần; Robert 0 và 25.`
    return `Trên V (${ten}): ${n(7)} 27 %, ${n(2)} 13 %, ${n(0)} 12 %, ${n(9)} 10 %, ${n(10)} 8 %. Ray vẫn giữ ngũ cung của chủ khi đi qua V, và để nốt nhà ${n(0)} ở phách mạnh 17 %.`
  }
  if (hop.goc === 0)
    return `Blues giọng thứ (Rising Sun — mẫu nhỏ, n=49). Trên ${ten}: ${n(3)} 33 %, ${n(0)} 29 %, ${n(5)} 18 %, ${n(7)} 8 %, ${n(10)} 8 % — gam blues thứ ${n(0)} – ${n(3)} – ${n(5)} – ${n(6, 5)} – ${n(7)} – ${n(10)}. Nốt blue ${n(6, 5)} lướt rồi trượt lên ${n(7)} (77 %, n=13).`
  if (hop.goc === 7)
    return `Trên ${ten} (n=35): ${n(10)} 29 % — chính là ♯9 của ${ten}, màu ${h(7, '7#9')} thầy Đức Thịnh bấm — ${n(7)} 23 %, ${n(5)} 20 %, ${n(6, 5)} 17 %. Không có nốt cảm ${n(11)}: blues giữ nỗi buồn của gam thứ tự nhiên.`
  return `Chưa đo riêng trên ${ten}. Lối chung của blues thứ: giữ gam blues thứ của chủ (${n(0)} – ${n(3)} – ${n(5)} – ${n(6, 5)} – ${n(7)} – ${n(10)}) qua mọi hợp âm — Rising Sun trên IV7 không có ${n(9)} dù hợp âm chứa nó: giai điệu bám gam của chủ, không bám hợp âm.`
}

/* ---------------- Scale và Arpeggio có phải cơ sở để chọn nốt không ---------------- */

export const HOI_DAP_SCALE: readonly { y: string; giai: string; coSo: string }[] = [
  {
    y: 'Đúng — nhưng mỗi thứ một việc.',
    giai: 'Arpeggio (rải hợp âm) cho bạn TRỤ: nốt của hợp âm đang vang, đặt ở phách mạnh và chỗ dừng. Scale (gam) cho bạn ĐƯỜNG: nốt đi qua giữa hai trụ. Thiếu trụ thì câu trôi, không biết đang ở hợp âm nào; toàn trụ thì câu cứng như bài tập rải.',
    coSo: 'Nốt hợp âm: Cà Pháo 70,8 % (828 nốt), Linh Nhi 63,6 % (1045 nốt); ở phách mạnh còn nhiều hơn — Linh Nhi bolero trưởng 82 % (137/167), slow rock 83 % (67/81); Blues phách 1 · 4 69–77 %.',
  },
  {
    y: 'Gam là gam của BÀI, không đổi theo từng hợp âm.',
    giai: 'Đang ở Đô trưởng thì cả câu đi bằng nốt của gam Đô trưởng, dù hợp âm là Dm, F hay G — không cần nhớ "mode" cho từng hợp âm. Ngoại lệ có lý do: bài thứ, trên V thì nâng bậc 7 (gam thứ hòa thanh); Blues dùng ngũ cung của chủ cộng nốt blue.',
    coSo: '97,2 % nốt solo nằm trong gam của bài (13 bản ký âm, 2169 nốt — Linh Nhi, Cà Pháo, Tôn Hùng). Số đo không đủ phân biệt Dorian với Aeolian — đừng gắn mode cho thầy nào (luật 10).',
  },
  {
    y: 'Các thầy không "chạy scale" từ đầu đến cuối.',
    giai: 'Câu của thầy là câu nhạc, không phải bài tập gam: Linh Nhi đi quãng 3–4 (rải hợp âm) nhiều hơn đi liền bậc trong câu chạy; Cà Pháo ballad nhảy quãng nhiều hơn chạy liền. Gam là thước đo để biết nốt nào được phép, còn hình câu đến từ ý nhạc.',
    coSo: '67 câu chạy Linh Nhi (2 sheet slow rock): bước 3 · 4 nửa cung 55 · 41 lần, bước 1 · 2 nửa cung 21 · 40 lần; nốt hợp âm 215/285. Cà Pháo ballad: bước ≤ 2 nửa cung chỉ 22–41 %. Md hai thầy: "có dùng scale, nhưng làm thước đo / bộ lọc, không làm nguồn nốt".',
  },
  {
    y: 'Ngoài gam chỉ là gia vị — và có lý do.',
    giai: 'Nốt ngoài gam rất ít, và gần như luôn là nốt blue (♭3, ♭5, ♭7) hoặc nốt cảm của bài thứ — đi vào, đi ra bằng bước liền bậc.',
    coSo: 'Ngoài gam 2,8 % (gộp 13 bản ký âm); dồn vào ♭7 và ♭5; 69 % được nối bằng bước liền bậc ít nhất một bên (luật 5).',
  },
]

/* ---------------- Mẹo — tổng hợp quy luật ---------------- */

export interface MeoSolo {
  nhom: string
  ten: string
  cau: string
  coSo: string
}
export const MEO_SOLO: readonly MeoSolo[] = [
  {
    nhom: 'Trụ và đường — arpeggio và scale',
    ten: 'Phách mạnh đặt nốt hợp âm, phách nhẹ đi bằng nốt gam',
    cau: 'Như xây cầu: trụ (phách mạnh, chỗ dừng) là nốt rải hợp âm; mặt cầu giữa hai trụ là nốt gam. Đổi hợp âm là đổi trụ, còn gam giữ nguyên.',
    coSo: 'Linh Nhi: nốt hợp âm ở phách mạnh 82 % (bolero trưởng, 137/167) và 83 % (slow rock, 67/81) — bolero thứ thấp hơn, 64 % (129/201). Blues: phách 1 · 4 là nốt hợp âm 69–77 % (3 sheet).',
  },
  {
    nhom: 'Trụ và đường — arpeggio và scale',
    ten: 'Giữ MỘT gam cho cả bài',
    cau: 'Gam của giọng bài, không đổi theo từng hợp âm. Bài thứ thì trên V nâng bậc 7 (nốt cảm).',
    coSo: '97,2 % nốt trong gam của bài (13 bản ký âm, 2169 nốt). Linh Nhi 98,2 %, Cà Pháo 95,3 % (đi xa gam nhất).',
  },
  {
    nhom: 'Trụ và đường — arpeggio và scale',
    ten: 'Khoảng hai phần ba là nốt hợp âm — đừng 100 %',
    cau: 'Toàn nốt hợp âm thì câu cứng như bài tập rải; quá ít thì câu trôi. Mỗi thầy đứng một chỗ trong khoảng 60–75 %.',
    coSo: 'Linh Nhi 63,6 % (n=1045) · Cà Pháo 70,8 % (n=828) · Tôn Hùng 73,0 % (n=296).',
  },
  {
    nhom: 'Bước đi',
    ten: 'Bước nhỏ là chính',
    cau: 'Gần một nửa số bước là đứng yên hoặc đi liền bậc; hai phần ba không quá một quãng ba.',
    coSo: 'Gộp 13 bản ký âm: lặp 11,5 % + liền bậc 34,0 % = 45 %; ≤ 4 nửa cung 66 %. Cà Pháo ballad nhảy nhiều hơn: bước ≤ 2 nửa cung chỉ 22–41 %.',
  },
  {
    nhom: 'Bước đi',
    ten: 'Nhảy xa thì quay đầu',
    cau: 'Sau một bước nhảy từ quãng 4 trở lên, nốt tiếp thường đi ngược chiều — như quả bóng nảy lên rồi rơi xuống.',
    coSo: 'Gộp 13 bản ký âm: sau nhảy ≥ 5 nửa cung, đổi chiều 62 %, cùng chiều 29 %, đứng yên 9 %.',
  },
  {
    nhom: 'Bước đi',
    ten: 'Lên đỉnh sớm rồi thả xuống',
    cau: 'Câu hay vươn lên nốt cao ở phần đầu rồi đi dần xuống. Linh Nhi: câu dạo và giang tấu đi xuống, câu kết thì không.',
    coSo: 'Blues: đỉnh câu ở phần đầu 58 % (Ray, n=76), 60 % (Rising Sun, n=5), 68 % (Robert, n=34). Linh Nhi md mục 7.',
  },
  {
    nhom: 'Theo loại hợp âm',
    ten: 'Hợp âm trưởng: khung 1 – 3 – 5, màu 9 – 13, tránh bậc 4',
    cau: 'Trên C: Đô – Mi – Sol là trụ; Rê, La là màu; Fa đứng sát trên Mi nửa cung — chỉ lướt qua.',
    coSo: 'Bậc 4 (11) trên hợp âm trưởng: Linh Nhi 6 %, Cà Pháo 5 % — cả ba thầy né. 9 + 13: Cà Pháo 25 %, Linh Nhi 17 %.',
  },
  {
    nhom: 'Theo loại hợp âm',
    ten: 'Hợp âm thứ: thoải mái thêm ♭7, 9, 11',
    cau: 'Trên Am: Sol, Si, Rê đều đẹp — không nốt nào đứng sát trên nốt khung. Chỉ Fa (♭13) là nên lướt.',
    coSo: 'Cà Pháo trên hợp âm thứ: ♭7 19 %, 11 13 %; Linh Nhi: 9 11 %, ♭7 10 %, 11 9 %.',
  },
  {
    nhom: 'Theo loại hợp âm',
    ten: 'Trên V, đánh luôn nốt nhà',
    cau: 'G7 đang vang ở bài Đô trưởng: thầy hay đánh Đô — câu như về nhà sớm một nhịp.',
    coSo: 'Linh Nhi: 27 % nốt trên V là chủ âm (25/25 nốt "bậc 11" là chủ âm); Cà Pháo 12 % (7/8).',
  },
  {
    nhom: 'Theo loại hợp âm',
    ten: 'Bài thứ, trên V: dùng nốt cảm',
    cau: 'La thứ, hợp âm E7: dùng Sol♯ (không phải Sol) — Sol♯ kéo lên La. Màu thêm Fa (♭9), Đô (♭13) — có sẵn trong gam.',
    coSo: 'Luật 6 (13 bản ký âm): tính cả nốt cảm thì nốt "ngoài gam" giảm từ 4,3 % xuống 3,1 %. Linh Nhi: ♭9 20/22 nốt nằm sẵn trong gam bài.',
  },
  {
    nhom: 'Nối hợp âm — câu chạy',
    ten: 'Câu chạy đáp vào nốt của hợp âm SAU, đúng vạch',
    cau: 'Chạy 3–4 nốt cuối ô rồi rơi đúng vạch vào nốt của hợp âm mới — hay nhất là bậc 5 hoặc gốc.',
    coSo: 'Linh Nhi: 56/64 câu chạy đáp vào nốt hợp âm sau (bậc 5: 21, gốc: 19). Ray: 21/45 câu chạy thẳng vào chỗ đổi hợp âm; câu chạy xuyên vạch 41/63 chỗ đổi.',
  },
  {
    nhom: 'Nối hợp âm — câu chạy',
    ten: 'Câu chạy = rải hợp âm xen nốt gam',
    cau: 'Đừng chạy toàn liền bậc: Linh Nhi đi quãng 3–4 (rải) nhiều hơn; ba phần tư nốt là nốt hợp âm.',
    coSo: '67 câu chạy Linh Nhi: bước 3 · 4 nửa cung 55 · 41 lần, bước 1 · 2 nửa cung 21 · 40 lần; nốt hợp âm 215/285, trong gam 280/285. Ray: câu chạy ngắn, 4–6 nốt ở 34/45 câu.',
  },
  {
    nhom: 'Nối hợp âm — câu chạy',
    ten: 'Kết câu về nốt 1 hoặc 5',
    cau: 'Muốn câu "đóng" thì dừng trên gốc hoặc bậc 5 của hợp âm; muốn câu còn lửng thì dừng trên bậc 3, 6.',
    coSo: 'Linh Nhi: đoạn kết co về 1 + 5 (47–51 % nốt); bolero trưởng kết về chủ âm 6/9 đoạn. Ray: 74 câu kết ở gốc 19, bậc 5 15, bậc 6 12.',
  },
  {
    nhom: 'Blues',
    ten: 'Ngũ cung của chủ + ♭3; sang IV thì 3 → ♭3',
    cau: 'Bài Đô: Đô – Rê – Mi – Sol – La là thân câu, Mi♭ làm màu. Trên F7 bỏ Mi, dùng Mi♭.',
    coSo: 'Ray (Rockhouse, 503 nốt): ngũ cung trưởng của chủ 81 %, ♭3 6 %. Trên IV: bậc 3 của chủ 3 lần, ♭3 31 lần; Robert 0 và 25.',
  },
  {
    nhom: 'Blues',
    ten: 'Nốt blue không đứng yên',
    cau: '♭3 rơi về 2 hay 1, hoặc trượt lên 3; ♭7 rơi về 5; bài thứ ♭5 trượt lên 5.',
    coSo: 'Ray: ♭3 → 2 (18), → 1 (16), → 3 (12) trên 67 lần; ♭7 → 5 17/34. Rising Sun: ♭5 → 5 77 % (n=13).',
  },
  {
    nhom: 'Ngón tay',
    ten: 'Chạy gam: luồn ngón cái, không đặt ngón cái lên phím đen',
    cau: 'Đô trưởng tay phải: 1 2 3 — luồn ngón cái — 1 2 3 4 5. Gam có phím đen thì ngón cái luôn rơi vào phím trắng (Fa trưởng: 1 2 3 4 1 2 3 4, vì nốt thứ tư là Si♭).',
    coSo: 'Ngón chuẩn sách piano — kỹ thuật chung, không phải số đo thầy.',
  },
  {
    nhom: 'Ngón tay',
    ten: 'Rải hợp âm 1 – 2 – 3 – 5',
    cau: 'Tay phải rải Đô – Mi – Sol – Đô bằng ngón 1 2 3 5; tay trái 5 4 2 1. Tập chậm cho đều, rồi mới nhanh.',
    coSo: 'Ngón chuẩn sách piano — kỹ thuật chung, không phải số đo thầy.',
  },
]

/* ---------------- Tên chữ trên bàn phím xem nốt ---------------- */

const CHU = 'CDEFGAB'
const TU_NHIEN = [0, 2, 4, 5, 7, 9, 11]

/**
 * Tên nốt bằng KÝ HIỆU CHỮ kèm quãng tám, như bàn phím của khung nốt rơi (C4, F♯4) — người dùng 11/10/2026: "tên nốt ở ảnh 2 hãy ghi
 * bằng ký hiệu như ảnh 1". Chữ đếm từ chữ của nốt gốc theo SỐ của bậc ghi dưới phím, rồi thêm dấu cho khớp nửa cung — bậc ♯9 của C là
 * D♯, ♭7 là B♭, ♭3 của Blues Đô là E♭ — nên tên và bậc luôn nói cùng một nốt. Cũ: tên Việt theo dấu của giọng (Mi♭ mà bậc ghi ♯9).
 * `null` khi bậc không đọc được hay cần hơn hai dấu.
 */
export function tenChu(m: number, gocChu: string, bac: string | null): string | null {
  const so = bac?.match(/(\d+)$/)
  const i0 = CHU.indexOf(gocChu[0] ?? '')
  if (!so || i0 < 0) return null
  const i = (i0 + Number(so[1]) - 1) % 7
  const lech = ((((m - TU_NHIEN[i]!) % 12) + 18) % 12) - 6
  if (Math.abs(lech) > 2) return null
  return `${CHU[i]}${lech < 0 ? '♭'.repeat(-lech) : '♯'.repeat(lech)}${Math.floor((m - lech) / 12) - 1}`
}
