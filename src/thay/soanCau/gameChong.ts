import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { GOC } from '../vongThay'
import { chongCongThuc, CONG_THUC, gocDep, hauDep, tenHaiTay, tenTheoChu, tenTren, theBamChong, vn, type Chong, type CongThuc } from './chongHopAm'
import { congLoai, HO_LOAI, kieuGoc, QUY_TAC_HO, trungCongLoai } from './meoChong'
import { QUY_LUAT_SLASH, theSlash } from './slashChong'

/*
  GAME "MƯA HỢP ÂM" — người dùng 9/10/2026: "đã có công thức và quy luật rồi thì hãy làm thành Quiz hoặc game để tôi học thuộc bằng cách
  thực hành vì tôi ghét học thuộc lòng lý thuyết. Có thể chơi bằng đàn Midi hoặc phím chuột hoặc cảm ứng trên Android", rồi "hãy phá lệ
  làm game cho phần học thuộc công thức chồng hợp âm này" — ngoại lệ của luật "không lớp game", CHỈ cho phần này. Logic thuần (màn, chọn
  câu, chấm, lựa chọn, điểm, tốc độ, đáp án hiện dần) ở đây; giao diện ở GameChong.tsx. Câu có hai dạng: hợp âm chồng (26 công thức) và
  hợp âm slash (người dùng 9/10/2026 đồng ý thêm màn slash) — chung một kiểu `CauGame`. Gợi ý theo lối CỘNG LOẠI, ghi luôn tên hai tay
  (người dùng chọn 10/10/2026 — meoChong.ts).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

/** Hai bên (người dùng 9/10/2026): luyện có gợi ý + mẹo · thi không mẹo, chấm đạt từng màn. */
export type Ben = 'meo' | 'thi'
export type GocChoi = 'do' | 'trang' | 'tat'
export type CachNhap = 'giu' | 'cham' | 'chon'

export const GOC_CHOI: Readonly<Record<GocChoi, readonly number[]>> = { do: [0], trang: [0, 2, 4, 5, 7, 9, 11], tat: [...Array(12).keys()] }

/** Nhãn từng tay trên bàn phím — tay nào đang sáng phím thì ghi tên hợp âm của tay ấy (người dùng 9/10/2026). */
export interface NhanTay {
  trai: string
  traiPhu: string
  phai: string
  phaiPhu: string
}

/** Một nút chọn tên — bấm nút là bấm hợp âm ấy trên đàn và nghe (người dùng 9/10/2026). */
export interface LuaChon {
  ten: string
  trai: number[]
  phai: number[]
  nhan: NhanTay
}

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
  nhan: NhanTay
  /** Dòng hai trên viên bên mẹo — tên hai tay: "A + G♯m", "Đô + Em" (slash). */
  khungTen: string
  /** Dòng ba — phép cộng loại: "trưởng + thứ", "bass + thứ = Cmaj7" (slash). */
  goiY: string
  /** Đáp án ở chế độ chọn tên: tên tay phải (câu chồng) hay nghĩa của slash. */
  dapAnTen: string
  /** Lời giải: "B6/9 = Si – Fa♯ + G♯sus4". */
  loi: string
  /** Nhắc ngắn sau khi đúng: phép cộng loại. */
  nho: string
  /** Mẹo đầy đủ — hiện khi sai và trong tổng kết. */
  meo: string
  luaChon: LuaChon[]
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

/** Đặt hợp âm tay phải ngay trên nốt cao nhất tay trái (dời theo quãng tám). */
const datTren = (ns: readonly number[], cao: number) => {
  let x = [...ns]
  while (Math.min(...x) <= cao) x = x.map((m) => m + 12)
  while (Math.min(...x) - 12 > cao) x = x.map((m) => m - 12)
  return x
}

/** Tên tay phải: hợp âm ba thì tên hợp âm; chùm nốt rời thì các nốt ("Mi – Fa♯ – La", không ghi bậc "chùm 9 – 3 – 5"). */
const tenPhai = (ct: CongThuc, g: number) => ('iv' in ct.tren ? tenHaiTay(ct, GOC[g]!, kieuGoc(g)).phai.join(' – ') : tenTren(ct, GOC[g]!, kieuGoc(g)))
const nhanCua = (c: Chong, ct: CongThuc, g: number): NhanTay => ({
  trai: c.nhan.trai,
  traiPhu: c.nhan.traiPhu,
  phai: 'iv' in ct.tren ? 'chùm' : c.nhan.phai,
  phaiPhu: c.nhan.phaiPhu || tenPhai(ct, g),
})

