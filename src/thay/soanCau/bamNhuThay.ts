import { detectChords } from '../../shared/musicTheory/chordDetection'
import type { Hop } from './giaiThich'
import theBamThay from './theBamThay.json'

/*
  BẤM NHƯ THẦY — người dùng 9/10/2026: "Hãy cho thêm tính năng dạy bấm hợp âm như từng thầy. Hãy phân tích cách các thầy xếp ngón khi bấm
  các hợp âm và khi chuyển hợp âm thì từng thầy đã xếp ngón thế nào … Nhớ phân tích luôn cách các thầy dùng các thế đảo và slash chord".
  Số đo: `tools/the_bam_thay.py` → theBamThay.json (tay trái, tay phải, bass vào hợp âm, slash, đường bass, chuyển hợp âm; đoạn đánh theo
  là nốt THẬT trong sheet). Sheet không ghi số ngón (0/21 sheet) — ngón ở đây là Claude gợi ý theo luật bàn tay, KHÔNG phải số đo.
*/

export type ThayBam = 'linh-nhi' | 'ca-phao' | 'blues'
export interface DoanBam {
  bai: string
  doan: string
  tonic: number
  thu: boolean
  giong: string
  /** [gốc tính từ chủ âm, chất theo ký hiệu, bass tính từ chủ âm hay null khi bass là gốc] */
  hop: [number, string, number | null][]
  /** Nốt thật: cú đầu tay trái, cụm tiêu biểu tay phải. */
  the: { trai: number[]; phai: number[] }[]
}
export interface SoDoBam {
  khuc: number
  co_trai: number
  co_phai: number
  bass_bac: [string, number][]
  trai_dau: [string, number][]
  trai_mau: [string, number][]
  phai_hinh: [string, number][]
  phai_day: [string, number][]
  phai_kep: number
  slash: [string, number, string][]
  duong_bass: string[]
  chuyen: { n: number; giu: number; lien: number; doi_tb: number }
  bass_chuyen: { n: number; dung: number; lien: number; ba: number; bon_nam: number; xa: number }
}
export const BAM_THAY = theBamThay as unknown as Record<ThayBam, { so: SoDoBam; doan: DoanBam[] }>

const pc = (x: number) => ((x % 12) + 12) % 12

/**
 * Ngón gợi ý cho một cụm (Claude — luật bàn tay, không phải số đo): tay phải ngón 1 ở nốt thấp nhất, 5 ở nốt cao nhất; nốt giữa chọn
 * theo khe: khe dưới hẹp (≤ 3 nửa cung) mà khe trên rộng thì ngón 2 (Mi–Sol–Đô: 1-2-5), còn lại ngón 3; bốn nốt: khe trên rộng nhất thì
 * 1-2-3-5, khe dưới rộng nhất thì 1-3-4-5, còn lại 1-2-4-5. Tay trái là tay phải soi gương (5 ở nốt thấp nhất). Trên 5 nốt: null.
 */
export function ngonGoiY(notes: readonly number[], tay: 'trai' | 'phai'): number[] | null {
  const ds = [...notes].sort((a, b) => a - b)
  const g = tay === 'phai' ? ds : ds.map((m) => -m).reverse()
  const n = g.length
  let ngon: number[]
  if (n === 0 || n > 5) return null
  if (n === 1) ngon = [1]
  else if (n === 2) {
    const d = g[1]! - g[0]!
    ngon = [1, d <= 2 ? 2 : d <= 4 ? 3 : d <= 7 ? 4 : 5]
  } else if (n === 3) {
    const [duoi, tren] = [g[1]! - g[0]!, g[2]! - g[1]!]
    ngon = [1, tren > duoi ? (duoi <= 3 ? 2 : 3) : tren <= 2 ? 4 : 3, 5]
  } else if (n === 4) {
    const [k1, k2, k3] = [g[1]! - g[0]!, g[2]! - g[1]!, g[3]! - g[2]!]
    ngon = [1, ...(k3 >= k1 ? [2, 3] : k1 >= k2 ? [3, 4] : [2, 4]), 5]
  } else ngon = [1, 2, 3, 4, 5]
  if (tay === 'trai') ngon = n === 1 ? [5] : ngon.reverse()
  return ngon
}

/** Hợp âm một bước của đoạn thầy: tên đọc từ nốt bấm thật (7, 9, 11 …) khi bộ nhận ra cùng gốc với ký hiệu; không thì giữ ký hiệu. */
export function hopTheoNot(tonic: number, h: DoanBam['hop'][number], t: DoanBam['the'][number]): Hop {
  const goc = pc(tonic + h[0])
  const m = detectChords([...t.trai, ...t.phai], { maxResults: 12 }).find((x) => x.root === goc)
  const chat = m ? m.quality.symbol : h[1]
  return h[2] === null ? { goc: h[0], chat } : { goc: h[0], chat, bass: h[2] }
}

