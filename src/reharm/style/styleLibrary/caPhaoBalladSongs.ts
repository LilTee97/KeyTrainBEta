import type { RhythmCell, RhythmHit, StylePattern } from '../types'

// Phrase reductions, not a transcription of the melody or a universal CP groove.
// Source bars and every editorial change: Reference/CA-PHAO-BALLAD-SONGS.md.
const common = {
  timeSignature: '4/4', beatsPerMeasure: 4,
  feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 67,
  cpBalladChordLeads: true,
}
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, tones: RhythmHit['tones'],
  velocityScale = .65): RhythmHit => ({ beat, durationBeats, tones, velocityScale })
const bass = (beat: number, duration: number) => hit(beat, duration, [tone(0)], .85)

const coEmCho: StylePattern = {
  ...common, id: 'ca-phao-ballad-co-em-cho',
  name: 'Có Em Chờ · Phiên khúc', family: 'ca-phao-ballad-co-em-cho',
  cpSoloSong: 'Co Em Cho',
  familyName: 'Ballad Có Em Chờ', variant: 1, bpm: 75,
  sourceVideos: ['Cà Pháo · Có Em Chờ · phiên ô XML 9–10; đối chiếu 17–18'],
  note: 'Phiên: bass ngân xen móc kép cuối câu. Hai ô 9–10, bè trong rút gọn; đã nghe duyệt 25/09/2026.',
  cell: {
    lengthBeats: 8,
    left: [
      bass(0, 1.5), bass(1.75, .5), bass(2.25, 1.5),
      bass(4, 1), hit(5, .75, [tone(1, 12)]), bass(5.75, .5),
      hit(6.25, .25, [tone(1, 12)]), bass(6.5, .25),
      hit(6.75, .25, [tone(2)]), hit(7, 1, [tone(0, 12)]),
    ],
    right: [
      hit(0, .5, [tone(3), tone(1)]), hit(1, .25, [tone(1), tone(2), tone(3)]),
      hit(1.25, .5, [tone(1)]), hit(1.75, .75, [tone(3), tone(1)]),
      hit(3, .25, [tone(1), tone(2), tone(3)]),
      hit(4, .5, [tone(3), tone(1)]), hit(4.5, .25, [tone(3)]),
      hit(4.75, .5, [tone(3)]), hit(5.25, .5, [tone(2)]),
      hit(5.75, 1.5, [tone(3)]),
    ],
  },
}

