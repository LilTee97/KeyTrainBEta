import type { RhythmHit, StylePattern } from '../types'

/*
  ĐÃ XOÁ nút Blues Claude (cùng Blues Đức Thịnh, Blues Codex 1) — người dùng 29/9/2026: *"Điệu Blues Sun đã ổn, hãy lưu lại và
  đổi tên nút thành Điệu Slow Blues … Xóa những điệu Blues khác cũng như là nút của chúng"*. Còn lại một nút: SLOW BLUES (id
  `blue-sun`, cuối file). Phần dưới giữ làm hồ sơ số đo nhịp 6/8 — `chung` (lưới, tầm, fill) vẫn là nền của Slow Blues.

  BLUES CLAUDE — nút riêng của Claude (27/9/2026). Người dùng: *"Học từ video trên của thầy Đức Thịnh để nắm tiết tấu đệm
  Blues và sau đó làm thành nút Blues Claude"* · *"Chơi theo phong cách Blues là vừa đệm vừa có những câu chạy nốt chèn vào
  tiết tấu"*. Không chung id/family với Blues Đức Thịnh (người dùng: "quá dở") hay Blues Codex 1. Chi tiết số đo:
  `Reference/BLUES-CLAUDE.md`.

  NHỊP — số đo video KN9JEiQXAHs ("CÁCH CHƠI BLUES | VẬY LÀ MÌNH XA NHAU", Đức Thịnh; MIDI chép bằng máy): đoạn bài hát
  05:00–10:40 cú gõ cách nhau ~0,33 s (móc đơn chùm ba), bè trầm ~1 s (phách chấm dôi) → 12/8, ♩. ≈ 60–62 (15 khung 20 s).
  `gridUnit` 0,5: móc đơn = 30/bpm s → bpm 90 cho móc đơn 0,33 s. Lời thầy (phụ đề máy): "đánh nó chiu chiu, … nó xoay xoay
  và nó chậm chậm chứ nó không có rõ ra slow rock". Không đặt `feel: 'swing'`: kiểu swing của app dời nốt giữa nốt đen ra ⅔ —
  méo lưới 6/8; lưới chùm ba ĐÃ là cái lắc.

  NHỊP 6/8, MỖI HỢP ÂM 6 PHÁCH (lượt 2) — người dùng: *"Hướng tiết tấu đệm về nhịp 6/8, phách 1 và 4 là phách chính …
  Đánh 6 phách là chuyển hợp âm."* Cell = MỘT ô 6/8 (6 móc đơn) = một hợp âm = một NỬA ô 4/4 swing của Rockhouse.

  CHỈ ĐÁNH RÕ PHÁCH 1 VÀ 4 (lượt 4) — người dùng 28/9/2026: *"Tuy là tiết tấu 6 phách nhưng trong video thì thầy Đức Thịnh
  gần như đánh rõ chỉ 2 phách 1 và 4 còn các phách còn lại thì nhường chỗ cho đánh giai điệu hoặc chạy, miễn sao đủ 6 phách"*.

  Số đo video KN9JEiQXAHs, đoạn dạo 04:34–05:02 (15 ô 6/8, dò phách bằng librosa, 75% cú khớp lưới — đoạn sạch nhất; đoạn
  thầy vừa đàn vừa hát 02:42–03:50 lẫn giọng, bass rơi đều cả 6 tiếng 75–87%, chỉ 54% cú khớp lưới — không đọc được):
    bass       tiếng 1 73% · 2 0% · 3 20% · 4 66% · 5 26% · 6 33%
    hợp âm     tiếng 1 6% · 2 0% · 3 6% · 4 46% · 5 0% · 6 6%
    nốt đơn    tiếng 1 100% · 2 20% · 3 60% · 4 60% · 5 80% · 6 86%   (giai điệu, láy Bb→B, F→F#→G)
  Từng nốt: phách 1 bass thường QUÃNG TÁM (ô 4 C#2+C#3 · ô 6 Bb1+Bb2 · ô 9 C#2+C#3), phách 4 bass MỘT nốt cùng gốc (C#3 ·
  Bb2), có lúc kèm hợp âm (ô 5 F3-Ab3-C#4). Rockhouse cùng chiều: tay trái gốc phách 1 116/147 · gốc phách 4 87/137.
  → Bùm₁ (bass quãng tám, mạnh nhất) – – Chát₄ (bass + hợp âm 3-5-b7, mạnh nhì) – – : phách 2 · 3 · 5 · 6 để cho giọng hát,
  câu chèn (đoạn hát) hoặc câu của Ray (dạo · giang · kết). Điệp khúc: dặm thêm hợp âm ở phách 1 (người dùng: "có thể dặm
  hợp âm ở các phách mạnh").

  Cũ, đã bị bác: lượt 3 sóng rải hai tay lấp đủ 6 móc đơn (trái gốc₁ · gốc₄ · 3₆, phải 3₂ · 5₃ · đỉnh₄ · 5₅, `raiNoi`, sàn
  tay phải 48); lượt 2 bass quãng tám phách 1 và 4 lực 1,35 · 1,3 + hợp âm 3-5-b7 phách 1 và 4 lực 1,1 · 1,05 + bậc 3 phách 6.

  CÂU CHÈN và DẠO · GIANG · KẾT — Bộ Soạn Blues (`boSoanBlues.ts`): chỗ fill/run đặt tay phải nguyên một nửa ô Rockhouse,
  không chạy bè trầm (`fillBassChance` 0), ô fill rộng một ô 6/8 (`fillBeats` 3 = 6 móc đơn); hợp âm tay phải nhường câu
  (`nhuongTayPhai`). Dạo · giang · kết lấy tay trái từ cell này.
*/
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number, tones: RhythmHit['tones']): RhythmHit =>
  ({ beat, durationBeats, velocityScale, tones })
