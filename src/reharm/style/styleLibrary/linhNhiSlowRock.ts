import type { RhythmCell, RhythmHit, StylePattern } from '../types'

/*
  SLOW ROCK LÁ THƯ — đệm HAI TAY của Linh Nhi trong bản ký âm "Lá Thư Trần Thế" (Rê thứ).
  Nguồn: PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl, SHA-256 b45d3f75…

  SHEET GHI 4/4 ♩=86 NHƯNG NHẠC LÀ 12/8 (số đo 24/9/2026):
  - Nốt trầm nhất mỗi ô 4/4 rơi đều bốn phách (24 · 25 · 21 · 20, n=92 ô hát).
  - Bass rơi cùng pha chu kỳ 6 móc đơn ở 75/98 lần; hai bass cách nhau hay gặp nhất
    6 móc đơn (36 lần). → Một ô ở đây = một hợp âm = 6 móc đơn chùm ba; `gridUnit`
    0,5 và BPM 86 giữ đúng tempo sheet (♩. ≈ 57).
  "c15" = ô 6 móc đơn thứ 15 tính theo pha ấy, không phải số ô sheet.

  HAI TAY — tay phải lúc HÁT là giai điệu lời: phiên 1 và phiên 3 cùng giai điệu khác
  lời, và tay phải tách/gộp nốt đúng theo âm tiết (c11 E4 · E4, c83 E4 ngân liền). Nên
  lúc hát phần đệm là TAY TRÁI; tay phải để trống cho giọng hát (ô `cell`).
  Hai tay cùng đệm ở chỗ LỜI NGHỈ — đúng chỗ app đặt câu fill — bằng cử chỉ c22 (ô
  `fillCell`). Người dùng nghe (24/9/2026): c22 lặp mọi hợp âm thì "không giống sheet",
  nhưng ở ô có fill thì "chơi rất hay"; tay phải bấm hợp âm lúc hát (tiếng 1 ngân 3)
  thì "trong sheet không đệm 2 tay như vậy".

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
  // Tay phải ô fill: gốc từ Son 3 (55), các bậc ngay trên gốc — A ra A3/C#4/E4/A4 như
  // sheet. Gốc Đô–Fa thăng lên tới 72–78, cao hơn vùng A3–A4 của sheet (sheet chỉ có A
  // và G ở cử chỉ này). Biên soạn.
  rightHandRegister: { rootFloor: 55, low: 55, high: 79 },
  // Hợp âm chia đôi ô: rải, không dặm (ý người dùng 24/9/2026). Cũ: không khai — hai cú dặm ba nốt
  // + đổi sang ô fill C22 (tay phải cũng dặm). Triệu chứng để lùi: chỗ đổi hợp âm giữa ô nghe mờ.
  raiHopAmChiaDoi: true,
}

const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number,
  tones: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, tones })
const octave = [tone(0), tone(0, 12)]
// Bậc 3 · 5 · 8 trên gốc — thế tay phải c22 khi bỏ nốt gốc.
const triadUp = [tone(1), tone(2), tone(0, 12)]

/*
  Ô CÓ FILL — c22 (A7, ô sheet 17 phách 2), tay phải lặp y hệt ở c93. Giữ nguyên số
  của `594e7f7`, bản người dùng khen fill: lúc bè trầm chạy câu fill (từ tiếng 4),
  tay phải giữ hợp âm ngân phía trên.
    tay trái  A2/A3 · A2 · A2/A3 · A2 · E3 · A2/A3
    tay phải   —    · A3/C#4/E4/A4 ×2 (móc kép) · C#4/E4/A4 · C#4/E4/A4 ngân
  Tiếng 3 · 4 tay phải bỏ nốt gốc đúng như sheet: tay trái đang gõ quãng tám A2/A3.
  Tiếng 5 khai E3 đơn thay E2/E3: bậc 5 dưới gốc rơi dưới sàn tay trái (36) ở giọng
  Đô–Mi, gập thành nốt trùng. Biên soạn.
*/
const C22: RhythmCell = {
  lengthBeats: 6,
  left: [
    hit(0, 1, .96, octave), hit(1, 1, .79, [tone(0)]), hit(2, 1, .86, octave),
    hit(3, 1, .96, [tone(0)]), hit(4, .5, 1.05, [tone(2)]), hit(5, .5, 1.14, octave),
  ],
  right: [
    hit(1, .5, .84, [tone(0), ...triadUp]), hit(1.5, .5, .8, [tone(0), ...triadUp]),
    hit(2, .5, .89, triadUp), hit(3, 2, 1.13, triadUp),
  ],
}

/*
  PHIÊN (lúc hát) — tay trái c15–c16 (Bb → C, ô sheet 12 phách 3 → 14 phách 1); c15 lặp
  y hệt ở c87. Rải 1–3–5–8–5–3, sáu móc đơn đều — nhịp tay trái nhiều nhất bài (25 ô).
  Tay phải trống.

  Giá trị trước: `594e7f7` phiên = c22 lặp mọi hợp âm; `5cfcb1e` thêm hợp âm tay phải
  ở tiếng 1 ngân 3 móc đơn. Người dùng bác cả hai (xem đầu file).
*/
const laThu: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu',
  name: 'Slow Rock Lá thư · Phiên khúc',
  variant: 1,
  fillCell: C22,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · hát: c15–c16 (ô ký âm 12 phách 3 → 14 phách 1); chỗ fill: c22 (ô 17), lặp ở c93'],
  note: 'Lúc hát: tay trái rải 1–3–5–8–5–3, tay phải để cho giọng. Chỗ có fill: hai tay như sheet chỗ lời nghỉ. Chờ nghe duyệt.',
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
    right: [],
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
  Tay phải trống. Sheet có nốt bè ngón cái dưới giai điệu (c41 A4, c42 D4 gõ lại ở 2½)
  nhưng nó đi theo nhịp giai điệu — cùng lý do như phiên. Giá trị trước (`594e7f7`,
  `5cfcb1e`): tay phải A4 ngân 4 · D4 ở 5½ · D4 · D4 ở 2½.
*/
const laThuChorus: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu-chorus',
  name: 'Slow Rock Lá thư · Điệp khúc',
  variant: 2,
  fillCell: C22,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c41–c42 = ô ký âm 32 phách 1 → 33 phách 3 (D7, Gm); cùng lối c45–c46, cao trào c106'],
  note: 'Điệp: tay trái bass rồi dập hợp âm theo móc đơn chùm ba; tay phải để cho giọng. Chỗ có fill: hai tay như sheet. Chờ nghe duyệt.',
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
    right: [],
  },
}

export const LINH_NHI_SLOW_ROCK: readonly StylePattern[] = [laThu, laThuChorus]
