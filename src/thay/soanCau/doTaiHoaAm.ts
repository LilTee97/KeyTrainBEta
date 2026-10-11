import type { ParsedChord } from '../../reharm/types'
import { lyDoThay, nguCanh, type Hop } from './giaiThich'
import { cacLuaChon, ho, LOAI } from './thayTrongVong'

/*
  ĐỐ TÁI HÒA ÂM — người dùng 11/10/2026: "Khi tôi nhập một vòng hòa âm vào thì bạn hãy đố tôi chọn các hợp âm nào để tái hòa âm … theo
  từng phong cách của CP, Linh Nhi và Blues … ra thêm phong cách thứ 4 … xác định đâu là chủ âm (vì ko phải lúc nào âm chủ cũng nằm ở
  ngay đầu vòng) sau đó tái hòa âm chủ âm sẵn cho tôi. Các hợp âm còn lại bạn sẽ cho tôi chọn trắc nghiệm và có tính năng gợi ý".
  Luật ba thầy: mỗi luật trỏ về lời "bài ghi X → thầy bấm Y" đã duyệt (`lyDoThay`) — số đo nằm ở đó. Bậc không có luật: đáp án suy từ
  lối chung của thầy, lời ghi rõ là suy luận. Phong cách thứ tư là TƯ DUY CỦA CLAUDE, không phải số đo: ghép màu tay phải (Cà Pháo),
  bass đi liền bậc (Linh Nhi), nửa cung và thay tam cung (Blues).
  LỜI GIA SƯ + MẸO — người dùng 11/10/2026 (ảnh lời giải Dm11): "Trong vai một gia sư piano tận tâm, hãy giải thích tại sao ở lại chọn
  các hợp âm đó ở những chỗ tương ứng, áp dụng lên tất cả các thầy — rõ ràng làm sao cho một học sinh lớp 6 hiểu được — kết hợp cảm giác
  nghe sẽ như nào, đừng quá máy móc — tìm ra mẹo từ các điểm chung". Mỗi luật có `giang` (lời gia sư: chỗ ấy là chỗ gì, thầy thêm / đổi
  nốt nào, nghe ra sao, vì sao) và `meo` (một mẹo chung trong `MEO`). Lời cũ của thầy giữ làm "lời chi tiết".
*/

export type PhongCach = 'ca-phao' | 'linh-nhi' | 'blues' | 'claude'
export const PHONG_CACH: readonly { id: PhongCach; ten: string; tom: string }[] = [
  {
    id: 'ca-phao',
    ten: 'Cà Pháo',
    tom: 'Đi đúng đường của bài, phủ màu lên từng hợp âm: hợp âm thứ thêm ♭7, 9; I add9; V treo rồi thêm 13; vài chỗ đổi hẳn (I7 trước iv, II7 trước V, ♭VI thành iv9).',
  },
  {
    id: 'linh-nhi',
    ten: 'Linh Nhi',
    tom: 'Giữ hợp âm của bài là chính; cái riêng là màu tay trái rải (add9) và hợp âm chèn cho bass đi liền bậc (♭VII, ii°, iii).',
  },
  { id: 'blues', ten: 'Blues', tom: 'Hợp âm bảy át khắp nơi (đưa nốt blue vào hòa âm), V7♯9, hợp âm lướt nửa cung, thay tam cung ở câu kết.' },
  {
    id: 'claude',
    ten: 'Nhạc sĩ (Claude)',
    tom: 'Phong cách thứ tư — tư duy của Claude, ghép ba thầy: màu tay phải của Cà Pháo, bass đi liền bậc của Linh Nhi, nửa cung và thay tam cung của Blues. Mỗi hợp âm có màu; mỗi lần đổi hợp âm, bass đi liền bậc hay nửa cung.',
  },
]

/*
  MẸO CHUNG — rút từ điểm chung giữa các thầy. Số "Đo 11/10/2026": phần hát 7 bài Cà Pháo (428 hợp âm) và 8 bài Linh Nhi (616 hợp âm),
  `tools/meo_chung_thay.py` (pipeline `hop_am_linh_nhi.doan_hat`, màu như `tach_lua_chon.py`: nốt đệm vang ≥ 8 % thời lượng hợp âm; hợp âm
  liền nhau cùng gốc + loại gộp một) — mỗi số dưới đây là một dòng tool ấy in ra. Khác cách đếm "đoạn" trong lời thầy — không so hai loại
  số. Blues không có trong kho ấy: số lấy từ md Blues (đã có trong lời thầy). Ví dụ viết ở Đô trưởng / La thứ.
*/
export type MeoId =
  | 'nha'
  | 'truoc-v'
  | 'v-cang'
  | 'at-phu'
  | 'bass-buoc'
  | 'not-nha'
  | 'doi-bass'
  | 'maj7'
  | 'giam'
  | 'tam-cung'
  | 'muon'
  | 'thay-cp'
  | 'ln-giu'
  | 'blues-7'
  | 'thay-claude'
export interface Meo {
  id: MeoId
  nhom: 'Theo vị trí trong vòng' | 'Theo đuôi và cách bấm' | 'Nhận ra từng thầy'
  ten: string
  cau: string
  nghe: string
  coSo: string
}
export const MEO_CHUNG: readonly Meo[] = [
  {
    id: 'nha',
    nhom: 'Theo vị trí trong vòng',
    ten: 'Ô nhà: thêm màu "yên", không thêm nốt kéo',
    cau: 'Hợp âm chủ là chỗ câu nhạc được nghỉ. Chỉ thêm nốt làm nó rộng ra mà không làm nó muốn đi: bài trưởng thêm 9 hay 7 trưởng (C → Cadd9, Cmaj7, Cmaj9); bài thứ thêm 9 hay 7 (Am → Am(add9), Am7, Am9). Ngoại lệ: Blues cho nhà thêm ♭7 (C7) — nhà của blues không đứng yên.',
    nghe: 'Như kê thêm gối nệm: nhà vẫn là nhà, chỉ êm và rộng hơn.',
    coSo: 'Đo 11/10/2026: I có 9 · maj7 · 6 — Cà Pháo 20/34, Linh Nhi 25/58; i có 9 · 7 — Cà Pháo 38/55, Linh Nhi 51/100. Linh Nhi không cho I trưởng ♭7 (0/58). Blues: Ray ký hiệu I7 ở 27/47 chỗ I.',
  },
  {
    id: 'truoc-v',
    nhom: 'Theo vị trí trong vòng',
    ten: 'Ô ngay trước V: ô "lấy đà"',
    cau: 'Trước V thường là hợp âm "chuẩn bị": bài trưởng là ii hay IV (Dm, F trước G); bài thứ là iv hay ii° (Dm, B° trước E). Thầy hay thêm 7 cho nó (Dm7, Bm7♭5) — hoặc đổi hẳn thành hợp âm kéo V (D7 trước G, B7 trước E — xem mẹo nam châm).',
    nghe: 'Như nhón chân lấy đà trước khi nhảy.',
    coSo: 'Đo 11/10/2026 — hợp âm đứng ngay trước V: ii · IV · II ở bài trưởng Cà Pháo 17/34, Linh Nhi 16/35; iv · ii° · II ở bài thứ Cà Pháo 15/20, Linh Nhi 14/40. ii trước V có ♭7: Cà Pháo 8/10. ii° trước V có ♭7: Cà Pháo 3/5, Linh Nhi 5/6.',
  },
  {
    id: 'v-cang',
    nhom: 'Theo vị trí trong vòng',
    ten: 'V: nốt căng lấy từ chính gam của bài',
    cau: 'V là hợp âm được "cay" nhất. Nốt căng thêm vào lấy từ gam của bài: bài Đô trưởng, G thêm La (9), Mi (13) → G9, G13; bài La thứ, E thêm Đô (♭13), Fa (♭9) → E7♭13, E7♭9. Blues thêm ♯9 (G7♯9). Muốn chậm lại thì treo trước: G7sus4 rồi mới thả.',
    nghe: 'Bài trưởng: ấm, tròn. Bài thứ: tối, nghẹn — V như mang sẵn nỗi buồn của nhà. Blues: gắt, đầy sức sống.',
    coSo: 'Đo 11/10/2026 — V bài trưởng có 9 · 13: Cà Pháo 18/35, Linh Nhi 11/42; có ♭9 · ♭13: Cà Pháo 0/35, Linh Nhi 2/42. V bài thứ có ♭9 · ♭13: Cà Pháo 8/21, Linh Nhi 8/42. Blues: ♯9 vang 45 % đơn vị V (Ray, n=22).',
  },
  {
    id: 'at-phu',
    nhom: 'Theo vị trí trong vòng',
    ten: 'Nam châm (át phụ): muốn hợp âm sau được kéo tới',
    cau: 'Biến hợp âm đứng trước nó thành hợp âm 7 trưởng có gốc cao hơn nó một quãng năm (đếm lên 5 nốt). Trước F → C7; trước G → D7; trước Dm → A7; trước Am → E7. Điều kiện: giọng hát không đứng trên nốt vừa bị nâng.',
    nghe: 'Lóe sáng một khoảnh khắc rồi đổ vào — có lực, có hướng.',
    coSo: 'Đo 11/10/2026 — không kể V → I: Cà Pháo 21 chỗ (I7 → IV 9, ♭VII7 → ♭III 4, I7 → iv 3), Linh Nhi 15 chỗ (II7 → V 6, I7 → iv 6, ♭VII7 → ♭III 3). Ba lối chung cả hai thầy: I7 → IV/iv, II7 → V, ♭VII7 → ♭III. Phong cách thứ tư thêm nốt căng: đích thứ dùng ♭9 (A7♭9 → Dm) — tư duy của Claude.',
  },
  {
    id: 'bass-buoc',
    nhom: 'Theo vị trí trong vòng',
    ten: 'Bass nhảy xa → chèn cho bass bước',
    cau: 'Thấy bass phải nhảy xa (I → vi, i → ♭VI, iv → V) mà ô đủ dài: chèn một hợp âm ở nửa sau ô cho bass bước từng bậc. Đô trưởng: C – C/B – Am. La thứ: Am – G – F; Dm – Bm7♭5 – E.',
    nghe: 'Bass như người đi bộ xuống cầu thang — liền, có hướng, buồn dần.',
    coSo: 'Đo 11/10/2026: ở chỗ đổi hợp âm bass phần lớn vẫn nhảy (Cà Pháo 243/395, Linh Nhi 410/580) — nên bước liền là điểm nhấn. Chỗ chèn của Linh Nhi: ♭VII giữa i và ♭VI (11 chỗ), ii° trước V (12 chỗ), nốt bass 7 dẫn I → vi (12 chỗ). Phong cách thứ tư dùng ở mọi chỗ có thể — tư duy của Claude.',
  },
  {
    id: 'not-nha',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'Mượn nốt của nhà làm màu',
    cau: 'Một cách chọn màu chắc ăn: thêm nốt của hợp âm nhà (Đô – Mi – Sol ở Đô trưởng; La – Đô – Mi ở La thứ), miễn nốt ấy không đứng sát nửa cung một nốt của hợp âm. Đô trưởng: Dm thêm Đô → Dm7 (thêm cả Mi, Sol → Dm11); F thêm Mi → Fmaj7; Am thêm Sol → Am7; G thêm Mi → G13. La thứ: F thêm Mi → Fmaj7; E thêm Đô → E7♭13; G thêm La → Gadd9; Dm thêm Đô, Mi → Dm9.',
    nghe: 'Hợp âm "dính" với nhà — đi đâu cũng còn hơi ấm của nhà, chuyển hợp âm nghe liền. Nốt sát nửa cung thì cọ: vì thế G không thêm Đô (sát Si) mà treo luôn (G7sus4 — bỏ Si).',
    coSo: 'Đo 11/10/2026 — các màu này đều là nốt của nhà: ii trước V có ♭7 (Cà Pháo 8/10), IV maj7 (Cà Pháo 8/20), vi ♭7 (Cà Pháo 11/18), V 13 (Cà Pháo 7/35), ♭VI maj7 (Cà Pháo 23/46, Linh Nhi 19/42), V ♭13 bài thứ (Cà Pháo 8/21), ♭VII 9 (Cà Pháo 11/35, Linh Nhi 10/28). Không đúng mọi chỗ: màu hay gặp nhất của V là ♭7 (Cà Pháo 19/35) — nốt kéo, không phải nốt nhà. "Nghe dính với nhà" là suy luận của Claude.',
  },
  {
    id: 'doi-bass',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'Đổi bass, giữ tay phải: hợp âm "khó" là hợp âm ba dễ trên một bass khác',
    cau: 'Nhiều hợp âm 7 chỉ là một hợp âm ba đặt trên bass thấp hơn nó một quãng ba. Trưởng trên bass thấp hơn quãng ba thứ → thứ 7: Am7 = C trên bass La; Dm7 = F trên Rê; Em7 = G trên Mi. Thứ trên bass thấp hơn quãng ba trưởng → maj7: Fmaj7 = Am trên Fa; Cmaj7 = Em trên Đô. Thứ trên bass thấp hơn quãng ba thứ → m7♭5: Bm7♭5 = Dm trên Si.',
    nghe: 'Tay phải đứng yên, chỉ bass đi: cảnh đổi mà không nhảy — tầng trên vẫn ở chỗ cũ, nền dưới chân trượt đi.',
    coSo: 'Linh Nhi: ♭VImaj7 = i trên bass ♭6 (bản phổ biến không ghi maj7 ở 0/19 chỗ chị có), ii°7 = iv trên bass ii (12 chỗ chèn). Cà Pháo: vi m7 = I trên bass vi, i m7 = ♭III trên bass i (ô soát tay trong lời thầy). Quy tắc quãng ba là lý thuyết.',
  },
  {
    id: 'maj7',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'maj7 và ♯11: màu của hợp âm trưởng "đứng ngắm cảnh" — không bao giờ cho V',
    cau: 'maj7 (thêm nốt sát dưới gốc: F → Fmaj7 thêm Mi) làm hợp âm trưởng mơ màng. Đặt ở hợp âm trưởng đứng yên: I, IV ở bài trưởng; ♭III, ♭VI ở bài thứ (La thứ: C → Cmaj7, F → Fmaj7). Không đặt lên V — V cần ♭7 để kéo về nhà. ♯11 (F thêm Si) lấp lánh hơn nữa — chỗ quen là ♭VI của bài thứ.',
    nghe: 'Mơ, hoài niệm, như phủ một lớp sương; ♯11 thì lấp lánh, bay.',
    coSo: 'Đo 11/10/2026 — maj7 nằm ở I · IV (bài trưởng) hay ♭III · ♭VI (bài thứ): Cà Pháo 42/49, Linh Nhi 48/58; trên V: Cà Pháo 1/49, Linh Nhi 4/58. ♭VI có maj7: Cà Pháo 23/46, Linh Nhi 19/42. ♯11 nằm ở ♭VI bài thứ: Cà Pháo 8/15, Linh Nhi 7/24.',
  },
  {
    id: 'giam',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'Hợp âm giảm: đứng trước V, hoặc lướt nửa cung',
    cau: 'Hợp âm giảm hiếm khi đứng một mình. Hai việc: (1) ii° ngay trước V — La thứ: Bm7♭5 → E; (2) lướt: đặt nó ngay dưới hợp âm sau nửa cung — Đô trưởng: F → F♯dim7 → G, C → C♯dim7 → Dm.',
    nghe: 'Hồi hộp, sang, như nhón chân qua một bậc thang — kiểu piano phòng trà.',
    coSo: 'Đo 11/10/2026 — hợp âm giảm đi lên quãng 4 (kiểu ii° → V): Cà Pháo 6/9, Linh Nhi 7/24; lướt lên nửa cung: Linh Nhi 6/24; Linh Nhi còn đi i – ii° – ♭III (7/24). Ray (Blues): ♯IV° nửa cung dưới V ở ô 11–12.',
  },
  {
    id: 'tam-cung',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'Trượt nửa cung vào đích (thay tam cung)',
    cau: 'Muốn vào một hợp âm thật mượt: đặt hợp âm 7 có bass nửa cung trên nó. Đô trưởng: D♭7 → C thay cho G7 → C (hai hợp âm chung cặp nốt Si – Fa). La thứ: F7 → E (bass Fa trượt xuống Mi).',
    nghe: 'Trượt vào như đi trên băng — trơn, sang, rất jazz.',
    coSo: 'Ray: ♭II7 → I13 ở đuôi kết; Robert: ♭II7 → I (5/98 ký hiệu). Blues thứ: ♭VI7 → V (Rising Sun 2 chỗ). Phong cách thứ tư dùng mọi lần V → I — tư duy của Claude.',
  },
  {
    id: 'muon',
    nhom: 'Theo đuôi và cách bấm',
    ten: 'Mượn từ giọng thứ cùng tên: IV → iv khi khép lại',
    cau: 'Bài trưởng muốn một chỗ khép lại buồn: mượn hợp âm của giọng thứ cùng chủ âm — F → Fm (hạ La xuống La♭) trước khi về C.',
    nghe: 'Một nốt hạ nửa cung mà cả bài tối lại — như nắng chiều tắt dần mà vẫn về nhà.',
    coSo: 'Linh Nhi: iv mượn ngân suốt đoạn kết Đường Xưa (1 bài — n nhỏ). IV → iv → I là lý thuyết.',
  },
  {
    id: 'thay-cp',
    nhom: 'Nhận ra từng thầy',
    ten: 'Cà Pháo: màu trên mọi hợp âm, đường đi giữ của bài',
    cau: 'Anh giữ đường hợp âm của bài, đổi độ dày: hợp âm thứ thêm 7, ♭VI thêm maj7, V thêm 9 · 13 (bài thứ ♭13), I thêm 9. Vài chỗ đổi hẳn: i → I7 trước iv, ii° → II7 trước V, I → II13 trước V.',
    nghe: 'Bài hát quen mà mềm, sang hơn — tiếng ballad nhạc trẻ.',
    coSo: 'Đo 11/10/2026: hợp âm thứ có ♭7 — Cà Pháo 99/166, Linh Nhi 64/269 (cùng cách đo). Lời thầy: 309/400 hợp âm phần hát cùng gốc và loại với bản phổ biến.',
  },
  {
    id: 'ln-giu',
    nhom: 'Nhận ra từng thầy',
    ten: 'Linh Nhi: giữ hợp âm của bài, màu ở tay trái, chèn cho bass bước',
    cau: 'Chị gần như bấm đúng hợp âm của bài — ở những chỗ ấy đáp án là "giữ nguyên". Màu của chị nằm ở tay trái rải (nốt 9 tự hiện ra), và vài hợp âm chèn cho bass đi liền (♭VII, ii°, iii, I/7). V ở bài trưởng chị để trơn.',
    nghe: 'Bolero mộc, nhưng tay trái có câu nhạc riêng.',
    coSo: 'Lời thầy: 422/616 hợp âm phần hát cùng gốc và loại với bản phổ biến (8 bài). Đo 11/10/2026: hợp âm thứ có ♭7 64/269; V bài trưởng có ♭7 7/42.',
  },
  {
    id: 'blues-7',
    nhom: 'Nhận ra từng thầy',
    ten: 'Blues: hợp âm 7 khắp nơi',
    cau: 'Blues biến I, IV, V — và gần như mọi hợp âm trưởng — thành hợp âm 7: C7, F7, G7. Nốt ♭7 ấy chính là nốt blue: cả ban nhạc cùng "rên".',
    nghe: 'Bụi, lười, đục — chất blues.',
    coSo: 'Ray (Rockhouse): ký hiệu I7 27/47, IV7 20/32, V7 25/29 chỗ; Rising Sun: mọi hợp âm ngoài i thành hợp âm 7.',
  },
  {
    id: 'thay-claude',
    nhom: 'Nhận ra từng thầy',
    ten: 'Phong cách thứ tư (Claude): màu Cà Pháo + bass Linh Nhi + nửa cung Blues',
    cau: 'Hợp âm nào cũng có màu (maj9, m9, m11, 13); chỗ đổi hợp âm thì bass đi liền bậc hay nửa cung (C – G/B – Am, F – F♯dim7 – G, D♭9 → C).',
    nghe: 'Ballad hiện đại, liền mạch, sang.',
    coSo: 'Tư duy của Claude — không phải số đo.',
  },
]
export const meoCua = (id: MeoId) => MEO_CHUNG.find((m) => m.id === id)!

