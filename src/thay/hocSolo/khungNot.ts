import type { ScheduledHit } from '../../shared/audio/audioEngine'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import type { MidiNote } from '../../shared/musicTheory/types'
import { CONG_THUC, gocDep, tenTrongGiong } from '../soanCau/chongHopAm'
import { nguCanh, type Hop } from '../soanCau/giaiThich'
import { GOC as GOC_TEN } from '../vongThay'
import { gamTrenHop } from './sinhSolo'

/*
  KHUNG NỐT THEO LOẠI HỢP ÂM — game chạy ngón làm lại (người dùng 14/10/2026): "chỉnh sửa game chạy ngón lại ko phải kiểu đưa ra nốt rơi
  sẵn để tôi đánh nữa mà hãy đổi sang hướng dạy tôi biết khi gặp những loại hợp âm thì sẽ có thể nhận ra khung nốt tương ứng để tự chọn
  mà tạo câu solo … Khi gặp các nhóm đuôi hợp âm (ví dụ như maj7, m7b5, dim7, 13b9, 11, 13...) thì bạn sẽ đưa ra khung nốt và gợi ý cho
  tôi các nốt nên đánh trong khung đó … 1 là cho tôi làm quen với các nhóm đuôi … 2 là sẽ học solo theo kiểu giống trong các clip Rai
  Ngon, cho backing track chạy theo vòng các hợp âm màu lẫn cơ bản".

  KHUNG = gam trên hợp âm (`gamTrenHop`: gam của bài viết theo chữ, nốt hợp âm thay đúng nốt cùng chữ) — cùng một hàm cho cả hai kiểu chơi.
  Kiểu làm quen không có bài nên mỗi loại có một "giọng nhà" (chỗ loại ấy hay đứng: maj7 ở I, m7 ở ii, 7♭9 ở V của giọng thứ …). Ba mức
  như mọi bàn phím của trang (`HocSoloPage` · `mucCua`): chính = nốt của hợp âm (kể cả nốt căng có trong tên); phụ = nốt khung còn lại;
  không màu = nốt tránh (nửa cung trên một nốt hợp âm; hợp âm treo: bậc 3) và nốt ngoài khung.

  SỐ ĐO SSA (ba clip "Rải Ngón" của SSA, D:\PianoBrain\video\Rai ngon SSA; chép nốt piano_transcription_inference; hợp âm đọc từ nhãn
  màn hình 2 khung/giây; KeyTrain/tools/do_rai_ssa.py, 15/10/2026): 111 đoạn hợp âm; 98,7 % nốt chép nằm trong nhãn (1087/1101).
  - Tay trái chỉ giữ bass: trung vị 1 nốt mỗi đoạn; ≥ 3 nốt (rải tay trái) 29/111 đoạn.
  - Tay phải mỗi họ đuôi là một hợp âm ba quen dựng trên một bậc của hợp âm (bảng `SSA` dưới).
  - Nốt giai điệu (nốt tay phải cao nhất đang vang, bỏ nốt giữa chuỗi rải lên): nốt hợp âm 175/241, nốt căng có trong tên 63/241, ngoài
    3/241. Đổi bass mà giữ ≥ 2 nốt tay phải: 32/94 chỗ đổi bass.
  Thứ tự gợi ý nốt đỉnh (`dinh`): họ có số đo SSA thì theo số đo; họ khác là lý thuyết của Claude (nốt dẫn 3 · 7 + nốt đuôi mang lại).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type MucKhung = 'chinh' | 'phu' | 'khong'

/** Số đo SSA theo họ đuôi: nốt giai điệu (bậc so gốc hợp âm, số lần), khung tay phải, ví dụ có thời điểm trong clip. */
export interface SoDoSsa {
  ten: string
  n: number
  giaiDieu: readonly (readonly [string, number])[]
  khungPhai: string
  vd: string
}
export const SSA = {
  maj: {
    ten: 'maj7 · maj9',
    n: 64,
    giaiDieu: [['7', 26], ['9', 14], ['3', 9], ['1', 8], ['5', 5], ['13', 2]],
    khungPhai: 'hợp âm ba thứ dựng trên bậc 3 (3 – 5 – 7); thêm 9 thì tay phải thành m7 trên bậc 3',
    vd: 'Rai 2 · 0:11 — tay trái D♭ + tay phải F – A♭ – C – E♭ (Fm7) = D♭maj9',
  },
  thu: {
    ten: 'm7 · m9 · m11',
    n: 83,
    giaiDieu: [['♭3', 27], ['9', 16], ['♭7', 15], ['11', 12], ['5', 9], ['1', 2], ['13', 1], ['♭13', 1]],
    khungPhai: 'hợp âm ba trưởng dựng trên ♭3 (♭3 – 5 – ♭7), 9 và 11 đặt trên đỉnh',
    vd: 'Rai 1 · 0:05 — tay trái La + tay phải Mi – Sol, giai điệu Đô – Rê – Si trên đỉnh = Am9(11)',
  },
  treo: {
    ten: '7sus · 9sus · 13sus',
    n: 23,
    giaiDieu: [['5', 7], ['13', 7], ['4', 3], ['9', 2], ['11', 2], ['1', 1], ['♭7', 1]],
    khungPhai: 'hợp âm ba trưởng dựng trên ♭7 (♭7 – 9 – 4)',
    vd: 'Rai 3 · 1:07 — anh SSA: "Cb/Db thực ra là Db9sus4" (C♭ trưởng trên bass D♭)',
  },
  atMau: {
    ten: '7 có nốt căng (♭9 · ♯11 · 13 · ♯5)',
    n: 13,
    giaiDieu: [['♭9', 3], ['♯11', 3], ['1', 2], ['3', 2], ['5', 1], ['13', 1], ['♯9', 1]],
    khungPhai: '3 và ♭7 giữ ở dưới, nốt căng nằm trên đỉnh',
    vd: 'Rai 1 · 0:43 — B♭7(♯11), giai điệu Mi = ♯11: "mượn hợp âm (modal interchange) … có cảm giác nắng"',
  },
  at: {
    ten: '7',
    n: 11,
    giaiDieu: [['5', 8], ['3', 2], ['♭7', 1]],
    khungPhai: 'hợp âm ba trưởng trên gốc, bass là ♭7 (A♭7/G♭ = bass G♭ + A♭ trưởng)',
    vd: 'Rai 3 · 0:19 — tay trái G♭ + tay phải A♭ – Đô – Mi♭',
  },
  m7b5: {
    ten: 'm7♭5',
    n: 11,
    giaiDieu: [['♭5', 4], ['♭3', 3], ['♭7', 2], ['11', 2]],
    khungPhai: 'hợp âm ba thứ dựng trên ♭3 (♭3 – ♭5 – ♭7)',
    vd: 'Rai 1 · 0:13 — tay trái Si + tay phải Rê – Fa – La = Bm7♭5',
  },
  m6: { ten: 'm6', n: 5, giaiDieu: [['6', 5]], khungPhai: '1 – ♭3 – 5 – 6', vd: 'Rai 3 · 0:47 — G♭m6, hợp âm iv thứ mượn trước hợp âm iii' },
  mMaj7: { ten: 'm(maj7)', n: 5, giaiDieu: [['7', 3], ['1', 2]], khungPhai: '♭3 – 5 – 7', vd: 'Rai 1 · 0:40 — Fm(maj7)(13) trước khi về trưởng' },
  add9: { ten: 'add9', n: 5, giaiDieu: [['5', 4], ['1', 1]], khungPhai: '1 – 9 – 3 – 5', vd: 'Rai 2 · 1:16 — A♭(add2) kết bài' },
} as const satisfies Record<string, SoDoSsa>
export type HoSsa = keyof typeof SSA

