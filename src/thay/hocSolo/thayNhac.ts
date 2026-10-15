import { BALLAD_SOLO_RANGE } from '../../reharm/style/balladFamily'
import { bluesClaudeSolo } from '../../reharm/style/boSoanBlues'
import { composeCpBallad } from '../../reharm/style/cpBalladComposition'
import { soanSlowRockLinhNhi } from '../../reharm/style/soanSlowRockLinhNhi'
import { getStyle } from '../../reharm/style/styleLibrary'
import type { TimelineEvent } from '../../reharm/style/types'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import type { PitchClass } from '../../shared/musicTheory/types'
import { nguCanh } from '../soanCau/giaiThich'
import { docHop } from '../soanCau/thayTrongVong'
import { THAY_CHAY, type ThayChay } from './cauThay'
import { phanBo, type LoaiHop } from './chonNot'
import { khungCua, LOAI_KHUNG, tenPhim, type Khung, type MucKhung } from './khungNot'
import { chonNang, type CauKhung } from './mauKhung'
import du from './thayNhac.json'

/*
  PHONG CÁCH TỪNG THẦY — đo trên chính BỘ SOẠN của thầy. Người dùng 15/10/2026: "Mỗi thầy có đều có phong cách đặt hợp âm và chọn nốt
  solo riêng nên ý tôi khi nói đưa 3 thầy vào các game để học solo là hình thành 3 nút riêng mang phong cách của từng thầy (từ hợp âm cho
  đến nốt solo) … Mỗi thầy có kiểu hợp âm của họ nên tôi cũng muốn học solo theo từng nhóm đuôi … Keytrain đã có Bộ soạn nốt cho câu solo
  của từng thầy nên chắc chắn biết khung nốt solo của từng thầy, hãy đưa vào các game học solo".

  Không cho vòng sẵn thì bộ soạn của thầy TỰ CHỌN cả hợp âm (`soanTuDo`): Cà Pháo — bộ soạn ballad đã duyệt (kho vòng hai ô cùng giọng
  của các sheet ballad, md Cà Pháo mục Solo ballad); Linh Nhi — bộ soạn slow rock đã duyệt (vòng mới ghép từ vòng thật, md 13h); Blues —
  Bộ Soạn Blues lượt 6 trên khung 12 ô của Ray / Rising Sun (md Blues mục 6). Cho bộ soạn soạn nhiều câu (3 đoạn × 2 giọng × `LUOT`
  lượt) rồi ĐẾM: hợp âm nào ở bậc nào (= nhóm đuôi của thầy) và nốt giai điệu (nốt cao nhất mỗi cú tay phải, bỏ nốt láy — như md đo
  "nốt đỉnh") rơi vào bậc nào so với gốc hợp âm (= khung nốt solo của thầy). Đây là số đo trên BỘ SOẠN (bộ soạn học từ sheet), không
  phải đo lại sheet — số trên sheet của từng thầy vẫn ở md (bảng bậc theo chất hợp âm) và hiện kèm để so (`phanBo`).
  Đo chậm (1–4 s mỗi thầy) nên ghi sẵn ra `thayNhac.json`; test `thayNhac.test.ts` đo lại và so — bộ soạn đổi thì chạy
  `TAO_THAY_NHAC=1 npx vitest run src/thay/__tests__/thayNhac.test.ts` để ghi lại.

  Blues: khung 12 ô chỉ ghi hợp âm bảy (I7 · IV7 · V7 · thứ m7) — màu hợp âm lấy theo số đo nốt vang ba sheet (md Blues mục 7e: I mang 6
  và ♭7 → I13; IV mang 9 → IV9; V mang 9 → V9; giọng thứ V7♯9 · III13 · ♭VI9 · i m9) — áp màu là biên soạn của Claude trên số đo ấy;
  giai điệu đo trên hợp âm bảy gốc (cùng gốc, cùng chức năng).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type Doan = 'intro' | 'interlude' | 'outro'
export const DOAN: readonly Doan[] = ['intro', 'interlude', 'outro']

/** Một câu bộ soạn tự soạn: hợp âm (tên theo giọng), số phách mỗi hợp âm, nốt hai tay. */
export interface CauTuDo {
  chords: string[]
  beatsEach: number[]
  events: TimelineEvent[]
}

