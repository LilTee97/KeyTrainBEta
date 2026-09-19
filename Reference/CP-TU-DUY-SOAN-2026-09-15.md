# Tư duy soạn Cà Pháo — bản triển khai nghe thử 15/9/2026

## Yêu cầu và trạng thái

Chọn **màu hợp âm Cà Pháo** phải dùng CP Lick/Run thay hoàn toàn Licky, đồng
thời soạn solo thường/full bằng hòa âm, giai điệu và tiết tấu được phát triển
từ sheet. Đây là **bộ luật biên soạn hữu hạn của KT**, không phải mô hình đã
học đầy đủ tư duy cá nhân của nghệ sĩ. Chưa được người dùng duyệt bằng tai.

Mã: `style/cpComposition.ts`, gọi từ `buildPhraseSection`. Chọn màu CP
mặc định dùng **Soạn câu mới**, có lựa chọn **Mô phỏng nguyên câu sheet** riêng.
CP Lick là `intensity === 'caPhao' || cpLickSelected`: màu CP luôn thay Licky,
kể cả bài lưu cũ có `cpLick:false`. Đổi màu/cách tạo solo sẽ dừng phát.
Chế độ solo được lưu vào snapshot bằng `caPhaoSoloMode`.

## Nguồn và cách đọc bằng chứng

Đã chạy `python -X utf8 tools/cp_full_solos.py --check`: so lại kho runtime
với **9 sheet MusicXML gốc** qua bộ đọc onset/tie/voice, không chỉ đọc tên hợp âm.
Có **21 đoạn intro/giang/outro của 7 sheet** đủ xác nhận giọng. Kém duyên và
Yêu xa vẫn thiếu xác nhận giọng/điểm chuyển giọng; đã gửi phiếu hỏi, không dùng
nốt hai sheet đó để đoán mode. Nguồn chi tiết và SHA nằm trong
`caPhaoFullSolos.json.inventory`. Không ghi vào PianoBrain, không xóa kho gốc.

Các nhãn kỹ thuật dưới đây do phép đo hình học của kho gắn, đếm theo đoạn và
độ phủ bài; **không phải số lần biểu diễn thủ pháp** và không chứng minh tính
độc quyền của Cà Pháo:

| Dấu hiệu đo được | Đoạn có dấu hiệu / 21 | Bài có dấu hiệu / 7 |
| --- | ---: | ---: |
| Nối hai cao độ cách bán cung | 20 | 7 |
| Chuyển quãng/rải | 21 | 7 |
| Chùm hợp âm trong câu | 21 | 7 |
| Dịch vùng âm | 19 | 7 |
| Chia nhỏ phách | 21 | 7 |
| Nốt lệch phách | 21 | 7 |
| Khoảng thở | 20 | 7 |

Đây là vốn ưu tiên có bằng chứng lặp lại. Không hiểu mọi bán cung là nốt
láy, mọi quãng nhảy là rải hợp âm, hoặc mọi nốt lệch phách là cùng một groove.
Runtime cân bằng **bài trước, cell sau**, tránh một giang dài lấn át các bài ngắn.

### Trưởng và thứ không dùng chung một bảng màu

Thống kê thời lượng hòa âm ở 21 đoạn (đơn vị phách, không phải số ký hiệu):

- Trưởng (9 đoạn/3 bài): I trưởng trơn 84,33; V trưởng trơn 37,5;
  IVmaj7 33,5; IV 24,75; vim7 23,5; iim7 20; Imaj7 16.
- Thứ (12 đoạn/4 bài): im7 87; bVI trưởng 43,5; bVII trưởng 40,5;
  vm7 29; i thứ trơn 28; im9 20; im11 19,5; ivm7 16; ivm11 12.

Không suy “thứ luôn dùng V7”: Ballad có v thứ trong nguồn, còn cụm dẫn rõ
chức năng có thể dùng V7. Không suy “trưởng luôn maj7”: I trưởng trơn vẫn
có thời lượng lớn. Giữ màu/slash người dùng đã ghi ở **phần hát**; nhánh
`caPhaoHarmony.ts` tiếp tục quyết định màu đệm theo bậc, chức năng và điệu.
Không ngẫu nhiên đổi vòng phần hát mỗi lần phát khi chưa có yêu cầu đó.

