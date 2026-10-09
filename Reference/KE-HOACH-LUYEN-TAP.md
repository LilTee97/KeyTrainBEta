# KeyTrain — Lộ trình tập: kế hoạch

Viết 1/10/2026 (Claude Opus 5.5). Chưa có dòng code nào; đây là bản bàn với người dùng.

**Mục tiêu (ý người dùng):** cắm đàn MIDI, tập theo từng bậc cho tới khi thuần thục. Ba mục:

1. **Điệu** — chín nút điệu trên bảng chọn.
2. **Kỹ thuật** — kỹ thuật đệm hát của Cà Pháo, Linh Nhi; kỹ thuật Blues và Twist.
3. **Lý thuyết** — cách soạn hợp âm và soạn nốt cho câu solo, *tại sao* các thầy và các sheet Blues soạn như vậy.
   Học thẳng trên app, không cần MIDI.

**Quy trình (ý người dùng):** tới mỗi mục thì bàn với người dùng chọn chi tiết muốn học trước khi dựng. Dựng xong người dùng
tập thử bằng tay, rồi mới commit sang bước sau.

Nhãn dùng trong file: **số đo** (kèm cỡ mẫu) · **suy luận của Claude** · **ý người dùng**.

---

## 1. Đã chốt (1/10/2026)

Người dùng trả lời hai câu quyết định: *"App này là để tôi tự tập"* · *"Sau khi có app rồi thì tôi sẽ tập mỗi ngày"*.

### 1.1 Làm trong KeyTrain — không tách app riêng

Tab mới **"Lộ trình"**. Tab Luyện đệm giữ nguyên cho tập tự do theo bài.

- **Số đo trong code:** đường dựng điệu nằm trong `ReharmHome.tsx` (6 201 dòng, 147 dòng có `useState` · `useMemo` ·
  `useEffect`). Ngay tab Luyện đệm cũng không tự dựng được bài — nó nhờ ReharmHome (luôn chạy ẩn) dựng rồi đẩy sang
  (`ReharmHome.tsx:3917`, `setPracticeSong`). KeyTrain đã là PWA cài được (`vite.config.ts`).
- Tách app thì hoặc chép engine — hai nguồn sự thật: duyệt lại một điệu ở KeyTrain, app kia vẫn chơi bản cũ — hoặc mổ
  đúng phần code đã nghe duyệt bằng tai (Bossa CP đang đóng băng), mổ xong phải nghe lại.
- **Xét lại khi:** người dùng định cho người khác dùng. Lúc đó phải xin phép nguồn trước khi phát hành: các điệu rút từ sheet
  Cà Pháo, Linh Nhi, Tuấn Lưu, và Twist từ sách *Boogie Woogie Basics* (Marco Brandt).

### 1.2 Cửa đạt — không lớp game

Chưa đạt thì chưa mở bậc sau. **Không** điểm, sao, combo, huy hiệu, bảng xếp hạng, chuỗi ngày — giữ tinh thần
`KE-HOACH.md` mục "Hệ B — không game hoá". Điều mới: Lộ trình **lưu tiến độ bậc và lịch kiểm lại** (ngoại lệ đã ghi ở đó).

- **Số đo (nghiên cứu):** Sailer & Homner 2020, phân tích gộp — game hoá có tác dụng nhỏ: kiến thức g = .49 (k = 19,
  N = 1 686), động lực g = .36 (k = 16, N = 2 246), hành vi g = .25 (k = 9, N = 951); chỉ giữ nghiên cứu thiết kế chặt thì
  phần động lực và hành vi kém vững. Deci, Koestner & Ryan 1999, 128 thí nghiệm — phần thưởng hứa trước làm giảm động lực
  tự thân (thưởng theo thành tích d = −0,28 trên hành vi tự chọn), phản hồi mang thông tin thì làm tăng. Có phe phản biện
  (Cameron, Banko & Pierce 2001).
- **Suy luận của Claude:** hai nghiên cứu đo học kiến thức trên lớp, phần thưởng năm 1999 phần nhiều là tiền/quà thật — áp
  sang tập đàn là suy ra. Máy chỉ chấm được nốt và nhịp; lực ba mức, "nghe có duyên", swing là việc của tai. Điểm số kéo
  người tập về phần đo được.
- **Chuỗi ngày:** người dùng nói sẽ tập mỗi ngày — ý người dùng, chưa đo. App ghi ngày tập sẵn (lượt nguội ở 1.3 cần nó).
  **Xét lại sau 3 tuần tập:** nhật ký có quãng bỏ nhiều ngày liền → thêm chuỗi ngày (rẻ: chỉ đọc nhật ký).

### 1.3 Hai mức đạt: "Đã qua" và "Đã thuộc"

- **Đã qua** — đạt tiêu chí trong buổi → mở bậc sau, không bị kẹt.
- **Đã thuộc** — đạt ở **lượt nguội**: lượt đầu tiên của bậc ấy trong một buổi khác ngày, chưa khởi động bậc ấy. Sau đó
  kiểm lại theo hộp Leitner có sẵn (`earTraining/srs/srsEngine.ts`: 0 · 1 · 3 · 7 · 14 · 30 ngày); trượt thì lùi hộp.
- **Số đo (nghiên cứu):** guidance hypothesis (Salmoni, Schmidt & Walter 1984) — phong độ đạt được khi có nhắc liên tục
  trong buổi hiếm khi giữ được ở bài kiểm sau quãng nghỉ, không nhắc; bài kiểm ấy mới đo đúng cái đã học.
- **Claude tự sửa (cùng ngày):** đề xuất đầu tiên lấy "đạt hai lượt liền" làm cửa — đo phong độ ngay sau khi tập lặp, không
  đo cái đã thuộc. Bỏ.

### 1.4 Bậc cuối tắt nốt rơi

Chỉ hiện tên hợp âm. Đệm hát thật không có màn hình, ca sĩ không chờ. Áp guidance hypothesis sang nốt rơi là **suy luận của
Claude** — chưa có số đo riêng cho app nốt rơi. (Đề xuất đầu tiên để mục này thành câu hỏi tuỳ chọn — sai, nay bắt buộc.)

### 1.5 Chế độ theo nhịp: đánh sai không dừng

Giữ nhịp đi qua chỗ sai là kỹ năng đệm hát. Chế độ chờ đánh đúng nốt (có sẵn) chỉ dùng để học nốt ở các bậc đầu.

### 1.6 Bài tập là bản đóng băng

Xuất đầu ra của điệu đã duyệt thành file nốt, ghi commit nguồn trong file; Lộ trình chỉ đọc file. Tập thẳng từ bộ soạn
đang chạy thì mỗi lần sửa bộ soạn, bậc đã qua lặng lẽ đổi nốt. Một test dựng lại và so với file để báo khi điệu đã đổi
(cùng lối SHA-256 câu "đã ổn" ở `CP-BALLAD-COMPOSER-2026-09-23.md`).

### 1.7 Buổi tập mở đầu bằng lượt nguội

Bậc chờ xác nhận "Đã thuộc" và bậc đến hạn kiểm lại đi **trước** bậc đang học — tập bậc khác trước thì tay đã nóng, hết
còn là lượt nguội.

---

## 2. Thang bậc cho một điệu — đề xuất, chốt ở GĐ 1

| bậc | tay | chế độ | tempo | nhìn |
|---|---|---|---|---|
| 1 | trái | chờ đúng nốt | — | nốt rơi |
| 2 | phải | chờ đúng nốt | — | nốt rơi |
| 3 | hai tay | chờ đúng nốt | — | nốt rơi |
| 4 | hai tay | theo nhịp | 60% | nốt rơi |
| 5 | hai tay | theo nhịp | 80% | nốt rơi |
| 6 | hai tay | theo nhịp | 100% | nốt rơi |
| 7 | hai tay | theo nhịp | 100% | **chỉ tên hợp âm**, vòng và giọng chưa gặp |

- Bậc 1–3 không đo nhịp: cửa đạt là đi hết vòng với số lần bấm sai ≤ N.
- Bậc 4–7, cửa đạt — **đoán, chưa đo**: ≥ 90% tiếng đúng nốt, lệch trung vị ≤ 40 ms. Đo trên tay người dùng ở GĐ 0 rồi
  mới chốt.
- **2/10/2026 — người dùng giao Claude "trong vai một gia sư piano nhiều kinh nghiệm" quyết ngưỡng từ dễ đến khó.** Ngưỡng từng
  bậc (siết dần: vấp 15 · 15 · 10 %; theo nhịp 85 % · 60 ms → 90 % · 50 ms → 95 % · 40 ms; bậc 7 90 % · 40 ms) ở
  `src/thay/loTrinh.ts` và `SO-TAY.md` cùng ngày — quyết định, chưa đo trên tay người dùng.
- Kho bài tập chia **tập** / **kiểm**: bậc 7 chỉ lấy từ phần kiểm — vòng hợp âm và giọng không xuất hiện ở bậc 1–6.

---

## 3. Các giai đoạn

### GĐ 0 — Nền (không có nội dung; mục 1 và 2 dùng chung)

**Có sẵn:** `noteGatedPlaybackEngine.ts` (gom tiếng thành chặng, lọc tay, bỏ nốt láy) · `NoteGatedPractice.tsx` ·
`FallingNotes.tsx` · `getPlaybackBeats()` (phách tai đang nghe, đã trừ bù lệch hình–tiếng) · `midiStore` · `db.ts`
(IndexedDB, 4 kho) · Leitner.

**Phải dựng:**

1. **Phát chừa tay** — máy chơi tay không tập + tiếng click; tay đang tập câm. Chưa có: không chỗ nào trong
   `reharm/playback` hay `shared/audio` câm theo tay (grep 1/10).
2. **Bộ chấm theo nhịp** — hàm thuần, có test. Mỗi nốt mong đợi ghép với nốt bấm cùng phím gần nhất trong cửa sổ ±W ms,
   mỗi nốt bấm dùng một lần. Ra: tỉ lệ trúng · lệch trung vị có dấu (sớm/muộn) · lệch trung vị tuyệt đối · nốt thừa.
   Lực: so tiếng nhấn với tiếng thường (tương đối), không chấm lực tuyệt đối — mỗi đàn một đường cong lực.
