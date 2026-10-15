import { CA_PHAO_VOICINGS } from '../../reharm/reharmEngine/caPhaoHarmony'
import type { ScheduledHit } from '../../shared/audio/audioEngine'
import { CHORD_QUALITIES, findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { tenBam } from '../soanCau/chongHopAm'
import { docHop } from '../soanCau/thayTrongVong'
import type { ThayChay } from './cauThay'
import { chongSsa, khungVong } from './chayNgonRoi'
import { khungCua, khungLoai, LOAI_KHUNG, mucCua, tenBacKhung, tenPhim, type Khung, type LoaiKhung, type MucKhung, type NotKhung } from './khungNot'
import { chonCauKhung, chonNang, MAN_KHUNG, type CauKhung } from './mauKhung'
import duNhuAnh from './ssaNhuAnh.json'
import { khungCho, manThay, soanTuDo, tenCho, tenThayCua, THE_BLUES, timCho, type ChoThay, type Doan } from './thayNhac'

/*
  LỐI CHỒNG + CHẠY (Mưa khung nốt) — mở đầu là Lối SSA, người dùng 15/10/2026: "trong game nốt rơi, ở mục mưa khung nốt để học chạy ngón
  theo các nhóm đuôi ý tôi muốn làm giống như cách mà SSA đã solo trong các clip của anh ta … tôi muốn bạn đưa ra gợi ý khắp đàn chứ ko
  phải 1 vị trí". Duyệt cùng ngày: "game nốt rơi làm theo lối SSA tôi thấy rất ổn" — rồi xin: "Sao 3 thầy còn lại ko làm theo lối SSA.
  Chồng hợp âm rồi chạy ngón theo nhóm đuôi · Cho mục quy tắc nhóm đuôi học theo kiểu chồng hợp âm và chạy nốt giống SSA".

  Số đo bằng HÌNH (camera trên cao, KeyTrain/tools/do_tay_ssa.py; md ssa-rai-ngon.md mục "Hai tay"), 3 clip, 111 hợp âm, 1 101 nốt:
  - tay trái gõ bass rồi rải 5 – 8 – 10: 271 cú gõ, 1 nốt 219 · 2 nốt 47 (phần lớn quãng 8 / 5) · 3+ nốt 5 — không phải hợp âm 2–3 nốt;
  - tay phải chồng một hợp âm ba dựng trên một bậc của bass (bảng `CHONG`), thế ngồi quanh Đô giữa (nốt thấp nhất ở quãng tám 3–4: 76/78);
  - chạy trên nền thế còn vang: nốt đơn tay phải gõ khi ≥ 2 nốt tay phải khác còn vang 176/314 — phần lớn NHỜ PEDAL (lúc tắt nốt của bộ
    chép trùng lúc nhả pedal 55–78 %, dời ngẫu nhiên 4–8 %; nốt gõ khi pedal đang đạp 72–93 %), ngón có giữ phím hay không chưa đo được
    (bản trước ghi "ngón dưới giữ thế, ngón trên chạy" — không có cơ sở, sửa 15/10/2026); chạy phần lớn là rải (bước ≥ 3 nửa cung 153 ·
    liền bậc 50), chuỗi trung vị 4 nốt; chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96; giữa ô 9/96);
  - tay đổi chỗ theo hợp âm: tay phải dời ≥ quãng 5 ở 20/108 chỗ đổi; cùng một hợp âm chồng ở nhiều chỗ (Fm7 4 chỗ).
  Việc mỗi viên: (1) CHỒNG — bass rồi thế chồng nằm trên nó: bấm cùng lúc hay rải từng nốt, thế nào, chỗ nào cũng được; (2) CHẠY — nốt
  trên đỉnh (`soChay` nốt); nốt khung khác không tính, nốt tránh / ngoài khung là sai. Gợi ý bên luyện hai tay hai màu: tay trái viền
  xanh, tay phải viền cam; sáng dần từ thấp lên. Bốn loại viên (`PhanSsa.loai`):
  - 'ho' — họ đuôi anh SSA chơi đủ nhiều: thế anh (`CHONG`), chạy nốt anh đặt trên đỉnh (`DINH`), gợi ý mọi chỗ đặt thế (Mi3 – Đô6);
  - 'nhu-anh' — đúng hợp âm, đúng phím anh bấm trong clip (`ssaNhuAnh.json`, `tools/do_tay_ssa.py --xuat`);
  - 'quy-tac' — màn quy tắc nhóm đuôi theo lối chồng + chạy (28 loại): thế anh SSA nếu loại ấy anh có đo, không thì công thức chồng của
    app (`chongSsa` — thế "Chồng hai tay" của Game chạy ngón), chạy nốt hợp âm + nốt đỉnh nên chọn của loại (`LoaiKhung.dinh`);
  - 'thay' — ba thầy: hợp âm loại + bậc bộ soạn của thầy hay đặt (`manThay`), thế tay phải của thầy (`theThay`), chạy nốt chính của thầy
    (đo trên bộ soạn — `khungCho`);
  - 'vong' — vòng của anh SSA trên backing track điệu Cà Pháo (thử): viên theo thứ tự vòng, kèm nốt NÊN CHƠI khi vào hợp âm (`nenChoiVong`).
  Game rơi không theo nhạc nền nên chưa có phách: thứ tự chồng → chạy thay cho "phách đầu ô → các phách sau" (suy luận của Claude).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type HoSsa = 'maj' | 'thu' | 'treo' | 'm7b5'
export type LoaiVien = 'ho' | 'nhu-anh' | 'quy-tac' | 'thay' | 'vong'

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
      quyTac: [
        ...NHU_ANH_LUAT,
        'Chỉ các hợp âm màu (bỏ maj7 · maj9 · m7 · m9 · 7 · hợp âm ba). Trong 111 hợp âm của anh: 93 là loại app có (gồm 4 loại thêm 15/10/2026 từ chính anh — 5 · maj9sus4 · m11♭5 · 7(13)), 18 khác loại app một nốt.',
      ],
    }
  })(),
]

export interface PhanSsa {
  loai: LoaiVien
  /** Họ đuôi SSA (viên 'ho', và viên 'quy-tac' của loại anh có đo). */
  ho?: HoSsa
  /** Lớp cao độ bass phải bấm (thấp hơn thế chồng); null — anh không đánh tay trái ở hợp âm này (như anh). */
  bass: number | null
  /** Thế chồng: lớp cao độ phải có trên bass. */
  chong: number[]
  /** "Em", "Fmaj7", "B–D–E" … */
  tenChong: string
  /** Chỗ đặt thế chồng — nốt thật, thấp → cao (khắp tầm tay phải; như anh: đúng chỗ anh bấm). */
  the: number[][]
  /** Gợi ý tay trái (bass rồi 5 – 8 dưới `CHIA_TAY`; công thức chồng: tay trái của công thức; như anh: đúng nốt anh gõ). */
  loTrai: number[]
  /** Gợi ý (bên luyện): tay trái (`loTrai`) rồi tay phải, thấp → cao — sáng dần theo thứ tự này. */
  lo: number[]
  /** Lớp cao độ tính là nốt chính khi chạy, theo thứ tự nên chọn trước. */
  dinh: number[]
  /** Vai một phím: chính (tính) · phụ (không tính) · không (sai). */
  vai: (m: number) => MucKhung
  /** Số nốt chạy phải đủ sau khi chồng (0 = chồng xong là đúng). */
  soChay: number
  /** Nốt anh chạy, theo lúc gõ (như anh). */
  chay: number[]
  /** Thế chồng lấy từ đâu — "thế anh SSA" · "công thức chồng của app" · "thế Cà Pháo (rút từ sheet)" … */
  nguonThe: string
  /** Nguồn (như anh): "Rai 3 · 0:01". */
  nguon?: string
  /** Nốt nên chơi khi vào hợp âm (viên của vòng backing) — tô ★ trên bàn phím. */
  nen?: NotNen[]
}
export type CauSsa = CauKhung & { khungTen: string; ssa: PhanSsa }

