# Rockhouse và Robert: phối hợp hai tay trong Blues

Phân tích ngày 27/09/2026; áp dụng vào **Blues Codex 1** để nghe duyệt.

## 1. Nguồn và cách đo

- Rockhouse: `C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Rockhouse-Ray-chia-doan-G-Blues.mxl`, 120 ô 4/4, tempo 88 nốt đen/phút; trung tâm G Blues. Phân tích bản ký âm được cung cấp, không xác nhận mọi chi tiết là cách Ray Charles chơi trong một bản thu cụ thể.
- Robert: bản gốc `Robert-Ray.mxl` mang tiêu đề **Slow Blues Impromptu by Robert Van - 12 Bar Blues - Solo...**. Tên file chưa đủ để quy phần chơi này cho Ray Charles. Trung tâm **C Blues, nền trưởng pha màu thứ**.
- Robert có 143 ô số **0–142**; ô lấy đà 0 dài 2 nốt đen. Tempo file 162 nốt đen/phút. Có thể cảm nhận chậm theo đơn vị lớn hơn, nhưng không tự sửa thành 81 BPM.
- Đo nốt, trường độ và bố cục sheet; chưa kiểm chứng pedal, độ trễ tinh tế, ngón tay và sắc thái bản thu bằng audio/video.
- Tái lập: `python -X utf8 -B scripts/audit_blues_sheets.py --output Reference/BLUES-SHEETS-EVIDENCE.json`. JSON lưu hash, đổi nhịp, thống kê và ví dụ từng tay của các bản đã sửa ký hiệu.

**Quy ước:** vị trí `0, 1, 2, 3` là đầu phách 1, 2, 3, 4; đơn vị nốt đen. Cụm hợp âm cùng lúc tính **một lần đánh**. Gộp tie trong ô; nốt nối từ ô trước không tính là cú đánh mới. Có tiếng RH không tự chứng minh có giai điệu: phải xem đường nốt, sự lặp và chức năng cụm.

## 2. Rockhouse: giai điệu nằm trong phần đệm

| Phạm vi | Lần đánh LH | Lần đánh RH | RH cùng LH | RH lệch LH | RH là cụm |
| --- | ---: | ---: | ---: | ---: | ---: |
| 32–55, 24 ô | 154 | 165 | 98 | 67 | 103 |
| 103–114, 12 ô | 69 | 105 | 47 | 58 | 33 |

RH có cú đánh mới ở **mọi ô** trong hai cửa sổ. Ở 32–55, khoảng 62% cú RH là cụm; ở 103–114 chỉ khoảng 31%. Sheet có cả **giai điệu trong bè hợp âm** lẫn **nốt đơn xen bè đôi**. Nếu tách nốt cao làm solo rồi đặt lên toàn bộ cụm đệm cũ, RH dễ thành hai lớp quá dày.

### Ô 32: hai tay thay phiên giữ chuyển động

| Vị trí | LH mới đánh | RH mới đánh | Cách phối hợp |
| ---: | --- | --- | --- |
| 0 | G1 | F4–B4–D5–E5–G5 | Cùng nhấn; RH có màu 7/13 |
| 1 | G1–G2 | D4–E4–G4–Bb4 | Cùng nhịp; RH đổi màu và hạ bè |
| 1⅔ | B1–B2 | — | Bass nối khi RH nhả |
| 2 | D2 | B3–E4–G4 | Cùng đánh, thay cách đặt bè |
| 2⅔ | — | B3–D4–G4 | RH đổi cụm trên bass D ngân |
| 3 | B1–B2 | — | LH tiếp tục |
| 3⅓ | — | B3 | Nốt đáp ngắn, khoảng ¼ nốt đen |
| 3⅔ | D2 | — | LH dẫn trong khoảng nghỉ RH |

LH không chỉ đánh gốc rồi đứng yên. RH cũng không luôn chạy gam. Một số cụm giữ bè trên và đổi bè trong; nốt cao nhất không đại diện cho toàn bộ giai điệu.

### Ô 44–45: từ cụm thành câu đáp