/*
  Để Em Rời Xa — soạn lại 25/9/2026 theo cách Codex dựng Ballad DERX (Reference/BALLAD-DERX.md). Đệm đã nghe duyệt 26/9/2026
  (bản 36); solo dạo · giang · kết đã nghe duyệt 26/9/2026 (lượt 4, ô tick `cpBalladThu`). Số đo: Reference/CA-PHAO-BALLAD-DE-EM.md, `scripts/audit_cp_de_em.py`.
  Beat đếm trên "cửa sổ k" = [ô XML k phách 2, ô XML k+1 phách 2): vạch nhịp sheet lệch nhạc một phách.

  Giữ NGUYÊN mốc gõ của DERX (phiên 4–5, điệp 24–25). Người dùng nghe DERX: "bám gần tiết tấu
  sheet" nhưng "thiếu tiếng và đứt quãng". Đo trên vòng của sheet: DERX phiên 2,50 nốt vang TB,
  im hẳn ở 1.5–1.75, tay phải trống 0.5–1.75 và 3.25–5; sheet đủ hai tay 3,00 nốt, im 0–1%.
  Chỗ trống ấy trong sheet là giai điệu lời. Hai sửa, KHÔNG thêm cú gõ nào:
  1. Ngân nối: mỗi nốt ngân tới cú gõ kế của cùng tay (renderer tự cắt ở chỗ đổi hợp âm).
     Sheet không ghi pedal — độ ngân dài là biên soạn. Ghi `sheet d` cạnh từng cú để lùi.
  2. Cú tay phải vốn là cụm hai nốt trong sheet thì trả đủ hai nốt (DERX rút còn nốt dưới).
     Nốt trên là cao độ giai điệu ở chỗ ấy, nhưng chỉ ở cú có bè — không chép nhịp giai điệu.
*/
// Tay trái dưới câu solo (dạo · giang · kết), chép khuôn tay trái trong CHÍNH các đoạn solo của sheet (giang tấu ô thật
// 28–29; `scripts/audit_cp_ballad_solo_hoc.py`, `tools/cp_ballad_solos.py` đã nắn vạch nhịp). n = 15 ô solo của bài:
// - ô hai hợp âm (bVI → bVII), ô 28: phách 1 gốc thấp + 5 + 8, 5₃ ở 1&, 8 ở 2, gốc lại ở phách 3, 5₃ gõ tới cuối ô;
// - ô một hợp âm (i), ô 29 (cùng khuôn ở dạo ô 1 · 3): gốc thấp, 8 NGÂN hai phách, 5₃ ở 3& và 4.
// Tay trái thưa và ngân để tay phải chạy trên nền bass — khác hẳn đệm hát (walking, câu chạy).
const DE_EM_SOLO_LEFT: RhythmCell = {
  lengthBeats: 8,
  right: [],
  left: [
    hit(0, .5, [tone(0), tone(2, 12), tone(0, 12)], .85), hit(.5, .5, [tone(2, 12)]), hit(1, 1, [tone(0, 12)]),
    hit(2, .5, [tone(0), tone(0, 12)], .8), hit(2.5, .5, [tone(2, 12)]), hit(3, .5, [tone(2, 12)]), hit(3.5, .5, [tone(2, 12)]),
    hit(4, .5, [tone(0)], .85), hit(4.5, 2, [tone(0, 12)]), hit(6.5, .5, [tone(2, 12)]), hit(7, 1, [tone(2, 12)]),
  ],
}
const deEmCommon = {
  timeSignature: '4/4', beatsPerMeasure: 4, feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 59,
  rightHandRegister: { rootFloor: 55, low: 60, high: 74 },
  soloCell: DE_EM_SOLO_LEFT,
  // Solo chọn cử chỉ theo chất liệu sheet (người dùng 26/9: "quá nhiều chỗ dặm hợp âm, còn ít chỗ chạy nốt").
  cpSoloSheetTexture: true,
  // Mô phỏng câu solo full khoá đúng bài gốc (người dùng 26/9: nút Để em mô phỏng ra câu Chưa Bao Giờ — thiếu trường này thì
  // mô phỏng lấy đoạn dài nhất cùng điệu/giọng). Soạn câu mới cũng ưu tiên nhẹ vật liệu bài này.
  cpSoloSong: 'Để Em Rời Xa',
  // Tiết tấu solo từ chính solo Để Em Rời Xa, giai điệu/kỹ thuật học từ mọi sheet ballad CP (người dùng 26/9: "còn quá rời
  // rạc và ko khớp với tiết tấu điệu").
  cpSoloOwnRhythm: true,
}
// Bậc 7 của cụm tay trái chỉ gõ khi hợp âm có 7 — hợp âm ba mà lùi về bậc 5 thì gõ trùng phím (F3+F3).
// Bậc 3 — hợp âm treo (D9sus4 khi màu át là 9sus4) thì lấy NỐT TREO (bậc 4). Không khai thì lùi về bậc 7,
// và "bậc 3 + bậc 7" thành hai nốt C trùng: trên bài người dùng 25/9 ba chát ô 2 chỉ còn một C5, mất khung.
const ba3 = (semitones = 0) => ({ ...tone(1, semitones), fallbackInterval: 5 })
const bay7 = (semitones = 0) => ({ ...tone(3, semitones), optional: true })
const NHAN = .9, THUONG = .8 // lực tiếng chính: nhấn · thường
const deEm: StylePattern = {
  ...deEmCommon, id: 'ca-phao-ballad-de-em-roi-xa',
  name: 'Để Em Rời Xa · Phiên khúc', family: 'ca-phao-ballad-de-em-roi-xa',
  familyName: 'Ballad Để em', variant: 1, bpm: 85,
  sourceVideos: ['Cà Pháo · Để Em Rời Xa · tiếng 1–3 từ cửa sổ 4 (như DERX); khung người dùng 25/9/2026; 3 chát + câu chạy cửa sổ 5'],
  note: 'Phiên: Bùm chát bùm → chát bum chát BÙM chát bum chát (hai tay đan nhau, cú hai tay ở phách 1 · 4) | bùm–bum chát bùm → đoạn đan tay → câu chạy tay trái; walking bass. Đã nghe duyệt 26/09/2026.',
  // Điệu tự lấp chỗ trống: câu lót tự động của app không chen vào (người dùng: "thay câu chạy ngón ngẫu nhiên").
  autoFills: false,
  /*
    Khung do NGƯỜI DÙNG đặt (25/9/2026): "1Bùm 2chát 3bùm 4chát-5bùm 6bum 7chát 8bùm-9bum 10chát 11bùm (chát chát chát)"
    rồi mới chạy nốt; 1–3 như cũ; 4→5 và 8→9 đánh giật; bùm nối bum thì DẪN BASS.
    Vị trí do Claude đặt: câu chạy 7 nốt phải vào ở ô 2 phách 3¼ mới kết đúng vạch, nên 3 chát ở 2 · 2¼ · 2¾ (đúng
    mốc cửa sổ 5) và 8–11 dồn trong phách 1 ô 2.
    Dẫn bass: bum 6 = gốc hợp âm ô 2 hạ một cung (`som` — cùng lối "bậc dưới bass sau" của phách dẫn Có Em Chờ;
    hợp âm không đổi ở vạch thì bỏ cú); 8 · 9 · 11 = bass đi lên 1 · 2 · 3 rồi câu chạy mở bằng bậc 5.
    Người dùng: "Bùm ko phải là chỉ đánh bass — Bùm 1 còn có cả tay phải cùng đánh". Nên MỌI bùm = bass + hợp âm tay
    phải cùng lúc (1 · 3 · 5 · 8 · 11); chát = hợp âm tay phải không bass; bum = bass nhẹ (dẫn).
  */
  cell: {
    lengthBeats: 8,
    left: [
      // Lực ba mức — tiếng chính nào cũng phải rõ (người dùng: "dù có tiếng mạnh tiếng nhẹ ... phải rõ rệt").
      // Cũ: tay phải và bùm 3 mặc định .65 (tay trái nhân thêm .85 còn ~.55). Lùi: nghe nặng tay → hạ THUONG về .7.
      hit(0, 1.75, [tone(0), tone(2), bay7()], NHAN),        // 1 Bùm: Bb2+F3+A3 (cửa sổ 4)
      // Bùm 5 · bum 6 · bùm 8 · bum 9 · bùm 11 = GIAI ĐIỆU THẤP nốt đơn, cùng tầm câu chạy (A2–F3 ≈ 45–53), đi liền bậc
      // vào câu chạy. Người dùng: bass dày ở C2–G2 "cũng ko hiện rõ được tiếng … hãy cho Bùm và Bum đánh giai điệu thấp
      // giống như trong câu chạy nốt". Cũ (bản 15): cặp bass G2+C3 · C2+G2 · D2+cụm · E2+A2 · F2+D3.
      hit(1.75, .5, [tone(0, 12)], THUONG), hit(1.75, .75, [tone(2, 12)], THUONG), // 3 bùm: C3 + G3 (như cũ)
      // Câu chạy một theo khung người dùng (cách 1): "Chát-bùm bum chát bùm chát bùm bum", mốc 3¼ → 4¾ (cửa sổ 8).
      // Người dùng: chát "linh hoạt chọn nốt giai điệu trong hợp âm … học từ sheet để chọn nốt ko bị chói tai"; bum "đánh 2
      // nốt bass hoặc đánh thêm giai điệu nghe cho rõ ràng". Tay phải sheet ở mốc chát (cửa sổ 6 · 8 · 34 · 36): 3¼ A4
      // (+E4) · 3¾ C5 (+G4 3/4) · 4¼ E4 — đỉnh lên rồi xuống. Giữ nốt hợp âm; A4 (bậc 6, ngoài hợp âm — trên Em thành C#
      // ngoài giọng) đổi về G4 gần nhất. Cũ (bản 21): mọi chát/bùm dặm cùng một hợp âm E4+G4+C5; bum một nốt G3.
      // PHÂN TÍCH LẠI SHEET 26/9 (người dùng: "định nghĩa về bùm chát của tôi đã quá cứng nhắc làm cho câu đệm mất hay, hãy
      // phân tích lại trong sheet để em rời xa"; `scripts/audit_cp_de_em_bum_chat.py`). Trên 30 ô phiên, hai tay gõ CÙNG LÚC
      // chủ yếu ở phách 1 (23/30) và phách 4 (24/30); chỗ khác hai tay ĐAN nhau — tiếng thấp là một nốt tay trái đứng riêng,
      // tiếng cao là tay phải đứng riêng. Cửa sổ 4 · 6 · 8 · 32 · 34 · 36, mốc 3¼ → 4¾: phải · TRÁI · phải · HAI TAY · phải ·
      // TRÁI · phải. Nay: chát 4 · bum 5 · chát 6 · bùm 7 · chát 8 · bum 9 · chát 10.
      // Cũ (bản 32–34): chát 4 · bùm 5 · bum 6 · chát 7 · bùm 8 · chát 9 · bùm 10 — bốn cú hai tay trong 1¾ phách (sheet: một),
      // do luật "bùm/bum phải có cả tay phải". Người dùng từng nghe "Chát-bùm" (bản 27) nuốt bùm, bum 6 (bản 32–33) chìm: đều là
      // tiếng tay trái đứng SÁT sau một cú có tay trái. Theo sheet, tiếng tay trái đứng riêng nằm giữa hai tiếng tay phải.
      // WALKING BASS (người dùng 25/9) giữ: bum 5 · bùm 7 · bum 9 là một dòng đi liền bậc từ bùm 3 tới gốc đầu ô 2
      // (`walkingBass`). Sheet ở ba mốc này đứng bậc 5 (G3 G3 G3, cửa sổ 8) — đổi theo ý người dùng. `tones` chỉ là đường lui.
      { ...hit(2.5, .5, [tone(2, 12)], NHAN), danVao: true },            // bum 5 (3&): tay trái một mình
      { ...hit(3, .5, [tone(2, 12)], NHAN), danVao: true },              // bùm 7 (phách 4): bass + C4 tay phải
      { ...hit(3.5, .5, [tone(2, 12)], NHAN), danVao: true },            // bum 9 (4&): tay trái một mình → gốc đầu ô 2
      hit(4, .25, [tone(0, 12)], NHAN),                      // 8 bùm: gốc D3, giật
      hit(4.25, .5, [tone(0, 14)], THUONG),                  // 9 bum: dẫn — bậc 2 (E3)
      hit(4.75, .5, [ba3(12)], THUONG),                      // 11 bùm: bậc 3 (F3)
      // LẤP CHỖ BA CHÁT ĐÃ BỎ (người dùng 26/9: "trong vai nhạc sĩ chuyên nghiệp bạn hãy soạn ra cái gì đó để lấp vào 3 tiếng
      // chát bị bỏ. Nhớ phải khớp với tiết tấu đang chơi"). Ô 2 phách 2 → 3¼ đan tay từng móc kép như sheet ô thật 9 · 37 ở
      // phách 2 → 2¾ (phải · trái · phải · trái) và như nửa sau ô 1: bum 2¼ · bum 2¾ là walking bass đi XUỐNG từ bùm 11 tới nốt
      // đầu câu chạy (`walkingBass`), tay phải đi LÊN — hai tay ngược chiều. Cũ (bản 35): bùm 11 ngân 1½ lấp chỗ trống.
      { ...hit(5.25, .5, [ba3(12)], NHAN), danVao: true },            // bum 2¼
      { ...hit(5.75, .5, [ba3(12)], NHAN), danVao: true },            // bum 2¾ → nốt đầu câu chạy
      // Câu chạy A2-D3-E3-F3-E3-D3-C3 dưới F4 đang ngân (DERX, cửa sổ 5) — không phải tiếng chính.
      hit(6.25, .25, [tone(2)]), hit(6.5, .25, [tone(0, 12)]),
      hit(6.75, .25, [tone(0, 14)]), hit(7, .25, [ba3(12)]),
      hit(7.25, .25, [tone(0, 14)]), hit(7.5, .25, [tone(0, 12)]), hit(7.75, .25, [tone(3)]),
    ],
    right: [
      // Bùm = bass dày + hợp âm; bum = CHỈ bass dày, dẫn (người dùng: "chỗ Bum đừng đánh hợp âm kèm theo nữa");
      // chát = hợp âm không bass. Bùm bậc 3+5 hoặc 3+8, chát bậc 5+8 hoặc 3+7 — khác thế bấm để tai tách bùm với chát.
      hit(0, 1.75, [ba3()], THUONG), hit(0, .5, [tone(2)], THUONG), // 1 Bùm: D4 · F4
      hit(1, .75, [tone(2), tone(0, 12)], THUONG),            // 2 chát: F4+Bb4
      hit(1.75, .5, [ba3(), tone(0, 12)], THUONG),            // 3 bùm: E4+C5 — giữ nguyên, ngân tới 3¼
      // Tay phải câu chạy một theo sheet (cửa sổ 4 · 6 · 8 · 32 · 34 · 36): chát 4 hai nốt (sheet E4/A4 hoặc A4; A4 ngoài hợp âm
      // đổi G4) · chát 6 G4+C5 (6/6) · bùm 7 giai điệu C4 (5/6) · chát 8 MỘT nốt E4 (6/6) · chát 10 MỘT nốt (sheet C4 hoặc F4, 2/6
      // mỗi thứ — lấy bậc 1). Chát không luôn hai nốt: ở 4¼ · 4¾ sheet chỉ gõ một nốt giai điệu.
      hit(2.25, .5, [ba3(), tone(2)], THUONG),                // chát 4: E4+G4, ngân qua bum 5
      hit(2.75, .25, [tone(2), tone(0, 12)], THUONG),         // chát 6: G4+C5
      hit(3, .25, [tone(0)], NHAN),                           // bùm 7: giai điệu C4 cùng bass — cú hai tay duy nhất
      hit(3.25, .5, [ba3()], THUONG),                         // chát 8: E4, ngân qua bum 9
      hit(3.75, .25, [tone(0)], THUONG),                      // chát 10: C4
      hit(4, .5, [ba3(), tone(2)], NHAN),                     // 8 bùm: F4+A4, ngân qua bum 9
      hit(4.5, .25, [ba3(), tone(3)], THUONG),                // 10 chát: F4+C5
      // Người dùng bỏ ba chát F4+C5 ở phách 2 · 2¼ · 2¾ ("câu đệm 11 tiếng rồi chạy nốt"), rồi xin soạn lấp chỗ ấy. Tay phải
      // của phần lấp (ý Claude, soạn theo lối đan tay của sheet): chát 5+8 → giai điệu bậc 3 → chát 3+7 ngân suốt câu chạy như
      // chát cuối cũ. Cũ (bản 35): bùm 11 tay phải F4 ngân 3¼ · A4 1½ lấp chỗ trống.
      hit(4.75, .25, [ba3(), tone(2)], THUONG),               // 11 bùm: F4+A4
      hit(5, .5, [tone(2), tone(0, 12)], THUONG),             // chát 2: A4+D5 — ngân qua bum 2¼
      hit(5.5, .5, [ba3()], THUONG),                          // giai điệu 2&: F4 — ngân qua bum 2¾
      hit(6, 2, [ba3(), tone(3)], THUONG),                    // chát 3: F4+C5, ngân suốt câu chạy
    ],
  },
}

