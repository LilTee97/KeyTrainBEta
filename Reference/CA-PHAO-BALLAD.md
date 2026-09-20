# Ballad CP: tiết tấu từ sheet và bản tổng hợp

> **Đã thay hướng làm ngày 20/9/2026 theo phản hồi người dùng.** Nội dung dưới
> đây lưu lịch sử lần dựng đầu, không còn là đặc tả triển khai mới. Không khôi
> phục các nút người dùng đã ẩn, không tạo thêm nút tổng hợp "nét CP".
> Phân tích hiện hành: [Có Em Chờ và Ngày mai em đi](CA-PHAO-BALLAD-SONGS.md).
> Chỉ thêm hai họ nút theo bài, mỗi họ có phiên/điệp; đối chiếu chung chỉ là báo cáo.

Ngày phân tích: 19/9/2026; hoàn tất kiểm tra 20/9/2026. Trạng thái: **đã đo ký âm, đã biên soạn để thử;
chưa được người dùng nghe duyệt**. Mốc duyệt solo CP ngày 19/9 không áp dụng
cho các điệu đệm mới này.

## Phạm vi và cách đo

Đọc 8 sheet `teacher=ca-phao`, `genre=ballad` trong
`D:/PianoBrain/tools/sheet/corpus.json`. Nhãn thể loại và ranh giới đoạn lấy từ
corpus đã đối chiếu, không suy từ tên bài. Không lấy Người hãy quên em đi
(bossa); không lấy nhóm cố ý để sau hoặc đã bỏ như Bèo dạt mây trôi, Mơ.

- 6 sheet có đoạn hát được đánh dấu: **331 ô đủ 4 phách**. Các đoạn hát vẫn
  có thể chứa fill; vì vậy thống kê cả đoạn không tự chứng minh một groove.
- Kém duyên, Yêu xa: thêm **145 ô ngoài các đoạn solo đã đánh dấu**, chỉ dùng
  đối chiếu phụ. Chưa đủ mốc phiên/điệp để đưa vào thống kê chính.
- Bỏ 4 ô khác độ dài: Để Em Rời Xa 10, 11, 23; Chưa Bao Giờ 17. Không ép
  các ô 2/4, 3/4 hoặc 6 phách thành một ô 4/4.
- Theo `backup`, `forward`, `chord`, `staff`/part và `voice`; gom các nốt cùng
  tay, cùng onset thành một lần đánh. Loại grace và tie-stop khỏi số lần đánh.
  Kém duyên là hai part riêng. Hồng Kông 1 dùng file `-da-don.musicxml`.
- Trường độ là ký âm, chưa bao gồm pedal/nhả phím trong bản thu. BPM 76,
  lực đánh và quãng đặt bàn tay trong app là lựa chọn biên soạn.

Lệnh tái tạo, chạy từ `D:/KeyTrain`:

```powershell
python -B scripts/audit_cp_ballad.py --output Reference/CA-PHAO-BALLAD-EVIDENCE.json
python -B scripts/audit_ca_phao.py "D:/PianoBrain/video/Ca_Phao/Ngay mai em di-Ca Phao.mxl" 21 29 35 43
```

[Dữ liệu đo](CA-PHAO-BALLAD-EVIDENCE.json) lưu đường dẫn thật, SHA256, số ô,
onset, số lần lặp, phạm vi phiên/điệp và bản ghi hai tay của các ô đại diện.
Script có self-check parser và kiểm 5 lưới đại diện trực tiếp trên nguồn.

## Năm nút tiết tấu

Quy ước bảng: offset 0 = phách 1; 0.5 = 1&, 1.75 = 2a, 2.25 = 3e.
Các nút là **rút gọn đệm hát**, giữ lưới LH của ô đại diện, không phải chép
nguyên hai tay của bản độc tấu. “Lặp” dưới đây nghĩa là lặp onset LH, không
khẳng định nốt, voicing và trường độ mọi ô giống nhau.

