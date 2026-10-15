import { CHORD_QUALITIES } from '../../shared/musicTheory/chordDefinitions'
import { tenBam } from '../soanCau/chongHopAm'
import { khungCua, khungLoai, LOAI_KHUNG, mucCua, tenBacKhung, tenPhim, type Khung, type MucKhung } from './khungNot'
import { chonNang, type CauKhung } from './mauKhung'
import duNhuAnh from './ssaNhuAnh.json'

/*
  MƯA KHUNG NỐT · LỐI SSA (thử) — người dùng 15/10/2026: "trong game nốt rơi, ở mục mưa khung nốt để học chạy ngón theo các nhóm đuôi ý
  tôi muốn làm giống như cách mà SSA đã solo trong các clip của anh ta … Hai tay anh ta di chuyển lên xuống khắp đàn chứ ko ở một nơi cố
  định nên tôi muốn bạn đưa ra gợi ý khắp đàn chứ ko phải 1 vị trí". Duyệt đạt thì bỏ chữ "(thử)".

  Số đo bằng HÌNH (camera trên cao, KeyTrain/tools/do_tay_ssa.py; md ssa-rai-ngon.md mục "Hai tay"), 3 clip, 111 hợp âm, 1 101 nốt:
  - tay trái gõ bass rồi rải 5 – 8 – 10: 271 cú gõ, 1 nốt 219 · 2 nốt 47 (phần lớn quãng 8 / 5) · 3+ nốt 5 — không phải hợp âm 2–3 nốt;
  - tay phải chồng một hợp âm ba dựng trên một bậc của bass (bảng `CHONG`), thế ngồi quanh Đô giữa (nốt thấp nhất ở quãng tám 3–4: 76/78);
  - chạy trên nền thế còn vang: nốt đơn tay phải gõ khi ≥ 2 nốt tay phải khác còn vang 176/314 — phần lớn NHỜ PEDAL (lúc tắt nốt của bộ
    chép trùng lúc nhả pedal 55–78 %, dời ngẫu nhiên 4–8 %; nốt gõ khi pedal đang đạp 72–93 %), ngón có giữ phím hay không chưa đo được
    (bản trước ghi "ngón dưới giữ thế, ngón trên chạy" — không có cơ sở, sửa 15/10/2026); chạy phần lớn là rải (bước ≥ 3 nửa cung 153 ·
    liền bậc 50), chuỗi trung vị 4 nốt; chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96; giữa ô 9/96);
  - tay đổi chỗ theo hợp âm: tay phải dời ≥ quãng 5 ở 20/108 chỗ đổi; cùng một hợp âm chồng ở nhiều chỗ (Fm7 4 chỗ).
  Việc mỗi viên: (1) CHỒNG — bass rồi thế chồng nằm trên nó: bấm cùng lúc hay rải từng nốt, thế nào, chỗ nào cũng được; (2) CHẠY — nốt
  trên đỉnh (`soChay` nốt); nốt khung khác không tính, nốt khung tránh / ngoài khung là sai. Gợi ý bên luyện, hai tay hai màu (người dùng
  15/10/2026: "phân biệt cho tôi đâu là tay trái đâu là tay phải chơi"): tay trái viền xanh, tay phải viền cam; sáng dần từ thấp lên.
  Hai loại viên:
  - THEO HỌ ĐUÔI: hợp âm lấy từ bảng loại của app, thế chồng theo luật đo được (`CHONG`), gợi ý mọi chỗ đặt thế trong tầm tay phải của
    anh (Mi3 – Đô6), chạy `SO_NOT_CHAY` nốt anh đặt trên đỉnh (`DINH`).
  - NHƯ ANH (người dùng 15/10/2026: "SSA chơi nhiều hợp âm màu lạ, liệu trong app có những hợp âm này ko. Nếu có tôi muốn học chơi như
    anh"): mỗi viên là một hợp âm anh chơi trong clip — đúng tên anh ghi trên màn hình (40 loại, cả loại app chưa có), ở giọng của clip,
    gợi ý là đúng phím anh bấm (`ssaNhuAnh.json`, `tools/do_tay_ssa.py --xuat`): tay trái anh gõ, tay phải lúc đầy nhất (các nốt cùng
    vang — anh rải rồi giữ pedal), nốt anh chạy riêng. Chồng đủ các nốt tay phải ấy trên bass (quãng tám nào cũng được), rồi chạy đủ số nốt
    khác nhau anh chạy (tối đa `SO_NOT_CHAY`; anh không chạy thì chồng xong là đúng). Nốt ngoài hợp âm và ngoài các nốt anh đánh là sai.
  Game rơi không theo nhạc nền nên chưa có phách: thứ tự chồng → chạy thay cho "phách đầu ô → các phách sau" (suy luận của Claude).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type HoSsa = 'maj' | 'thu' | 'treo' | 'm7b5'

/**
 * Thế chồng tay phải (quãng so gốc): hợp âm ba anh dựng trên một bậc của bass — hợp âm ba đầu tiên của tay phải mỗi hợp âm, đo bằng hình:
 * m7 · m9 · m11 → trưởng trên ♭3 17/29; maj7 · maj9 → thứ trên 3 8/18 (thứ trên 6 4/18); treo → trưởng trên ♭7 3/10 (nhiều nhất, cùng lời
 * anh "Cb/Db thực ra là Db9sus4"); m7♭5 → thứ trên ♭3 2/2. Có 9 / 13 trong tên thì thêm nốt ấy — md: "thêm 9 thì tay phải thành m7 trên
 * bậc 3" (D♭maj9 = D♭ + Fm7, Rai 2 · 0:11). Họ khác anh chơi quá ít (≤ 5 hợp âm) nên chỉ có ở màn "Như anh".
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
  `Rồi CHẠY ${SO_NOT_CHAY} nốt trên đỉnh, trên nền thế còn vang — anh đạp pedal (72–93 % nốt gõ khi pedal đang đạp) nên thế vẫn ngân khi tay chạy; ngón có giữ phím hay không thì chưa đo được. Anh chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96 nốt chạy; giữa ô 9/96).`,
]

/* ---------------- Như anh — đúng hợp âm, đúng thế anh bấm trong clip ---------------- */

