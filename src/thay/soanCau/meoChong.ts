import { BA, CONG_THUC, chongCongThuc, quangTren, tenBac, type CongThuc } from './chongHopAm'

/*
  QUY LUẬT VÀ MẸO CHỒNG HỢP ÂM — THEO LOẠI HỢP ÂM. Người dùng 9/10/2026: "về các quy luật chồng hợp âm thì tôi muốn nó tính theo loại hợp
  âm (ví dụ như Maj7, 7b9, dim7, m11b5...) hơn là theo vị trí tay. Điều này dẫn tới các mẹo cũng phải tính theo loại hợp âm. Hãy phân
  tích lại và thiết kế lại quy luật và mẹo" (bản trước xếp theo vị trí tay phải — bỏ). Lời là của Claude (gia sư), rút từ 26 công thức
  chồng; mỗi quy luật có test đối chiếu công thức thật (meoChong.test.ts).
*/

/** Đếm phím từ gốc tay trái tới gốc tay phải (cả phím đen lẫn trắng). */
export function demPhim(cach: number): string {
  if (cach === 6) return 'cách 6 phím (nửa quãng tám)'
  if (cach === 7) return 'lên 7 phím (hay lùi 5)'
  return cach < 6 ? `lên ${cach} phím` : `lùi ${12 - cach} phím`
}

/** Năm họ, mỗi họ xếp từ dễ tới khó — thứ tự học và thứ tự màn game. */
export const HO_LOAI: readonly { ten: string; ids: readonly string[] }[] = [
  { ten: 'Họ trưởng', ids: ['maj7', '6', 'add9', '69', 'maj9', 'maj9#11'] },
  { ten: 'Họ thứ', ids: ['m7', 'm6', 'madd9', 'mMaj7', 'm9', 'm11', 'm13'] },
  { ten: 'Họ nửa giảm và giảm', ids: ['m7b5', 'm11b5', 'dim7'] },
  { ten: 'Họ át — cơ bản', ids: ['7', '9', '13', '9sus4'] },
  { ten: 'Họ át — có nốt căng (♭9 · ♯11 · ♭13 · ♭5)', ids: ['7b9', '7b5', '7b13', '13b9', '13#11', '13b9#11'] },
]

/** Thứ tự đọc công thức như sách — chồng quãng ba: 1 · 3 · 5 · 7 · 9 · 11 · 13 (sus4 thế chỗ bậc 3, 6 đứng trước 7). */
const THU_TU_BAC = ['1', '♭3', '3', '4', '♭5', '5', '♯5', '6', '𝄫7', '♭7', '7', '♭9', '9', '♯9', '11', '♯11', '♭13', '13']
const xepBac = (ds: readonly string[]) => [...new Set(ds)].sort((a, b) => THU_TU_BAC.indexOf(a) - THU_TU_BAC.indexOf(b))

/** Các bậc của một loại theo công thức chồng: tay trái, tay phải (từ thấp lên), và cả hợp âm (bậc thật sự bấm). */
export function bacCua(ct: CongThuc) {
  const trai = ct.duoi[0]!.map((iv) => tenBac(iv, ct))
  const phai = quangTren(ct).map((iv) => tenBac(iv, ct))
  return { trai, phai, caHai: xepBac([...trai, ...phai]) }
}

