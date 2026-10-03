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

### GĐ 3 — Mục Lý thuyết (bàn với người dùng trước khi dựng)

- Nguồn: PianoBrain `knowledge/` — `teachers/ca-phao.md` (1 497 dòng) · `teachers/linh-nhi-piano.md` (3 637) ·
  `BLUES-CHON-HOP-AM-VA-NOT.md` (729) · `LUAT-SOAN-NOT.md` (1 387) · `TWIST.md` (144). Viết cho agent đọc, đầy bẫy đo và ý
  kiến khi nghe → phải viết lại thành bài.
- Mỗi bài: chữ + nút nghe ví dụ (bài nào, ô nào) + nốt trên phím. Câu hỏi ôn vào Leitner. Không dựng hệ quản lý bài học.
- Mỗi câu trả lời "tại sao" gắn nhãn số đo (n = ?) · suy luận · ý người dùng. Nhiều câu chưa đo — vd chưa có thời điểm
  giọng hát thật, nên "fill rơi đúng chỗ ca sĩ nghỉ" là suy luận. Không dạy suy luận như sự thật.

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

**Tình trạng (2/10/2026):**
- Bước 1 — khung điều hướng: **xong** (`AppShell`, `src/thay/`).
- Bước 2 — dữ liệu bài tập (GĐ 1 bước 1–3): **xong — người dùng duyệt 2/10/2026** (*"các vòng hợp âm đã ổn"*). 11 bài
  `src/thay/baiTap/*.json` mang `duyet`; `tools/sinhBaiTap.mjs` giữ, không sinh đè. Bảng vòng: `SO-TAY.md` cùng ngày. Còn: test
  báo khi điệu đổi so với bản duyệt (mục 1.6) — chưa làm. 2 bài **điệp khúc** (Có em chờ, Để em) sinh lại 2/10 rồi người dùng nghe
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
  - **Cà Pháo — đánh giật: xong 3/10/2026** (`KyThuatGiat.tsx`, `kyThuat/giatCaPhao.ts`): 9 đoạn cắt nguyên từ *Người hãy quên em đi*
    (sheet duy nhất của anh có dấu giật), thang 4 bậc, chấm cả lúc nhấc phím (`chamNhacPhim`). Kèm ô tick nghe thử giật CHÁT 11 ở
    Bossa CP. Chi tiết `SO-TAY.md` cùng ngày.
  - **Linh Nhi · Tuấn · Blues — kỹ thuật đặc trưng: đang tìm**, bàn với người dùng trước khi dựng.
  - Còn của GĐ 0: chấm tiếng nhấn (lực) · thử trên Android thật.
- Thêm ngoài kế hoạch (người dùng 2/10/2026): **Vòng tự tạo** ở tab Điệu — chọn từng hợp âm, hoặc tự soạn vòng 4 ô từ hợp âm chủ
  (trưởng / thứ) theo kho vòng của chính thầy; dựng bằng chính tab Tái hòa âm (`dungVong`), tập bằng Chờ đúng nốt / Theo nhịp.
  **Xong** (`SO-TAY.md` "Vòng tự tạo"). Tập tự do — chưa vào thang bậc, không lưu tiến độ.
- Bước 3–6: chưa làm.

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
