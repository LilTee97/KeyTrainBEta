# Cà Pháo — học cách tổ chức solo, không thay nốt trên nguyên câu
Ngày 17/09/2026. Trạng thái: **phân tích nguồn + đặc tả sửa; chưa phải bản solo được duyệt**.

## 1. Điều chỉnh hướng làm theo yêu cầu mới

Người dùng không muốn lấy nguyên intro/giang/outro Người hãy quên em đi rồi thay nốt.
Cũng không muốn trộn ngẫu nhiên ô dặm, ô chạy và bass của nhiều bài làm mất Bossa.
Đơn vị phải học là **quan hệ có điều kiện**: vai trò trong câu → động tác hai tay →
hòa âm/chỗ giải → mật độ, nhấn, nghỉ. Chỉ khi hiểu các quan hệ đó mới soạn cả câu mới.

Bản thử `cpBossaForm` giữ nguyên thứ tự những cụm hai ô của sheet chỉ chứng minh
có thể bảo toàn nhịp nguồn; **không đạt yêu cầu tự soạn này**. Không coi test bảo toàn
onset của bản thử là bằng chứng đã học được tư duy. Không tiếp tục mở rộng hướng đó.
Các nhận xét “đã ổn” trước đây cũng không duyệt mọi thuật toán hoặc mọi biến thể.

## 2. Phép đo và giới hạn

- Đọc lại **9 file MusicXML**, cả những file chưa xác nhận giọng; không chỉ đọc nhãn kỹ thuật cũ.
- Lệnh tái lập: `python -B -X utf8 tools/cp_solo_habits.py`.
- Đếm màu nốt tách giọng đoạn/chất hợp âm: cùng lệnh thêm `--melody`.
- Dùng `scripts/audit_ca_phao.py` cho hai khuông/hai part; ghép nốt nối trước khi đếm.
  Một hợp âm nhiều nốt cùng tay/cùng thời điểm chỉ là **một mốc gõ**.
- Tổng thống kê dưới: **183 ô nội bộ**, RH 1222 mốc, LH 886 mốc.
  Bỏ ô đầu/cuối mỗi đoạn để hạn chế lẫn lời lấy đà; phần soi riêng Bossa dùng cả ranh
  đã biết nhưng tách nốt lời tại beat 30.5 ở intro/giang.
- Có **26 đoạn được khai báo**: 21 đoạn/7 bài đủ xác nhận giọng để dùng cho nốt;
  5 đoạn Kém duyên/Yêu xa chỉ dùng khảo sát nhịp/phối tay. Ranh hai bài này mới neo
  theo thời lượng, chưa dùng làm luật vị trí chắc chắn.
- Bossa chỉ có **1 bài**, không đủ để gọi mọi thủ pháp ở đó là luật phổ quát của Bossa.
  Ballad có 8 bài, trong đó 6 bài xác nhận giọng. Chưa có bằng chứng cho điệu khác.
- Cột giọng trong bảng là vùng đầu bài. Có Em Chờ outro sang E trưởng; Để Em Rời Xa
  sang Eb thứ; Bossa outro ô 100 đổi D trưởng. Khi học nốt phải xét giọng **tại đoạn**.
- Corpus khai Bossa outro 96–104 nhưng XML hiện chỉ có đến **101**: không bịa thêm 102–104.
- “Ngân/nghỉ” ở phép đo là trường độ **ký âm**, chưa đo pedal/âm thanh; staccato cần
  xử lý nhả riêng. “Tay trái gõ riêng” chỉ nói onset không trùng RH, không nói RH đã im.
- Nhãn `punch/run/line` trong script là chỉ báo mật độ để tìm chỗ soi, không phải
  tự động nhận dạng đầy đủ kỹ thuật. Một đoạn có nhiều nốt vẫn có thể là giai điệu hát.
- Không dùng các tỷ lệ lịch sử 828 nốt/4 bài như thể vừa đo lại cùng mẫu số.
  Sổ cũ còn mô tả Có Em Chờ kết C# thứ; xác nhận mới trong corpus là **E trưởng**.

## 3. Đối chiếu đủ 9 sheet

