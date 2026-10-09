import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { AccidentalStyle } from '../../shared/musicTheory/types'
import { kieuDau } from '../vongThay'

/*
  CHỒNG HỢP ÂM (Stack) — người dùng 4/10/2026: "học thật kỹ các kiến thức trong video https://www.youtube.com/watch?v=8fOY4Z8Za6I bắt
  đầu từ 01:20 … cách hình thành Chord extension bằng cách chồng các hợp âm lên nhau, về Inversion (thế đảo), về voicing, về chuyển keys
  cho các voicing … kết hợp thêm khả năng suy luận … để học được đầy đủ về các hợp âm mà các thầy đã dùng trong các sheets".
  Nguồn: Jeff Schneider, "How I Play Jazz Piano Chords – The Chord Stack System" (11:20). Claude đọc PHỤ ĐỀ TỰ ĐỘNG của video (tải bằng
  yt-dlp 4/10/2026), KHÔNG xem hình — thế đảo nào Jeff bấm là theo lời anh ấy nói. Ba công thức `nguon: 'jeff'` là của video; các
  công thức còn lại Claude suy ra theo cùng nguyên tắc (`nguon: 'claude'`), mỗi công thức có test kiểm nốt khớp đúng hợp âm.
  `thay`: thầy nào có hợp âm ấy trong sheet — quét ký hiệu hợp âm 4/10/2026 (Cà Pháo 9 bài, Linh Nhi 8, Tôn Hùng 2); add9 · m(add9) ·
  7sus4 của Linh Nhi đọc từ nốt đệm thật (md Linh Nhi 13d và mục 13k), sheet không ghi ký hiệu ấy.
*/

export type LoaiBa = 'M' | 'm' | 'dim' | 'aug' | 'sus2' | 'sus4' | 'dim7'
export const BA: Record<LoaiBa, { iv: readonly number[]; hau: string; ten: string }> = {
  M: { iv: [0, 4, 7], hau: '', ten: 'trưởng' },
  m: { iv: [0, 3, 7], hau: 'm', ten: 'thứ' },
  dim: { iv: [0, 3, 6], hau: 'dim', ten: 'giảm' },
  aug: { iv: [0, 4, 8], hau: '+', ten: 'tăng' },
  sus2: { iv: [0, 2, 7], hau: 'sus2', ten: 'treo 2' },
  sus4: { iv: [0, 5, 7], hau: 'sus4', ten: 'treo 4' },
  dim7: { iv: [0, 3, 6, 9], hau: 'dim7', ten: 'bảy giảm' },
}

export interface CongThuc {
  id: string
  /** Hậu tố tên hợp âm. */
  kyHieu: string
  nhom: 'Trưởng' | 'Thứ' | 'Nửa giảm · giảm' | 'Át'
  /** Tầng dưới — tay trái: quãng so với gốc (nửa cung). Phần tử đầu là thế mặc định, sau là các thế đảo. */
  duoi: readonly (readonly number[])[]
  tenDuoi: string
  /** Tầng trên — tay phải: một hợp âm (loại, cách gốc bao nhiêu nửa cung) hoặc chùm nốt rời (quãng so với gốc). */
  tren: { loai: LoaiBa; cach: number } | { iv: readonly number[]; ten: string }
  /** Quan hệ tầng trên với gốc — thứ phải nhớ để chuyển giọng (Jeff 05:07: "relationship between the chord we're stacking … and the root"). */
  quanHe: string
  viSao: string
  /** Gốc của ví dụ ở giọng đang chọn: nửa cung so với chủ âm. */
  viDu: { truong: number; thu: number }
  nguon: 'jeff' | 'claude'
  thay: readonly string[]
}

const LN = 'Linh Nhi'
const CP = 'Cà Pháo'
const TH = 'Tôn Hùng'
const DAN = [0, 4, 10] as const
const DAN_DAO = [0, 10, 16] as const
/** Ba thế của một hợp âm ba trên gốc: nguyên vị, đảo 1, đảo 2. */
const daoBa = (iv: readonly number[]) => [iv, [iv[1]!, iv[2]!, iv[0]! + 12], [iv[2]!, iv[0]! + 12, iv[1]! + 12]]

