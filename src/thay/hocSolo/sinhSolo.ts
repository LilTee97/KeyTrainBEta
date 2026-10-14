import type { TimelineEvent } from '../../reharm/style/types'
import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { nguCanh, type Hop } from '../soanCau/giaiThich'
import { tenBac } from '../soanCau/soanCau'
import { MEO_SOLO } from './chonNot'
import { demBumChat, type BaiChay } from './gamNgon'

/*
  SINH NỐT SOLO — người dùng 11/10/2026: "khi chạy ngón cơ bản hãy tạo thêm tính năng Sinh nốt Solo khi nhập vòng hợp âm (cả vòng sẵn
  có hoặc tự nhập). Dùng bộ soạn để soạn ra những câu ngẫu nhiên và giải thích quy tắc cho tôi biết tại sao lại chọn những nốt đó, có
  điểm chung hay quy luật gì khi soạn nốt solo hãy dạy cho tôi".

  BỘ SOẠN GIA SƯ (Claude) — không phải lối của thầy nào (câu của thầy: chọn nút thầy). Soạn từng nốt bằng LUẬT NÓI RA ĐƯỢC, và ghi luôn
  luật đã chọn nốt ấy — lời giải thích là lý do thật, không phải đọc ngược sau khi soạn. Bộ soạn chung của app (`generateSolo`) không
  ghi lý do từng nốt nên không dùng ở đây.

  Mỗi luật trỏ về một mẹo có số đo của tab Mẹo & quy tắc (`MEO_SOLO` — 13 bản ký âm của các thầy); riêng NHỊP (ô 4/4 đen xen móc đơn,
  câu 2 ô, nghỉ thở cuối câu) là Claude chọn cho dễ tập, chưa đo. Bộ soạn đặt trụ ở phách mạnh 100 % — thầy thật để 17–36 % phách mạnh
  cho nốt màu (số đo ở mẹo "Phách mạnh đặt nốt hợp âm"): đơn giản hoá có chủ ý để người học thấy rõ khung.
*/

export type LuatSinh = 'tru' | 'gam' | 'gamHop' | 'buoc' | 'rai' | 'quay' | 'dinh' | 'tranh' | 'nha' | 'noi' | 'chrom' | 'cam' | 'ket' | 'nhip'
export type VaiSinh = 'mo' | 'tru' | 'noi' | 'dan' | 'duong' | 'rai' | 'tranh' | 'nhay' | 'quay' | 'ket'

const TU_MEO: Readonly<Record<Exclude<LuatSinh, 'nhip' | 'gamHop' | 'chrom'>, string>> = {
  tru: 'Phách mạnh đặt nốt hợp âm, phách nhẹ đi bằng nốt gam',
  gam: 'Giữ MỘT gam cho cả bài',
  buoc: 'Bước nhỏ là chính',
  rai: 'Câu chạy = rải hợp âm xen nốt gam',
  quay: 'Nhảy xa thì quay đầu',
  dinh: 'Lên đỉnh sớm rồi thả xuống',
  tranh: 'Hợp âm trưởng: khung 1 – 3 – 5, màu 9 – 13, tránh bậc 4',
  nha: 'Trên V, đánh luôn nốt nhà',
  noi: 'Câu chạy đáp vào nốt của hợp âm SAU, đúng vạch',
  cam: 'Bài thứ, trên V: dùng nốt cảm',
  ket: 'Kết câu về nốt 1 hoặc 5',
}