const pc = (x: number) => ((x % 12) + 12) % 12
const H = (goc: number, chat: string, bass?: number): Hop => (bass === undefined ? { goc, chat } : { goc, chat, bass })
const T = 'Trưởng'
const M = 'Thứ'
const D = 'Át'
const O = 'Nửa giảm · giảm'

interface Canh {
  x: Hop
  truoc: Hop
  sau: Hop
}
interface Loi {
  y: string
  giai: string
  ai?: string
  viDu?: string
  coSo: string
}
export interface Luat {
  bac: number
  ho: readonly string[]
  khi?: (c: Canh) => boolean
  dap: Hop[]
  /** Cũng đúng lối ấy — không đưa làm phương án sai. */
  cung?: Hop[][]
  /** Lời có sẵn của thầy (`lyDoThay`): [bậc, thứ tự]. */
  diem?: readonly [number, number]
  loi?: Loi
  goiY: string
  /** Lời gia sư — học sinh lớp 6 đọc hiểu: chỗ ấy là chỗ gì, thêm / đổi nốt nào, nghe ra sao, vì sao. */
  giang: string
  meo: MeoId
}
export interface DapAn extends Loi {
  dap: Hop[]
  cung: Hop[][]
  goiY: string
  giang: string
  meo: MeoId
  /** 'thay': lời thầy đã duyệt · 'suy': bậc chưa có luật, suy từ lối chung · 'claude': tư duy của Claude. */
  nguon: 'thay' | 'suy' | 'claude'
}

/** Hợp âm sau là bậc `goc` (họ nằm trong `hos` nếu có). */
const sau =
  (goc: number, ...hos: string[]) =>
  (c: Canh) =>
    c.sau.goc === goc && (!hos.length || hos.includes(ho(c.sau.chat)))

