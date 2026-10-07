import { chordPitchClasses, findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import type { TeacherId } from '../teachers'
import { CONG_THUC, gocDep, hauDep, tenTrongGiong, theBamChong, vn } from './chongHopAm'

/*
  PHẦN 1 — vì sao mỗi bậc là hợp âm ấy, thay được bằng gì, và THẦY chọn gì ở đó, VÌ SAO. Viết lại 4/10/2026 theo người dùng: "Tôi ko cần
  kiểu giải thích máy móc này vì tôi đã học qua các kiến thức cơ bản này rồi … tại sao ở các bậc lại phải là các hợp âm như bạn đã liệt
  kê, có thể thay thế chúng bằng những hợp âm gì và thường trong đệm hát thì sẽ dùng hợp âm gì để thay thế (giống như Jeff đã thay G7
  bằng G13b9#11, tại sao lại có thể thay như vậy) … Tôi không cần bạn liệt kê ra các thầy đã sử dụng hợp âm hoặc nốt gì bao nhiêu lần
  ở những chỗ nào. Tôi yêu cầu bạn phải tư duy tại sao thầy lại chọn hợp âm đó ở vị trí đó và giải thích trung thực cấm không được qua
  loa hay bịa".
  Ba loại lời, không trộn: LÝ THUYẾT (hòa âm chung — viết cho mọi giọng bằng tên nốt của giọng đang chọn); THẦY (ý chính là lập luận;
  ví dụ là ô thật đã soát tay từng nốt; số đo dồn vào một dòng "Cơ sở" — luật CLAUDE.md đòi cỡ mẫu); SUY LUẬN của Claude ghi rõ.
  Số đo Linh Nhi: `tools/ly_do_hop_am_linh_nhi.py` (mục 13k md Linh Nhi).
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export interface NguCanh {
  /** Tên Việt của nốt cách chủ âm `semi` nửa cung; `bac` (1–7) ép chữ cái. */
  n: (semi: number, bac?: number) => string
  /** Tên hợp âm, gốc cách chủ âm `goc` nửa cung; `bass` cũng tính từ chủ âm. */
  h: (goc: number, chat: string, bass?: number) => string
  /** "La thứ". */
  giong: string
  /** Giọng song song cùng bộ khóa: La thứ ↔ Đô trưởng. */
  songSong: string
  /** Cùng chủ âm, đổi trưởng/thứ: Đô trưởng ↔ Đô thứ. */
  cungChu: string
}

export function nguCanh(tonic: number, thu: boolean): NguCanh {
  const ten = (semi: number, bac?: number) => tenTrongGiong(tonic, thu, semi, bac)
  const n = (semi: number, bac?: number) => vn(ten(semi, bac))
  return {
    n,
    h: (goc, chat, bass) => gocDep(ten(goc)) + hauDep(chat) + (bass === undefined ? '' : `/${gocDep(ten(bass))}`),
    giong: `${n(0)} ${thu ? 'thứ' : 'trưởng'}`,
    songSong: thu ? `${n(3)} trưởng` : `${n(9)} thứ`,
    cungChu: `${n(0)} ${thu ? 'trưởng' : 'thứ'}`,
  }
}

export interface Hop {
  goc: number
  chat: string
  bass?: number
}

/** Thế bấm để nghe: hợp âm có công thức chồng thì bấm theo công thức (nghe đúng màu); còn lại bấm mộc — gốc quãng tám 3, nốt quãng tám 4. */
export function theBamHop(tonic: number, x: Hop): number[] {
  const g = pc(tonic + x.goc)
  const ct = CONG_THUC.find((c) => c.kyHieu === x.chat)
  let not: number[]
  if (ct) {
    const t = theBamChong(ct, g)
    not = [...t.trai, ...t.phai]
  } else {
    const q = findQualityBySymbol(x.chat) ?? findQualityBySymbol('')!
    not = [48 + g, ...chordPitchClasses(g, q).map((p) => 60 + p)]
  }
  if (x.bass === undefined) return not
  const b = 36 + pc(tonic + x.bass)
  return [b, ...not.slice(1).filter((m) => m > b + 4)]
}

/* ---------------- Lý thuyết: vì sao bậc ấy là hợp âm ấy · thay bằng gì ---------------- */

export interface ThayBac extends Hop {
  viSao: string
}
export interface BacLyThuyet {
  /** Gốc của bậc, nửa cung so với chủ âm. */
  goc: number
  vai: string
  viSao: string
  thay: ThayBac[]
}

