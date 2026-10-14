import { BALLAD_SOLO_RANGE } from '../../reharm/style/balladFamily'
import { chayBlueSun } from '../../reharm/style/boSoanBlues'
import { composeCpBallad } from '../../reharm/style/cpBalladComposition'
import { renderPattern } from '../../reharm/style/patternRenderer'
import { soanSlowRockLinhNhi } from '../../reharm/style/soanSlowRockLinhNhi'
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

  Không soạn mới ở đây — gọi đúng bộ SOẠN câu mới của từng thầy mà tab Tái hòa âm dùng, trên CHÍNH vòng người dùng chọn / nhập (vòng
  cho sẵn thay cho vòng bộ soạn tự dựng). Người dùng 11/10/2026: "sử dụng bộ soạn của Cà Pháo để sinh ra câu solo … chứ ko phải bạn lặp
  lại câu Cà Pháo có trong sheet"; 12/10/2026 (đã duyệt câu Cà Pháo): "áp dụng cho Linh Nhi và Blues". Bản trước Cà Pháo · Linh Nhi
  dùng bộ ghép ô thật `giaiDieuDaoLinhNhi` (chép ô nhịp sheet), Blues chép trọn ô Rising Sun.
  - Cà Pháo: bộ soạn ballad `composeCpBallad` (`cpVongCoDinh`) — như tab Tái hòa âm màu Cà Pháo: điệu Ballad cứ đi, tầm
    `BALLAD_SOLO_RANGE`, ô tick lượt 4 bật như mặc định ở đó. Một ô 4/4 mỗi hợp âm.
  - Linh Nhi: bộ soạn slow rock `soanSlowRockLinhNhi` (`vongCoDinh`) — bộ soạn câu mới DUY NHẤT của chị (tab Tái hòa âm màu Linh Nhi:
    họ Slow Rock soạn câu mới, họ Bolero chép nguyên một đoạn sheet). Một ô 6/8 mỗi hợp âm; đệm Slow Rock Lá thư (bản trước Bolero).
  - Blues: Bộ Soạn Blues lượt 6 `chayBlueSun({ soan: true })` — soạn từ nhóm ba, như tab Tái hòa âm bật ô tick "Bộ Soạn Blues lượt 6"
    (người dùng nghe 28/9: phối hai tay ổn, giai điệu 6/10). Một ô 6/8 mỗi hợp âm, ô dày mỗi 2 ô; tay trái: điệu Slow Blues.
  Cà Pháo · Linh Nhi: hai tay đều của bộ soạn. `take` cố định → cùng một câu cho tới khi bấm "Đổi câu". Khối nốt rơi ghi TÊN nốt (bộ
  soạn không đặt ngón).
*/

export type ThayChay = 'ca-phao' | 'linh-nhi' | 'blues'

export const THAY_CHAY: readonly { id: ThayChay; ten: string }[] = [
  { id: 'ca-phao', ten: 'Cà Pháo' },
  { id: 'linh-nhi', ten: 'Linh Nhi' },
  { id: 'blues', ten: 'Blues' },
]

/** Điệu đệm dưới câu solo của thầy. */
export const dieuCua = (thay: ThayChay) =>
  thay === 'blues' ? 'blue-sun' : thay === 'linh-nhi' ? 'slow-rock-la-thu-hai-tay' : 'ca-phao-ballad-cu-di'

