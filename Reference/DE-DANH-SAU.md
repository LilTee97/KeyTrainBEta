# Để dành sau

Các ý tưởng đã bàn tới, đã hiểu rõ phải làm gì, nhưng **cố ý chưa làm**. Không phải quên, không phải bỏ — để đó khi nào có hứng thì quay lại.

Mỗi mục ghi đủ ngữ cảnh để sau này đọc lại là làm được ngay, không phải bàn lại từ đầu.

---

## 1. ~~Đổi màu hợp âm mỗi lượt lặp~~ — ĐÃ LÀM

Kỹ thuật số 5, hai cấp độ:

- **Cấp câu:** `varyRepeatEndings` — phiên khúc 2 ghi `E7b9` trên lời. Cùng đoạn chơi lại thì `repeatEnding` đổi lúc phát.
- **Cấp ô nhịp:** `heldColorRun.ts` — cùng gốc ngân nhiều ô / nhiều token → `Cadd2 → CM7 → C6 → CM7`. Một token ngân nhiều ô ghi đủ chuỗi trên lời (gạch ngang trên); dãy `C C C C` mỗi ô một màu, cùng dấu. Phần đệm tách từng ô.

Còn để sau: bài "Tháng Tư" đổi cả chuỗi bốn hợp âm quay đầu (`Dm7 → G9sus4 → CM7 → C7`) — hiện chỉ đổi **một** hợp âm cuối.

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

Bốn điệu vẫn trống (chưa có trên OneMotion): Bolero, Slow Rock, Cha Cha Cha, March.

Đã thêm 7 điệu từ OneMotion Chord Player (`onemotion.ts`): Pop, Rock, Reggae, Samba, Country, Funk, Tango — `verified` + `sourceVideos: OneMotion`, không phải Khá Bự.

---

## 5. Trang tái hòa âm quá dài

Tab "Tái hòa âm" hiện có mười một mục xếp dọc, người dùng phải kéo nhiều mới tới phần luyện đệm. Đã có lần người dùng không tìm thấy mục luyện đệm vì nó nằm quá sâu.

**Hướng xử lý:** tách phần luyện tập ra tab riêng, hoặc gom các mục cài đặt vào khu thu gọn được.
