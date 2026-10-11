import { chayBlueSun } from '../../reharm/style/boSoanBlues'
import { giaiDieuDaoLinhNhi } from '../../reharm/style/giaiDieuDaoLinhNhi'
import { renderPattern } from '../../reharm/style/patternRenderer'
import { soloLeftHand } from '../../reharm/style/soloLeftHand'
import { getStyle } from '../../reharm/style/styleLibrary'
import type { TimelineEvent } from '../../reharm/style/types'
import { voiceLeadTwoHands } from '../../reharm/voicingGenerator/handSplitVoicing'
import type { PitchClass } from '../../shared/musicTheory/types'
import { nguCanh, type Hop } from '../soanCau/giaiThich'
import { docHop } from '../soanCau/thayTrongVong'
import type { BaiChay } from './gamNgon'

/*
  CÂU SOLO THEO THẦY cho game chạy ngón — người dùng 11/10/2026: "thêm 3 nút của 3 thầy CP Linh Nhi và Blues, nếu ko chọn nút nào thì
  chạy ngón theo cơ bản … vì đã có bộ soạn nốt cho từng thầy nên hãy soạn nốt solo theo từng thầy và đố tôi bấm theo. Ko cần tự động đổi
  câu mỗi khi phát, chỉ đổi khi nào tôi bấm nút đổi câu".

  Không soạn mới ở đây — gọi đúng bộ soạn app đang dùng, trên CHÍNH vòng người dùng chọn / nhập:
  - Cà Pháo, Linh Nhi: bộ ghép ô thật `giaiDieuDaoLinhNhi` (đoạn giang tấu) — mỗi ô của vòng ghép một ô nhịp có thật trong bản ký âm của
    thầy: cùng bậc hợp âm → cùng chức năng, nối giọng, ở lại một bài; không nắn cao độ. Vốn ô: `tuyenSolo.ts`.
  - Blues: Bộ Soạn Blues `chayBlueSun` đoạn đàn (mặc định của Slow Blues) — mỗi ô 6/8 chép trọn tay phải một ô The House of the Rising
    Sun theo chức năng hợp âm, qua bộ lọc hợp âm; ô dày mỗi 2 ô.
  Tay trái: điệu của thầy làm backing — Cà Pháo Ballad cứ đi (ô tay trái dưới solo `soloCell`) giọng trưởng / Bossa sheet 9–10 giọng thứ
  (vốn ô giang thứ của anh là bossa nova); Linh Nhi Bolero rải bản ký âm; Blues Slow Blues. `take` cố định → cùng một câu cho tới khi bấm
  "Đổi câu". Khối nốt rơi ghi TÊN nốt (bộ soạn không đặt ngón — đặt ngón cho câu thầy chưa làm).
*/

export type ThayChay = 'ca-phao' | 'linh-nhi' | 'blues'

export const THAY_CHAY: readonly { id: ThayChay; ten: string }[] = [
  { id: 'ca-phao', ten: 'Cà Pháo' },
  { id: 'linh-nhi', ten: 'Linh Nhi' },
  { id: 'blues', ten: 'Blues' },
]

/** Điệu đệm dưới câu solo của thầy. */
export const dieuCua = (thay: ThayChay, thu: boolean) =>
  thay === 'blues' ? 'blue-sun' : thay === 'linh-nhi' ? 'bolero-linh-nhi-2' : thu ? 'ca-phao-bossa-sheet-9-10' : 'ca-phao-ballad-cu-di'

/** Bộ soạn kể bằng lời — hiện dưới nút. */
export function loiBoSoan(thay: ThayChay, thu: boolean): string {
  const dieu = getStyle(dieuCua(thay, thu))?.name ?? dieuCua(thay, thu)
  return thay === 'blues'
    ? `Bộ Soạn Blues: mỗi hợp âm một ô 6/8 (6 móc đơn), tay phải là trọn một ô của bản ký âm The House of the Rising Sun chọn theo chức năng hợp âm (câu chạy · riff · câu thưa), ô dày mỗi 2 ô. Đệm: ${dieu}.`
    : `Bộ ghép ô thật của ${thay === 'ca-phao' ? 'anh Cà Pháo' : 'chị Linh Nhi'}: mỗi hợp âm một ô 4 phách, ghép một ô nhịp có thật trong các đoạn giang tấu ${thu ? 'giọng thứ' : 'giọng trưởng'} của ${thay === 'ca-phao' ? 'anh' : 'chị'} — cùng bậc hợp âm, nối giọng với ô trước, ở lại cùng một bài càng lâu càng tốt; không nắn nốt. Đệm: ${dieu}.`
}

const pc = (m: number) => ((m % 12) + 12) % 12

/** Một câu solo của thầy trên vòng `hop` (gốc tính từ chủ âm). `null` khi không đọc được hợp âm hay thầy không có ô nào cho vòng này. */
export function baiCauThay(thay: ThayChay, hop: readonly Hop[], tonic: number, thu: boolean, take: number, id: string): BaiChay | null {
  const { h } = nguCanh(tonic, thu)
  const ten = hop.map((x) => h(x.goc, x.chat, x.bass))
  const chords = docHop(ten.join(' '))
  const style = getStyle(dieuCua(thay, thu))
  if (!chords || !style || chords.length === 0) return null
  const blues = thay === 'blues'
  // Phách (nốt đen) mỗi hợp âm: Blues 6/8 = 6 móc đơn = 3 phách đen; còn lại một ô 4/4.
  const o = blues ? 3 : 4
  const beatsEach = chords.map(() => o)
  const chu = pc(tonic) as PitchClass
  let trai: TimelineEvent[]
  let phai: TimelineEvent[]
  if (blues) {
    trai = renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: o }).filter((e) => e.hand === 'left')
    phai = chayBlueSun(chords, { key: { tonic: chu, scale: thu ? 'minor' : 'major' }, beatsPerChord: o, take, doan: 'dan' })
  } else {
    trai = soloLeftHand({ chords, beatsEach, style: style.soloCell ? { ...style, cell: style.soloCell } : style })
    phai = giaiDieuDaoLinhNhi({
      thay,
      doan: 'interlude',
      left: trai,
      chords,
      beatsPerChord: o,
      barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
      range: { low: 57, high: 84 },
      take,
      minor: thu,
      tonic: chu,
      beatsEach,
    })
  }
  if (phai.length === 0) return null
  return {
    id: `thay-${thay}-${id}-${chu}-${thu ? 'thu' : 'truong'}`,
    ten: `${THAY_CHAY.find((x) => x.id === thay)!.ten} · ${ten.join(' – ')}`,
    tay: 'right',
    timeline: [...trai.map((e) => ({ ...e, hand: 'left' as const })), ...phai.map((e) => ({ ...e, hand: 'right' as const }))].sort(
      (a, b) => a.startBeat - b.startBeat,
    ),
    perBeat: ten.flatMap((t) => Array.from({ length: o }, () => t)),
    voicings: ten.map((symbol) => ({ left: [], right: [], symbol })),
    beatsPerChord: o,
    meter: blues ? 3 : 4,
  }
}
