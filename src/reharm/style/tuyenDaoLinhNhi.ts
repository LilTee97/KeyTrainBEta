import type { PitchClass } from '../../shared/musicTheory/types'

/**
 * TUYẾN GIAI ĐIỆU ĐOẠN DẠO — bảy câu dạo Linh Nhi, chép theo TỪNG Ô.
 *
 * Bảng sinh bằng script từ bản ký âm, không gõ tay dòng nào.
 *
 * ## Giai điệu là NỐT TRÊN CÙNG mỗi mốc gõ
 *
 * Có lúc đã thử giữ hết mọi nốt của khuông tay phải cho "chính xác hơn". Sai: ô 1 Đừng
 * Xa gõ `A4+D5+E5+F5` rồi `D4+E5+F5` — đó là **nắm hợp âm tay phải**, không phải giai
 * điệu, và giữ hết thì một ô phình lên **20 nốt** trong khi bản ký âm chỉ có 8 mốc gõ.
 * Phần dưới nắm ấy trùng việc với phần đệm đã dựng sẵn.
 *
 * Bảng giữ nốt cao nhất mỗi mốc, ra 40-70 nốt mỗi câu, đúng mật độ 5-9 nốt một ô, kèm
 * **độ ngân thật** của từng nốt.
 *
 * ## Ô CHIA ĐÔI ghi cả hai bậc
 *
 * Đo bảy đoạn dạo: **6/59 ô có hai hợp âm khác nhau**. Ghi mỗi ô một bậc là mất đúng
 * hợp âm quyết định hướng câu — Đừng Xa ô 7 vào bảng thành `II` (E) trong khi nửa sau
 * là `V` (A). Biển Tình ô 8 còn lệch cả chức năng: `chu` (F#m) trong khi nửa sau là
 * `ha` (E). Nên mỗi ô có thêm `bac2` và `chia`.
 *
 * | bài | ô | chia ở phách | hai hợp âm |
 * |---|---|---|---|
 * | Biển Tình | 8/9 | 2,0 | F#m → E |
 * | Đừng Xa | 7/9 | 2,0 | E → A |
 * | Lá Thư | 2/6 | 3,0 | C → Dm |
 * | Lá Thư | 5/6 | 3,0 | Bb → E |
 * | Mùa Xuân | 4/8 | 2,0 | D → Am |
 * | Rừng Lá | 3/9 | 1,0 | G → Dm |
 *
 * ## Giọng phải đọc bằng cách đếm cả bài
 *
 * Biển Tình ĐÃ TỪNG bị đọc nhầm là Si thứ vì đoạn dạo mở trên `Bm`. Đếm cả bài thì
 * `D=19` nhiều nhất, `Bm=13`, `F#m=13`, `A=12`, bài đóng trên `D`, và vòng
 * `D-Bm-F#m-Em-A-D` là **I-vi-iii-ii-V-I**. Rê TRƯỞNG; đoạn dạo chỉ mở trên bậc vi.
 * Đừng đọc giọng bằng hợp âm đầu đoạn dạo.
 *
 * ## Điệu: 5 bolero, 2 slow rock — CỐ Ý dùng chung
 *
 * Lá Thư Trần Thế và Một Cõi Đi Về là slow rock. Người dùng chốt: *"tạm thời vẫn giữ
 * chung slow rock và bolero cho đến khi nào đủ lượng sheet bolero thứ trong kho."*
 * Đo được: bài giọng thứ lấy **26%** ô từ Lá Thư (n=480 ô), bài giọng trưởng 0%.
 * Trường `dieu` để sẵn cho lúc tách.
 *
 * ## MỘT CÕI ĐI VỀ Ở NHỊP 3 PHÁCH
 *
 * Sáu bài kia 4 phách một ô, riêng Một Cõi 3 phách. Ô của nó chỉ ghép vào bài cùng
 * nhịp — trường lọc là `phach`.
 */

/** Một ô nhịp của một câu dạo có thật. */
export type ODao = {
  /** Bậc gốc hợp âm ĐẦU ô so với chủ âm, 0-11. `null` = ô lấy đà, chưa có hợp âm. */
  bac: number | null
  /** `'m'` thứ · `'7'` át · `''` trưởng. */
  chat: string
  /** Bậc hợp âm thứ hai trong ô, `null` khi ô không chia. */
  bac2: number | null
  /** Phách mà hợp âm thứ hai vào, `null` khi ô không chia. */
  chia: number | null
  /** `[phách trong ô, nửa cung so với chủ âm ở MIDI 60+chủ âm, số phách ngân]` */
  n: readonly (readonly [number, number, number])[]
}

