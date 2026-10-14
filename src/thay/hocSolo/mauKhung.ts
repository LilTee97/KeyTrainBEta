import { khungLoai, LOAI_KHUNG, type Khung, type LoaiKhung } from './khungNot'

/*
  MƯA KHUNG NỐT — game rơi kiểu Game công thức (Mưa hợp âm) cho khung nốt của từng loại hợp âm. Người dùng 15/10/2026: "có phải các nhóm
  đuôi có những quy tắc mà khi học được từ nhóm này rồi sẽ biết để học nhóm khác nhanh hơn ko, nếu có thì hãy đưa vào game nốt rơi mới
  hãy thiết kế rơi như game công thức, tôi thích kiểu khi nhấn vào thì mở hẳn ra một phần game và có bàn phím dài giống Game Công Thức".

  Quy tắc nối các nhóm đuôi — mỗi loại có một loại CHA, học cha rồi suy ra con bằng một thay đổi nhỏ:
  - hợp âm: đổi một nốt (maj7 → 7: B → B♭; 7 → m7: E → E♭; m7 → m7♭5: G → G♭ …) hay thêm một nốt (cầu thang 7 → 9 → 11 → 13);
    app đo trên 26 công thức chồng: 19 cặp chỉ khác một nốt, tay trái giữ nguyên (`QUY_TAC_DUOI`);
  - khung: thêm 9 · 11 · 13 không đổi khung (nốt phụ thành nốt chính); nốt căng đổi đúng nốt cùng tên; bảy khung của một giọng trưởng
    xếp sáng → tối, mỗi bước hạ đúng một nốt (lý thuyết — test kiểm từng bước một nốt).
  Lời quy tắc trên viên rơi do máy so hợp âm / khung của câu với cha (hay bước trước trong màn chuỗi) — không gõ tay.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

/** Loại cha — học cha rồi suy ra con. maj7 là gốc của cây. */
export const CHA: Readonly<Record<string, string>> = {
  '7': 'maj7',
  m7: '7',
  maj9: 'maj7',
  maj13: 'maj9',
  '6': 'maj7',
  '6/9': '6',
  add2: 'maj7',
  'maj7#11': 'maj7',
  '9': '7',
  '13': '9',
  '7sus4': '7',
  '9sus4': '7sus4',
  '11': '9sus4',
  '13sus4': '9sus4',
  '7b9': '7',
  '13b9': '13',
  '7#9': '7',
  '7#11': '7',
  '7b13': '7',
  '7#5': '7',
  m9: 'm7',
  m11: 'm9',
  m13: 'm11',
  m6: 'm7',
  'm(maj7)': 'm7',
  m7b5: 'm7',
  dim7: 'm7b5',
}

export interface BuocKhung {
  id: string
  /** Chỗ đứng khác giọng nhà (màn bảy khung: m7 ở vi, iii; m7♭5 ở vii của giọng trưởng). */
  nha?: LoaiKhung['nha']
}
export interface ManKhung {
  ten: string
  goiY: string
  buoc: readonly BuocKhung[]
  /** Quy tắc trên viên so với bước TRƯỚC trong màn (màn bảy khung) thay cho loại cha. */
  chuoi?: boolean
  quyTac: readonly string[]
}

