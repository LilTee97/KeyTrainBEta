import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { kieuDau } from '../vongThay'
import { chongCongThuc, CONG_THUC, gocDep, hauDep, tenHaiTay, tenTheoChu, tenTrongGiong, vn } from './chongHopAm'
import type { CauGame, LuaChon, Man } from './gameChong'

/*
  PASSING CHORD VÀ VÒNG 2-5-1 — hai mục dạy của Game công thức (Mưa hợp âm). Người dùng 16/10/2026: "Trong game công thức hãy làm thêm mục
  dạy tôi về các Passing Chord và dạy tôi tìm hợp âm cho vòng 2-5-1. Có thể đánh bằng đàn hoặc chọn đáp án".
  Luật lấy từ chỗ đã có trong app, không đặt mới:
  - át phụ · hợp âm giảm lướt · vòng 2-5 lướt: luật của tài liệu anh Khá trong Tái hòa âm (`reharm/reharmEngine/passingChordRules.ts`) —
    giảm lướt: bass đi lên thì dim7 nửa cung dưới đích, đi xuống thì nửa cung trên; đích thứ thì bậc 2 là m7♭5;
  - ♭II7: luật Claude rút từ 11 chỗ soi tận nốt của Cà Pháo, khớp 10/11 (md Cà Pháo, mục "Hợp âm lướt" ở phần 6);
  - vòng 2-5-1: mẫu `ii-v-i` · `ii-v-i-thu` của `nhanVong.ts` (ii7 – V7 – Imaj7 · iiø7 – V7 – i, ở đây i ghi m7).
  Câu đặt trong giọng trưởng (2-5-1 thứ: giọng thứ): hợp âm lướt dẫn vào hợp âm CÓ SẴN trong giọng, như luật lọc của Tái hòa âm. Chấm theo
  chức năng (`CauGame.chuc`): đủ gốc + 3 + 7 (m7♭5 · dim7 đủ 4 nốt), nốt thêm chỉ là nốt màu hợp loại — bấm G13 thay G7 cũng đúng; đáp án
  hiện ra và bốn nút vẫn là hợp âm bảy trơn. Không sáng tay trái: gốc chính là điều phải tìm. Chỗ đặt câu (bậc nào dẫn vào bậc nào), nút
  nhiễu, lời giảng và mẹo là của Claude (gia sư); số đo của thầy ghi kèm cỡ mẫu.
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

/** Một hợp âm trong giọng: cách chủ âm `semi` nửa cung, gốc gọi theo chữ cái bậc `bac` (1–7), loại = id công thức chồng. */
interface Bac {
  semi: number
  bac: number
  q: string
}
/** Dời bậc `b` lên `semi` nửa cung và `chu` chữ cái (âm là xuống), đổi loại thành `q`. */
const doiBac = (b: Bac, semi: number, chu: number, q: string): Bac => ({ semi: pc(b.semi + semi), bac: ((((b.bac - 1 + chu) % 7) + 7) % 7) + 1, q })

interface Hop {
  ten: string
  goc: number
  /** Tên gốc theo chữ cái ('C#', 'Db'). */
  gocTen: string
  /** Nốt thế chồng hai tay (tay trái + tay phải) — để vẽ, phát tiếng. */
  not: number[]
  /** Thế chồng đọc được: "La + C♯dim". */
  chong: string
  tenNot: string
  kieu: AccidentalStyle
  q: string
}

/** Hợp âm của bậc `b` trong giọng `tonic` (trưởng / thứ) — tên gọi theo chữ cái của bậc (♭II là Rê♭, ♯I là Đô♯), bấm theo công thức chồng. */
function hopAm(tonic: number, thu: boolean, b: Bac): Hop {
  const gocTen = tenTrongGiong(tonic, thu, b.semi, b.bac)
  const kieu: AccidentalStyle = gocTen.includes('#') ? 'sharp' : gocTen.includes('b') ? 'flat' : kieuDau(tonic, thu)
  const ct = CONG_THUC.find((c) => c.id === b.q)!
  const goc = pc(tonic + b.semi)
  const c = chongCongThuc(ct, goc, gocTen, kieu)
  const t = tenHaiTay(ct, gocTen, kieu)
  return {
    ten: `${gocDep(gocTen)}${hauDep(ct.kyHieu)}`,
    goc,
    gocTen,
    not: [...c.trai, ...c.phai],
    chong: `${c.nhan.trai} + ${c.nhan.phai}`,
    tenNot: [...new Set([...t.trai, ...t.phai])].join(' – '),
    kieu,
    q: b.q,
  }
}