/*
  BALLAD CỨ ĐI — đệm RẢI HAI TAY của Cà Pháo trong *Anh Cứ Đi Đi* (Fa thứ, ♩ 63), từ ô 9. Người dùng 29/9/2026: *"từ ô 9 trở đi
  … CP đệm bằng kỹ thuật rải hợp âm kết hợp 2 tay"*. Khác nút Ballad ACDD của Codex (nền dặm ô 40, xen rải 2/8 ô).
  Số đo (`scripts/audit_cp_acdd_rai.py`, lưới móc kép, 0 cú lệch lưới; bass đầu ô là gốc hợp âm in ở mọi ô — vạch nhịp đúng pha):
  - Ô có CHUỖI RẢI HAI TAY (móc kép liền, cao độ đi lên, có cả hai tay, dài ≥ 4): ô 1–8 3/8 · ô 9–16 7/8 · phiên 2 (38–45) 5/8 ·
    điệp 17–32 2/16 · điệp 46–61 6/16. Rải hai tay là lối của PHIÊN; điệp dùng lối khác (giai điệu quãng tám, dặm cụm).
  - Lúc hát nốt đỉnh tay phải là giai điệu lời (48/62 nốt đỉnh ô 9–16 trùng phiên 2). Nốt tay phải trong chuỗi rải là phần đệm:
    cùng một câu rải ở mọi lượt phiên (ô 2 · 10 · 39: Db4 F4 Db5 ở phách 2–2¾).
  - NỬA ĐẦU Ô: chuỗi 8 móc kép, tay trái 1–5–8–9 rồi 10 ngân, tay phải bắt tiếp 12–15–19 — ô 9 đúng từng nốt F2 C3 F3 G3 Ab3 |
    C4 F4 C5. Chuyển tay ở phách 2¼ 4/11 lần (2: 2 · 3½: 2 · 4: 2). Tay trái 1–5–8–9: ô 9 · 10 · 14; ô 11 (Eb7) 1–5–8–10.
  - NỬA SAU Ô (ô 9–16): tay trái gõ phách 3 ở 7/8 ô (gốc) · 3¼ 7/8 (bậc 5) · 4& 6/8; tay phải ĐỆM (ngoài giai điệu) nhiều nhất ở
    phách 4 (4/8): cặp 3+b7 (Eb7, Db7) · 3+5 (Ab).
  BIÊN SOẠN của Claude: độ ngân (sheet ghi móc kép, không ghi pedal) — bass ngân nửa ô, các nốt rải ngân tới hết nửa ô như giữ
  pedal, riêng bậc 9 ngắn (móc kép) cho khỏi cọ bậc 10; cặp tay phải phách 4 = bậc 7 (hợp âm ba: bậc 5) dưới bậc 10; lực.
*/

