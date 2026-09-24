import type { RhythmHit, StylePattern } from '../types'

/*
  SLOW ROCK LÁ THƯ — đệm HAI TAY của Linh Nhi trong bản ký âm "Lá Thư Trần Thế" (Rê thứ).
  Nguồn: PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl, SHA-256 b45d3f75…

  SHEET GHI 4/4 ♩=86 NHƯNG NHẠC LÀ 12/8 (số đo 24/9/2026):
  - Nốt trầm nhất mỗi ô 4/4 rơi đều bốn phách (24 · 25 · 21 · 20, n=92 ô hát).
  - Bass rơi cùng pha chu kỳ 6 móc đơn ở 75/98 lần; hai bass cách nhau hay gặp nhất
    6 móc đơn (36 lần). → Một ô ở đây = một hợp âm = 6 móc đơn chùm ba; `gridUnit`
    0,5 và BPM 86 giữ đúng tempo sheet (♩. ≈ 57).
  "c15" = ô 6 móc đơn thứ 15 tính theo pha ấy, không phải số ô sheet.

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
  // Nốt bè tay phải điệp khúc: gốc đặt từ Son 3 (55) lên, bậc ngay trên gốc —
  // D7 ra A4 · D4, Gm ra D4, đúng từng nốt sheet. Hợp âm tay phải ở phiên là thế
  // bấm dẫn giọng của app (57–69), khung này không làm dời nó.
  rightHandRegister: { rootFloor: 55, low: 55, high: 79 },
}

const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number,
  tones: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, tones })
const octave = [tone(0), tone(0, 12)]

/*
  PHIÊN — tay trái c15–c16 (Bb → C, ô sheet 12 phách 3 → 14 phách 1); c15 lặp y hệt ở c87.
  Tay trái rải 1–3–5–8–5–3, sáu móc đơn đều — nhịp tay trái nhiều nhất bài (25 ô).

  Hai tay phối hợp THẾ NÀO ở phiên (46 ô tay trái rải, bỏ các ô dập cuối câu):
  tay phải có tiếng ở tiếng 1 trong 42/46 ô, 32/42 lần ngân ≥2 móc đơn, trung vị
  ngân 3 móc đơn. Tức tay trái đi từng móc đơn, tay phải đặt một tiếng đầu ô rồi ngân.
  Nên tay phải ở đây: MỘT hợp âm ở tiếng 1, ngân 3 móc đơn, nhả đúng lúc tay trái
  lên quãng tám ở tiếng 4 (hai tay không đè một phím). Cao độ là thế bấm dẫn giọng
  của app — vùng A3–A4 như sheet (Dm A3/D4/F4 = c40, C C4/E4/G4 = c63) — KHÔNG
  mang nốt giai điệu F4/E4 mà sheet ngân ở chỗ này. Lực = lực tiếng 1 tay phải c15
  (trung bình với c87) và c16.

  Giá trị trước (`594e7f7`): phiên = c22, tay trái bass quãng tám từng móc đơn, tay
  phải dập ở 2 · 2½ · 3 · 4. Người dùng nghe: "tiết tấu đệm không còn giống sheet" —
  c22 là cử chỉ CUỐI CÂU (lõi có ở 7 ô), đem lặp mọi hợp âm là sai chỗ.
*/
const laThu: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu',
  name: 'Slow Rock Lá thư · Phiên khúc',
  variant: 1,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c15–c16 = ô ký âm 12 phách 3 → 14 phách 1 (Bb, C); c15 lặp y hệt ở c87'],
  note: 'Phiên: tay trái rải 1–3–5–8–5–3 sáu móc đơn chùm ba; tay phải đặt hợp âm ở tiếng 1 rồi ngân. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 12,
    left: [
      // c15 Bb: Bb2 D3 F3 Bb3 F3 D3. Lực = trung bình c15 và c87 (cùng nốt, cùng nhịp).
      hit(0, 1, .84, [tone(0)]), hit(1, 1, .51, [tone(1)]), hit(2, 1, .69, [tone(2)]),
      hit(3, 1, .75, [tone(0, 12)]), hit(4, 1, .7, [tone(2)]), hit(5, 1, .67, [tone(1)]),
      // c16 C: C3 E3 G3 C3/C4 G3 E3 — tiếng 4 bấm gốc kèm quãng tám.
      hit(6, 1, .66, [tone(0)]), hit(7, 1, .88, [tone(1)]), hit(8, 1, .85, [tone(2)]),
      hit(9, 1, .68, octave), hit(10, 1, .64, [tone(2)]), hit(11, 1, .86, [tone(1)]),
    ],
    right: [
      { beat: 0, durationBeats: 3, velocityScale: .9 },
      { beat: 6, durationBeats: 3, velocityScale: .86 },
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
