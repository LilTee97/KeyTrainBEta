import { hopAmHoc, mucThay, notTrenHop, phanBo, THAY_HOC, type HopHoc, type ThayHoc } from './chonNot'
import { khungCua, tenPhim } from './khungNot'
import { chonNang, type CauKhung } from './mauKhung'

/*
  MÀN THẦY của Game nốt rơi (thử) — người dùng 15/10/2026: "Bạn có đưa 3 thầy vào game nốt rơi và game chạy ngón mới để tôi học chưa",
  chọn "Game nốt rơi màn thầy". Mỗi thầy · mỗi giọng một màn: hợp âm của giọng rơi xuống (I ii iii IV V7 vi · i ♭III iv V7 ♭VI ♭VII;
  Blues I7 IV7 V7 · i V7), bấm đủ các nốt CHÍNH của thầy trên hợp âm ấy — đúng ba mức của tab Chọn nốt theo thầy (`mucThay`): chính =
  nốt hợp âm hay nốt thầy dùng từ 10 %; không màu (thầy không đánh) là sai; nốt mờ (dùng được) không tính, không sai.
  Số đo: `phanBo` của `chonNot.ts` (chép từ md đã chốt — Cà Pháo 828 nốt, Linh Nhi 1045, Blues Rockhouse 810 · Rising Sun 49 / 35). Hợp
  âm chưa có số đo của thầy (vii° · ii° · Blues thứ IV7 · ♭VI7) bỏ khỏi màn. Số đo chia theo LOẠI hợp âm (trưởng · thứ · át), không theo
  bậc — nốt ≥ 10 % mà ra ngoài gam ở bậc ấy (vd maj7 của ♭VII trong giọng thứ) vẫn tính chính như tab Chọn nốt; chưa xét riêng.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export interface ManThay {
  ten: string
  goiY: string
  thay: ThayHoc
  thu: boolean
  hop: readonly HopHoc[]
  quyTac: readonly string[]
}

const tenThay = (t: ThayHoc) => THAY_HOC.find((x) => x.id === t)!.ten
const man = (thay: ThayHoc, thu: boolean): ManThay => {
  const hop = hopAmHoc(thay, thu).filter((h) => phanBo(thay, h, thu))
  const t = THAY_HOC.find((x) => x.id === thay)!
  return {
    ten: `${t.ten} · giọng ${thu ? 'thứ' : 'trưởng'}`,
    goiY: hop.map((h) => h.laMa).join(' · '),
    thay,
    thu,
    hop,
    quyTac: [t.tom, `Cơ sở: ${t.coSo}`, 'Chính (xanh) = nốt hợp âm và nốt thầy dùng từ 10 % — như tab Chọn nốt theo thầy.'],
  }
}
export const MAN_THAY: readonly ManThay[] = (['ca-phao', 'linh-nhi', 'blues'] as const).flatMap((t) => [man(t, false), man(t, true)])

/** Câu màn thầy: như câu khung, thêm nốt chính của thầy (`chinh`) và nốt thầy không đánh (`tranh`) — lớp cao độ. */
export interface CauThay extends CauKhung {
  /** Dòng hai trên viên (bên mẹo): bậc và giọng — "V7 · giọng C trưởng". */
  khungTen: string
  chinh: number[]
  tranh: number[]
}

export function taoCauThay(mi: number, j: number, tonic: number): CauThay {
  const m = MAN_THAY[mi]!
  const hop = m.hop[j]!
  const k = khungCua(tonic, m.thu, { goc: hop.goc, chat: hop.chat })
  const p = phanBo(m.thay, hop, m.thu)
  const nots = notTrenHop(m.thay, hop, m.thu)
  const ten = (iv: number) => tenPhim(k, 60 + pc(k.goc + iv)).replace(/-?\d+$/, '')
  const theo = (muc: string) => nots.filter((x) => mucThay(x) === muc)
  const chinh = theo('dam').sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
  const mo = theo('mo').filter((x) => x.pct)
  const ds = (xs: typeof nots) => xs.map((x) => `${ten(x.iv)}${x.pct ? ` ${x.pct} %` : ''}`).join(' · ')
  const vai = `${tenThay(m.thay)} trên ${k.ten} (${hop.laMa}): chính ${ds(chinh)}${mo.length ? ` · ít: ${ds(mo)}` : ''}`
  return {
    id: `thay${mi}:${j}`,
    ten: k.ten,
    g: k.goc,
    k,
    khungTen: `${hop.laMa} · giọng ${tenPhim(k, 60 + pc(tonic)).replace(/-?\d+$/, '')} ${m.thu ? 'thứ' : 'trưởng'}`,
    quyTac: vai,
    goiY: `${chinh.length} nốt chính của ${tenThay(m.thay)}`,
    loi: `${vai}.`,
    meo: `${vai}. Cơ sở: ${p ? `${p.nguon}, n=${p.n}` : 'chưa đo'}.`,
    dapAnTen: '',
    luaChon: [],
    chinh: chinh.map((x) => pc(k.goc + x.iv)),
    tranh: theo('khong').map((x) => pc(k.goc + x.iv)),
  }
}

/** Câu kế của màn thầy `mi` (hợp âm vừa sai quay lại nhiều hơn), chủ âm ngẫu nhiên trong `goc`. */
export function chonCauThay(mi: number, goc: readonly number[], sai: ReadonlyMap<string, number>, truoc: string | null, rand: () => number = Math.random): CauThay {
  const id = chonNang(MAN_THAY[mi]!.hop.map((_, j) => `thay${mi}:${j}`), sai, truoc, rand)
  return taoCauThay(mi, Number(id.split(':')[1]), goc[Math.floor(rand() * goc.length)]!)
}

/** Một cú bấm ở màn thầy: nốt thầy không đánh là sai; nốt chính góp vào; nốt mờ (dùng được) không tính. */
export function chamThay(c: { chinh: readonly number[]; tranh: readonly number[] }, note: number, daChay: readonly number[]): { kq: 'sai' } | { kq: 'mo' } | { kq: 'dung' } | { kq: 'tiep'; daChay: number[] } {
  const p = pc(note)
  if (c.tranh.includes(p)) return { kq: 'sai' }
  if (!c.chinh.includes(p)) return { kq: 'mo' }
  const moi = daChay.some((m) => pc(m) === p) ? [...daChay] : [...daChay, note]
  return c.chinh.every((x) => moi.some((m) => pc(m) === x)) ? { kq: 'dung' } : { kq: 'tiep', daChay: moi }
}
