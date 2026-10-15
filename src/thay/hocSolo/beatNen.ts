import type { ScheduledHit } from '../../shared/audio/audioEngine'
import type { MidiNote } from '../../shared/musicTheory/types'
import { chonCauQuyTacChong, type CauSsa, type VongNen } from './loiSsa'
import { MAN_KHUNG } from './mauKhung'

/*
  NỀN BEAT — backing chỉ có trống. Người dùng 15/10/2026: "Có một kiểu backing track ko cần chơi giai điệu nhiều mà chỉ có beat chơi theo các
  loại nhịp (ví dụ 2/4, 4/4, 6/8...) và theo các điệu … Tôi muốn bạn nghe video và tạo ra dạng backing track bằng beat tương tự vậy để làm
  thành backing track cho mục Quy tắc chồng + Chạy thử". Duyệt 16/10/2026: "beat backing track của mục Quy luật chồng+chạy đã ổn".

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

  NỀN THEO ĐIỆU (người dùng 16/10/2026: "Dựa trên các điệu hiện có của KT bạn hãy tạo ra các loại backing track dạng beat cho từng điệu để
  đưa vào làm backing cho 4 tab của các thầy trong Game nốt rơi"): bốn tab là Lối SSA · Cà Pháo · Linh Nhi · Blues (Tuấn chưa có tab trong
  Game nốt rơi). Mỗi nền dựng từ KHUNG BÙM – CHÁT của chính điệu ấy trong app (cell của điệu + chú thích khung người dùng đã duyệt):
    bùm (tiếng thấp — bass) → kick; chát (tiếng cao — hợp âm tay phải) → snare, riêng Bossa → gõ vành (rim, cross-stick của bossa);
    lớp hi-hat theo nhịp chia của điệu (rải 16 móc kép · móc đơn · 6 móc đơn của 6/8 · móc đơn swing của Twist).
  Twist có khung đo từ nền trống video PianoStyles (30/9/2026: trống cái 1 · 3, snare 2 · 2& · 4). Cách dịch điệu sang trống, chỗ giữ
  backbeat cho đều nhịp, lực từng tiếng là của Claude — chưa có video trống của các điệu ấy để đo. Nhịp độ gốc = nhịp điệu trong app (6/8 của
  app đếm móc đơn: Slow Rock ♪ 86, Slow Blues ♪ 92).
*/

export type TrongGm = 36 | 37 | 38 | 42
/** Một tiếng trống trong chu kỳ nền: số GM (36 kick · 37 gõ vành · 38 snare · 42 hi-hat), phách tính từ đầu chu kỳ, lực MIDI. */
export interface TiengTrong {
  m: TrongGm
  phach: number
  luc: number
}
/** Tab của Game nốt rơi có nền này. */
export type BoBeat = 'quy-tac-chong' | 'ssa' | 'ca-phao' | 'linh-nhi' | 'blues'
export interface BeatNen {
  id: string
  ten: string
  /** Nhịp ghi cho người đọc: '4/4' · '6/8' … */
  nhip: string
  /** Số phách mỗi ô (6/8 của app: 6 móc đơn). Đếm vào đúng một ô. */
  phachO: number
  /** Chu kỳ lặp của trống (phách) — một hay hai ô. */
  chuKy: number
  /** Nhịp độ gốc (nguồn đo / điệu của app). */
  bpm: number
  /** Các nút ♩ và nút mặc định. */
  nhipChon: readonly number[]
  nhipMacDinh: number
  /** Số ô mỗi hợp âm mặc định. */
  oMacDinh: number
  o: readonly TiengTrong[]
  /** Khung bùm – chát ngắn để hiện trên màn chọn. */
  khung: string
  nguon: string
  bo: readonly BoBeat[]
}

const tieng = (m: TrongGm, phach: number, luc: number): TiengTrong => ({ m, phach, luc: Math.round(luc) })
const kick = (p: number, l: number) => tieng(36, p, l)
const snare = (p: number, l: number) => tieng(38, p, l)
const vanh = (p: number, l: number) => tieng(37, p, l)
const hat = (p: number, l: number) => tieng(42, p, l)
/** Hi-hat đều trên `dai` phách, bước `buoc`; lực theo vị trí. */
const hatDeu = (dai: number, buoc: number, luc: (p: number) => number) => Array.from({ length: Math.round(dai / buoc) }, (_, i) => hat(i * buoc, luc(i * buoc)))
/** Nút ♩: 60 · 70 · 80 · 90 % nhịp gốc (làm tròn 5) và nhịp gốc. */
const nhipTu = (bpm: number) => [...new Set([0.6, 0.7, 0.8, 0.9].map((k) => Math.round((bpm * k) / 5) * 5)), bpm]
const HAT_LOFI = [8, 7, 8, 5, 7, 9, 7, 5]
/** 6 móc đơn của ô 6/8: nhấn tiếng 1 · 4. */
const HAT_68 = [60, 40, 45, 56, 40, 45]

