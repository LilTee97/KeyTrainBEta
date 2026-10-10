import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { BA, CONG_THUC, chongCongThuc, hauDep, quangTren, tenBac, type CongThuc } from './chongHopAm'

/*
  QUY LUẬT VÀ MẸO CHỒNG HỢP ÂM — THEO LOẠI HỢP ÂM. Người dùng 9/10/2026: "về các quy luật chồng hợp âm thì tôi muốn nó tính theo loại hợp
  âm (ví dụ như Maj7, 7b9, dim7, m11b5...) hơn là theo vị trí tay. Điều này dẫn tới các mẹo cũng phải tính theo loại hợp âm. Hãy phân
  tích lại và thiết kế lại quy luật và mẹo" (bản trước xếp theo vị trí tay phải — bỏ). Lời là của Claude (gia sư), rút từ 26 công thức
  chồng; mỗi quy luật có test đối chiếu công thức thật (meoChong.test.ts).

  MẸO CỘNG LOẠI — người dùng 9/10/2026 (ảnh lời giải B6/9 trong game): "Mẹo ghi như trong ảnh còn quá mơ hồ và máy móc tôi ko hiểu được …
  Tôi muốn mẹo sẽ chỉ cho tôi cụ thể theo hướng gốc nào cộng gốc nào thì sẽ ra gốc tổng cần tìm"; 10/10/2026 người dùng nói rõ chữ "gốc" ở
  đó là LOẠI (maj7, dim7, m7♭5, 13…) và chê bản Claude đã làm theo nghĩa nốt gốc (gốc tay phải lên / lùi mấy phím, commit 526a1fe): "các
  mẹo trong hình đã tính từ nốt trên tay trái hoặc phải và tôi ko muốn tìm cái đó" — rồi chọn kiểu "ghi tên cả hai tay". Nay: loại tay
  trái + loại tay phải = loại tổng; viên rơi ghi luôn tên hai tay; bảng gom theo dạng tay trái (26 công thức chỉ có 8 dạng — test).
*/

/** Ghi dấu theo gốc: Đô♯, Fa♯ ghi thăng, còn lại ghi giáng (Mi♭, La♭, Si♭) — đúng cách ghi của `GOC`. */
export const kieuGoc = (g: number): AccidentalStyle => (g === 1 || g === 6 ? 'sharp' : 'flat')

/**
 * Năm họ, mỗi họ xếp từ dễ tới khó — thứ tự học và thứ tự màn game. `chung`: điểm chung của các loại trong họ — người dùng 10/10/2026:
 * "hãy phân tích theo các loại hợp âm cùng họ để đưa ra quy tắc và mẹo khi cùng họ thì có những điểm chung gì để dễ học". Mỗi câu là số
 * đo trên chính 26 công thức (gốc Đô), có test trong meoChong.test.ts; lời và cách gom là của Claude.
 */
