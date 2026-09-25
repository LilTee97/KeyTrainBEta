# Ballad DERX: phân tích tiết điệu hai tay trong sheet Để em rời xa

Ngày cập nhật: 25/09/2026. Điệu do Codex biên soạn, chờ người dùng nghe duyệt.

Tài liệu giải thích cách tôi đã tạo bản DERX ở commit `7eb6eca`: hướng phân tích, bằng chứng từ sheet, những chi tiết được chọn và những chỗ đã thay đổi khi biến thành điệu đệm. Lần cập nhật tài liệu này không thay đổi âm nhạc hoặc mã phát nhạc.

**Tóm tắt:** tôi rút phần đệm hai tay từ một bản piano có cả giai điệu, không lấy riêng tay trái rồi thêm một mẫu dập tay phải có sẵn. Mẫu phiên chọn cửa sổ 4–5, đối chiếu 32–33; mẫu điệp chọn 24–25, đối chiếu 52–53. DERX giữ các mốc nhấn và độ ngân đã chọn, nhưng chuyển cao độ thành bậc hợp âm và điều chỉnh âm vực để dùng với bài khác.

**Không nên hiểu DERX là bản chép nguyên xi cả bài hoặc là công thức ballad duy nhất của Cà Pháo.** Việc phân biệt bè đệm, giai điệu và câu nối có quyết định biên tập của tôi, không phải MusicXML đã đánh nhãn sẵn.

## 1. Nguồn và các file để tra lại

| Thành phần | Đường dẫn |
| --- | --- |
| Sheet nguồn | `D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl` |
| Script phân tích | `D:/KeyTrain/scripts/audit_ballad_derx.py` |
| Số đo và nốt nguồn | `D:/KeyTrain/Reference/BALLAD-DERX-EVIDENCE.json` |
| Điệu thực thi | `D:/KeyTrain/src/reharm/style/styleLibrary/balladDerx.ts` |
| Kiểm tra hồi quy | `D:/KeyTrain/src/reharm/style/__tests__/balladDerx.test.ts` |

SHA256 của sheet: `c4d780b7b37c89b1e7891daca40bc13fbca5ffba8c5600cf25ea04350aaaba4b`.

Tôi đọc MusicXML bên trong MXL: cao độ, khuông, voice, onset (thời điểm nhấn), trường độ, dấu nối và cụm nốt cùng lúc. Đây không phải phân tích từ nghe audio/video, cũng không phải phép đo pedal hoặc lực tay từ bản thu.

Tempo trong XML là **85 BPM**. Bài chủ yếu dùng 4/4, ở Rê thứ rồi chuyển Mi giáng thứ từ XML 56. Có ô lấy đà 0 dài 3.25 phách và các ô dài khác 4: ô 10 dài 2, ô 11 dài 3, ô 23 dài 6, ô 71 dài 3. DERX lấy mẫu ở đoạn Rê thứ, không lập một mẫu riêng cho đoạn nâng giọng.

## 2. Tôi phân tích theo hướng nào?

Tôi xem tiết điệu là **kết quả phối hợp giữa hai tay trên cùng dòng thời gian**, với bốn câu hỏi:

1. Tay nào tạo cú nhấn mới? Hai tay cùng đánh hay tay này đáp sau tay kia?
2. Tay nào còn giữ tiếng? Không nhấn mới không đồng nghĩa với đang im.
3. Tay phải đang chơi giai điệu, bè trong hay câu nối? Không lấy toàn bộ tay phải làm nhịp đệm.
4. Chi tiết nào dùng lại được trên hợp âm khác mà không ép giai điệu riêng của bài lên người hát?

Ba kiểu phối hợp được chọn làm cơ sở:

- **Trái giữ nền, phải chêm bè:** hợp âm trái còn ngân khi phải nhấn lệch.
- **Phải giữ bè, trái chạy nối:** chuyển phần chuyển động sang tay trái, không bắt phải dập liên tục.
- **Cùng nhấn rồi tách nhau:** điệp có các mốc hai tay gặp nhau, xen mốc phải đáp riêng.

Vì vậy tôi chọn một cặp ô có sự trao vai giữa hai tay thành chu kỳ 8 phách, thay vì chỉ trích một ô bass đều rồi lặp.