export const BEAT_NEN: readonly BeatNen[] = [
  {
    id: 'lofi-4-4',
    ten: 'Lo-fi 4/4 — như video Lick Em/Am',
    nhip: '4/4',
    phachO: 4,
    chuKy: 4,
    bpm: 101,
    nhipChon: [70, 80, 90, 100, 110],
    nhipMacDinh: 100,
    oMacDinh: 2,
    o: [
      kick(0, (110 * 6) / 9),
      kick(1.75, 110),
      kick(2, (110 * 4) / 9),
      snare(1, 100),
      snare(3, (100 * 7) / 9),
      ...HAT_LOFI.map((x, i) => hat(i / 2, 40 + (40 * x) / 9)),
    ],
    khung: 'Bùm₁ · chát₂ · bum₂a Bùm₃ · chát₄ — hi-hat đều 8 móc đơn',
    nguon: 'đo trên bè trống của video "Lick Em/Am" (D:\\PianoBrain\\video\\Beat), 5 ô, ♩ 100,8',
    bo: ['quy-tac-chong', 'ssa'],
  },
  {
    id: 'cp-ballad-cu-di',
    ten: 'Ballad cứ đi',
    nhip: '4/4',
    phachO: 4,
    chuKy: 4,
    bpm: 63,
    nhipChon: nhipTu(63),
    nhipMacDinh: 63,
    oMacDinh: 2,
    o: [kick(0, 100), kick(2, 100), snare(1, 85), snare(3, 85), ...hatDeu(4, 0.25, (p) => (p % 2 === 1.75 ? 62 : p % 1 === 0 ? 50 : 36))],
    khung: 'Bùm₁ · chát₂ · Bùm₃ · chát₄ — hi-hat rải 16 móc kép như hai tay rải, nhấn tiếng 8 mỗi nửa ô',
    nguon:
      'dựng từ khung điệu Ballad cứ đi (rải hai tay 8 móc kép mỗi nửa ô, nhấn tiếng 1 · 5 · 8): bùm tiếng 1 → kick, chát tiếng 5 (tay phải hai nốt) → snare, các tiếng rải → hi-hat, tiếng 8 nhấn — trống là của Claude',
    bo: ['ssa', 'ca-phao'],
  },
  {
    id: 'cp-ballad-de-em',
    ten: 'Ballad Để em',
    nhip: '4/4',
    phachO: 4,
    chuKy: 8,
    bpm: 85,
    nhipChon: nhipTu(85),
    nhipMacDinh: 85,
    oMacDinh: 2,
    o: [
      kick(0, 100),
      kick(1.75, 85),
      kick(3, 100),
      snare(1, 90),
      snare(3, 95),
      kick(4, 100),
      kick(4.25, 70),
      kick(4.75, 85),
      snare(5, 90),
      snare(7, 90),
      ...hatDeu(8, 0.5, (p) => (p % 1 === 0 ? 52 : 44)),
      ...[2.25, 2.75, 3.25, 3.75, 6.25, 6.75, 7.25, 7.75].map((p) => hat(p, 36)),
    ],
    khung: 'Bùm₁ chát₂ bùm₂a BÙM₄ | Bùm₁ bum₁e bùm₁a chát₂ chát₄ — hi-hat móc đơn, thêm móc kép ở nửa sau mỗi ô',
    nguon:
      'dựng từ khung điệu Ballad Để em (đã duyệt): ô 1 "Bùm chát bùm → chát bum chát BÙM chát bum chát" (cú hai tay ở phách 1 · 4 — 23/30 · 24/30 ô sheet), ô 2 "bùm–bum chát bùm → đan tay → câu chạy": kick ở các bùm chính, snare ở chát phách 2 và cú hai tay phách 4, hi-hat móc kép ở chỗ hai tay đan và câu chạy — trống là của Claude',
    bo: ['ssa', 'ca-phao'],
  },
  {
    id: 'cp-ballad-co-em-cho',
    ten: 'Ballad Có Em Chờ',
    nhip: '4/4',
    phachO: 4,
    chuKy: 8,
    bpm: 75,
    nhipChon: nhipTu(75),
    nhipMacDinh: 75,
    oMacDinh: 2,
    o: [
      kick(0, 100),
      kick(1.75, 85),
      kick(2.25, 75),
      snare(1, 90),
      snare(3, 90),
      kick(4, 100),
      kick(5.75, 85),
      kick(6.5, 75),
      snare(5, 85),
      snare(7, 85),
      ...hatDeu(8, 0.5, (p) => (p % 1 === 0 ? 52 : 44)),
      ...[6.25, 6.75, 7.25, 7.75].map((p) => hat(p, 36)),
    ],
    khung: 'Bùm₁ chát₂ bùm₂a bum₃e chát₄ | Bùm₁ chát₂ bùm₂a bum₃& chát₄ — hi-hat móc đơn, móc kép cuối câu',
    nguon:
      'dựng từ khung điệu Có Em Chờ (bass ngân 1 · 2a · 3e ô 1, 1 · 2a · 3& ô 2; tay phải ba nốt ở phách 2 · 4 ô 1; móc kép cuối câu): kick theo bass, snare phách 2 · 4 (ô 2 giữ cho đều nhịp — ô ấy tay phải chạy giai điệu), hi-hat móc đơn và móc kép cuối câu — trống là của Claude',
    bo: ['ssa', 'ca-phao'],
  },
  {
    id: 'cp-bossa',
    ten: 'Bossa',
    nhip: '4/4',
    phachO: 4,
    chuKy: 8,
    bpm: 110,
    nhipChon: nhipTu(110),
    nhipMacDinh: 110,
    oMacDinh: 2,
    o: [
      kick(0, 95),
      kick(1.5, 85),
      kick(2, 60),
      kick(4, 90),
      kick(5.5, 85),
      vanh(1, 85),
      vanh(2.5, 80),
      vanh(3.5, 75),
      vanh(4.5, 75),
      vanh(6, 80),
      vanh(7, 95),
      ...hatDeu(8, 0.5, (p) => (p % 1 === 0 ? 48 : 40)),
    ],
    khung: 'Bùm chát Bùm-bum chát chát | bùm chát bùm chát CHÁT — kick theo bùm, gõ vành theo chát, hi-hat móc đơn',
    nguon:
      'dựng từ 11 tiếng của điệu Bossa CP cải tiến (đã duyệt 13/9/2026): bùm → kick (ô 1 phách 1 · 2& · bum 3; ô 2 phách 1 · 2&), chát → gõ vành (ô 1 phách 2 · 3& · 4&; ô 2 phách 1& · 3 · CHÁT 4), hi-hat móc đơn — trống là của Claude',
    bo: ['ssa', 'ca-phao'],
  },
  {
    id: 'ln-slow-rock',
    ten: 'Slow Rock Lá thư',
    nhip: '6/8',
    phachO: 6,
    chuKy: 6,
    bpm: 86,
    nhipChon: nhipTu(86),
    nhipMacDinh: 86,
    oMacDinh: 1,
    o: [kick(0, 100), snare(3, 90), ...HAT_68.map((l, i) => hat(i, l))],
    khung: 'Bùm₁ · chát₄ — hi-hat đều 6 móc đơn (nhấn tiếng 1 · 4)',
    nguon:
      'dựng từ khung điệu Slow Rock Lá thư (sóng rải 6 móc đơn mỗi ô, nhấn tiếng 1 · 4; trái gốc–5–8, phải 10–12–10): tiếng 1 (bass) → kick, tiếng 4 (tay phải vào) → snare, mỗi tiếng rải → hi-hat — trống là của Claude',
    bo: ['linh-nhi'],
  },
  {
    id: 'blues-twist',
    ten: 'Twist',
    nhip: '4/4',
    phachO: 4,
    chuKy: 4,
    bpm: 140,
    nhipChon: nhipTu(140),
    nhipMacDinh: 140,
    oMacDinh: 2,
    o: [
      kick(0, 100),
      kick(2, 100),
      snare(1, 95),
      snare(5 / 3, 75),
      snare(3, 95),
      ...[0, 2 / 3, 1, 5 / 3, 2, 8 / 3, 3, 11 / 3].map((p, i) => hat(p, i % 2 ? 42 : 55)),
    ],
    khung: 'Bùm₁ chát₂ chát₂& Bùm₃ chát₄ — hi-hat móc đơn swing 2:1',
    nguon:
      'khung đo từ nền trống video PianoStyles Twist (30/9/2026: trống cái 1 · 3, snare 2 · 2& · 4); swing 2:1 như điệu Twist của app (♩ 140) — lực là của Claude',
    bo: ['blues'],
  },
  {
    id: 'blues-slow-blues',
    ten: 'Slow Blues',
    nhip: '6/8',
    phachO: 6,
    chuKy: 6,
    bpm: 92,
    nhipChon: nhipTu(92),
    nhipMacDinh: 92,
    oMacDinh: 1,
    o: [kick(0, 100), kick(5, 65), snare(3, 90), ...HAT_68.map((l, i) => hat(i, l))],
    khung: 'Bùm₁ · chát₄ · bum₆ — hi-hat đều 6 móc đơn',
    nguon:
      'dựng từ khung điệu Slow Blues (mẫu The House of the Rising Sun — tay trái bass phách 1, hợp âm phách 4, bass dẫn nửa cung phách 6): bass → kick, hợp âm → snare, bass dẫn → kick nhẹ, hi-hat mỗi móc đơn — trống là của Claude',
    bo: ['blues'],
  },
]

