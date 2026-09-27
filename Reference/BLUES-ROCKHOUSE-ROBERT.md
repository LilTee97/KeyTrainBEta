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

## 4. Phân tích lại sau phản hồi “chỉ nghe dặm”

### Sai ở bản trước

Thống kê RH có tiếng ở mỗi ô chỉ chứng minh hoạt động tay phải; không chứng minh có câu chạy. Bản `2cdd2c5` chỉ thêm nốt tại 0, 0,5, 2,5 quanh cụm 1,45, ngân mỗi nốt 0,35. Trên C7, G–A rồi cụm E–G–Bb rồi G, bị ngắt bởi nhiều khe lớn. Nó thành riff chấm nhịp. Việc tắt run tự động càng làm thiếu câu chạy; các test cũ chỉ xác nhận đúng bố trí ấy, chưa kiểm tra dòng nốt liên tiếp.

Đường `weaveBluesCodexBacking → bluesCodexPass → buildSongTimeline/buildArrangedSong → eventsForHand → startTimelineLoop` giữ nốt đơn. Chưa thấy bộ phát tự đổi nốt đơn thành hợp âm. `hand` mặc định là `both`; nếu người dùng chọn luyện tay trái thì RH bị lọc đúng theo lựa chọn đó. Chưa có cấu hình/bài/BPM cụ thể của lần nghe bị phản ánh; không khẳng định tái hiện chính xác buổi nghe đó.

### Câu chạy cụ thể trong Rockhouse

Mọi thời điểm dưới đây đếm từ 0, đơn vị nốt đen, gộp tie rồi mới đếm.

| Ô | Dòng RH cần học | Thời điểm bắt đầu | LH trong lúc đó | Cách tổ chức |
| --- | --- | --- | --- | --- |
| 35 | D4–D#4–E4–G4 | 2⅓, 2⅔, 3, 3¼ | D2 ngân từ 2; B1/B2 tại 3, D2 tại 3¾ | Cụm RH trước đó nhả ở 2¼ rồi chuyển sang nốt đơn; D# tiếp cận E |
| 45 | A4–G4–A4–G4–E4 | 1⅔, 2, 2⅓, 2⅔, 3 | B1 tại 1⅔, D2 tại 2, B1/B2 tại 3 | Bắt đầu bè D4/A4 rồi rút còn một nốt; E4 cuối ngân 1 |
| 47 | A4–G4–A4–G4–E4–D4 | 1⅔, 2, 2⅓, 2⅔, 3, 3⅓ | LH giữ mô hình G/B/D | Nhắc câu 45 rồi kéo đuôi xuống D4 ngân ⅔ |
| 52 | D4–D#4–E4–G4–A4 | 2⅓, 2⅔, 3, 3⅓, 3⅔ | A2 giữ từ 2, F#2 tại 3, A2 tại 3⅔ | Năm nốt chùm ba liên tục sau cụm C–F#–A; trên D7, chức năng là 1–#1–2–4–5 |
| 65 | E4–G4–E4 rồi D4/G4 | ¾, 1, 1¼, 1½ | Bass G2 rồi E2/G2 trong cùng ô | Câu ở nửa đầu ô, kết bằng bè đôi ngân 1½; không phải đợi cuối ô |
| 105/107 | D–E–F lặp trên G / G–A–Bb lặp trên C | Các bước ⅓ từ ⅓ đến 3 | Bass vẫn hoạt động độc lập | Riff chạy liên tục 5–6–b7; khác ba nốt rời bị ngắt ở bản trước |

**Quan hệ cao độ phải theo hòa âm:** cùng D–D#–E–G xuất hiện trên G ở 35 và D7 ở 52; chức năng tương ứng khác nhau. Không được chỉ lưu bốn tên nốt rồi gọi chung một gam Blues. D# ở 35 tiếp cận bậc 6 (E), không phải b5 của G.

**Trường độ tạo cảm giác chạy:** ở 45/47, các nốt giữa nối nhau cách ⅓ và ngân ⅓, cuối câu mới ngân dài. Ở 35 có trộn ⅓ và ¼. Đây là chuỗi liên kết có hướng đi, không phải đặt vài cú RH theo nhịp dặm. Chép nguyên chuỗi vào cửa sổ ngắn rồi co tất cả xuống 0,125 phách vẫn là sai.

### Robert: phân biệt chạy có đệm và chạy khi bass nghỉ

