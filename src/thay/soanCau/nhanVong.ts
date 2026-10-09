import type { ParsedChord } from '../../reharm/types'
import type { Hop } from './giaiThich'

/*
  NHẬN VÒNG PHỔ BIẾN — người dùng 9/10/2026: "Hãy phân tích các vòng hợp âm trong các sheet của từng thầy rồi cố gắng tổng hợp lại xem
  nó là vòng nào trong các vòng hợp âm phổ biến trong âm nhạc", và ở trang Tái hòa âm: "phân tích và cô đọng hợp âm lại xem chúng thuộc
  vòng nào trong các vòng hòa thanh". Một bộ nhận dùng chung: chuỗi hợp âm (đã gộp hợp âm lặp liền nhau) → các khúc khớp vòng mẫu,
  không chồng nhau, chọn sao cho phủ nhiều hợp âm nhất (xem `nhanVong`).
  Khớp theo GỐC (nửa cung so với chủ âm) và HỌ chất: trưởng (gồm át, maj7) · thứ · giảm (gồm nửa giảm) · tăng; sus khớp cả trưởng lẫn
  thứ; bậc mẫu "giảm" nhận cả thứ (ii° hay ii đều là bậc 2 chuẩn bị cho V); "?" = chất nào cũng được.
  Vòng viết cho giọng trưởng vẫn nhận trong bài giọng thứ qua GIỌNG SONG SONG (và ngược lại): ♭VI–♭VII–v–i ở La thứ (F–G–Em–Am)
  chính là IV–V–iii–vi của Đô trưởng.
  Chuỗi quãng 5 nhận riêng, không cần mẫu: mỗi gốc rơi một quãng năm xuống gốc sau (cả bước IV → vii° trong gam, ở giọng thứ là
  ♭VI → ii°); cho chen MỘT hợp âm lạ nếu chuỗi đi tiếp được sau nó. Chuỗi phải dài từ 4 hợp âm, hoặc 3 hợp âm về chủ âm.
  Lời "nghe ra sao" của từng vòng là kiến thức chung, Claude viết — KHÔNG phải số đo; ví dụ bài nổi tiếng cũng là kiến thức chung.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

/** Họ chất của bậc mẫu: T trưởng · t thứ · g giảm · a tăng · * bất kỳ. */
type Ho = 'T' | 't' | 'g' | 'a' | '*'

export interface MauVong {
  id: string
  ten: string
  /**
   * Bậc La Mã: chữ hoa trưởng, chữ thường thứ, ° giảm, ø nửa giảm, + tăng, đuôi 7 / maj7 (chỉ để đánh theo — khớp không xét), đuôi ? =
   * chất nào cũng được (đánh theo thì lấy chất theo chữ hoa / thường). ♭ / ♯ đứng trước.
   */
  bac: readonly string[]
  /** Bậc tính từ chủ âm giọng thứ. */
  thu: boolean
  /** Vòng lặp — nhận cả khi bắt đầu từ bậc giữa (xoay vòng). */
  lap: boolean
  /** Nghe ra sao, hay gặp ở đâu — lời Claude, kiến thức chung. */
  nghe: string
}