“Không LH phách đầu/còn ngân” = số ô không có attack LH ở offset 0 / trong số đó
bao nhiêu ô còn LH từ ô trước. Không gọi cả hai trường hợp là bỏ bass.

| Sheet | Điệu | Giọng đầu | Ô nội bộ | Attack RH/LH | LH gõ riêng | Không LH đầu/còn ngân |
|---|---|---|---:|---:|---:|---:|
| Hồng Kông 1 | Ballad | Trưởng | 36 | 234/145 | 56.6% | 7/5 |
| Người hãy quên em đi | Bossa | Thứ | 16 | 100/65 | 75.4% | 3/3 |
| Co Em Cho | Ballad | Trưởng | 17 | 153/89 | 64% | 0/0 |
| Ngay mai em di | Ballad | Trưởng | 21 | 123/115 | 73% | 0/0 |
| Kém duyên | Ballad | Chưa xác nhận | 16 | 77/76 | 39.5% | 0/0 |
| Yêu xa | Ballad | Chưa xác nhận | 20 | 135/77 | 45.5% | 5/0 |
| Để Em Rời Xa | Ballad | Thứ | 12 | 81/89 | 68.5% | 0/0 |
| Chưa Bao Giờ (Trung Quân) | Ballad | Thứ | 14 | 118/87 | 58.6% | 1/0 |
| Chúng Ta Không Thuộc Về Nhau | Ballad | Thứ | 31 | 201/143 | 57.3% | 0/0 |

Đây là mẫu số theo **ô ký âm**; không chia đều mọi ô thành 4 phách để so tốc độ:
ví dụ Hồng Kông 1 đoạn kết có ô 2/4. Thuật toán phải dùng độ dài ô thật.

### Học gì ở mỗi bài (vị trí trong XML)

1. **Hồng Kông 1:** dạo 1–15 đan câu thưa với chùm chạy, các ô 2/4 không gõ LH đầu
   nhưng vẫn có ngân; giang 47–65 có nhiều đoạn RH dày, cụm hợp âm ở 56/60 tạo điểm
   tương phản. Kết 100–107 đổi chiều dài ô, không bê nguyên lưới thời gian sang Bossa.
2. **Người hãy quên em đi:** intro 1–4 là giai điệu/chạy trên nền LH thưa nhưng ngân;
   ô 5 chuyển sang cụm hợp âm nhấn lệch, ô 6 giải ra tuyến đơn có chùm ba, ô 7–8 dẫn vào lời.
   Giang 41–46 thiên về đối đáp hợp âm; 47–48 phát triển chạy rồi hút về phần hát.
   Outro 96–99 dùng đối đáp/giật, 100 bàn giao LH→RH, 101 cùng chốt/ngân.
3. **Có Em Chờ:** intro 1–8 RH di chuyển nhiều, LH vẫn giữ điểm tựa; ô 53 nhắc lại ô 5
   là ví dụ người dùng đã xác nhận về **nhắc lại có chủ đích**, không phải cấm lặp tuyệt đối.
   Giang 52/55 có cụm hợp âm tương phản với chạy; kết ô 71 nhường RH một vùng dài.
4. **Ngày mai em đi:** intro dài 1–18, đoạn dặm ở 9/15 nằm giữa các tuyến giai điệu,
   không cứ mỗi hai ô lại nhét một thủ pháp giống nhau. LH nội bộ giữ đầu ô 21/21,
   nhưng nhiều attack khác không trùng RH. Giang 51–54 là đoạn nối ngắn, không áp
   độ dài của nó cho tất cả giang tấu.
5. **Kém duyên:** giang 27–33 có các đoạn hợp âm liên tiếp, xen thay đổi ở 30;
   đoạn kết 70–79 thưa hơn về cách đánh cụm RH. Có mô-típ lặp để duy trì câu.
   Do chưa chốt giọng/ranh bằng mắt, chỉ ghi nhịp/phối tay, không dạy màu trưởng/thứ.
6. **Yêu xa:** tay phải có nhiều thời gian thực sự chơi khi LH không còn ngân
   (38.5 phách trong các ô nội bộ được đo); khác hẳn Bossa 4.25 phách.
   Nhiều vùng nhường tay ở intro 2–8, giang 42–49. Không lấy đặc điểm này áp như
   định mức bỏ bass cho mọi điệu. Giọng và ranh đoạn vẫn cần xác nhận.