const HAU: Readonly<Record<string, string>> = { '0,3,7': 'm', '0,4,7': '', '0,3,7,10': 'm7', '0,4,7,11': 'maj7' }
const bo8 = (ten: string) => ten.replace(/-?\d+$/, '')

/** Mọi thế (đảo) của thế chồng `iv` trên gốc `g`, xếp sát trong một quãng tám, nốt thấp nhất trong [THE_TU, THE_DEN]. */
export function theChong(g: number, iv: readonly number[]): number[][] {
  const lop = [...new Set([...iv].map((x) => pc(x)))].sort((a, b) => a - b)
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

/** Đúng thế `iv` (giữ thứ tự xếp, kể cả quãng > 12) dời lên từng quãng tám trong tầm tay phải — thế của thầy ở nhiều chỗ. */
function theDoi(g: number, iv: readonly number[]): number[][] {
  const ra: number[][] = []
  for (let o = 2; o <= 6; o++) {
    const the = iv.map((x) => 12 * o + pc(g) + x).sort((a, b) => a - b)
    if (the[0]! >= THE_TU && the[0]! <= THE_DEN + 5 && the[the.length - 1]! <= DINH_CAO) ra.push(the)
  }
  return ra.length ? ra : theChong(g, iv)
}

/**
 * Chỉ giữ chỗ đặt thế nằm TRÊN phím cao nhất của tay trái — công thức chồng đặt tay trái ở quãng tám 3 (F♯9: Fa♯3 La♯3) nên thế thấp
 * nhất Mi3 chui xuống dưới bass, chồng không bao giờ xong (test bấm đủ bắt được 60 viên kẹt, 15/10/2026). Không còn chỗ nào thì giữ nguyên.
 */
const trenTrai = (the: number[][], trai: readonly number[]) => {
  const tren = the.filter((t) => t[0]! > Math.max(...trai))
  return tren.length ? tren : the
}

/** Tay trái 1 – 5 – 8 dưới Mi3 — trên đó là chỗ của thế tay phải (gốc Si: chỉ còn Si2). */
const traiHo = (g: number) => [36 + g, 43 + g, 48 + g].filter((m) => m < CHIA_TAY)
/** Vai theo khung: nốt trong `dinh` là chính; nốt chính khác của khung thành phụ (không tính); còn lại giữ vai của khung. */
const vaiKhung = (k: Khung, dinh: readonly number[]) => (m: number): MucKhung => {
  if (dinh.includes(pc(m))) return 'chinh'
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
  const loTrai = traiHo(g)
  const lo = [...new Set([...loTrai, ...the.flat().sort((a, b) => a - b)])]
  const tenGoc = bo8(tenPhim(k, 60 + g))
  const ten = (m: number) => bo8(tenPhim(k, m))
  const dinhChu = DINH[c.ho].map((iv) => `${ten(60 + g + iv)} (${tenBacKhung(iv, k.quang)})`).join(' · ')
  const vd = the
    .filter((_, i) => i % 2 === 0)
    .slice(0, 4)
    .map((t) => t.map((m) => tenPhim(k, m)).join('–'))
    .join(' · ')
  const dinh = [...new Set([...DINH[c.ho], ...k.quang].map((iv) => pc(g + iv)))]
  return {
    id: `ssa:${id}`,
    ten: k.ten,
    g,
    k,
    khungTen: `${tenGoc} + ${tenChong}`,
    quyTac: `bass ${tenGoc} + ${tenChong} (${chong.map((p) => ten(60 + p)).join(' – ')})`,
    goiY: `chồng · chạy ${SO_NOT_CHAY} nốt`,
    loi: `${k.ten} = ${tenGoc} + ${tenChong}. Đỉnh anh hay đặt: ${dinhChu}.`,
    meo: `${k.ten}: tay trái ${tenGoc} (rải 5 – 8 nếu muốn), tay phải ${tenChong} (${chong.map((p) => ten(60 + p)).join(' – ')}) ở chỗ nào cũng được — ${vd} … Rồi chạy ${SO_NOT_CHAY} nốt: ${dinhChu}.`,
    dapAnTen: '',
    luaChon: [],
    ssa: { loai: 'ho', ho: c.ho, bass: g, chong, tenChong, the, loTrai, lo, dinh, vai: vaiKhung(k, dinh), soChay: SO_NOT_CHAY, chay: [], nguonThe: 'thế anh SSA (đo bằng hình)' },
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
  const dinh = [...new Set([...[...d.chay, ...d.the, ...d.trai].map(pc), ...d.iv.map((iv) => pc(g + iv))])]
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
      loai: 'nhu-anh',
      bass,
      chong: [...new Set(d.the.map(pc))],
      tenChong,
      the: [[...d.the]],
      loTrai: [...d.trai],
      lo: [...new Set([...d.trai, ...d.the, ...d.chay])],
      dinh,
      // Như anh: nốt ngoài hợp âm và ngoài các nốt anh đánh là sai.
      vai: (m) => (dinh.includes(pc(m)) ? 'chinh' : 'khong'),
      soChay,
      chay: [...d.chay],
      nguonThe: 'đúng phím anh bấm (đo bằng hình)',
      nguon,
    },
  }
}

