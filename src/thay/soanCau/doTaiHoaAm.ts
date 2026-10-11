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
}
export interface DapAn extends Loi {
  dap: Hop[]
  cung: Hop[][]
  goiY: string
  /** 'thay': lời thầy đã duyệt · 'suy': bậc chưa có luật, suy từ lối chung · 'claude': tư duy của Claude. */
  nguon: 'thay' | 'suy' | 'claude'
}

/** Hợp âm sau là bậc `goc` (họ nằm trong `hos` nếu có). */
const sau =
  (goc: number, ...hos: string[]) =>
  (c: Canh) =>
    c.sau.goc === goc && (!hos.length || hos.includes(ho(c.sau.chat)))

function luatCaPhao(tonic: number, thu: boolean): Luat[] {
  const { n } = nguCanh(tonic, thu)
  const tho = 'Hợp âm thứ của anh gần như không để trơn — tay phải nắm thêm ♭7 ngay dưới giai điệu.'
  if (thu)
    return [
      { bac: 0, ho: [M], khi: sau(5, M), dap: [H(0, '7')], cung: [[H(0, 'm7')]], diem: [0, 1], goiY: 'i sắp sang iv: anh "bẻ lái" — nâng một nốt của i lên nửa cung cho i kéo iv tới.' },
      { bac: 0, ho: [M], dap: [H(0, 'm7')], cung: [[H(0, 'm9')]], diem: [0, 0], goiY: tho },
      { bac: 0, ho: [D], khi: sau(5, M), dap: [H(7, 'm7'), H(0, '7')], cung: [[H(0, '7')]], diem: [0, 1], goiY: 'Bài đã có hợp âm kéo iv; anh có khi rẽ vào "hẻm" — nửa đầu ô chèn hợp âm ii của iv.' },
      { bac: 2, ho: [O], khi: sau(7), dap: [H(2, '7')], cung: [[H(2, '7b5')]], diem: [2, 0], goiY: 'Trước V, anh đổi đúng một nốt của hợp âm giảm — nâng nửa cung — cho nó thành "át của át".' },
      { bac: 3, ho: [T], dap: [H(3, 'maj7')], diem: [3, 0], goiY: 'Chỗ bài ghé sang trưởng: anh phủ một lớp sương — thêm nốt nằm nửa cung dưới gốc.' },
      { bac: 5, ho: [M], khi: sau(7), dap: [H(5, 'm7')], cung: [[H(5, 'm9')]], diem: [5, 0], goiY: `iv đi nhanh sang V. ${tho}` },
      { bac: 5, ho: [M], dap: [H(5, 'm9')], cung: [[H(5, 'm7')]], diem: [5, 0], goiY: 'iv ngân lâu: thêm ♭7 và một nốt nữa — bậc 5 của giọng, nốt có trong cả i lẫn V.' },
      { bac: 7, ho: [T, D], dap: [H(7, '7b13')], cung: [[H(7, '9')]], diem: [7, 0], goiY: 'V của anh mang sẵn nỗi buồn của nhà: đặt bậc ♭3 của giọng lên trên V.' },
      {
        bac: 8,
        ho: [T],
        dap: [H(8, 'maj7')],
        cung: [[H(8, 'maj9')], [H(8, 'maj9#11')], [H(5, 'm9')]],
        diem: [8, 0],
        goiY: `♭VI của anh là ba nốt của i đặt trên bass ${n(8)}.`,
      },
      { bac: 10, ho: [T], khi: sau(0), dap: [H(10, 'add9')], diem: [10, 0], goiY: '♭VII sắp về i: thêm một nốt — chính là chủ âm — cho tai nghe nhà vang ở trên.' },
      { bac: 10, ho: [T], dap: [H(10, '7')], cung: [[H(10, 'add9')]], diem: [10, 0], goiY: '♭VII đẩy tiếp sang hợp âm sau: thêm ♭7 — nốt ấy muốn rơi xuống bậc 5 của giọng.' },
    ]
  return [
    { bac: 0, ho: [T], khi: sau(7), dap: [H(0, 'add9'), H(2, '13')], cung: [[H(0, 'add9')]], diem: [0, 1], goiY: `I đứng ngay trước V: nửa sau ô, bass bước lên một cung, hợp âm mới có nốt dẫn nửa cung vào ${n(7)}.` },
    { bac: 0, ho: [T], khi: sau(5, T), dap: [H(0, '7')], cung: [[H(0, 'add9')]], diem: [0, 2], goiY: 'I sắp sang IV: thêm một nốt cho I thành hợp âm kéo IV tới — nốt ấy rơi nửa cung xuống bậc 3 của IV.' },
    { bac: 0, ho: [T], dap: [H(0, 'add9')], cung: [[H(0, 'maj7')]], diem: [0, 0], goiY: 'Màu "trong" của anh cho I: thêm một nốt gam nằm sát dưới bậc 3, không thêm 7.' },
    { bac: 0, ho: [D], dap: [H(0, '7')], diem: [0, 2], goiY: 'Bài đã ghi hợp âm kéo IV — anh giữ đúng như thế.' },
    { bac: 4, ho: [M], dap: [H(4, 'm7')], diem: [4, 0], goiY: tho },
    { bac: 5, ho: [T], dap: [H(5, 'maj7')], cung: [[H(5, '6')]], diem: [5, 0], goiY: `IV trong tay anh là hợp âm vi đặt trên bass ${n(5)}.` },
    { bac: 7, ho: [T, D], khi: sau(0), dap: [H(7, '7sus4'), H(7, '13')], cung: [[H(7, '13')]], diem: [7, 0], goiY: 'Trước khi về I, anh cho V treo một nhịp — bậc 3 thay bằng bậc 4 — rồi mới thả, nửa sau thêm màu ấm.' },
    { bac: 7, ho: [T, D], dap: [H(7, '13')], cung: [[H(7, '9')]], diem: [7, 0], goiY: 'V ngân mà không về I: anh tô thêm nốt 13 cho ấm, tròn.' },
    { bac: 9, ho: [M], dap: [H(9, 'm7')], diem: [9, 0], goiY: `vi trong tay anh là hợp âm I đặt trên bass ${n(9)}.` },
  ]
}