7. **Để Em Rời Xa:** intro 0–3 và giang 28–31 dày động tác RH, bass không biến mất;
   kết 69/70/72 chuyển sang cụm hợp âm, ô 70/71 có RH nghỉ để LH giữ vai trò.
   Không rút thành “kết luôn phải chạy ít nốt”; có đoạn kết dài 39 phách và đổi giọng.
8. **Chưa Bao Giờ:** intro ô 1 có RH tự nói trong khoảng LH nghỉ; giang thiên về tuyến
   chạy, cụm ô 42 có vai trò tương phản/đến đích; kết 79–80 rất ngắn và nhường RH.
   Không ép độ dài kết bằng các bài khác, không lấy lời cuối 43 làm nốt solo.
9. **Chúng Ta Không Thuộc Về Nhau:** giang 37–39 có chuỗi cụm hợp âm, 40–45 chuyển
   sang chạy, rồi các điểm hợp âm lại xuất hiện. Outro 65–76 chủ đích lặp cụm/nốt.
   Do vậy **cấm mọi nốt lặp/đảo ABAB là sai**: chỉ chống việc lặp máy móc ngoài
   bối cảnh. Bass Eb2 cuối ô 77 là dụng ý đã được người dùng xác nhận.

## 4. Thói quen kỹ thuật: điều đo được và cách dùng có điều kiện

Các dấu hiệu chord-gesture, quãng gãy, nối bán cung, lệch phách và đổi hướng đều
xuất hiện trong cả 9 bài ở mức ô nội bộ. Điều này cho phép gọi chúng là **vốn thường gặp
trong kho Cà Pháo**, chưa chứng minh đó là kỹ thuật độc quyền của anh.

| Dấu hiệu | Bằng chứng cụ thể | Điều kiện biên soạn suy ra, không phải lời nhạc sĩ |
|---|---|---|
| Cặp nốt/cụm hợp âm xen tuyến đơn | Bossa 5 → 6; Hồng Kông 1 giang 56/60; CTKTVN 37–45 | Tạo điểm nhấn/đáp/đích đến; lên kế hoạch cả vùng dặm và vùng xả, không rải dặm theo xác suất mỗi nốt |
| Bass và RH không luôn gõ cùng nhau | LH gõ riêng 39.5–75.4% theo bài | Soạn quan hệ gõ trước/đáp sau/ngân đỡ; không tạo RH xong mới ghép loop LH |
| Bass vào sớm/ngân qua ô | Bossa intro 3.5→4.5 và 27.5→28.5, outro 11.5→14 | Nốt dẫn + ngân + điểm đến là một đơn vị; chỉ tách ở nơi động tác đã giải |
| Nhường tay nhưng giữ nền | Bossa intro LH 0/1.5 rồi giữ; outro 100 LH chạy nửa đầu, RH chạy nửa sau | Phân biệt giữ bass với bass nghỉ; đoạn chạy không mặc định cần LH im |
| Giật và nhả ngắn | Bossa outro 97, bII9→V7b13 | Cần cả vị trí bass, vị trí RH, độ nhả và đổi hợp âm; tăng lực hoặc thêm một nốt không đủ tạo “giật” |
| Chùm ba xen lưới đều | Bossa intro 6/7, giang 46; Ballad có các chùm và đổi ô | Chỉ đặt khi đủ nhóm và tới điểm đáp; không cắt/chia nhóm theo ranh hợp âm giả |
| Đường chạy đổi hướng/quãng gãy | Bossa intro 2–4,7; Ballad nhiều bài | Học quãng tương đối + nốt đích + chức năng hợp âm, không chỉ lên/xuống gam |
| Nhắc lại | Có Em Chờ ô 5↔53; CTKTVN outro | Lặp có vai trò nhắc câu/ostinato; phân biệt với tái dùng cùng cú “trình diễn” nhiều lần |

Tần suất phải tính **theo bài, điệu, loại solo và đoạn chức năng**. Không dùng số
nốt của một câu chạy dài để làm nó lấn át toàn bộ kho kỹ thuật.

## 5. Tiết tấu: đánh đủ, ngân và nghỉ không phải một việc