| Ô | Dòng RH | Thời điểm | LH và kết luận |
| --- | --- | --- | --- |
| 31 (6/4) | Eb5–D5–Bb4–F4–E4, một số tiếng có bè dưới | 2⅔, 3¼, 4, 4½, 5 | LH C3 chỉ đánh ở 0 ngân 2, sau đó nghỉ. Câu đi từ cụm sang nốt đơn, E4 ngân 1; đây là RH tự tiếp câu khi bass nhả |
| 51 → 52 | A4–G4–F4 → E4 | 2, 2⅔, 3¼ → ô sau 0 | LH G3 đầu 51 rồi nghỉ; tại 52 LH F3 vào cùng E4. Câu RH đi qua vạch ô; bass tái nhập ở điểm hạ cánh |
| 82 | F4–G4–Eb4–C4–Eb4–C4; đầu có bè dưới | 0, ⅔, 1¼, 2, 2½, 3½ | LH F3 tại 0, 1; F2 tại 3½. Đường RH nối trên nền thưa, không biến mỗi nốt thành cụm dặm |
| 129–130 | Eb5–E5–F5–Eb5–C5–G4, rồi F4–E4–A4–G4–F4–C4 | Móc đơn/nốt đen của coda | LH hoàn toàn nghỉ 129; 130 chỉ F3 ở 3, E3 ở 3½. Dùng để học hướng câu và láy, **không** làm bằng chứng đệm hai tay xuyên suốt |

Như vậy, ở hai sheet này: **nền bass có thể tiếp tục, giữ nốt, hoặc nhường hẳn một lúc; RH luân phiên cụm, bè đôi, dòng nốt đơn và nốt kết ngân**. “Gần xuyên suốt” mô tả vai trò giai điệu xuyên bài, không có nghĩa hai tay không bao giờ nghỉ. Trung bình số lần đánh/ô bỏ mất sự khác nhau giữa một chuỗi chạy ngắn và các tiếng rải xa nhau.

### Bản sửa mới trong Blues Codex 1

- Giữ nền bass Đức Thịnh 6/8, một ô dài 3 nốt đen. RH soạn theo **câu hai ô**, có thể qua vạch, thay vì gắn vài nốt vào từng ô riêng lẻ.
- Bốn hướng câu dựa trên Rockhouse 35, 45/47, Robert 82 và 31. Đổi nhịp câu về bước cố định **0,5 nốt đen**, không bê nguyên 4/4/6/4 của sheet và không nén theo cửa sổ.
- Nốt giữa ngân **0,48** (khe khoảng 0,02), nốt kết ngân tối đa **0,85**. Lực câu 74–80, nhỉnh hơn cụm nhắp; đủ nổi thành dòng giai điệu.
- Cụm RH nhả trong cửa sổ chạy; LH tiếp tục nền. Cụm có thể trở lại sau câu. Không bắt RH vừa ôm cụm vừa chạy một lớp khác.
- Trên C7, câu đầu **G4–Ab4–A4–C5** tại 2; 2,5; 3; 3,5. Câu tiếp **D5–C5–D5–C5–A4–G4** từ 6,5 đến 9. Có tiếng nối qua đầu ô thứ hai trong mỗi cặp; vẫn có nghỉ trước/sau câu.
- Câu thứ ba tham khảo Robert 82, câu thứ tư đường xuống của Robert 31. Biến thể hợp âm thứ là Codex biên soạn; không gọi là câu thứ đã đo từ sheet. Maj7 giữ 7; sus/dim/altered dùng nốt hợp âm. Đổi hòa âm giữa câu thì chọn nốt hợp âm gần đường đang đi, không nhảy lại từ gốc mới.
- Vòng chỉ một ô cũng có câu 3–4 nốt. Không đủ chỗ cho ba tiếng ở bước 0,5 thì giữ phần đệm; không nén thành móc kép. Nghỉ người dùng và ranh giới đoạn được giữ.
- Không cần bật Fill/Run để nghe câu chạy. Fill/Run tự chọn vẫn thay RH trong cửa sổ đó; không chồng hai câu cùng tay.

Ví dụ hai ô đầu trên C7, đơn vị nốt đen:

| Tay | Thời điểm | Nốt / tiếng | Ngân |
| --- | --- | --- | --- |
| LH | 0; 1; 2,5; 3; 4; 5,5 | BÙM/bùm theo khung gốc | 1; 0,45; 0,5; 1; 0,45; 0,5 |
| RH | 1,45 | E4–G4–Bb4 (chát) | 0,55 |
| RH | 2; 2,5; 3; 3,5 | G4–Ab4–A4–C5 (câu liền) | 0,48; 0,48; 0,48; 0,85 |
| RH | 4,45 | E4–G4–Bb4 (chát trở lại) | 0,55 |

