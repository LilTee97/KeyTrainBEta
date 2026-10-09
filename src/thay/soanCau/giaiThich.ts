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
  Số đo Linh Nhi: `tools/ly_do_hop_am_linh_nhi.py` (mục 13k md Linh Nhi). Cà Pháo: `tools/tach_lua_chon.py --thay ca-phao` + soát tay (md Cà Pháo).
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
      thayDung: thu
        ? 'Linh Nhi: I7 → iv có sẵn trong bản phổ biến của cả 3 bài chị đàn — chị giữ, và có chỗ đặt bậc 3 ở bass.'
        : 'Linh Nhi: II của Mùa Xuân có sẵn trong bản phổ biến; ở Đường Xưa chị tự đổi ii / V7 thành II7 rồi về I.',
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
      thayDung: 'Linh Nhi (bài trưởng): F♯m7♭5 thay V ở Đường Xưa, F♯°7 thay V7 ở Mùa Xuân — không bản phổ biến nào có.',
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

/* ---------------- THẦY: chọn gì ở mỗi bậc — VÌ SAO, và AI CHỌN ---------------- */

/*
  AI CHỌN (người dùng 7/10/2026: "phân tích kỹ sheet của Linh Nhi để tách lựa chọn"): so từng hợp âm phần hát với HỢP ÂM PHỔ BIẾN
  của chính bài (hopamchuan.com, 2–5 bản khác nhau mỗi bài; `tools/tach_lua_chon.py --kiem`, md Linh Nhi 13l). Cùng gốc + loại với
  bản phổ biến → "của bài"; khác, chèn thêm, hay màu bản không ghi → "của chị". Bản phổ biến KHÔNG phải hòa âm gốc của nhạc sĩ —
  là "người ta thường đệm bài này thế nào". Tám bài là của tám nhạc sĩ khác nhau.
  GIAI ĐIỆU (chỗ hở 1): giai điệu nằm ở nốt cao nhất tay phải (Biển Tình, bài duy nhất có lời: 66/70 nốt lời), nhưng đường ấy còn lẫn
  fill — không luật tiết tấu nào tách sạch (md 13l). Nên chỉ dùng nó cho kết luận "KHÔNG có nốt X"; câu khẳng định gọi là "nốt trên cùng".
*/

