import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import { SCALE_FAMILIES } from './phraseScale'

/*
  CÂU LICK / RUN BLUES ĐỨC THỊNH — biên soạn theo lý thuyết Blues phổ thông, KHÔNG phải đo từ sheet
  hay video của thầy. Thầy Đức Thịnh chỉ để lại đúng MỘT sự thật đã kiểm bằng tai (PianoBrain
  `duc-thinh-not-blues-la-bac-5-giang`, video kOwriZhpo6Y 10:07-10:28): nốt Blues là bậc 5 giáng.
  Sáu câu dưới đây dựng trên sự thật ấy cộng lý thuyết Blues phổ thông đã có sẵn trong
  `Reference/pianoimprovnotes.md` (gam Blues mục 1.2, kỹ thuật nối/tô màu mục 3.2, cách kết câu ở
  nốt ổn định mục 4) — mỗi câu ghi rõ lấy từ quy tắc nào, không suy từ sheet của ai.

  Đây là bộ soạn có CHỦ Ý (danh sách cố định, chọn theo lượt), không phải chạy gam ngẫu nhiên: đúng
  tinh thần "câu solo phải soạn, không sinh xúc xắc" đã áp cho Linh Nhi. Khác Linh Nhi ở chỗ vật liệu
  là lý thuyết Blues phổ thông, không phải nốt đo được từ sheet của một nghệ sĩ — người dùng đã chọn
  hướng này (\"hướng A\") sau khi biết khoá học Blues trên máy không đủ để soạn kiểu \"đo từ sheet\".

  Đơn vị phách: PHÁCH THẬT của điệu (như `chayLinhNhi`), không phải beat thô của RhythmCell — một ô
  6/8 ở đây dài 3 phách thật (`gridUnit` 0.5 × 6 tiếng). Mỗi "tiếng" (móc đơn) = 0,5 phách thật.
*/

const BLUES_STEPS = SCALE_FAMILIES[0]!.steps // [0, 3, 5, 6, 7, 10] — gốc · b3 · 4 · b5 (nốt xanh) · 5 · b7
const O = 3
const TAM_GIUA = 76 // tâm quãng tay phải — cùng mốc chayLinhNhi dùng cho câu chạy slow rock.

/** Một nốt trong lick: lùi mấy phách so với `endBeat`, ngân bao lâu, cách gốc mấy nửa cung. */
type NotLick = readonly [lui: number, truongDo: number, nuaCung: number]

interface BlueLick {
  ten: string
  /** Hợp âm làm gốc cho các nốt — mặc định 'cur'; nốt hạ cánh cuối lick có thể đổi sang 'next'. */
  goc: 'cur' | 'next'
  hanCanhTheoNext?: boolean
  not: readonly NotLick[]
}