export const CONG_THUC: readonly CongThuc[] = [
  {
    id: 'maj7', kyHieu: 'maj7', nhom: 'Trưởng', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'm', cach: 4 },
    quanHe: 'hợp âm THỨ trên bậc 3',
    viSao:
      'Tầng trên mang 3–5–7: chỉ thêm đúng một nốt mới là bậc 7, nằm dưới gốc nửa cung — chút cọ nhẹ ấy là tiếng mơ màng của maj7. Tầng trên là một hợp âm thứ nên maj7 sáng mà có bóng buồn.',
    viDu: { truong: 0, thu: 3 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: 'maj9', kyHieu: 'maj9', nhom: 'Trưởng', duoi: daoBa([0, 4, 7]), tenDuoi: 'hợp âm trưởng trên gốc', tren: { loai: 'M', cach: 7 },
    quanHe: 'hợp âm TRƯỞNG trên bậc 5 (cao hơn gốc một quãng năm)',
    viSao:
      'Hai hợp âm trưởng cách nhau quãng năm dùng chung bậc 5; tầng trên thêm bậc 7 và 9 — đều là nốt của gam trưởng, và không nốt nào đứng ngay trên một nốt khung nửa cung, nên dày mà trong. Video ví dụ hai thế: Đô đảo 2 + Sol nguyên vị, và Đô đảo 1 + Sol đảo 1 ("crunch" — nốt sát nhau là tốt).',
    viDu: { truong: 0, thu: 8 }, nguon: 'jeff', thay: [CP],
  },
  {
    id: '6', kyHieu: '6', nhom: 'Trưởng', duoi: [[0, 7]], tenDuoi: 'gốc – 5', tren: { loai: 'm', cach: 9 },
    quanHe: 'hợp âm THỨ trên bậc 6',
    viSao:
      'Tầng trên là chính hợp âm vi của giọng: C6 và Am7 cùng bốn nốt, chỉ khác bass. Nốt 6 là nốt gam, cách bậc 5 một cung — ngọt, hơi cổ điển, hay đặt ở hợp âm kết.',
    viDu: { truong: 0, thu: 3 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: '69', kyHieu: '6/9', nhom: 'Trưởng', duoi: [[0, 7]], tenDuoi: 'gốc – 5', tren: { loai: 'sus4', cach: 9 },
    quanHe: 'hợp âm TREO 4 trên bậc 6',
    viSao:
      'Tầng trên 6–9–3 xếp thành hai quãng 4 chồng nhau. Không có bậc 7 nên không có tiếng cọ nào: mở, lửng, rất hợp kết bài trưởng. Chưa thấy trong sheet các thầy — học để biết.',
    viDu: { truong: 0, thu: 3 }, nguon: 'claude', thay: [],
  },
  {
    id: 'add9', kyHieu: 'add9', nhom: 'Trưởng', duoi: [[0, 7]], tenDuoi: 'gốc – 5', tren: { iv: [14, 16, 19], ten: 'chùm 9 – 3 – 5' },
    quanHe: 'nốt 9 đặt sát dưới bậc 3',
    viSao:
      'Chỉ thêm bậc 9. Đặt nó sát dưới bậc 3 cho tiếng crunch; không có bậc 7 nên add9 trong và mộc hơn maj9. Linh Nhi ra màu này bằng tay trái rải 1 – 5 – 8 – 9 – 10: nốt 9 là bước liền đi lên bậc 3 (Đường Xưa Lối Cũ ô 36: Đô – Sol – Đô – Rê – Mi).',
    viDu: { truong: 0, thu: 3 }, nguon: 'claude', thay: [LN],
  },
  {
    id: 'maj9#11', kyHieu: 'maj9#11', nhom: 'Trưởng', duoi: daoBa([0, 4, 7]), tenDuoi: 'hợp âm trưởng trên gốc', tren: { loai: 'm', cach: 11 },
    quanHe: 'hợp âm THỨ trên bậc 7 (thấp hơn gốc nửa cung)',
    viSao:
      'Hợp âm trưởng không nhận nốt 11: Fa trên Đô trưởng đứng ngay trên Mi nửa cung — chỏi. Cần nốt ở tầng ấy thì nâng thành ♯11: màu Lydian, sáng và lơ lửng. Trong gam trưởng bậc IV có sẵn ♯11 (Si trên Fa), nên IVmaj7♯11 là chỗ tự nhiên nhất của màu này; giọng thứ thì ♭VI.',
    viDu: { truong: 5, thu: 8 }, nguon: 'claude', thay: [CP],
  },
  {
    id: 'm7', kyHieu: 'm7', nhom: 'Thứ', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'M', cach: 3 },
    quanHe: 'hợp âm TRƯỞNG trên bậc ♭3',
    viSao:
      'Dm7 là Fa trưởng đặt trên bass Rê. Vì vậy ii7 và IV là một họ — cùng ba nốt trên, chỉ khác bass — nên thay nhau được.',
    viDu: { truong: 2, thu: 5 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: 'm9', kyHieu: 'm9', nhom: 'Thứ', duoi: daoBa([0, 3, 7]), tenDuoi: 'hợp âm thứ trên gốc', tren: { loai: 'm', cach: 7 },
    quanHe: 'hợp âm THỨ trên bậc 5',
    viSao:
      'Cùng khuôn với maj9 của Jeff — hai hợp âm cùng loại cách nhau quãng năm — chỉ đổi trưởng thành thứ: nhớ một ra hai. Tầng trên thêm ♭7 và 9, đều không chỏi với bậc ♭3.',
    viDu: { truong: 2, thu: 0 }, nguon: 'claude', thay: [CP, TH],
  },
  {
    id: 'm11', kyHieu: 'm11', nhom: 'Thứ', duoi: daoBa([0, 3, 7]), tenDuoi: 'hợp âm thứ trên gốc', tren: { loai: 'M', cach: 10 },
    quanHe: 'hợp âm TRƯỞNG thấp hơn gốc một cung',
    viSao:
      'Sáu nốt chia đều hai tay; tầng trên mang ♭7 – 9 – 11. Hợp âm thứ nhận được nốt 11 vì 11 cách bậc ♭3 một cung (Sol trên Fa), không có quãng nửa cung chỏi như trên hợp âm trưởng. Video ví dụ: Rê thứ đảo 2 (La – Rê – Fa) + Đô trưởng đảo 2 (Sol – Đô – Mi).',
    viDu: { truong: 2, thu: 5 }, nguon: 'jeff', thay: [CP],
  },
  {
    id: 'm13', kyHieu: 'm13', nhom: 'Thứ', duoi: [[0, 3, 10]], tenDuoi: 'gốc – ♭3 – ♭7', tren: { loai: 'm', cach: 2 },
    quanHe: 'hợp âm THỨ trên bậc 9 (cao hơn gốc một cung)',
    viSao:
      'Nốt 13 trên hợp âm thứ là bậc 6 trưởng — màu Dorian. ii của giọng trưởng và iv của giọng thứ có sẵn màu này (toàn nốt gam). Đừng đặt m13 lên i của giọng thứ: gam thứ có ♭6, nốt 13 trưởng sẽ lạc giọng.',
    viDu: { truong: 2, thu: 5 }, nguon: 'claude', thay: [CP],
  },
  {
    id: 'm6', kyHieu: 'm6', nhom: 'Thứ', duoi: [[0, 7]], tenDuoi: 'gốc – 5', tren: { loai: 'dim', cach: 9 },
    quanHe: 'hợp âm GIẢM trên bậc 6',
    viSao:
      'Dm6 và Bm7♭5 cùng bốn nốt (Rê – Fa – La – Si): đổi bass là đổi tên. Nên ở giọng thứ, iv6 thay được ii°7 và ngược lại. Nốt 6 trưởng làm hợp âm thứ nghe "jazz", hơi Tây.',
    viDu: { truong: 2, thu: 5 }, nguon: 'claude', thay: [LN, TH],
  },
  {
    id: 'madd9', kyHieu: 'm(add9)', nhom: 'Thứ', duoi: [[0, 7]], tenDuoi: 'gốc – 5', tren: { iv: [14, 15, 19], ten: 'chùm 9 – ♭3 – 5' },
    quanHe: 'nốt 9 đặt sát dưới bậc ♭3',
    viSao:
      '9 và ♭3 cách nhau nửa cung nên đặt sát là crunch đậm — buồn mà sang. Đặt 9 cao lên (rải 1 – 5 – 8 – 9 – 10) thì dịu hẳn: đó là cách Linh Nhi rải tay trái trên i và iv của bài thứ (Nỗi Buồn Hoa Phượng ô 36: Rê – La – Rê – Mi – Fa).',
    viDu: { truong: 9, thu: 0 }, nguon: 'claude', thay: [LN],
  },
  {
    id: 'mMaj7', kyHieu: 'm(maj7)', nhom: 'Thứ', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'aug', cach: 3 },
    quanHe: 'hợp âm TĂNG trên bậc ♭3',
    viSao:
      'Bậc 7 trưởng trên hợp âm thứ — nốt cảm âm của gam thứ hòa âm. Hay đứng giữa một đường bè đi xuống nửa cung trên chủ: i – i(maj7) – i7 – i6 (La – Sol♯ – Sol – Fa♯). Đứng một mình thì nghe kịch tính.',
    viDu: { truong: 9, thu: 0 }, nguon: 'claude', thay: [LN, CP],
  },
  {
    id: 'm7b5', kyHieu: 'm7b5', nhom: 'Nửa giảm · giảm', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'm', cach: 3 },
    quanHe: 'hợp âm THỨ trên bậc ♭3',
    viSao:
      'Bm7♭5 là Rê thứ trên bass Si: ii° và iv của giọng thứ là một họ. Ở Một Cõi Đi Về ô 49 – 51, Linh Nhi đi Cm → Am7♭5 → D7: tay trái giữ nguyên Đô – Mi♭ – Sol, chỉ dời bass Đô xuống La; rồi Mi♭ xuống Rê, Sol xuống Fa♯ để vào D7.',
    viDu: { truong: 11, thu: 2 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: 'm11b5', kyHieu: 'm11b5', nhom: 'Nửa giảm · giảm', duoi: [[0, 6]], tenDuoi: 'gốc – ♭5', tren: { loai: 'sus2', cach: 3 },
    quanHe: 'hợp âm TREO 2 trên bậc ♭3',
    viSao: 'Thêm nốt 11 vào m7♭5 — nốt gam, cách ♭3 một cung — làm hợp âm nửa giảm bớt căng, nghe mềm như m11.',
    viDu: { truong: 11, thu: 2 }, nguon: 'claude', thay: [CP],
  },
  {
    id: 'dim7', kyHieu: 'dim7', nhom: 'Nửa giảm · giảm', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'dim', cach: 3 },
    quanHe: 'hợp âm GIẢM trên bậc ♭3',
    viSao:
      'Chồng toàn quãng ba thứ nên đảo kiểu nào cũng ra một dim7 khác tên — cả 12 nốt chỉ có 3 hợp âm dim7. G♯°7 là E7♭9 bỏ gốc: hợp âm giảm làm việc của V. Trong đệm hát hay dùng làm hợp âm lướt nửa cung (C – C♯°7 – Dm).',
    viDu: { truong: 11, thu: 11 }, nguon: 'claude', thay: [LN],
  },
  {
    id: '7', kyHieu: '7', nhom: 'Át', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'dim', cach: 4 },
    quanHe: 'hợp âm GIẢM trên bậc 3',
    viSao:
      'Ba nốt trên của G7 (Si – Rê – Fa) chính là vii° — nên vii° là "V7 thiếu gốc". Cặp Si – Fa cách nhau ba cung: Si muốn lên Đô, Fa muốn xuống Mi. Giữ cặp này là giữ chức năng át; mọi màu khác của át đắp lên trên nó.',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: '9', kyHieu: '9', nhom: 'Át', duoi: [[0, 4]], tenDuoi: 'gốc – 3', tren: { loai: 'm', cach: 7 },
    quanHe: 'hợp âm THỨ trên bậc 5',
    viSao: 'Nốt 9 là nốt gam — át mà êm; hợp khi giai điệu đứng ở bậc 9, hoặc khi không cần kéo gắt.',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [LN, CP],
  },
  {
    id: '13', kyHieu: '13', nhom: 'Át', duoi: [DAN, DAN_DAO], tenDuoi: 'gốc – 3 – ♭7', tren: { loai: 'm', cach: 9 },
    quanHe: 'hợp âm THỨ trên bậc 13 (bậc 6)',
    viSao:
      'Nốt 13 (Mi trên G7) là nốt gam và chính là bậc 3 của hợp âm đích Đô — G13 → C có một nốt đứng yên ở tầng trên, nghe liền. Không đặt 11 thường lên át: Đô đứng trên Si nửa cung, chỏi.',
    viDu: { truong: 7, thu: 10 }, nguon: 'claude', thay: [LN, CP, TH],
  },
  {
    id: '9sus4', kyHieu: '9sus4', nhom: 'Át', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'M', cach: 10 },
    quanHe: 'hợp âm TRƯỞNG thấp hơn gốc một cung (cùng quan hệ với tầng trên của m11)',
    viSao:
      'Không có bậc 3 nên không có nốt cảm âm: át mà không "đòi" — kéo về nhẹ, mềm. Mẹo: G9sus4 = F/G = Dm7/G, tức hợp âm ii đặt trên bass của V. Bỏ nốt 9 thì thành 7sus4 — Linh Nhi bấm A7sus4 (La – Rê – Mi – Sol) ở Mùa Xuân Đầu Tiên và Lá Thư Trần Thế. Cà Pháo ghi hợp âm này là "11".',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [CP, LN],
  },
  {
    id: '7b9', kyHieu: '7b9', nhom: 'Át', duoi: [[0]], tenDuoi: 'gốc', tren: { loai: 'dim7', cach: 4 },
    quanHe: 'hợp âm BẢY GIẢM trên bậc 3',
    viSao:
      'Nốt ♭9 đứng trên gốc nửa cung — căng, tối — và giải xuống bậc 5 của hợp âm đích. Ở giọng THỨ, ♭9 của V là nốt có sẵn: E7♭9 trong La thứ thêm Fa, chính bậc ♭6 của giọng. Vì vậy V7♭9 ở bài thứ nghe tự nhiên, còn ở bài trưởng là mượn màu thứ.',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [CP],
  },
  {
    id: '13b9', kyHieu: '13b9', nhom: 'Át', duoi: [DAN, DAN_DAO], tenDuoi: 'gốc – 3 – ♭7', tren: { loai: 'M', cach: 9 },
    quanHe: 'hợp âm TRƯỞNG trên bậc 13',
    viSao:
      'Mi trưởng trên vỏ G7: Mi (13) đứng yên sang Đô, Sol♯ (= La♭, ♭9) giải xuống Sol, Si (3) lên Đô. Ngọt và căng cùng lúc.',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [CP],
  },
  {
    id: '13#11', kyHieu: '13#11', nhom: 'Át', duoi: [DAN, DAN_DAO], tenDuoi: 'gốc – 3 – ♭7', tren: { loai: 'M', cach: 2 },
    quanHe: 'hợp âm TRƯỞNG trên bậc 9 (cao hơn gốc một cung)',
    viSao:
      'Tầng trên 9 – ♯11 – 13: sáng, lơ lửng — "át Lydian"; ♯11 né được chỗ chỏi của 11 thường. Chỗ tự nhiên của màu này là ♭II7 (thay thế ba cung của V): Rê♭13♯11 → Đô có ♯11 là Sol, chính bậc 5 của Đô — một nốt đứng yên. Cà Pháo ghi 9♯11 và 13♯11.',
    viDu: { truong: 1, thu: 1 }, nguon: 'claude', thay: [CP],
  },
  {
    id: '7b13', kyHieu: '7b13', nhom: 'Át', duoi: [DAN, DAN_DAO], tenDuoi: 'gốc – 3 – ♭7', tren: { loai: 'aug', cach: 8 },
    quanHe: 'hợp âm TĂNG trên bậc ♭13',
    viSao:
      'Ở giọng thứ, ♭13 của V chính là bậc ♭3 của chủ: E7♭13 → Am giữ nguyên Đô. Giai điệu bài thứ hay ngân đúng nốt này trên V — Một Cõi Đi Về: giai điệu ngân Si♭ trong khi tay trái bấm D7 đủ Fa♯, thành D7♭13. Thêm bậc 9 thì là 9♭13 (Cà Pháo có cả hai).',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [CP],
  },
  {
    id: '7b5', kyHieu: '7b5', nhom: 'Át', duoi: [[0]], tenDuoi: 'gốc', tren: { iv: [4, 6, 10], ten: 'chùm 3 – ♭5 – ♭7' },
    quanHe: 'bậc 5 hạ nửa cung',
    viSao:
      'Hợp âm đối xứng: G7♭5 và D♭7♭5 cùng bốn nốt (Sol – Si – Rê♭ – Fa), nên nó đứng giữa V7 và hợp âm thay thế ba cung. Rê♭ giải xuống Đô.',
    viDu: { truong: 7, thu: 7 }, nguon: 'claude', thay: [CP],
  },
  {
    id: '13b9#11', kyHieu: '13b9#11', nhom: 'Át', duoi: [DAN, DAN_DAO], tenDuoi: 'gốc – 3 – ♭7 (video: chỉ 3 và 7)', tren: { loai: 'm', cach: 6 },
    quanHe: 'hợp âm THỨ cách gốc ba cung (♭5 / ♯4)',
    viSao:
      'Tầng trên ♯11 – 13 – ♭9 (Rê♭ – Fa♭ – La♭ trên G7): mỗi nốt đứng sát một nốt của Cmaj9 — La♭ xuống Sol, Rê♭ xuống Đô, Fa♭ (= Mi) đứng yên. Jeff: "rất chỏi, nhưng giải về Cmaj9 thì nghe tuyệt — tương phản giữa căng và êm". Thêm (Claude): Rê♭ thứ là nửa trên của Rê♭7, hợp âm thay thế ba cung của G7 (chung cặp Si – Fa) — nên hợp âm này là G7 pha Rê♭7. Đàn một mình thì thêm gốc ở dưới; video để bass lo gốc.',
    viDu: { truong: 7, thu: 7 }, nguon: 'jeff', thay: [],
  },
]

