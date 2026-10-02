import type { PracticeHand } from '../reharm/playback/noteGatedPlaybackEngine'
import type { TimedScore } from '../reharm/playback/timedScoring'
import { transposeSymbol } from '../reharm/transpose'
import { BOX_INTERVALS_DAYS, MAX_BOX_LEVEL, nextBoxLevel } from '../earTraining/srs/srsEngine'
import { dayKeyOf, type LuotTap } from '../shared/persistence/db'
import type { VongBaiTap } from './baiTap'
import { GOC, kieuDau } from './vongThay'

/**
 * Lộ trình 7 bậc cho MỘT bài tập điệu — `Reference/KE-HOACH-LUYEN-TAP.md` mục 2, GĐ 1 bước 5.
 *
 * NGƯỠNG ĐẠT — người dùng giao 2/10/2026: *"trong vai một gia sư piano nhiều kinh nghiệm bạn hãy quyết định các ngưỡng đạt từ dễ
 * đến khó"*. Mọi con số dưới đây là QUYẾT ĐỊNH CỦA CLAUDE theo vai ấy, CHƯA ĐO trên tay người dùng. Giá trị cũ: một ngưỡng chung
 * 90 % · 40 ms cho mọi lượt theo nhịp (`timedScoring.ts`, đoán 1/10). Triệu chứng để chỉnh: kẹt một bậc hơn một tuần dù tai nghe đã
 * ổn → nới bậc ấy; qua bậc mà hôm sau lượt nguội trượt (bước 6) → siết. Xem lại khi `LuyenTap.json` có chừng 20 lượt thật mỗi bậc.
 *
 * Nguyên tắc: tách tay trước, ghép tay sau; chậm trước, nhanh sau; mỗi lần thêm một việc mới (ghép tay, có đồng hồ, bỏ nốt rơi) thì
 * nới tiêu chí cũ một chút, rồi siết dần khi việc ấy quen. "Đã qua" = một lượt đạt; "Đã thuộc" (lượt nguội khác ngày) là bước 6.
 */
interface BacChung {
  so: number
  /** Nhãn ngắn trên nút bậc. */
  ten: string
  /** Lời gia sư: bậc này tập gì và vì sao ngưỡng như vậy. */
  viSao: string
}

export type Bac =
  | (BacChung & {
      cheDo: 'gated'
      tay: PracticeHand
      /** Tỉ lệ chặng được vấp (bấm sai hay bỏ qua), tính trên số chặng của tay đang tập. */
      vapToiDa: number
    })
  | (BacChung & {
      cheDo: 'timed'
      tempo: 60 | 80 | 100
      /** Bậc 7: vòng kiểm chưa gặp, giọng lạ, chỉ tên hợp âm, chấm theo lớp cao độ. */
      kiem: boolean
      dungToiThieu: number
      /** Trung vị lệch tuyệt đối, mili giây. */
      lechToiDa: number
      /** Phím thừa / sai trên số nốt phải đánh; `null` = chưa chấm. */
      thuaToiDa: number | null
    })

