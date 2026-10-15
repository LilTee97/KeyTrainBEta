import { CA_PHAO_VOICINGS } from '../../reharm/reharmEngine/caPhaoHarmony'
import { BALLAD_SOLO_RANGE } from '../../reharm/style/balladFamily'
import { bluesClaudeSolo } from '../../reharm/style/boSoanBlues'
import { composeCpBallad } from '../../reharm/style/cpBalladComposition'
import { soanSlowRockLinhNhi } from '../../reharm/style/soanSlowRockLinhNhi'
import { getStyle } from '../../reharm/style/styleLibrary'
import type { TimelineEvent } from '../../reharm/style/types'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
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

/*
  MÀU CÀ PHÁO THEO BẬC — người dùng 15/10/2026: "Cà Pháo chơi có rất nhiều hợp âm màu khác nhau sao bộ soạn Cà Pháo trong game chạy ngón lại
  đưa ra các vòng hợp âm quanh quẩn ở các hợp âm cơ bản và đơn điệu vậy". Đo: bộ soạn ballad tự chọn vòng từ KÝ HIỆU các sheet ballad —
  m7 31,1 % · hợp âm ba 18,8 % · 7 16,2 % (n=901 hợp âm, 144 câu); tiếng thật dưới giai điệu thì nốt 9 ở gần mọi ô mà nốt 7 hiếm (♭7 vang
  8/72 ô V7, 19/63 ô IIm7). Màu của anh nằm ở tay phải, không ở ký hiệu (md Cà Pháo mục 3, "Màu nằm ở đâu"). Nên tô vòng bộ soạn chọn theo
  chỗ anh tự thêm màu mà bản phổ biến không ghi (md mục 3 "Màu bản không ghi", phần hát 7 bài, số chỗ): giọng thứ i ♭7 28 · 9 24 → m9;
  ♭VI maj7 23 · 9 19 → maj9; ♭VII ♭7 13 · 9 11 → 9; V 9 7 · ♭13 7 → 7♭13 (app chưa có 9♭13); giọng trưởng I 9 15 → add9 (đã maj7 → maj9);
  V 9 12 · 13 6 → 9, xen 13; hợp âm thứ → m7 (140/172 đoạn hợp âm thứ của anh có ♭7 vang); IV · ♭III trơn → maj7 (như `colorCaPhao`). Đây
  là biên soạn của Claude trên số đo ấy — số đo ở phần hát, áp sang câu solo là suy luận.
*/
function mauCaPhao(goc: number, thu: boolean, duoi: string, lan: number): string {
  if (duoi === 'm') return thu && goc === 0 ? 'm9' : 'm7'
  if (thu) {
    if (goc === 0 && duoi === 'm7') return 'm9'
    if (goc === 8 && (duoi === '' || duoi === 'maj7')) return 'maj9'
    if (goc === 10 && (duoi === '' || duoi === '7')) return '9'
    if (goc === 7 && (duoi === '' || duoi === '7')) return '7b13'
    if (goc === 3 && duoi === '') return 'maj7'
    return duoi
  }
  if (goc === 0 && duoi === '') return 'add2'
  if (goc === 0 && duoi === 'maj7') return 'maj9'
  if (goc === 5 && duoi === '') return 'maj7'
  if (goc === 7 && (duoi === '' || duoi === '7')) return lan % 2 ? '13' : '9'
  return duoi
}