- Ô 44: RH đánh cụm tại 0, 1, 2, 3, 3⅔; cụm ở 2 rất ngắn, có khoảng nhả; LH giữ mô hình riêng.
- Ô 45: đỉnh nốt Bb–A–G–A–G–E tại ⅔, 1⅔, 2, 2⅓, 2⅔, 3. Câu có hướng đi, lặp và nốt kết, không phải thêm gam bất kỳ ở cuối hợp âm.
- Học **nhắc câu rồi đổi đuôi**, giữ trọng âm và nhả cuối. Mật độ gốc thuộc độc tấu; chuyển sang đệm hát cần giảm tiếng.

### Ô 103–107: mô-típ 5–6–b7

Ô 103 trên nền G, đường RH chủ yếu **D–E–F = 5–6–b7**, có B3 đỡ một số cú. Điểm đánh: ¼, ½, 1, 1¼, 1½, 2, 2¼, 2½, 3. Ô 104 nhắc mô-típ với nhịp biến đổi. Qua C ở 107, chất liệu tương ứng **G–A–Bb**.

Lấy mô-típ ngắn, lặp có chủ đích, đổi theo hòa âm, bè ba đỡ một số tiếng. Giảm mật độ 8–9 lần RH/ô của đoạn này: chép móc kép vào cửa sổ fill ngắn sẽ tạo đúng cảm giác dồn dập người dùng phản ánh.

### Form Rockhouse không trùng đều với vạch nhịp

Bản chia đoạn có mốc: ô 8 phách 3 → 20 phách 3 → 32 → 44 → 56 → 67 phách 3 → 79 phách 3 → 91 → 103 → 114 phách 3. Có chu kỳ 12 ô và 11½ ô theo bản chép. Coda từ 114 phách 3, ô 116 im, sau đó còn tag. Không san phẳng tất cả thành chu kỳ 48 nốt đen rồi chỉ chêm tại mỗi mốc thứ 12.

## 3. Robert: chất liệu thưa hơn cho đệm hát

### Phân đoạn đã đặt trong bản mới

Chữ A–E là nhãn Codex để luyện tập, không phải nhãn tác giả có sẵn.

| Nhãn | Ô | Nội dung |
| --- | --- | --- |
| Mở đầu | 0–9 | Lấy đà, nốt Blues ở RH, hợp âm trả lời; ô 9 im |
| A | 10–30 | Phát triển 1, bass/cụm đáp, độ dài linh hoạt |
| B | 31–55 | Phát triển 2, ô kéo dài, dẫn vào câu mới |
| C | 56–79 | Vòng 24 ô 4/4, C, quick IV ở 58, turnaround 76–79 |
| D | 80–103 | Vòng tiếp 24 ô 4/4, biến đổi câu và chỗ vào IV |
| E | 104–126 | Biến tấu; câu kết rơi vào 127 kéo dài 6/4 |
| Kết chính | 127–131 | Về C và buông; 127 đồng thời kết vòng E |
| Nghỉ | 132–140 | 9 ô 2/4 im, tổng 18 nốt đen, giữ nguyên |
| Tag cuối | 141–142 | LH F–A, RH C–D–E, chốt C |

Thống kê E dùng 104–127 để gồm điểm hạ cánh; nhãn kết tại 127 giúp tìm điểm về C. A/B là phân chia làm việc; C/D rõ hơn nhờ chu kỳ hòa âm lặp lại.

**Đổi nhịp giữ nguyên:** 29, 31, 40, 52, 127 là 6/4; ngay sau mỗi ô trở về 4/4; từ 132 là 2/4. Không xóa khoảng im để làm form đều. Chưa có bản thu để biết khoảng im cuối là chủ ý hay phần dư ký âm.

### Giọng C Blues và form 12 đơn vị

Các vòng về bass C tại 56, 80, 104, 124/127; tag có C–E–G. E tự nhiên xác lập nền trưởng, Eb/Bb pha màu Blues. Không thể suy Am chỉ từ hóa biểu trống.

Vòng 56–79 có thể hiểu thành **12 đơn vị hòa âm, mỗi đơn vị hai ô 4/4**, có quick IV và mở rộng chromatic. Đây là suy luận form, không phải khẳng định có 12 ô được in.

