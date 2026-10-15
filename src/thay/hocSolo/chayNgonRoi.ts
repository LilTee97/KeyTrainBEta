import { chongCongThuc, gocDep } from '../soanCau/chongHopAm'
import { kieuGoc } from '../soanCau/meoChong'
import { docHop } from '../soanCau/thayTrongVong'
import type { CauRoi } from '../useMuaRoi'
import { GOC } from '../vongThay'
import { chongDuoi, congThucCua, khungCua, khungLoai, LOAI_KHUNG, mucCua, NHOM_KHUNG, notCua, tenPhim, type Khung, type NotKhung } from './khungNot'
import { chonNang } from './mauKhung'

/*
  GAME CHẠY NGÓN — hai phần làm thành game rơi như Game công thức. Người dùng 15/10/2026: "sao game chạy ngón ko làm giống game nốt rơi
  luôn. Hãy thiết kế cả 2 phần của game chạy ngón giống kiểu game nốt rơi. Hãy làm thử thành nút để tới khi nào tôi duyệt đạt rồi mới xóa
  nút cũ". Duyệt đạt cùng ngày — thay hẳn bản không rơi (GameKhungNot.tsx, đã xoá).

  Phần 1 · làm quen loại hợp âm — tên hợp âm rơi; ba cách chơi lấy từ ba việc "Tự đánh" của bản cũ:
  - Nốt chính: bấm đủ nốt CHÍNH của khung (nốt hợp âm, kể cả nốt màu có trong tên). Ở cách này nốt phụ là sai — đi qua được khi chạy
    câu, nhưng không phải nốt chính; nốt không màu là sai.
  - Chạy câu: chạy liền từ 5 nốt trong khung, không đụng nốt không màu, dừng ở nốt chính (nốt ngân).
  - Chồng hai tay: giữ cùng lúc bass gốc thấp nhất + đủ nốt hợp âm (bỏ được 5; hợp âm 13 bỏ được 9), không nốt không màu.
  Phần 2 · solo trên vòng — nền chạy, tên hợp âm rơi khớp lúc đổi hợp âm; chấm phách 1 của mỗi ô: nốt giai điệu vào ô phải là nốt chính.
  Cơ sở: nốt giai điệu của SSA là nốt hợp âm hay nốt căng có trong tên ở 238/241 nốt (3 clip; nhãn do chính SSA ghi nên khớp sẵn phần
  nào). Luật "phách 1 là nốt chính", 5 nốt một câu, cụm 0,15 phách là của Claude — chưa đo trên tay người dùng.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export type CachChay = 'chinh' | 'cau' | 'chong'
export const SO_NOT_CAU = 5

/** Màn phần 1: mỗi nhóm đuôi một màn (như hàng nút của bản cũ), thêm màn trộn. */
export const MAN_NGON: readonly { ten: string; loai: readonly string[] }[] = [
  ...NHOM_KHUNG.map((ten) => ({ ten, loai: LOAI_KHUNG.filter((l) => l.nhom === ten).map((l) => l.id) })),
  { ten: 'Trộn tất cả', loai: LOAI_KHUNG.map((l) => l.id) },
]

export interface CauNgon extends CauRoi {
  g: number
  k: Khung
  /** Phím hé lộ dần bên luyện: nốt chính từ gốc đi lên, hay thế chồng hai tay. */
  lo: number[]
}

const ngan = (gam: string) => gam.replace(/ \(.*\)$/, '')
const tenDs = (ns: readonly NotKhung[]) => ns.map((n) => n.ten).join(' ')
const bo8 = (ten: string) => ten.replace(/-?\d+$/, '')

/** "chính C E G B · phụ D A · đừng ngân F" — vai các nốt của khung. */
export function vaiKhung(k: Khung): string {
  const theo = (muc: string) => k.not.filter((n) => n.muc === muc)
  const khong = theo('khong')
  return `chính ${tenDs(theo('chinh'))} · phụ ${tenDs(theo('phu')) || '—'}${khong.length ? ` · đừng ngân ${tenDs(khong)}` : ''}`
}