const chung = {
  timeSignature: '6/8',
  beatsPerMeasure: 6,
  gridUnit: 0.5,
  bpm: 90,
  feel: 'straight-block-chord' as const,
  releaseRatio: 1,
  verified: true,
  fillBassChance: 0,
  fillBeats: 3,
  leftHandTop: 60,
  rightHandRegister: { rootFloor: 55, low: 55, high: 76 },
  sourceVideos: [
    'KN9JEiQXAHs — Đức Thịnh, CÁCH CHƠI BLUES | VẬY LÀ MÌNH XA NHAU (dạo 04:34–05:02: bass phách 1 · 4, hợp âm phách 4, còn lại giai điệu)',
    'Rockhouse — Ray Charles, bản ký âm (212 nửa ô ô 8–114: tay trái gốc phách 1 và 4, riff hợp âm, câu nốt)',
  ],
}

/*
  SLOW BLUES — nút cũ tên BLUE SUN (28/9/2026); người dùng duyệt và đổi tên 29/9/2026 (id `blue-sun` giữ nguyên cho bài đã lưu).
  Người dùng: *"hãy phân tích kỹ lại sheet House of the rising sun học tiết tấu đệm và tạo nút
  mới tên Blue Sun. Nhớ chú ý phân tích tác giả đã phối hợp của 2 tay để chơi 6 phách như thế nào. Trong lúc đệm tác giả cũng
  chạy ngón chứ ko đơn thuần dặm hợp âm"* · *"riff có được dùng nhiều trong các sheet Blues ko, nếu có hãy thêm vào"*.
  Nguồn: *The House of the Rising Sun – Slow Blues Piano Solo* (Songscription), bản SHEET SẠCH
  `PianoBrain/exports/songscription/The-House-of-the-Rising-Sun.mxl` — KHÔNG dùng bản căn âm thanh (cú gõ lệch lưới 6/8).
  Thay nút con "Blues Claude · Rising Sun (nghe thử)" lượt trước (chỉ có tay trái; chưa ai nghe).

  HAI TAY CHƠI 6 PHÁCH (`scripts/phan_tich_rising_sun.py`, 14 ô 6/8 đầy đủ):
    · TAY TRÁI là khung — phách 1 bass gốc 14/14 (kèm b7 4 · kèm 3 4, ngân ≈ 3 phách) · phách 4 HỢP ÂM trong tay trái 14/14
      (hợp âm 13/14, ngân ≈ 1 phách) · phách 6 bass cách gốc ô sau nửa cung 9/14 (nửa cung 8/8).
    · TAY PHẢI CHẠY NGÓN — trung vị 9 cú/ô, lưới móc kép chùm ba; vào cùng bass ở phách 1 14/14, chạy XUYÊN qua phách 4 (gõ cùng
      hợp âm tay trái 10/14), hay đáp ở phách 6; tầng G4–G7, tay trái E1–E4 — không vướng nhau. Nốt bám CHỦ ÂM: âm giai blues
      thứ Mi trên mọi hợp âm (trên C7 vẫn B–E–Bb). Mỗi ô một kiểu: câu chạy 6 ô · riff 5 ô · câu thưa 5 ô (16 ô).
  RIFF (hình 2–4 nốt lặp liền ≥ 3 lần, `scripts/phan_tich_riff_blues.py`): Rising Sun 5/16 ô (E–G ×3, E–B ×5, A–Bb–B–D ×4, G–E
  ×3, E–G ×9 — ô 9 → 10 riff chạy xuyên chỗ đổi Em → G7); Rockhouse 0/107 ô lặp trong ô, nhưng vòng 9 (ô 103–110) lặp một
  hình nửa đầu ô 8 ô liền; Robert gần như không (2/106).

  ĐIỆU: tay trái như trên (phách 1 gốc + b7 nếu có · phách 4 b7-gốc-3-5 quãng tám trên bass · phách 6 gốc hợp âm SAU hạ nửa
  cung, chỉ khi hợp âm sau vào đúng vạch — `som` + `requireNextChord`); tay phải của cell trống — câu chạy ngón mỗi ô do Bộ Soạn
  Blues đặt (`chayBlueSun`, kho `blueSunO.json` = tay phải nguyên từng ô Rising Sun, theo thời gian thật của bản căn âm thanh).
  Lực tay trái (biên soạn): phách 1 1,2 → 82 · phách 4 1,05 → 71 · phách 6 0,75 → 51. Điệp khúc: bass phách 1 kèm quãng tám.
*/
const bay = { ...tone(3), optional: true }
const traiBlueSun = (goc: RhythmHit['tones']): RhythmHit[] => [
  hit(0, 3, 1.2, goc),
  hit(3, 1, 1.05, [bay, tone(0, 12), tone(1, 12), tone(2, 12)]),
  { ...hit(5, 1, .75, [tone(0, -1)]), som: true, requireNextChord: true },
]