3. **Đo độ trễ** — gõ theo click 16 tiếng, lấy trung vị, lưu `localSettings`. Con số gộp cả trễ loa, trễ đàn và thói quen
   đánh sớm/muộn của người tập — chủ ý: chấm độ đều so với chính mình. Cần đổi đồng hồ âm thanh ↔ đồng hồ MIDI.
4. **Dấu thời gian MIDI** — `midiStore` đang đóng dấu bằng `performance.now()` lúc xử lý (dòng 73, 104), tức lệch theo độ
   bận của trang. Chuyển sang `timeStamp` của chính sự kiện MIDI.
5. **Nhật ký lượt tập** — GĐ 0 ghi `LuyenTap.json` ở gốc repo qua máy chủ dev (cùng lối `Nguon.json`), để Claude đọc
   được số đo thật mà chốt ngưỡng. Kho IndexedDB cho trạng thái bậc dời sang GĐ 1 — bản cài trên điện thoại không có máy
   chủ dev. Trạng thái bậc vẫn là hàm thuần đọc nhật ký.

**Demo:** một điệu, một vòng 4 hợp âm, bảng kết quả cuối lượt. Người dùng tập thử → đo phân bố lệch thật → chốt ngưỡng.

**Đã dựng 1/10/2026 — chờ người dùng tập thử bằng đàn.** Tab Luyện đệm → nút **Theo nhịp**
(`playback/TimedPractice.tsx`, bộ chấm `playback/timedScoring.ts`). Chi tiết, hằng số và bẫy: `SO-TAY.md` mục cùng ngày.

**Tình trạng 2/10/2026:**
- Xong mục 1–5 và bản demo. Làm thêm theo yêu cầu người dùng (2/10): phím bấm phát ngay (bỏ 100 ms lookAhead), nốt rơi
  dài theo độ ngân + tự thu phóng + nốt láy, hình bù theo độ trễ đo được, tên + số mọi phím, phím đậm/sẫm theo lực nhấn, nút
  trái/phải đúng bên, khung Luyện đệm rộng, nút toàn màn hình xoay ngang (cả Android). Đã đẩy lên GitHub Pages.
- **Chưa xong:** (1) **chốt ngưỡng đạt** — chưa có lượt nào đủ dữ liệu (7 lượt 2/10 trúng 0–2 nốt, đeo Galaxy Buds 2 trễ 251–278
  ms); (2) **chấm tiếng nhấn** (mục 2: so tiếng nhấn với tiếng thường) — chưa làm; (3) chưa thử trên Android thật.
- Không chặn GĐ 1: ngưỡng chỉ cần khi bật cửa đạt (GĐ 1 bước 5–6). Trong lúc dựng bước 1–4, người dùng tập vài lượt trên máy
  tính bằng tai nghe dây để có số.

### GĐ 1 — Mục Điệu: kế hoạch dựng (viết 2/10/2026 — chờ người dùng duyệt)

**Chín điệu — số trong mã (2/10/2026):**

| nút | nhịp | ô đệm | tempo mặc định | vòng tập lấy từ bộ soạn |
|---|---|---|---|---|
| Bossa CP cải tiến | 4/4 | 8 phách | 110 | Cà Pháo |
| Ballad Có em chờ (phiên · điệp) | 4/4 | 8 | 75 | Cà Pháo |
| Ballad Để em (phiên · điệp) | 4/4 | 8 | 85 | Cà Pháo |
| Ballad cứ đi | 4/4 | 2 (một lượt rải 8 móc kép) | 63 | Cà Pháo |
| Slow Rock Lá thư 2 tay (phiên · điệp) | 6/8 | 12 | 86 | Linh Nhi |
| Slow Blues (phiên · điệp) | 6/8 | 6 — **ô đệm chỉ có tay trái**; tay phải do Bộ Soạn Blues chạy ngón mỗi ô | 92 | Bộ Soạn Blues |
| Twist | 4/4 swing | 4 | 140 | Bộ Soạn Blues |
| Bolero Tuấn | 4/4 | 4 | 100 | tạm Linh Nhi — chờ xác nhận |
| Tango Tuấn | 4/4 | 4 | 100 | tạm Linh Nhi — chờ xác nhận |

**Các bước:**

1. **Sinh vòng tập** — gọi bộ soạn của thầy (`buildPhraseSection`, đoạn dạo · giang · kết) lấy `chords` + `beatsEach`, cắt vòng
   4 ô ở vạch ô (Blues: một dòng 4 ô của khung 12 ô). Vòng 8 ô (Blues 12 ô) để riêng làm phần kiểm cho bậc 7.
2. **Dựng bài tập bằng chính app** — mỗi bài tập là một ảnh chụp bài (`SongSnapshot`: hợp âm + điệu + giọng + ô tick) đưa vào
   đường mở bài sẵn có (`practiceStore.requestOpen`) → ReharmHome dựng như mọi bài → lấy `song.timeline`, ghi ra file nốt kèm commit
   nguồn. Một script điều khiển app trên máy chủ dev chạy hết 9 điệu × vòng × giọng (cùng lối script chụp màn hình 2/10). Lý do
   không viết hàm dựng riêng: ReharmHome có hàng chục nhánh riêng từng điệu (Twist một lượt, Slow Rock một ô, giai điệu Slow
   Blues, Bossa CP chỉ tiết tấu, fill Ballad cứ đi …) — chép ra là hai nguồn sự thật; đi qua app thì bài tập đúng là cái người
   dùng đã nghe duyệt.
3. **Người dùng nghe duyệt bộ bài tập** — thay cho "nghe lại 9 điệu": nghe chính những bài sẽ tập; duyệt xong mới đóng băng.
   Một test dựng lại và so với file để báo khi điệu đổi.
4. **Đo độ khó → đề xuất thứ tự điệu** — số tiếng mỗi phách, số nốt bấm cùng lúc tối đa, độ giãn tay trong một cú, khoảng cách
   hai tiếng sát nhất ở tempo 100 %, tempo.
5. **Tab "Lộ trình"** — danh sách điệu theo thứ tự đề xuất → 7 bậc (chưa mở · đang tập · Đã qua · Đã thuộc · đến hạn kiểm lại) →
   vào bậc là khung tập dùng lại `NoteGatedPractice` / `TimedPractice` với dữ liệu bài tập, có toàn màn hình.
6. **Lưu tiến độ trên máy** — kho IndexedDB mới (nhật ký lượt, chỉ ghi thêm — chạy được trên Android); trạng thái bậc = hàm
   thuần đọc nhật ký; kiểm lại theo Leitner. Máy chủ dev vẫn ghi `LuyenTap.json` cho Claude đọc số đo.
7. **Bậc 7 chấm (b)** — lớp cao độ (`ignoreOctave`) + kiểm nốt thấp nhất quanh tiếng bass.
8. **Buổi tập hôm nay** — màn đầu tab: lượt nguội (bậc chờ "Đã thuộc", bậc đến hạn kiểm lại) đi trước, rồi bậc đang học.

Mỗi bước: test + người dùng tập thử, xong mới sang bước sau. Bước 1–4 làm được trước khi chốt ngưỡng.

**Câu hỏi cho người dùng — chi tiết muốn học (chờ trả lời):**

1. **Phiên / điệp** — bốn điệu có hai biến thể (Có em chờ, Để em, Slow Rock Lá thư, Slow Blues). Khuyến nghị: tập phiên khúc
   trước; điệp khúc thành bài tập thứ hai, mở khi phiên đã qua bậc 6.
2. **Câu chèn** — khung đệm không có câu chèn (fill, câu chạy, lick); câu chèn để mục 2. Riêng Slow Blues, tay phải CHÍNH LÀ câu
   chạy Bộ Soạn Blues sinh mỗi ô: (a) đóng băng một bản soạn rồi tập luôn tay phải ấy (khuyến nghị) · (b) chỉ tập tay trái ·
   (c) tay phải thay bằng hợp âm đơn giản.
3. **Giọng ở bậc 1–6** — (a) Đô trưởng / La thứ cho mọi điệu, tập khuôn không vướng giọng (khuyến nghị) · (b) đúng giọng sheet
   gốc từng điệu · (c) người dùng chọn. Bậc 7 thì giọng lạ.
4. **Tempo 100 %** — lấy tempo mặc định của nút (bảng trên) hay người dùng đặt riêng?
5. **Lực nhấn** — chỉ hiện nhận xét, không chặn qua bậc, cho tới khi có số đo lực thật (khuyến nghị) · hay chấm luôn?
6. **Bolero Tuấn · Tango Tuấn** lấy vòng từ bộ soạn Linh Nhi — đồng ý?

### GĐ 2 — Mục Kỹ thuật (bàn với người dùng trước khi dựng)

- Câu lẻ 1–2 ô cắt **nguyên** từ sheet của thầy, ghi bài + ô; không lấy câu do bộ soạn sinh. Đủ 12 giọng mới tính thuộc.
  Dùng bộ chấm GĐ 0.
- Ứng viên để bàn, **chưa chọn**: CP Lick/Run (`cpPhrases.json`, 9 sheet) · câu fill CP · walking bass và hai tay đan
  (*Để Em Rời Xa*) · Linh Nhi — lấy từ 7 sheet trong PianoBrain (trong chín nút chỉ còn Slow Rock Lá thư của chị; Bolero
  Linh Nhi đã xoá 30/9) · Blues: nốt láy, blue note, riff, câu chạy · Twist: bass boogie 1–1–♭3–3–5–1–6–5, cú chặn swing.

### GĐ 3 — Học cách soạn câu: kế hoạch dựng (viết và sửa 4/10/2026 theo ý người dùng; Q1–Q3 đã chọn; bước 1 dựng xong; thêm 5 ý sau bản thử)

**Ý người dùng (4/10/2026, tóm sát chữ):** làm theo từng thầy và theo màu hợp âm của từng thầy.
1. Nhập giọng (tone chủ) của bài và hợp âm bậc 1 → app đưa ra hợp âm các bậc còn lại, giải thích vì sao đặt như vậy.
2. Quiz để nhớ vòng hợp âm — điền hợp âm còn thiếu trong vòng …
3. Cho một vòng hợp âm → giải thích cặn kẽ nên chọn nốt nào để solo trên từng hợp âm; làm thành quiz hoặc bài giúp ghi nhớ.
4. Tính năng tập: app đưa vòng, người dùng chọn nốt solo trên từng hợp âm — đánh bằng đàn MIDI, chuột, bàn phím máy hoặc chạm;
   có backing track trên vòng; có chờ đúng nốt, chấm điểm, học tự do và học theo bậc từ dễ đến khó.