/** Thế chồng hai tay: công thức chồng của loại (Cmaj7 = C + Em); loại app chưa có công thức thì gốc + nốt chính dưới nốt đỉnh nên chọn. */
export function chongSsa(k: Khung): { trai: number[]; phai: number[]; ten: string } {
  const ct = congThucCua(k.loai)
  if (ct) {
    const c = chongCongThuc(ct, k.goc, GOC[k.goc]!, kieuGoc(k.goc))
    return { trai: c.trai, phai: c.phai, ten: `${c.nhan.trai} + ${c.nhan.phai}` }
  }
  const p = pc(k.goc + (k.dinh[0] ?? 0))
  const phai = chongDuoi(k, 72 + p - (p > 7 ? 12 : 0))
  // Bass quãng tám 2: tay phải có thể xuống tới La 3 (Bmaj13: đỉnh G♯4, chồng xuống A♯3) — bass Si 3 thì không còn là nốt thấp nhất.
  return { trai: [36 + k.goc], phai, ten:`${gocDep(GOC[k.goc]!)} + ${phai.map((m) => bo8(tenPhim(k, m))).join('–')}` }
}

export function taoCauNgon(mi: number, id: string, g: number, cach: CachChay): CauNgon {
  const k = khungLoai(LOAI_KHUNG.find((l) => l.id === id)!, g)
  const chinh = k.not.filter((n) => n.muc === 'chinh')
  const khong = k.not.filter((n) => n.muc === 'khong')
  const vai = vaiKhung(k)
  const dinh = k.dinh
    .slice(0, 2)
    .map((iv) => k.not.find((n) => n.iv === iv)!)
    .map((n) => `${n.ten} (${n.bac})`)
    .join(' · ')
  const lenChinh = chinh.map((n) => 60 + g + pc(n.p - g)).sort((a, b) => a - b)
  const chung = { id: `${mi}:${id}`, ten: k.ten, g, k, khungTen: `khung ${ngan(k.gam)}`, meo: `Khung ${k.gam}: ${vai}.` }
  if (cach === 'chong') {
    const s = chongSsa(k)
    return {
      ...chung,
      khungTen: s.ten,
      goiY: `đỉnh ${dinh}`,
      lo: [...s.trai, ...s.phai],
      loi: `${k.ten} = ${s.ten}. Giữ hợp âm, đổi nốt đỉnh trong khung: ${dinh}.`,
      meo: `${k.ten} = ${s.ten}, bass ${gocDep(GOC[g]!)} thấp nhất. ${chung.meo}`,
    }
  }
  if (cach === 'cau')
    return { ...chung, goiY: khong.length ? `tránh ${tenDs(khong)} · dừng ở nốt chính` : 'dừng ở nốt chính', lo: lenChinh, loi: `${k.ten} — ${vai}.` }
  return { ...chung, goiY: `${chinh.length} nốt chính`, lo: lenChinh, loi: `${k.ten} — ${vai}. Nốt đỉnh nên chọn: ${dinh}.` }
}

/** Câu kế của màn `mi` (loại vừa sai quay lại nhiều hơn, không lặp loại vừa rồi), gốc ngẫu nhiên trong `goc`. */
export function chonCauNgon(
  mi: number,
  goc: readonly number[],
  sai: ReadonlyMap<string, number>,
  truoc: string | null,
  cach: CachChay,
  rand: () => number = Math.random,
): CauNgon {
  const id = chonNang(MAN_NGON[mi]!.loai.map((l) => `${mi}:${l}`), sai, truoc, rand)
  return taoCauNgon(mi, id.slice(id.indexOf(':') + 1), goc[Math.floor(rand() * goc.length)]!, cach)
}

/**
 * Chồng đủ: bass là gốc (nốt thấp nhất), đủ nốt hợp âm — bỏ được bậc 5, và bậc 9 của hợp âm 13 (như công thức C13 = 1 – 3 – ♭7 + Am) —
 * và không giữ nốt không màu nào.
 */
export function duChong(giu: readonly number[], k: Khung): boolean {
  if (giu.length < 3 || giu.some((m) => mucCua(k, m) === 'khong')) return false
  const lop = new Set(giu.map(pc))
  const can = k.quang.filter((iv) => iv !== 7 && !(iv === 2 && k.quang.includes(9) && k.quang.includes(10))).map((iv) => pc(k.goc + iv))
  return pc(Math.min(...giu)) === k.goc && can.every((p) => lop.has(p))
}