## 3. Cách đo để không đọc sai tiết tấu

### 3.1. Đọc hai khuông và nối tie xuyên vạch nhịp

Script dùng `audit_ca_phao.audit(..., dynamics=True, actual_pickups=True)`, xử lý nốt hợp âm chung onset và các lệnh `backup/forward` của MusicXML. Staff 2 được coi là trái, staff 1 là phải theo phân công của bản ký âm; không suy đây là bằng chứng về ngón tay thực tế trong video.

Tôi đặt nốt của toàn bài lên trục thời gian tuyệt đối trước, rồi dùng `joined_attacks` nối các nốt cùng cao độ, voice và tay có tie liên tục. Nhờ vậy, tie qua vạch nhịp không bị cắt mất.

Sheet có **255 nốt mang tie-stop**; không coi chúng là 255 cú đánh mới. Trường độ sau khi nối là độ ngân ghi trong sheet, không phải tổng thời gian tiếng vang do pedal.

### 3.2. Quy ước “cửa sổ”, tránh nhầm số ô

Điểm bass thường nằm ở offset 1 của ô XML. Để so các câu cùng pha, tôi dùng:

```text
Cửa sổ k = từ ô XML k, offset 1
           đến trước ô XML k+1, offset 1.
```

Offset 1 tương ứng đầu phách thứ hai nếu đếm ô XML từ phách 1. Cặp cửa sổ 4–5 vì thế bắt đầu ở XML 4:phách 2, kết thúc trước XML 6:phách 2.

**Đây là cách căn pha để phân tích, không phải kết luận tác giả ghi sai vạch nhịp.** Không được so trực tiếp “cửa sổ 4” với nguyên ô XML 4 mà quên dịch pha.

Trong các bảng sau:

- `t`: thời điểm tính bằng phách đen từ đầu cửa sổ, bắt đầu ở 0.
- `d`: độ ngân tính bằng phách đen.
- `.25`: móc kép; `.5`: móc đơn; `1`: nốt đen.
- `1.75` là tọa độ thời gian, không phải tên phách đếm theo số thứ tự.
- Dấu `+` giữa các tên nốt nghĩa là đánh cùng lúc; C4 là Đô giữa.

### 3.3. Khảo sát rộng trước khi chọn mẫu

Script thống kê phiên 4–19, phiên lặp 32–47, điệp 20–27, điệp lặp 48–55 và điệp nâng giọng 56–63. Những cửa sổ không dài 4 phách bị loại khỏi bảng đếm, không bị ép thành 4/4.

Riêng hai lượt phiên, trên 30 cửa sổ dài 4 phách:

| Số đo | Kết quả | Ý nghĩa |
| --- | ---: | --- |
| Mốc trái nhấn mới | 195 | Cụm nhiều nốt cùng lúc vẫn tính một mốc |
| Mốc phải nhấn mới | 265 | Bao gồm giai điệu lẫn bè trong |
| Mốc hai tay cùng nhấn | 93 | Hai tập onset trùng nhau |
| Mốc chỉ phải nhấn mới | 172 | Trái không có cú nhấn mới tại đó |
| Mốc phải vào khi trái còn ngân | 155 | Có nốt trái vào trước và chưa kết thúc |
| Mốc trái vào khi phải còn ngân | 89 | Có nốt phải vào trước và chưa kết thúc |

Hai hàng “còn ngân” không loại trừ hàng “cùng nhấn”: một tay có thể vừa giữ nốt cũ vừa thêm nốt mới. **265 mốc phải không phải 265 cú dập đệm.** Số liệu cho thấy cần đọc hai tay cùng nhau, nhưng không tự tách được phần đệm.

## 4. Tôi chọn và bỏ bè tay phải như thế nào?

Tôi đối chiếu cụm nốt, tuyến nốt cao, hòa âm và các lần lặp, rồi lập danh sách giữ lại bằng tay trong biến `RIGHT` của script. Không dùng quy tắc cứng “nốt cao nhất luôn là melody, mọi nốt thấp hơn luôn là đệm”.