export function lyThuyetCacBac(tonic: number, thu: boolean): BacLyThuyet[] {
  const { n, h, songSong, cungChu } = nguCanh(tonic, thu)
  if (!thu)
    return [
      {
        goc: 0,
        vai: 'Nhà',
        viSao: `${h(0, '')} là chỗ câu nhạc muốn dừng: ${n(0)} – ${n(4)} – ${n(7)} là ba nốt vững nhất của giọng, nên giai điệu kết ở bậc 1, 3 hay 5 đều đậu được trên nó. Tô màu ở I thì chọn màu "yên" — maj7, 6, add9, 6/9: nốt thêm đều là nốt gam và không đứng ngay trên nốt khung nửa cung. Màu phải tránh là 11 (${n(5)}): nó nằm ngay trên ${n(4)} nửa cung, chỏi với chính bậc 3.`,
        thay: [
          { goc: 9, chat: 'm', viSao: `chung ${n(0)}, ${n(4)} — "nhà buồn". V → vi thay cho V → I là kết lừa: tai chờ về nhà thì rẽ sang ${h(9, 'm')}.` },
          { goc: 4, chat: 'm', viSao: `chung ${n(4)}, ${n(7)}; hợp khi giai điệu đứng ở ${n(4)}, ${n(7)} hay ${n(11)}. Lửng hơn, ít "nhà" hơn vi.` },
          { goc: 0, chat: '', bass: 4, viSao: `vẫn là I, bass ${n(4)}: dùng khi cần bass đi liền bậc (${h(0, '')} – ${h(0, '', 4)} – ${h(5, '')}).` },
        ],
      },
      {
        goc: 2,
        vai: 'Chuẩn bị',
        viSao: `${h(2, 'm7')} là ${h(5, '')} đặt trên bass ${n(2)} — ii và IV cùng một họ, cùng làm việc "rời nhà, chuẩn bị". ii hay đứng trước V vì hai lẽ: bass ${n(2)} → ${n(7)} là bước quãng 4 lên — bước bass mạnh nhất; và tầng trên gần như không phải đi: ${n(5)} đứng yên thành ♭7 của ${h(7, '7')}, ${n(0)} xuống ${n(11)}. Hợp âm thứ nhận 9 và 11 dễ (không chỏi với ♭3), nên ii là chỗ của m9, m11 — Jeff: ${h(2, 'm11')} = ${h(2, 'm')} + ${h(0, '')}.`,
        thay: [
          { goc: 5, chat: '', viSao: 'cùng họ, chung ba nốt với ii7 — sáng hơn, ít "đòi" đi tiếp hơn.' },
          { goc: 2, chat: '7', viSao: `ÁT PHỤ của V: nâng ${n(5)} lên ${n(6, 4)} — nốt cảm âm của ${n(7)} — nên ${h(2, '7')} kéo về ${h(7, '')} như V kéo về I. Chỉ dùng khi giai điệu không đứng ở ${n(5)}.` },
          { goc: 2, chat: '7sus4', viSao: `bỏ bậc 3 (cả ${n(5)} lẫn ${n(6, 4)}): không trưởng không thứ, lửng — sang V mềm hơn II7.` },
          { goc: 2, chat: 'm7b5', viSao: `MƯỢN ${cungChu}: ${n(9)} hạ thành ${n(8, 6)}, nốt ấy rơi xuống ${n(7)} — buồn hơn; hay đi tiếp ${h(7, '7b9')}.` },
        ],
      },
      {
        goc: 4,
        vai: 'Lửng',
        viSao: `${h(4, 'm')} chung hai nốt với I (${n(4)}, ${n(7)}) và hai nốt với V (${n(7)}, ${n(11)}), nên vai nó lửng — ít khi đứng ở chỗ quan trọng của câu. Hay gặp trong một đường đi (I → iii → vi, IV → iii → ii → V) và khi giai điệu đứng ở ${n(11)}: ${n(11)} trên ${h(0, '')} thành maj7, trên ${h(4, 'm')} là bậc 5 — êm hơn.`,
        thay: [
          { goc: 0, chat: '', bass: 4, viSao: `cùng bass ${n(4)}, chung hai nốt — "nhà" hơn.` },
          { goc: 4, chat: '7', viSao: `ÁT PHỤ của vi: nâng ${n(7)} lên ${n(8, 5)} — nốt cảm âm của ${n(9)}; ${h(4, '7')} → ${h(9, 'm')}.` },
        ],
      },
      {
        goc: 5,
        vai: 'Rời nhà nhẹ',
        viSao: `${h(5, '')} mang ${n(5)} — bậc 4, nốt muốn rơi xuống ${n(4)} — nhưng chưa có nốt cảm âm nên IV không "đòi" về. IV → I nghe êm, khép lại (kết "Amen"); IV → V thì đi tiếp. Màu hợp: maj7, 6, add9, và maj7♯11: ${n(11)} là ♯11 của ${n(5)} mà vẫn là nốt gam, nên IV là chỗ duy nhất của giọng trưởng có sẵn màu Lydian.`,
        thay: [
          { goc: 2, chat: 'm7', viSao: `cùng họ (${h(2, 'm7')} = ${h(5, '')} trên bass ${n(2)}) — buồn hơn, sang V gọn hơn.` },
          { goc: 5, chat: 'm', viSao: `MƯỢN ${cungChu}: hạ ${n(9)} xuống ${n(8, 6)}, nốt ấy rơi xuống ${n(7)} — buồn, sâu. IV → iv → I là bước rất hay của đệm hát.` },
          { goc: 10, chat: '', viSao: `MƯỢN ${cungChu}: ${h(10, '')} → ${h(0, '')} — sáng mà lạ, về nhà từ phía dưới.` },
        ],
      },
      {
        goc: 7,
        vai: 'Kéo về nhà',
        viSao: `Hai nốt làm nên V7 là ${n(11)} (nốt cảm âm, muốn lên ${n(0)}) và ${n(5)} (♭7, muốn xuống ${n(4)}). Hai nốt ấy cách nhau ba cung — quãng căng nhất — và giải đúng vào ${n(0)} – ${n(4)} của I: đó là "xương" của V. Giữ hai nốt ấy thì mọi thứ đắp lên đều là màu: nốt gam (9, 13) cho V êm; nốt căng đứng nửa cung sát một nốt của I (♭9, ♯9, ♯11, ♭13) cho V gắt — vì nốt căng nào cũng có chỗ để giải vào. Giai điệu đang hát nốt nào thì nốt ấy quyết định chọn căng nào: giai điệu hát ${n(9)} (9) thì không dùng ♭9 (${n(8, 6)}).`,
        thay: [
          { goc: 7, chat: '13b9#11', viSao: `(Jeff) giữ ${n(11)} – ${n(5)}, đắp ba nốt căng — xem thẻ "Thay hợp âm", lối 4.` },
          { goc: 7, chat: '9sus4', viSao: `= ${h(5, '', 7)}: bỏ ${n(11)} nên hết "đòi" — kéo về nhẹ, hiện đại; có thể treo rồi mới giải sang ${h(7, '7')}.` },
          { goc: 1, chat: '7', viSao: `THAY THẾ BA CUNG: cùng cặp ${n(11)} – ${n(5)} (viết khác tên), bass đi nửa cung xuống ${n(0)}.` },
          { goc: 11, chat: 'dim', viSao: `= V7 bỏ gốc: cùng ${n(11)}, ${n(2)}, ${n(5)} — nhẹ hơn.` },
        ],
      },
      {
        goc: 9,
        vai: 'Nhà buồn',
        viSao: `${h(9, 'm')} chung ${n(0)}, ${n(4)} với I nên đứng thay I được; nó là chủ của ${songSong} — mỗi lần về vi, câu nhạc nhuốm màu thứ. Màu hợp: m7, m9, m11.`,
        thay: [
          { goc: 0, chat: '6', viSao: `cùng bốn nốt với ${h(9, 'm7')} — chỉ khác bass.` },
          { goc: 9, chat: '7', viSao: `ÁT PHỤ của ii: nâng ${n(0)} lên ${n(1, 1)} — nốt cảm âm của ${n(2)}; ${h(9, '7')} → ${h(2, 'm')}.` },
          { goc: 5, chat: 'maj7', viSao: `= ${h(9, 'm')} đặt trên bass ${n(5)} — cùng ba nốt trên, đổi bass là đổi cảnh.` },
        ],
      },
      {
        goc: 11,
        vai: 'V thiếu gốc',
        viSao: `${n(11)} – ${n(2)} – ${n(5)} là ba nốt trên của ${h(7, '7')}, nên vii° làm việc của V, nhẹ hơn. Đứng một mình ít dùng trong đệm hát; hay gặp dạng ${h(11, 'm7b5')} — hợp âm ii của ${songSong} (${h(11, 'm7b5')} → ${h(4, '7')} → ${h(9, 'm')}) — hoặc ${h(7, '7', 11)}, V với bass ${n(11)}.`,
        thay: [
          { goc: 7, chat: '7', bass: 11, viSao: `V7 bass ${n(11)} — đủ gốc, bass vẫn đi liền bậc lên ${n(0)}.` },
          { goc: 11, chat: 'm7b5', viSao: `thêm ${n(9)}: mềm hơn, và mở đường sang ${songSong}.` },
        ],
      },
    ]

  return [
    {
      goc: 0,
      vai: 'Nhà (buồn)',
      viSao: `${h(0, 'm')} là nhà của giọng. Màu hợp: m7, m9, m(add9) — nốt 9 (${n(2)}) là nốt gam, làm hợp âm thứ dịu và rộng ra; m6 (${n(9, 6)}, mượn gam thứ giai điệu — nghe "jazz"); m(maj7) (${n(11, 7)} — nốt cảm âm, hay đứng trong đường bè ${n(0)} → ${n(11, 7)} → ${n(10)} → ${n(9, 6)}). Tránh ♭13 (${n(8)}): nó nằm ngay trên ${n(7)} nửa cung.`,
      thay: [
        { goc: 3, chat: '', viSao: `chung ${n(3)}, ${n(7)} — ghé sang ${songSong}, sáng lên.` },
        { goc: 8, chat: 'maj7', viSao: `= ${h(0, 'm')} đặt trên bass ${n(8)}: cùng ba nốt của i, chỉ đổi bass — cảnh đổi mà tầng trên vẫn ở nhà.` },
        { goc: 0, chat: '7', viSao: `ÁT PHỤ của iv: nâng ${n(3)} lên ${n(4, 3)} — nốt cảm âm của ${n(5)}. Dùng ngay trước ${h(5, 'm')}, khi giai điệu không đứng ở ${n(3)}.` },
        { goc: 0, chat: '', viSao: `PICARDY: kết bài thứ trên I trưởng — sáng bất ngờ; chỉ dùng ở hợp âm cuối.` },
      ],
    },
    {
      goc: 2,
      vai: 'Chuẩn bị (buồn)',
      viSao: `${h(2, 'm7b5')} là ${h(5, 'm')} đặt trên bass ${n(2)} — ii° và iv cùng một họ. Hầu như luôn dùng dạng m7♭5 chứ không để hợp âm giảm trơn. Đứng trước V vì bass ${n(2)} → ${n(7)} là bước quãng 4 lên, và tầng trên đi rất ngắn: ${n(0)} xuống ${n(11, 7)} (nốt cảm âm của V), ${n(8)} xuống ${n(7)} — hai nốt đi nửa cung; ${n(5)} và ${n(2)} đứng yên.`,
      thay: [
        { goc: 5, chat: 'm', viSao: 'cùng họ.' },
        { goc: 5, chat: 'm6', viSao: `cùng bốn nốt với ${h(2, 'm7b5')} — chỉ khác bass.` },
      ],
    },
    {
      goc: 3,
      vai: 'Ghé sang trưởng',
      viSao: `${h(3, '')} là chủ của ${songSong}, chung ${n(3)}, ${n(7)} với i. ${h(10, '')} → ${h(3, '')} là V → I của giọng trưởng ấy — bài thứ ghé sáng lên một lúc. Từ ${h(3, '')} sang V rất gọn: ${n(10)} nâng nửa cung thành ${n(11, 7)}, ${n(3)} xuống ${n(2)}, ${n(7)} đứng yên. Màu hợp: maj7, add9, 6.`,
      thay: [
        { goc: 0, chat: 'm', viSao: 'chung hai nốt — về nhà.' },
        { goc: 3, chat: 'aug', viSao: `nâng ${n(10)} thành ${n(11, 7)} (gam thứ hòa âm): nốt ấy kéo lên ${n(0)}, nên ${h(3, 'aug')} → ${h(0, 'm')} hoặc → V.` },
      ],
    },
    {
      goc: 5,
      vai: 'Rời nhà buồn',
      viSao: `${h(5, 'm')} mang ${n(8)} — ♭6 của giọng, nốt muốn rơi xuống ${n(7)}. iv → i khép lại êm ("Amen" buồn); iv → V thì đi tiếp. Màu hợp: m7, m9, m(add9) (nốt 9 là ${n(7)}, chính bậc 5 của giọng), m6 (${n(2)} — nốt gam; ${h(5, 'm6')} = ${h(2, 'm7b5')} đổi bass).`,
      thay: [
        { goc: 2, chat: 'm7b5', viSao: 'cùng họ — sang V gọn hơn.' },
        { goc: 5, chat: '', viSao: `MƯỢN (Dorian): nâng ${n(8)} lên ${n(9, 6)} — iv thành IV trưởng, sáng bất ngờ.` },
        { goc: 8, chat: '', viSao: `chung ${n(8)}, ${n(0)}.` },
      ],
    },
    {
      goc: 7,
      vai: 'Kéo về nhà',
      viSao: `Gam thứ tự nhiên cho ${h(7, 'm')}: ${n(10)} cách ${n(0)} một cung — không có nốt cảm âm, kéo về yếu, nghe mộc. Nâng ${n(10)} lên ${n(11, 7)} (gam thứ hòa âm) thì được ${h(7, '')}: nốt cảm âm kéo nửa cung lên ${n(0)} — vì vậy câu kết bài thứ gần như luôn dùng V trưởng. Thêm ♭7 (${n(5)}) thành ${h(7, '7')}: cặp ${n(11, 7)} – ${n(5)} cách ba cung, giải vào ${n(0)} – ${n(3)}. Ở giọng thứ, hai nốt căng ♭9 (${n(8)}) và ♭13 (${n(3)}) có sẵn trong gam, nên ${h(7, '7b9')}, ${h(7, '7b13')} nghe tự nhiên — không lạ như ở bài trưởng.`,
      thay: [
        { goc: 7, chat: '7sus4', viSao: `treo ${n(0)} thay ${n(11, 7)} rồi mới thả xuống — chậm lại trước khi về.` },
        { goc: 11, chat: 'dim7', viSao: `= ${h(7, '7b9')} bỏ gốc — làm việc của V.` },
        { goc: 10, chat: '', viSao: 'át yếu, mộc — không có nốt cảm âm.' },
        { goc: 1, chat: '7', viSao: `THAY THẾ BA CUNG: bass ${n(1, 2)} → ${n(0)} nửa cung.` },
      ],
    },
    {
      goc: 8,
      vai: 'Rơi',
      viSao: `${h(8, '')} đứng trên ${n(8)}, nốt muốn rơi xuống ${n(7)}: ♭VI → V là bước buồn nhất của giọng thứ — bass đi nửa cung. Màu hợp: maj7 — ${h(8, 'maj7')} chính là ${h(0, 'm')} trên bass ${n(8)}, nghe "nhà" mà treo lơ lửng; maj7♯11 (${n(2)} là ♯11 mà vẫn là nốt gam — ♭VI là bậc Lydian của giọng thứ).`,
      thay: [
        { goc: 5, chat: 'm', viSao: `chung ${n(8)}, ${n(0)}.` },
        { goc: 8, chat: '7', viSao: `♭7 của ${h(8, '7')} viết lại là ${n(6, 4)}, kéo nửa cung lên ${n(7)}; ${n(8)} kéo xuống ${n(7)} — hai nốt kẹp vào bậc 5 từ hai phía (hòa âm cổ điển gọi là hợp âm sáu tăng).` },
      ],
    },
    {
      goc: 10,
      vai: 'Át mộc',
      viSao: `${h(10, '')} không có nốt cảm âm nên kéo về i yếu — mộc, dân gian. Hai việc chính của nó: làm V của ♭III (${h(10, '')} → ${h(3, '')}), và nối đường bass đi xuống từ chủ: i → ♭VII → ♭VI → V (${n(0)} – ${n(10)} – ${n(8)} – ${n(7)}).`,
      thay: [
        { goc: 10, chat: '7', viSao: `ÁT PHỤ của ♭III: thêm ${n(8)} — ${h(10, '7')} → ${h(3, '')}.` },
        { goc: 11, chat: 'dim7', viSao: 'đổi ♭VII thành hợp âm có nốt cảm âm — về i mạnh hẳn.' },
        { goc: 7, chat: 'm', viSao: `chung ${n(10)}, ${n(2)}.` },
      ],
    },
  ]
}