/** Nốt cách gốc của `h` `semi` nửa cung, `chu` chữ cái — tên Việt (bậc 3 của A7 là Đô♯). */
const notCach = (h: Hop, semi: number, chu: number) => vn(tenTheoChu(h.gocTen, semi, chu, h.kieu))
/** Năm nốt đầu gam trưởng của gốc — đếm 5 chữ cái là tới quãng 5: "Mi♭ – Fa – Sol – La♭ – Si♭". */
const dem5 = (h: Hop) => [0, 2, 4, 5, 7].map((s, i) => vn(tenTheoChu(h.gocTen, s, i, h.kieu))).join(' – ')

/**
 * Lớp phải có và lớp được thêm của từng loại (quãng so với gốc) — chấm theo chức năng. Phải có: gốc + 3 + 7 (m7♭5 thêm ♭5, dim7 cả bốn).
 * Được thêm: 5 và các nốt màu hợp loại (maj7: 9 · 13 · ♯11; m7: 9 · 11 · 13; 7: 9 · ♭9 · ♯9 · 13 · ♭13 · ♯11; m7♭5: 9 · 11).
 */
const CHUC: Readonly<Record<string, { can: readonly number[]; duoc: readonly number[] }>> = {
  maj7: { can: [0, 4, 11], duoc: [7, 2, 9, 6] },
  m7: { can: [0, 3, 10], duoc: [7, 2, 5, 9] },
  '7': { can: [0, 4, 10], duoc: [7, 2, 1, 3, 9, 8, 6] },
  m7b5: { can: [0, 3, 6, 10], duoc: [2, 5] },
  dim7: { can: [0, 3, 6, 9], duoc: [] },
}

const nutCua = (h: Hop): LuaChon => ({ ten: h.ten, trai: [], phai: h.not, nhan: { trai: '', traiPhu: '', phai: h.ten, phaiPhu: h.tenNot } })
const cungLop = (a: Hop, b: Hop) => {
  const x = new Set(a.not.map(pc))
  const y = new Set(b.not.map(pc))
  return x.size === y.size && [...x].every((p) => y.has(p))
}

/** Phần đáp án của một câu một hợp âm: không tay trái, chấm theo chức năng, bốn nút (đáp án + ba nhiễu khác nốt). */
function dapAn(h: Hop, nhieu: readonly Hop[], tonic: number, rand: () => number) {
  const khac = nhieu.filter((x, i) => x.ten !== h.ten && !cungLop(x, h) && nhieu.findIndex((y) => y.ten === x.ten) === i)
  const ch = CHUC[h.q]!
  return {
    g: tonic,
    trai: [] as number[],
    phai: h.not,
    nhan: nutCua(h).nhan,
    dapAnTen: h.ten,
    luaChon: tron([nutCua(h), ...khac.slice(0, 3).map(nutCua)], rand),
    haiTayBuoc: false,
    chuc: { can: ch.can.map((iv) => pc(h.goc + iv)), duoc: ch.duoc.map((iv) => pc(h.goc + iv)) },
    kieu: h.kieu,
  }
}

/* ---------------- Passing chord ---------------- */

export type LoaiLuot = 'at-phu' | 'giam' | 'tritone'
interface MauLuot {
  id: string
  loai: LoaiLuot
  /** Hợp âm trước và hợp âm đích, theo bậc của giọng trưởng. */
  tu: Bac
  den: Bac
}

const I: Bac = { semi: 0, bac: 1, q: 'maj7' }
const II: Bac = { semi: 2, bac: 2, q: 'm7' }
const III: Bac = { semi: 4, bac: 3, q: 'm7' }
const IV: Bac = { semi: 5, bac: 4, q: 'maj7' }
const V: Bac = { semi: 7, bac: 5, q: '7' }
const VI: Bac = { semi: 9, bac: 6, q: 'm7' }

/** 17 chỗ chen — mỗi chỗ là một cặp bậc quen trong giọng trưởng. Giảm lướt chỉ đặt ở chỗ bass đi một cung (có đúng một phím ở giữa). */
export const MAU_LUOT: readonly MauLuot[] = [
  { id: 'ap:I-ii', loai: 'at-phu', tu: I, den: II },
  { id: 'ap:vi-ii', loai: 'at-phu', tu: VI, den: II },
  { id: 'ap:I-iii', loai: 'at-phu', tu: I, den: III },
  { id: 'ap:I-IV', loai: 'at-phu', tu: I, den: IV },
  { id: 'ap:I-V', loai: 'at-phu', tu: I, den: V },
  { id: 'ap:IV-vi', loai: 'at-phu', tu: IV, den: VI },
  { id: 'gl:I-ii', loai: 'giam', tu: I, den: II },
  { id: 'gl:ii-iii', loai: 'giam', tu: II, den: III },
  { id: 'gl:IV-V', loai: 'giam', tu: IV, den: V },
  { id: 'gl:V-vi', loai: 'giam', tu: V, den: VI },
  { id: 'gl:iii-ii', loai: 'giam', tu: III, den: II },
  { id: 'gl:vi-V', loai: 'giam', tu: VI, den: V },
  { id: 'gl:ii-I', loai: 'giam', tu: II, den: I },
  { id: 'tt:ii-I', loai: 'tritone', tu: II, den: I },
  { id: 'tt:V-I', loai: 'tritone', tu: V, den: I },
  { id: 'tt:iii-ii', loai: 'tritone', tu: III, den: II },
  { id: 'tt:vi-V', loai: 'tritone', tu: VI, den: V },
]

