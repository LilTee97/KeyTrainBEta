import type { ScheduledHit } from '../../shared/audio/audioEngine'
import type { MidiNote } from '../../shared/musicTheory/types'
import { chonCauQuyTacChong, type CauSsa, type VongNen } from './loiSsa'
import { MAN_KHUNG } from './mauKhung'

/*
  NỀN BEAT — backing chỉ có trống. Người dùng 15/10/2026: "Có một kiểu backing track ko cần chơi giai điệu nhiều mà chỉ có beat chơi theo các
  loại nhịp (ví dụ 2/4, 4/4, 6/8...) và theo các điệu … Tôi muốn bạn nghe video và tạo ra dạng backing track bằng beat tương tự vậy để làm
  thành backing track cho mục Quy tắc chồng + Chạy thử".

  Video D:\PianoBrain\video\Beat (bài tập "Lick Em/Am", Em7(9) – Am7(9), 24 s; nền trống + bass tắt ở giây 12, piano chơi tiếp). Đo trên bè
  trống tách bằng demucs (htdemucs), 15/10/2026: ♩ 100,8 (phách 0,595 s); hi-hat đều từng móc đơn (0,297 s), thẳng, không swing. Gộp 5 ô
  4/4 (phách 1 = kick mạnh), độ vọt mỗi móc kép, chuẩn 0–9:
                  1  e  &  a  2  e  &  a  3  e  &  a  4  e  &  a
    kick 30–120   6  1  0  0  3  0  0  9  4  0  1  1  2  0  2  0
    rè 1,5–5 kHz  7  0  2  0  9  1  1  4  6  0  3  0  7  1  2  1
    hi-hat 7–16k  8  1  7  1  8  1  5  2  7  1  9  2  7  2  5  1
  Tiếng ở phách 2 · 4 không có năng lượng dưới 120 Hz (0,00 – 0,01), trọng tâm 4,3 – 5,5 kHz → snare; phách 1 · 3 có (0,30 – 0,40) → kick;
  móc kép cuối phách 2 là kick sạch (dưới 120 Hz 0,52 – 0,70, trọng tâm 0,7 – 1,1 kHz). Bè bass có chạy nốt — không lấy: người dùng chỉ xin
  beat, và lối chồng + chạy thì tay trái đã đánh bass.
  Lực MIDI là của Claude, theo tỉ lệ độ vọt đo được: kick 110 × tỉ lệ, snare 100 × tỉ lệ, hi-hat 40 + 40 × tỉ lệ (hi-hat nhỏ hơn kick · snare).
*/

export type TrongGm = 36 | 38 | 42
/** Một tiếng trống trong ô: số GM (36 kick · 38 snare · 42 hi-hat), phách tính từ đầu ô, lực MIDI. */
export interface TiengTrong {
  m: TrongGm
  phach: number
  luc: number
}
export interface BeatNen {
  id: string
  ten: string
  /** Nhịp ghi cho người đọc: '4/4' … */
  nhip: string
  /** Số phách (nốt đen) mỗi ô. */
  phachO: number
  /** Nhịp độ đo được ở nguồn (♩). */
  bpm: number
  o: readonly TiengTrong[]
  /** Khung bùm – chát ngắn để hiện trên màn chọn. */
  khung: string
  nguon: string
}

const tieng = (m: TrongGm, phach: number, luc: number): TiengTrong => ({ m, phach, luc: Math.round(luc) })
const HAT = [8, 7, 8, 5, 7, 9, 7, 5]

export const BEAT_NEN: readonly BeatNen[] = [
  {
    id: 'lofi-4-4',
    ten: 'Lo-fi 4/4 — như video Lick Em/Am',
    nhip: '4/4',
    phachO: 4,
    bpm: 101,
    o: [
      tieng(36, 0, (110 * 6) / 9),
      tieng(36, 1.75, 110),
      tieng(36, 2, (110 * 4) / 9),
      tieng(38, 1, 100),
      tieng(38, 3, (100 * 7) / 9),
      ...HAT.map((x, i) => tieng(42, i / 2, 40 + (40 * x) / 9)),
    ],
    khung: 'Bùm₁ · chát₂ · bum₂a Bùm₃ · chát₄ — hi-hat đều 8 móc đơn',
    nguon: 'đo trên bè trống của video "Lick Em/Am" (D:\\PianoBrain\\video\\Beat), 5 ô, ♩ 100,8',
  },
]

/** Trống của `soPhach` phách đầu tiên: ô của `beat` lặp liền nhau. */
export function nenBeat(beat: BeatNen, soPhach: number): ScheduledHit[] {
  const ra: ScheduledHit[] = []
  for (let dau = 0; dau < soPhach; dau += beat.phachO)
    for (const x of beat.o)
      if (dau + x.phach < soPhach) ra.push({ notes: [x.m as MidiNote], startBeat: dau + x.phach, durationBeats: 0.25, velocity: x.luc, trong: true })
  return ra.sort((a, b) => a.startBeat - b.startBeat)
}

/**
 * Vòng chơi màn quy tắc `mi` (lối chồng + chạy) trên nền beat: `soCau` hợp âm do màn chọn (`chonCauQuyTacChong`, không lặp hợp âm vừa rồi),
 * mỗi hợp âm `oMoiHop` ô. Nền là MỘT ô trống lặp mãi (`chuKyNen`) — trống lặp đều từng ô, mỗi lượt chỉ dựng 13 tiếng thay vì ≈ 840 tiếng
 * của cả vòng (32 hợp âm × 8 phách). Nền không có hoà âm nên hợp âm nào đặt lên cũng khớp.
 */
export function vongQuyTacBeat(mi: number, goc: readonly number[], beat: BeatNen, oMoiHop: number, soCau: number, rand: () => number = Math.random): VongNen {
  const cau: CauSsa[] = []
  let truoc: string | null = null
  for (let i = 0; i < soCau; i++) {
    const c = chonCauQuyTacChong(mi, goc, new Map(), truoc, rand)
    cau.push(c)
    truoc = c.id
  }
  const nhip = cau.map(() => beat.phachO * oMoiHop)
  return { ten: `Màn ${mi + 1} · ${MAN_KHUNG[mi]!.ten} · ${beat.ten}`, cau, nhip, nen: nenBeat(beat, beat.phachO), demTrong: true, chuKyNen: beat.phachO }
}
