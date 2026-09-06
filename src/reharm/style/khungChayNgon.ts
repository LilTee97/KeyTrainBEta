/**
 * Khoảng phách dành cho CÂU CHẠY NGÓN cuối đoạn — dùng chung cho cả hai tay.
 *
 * Tách ra khỏi `raiLinhNhi.ts` khi bộ soạn ấy bị xoá. Bộ soạn đã chết vì bộ ghép ô thật
 * phủ kín cả ba đoạn, nhưng riêng hàm này thì hai chỗ trong `ReharmHome` vẫn gọi: một chỗ
 * dựng câu chạy tay phải, một chỗ buông tay trái ra đúng khoảng ấy. **Hai bên gọi chung một
 * hàm nên không thể lệch khoảng với nhau** — đó là lý do nó phải sống ở một chỗ, không phải
 * hai hằng số chép đôi.
 *
 * Số đo về chính câu chạy gốc của Linh Nhi nay nằm ở
 * `PianoBrain/knowledge/teachers/linh-nhi-piano.md` mục 10b.
 */

/**
 * Câu chạy HẠ CÁNH ĐÚNG VẠCH NHỊP của ô cuối, không dừng trước đó.
 *
 * Bản đầu đặt chạy từ offset 1,5 tới 3,0 rồi để trống một phách, sau đó hợp âm báo mới vào
 * ở phách 1&. Người dùng nghe ra ngay: *"dặm hợp âm rồi nghỉ rồi đánh thêm hợp âm báo vào,
 * nghe nó khựng lại rất dở"*. Đúng — một phách trống ở chỗ ấy nghe như hụt chân.
 *
 * Nay chạy chiếm **1,5 phách cuối** ô áp chót, nốt cuối rơi ngay trước vạch, và hợp âm báo
 * đứng đúng vạch. Thành một cử chỉ liền: chạy lên rồi đáp.
 */
const CHAY_LUI = 1.5

/**
 * Ô nào trong đoạn được chen chạy ngón, tính bằng phách tuyệt đối.
 *
 * Lấy ô **áp chót**, đúng chỗ bản ký âm đặt — ô 71 trên 72. Nó rơi ngay trước lúc đoạn kết
 * thúc, nên nghe ra là một câu dẫn chứ không phải một cú chen ngang.
 *
 * Đoạn ngắn hơn ba ô thì trả `null`: không đủ chỗ cho một câu dẫn.
 */
export function khungChayNgon(
  tongPhach: number,
  barBeats: number,
): { tu: number; den: number } | null {
  const soO = Math.floor(tongPhach / barBeats)
  if (soO < 3) return null
  /* Lùi từ vạch nhịp ô cuối, để nốt cuối câu chạy đáp ngay vào hợp âm báo. */
  const vach = (soO - 1) * barBeats
  return { tu: vach - CHAY_LUI, den: vach }
}