function luatCaPhao(tonic: number, thu: boolean): Luat[] {
  const { n, h } = nguCanh(tonic, thu)
  const tho = 'Hợp âm thứ của anh gần như không để trơn — tay phải nắm thêm ♭7 ngay dưới giai điệu.'
  if (thu)
    return [
      {
        bac: 0,
        ho: [M],
        khi: sau(5, M),
        dap: [H(0, '7')],
        cung: [[H(0, 'm7')]],
        diem: [0, 1],
        goiY: 'i sắp sang iv: anh "bẻ lái" — nâng một nốt của i lên nửa cung cho i kéo iv tới.',
        meo: 'at-phu',
        giang: `${h(0, 'm')} sắp sang ${h(5, 'm')}. Đây là chỗ anh Cà Pháo "bẻ lái": nâng ${n(3)} lên ${n(4, 3)} cho nhà thành ${h(0, '7')} — một hợp âm trưởng sáng bừng giữa bài buồn. ${n(4, 3)} muốn bước lên ${n(5)}, ${n(10)} muốn rơi xuống ${n(8)}: cả hai cùng đổ vào ${h(5, 'm')}. Nghe như một tia nắng lóe lên rồi tắt — iv đến buồn hơn vì vừa được hứa chút ánh sáng. Chỉ dùng khi giọng hát không ngân ${n(3)} ở đó.`,
      },
      {
        bac: 0,
        ho: [M],
        dap: [H(0, 'm7')],
        cung: [[H(0, 'm9')]],
        diem: [0, 0],
        goiY: tho,
        meo: 'nha',
        giang: `${h(0, 'm')} là nhà của bài buồn. Anh thêm ${n(10)} thành ${h(0, 'm7')}. Mẹo tay: tay phải bấm ${h(3, '')} (một hợp âm trưởng), tay trái bấm ${n(0)}. Trên trưởng, dưới thứ: nghe vừa buồn vừa ấm, không trơ trọi như ${h(0, 'm')} ba nốt. Muốn mơ màng hơn thì thêm cả ${n(2)} (${h(0, 'm9')}).`,
      },
      {
        bac: 0,
        ho: [D],
        khi: sau(5, M),
        dap: [H(7, 'm7'), H(0, '7')],
        cung: [[H(0, '7')]],
        diem: [0, 1],
        goiY: 'Bài đã có hợp âm kéo iv; anh có khi rẽ vào "hẻm" — nửa đầu ô chèn hợp âm ii của iv.',
        meo: 'at-phu',
        giang: `Bài đã có ${h(0, '7')} kéo sang ${h(5, 'm')}. Anh còn chèn ${h(7, 'm7')} ở nửa đầu ô: ${h(7, 'm7')} – ${h(0, '7')} – ${h(5, 'm')} là một vòng "chuẩn bị – kéo – tới" thu nhỏ dẫn vào iv. Nghe như rẽ vào một con hẻm ngắn rồi mới ra đường lớn. Nốt ${n(10)} của ${h(7, 'm7')} ngân sang làm nốt của ${h(0, '7')} — một sợi chỉ nối hai hợp âm.`,
      },
      {
        bac: 2,
        ho: [O],
        khi: sau(7),
        dap: [H(2, '7')],
        cung: [[H(2, '7b5')]],
        diem: [2, 0],
        goiY: 'Trước V, anh biến hợp âm giảm thành hợp âm kéo V: nâng bậc 3 của nó lên nửa cung — thành nốt đứng sát dưới bậc 5 của giọng.',
        meo: 'at-phu',
        giang: `${h(2, 'dim')} trước ${h(7, '')} là lối quen của bài buồn — mờ và nghiêng. Anh đổi nó thành ${h(2, '7')} — quan trọng nhất là ${n(5)} được nâng lên ${n(6, 4)}. ${n(6, 4)} đứng sát dưới ${n(7)} nên muốn bước lên ${n(7)} — V được kéo tới. Nghe như người hát hít một hơi sâu trước chữ cao, rồi V đến như một điểm tựa vững. Đừng dùng khi giọng hát đang ngân ${n(5)}.`,
      },
      {
        bac: 3,
        ho: [T],
        dap: [H(3, 'maj7')],
        diem: [3, 0],
        goiY: 'Chỗ bài ghé sang trưởng: anh phủ một lớp sương — thêm nốt nằm nửa cung dưới gốc.',
        meo: 'maj7',
        giang: `${h(3, '')} là lúc bài buồn ghé sang trưởng, sáng lên một chút. Anh thêm ${n(2)} thành ${h(3, 'maj7')}: cái sáng ấy được phủ một lớp sương — vẫn sáng mà dịu, hoài niệm. Mẹo tay: tay phải bấm ${h(7, 'm')}, tay trái bấm ${n(3)}.`,
      },
      {
        bac: 5,
        ho: [M],
        khi: sau(7),
        dap: [H(5, 'm7')],
        cung: [[H(5, 'm9')]],
        diem: [5, 0],
        goiY: `iv đi nhanh sang V. ${tho}`,
        meo: 'truoc-v',
        giang: `${h(5, 'm')} đứng ngay trước ${h(7, '')} — ô lấy đà. Anh thêm ${n(3)} thành ${h(5, 'm7')}; ${n(3)} là một nốt của nhà. Mẹo tay: tay phải bấm ${h(8, '')}, tay trái ${n(5)}. Một hợp âm trưởng trên nền thứ nên iv bớt nặng, dịu đi rồi đổ gọn vào V.`,
      },
      {
        bac: 5,
        ho: [M],
        dap: [H(5, 'm9')],
        cung: [[H(5, 'm7')]],
        diem: [5, 0],
        goiY: 'iv ngân lâu: thêm ♭7 và một nốt nữa — bậc 5 của giọng, nốt có trong cả i lẫn V.',
        meo: 'not-nha',
        giang: `${h(5, 'm')} ngân lâu giữa câu. Anh thêm hai nốt của nhà: ${n(3)} (nốt 7) và ${n(7)} (nốt 9) — ${h(5, 'm9')}. Vì ${n(7)} có trong cả ${h(0, 'm')} lẫn ${h(7, '')}, từ ${h(5, 'm9')} đi đâu tay phải cũng gần như đứng yên — chuyển mà không nhảy, nghe rộng và mềm.`,
      },
      {
        bac: 7,
        ho: [T, D],
        dap: [H(7, '7b13')],
        cung: [[H(7, '9')]],
        diem: [7, 0],
        goiY: 'V của anh mang sẵn nỗi buồn của nhà: đặt bậc ♭3 của giọng lên trên V.',
        meo: 'v-cang',
        giang: `${h(7, '')} là hợp âm kéo về nhà buồn. Anh đặt lên trên V nốt ${n(3)} — chính là nốt "buồn" của nhà ${h(0, 'm')} (với V, nốt ấy gọi là ♭13). Nghe như V đã biết trước mình sắp về một căn nhà buồn: căng, tối, rất "bài thứ". ${n(3)} có sẵn trong gam nên không lạ tai. Khi V ngân dài, anh có lúc dùng ${n(9)} (nốt 9) cho sáng hơn.`,
      },
      {
        bac: 8,
        ho: [T],
        dap: [H(8, 'maj7')],
        cung: [[H(8, 'maj9')], [H(8, 'maj9#11')], [H(5, 'm9')]],
        diem: [8, 0],
        goiY: `♭VI của anh là ba nốt của i đặt trên bass ${n(8)}.`,
        meo: 'maj7',
        giang: `${h(8, '')} là chỗ "rơi" của bài buồn: bass rơi xuống ${n(8)}, rồi sắp rơi tiếp vào ${n(7)}. Anh thêm ${n(7)} thành ${h(8, 'maj7')} — mà ${h(8, 'maj7')} chính là ba nốt của nhà ${h(0, 'm')} đặt trên bass ${n(8)} (tay phải bấm ${h(0, 'm')}, tay trái ${n(8)}). Tay phải vẫn ở nhà mà mặt đất dưới chân đã trôi đi — buồn kiểu lặng lẽ, rất đẹp ở chỗ câu hát ngân dài.`,
      },
      {
        bac: 10,
        ho: [T],
        khi: sau(0),
        dap: [H(10, 'add9')],
        diem: [10, 0],
        goiY: '♭VII sắp về i: thêm một nốt — chính là chủ âm — cho tai nghe nhà vang ở trên.',
        meo: 'not-nha',
        giang: `${h(10, '')} sắp về nhà. Anh thêm ${n(0)} — chính là nốt nhà — thành ${h(10, 'add9')}: bass còn đứng ở ${n(10)} mà tai đã nghe nhà vang ở trên. Về ${h(0, 'm')} vì thế rất êm, như chưa từng đi xa.`,
      },
      {
        bac: 10,
        ho: [T],
        dap: [H(10, '7')],
        cung: [[H(10, 'add9')]],
        diem: [10, 0],
        goiY: '♭VII đẩy tiếp sang hợp âm sau: thêm ♭7 — nốt ấy muốn rơi xuống bậc 5 của giọng.',
        meo: 'at-phu',
        giang: `${h(10, '')} không về nhà ngay mà đi tiếp. Anh thêm ${n(8)} thành ${h(10, '7')}: nốt ${n(8)} muốn rơi xuống, nên hợp âm có hướng, đẩy câu nhạc sang hợp âm sau — nhất là ${h(3, '')}, chỗ nó kéo về như V kéo về nhà.`,
      },
    ]
  return [
    {
      bac: 0,
      ho: [T],
      khi: sau(7),
      dap: [H(0, 'add9'), H(2, '13')],
      cung: [[H(0, 'add9')]],
      diem: [0, 1],
      goiY: `I đứng ngay trước V: nửa sau ô, bass bước lên một cung, hợp âm mới có nốt dẫn nửa cung vào ${n(7)}.`,
      meo: 'at-phu',
      giang: `${h(0, '')} đứng ngay trước ${h(7, '')} — câu nhạc sắp rời nhà. Anh Cà Pháo giữ nửa đầu ô là nhà (${h(0, 'add9')}), nửa sau đổi hẳn thành ${h(2, '13')}: bass bước lên ${n(2)}, và trong hợp âm có ${n(6, 4)} — nốt đứng sát dưới ${n(7)}, cứ muốn bước lên ${n(7)}. Nghe như nhón chân lấy đà rồi mới bước sang V: V đến chắc và sáng hơn. Nốt ${n(0)} của nhà vẫn nằm trong ${h(2, '13')}, nên giọng hát đang ngân ${n(0)} không bị chỏi.`,
    },
    {
      bac: 0,
      ho: [T],
      khi: sau(5, T),
      dap: [H(0, '7')],
      cung: [[H(0, 'add9')]],
      diem: [0, 2],
      goiY: 'I sắp sang IV: thêm một nốt cho I thành hợp âm kéo IV tới — nốt ấy rơi nửa cung xuống bậc 3 của IV.',
      meo: 'at-phu',
      giang: `${h(0, '')} sắp sang ${h(5, '')}. Anh thêm ${n(10)} vào nhà thành ${h(0, '7')}. Nốt ${n(10)} muốn trượt xuống ${n(9)} — mà ${n(9)} nằm ngay trong ${h(5, '')} — nên ${h(0, '7')} như một cục nam châm hút ${h(5, '')} tới. Nghe có chút gospel: nhà bỗng "nóng" lên một nhịp rồi đổ sang IV. Đừng dùng khi giọng hát đang ngân ${n(11)} — ${n(11)} và ${n(10)} đứng sát nhau sẽ cọ.`,
    },
    {
      bac: 0,
      ho: [T],
      dap: [H(0, 'add9')],
      cung: [[H(0, 'maj7')]],
      diem: [0, 0],
      goiY: 'Màu "trong" của anh cho I: thêm một nốt gam nằm sát dưới bậc 3, không thêm 7.',
      meo: 'nha',
      giang: `${h(0, '')} là nhà — chỗ câu nhạc được nghỉ. Anh Cà Pháo thêm ${n(2)} (nốt 9): tay phải ${n(2)} – ${n(4)} – ${n(7)}, nốt ${n(2)} nằm sát dưới ${n(4)}. Nghe trong và mở, như mở cửa sổ cho gió vào — nhà vẫn yên, chỉ thoáng hơn. Anh không thêm ${n(10)} ở đây, vì nốt ấy làm nhà muốn đi tiếp; nhà thì cần đứng yên.`,
    },
    {
      bac: 0,
      ho: [D],
      dap: [H(0, '7')],
      diem: [0, 2],
      goiY: 'Bài đã ghi hợp âm kéo IV — anh giữ đúng như thế.',
      meo: 'at-phu',
      giang: `Bài đã ghi ${h(0, '7')}: chính bài đã cho nhà thêm ${n(10)} để kéo sang IV — đúng lối anh vẫn làm. Anh giữ nguyên, không thêm gì.`,
    },
    {
      bac: 4,
      ho: [M],
      dap: [H(4, 'm7')],
      diem: [4, 0],
      goiY: tho,
      meo: 'doi-bass',
      giang: `${h(4, 'm')} là hợp âm "lưng chừng", hay đứng giữa đường đi. Như mọi hợp âm thứ của anh, anh thêm ${n(2)} thành ${h(4, 'm7')}. Mẹo tay: tay phải bấm ${h(7, '')}, tay trái bấm ${n(4)} — một hợp âm trưởng đặt trên nền thứ, nên nghe mềm và sáng hơn ${h(4, 'm')} trơn.`,
    },
    {
      bac: 5,
      ho: [T],
      dap: [H(5, 'maj7')],
      cung: [[H(5, '6')]],
      diem: [5, 0],
      goiY: `IV trong tay anh là hợp âm vi đặt trên bass ${n(5)}.`,
      meo: 'not-nha',
      giang: `${h(5, '')} là chỗ câu nhạc rời nhà nhẹ nhàng. Anh thêm ${n(4)} thành ${h(5, 'maj7')} — mà ${n(4)} là một nốt của nhà ${h(0, '')}. Mẹo tay: tay phải bấm ${h(9, 'm')}, tay trái bấm ${n(5)}. Hợp âm thứ trên nền trưởng: vừa sáng vừa man mác, như nắng chiều — tiếng ballad quen thuộc. Đừng dùng khi giọng hát đang ngân ${n(5)}: ${n(4)} nằm sát dưới sẽ cọ.`,
    },
    {
      bac: 7,
      ho: [T, D],
      khi: sau(0),
      dap: [H(7, '7sus4'), H(7, '13')],
      cung: [[H(7, '13')]],
      diem: [7, 0],
      goiY: 'Trước khi về I, anh cho V treo một nhịp — bậc 3 thay bằng bậc 4 — rồi mới thả, nửa sau thêm màu ấm.',
      meo: 'v-cang',
      giang: `${h(7, '')} là hợp âm kéo về nhà. Anh không cho nó kéo ngay: nửa đầu ô anh "treo" — thay ${n(11)} bằng ${n(0)} (${h(7, '7sus4')}), nghe lửng lơ như một câu hỏi. Nửa sau mới thả ${n(0)} xuống ${n(11)} và thêm ${n(4)} cho ấm (${h(7, '13')}). Người nghe được chờ một nhịp rồi mới được trả lời — về nhà nghe "đã" hơn. ${n(4)} là nốt của chính gam ${n(0)} trưởng (lại là nốt của nhà), nên ấm mà không lạ.`,
    },
    {
      bac: 7,
      ho: [T, D],
      dap: [H(7, '13')],
      cung: [[H(7, '9')]],
      diem: [7, 0],
      goiY: 'V ngân mà không về I: anh tô thêm nốt 13 cho ấm, tròn.',
      meo: 'v-cang',
      giang: `${h(7, '')} ở đây chưa về nhà ngay. Anh vẫn tô cho nó ấm: thêm ${n(4)} (nốt 13) — ${h(7, '13')} tròn, đầy, chất gospel. ${n(4)} có sẵn trong gam nên nghe tự nhiên.`,
    },
    {
      bac: 9,
      ho: [M],
      dap: [H(9, 'm7')],
      diem: [9, 0],
      goiY: `vi trong tay anh là hợp âm I đặt trên bass ${n(9)}.`,
      meo: 'doi-bass',
      giang: `${h(9, 'm')} là "nhà buồn" của bài trưởng. Anh thêm ${n(7)} thành ${h(9, 'm7')}. Mẹo tay: tay phải bấm ${h(0, '')}, tay trái bấm ${n(9)} — tức là đúng hợp âm nhà đặt trên bass ${n(9)}. Vì vậy mỗi lần đi từ ${h(0, '')} sang ${h(9, 'm7')}, tay phải gần như đứng yên, chỉ bass bước xuống: buồn đi mà không đổi cảnh.`,
    },
  ]
}

