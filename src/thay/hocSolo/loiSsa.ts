import { khungLoai, LOAI_KHUNG, mucCua, tenBacKhung, tenPhim, type Khung, type MucKhung } from './khungNot'
import { chonNang, type CauKhung } from './mauKhung'

/*
  MƯA KHUNG NỐT · LỐI SSA (thử) — người dùng 15/10/2026: "trong game nốt rơi, ở mục mưa khung nốt để học chạy ngón theo các nhóm đuôi ý
  tôi muốn làm giống như cách mà SSA đã solo trong các clip của anh ta … Hai tay anh ta di chuyển lên xuống khắp đàn chứ ko ở một nơi cố
  định nên tôi muốn bạn đưa ra gợi ý khắp đàn chứ ko phải 1 vị trí". Duyệt đạt thì bỏ chữ "(thử)".

  Số đo bằng HÌNH (camera trên cao, KeyTrain/tools/do_tay_ssa.py; md ssa-rai-ngon.md mục "Hai tay"), 3 clip, 111 hợp âm, 1 101 nốt:
  - tay trái gõ bass rồi rải 5 – 8 – 10: 271 cú gõ, 1 nốt 219 · 2 nốt 47 (phần lớn quãng 8 / 5) · 3+ nốt 5 — không phải hợp âm 2–3 nốt;
  - tay phải chồng một hợp âm ba dựng trên một bậc của bass (bảng `CHONG`), thế ngồi quanh Đô giữa (nốt thấp nhất ở quãng tám 3–4: 76/78);
  - ngón dưới giữ thế, ngón trên chạy: nốt đơn tay phải gõ khi còn giữ ≥ 2 nốt 176/314; chạy phần lớn là rải (bước ≥ 3 nửa cung 153 ·
    liền bậc 50), chuỗi trung vị 4 nốt; chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96; giữa ô 9/96);
  - tay đổi chỗ theo hợp âm: tay phải dời ≥ quãng 5 ở 20/108 chỗ đổi; cùng một hợp âm chồng ở nhiều chỗ (Fm7 4 chỗ).
  Việc mỗi viên: (1) CHỒNG — bass (gốc) rồi thế chồng nằm trên nó: bấm cùng lúc hay rải từng nốt, thế nào, chỗ nào cũng được; (2) CHẠY —
  `SO_NOT_CHAY` nốt anh đặt trên đỉnh (bảng `DINH`); nốt khung khác không tính, nốt khung tránh / ngoài khung là sai. Gợi ý bên luyện,
  hai tay hai màu (người dùng 15/10/2026: "phân biệt cho tôi đâu là tay trái đâu là tay phải chơi"): tay trái viền xanh — bass rồi 5 – 8
  dưới Mi3 (anh: bass rồi rải 5 – 8 – 10); tay phải viền cam — thế chồng khắp tầm tay phải của anh (Mi3 – Đô6); sáng dần từ thấp lên.
  Game rơi không theo nhạc nền nên chưa có phách: thứ tự chồng → chạy thay cho "phách đầu ô → các phách sau" (suy luận của Claude).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type HoSsa = 'maj' | 'thu' | 'treo' | 'm7b5'

/**
 * Thế chồng tay phải (quãng so gốc): hợp âm ba anh dựng trên một bậc của bass — hợp âm ba đầu tiên của tay phải mỗi hợp âm, đo bằng hình:
 * m7 · m9 · m11 → trưởng trên ♭3 17/29; maj7 · maj9 → thứ trên 3 8/18 (thứ trên 6 4/18); treo → trưởng trên ♭7 3/10 (nhiều nhất, cùng lời
 * anh "Cb/Db thực ra là Db9sus4"); m7♭5 → thứ trên ♭3 2/2. Có 9 / 13 trong tên thì thêm nốt ấy — md: "thêm 9 thì tay phải thành m7 trên
 * bậc 3" (D♭maj9 = D♭ + Fm7, Rai 2 · 0:11). Họ khác anh chơi quá ít (≤ 5 hợp âm) nên chưa đưa vào.
 */
