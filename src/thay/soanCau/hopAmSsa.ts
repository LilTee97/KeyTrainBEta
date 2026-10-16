import { tenNhuAnh } from '../hocSolo/loiSsa'
import duNhuAnh from '../hocSolo/ssaNhuAnh.json'
import { GOC } from '../vongThay'
import { BA, chongCongThuc, CONG_THUC, gocDep, hauDep, tenBam, tenHaiTay, tenTheoChu, tenTren, vn, type CongThuc, type LoaiBa } from './chongHopAm'
import type { CauGame, LuaChon, Man } from './gameChong'
import type { DoanBai } from './hopAmLuot'
import { kieuGoc } from './meoChong'

/*
  HỢP ÂM SSA — mục thứ năm của Game công thức. Người dùng 16/10/2026 hỏi "có đưa các hợp âm mới mà bạn học được từ các Video SSA vào KT để dạy
  tôi chưa · từ các hợp âm SSA đó bạn có học được quy luật gì mới để tạo hợp âm ko", rồi "làm đi" với đề xuất của Claude.
  Nguồn: thế anh SSA bấm từng hợp âm trong ba clip "Rải Ngón" — `hocSolo/ssaNhuAnh.json` (tay nào đánh đo bằng hình, tools/do_tay_ssa.py).
  Chỉ thế có số đo đủ mới thành màn chấm điểm (đếm 16/10/2026 trên hợp âm có tay phải ≥ 3 nốt — md ssa-rai-ngon.md, mục "Hai tay" 7):
  - maj7 = bass + thứ trên bậc 3 · 6/7; m7 = bass + trưởng trên ♭3 · 13/15; 9sus4 = bass + trưởng trên ♭7 · 3/3 — trùng công thức của bảng;
  - maj9 = bass + m7 trên bậc 3 · 8/9; 13sus4 = bass + maj7 trên ♭7 · 4/4 — tay phải bốn nốt, bảng công thức chưa có;
  - giữ tay phải, đổi bass: 46/91 chỗ đổi bass anh giữ ≥ 2 nốt tay phải; cùng thế Rê♭ – Fa – La♭ cho B♭m7 · E♭9sus4 (Rai 2), cùng
    Fa – La♭ – Đô – Mi♭ cho Fm7 · D♭maj9 (Rai 3).
  Chỉ ở bài học (mẫu nhỏ): m6 (3/3, một hợp âm), m9 (3/6), m7♭5 (1/2), và bốn loại thư viện thêm 15/10 — maj9sus4 · 7(13) · m11♭5 là nhãn màn
  hình lúc anh chuyển hợp âm hay hợp âm lướt, không phải thế anh chủ ý (cách đọc của Claude). Câu đổi bass (cặp hợp âm nào) là Claude dựng
  từ các thế đo được; nút nhiễu và lời giảng là của Claude.
*/

