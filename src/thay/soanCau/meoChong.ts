import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { BA, CONG_THUC, chongCongThuc, chongTuDo, hauDep, quangTren, tenBac, type CongThuc } from './chongHopAm'

/*
  QUY LUẬT VÀ MẸO CHỒNG HỢP ÂM. Lời là của Claude (gia sư), rút từ 26 công thức chồng; mỗi câu có test đối chiếu công thức thật
  (meoChong.test.ts). Lịch sử theo lời người dùng:
  - 9/10/2026: "tôi muốn nó tính theo loại hợp âm (ví dụ như Maj7, 7b9, dim7, m11b5...) hơn là theo vị trí tay" — bỏ bản theo vị trí tay.
  - 9–10/10/2026 MẸO CỘNG LOẠI: "gốc nào cộng gốc nào thì sẽ ra gốc tổng" (chữ "gốc" ở đó là LOẠI); chê mẹo đếm phím "tính từ nốt trên tay
    trái hoặc phải" (commit 526a1fe), chọn kiểu "ghi tên cả hai tay": loại tay trái + loại tay phải = loại tổng.
  - 10/10/2026 THEO ĐUÔI: "sao bạn ko chia theo kiểu Maj7 là một loại, Add9 là một loại, rồi dim rồi sus rồi 7b5 ... Sau đó thì hãy chia
    công thức và quy tắc theo kiểu làm sao để chồng ra Maj7, hoặc dim7, hoặc Trưởng, hoặc 13". Bản chia theo họ (trưởng · thứ · giảm · át —
    commit 3a354b7) bỏ khỏi bảng, cùng quy luật con số và mẹo vàng (đã gộp vào các nhóm đuôi). Nay 16 nhóm đuôi gồm 26 công thức chồng và
    6 hợp âm ba cơ bản (trưởng · thứ · giảm · tăng · sus2 · sus4).
*/

/** Ghi dấu theo gốc: Đô♯, Fa♯ ghi thăng, còn lại ghi giáng (Mi♭, La♭, Si♭) — đúng cách ghi của `GOC`. */
export const kieuGoc = (g: number): AccidentalStyle => (g === 1 || g === 6 ? 'sharp' : 'flat')

/** Năm họ — nay chỉ để chia màn game (bảng đã chia theo đuôi từ 10/10/2026). */
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

/* ---------------- Theo đuôi — muốn chồng ra loại nào ---------------- */

export interface NhomDuoi {
  ten: string
  /** Các đuôi trong nhóm, ghi như tên hợp âm. */
  duoi: string
  /** Nốt đuôi mang lại (gốc Đô) — đọc đuôi là biết nốt phải có. */
  dauHieu: string
  /** Cách chồng ra các loại trong nhóm. */
  cach: string
  /** Điểm chung, họ hàng đổi một nốt. */
  chung: string
  /** Công thức chồng (`CONG_THUC.id`) hay hợp âm ba cơ bản (`q:<id loại của app>`). */
  ids: readonly string[]
  /** Lớp cao độ (gốc Đô) mọi hợp âm trong nhóm phải có / không được có / phải có ít nhất một — test đối chiếu `dauHieu`. */
  co: readonly number[]
  khong: readonly number[]
  coMot?: readonly number[]
}

