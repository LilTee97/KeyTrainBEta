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
