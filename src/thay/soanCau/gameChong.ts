import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { GOC } from '../vongThay'
import { chongCongThuc, CONG_THUC, hauDep, tenTren, type Chong, type CongThuc } from './chongHopAm'
import { HO_LOAI, meoNgan } from './meoChong'

/*
  GAME "MƯA HỢP ÂM" — người dùng 9/10/2026: "đã có công thức và quy luật rồi thì hãy làm thành Quiz hoặc game để tôi học thuộc bằng cách
  thực hành vì tôi ghét học thuộc lòng lý thuyết. Có thể chơi bằng đàn Midi hoặc phím chuột hoặc cảm ứng trên Android", rồi "hãy phá lệ
  làm game cho phần học thuộc công thức chồng hợp âm này" — ngoại lệ của luật "không lớp game", CHỈ cho phần này. Logic thuần (màn, chọn
  câu, chấm, lựa chọn tên, điểm, tốc độ) ở đây; giao diện ở GameChong.tsx.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

/** Hai bên (người dùng 9/10/2026): luyện có gợi ý + mẹo · thi không mẹo, chấm đạt từng màn. */
export type Ben = 'meo' | 'thi'
export type GocChoi = 'do' | 'trang' | 'tat'
export type CachNhap = 'giu' | 'cham' | 'chon'

/** Ghi dấu theo gốc: Đô♯, Fa♯ ghi thăng, còn lại ghi giáng (Mi♭, La♭, Si♭). */
export const kieuGoc = (g: number): AccidentalStyle => (g === 1 || g === 6 ? 'sharp' : 'flat')

/** Sáu màn THEO LOẠI HỢP ÂM (người dùng 9/10/2026: quy luật tính theo loại, không theo vị trí tay): năm họ của bảng mẹo + trộn cả 26. */
export const MAN: readonly { ten: string; goiY: string; ct: readonly string[] }[] = [
  ...HO_LOAI.map((h) => ({ ten: h.ten, goiY: h.ids.map((id) => hauDep(CONG_THUC.find((c) => c.id === id)!.kyHieu)).join(' · '), ct: h.ids })),
  { ten: 'Trộn tất cả', goiY: 'cả 26 loại', ct: CONG_THUC.map((c) => c.id) },
]

export const GOC_CHOI: Readonly<Record<GocChoi, readonly number[]>> = { do: [0], trang: [0, 2, 4, 5, 7, 9, 11], tat: [...Array(12).keys()] }

export interface CauGame {
  ct: CongThuc
  g: number
  chong: Chong
  /** "tay phải 13·♭9·3 · trưởng" — gợi ý theo loại ở bên luyện có mẹo. */
  goiY: string
}

export function taoCau(ct: CongThuc, g: number): CauGame {
  return { ct, g, chong: chongCongThuc(ct, g, GOC[g]!, kieuGoc(g)), goiY: meoNgan(ct) }
}

/** Chọn câu kế: công thức vừa sai nặng thêm (1 + 2 × số lần sai) — câu sai quay lại nhiều hơn; không lặp đúng câu vừa rồi. */
export function chonCau(ids: readonly string[], goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauGame {
  const ung = ids.length > 1 && truoc ? ids.filter((x) => x !== truoc) : [...ids]
  const nang = ung.map((id) => 1 + 2 * (sai.get(id) ?? 0))
  let r = rand() * nang.reduce((s, x) => s + x, 0)
  let k = 0
  for (; k < ung.length - 1; k++) {
    r -= nang[k]!
    if (r < 0) break
  }
  return taoCau(CONG_THUC.find((c) => c.id === ung[k])!, goc[Math.floor(rand() * goc.length)]!)
}

const tapLop = (ns: readonly number[]) => new Set(ns.map(pc))
const bang = (a: ReadonlySet<number>, b: ReadonlySet<number>) => a.size === b.size && [...a].every((x) => b.has(x))

/** Tay phải đúng: đúng các lớp cao độ của tay phải — quãng tám nào, thế đảo nào cũng được (bấm kèm cả khung tay trái cũng tính). */
export const dungTayPhai = (ns: readonly number[], c: Chong) => ns.length > 0 && (bang(tapLop(ns), tapLop(c.phai)) || bang(tapLop(ns), tapLop([...c.trai, ...c.phai])))

/** Hai tay đúng (độ khó Khó): đủ lớp cao độ của cả hai tay và nốt thấp nhất là gốc. */
export const dungHaiTay = (ns: readonly number[], c: Chong) =>
  ns.length > 0 && pc(Math.min(...ns)) === c.goc && bang(tapLop(ns), tapLop([...c.trai, ...c.phai]))

/** Số lớp cao độ phải chạm (chế độ chạm từng nốt): chạm đủ số ấy mà chưa đúng là sai. */
export const soCanCham = (c: Chong, haiTay: boolean) => (haiTay ? tapLop([...c.trai, ...c.phai]) : tapLop(c.phai)).size

const tron = <T,>(ds: readonly T[], rand: () => number) => {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Bốn tên tay phải để chọn: một đúng, ba nhiễu cùng gốc — ưu tiên công thức cùng họ; câu hợp âm ba thì không lẫn tên chùm nốt. */
export function luaChonTen(cau: CauGame, rand: () => number = Math.random): string[] {
  const dung = cau.chong.nhan.phai
  const chum = 'iv' in cau.ct.tren
  const khac = CONG_THUC.filter((c) => c.id !== cau.ct.id && (chum || !('iv' in c.tren)))
  const thuTu = [...tron(khac.filter((c) => c.nhom === cau.ct.nhom), rand), ...tron(khac.filter((c) => c.nhom !== cau.ct.nhom), rand)]
  const nhieu = [...new Set(thuTu.map((c) => tenTren(c, GOC[cau.g]!, kieuGoc(cau.g))))].filter((x) => x !== dung).slice(0, 3)
  return tron([dung, ...nhieu], rand)
}

/** Điểm một câu: 10 × (1 + combo/5 làm tròn xuống). */
export const diemCau = (combo: number) => 10 * (1 + Math.floor(combo / 5))
/** Thời gian rơi (mili giây): bên mẹo chậm (14 s, nhanh 1% mỗi câu đúng, sàn 9 s); bên thi 10 s (hai tay 12 s), nhanh 3%, sàn 4 s. */
export const thoiGianRoi = (ben: Ben, daDung: number, haiTay = false) =>
  ben === 'meo' ? Math.max(9000, 14000 * 0.99 ** daDung) : Math.max(4000, (haiTay ? 12000 : 10000) * 0.97 ** daDung)
/** Bên thi: mỗi lượt 20 viên; đúng từ 16 (80%) là Đạt màn. */
export const SO_CAU_THI = 20
export const DAT_THI = 16