Chọn nốt solo: nguồn contour đúng mode, nốt phách mạnh/đáp theo hợp âm đang
vang, nốt chuyển theo gam cộng tension hợp lệ; tránh b3/3 đối nhau. Nốt tiếp
cận bán cung ngắn chỉ hợp lệ khi có nốt giải liền sau. Không dùng thống kê
pitch-class chung để rải ngẫu nhiên: cách nối và điểm đáp quan trọng hơn
một nốt có xuất hiện nhiều hay ít trong toàn bài.

## Hai đường tách biệt — sửa theo phản hồi mới nhất

Đã bỏ bản nháp lấy câu Người hãy quên làm nền rồi thay các ô xen kẽ.
Không gọi cách ghép ấy là “soạn mới”.

### Soạn câu mới

1. Tạo kế hoạch vai trò trước: hỏi → đáp → phát triển/chạy → nhắc mô-típ →
   dẫn/kết. Đây là diễn giải biên soạn của KT, không phải thống kê chứng minh
   mọi câu của nghệ sĩ đều theo một hình thức đó.
2. Tạo mô-típ ngắn từ phân bố hướng/quãng chuyển của những ô đủ dữ liệu
   **cùng màu giọng**. Không chép một dãy cao độ hay một bar nguồn.
3. Soạn đường hợp âm bằng các chuyển bậc quan sát giữa hợp âm nguồn.
   Loại bậc ngoài mode, chọn chất hợp âm hợp gam; ii thứ dùng iiø.
   Hai ô cuối intro/giang đi ii–V về hợp âm thực của đoạn kế; outro V–i/I.
4. Dựng tiết tấu mới trên lưới điệu đích từ phân bố chia phách nguồn cùng
   điệu, có thở sau câu đáp/nhắc; không nhập nguyên onset Ballad vào Bossa.
   Chạy .25 phách ở full, .5 ở thường. Không đổi BPM hay nén cả đoạn.
5. Soạn nốt theo mô-típ, hướng đi/phản hồi và hợp âm mới: điểm mạnh/đáp
   ưu tiên chord tone, nốt chuyển theo gam+tension; cặp nốt theo đặc trưng
   chùm của nguồn. Bán cung là pickup có giải liền sau. Run đổi hướng
   khi tới mép tầm, không bỏ nốt vượt tầm rồi giả làm giữ nguyên đường chạy.
6. Tay trái dựng từ chính điệu đang chọn; bỏ lớp đệm RH bên dưới solo để
   không đè giai điệu. Đặt lại quãng LH trong tầm đàn, ưu tiên ít va chạm.
7. Cùng seed tái tạo cùng câu; lượt phát khác đổi hợp âm, mô-típ và nhịp.
   Độ dài không đổi trong các lần lặp của một bài để giữ mốc seek/đoạn.
   Thường: dạo/kết 16 phách, giang 24. Full: lấy ngân sách độ dài lớn nhất
   quan sát cho loại đoạn/điệu/mode, làm tròn theo 8 phách, tối thiểu 32.
   Chỉ dùng **con số độ dài**, không mượn bố cục ô, hòa âm hoặc nốt của câu nguồn.
8. Bossa trưởng lấy vốn quãng/chất hợp âm từ nguồn trưởng, tiết tấu từ
   nguồn Bossa; không chuyển một câu Bossa thứ làm khung nền.

`sourcePhrase.id = cp-original`; `compositionSources` ghi vai trò và loại
phân bố dùng ở từng ô, không giả gắn câu mới với một ô nguyên văn trong sheet.

### Mô phỏng nguyên câu sheet

- Chỉ nguồn **cùng họ điệu và cùng mode**; chưa có chuyển toàn câu chéo
  điệu đáng tin cậy thì báo thiếu nguồn. Bossa trưởng không mượn sheet thứ.
- Dùng cả đoạn nguồn, cả hai tay, không đổi theo take, không ghép thêm đoạn.
  Full tự bật và khóa vì không thể vừa “nguyên câu” vừa rút ngắn.
- Chuyển tone theo tonic đích; đặt lại quãng theo tầm đàn khi cần.
  Giữ nhịp/tie/grace và giai điệu nguồn. BPM theo bài, không nhập rubato.