const pc = (x: number) => ((x % 12) + 12) % 12

/* ---------------- Gọi tên theo CHỮ CÁI (♭II là Rê♭ chứ không Đô♯; nốt cảm âm Rê thứ là Đô♯) ---------------- */

const CHU = 'CDEFGAB'
const PC_CHU = [0, 2, 4, 5, 7, 9, 11]
/** Nửa cung → số chữ cái cách gốc: ♭2 và 2 đều là chữ thứ hai, ♯4 là chữ thứ tư, ♭7 và 7 là chữ thứ bảy. */
const CHU_CUA = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6]

/**
 * Tên nốt (C, Bb, F#) cách nốt `goc` (tên) `semi` nửa cung và `chu` chữ cái. Ra Fb · Cb · E# · B# hay hai dấu thì lùi về cách ghi
 * thường của giọng — đọc cho dễ (Jeff gọi tầng trên của B♭13♭9♯11 là "E minor", không phải F♭ thứ).
 */
export function tenTheoChu(goc: string, semi: number, chu: number, style: AccidentalStyle): string {
  const c0 = CHU.indexOf(goc[0]!)
  const gocPc = pc(PC_CHU[c0]! + (goc[1] === '#' ? 1 : goc[1] === 'b' ? -1 : 0))
  const c = (c0 + chu) % 7
  const lech = pc(gocPc + semi - PC_CHU[c]! + 6) - 6
  const ten = CHU[c]! + (lech > 0 ? '#'.repeat(lech) : 'b'.repeat(-lech))
  return Math.abs(lech) > 1 || ['Fb', 'Cb', 'E#', 'B#'].includes(ten) ? pitchClassName(pc(gocPc + semi), style) : ten
}