- Bossa nội bộ có 3 ô không gõ LH đầu: **3/3 có ngân từ ô trước**.
  Nếu bộ soạn cắt gate ở vạch nhịp rồi không gõ lại, nó tạo lỗ không có trong nguồn.
- Giang Bossa có các khoảng RH nhả để bass/bè trong trả lời; đơn vị là cuộc đối đáp.
  Không đo riêng mật độ RH rồi kết luận giang ít kỹ thuật hơn intro.
- Ballad không có một mẫu “đủ” chung: Có Em Chờ, Ngày mai em đi, Để Em Rời Xa,
  CTKTVN giữ attack LH đầu trong toàn bộ ô nội bộ đã đo; Hồng Kông 1 và Yêu xa không vậy.
- Hai tay thường **không cùng nghỉ**. Một tay giữ/nghỉ không làm mất dòng thời gian.
  Tuy nhiên nghỉ thật vẫn có trong sheet: không chữa bằng kéo dài tất cả nốt hoặc
  luôn thêm bass đầu ô.
- Mọi câu mới phải giữ nhịp chung và điểm đích ổn định. Thay tiết tấu là thay cách
  phân bố trong câu, không dịch ngẫu nhiên onset, đổi BPM, hoặc nén nốt cho vừa ô.

## 6. Giai điệu: học cả đường đi lẫn điểm tới

Phân tích nốt dùng nguồn 7 bài/21 đoạn đã xác nhận, loại phần đổi trưởng song song
khi học thứ và loại pickup lời Bossa. Chất hợp âm và giọng đoạn phải là hai trục khác nhau:
bài thứ vẫn có hợp âm trưởng/át; bài trưởng vẫn có hợp âm thứ.

Đối chiếu thô nốt cao nhất từng attack trên **hợp âm thứ trong đoạn thứ**:
b3=83, b7=74, 11=49, 5=48, 9=44, 1=33.
Trên **hợp âm trưởng trong đoạn trưởng**:
5=73, 3=71, 9=60, 1=53, 7=49, 13=43.
Đây là số đếm chứ **không phải xác suất gieo nốt độc lập**, không phải tổng số
notehead. Chất hợp âm lấy từ nhãn đã chuẩn hóa trong `caPhaoFullSolos.json`,
chưa kiểm lại từng voicing của toàn kho để giải quyết hết nhãn hòa âm mơ hồ.
Chưa dùng làm định mức runtime vì còn ranh lời Ballad cần lọc tinh hơn.

Hướng học đúng:

1. Học nốt theo **hợp âm đang vang**, vai trò nhịp và độ dài ngân; không chỉ nằm trong gam.
2. Học chuỗi quãng có cửa vào/đỉnh/đổi hướng/đích giải. Một đoạn chạy có thể đổi hướng
   giữa chừng, đổi quãng âm hoặc rải cụm hợp âm rồi nối liền bậc.
3. Nốt bán cung phải gắn với đích/bối cảnh đã quan sát, không tự gắn “chromatic”
   vào mỗi nốt thứ bảy của câu.
4. Giữ quan hệ mô-típ khi đổi hòa âm; không giải bài toán mới độc lập tại mỗi hợp âm.
5. Nốt ngân qua đổi hợp âm phải được chọn cho tương thích cả hai phía, hoặc giải theo
   thủ pháp có nguồn; cắt ngân hàng loạt để né phô làm câu đứt.
6. Kiểm tra mô-típ lặp theo vai trò, không dùng luật “cấm ba nốt giống nhau” toàn cục:
   CTKTVN có 58/170 bước liên tiếp bằng 0 ở mẫu nội bộ, còn Hồng Kông 1 là 5/198.

## 7. Trả lời cụ thể bình luận #1143

Bình luận đầy đủ, vòng và toàn bộ 111 nốt được lưu trong
`D:/PianoBrain/knowledge/teachers/ca-phao.md`, mục #1143 ngày 17/9 15:07.
Sổ có 9 ký hiệu hợp âm/8 ô nhưng không lưu `beatsEach`: không tự gọi mỗi ký hiệu
là một ô. “Am11 → Dm9” có thể chỉ một **vùng**, vì trong danh sách còn Dm7 và Am7
ở giữa. So cả hai vùng nguồn thay vì tự chốt ý người dùng chỉ vào một cặp liền kề.