/* ---------------- Màn quy tắc nhóm đuôi theo lối chồng + chạy (thử) ---------------- */

/**
 * Viên chồng + chạy cho một loại của app ở gốc `g`: loại anh SSA có đo thì lấy thế anh (`taoCauSsa`); không thì công thức chồng của app
 * (`chongSsa` — tay trái và tay phải của công thức, loại chưa có công thức thì gốc + 2–3 nốt hợp âm dưới nốt đỉnh nên chọn). Chạy: nốt hợp
 * âm + nốt đỉnh nên chọn của loại (`LoaiKhung.dinh` — số đo SSA nếu có, không thì lý thuyết của Claude).
 */
export function taoCauChong(loai: LoaiKhung, g: number, nha: LoaiKhung['nha'] = loai.nha): CauSsa {
  if (CHONG[loai.id] && nha === loai.nha) {
    const c = taoCauSsa(loai.id, g)
    return { ...c, ssa: { ...c.ssa, loai: 'quy-tac' } }
  }
  const k = khungLoai(loai, g, nha)
  const s = chongSsa(k)
  const phai = [...s.phai].sort((a, b) => a - b)
  const chong = [...new Set([...s.trai, ...phai].map(pc))].filter((p) => p !== pc(g))
  const loTrai = [...new Set(s.trai)].sort((a, b) => a - b)
  const the = trenTrai(theChong(g, phai.map((m) => m - (60 + pc(g)))), loTrai)
  const lo = [...new Set([...loTrai, ...the.flat().sort((a, b) => a - b)])]
  // Nốt của chính thế chồng luôn tính (công thức có thể thêm nốt màu ngoài tên — vd 13 bỏ 9 vẫn có 13).
  const dinh = [...new Set([...[...k.dinh, ...k.quang].map((iv) => pc(g + iv)), ...chong])]
  const ten = (m: number) => bo8(tenPhim(k, m))
  const tenChong = s.ten.includes(' + ') ? s.ten.slice(s.ten.indexOf(' + ') + 3) : phai.map(ten).join('–')
  const dinhChu = k.dinh
    .slice(0, 4)
    .map((iv) => `${ten(60 + g + iv)} (${tenBacKhung(iv, k.quang)})`)
    .join(' · ')
  return {
    id: `chong:${loai.id}`,
    ten: k.ten,
    g,
    k,
    khungTen: s.ten,
    quyTac: `${s.ten} (${chong.map((p) => ten(60 + p)).join(' – ')})`,
    goiY: `chồng · chạy ${SO_NOT_CHAY} nốt`,
    loi: `${k.ten} = ${s.ten}. Đỉnh nên chọn: ${dinhChu}.`,
    meo: `${k.ten}: tay trái ${loTrai.map((m) => tenPhim(k, m)).join(' – ')}, tay phải ${tenChong} ở chỗ nào cũng được. Rồi chạy ${SO_NOT_CHAY} nốt: ${dinhChu}.`,
    dapAnTen: '',
    luaChon: [],
    ssa: { loai: 'quy-tac', bass: pc(g), chong, tenChong, the, loTrai, lo, dinh, vai: vaiKhung(k, dinh), soChay: SO_NOT_CHAY, chay: [], nguonThe: 'công thức chồng của app' },
  }
}