/** Ký hiệu nhịp độ: 6/8 của app đếm móc đơn (♪), còn lại nốt đen (♩). */
export const kyHieuNhip = (beat: Pick<BeatNen, 'nhip'>) => (beat.nhip === '6/8' ? '♪' : '♩')

/** Trống một chu kỳ của `beat`, xếp theo thời điểm. */
export function nenBeat(beat: BeatNen): ScheduledHit[] {
  return beat.o
    .map((x) => ({ notes: [x.m as MidiNote], startBeat: x.phach, durationBeats: 0.25, velocity: x.luc, trong: true }))
    .sort((a, b) => a.startBeat - b.startBeat)
}

/**
 * Nguồn cho `startTimelineLoop` (chu kỳ `L` phách): lượt đầu là `d` tiếng hi-hat đếm vào rồi trống dời `d` phách; các lượt sau là trống
 * xoay vòng `d` phách — trống hai ô vẫn nối đúng ô 1 → ô 2 sau lượt đếm vào (không xoay thì ô 1 lặp hai lần). `L` phải ≥ `d`.
 */
export function nguonNenBeat(nen: readonly ScheduledHit[], d: number, L: number): (luot: number) => ScheduledHit[] {
  const dem: ScheduledHit[] = Array.from({ length: d }, (_, k) => ({ notes: [42 as MidiNote], startBeat: k, durationBeats: 0.25, velocity: k === 0 ? 110 : 90, trong: true }))
  const doi = nen.map((h) => ({ ...h, startBeat: h.startBeat + d }))
  const sau = doi.map((h) => ({ ...h, startBeat: h.startBeat % L })).sort((a, b) => a.startBeat - b.startBeat)
  return (luot) => (luot === 0 ? [...dem, ...doi.filter((h) => h.startBeat < L)] : sau)
}

