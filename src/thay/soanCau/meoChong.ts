import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { GOC } from '../vongThay'
import { BA, CONG_THUC, chongCongThuc, gocDep, gocTren, hauDep, quangTren, tenBac, tenHaiTay, tenTheoChu, tenTren, vn, type CongThuc } from './chongHopAm'

/*
  QUY LUẬT VÀ MẸO CHỒNG HỢP ÂM — THEO LOẠI HỢP ÂM. Người dùng 9/10/2026: "về các quy luật chồng hợp âm thì tôi muốn nó tính theo loại hợp
  âm (ví dụ như Maj7, 7b9, dim7, m11b5...) hơn là theo vị trí tay. Điều này dẫn tới các mẹo cũng phải tính theo loại hợp âm. Hãy phân
  tích lại và thiết kế lại quy luật và mẹo" (bản trước xếp theo vị trí tay phải — bỏ). Lời là của Claude (gia sư), rút từ 26 công thức
  chồng; mỗi quy luật có test đối chiếu công thức thật (meoChong.test.ts).

  MẸO CỘNG GỐC — người dùng 9/10/2026 (ảnh lời giải B6/9 trong game): "Mẹo ghi như trong ảnh còn quá mơ hồ và máy móc tôi ko hiểu được …
  Tôi muốn mẹo sẽ chỉ cho tôi cụ thể theo hướng gốc nào cộng gốc nào thì sẽ ra gốc tổng cần tìm. Trong piano tuy có nhiều gốc khác nhau
  nhưng tôi đoán là sẽ có những mẹo cộng gốc chung có thể giúp tìm ra nhiều gốc từ 1 dạng công thức". Bản cũ đếm gam trưởng của gốc tới
  bậc cần dùng ("Gam Si trưởng: Si Đô♯ … → bậc 6 là Sol♯"), ghi bậc (6·9·3) và lấy ví dụ gốc Đô cho mọi gốc — bỏ. Nay: gốc tay phải =
  gốc hợp âm lên / lùi mấy phím. Đếm trên 26 công thức: 23 loại tay phải là hợp âm ba, chỉ dùng 9 cách cộng gốc; 3 loại là chùm nốt rời.
  Mỗi cách dùng cho nhiều loại — chỉ đổi chất tay phải (số đếm có test).
*/

/** Ghi dấu theo gốc: Đô♯, Fa♯ ghi thăng, còn lại ghi giáng (Mi♭, La♭, Si♭) — đúng cách ghi của `GOC`. */
export const kieuGoc = (g: number): AccidentalStyle => (g === 1 || g === 6 ? 'sharp' : 'flat')

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

/* ---------------- Mẹo cộng gốc ---------------- */

export interface CachCongGoc {
  /** Gốc tay phải cách gốc hợp âm bao nhiêu nửa cung, tính đi lên (0–11). */
  cach: number
  ten: string
  /** Cái móc để nhớ — đúng ở mọi gốc. */
  moc: string
}

/** Chín cách cộng gốc, xếp từ dễ thấy nhất: nốt nằm ngay trong hợp âm trên gốc, rồi cặp quen tai, rồi đếm phím. */
export const CONG_GOC: readonly CachCongGoc[] = [
  { cach: 4, ten: 'lên 4 phím', moc: 'nốt giữa của hợp âm trưởng trên gốc' },
  { cach: 3, ten: 'lên 3 phím', moc: 'nốt giữa của hợp âm thứ trên gốc' },
  { cach: 7, ten: 'lên 7 phím', moc: 'nốt trên cùng của hợp âm trên gốc' },
  { cach: 9, ten: 'lùi 3 phím', moc: 'cặp thứ song song quen tai: C ↔ Am, G ↔ Em, F ↔ Dm' },
  { cach: 10, ten: 'lùi 2 phím', moc: 'thấp hơn gốc một cung' },
  { cach: 2, ten: 'lên 2 phím', moc: 'cao hơn gốc một cung' },
  { cach: 11, ten: 'lùi 1 phím', moc: 'phím sát dưới gốc' },
  { cach: 6, ten: 'cách 6 phím', moc: 'giữa quãng tám — lên hay lùi đều 6 phím' },
  { cach: 8, ten: 'lùi 4 phím', moc: 'hợp âm tăng chia đều quãng tám — cùng nốt với hợp âm tăng trên chính gốc' },
]
const cachCua = (cach: number) => CONG_GOC.find((c) => c.cach === cach)!