/** Luật bộ soạn dùng — lời và cơ sở lấy thẳng từ mẹo có số đo; `nhip` là lựa chọn của Claude. */
export const LUAT_SINH: readonly { id: LuatSinh; ten: string; cau: string; coSo: string; doDuoc: boolean }[] = [
  ...(Object.entries(TU_MEO) as [Exclude<LuatSinh, 'nhip' | 'gamHop' | 'chrom'>, string][]).map(([id, ten]) => {
    const m = MEO_SOLO.find((x) => x.ten === ten)
    return { id, ten, cau: m?.cau ?? '', coSo: m?.coSo ?? '', doDuoc: true }
  }),
  {
    id: 'gamHop',
    ten: 'Gam trên từng hợp âm: giữ gam của bài, chỉnh cho khớp hợp âm đang vang',
    cau: 'Lấy gam của bài; hợp âm nào có nốt ngoài gam thì đổi ĐÚNG nốt cùng tên chữ (bài Đô trưởng, A7 có Đô♯ → đổi Đô thành Đô♯). Đọc gam ấy từ gốc hợp âm ra một "mode": Dm → Rê Dorian, G7 → Sol Mixolydian, F → Fa Lydian, A7 → La Mixolydian ♭13, bài La thứ E7 → Mi Phrygian dominant. Trong gam ấy: nốt hợp âm là TRỤ, nốt cách nốt trụ một bậc là MÀU (9 · 11 · 13), nốt đứng nửa cung trên một nốt trụ là nốt TRÁNH — riêng hợp âm át thì ♭9, ♭13 là màu.',
    coSo: 'Lý thuyết chord-scale — Claude áp, chưa đo riêng trên thầy. Số đo gần nhất: 97,2 % nốt nằm trong gam của bài (13 bản ký âm); Linh Nhi trên V giọng thứ dùng nốt cảm (bậc 7 nâng) và ♭9 có sẵn trong gam 20/22 nốt — đúng phép "đổi nốt cùng tên chữ"; bậc 4 trên hợp âm trưởng thầy chỉ dùng 5–6 %.',
    doDuoc: false,
  },
  {
    id: 'chrom',
    ten: 'Nốt dẫn nửa cung (chromatic) vào hợp âm mới',
    cau: 'Cuối ô, đôi khi lướt một nốt NGOÀI gam đứng sát nốt đích nửa cung, rồi rơi đúng vạch vào nốt của hợp âm mới. Nốt ngoài gam chỉ đứng ở phách nhẹ và đi ngay vào nốt hợp âm — tai nghe nó như một lực kéo, không phải nốt sai.',
    coSo: 'Ba sheet Blues — trong các câu chạy xuyên vạch đổi hợp âm, nốt cuối trước vạch là nốt dẫn nửa cung: Ray 12 % (41 câu) · Rising Sun 17 % (12) · Robert 20 % (25). Cà Pháo 4,7 % nốt ngoài gam (n=828). Tần suất 0,25 trong bộ soạn là Claude chọn.',
    doDuoc: true,
  },
  {
    id: 'nhip',
    ten: 'Nhịp và hơi câu: câu 2 ô, đen xen móc đơn, nghỉ thở cuối câu',
    cau: 'Mỗi ô 4 phách: phách 1 và 3 luôn có nốt (trụ), giữa là nốt đen hay móc đơn; hết 2 ô thì dừng một nốt dài rồi nghỉ nửa phách — như người hát lấy hơi.',
    coSo: 'Claude chọn cho dễ tập — chưa đo trên bản ký âm.',
    doDuoc: false,
  },
]

export interface NotSinh {
  m: number
  /** Phách tính từ đầu vòng. */
  t: number
  d: number
  /** Ô (hợp âm) thứ mấy. */
  o: number
  /** Câu thứ mấy. */
  cau: number
  vai: VaiSinh
  ly: string
  luat: LuatSinh[]
  /** Tên nốt (ký hiệu chữ, như bàn phím) và phách trong ô — để hiện. */
  ten: string
  phach: string
}

export interface CauSinh {
  bai: BaiChay
  not: NotSinh[]
  hopO: string[]
  /** Gam trên từng hợp âm (cùng thứ tự với `hopO`). */
  gamO: GamHop[]
  /** Số đo của chính câu này — để so với số đo các thầy. */
  soDo: { n: number; notHop: number; phachManh: number; phachManhHop: number; buoc: number; lapLien: number; duoi4: number; nhay: number; quay: number; soCau: number; ketDong: number }
}

const pc = (x: number) => ((x % 12) + 12) % 12
const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
const GAM_THU = [0, 2, 3, 5, 7, 8, 10]
const CHU = 'CDEFGAB'
const TU_NHIEN = [0, 2, 4, 5, 7, 9, 11]
/** Quãng (nửa cung, kể cả nốt căng ≥ 12) → số chữ đếm từ gốc: 3 trưởng/thứ → 2 chữ, ♭5/5/♯5 → 4, 9 → 1, 11 → 3, 13 → 5. */
const BUOC_CHU: Readonly<Record<number, number>> = { 0: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 9: 5, 10: 6, 11: 6, 13: 1, 14: 1, 15: 1, 17: 3, 18: 3, 20: 5, 21: 5 }
const TEN_MODE: Readonly<Record<string, string>> = {
  '0,2,4,5,7,9,11': 'Ionian (gam trưởng)',
  '0,2,3,5,7,9,10': 'Dorian (thứ, 6 trưởng)',
  '0,1,3,5,7,8,10': 'Phrygian (thứ, ♭2)',
  '0,2,4,6,7,9,11': 'Lydian (trưởng, ♯4)',
  '0,2,4,5,7,9,10': 'Mixolydian (trưởng, ♭7)',
  '0,2,3,5,7,8,10': 'Aeolian (thứ tự nhiên)',
  '0,1,3,5,6,8,10': 'Locrian',
  '0,2,3,5,7,8,11': 'thứ hòa thanh',
  '0,1,4,5,7,8,10': 'Phrygian dominant (thứ hòa thanh đọc từ bậc 5)',
  '0,2,4,5,7,8,10': 'Mixolydian ♭13',
  '0,2,4,6,7,9,10': 'Lydian dominant',
  '0,2,3,5,7,9,11': 'thứ giai điệu',
  '0,2,3,6,7,9,10': 'Dorian ♯4',
  '0,2,3,5,6,8,10': 'Locrian ♮2',
  '0,2,4,5,7,8,11': 'trưởng hòa thanh',
  '0,1,3,4,6,8,10': 'altered (siêu Locrian)',
}
const tenChuPc = (chu: number, p: number) => {
  const lech = ((((p - TU_NHIEN[chu]!) % 12) + 18) % 12) - 6
  return CHU[chu]! + (lech < 0 ? '♭'.repeat(-lech) : '♯'.repeat(lech))
}