export const CHONG: Readonly<Record<string, { ho: HoSsa; iv: readonly number[] }>> = {
  maj7: { ho: 'maj', iv: [4, 7, 11] },
  maj9: { ho: 'maj', iv: [4, 7, 11, 14] },
  m7: { ho: 'thu', iv: [3, 7, 10] },
  m9: { ho: 'thu', iv: [3, 7, 10, 14] },
  '9sus4': { ho: 'treo', iv: [10, 14, 17] },
  '13sus4': { ho: 'treo', iv: [10, 14, 17, 21] },
  m7b5: { ho: 'm7b5', iv: [3, 6, 10] },
}

/**
 * Nốt anh đặt trên đỉnh (nốt giai điệu — nốt tay phải cao nhất đang vang), quãng so gốc, nhiều → ít, chỉ lấy nốt ≥ 2 lần (md mục "Số đo"
 * 3, đếm theo cách tách tay cũ — nốt đỉnh là nốt cao nhất nên ít bị ảnh hưởng): maj 7 26 · 9 14 · 3 9 · 1 8 · 5 5 · 13 2 (n = 64); thu ♭3
 * 27 · 9 16 · ♭7 15 · 11 12 · 5 9 · 1 2 (n = 83); treo 5 7 · 13 7 · 4 3 + 11 2 · 9 2 (n = 23); m7♭5 ♭5 4 · ♭3 3 · ♭7 2 · 11 2 (n = 11).
 * Nốt hợp âm của viên luôn được tính.
 */
export const DINH: Readonly<Record<HoSsa, readonly number[]>> = {
  maj: [11, 2, 4, 0, 7, 9],
  thu: [3, 2, 10, 5, 7, 0],
  treo: [7, 9, 5, 2],
  m7b5: [6, 3, 10, 5],
}

/** Số nốt chạy mỗi viên: chuỗi chạy tay phải của anh dài trung vị 4 (20 chuỗi, dài 3–8). */
export const SO_NOT_CHAY = 4
/** Tầm thế chồng tay phải: nốt thấp nhất Mi3 – Si4 (anh: quãng tám 3–4 ở 76/78 thế), nốt cao nhất tới Rê6 (nốt cao nhất của anh Rê♭6). */
const THE_TU = 52
const THE_DEN = 71
/** Ranh hai tay của gợi ý và của màu phím đang bấm: tay trái dưới Mi3, tay phải từ Mi3 (= nốt thấp nhất của thế chồng thấp nhất). */
export const CHIA_TAY = THE_TU
const DINH_CAO = 86

const CHUNG = [
  'Tay trái gõ BASS (gốc) rồi rải 5 – 8 nếu muốn — anh SSA ít bấm khối tay trái: 271 cú gõ, 1 nốt 219 · 2 nốt 47 (phần lớn quãng 8 / 5) · 3+ nốt 5.',
  'Tay phải CHỒNG hợp âm ba của họ này lên trên bass — bấm cùng lúc hay rải từng nốt, thế nào, chỗ nào cũng được. Anh đặt thế quanh Đô giữa và đổi chỗ theo hợp âm (cùng Fm7 chồng ở 4 chỗ).',
  `Rồi CHẠY ${SO_NOT_CHAY} nốt trên đỉnh: ngón dưới giữ thế, ngón trên chạy (176/314 nốt chạy của anh gõ khi còn giữ ≥ 2 nốt) — anh chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96 nốt chạy; giữa ô 9/96).`,
]