RH nghỉ từ đầu tới 1,45; giữa các nốt chạy chỉ hở 0,02; sau C5 hở 0,1 trước cụm; từ 5 đến hết cặp ô là nghỉ thật. Ở câu tiếp, cụm 7,45 bị nhả để RH chạy qua vị trí đó. “Khớp nền” không đòi giữ nguyên mọi cụm RH khi cùng tay đã chuyển sang giai điệu.

Không tự áp vòng 12-bar lên bài bất kỳ; không đổi bộ dạo/giang/kết dài. Chưa nhận được bài/BPM người dùng đang nghe để so chính xác cấu hình đó. Minh họa có thể thử C7/F7/G7, mỗi hợp âm 3 phách, 101 BPM, chọn **Hai tay**.

File nghe minh họa: `C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues-Codex-1-cau-chay-101bpm.mp3`. Xuất từ timeline vòng C7/C7/C7/C7/F7/F7/C7/C7/G7/F7/C7/G7 khi Fill tắt, chuyển MIDI qua tiếng piano MuseScore; âm sắc và khâu nhập MIDI có thể khác phát trực tiếp KT. Không dùng file này làm bằng chứng đã nghe đúng phiên phát của người dùng.

## 5. Bản Robert và kiểm tra

- Gốc không bị ghi đè. Bản mới `Robert-Ray-chia-doan-C-Blues.mxl`, `.mscz`, `.md` cùng thư mục Linh Nhi.
- Sửa ký hiệu tuplets tại 76 cụm phách, bỏ 16 đầu/đuôi tie không có cặp. Trước/sau, **1.117 sự kiện nốt phát thực** khớp cao độ, tay, thời điểm, trường độ, dynamics. Số ô và số chỉ nhịp giữ nguyên.
- MuseScore 4.7.5 nhập, xuất MSCZ, xuất lại MusicXML và ảnh thành công. Vòng xuất khớp cả 1.117 sự kiện và dynamics. Đã xem ảnh trang đầu/giữa/cuối; sửa tiêu đề/nhãn tràn mép. Đây là kiểm tra CLI/render, chưa thử thao tác mở bằng chuột.
- Bản câu chạy mới: 92 kiểm tra tập trung Blues/render/ráp bài/lịch phát đạt; build TypeScript/Vite đạt. Test mới bắt buộc có 4–6 nốt đơn liền, đi qua vạch ô và tồn tại trong timeline phát khi Fill tắt, thay cho kiểm số cú dặm cũ. Bộ fill/solo: 407/408 đạt; `phraseAcrossBar` còn 262/553 = 47,38% so với ngưỡng 50%, trùng lỗi cũ trong `Reference/SO-TAY.md`, mục `phraseAcrossBar rơi từ 58% xuống 47% ở b2dd25e`.
- Cần người dùng nghe duyệt: kiểm tra đúng nhịp không thay thế đánh giá “vừa” trong bài hát cụ thể.

## 6. Ngày 28/9 — hai điểm tựa 1 và 4, hòa âm và solo

Mục 4 ghi bản lịch sử ngày 27/9. Khung đang áp dụng xem `BLUES-CODEX-1.md`: thêm bass tiếng 4, chuyển chát từ 1,45 về 1,5 nốt đen, đã có bộ solo dài riêng.

### Sheet nói gì về Slow/6/8?

Hai bản chủ yếu **ghi 4/4**, Robert có các ô 6/4 và 2/4. Không có bằng chứng chúng là bản đệm Slow Rock 6/8 nguyên dạng. Các chùm ba, lối long–short và hai tay cài nhau là chất liệu để chuyển dụng. Nếu coi **mỗi nửa ô 4/4 swing là một ô 6/8**, hai phách đen nguồn trở thành hai nhóm móc đơn: 1–2–3 | 4–5–6. Đây là cách chuyển nhịp, không phải khẳng định tên điệu/nhấn âm từ bản thu.

