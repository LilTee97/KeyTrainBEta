# Ballad CP theo bài: Có Em Chờ và Ngày mai em đi

Ngày 20/9/2026. **Bản đệm rút gọn để nghe thử, chưa được người dùng duyệt.**
Hai bài là một nhóm đối chiếu, không phải một điệu tổng hợp. Không thêm nút
"Ballad nét CP", không hiện lại các nút đã bị người dùng ẩn. Bossa và solo CP
đã duyệt không đổi. Những sheet khác chỉ được khảo sát để đề xuất.

## Nguồn và giới hạn

- Đọc hai file MusicXML của CP trong `D:/PianoBrain/video/Ca_Phao/`; SHA256,
  tempo, các ô đối chiếu hai tay và thống kê nằm trong [dữ liệu](CA-PHAO-BALLAD-SONGS.json).
- Phân đoạn lấy từ `tools/sheet/corpus.json` đã được đối chiếu trước đó.
  Số ô là **số measure XML**, không phải số dòng hoặc thứ tự sau khi phát lặp.
- Onset là thời điểm gõ mới của một tay; nhiều nốt đồng thời tính một lần.
  Bỏ grace và phần nối tie-stop. Không gán phần nối thành một cú nhấn mới.
- RH của sheet chứa cả melody, bè trong và fill. **Số lần đánh RH không đồng
  nghĩa mật độ đệm RH.** Giữ/bỏ bè trong bên dưới là quyết định biên soạn thủ
  công, không khẳng định đã tách giọng hát tự động chính xác.
- Trường độ ghi trên sheet không cho biết pedal, lực đánh và độ nhả thực của
  bản thu. Vì thế "nảy" là cách đọc vị trí nhấn/nghỉ, chưa phải đo âm thanh.
- Đối chiếu các đoạn của cùng bài trước; không lấy histogram toàn bộ các bài
  rồi biến nó thành một ô ballad chung. Hai bài cũng chưa đủ chứng minh một
  thủ pháp là độc quyền của CP; cần nhóm đối chứng từ người chơi khác.

Lệnh tái tạo:

```powershell
python -B scripts/audit_cp_ballad_songs.py --output Reference/CA-PHAO-BALLAD-SONGS.json
```

## Có Em Chờ

Tempo ký âm: **75 BPM**. Phiên 9–24, phiên 2: 33–40; điệp 25–32,
điệp 2: 41–47, điệp chuyển giọng 56–65. Không xem các lần điệp là bản sao.

### Phiên khúc

Ô 9 trên Abmaj7: bass Ab2 tại offset **0, 1.75, 2.25**, dài **1.5, .5,
1.5** phách. Có khe nghỉ .25 trước lần bass thứ hai và ở cuối ô. Bè trong
RH chêm tại 1, 1.25, 1.75, 3; không phải hai tay dập cùng một lưới đều.

Ô 10 trên Gm7: bass G2, Bb3, G2, Bb3, G2, D3, G3 tại **0, 1, 1.75,
2.25, 2.5, 2.75, 3**. Ba móc kép cuối cụm nối từ bass thấp về quãng tám;
RH ở 1.75 còn ngân trong lúc LH chuyển động. Ô 18 lặp nguyên lưới LH này,
nhưng khác trường độ và có Gb2/E3 cuối ô. Không áp chromatic ấy lên mọi hợp âm.

Hai ô 9–10 là một câu **ngân/nhấn lệch rồi chuyển động**, không phải "móc kép
suốt cả bài". Ô 17 cùng Abmaj7 với ô 9 nhưng LH chỉ có 0, 2.25, 3:
ngay trong phiên, CP cũng thay cách lấp khoảng trống.

### Điệp khúc

So **cùng cặp Abmaj7–Gm7**, ô 25–26 với ô 9–10:

- Ô 25 bass mở .25 phách, rải lên ở .25, .75, 1.25; tiếp tục đổi tầng thấp/cao
  tại 1.5, 2, 2.25, 2.75, 3.5. LH có 9 lần gõ, so với 3 ở ô 9.
- RH ô 25 có bè C5 dưới melody ở **.75, 1.25, 1.75**, tức nhấn lệch móc kép
  nối tiếp nhau. Ô 41 cũng có cụm G4/C5 dưới melody tại các vị trí đó, dù
  LH không lặp nguyên ô 25. Đây là bằng chứng lặp **kỹ thuật**, không lặp cả ô.
