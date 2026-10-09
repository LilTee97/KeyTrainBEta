import { BA, CONG_THUC, khungTrai, KHUNG_TRAI, type CongThuc } from './chongHopAm'

/*
  MẸO CHỒNG HỢP ÂM — người dùng 9/10/2026: "Trong vai gia sư Piano nhiều kinh nghiệm, bạn hãy phân tích những công thức và quy tắc rồi
  đưa ra các Mẹo chồng hợp âm dựa theo các gốc đã biết ở tay trái". Mẹo của Claude (gia sư), rút từ 26 công thức chồng; mỗi câu có test
  đối chiếu công thức thật (meoChong.test.ts). Cốt lõi: tay phải luôn đứng cách GỐC TAY TRÁI một số phím cố định — đếm phím (cả đen lẫn
  trắng) từ gốc là ra nốt dựng tay phải, khỏi đếm gam.
*/

/** Đếm phím từ gốc tay trái tới gốc tay phải (cả phím đen lẫn trắng): lên 2 · 3 · 4 · 7, lùi 1 · 2 · 3 · 4, cách 6. */
export function demPhim(cach: number): string {
  if (cach === 6) return 'cách 6 phím (nửa quãng tám)'
  if (cach === 7) return 'lên 7 phím (hay lùi 5)'
  return cach < 6 ? `lên ${cach} phím` : `lùi ${12 - cach} phím`
}

/** Câu móc nhớ cho từng công thức — ví dụ gốc Đô. */
const MOC: Readonly<Record<string, string>> = {
  maj7: 'Em trên Đô — hợp âm thứ bậc iii của chính giọng',
  '7': 'Edim trên Đô — chính là ba nốt trên của C7 (Mi – Sol – Si♭)',
  '7b9': 'Edim7 cùng nốt với C♯dim7 — dễ nhất: bấm bảy giảm nửa cung trên gốc',
  m7: 'E♭ trên Đô — hợp âm trưởng song song của Cm (như Am ↔ C)',
  m7b5: 'E♭m trên Đô — như m7 nhưng tay phải thứ',
  dim7: 'E♭dim trên Đô — cả hợp âm là bốn nốt cách đều 3 phím: Đô – Mi♭ – Sol♭ – La',
  mMaj7: 'E♭+ trên Đô (Mi♭ – Sol – Si) — nốt Si là bậc 7 trưởng',
  '9sus4': 'B♭ trên Đô — tiếng "sus" của pop, gospel',
  '7b5': 'chùm Mi – Sol♭ – Si♭ ngay trên gốc',
  '6': 'Am trên Đô – Sol — hợp âm thứ song song (C ↔ Am)',
  '69': 'Asus4 (La – Rê – Mi) trên Đô – Sol — có cả 6 lẫn 9',
  m6: 'Adim (La – Đô – Mi♭) trên Đô – Sol',
  add9: 'chùm Rê – Mi – Sol: nốt 9 kẹp sát dưới bậc 3',
  madd9: 'chùm Rê – Mi♭ – Sol: nốt 9 kẹp sát dưới bậc ♭3',
  m11b5: 'E♭sus2 (Mi♭ – Fa – Si♭) trên Đô – Sol♭',
  maj9: 'G trên C — chồng hợp âm bậc V lên hợp âm chủ',
  'maj9#11': 'Bm trên C — 7 · 9 · ♯11 sáng lung linh',
  m9: 'Gm trên Cm — hợp âm bậc v',
  m11: 'B♭ trên Cm — giống 9sus4 nhưng tay trái là Cm',
  '9': 'Gm trên Đô – Mi — tay trái chỉ gốc và bậc 3',
  '13': 'Am trên C7 — như C6 nhưng có ♭7',
  '13b9': 'A trên C7 — cùng chỗ với C13 nhưng TRƯỞNG: Đô thành Đô♯ là thêm ♭9',
  '13#11': 'D trên C7 — hợp âm trưởng bậc II',
  m13: 'Dm trên Cm7 (Đô – Mi♭ – Si♭)',
  '7b13': 'A♭+ cùng nốt với C+ — bấm hợp âm tăng của chính gốc',
  '13b9#11': 'G♭m (cũng là F♯m) trên C7 — nửa quãng tám, lên hay lùi đều 6 phím',
}

/** Mẹo của một công thức: đếm phím · chất tay phải · câu móc (gốc Đô). */
export function meoCua(ct: CongThuc): string {
  const moc = MOC[ct.id] ?? ''
  if ('iv' in ct.tren) return moc
  return `${demPhim(ct.tren.cach)} · hợp âm ${BA[ct.tren.loai].ten} — ${moc}`
}

/** Mẹo theo khung tay trái đã biết — mỗi nhóm: các công thức dùng khung ấy, xếp theo số phím phải đếm. */
export function meoTheoKhung() {
  return (Object.keys(KHUNG_TRAI) as (keyof typeof KHUNG_TRAI)[]).map((k) => ({
    khung: k,
    ten: KHUNG_TRAI[k].ten,
    ds: CONG_THUC.filter((c) => khungTrai(c) === k)
      .slice()
      .sort((a, b) => ('iv' in a.tren ? 99 : a.tren.cach) - ('iv' in b.tren ? 99 : b.tren.cach))
      .map((ct) => ({ ct, meo: meoCua(ct) })),
  }))
}

/** Bảy mẹo vàng của gia sư — mỗi câu có test kiểm trên công thức thật. */
export const MEO_VANG: readonly string[] = [
  'Đếm phím từ gốc tay trái, đếm cả phím đen: tay phải luôn đứng cách gốc một số phím cố định — khỏi đếm gam.',
  'Lùi 3 phím là bậc 6 = hợp âm THỨ SONG SONG (C ↔ Am): đặt Am lên Đô – Sol là C6, lên khung C7 là C13.',
  'Lên 3 phím là bậc ♭3: hợp âm thứ nào cũng có hợp âm trưởng song song ở đó (Cm ↔ E♭) — đặt E♭ lên gốc là Cm7.',
  'Cùng một chỗ, tay phải THỨ cho màu êm, TRƯỞNG cho màu căng: C7 + Am = C13, C7 + A = C13♭9.',
  'Lên 7 phím là hợp âm bậc V: trên hợp âm trưởng bấm V trưởng (Cmaj9 = C + G); trên hợp âm thứ hay gốc – 3 bấm v thứ (Cm9 = Cm + Gm, C9 = Đô – Mi + Gm).',
  'Lùi 2 phím là hợp âm ♭VII trưởng: trên Cm là Cm11, trên gốc đơn là C9sus4.',
  'Hợp âm tăng và bảy giảm có nhiều tên cùng nốt: A♭+ = C+, nên C7♭13 = C7 + hợp âm tăng của chính gốc; Edim7 = C♯dim7, nên C7♭9 = gốc + bảy giảm nửa cung trên gốc.',
]
