import { chordPitchClasses, getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { GOC } from '../vongThay'
import {
  chongCongThuc,
  chongTuDo,
  CONG_THUC,
  gocDep,
  pcsTong,
  tenBac,
  tenHaiTay,
  tenTheoChu,
  tenTren,
  theBamChong,
  vn,
  type Chong,
  type CongThuc,
} from './chongHopAm'
import { taoCauNoi } from './hopAmLuot'
import { taoCauHopSsa } from './hopAmSsa'
import { dauDuoi, duoiNgan, kieuGoc, nhomCua, NHOM_DUOI, QUY_TAC_DUOI } from './meoChong'
import { QUY_LUAT_SLASH, theSlash } from './slashChong'

/*
  GAME "MƯA HỢP ÂM" — người dùng 9/10/2026: "đã có công thức và quy luật rồi thì hãy làm thành Quiz hoặc game để tôi học thuộc bằng cách
  thực hành vì tôi ghét học thuộc lòng lý thuyết. Có thể chơi bằng đàn Midi hoặc phím chuột hoặc cảm ứng trên Android", rồi "hãy phá lệ
  làm game cho phần học thuộc công thức chồng hợp âm này" — ngoại lệ của luật "không lớp game", CHỈ cho phần này. Logic thuần (màn, chọn
  câu, chấm, lựa chọn, điểm, tốc độ, đáp án hiện dần) ở đây; giao diện ở GameChong.tsx. Câu có hai dạng: hợp âm chồng (26 công thức) và
  hợp âm slash (người dùng 9/10/2026 đồng ý thêm màn slash) — chung một kiểu `CauGame`. Viên rơi ghi luôn tên hai tay (người dùng chọn
  10/10/2026). 11/10/2026 người dùng: "màn game chia theo nhóm đuôi và áp dụng mẹo tìm theo nhóm đuôi luôn" — mỗi nhóm đuôi một màn (16
  màn, có cả hợp âm ba cơ bản), dòng mẹo trên viên = đuôi mang lại nốt nào ở chính gốc ấy ("maj7 → Sol♯"), lời giải chỉ nốt ấy nằm ở tay
  nào. Bản trước chia 5 màn theo họ chất và ghi phép cộng loại ("trưởng + thứ") — bỏ.
  16/10/2026 người dùng: "hãy làm theo lối của Quy tắc nhóm đuôi … Trong game công thức hãy làm thêm mục dạy tôi về các Passing Chord và dạy
  tôi tìm hợp âm cho vòng 2-5-1. Có thể đánh bằng đàn hoặc chọn đáp án" — thêm ba mục (thử) cạnh 18 màn đã duyệt (giữ nguyên): màn quy tắc
  nhóm đuôi (`MAN_QUY_TAC` — viên ghi hợp âm cha và thay đổi), Passing chord và vòng 2-5-1 (`hopAmLuot.ts`). Câu id `qt:` · `luot:` · `v251:`.
  Duyệt cùng ngày ("Quy tắc nhóm đuôi, passing chord và 2-5-1 đã đạt") — bỏ chữ "(thử)".
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
  /** Dòng ba — đuôi mang lại nốt nào: "maj7 → Sol♯"; slash: "bass + thứ = Cmaj7". */
  goiY: string
  /** Đáp án ở chế độ chọn tên: tên tay phải (câu chồng) hay nghĩa của slash. */
  dapAnTen: string
  /** Lời giải: "B6/9 = Si – Fa♯ + G♯sus4". */
  loi: string
  /** Nhắc ngắn sau khi đúng — như dòng ba. */
  nho: string
  /** Mẹo đầy đủ — hiện khi sai và trong tổng kết. */
  meo: string
  luaChon: LuaChon[]
  /** Câu slash luôn bấm hai tay (bass + hợp âm). */
  haiTayBuoc: boolean
  /** Nhãn nhỏ trên viên, hiện cả bên thi — loại câu ("át phụ", "2-5-1 thứ"): màn trộn cần biết đang hỏi gì. */
  the?: string
  /** Câu nhiều bước (vòng 2-5-1): bấm lần lượt từng hợp âm, viên xong khi đủ bước. Mỗi bước mang `ten` · `khungTen` · `goiY` của viên lúc ấy. */
  buoc?: readonly CauGame[]
  /** Nghe lại khi xong viên: cả câu hợp âm (Cmaj7 → A7 → Dm7), mỗi phần tử một hợp âm. */
  nghe?: readonly (readonly number[])[]
  /** Chấm theo chức năng (câu hợp âm lướt, 2-5-1): đủ các lớp `can`, nốt thêm chỉ được trong `duoc` — bấm G13 thay G7 cũng đúng. */
  chuc?: { can: readonly number[]; duoc: readonly number[] }
  /** Cách ghi dấu khi gọi tên nốt người chơi đang bấm (F♯m7 chứ không G♭m7). */
  kieu?: AccidentalStyle
  /** Chấm theo chức năng mà nốt thấp nhất phải là lớp cao độ này (câu đổi bass — cùng tay phải, bass khác là hợp âm khác). */
  bass?: number
  /** Câu hỏi của viên khi đang đố, dạng "bấm …" ("bass mới dưới tay phải F") — không có thì lời mặc định theo kiểu câu. */
  hoi?: string
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

/** Mẹo khi sai: đuôi thêm / đổi nốt nào (ở gốc đang đố) và nốt ấy nằm ở tay nào — "Nốt của đuôi maj7: Sol♯ — nằm ở tay phải C♯m". */
function meoDuoi(id: string, g: number, phai: readonly number[], tenTrai: string, tenPhaiTay: string): string {
  const tay = (iv: number) => (phai.some((m) => pc(m) === pc(g + iv)) ? `tay phải ${tenPhaiTay}` : `tay trái ${tenTrai}`)
  const ds = dauDuoi(id, g)
  const cung = new Set(ds.map((d) => tay(d.iv))).size === 1
  const noi = cung ? `${ds.map((d) => d.ten).join(' + ')} — nằm ở ${tay(ds[0]!.iv)}` : ds.map((d) => `${d.ten} (${tay(d.iv)})`).join(' + ')
  return `Nốt của đuôi ${nhomCua(id).ten}: ${noi}.`
}

/** Hợp âm ba cơ bản (`trưởng · thứ · giảm · tăng · sus2 · sus4`): tay trái gốc, tay phải cả hợp âm; bốn nút là các hợp âm ba cùng gốc. */
const CO_BAN = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'] as const
function taoCauBa(q: string, g: number, rand: () => number): CauGame {
  const st = kieuGoc(g)
  const c = chongTuDo(g, q, st)!
  const lc = (x: string): LuaChon => {
    const k = chongTuDo(g, x, st)!
    return { ten: k.nhan.phai, trai: c.trai, phai: k.phai, nhan: { trai: c.nhan.trai, traiPhu: c.nhan.traiPhu, phai: k.nhan.phai, phaiPhu: k.nhan.phaiPhu } }
  }
  const id = `q:${q}`
  return {
    id,
    ten: c.nhan.tong,
    g,
    trai: c.trai,
    phai: c.phai,
    nhan: lc(q).nhan,
    khungTen: `${c.nhan.trai} + ${c.nhan.phai}`,
    goiY: duoiNgan(id, g),
    dapAnTen: c.nhan.phai,
    loi: `${c.nhan.tong} = ${c.nhan.trai} + ${c.nhan.phai}`,
    nho: duoiNgan(id, g),
    meo: meoDuoi(id, g, c.phai, c.nhan.trai, c.nhan.phai),
    luaChon: tron([lc(q), ...tron(CO_BAN.filter((x) => x !== q), rand).slice(0, 3).map(lc)], rand),
    haiTayBuoc: false,
  }
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
    goiY: duoiNgan(ct.id, g),
    dapAnTen: phai,
    loi: `${c.nhan.tong} = ${c.nhan.trai} + ${phai}`,
    nho: duoiNgan(ct.id, g),
    meo: meoDuoi(ct.id, g, c.phai, c.nhan.trai, phai),
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
  /** id công thức chồng, `q:<loại>` (hợp âm ba cơ bản) hay `slash:<mẫu>`. */
  ids: readonly string[]
  /** Màn theo nhóm đuôi: tên nhóm — bảng mẹo bên luyện hiện thẻ của nhóm ấy. */
  nhom?: string
  /** Bảng quy luật riêng (màn slash). */
  meo?: readonly string[]
  /** Quy tắc chung giữa các đuôi (màn trộn). */
  quyTac?: readonly string[]
}

/** 18 màn: 16 nhóm đuôi (đúng thứ tự bảng), hợp âm slash, trộn cả 32 hợp âm. */
export const MAN: readonly Man[] = [
  ...NHOM_DUOI.map((n) => ({ ten: n.ten, goiY: n.duoi, ids: n.ids, nhom: n.ten })),
  {
    ten: 'Hợp âm slash',
    goiY: 'thế đảo · bass lạ = hợp âm màu viết tắt',
    ids: MAU_SLASH.map((m) => `slash:${m.id}`),
    meo: [...QUY_LUAT_SLASH, ...MAU_SLASH.map((m) => m.luat)],
  },
  { ten: 'Trộn tất cả', goiY: 'cả 32 hợp âm', ids: NHOM_DUOI.flatMap((n) => n.ids), quyTac: QUY_TAC_DUOI },
]

/* ---------------- Màn quy tắc nhóm đuôi (thử) — học hợp âm cha rồi suy ra con ---------------- */

/**
 * Hợp âm CHA của mỗi hợp âm (công thức chồng hay `q:<loại>`) — người dùng 16/10/2026: "Bên Game Công thức của phần học hợp âm hãy làm theo
 * lối của Quy tắc nhóm đuôi, hãy để tôi học theo các nhóm đuôi hợp âm. Chúng có mối liên hệ với nhau và khi nắm được một nhóm đuôi thì sẽ học
 * các nhóm liên quan dễ hơn". Lối của màn quy tắc ở Mưa khung nốt (`hocSolo/mauKhung.ts` — `CHA`, đã duyệt): mỗi loại có một cha, con = cha +
 * một thay đổi nhỏ. Cây này là của Claude: chọn cha cho con khác cha ít nốt nhất, ưu tiên quan hệ hai tay của `QUY_TAC_DUOI` (đổi một nốt tay
 * phải, tay trái giữ; tay phải leo cầu thang). Gốc cây: hợp âm trưởng. Test: cha luôn học trước con, con khác cha 1–3 nốt.
 */
export const CHA_CHONG: Readonly<Record<string, string>> = {
  'q:min': 'q:maj',
  'q:dim': 'q:min',
  'q:aug': 'q:maj',
  'q:sus4': 'q:maj',
  'q:sus2': 'q:maj',
  maj7: 'q:maj',
  '7': 'maj7',
  m7: '7',
  mMaj7: 'm7',
  m7b5: 'm7',
  dim7: 'm7b5',
  m11b5: 'm7b5',
  '7b5': '7',
  '6': 'q:maj',
  m6: '6',
  '69': '6',
  add9: 'q:maj',
  madd9: 'add9',
  maj9: 'maj7',
  'maj9#11': 'maj9',
  '9': '7',
  '9sus4': '9',
  m9: 'm7',
  m11: 'm9',
  m13: 'm11',
  '13': '6',
  '13b9': '13',
  '13b9#11': '13b9',
  '13#11': '13',
  '7b13': '13',
  '7b9': '7',
}

/** Hợp âm ba cơ bản giả làm công thức — chỉ để `tenBac` gọi đúng bậc (♯5 của tăng, 4 của sus4, ♭5 của giảm). */
const BA_GIA: Readonly<Record<string, Pick<CongThuc, 'kyHieu' | 'nhom'>>> = {
  maj: { kyHieu: '', nhom: 'Trưởng' },
  min: { kyHieu: 'm', nhom: 'Thứ' },
  dim: { kyHieu: 'dim', nhom: 'Nửa giảm · giảm' },
  aug: { kyHieu: '+', nhom: 'Trưởng' },
  sus2: { kyHieu: 'sus2', nhom: 'Trưởng' },
  sus4: { kyHieu: 'sus4', nhom: 'Trưởng' },
}
/** Bậc → số chữ cái tính từ gốc (♭5 chữ thứ năm, ♯11 chữ thứ tư). */
const CHU_BAC: Readonly<Record<string, number>> = {
  '1': 0,
  '♭9': 1,
  '9': 1,
  '♯9': 1,
  '♭3': 2,
  '3': 2,
  '4': 3,
  '11': 3,
  '♯11': 3,
  '♭5': 4,
  '5': 4,
  '♯5': 4,
  '♭13': 5,
  '6': 5,
  '13': 5,
  '𝄫7': 6,
  '♭7': 6,
  '7': 6,
}

interface NotTen {
  p: number
  ten: string
  /** Chữ cái (C · D …) — để ghép "Si → Si♭". */
  chu: string
}
/** Các nốt của hợp âm `id` ở gốc `g`, gọi tên Việt theo chữ cái của bậc. */
function notCua(id: string, g: number): NotTen[] {
  const q = id.startsWith('q:') ? id.slice(2) : null
  const ct = q ? null : CONG_THUC.find((c) => c.id === id)!
  const lop = ct ? pcsTong(ct, g) : chordPitchClasses(g, getChordQuality(q!)!)
  return lop.map((p) => {
    const ten = tenTheoChu(GOC[g]!, pc(p - g), CHU_BAC[tenBac(pc(p - g), ct ?? BA_GIA[q!]!)]!, kieuGoc(g))
    return { p: pc(p), ten: vn(ten), chu: ten[0]! }
  })
}

/** "Si → Si♭" · "thêm Rê" · "bỏ Mi · bỏ Sol · thêm Fa" — so nốt cha với nốt con; cùng chữ cái ghép một mũi tên, còn đúng một bỏ một thêm
 *  thì cũng ghép (Mi → Fa của sus4). */
function doiNot(cu: readonly NotTen[], moi: readonly NotTen[]): string {
  let bo = cu.filter((n) => !moi.some((m) => m.p === n.p))
  let them = moi.filter((n) => !cu.some((m) => m.p === n.p))
  const ra: string[] = []
  for (const b of [...bo]) {
    const t = them.find((x) => x.chu === b.chu)
    if (!t) continue
    ra.push(`${b.ten} → ${t.ten}`)
    bo = bo.filter((x) => x !== b)
    them = them.filter((x) => x !== t)
  }
  if (bo.length === 1 && them.length === 1) return [...ra, `${bo[0]!.ten} → ${them[0]!.ten}`].join(' · ')
  return [...ra, ...bo.map((b) => `bỏ ${b.ten}`), ...them.map((t) => `thêm ${t.ten}`)].join(' · ')
}

/** Câu của một hợp âm như màn nhóm đuôi (`q:<loại>` hay id công thức). */
const cauGoc = (id: string, g: number, rand: () => number) => (id.startsWith('q:') ? taoCauBa(id.slice(2), g, rand) : taoCau(CONG_THUC.find((c) => c.id === id)!, g, rand))

/**
 * Câu màn quy tắc: viên ghi hợp âm cha cùng thế chồng của nó ("từ Cmaj7: Đô + Em") và thay đổi ("Si → Si♭") — người chơi suy ra thế chồng
 * của con. Chấm, đáp án hiện dần, bốn nút như màn nhóm đuôi; trong bốn nút luôn có tay phải của cha (lỗi quên đổi nốt).
 */
export function taoCauQuyTac(id: string, g: number, rand: () => number = Math.random): CauGame {
  const c = cauGoc(id, g, rand)
  const chaId = CHA_CHONG[id]
  if (!chaId) return { ...c, id: `qt:${id}`, goiY: 'gốc của cây — thuộc trước', nho: 'gốc của cây', loi: `${c.loi} — gốc của cây`, meo: `${c.loi} — gốc của cây: mọi hợp âm khác suy ra từ đây.` }
  const p = cauGoc(chaId, g, rand)
  const doi = doiNot(notCua(chaId, g), notCua(id, g))
  const tay = [
    p.nhan.trai === c.nhan.trai ? `tay trái giữ ${c.nhan.trai}` : `tay trái ${p.nhan.trai} → ${c.nhan.trai}`,
    p.dapAnTen === c.dapAnTen ? `tay phải giữ ${c.dapAnTen}` : `tay phải ${p.dapAnTen} → ${c.dapAnTen}`,
  ].join(', ')
  let luaChon = c.luaChon
  if (!luaChon.some((l) => l.ten === p.dapAnTen)) {
    const cha: LuaChon = { ten: p.dapAnTen, trai: c.trai, phai: datTren(p.phai, Math.max(...c.trai)), nhan: { ...c.nhan, phai: p.nhan.phai, phaiPhu: p.nhan.phaiPhu } }
    const k = luaChon.findIndex((l) => l.ten !== c.dapAnTen)
    luaChon = luaChon.map((l, i) => (i === k ? cha : l))
  }
  return {
    ...c,
    id: `qt:${id}`,
    khungTen: `từ ${p.ten}: ${p.khungTen}`,
    goiY: doi,
    nho: `từ ${p.ten}: ${doi}`,
    loi: `${c.loi} — từ ${p.ten}: ${doi}`,
    meo: `${c.loi}. Từ ${p.ten} (${p.khungTen}): ${doi} — ${tay}.`,
    luaChon,
  }
}

/** Một màn quy tắc: ý chính (lời Claude) + cây cha – con của các hợp âm trong màn ở gốc Đô (sinh từ `taoCauQuyTac`, không gõ tay). */
const manQT = (ten: string, goiY: string, ids: readonly string[], y: string): Man => ({
  ten,
  goiY,
  ids: ids.map((id) => `qt:${id}`),
  meo: [y, ...ids.map((id) => taoCauQuyTac(id, 0, () => 0.5).loi)],
})
/** Sáu màn theo nhóm đuôi liên quan: cha luôn ở màn trước hay đứng trước trong cùng màn. */
const MAN_QT: readonly Man[] = [
  manQT('Hợp âm ba — đổi một nốt', 'Trưởng → Thứ → Giảm · Tăng · Treo', ['q:maj', 'q:min', 'q:dim', 'q:aug', 'q:sus4', 'q:sus2'], 'Đổi đúng một nốt của C (Đô – Mi – Sol) là ra năm hợp âm ba kia — tay trái giữ Đô, tay phải đổi một nốt.'),
  manQT('Ba hợp âm bảy gốc: maj7 · 7 · m7', 'thêm Si, rồi mỗi bước đổi một nốt', ['maj7', '7', 'm7', 'mMaj7'], 'C thêm Si = Cmaj7: tay phải leo lên một bậc (C → Em). Rồi mỗi bước chỉ đổi một nốt ở tay phải, tay trái giữ Đô.'),
  manQT('Giảm: m7♭5 · dim7 · m11♭5 · 7♭5', 'hạ Sol → Sol♭, rồi hạ tiếp', ['m7b5', 'dim7', 'm11b5', '7b5'], 'Hạ Sol → Sol♭ là sang họ giảm (Cm7 → Cm7♭5, C7 → C7♭5); hạ tiếp Si♭ → La là Cdim7.'),
  manQT('6 · add9 — thêm một nốt, không có 7', 'C + La · C + Rê', ['6', 'm6', '69', 'add9', 'madd9'], 'Không có 7: thêm La là 6, thêm Rê là add9. Đổi Mi → Mi♭ ở tay phải là ra bản thứ.'),
  manQT(
    'Cầu thang 9 · 11 · 13',
    'tay phải giữ hai nốt trên, thêm một nốt',
    ['maj9', 'maj9#11', '9', '9sus4', 'm9', 'm11', 'm13'],
    'Tay phải leo cầu thang: giữ hai nốt trên của tay phải cũ, thêm một nốt ở trên — Em → G → Bm · Edim → Gm → B♭ · E♭ → Gm → B♭ → Dm. Tay trái đổi theo cho đủ nốt.',
  ),
  manQT('Át có nốt căng: 13 · ♭9 · ♯11 · ♭13', 'từ C13 hay C7 đổi một nốt', ['13', '13b9', '13b9#11', '13#11', '7b13', '7b9'], 'C13 = khung C7 ở tay trái + Am (tay phải của C6). Từ C13 đổi nốt ở tay phải là ra các át căng; C7 thêm Rê♭ là C7♭9.'),
]
/** 7 màn quy tắc: sáu màn nhóm đuôi liên quan + trộn cả 32 hợp âm. */
export const MAN_QUY_TAC: readonly Man[] = [
  ...MAN_QT,
  {
    ten: 'Trộn tất cả',
    goiY: 'cả 32 hợp âm',
    ids: MAN_QT.flatMap((m) => m.ids),
    meo: ['Mỗi hợp âm có một hợp âm cha: nhớ thế chồng của cha rồi đổi đúng nốt viên ghi.', ...QUY_TAC_DUOI],
  },
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
  if (id.startsWith('qt:')) return taoCauQuyTac(id.slice(3), g, rand)
  if (id.startsWith('luot:') || id.startsWith('v251:')) return taoCauNoi(id, g, rand)
  if (id.startsWith('ssa:')) return taoCauHopSsa(id, g, rand)
  if (id.startsWith('q:')) return taoCauBa(id.slice(2), g, rand)
  const mau = MAU_SLASH.find((m) => `slash:${m.id}` === id)
  return mau ? taoCauSlash(mau, g, rand) : taoCau(CONG_THUC.find((c) => c.id === id)!, g, rand)
}

/* ---------------- Chấm ---------------- */

const tapLop = (ns: readonly number[]) => new Set(ns.map(pc))
const bang = (a: ReadonlySet<number>, b: ReadonlySet<number>) => a.size === b.size && [...a].every((x) => b.has(x))

/** Đúng chức năng: đủ các lớp phải có, không lớp nào ngoài `can` ∪ `duoc`. */
const dungChuc = (ns: readonly number[], ch: NonNullable<CauGame['chuc']>) => {
  const s = tapLop(ns)
  return ch.can.every((p) => s.has(p)) && [...s].every((p) => ch.can.includes(p) || ch.duoc.includes(p))
}

/** Tay phải đúng: đúng các lớp cao độ của tay phải — quãng tám nào, thế đảo nào cũng được (bấm kèm cả tay trái cũng tính). Câu có `chuc`
 *  (cả hợp âm, không sáng tay trái) chấm theo chức năng. */
export const dungTayPhai = (ns: readonly number[], c: CauGame) =>
  ns.length > 0 &&
  (c.chuc
    ? dungChuc(ns, c.chuc) && (c.bass === undefined || pc(Math.min(...ns)) === c.bass)
    : bang(tapLop(ns), tapLop(c.phai)) || bang(tapLop(ns), tapLop([...c.trai, ...c.phai])))

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
 * Gợi ý bên mẹo — người dùng 16/10/2026: "Trong tất cả game hợp âm hay chạy nốt thì hãy đều hiện gợi ý ngay từ đầu nhưng mờ và khi càng
 * gần phím đàn càng rõ". Mọi phím gợi ý (và tên tay đứng trên gợi ý) hiện ngay khi viên sinh ra; độ rõ tăng đều theo quãng rơi, rõ hẳn ở
 * DONG_CHO (90 % — vạch viên dừng khi bật "chờ đúng nốt"). Dùng chung cho Mưa hợp âm, Mưa khung nốt (cả chơi trên nền), Game chạy ngón.
 * Độ rõ đầu 0,2 là Claude chọn, chưa đo. Cũ (9/10/2026 — "Khi hợp âm rơi hơn 60% quãng đường thì đáp án sẽ dần hiện ra"): trước 60 % không
 * hiện gì, từ 60 % sáng dần từng nốt thấp lên cao (`LO_TU` 0,6, `soNotLo`). Lùi khi: gợi ý ngay từ đầu làm người chơi chỉ nhìn phím mà
 * không tự nghĩ → trả lại mốc 60 %; mờ quá không thấy → nâng DO_RO_DAU.
 */
export const DO_RO_DAU = 0.2
export const DONG_CHO = 0.9
/** Độ rõ (0–1) của gợi ý ở quãng rơi `p` (0–1). */
export const doRoGoiY = (p: number) => DO_RO_DAU + (1 - DO_RO_DAU) * Math.min(1, Math.max(0, p) / DONG_CHO)
/** Bậc độ rõ (20 bậc) — vẽ lại bàn phím khi bậc đổi, không phải mỗi khung hình. */
export const bacDoRo = (p: number) => Math.round(doRoGoiY(p) * 20)

/** Bên thi: mỗi lượt 20 viên; đúng từ 16 (80%) là Đạt màn. */
export const SO_CAU_THI = 20
export const DAT_THI = 16