export const HO_LOAI: readonly { ten: string; ids: readonly string[]; chung: readonly string[] }[] = [
  {
    ten: 'Họ trưởng',
    ids: ['maj7', '6', 'add9', '69', 'maj9', 'maj9#11'],
    chung: [
      'Dấu hiệu: cả 6 loại đều chứa nguyên hợp âm C (Đô – Mi – Sol) rồi thêm màu; không loại nào có Si♭ — có 7 thì là Si.',
      'Có 7 — tay phải leo cầu thang: Cmaj7 = Đô + Em → Cmaj9 = C + G → Cmaj9♯11 = C + Bm. Bậc sau giữ hai nốt trên của bậc trước: Mi Sol Si → Sol Si Rê → Si Rê Fa♯.',
      'Không 7 — tay trái Đô – Sol, tay phải quanh La – Rê – Mi, mỗi loại đổi một nốt: C6 = Am (La Đô Mi) → C6/9 = Asus4 (Đô thành Rê) → Cadd9 = chùm Rê Mi Sol (La thành Sol).',
      'Ở gốc Đô cả họ toàn phím trắng — trừ Fa♯ của Cmaj9♯11, màu lạ duy nhất của họ.',
    ],
  },
  {
    ten: 'Họ thứ',
    ids: ['m7', 'm6', 'madd9', 'mMaj7', 'm9', 'm11', 'm13'],
    chung: [
      'Dấu hiệu: cả 7 loại đều có Đô và Mi♭ (3 thứ).',
      'Có 7 — cầu thang: Cm7 = Đô + E♭ → Cm9 = Cm + Gm → Cm11 = Cm + B♭ → Cm13 = Cm7 + Dm. Bậc sau giữ hai nốt trên của bậc trước: Mi♭ Sol Si♭ → Sol Si♭ Rê → Si♭ Rê Fa → Rê Fa La.',
      'Không 7 = họ trưởng hạ Mi xuống Mi♭: Cm6 = Adim (C6 là Am), Cm(add9) = chùm Rê Mi♭ Sol (Cadd9 là Rê Mi Sol).',
      'Cm(maj7) = Cm7 nâng Si♭ lên Si: E♭ thành E♭+ (Mi♭ Sol Si).',
    ],
  },
  {
    ten: 'Họ nửa giảm và giảm',
    ids: ['m7b5', 'm11b5', 'dim7'],
    chung: [
      'Dấu hiệu: cả 3 loại đều chứa nguyên Cdim (Đô – Mi♭ – Sol♭).',
      'Tay phải luôn đứng trên Mi♭, chỉ đổi loại: E♭m (m7♭5) · E♭sus2 (m11♭5) · E♭dim (dim7).',
      'Đi từ Cm7, mỗi bước hạ một nốt: Cm7 (E♭: Mi♭ Sol Si♭) → Cm7♭5 (E♭m: Sol thành Sol♭) → Cdim7 (E♭dim: Si♭ thành La).',
      'Bảy giảm cách đều nhau nên cả bàn phím chỉ có 3 hợp âm bảy giảm khác nhau: Cdim7 = E♭dim7 = G♭dim7 = Adim7.',
    ],
  },
  {
    ten: 'Họ át — cơ bản',
    ids: ['7', '9', '13', '9sus4'],
    chung: [
      'Dấu hiệu: cả 4 loại đều có Đô và Si♭ (♭7); 3 loại có Mi, riêng 9sus4 thay Mi bằng Fa.',
      'Cầu thang: C7 = Đô + Edim → C9 = Đô – Mi + Gm → C9sus4 = Đô + B♭ (Mi Sol Si♭ → Sol Si♭ Rê → Si♭ Rê Fa). Không leo tiếp lên Dm vì Fa chọi Mi — C13 lấy Am.',
      'Mượn tay phải của họ khác, chỉ đổi tay trái: C9 dùng Gm như Cm9 · C13 dùng Am như C6 · C9sus4 dùng B♭ như Cm11.',
      'C7 = Cmaj7 hạ Si xuống Si♭ (Em thành Edim) = Cm7 nâng Mi♭ lên Mi (E♭ thành Edim).',
    ],
  },
  {
    ten: 'Họ át — có nốt căng (♭9 · ♯11 · ♭13 · ♭5)',
    ids: ['7b9', '7b5', '7b13', '13b9', '13#11', '13b9#11'],
    chung: [
      'Dấu hiệu: cả 6 loại vẫn có Đô – Mi – Si♭ (vẫn là át), thêm nốt căng: Rê♭ (♭9), Fa♯ = Sol♭ (♭5 · ♯11), La♭ (♭13).',
      'Tay trái một nốt gốc = sửa C7 (Edim): C7♭9 thêm Rê♭ (Edim7); C7♭5 hạ Sol xuống Sol♭.',
      'Tay trái khung C7 (Đô – Mi – Si♭) = sửa C13 (Am), mỗi bước đổi một nốt: Am → A (Đô thành Đô♯) = 13♭9; A → G♭m (Mi thành Sol♭) = 13♭9♯11; G♭m → D (Rê♭ thành Rê) = 13♯11; Am → A♭+ (La thành La♭) = 7♭13.',
      'Nốt căng là nốt lệch nửa cung khỏi nốt quen (Rê♭ sát Rê, Fa♯ sát Fa, La♭ sát La) — nghe căng, đòi giải về.',
    ],
  },
]

