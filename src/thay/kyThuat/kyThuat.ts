import type { PracticeHand } from '../../reharm/playback/noteGatedPlaybackEngine'
import type { ChamLay, ChamNhac, TimedScore } from '../../reharm/playback/timedScoring'
import type { TimelineEvent } from '../../reharm/style/types'
import type { LuotTap } from '../../shared/persistence/db'
import type { TeacherId } from '../teachers'

/**
 * Tab Kỹ thuật đánh (GĐ 2, `Reference/KE-HOACH-LUYEN-TAP.md`) — khung chung cho mọi thầy: mỗi KỸ THUẬT là các đoạn cắt NGUYÊN từ
 * sheet của thầy (script trong `scripts/`, ghi kèm bài và ô), tập theo nhịp trên thang 4 bậc, chấm tự động.
 */

export interface DoanTap {
  id: string
  ten: string
  /** Ô nhịp trong sheet. */
  o: number[]
  /** Số phách của đoạn. */
  doDai: number
  /** Số lúc gõ (mọi tay) mỗi phách — thước dễ/khó đơn giản; các đoạn xếp dễ trước theo số này. */
  cuMoiPhach: number
  ghiChu: string
  /** Nhịp độ riêng của đoạn khi khác `KyThuat.bpm` (kỹ thuật lấy đoạn từ nhiều sheet). */
  bpm?: number
  events: TimelineEvent[]
}

/**
 * Một bậc của thang. NGƯỠNG — quyết định của Claude trong vai gia sư (như thang tab Điệu, người dùng giao 2/10/2026), CHƯA ĐO.
 * Chỉnh khi: kẹt một bậc hơn một tuần dù tai nghe đã ổn → nới; qua bậc 4 mà nghe vẫn lờ đờ → siết.
 */
export interface BacKyThuat {
  so: number
  ten: string
  tay: PracticeHand
  tempo: 60 | 100
  dungToiThieu: number
  lechToiDa: number
  thuaToiDa: number
  /** Đánh giật: tỉ lệ nốt giật nhấc đủ sớm; `null` = không chấm. */
  giatToiThieu: number | null
  /** Đánh giật: tỉ lệ nốt ngân giữ đủ lâu; `null` = không chấm. */
  nganToiThieu: number | null
  /** Luyến láy: tỉ lệ nốt láy đúng (`chamLay`); `null` = không chấm. */
  layToiThieu: number | null
  viSao: string
}

export interface KyThuat<D extends DoanTap = DoanTap> {
  /** Khoá nhật ký lượt tập: `${id}:${đoạn}` (kho `luotTap` chung với tab Điệu — trang Hôm nay không đọc khoá này). */
  id: string
  thay: TeacherId
  ten: string
  /** Kỹ thuật này là gì, tay làm gì. */
  gioiThieu: string
  /** Số đo làm căn cứ (cỡ mẫu, nguồn). */
  soDo: string
  bpm: number
  meter: 3 | 4
  /** Chấm cả lúc nhấc phím (`chamNhacPhim`) — chỉ đánh giật. */
  chamNhac: boolean
  /** Chấm nốt láy (`chamLay`) — chỉ bài luyến láy. */
  chamLay: boolean
  bac: readonly BacKyThuat[]
  bai: readonly D[]
}

/** Mỗi lượt tập ít nhất 16 phách: đoạn ngắn lặp lại cho đủ — đoán, chưa đo: một lượt 4 phách ít cú quá để chấm. */
export const PHACH_MOI_LUOT = 16

export function lapDoan(doan: DoanTap): TimelineEvent[] {
  const soLan = Math.max(1, Math.ceil(PHACH_MOI_LUOT / doan.doDai))
  return Array.from({ length: soLan }, (_, lan) =>
    doan.events.map((event) => ({ ...event, startBeat: event.startBeat + lan * doan.doDai })),
  ).flat()
}

/** Bản BỎ GIẬT để nghe so sánh: cùng nốt, nốt giật vang đủ trường độ ghi. */
export function boGiat(events: readonly TimelineEvent[]): TimelineEvent[] {
  return events.map(({ giat, ghiBeats, ...event }) => (giat ? { ...event, durationBeats: ghiBeats ?? event.durationBeats } : event))
}

