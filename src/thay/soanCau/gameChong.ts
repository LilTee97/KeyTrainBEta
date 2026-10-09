import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { GOC } from '../vongThay'
import { cachTimTayPhai, chongCongThuc, CONG_THUC, gocDep, hauDep, tenTheoChu, tenTren, vn, type CongThuc } from './chongHopAm'
import { demPhim, HO_LOAI, meoCua, meoNgan } from './meoChong'
import { QUY_LUAT_SLASH, theSlash } from './slashChong'

/*
  GAME "MƯA HỢP ÂM" — người dùng 9/10/2026: "đã có công thức và quy luật rồi thì hãy làm thành Quiz hoặc game để tôi học thuộc bằng cách
  thực hành vì tôi ghét học thuộc lòng lý thuyết. Có thể chơi bằng đàn Midi hoặc phím chuột hoặc cảm ứng trên Android", rồi "hãy phá lệ
  làm game cho phần học thuộc công thức chồng hợp âm này" — ngoại lệ của luật "không lớp game", CHỈ cho phần này. Logic thuần (màn, chọn
  câu, chấm, lựa chọn, điểm, tốc độ) ở đây; giao diện ở GameChong.tsx. Câu có hai dạng: hợp âm chồng (26 công thức) và hợp âm slash
  (người dùng 9/10/2026 đồng ý thêm màn slash) — chung một kiểu `CauGame`.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

/** Hai bên (người dùng 9/10/2026): luyện có gợi ý + mẹo · thi không mẹo, chấm đạt từng màn. */
export type Ben = 'meo' | 'thi'
export type GocChoi = 'do' | 'trang' | 'tat'
export type CachNhap = 'giu' | 'cham' | 'chon'

/** Ghi dấu theo gốc: Đô♯, Fa♯ ghi thăng, còn lại ghi giáng (Mi♭, La♭, Si♭). */
export const kieuGoc = (g: number): AccidentalStyle => (g === 1 || g === 6 ? 'sharp' : 'flat')

export const GOC_CHOI: Readonly<Record<GocChoi, readonly number[]>> = { do: [0], trang: [0, 2, 4, 5, 7, 9, 11], tat: [...Array(12).keys()] }

export interface CauGame {
  /** Khóa đếm sai: id công thức chồng, hay `slash:<mẫu>`. */
  id: string
  /** Tên trên viên rơi. */
  ten: string
  /** Gốc (câu chồng) hay bass (câu slash), nửa cung từ Đô. */
  g: number
  /** Đáp án hai tay. */
  trai: number[]
  phai: number[]
  /** "khung C7" · "bass Sol" — dòng thứ hai trên viên bên mẹo. */
  khungTen: string
  /** Gợi ý suy luận bên mẹo — không nói thẳng đáp án. */
  goiY: string
  /** Đáp án ở chế độ chọn tên: tên tay phải (câu chồng) hay nghĩa của slash. */
  dapAnTen: string
  /** Lời giải sau khi đúng / trượt. */
  loi: string
  /** Mẹo đầy đủ — hiện khi sai và trong tổng kết. */
  meo: string
  luaChon: string[]
  /** Câu slash luôn bấm hai tay (bass + hợp âm). */
  haiTayBuoc: boolean
}