/** Bass đi lên (luật anh Khá: đi lên không quá nửa quãng tám). */
const diLen = (m: MauLuot) => pc(m.den.semi - m.tu.semi) <= 6

/** Hợp âm lướt (đáp án) và ba nút nhiễu: sai loại, sai gốc, hay sai cách (giảm lướt ngược chiều; V7 thật thay vì ♭II7). */
function bacLuot(m: MauLuot): { luot: Bac; nhieu: Bac[] } {
  const d = m.den
  if (m.loai === 'at-phu') return { luot: doiBac(d, 7, 4, '7'), nhieu: [doiBac(d, 7, 4, 'm7'), doiBac(d, 7, 4, 'maj7'), doiBac(d, 5, 3, '7')] }
  if (m.loai === 'giam') {
    const k = diLen(m) ? -1 : 1
    return { luot: doiBac(d, k, k, 'dim7'), nhieu: [doiBac(d, 0, 0, 'dim7'), doiBac(d, k, k, 'm7'), doiBac(d, -k, -k, 'dim7')] }
  }
  const v = doiBac(d, 7, 4, '7')
  return { luot: doiBac(d, 1, 1, '7'), nhieu: [m.tu.semi === v.semi ? doiBac(d, 1, 1, 'maj7') : v, doiBac(d, 1, 1, 'm7'), doiBac(d, -1, -1, '7')] }
}

/** Câu hợp âm lướt: viên ghi "Cmaj7 → ? → Dm7", tìm hợp âm chen giữa theo đúng loại của màn. */
function taoCauLuot(m: MauLuot, tonic: number, rand: () => number): CauGame {
  const tu = hopAm(tonic, false, m.tu)
  const den = hopAm(tonic, false, m.den)
  const b = bacLuot(m)
  const luot = hopAm(tonic, false, b.luot)
  const goc = vn(den.gocTen)
  const chuoi = `${tu.ten} → ${luot.ten} → ${den.ten}`
  let loi: Pick<CauGame, 'the' | 'khungTen' | 'goiY' | 'loi' | 'nho' | 'meo'>
  if (m.loai === 'at-phu') {
    const camAm = notCach(luot, 4, 2)
    loi = {
      the: 'át phụ',
      khungTen: `V7 của ${den.ten}`,
      goiY: `từ ${goc} đếm lên 5 chữ cái · loại 7`,
      loi: `${chuoi}: ${luot.ten} là V7 của ${den.ten} — ${camAm} (bậc 3 của ${luot.ten}) nằm sát dưới ${goc} nửa cung nên kéo lên. Chồng: ${luot.chong}`,
      nho: `${luot.ten} = V7 của ${den.ten}`,
      meo: `Át phụ của ${den.ten}: từ ${goc} đếm lên 5 chữ cái (${dem5(den)}) = ${vn(luot.gocTen)}, loại 7 → ${luot.ten} (${luot.chong}).`,
    }
  } else if (m.loai === 'giam') {
    const len = diLen(m)
    const bass = `${vn(tu.gocTen)} → ${vn(luot.gocTen)} → ${goc}`
    loi = {
      the: 'giảm lướt',
      khungTen: `dim7 · bass đi ${len ? 'lên' : 'xuống'}`,
      goiY: `dim7 nửa cung ${len ? 'dưới' : 'trên'} ${goc}`,
      loi: `${chuoi}: bass ${bass} đi liền từng nửa cung. Chồng: ${luot.chong}`,
      nho: `bass ${bass}`,
      meo: `Bass ${len ? 'đi lên' : 'đi xuống'} từ ${vn(tu.gocTen)} tới ${goc}: chen phím ở giữa (${vn(luot.gocTen)}), dựng dim7 trên nó → ${luot.ten} (${luot.chong}).`,
    }
  } else {
    const v = hopAm(tonic, false, doiBac(m.den, 7, 4, '7'))
    loi = {
      the: '♭II7',
      khungTen: `thay cho ${v.ten}`,
      goiY: `loại 7, gốc nửa cung trên ${goc}`,
      loi: `${chuoi}: ${luot.ten} thay cho ${v.ten} — chung cặp nốt ${notCach(v, 4, 2)} – ${notCach(v, 10, 6)} nên kéo về ${den.ten} như ${v.ten}, mà bass ${vn(luot.gocTen)} trượt nửa cung xuống ${goc}. Chồng: ${luot.chong}`,
      nho: `${luot.ten} thay ${v.ten}`,
      meo: `♭II7 của ${den.ten}: gốc nửa cung trên ${goc} = ${vn(luot.gocTen)}, loại 7 → ${luot.ten} (${luot.chong}) — thay cho ${v.ten}.`,
    }
  }
  return {
    id: `luot:${m.id}`,
    ten: `${tu.ten} → ? → ${den.ten}`,
    ...loi,
    nghe: [tu.not, luot.not, den.not],
    ...dapAn(
      luot,
      b.nhieu.map((x) => hopAm(tonic, false, x)),
      tonic,
      rand,
    ),
  }
}