const pc = (x: number) => ((x % 12) + 12) % 12
const tron = <T,>(ds: readonly T[], rand: () => number) => {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const ct = (id: string) => CONG_THUC.find((c) => c.id === id)!
/** Hai thế của anh mà bảng công thức chưa có: tay phải là hợp âm BẢY dựng trên cùng bậc với thế hợp âm 7 (thêm một nốt trên đỉnh). */
const MAJ9_SSA: CongThuc = {
  id: 'ssa-maj9',
  kyHieu: 'maj9',
  nhom: 'Trưởng',
  duoi: [[0]],
  tenDuoi: 'gốc',
  tren: { loai: 'm7', cach: 4 },
  quanHe: 'hợp âm BẢY THỨ trên bậc 3',
  viSao: 'Thế maj7 của anh SSA (thứ trên bậc 3) thêm nốt 9 trên đỉnh tay phải: hợp âm ba thứ thành m7.',
  viDu: { truong: 0, thu: 8 },
  nguon: 'ssa',
  thay: ['SSA'],
}
const SUS13_SSA: CongThuc = {
  id: 'ssa-13sus4',
  kyHieu: '13sus4',
  nhom: 'Át',
  duoi: [[0]],
  tenDuoi: 'gốc',
  tren: { loai: 'maj7', cach: 10 },
  quanHe: 'hợp âm BẢY TRƯỞNG trên ♭7',
  viSao: 'Thế 9sus4 (trưởng trên ♭7) thêm nốt 13 trên đỉnh tay phải: hợp âm ba trưởng thành maj7.',
  viDu: { truong: 7, thu: 7 },
  nguon: 'ssa',
  thay: ['SSA'],
}

interface TheSsa {
  id: string
  ten: string
  ct: CongThuc
  /** "thứ trên bậc 3" */
  quy: string
  /** Gốc tay phải cách bass: nửa cung, chữ cái — và tên bậc ấy. */
  bac: readonly [number, number]
  tenBac: string
  /** Số đo trên thế anh bấm. */
  so: string
  /** Thế cha và nốt thêm trên đỉnh (nửa cung, chữ cái từ bass) — màn "thêm một nốt". */
  cha?: string
  them?: readonly [number, number]
  /** Ba nút nhiễu: tay phải loại nào, dựng trên bậc nào (nửa cung từ bass). */
  nhieu: readonly (readonly [LoaiBa, number])[]
}
export const THE_SSA: readonly TheSsa[] = [
  { id: 'maj7', ten: 'maj7', ct: ct('maj7'), quy: 'thứ trên bậc 3', bac: [4, 2], tenBac: 'bậc 3', so: '6/7 hợp âm maj7', nhieu: [['M', 3], ['M', 10], ['M', 4]] },
  { id: 'm7', ten: 'm7', ct: ct('m7'), quy: 'trưởng trên ♭3', bac: [3, 2], tenBac: '♭3', so: '13/15 hợp âm m7', nhieu: [['m', 4], ['M', 10], ['m', 3]] },
  { id: '9sus4', ten: '9sus4', ct: ct('9sus4'), quy: 'trưởng trên ♭7', bac: [10, 6], tenBac: '♭7', so: '3/3 hợp âm 9sus4', nhieu: [['M', 3], ['m', 4], ['m', 10]] },
  {
    id: 'maj9',
    ten: 'maj9',
    ct: MAJ9_SSA,
    quy: 'm7 trên bậc 3',
    bac: [4, 2],
    tenBac: 'bậc 3',
    so: '8/9 hợp âm maj9',
    cha: 'maj7',
    them: [2, 1],
    nhieu: [['m', 4], ['maj7', 4], ['maj7', 10]],
  },
  {
    id: '13sus',
    ten: '13sus4',
    ct: SUS13_SSA,
    quy: 'maj7 trên ♭7',
    bac: [10, 6],
    tenBac: '♭7',
    so: '4/4 hợp âm 13sus',
    cha: '9sus4',
    them: [9, 5],
    nhieu: [['M', 10], ['m7', 10], ['m7', 4]],
  },
]

/** Câu thế chồng: viên ghi quy tắc (màn gốc) hay thế cha + nốt thêm (màn "thêm một nốt"); bốn nút là tay phải các thế khác cùng gốc. */
function taoCauThe(x: TheSsa, g: number, rand: () => number): CauGame {
  const st = kieuGoc(g)
  const gocTen = GOC[g]!
  const c = chongCongThuc(x.ct, g, gocTen, st)
  const phai = tenTren(x.ct, gocTen, st)
  const ten = c.nhan.tong
  const vg = vn(gocTen)
  const lc = (k: CongThuc): LuaChon => {
    const h = chongCongThuc(k, g, gocTen, st)
    return { ten: tenTren(k, gocTen, st), trai: c.trai, phai: h.phai, nhan: { trai: c.nhan.trai, traiPhu: c.nhan.traiPhu, phai: h.nhan.phai, phaiPhu: h.nhan.phaiPhu } }
  }
  const dung = lc(x.ct)
  const chung = {
    id: `ssa:${x.id}`,
    ten,
    g,
    trai: c.trai,
    phai: c.phai,
    nhan: dung.nhan,
    dapAnTen: phai,
    luaChon: tron([dung, ...x.nhieu.map(([loai, cach]) => lc({ ...x.ct, tren: { loai, cach } }))], rand),
    haiTayBuoc: false,
  }
  if (!x.cha) {
    const notBac = vn(tenTheoChu(gocTen, x.bac[0], x.bac[1], st))
    return {
      ...chung,
      khungTen: `tay trái ${vg} · tay phải ${phai}`,
      goiY: `${x.quy} (${x.tenBac} = ${notBac})`,
      loi: `${ten}: tay trái ${vg} · tay phải ${phai} (${dung.nhan.phaiPhu}) — ${x.quy} (anh SSA: ${x.so})`,
      nho: x.quy,
      meo: `${ten}: tay trái ${vg} (bass) · tay phải ${phai} (${dung.nhan.phaiPhu}) — hợp âm ${x.quy}: ${x.tenBac} của ${vg} là ${notBac}.`,
    }
  }
  const cha = THE_SSA.find((y) => y.id === x.cha)!
  const chaTen = chongCongThuc(cha.ct, g, gocTen, st).nhan.tong
  const chaPhai = tenTren(cha.ct, gocTen, st)
  const them = vn(tenTheoChu(gocTen, x.them![0], x.them![1], st))
  const sosanh = x.id === 'maj9' ? ` Bảng công thức dạy ${ten} = ${gocDep(gocTen)} + ${gocDep(tenTheoChu(gocTen, 7, 4, st))} (thế của Jeff) — cả hai đúng.` : ''
  return {
    ...chung,
    khungTen: `tay trái ${vg} · tay phải ${phai}`,
    goiY: `${chaTen} thêm ${them} trên đỉnh`,
    loi: `${ten}: tay trái ${vg} · tay phải ${phai} (${dung.nhan.phaiPhu}) — ${chaTen} thêm ${them} trên đỉnh (anh SSA: ${x.so})`,
    nho: `${chaPhai} + ${them} = ${phai}`,
    meo: `${ten}: tay trái ${vg} · tay phải ${phai} (${dung.nhan.phaiPhu}). ${chaTen} là tay trái ${vg} · tay phải ${chaPhai}; thêm ${them} trên đỉnh tay phải thì ${chaPhai} thành ${phai}.${sosanh}`,
  }
}

/* ---------------- Giữ tay phải, đổi bass ---------------- */

interface DoiSsa {
  id: string
  /** Hợp âm trước: hậu tố, gốc cách gốc hợp âm đích (nửa cung, chữ cái — luôn đếm lên). */
  tu: { hau: string; semi: number; chu: number }
  /** Hợp âm đích (gốc = gốc của câu): hậu tố, thế của nó và tay phải giữ đứng ở bậc nào của bass. */
  den: { hau: string; quy: string; tenBac: string }
  /** Tay phải giữ nguyên: loại và gốc (cách gốc đích). */
  giu: { loai: LoaiBa; semi: number; chu: number }
  /** Bằng chứng của anh. */
  anh: string
}
const DOI_SSA: readonly DoiSsa[] = [
  {
    id: 'm7>9sus4',
    tu: { hau: 'm7', semi: 7, chu: 4 },
    den: { hau: '9sus4', quy: 'trưởng trên ♭7', tenBac: '♭7' },
    giu: { loai: 'M', semi: 10, chu: 6 },
    anh: 'Anh dùng cùng thế Rê♭ – Fa – La♭ cho B♭m7 (Rai 2 · 0:54) và E♭9sus4 (Rai 2 · 0:43)',
  },
  {
    id: 'm7>maj9',
    tu: { hau: 'm7', semi: 4, chu: 2 },
    den: { hau: 'maj9', quy: 'm7 trên bậc 3', tenBac: 'bậc 3' },
    giu: { loai: 'm7', semi: 4, chu: 2 },
    anh: 'Anh dùng cùng thế Fa – La♭ – Đô – Mi♭ cho Fm7 (Rai 3 · 0:50) và D♭maj9 (Rai 3 · 0:36)',
  },
  {
    id: 'maj9>m7',
    tu: { hau: 'maj9', semi: 8, chu: 5 },
    den: { hau: 'm7', quy: 'cả hợp âm m7 ở tay phải', tenBac: 'gốc' },
    giu: { loai: 'm7', semi: 0, chu: 0 },
    anh: 'Anh dùng cùng thế Fa – La♭ – Đô – Mi♭ cho D♭maj9 (Rai 3 · 0:36) và Fm7 (Rai 3 · 0:50)',
  },
]

/** Nốt bass ở G2–F♯3 như tay trái của công thức chồng. */
const notBass = (p: number) => (48 + pc(p) > 54 ? 36 + pc(p) : 48 + pc(p))
/** Đặt các nốt ngay trên nốt `cao`. */
const datTren = (ns: readonly number[], cao: number) => {
  let x = [...ns]
  while (Math.min(...x) <= cao) x = x.map((m) => m + 12)
  while (Math.min(...x) - 12 > cao) x = x.map((m) => m - 12)
  return x
}

/** Câu đổi bass: giữ nguyên tay phải của hợp âm trước, tìm bass cho hợp âm đích — bass phải là nốt thấp nhất (hay chọn "bass …"). */
function taoCauDoi(d: DoiSsa, g: number, rand: () => number): CauGame {
  const st = kieuGoc(g)
  const gocTen = GOC[g]!
  const tuGoc = tenTheoChu(gocTen, d.tu.semi, d.tu.chu, st)
  const giuGoc = tenTheoChu(gocTen, d.giu.semi, d.giu.chu, st)
  const tuTen = `${gocDep(tuGoc)}${hauDep(d.tu.hau)}`
  const denTen = `${gocDep(gocTen)}${hauDep(d.den.hau)}`
  const giuTen = `${gocDep(giuGoc)}${BA[d.giu.loai].hau}`
  const bTu = notBass(g + d.tu.semi)
  const bDen = notBass(g)
  const giu = datTren(
    BA[d.giu.loai].iv.map((iv) => pc(g + d.giu.semi) + iv),
    Math.max(bTu, bDen),
  )
  /* Tên nốt tay phải theo chữ cái của chính hợp âm ấy (Fm7 = Fa – La♭ – Đô – Mi♭ cả ở gốc Đô♯). */
  const tenGiu = tenHaiTay({ ...MAJ9_SSA, tren: { loai: d.giu.loai, cach: d.giu.semi } }, gocTen, st).phai
  const giuNot = tenGiu.join(' – ')
  const hop = (b: number) => [b, ...giu].sort((x, y) => x - y)
  const notHop = (bass: string) => [...new Set([vn(bass), ...tenGiu])].join(' – ')
  const den = hop(bDen)
  /* Bass để chọn: bass đúng, bass cũ (không đổi), gốc tay phải, dưới gốc tay phải một cung, bậc 5 của tay phải — tên theo chữ cái. */
  const ung: (readonly [number, string])[] = [
    [g, gocTen],
    [g + d.tu.semi, tuGoc],
    [g + d.giu.semi, giuGoc],
    [g + d.giu.semi + 10, tenTheoChu(giuGoc, 10, 6, st)],
    [g + d.giu.semi + 7, tenTheoChu(giuGoc, 7, 4, st)],
  ]
  const luaChon = tron(
    ung
      .filter(([p], i) => ung.findIndex(([q]) => pc(q) === pc(p)) === i)
      .slice(0, 4)
      .map(([p, ten]): LuaChon => {
        const ns = hop(notBass(p))
        return { ten: `bass ${vn(ten)}`, trai: [], phai: ns, nhan: { trai: '', traiPhu: '', phai: tenBam(ns).ten, phaiPhu: notHop(ten) } }
      }),
    rand,
  )
  return {
    id: `ssa:doi:${d.id}`,
    ten: `${tuTen} → ${denTen}`,
    g,
    the: `giữ tay phải ${giuTen}`,
    khungTen: `tay trái ${vn(gocTen)} · tay phải ${giuTen}`,
    goiY: `${hauDep(d.den.hau)} = ${d.den.quy}`,
    hoi: `bass mới dưới tay phải ${giuTen}`,
    trai: [],
    phai: den,
    nhan: { trai: '', traiPhu: '', phai: denTen, phaiPhu: notHop(gocTen) },
    dapAnTen: `bass ${vn(gocTen)}`,
    loi: `${tuTen} → ${denTen}: tay phải giữ ${giuTen} (${giuNot}), tay trái ${vn(tuGoc)} → ${vn(gocTen)}. ${d.anh}`,
    nho: `tay trái ${vn(gocTen)}`,
    meo: `${denTen}: tay trái ${vn(gocTen)} · tay phải ${giuTen} — ${vn(giuGoc)} là ${d.den.tenBac} của ${vn(gocTen)} (${hauDep(d.den.hau)} = ${d.den.quy}). Giữ nguyên tay phải ${giuTen} (${giuNot}), chỉ đổi tay trái — bass là nốt thấp nhất.`,
    luaChon,
    haiTayBuoc: false,
    nghe: [hop(bTu), den],
    chuc: { can: [...new Set(den.map(pc))], duoc: [] },
    bass: pc(g),
    kieu: st,
  }
}

/** Câu của mục (`ssa:<thế>` · `ssa:doi:<cặp>`) ở gốc `g` — gốc của hợp âm đích. */
export function taoCauHopSsa(id: string, g: number, rand: () => number = Math.random): CauGame {
  if (id.startsWith('ssa:doi:')) return taoCauDoi(DOI_SSA.find((d) => `ssa:doi:${d.id}` === id)!, g, rand)
  return taoCauThe(THE_SSA.find((x) => `ssa:${x.id}` === id)!, g, rand)
}

/* ---------------- Màn và bài giảng ---------------- */

const idThe = (...ids: string[]) => ids.map((x) => `ssa:${x}`)
const ID_DOI = DOI_SSA.map((d) => `ssa:doi:${d.id}`)
/** "Cmaj9 = Đô + Em7" — ví dụ của màn viết từ chính câu ở gốc `g`. */
const viDu = (id: string, g: number) => {
  const c = taoCauHopSsa(id, g, () => 0.5)
  return `${c.ten} = ${vn(GOC[g]!)} + ${c.dapAnTen}`
}
const LUAT_GOC = [
  'Anh SSA dựng hợp âm màu = bass + một hợp âm ba quen trên một bậc — đúng lối chồng của bảng công thức.',
  'maj7 = bass + thứ trên bậc 3 (6/7 hợp âm maj7 của anh) · m7 = bass + trưởng trên ♭3 (13/15) · 9sus4 = bass + trưởng trên ♭7 (3/3 — lời anh: "Cb/Db thực ra là Db9sus4").',
  'Đếm trên thế tay phải anh bấm (đo bằng hình), hợp âm có tay phải từ 3 nốt — 3 clip, một người chơi.',
]
const LUAT_THEM = [
  'Thêm một nốt trên đỉnh tay phải: hợp âm ba thành hợp âm bảy cùng bậc.',
  'maj9 = bass + m7 trên bậc 3 (8/9 hợp âm maj9 của anh) · 13sus4 = bass + maj7 trên ♭7 (4/4).',
  'Bảng công thức dạy Cmaj9 = C + G (thế của Jeff) — cả hai đúng; thế của anh tay trái chỉ cần một nốt.',
]
const LUAT_DOI = [
  'Giữ nguyên tay phải, đổi bass là ra hợp âm khác — ở 46/91 chỗ đổi bass anh giữ từ 2 nốt tay phải trở lên.',
  'Cùng thế Rê♭ – Fa – La♭: bass Si♭ = B♭m7, bass Mi♭ = E♭9sus4 (Rai 2). Cùng thế Fa – La♭ – Đô – Mi♭: bass Fa = Fm7, bass Rê♭ = D♭maj9 (Rai 3).',
  'Tìm bass: tay phải đứng ở bậc nào của hợp âm đích (♭7 · bậc 3 · gốc) thì bass thấp hơn đúng bấy nhiêu. Bass phải là nốt thấp nhất.',
]

export const MAN_HOP_SSA: readonly Man[] = [
  { ten: 'Ba thế chồng gốc của anh', goiY: 'maj7 · m7 · 9sus4 — bass + hợp âm ba trên một bậc', ids: idThe('maj7', 'm7', '9sus4'), meo: LUAT_GOC },
  { ten: 'Thêm một nốt trên đỉnh: maj9 · 13sus4', goiY: `${viDu('ssa:maj9', 0)} · ${viDu('ssa:13sus', 7)}`, ids: idThe('maj9', '13sus'), meo: LUAT_THEM },
  { ten: 'Giữ tay phải, đổi bass', goiY: 'Dm7 → G9sus4 giữ F · Fm7 → D♭maj9 giữ Fm7', ids: ID_DOI, meo: LUAT_DOI },
  {
    ten: 'Trộn',
    goiY: 'cả ba màn — nhãn trên viên cho biết câu đổi bass',
    ids: [...idThe('maj7', 'm7', '9sus4', 'maj9', '13sus'), ...ID_DOI],
    meo: [LUAT_GOC[1]!, LUAT_THEM[1]!, LUAT_DOI[2]!],
  },
]

interface DoanNhuAnh {
  clip: string
  t: number
  goc: string
  loai: string
  bass: string | null
  trai: number[]
  the: number[]
}
const NHU_ANH = (duNhuAnh as unknown as { doan: DoanNhuAnh[] }).doan
const PC_TEN: Readonly<Record<string, number>> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
const CLIP: Readonly<Record<string, string>> = { rai1: 'Rai 1', rai2: 'Rai 2', rai3: 'Rai 3' }
const phut = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
/**
 * Một hợp âm như anh bấm (clip, giây): tay phải lúc đầy nhất + nốt tay trái là gốc, bậc 5 hay bass của nhãn — bỏ nốt tay trái đi dần lên
 * (Sol – La♭ – La trước F7/A) để khi nghe một lần cả khối không thành chùm nốt sát nhau.
 */
function hopAnh(clip: string, t: number) {
  const x = NHU_ANH.find((d) => d.clip === clip && Math.abs(d.t - t) < 0.3)!
  const g = PC_TEN[x.goc]!
  const giu = new Set([g, pc(g + 7), ...(x.bass ? [PC_TEN[x.bass]!] : [])])
  return { ten: tenNhuAnh(x.goc, x.loai, x.bass), not: [...new Set([...x.trai.filter((m) => giu.has(pc(m))), ...x.the])].sort((a, b) => a - b), t }
}
/** Ví dụ ▶ nghe đúng nốt anh bấm: một hay nhiều hợp âm liền nhau của một clip. */
function ngheAnh(clip: string, ...ts: number[]) {
  const hs = ts.map((t) => hopAnh(clip, t))
  return { ten: `${hs.map((h) => h.ten).join(' → ')} (${CLIP[clip]} · ${phut(ts[0]!)})`, hop: hs.map((h) => h.not) }
}
/** Ví dụ dựng theo công thức ở gốc `g` (không phải nốt anh bấm). */
const ngheCt = (id: string, g: number) => {
  const c = taoCauHopSsa(id, g, () => 0.5)
  return { ten: `${viDu(id, g)} (công thức)`, hop: [[...c.trai, ...c.phai]] }
}

/** Bài giảng — lời gia sư của Claude; số đo ghi cỡ mẫu; nút ▶ phát đúng nốt anh bấm (đo bằng hình) trừ chỗ ghi "công thức". */
export const BAI_SSA: readonly DoanBai[] = [
  {
    tieuDe: 'Anh SSA dựng hợp âm thế nào',
    loi: [
      'Tay trái gõ bass ở đầu ô rồi rải 5 – 8 (101 hợp âm có tay trái: một cú 23 · bass rồi quãng 8 hay quãng 5 40 · rải từ 3 nốt 34). Tay phải bấm một hợp âm ba — hay bốn nốt — dựng trên một bậc của bass, rồi chạy nốt trên đỉnh.',
      'Ba thế gốc trùng công thức của bảng: maj7 = thứ trên bậc 3 (6/7) · m7 = trưởng trên ♭3 (13/15) · 9sus4 = trưởng trên ♭7 (3/3). Đếm trên thế tay phải anh bấm (đo bằng hình), chỉ hợp âm có tay phải từ 3 nốt.',
      'Cỡ mẫu: 3 clip, 232 giây, 111 hợp âm, một người chơi — đủ thấy thói quen của anh, chưa đủ gọi là phong cách chung.',
    ],
    nghe: [ngheAnh('rai3', 63.5), ngheAnh('rai2', 54.5), ngheAnh('rai2', 43.5)],
  },
  {
    tieuDe: 'Thêm một nốt trên đỉnh: maj9 · 13sus4',
    loi: [
      'maj9 = bass + m7 dựng trên bậc 3: D♭maj9 = Rê♭ + Fm7 (Fa – La♭ – Đô – Mi♭) — 8/9 hợp âm maj9 của anh.',
      '13sus4 = bass + maj7 dựng trên ♭7: E♭13sus4 = Mi♭ + D♭maj7 (Rê♭ – Fa – La♭ – Đô) — 4/4.',
      'Biết thế 7 thì thế 9 hay 13 chỉ thêm một nốt trên đỉnh tay phải. Bảng công thức dạy Cmaj9 = C + G (thế của Jeff) — cả hai đúng; thế của anh tay trái chỉ cần một nốt.',
    ],
    nghe: [ngheAnh('rai2', 11), ngheAnh('rai2', 16.5), ngheCt('ssa:maj9', 0), ngheCt('ssa:13sus', 7)],
  },
  {
    tieuDe: 'Giữ tay phải, đổi bass',
    loi: [
      'Rai 1 mở bằng Cmaj9 → Am9(11): tay phải giữ nguyên Mi – Sol – Si – Đô – Rê, chỉ bass Đô xuống La. Cùng nốt Si mà trên Đô là bậc 7, trên La là bậc 9 — anh nói "giai điệu vẫn là E D F E" mà màu đổi.',
      'Cùng thế Fa – La♭ – Đô – Mi♭: bass Fa = Fm7 (Rai 3 · 0:50), bass Rê♭ = D♭maj9 (Rai 3 · 0:36). Cùng thế Rê♭ – Fa – La♭: bass Si♭ = B♭m7 (Rai 2 · 0:54), bass Mi♭ = E♭9sus4 (Rai 2 · 0:43).',
      'Đếm: ở 46/91 chỗ đổi bass anh giữ từ 2 nốt tay phải trở lên (đo bằng hình).',
    ],
    nghe: [ngheAnh('rai1', 0.5, 4.5), ngheAnh('rai3', 50, 36.5), ngheAnh('rai2', 54.5, 43.5)],
  },
  {
    tieuDe: 'Anh nối hợp âm thế nào',
    loi: [
      'Từ bậc 1 về bậc 4 qua I9sus4: D♭maj7 → D♭9sus4 → G♭maj9 (Rai 3 · 1:03 – 1:10) — tay phải C♭ trưởng (Đô♭ – Mi♭ – Sol♭) trên bass Rê♭, đúng lời anh "Cb/Db thực ra là Db9sus4 — thường gặp khi đi từ 1 về 4".',
      'Át phụ có bass cảm âm: Fm7 → F7/A → B♭m7 (Rai 3 · 1:17 – 1:20) — bass Sol – La♭ – La đi lên từng nửa cung vào Si♭, như Cà Pháo (F7/A → B♭m). Xem mục Passing chord.',
      'Đổi một nốt thành át phụ: B♭m7 → B♭7 → E♭m9 (Rai 3 · 0:53 – 0:57) — Rê♭ lên Rê.',
      'Mượn ♭VII7(♯11): B♭7(♯11) → C (Rai 1 · 0:43 – 0:46) — anh: "có cảm giác nắng".',
    ],
    nghe: [ngheAnh('rai3', 63.5, 67, 70.5), ngheAnh('rai3', 77, 78.5, 80.5), ngheAnh('rai3', 53.5, 55, 57), ngheAnh('rai1', 43, 46)],
  },
  {
    tieuDe: 'Chỉ để biết — chưa đủ mẫu để chấm điểm',
    loi: [
      'm6: anh bấm hợp âm thứ của chính gốc, nốt 6 trên cùng — G♭m6 = Sol♭ + G♭m, Mi♭ trên đỉnh (3/3, nhưng cả ba là cùng một hợp âm ở Rai 3). Bảng công thức dạy Cm6 = Đô – Sol + Adim.',
      'm9: maj7 trên ♭3 chỉ 3/6 — anh hay để ♭7 ở tay trái (Rai 1 Dm9: tay phải Fa – La – Rê – Mi). m7♭5: thứ trên ♭3 chỉ 1/2.',
      'Bốn loại thư viện thêm 15/10 (5 · maj9sus4 · m11♭5 · 7(13)): A♭5 mở Rai 2 (hai tay La♭ – Mi♭, không có bậc 3 — lửng). Ba loại kia không phải thế anh chủ ý (cách đọc của tôi): cả 4 lần maj9sus4 là nhãn chớp lúc anh chuyển hợp âm — cùng giây có hợp âm khác (Rai 3 · 1:20 tay phải là F7 đi về B♭m7); 7(13) (Rai 2 · 1:00) là A♭7 bass Sol♭ đi về D♭maj7, nốt Fa của hợp âm trước còn ngân; m7♭5(9,11)/E (Rai 2 · 0:21) là hợp âm lướt một giây, bass Mi lên Fa. Vì vậy không dạy thành công thức.',
    ],
    nghe: [ngheAnh('rai3', 3.5), ngheAnh('rai2', 0)],
  },
]