function luatLinhNhi(tonic: number, thu: boolean): Luat[] {
  const { n, h } = nguCanh(tonic, thu)
  const rai = 'Màu của chị đến từ tay trái rải đi liền lên — quãng tám, rồi bước thêm một bậc.'
  if (thu)
    return [
      {
        bac: 0,
        ho: [M],
        khi: (c) => c.sau.goc === 8 || c.sau.goc === 7,
        dap: [H(0, 'm'), H(10, '')],
        cung: [[H(0, 'm(add9)')]],
        diem: [10, 0],
        goiY: 'i sắp đi xuống ♭VI hay V: nửa sau ô chị chèn một hợp âm cho bass bước xuống từng bậc.',
        meo: 'bass-buoc',
        giang: `${h(0, 'm')} sắp đi xuống. Chị chèn ${h(10, '')} vào nửa sau ô cho bass bước từng bậc: ${n(0)} → ${n(10)} → ${n(8)} → ${n(7)} — "cầu thang buồn" của bolero. Nghe như số phận cứ trôi xuống mà không cưỡng được. ${h(10, '')} để trơn: việc của nó là bậc thang cho bass, không phải màu.`,
      },
      {
        bac: 0,
        ho: [M],
        dap: [H(0, 'm(add9)')],
        cung: [[H(0, 'm7')]],
        diem: [0, 0],
        goiY: rai,
        meo: 'nha',
        giang: `${h(0, 'm')} là nhà buồn. Màu của chị nằm ở tay trái: rải ${n(0)} – ${n(7)} – ${n(0)} rồi bước tiếp ${n(2)} – ${n(3)} — nốt ${n(2)} (9) tự có vì ngón tay đi liền. Tay trái như dòng hát thứ hai dưới giai điệu: mềm, có hướng, đúng chất bolero.`,
      },
      {
        bac: 0,
        ho: [D],
        dap: [H(0, '7')],
        cung: [[H(0, '7', 4)]],
        diem: [0, 1],
        goiY: 'Bước này là của bài — chị giữ; có chỗ chị đổi nốt bass cho bass đi nửa cung.',
        meo: 'at-phu',
        giang: `Bước ${h(0, '7')} → ${h(5, 'm')} là của bài — chị giữ. ${n(4, 3)} dẫn nửa cung lên ${n(5)}, ${n(10)} rơi xuống ${n(8)}: iv đến như được kéo tới. Có chỗ chị đặt luôn ${n(4, 3)} ở bass (${h(0, '7', 4)}) cho bass bước nửa cung vào ${n(5)} — mềm và liền hơn.`,
      },
      {
        bac: 2,
        ho: [O],
        dap: [H(2, 'm7b5')],
        diem: [2, 0],
        goiY: `ii° của chị luôn có ♭7 — nó là iv đặt trên bass ${n(2)}.`,
        meo: 'giam',
        giang: `Chị để ${h(2, 'dim')} có thêm ${n(0)} thành ${h(2, 'm7b5')} — nó chính là ${h(5, 'm')} đặt trên bass ${n(2)}. Nghe nghiêng, bấp bênh, rồi đổ vào V.`,
      },
      {
        bac: 3,
        ho: [T],
        dap: [H(3, 'maj7')],
        cung: [[H(3, 'add9')]],
        diem: [3, 0],
        goiY: 'Chị tô chỗ sáng của bài bằng một nốt nằm nửa cung dưới gốc.',
        meo: 'maj7',
        giang: `${h(3, '')} là chỗ bài buồn ghé sang trưởng. Chị tô nó bằng ${n(2)} (${h(3, 'maj7')}) — cái sáng được phủ mềm. Chị hay tới đây từ ${h(10, '')}: như về một căn nhà khác, sáng sủa, rồi từ đó quay lại nỗi buồn.`,
      },
      {
        bac: 5,
        ho: [M],
        khi: sau(7),
        dap: [H(5, 'm'), H(2, 'm7b5')],
        cung: [[H(5, 'm(add9)')]],
        diem: [2, 0],
        goiY: 'iv chưa vội sang V: nửa sau ô, tay phải giữ nguyên, chỉ bass hạ một quãng ba.',
        meo: 'doi-bass',
        giang: `${h(5, 'm')} chưa vội sang ${h(7, '')}. Nửa sau ô, tay phải giữ nguyên, chỉ bass hạ xuống ${n(2)}: thành ${h(2, 'm7b5')}. iv "nghiêng" thêm một nhịp — tối hơn, bấp bênh hơn — rồi mới đổ vào V. Câu nhạc như bước chậm lại trước cửa, nên lúc vào V nặng và buồn hơn — chất bolero cổ điển.`,
      },
      {
        bac: 5,
        ho: [M],
        dap: [H(5, 'm(add9)')],
        diem: [5, 0],
        goiY: `${rai} Nốt thêm ở iv là bậc 5 của giọng.`,
        meo: 'not-nha',
        giang: `Như ở nhà, màu của ${h(5, 'm')} nằm ở tay trái rải: nốt thêm là ${n(7)} — nốt của nhà, có trong cả ${h(0, 'm')} lẫn ${h(7, '')}. Một sợi chỉ ngân qua nhiều hợp âm, nên iv nghe liền với xung quanh. Lên điệp khúc chị nắm dày hơn cho nốt ấy vang rõ.`,
      },
      {
        bac: 7,
        ho: [T],
        khi: (c) => c.x.chat === '',
        dap: [H(7, '7')],
        cung: [[H(7, '7b13')], [H(7, '7b9')], [H(7, '7sus4'), H(7, '7')]],
        diem: [7, 0],
        goiY: 'V của bài thứ: chị giữ nốt cảm âm, và có ♭7 như phần lớn bản phổ biến.',
        meo: 'v-cang',
        giang: `${h(7, '')} của bài thứ có ${n(11, 7)} — nốt sát dưới nhà, kéo lên ${n(0)}. Chị thêm ${n(5)} thành ${h(7, '7')}: cặp ${n(11, 7)} – ${n(5)} cùng đổ vào nhà, kéo mạnh hơn. Muốn căng hơn nữa, chị đặt ${n(3)} (nốt buồn của nhà) lên trên: ${h(7, '7b13')}.`,
      },
      {
        bac: 7,
        ho: [T, D],
        dap: [H(7, '7b13')],
        cung: [[H(7, '7b9')], [H(7, '7sus4'), H(7, '7')]],
        diem: [7, 0],
        goiY: 'Nốt trên cùng của V ngân bậc ♭3 của giọng — V mang sẵn nỗi buồn của i.',
        meo: 'v-cang',
        giang: `${h(7, '7')} đã có. Chị cho nốt trên cùng ngân ${n(3)} — nốt "buồn" của nhà — thành ${h(7, '7b13')}: V như mang sẵn nỗi buồn của i, căng và tối. Khi muốn kịch tính hơn chị dùng ${n(8)} (♭9) — như tiếng nấc; khi V ngân dài, chị treo ${n(0)} một nhịp (${h(7, '7sus4')}) rồi mới thả.`,
      },
      {
        bac: 8,
        ho: [T],
        dap: [H(8, 'maj7')],
        diem: [8, 0],
        goiY: 'Từ i sang ♭VI chị không đổi tay phải — chỉ bass bước xuống.',
        meo: 'doi-bass',
        giang: `Từ ${h(0, 'm')} sang ${h(8, '')}, chị không đổi tay phải: ba nốt của nhà vẫn ở đó, chỉ bass bước xuống ${n(8)} — và nhà trên bass ${n(8)} chính là ${h(8, 'maj7')}. Giai điệu vẫn đứng trong nhà mà nền dưới chân đã trượt đi: buồn kiểu lặng lẽ.`,
      },
      {
        bac: 10,
        ho: [T],
        dap: [H(10, '')],
        diem: [10, 0],
        goiY: '♭VII của chị là bậc thang cho bass — việc của nó là đường đi, không phải màu.',
        meo: 'ln-giu',
        giang: `Chị để ${h(10, '')} trơn: với chị nó là bậc thang cho bass (${n(0)} → ${n(10)} → ${n(8)}) hay cửa đưa sang ${h(3, '')} — việc của nó là đường đi, không phải màu.`,
      },
    ]
  const vTron = 'V của chị: nốt cảm âm và bass đã đủ kéo về — chị bớt chứ không thêm.'
  const giangV = `Chị để ${h(7, '')} trơn: nốt ${n(11)} và bass ${n(7)} → ${n(0)} đã đủ kéo về nhà, nên chị bớt chứ không thêm. Nghe sạch, mộc, đúng chất bolero xưa; thêm 7 thì kéo mạnh hơn mà cũng "đường phố" hơn.`
  return [
    {
      bac: 0,
      ho: [T],
      khi: sau(9, M),
      dap: [H(0, ''), H(0, '', 11)],
      cung: [[H(0, 'maj7')], [H(0, 'add9')]],
      diem: [9, 0],
      goiY: 'I sắp sang vi: chị không nhảy thẳng — bass bước xuống từng bậc, tay phải đứng yên.',
      meo: 'bass-buoc',
      giang: `${h(0, '')} sắp sang ${h(9, 'm')}. Chị Linh Nhi không nhảy thẳng: nửa sau ô, tay phải giữ nguyên, chỉ bass bước xuống ${n(11)} (${h(0, '', 11)}), rồi xuống tiếp ${n(9)} của ${h(9, 'm')}. Bass đi ${n(0)} → ${n(11)} → ${n(9)} như bước xuống cầu thang: nụ cười tắt dần thành nỗi buồn, không có chỗ gãy.`,
    },
    {
      bac: 0,
      ho: [T],
      dap: [H(0, 'add9')],
      cung: [[H(0, 'maj7')]],
      diem: [0, 0],
      goiY: rai,
      meo: 'nha',
      giang: `${h(0, '')} là nhà. Màu của chị không nằm ở tên hợp âm mà ở tay trái: rải ${n(0)} – ${n(7)} – ${n(0)} rồi bước thêm ${n(2)} – ${n(4)} — nốt ${n(2)} (9) tự hiện ra vì ngón tay đi liền. Nghe như tay trái hát một câu nhỏ đi lên dưới giai điệu — mềm, có hướng.`,
    },
    {
      bac: 2,
      ho: [M, D],
      khi: (c) => c.truoc.goc === 0 && c.sau.goc === 0,
      dap: [H(2, '7')],
      diem: [2, 0],
      goiY: 'ii chen giữa hai lần I: chị cho nó lóe sáng — nâng bậc 3 lên nửa cung — rồi về thẳng I.',
      meo: 'at-phu',
      giang: `${h(2, 'm')} chen giữa hai lần ${h(0, '')}. Chị nâng ${n(5)} lên ${n(6, 4)} cho nó thành ${h(2, '7')} — một tia sáng bất ngờ, như nụ cười thoáng qua — rồi về thẳng nhà, không đi tới V. Nốt ${n(0)} của nhà vẫn ngân trong ${h(2, '7')}, nên tia sáng ấy vẫn dính với nhà. Đừng dùng khi giọng hát đang hát ${n(5)}.`,
    },
    {
      bac: 2,
      ho: [M],
      dap: [H(2, 'm7')],
      cung: [[H(2, 'm9')]],
      diem: [2, 1],
      goiY: 'Chị giữ ii của bài, thêm một nốt — chính là chủ âm — cho ii dính với nhà.',
      meo: 'not-nha',
      giang: `Chị giữ ${h(2, 'm')} của bài, chỉ thêm ${n(0)} — chính là nốt nhà — thành ${h(2, 'm7')}. Có nốt nhà ngân bên trong, ii nghe dính với nhà: từ ii về I hay sang V đều có một nốt đứng yên, chuyển êm.`,
    },
    {
      bac: 4,
      ho: [M],
      dap: [H(4, 'm')],
      diem: [4, 0],
      goiY: 'iii của chị để trơn.',
      meo: 'ln-giu',
      giang: `Chị để ${h(4, 'm')} trơn. Nó chỉ là một bậc trên đường đi (I → vi → iii → ii …) — chuỗi hợp âm thứ nối nhau, nghe thong thả như kể chuyện từng đoạn.`,
    },
    {
      bac: 5,
      ho: [T],
      dap: [H(5, '')],
      cung: [[H(5, 'm')]],
      diem: [5, 0],
      goiY: 'Phần hát chị giữ đúng hợp âm của bài; chỉ đoạn kết mới mượn từ giọng thứ.',
      meo: 'ln-giu',
      giang: `Ở phần hát, chị giữ đúng ${h(5, '')} của bài — sáng, mộc. Chỉ khi khép bài chị mới mượn ${h(5, 'm')} cho câu cuối tối lại, như nắng chiều tắt.`,
    },
    {
      bac: 7,
      ho: [T, D],
      khi: (c) => c.truoc.goc === 5,
      dap: [H(7, '')],
      cung: [[H(6, 'm7b5')], [H(11, 'dim7')]],
      diem: [7, 0],
      goiY: vTron,
      meo: 'ln-giu',
      giang: `${giangV} Riêng chỗ ${h(5, '')} → ${h(7, '')}, có lúc chị thay V bằng ${h(6, 'm7b5')}: bass leo nửa cung ${n(5)} → ${n(6, 4)} rồi về nhà — nghe sang, kiểu phòng trà.`,
    },
    { bac: 7, ho: [T, D], dap: [H(7, '')], diem: [7, 0], goiY: vTron, meo: 'ln-giu', giang: giangV },
    {
      bac: 9,
      ho: [M],
      khi: sau(2),
      dap: [H(9, 'm'), H(4, 'm')],
      diem: [4, 0],
      goiY: 'vi sang ii: nửa sau ô chị chèn thêm một hợp âm thứ — chuỗi hợp âm thứ đi dần về V.',
      meo: 'bass-buoc',
      giang: `${h(9, 'm')} sắp sang ${h(2, 'm')}. Chị chèn ${h(4, 'm')} vào nửa sau ô: vi → iii → ii là ba hợp âm thứ nối nhau, đi dần về V — nghe thong thả, như kể chuyện từng đoạn, không vội về nhà.`,
    },
    {
      bac: 9,
      ho: [M],
      dap: [H(9, 'm')],
      loi: {
        y: `Bài ghi ${h(9, 'm')} → chị giữ ${h(9, 'm')}`,
        giai: `Chị không tô màu vi bằng tên hợp âm — cái riêng của chị nằm ở đường bass đi vào nó: từ I, bass bước ${n(0)} – ${n(11)} – ${n(9)}, tay phải gần như đứng yên.`,
        ai: 'Của bài: vi ở 26/34 chỗ.',
        coSo: 'md Linh Nhi 13d — 3 bài trưởng.',
      },
      goiY: 'Chị giữ vi của bài — màu nằm ở đường bass đi vào nó.',
      meo: 'ln-giu',
      giang: `Chị giữ ${h(9, 'm')} của bài — chị ít khi tô màu vi bằng tên hợp âm. Khi vi đến ngay sau nhà, cái riêng của chị nằm ở đường bass đi vào nó: ${n(0)} – ${n(11)} – ${n(9)}, bước xuống từng bậc.`,
    },
  ]
}

