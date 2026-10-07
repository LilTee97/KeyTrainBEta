import { parseChordToken } from '../../reharm/input/chordInputParser'
import { MAJOR_COLOR_OPTIONS, PALETTE_BY_TONIC_COLOR, type MajorChordColor } from '../../reharm/reharmEngine/staticVoicingRules'
import { chordPitchClasses, findQualityBySymbol, getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import type { ChordQuality } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { buildProgression, PROGRESSION_TEMPLATES } from '../../shared/musicTheory/progressionGenerator'
import { chordAtDegree, diatonicChords } from '../../shared/musicTheory/scales'
import type { LuotTap } from '../../shared/persistence/db'
import type { VongBaiTap } from '../baiTap'
import type { TeacherId } from '../teachers'
import { kieuDau } from '../vongThay'
import linhNhi from './linhNhi.json'

/*
  Tab HỌC CÁCH SOẠN CÂU (GĐ 3, `Reference/KE-HOACH-LUYEN-TAP.md` mục GĐ 3; người dùng duyệt 4/10/2026). Hai nguồn, không trộn:
  - LÝ THUYẾT piano: hợp âm theo bậc của gam (`diatonicChords`), bảng màu chuẩn của app (`PALETTE_BY_TONIC_COLOR`), 11 vòng
    `PROGRESSION_TEMPLATES`.
  - THẦY: số đo từ sheet (`<thầy>.json`, xuất bằng `tools/soan_cau_<thầy>.py` từ các bộ đo có sẵn). Chọn nốt BÁM SHEET — thầy đánh
    nốt nào bao nhiêu phần trăm, không có đúng/sai tuyệt đối (người dùng 4/10/2026).
*/

export interface BacThay {
  /** Gốc hợp âm so với chủ âm, nửa cung. */
  goc: number
  /** Hậu tố hợp âm ba: '' · 'm' · 'dim' · 'aug' · 'sus4'. */
  chat: string
  n: number
  bai: number
  tron: number
  dao: number
  /** Số đoạn CÓ nốt màu ấy — một hợp âm có thể mang hai màu. */
  mau: Record<string, number>
}

type Phach = 'manh' | 'nhe'

export interface VongThay {
  id: string
  ten: string
  dieu: string
  thu: boolean
  hopAm: { goc: number; chat: string }[]
}

export interface DuLieuSoanCau {
  hopAm: Record<'truong' | 'thu', { bac: Record<string, BacThay>; chuyen: [string, string, number, number][] }>
  /** `${điệu}|${giọng}` → nhóm hợp âm → phách → bậc so với gốc hợp âm (chuỗi 0–11) → số nốt. */
  not_: Record<string, { doan: number; bai: number; nhom: Record<string, Partial<Record<Phach, Record<string, number>>>> }>
  vong: VongThay[]
}

const DU_LIEU: Partial<Record<TeacherId, DuLieuSoanCau>> = { 'linh-nhi': linhNhi as unknown as DuLieuSoanCau }

/** Thầy có dữ liệu thì có tab — Tuấn không có sheet nên không có (người dùng chọn Q2, 4/10/2026). */
export const duLieuSoanCau = (thay: TeacherId): DuLieuSoanCau | null => DU_LIEU[thay] ?? null

const giong = (thu: boolean) => (thu ? 'thu' : 'truong')
const pc = (x: number) => ((x % 12) + 12) % 12
const tenNot = (x: number, tonic: number, thu: boolean) => pitchClassName(pc(x), kieuDau(tonic, thu))
export const tenHopAm = (tonic: number, thu: boolean, goc: number, chat: string) => `${tenNot(tonic + goc, tonic, thu)}${chat}`
/** 'bVI' → '♭VI'. */
export const dep = (laMa: string) => laMa.replace(/^b/, '♭').replace(/^#/, '♯')

/* ---------------- Lý thuyết piano ---------------- */

/** Loại hợp âm bậc 1 người dùng chọn: `id` chất hợp âm (bảng màu chuẩn dùng id), `kyHieu` để ghép tên. */
export const LOAI_BAC1: Record<'truong' | 'thu', readonly { id: string; kyHieu: string }[]> = {
  truong: [
    { id: '', kyHieu: '' },
    { id: 'maj7', kyHieu: 'maj7' },
    ...(['6', 'add9', 'maj9', '69', 'sus2'] as const).map((id) => ({ id, kyHieu: getChordQuality(id)?.symbol ?? id })),
  ],
  thu: [
    { id: 'm', kyHieu: 'm' },
    { id: 'm7', kyHieu: 'm7' },
  ],
}

const CHUC_NANG = {
  truong: ['chủ', 'hạ át', 'chủ', 'hạ át', 'át', 'chủ', 'át'],
  /* v và ♭VII của gam thứ tự nhiên không có nốt cảm âm — át YẾU; V của gam thứ hòa âm mới là át đủ lực. */
  thu: ['chủ', 'hạ át', 'chủ', 'hạ át', 'át (yếu)', 'hạ át', 'át (yếu)'],
}

/**
 * Số La Mã ghi như md của các thầy (và cột thầy): so với gam TRƯỞNG cùng chủ âm — ♭III · ♭VI · ♭VII ở giọng thứ; chữ thường khi có
 * quãng ba thứ; ° giảm, ø7 nửa giảm. Cũ (`romanFor` của app): III · VI · VII, "iidim" — đặt cạnh cột thầy thì rối.
 */
function laMa(bac: number, nuaCung: number, q: ChordQuality): string {
  const truong = [0, 2, 4, 5, 7, 9, 11][bac - 1]!
  const dau = nuaCung < truong ? '♭' : nuaCung > truong ? '♯' : ''
  const so = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][bac - 1]!
  const thuong = q.intervals.includes(3)
  const hau =
    q.id === 'maj' || q.id === 'min' ? '' : q.id === 'dim' ? '°' : q.id === 'm7b5' ? 'ø7' : q.id === 'dim7' ? '°7' : thuong ? q.symbol.replace(/^m/, '') : q.symbol
  return dau + (thuong ? so.toLowerCase() : so) + hau
}

export interface DongLyThuyet {
  /** Bậc trong gam, 1–7 (V của gam thứ hòa âm cũng là bậc 5). */
  bac: number
  laMa: string
  hopAm: string
  /** Hậu tố hợp âm (ký hiệu chất) — để giải thích cấu tạo. */
  chat: string
  chucNang: string
  goc: number
  pcs: number[]
}

/**
 * Hợp âm 7 bậc theo lý thuyết, từ loại hợp âm bậc 1 người dùng nhập: hợp âm ba → cả bảng hợp âm ba; maj7 / m7 → cả bảng hợp âm
 * bảy; màu (6 · add9 · maj9 · 6/9 · sus2) → bộ màu chuẩn `PALETTE_BY_TONIC_COLOR`. Giọng thứ thêm V của gam thứ hòa âm.
 */
export function lyThuyetBac(tonic: number, thu: boolean, loai: string): { dong: DongLyThuyet[]; moTa: string } {
  const scale = thu ? 'minor' : 'major'
  const accidentalStyle = kieuDau(tonic, thu)
  const bay = loai === 'maj7' || loai === 'm7'
  const ba = diatonicChords(tonic, scale, { accidentalStyle })
  const palette = !thu && loai in PALETTE_BY_TONIC_COLOR && !bay ? PALETTE_BY_TONIC_COLOR[loai as MajorChordColor] : null
  const mauCua = (bac: number): string => {
    if (!palette) return ''
    if (bac === 1 || bac === 4) return palette.major
    if (bac === 5) return palette.dominant === 'auto' ? '7' : palette.dominant
    if (bac === 7) return 'm7b5'
    return palette.minor === 'auto' ? 'm7' : palette.minor
  }
  const dong = ba.map((chord, i) => {
    const bac = i + 1
    const c = palette
      ? chordAtDegree(tonic, scale, bac, { accidentalStyle, qualityOverride: mauCua(bac) })
      : chordAtDegree(tonic, scale, bac, { accidentalStyle, useSevenths: bay })
    const x = c ?? chord
    const goc = pc(x.root - tonic)
    return {
      bac,
      laMa: laMa(bac, goc, x.quality),
      hopAm: x.symbol,
      chat: x.quality.symbol,
      chucNang: CHUC_NANG[giong(thu)][i]!,
      goc,
      pcs: chordPitchClasses(x.root, x.quality),
    }
  })
  if (thu) {
    const v = chordAtDegree(tonic, scale, 5, { accidentalStyle, qualityOverride: bay ? '7' : 'maj' })
    if (v) {
      dong.splice(5, 0, {
        bac: 5,
        laMa: laMa(5, 7, v.quality),
        hopAm: v.symbol,
        chat: v.quality.symbol,
        chucNang: 'át (gam thứ hòa âm)',
        goc: 7,
        pcs: chordPitchClasses(v.root, v.quality),
      })
    }
  }
  const option = MAJOR_COLOR_OPTIONS.find((one) => one.id === loai)
  const moTa = palette
    ? `Bộ màu "${palette.styleName}" (bảng màu chuẩn của app, theo tài liệu đệm hát và nguồn jazz): bậc trưởng ${getChordQuality(palette.major)?.symbol ?? palette.major}, bậc thứ ${mauCua(2)}, bậc V ${mauCua(5)}.${option ? ` ${option.description}` : ''}`
    : bay
      ? 'Hợp âm bảy dựng trên từng bậc của gam (chồng thêm một quãng ba lên hợp âm ba).'
      : 'Hợp âm ba dựng trên từng bậc của gam: nốt gốc, bậc ba, bậc năm — chỉ dùng nốt của gam.'
  return { dong, moTa: thu ? `${moTa} Giọng thứ: gam thứ tự nhiên; bậc V đổi thành trưởng (gam thứ hòa âm) để kéo mạnh về chủ.` : moTa }
}

export interface VongHienThi {
  id: string
  ten: string
  ghiChu: string
  hopAm: string[]
  pcs: number[][]
}

/** 11 vòng lý thuyết có sẵn (`PROGRESSION_TEMPLATES`) ở giọng đã chọn. */
export function vongLyThuyet(tonic: number, thu: boolean, bay: boolean): VongHienThi[] {
  return PROGRESSION_TEMPLATES.filter((t) => t.scale === (thu ? 'minor' : 'major')).map((t) => {
    const chords = buildProgression(t, tonic, { useSevenths: bay, accidentalStyle: kieuDau(tonic, thu) })
    return {
      id: t.id,
      ten: t.name,
      ghiChu: t.note ?? '',
      hopAm: chords.map((c) => c.symbol),
      pcs: chords.map((c) => chordPitchClasses(c.root, c.quality)),
    }
  })
}

/* ---------------- Thầy: phong cách đặt hợp âm (số đo) ---------------- */

const TEN_MAU: Record<string, string> = {
  b7: '♭7', '7': '7 (maj7)', '9': '9', '11': '11', '6': '6', b9: '♭9', b13: '♭13', '#11': '♯11',
}

export interface DongThay {
  /** Ký hiệu bậc như trong dữ liệu ('bVI', 'ii°') — khoá để tra bước chuyển, ghi chú. */
  khoa: string
  laMa: string
  hopAm: string
  goc: number
  chat: string
  /** Tên nốt của hợp âm ba (0–11) — để bấm nghe. */
  pcs: number[]
  n: number
  bai: number
  tron: number
  mau: [string, number][]
  /** Như `mau` nhưng giữ khoá gốc ('b7', '9' …) — để giải thích từng màu. */
  mauKhoa: [string, number][]
  /** Cảnh báo về chất lượng số đo — vd hợp âm giảm đọc từ tay trái thiếu gốc. */
  nghi?: string
}

/** Các bậc thầy đặt — chỉ bậc có ≥ 5 đoạn ở ≥ 2 bài (một bài thì chưa nói được là lối của thầy). */
export function bacThay(du: DuLieuSoanCau, tonic: number, thu: boolean): DongThay[] {
  return Object.entries(du.hopAm[giong(thu)].bac)
    .filter(([, b]) => b.n >= 5 && b.bai >= 2)
    .map(([r, b]) => ({
      khoa: r,
      laMa: dep(r),
      hopAm: tenHopAm(tonic, thu, b.goc, b.chat),
      goc: b.goc,
      chat: b.chat,
      pcs: chordPitchClasses(pc(tonic + b.goc), findQualityBySymbol(b.chat)!),
      n: b.n,
      bai: b.bai,
      tron: b.tron,
      mau: Object.entries(b.mau)
        .sort((x, y) => y[1] - x[1])
        .map(([m, k]): [string, number] => [TEN_MAU[m] ?? m, k]),
      mauKhoa: Object.entries(b.mau).sort((x, y) => y[1] - x[1]),
      ...(b.dao > b.n / 2
        ? { nghi: `${b.dao}/${b.n} đoạn có bass khác gốc — nhiều khả năng là hợp âm thiếu gốc đọc từ tay trái, chưa kiểm tay` }
        : {}),
    }))
    .sort((x, y) => y.n - x.n)
}

const CHAT_BA: Record<string, string> = { '': 'maj', m: 'min', dim: 'dim', aug: 'aug', sus4: 'sus4' }

/**
 * Bậc thầy đặt khác lý thuyết (hợp âm ba của gam): chất khác, hoặc gốc nằm ngoài gam. Chỉ bậc ≥ 10 đoạn ở ≥ 3 bài, bỏ bậc có số đo
 * đáng ngờ (`nghi`).
 */
export function khacLyThuyet(du: DuLieuSoanCau, tonic: number, thu: boolean): string[] {
  const ba = new Map(lyThuyetBac(tonic, thu, thu ? 'm' : '').dong.filter((d) => d.chucNang !== 'át (gam thứ hòa âm)').map((d) => [d.goc, d]))
  return bacThay(du, tonic, thu)
    .filter((d) => d.n >= 10 && d.bai >= 3 && !d.nghi)
    .flatMap((d) => {
      const lt = ba.get(d.goc)
      const chatLt = lt ? findQualityBySymbol(lt.hopAm.replace(/^[A-G][#b]?/, ''))?.id : undefined
      if (lt && chatLt === CHAT_BA[d.chat]) return []
      const mau = d.mau[0] && d.mau[0][1] >= d.n / 2 ? ` — có ${d.mau[0][0]} ${d.mau[0][1]}/${d.n}` : ''
      return [
        lt
          ? `Bậc ${lt.laMa} (${lt.hopAm}) — lý thuyết; chị đặt ${d.laMa} (${d.hopAm}) ${d.n} đoạn, ${d.bai} bài${mau}.`
          : `${d.laMa} (${d.hopAm}) nằm ngoài gam — chị đặt ${d.n} đoạn, ${d.bai} bài${mau}.`,
      ]
    })
}

/** Bước chuyển hay gặp, chỉ bước có ở ≥ 2 bài. */
export function chuyenThay(du: DuLieuSoanCau, tonic: number, thu: boolean, toiDa = 8) {
  const bac = du.hopAm[giong(thu)].bac
  const ten = (r: string) => {
    const b = bac[r]
    return b ? `${dep(r)} (${tenHopAm(tonic, thu, b.goc, b.chat)})` : dep(r)
  }
  return du.hopAm[giong(thu)].chuyen
    .filter(([, , , baiCo]) => baiCo >= 2)
    .slice(0, toiDa)
    .map(([a, b, n, baiCo]) => ({ tu: ten(a), den: ten(b), n, bai: baiCo }))
}

/** Vòng 4 ô thật từ sheet của thầy, ở giọng đã chọn. */
export function vongCuaThay(du: DuLieuSoanCau, tonic: number, thu: boolean): (VongHienThi & { dieu: string; vong: VongThay })[] {
  return du.vong
    .filter((v) => v.thu === thu)
    .map((v) => ({
      id: v.id,
      ten: v.ten,
      ghiChu: v.dieu,
      dieu: v.dieu,
      vong: v,
      hopAm: v.hopAm.map((h) => tenHopAm(tonic, thu, h.goc, h.chat)),
      pcs: v.hopAm.map((h) => chordPitchClasses(pc(tonic + h.goc), findQualityBySymbol(h.chat)!)),
    }))
}

/**
 * Ghi chú số đo viết tay từ md của thầy — hiện ở phần chọn nốt. Hai mảng `truong` · `thu` (ghi chú dưới bảng hợp âm cũ) bỏ 4/10/2026
 * cùng bảng ấy: câu "II7 — át của V (10/10)" sai — soát tay chỉ 3/10 đi tới V (`tools/ly_do_hop_am_linh_nhi.py`, md 13k).
 */
export const GHI_CHU_THAY: Partial<Record<TeacherId, { not: string }>> = {
  'linh-nhi': {
    not: 'Mức bám hợp âm của chị tùy điệu (23 đoạn solo, 8 bài): nốt hợp âm ở phách mạnh · phách nhẹ — slow rock thứ 83 % · 85 %, bolero trưởng 82 % · 60 %, bolero thứ 64 % · 56 %.',
  },
}

/* ---------------- Thầy: chọn nốt solo — bám sheet ---------------- */

/** Ngữ cảnh ít hơn số nốt này thì gộp sang ngữ cảnh rộng hơn — Claude chọn, chưa đo. */
export const N_TOI_THIEU = 20
/** "Thầy hay dùng" = các bậc gộp lại chiếm tới ~70 % số nốt — Claude chọn, chưa đo (kế hoạch GĐ 3, thang bậc 3). */
export const PHU_HAY_DUNG = 0.7

const TEN_NHOM: Record<string, string> = {
  '': 'hợp âm trưởng', m: 'hợp âm thứ', '7': 'hợp âm bảy át', m7: 'hợp âm m7', maj7: 'hợp âm maj7', dim: 'hợp âm giảm',
  m7b5: 'hợp âm m7♭5', sus4: 'hợp âm sus4', aug: 'hợp âm tăng',
}
/** Nhóm gần nhất để gộp khi ít số đo. */
const GAN: Record<string, string> = { maj7: '', m7: 'm', m7b5: 'dim', dim: 'm7b5', '7': '', sus4: '', aug: '' }

export interface PhanBo {
  /** Số nốt theo bậc so với gốc hợp âm, 0–11. */
  dem: number[]
  n: number
  moTa: string
  /** Đã gộp sang ngữ cảnh rộng hơn vì ít số đo. */
  gop: boolean
}

/**
 * Thầy đánh nốt nào trên loại hợp âm này — ngữ cảnh hẹp nhất có ≥ `N_TOI_THIEU` nốt: điệu + giọng → mọi điệu cùng giọng → cả hai
 * giọng; rồi thử nhóm hợp âm gần nhất (maj7 → trưởng, m7♭5 → giảm …).
 */
export function phanBoNot(du: DuLieuSoanCau, dieu: string, thu: boolean, chat: string, phach: Phach | 'ca'): PhanBo {
  const nhom = chat in TEN_NHOM ? chat : ''
  const g = giong(thu)
  const tenGiong = thu ? 'giọng thứ' : 'giọng trưởng'
  const phachs: Phach[] = phach === 'ca' ? ['manh', 'nhe'] : [phach]
  const tenPhach = phach === 'ca' ? 'mọi phách' : phach === 'manh' ? 'phách mạnh' : 'phách nhẹ'
  const cap: [string[], string][] = [
    [[`${dieu}|${g}`], `${dieu} ${tenGiong}`],
    [Object.keys(du.not_).filter((k) => k.endsWith(`|${g}`)), `gộp mọi điệu ${tenGiong}`],
    [Object.keys(du.not_), 'gộp mọi điệu, cả hai giọng'],
  ]
  const thu_ = [nhom, GAN[nhom]].filter((x): x is string => x !== undefined)
  for (const [ni, nh] of thu_.entries()) {
    for (const [ci, [khoa, ten]] of cap.entries()) {
      const dem = Array.from({ length: 12 }, () => 0)
      for (const k of khoa) {
        for (const ph of phachs) {
          for (const [rel, so] of Object.entries(du.not_[k]?.nhom[nh]?.[ph] ?? {})) dem[Number(rel)]! += so
        }
      }
      const n = dem.reduce((s, x) => s + x, 0)
      if (n >= N_TOI_THIEU) {
        return { dem, n, gop: ni > 0 || ci > 0, moTa: `${ten} · ${TEN_NHOM[nh]}${ni > 0 ? ` (gộp thay cho ${TEN_NHOM[nhom]})` : ''} · ${tenPhach}` }
      }
    }
  }
  return { dem: Array.from({ length: 12 }, () => 0), n: 0, gop: true, moTa: 'chưa đủ số đo' }
}

export interface MucNot {
  rel: number
  dem: number
  phanTram: number
  muc: 'hay' | 'co' | 'chua'
}

/** Xếp 12 bậc từ nhiều tới ít: "hay dùng" (gộp tới ~70 %) · "có dùng" · "chưa gặp trong sheet". */
export function xepNot(pb: PhanBo): MucNot[] {
  let truoc = 0
  return pb.dem
    .map((dem, rel) => ({ rel, dem }))
    .sort((a, b) => b.dem - a.dem || a.rel - b.rel)
    .map(({ rel, dem }) => {
      const muc: MucNot['muc'] = dem === 0 ? 'chua' : truoc < PHU_HAY_DUNG ? 'hay' : 'co'
      truoc += pb.n > 0 ? dem / pb.n : 0
      return { rel, dem, phanTram: pb.n > 0 ? dem / pb.n : 0, muc }
    })
}

/** Tên bậc so với gốc hợp âm: nốt của hợp âm gọi theo hợp âm (1 · ♭3 · 5 …), nốt ngoài gọi theo nốt căng (9 · 11 · 13 …). */
export function tenBac(rel: number, chat: string): string {
  const q = findQualityBySymbol(chat)
  const hopAm = new Set(q ? chordPitchClasses(0, q) : [0, 4, 7])
  const trong: Record<number, string> = { 0: '1', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7' }
  const ngoai: Record<number, string> = { 0: '1', 1: '♭9', 2: '9', 3: '♯9', 4: '3', 5: '11', 6: '♯11', 7: '5', 8: '♭13', 9: '13', 10: '♭7', 11: '7' }
  return (hopAm.has(rel) ? trong : ngoai)[rel] ?? String(rel)
}

const CHU = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const PC_CHU = [0, 2, 4, 5, 7, 9, 11] as const

/**
 * Tên nốt gọi theo CHỮ của bậc: từ chữ nốt gốc đếm đủ số bậc ra chữ, rồi thêm dấu cho khớp nửa cung — ♭9 của Rê là Mi♭, 11 của Fa
 * là Si♭, ♯11 của Fa là Si. Cũ (lần đầu 4/10): theo dấu của giọng → "♭9 (D#)", "11 (A#)" ở La thứ.
 */
export function tenNotBac(gocPc: number, rel: number, chat: string, tonic: number, thu: boolean): string {
  const chuGoc = CHU.indexOf(pitchClassName(pc(gocPc), kieuDau(tonic, thu))[0] as (typeof CHU)[number])
  const bac = ((Number(tenBac(rel, chat).replace(/[♭♯]/g, '')) - 1) % 7) + 1
  const chu = (chuGoc + bac - 1) % 7
  const lech = pc(gocPc + rel - PC_CHU[chu]! + 6) - 6
  return CHU[chu]! + (lech > 0 ? '#'.repeat(lech) : 'b'.repeat(-lech))
}

/* ---------------- Quiz điền ô trống ---------------- */

/** Bấm đúng hợp âm khi tập tên nốt đang giữ trùng đúng tập tên nốt của hợp âm (bỏ quãng tám, bỏ trùng). */
export function dungHopAm(dangGiu: readonly number[], pcs: readonly number[]): boolean {
  const giu = new Set(dangGiu.map(pc))
  return giu.size === new Set(pcs).size && pcs.every((x) => giu.has(x))
}

/**
 * Trả lời quiz bằng TÊN hợp âm — chạm chọn hoặc gõ (người dùng 4/10/2026: "dùng cảm ứng hoặc bàn phím cũng có thể trả lời quiz").
 * Đúng khi tập tên nốt của hợp âm gõ vào trùng hợp âm cần điền — "Bb" hay "A#" đều được; chữ thường đầu tên ("dm7") vẫn đọc.
 */
export function traLoiTen(ten: string, pcs: readonly number[]): 'dung' | 'sai' | 'khong-doc' {
  const chuan = ten.trim().replace(/♭/g, 'b').replace(/♯/g, '#').replace(/^[a-g]/, (c) => c.toUpperCase())
  const doc = parseChordToken(chuan)
  if (typeof doc === 'string') return 'khong-doc'
  return dungHopAm(chordPitchClasses(doc.root, doc.quality), pcs) ? 'dung' : 'sai'
}

/* ---------------- Tập solo trên backing — thang bậc ---------------- */

export type BacSolo = 1 | 2 | 3
export const BAC_SOLO: readonly { so: BacSolo; ten: string; viSao: string }[] = [
  { so: 1, ten: 'Một hợp âm · 3 nốt chị dùng nhiều nhất', viSao: 'Tìm ra 3 nốt chị đánh nhiều nhất trên hợp âm đầu vòng — phím được nhận sáng sẵn.' },
  { so: 2, ten: 'Hai hợp âm · 3 nốt mỗi hợp âm', viSao: 'Hợp âm đổi thì nốt đổi theo: tìm 3 nốt chị dùng nhiều nhất trên mỗi hợp âm, phím vẫn sáng.' },
  { so: 3, ten: 'Cả vòng · nhóm chị hay dùng · tắt gợi ý', viSao: 'Mỗi hợp âm đánh 2 nốt thuộc nhóm chị hay dùng (gộp tới ~70 % số nốt của chị) — không còn phím sáng.' },
]
/** Qua bậc khi ≥ 80 % lần bấm thuộc tập được nhận — Claude chọn, chưa đo. */
export const DAT_SOLO = 0.8

export interface BuocSolo {
  hopAm: string
  chat: string
  /** Gốc hợp âm (tên nốt, 0–11). */
  goc: number
  /** Tên nốt được nhận (0–11). */
  nhan: number[]
  goiY: boolean
  /** Số nốt KHÁC NHAU thuộc tập được nhận phải đánh để sang hợp âm sau. */
  can: number
  pb: PhanBo
}

export function buocSolo(du: DuLieuSoanCau, vong: VongThay, tonic: number, bac: BacSolo): BuocSolo[] {
  const hop = bac === 1 ? vong.hopAm.slice(0, 1) : bac === 2 ? vong.hopAm.slice(0, 2) : vong.hopAm
  return hop.map((h) => {
    const pb = phanBoNot(du, vong.dieu, vong.thu, h.chat, 'ca')
    const xep = xepNot(pb).filter((m) => m.dem > 0)
    const rels = (bac <= 2 ? xep.slice(0, 3) : xep.filter((m) => m.muc === 'hay')).map((m) => m.rel)
    return {
      hopAm: tenHopAm(tonic, vong.thu, h.goc, h.chat),
      chat: h.chat,
      goc: pc(tonic + h.goc),
      nhan: rels.map((r) => pc(tonic + h.goc + r)),
      goiY: bac <= 2,
      can: Math.min(bac <= 2 ? 3 : 2, rels.length),
      pb,
    }
  })
}

/**
 * Ô đệm của hợp âm thứ `k` trong khung đệm `dungVong` dựng — cắt ra, dời về phách 0. `phach` là SỐ PHÁCH của từng hợp âm (vd
 * [6, 6, 6, 6]), không phải phách bắt đầu — lần đầu đọc nhầm thì ô rỗng, backing im (4/10/2026).
 */
export function oDem(vongDem: Pick<VongBaiTap, 'phach' | 'doDai' | 'timeline'>, k: number) {
  const a = vongDem.phach.slice(0, k).reduce((sum, x) => sum + x, 0)
  const b = Math.min(vongDem.doDai, a + (vongDem.phach[k] ?? vongDem.doDai - a))
  return {
    su: vongDem.timeline
      .filter((e) => e.startBeat >= a - 1e-6 && e.startBeat < b - 1e-6)
      .map((e) => ({ notes: e.notes, startBeat: e.startBeat - a, durationBeats: e.durationBeats, velocity: e.velocity })),
    dai: b - a,
  }
}

/** Hợp âm thứ mấy đang vang ở phách `beat` của backing lặp — `phach` là số phách từng hợp âm, đồng hồ chạy qua nhiều lượt vòng. */
export function hopAmTaiPhach(phach: readonly number[], doDai: number, beat: number): number {
  let t = ((beat % doDai) + doDai) % doDai
  for (const [i, d] of phach.entries()) {
    if (t < d - 1e-6) return i
    t -= d
  }
  return Math.max(0, phach.length - 1)
}

export const khoaSoanCau = (thay: TeacherId, vongId: string) => `soan-cau:${thay}:${vongId}`

/** Bậc mở cao nhất của một vòng — qua bậc trước mới mở bậc sau. */
export function bacMoSolo(luot: readonly LuotTap[], khoa: string): { qua: Set<number>; mo: BacSolo } {
  const qua = new Set(luot.filter((one) => one.styleId === khoa && one.dat).map((one) => one.bac))
  let mo: BacSolo = 1
  while (mo < 3 && qua.has(mo)) mo = (mo + 1) as BacSolo
  return { qua, mo }
}