/*
  KHUÔN "chêm tiếng nối hợp âm sau" — MẶC ĐỊNH của Ballad cứ đi từ 29/9/2026 (dựng làm ô tick nghe thử cùng ngày). Người dùng nghe
  nút: *"tiết tấu ballad cứ đi nghe ổn nhưng tôi muốn bạn hãy thêm vào mấy tiếng nữa cho đủ phách nối đến hợp âm kế tiếp luôn. Sau 8
  tiếng đầu bạn chơi thêm 2 tiếng nữa rồi nghỉ, nhưng tôi muốn bạn chêm thêm tiếng ở khoảng nghỉ đó để nối vào hợp âm kế tiếp … căn cứ
  vào tiết tấu đệm Ballad cứ đi rồi phát triển thêm tiếng, nhớ phải khớp với tiết tấu điệu"*.
  Giữ mọi tiếng của khuôn; nửa sau thành 8 móc kép liền như nửa đầu — SÓNG LÊN RỒI XUỐNG vào hợp âm sau, lối của sheet ô 9 (tay trái
  F3 Ab3 C4 lên, tay phải F4, Ab3 xuống) và ô 16 (Db3 F3 Ab3 B3 lên, Bb3 G3 E3 C3 xuống vào Fm):
    · 3& · 3¾ (mới): tay trái 8 · 9 — đi tiếp lên sau bass · 5, như 1–5–8–9 của nửa đầu;
    · phách 4: chát tay phải (cũ) — đỉnh sóng;
    · 4¼ · 4& · 4¾: WALKING BASS (`danVao`) — một dòng đi liền bậc từ nốt 9 phách 3¾ XUỐNG bass hợp âm sau (4& là bum cũ, giữ
      chỗ, đổi nốt). Người dùng đã duyệt walking bass ở Ballad Để em ("bum phải là dẫn bass qua tiếng kế tiếp"). Hợp âm ngân
      8 phách: dòng đi về chính gốc của nó ở ô sau; cuối bài: theo `tones` (10 · 8 · 5).
  Bản đầu (bỏ): nốt dẫn cố định = gốc hợp âm sau + 1 cung (`som`) — đúng bước vào bass nhưng ở quãng tám 2, sau bậc 8 quãng tám 3
  → nhảy 13–17 nửa cung ở 4/8 chỗ đổi hợp âm (Bbm → Eb7, Ab → Db, Bbm → G7, G7 → C7).
  Biên soạn của Claude trên hai ô ấy: sheet lúc hát không ô nào đủ 8 móc kép nửa sau (tay phải là giai điệu lời).
*/
/*
  Người dùng nghe ô tick này (29/9/2026): *"khi chơi 8 tiếng thì tiếng 1 5 và 8 là phách mạnh hãy đánh rõ. Tới 8 tiếng lần 2 tôi nghe
  thấy bạn có dặm hợp âm ở tiếng thứ 5, nhưng đừng đánh vậy mà hãy để tiếng 5 chơi một cách hòa hợp với 8 tiếng, nhưng mà vẫn tuân thủ
  phách 1 5 8 mạnh"*. Mỗi nửa ô là một nhóm 8 móc kép; tiếng 1 · 5 · 8 = phách 1 · 2 · 2¾ và phách 3 · 4 · 4¾.
  - NHẤN 1 · 5 · 8 (ý người dùng; cùng mức nhấn câu tám tiếng ACDD, người dùng cũng xin nhấn 1–5–8 ở đó): tay trái 1,0 → lực 68, tay
    phải 0,9 → 72; tiếng khác giữ 0,5–0,55 (34–44). Chỉ trong ô tick — nút gốc (người dùng nghe ổn) không đổi.
    Cũ: tiếng 1 · 5 · 8 nhóm 1 = 0,85 · 0,62 · 0,7 (58 · 42 · 56); nhóm 2 = 0,8 · cặp chát 0,6 · walking 0,6 (54 · 48 · 41).
  - TIẾNG 5 NHÓM 2 = MỘT NỐT trong sóng rải: bậc 10 tay trái, như tiếng 5 nhóm 1 (1–5–8–9–10) — sóng F2 C3 F3 G3 Ab3 rồi walking
    xuống. Cũ: cặp chát tay phải bậc 7 (hợp âm ba: 5) + 10, ngân 1 phách (C4+Ab4 trên Fm) — người dùng nghe là "dặm hợp âm".
  Triệu chứng để lùi: "nhấn nghe giật, nặng tay" → hạ tiếng nhấn về 0,85 (tay trái) · 0,8 (tay phải).
  Người dùng nghe tiếp (29/9): *"nhấn 1 5 8 chưa rõ, sao ko thêm nốt bên tay phải"*. Tăng lực chưa đủ: 5/6 tiếng nhấn chỉ một nốt tay
  trái (lực × 0,85, bè trầm). Nên THÊM TAY PHẢI ở tiếng nhấn — NHÂN QUÃNG TÁM nốt tay trái, không thêm hoà âm (người dùng không muốn
  "dặm hợp âm"): tiếng 1 = gốc +2 quãng tám (F2 → F4), tiếng 5 = bậc 10 quãng tám trên (Ab3 → Ab4), tiếng 8 nhóm 1 = tay phải sẵn
  (C5), tiếng 8 nhóm 2 = một nốt tay phải đi liền bậc vào gốc hợp âm sau (`danVao` tay phải, đích = tiếng 1 tay phải ô sau). Tay
  phải thành một đường trên F4 · Ab4 · C5 | F4 · Ab4 · C5 → Bb4 (Fm → Bbm). Cũ: tay phải chỉ ba nốt rải 1¼ · 1½ · 1¾.
  Người dùng: *"phách 5 đánh dày hơn nữa"* → bản đầu: bậc 10 quãng tám kép tay phải (Ab4+Ab5). Người dùng: *"sao tay phải đánh phách
  5 mà các nốt xa nhau vậy, tay người sao mà đánh được"* — móc kép liền sau tay phải phải xuống C4 (chuỗi rải): Ab5 → C4 = 20 nửa cung
  trong ¼ phách. Bản sau: tiếng 5 tay phải = bậc 10 + 12 (Ab4 + C5). Người dùng: *"nốt ở tay phải vẫn xa nhau"* — trên B9sus4 (bài người
  dùng) bậc 3 thiếu nên renderer lùi về bậc 7: A5 + Gb5, rồi móc kép sau xuống Gb4 = 15 nửa cung; và bậc 10 + 12 nằm TRÊN chuỗi rải nên
  cả cụm ½ phách căng đủ quãng tám. Nay: tiếng 5 tay phải = bậc 8 + 10, SÁT DƯỚI chuỗi rải (Fm: F4 + Ab4, rồi C4 F4 C5 — cụm ½ phách 8
  nửa cung); bậc 3 thiếu (hợp âm treo) lấy NỐT TREO (`ba3`, như Ballad Để em) — B9sus4: B4 + E5. Test đo tầm tay cạnh khuôn, gồm hợp âm
  treo · add9 · m9 · m7b5 · maj7.
  Người dùng: *"tay phải đã gần nhau hơn rồi nhưng tôi muốn phách 5 phải là giai điệu hơi cao lên chứ ko phải ngang với các phách còn
  lại"* — hỏi ba cách (tiếng 5 lên C5 giữ chuỗi rải sheet · lên C5 và chuỗi rải bắt cao F4 Ab4 C5 · tiếng 5 cao nhất ô F5), người dùng
  chọn cách 1: tiếng 5 tay phải = bậc 10 + 12, đỉnh là bậc 5 (Fm: Ab4 + C5) — cao hơn chuỗi rải C4 F4 ngay sau; tay phải mở một quãng
  tám C4–C5 như chính chuỗi rải sheet. Hợp âm treo: nốt treo + 5 (B9sus4: E5 + F#5). Cũ (bản trước): 8 + 10 (F4 + Ab4). Người dùng dặn:
  nghe không ổn thì đưa lại các phương án để chọn.
*/
const NHAN_T = 1, NHAN_P = .9
export const CU_DI_NOI_CELL: RhythmCell = {
  lengthBeats: 4,
  left: [
    hit(0, 2, [tone(0)], NHAN_T),                                       // 1 — bass (nhấn)
    hit(.25, 1.75, [tone(2)], .55),                                     // 2 — 5
    hit(.5, 1.5, [tone(0, 12)], .55),                                   // 3 — 8
    hit(.75, .25, [tone(0, 14)], .5),                                   // 4 — 9 lướt
    hit(1, 1, [ba3(12)], NHAN_T),                                       // 5 — 10 (nhấn; hợp âm treo: nốt treo)
    hit(2, 2, [tone(0)], NHAN_T),                                       // nhóm 2 · 1 — bass (nhấn)
    hit(2.25, 1.25, [tone(2)], .55),                                    // 2 — 5
    hit(2.5, .75, [tone(0, 12)], .55),                                  // 3 — 8
    hit(2.75, .25, [tone(0, 14)], .5),                                  // 4 — 9 lướt
    hit(3, .5, [ba3(12)], NHAN_T),                                      // 5 — 10 (nhấn), thay cặp chát
    { ...hit(3.25, .25, [tone(1, 12)], .55), danVao: true },            // 6 — walking
    { ...hit(3.5, .25, [tone(0, 12)], .55), danVao: true },             // 7 — walking
    { ...hit(3.75, .25, [tone(2)], NHAN_T), danVao: true },             // 8 — walking → bass ô sau (nhấn)
  ],
  right: [
    hit(0, 1, [tone(0, 12)], NHAN_P),                                   // 1 — gốc, quãng tám kép trên bass (nhấn)
    hit(1, .25, [ba3(12), tone(2, 12)], NHAN_P),                        // 5 — 10 + 12: giai điệu nhô lên C5 (nhấn, nhả ngay)
    { ...hit(1.25, .75, [tone(2)], .55), raiNoi: true },                // 6 — 12
    { ...hit(1.5, .5, [tone(0, 12)], .55), raiNoi: true },              // 7 — 15
    { ...hit(1.75, 1, [tone(2, 12)], NHAN_P), raiNoi: true },           // 8 — 19, đỉnh sóng (nhấn)
    hit(2, 1, [tone(0, 12)], NHAN_P),                                   // nhóm 2 · 1 (nhấn)
    // Nhấn rồi nhả (¼): ngân ¾ thì đè lên dòng walking tay trái, tay trái phải né chói → Eb7 đi Eb3 B2 A2 (đo khi sửa).
    hit(3, .25, [ba3(12), tone(2, 12)], NHAN_P),                        // 5 — 10 + 12 (nhấn, nhả ngay)
    /*
      8 — nốt trên GỐC HỢP ÂM SAU một cung (`som`), đặt trong tầm tay phải của ô sau → luôn cách tiếng 1 ô sau đúng 2 nửa cung. Hợp âm
      không đổi ở vạch (ngân 8 phách, cuối bài) → theo hợp âm đang vang (`giuKhiKhongDoi`). Cũ: dòng `danVao` tay phải đi từ tiếng 5 —
      tầm tay phải đặt gốc theo tên nốt (C3–B3) nên chỗ đổi gốc cao → gốc thấp (Bm → E) dòng lên F#5 rồi ô sau vào E4: 14 nửa cung /
      ¼ phách (người dùng: "vẫn còn sót chỗ mà tầm nốt xa … tay người ko thể đánh", 71/3538 cú trên 4 vòng dài).
    */
    { ...hit(3.75, .25, [tone(0, 14)], NHAN_P), som: true, requireNextChord: true, giuKhiKhongDoi: true }, // 8 (nhấn)
  ],
}