| Vị trí | Có trong sheet | Giữ vào DERX | Lý do và mức độ chắc chắn |
| --- | --- | --- | --- |
| 4:0 | D4 + F4 | D4 | Rút cụm xuống một tiếng; đầu cửa sổ 32 có D4. Không chứng minh F4 chỉ là melody |
| 4:1.75 | E4 + C5 | E4 | Giữ bè thấp dưới C5; cụm này lặp ở 32 |
| 4:2.25 và 2.75 | G4 + C5 | G4 | Giữ bè trong; ở 32:2.25 chỉ còn C5, không được nói G4 luôn lặp |
| 5:1, 1.25, 1.75 | F4 + C5 | F4 | Giữ bè thấp và độ ngân; 33 có lại các mốc F4 này |
| 24:4/3 | F4 + Bb4 + F5 | F4 + Bb4 | Bỏ tầng F5, giữ cụm thấp và onset chùm ba |
| 25:1.75 | F4 + A4 + F5 | F4 + A4 | Giữ hai bè dưới; cụm nguồn lặp ở 53 |
| 24:2.75–3.5 | C4; D4/G4; E4; C4 | Giữ câu nối thấp | Một phần là câu nối được chọn, không khẳng định tất cả là đệm thuần; D4/G4 và E4 có đối chiếu ở 52 |

Ở phiên, tôi bỏ tuyến C5/A4 tại 4:.5–1.25, tuyến F4–A4–C5–A4 đầu cửa sổ 5 và E4 tại 4:3.25. E4 thấp vẫn bị bỏ: quyết định không chỉ dựa vào âm vực, mà còn nhằm tránh mang cả đuôi câu giai điệu vào vòng đệm.

Ở điệp, tôi bỏ tầng D5/F5/E5/G5 trong các cụm đã chọn, cùng tuyến E5–D5–C5–D5 và đuôi A4–G4 ở cửa sổ 25.

**Đây là lựa chọn biên tập có đối chiếu. Không phải nốt bị bỏ không quan trọng trong bản Cà Pháo, cũng không phải các nốt giữ lại đã được chứng minh tuyệt đối là phần đệm độc lập.**

## 5. Phiên khúc: lấy gì từ cửa sổ 4–5?

### 5.1. Cửa sổ 4: trái giữ nền, phải đáp lệch

| t | Trái trong sheet | d trái | Phải được giữ | d phải |
| ---: | --- | ---: | --- | ---: |
| 0 | Bb2 + F3 + A3 | 1.5 | D4 | .5 |
| 1.75 | C3 + G3 | .75 | E4 | .5 |
| 2.25 | Không nhấn mới | | G4 | .5 |
| 2.5 | G3 | .5 | Không nhấn mới | |
| 2.75 | Không nhấn mới | | G4 | .5 |
| 3 | C4 | 1 | Không nhấn mới | |

Hai tay cùng nhấn ở 0 và 1.75. Tại 2.25, trái còn giữ C3/G3 trong khi phải thêm G4. Tại 2.5, trái đánh G3 khi G4 phải còn ngân. Tại 2.75, phải đánh lại G4 khi G3 trái chưa hết tiếng.

Chi tiết tôi giữ là **các tiếng nhấn mới đan vào tiếng ngân của tay kia**, không phải hai lớp rải đều độc lập.

### 5.2. Cửa sổ 5: phải ngân, trái chạy nối

| t | Trái trong sheet | d trái | Phải được giữ | d phải |
| ---: | --- | ---: | --- | ---: |
| 0 | D3 + A3 + C4 | 2 | Không nhấn mới | |
| 1 | Không nhấn mới | | F4 | .25 |
| 1.25 | Không nhấn mới | | F4 | .5 |
| 1.75 | Không nhấn mới | | F4 | 2 |
| 2.25 | A2 | .25 | Đang giữ F4 | |
| 2.5 | D3 | .25 | Đang giữ F4 | |
| 2.75 | E3 | .25 | Đang giữ F4 | |
| 3 | F3 | .25 | Đang giữ F4 | |
| 3.25 | E3 | .25 | Đang giữ F4 | |
| 3.5 | D3 | .25 | Đang giữ F4 | |
| 3.75 | C3 | .25 | F4 vừa hết trường độ | |