/** Bộ soạn kể bằng lời — hiện dưới nút. */
export function loiBoSoan(thay: ThayChay, thu: boolean): string {
  const dieu = getStyle(dieuCua(thay))?.name ?? dieuCua(thay)
  return thay === 'blues'
    ? `Bộ Soạn Blues lượt 6 — như tab Tái hòa âm bật ô tick "Bộ Soạn Blues lượt 6", soạn câu MỚI trên vòng của bạn: mỗi hợp âm một ô 6/8, ghép từng nhóm ba (3 móc đơn = một phách lớn) lấy từ câu thật của Rockhouse và The House of the Rising Sun — chỉ dời giọng và quãng tám cả nhóm — chấm điểm từng chỗ ghép: nốt phách 1 · 4 hợp chức năng hợp âm, nốt blue giải đúng hướng, nối câu gần, không dùng lại nhóm trong 16 nhóm; ô dày (câu chạy) mỗi 2 ô. Đệm: ${dieu}.`
    : thay === 'ca-phao'
      ? `Bộ soạn Cà Pháo — đúng bộ của tab Tái hòa âm khi tái hòa âm màu Cà Pháo, soạn câu MỚI trên vòng của bạn (không chép câu có sẵn trong sheet): mỗi khung 2 ô lấy tiết tấu từ solo bài Anh Cứ Đi Đi, hình câu (lên · xuống · nhảy · bè quãng 4 / 6 / 3 · quãng tám) từ các câu solo ballad ${thu ? 'giọng thứ' : 'giọng trưởng'} của anh, rồi dò cao độ nốt theo hợp âm đang vang — nốt nặng là nốt hợp âm, nốt màu 9 · 11 · 13 khi câu nguồn cũng dùng đúng vai ấy. Mỗi lần "Đổi câu" là một câu soạn mới. Đệm: ${dieu} — tay trái cũng do bộ soạn soạn.`
      : `Bộ soạn Linh Nhi — bộ soạn câu solo slow rock của tab Tái hòa âm (màu Linh Nhi), soạn câu MỚI trên vòng của bạn: mỗi hợp âm một ô 6/8, lấy một ô slow rock của chị (Lá Thư, Một Cõi) hay ô lai (đường cao độ một ô bolero ${thu ? 'giọng thứ' : 'giọng trưởng'} của chị trên tiết tấu ô slow rock), chuyển bậc theo gam lên hợp âm của bạn — nốt bậc 3 · 5 · 7 lệch nửa cung kéo về nốt hợp âm — và chọn ô theo quy luật đo trên sheet của chị: nối ô sát nhau, phách mạnh là nốt hợp âm, không lặp hình ô trước. Đệm: ${dieu} — tay trái là tay trái của chính ô ấy.`
}

const pc = (m: number) => ((m % 12) + 12) % 12

/** Một câu solo của thầy trên vòng `hop` (gốc tính từ chủ âm). `null` khi không đọc được hợp âm hay bộ soạn không soạn được trên vòng này. */
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
  // Phách (nốt đen) mỗi hợp âm: Cà Pháo một ô 4/4; Linh Nhi · Blues một ô 6/8 = 6 móc đơn = 3 phách đen.
  const o = thay === 'ca-phao' ? 4 : 3
  const key = { tonic: pc(tonic) as PitchClass, scale: thu ? 'minor' : 'major' } as const
  let su: TimelineEvent[]
  if (thay === 'blues') {
    su = [
      ...renderPattern(voiceLeadTwoHands(chords), style, { beatsPerChord: o }).filter((e) => e.hand === 'left'),
      /* Trọng số lượt 2,5 (như lượt 12; mặc định 0,8 chỉ phá thế hoà). Đo 12/10/2026, 12 vòng × 8 lượt: 0,8 → 61/96 câu khác nhau (Am – Am
         1/8, "Đổi câu" ra lại câu cũ) · 2,5 → 88/96; giá: nốt hợp âm ở phách 1 · 4 từ 63,0 % (442/702) còn 59,2 % (407/687). Lùi về 0,8
         (bỏ `doiLuot`) khi tai nghe câu Blues lạc hợp âm hơn hẳn tab Tái hòa âm. */
      ...chayBlueSun(chords, { key, beatsPerChord: o, take, doan: 'dan', soan: true, doiLuot: 2.5 }),
    ]
  } else {
    const cau =
      thay === 'ca-phao'
        ? // Không truyền BPM → bộ soạn lấy BPM của điệu, đổi tốc độ game không đổi câu.
          composeCpBallad({
            kind: 'interlude',
            key,
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
        : soanSlowRockLinhNhi({
            kind: 'interlude',
            key,
            take,
            oDieu: o,
            vongCoDinh: vong.map((x) => ({ goc: x.goc, hau: x.chat, bass: x.bass ?? null })),
          })
    if (cau.unavailableReason) return null
    su = cau.events
  }
  if (!su.some((e) => e.hand === 'right')) return null
  return {
    id: `thay-${thay}-${id}-${key.tonic}-${thu ? 'thu' : 'truong'}`,
    ten: `${THAY_CHAY.find((x) => x.id === thay)!.ten} · ${ten.slice(0, hop.length).join(' – ')}`,
    tay: 'right',
    timeline: [...su].sort((a, b) => a.startBeat - b.startBeat),
    perBeat: ten.flatMap((t) => Array.from({ length: o }, () => t)),
    voicings: ten.map((symbol) => ({ left: [], right: [], symbol })),
    beatsPerChord: o,
    meter: o === 4 ? 4 : 3,
  }
}