| Nút | Onset LH trong 4 phách | Nguồn và đối chiếu | Cử chỉ giữ lại |
|---|---|---|---|
| Ballad CP · Rải ngắn | 0, 0.5, 1 | Ngày mai em đi 21, 29, 65 | 1–5–8; nốt cuối giữ 3 phách |
| Ballad CP · Nhấn lệch | 0, 1, 1.5, 2.5, 3 | Ngày mai em đi 35, 36, 43, 71; Hồng Kông 1: 14 ô hát | Bass thấp xen cụm cao; nốt ở 2.5 ngắn rồi nghỉ 0.25 phách |
| Ballad CP · Thưa đảo phách | 0, 1.5, 2.5 | Chúng ta không thuộc về nhau: 15, 27, 31, 54, 59, 60, 63 | Ba lần đánh dài 1.5–1–1.5; lấy đường bass ô 27 |
| Ballad CP · Móc kép | 0, 1, 1.75, 2.25, 2.5, 2.75, 3 | Có Em Chờ 10, 18 | Trường độ ô 10; ba móc kép nối bass về quãng tám |
| Ballad CP · Ngân rồi rải | 0, 0.5, 2, 2.5, 3 | Chưa Bao Giờ 69; cùng lưới 68, 74 | Nửa đầu giữ cao, nửa sau bass thấp rồi rải 1–5–7 |

Hồng Kông 1, lưới nhấn lệch: 25, 34, 36, 38, 39, 42, 75, 82, 83, 84, 85,
87, 90, 93. Kém duyên cũng có 9 ô cùng lưới trong phạm vi đối chiếu phụ.
Yêu xa bổ sung 9 ô có lưới rải ngắn. Đây là bằng chứng lặp giữa nhiều bài,
không phải lấy trung bình histogram rồi tạo một ô không có thật.

Để Em Rời Xa đa dạng hơn: lưới 0, 1, 3.25, 3.5, 3.75 lặp ở 5, 33, nhưng
đuôi là đường dẫn theo hòa âm; chưa biến riêng nó thành một nút groove thường
trực. Ô 68 Chưa Bao Giờ mở bằng fill; chỉ dùng xác nhận onset, chọn **69** làm
đại diện. Ô 74 đổi hòa âm và bass sớm, không dùng nốt của ô đó làm luật chung.

## Rút gọn hai tay

Không có bè giọng hát tách riêng đủ cho mọi sheet. Cụm RH có thể vừa mang lời
vừa mang bè trong, nên việc bỏ lớp cao nhất là một **phán đoán biên soạn**,
không phải bộ phân loại giai điệu đã được chứng minh.

| Mẫu | RH giữ lại theo ô đại diện | Điều chỉnh để dùng trên bài khác |
|---|---|---|
| Rải ngắn, ô 21 | Eb4 ở 1.5, G4 ở 2 | Bậc 3 và 5 của hợp âm; bỏ F5 lặp và câu Eb5–D5–Eb5 |
| Nhấn lệch, ô 35 | Bb4 ở 1, G4 ở 1.5, Bb4 ở 2, Eb5 ở 2.5 | Bậc 5–3–5–1; bỏ melody/ornament cao. Cụm LH Bb3/Eb4 hạ thành 5+8 trên bass để vừa tay |
| Thưa đảo phách, ô 27 | E4 ở 0, G4 ở .75, C4 ở 1, E4 ở 1.5, C4/G4 ở 3 | Bậc 5–7–3–5 và 3+7; bỏ lớp melody cao |
| Móc kép, ô 10 | F4/Bb4 ở 0, F4 ở .5/.75, D4 ở 1.25, F4 ở 1.75 | Bậc 7+3, 7, 7, 5, 7; bỏ câu Bb4–C5–D5 cuối ô |
| Ngân rồi rải, ô 69 | Bb4/Eb5 ở 2, G4 ở 2.75, Eb4 ở 3.25 | Bậc 7+3, 5, 3; G4 nối sang 3 nên ngân .5, **không đánh lại ở 3** |

LH năm mẫu giữ onset và trường độ của ô đại diện nêu trên. Nốt chuyển theo
bậc hợp âm, không giữ cao độ tuyệt đối; dùng cơ chế degree/voicing hiện có.
Trên hợp âm không có bậc 7, cơ chế sẵn có lùi về bậc 5. Không tự thêm hợp âm
7/9 vào tiến trình, không ép chromatic approach của một ô lên mọi hợp âm.
Khi đổi hợp âm trong ô, engine cắt ngân và bổ sung tiếng cho hợp âm bị lưới
bỏ sót theo quy tắc đang có; lúc đó số onset đầu ra có thể khác mẫu một hợp âm.