export const NHOM_KHUNG = ['Trưởng màu', 'Thứ màu', 'Át', 'Át treo', 'Át có nốt căng', 'Giảm'] as const
export type NhomKhung = (typeof NHOM_KHUNG)[number]

/** Một loại hợp âm để làm quen: giọng nhà (chỗ loại ấy hay đứng), thứ tự gợi ý nốt đỉnh, họ số đo SSA, công thức chồng, lời nghe. */
export interface LoaiKhung {
  /** Ký hiệu loại của app (`findQualityBySymbol`). */
  id: string
  ten: string
  nhom: NhomKhung
  nha: { goc: number; thu: boolean; laMa: string }
  /** Nốt đỉnh nên chọn trước, quãng so gốc (nửa cung). */
  dinh: readonly number[]
  ssa?: HoSsa
  /** `CONG_THUC.id` — cách chồng hai tay. */
  ct?: string
  nghe: string
}
const L = (
  id: string,
  ten: string,
  nhom: NhomKhung,
  nha: [number, boolean, string],
  dinh: readonly number[],
  nghe: string,
  ssa?: HoSsa,
  ct?: string,
): LoaiKhung => ({ id, ten, nhom, nha: { goc: nha[0], thu: nha[1], laMa: nha[2] }, dinh, nghe, ...(ssa ? { ssa } : {}), ...(ct ? { ct } : {}) })