/* ---------------- Vòng 2-5-1 ---------------- */

export type Loai251 = 'truong' | 'thu' | 'luot'
interface Mau251 {
  id: string
  loai: Loai251
  /** Hợp âm đích (bậc 1, hay hợp âm trong bài ở 2-5 lướt) và giọng. */
  den: Bac
  thu: boolean
}
export const MAU_251: readonly Mau251[] = [
  { id: 'truong', loai: 'truong', den: I, thu: false },
  { id: 'thu', loai: 'thu', den: { semi: 0, bac: 1, q: 'm7' }, thu: true },
  ...(
    [
      ['ii', II],
      ['iii', III],
      ['IV', IV],
      ['V', V],
      ['vi', VI],
    ] as const
  ).map(([ten, den]) => ({ id: `luot:${ten}`, loai: 'luot' as const, den, thu: false })),
]

/** Câu 2-5-1: một viên hai bước — bấm bậc 2 rồi bậc 5 của hợp âm đích; xong viên thì nghe cả vòng. */
function taoCau251(m: Mau251, tonic: number, rand: () => number): CauGame {
  const thuDen = m.den.q === 'm7'
  const h = (b: Bac) => hopAm(tonic, m.thu, b)
  const den = h(m.den)
  const ii = h(doiBac(m.den, 2, 1, thuDen ? 'm7b5' : 'm7'))
  const v = h(doiBac(m.den, 7, 4, '7'))
  const nhieuII = thuDen
    ? [doiBac(m.den, 2, 1, 'm7'), doiBac(m.den, 2, 1, 'dim7'), doiBac(m.den, 3, 2, 'maj7')]
    : [doiBac(m.den, 2, 1, '7'), doiBac(m.den, 2, 1, 'm7b5'), doiBac(m.den, 4, 2, 'm7')]
  const nhieuV = [doiBac(m.den, 7, 4, 'm7'), doiBac(m.den, 7, 4, 'maj7'), doiBac(m.den, 5, 3, '7')]
  const goc = vn(den.gocTen)
  const the = m.loai === 'truong' ? '2-5-1 trưởng' : m.loai === 'thu' ? '2-5-1 thứ' : '2-5 lướt'
  const id = `v251:${m.id}`
  const buoc1: CauGame = {
    id,
    ten: `? → ? → ${den.ten}`,
    the,
    khungTen: `bậc 2 của ${den.ten}`,
    goiY: `trên ${goc} một cung · ${thuDen ? 'm7♭5' : 'm7'}`,
    loi: `${ii.ten} là bậc 2 của ${den.ten} (${ii.chong})`,
    nho: `${ii.ten} = bậc 2`,
    meo: `Bậc 2 của ${den.ten}: phím cao hơn ${goc} một cung = ${vn(ii.gocTen)}; ${thuDen ? 'đích thứ dùng m7♭5 (nửa giảm)' : 'loại m7'} → ${ii.ten} (${ii.chong}).`,
    ...dapAn(ii, nhieuII.map(h), tonic, rand),
  }
  const buoc2: CauGame = {
    id,
    ten: `${ii.ten} → ? → ${den.ten}`,
    the,
    khungTen: `bậc 5 của ${den.ten}`,
    goiY: `từ ${goc} đếm lên 5 chữ cái · loại 7`,
    loi: `${v.ten} là bậc 5 của ${den.ten} (${v.chong})`,
    nho: `${v.ten} = bậc 5`,
    meo: `Bậc 5 của ${den.ten}: từ ${goc} đếm lên 5 chữ cái (${dem5(den)}) = ${vn(v.gocTen)}; loại 7${thuDen ? ` — cả khi đích thứ, vì cần nốt cảm âm ${notCach(v, 4, 2)} sát dưới ${goc}` : ''} → ${v.ten} (${v.chong}).`,
    ...dapAn(v, nhieuV.map(h), tonic, rand),
  }
  const noi = `Nối mượt: ${notCach(ii, 10, 6)} (7 của ${ii.ten}) xuống ${notCach(v, 4, 2)} (3 của ${v.ten}), ${notCach(v, 10, 6)} (7 của ${v.ten}) xuống ${notCach(den, thuDen ? 3 : 4, 2)} (3 của ${den.ten}).`
  return {
    ...buoc1,
    loi: `${ii.ten} → ${v.ten} → ${den.ten}: bậc 2 – bậc 5 – bậc 1, gốc nhảy lên quãng 4 mỗi bước (${vn(ii.gocTen)} → ${vn(v.gocTen)} → ${goc}). ${noi}`,
    nho: `${ii.ten} → ${v.ten} → ${den.ten}`,
    meo: `2-5 của ${den.ten}: bậc 2 = ${ii.ten} (${ii.chong}), bậc 5 = ${v.ten} (${v.chong}).`,
    nghe: [ii.not, v.not, den.not],
    buoc: [buoc1, buoc2],
  }
}