Người dùng nói rõ thêm cùng ngày:
- *"màu hợp âm ko phải chỉ nói về hợp âm màu mà nói về phong cách đặt hợp âm của từng thầy, tính cả hợp âm cơ bản và màu và tất cả
  các loại hợp âm mà các thầy đặt trong các sheet của mình"*.
- *"Khi biết tone chủ và hợp âm bậc 1 rồi thì bạn hãy dựng cả những vòng hợp âm theo lý thuyết Piano, bên cạnh việc dựng theo các
  thầy thì tôi cũng muốn học Piano căn bản"*.
- *"Chọn nốt solo thì hãy bám theo sheet của các thầy chứ ko phải đúng sai tuyệt đối"*.
- *"Q1 và Q2 làm theo đề xuất của bạn"* → làm thử với **Linh Nhi**; trang **Tuấn ẩn** phần này.

**Giữ từ khung cũ:** nguồn thầy là PianoBrain `knowledge/` — `teachers/ca-phao.md` · `teachers/linh-nhi-piano.md` ·
`BLUES-CHON-HOP-AM-VA-NOT.md` · `LUAT-SOAN-NOT.md` · `TWIST.md`, viết cho agent đọc → phải viết lại thành bài. Mỗi câu "vì sao"
gắn nhãn **số đo (n)** · **lý thuyết** · **suy luận của Claude** · **ý người dùng**; không dạy suy luận như sự thật. Không dựng hệ
quản lý bài học, không lớp game (mục 1.2).

**Hai lớp học (Claude trong vai gia sư):**
- **Căn bản — lý thuyết piano:** không gắn thầy nào; học cái chuẩn trước. Chỗ đặt: Q3.
- **Từng thầy — bám sheet:** tab Học cách soạn câu ở trang Linh Nhi · Cà Pháo · Blues — thầy làm gì, bao nhiêu lần, khác lý thuyết
  ở đâu.

Hai lớp đi cùng một vòng **Hiểu → Nhớ → Nghe → Làm**, cùng bốn phần; phần sau dùng dữ liệu của phần trước. Khác nhau duy nhất là
**nguồn**: Căn bản lấy lý thuyết và chấm theo loại nốt lý thuyết; trang thầy lấy số đo từ sheet và chấm theo độ giống thầy.

| phần | việc | yêu cầu |
|---|---|---|
| 1. Hợp âm theo bậc và vòng | giọng + hợp âm bậc 1 → hợp âm mọi bậc, vòng, cách nối; thẻ giải thích từng bậc (lý thuyết · thầy); thuật ngữ | 1 · ý 3 |
| 2. Nhớ vòng và chuyển hợp âm | quiz trả lời bằng đàn / chạm / gõ tên; đánh vòng theo thế bấm và đường chuyển của thầy | 2 · ý 5 · ý 6 |
| 3. Chọn nốt solo | từng hợp âm của một vòng: nốt nào, vì sao; bài đọc; quiz | 3 |
| 4. Gam và hợp âm rải | gam, hợp âm rải chọn theo số đo của thầy; ngón theo lối chuẩn | ý 4 |
| 5. Tập solo trên backing | chọn nốt trên từng hợp âm; chờ đúng nốt / theo nhịp; chấm; tự do và theo bậc | 4 |

Thứ tự học: hiểu (1) → nhớ (2) → biết nốt nào (3) → tay quen nốt ấy (4) → làm (5). Mọi phần tập mở ở **tự do**; tick ô **"Vào tập
luyện"** mới chấm đạt, có bậc, ghi nhật ký (ý 2 — mục "Bổ sung sau bản thử" dưới).

#### Phần 1 — Hợp âm theo bậc và vòng
- Vào: giọng (12 chủ âm × trưởng / thứ) và hợp âm bậc 1. Ra hai cột cạnh nhau, ▶ nghe từng hợp âm, nút sang phần 2 và phần 5:
  - **Lý thuyết piano:** hợp âm từng bậc theo gam (`diatonicChords` — hợp âm ba hoặc hợp âm bảy theo loại hợp âm bậc 1 đã nhập;
    giọng thứ thêm V7 của gam thứ hòa âm); hợp âm bậc 1 có màu thì cả bộ màu theo bảng `PALETTE_BY_TONIC_COLOR` (tài liệu đệm hát +
    nguồn jazz, `SO-TAY.md`); các vòng phổ biến ở giọng ấy — 11 vòng có sẵn trong `progressionGenerator.ts`: ii–V–I · ii–V–I–vi ·
    I–V–vi–IV · vi–IV–I–V · I–vi–ii–V · I–vi–IV–V · I–IV–V · vòng Canon · iiø–V7–i · i–VI–III–VII · i–iv–V7 — mỗi vòng kèm chức
    năng (chủ · hạ át · át) và vì sao nó chạy.
  - **Thầy — phong cách đặt hợp âm:** MỌI loại hợp âm thầy đặt trong sheet (hợp âm ba trơn, hợp âm bảy, hợp âm màu, giảm, đảo bass,
    mượn, át phụ, lướt): mỗi bậc các loại thầy đặt, **kể cả trơn**, kèm n; bước chuyển hay gặp; vòng hay dùng; dẫn vào hát, đóng
    kết; nhịp đổi hợp âm; khác nhau giữa đoạn hát và đoạn đàn.
  - Dòng **"thầy khác lý thuyết ở đâu"**: vd Cà Pháo đặt bậc v giọng thứ là vm7, V7 → i chỉ ở cuối kết Anh Cứ Đi Đi; Linh Nhi đặt
    V7 ở 17/24 chỗ bậc V giọng thứ; Blues đặt I7 · IV7 · V7 thay cho Imaj7 · IVmaj7 · V7 của gam.
- Cột lý thuyết: loại hợp âm bậc 1 quyết định cả bảng. Cột thầy: mỗi bậc là một phân bố đo được, và chuyện loại hợp âm bậc 1 kéo
  theo bậc khác chưa đo được (Linh Nhi chỉ 3 bài trưởng) — app lọc theo hợp âm bậc 1 chỉ khi ≥ 2 bài của thầy đặt đúng loại ấy;
  loại thầy không đặt ở bậc 1 (0/n) thì nói thẳng, đưa loại gần nhất thầy có — không bịa.
- Dữ liệu thầy:
  - **Linh Nhi — có sẵn**: md 13d (`tools/hop_am_linh_nhi.py`; phần hát 8 bài: 3 trưởng, 5 thứ; loại hợp âm lấy từ nốt đệm thật,
    không từ ký hiệu). Theo bậc, kể cả trơn — vd thứ: i n = 101 (trơn 41 · add9 38 · ♭7 21), ♭VI n = 46 (maj7 21; điệp khúc
    13/21); trưởng: trơn là loại hay gặp nhất ở mọi bậc, II7 đứng vững (10/10). Bước chuyển — trưởng I→vi 25 · V→I 24 · ii→V 14;
    thứ i→♭VI 20 · V→i 11 · iv→i 11 · i→♭VII 10 · ♭VII→♭III 10 · ♭III→V 9. Ô có hai hợp âm: bolero trưởng 15 %, bolero thứ
    27 %, slow rock 73 %. Đảo bass hiếm (7/245 đoạn giọng trưởng). App đã có `reharmEngine/linhNhiHarmony.ts` — dùng lại.
  - **Cà Pháo — CHƯA ĐO theo bậc**: md có lối đặt hợp âm theo từng bài (trục bVI → bVII → i; vòng xuống bIIImaj7 → bVImaj7 →
    vm7 → ivm7; trưởng IVmaj7 → iiim7 → iim7 → V(9)sus4 → V → I; V treo; mượn bVIImaj7; 4 luật hợp âm lướt) và tổng 111 ký hiệu,
    nhưng chưa có bảng loại hợp âm theo bậc và bước chuyển đếm được → đo cùng cách Linh Nhi (mọi loại, kể cả trơn, từ nốt đệm
    thật) trên khoảng 10 sheet, trước khi dựng.
  - **Blues**: khung 12 ô, I7 · IV7 · V7; Ray giữ hợp âm 2–4 ô 6/8 và đi V → IV, Robert và Rising Sun đổi mỗi ô; thứ (Rising Sun):
    mọi hợp âm ngoài i là hợp âm bảy.
  - **Tuấn**: không có sheet — ẩn (người dùng chọn 4/10).

