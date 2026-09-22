# Solo Ballad Có Em Chờ: Sửa Cách Học

22/9/2026. Người dùng phản hồi bản ghép hai ô từ sáu sheet: tiết tấu lộn xộn,
giai điệu phô. Bản đó bị thay thế, **không phải mốc đã nghe duyệt**.
Bản sửa dưới đây là bước bám khung nguồn để nghe kiểm tra, chưa phải bộ soạn
đầy đủ mọi giọng/kỹ thuật hoặc mọi tiến trình hợp âm.

## Sai Ở Bản Trước

- Cùng nhịp 4/4 và cùng mode không chứng minh cùng lối đệm. Chọn mảnh theo
  nhãn ballad đã bỏ qua yêu cầu phân nhóm theo đệm hát trước.
- Ghép hòa âm hai ô rồi ép đường quãng vào những nốt gần nhất làm mất câu
  hỏi/đáp, hướng giải quyết chromatic và vị trí dặm hợp âm của nguồn.
- Thay LH solo bằng một loop LH phiên khúc đã phá phối hợp hai tay. Đúng
  số phách không đồng nghĩa đúng tiết tấu của cả câu.
- Kho full-sheet có phần giao lời hát: C5/D5 cuối ô 8 và Eb4/Eb5 ngân vào
  đầu ô 48. Nhãn intro/interlude toàn ô chưa đủ làm ranh giới học.

## Phân Nhóm Trước

Nguồn: 8 sheet ballad đang hoạt động trong corpus PianoBrain, cộng ACDD.
Không phục hồi các sheet đã bị loại. Chạy lại trực tiếp trên MusicXML:

```powershell
python -X utf8 -B scripts/audit_cp_ballad_compatibility.py --output Reference/CP-BALLAD-COMPATIBILITY.json
python -X utf8 -B tools/cp_full_solos.py --check
```

JSON ghi hash nguồn, phạm vi hát, mẫu LH, trường độ, số bè của cụm, RH đã
chọn thủ công, cặp ô trùng và các ô solo cần đối chiếu. Mốc là phách đen,
offset từ 0. Không đếm grace/tie-stop thành tiếng mới; nối tie trong ô.
Trường độ được giới hạn trong ô cho phép so sánh, không đại diện pedal.

**Phương pháp hai tầng:** LH sàng lọc ứng viên; sau đó kiểm bè trong RH,
bass thấp/cao, cụm/nốt đơn, nhấn/nghỉ, chỗ đổi hợp âm và câu hai ô.
RH chưa xác định vai trò không được đưa vào phép so tiết tấu đệm.
Không dùng một ngưỡng khoảng cách số học để tự cấp quyền mượn solo.

| Sheet / nhóm đối chiếu | Bằng chứng đệm hát | Kết luận hiện tại |
|---|---|---|
| Có Em Chờ, 75 BPM | LH 10/18: 0,1,1.75,2.25,2.5,2.75,3. Ô 9 ngân/nhấn lệch; 25/41 lặp RH bè trong .75,1.25,1.75 nhưng đổi LH. | Giữ nhóm riêng. Không sheet khác trùng các mẫu LH đặc trưng đã chọn. |
| Ngày mai em đi, 83 BPM | LH 35/36/43/71: 0,1,1.5,2.5,3; ô 35 nhả .25 trước tiếng 3. LH 21/29/65 rải 0,.5,1 rồi ngân. | Họ đối đáp bass/cụm và rải-ngân; không đồng nhất Có Em Chờ. |
| Hồng Kông 1 | 14 ô trùng lưới LH điệp Ngày; 77/97 trùng cả onset/gate/số bè với mẫu rải Ngày 21. Nhưng 25/34 là nốt đơn, tiếng 2.5 dài .5, khác cụm/nghỉ ô 35 Ngày. | Ứng viên gần Ngày, phải xét từng câu; không nhập vào Có Em Chờ. Tempo sheet thay đổi, không gán một BPM chung. |
| Kém duyên, 104 BPM | 9 ô trùng lưới LH điệp Ngày. 18/19/22/23/52/56/65 còn trùng trường độ/số bè với Hồng Kông 82/84/90. | Ứng viên Ngày/Hồng Kông; mốc hát và giọng chưa đủ xác nhận, chưa cấp quyền học solo. |
| Yêu xa, 80 BPM | Rải LH 0,.5,1 ở 9 ô nhưng trường độ không trùng Ngày. Chỉ ô 104 trùng onset Có Em Chờ 63: 0,2,2.25, không trùng gate/cụm. | Nét rải phổ biến, chưa chứng minh cùng lối đệm. Mốc hát suy từ ngoài solo, còn tạm. |
| Để Em Rời Xa, 85 BPM | LH 5/33: 0,1,3.25,3.5,3.75; ngân đầu câu, chạy cuối. | Một vài ô trùng lưới móc đơn bài khác không đủ ghép cả họ; chưa tương thích Có Em Chờ. |
| Chưa Bao Giờ, 72 BPM | LH 69/74: 0,.5,2,2.5,3, trùng onset ACDD40 và Yêu xa23/31/71 nhưng khác gate/cụm. | Ứng viên đối chiếu cục bộ với ACDD, chưa phải donor. |
| Chúng Ta Không Thuộc Về Nhau, 103 BPM | LH 15/27/31/54/59/60/63: 0,1.5,2.5; nhiều khoảng trống. | Có mẫu nhấn lệch riêng; không dùng làm thay thế Có Em Chờ. |
| ACDD, 63 BPM | Ô 9–16/38–45 có rải và dặm; ô 40 có bè hợp âm, khác việc đếm toàn RH melody. | Nhóm riêng theo phân tích ACDD; không lấy ô 1–8 làm nền chính. |