export const MAU_VONG: readonly MauVong[] = [
  {
    id: 'truc',
    ten: 'Vòng trục I–V–vi–IV',
    bac: ['I', 'V', 'vi', 'IV'],
    thu: false,
    lap: true,
    nghe: 'Bốn hợp âm xoay mãi không mỏi: I sáng, V mở ra, vi chùng xuống, IV đỡ lên để quay về. Vòng pop phổ biến nhất (Let It Be, Someone Like You). Bắt đầu từ vi — vi–IV–I–V, ở giọng thứ là i–♭VI–♭III–♭VII — thì man mác, buồn mà vẫn trôi.',
  },
  {
    id: 'nam-50',
    ten: 'Vòng thập niên 50 I–vi–IV–V',
    bac: ['I', 'vi', 'IV', 'V'],
    thu: false,
    lap: true,
    nghe: 'Vòng doo-wop: I sang vi như mây che nắng, IV rồi V đẩy dần lên để rơi về I. Hoài niệm, ngọt, hiền (Stand by Me).',
  },
  {
    id: '1625',
    ten: 'Vòng 1–6–2–5',
    bac: ['I', 'vi?', 'ii?', 'V'],
    thu: false,
    lap: true,
    nghe: 'Vòng quay đầu của jazz và nhạc tiền chiến: từ vi, ba bước quãng năm vi → ii → V → I kéo nhau về như mắt xích. Đổi vi, ii thành VI7, II7 (át phụ) thì sáng và "ragtime" hơn. Hay dùng để nối cuối câu về đầu câu.',
  },
  {
    id: 'canon',
    ten: 'Vòng Canon',
    bac: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    thu: false,
    lap: true,
    nghe: 'Vòng của Canon in D (Pachelbel), nền của vô số bản ballad. Gốc đi 1–5–6–3–4–1–4–5; đảo V thành V/7, iii thành iii/5 thì bass bước xuống liền từng bậc — trang trọng, êm, như bậc thang đi xuống chậm.',
  },
  {
    id: 'canon-nua',
    ten: 'Nửa đầu vòng Canon I–V–vi–iii',
    bac: ['I', 'V', 'vi', 'iii'],
    thu: false,
    lap: false,
    nghe: 'Bốn hợp âm mở đầu vòng Canon; đảo cho bass đi 1 → 7 → 6 → 5 thì dịu và có chất kể chuyện — mở câu ballad rất hay.',
  },
  {
    id: 'royal',
    ten: 'Vòng Royal Road IV–V–iii–vi',
    bac: ['IV', 'V', 'iii', 'vi'],
    thu: false,
    lap: true,
    nghe: 'Vòng "vương đạo" của nhạc Nhật: IV–V dâng lên đầy hy vọng rồi rẽ vào iii–vi thay vì về I — cảm xúc dâng mà không chịu khép, day dứt. Ở bài giọng thứ, nó là ♭VI–♭VII–v–i.',
  },
  {
    id: 'just-two',
    ten: 'Vòng Just the Two of Us IV–III7–vi',
    bac: ['IV', 'III7', 'vi'],
    thu: false,
    lap: false,
    nghe: 'IV sang III7 (át của vi) rồi vào vi: III7 mang nốt dẫn lên gốc vi, nghe ấm, quyến rũ, chất R&B và city pop — vòng của Just the Two of Us.',
  },
  {
    id: 'ba-chinh',
    ten: 'Ba hợp âm chính I–IV–V',
    bac: ['I', 'IV', 'V'],
    thu: false,
    lap: true,
    nghe: 'Ba trụ của giọng: chủ – hạ át – át. Mộc, chắc — dân ca, rock and roll, blues; mọi nốt trong gam đều đặt được lên ba hợp âm này.',
  },
  {
    id: 'ba-chinh-thu',
    ten: 'Ba hợp âm chính giọng thứ i–iv–V',
    bac: ['i', 'iv', 'V?'],
    thu: true,
    lap: true,
    nghe: 'Ba trụ giọng thứ: i – iv – V (V trưởng nhờ bậc 7 nâng, có nốt dẫn về chủ âm). Buồn mà chắc — nhạc Nga, bolero.',
  },
  {
    id: 'ii-v-i',
    ten: 'ii–V–I',
    bac: ['ii7', 'V7', 'Imaj7'],
    thu: false,
    lap: false,
    nghe: 'Câu kết chuẩn của jazz: ii chuẩn bị, V căng, I giải quyết — hai bước quãng năm. Mềm và tròn hơn V–I trơn.',
  },
  {
    id: 'ii-v-i-thu',
    ten: 'ii°–V–i',
    bac: ['iiø7', 'V7', 'i'],
    thu: true,
    lap: false,
    nghe: 'Kết giọng thứ: ii° (nửa giảm) tối và lưng chừng, V7 kéo mạnh bằng nốt dẫn, rồi về i — đau, kịch tính (bolero, tango, jazz giọng thứ).',
  },
  {
    id: 'andalusia',
    ten: 'Vòng Andalusian i–♭VII–♭VI–V',
    bac: ['i', '♭VII', '♭VI', 'V?'],
    thu: true,
    lap: false,
    nghe: 'Bass đi xuống bốn bậc 1–♭7–♭6–5 kiểu flamenco: từ i trôi xuống V trưởng rồi lặp lại — định mệnh, nồng nàn (Hit the Road Jack).',
  },
  {
    id: 'aeolian',
    ten: 'Kết Aeolian ♭VI–♭VII–i',
    bac: ['♭VI', '♭VII', 'i'],
    thu: true,
    lap: false,
    nghe: '♭VI–♭VII bước lên liền bậc rồi vào i — không có nốt dẫn nên về nhà bằng sức đẩy chứ không phải lực kéo: hùng, buồn mà kiêu; rất hay gặp ở ballad, rock, nhạc phim. Ở bài giọng trưởng, nó là IV–V–vi.',
  },
  {
    id: 'rising-sun',
    ten: 'Vòng House of the Rising Sun i–♭III–IV–♭VI',
    bac: ['i', '♭III', 'IV', '♭VI'],
    thu: true,
    lap: false,
    nghe: 'IV trưởng trong giọng thứ (màu Dorian) làm vòng sáng lên một thoáng rồi ♭VI kéo tối lại — u uất, kể chuyện (The House of the Rising Sun).',
  },
  {
    id: 'quay-dau-giam',
    ten: 'Quay đầu I–♭iii°–ii–V',
    bac: ['I', '♭iii°7', 'ii7', 'V7'],
    thu: false,
    lap: false,
    nghe: 'Từ I chen hợp âm giảm ♭iii° rồi trượt nửa cung xuống ii, sang V về I — bass 1 → ♭3 → 2 → 5. Sang, cổ, chất phòng trà; hay gặp ở cuối câu blues chậm và jazz.',
  },
  {
    id: 'blues-12',
    ten: 'Khung 12 ô blues (gộp ô lặp)',
    bac: ['I7', 'IV7', 'I7', 'V7', 'IV7', 'I7'],
    thu: false,
    lap: false,
    nghe: 'I bốn ô – IV hai ô – I hai ô – V – IV – I: ba dòng hỏi – nhắc – đáp của blues. Ba hợp âm đều là bảy át, nên không hợp âm nào "đứng yên" — cái lửng lơ đặc trưng của blues.',
  },
]