export const LOAI_KHUNG: readonly LoaiKhung[] = [
  L('maj7', 'maj7', 'Trưởng màu', [0, false, 'Imaj7'], [11, 2, 4, 0, 7], 'Mơ màng, sáng mà có chút bóng buồn: nốt 7 nằm sát dưới gốc nửa cung.', 'maj', 'maj7'),
  L('maj9', 'maj9', 'Trưởng màu', [0, false, 'Imaj9'], [2, 11, 4, 7], 'Dày mà trong — nốt 9 làm câu "sang", hay dùng mở và kết bài ballad.', 'maj', 'maj9'),
  L('maj13', 'maj13', 'Trưởng màu', [0, false, 'Imaj13'], [9, 11, 2, 4], 'maj7 thêm 13: rộng, mềm.', 'maj'),
  L('6', '6', 'Trưởng màu', [0, false, 'I6'], [9, 4, 2, 7], 'Ngọt, hơi cổ điển, hợp chỗ kết.', undefined, '6'),
  L('6/9', '6/9', 'Trưởng màu', [0, false, 'I6/9'], [2, 9, 4, 7], 'Mở, lửng — không có bậc 7 nên không cọ nốt nào.', undefined, '69'),
  L('add2', 'add9', 'Trưởng màu', [0, false, 'I(add9)'], [2, 4, 7, 0], 'Trong, mộc: 9 kẹp sát dưới 3 cho tiếng "crunch".', 'add9', 'add9'),
  L('maj7#11', 'maj7♯11', 'Trưởng màu', [5, false, 'IVmaj7♯11'], [6, 11, 2, 4], 'Lydian: sáng, lơ lửng — chỗ tự nhiên nhất là bậc IV.', undefined, 'maj9#11'),
  L('m7', 'm7', 'Thứ màu', [2, false, 'ii7'], [3, 10, 2, 5, 7], 'Êm, buồn nhẹ — thứ màu dùng nhiều nhất.', 'thu', 'm7'),
  L('m9', 'm9', 'Thứ màu', [2, false, 'ii9'], [2, 3, 10, 5], 'Buồn mà sang: 9 nằm giữa gốc và ♭3.', 'thu', 'm9'),
  L('m11', 'm11', 'Thứ màu', [2, false, 'ii11'], [5, 3, 10, 2], 'Mở, thoáng, hơi "jazz" — 11 không chỏi vì cách ♭3 một cung.', 'thu', 'm11'),
  L('m13', 'm13', 'Thứ màu', [2, false, 'ii13'], [9, 3, 10, 2], 'Màu Dorian: thứ mà có tia sáng (13 là bậc 6 trưởng).', 'thu', 'm13'),
  L('m6', 'm6', 'Thứ màu', [0, true, 'i6'], [9, 3, 2, 7], 'Thứ mà bí ẩn, hơi Tây — nốt 6 trưởng.', 'm6', 'm6'),
  L('m(maj7)', 'm(maj7)', 'Thứ màu', [0, true, 'i(maj7)'], [11, 3, 2, 7], 'Căng, như nhạc phim trinh thám — 7 trưởng trên hợp âm thứ.', 'mMaj7', 'mMaj7'),
  L('7', '7', 'Át', [7, false, 'V7'], [4, 10, 2, 9, 7], 'Muốn đi tiếp — 3 và ♭7 kéo về hợp âm sau.', 'at', '7'),
  L('9', '9', 'Át', [7, false, 'V9'], [2, 4, 10, 7], 'Át mềm hơn: 9 làm dịu tiếng 7.', 'at', '9'),
  L('13', '13', 'Át', [7, false, 'V13'], [9, 4, 10, 2], 'Át đầy, ấm — 13 hay nằm trên đỉnh.', 'at', '13'),
  L('7sus4', '7sus4', 'Át treo', [7, false, 'V7sus4'], [5, 10, 7, 2], 'Treo: chưa trưởng chưa thứ, chờ giải về bậc 3.', 'treo'),
  L('9sus4', '9sus4', 'Át treo', [7, false, 'V9sus4'], [2, 5, 10, 7], 'Treo mềm, ấm, kiểu "hát live" — anh SSA dùng thay V7.', 'treo', '9sus4'),
  L('11', '11', 'Át treo', [7, false, 'V11'], [5, 2, 10, 7], 'Như 9sus4: không có bậc 3, nốt 11 nằm chỗ bậc 3.', 'treo', '9sus4'),
  L('13sus4', '13sus', 'Át treo', [7, false, 'V13sus'], [9, 5, 2, 10], 'Treo đầy — 13 trên đỉnh, ấm và rộng.', 'treo'),
  L('7b9', '7♭9', 'Át có nốt căng', [7, true, 'V7♭9 (giọng thứ)'], [1, 4, 10, 8], 'Căng, buồn, kéo mạnh về hợp âm thứ — ♭9 sát trên gốc.', 'atMau', '7b9'),
  L('13b9', '13♭9', 'Át có nốt căng', [7, false, 'V13♭9'], [9, 1, 4, 10], 'Vừa ấm (13) vừa căng (♭9) — màu jazz.', 'atMau', '13b9'),
  L('7#9', '7♯9', 'Át có nốt căng', [7, true, 'V7♯9'], [3, 4, 10, 1], 'Gắt, blues — ♯9 cọ với 3.', 'atMau'),
  L('7#11', '7♯11', 'Át có nốt căng', [2, false, 'II7♯11'], [6, 4, 10, 2, 9], 'Lydian dominant: át mà sáng, lơ lửng — anh SSA gọi là "có nắng".', 'atMau', '13#11'),
  L('7b13', '7♭13', 'Át có nốt căng', [7, true, 'V7♭13 (giọng thứ)'], [8, 4, 10, 1], 'Buồn, kéo về hợp âm thứ — ♭13 rơi xuống 5 của hợp âm sau.', 'atMau', '7b13'),
  L('7#5', '7♯5', 'Át có nốt căng', [7, false, 'V7♯5'], [8, 4, 10, 2], 'Tăng, kéo lên — anh SSA thay D7 bằng D♭(♯5).', 'atMau', '7b13'),
  L('m7b5', 'm7♭5', 'Giảm', [2, true, 'iiø7 (giọng thứ)'], [6, 3, 10, 5], 'Nửa giảm: buồn, chờ đi tiếp về V của giọng thứ.', 'm7b5', 'm7b5'),
  L('dim7', 'dim7', 'Giảm', [11, true, 'vii°7 (giọng thứ)'], [3, 6, 9, 0], 'Bốn nốt cách đều: căng, dẫn nửa cung lên hợp âm sau.', undefined, 'dim7'),
]