/** 16 nhóm đuôi, từ dễ tới khó; mỗi hợp âm nằm ở đúng một nhóm (theo phần đuôi nổi nhất của tên). */
export const NHOM_DUOI: readonly NhomDuoi[] = [
  {
    ten: 'Trưởng',
    duoi: 'C (không đuôi)',
    dauHieu: 'Đô – Mi – Sol',
    cach: 'Một tay bấm đủ C; hai tay thì tay trái Đô, tay phải C.',
    chung: 'Đổi một nốt ra các hợp âm ba khác: Mi thành Mi♭ = Cm · Sol thành Sol♯ = Caug · Mi thành Fa = Csus4 · Mi thành Rê = Csus2.',
    ids: ['q:maj'],
    co: [0, 4, 7],
    khong: [3],
  },
  {
    ten: 'Thứ',
    duoi: 'm',
    dauHieu: 'Mi♭ thay Mi (Đô – Mi♭ – Sol)',
    cach: 'Tay trái Đô, tay phải Cm.',
    chung: 'Hạ tiếp Sol xuống Sol♭ là ra Cdim.',
    ids: ['q:min'],
    co: [0, 3, 7],
    khong: [4],
  },
  {
    ten: 'Treo',
    duoi: 'sus2 · sus4 · 9sus4',
    dauHieu: 'không có Mi — sus2 thay bằng Rê, sus4 thay bằng Fa',
    cach: 'sus2, sus4 một tay bấm đủ (Đô Rê Sol · Đô Fa Sol); C9sus4: tay trái Đô, tay phải B♭ (Si♭ Rê Fa) — chính là hợp âm slash B♭/C.',
    chung: 'Không có Mi nên nghe lơ lửng, chưa trưởng chưa thứ.',
    ids: ['q:sus2', 'q:sus4', '9sus4'],
    co: [0],
    khong: [3, 4],
    coMot: [2, 5],
  },
  {
    ten: 'Giảm',
    duoi: 'dim · m7♭5 · dim7 · m11♭5',
    dauHieu: 'Mi♭ + Sol♭ (không có Mi, không có Sol)',
    cach: 'Cdim một tay bấm đủ (Đô Mi♭ Sol♭); còn lại tay trái Đô, tay phải đứng trên Mi♭, chỉ đổi loại: E♭m (m7♭5) · E♭dim (dim7) · E♭sus2 (m11♭5 — tay trái thêm Sol♭).',
    chung: 'Từ Cm7 (Đô + E♭) hạ Sol xuống Sol♭ = Cm7♭5, hạ tiếp Si♭ xuống La = Cdim7. Bảy giảm cách đều nhau nên cả bàn phím chỉ có 3 cái: Cdim7 = E♭dim7 = G♭dim7 = Adim7.',
    ids: ['q:dim', 'm7b5', 'dim7', 'm11b5'],
    co: [3, 6],
    khong: [4, 7],
  },
  {
    ten: 'Tăng',
    duoi: 'aug (+)',
    dauHieu: 'Sol♯ thay Sol (Đô – Mi – Sol♯, cũng viết La♭)',
    cach: 'Một tay bấm đủ Caug; hai tay thì tay trái Đô, tay phải Caug.',
    chung: 'Hợp âm tăng chia đều nên Caug = Eaug = A♭aug — gặp lại ở C7♭13 (tay phải A♭+) và Cm(maj7) (tay phải E♭+).',
    ids: ['q:aug'],
    co: [4, 8],
    khong: [7],
  },
  {
    ten: '6',
    duoi: '6 · m6 · 6/9',
    dauHieu: 'La, không có 7',
    cach: 'Tay trái Đô – Sol; tay phải dựng trên La: Am (C6) · Adim (Cm6 — Mi thành Mi♭) · Asus4 (C6/9 — Đô thành Rê).',
    chung: 'C6 và C13 cùng tay phải Am — C13 chỉ thêm khung 7 ở tay trái.',
    ids: ['6', 'm6', '69'],
    co: [9],
    khong: [10, 11],
  },
  {
    ten: 'add9',
    duoi: 'add9 · m(add9)',
    dauHieu: 'Rê, không có 7',
    cach: 'Tay trái Đô – Sol; tay phải chùm nốt, Rê kẹp sát dưới Mi: Rê – Mi – Sol (Cadd9) · Rê – Mi♭ – Sol (Cm(add9)).',
    chung: 'Cadd9 và C6/9 chung Rê – Mi: đổi Sol thành La là sang C6/9.',
    ids: ['add9', 'madd9'],
    co: [2],
    khong: [9, 10, 11],
  },
  {
    ten: '7',
    duoi: '7 · m7',
    dauHieu: 'Si♭ (7 không ghi "maj" là Si♭)',
    cach: 'Tay trái Đô; tay phải dựng trên nốt 3: Edim (Mi Sol Si♭) cho C7 · E♭ (Mi♭ Sol Si♭) cho Cm7 — hai cái chỉ khác Mi / Mi♭.',
    chung: 'C7 = Cmaj7 hạ Si xuống Si♭ (Em thành Edim).',
    ids: ['7', 'm7'],
    co: [10],
    khong: [2, 9, 11],
  },
  {
    ten: 'maj7',
    duoi: 'maj7 · m(maj7)',
    dauHieu: 'Si (sát dưới Đô)',
    cach: 'Tay trái Đô; tay phải dựng trên nốt 3, mang Si lên trên: Em (Mi Sol Si) cho Cmaj7 · E♭+ (Mi♭ Sol Si) cho Cm(maj7).',
    chung: 'Cmaj7 → C7: Si thành Si♭; Cmaj7 → Cm(maj7): Mi thành Mi♭.',
    ids: ['maj7', 'mMaj7'],
    co: [11],
    khong: [2, 10],
  },
  {
    ten: '9',
    duoi: '9 · m9 · maj9',
    dauHieu: 'Rê cùng với 7 (Si hay Si♭)',
    cach: 'Tay phải dựng trên Sol: G (Sol Si Rê) cho Cmaj9 · Gm (Sol Si♭ Rê) cho C9 và Cm9; tay trái giữ nốt 3: C (Cmaj9) · Đô – Mi (C9) · Cm (Cm9).',
    chung: 'C9 và Cm9 cùng tay phải Gm, chỉ khác tay trái Mi hay Mi♭.',
    ids: ['maj9', '9', 'm9'],
    co: [2],
    khong: [5, 9],
    coMot: [10, 11],
  },
  {
    ten: '11',
    duoi: 'm11',
    dauHieu: 'Fa cùng với 7',
    cach: 'Tay trái Cm, tay phải B♭ (Si♭ Rê Fa).',
    chung: 'C9sus4 (nhóm treo) cùng tay phải B♭ nhưng tay trái chỉ Đô — hợp âm có Mi tránh Fa vì Fa chọi Mi. Cm11♭5 ở nhóm giảm.',
    ids: ['m11'],
    co: [5, 10],
    khong: [],
  },
  {
    ten: '13',
    duoi: '13 · m13',
    dauHieu: 'La cùng với 7',
    cach: 'Tay trái khung 7: Đô – Mi – Si♭ (C13) · Đô – Mi♭ – Si♭ (Cm13); tay phải hợp âm có La: Am (C13) · Dm (Cm13).',
    chung: 'C13 = C6 thêm khung 7 (cùng tay phải Am). C13 lấy Am chứ không lấy Dm vì Fa chọi Mi.',
    ids: ['13', 'm13'],
    co: [9, 10],
    khong: [],
  },
  {
    ten: '7♭5',
    duoi: '7♭5',
    dauHieu: 'Sol♭ thay Sol, có Si♭',
    cach: 'Tay trái Đô; tay phải chùm Mi – Sol♭ – Si♭ — chính là C7 (Edim) hạ Sol xuống Sol♭.',
    chung: 'Cm7♭5 (nhóm giảm) cũng có ♭5: Đô + E♭m.',
    ids: ['7b5'],
    co: [6, 10],
    khong: [7],
  },
  {
    ten: '♭9',
    duoi: '7♭9 · 13♭9 · 13♭9♯11',
    dauHieu: 'Rê♭ (= Đô♯)',
    cach: 'Lấy loại gốc, đổi đúng một nốt: C7 (Edim) thêm Rê♭ = Edim7 → C7♭9; C13 (Am) Đô thành Đô♯ = A → C13♭9; từ A đổi Mi thành Sol♭ = G♭m → C13♭9♯11.',
    chung: 'Nốt căng lệch nửa cung khỏi nốt quen (Rê♭ sát Rê) — nghe căng, đòi giải về.',
    ids: ['7b9', '13b9', '13b9#11'],
    co: [1],
    khong: [],
  },
  {
    ten: '♯11',
    duoi: 'maj9♯11 · 13♯11',
    dauHieu: 'Fa♯ (= Sol♭)',
    cach: 'Cmaj9♯11: từ Cmaj9 (C + G) đổi Sol thành Fa♯ → tay phải Bm (Si Rê Fa♯). C13♯11: tay trái khung C7, tay phải D (Rê Fa♯ La).',
    chung: 'C13♭9♯11 (nhóm ♭9) có cả Rê♭ lẫn Fa♯.',
    ids: ['maj9#11', '13#11'],
    co: [6],
    khong: [],
  },
  {
    ten: '♭13',
    duoi: '7♭13',
    dauHieu: 'La♭, có Si♭',
    cach: 'Tay trái khung C7; tay phải A♭+ (La♭ Đô Mi) — C13 (Am) hạ La xuống La♭.',
    chung: 'A♭+ cùng nốt Caug (nhóm tăng).',
    ids: ['7b13'],
    co: [8, 10],
    khong: [],
  },
]

