import type { TimelineEvent } from '../reharm/style/types'
import type { TwoHandVoicing } from '../reharm/voicingGenerator/handSplitVoicing'

/**
 * Bài tập điệu — bản ĐÓNG BĂNG, sinh bằng `tools/sinhBaiTap.mjs` (chạy app thật, chép dòng thời gian tab Tái hòa âm dựng ra).
 * `Reference/KE-HOACH-LUYEN-TAP.md` mục 1.6 · 4c. Mỗi bài: vòng TẬP 4 ô (bậc 1–6) + vòng KIỂM 8 ô / Blues 11 ô (bậc 7).
 */
export interface VongBaiTap {
  /** Hợp âm app THẬT SỰ đánh, đúng thứ tự (điệu có thể tô màu riêng — Slow Blues Am7 → Am9). */
  hopAm: string[]
  /** Hợp âm đưa vào app (đã dịch về Đô trưởng / La thứ). */
  hopAmNhap: string[]
  /** Phách từng hợp âm. */
  phach: number[]
  /** Độ dài vòng, phách. */
  doDai: number
  bpm: number
  meter: 3 | 4
  beatsPerChord: number
  perBeat: string[]
  timeline: TimelineEvent[]
  voicings: TwoHandVoicing[]
}

export interface BaiTap {
  styleId: string
  ten: string
  thay: string
  giong: string
  bpm: number
  /** Vòng lấy từ đâu — câu "đã ổn" nào trong `Nguon.json`, hay khung Bộ Soạn Blues. */
  nguon: { tap: string; kiem: string }
  /** Commit KeyTrain lúc sinh — điệu đổi sau commit này thì sinh lại. */
  commit: string
  tap: VongBaiTap
  kiem: VongBaiTap
}

/* Nạp lười: mỗi bài một tệp, mở trang thầy nào mới tải bài của thầy đó (11 bài ~300 KB). */
const files = import.meta.glob<BaiTap>('./baiTap/*.json', { import: 'default' })

/** Bài tập của một điệu; chưa sinh thì `null`. */
export async function taiBaiTap(styleId: string): Promise<BaiTap | null> {
  const load = files[`./baiTap/${styleId}.json`]
  return load ? load() : null
}