#### Phần 2 — Nhớ vòng (quiz)
- Dạng câu: (a) **điền ô trống** — vòng ẩn 1 ô → 2 ô → chỉ còn bậc 1; (b) **bậc → hợp âm**; (c) **bước chuyển** ("sau i, chị hay
  đi đâu?"); (d) **chọn lý do đúng** cho một hợp âm; (e) **nghe backing của vòng rồi điền ô trống** — đề xuất thêm của Claude.
  Căn bản hỏi theo lý thuyết ("I–V–vi–IV ở Rê trưởng: ô 3 là?"); trang thầy hỏi theo thầy, chỉ hỏi loại hay đặt nhất.
- Trả lời bằng tay khi được: bấm hợp âm trên đàn / chuột / bàn phím máy / chạm — chấm theo tên nốt, bỏ quãng tám (dùng lại cách
  chấm hợp âm của `earTraining/progressionTrainer`); dạng (d) chọn 1 trong 4.
- Lịch ôn thẻ nhớ `srsEngine` (tab Điệu đang dùng): mỗi câu một thẻ, sai về hộp 0. Thuộc ở giọng gốc rồi mới mở giọng khác.

#### Phần 3 — Chọn nốt solo trên từng hợp âm (bài đọc + quiz)
- **Trang thầy — bám sheet, không đúng/sai tuyệt đối** (người dùng 4/10): mỗi hợp âm của vòng hiện **thầy đánh nốt nào, bao nhiêu
  phần trăm** trong đúng ngữ cảnh (chất hợp âm hoặc chức năng · phách mạnh / nhẹ · điệu), kèm n, xếp từ nhiều tới ít: *thầy hay
  dùng* · *thầy có dùng* · *chưa gặp trong sheet (0/n)*. Nốt thầy không dùng chỉ là "khác thầy", không gọi là sai. Ví dụ nghe cắt
  từ sheet (bài, ô), nốt sáng trên phím, nút sang phần 5 hoặc tab Kỹ thuật đánh.
- Ngữ cảnh đo theo đúng cách mỗi thầy chọn nốt (số đo, soát 4/10/2026):
  - **Cà Pháo — so với gốc hợp âm đang vang:** nốt đỉnh là nốt hợp âm 63 % (247/395 đúng phách · 498/785 giữa phách); đúng phách:
    5 17 % · 9 16 % · b7 12 % · 3, 1, b3, 11 mỗi bậc 10 % · 7 7 % · 13 5 % · #11, b13, b9 ≤ 3 %. Hiện gộp mọi chất hợp âm → đo
    tách theo chất hợp âm cùng lúc đo cách đặt hợp âm.
  - **Linh Nhi — tùy điệu và chất hợp âm:** nốt hợp âm ở phách mạnh · nhẹ (md 13e, 23 đoạn solo · 8 bài) — slow rock thứ 83 % ·
    85 % (6 đoạn, 49 ô), bolero trưởng 82 % · 60 %, bolero thứ 64 % · 56 %. Theo chất hợp âm (md 6b): trên hợp âm trưởng, bài
    trưởng 1 · 3 · 5 chiếm 75 % (n = 155), bài thứ 53 % — rải sang 9 · 13 (n = 150); trên hợp âm thứ, bài trưởng 67 % (n = 207),
    bài thứ 54 % (n = 355).
  - **Blues — so với chủ âm, theo chức năng I · IV · V:** ngũ cung trưởng của chủ thêm b3 (81 % của 503 nốt, Rockhouse); sang IV
    thì 3 thành b3 (Rockhouse 3 lần so với 31, Robert 0 so với 25); phách mạnh — I: 1 · 6 · 3, IV: 6 · 1 · b3, V: 5 · 1 · 6 (810 +
    330 nốt).
- **Căn bản — theo lý thuyết:** nốt hợp âm · nốt căng (9 · 11 · 13) · nốt lướt · nốt tránh; gam theo hợp âm, ngũ cung, gam blues;
  nhắm nốt hợp âm ở chỗ đổi hợp âm. Đây là chỗ duy nhất xếp nốt theo loại nốt lý thuyết.
- Bài đọc: 15 bài của ba thầy (đề xuất 3/10, soát 4/10 — Linh Nhi bài 1 và 5 sửa, Linh Nhi bài 2 và Blues bài 4 viết lại cho chính
  xác) cho trang thầy; 7 bài căn bản (dưới) cho Căn bản; mỗi bài có quiz vào lịch ôn.
- **Một nguồn số đo:** bảng phân bố nốt của từng thầy (JSON xuất từ bộ đo có sẵn — `tools/quy_luat_not_linh_nhi.py`,
  `scripts/phan_tich_blues_giai_dieu.py`; Cà Pháo đo mới). Bài đọc, quiz và bộ chấm phần 5 cùng đọc nó. Căn bản: một hàm thuần xếp
  loại nốt theo lý thuyết, có test.

#### Phần 5 — Tập solo trên backing
- Backing: trang thầy — **điệu đã duyệt của chính thầy**, dựng bằng `dungVong` (Linh Nhi: Slow Rock Lá thư; Cà Pháo: Ballad cứ đi,
  Bossa CP; Blues: Twist), tắt câu fill như `dungVong` đang làm để chừa chỗ cho câu solo (Twist còn chèn câu chạy ở ô 4, 8 … —
  phải tắt; chốt lúc tới Blues). Căn bản — **đệm cơ bản** không theo thầy nào (tay trái gốc, tay phải hợp âm khối hoặc rải đơn;
  dựng mới, nhỏ), đổi được sang điệu của một thầy.
- Nhập: đàn MIDI · chuột · bàn phím máy (`useComputerKeyboard`) · chạm (`OnScreenPiano`) — đều có sẵn.
- **Chờ đúng nốt:** backing giữ hợp âm, chờ tới khi bấm một nốt thuộc **tập nốt bậc ấy nhận** rồi sang hợp âm sau; phím bấm sáng
  theo mức thầy dùng (trang thầy: nhiều · ít · chưa gặp) hoặc theo loại nốt (Căn bản). Cần thêm kiểu bước "một nốt bất kỳ trong
  tập" — bước chờ hiện chỉ nhận nốt cố định (`isStepMatched`). Chấm: tỉ lệ đúng ngay lần đầu.
- **Theo nhịp:** backing chạy liên tục. Trang thầy chấm **độ giống thầy**: (1) nốt đáp ở chỗ đổi hợp âm so với nhóm phách mạnh của
  thầy; (2) tỉ lệ nốt thuộc nhóm thầy hay dùng; (3) số nốt chưa gặp trong sheet — báo, không gọi là sai. Căn bản chấm theo loại nốt
  lý thuyết.
- **Tập tự do:** chọn vòng, giọng, BPM, tập nốt được nhận; có chấm, không vào thang, không lưu tiến độ — như tab Kỹ thuật đánh.
- **Theo bậc** — thang 7 bậc, qua bậc trước mới mở bậc sau, ghi nhật ký `luotTap`. Thang và ngưỡng: Claude trong vai gia sư,
  CHƯA ĐO.

| bậc | vòng | chế độ | nốt được nhận — trang thầy (bám sheet) | nốt được nhận — Căn bản (lý thuyết) | gợi ý |
|---|---|---|---|---|---|
| 1 | một hợp âm (bậc 1) | chờ đúng nốt | 3 bậc thầy dùng nhiều nhất trên hợp âm ấy | 1 · 3 · 5 | phím sáng |
| 2 | hai hợp âm | chờ đúng nốt | 3 bậc nhiều nhất, mỗi hợp âm | nốt hợp âm, thêm 7 | phím sáng |
| 3 | cả vòng | chờ đúng nốt | nhóm chiếm ~70 % số nốt của thầy ở ngữ cảnh ấy | nốt hợp âm | tắt |
| 4 | cả vòng | chờ đúng nốt | nhóm ~85 % | thêm nốt căng 9 · 11 · 13 | tắt |
| 5 | cả vòng | theo nhịp 60 % | phách mạnh / nhẹ theo nhóm riêng của thầy | phách mạnh: nốt hợp âm hoặc căng | tắt |
| 6 | cả vòng | theo nhịp 100 % | so cả phân bố | thêm nốt lướt; nốt tránh bị trừ | tắt |
| 7 | giọng lạ, đổi mỗi lượt | theo nhịp 100 % | như bậc 6 | như bậc 6 | tắt cả nốt rơi |

~70 % · ~85 % là số Claude chọn, chưa đo. Cùng lối thang tab Điệu: chờ đúng nốt trước, theo nhịp sau, bậc cuối ở giọng lạ (tab
Điệu chờ đúng nốt 3 bậc, ở đây 4).

#### Căn bản — giáo trình lý thuyết piano (nhãn **lý thuyết**, không phải số đo)
1. Gam trưởng, gam thứ (tự nhiên · hòa âm · giai điệu); bậc và tên bậc.
2. Hợp âm ba và hợp âm bảy trên từng bậc: trưởng · thứ · giảm; maj7 · m7 · 7 · m7♭5.
3. Chức năng chủ · hạ át · át; các kiểu kết: chính, plagal, nửa, lừa.
4. Vòng phổ biến (11 vòng có sẵn): vì sao nó chạy; nghe; tập ở 12 giọng.
5. Thế đảo và nối hợp âm gần: giữ nốt chung, đi đường ngắn nhất.
6. Hợp âm màu theo lý thuyết (6 · maj7 · add9 · 9 · sus4 · 13) và nốt tránh (11 trên hợp âm trưởng).
7. Chọn nốt solo theo lý thuyết: nốt hợp âm, nốt căng, nốt tránh, gam theo hợp âm, ngũ cung, gam blues; nhắm nốt hợp âm ở chỗ đổi
   hợp âm.

Mỗi bài có nút "Các thầy làm khác thế nào" sang phần 1 của trang thầy.

#### Bổ sung sau bản thử (người dùng 4/10/2026)

**Ý người dùng, tóm sát chữ** (ý 1 — bấm phím không ra tiếng — đã sửa ngay, `SO-TAY.md` cùng ngày):
2. Mọi phần tập để đánh **tự do** trước; tick ô **"Vào tập luyện"** thì mới chấm đạt và có bậc.
3. Hợp âm theo bậc: chọn giọng và hợp âm bậc 1 → đưa các bậc còn lại và **giải thích vì sao** đặt hợp âm ấy vào bậc ấy; phần thầy cũng
   giải thích lựa chọn của thầy — không hiển thị sơ sài. Văn phong thầy dạy piano chuyên nghiệp, cặn kẽ, người mới biết căn bản cũng
   hiểu; dùng thuật ngữ thì giải thích thuật ngữ.
4. Mỗi thầy: chọn tập **gam (scale)** và **hợp âm rải (arpeggio)** nào để nắm nốt solo; cho tập cả gam và hợp âm rải.
5. Quiz Nhớ vòng trả lời được bằng **cảm ứng hoặc bàn phím** (không chỉ bấm đàn).
6. Học **cách chuyển hợp âm của thầy**: cho trước giọng, vòng, màu từng hợp âm; đánh trên đàn theo cách xếp ngón và cách chuyển của
   thầy — không nhảy tùy tiện — hoặc điền tên trên Android.

**Gộp vào kế hoạch** (ý trùng việc đã định thì làm theo cách đã định — người dùng dặn):
- **Ý 2 — trùng "Tập tự do":** đảo mặc định. Mọi phần tập (quiz, chuyển hợp âm, gam và hợp âm rải, tập solo) mở ở tự do: vẫn báo
  từng nốt / hợp âm (bậc, phần trăm thầy dùng, đúng / chưa đúng) nhưng không chấm đạt, không bậc, không ghi nhật ký. Tick "Vào tập
  luyện" thì bật thang bậc, chấm đạt, nhật ký `luotTap` (và lịch ôn cho quiz). Mỗi lần mở là tự do — không nhớ lựa chọn ("để tôi đánh
  tự do trước"); bấm "Tập" từ trang Hôm nay thì mở thẳng tập luyện. Áp cả tab Điệu và Kỹ thuật đánh (Q4). **Xong 4/10/2026.**
- **Ý 3 — trùng "bài đọc làm phần vì sao":** phần 1 thành **thẻ giải thích từng bậc**, hai cột:
  - Lý thuyết: hợp âm dựng thế nào (nốt nào, cách nhau mấy nửa cung, vì sao ra trưởng / thứ / giảm), chức năng (chủ · hạ át · át) và
    hay đi về đâu; hợp âm bậc 1 có màu thì vì sao cả bộ màu đổi theo. Sinh từ chính nốt của hợp âm bằng khuôn câu — đúng cho mọi giọng.
  - Thầy: thầy đặt gì ở bậc ấy (số đo, n), nghe ra sao, vì sao (suy luận gắn nhãn; người dùng đã xác nhận thì ghi), khác lý thuyết ở đâu.
  - Thuật ngữ: lần đầu dùng thì giải thích ngay trong câu, và có bảng thuật ngữ (bậc, gam, quãng, nửa cung, hợp âm ba / bảy, trưởng /
    thứ / giảm, chức năng, nốt cảm âm, hợp âm màu, trơn, át phụ, hợp âm mượn, đảo bass, bước chuyển …).
  - Viết mẫu cho Linh Nhi và lý thuyết La thứ · Đô trưởng trước → người dùng duyệt văn phong → mới sinh cho mọi giọng, mọi thầy.
- **Ý 4 — mới: phần "Gam và hợp âm rải"**, chọn theo số đo của thầy:
  - Linh Nhi: hợp âm rải của các hợp âm chị đặt nhiều nhất (thứ: i · ♭III · iv · ♭VI · ♭VII · V7; trưởng: I · V · ii · vi · IV · iii ·
    II7) — vì câu solo slow rock thứ của chị 83–85 % là nốt hợp âm; gam thứ tự nhiên và gam thứ hòa âm (V7 của chị mang nốt cảm âm);
    giọng trưởng: gam trưởng.
  - Cà Pháo (sau khi đo): hợp âm rải có bậc 9 (bậc 9 gần ngang bậc 5) và hợp âm bảy; gam theo giọng.
  - Blues: ngũ cung trưởng của chủ thêm b3 (81 % nốt của Rockhouse), sang IV đổi 3 thành b3; hợp âm rải I7 · IV7 · V7.
  - Căn bản: gam trưởng, gam thứ (tự nhiên · hòa âm · giai điệu), hợp âm rải ba và bảy — 12 giọng.
  - Tập bằng khung có sẵn: chuỗi nốt sinh thành dòng thời gian → `NoteGatedPractice` (chờ đúng nốt) và `TimedPractice` (theo nhịp, chấm).
    Thang khi "Vào tập luyện": tay phải 1 quãng tám → tay trái → 2 quãng tám → hai tay → 60 · 80 · 100 % → 12 giọng.
  - **Số ngón: sheet không ghi** — đếm 4/10/2026: 29 sheet, chỉ Boogie Woogie có dấu ngón (37). Dùng ngón theo lối dạy chuẩn, ghi rõ
    "lối chuẩn, không phải của thầy".
- **Ý 5 — trùng "trả lời bằng tay · chọn 1 trong 4":** mọi câu quiz trả lời được ba cách: bấm hợp âm trên đàn; **chạm** chọn tên (gốc +
  loại — gốc theo `GOC`, loại lấy từ các vòng đang hỏi); **gõ** tên ("Dm7"; "Bb" = "A#"). **Xong 4/10/2026** (dạng điền ô trống).
- **Ý 6 — mới: "Chuyển hợp âm của thầy"** trong phần 2: app cho giọng, vòng, màu từng hợp âm (của thầy); người tập đánh từng hợp âm
  đúng **thế bấm** của thầy, nối bằng **đường chuyển** của thầy (giữ nốt chung, bè đi ngắn) — chờ đúng nốt bằng `NoteGatedPractice`
  (đủ nốt hai tay); hoặc điền tên (chạm / gõ).
  - Nguồn thế bấm: **đo từ sheet** (bước đo mới): mỗi hợp âm ở phần hát — nốt tay trái, nốt đệm tay phải dưới giai điệu; mỗi bước
    chuyển — giữ nốt chung bao nhiêu, mỗi bè dịch mấy nửa cung, thế đảo hay dùng → thư viện bước chuyển theo bậc, dịch giọng được.
    Bước chuyển không có trong thư viện thì dựng bằng luật nối gần nhất, ghi "suy luận".
  - Lời giải thích mỗi bước chuyển ("giữ La và Đô, Mi lên Fa nửa cung …") sinh từ hai thế bấm. Số ngón: lối chuẩn (như ý 4).

**Lo ngại thêm:**
- Ý 3 nhiều chữ: sinh bằng khuôn để đúng mọi giọng; viết mẫu cho người dùng duyệt văn phong trước khi sinh đủ.
- Ý 6: ở phần hát, tay phải sheet thường mang giai điệu → phải tách nốt đệm khỏi giai điệu (bộ đo Linh Nhi đã có cách: nốt dưới nốt đỉnh
  tay phải); bản xuất máy có thể đọc sai → thư viện chỉ nhận bước chuyển gặp ở ≥ 2 bài.
- Ngón theo lối chuẩn ≠ ngón của thầy — luôn ghi rõ.

#### Dùng lại · dựng mới
- Dùng lại: `TimedPractice` (theo nhịp, chấm, nhật ký) · `noteGatedPlaybackEngine` (chờ đúng nốt) · `OnScreenPiano` +
  `useComputerKeyboard` + `midiStore` · `dungVong` · `srsEngine` · cách chấm hợp âm của `progressionTrainer` · `diatonicChords`
  (`shared/musicTheory/scales.ts`) · `progressionGenerator.ts` (11 vòng, lối đi qua các giọng) · `PALETTE_BY_TONIC_COLOR` · lối đặt
  hợp âm Linh Nhi (`linhNhiHarmony.ts`) · kho `vongThay.json` · lối "Lộ trình bậc / Tập tự do" của `KyThuatBai`.
- Dựng mới: bảng phân bố nốt từng thầy (JSON từ bộ đo) · hàm xếp loại nốt theo lý thuyết · script đo Cà Pháo · kiểu bước "tập nốt"
  cho chờ đúng nốt · bộ chấm chọn nốt theo nhịp · đệm cơ bản · giao diện bốn phần · nội dung 7 bài căn bản.

#### Thứ tự dựng — mỗi bước người dùng dùng thử rồi mới sang bước sau (sửa 4/10/2026 sau bản thử)
1. **Làm thử với Linh Nhi — xong 4/10/2026** (`SO-TAY.md` cùng ngày): bốn phần đầu tiên; ý 1 (phím không ra tiếng) đã sửa.
2. Sửa nhanh trên bản thử: tự do mặc định + ô "Vào tập luyện" (ý 2, cả tab Điệu và Kỹ thuật đánh — Q4); trả lời quiz bằng chạm / gõ
   (ý 5). **Xong 4/10/2026.**
3. Thẻ giải thích phần 1 (ý 3). Mẫu đầu (4/10/2026) người dùng **bác**: *"ko cần kiểu giải thích máy móc … tư duy tại sao thầy lại
   chọn hợp âm đó ở vị trí đó"*. **Dựng lại 7/10/2026** — bốn khối: chồng hợp âm (Stack, Jeff Schneider; mọi màu có trong sheet các
   thầy) + đố chuyển giọng · các lối thay hợp âm trong đệm hát, nghe gốc / thay · lý thuyết từng bậc (vì sao, thay bằng gì) · Linh
   Nhi chọn gì và VÌ SAO (md 13k, ví dụ soát tay). **Chờ người dùng duyệt**; Cà Pháo, Blues làm khi tới thầy ấy (bước 8, 9).
   **Ba chỗ hở (7/10/2026):** tách "của bài / của chị" bằng hợp âm phổ biến của chính bài — xong cho Linh Nhi (`tach_lua_chon.py`,
   md 13l); giai điệu = nốt cao nhất tay phải — đo được tới đâu và đổi cách dùng (13l); **áp cho Cà Pháo — xong 7/10/2026**: tab
   Học cách soạn câu của Cà Pháo mở Phần 1 (cột thầy: 309/400 hợp âm phần hát là của bài, 41/60 chỗ khác soát tay; màu ở tay phải —
   `tools/cho_dat_mau.py`), Phần 2–4 khóa tới bước 8; md Cà Pháo mục "Ai chọn hợp âm". **Blues — xong 7/10/2026**: tab của trang
   Blues mở Phần 1 — mốc so là khung 12 ô của thể loại và hợp âm phổ biến của bài (Rising Sun: gốc 14/14 của bài, hợp âm bảy của
   người phối); md Blues mục 10. Chỗ hở 3 đóng.
