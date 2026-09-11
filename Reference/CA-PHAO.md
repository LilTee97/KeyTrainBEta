# Hồ sơ Cà Pháo — phần đã áp dụng trong KeyTrain

Tài liệu này ghi riêng những điều KeyTrain thực sự dùng được từ sheet Cà Pháo.
Nó không biến mọi quyết định nghe hay trong app thành thủ pháp đã được chứng minh
là của Cà Pháo. Bản đo chi tiết và dữ liệu gốc nằm ở
[CA-PHAO-BOSSA-AUDIT.md](CA-PHAO-BOSSA-AUDIT.md).

## Bossa CP cải tiến

### Nguồn và ranh giới của việc học

- Mẫu nền rút từ hai ô 9–10 của sheet MusicXML *Người hãy quên em đi* của Cà
  Pháo, rồi đối chiếu lại với hai ô lặp 17–18. Mẫu nền mang id
  `ca-phao-bossa-sheet-9-10`.
- Hồng Kông 1 là ballad/pop có nhấn lệch, không phải nguồn của mẫu bossa này.
- `Bossa CP cải tiến` (`ca-phao-bossa-improved`) là **bản biên soạn của
  KeyTrain**, được điều chỉnh nhiều lượt theo tai nghe và được người dùng xác
  nhận nghe hay. Vì vậy chỉ được nói nó “dựa trên mẫu nền Cà Pháo”, không được
  gán toàn bộ chi tiết của nó cho Cà Pháo.
- Mẫu gồm hai ô 4/4 (8 phách). A và B là hai nửa có vai trò khác nhau; không
  bình quân chúng thành một ô chung rồi lặp lại.

### Khung đang dùng

Nửa A giữ mạch lấy từ sheet: bass gốc mở ô, tiếng hợp âm ở phách sau, một bass
ngắn tạo giật, bass/hợp âm tiếp tục đỡ câu hát. Nửa B là đoạn cải tiến có nhịp
đẩy về ô kế:

| Vị trí trong 2 ô | Vai trò | Trường độ / lực |
| --- | --- | --- |
| 4.0 | bùm 7 (bass) | 1/2 phách, nhẹ (`.65`) |
| 4.5 | chát 8 | 1 phách, vừa (`.60`) |
| 5.5 | bùm 9 (bass) | 1/2 phách, nhẹ (`.65`) |
| 6.0 | chát 10 | 1 phách, vừa (`.60`) |
| 7.0 | chát 11 | 1/2 phách, nhấn hơn (`.90`) |
| 7.5 | bass dẫn | 1/2 phách, phớt nhẹ (`.45`) |

Bass dẫn chỉ là **một nốt** dẫn chromatic vào bass của hợp âm thật kế tiếp;
không được thay bằng cả hợp âm kế tiếp, không chơi ở cuối bài, và chỉ được tạo
khi đổi hợp âm đúng đầu ô sau. Tiếng 7–11 phải nối theo đúng mốc trên: việc một
tiếng vào lúc nào và tiếng trước ngân bao lâu là hai thông số độc lập.

Nút `Bossa CP cải tiến` phải mở lại từ nửa A tại mọi đầu đoạn bài. Nếu để vòng
8 phách chạy xuyên cả bài, một phiên khúc mới sau số ô lẻ có thể bắt đầu từ nửa
B (nhóm 7–11), nên nghe như đổi điệu. Đây là lỗi căn chỉnh chu kỳ chứ không phải
một biến thể biểu diễn có chủ ý.

### Cách tạo và chỉnh mẫu

1. Chọn một câu lặp ổn định trong sheet, có ít nhất một lần lặp để đối chiếu;
   giữ nguyên một nguồn thay vì ghép từng ô từ nhiều bản.
2. Đọc MusicXML theo thời gian thực: nốt có thẻ `chord` là cùng onset, nốt nối
   (`tie`) là ngân chứ không phải tiếng gõ lại; xử lý cả `backup` và `forward`.
3. Tách vai trò: bass, hợp âm đỡ, giai điệu/rải và tiếng dẫn. Piano solo có thể
   trộn các vai trò trong cùng một tay, nên không được mặc định mọi nốt chồng là
   phần đệm.
4. Ghi mỗi sự kiện bằng bốn dữ liệu: vị trí bắt đầu, trường độ, âm lượng và
   chức năng hoà âm. Chỉ sau đó mới chuyển nốt sang bậc của hợp âm hiện tại để
   dùng cho bài khác.
5. Khi cần cải tiến để dễ hát, chỉ đổi một quan hệ nghe tại một thời điểm:
   hoặc onset, hoặc độ ngân/khoảng nghỉ, hoặc lực nhấn. Không vừa dời tiếng vào,
   vừa kéo dài nó, vừa thay bass, vì khi nghe tốt/xấu sẽ không biết lý do.
6. Nghe ở đúng BPM và cùng vòng hợp âm, lặp qua ranh giới đoạn. Test mã chỉ xác
   nhận lịch nốt, thời lượng, điều kiện bass dẫn và việc reset mẫu; nó không
   thể chứng minh groove nghe hay. Quyết định cuối là nghe của người chơi.

## Quy trình rút điệu từ sheet cho các thầy và các điệu khác

1. **Xác định corpus.** Ghi rõ tên bài, thầy, điệu được giả định, file nguồn,
   số ô dùng và số ô đối chiếu. Đừng suy nhãn điệu từ tên file hay một bài duy
   nhất; đối chiếu toàn bộ sheet liên quan trước khi kết luận.
2. **Đo thay vì nhìn.** Chuyển sheet thành timeline theo phách; giữ voice/hand,
   onset, duration, tie, nghỉ, velocity nếu có và ranh giới hợp âm. Một thống
   kê nốt chung không đủ để nói lên tiết tấu.
3. **Tìm đơn vị lặp.** So sánh các ô có cùng vai trò hoà âm để tìm cell 1, 2
   hoặc nhiều ô. Giữ các nửa câu khác nhau nếu chúng thực sự khác; không lấy
   trung bình làm mất câu hỏi–đáp, nhấn–nhả.
4. **Tách cấu trúc khỏi chất liệu.** Khung giữ nhịp, vị trí bass/chát, mật độ,
   khoảng nghỉ và điểm nhấn. Chất liệu là bậc nốt, voicing, chromatic approach
   và cách nối hợp âm. Khi chuyển tông, chuyển chất liệu theo bậc/chức năng,
   không bê cao độ tuyệt đối.
5. **Chỉ khái quát điều đã có bằng chứng.** Một thủ pháp xuất hiện ở một đoạn
   là candidate; chỉ biến thành luật mặc định khi có lặp lại hoặc được người
   dùng duyệt như một lựa chọn biên soạn. Ghi nguồn/candidate/biên soạn thành
   ba nhãn riêng.
6. **Kiểm bằng tai lẫn test.** Nghe liên tục qua nhiều câu, nhiều vòng và đầu
   đoạn; test dữ liệu phải kiểm timeline, tổng phách, hợp âm đích và các điều
   kiện biên. Nếu hai điều mâu thuẫn, điều tra lại phép đo hoặc giả định, không
   dùng test xanh để khẳng định nhạc hay.