/** Điểm chung GIỮA các họ — số đo trên 26 công thức, gốc Đô (test ở meoChong.test.ts). */
export const QUY_TAC_HO: readonly string[] = [
  'Mỗi họ có nốt dấu hiệu: họ trưởng chứa nguyên C (Đô – Mi – Sol); họ thứ có Mi♭; họ nửa giảm & giảm chứa nguyên Cdim (Đô – Mi♭ – Sol♭); họ át có Si♭ (cả 10 loại). Nhìn đuôi tên là biết họ, biết nốt nào chắc chắn có.',
  'Cầu thang 7 → 9 → 11 → 13 (họ trưởng, thứ, át): tay phải loại sau giữ hai nốt trên của tay phải loại trước — thuộc loại 7 là kéo ra cả họ.',
  'Đổi một nốt là sang loại khác, tay trái giữ nguyên — trong 26 công thức có 19 cặp như vậy, vd Mi ↔ Mi♭ (C6 ↔ Cm6, C7 ↔ Cm7), Si ↔ Si♭ (Cmaj7 ↔ C7), Sol → Sol♭ (Cm7 → Cm7♭5), Đô → Đô♯ (C13 → C13♭9).',
  'Ba tay phải dùng chung giữa các họ — chỉ tay trái khác: Gm (Cm9 · C9), Am (C6 · C13), B♭ (Cm11 · C9sus4).',
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

/* ---------------- Mẹo cộng loại ---------------- */

/** Tám dạng tay trái của 26 công thức, xếp theo số loại dùng dạng ấy (nhiều trước). Khóa là quãng (nửa cung) của thế mặc định. */
const DANG_TRAI: readonly { iv: string; ten: string }[] = [
  { iv: '0', ten: 'nốt gốc' },
  { iv: '0,4,10', ten: 'khung 7' },
  { iv: '0,7', ten: 'gốc – 5' },
  { iv: '0,4,7', ten: 'trưởng' },
  { iv: '0,3,7', ten: 'thứ' },
  { iv: '0,3,10', ten: 'khung m7' },
  { iv: '0,4', ten: 'gốc – 3' },
  { iv: '0,6', ten: 'gốc – ♭5' },
]
const khoaTrai = (ct: CongThuc) => [...ct.duoi[0]!].sort((a, b) => a - b).join()
/** Loại tay trái: "nốt gốc", "khung 7", "trưởng"… */
export const dangTrai = (ct: CongThuc) => DANG_TRAI.find((d) => d.iv === khoaTrai(ct))!.ten
/** Loại tay phải: chất hợp âm ba ("thứ", "treo 4"…), hay "chùm" khi là chùm nốt rời. */
export const loaiPhai = (ct: CongThuc) => ('iv' in ct.tren ? 'chùm' : BA[ct.tren.loai].ten)
/** Phép cộng loại của một công thức: "trưởng + thứ" (maj9♯11), "khung 7 + trưởng" (13♭9). */
export const congLoai = (ct: CongThuc) => `${dangTrai(ct)} + ${loaiPhai(ct)}`
/** Các loại khác có CÙNG phép cộng (cùng dạng tay trái, cùng loại tay phải) — chỉ tên tay phải mới phân biệt được. */
export const trungCongLoai = (ct: CongThuc) => CONG_THUC.filter((c) => c.id !== ct.id && khoaTrai(c) === khoaTrai(ct) && loaiPhai(c) === loaiPhai(ct))

/** Bảng cộng loại gom theo dạng tay trái (chỉ các loại trong `ids`): một dạng tay trái + đổi loại tay phải = nhiều loại. Ví dụ gốc Đô. */
export function bangCongLoai(ids: readonly string[]) {
  const ds = CONG_THUC.filter((ct) => ids.includes(ct.id))
  return DANG_TRAI.map((d) => {
    const nhom = ds.filter((ct) => khoaTrai(ct) === d.iv)
    return {
      dang: d.ten,
      viDu: nhom.length ? chongCongThuc(nhom[0]!, 0, 'C', 'flat').nhan.trai : '',
      theoChat: [...new Set(nhom.map(loaiPhai))].map((chat) => ({
        chat,
        loai: nhom
          .filter((ct) => loaiPhai(ct) === chat)
          .map((ct) => {
            const n = chongCongThuc(ct, 0, 'C', 'flat').nhan
            return { ten: hauDep(ct.kyHieu), viDu: `${n.trai} + ${'iv' in ct.tren ? n.phaiPhu : n.phai}` }
          }),
      })),
    }
  }).filter((d) => d.theoChat.length > 0)
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
  m9: 'Cm + Gm — hai hợp âm thứ',
  m11: 'Cm + B♭',
  m13: 'khung Cm7 (Đô – Mi♭ – Si♭) + Dm',
  m7b5: 'Đô + E♭m — như Cm7 (Đô + E♭) nhưng tay phải đổi sang thứ',
  m11b5: 'Đô – Sol♭ + E♭sus2 (Mi♭ – Fa – Si♭)',
  dim7: 'Đô + E♭dim (Mi♭ – Sol♭ – La) — bốn nốt cách đều nhau',
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

/** Mẹo của một loại ở bảng: phép cộng loại + ví dụ gốc Đô. */
export function meoCua(ct: CongThuc): string {
  return `${congLoai(ct)} — gốc Đô: ${MEO[ct.id] ?? ''}`
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
 * có test kiểm đúng các bậc ấy. (526a1fe chèn số phím vào lời — gỡ 10/10/2026, vì người dùng không muốn mẹo đếm phím.)
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