const B = (...ids: string[]): BuocKhung[] => ids.map((id) => ({ id }))
export const MAN_KHUNG: readonly ManKhung[] = [
  {
    ten: 'Ba khung gốc: maj7 · 7 · m7',
    goiY: 'mỗi bước hạ đúng một nốt',
    buoc: B('maj7', '7', 'm7'),
    quyTac: [
      'maj7 → 7: hạ bậc 7 nửa cung (Đô: Si → Si♭) — khung Ionian thành Mixolydian, đúng một nốt.',
      '7 → m7: hạ bậc 3 (Mi → Mi♭) — Mixolydian thành Dorian, đúng một nốt.',
      'Thuộc khung maj7 là suy ra hai khung kia: chỉ đổi đúng nốt mà đuôi đổi.',
    ],
  },
  {
    ten: 'Cầu thang 9 · 11 · 13',
    goiY: 'khung giữ nguyên, thêm nốt chính',
    buoc: B('maj9', 'maj13', '9', '13', 'm9', 'm11', 'm13'),
    quyTac: [
      'Thêm 9 · 11 · 13 không đổi khung — các nốt ấy vốn là nốt phụ của khung, nay thành nốt chính.',
      'Cầu thang 7 → 9 → 11 → 13: tay phải loại sau giữ hai nốt trên của tay phải loại trước (Em → G → Bm cho maj7 → maj9 → maj9♯11).',
    ],
  },
  {
    ten: 'Trưởng màu: 6 · 6/9 · add9 · maj7♯11',
    goiY: 'đổi nốt chính, khung gần như maj7',
    buoc: B('6', '6/9', 'add2', 'maj7#11'),
    quyTac: [
      '6 · 6/9 · add9: khung như maj7 (Ionian), chỉ đổi nốt chính — 6 thay 7, thêm 9.',
      'maj7♯11: nâng 11 thành ♯11 (Fa → Fa♯) — khung Lydian, sáng hơn Ionian đúng một nốt.',
    ],
  },
  {
    ten: 'Treo: 7sus4 · 9sus4 · 11 · 13sus',
    goiY: 'bậc 4 thay bậc 3',
    buoc: B('7sus4', '9sus4', '11', '13sus4'),
    quyTac: [
      'Treo = thay bậc 3 bằng bậc 4 (Mi → Fa). Khung vẫn Mixolydian, chỉ đổi vai: 4 thành nốt chính, 3 thành nốt đừng ngân.',
      '11 cùng nốt với 9sus4 — hai tên một hợp âm.',
      'Tay phải: hợp âm trưởng dựng trên ♭7 (B♭/C = C9sus4) — anh SSA: "Cb/Db thực ra là Db9sus4".',
    ],
  },
  {
    ten: 'Át có nốt căng: ♭9 · ♯9 · ♯11 · ♭13 · ♯5 · 13♭9',
    goiY: 'mỗi nốt căng đổi một nốt của Mixolydian',
    buoc: B('7b9', '7#11', '7b13', '7#5', '13b9', '7#9'),
    quyTac: [
      'Mỗi nốt căng đổi đúng nốt cùng tên trong khung Mixolydian: ♭9 (Rê → Rê♭), ♯11 (Fa → Fa♯), ♭13 (La → La♭), ♯5 (Sol → Sol♯).',
      '7♭9 · 7♭13 hay đứng ở V của giọng thứ → khung Phrygian dominant (có cả ♭9 và ♭13).',
      '13♭9 · 7♯9 dùng gam giảm nửa cung – cung (8 nốt): chứa sẵn ♭9 · ♯9 · ♯11 · 13.',
    ],
  },
  {
    ten: 'Thứ màu: m6 · m(maj7)',
    goiY: 'đổi bậc 7 của m7',
    buoc: B('m6', 'm(maj7)'),
    quyTac: ['m7 → m6: ♭7 thành 6 (Si♭ → La); m7 → m(maj7): ♭7 thành 7 (Si♭ → Si) — khung thứ giai điệu.'],
  },
  {
    ten: 'Giảm: m7♭5 · dim7',
    goiY: 'hạ tiếp từng nốt',
    buoc: B('m7b5', 'dim7'),
    quyTac: [
      'm7 → m7♭5: hạ bậc 5 (Sol → Sol♭); m7♭5 → dim7: hạ tiếp ♭7 (Si♭ → La).',
      'Khung m7♭5 (Locrian) khác Dorian ba nốt vì m7♭5 đứng ở ii của giọng thứ; dim7 dùng gam giảm cung – nửa cung (8 nốt).',
    ],
  },
  {
    ten: 'Bảy khung — mỗi bước hạ một nốt',
    goiY: 'Lydian → Ionian → Mixolydian → Dorian → Aeolian → Phrygian → Locrian',
    chuoi: true,
    buoc: [
      { id: 'maj7#11' },
      { id: 'maj7' },
      { id: '7' },
      { id: 'm7' },
      { id: 'm7', nha: { goc: 9, thu: false, laMa: 'vi7' } },
      { id: 'm7', nha: { goc: 4, thu: false, laMa: 'iii7' } },
      { id: 'm7b5', nha: { goc: 11, thu: false, laMa: 'viiø7' } },
    ],
    quyTac: [
      'Bảy khung của một giọng trưởng xếp từ sáng tới tối, mỗi bước hạ đúng một nốt nửa cung — từ Đô: Fa♯ → Fa → Si♭ → Mi♭ → La♭ → Rê♭ → Sol♭.',
      'Cùng tên m7 mà đứng ở ii, vi hay iii thì khung khác nhau một nốt — nhìn bậc của hợp âm trong bài để biết khung.',
    ],
  },
  {
    ten: 'Trộn tất cả',
    goiY: 'cả 28 loại',
    buoc: LOAI_KHUNG.map((l) => ({ id: l.id })),
    quyTac: [
      'Mỗi loại có một loại cha: học cha rồi đổi đúng nốt mà đuôi đổi.',
      'Thêm 9 · 11 · 13: khung giữ nguyên. Nốt căng (♭9 · ♯9 · ♯11 · ♭13): đổi đúng nốt cùng tên. Treo: 4 thay 3.',
      'Bảy khung của giọng trưởng: mỗi bước hạ một nốt (Lydian → Ionian → Mixolydian → Dorian → Aeolian → Phrygian → Locrian).',
    ],
  },
]

