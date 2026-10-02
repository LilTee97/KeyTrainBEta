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

## 5. Chưa đo

- Độ trễ đàn + loa trên máy người dùng. Chú thích trong `audioEngine.ts` ghi Windows "thường 100–250 ms" — chưa đo trên máy
  này.
- Ngưỡng cửa đạt (90% · 40 ms): đoán.
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