/** Câu của hai mục (`luot:<chỗ>` · `v251:<mẫu>`) ở giọng có chủ âm `tonic`. */
export function taoCauNoi(id: string, tonic: number, rand: () => number = Math.random): CauGame {
  if (id.startsWith('luot:')) return taoCauLuot(MAU_LUOT.find((m) => `luot:${m.id}` === id)!, tonic, rand)
  return taoCau251(MAU_251.find((m) => `v251:${m.id}` === id)!, tonic, rand)
}

/* ---------------- Màn và bài giảng ---------------- */

const idLuot = (loai?: LoaiLuot) => MAU_LUOT.filter((m) => !loai || m.loai === loai).map((m) => `luot:${m.id}`)
/** Ví dụ ở Đô trưởng: "Cmaj7 → A7 → Dm7" — viết từ chính câu đầu của loại, không gõ tay. */
const viDu = (loai: LoaiLuot) => {
  const m = MAU_LUOT.find((x) => x.loai === loai)!
  return [m.tu, bacLuot(m).luot, m.den].map((b) => hopAm(0, false, b).ten).join(' → ')
}
const LUAT_AP = [
  'Át phụ của một hợp âm = hợp âm 7 có gốc cao hơn nó một quãng 5 (từ gốc đích đếm lên 5 chữ cái).',
  'Bậc 3 của át phụ nằm sát dưới gốc đích nửa cung — nốt cảm âm, nghe là muốn đi lên.',
  'Đích thứ thì thêm ♭9 cho căng hơn (A7♭9 → Dm7) — bấm thêm cũng tính đúng.',
]
const LUAT_GIAM = [
  'Bass đi một cung thì chen dim7 trên phím ở giữa: đi lên lấy phím dưới gốc đích (ghi ♯), đi xuống lấy phím trên (ghi ♭).',
  'dim7 = bốn nốt cách đều nhau (quãng 3 thứ) — nghe lơ lửng, chỉ ngân ngắn rồi đi tiếp.',
]
const LUAT_TT = [
  '♭II7 = hợp âm 7 có gốc nửa cung trên đích; bass trượt xuống nửa cung vào đích.',
  'Nó thay cho V7 thật của đích (D♭7 thay G7): hai hợp âm chung cặp nốt 3 – 7 (Fa – Si) nên kéo y như nhau.',
]

export const MAN_LUOT: readonly Man[] = [
  { ten: 'Át phụ — V7 của hợp âm đích', goiY: viDu('at-phu'), ids: idLuot('at-phu'), meo: LUAT_AP },
  { ten: 'Giảm lướt — dim7 chen giữa, bass đi nửa cung', goiY: viDu('giam'), ids: idLuot('giam'), meo: LUAT_GIAM },
  { ten: '♭II7 — thay tritone, bass trượt xuống', goiY: viDu('tritone'), ids: idLuot('tritone'), meo: LUAT_TT },
  {
    ten: 'Trộn ba loại',
    goiY: 'át phụ · giảm lướt · ♭II7 — nhãn trên viên cho biết loại',
    ids: idLuot(),
    meo: ['Luôn tìm từ hợp âm ĐÍCH: át phụ cao hơn đích quãng 5 · dim7 sát đích nửa cung, phía bass đi tới · ♭II7 trên đích nửa cung.', ...LUAT_AP.slice(0, 1), ...LUAT_GIAM.slice(0, 1), ...LUAT_TT.slice(0, 1)],
  },
]

