# Bộ soạn solo Ballad Cà Pháo, 23/09/2026

Trạng thái: bản triển khai để nghe duyệt, chưa phải xác nhận chất lượng nghệ thuật.
Yêu cầu mới thay giới hạn chỉ biến thể Có Em Chờ của bản 22/09. Không thay Bossa CP đã duyệt.

## Train Ballad Sau Đánh Giá 7/10

Phản hồi 23/09/2026: Có Em Chờ tạm ổn **7/10**, còn lặp nốt, phô/chói và
thiếu kỹ thuật so với sheet; người dùng yêu cầu train tiếp. Đây không phải
duyệt đóng băng. Phản hồi gốc được ghi trong `CA-PHAO.md`, riêng mục ballad.

Đọc lại cả 25 đoạn/9 sheet qua `tools/cp_ballad_solos.py --check`: dữ liệu khớp
file nguồn. Lượt này không sửa corpus, không thêm nguồn Bossa, không học phần hát.
Chưa có take/bài/ô phát cụ thể cho từng chỗ phô người dùng báo; các phép đo dưới
đây tái hiện điểm yếu của bộ soạn, không xác nhận đúng mọi câu người dùng đã nghe.

### Chứng Cứ Và Điểm Yếu

- Chọn vòng và chọn giai điệu trước đây chỉ có ưu tiên nhẹ khi trùng cell.
  Cùng mode chưa đủ: đường nốt đẹp trên hợp âm nguồn có thể méo khi ép lên
  chức năng khác. Chấm thêm độ khớp chức năng tại các điểm gõ sau ánh xạ thời gian.
- Ghép tiết tấu từ sheet khác lấy nốt bằng chỉ số thời gian làm tròn xuống,
  nên nhiều điểm gõ mới có thể dùng lại một nốt nguồn. Thay bằng nội suy đường
  cao độ theo thứ tự điểm gõ, giữ hai đầu. Đây là biên soạn, không gọi là chép sheet.
- Tăng ưu tiên vai trò nốt trên hợp âm và hướng đi của đường nguồn; phạt riêng
  trường hợp nguồn chuyển động mà đầu ra đứng nốt/đi ngược. Nốt lặp có chủ ý
  trong nguồn vẫn được phép; không áp quy tắc cấm mọi tiếng lặp.
- Bè đôi quãng ba/sáu có trong nhiều solo: Có Em Chờ dạo ô 2, giang ô 52,
  kết ô 68; Hồng Kông 1 dạo ô 3/9; Để Em Rời Xa giang ô 29; ACDD giang ô 34/36.
  Kho Có Em Chờ có 6/5/7 điểm gõ đúng hai nốt cách 3, 4, 8 hoặc 9 bán cung
  ở dạo/giang/kết. Đây là các điểm gõ, không phải 18 kỹ thuật độc lập.
- Nguồn có tiếp cận giải xuống nửa cung, không chỉ giải lên: Có Em Chờ dạo
  ô 2, offset toàn đoạn 7.333333, vai trò b7–b6–5 trên hợp âm thứ; Hồng Kông 1
  giang ô 52, offset 22.25/23.25, vai trò 5–4–3 trên hợp âm trưởng.
  Quan hệ nửa cung không đồng nghĩa mọi nốt đó là chromatic ngoài gam.

### Phép Chuyển Thể

1. Bè đôi giữ loại quãng ba/sáu tại chính điểm nguồn có hai bè, nếu cả hai nốt
   khớp hợp âm đích và tầm đàn. Không tìm được thì bỏ bè phụ, không đổi thành
   quãng khác hoặc thêm nốt chói cho đủ số bè. Trace `third-dyad`/`sixth-dyad`
   chỉ ghi khi đầu ra thực sự có cặp quãng đó.
2. Tiếp cận lên/xuống dùng đúng ngữ cảnh ba nốt của donor, cùng mode/chức năng/
   chất hợp âm. Phải ngắn, ở phách lẻ, chuẩn bị ổn định và giải ngay vào nốt
   hợp âm. Không rải chromatic bằng kho nốt chung; không lấy cao độ nguồn khác
   mode khi mượn nhịp. Trace `semitone-approach` ghi khi thỏa điều kiện.
