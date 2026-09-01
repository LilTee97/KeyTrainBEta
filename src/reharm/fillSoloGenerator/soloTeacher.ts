import { getStyle } from '../style/styleLibrary'
import { raiTheoTayTrai, soloTuDoCaPhao } from '../style/hoDieu'
import type { SoloNoteSource } from './soloGenerator'

/**
 * Thầy nào đứng sau điệu này khi sinh câu solo.
 *
 * Một điệu một thầy. Không suy từ họ điệu — ballad của Tôn Hùng không phải
 * ballad của Cà Pháo.
 */
export type SoloTeacher = 'ca-phao' | 'linh-nhi' | 'ton-hung' | null

/** Giang tấu Tôn Hùng — từng bài, hoặc hòa trộn. */
export type TonHungGiang = 'chiec-la' | 'tinh-em' | 'hoa-tron'

/** Nút chọn thầy cho dạo / giang tấu / kết. `null` = theo điệu đệm. */
export const SOLO_THAY_NUT: readonly {
  id: SoloTeacher
  label: string
  styleId: string | null
}[] = [
  { id: null, label: 'Theo đệm', styleId: null },
  { id: 'ca-phao', label: 'Cà Pháo', styleId: 'bossa-ca-phao-som' },
  { id: 'linh-nhi', label: 'Linh Nhi', styleId: 'bolero-linh-nhi-2' },
  { id: 'ton-hung', label: 'Tôn Hùng', styleId: 'ton-hung-ballad' },
]

export function styleIdForTeacher(teacher: Exclude<SoloTeacher, null>): string {
  return SOLO_THAY_NUT.find((one) => one.id === teacher)!.styleId!
}

/** Cell rải 1-5-8-10 — nguồn nốt RH Linh Nhi, không phải điệu đệm. */
export const LINH_NHI_RAI = 'bolero-linh-nhi-2'

/** Cell rải ballad Chiếc Lá — dạo/kết Tôn Hùng (LH thưa). */
export const TON_HUNG_RAI = 'ton-hung-ballad'
/** Giang tấu Chiếc Lá / hòa trộn — LH 8th. */
export const TON_HUNG_GIANG = 'ton-hung-ballad-giang'
/** Giang tấu Tình Em — LH móc 16. */
export const TON_HUNG_GIANG_TINH = 'ton-hung-tinh-em-giang'

export function soloTeacherOf(styleId: string | undefined | null): SoloTeacher {
  const family = (styleId ? getStyle(styleId)?.family : null) ?? ''
  if (family === 'ton-hung-ballad') return 'ton-hung'
  if (family.includes('linh-nhi')) return 'linh-nhi'
  if (family === 'bossa-ca-phao' || family.startsWith('ca-phao')) return 'ca-phao'
  if (styleId && soloTuDoCaPhao(styleId)) return 'ca-phao'
  if (styleId && raiTheoTayTrai(styleId)) return 'linh-nhi'
  return null
}

/**
 * Nguồn nốt mặc định khi người dùng chưa chọn — theo số đo sheet.
 *
 * Tôn Hùng: RH solo khớp giọng bài ≥90%, gần như không chạy móc kép.
 * Linh Nhi: tỉ lệ nốt hợp âm cao (57–77%), rải bám LH.
 * Cà Pháo: đã có lối riêng; giữ keyPentatonic như các test đang so.
 */
export function noteSourceForTeacher(teacher: SoloTeacher): SoloNoteSource {
  if (teacher === 'ton-hung') return 'chordTone'
  if (teacher === 'linh-nhi') return 'chordTone'
  return 'keyPentatonic'
}

/** Tôn Hùng: 0–3 câu chạy ngắn / bài — không kết đoạn bằng cú chạy ngón. */
export function teacherEndsWithRun(teacher: SoloTeacher): boolean {
  return teacher !== 'ton-hung'
}

/**
 * Giai điệu đo từ sheet (chỉ moc 1 nốt, không quạt hợp âm).
 *
 * Cà Pháo: màu / 9 / lặp nốt. Linh Nhi: 1-3-5, gõ bậc 3.
 * Tôn Hùng: 1-3-5-7, ngân, nghỉ, nhảy quãng tám.
 */
export function melodyKind(teacher: SoloTeacher): 'color' | 'stable' {
  if (teacher === 'ton-hung' || teacher === 'linh-nhi') return 'stable'
  return 'color'
}