/** Chuỗi quãng 5 — nhận không cần mẫu. */
export const QUANG_5 = {
  id: 'quang-5',
  nghe: 'Mỗi gốc rơi một quãng năm xuống gốc sau — chuyển động bass mạnh nhất; hợp âm nào cũng như V của hợp âm sau nên vòng cứ thế cuốn đi. Trọn vòng 7 bậc trong gam là vòng quãng 5 (Fly Me to the Moon, Autumn Leaves, I Will Survive).',
} as const

const LA_MA: Record<string, number> = { i: 0, ii: 2, iii: 4, iv: 5, v: 7, vi: 9, vii: 11 }
const BAC_RE = /^([♭♯]?)(vii|vi|v|iv|iii|ii|i)(ø|°|\+)?(maj7|7)?(\?)?$/i

/** Một bậc mẫu → gốc (nửa cung so với chủ âm), họ để khớp, và hợp âm để đánh theo. */
export function docBacMau(t: string): { goc: number; ho: Ho; hop: Hop } {
  const m = BAC_RE.exec(t)
  if (!m) throw new Error(`bậc mẫu lạ: ${t}`)
  const [, dau, so, kieu, duoi, bat] = m
  const goc = pc(LA_MA[so!.toLowerCase()]! + (dau === '♭' ? -1 : dau === '♯' ? 1 : 0))
  const hoa = so === so!.toUpperCase()
  const ho: Ho = bat ? '*' : kieu === '°' || kieu === 'ø' ? 'g' : kieu === '+' ? 'a' : hoa ? 'T' : 't'
  const chat =
    kieu === 'ø'
      ? 'm7b5'
      : kieu === '°'
        ? duoi
          ? 'dim7'
          : 'dim'
        : kieu === '+'
          ? 'aug'
          : hoa
            ? (duoi ?? '')
            : duoi
              ? 'm7'
              : 'm'
  return { goc, ho, hop: { goc, chat } }
}