4. Gam và hợp âm rải (ý 4): Linh Nhi + căn bản.
5. Đo thế bấm và bước chuyển của Linh Nhi → "Chuyển hợp âm của thầy" (ý 6).
6. **Trang Căn bản**: 7 bài lý thuyết, quiz, gam và hợp âm rải, tập solo chấm theo lý thuyết, đệm cơ bản — dùng lại bước 2–5.
7. Linh Nhi: tập solo theo nhịp, bậc 4–7.
8. **Đo Cà Pháo** (cách đặt hợp âm theo bậc — phần hát xong 7/10/2026; bước chuyển, nhịp đổi hợp âm, phân bố nốt solo theo chất hợp
   âm, thế bấm) — rồi dựng Cà Pháo Phần 2–4.
9. Blues — Phần 1 (cột thầy) xong 7/10/2026; còn Phần 2–4 (nhớ vòng 12 ô, chọn nốt, tập solo) từ số đo ba sheet (md Blues mục 7).
10. Chỉnh ngưỡng theo số đo thật khi người dùng đã tập.

#### Bổ sung 8/10/2026 — người dùng: chồng hợp âm · hợp âm màu · tái hòa âm · nhớ vòng có lựa chọn thay

Người dùng: *"1. về phần chồng hợp âm: Hãy viết rõ tên hợp âm của từng tay, tay trái bấm hợp âm gì thì ghi tên bên phía tay trái và
tương tự với tay phải. Sau đó hãy ghi tên của hợp âm tổng ở phía dưới. Hãy làm thành một trang để học cách bấm hợp âm theo kiểu chồng:
Cho hợp âm rồi hỏi thế bấm chồng 2 tay, cho biết một bên tay rồi hỏi tay còn lại bấm gì để ra được hợp âm tổng. Cho hợp âm gốc rồi bắt
tìm hợp âm màu của nó. Trong vai nhạc sĩ piano chuyên nghiệp bạn hãy lấy các phong cách đặt hòa âm của Linh Nhi, Cà Pháo và Blues để
tham khảo và tăng vốn kiến thức về hợp âm. Có 2 loại là tái hòa âm 1 hợp âm và tái hòa âm theo vòng và ở mỗi bậc hãy cho các lựa chọn
sẵn để tôi đánh theo, ở mỗi lựa chọn hãy giải thích khi nào nên chọn hợp âm đó. 2. Về phần học nhớ vòng hợp âm: Hãy cho những vòng hợp
âm sẵn có hoặc cho tôi tự điền vòng hợp âm rồi sau đó mỗi hợp âm bạn sẽ đưa ra các hợp âm thay thế để tôi chọn, mỗi khi chọn vào bạn sẽ
giải thích tại sao nên chọn hợp âm đó ở vị trí đó, và nó mang lại cảm giác như thế nào khi chơi và sẽ biến vòng đó theo hướng nào."*

