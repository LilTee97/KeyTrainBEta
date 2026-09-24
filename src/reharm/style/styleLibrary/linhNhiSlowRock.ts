import type { RhythmHit, StylePattern } from '../types'

/*
  SLOW ROCK LÁ THƯ — đệm của Linh Nhi trong bản ký âm "Lá Thư Trần Thế" (Rê thứ).
  Nguồn: PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl, SHA-256 b45d3f75…

  SHEET GHI 4/4 ♩=86 NHƯNG NHẠC LÀ 12/8 (số đo 24/9/2026):
  - Nốt trầm nhất mỗi ô 4/4 rơi đều bốn phách (24 · 25 · 21 · 20, n=92 ô hát) —
    vạch nhịp 4/4 không bám chỗ đổi hợp âm.
  - Tay trái đi từng cụm 6 móc đơn cho một hợp âm: bass rơi cùng pha chu kỳ 6
    móc đơn ở 75/98 lần, khoảng cách hai bass hay gặp nhất là 6 móc đơn (36 lần).
  → Móc đơn ký âm = móc đơn chùm ba thật. Điệu khai 6/8, một ô = một hợp âm = 6
    móc đơn, `gridUnit` 0,5 và BPM 86 để giữ đúng tempo sheet (♩. ≈ 57).
  Ô "c15" dưới đây là ô 6 móc đơn thứ 15 tính theo pha ấy, không phải số ô sheet.

  HAI TAY (đếm trên ô hát đã cắt lại):
  - Phiên khúc 94 ô: tay phải 64% là nốt đơn — giai điệu lời, ngân dài; tay trái
    rải ở 62/91 ô. Tay phải chỉ bấm hợp âm ở 12/94 ô, toàn ở cuối câu.
  - Điệp khúc 30 ô: tay trái tự dập hợp âm ở 5/30 ô (phiên 5/91); tay phải vẫn
    là giai điệu, chồng thêm nốt bè chạy theo đúng nhịp giai điệu.
  → Nền đệm lặp lại là TAY TRÁI MỘT MÌNH. Tay phải để trống: mọi nốt tay phải
    trong các ô chọn dưới đây là giai điệu hoặc bè đi theo giai điệu.
  Cử chỉ hai tay cuối câu (tay phải dập hợp âm, tay trái quãng tám bass rồi đi
  xuống — c7, c22, c39) CHƯA đưa vào: nó phụ thuộc vị trí câu, không phải nền.

  Lực: `velocityScale` = thuộc tính `dynamics` của nốt trong sheet ÷ 80 (số đo).
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
}

const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number,
  tones: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, tones })

const laThu: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu',
  name: 'Slow Rock Lá thư · Phiên khúc',
  variant: 1,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c15–c16 = ô ký âm 12 phách 3 → 14 phách 1 (Bb, C); c15 lặp y hệt ở c87'],
  note: 'Phiên: tay trái rải 1–3–5–8–5–3, sáu móc đơn chùm ba mỗi hợp âm; tay phải để trống cho giai điệu. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 12,
    left: [
      // c15 Bb: Bb2 D3 F3 Bb3 F3 D3. Lực = trung bình c15 và c87 (cùng nốt, cùng nhịp).
      hit(0, 1, .84, [tone(0)]), hit(1, 1, .51, [tone(1)]), hit(2, 1, .69, [tone(2)]),
      hit(3, 1, .75, [tone(0, 12)]), hit(4, 1, .7, [tone(2)]), hit(5, 1, .67, [tone(1)]),
      // c16 C: C3 E3 G3 C3/C4 G3 E3 — tiếng 4 bấm gốc kèm quãng tám.
      hit(6, 1, .66, [tone(0)]), hit(7, 1, .88, [tone(1)]), hit(8, 1, .85, [tone(2)]),
      hit(9, 1, .68, [tone(0), tone(0, 12)]), hit(10, 1, .64, [tone(2)]), hit(11, 1, .86, [tone(1)]),
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

const laThuChorus: StylePattern = {
  ...common,
  id: 'slow-rock-la-thu-chorus',
  name: 'Slow Rock Lá thư · Điệp khúc',
  variant: 2,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c41–c42 = ô ký âm 32 phách 1 → 33 phách 3 (D7, Gm); cùng cử chỉ c45–c46, cao trào c106'],
  note: 'Điệp: bass rồi tay trái dập hợp âm theo móc đơn chùm ba, bass lại ở tiếng 6. Tay phải để trống cho giai điệu. Chờ nghe duyệt.',
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
      hit(6, 1, 1, [tone(0), tone(0, 12)]),
      hit(7, .5, .86, [tone(2), tone(1, 12), tone(2, 12)]),
      hit(7.5, .5, .9, [tone(0), tone(2), tone(1, 12)]),
      hit(8, 1, .9, triad),
      hit(9, 1, .95, [tone(0), ...triad]),
      hit(10, 1, .79, triad),
      hit(11, 1, .91, [tone(0), tone(0, 12)]),
    ],
    right: [],
  },
}

export const LINH_NHI_SLOW_ROCK: readonly StylePattern[] = [laThu, laThuChorus]