/** Họ chất của một hợp âm — "s" là sus (khớp cả trưởng lẫn thứ). */
export function hoCua(chat: string): 'T' | 't' | 'g' | 'a' | 's' {
  if (/sus/.test(chat)) return 's'
  if (chat === 'dim' || chat === 'dim7' || chat.startsWith('m7b5')) return 'g'
  if (chat === 'aug') return 'a'
  return chat.startsWith('m') && !chat.startsWith('maj') ? 't' : 'T'
}

const khopHo = (h: ReturnType<typeof hoCua>, mau: Ho) =>
  mau === '*' || h === mau || (h === 's' && (mau === 'T' || mau === 't')) || (mau === 'g' && h === 't')

export interface KhucVong {
  /** id mẫu, hay `quang-5`. */
  id: string
  ten: string
  nghe: string
  /** Chỉ số hợp âm đầu và cuối (gồm cả hai) trong chuỗi. */
  tu: number
  den: number
  /** Vòng lặp bắt đầu từ bậc thứ `xoay` của mẫu (0 = đúng đầu mẫu). */
  xoay: number
  /** Khớp qua giọng song song (vòng giọng trưởng trong bài thứ, hay ngược lại). */
  songSong: boolean
  /** Chỉ số hợp âm chen giữa chuỗi quãng 5. */
  chen: number[]
}

/** Bước quãng năm xuống (lên quãng bốn); thêm bước IV → vii° trong gam (giọng thứ: ♭VI → ii°). */
const buoc5 = (a: Hop, b: Hop, thu: boolean) => {
  const d = pc(b.goc - a.goc)
  return d === 5 || (d === 6 && a.goc === (thu ? 8 : 5))
}

/**
 * Nhận các vòng phổ biến trong chuỗi `hop` (gốc tính từ chủ âm; hợp âm lặp liền nhau nên gộp trước). Trả các khúc không chồng nhau,
 * xếp theo vị trí. Chọn bằng quy hoạch động: phủ được NHIỀU hợp âm nhất; bằng nhau thì ÍT khúc hơn (khúc dài); rồi mẫu có tên trước
 * chuỗi quãng 5, cùng giọng trước giọng song song, đúng đầu mẫu trước xoay vòng; cuối cùng khúc bắt đầu từ chủ âm. Vòng lặp kéo dài chừng nào chuỗi còn đi tiếp vòng ấy.
 * Trước (9/10/2026, commit 4ee3fd8) chọn tham "khúc dài trước" — chạy thử trang Tái hòa âm thấy F–G–Em–Am–Dm–G–C ra chuỗi quãng 5
 * Em…C, bỏ trơ F–G (đúng: Royal Road + ii–V–I), và Am–F–C–G ×2 chỉ nhận khúc C–G–Am–F ở giữa. Triệu chứng nếu lùi: hai lỗi ấy quay lại.
 */
