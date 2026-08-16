/**
 * Vài vòng hợp âm dựng sẵn để luyện, **chỉ lấy từ tài liệu**.
 *
 * Đây là cách làm bước 29 sau khi đã bỏ ý định *tự đổi vòng hợp âm của bài
 * sang ii-V-I-vi*: `phongcachdemhatkhabu.md` phần 9 nói Khá Bự **dùng**
 * ii-V-I-vi làm vòng chủ đạo cho cả bài, nhưng không đưa luật đổi từ vòng này
 * sang vòng kia. Muốn đổi tự động thì phải tự bịa ra bảng ánh xạ.
 *
 * Nên thay vì đổi hộ, KeyTrain **bày sẵn chính những vòng tài liệu nêu tên** để
 * người học gõ vào và nghe. Mỗi vòng ghi rõ nó lấy từ đâu; không thêm vòng nào
 * ngoài tài liệu, dù có quen tai tới đâu.
 */

export interface ProgressionPreset {
  id: string
  name: string
  /** Vòng hợp âm ở giọng Đô, để nhìn ra bậc ngay. Nâng hạ tone bằng nút Tone. */
  chords: string
  /** Vì sao nó có mặt ở đây, và tài liệu nói gì về nó. */
  note: string
}

export const PROGRESSION_PRESETS: readonly ProgressionPreset[] = [
  {
    id: 'ii-V-I-vi',
    name: 'ii-V-I-vi',
    chords: 'Dm7 G7 Cmaj7 Am7',
    note: 'Phần 9 — Khá Bự dùng vòng này làm vòng chủ đạo cho cả bài, thay cho vòng I-V-vi-IV quen thuộc. Tài liệu nêu năm bài thị trường dùng nó: Vì Yêu Cứ Đâm Đầu, Đâu Cần Một Bài Ca Tình Yêu, Yêu 5, Nơi Ta Chờ Em, Sunday Morning.',
  },
  {
    id: 'I-V-vi-IV',
    name: 'I-V-vi-IV',
    chords: 'C G Am F',
    note: 'Phần 9 nêu đây là vòng quen thuộc mà ii-V-I-vi thay thế. Để ở đây làm chỗ đối chiếu: gõ hai vòng rồi nghe liền nhau thì ra ngay khác biệt.',
  },
  {
    id: 'canon',
    name: 'Vòng Canon',
    chords: 'C G Am Em F C F G',
    note: 'Phần 10 — vòng Khá Bự dùng để minh hoạ dẫn bè: thay vì bấm thế gốc rồi nhảy quãng xa, chọn thế đảo sao cho các nốt chung được giữ nguyên. Bật tắt nút Dẫn bè để nghe khác biệt rõ nhất trên chính vòng này.',
  },
  {
    id: 'ii-V-I',
    name: 'ii-V-I',
    chords: 'Dm7 G7 Cmaj7',
    note: 'Phần 8 gọi đây là công thức mẹ, giải thích được hầu hết các hợp âm giảm và át biến hoá trong tài liệu. Vòng ngắn nhất để nghe rõ sức hút của bậc năm.',
  },
]