Đây là **phân nhóm làm việc**, không kết luận các bài không thể phối chung.
Không có cặp nào được tự cấp quyền mượn solo chỉ từ LH trùng. Trong lần này,
chỉ nhóm Có Em Chờ được đưa vào sửa bộ soạn; các nhóm khác vẫn là đề xuất.

## Dấu Ấn Có Căn Cứ

Từ phần đệm: bass giữ mốc, bè trong đáp lệch; hai tay cùng gánh hòa âm;
lặp cử chỉ nhưng đổi nốt/mật độ theo câu. Có Em Chờ 10/18 và 25/41,
Ngày 35/43/71 là bằng chứng lặp trong bài. Điệp không nhất thiết tăng mọi
loại nốt: Ngày tăng cụm LH dù tổng tiếng LH giảm. Đây là thủ pháp CP dùng,
**không phải khẳng định kỹ thuật độc quyền CP**.

Sau khi giữ Có Em Chờ thành nhóm riêng, học solo chính bài:

- **Ô 1–4:** cụm ngân rồi câu đáp, tiếp ii–V–I. Ô 2 có chùm ba thật,
  không làm tròn thành móc kép; nốt sát nửa cung phải ở nguyên ngữ cảnh.
- **Ô 5 / 53:** cử chỉ IVmaj7 leo tầng C/Eb/G/Bb, lên Bb6/C7 rồi đối đáp
  cao/thấp. Cùng hình nhưng khác nhịp vào: đỉnh ở 5:2.25 và 53:2.5;
  LH ô 5 di chuyển, ô 53 giữ Eb3/Bb3 từ phách 2. Không hoán đổi chỉ RH.
- **Ô 6 / 54:** đường xuống, cụm kề nửa cung và octave; LH dặm Bb/D/F
  ở offset 1 rồi đổi bass. Giữ nguyên cả câu để nốt căng có chỗ đi tiếp.
- **Ô 50–51:** chạy lên bằng cụm, B5/C6 nối qua vạch rồi đi xuống. Cắt
  theo hai ô tùy ý hoặc xem tie-stop là attack sẽ làm hỏng câu này.
- **Ô 52:** Db/F/Ab là màu cục bộ trên nền chuyển động, không phải vốn
  nốt có thể rải tùy ý lên mọi hợp âm maj7.
- **Ô 66–72:** kết trong E trưởng, không phải C# thứ chỉ vì có bass C#.
  Ô 70 có chùm ba và ô 71–72 có nốt ngân nối, không thêm nốt để lấp hết.

Không thêm luyến/grace do suy đoán: dữ liệu solo Có Em Chờ không có grace.
Velocity và cách thu quãng vẫn là diễn giải của app, không phải đo bản thu.

## Thay Đổi Bộ Soạn

`composeCpSolo` chỉ chuyển họ Có Em Chờ sang `coEmChoComposition.ts`.
Renderer full hiện có được tách thành `renderCpFullSolo` để dùng lại cách
giữ note/gate/tuplet và thu quãng; các nhánh Bossa không đổi thuật toán.
Không sửa JSON corpus chung, mẫu đệm hát hoặc cơ chế bảo vệ phách dẫn.