- **A. Nhãn hai tay ở thẻ Chồng hợp âm** (nhỏ): tên hợp âm tay trái ghi phía tay trái, tay phải ghi phía tay phải, tên hợp âm tổng ở
  dòng dưới. Dùng `tenHaiTay`, `tenTren` có sẵn (`soanCau/chongHopAm.ts`).
- **B. Trang học chồng hợp âm** — ba dạng đố, trả lời bằng phím đàn (MIDI · bàn phím máy · chạm) hoặc gõ tên: (1) cho hợp âm tổng →
  bấm cả hai tay; (2) cho một tay → tay kia bấm gì để ra hợp âm tổng; (3) cho hợp âm gốc → tìm hợp âm màu của nó. Dùng lại:
  `CONG_THUC` (26 công thức), `theBamChong`, `dungHopAm`, `traLoiTen`, `OnScreenPiano` tô hai màu tay.
- **C. Tái hòa âm — một hợp âm, và theo vòng**: ở mỗi bậc có sẵn các lựa chọn để đánh theo; mỗi lựa chọn có ▶ nghe, phím sáng thế bấm
  và lời "nghe ra sao, khi nào nên chọn, khi nào không". Nguồn lựa chọn — đã có trong app, dùng lại: lối thay lý thuyết
  (`lyThuyetCacBac`, `loiThay`); màu theo thầy (`colorCaPhao`, `mauLinhNhi`, `colorBlueSun`); hợp âm lướt (`suggestSecondaryDominants`,
  `suggestSecondaryIiV`, `suggestDim7Passing`); lối đổi đã đo ở Phần 1 (Cà Pháo ♭VI → iv9, i → I7 trước iv, ii° → II7, I → II13 trước V;
  Linh Nhi ♭VImaj7, ii°7, hợp âm giảm thay V; Blues hợp âm bảy, ♭II7, V7♯9); `analyzeColorConflicts` báo chỗ chỏi.
- **D. Nhớ vòng có lựa chọn thay** (Phần 2 của tab thầy): vòng sẵn (lý thuyết · của thầy) hoặc tự điền (dùng lại ô chọn hợp âm của
  "Vòng tự tạo"); mỗi hợp âm có danh sách thay; chọn vào → lời: vì sao hợp ở vị trí ấy, chơi lên nghe ra sao, vòng rẽ về hướng nào.

**Đề xuất của Claude (chờ người dùng chọn):**
- **C (theo vòng) và D là một công cụ — "vòng + lựa chọn thay"**: dựng một lần; trang mới dùng nó với mọi phong cách, Phần 2 của tab
  thầy dùng nó với lựa chọn của thầy ấy đứng đầu và thêm chế độ đố để nhớ vòng. Lý do có thể không gộp: Phần 2 để NHỚ vòng, trang mới
  để KHÁM PHÁ — nhưng một công cụ hai chế độ phục vụ được cả hai.
- **Lời giải thích viết theo LOẠI thay, không theo từng cặp hợp âm**: chừng 12–15 loại (thêm màu 7 · 9 · 11 · 13; hạ bass một quãng ba;
  át phụ; ii – V phụ; thay tam cung; giảm lướt; mượn giọng cùng chủ âm; treo sus; Picardy; chồng tầng trên…), mỗi loại một đoạn lời
  nhạc sĩ, cộng MỘT câu tính từ chính vị trí ấy (nốt nào dẫn đi đâu, bass đi thế nào, chung nốt nào với hợp âm trước / sau). Lý do:
  viết tay mọi cặp (7 bậc × 2 giọng × ~6 lựa chọn × ngữ cảnh) không làm xuể và sẽ trượt về kiểu liệt kê máy móc người dùng đã bác; sinh
  tự động hết cũng máy móc. Rủi ro: câu tính tự động nghe khô — giữ ngắn, để lời nhạc sĩ làm chính.
- **Đặt ở đâu**: một trang mới "Hợp âm" (tab Chồng hợp âm · Hợp âm màu · Tái hòa âm vòng); trang Căn bản (bước 6) có thể gộp vào đây.
  Cái giá: thêm một nút trên thanh trang — điện thoại cuộn ngang thêm.
- **Thứ tự**: A làm ngay (nhỏ); B và C (một hợp âm) trước bước 4 — người dùng đang học hòa âm; C (theo vòng) + D thay Phần 2 hiện tại.

**Người dùng chốt 9/10/2026:** *"Cà Pháo đã đúng hãy sửa 2 thẻ kia theo. Các mục trong "cần tôi chọn" hãy làm theo đề xuất của bạn"*
— thẻ Linh Nhi, Blues viết lại theo mẫu Cà Pháo (xong 9/10); trang mới "Hợp âm" (tab Chồng hợp âm · Hợp âm màu · Tái hòa âm vòng;
Căn bản gộp vào khi tới bước 6); thứ tự dựng: A → B → C (một hợp âm) → công cụ "vòng + lựa chọn thay" (C theo vòng + D, thay Phần 2)
→ rồi mới bước 4.

#### Lo ngại của Claude — nói trước khi dựng
1. Cột thầy không ra một đáp án duy nhất cho "hợp âm bậc 1 → các bậc còn lại" (mỗi bậc là phân bố; chuyện bậc 1 kéo theo bậc khác
   chưa đo) → đưa loại hay đặt nhất + phương án 2, kèm số lần. Cột lý thuyết thì ra một đáp án.
2. Lý thuyết và thầy có thể ngược nhau (vd lý thuyết cho V7 ở giọng thứ, Cà Pháo đặt vm7) → luôn ghi rõ đâu là lý thuyết, đâu là
   thầy; không trộn hai nguồn trong một câu trả lời.
3. Bám sheet thì vài ngữ cảnh ít dữ liệu (vd solo bossa Cà Pháo chỉ 127 cú tay phải) → luôn hiện n; n nhỏ thì gộp sang ngữ cảnh
   rộng hơn và nói rõ đã gộp.
4. Khối lượng: Căn bản + 3 thầy × 4 phần → làm thử trọn Linh Nhi trước để người dùng duyệt hình thức.

#### Quyết định
- **Người dùng chọn (4/10/2026):** Q1 làm thử với Linh Nhi · Q2 ẩn phần này ở trang Tuấn · Q3 (*"làm q3 theo bạn đề xuất"*) Căn bản
  ở một **trang riêng "Căn bản"** — lý thuyết giống nhau cho mọi thầy, để ở ba trang thầy thì lặp ba lần; học cái chuẩn trước rồi mới
  so thầy. Cái giá: thêm một nút trên thanh trang — điện thoại phải cuộn ngang thêm.
- **Q4 — người dùng chọn (4/10/2026): "q4 làm theo đề xuất của bạn"** — ý 2 áp cả tab Điệu và Kỹ thuật đánh; bấm "Tập" từ trang Hôm
  nay thì mở sẵn chế độ tập luyện (để khỏi phải tick thêm).

**Chưa đo:** cách đặt hợp âm theo bậc, bước chuyển và phân bố nốt solo theo chất hợp âm của Cà Pháo · loại hợp âm bậc 1 có kéo theo
bậc khác không · thang 7 bậc tập solo, ~70 % / ~85 % và mọi ngưỡng · tập nốt được nhận ở từng bậc có giúp người dùng chơi hay hơn
không — chỉ biết khi có lượt tập · Tuấn không có dữ liệu.

---

## 4. GĐ 0 và GĐ 1 — người dùng trả lời 1/10/2026

1. **Đủ 9 điệu** — *"làm 9 điệu"*. Bolero Tuấn, Tango Tuấn chưa có ghi chép duyệt; lượt nghe lại trước khi đóng băng
   (GĐ 1) áp cho cả 9.
2. **Vòng tập do bộ soạn của thầy sinh ra** — *"Tập trên vòng bạn soạn từ các bộ soạn của Cà Pháo, Linh Nhi và bộ soạn
   Blues, làm vòng vừa phải đừng dài quá"*. Thay cho mặc định cũ (vòng của bài gốc).
   - Nguồn vòng (đo trong code): `buildPhraseSection` trả `chords` + `beatsEach` của đoạn dạo · giang · kết; thầy theo
     `soloTeacherOf`. Bốn nút Cà Pháo → bộ soạn Cà Pháo · Slow Rock Lá thư → Linh Nhi · Slow Blues (`bluesClaudeSolo`) và
     Twist (`twistSolo`) → Bộ Soạn Blues · **Bolero Tuấn, Tango Tuấn: câu trả lời không nêu → tạm lấy Linh Nhi, chờ xác
     nhận.**
   - Độ dài — đề xuất của Claude: vòng tập 4 ô (cắt vòng của bộ soạn ở vạch ô); Blues tập từng dòng 4 ô của khung 12 ô.
     Bậc 7 kiểm trên vòng 8 ô (Blues: đủ 12 ô) chưa gặp ở bậc 1–6.