/*
  Sáu câu, mỗi câu nêu rõ lấy từ quy tắc nào:
*/
const CAC_LICK: readonly BlueLick[] = [
  {
    // Đúng nguyên văn thầy: nhấn bậc 5 giáng (nốt Blues) rồi giải quyết lên bậc 5 đúng — cử chỉ
    // tĩnh trên hợp âm đang vang, không cần đổi hợp âm.
    ten: 'Nốt xanh vào bậc 5',
    goc: 'cur',
    not: [[0.5, 0.125, 6], [0.375, 0.375, 7]],
  },
  {
    // Turnaround kinh điển: chạy móc đơn đều đi xuống b7-5-b3, đáp vào gốc hợp âm SAU — đúng
    // "run xuống, kết ở nốt ổn định" (pianoimprovnotes mục 4) và là hình turnaround phổ biến nhất.
    ten: 'Turnaround xuống b7-5-b3-gốc',
    goc: 'cur',
    hanCanhTheoNext: true,
    not: [[1.5, 0.5, 10], [1, 0.5, 7], [0.5, 0.5, 3], [0, 0.5, 0]],
  },
  {
    // Bước 1 "Groove" của khung 6 bước (mục 3.3): lặp một nốt gốc giữ nhịp, rồi "response" ba nốt
    // ngũ cung thứ đi lên, kết ở bậc 5 — nốt ổn định.
    ten: 'Groove rồi rải lên bậc 5',
    goc: 'cur',
    not: [[2, 0.5, 0], [1.5, 0.5, 0], [1, 0.5, 3], [0.5, 0.5, 5], [0, 0.5, 7]],
  },
  {
    // Vòng đặc trưng Blues: b3-4-b5-5 rồi lượn về b3 — dùng trọn bốn nốt của thang Blues quanh
    // quãng bốn/năm, đúng "nhấn bậc 5 giáng rồi giải quyết" nhưng đi cả hai chiều.
    ten: 'Vòng b3-4-b5-5-b3',
    goc: 'cur',
    not: [[2, 0.5, 3], [1.5, 0.5, 5], [1, 0.25, 6], [0.75, 0.25, 7], [0.5, 0.5, 3]],
  },
  {
    // Rải hợp âm bảy (mục 3.1 chord-tone soloing: 1-3-5-b7) rồi chen nốt xanh lúc đi xuống — đúng
    // gợi ý mục 3.2 "kết hợp rải hợp âm với chuyển động chromatic".
    ten: 'Rải hợp âm bảy chen nốt xanh',
    goc: 'cur',
    not: [[2, 0.5, 0], [1.5, 0.5, 4], [1, 0.5, 7], [0.5, 0.5, 6], [0, 0.5, 0]],
  },
  {
    // Approach chromatic vào bậc 3 hợp âm sau (mục 3.2: "nốt nối nửa cung dưới nốt đích") — câu kết
    // ngắn, hai nốt, dùng ở chỗ chuyển hợp âm gấp.
    ten: 'Approach nửa cung vào bậc 3 hợp âm sau',
    goc: 'cur',
    hanCanhTheoNext: true,
    not: [[0.5, 0.5, 10], [0, 0.5, 4]],
  },
]

/** Quãng tám của `n` (pitch class + nửa cung) nằm gần `gan` nhất. */
const ganNhat = (n: number, gan: number): number => {
  let best = ((n % 12) + 12) % 12 + 60
  while (best < gan - 6) best += 12
  while (best > gan + 6) best -= 12
  return best
}

/**
 * Một câu lick Blues Đức Thịnh, đáp đúng `endBeat`. `null` khi ô quá ngắn cho mọi câu trong sổ.
 * Cùng chữ ký với `linhRun` (xem `chayLinhNhi`) để cắm thẳng vào `generateFillLine`.
 *
 * Cao độ: nốt đầu đặt gần `TAM_GIUA`; mỗi nốt sau đặt ở quãng tám gần nốt TRƯỚC nó nhất — giữ hình
 * quãng của lick chứ không để mỗi nốt tự nhảy quãng tám riêng. Nốt hạ cánh dùng gốc hợp âm `next`
 * khi `hanCanhTheoNext`, vẫn đặt gần nốt trước nó theo đúng luật ấy.
 */
export function chayBlueDucThinh(options: {
  chord: ParsedChord
  next: ParsedChord
  endBeat: number
  beats: number
  take: number
}): { note: number; startBeat: number; durationBeats: number; hand: 'right' }[] | null {
  // Span của lick = lùi của nốt ĐẦU (nốt xa endBeat nhất); các nốt sau nối liền, không kéo dài thêm.
  const dai = (lick: BlueLick) => lick.not[0]![0]
  const ung = CAC_LICK.filter((l) => dai(l) <= options.beats + 1e-6)
  if (ung.length === 0) return null
  const lick = ung[((options.take * 5) % ung.length + ung.length) % ung.length]!
  const soLuong = lick.not.length
  const goc: number[] = []
  let truoc = TAM_GIUA
  lick.not.forEach(([, , nuaCung], i) => {
    const hopAm = lick.hanCanhTheoNext && i === soLuong - 1 ? options.next : options.chord
    const n = ganNhat(hopAm.root + nuaCung, truoc)
    goc.push(n)
    truoc = n
  })
  return lick.not.map(([lui, truongDo], i) => ({
    note: goc[i]! as MidiNote,
    startBeat: options.endBeat - lui,
    durationBeats: truongDo,
    hand: 'right' as const,
  }))
}

/** Gam Blues của một hợp âm — dùng để kiểm câu lick không lạc ra ngoài gam khi test. */
export const gamBlues = (root: number): readonly number[] => BLUES_STEPS.map((s) => (root + s) % 12)

export const O_LICK = O