| Nguồn | LH thực | RH thực | Điều áp dụng |
| --- | --- | --- | --- |
| Rockhouse 32 | G1 ở 0 ngân 1; G1/G2 ở 1 ngân 2/3; B1/B2 ở 1⅔ ngân 1/3; D2 ở 2; B1/B2 ở 3; D2 ở 3⅔ | Cụm G13 cùng bass ở 0; cụm D–E–G–Bb ở 1; cụm B–E–G ở 2 rồi chen ở 2⅔/3⅓ | LH dựng xương nhịp; RH có thể cùng hoặc xen, không phải mọi tiếng đều hai tay cùng dặm |
| Rockhouse 35 | D2 giữ tại 2; B1/B2 tại 3; D2 tại 3¾ | D–D#–E–G từ 2⅓ đến 3¼ | Giữa câu chạy vẫn có bass neo, RH chuyển từ cụm sang nốt đơn |
| Rockhouse 105 | G ở 0/1, B tại 1⅔, D ở 2, B ở 3 | D–E–F lặp ở các bước 1/3, đích D ngân 1/2 | Riff có thể xuyên nền; không chờ mốc Fill. Chùm ba đổi về móc đơn 6/8, không nén tùy cửa sổ |
| Robert 56 | C3/G3 ở 0 ngân 2 | D5 vào 2, nhắc 3½ | Hai tay trao câu; một tiếng mới ở RH có thể tiếp tục mạch khi LH ngừng |
| Robert 58 | F2/F3 ở 0, 1⅓; F2 tại 2 ngân 2 | C/F/A ở 0, C/A ở 1⅓, Eb ở 2 rồi A/Eb ở 3¼ | Cụm đầu và bass ngân tạo nền để RH đáp; bass không phải đánh ở mọi nốt chạy |
| Robert 82 | F3 tại 0 ngân 2/3, tại 1 ngân 1/4; F2 tại 3½ | Cụm Bb/C/F → Eb/G → Eb → C → Eb → C | RH nối qua vùng LH nghỉ; không thể kết luận Robert luôn đệm LH liên tục |
| Robert 129–130 | 129 nghỉ cả ô; 130 chỉ F3 rồi E3 cuối ô | Eb–E–F–Eb–C–G; F–E–A–G–F–C | Đuôi solo thưa nền, trao lượt giữa hai tay; không phải mẫu bass chạy suốt |

**Chuyển dụng cụ thể:** nguồn 32 tại 0 → ô 6/8 tiếng 1; tại 1 → tiếng 4; tại 1⅔ → tiếng 6. Nửa sau tại 2/3/3⅔ → 1/4/6 ô tiếp. Nguồn có bass đảo/đi qua khác nhau; KT hiện dùng gốc ở 1/4 và bậc 5 ở 3/6 để tạo nền Slow ổn định. Việc thêm bậc 5 tiếng 3 và lặp gốc là quyết định phối, không ghi là chép nguyên Rockhouse.

### Hòa âm và cách phát triển solo

- Rockhouse 32: bass G + F–B–D–E–G là G13; bậc 3 và b7 định chức năng, 6/13 tạo độ đầy. Ô 35 D# là tiếp cận E, không phải b5 của G. Ô 52 cùng tên nốt chuyển chức năng trên D7.
- Robert 63 bass Eb với Gb/C rồi E với G/C; 70–71 bass E→Eb; 77–78 F→Gb→G. Nhãn hợp âm có chỗ đặt lệch nốt thật. Giữ dim/slash/sus, không biến toàn bộ thành dominant.
- Robert 78 đầu có F/A/C trên G (sus), cuối có F/G/B/Eb trên G (dominant b13). Dùng nốt đích theo hợp âm đang vang; Blues không đồng nghĩa chỉ dùng một gam sáu nốt cho mọi thời điểm.
- Bộ mới soạn câu theo giọng bài, nhắc–đáp, 4–6 nốt rồi đích ngân; LH neo 1/4, RH nhả cụm khi chạy. Khi kết bài, giảm mật độ và giữ tiếng cuối. Kỹ thuật bè đôi/cụm, chạy chromatic, trao tay có dấu vết trong ký âm; láy nhanh, lực và trường độ 6/8 trong KT là biên soạn. Chưa suy ra ngón tay/pedal của người chơi.
- Robert có tiêu đề nội tại ghi **Robert Van**; tên file `Robert-Ray` không đủ xác nhận Ray Charles là người chơi.

Kiểm tra ngày 28/9: 199 test Blues/reharm/conflict/render/ráp bài/lịch phát đạt, TypeScript + Vite build đạt (cảnh báo kích thước bundle). Test phủ dạo/giang/kết 24 giọng, tầm RH, thời lượng, đổi lượt, hai neo 1/4 và vòng lời. Chưa có nghe duyệt của người dùng.