const id251 = (loai?: Loai251) => MAU_251.filter((m) => !loai || m.loai === loai).map((m) => `v251:${m.id}`)
/** "Dm7 → G7 → Cmaj7" ở Đô — từ chính câu đầu của loại. */
const viDu251 = (loai: Loai251) => {
  const c = taoCau251(MAU_251.find((m) => m.loai === loai)!, 0, () => 0.5)
  return loai === 'luot' ? `→ ${c.nho.split(' → ').pop()}: ${c.nho.split(' → ').slice(0, 2).join(' → ')}` : c.nho
}
const LUAT_251 = [
  'Bậc 2: phím cao hơn chủ âm một cung, loại m7. Bậc 5: từ chủ âm đếm lên 5 chữ cái, loại 7.',
  'Nối mượt: nốt 7 của hợp âm trước đi xuống thành nốt 3 của hợp âm sau — tay gần như không phải nhảy.',
]
const LUAT_251_THU = [
  'Gốc y như giọng trưởng; bậc 2 đổi thành m7♭5 (nửa giảm), bậc 1 là m7.',
  'Bậc 5 vẫn là 7 trưởng — cần nốt cảm âm sát dưới chủ âm; lấy m7 (theo gam thứ tự nhiên) thì về nghe hụt lực.',
]
const LUAT_251_LUOT = [
  'Coi hợp âm đích là "bậc 1 tạm" rồi tìm 2-5 của nó y như trên — Tái hòa âm gọi là "Vòng 2-5-1 lướt".',
  'Đích trưởng (hay 7): bậc 2 là m7. Đích thứ: bậc 2 là m7♭5.',
]

export const MAN_251: readonly Man[] = [
  { ten: '2-5-1 giọng trưởng', goiY: viDu251('truong'), ids: id251('truong'), meo: LUAT_251 },
  { ten: '2-5-1 giọng thứ', goiY: viDu251('thu'), ids: id251('thu'), meo: LUAT_251_THU },
  { ten: '2-5 lướt — mượn 2-5 của hợp âm trong bài', goiY: viDu251('luot'), ids: id251('luot'), meo: LUAT_251_LUOT },
  { ten: 'Trộn', goiY: 'trưởng · thứ · 2-5 lướt — nhãn trên viên cho biết loại', ids: id251(), meo: [...LUAT_251.slice(0, 1), ...LUAT_251_THU.slice(0, 1), ...LUAT_251_LUOT.slice(1)] },
]

export interface DoanBai {
  tieuDe: string
  loi: readonly string[]
  /** Ví dụ bấm nghe (ở Đô): tên chuỗi + nốt từng hợp âm. */
  nghe: readonly { ten: string; hop: readonly (readonly number[])[] }[]
}
/** Một chuỗi ví dụ ở Đô (trưởng, hay thứ) — tên và nốt sinh từ công thức chồng như câu đố. */
const nghe = (bs: readonly Bac[], thu = false) => {
  const hs = bs.map((b) => hopAm(0, thu, b))
  return { ten: hs.map((x) => x.ten).join(' → '), hop: hs.map((x) => x.not) }
}
const ngheLuot = (id: string) => {
  const m = MAU_LUOT.find((x) => x.id === id)!
  return nghe([m.tu, bacLuot(m).luot, m.den])
}