/* ---------------- Các lối THAY HỢP ÂM trong đệm hát — vì sao thay được ---------------- */

export interface LoiThay {
  ten: string
  giu: string
  doi: string
  viSao: string
  goc: Hop[]
  thay: Hop[]
  /** Thầy nào dùng lối này — chỉ ghi điều đã thấy trong sheet. */
  thayDung?: string
  nguon: string
}

export function loiThay(tonic: number, thu: boolean): LoiThay[] {
  const { n } = nguCanh(tonic, thu)
  const H = (goc: number, chat: string, bass?: number): Hop => (bass === undefined ? { goc, chat } : { goc, chat, bass })
  const i = thu ? H(0, 'm') : H(0, '')
  return [
    {
      ten: '1. Thêm màu — giữ nguyên việc của hợp âm',
      giu: 'nốt khung (1 – 3 – 5; ở hợp âm át là cặp 3 – ♭7)',
      doi: 'thêm nốt gam: 9, 11 (trên hợp âm thứ), 13, 6, maj7',
      viSao:
        'Nốt thêm là nốt của gam đang chơi và không đứng ngay trên nốt khung nửa cung, nên hợp âm dày lên mà không đổi việc. Đây là lối thay an toàn nhất.',
      goc: thu ? [H(5, 'm'), H(7, ''), i] : [H(2, 'm'), H(7, ''), i],
      thay: thu ? [H(5, 'm9'), H(7, '7b9'), H(0, 'm(add9)')] : [H(2, 'm9'), H(7, '13'), H(0, 'maj9')],
      thayDung: 'Linh Nhi: nốt 9 trong hình rải tay trái trên i, iv. Cà Pháo: sheet ghi m9, m11, maj9, 13.',
      nguon: 'lý thuyết',
    },
    {
      ten: '2. Họ hàng — chung hai, ba nốt',
      giu: 'hai, ba nốt chung',
      doi: 'bass (và một nốt)',
      viSao:
        'Tai bám vào nốt chung nên việc của hợp âm gần như giữ nguyên; đổi bass là đổi màu cảnh. Từng cặp họ hàng: I ↔ vi ↔ iii, IV ↔ ii, V ↔ vii°.',
      goc: thu ? [i, H(5, 'm'), H(7, ''), i] : [i, H(5, ''), H(7, ''), i],
      thay: thu ? [i, H(2, 'm7b5'), H(7, ''), H(8, 'maj7')] : [i, H(2, 'm7'), H(7, ''), H(9, 'm')],
      nguon: 'lý thuyết — câu cuối là kết lừa (V về hợp âm họ hàng của chủ)',
    },
    {
      ten: '3. Át phụ — tạm biến hợp âm trước thành V của hợp âm sau',
      giu: 'gốc của hợp âm cũ',
      doi: 'nâng bậc 3 thành nốt cảm âm của hợp âm sau (thêm ♭7)',
      viSao: `Trong khoảnh khắc ấy hợp âm sau được đối xử như "nhà": nốt cảm âm mới kéo nửa cung vào gốc của nó. Điều kiện: giai điệu không được đứng trên nốt bị nâng (ở ví dụ là ${thu ? n(3) : n(0)}) — nếu không sẽ chỏi nửa cung.`,
      goc: thu ? [i, i, H(5, 'm'), H(7, '7'), i] : [i, H(9, 'm'), H(2, 'm'), H(7, '7'), i],
      thay: thu ? [i, H(0, '7'), H(5, 'm'), H(7, '7'), i] : [i, H(9, '7'), H(2, 'm'), H(7, '7'), i],
      thayDung: thu ? 'Linh Nhi: I7 → iv — xem thẻ của chị.' : 'Linh Nhi: bậc II có ♭7 — nhưng chỉ một bài nâng bậc 3 (xem thẻ của chị).',
      nguon: 'lý thuyết',
    },
    {
      ten: '4. Át căng — đắp nốt căng lên V (cách Jeff thay G7 bằng G13♭9♯11)',
      giu: 'cặp 3 – ♭7 của V',
      doi: 'thêm ♭9, ♯9, ♯11, ♭13 hoặc 13',
      viSao:
        'Việc của hợp âm át nằm ở cặp 3 – ♭7 (cách nhau ba cung). Nốt căng nào cũng đứng nửa cung sát một nốt của hợp âm đích, nên nghe gắt rồi "rơi" đúng chỗ — càng căng, lúc về càng đã. Jeff: "rất chỏi, nhưng giải về Cmaj9 thì nghe tuyệt". Điều kiện: nốt căng không được đụng nốt giai điệu đang hát.',
      goc: thu ? [H(2, 'm7b5'), H(7, '7'), i] : [H(2, 'm7'), H(7, '7'), H(0, 'maj7')],
      thay: thu ? [H(2, 'm7b5'), H(7, '7b9'), H(0, 'm(add9)')] : [H(2, 'm11'), H(7, '13b9#11'), H(0, 'maj9')],
      thayDung: 'Cà Pháo: sheet ghi 13♭9, 9♯11, 7♭13, 7♭9.',
      nguon: thu ? 'lý thuyết (giọng thứ: ♭9 có sẵn trong gam)' : 'Jeff Schneider — đúng vòng trong video (01:22 – 04:19)',
    },
    {
      ten: '5. Thay thế ba cung',
      giu: 'cặp 3 – ♭7 (đổi tên)',
      doi: 'gốc dời ba cung',
      viSao: `♭II7 và V7 chung đúng hai nốt quyết định; bass đi nửa cung xuống gốc của chủ (${n(1, 2)} → ${n(0)}) — trơn, sang, màu jazz.`,
      goc: thu ? [H(5, 'm'), H(7, '7'), i] : [H(2, 'm7'), H(7, '7'), i],
      thay: thu ? [H(5, 'm'), H(1, '7'), i] : [H(2, 'm7'), H(1, '7'), i],
      nguon: 'lý thuyết',
    },
    {
      ten: '6. Treo — bỏ nốt cảm âm của V',
      giu: 'bass của V',
      doi: 'bậc 3 thay bằng bậc 4 (hay chồng hợp âm ii lên bass V)',
      viSao:
        'Mất nốt cảm âm thì V hết "đòi": kéo về nhẹ; hoặc treo rồi mới thả bậc 4 xuống bậc 3 để kéo dài chờ đợi trước khi về.',
      goc: thu ? [H(5, 'm'), H(7, '7'), i] : [H(2, 'm'), H(7, '7'), i],
      thay: thu ? [H(5, 'm'), H(7, '7sus4'), H(7, '7'), i] : [H(2, 'm7'), H(7, '9sus4'), i],
      thayDung: 'Linh Nhi: A7sus4 → A7 ở Lá Thư Trần Thế; A7sus4 ở Mùa Xuân Đầu Tiên.',
      nguon: 'lý thuyết',
    },
    {
      ten: thu ? '7. Mượn giọng — kết Picardy' : '7. Mượn giọng — iv thứ',
      giu: 'gốc',
      doi: 'một nốt của giọng cùng chủ âm (trưởng ↔ thứ)',
      viSao: thu
        ? `Hợp âm cuối mượn bậc 3 trưởng (${n(4, 3)}): bài thứ kết sáng bất ngờ.`
        : `Mượn ♭6 (${n(8, 6)}) của ${nguCanh(tonic, thu).cungChu}: nốt ấy rơi xuống bậc 5 — buồn, sâu, rất hay trước khi khép bài.`,
      goc: thu ? [i, H(5, 'm'), H(7, '7'), i] : [i, H(5, ''), i],
      thay: thu ? [i, H(5, 'm'), H(7, '7'), H(0, '')] : [i, H(5, ''), H(5, 'm'), i],
      thayDung: 'Linh Nhi: kết Picardy ở Lá Thư Trần Thế (Dsus4 → D); iv mượn suốt đoạn kết Đường Xưa Lối Cũ.',
      nguon: 'lý thuyết',
    },
    {
      ten: '8. Hợp âm bảy giảm lướt',
      giu: 'hướng đi của bass',
      doi: 'chèn một hợp âm bảy giảm cho bass đi nửa cung',
      viSao:
        'Hợp âm bảy giảm là V7♭9 bỏ gốc của hợp âm ngay sau nó, nên nó kéo như một át phụ — và bass đi liền nửa cung.',
      goc: thu ? [H(10, ''), i] : [i, H(2, 'm')],
      thay: thu ? [H(11, 'dim7'), i] : [i, H(1, 'dim7'), H(2, 'm')],
      nguon: 'lý thuyết',
    },
    {
      ten: '9. Đổi bass, giữ tầng trên',
      giu: 'tầng trên',
      doi: 'bass',
      viSao:
        'Tầng trên đứng yên thì tai thấy vẫn ở chỗ cũ; bass đi thì cảnh đổi. Hợp âm mới (maj7, m7♭5, I/7 …) tự hiện ra từ nốt bass — không cần chọn tên. Đây là lối Linh Nhi hay dùng nhất để tô màu.',
      goc: thu ? [i, H(8, '')] : [i, H(9, 'm')],
      thay: thu ? [i, H(8, 'maj7')] : [i, H(0, '', 11), H(9, 'm')],
      thayDung: 'Linh Nhi: xem thẻ của chị — "đổi bass, giữ tầng trên".',
      nguon: 'lý thuyết + sheet Linh Nhi',
    },
  ]
}