/*
  "MỖI HỢP ÂM 8 PHÁCH RỒI CHUYỂN" — MẶC ĐỊNH của Ballad cứ đi từ 30/9/2026 (người dùng tick nghe rồi bảo: *"2 chỗ tôi chọn hãy đặt làm
  mặc định cho điệu Ballad cứ đi"*; ô tick `balladCuDiMotLuot` đã gỡ). Lúc đầu người dùng nói *"ở điệu Ballad cứ đi thì mỗi hợp âm chơi
  8 phách rồi chuyển"* — hỏi lại thì chọn: "phách" = TIẾNG của sóng rải (móc kép), mỗi hợp âm MỘT lượt 8 tiếng thay cho hai lượt mỗi ô
  nhịp; 8 tiếng = sóng lên trọn lượt đầu của khuôn chêm tiếng nối (tay trái 1 · 5 · 8 · 9 · 10, tay phải bắt tiếp 12 · 15 · 19; nhấn
  1 · 5 · 8), không còn tiếng chêm nối. Ô 2 phách máy: ReharmHome đặt mỗi hợp âm = độ dài ô này, bỏ qua ô chọn "Mỗi hợp âm".
  Để lùi: `cell: CU_DI_NOI_CELL` (hai lượt mỗi ô nhịp, lượt hai có 3 tiếng chêm walking — mặc định 29/9) và bỏ nhánh `laCuDi` ở
  `chordBeats`. Cách 2 người dùng dặn nếu nghe chưa ổn: 5 tiếng lên + 3 tiếng chêm nối (lượt hai của `CU_DI_NOI_CELL`).
  Ô tick "giai điệu dẫn vào hợp âm sau" (`CU_DI_DAN_CELL`, 29/9) đã gỡ 30/9 theo người dùng: *"Ô giai điệu dẫn vào hợp âm sau hãy bỏ"*.
*/
export const CU_DI_MOT_LUOT_CELL: RhythmCell = {
  lengthBeats: 2,
  left: CU_DI_NOI_CELL.left.filter(h => h.beat < 2).map(h => ({ ...h, durationBeats: Math.min(h.durationBeats, 2 - h.beat) })),
  right: CU_DI_NOI_CELL.right.filter(h => h.beat < 2).map(h => ({ ...h, durationBeats: Math.min(h.durationBeats, 2 - h.beat) })),
}