3. Nếu tiếng giai điệu mới cách tiếng trước nửa cung, không để tiếng giai điệu
   cũ ngân đè dài hơn .125 phách qua điểm mới. Không cắt toàn bộ cụm, không đổi
   hàm ngân chung của Bossa; nốt kề chủ ý vẫn ngắn/nhẹ theo luật đã có.
4. Loại cell thân câu vốn có khoảng im RH quá 1.5 phách; giữ các ô kết thưa
   trong dữ liệu nhưng không dùng chúng để làm thân câu hoạt động.

### Kiểm Chứng

Mẫu đo: Có Em Chờ, giang full, tonic 4, trưởng/thứ, take 0–11, opening null,
dropRoot true, BPM điệu, tầm 36–96. Đếm đỉnh RH mỗi onset, không đếm từng bè.

| Chế độ | Lặp nốt ngay trước, bản 4822795 | Sau sửa |
|---|---:|---:|
| Trưởng | 203/1258, 16.1% | 106/1216, 8.7% |
| Thứ | 237/997, 23.8% | 176/1007, 17.5% |

Nguồn chọn thay đổi nên tổng điểm gõ khác; không đọc bảng thành A/B nghe cùng
một câu nguyên xi hoặc điểm chất lượng nghệ thuật. Kiểm thử riêng còn so đường
nguồn đang đi với đầu ra đứng nốt, kiểm chứng bè đôi/tiếp cận có nguồn và nhả
tiếng kề, không chỉ đếm nốt cho dày.

Điều chỉnh hai phép kiểm cũ: mật độ so với số điểm gõ của câu nguồn được chọn
(chừa đuôi cadence), thay vì ép mọi dạo có ít nhất 40 điểm; độ đa dạng kỹ thuật
tính cả loại mới, không bắt mọi lượt phải có đủ ba loại cũ. Không nới kiểm
khoảng im, phách dẫn, mode, tầm đàn hoặc Bossa để làm xanh kết quả.

**77/77 kiểm thử liên quan đạt**; build và ESLint ba file TypeScript chỉnh sửa
đạt. Build còn cảnh báo bundle lớn có sẵn; không chạy toàn suite lượt này.
Giữ mô phỏng nguyên câu, đệm hát và phách dẫn.
Bản này vẫn chờ nghe duyệt mới. Không tuyên bố đã học đủ pedal, rubato, lực
ngón hoặc mọi kỹ thuật từ sheet; không tăng dày trang trí để thay cho giai điệu.

## Sửa Nhầm Nguồn Mô Phỏng

Sau mốc `9512c77`, ảnh người dùng cho thấy đang chọn "Mô phỏng nguyên câu sheet"
nhưng điệu Có Em Chờ lại phát nguồn Chưa Bao Giờ. Nguyên nhân đã tái hiện: nhánh
full chỉ lọc genre + mode + loại đoạn rồi ưu tiên đoạn dài nhất, không ràng buộc
bài gốc của nút điệu. Đây là lỗi chọn nguồn, không phải bằng chứng bộ soạn mới
đã phát câu đó; `caPhaoSimulate` đi thẳng vào nhánh mô phỏng trước nhánh compose.

- `cpSoloSong` gắn bài gốc cho cả phiên/điệp Có Em Chờ, Ngày mai em đi và ACDD.
  Mô phỏng khóa nguồn theo trường này, kể cả khi bản lưu cũ còn tên bài khác.
  Nút điệu sheet mới cần khai trường này để có cùng bảo vệ.
- Không tìm được nguồn đúng mode/đoạn thì trả lý do và không phát sheet thay thế.
  Có Em Chờ gốc là trưởng; không tự đổi thành thứ rồi gọi đó là nguyên câu.
  ACDD chưa có trong kho full cũ nên báo thiếu mô phỏng, không lấy Chưa Bao Giờ.
  Kho ballad đã phân tích cho compose vẫn có ACDD; hai kho có phạm vi khác nhau.
- UI nguồn mô phỏng khóa theo tên bài; nhánh compose vẫn học chéo sheet đúng mode.
  Không tự đổi lựa chọn chế độ đã lưu của người dùng.