/** Tên bậc của một nốt so gốc hợp âm có các quãng `quang` (lớp cao độ). */
export function tenBacKhung(iv: number, quang: readonly number[]): string {
  const q = new Set(quang.map(pc))
  const ba = q.has(3) || q.has(4)
  switch (pc(iv)) {
    case 0:
      return '1'
    case 1:
      return '♭9'
    case 2:
      return ba || q.has(5) ? '9' : '2'
    case 3:
      return q.has(4) ? '♯9' : '♭3'
    case 4:
      return '3'
    case 5:
      return ba ? '11' : '4'
    case 6:
      return q.has(7) ? '♯11' : '♭5'
    case 7:
      return '5'
    case 8:
      return q.has(7) || q.has(6) ? '♭13' : '♯5'
    case 9:
      return q.has(10) || q.has(11) ? '13' : '6'
    case 10:
      return '♭7'
    default:
      return '7'
  }
}

export interface NotKhung {
  /** Lớp cao độ. */
  p: number
  /** Quãng so gốc hợp âm. */
  iv: number
  /** Tên chữ theo gam của khung (C♯, B♭ …). */
  ten: string
  bac: string
  muc: MucKhung
  /** Nốt mà đuôi mang lại (7 của maj7, ♭5 của m7♭5, 13 của 13 …). */
  dau: boolean
}

export interface Khung {
  goc: number
  /** Tên hợp âm theo giọng (D♭maj9, A♭/C …). */
  ten: string
  /** Tên gam, vd "D♭ Ionian (gam trưởng)". */
  gam: string
  not: NotKhung[]
  /** Quãng (lớp cao độ) các nốt hợp âm. */
  quang: number[]
  /** Nốt đỉnh nên chọn, thứ tự ưu tiên (quãng so gốc), chỉ nốt có trong khung. */
  dinh: number[]
  loai: LoaiKhung | null
  tonic: number
  thu: boolean
  bass: number | null
}

