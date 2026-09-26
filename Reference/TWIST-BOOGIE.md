# Twist — mẫu đệm từ sheet Boogie Woogie

Ngày triển khai: 26/9/2026. Người dùng yêu cầu phân tích sheet
`D:/PianoBrain/video/Linh_Nhi/boogie woogie-Linh Nhi.mxl`, lấy tiết tấu đệm,
tạo nút riêng và đặt tên **Twist**. Trạng thái: đã dựng để nghe thử, chưa nghe duyệt.

## 1. Nguồn và cách đo

- SHA-256 file gốc: `862e1a4b87a07579945ec360abce52cd3fd942f31c70bc8aa807c311f504100b`.
- MXL chứa `score.xml`; một part, hai khuông (staff 1 = phải, staff 2 = trái).
- 34 ô theo số `measure`, 4/4, `divisions=2`, nốt đen = **180**, chỉ dẫn chữ **Swing**.
- Không có ký hiệu hợp âm, tỷ lệ swing, dynamics, pedal hoặc mode trưởng/thứ.
- Tiêu đề metadata: *Boogie Woogie Basics*. Credit hiển thị:
  *Boogie Woogie Piano — Marco Brandt*. Tên file/thư mục do người dùng cung cấp
  mang tên Linh Nhi; chưa xác định vai trò biên soạn của Linh Nhi. Tên Twist
  trong app là tên do người dùng yêu cầu, không phải nhãn thể loại ghi trong sheet.

Đọc riêng từng ô: đặt cursor về 0, duration chia divisions; `backup` lùi cursor,
`forward` tiến cursor; nốt `<chord>` dùng cùng onset với nốt trước, không tiến
cursor; grace không chiếm thời gian; `tie stop` chỉ ngân, không đếm là cú gõ.
Nhóm nốt theo staff + onset để đếm **cú gõ**. Giữ từng nốt riêng trong nhóm
để kiểm cao độ và trường độ. Có hai lần phân tích độc lập đồng ý các số dưới đây.

Ô 1 là lấy đà **1½ phách**, dù ghi nhịp 4/4. Không dùng thời gian cộng dồn từ
bộ đọc cũ vốn coi ô 1 dài 4 phách; phép đo này dùng vị trí tương đối trong ô.

## 2. Chọn phần đệm

| Ô | Vai trò | Cách dùng |
|---|---|---|
| 1–5 | Lấy đà + dạo đầu | Cử chỉ mở bài, không đưa vào cell đệm lặp |
| **6–16** | Vòng blues 1, trước ô quay đầu | Nguồn chính cho tiết tấu cả hai tay |
| 17 | Quay đầu, RH lấy đà từ 3& | Loại khỏi cell: LH chỉ còn 5 cú rồi nghỉ |
| 18–21 | Nhắc lại dạo 2–5 | Đoạn nối, không phải đệm thường |
| **22–31** | Thân vòng blues 2 | Đối chiếu LH; RH là câu solo có bè đôi/tie/grace |
| 32–34 | Câu kết + ngân | Không dùng làm đệm lặp; ô 34 chỉ nối ngân từ ô 33 |

LH có **21/21 ô** cùng mẫu chuyển giọng (13 ô gốc C, 6 ô F, 2 ô G).
RH có **11/11 ô** cùng tiết tấu chặn hợp âm. Không lấy giai điệu solo RH
22–31 để biến thành tiếng chát trong đệm hát.

## 3. Tiết tấu và cao độ đo được

| Phách trên sheet | 1 | 1& | 2 | 2& | 3 | 3& | 4 | 4& |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Offset theo nốt đen | 0 | ½ | 1 | 1½ | 2 | 2½ | 3 | 3½ |
| LH: bậc theo gốc | 1 | 1 | ♭3 | 3 | 5 | 1 | 6 | 5 |
| LH: số nửa cung | 0 | 0 | 3 | 4 | 7 | 0 | 9 | 7 |
| Trường độ LH ký âm | ½ | ½ | ½ | ½ | ½ | ½ | ½ | ½ |
| RH | Hợp âm, giữ 1 phách | còn ngân | nghỉ | nghỉ | nghỉ | Hợp âm, giữ ½ phách | nghỉ | nghỉ |

**Hai tiếng gốc đầu ô đánh lại**, không gộp thành nốt đen. Cặp ♭3→3 là
tiếp cận nửa cung; không ép cả tuyến bass thành nốt trong hợp âm.

| Gốc | LH thực tế | RH thực tế | Số ô RH |
|---|---|---|---:|
| C | C2 C2 E♭2 E2 G2 C2 A2 G2 | E4 G4 A4 C5 — C6 | 7 |
| F | F2 F2 A♭2 A2 C3 F2 D3 C3 | E♭4 G4 A4 C5 — F9 bỏ gốc | 3 |
| G | G2 G2 B♭2 B2 D3 G2 E3 D3 | F4 G4 B4 D5 — G7 | 1 |

