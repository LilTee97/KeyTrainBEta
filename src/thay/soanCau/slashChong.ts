import { chordPitchClasses, findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'

/*
  HỢP ÂM SLASH — người dùng 9/10/2026: "Sao tôi ko thấy các quy luật về hợp âm slash". X/Y: tay phải bấm hợp âm X, tay trái bấm nốt bass
  Y. Hai loại: Y thuộc X là THẾ ĐẢO (để bass đi liền bậc); Y không thuộc X là hợp âm MÀU viết tắt — chính là các công thức chồng có tay
  trái một nốt gốc. Lời quy luật là của Claude (gia sư); mỗi phép "X/Y = hợp âm màu" có test kiểm nốt (slashChong.test.ts). Ví dụ trong
  sheet các thầy lấy từ phép đo thế bấm (tools/the_bam_thay.py) và đã soát tay từng nốt (SO-TAY 9/10/2026).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export interface ViDuSlash {
  ten: string
  /** Hợp âm tay phải: gốc (nửa cung từ Đô) + ký hiệu chất của app. */
  goc: number
  chat: string
  /** Nốt bass tay trái (nửa cung từ Đô). */
  bass: number
  nghia: string
}
export interface SlashMau extends ViDuSlash {
  /** Hợp âm màu mà slash viết tắt; `thieu` là các bậc của hợp âm ấy mà slash không có. */
  la: { goc: number; chat: string; ten: string; thieu: readonly number[] }
}

export const QUY_LUAT_SLASH: readonly string[] = [
  'Đọc X/Y: tay phải bấm hợp âm X, tay trái bấm nốt Y ở bass. Y là nốt thấp nhất của cả hợp âm.',
  'Y là nốt CỦA X → thế đảo: bass bậc 3 (đảo 1) nghe nhẹ, đang đi; bass bậc 5 (đảo 2) lửng lơ, hay đứng ngay trước V; bass ♭7 (đảo 3) kéo bass xuống tiếp. Thế đảo để bass đi liền bậc thay vì nhảy.',
  'Y KHÔNG thuộc X → hợp âm màu viết tắt: đếm phím từ Y lên gốc X rồi đọc như công thức chồng tay trái một nốt — Em/C = Cmaj7, E♭/C = Cm7, B♭/C = C9sus4.',
  'Hợp âm trưởng thấp hơn bass một cung (B♭/C, F/G, C/D, D/E, G/A) = 9sus4 của bass — gặp rất nhiều trong pop, gospel, thay cho V.',
  'Mẹo chèn slash: hai hợp âm có bass cách nhau quãng ba thì chèn một hợp âm slash có bass ở giữa — C → Am thành C – G/B – Am (bass Đô – Si – La).',
]

export const SLASH_DAO: readonly ViDuSlash[] = [
  { ten: 'C/E', goc: 0, chat: '', bass: 4, nghia: 'đảo 1 — bass bậc 3: nhẹ, đang đi' },
  { ten: 'C/G', goc: 0, chat: '', bass: 7, nghia: 'đảo 2 — bass bậc 5: lửng lơ, hay đứng trước G để kéo về' },
  { ten: 'C7/B♭', goc: 0, chat: '7', bass: 10, nghia: 'đảo 3 — bass ♭7: kéo xuống La của F/A' },
  { ten: 'G/B', goc: 7, chat: '', bass: 11, nghia: 'V có bass bậc 3 — Si là nốt cảm âm, bước nửa cung lên Đô' },
  { ten: 'Am/C', goc: 9, chat: 'm', bass: 0, nghia: 'đảo 1 của Am — cũng chính là C6 thiếu bậc 5: một tên slash có khi là cả thế đảo lẫn hợp âm màu' },
]

export const SLASH_MAU: readonly SlashMau[] = [
  { ten: 'Em/C', goc: 4, chat: 'm', bass: 0, nghia: 'thứ cao hơn bass 4 phím', la: { goc: 0, chat: 'maj7', ten: 'Cmaj7', thieu: [] } },
  { ten: 'E♭/C', goc: 3, chat: '', bass: 0, nghia: 'trưởng cao hơn bass 3 phím', la: { goc: 0, chat: 'm7', ten: 'Cm7', thieu: [] } },
  { ten: 'Edim/C', goc: 4, chat: 'dim', bass: 0, nghia: 'giảm cao hơn bass 4 phím', la: { goc: 0, chat: '7', ten: 'C7', thieu: [] } },
  { ten: 'B♭/C', goc: 10, chat: '', bass: 0, nghia: 'trưởng thấp hơn bass một cung', la: { goc: 0, chat: '9sus4', ten: 'C9sus4', thieu: [7] } },
  { ten: 'F/G', goc: 5, chat: '', bass: 7, nghia: 'trưởng thấp hơn bass một cung (IV trên bass V)', la: { goc: 7, chat: '9sus4', ten: 'G9sus4', thieu: [7] } },
  { ten: 'G/C', goc: 7, chat: '', bass: 0, nghia: 'trưởng cao hơn bass 7 phím', la: { goc: 0, chat: 'maj9', ten: 'Cmaj9 (thiếu bậc 3)', thieu: [4] } },
]

/** Slash trong sheet các thầy — đã soát tay từng nốt. */
export const SLASH_THAY: readonly { thay: string; bai: string; vong: string; bass: string; y: string }[] = [
  { thay: 'Linh Nhi', bai: 'Mùa Xuân Đầu Tiên (Sol trưởng)', vong: 'Am – D/F♯ – G', bass: 'La – Fa♯ – Sol', y: 'đặt nốt cảm âm Fa♯ ở bass để bước nửa cung lên Sol' },
  { thay: 'Cà Pháo', bai: 'Để Em Rời Xa (Rê thứ)', vong: 'Dm/C – B♭/A – Dm/G', bass: 'Đô – La – Sol', y: 'bass đi xuống dưới tay phải' },
  { thay: 'Cà Pháo', bai: 'Ngày Mai Em Đi (Mi♭ trưởng)', vong: 'A♭ – Cm/G – Fm', bass: 'La♭ – Sol – Fa', y: 'bass đi xuống liền bậc từ bậc 4' },
  { thay: 'Cà Pháo', bai: 'Hồng Kông 1 (Đô trưởng)', vong: 'F/G – G/D – C7', bass: 'Sol – Rê – Đô', y: 'IV trên bass V (= G9sus4) thay cho V' },
  { thay: 'Blues · Robert', bai: 'Slow Blues Impromptu (Đô trưởng)', vong: 'C/E – E♭°7 – Dm', bass: 'Mi – Mi♭ – Rê', y: 'bass trượt nửa cung qua hợp âm giảm' },
]

/** Lớp cao độ của một hợp âm theo ký hiệu app. */
export const lopHop = (goc: number, chat: string) => chordPitchClasses(pc(goc), findQualityBySymbol(chat) ?? findQualityBySymbol('')!)

/** Thế bấm để xem / nghe: tay trái nốt bass (Mi2 – Rê♯3), tay phải hợp âm X thế gốc quanh Đô4. */
export function theSlash(v: ViDuSlash): { trai: number[]; phai: number[] } {
  const r = 60 + pc(v.goc)
  return { trai: [40 + pc(v.bass - 4)], phai: lopHop(v.goc, v.chat).map((p) => r + pc(p - v.goc)) }
}