/**
 * Vòng chơi trên nền beat: `soCau` hợp âm do `chon` chọn lần lượt (truyền id hợp âm vừa rồi để không lặp), mỗi hợp âm `oMoiHop` ô. Nền là
 * MỘT chu kỳ trống lặp mãi (`chuKyNen`) — mỗi lượt chỉ dựng chục tiếng thay vì cả vòng; đếm vào đúng một ô. Nền không có hoà âm nên hợp âm
 * nào đặt lên cũng khớp.
 */
export function vongBeat(chon: (truoc: string | null) => CauSsa, ten: string, beat: BeatNen, oMoiHop: number, soCau: number): VongNen {
  const cau: CauSsa[] = []
  let truoc: string | null = null
  for (let i = 0; i < soCau; i++) {
    const c = chon(truoc)
    cau.push(c)
    truoc = c.id
  }
  const nhip = cau.map(() => beat.phachO * oMoiHop)
  return { ten: `${ten} · ${beat.ten}`, cau, nhip, nen: nenBeat(beat), demTrong: true, chuKyNen: beat.chuKy, demVao: beat.phachO, kyHieuNhip: kyHieuNhip(beat) }
}

/** Màn quy tắc `mi` (lối chồng + chạy) trên nền beat. */
export const vongQuyTacBeat = (mi: number, goc: readonly number[], beat: BeatNen, oMoiHop: number, soCau: number, rand: () => number = Math.random): VongNen =>
  vongBeat((truoc) => chonCauQuyTacChong(mi, goc, new Map(), truoc, rand), `Màn ${mi + 1} · ${MAN_KHUNG[mi]!.ten}`, beat, oMoiHop, soCau)