### Chuỗi RH ở vùng Dm11 của câu KT

Ở nguồn intro ô 4 (Gm11 trong sheet Dm; khi về Am là Dm11), RH:
offset `.5, .625, .75, .875, 1, 2, 2.5, 3, 3.5`.
Bốn attack nhanh đầu **đi xuống**, sau đó tuyến đi lên và đáp bằng cụm hợp âm
anticipation cuối ô. LH neo `0, 1.5` và ngân. Chỉ học bốn nốt đầu rồi nối một
đường đi lên bất kỳ sẽ mất chức năng **lướt → phát triển → đích đáp**.

### Bass và giai điệu ở vùng Am11 → Dm9 → E7

- Ô nguồn 5: LH `0/1.5/2`, gate `1.5/.5/2`; RH nhấn lệch, có nhả.
  Đây là nền đỡ một cụm hợp âm, không phải bass chạy độc lập.
- Ô 6: LH `0/1.5/3`, RH có hai đoạn chùm ba, chuyển sang tuyến đơn.
  Sự kế tiếp tạo tương phản “cụm nhấn → xả thành đường nét”; cách diễn giải chức năng
  này là **suy luận có căn cứ**, không thể khẳng định tâm ý nhạc sĩ.
- Ô 7–8: LH cuối ô 7 ở `3.5` ngân qua `.5` ô 8; RH cũng giữ cụm qua vạch,
  rồi bass/bè trong dẫn vào át. Tách tại vạch ô mà cắt nốt là sai.
- Nốt lời bắt đầu beat 30.5: khi soạn lead-in phải thay bằng nốt mới dẫn về đoạn
  kế, không đem giai điệu lời nguồn làm một “kỹ thuật solo”.

**Có nên tách chùm không?** Không tách giữa nối ngân, nhóm chia nhỏ chưa đủ,
bass dẫn chưa giải hoặc cặp hỏi–đáp còn dang dở. Có thể lấy riêng thủ pháp khi đã
kèm cửa vào/ra và phần hòa âm cần thiết. Không bắt buộc giữ cả intro hay thứ tự
toàn bộ các cụm của intro nguồn.

### Cú giật bII9 → V7b13

Nguồn outro ô 97, tương đối trong ô:
LH `0,1.5,2,3.5` với gate `1.5,.5,1.5,.5`;
RH `.5,1.25,2,3` với gate sau staccato `.25,.125,1,1`.
Hợp âm đổi giữa ô, bass phát trước/đỡ cú nhả RH rồi hai tay cùng chốt điểm đổi.
Kỹ thuật là quan hệ cả **hai tay + hòa âm + nhả**, không chỉ bốn nhịp RH.

## 8. Đặc tả cho vòng sửa bộ soạn kế tiếp

Đây là **yêu cầu triển khai**, chưa đánh dấu đã làm:

1. Lập câu mới theo chức năng mở–phát triển–tương phản–dẫn/kết, không dùng chuỗi
   `[0,8,16,24]` của source như toàn bộ bản thiết kế.
2. Chọn số lần/khu vực kỹ thuật từ bằng chứng theo điệu và loại solo; có chủ đích
   làm nổi một thủ pháp, những thủ pháp còn lại đỡ nó. Giang được dặm theo vùng,
   không ép mỗi ô phải có run hoặc dặm.
3. Mỗi động tác lưu điều kiện vào/ra: vị trí trong nhịp, bass/nốt còn ngân,
   đích hòa âm, tay đang dẫn và phần nhóm nốt chưa hoàn tất.
4. Chỉ nối hai động tác khi điều kiện giao nhau tương thích. Không chắp ô rồi
   chữa lỗ bằng thêm bass, kéo gate hay đổi tốc độ.
5. Soạn vòng mới và tuyến RH dài hơi theo kế hoạch đó; chọn bass/bè trong đồng thời,
   không lấy một loop hát làm LH của solo.
6. Nguồn Ballad sang Bossa chỉ đem quãng, màu, đường chạy phù hợp; thời gian/phối tay
   phải được soạn lại theo từ vựng Bossa, không giữ lưới Ballad.