/** Quy tắc chung giữa các đuôi — số đo trên 26 công thức, gốc Đô (test ở meoChong.test.ts). */
export const QUY_TAC_DUOI: readonly string[] = [
  'Đọc đuôi là biết nốt phải có: m → Mi♭ · dim → Mi♭ + Sol♭ · aug → Sol♯ · sus → bỏ Mi · 6 → La · add9 → Rê · 7 → Si♭ · maj7 → Si · 9 → Rê · 11 → Fa · 13 → La · ♭5 → Sol♭ · ♭9 → Rê♭ · ♯11 → Fa♯ · ♭13 → La♭. Tay phải gom các nốt ấy thành một hợp âm ba.',
  'Cầu thang 7 → 9 → 11 → 13: tay phải loại sau giữ hai nốt trên của tay phải loại trước — Em → G → Bm (maj7 → maj9 → maj9♯11), E♭ → Gm → B♭ → Dm (m7 → m9 → m11 → m13), Edim → Gm → B♭ (7 → 9 → 9sus4).',
  'Đổi một nốt là sang loại khác, tay trái giữ nguyên — trong 26 công thức có 19 cặp như vậy, vd Mi ↔ Mi♭ (C6 ↔ Cm6, C7 ↔ Cm7), Si ↔ Si♭ (Cmaj7 ↔ C7), Sol → Sol♭ (Cm7 → Cm7♭5), Đô → Đô♯ (C13 → C13♭9).',
  'Ba tay phải dùng chung giữa các đuôi — chỉ tay trái khác: Am (C6 · C13), Gm (Cm9 · C9), B♭ (Cm11 · C9sus4).',
]