Train tiếp ở nhánh compose: ưu tiên kỹ thuật chưa xuất hiện trong câu (quãng tám,
cụm nửa cung, chia nhỏ nhịp, dặm hai tay, LH đáp dưới RH ngân), thay vì chỉ chọn
cell dễ khớp. Không cho lần thay tiết tấu ngẫu nhiên xóa mất kỹ thuật mới của
cell đã chọn. Khi thêm cụm nửa cung, giữ cặp quãng tám nếu tầm đàn cho phép.
Các điều kiện nhịp, mode và giải quyết nốt vẫn có quyền loại ứng viên; không ép
mọi câu phải có mọi kỹ thuật. Trên 12 lượt giang full E trưởng kiểm tra, cả 12
có ba loại được ghi trace: neighbor-cluster, octave-line, left-answer. Không
dùng kết quả đếm này để khẳng định chất lượng nghe hay như bản biểu diễn gốc.

Kiểm tra: **75/75** bài liên quan đạt; build đạt; lint không lỗi, còn 7 cảnh báo
Hook sẵn có. Bossa và phách dẫn sau ráp bài đều qua hồi quy. Không chạy toàn suite.
Chưa nghe duyệt bản mới; cần kiểm riêng mô phỏng đúng nguồn và compose mới.

## Bổ Sung Kỹ Thuật Sau Mốc 02dfd38

Người dùng nghe thấy câu đã tạm được nhưng kỹ thuật còn kém sinh động so với
Có Em Chờ gốc; yêu cầu train tiếp, đồng thời hỏi hỗ trợ giọng trưởng.
Bộ soạn có cả major/minor, chọn dữ liệu cao độ và hòa âm theo mode, không biến
vòng trưởng thành thứ bằng đổi Tone. Cả 12 chủ âm mỗi mode đều được kiểm lại.

Đọc trực tiếp `Co Em Cho-Ca Phao.mxl` bằng `scripts/audit_ca_phao.py`:

- Ô 2: cụm Eb–E–F trong nhóm chùm ba rồi Eb–D.
- Ô 6: F–Gb rồi Eb, C–Db rồi chuỗi quãng tám C–Bb–Ab.
- Ô 7: Gb–G rồi Eb. Ô 54: F–Gb chồng quãng tám rồi Eb chồng quãng tám.
- Ô 68: E–F–Gb rồi Gb. Đây là cụm ký âm đồng thời, không phải dấu grace.
- Dạo/giang/kết có lần lượt 4/5/1 cụm chứa nửa cung, 3/8/4 cụm chứa quãng tám.
  Không có dấu arpeggiate hoặc grace trong ba cửa solo Có Em Chờ này; không tự
  gọi tất cả cụm thành vuốt/luyến, cũng không suy pedal hay rubato từ đó.

Tái hiện trước sửa: điệu Có Em Chờ, giang full, tonic 4, take 0–11, cả hai mode,
`opening: null`, `dropRoot: true`, tầm mặc định. Không có cụm nửa cung nào trong
24 lượt; RH chỉ có ba mức velocity 68/76/82. Nhánh thứ không dùng tiết tấu Có Em
Chờ lần nào, vì bộ chọn cao độ đúng mode đồng thời loại luôn kỹ thuật của bài.

Lượt này giữ khung câu và sửa chuyển thể:

1. Cụm nửa cung có chứng cứ nguồn được chuyển thành nốt kề dưới ngắn cạnh tiếng
   hợp âm, với tiếng kế tiếp cũng là nốt hợp âm trong quãng ba bán cung trở xuống.
   Nốt kề nhẹ hơn, dài tối đa .125 phách. Đây là phép chuyển thể bảo thủ, không
   tuyên bố chép nguyên trường độ/cao độ cụm gốc; không thêm cụm ở chỗ không có nguồn.
2. Giữ bè quãng tám của nốt lướt đã qua kiểm tra giải quyết, thay vì bỏ bè thấp
   chỉ vì tiếng trên tạm không thuộc hợp âm. Tầm đàn vẫn giới hạn cả hai tay.
3. Cho phép cụm tay trái từ nguồn đáp dưới RH đang ngân, giữ mọi điểm bass của
   điệu. Chỉ thêm khi nguồn và đầu ra đều có RH ngân tại đó; không áp vào đệm hát.
4. Giai điệu mạnh hơn bè trong; nốt kề nhẹ hơn nữa. Độ nâng lực theo câu là lựa
   chọn phối của app, không phải velocity đo được từ bản biểu diễn của CP.