1. Dạo giữ ô 1–8, bỏ RH từ 8:3.5; LH vẫn nối tới đầu phần hát.
2. Giang giữ 48–55, bỏ RH lời hát ngân 48:0. Khôi phục Bb3/F4 và Bb3/Eb4
   ở 56:0/1 cùng LH đầu ô. Thêm hai phách ngân để khép ô thứ 9 ở giọng hiện
   tại là **chuyển thể của KeyTrain**, không chép phần nâng tone/lời hát ô 56.
3. Kết giữ 66–72, chuyển mọi nốt theo tonic E trưởng của đoạn đó.
4. Lượt chẵn giữ khung; lượt lẻ đổi **nguyên cử chỉ hai tay** 5 ↔ 53 tại
   IVmaj7, cùng cửa vào iii7 và không có tie băng qua chỗ cắt. Không ghép
   tiến trình ngẫu nhiên, không chọn nốt gần nhất từ gam chung.
5. Một số nhãn ii/V trong sheet lệch với bass/bè thực: ô 7/55 có F bass
   đầu ô, Bb bass từ 1.75 và D giải sus sau đó; ô 67/69 có F# rồi B.
   Bản hiển thị dùng diễn giải ii → V theo các mốc này, không dùng nhãn
   in để phát một bass khác. Giữ cả ký hiệu nguồn trong corpus để đối chiếu.
6. Không ép solo phải lặp nền phiên: solo giữ cách hai tay phối trong chính
   bài, phần hát vẫn dùng mẫu Có Em Chờ và phách dẫn đã sửa.

Độ dài ổn định: dạo 32, giang 36, kết 28 phách, cả thường/full. Full không
tự nhân đôi thành 16 ô ngẫu nhiên. Có hai biến thể dạo/giang, một khung kết;
**không quảng cáo là bộ soạn vô hạn câu mới**.

## Giới Hạn Còn Lại

- Chỉ hỗ trợ 12 giọng trưởng trong nhánh mới. Giọng thứ báo chưa có khung
  tương thích, không âm thầm dùng Để Em Rời Xa/Chưa Bao Giờ/Chúng Ta. Đã hỏi
  người dùng chọn ưu tiên bản trưởng hay mở thêm chuyển thể thứ; chưa có đáp án.
- Dạo/giang khép về I theo nguồn; chưa tái soạn cadence về mọi hợp âm mở
  phần hát khác I. Không gọi đó là đã bám mọi đích hòa âm.
- Tầm đàn hẹp có thể cần dịch từng cụm một quãng tám. Bảo toàn pitch-class
  và nhịp không đảm bảo giữ nguyên độ rộng âm vực của bản thu.
- Chưa bật donor ngoài Có Em Chờ. Phân loại RH toàn bộ các sheet vẫn cần
  đối chiếu theo câu; số liệu LH tự nó không thay công việc này.
- Chưa nghe duyệt. Test bảo vệ dữ liệu và hành vi, không đo được độ hay.

## Kiểm Thử

`coEmChoComposition.test.ts`: ranh giới lời hát, hai tay/onset/gate đúng
nguồn, chùm ba/tie, hoán đổi 5/53 chỉ tại cửa an toàn, 12 giọng trưởng,
tầm MIDI, timeline hợp âm, không đột biến corpus, từ chối mode chưa học.
`cpBalladBacking.test.ts` và `acddConnections.test.ts`: phách dẫn/đổi đoạn.
`cpComposition.test.ts` và `caPhaoFullSolo.test.ts`: nhánh Bossa và full cũ.

Kết quả kiểm tra lần này: 64 test liên quan qua (6 file; thêm test ráp bài
trên chính nhánh biến thể), build qua. Lint các file sửa không có lỗi,
còn 7 cảnh báo hook có sẵn ở ReharmHome. Lint toàn repo còn 18 lỗi / 8
cảnh báo ở phạm vi khác, không sửa lẫn vào thay đổi âm nhạc này.
Giao diện kiểm với vòng C mặc định tại cổng 5174, màu Cà Pháo + full:
hiện đúng “Biến thể theo Có Em Chờ”, dạo 8 / giang 9 / kết 7 ô.
Không có bài Để nhớ một thời ta đã yêu trong thư viện tab thử; chưa nghe
kiểm trên bài thật và không khẳng định chất lượng âm nhạc chỉ từ test.

Sau khi nghe chốt, nhắc ghi `Reference/SO-TAY.md`; chưa tự ghi Sổ tay.