export interface ManSsa {
  ten: string
  goiY: string
  loai: readonly string[]
  quyTac: readonly string[]
}
const HO: readonly (ManSsa & { ho?: HoSsa })[] = [
  {
    ten: 'maj7 · maj9 — thứ trên bậc 3',
    goiY: 'Cmaj7 = Đô + Em · Cmaj9 = Đô + Em7',
    loai: ['maj7', 'maj9'],
    quyTac: [
      'maj7 = bass + hợp âm THỨ trên bậc 3 (Cmaj7 = Đô + Em) — 8/18 hợp âm maj7 · maj9 có chồng của anh (thứ trên 6: 4/18). maj9: thêm 9 thành m7 trên bậc 3 (Đô + Em7).',
      'Đỉnh anh hay đặt: 7 (26/64) · 9 (14/64) · 3 (9/64) · 1 · 5 · 13.',
    ],
  },
  {
    ten: 'm7 · m9 — trưởng trên ♭3',
    goiY: 'Dm7 = Rê + F · Dm9 = Rê + Fmaj7',
    loai: ['m7', 'm9'],
    quyTac: [
      'm7 = bass + hợp âm TRƯỞNG trên ♭3 (Dm7 = Rê + F) — 17/29 hợp âm m7 · m9 · m11 có chồng của anh. m9: thêm 9 thành maj7 trên ♭3 (Rê + Fmaj7).',
      'Đỉnh anh hay đặt: ♭3 (27/83) · 9 (16/83) · ♭7 (15/83) · 11 (12/83) · 5 · 1.',
    ],
  },
  {
    ten: '9sus4 · 13sus — trưởng trên ♭7',
    goiY: 'G9sus4 = Sol + F · G13sus = Sol + Fmaj7',
    loai: ['9sus4', '13sus4'],
    quyTac: [
      '9sus4 = bass + hợp âm TRƯỞNG trên ♭7 (G9sus4 = Sol + F) — anh SSA: "Cb/Db thực ra là Db9sus4" (đo: 3/10 hợp âm treo có chồng, nhiều nhất). 13sus: thêm 13 thành maj7 trên ♭7.',
      'Đỉnh anh hay đặt: 5 (7/23) · 13 (7/23) · 4 (5/23) · 9 (2/23).',
    ],
  },
  {
    ten: 'm7♭5 — thứ trên ♭3',
    goiY: 'Bm7♭5 = Si + Dm',
    loai: ['m7b5'],
    quyTac: ['m7♭5 = bass + hợp âm THỨ trên ♭3 (Bm7♭5 = Si + Dm) — 2/2 hợp âm m7♭5 có chồng của anh.', 'Đỉnh anh hay đặt: ♭5 (4/11) · ♭3 (3/11) · ♭7 (2/11) · 11 (2/11).'],
  },
]
/** Màn lối SSA: mỗi họ đuôi anh chơi đủ nhiều một màn, thêm màn trộn. Luật chung ghi trước luật của họ. */
export const MAN_SSA: readonly ManSsa[] = [
  ...HO.map((m) => ({ ...m, quyTac: [...CHUNG, ...m.quyTac] })),
  { ten: 'Trộn cả bốn họ', goiY: '7 loại', loai: Object.keys(CHONG), quyTac: [...CHUNG, 'Mỗi họ một thế chồng: maj7 thứ trên 3 · m7 trưởng trên ♭3 · treo trưởng trên ♭7 · m7♭5 thứ trên ♭3.'] },
]

export interface PhanSsa {
  ho: HoSsa
  /** Thế chồng tay phải: lớp cao độ. */
  chong: number[]
  /** "Em", "Fmaj7" … */
  tenChong: string
  /** Mọi chỗ đặt thế chồng trong tầm tay phải của anh — nốt thật, thấp → cao. */
  the: number[][]
  /** Gợi ý tay trái: bass rồi 5 – 8, dưới `CHIA_TAY` (anh rải tay trái 1 – 5 – 8 – 10; khối hai nốt là quãng 8 / quãng 5). */
  loTrai: number[]
  /** Gợi ý khắp đàn (bên luyện): tay trái (`loTrai`) rồi nốt các thế tay phải, thấp → cao — sáng dần theo thứ tự này. */
  lo: number[]
}
export type CauSsa = CauKhung & { khungTen: string; ssa: PhanSsa }

