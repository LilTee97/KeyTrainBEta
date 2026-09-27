import type { RhythmHit, StylePattern } from '../types'

/*
  BLUES ĐỨC THỊNH — nút riêng của Claude, TÁCH KHỎI nút "Blues ĐT" Codex đang dựng (25-27/9/2026).
  Không chung id, không chung family, không alias sang nhau — cùng lối "Slow Rock LT" (Codex) đứng
  cạnh "Slow Rock Lá thư" (Claude), xem `Reference/SLOW-ROCK-LT.md`.

  TIẾT TẤU: y HỆT `slow-rock-duc-thinh-3` (`styleLibrary/testerStyles.json`) — không đổi một cú gõ,
  không đổi trường độ, không đổi lực. Đây là chủ ý, không phải lười: thầy Đức Thịnh nói nguyên văn ở
  video nguồn (kOwriZhpo6Y, 10:07-10:28 — PianoBrain `duc-thinh-not-blues-la-bac-5-giang`, validated):

    "Thực ra đó là điệu Blues nhưng mà nó không đánh nốt Blues thôi. Nốt Blues là nốt bậc 5 giáng."

  Tức mẫu đệm Slow Rock thứ 3 của thầy ĐÃ LÀ tiết tấu Blues; thứ duy nhất chưa có là một CAO ĐỘ —
  nốt xanh, bậc 5 giáng — chứ không phải một tiết tấu khác. Nên nút này không sửa cell: nó đặt đúng
  cell ấy dưới một cái tên khác, để chạy trên vòng hợp âm bảy (I7-IV7-V7) và nhận câu lick/run Blues
  ở `blueDucThinhLicks.ts`, nơi nốt bậc 5 giáng thật sự xuất hiện.

  BIÊN SOẠN CỦA TÔI (không phải lời thầy): đặt tên, họ điệu, và việc dùng gam Blues cho câu solo.
  `phraseScale.ts` `prefersBlues()` đã bắt gam Blues cho mọi family có chữ "blues" — nên chỉ cần đặt
  family này là câu dạo tự động ngẫu hứng trên gam Blues (C: C Eb F Gb G Bb), không cần thêm code.
  Nguồn gam: `Reference/pianoimprovnotes.md` mục 1.2 (lý thuyết phổ thông, không phải lời thầy).

  KHÔNG đăng ký vào `hoDieu.ts`: cố ý đứng NGOÀI mọi họ (kể cả 'slow-rock') để không dính luật chọn
  màu/solo của Linh Nhi (`slowRockSoanLinhNhi` bắt theo `hoCuaDieu(style.id) === 'slow-rock'`) — chọn
  màu Linh Nhi trong lúc đang chơi Blues Đức Thịnh sẽ không đổi gì ở điệu này.

  CHƯA ĐO / CHƯA CÓ: đoạn kết (outro) hiện trống với MỌI điệu chưa có chỉ dẫn Codex riêng (cổng
  `coChiDanCodex` trong ReharmHome.tsx, có từ 10/9/2026) — Blues Đức Thịnh cũng vậy, không phải lỗi
  mới. Giang tấu chạy theo lối mượn nguyên đoạn mặc định (không có vòng ngắn riêng). Giọng trưởng của
  Blues Đức Thịnh CHƯA có gì từ thầy — gam Blues áp cho giọng trưởng là suy rộng theo lý thuyết.

  `fillBassChance: 0` — người dùng nghe bản đầu (27/9/2026): *"khi đệm tiết tấu Blues thì ngoài khung
  tiếng ra thì thầy Đức Thịnh cũng có chêm vào các câu fill và các câu chạy nốt theo giai điệu màu
  Blues. Sao ko thấy bạn chơi như vậy"*. Lý do: mọi điệu nhịp kép (`timeSignature` kết thúc bằng "/8")
  mặc định `fillBassChance` 0,8 — quy ước riêng cho lối rải bass slow rock của Linh Nhi, KHÔNG hợp với
  Boogie/Blues (không có sheet nào của Đức Thịnh nói bass chạy ở chỗ nối ô). 80% ô fill tự động vì vậy
  từng biến thành chạy bè trầm, phần còn lại rơi vào sổ Licky chung — không câu nào mang màu Blues. Tắt
  hẳn để `autoFillRun` (`blueDucThinhLicks.ts`) luôn được hỏi trước ở CẢ ô fill tự động lẫn ô Run.
*/
const hit = (beat: number, durationBeats: number, velocityScale: number,
  voice: RhythmHit['voice'], tones?: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, voice, tones })

export const BLUES_DUC_THINH: StylePattern = {
  id: 'blues-duc-thinh',
  name: 'Blues Đức Thịnh',
  family: 'blues-duc-thinh',
  familyName: 'Blues Đức Thịnh',
  variant: 1,
  timeSignature: '6/8',
  beatsPerMeasure: 6,
  gridUnit: 0.5,
  bpm: 101,
  feel: 'swing',
  releaseRatio: 1,
  verified: true,
  fillBassChance: 0,
  sourceVideos: [
    'kOwriZhpo6Y @ 06:45-10:43 (đệm) và 10:07-10:28 (câu nói về nốt Blues) — PIANO ĐỆM HÁT Bài 9, Đức Thịnh',
  ],
  note: 'Tiết tấu y hệt Slow Rock mẫu 3 của thầy Đức Thịnh — thầy nói mẫu này vốn đã là Blues, chỉ thiếu nốt bậc 5 giáng. Nốt ấy nằm trong câu dạo/lick (gam Blues), không đổi ở phần đệm. Vòng hợp âm và câu lick là biên soạn theo lý thuyết Blues phổ thông (I7-IV7-V7, gam Blues), không phải sheet đo được của thầy.',
  cell: {
    lengthBeats: 6,
    // Ba tones dưới copy nguyên xi từ testerStyles.json (không qua helper `tone()`) để so `toEqual`
    // được đúng nghĩa "y hệt", không chỉ "tương đương".
    left: [
      hit(0, 2, 1, 'bottom', [{ toneIndex: 0, fromRoot: true }]),
      hit(2, 0.9, 0.7, 'bottom', [{ toneIndex: 2, fromRoot: true }]),
      hit(5, 1, 0.55, 'bottom', [{ toneIndex: 2, fromRoot: true }]),
    ],
    right: [
      hit(2.9, 3.1, 0.85, 'chord'),
    ],
  },
}