/** Mẹo riêng từng loại — lời gia sư, ví dụ gốc Đô. */
const MEO: Readonly<Record<string, string>> = {
  maj7: 'trưởng chồng thứ: hợp âm thứ bắt đầu từ bậc 3 (C + Em) — hai hợp âm ba nối đuôi, chung hai nốt Mi – Sol',
  '6': 'trưởng chồng thứ song song: Đô – Sol + Am (Am là hợp âm thứ song song của C, chung Đô – Mi)',
  add9: 'kẹp nốt 9 sát dưới bậc 3: Rê – Mi đứng sát nhau, Sol ở trên',
  '69': 'như C6 nhưng tay phải treo 4: Asus4 (La – Rê – Mi) — có cả 6 lẫn 9, không có 7',
  maj9: 'chồng hợp âm bậc V lên hợp âm chủ: C + G (tay phải 5 · 7 · 9)',
  'maj9#11': 'chồng hợp âm thứ bậc 7: C + Bm (tay phải 7 · 9 · ♯11 — màu Lydian sáng lung linh)',
  m7: 'thứ chồng trưởng song song: Đô + E♭ (E♭ là hợp âm trưởng song song của Cm)',
  m6: 'Đô – Sol + Adim (La – Đô – Mi♭)',
  madd9: 'kẹp nốt 9 sát dưới bậc ♭3: Rê – Mi♭ đứng sát nhau, Sol ở trên',
  mMaj7: 'Đô + E♭+ (tăng trên ♭3: Mi♭ – Sol – Si) — nốt Si (7 trưởng) cho tiếng phim trinh thám',
  m9: 'thứ chồng thứ bậc v: Cm + Gm (hai hợp âm thứ cách quãng năm)',
  m11: 'thứ chồng trưởng thấp hơn gốc một cung: Cm + B♭',
  m13: 'khung Cm7 bỏ 5 (Đô – Mi♭ – Si♭) + Dm: tay phải 9 · 11 · 13',
  m7b5: 'nửa giảm = gốc + hợp âm THỨ trên ♭3: Đô + E♭m',
  m11b5: 'Đô – Sol♭ + E♭sus2 (Mi♭ – Fa – Si♭): tay phải ♭3 · 11 · ♭7 — khác lệ của đuôi 11',
  dim7: 'bốn nốt cách đều 3 phím: Đô + E♭dim (Mi♭ – Sol♭ – La)',
  '7': 'gốc + hợp âm GIẢM trên bậc 3: Đô + Edim (Mi – Sol – Si♭)',
  '9': 'Đô – Mi + Gm: tay phải 5 · ♭7 · 9 (như m9 nhưng tay trái có bậc 3 trưởng)',
  '13': 'khung C7 (Đô – Mi – Si♭) + Am: tay phải 13 · 1 · 3 — tránh 11 vì 11 chọi bậc 3',
  '9sus4': 'gốc + hợp âm trưởng thấp hơn một cung: Đô + B♭ — chính là hợp âm slash B♭/C',
  '7b9': 'gốc + bảy giảm trên bậc 3: Đô + Edim7 (cùng nốt C♯dim7 — nâng gốc nửa cung thành bảy giảm)',
  '7b5': 'gốc + chùm Mi – Sol♭ – Si♭ (3 · ♭5 · ♭7): hạ bậc 5 của C7 nửa cung',
  '7b13': 'khung C7 + hợp âm tăng của chính gốc: C+ (viết A♭+ cũng cùng nốt)',
  '13b9': 'khung C7 + A TRƯỞNG: như C13 (Am) nhưng Đô → Đô♯ là thêm ♭9',
  '13#11': 'khung C7 + D trưởng: tay phải 9 · ♯11 · 13',
  '13b9#11': 'khung C7 + G♭m (cũng là F♯m): tay phải ♯11 · 13 · ♭9',
}

/** Mẹo của một loại: câu riêng + cách tìm (đếm phím · chất) — gốc Đô. */
export function meoCua(ct: CongThuc): string {
  const m = MEO[ct.id] ?? ''
  return 'iv' in ct.tren ? m : `${m} (${demPhim(ct.tren.cach)} · hợp âm ${BA[ct.tren.loai].ten})`
}

/** Dòng ngắn trên viên rơi của game: các bậc tay phải · chất. */
export const meoNgan = (ct: CongThuc) => {
  const b = bacCua(ct).phai.join('·')
  return 'iv' in ct.tren ? `chùm ${b}` : `tay phải ${b} · ${BA[ct.tren.loai].ten}`
}

/** Bảng 26 loại theo họ (gốc Đô). */
export function bangTheoLoai() {
  return HO_LOAI.map((h) => ({
    ...h,
    dong: h.ids.map((id) => {
      const ct = CONG_THUC.find((c) => c.id === id)!
      return { ct, nhan: chongCongThuc(ct, 0, 'C', 'flat').nhan, bac: bacCua(ct), meo: meoCua(ct) }
    }),
  }))
}

