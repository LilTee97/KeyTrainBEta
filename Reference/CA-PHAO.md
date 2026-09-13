# Hồ sơ Cà Pháo — phần đã áp dụng trong KeyTrain

Tài liệu này ghi riêng những điều KeyTrain thực sự dùng được từ sheet Cà Pháo.
Nó không biến mọi quyết định nghe hay trong app thành thủ pháp đã được chứng minh
là của Cà Pháo. Bản đo chi tiết và dữ liệu gốc nằm ở
[CA-PHAO-BOSSA-AUDIT.md](CA-PHAO-BOSSA-AUDIT.md).

## Bossa CP cải tiến

### Bộ ba solo thứ — mốc lưu trữ 12/9/2026, hiện tạm ngưng

Người dùng đã duyệt bằng tai **intro, giang tấu và outro giọng thứ** khi đi
cùng `Bossa CP cải tiến` ở mốc 12/9. Sau đó người dùng yêu cầu dựng lại phần
đệm và tạm bỏ solo/fill. Bộ ba dưới đây chỉ còn là **tham chiếu lịch sử**,
không phải cấu hình phát hiện tại và không được tự bật lại. Khung đệm chính
thức là bản duyệt 13/9/2026 ở mục kế tiếp; khi làm solo trở lại phải giữ
nguyên khung đó trong phần đệm hát. Việc duyệt cũ không bao trùm mọi biến thể/giọng.

| Đoạn | Khung đã duyệt ở Am | Điều phải giữ |
| --- | --- | --- |
| Intro | 8 ô, câu mở–đáp rồi iv–V vào bài | Giữ nguyên bản intro đã duyệt |
| Giang | `Am9 | Bm7b5 E7 | Am11 | Bm7b5 E7 | Am9 | Bm7b5 E7 | Am11 | ii–V về đích` | Chạy ngón, khoảng thở RH cuối và hút đúng hợp âm phần hát |
| Outro | `Am11 | Bb9 E7b13 | Am9 | Bm7b5 E7 | Am9 | Am` | Thu mật độ, LH chủ âm và RH 5–1–b3 ngân đủ ô cuối |

Giang/outro phát triển từ các cửa sổ liên tục trong *Người hãy quên em đi*;
không ghép chắp vá ô của nhiều thầy. V7 ở phần giang và kết i thứ ở outro là
biên soạn KT để tạo lực hút/kết theo yêu cầu, không được gọi là chép nguyên
văn sheet. Khi lặp hai vòng giang, chỉ vòng cuối mới đổi ii–V theo hợp âm đầu
của phần hát; vòng trước về chỗ lặp. Bốn biến thể hiện có là các biến thể hữu
hạn đã soạn, không phải bộ học tự động vô hạn.

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