- Theo yêu cầu mới “giữ nguyên câu”, nhánh này **không thay pickup cuối
  Bossa bằng câu dẫn mới**, cũng không sửa kết chuyển trưởng của outro.
  UI nêu rõ ngoại lệ giữ màu kết nguồn. Nhánh Soạn mới vẫn dẫn về đoạn kế.
- `writtenHarmony` giữ hòa âm trước bước đổi kết trưởng sang thứ của
  công cụ xuất kho. Không sửa/xóa bản gốc; đường solo cũ không chọn
  hai chế độ này vẫn giữ hành vi đã có.
- Nguồn từ 9 sheet nhưng chỉ 7 sheet đủ xác nhận mode được phát. Không
  đoán nốt của hai sheet còn thiếu xác nhận.

## Ranh giới và kiểm chứng

- Khung đệm hát Bossa 11 tiếng/8 phách và BPM không đổi. CP Lick/Run chỉ
  thay hai tay trong các cửa đã cho phép, không chỉnh cả bài.
- Kỹ thuật nhận diện bằng hình học không đồng nghĩa hiểu trọn tư duy
  nghệ sĩ. Chưa suy pedal, ngón tay hay rubato cá nhân từ dữ liệu này.
- Bộ soạn mới còn là bộ quy tắc hữu hạn cần nghe duyệt, không khẳng định
  sinh vô hạn câu độc nhất hoặc đã có đủ độ tinh tế của tất cả bản gốc.
- Test: mode/tầm trong 12 giọng, thời gian không âm/không tràn, khác cả
  đường gốc hợp âm/timing/nốt, không còn nền archive, mô phỏng bất biến
  theo take, dẫn đúng đích và bảo toàn test khung 11 tiếng.
- Lệnh: `npm test -- cpComposition cpLick caPhaoFullSolo caPhaoBossaRestored bossaRhythmOnly`
  và `python -X utf8 tools/cp_full_solos.py --check`, `npm run build`.

Chưa duyệt bằng tai. Chưa ghi chính thức vào SO-TAY/CA-PHAO; nhắc người dùng
ghi lại sau khi nghe đạt. Chưa commit.

## Lượt sửa theo phản hồi: câu Bossa bị đứt giữa hợp âm (15/9)

Phần này thay mô tả sinh RH Bossa ở trên; không sửa nhánh Ballad, mô phỏng
nguyên câu, CP Lick/Run hoặc khung đệm hát.

Nguyên nhân trong bản bị chê: dừng RH ở phách 3/3.5 gần mọi ô; chặn bước
nhịp nhỏ hơn .5 ngoài run; reset mô-típ mỗi ô; chọn nốt tham lam gần nhất.
Kho cell một ô còn loại tie/grace/tuplet, gây thiên lệch về câu rời.

Đo lại toàn đoạn Bossa từ kho đã so MusicXML gốc, trước pickup lời hát:
intro có 53 cú RH, 8 lần đổi hợp âm không có khe hở, 4 lần ngân qua đổi;
giang có 44 cú RH, đa số nối liên tục nhưng có chỗ thở .75/1 phách.
Vì vậy không kết luận sheet không bao giờ nghỉ, cũng không áp khoảng nghỉ
tự động ở mọi hợp âm. Giá trị đo là onset/gate ký âm, không phải audio.

Bossa Soạn mới hiện dùng `composeBossaLine` ngay trong bộ soạn hiện có:

- Học chuyển tiếp trường độ cục bộ có điều kiện theo vị trí phách và bước
  trước, từ cả những attack có ngân xuyên ô; không dán nguyên một ô nhạc.
- Dựng một timeline RH liên tục, không reset ở mỗi hợp âm. Chùm 4 nốt trong
  một phách; full có thêm chùm ba nguyên phách. Chỗ thở tối đa .2 phách chỉ
  ở cuối nhóm câu, không ở mọi lần đổi hợp âm. Đây là giới hạn KT nghe thử.