Tổng RH: 22 cú chặn, không phải 88 cú từ 88 đầu nốt. Trong vùng đệm không có
tie, grace, slur, staccato, accent hay lực đánh được ghi; số ngón ở mẫu đầu
không được diễn giải thành nhấn phách.

### Hai tay phối hợp như thế nào?

**Có: ô 6–16 là mẫu đệm phối hợp hai tay.** Tay trái giữ chuyển động bass,
tay phải tạo hai điểm chặn hòa âm. Hai cú chặn đều **đánh cùng bass gốc**:
tiếng LH thứ 1 ở phách 1 và tiếng LH thứ 6 ở 3&. Đây không phải cách hai tay
luân phiên từng tiếng; sáu cú LH còn lại rơi khi RH đang ngân hoặc nghỉ.

| Tiếng/vai trò | Vị trí trong ô | Ngân và phối hợp |
|---|---|---|
| **BÙM + chát**: LH gốc + RH hợp âm | **1** | RH giữ 1 phách, xuyên qua cú LH ở 1& |
| Bass LH gốc | 1& | Gõ lại gốc; RH còn ngân, không gõ lại |
| Bass LH ♭3 → 3 → 5 | 2 → 2& → 3 | Mỗi vị trí một tiếng LH; RH nghỉ thật |
| **BÙM + chát**: LH trở về gốc + RH hợp âm | **3&** | Hai tay cùng gõ; RH tắt ở đầu phách 4 |
| Bass LH 6 → 5 | 4 → 4& | RH nghỉ đến hết ô |

Với diễn giải swing 2:1, các dấu `&` lùi đến 2/3 phách. Cú hai tay ở 3&
cùng onset `8/3`; RH ngân `1/3` phách rồi nghỉ. RH có hai khoảng nghỉ:
từ đầu phách 2 đến 3& và từ đầu phách 4 đến cuối ô. LH nối đủ tám tiếng
dài/ngắn như mục 4; không có khoảng nghỉ LH trong mẫu đệm ổn định.

**Vai trò này thay đổi theo đoạn:** ô 22–31 giữ cùng LH nhưng RH chơi câu
solo; không thể gọi mọi nốt RH trong toàn sheet là đệm. Dạo đầu, đoạn nối
và câu kết cũng có cử chỉ riêng. Vì vậy nút Twist dùng cả hai tay của
ô 6–16, chỉ dùng ô 22–31 để xác nhận tính ổn định của tuyến bass.

Các điểm đối chiếu cụ thể ngoài cell:

- Ô 2–3 / 18–19: hai tay cùng đánh ở `1, 1&, 2, 2&, 3`; LH là quãng tám,
  RH là cụm hợp âm. Từ 3&, LH nghỉ, RH chơi lấy đà E♭ láy → E–G–A.
- Ô 4 / 20: LH đánh quãng tám C–E–F–F♯ ở bốn phách chính; RH đánh
  móc đơn hai lần trên mỗi tiếng bass, có cả cú chung và cú riêng RH.
- Ô 5 / 21: hai tay cùng đánh ở 1 và 2&; cụm 2& nối qua phách 3,
  không đánh lại ở 3; tới phách 4 cả hai nghỉ.
- Ô 23→24: bè đôi RH G4–C5 ở 4& ô 23 nối sang phách 1 ô 24,
  trong khi LH đánh bass mới. Đây là dẫn câu solo, không phải cú chặn
  đầu ô trong mẫu đệm 6–16.

## 4. Chuyển vào KeyTrain

Mẫu riêng trong `src/reharm/style/styleLibrary/twist.ts`, `id/family = twist`,
một cell **4 phách**, nút **Twist** ở nhóm **4/4**. Dùng nhóm riêng để chọn điệu
không tự kéo bộ solo Bolero Linh Nhi hay Bossa/ballad Cà Pháo vào.

**Swing 2:1 là lựa chọn diễn giải**, không phải số đo từ bản thu. Sheet chỉ ghi
chữ Swing trên staff 1; áp dụng cùng lưới cho cả hai tay để chúng khớp nhau:

- LH onset: `0, 2/3, 1, 5/3, 2, 8/3, 3, 11/3`.
- LH duration: `2/3, 1/3` lặp 4 lần; đến đúng cuối ô 4 phách.
- RH onset/duration: `0/1` và `8/3 / 1/3`; tiếng thứ hai hết đúng phách 4.
- Encode trực tiếp trong cell vì `feel: swing` không đổi thời điểm phần đệm
  trong `renderPattern`. Không đổi bộ chia nhịp của các điệu hiện có.