/*
  GAM RIÊNG — năm loại không lấy gam của bài: gam của bài chỉ có bảy chữ, mà các loại này cần hai nốt cùng chữ (♭9 và ♯9) hay một gam đối
  xứng. Bản đầu cho dim7 qua `gamTrenHop` ở giọng nhà Đô♯ thứ: gốc bị gọi "C" thay vì "B♯" nên khung ra nốt trùng (D♯ và E♭, F♯ và G♭).
  Mọi nốt ngoài hợp âm của các gam này đều là nốt căng dùng được (nốt phụ), không có nốt tránh. Chọn gam là lý thuyết jazz, chưa đo trên thầy.
*/
const GAM_RIENG: Readonly<Record<string, { ten: string; iv: readonly number[]; buoc: readonly number[] }>> = {
  dim7: { ten: 'gam giảm cung – nửa cung (8 nốt)', iv: [0, 2, 3, 5, 6, 8, 9, 11], buoc: [0, 1, 2, 3, 4, 5, 5, 6] },
  '13b9': { ten: 'gam giảm nửa cung – cung (8 nốt)', iv: [0, 1, 3, 4, 6, 7, 9, 10], buoc: [0, 1, 1, 2, 3, 4, 5, 6] },
  '7#9': { ten: 'gam giảm nửa cung – cung (8 nốt)', iv: [0, 1, 3, 4, 6, 7, 9, 10], buoc: [0, 1, 1, 2, 3, 4, 5, 6] },
  '7#5': { ten: 'gam toàn cung (6 nốt)', iv: [0, 2, 4, 6, 8, 10], buoc: [0, 1, 2, 3, 4, 6] },
  'm(maj7)': { ten: 'thứ giai điệu (melodic minor)', iv: [0, 2, 3, 5, 7, 9, 11], buoc: [0, 1, 2, 3, 4, 5, 6] },
}
const CHU = 'CDEFGAB'
const TU_NHIEN = [0, 2, 4, 5, 7, 9, 11]
const tenChu = (chu: number, p: number) => {
  const lech = ((((p - TU_NHIEN[chu]!) % 12) + 18) % 12) - 6
  return CHU[chu]! + (lech < 0 ? '♭'.repeat(-lech) : '♯'.repeat(lech))
}

/**
 * Khung của hợp âm `x` (gốc tính từ chủ âm) trong giọng `tonic` / `thu`. Hợp âm treo (không bậc 3, có bậc 4) thì bậc 3 là nốt tránh —
 * `gamTrenHop` chỉ xét nốt nửa cung TRÊN nốt hợp âm, mà Mi nằm nửa cung DƯỚI Fa của Csus4.
 */
export function khungCua(tonic: number, thu: boolean, x: Hop): Khung {
  const q = findQualityBySymbol(x.chat) ?? findQualityBySymbol('')!
  const quang = [...new Set(q.intervals.map(pc))]
  const goc = pc(tonic + x.goc)
  const rieng = GAM_RIENG[x.chat]
  const tenHop = nguCanh(tonic, thu).h(x.goc, x.chat, x.bass)
  const treo = !quang.includes(3) && !quang.includes(4) && quang.includes(5)
  const dau = (iv: number) => quang.includes(iv) && ![0, 3, 4, 7].includes(iv)
  let not: NotKhung[]
  let gam: string
  if (rieng) {
    const chuGoc = CHU.indexOf(tenHop[0] ?? 'C')
    not = rieng.iv.map((iv, k) => {
      const p = pc(goc + iv)
      return { p, iv, ten: tenChu((chuGoc + rieng.buoc[k]!) % 7, p), bac: tenBacKhung(iv, quang), muc: quang.includes(iv) ? 'chinh' : 'phu', dau: dau(iv) }
    })
    gam = `${tenChu(chuGoc, goc)} ${rieng.ten}`
  } else {
    const g = gamTrenHop(tonic, thu, x)
    not = g.not.map((n) => {
      const iv = pc(n.p - goc)
      const muc: MucKhung = n.vai === 'tru' ? 'chinh' : n.vai === 'tranh' || (treo && iv === 4) ? 'khong' : 'phu'
      return { p: n.p, iv, ten: n.ten, bac: tenBacKhung(iv, quang), muc, dau: dau(iv) }
    })
    gam = g.ten
  }
  const loai = LOAI_KHUNG.find((l) => l.id === x.chat) ?? null
  const coThe = (iv: number) => not.some((n) => n.iv === iv && n.muc !== 'khong')
  const macDinh = [quang.find((i) => i === 3 || i === 4), quang.find((i) => i === 10 || i === 11 || i === 9), ...quang.filter((i) => ![0, 3, 4, 7].includes(i)), 7, 0]
  const dinh = [...new Set((loai?.dinh ?? macDinh).filter((i): i is number => i !== undefined && coThe(i)))]
  return {
    goc,
    ten: tenHop,
    gam,
    not,
    quang,
    dinh,
    loai,
    tonic: pc(tonic),
    thu,
    bass: x.bass === undefined ? null : pc(tonic + x.bass),
  }
}