- Mô-típ mới lấy vốn hướng/quãng cùng mode; giữ ngữ cảnh qua nhiều ô,
  phát triển và đáp đảo hướng. Dùng beam 12 ứng viên để chọn cả tuyến nốt:
  đích hợp âm, quãng nhảy có hồi đáp, vùng âm có cao trào, tránh 3 nốt cùng
  cao độ liên tiếp và vòng ABAB. Không coi các giới hạn này là luật cấm
  mô-típ lặp trong mọi tác phẩm, chỉ chống lỗi mắc vòng của bộ soạn.
- Nốt dài/phách chính ưu tiên chord tone. Ngân qua đổi hợp âm chỉ khi
  tương thích; nếu không có nốt nối thì đánh nốt giải ngay tại mốc đổi,
  không chèn im lặng. Cặp/chùm RH dùng nốt hợp âm thực, không gắn bừa quãng 3.
- Pickup bán cung ở chùm chạy phải giải ngay, không gây vòng lặp hoặc quãng
  nhảy quá tầm. Thuật toán dùng lưới phách chung, không thay BPM.

Test mới kiểm 192 trường hợp Bossa (thường/full × 3 loại × trưởng/thứ ×
16 takes): khe chuyển hợp âm không quá .201 phách, mật độ có giới hạn,
không mắc nốt/vòng hai nốt, có sustain xuyên hợp âm, cặp nốt và chùm ba.
Các kiểm tra 12 giọng/tầm đàn/soạn khác giữa lượt và nguồn nguyên câu vẫn giữ.
Đây là tiêu chí kiểm chứng cấu trúc, chưa chứng minh câu hay như nghệ sĩ.
Chờ người dùng nghe duyệt một lượt trước khi điều chỉnh tiếp.

## 16/9 — phản hồi nghe, nốt giọng thứ, dặm và tua (chưa duyệt tai)