7. Mô phỏng nguyên sheet là chế độ riêng, giữ nguyên; bản soạn mới không được
   trùng toàn bộ chuỗi onset hai tay/hòa âm của một solo nguồn qua mọi take.
8. Chỉ Phát trọn bài mới đổi câu; tua giữ nguyên. Bảo toàn tầm đàn, giọng đoạn,
   khung hát 11 tiếng và CP Lick/Run đã được duyệt.
9. Kiểm thử phải phát hiện: cả hai tay nghỉ ngoài chủ đích tại mối nối, mất đuôi
   bass, nhóm chia nhỏ bị cắt, cao độ không giải, lặp kỹ thuật ngoài vai trò,
   và “câu mới” thực ra chỉ là một stencil toàn bài.
10. Nghe từng vòng sửa. Đếm đúng nốt/qua test không thay được duyệt bằng tai.

Không có cơ sở để tuyên bố đã “suy nghĩ như Cà Pháo” sau một lần thống kê.
Mục tiêu thực tế là bộ soạn có luật kiểm chứng được, truy được nguồn và được
người dùng nghe duyệt. Bản đo này sửa cách hiểu trước khi sửa tiếp âm nhạc.

## 9. Vòng triển khai sau phân tích — giữ bản người dùng nhận xét đang hay

Mục 8 là đặc tả tại thời điểm phân tích, không phải tuyên bố mọi mục đã hoàn tất.
Vòng triển khai hiện tại nằm trong `src/reharm/style/cpComposition.ts`, kiểm thử
trong `src/reharm/style/__tests__/cpComposition.test.ts`:

- `planBossa` dựng mở–phát triển–tương phản–dẫn/kết bằng các động tác hai ô.
  Giữ quan hệ LH/RH, nối ngân và nhóm chia nhỏ bên trong động tác; không giữ
  nguyên thứ tự cả intro/giang/outro của *Người hãy quên em đi*. Intro thiên
  tuyến nốt và có vùng tương phản hợp âm; giang có vùng dặm rồi tương phản tuyến.
- Soạn lại vòng theo các chuyển chức năng đã gặp trong nguồn cùng màu giọng.
  Mô-típ chính lấy quãng từ sheet khác cùng trưởng/thứ; đường chạy được đặt vào
  cửa chạy của Bossa, không mang lưới tiết tấu Ballad sang. Ghi nguồn vào
  `compositionSources` để truy lại động tác, mô-típ và contour.
- Nếu chọn cú giật bII9 → V, dành đúng vùng hòa âm cho nó theo đích cục bộ;
  không áp cú giật cho mọi câu. Chọn nốt chung khi ngân qua đổi hợp âm để tránh
  cắt cả hai tay ở vạch ô. Bộ tìm tuyến nốt xét khả năng nối sang nốt sau trong
  tầm đàn, thay vì đến cuối mới ép một bước nhảy lớn.
- Intro/giang: tám phách cuối chuẩn bị ii hoặc IV/iv → V của **hợp âm đầu đoạn
  kế**, thời điểm vào V có biến thể. Nốt cuối dẫn gần nốt của hợp âm đích, không
  chép các nốt lời nguồn. Outro là chức năng kết riêng, không dùng luật dẫn vào hát.
- Full: intro/giang 32 phách, outro 24; rút gọn: intro/outro 16, giang 24.
  Tách mô phỏng nguyên sheet khỏi soạn mới. Không sửa khung hát 11 tiếng, CP Lick,
  CP Run, hoặc cơ chế chỉ Phát trọn bài mới soạn lại; click hợp âm/tua giữ take.

Giới hạn: đây vẫn là bộ soạn dựa trên từ vựng động tác Bossa hữu hạn từ một sheet,
không phải mô hình đã học được toàn bộ tư duy nhạc sĩ. Hai sheet chưa chắc giọng
không được dùng làm nguồn cao độ; chín sheet được phân tích không đồng nghĩa
chín sheet đều đủ tin cậy để soạn nốt. Test nối câu/giọng/tầm đàn và đa dạng
không thay thế nghe duyệt từng câu.