/** Gam trên một hợp âm — xem luật `gamHop`. */
export interface GamHop {
  hop: string
  /** Tên gam đọc từ gốc hợp âm, vd "D Dorian (thứ, 6 trưởng)". */
  ten: string
  /** Bảy nốt gam (lớp cao độ) từ gốc hợp âm đi lên, kèm tên chữ và vai. */
  not: { p: number; ten: string; vai: 'tru' | 'mau' | 'tranh' }[]
  /** Nốt đã đổi so với gam của bài, vd "C → C♯ (bậc 3 của A7)". */
  doi: string[]
  pcs: number[]
  tru: number[]
  tranh: number[]
}

/**
 * Gam trên hợp âm `x` (gốc tính từ chủ âm) trong giọng `tonic` / `thu`: gam của bài theo chữ (bảy chữ từ chữ chủ âm), nốt hợp âm thay
 * đúng nốt cùng chữ (A7 trong Đô trưởng: Đô → Đô♯). Nốt tránh = nốt gam đứng nửa cung trên một nốt hợp âm; hợp âm át (3 trưởng + ♭7)
 * thì ♭9, ♭13 là màu (nốt căng biến âm), chỉ bậc 4 là tránh.
 */
export function gamTrenHop(tonic: number, thu: boolean, x: Hop): GamHop {
  const { h } = nguCanh(tonic, thu)
  const q = findQualityBySymbol(x.chat) ?? findQualityBySymbol('')!
  const goc = pc(tonic + x.goc)
  const chuChu = CHU.indexOf(h(0, '')[0] ?? 'C')
  const gamBai = thu ? GAM_THU : GAM_TRUONG
  const gamGoc = new Map<number, number>()
  gamBai.forEach((d, k) => gamGoc.set((chuChu + k) % 7, pc(tonic + d)))
  /*
    Chữ của gốc hợp âm: theo tên app gọi (như cũ); tên ấy làm gam ra nốt trùng thì lấy chữ của gam — chữ mang đúng nốt gốc, rồi chữ ngay dưới
    (nốt nâng: cảm âm B♯ của Đô♯ thứ), rồi chữ ngay trên. Bản cũ chỉ theo tên: app gọi giọng Rê♯ thứ, Fa♯ trưởng bằng dấu thăng mà gọi gốc
    E♯ là "F", B♯ là "C" — 6/216 gam hợp âm diatonic (12 giọng × trưởng / thứ) ra nốt trùng, vd Fm7♭5 ở Rê♯ thứ: F G♯ A♭ B C♭ D♯ E♭.
  */
  const dung = (chuGoc: number) => {
    const theoChu = new Map(gamGoc)
    const doi: string[] = []
    const tru: number[] = []
    for (const iv of q.intervals) {
      const buoc = x.chat === 'dim7' && iv === 9 ? 6 : BUOC_CHU[iv]
      const p = pc(goc + iv)
      tru.push(p)
      if (buoc === undefined) continue
      const chu = (chuGoc + buoc) % 7
      const cu = theoChu.get(chu)!
      if (cu !== p) {
        doi.push(`${tenChuPc(chu, cu)} → ${tenChuPc(chu, p)} (bậc ${tenBac(pc(p - goc), x.chat)} của ${h(x.goc, x.chat, x.bass)})`)
        theoChu.set(chu, p)
      }
    }
    return { chuGoc, theoChu, doi, tru, du: new Set(theoChu.values()).size === 7 }
  }
  const chuCua = (p: number) => [...gamGoc].find(([, v]) => v === p)?.[0]
  const ung = [CHU.indexOf(h(x.goc, '')[0] ?? 'C'), chuCua(goc), chuCua(pc(goc - 1)), chuCua(pc(goc + 1))].filter((c): c is number => c !== undefined && c >= 0)
  const thu7 = ung.map(dung)
  const { chuGoc, theoChu, doi, tru } = thu7.find((r) => r.du) ?? thu7[0]!
  const at = q.intervals.includes(4) && q.intervals.includes(10)
  const mien = at ? [pc(goc + 1), pc(goc + 8)] : []
  const thuTu = Array.from({ length: 7 }, (_, k) => (chuGoc + k) % 7)
  const pcs = thuTu.map((c) => theoChu.get(c)!)
  const tranh = pcs.filter((p) => !tru.includes(p) && tru.includes(pc(p - 1)) && !mien.includes(p))
  const tenGoc = tenChuPc(chuGoc, goc)
  const khoa = [...new Set(pcs.map((p) => pc(p - goc)))].sort((a, c) => a - c).join(',')
  return {
    hop: h(x.goc, x.chat, x.bass),
    ten: `${tenGoc} ${TEN_MODE[khoa] ?? 'gam bài đã chỉnh cho khớp hợp âm'}`,
    not: thuTu.map((c, k) => ({ p: pcs[k]!, ten: tenChuPc(c, pcs[k]!), vai: tru.includes(pcs[k]!) ? 'tru' : tranh.includes(pcs[k]!) ? 'tranh' : 'mau' })),
    doi,
    pcs,
    tru,
    tranh,
  }
}
/** Tầm câu C4–C6 — Claude chọn, như tầm câu solo của app (62–84). */
const SAN = 60
const TRAN = 84
/** Ô giữa câu: phách trong ô 4/4 (Claude chọn — đen xen móc đơn; phách 1 và 3 luôn có nốt). */
const O_GIUA: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [0, 1, 1.5, 2, 3],
  [0, 0.5, 1, 2, 3],
  [0, 1, 2, 2.5, 3, 3.5],
  [0, 0.5, 1, 1.5, 2, 3],
  [0, 1, 1.5, 2, 2.5, 3],
]
/** Ô cuối câu: nốt kết ở phách 3, ngân 1,5 phách rồi nghỉ nửa phách để thở. */
const O_CUOI: readonly (readonly number[])[] = [
  [0, 1, 2],
  [0, 0.5, 1, 2],
  [0, 1, 1.5, 2],
]
const KET_NGAN = 1.5
/*
  Xác suất ở một phách nhẹ — Claude chọn, chỉnh theo số đo bước đi của 13 bản ký âm (lặp + liền bậc 45 %, ≤ 4 nửa cung 66 %): NHẢY ≥ 5
  nửa cung 0,2 · RẢI quãng 3 sang nốt hợp âm kế 0,3, còn lại đi liền bậc. Bản đầu (chỉ nhảy 0,15, không rải) ra liền bậc 81,8 % · ≤ 4
  nửa cung 92,1 % trên 66 câu — mượt hơn thầy nhiều, nghe như tập gam. Lùi nếu câu nhảy loạn.
*/
const XAC_SUAT_NHAY = 0.2
const XAC_SUAT_RAI = 0.3
/** Nốt dẫn nửa cung ngoài gam ở chỗ đổi hợp âm — Claude chọn 0,25 (ba sheet Blues: 12–20 % câu chạy xuyên vạch). Lùi nếu câu nghe phô. */
const XAC_SUAT_NUA_CUNG = 0.25