export function nhanVong(hop: readonly Hop[], thu: boolean): KhucVong[] {
  const n = hop.length
  type UngVien = KhucVong & { uu: number }
  const ung: UngVien[] = []
  const khop = (k: number, b: ReturnType<typeof docBacMau>, lech: number) => pc(hop[k]!.goc - lech) === b.goc && khopHo(hoCua(hop[k]!.chat), b.ho)
  for (const mau of MAU_VONG) {
    const bac = mau.bac.map(docBacMau)
    const m = bac.length
    for (const songSong of [false, true]) {
      // Mẫu cùng hệ giọng với bài: khớp thẳng. Khác hệ: chủ âm của mẫu là chủ âm giọng song song (bài thứ +3, bài trưởng +9).
      const lech = mau.thu === thu ? (songSong ? null : 0) : songSong ? (thu ? 3 : 9) : null
      if (lech === null) continue
      for (let xoay = 0; xoay < (mau.lap ? m : 1); xoay++)
        for (let i = 0; i + m <= n; i++) {
          let dai = 0
          while (i + dai < n && (mau.lap || dai < m) && khop(i + dai, bac[(xoay + dai) % m]!, lech)) dai++
          for (let d = m; d <= dai; d++)
            ung.push({ id: mau.id, ten: mau.ten, nghe: mau.nghe, tu: i, den: i + d - 1, xoay, songSong, chen: [], uu: (songSong ? 2 : 0) + (xoay ? 1 : 0) })
        }
    }
  }
  for (let i = 0; i < n; i++) {
    const chen: number[] = []
    let j = i
    let so = 1
    for (;;) {
      if (j + 1 < n && buoc5(hop[j]!, hop[j + 1]!, thu)) j += 1
      else if (!chen.length && j + 2 < n && buoc5(hop[j]!, hop[j + 2]!, thu)) {
        chen.push(j + 1)
        j += 2
      } else break
      so++
      // Chuỗi 3 hợp âm chỉ nhận khi về chủ âm (II–V–I: át của át) — "V–I–IV" ở đâu cũng có, đếm thì loãng.
      if (so >= 4 || (so === 3 && !chen.length && hop[j]!.goc === 0))
        ung.push({ id: QUANG_5.id, ten: `Chuỗi quãng 5 — ${so} hợp âm`, nghe: QUANG_5.nghe, tu: i, den: j, xoay: 0, songSong: false, chen: [...chen], uu: 4 })
    }
  }
  /* Điểm một khúc, bốn tầng không lấn nhau (chuỗi tới 1 000 hợp âm): phủ × 1e9 − 1e5 mỗi khúc − ưu × 10 − 1 nếu không bắt đầu từ chủ âm.
     Tầng cuối phân xử hai cách phủ bằng nhau: verse Người Hãy Quên Em Đi phải là hai lượt i…V, không phải i…♭VI + ii°…V. */
  const diem = (k: UngVien) => (k.den - k.tu + 1 - k.chen.length) * 1e9 - 1e5 - k.uu * 10 - (hop[k.tu]!.goc === 0 ? 0 : 1)
  const theoCuoi = new Map<number, UngVien[]>()
  for (const k of ung) theoCuoi.set(k.den, [...(theoCuoi.get(k.den) ?? []), k])
  const tot = new Array<number>(n + 1).fill(0)
  const chon = new Array<UngVien | null>(n + 1).fill(null)
  for (let e = 1; e <= n; e++) {
    tot[e] = tot[e - 1]!
    for (const k of theoCuoi.get(e - 1) ?? []) {
      const v = tot[k.tu]! + diem(k)
      if (v > tot[e]!) {
        tot[e] = v
        chon[e] = k
      }
    }
  }
  const ra: KhucVong[] = []
  for (let e = n; e > 0; ) {
    const k = chon[e]
    if (!k) {
      e--
      continue
    }
    ra.push({ id: k.id, ten: k.ten, nghe: k.nghe, tu: k.tu, den: k.den, xoay: k.xoay, songSong: k.songSong, chen: k.chen })
    e = k.tu
  }
  return ra.reverse()
}

/** Một khúc nhận ra, đọc thành lời: tên vòng · bắt đầu từ bậc nào · lặp mấy vòng · qua giọng song song · chen gì. `ten(j)` = tên hợp âm thứ j. */
export function moTaKhuc(k: KhucVong, ten: (j: number) => string, songSong: string): string {
  const mau = MAU_VONG.find((m) => m.id === k.id)
  const phan = [k.ten]
  if (mau && k.xoay) phan.push(`bắt đầu từ ${mau.bac[k.xoay]!.replace('?', '')}`)
  const dai = k.den - k.tu + 1
  if (mau?.lap && dai > mau.bac.length) phan.push(`lặp ${Math.floor(dai / mau.bac.length)} vòng${dai % mau.bac.length ? ` và ${dai % mau.bac.length} hợp âm` : ''}`)
  if (k.songSong) phan.push(`qua giọng song song ${songSong}`)
  if (k.chen.length) phan.push(`chen ${k.chen.map(ten).join(', ')}`)
  return phan.join(' · ')
}

/** Vòng mẫu → chuỗi hợp âm để đánh theo (gốc tính từ chủ âm của giọng mẫu). */
export const hopCuaMau = (mau: MauVong): Hop[] => mau.bac.map((b) => docBacMau(b).hop)