function luatLinhNhi(tonic: number, thu: boolean): Luat[] {
  const { n, h } = nguCanh(tonic, thu)
  const rai = 'Màu của chị đến từ tay trái rải đi liền lên — quãng tám, rồi bước thêm một bậc.'
  if (thu)
    return [
      { bac: 0, ho: [M], khi: (c) => c.sau.goc === 8 || c.sau.goc === 7, dap: [H(0, 'm'), H(10, '')], cung: [[H(0, 'm(add9)')]], diem: [10, 0], goiY: 'i sắp đi xuống ♭VI hay V: nửa sau ô chị chèn một hợp âm cho bass bước xuống từng bậc.' },
      { bac: 0, ho: [M], dap: [H(0, 'm(add9)')], cung: [[H(0, 'm7')]], diem: [0, 0], goiY: rai },
      { bac: 0, ho: [D], dap: [H(0, '7')], cung: [[H(0, '7', 4)]], diem: [0, 1], goiY: 'Bước này là của bài — chị giữ; có chỗ chị đổi nốt bass cho bass đi nửa cung.' },
      { bac: 2, ho: [O], dap: [H(2, 'm7b5')], diem: [2, 0], goiY: `ii° của chị luôn có ♭7 — nó là iv đặt trên bass ${n(2)}.` },
      { bac: 3, ho: [T], dap: [H(3, 'maj7')], cung: [[H(3, 'add9')]], diem: [3, 0], goiY: 'Chị tô chỗ sáng của bài bằng một nốt nằm nửa cung dưới gốc.' },
      { bac: 5, ho: [M], khi: sau(7), dap: [H(5, 'm'), H(2, 'm7b5')], cung: [[H(5, 'm(add9)')]], diem: [2, 0], goiY: 'iv chưa vội sang V: nửa sau ô, tay phải giữ nguyên, chỉ bass hạ một quãng ba.' },
      { bac: 5, ho: [M], dap: [H(5, 'm(add9)')], diem: [5, 0], goiY: `${rai} Nốt thêm ở iv là bậc 5 của giọng.` },
      {
        bac: 7,
        ho: [T],
        khi: (c) => c.x.chat === '',
        dap: [H(7, '7')],
        cung: [[H(7, '7b13')], [H(7, '7b9')], [H(7, '7sus4'), H(7, '7')]],
        diem: [7, 0],
        goiY: 'V của bài thứ: chị giữ nốt cảm âm, và có ♭7 như phần lớn bản phổ biến.',
      },
      { bac: 7, ho: [T, D], dap: [H(7, '7b13')], cung: [[H(7, '7b9')], [H(7, '7sus4'), H(7, '7')]], diem: [7, 0], goiY: 'Nốt trên cùng của V ngân bậc ♭3 của giọng — V mang sẵn nỗi buồn của i.' },
      { bac: 8, ho: [T], dap: [H(8, 'maj7')], diem: [8, 0], goiY: 'Từ i sang ♭VI chị không đổi tay phải — chỉ bass bước xuống.' },
      { bac: 10, ho: [T], dap: [H(10, '')], diem: [10, 0], goiY: '♭VII của chị là bậc thang cho bass — việc của nó là đường đi, không phải màu.' },
    ]
  const vTron = 'V của chị: nốt cảm âm và bass đã đủ kéo về — chị bớt chứ không thêm.'
  return [
    { bac: 0, ho: [T], khi: sau(9, M), dap: [H(0, ''), H(0, '', 11)], cung: [[H(0, 'maj7')], [H(0, 'add9')]], diem: [9, 0], goiY: 'I sắp sang vi: chị không nhảy thẳng — bass bước xuống từng bậc, tay phải đứng yên.' },
    { bac: 0, ho: [T], dap: [H(0, 'add9')], cung: [[H(0, 'maj7')]], diem: [0, 0], goiY: rai },
    { bac: 2, ho: [M, D], khi: (c) => c.truoc.goc === 0 && c.sau.goc === 0, dap: [H(2, '7')], diem: [2, 0], goiY: 'ii chen giữa hai lần I: chị cho nó lóe sáng — nâng bậc 3 lên nửa cung — rồi về thẳng I.' },
    { bac: 2, ho: [M], dap: [H(2, 'm7')], cung: [[H(2, 'm9')]], diem: [2, 1], goiY: 'Chị giữ ii của bài, thêm một nốt — chính là chủ âm — cho ii dính với nhà.' },
    { bac: 4, ho: [M], dap: [H(4, 'm')], diem: [4, 0], goiY: 'iii của chị để trơn.' },
    { bac: 5, ho: [T], dap: [H(5, '')], cung: [[H(5, 'm')]], diem: [5, 0], goiY: 'Phần hát chị giữ đúng hợp âm của bài; chỉ đoạn kết mới mượn từ giọng thứ.' },
    { bac: 7, ho: [T, D], khi: (c) => c.truoc.goc === 5, dap: [H(7, '')], cung: [[H(6, 'm7b5')], [H(11, 'dim7')]], diem: [7, 0], goiY: vTron },
    { bac: 7, ho: [T, D], dap: [H(7, '')], diem: [7, 0], goiY: vTron },
    { bac: 9, ho: [M], khi: sau(2), dap: [H(9, 'm'), H(4, 'm')], diem: [4, 0], goiY: 'vi sang ii: nửa sau ô chị chèn thêm một hợp âm thứ — chuỗi hợp âm thứ đi dần về V.' },
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
    },
  ]
}