export interface Diem {
  y: string
  giai: string
  /** Ai chọn — của bài (bản phổ biến có) hay của chị (bản không có / chị thêm). */
  ai: string
  /** Ô thật trong sheet, đã soát tay từng nốt (giọng gốc của bài). */
  viDu?: string
  /** Số đo và nhãn suy luận — gọn một dòng. */
  coSo: string
  /** Câu ngắn để so bằng tai: bài ghi / thầy bấm (giọng đang chọn). */
  nghe?: { bai: Hop[]; thay: Hop[] }
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

const KHUNG: NguyenTac = {
  y: 'Khung hòa âm là của bài — cái riêng của chị nằm ở màu, hợp âm chèn và vài chỗ thay',
  tom: '422/616 hợp âm phần hát (8 bài, 8 nhạc sĩ) cùng gốc và loại với bản phổ biến. Phần của chị: nốt màu (gần như mọi nốt màu bản phổ biến không ghi), 96 chỗ chèn thêm, 67 chỗ đổi gốc, và đổi hợp âm giữa các lần lặp ở 45/152 chỗ.',
  bac: [],
}

export function lyDoThay(thay: TeacherId, tonic: number, thu: boolean): LyDoThay | null {
  if (thay === 'ca-phao') return lyDoCaPhao(tonic, thu)
  if (thay === 'blues') return lyDoBlues(tonic, thu)
  if (thay !== 'linh-nhi') return null
  const { n, h, giong } = nguCanh(tonic, thu)
  if (thu) {
    const iMau: Diem = {
      y: 'i: hợp âm của bài — màu là của chị, và nằm ở tay trái rải',
      giai: `Chị đặt i đúng chỗ bài đặt. Màu thì bản phổ biến không ghi: nốt 9 (${n(2)}) và ♭7 (${n(10)}) là của chị. Nốt 9 gần như luôn ở tay trái, trong hình rải gốc – 5 – 8 rồi bước liền lên 9 – 10: trên ${h(0, 'm')} là ${n(0)} – ${n(7)} – ${n(0)} – ${n(2)} – ${n(3)}. Nốt 9 là bước giữa quãng tám và quãng mười — nó có mặt vì ngón tay đi liền, không vì chị "đặt add9". Học lối này là học hình rải tay trái, không phải học thêm một tên hợp âm.`,
      ai: 'Của bài: gốc i (93/100 chỗ cùng bản phổ biến). Của chị: màu — nốt 9 bản không ghi ở 40/40 chỗ, ♭7 ở 22/22.',
      viDu: 'Nỗi Buồn Hoa Phượng ô 36 (Rê thứ): Rê2 – La2 – Rê3 – Mi3 – Fa3. Một Cõi Đi Về ô 40 (Sol thứ): Sol – Rê – Sol – La – Si♭.',
      coSo: 'Số đo phần hát 5 bài thứ: 43 đoạn i có nốt 9 ở tay trái, 21 trong đó có bước 8 → 9 liền (4 bài); iv 11/22 (2 bài). Còn lại nốt 9 nằm chỗ khác trong hình rải — chưa phân loại.',
    }
    const i7: Diem = {
      y: 'I7 → iv: hòa âm của bài — cái của chị là cách bấm',
      giai: `Ngay trước ${h(5, 'm')}, bài đổi ${h(0, 'm')} thành ${h(0, '7')}: ${n(3)} nâng lên ${n(4, 3)}, nốt ấy kéo nửa cung lên ${n(5)} (gốc của iv), còn ${n(10)} (♭7) kéo xuống ${n(8)} (♭3 của iv) — hai nốt dẫn cùng đổ vào iv, nên iv nghe như được kéo tới. Bản phổ biến của cả ba bài đều có bước này, nên đây là hòa âm của bài. Cái của chị: nốt nâng chỉ nằm ở tay đệm, và có chỗ chị đặt luôn ${n(4, 3)} ở bass — bass đi nửa cung ${n(4, 3)} → ${n(5)}.`,
      ai: 'Của bài: bản phổ biến có I7 ở 8/10 chỗ chị đặt I. Của chị: đặt bậc 3 ở bass (1/8 chỗ).',
      viDu: 'Lá Thư Trần Thế ô 23 (D7: tay trái Rê – Fa♯ – La – Đô, sang Sol thứ ở phách 4). Nỗi Buồn Hoa Phượng ô 17 → 18 (D7/F♯: bass Fa♯2 → Sol2).',
      coSo: `8 chỗ sạch (soát tay) ở 3 bài (Lá Thư, Một Cõi, Nỗi Buồn), 8/8 vào iv. Nốt trên cùng tay phải có ${n(3)} ở 0/8 chỗ — nên giai điệu cũng không có (giai điệu nằm trên cùng). Sửa lời trước: tôi từng viết "nhiều khả năng là lựa chọn của người phối" — sai, bản phổ biến có sẵn.`,
    }
    const ii: Diem = {
      y: 'ii°: của chị — chị chèn nó ngay trước V',
      giai: `Ở những chỗ chị bấm ${h(2, 'm7b5')}, bài đi thẳng iv → V hay ♭VI → V, hoặc ♭VI – ♭VII – V. Chị chèn ii° (dạng m7♭5) vào ngay trước V, hoặc đặt nó thay ♭VII. Vì sao hợp: ${h(2, 'm7b5')} chính là ${h(5, 'm')} đặt trên bass ${n(2)} (chồng hợp âm: m7♭5 = hợp âm thứ trên bậc ♭3), nên từ iv sang nó chỉ cần dời bass; rồi sang V thì ${n(8)} xuống ${n(7)}, ${n(0)} xuống ${n(11, 7)} — hai nốt đi nửa cung, hai nốt đứng yên. Có chỗ chị dùng nó làm bậc bass đi lên: i – ii° – ♭III (${n(0)} – ${n(2)} – ${n(3)}).`,
      ai: 'Của chị: bản phổ biến có ii° ở 0/12 chỗ chị đặt (mọi bản: 1/12) — 12 chỗ ở 4 bài của 4 nhạc sĩ.',
      viDu: 'Một Cõi Đi Về ô 49 → 51 (Sol thứ): Cm (tay trái Đô – Mi♭ – Sol) → Am7♭5 (La – Đô – Mi♭ – Sol: chỉ thêm bass La) → D7. Ô 35: ♭VI – ii° – V ở chỗ bản ghi ♭VI – ♭VII – V7.',
      coSo: 'Số đo: 12 chỗ, 6 chỗ đứng ngay trước V. Câu solo: ii° → V7 ở 4/5 bài thứ (md 13c).',
    }
    const bIII: Diem = {
      y: '♭III: phần lớn của bài — maj7 và 9 là của chị',
      giai: `Chị hay tới ${h(3, '')} từ ${h(10, '')} (V → I của giọng trưởng song song) rồi đi tiếp vào V: ${n(10)} nâng nửa cung thành ${n(11, 7)}, ${n(3)} xuống ${n(2)}, ${n(7)} đứng yên — từ trưởng song song sang V của giọng thứ chỉ bằng hai bước nửa cung.`,
      ai: 'Của bài: gốc ♭III ở 26/42 chỗ. Của chị: maj7 (bản không ghi 14/14), 9 (13/13), và 12 chỗ chèn thêm ♭III.',
      coSo: 'Số đo phần hát: ♭VII → ♭III 10 lần (4 bài), ♭III → V 9 lần (3 bài). Cách đi bè là lý thuyết — chưa đo bè thật ở bước này.',
    }
    const iv: Diem = {
      y: 'iv: của bài — add9 là của chị, dày lên ở điệp khúc',
      giai: `Nốt 9 của iv chính là ${n(7)} — bậc 5 của giọng — và nó cũng đến từ hình rải tay trái 8 – 9 – 10. Lên điệp khúc tay chị nắm dày hơn nên nốt ấy có mặt nhiều hơn. Cùng nốt ${n(7)} ấy là nốt bảy của ♭VImaj7 — bậc 5 của giọng ngân qua nhiều hợp âm.`,
      ai: 'Của bài: gốc iv ở 34/52 chỗ. Của chị: nốt 9 (bản không ghi 23/23).',
      coSo: 'Số đo: iv có nốt 9 ở điệp khúc 7/12 đoạn (3 bài), phiên khúc 17/45; nốt 9 ấy là bậc 5 của giọng ở 24/24 đoạn.',
    }
    const v: Diem = {
      y: 'V trưởng: của bài — cái của chị là màu và cách lấy nốt cảm âm',
      giai: `V trưởng (có nốt cảm âm ${n(11, 7)}) là hòa âm của bài — bản phổ biến gần như luôn ghi ${h(7, '7')}. Cái của chị: (1) màu căng ♭9 (${n(8)}) và ♭13 (${n(3)}) — hai nốt có sẵn trong gam thứ hòa âm; (2) cách lấy nốt cảm âm: tay đệm bấm V7 đủ trong khi nốt trên cùng ngân ${n(3)} — thành ${h(7, '7b13')}, tiếng "đặc sản" của giọng thứ; hoặc treo ${h(7, '7sus4')} rồi mới thả ${n(0)} xuống ${n(11, 7)}. Bậc ♭7 của V chị bấm ở tay trái nhưng ít khi giải xuống liền bậc như sách — lực kéo về i nằm ở bass (bậc 5 → 1) và nốt cảm âm.`,
      ai: 'Của bài: V ở 33/38 chỗ cùng bản phổ biến; bản cũng ghi ♭7 ở 16/20 chỗ chị có ♭7. Của chị: ♭9 · ♭13 (bản không ghi 8/8), treo sus4.',
      viDu: 'Một Cõi ô 51 (Sol thứ): tay trái Rê – La – Rê – Fa♯ – La – Đô, nốt trên cùng Si♭ → D7♭13. Lá Thư ô 37 → 38 (Rê thứ): A7sus4 — tay phải La – Rê – Sol — rồi Đô♯ ở ô sau.',
      coSo: 'Số đo (đã sửa lỗi đọc 7/10): V 41 đoạn, 5 bài; nốt cảm âm ở nốt trên cùng 12, chỉ ở tay đệm 18, không có 11 (treo hay bỏ bậc 3); ♭7 của V đi xuống liền bậc 2/19.',
    }
    const bVI: Diem = {
      y: '♭VImaj7: hoàn toàn là của chị — i đặt trên bass ♭6',
      giai: `Từ ${h(0, 'm')} xuống ${h(8, '')}, chị không thay tay phải: cặp nốt của i vẫn ở đó, chỉ bass bước xuống ${n(8)}. Ba nốt của i đặt trên bass ${n(8)} chính là ${h(8, 'maj7')} (chồng hợp âm: maj7 = hợp âm thứ trên bậc 3). Bass đổi thì cảnh đổi, tầng trên giữ thì tai vẫn thấy ở nhà — chuyển mà không nhảy. Lên điệp khúc tay nắm dày hơn, nốt giữ nghe rõ hơn, nên maj7 dồn về điệp khúc.`,
      ai: 'Của bài: gốc ♭VI ở 21/42 chỗ (chỗ khác chị tự đặt ♭VI). Của chị: maj7 — bản phổ biến không ghi ở chỗ nào (0/19).',
      viDu: 'Đừng Xa Em Đêm Nay ô 15 → 16 (Rê thứ → B♭maj7): tay phải lặp cặp La3 – Fa4 qua chỗ đổi, nốt trên cùng La4 ở phách 1, bass xuống Si♭2.',
      coSo: 'Số đo (đã sửa lỗi đọc 7/10): ♭VImaj7 23 đoạn, 4 bài; đứng ngay sau i 16/23; nốt bảy (bậc 5 của giọng) ngân qua chỗ đổi 10/23, ở nốt trên cùng 5/23; điệp khúc 14/22 đoạn ♭VI có maj7, phiên khúc 9/26. "Nắm dày làm nốt giữ rõ hơn" là suy luận.',
    }
    const bVII: Diem = {
      y: '♭VII: phần lớn do chị đặt — để bass đi xuống',
      giai: `i → ♭VII là bass đi xuống liền bậc từ chủ âm (${n(0)} → ${n(10)}); chị dùng nó mở một đường đi xuống (i → ♭VII → ♭VI hay → ♭III), hoặc đặt nó vào chỗ V cho tiếng mộc, không nốt cảm âm. Chị để ♭VII trơn là chính — việc của nó là đường bass.`,
      ai: 'Của bài: chỉ 8/28 chỗ. Của chị: 11 chỗ chèn, 9 chỗ đổi gốc (có 4 chỗ thay V, cùng một bài).',
      coSo: 'Số đo: i → ♭VII 11 lần (4 bài), ♭VII → ♭III 10 (4 bài). "Việc của nó là đường bass" là suy luận.',
    }
    return {
      nguyenTac: [
        KHUNG,
        { y: 'Màu nằm ở tay trái rải, không ở tên hợp âm', tom: 'Nốt 9 trên i và iv là bước liền 8 – 9 – 10 của tay trái — bản phổ biến không ghi màu nào trong số đó.', bac: [0, 5] },
        { y: 'Đổi bass, giữ tầng trên', tom: '♭VImaj7 là i đặt trên bass ♭6; ii°7 là iv đặt trên bass ii — màu và hợp âm chèn tự hiện ra khi bass đi.', bac: [8, 2] },
        { y: 'V và I7 là của bài — chị chỉ đổi cách bấm', tom: 'Nốt cảm âm, I7 → iv đều có trong bản phổ biến; cái của chị là ♭9 · ♭13, treo sus4, bậc 3 đặt ở bass.', bac: [7, 0] },
      ],
      bac: { 0: [iMau, i7], 2: [ii], 3: [bIII], 5: [iv], 7: [v], 8: [bVI], 10: [bVII] },
    }
  }

  const tron: Diem = {
    y: 'I: của bài — maj7 và 9 là của chị, và đều đến từ đường đi của bass',
    giai: `Ở ba bài trưởng chị giữ hợp âm của bài gần như ở mọi bậc. Màu chỉ xuất hiện khi bass hay bè đang đi: ${h(0, 'maj7')} thật ra là nốt dẫn bass — I sang vi bằng đường ${n(0)} → ${n(11)} → ${n(9)}, nốt ${n(11)} rơi ở móc cuối ô; add9 trên I là bước 8 – 9 – 10 của tay trái, như ở bài thứ.`,
    ai: 'Của bài: gốc I ở 51/58 chỗ. Của chị: maj7 (bản không ghi 13/13), 9 (14/14).',
    viDu: 'Mùa Xuân Đầu Tiên ô 19 → 20 (Sol trưởng): tay trái kết ô bằng Fa♯3 rồi vào Mi3 của Em. Đường Xưa Lối Cũ ô 36 → 37 (Đô trưởng): tay trái Đô – Sol – Đô – Rê – Mi … Si2 → La2 của Am.',
    coSo: 'Số đo: I có nốt 7 ở 13 đoạn (2 bài) — nốt ấy bước xuống một cung vào hợp âm sau 12/13, hợp âm sau là vi 12/13.',
  }
  const bacII: Diem = {
    y: 'Bậc II: mỗi bài một chuyện — có bài là của bài, có bài là của chị',
    giai: `Trên bậc II chị luôn để chủ âm vang làm ♭7 (ở ${giong}: ${n(0)} trên ${h(2, '')}), nên hợp âm vẫn dính với nhà. Mùa Xuân: bản phổ biến có sẵn ii – II – V; chị giữ II của bài (có chỗ bấm II7sus4 — treo bậc 4 thay bậc 3), và còn tự nâng thêm hai chỗ bản ghi ii thành II. Đường Xưa: bản ghi ii hoặc V7, chị đổi thành II7 có ♯4 rồi về thẳng I — nốt ♯4 ở đây là màu sáng chen giữa hai lần I, không phải lực kéo về V. Biển Tình: bản ghi ii, chị bấm gốc – 5 – ♭7 bỏ bậc 3 — thực chất là ii7 bỏ bậc 3.`,
    ai: 'Của bài: Mùa Xuân — bản phổ biến có II ở 3/6 chỗ chị đặt II (2 trong 3 chỗ ấy chị treo bậc 4). Của chị: 2 chỗ Mùa Xuân bản ghi ii; Đường Xưa — 0/3 bản có II7 ở cả 4 chỗ chị đặt.',
    viDu: 'Mùa Xuân ô 33: nốt trên cùng có Đô tự nhiên trên A7 — bấm Đô♯ sẽ chỏi nửa cung, nên chị treo Rê. Đường Xưa ô 35: D9/F♯ — Fa♯ ở bass, rồi về C.',
    coSo: 'Số đo (đã sửa lỗi đọc 7/10): II 12 đoạn, 3 bài — bản phổ biến có II 3/12, ghi ii 5/12, V7 hay iii 2/12, không có 2/12; ♭7 11/12; bậc 3 trưởng vang 7/12; đi tới V 5/12. Sửa lời trước: tôi từng viết "II7 là át của V, nâng Fa lên Fa♯, 10/10" — sai.',
  }
  const giam: Diem = {
    y: 'Hợp âm giảm thay V: của chị — đều là V hay II bỏ gốc',
    giai: `Ở chỗ V (hay chỗ chuẩn bị V), chị có lúc đặt hợp âm giảm: ${h(11, 'dim7')} = ${h(7, '7b9')} bỏ gốc (bảy giảm trên bậc 3 của V — công thức chồng 7♭9), hoặc ${h(6, 'm7b5')} = ${h(2, '9')} bỏ gốc. Ở Đường Xưa, bass đi nửa cung ${n(5)} → ${n(6, 4)} thay cho ${n(5)} → ${n(7)} của bản, và nốt trên cùng ở đó nằm trong hợp âm của chị chứ không nằm trong V của bản.`,
    ai: 'Của chị: 0/3 bản có ♯iv° ở Đường Xưa (3 chỗ), 0/5 bản có vii° ở Mùa Xuân (4 chỗ).',
    viDu: 'Đường Xưa ô 18 → 20 (Đô trưởng): F → F♯m7♭5 (tay trái Fa♯ – Đô – Mi – La) → C. Mùa Xuân ô 50 (Sol trưởng): F♯°7 (tay trái Fa♯ – Đô – Mi – La, tay phải có Mi♭) → G.',
    coSo: 'Số đo: Đường Xưa 3 chỗ thay V, nốt trên cùng không nằm trong V của bản ở 3/3. Mùa Xuân 4 chỗ vii° — 1 chỗ thay V7, 3 chỗ ở chỗ bản ghi ii, iii hay vi (đã soát tay ô 50, 85).',
  }
  return {
    nguyenTac: [
      KHUNG,
      { y: tron.y, tom: 'Imaj7 là nốt dẫn bass I → vi; add9 trên I là bước 8 – 9 – 10 của tay trái — bản phổ biến không ghi màu nào.', bac: [0, 9] },
      { y: bacII.y, tom: 'II của Mùa Xuân có trong bản phổ biến; II7 của Đường Xưa là chị tự đặt — và về I, không về V.', bac: [2] },
      { y: giam.y, tom: 'Chỗ bản ghi V, chị đặt hợp âm giảm (V7♭9 hay II9 bỏ gốc) cho bass đi nửa cung.', bac: [7] },
    ],
    bac: {
      0: [tron],
      2: [
        bacII,
        {
          y: 'ii: của bài — ♭7 và 9 là của chị',
          giai: `Chị giữ ii của bài; màu thì bản phổ biến không ghi: ♭7 (${n(0)}) và 9 (${n(4)}).`,
          ai: 'Của bài: gốc ii ở 28/30 chỗ. Của chị: ♭7 (bản không ghi 11/11), 9 (10/10).',
          coSo: 'Số đo phần hát 3 bài trưởng.',
        },
      ],
      4: [
        {
          y: 'iii: một nửa của bài',
          giai: 'Chị để iii trơn; một nửa số chỗ là chị chèn hoặc đặt iii vào chỗ bản ghi ii. Ở câu solo iii nằm trong chuỗi I → vi → iii → ii đi dần về V.',
          ai: 'Của bài: 10/20 chỗ. Của chị: 6 chỗ chèn, 4 chỗ đổi gốc.',
          coSo: 'Số đo phần hát; câu solo: md 13c (Biển Tình, Mùa Xuân).',
        },
      ],
      5: [
        {
          y: 'IV: của bài; đoạn kết thì chị mượn iv',
          giai: `Phần hát chị giữ IV của bài. Đoạn kết không lời của Đường Xưa thì chị đổi IV thành iv — mượn giọng thứ cùng chủ âm (ở ${giong}: ${h(5, 'm')}) — và ngân suốt năm ô: ♭6 (${n(8, 6)}) rơi xuống bậc 5 (${n(7)}) cho bài khép lại buồn.`,
          ai: 'Của bài: IV ở 21/24 chỗ phần hát. Của chị: cả đoạn kết (bản phổ biến không có đoạn không lời).',
          coSo: 'md 13c: kết Đường Xưa vi · iv ×5. "Khép lại buồn" là suy luận.',
        },
      ],
      7: [
        {
          y: 'V: của bài, để trơn là chính',
          giai: `${h(7, '')} trơn đã có nốt cảm âm ${n(11)} và bass ${n(7)} → ${n(0)} — đủ kéo về nhà, nên chị ít thêm ♭7.`,
          ai: 'Của bài: V ở 37/41 chỗ.',
          coSo: 'Số đo md 13d: V trơn 25/42, ♭7 chỉ 7/42. Lý do là suy luận.',
        },
        giam,
      ],
      9: [
        {
          y: 'vi: của bài — chị nối vào nó bằng bass liền bậc',
          giai: `I → vi là bước chị đi nhiều nhất ở giọng trưởng, và chị nối nó bằng bass đi liền bậc (${n(0)} → ${n(11)} → ${n(9)}) chứ không nhảy thẳng.`,
          ai: 'Của bài: vi ở 26/34 chỗ. Của chị: nốt dẫn bass ở giữa.',
          coSo: 'Số đo: I → vi 26 lần, 3 bài (md 13d, đã sửa lỗi đọc 7/10); 12 chỗ có nốt 7 dẫn xuống vi (2 bài).',
        },
      ],
    },
  }
}

/*
  CÀ PHÁO (7/10/2026 — áp cách tách của Linh Nhi sang thầy khác): 7 bài, 7 nhạc sĩ, phần hát; `tools/tach_lua_chon.py --thay ca-phao
  --kiem`, md Cà Pháo mục "Ai chọn hợp âm". 3/4 bài thứ sheet không ghi giọng — giọng suy từ hợp âm (GIONG_SUY). Mọi chỗ "anh đổi"
  dưới đây đã soát tay từng nốt; 12/41 chỗ máy báo "khác bản" đã soát là máy đọc lệch ký hiệu.
  VIẾT LẠI 8/10/2026 theo người dùng: "đừng ghi chung chung … ghi rõ là bậc nào anh đổi thành những hòa âm gì và đóng vai một nhạc sĩ
  để phân tích lựa chọn đó của anh sẽ mang lại cảm giác gì khi nghe và tại sao nên chọn hợp âm đó … đừng liệt kê máy móc". Mỗi ý: tựa
  "bài ghi X → anh bấm Y" (theo bậc của BÀI); lời = nghe ra sao, vì sao chọn, khi nào nên / không nên (phân tích của Claude trong vai
  nhạc sĩ — lời dẫn thẻ ghi rõ); số đo dồn vào "Ai chọn" và "Cơ sở"; `nghe` = câu ngắn bài ghi / anh bấm để so bằng tai.
*/
const KHUNG_CP: NguyenTac = {
  y: 'Anh đi đúng đường của bài — cái riêng là lớp màu phủ lên từng hợp âm',
  tom: 'Anh hầu như không đổi đường hợp âm của bài, mà đổi độ dày của từng chỗ dừng: hợp âm thứ thành m7, m9; ♭VI thành maj7, maj9, có khi thêm ♯11; V thêm 9, ♭13; I trưởng thành add9. Nghe vẫn là bài hát quen, nhưng mềm và sang hơn — tiếng ballad nhạc trẻ. (309/400 hợp âm phần hát cùng gốc và loại với bản phổ biến; hợp âm thứ có ♭7 vang 140/172 đoạn, Linh Nhi 137/302. Soát tay 41/60 chỗ máy báo khác bản: 16 chỗ chỉ anh bấm, 10 có trong một bản khác, 12 máy đọc lệch ký hiệu, 3 bản phổ biến ghi lệch giai điệu.)',
  bac: [],
}
const MAU_CP: NguyenTac = {
  y: 'Màu nằm trong tay phải, ngay dưới giai điệu — tay trái chỉ giữ bass',
  tom: 'Tay phải anh vừa hát giai điệu vừa nắm ♭7, 9 ngay bên dưới; tay trái gốc, quãng tám, gốc – 5. Giai điệu như nằm trên một tấm đệm mềm. Linh Nhi ngược lại: màu của chị nằm ở hình rải tay trái. (♭7 ở bè giữa tay phải 145/248 đoạn có ♭7, Linh Nhi 27/253; tay trái bấm đủ hợp âm ba 42/350, Linh Nhi 196/638.)',
  bac: [0],
}

function lyDoCaPhao(tonic: number, thu: boolean): LyDoThay {
  const { n, h } = nguCanh(tonic, thu)
  const H = (goc: number, chat: string): Hop => ({ goc, chat })
  if (thu) {
    const i: Diem = {
      y: `Bài ghi ${h(0, 'm')} → anh bấm ${h(0, 'm7')}, ${h(0, 'm9')}`,
      giai: `${h(0, 'm')} trơn nghe thẳng và trần — ba nốt, không có gì lơ lửng. Anh gần như không để nó trơn. Thêm ${n(10)} thành ${h(0, 'm7')}: tay phải anh bấm đúng hợp âm ${h(3, '')} (${n(3)} – ${n(7)} – ${n(10)}) trên bass ${n(0)} — tay phải là một hợp âm trưởng, tay trái kéo nó về thứ, nên ${h(0, 'm7')} nghe vừa buồn vừa ấm. Thêm ${n(2)} thành ${h(0, 'm9')}: có chỗ anh đặt ${n(2)} sát dưới ${n(3)}, hai nốt cách nửa cung cọ vào nhau thành một vệt mờ — mơ màng, hiện đại. Nên chọn ${h(0, 'm7')} gần như mọi chỗ i ngân dài dưới giọng hát; ${h(0, 'm9')} khi muốn mờ ảo hơn, nhất là đầu câu. Để i trơn khi muốn mộc, chân phương — bolero, dân ca nghe tự nhiên hơn.`,
      ai: 'Của anh: ♭7 và 9 — bản phổ biến ghi i trơn ở 28/28 và 24/24 chỗ anh có. Gốc i là của bài (53/55).',
      viDu: 'Chúng Ta Không Thuộc Về Nhau ô 11 (La thứ): tay trái La2 – Đô4, tay phải Đô4 – Mi4 – Sol4 — C trên bass La = Am7. Người hãy quên em đi ô 66 (Rê thứ): tay trái Rê2 – La2 – Rê3, tay phải Mi4 – Fa4 – La4 (9 sát dưới ♭3).',
      coSo: 'Phần hát 4 bài thứ (3 bài giọng suy từ hợp âm): i có ♭7 vang 43/60 đoạn. 9 sát dưới bậc 3 là cách xếp chung — Linh Nhi cũng thế (30/88 · 13/43).',
      nghe: { bai: [H(0, 'm'), H(5, 'm'), H(0, 'm')], thay: [H(0, 'm9'), H(5, 'm7'), H(0, 'm7')] },
    }
    const i7: Diem = {
      y: `Bài ghi ${h(0, 'm')} ngay trước ${h(5, 'm')} → anh bấm ${h(0, '7')}, có khi cả cụm ${h(7, 'm7')} – ${h(0, '7')} – ${h(5, 'm7')}`,
      giai: `Đây là chỗ anh "bẻ lái" rõ nhất. Bài đi ${h(0, 'm')} → ${h(5, 'm')}: buồn, phẳng. Anh nâng ${n(3)} lên ${n(4, 3)}: giữa bài thứ bỗng lóe lên một hợp âm trưởng có ♭7 — sáng và căng. ${n(4, 3)} muốn bước lên ${n(5)}, ${n(10)} muốn rơi xuống ${n(8)}: cả hai cùng đổ vào ${h(5, 'm')}, nên iv không còn là "hợp âm kế tiếp" mà là nơi được dẫn tới — và buồn hơn, vì vừa được hứa một chút ánh sáng. Có chỗ anh chèn thêm ${h(7, 'm7')} phía trước: ${h(7, 'm7')} – ${h(0, '7')} – ${h(5, 'm7')} là ii – V – i của chính ${h(5, 'm')}, câu nhạc rẽ vào một con hẻm ngắn rồi mới về đường lớn. ${h(7, 'm7')} phải thứ, vì ${n(10)} của nó ngân sang làm ♭7 của ${h(0, '7')} — một nốt nối hai hợp âm. Nên chọn ở chỗ i chuyển sang iv mà giai điệu không có ${n(3)} — ${n(4, 3)} đụng ${n(3)} của giai điệu sẽ chỏi nửa cung. Có chỗ anh cho ${h(0, '7')} rẽ sang ${h(8, '')} thay vì iv: ${h(8, '')} chung ${n(8)} – ${n(0)} với ${h(5, 'm')}, tai chờ iv mà nhận ♭VI — một cú lỡ hẹn nhẹ, nghe bâng khuâng.`,
      ai: 'Của anh: bản phổ biến chính ghi i ở cả 5 chỗ (một bản khác ghi I ở 3/5 chỗ).',
      viDu: 'Để Em Rời Xa ô 10 → 12 (Rê thứ): Gm9 → Am7 → D7 (tay trái Rê2, Sol treo rồi xuống Fa♯) → Gm7, chỗ bản phổ biến ghi B♭ – A – Dm – B♭. Chưa Bao Giờ ô 54 → 55 (Fa thứ): Cm7 → F7 (La tự nhiên ở tay trái) → B♭m7. Chưa Bao Giờ ô 17 → 18: F7 → D♭maj7.',
      coSo: 'Soát tay 5/5 chỗ, 3 bài: vào iv 3, vào ♭VI 2; tay phải không có ♭3 ở 5/5 chỗ.',
      nghe: { bai: [H(8, ''), H(7, ''), H(0, 'm'), H(8, '')], thay: [H(5, 'm9'), H(7, 'm7'), H(0, '7'), H(5, 'm7')] },
    }
    const II: Diem = {
      y: `Bài ghi ${h(2, 'dim')} trước V → anh bấm ${h(2, '7')} (có chỗ ${h(2, '7b5')})`,
      giai: `${h(2, 'dim')} trước V là lối đi quen của giọng thứ: mờ, nghiêng, chỉ báo V sắp tới. Anh đổi đúng một nốt — ${n(5)} lên ${n(6, 4)} — thành ${h(2, '7')}, "át của át": ${n(6, 4)} là nốt dẫn của ${n(7)}, nên hợp âm có hướng hẳn, đẩy câu nhạc về V. Nghe như người hát lấy hơi sâu trước chữ cao, rồi V đến như một điểm tựa vững. Nên chọn khi V là chỗ câu hát dừng lâu hay lên cao trào — muốn người nghe thấy rõ "đã tới". ${h(2, '7b5')} (giữ ${n(8)} của ${h(2, 'dim')}) là bản nửa đường: vẫn có ${n(6, 4)} dẫn lên mà còn chút u tối của hợp âm giảm. Đừng chọn nếu giai điệu đang hát ${n(5)} đúng chỗ ấy — ${n(6, 4)} sẽ chỏi nửa cung với giai điệu.`,
      ai: 'Của anh: không bản phổ biến nào ghi II ở cả 3 chỗ (1 bài).',
      viDu: 'Người hãy quên em đi ô 23 → 24 (Rê thứ): E7 — tay trái Mi3 – Sol♯3, tay phải Sol♯4 – Mi5 – Rê5 — rồi A11 (tay trái La2 – Sol3, tay phải Si – Rê – Mi), Đô♯ chỉ vào ở móc cuối ô. Ô 55: E7♭5 — giữ Si♭ của bản.',
      coSo: '3 chỗ, 1 bài — n nhỏ. Ô 36 là chuyện khác: Emaj7 nửa phách chen giữa hai Fmaj7 (cả khối trượt xuống nửa cung rồi lên lại).',
      nghe: { bai: [H(2, 'dim'), H(7, ''), H(0, 'm')], thay: [H(2, '7'), H(7, ''), H(0, 'm')] },
    }
    const bIII: Diem = {
      y: `Bài ghi ${h(3, '')} → anh bấm ${h(3, 'maj7')}`,
      giai: `${h(3, '')} giữa bài thứ là lúc bài ghé sang trưởng — sáng lên một chút. Anh thêm ${n(2)} thành ${h(3, 'maj7')}: cái sáng ấy bị phủ một lớp sương, nghe êm, lơ lửng, hoài niệm. ${n(2)} nằm nửa cung dưới ${n(3)} — cặp nốt cọ nhẹ làm hợp âm mềm đi — và ${n(2)} có sẵn trong gam nên không lạ tai. Nên chọn khi muốn chỗ sáng của bài vẫn giữ màu buồn. Để trơn khi muốn khoảnh khắc trưởng ấy rõ, tươi; và tránh maj7 khi giai điệu đang ngân ${n(3)} — ${n(2)} ngay dưới sẽ cọ thẳng vào giai điệu.`,
      ai: 'Của anh: maj7 — bản không ghi ở 6/6 chỗ anh có. Gốc ♭III là của bài (8/11).',
      coSo: 'Phần hát 3 bài — n nhỏ; chưa soát tay ô nào.',
      nghe: { bai: [H(0, 'm'), H(3, '')], thay: [H(0, 'm7'), H(3, 'maj7')] },
    }
    const iv: Diem = {
      y: `Bài ghi ${h(5, 'm')} → anh bấm ${h(5, 'm7')}, ${h(5, 'm9')}`,
      giai: `Như mọi hợp âm thứ của anh, iv gần như luôn có ♭7 (${n(3)}): ${h(5, 'm7')} là ${h(8, '')} đặt trên bass ${n(5)} — lại một hợp âm trưởng ở tay phải, nên iv bớt nặng, nghe dịu. ${h(5, 'm9')} thêm ${n(7)}: nốt ấy là bậc 5 của giọng, có trong cả i lẫn V, nên từ ${h(5, 'm9')} đi đâu tầng trên cũng gần như đứng yên — chuyển mà không nhảy. Nên chọn ${h(5, 'm9')} khi iv ngân lâu giữa câu; ${h(5, 'm7')} khi iv đi nhanh sang V.`,
      ai: 'Của anh: ♭7 và 9 — bản không ghi ở 15/15 và 5/5 chỗ. Gốc iv là của bài ở 17/27 chỗ; 8 chỗ anh tự đặt iv (xem bậc 6).',
      coSo: 'Phần hát 4 bài thứ.',
      nghe: { bai: [H(5, 'm'), H(7, ''), H(0, 'm')], thay: [H(5, 'm9'), H(7, ''), H(0, 'm')] },
    }
    const V: Diem = {
      y: `Bài ghi ${h(7, '')} hay ${h(7, '7')} → anh bấm ${h(7, '7b13')}, ${h(7, '9')}`,
      giai: `V trưởng có nốt cảm âm ${n(11, 7)} là xương sống của giọng thứ — anh giữ. Cái anh thêm là màu. ♭13 (${n(3)}) chính là bậc ♭3 của giọng, đặt trên V: hợp âm như đã "biết" mình sắp về một nhà buồn — căng và tối hơn, rất giọng thứ. 9 (${n(9)}) thì ngược lại: mở, sáng. Nên chọn ♭13 khi giai điệu trên V đang hát ${n(3)} — lúc ấy ♭13 là bắt buộc, không phải màu — hay khi muốn kết câu nặng; 9 khi V ngân dài, cần độ rộng.`,
      ai: 'Của anh: 9 và ♭13 — bản không ghi ở 7/7 chỗ. V có cảm âm là của bài (15/20).',
      viDu: 'Người hãy quên em đi ô 25 → 26 (Rê thứ): tay trái La1 – La2 ngân cả ô; tay phải La – Đô♯ – Sol (A7), rồi đỉnh Fa5 (♭13) đi xuống Mi5 – Rê5 vào Dm.',
      coSo: 'Phần hát 2 bài; ♭7 của V bản đã ghi 7/13 chỗ. 3 chỗ máy báo "anh đổi ♭VII thành V" là bản ghi lệch: giai điệu có cảm âm ngay ở đó (soát tay 3/3).',
      nghe: { bai: [H(7, '7'), H(0, 'm')], thay: [H(7, '7b13'), H(0, 'm')] },
    }
    const bVI: Diem = {
      y: `Bài ghi ${h(8, '')} → anh bấm ${h(8, 'maj7')}, ${h(8, 'maj9')}, có khi thêm ♯11`,
      giai: `${h(8, '')} → V là bước buồn nhất của giọng thứ: bass rơi nửa cung. Anh không để ${h(8, '')} trơn. ${h(8, 'maj7')} chính là ${h(0, 'm')} đặt trên bass ${n(8)}: tầng trên vẫn là ba nốt của nhà, chỉ nền dưới chân rơi xuống — vẫn đứng ở nhà mà mặt đất đã khác. Thêm ${n(10)} (9) cho rộng ra; thêm ${n(2)} (♯11) thì hợp âm lấp lánh, lơ lửng — mà không lạ tai, vì ${n(2)} có sẵn trong gam. Nên chọn ${h(8, 'maj7')} khi ♭VI là chỗ câu hát ngân dài (thường là đầu điệp khúc); ♯11 khi muốn cảm giác bay, mở; để trơn khi ♭VI chỉ lướt qua.`,
      ai: 'Của anh: maj7, 9, 6, ♯11 — bản không ghi ở 23/23, 19/19, 14/14, 8/8 chỗ. Gốc ♭VI là của bài (45/45).',
      viDu: 'Người hãy quên em đi ô 21 (Rê thứ, sheet ghi B♭maj9(♯11)): tay trái chỉ Si♭1 – Si♭2 – Fa3; tay phải Mi4 – Đô5 – Mi5 (♯11, 9) rồi Fa4 – La4 – Rê5 (maj7 ở giữa).',
      coSo: 'Phần hát 4 bài thứ.',
      nghe: { bai: [H(0, 'm'), H(8, ''), H(7, '')], thay: [H(0, 'm7'), H(8, 'maj9'), H(7, '')] },
    }
    const bVIiv: Diem = {
      y: `Bài ghi ${h(8, '')} → anh đổi hẳn thành ${h(5, 'm9')} (hạ bass một quãng ba)`,
      giai: `Tay phải anh vẫn bấm ${h(8, 'maj7')} của bài, chỉ bass hạ từ ${n(8)} xuống ${n(5)}: thành ${h(5, 'm9')}. Giai điệu không đổi một nốt, nhưng hợp âm trưởng sáng biến thành hợp âm thứ tối và mềm — như cùng một câu hát mà chuyển từ ngoài trời vào trong phòng. Vì sao chọn: ♭VI là nỗi buồn "rơi", iv là nỗi buồn "lắng" — anh muốn đoạn ấy lắng xuống thay vì rơi. Có chỗ iv còn là đích của ${h(0, '7')}: bass rơi một quãng năm ${n(0)} → ${n(5)}, bước kết mạnh nhất, mà ♭VI không cho được. Nên chọn khi đoạn nhạc cần trầm, kín hơn bản gốc; giữ ♭VI khi cần cái sáng mở ra, như lúc điệp khúc vươn lên.`,
      ai: 'Của anh: 8 chỗ, 3 bài — không bản phổ biến nào ghi iv ở cả 8 chỗ.',
      viDu: 'Chúng Ta Không Thuộc Về Nhau ô 20 → 22 (La thứ): Em7 → Dm9 (tay trái Rê2 – Rê3 – La3; tay phải Fa4 – La4 – Đô5 – Mi5 = Fmaj7 của bài) → Em7. Để Em Rời Xa ô 10 (Rê thứ): bass Sol2, tay phải Đô – Fa – La – Si♭ – Mi (hợp âm B♭ của bài nằm trên).',
      coSo: 'Soát tay 8/8 (bass bấm thật). Nốt trên cùng hợp với ♭VI của bản ở 5/8 chỗ — phần lớn không phải giai điệu ép anh đổi.',
      nghe: { bai: [H(7, 'm7'), H(8, 'maj7'), H(7, 'm7')], thay: [H(7, 'm7'), H(5, 'm9'), H(7, 'm7')] },
    }
    const bVII: Diem = {
      y: `Bài ghi ${h(10, '')} → anh bấm ${h(10, 'add9')}, ${h(10, '7')}`,
      giai: `${h(10, '')} là hợp âm "át mộc" của giọng thứ — không có nốt cảm âm. Anh thêm 9 (${n(0)}): 9 của ♭VII chính là chủ âm, nên trong lúc bass đứng ở ${n(10)}, tai vẫn nghe nhà vang ở trên — về lại i rất êm, như chưa từng đi xa. Thêm ♭7 (${n(8)}) thì hợp âm có hướng hơn: ${n(8)} muốn rơi xuống ${n(7)}. Nên chọn ${h(10, 'add9')} khi ♭VII sắp về i; ${h(10, '7')} khi muốn ♭VII đẩy tiếp sang hợp âm sau.`,
      ai: 'Của anh: 9 và ♭7 — bản không ghi ở 11/11 và 13/13 chỗ. Gốc ♭VII là của bài (35/35).',
      coSo: 'Phần hát 4 bài thứ; chưa đo nốt 9 nằm tay nào. Ở Chúng Ta, 7 chỗ bản khớp nhất ghi ♭VII mà anh bấm v7 — 2/3 bản phổ biến cũng ghi v, nên đó là của bài.',
      nghe: { bai: [H(10, ''), H(0, 'm')], thay: [H(10, 'add9'), H(0, 'm7')] },
    }
    return {
      nguyenTac: [
        KHUNG_CP,
        { ...MAU_CP, bac: [0, 8] },
        {
          y: 'Ba chỗ anh đổi hẳn hợp âm của bài',
          tom: '♭VI thành iv9 — hạ bass một quãng ba, tối và lắng hơn; i thành I7 ngay trước iv — lóe sáng rồi dẫn vào iv; ii° thành II7 trước V — đẩy mạnh vào V. Không bản phổ biến nào ghi các chỗ ấy.',
          bac: [8, 0, 2],
        },
      ],
      bac: { 0: [i, i7], 2: [II], 3: [bIII], 5: [iv], 7: [V], 8: [bVI, bVIiv], 10: [bVII] },
    }
  }

  const I: Diem = {
    y: `Bài ghi ${h(0, '')} → anh bấm ${h(0, 'add9')}, ${h(0, 'maj7')}`,
    giai: `${h(0, '')} trơn sáng nhưng hơi "sách giáo khoa". Anh thêm ${n(2)}: tay phải ${n(2)} – ${n(4)} – ${n(7)}, nốt 9 nằm sát dưới bậc 3 — hai nốt cách một cung, nghe mở và trong. ${h(0, 'maj7')} (thêm ${n(11)}) thì mơ màng hơn, hơi hoài niệm. Nên chọn add9 gần như mọi chỗ I ngân dài; maj7 khi muốn dịu, buồn nhẹ. Tránh maj7 khi giai điệu đang ngân ${n(0)} — ${n(11)} ngay dưới sẽ cọ nửa cung vào giai điệu.`,
    ai: 'Của anh: 9 và maj7 — bản không ghi ở 15/15 và 5/5 chỗ. Gốc I là của bài (29/33).',
    viDu: 'Hồng Kông 1 ô 31 (Đô trưởng, sheet ghi Cadd9): tay trái Đô3 – Sol2, tay phải phách 2 bấm Rê4 – Mi4 – Sol4.',
    coSo: 'Phần hát 3 bài trưởng.',
    nghe: { bai: [H(0, ''), H(9, 'm')], thay: [H(0, 'add9'), H(9, 'm7')] },
  }
  const II13: Diem = {
    y: `Bài ghi ${h(0, '')} ngay trước V → anh đổi thành ${h(2, '13')}`,
    giai: `Bài đứng ở I rồi mới sang V — đúng, nhưng phẳng. Anh thay nửa sau của I bằng ${h(2, '13')}: bass bước lên ${n(2)}, và ${n(6, 4)} xuất hiện — nốt dẫn của ${n(7)} — nên V được kéo tới chứ không chỉ đi tới. Chủ âm không mất: ${n(0)} thành ♭7 của ${h(2, '7')}, nên giai điệu đang ngân chủ âm vẫn khớp. Nghe như câu nhạc nhón chân lên trước khi về — hợp chỗ cuối phiên khúc, trước điệp khúc. Nên chọn khi I kéo dài trước V; đừng chọn khi giai điệu đang hát ${n(5)} — ${n(6, 4)} sẽ chỏi nửa cung.`,
    ai: 'Của anh: không bản phổ biến nào ghi II ở cả 2 chỗ (1 bài, một câu lặp lại).',
    viDu: 'Ngày mai em đi ô 25 → 26 (Mi♭ trưởng, sheet ghi F13): tay trái La2 – Fa3 – Đô4 rồi Fa2 – Đô3 – La3; giai điệu quãng tám Đô – Mi♭ – Rê; sang B♭7 ở ô 26.',
    coSo: '2 chỗ, 1 bài — n nhỏ.',
    nghe: { bai: [H(0, ''), H(0, ''), H(7, '7'), H(0, '')], thay: [H(0, ''), H(2, '13'), H(7, '7'), H(0, '')] },
  }
  const I7: Diem = {
    y: `Bài ghi ${h(0, '')} trước IV → có chỗ anh bấm ${h(0, '7')}`,
    giai: `Thêm ${n(10)} vào ${h(0, '')}: chủ âm thành hợp âm át của IV — ${n(10)} muốn rơi xuống ${n(9)}, bậc 3 của IV. Nghe có chút blues, gospel: một cú đẩy làm IV đến như được mời. Nên chọn khi I sắp sang IV và giai điệu không có ${n(11)} — nốt ấy cọ nửa cung với ${n(10)}.`,
    ai: 'Của anh: ♭7 trên I — bản không ghi ở 10/12 chỗ.',
    viDu: 'Hồng Kông 1 ô 40 → 41 (Đô trưởng): sheet ghi "Am/C" mà tay trái Đô2 – Si♭3, tay phải Si♭3 – Mi4 – Sol4 = C7; ô 41 bass Fa2 dưới La – Mi = Fmaj7.',
    coSo: 'Soát tay 1/12 chỗ (Hồng Kông 1 ô 40) — chưa soát các chỗ còn lại.',
    nghe: { bai: [H(0, ''), H(5, '')], thay: [H(0, '7'), H(5, 'maj7')] },
  }
  const iii: Diem = {
    y: `Bài ghi ${h(4, 'm')} → anh bấm ${h(4, 'm7')}`,
    giai: `Như mọi hợp âm thứ của anh: thêm ♭7 (${n(2)}). Tay phải bấm ${h(7, '')} trên bass ${n(4)} — một hợp âm trưởng trên nền thứ, nghe mềm và sáng hơn ${h(4, 'm')} trơn, nối sang vi hay IV rất êm. Nên chọn gần như luôn khi iii ngân; để trơn khi iii chỉ lướt qua.`,
    ai: 'Của anh: ♭7 — bản không ghi ở 12/12 chỗ. Gốc iii là của bài (14/16).',
    coSo: 'Phần hát 3 bài trưởng: iii có ♭7 vang 16/17 đoạn.',
    nghe: { bai: [H(4, 'm'), H(9, 'm')], thay: [H(4, 'm7'), H(9, 'm7')] },
  }
  const IV: Diem = {
    y: `Bài ghi ${h(5, '')} → anh bấm ${h(5, 'maj7')} (= ${h(9, 'm')} trên bass ${n(5)}), ${h(5, '6')}`,
    giai: `${h(5, 'maj7')} trong tay anh là ${h(9, 'm')} đặt trên bass ${n(5)} — một hợp âm thứ trên nền trưởng, nên IV vừa sáng vừa man mác: cái tiếng "IV mơ màng" của ballad. ${h(5, '6')} (thêm ${n(2)}) thì ấm, cổ điển hơn. Nên chọn maj7 khi IV ngân dài dưới giai điệu ở ${n(9)}, ${n(0)} hay ${n(4)}; tránh khi giai điệu đang ngân ${n(5)} — ${n(4)} ngay dưới sẽ cọ nửa cung.`,
    ai: 'Của anh: 6 và 9 — bản không ghi ở 5/5 chỗ; maj7 thì bản đã ghi 5/8 chỗ. Gốc IV là của bài (20/20, thêm 4 chỗ máy đọc nhầm thành vi).',
    viDu: 'Hồng Kông 1 ô 26, 33, 82, 90 (Đô trưởng): sheet ghi Am, tay trái Fa2 ở phách 1 rồi La – Đô, tay phải La4 – Mi4 — nghe là Fmaj7.',
    coSo: 'Soát tay 4/4.',
    nghe: { bai: [H(0, ''), H(5, ''), H(0, '')], thay: [H(0, 'add9'), H(5, 'maj7'), H(0, 'add9')] },
  }
  const Vt: Diem = {
    y: `Bài ghi ${h(7, '')} → anh bấm ${h(7, '7sus4')} rồi ${h(7, '13')}`,
    giai: `Anh hay vào V bằng ${h(7, '7sus4')}: tay trái ${n(7)}, tay phải ${n(0)} – ${n(5)} ngân — bậc 3 bị treo, câu nhạc lửng lơ như hỏi mà chưa nói hết; rồi ${n(0)} mới thả xuống ${n(11)} và V hiện rõ. Màu thêm: 9 (${n(9)}), 13 (${n(4)}) — ${h(7, '13')} ấm và tròn, chất gospel, pop ballad. Nên chọn sus4 ở cuối câu trước khi về I — cho người nghe một nhịp chờ; 13 khi V ngân dài.`,
    ai: 'Của anh: 9 và 13 — bản không ghi ở 12/12 và 6/6 chỗ. Gốc V là của bài (27/32).',
    viDu: 'Hồng Kông 1 ô 30 (Đô trưởng — sheet ghi "Csus4/G", máy đọc ra I treo): tay trái Sol2 – Rê3 – Sol3, tay phải Đô4 – Fa4 ngân hai phách, rồi Sol – Si – Rê với bass đi Sol – La – Si – Đô vào I.',
    coSo: '"Csus4/G" soát tay 3 chỗ (Hồng Kông 1 ô 30, 45, 99): bass Sol cả 3 — là V treo, không phải I.',
    nghe: { bai: [H(7, ''), H(0, '')], thay: [H(7, '7sus4'), H(7, '13'), H(0, '')] },
  }
  const vi: Diem = {
    y: `Bài ghi ${h(9, 'm')} → anh bấm ${h(9, 'm7')}`,
    giai: `Như mọi hợp âm thứ của anh: ${h(9, 'm7')} — tức ${h(0, '')} đặt trên bass ${n(9)}. I và ${h(9, 'm7')} chung ba nốt, nên từ I sang đó tay phải gần như đứng yên, chỉ bass bước xuống: buồn đi mà không đổi cảnh.`,
    ai: 'Của bài: gốc vi (12/18 chỗ); 5 trong 6 chỗ máy báo "khác" là máy đọc nhầm Fmaj7 (xem bậc 4).',
    coSo: 'Phần hát 2 bài; vi có ♭7 vang 16/23 đoạn (gồm cả mấy chỗ đọc nhầm).',
    nghe: { bai: [H(0, ''), H(9, 'm')], thay: [H(0, 'add9'), H(9, 'm7')] },
  }
  return {
    nguyenTac: [
      KHUNG_CP,
      MAU_CP,
      {
        y: 'Một chỗ anh đổi hẳn: I thành II13 ngay trước V',
        tom: 'Ở giọng trưởng anh theo bài gần như trọn (soát tay 13/22 chỗ máy báo khác: 11 là máy đọc lệch ký hiệu). Chỗ đổi thật duy nhất: nửa sau của I trước V thành II13 — kéo câu nhạc vào V.',
        bac: [0],
      },
    ],
    bac: { 0: [I, II13, I7], 4: [iii], 5: [IV], 7: [Vt], 9: [vi] },
  }
}

/*
  BLUES (7/10/2026): không có một thầy — nguồn là ba sheet (Ray Charles *Rockhouse* Sol trưởng · Robert Van *Slow Blues Impromptu* Đô
  trưởng · bản phối *House of the Rising Sun* Mi thứ, Songscription) và đoạn đàn mẫu của thầy Đức Thịnh (La thứ). Tách "ai chọn":
  khung 12 ô và hợp âm bảy trên I · IV · V là CỦA THỂ LOẠI; Rising Sun so với hợp âm phổ biến của bài như Linh Nhi, Cà Pháo
  (`scripts/phan_tich_blues_ba_sheet.py --pho-bien`: gốc 14/14 trùng, bản phổ biến toàn hợp âm ba); phần còn lại là của người chơi.
  Số đo: md Blues mục 2, 6, 7a, 7b, 7e; ký hiệu in đếm lại 7/10/2026 (Rockhouse 116, Robert 98 — bảng Robert ở md mục 2 là số cũ).
*/
function lyDoBlues(tonic: number, thu: boolean): LyDoThay {
  const { n, h } = nguCanh(tonic, thu)
  if (thu) {
    return {
      nguyenTac: [
        {
          y: 'Blues giọng thứ: gốc hợp âm là của bài — hợp âm bảy là của người phối',
          tom: 'Rising Sun: gốc 14/14 hợp âm trùng bản phổ biến (2 bản, toàn hợp âm ba); bản phối biến mọi hợp âm ngoài i thành hợp âm bảy. Thầy Đức Thịnh ở La thứ cũng bấm F7, E7♯9.',
          bac: [],
        },
        {
          y: 'Mỗi hợp âm bảy mang đúng một nốt ngoài gam thứ tự nhiên — có cái chính là nốt blue',
          tom: '♭7 của ♭VI7 là nốt blue ♭5; bậc 3 của V7 là cảm âm, ♯9 của nó là ♭7 tự nhiên — hai bậc 7 cùng vang; bậc 3 của IV7 là bậc 6 Dorian; ♭7 của III7 là ♭2.',
          bac: [8, 7, 5, 3],
        },
      ],
      bac: {
        0: [
          {
            y: 'i: của bài — hợp âm duy nhất không thành hợp âm bảy',
            giai: `Bản phối giữ ${h(0, 'm')} — chủ thứ là chỗ đứng yên của cả vòng, mọi hợp âm khác đều là hợp âm bảy. Màu: 11 (${n(5)}), ♭7 (${n(10)}), và nốt blue ♭5 (${n(6, 5)}) lướt trong câu rồi trượt nửa cung lên ${n(7)}.`,
            ai: 'Của bài: i ở cả 5 chỗ (bản phổ biến có). Của người phối: 11 vang 5/5 đơn vị i, ♭5 lướt 4/5.',
            coSo: 'Rising Sun — n rất nhỏ (5 đơn vị i). Nốt blue ♭5 đi tiếp lên 5: 77 % (n=13, md Blues 7b).',
          },
        ],
        3: [
          {
            y: 'III7: gốc của bài — hợp âm bảy của người phối',
            giai: `${h(3, '7')} thêm ${n(1)} — nốt ngoài gam thứ tự nhiên (♭2 của giọng). Bản phối biến mọi hợp âm ngoài i thành hợp âm bảy, nên đây là một lối nhất quán của người phối hơn là lý do riêng cho III; vì sao chọn đúng màu ấy ở III thì chưa rõ. Màu thêm: 9, 13.`,
            ai: 'Của bài: gốc III ở 3/3 chỗ. Của người phối: ♭7 — 0/2 bản phổ biến ghi III7.',
            coSo: 'Rising Sun: III có ♭7 · 9 · 13 ở 3/3 đơn vị (md Blues 7e).',
          },
        ],
        5: [
          {
            y: 'IV trưởng là của bài (Dorian) — IV7 của người phối',
            giai: `Ngay bản phổ biến đã ghi IV trưởng (${h(5, '')}): bậc 3 của nó là ${n(9)} — bậc 6 nâng (Dorian), sáng hơn iv của gam thứ tự nhiên. Người phối thêm ♭7 (${n(3)}) — ${n(3)} là ♭3 của giọng, nốt trong gam — nên IV7 chỉ thêm màu, không thêm nốt lạ.`,
            ai: 'Của bài: IV trưởng ở 2/2 chỗ. Của người phối: ♭7 — 0/2 bản ghi IV7.',
            coSo: 'Rising Sun — n nhỏ.',
          },
        ],
        7: [
          {
            y: 'V7♯9: V trưởng của bài — ♯9 của người phối, và của thầy Đức Thịnh',
            giai: `${h(7, '7#9')} chứa cả ${n(11, 7)} (bậc 3 của V — cảm âm) lẫn ${n(10)} (♯9 của V — chính bậc ♭7 tự nhiên của giọng): hai bậc 7 của gam thứ vang cùng lúc, cách nửa cung — tiếng chỏi ấy là "hợp âm blues". Vào V, nốt blue ♭5 (${n(6, 5)}) trượt nửa cung lên ${n(7)}; thầy Đức Thịnh đặt bước ấy ngay ở bass.`,
            ai: 'Của bài: V trưởng (bản phổ biến có ở 2/2 chỗ). Của người phối: ♭7 và ♯9 — ♯9 vang 3/3 đơn vị V7.',
            viDu: 'Thầy Đức Thịnh, đoạn đàn mẫu La thứ (video KN9JEiQXAHs, 02:42–03:50): E7♯9 bấm Sol3 – La♭3 – Rê4 (♯9 và bậc 3 cùng lúc); bass Mi♭2 → Mi2 vào V.',
            coSo: 'Rising Sun 3 đơn vị V7; đoạn video đọc bằng mắt từ bản máy chép, chưa đếm (md Blues mục 2).',
          },
        ],
        8: [
          {
            y: '♭VI7: ♭7 của ♭VI chính là nốt blue ♭5',
            giai: `${h(8, '7')} có ${n(6, 5)}: với ♭VI đó là ♭7, với giọng đó là nốt blue ♭5. Nên ♭VI7 → V7 là nốt blue đi nửa cung lên: ${n(6, 5)} → ${n(7)}, gốc của V. Như IV7 ở blues trưởng, hợp âm bảy ở đây là cách đưa nốt blue vào hòa âm.`,
            ai: 'Của bài: gốc ♭VI ở 2/2 chỗ. Của người phối: ♭7 — 0/2 bản ghi ♭VI7. Thầy Đức Thịnh cũng bấm F7 ở La thứ.',
            viDu: 'Thầy Đức Thịnh (La thứ): F7 bấm bè 3 – ♭7 (La3 – Mi♭4); vòng về ♭VI7 → V7(♯9) → i.',
            coSo: 'Rising Sun: ♭VI7 2 chỗ — n nhỏ. Đức Thịnh: đọc bằng mắt, chưa đếm.',
          },
        ],
      },
    }
  }

  return {
    nguyenTac: [
      {
        y: 'Khung 12 ô và hợp âm bảy trên I · IV · V là của thể loại — người chơi tô màu và chen hợp âm lướt',
        tom: 'Rockhouse: 5/9 vòng đi đúng khung I I I I · IV IV I I · V IV I I ở ô 1–10; ký hiệu hợp âm bảy trên I · IV · V 72/116. Phần riêng: màu 13 · 9 · ♯9 (Ray), ii – V và hợp âm lướt (Robert), cách quay vòng ở ô 11–12.',
        bac: [],
      },
      {
        y: 'Hợp âm bảy là cách đưa nốt blue vào hòa âm',
        tom: '♭7 của I là ♭7 blue của giọng; ♭7 của IV là ♭3 blue; ♯9 của V lại là ♭7 blue. Câu hát, câu chạy dùng nốt blue mà không chỏi — nốt blue đã là nốt của hợp âm.',
        bac: [0, 5, 7],
      },
      {
        y: 'Quay vòng bằng hợp âm lướt nửa cung',
        tom: 'Ray: I · IV · ♯IV · V ở ô 11–12 (bass đi nửa cung lên vào V); kết bằng ♭II7 → I13 (thay ba cung cho V7). Robert: ♭II7 → I, I → ♭III° → ii.',
        bac: [5, 7, 2],
      },
    ],
    bac: {
      0: [
        {
          y: 'I7 · I13: hợp âm bảy là của thể loại — 13 và ♭3 blue là của Ray',
          giai: `${h(0, '7')} có ${n(10)} — chính nốt blue ♭7 của giọng — nên chủ âm không đứng yên như hợp âm ba trưởng: nó mang sẵn tiếng blues, nghe như còn muốn đi tiếp. Ray tô I bằng 6/13 (${n(9)}) và để ${n(3)} — ♭3 blue, tức ♯9 của I — chen sát dưới ${n(4)}: hai nốt cách nửa cung cọ nhau, tiếng blues đặc trưng. Robert nhiều chỗ để I trơn hay Imaj7 — chỗ ấy nghe pop hơn blues.`,
          ai: 'Của thể loại: I7 (Ray ghi I7 ở 27/47 ký hiệu I). Của Ray: 6/13 vang ở 72 % đơn vị I (n=118), ♭3 blue 51 %. Của Robert: I trơn 21/35, Imaj7 4/35.',
          viDu: 'Rockhouse ô 113 → 115 (Sol trưởng): kết bằng I13(♯11) — tay phải Đô♯ – Fa – Si – Mi trên bass Sol.',
          coSo: 'md Blues mục 6, 7a, 7e; màu đếm theo nốt vang hai tay, có lẫn nốt giai điệu lướt. "Nghe như còn muốn đi tiếp" là lý thuyết.',
        },
      ],
      2: [
        {
          y: 'ii – V: của Robert — Ray không dùng ii',
          giai: `Robert chen ${h(2, 'm7')} trước ${h(7, '7')} — lối ii – V của jazz đặt vào khung blues — và nối I sang ii bằng ${h(3, 'dim')} lướt: bass ${n(4)} → ${n(3)} → ${n(2)} đi nửa cung xuống (I/3 → ♭III° → ii). Ray đi thẳng vào V, không qua ii: cùng thể loại, hai cách vào V.`,
          ai: 'Của Robert: ii 13/98 ký hiệu, ♭III° 8/98. Ray: 0/116 ký hiệu ii.',
          viDu: 'Robert (Đô trưởng): C/E → E♭dim → Dm7 (md Blues mục 6).',
          coSo: 'Ký hiệu in đếm lại 7/10/2026. Màu của ii (Robert): ♭7 53 %, 11 33 % (n=15 đơn vị).',
        },
      ],
      5: [
        {
          y: 'IV7 · IV9: hợp âm bảy là của thể loại — 9 là của Ray; ♯IV lướt ở chỗ quay vòng',
          giai: `${h(5, '7')} có ${n(3)}: với IV đó là ♭7, với giọng đó là nốt blue ♭3 — nên sang IV, câu chạy dùng ♭3 blue mà không chỏi. Ray tô IV bằng 9 (${n(7)}) — bậc 5 của giọng, nốt chung với I — nên I → IV9 tầng trên gần như đứng yên. Ở ô 11–12, Ray đi I · IV · ♯IV · V: bass ${n(5)} → ${n(6, 4)} → ${n(7)} bước nửa cung lên vào V.`,
          ai: 'Của thể loại: IV7 (Ray 20/32 ký hiệu IV, Robert 15/20). Của Ray: 9 vang 74 % đơn vị IV (n=47), 13 55 %.',
          viDu: 'Rockhouse ô 11–12 của vòng 12 ô (Sol trưởng): G → C → C♯ → D.',
          coSo: 'md Blues mục 2, 7e.',
        },
      ],
      7: [
        {
          y: 'V7: của thể loại — V lùi về IV trước khi về I; ♭II7 thay V ở chỗ kết',
          giai: `Ở ô 9 – 11, khung đi ${h(7, '7')} → ${h(5, '7')} → ${h(0, '7')}: V không giải thẳng về I mà lùi về IV rồi mới về — câu B của khung hỏi – đáp. Màu của V: 9, 11, và ♯9 (${n(10)}) — chính nốt blue ♭7 của giọng đặt trên V. Ở đuôi kết, Ray thay V7 bằng ${h(1, '7')}: hai hợp âm chung cặp nốt ba cung ${n(11)} – ${n(5)} (bậc 3 và ♭7 của cả hai), nên vẫn kéo về I, mà bass trượt nửa cung ${n(1)} → ${n(0)}.`,
          ai: 'Của thể loại: V7 (Ray 25/29 ký hiệu V); Ray đi V → IV 16 %, IV → V 5 % số bước (n=63). Của Ray: ♯9 vang 45 % đơn vị V (n=22), ♭II7 ở đuôi kết. Của Robert: ♭II7 → I, 5/98 ký hiệu.',
          viDu: 'Rockhouse ô 113 → 115 (Sol trưởng): bass Rê · Mi♭ · La♭, tay phải A♭7 (Sol♭ – Đô – Mi♭), rơi nửa cung về G13(♯11).',
          coSo: 'md Blues mục 6, 7a, 7e. "Câu B của khung hỏi – đáp": md mục 6 (Ray giữ nhịp câu A khi sang IV, đổi hẳn chất liệu ở ô 9).',
        },
      ],
    },
  }
}