5. Khi điệu cùng bài không có nguồn cùng mode, thử một cell kỹ thuật của bài
   tại ô 3–4. Với Có Em Chờ giọng thứ, chỉ mượn thời điểm/số bè/kiểu quãng;
   nguồn giai điệu và vòng hòa âm vẫn phải là thứ. Mẫu không khớp bị bỏ.

`compositionTechniques` ghi nguồn và thời điểm kỹ thuật thực sự phát để đối chiếu,
không chỉ đánh dấu có kỹ thuật trong kho. Kiểm thử mới kiểm tiếng kề ngắn/nhẹ,
nốt chính và nốt giải quyết đúng hợp âm, bass đáp có tiếng ngân, và không rò
giai điệu trưởng sang nhánh thứ. **72/72 kiểm thử liên quan đạt**, build và lint
các file chỉnh sửa đạt; cảnh báo bundle lớn vẫn có. Không chạy lại toàn suite.
Đây là bản chờ nghe duyệt, không kết luận đã mô phỏng đủ kỹ thuật biểu diễn CP.

## Lượt Sửa Sau Phản Hồi Nghe

Người dùng báo solo Có Em Chờ sơ sài, ngắt quãng và thiếu kỹ thuật. Đối chiếu đầu ra
commit `4ef8456` với dữ liệu nguồn cho thấy:

- Các ô kết 71–72 Có Em Chờ, 79–80 Chưa Bao Giờ, 72–73 Để Em Rời Xa có câu rải
  ngắn rồi ngân/nghỉ dài. Bộ chọn cũ ưu tiên chúng vì dễ khớp bass; đặt vào thân
  dạo/giang làm mất câu nhạc, nhất là khi hợp âm mới cắt tiếng ngân.
- Ràng buộc mọi cú dặm phải trùng bass mẫu đệm hát loại nhiều cử chỉ hai tay.
  Việc nắn mọi mốc bass cũng dễ làm mất chùm ba hoặc kéo rộng khoảng nghỉ.
- Ép mọi nốt lướt giải quyết ngay vào nốt hợp âm, cùng lực hút quãng âm quá yếu,
  làm méo đường giai điệu hoặc đẩy câu rải ngày càng lên cao.
- Hàm cắt tiếng lặp áp cho cả cụm có thể cắt cả bè trên khi chỉ một bè trong gõ lại.

Sửa trong bộ soạn ballad, không sửa dữ liệu nguồn, bộ đệm hát hoặc Bossa:

1. Thân câu chọn cử chỉ có hoạt động ở cả hai ô; ô kết thưa vẫn có trong kho phân
   tích nhưng không được tái dùng làm thân câu. Điểm rơi kết bài vẫn được soạn riêng.
2. So sánh giữ nguyên thời điểm với ánh xạ sang nhịp đích; không chọn ánh xạ tạo
   thêm khoảng im. Giữ mọi điểm bass của điệu, cho thêm đúng cú dặm hai tay có
   chứng cứ nguồn trong solo. Quy tắc này thay giới hạn LH tuyệt đối ở bản đầu.
3. Giữ hình lên/xuống và độ mở quãng của câu nguồn trong tầm đàn; ưu tiên câu cùng
   vòng hòa âm khi khớp. Đường liền bậc có chứng cứ được đi qua tối đa hai nốt lướt
   trước khi về nốt hợp âm, không tự thêm thang âm chạy cho mọi chỗ.
4. Cụm hợp âm giữ dáng bè gần nguồn, có thể có quãng hai phù hợp hợp âm. Khi gõ
   lại, chỉ cắt đúng cao độ lặp; giữ bè khác còn ngân. Tăng ưu tiên nốt chung khi
   một tiếng dài đi qua chỗ đổi hợp âm, tránh cắt tiếng rồi bỏ trống.

Mẫu tái hiện: điệu `ca-phao-ballad-co-em-cho`, `take: 0`, full, tonic 4,
`opening: null`, `dropRoot: true`, BPM mặc định điệu, tầm đàn mặc định 36–96.
Đếm điểm gõ RH theo thời điểm, không đếm từng nốt trong cụm là một cú riêng:

| Dạo | Trước | Sau | Khoảng im RH dài nhất trước/sau |
|---|---:|---:|---:|
| E trưởng | 27 | 66 | 0.5 / 0.5 phách |
| E thứ | 28 | 54 | 4 / 0.5 phách |