/**
 * Đọc kết quả từng thầy — lời Claude đọc từ số đo theBamThay.json (9/10/2026); ví dụ có tên đã soát tay từng nốt; mọi con số có test giữ
 * (bamNhuThay.test.ts). Chỗ "nghe ra sao", "muốn bấm như thầy" là ý Claude, không phải số đo.
 */
export const LOI_BAM_THAY: Readonly<Record<ThayBam, string>> = {
  'linh-nhi':
    'Thế bấm của Linh Nhi nằm ở tay trái. Cú đầu mỗi hợp âm là một nốt bass (500/672 khúc) hay quãng tám (123/672), rồi rải lên trong khúc: 1–5–8 (73 khúc), 1–5–8 thêm quãng mười (79 khúc). Nốt mười cho tay trái hát luôn bậc 3, nên tay phải rảnh để đi giai điệu: chỉ 139/676 khúc có cụm tay phải từ 3 nốt, phần lớn là hợp âm ba đặt ngay dưới giai điệu (nốt thấp nhất của cụm: gốc 40 · bậc 5 36 · bậc 3 32) hay quãng tám kẹp giữa (43/139). Bass vào hợp âm ở gốc 485/672 (72%); thế đảo chị dùng để bass đi liền bậc — rõ nhất Am – D/F♯ – G ở Mùa Xuân Đầu Tiên (bass La – Fa♯ – Sol, nốt dẫn nửa cung lên chủ âm). Bass bậc 5 (53) và v/♭3 (17, gần hết ở Rừng Lá Thấp) có thể lẫn bass luân phiên 1–5 và chỗ ký hiệu lệch tay trái — chưa tách, đừng học theo số ấy. Muốn bấm như chị: tay trái rải 1–5–8 (thêm 10 nếu với tới), tay phải giữ giai điệu ở trên, thế đảo ở bass khi muốn bass đi liền bậc. Tay trái rải của chị có sẵn ở tab Điệu; đoạn hai tay đủ sạch để đánh theo chỉ có một.',
  'ca-phao':
    'Cà Pháo bấm ngược Linh Nhi: tay trái gọn — cú đầu là một nốt bass ở 345/430 khúc — còn hợp âm dồn lên tay phải: 254/438 khúc có cụm từ 3 nốt. Cụm ấy giàu màu: nốt thấp nhất là ♭7 ở 46/254 cụm, bậc 9 ở 17, bậc 4 ở 17 — thầy hay bấm hợp âm thiếu gốc, để gốc cho tay trái, như verse Người Hãy Quên Em Đi: Dm9 bấm Đô–Mi–Fa–La, C9 bấm Si♭–Rê–Mi–Sol. Khi giai điệu cần nổi, thầy kẹp một nốt hợp âm giữa quãng tám của giai điệu (116/254 cụm). Chuyển hợp âm: giữ ít nhất một nốt chung 77/147 lần, mỗi nốt dời trung bình 3,1 nửa cung. Thế đảo để bass đi xuống từng bậc: Để Em Rời Xa — Dm/C – B♭/A – Dm/G (bass Đô – La – Sol), Ngày Mai Em Đi — A♭ – Cm/G – Fm (bass La♭ – Sol – Fa); và IV đặt trên bass V (F/G ở Hồng Kông 1) thay cho V. Muốn bấm như thầy: tay trái chỉ bass (đổi thế đảo khi muốn bass đi liền bậc), tay phải bấm 7 – 9 – 3 – 5 thay cho 1 – 3 – 5, giữ nốt chung khi đổi hợp âm.',
  blues:
    'Blues (Ray Charles, Robert): tay trái bass đơn (120/224 cú đầu) hay quãng tám (73/224); tay phải bấm hợp âm bảy, chín thiếu gốc — nốt thấp nhất là ♭7 ở 22/113 cụm (♭7–3–5, 4–♭7–9, 5–♭7–9) — và chồng ♭3 sát 3 (nốt blue) ngay trong cụm. Ray Charles đổi thế ngay trên một hợp âm (G7 bốn thế liền ở Rockhouse) chứ không chỉ đổi khi đổi hợp âm. Robert cho bass trượt nửa cung xuống qua hợp âm giảm: C/E – E♭°7 – Dm (bass Mi – Mi♭ – Rê). Chuyển hợp âm: giữ nốt chung 39/66 lần, mỗi nốt dời trung bình 2,7 nửa cung.',
}

/** Quãng (nửa cung) trên bass → bậc đọc được: 7 → 5, 12 → 8, 16 → 10. */
export const BAC_TREN_BASS: Readonly<Record<number, string>> = {
  0: '1',
  2: '2',
  3: '♭3',
  4: '3',
  5: '4',
  7: '5',
  9: '6',
  10: '♭7',
  11: '7',
  12: '8',
  14: '9',
  15: '♭10',
  16: '10',
  17: '11',
  19: '12',
  24: '15',
}
