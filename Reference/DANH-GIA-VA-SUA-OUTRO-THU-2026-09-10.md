# Đánh giá phương pháp và vòng sửa outro thứ — 10/09/2026

## Kết luận thẳng

Claude đã sửa đúng cổng đưa điệu Bolero Tuấn vào outro và đã nhận ra cần giữ nguồn.
Nhưng `PHUONG-PHAP-SOAN-OUTRO.md` mô tả mức hoàn thiện cao hơn mã thực tế: trước lượt
này, câu vẫn có thể lệch nguồn hoà âm/giai điệu, quay vòng nguồn, mất nghỉ, bị đảo
onset và bị gập từng nốt. Không thể gọi đó là đã học đúng cách soạn outro.

Tôi cũng có trách nhiệm: hướng dẫn cũ của Codex thiếu hợp đồng dữ liệu xuyên suốt,
quá cứng về lưới onset, và chưa phân biệt đủ rõ **chuyển soạn câu nguồn** với **tự
sáng tác từ kiến thức rút ra từ nguồn**. Không thể chỉ yêu cầu Claude “đóng vai
Codex” rồi coi chất lượng sẽ tự được bảo đảm.

Đã sửa một vòng thử nghiệm trong `D:/KeyTrain`, không đổi đường intro/giang tấu.
Chưa commit, chưa có xác nhận nghe “Đã ổn”. Không sửa PianoBrain, không sửa tay
`tuyenSolo.ts`, không xóa câu/bình luận/bài đã lưu.

## 1. Những sai lệch đã đối chiếu với mã

| Vấn đề trước lượt sửa | Thực tế và xử lý lượt này |
|---|---|
| Chọn đúng điệu | Giữ sửa cổng UI của Claude: outro Tuấn nhận style Tuấn, không style solo Linh Nhi thay thế. |
| Giữ một nguồn | Trước đây vòng hợp âm thử nguồn khác khi không khớp, giai điệu vẫn chọn theo take ban đầu. Nay `planMinorOutro` chọn một lần; cả hai dùng cùng kế hoạch. |
| Giữ thứ tự nguồn | Cửa sổ cũ dùng modulo nên quay từ cuối về đầu; `locO` còn bỏ ô nghỉ. Nhánh mới lấy slice liên tiếp, giữ ô rỗng, không kéo dài bằng lặp nguồn. |
| Hoà âm theo chức năng | Kiểm cả root và các thành phần hợp âm cơ bản, không chỉ root. Không có ứng viên thì báo không sinh được; không thay bằng “bậc gần nhất”. |
| Tiết tấu | Bỏ ép giai điệu vào bảy mốc của cell: greedy nearest-free có thể đảo thứ tự nốt. Câu nguồn Bolero giữ onset/chia nhỏ phách; phần đệm giữ cell Tuấn. |
| Cú pháp outro | Nhánh mới không chạy lịch ô A/B và `chenChay` của intro. Chọn tiểu cú đã về i, giữ đường nốt; Pắp chỉ trả lời trong khoảng nghỉ, không thay cả ô solo. |
| Tầm đàn/hậu xử lý | Không chạy các bước nâng từng ô, gập từng nốt, nâng nửa cuối, xóa nốt theo mật độ hoặc đổi nốt cuối bằng `dapChot`. Chỉ chuyển chủ âm và dời quãng tám cả tiểu cú. |
| Kết bài | Chọn hợp âm cuối i và nốt giai điệu cuối thuộc 1/b3/5; giữ phách chốt vốn có. `slowClose` chỉ thay trường độ/lực, KHÔNG phải ritardando vì không đổi onset. |
| Kiểm chứng | Thêm kiểm nguồn, slice liên tiếp, khoảng nghỉ, onset, quãng, tầm thực tế 62–79, mốc chia hợp âm, chủ âm, pulse sau ráp và tình huống không có ứng viên. |

Phát hiện thêm: `soloLeftHand` khởi động mẫu lại theo từng hợp âm. Khi hợp âm đổi
ở phách 2,5, điều này làm lệch pha nhịp. Nhánh mới dùng `renderPattern` có sẵn để
giữ pha cell trên toàn đoạn, tra hợp âm đang vang tại từng mốc gõ.

## 2. Dữ liệu sheet không phải mặc nhiên là chân lý sạch

Đã đọc lại MusicXML qua các bộ đọc hiện có của PianoBrain và đối chiếu bảng TS.

- **Đừng Xa Em Đêm Nay:** bộ đọc trả ô 82 dài 6 phách. `tuyen_o.py` lấy số phách
  phổ biến của đoạn là 4 rồi loại nốt có offset từ 4 trở đi. Bảng `o` không giữ
  độ dài thật từng ô. Ký hiệu `Edim` còn bị rút về nhãn `m`, mất quãng năm giảm.
  Tạm loại nguồn outro này khỏi vòng kiểm chứng, không suy rộng rằng toàn sheet sai.