/** Các loại có tay phải là hợp âm ba dựng trên một cách cộng gốc (chỉ trong `ids` nếu có). */
export const loaiCuaCach = (cach: number, ids?: readonly string[]) =>
  CONG_THUC.filter((ct) => 'loai' in ct.tren && ct.tren.cach === cach && (!ids || ids.includes(ct.id)))

/** Cặp "gốc → gốc tay phải" của một cách cộng gốc ở các gốc `gocs` (nửa cung từ Đô) — bảng để học thuộc. */
export const capGoc = (cach: number, gocs: readonly number[]) => gocs.map((g) => `${gocDep(GOC[g]!)}→${gocTren(GOC[g]!, cach, kieuGoc(g))}`)

const notBa = (gocTen: string, iv: readonly number[], style: AccidentalStyle) => iv.map((x, k) => vn(tenTheoChu(gocTen, x, k * 2, style))).join(' – ')

/** Cái móc nói ở một gốc cụ thể: "nốt giữa của D: Rê – Fa♯ – La", "cặp thứ song song B ↔ G♯m". */
export function mocTai(cach: number, gocTen: string, style: AccidentalStyle): string {
  const x = gocDep(gocTen)
  if (cach === 4) return `nốt giữa của ${x}: ${notBa(gocTen, [0, 4, 7], style)}`
  if (cach === 3) return `nốt giữa của ${x}m: ${notBa(gocTen, [0, 3, 7], style)}`
  if (cach === 7) return `nốt trên cùng của ${x}: ${notBa(gocTen, [0, 4, 7], style)}`
  if (cach === 9) return `cặp thứ song song ${x} ↔ ${gocTren(gocTen, 9, style)}m`
  if (cach === 8) return `cùng nốt với ${x}+ — hợp âm tăng chia đều quãng tám`
  return cachCua(cach).moc
}

/** Chùm nốt rời: các nốt cách gốc bao nhiêu phím, đếm đi lên. */
const demChum = (iv: readonly number[]) => iv.map((x) => x % 12).join(' · ')

/** Công thức chung, đúng ở mọi gốc: "tay trái gốc – 5 + tay phải treo 4 trên gốc lùi 3 phím". */
export function congThucChung(ct: CongThuc): string {
  if ('iv' in ct.tren) return `tay trái ${ct.tenDuoi} + chùm nốt ${demChum(ct.tren.iv)} phím trên gốc`
  return `tay trái ${ct.tenDuoi} + tay phải ${BA[ct.tren.loai].ten} trên gốc ${cachCua(ct.tren.cach).ten}`
}

/** Dòng ngắn trên viên rơi (bên mẹo): chất tay phải · cách cộng gốc — chỉ đường, không nói thẳng tên. */
export const meoNgan = (ct: CongThuc) =>
  'iv' in ct.tren ? `+ chùm ${demChum(ct.tren.iv)} phím` : `+ ${BA[ct.tren.loai].ten} · ${cachCua(ct.tren.cach).ten}`

/**
 * Cách tìm tay phải ở MỘT gốc cụ thể, theo lối cộng gốc: "Si lùi 3 phím = Sol♯ (cặp thứ song song B ↔ G♯m) → treo 4 trên Sol♯: G♯sus4
 * (Sol♯ – Đô♯ – Rê♯)." Thay bản đếm gam trưởng (người dùng chê "quá mơ hồ và máy móc", 9/10/2026).
 */
export function cachTimTayPhai(ct: CongThuc, gocTen: string, style: AccidentalStyle): string {
  const g = vn(gocTen)
  const notPhai = tenHaiTay(ct, gocTen, style).phai
  if ('iv' in ct.tren)
    return `Tay phải là chùm nốt rời: ${g} ${ct.tren.iv.map((x, k) => `lên ${x % 12} phím = ${notPhai[k]}`).join(', ')} — bấm sát nhau ${notPhai.join(' – ')}.`
  const { cach, loai } = ct.tren
  const r = vn(gocTren(gocTen, cach, style))
  return `${g} ${cachCua(cach).ten} = ${r} (${mocTai(cach, gocTen, style)}) → ${BA[loai].ten} trên ${r}: ${tenTren(ct, gocTen, style)} (${notPhai.join(' – ')}).`
}

/** Nhắc ngắn sau khi bấm đúng: "Si lùi 3 phím → G♯sus4". */
export const nhoNgan = (ct: CongThuc, gocTen: string, style: AccidentalStyle) =>
  'iv' in ct.tren ? `chùm ${tenHaiTay(ct, gocTen, style).phai.join(' – ')}` : `${vn(gocTen)} ${cachCua(ct.tren.cach).ten} → ${tenTren(ct, gocTen, style)}`