Người dùng vừa nhận xét **“Câu solo của Bossa CP cải tiến đang hay”** và yêu cầu
tiếp tục việc còn dở. Vì vậy giữ nguyên thuật toán âm nhạc hiện tại, chỉ hoàn tất
kiểm thử/hồ sơ; không tự train tiếp. Chưa có ID take đi kèm nên không diễn giải
thành duyệt mọi câu sinh ra hoặc ghi duyệt hàng loạt trong kho câu.

Kiểm chứng sau khi giữ mốc: 72/72 test qua trong 10 file liên quan (composition,
solo/full, Bossa restored/sheet/sections/recovery, rhythm-only, CP Lick, render
cost). `npm run build` qua; còn cảnh báo bundle lớn hơn 500 kB, không phải lỗi
âm nhạc. Đây là tập kiểm thử liên quan, không phải tuyên bố toàn bộ test dự án
đều qua. Không đổi bài đang mở hay phát thêm take trong bước hoàn tất này.

### Đính chính mốc nghe duyệt / khôi phục theo ảnh

Người dùng sau đó làm rõ mốc nghe hay là cuối lượt sửa hai file `+145/-89`
trong ảnh, không phải những lần nghe về sau. Nhật ký lượt 16:00 ngày 17/9
(`01a0ae98-8380-7df0-9831-466913d92a43`) chứa các patch âm nhạc cuối lúc
16:33:49 và patch test cuối lúc 16:34:41, giờ địa phương UTC+7.
Các lượt sau chỉ kiểm thử, sửa tài liệu và sửa một dòng comment ở dòng 64
`cpComposition.ts`; không có patch thay đổi thuật toán sau mốc ảnh trong
lịch sử đã đối chiếu. Đã trả comment về phiên bản mốc ảnh, giữ file test.

Sao lưu trước thao tác: `D:/KeyTrain-backups/bossa-restore-20260917-233651`.
Không tuyên bố đã khôi phục được chính câu nhạc từng nghe: chưa biết ID/seed,
và mỗi Phát trọn bài có thể tạo take khác. Cần phân biệt phiên bản bộ soạn với
câu đã sinh ra. Không tự lùi cả lượt sửa trong ảnh hoặc sang commit cũ hơn.

## 10. Học lại hòa âm–giai điệu thứ theo ngữ cảnh — 18/9/2026

Yêu cầu mới: tiết tấu/kỹ thuật giữ lại; kết quả nắn nốt theo màu trưởng/thứ
nghe không giống Cà Pháo. Phân tích này thay cách coi cả giọng như một túi nốt,
không có nghĩa bỏ tonic hoặc đưa nốt trưởng tùy tiện vào thứ.

### Dữ liệu có thể đo lại

`python -B -X utf8 tools/cp_solo_habits.py --minor-context` đọc lại XML qua
`cp_full_solos.analyze()`, xuất từng hợp âm cùng top melody theo bậc tonic,
bậc hợp âm, độ ngân và nốt từ trước còn ngân qua. Không ghi vào PianoBrain.
`python -B -X utf8 tools/cp_full_solos.py --check` đối chiếu bundle với nguồn.
Có 12 đoạn/4 bài thứ xác nhận; không suy giọng cho Kém duyên/Yêu xa.
Các số beat dưới tính từ 0 trong mỗi đoạn, không phải số ô nhịp.

### Người hãy quên em đi: hợp âm và nốt không thể tách riêng

Sheet ở Dm; viết theo bậc để chuyển sang bài khác, không chép Dm tuyệt đối.