- **Nỗi Buồn Hoa Phượng:** outro có ô 71–73 dài 8 phách và các ô sau dài 4.
  Phải dùng `o4`, không dùng `o` đã cắt phần nửa sau. Mốc người dùng xác nhận
  outro thực sự bắt đầu ở ô 71 phách 4; nửa đầu ô là mô phỏng lời hát, không
  lấy vào câu học. Bảng `o4` giữ được mốc này.
- **Rừng Lá Thấp:** ký hiệu cuối đọc được là Dm7, trong khi giọng Am. Không được
  tự gọi đó là kết trên chủ âm chỉ vì nốt cuối E là bậc 5 của giọng. Nếu muốn
  dùng toàn đuôi này làm khuôn kết i, phải phân tích lại hoà âm/biên đoạn.
- Bảng TS hiện chưa ghi chất hợp âm thứ hai của ô chia. Kế hoạch mới chỉ nhận
  khi trong cùng nguồn có một chất duy nhất cho bậc đó; trường hợp mơ hồ bị loại.
  Đây vẫn là giới hạn dữ liệu, không thay thế việc bổ sung chất chính xác từ XML.

Chưa sửa bộ trích xuất trên toàn kho trong lượt này: thay nó có thể đổi cả intro
đã được người dùng duyệt. Cần vòng sửa dữ liệu riêng với test hồi quy các câu đã ổn.

## 3. Học từ solo thứ của ba thầy: điều cần học và điều không được suy diễn

Đã đối chiếu tuyến intro/interlude đại diện và chạy lại `boi_so.py`, `ket_thu.py`.
Các số đo là dữ liệu quan sát, không phải điểm “hay” và không thay cho nghe.

### Linh Nhi — Nỗi Buồn Hoa Phượng

Outro có cách nhắc nốt, đáp lại, ngân và đi về chủ: `iv → bVII → bVI → i`.
Không phải mọi outro thứ đều bắt buộc đi V7–i. Trong intro, tuyến trên V7 có bậc
`7 → 1 → 2 → 1 → 7 → b6 → 5 → 4`: bậc 7 nâng có ngữ cảnh, không được ép toàn
bài vào thứ tự nhiên hoặc nâng mọi b7 bất kể chức năng.

### Cà Pháo — Người hãy quên em đi

Ô đầu intro thứ có tuyến bậc `b3 → 9 → b7 → 5 → b3 → 5` ở các quãng âm khác nhau.
Điều học được là phối hợp nốt hợp âm với màu 9/b7, câu rải và nốt nối có vị trí;
không phải chỉ tăng phần trăm chord-tone. Đây là nguồn bossa: kiến thức cao độ
có thể được nghiên cứu để chuyển soạn, nhưng không đem nguyên groove bossa sang Tuấn.

### Tôn Hùng — Chiếc Lá Mùa Đông

Các ô đầu intro lặp mô-típ tương đối `[15, 14, 7]` so với tonic, thay trường độ
và đuôi ở lần sau. Đó là phát triển mô-típ có nhận diện, không phải mỗi ô chọn
một mảnh mới. Tension cần xét trên hợp âm thực và điểm giải quyết, không chỉ xét
“nốt nằm trong gam thứ hay không”. Không nhập cell ballad vào Bolero.

Những đối chiếu này chưa được biến thành bộ luật sáng tác phổ quát trong lượt này.
Nhánh đang sửa chỉ nhận câu nguồn outro Linh Nhi/Bolero; chưa phối mô-típ cao độ
từ intro/interlude của các thầy vào một câu mới. Nói đã “train xong mọi thầy” là sai.

## 4. Mẫu kiểm chứng đang có ở La thứ

Với vốn `Am Dm G C F E E7 Em`, tầm MIDI 62–79, take 0:

- Nguồn: `noi-buon-hoa-phuong-outro`, `o4` index 1–4 (đếm từ 0).
- Tương ứng ô 71 nửa sau, ô 72 hai nửa, ô 73 nửa đầu: một tiểu cú đi về i.
- Hoà âm hiển thị: `Dm | G → F | F | Am`.
- Thời lượng từng hợp âm: `4, 2.5, 1.5, 4, 4` phách; không dồn/chia đều lại.
- Nốt tay phải theo ô: `D D D G D | C C D B | A ngân | A — E B E`.
- B ngắn trên F đi về A trên F: không xóa B chỉ vì nó không thuộc hợp âm ba.
- Kết giai điệu ở E trên Am, sau đó phách chốt Am; không ép nốt nguồn cuối thành A.
- Chuyển giọng từ Dm nguồn sang Am bằng cùng một phép dịch cho cả câu và hợp âm.