/** Bảng cộng gốc cho một nhóm loại: mỗi cách → các loại dùng nó, gom theo chất tay phải; chùm nốt rời để riêng. */
export function bangCongGoc(ids: readonly string[]) {
  const dong = CONG_GOC.map((c) => {
    const ds = loaiCuaCach(c.cach, ids)
    const chat = [...new Set(ds.map((ct) => ('loai' in ct.tren ? ct.tren.loai : 'M')))]
    return {
      ...c,
      theoChat: chat.map((l) => ({
        chat: BA[l].ten,
        loai: ds.filter((ct) => 'loai' in ct.tren && ct.tren.loai === l).map((ct) => `${hauDep(ct.kyHieu)} (tay trái ${ct.tenDuoi})`),
      })),
    }
  }).filter((d) => d.theoChat.length > 0)
  const chum = CONG_THUC.filter((ct) => 'iv' in ct.tren && ids.includes(ct.id)).map((ct) => `${hauDep(ct.kyHieu)} = ${congThucChung(ct)}`)
  return { dong, chum }
}

/** Ví dụ gốc Đô + cái móc nhớ của từng loại — lời gia sư. */
const MEO: Readonly<Record<string, string>> = {
  maj7: 'Đô + Em — hai hợp âm ba nối đuôi (C rồi Em), chung hai nốt Mi – Sol',
  '6': 'Đô – Sol + Am — Am là cặp thứ song song của C',
  add9: 'Đô – Sol + chùm Rê – Mi – Sol — Rê kẹp sát dưới Mi',
  '69': 'Đô – Sol + Asus4 (La – Rê – Mi) — như C6 (Am) nhưng Đô lên thành Rê',
  maj9: 'C + G — chồng hợp âm bậc V lên hợp âm chủ',
  'maj9#11': 'C + Bm — màu Lydian sáng lung linh',
  m7: 'Đô + E♭ — E♭ là cặp trưởng song song của Cm',
  m6: 'Đô – Sol + Adim (La – Đô – Mi♭)',
  madd9: 'Đô – Sol + chùm Rê – Mi♭ – Sol — Rê kẹp sát dưới Mi♭',
  mMaj7: 'Đô + E♭+ (Mi♭ – Sol – Si) — nốt Si cho tiếng phim trinh thám',
  m9: 'Cm + Gm — hai hợp âm thứ cách nhau 7 phím',
  m11: 'Cm + B♭',
  m13: 'Đô – Mi♭ – Si♭ + Dm',
  m7b5: 'Đô + E♭m — như Cm7 (Đô + E♭) nhưng tay phải đổi sang thứ',
  m11b5: 'Đô – Sol♭ + E♭sus2 (Mi♭ – Fa – Si♭)',
  dim7: 'Đô + E♭dim (Mi♭ – Sol♭ – La) — bốn nốt cách đều 3 phím',
  '7': 'Đô + Edim (Mi – Sol – Si♭) — như Cmaj7 (Đô + Em) nhưng tay phải đổi sang giảm',
  '9': 'Đô – Mi + Gm — như Cm9 nhưng tay trái có Mi',
  '13': 'khung C7 (Đô – Mi – Si♭) + Am — tay phải giống C6',
  '9sus4': 'Đô + B♭ — chính là hợp âm slash B♭/C',
  '7b9': 'Đô + Edim7 — như C7 (Edim) thêm Rê♭ thành bảy giảm',
  '7b5': 'Đô + chùm Mi – Sol♭ – Si♭ — như C7 nhưng Sol hạ xuống Sol♭',
  '7b13': 'khung C7 + A♭+ (cùng nốt C+)',
  '13b9': 'khung C7 + A — như C13 (Am) nhưng Đô lên Đô♯',
  '13#11': 'khung C7 + D',
  '13b9#11': 'khung C7 + G♭m (cũng là F♯m)',
}