- Ô 26 rải G2–D3–G3 đầu ô, bass trở lại 1.75 và 2.5, rồi F3 .25 phách ở
  2.75 dẫn vào Bb3/D4 tại 3. Không dùng cùng mẫu LH của ô 10.
- Cuối ô 25 có F4/Bb4/F5 đi trước hợp âm Gm7 ở offset 3.75 và nối vào ô 26.
  Đây là pickup phụ thuộc hòa âm; không được đếm tie-stop đầu ô 26 là cú gõ.

| Đoạn | Ô | LH lần gõ/ô | RH lần gõ/ô, gồm melody | LH cụm từ 2 nốt |
|---|---:|---:|---:|---:|
| Phiên 1 | 16 | 6.75 | 7.50 | 28 |
| Điệp 1 | 8 | 7.13 | 8.38 | 10 |
| Phiên 2 | 8 | 6.88 | 7.75 | 17 |
| Điệp 2 | 7 | 6.43 | 9.14 | 16 |
| Điệp chuyển giọng | 10 | 6.10 | 8.30 | 11 |

Nhận xét "điệp dồn hơn" có cơ sở ở các câu cụ thể và số gõ RH, nhưng **không
thành quy luật LH phải tăng mật độ ở mọi lần điệp**. Bản đệm bỏ melody có thể
ít gõ RH hơn bản phiên: chỉ ép thêm nốt để đạt chỉ tiêu "dày" sẽ sai nguồn.

## Ngày mai em đi

Tempo ký âm: **83 BPM**. Phiên 19–34, 55–70; điệp 35–50, 71–86.

### Phiên khúc

Ô 21 Cm7: LH **C3–G3–C4** ở 0, .5, 1; trường độ .5, .5, 3. RH còn bè
Bb4 tại 1, Eb4 tại 1.5, G4 tại 2 dưới melody. Rải xong thì ngân, không
lấp toàn bộ khoảng trống. Lưới 0–.5–1 lặp ô 29 và 65.

Ô 22 vẫn Cm7: C3–G3–C4–C4–G3–Bb3 tại 0, .5, 1.5, 2, 3, 3.5.
Sau ô ngân là một ô đáp có chuyển động bass; RH Eb4/G4 chỉ vào 2.5 rồi
ngân 1.5 phách. Ô 30 thay đường chạy và vị trí nhấn, không phải bản sao ô 22.

Ô 19 chỉ giữ Eb3 cả ô; ô 20 lại đi Eb2–Eb3–Bb3. Điều này bác bỏ cách gọi
toàn bộ phiên là một mẫu rải bất biến.

### Điệp khúc

Ô 35 Eb: **bass thấp → cụm cao → bass thấp → octave ngắn → cụm cao**
tại **0, 1, 1.5, 2.5, 3** (phách 1, 2, 2&, 3&, 4).
Tiếng 2.5 dài .25, có khoảng nhả .25 trước 3. RH Bb4–G4–Bb4–Eb5 đệm
dưới melody ở 1, 1.5, 2, 2.5. Khác phiên không chỉ ở tốc độ gõ mà ở
**cụm cao/thấp xen nhau và nhấn lệch**. Ô 43 và 71 giữ lưới LH này.

Ô 36 Bb/D giữ lưới đó nhưng thành D3/Bb3, D4, D3/Bb3, D3/F4, Bb3/D4.
Ô 72 rút còn 0, 1, 1.5, tiếng cuối dài 2 phách. Điệp cũng có chỗ thở.
Hai ô 35–36 làm câu đại diện, không ép cả điệp theo ô 35.

| Cặp đoạn, đều 16 ô | LH lần gõ | LH cụm từ 2 nốt | RH lần gõ, gồm melody |
|---|---:|---:|---:|
| Phiên 1 → điệp 1 | 90 → 76 | 11 → 26 | 111 → 116 |
| Phiên 2 → điệp 2 | 82 → 66 | 7 → 16 | 106 → 111 |