- `releaseRatio = 1`, giữ hết trường độ; lực đánh dùng mặc định của app,
  không tự thêm accent 2–4. Chưa có dữ liệu lực đánh nguồn.

**Hòa âm là phần chuyển dụng:** giữ mẫu bass trên hợp âm trưởng, nhưng tay phải
dùng thế bấm của hợp âm người dùng đang chơi, không tự đổi mọi C/F/G thành
C6/F9/G7. Người dùng vẫn chọn màu hợp âm theo cơ chế hiện tại của app.

- Bậc ba và năm bass lấy từ hợp âm; tiếng ngay trước bậc ba thấp hơn nó một
  nửa cung. Trên hợp âm thứ: `1–1–2–♭3–5–1–6–5`; màu 6 trưởng được giữ.
  Đây là cách mở rộng để đệm bài giọng thứ, **không có mẫu thứ trong nguồn**.
- Hợp âm thiếu bậc ba/năm dùng quy tắc thay bậc hiện có của renderer.
  Không tuyên bố tái hiện sheet cho sus/dim/altered hoặc hợp âm slash:
  renderer hiện lấy mốc gốc từ bass của thế bấm, kể cả bass đảo.
- Tầm gốc LH của app: MIDI 36–47; trần riêng 60 để nốt 6 ở giọng cao không
  bị gập xuống dưới gốc. Trên C/F/G giữ được nguyên cao độ bass nguồn.
- `autoFills = false`: giữ mẫu ở các chỗ fill tự động thông thường; fill chọn
  tay/mốc chuyển đoạn vẫn theo lựa chọn của người dùng. Công tắc Walking
  bass chung, nếu bật, vẫn thay tuyến bass theo chức năng hiện có.
- Giữ nghỉ RH khi hợp âm đổi giữa ô: thêm riêng `twist` vào `KEEP_RH_RESTS`,
  tránh renderer tự chèn cú chặn ngoài hai mốc đo được.
- Chưa soạn dạo/giang/kết riêng cho Twist; việc này không thuộc lượt trích
  tiết tấu đệm. `soloMaxStrikes = 8` khai đủ mật độ bass cho đường solo chung.

## 5. Nghe thử và kiểm tra

Chọn **Twist** trong nhóm 4/4; nghe C–F–G, mặc định mỗi hợp âm hai ô, 180 BPM;
tắt Walking bass khi muốn nghe chính tuyến bass được trích. Có thể giảm BPM
để nghe cặp tiếp cận ♭3→3 và hai cú chặn tay phải.

Hai thanh BPM (thanh phát và khung chọn điệu) được mở trần từ 160 lên 240,
để hiển thị và chỉnh lại được mốc 180 sau khi giảm tốc tập. Tempo mặc định
của các điệu vẫn lấy từ chính điệu đó.

Kiểm thử hồi quy ở `src/reharm/style/__tests__/twist.test.tsx`: timeline bass,
swing/gate và nghỉ RH; chuyển giọng trưởng/thứ; hợp âm chia nhỏ; nút Twist
hiện và được chọn trong bảng điệu. Các thay đổi có nguồn để nghe đối chiếu,
chưa được gọi là đã nghe duyệt chỉ vì kiểm thử đạt.

## 6. Số lần đệm mỗi hợp âm — yêu cầu 27/9/2026

- Mặc định **không tick**: mỗi hợp âm đánh trọn mẫu hai tay **2 lần = 8 phách**.
- Tick **“Twist: mỗi hợp âm đánh 1 lần rồi chuyển”**: **1 lần = 4 phách**.
- Một lần là cả cell hai tay 4 phách, không phải một cú chát. Nhịp vẫn là
  4/4; các onset, nốt bass và khoảng nghỉ RH trong cell không đổi.
- Lựa chọn lưu theo bài bằng `twistSinglePass`; bài cũ thiếu trường này và
  bài mới nạp đều mặc định hai lần. Điệu khác vẫn dùng lựa chọn thời lượng cũ.
- Áp dụng cả cho bài nhập có thời lượng sẵn; bảng thời lượng nguồn được
  giữ nguyên trong dữ liệu để dùng lại khi đổi sang điệu khác. Cặp hợp âm
  chia đôi và phần nghỉ thêm ở mốc chuyển đoạn vẫn theo lựa chọn riêng.
- Đổi tick khi đang phát sẽ dừng; bấm phát lại để nghe từ lịch mới.

Quy tắc hai lần là yêu cầu phối đệm của người dùng; phân tích nguồn ở trên
không có nghĩa mọi hợp âm trong toàn sheet đều đổi sau đúng hai ô.