const loaiCua = (id: string) => LOAI_KHUNG.find((l) => l.id === id)!
/** Tên trên viên; màn chuỗi ghi thêm bậc (Cm7 · vi) vì cùng tên mà khung khác. */
const tenBuoc = (b: BuocKhung, g: number, bac = false) => {
  const loai = loaiCua(b.id)
  const k = khungLoai(loai, g, b.nha)
  return bac ? `${k.ten} · ${(b.nha ?? loai.nha).laMa.match(/^[ivIV]+/)?.[0] ?? ''}` : k.ten
}

/** Tên một lớp cao độ theo khung `k` (nốt khung), hay theo khung `du` nếu `k` không có. */
const tenTrong = (p: number, ...ks: Khung[]) => ks.map((k) => k.not.find((n) => n.p === p)?.ten).find((x) => x) ?? String(p)

/** "B → B♭ · thêm D" — so hai tập lớp cao độ (`cu` → `moi`), ghép bỏ / thêm cùng chữ thành một mũi tên. */
function soDoi(cu: readonly number[], moi: readonly number[], kCu: Khung, kMoi: Khung): string {
  const bo = cu.filter((p) => !moi.includes(p)).map((p) => tenTrong(p, kCu, kMoi))
  const them = moi.filter((p) => !cu.includes(p)).map((p) => tenTrong(p, kMoi, kCu))
  const ra: string[] = []
  for (const b of bo) {
    const k = them.findIndex((t) => t[0] === b[0])
    if (k >= 0) {
      ra.push(`${b} → ${them[k]}`)
      them.splice(k, 1)
    } else ra.push(`bỏ ${b}`)
  }
  for (const t of them) ra.push(`thêm ${t}`)
  return ra.join(' · ')
}

export interface LuaChonKhung {
  ten: string
  /** Nốt khung (lớp cao độ, từ gốc đi lên) — bấm nút là nghe và thấy khung ấy. */
  pcs: number[]
}

export interface CauKhung {
  /** Khóa đếm sai: `màn:bước`. */
  id: string
  ten: string
  g: number
  k: Khung
  /** Dòng hai trên viên (bên mẹo): quy tắc so với cha / bước trước — "từ Cmaj7: B → B♭". */
  quyTac: string
  /** Dòng ba: tên khung. */
  goiY: string
  /** Lời giải sau khi đúng. */
  loi: string
  /** Mẹo khi sai. */
  meo: string
  dapAnTen: string
  luaChon: LuaChonKhung[]
}