/** Màu Blues theo chức năng (md Blues 7e) — gốc so chủ âm, giọng; null = giữ hợp âm bộ soạn đặt. */
function mauBlues(goc: number, thu: boolean): string | null {
  if (!thu) return goc === 0 ? '13' : goc === 5 ? '9' : goc === 7 ? '9' : null
  return goc === 0 ? 'm9' : goc === 7 ? '7#9' : goc === 3 ? '13' : goc === 8 || goc === 5 ? '9' : null
}

/** Bộ soạn của thầy tự chọn vòng và soạn câu (đoạn `kind`, lượt `take`) — null nếu bộ soạn không soạn được. */
export function soanTuDo(thay: ThayChay, tonic: number, thu: boolean, kind: Doan, take: number): CauTuDo | null {
  const key = { tonic: pc(tonic) as PitchClass, scale: thu ? 'minor' : 'major' } as const
  const mo = docHop(nguCanh(tonic, thu).h(0, thu ? 'm' : ''))
  const r =
    thay === 'linh-nhi'
      ? soanSlowRockLinhNhi({ kind, key, take, oDieu: 3 })
      : thay === 'ca-phao'
        ? composeCpBallad({
            kind,
            key,
            style: getStyle('ca-phao-ballad-cu-di')!,
            beatsPerChord: 4,
            dropRoot: false,
            // Câu dẫn về hợp âm chủ của giọng (như dẫn vào câu hát kế).
            opening: mo?.[0] ?? null,
            take,
            range: BALLAD_SOLO_RANGE,
            solo: () => [],
            cpBalladThu: true,
          })
        : bluesClaudeSolo({ kind, key, style: getStyle('blue-sun')!, beatsPerChord: 3, dropRoot: false, opening: null, take, solo: () => [], bluesSoan: true })
  if (r.unavailableReason || !r.chords.length || !r.events.some((e) => e.hand === 'right')) return null
  // Bộ đọc hợp âm của app chưa có m6/9 (hợp âm chót Blues giọng thứ — md Blues: Claude suy) → đọc là m6 (giữ bậc 6, bỏ 9).
  let chords = r.chords.map((x) => x.replace(/m6\/9$/, 'm6'))
  if (thay === 'blues') {
    const ds = docHop(chords.join(' '))
    if (ds)
      chords = chords.map((ten, i) => {
        const m = mauBlues(pc(ds[i]!.root - tonic), thu)
        return m ? ten.replace(/(m7|7)$/, m) : ten
      })
  }
  return { chords, beatsEach: [...r.beatsEach], events: [...r.events].sort((a, b) => a.startBeat - b.startBeat) }
}

/** Một chỗ đứng của hợp âm trong phong cách thầy: loại (ký hiệu app), gốc so chủ âm, giọng. */
export interface ChoThay {
  /** Ký hiệu loại hợp âm của app (`quality.symbol`): '' · 'm' · 'maj7' · 'm7' · '9sus4' … */
  duoi: string
  goc: number
  thu: boolean
  /** Số lần bộ soạn đặt hợp âm này (đếm theo hợp âm, cả ba đoạn). */
  soLan: number
  /** Số nốt giai điệu đếm được trên hợp âm này. */
  n: number
  /** Số nốt theo bậc so với gốc hợp âm (12 ô). */
  dem: number[]
}

/** Số lượt mỗi đoạn × giọng khi đo: 24 × 3 đoạn × 2 giọng = 144 câu mỗi thầy (đo 15/10/2026: 1,4 · 2,7 · 3,4 s). */
export const LUOT = 24