const HAU: Readonly<Record<string, string>> = { '0,3,7': 'm', '0,4,7': '', '0,3,7,10': 'm7', '0,4,7,11': 'maj7' }
const bo8 = (ten: string) => ten.replace(/-?\d+$/, '')

/** Mọi thế (đảo) của thế chồng `iv` trên gốc `g`, xếp sát trong một quãng tám, nốt thấp nhất trong [THE_TU, THE_DEN]. */
export function theChong(g: number, iv: readonly number[]): number[][] {
  const lop = [...iv].map((x) => pc(x)).sort((a, b) => a - b)
  const ra: number[][] = []
  lop.forEach((_, r) => {
    const xoay = [...lop.slice(r), ...lop.slice(0, r).map((x) => x + 12)]
    for (let m = THE_TU; m <= THE_DEN; m++) {
      if (pc(m) !== pc(g + xoay[0]!)) continue
      const the = xoay.map((x) => m + x - xoay[0]!)
      if (the[the.length - 1]! <= DINH_CAO) ra.push(the)
    }
  })
  return ra.sort((a, b) => a[0]! - b[0]!)
}

/** Vai một phím theo lối SSA: nốt hợp âm và nốt anh đặt trên đỉnh là chính; nốt khung khác là phụ (không tính); nốt tránh / ngoài khung là sai. */
export const vaiSsa =
  (k: Khung, ho: HoSsa) =>
  (m: number): MucKhung => {
    const iv = pc(m - k.goc)
    if (k.quang.includes(iv) || DINH[ho].includes(iv)) return 'chinh'
    const muc = mucCua(k, m)
    return muc === 'chinh' ? 'phu' : muc
  }

export function taoCauSsa(id: string, g: number): CauSsa {
  const c = CHONG[id]!
  const k = khungLoai(LOAI_KHUNG.find((l) => l.id === id)!, g)
  const chong = c.iv.map((x) => pc(g + x))
  const goc = pc(g + c.iv[0]!)
  const tenChong = `${bo8(tenPhim(k, 60 + goc))}${HAU[c.iv.map((x) => x - c.iv[0]!).join(',')] ?? ''}`
  const the = theChong(g, c.iv)
  // Tay trái 1 – 5 – 8 chỉ lấy phím dưới Mi3 — trên đó là chỗ của thế tay phải (gốc Si: chỉ còn Si2).
  const loTrai = [36 + g, 43 + g, 48 + g].filter((m) => m < CHIA_TAY)
  const lo = [...new Set([...loTrai, ...the.flat().sort((a, b) => a - b)])]
  const tenGoc = bo8(tenPhim(k, 60 + g))
  const ten = (m: number) => bo8(tenPhim(k, m))
  const dinh = DINH[c.ho].map((iv) => `${ten(60 + g + iv)} (${tenBacKhung(iv, k.quang)})`).join(' · ')
  const vd = the
    .filter((_, i) => i % 2 === 0)
    .slice(0, 4)
    .map((t) => t.map((m) => tenPhim(k, m)).join('–'))
    .join(' · ')
  return {
    id: `ssa:${id}`,
    ten: k.ten,
    g,
    k,
    khungTen: `${tenGoc} + ${tenChong}`,
    quyTac: `bass ${tenGoc} + ${tenChong} (${chong.map((p) => ten(60 + p)).join(' – ')})`,
    goiY: `chồng · chạy ${SO_NOT_CHAY} nốt`,
    loi: `${k.ten} = ${tenGoc} + ${tenChong}. Đỉnh anh hay đặt: ${dinh}.`,
    meo: `${k.ten}: tay trái ${tenGoc} (rải 5 – 8 nếu muốn), tay phải ${tenChong} (${chong.map((p) => ten(60 + p)).join(' – ')}) ở chỗ nào cũng được — ${vd} … Rồi chạy ${SO_NOT_CHAY} nốt: ${dinh}.`,
    dapAnTen: '',
    luaChon: [],
    ssa: { ho: c.ho, chong, tenChong, the, loTrai, lo },
  }
}