| Ô | Chuyển động chính đọc từ nốt |
| --- | --- |
| 56–57 | C; cuối 57 bass Gb dẫn nửa cung xuống F |
| 58–59 | F/F7 |
| 60–63 | C và chromatic; bass 63 Eb → E để đến F |
| 64–67 | F, RH thay câu và cụm |
| 68–71 | Bass C → D → E → Eb |
| 72–75 | Khu vực Dm rồi G, có màu ngoài hợp âm và nhãn cần kiểm tra |
| 76–79 | C → F → F#/Gb → G, trở lại C tại 80 |

**Không học máy móc tên hợp âm:** ô 63 ghi C/E đầu ô nhưng bass thực Eb trước, E ở vị trí 2; ô 77 ghi Gbdim trước F nhưng bass F trước, Gb sau. Ô 56 ghi Cmaj7 nhưng các nốt xét ở đây không chứng minh có B tự nhiên. Ô 72 ghi Dm7 trong khi RH G–A–Eb trên bass F không phải thế Dm7 thông thường. Giữ nhãn nguồn, ghi nghi vấn riêng; chưa đưa nhãn đó vào bộ tự tái hòa âm.

### Số đo và ví dụ hai tay

| Vòng | Ô có cú RH mới | Tổng LH | Tổng RH | RH lệch LH | RH là cụm |
| --- | ---: | ---: | ---: | ---: | ---: |
| 56–79 | 24/24 | 58 | 83 | 46 | 45 |
| 80–103 | 23/24 | 57 | 74 | 31 | 34 |
| 104–127 | 23/24 | 64 | 67 | 23 | 32 |

Khoảng **2,8–3,5 lần RH/ô 4/4**. Ô không có cú mới có thể còn nốt nối ngân. Giai điệu gần xuyên suốt vẫn có thể đi cùng tiết tấu thưa.

- **56–57:** LH C3–G3 ngân; RH E5 nối từ trước rồi nhắc D5, sau đó Bb3–E4 và C5. LH Gb ở nửa sau 57. Giai điệu nhường chỗ bass, không lấp mọi khe.
- **58:** hai tay cùng nhấn F tại 0 và 1⅓; RH Eb5 ở 2 rồi A4–Eb5 ở 3¼ trên bass F ngân. Cùng khóa nhịp rồi tách ở cuối.
- **64:** RH A4, C4/C5, A4, F4–A4–D5; LH F2 rồi Eb3. Nhắc nốt rồi kết màu F6, không cần chạy đủ gam.
- **70–71:** bass E → Eb; RH E–C–C–Eb rồi bè Eb–A, C–D. Hướng bass/hòa âm dẫn giai điệu.
- **104–105:** RH D–E–E, rồi A–G–Eb và cụm Eb–A–Db; LH thưa, chủ yếu C–G. Hai tay có mật độ khác nhau.
- **141–142:** LH F–A mở câu, RH C–D–E tiếp rồi chốt C/E. Ví dụ rõ về trao câu giữa hai tay.

## 4. Áp dụng vào Blues Codex 1

### Sửa nguyên nhân câu chạy quá nhanh

Bản trước chọn cuối hợp âm bằng `fillPositions`, chia cửa sổ cho nhiều nốt. Run dài 1,5 nốt đen có bước **0,125 nốt đen**, tạo sáu tiếng rất nhanh rồi thêm đuôi. Tăng số fill không giải quyết cách tổ chức đó.

Bản mới đặt giai điệu **trong ô đệm**, có tiếng ngay cả khi không đánh dấu Fill/Run. Fill/Run tự chọn và chuyển đoạn là câu thay thế riêng, không tự chồng thêm run cuối hợp âm lên mô-típ.

### Khung tiếng mới, ví dụ C7 trong một ô 6/8

Ô dài 3 nốt đen; đếm từ 0. Giữ cú chát sớm 1,45 của khung Claude/Đức Thịnh.