| Nguồn | Hòa âm và nốt đo được | Điều có thể học |
|---|---|---|
| Intro ô 1–4 | i9/iv11/i11/iv11; mở i9: 9–1–b7–5–b3 | Nốt 9 là phần của ý giai điệu, không chỉ nốt trang trí ngẫu nhiên |
| Intro beat 3.5→5 | b3 của i ngân sang b7 của iv | Đổi hợp âm không đồng nghĩa phải nhả nốt |
| Intro beat 15.5→17 | 13 của iv ngân thành 9 của i | Cùng một nốt có hai chức năng khi hòa âm đổi |
| Giang ô 42 | bII9 có #11, chuyển sang V7 có b7 | Màu căng cần xét hợp âm và hướng đi, không lọc bằng gam thuần |
| Giang ô 44 | iiø có b9 ngắn rồi đi V7 | Không khái quát b9 thành nốt ngân tự do trên mọi hợp âm thứ |
| Giang ô 47 | 11–#11–5; 9–7–1 theo bậc i | Chromatic và leading tone nằm trong đường dẫn, không phải đổi cả giọng |
| Outro ô 97 | 9 của bII thành b13 của V7 trên cùng cao độ | Cú giật là quan hệ hòa âm + phối tay; không chỉ đổi tên hai hợp âm |
| Intro/giang cuối | iv/iiø rồi V11, có bậc 3 của V | Hút về hợp âm đoạn sau, không chép nốt lời bắt đầu từ beat 30.5 |

Outro ở Am sẽ có Bb9→E7b13→Am; sheet Dm tương ứng Eb9→A7b13→Dm.
Tên enharmonic Bb/A# không thay chức năng. Nhãn XML ô 42 từng mâu thuẫn với
nốt hai tay; dùng bản đối chiếu đã có trong bộ trích, không tự học F#aug/Eb
như một luật phổ quát. Outro từ ô 100 chuyển trưởng, phải tách khỏi học thứ.

### Các sheet thứ khác: học tương quan, không bê tiết tấu

- **Để Em Rời Xa:** các cụm bVI–bVII–i7, có quay về bVI trước khi đáp i.
  Học chỗ tựa và hướng đáp theo cụm, không hoán vị mọi hợp âm thành vòng mới.
- **Chưa Bao Giờ:** có IIImaj7, bVImaj7, v7, iv7; giang có i(mMaj7).
  Bậc 7 nâng xuất hiện có ngữ cảnh hòa âm; không cấm hết hoặc phát tự do trên i7.
- **Chúng Ta Không Thuộc Về Nhau:** bVI–bVII(sus)–i7 theo đoạn lặp/phát triển,
  có v7 và các hợp âm chuyển. Những nhãn aug/I7 bất thường cần đối chiếu riêng
  trước khi đưa thành luật; không lấy tất cả nhãn XML làm xác nhận âm nhạc.

Suy luận biên soạn: chức năng hợp âm và vị trí giải quan trọng hơn tỷ lệ xuất hiện
của một pitch class trong toàn bộ các bài thứ. Đây không phải bằng chứng đã biết
ý định chủ quan của nhạc sĩ. Dữ liệu Bossa chỉ một bài nên không tuyên bố luật
phổ quát cho cả thể loại.

### Thay đổi áp dụng và ranh giới

Đã bỏ lớp hậu xử lý `refineBossaPitches`. Chọn màu/đường nối trong bộ tìm giai điệu
hiện có theo root tương đối + chất hợp âm, ưu tiên ngữ cảnh Bossa; Ballad chỉ
bổ sung nơi thiếu nguồn. Giữ màu i9/i11, iv9/iv11 trong thân, sửa đích bII→V
khi hợp âm chuẩn bị phần hát được thay từ ii sang iv. Không thay planner, nhịp,
tốc độ hoặc lưới hai tay. Không sửa mô phỏng nguyên sheet, Lick/Run, phần đệm hát.
Chưa thay toàn bộ đồ thị chuyển hợp âm bằng các chuỗi Ballad hoặc mở mọi tension.

Snapshot nhịp được lấy từ engine mốc duyệt trước khi chỉnh, không từ kết quả mới.
Test nguồn kiểm riêng i9, iv13, iiø b9, bII #11, V b13; test phát kiểm 12 tonic,
trưởng/thứ, full/rút gọn, tầm đàn, cú giật và dẫn về đoạn sau. Test là kiểm kỹ thuật,
không chấm “hay”. Chờ người dùng nghe một vòng trước khi train tiếp.

Kiểm chứng lượt này: **76/76 test trong 10 file liên quan**, build production,
ESLint hai file TypeScript đã sửa và đối chiếu bundle/XML đều qua. Build còn
cảnh báo kích thước bundle >500 kB; không phải lỗi phát nhạc. Không tuyên bố
toàn suite dự án đã qua, không tự phát/duyệt take hoặc ghi SO-TAY khi chưa được yêu cầu.
