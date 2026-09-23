# Hồ sơ Cà Pháo — phần đã áp dụng trong KeyTrain

Tài liệu này ghi riêng những điều KeyTrain thực sự dùng được từ sheet Cà Pháo.
Nó không biến mọi quyết định nghe hay trong app thành thủ pháp đã được chứng minh
là của Cà Pháo. Bản đo chi tiết và dữ liệu gốc nằm ở
[CA-PHAO-BOSSA-AUDIT.md](CA-PHAO-BOSSA-AUDIT.md).

## Mô Phỏng Solo Ballad Có Em Chờ - 24/09/2026

Phản hồi: mô phỏng không giống sheet, bỏ nhiều phần. Lượt này **sửa mô phỏng
ballad**, không train tiếp chế độ Soạn câu mới và không sửa Bossa đã duyệt.

- Xác minh giang bị cắt ở ô 55, thiếu hai phách đầu ô 56 (4 nốt RH + 4 nốt LH).
- Tầm đàn 61 phím làm renderer đổi quãng từng tay/cụm; đủ số nốt vẫn sai đường
  chạy cao-thấp. Mô phỏng nay chuyển tone đồng đều cả câu, báo nốt vượt tầm đàn.
- Khôi phục lực đánh ghi trong MusicXML Có Em Chờ, chỉ dùng khi mô phỏng;
  không còn san tất cả RH về 72 và LH về 64. Không gọi đây là lực đo bản thu.
- Đổi cách tạo solo bỏ lựa chọn nghe lại câu cũ, tránh nút Phát vẫn phát bản lưu.