/** Gợi nhớ ngắn từng công thức (tiếng nghe, quan hệ quen) — hiện dưới dòng công thức ở bảng theo đuôi. */
const GOI_NHO: Readonly<Record<string, string>> = {
  maj7: 'hai hợp âm ba nối đuôi (C rồi Em), chung Mi – Sol',
  '6': 'Am là cặp thứ song song của C',
  add9: 'Rê kẹp sát dưới Mi',
  '69': 'như C6 nhưng Đô lên thành Rê',
  maj9: 'chồng hợp âm bậc V lên hợp âm chủ',
  'maj9#11': 'màu Lydian sáng lung linh',
  m7: 'E♭ là cặp trưởng song song của Cm',
  madd9: 'Rê kẹp sát dưới Mi♭',
  mMaj7: 'nốt Si cho tiếng phim trinh thám',
  m7b5: 'như Cm7 nhưng tay phải đổi sang thứ',
  dim7: 'bốn nốt cách đều nhau',
  '7': 'như Cmaj7 nhưng tay phải đổi sang giảm',
  '9': 'như Cm9 nhưng tay trái có Mi',
  '13': 'tay phải giống C6',
  '9sus4': 'chính là hợp âm slash B♭/C',
  '7b9': 'như C7 thêm Rê♭',
  '7b5': 'như C7 nhưng Sol hạ xuống Sol♭',
  '7b13': 'A♭+ cùng nốt C+',
  '13b9': 'như C13 nhưng Đô lên Đô♯',
  '13b9#11': 'G♭m cũng là F♯m',
}

/** Bảng theo đuôi (gốc Đô): mỗi nhóm kèm từng hợp âm — tên, tay trái, tay phải (tên + nốt), gợi nhớ. Chùm nốt rời gọi bằng các nốt. */
export function bangTheoDuoi() {
  return NHOM_DUOI.map((n) => ({
    ...n,
    dong: n.ids.map((id) => {
      if (id.startsWith('q:')) {
        const c = chongTuDo(0, id.slice(2), 'flat')!
        return { id, tong: c.nhan.tong, trai: c.nhan.trai, phai: c.nhan.phai, phaiPhu: c.nhan.phaiPhu, goiNho: '' }
      }
      const ct = CONG_THUC.find((c) => c.id === id)!
      const c = chongCongThuc(ct, 0, 'C', 'flat')
      const chum = 'iv' in ct.tren
      return { id, tong: c.nhan.tong, trai: c.nhan.trai, phai: chum ? c.nhan.phaiPhu : c.nhan.phai, phaiPhu: chum ? 'chùm nốt rời' : c.nhan.phaiPhu, goiNho: GOI_NHO[id] ?? '' }
    }),
  }))
}

/** Các nhóm đuôi có mặt trong một bộ công thức (màn game) — dòng ngắn cho bảng mẹo. */
export const duoiCua = (ids: readonly string[]) => NHOM_DUOI.filter((n) => n.ids.some((id) => ids.includes(id))).map((n) => `${n.ten} (${n.duoi}): ${n.dauHieu} — ${n.cach}`)