Số nốt không phải mục tiêu tối ưu hay chứng nhận nghệ thuật. Giữ khoảng thở có
trong nguồn; không kéo ngân tất cả các tiếng hoặc lấp mọi chỗ nghỉ bằng nốt mới.
Kiểm thử bổ sung đo riêng khoảng im RH, giữ chùm ba/quãng tám/dặm hai tay, giữ
ngân từng bè và chứng cứ cho bass thêm trong solo. Ma trận 12 giọng trưởng/thứ,
các điệu CP, phách dẫn sau ráp bài và snapshot Bossa: **70/70 đạt**. Build và lint
hai file TypeScript chỉnh sửa đạt; build còn cảnh báo bundle lớn có sẵn.
Không chạy lại toàn bộ suite trong lượt này; kết quả toàn dự án bên dưới thuộc
lượt triển khai đầu. Chờ người dùng nghe lại bằng Phát trọn bài, không chỉ tua
trong câu đang lưu. Chưa có xác nhận chất lượng giai điệu sau lần sửa này.

## Nguồn và phép đo

Đọc lại MusicXML/MXL gốc, không lấy sổ solo cũ làm chân lý. Chỉ phân tích dạo,
giang, kết đã chia; không lấy RH phần hát để học tiết tấu đệm. Không sửa file PianoBrain.
`CP-BALLAD-SOLO-INVENTORY.json` lưu đường dẫn, SHA-256, cửa lời hát, hợp âm,
cú gõ từng tay/từng ô, cụm hợp âm, đường chạy và giới hạn dữ liệu của cả 25 đoạn.
`src/reharm/style/cpBalladSolos.json` là bản dữ liệu runtime, tách khỏi dữ liệu Bossa cũ.

Đơn vị là nốt đen, offset từ 0. Một cụm nhiều nốt cùng tay/cùng thời điểm tính là
một cú gõ. Nối dấu luyến ngân trước khi đếm, không coi tie-stop là cú gõ mới.
Các con số không phải mức xác suất phải phát, và không chứng minh kỹ thuật là
độc quyền của CP. Đây là học quy tắc từ ký âm, không phải huấn luyện mô hình âm thanh.

**Không phải mọi ô trong kho ballad đều 4/4:** Hồng Kông 1 chuyển 2/4 tại ô 100;
Để Em Rời Xa có 2/4 ở 10, 3/4 ở 11 và 71, 6/4 ở 23, rồi trở lại 4/4;
Chưa Bao Giờ có 3/4 ở 0 và 17. Chỉ hai ô 4/4 liên tiếp, không cắt ngang nốt nối,
mới vào kho cử chỉ hai ô của bộ soạn này. Những đoạn còn lại vẫn được phân tích.

## Từng Sheet

Số cú gõ RH/LH lần lượt theo dạo, giang, kết. Mốc bên dưới là số ô XML,
không đồng nhất với số thứ tự hiển thị khi sheet có ô lấy đà số 0.