/*
  Khung của một loại ở gốc `goc`: tính MẪU ở gốc Đô trong giọng nhà rồi chuyển gốc — đổi lớp cao độ, gọi lại tên theo số chữ từ gốc. Bản
  đầu gọi thẳng `gamTrenHop` ở giọng nhà của từng gốc: m7♭5 gốc Fa (ii của Mi♭ thứ) ra khung trùng nốt "F G♯ A♭ B C♭ D♯ E♭" — app gọi
  giọng ấy là Rê♯ thứ mà gốc Fa thì gọi "F" chứ không "E♯", chữ lệch nhau. Mẫu ở gốc Đô thì giọng nhà luôn gọi được gọn (Đô · Si♭ · Fa ·
  Sol trưởng, Đô · Fa · Si♭ thứ). Khung chỉ phụ thuộc quãng so gốc nên chuyển gốc không đổi vai nốt.
*/
const MAU = new Map<string, Khung>()
/** `nha` đổi chỗ đứng của loại (m7 ở vi hay iii thay cho ii) — màn "bảy khung" của Mưa khung nốt. */
export function khungLoai(loai: LoaiKhung, goc: number, nha: LoaiKhung['nha'] = loai.nha): Khung {
  const khoa = `${loai.id}|${nha.goc}|${nha.thu}`
  let mau = MAU.get(khoa)
  if (!mau) {
    mau = khungCua(pc(-nha.goc), nha.thu, { goc: nha.goc, chat: loai.id })
    MAU.set(khoa, mau)
  }
  const g = pc(goc)
  const tenGoc = gocDep(GOC_TEN[g]!)
  const chuGoc = CHU.indexOf(tenGoc[0]!)
  const not = mau.not.map((n) => {
    const p = pc(n.p + g)
    return { ...n, p, ten: tenChu((chuGoc + CHU.indexOf(n.ten[0]!)) % 7, p) }
  })
  return {
    ...mau,
    goc: g,
    // Tên theo chữ của nút loại (Cadd9, C13sus) — tên app gọi từ ký hiệu là Cadd2, C13sus4.
    ten: `${tenGoc}${loai.ten}`,
    gam: `${tenGoc} ${mau.gam.replace(/^[A-G][♭♯]*\s/, '')}`,
    not,
    tonic: pc(g - nha.goc),
  }
}

/** Vai của một phím (MIDI) trong khung; nốt ngoài khung là `null`. */
export const notCua = (k: Khung, m: number): NotKhung | null => k.not.find((n) => n.p === pc(m)) ?? null
export const mucCua = (k: Khung, m: number): MucKhung => notCua(k, m)?.muc ?? 'khong'

/** Tên một phím trong khung, kèm quãng tám (C♯4); nốt ngoài khung gọi theo dấu của giọng. */
export function tenPhim(k: Khung, m: number): string {
  const n = notCua(k, m)
  const chu = n ? n.ten : gocDep(tenTrongGiong(k.tonic, k.thu, pc(m - k.tonic)))
  const oct = Math.floor(m / 12) - 1 + (chu.startsWith('B') && pc(m) === 0 ? -1 : chu.startsWith('C') && pc(m) === 11 ? 1 : 0)
  return `${chu}${oct}`
}

export interface GoiY {
  m: number
  ten: string
  bac: string
  ly: string[]
}

/**
 * Ba nốt đỉnh nên đánh trên khung `k` (tầm tay phải `tam`), mỗi nốt một lý do, mỗi tên nốt một lần:
 *  1. đi liền bậc — nốt chính gần nốt trước nhất (≤ 2 nửa cung; có `truoc` mới xét);
 *  2. nốt màu nên chọn — đứng đầu `k.dinh` (thứ tự số đo SSA / lý thuyết), quãng tám gần nốt trước (hay Đô 5);
 *  3. giữ được sang hợp âm sau — nốt chính cũng là nốt hợp âm của `sau` (SSA giữ ≥ 2 nốt tay phải ở 32/94 chỗ đổi bass);
 * ô nào không có thì lấy nốt kế theo thứ tự `k.dinh`. Bản đầu cộng điểm một lượt: nốt màu xa 4 nửa cung thắng nốt sát bên (G♭maj9 sau
 * Đô 5 gợi ý A♭4 trước B♭4) — người tập mất mạch đi liền bậc.
 */