export type KetQuaNot = { kq: 'dung' } | { kq: 'tiep'; daChay: number[] } | { kq: 'sai'; chu: string; daChay: number[] }

/** Chấm một cú bấm của phần 1: `daChay` là nốt đã bấm đúng của viên, `giu` là nốt đang giữ (cách chồng hai tay). */
export function chamNot(cach: CachChay, k: Khung, daChay: readonly number[], note: number, giu: readonly number[]): KetQuaNot {
  const n = notCua(k, note)
  const ten = bo8(tenPhim(k, note))
  if (!n || n.muc === 'khong')
    return {
      kq: 'sai',
      chu: `${ten} ${n ? `(${n.bac}) là nốt không màu` : 'nằm ngoài khung'} của ${k.ten} — đừng ngân.${cach === 'cau' ? ' Câu chạy lại từ đầu.' : ''}`,
      daChay: cach === 'cau' ? [] : [...daChay],
    }
  if (cach === 'chong') return duChong(giu, k) ? { kq: 'dung' } : { kq: 'tiep', daChay: [...daChay] }
  if (cach === 'cau') {
    const moi = [...daChay, note]
    return moi.length >= SO_NOT_CAU && n.muc === 'chinh' ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
  }
  if (n.muc === 'phu')
    return { kq: 'sai', chu: `${ten} (${n.bac}) là nốt phụ của ${k.ten} — đi qua được khi chạy câu, nhưng chưa phải nốt chính.`, daChay: [...daChay] }
  const moi = daChay.some((m) => pc(m) === n.p) ? [...daChay] : [...daChay, note]
  return k.not.every((x) => x.muc !== 'chinh' || moi.some((m) => pc(m) === x.p)) ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}

/* ---------------- Phần 2 — solo trên vòng ---------------- */

/** Khung từng hợp âm của một vòng (tên hợp âm cách nhau dấu cách) trong giọng `tonic` / `thu`. */
export function khungVong(chu: string, tonic: number, thu: boolean): Khung[] {
  return (docHop(chu) ?? []).map((c) =>
    khungCua(tonic, thu, {
      goc: pc(c.root - tonic),
      chat: c.quality.symbol,
      ...(c.bass !== undefined && c.bass !== c.root ? { bass: pc(c.bass - tonic) } : {}),
    }),
  )
}

/**
 * Nốt giai điệu vào ô: nốt cao nhất của cụm bấm đầu tiên trong ô (các nốt cách nốt đầu ≤ 0,15 phách — bấm cả thế tay phải một lúc);
 * không bấm gì thì nốt cao nhất còn giữ từ ô trước (giữ nốt chung, như SSA).
 */
export function notVaoO(bam: readonly { m: number; b: number }[], giu: readonly number[]): { m: number | null; giu: boolean } {
  if (bam.length) {
    const dau = Math.min(...bam.map((x) => x.b))
    return { m: Math.max(...bam.filter((x) => x.b - dau <= 0.15).map((x) => x.m)), giu: false }
  }
  return giu.length ? { m: Math.max(...giu), giu: true } : { m: null, giu: false }
}

/** Chấm phách 1 của một ô: đạt khi nốt giai điệu vào ô là nốt chính của hợp âm đang vang. */
export function chamO(k: Khung, m: number | null, giu = false): { dat: boolean; chu: string } {
  const chinh = tenDs(k.not.filter((n) => n.muc === 'chinh'))
  if (m === null) return { dat: false, chu: `Trượt ${k.ten} — phách 1 chưa có nốt. Vào ô bằng một nốt chính: ${chinh}.` }
  const n = notCua(k, m)
  const ten = bo8(tenPhim(k, m))
  if (n?.muc === 'chinh') return { dat: true, chu: `${ten} (${n.bac}) — nốt chính vào ${k.ten}${giu ? ', giữ từ hợp âm trước (nốt chung)' : ''}.` }
  if (n?.muc === 'phu') return { dat: false, chu: `${ten} (${n.bac}) là nốt phụ ở phách 1 của ${k.ten} — phách mạnh đặt nốt chính: ${chinh}.` }
  return { dat: false, chu: `${ten} ${n ? `(${n.bac}) không màu` : 'ngoài khung'} trên ${k.ten} — phách mạnh đặt nốt chính: ${chinh}.` }
}