Điệp **ít gõ LH hơn nhưng nhiều cụm hợp âm hơn** ở cả hai lượt. Cảm giác nảy
không đồng nghĩa thêm móc kép: số attack LH có trường độ ghi không quá .25
phách còn giảm 19→4 và 15→4. Các số này không đo staccato/pedal thực tế.

## Nhóm Đối Chiếu Hai Bài

1. **Bass giữ mốc, bè trong lệch mốc:** Co Em 9–10 có bass đầu ô, RH đáp ở
   1.25/1.75; Ngày 21–22 có bass rải đầu ô, RH tiếp ở 1.5/2/2.5.
2. **Thay độ đậm bằng cách phân vai hai tay:** LH vừa làm bass vừa chạm cụm
   cao. Ngày 35–36 thể hiện rất rõ; Co Em 26 có cụm Bb3/D4 cuối ô và 41 có
   C4/Eb4 tại 1. Không giản lược thành trái chỉ bass, phải luôn hợp âm.
3. **Đảo phách có ngân và có khe nhả:** Co Em 9 có khe .25 ở 1.5; Ngày 35
   có khe .25 ở 2.75. Nốt ngắn, nốt giữ và nghỉ đặt cạnh nhau tạo tương phản.
4. **Lặp cử chỉ nhưng biến ô theo câu:** Co Em 10/18 lặp lưới nhưng thay nốt;
   25/41 giữ nhấn RH .75–1.25–1.75 nhưng đổi LH. Ngày 35/43/71 lặp lưới,
   còn 36/72 rút gọn khác nhau. Không có bằng chứng một loop bất biến cho cả bài.
5. **Cao trào bằng hai cách khác nhau:** Co Em nổi bật phân chia móc kép và
   hoạt động RH; Ngày nổi bật cụm LH và đối đáp thấp/cao. Không gộp thành
   công thức "điệp = thêm nhiều nốt".

Đây là **các ứng viên dấu ấn trong hai bản phối CP**, không phải kỹ thuật chỉ
CP có. Hai bài không trùng bốn lưới LH được chọn đối chiếu (xem JSON).
Không tạo nút tiết tấu cho nhóm này.

## Nút Được Dựng

| Họ nút | Phiên | Điệp | Độ dài |
|---|---|---|---|
| Ballad Có Em Chờ | ô 9–10 | ô 25–26 | mỗi mẫu 8 phách |
| Ballad Ngày mai em đi | ô 21–22 | ô 35–36 | mỗi mẫu 8 phách |

Giữ đầy đủ onset/trường độ attack LH trong các cặp liên tiếp, không ghép ô
phiên với ô điệp thành một loop "chung". Nhấn nút tên bài mở lựa chọn phiên/điệp.
Khi bài đã gắn đoạn, cơ chế hiện có tự chuyển đúng biến thể và mở lại đầu
câu ở ranh giới đoạn, kể cả đoạn trước dài số ô lẻ. Chưa có nhãn đoạn thì
chơi mẫu được chọn. Không thay nhãn/tiết tấu của bài khác hay tự chia đoạn.

### Rút gọn RH và điều chỉnh cao độ

Offset dưới đây bắt đầu từ 0 **trong từng ô**. Chỉ giữ nốt bè trong, bỏ
melody/ornament và câu chạy cuối câu; vẫn là phán đoán biên soạn có thể sửa khi nghe.

| Ô | RH giữ từ sheet |
|---|---|
| Co Em 9 | 0: G4/C5; 1: C4/Eb4/G4; 1.25: C5; 1.75: G4/C5; 3: C4/Eb4/G4 |
| Co Em 10 | 0: F4/Bb4; .5/.75: F4; 1.25: D4; 1.75: F4 |
| Co Em 25 | .75/1.25/1.75: C5; 3: Eb4 |
| Co Em 26 | 1.75: F4/Bb4; 2.25: F4 |
| Ngày 21 | 1: Bb4; 1.5: Eb4; 2: G4 |
| Ngày 22 | 2.5: Eb4/G4 |
| Ngày 35 | 1: Bb4; 1.5: G4; 2: Bb4; 2.5: Eb5 |
| Ngày 36 | .5: Bb4; 1: F4/Bb4 |