## Đặc điểm chung và Ballad nét CP

| Sheet có đoạn hát | Ô 4 phách | Lần đánh LH | Ô có LH ở phách 1 | Lần đánh LH từ 2 nốt |
|---|---:|---:|---:|---:|
| Hồng Kông 1 | 65 | 315 | 56 | 33 |
| Có Em Chờ | 49 | 326 | 49 | 82 |
| Ngày mai em đi | 64 | 314 | 64 | 60 |
| Để Em Rời Xa | 53 | 369 | 51 | 60 |
| Chưa Bao Giờ | 60 | 414 | 60 | 32 |
| Chúng ta không thuộc về nhau | 40 | 161 | 40 | 20 |

Những điều dữ liệu ủng hộ:

1. **Neo đầu ô nhưng không bắt buộc gõ liên tục**: 320/331 ô có LH tại phách 1.
   Các mẫu rải ba nốt rồi ngân và bass ba lần đánh là ví dụ cụ thể.
2. **Lệch phách trên nền 4/4 thẳng**: 1.070/1.899 lần đánh LH nằm ngoài phách
   nguyên. Nhấn lệch hiện rõ ở Hồng Kông 1 và Ngày mai em đi; không vì có đảo
   phách mà gọi là bossa hay áp một clave chung.
3. **Nốt đơn xen cụm hợp âm**: 287/1.899 lần đánh LH có từ hai nốt. Vai trò bass
   và hợp âm có thể nằm trong cùng bàn tay, không chỉ “trái bass, phải chát”.
4. **Mật độ thay đổi theo câu, có nhấn–nhả**: Ngày mai em đi phiên đầu 90 lần
   đánh/16 ô, điệp đầu 76/16, nhưng số nốt tăng 102 lên 109. Đậm hơn có thể là
   dày theo chiều hợp âm, không phải nhiều lần đánh hơn. Có Em Chờ điệp đầu
   cũng không có số nốt LH trung bình cao hơn phiên đầu.
5. **Bè trong hỗ trợ giai điệu và khoảng ngân**: các ô đại diện cho phép giữ
   vài nốt/bậc hòa âm dưới melody, thay vì dập lại toàn bộ hợp âm theo từng
   âm tiết. Không suy pedal, rubato hay lực đánh thực từ các số đếm này.

**Ballad nét CP** là bản tổng hợp của KeyTrain: câu **8 phách**, ô A rải ngắn
1–5–8 rồi ngân (nền Ngày mai em đi 21), ô B bass xen cụm hợp âm nhấn lệch
(nền ô 35, đối chiếu Hồng Kông 1). RH dùng bè trong rút gọn của hai mẫu tương
ứng. Như vậy câu có thưa–đậm và khoảng thở; không nhồi tất cả kỹ thuật vào một ô.
Việc ghép A–B là biên soạn mới, **không khẳng định CP đã chơi nguyên vòng này**.
Móc kép vẫn có nút riêng vì bằng chứng groove chính tập trung ở Có Em Chờ.

Đây là nét quan sát được trong corpus CP hiện có, chưa chứng minh các kỹ thuật
chỉ riêng CP mới dùng. Nút tổng hợp không tự đổi ở điệp khúc; mỗi đầu đoạn mở
lại ô A. Các điệu mới nằm trong họ Ballad và dùng chung luồng phát/luyện đã có.

## Kiểm và phạm vi duyệt

`caPhaoBallad.test.ts` đối chiếu onset/trường độ LH với bản ghi MusicXML đã lưu,
kiểm danh mục nút, phân họ, câu 8 phách, mở lại đầu đoạn, chuyển tông, hợp âm
ngắn/slash và nốt hữu hạn trong tầm. Kiểm hồi quy Bossa/solo bảo vệ mốc cũ.
Riêng sáu mẫu Ballad CP, renderer giữ đúng nốt/bè trong đã chọn khi bật màu
hợp âm CP; không thay nốt đơn bằng cả thế bấm RH. Nhánh phát của các điệu cũ
giữ nguyên.
Các phép kiểm này xác nhận dữ liệu và đầu ra kỹ thuật; kết luận âm nhạc cần
nghe các nút trên bài thật. Sau khi nghe chốt, ghi quyết định vào SO-TAY.md.