Diễn tiến được đưa vào DERX:

1. Trái giữ D3/A3/C4 từ 0 đến 2, làm nền cho ba lần nhấn F4 bên phải.
2. Phải giữ F4 từ 1.75 đến 3.75. Khi cụm trái hết ở 2, F4 vẫn nối qua khoảng nghỉ .25 phách trước câu chạy.
3. Trái chạy A2–D3–E3–F3–E3–D3–C3, mỗi tiếng .25 phách.

**Nói chính xác: sáu tiếng đầu của câu chạy nằm dưới F4 đang ngân; C3 cuối vào đúng lúc F4 kết thúc.** Không phải cả bảy tiếng đều chồng lên F4.

Đây là chi tiết hai tay quan trọng nhất của DERX. Nếu thay bằng phải dập đều mỗi phách, hoặc rút F4 còn .25/.5 phách, sẽ mất cách trao phần chuyển động từ tay phải sang tay trái.

### 5.3. Vì sao chọn 4–5, không dùng mọi ô như nhau?

Cặp này có đủ nền hợp âm ngân, tiếng chêm lệch và câu chạy nối dưới bè giữ trong tám phách, phù hợp để tạo một vòng đệm có mở và nối câu.

Ở 33, F4/C5 lặp tại 1 và 1.25; tại 1.75 có C4/F4/C5 nhưng ngân **1.5 phách**, không phải 2 như ở 5. Bass cuối câu cũng thay đổi.

Vì vậy, đối chiếu 32–33 củng cố cách phối hợp hai tay, không chứng minh câu chạy bảy nốt hoặc gate 2 phách là công thức cố định toàn bài. DERX chọn **một biến thể 4–5 để lặp**, chưa tự chọn biến thể theo câu hát.

## 6. Điệp khúc: lấy gì từ cửa sổ 24–25?

### 6.1. Tay trái và biến thể lấy thêm từ 52

| Cửa sổ | t | Nốt nguồn | d | Cách đưa vào DERX |
| --- | ---: | --- | ---: | --- |
| 24 | 0 | Bb1 | .5 | Gốc trong âm vực của app |
| 24 | .5 | Bb2 | .5 | Thay bằng bậc 5, theo F3 ở cửa sổ 52 |
| 24 | 1 | Bb3 | 1 | Gốc cao hơn một quãng tám |
| 24 | 2 | C2 | .5 | Gốc bass |
| 24 | 2.5 | C3 + G3 | .5 | Gốc + bậc 5 ở tầng trên |
| 24 | 3 | C3 + G3 | 1 | Đánh lại cụm và giữ |
| 25 | 0 | C#3 | .5 | Không ép A/C#; dùng gốc/bass theo đầu vào |
| 25 | .5 | A3 | 1 | Gốc cao hơn một quãng tám |
| 25 | 1.75 | D2 | .25 | Giữ cú bass tại mốc sớm này |
| 25 | 2 | D2 | 1 | Đánh lại bass |
| 25 | 3 | D2 | .75 | Giữ đến 3.75 rồi nghỉ .25 |

Ba tiếng đầu 24 là Bb1–Bb2–Bb3 qua ba tầng quãng tám. DERX thay bằng động tác **Bb2–F3–Bb3 của cửa sổ 52**, cùng onset 0, .5, 1.

Đó là ghép một biến thể có thật ở lần lặp để thu gọn động tác, không phải cao độ nguyên văn của 24.

### 6.2. Tay phải sau khi rút gọn

| Cửa sổ | t | Nốt được giữ | d |
| --- | ---: | --- | ---: |
| 24 | 0 | F4 | .5 |
| 24 | .75 | F4 | .5 |
| 24 | 4/3 | F4 + Bb4 | 2/3 |
| 24 | 2 | E4 + C5 | .75 |
| 24 | 2.75 | C4 | .25 |
| 24 | 3 | D4 + G4 | .25 |
| 24 | 3.25 | E4 | .25 |
| 24 | 3.5 | C4 | .5 |
| 25 | 0 | A4 + C#5 | .5 |
| 25 | .5 | A4 | .25 |
| 25 | .75 | A4 | .25 |
| 25 | 1 | E4 | .25 |
| 25 | 1.25 | C#5 | .5 |
| 25 | 1.75 | F4 + A4 | .5 |
| 25 | 3.25 | C4 | .25 |