3. **Bậc 7 chấm theo (b)** — *"câu 3 chọn b"* (sau khi giải thích lại bằng ví dụ Am9: app soạn Đô4–Mi4–Sol4–Si4, người tập
   bấm Mi4–Sol4–Si4–Đô5). Nhận thế bấm khác miễn đúng nốt của hợp âm, đúng bass, đúng khung bùm – chát. Bậc 1–6 vẫn chấm
   đúng từng phím. Cách chấm:
   - So theo lớp cao độ — bỏ quãng tám, bỏ thứ tự đảo. Bộ chấm GĐ 0 đã có sẵn (`ignoreOctave`).
   - GĐ 1 thêm kiểm bass: nốt **thấp nhất** quanh mỗi tiếng bass phải đúng lớp cao độ của bass. Thiếu bước này thì tay
     phải bấm La4 cũng được tính là bass La.
   - Bỏ nốt màu (đánh Am thay Am9) = thiếu nốt ấy, tính vào tỉ lệ đúng nốt — vì (b) là "đúng nốt của **Am9**".
4. **Thứ tự điệu** — *"làm như bạn đề xuất"*: Claude đo (tiếng/ô, nốt mỗi cú, độ giãn tay, tempo) rồi đề xuất ở GĐ 1.

---

## 4b. GĐ 1 — người dùng trả lời 2/10/2026

Người dùng trả lời theo số câu hỏi (1–4) rồi theo số bước (5–8) của kế hoạch GĐ 1:

1. **Phiên / điệp** — *"Nếu điệu nào có phiên và điệp khúc mang tiết tấu đàn khác nhau thì hãy làm riêng 2 tiết tấu đó để
   tập"*. **Số đo (2/10, so mốc gõ từng tay trong ô đệm):** Có em chờ — KHÁC cả hai tay (trái 10 vs 16 mốc, phải 10 vs 6) → 2 bài
   tập · Để em — KHÁC cả hai tay (trái 17 vs 11, phải 14 vs 15) → 2 bài tập · Slow Rock Lá thư hai tay — GIỐNG (điệp chỉ thêm
   quãng tám) → 1 bài tập · Slow Blues — GIỐNG tay trái (tay phải do bộ soạn) → 1 bài tập.
   **2/10/2026, sau khi nghe bài điệp:** người dùng bỏ hẳn tiết tấu điệp của Có em chờ và Để em — mỗi nút một bài (9 bài).
2. Slow Blues tay phải: **(a)** đóng băng một bản soạn của Bộ Soạn Blues rồi tập luôn — *"Hãy làm như bạn đề xuất"*.
3. Giọng bậc 1–6: **Đô trưởng / La thứ** — *"Hãy làm như bạn đề xuất"*.
4. Tempo 100 % = **tempo mặc định của nút** — *"Đúng vậy"*.
5. Tab Lộ trình — *"Hãy tích hợp tính năng lộ trình ... vào ý tưởng của tôi về việc làm thành từng trang"* → mục 4c.
6–8. Lưu tiến độ IndexedDB · bậc 7 chấm (b) · màn Hôm nay — *"làm theo đề xuất của bạn"*.

Chưa trả lời: **lực nhấn** (câu 5 cũ) → giữ mặc định của Claude: chỉ hiện nhận xét, không chặn qua bậc, tới khi có số đo lực
thật. **Vòng của Tuấn** (câu 6 cũ) → nay Tuấn có trang riêng, xem mục 4c câu hỏi C.

---

## 4c. Kiến trúc trang theo thầy — ý người dùng 2/10/2026 (kế hoạch để bàn)

**Ý người dùng (nguyên văn tóm):** tạo các trang **Cà Pháo · Linh Nhi · Tuấn · Blues** (Blues coi như một thầy). Mỗi trang có
các tab: **Điệu** (điệu của thầy) · **Kỹ thuật đánh** (kỹ thuật thầy chơi trong các sheet gốc, để tập theo) · **Học cách soạn
câu** (lý thuyết thầy chọn vòng hợp âm, chọn nốt giai điệu để thành câu solo, câu fill, câu chạy). Mỗi trang có khung nốt rơi để
tập, cỡ như tab Luyện đệm. Các tab hiện có (Tái hòa âm, Luyện đệm …) gom thành một trang. Gặp tab nào nên có thì Claude tư vấn.

→ Ba mục của kế hoạch nay là ba tab trong mỗi trang thầy: **Mục 1 = tab Điệu** (lộ trình 7 bậc nằm trong đây), **Mục 2 = tab Kỹ
thuật đánh**, **Mục 3 = tab Học cách soạn câu**.

**Bản đồ nội dung (số trong mã và kho, 2/10):**

| Trang | Tab Điệu (mục 1) | Tab Kỹ thuật đánh (mục 2) — nguồn | Tab Học cách soạn câu (mục 3) — nguồn |
|---|---|---|---|
| Cà Pháo | Ballad cứ đi · Để em · Có em chờ · Bossa CP cải tiến — **4 bài** (bài điệp bỏ 2/10) | CP Lick/Run (`cpPhrases.json`, 9 sheet) · câu fill CP · walking bass, hai tay đan (*Để Em Rời Xa*) | `teachers/ca-phao.md` (1 497 dòng) |
| Linh Nhi | Slow Rock Lá thư hai tay — **1 bài** | Linh Run · rải hai tay · câu fill (7 sheet) | `teachers/linh-nhi-piano.md` (3 637) · `LUAT-SOAN-NOT.md` (1 387) |
| Tuấn | Bolero Tuấn · Tango Tuấn — **2 bài, chưa nghe duyệt** | sheet Tuấn Lưu (PatternTester) | `teachers/tuan-luu-piano.md` (404) |
| Blues | Slow Blues (tay phải: một bản soạn đóng băng) · Twist — **2 bài** | nốt láy, blue note, riff, câu chạy · bass boogie | `BLUES-CHON-HOP-AM-VA-NOT.md` (729) · `TWIST.md` (144) |

**Đề xuất của Claude:**

- **Khung tập dùng chung** cho mọi trang thầy = khung của tab Luyện đệm hiện nay (nốt rơi + bàn phím + chờ đúng nốt / theo nhịp
  + toàn màn hình), trang rộng tối đa 1800 px. Một component, mọi trang gọi lại.
- **Trang thầy không cần dựng lại gì lúc chạy** — bài tập là bản đóng băng (mục 1.6), nên trang thầy chỉ đọc file + phát. Trang
  gom tab cũ vẫn chạy ngầm Tái hòa âm như hiện nay (Luyện đệm cần nó).
- **Trang "Hôm nay"** (tab Claude tư vấn thêm) — lượt nguội + bậc đến hạn kiểm lại + bậc đang học của MỌI thầy trên một danh
  sách, là trang mở đầu. Lý do nên: buổi tập hằng ngày đi qua nhiều thầy; để mỗi trang thầy giữ "hôm nay" riêng thì phải mở bốn
  trang mới biết hôm nay tập gì. Lý do không nên: thêm một trang; ai chỉ tập một thầy một thời gian thì trang thầy là đủ.
- **Tab chưa có nội dung thì ẩn**, hiện ra khi mục 2, 3 có bài. Lý do: 4 thầy × 2 tab chưa có gì = 8 tab bấm vào trống nằm đó
  nhiều tuần. Lý do không nên: muốn thấy khung tổng thể ngay để hình dung — khi ấy hiện mờ "sắp có".
- **Điện thoại:** hàng trang cuộn ngang + hàng tab bên dưới; app nhớ trang / tab mở lần cuối.

**Thứ tự dựng đề xuất:**

1. **Khung điều hướng** — các trang + tab; gom 6 tab cũ vào một trang (không đổi gì bên trong). Trang thầy lúc đầu chỉ có tab
   Điệu, chưa có bài.
2. **Dữ liệu bài tập** (GĐ 1 bước 1–4) — vòng từ bộ soạn, dựng bằng chính app, **người dùng nghe duyệt** (Tuấn bắt buộc), đo độ
   khó → thứ tự trong từng trang.
3. **Tab Điệu của 4 trang** — khung tập dùng chung, lộ trình 7 bậc, lưu tiến độ IndexedDB, bậc 7 chấm (b).
4. **Trang Hôm nay** — nếu người dùng đồng ý.
5. **Tab Kỹ thuật đánh** (mục 2) — bàn chi tiết với người dùng khi tới.
6. **Tab Học cách soạn câu** (mục 3) — bàn chi tiết với người dùng khi tới.

**Câu hỏi để bàn (chờ trả lời):**

A. **Trang Hôm nay** — làm, và là trang mở đầu? (khuyến nghị: có)
B. **Tên trang gom tab cũ** — "Bài hát" (khuyến nghị: nó xoay quanh dựng và tập bài hát) hay tên khác?
C. **Vòng tập của Tuấn** — dùng đường soạn sẵn có của chính nút Tuấn (app đã có nhánh riêng `laBoleroTuan`) thay cho bộ soạn
   Linh Nhi tạm đặt hôm qua? (khuyến nghị: có — Tuấn nay là một thầy riêng)
D. **Trang Linh Nhi chỉ có 1 điệu** — giữ vậy, hay đưa lại một điệu bolero của chị (đã xoá 30/9, lấy lại được từ commit c58be15)?
E. **Tab chưa có nội dung** — ẩn (khuyến nghị) hay hiện mờ "sắp có"?
F. **Tôn Hùng** — app có sẵn nút thầy Tôn Hùng (dạo · giang · kết) và `teachers/ton-hung.md` (375 dòng) nhưng không có trong danh
   sách trang. Để sau, hay làm trang luôn?