export const BAC: readonly Bac[] = [
  {
    so: 1,
    ten: 'Tay trái · chờ nốt',
    cheDo: 'gated',
    tay: 'left',
    vapToiDa: 0.15,
    viSao: 'Tách tay, học thế bấm và đường đi của tay trái. Chưa có đồng hồ nên chỉ đếm phím sai; được vấp vài chỗ khi còn lóng ngóng.',
  },
  {
    so: 2,
    ten: 'Tay phải · chờ nốt',
    cheDo: 'gated',
    tay: 'right',
    vapToiDa: 0.15,
    viSao: 'Tay phải là việc mới nên giữ ngưỡng như bậc 1.',
  },
  {
    so: 3,
    ten: 'Hai tay · chờ nốt',
    cheDo: 'gated',
    tay: 'both',
    vapToiDa: 0.1,
    viSao: 'Ghép hai tay. Chặt hơn vì bậc sau đã có đồng hồ: lên nhịp mà còn phải tìm phím là vỡ.',
  },
  {
    so: 4,
    ten: 'Hai tay · 60 %',
    cheDo: 'timed',
    tempo: 60,
    kiem: false,
    dungToiThieu: 0.85,
    lechToiDa: 60,
    thuaToiDa: 0.15,
    viSao: 'Lần đầu có đồng hồ: điều quan trọng nhất là KHÔNG DỪNG — sai cứ đi tiếp. Đúng nốt nới về 85 %.',
  },
  {
    so: 5,
    ten: 'Hai tay · 80 %',
    cheDo: 'timed',
    tempo: 80,
    kiem: false,
    dungToiThieu: 0.9,
    lechToiDa: 50,
    thuaToiDa: 0.1,
    viSao: 'Nhanh hơn thì phải sạch hơn và đều hơn.',
  },
  {
    so: 6,
    ten: 'Hai tay · 100 %',
    cheDo: 'timed',
    tempo: 100,
    kiem: false,
    dungToiThieu: 0.95,
    lechToiDa: 40,
    thuaToiDa: 0.05,
    viSao: 'Tempo thật của nút: đủ sạch và đều để đệm cho người hát.',
  },
  {
    so: 7,
    ten: 'Tên hợp âm · giọng lạ',
    cheDo: 'timed',
    tempo: 100,
    kiem: true,
    dungToiThieu: 0.9,
    lechToiDa: 40,
    thuaToiDa: null,
    viSao:
      'Đệm vòng chưa gặp, giọng lạ, chỉ nhìn tên hợp âm như đệm hát thật. Thế bấm tự chọn (bỏ quãng tám) nên đúng nốt nới về 90 %; nhịp vẫn đều như bậc 6. Phím thừa chưa chấm — bước 7 thêm kiểm bass và nốt sai.',
  },
]

export interface KetQuaLuot {
  dat: boolean
  tomTat: string
}

const phanTram = (x: number) => Math.round(x * 100)

/** Bậc 1–3: hết vòng, số chặng vấp không quá ngưỡng. */
export function chamGated(vapToiDa: number, chang: number, vap: number): KetQuaLuot {
  const duoc = Math.floor(vapToiDa * chang + 1e-9)
  return { dat: chang > 0 && vap <= duoc, tomTat: `vấp ${vap}/${chang} chặng (được ≤ ${duoc})` }
}

/** Bậc 4–7: đúng nốt, độ đều, phím thừa. */
export function chamTimed(bac: Extract<Bac, { cheDo: 'timed' }>, score: TimedScore): KetQuaLuot {
  const dung = score.total > 0 ? score.hit / score.total : 0
  const thua = score.total > 0 ? score.extra.length / score.total : 0
  const lech = score.medianAbsMs
  const okDung = dung >= bac.dungToiThieu - 1e-9
  const okLech = lech !== null && lech <= bac.lechToiDa
  const okThua = bac.thuaToiDa === null || thua <= bac.thuaToiDa + 1e-9
  const phan = [
    `đúng ${phanTram(dung)} % (cần ≥ ${phanTram(bac.dungToiThieu)})`,
    `lệch ${lech ?? '—'} ms (≤ ${bac.lechToiDa})`,
    ...(bac.thuaToiDa === null ? [] : [`thừa ${phanTram(thua)} % (≤ ${phanTram(bac.thuaToiDa)})`]),
  ]
  return { dat: score.total > 0 && okDung && okLech && okThua, tomTat: phan.join(' · ') }
}

/** khoá · mở (đang tập) · Đã qua (đạt trong buổi) · Đã thuộc (lượt nguội ngày khác vẫn đạt — `tienDoBai`). */
export type TrangThaiBac = 'khoa' | 'mo' | 'qua' | 'thuoc'

/** Trạng thái 7 bậc của một bài — hàm thuần đọc nhật ký: qua bậc trước mới mở bậc sau. */
export function trangThaiBac(luot: readonly LuotTap[], styleId: string): TrangThaiBac[] {
  const qua = new Set(luot.filter((one) => one.styleId === styleId && one.dat).map((one) => one.bac))
  return BAC.map((bac, i) => (qua.has(bac.so) ? 'qua' : i === 0 || qua.has(BAC[i - 1]!.so) ? 'mo' : 'khoa'))
}