function luatBlues(tonic: number, thu: boolean): Luat[] {
  const { n, h } = nguCanh(tonic, thu)
  if (thu)
    return [
      {
        bac: 0,
        ho: [M],
        dap: [H(0, 'm11')],
        cung: [[H(0, 'm7')], [H(0, 'm9')]],
        diem: [0, 0],
        goiY: 'Chủ thứ là chỗ đứng yên duy nhất của bản phối — giữ hợp âm thứ, thêm một nốt cho nó rộng và tối.',
        meo: 'nha',
        giang: `Trong bản blues thứ, mọi hợp âm khác đều là hợp âm 7, chỉ nhà đứng yên. Người phối thêm ${n(5)} (nốt 11) vào ${h(0, 'm')}: ${h(0, 'm11')} rộng và tối — nhà vững như mặt đất.`,
      },
      {
        bac: 3,
        ho: [T, D],
        dap: [H(3, '13')],
        cung: [[H(3, '7')]],
        diem: [3, 0],
        goiY: 'Mọi hợp âm ngoài i thành hợp âm bảy át — thêm cả 9, 13 cho đầy.',
        meo: 'blues-7',
        giang: `${h(3, '')} thành ${h(3, '13')}: thêm ${n(1)} (nốt 7 — một nốt ngoài gam) cho xẵng, bụi; thêm 9, 13 cho đầy. Người phối biến mọi hợp âm ngoài nhà thành hợp âm 7 — đó là "màu blues".`,
      },
      {
        bac: 5,
        ho: [T, D],
        dap: [H(5, '7')],
        diem: [5, 0],
        goiY: 'IV trưởng giữa bài thứ, thêm ♭7 — nốt ấy là ♭3 của giọng, nốt trong gam.',
        meo: 'blues-7',
        giang: `${h(5, '')} (IV trưởng) đã sáng lên giữa bài buồn nhờ ${n(9)}. Người phối thêm ${n(3)} thành ${h(5, '7')} — ${n(3)} là nốt của gam, nên chỉ thêm màu blues mà không thêm nốt lạ.`,
      },
      {
        bac: 5,
        ho: [M],
        dap: [H(5, 'm7')],
        cung: [[H(5, '7')]],
        loi: {
          y: 'Bài ghi iv thứ → iv7',
          giai: 'Rising Sun có IV trưởng (bậc 6 nâng) nên người phối bấm IV7; bài của bạn ghi iv thứ thì lối blues thứ thường gặp là giữ thứ, thêm ♭7 — đổi hẳn thành IV7 cũng được nếu giai điệu không có bậc 6 thứ.',
          coSo: 'Suy luận của Claude — ba sheet blues không có iv thứ.',
        },
        goiY: 'Giữ hợp âm thứ, thêm ♭7.',
        meo: 'blues-7',
        giang: `Blues thứ để ${h(5, 'm')} thứ nhưng thêm ${n(3)} thành ${h(5, 'm7')} — tối, mềm, chất blues đêm.`,
      },
      {
        bac: 7,
        ho: [T, D],
        dap: [H(7, '7#9')],
        diem: [7, 0],
        goiY: 'Cho hai bậc 7 của gam thứ vang cùng lúc trên V.',
        meo: 'v-cang',
        giang: `${h(7, '7#9')} có cả ${n(11, 7)} (nốt kéo về nhà) lẫn ${n(10)} (nốt buồn tự nhiên của gam) — hai nốt cách nửa cung vang cùng lúc: vừa kéo về nhà vừa giữ nỗi buồn. Tiếng chỏi ấy là "hợp âm blues".`,
      },
      {
        bac: 8,
        ho: [T, D],
        dap: [H(8, '7')],
        diem: [8, 0],
        goiY: '♭7 của ♭VI chính là nốt blue ♭5 của giọng.',
        meo: 'tam-cung',
        giang: `${h(8, '7')} có ${n(6, 5)} — nốt blue của giọng. Từ ${h(8, '7')} sang V, bass trượt nửa cung ${n(8)} → ${n(7)} và nốt blue cũng trượt lên ${n(7)}: hòa âm và giai điệu blues gặp nhau ở cùng một nốt. Nghe đục, nặng, rất "đêm".`,
      },
    ]
  const vBat = 'V bật lên: đặt nốt blue ♭7 của giọng lên trên V, cạnh bậc 3 trưởng.'
  const giangV = `${h(7, '')} trong blues thêm ${n(10)} — nằm sát dưới ${n(11)} — thành ${h(7, '7#9')}. Hai nốt ${n(10)} (nốt blue) và ${n(11)} cùng vang, cọ vào nhau: gắt, đầy sức sống — "hợp âm blues". Muốn mềm hơn thì dùng ${h(7, '9')}.`
  return [
    {
      bac: 0,
      ho: [T, D],
      khi: sau(2, M),
      dap: [H(0, '', 4), H(3, 'dim7')],
      cung: [[H(0, '7')]],
      diem: [2, 0],
      goiY: `I sắp sang ii: Robert nối bằng một hợp âm lướt cho bass đi nửa cung xuống ${n(2)}.`,
      meo: 'giam',
      giang: `${h(0, '')} sắp sang ${h(2, 'm')}. Robert đặt nhà trên bass ${n(4)} (${h(0, '', 4)}), rồi nửa sau chèn ${h(3, 'dim7')}: bass ${n(4)} → ${n(3)} → ${n(2)} trượt xuống từng nửa cung, như trượt chân nhẹ trên cầu thang — sang trọng, chất jazz.`,
    },
    {
      bac: 0,
      ho: [T, D],
      khi: (c) => c.x.chat === '7',
      dap: [H(0, '13')],
      diem: [0, 0],
      goiY: 'Bài đã có I7; Ray tô thêm 13 cho tròn, ấm.',
      meo: 'blues-7',
      giang: `Bài đã có ${h(0, '7')}. Ray tô thêm ${n(9)} (nốt 13) cho tròn và ấm: ${h(0, '13')}. Trong blues, nhà không đứng yên như bài pop — nó có chút bụi bặm, lười nhác.`,
    },
    {
      bac: 0,
      ho: [T, D],
      dap: [H(0, '7')],
      cung: [[H(0, '13')]],
      diem: [0, 0],
      goiY: 'Trong blues, chủ âm cũng mang nốt blue ♭7 của giọng.',
      meo: 'blues-7',
      giang: `Trong blues, nhà cũng là hợp âm 7: thêm ${n(10)} vào ${h(0, '')} thành ${h(0, '7')}. ${n(10)} chính là nốt "blue" của giọng — nghe bụi, lười, như còn muốn đi tiếp. Đó là cái khác lớn nhất giữa blues và bài pop.`,
    },
    {
      bac: 2,
      ho: [M],
      dap: [H(2, 'm7')],
      diem: [2, 0],
      goiY: 'Robert mượn lối jazz cho ii: thêm ♭7, chuẩn bị V.',
      meo: 'truoc-v',
      giang: `Robert mượn lối jazz: ii thêm ${n(0)} (nốt nhà) thành ${h(2, 'm7')}, rồi ii → V làm câu vào V mềm và "có học" hơn. Ray thì đi thẳng vào V, thô và mộc hơn.`,
    },
    {
      bac: 5,
      ho: [T, D],
      khi: sau(7),
      dap: [H(5, '7'), H(6, 'dim7')],
      cung: [[H(5, '7')], [H(5, '9')]],
      diem: [5, 0],
      goiY: 'IV sắp sang V: nửa sau ô, Ray chèn một hợp âm lướt cho bass leo nửa cung vào V.',
      meo: 'giam',
      giang: `${h(5, '')} sắp sang ${h(7, '')}. Ray giữ ${h(5, '7')} nửa đầu, nửa sau chèn ${h(6, 'dim7')}: bass ${n(5)} → ${n(6, 4)} → ${n(7)} leo nửa cung vào V — như bước lên bậc thềm. Đây là cách quay vòng quen của blues ở cuối khung 12 ô.`,
    },
    {
      bac: 5,
      ho: [T, D],
      khi: (c) => c.x.chat === '7',
      dap: [H(5, '9')],
      diem: [5, 0],
      goiY: 'Bài đã có IV7; Ray tô thêm 9 — nốt chung với I.',
      meo: 'not-nha',
      giang: `Bài đã có ${h(5, '7')}. Ray thêm ${n(7)} (nốt 9) — ${n(7)} cũng có trong nhà — nên từ nhà sang ${h(5, '9')} tay phải gần như đứng yên, chỉ bass bước. Nghe mềm hơn ${h(5, '7')}.`,
    },
    {
      bac: 5,
      ho: [T, D],
      dap: [H(5, '7')],
      cung: [[H(5, '9')]],
      diem: [5, 0],
      goiY: '♭7 của IV chính là nốt blue ♭3 của giọng.',
      meo: 'blues-7',
      giang: `Blues cho IV thêm ${n(3)} thành ${h(5, '7')}. ${n(3)} là nốt blue của giọng — nên khi sang IV, câu hát dùng ${n(3)} mà không chỏi: cả hợp âm như cùng "rên" với giai điệu.`,
    },
    {
      bac: 7,
      ho: [T, D],
      khi: sau(0),
      dap: [H(7, '7#9')],
      cung: [[H(7, '9')], [H(1, '7')]],
      diem: [7, 0],
      goiY: vBat,
      meo: 'v-cang',
      giang: `${giangV} Ở câu kết cuối bài, Ray có khi thay hẳn V bằng ${h(1, '7')} — bass trượt nửa cung vào nhà.`,
    },
    { bac: 7, ho: [T, D], dap: [H(7, '7#9')], cung: [[H(7, '9')]], diem: [7, 0], goiY: vBat, meo: 'v-cang', giang: giangV },
  ]
}

