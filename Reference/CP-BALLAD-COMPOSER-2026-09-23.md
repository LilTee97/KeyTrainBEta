# Bộ soạn solo Ballad Cà Pháo, 23/09/2026

Trạng thái: bản triển khai để nghe duyệt, chưa phải xác nhận chất lượng nghệ thuật.
Yêu cầu mới thay giới hạn chỉ biến thể Có Em Chờ của bản 22/09. Không thay Bossa CP đã duyệt.

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