/* ---------------- Vòng trong sheet các thầy (`tools/vong_trong_sheet.py` → vongSheet.json) ---------------- */

export interface DoanSheet {
  ten: string
  /** [gốc tính từ chủ âm, chất] — hợp âm lặp liền nhau đã gộp. */
  hop: [number, string][]
  /** Số đoạn có chuỗi y hệt (gộp làm một). */
  lan: number
  cung: string[]
}
export interface BaiSheet {
  bai: string
  tonic: number
  thu: boolean
  giong: string
  /** Giọng suy (sheet không ghi bộ khóa). */
  suy: boolean
  doan: DoanSheet[]
  so_o?: number
  /** Khung 12 ô blues tìm thấy (đo theo ô nhịp — chỉ Blues). */
  khung12?: { o: number; kieu: string; khop: number }[]
}

export const hopDoan = (d: DoanSheet): Hop[] => d.hop.map(([goc, chat]) => ({ goc, chat }))

/** Tổng hợp một thầy: mỗi vòng có trong bao nhiêu đoạn (đoạn lặp y hệt tính một), bao nhiêu lần; phủ = số hợp âm nằm trong khúc nhận ra. */
export function tongHop(ds: readonly BaiSheet[]) {
  let soDoan = 0
  let soHop = 0
  let phu = 0
  const dem = new Map<string, { id: string; ten: string; doan: number; lan: number }>()
  for (const b of ds)
    for (const d of b.doan) {
      const hop = hopDoan(d)
      const kq = nhanVong(hop, b.thu)
      soDoan++
      soHop += hop.length
      phu += kq.reduce((s, k) => s + k.den - k.tu + 1 - k.chen.length, 0)
      for (const id of new Set(kq.map((k) => k.id))) {
        const x = dem.get(id) ?? { id, ten: id === QUANG_5.id ? 'Chuỗi quãng 5' : MAU_VONG.find((m) => m.id === id)!.ten, doan: 0, lan: 0 }
        x.doan++
        x.lan += kq.filter((k) => k.id === id).length
        dem.set(id, x)
      }
    }
  return { soDoan, soHop, phu, theoMau: [...dem.values()].sort((a, b) => b.doan - a.doan || b.lan - a.lan) }
}

const LA_MA_TEN = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII']
/** Bậc La Mã của một hợp âm (gốc tính từ chủ âm): chữ thường thứ / giảm, ° giảm, ø nửa giảm, + tăng, đuôi 7 · sus. */
export function laMa(x: Hop): string {
  const h = hoCua(x.chat)
  const r = LA_MA_TEN[pc(x.goc)]!
  const dau = x.chat.startsWith('m7b5') ? 'ø' : h === 'g' ? '°' : h === 'a' ? '+' : ''
  return (h === 't' || h === 'g' ? r.toLowerCase() : r) + dau + (/sus/.test(x.chat) ? 'sus' : /7/.test(x.chat) && dau !== 'ø' ? '7' : '')
}

/**
 * Đọc kết quả từng thầy — lời Claude đọc từ số đo của `tongHop` trên vongSheet.json (9/10/2026, viết lại sau khi đổi sang phủ tối ưu —
 * số cũ của commit 4ee3fd8: LN 155/605, CP 175/380, Aeolian 9/29); mọi con số trong lời có test giữ
 * (nhanVong.test.ts) — số đo đổi thì test hỏng, phải viết lại lời. Chỗ "nghe ra sao" là cảm nhận của Claude, không phải số đo.
 */
