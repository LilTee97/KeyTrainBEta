import { BALLAD_SOLO_RANGE } from '../../reharm/style/balladFamily'
import { chayBlueSun } from '../../reharm/style/boSoanBlues'
import { composeCpBallad } from '../../reharm/style/cpBalladComposition'
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
  - Cà Pháo: bộ soạn ballad `composeCpBallad` — đúng bộ tab Tái hòa âm chạy khi tái hòa âm màu Cà Pháo (điệu Ballad cứ đi, tầm
    `BALLAD_SOLO_RANGE`, ô tick lượt 4 bật như mặc định ở đó), nhưng soạn trên vòng cho sẵn (`cpVongCoDinh`) thay vì tự dựng vòng. Người
    dùng 11/10/2026: "sử dụng bộ soạn của Cà Pháo để sinh ra câu solo … chứ ko phải bạn lặp lại câu Cà Pháo có trong sheet" — bản trước
    dùng bộ ghép ô thật như Linh Nhi. Hai tay đều của bộ soạn (tay trái sóng rải dưới solo, tay phải câu mới); cả giọng thứ.
  - Linh Nhi: bộ ghép ô thật `giaiDieuDaoLinhNhi` (đoạn giang tấu) — mỗi ô của vòng ghép một ô nhịp có thật trong bản ký âm của chị:
    cùng bậc hợp âm → cùng chức năng, nối giọng, ở lại một bài; không nắn cao độ. Vốn ô: `tuyenSolo.ts`.
  - Blues: Bộ Soạn Blues `chayBlueSun` đoạn đàn (mặc định của Slow Blues) — mỗi ô 6/8 chép trọn tay phải một ô The House of the Rising
    Sun theo chức năng hợp âm, qua bộ lọc hợp âm; ô dày mỗi 2 ô.
  Tay trái Linh Nhi · Blues: điệu của thầy làm backing (Bolero rải bản ký âm · Slow Blues). `take` cố định → cùng một câu cho tới khi bấm
  "Đổi câu". Khối nốt rơi ghi TÊN nốt (bộ soạn không đặt ngón — đặt ngón cho câu thầy chưa làm).
*/

export type ThayChay = 'ca-phao' | 'linh-nhi' | 'blues'

export const THAY_CHAY: readonly { id: ThayChay; ten: string }[] = [
  { id: 'ca-phao', ten: 'Cà Pháo' },
  { id: 'linh-nhi', ten: 'Linh Nhi' },
  { id: 'blues', ten: 'Blues' },
]

/** Điệu đệm dưới câu solo của thầy. */
export const dieuCua = (thay: ThayChay) => (thay === 'blues' ? 'blue-sun' : thay === 'linh-nhi' ? 'bolero-linh-nhi-2' : 'ca-phao-ballad-cu-di')

/** Bộ soạn kể bằng lời — hiện dưới nút. */
export function loiBoSoan(thay: ThayChay, thu: boolean): string {
  const dieu = getStyle(dieuCua(thay))?.name ?? dieuCua(thay)
  return thay === 'blues'
    ? `Bộ Soạn Blues: mỗi hợp âm một ô 6/8 (6 móc đơn), tay phải là trọn một ô của bản ký âm The House of the Rising Sun chọn theo chức năng hợp âm (câu chạy · riff · câu thưa), ô dày mỗi 2 ô. Đệm: ${dieu}.`
    : thay === 'ca-phao'
      ? `Bộ soạn Cà Pháo — đúng bộ của tab Tái hòa âm khi tái hòa âm màu Cà Pháo, soạn câu MỚI trên vòng của bạn (không chép câu có sẵn trong sheet): mỗi khung 2 ô lấy tiết tấu từ solo bài Anh Cứ Đi Đi, hình câu (lên · xuống · nhảy · bè quãng 4 / 6 / 3 · quãng tám) từ các câu solo ballad ${thu ? 'giọng thứ' : 'giọng trưởng'} của anh, rồi dò cao độ nốt theo hợp âm đang vang — nốt nặng là nốt hợp âm, nốt màu 9 · 11 · 13 khi câu nguồn cũng dùng đúng vai ấy. Mỗi lần "Đổi câu" là một câu soạn mới. Đệm: ${dieu} — tay trái cũng do bộ soạn soạn.`
      : `Bộ ghép ô thật của chị Linh Nhi: mỗi hợp âm một ô 4 phách, ghép một ô nhịp có thật trong các đoạn giang tấu ${thu ? 'giọng thứ' : 'giọng trưởng'} của chị — cùng bậc hợp âm, nối giọng với ô trước, ở lại cùng một bài càng lâu càng tốt; không nắn nốt. Đệm: ${dieu}.`
}

const pc = (m: number) => ((m % 12) + 12) % 12

/** Một câu solo của thầy trên vòng `hop` (gốc tính từ chủ âm). `null` khi không đọc được hợp âm hay thầy không có ô nào cho vòng này. */
export function baiCauThay(thay: ThayChay, hop: readonly Hop[], tonic: number, thu: boolean, take: number, id: string): BaiChay | null {
  const { h } = nguCanh(tonic, thu)
  /* Bộ soạn Cà Pháo soạn theo khung 2 ô (8 phách), khung cuối là câu đóng → lặp vòng tới đủ ≥ 4 ô và chẵn ô. Đo (12/10/2026, 8 lượt mỗi vòng):
     vòng 2 ô một hợp âm (C – C) chỉ ra 2 câu khác nhau — khung duy nhất cũng là khung đóng; vòng 4 ô ra 6–8 câu khác nhau. */
  let lan = 1
  while (thay === 'ca-phao' && (hop.length * lan < 4 || (hop.length * lan) % 2)) lan += 1
  const vong = Array.from({ length: lan }, () => hop).flat()
  const ten = vong.map((x) => h(x.goc, x.chat, x.bass))
  const chords = docHop(ten.join(' '))
  const style = getStyle(dieuCua(thay))
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
  } else if (thay === 'ca-phao') {
    // Như tab Tái hòa âm màu Cà Pháo; không truyền BPM → bộ soạn lấy BPM của điệu, đổi tốc độ game không đổi câu.
    const cau = composeCpBallad({
      kind: 'interlude',
      key: { tonic: chu, scale: thu ? 'minor' : 'major' },
      style,
      beatsPerChord: o,
      dropRoot: false,
      // Vòng lặp lại: câu dẫn về hợp âm đầu vòng như dẫn vào câu hát kế.
      opening: chords[0]!,
      take,
      range: BALLAD_SOLO_RANGE,
      solo: () => [],
      cpBalladThu: true,
      cpVongCoDinh: vong.map((x) => ({ root: x.goc, suffix: x.chat, bass: x.bass ?? null, beats: o })),
    })
    if (cau.unavailableReason) return null
    trai = cau.events.filter((e) => e.hand === 'left')
    phai = cau.events.filter((e) => e.hand === 'right')
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
    ten: `${THAY_CHAY.find((x) => x.id === thay)!.ten} · ${ten.slice(0, hop.length).join(' – ')}`,
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