const tron = <T,>(ds: readonly T[], rand: () => number) => {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Bốn tên tay phải để chọn: một đúng, ba nhiễu cùng gốc — ưu tiên công thức cùng họ; câu hợp âm ba thì không lẫn tên chùm nốt. */
function luaChonTen(ct: CongThuc, g: number, dung: string, rand: () => number): string[] {
  const chum = 'iv' in ct.tren
  const khac = CONG_THUC.filter((c) => c.id !== ct.id && (chum || !('iv' in c.tren)))
  const thuTu = [...tron(khac.filter((c) => c.nhom === ct.nhom), rand), ...tron(khac.filter((c) => c.nhom !== ct.nhom), rand)]
  const nhieu = [...new Set(thuTu.map((c) => tenTren(c, GOC[g]!, kieuGoc(g))))].filter((x) => x !== dung).slice(0, 3)
  return tron([dung, ...nhieu], rand)
}

/** Câu hợp âm chồng: gốc `g`, công thức `ct`. */
export function taoCau(ct: CongThuc, g: number, rand: () => number = Math.random): CauGame {
  const c = chongCongThuc(ct, g, GOC[g]!, kieuGoc(g))
  return {
    id: ct.id,
    ten: c.nhan.tong,
    g,
    trai: c.trai,
    phai: c.phai,
    khungTen: `khung ${c.nhan.trai}`,
    goiY: meoNgan(ct),
    dapAnTen: c.nhan.phai,
    loi: `${c.nhan.tong} = ${c.nhan.trai} + ${c.nhan.phai} (${meoNgan(ct).replace('tay phải ', '')})`,
    meo: `${meoCua(ct)}. ${cachTimTayPhai(ct, GOC[g]!, kieuGoc(g))}`,
    luaChon: luaChonTen(ct, g, c.nhan.phai, rand),
    haiTayBuoc: false,
  }
}

/* ---------------- Hợp âm slash — mẫu theo QUY LUẬT (mọi bass), không theo ví dụ thuộc lòng ---------------- */

export interface MauSlash {
  id: string
  /** Gốc hợp âm X cách bass bao nhiêu nửa cung (đi lên), và cách bao nhiêu chữ cái — để ghi tên đúng chữ. */
  cach: number
  chu: number
  chat: '' | 'm' | 'dim'
  loai: 'dao' | 'mau'
  /** Nghĩa của X/Y — `x`, `y` là tên đã ghi đẹp. */
  nghia: (x: string, y: string) => string
  luat: string
}

/** Năm quy luật slash thành 9 mẫu: 4 thế đảo (trưởng / thứ, bass bậc 3 / bậc 5) và 5 bass lạ = hợp âm màu viết tắt. */
export const MAU_SLASH: readonly MauSlash[] = [
  { id: 'dao1', cach: 8, chu: 5, chat: '', loai: 'dao', nghia: (x) => `${x} đảo 1`, luat: 'Bass là bậc 3 của hợp âm → đảo 1 (C/E): nghe nhẹ, đang đi.' },
  { id: 'dao1m', cach: 9, chu: 5, chat: 'm', loai: 'dao', nghia: (x) => `${x} đảo 1`, luat: 'Bass là bậc ♭3 của hợp âm thứ → đảo 1 (Am/C — cũng là C6 thiếu 5).' },
  { id: 'dao2', cach: 5, chu: 3, chat: '', loai: 'dao', nghia: (x) => `${x} đảo 2`, luat: 'Bass là bậc 5 → đảo 2 (C/G): lửng lơ, hay đứng trước V.' },
  { id: 'dao2m', cach: 5, chu: 3, chat: 'm', loai: 'dao', nghia: (x) => `${x} đảo 2`, luat: 'Bass là bậc 5 của hợp âm thứ → đảo 2 (Am/E).' },
  { id: 'maj7', cach: 4, chu: 2, chat: 'm', loai: 'mau', nghia: (_, y) => `${y}maj7`, luat: 'Hợp âm thứ cao hơn bass 4 phím = maj7 của bass (Em/C = Cmaj7).' },
  { id: 'm7', cach: 3, chu: 2, chat: '', loai: 'mau', nghia: (_, y) => `${y}m7`, luat: 'Hợp âm trưởng cao hơn bass 3 phím = m7 của bass (E♭/C = Cm7).' },
  { id: '7', cach: 4, chu: 2, chat: 'dim', loai: 'mau', nghia: (_, y) => `${y}7`, luat: 'Hợp âm giảm cao hơn bass 4 phím = 7 của bass (Edim/C = C7).' },
  { id: '9sus4', cach: 10, chu: 6, chat: '', loai: 'mau', nghia: (_, y) => `${y}9sus4`, luat: 'Hợp âm trưởng thấp hơn bass một cung = 9sus4 của bass (F/G = G9sus4).' },
  { id: 'maj9', cach: 7, chu: 4, chat: '', loai: 'mau', nghia: (_, y) => `${y}maj9 (thiếu 3)`, luat: 'Hợp âm trưởng cao hơn bass 7 phím = maj9 thiếu bậc 3 của bass (G/C).' },
]

const tenX = (m: MauSlash, y: number) => gocDep(tenTheoChu(GOC[y]!, m.cach, m.chu, kieuGoc(y))) + m.chat
const nghiaCua = (m: MauSlash, y: number) => m.nghia(tenX(m, y), gocDep(GOC[y]!))

/** Bốn nghĩa để chọn: thế đảo thì nhiễu là các thế khác của chính X và một hợp âm màu của bass; bass lạ thì nhiễu là màu khác của bass. */
function luaChonSlash(m: MauSlash, y: number, dung: string, rand: () => number): string[] {
  const x = tenX(m, y)
  const yTen = gocDep(GOC[y]!)
  const nhieu =
    m.loai === 'dao'
      ? [m.id.startsWith('dao1') ? `${x} đảo 2` : `${x} đảo 1`, `${x} thế gốc`, nghiaCua(tron(MAU_SLASH.filter((k) => k.loai === 'mau'), rand)[0]!, y)]
      : tron(MAU_SLASH.filter((k) => k.loai === 'mau' && k.id !== m.id).map((k) => nghiaCua(k, y)), rand).slice(0, 3)
  return tron([dung, ...nhieu.filter((t) => t !== dung && t !== yTen)].slice(0, 4), rand)
}

/** Câu slash: mẫu `m`, bass `y`. Bấm hai tay: tay trái bass, tay phải hợp âm X. */
export function taoCauSlash(m: MauSlash, y: number, rand: () => number = Math.random): CauGame {
  const x = tenX(m, y)
  const yTen = gocDep(GOC[y]!)
  const ten = `${x}/${yTen}`
  const nghia = nghiaCua(m, y)
  const t = theSlash({ ten, goc: pc(y + m.cach), chat: m.chat, bass: y, nghia })
  return {
    id: `slash:${m.id}`,
    ten,
    g: y,
    trai: t.trai,
    phai: t.phai,
    khungTen: `bass ${vn(GOC[y]!)}`,
    goiY: m.loai === 'dao' ? `bass là nốt của ${x} → thế đảo` : `bass lạ · ${demPhim(m.cach)} tới gốc ${x}`,
    dapAnTen: nghia,
    loi: `${ten} = ${nghia}: tay trái ${vn(GOC[y]!)} + tay phải ${x}`,
    meo: m.luat,
    luaChon: luaChonSlash(m, y, nghia, rand),
    haiTayBuoc: true,
  }
}

/* ---------------- Màn ---------------- */

export interface Man {
  ten: string
  goiY: string
  /** id công thức chồng, hay `slash:<mẫu>`. */
  ids: readonly string[]
  /** Bảng mẹo của màn (bên luyện có mẹo). */
  meo: readonly string[]
}

const meoLoai = (ids: readonly string[]) =>
  ids.map((id) => {
    const ct = CONG_THUC.find((c) => c.id === id)!
    return `C${hauDep(ct.kyHieu)}: ${meoCua(ct)}`
  })

/** Bảy màn: năm họ hợp âm (theo loại), hợp âm slash, trộn cả 26 loại. */
export const MAN: readonly Man[] = [
  ...HO_LOAI.map((h) => ({ ten: h.ten, goiY: h.ids.map((id) => hauDep(CONG_THUC.find((c) => c.id === id)!.kyHieu)).join(' · '), ids: h.ids, meo: meoLoai(h.ids) })),
  {
    ten: 'Hợp âm slash',
    goiY: 'thế đảo · bass lạ = hợp âm màu viết tắt',
    ids: MAU_SLASH.map((m) => `slash:${m.id}`),
    meo: [...QUY_LUAT_SLASH, ...MAU_SLASH.map((m) => m.luat)],
  },
  { ten: 'Trộn tất cả', goiY: 'cả 26 loại', ids: CONG_THUC.map((c) => c.id), meo: meoLoai(CONG_THUC.map((c) => c.id)) },
]

/** Chọn câu kế: câu vừa sai nặng thêm (1 + 2 × số lần sai) — câu sai quay lại nhiều hơn; không lặp đúng câu vừa rồi. */
export function chonCau(ids: readonly string[], goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauGame {
  const ung = ids.length > 1 && truoc ? ids.filter((x) => x !== truoc) : [...ids]
  const nang = ung.map((id) => 1 + 2 * (sai.get(id) ?? 0))
  let r = rand() * nang.reduce((s, x) => s + x, 0)
  let k = 0
  for (; k < ung.length - 1; k++) {
    r -= nang[k]!
    if (r < 0) break
  }
  const id = ung[k]!
  const g = goc[Math.floor(rand() * goc.length)]!
  const mau = MAU_SLASH.find((m) => `slash:${m.id}` === id)
  return mau ? taoCauSlash(mau, g, rand) : taoCau(CONG_THUC.find((c) => c.id === id)!, g, rand)
}

/* ---------------- Chấm ---------------- */

const tapLop = (ns: readonly number[]) => new Set(ns.map(pc))
const bang = (a: ReadonlySet<number>, b: ReadonlySet<number>) => a.size === b.size && [...a].every((x) => b.has(x))

/** Tay phải đúng: đúng các lớp cao độ của tay phải — quãng tám nào, thế đảo nào cũng được (bấm kèm cả tay trái cũng tính). */
export const dungTayPhai = (ns: readonly number[], c: CauGame) =>
  ns.length > 0 && (bang(tapLop(ns), tapLop(c.phai)) || bang(tapLop(ns), tapLop([...c.trai, ...c.phai])))

/** Hai tay đúng: đủ lớp cao độ của cả hai tay và nốt thấp nhất là nốt bass của đáp án (gốc, hay Y của slash). */
export const dungHaiTay = (ns: readonly number[], c: CauGame) =>
  ns.length > 0 && pc(Math.min(...ns)) === pc(Math.min(...c.trai)) && bang(tapLop(ns), tapLop([...c.trai, ...c.phai]))

/** Số lớp cao độ phải chạm (chế độ chạm từng nốt): chạm đủ số ấy mà chưa đúng là sai. */
export const soCanCham = (c: CauGame, haiTay: boolean) => (haiTay ? tapLop([...c.trai, ...c.phai]) : tapLop(c.phai)).size

/** Điểm một câu: 10 × (1 + combo/5 làm tròn xuống). */
export const diemCau = (combo: number) => 10 * (1 + Math.floor(combo / 5))
/** Thời gian rơi (mili giây): bên mẹo chậm (14 s, nhanh 1% mỗi câu đúng, sàn 9 s); bên thi 10 s (hai tay 12 s), nhanh 3%, sàn 4 s. */
export const thoiGianRoi = (ben: Ben, daDung: number, haiTay = false) =>
  ben === 'meo' ? Math.max(9000, 14000 * 0.99 ** daDung) : Math.max(4000, (haiTay ? 12000 : 10000) * 0.97 ** daDung)
/** Bên thi: mỗi lượt 20 viên; đúng từ 16 (80%) là Đạt màn. */
export const SO_CAU_THI = 20
export const DAT_THI = 16