/** Bài giảng Passing chord — lời gia sư của Claude; số đo của thầy ghi cỡ mẫu. */
export const BAI_LUOT: readonly DoanBai[] = [
  {
    tieuDe: 'Passing chord là gì?',
    loi: [
      'Passing chord (hợp âm lướt) là hợp âm chen vào giữa hai hợp âm chính, chỉ ngân ngắn — thường 1–2 phách cuối của hợp âm trước — để dắt tai sang hợp âm sau. Nó không phải chỗ dừng chân, mà như bậc thềm giữa hai bậc cửa.',
      'Vì sao nghe trơn: hợp âm lướt luôn có nốt nằm SÁT nốt của hợp âm sau, chỉ cách nửa cung (hai phím kề nhau). Nửa cung là bước ngắn nhất trên đàn nên tai nghe như bị hút vào.',
      'Cách tìm: luôn bắt đầu từ HỢP ÂM ĐÍCH (hợp âm sau) — hợp âm lướt dựng theo đích, không theo hợp âm trước.',
      'Số đo — Cà Pháo, phần hát 5 bài, 288 chỗ đổi hợp âm: 19 chỗ có hợp âm lướt ghi ký hiệu (7 %) và 16 chỗ ngầm ở tay trái (6 %); đoạn đàn dạo · giang · kết chỉ 1/141 — anh để dành cho phần hát. Tôn Hùng: chưa thấy chỗ nào (mới 2 bài — chưa đủ nói là không dùng).',
    ],
    nghe: [],
  },
  {
    tieuDe: 'Át phụ — V7 của hợp âm đích',
    loi: [
      'Hợp âm nào trong bài cũng có "át" riêng: hợp âm 7 có gốc cao hơn nó một quãng 5. Đếm từ gốc đích lên 5 chữ cái: Rê – Mi – Fa – Sol – La → A7 là át của Dm7.',
      'Nghe ra sao: A7 có Đô♯ — sát dưới Rê nửa cung — nên vừa nghe A7 là tai đã đòi về Dm7. Sáng, có lực đẩy; anh SSA: "chuẩn bị điệp khúc thường làm át phụ".',
      'Cà Pháo hay đặt bass lên chính nốt sát ấy (bậc 3 của át): F7/A → B♭m, bass La → Si♭ đi nửa cung — kiểu ngầm anh dùng nhiều nhất, 7 trong 16 chỗ.',
      'Đích là hợp âm thứ thì thêm ♭9 cho căng hơn (A7♭9 → Dm7) — app chấm A7, bấm thêm ♭9 cũng tính đúng.',
    ],
    nghe: [ngheLuot('ap:I-ii'), ngheLuot('ap:I-IV'), ngheLuot('ap:IV-vi')],
  },
  {
    tieuDe: 'Giảm lướt — dim7 chen vào giữa',
    loi: [
      'Khi bass đi một cung (Đô → Rê) thì ở giữa còn trống một phím: Đô♯. Dựng hợp âm bảy giảm (dim7) trên phím ấy là bass đi liền từng nửa cung: Đô → Đô♯ → Rê.',
      'Bass đi LÊN thì lấy phím ngay DƯỚI gốc đích; đi XUỐNG thì lấy phím ngay TRÊN (Em7 → E♭dim7 → Dm7). Tên nốt theo chiều đi: lên ghi ♯, xuống ghi ♭.',
      'Nghe ra sao: dim7 xếp toàn quãng 3 thứ, không có chủ âm rõ nên nghe lơ lửng, hơi cổ điển, sang — chỉ ngân ngắn rồi phải đi tiếp.',
      'Biến thể "quay đầu" của Robert (Blues): I – ♭iii° – ii – V (Cmaj7 → E♭dim7 → Dm7) — bass vượt lên rồi quay xuống, không phải lướt; app ghi 3 lần trong bài của anh.',
    ],
    nghe: [ngheLuot('gl:I-ii'), ngheLuot('gl:iii-ii'), ngheLuot('gl:V-vi')],
  },
  {
    tieuDe: '♭II7 — thay tritone, bass trượt xuống',
    loi: [
      'Hợp âm 7 có gốc cao hơn đích nửa cung: Cmaj7 nhận D♭7. Bass trượt xuống nửa cung (Rê → Rê♭ → Đô) — mượt như nước chảy.',
      'Vì sao được: D♭7 và G7 (át thật của Cmaj7) chung cặp nốt Fa – Si (Đô♭) — cặp nốt căng nhất của át — nên D♭7 kéo về Đô y như G7. Hai gốc cách nhau ba cung (tritone) nên gọi là "thay tritone".',
      'Nghe ra sao: tối hơn, "jazz" hơn át phụ; giai điệu đang đứng trên nốt chung thì nghe rất sang.',
      'Cà Pháo: Em7 → E♭7 → Dm7 (Chúng Ta ô 20→21, 52→53), G7 → D♭7 → C7 (Anh Cứ Đi Đi ô 15) — 4 trong 16 chỗ ngầm, thêm 3 chỗ ♭II7 "hàng xóm" (C7 → D♭7 → C7 rồi về Fm).',
    ],
    nghe: [ngheLuot('tt:ii-I'), ngheLuot('tt:iii-ii'), ngheLuot('tt:vi-V')],
  },
]

