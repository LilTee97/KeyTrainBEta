import type { PracticeHand } from '../../reharm/playback/noteGatedPlaybackEngine'
import type { ChamNhac, TimedScore } from '../../reharm/playback/timedScoring'
import type { TimelineEvent } from '../../reharm/style/types'
import type { LuotTap } from '../../shared/persistence/db'
import data from './giatCaPhao.json'

/**
 * Tab Kỹ thuật đánh · Cà Pháo — ĐÁNH GIẬT (GĐ 2, `Reference/KE-HOACH-LUYEN-TAP.md`).
 *
 * Người dùng 3/10/2026: "đánh giật" = giật ngón (bấm rồi nhấc ngón ngay — dấu staccato) · *"tôi chỉ muốn học đánh giật kiểu Cà
 * Pháo"*. Vật liệu: 9 đoạn cắt NGUYÊN từ bản chép tay *Người hãy quên em đi* — sheet duy nhất của anh có ghi dấu giật (bảy sheet
 * ballad là bản máy chép không mang dấu; Hồng Kông 1 không ghi dấu giật nào). Cắt bằng `scripts/giat_ca_phao.py`; nốt giật vang
 * nửa trường độ ghi (cách đọc của Claude, như bộ soạn solo CP).
 */

export interface DoanGiat {
  id: string
  ten: string
  /** Ô nhịp trong sheet. */
  o: number[]
  /** Số phách của đoạn. */
  doDai: number
  soCu: number
  soCuGiat: number
  /** Cú giật của tay phải. */
  giatPhai: number
  cuMoiPhach: number
  soNotLay: number
  events: TimelineEvent[]
}

export const GIAT_CA_PHAO = data as {
  nguon: { file: string; sha256: string; script: string }
  bpm: number
  meter: 4
  bai: DoanGiat[]
}

/** Mỗi lượt tập ít nhất 16 phách (4 ô): đoạn một ô lặp 4 lần, đoạn hai ô lặp 2 lần — đoán, chưa đo: một lượt 4 phách ít cú quá để chấm. */
export const PHACH_MOI_LUOT = 16

export function lapDoan(doan: DoanGiat): TimelineEvent[] {
  const soLan = Math.max(1, Math.ceil(PHACH_MOI_LUOT / doan.doDai))
  return Array.from({ length: soLan }, (_, lan) =>
    doan.events.map((event) => ({ ...event, startBeat: event.startBeat + lan * doan.doDai })),
  ).flat()
}

/** Bản BỎ GIẬT để nghe so sánh: cùng nốt, nốt giật vang đủ trường độ ghi. */
export function boGiat(events: readonly TimelineEvent[]): TimelineEvent[] {
  return events.map(({ giat, ghiBeats, ...event }) => (giat ? { ...event, durationBeats: ghiBeats ?? event.durationBeats } : event))
}

/**
 * Thang 4 bậc cho mỗi đoạn. NGƯỠNG — quyết định của Claude trong vai gia sư (như thang tab Điệu, người dùng giao 2/10/2026), CHƯA ĐO.
 * Chỉnh khi: giật rõ tai mà vẫn trượt cột giật → nới; qua bậc 4 mà nghe vẫn lờ đờ → siết.
 */
export interface BacGiat {
  so: 1 | 2 | 3 | 4
  ten: string
  tay: PracticeHand
  tempo: 60 | 100
  dungToiThieu: number
  lechToiDa: number
  thuaToiDa: number
  /** Tỉ lệ nốt giật nhấc đủ sớm. */
  giatToiThieu: number
  /** Tỉ lệ nốt ngân giữ đủ lâu. */
  nganToiThieu: number
  viSao: string
}