/** Bậc nên tập tiếp: bậc mở đầu tiên chưa qua; qua hết thì bậc cuối. */
export function bacKeTiep(trangThai: readonly TrangThaiBac[]): number {
  const i = trangThai.indexOf('mo')
  return i >= 0 ? i + 1 : BAC.length
}

/**
 * Bậc 7 — giọng lạ, mỗi lượt một giọng: xoay bốn giọng gần, dịch so với Đô trưởng / La thứ của bài tập — Rê (Si thứ), Si♭ (Sol
 * thứ), Fa (Rê thứ), Sol (Mi thứ). Chọn giọng hay gặp khi đệm hát, không chọn giọng nhiều dấu.
 */
export const DICH_BAC_7 = [2, -2, 5, -5] as const

export function dichBac7(luot: readonly LuotTap[], styleId: string): number {
  const daTap = luot.filter((one) => one.styleId === styleId && one.bac === 7).length
  return DICH_BAC_7[daTap % DICH_BAC_7.length]!
}

/** Tên giọng sau khi dịch, vd `Dm`, `F`. */
export function tenGiong(dich: number, thu: boolean): string {
  const tonic = ((((thu ? 9 : 0) + dich) % 12) + 12) % 12
  return `${GOC[tonic]}${thu ? 'm' : ''}`
}

/** Dịch cả vòng sang giọng khác: nốt, tên hợp âm, thế bấm. */
export function dichVong(vong: VongBaiTap, dich: number, thu: boolean): VongBaiTap {
  const tonic = ((((thu ? 9 : 0) + dich) % 12) + 12) % 12
  const kieu = kieuDau(tonic, thu)
  const ten = (symbol: string) => (symbol ? transposeSymbol(symbol, dich, kieu) : symbol)
  const len = (notes: readonly number[]) => notes.map((note) => note + dich)
  return {
    ...vong,
    hopAm: vong.hopAm.map(ten),
    hopAmNhap: vong.hopAmNhap.map(ten),
    perBeat: vong.perBeat.map(ten),
    timeline: vong.timeline.map((event) => ({ ...event, notes: len(event.notes) })),
    voicings: vong.voicings.map((voicing) => ({
      ...voicing,
      symbol: ten(voicing.symbol),
      left: len(voicing.left),
      right: len(voicing.right),
      ...(voicing.harmonicNotes ? { harmonicNotes: len(voicing.harmonicNotes) } : {}),
    })),
  }
}

/** Ngày 'YYYY-MM-DD' cộng `n` ngày, theo giờ địa phương. */
export function congNgay(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKeyOf(new Date(y!, m! - 1, d! + n))
}

export interface TienDoBai {
  trangThai: TrangThaiBac[]
  /** Bậc thuộc cao nhất (0 = chưa thuộc bậc nào). Bậc thấp hơn tính thuộc theo — đánh được bậc cao là đánh được bậc thấp. */
  thuocCaoNhat: number
  /** Hộp Leitner của bậc thuộc cao nhất (0–5, `srsEngine`) và ngày đến hạn kiểm lại; `null` khi chưa thuộc bậc nào. */
  hop: number | null
  han: string | null
  denHan: boolean
  /** Lượt nguội hôm nay (lượt đầu tiên của bài trong ngày); `null` = hôm nay chưa tập bài này. */
  nguoiHomNay: { bac: number; dat: boolean } | null
  /** Bậc nên tập TRƯỚC TIÊN hôm nay làm lượt nguội — xác nhận Đã thuộc hay kiểm lại; `null` = không có gì cần kiểm. */
  bacNguoi: number | null
}