/** Bài giảng vòng 2-5-1. */
export const BAI_251: readonly DoanBai[] = [
  {
    tieuDe: 'Vòng 2-5-1 là gì?',
    loi: [
      'Ba hợp âm "về nhà" chuẩn nhất của jazz, ballad, bossa: bậc 2 chuẩn bị — bậc 5 căng lên — bậc 1 giải quyết. Đô trưởng: Dm7 → G7 → Cmaj7.',
      'Gốc mỗi bước nhảy lên quãng 4 (cũng là xuống quãng 5): Rê → Sol → Đô. Bước gốc này mạnh nhất trong hòa âm nên tai nghe "về" rất rõ.',
      'Số đo — Linh Nhi: bài trưởng về chủ bằng vòng 1–6–2–5 (8/35 đoạn); bài thứ hay kết ♭VI – ii° – V – i (Dung Xa Em Đêm Nay, Một Cõi Đi Về). Cà Pháo: giọng trưởng dẫn vào câu hát bằng 2-5 của hợp âm hát kế; giọng thứ thì không — 0/6 đoạn dạo · giang thứ, anh dùng ♭VI → ♭VII → i. Anh SSA: "4536251 là cơ bản".',
    ],
    nghe: [nghe([doiBac(I, 2, 1, 'm7'), V, I])],
  },
  {
    tieuDe: 'Tìm 2-5-1 giọng trưởng',
    loi: [
      'Biết hợp âm chủ (bậc 1) là tìm ra hai hợp âm kia.',
      'Bậc 2: phím cao hơn chủ âm MỘT CUNG, loại m7 — Đô → Rê → Dm7; Fa → Sol → Gm7.',
      'Bậc 5: từ chủ âm đếm lên 5 chữ cái, loại 7 — Đô Rê Mi Fa SOL → G7; Fa Sol La Si♭ ĐÔ → C7.',
      'Bậc 1: maj7 — Cmaj7, Fmaj7.',
      'Thế chồng (đã học ở các màn công thức): Dm7 = Rê + F · G7 = Sol + Bdim · Cmaj7 = Đô + Em.',
    ],
    nghe: [nghe([doiBac(I, 2, 1, 'm7'), V, I]), nghe([{ semi: 7, bac: 5, q: 'm7' }, { semi: 0, bac: 1, q: '7' }, IV])],
  },
  {
    tieuDe: 'Tìm 2-5-1 giọng thứ',
    loi: [
      'Gốc y như giọng trưởng, chỉ đổi loại: bậc 2 là m7♭5 (nửa giảm) — Dm7♭5; bậc 5 VẪN là 7 trưởng — G7; bậc 1 là m7 — Cm7.',
      'Lỗi hay gặp: lấy Gm7 cho bậc 5 vì gam Đô thứ tự nhiên có Si♭. Gm7 không có nốt cảm âm Si (sát dưới Đô) nên về Cm7 nghe hụt lực. Muốn căng hơn thì G7♭9.',
      'Thế chồng: Dm7♭5 = Rê + Fm · G7 = Sol + Bdim · Cm7 = Đô + E♭.',
    ],
    nghe: [nghe([{ semi: 2, bac: 2, q: 'm7b5' }, V, { semi: 0, bac: 1, q: 'm7' }], true)],
  },
  {
    tieuDe: 'Nối mượt và thêm màu',
    loi: [
      'Nốt 7 của hợp âm trước đi xuống liền bậc thành nốt 3 của hợp âm sau: Đô (7 của Dm7) → Si (3 của G7); Fa (7 của G7) → Mi (3 của Cmaj7). Tay gần như không phải nhảy — vì vậy 2-5-1 nghe trơn.',
      'Thêm màu: Jeff Schneider dựng Dm7 – G7 – Cmaj7 thành Dm11 – G13♭9♯11 – Cmaj9 bằng công thức chồng. App chấm theo chức năng nên bấm bản màu (9 · 11 · 13) cũng tính đúng.',
    ],
    nghe: [nghe([{ semi: 2, bac: 2, q: 'm11' }, { semi: 7, bac: 5, q: '13b9#11' }, { semi: 0, bac: 1, q: 'maj9' }])],
  },
  {
    tieuDe: '2-5 lướt — mượn 2-5 của hợp âm bất kỳ',
    loi: [
      'Hợp âm nào trong bài cũng có thể coi là "bậc 1 tạm" rồi chen 2-5 của nó ngay trước. Tái hòa âm của app gọi là "Vòng 2-5-1 lướt"; tài liệu anh Khá gọi là "công thức mẹ" của các hợp âm lướt.',
      'Đích trưởng (hay 7): bậc 2 là m7 — trước Fmaj7: Gm7 → C7. Đích thứ: bậc 2 là m7♭5 — trước Am7: Bm7♭5 → E7.',
      'Chen hai hợp âm nên tốn chỗ: chỉ dùng khi hợp âm trước ngân đủ lâu (từ 2 phách).',
    ],
    nghe: [nghe([{ semi: 11, bac: 7, q: 'm7b5' }, { semi: 4, bac: 3, q: '7' }, VI]), nghe([{ semi: 7, bac: 5, q: 'm7' }, { semi: 0, bac: 1, q: '7' }, IV])],
  },
]