function luatBlues(tonic: number, thu: boolean): Luat[] {
  const { n } = nguCanh(tonic, thu)
  if (thu)
    return [
      { bac: 0, ho: [M], dap: [H(0, 'm11')], cung: [[H(0, 'm7')], [H(0, 'm9')]], diem: [0, 0], goiY: 'Chủ thứ là chỗ đứng yên duy nhất của bản phối — giữ hợp âm thứ, thêm một nốt cho nó rộng và tối.' },
      { bac: 3, ho: [T, D], dap: [H(3, '13')], cung: [[H(3, '7')]], diem: [3, 0], goiY: 'Mọi hợp âm ngoài i thành hợp âm bảy át — thêm cả 9, 13 cho đầy.' },
      { bac: 5, ho: [T, D], dap: [H(5, '7')], diem: [5, 0], goiY: 'IV trưởng giữa bài thứ, thêm ♭7 — nốt ấy là ♭3 của giọng, nốt trong gam.' },
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
      },
      { bac: 7, ho: [T, D], dap: [H(7, '7#9')], diem: [7, 0], goiY: 'Cho hai bậc 7 của gam thứ vang cùng lúc trên V.' },
      { bac: 8, ho: [T, D], dap: [H(8, '7')], diem: [8, 0], goiY: '♭7 của ♭VI chính là nốt blue ♭5 của giọng.' },
    ]
  const vBat = 'V bật lên: đặt nốt blue ♭7 của giọng lên trên V, cạnh bậc 3 trưởng.'
  return [
    { bac: 0, ho: [T, D], khi: sau(2, M), dap: [H(0, '', 4), H(3, 'dim7')], cung: [[H(0, '7')]], diem: [2, 0], goiY: `I sắp sang ii: Robert nối bằng một hợp âm lướt cho bass đi nửa cung xuống ${n(2)}.` },
    { bac: 0, ho: [T, D], khi: (c) => c.x.chat === '7', dap: [H(0, '13')], diem: [0, 0], goiY: 'Bài đã có I7; Ray tô thêm 13 cho tròn, ấm.' },
    { bac: 0, ho: [T, D], dap: [H(0, '7')], cung: [[H(0, '13')]], diem: [0, 0], goiY: 'Trong blues, chủ âm cũng mang nốt blue ♭7 của giọng.' },
    { bac: 2, ho: [M], dap: [H(2, 'm7')], diem: [2, 0], goiY: 'Robert mượn lối jazz cho ii: thêm ♭7, chuẩn bị V.' },
    { bac: 5, ho: [T, D], khi: sau(7), dap: [H(5, '7'), H(6, 'dim7')], cung: [[H(5, '7')], [H(5, '9')]], diem: [5, 0], goiY: 'IV sắp sang V: nửa sau ô, Ray chèn một hợp âm lướt cho bass leo nửa cung vào V.' },
    { bac: 5, ho: [T, D], khi: (c) => c.x.chat === '7', dap: [H(5, '9')], diem: [5, 0], goiY: 'Bài đã có IV7; Ray tô thêm 9 — nốt chung với I.' },
    { bac: 5, ho: [T, D], dap: [H(5, '7')], cung: [[H(5, '9')]], diem: [5, 0], goiY: '♭7 của IV chính là nốt blue ♭3 của giọng.' },
    { bac: 7, ho: [T, D], khi: sau(0), dap: [H(7, '7#9')], cung: [[H(7, '9')], [H(1, '7')]], diem: [7, 0], goiY: vBat },
    { bac: 7, ho: [T, D], dap: [H(7, '7#9')], cung: [[H(7, '9')]], diem: [7, 0], goiY: vBat },
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
    },
    {
      bac: 0,
      ho: [T],
      khi: sau(2, M),
      dap: [H(0, 'maj9'), H(1, 'dim7')],
      cung: [[H(0, 'maj9')]],
      loi: loi(
        `${h(0, '')} sắp sang ${h(2, 'm')} → nửa sau chèn ${h(1, 'dim7')}`,
        `Bass ${n(0)} → ${n(1, 1)} → ${n(2)} leo nửa cung. ${h(1, 'dim7')} là ${h(9, '7b9')} bỏ gốc — át phụ của ii — nên nó kéo vào ii; mọi nốt của nó cách hợp âm ii nửa cung. Nghe sang, cổ điển, kiểu piano phòng trà. Ý từ hợp âm giảm lướt của Linh Nhi (bass đi nửa cung) và Robert (Blues: I → ♭III° → ii).`,
        'Tư duy của Claude — chưa thấy đúng lối này trong sheet (Robert lướt đi xuống qua ♭III°; Linh Nhi đặt hợp âm giảm thay V).',
      ),
      goiY: `Nửa sau ô: một hợp âm lướt cho bass đi nửa cung lên ${n(2)}.`,
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
  const { h } = nguCanh(tonic, thu)
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
  return {
    dap,
    cung: [],
    y: chat[p] === c.x.chat ? `Bài ghi ${ten(c.x)} → giữ ${ten(c.x)}` : `Bài ghi ${ten(c.x)} → ${ten(dap[0]!)}`,
    ...LOI_CHUNG[p],
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
  return { dap, cung: l.cung ?? [], goiY: l.goiY, y: loi.y, giai: loi.giai, ai: loi.ai, viDu: loi.viDu, coSo: loi.coSo, nguon: p === 'claude' ? 'claude' : 'thay' }
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