- Co Em 25 bỏ **cả pickup 3.75 lẫn tie-stop đầu 26**, không biến nối thành gõ.
  C5/D5 tại 26:1.25 không đưa vào groove vì C5 là màu ngoài bộ ba/bảy Gm7.
- Ngày 35 bỏ F4/F5 tại 3.5 vì đó là melody nhân octave. Ngày 36 bỏ Eb4 ở
  3.75, không đổi nốt treo ấy thành bậc 5 giả để lấp cuối ô.
- Cao độ chuyển thành bậc hợp âm theo cơ chế hiện có, không giữ nguyên MIDI.
  LH cụm cao được thu về tầm tay khai báo; không tái hiện nguyên các quãng rộng.
- B3 ở Co Em 25:.75 được chuẩn hóa thành bậc 3 của hợp âm đang phát, không
  áp nốt chromatic của Abmaj7 này cho mọi hợp âm. Ngày 36 Bb/D được rút thành
  hình bass/cụm cao; **không ép thể đảo Bb/D lên mọi vòng**. Người dùng ghi
  slash trong vòng thì engine giữ bass slash; đây không phải clone voicing ô 36.
- Không tự thêm 7/9, không thay tiến trình hợp âm. Bậc thiếu dùng fallback
  hiện có; đổi hợp âm trong ô thì engine cắt ngân/bổ sung bass theo quy tắc cũ.
- Velocity và vị trí quãng tám là biên soạn, không phải số đo biểu cảm của CP.
  `verified` ở danh mục mang nghĩa đã đối chiếu nguồn ký âm để hiện nút,
  **không có nghĩa đã nghe duyệt hay xác nhận theo video**.

Các loop này đại diện cho những câu đã chỉ rõ, không mô phỏng toàn bộ biến
thiên của cả bài. Chưa có đủ cơ sở để sinh ngẫu nhiên biến thể "đúng CP".

## Sheet Nên Đối Chiếu Tiếp

**1. Hồng Kông 1:** bằng chứng lặp nhiều nhất với Ngày mai em đi. Lưới LH
0–1–1.5–2.5–3 xuất hiện ở 14 ô hát: 25, 34, 36, 38, 39, 42, 75, 82, 83,
84, 85, 87, 90, 93. Ô 25/34: F2→C4→C3→A3→C4, cũng luân phiên thấp/cao,
nhưng không có cụm hai nốt như Ngày 35. C3 tại 1.5 nối qua 2; A3 tại 2.5
dài .5, **khác khe nhả .25** của Ngày 35. Giống lưới, không đồng nhất cách đệm.

**2. Kém duyên:** lưới đó có ở 18, 19, 22, 23, 52, 56, 57, 64, 65. Ô 18:
Eb2→Bb3/D4→Eb3→Eb3→Bb3/D4, gần cách bass xen cụm của Ngày 35 hơn về
phân vai. Tuy nhiên chưa chốt mốc phiên/điệp; các ô chỉ nằm ngoài đoạn solo
đã biết. Đây là đề xuất có điều kiện, chưa kết luận "điệp giống nhau".

**3. Yêu xa, mức yếu hơn:** 9 ô có onset rải ngắn 0–.5–1. Ví dụ ô 11
C2–C3–G3, nhưng nốt cuối chỉ .5 phách, không ngân 3 phách như Ngày 21.
Chỉ nên so kỹ thuật mở ô, không gọi hai groove giống nhau. Chưa chốt phiên/điệp.

Với **Có Em Chờ**, chưa thấy sheet khác trùng hai lưới LH đặc trưng đem so
trong phạm vi đã khảo sát. Điều này không chứng minh không có tương đồng ở
những câu khác hoặc ở RH. Chưa đủ bằng chứng để ghép thêm bài chỉ vì cùng 4/4
hoặc có móc kép. Không tạo nút nào cho ba đề xuất trên trong lượt này.

## Kiểm Tra

Test đối chiếu bốn cặp LH với dữ liệu gốc, BPM, hai nhóm nút, phiên/điệp,
ranh giới đoạn lẻ, 12 giọng trưởng/thứ, RH rút gọn khi bật màu CP và hợp âm
ngắn/slash. Không dùng test để thay cho nghe duyệt. Sau khi nghe chốt, cần
ghi quyết định và lý do vào `Reference/SO-TAY.md` (chưa tự ghi).