function luatClaude(tonic: number, thu: boolean): Luat[] {
  const { n, h, songSong, cungChu } = nguCanh(tonic, thu)
  const loi = (y: string, giai: string, coSo: string): Loi => ({ y, giai, coSo })
  if (thu)
    return [
      {
        bac: 0,
        ho: [M],
        khi: sau(8),
        dap: [H(0, 'm9'), H(0, 'm7', 10)],
        cung: [[H(0, 'm9')]],
        loi: loi(
          `${h(0, 'm')} sắp sang ${h(8, '')} → ${h(0, 'm9')} rồi ${h(0, 'm7', 10)}`,
          `Bass ${n(0)} → ${n(10)} → ${n(8)}: "cầu thang buồn" của Linh Nhi — nhưng thay vì chèn hợp âm ${h(10, '')}, tay phải giữ nguyên i, chỉ bass bước. Tầng trên vẫn ở nhà, nền dưới chân trượt dần xuống; sang ${h(8, '')} liền như một hơi. ${h(0, 'm9')} là màu tay phải của Cà Pháo (i có ♭7, 9).`,
          'Tư duy của Claude — Linh Nhi chèn ♭VII giữa i và ♭VI (11 chỗ) và hay "đổi bass, giữ tầng trên"; Cà Pháo: i có ♭7 vang 43/60 đoạn.',
        ),
        goiY: `Nửa sau ô: tay phải đứng yên, bass bước xuống một cung — để rồi bước tiếp xuống ${n(8)}.`,
        meo: 'bass-buoc',
        giang: `${h(0, 'm')} sắp sang ${h(8, '')}. Tay phải giữ nhà, chỉ bass bước xuống ${n(10)} rồi ${n(8)}: cầu thang buồn của Linh Nhi, nhưng không cần chèn hợp âm mới — chỉ bass đi. Tầng trên vẫn ở nhà, nền dưới chân trượt dần xuống.`,
      },
      {
        bac: 0,
        ho: [M],
        khi: sau(5, M),
        dap: [H(0, 'm9'), H(0, '7', 4)],
        cung: [[H(0, 'm9')]],
        loi: loi(
          `${h(0, 'm')} sắp sang ${h(5, 'm')} → ${h(0, 'm9')} rồi ${h(0, '7', 4)}`,
          `Nửa sau ô ghép hai thầy: "bẻ lái" của Cà Pháo (i thành ${h(0, '7')}, át phụ kéo iv tới) và bass của Linh Nhi (bậc 3 của ${h(0, '7')} đặt ở bass). ${n(4, 3)} ở bass bước nửa cung lên ${n(5)}, ${n(10)} ở trên rơi xuống ${n(8)}: một tia sáng lóe lên rồi tắt vào iv. Đừng dùng khi giai điệu đang ngân ${n(3)} — ${n(4, 3)} sẽ chỏi nửa cung.`,
          'Tư duy của Claude — Cà Pháo đổi i thành I7 trước iv (soát tay 5/5 chỗ); Linh Nhi đặt bậc 3 của I7 ở bass (1/8 chỗ).',
        ),
        goiY: 'Nửa sau ô: nâng một nốt của i lên nửa cung cho nó kéo iv tới — và đặt chính nốt ấy ở bass.',
        meo: 'at-phu',
        giang: `${h(0, 'm')} sắp sang ${h(5, 'm')}. Nửa sau ô: nâng ${n(3)} lên ${n(4, 3)} cho nhà thành ${h(0, '7')} (lối Cà Pháo — tia nắng lóe lên), và đặt chính ${n(4, 3)} ở bass (lối Linh Nhi). Bass bước nửa cung ${n(4, 3)} → ${n(5)}: iv đến như được dắt. Đừng dùng khi giọng hát đang ngân ${n(3)}.`,
      },
      {
        bac: 0,
        ho: [M],
        dap: [H(0, 'm9')],
        cung: [[H(0, 'm(add9)')]],
        loi: loi(
          `Bài ghi ${h(0, 'm')} → ${h(0, 'm9')}`,
          `Thêm ♭7 (${n(10)}) và 9 (${n(2)}): i ấm và rộng ra; nốt 9 nằm sát dưới ♭3 thành một vệt mờ — màu tay phải của Cà Pháo, và cũng là nốt tay trái Linh Nhi hay rải qua.`,
          'Tư duy của Claude — Cà Pháo: i có ♭7 vang 43/60 đoạn; Linh Nhi: 43 đoạn i có nốt 9 ở tay trái (5 bài).',
        ),
        goiY: 'Thêm cả ♭7 lẫn 9.',
        meo: 'nha',
        giang: `${h(0, 'm')} là nhà buồn. Thêm ${n(10)} (7) và ${n(2)} (9): ${h(0, 'm9')} ấm và rộng; ${n(2)} nằm sát dưới ${n(3)} thành một vệt mờ — mơ màng, hiện đại.`,
      },
      {
        bac: 5,
        ho: [M],
        khi: sau(0, M),
        dap: [H(5, 'm6')],
        loi: loi(
          `${h(5, 'm')} về ${h(0, 'm')} → ${h(5, 'm6')}`,
          `${h(5, 'm6')} thêm ${n(2)} — nốt gam; nó chính là ${h(2, 'm7b5')} đổi bass. iv6 → i là cái "Amen" buồn kiểu jazz: ${n(8)} rơi nửa cung xuống ${n(7)}, ${n(2)} bước nửa cung lên ${n(3)} — hai nốt cùng khép vào nhà.`,
          'Tư duy của Claude — lý thuyết (thẻ "Lý thuyết", bậc iv: m6 = ii° đổi bass).',
        ),
        goiY: 'iv về nhà: thêm một nốt gam (bậc 6 của iv) cho hợp âm thứ nghe "jazz".',
        meo: 'doi-bass',
        giang: `${h(5, 'm')} sắp về nhà. Thêm ${n(2)} thành ${h(5, 'm6')}: ${n(8)} rơi nửa cung xuống ${n(7)}, ${n(2)} bước nửa cung lên ${n(3)} — hai nốt cùng khép vào nhà, như một tiếng "Amen" buồn kiểu jazz. Mẹo tay: ${h(5, 'm6')} bấm như ${h(2, 'm7b5')}, chỉ đổi bass thành ${n(5)}.`,
      },
      {
        bac: 5,
        ho: [M],
        khi: sau(7),
        dap: [H(5, 'm9'), H(8, '7')],
        cung: [[H(5, 'm9')]],
        loi: loi(
          `${h(5, 'm')} sắp sang ${h(7, '')} → ${h(5, 'm9')} rồi ${h(8, '7')}`,
          `Nửa sau ô chèn ${h(8, '7')}: ♭7 của nó viết lại là ${n(6, 4)}, kéo nửa cung lên ${n(7)}; ${n(8)} kéo nửa cung xuống ${n(7)} — hai nốt kẹp bậc 5 từ hai phía (hợp âm sáu tăng), bass ${n(8)} → ${n(7)} nửa cung. Màu Blues (♭VI7 → V) đặt vào ballad: V đến nặng và tối.`,
          'Tư duy của Claude — Blues: ♭VI7 → V (Rising Sun 2 chỗ; thầy Đức Thịnh F7 ở La thứ) + lý thuyết.',
        ),
        goiY: `Nửa sau ô: một hợp âm bảy át có bass nửa cung trên ${n(7)}.`,
        meo: 'tam-cung',
        giang: `${h(5, 'm')} sắp sang ${h(7, '')}. Nửa sau chèn ${h(8, '7')}: bass ${n(8)} trượt nửa cung xuống ${n(7)}, còn một nốt ở trên (${n(6, 4)}) leo nửa cung lên ${n(7)} — hai phía cùng kẹp vào V. Màu Blues đặt vào ballad: V đến nặng và tối.`,
      },
      {
        bac: 7,
        ho: [T, D, M],
        khi: sau(0),
        dap: [H(7, '7b9')],
        cung: [[H(7, '7b13')]],
        loi: loi(
          `Hợp âm bậc 5 về ${h(0, 'm')} → ${h(7, '7b9')}`,
          `Ở giọng thứ, ♭9 của V (${n(8)}) có sẵn trong gam nên ${h(7, '7b9')} nghe tự nhiên mà kịch tính; ${n(8)} rơi nửa cung xuống ${n(7)}. Cà Pháo, Linh Nhi hay chọn ♭13 (nốt trên ngân ♭3 của giọng); phong cách này chọn ♭9 vì dồn lực vào bước nửa cung. Ở bài trưởng ♭9 ngoài gam, nên ở đó Claude chọn thay tam cung. Bài ghi v thứ thì đổi luôn thành V — lấy nốt cảm âm ${n(11, 7)}.`,
          'Tư duy của Claude — lý thuyết (♭9 có sẵn trong gam thứ); Linh Nhi có V7♭9 (♭9 · ♭13 bản phổ biến không ghi 8/8 chỗ).',
        ),
        goiY: 'Thêm một nốt căng có sẵn trong gam thứ, nằm nửa cung trên bậc 5 của giọng.',
        meo: 'v-cang',
        giang: `${h(7, '')} sắp về nhà buồn. Thêm ${n(8)} — nốt nằm sát trên ${n(7)} (gọi là ♭9) — thành ${h(7, '7b9')}: ${n(8)} có sẵn trong gam thứ nên nghe tự nhiên mà kịch tính, rồi rơi nửa cung xuống ${n(7)}. Bài ghi v thứ thì đổi luôn thành V trưởng để có nốt ${n(11, 7)} kéo về nhà.`,
      },
      {
        bac: 7,
        ho: [T, D],
        dap: [H(7, '7sus4'), H(7, '7b9')],
        loi: loi(
          `${h(7, '')} (không về i) → ${h(7, '7sus4')} rồi ${h(7, '7b9')}`,
          `V chưa về nhà ngay: nửa đầu treo bậc 4 (${n(0)}) — lửng như hỏi — rồi thả xuống ${n(11, 7)} với ♭9 căng. Treo là lối của Cà Pháo và Linh Nhi trước khi về; ở đây treo cả khi V đi tiếp.`,
          'Tư duy của Claude — Linh Nhi A7sus4 → A7 (Lá Thư Trần Thế); Cà Pháo V7sus4 rồi V13.',
        ),
        goiY: 'Nửa đầu treo bậc 4, nửa sau thả xuống và thêm nốt căng.',
        meo: 'v-cang',
        giang: `${h(7, '')} chưa về nhà ngay. Nửa đầu treo ${n(0)} (lửng như một câu hỏi), nửa sau thả xuống ${n(11, 7)} và thêm ${n(8)} cho căng — hỏi rồi trả lời, căng rồi mới đi tiếp.`,
      },
      {
        bac: 8,
        ho: [T],
        khi: sau(7),
        dap: [H(8, 'maj7'), H(8, '7')],
        cung: [[H(8, 'maj7')]],
        loi: loi(
          `${h(8, '')} sắp sang ${h(7, '')} → ${h(8, 'maj7')} rồi ${h(8, '7')}`,
          `Một bè đi xuống nửa cung hai lần: ${n(7)} (maj7 của ♭VI) → ${n(6, 5)} (♭7) → ${n(5)} (♭7 của V7) — trong khi bass ${n(8)} rơi nửa cung xuống ${n(7)}. Nửa đầu là màu Cà Pháo (♭VImaj7), nửa sau là ♭VI7 của Blues.`,
          'Tư duy của Claude — Cà Pháo ♭VImaj7 (bản phổ biến không ghi 23/23 chỗ); Blues ♭VI7 → V.',
        ),
        goiY: 'Giữ ♭VI nửa đầu với màu Cà Pháo; nửa sau hạ một nốt nửa cung cho nó thành hợp âm bảy át.',
        meo: 'tam-cung',
        giang: `${h(8, '')} sắp sang ${h(7, '')}. Nửa đầu là màu Cà Pháo (${h(8, 'maj7')}); nửa sau hạ ${n(7)} xuống ${n(6, 5)} thành ${h(8, '7')}. Một bè đi xuống nửa cung hai lần (${n(7)} → ${n(6, 5)} → ${n(5)}) trong khi bass rơi nửa cung ${n(8)} → ${n(7)} — nghe như trượt dần vào V.`,
      },
      {
        bac: 10,
        ho: [T],
        khi: sau(3),
        dap: [H(10, '13')],
        loi: loi(
          `${h(10, '')} sắp sang ${h(3, '')} → ${h(10, '13')}`,
          `${h(10, '')} → ${h(3, '')} là V → I của ${songSong}. Thêm ♭7 (${n(8)}) và 13 (${n(7)}) cho nó thành át thật của ${h(3, '')}: bài ghé sang trưởng có lực và ấm hơn. Linh Nhi hay tới ♭III từ ♭VII; Cà Pháo cho ♭VII thêm ♭7.`,
          'Tư duy của Claude — Linh Nhi ♭VII → ♭III 10 lần (4 bài); Cà Pháo ♭VII7 (bản phổ biến không ghi 13/13 chỗ).',
        ),
        goiY: `Biến ♭VII thành hợp âm kéo ${h(3, '')} tới, thêm màu ấm.`,
        meo: 'at-phu',
        giang: `${h(10, '')} sắp sang ${h(3, '')} — giống V → I của ${songSong}. Thêm ${n(8)} và ${n(7)}: ${h(10, '13')} thành nam châm thật kéo ${h(3, '')} tới — chỗ bài ghé sang trưởng có lực và ấm hơn.`,
      },
      {
        bac: 10,
        ho: [T],
        dap: [H(10, 'add9')],
        loi: loi(
          `Bài ghi ${h(10, '')} → ${h(10, 'add9')}`,
          `9 của ♭VII là chủ âm (${n(0)}): bass đứng ở ${n(10)} mà tai vẫn nghe nhà vang ở trên — lối Cà Pháo. Không thêm maj7: ${n(9, 6)} nằm ngoài gam thứ tự nhiên.`,
          'Tư duy của Claude — Cà Pháo ♭VII add9 (bản phổ biến không ghi 11/11 chỗ).',
        ),
        goiY: 'Thêm một nốt — chính là chủ âm.',
        meo: 'not-nha',
        giang: `${h(10, '')} thêm ${n(0)} — chính là nốt nhà — thành ${h(10, 'add9')}: bass còn ở ${n(10)} mà tai đã nghe nhà vang ở trên.`,
      },
    ]
  return [
    {
      bac: 0,
      ho: [T],
      khi: sau(9, M),
      dap: [H(0, 'maj9'), H(7, '', 11)],
      cung: [[H(0, 'maj9')]],
      loi: loi(
        `${h(0, '')} sắp sang ${h(9, 'm')} → ${h(0, 'maj9')} rồi ${h(7, '', 11)}`,
        `Lấy ý của Linh Nhi — I → vi bass đi liền bậc ${n(0)} → ${n(11)} → ${n(9)} — nhưng nốt giữa đặt dưới ${h(7, '', 11)} thay vì ${h(0, '', 11)}: ${n(11)} ở bass là nốt cảm âm, nên nửa ô ấy hơi "đẩy" về trước rồi mới rơi vào vi — một tiếng thở dài có chủ đích. Linh Nhi giữ tay phải I (êm hơn); ${h(7, '', 11)} cho đường đi rõ hơn. ${h(0, 'maj9')} gộp hai màu I của Cà Pháo (add9, maj7).`,
        'Tư duy của Claude — Linh Nhi: I → vi 26 lần, 12 chỗ có nốt 7 dẫn bass xuống vi (2 bài); Cà Pháo: I add9 15/15, maj7 5/5 chỗ bản phổ biến không ghi.',
      ),
      goiY: `Nửa sau ô: bass bước xuống ${n(11)} để rồi xuống tiếp ${n(9)} — đặt nốt ấy dưới một hợp âm khác của giọng.`,
      meo: 'bass-buoc',
      giang: `${h(0, '')} sắp sang ${h(9, 'm')}. Nửa đầu: nhà thêm hai màu yên (${n(11)}, ${n(2)}) thành ${h(0, 'maj9')}. Nửa sau: bass bước xuống ${n(11)} dưới hợp âm ${h(7, '')} (${h(7, '', 11)}), rồi xuống tiếp ${n(9)}. Bass đi ${n(0)} → ${n(11)} → ${n(9)} như bước xuống cầu thang (ý của Linh Nhi); ${h(7, '', 11)} có ${n(11)} — nốt kéo về — nên nửa ô ấy hơi đẩy tới trước rồi mới rơi vào vi, như một tiếng thở dài có chủ đích.`,
    },
    {
      bac: 0,
      ho: [T],
      khi: sau(2, M),
      dap: [H(0, 'maj9'), H(1, 'dim7')],
      cung: [[H(0, 'maj9')]],
      loi: loi(
        `${h(0, '')} sắp sang ${h(2, 'm')} → nửa sau chèn ${h(1, 'dim7')}`,
        `Bass ${n(0)} → ${n(1, 1)} → ${n(2)} leo nửa cung. ${h(1, 'dim7')} là ${h(9, '7b9')} bỏ gốc — át phụ của ii — nên nó kéo vào ii; ba trong bốn nốt của nó cách một nốt của ii đúng nửa cung. Nghe sang, cổ điển, kiểu piano phòng trà. Ý từ hợp âm giảm lướt của Linh Nhi (bass đi nửa cung) và Robert (Blues: I → ♭III° → ii).`,
        'Tư duy của Claude — chưa thấy đúng lối này trong sheet (Robert lướt đi xuống qua ♭III°; Linh Nhi đặt hợp âm giảm thay V).',
      ),
      goiY: `Nửa sau ô: một hợp âm lướt cho bass đi nửa cung lên ${n(2)}.`,
      meo: 'giam',
      giang: `${h(0, '')} sắp sang ${h(2, 'm')}. Nửa sau chèn ${h(1, 'dim7')}: bass leo ${n(0)} → ${n(1, 1)} → ${n(2)} từng nửa cung. Ba trong bốn nốt của ${h(1, 'dim7')} nằm sát (nửa cung) một nốt của ${h(2, 'm')}, nên nó dẫn vào ii như một bàn tay dắt. Nghe sang, cổ điển — kiểu piano phòng trà.`,
    },
    {
      bac: 0,
      ho: [T],
      khi: sau(5, T),
      dap: [H(0, 'maj9'), H(0, '7', 4)],
      cung: [[H(0, 'maj9')]],
      loi: loi(
        `${h(0, '')} sắp sang ${h(5, '')} → ${h(0, 'maj9')} rồi ${h(0, '7', 4)}`,
        `Nửa sau ô ghép hai thầy: Cà Pháo thêm ♭7 cho I ngay trước IV (I7 kéo IV tới), Linh Nhi đặt bậc 3 của I7 ở bass. Bass ${n(0)} → ${n(4)} → ${n(5)} — bước cuối nửa cung; ${n(10)} ở trên rơi xuống ${n(9)}. Nghe gospel, ấm. Tránh khi giai điệu đang ngân ${n(11)}.`,
        'Tư duy của Claude — Cà Pháo: ♭7 trên I, bản phổ biến không ghi 10/12 chỗ; Linh Nhi: I7/3 → iv ở bài thứ (1/8 chỗ).',
      ),
      goiY: `Nửa sau ô: biến I thành hợp âm kéo IV, và chọn bass sao cho bass đi nửa cung vào ${n(5)}.`,
      meo: 'at-phu',
      giang: `${h(0, '')} sắp sang ${h(5, '')}. Nửa sau: thêm ${n(10)} cho nhà thành ${h(0, '7')} (lối Cà Pháo — nam châm kéo IV), và đặt ${n(4)} ở bass (lối Linh Nhi). Bass đi ${n(0)} → ${n(4)} → ${n(5)}: bước cuối chỉ nửa cung, IV đến như được dắt. Nghe ấm, gospel.`,
    },
    {
      bac: 0,
      ho: [T],
      dap: [H(0, 'maj9')],
      cung: [[H(0, '6/9')]],
      loi: loi(
        `Bài ghi ${h(0, '')} → ${h(0, 'maj9')}`,
        `Thêm cả ${n(11)} (maj7) lẫn ${n(2)} (9) — hai nốt gam không chỏi với khung: I rộng, mơ — màu "nhà" của ballad hiện đại. Cà Pháo dùng add9 hay maj7; ghép cả hai cho I dày hơn khi I ngân dài. Tránh khi giai điệu ngân ${n(0)} — ${n(11)} sát dưới sẽ cọ.`,
        'Tư duy của Claude — mở rộng màu I của Cà Pháo (add9 15/15, maj7 5/5 chỗ bản phổ biến không ghi).',
      ),
      goiY: 'Thêm cả hai nốt màu Cà Pháo hay đặt cho I: nốt 7 trưởng và nốt 9.',
      meo: 'nha',
      giang: `${h(0, '')} là nhà. Thêm cả hai màu yên: ${n(11)} (7 trưởng) và ${n(2)} (9) — ${h(0, 'maj9')}. Nghe rộng và mơ, như nhà có thêm ánh đèn vàng — màu "nhà" của ballad hiện đại. Tránh khi giọng hát đang ngân ${n(0)} (${n(11)} sát dưới sẽ cọ).`,
    },
    {
      bac: 0,
      ho: [D],
      khi: sau(5),
      dap: [H(0, '7', 4)],
      loi: loi(
        `Bài ghi ${h(0, '7')} trước ${h(5, '')} → ${h(0, '7', 4)}`,
        `Bài đã có át phụ của IV; thêm một bước: đặt ${n(4)} ở bass cho bass đi nửa cung ${n(4)} → ${n(5)} — IV đến như được dắt (lối của Linh Nhi).`,
        'Tư duy của Claude — Linh Nhi đặt bậc 3 của I7 ở bass (1/8 chỗ).',
      ),
      goiY: `Đổi nốt bass cho bass đi nửa cung vào ${n(5)}.`,
      meo: 'bass-buoc',
      giang: `Bài đã có ${h(0, '7')} kéo IV. Chỉ đổi nốt bass thành ${n(4)}: bass bước nửa cung ${n(4)} → ${n(5)}, IV đến mềm và liền hơn.`,
    },
    {
      bac: 2,
      ho: [M],
      khi: sau(7),
      dap: [H(2, 'm11')],
      cung: [[H(2, 'm9')]],
      loi: loi(
        `${h(2, 'm')} trước ${h(7, '')} → ${h(2, 'm11')}`,
        `${h(2, 'm11')} = ${h(2, 'm')} + ${h(0, '')} ở tay phải (Jeff): tay phải là hợp âm chủ, bass ${n(2)} — ii vừa "chuẩn bị" vừa giữ dư âm nhà. Sang V tay phải gần như đứng yên: ${n(0)} xuống ${n(11)}, ${n(5)} ở lại làm ♭7. Hợp âm thứ nhận 9, 11 dễ — không nốt nào chỏi ♭3.`,
        'Tư duy của Claude — lý thuyết + Jeff (Dm11 = Dm + C); không phải số đo thầy.',
      ),
      goiY: `Tay phải bấm hợp âm chủ, tay trái giữ bass ${n(2)}.`,
      meo: 'not-nha',
      giang: `${h(2, 'm')} đứng trước ${h(7, '')} — ô lấy đà. Ở đây ii mượn cả ba nốt của nhà: tay phải bấm ${h(0, '')}, tay trái bấm ${n(2)} — thành ${h(2, 'm11')}. Nghe rộng, mở, như bầu trời trước khi sang V, mà vẫn còn hơi ấm của nhà. Sang V tay phải gần như đứng yên: ${n(0)} bước xuống ${n(11)}, ${n(7)} đứng yên — chuyển rất êm.`,
    },
    {
      bac: 4,
      ho: [M],
      khi: sau(9, M),
      dap: [H(4, '7b9')],
      cung: [[H(4, '7b13')]],
      loi: loi(
        `${h(4, 'm')} trước ${h(9, 'm')} → ${h(4, '7b9')}`,
        `Biến iii thành át phụ của vi: nâng ${n(7)} lên ${n(8, 5)} — nốt dẫn nửa cung vào ${n(9)} — và thêm ♭9 (${n(5)}): nốt ấy có sẵn trong gam, rơi nửa cung xuống ${n(4)}. Đích là hợp âm thứ nên ♭9 nghe tự nhiên. vi đến như một cú rơi có chủ ý — kịch tính, buồn sang. Gốc ý: át phụ của Cà Pháo (I7 trước iv, II7 trước V) và V7♭9 của Linh Nhi ở bài thứ.`,
        'Tư duy của Claude — chưa thấy III7 trong sheet thầy đã đo.',
      ),
      goiY: 'Biến iii thành hợp âm kéo vi tới, thêm một nốt căng có sẵn trong gam.',
      meo: 'at-phu',
      giang: `${h(4, 'm')} sắp sang ${h(9, 'm')}. Biến nó thành nam châm kéo vi: nâng ${n(7)} lên ${n(8, 5)} (nốt sát dưới ${n(9)}) — thành ${h(4, '7')} — rồi thêm ${n(5)} cho căng (${h(4, '7b9')}). ${n(5)} là nốt của gam và rơi nửa cung xuống ${n(4)} của ${h(9, 'm')}. Đích là hợp âm thứ nên chọn nốt căng "♭". Nghe kịch tính, buồn sang — vi đến như một cú rơi có chủ ý.`,
    },
    {
      bac: 5,
      ho: [T],
      khi: sau(0),
      dap: [H(5, 'maj7'), H(5, 'm6')],
      cung: [[H(5, 'maj7')]],
      loi: loi(
        `${h(5, '')} về ${h(0, '')} → ${h(5, 'maj7')} rồi ${h(5, 'm6')}`,
        `Nửa sau mượn iv của ${cungChu}: ${n(9)} hạ xuống ${n(8, 6)} rồi rơi tiếp xuống ${n(7)} của I — một nốt đi nửa cung hai lần, như nắng tắt dần mà vẫn về nhà sáng. m6 thêm ${n(2)}: ${h(5, 'm6')} = ${h(2, 'm7b5')} đổi bass, chất jazz. Linh Nhi mượn iv cho cả đoạn kết; ở đây chỉ mượn nửa ô cho mỗi lần về nhà.`,
        'Tư duy của Claude — Linh Nhi mượn iv ở kết Đường Xưa (md 13c); IV → iv → I là lý thuyết.',
      ),
      goiY: 'Nửa sau ô: mượn một hợp âm của giọng thứ cùng chủ âm — một nốt hạ nửa cung.',
      meo: 'muon',
      giang: `${h(5, '')} sắp về nhà. Nửa sau mượn hợp âm của "nhà buồn" cùng tên: hạ ${n(9)} xuống ${n(8, 6)} và thêm ${n(2)} — thành ${h(5, 'm6')}. Rồi ${n(8, 6)} lại rơi xuống ${n(7)} của nhà: một nốt đi xuống nửa cung hai lần, như nắng tắt dần mà vẫn về nhà sáng.`,
    },
    {
      bac: 5,
      ho: [T],
      khi: sau(7),
      dap: [H(5, 'maj9'), H(6, 'dim7')],
      cung: [[H(5, 'maj9')]],
      loi: loi(
        `${h(5, '')} sắp sang ${h(7, '')} → ${h(5, 'maj9')} rồi ${h(6, 'dim7')}`,
        `Bass ${n(5)} → ${n(6, 4)} → ${n(7)} leo nửa cung vào V — "bước lên bậc thềm" của Ray (Blues, ♯IV° ở ô 11–12) và hợp âm giảm cho bass đi nửa cung của Linh Nhi. ${h(6, 'dim7')} là ${h(2, '7b9')} bỏ gốc — át của V — nên V đến chắc chắn hơn.`,
        'Tư duy của Claude — ghép Ray (I · IV · ♯IV° · V) và Linh Nhi (F → F♯m7♭5 → C ở Đường Xưa, 3 chỗ).',
      ),
      goiY: `Nửa sau ô: một hợp âm lướt cho bass đi nửa cung lên ${n(7)}.`,
      meo: 'giam',
      giang: `${h(5, '')} sắp sang ${h(7, '')}. Nửa sau chèn ${h(6, 'dim7')}: bass leo nửa cung ${n(5)} → ${n(6, 4)} → ${n(7)} — bước lên bậc thềm (lối Ray, Blues). Ba trong bốn nốt của ${h(6, 'dim7')} dẫn nửa cung vào V, nên V đến chắc chắn.`,
    },
    {
      bac: 5,
      ho: [T],
      dap: [H(5, 'maj9#11')],
      cung: [[H(5, 'maj9')]],
      loi: loi(
        `Bài ghi ${h(5, '')} → ${h(5, 'maj9#11')}`,
        `${n(11)} là ♯11 của ${n(5)} mà vẫn là nốt gam — IV là chỗ duy nhất của giọng trưởng có sẵn màu Lydian: lấp lánh, bay. Cà Pháo đặt ♯11 lên ♭VI ở bài thứ (cùng lẽ: ♭VI là bậc Lydian của giọng thứ); ở đây đem sang IV của bài trưởng. Tránh khi giai điệu ngân ${n(0)} — ${n(11)} sát dưới sẽ cọ.`,
        'Tư duy của Claude — lý thuyết (bậc IV) + Cà Pháo (♭VI có ♯11, bản phổ biến không ghi 8/8 chỗ).',
      ),
      goiY: 'Màu Lydian: thêm nốt ♯11 — có sẵn trong gam.',
      meo: 'maj7',
      giang: `${h(5, '')} rời nhà nhẹ. Thêm ${n(4)} (7 trưởng), ${n(7)} (9) và ${n(11)} (♯11): ${h(5, 'maj9#11')} lấp lánh, bay bổng. ${n(11)} là nốt của gam nên không lạ — IV là chỗ duy nhất của bài trưởng có màu "bay" này (giống ♭VI của bài thứ ở Cà Pháo). Tránh khi giọng hát ngân ${n(0)}.`,
    },
    {
      bac: 7,
      ho: [T, D],
      khi: sau(0),
      dap: [H(1, '9')],
      cung: [[H(7, '13b9')], [H(1, '7')]],
      loi: loi(
        `${h(7, '7')} về ${h(0, '')} → ${h(1, '9')} (thay tam cung)`,
        `${h(1, '9')} và ${h(7, '7')} chung cặp ${n(11)} – ${n(5)} (viết khác tên) nên vẫn kéo về nhà; bass trượt nửa cung ${n(1, 2)} → ${n(0)} thay vì nhảy quãng năm. Nhìn từ ${n(7)}, các nốt còn lại của ${h(1, '9')} là ♭9, ♯11, ♭13 — một ${h(7, '7')} căng không gốc. Ray, Robert dùng ở câu kết; phong cách này dùng mọi lần V về I, vì bass nửa cung là "chữ ký" của nó.`,
        'Tư duy của Claude — Ray (♭II7 → I13 ở đuôi kết), Robert (♭II7 → I, 5/98 ký hiệu); dùng mọi lần V → I là lựa chọn của Claude.',
      ),
      goiY: `Giữ cặp nốt ba cung của V, đổi gốc sao cho bass trượt nửa cung xuống ${n(0)}.`,
      meo: 'tam-cung',
      giang: `${h(7, '')} sắp về nhà. Thay nó bằng ${h(1, '9')}: hai hợp âm có chung hai nốt quan trọng (${n(11)} và ${n(5)}), nên vẫn kéo về nhà — nhưng bass trượt nửa cung ${n(1, 2)} → ${n(0)} thay vì nhảy xa. Nghe trơn, sang, rất jazz — như trượt vào nhà trên một tấm thảm.`,
    },
    {
      bac: 7,
      ho: [T, D],
      dap: [H(7, '9sus4')],
      cung: [[H(7, '13')]],
      loi: loi(
        `${h(7, '')} (không về I) → ${h(7, '9sus4')}`,
        `${h(7, '9sus4')} = ${h(5, '', 7)}: bỏ nốt cảm âm nên V hết "đòi" về nhà — hợp khi V đi sang vi hay IV. Treo bậc 4 là lối của Cà Pháo (V7sus4 rồi V13); ở đây treo luôn, không thả.`,
        'Tư duy của Claude — Cà Pháo treo V trước khi về I ("Csus4/G" soát tay 3/3 chỗ).',
      ),
      goiY: 'V không về nhà: bỏ nốt cảm âm — treo bậc 4, thêm 9.',
      meo: 'v-cang',
      giang: `${h(7, '')} ở đây không về nhà. Bỏ ${n(11)} (nốt kéo về), treo ${n(0)} thay vào, thêm ${n(9)}: ${h(7, '9sus4')} — bấm như ${h(5, '')} đặt trên bass ${n(7)}. V hết "đòi" về nhà, nghe lửng lơ, hiện đại — hợp khi câu nhạc rẽ sang chỗ khác.`,
    },
    {
      bac: 9,
      ho: [M],
      khi: sau(2, M),
      dap: [H(9, '7b9')],
      loi: loi(
        `${h(9, 'm')} trước ${h(2, 'm')} → ${h(9, '7b9')}`,
        `Nâng ${n(0)} lên ${n(1, 1)} — nốt dẫn của ${n(2)} — và thêm ♭9 (${n(10, 7)}): vi thành át phụ căng của ii. Đích là hợp âm thứ nên ♭9 tự nhiên. Nghe như vòng "I – VI7 – ii – V" của nhạc xưa: tối đi một chút rồi bừng lên.`,
        'Tư duy của Claude — vòng I – VI7 – ii – V là lý thuyết; chưa thấy trong sheet thầy đã đo.',
      ),
      goiY: 'Biến vi thành hợp âm kéo ii tới, thêm một nốt căng.',
      meo: 'at-phu',
      giang: `${h(9, 'm')} sắp sang ${h(2, 'm')}. Biến vi thành nam châm kéo ii: nâng ${n(0)} lên ${n(1, 1)} (nốt sát dưới ${n(2)}) và thêm ${n(10, 7)} cho căng — ${h(9, '7b9')}. Đích là hợp âm thứ nên chọn nốt căng "♭". Nghe như vòng nhạc xưa: tối đi một chút rồi bừng lên.`,
    },
    {
      bac: 9,
      ho: [M],
      khi: sau(5, T),
      dap: [H(9, 'm9'), H(9, 'm7', 7)],
      cung: [[H(9, 'm9')]],
      loi: loi(
        `${h(9, 'm')} sắp sang ${h(5, '')} → ${h(9, 'm9')} rồi ${h(9, 'm7', 7)}`,
        `Bass ${n(9)} → ${n(7)} → ${n(5)} bước xuống từng bậc — "cầu thang" của Linh Nhi; tay phải giữ nguyên vi, chỉ bass đi (như cách chị đặt ♭VImaj7, ii°7). Tầng trên đứng yên, nền dưới chân trượt dần: buồn mà liền.`,
        'Tư duy của Claude — ghép "đổi bass, giữ tầng trên" và "bass đi xuống liền bậc" của Linh Nhi.',
      ),
      goiY: `Nửa sau ô: tay phải đứng yên, bass bước xuống một cung — để rồi xuống tiếp ${n(5)}.`,
      meo: 'bass-buoc',
      giang: `${h(9, 'm')} sắp sang ${h(5, '')}. Tay phải giữ nguyên vi, chỉ bass bước xuống ${n(7)} rồi ${n(5)}: ${n(9)} → ${n(7)} → ${n(5)} — cầu thang của Linh Nhi. Tầng trên đứng yên, nền dưới chân trượt dần: buồn mà liền.`,
    },
  ]
}

