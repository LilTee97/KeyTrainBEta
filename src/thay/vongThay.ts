import { transposeSymbol } from '../reharm/transpose'
import type { AccidentalStyle } from '../shared/musicTheory/types'
import kho from './vongThay.json'
import type { TeacherId } from './teachers'

/**
 * Kho vòng 4 ô của từng thầy cho nút "Tự soạn từ hợp âm chủ" — trích từ câu "đã ổn" trong `Nguon.json` (Blues: khung Bộ Soạn
 * Blues) bằng `tools/sinhBaiTap.mjs`, lưu ở Đô trưởng / La thứ. Tuấn mượn hòa âm Linh Nhi (người dùng 2/10/2026).
 */
export interface VongMau {
  hopAm: string[]
  nguon: string
}

const KHO = kho as Record<'ca-phao' | 'linh-nhi' | 'blues', { truong: VongMau[]; thu: VongMau[] }>
const NGUON: Record<TeacherId, keyof typeof KHO> = { 'ca-phao': 'ca-phao', 'linh-nhi': 'linh-nhi', tuan: 'linh-nhi', blues: 'blues' }

export function vongMau(thay: TeacherId, thu: boolean): readonly VongMau[] {
  return KHO[NGUON[thay]][thu ? 'thu' : 'truong']
}

/** Giọng có hoá biểu giáng thì ghi tên nốt giáng (Fa trưởng: Bb, không A#). */
export function kieuDau(tonic: number, thu: boolean): AccidentalStyle {
  const truongTuongDuong = thu ? (tonic + 3) % 12 : tonic
  return [5, 10, 3, 8, 1].includes(truongTuongDuong) ? 'flat' : 'sharp'
}

/**
 * Soạn vòng 4 hợp âm cho một hợp âm chủ: lấy vòng thứ `lan` (xoay vòng) trong kho của thầy, dịch từ Đô trưởng / La thứ sang
 * giọng `tonic`. Kho rỗng thì `null`.
 */
export function soanVong(thay: TeacherId, tonic: number, thu: boolean, lan: number): VongMau | null {
  const kho = vongMau(thay, thu)
  if (kho.length === 0) return null
  const mau = kho[((lan % kho.length) + kho.length) % kho.length]!
  const dich = tonic - (thu ? 9 : 0)
  return { hopAm: mau.hopAm.map((c) => transposeSymbol(c, dich, kieuDau(tonic, thu))), nguon: mau.nguon }
}

/** Nốt gốc cho bộ chọn hợp âm — tên quen dùng (C#, Eb, F#, Ab, Bb). */
export const GOC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/** Loại hợp âm cho bộ chọn — các loại có trong vòng của các thầy và trong tài liệu đệm hát. */
export const LOAI = [
  { kyHieu: '', ten: 'trưởng' },
  { kyHieu: 'm', ten: 'thứ' },
  { kyHieu: '7', ten: '7' },
  { kyHieu: 'maj7', ten: 'maj7' },
  { kyHieu: 'm7', ten: 'm7' },
  { kyHieu: '6', ten: '6' },
  { kyHieu: 'm6', ten: 'm6' },
  { kyHieu: 'add9', ten: 'add9' },
  { kyHieu: 'm(add9)', ten: 'm(add9)' },
  { kyHieu: '9', ten: '9' },
  { kyHieu: 'm9', ten: 'm9' },
  { kyHieu: 'maj9', ten: 'maj9' },
  { kyHieu: '11', ten: '11' },
  { kyHieu: 'm11', ten: 'm11' },
  { kyHieu: '13', ten: '13' },
  { kyHieu: 'sus4', ten: 'sus4' },
  { kyHieu: '7sus4', ten: '7sus4' },
  { kyHieu: '9sus4', ten: '9sus4' },
  { kyHieu: 'm7b5', ten: 'm7b5' },
  { kyHieu: 'dim7', ten: 'dim7' },
  { kyHieu: '7b9', ten: '7b9' },
  { kyHieu: '7b13', ten: '7b13' },
] as const