**Người dùng trả lời (2/10/2026):** *"Hãy làm theo đề xuất của bạn"* · A làm trang Hôm nay · B trang gom tab cũ tên **"Tái Hòa Âm"** ·
C vòng tập của Tuấn lấy từ **hòa âm Linh Nhi** (không theo đề xuất của Claude) · D Linh Nhi giữ 1 điệu · E tab chưa có nội dung thì
ẩn · F *"Hãy xóa nút Tôn Hùng vì ko có điệu nào và cũng ko lấy kiến thức gì từ thầy đó"* → gỡ nút (mức 1; mã bên trong để nguyên —
87 dòng ở 18 tệp, đan vào bộ soạn chung; gỡ mã cần chụp đầu ra trước/sau, chờ người dùng quyết).
**Mức 2 — không xoá (2/10/2026):** đếm lại 113 dòng / 19 tệp nguồn + 77 dòng / 25 tệp test (87/18 là đếm thiếu). Tôn Hùng không
phải mã chết: Bolero Tuấn giọng thứ lấy câu dạo của anh 2/6 lượt (đo trong app), giang Tuấn gộp ô giang ba thầy, nốt đáp câu fill
theo ao `'ton-hung'`. Xoá hết là đổi tiếng đã nghe — chờ người dùng quyết Tuấn có thôi mượn không (`SO-TAY.md`, cùng ngày).
**Người dùng chọn A (3/10/2026): giữ nguyên** — Bolero Tuấn vẫn mượn câu dạo, giang tấu của Tôn Hùng; mã Tôn Hùng giữ, không xoá mức 2.

**Tình trạng (4/10/2026):**
- Bước 1 — khung điều hướng: **xong** (`AppShell`, `src/thay/`).
- Bước 2 — dữ liệu bài tập (GĐ 1 bước 1–3): **xong — người dùng duyệt 2/10/2026** (*"các vòng hợp âm đã ổn"*). 11 bài
  `src/thay/baiTap/*.json` mang `duyet`; `tools/sinhBaiTap.mjs` giữ, không sinh đè. Bảng vòng: `SO-TAY.md` cùng ngày. Test báo
  khi điệu đổi so với bản duyệt (mục 1.6): **xong 3/10/2026** — ảnh chụp dữ liệu nhạc 9 điệu (`baiTapDuyet.test.ts`). 2 bài **điệp khúc** (Có em chờ, Để em) sinh lại 2/10 rồi người dùng nghe
  và **bỏ hẳn tiết tấu điệp** của hai nút ấy — còn 9 bài (`SO-TAY.md` "Bỏ tiết tấu đệm điệp khúc").
- GĐ 1 bước 4 — đo độ khó → thứ tự: **xong 2/10/2026** (`tools/doKhoBaiTap.mjs`; bảng ở `SO-TAY.md`). Thứ tự trong trang (đo lại trên 9 bài): Cà
  Pháo Ballad cứ đi → Để em → Có em chờ → Bossa CP · Tuấn Bolero → Tango · Blues Twist → Slow Blues. Hai chỗ tay người không đánh được — người dùng duyệt đề xuất 2/10: quãng 10 tay trái Có em chờ điệp giữ nguyên, chấm bỏ
  quãng tám riêng cú vượt tầm tay; 8 nốt cuối câu chạy Slow Blues (dính đầu ô sau) thành nốt láy.
- GĐ 1 bước 5 — thang 7 bậc trong tab Điệu: **xong 2/10/2026** (`KhungLoTrinh.tsx`, `loTrinh.ts`; nhật ký lượt tập IndexedDB `luotTap`).
  Ngưỡng do Claude quyết trong vai gia sư — chưa đo. Bậc 7 đã chấm bỏ quãng tám; kiểm bass + nốt sai để bước 7.
- GĐ 1 bước 6 — "Đã thuộc" + lịch kiểm lại: **xong 2/10/2026** (`tienDoBai`, đọc nhật ký `luotTap`). Quyết định trong vai gia sư:
  lượt nguội = lượt đầu tiên của BÀI trong ngày (siết so với mục 1.3); trượt → về hộp 0 (theo `srsEngine`, thay "lùi hộp" ở mục 1.3).
- GĐ 1 bước 7 — bậc 7 chấm (b): **xong 2/10/2026** — gộp nốt cùng tên, kiểm bass (nốt thấp nhất ở tiếng đánh đúng bass của hợp
  âm), nốt ngoài hợp âm; ngưỡng bass ≥ 90 %, ngoài hợp âm ≤ 10 % (vai gia sư, chưa đo). Kèm sửa lỗi app quên độ trễ đã đo.
- GĐ 1 bước 8 — trang Hôm nay: **xong 3/10/2026** (`homNay.ts`, `TodayPage`): lượt nguội → đang học → bài mới (học song song tối đa 2
  bài chưa qua bậc 6 — vai gia sư) → toàn bộ lộ trình 9 bài; bấm "Tập" mở thẳng đúng bài, đúng bậc. **GĐ 1 xong cả 8 bước.**
- **GĐ 2 — tab Kỹ thuật đánh, bàn riêng từng thầy (3/10/2026).** Người dùng: "đánh giật" = giật ngón (staccato) · *"tôi chỉ muốn
  học đánh giật kiểu Cà Pháo, các thầy khác thì hãy tìm những kỹ thuật đặc trưng của họ"*.
  - **Cà Pháo — đánh giật: xong 3/10/2026** (`KyThuatBai.tsx`, `kyThuat/giatCaPhao.ts`): 9 đoạn cắt nguyên từ *Người hãy quên em đi*
    (sheet duy nhất của anh có dấu giật), thang 4 bậc, chấm cả lúc nhấc phím (`chamNhacPhim`). Ô tick nghe thử giật CHÁT 11 ở Bossa
    CP: dựng rồi BỎ cùng ngày (người dùng: *"bỏ ô tick đó đi"*) — điệu về đúng bản đã duyệt. Chi tiết `SO-TAY.md` cùng ngày.
  - **Cà Pháo — bè quãng 4/5 · láy nửa cung · câu fill 7 kiểu: xong 4/10/2026** (người dùng: *"các kỹ thuật đặc trưng khác của anh
    đâu"* — Claude đã hiểu nhầm câu 3/10 thành "Cà Pháo chỉ học giật"). Mọi kỹ thuật có thêm **Tập tự do**: chỉnh BPM, chọn tay, vẫn
    chấm, không vào thang, không lưu tiến độ. Sửa 2 lỗi chấm láy (chấm nhầm tay không tập; hợp âm có cặp nửa cung bị coi là láy).
    Chi tiết `SO-TAY.md` 4/10.
  - **Linh Nhi — câu chạy tay trái dẫn vào hợp âm sau · Blues — câu lick bè 3/6: xong 3/10/2026** (người dùng: *"làm theo bạn đề
    nghị"*): 7 đoạn từ *Lá Thư Trần Thế*, 6 câu từ *Rockhouse*, khung chung `kyThuat/kyThuat.ts`. **Mục (b) xong 3/10/2026** (người dùng: *"tiếp tục
    đi"*): chấm nốt láy (`chamLay`) · láy quãng 3 ngũ cung (Linh Nhi, 8 đoạn *Biển Tình*) · láy nốt blue (Blues, 4 đoạn Boogie + 5 câu
    Rockhouse). **Tuấn:** không có sheet — ẩn tab. Còn của GĐ 2: chờ người dùng tập thử bằng đàn, chỉnh ngưỡng theo số đo thật.
  - GĐ 0: nhận xét lực nhấn **xong 3/10/2026** (`chamLuc` — chỉ nhận xét, không chặn qua bậc). Còn: thử trên Android thật.
- Thêm ngoài kế hoạch (người dùng 2/10/2026): **Vòng tự tạo** ở tab Điệu — chọn từng hợp âm, hoặc tự soạn vòng 4 ô từ hợp âm chủ
  (trưởng / thứ) theo kho vòng của chính thầy; dựng bằng chính tab Tái hòa âm (`dungVong`), tập bằng Chờ đúng nốt / Theo nhịp.
  **Xong** (`SO-TAY.md` "Vòng tự tạo"). Tập tự do — chưa vào thang bậc, không lưu tiến độ.
- Bước 3–5 (tab Điệu · trang Hôm nay · tab Kỹ thuật đánh): **xong** — GĐ 1 bước 5–8 và GĐ 2 ở trên. Bước 6 — tab Học cách soạn câu
  (GĐ 3): kế hoạch viết và sửa 4/10/2026 theo ý người dùng (Q1 Linh Nhi · Q2 ẩn Tuấn · Q3 trang riêng Căn bản). **Bước 1 — làm thử
  với Linh Nhi: xong 4/10/2026**; người dùng dùng thử, góp 6 ý: ý 1 (phím không ra tiếng) sửa ngay, ý 2–6 vào kế hoạch (mục GĐ 3 ở trên,
  "Bổ sung sau bản thử"). Ý 2 + ý 5 xong 4/10/2026 (ý 2 áp cả tab Điệu, Kỹ thuật đánh — Q4). Thẻ giải thích phần 1 (ý 3) — dựng
  lại 7/10/2026 theo lời bác bản đầu, chờ người dùng duyệt; rồi bước 4 (gam và hợp âm rải).

---

## 5. Chưa đo

- Độ trễ đàn + loa trên máy người dùng. Chú thích trong `audioEngine.ts` ghi Windows "thường 100–250 ms" — chưa đo trên máy
  này.
- Ngưỡng 7 bậc (Claude quyết trong vai gia sư 2/10/2026): chưa đo trên tay người dùng — xem lại khi có ~20 lượt mỗi bậc.
- Lượt nguội có sát "thuộc" hơn hai-lượt-liền **trên chính người dùng** không: lý thuyết, chưa đo.
- Dải lực của đàn MIDI người dùng.
- Người dùng có tập đều không: nhật ký trả lời sau 3 tuần.
- Các điệu đã duyệt chưa nghe lại sau 30/9.

## Nguồn

- Sailer, M. & Homner, L. (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review* 32(1),
  77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w
- Deci, E. L., Koestner, R. & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic
  rewards on intrinsic motivation. *Psychological Bulletin* 125(6).
  https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf
- Salmoni, A. W., Schmidt, R. A. & Walter, C. B. (1984). Knowledge of results and motor learning: a review and critical
  reappraisal. *Psychological Bulletin* 95(3). Tóm lược guidance hypothesis: https://pmc.ncbi.nlm.nih.gov/articles/PMC4893479
