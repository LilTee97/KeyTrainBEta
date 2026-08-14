# Để dành sau

Các ý tưởng đã bàn tới, đã hiểu rõ phải làm gì, nhưng **cố ý chưa làm**. Không phải quên, không phải bỏ — để đó khi nào có hứng thì quay lại.

Mỗi mục ghi đủ ngữ cảnh để sau này đọc lại là làm được ngay, không phải bàn lại từ đầu.

---

## 1. Đổi màu hợp âm mỗi lượt lặp

**Đây là kỹ thuật số 5 trong năm kỹ thuật của phong cách** — hiện là kỹ thuật duy nhất chưa làm.

Tài liệu `phongcachdemhatkhabu.md` mô tả ở hai cấp độ:

- **Cấp ô nhịp** (mục 12.2): cùng hợp âm gốc Đô nhưng bốn ô nhịp liên tiếp đổi màu — `C → CM7 → C6 → CM7`. Mục đích là tránh đơn điệu khi một hợp âm ngân lâu.
- **Cấp câu nhạc** (mục 1 và 15): đổi hợp âm **kết** ở lượt lặp thứ hai. Ví dụ lượt một kết `Em7`, lượt hai kết `E7b9`. Bài "Tháng Tư Là Lời Nói Dối Của Em" còn đổi cả một chuỗi bốn hợp âm làm vòng quay đầu: `Dm7 → G9sus4 → CM7 → C7`, trong đó `C7` đóng vai bậc năm phụ kéo về `FM7` ở đầu vòng.

**Tình trạng hiện tại:** app tô **chết một màu** cho mỗi bậc. Hợp âm chủ âm xuất hiện bốn lần thì cả bốn lần đều là `Cadd9`.

**Việc cần làm:** thêm khâu `repeatVariation.ts` vào cuối `reharmPipeline.ts` (sau khâu thêm màu, trước khâu chọn cách bấm). Cần phát hiện chỗ nào là lượt lặp — với vòng hợp âm ngắn thì dễ, còn với bài hát đầy đủ thì phải chờ có phân đoạn Verse/Chorus, tức là phụ thuộc bước nhập lời bài hát.

**Lưu ý thiết kế:** nên cho người dùng bật/tắt, vì đổi màu tự động có thể phá ý đồ của người soạn.

---

## 2. ~~Các màu jazz ngoài tài liệu~~ — ĐÃ LÀM

Đã thêm `m6`, `m(maj7)`, `maj7#11`, `7#11`, `7#9`, `7b5`, kèm công tắc bật/tắt và trường `source` phân biệt `khaBu` với `jazz`. Xem `src/reharm/reharmEngine/staticVoicingRules.ts`.

Làm cùng lúc còn phát hiện mấy màu **vốn có trong tài liệu** mà app bỏ sót: `7#5`, `13b9`, `7b13`. Đã bổ sung vào bảng màu bậc năm.

---

## 3. Nốt treo bậc bốn cho hợp âm trưởng — đã làm rồi gỡ đi

Tính năng cho hợp âm trưởng vang ở dạng `sus4` rồi hạ bậc bốn xuống bậc ba trong cùng ô nhịp. Đúng lối tài liệu dùng ở `Esus4 → E` và `G7sus4 → G7`.

**Đã cài đặt xong và chạy được, rồi gỡ đi theo yêu cầu để giao diện gọn hơn.** Toàn bộ code nằm ở commit `1c0286e`, muốn khôi phục thì lấy lại từ đó.

Hai chỗ dễ sai đã giải quyết trong lần cài đó, ghi lại kẻo làm lại từ đầu:

- Hợp âm ngắn (nửa ô nhịp) bình thường chỉ đánh **một** tiếng, nhưng có nốt treo thì phải chia đôi, nếu không nốt treo không có chỗ mà giải quyết.
- Điệu có mẫu tiết tấu cố định phải nhớ hợp âm nào **đã phát tiếng tay phải đầu tiên**, chứ không so vị trí với đầu ô nhịp — vì điệu valse tay phải nghỉ hẳn phách một, không tiếng nào rơi đúng đầu ô.

Lưu ý: nút **"Hợp âm át thành treo"** (cho ra `D9sus4`, `E9sus4`) là chuyện khác và **vẫn còn trong app** — đó là kỹ thuật chữ ký xuất hiện dày đặc trong tài liệu.

---

## 4. Mở rộng cờ `verified` khi thêm điệu từ nguồn khác

Cờ `verified` trong `src/reharm/style/types.ts` hiện mang nghĩa hẹp: *"đã xác nhận từ video kênh Khá Bự"*.

Khi thêm điệu từ nguồn khác — sách nhạc, video khác, hoặc tự soạn — cần một trường ghi rõ **nguồn gốc** thay vì chỉ đúng/sai. Giữ phân biệt "đúng phong cách Khá Bự" với "điệu chuẩn nói chung" là có ích, vì mục tiêu của app là học **phong cách cụ thể đó**.

Bốn điệu đang để trống chờ mẫu tiết tấu: Bolero, Slow Rock, Cha Cha Cha, March. Xem `src/reharm/style/styleLibrary/index.ts`.

---

## 5. Trang tái hòa âm quá dài

Tab "Tái hòa âm" hiện có mười một mục xếp dọc, người dùng phải kéo nhiều mới tới phần luyện đệm. Đã có lần người dùng không tìm thấy mục luyện đệm vì nó nằm quá sâu.

**Hướng xử lý:** tách phần luyện tập ra tab riêng, hoặc gom các mục cài đặt vào khu thu gọn được.