export const BLUE_SUN: StylePattern = {
  ...chung,
  id: 'blue-sun',
  name: 'Slow Blues',
  family: 'blue-sun',
  familyName: 'Slow Blues',
  variant: 1,
  // ♩ ≈ 92: tốc độ thật của tiếng thu (ô 6/8 dài trung vị 1,97 s, bản căn âm thanh — `phan_tich_rising_sun.py --that`).
  // Cũ: 97 (số in trên sheet bản dựng từ ảnh) — triệu chứng để lùi: nghe chậm, lê.
  bpm: 92,
  // Hợp âm phách 4 tay trái lên tới bậc 5 quãng tám trên (D4 trên G, E4 trên A) — Rising Sun ô 3: G3-A3-C#4-E4.
  leftHandTop: 66,
  sourceVideos: ['The House of the Rising Sun – Slow Blues Piano Solo (Songscription), bản sheet sạch .mxl — 16 ô'],
  note: 'Slow Blues (mẫu The House of the Rising Sun): tay trái bass phách 1, hợp âm phách 4, bass dẫn nửa cung phách 6; tay phải chạy ngón mỗi ô — câu chạy, riff, câu thưa — âm giai blues của chủ âm. Người dùng duyệt 29/9/2026.',
  cell: { lengthBeats: 6, left: traiBlueSun([tone(0), bay]), right: [] },
}

export const BLUE_SUN_CHORUS: StylePattern = {
  ...BLUE_SUN,
  id: 'blue-sun-chorus',
  name: 'Slow Blues · Điệp khúc',
  variant: 2,
  note: 'Điệp: như phiên, bass phách 1 kèm quãng tám cho dày. Người dùng duyệt 29/9/2026.',
  cell: { lengthBeats: 6, left: traiBlueSun([tone(0), tone(0, 12), bay]), right: [] },
}