/** Đo phong cách thầy trên bộ soạn (Đô trưởng · La thứ — đo theo bậc nên đổi được sang mọi giọng). Chậm: chỉ dùng để ghi `thayNhac.json`. */
export function doThay(thay: ThayChay): ChoThay[] {
  const ds = new Map<string, ChoThay>()
  for (const [tonic, thu] of [
    [0, false],
    [9, true],
  ] as const)
    for (const kind of DOAN)
      for (let take = 0; take < LUOT; take++) {
        const c = soanTuDo(thay, tonic, thu, kind, take)
        const hop = c ? docHop(c.chords.join(' ')) : null
        if (!c || !hop || hop.length !== c.chords.length) continue
        let dau = 0
        hop.forEach((h, i) => {
          const cuoi = dau + c.beatsEach[i]!
          const khoa = `${h.quality.symbol}|${pc(h.root - tonic)}|${thu}`
          const x = ds.get(khoa) ?? { duoi: h.quality.symbol, goc: pc(h.root - tonic), thu, soLan: 0, n: 0, dem: Array<number>(12).fill(0) }
          x.soLan += 1
          for (const e of c.events)
            if (e.hand === 'right' && !e.grace && e.notes.length && e.startBeat >= dau && e.startBeat < cuoi) {
              x.dem[pc(Math.max(...e.notes) - h.root)]! += 1
              x.n += 1
            }
          ds.set(khoa, x)
          dau = cuoi
        })
      }
  return [...ds.values()].sort((a, b) => b.soLan - a.soLan)
}

/** Phong cách đã đo (ghi sẵn) của thầy. */
export const choThay = (thay: ThayChay): readonly ChoThay[] => (du as Record<ThayChay, ChoThay[]>)[thay]

/** Ba mức của khung thầy trên một chỗ đứng (bậc so gốc hợp âm) — luật ba mức của tab Chọn nốt theo thầy: chính = nốt hợp âm hay nốt thầy
 *  đánh từ 10 % số nốt; phụ = có đánh mà dưới 10 %; không = bộ soạn không đánh lần nào. */
export function khungCho(c: Pick<ChoThay, 'duoi' | 'n' | 'dem'>): { chinh: number[]; phu: number[]; khong: number[] } {
  const tru = new Set((findQualityBySymbol(c.duoi)?.intervals ?? [0, 4, 7]).map(pc))
  const bac = [...Array(12).keys()]
  const chinh = bac.filter((b) => tru.has(b) || (c.dem[b]! > 0 && c.dem[b]! >= 0.1 * c.n))
  const phu = bac.filter((b) => !chinh.includes(b) && c.dem[b]! > 0)
  return { chinh, phu, khong: bac.filter((b) => !chinh.includes(b) && !phu.includes(b)) }
}

/** Vai một phím theo khung thầy ở chỗ đứng `c`, với gốc hợp âm `goc` (lớp cao độ). */
export const vaiCho = (c: ChoThay, goc: number): ((m: number) => MucKhung) => {
  const kh = khungCho(c)
  return (m) => {
    const b = pc(m - goc)
    return kh.chinh.includes(b) ? 'chinh' : kh.phu.includes(b) ? 'phu' : 'khong'
  }
}

/** Chỗ đứng của một hợp âm cụ thể trong phong cách thầy (theo loại · bậc · giọng), null nếu bộ soạn chưa đặt hợp âm ấy ở bậc ấy. */
export const timCho = (thay: ThayChay, duoi: string, goc: number, thu: boolean) =>
  choThay(thay).find((c) => c.duoi === duoi && c.goc === pc(goc) && c.thu === thu) ?? null