/*
  "SOLO · LICK · RUN CÀ PHÁO KHỚP SÓNG RẢI" — MẶC ĐỊNH của Ballad cứ đi từ 30/9/2026 (người dùng tick nghe rồi bảo đặt làm mặc định; ô
  tick `balladCuDiSolo` đã gỡ, các cờ nay nằm thẳng trên điệu). Để lùi: bỏ bốn cờ `soloCell` · `cpSoloOwnRhythm` · `cpSoloSheetTexture`
  · `cpDanSong` khỏi `cuDi`. Lúc làm (29/9) người dùng: *"dùng bộ soạn ballad Cà Pháo và
  kết hợp với tư duy của bạn hãy soạn ra các câu solo và các lick, run và mốc chuyển đoạn chơi theo phong cách Cà Pháo … phải soạn cho
  khớp với tiết tấu điệu ballad anh cứ sau khi đã đặt ô tick chêm tiếng nối hợp âm sau"*. Chỉ nghe được ở màu Cà Pháo.
  - Dạo · giang · kết: bộ soạn ballad CP; tiết tấu tay phải từ solo CHÍNH bài (giang ô 34–36 cho dạo/giang, kết ô 63–64 · 67–68 cho
    kết), giai điệu/hợp âm/kỹ thuật từ mọi sheet ballad CP; chấm chất liệu theo sheet (như Ballad Để em).
  - Tay trái dưới câu solo = mốc gõ tay trái của khuôn mặc định (13 tiếng, kể cả ba tiếng chêm 4¼ · 4½ · 4¾), nhưng ba tiếng chêm là
    nốt HỢP ÂM ĐANG VANG (10 · 8 · 5 đi xuống), không walking sang hợp âm sau. Số đo: tay trái dưới solo sheet Anh Cứ Đi Đi (giang ô
    33–37, kết ô 62–67; n = 11 ô) rải gốc · 5 · 8 (· 9) · 10 móc kép rồi ngân — ô 33 F2 C3 F3 G3 Ab3 đúng sóng của điệu; phách 4–4¾
    gõ nốt hợp âm đang vang (ô 62 G3 → Eb3, ô 35 D3 → F3), không đi bass sang hợp âm sau.
  - Lick / run lúc hát và mốc chuyển đoạn: `cpDanSong` (licky/cpLick.ts).
*/
export const CU_DI_SOLO_LEFT: RhythmCell = {
  lengthBeats: 4,
  right: [],
  left: CU_DI_NOI_CELL.left.map(({ danVao: _, ...h }) => h),
}
const cuDi: StylePattern = {
  soloCell: CU_DI_SOLO_LEFT, cpSoloOwnRhythm: true, cpSoloSheetTexture: true, cpDanSong: true,
  timeSignature: '4/4', beatsPerMeasure: 4, feel: 'straight-block-chord', verified: true, releaseRatio: 1, leftHandTop: 67,
  // Sàn gốc tay phải C3 (48) — như Slow Rock Lá thư hai tay: gốc tay trái C2–B2 thì gốc tay phải cao đúng một quãng tám, sóng
  // rải liền từ tay trái sang tay phải ở mọi hợp âm (Fm: Ab3 tay trái → C4 F4 C5 tay phải, đúng ô 9).
  rightHandRegister: { rootFloor: 48, low: 48, high: 84 },
  // Giữ tầm tay phải (ô hai hợp âm 2 phách: đỉnh sóng hợp âm trước liền tiếng 1 hợp âm sau). Khuôn gốc không vi phạm chỗ nào.
  giuTamTay: true,
  // Sóng tay trái 1–5–8–9–10 lên tới D#4 (gốc B) — sheet ô 14 tay trái Db4. Giữ nhãn tay trái (`fixHandByRegister` không đổi).
  tayTraiLenCao: true,
  id: 'ca-phao-ballad-cu-di', name: 'Ballad cứ đi', family: 'ca-phao-ballad-cu-di', familyName: 'Ballad cứ đi', variant: 1, bpm: 63,
  cpSoloSong: 'Anh Cu Di Di',
  /*
    Câu fill Cà Pháo ở chỗ ca sĩ nghỉ — MẶC ĐỊNH từ 30/9/2026 (người dùng: *"hãy biến ô tick câu fill Cà Pháo làm mặc định cho điệu
    Ballad Cứ đi"*): điệu tự lót fill, ReharmHome soạn câu bằng `cuDiFill.ts` (bảy kỹ thuật xoay vòng, có hợp âm lướt).
    Cũ: `autoFills: false` (sóng rải tự lấp chỗ trống, không câu lót tự động — như Ballad Để em). Để lùi ("fill dày / chen lời"):
    trả `autoFills: false` — chỉ còn fill ở ô người dùng tự bấm.
  */
  sourceVideos: ['Cà Pháo · Anh cứ đi đi · rải hai tay phiên ô XML 9–16 (khuôn ô 9); đối chiếu 10 · 11 · 14 · 38–45'],
  note: 'Rải hai tay, mỗi hợp âm một lượt 8 móc kép: tay trái 1–5–8–9–10 rồi tay phải 12–15–19; nhấn 1 · 5 · 8 có tay phải. Mặc định 30/9/2026 (người dùng nghe duyệt).',
  /*
    MẶC ĐỊNH từ 30/9/2026 = một lượt 8 tiếng mỗi hợp âm (`CU_DI_MOT_LUOT_CELL`, xem trên). 29/9 → 30/9 là khuôn "chêm tiếng nối hợp âm
    sau" (`CU_DI_NOI_CELL`; người dùng 29/9: *"đã ổn, hãy đặt ô tick đó làm mặc định"*). Khuôn gốc đầu tiên (chưa từng commit): tay trái
    bass(0, 2, .85) · 5(.25) · 8(.5) · 9(.75, ¼) · 10(1, 1 phách, .62) · bass(2, 2, .8) · 5(2.25, 1¼) · 8(3.5, ½); tay phải raiNoi 12(1.25)
    · 15(1.5) · 19(1.75, 1 phách, .7) · cặp [bậc 7 (hợp âm ba: 5), 10](3, 1 phách, .6).
  */
  cell: CU_DI_MOT_LUOT_CELL,
}

// 30/9/2026: người dùng xoá nút Ngày mai em đi và Ballad ACDD — chỉ còn Có Em Chờ trong nhóm Codex.
// 2/10/2026: bỏ bản điệp khúc của Có Em Chờ và Để Em (người dùng) — mỗi nút một tiết tấu. Cũ: [coEmCho, coEmChoChorus] ·
// [deEm, deEmChorus] (commit 15b4b82).
export const CP_BALLAD_SONG_STYLES: readonly StylePattern[] = [coEmCho]
// Tách mảng riêng: nút do Claude soạn, không mang màu Codex.
export const CP_BALLAD_DE_EM_STYLES: readonly StylePattern[] = [deEm]
export const CP_BALLAD_CU_DI_STYLES: readonly StylePattern[] = [cuDi]
export const CP_BALLAD_SONG_IDS = [...CP_BALLAD_SONG_STYLES, ...CP_BALLAD_DE_EM_STYLES, ...CP_BALLAD_CU_DI_STYLES].map(style => style.id)
export const CP_BALLAD_SONG_FAMILIES = [coEmCho.family]