/** Tên nốt cách chủ âm `semi` nửa cung; `bac` (1–7) ép chữ cái — vd nốt cảm âm giọng thứ là bậc 7. */
export function tenTrongGiong(tonic: number, thu: boolean, semi: number, bac?: number): string {
  const style = kieuDau(tonic, thu)
  return tenTheoChu(pitchClassName(pc(tonic), style), semi, bac ? bac - 1 : CHU_CUA[pc(semi)]!, style)
}

const SOL: Record<string, string> = { C: 'Đô', D: 'Rê', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }
/** Tên Việt của nốt: 'Bb' → 'Si♭', 'C#' → 'Đô♯'. */
export const vn = (ten: string) => `${SOL[ten[0]!] ?? ten[0]}${ten.slice(1).replace(/#/g, '♯').replace(/b/g, '♭')}`
/** Hậu tố hợp âm đẹp: 'm7b5' → 'm7♭5', '13#11' → '13♯11'. */
export const hauDep = (chat: string) => chat.replace(/^madd(\d+)/, 'm(add$1)').replace(/b(\d)/g, '♭$1').replace(/#/g, '♯')
/** Tên gốc đẹp: 'Bb' → 'B♭'. */
export const gocDep = (ten: string) => ten.replace(/#/g, '♯').replace(/^([A-G])b/, '$1♭')

/** Quãng (so với gốc) của tầng trên ở một thế đảo. Chùm nốt rời không đảo. */
export function quangTren(ct: CongThuc, dao = 0): number[] {
  if ('iv' in ct.tren) return [...ct.tren.iv]
  const g = ct.tren
  let iv = BA[g.loai].iv.map((x) => g.cach + x)
  for (let k = 0; k < dao % iv.length; k++) iv = [...iv.slice(1), iv[0]! + 12]
  return iv
}

export const soThe = (ct: CongThuc) => ('iv' in ct.tren ? 1 : BA[ct.tren.loai].iv.length)

/**
 * Thế bấm hai tay: tay trái gốc ở G2–F♯3; tay phải đặt ngay trên nốt cao nhất tay trái (không chồng tay).
 * Nốt tuyệt đối, để chỉ trên bàn phím và phát tiếng.
 */
export function theBamChong(ct: CongThuc, gocPc: number, daoDuoi = 0, daoTren = 0): { trai: number[]; phai: number[] } {
  let goc = 48 + pc(gocPc)
  if (goc > 54) goc -= 12
  const trai = (ct.duoi[daoDuoi] ?? ct.duoi[0]!).map((x) => goc + x)
  const iv = quangTren(ct, daoTren)
  const cao = Math.max(...trai)
  let phai = iv.map((x) => goc + x)
  while (Math.min(...phai) <= cao) phai = phai.map((x) => x + 12)
  while (Math.min(...phai) - 12 > cao) phai = phai.map((x) => x - 12)
  return { trai, phai }
}

/** Tên tầng trên, gọi theo chữ cái tính từ tên gốc hợp âm: 'Db' + 'm' (G13♭9♯11 — đúng tên Jeff gọi); chùm nốt rời thì tên chùm. */
export function tenTren(ct: CongThuc, gocTen: string, style: AccidentalStyle): string {
  if ('iv' in ct.tren) return ct.tren.ten
  const { cach, loai } = ct.tren
  return gocDep(tenTheoChu(gocTen, cach, cach === 6 ? 4 : CHU_CUA[cach]!, style)) + BA[loai].hau
}

/** Chữ cái của nốt hợp âm theo quãng: ♭5 là chữ thứ năm (Rê♭ trên Sol), không phải ♯4. */
const CHU_HOP = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6]
const CHU_BA: Record<LoaiBa, readonly number[]> = {
  M: [0, 2, 4], m: [0, 2, 4], dim: [0, 2, 4], aug: [0, 2, 4], sus2: [0, 1, 4], sus4: [0, 3, 4], dim7: [0, 2, 4, 6],
}

/** Tên Việt các nốt hai tay, đúng thứ tự của `theBamChong`. Tầng trên gọi theo chữ cái chồng quãng ba từ gốc của chính nó. */
/**
 * Nhãn hai tay — người dùng 8/10/2026: "tay trái bấm hợp âm gì thì ghi tên bên phía tay trái và tương tự với tay phải. Sau đó hãy ghi
 * tên của hợp âm tổng ở phía dưới". Tay trái là hợp âm ba thì gọi tên hợp âm (phụ: các nốt); còn lại ghi các nốt (phụ: vai — gốc – 5…).
 */
export function nhanHaiTay(ct: CongThuc, gocTen: string, style: AccidentalStyle, daoDuoi = 0, daoTren = 0) {
  const not = tenHaiTay(ct, gocTen, style, daoDuoi, daoTren)
  const ba = [...ct.duoi[0]!].map(pc).sort((x, y) => x - y).join()
  const hop = ba === '0,4,7' ? gocDep(gocTen) : ba === '0,3,7' ? `${gocDep(gocTen)}m` : null
  return {
    trai: hop ?? not.trai.join(' – '),
    traiPhu: hop ? not.trai.join(' – ') : ct.tenDuoi,
    phai: 'iv' in ct.tren ? ct.tren.ten : tenTren(ct, gocTen, style),
    phaiPhu: not.phai.join(' – '),
    tong: `${gocDep(gocTen)}${hauDep(ct.kyHieu)}`,
  }
}

export function tenHaiTay(ct: CongThuc, gocTen: string, style: AccidentalStyle, daoDuoi = 0, daoTren = 0) {
  const quang = (iv: number) => vn(tenTheoChu(gocTen, iv, CHU_HOP[pc(iv)]!, style))
  const trai = (ct.duoi[daoDuoi] ?? ct.duoi[0]!).map(quang)
  if ('iv' in ct.tren) return { trai, phai: ct.tren.iv.map(quang) }
  const { cach, loai } = ct.tren
  const goc3 = tenTheoChu(gocTen, cach, cach === 6 ? 4 : CHU_CUA[cach]!, style)
  let phai = BA[loai].iv.map((x, k) => vn(tenTheoChu(goc3, x, CHU_BA[loai][k]!, style)))
  for (let k = 0; k < daoTren % phai.length; k++) phai = [...phai.slice(1), phai[0]!]
  return { trai, phai }
}

/** Lớp cao độ của tầng trên — để chấm câu đố chuyển giọng. */
export const pcsTren = (ct: CongThuc, gocPc: number) => [...new Set(quangTren(ct).map((x) => pc(gocPc + x)))]

/** Đố chuyển giọng được — tầng trên phải là MỘT hợp âm có tên. */
export const DO_DUOC = CONG_THUC.filter((ct) => !('iv' in ct.tren))