Đã dùng skill y-kien-intro chuyển 11 câu trong cửa sổ UTC 01:39:23–02:09:23
sang `D:/PianoBrain/knowledge/teachers/ca-phao.md`: 6 mẫu ổn, 5 chưa ổn;
10 bộ nhận xét–hợp âm/bậc–nốt P đầy đủ, một câu chỉ tick (#1009).
Các phản hồi có lời là #1005 (Bm7 lệch), #1008 (D, lượt thứ hai), #1011–1012
(quá nhiều dặm). Sổ thô chưa phân biệt doan; #1008 không đủ chứng minh
câu lưu chính là giang lượt hai được nhắc. Không tự gán nhãn hay tráo câu.

Sau bản giảm dặm đầu tiên, người dùng yêu cầu **thêm lại dặm vừa phải**,
cho phép bè trái vượt giai điệu khi có nguồn. Bản giới hạn 20%/cách 4 phách
đã được thay thế; không lấy nó làm quyết định đã duyệt.

Đo lại dữ liệu solo đã trích từ sheet:

| Bossa, trước pickup lời | Attack P | Attack nhiều nốt |
| --- | --- | --- |
| Intro | 53 | 10 |
| Giang | 44 | 26 |
| Outro | 25 | 15 |

Chỉ thấy một attack T vượt đỉnh P trong tập solo thứ đang có: intro Bossa
beat 9.5, T chuẩn hóa [55,60,63], P [62]. Đây là bè trong b3 vượt nốt 9,
không phải bằng chứng cho phép cả bè bass nhảy lên mấy quãng tám.

Thay đổi trong bộ soạn hiện có `cpComposition.ts`:

- Không dùng `scaleTones` dành cho **dò giọng** để cấp nốt: hàm đó tính cả
  bậc 7 tự nhiên và nâng của giọng thứ. Nay lấy gam tự nhiên rồi thêm nốt
  của hợp âm cục bộ; pickup chromatic chỉ ngắn, yếu, giải vào cùng hợp âm.
- Mô-típ học từ cụm 4 attack liên tiếp cùng mode (không lấy nốt lời/kết
  chuyển trưởng), thay cho bốc từng quãng rời. Nốt đích có trọng số theo
  màu xuất hiện trên hợp âm cùng loại trong sheet; tránh giữ nốt màu cọ
  bán cung ngay trên nốt của hợp âm ba nếu nó không thuộc hòa âm đang chơi.
- Thêm cụm tiết tấu 2 phách có liên kết từ **Bossa**, đặt đúng phase;
  vẫn soạn timeline mới, không dùng nguyên một câu sheet làm nền. Chất
  liệu đường nét Ballad chỉ theo quyền chuyển kỹ thuật đã có; không đem
  lưới nhịp Ballad sang Bossa.
- Dặm đặt trên mốc chát của điệu đang chọn, cách ít nhất 1.5 phách, tối đa
  30% attack intro / 40% giang–kết; tối đa 3 nốt/chùm. Đây là **trần KT
  nghe thử**, không phải tần suất thầy đo được. Run vẫn đơn nốt.
- Bè trầm giữ thấp và trong tầm đàn. Ngoại lệ trên đúng minor + nốt 9:
  bè trong b3 có thể đáp phía trên P, tối đa một lần ở intro, dài <=.5
  phách; bass gốc không nhảy lên. Không biến thủ pháp hiếm thành nền mặc định.

Sửa luồng phát trong `ReharmHome.tsx`: chỉ ba nút Phát trọn bài / play-all
mới yêu cầu soạn. Chord seek dùng nguyên events, hợp âm, tổng phách và
segment-map của lượt thật; không tăng seed, không ghi câu mới vào Nguon,
không advance round. Vòng tự lặp giữ nguyên bản đã soạn. Dùng chung lịch
audio cũ, không thêm engine/cache tầng hai.

Kiểm chứng: 81 test liên quan qua, build production và lint hai file
composer/test qua. UI trong phiên riêng, bài thử Em (thư viện phiên thử
không có bài mặc định của skill): hai lần tua solo/đệm giữ hợp âm và ID
#1028–1030, không tăng lanPhat; bấm Phát trọn bài tiếp tạo #1031–1033,
vòng và nốt thay đổi. Đã dừng phát thử. Không đổi khung đệm hát, CP Lick,
hay chế độ mô phỏng nguyên sheet; chưa commit, chưa chốt hay bằng test.

### Vòng nghe tiếp — giang vẫn chưa nghe rõ dặm

Người dùng xác nhận giai điệu tạm được nhưng chưa hay, yêu cầu train thêm
trưởng/thứ riêng và tăng dặm **riêng giang**. Các mẫu giang gần nhất có
4–8 chùm >=3 nốt trong 8 ô nhưng rải lẻ tẻ. Đã bỏ cách chờ nốt dài ngẫu
nhiên rồi mới thêm bè trong cho giang:

- Mỗi câu 2 ô của giang có một ô đáp bằng hợp âm, ô còn lại đi giai điệu/run.
  Vị trí ô đáp thay đổi theo take; không dùng cả câu sheet làm nền. Mốc
  dặm theo ô A: 1,2.5,3.5 hoặc ô B: 4.5,6,7 (offset từ 0 trong 8 phách).
- **3 cú dặm ba nốt / 2 ô**, lực 82; giang gọn 6 ô có 9, full 8 ô có 12.
  Hai cú gần nhau có thể cách 1 phách như tiếng 10–11 của khung chính thức.
  Chừa tầm phía dưới đường giai điệu để không biến cú dặm thành một nốt
  đơn/cặp nốt. Các trần 40% và cách 1.5 phách ở mục trên không áp cho cụm
  dặm giang mới này. Intro/outro giữ giới hạn lượt sửa trước.
- Nốt giai điệu học thêm cặp chuyển tiếp nốt trước–sau, hướng đi và loại
  hợp âm cục bộ; xét riêng nguồn cùng mode, không dùng tần suất nốt đơn
  như toàn bộ tư duy câu. Minor dùng bốn bài xác nhận; major ba bài xác
  nhận; hai sheet chưa xác nhận không làm nguồn nốt. Đây vẫn là mô hình
  biên soạn hữu hạn trong KT, không phải tuyên bố tái tạo đầy đủ tư duy thầy.
- Không dựng lại preview CP qua setInterludeDisplayTake ngay sau khi audio
  bắt đầu: CP đọc soloSpans của bản đang phát, tránh thêm một lượt tính
  câu nhạc trên luồng giao diện khi tiếng vừa vào.

Test mở rộng kiểm đủ 3 chùm ba nốt mỗi 8 phách, mốc nhấn, lực, tầm đàn,
giọng trưởng/thứ và vẫn kiểm không gãy câu/loop nốt. Khung hát không sửa.
Bản này tiếp tục **chờ nghe**, không tự coi test qua là đã hay.

### 17/9 — phối hợp hai tay và chủ đích kỹ thuật (đang nghe thử)

Phản hồi mới: bass mất nét giật, phối tay máy móc, các câu đã tick ổn từ
#1077 vẫn thiếu đa dạng đường chạy. Đọc lại Nguon: #1077, #1078, #1079,
#1081, #1082 có tick `on`; **cả năm đều có LH đánh mới ở đầu cả 8 ô**.
Không xem tick này là duyệt toàn bộ lối phối. Dữ liệu cũ chưa có cột `doan`,
tên đều ghi `(intro)`, vì vậy không tự suy tất cả thật sự là intro.

Nguyên nhân trong `cpComposition.ts`:

- Trước vòng này LH còn dùng `renderPattern` của điệu đệm hát, RH được soạn
  riêng. Tiếp đó cách chọn mẫu hai tay loại mọi ô không có LH ở phách 0,
  vô tình giữ lại thiên kiến bass luôn gõ đầu ô. Đã bỏ cả hai cơ chế đó.
- Burst RH từng dùng một công thức hướng chạy × `(4,2,2,4)`; lặp mô-típ
  ba quãng càng làm các lần soạn khác nốt nhưng giống đường nét.
- Advanced 8–12 nốt nằm ở **CP Run chuyển đoạn**, không phải bộ solo.
  Không sửa CP Lick/Run đã duyệt để chữa lỗi phối tay của solo.

Nguồn và giới hạn: đối chiếu inventory 9 sheet; 21 đoạn solo từ 7 sheet đã
xác nhận giọng. Kém duyên/Yêu xa vẫn `needs-key-confirmation`, không dùng
làm nguồn nốt. Đây là luật biên soạn dựa trên số đo, không phải tuyên bố
đã tái tạo toàn bộ tư duy hoặc chủ đích thực sự của nhạc sĩ.

Thay đổi trong cùng bộ soạn, không thêm engine:

1. `cpHandCells` đo LH/RH cùng ô, onset, gate từng nốt, staccato, vị trí
   trong đoạn, phần LH ngân từ ô trước. Cho phép bass vào trễ hoặc không
   có attack mới. Bass được soạn lại theo chức năng hợp âm hiện tại,
   giữ octave khi vừa tầm, giữ chromatic bass nếu có đích giải liền kề.
   Không tự thêm bass đầu ô; chỉ nối ngân qua vạch khi nốt cũ hợp hợp âm
   mới và không va giai điệu. Bass solo lực 66–72; không đổi volume đệm hát.
2. Khôi phục thủ pháp outro Người hãy quên em đi, beat 4–8:
   `bII9 (2 phách) → V7b13 (2 phách)`. LH onset tương đối
   `0, 1.5, 2, 3.5`, gate `1.5, .5, 1.5, .5`; RH onset
   `.5, 1.25, 2, 3`, gate `.25, .125, 1, 1` (đã tính staccato).
   Nốt và voicing mới theo giọng/tầm đàn, không chép cả câu nguồn. Dùng
   ở cadence đích thứ, không nhét b13 thứ vào đích trưởng. Trong Am là
   A#9/Bb9 → E7b13; trong sheet Dm là Eb9 → A7b13.
3. `cpRunShapes` học quãng liên tiếp 4/6/8/10/12 attack từ nguồn **cùng
   mode**, bỏ đoạn đổi màu song song và nốt pickup lời hát. Phân loại
   đo được: liền bậc, rải hợp âm, một lần đổi hướng, đan hướng. Bossa
   tự dựng thời gian (.25 phách hoặc bộ ba vừa ô), không mang lưới Ballad
   sang. Không lặp cùng contour trong một solo, ưu tiên đổi họ contour.
   Beam search bám đường nét này nhưng vẫn chọn nốt theo hợp âm/giọng;
   cho quãng nhảy tối đa octave trong run, không ép tất cả thành liền bậc.
4. Kế hoạch phát triển dùng tần suất và vị trí tương đối của đoạn chạy/
   đoạn dặm trong solo Bossa nguồn để phân bổ phần mở, phát triển, đáp,
   cadence. Intro chủ yếu tuyến giai điệu; giang/kết có phần đối đáp hợp
   âm rõ. **Bỏ định mức cũ ba cú dặm mỗi hai ô**: không ép dặm vào giữa
   phần đang phát triển run. Cụm dặm giữ nhả/nghỉ hai tay nguồn, tối đa
   bốn nốt nếu tầm đàn đủ; khu vực chạy vẫn đơn tuyến.
5. Tay trái dưới run chọn phần giữ/nghỉ thưa, vào trễ, hoặc bàn giao:
   tay trái chạy trước, ngừng, tay phải tiếp. Mẫu bàn giao ở outro beat
   16–20 chỉ cung cấp **phân vai/thời gian/chức năng LH**; phần giai điệu
   đổi trưởng trong sheet không đưa vào nguồn nốt giọng thứ. Kết giữ
   bass chủ âm, không tiếp tục gõ mẫu máy móc dưới nốt chốt.

Giữ nguyên: mô phỏng nguyên sheet; khung hát 11 tiếng; CP Lick/CP Run;
chỉ Phát trọn bài mới đổi take. Cả bản gọn/full nhận cách phối mới;
full vẫn xét tầm đàn, không mặc định 88 phím. Mức “biểu diễn” là tên
biên soạn trong KT, không phải chứng nhận cấp độ piano chuẩn hóa.

Kiểm hồi quy bổ sung: đủ bass/gate turnaround ở 12 giọng thứ và tầm
37/61 phím; mô phỏng giữ nguyên bass gốc; bốn họ contour thực sự xuất
hiện và hơn 30 đường chạy MIDI khác nhau trong tập thử cố định; có bass
vào trễ, bass ngân dưới run và RH chạy khi LH đã nghỉ. Test vẫn kiểm
trưởng/thứ, giới hạn phím, nhịp, khác take và không tái soạn khi tua.
Chưa chốt bằng tai; chưa ghi đè sổ tay hay bảng khung đã duyệt.

### Phản hồi #1096 và #1116 — 17/9, 12:03–12:10 (UTC+7)

Đã chuyển nguyên hai bình luận, vòng ký hiệu/bậc và toàn bộ timeline hai
tay sang `PianoBrain/knowledge/teachers/ca-phao.md`. Người dùng nhớ khoảng
12h30 và cho phép bỏ cửa 30 phút; giờ thật trong sổ là 12:03/12:10.
Không có mẫu Đã ổn mới trong cửa hồi cứu này; không đổi Nguon.json.

- #1096: cùng cụm dặm chùm ba lặp ở ô 2, 3, 5. Chọn cụm theo signature
  hai tay không hoàn lại; mỗi solo không lặp nguyên cụm nổi bật. Giữa hai
  ô dặm có tối thiểu một ô tuyến giai điệu/run (cách đầu ô >=8 phách), kể
  cả phần kết dẫn đã dành trước. Đây là giới hạn KT theo phản hồi, không
  phải tuyên bố tần suất cố định của thầy. Không cấm lặp nốt bên trong
  một cú dặm đúng dụng ý.
- #1116: giữ nền intro thuộc nguồn intro thay vì chờ bass ở phách 2 như
  mẫu outro. Ô chủ âm mở có LH 0/1.5/2, gate 1.5/.5/2 (thủ pháp Am11
  được khen); ô nền khác chọn 0/1.5 giữ bass/bè trong hoặc 0/1.5/2. Ô
  chạy có thể vào bass trễ; bàn giao LH chạy rồi nghỉ cho RH tối đa một
  lần trong một solo, không lặp ở nhiều ô như câu bị chê.
- Việc chọn nền LH không được cắt câu RH tại mỗi đầu ô: chỉ ranh cụm
  hai tay hoặc run chủ đích mới ràng buộc các slot giai điệu. Giữ nốt
  chung ngân qua chuyển hòa âm, chỉ giải nốt khi cần.

Chỉ sửa solo soạn mới, không đổi bản mô phỏng sheet, CP Lick/Run hoặc
khung đệm hát 11 tiếng. Tiếp tục chờ người dùng nghe, chưa commit.