/** Thang 4 bậc: tách tay tập trung (60 % → 100 %) rồi ghép hai tay (60 % → 100 %). Ngưỡng giật/ngân chỉ cho đánh giật. */
export function thang4(
  tay: 'left' | 'right',
  viSao: readonly [string, string, string, string],
  giat: { giatToiThieu: [number, number]; nganToiThieu: [number, number] } | null = null,
  lay: [number, number] | null = null,
): BacKyThuat[] {
  const tenTay = tay === 'left' ? 'Tay trái' : 'Tay phải'
  const cham = (nhanh: boolean) => ({
    dungToiThieu: nhanh ? 0.9 : 0.85,
    lechToiDa: nhanh ? 45 : 60,
    thuaToiDa: nhanh ? 0.1 : 0.15,
    giatToiThieu: giat ? giat.giatToiThieu[nhanh ? 1 : 0] : null,
    nganToiThieu: giat ? giat.nganToiThieu[nhanh ? 1 : 0] : null,
    layToiThieu: lay ? lay[nhanh ? 1 : 0] : null,
  })
  return [
    { so: 1, ten: `${tenTay} · 60 %`, tay, tempo: 60, ...cham(false), viSao: viSao[0] },
    { so: 2, ten: `${tenTay} · 100 %`, tay, tempo: 100, ...cham(true), viSao: viSao[1] },
    { so: 3, ten: 'Hai tay · 60 %', tay: 'both', tempo: 60, ...cham(false), viSao: viSao[2] },
    { so: 4, ten: 'Hai tay · 100 %', tay: 'both', tempo: 100, ...cham(true), viSao: viSao[3] },
  ]
}

const phanTram = (x: number) => Math.round(x * 100)

export function chamKyThuat(
  bac: BacKyThuat,
  score: TimedScore,
  nhac: ChamNhac | null,
  lay: ChamLay | null = null,
): { dat: boolean; tomTat: string } {
  const dung = score.total > 0 ? score.hit / score.total : 0
  const thua = score.total > 0 ? score.extra.length / score.total : 0
  const lech = score.medianAbsMs
  /* Không có nốt giật nào bấm trúng để chấm thì cột giật không đạt — chưa chứng minh được. Không có nốt ngân thì bỏ cột ngân. */
  const giat = nhac && nhac.giatTong > 0 ? nhac.giatDung / nhac.giatTong : null
  const ngan = nhac && nhac.nganTong > 0 ? nhac.nganDung / nhac.nganTong : null
  /* Không có nốt láy nào để chấm thì cột láy không đạt — bài láy đoạn nào cũng có nốt láy. */
  const layTiLe = lay && lay.layTong > 0 ? lay.layDung / lay.layTong : null
  const ok = [
    dung >= bac.dungToiThieu - 1e-9,
    lech !== null && lech <= bac.lechToiDa,
    thua <= bac.thuaToiDa + 1e-9,
    bac.giatToiThieu === null || (giat !== null && giat >= bac.giatToiThieu - 1e-9),
    bac.nganToiThieu === null || ngan === null || ngan >= bac.nganToiThieu - 1e-9,
    bac.layToiThieu === null || (layTiLe !== null && layTiLe >= bac.layToiThieu - 1e-9),
  ]
  const tomTat = [
    `đúng ${phanTram(dung)} % (cần ≥ ${phanTram(bac.dungToiThieu)})`,
    `lệch ${lech === null ? '—' : Math.round(lech)} ms (≤ ${bac.lechToiDa})`,
    `thừa ${phanTram(thua)} % (≤ ${phanTram(bac.thuaToiDa)})`,
    ...(bac.giatToiThieu === null
      ? []
      : [`giật ${giat === null ? '—' : `${phanTram(giat)} %`} (cần ≥ ${phanTram(bac.giatToiThieu)})`]),
    ...(bac.nganToiThieu === null
      ? []
      : [`ngân ${ngan === null ? '—' : `${phanTram(ngan)} %`} (cần ≥ ${phanTram(bac.nganToiThieu)})`]),
    ...(bac.layToiThieu === null
      ? []
      : [`láy ${layTiLe === null ? '—' : `${phanTram(layTiLe)} %`} (cần ≥ ${phanTram(bac.layToiThieu)})`]),
  ].join(' · ')
  return { dat: score.total > 0 && ok.every(Boolean), tomTat }
}

export const khoaKyThuat = (kt: KyThuat, doanId: string) => `${kt.id}:${doanId}`

export type TrangThaiBacKyThuat = 'khoa' | 'mo' | 'qua'

/** Qua bậc trước mới mở bậc sau — hàm thuần đọc nhật ký. */
export function trangThaiKyThuat(luot: readonly LuotTap[], kt: KyThuat, doanId: string): TrangThaiBacKyThuat[] {
  const khoa = khoaKyThuat(kt, doanId)
  const qua = new Set(luot.filter((one) => one.styleId === khoa && one.dat).map((one) => one.bac))
  return kt.bac.map((bac, i) => (qua.has(bac.so) ? 'qua' : i === 0 || qua.has(kt.bac[i - 1]!.so) ? 'mo' : 'khoa'))
}

export function bacKeTiepKyThuat(trangThai: readonly TrangThaiBacKyThuat[]): number {
  const i = trangThai.indexOf('mo')
  return i >= 0 ? i + 1 : trangThai.length
}