Ở 24:4/3, tôi giữ `4 / 3` và `2 / 3` trong mã, **không làm tròn sang 1.25 hoặc 1.5**. Đây là chi tiết chùm ba tại vị trí cụ thể, không phải swing áp lên cả điệu.

### 6.3. Điểm cùng nhấn và điểm đáp lệch

Trong mẫu chọn, hai tay cùng nhấn ở 24:0, 24:2, 24:3 và 25:0, 25:.5, 25:1.75. Phải có các tiếng riêng ở 24:.75, 24:4/3, 24:2.75, 24:3.25, 24:3.5 và các điểm đáp trong 25.

Điệp vì thế không chỉ là “phiên đánh mạnh hơn”: nó đổi sang bass chuyển động theo móc đơn, cụm phải rõ hơn, điểm nhấn chung xen đáp lệch và câu nối thấp.

52–53 có lại động tác chùm ba, E4/C5 tại 52:2, D4/G4 tại 52:3, E4 tại 52:3.25 và F4/A4 tại 53:1.75. Nhưng 53:0 chỉ có E5, không có A4/C#5 như 25. DERX giữ biến thể 24–25; không khẳng định toàn bộ bè chọn lặp y hệt ở lần sau.

## 7. Cách biến số đo thành điệu của nút Ballad DERX

### 7.1. Hai cell 8 phách và một nút chọn

| Thuộc tính | Giá trị thực thi |
| --- | --- |
| Tên nút / family | Ballad DERX / `ballad-derx` |
| Phiên | `ballad-derx`, lấy 4–5 |
| Điệp | `ballad-derx-chorus`, lấy 24–25, đầu bass theo 52 |
| Nhịp và BPM | 4/4, 85 BPM |
| Độ dài mỗi cell | 8 phách |
| Màu nhận diện | Hồng, thuộc danh sách điệu Codex |

Cửa sổ thứ nhất có beat = t; cửa sổ thứ hai có beat = t + 4. F4 ở cửa sổ 5:t = 1.75 thành RH beat **5.75**, duration **2**. Câu chạy trái nằm tại beat **6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75**.

App đổi mẫu theo section phiên/điệp có sẵn, không nghe audio để tự đoán đoạn bài hát.

### 7.2. Chuyển nốt cụ thể thành bậc hợp âm

Trong helper `tone(index, semitones)`: index 0 là gốc, 1 là bậc 3, 2 là bậc 5, 3 là bậc 7. `semitones` dịch thêm số nửa cung đã ghi; sau đó renderer đưa nốt vào âm vực. Không nhầm index 3 với “bậc ba”.

| Chi tiết nguồn | Dạng mã hóa |
| --- | --- |
| Bb2/F3/A3 đầu phiên | Gốc + bậc 5 + bậc 7 |
| C3/G3 kế tiếp | Gốc và bậc 5 ở tầng trên bass |
| D3/A3/C4 đầu cửa sổ 5 | Gốc, bậc 5, bậc 7 ở tầng trên, rồi giới hạn âm vực |
| F4 giữ trên Dm | Bậc 3 của hợp âm đang dùng, không cố định Fa cho mọi giọng |
| A2–D3–E3–F3–E3–D3–C3 trên Dm7 | Bậc 5; gốc +12; gốc +14; bậc 3 +12; gốc +14; gốc +12; bậc 7 |
| D4/G4 nối trên C | Gốc +2 nửa cung và bậc 5 |

Bậc 3/5 theo thành phần hợp âm, không luôn là ba trưởng/năm đúng. Nếu hợp âm ba không chứa bậc 7, cơ chế dự phòng hiện có có thể dùng bậc 5. Vì vậy trên **Dm7**, đuôi câu ra C3 như nguồn; trên **Dm** không được hứa vẫn ra C3. DERX không tự thêm hợp âm bảy.

Nốt gốc +14 là lựa chọn cố định tương ứng bậc 2 tự nhiên ở tầng trên. Đây không phải thuật toán chọn mọi nốt lướt theo thang âm của từng bài.