Đủ dạo 168 / giang 194 / kết 111 note-on sau gộp tie; giang dài 34 phách.
93 kiểm thử liên quan + build qua, chưa nghe duyệt. Chi tiết nguồn, mốc ô,
giới hạn và lệnh tái tạo: [đối chiếu Có Em Chờ](CO-EM-CHO-SOLO-2026-09-22.md#kiểm-lại-mô-phỏng-24092026).

## Train Solo Ballad CP — Phản Hồi 23/09/2026

### Train Theo Bình Luận Đã Lưu

Đã đọc trực tiếp `Nguon.json`, chỉ lọc điệu `ca-phao-ballad-co-em-cho`,
giọng G trưởng. Không dùng bình luận Bolero/Bossa cũ để train ballad.

- **#1299:** nghe còn màu thứ. Ưu tiên câu mở có hợp âm chủ trưởng trong hai
  ô đầu; không cấm iii/vi hay đổi nhận diện giọng để che vấn đề.
- **#1302, #1306, #1320, #1321, #1327:** hụt/ngắt hoặc chững ở Bm7–Em7, D,
  Cmaj7, Am7 và Em/G. Đo có trường hợp RH nghỉ thật (#1306: .75 phách), nhưng
  nhiều câu không có khoảng im RH tổng quá .5 phách: tiếng bè trong còn ngân
  không chứng minh đường giai điệu liền. Sửa lựa chọn/nối mẫu và độ ngân đỉnh.
- **#1326, #1332:** phô hoặc lệch mạch ở Cmaj7, Em/G, Am7, D9sus4. Tăng kiểm
  quãng nối giữa hai mẫu; không kết luận mọi nốt ngoài hợp âm đều sai.
- **#1330:** đoạn đầu đến Cmaj7 thứ nhất được khen; Cmaj7 kế làm mất mạch.
  Dùng đoạn đầu làm tham khảo, không gắn nhãn cả câu là xấu. Phản ánh hợp âm
  ngừng sáng trong khi nhạc tiếp tục có lỗi giao diện khả dĩ: bản lời lấy dải
  giang đầu, còn con trỏ theo lượt hiện tại. Đã cho cả hai dùng cùng lượt.
- **Đã ổn:** giữ nguyên #1304, #1328, #1329, #1331. #1329 là dạo; ba câu kia
  là kết. Không lấy mật độ kết ngân dài làm tiêu chuẩn cho thân giang.

Không sửa/xóa/chấm lại `Nguon.json`, không tái soạn đè câu người dùng đã duyệt.
Bản ghi cũ thiếu seed, thời lượng từng hợp âm và dấu nguồn, nên chưa tái tạo
đúng cấu hình sinh ban đầu. Phân tích từ nốt đã lưu là chính; không gọi câu
mới cùng vòng hợp âm là bản tái hiện chính xác câu cũ. File cũ có 11 tên cột
nhưng dòng mới có loại đoạn ở vị trí 12; khi đối chiếu đã đọc riêng phần này.
Các thay đổi chỉ áp dụng lượt **Soạn câu mới**, không đổi câu lưu để nghe lại.

**Phạm vi: train bộ soạn cho điệu ballad, không phải Bossa CP cải tiến.**
Người dùng đánh giá solo **Ballad Có Em Chờ tạm ổn, 7/10**, nhưng yêu cầu
train tiếp để sát các câu CP đã soạn trong sheet. Đây là mốc phản hồi để
đối chiếu, **chưa phải duyệt đóng băng** và không phải điểm chấm bằng kiểm thử.

- **Giai điệu:** chưa sát sheet; nhiều chỗ lặp nốt, còn phô và chói tai.
  Ưu tiên giữ đường câu, vai trò nốt trên hợp âm và cách giải quyết của nguồn,
  không chỉ tăng số nốt hoặc thêm chromatic cho có kỹ thuật.
- **Kỹ thuật:** tương đối ổn nhưng vẫn còn nhiều thủ pháp trong các solo ballad
  chưa được đưa vào bộ soạn. Học lại dạo/giang/kết đã chia đoạn, bổ sung theo
  chứng cứ ô nhịp và kiểm tra khả năng chuyển sang tiết tấu đang chơi.
- Phân biệt trưởng/thứ; nguồn chưa xác nhận giọng chỉ được dạy tiết tấu.
  Không lấy giai điệu lời hát làm mẫu đệm. Giữ phách dẫn giữa hợp âm và
  khung đệm Có Em Chờ/ACDD; không thay bản mô phỏng nguyên câu sheet.
- Lượt sửa phải ghi riêng: nhịp, hòa âm, chọn nốt/kỹ thuật; kiểm thử kỹ thuật
  không thay nghe duyệt. Chưa có bài đang nghe, loại đoạn hoặc take cụ thể
  cho những chỗ phô, nên không khẳng định đã tái hiện đúng mọi chỗ người dùng báo.

Chi tiết nguồn, phép đo và các lượt sửa:
[Bộ soạn solo Ballad CP](CP-BALLAD-COMPOSER-2026-09-23.md).

## Bossa CP cải tiến

### Mốc hiện hành đã duyệt và đóng băng — 19/9/2026

Người dùng xác nhận: **“các câu solo hiện tại đã đạt rồi, giữ nguyên ngay mức
này và đừng sửa thêm gì nữa mà hãy commit luôn”**. Mốc mã là **`bcddfd0`**
(`feat: freeze user-approved CP solo and lick composition`). Đây là mốc bộ
soạn hiện tại được nghe duyệt, không phải chỉ mốc tài liệu hay snapshot test.
Các nhãn “chờ nghe duyệt” ngày 17–18/9 bên dưới là lịch sử trước xác nhận này;
không dùng chúng làm lý do tiếp tục train. Không suy rộng thành chứng nhận
mọi take ngẫu nhiên, mọi giọng hoặc mọi điệu đều đã được nghe riêng.

**Quy tắc bảo toàn:** giữ nguyên bố cục, hòa âm, giai điệu, phối hai tay,
bass, dặm/cú giật, nhấn–nghỉ, onset/gate và phần dẫn intro/giang. Không tự
train thêm, đổi nguồn hay nới luật nốt sau mốc này; chỉ sửa âm nhạc khi có
phản hồi cụ thể mới. Khung hát 11 tiếng/8 phách vẫn giữ ngoài các cửa CP
Lick/Run được phép phối lại. Phát trọn bài mới soạn lượt mới; click hợp âm
trong lúc phát không soạn lại. Giữ cả đường full/rút gọn và mô phỏng hiện có.

Để hiểu/tái tạo đúng mốc, đọc `src/reharm/style/cpComposition.ts` cùng
`caPhaoSolo.ts`, `caPhaoFullSolos.json`, các test/snapshot và tích hợp
`ReharmHome.tsx` trong **cùng commit**, không phục dựng từ một file đơn lẻ:

- Chọn giai điệu trong cả đường câu theo ngữ cảnh hợp âm địa phương. Không
  khôi phục hậu xử lý `refineBossaPitches` của vòng 17/9 đã bị bác.
- `cpMelodicContexts` giữ nốt trước–nốt màu–nốt giải, hướng đi, độ ngân,
  mode và chức năng/chất hợp âm; loại pickup lời và phần trưởng song song
  đã đánh dấu khỏi các sự kiện được học ở đây. `cpHasApproach` kiểm ngữ cảnh
  chuẩn bị và giải của chromatic ngắn trong câu thứ, không cho thêm tùy tiện.
- Trong đường nhanh giọng thứ, ba mốc cách nhau không quá ½ phách, mỗi mốc
  tối đa hai bè và cùng hợp âm, không chọn hai bước nhảy liên tiếp đều từ
  5 bán âm trở lên. Giữ cú nhảy đơn, đường vòng và kỹ thuật dặm; không sửa
  lưới tiết tấu để xử lý chỗ chỏi giai điệu.
- Chọn màu hợp âm **Cà Pháo** tự dùng CP Lick/Run thay Licky, kể cả bài lưu
  cũ có `cpLick: false` (`intensity === 'caPhao' || cpLickSelected`). Mô tả
  “ô CP Lick mặc định tắt” ở mốc 14/9 bên dưới không còn chi phối chế độ màu
  Cà Pháo hiện tại. Không sửa thuật toán fill/run trong lượt chốt này.

Commit giữ được bộ soạn và nguồn dữ liệu, **không giữ riêng một lần phát
ngẫu nhiên**. Muốn đối chiếu đúng câu đã nghe cần giữ cả bài/cấu hình và
take/seed; không hứa checkout commit sẽ tự phát lại đúng câu ấy.

### Sửa nhận diện giọng, độc lập với mốc solo — 19/9/2026

Commit **`e47147a`** chỉ sửa dò/chọn giọng và test, không sửa bộ solo:

- *Thôi em đừng đi*: vòng `Dm7 G7 Em7 A7 / Dm7 G7 Cmaj7 A7` thuộc ngữ cảnh
  C trưởng; không kết luận Dm chỉ vì mở bằng Dm7 và có A7→Dm7. Bộ dò cộng
  bằng chứng ii–V–I/iii đầu bài, có chặn để đoạn trưởng tương đối không
  lấn giọng thứ đã thiết lập ở phiên khúc (hồi quy *Cánh hồng phai* vẫn Em).
- Ô **Giọng** hiện đủ 12 trưởng + 12 thứ và Tự dò. Chọn C trưởng để sửa
  nhận diện **không dịch** Dm7 G7 thành Cm7 F7. **Tone −/+** mới dịch cao độ
  toàn bài. Sửa mode không có nghĩa tự đổi mọi hợp âm thứ thành hợp âm trưởng.
- Đã kiểm trực tiếp bài đang mở: Tự dò C; chọn C giữ nguyên hợp âm; Tone +
  chuyển Db và Tone − trả C. Không tự lưu đè bài trong thư viện.

Kiểm tại mốc mã: **333/333 test liên quan (17 file)** và production build
qua; so mã solo với `bcddfd0` không khác. Đây không phải kết quả toàn suite
hay bằng chứng nghe duyệt thêm các câu trưởng. Lượt ghi tài liệu không đổi
mã, dữ liệu nốt hoặc take đang phát.

### Học lại hòa âm–giai điệu theo ngữ cảnh — 18/9/2026, chờ nghe duyệt

Người dùng không chấp nhận kết quả vòng nắn nốt 17/9. **Không phải bỏ phân biệt
trưởng/thứ**: bỏ cách sửa từng nốt riêng lẻ theo màu giọng sau khi câu đã phối xong.
Đã bỏ `refineBossaPitches` và trọng số Bossa:Ballad 3:1 của vòng đó. Vòng trước
chỉ đổi nốt trên cùng, không đổi vòng hợp âm; chưa đủ bằng chứng để quy toàn bộ
cảm giác hòa âm xấu đi cho riêng lớp sửa ấy.

Đọc lại MusicXML bằng `python -B -X utf8 tools/cp_solo_habits.py --minor-context`:
12 đoạn của 4 sheet thứ xác nhận giọng (Người hãy quên em đi, Để Em Rời Xa,
Chưa Bao Giờ, Chúng Ta Không Thuộc Về Nhau). Phần chuyển trưởng song song và
pickup lời đã đánh dấu không được dùng để học nốt thứ. Hai bài chưa rõ giọng
vẫn không dùng làm nguồn cao độ. Xem mục 10 trong
[phân tích nguồn](CP-THOI-QUEN-SOLO-2026-09-17.md).

Đã sửa trong bộ soạn hiện có, không tạo engine thứ hai:

- `cpMelodicContexts` giữ **bậc gốc + loại hợp âm + nốt ngân + quãng đi tới**.
  Khi soạn thứ Bossa, ưu tiên bằng chứng Bossa cùng chức năng; chỉ lấy ngữ cảnh
  tương ứng từ sheet thứ khác nếu Bossa chưa có. Không để số lượng Ballad lấn át.
- Chọn nốt ngay trong đường giai điệu được tìm cho cả câu, không nắn từng nốt
  sau khi phối bass. Không loại máy móc nốt màu cọ sát nếu Bossa có nốt ngân
  đó trên đúng chức năng hợp âm; vẫn kiểm tầm đàn, hướng nối và hòa âm địa phương.
- i/iv trong phần thân ưu tiên m9/m11 đã thấy ở Bossa thay vì bị tần suất m7
  Ballad làm nhạt màu. Giữ dominant/cú bII9→V7(b13) theo đích hòa âm địa phương,
  không biến tất cả hợp âm trên cùng bậc thành một chất cố định.
- Chốt ii hoặc iv dẫn vào phần hát **trước** khi tính bII→V của cụm trước đó.
  Sửa trường hợp cụm giật vẫn hướng về ii tạm dù hợp âm kế đã đổi thành iv.
- Không sửa bộ lập bố cục, mốc gõ, nhấn/nghỉ, tốc độ, khung hát 11 tiếng,
  CP Lick/Run, mô phỏng sheet hay thao tác tua. Không lấy tiết tấu Ballad sang.
  Phát trọn bài mới sinh câu mới; click hợp âm vẫn dùng câu đã nghe.

Snapshot 24 cấu hình được đo lại trên **engine mốc duyệt, trước các sửa mới**,
nay so mốc đánh/độ ngân dài nhất mỗi tay mỗi mốc/lực/động tác/chỗ đổi hợp âm.
Không khóa cao độ bass, vòng hay số bè vì lượt này được phép sửa hòa âm.
Snapshot này không chứng minh mọi gate bè trong giống hệt; các test bổ sung
vẫn kiểm nhấn nhiều bè, bass, cú giật, nối ô và giới hạn tầm đàn. Không cập nhật
kỳ vọng snapshot từ kết quả engine mới để làm test qua.

Đây là một vòng sửa có giới hạn, **chưa được duyệt bằng tai**. Chưa tự mở rộng
vòng hòa âm Ballad hay mọi biến âm ghi trên sheet thành luật dùng tự do.
Sao lưu trước lượt: `D:/KeyTrain-backups/cp-context-20260918-092356`.

### Hướng học lại solo — 17/9/2026, đối chiếu lại mốc nghe hay

Người dùng bác cách giữ nguyên toàn bộ solo *Người hãy quên em đi* rồi thay nốt.
Đã đo lại 9 sheet về vị trí kỹ thuật, tiết tấu, nghỉ/ngân, đường chạy và phối tay;
bình luận #1143 lúc 15:07 cùng vòng và 111 nốt được chuyển sang MD thầy ở PianoBrain.
Xem [phân tích và đặc tả bộ soạn](CP-THOI-QUEN-SOLO-2026-09-17.md).
Đã triển khai một vòng trong `cpComposition.ts`: chọn bố cục kỹ thuật mới từ
các động tác Bossa hai ô, soạn vòng hòa âm mới theo chức năng, lấy mô-típ và
đường chạy cùng màu trưởng/thứ từ các sheet khác. Không giữ thứ tự toàn bộ solo
nguồn rồi chỉ thay nốt. Intro/giang có vùng dẫn về hợp âm thật của đoạn kế tiếp.
Chi tiết và giới hạn ở mục 9 của bản phân tích; không dùng test khớp nguyên
timeline nguồn làm bằng chứng đã tự soạn. Khung đệm hát 11 tiếng vẫn giữ nguyên.

Người dùng làm rõ: mốc nghe hay là **sau lượt sửa hai file trong ảnh
`+145/-89`**, không phải duyệt chung mọi câu hiện tại; nghe về sau không còn hay.
Đã được phép khôi phục và đối chiếu nhật ký: sau lượt đó không có sửa thuật toán
âm nhạc, chỉ tài liệu và một dòng comment trong `cpComposition.ts`. Đã trả comment
về mốc ảnh, giữ nguyên file test; không giả vờ đây là thay đổi âm thanh.
Sao lưu tại `D:/KeyTrain-backups/bossa-restore-20260917-233651`.
Chưa xác định ID câu/seed của lần nghe hay; khác take là một khả năng cần kiểm
tra, chưa phải kết luận nguyên nhân. Không tự train hoặc duyệt hàng loạt.

### Bộ ba solo thứ — mốc lưu trữ 12/9/2026, mở lại nghe thử 13/9

Người dùng đã duyệt bằng tai **intro, giang tấu và outro giọng thứ** khi đi
cùng `Bossa CP cải tiến` ở mốc 12/9. Sau đó người dùng yêu cầu dựng lại phần
đệm và tạm bỏ solo/fill. Theo yêu cầu mới ngày 13/9, đã mở lại bộ ba thứ
và thêm soạn mới mỗi lần phát; **bản phát triển đang chờ nghe duyệt**.
Khung đệm chính thức vẫn là bản duyệt 13/9/2026 ở mục kế tiếp; không đổi nó
trong phần đệm hát ngoài cửa CP Lick được cho phép riêng.
Việc duyệt cũ không bao trùm mọi biến thể/giọng. Chi tiết nguồn và cách tái tạo:
[Bossa CP solo thứ — khôi phục và phát triển](BOSSA-CP-SOLO-2026-09-13.md).

| Đoạn | Khung đã duyệt ở Am | Điều phải giữ |
| --- | --- | --- |
| Intro | 8 ô, câu mở–đáp rồi iv–V vào bài | Giữ nguyên bản intro đã duyệt |
| Giang | `Am9 | Bm7b5 E7 | Am11 | Bm7b5 E7 | Am9 | Bm7b5 E7 | Am11 | ii–V về đích` | Chạy ngón, khoảng thở RH cuối và hút đúng hợp âm phần hát |
| Outro | `Am11 | Bb9 E7b13 | Am9 | Bm7b5 E7 | Am9 | Am` | Thu mật độ, LH chủ âm và RH 5–1–b3 ngân đủ ô cuối |

Giang/outro phát triển từ các cửa sổ liên tục trong *Người hãy quên em đi*;
không ghép chắp vá ô của nhiều thầy. V7 ở phần giang và kết i thứ ở outro là
biên soạn KT để tạo lực hút/kết theo yêu cầu, không được gọi là chép nguyên
văn sheet. Khi lặp hai vòng giang, chỉ vòng cuối mới đổi ii–V theo hợp âm đầu
của phần hát; vòng trước về chỗ lặp. Take 0–3 giữ nguyên bản lưu trữ;
take từ 4 phát triển đường nét từ các sheet đủ bằng chứng trên nhịp Bossa.
Đây là vốn câu hữu hạn được KT biên soạn lại, không phải bộ học tự động vô hạn.

### Nguồn và ranh giới của việc học

- Mẫu nền rút từ hai ô 9–10 của sheet MusicXML *Người hãy quên em đi* của Cà
  Pháo, rồi đối chiếu lại với hai ô lặp 17–18. Mẫu nền mang id
  `ca-phao-bossa-sheet-9-10`.
- Hồng Kông 1 là ballad/pop có nhấn lệch, không phải nguồn của mẫu bossa này.
- `Bossa CP cải tiến` (`ca-phao-bossa-improved`) là **bản biên soạn của
  KeyTrain**, được điều chỉnh nhiều lượt theo tai nghe và được người dùng xác
  nhận nghe hay. Vì vậy chỉ được nói nó “dựa trên mẫu nền Cà Pháo”, không được
  gán toàn bộ chi tiết của nó cho Cà Pháo.
- Mẫu gồm hai ô 4/4 (8 phách). A và B là hai nửa có vai trò khác nhau; không
  bình quân chúng thành một ô chung rồi lặp lại.

### Khung đệm chính thức — người dùng duyệt bằng tai 13/9/2026

**Khung này thay thế mọi khung CP cải tiến trước đó**, kể cả bản mô tả ở
`64496ba` và các lần dựng thử sau đó. Chỉ áp dụng cho nút `Bossa CP cải tiến`
(`ca-phao-bossa-improved`); không sửa mẫu nguồn `Bossa Nova Cà Pháo (mới)` hay
nút đối chiếu `Bossa test 1`. Ghi chép cũ trong audit/hồ sơ solo là lịch sử,
không được dùng để ghi đè khung chính thức này.

**Bùm₁ – chát₂ – Bùm₃-bum₄ – chát₅ – chát₆ | bùm₇ – chát₈ – bùm₉ – chát₁₀ – CHÁT₁₁ → bass dẫn.**

Hai ô 4/4, tổng 8 phách, BPM mặc định 110. Offset dưới đây tính từ 0 trong
cell, không phải số thứ tự phách đọc thành tiếng. LH = tay trái, RH = tay phải.
Trường độ là số phách phát sau khi xử lý gõ lại cùng phím, với hợp âm đủ dài;
ranh giới hợp âm/đoạn có thể cắt ngân theo renderer. Lực là `velocityScale`,
không phải âm lượng nghe tuyệt đối.

| Tiếng | Offset | Cách đánh | Trường độ | Lực RH / LH |
| --- | --- | --- | --- | --- |
| 1 — Bùm | 0 | LH bass gốc + quãng tám, cùng lúc | 1½ | — / .90 |
| 2 — chát | 1 | RH hợp âm + LH bậc 5 đỡ | ½ cả hai tay | .85 / .55 |
| 3 — Bùm | 1.5 | LH một nốt dưới bậc 5 nửa cung, tiếp cận tiếng 4 | ½ | — / .85 |
| 4 — bum | 2 | LH bậc 5 | ½ thực phát, nhả khi tiếng 5 gõ lại | — / .75 |
| 5 — chát | 2.5 | RH hợp âm + LH nhắc nhẹ đúng nốt bass tiếng 4 | RH 1; LH 1½ tới offset 4 | .72 / .50 |
| 6 — chát | 3.5 | RH hợp âm | ½ | .55 / — |
| 7 — bùm | 4 | LH bass gốc | ½ | — / .65 |
| 8 — chát | 4.5 | RH hợp âm + cụm LH 5–8–10 theo hợp âm | 1 cả hai tay | .60 / .45 |
| 9 — bùm | 5.5 | LH bass gốc, như tiếng 7 | ½ | — / .65 |
| 10 — chát | 6 | Hai tay như tiếng 8 | 1 cả hai tay | .60 / .45 |
| 11 — CHÁT | 7 | RH hợp âm, nhấn | ½ | .90 / — |
| Bass dẫn phụ | 7.5 | LH một nốt trên bass hợp âm kế tiếp nửa cung | ½ | — / .45 |

Chi tiết phải giữ khi tái tạo:

- Bùm 1 dày bằng hai nốt cách quãng tám, không thêm onset. Chát 2 mạnh hơn
  bản cũ và có bass đỡ; Bùm 3 phải rõ, không chìm giữa chát 2 và bum 4.
- Chát 5 có một nốt bass nhẹ **đúng cùng onset** để nối Bùm 3–bum 4–chát 5;
  đây không phải tiếng chính thứ 12. LH tiếng 4 trong cell gốc vẫn ghi duration
  2, nhưng `holdUntilStruckAgain` nhả tại offset 2.5 để gõ lại tiếng 5:
  không kéo hai lần cùng phím chồng nhau, không nhầm duration thô với tiếng thực phát.
- Chuẩn kiểm với velocity nền 80, hệ số LH .85: Bùm 1 = 61; chát 2 RH/LH =
  68/37; Bùm 3 = 58; bum 4 = 51; chát 5 RH/LH = 58/34. Nốt LH của chát 5
  nhẹ hơn bum 4. Giữ tương quan lực, không tăng toàn bộ điệu để chữa một tiếng.
- Không nghỉ giữa chát 8 và bùm 9. Cặp 9–10 lặp cách đánh 7–8; chát 10 nối
  CHÁT 11, rồi mới bass dẫn ở 7.5, **không gộp bass dẫn vào tiếng 11**.
- Bass dẫn chỉ là một nốt trên bass đích nửa cung rồi giải xuống. Chỉ tạo khi
  có ranh giới hợp âm kế tiếp đúng đầu ô sau; không thay bằng cả hợp âm mới,
  không tự thêm ở cuối bài hoặc giữa một hợp âm đang giữ xuyên đầu ô sau.
- Nốt chuyển theo hợp âm/tông; thế RH dùng cơ chế voicing hiện có (voicing
  Cà Pháo có thể dùng đầy đủ template). Không cố định mọi hợp âm thành cùng
  số nốt hoặc bê cao độ tuyệt đối từ một giọng.

Nút `Bossa CP cải tiến` phải mở lại từ nửa A tại mọi đầu đoạn bài. Nếu để vòng
8 phách chạy xuyên cả bài, một phiên khúc mới sau số ô lẻ có thể bắt đầu từ nửa
B (nhóm 7–11), nên nghe như đổi điệu. Đây là lỗi căn chỉnh chu kỳ chứ không phải
một biến thể biểu diễn có chủ ý.

### Bất biến bắt buộc khi làm solo/fill sau này

**Phạm vi lịch sử:** các lệnh cấm tuyệt đối bên dưới là mốc chốt 13/9 trước khi
cho phép CP Lick phối lại hai tay tại câu chêm. Với CP Lick/Run, áp dụng ngoại lệ
đã duyệt ở mục “CP Lick và CP Run” phía dưới; ngoài cửa chêm vẫn giữ nguyên khung.

- **Tuyệt đối không để solo, fill hoặc việc soạn mới mỗi lần phát thay đổi
  cấu trúc khung đệm hát chính thức.** Không xóa/thêm/dời tiếng đệm, đổi độ ngân,
  lực nhấn, vai trò hai tay hay nhịp chu kỳ để nhường chỗ cho solo/fill.
- Dạo, giang, kết là các đoạn riêng. Khi trở lại lời hát, dùng đúng khung trên
  và mở lại nửa A tại đầu đoạn. Biến thể solo/take/seed không được làm đổi
  timeline đệm của cùng đầu vào; không áp `muteWindows`, `giveCompingToLeft`
  hoặc `yieldToFill` làm mất/chuyển tiếng chát của phần hát.
- Nếu fill không vừa khe còn trống thì bỏ/soạn lại fill, không sửa khung đệm.
  Muốn đổi khung phải có yêu cầu cụ thể mới của người dùng và duyệt riêng.
- Hiện **chỉ phát đệm, chưa bật lại dạo/giang/kết/fill**. `buildBossaRhythmOnly`
  giữ nguyên các event đệm khi ráp bài; không xóa dữ liệu bài/câu solo đã lưu.
- Mã tham chiếu: `src/reharm/style/styleLibrary/caPhaoBossa.ts`
  (`CA_PHAO_BOSSA_IMPROVED`). Kiểm hồi quy: `bossaRhythmOnly.test.ts`
  (11 onset, chi tiết tiếng 1–5 trên 12 giọng và ráp bài không mất tiếng),
  `caPhaoBossaSheet.test.ts`, `caPhaoBossaSections.test.ts` và `timelineLoop.test.ts`.
  Khi mở lại solo phải bổ sung kiểm so sánh đệm hát trước/sau qua nhiều take;
  không cập nhật kỳ vọng test theo một khung mới chưa được duyệt.

### Cách tạo và chỉnh mẫu

1. Chọn một câu lặp ổn định trong sheet, có ít nhất một lần lặp để đối chiếu;
   giữ nguyên một nguồn thay vì ghép từng ô từ nhiều bản.
2. Đọc MusicXML theo thời gian thực: nốt có thẻ `chord` là cùng onset, nốt nối
   (`tie`) là ngân chứ không phải tiếng gõ lại; xử lý cả `backup` và `forward`.
3. Tách vai trò: bass, hợp âm đỡ, giai điệu/rải và tiếng dẫn. Piano solo có thể
   trộn các vai trò trong cùng một tay, nên không được mặc định mọi nốt chồng là
   phần đệm.
4. Ghi mỗi sự kiện bằng bốn dữ liệu: vị trí bắt đầu, trường độ, âm lượng và
   chức năng hoà âm. Chỉ sau đó mới chuyển nốt sang bậc của hợp âm hiện tại để
   dùng cho bài khác.
5. Khi cần cải tiến để dễ hát, chỉ đổi một quan hệ nghe tại một thời điểm:
   hoặc onset, hoặc độ ngân/khoảng nghỉ, hoặc lực nhấn. Không vừa dời tiếng vào,
   vừa kéo dài nó, vừa thay bass, vì khi nghe tốt/xấu sẽ không biết lý do.
6. Nghe ở đúng BPM và cùng vòng hợp âm, lặp qua ranh giới đoạn. Test mã chỉ xác
   nhận lịch nốt, thời lượng, điều kiện bass dẫn và việc reset mẫu; nó không
   thể chứng minh groove nghe hay. Quyết định cuối là nghe của người chơi.

## CP Lick và CP Run — bộ soạn chính thức, người dùng duyệt 14/9/2026

Người dùng xác nhận **“bộ soạn CP Lick và CP Run đã ổn”** và yêu cầu lưu cách hoạt
động vào sổ tay và MD Cà Pháo. Đây là duyệt bộ fill/run hiện tại; không tự mở rộng
thành duyệt mọi solo dài, mọi giọng hoặc nguồn sheet chưa đủ bằng chứng.

### Nguồn câu và kỹ thuật

- Runtime: `src/reharm/licky/cpLick.ts`; corpus `cpPhrases.json` phiên bản 2;
  tái đo bằng `tools/cp_lick_corpus.py`, nguồn mặc định `D:/PianoBrain`.
- Đã đo 9 sheet đang hoạt động; xuất **697 mảnh** từ 7 sheet đủ điều kiện, trong
  đó **294 mảnh có `supportComplete`** trước các bộ lọc điệu/giọng/tầm tay. Các mảnh
  có thể chồng cửa nguồn; không gọi đây là 697 câu độc lập của Cà Pháo.
- Ballad lấy từ Hồng Kông 1, Có Em Chờ, Ngày mai em đi, Để Em Rời Xa, Chưa Bao Giờ,
  Chúng Ta Không Thuộc Về Nhau. Bossa lấy từ Người hãy quên em đi (D thứ).
  Kém duyên và Yêu xa đã đo nhưng chưa xuất câu vì còn thiếu xác nhận nguồn.
- Vốn thực hành: câu ngắn có khoảng thở, lệch phách, xen đơn nốt/chùm hợp âm,
  rải/chuyển quãng và nốt tiếp cận. Chọn cử chỉ có trong **đúng họ điệu**, không
  ghép run ballad vào bossa chỉ vì đủ số phách. Chưa đủ bằng chứng cho pedal,
  grace không trường độ hay mọi thủ pháp hòa âm thành luật tự động.
- `CP Run` là mảnh có ít nhất 4 attack đơn nốt ở tay chạy; chùm nhiều nốt cùng
  onset là hợp âm/fill, không tách thành run. Tay kia đi cùng phần hỗ trợ nguồn.

### Quy trình runtime để tái tạo

1. `planCpLicks` nhận hợp âm đã tái hòa âm và thời lượng thực, điệu, chủ âm/mode,
   timeline đệm, nhãn cuối dòng (`breaths`), nhãn có lời (`vocal`), mốc nối đoạn,
   yêu cầu thủ công `extraFills/extraRuns`, vị trí bỏ qua `skip`, số lượt `take`.
   Chưa có giọng trưởng/thứ hoặc nguồn đúng họ → không sinh, trả lý do. Chế độ
   `vocal === 'full'` không sinh kể cả có yêu cầu thủ công.
2. Chỉ chọn trên hợp âm chính. Tự động chọn cuối dòng lời hoặc mốc chuyển đoạn;
   không có nhãn lời thì lấy mỗi hợp âm chính thứ 4 làm gợi ý. Bỏ chỗ đang có lời,
   trừ yêu cầu thủ công; `skip` luôn được tôn trọng. Hai chỗ tự chọn cách nhau ít
   nhất 2 ô, tính từ cuối hợp âm chứa câu trước đến cuối hợp âm đang xét.
3. Cuối dòng thường chọn fill. Cuối đoạn ưu tiên run rồi mới thử fill nếu run
   không vừa. Người dùng yêu cầu CP Run thì chỉ tìm run, thiếu mẫu phải báo chỗ
   chưa chèn, không âm thầm đổi thành fill. Yêu cầu CP Lick thủ công chọn fill.
4. Lọc mảnh đúng họ điệu, số phách/ô và `supportComplete`; ưu tiên kho cùng mode.
   Chỉ khi kho cùng mode rỗng mới dùng mode kia và soạn lại nốt. Không có kho
   bossa trưởng riêng: bossa trưởng hiện là biên soạn lại từ nguồn thứ.
5. Xoay ứng viên bằng `abs(trunc(take)*37 + mainIndex*7) % pool.length`, lấy mảnh
   đầu đặt được. Cửa dài tối đa 2 phách và không dài hơn hợp âm đang xét. Tìm
   điểm vào từ cuối hợp âm lùi lại từng ¼ phách, không vượt hai phách cuối;
   `start % meter` phải trùng `source.offset % meter`. Giữ onset tương đối,
   khoảng nghỉ và gate từng nốt của cả hai tay; **không tăng BPM/nén run để nhét**.
6. `placeCpPhrase` chuyển cao độ tương đối theo chủ âm rồi dời nguyên cử chỉ
   theo octave vào LH 36–60 hoặc RH 60–84. Nếu vượt tầm thì bỏ ứng viên, không
   gấp riêng đỉnh câu. Với take chẵn, cùng mode, mọi nốt hợp gam/hợp âm và nốt
   đầu/cuối thuộc hợp âm, có thể chuyển nguyên nốt. Nếu không đủ điều kiện,
   chọn nốt gần hình nguồn: phách nguyên theo chord tone, phách lẻ theo hợp
   gam + nốt hợp âm; nốt cuối ưu tiên nốt chung với hợp âm kế, nếu có.
7. Màu hợp âm thật được ưu tiên: E7 trong Am vẫn có G#, bỏ G tự nhiên cạnh
   bậc ba trưởng; hợp âm thứ không lẫn bậc ba trưởng. Nốt approach nửa cung chỉ
   giữ khi nguồn có bước đó, đơn nốt, gate ≤¼ phách, ở phách lẻ, tới nốt hợp lệ
   kế tiếp cách ≤½ phách. Loại chùm bị soạn trùng phím và hai tay giữ/gõ cùng phím.
8. Trả **cùng một kế hoạch** gồm `events`, `backing`, `placements` (nguồn, cửa,
   vị trí, fill/run), `skipped`, `reason`. `ReharmHome.buildPass` lấy cả đệm và
   câu từ kế hoạch này; không ghép nốt take mới với cửa cắt đệm của take cũ.

### Phối đệm, giao diện và bảo toàn nhịp

Ngày 13/9 người dùng cho phép thay tiếng đệm **trong cửa fill/run/nối** theo
cách phối hai tay có trong sheet. Đây là ngoại lệ chính thức của điều cấm cũ:

- `cpBacking` thay đệm trong cửa nửa kín `[start, end)`. Nốt đệm bắt đầu trước
  cửa được nhả tại đầu cửa nếu đang ngân qua; nốt bắt đầu trong cửa bị thay
  bằng phần hai tay nguồn. Nếu nốt đệm giao cửa còn ngân vượt cuối cửa thì
  bỏ ứng viên. Không bịa cú gõ lại ở cuối cửa. Nguồn nghỉ tay nào thì giữ nghỉ.
- Giữ nguyên mọi event không giao cửa, tổng phách và BPM. Ngoài cửa CP,
  Bossa CP cải tiến giữ khung **11 tiếng/8 phách** đã duyệt, đầu đoạn hát mở
  lại nửa A. Không áp thêm `giveCompingToLeft`/`yieldToFill` của bộ cũ lên kế hoạch CP.
- Velocity câu chêm là 52, nhóm cuối 58: lựa chọn biên soạn KT, không phải
  lực đo từ audio nguồn. Không tự tăng lực hoặc sửa khung sau mốc duyệt này.
- Ô **CP Lick** mặc định tắt và lưu theo bài. Bật thì thay bộ fill/run cũ,
  chuột phải dùng **CP Lick / CP Run**; không dùng mật độ Licky/Kingsley.
  Tắt quay lại bộ cũ; riêng Bossa CP cải tiến tắt câu chêm, không tắt solo thứ.
- Lượt phát mới xoay nguồn/soạn nốt theo take; cùng dữ liệu + take tái tạo cùng
  kế hoạch. Lặp đoạn trong cùng lượt giữ cùng kế hoạch. Không bảo đảm vô hạn câu
  khác nhau nếu chỉ còn ít ứng viên vừa cửa. Solo dạo/giang/kết dùng bộ riêng.
- **Không soạn chỉ để cập nhật con trỏ/số nốt.** Giữ bản sửa `2a45131`: thống kê
  được memo hóa; tầm solo kể cả Trần 84 giữ tham chiếu ổn định. Lỗi tua nhanh/chậm
  trước đó do tính toán trên luồng giao diện gây gửi nốt trễ, không do khung
  11 tiếng. Không chữa lỗi hiệu năng bằng cách sửa tiết tấu hay tốc độ điệu.

Cuối dòng lời chỉ là vị trí nghỉ **ước lượng**, chưa có timestamp giọng hát.
Chưa có dữ liệu đúng điệu/đúng cửa thì báo thiếu; không coi mốc duyệt này là trả
lời cho [phiếu dữ liệu còn thiếu](PHIEU-HOI-CP-LICK-2026-09-13.md).
Bảng nguồn, số đo, lệnh tái tạo và kiểm hồi quy: [CP-LICK.md](CP-LICK.md).

## Quy trình rút điệu từ sheet cho các thầy và các điệu khác

1. **Xác định corpus.** Ghi rõ tên bài, thầy, điệu được giả định, file nguồn,
   số ô dùng và số ô đối chiếu. Đừng suy nhãn điệu từ tên file hay một bài duy
   nhất; đối chiếu toàn bộ sheet liên quan trước khi kết luận.
2. **Đo thay vì nhìn.** Chuyển sheet thành timeline theo phách; giữ voice/hand,
   onset, duration, tie, nghỉ, velocity nếu có và ranh giới hợp âm. Một thống
   kê nốt chung không đủ để nói lên tiết tấu.
3. **Tìm đơn vị lặp.** So sánh các ô có cùng vai trò hoà âm để tìm cell 1, 2
   hoặc nhiều ô. Giữ các nửa câu khác nhau nếu chúng thực sự khác; không lấy
   trung bình làm mất câu hỏi–đáp, nhấn–nhả.
4. **Tách cấu trúc khỏi chất liệu.** Khung giữ nhịp, vị trí bass/chát, mật độ,
   khoảng nghỉ và điểm nhấn. Chất liệu là bậc nốt, voicing, chromatic approach
   và cách nối hợp âm. Khi chuyển tông, chuyển chất liệu theo bậc/chức năng,
   không bê cao độ tuyệt đối.
5. **Chỉ khái quát điều đã có bằng chứng.** Một thủ pháp xuất hiện ở một đoạn
   là candidate; chỉ biến thành luật mặc định khi có lặp lại hoặc được người
   dùng duyệt như một lựa chọn biên soạn. Ghi nguồn/candidate/biên soạn thành
   ba nhãn riêng.
6. **Kiểm bằng tai lẫn test.** Nghe liên tục qua nhiều câu, nhiều vòng và đầu
   đoạn; test dữ liệu phải kiểm timeline, tổng phách, hợp âm đích và các điều
   kiện biên. Nếu hai điều mâu thuẫn, điều tra lại phép đo hoặc giả định, không
   dùng test xanh để khẳng định nhạc hay.