/** Mẹo của một loại ở bảng: công thức cộng gốc (mọi gốc) + ví dụ gốc Đô. */
export function meoCua(ct: CongThuc): string {
  return `${congThucChung(ct)} — gốc Đô: ${MEO[ct.id] ?? ''}`
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
 * Quy luật CON SỐ (đuôi tên hợp âm): số càng lớn, tay phải càng leo cao trên hợp âm. `phai` là các bậc tay phải, `cach` là cách cộng gốc
 * của từng loại; mọi loại trong `ids` có test kiểm đúng cả hai.
 */
export const LUAT_SO: readonly { so: string; luat: string; ids: readonly string[]; phai: readonly (readonly string[])[]; cach: readonly (number | null)[] }[] = [
  {
    so: '6',
    luat: 'tay phải dựng trên gốc LÙI 3 PHÍM (bậc 6 — cặp thứ song song)',
    ids: ['6', '69', 'm6'],
    phai: [['6', '1', '3'], ['6', '9', '3'], ['6', '1', '♭3']],
    cach: [9, 9, 9],
  },
  {
    so: '7',
    luat: 'tay phải dựng trên gốc LÊN 4 PHÍM (hợp âm có 3 trưởng) hay LÊN 3 PHÍM (có ♭3) — chính là 3 · 5 · 7 của hợp âm',
    ids: ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'],
    phai: [['3', '5', '7'], ['3', '5', '♭7'], ['♭3', '5', '♭7'], ['♭3', '♭5', '♭7'], ['♭3', '♭5', '𝄫7'], ['♭3', '5', '7']],
    cach: [4, 4, 3, 3, 3, 3],
  },
  { so: '9', luat: 'tay phải dựng trên gốc LÊN 7 PHÍM (bậc 5): 5 · 7 · 9', ids: ['maj9', 'm9', '9'], phai: [['5', '7', '9'], ['5', '♭7', '9'], ['5', '♭7', '9']], cach: [7, 7, 7] },
  {
    so: '11',
    luat: 'tay phải dựng trên gốc LÙI 2 PHÍM (bậc ♭7): ♭7 · 9 · 11; riêng m11♭5 khác lệ',
    ids: ['m11', '9sus4'],
    phai: [['♭7', '9', '11'], ['♭7', '9', '4']],
    cach: [10, 10],
  },
  {
    so: '13',
    luat: 'hợp âm thứ: gốc LÊN 2 PHÍM (9 · 11 · 13); hợp âm át: gốc LÙI 3 PHÍM (13 · 1 · 3 — tránh 11 chọi bậc 3)',
    ids: ['m13', '13'],
    phai: [['9', '11', '13'], ['13', '1', '3']],
    cach: [2, 9],
  },
  { so: 'add9', luat: 'chùm nốt 2 · 4 · 7 phím trên gốc — kẹp nốt 9 sát dưới bậc 3', ids: ['add9', 'madd9'], phai: [['9', '3', '5'], ['9', '♭3', '5']], cach: [null, null] },
  {
    so: 'nốt căng',
    luat: 'giữ chỗ, đổi đúng MỘT nốt hay MỘT chất của tay phải loại gốc: 13 → 13♭9 (Am → A), 7 → 7♭9 (Edim → Edim7), 7 → 7♭5 (Sol → Sol♭)',
    ids: ['13b9', '7b9', '7b5'],
    phai: [['13', '♭9', '3'], ['3', '5', '♭7', '♭9'], ['3', '♭5', '♭7']],
    cach: [9, 4, null],
  },
]

/** Mẹo vàng theo loại — mỗi câu có test. */
export const MEO_VANG: readonly string[] = [
  'Nhìn ĐUÔI tên rồi đếm phím từ gốc: 6 → lùi 3 phím; 7 → lên 4 phím (lên 3 nếu hợp âm thứ, giảm); 9 → lên 7 phím; 11 → lùi 2 phím; 13 → lên 2 phím (thứ) hay lùi 3 phím (át).',
  'Loại "7": tay phải chính là ba nốt 3 · 5 · 7 của hợp âm — chỉ cần biết chất của ba nốt ấy: maj7 → thứ, 7 → giảm, m7 → trưởng, m7♭5 → thứ, dim7 → giảm, m(maj7) → tăng.',
  'Đổi họ chỉ đổi CHẤT tay phải, không đổi chỗ: Cmaj7 = C + Em, C7 = C + Edim — cùng lên 4 phím; Cm7 = C + E♭, Cm7♭5 = C + E♭m — cùng lên 3 phím.',
  'Hợp âm 9 nào cũng có tay phải trên gốc LÊN 7 PHÍM (hợp âm bậc V): Cmaj9 → G, Cm9 và C9 → Gm.',
  'Nốt căng = đổi một nốt: C13 (Am) → C13♭9 (A, Đô thành Đô♯); C7 (Edim) → C7♭9 (Edim7, thêm Rê♭).',
  'Hợp âm tăng và bảy giảm có nhiều tên cùng nốt: A♭+ = C+ (C7♭13 = C7 + C+); Edim7 = C♯dim7 (C7♭9 = gốc + bảy giảm nửa cung trên gốc).',
]