const tron = <T,>(ds: readonly T[], rand: () => number) => {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Mọi khung khác tên ở gốc `g` (28 loại + ba chỗ đứng của màn bảy khung) — để lấy ba tên nhiễu gần nhất. */
function khungCungGoc(g: number): Khung[] {
  const ds = [...LOAI_KHUNG.map((l) => khungLoai(l, g)), ...MAN_KHUNG.flatMap((m) => m.buoc.filter((b) => b.nha).map((b) => khungLoai(loaiCua(b.id), g, b.nha)))]
  return [...new Map(ds.map((k) => [k.gam, k])).values()]
}

/** Câu bước `b` của màn `m`, gốc `g`. */
export function taoCauKhung(mi: number, b: number, g: number, rand: () => number = Math.random): CauKhung {
  const man = MAN_KHUNG[mi]!
  const buoc = man.buoc[b]!
  const loai = loaiCua(buoc.id)
  const k = khungLoai(loai, g, buoc.nha)
  const ten = tenBuoc(buoc, g, !!man.chuoi)
  const ngNot = (x: Khung) => x.not.map((n) => n.ten).join(' ')
  let quyTac: string
  let doiKhung = ''
  if (man.chuoi && b > 0) {
    const truoc = man.buoc[b - 1]!
    const kt = khungLoai(loaiCua(truoc.id), g, truoc.nha)
    quyTac = `từ ${tenBuoc(truoc, g, true)}: ${soDoi(kt.not.map((n) => n.p), k.not.map((n) => n.p), kt, k) || 'khung giữ nguyên'}`
  } else if (CHA[buoc.id]) {
    const cha = loaiCua(CHA[buoc.id]!)
    const kc = khungLoai(cha, g)
    const hopCu = kc.quang.map((iv) => pc(g + iv))
    const hopMoi = k.quang.map((iv) => pc(g + iv))
    const doiHop = soDoi(hopCu, hopMoi, kc, k)
    quyTac = `từ ${kc.ten}: ${doiHop || 'cùng nốt'}`
    const dk = soDoi(kc.not.map((n) => n.p), k.not.map((n) => n.p), kc, k)
    doiKhung = dk ? `Khung so với ${kc.ten} (${kc.gam}): ${dk}.` : `Khung giống ${kc.ten} (${kc.gam}) — chỉ đổi vai nốt.`
  } else quyTac = 'khung gốc — thuộc khung này trước'
  const goc = khungCungGoc(g)
  const cach = (x: Khung) => {
    const a = new Set(x.not.map((n) => n.p))
    const c = new Set(k.not.map((n) => n.p))
    return [...a].filter((p) => !c.has(p)).length + [...c].filter((p) => !a.has(p)).length
  }
  const nhieu = tron(goc.filter((x) => x.gam !== k.gam), rand)
    .sort((a, c) => cach(a) - cach(c))
    .slice(0, 3)
  const ngan = (x: Khung) => x.gam.replace(/ \(.*\)$/, '')
  const lc = (x: Khung): LuaChonKhung => ({ ten: ngan(x), pcs: x.not.map((n) => n.p) })
  return {
    id: `${mi}:${b}`,
    ten,
    g,
    k,
    quyTac,
    goiY: `khung ${k.gam.replace(/ \(.*\)$/, '')}`,
    loi: `${ten} · khung ${k.gam}: ${ngNot(k)} — ${quyTac}`,
    meo: `Khung ${k.gam}: ${ngNot(k)}. ${doiKhung || quyTac}`.trim(),
    dapAnTen: ngan(k),
    luaChon: tron([lc(k), ...nhieu.map(lc)], rand),
  }
}

/** Chọn câu kế trong màn: bước vừa sai nặng thêm (1 + 2 × số lần sai), không lặp đúng bước vừa rồi — như Mưa hợp âm. */
export function chonCauKhung(mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauKhung {
  const man = MAN_KHUNG[mi]!
  const ung = man.buoc.map((_, b) => b).filter((b) => man.buoc.length < 2 || `${mi}:${b}` !== truoc)
  const nang = ung.map((b) => 1 + 2 * (sai.get(`${mi}:${b}`) ?? 0))
  let r = rand() * nang.reduce((s, x) => s + x, 0)
  let i = 0
  for (; i < ung.length - 1; i++) {
    r -= nang[i]!
    if (r < 0) break
  }
  return taoCauKhung(mi, ung[i]!, goc[Math.floor(rand() * goc.length)]!, rand)
}

/** Đã bấm đủ khung: mọi lớp cao độ của khung có trong các nốt đã bấm. */
export const duKhung = (daBam: ReadonlySet<number>, c: CauKhung) => c.k.not.every((n) => daBam.has(n.p))
/** Nốt bấm sai: không thuộc khung. */
export const ngoaiKhung = (m: number, c: CauKhung) => !c.k.not.some((n) => n.p === pc(m))