/**
 * Tiến độ một bài — hàm thuần đọc nhật ký (`Reference/KE-HOACH-LUYEN-TAP.md` mục 1.3, 1.7; GĐ 1 bước 6).
 *
 * Quyết định của Claude trong vai gia sư (người dùng giao các bước 6–8: *"làm theo đề xuất của bạn"*), chưa đo:
 * - LƯỢT NGUỘI = lượt ĐẦU TIÊN của bài trong một ngày, ở bất kỳ bậc nào: tập bậc khác của cùng bài trước thì tay đã nóng.
 * - ĐÃ THUỘC = lượt nguội đạt ở một bậc đã qua từ NGÀY TRƯỚC (guidance hypothesis: đạt khi đang được nhắc liên tục trong buổi chưa
 *   nói được là đã học; lượt đầu của buổi sau mới nói). Thuộc bậc cao thì bậc thấp hơn tính thuộc theo.
 * - KIỂM LẠI theo hộp Leitner có sẵn (`srsEngine`: 0 · 1 · 3 · 7 · 14 · 30 ngày) cho bậc thuộc cao nhất: lượt nguội đạt ở bậc ấy khi
 *   đến hạn → lên hộp; lượt nguội trượt ở bậc ấy hay thấp hơn → về hộp 0, hôm sau kiểm lại (cùng lý do `nextBoxLevel`: sai là chưa
 *   nhớ, lùi một hộp từ 30 xuống 14 ngày thì hai tuần sau mới gặp lại). Lượt nguội đạt sớm hơn hạn chỉ là tập, không lên hộp. Thuộc
 *   bậc cao hơn thì bậc ấy thành bậc được kiểm, bắt đầu lại từ hộp 1.
 */
export function tienDoBai(luot: readonly LuotTap[], styleId: string, homNay: string): TienDoBai {
  const cua = luot
    .filter((one) => one.styleId === styleId)
    .sort((a, b) => a.timestamp - b.timestamp || (a.id ?? 0) - (b.id ?? 0))
  const ngayQua = new Map<number, string>()
  let thuoc = 0
  let hop: number | null = null
  let han: string | null = null
  let ngayTruoc = ''
  let nguoiHomNay: TienDoBai['nguoiHomNay'] = null
  for (const one of cua) {
    const nguoi = one.day !== ngayTruoc
    ngayTruoc = one.day
    if (nguoi) {
      if (one.day === homNay) nguoiHomNay = { bac: one.bac, dat: one.dat }
      const choXacNhan = (ngayQua.get(one.bac) ?? one.day) < one.day
      if (one.dat && choXacNhan && one.bac > thuoc) {
        thuoc = one.bac
        hop = 1
        han = congNgay(one.day, BOX_INTERVALS_DAYS[1])
      } else if (thuoc > 0 && one.bac <= thuoc && !one.dat) {
        hop = nextBoxLevel(hop ?? 0, false)
        han = congNgay(one.day, 1)
      } else if (thuoc > 0 && one.bac === thuoc && one.dat && han !== null && one.day >= han) {
        hop = nextBoxLevel(hop ?? 0, true)
        han = congNgay(one.day, BOX_INTERVALS_DAYS[Math.min(hop, MAX_BOX_LEVEL)])
      }
    }
    if (one.dat && !ngayQua.has(one.bac)) ngayQua.set(one.bac, one.day)
  }

  const trangThai = trangThaiBac(luot, styleId).map((tt, i): TrangThaiBac => (i < thuoc ? 'thuoc' : tt))
  const denHan = han !== null && homNay >= han
  /* Bậc đã qua từ ngày trước mà chưa thuộc — xác nhận bậc cao nhất (thuộc nó là thuộc luôn bậc dưới), trước cả việc kiểm lại. */
  const cho = [...ngayQua.entries()].filter(([bac, ngay]) => bac > thuoc && ngay < homNay).map(([bac]) => bac)
  const bacNguoi = nguoiHomNay !== null ? null : cho.length > 0 ? Math.max(...cho) : denHan ? thuoc : null
  return { trangThai, thuocCaoNhat: thuoc, hop, han, denHan, nguoiHomNay, bacNguoi }
}