/**
 * Quy luật CON SỐ (đuôi tên hợp âm): số càng lớn, tay phải càng leo cao trên hợp âm. `phai` là các bậc tay phải; mọi loại trong `ids`
 * có test kiểm đúng các bậc ấy.
 */
export const LUAT_SO: readonly { so: string; luat: string; ids: readonly string[]; phai: readonly (readonly string[])[] }[] = [
  { so: '6', luat: 'tay phải dựng trên bậc 6 (6 · 1 · 3)', ids: ['6', '69', 'm6'], phai: [['6', '1', '3'], ['6', '9', '3'], ['6', '1', '♭3']] },
  {
    so: '7',
    luat: 'tay phải chính là 3 · 5 · 7 của hợp âm (dựng trên bậc 3 hay ♭3)',
    ids: ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'],
    phai: [['3', '5', '7'], ['3', '5', '♭7'], ['♭3', '5', '♭7'], ['♭3', '♭5', '♭7'], ['♭3', '♭5', '𝄫7'], ['♭3', '5', '7']],
  },
  { so: '9', luat: 'tay phải 5 · 7 · 9 (dựng trên bậc 5)', ids: ['maj9', 'm9', '9'], phai: [['5', '7', '9'], ['5', '♭7', '9'], ['5', '♭7', '9']] },
  { so: '11', luat: 'tay phải ♭7 · 9 · 11 (dựng trên bậc ♭7 — thấp hơn gốc một cung); riêng m11♭5 khác lệ', ids: ['m11', '9sus4'], phai: [['♭7', '9', '11'], ['♭7', '9', '4']] },
  {
    so: '13',
    luat: 'hợp âm thứ: tay phải 9 · 11 · 13 (trên bậc 9); hợp âm át: 13 · 1 · 3 (trên bậc 13 — tránh 11 chọi bậc 3)',
    ids: ['m13', '13'],
    phai: [['9', '11', '13'], ['13', '1', '3']],
  },
  { so: 'add9', luat: 'chùm 9 · 3 · 5 — kẹp 9 sát dưới bậc 3', ids: ['add9', 'madd9'], phai: [['9', '3', '5'], ['9', '♭3', '5']] },
  {
    so: 'nốt căng',
    luat: 'đổi đúng MỘT nốt hay MỘT chất của tay phải loại gốc: 13 → 13♭9 (Am → A), 7 → 7♭9 (Edim → Edim7), 7 → 7♭5 (Sol → Sol♭)',
    ids: ['13b9', '7b9', '7b5'],
    phai: [['13', '♭9', '3'], ['3', '5', '♭7', '♭9'], ['3', '♭5', '♭7']],
  },
]

/** Mẹo vàng theo loại — mỗi câu có test. */
export const MEO_VANG: readonly string[] = [
  'Nhìn ĐUÔI tên trước: 6 → tay phải trên bậc 6; 7 → trên bậc 3; 9 → trên bậc 5; 11 → trên bậc ♭7; 13 → trên bậc 9 (thứ) hay 13 (át). Số càng lớn, tay phải càng leo cao.',
  'Loại "7": tay phải chính là ba nốt 3 · 5 · 7 của hợp âm — chỉ cần biết chất của ba nốt ấy: maj7 → thứ, 7 → giảm, m7 → trưởng, m7♭5 → thứ, dim7 → giảm, m(maj7) → tăng.',
  'Đổi họ chỉ đổi CHẤT tay phải, không đổi chỗ: Cmaj7 = C + Em, C7 = C + Edim — cùng trên Mi; Cm7 = C + E♭, Cm7♭5 = C + E♭m — cùng trên Mi♭.',
  'Hợp âm 9 nào cũng có tay phải là hợp âm bậc V của gốc: Cmaj9 → G, Cm9 và C9 → Gm.',
  'Nốt căng = đổi một nốt: C13 (Am) → C13♭9 (A, Đô thành Đô♯); C7 (Edim) → C7♭9 (Edim7, thêm Rê♭).',
  'Hợp âm tăng và bảy giảm có nhiều tên cùng nốt: A♭+ = C+ (C7♭13 = C7 + C+); Edim7 = C♯dim7 (C7♭9 = gốc + bảy giảm nửa cung trên gốc).',
]