/** Câu kế của màn quy tắc `mi` theo lối chồng + chạy: quy tắc của màn (`chonCauKhung` — "từ Cmaj7: B → B♭") + thế chồng của loại. */
export function chonCauQuyTacChong(mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauSsa {
  const kh = chonCauKhung(mi, goc, sai, truoc, rand)
  const buoc = MAN_KHUNG[mi]!.buoc[Number(kh.id.split(':')[1])]!
  const loai = LOAI_KHUNG.find((l) => l.id === buoc.id)!
  const c = taoCauChong(loai, kh.g, buoc.nha)
  return {
    ...c,
    id: kh.id,
    ten: kh.ten,
    khungTen: kh.quyTac,
    goiY: `${c.khungTen} · chồng · chạy ${SO_NOT_CHAY}`,
    loi: `${c.loi} Quy tắc: ${kh.quyTac}.`,
    meo: `${c.meo} Quy tắc: ${kh.quyTac}. ${kh.meo}`,
  }
}

/* ---------------- Ba thầy theo lối chồng + chạy ---------------- */

/**
 * Thế tay phải của thầy (quãng so gốc, giữ thứ tự xếp). Cà Pháo: `CA_PHAO_VOICINGS` — rút từ sheet của anh (m9 "Người hãy quên" ô 9 · m11
 * ô 43 · maj9 "Có Em Chờ" · maj7 "Hongkong" · 7 / 9 / 7♭13 "Người hãy quên" ô 97 · m7♭5 ô 48); Blues: `THE_BLUES` — vỏ 3 – ♭7 – màu (md
 * Blues "Thế bấm tay phải": thế bậc 9 9/187 cụm — chọn thế là của Claude); Linh Nhi: hợp âm ba / bảy của chính hợp âm (md: ~79 % hợp âm ba
 * trơn). Loại thầy chưa có thế thì null (dùng thế chồng chung).
 */
export function theThay(thay: ThayChay, duoi: string): { iv: number[]; nguon: string; doi: boolean } | null {
  const q = findQualityBySymbol(duoi)
  if (!q) return null
  if (thay === 'ca-phao') {
    const iv = CA_PHAO_VOICINGS[q.id]
    return iv ? { iv: [...iv], nguon: 'thế Cà Pháo (rút từ sheet của anh)', doi: true } : null
  }
  if (thay === 'blues') {
    const iv = THE_BLUES[duoi]
    return iv ? { iv: [...iv], nguon: 'thế Blues (vỏ 3 – ♭7 – màu, md Blues)', doi: true } : null
  }
  // Linh Nhi: thế là chính hợp âm — gợi ý mọi thế đảo (như SSA); Cà Pháo · Blues: giữ đúng cách xếp, dời theo quãng tám.
  return { iv: q.intervals.filter((x) => x < 12), nguon: 'thế Linh Nhi (hợp âm của chính nó — md: ~79 % hợp âm ba trơn)', doi: false }
}

/** Viên thầy theo lối chồng + chạy: hợp âm ở chỗ đứng `c` (giọng `tonic`), thế tay phải của thầy, chạy nốt chính của thầy. */
export function taoCauThayChong(thay: ThayChay, c: ChoThay, tonic: number, id = `${thay}:${c.duoi}|${c.goc}|${c.thu}`): CauSsa {
  const k = khungCua(tonic, c.thu, { goc: c.goc, chat: c.duoi })
  const g = k.goc
  const tenT = tenThayCua(thay)
  const kh = khungCho(c)
  const chinh = [...kh.chinh].sort((a, b) => c.dem[b]! - c.dem[a]!)
  const ten = (m: number) => bo8(tenPhim(k, m))
  const tt = theThay(thay, c.duoi)
  let chong: number[]
  let the: number[][]
  let tenChong: string
  let nguonThe: string
  let loTrai = traiHo(g)
  if (tt) {
    chong = [...new Set(tt.iv.map((x) => pc(g + x)))]
    // Thế trải quá một quãng tám (Blues 13 = 3 · ♭7 · 13 → Mi3 – Si♭3 – La4, 17 nửa cung) một tay không với tới: gợi ý thế đảo gọn.
    const rong = Math.max(...tt.iv) - Math.min(...tt.iv)
    the = tt.doi && rong <= 12 ? theDoi(g, tt.iv) : theChong(g, tt.iv)
    tenChong = the[0]!.map(ten).join('–')
    nguonThe = tt.nguon
  } else {
    const s = chongSsa(k)
    const phai = [...s.phai].sort((a, b) => a - b)
    chong = [...new Set([...s.trai, ...phai].map(pc))].filter((p) => p !== g)
    the = trenTrai(theChong(g, phai.map((m) => m - (60 + g))), s.trai)
    tenChong = s.ten.includes(' + ') ? s.ten.slice(s.ten.indexOf(' + ') + 3) : phai.map(ten).join('–')
    nguonThe = `công thức chồng của app (${tenT} chưa có thế riêng cho loại này)`
    loTrai = [...new Set(s.trai)].sort((a, b) => a - b)
  }
  const lo = [...new Set([...loTrai, ...the.flat().sort((a, b) => a - b)])]
  // Nốt của thế chồng là nốt thầy bấm — luôn tính, kể cả khi bộ soạn ít đặt nó trên đỉnh (thế Blues m6 = ♭3 – 6 – 9).
  const vai = (m: number): MucKhung => {
    const b = pc(m - g)
    return kh.chinh.includes(b) || chong.includes(pc(m)) ? 'chinh' : kh.phu.includes(b) ? 'phu' : 'khong'
  }
  const tenGoc = bo8(tenPhim(k, 60 + g))
  const pt = (b: number) => Math.round((100 * c.dem[b]!) / Math.max(1, c.n))
  const chinhChu = chinh.map((b) => `${ten(60 + g + b)} ${pt(b)} %`).join(' · ')
  return {
    id,
    ten: k.ten,
    g,
    k,
    khungTen: `${tenCho(c)} · ${tenGoc} + ${tenChong}`,
    quyTac: `${tenT} trên ${k.ten}: chính ${chinhChu}`,
    goiY: `chồng · chạy ${SO_NOT_CHAY} nốt của ${tenT}`,
    loi: `${k.ten} (${tenCho(c)}) = ${tenGoc} + ${tenChong} · ${nguonThe}. ${tenT} chạy: ${chinhChu}.`,
    meo: `${k.ten}: tay trái ${tenGoc}, tay phải ${tenChong} (${nguonThe}). Rồi chạy ${SO_NOT_CHAY} nốt chính của ${tenT}: ${chinhChu} — bộ soạn đặt ${c.soLan} lần, n=${c.n} nốt.`,
    dapAnTen: '',
    luaChon: [],
    ssa: { loai: 'thay', bass: g, chong, tenChong, the, loTrai, lo, dinh: chinh.map((b) => pc(g + b)), vai, soChay: SO_NOT_CHAY, chay: [], nguonThe },
  }
}

/** Câu kế của màn thầy `mi` (chỗ đứng vừa sai quay lại nhiều hơn), chủ âm ngẫu nhiên trong `goc`. */
export function chonCauThayChong(thay: ThayChay, mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauSsa {
  const cho = manThay(thay)[mi]!.cho
  const id = chonNang(cho.map((_, j) => `${thay}${mi}:${j}`), sai, truoc, rand)
  return taoCauThayChong(thay, cho[Number(id.split(':')[1])]!, goc[Math.floor(rand() * goc.length)]!, id)
}

/* ---------------- Chọn câu · chấm · mẫu nghe ---------------- */

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
 * Chấm một cú bấm: `daChay` là các nốt đã nhận của viên (chồng rồi chạy). Nốt sai → `sai`; nốt phụ → `bo` (báo, không tính); lúc chạy, gõ
 * lại đúng nốt vừa rồi → `bo`. Chồng xong và đủ `ssa.soChay` nốt chạy → `dung`.
 */
export function chamSsa(c: Pick<CauSsa, 'ten' | 'g' | 'k' | 'ssa'>, daChay: readonly number[], note: number): KetQuaSsa {
  const muc = c.ssa.vai(note)
  const ten = `${bo8(tenPhim(c.k, note))} (${tenBacKhung(pc(note - c.k.goc), c.k.quang)})`
  const tenBass = c.ssa.bass === null ? '' : bo8(tenPhim(c.k, 60 + c.ssa.bass))
  const can = `${tenBass ? `bass ${tenBass} rồi ` : ''}${c.ssa.tenChong}${tenBass ? ' ở trên' : ''}`
  const ai = c.ssa.loai === 'thay' ? 'thầy' : 'anh SSA'
  if (muc === 'khong')
    return {
      kq: 'sai',
      chu:
        c.ssa.loai === 'nhu-anh'
          ? `${ten} — anh không đánh nốt này trên ${c.ten}, cũng không có trong tên hợp âm.`
          : c.ssa.loai === 'thay'
            ? `${ten} — thầy không đánh nốt này trên ${c.ten}.`
            : `${ten} — nốt tránh / ngoài khung của ${c.ten}.`,
    }
  const i = xongChong(c, daChay)
  if (i < 0) {
    if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} không thuộc thế chồng — chồng trước: ${can}.` }
    const moi = [...daChay, note]
    if (xongChong(c, moi) < 0) return { kq: 'tiep', daChay: moi }
    if (c.ssa.soChay === 0) return { kq: 'dung' }
    return { kq: 'tiep', daChay: moi, chu: `Chồng đủ ${tenBass ? `${tenBass} + ` : ''}${c.ssa.tenChong} — giờ chạy ${c.ssa.soChay} nốt trên đỉnh.` }
  }
  if (muc !== 'chinh') return { kq: 'bo', chu: `${ten} có trong khung nhưng ${ai} ít đặt nốt này trên ${c.ten} — chưa tính.` }
  if (daChay.length > i + 1 && daChay[daChay.length - 1] === note) return { kq: 'bo', chu: 'Gõ lại đúng phím vừa rồi không tính — đổi nốt.' }
  const moi = [...daChay, note]
  return moi.length - i - 1 >= c.ssa.soChay ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}

/** Mẫu nghe khi đúng — bass + thế gần Đô giữa, rồi bốn nốt chạy nên chọn, đi lên; như anh: tay trái + thế anh bấm, rồi nốt anh chạy. */
export function mauSsa(c: Pick<CauSsa, 'g' | 'ssa'>): number[][] {
  if (c.ssa.loai === 'nhu-anh') return [[...c.ssa.loTrai, ...c.ssa.the[0]!], ...c.ssa.chay.slice(0, SO_NOT_CHAY).map((m) => [m])]
  const the = c.ssa.the.find((t) => t[0]! >= 55) ?? c.ssa.the[0]!
  let tren = the[the.length - 1]!
  const chay = c.ssa.dinh.slice(0, SO_NOT_CHAY).map((p) => {
    let m = tren + 1
    while (pc(m) !== p) m++
    tren = m
    return [m]
  })
  return [[c.ssa.loTrai[0] ?? 36 + pc(c.g), ...the], ...chay]
}

/* ---------------- Backing track — Mưa khung nốt có nền (người dùng 15/10/2026: "Cho Mục lối SSA và các thầy khác có nhạc backing track
   để solo trên đó") ---------------- */

export interface VongNen {
  ten: string
  /** Viên của từng hợp âm trong vòng, theo thứ tự. */
  cau: CauSsa[]
  /** Số phách từng hợp âm. */
  nhip: number[]
  /** Nền một lượt (máy đánh), phát lặp theo vòng. */
  nen: readonly ScheduledHit[]
  /** Nền là trống (`beatNen.ts`) — gõ một ô hi-hat đếm vào trước khi nền vào. */
  demTrong?: boolean
  /** Chu kỳ lặp của nền (phách), khác độ dài cả vòng viên: nền beat lặp từng chu kỳ trống (một hay hai ô). */
  chuKyNen?: number
  /** Số phách đếm vào (nền beat: đúng một ô). */
  demVao?: number
  /** Ký hiệu nhịp độ trên màn chơi: '♩' (mặc định) · '♪' (6/8 của app đếm móc đơn). */
  kyHieuNhip?: string
}

/* ---------------- Lối SSA trên backing track (thử) — vòng của anh SSA, đệm điệu Cà Pháo ---------------- */

/*
  Người dùng 15/10/2026 bác bản backing "đúng vòng anh chơi" (nền bass + rải 5 – 8, mỗi hợp âm dài theo clip — đã xoá): "bạn làm phần backing
  track của SSA dở quá, dở cả về nhạc backing track lẫn tính năng. Sao bạn không thêm tính năng backing track trong mục Lối SSA như hình. Hãy
  chọn vòng hợp âm trong các clip SSA rồi làm backing track theo các điệu ballad hoặc bossa của Cà Pháo. Trong vai nhạc sĩ bạn hãy thử đánh
  giá xem những nốt nào sẽ nên chơi khi đến hợp âm tương ứng thì hãy làm nổi bật nó lên so với các nốt còn lại trong khung. Bạn có thể tận
  dụng các bộ soạn nốt để lấy kinh nghiệm quyết định".
  - Vòng (`VONG_SSA`): chọn từ ba clip — hợp âm theo nhãn màn hình của anh (`ssaNhuAnh.json`), mỗi hợp âm một ô 4 phách; hợp âm anh giữ dài
    gấp đôi thì hai ô; hợp âm lướt (≤ 1,5 s kẹp giữa hai hợp âm chính) bỏ; tên gọn về loại app có. Chọn vòng và gọn tên là của Claude.
  - Đệm: bốn điệu Cà Pháo đã duyệt (nút trang Cà Pháo), dựng bằng `dungVong` như Tập solo — nguyên hai tay (GameKhungRoi).
  - Viên: lối chồng + chạy của màn Lối SSA — thế anh nếu loại ấy anh có đo (`CHONG`); gạch chéo thì chồng chính hợp âm trên bass sau gạch
    (như anh: A♭7/G♭ = G♭ + A♭–C–E♭, Rai 3 · 0:19); còn lại công thức chồng của app.
  - Nốt nên chơi (`nenChoiVong`) — đánh giá của Claude trong vai nhạc sĩ, dựa trên số đo "nốt vào hợp âm" (nốt tay phải cao nhất ở phách đầu
    mỗi hợp âm của ba bộ soạn, 24 lượt × 3 đoạn × Đô trưởng · La thứ; nốt trên cùng thế anh SSA mỗi hợp âm — đo 15/10/2026):
      · vào hợp âm bằng nốt của hợp âm: bộ soạn Cà Pháo 734/750, anh SSA 106/110;
      · anh SSA đặt nốt MÀU trong tên (9 · 11 · 13 · ♯11 · ♭9) lên đỉnh 40/110 lần vào hợp âm, bộ soạn Cà Pháo 90/750 — màu trên đỉnh là
        chữ ký của anh;
      · vào bằng nốt liền bậc (≤ 1 cung) hay giữ nguyên nốt trước: anh SSA 56/110, Cà Pháo 302/750, Linh Nhi 829/1 187; liền bậc nhiều
        gấp ba giữ nguyên (SSA 42 · 14, Cà Pháo 218 · 84) — đổi nốt để nghe ra hợp âm vừa đổi;
      · hợp âm thứ: Cà Pháo vào bằng ♭3 · ♭7 151/282.
    Nên mỗi hợp âm hai nốt ★: nốt MÀU (nốt đuôi mang lại, theo thứ tự `Khung.dinh` — số đo SSA nếu loại ấy anh có đo) và nốt NỐI — nốt hợp
    âm đi tới được từ một nốt ★ của hợp âm trước bằng đường đẹp nhất: nửa cung (3,2) > một cung (3) > giữ nguyên (2,5) > quãng 3 (1) > nhảy
    (0); cộng 1 nếu là nốt mới (không có trong hợp âm trước — nghe ra hợp âm vừa đổi); cộng theo vai: bậc 3 1,2 · bậc 7 / 4 treo / nốt màu
    khác 1 · bậc 5 0,5 · gốc −1,5 (anh SSA đặt gốc trên đỉnh 13/110 lần vào hợp âm). Điểm là của Claude, soát tay trên cả năm vòng (vd V – I
    ra G♭ → F, ♭7 xuống 3; 4 – 4 thứ – 3 ra B♭♭ → A♭, đường nửa cung đi xuống). Nốt bass gạch chéo không làm ★ — tay trái đã giữ nó.
*/

export interface VongSsa {
  id: string
  ten: string
  /** Chủ âm (lớp cao độ) — giọng của clip, trưởng. */
  tonic: number
  /** Mỗi ô 4 phách một hợp âm. */
  o: readonly string[]
  /** Lấy từ đâu trong clip. */
  nguon: string
}
export const VONG_SSA: readonly VongSsa[] = [
  {
    id: 'rai3-4536251',
    ten: 'Rai 3 · 4536251 — vòng ballad Hoa ngữ (Rê♭ trưởng)',
    tonic: 1,
    o: ['Gbmaj9', 'Ab7/Gb', 'Fm7', 'Bbm9', 'Ebm9', 'Ab13sus4', 'Dbmaj9', 'Dbmaj9'],
    nguon: 'Rai 3 · 0:15 – 0:43: G♭maj9 · A♭7/G♭ · Fm7 · B♭m9 · E♭m9 · A♭13sus · D♭maj9 (D♭maj9 anh giữ 6,5 s — hai ô); bỏ hai hợp âm lướt D♭maj9sus4 (0,5 s), B♭7sus2 (1,5 s).',
  },
  {
    id: 'rai3-iv-thu',
    ten: 'Rai 3 · 4 – 4 thứ – 3 – 6 – 2 – 5 (Rê♭ trưởng)',
    tonic: 1,
    o: ['Gbmaj9', 'Gbm6', 'Fm7', 'Bbm9', 'Ebm11', 'Ebm11', 'Ab13sus4', 'Ab13sus4'],
    nguon: 'Rai 3 · 0:01 – 0:15: G♭maj9(13) 2 s · G♭m6 1,5 s · Fm7 2 s · B♭m9 1,5 s · E♭m9(11) 3,5 s · A♭13sus(♭9) 3,5 s — hai hợp âm cuối anh giữ dài gấp đôi nên hai ô; G♭m6 là iv thứ mượn.',
  },
  {
    id: 'rai2-hong-kong',
    ten: 'Rai 2 · ballad Hồng Kông (La♭ trưởng)',
    tonic: 8,
    o: ['Dbmaj9', 'Abmaj9/C', 'Bbm11', 'Eb13sus4', 'Dbmaj7', 'Eb7/Db', 'Cm7', 'Fm11'],
    nguon: 'Rai 2 · 0:11 – 0:17 (D♭maj9 · A♭maj9/C · B♭m9(11) · E♭13sus) và 0:33 – 0:38 (D♭maj7 · E♭7/D♭ · Cm7 · Fm7; Fm11 theo Fm9(11) 0:31) — bass đi xuống liền bậc, E♭7/D♭ giữ bass D♭ đổi tay phải.',
  },
  {
    id: 'rai1-giu-giai-dieu',
    ten: 'Rai 1 · giữ giai điệu, đổi hợp âm (Đô trưởng)',
    tonic: 0,
    o: ['Cmaj9', 'Am11', 'Dm9', 'Dbaug', 'Dm9/C', 'Bm7b5', 'E7b9', 'Am11'],
    nguon: 'Rai 1 · 0:00 – 0:16: Cmaj9 · Am9(11) · Dm9 · Dm(maj7)/D♭ · Dm9/C · Bm7♭5 · E · Am9(11) — D♭aug thay Dm(maj7)/D♭ (bass đi xuống Rê – Rê♭ – Đô – Si), E7♭9 theo 0:27.',
  },
  {
    id: 'rai1-muon',
    ten: 'Rai 1 · mượn hợp âm về trưởng (Đô trưởng)',
    tonic: 0,
    o: ['Am11', 'F#m7b5', 'Fm(maj7)', 'F/G', 'Bb7#11', 'Bb7#11', 'Cmaj7', 'Cmaj7'],
    nguon: 'Rai 1 · 0:30 – 0:49: Am7(11) · F♯m7♭5(11) · Fm(maj7)(13) · F(add2)/G · B♭7(♯11) 3 s · C … Cmaj7 — Fm(maj7), B♭7(♯11) mượn từ Đô thứ ("có cảm giác nắng").',
  },
]

/** Một nốt nên chơi khi vào hợp âm. */
export interface NotNen {
  /** Lớp cao độ. */
  p: number
  ten: string
  bac: string
  /** 'mau' — nốt màu của hợp âm; 'noi' — nối từ nốt ★ của hợp âm trước. */
  vai: 'mau' | 'noi'
  ly: string
}

/** Khoảng ngắn nhất giữa hai lớp cao độ (0 – 6 nửa cung). */
const khoang = (a: number, b: number) => Math.min(pc(b - a), pc(a - b))
/** Điểm đường đi theo khoảng (nửa cung): nửa cung · một cung · giữ nguyên · quãng 3; xa hơn 0. */
const DIEM_BUOC: readonly number[] = [2.5, 3.2, 3, 1, 1]
const tenLoai = (k: Khung) => k.loai?.ten ?? (k.ten.replace(/^[A-G][♭♯]*/, '').replace(/\/.*$/, '') || 'hợp âm ba')

/** Hai nốt nên chơi khi vào từng hợp âm của vòng `ks` (vòng lặp: hợp âm đầu nối từ hợp âm cuối) — xem chú thích đầu mục. */
export function nenChoiVong(ks: readonly Khung[]): NotNen[][] {
  const n = ks.length
  const ra: NotNen[][] = ks.map(() => [])
  const tru = (k: Khung) => k.not.filter((x) => x.muc === 'chinh')
  // Hai lượt: lượt đầu hợp âm đầu chưa có ★ của hợp âm cuối — tạm nối từ mọi nốt hợp âm của nó.
  for (let lap = 0; lap < 2; lap++)
    ks.forEach((k, i) => {
      const t = ks[(i + n - 1) % n]!
      const ten = (p: number) => bo8(tenPhim(k, 60 + p))
      const dinh = k.dinh.map((iv) => pc(k.goc + iv)).filter((p) => p !== k.bass)
      const mauP = dinh.find((p) => k.not.some((x) => x.p === p && x.dau)) ?? dinh[0]!
      const mau = k.not.find((x) => x.p === mauP)!
      const sao = ra[(i + n - 1) % n]!.map((x) => x.p)
      const tu = sao.length ? sao : tru(t).map((x) => x.p)
      const cu = new Set([...tru(t).map((x) => x.p), ...(t.bass !== null ? [t.bass] : [])])
      const treo = !k.quang.includes(3) && !k.quang.includes(4)
      /** Đường đẹp nhất tới `x` từ các nốt ★ trước: nốt nguồn và điểm đường đi. */
      const duong = (x: NotKhung) =>
        tu
          .map((p) => ({ p, d: khoang(p, x.p) }))
          .map((o) => ({ ...o, s: DIEM_BUOC[o.d] ?? 0 }))
          .reduce((a, o) => (o.s > a.s || (o.s === a.s && o.d < a.d) ? o : a))
      const hang = (x: NotKhung) => {
        const o = duong(x)
        const vai = [3, 4].includes(x.iv) ? 1.2 : [10, 11].includes(x.iv) || (treo && x.iv === 5) || x.dau ? 1 : x.iv === 7 ? 0.5 : x.iv === 0 ? -1.5 : 0
        return o.s + (cu.has(x.p) ? 0 : 1) + vai - o.d / 100
      }
      const noi = tru(k)
        .filter((x) => x.p !== mauP && x.p !== k.bass)
        .sort((a, b) => hang(b) - hang(a))[0]
      const ds: NotNen[] = [{ p: mauP, ten: ten(mauP), bac: mau.bac, vai: 'mau', ly: mau.dau ? `màu ${mau.bac} của ${tenLoai(k)}` : `nốt đặc trưng của ${tenLoai(k)}` }]
      if (noi) {
        const { p: tuP, d } = duong(noi)
        const tenT = bo8(tenPhim(t, 60 + tuP))
        const moi = !cu.has(noi.p)
        const ly =
          d === 0
            ? `giữ ${tenT} từ ${t.ten} — nốt chung, nối êm`
            : d <= 2
              ? `${pc(noi.p - tuP) <= 6 ? 'lên' : 'xuống'} ${d === 1 ? 'nửa cung' : 'một cung'} từ ${tenT} của ${t.ten}${moi ? ' — nốt mới, nghe rõ hợp âm vừa đổi' : ''}`
              : `gần ${tenT} của ${t.ten} nhất (${d} nửa cung)${moi ? ' — nốt mới' : ''}`
        ds.push({ p: noi.p, ten: ten(noi.p), bac: noi.bac, vai: 'noi', ly })
      }
      ra[i] = ds
    })
  return ra
}

/** Viên chồng + chạy cho một hợp âm của vòng (khung `k` theo giọng của vòng), kèm nốt nên chơi `nen`. */
function taoCauVong(k: Khung, nen: readonly NotNen[], id: string): CauSsa {
  const g = k.goc
  const bass = k.bass ?? g
  const ten = (m: number) => bo8(tenPhim(k, m))
  const ssaThe = k.bass === null && k.loai ? CHONG[k.loai.id] : undefined
  let chong: number[]
  let the: number[][]
  let loTrai: number[]
  let tenChong: string
  let nguonThe: string
  if (ssaThe) {
    chong = ssaThe.iv.map((x) => pc(g + x))
    the = theChong(g, ssaThe.iv)
    loTrai = traiHo(g)
    tenChong = `${ten(60 + pc(g + ssaThe.iv[0]!))}${HAU[ssaThe.iv.map((x) => x - ssaThe.iv[0]!).join(',')] ?? ''}`
    nguonThe = 'thế anh SSA (đo bằng hình)'
  } else if (k.bass !== null) {
    // Gạch chéo: tay phải chồng chính hợp âm, bỏ nốt trùng bass nếu còn ≥ 3 nốt (A♭7/G♭ → A♭–C–E♭; A♭/C giữ đủ ba nốt).
    const bo = k.quang.filter((x) => pc(g + x) !== bass)
    const iv = bo.length >= 3 ? bo : k.quang
    chong = [...new Set(iv.map((x) => pc(g + x)))]
    the = theChong(g, iv)
    loTrai = [36 + bass, 48 + bass].filter((m) => m < CHIA_TAY)
    tenChong = the[0]!.map(ten).join('–')
    nguonThe = 'chính hợp âm, bass là nốt sau gạch chéo (như anh: A♭7/G♭ = G♭ + A♭–C–E♭)'
  } else {
    const s = chongSsa(k)
    const phai = [...s.phai].sort((a, b) => a - b)
    chong = [...new Set([...s.trai, ...phai].map(pc))].filter((p) => p !== g)
    loTrai = [...new Set(s.trai)].sort((a, b) => a - b)
    the = trenTrai(theChong(g, phai.map((m) => m - (60 + g))), loTrai)
    tenChong = s.ten.includes(' + ') ? s.ten.slice(s.ten.indexOf(' + ') + 3) : phai.map(ten).join('–')
    // Công thức gọi gốc bằng dấu thăng — giọng dấu giáng (Rê♭ · La♭) đổi sang giáng: G♭m6 = G♭ + E♭dim, không phải D♯dim.
    if ([1, 3, 5, 6, 8, 10].includes(k.tonic)) tenChong = tenChong.replace(/^[A-G]♯/, (x) => GIANG[x] ?? x)
    nguonThe = 'công thức chồng của app'
  }
  const lo = [...new Set([...loTrai, ...the.flat().sort((a, b) => a - b)])]
  // Nốt chạy được tính: nốt hợp âm + nốt đỉnh nên chọn của loại + nốt thế + bass gạch chéo (F/G: Sol là gốc của tiếng 9sus nghe ra).
  const dinh = [...new Set([...[...k.dinh, ...k.quang].map((iv) => pc(g + iv)), ...chong, bass, ...nen.map((x) => x.p)])]
  const tenBass = ten(60 + bass)
  const nhac = chong.map((p) => ten(60 + p)).join(' – ')
  const sao = nen.map((x) => `${x.ten} (${x.bac}) — ${x.ly}`).join(' · ')
  return {
    id,
    ten: k.ten,
    g,
    k,
    khungTen: `${tenBass} + ${tenChong}`,
    quyTac: `bass ${tenBass} + ${tenChong} (${nhac})`,
    goiY: `★ ${nen.map((x) => x.ten).join(' · ')}`,
    loi: `${k.ten} = ${tenBass} + ${tenChong}. Nên chơi khi vào: ${sao}.`,
    meo: `${k.ten}: tay trái ${tenBass}, tay phải ${tenChong} (${nhac}) — rồi chạy ${SO_NOT_CHAY} nốt, vào bằng ★ ${nen.map((x) => x.ten).join(' · ')}. ${sao}.`,
    dapAnTen: '',
    luaChon: [],
    ssa: { loai: 'vong', bass, chong, tenChong, the, loTrai, lo, dinh, vai: vaiKhung(k, dinh), soChay: SO_NOT_CHAY, chay: [], nguonThe, nen: [...nen] },
  }
}

/** Viên của cả vòng `v` (giọng của clip) theo thứ tự, mỗi viên kèm nốt nên chơi. */
export function cauVongSsa(v: VongSsa): CauSsa[] {
  const ks = khungVong(v.o.join(' '), v.tonic, false)
  const nen = nenChoiVong(ks)
  return ks.map((k, i) => taoCauVong(k, nen[i]!, `${v.id}:${i}`))
}

const TEN_DOAN: Readonly<Record<Doan, string>> = { intro: 'Dạo', interlude: 'Giang tấu', outro: 'Kết' }

/**
 * Vòng nền của thầy: bộ soạn của thầy tự chọn vòng (`soanTuDo` — như nghe – đáp của Game chạy ngón), viên từng hợp âm theo lối chồng + chạy
 * của thầy (chỗ đứng bộ soạn chưa đo thì nốt chính là nốt hợp âm); nền là tay trái của bộ soạn + thế tay phải có màu (như lượt bạn ở nghe –
 * đáp). Hợp âm gạch chéo: bass là nốt sau gạch.
 */
export function vongThay(thay: ThayChay, tonic: number, thu: boolean, kind: Doan, take: number): VongNen | null {
  const c = soanTuDo(thay, tonic, thu, kind, take)
  const hop = c ? docHop(c.chords.join(' ')) : null
  if (!c || !hop || hop.length !== c.chords.length) return null
  const cau = hop.map((h, i) => {
    const goc = pc(h.root - tonic)
    const cho = timCho(thay, h.quality.symbol, goc, thu) ?? { duoi: h.quality.symbol, goc, thu, soLan: 0, n: 0, dem: Array<number>(12).fill(0) }
    const v = taoCauThayChong(thay, cho, tonic, `nen:${i}`)
    if (h.bass === undefined || pc(h.bass) === pc(h.root)) return v
    const b = pc(h.bass)
    const tenB = bo8(tenPhim(v.k, 60 + b))
    return {
      ...v,
      ten: `${v.ten}/${tenB}`,
      ssa: { ...v.ssa, bass: b, loTrai: [36 + b], lo: [36 + b, ...v.ssa.lo.filter((m) => !v.ssa.loTrai.includes(m))] },
    }
  })
  return { ten: `${tenThayCua(thay)} · ${TEN_DOAN[kind]}`, cau, nhip: [...c.beatsEach], nen: [...c.events.filter((e) => e.hand === 'left'), ...c.nen] }
}
