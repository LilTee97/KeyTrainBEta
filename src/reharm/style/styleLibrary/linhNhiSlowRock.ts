import type { RhythmHit, StylePattern } from '../types'

/*
  SLOW ROCK LÁ THƯ — đệm HAI TAY của Linh Nhi trong bản ký âm "Lá Thư Trần Thế" (Rê thứ).
  Nguồn: PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl, SHA-256 b45d3f75…

  SHEET GHI 4/4 ♩=86 NHƯNG NHẠC LÀ 12/8 (số đo 24/9/2026):
  - Nốt trầm nhất mỗi ô 4/4 rơi đều bốn phách (24 · 25 · 21 · 20, n=92 ô hát).
  - Bass rơi cùng pha chu kỳ 6 móc đơn ở 75/98 lần; hai bass cách nhau hay gặp nhất
    6 móc đơn (36 lần). → Một ô ở đây = một hợp âm = 6 móc đơn chùm ba; `gridUnit`
    0,5 và BPM 86 giữ đúng tempo sheet (♩. ≈ 57).
  "c22" = ô 6 móc đơn thứ 22 tính theo pha ấy, không phải số ô sheet.

  TÁCH GIAI ĐIỆU KHỎI TAY PHẢI (luật đếm): cú gõ ≥3 nốt, đỉnh ≤ Bb4 = hợp âm đệm;
  cú gõ 2 nốt = giai điệu trên + bè dưới (giữ bè nếu cách ≥3 nửa cung, ≤ A4, không
  phải nhân quãng tám); nốt đơn = giai điệu, trừ khi gõ lại đúng nốt bè vừa giữ.
  Sau khi bỏ giai điệu, tay phải còn đệm ở 39/94 ô phiên và 19/30 ô điệp; tiếng tay
  phải đệm trùng mốc tay trái 56 lần, chen khe tay trái 33 lần (phiên).

  Lực: `velocityScale` = thuộc tính `dynamics` của cú gõ trong sheet ÷ 80 (số đo).
*/
const common = {
  family: 'slow-rock-la-thu',
  familyName: 'Slow Rock Lá thư',
  timeSignature: '6/8',
  beatsPerMeasure: 6,
  gridUnit: 0.5,
  bpm: 86,
  feel: 'straight-block-chord' as const,
  verified: true,
  // Trường độ ghi trong sheet phát đủ, không xén. Biên soạn, như Ballad CP theo bài.
  releaseRatio: 1,
  // Cụm dập điệp khúc lên tới bậc 5 + quãng tám: gốc Si ra Fa thăng 4 (66).
  leftHandTop: 67,
  // Tay phải đặt gốc từ Son 3 (55) lên, các bậc ngay trên gốc: A ra A3/C#4/E4/A4,
  // D7 ra nốt bè A4 · D4, Gm ra D4 — đúng từng nốt sheet. Gốc Đô–Fa thăng thì
  // hợp âm lên tới 72–78, cao hơn vùng A3–A4 của sheet: sheet chỉ có A và G ở
  // cử chỉ này nên chưa biết chị bấm các gốc kia thế nào. Biên soạn.
  rightHandRegister: { rootFloor: 55, low: 55, high: 79 },
}

const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number,
  tones: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, tones })
const octave = [tone(0), tone(0, 12)]
// Bậc 3 · 5 · 8 trên gốc — thế tay phải c22 khi bỏ nốt gốc.
const triadUp = [tone(1), tone(2), tone(0, 12)]