export const BAC_GIAT: readonly BacGiat[] = [
  {
    so: 1,
    ten: 'Tay phải · 60 %',
    tay: 'right',
    tempo: 60,
    dungToiThieu: 0.85,
    lechToiDa: 60,
    thuaToiDa: 0.15,
    giatToiThieu: 0.75,
    nganToiThieu: 0.75,
    viSao:
      'Tách tay phải, chậm: tách việc giật ra khỏi việc tìm phím. Anh giật chủ yếu ở hợp âm tay phải — cả cú nhấc lên cùng lúc, như chạm vào nồi nóng. Nốt không có dấu thì giữ đủ; giật nhầm chỗ ngân cũng tính sai.',
  },
  {
    so: 2,
    ten: 'Tay phải · 100 %',
    tay: 'right',
    tempo: 100,
    dungToiThieu: 0.9,
    lechToiDa: 45,
    thuaToiDa: 0.1,
    giatToiThieu: 0.85,
    nganToiThieu: 0.8,
    viSao: 'Đúng nhịp sheet: nhanh hơn thì cú giật phải gọn hơn mà vẫn rơi đúng chỗ.',
  },
  {
    so: 3,
    ten: 'Hai tay · 60 %',
    tay: 'both',
    tempo: 60,
    dungToiThieu: 0.85,
    lechToiDa: 60,
    thuaToiDa: 0.15,
    giatToiThieu: 0.75,
    nganToiThieu: 0.75,
    viSao:
      'Ghép tay trái: bass phần lớn ngân, chỉ vài nốt có dấu giật. Hai tay nhấc khác nhau mới là cái khó, nên chậm lại và nới ngưỡng.',
  },
  {
    so: 4,
    ten: 'Hai tay · 100 %',
    tay: 'both',
    tempo: 100,
    dungToiThieu: 0.9,
    lechToiDa: 45,
    thuaToiDa: 0.1,
    giatToiThieu: 0.85,
    nganToiThieu: 0.8,
    viSao: 'Hai tay, nhịp thật: tiếng giật rõ tai mà nhịp vẫn đều.',
  },
]

const phanTram = (x: number) => Math.round(x * 100)

export function chamGiat(
  bac: BacGiat,
  score: TimedScore,
  nhac: ChamNhac | null,
): { dat: boolean; tomTat: string } {
  const dung = score.total > 0 ? score.hit / score.total : 0
  const thua = score.total > 0 ? score.extra.length / score.total : 0
  const lech = score.medianAbsMs
  /* Không có nốt giật nào bấm trúng để chấm thì cột giật không đạt — chưa chứng minh được. Không có nốt ngân thì bỏ cột ngân. */
  const giat = nhac && nhac.giatTong > 0 ? nhac.giatDung / nhac.giatTong : null
  const ngan = nhac && nhac.nganTong > 0 ? nhac.nganDung / nhac.nganTong : null
  const ok = {
    dung: dung >= bac.dungToiThieu - 1e-9,
    lech: lech !== null && lech <= bac.lechToiDa,
    thua: thua <= bac.thuaToiDa + 1e-9,
    giat: giat !== null && giat >= bac.giatToiThieu - 1e-9,
    ngan: ngan === null || ngan >= bac.nganToiThieu - 1e-9,
  }
  const tomTat = [
    `đúng ${phanTram(dung)} % (cần ≥ ${phanTram(bac.dungToiThieu)})`,
    `lệch ${lech === null ? '—' : Math.round(lech)} ms (≤ ${bac.lechToiDa})`,
    `thừa ${phanTram(thua)} % (≤ ${phanTram(bac.thuaToiDa)})`,
    `giật ${giat === null ? '—' : `${phanTram(giat)} %`} (cần ≥ ${phanTram(bac.giatToiThieu)})`,
    `ngân ${ngan === null ? '—' : `${phanTram(ngan)} %`} (cần ≥ ${phanTram(bac.nganToiThieu)})`,
  ].join(' · ')
  return { dat: score.total > 0 && ok.dung && ok.lech && ok.thua && ok.giat && ok.ngan, tomTat }
}

/** Nhật ký lượt tập dùng chung kho `luotTap` của tab Điệu, khoá riêng cho từng đoạn. */
export const khoaGiat = (id: string) => `giat-cp:${id}`

export type TrangThaiBacGiat = 'khoa' | 'mo' | 'qua'

/** Qua bậc trước mới mở bậc sau — hàm thuần đọc nhật ký. */
export function trangThaiGiat(luot: readonly LuotTap[], id: string): TrangThaiBacGiat[] {
  const qua = new Set(luot.filter((one) => one.styleId === khoaGiat(id) && one.dat).map((one) => one.bac))
  return BAC_GIAT.map((bac, i) => (qua.has(bac.so) ? 'qua' : i === 0 || qua.has(BAC_GIAT[i - 1]!.so) ? 'mo' : 'khoa'))
}

export function bacGiatKeTiep(trangThai: readonly TrangThaiBacGiat[]): number {
  const i = trangThai.indexOf('mo')
  return i >= 0 ? i + 1 : BAC_GIAT.length
}