export const LUAT: Readonly<Record<PhongCach, (tonic: number, thu: boolean) => Luat[]>> = {
  'ca-phao': luatCaPhao,
  'linh-nhi': luatLinhNhi,
  blues: luatBlues,
  claude: luatClaude,
}

/* Bậc không có luật — lối chung của từng phong cách. Hợp âm (trưởng, át) đi xuống quãng năm vào hợp âm sau là át phụ: tô như V. */
const LOI_CHUNG: Readonly<Record<PhongCach, { giai: string; coSo: string; goiY: string }>> = {
  'ca-phao': {
    giai: 'Bậc này chưa có luật riêng của Cà Pháo. Theo lối chung của anh: đi đúng đường của bài, phủ màu lên từng hợp âm — hợp âm thứ thêm ♭7; hợp âm trưởng thêm 9; hợp âm kéo về (át, át phụ) thêm 13, hay ♭13 khi đích là hợp âm thứ.',
    coSo: 'Suy luận của Claude từ lối chung (309/400 hợp âm phần hát cùng gốc và loại với bản phổ biến; hợp âm thứ có ♭7 vang 140/172 đoạn) — chưa đo bậc này.',
    goiY: 'Lối chung của anh: hợp âm thứ thêm ♭7, trưởng thêm 9, hợp âm kéo về thêm 13 (♭13 khi đích là thứ).',
  },
  'linh-nhi': {
    giai: 'Bậc này chưa có lối riêng của Linh Nhi. Chị đi đúng đường của bài — gần như mọi hợp âm chị bấm là hợp âm của bài; chỗ không có lối riêng thì giữ.',
    coSo: 'Suy luận của Claude: 422/616 hợp âm phần hát cùng gốc và loại với bản phổ biến (8 bài) — chưa đo bậc này.',
    goiY: 'Chị đi đúng đường của bài.',
  },
  blues: {
    giai: 'Bậc này không có trong ba sheet blues. Theo lối chung: hợp âm trưởng thành hợp âm bảy át (đưa nốt blue vào hòa âm), hợp âm thứ thêm ♭7, hợp âm át thêm 9.',
    coSo: 'Suy luận của Claude từ khung blues (Rockhouse: hợp âm bảy trên I · IV · V 72/116 ký hiệu; Rising Sun: mọi hợp âm ngoài i thành hợp âm bảy) — chưa đo bậc này.',
    goiY: 'Hợp âm bảy khắp nơi.',
  },
  claude: {
    giai: 'Lối chung của phong cách thứ tư: hợp âm nào cũng có màu — trưởng thành maj9, thứ thành m9; hợp âm kéo về thêm 13, hay ♭9 khi đích là hợp âm thứ (♭9 khi ấy có sẵn trong gam của đích).',
    coSo: 'Tư duy của Claude — không phải số đo.',
    goiY: 'Hợp âm nào cũng có màu: 9 cho trưởng và thứ; 13 hay ♭9 cho hợp âm kéo về.',
  },
}