interface DoanNhuAnh {
  clip: string
  /** Giây bắt đầu (nhãn màn hình). */
  t: number
  goc: string
  /** Loại theo nhãn màn hình của anh: "Maj9(13)", "13sus(b9)", "min7b5(9,11)" … */
  loai: string
  bass: string | null
  /** Nốt của nhãn, quãng so gốc (lớp cao độ). */
  iv: number[]
  /** Nốt tay trái anh gõ, theo lúc gõ (MIDI). */
  trai: number[]
  /** Thế tay phải lúc đầy nhất (MIDI, thấp → cao). */
  the: number[]
  /** Nốt đơn tay phải ngoài thế, theo lúc gõ (MIDI). */
  chay: number[]
}
const NHU_ANH = duNhuAnh as unknown as { clip: Record<string, { ten: string; tonic: number }>; doan: DoanNhuAnh[] }
const PC_TEN: Readonly<Record<string, number>> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
/** Loại quen (đã có màn theo họ, hay hợp âm ba / 7 trơn) — màn "hợp âm màu lạ" bỏ các loại này. */
const QUEN = new Set(['Maj7', 'Maj9', 'min7', 'min9', '7', '', 'min', '5'])

const dauGoc = (s: string) => s.replace(/^([A-G])b/, '$1♭').replace(/^([A-G])#/, '$1♯')
const GIANG: Readonly<Record<string, string>> = { 'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭', 'A♯': 'B♭' }
/** Tên anh ghi trên màn hình, viết dấu ♭ ♯: "GbMaj9(13)" → "G♭maj9(13)", "Bbmin7b5(9,11)/E" → "B♭m7♭5(9,11)/E". */
export function tenNhuAnh(goc: string, loai: string, bass: string | null): string {
  const l = loai
    .replace('minMaj7', 'm(maj7)')
    .replace(/^Maj\(/, '(')
    .replace(/Maj/g, 'maj')
    .replace(/min/g, 'm')
    .replace(/b(?=\d)/g, '♭')
    .replace(/#/g, '♯')
  return `${dauGoc(goc)}${l}${bass ? `/${dauGoc(bass)}` : ''}`
}

/** Loại của app gần nhất — chỉ để gọi tên nốt theo giọng (khung); trùng đúng nốt thì lấy loại ấy. */
function chatGan(iv: readonly number[]): string {
  const khoa = (xs: readonly number[]) => [...new Set(xs.map(pc))].sort((a, b) => a - b).join(',')
  const q = CHORD_QUALITIES.find((x) => khoa(x.intervals) === khoa(iv))
  if (q) return q.symbol
  const co = (x: number) => iv.includes(x)
  if (co(3)) return co(6) ? 'm7b5' : co(11) ? 'm(maj7)' : co(10) ? 'm7' : 'm'
  if (co(4)) return co(10) ? '7' : co(11) ? 'maj7' : ''
  return co(10) ? '7sus4' : ''
}

const lay = (f: (d: DoanNhuAnh) => boolean) =>
  NHU_ANH.doan.flatMap((d, i) => (d.the.length >= 2 && f(d) ? [i] : []))

export interface ManSsa {
  ten: string
  goiY: string
  /** Màn theo họ đuôi: các loại (bảng `CHONG`). */
  loai?: readonly string[]
  /** Màn "Như anh": chỉ số đoạn trong `ssaNhuAnh.json`. */
  doan?: readonly number[]
  /** Màn "Như anh" theo thứ tự clip — viên sau là hợp âm kế tiếp anh chơi. */
  thuTu?: boolean
  quyTac: readonly string[]
}
const HO: readonly ManSsa[] = [
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
const NHU_ANH_LUAT = [
  'Mỗi viên là một hợp âm anh SSA chơi trong clip — đúng tên anh ghi trên màn hình, ở giọng của clip (nút gốc không áp dụng cho màn này).',
  'Gợi ý là ĐÚNG PHÍM ANH BẤM, đo bằng hình: viền xanh tay trái anh gõ, viền cam tay phải lúc đầy nhất (các nốt cùng vang — anh rải rồi giữ pedal) và nốt anh chạy.',
  'Chồng: bass anh gõ (nếu ở hợp âm ấy anh có đánh tay trái) rồi đủ các nốt tay phải của anh ở trên — quãng tám nào, bấm cùng lúc hay rải đều được. Chạy: đủ số nốt khác nhau anh chạy (anh không chạy thì chồng xong là đúng).',
  'Nốt không nằm trong hợp âm và không phải nốt anh đánh là sai.',
]
/** Màn lối SSA: mỗi họ đuôi anh chơi đủ nhiều một màn, màn trộn, rồi bốn màn "Như anh". Luật chung ghi trước luật của họ. */
export const MAN_SSA: readonly ManSsa[] = [
  ...HO.map((m) => ({ ...m, quyTac: [...CHUNG, ...m.quyTac] })),
  { ten: 'Trộn cả bốn họ', goiY: '7 loại', loai: Object.keys(CHONG), quyTac: [...CHUNG, 'Mỗi họ một thế chồng: maj7 thứ trên 3 · m7 trưởng trên ♭3 · treo trưởng trên ♭7 · m7♭5 thứ trên ♭3.'] },
  ...(
    [
      ['rai1', 'Như anh · Rai 1 — Đô trưởng → La thứ'],
      ['rai2', 'Như anh · Rai 2 — La♭ trưởng'],
      ['rai3', 'Như anh · Rai 3 — Rê♭ trưởng (4536251)'],
    ] as const
  ).map(([clip, ten]) => {
    const doan = lay((d) => d.clip === clip)
    return { ten, goiY: `${doan.length} hợp âm theo thứ tự anh chơi`, doan, thuTu: true, quyTac: [...NHU_ANH_LUAT, 'Viên sau là hợp âm kế tiếp anh chơi trong clip — học cả vòng như anh.'] }
  }),
  (() => {
    const doan = lay((d) => !QUEN.has(d.loai))
    return {
      ten: 'Như anh · chỉ hợp âm màu lạ',
      goiY: `${doan.length} hợp âm — 13sus(♭9) · maj9(13) · m7♭5(9,11) · 7(♭9♯5) …`,
      doan,
      quyTac: [...NHU_ANH_LUAT, 'Chỉ các hợp âm màu (bỏ maj7 · maj9 · m7 · m9 · 7 · hợp âm ba) — trong 111 hợp âm của anh: 86 loại app đã có đúng nốt, 18 khác app một nốt, 7 app chưa có.'],
    }
  })(),
]

export interface PhanSsa {
  /** Họ đuôi — null: viên "như anh". */
  ho: HoSsa | null
  /** Lớp cao độ bass phải bấm (thấp hơn thế chồng); null — anh không đánh tay trái ở hợp âm này. */
  bass: number | null
  /** Thế chồng tay phải: lớp cao độ. */
  chong: number[]
  /** "Em", "Fmaj7" … */
  tenChong: string
  /** Chỗ đặt thế chồng — nốt thật, thấp → cao (theo họ: mọi chỗ trong tầm tay phải của anh; như anh: đúng chỗ anh bấm). */
  the: number[][]
  /** Gợi ý tay trái (theo họ: bass rồi 5 – 8 dưới `CHIA_TAY`; như anh: đúng nốt anh gõ). */
  loTrai: number[]
  /** Gợi ý (bên luyện): tay trái (`loTrai`) rồi tay phải, thấp → cao — sáng dần theo thứ tự này. */
  lo: number[]
  /** Lớp cao độ tính là nốt chính: nốt hợp âm + nốt anh đặt trên đỉnh (theo họ) · nốt nhãn + nốt anh đánh (như anh). */
  dinh: number[]
  /** Số nốt chạy phải đủ sau khi chồng (0 = chồng xong là đúng). */
  soChay: number
  /** Nốt anh chạy, theo lúc gõ (như anh). */
  chay: number[]
  /** Nguồn (như anh): "Rai 3 · 0:01". */
  nguon?: string
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

/**
 * Vai một phím: nốt trong `dinh` là chính. Theo họ: nốt khung khác là phụ (không tính), nốt tránh / ngoài khung là sai. Như anh: nốt
 * ngoài hợp âm và ngoài các nốt anh đánh là sai.
 */
export const vaiSsa =
  (k: Khung, ssa: Pick<PhanSsa, 'ho' | 'dinh'>) =>
  (m: number): MucKhung => {
    if (ssa.dinh.includes(pc(m))) return 'chinh'
    if (!ssa.ho) return 'khong'
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
    ssa: {
      ho: c.ho,
      bass: g,
      chong,
      tenChong,
      the,
      loTrai,
      lo,
      dinh: [...new Set([...k.quang, ...DINH[c.ho]].map((iv) => pc(g + iv)))],
      soChay: SO_NOT_CHAY,
      chay: [],
    },
  }
}

/** Viên "như anh" từ đoạn `i` của `ssaNhuAnh.json`. */
export function taoCauNhuAnh(i: number): CauSsa {
  const d = NHU_ANH.doan[i]!
  const clip = NHU_ANH.clip[d.clip]!
  const g = PC_TEN[d.goc]!
  const k = khungCua(clip.tonic, false, { goc: pc(g - clip.tonic), chat: chatGan(d.iv) })
  const ten = tenNhuAnh(d.goc, d.loai, d.bass)
  const bass = d.trai.length ? PC_TEN[d.bass ?? d.goc]! : null
  const tenN = (m: number) => tenPhim(k, m)
  const ds = (ms: readonly number[]) => ms.map(tenN).join(' – ')
  // Ba clip ở giọng dấu giáng (Đô · La♭ · Rê♭): tên thế tay phải đổi thăng → giáng cho cùng lối với tên hợp âm ("G♭ + F♯m6" → "G♭ + G♭m6").
  const tenChong = tenBam(d.the, false).ten.replace(/^[A-G]♯/, (x) => GIANG[x] ?? x)
  const chayKhac = [...new Set(d.chay.map(pc))]
  const soChay = Math.min(SO_NOT_CHAY, chayKhac.length)
  const nguon = `${clip.ten} · ${Math.floor(d.t / 60)}:${String(Math.floor(d.t % 60)).padStart(2, '0')}`
  const tenBass = bass === null ? '' : bo8(tenPhim(k, 60 + bass))
  const loi = `${ten} (${nguon}) — anh bấm: tay trái ${d.trai.length ? ds(d.trai) : '(không đánh)'} · tay phải ${ds(d.the)}${d.chay.length ? ` · chạy ${ds(d.chay)}` : ''}.`
  return {
    id: `nhu:${i}`,
    ten,
    g,
    k,
    khungTen: `${tenBass ? `${tenBass} + ` : ''}${tenChong}`,
    quyTac: loi,
    goiY: soChay ? `thế anh · chạy ${soChay} nốt` : 'thế anh bấm',
    loi,
    meo: loi,
    dapAnTen: '',
    luaChon: [],
    ssa: {
      ho: null,
      bass,
      chong: [...new Set(d.the.map(pc))],
      tenChong,
      the: [[...d.the]],
      loTrai: [...d.trai],
      lo: [...new Set([...d.trai, ...d.the, ...d.chay])],
      dinh: [...new Set([...d.iv.map((iv) => pc(g + iv)), ...[...d.trai, ...d.the, ...d.chay].map(pc)])],
      soChay,
      chay: [...d.chay],
      nguon,
    },
  }
}

/** Câu kế của màn `mi`: màn theo họ — loại vừa sai quay lại nhiều hơn, gốc ngẫu nhiên trong `goc`; màn "như anh" — theo thứ tự clip hay ngẫu nhiên có trọng số. */
export function chonCauSsa(mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauSsa {
  const man = MAN_SSA[mi]!
  if (man.doan) {
    if (man.thuTu) {
      const j = truoc?.startsWith('nhu:') ? man.doan.indexOf(Number(truoc.slice(4))) : -1
      return taoCauNhuAnh(man.doan[(j + 1) % man.doan.length]!)
    }
    return taoCauNhuAnh(Number(chonNang(man.doan.map((i) => `nhu:${i}`), sai, truoc, rand).slice(4)))
  }
  const id = chonNang((man.loai ?? []).map((l) => `ssa:${l}`), sai, truoc, rand)
  return taoCauSsa(id.slice(4), goc[Math.floor(rand() * goc.length)]!)
}

/** Chỗ thế chồng xong trong chuỗi nốt đã nhận: có một nốt bass mà mọi nốt của thế đều có ở trên nó (không có bass: đủ nốt thế). −1 = chưa xong. */
export function xongChong(c: Pick<CauSsa, 'ssa'>, ds: readonly number[]): number {
  for (let i = 0; i < ds.length; i++) {
    const truoc = ds.slice(0, i + 1)
    const { bass, chong } = c.ssa
    if (bass === null) {
      if (chong.every((p) => truoc.some((m) => pc(m) === p))) return i
      continue
    }
    const ds8 = truoc.filter((m) => pc(m) === bass)
    if (ds8.some((b) => chong.every((p) => truoc.some((m) => m > b && pc(m) === p)))) return i
  }
  return -1
}

export type KetQuaSsa = { kq: 'dung' } | { kq: 'tiep'; daChay: number[]; chu?: string } | { kq: 'bo'; chu: string } | { kq: 'sai'; chu: string }

/**
 * Chấm một cú bấm: `daChay` là các nốt đã nhận của viên (chồng rồi chạy). Nốt sai → `sai`; nốt khung khác → `bo` (báo, không tính); lúc
 * chạy, gõ lại đúng nốt vừa rồi → `bo`. Chồng xong và đủ `ssa.soChay` nốt chạy → `dung`.
 */
export function chamSsa(c: Pick<CauSsa, 'ten' | 'g' | 'k' | 'ssa'>, daChay: readonly number[], note: number): KetQuaSsa {
  const muc = vaiSsa(c.k, c.ssa)(note)
  const ten = `${bo8(tenPhim(c.k, note))} (${tenBacKhung(pc(note - c.k.goc), c.k.quang)})`
  const tenBass = c.ssa.bass === null ? '' : bo8(tenPhim(c.k, 60 + c.ssa.bass))
  const can = `${tenBass ? `bass ${tenBass} rồi ` : ''}${c.ssa.tenChong}${tenBass ? ' ở trên' : ''}`
  if (muc === 'khong')
    return {
      kq: 'sai',
      chu: c.ssa.ho
        ? `${ten} — nốt tránh / ngoài khung của ${c.ten}, anh SSA không đặt nốt này.`
        : `${ten} — anh không đánh nốt này trên ${c.ten}, cũng không có trong tên hợp âm.`,
    }
  const i = xongChong(c, daChay)
  if (i < 0) {
    if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} không thuộc thế chồng — chồng trước: ${can}.` }
    const moi = [...daChay, note]
    if (xongChong(c, moi) < 0) return { kq: 'tiep', daChay: moi }
    if (c.ssa.soChay === 0) return { kq: 'dung' }
    return { kq: 'tiep', daChay: moi, chu: `Chồng đủ ${tenBass ? `${tenBass} + ` : ''}${c.ssa.tenChong} — giờ chạy ${c.ssa.soChay} nốt trên đỉnh.` }
  }
  if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} có trong khung nhưng anh SSA ít đặt trên đỉnh ${c.ten} — chưa tính.` }
  if (daChay.length > i + 1 && daChay[daChay.length - 1] === note) return { kq: 'bo', chu: 'Gõ lại đúng phím vừa rồi không tính — đổi nốt.' }
  const moi = [...daChay, note]
  return moi.length - i - 1 >= c.ssa.soChay ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}

/** Mẫu nghe khi đúng — theo họ: bass + thế gần Đô giữa, rồi bốn nốt đỉnh anh hay đặt, đi lên; như anh: tay trái + thế anh bấm, rồi nốt anh chạy. */
export function mauSsa(c: Pick<CauSsa, 'g' | 'ssa'>): number[][] {
  if (!c.ssa.ho) return [[...c.ssa.loTrai, ...c.ssa.the[0]!], ...c.ssa.chay.slice(0, SO_NOT_CHAY).map((m) => [m])]
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