/** Câu kế của màn `mi` (loại vừa sai quay lại nhiều hơn, không lặp loại vừa rồi), gốc ngẫu nhiên trong `goc`. */
export function chonCauSsa(mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauSsa {
  const id = chonNang(MAN_SSA[mi]!.loai.map((l) => `ssa:${l}`), sai, truoc, rand)
  return taoCauSsa(id.slice(4), goc[Math.floor(rand() * goc.length)]!)
}

/** Chỗ thế chồng xong trong chuỗi nốt đã nhận: có một nốt gốc mà mọi nốt của thế đều có ở trên nó. −1 = chưa xong. */
export function xongChong(c: Pick<CauSsa, 'g' | 'ssa'>, ds: readonly number[]): number {
  for (let i = 0; i < ds.length; i++) {
    const truoc = ds.slice(0, i + 1)
    const bass = truoc.filter((m) => pc(m) === c.g)
    if (bass.some((b) => c.ssa.chong.every((p) => truoc.some((m) => m > b && pc(m) === p)))) return i
  }
  return -1
}

export type KetQuaSsa = { kq: 'dung' } | { kq: 'tiep'; daChay: number[]; chu?: string } | { kq: 'bo'; chu: string } | { kq: 'sai'; chu: string }

/**
 * Chấm một cú bấm: `daChay` là các nốt đã nhận của viên (chồng rồi chạy). Nốt sai (tránh / ngoài khung) → `sai`; nốt khung khác → `bo`
 * (báo, không tính); lúc chạy, gõ lại đúng nốt vừa rồi → `bo`. Đủ `SO_NOT_CHAY` nốt chạy sau khi chồng xong → `dung`.
 */
export function chamSsa(c: Pick<CauSsa, 'g' | 'k' | 'ssa'>, daChay: readonly number[], note: number): KetQuaSsa {
  const muc = vaiSsa(c.k, c.ssa.ho)(note)
  const ten = `${bo8(tenPhim(c.k, note))} (${tenBacKhung(pc(note - c.k.goc), c.k.quang)})`
  const tenGoc = bo8(tenPhim(c.k, 60 + c.g))
  if (muc === 'khong') return { kq: 'sai', chu: `${ten} — nốt tránh / ngoài khung của ${c.k.ten}, anh SSA không đặt nốt này.` }
  const i = xongChong(c, daChay)
  if (i < 0) {
    if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} không thuộc thế chồng — chồng trước: bass ${tenGoc} rồi ${c.ssa.tenChong} ở trên.` }
    const moi = [...daChay, note]
    return xongChong(c, moi) >= 0
      ? { kq: 'tiep', daChay: moi, chu: `Chồng đủ ${tenGoc} + ${c.ssa.tenChong} — giờ chạy ${SO_NOT_CHAY} nốt trên đỉnh.` }
      : { kq: 'tiep', daChay: moi }
  }
  if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} có trong khung nhưng anh SSA ít đặt trên đỉnh ${c.k.ten} — chưa tính.` }
  if (daChay.length > i + 1 && daChay[daChay.length - 1] === note) return { kq: 'bo', chu: 'Gõ lại đúng phím vừa rồi không tính — đổi nốt.' }
  const moi = [...daChay, note]
  return moi.length - i - 1 >= SO_NOT_CHAY ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}

/** Mẫu nghe khi đúng: bass + thế chồng gần Đô giữa, rồi bốn nốt đỉnh anh hay đặt, đi lên trên thế. */
export function mauSsa(c: Pick<CauSsa, 'g' | 'ssa'>): number[][] {
  const the = c.ssa.the.find((t) => t[0]! >= 55) ?? c.ssa.the[0]!
  let tren = the[the.length - 1]!
  const chay = DINH[c.ssa.ho].slice(0, SO_NOT_CHAY).map((iv) => {
    let m = tren + 1
    while (pc(m) !== pc(c.g + iv)) m++
    tren = m
    return [m]
  })
  return [[36 + c.g, ...the], ...chay]
}