### 7.3. Không ép hòa âm của sheet lên mọi bài

Các mốc hòa âm dùng để đọc mẫu nguồn là Bb → C tại 4:1.75 và A → Dm tại 25:1.75. DERX giữ cú đánh ở đó nhưng **không bật `som` để ép dùng hợp âm kế tiếp**.

Nếu người dùng nhập mỗi hợp âm dài 4 phách, cú 1.75 vẫn dùng hợp âm đang chạy. Muốn đối chiếu theo mốc nguồn có thể bố trí:

- Phiên: Bbmaj7/C/Dm7 với độ dài 1.75/2.25/4.
- Điệp: Bb/C/A/Dm7 với độ dài 2/2/1.75/2.25.

Đó là cách bố trí đầu vào để đối chiếu, không phải vòng hợp âm được nút tự chèn.

Renderer hiện lấy mốc gốc từ bass của voicing. Với slash chord, không được suy rằng mọi bậc đều còn tính thuần từ tên gốc hợp âm; nó theo cơ chế bass hiện có. Với hợp âm ngắn, cú trái đầu còn có thể bị rút về bass. Tôi không tuyên bố đã xử lý riêng hoàn chỉnh mọi thể đảo của nguồn.

### 7.4. Những thay đổi chủ động so với bản ký âm

| Quyết định | Điều thay đổi | Lý do |
| --- | --- | --- |
| Trái MIDI 36–59, phải 60–74 | Không giữ mọi quãng tám nguồn | Tách vùng phím khi chuyển giọng |
| C4 trái hạ về C3 tại 4:3 và trong cụm 5:0 | Hai vị trí cụ thể đổi quãng tám | C4 = 60 vượt trần trái 59 |
| Đầu điệp dùng 1–5–8 của 52 | Khác ba tầng Bb ở 24 | Chọn biến thể có thật, gọn hơn |
| Không ép C# bass đầu 25 | Không bắt mọi bài dùng A/C# | Theo đầu vào người dùng |
| Giữ bè trong và một số câu nối thấp | Bỏ phần lớn tuyến giai điệu | Nhường chỗ cho người hát |
| Velocity .65/.8/.85 | Lực đánh do Codex cân bằng | Không phải lực tay đo từ biểu diễn |
| `releaseRatio = 1` | Không tự cắt gate bằng tỷ lệ .92 mặc định | Giữ độ ngân đã chọn trong cell |
| Không bật `cpBalladChordLeads` | Không thêm bass dẫn bằng bộ lập kế hoạch đó | Tránh thay/che câu chạy nguồn |
| Đưa DERX vào `KEEP_RH_RESTS` | Không tự bù cú phải khi hợp âm ngắn rơi vào khoảng trống | Khoảng nghỉ là một phần tiết tấu |

`rootFloor = 55` là mốc tính bậc của tay phải; giới hạn nốt phát ra là `low = 60`, `high = 74`. Không nhầm hai khái niệm.

Dù `releaseRatio = 1`, engine vẫn có thể cắt nốt ở ranh giới hợp âm/section. Fill hoặc solo người dùng bật riêng vẫn có thể ảnh hưởng kết quả. DERX không bảo đảm mọi gate nguồn giữ nguyên trong mọi cấu hình.

## 8. DERX tách khỏi Ballad Để em của Claude ở đâu?

- Claude: `Ballad Để em`, family `ca-phao-ballad-de-em-roi-xa`, phiên dùng cửa sổ 8–9.
- Codex: `Ballad DERX`, family `ballad-derx`, phiên dùng cửa sổ 4–5 với bè phải ngân trên câu chạy trái.
- Hai bản cùng khai thác điệp 24–25 và biến thể bass đầu 52. **Không được tuyên bố điệp DERX hoàn toàn khác Claude.** Tách nút và cấu hình không có nghĩa phải làm mọi nốt khác đi một cách nhân tạo.
- DERX dùng vùng tay 36–59 / 60–74 và không bật `cpBalladChordLeads`.
- Màu hồng chỉ nhận diện Codex, không có nghĩa đã nghe duyệt hoặc tốt hơn bản Claude.

Không đổi tên, thay ID hoặc sửa mẫu nhạc của nút Claude để tạo DERX.