| Sheet | Giọng dùng học cao độ | Đoạn | RH/LH | Nhận xét có chứng cứ |
|---|---|---|---|---|
| Hồng Kông 1 | C trưởng | 1–15; 47:2 đến 65:1.5; 100:.5 đến 107:2 | 70/57; 146/82; 39/19 | Giang có 107 cú RH trên bass đang ngân, 13 nhóm chạy ứng viên. Chủ yếu đường đơn, xen cụm dặm; kết 2/4 không đưa vào mẫu hai ô 4/4. |
| Có Em Chờ | Eb trưởng; kết E trưởng | 1 đến 8:3.5; 48:.25 đến 56:2; 66–72 | 65/45; 81/53; 45/30 | Dạo/giang đều có 6 nhóm chạy; cụm dặm lần lượt 9/11/9. Có nhắc lại ý IVmaj7 ở ô 5/53, mở quãng và đối đáp bass. |
| Ngày mai em đi | Eb trưởng | 1–18; 51:.75 đến 54; 87:.75 đến 91 | 101/90; 30/24; 26/22 | Dạo có 18 cụm >=3 nốt, nhưng giang không có cụm >=3 nốt. Không áp cùng mật độ dặm cho mọi loại đoạn của bài. |
| Kém duyên | Chưa xác nhận | Giang 27–36; kết 70–79, chỉ học ô bên trong | 48/41; 29/35 | Giang có 29 cụm >=3 nốt và 32 điểm hai tay cùng đánh: nguồn kỹ thuật dặm rõ. XML không có nhãn hợp âm; không đoán Bb trưởng/G thứ chỉ từ hóa biểu. |
| Yêu xa | Chưa xác nhận | 1–9; 41–50; 106–112, chỉ học ô bên trong | 55/25; 54/37; 26/15 | Có 5/5/2 nhóm chạy và 7/4/3 cụm chứa quãng tám. Chỉ học thời điểm, số bè, quan hệ hai tay; không đưa MIDI hay vòng hợp âm vào kho trưởng/thứ. |
| Để Em Rời Xa | D thứ; kết Eb thứ | 0–3; 28 đến 32:1; 64–73 | 31/22; 41/26; 53/73 | Dạo không có cụm RH >=3 nốt, kết có 15. Vòng bVI–bVII–i lặp lại, không ép thành ii–V–I trưởng. Ô 71 khác nhịp bị loại khỏi câu hai ô. |
| Chưa Bao Giờ | F thứ | 0–8; 35 đến 43:3.5; 79–80 | 58/39; 82/64; 4/1 | Giang có 6 nhóm chạy, bass giữ dưới đường RH; kết rất thưa. Nhiều nốt nối qua ranh giới hai ô: được lưu trong phân tích nhưng không cắt làm cell. |
| Chúng Ta Không Thuộc Về Nhau | A thứ | 1 đến 8:2.5; 33 đến 48:2.5; 65–77 | 42/37; 117/76; 67/52 | Kết có 59/67 cú RH là cụm >=3 nốt, 20 cụm chứa quãng tám: đoạn dặm, không phải chạy đơn. Giang có 8 nhóm chạy. Vòng bVI–bVII–i là nguồn hòa âm nổi bật. |
| Anh cứ đi đi | F thứ, phân tích từ nốt/hòa âm | 33:1.5 đến 37:2.5; 62:.75 đến 68 | 32/32; 48/36 | Giang 6 cụm dặm/2 nhóm chạy; kết 3 cụm/4 nhóm chạy. Giữ phần giải quyết và loại đầu nốt hát ở 33/62. Không coi 1–8 là dạo. |

“Nhóm chạy ứng viên”: >=4 cú RH một/hai nốt liên tiếp, khoảng cách <=.5 phách.
Đây là phát hiện để kiểm tra, không khẳng định mọi nhóm là một câu chạy có chủ ý.
“Nửa cung” chỉ mô tả quãng: có thể hoàn toàn thuộc thang âm, không tự gắn nhãn chromatic.
“Ngoài lưới móc kép” không tự gắn nhãn chùm ba. Ký âm chỉ có một grace được đánh dấu
trong các cửa học này; không được suy rằng các bài còn lại không có luyến khi diễn thật.

## Hòa Âm và Giai Điệu

- Có Em Chờ: học đường IVmaj7–iii7, ii–V–I, I–vi–ii–V ở kết; giữ màu bảy/chín/treo
  tại đúng chức năng. Bass thực ở 7/55 là F rồi Bb, không theo thứ tự ii/V in lệch.
  Ô 66 kết E trước C#m; 67/69 F# trước B. Cả nhãn in và hiệu chỉnh đều được lưu.
- Ngày mai em đi/Hồng Kông 1 bổ sung cách giữ rồi trả lời, đổi quãng, đi qua vi/ii/IV,
  treo rồi giải quyết. Những hợp âm mượn/át phụ không được rút riêng khỏi đích giải quyết.
- Để Em Rời Xa/Chúng Ta bổ sung tuyến bVI–bVII–i; không hạ máy móc nốt thứ ba của
  một vòng trưởng để gọi là vòng thứ. ACDD bổ sung cách dẫn V–i và chạy ngắn xen dặm.
- Ký hiệu hòa âm là chứng cứ có điều kiện. Bộ chọn vòng đối chiếu bass đầu thay đổi,
  loại cell bất nhất; không xem mọi hợp âm in là nhãn huấn luyện đúng. ACDD vẫn có
  chỗ đáng ngờ giữa nhãn và bass, không tự sửa cả sheet khi chưa đủ chứng cứ.