export const LOI_TONG_HOP: Readonly<Record<'linh-nhi' | 'ca-phao' | 'blues', string>> = {
  'linh-nhi':
    'Linh Nhi không bám một vòng pop nào: chỉ 164/605 hợp âm (27%) rơi vào một vòng có tên — phần còn lại là hòa âm đi theo giai điệu, câu nào tính câu nấy. Hay gặp nhất là ba trụ i–iv–V (11/35 đoạn) và lực kéo quãng 5 (chuỗi quãng 5: 10/35 đoạn), rõ nhất là đuôi kết giọng thứ ♭VI–ii°–V–i (Dung Xa Em Đêm Nay, Một Cõi Đi Về) — nửa sau của vòng quãng 5 giọng thứ: ♭VI mở ra, ii° chênh vênh, V kéo, i đóng lại. Bài trưởng thì về bằng vòng 1–6–2–5 (8/35 đoạn, chủ yếu ở Đường Xưa Lối Cũ, Mùa Xuân Đầu Tiên, Biển Tình; Mùa Xuân có khi đổi ii thành II át phụ cho sáng hơn); điệp khúc Đường Xưa xoay quanh vi: IV–III7–vi (vòng Just the Two of Us) xen vi–ii–III (i–iv–V của giọng song song La thứ). Muốn đánh ra chất Linh Nhi: luyện ♭VI–ii°–V–i ở giọng thứ, I–vi–ii–V ở giọng trưởng.',
  'ca-phao':
    'Cà Pháo dựa vào vòng có tên nhiều hơn hẳn: 189/380 hợp âm (50%). Dấu tay rõ nhất là kết Aeolian ♭VI–♭VII–i (8/29 đoạn, 12 lần — Để Em Rời Xa, Chưa Bao Giờ, Chúng Ta Không Thuộc Về Nhau): về chủ âm bằng hai bậc bước lên, không qua V, nên câu kết hùng mà không cũ. Người Hãy Quên Em Đi thì đi vòng quãng 5 giọng thứ i–iv–♭VII–♭III–♭VI–ii°–V (vòng của Fly Me to the Moon): verse là hai lượt vòng ấy, lượt nào cũng chen iv sau ♭VI, lượt sau đổi ii° thành II át phụ. Chưa Bao Giờ có Royal Road thật ở prechorus (♭VI–♭VII–v–i). Bài trưởng: 1–6–2–5 và nửa đầu vòng Canon (Ngày Mai Em Đi). Muốn đánh ra chất Cà Pháo: luyện ♭VI–♭VII–i và vòng quãng 5 giọng thứ.',
  blues:
    'Blues đứng trên ba hợp âm I–IV–V (2/3 bài, 10 lần), cả ba đều là hợp âm bảy át. Khung 12 ô đo theo ô nhịp: Rockhouse có 2 khung sạch trong 120 ô (ô 32–43 khớp 12/12; ô 44–55 khớp 11/12), phần còn lại Ray Charles đi lệch khung (lệch ra sao — chưa đo); Robert không có khung nào khớp từ 11/12 (bài ứng tác, tốt nhất 9/12). Lối riêng của Robert là quay đầu I–♭iii°–ii–V (3 lần): hợp âm giảm trượt nửa cung xuống ii — sang và cổ. Rising Sun là đúng vòng i–♭III–IV–♭VI của nó (2 lần).',
}

/**
 * Cô đọng hợp âm (trang Tái hòa âm) để nhận vòng: hợp âm lướt bỏ ra, hợp âm liền nhau cùng gốc cùng họ chất gộp một (Am7 → Am9 là một
 * hợp âm; sus gộp với hợp âm cùng gốc bên cạnh), gốc tính từ chủ âm. Giữ tên hợp âm đầu của mỗi nhóm để hiện.
 */
export function coDong(chords: readonly ParsedChord[], tonic: number): { ten: string; hop: Hop }[] {
  const ra: { ten: string; hop: Hop }[] = []
  for (const c of chords) {
    if (c.passing) continue
    const goc = pc(c.root - tonic)
    const hop: Hop = c.bass === undefined ? { goc, chat: c.quality.symbol } : { goc, chat: c.quality.symbol, bass: pc(c.bass - tonic) }
    const cuoi = ra[ra.length - 1]
    const [h0, h1] = [hoCua(cuoi?.hop.chat ?? ''), hoCua(hop.chat)]
    // sus là trang trí của chính bậc ấy (V7sus4 → V7) — cùng gốc thì gộp với hợp âm bên cạnh
    if (cuoi && cuoi.hop.goc === goc && (h0 === h1 || h0 === 's' || h1 === 's')) continue
    ra.push({ ten: c.symbol, hop })
  }
  return ra
}