## 9. Kiểm chứng và giới hạn

### Đã kiểm bằng dữ liệu và mã

Script kiểm SHA nguồn, kiểm các nốt RH chọn giữ có thật tại vị trí đã ghi, F4 tại 5:1.75 dài 2 phách và bảy onset bass cuối cửa sổ 5. Evidence lưu nốt nguồn lẫn danh sách giữ, không chỉ lưu kết luận.

Sáu bài kiểm tra trong `balladDerx.test.ts` bao gồm:

1. Onset/gate của cả hai tay khớp số đo đã chọn ở 4–5 và 24–25. Không đồng nghĩa mọi cao độ đầu ra giống sheet.
2. Trên Bbmaj7/Dm7, F4 tại beat 5.75 ngân 2 phách và LH chạy đúng A2–D3–E3–F3–E3–D3–C3. Bài này kiểm cửa sổ thứ hai, không kiểm toàn bộ chuyển Bb → C đầu phiên.
3. RH điệp và chùm ba khớp cao độ đã chọn trên Bb/C/A/Dm7 với độ dài 2/2/1.75/2.25.
4. Hai mẫu giữ onset và vùng phím trên 12 gốc × 5 loại hợp âm × voicing thường/Cà Pháo. Không phải nghe kiểm mọi vòng hòa âm.
5. Cắt nốt tại ranh giới hợp âm/section, không bù RH ngoài mẫu.
6. ID riêng, màu Codex, họ ballad, đổi phiên/điệp và không tự bật bộ thêm bass dẫn; nút Claude vẫn tồn tại.

`StylePicker.test.tsx` kiểm một nút DERX màu hồng, trạng thái chọn và sự tồn tại riêng của nút Claude. Kiểm mã giao diện không thay thế ảnh màn hình hoặc nghe thực tế.

### Những điều chưa thể khẳng định

- Chưa nghe xác nhận mọi quyết định giữ/bỏ bè đều đúng ý đồ Cà Pháo.
- Chưa chứng minh lặp 4–5 liên tục hợp mọi câu hát; chưa tự đổi biến thể theo câu lời.
- Chưa tái tạo pedal, rubato hoặc sắc thái lực tay từ bản thu.
- Chưa bảo đảm cao độ giữ nguyên khi đổi loại hợp âm, slash, fill, solo và âm vực.
- Các lượt lặp có khác biệt thật; không được bỏ qua rồi gọi DERX là bản nguyên văn toàn bài.

## 10. Cách tái kiểm tra và tiếp tục từ tài liệu này

Chạy trong `D:/KeyTrain`, chỉ đọc sheet:

```powershell
python -X utf8 -B scripts/audit_ballad_derx.py
npx vitest run src/reharm/style/__tests__/balladDerx.test.ts src/reharm/style/__tests__/StylePicker.test.tsx src/reharm/style/__tests__/caPhaoBalladDeEm.test.ts
```

Khi cần chủ động tái xuất evidence:

```powershell
python -X utf8 -B scripts/audit_ballad_derx.py --output Reference/BALLAD-DERX-EVIDENCE.json
```

Tra `selected["4"]`, `["5"]`, `["24"]`, `["25"]` cho mẫu chọn; `["32"]`, `["33"]`, `["52"]`, `["53"]` cho lần lặp. Các cửa sổ đối chiếu có `retainedRight` rỗng vì không được chọn trực tiếp làm danh sách RH của cell, **không phải không có tay phải**; phải đọc `notes`.

Khi phản hồi bản nghe, cần phân biệt: sai onset, sai độ ngân, sai cao độ/âm vực, giữ quá nhiều giai điệu hay mẫu lặp chưa hợp câu hát. Ghi vòng hợp âm, độ dài từng hợp âm, phiên/điệp, voicing và fill/solo để tái hiện đúng.

Lần ghi tài liệu này không sửa sheet, corpus, `Nguon.json`, không train solo, không thay âm nhạc hai nút và không ghi trạng thái “đã duyệt” vào Sổ tay. Khi người dùng chốt bản nghe, cần ghi quyết định và lý do vào `Reference/SO-TAY.md` theo yêu cầu riêng.