/**
 * Bốn tên tay phải để chọn: một đúng, ba nhiễu cùng gốc — ưu tiên công thức cùng họ; câu hợp âm ba thì không lẫn tên chùm nốt. Mỗi nút
 * mang nốt: tay trái giữ khung của đáp án, tay phải là hợp âm của tên ấy đặt ngay trên.
 */
function luaChonTen(ct: CongThuc, g: number, dung: Chong, rand: () => number): LuaChon[] {
  const chum = 'iv' in ct.tren
  const khac = CONG_THUC.filter((c) => c.id !== ct.id && (chum || !('iv' in c.tren)))
  const thuTu = [...tron(khac.filter((c) => c.nhom === ct.nhom), rand), ...tron(khac.filter((c) => c.nhom !== ct.nhom), rand)]
  const tenDung = tenPhai(ct, g)
  const nhieu: LuaChon[] = []
  for (const c of thuTu) {
    const ten = tenPhai(c, g)
    if (nhieu.length === 3 || ten === tenDung || nhieu.some((x) => x.ten === ten)) continue
    const phai = datTren(theBamChong(c, g).phai, Math.max(...dung.trai))
    nhieu.push({ ten, trai: dung.trai, phai, nhan: { ...nhanCua(dung, ct, g), phai: 'iv' in c.tren ? 'chùm' : ten, phaiPhu: tenHaiTay(c, GOC[g]!, kieuGoc(g)).phai.join(' – ') } })
  }
  return tron([{ ten: tenDung, trai: dung.trai, phai: dung.phai, nhan: nhanCua(dung, ct, g) }, ...nhieu], rand)
}

/** Mẹo khi sai: phép cộng loại; cùng phép cộng mà ra loại khác thì chỉ tên tay phải để phân biệt (ở chính gốc đang đố). */
function meoLoai(ct: CongThuc, g: number): string {
  const ten = (c: CongThuc) => {
    const x = chongCongThuc(c, g, GOC[g]!, kieuGoc(g)).nhan
    return `${x.tong} = ${x.trai} + ${tenPhai(c, g)}`
  }
  const trung = trungCongLoai(ct)
  return `${hauDep(ct.kyHieu)} = tay trái ${congLoai(ct).replace(' + ', ' + tay phải ')}.${trung.length ? ` Cùng phép cộng này còn ra ${trung.map(ten).join('; ')} — nhìn tên tay phải mà phân biệt.` : ''}`
}