const LA_MA = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII']
const TEN_DUOI: Readonly<Record<string, string>> = { add2: 'add9', m7b5: 'm7♭5', '7#9': '7♯9', '7b9': '7♭9', aug: '+', dim: '°', '': '' }
/** "IIm7" · "♭VImaj7" · "V9sus4" — bậc (so chủ âm) + đuôi. */
export const tenCho = (c: Pick<ChoThay, 'duoi' | 'goc'>) => `${LA_MA[c.goc]}${TEN_DUOI[c.duoi] ?? c.duoi}`
const BAC = ['1', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7']
export const tenThayCua = (t: ThayChay) => THAY_CHAY.find((x) => x.id === t)!.ten

/** Nhóm đuôi của một loại hợp âm (ký hiệu app) — như hàng nút của Game chạy ngón; hợp âm ba trơn một nhóm riêng. */
export function nhomDuoi(duoi: string): string {
  const l = LOAI_KHUNG.find((x) => x.id === duoi)
  if (l) return l.nhom === 'Át treo' ? 'Treo' : l.nhom
  if (duoi === '' || duoi === 'm') return 'Hợp âm ba'
  if (duoi === 'sus4' || duoi === 'sus2') return 'Treo'
  if (duoi === 'dim') return 'Giảm'
  if (duoi === 'aug') return 'Át có nốt căng'
  return 'Khác'
}

/** Chỗ đứng đủ mẫu để học: bộ soạn đặt ≥ 3 lần và có ≥ 20 nốt giai điệu (Claude chọn — chỗ ít mẫu hơn thì khung không đứng). */
const duMau = (c: ChoThay) => c.soLan >= 3 && c.n >= 20

/** Lời một chỗ đứng: "IIm7 (trưởng) — bộ soạn đặt 63 lần, 691 nốt: chính ♭3 27 % · 5 24 % … · ít 9 · 11". */
export function loiCho(c: ChoThay): string {
  const kh = khungCho(c)
  const pt = (b: number) => Math.round((100 * c.dem[b]!) / Math.max(1, c.n))
  const chinh = [...kh.chinh].sort((a, b) => c.dem[b]! - c.dem[a]!).map((b) => `${BAC[b]} ${pt(b)} %`)
  return `${tenCho(c)} (${c.thu ? 'thứ' : 'trưởng'}) — bộ soạn đặt ${c.soLan} lần, ${c.n} nốt: chính ${chinh.join(' · ')}${kh.phu.length ? ` · ít ${kh.phu.map((b) => BAC[b]).join(' ')}` : ''}`
}

/** Số trên sheet của thầy cho chất hợp âm ấy (md, `phanBo`) — để so với bộ soạn; null nếu md không có. */
export function loiSheet(thay: ThayChay, c: ChoThay): string | null {
  const q = findQualityBySymbol(c.duoi)?.intervals.map(pc) ?? []
  const loai: LoaiHop = q.includes(4) ? (q.includes(10) ? 'at' : 'truong') : q.includes(3) ? (q.includes(6) && !q.includes(7) ? 'giam' : 'thu') : 'at'
  const p = phanBo(thay, { goc: c.goc, chat: c.duoi, loai, laMa: '' }, c.thu)
  if (!p) return null
  const ds = Object.entries(p.pct).sort((a, b) => b[1] - a[1])
  return `Sheet: ${ds.map(([b, v]) => `${BAC[Number(b)]} ${v} %`).join(' · ')} (${p.nguon}, n=${p.n})`
}

export interface ManThay {
  ten: string
  goiY: string
  quyTac: readonly string[]
  cho: readonly ChoThay[]
}
/** Màn của thầy: mỗi nhóm đuôi thầy dùng một màn (nhóm nhiều hợp âm trước), thêm màn trộn. */
export function manThay(thay: ThayChay): ManThay[] {
  const ds = choThay(thay).filter(duMau)
  const nhom = new Map<string, ChoThay[]>()
  for (const c of ds) nhom.set(nhomDuoi(c.duoi), [...(nhom.get(nhomDuoi(c.duoi)) ?? []), c])
  const tong = (xs: readonly ChoThay[]) => xs.reduce((s, x) => s + x.soLan, 0)
  const loi = (xs: readonly ChoThay[]) => xs.map(loiCho)
  return [
    ...[...nhom.entries()]
      .sort((a, b) => tong(b[1]) - tong(a[1]))
      .map(([ten, cho]) => ({ ten, goiY: [...new Set(cho.map(tenCho))].join(' · '), quyTac: loi(cho), cho })),
    { ten: 'Trộn — mọi hợp âm của thầy', goiY: `${ds.length} chỗ đứng`, quyTac: loi(ds.slice(0, 8)), cho: ds },
  ]
}

/** Câu màn thầy của Game nốt rơi: như câu khung, thêm nốt chính của thầy (`chinh`) và nốt thầy không đánh (`tranh`) — lớp cao độ. */
export interface CauThay extends CauKhung {
  khungTen: string
  chinh: number[]
  tranh: number[]
}

export function taoCauThay(thay: ThayChay, mi: number, j: number, tonic: number): CauThay {
  const c = manThay(thay)[mi]!.cho[j]!
  const k = khungCua(tonic, c.thu, { goc: c.goc, chat: c.duoi })
  const kh = khungCho(c)
  const ten = (b: number) => tenPhim(k, 60 + pc(k.goc + b)).replace(/-?\d+$/, '')
  const pt = (b: number) => Math.round((100 * c.dem[b]!) / Math.max(1, c.n))
  const chinh = [...kh.chinh].sort((a, b) => c.dem[b]! - c.dem[a]!)
  const vai = `${tenThayCua(thay)} trên ${k.ten} (${tenCho(c)}): chính ${chinh.map((b) => `${ten(b)} ${pt(b)} %`).join(' · ')}${kh.phu.length ? ` · ít ${kh.phu.map(ten).join(' ')}` : ''}`
  return {
    id: `${thay}${mi}:${j}`,
    ten: k.ten,
    g: k.goc,
    k,
    khungTen: `${tenCho(c)} · giọng ${tenPhim(k, 60 + pc(tonic)).replace(/-?\d+$/, '')} ${c.thu ? 'thứ' : 'trưởng'}`,
    quyTac: vai,
    goiY: `${chinh.length} nốt chính của ${tenThayCua(thay)}`,
    loi: `${vai}.`,
    meo: `${vai} — bộ soạn đặt ${c.soLan} lần, n=${c.n} nốt.`,
    dapAnTen: '',
    luaChon: [],
    chinh: chinh.map((b) => pc(k.goc + b)),
    tranh: kh.khong.map((b) => pc(k.goc + b)),
  }
}

/** Câu kế của màn thầy `mi` (hợp âm vừa sai quay lại nhiều hơn), chủ âm ngẫu nhiên trong `goc`. */
export function chonCauThay(
  thay: ThayChay,
  mi: number,
  goc: readonly number[],
  sai: ReadonlyMap<string, number>,
  truoc: string | null,
  rand: () => number = Math.random,
): CauThay {
  const id = chonNang(manThay(thay)[mi]!.cho.map((_, j) => `${thay}${mi}:${j}`), sai, truoc, rand)
  return taoCauThay(thay, mi, Number(id.split(':')[1]), goc[Math.floor(rand() * goc.length)]!)
}

/** Một cú bấm ở màn thầy: nốt thầy không đánh là sai; nốt chính góp vào; nốt thầy đánh ít không tính. */
export function chamThay(
  c: { chinh: readonly number[]; tranh: readonly number[] },
  note: number,
  daChay: readonly number[],
): { kq: 'sai' } | { kq: 'mo' } | { kq: 'dung' } | { kq: 'tiep'; daChay: number[] } {
  const p = pc(note)
  if (c.tranh.includes(p)) return { kq: 'sai' }
  if (!c.chinh.includes(p)) return { kq: 'mo' }
  const moi = daChay.some((m) => pc(m) === p) ? [...daChay] : [...daChay, note]
  return c.chinh.every((x) => moi.some((m) => pc(m) === x)) ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}

/** Dùng cho khung đang vang ở phần nghe – đáp: vai theo thầy nếu bộ soạn có chỗ đứng ấy, không thì null. */
export function vaiThayTrenKhung(thay: ThayChay, duoi: string, k: Khung, tonic: number, thu: boolean): ((m: number) => MucKhung) | null {
  const c = timCho(thay, duoi, pc(k.goc - tonic), thu)
  return c && c.n >= 10 ? vaiCho(c, k.goc) : null
}