| Tiếng | Tay | Vị trí | Ngân | Minh họa |
| --- | --- | ---: | ---: | --- |
| BÙM + mở mô-típ | Trái/phải | 0 | LH 1; RH 0,35 | Bass gốc / G4 |
| Nốt nối | Phải | 0,5 | 0,35 | A4 |
| bùm | Trái | 1 | 0,45 | Nốt thứ năm của khung |
| chát, bè trên là giai điệu | Phải | 1,45 | 0,55 | E4–G4–Bb4 |
| bùm + đáp | Trái/phải | 2,5 | LH 0,5; RH 0,35 | Nốt thứ năm / G4 |

RH nghỉ thật **0,35–0,5; 0,85–1,45; 2–2,5; 2,85–3**. Không ngân cụm đệm đè lên câu chạy mới.

Bốn ô: **hỏi → nhắc, đuôi bè đôi → đáp/đổi hướng → thở**. Ô thường có bốn lần RH. Ô thở chỉ RH ở 0 (ngân 0,85) và 1,45 (ngân 0,55), bỏ đuôi. Đây là quyết định biên soạn trên 6/8, không chép timing 4/4 của Rockhouse.

### Màu và tốc độ

- Dominant: 3–5–b7; trưởng thường: 3–5–6; thứ: b3–5–b7; m6 giữ 6; maj7 giữ 7. Nốt theo hợp âm đang vang, cả khi đổi giữa ô.
- Sus/dim/altered giữ cụm gốc và dùng nốt hợp âm; không thêm 9 vào b9 hoặc biến sus thành trưởng. Bass slash giữ tuyến có sẵn.
- Fill: nhắc nốt, bè đôi, b5→5, láy nhẹ b3→3 trên trưởng hoặc 2→b3 trên thứ. Run bước ngắn, kết nốt thuộc hợp âm hiện tại, ưu tiên nốt chung với hợp âm sau.
- Fill/Run bước **0,5 nốt đen**; thiếu chỗ thì bớt nốt, dưới 0,5 thì bỏ câu. Fill 1,5 phách tối đa 3 tiếng chính; Run 3 phách tối đa 6. Láy ngắn/nhẹ là cử chỉ phụ.
- RH đệm nhường Fill/Run; chặn tiếng chính cách nhau dưới 0,45 ở chỗ nối. Giữ vùng nghỉ, reset ô tại ranh giới/đôn phách. LH giữ khung trừ khi bật Walking Bass riêng.
- Tắt fill điều khiển câu bổ sung; giai điệu bên trong ô là đặc tính của nút. Không ép bài khác thành 12-bar. Bộ dạo/giang/kết dài hiện hành chưa được thay thành bộ mô phỏng Ray/Robert.

## 5. Bản Robert và kiểm tra

- Gốc không bị ghi đè. Bản mới `Robert-Ray-chia-doan-C-Blues.mxl`, `.mscz`, `.md` cùng thư mục Linh Nhi.
- Sửa ký hiệu tuplets tại 76 cụm phách, bỏ 16 đầu/đuôi tie không có cặp. Trước/sau, **1.117 sự kiện nốt phát thực** khớp cao độ, tay, thời điểm, trường độ, dynamics. Số ô và số chỉ nhịp giữ nguyên.
- MuseScore 4.7.5 nhập, xuất MSCZ, xuất lại MusicXML và ảnh thành công. Vòng xuất khớp cả 1.117 sự kiện và dynamics. Đã xem ảnh trang đầu/giữa/cuối; sửa tiêu đề/nhãn tràn mép. Đây là kiểm tra CLI/render, chưa thử thao tác mở bằng chuột.
- 89 kiểm tra tập trung Blues/render/ráp bài đạt; build TypeScript/Vite đạt. Bộ fill/solo: 407/408 đạt; `phraseAcrossBar` còn 262/553 = 47,38% so với ngưỡng 50%, trùng lỗi cũ trong `Reference/SO-TAY.md`, mục `phraseAcrossBar rơi từ 58% xuống 47% ở b2dd25e`.
- Cần người dùng nghe duyệt: kiểm tra đúng nhịp không thay thế đánh giá “vừa” trong bài hát cụ thể.