/** Câu hợp âm chồng: gốc `g`, công thức `ct`. */
export function taoCau(ct: CongThuc, g: number, rand: () => number = Math.random): CauGame {
  const c = chongCongThuc(ct, g, GOC[g]!, kieuGoc(g))
  const phai = tenPhai(ct, g)
  return {
    id: ct.id,
    ten: c.nhan.tong,
    g,
    trai: c.trai,
    phai: c.phai,
    nhan: nhanCua(c, ct, g),
    khungTen: `${c.nhan.trai} + ${phai}`,
    goiY: congLoai(ct),
    dapAnTen: phai,
    loi: `${c.nhan.tong} = ${c.nhan.trai} + ${phai}`,
    nho: congLoai(ct),
    meo: meoLoai(ct, g),
    luaChon: luaChonTen(ct, g, c, rand),
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
  { id: 'maj7', cach: 4, chu: 2, chat: 'm', loai: 'mau', nghia: (_, y) => `${y}maj7`, luat: 'Bass + hợp âm thứ = maj7 của bass: Em/C = Cmaj7 · Am/F = Fmaj7 · Bm/G = Gmaj7.' },
  { id: 'm7', cach: 3, chu: 2, chat: '', loai: 'mau', nghia: (_, y) => `${y}m7`, luat: 'Bass + hợp âm trưởng = m7 của bass: E♭/C = Cm7 · C/A = Am7 · F/D = Dm7.' },
  { id: '7', cach: 4, chu: 2, chat: 'dim', loai: 'mau', nghia: (_, y) => `${y}7`, luat: 'Bass + hợp âm giảm = 7 của bass: Edim/C = C7 · Bdim/G = G7 · F♯dim/D = D7.' },
  { id: '9sus4', cach: 10, chu: 6, chat: '', loai: 'mau', nghia: (_, y) => `${y}9sus4`, luat: 'Bass + hợp âm trưởng thấp hơn bass một cung = 9sus4 của bass: B♭/C = C9sus4 · F/G = G9sus4 · C/D = D9sus4.' },
  { id: 'maj9', cach: 7, chu: 4, chat: '', loai: 'mau', nghia: (_, y) => `${y}maj9 (thiếu 3)`, luat: 'Bass + hợp âm trưởng = maj9 thiếu bậc 3 của bass: G/C = Cmaj9 · D/G = Gmaj9 · C/F = Fmaj9.' },
]

/** Ba nốt của hợp âm X theo chất: (nửa cung, chữ cái) tính từ gốc X. */
const BA_X: Record<MauSlash['chat'], readonly (readonly [number, number])[]> = {
  '': [[0, 0], [4, 2], [7, 4]],
  m: [[0, 0], [3, 2], [7, 4]],
  dim: [[0, 0], [3, 2], [6, 4]],
}
const TEN_DAO = ['thế gốc', 'đảo 1', 'đảo 2'] as const
const TEN_CHAT: Record<MauSlash['chat'], string> = { '': 'trưởng', m: 'thứ', dim: 'giảm' }
/** Tên chữ của gốc X ('Db') — gọi theo chữ cái tính từ bass. */
const xChu = (m: MauSlash, y: number) => tenTheoChu(GOC[y]!, m.cach, m.chu, kieuGoc(y))
const tenX = (m: MauSlash, y: number) => gocDep(xChu(m, y)) + m.chat
const nghiaCua = (m: MauSlash, y: number) => m.nghia(tenX(m, y), gocDep(GOC[y]!))

/** Nốt hai tay + nhãn của hợp âm X (tên chữ `xa`, gốc `xg`) trên một nốt bass. */
function slashBam(ten: string, xa: string, xg: number, chat: MauSlash['chat'], st: AccidentalStyle, bass: number, bassTen: string): LuaChon {
  const t = theSlash({ ten, goc: xg, chat, bass, nghia: '' })
  const notX = BA_X[chat].map(([s, c]) => vn(tenTheoChu(xa, s, c, st)))
  return { ten, trai: t.trai, phai: t.phai, nhan: { trai: vn(bassTen), traiPhu: 'bass', phai: gocDep(xa) + chat, phaiPhu: notX.join(' – ') } }
}

/** Hợp âm X của mẫu `m` (bass `y`) ở thế `bac` (0 gốc, 1 đảo 1, 2 đảo 2) — bass ghi theo chữ của X (E/G♯ chứ không E/A♭). */
function daoBam(m: MauSlash, y: number, bac: number): LuaChon {
  const st = kieuGoc(y)
  const xa = xChu(m, y)
  const xg = pc(y + m.cach)
  const [s, c] = BA_X[m.chat][bac]!
  return slashBam(`${tenX(m, y)} ${TEN_DAO[bac]}`, xa, xg, m.chat, st, pc(xg + s), tenTheoChu(xa, s, c, st))
}
const bacDao = (m: MauSlash) => (m.id.startsWith('dao1') ? 1 : 2)
/** Tên chữ của bass: thế đảo ghi theo chữ của X, bass lạ ghi như gốc. */
function yChu(m: MauSlash, y: number) {
  if (m.loai === 'mau') return GOC[y]!
  const [s, c] = BA_X[m.chat][bacDao(m)]!
  return tenTheoChu(xChu(m, y), s, c, kieuGoc(y))
}

/** Đáp án của mẫu `m` ở bass `y`: nghĩa + nốt hai tay. */
function dapAnSlash(m: MauSlash, y: number): LuaChon {
  if (m.loai === 'dao') return daoBam(m, y, bacDao(m))
  return slashBam(nghiaCua(m, y), xChu(m, y), pc(y + m.cach), m.chat, kieuGoc(y), y, GOC[y]!)
}

/** Bốn nghĩa để chọn: thế đảo thì nhiễu là các thế khác của X và một hợp âm màu của bass; bass lạ thì nhiễu là màu khác của bass. */
function luaChonSlash(m: MauSlash, y: number, dung: LuaChon, rand: () => number): LuaChon[] {
  const nhieu =
    m.loai === 'dao'
      ? [daoBam(m, y, 3 - bacDao(m)), daoBam(m, y, 0), dapAnSlash(tron(MAU_SLASH.filter((k) => k.loai === 'mau'), rand)[0]!, y)]
      : tron(MAU_SLASH.filter((k) => k.loai === 'mau' && k.id !== m.id), rand)
          .slice(0, 3)
          .map((k) => dapAnSlash(k, y))
  return tron([dung, ...nhieu.filter((x) => x.ten !== dung.ten)].slice(0, 4), rand)
}

/** Câu slash: mẫu `m`, bass `y`. Bấm hai tay: tay trái bass, tay phải hợp âm X. */
export function taoCauSlash(m: MauSlash, y: number, rand: () => number = Math.random): CauGame {
  const d = dapAnSlash(m, y)
  const x = tenX(m, y)
  const bass = d.nhan.trai
  const ten = `${x}/${gocDep(yChu(m, y))}`
  return {
    id: `slash:${m.id}`,
    ten,
    g: y,
    trai: d.trai,
    phai: d.phai,
    nhan: d.nhan,
    khungTen: `${bass} + ${x}`,
    goiY: `bass + ${TEN_CHAT[m.chat]} = ${d.ten}`,
    dapAnTen: d.ten,
    loi: `${ten} = ${d.ten}: tay trái ${bass} + tay phải ${x}`,
    nho: `bass + ${TEN_CHAT[m.chat]} = ${d.ten}`,
    meo: m.luat,
    luaChon: luaChonSlash(m, y, d, rand),
    haiTayBuoc: true,
  }
}

/* ---------------- Màn ---------------- */

export interface Man {
  ten: string
  goiY: string
  /** id công thức chồng, hay `slash:<mẫu>`. */
  ids: readonly string[]
  /** Bảng quy luật riêng (màn slash); màn hợp âm chồng dùng bảng cộng loại (`bangCongLoai`). */
  meo?: readonly string[]
  /** Điểm chung của họ (màn theo họ) hay giữa các họ (màn trộn) — hiện trên bảng mẹo bên luyện. */
  chung?: { tieuDe: string; ds: readonly string[] }
}

/** Bảy màn: năm họ hợp âm (theo loại), hợp âm slash, trộn cả 26 loại. */
export const MAN: readonly Man[] = [
  ...HO_LOAI.map((h) => ({ ten: h.ten, goiY: h.ids.map((id) => hauDep(CONG_THUC.find((c) => c.id === id)!.kyHieu)).join(' · '), ids: h.ids, chung: { tieuDe: `Điểm chung của ${h.ten.toLowerCase()}`, ds: h.chung } })),
  {
    ten: 'Hợp âm slash',
    goiY: 'thế đảo · bass lạ = hợp âm màu viết tắt',
    ids: MAU_SLASH.map((m) => `slash:${m.id}`),
    meo: [...QUY_LUAT_SLASH, ...MAU_SLASH.map((m) => m.luat)],
  },
  { ten: 'Trộn tất cả', goiY: 'cả 26 loại', ids: CONG_THUC.map((c) => c.id), chung: { tieuDe: 'Điểm chung giữa các họ', ds: QUY_TAC_HO } },
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

/**
 * Các mốc thời gian rơi (giây) — người dùng 9/10/2026: "Có thể cho chỉnh tốc độ rơi theo từng mốc". Mặc định: bên mẹo 14 s, bên thi
 * 10 s. Bản cũ tự nhanh dần: bên mẹo 14 s, nhanh 1% mỗi câu đúng, sàn 9 s; bên thi 10 s (hai tay 12 s), nhanh 3%, sàn 4 s — bỏ vì người
 * dùng tự chọn mốc. Triệu chứng để lùi: thi Đạt quá dễ vì không còn nhanh dần → trả lại nhân 0,97 mỗi câu đúng cho bên thi.
 */
export const MOC_ROI = [30, 20, 14, 10, 7, 5] as const
export const MOC_MAC_DINH: Readonly<Record<Ben, number>> = { meo: 14, thi: 10 }
/** Thời gian rơi (mili giây) ở mốc `giay`; viên bấm hai tay rơi lâu hơn 20%. */
export const thoiGianRoi = (giay: number, haiTay = false) => giay * 1000 * (haiTay ? 1.2 : 1)

/**
 * Đáp án hiện dần (bên mẹo) — người dùng 9/10/2026: "Khi hợp âm rơi hơn 60% quãng đường thì đáp án sẽ dần hiện ra". Từ 60% sáng dần
 * từng nốt tay phải (thấp lên cao), tên hiện rõ dần tới DONG_CHO (90%) — cũng là vạch viên dừng lại khi bật "chờ đúng nốt".
 */
export const LO_TU = 0.6
export const DONG_CHO = 0.9
/** Số nốt tay phải đã hiện ở quãng rơi `p` (0–1) của hợp âm `n` nốt. */
export const soNotLo = (p: number, n: number) => (p < LO_TU ? 0 : Math.min(n, Math.floor(((p - LO_TU) / (DONG_CHO - LO_TU)) * n) + 1))

/** Bên thi: mỗi lượt 20 viên; đúng từ 16 (80%) là Đạt màn. */
export const SO_CAU_THI = 20
export const DAT_THI = 16