/*
  PHIÊN — c22 (A7, ô sheet 17 phách 2), lặp y hệt tay phải ở c93 (phiên 3).
  Cử chỉ hai tay lặp nhiều nhất bài: lõi tay phải {2, 2½, 3, 4} có ở c7, c22, c23,
  c39, c70, c93, c105. Tay trái bass, tay phải trả lời ngay sau:
    tay trái  A2/A3 · A2 · A2/A3 · A2 · E2/E3 · A2/A3
    tay phải   —    · A3/C#4/E4/A4 ×2 (móc kép) · C#4/E4/A4 · C#4/E4/A4 ngân
  Bỏ E4 tay phải ở tiếng 1: nốt cuối của câu hát.
  Tiếng 3 · 4 tay phải BỎ nốt gốc (C#4/E4/A4) đúng như sheet: tay trái đang gõ
  quãng tám A2/A3 ở tiếng 3, hai tay không gõ trùng một phím.
  Tiếng 5 khai E3 đơn thay cho E2/E3: bậc 5 DƯỚI gốc rơi dưới sàn tay trái (36) ở
  các giọng Đô–Mi và bị gập thành nốt trùng. Biên soạn.
  Tay trái rải 1–3–5–8–5–3 (c15–c16) của bản trước là lúc tay phải đang HÁT —
  không phải cách chị đệm hai tay, nên không dùng ở đây.
*/
const laThu: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu',
  name: 'Slow Rock Lá thư · Phiên khúc',
  variant: 1,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c22 = ô ký âm 17 phách 2 → 18 phách 1 (A7); lặp ở c93'],
  note: 'Phiên: tay trái bass quãng tám từng móc đơn chùm ba, tay phải dập 1–3–5–8 ở tiếng 2 · 2½, 3–5–8 ở tiếng 3 rồi ngân từ tiếng 4. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 6,
    left: [
      hit(0, 1, .96, octave), hit(1, 1, .79, [tone(0)]), hit(2, 1, .86, octave),
      hit(3, 1, .96, [tone(0)]), hit(4, .5, 1.05, [tone(2)]), hit(5, .5, 1.14, octave),
    ],
    right: [
      hit(1, .5, .84, [tone(0), ...triadUp]), hit(1.5, .5, .8, [tone(0), ...triadUp]),
      hit(2, .5, .89, triadUp), hit(3, 2, 1.13, triadUp),
    ],
  },
}

// Cụm dập trên hợp âm bảy: gốc+8, bậc 3, bậc 7. Hợp âm ba nốt thì bậc 7 lùi về
// bậc 5 (DEGREE_CHAIN), nên không đẻ nốt trùng. Sheet có cả A3 lẫn C4 trên D7;
// bỏ A3 là lựa chọn biên soạn để một khai báo đúng cho cả hai loại hợp âm.
const pulse = [tone(0, 12), tone(1, 12), tone(3, 12)]
// Cụm dập trên hợp âm ba nốt ở c42 Gm: D3 G3 Bb3 D4.
const triad = [tone(2), tone(0, 12), tone(1, 12), tone(2, 12)]

/*
  ĐIỆP — c41–c42 (D7 → Gm, ô sheet 32 phách 1 → 33 phách 3); c45–c46 cùng lối cả
  hai tay, cao trào c106/c109 lặp phần tay trái.
  Tay trái: bass, dập cụm hợp âm theo từng móc đơn, bass lại ở tiếng 6.
  Tay phải: GIỮ nốt bè ngón cái, BỎ giai điệu D5 · C5 · Bb4 · A4 · G4 phía trên nó:
    c41  A4 ngân từ tiếng 1 (dưới D5) · D4 vào ở 5½ (dưới C5)
    c42  D4 tiếng 1 (dưới Bb4) · D4 gõ lại một mình ở 2½
  c45 cùng mốc (bè tiếng 1, gõ lại 2 · 2½, bè 5½); c46 bè tiếng 1, gõ lại 2½.
*/
const laThuChorus: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu-chorus',
  name: 'Slow Rock Lá thư · Điệp khúc',
  variant: 2,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c41–c42 = ô ký âm 32 phách 1 → 33 phách 3 (D7, Gm); cùng lối c45–c46, cao trào c106'],
  note: 'Điệp: tay trái bass rồi dập hợp âm theo móc đơn chùm ba; tay phải giữ nốt bè dưới giai điệu, gõ lại xen nhịp dập. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 12,
    left: [
      // c41 D7
      hit(0, .75, 1.08, [tone(0)]),
      hit(1, .5, .8, [tone(0), ...pulse]),
      hit(1.5, .5, .84, pulse), hit(2, .5, .86, pulse),
      hit(2.5, .5, .71, [tone(1, 12)]),
      hit(3, 1, .96, pulse), hit(4, 1, .86, pulse),
      hit(5, .75, 1.11, [tone(0)]),
      // c42 Gm. Bỏ D2 ở tiếng đầu: đó là gốc của D7 ngân nối sang, không phải bậc của Gm.
      hit(6, 1, 1, octave),
      hit(7, .5, .86, [tone(2), tone(1, 12), tone(2, 12)]),
      hit(7.5, .5, .9, [tone(0), tone(2), tone(1, 12)]),
      hit(8, 1, .9, triad),
      hit(9, 1, .95, [tone(0), ...triad]),
      hit(10, 1, .79, triad),
      hit(11, 1, .91, octave),
    ],
    right: [
      hit(0, 4, 1.11, [tone(2)]), hit(4.5, 1.5, 1.15, [tone(0)]),
      hit(6, 1.5, 1.13, [tone(2)]), hit(7.5, .5, .9, [tone(2)]),
    ],
  },
}

export const LINH_NHI_SLOW_ROCK: readonly StylePattern[] = [laThu, laThuChorus]