Đây là **chuyển soạn một tiểu cú nguồn để nghe kiểm chứng**, không phải thành tựu
tự sáng tác hoàn chỉnh. Ở tầm hẹp/vốn hợp âm này có thể chỉ còn rất ít ứng viên;
đổi take không bảo đảm có câu khác. Không gọi việc chọn lại cùng một tiểu cú là
“sáng tạo thêm”. Các cửa sổ khác do bộ chọn tìm được cũng chưa được nghe duyệt.

Khi không có ứng viên, không làm sập bài, không ngầm rơi về brain/nguồn khác:
app báo trạng thái và bỏ đoạn outro ở lượt đó. Mở trần 84 chỉ có thể giúp điều
kiện tầm, không chữa được thiếu hợp âm tương thích.

## 5. Tự sửa hướng dẫn cũ của Codex

1. **Cell đệm không phải toàn bộ tiết tấu giai điệu.** Cần giữ trọng âm/feel của
   điệu nhưng cho phép móc kép, chia ba, đảo phách và nghỉ khi nguồn có chủ đích.
2. **Một nguồn nhất quán không có nghĩa chỉ được học cao độ từ outro.** Có thể học
   từ solo thứ ở intro/interlude; phải tách phần kiến thức cao độ khỏi nhịp nguồn,
   nêu rõ nguồn và thiết kế lại cú pháp kết. Không ghép ngẫu nhiên từng ô của các thầy.
3. **Giữ nguyên + transpose chỉ tạo được chuyển soạn.** Để tự sáng tác, cần kế
   hoạch mô-típ, nốt neo, đường đi tới điểm giải quyết và biến thể có kiểm soát.
   Không được tuyên bố mục tiêu này đã đạt sau khi chỉ khóa source.id.
4. **Kết cao không đồng nghĩa kết hay.** Chín outro có trung bình +8,2 nửa cung và
   −3,4 nốt/ô, nhưng gồm nhiều điệu, độ dài, tầm đàn và biên đoạn khác nhau.
   Ép dấu của trung bình ấy lên mọi câu là sai; đã thay hai assertion kiểu này
   bằng cadence/time/source invariants, vẫn in các thống kê để quan sát.
5. **Không tự phong kết quả nghe.** Test qua chưa chứng minh không phô ở mọi vị trí,
   không chứng minh hợp thị hiếu và không thay quyền chấm của người dùng.

## 6. Kiểm tra và phần còn lại

- `npm run build`: qua (có cảnh báo bundle lớn).
- 4 file test nhánh liên quan: 59/59 qua sau sửa pha cell.
- Lần chạy toàn bộ sau sửa pha cell cuối: 2508 qua, 6 lỗi/2514 tests.
  Sáu lỗi nằm ở câu chạy qua vạch, tầm intro trưởng, ngón chromatic giang tấu,
  siết hợp âm trưởng và hai phép đo tầm Cà Pháo. Không tuyên bố toàn suite xanh.
- Chưa nghe thẩm định bằng tai; chưa tự động chấm “Đã ổn”. Server 5173 đang chạy
  từ đúng `D:/KeyTrain` theo command line đã kiểm.

Hướng tiếp theo, sau khi người dùng nghe vòng này:

1. Sửa dữ liệu: thời lượng thật từng ô, chất và mốc của mọi hợp âm, nốt nối,
   nguồn gốc từng sự kiện; cách ly thay đổi khỏi intro đã ổn.
2. Đánh dấu biên tiểu cú và cadence đã thẩm định. Slice liền mạch kết ở i là
   điều kiện lọc kỹ thuật, chưa đủ chứng minh mọi slice là câu nhạc hay.
3. Rút mô-típ/nốt neo/tension-resolution từ các solo thứ cùng nguồn; rút cú pháp
   tiết tấu từ outro. Thiết kế một câu mới ở cấp tiểu cú, không vá từng ô.
4. Khi cần đổi contour để vừa tầm, làm một biến thể mô-típ có chủ đích và lưu
   phép biến đổi; không khôi phục `gap()` từng nốt hoặc nearest-chord-tone.
5. Sinh một lô nhỏ, giữ dấu vết, cho người dùng nghe. Chỉ mở sang thầy/điệu khác
   sau khi biết mặt nào đã đạt: nhịp, hoà âm, đường nét hay kỹ thuật đàn.

Các file thực thi chính: `minorSoloSource.ts`, `giaiDieuDaoLinhNhi.ts`,
`phraseSection.ts`; cảnh báo đi qua `songStructure.ts` và `ReharmHome.tsx`.