- Đường giai điệu được học dưới dạng hướng đi/quãng và vai trò nốt trên hợp âm,
  rồi soạn lại liên tục qua cả câu. Trọng âm/nốt dài bám hợp âm đích; nốt lướt yếu
  phải giải quyết liền bậc. Không lấy một túi nốt chung rồi chọn độc lập từng tiếng.
- Nốt tiếp cận chromatic chỉ mở khi kho có chuẩn bị–nốt tiếp cận–giải quyết ở cùng
  giọng/chức năng/loại hợp âm. Bản này hỗ trợ nhánh tiếp cận dưới giải quyết lên nửa
  cung; chưa nhận bừa mọi enclosure/luyến trên từ ký âm. Nốt láy không được tự nhân
  dày để tạo cảm giác “nhiều kỹ thuật”.

## Những Thói Quen Có Thể Chuyển Thể

1. RH chạy trên bass ngân rồi đáp bằng cụm; bass không cần gõ theo mọi nốt RH.
2. Cụm dặm, quãng tám và đường đơn luân phiên theo loại đoạn, không giữ một mật độ
   cho cả bài. Chúng Ta kết và Ngày mai em đi giang là hai ví dụ đối lập rõ.
3. Ý câu được nhắc lại trên hòa âm khác; cần một câu phát biểu và một chỗ nhắc/phát
   triển, không nối toàn những đoạn chạy độc lập.
4. Cụm treo cần nốt giải quyết; câu dẫn cần đích thật. Cùng 4/4 chỉ là điều kiện
   cần, chưa bảo đảm đặt nguyên xi lên Có Em Chờ/ACDD sẽ đúng trọng âm hai tay.
5. Độ ngân từng bè, khoảng thở, nhấn cùng tay trái và trả lời sau bass đều là một
   phần của câu; không thay mọi trường độ bằng móc đơn đều nhau.

Đây là các thói quen lặp lại trong kho được đo, không kết luận chúng chỉ có ở CP.
Các sắc thái pedal, rubato, trọng lượng phím chưa thể học đầy đủ từ dữ liệu này.

## Bộ Soạn Đã Thay Đổi

- 124 cử chỉ hai ô đủ cửa học: 97 thuộc giọng đã xác định và 27 chỉ dùng thời gian;
  64 cử chỉ qua bộ lọc hòa âm. Các cửa chồng lấn là ứng viên, không phải 124 câu
  độc lập và không dùng số lượng ấy làm tần suất phong cách.
- Các vòng hai ô được nối bằng quan hệ chức năng quan sát được trong cell đã lọc.
  Có kiểm tra đường tiếp trước khi chọn để không đi vào ngõ cụt ở cuối câu dài.
- Mẫu của điệu đang chọn sở hữu thời điểm LH. Ánh xạ mốc bass nguồn sang mốc đích,
  điều chỉnh RH có giới hạn, giữ vạch ô. Loại khi đảo thứ tự, trùng cú gõ, lệch quá
  .5 phách, ép tốc độ quá mức, cắt tie hoặc làm mất bass của một cú dặm hai tay.
- Chùm ngoài lưới chỉ được giữ khi không bóp méo quan hệ thời gian. Mẫu khác nhịp,
  swing hoặc grid khác đơn vị nốt đen bị từ chối, không giả vờ hỗ trợ mọi điệu.
- LH có thể học thêm quãng tám/cụm và giữ tiếng tại chính điểm gõ có sẵn, không
  tạo một bass loop chung thay thế ACDD/Có Em Chờ. Hai tay được kiểm tra tầm riêng.
- Câu có bố cục, nhắc ý; xét liên tục hướng đi, tránh lặp máy/quãng nhảy vô cớ,
  giữ màu trưởng/thứ. Bè trong và bè trên có thể ngân khác nhau; nốt chung được
  giữ khi hợp âm đổi, nốt xung đột được nhả. Chùm dặm được soạn từ hợp âm thực.
- Dạo/giang kết bằng chức năng dẫn vào `opening` thật của phần hát kế; kết bài về
  chủ âm trưởng/thứ. Đuôi dẫn còn vang đến cửa phần sau, không chèn khoảng nghỉ
  cố định sau câu chạy. Nhánh cadence là phép soạn có quy tắc, không giả là bản chép CP.