/*
  THẾ TAY PHẢI LÀM NỀN — màu hợp âm phải VANG chứ không chỉ nằm ở nhãn. Đo 15/10/2026 (tiếng hai tay bộ soạn, bỏ nốt đỉnh, nốt vang ≥ 8 %
  thời lượng ô): nền bộ soạn Cà Pháo chỉ rải 1 · 9 · 3 · 5 — nốt 13 của G13 vang 0/39 ô, nốt 7 của Fmaj9 6/87, ♭7 của Am9 7/73; Blues
  nhãn C13 mà 13 vang 12/75 ô, 9 của G9 0/36, ♯9 của E7♯9 0/36. Nên thêm một thế tay phải giữ suốt ô, nhẹ, dưới giai điệu (tay "left" để
  lượt bạn vẫn nghe — nền là hai tay của máy, giai điệu là của bạn). Cà Pháo: thế rút từ sheet của anh (`CA_PHAO_VOICINGS`; md: "màu của
  anh nằm trong tay phải", vd Dm9 = D2 | C4 E4 F4 A4); Blues: thế vỏ 3 – ♭7 – màu (md Blues "Thế bấm tay phải": thế bậc 9 2 + 3 + 5 + ♭7,
  9/187 cụm); loại chưa có thế thì lấy nốt hợp âm trừ gốc. Chọn thế, giữ suốt ô và lực 46 là biên soạn của Claude.
*/
const THE_BLUES: Readonly<Record<string, readonly number[]>> = {
  '13': [4, 10, 21],
  '9': [4, 10, 14],
  '7#9': [4, 10, 15],
  m9: [3, 10, 14],
  m6: [3, 9, 14],
  '7': [4, 7, 10],
}
function nenMau(thay: ThayChay, chords: readonly string[], beatsEach: readonly number[]): TimelineEvent[] {
  const hop = docHop(chords.join(' '))
  if (!hop || hop.length !== beatsEach.length) return []
  const ra: TimelineEvent[] = []
  let dau = 0
  hop.forEach((h, i) => {
    // Cà Pháo chưa có thế 13 trong bảng của anh → thế vỏ 3 – ♭7 – 13 (bỏ 9 như công thức C13 = 1 – 3 – ♭7 + Am của app).
    const iv = (thay === 'blues' ? THE_BLUES[h.quality.symbol] : (CA_PHAO_VOICINGS[h.quality.id] ?? THE_BLUES[h.quality.symbol])) ?? h.quality.intervals.filter((x) => pc(x) !== 0).slice(0, 4)
    let goc = 48 + pc(h.root)
    if (goc + Math.max(...iv) > 70) goc -= 12
    ra.push({ notes: iv.map((x) => goc + x) as MidiNote[], startBeat: dau, durationBeats: Math.max(0.5, beatsEach[i]! - 0.1), hand: 'left', velocity: 46 })
    dau += beatsEach[i]!
  })
  return ra
}

/** Bộ soạn của thầy tự chọn vòng và soạn câu (đoạn `kind`, lượt `take`) — null nếu bộ soạn không soạn được. */
export function soanTuDo(thay: ThayChay, tonic: number, thu: boolean, kind: Doan, take: number): CauTuDo | null {
  const key = { tonic: pc(tonic) as PitchClass, scale: thu ? 'minor' : 'major' } as const
  const mo = docHop(nguCanh(tonic, thu).h(0, thu ? 'm' : ''))
  const cp = (cpVongCoDinh?: { root: number; suffix: string; bass: number | null; beats: number }[]) =>
    composeCpBallad({
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
      ...(cpVongCoDinh ? { cpVongCoDinh } : {}),
    })
  /* Cà Pháo: bộ soạn chọn vòng → tô màu theo bậc (`mauCaPhao`) → bộ soạn soạn lại câu trên vòng đã tô (thế bấm hai tay dựng từ hợp âm có
     màu, giai điệu coi nốt màu là nốt hợp âm). */
  const caPhao = () => {
    const vong = cp()
    const hop = vong.unavailableReason ? null : docHop(vong.chords.join(' '))
    if (!hop || hop.length !== vong.chords.length) return vong
    return cp(
      hop.map((h, i) => ({
        root: pc(h.root - tonic),
        suffix: mauCaPhao(pc(h.root - tonic), thu, h.quality.symbol, i + take),
        bass: h.bass === undefined || h.bass === h.root ? null : pc(h.bass - tonic),
        beats: vong.beatsEach[i]!,
      })),
    )
  }
  const r =
    thay === 'linh-nhi'
      ? soanSlowRockLinhNhi({ kind, key, take, oDieu: 3 })
      : thay === 'ca-phao'
        ? caPhao()
        : bluesClaudeSolo({ kind, key, style: getStyle('blue-sun')!, beatsPerChord: 3, dropRoot: false, opening: null, take, solo: () => [], bluesSoan: true })
  if (r.unavailableReason || !r.chords.length || !r.events.some((e) => e.hand === 'right')) return null
  // Bộ đọc hợp âm của app chưa có m6/9 (hợp âm chót Blues giọng thứ — md Blues: Claude suy) → đọc là m6 (giữ bậc 6, bỏ 9).
  let chords = r.chords.map((x) => x.replace(/m6\/9$/, 'm6').replace(/add2(?=$|\/)/, 'add9'))
  if (thay === 'blues') {
    const ds = docHop(chords.join(' '))
    if (ds)
      chords = chords.map((ten, i) => {
        const m = mauBlues(pc(ds[i]!.root - tonic), thu)
        return m ? ten.replace(/(m7|7)$/, m) : ten
      })
  }
  const nen = thay === 'linh-nhi' ? [] : nenMau(thay, chords, r.beatsEach)
  return { chords, beatsEach: [...r.beatsEach], events: [...r.events, ...nen].sort((a, b) => a.startBeat - b.startBeat) }
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