function macDinh(p: PhongCach, c: Canh, tonic: number, thu: boolean): DapAn {
  const { n, h } = nguCanh(tonic, thu)
  const hx = ho(c.x.chat)
  const keo = (hx === D || hx === T) && pc(c.x.goc - c.sau.goc) === 7
  const dichThu = ho(c.sau.chat) === M
  const chat: Record<PhongCach, string> = {
    'ca-phao': keo ? (dichThu ? '7b13' : '13') : hx === M ? 'm7' : hx === T ? 'add9' : c.x.chat,
    'linh-nhi': c.x.chat,
    blues: hx === M ? 'm7' : hx === T ? '7' : hx === D ? '9' : c.x.chat,
    claude: keo ? (dichThu ? '7b9' : '13') : hx === M ? 'm9' : hx === T ? 'maj9' : hx === D ? '13' : c.x.chat,
  }
  const dap = [{ ...c.x, chat: chat[p] }]
  const ten = (x: Hop) => h(x.goc, x.chat, x.bass)
  const g = c.x.goc
  const not = (semi: number) => n(pc(g + semi))
  const keoLoi = `${ten(c.x)} đứng ngay trước ${ten(c.sau)} và gốc của nó cao hơn gốc ${ten(c.sau)} một quãng năm — nó là nam châm kéo ${ten(c.sau)} tới.`
  const giang: Record<PhongCach, string> = {
    'ca-phao': keo
      ? `${keoLoi} Anh tô nó như tô V: thêm ${dichThu ? `${not(8)} (♭13) cho tối, hợp với đích là hợp âm thứ` : `${not(9)} (13) cho ấm`} — ${ten(dap[0]!)}.`
      : hx === M
        ? `Như mọi hợp âm thứ của anh Cà Pháo: thêm ${not(10)} (nốt 7) thành ${ten(dap[0]!)}. Mẹo tay: tay phải bấm ${h(pc(g + 3), '')}, tay trái bấm ${not(0)} — hợp âm trưởng trên nền thứ, nghe mềm và ấm hơn hợp âm thứ ba nốt.`
        : hx === T
          ? `Anh Cà Pháo hiếm khi để hợp âm trơn: thêm ${not(2)} (nốt 9) cho trong và mở — ${ten(dap[0]!)}.`
          : `Bài đã ghi ${ten(c.x)}: hợp âm ấy đã có sẵn nốt kéo (hay đã là hợp âm lướt). Chỗ này anh giữ nguyên — chưa có số đo anh tô thêm gì ở bậc này.`,
    'linh-nhi': `Chị Linh Nhi đi đúng đường của bài — ở chỗ này chị giữ ${ten(c.x)}. Màu của chị nằm ở tay trái rải đi liền lên, không ở tên hợp âm.`,
    blues:
      hx === M
        ? `Blues cho hợp âm thứ thêm ${not(10)} (nốt 7): ${ten(dap[0]!)} — đục và mềm, hợp tiếng blues.`
        : hx === T
          ? `Blues biến hợp âm trưởng thành hợp âm 7: thêm ${not(10)} — ${ten(dap[0]!)}. Nốt ấy là nốt "blue": bụi bặm, lười nhác.`
          : hx === D
            ? `Hợp âm 7 đã có; blues tô thêm ${not(2)} (nốt 9) cho tròn — ${ten(dap[0]!)}.`
            : `${ten(c.x)} là hợp âm lướt — đã đủ căng và bass đã đi nửa cung. Blues giữ nguyên ở chỗ này.`,
    claude: keo
      ? `${keoLoi} Thêm nốt căng: ${dichThu ? `${not(1)} (♭9) — đích là hợp âm thứ nên chọn nốt "♭"` : `${not(9)} (13) — đích là hợp âm trưởng nên chọn nốt tự nhiên`}: ${ten(dap[0]!)}.`
      : hx === M
        ? `Hợp âm thứ nào cũng thêm 7 và 9 (${not(10)}, ${not(2)}): ${ten(dap[0]!)} — rộng và mềm.`
        : hx === T
          ? `Hợp âm trưởng thêm 7 trưởng và 9 (${not(11)}, ${not(2)}): ${ten(dap[0]!)} — mơ màng, rộng.`
          : hx === D
            ? `Hợp âm 7 thêm ${not(9)} (13) cho ấm: ${ten(dap[0]!)}.`
            : `${ten(c.x)} là hợp âm lướt — đã đủ căng và bass đã đi nửa cung. Giữ nguyên ở chỗ này.`,
  }
  const meo: Record<PhongCach, MeoId> = {
    'ca-phao': keo ? 'at-phu' : hx === M ? 'doi-bass' : 'thay-cp',
    'linh-nhi': 'ln-giu',
    blues: 'blues-7',
    claude: keo ? 'at-phu' : 'thay-claude',
  }
  return {
    dap,
    cung: [],
    y: chat[p] === c.x.chat ? `Bài ghi ${ten(c.x)} → giữ ${ten(c.x)}` : `Bài ghi ${ten(c.x)} → ${ten(dap[0]!)}`,
    ...LOI_CHUNG[p],
    giang: giang[p],
    meo: meo[p],
    nguon: p === 'claude' ? 'claude' : 'suy',
  }
}

/** Đáp án của phong cách `p` cho ô `i` (vòng lặp: ô trước ô đầu là ô cuối). Gốc tính từ chủ âm. */
export function dapAn(p: PhongCach, vong: readonly Hop[], i: number, tonic: number, thu: boolean): DapAn {
  const c: Canh = { x: vong[i]!, truoc: vong[(i - 1 + vong.length) % vong.length]!, sau: vong[(i + 1) % vong.length]! }
  const hx = ho(c.x.chat)
  const l = LUAT[p](tonic, thu).find((r) => r.bac === c.x.goc && r.ho.includes(hx) && (!r.khi || r.khi(c)))
  if (!l) return macDinh(p, c, tonic, thu)
  // Bài ghi hợp âm đảo (C/E) mà đáp án chỉ đổi màu thì giữ bass của bài.
  const dap = c.x.bass !== undefined && l.dap.length === 1 && l.dap[0]!.goc === c.x.goc && l.dap[0]!.bass === undefined ? [{ ...l.dap[0]!, bass: c.x.bass }] : l.dap
  const loi = l.diem && p !== 'claude' ? lyDoThay(p, tonic, thu)!.bac[l.diem[0]]![l.diem[1]]! : l.loi!
  return {
    dap,
    cung: l.cung ?? [],
    goiY: l.goiY,
    giang: l.giang,
    meo: l.meo,
    y: loi.y,
    giai: loi.giai,
    ai: loi.ai,
    viDu: loi.viDu,
    coSo: loi.coSo,
    nguon: p === 'claude' ? 'claude' : 'thay',
  }
}

/** Các ô là hợp âm chủ: gốc là chủ âm, đúng họ của giọng; giọng trưởng không có hợp âm chủ trưởng thì lấy I7 (chủ âm của blues). */
export function oChu(vong: readonly Hop[], thu: boolean): boolean[] {
  const la = (x: Hop, h: string) => x.goc === 0 && ho(x.chat) === h
  const chinh = vong.map((x) => la(x, thu ? M : T))
  return thu || chinh.some(Boolean) ? chinh : vong.map((x) => la(x, D))
}

export interface Giong {
  tonic: number
  thu: boolean
}

const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
/** Thứ tự nhiên + bậc 6 nâng (IV trưởng kiểu Dorian) + bậc 7 nâng (V có cảm âm). */
const GAM_THU = [0, 2, 3, 5, 7, 8, 9, 10, 11]

/**
 * Đoán chủ âm của một VÒNG LẶP — chỉ xét giọng có hợp âm chủ nằm trong vòng (chủ âm phải tái hòa âm sẵn được). Không dùng
 * `detectKey` của bộ tái hòa âm: hàm ấy trừ 4 điểm giọng thứ không có nốt cảm âm nên đọc "F G Am" ra Fa trưởng (đo 11/10/2026) —
 * vòng ♭VI – ♭VII – i rất hay gặp. Điểm: −3 mỗi hợp âm ngoài giọng (trừ át phụ đi xuống quãng năm), +2 mỗi bước kéo về chủ (V → I,
 * ♭II7 → I: 1; v, IV, ♭VII, vii° → I: 0,5; vòng lặp nên ô cuối nối ô đầu), + phần ô là hợp âm chủ, +1 hợp âm cuối là chủ, +0,5 hợp
 * âm đầu là chủ, +0,25 cho giọng trưởng khi hòa. Trọng số là đặt tay của Claude, soát trên các vòng trong test — chưa đo trên bài thật.
 * Trả danh sách xếp theo điểm; [0] là giọng đoán.
 */
export function doanGiong(ds: readonly ParsedChord[]): Giong[] {
  const hoC = (c: ParsedChord) => ho(c.quality.symbol)
  const laChu = (c: ParsedChord, g: Giong) => c.root === g.tonic && (g.thu ? hoC(c) === M : hoC(c) === T || hoC(c) === D)
  const ung: Giong[] = []
  for (const c of ds) {
    if (hoC(c) === O) continue
    const g = { tonic: c.root, thu: hoC(c) === M }
    if (!ung.some((u) => u.tonic === g.tonic && u.thu === g.thu)) ung.push(g)
  }
  const ke = (k: number) => ds[(k + 1) % ds.length]!
  const diem = (g: Giong) => {
    const gam = g.thu ? GAM_THU : GAM_TRUONG
    const ngoai = ds.filter((c, k) => {
      if (hoC(c) !== M && pc(c.root - ke(k).root) === 7) return false
      const khung = [c.root, ...c.quality.intervals.filter((v) => v > 0 && v <= 8).map((v) => c.root + v)]
      return khung.some((p) => !gam.includes(pc(p - g.tonic)))
    }).length
    let ket = 0
    if (ds.length > 1)
      ds.forEach((a, k) => {
        if (!laChu(ke(k), g) || laChu(a, g)) return
        const d = pc(a.root - g.tonic)
        const ha = hoC(a)
        ket += (d === 7 && ha !== M) || (d === 1 && ha === D) ? 1 : d === 7 || d === 5 || d === 10 || (d === 11 && ha === O) ? 0.5 : 0
      })
    const chu = ds.filter((c) => laChu(c, g)).length / ds.length
    return -3 * ngoai + 2 * ket + chu + (laChu(ds[ds.length - 1]!, g) ? 1 : 0) + (laChu(ds[0]!, g) ? 0.5 : 0) + (g.thu ? 0 : 0.25)
  }
  return ung
    .map((g) => ({ g, d: diem(g) }))
    .sort((a, b) => b.d - a.d)
    .map((x) => x.g)
}

export interface LuaChon {
  hop: Hop[]
  /** Phương án ấy từ đâu ra: lối của thầy nào, giữ nguyên, hay một loại thay (`LOAI`). */
  nguon: string
}
export interface CauDo {
  laChu: boolean
  dap: DapAn
  /** Bốn phương án (ô chủ âm: rỗng); `dung` là chỗ của đáp án. */
  luaChon: LuaChon[]
  dung: number
}

/** Xáo cố định theo tên — mở lại cùng vòng thì thứ tự không đổi. */
const bam = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000003, 7)

/**
 * Bài đố cho cả vòng theo phong cách `p`: ô chủ âm có đáp án sẵn; ô khác bốn phương án — đáp án + ba phương án sai lấy theo thứ tự: giữ
 * nguyên, đáp án của ba phong cách kia, các lối thay (`cacLuaChon`, lối màu để sau cùng). Không đưa phương án "cũng đúng" làm phương án sai.
 */
export function taoDo(p: PhongCach, vong: readonly Hop[], tonic: number, thu: boolean): CauDo[] {
  const { h } = nguCanh(tonic, thu)
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  const chu = oChu(vong, thu)
  const tenP = PHONG_CACH.find((q) => q.id === p)!.ten
  return vong.map((x, i) => {
    const dap = dapAn(p, vong, i, tonic, thu)
    if (chu[i]) return { laChu: true, dap, luaChon: [], dung: -1 }
    const dung = new Set([dap.dap, ...dap.cung].map(ten))
    const ung: LuaChon[] = [
      { hop: [x], nguon: 'Giữ nguyên hợp âm của bài' },
      ...PHONG_CACH.filter((q) => q.id !== p).map((q) => ({ hop: dapAn(q.id, vong, i, tonic, thu).dap, nguon: `Lối của ${q.ten}` })),
      ...cacLuaChon(vong, i, thu)
        .sort((a, b) => Number(a.loai === 'mau') - Number(b.loai === 'mau'))
        .map((l) => ({ hop: l.thay, nguon: LOAI[l.loai].ten })),
    ]
    const sai: LuaChon[] = []
    for (const u of ung) if (sai.length < 3 && !dung.has(ten(u.hop)) && !sai.some((s) => ten(s.hop) === ten(u.hop))) sai.push(u)
    const luaChon = [{ hop: dap.dap, nguon: `Lối của ${tenP}` }, ...sai].sort((a, b) => bam(ten(a.hop) + i) - bam(ten(b.hop) + i))
    return { laChu: false, dap, luaChon, dung: luaChon.findIndex((l) => ten(l.hop) === ten(dap.dap)) }
  })
}