- Có Em Chờ không còn bị khóa vào hai biến thể trưởng. Dùng chung bộ soạn cho các
  ballad được nhận diện và sheet mới khai `cpBalladChordLeads`; vẫn ưu tiên nhẹ
  nguồn cùng bài nếu đủ giọng và điều kiện, không buộc nó làm stencil cả đoạn.
- Full: dạo 8 ô, giang 12, kết 6. Gọn: dạo 4, giang 8, kết 4. Đây là lựa chọn bố
  cục KeyTrain, không phải số ô cố định của CP. Lượt `take` làm mới vòng/câu;
  cùng cấu hình và take cho cùng kết quả. Bấm tua không soạn lại lượt đang nghe.
- `compositionSources` ghi từng ô nguồn hòa âm/giai điệu/tiết tấu và điệu đích.
  Bộ đệm hát và vùng bảo vệ phách dẫn không bị thay; mô phỏng nguyên sheet và
  Bossa tiếp tục đi đường cũ. Không đổi nhận diện giọng hoặc Tone.

## Tái Tạo và Kiểm Tra

```powershell
python -X utf8 -B tools/cp_ballad_solos.py --write
python -X utf8 -B tools/cp_ballad_solos.py --check
npx vitest run src/reharm/style/__tests__/cpBalladComposition.test.ts src/reharm/style/__tests__/cpComposition.test.ts src/reharm/style/__tests__/cpBalladBacking.test.ts src/reharm/style/__tests__/acddConnections.test.ts src/reharm/style/__tests__/caPhaoBalladSongs.test.ts src/reharm/style/__tests__/caPhaoFullSolo.test.ts src/reharm/playback/__tests__/bossaRhythmOnly.test.ts
npm run build
```

Ma trận kiểm: 12 chủ âm x trưởng/thứ, dạo/giang/kết, 6 biến thể sheet CP, Pop và
sheet mới; full/gọn; nhiều lượt; BPM 60/75/90/120; tầm đàn; phân loại nguồn đúng
giọng; đích cadence; nốt lướt giải quyết; bảo toàn phách dẫn sau ráp bài; snapshot
Bossa không cập nhật. Kiểm thử không thay thế nghe duyệt trên bài thật.

Kết quả kiểm tra bản triển khai ngày 23/09/2026:

- Tái trích dữ liệu với `--check`: khớp nguồn; không sửa sheet gốc.
- 7 file kiểm thử liên quan: 67/67 đạt, gồm phách dẫn sau ráp bài và snapshot Bossa.
- `npm run build`: đạt; còn cảnh báo kích thước bundle lớn.
- ESLint các file chỉnh sửa được kiểm: không có lỗi, còn 7 cảnh báo React Hook
  sẵn có trong `ReharmHome.tsx`.
- Toàn dự án: 2.726/2.733 kiểm thử đạt, 7 lỗi trong 6 file. Đã chạy lại riêng
  6 file ấy trên worktree sạch tại commit trước `cb98282`: cùng 7 lỗi, cùng giá trị
  đo. Các file là `phraseAcrossBar`, `daoTruongLinhNhi`, `handSplitAudit`,
  `leftArpeggioAboveRoot`, `sietHopAm`, `tuyenSolo` (file cuối có 2 lỗi).
  Không sửa các bộ đo hoặc hành vi ngoài phạm vi để làm xanh toàn bộ suite.
- Kiểm tra giao diện Có Em Chờ/ACDD với màu Cà Pháo, full và Soạn câu mới:
  hiện nguồn câu mới và không báo lỗi JavaScript. Chưa có xác nhận nghe duyệt
  trên bài thật của người dùng; kết quả tự động không bảo đảm câu nhạc đã hay.

Chưa lấy cao độ/vòng Kém duyên và Yêu xa cho đến khi xác nhận giọng/hòa âm.
Chưa dùng mọi câu nối dài, kết đổi nhịp hoặc mọi màu mượn. Chủ động bỏ phần chưa
chuyển được là chủ đích, không âm thầm phát câu generic khi phép chuyển thất bại.
Khi nghe duyệt, ghi bài + giọng + điệu + loại đoạn + take, tách nhận xét tiết tấu,
hòa âm và giai điệu. Chỉ sau duyệt mới ghi quyết định đã chốt vào Sổ tay theo yêu cầu.