export type TuyenDao = {
  id: string
  ten: string
  thu: boolean
  giong: string
  /** Điệu của bản gốc. Chưa dùng để lọc — xem chú thích đầu file. */
  dieu: string
  /** Bậc chủ âm BẢN GỐC — giữ tuyến ở đúng tầm bản ký âm khi chuyển giọng. */
  chuGoc: PitchClass
  /** Số phách một ô của bản gốc. Chỉ ghép vào bài cùng số phách. */
  phach: number
  o: readonly ODao[]
}

export const TUYEN_DAO: readonly TuyenDao[] = [

  /* Biển Tình · Rê trưởng · bolero · 9 ô · 51 nốt · 1 ô chia đôi */
  {
    id: 'bien-tinh',
    ten: 'Biển Tình',
    thu: false,
    giong: 'Rê trưởng',
    dieu: 'bolero',
    chuGoc: 2,
    phach: 4,
    o: [
      { bac: null, chat: '', bac2: null, chia: null, n: [
        [2.5, 12, 0.5], [3, 16, 0.5], [3.5, 19, 0.5],
      ] },
      { bac: 9, chat: 'm', bac2: null, chia: null, n: [
        [0, 21, 1], [1, 19, 0.5], [1.5, 21, 0.5], [2.5, 12, 0.5], [3, 16, 0.5],
        [3.5, 21, 0.5],
      ] },
      { bac: 4, chat: 'm', bac2: null, chia: null, n: [
        [0, 19, 1], [1, 16, 0.5], [1.5, 19, 0.5], [2.5, 9, 0.5], [3, 12, 0.5],
        [3.5, 16, 0.5],
      ] },
      { bac: 2, chat: 'm', bac2: null, chia: null, n: [
        [0, 14, 1.5], [1.5, 12, 0.5], [2, 14, 0.5], [2.5, 21, 0.5], [3, 19, 0.25],
        [3.25, 16, 0.25], [3.5, 14, 0.5],
      ] },
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 16, 2], [2.5, 7, 0.5], [3, 9, 0.5], [3.5, 12, 0.5],
      ] },
      { bac: 9, chat: 'm', bac2: null, chia: null, n: [
        [0, 16, 1], [1, 19, 0.5], [1.5, 16, 0.5], [2.5, 7, 0.5], [3, 9, 0.5],
        [3.5, 16, 0.5],
      ] },
      { bac: 2, chat: 'm', bac2: null, chia: null, n: [
        [0, 14, 1], [1, 12, 0.5], [1.5, 14, 0.5], [2.5, 16, 0.5], [3, 14, 0.25],
        [3.25, 12, 0.25], [3.5, 9, 0.5],
      ] },
      { bac: 4, chat: 'm', bac2: 2, chia: 2, n: [
        [0, 7, 0.5], [0.5, 4, 0.5], [1, 7, 0.5], [1.5, 9, 0.5], [2, 14, 0.5],
        [2.5, 16, 0.5], [3, 14, 0.25], [3.25, 12, 0.25], [3.5, 9, 0.5],
      ] },
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 12, 2], [3, 12, 0.5], [3.5, 14, 0.5],
      ] },
    ],
  },
  /* Đừng Xa Em Đêm Nay · Rê thứ · bolero · 9 ô · 54 nốt · 1 ô chia đôi */
  {
    id: 'dung-xa',
    ten: 'Đừng Xa Em Đêm Nay',
    thu: true,
    giong: 'Rê thứ',
    dieu: 'bolero',
    chuGoc: 2,
    phach: 4,
    o: [
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 15, 0.75], [0.75, 15, 0.25], [1, 3, 0.5], [1.5, 15, 0.5], [2, 15, 0.5],
        [2.5, 0, 0.25], [2.75, 17, 0.75], [3.5, 19, 0.5],
      ] },
      { bac: 10, chat: '', bac2: null, chia: null, n: [
        [0, 14, 0.75], [0.75, 10, 0.25], [1, 2, 0.5], [1.5, 12, 0.25], [1.75, 13, 0.25],
        [2, 14, 1.5], [3.75, 8, 0.25],
      ] },
      { bac: 8, chat: '', bac2: null, chia: null, n: [
        [0, 12, 0.75], [0.75, 12, 0.25], [1, 0, 0.5], [1.5, 12, 0.5], [2, 12, 0.75],
        [2.75, 14, 0.75], [3.5, 15, 0.5],
      ] },
      { bac: 3, chat: '', bac2: null, chia: null, n: [
        [0, 10, 0.75], [0.75, 8, 0.75], [1.5, 7, 0.25], [1.75, 8, 0.25], [2, 10, 1.5],
        [3.5, 5, 0.25], [3.75, 7, 0.25],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, 8, 0.75], [0.75, 8, 0.75], [1.5, 8, 0.5], [2, 8, 0.75], [2.75, 7, 0.75],
        [3.5, 8, 0.25], [3.75, 7, 0.25],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 15, 0.75], [0.75, 14, 0.75], [1.5, 12, 0.5], [2, 7, 1.5], [3.5, 14, 0.25],
        [3.75, 15, 0.25],
      ] },
      { bac: 2, chat: '', bac2: 7, chia: 2, n: [
        [0, 14, 0.75], [0.75, 14, 0.25], [1, 0, 0.5], [1.5, 12, 0.5], [2, 11, 0.75],
        [2.75, 9, 0.75], [3.5, 11, 0.25], [3.75, 3, 0.25],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 12, 1], [1, 0, 0.5], [2.5, 0, 0.25],
      ] },
      { bac: 7, chat: '', bac2: null, chia: null, n: [
        [0, -1, 3],
      ] },
    ],
  },
  /* Lá Thư Trần Thế · Rê thứ · slow rock · 6 ô · 46 nốt · 2 ô chia đôi */
  {
    id: 'la-thu',
    ten: 'Lá Thư Trần Thế',
    thu: true,
    giong: 'Rê thứ',
    dieu: 'slow rock',
    chuGoc: 2,
    phach: 4,
    o: [
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0.5, 19, 0.25], [0.75, 15, 0.25], [1, 24, 0.5], [1.5, 7, 0.5], [2, 14, 0.5],
        [2.5, 19, 0.5], [3, 19, 0.5], [3.5, 24, 0.5],
      ] },
      { bac: 10, chat: '', bac2: 0, chia: 3, n: [
        [0, 26, 0.5], [0.5, 5, 0.25], [0.75, 5, 0.25], [1, 12, 0.5], [1.5, 14, 0.5],
        [2, 22, 0.5], [2.5, 26, 0.5], [3, 24, 0.5], [3.5, 7, 0.5],
      ] },
      { bac: 3, chat: '', bac2: null, chia: null, n: [
        [0, 14, 0.5], [0.5, 15, 0.5], [1, 19, 0.5], [1.5, 17, 0.5], [2, 19, 1],
        [3, 3, 0.5], [3.5, 5, 0.5],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, 15, 0.5], [0.5, 19, 0.5], [1, 17, 1], [2, 7, 0.5], [2.5, 8, 0.5],
        [3, 12, 0.5], [3.5, 17, 0.5],
      ] },
      { bac: 8, chat: '', bac2: 2, chia: 3, n: [
        [0, 15, 1], [1, 3, 0.5], [1.5, 8, 0.5], [2, 12, 0.5], [2.5, 15, 0.5],
        [3, 14, 1],
      ] },
      { bac: 7, chat: '7', bac2: null, chia: null, n: [
        [0, 14, 0.5], [0.5, 14, 0.5], [1, 15, 0.5], [1.5, 17, 0.5], [2, 19, 0.5],
        [2.5, 19, 0.25], [2.75, 19, 0.25], [3, 19, 0.25], [3.5, 19, 0.5],
      ] },
    ],
  },
  /* Một Cõi Đi Về · Sol thứ · slow rock · 10 ô · 65 nốt · 0 ô chia đôi */
  {
    id: 'mot-coi',
    ten: 'Một Cõi Đi Về',
    thu: true,
    giong: 'Sol thứ',
    dieu: 'slow rock',
    chuGoc: 7,
    phach: 3,
    o: [
      { bac: null, chat: '', bac2: null, chia: null, n: [
        [0, 15, 0.375], [0.375, 3, 0.25], [0.625, 15, 0.375], [1, 7, 0.375], [1.375, -5, 0.25],
        [1.625, 0, 0.375], [2, 3, 0.375], [2.375, 3, 0.25], [2.625, 3, 0.375],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 5, 0.375], [0.375, 3, 1], [1.5, 12, 0.5], [2, 12, 0.5], [2.5, 12, 0.5],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 15, 1], [1, -4, 0.5], [1.5, 2, 0.25], [1.75, 3, 0.25], [2, 2, 0.25],
        [2.25, 0, 0.25], [2.5, -1, 0.25], [2.75, -4, 0.25],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, -4, 0.5], [0.5, -5, 0.125], [0.625, -5, 0.125], [0.75, 11, 0.25], [1, 14, 0.25],
        [1.25, 5, 0.25], [1.5, 7, 0.25], [1.75, 11, 0.25], [2, 14, 0.25], [2.25, 11, 0.25],
        [2.5, 17, 0.125], [2.625, 14, 0.375],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, 15, 0.5], [0.5, 11, 0.5], [1, 3, 0.5], [1.5, 14, 0.5], [2, 7, 0.5],
        [2.5, 3, 0.5],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, 12, 0.5], [0.5, 3, 0.5], [1, 0, 0.5], [1.5, 10, 0.5], [2, 3, 0.5],
        [2.5, 12, 0.5],
      ] },
      { bac: 5, chat: 'm', bac2: null, chia: null, n: [
        [0, 8, 0.5], [0.5, 0, 0.5], [1, -4, 0.5], [1.5, 7, 0.5], [2, 0, 0.5],
        [2.5, -4, 0.5],
      ] },
      { bac: 7, chat: '7', bac2: null, chia: null, n: [
        [0, 5, 0.5], [0.5, 12, 1], [1.5, 6, 0.5], [2, 0, 0.5], [2.5, -4, 0.5],
      ] },
      { bac: 7, chat: '7', bac2: null, chia: null, n: [
        [0, 7, 1], [1, -5, 0.375], [1.375, -1, 0.5], [2, 2, 0.5], [2.5, 5, 0.5],
      ] },
      { bac: 7, chat: '7', bac2: null, chia: null, n: [
        [0, 7, 0.125], [0.125, 11, 0.125], [0.25, 31, 2],
      ] },
    ],
  },
  /* Đường Xưa Lối Cũ · Đô trưởng · bolero · 8 ô · 40 nốt · 0 ô chia đôi */
  {
    id: 'duong-xua',
    ten: 'Đường Xưa Lối Cũ',
    thu: false,
    giong: 'Đô trưởng',
    dieu: 'bolero',
    chuGoc: 0,
    phach: 4,
    o: [
      { bac: null, chat: '', bac2: null, chia: null, n: [
        [0, 19, 1.5], [1.5, 24, 1.5], [3.25, 23, 0.75],
      ] },
      { bac: 5, chat: '', bac2: null, chia: null, n: [
        [0, 23, 0.75], [0.75, 5, 0.25], [1, 9, 0.25], [1.25, 23, 0.25], [1.5, 24, 1],
        [2.5, 21, 1.5],
      ] },
      { bac: 2, chat: 'm', bac2: null, chia: null, n: [
        [0.75, 17, 0.25], [1, 5, 0.5], [1.5, 16, 0.5], [2, 14, 1], [3, 14, 0.25],
        [3.25, 16, 0.25], [3.5, 17, 0.25], [3.75, 16, 0.25],
      ] },
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 21, 1], [1, 4, 0.5], [1.5, 19, 0.5], [2, 19, 2],
      ] },
      { bac: 9, chat: 'm', bac2: null, chia: null, n: [
        [0.75, 16, 0.75], [1.5, 14, 0.5], [2, 12, 0.75], [2.75, 14, 0.5], [3.25, 16, 0.25],
        [3.5, 9, 0.25], [3.75, 14, 0.25],
      ] },
      { bac: 2, chat: 'm', bac2: null, chia: null, n: [
        [0, 19, 1], [1, 5, 0.5], [1.5, 17, 0.5], [2, 17, 2],
      ] },
      { bac: 7, chat: '', bac2: null, chia: null, n: [
        [0, 6, 0.75], [0.75, 14, 0.75], [1.5, 12, 0.5], [2, 11, 0.75], [2.75, 12, 0.5],
        [3.25, 13, 0.25], [3.5, 14, 0.25],
      ] },
      { bac: 9, chat: 'm', bac2: null, chia: null, n: [
        [0, 12, 1.5],
      ] },
    ],
  },
  /* Mùa Xuân Đầu Tiên · Sol trưởng · bolero · 8 ô · 47 nốt · 1 ô chia đôi */
  {
    id: 'mua-xuan',
    ten: 'Mùa Xuân Đầu Tiên',
    thu: false,
    giong: 'Sol trưởng',
    dieu: 'bolero',
    chuGoc: 7,
    phach: 4,
    o: [
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 16, 0.75], [0.75, 0, 0.25], [1, 4, 0.5], [1.5, 16, 0.5], [2, 4, 0.5],
        [2.5, 0, 0.25], [2.75, 7, 0.5], [3.25, 13, 0.25], [3.5, 14, 0.5],
      ] },
      { bac: 9, chat: 'm', bac2: null, chia: null, n: [
        [0, 12, 0.75], [0.75, -3, 0.25], [1, 0, 0.5], [1.5, 11, 0.5], [2, 0, 0.5],
        [2.5, -3, 0.25], [2.75, 4, 0.5], [3.25, 8, 0.25], [3.5, 9, 0.5],
      ] },
      { bac: 4, chat: 'm', bac2: null, chia: null, n: [
        [0, 7, 1], [1, -5, 0.5], [1.5, -1, 0.5], [2, 4, 0.5], [2.5, 7, 0.5],
        [3, 9, 0.5], [3.5, 12, 0.25], [3.75, 9, 0.25],
      ] },
      { bac: 7, chat: '', bac2: 2, chia: 2, n: [
        [0, 14, 0.75], [0.75, 12, 0.75], [1.5, 9, 0.5], [2, 14, 0.75], [2.75, 17, 0.5],
        [3.25, 20, 0.25], [3.5, 21, 0.5],
      ] },
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 19, 1.5], [1.5, 16, 0.5], [2, 16, 0.75], [2.75, 19, 0.75], [3.5, 24, 0.5],
      ] },
      { bac: 4, chat: 'm', bac2: null, chia: null, n: [
        [0, 23, 0.75], [0.75, 21, 0.75], [1.5, 19, 0.5], [2, 17, 1], [3, 14, 1],
      ] },
      { bac: 0, chat: '', bac2: null, chia: null, n: [
        [0, 12, 1], [1, 12, 2],
      ] },
      { bac: 7, chat: '', bac2: null, chia: null, n: [
        [0, -5, 3], [3.25, 0, 0.75],
      ] },
    ],
  },
  /* Rừng Lá Thấp · La thứ · bolero · 9 ô · 70 nốt · 1 ô chia đôi */
  {
    id: 'rung-la',
    ten: 'Rừng Lá Thấp',
    thu: true,
    giong: 'La thứ',
    dieu: 'bolero',
    chuGoc: 9,
    phach: 4,
    o: [
      { bac: 7, chat: '', bac2: null, chia: null, n: [
        [0, 0, 0.5], [0.5, 5, 0.5], [1, 7, 0.5], [1.5, 12, 0.5], [2, 9, 0.75],
        [2.75, 9, 0.25], [3, -3, 0.5], [3.5, 7, 0.5],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 5, 0.5], [0.5, 3, 0.5], [1, 5, 0.5], [1.5, 7, 0.5], [2, 0, 2],
      ] },
      { bac: 10, chat: '', bac2: 5, chia: 1, n: [
        [0.5, -3, 0.5], [1, 0, 0.5], [1.5, 3, 0.25], [1.75, 0, 0.25], [2, 5, 0.75],
        [2.75, 5, 0.25], [3, -4, 0.5], [3.5, 3, 0.5],
      ] },
      { bac: 3, chat: '', bac2: null, chia: null, n: [
        [0, 5, 0.5], [0.5, 7, 0.5], [1, 10, 0.25], [1.25, 7, 0.25], [1.5, 5, 0.5],
        [2, 7, 1], [3, -5, 0.5], [3.5, -2, 0.5],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 3, 0.5], [0.5, 5, 0.5], [1, 7, 0.5], [1.5, 10, 0.25], [1.75, 7, 0.25],
        [2, 12, 0.5], [2.5, 12, 0.25], [2.75, 12, 0.25], [3, 10, 0.5], [3.5, 12, 0.5],
      ] },
      { bac: 7, chat: 'm', bac2: null, chia: null, n: [
        [1, 15, 0.5], [1.5, 12, 0.5], [2, 10, 1], [3, 7, 0.5], [3.5, 10, 0.5],
      ] },
      { bac: 7, chat: 'm', bac2: null, chia: null, n: [
        [0, 10, 0.25], [0.5, 7, 0.5], [1, 10, 0.5], [1.5, 12, 0.25], [1.75, 10, 0.25],
        [2, 14, 1.5], [3.5, 14, 0.25], [3.75, 17, 0.25],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, 14, 0.5], [0.5, 12, 0.5], [1, 10, 0.5], [1.5, 7, 0.25], [1.75, 10, 0.25],
        [2, 12, 1], [3.75, -5, 0.25],
      ] },
      { bac: 0, chat: 'm', bac2: null, chia: null, n: [
        [0, -5, 0.5], [0.5, -5, 0.25], [0.75, -2, 0.25], [1.25, -5, 0.25], [1.5, -2, 0.25],
        [1.75, 2, 0.25], [2, 0, 0.5], [2.5, 0, 0.25], [2.75, 0, 0.25], [3, -2, 0.5],
        [3.5, 0, 0.25],
      ] },
    ],
  },
]

/** Bảng tính từ MIDI `60 + chủ âm`. */
export const gocTuyen = (chu: PitchClass) => 60 + chu