export function goiYDinh(k: Khung, truoc: number | null, sau: Khung | null, tam: readonly [number, number] = [64, 81]): GoiY[] {
  const gan = truoc ?? 72
  const phim: { m: number; n: NotKhung }[] = []
  for (let m = tam[0]; m <= tam[1]; m++) {
    const n = notCua(k, m)
    if (n && n.muc !== 'khong' && (n.muc === 'chinh' || k.dinh.includes(n.iv))) phim.push({ m, n })
  }
  const hang = (x: { n: NotKhung }) => (k.dinh.includes(x.n.iv) ? k.dinh.indexOf(x.n.iv) : k.dinh.length + (x.n.muc === 'chinh' ? 0 : 1))
  const xa = (x: { m: number }) => Math.abs(x.m - gan)
  const sauTru = sau ? sau.not.filter((x) => x.muc === 'chinh').map((x) => x.p) : []
  const chon: GoiY[] = []
  const them = (x: { m: number; n: NotKhung } | undefined, lyDo: string) => {
    if (!x || chon.length >= 3 || chon.some((c) => pc(c.m) === pc(x.m))) return
    const ly = [lyDo]
    if (x.n.dau && !lyDo.includes('màu')) ly.push(`nốt ${x.n.bac} — đuôi mang lại màu`)
    chon.push({ m: x.m, ten: tenPhim(k, x.m), bac: x.n.bac, ly })
  }
  const theoHang = [...phim].sort((a, b) => hang(a) - hang(b) || xa(a) - xa(b))
  if (truoc !== null) {
    const lien = phim.filter((x) => x.n.muc === 'chinh' && xa(x) <= 2).sort((a, b) => xa(a) - xa(b) || hang(a) - hang(b))[0]
    them(lien, lien && xa(lien) === 0 ? 'giữ nguyên nốt trước — nốt chung' : 'đi liền bậc từ nốt trước')
  }
  them(theoHang[0], `nốt đỉnh hay chọn nhất của ${k.loai?.ten ?? 'hợp âm này'}`)
  if (sau) {
    const giu = phim.filter((x) => x.n.muc === 'chinh' && sauTru.includes(x.n.p) && !chon.some((c) => pc(c.m) === x.n.p)).sort((a, b) => xa(a) - xa(b))[0]
    them(giu, 'cũng là nốt của hợp âm sau — giữ được khi đổi bass')
  }
  for (const x of theoHang) them(x, 'nốt khung nên chọn kế tiếp')
  return chon
}

/**
 * Thế chồng tay phải dưới một nốt đỉnh: 2–3 nốt hợp âm (ưu tiên 3 · 7 rồi nốt đuôi, rồi 5; gốc chỉ khi thiếu) nằm dưới đỉnh trong một
 * quãng tám, không hai nốt nào cách nửa cung — tay phải "khung + giai điệu trên đỉnh" như SSA. Trả cả nốt đỉnh, từ thấp lên.
 */
export function chongDuoi(k: Khung, dinh: number): number[] {
  const coBay = k.quang.includes(10) || k.quang.includes(11)
  const uuTien = (n: NotKhung) =>
    [3, 4, 10, 11].includes(n.iv) || (n.iv === 9 && !coBay) ? 0 : n.iv === 0 ? 3 : n.iv === 7 || ([6, 8].includes(n.iv) && !n.dau) ? 2 : 1
  const tru = k.not.filter((n) => n.muc === 'chinh' && n.p !== pc(dinh))
  const chon: number[] = []
  const ung = [...tru].sort((a, b) => uuTien(a) - uuTien(b))
  for (const n of ung) {
    if (chon.length >= 3) break
    if (n.iv === 0 && tru.length > 3) continue
    let m = dinh - 1
    while (pc(m) !== n.p) m--
    if (dinh - m > 11) continue
    if ([dinh, ...chon].some((x) => Math.abs(x - m) === 1)) continue
    chon.push(m)
  }
  return [...chon.sort((a, b) => a - b), dinh]
}

/**
 * Nền cho kiểu solo: tay trái mỗi hợp âm — bass ngân cả ô, rải 5 · 8 · 5 nhẹ ở các phách sau (SSA: tay trái trung vị 1 nốt, rải
 * 1 – 5 – 8 ở 29/111 đoạn). `day` thêm tay phải đệm (nốt hợp âm trừ gốc, quãng tám 4, nhẹ) cho ai chỉ muốn đánh giai điệu.
 */