/* ---------------- THẦY: chọn gì ở mỗi bậc — VÌ SAO ---------------- */

export interface Diem {
  y: string
  giai: string
  /** Ô thật trong sheet, đã soát tay từng nốt (giọng gốc của bài). */
  viDu?: string
  /** Số đo và nhãn suy luận — gọn một dòng. */
  coSo: string
}
export interface NguyenTac {
  y: string
  tom: string
  /** Gốc các bậc có lời đầy đủ. */
  bac: number[]
}
export interface LyDoThay {
  nguyenTac: NguyenTac[]
  /** Theo gốc bậc (nửa cung so với chủ âm). */
  bac: Partial<Record<number, Diem[]>>
}

export function lyDoThay(thay: TeacherId, tonic: number, thu: boolean): LyDoThay | null {
  if (thay !== 'linh-nhi') return null
  const { n, h, giong } = nguCanh(tonic, thu)
  if (thu) {
    const rai: Diem = {
      y: 'Màu nằm ở tay trái rải, không ở tên hợp âm',
      giai: `Nốt 9 trên i và iv của chị gần như luôn ở tay trái. Hình rải hay gặp là gốc – 5 – 8 rồi bước liền lên 9 – 10: trên ${h(0, 'm')} là ${n(0)} – ${n(7)} – ${n(0)} – ${n(2)} – ${n(3)}. Nốt 9 là bước giữa quãng tám và quãng mười — nó có mặt vì ngón tay đi liền, không vì chị "đặt add9". Học lối này là học hình rải tay trái, không phải học thêm một tên hợp âm.`,
      viDu: 'Nỗi Buồn Hoa Phượng ô 36 (Rê thứ): Rê2 – La2 – Rê3 – Mi3 – Fa3. Một Cõi Đi Về ô 40 (Sol thứ): Sol – Rê – Sol – La – Si♭.',
      coSo:
        'Số đo phần hát, 5 bài thứ: 36 đoạn i có nốt 9, trong đó 15 có bước 8 → 9 liền ở tay trái (4 bài); iv 11/22 (2 bài). Phần còn lại nốt 9 nằm chỗ khác trong hình rải — chưa phân loại.',
    }
    const doiBass: Diem = {
      y: 'Đổi bass, giữ tầng trên — ♭VImaj7 là i trên bass ♭6',
      giai: `Từ ${h(0, 'm')} xuống ${h(8, '')}, chị không thay tay phải: cặp nốt của i vẫn ở đó, chỉ bass bước xuống ${n(8)}. Ba nốt của i đặt trên bass ${n(8)} chính là ${h(8, 'maj7')} — màu maj7 tự hiện ra (chồng hợp âm: maj7 = hợp âm thứ trên bậc 3). Vì sao hay: bass đổi thì cảnh đổi, tầng trên giữ thì tai vẫn thấy ở nhà — chuyển mà không nhảy. Lên điệp khúc tay chị nắm dày hơn, nốt giữ này nghe rõ hơn — vì thế ♭VImaj7 của chị nằm chủ yếu ở điệp khúc.`,
      viDu: 'Đừng Xa Em Đêm Nay ô 15 → 16 (Rê thứ → B♭maj7): tay phải lặp cặp La3 – Fa4 qua chỗ đổi, giai điệu đứng La4 ở phách 1, bass xuống Si♭2.',
      coSo:
        'Số đo: ♭VImaj7 21 đoạn, 3 bài; đứng ngay sau i 15/21; nốt bảy (bậc 5 của giọng) ngân qua chỗ đổi hợp âm 9/21, nằm ở giai điệu 5/21; điệp khúc 13/21 (md 13d). "Nắm dày làm nốt giữ rõ hơn" là suy luận nối hai số đo (điệp khúc 1,50 nốt mỗi cú gõ so với 1,29 — md mục 3).',
    }
    const nangBa: Diem = {
      y: 'I7 → iv: nâng bậc 3 của chủ — chỉ ở chỗ giai điệu né nốt ấy',
      giai: `Ngay trước ${h(5, 'm')}, chị đổi ${h(0, 'm')} thành ${h(0, '7')}: nâng ${n(3)} lên ${n(4, 3)}. ${n(4, 3)} kéo nửa cung lên ${n(5)} (gốc của iv), còn ${n(10)} (♭7) kéo xuống ${n(8)} (♭3 của iv) — hai nốt dẫn cùng đổ vào iv, nên iv nghe như được kéo tới chứ không chỉ đổi sang. Nốt nâng chỉ nằm ở tay đệm, và ở mọi chỗ chị làm vậy giai điệu không hát ${n(3)} — không có tiếng chỏi nửa cung. Có chỗ chị đặt luôn ${n(4, 3)} ở bass: bass đi nửa cung ${n(4, 3)} → ${n(5)}.`,
      viDu: 'Lá Thư Trần Thế ô 23 (D7: tay trái Rê – Fa♯ – La – Đô, sang Sol thứ ở phách 4). Nỗi Buồn Hoa Phượng ô 17 → 18 (D7/F♯: bass Fa♯2 → Sol2).',
      coSo:
        'Số đo, soát tay từng chỗ: 7 chỗ ở 3 bài (Lá Thư, Một Cõi, Nỗi Buồn), cả 7 đi vào iv; giai điệu hát bậc ♭3 ở 0/7; bậc 3 trưởng ở bass 1/7. Giai điệu không đòi hợp âm này, nên nhiều khả năng là lựa chọn của người phối — chưa có bản gốc để đối chiếu. Bản giải thích trước đếm lẫn 3 chỗ máy đọc sai (2 ở Rừng Lá, Lá Thư ô 8).',
    }
    const vCam: Diem = {
      y: 'V luôn có nốt cảm âm — mỗi bài lấy một cách',
      giai: `Chị dùng V trưởng (gam thứ hòa âm) thay cho v. Nốt cảm âm ${n(11, 7)} đến từ ba chỗ: giai điệu tự hát nó; hoặc tay đệm bấm V7 đủ trong khi giai điệu ngân bậc ♭3 của giọng (${n(3)}) — thành ${h(7, '7b13')}: cả ${n(11, 7)} lẫn ${n(3)} đều thuộc gam thứ hòa âm nên vang cùng lúc mà không chỏi, đó là tiếng "đặc sản" của giọng thứ; hoặc treo ${h(7, '7sus4')} rồi mới thả ${n(0)} xuống ${n(11, 7)}. Bậc ♭7 của V chị thêm vào tay trái cho V nặng hơn, nhưng không giải xuống liền bậc như sách: nó là một nốt trong hình rải, rồi tay trái bước lên. Lực kéo về i nằm ở bass (bậc 5 → 1) và nốt cảm âm.`,
      viDu: 'Đừng Xa ô 14 (Rê thứ): giai điệu hát Đô♯ trên A. Một Cõi ô 51 (Sol thứ): tay trái Rê – La – Rê – Fa♯ – La – Đô, giai điệu Si♭. Lá Thư ô 37 → 38 (Rê thứ): A7sus4 — tay phải La – Rê – Sol — rồi Đô♯ ở ô sau.',
      coSo:
        'Số đo: V 24 đoạn, 5 bài; nốt cảm âm có ở giai điệu 8, chỉ ở tay đệm 10, không có 6. ♭7 của V có ở 17 đoạn — 10 đoạn không có từ hợp âm trước và không ở giai điệu (thêm có chủ ý); trong 16 đoạn có hợp âm theo sau, ♭7 đi xuống liền bậc 0/16.',
    }
    const iiHo: Diem = {
      y: 'ii° dùng dạng m7♭5 — và đó là iv trên bass khác',
      giai: `${h(2, 'm7b5')} = ${h(5, 'm')} trên bass ${n(2)}. Chị dùng nó để vào V. Một cách chị chuyển: giữ nguyên tầng trên của iv, dời bass xuống ${n(2)}; rồi sang V thì ${n(8)} xuống ${n(7)}, ${n(0)} xuống ${n(11, 7)} — hai nốt đi nửa cung, hai nốt đứng yên.`,
      viDu: 'Một Cõi Đi Về ô 49 → 51 (Sol thứ): Cm (tay trái Đô – Mi♭ – Sol) → Am7♭5 (La – Đô – Mi♭ – Sol: chỉ thêm bass La) → D7 (Rê – Fa♯ – La – Đô).',
      coSo: 'Số đo câu solo: ii° → V7 ở 4/5 bài thứ (md 13c). Ở phần hát ii°7 đứng ngay sau iv 3/10 đoạn — ví dụ trên là một cách chị làm, không phải luật.',
    }
    return {
      nguyenTac: [
        { y: rai.y, tom: 'Nốt 9 trên i và iv là bước liền 8 – 9 – 10 của tay trái rải, không phải một tên hợp âm được chọn.', bac: [0, 5] },
        { y: 'Đổi bass, giữ tầng trên', tom: '♭VImaj7 là i đặt trên bass ♭6; ii°7 là iv đặt trên bass ii — màu tự hiện ra khi bass đi.', bac: [8, 2] },
        { y: vCam.y, tom: 'Giai điệu hát nó, hoặc tay đệm bấm V7 đủ, hoặc treo 4 rồi giải; bậc ♭7 của V là nốt rải, không giải theo sách.', bac: [7] },
        { y: 'Nâng bậc 3 của chủ chỉ ở chỗ giai điệu né nốt ấy', tom: 'I7 → iv: nốt nâng nằm ở tay đệm, giai điệu không hát bậc ♭3 ở chỗ nào.', bac: [0] },
      ],
      bac: {
        0: [rai, nangBa],
        2: [iiHo],
        3: [
          {
            y: '♭III: ghé sang trưởng, rồi đi thẳng vào V',
            giai: `Chị hay tới ${h(3, '')} từ ${h(10, '')} (V → I của giọng trưởng song song) rồi từ đó vào V: ${n(10)} nâng nửa cung thành ${n(11, 7)}, ${n(3)} xuống ${n(2)}, ${n(7)} đứng yên — từ trưởng song song sang V của giọng thứ chỉ bằng hai bước nửa cung.`,
            coSo: 'Số đo phần hát (md 13d): ♭VII → ♭III 10 lần, ♭III → V 9 lần, mỗi bước ở 4 bài. Cách đi bè là lý thuyết — chưa đo bè thật của chị ở bước này.',
          },
        ],
        5: [
          {
            y: 'iv: trơn ở phiên khúc, dày lên ở điệp khúc',
            giai: `Lên điệp khúc, iv có thêm nốt 9 (${n(7)} — chính bậc 5 của giọng) trong hình rải tay trái 8 – 9 – 10; phiên khúc phần lớn để trơn. Nốt ${n(7)} cũng là nốt chị giữ khi đi i → ♭VImaj7 — cả hai màu cùng một nốt: bậc 5 của giọng ngân qua nhiều hợp âm.`,
            coSo: 'Số đo md 13d: điệp khúc add9 7/10 (3 bài), phiên khúc trơn 18/38. "Cùng một nốt ngân qua" là đối chiếu của Claude: nốt màu của ♭VImaj7 và của iv(add9) đều là bậc 5 của giọng ở 21/21 và 22/22 đoạn.',
          },
        ],
        7: [vCam],
        8: [doiBass],
        10: [
          {
            y: '♭VII: bước xuống đầu tiên từ chủ',
            giai: `i → ♭VII là bass đi xuống liền bậc từ chủ âm (${n(0)} → ${n(10)}); chị dùng nó để mở một đường đi xuống (i → ♭VII → ♭VI, hay → ♭III). ♭VII của chị để trơn là chính — việc của nó là đường bass, không cần màu.`,
            coSo: 'Số đo: i → ♭VII 10 lần (4 bài), ♭VII → ♭III 10 lần (4 bài) (md 13d); câu dạo mở i → ♭VII ở 3 bài (md 13c); ♭VII trơn 19/30. "Không cần màu" là suy luận.',
          },
        ],
      },
    }
  }

  const tron: Diem = {
    y: 'Giọng trưởng để trơn — màu chỉ đến từ đường đi của bass',
    giai: `Ở ba bài trưởng chị để hợp âm ba trơn gần như ở mọi bậc. Màu chỉ xuất hiện khi bass hay bè đang đi: ${h(0, 'maj7')} thật ra là nốt dẫn bass — I sang vi bằng đường ${n(0)} → ${n(11)} → ${n(9)}, nốt ${n(11)} rơi ở móc cuối ô; add9 trên I là bước 8 – 9 – 10 của tay trái, như ở bài thứ.`,
    viDu: 'Mùa Xuân Đầu Tiên ô 19 → 20 (Sol trưởng): tay trái kết ô bằng Fa♯3 rồi vào Mi3 của Em. Đường Xưa Lối Cũ ô 36 → 37 (Đô trưởng): tay trái Đô – Sol – Đô – Rê – Mi … Si2 → La2 của Am.',
    coSo:
      'Số đo: I có nốt 7 ở 13 đoạn (2 bài) — nốt ấy bước xuống một cung vào hợp âm sau 12/13, hợp âm sau là vi 11/13; I trơn 30/61, V trơn 25/42 (md 13d). "Bolero trưởng của chị chuộng tiếng mộc" là suy luận.',
  }
  const bacII: Diem = {
    y: 'Bậc II: giữ chủ âm làm ♭7 — bậc 3 thì tùy bài',
    giai: `Trên bậc II chị luôn để chủ âm vang làm ♭7 (ở ${giong}: ${n(0)} trên ${h(2, '')}), nên hợp âm vẫn dính với nhà. Còn có nâng bậc 3 của nó thành ♯4 của giọng (${n(5)} → ${n(6, 4)}) hay không thì mỗi bài một khác. Đường Xưa bấm đủ II7 có ♯4 rồi quay về I chứ không đi tới V: nốt ♯4 ở đây là màu sáng chen giữa hai lần I, không phải lực kéo. Mùa Xuân phần lớn bấm II7sus4 — treo bậc 4 thay bậc 3 — rồi đi V hoặc iii. Biển Tình chỉ bấm gốc – 5 – ♭7, bỏ hẳn bậc 3.`,
    viDu: 'Mùa Xuân ô 33: giai điệu hát Đô tự nhiên trên A7 — bấm Đô♯ sẽ chỏi nửa cung, nên chị treo Rê. Hai chỗ treo khác (ô 42, 77) giai điệu không có Đô — đó là thói quen của bài, không phải lúc nào cũng vì giai điệu. Đường Xưa ô 35: D9/F♯ — Fa♯ nằm ở bass.',
    coSo:
      'Số đo: II 10 đoạn, 3 bài; ♭7 có ở 9/10; bậc 3 trưởng vang 5/10 (Đường Xưa 4/4, Mùa Xuân 1/4 — ô 30); đi tới V 3/10, về I 4/10. Sửa lời trước: tôi từng viết "II7 là át của V, nâng Fa lên Fa♯, 10/10" — sai: chỉ 3/10 đi tới V, và bậc 3 trưởng chỉ vang 5/10.',
  }
  return {
    nguyenTac: [
      { y: tron.y, tom: 'Imaj7 là nốt dẫn bass I → vi; add9 trên I là bước 8 – 9 – 10 của tay trái.', bac: [0, 9] },
      { y: bacII.y, tom: 'II luôn có ♭7 (chính chủ âm); nâng bậc 3, treo hay bỏ là tùy bài — và phần lớn không đi tới V.', bac: [2] },
    ],
    bac: {
      0: [tron],
      2: [bacII],
      4: [
        {
          y: 'iii: trơn, và chỉ để đi qua',
          giai: 'Ở phần hát chị để iii trơn và ít dùng; ở câu solo iii nằm trong chuỗi I → vi → iii → ii đi dần về V.',
          coSo: 'md 13c (câu solo Biển Tình, Mùa Xuân), 13d (iii 20 đoạn, trơn 16).',
        },
      ],
      5: [
        {
          y: 'IV: trơn; đoạn kết thì mượn iv',
          giai: `Phần hát IV để trơn. Đoạn kết Đường Xưa chị đổi IV thành iv — mượn giọng thứ cùng chủ âm (ở ${giong}: ${h(5, 'm')}) — và ngân suốt năm ô: ♭6 (${n(8, 6)}) rơi xuống bậc 5 (${n(7)}) cho bài khép lại buồn.`,
          coSo: 'md 13c: kết Đường Xưa vi · iv ×5. "Khép lại buồn" là suy luận.',
        },
      ],
      7: [
        {
          y: 'V: để trơn là chính',
          giai: `${h(7, '')} trơn đã có nốt cảm âm ${n(11)} và bass ${n(7)} → ${n(0)} — đủ kéo về nhà, nên chị ít thêm ♭7.`,
          coSo: 'Số đo md 13d: V trơn 25/42, ♭7 chỉ 7/42. Lý do là suy luận.',
        },
      ],
      9: [
        {
          y: 'vi: bước chị đi nhiều nhất — nối bằng bass liền bậc',
          giai: `I → vi là bước chị dùng nhiều nhất ở giọng trưởng, và chị nối nó bằng bass đi liền bậc (${n(0)} → ${n(11)} → ${n(9)}) chứ không nhảy thẳng.`,
          coSo: 'Số đo: I → vi 25 lần, 3 bài (md 13d); trong đó 11 chỗ có nốt 7 dẫn xuống vi (2 bài).',
        },
      ],
    },
  }
}