/** Rải đều tất định (mulberry32) — cùng câu số thì ra cùng một câu. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const bam = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return h >>> 0
}
const PHACH = ['1', '1 rưỡi', '2', '2 rưỡi', '3', '3 rưỡi', '4', '4 rưỡi']
const QUANG: Readonly<Record<number, string>> = { 5: 'quãng 4', 6: 'quãng 4 tăng', 7: 'quãng 5', 8: 'quãng 6 thứ', 9: 'quãng 6' }

/**
 * Một câu solo trên vòng `hop` (gốc tính từ chủ âm, mỗi hợp âm một ô 4 phách), kèm lý do từng nốt. `seed` = câu số mấy — bấm "Sinh câu
 * mới" thì tăng. Tay trái máy đệm "bùm – chát" như chạy ngón cơ bản.
 */
export function sinhSolo(hop: readonly Hop[], tonic: number, thu: boolean, seed: number, id: string): CauSinh | null {
  if (hop.length === 0) return null
  const { h } = nguCanh(tonic, thu)
  const r = rng(bam(id) ^ Math.imul(seed + 1, 2654435761))
  const gamO = hop.map((x) => gamTrenHop(tonic, thu, x))
  const hopAm = hop.map((x, i) => ({
    ten: h(x.goc, x.chat, x.bass),
    goc: pc(tonic + x.goc),
    chat: x.chat,
    pcs: gamO[i]!.tru,
    gam: gamO[i]!.pcs,
    tenGam: gamO[i]!.ten.replace(/ \(.*\)$/, ''),
    tranh: gamO[i]!.tranh,
  }))
  /* Tên nốt (ký hiệu chữ + quãng tám) theo GAM CỦA HỢP ÂM ô đang soạn — bậc 3 của A7 là C♯5, không phải D♭5 theo dấu của giọng. Nốt
     ngoài gam ấy (nốt dẫn nửa cung): đi lên ghi thăng, đi xuống ghi giáng. */
  let oTen = 0
  const ten = (m: number, o: number = oTen, len?: boolean) => {
    const g = gamO[o]!
    const k = g.pcs.indexOf(pc(m))
    if (k >= 0) {
      const t = g.not[k]!.ten
      const chu = CHU.indexOf(t[0]!)
      const lech = ((((m - TU_NHIEN[chu]!) % 12) + 18) % 12) - 6
      return `${t}${Math.floor((m - lech) / 12) - 1}`
    }
    const t = len === undefined ? h(pc(m - tonic), '') : pitchClassName(pc(m) as never, len ? 'sharp' : 'flat').replace('#', '♯').replace(/(?<=[A-G])b/, '♭')
    return `${t}${Math.floor(m / 12) - 1}`
  }
  const tam = Array.from({ length: TRAN - SAN + 1 }, (_, k) => SAN + k)
  const notHop = (o: number) => tam.filter((m) => hopAm[o]!.pcs.includes(pc(m)))
  const bac = (m: number, o: number) => tenBac(pc(m - hopAm[o]!.goc), hopAm[o]!.chat)
  const trongGam = (m: number, o: number) => hopAm[o]!.gam.includes(pc(m))
  /** Nốt trong `ds` gần `tu + huong·2` nhất, ưu tiên nốt đi đúng hướng trong vòng 5 nửa cung. */
  const gan = (ds: readonly number[], tu: number, huong: number) => {
    const dung = ds.filter((m) => (m - tu) * huong > 0 && Math.abs(m - tu) <= 5)
    const kho = dung.length ? dung : ds
    const dich = tu + huong * 2
    return kho.reduce((a, c) => (Math.abs(c - dich) < Math.abs(a - dich) ? c : a))
  }
  /** Một bậc gam (1–3 nửa cung — gam thứ hòa thanh có bước 3) theo hướng; chạm mép tầm thì đổi hướng. */
  const buocGam = (tu: number, huong: number, o: number): number => {
    for (const hg of [huong, -huong]) {
      for (let k = 1; k <= 3; k += 1) {
        const m = tu + hg * k
        if (m >= SAN && m <= TRAN && trongGam(m, o)) return m
      }
    }
    return tu
  }

  // Chia câu: 2 ô một câu; vòng lẻ ô thì câu cuối 3 ô (vòng 1 ô: một câu 1 ô).
  const cau: number[][] = []
  for (let o = 0; o < hop.length; ) {
    const dai = hop.length - o === 3 ? 3 : Math.min(2, hop.length - o)
    cau.push(Array.from({ length: dai }, (_, k) => o + k))
    o += dai
  }

  const out: NotSinh[] = []
  let truoc: number | null = null
  /** Ô của nốt trước — gọi tên nốt trước theo gam của chính ô ấy. */
  let truocO = 0
  for (const [ci, oCau] of cau.entries()) {
    const on = oCau.flatMap((o, k) => (k === oCau.length - 1 ? O_CUOI : O_GIUA)[Math.floor(r() * (k === oCau.length - 1 ? O_CUOI : O_GIUA).length)]!.map((t) => ({ o, t })))
    const dinh = Math.max(1, Math.floor(on.length * (0.3 + r() * 0.15)))
    const cuoiVong = ci === cau.length - 1
    let datTruoc: number | null = null
    let vuaNhay = 0
    let diTiep = 0
    for (const [j, { o, t }] of on.entries()) {
      const hp = hopAm[o]!
      oTen = o
      const sau = on[j + 1]
      const cuoi = j === on.length - 1
      const manh = t === 0 || t === 2
      const ph = PHACH[t * 2] ?? String(t + 1)
      let huong = j <= dinh ? 1 : -1
      if (diTiep) huong = diTiep
      // Nhảy xa thì quay đầu — ở MỌI loại nốt kế tiếp, không riêng phách nhẹ (bản đầu chỉ ép ở phách nhẹ: quay đầu 26/82 cú nhảy).
      if (vuaNhay) huong = -vuaNhay
      let m: number
      let vai: VaiSinh
      let luat: LuatSinh[]
      let ly: string
      if (j === 0) {
        const tamCau = truoc === null ? 67 + Math.floor(r() * 5) : truoc + 2
        m = notHop(o).reduce((a, c) => (Math.abs(c - tamCau) < Math.abs(a - tamCau) ? c : a))
        vai = 'mo'
        luat = ['tru', 'dinh']
        ly = `${truoc === null ? 'Mở câu' : 'Câu mới (sau chỗ thở)'} ở phách 1 bằng TRỤ: ${ten(m)} là bậc ${bac(m, o)} của ${hp.ten} — nốt của hợp âm${truoc === null ? ', đặt giữa tầm tay để câu còn chỗ đi lên' : `, gần ${ten(truoc, truocO)} nơi câu trước dừng`}. Câu sẽ đi lên tới đỉnh rồi thả xuống.`
      } else if (cuoi) {
        const muon = cuoiVong ? [0] : [7, 4, 3]
        let ds = notHop(o).filter((x) => muon.includes(pc(x - hp.goc)))
        if (!ds.length) ds = notHop(o).filter((x) => [0, 7].includes(pc(x - hp.goc)))
        if (!ds.length) ds = notHop(o)
        m = gan(ds, truoc!, vuaNhay ? huong : -1)
        const b = bac(m, o)
        vai = 'ket'
        luat = ['ket', 'nhip']
        ly = cuoiVong
          ? `Cuối vòng — dừng trên ${ten(m)}, ${b === '1' ? 'gốc' : `bậc ${b}`} của ${hp.ten}: ${hp.goc === pc(tonic) ? 'câu "đóng" về nhà' : 'câu đứng vững trên hợp âm cuối, rồi vòng quay lại đầu'}. Ngân ${String(KET_NGAN).replace('.', ',')} phách rồi nghỉ nửa phách.`
          : `Hết câu — dừng trên ${ten(m)}, bậc ${b} của ${hp.ten}: ${b === '5' ? 'dừng ở bậc 5 thì câu "treo", chờ câu sau' : b === '1' ? 'dừng ở gốc thì câu "đóng"' : 'dừng ở bậc 3 thì câu "lửng", chờ câu sau trả lời'}. Ngân rồi nghỉ nửa phách để thở.`
      } else if (t === 0 && datTruoc !== null) {
        m = datTruoc
        vai = 'noi'
        luat = ['noi', 'tru']
        ly = `Phách 1 ô mới — rơi ĐÚNG VẠCH vào ${ten(m)}, bậc ${bac(m, o)} của ${hp.ten} (hợp âm vừa đổi): câu nối liền sang hợp âm mới.`
      } else if (manh) {
        m = gan(notHop(o), truoc!, huong)
        vai = 'tru'
        luat = ['tru', 'buoc']
        ly = `Phách ${ph} là phách mạnh — đặt TRỤ: ${ten(m)} là bậc ${bac(m, o)} của ${hp.ten}. Chọn nốt hợp âm gần ${ten(truoc!, truocO)} nhất, đi ${m === truoc ? 'tại chỗ' : m > truoc! ? 'lên' : 'xuống'}.`
      } else if (vuaNhay) {
        m = buocGam(truoc!, -vuaNhay, o)
        vai = 'quay'
        luat = ['quay', 'gam']
        ly = `Vừa nhảy xa nên QUAY ĐẦU: đi liền bậc ${m > truoc! ? 'lên' : 'xuống'} về ${ten(m)}, nốt trong gam ${hp.tenGam}.`
      } else if (sau && sau.o !== o && sau.t === 0) {
        const oSau = sau.o
        let dan: number
        let dich: number
        let nuaCung = false
        if (diTiep) {
          // Ngay sau nốt tránh: đi tiếp cùng hướng trước, rồi mới chọn đích cho ô sau.
          dan = buocGam(truoc!, diTiep, o)
          dich = gan(notHop(oSau), dan, diTiep)
        } else {
          dich = gan(notHop(oSau), truoc!, huong)
          const nc = dich + (dich > truoc! ? -1 : 1)
          nuaCung = r() < XAC_SUAT_NUA_CUNG && nc !== truoc && nc >= SAN && nc <= TRAN && Math.abs(nc - truoc!) <= 4 && !trongGam(nc, o) && !hp.pcs.includes(pc(nc))
          dan = nuaCung ? nc : buocGam(dich, dich > truoc! ? -1 : 1, o)
          if (!nuaCung && (dan === dich || dan === truoc || Math.abs(dan - truoc!) > 4)) dan = buocGam(truoc!, Math.sign(dich - truoc!) || huong, o)
          // Nốt trước đã sát đích (bước tới là trúng đích): vòng qua phía bên kia đích rồi rơi về — nốt dẫn không được trùng đích.
          if (!nuaCung && dan === dich) dan = buocGam(dich, dich >= truoc! ? 1 : -1, o)
        }
        m = dan
        if (dich !== dan && Math.abs(dich - dan) <= 3) {
          datTruoc = dich
          vai = 'dan'
          luat = nuaCung ? ['noi', 'chrom'] : ['noi', 'gam']
          ly = nuaCung
            ? `Nốt DẪN NỬA CUNG (chromatic) cuối ô — ${ten(m, o, dich > m)} KHÔNG có trong gam ${hp.tenGam}: chỉ lướt nửa cung vào ${ten(dich, oSau)}, ô sau rơi đúng vạch vào ${ten(dich, oSau)} (bậc ${bac(dich, oSau)} của ${hopAm[oSau]!.ten}). Nốt ngoài gam đứng phách nhẹ và đi ngay vào nốt hợp âm thì tai nghe là lực kéo, không phải nốt sai.`
            : `Nốt DẪN cuối ô — ${ten(m)} (trong gam ${hp.tenGam}) đứng sát ${ten(dich, oSau)}; ô sau sẽ rơi đúng vạch vào ${ten(dich, oSau)}, bậc ${bac(dich, oSau)} của ${hopAm[oSau]!.ten}.`
        } else {
          // Không có nốt hợp âm mới nào sát nốt này (cách 1–3 nửa cung): không gọi là nốt dẫn — chỉ là nốt đi qua, ô sau chọn trụ như thường.
          vai = 'duong'
          luat = ['gam', 'buoc']
          ly = `Phách ${ph} (nhẹ) — MẶT CẦU: đi liền bậc ${m > truoc! ? 'lên' : 'xuống'} tới ${ten(m)}, nốt trong gam ${hp.tenGam} (bậc ${bac(m, o)} của ${hp.ten}).`
        }
      } else {
        const xs = r()
        const nhay = xs < XAC_SUAT_NHAY && j < on.length - 2 ? notHop(o).filter((x) => (x - truoc!) * huong >= 5 && Math.abs(x - truoc!) <= 9) : []
        const rai = xs >= XAC_SUAT_NHAY && xs < XAC_SUAT_NHAY + XAC_SUAT_RAI ? notHop(o).filter((x) => (x - truoc!) * huong >= 3 && Math.abs(x - truoc!) <= 4) : []
        if (rai.length) {
          m = rai[0]!
          vai = 'rai'
          luat = ['rai']
          ly = `Phách ${ph} (nhẹ) — RẢI: bước quãng 3 ${m > truoc! ? 'lên' : 'xuống'} sang ${ten(m)}, nốt hợp âm kế (bậc ${bac(m, o)} của ${hp.ten}). Câu chạy hay xen nốt rải hợp âm với nốt gam.`
        } else if (nhay.length) {
          m = nhay[Math.floor(r() * nhay.length)]!
          vai = 'nhay'
          luat = ['tru', 'quay']
          ly = `NHẢY ${QUANG[Math.abs(m - truoc!)] ?? `${Math.abs(m - truoc!)} nửa cung`} ${m > truoc! ? 'lên' : 'xuống'} tới ${ten(m)} — vẫn là nốt hợp âm (bậc ${bac(m, o)} của ${hp.ten}) — cho câu một điểm nhấn; nốt sau sẽ quay đầu.`
        } else {
          m = buocGam(truoc!, huong, o)
          // Nốt tránh chỉ lướt khi còn đi tiếp được cùng hướng trong tầm — sát mép tầm thì đi phía kia (lời hứa "nốt sau đi tiếp" phải đúng).
          if (hp.tranh.includes(pc(m)) && (j + 1 >= on.length - 1 || buocGam(m, Math.sign(m - truoc!), o) * Math.sign(m - truoc!) <= m * Math.sign(m - truoc!))) m = buocGam(truoc!, -huong, o)
          const b = bac(m, o)
          const len = m > truoc! ? 'lên' : 'xuống'
          if (hp.tranh.includes(pc(m))) {
            vai = 'tranh'
            luat = ['tranh', 'gam']
            ly = `Phách ${ph} (nhẹ) — ${ten(m)} là bậc ${b} của ${hp.ten}: nốt TRÁNH, đứng sát trên một nốt khung nửa cung. Chỉ LƯỚT qua ở phách nhẹ, không ngân.`
          } else if (hp.pcs.includes(pc(m))) {
            vai = 'duong'
            luat = ['gam', 'buoc']
            ly = `Phách ${ph} (nhẹ) — đi liền bậc ${len} tới ${ten(m)}: nốt trong gam ${hp.tenGam}, cũng là bậc ${b} của ${hp.ten}.`
          } else {
            vai = 'duong'
            luat = ['gam', 'buoc']
            ly = `Phách ${ph} (nhẹ) — MẶT CẦU: đi liền bậc ${len} tới ${ten(m)}, nốt trong gam ${hp.tenGam} (bậc ${b} của ${hp.ten} — nốt MÀU, đi qua).`
          }
        }
      }
      if (vuaNhay && vai !== 'quay' && Math.sign(m - truoc!) === huong) {
        luat = [...luat, 'quay']
        ly += ' (Vừa nhảy xa nên nốt này đi ngược lại.)'
      }
      if (j === dinh && m > truoc!) {
        luat = [...luat, 'dinh']
        ly += ' Đây là ĐỈNH câu — từ đây câu thả xuống.'
      }
      if (thu && pc(m - tonic) === 11) {
        luat = [...luat, 'cam']
        ly += ` Bài thứ, trên ${hp.ten}: dùng nốt cảm ${ten(m)} (bậc 7 nâng nửa cung) — nó kéo về ${h(0, '')}.`
      }
      const tAt = o * 4 + t
      const tSau = sau ? sau.o * 4 + sau.t : tAt + KET_NGAN
      const tenM = luat.includes('chrom') && datTruoc !== null ? ten(m, o, datTruoc > m) : ten(m, o)
      out.push({ m, t: tAt, d: cuoi ? KET_NGAN : Math.min(tSau, (o + 1) * 4) - tAt, o, cau: ci, vai, ly, luat, ten: tenM, phach: ph })
      vuaNhay = truoc !== null && j > 0 && Math.abs(m - truoc) >= 5 ? Math.sign(m - truoc) : 0
      diTiep = vai === 'tranh' ? Math.sign(m - truoc!) : 0
      if (vai === 'noi') datTruoc = null
      truoc = m
      truocO = o
    }
  }

  // Số đo của chính câu này.
  /* Nốt tránh: nói nốt sau đã làm gì — viết SAU khi soạn xong cả câu, để lời luôn đúng (lúc chọn nốt chưa biết nốt sau). Hai đường:
     đi tiếp cùng hướng, hay đánh lại chính nốt ấy vì nó là nốt của hợp âm sau (vào hợp âm mới sớm — trên V thường là nốt nhà). */
  out.forEach((x, i) => {
    const truocX = out[i - 1]
    const sauX = out[i + 1]
    if (x.vai !== 'tranh' || !truocX || !sauX || sauX.cau !== x.cau) return
    if (Math.sign(sauX.m - x.m) === Math.sign(x.m - truocX.m)) {
      x.ly += ` Nốt sau đi tiếp ${sauX.m > x.m ? 'lên' : 'xuống'} tới ${sauX.ten}.`
    } else if (sauX.m === x.m && sauX.o !== x.o && hopAm[sauX.o]!.pcs.includes(pc(x.m))) {
      const nha = pc(x.m) === pc(tonic)
      x.ly += ` Nốt sau đánh lại ${x.ten}: nó là bậc ${bac(x.m, sauX.o)} của ${hopAm[sauX.o]!.ten} — câu vào hợp âm mới sớm nửa phách${nha ? `, và ${x.ten} là nốt nhà (chủ âm)` : ''}.`
      if (nha) x.luat = [...x.luat, 'nha']
    }
  })

  // Bước tính trong từng câu (không nối qua chỗ thở); cú nhảy chỉ đếm khi trong câu còn nốt sau để quay đầu.
  const buocCau = cau.map((_, ci) => {
    const ns = out.filter((x) => x.cau === ci)
    return ns.slice(1).map((x, k) => x.m - ns[k]!.m)
  })
  const buoc = buocCau.flat()
  const nhayCo = buocCau.flatMap((bs) => bs.flatMap((d, k) => (Math.abs(d) >= 5 && bs[k + 1] !== undefined ? [Math.sign(bs[k + 1]!) === -Math.sign(d)] : [])))
  const quay = nhayCo.filter(Boolean).length
  const laHop = (x: NotSinh) => hopAm[x.o]!.pcs.includes(pc(x.m))
  const manh = out.filter((x) => x.t % 2 === 0)
  const ketCau = cau.map((_, ci) => out.filter((x) => x.cau === ci).at(-1)).filter((x): x is NotSinh => !!x)
  const tenHop = hopAm.map((x) => x.ten)
  const phai: TimelineEvent[] = out.map((x) => ({
    notes: [x.m],
    startBeat: x.t,
    durationBeats: x.d * 0.95,
    hand: 'right',
    velocity: x.t % 2 === 0 ? 88 : 76,
  }))
  return {
    bai: {
      id: `sinh-${id}-${pc(tonic)}-${thu ? 'thu' : 'truong'}-${seed}`,
      ten: `Sinh nốt Solo · ${tenHop.join(' – ')}`,
      tay: 'right',
      timeline: [...demBumChat(hop, tonic), ...phai].sort((a, c) => a.startBeat - c.startBeat),
      perBeat: tenHop.flatMap((x) => [x, x, x, x]),
      voicings: tenHop.map((symbol) => ({ left: [], right: [], symbol })),
      beatsPerChord: 4,
    },
    not: out,
    hopO: tenHop,
    gamO,
    soDo: {
      n: out.length,
      notHop: out.filter(laHop).length,
      phachManh: manh.length,
      phachManhHop: manh.filter(laHop).length,
      buoc: buoc.length,
      lapLien: buoc.filter((d) => Math.abs(d) <= 2).length,
      duoi4: buoc.filter((d) => Math.abs(d) <= 4).length,
      nhay: nhayCo.length,
      quay,
      soCau: ketCau.length,
      ketDong: ketCau.filter((x) => [0, 7].includes(pc(x.m - hopAm[x.o]!.goc))).length,
    },
  }
}