export function nenVong(ks: readonly Khung[], nhip: number, day = false): ScheduledHit[] {
  const hits: ScheduledHit[] = []
  ks.forEach((k, i) => {
    const t = i * nhip
    const bass = 36 + pc((k.bass ?? k.goc) - 0)
    const nam = k.quang.find((x) => x === 7) ?? k.quang.find((x) => x === 6 || x === 8) ?? 7
    hits.push({ notes: [bass as MidiNote], startBeat: t, durationBeats: nhip, velocity: 72 })
    const rai = [bass + nam, bass + 12, bass + nam].slice(0, Math.max(0, nhip - 1))
    rai.forEach((m, j) => hits.push({ notes: [m as MidiNote], startBeat: t + j + 1, durationBeats: 1, velocity: 50 - j * 2 }))
    if (day) {
      const tren = k.quang.filter((x) => x !== 0).map((x) => 60 + pc(k.goc + x)).sort((a, b) => a - b)
      hits.push({ notes: tren as MidiNote[], startBeat: t, durationBeats: Math.max(0.5, nhip - 0.25), velocity: 40 })
    }
  })
  return hits
}

/** Vòng để solo: trích ba clip SSA (giọng gốc của clip) và vài vòng cơ bản. */
export const VONG_KHUNG: readonly { id: string; ten: string; chu: string; tonic: number; thu: boolean; ghiChu: string }[] = [
  {
    id: 'ssa-4536251',
    ten: 'SSA · Rai 3 — 4536251 làm đẹp',
    chu: 'Gbmaj9 Ab13sus4 Fm7 Bbm9 Ebm9 Ab13sus4 Dbmaj9 Dbmaj9',
    tonic: 1,
    thu: false,
    ghiChu: 'Vòng IV – V – iii – vi – ii – V – I của ballad Hoa ngữ. Anh SSA: "4536251 là cơ bản, nhưng nhớ phải làm đẹp vòng hợp âm" — mỗi hợp âm thêm nốt màu (maj9 · 13sus · m9).',
  },
  {
    id: 'ssa-hong-kong',
    ten: 'SSA · Rai 2 — ballad Hồng Kông',
    chu: 'Dbmaj9 Ab/C Bbm11 Eb13sus4 Dbmaj7 Eb7/Db Cm7 Fm11',
    tonic: 8,
    thu: false,
    ghiChu: 'Bass đi xuống liền bậc (D♭ – C – B♭ …), hợp âm treo 13sus thay V7, E♭7/D♭ — bass giữ D♭ còn tay phải đổi.',
  },
  {
    id: 'ssa-giu-giai-dieu',
    ten: 'SSA · Rai 1 — giữ giai điệu, đổi hợp âm',
    chu: 'Cmaj9 Am11 Dm9 Dbaug Dm9/C Bm7b5 E7b9 Am11',
    tonic: 0,
    thu: false,
    ghiChu: 'Cùng mấy nốt giai điệu, bass đổi là màu đổi. D7 gốc thay bằng D♭(♯5); Bm7♭5 – E7♭9 – Am11 là ii – V – i của La thứ ("đổi sang thứ — buồn hơn").',
  },
  {
    id: 'ssa-muon',
    ten: 'SSA · Rai 1 — mượn hợp âm về trưởng',
    chu: 'Am9 F#m7b5 Fm(maj7) F/G Bb7#11 Cmaj7',
    tonic: 0,
    thu: false,
    ghiChu: 'Fm(maj7) và B♭7(♯11) mượn từ Đô thứ (modal interchange) — anh SSA: "có cảm giác nắng".',
  },
  { id: 'co-ban', ten: 'Cơ bản · C – Am – F – G', chu: 'C Am F G', tonic: 0, thu: false, ghiChu: 'Hợp âm ba — khung là gam Đô trưởng, chỉ đổi nốt trụ.' },
  { id: 'ii-v-i', ten: 'Cơ bản · ii – V – I', chu: 'Dm7 G7 Cmaj7 Cmaj7', tonic: 0, thu: false, ghiChu: 'Ba khung chung một gam: D Dorian · G Mixolydian · C Ionian.' },
  { id: 'thu-co-ban', ten: 'Cơ bản thứ · Am – Dm – E7 – Am', chu: 'Am Dm E7 Am', tonic: 9, thu: true, ghiChu: 'Trên E7 khung đổi Sol thành Sol♯ (Phrygian dominant).' },
]

/** Công thức chồng của một loại (nếu app có). */
export const congThucCua = (loai: LoaiKhung | null) => (loai?.ct ? (CONG_THUC.find((c) => c.id === loai.ct) ?? null) : null)
