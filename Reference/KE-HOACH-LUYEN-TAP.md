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
5. **Nhật ký lượt tập** — kho IndexedDB mới, chỉ ghi thêm, mỗi lượt một dòng. Trạng thái bậc là hàm thuần đọc nhật ký:
   một nguồn sự thật, và có sẵn số ngày tập cho mục 1.2.

**Demo:** một điệu, một vòng 4 hợp âm, bảng kết quả cuối lượt. Người dùng tập thử → đo phân bố lệch thật → chốt ngưỡng.

### GĐ 1 — Mục Điệu (bàn với người dùng trước khi dựng)

- Trước khi đóng băng: người dùng nghe lại các điệu đã duyệt — chưa ai nghe lại sau đợt gỡ code dùng chung 30/9.
- Chỉ khung đệm lặp; tắt mọi câu chèn (fill, câu chạy, lick, solo). Câu chèn thuộc GĐ 2.
- Cách xuất bản đóng băng — **chưa chọn**: (a) gọi bộ dựng ngoài React nếu tách được rẻ; (b) nút xuất trong app lấy đúng
  dòng thời gian tab Luyện đệm đang có, chạy qua 12 giọng (`onTone`). Chọn sau khi đọc đường dựng từng điệu trong
  ReharmHome.
- Tab "Lộ trình": điệu → bậc → lượt.

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

## 4. Chờ chốt — GĐ 0 và GĐ 1

1. Mục 1 làm 7 điệu đã duyệt, hay đủ 9? **Mặc định 7** — Bolero Tuấn, Tango Tuấn chưa có ghi chép duyệt; vào sau khi
   người dùng nghe duyệt.
2. Vòng tập = vòng của chính bài gốc mà điệu rút ra; vòng kiểm (bậc 7) = vòng bài khác, giọng khác? **Mặc định: có.**
3. Bậc 7 chấm đúng y thế bấm của app, hay nhận thế bấm khác miễn đúng nốt hợp âm, đúng bass, đúng khung tiếng?
   **Mặc định: nhận** — đệm hát thật không ai bấm y một thế, mà không có nốt rơi thì người tập không biết thế của app.
4. Thứ tự điệu dễ → khó: Claude đo (tiếng/ô, nốt mỗi cú, độ giãn tay, tempo) rồi đề xuất? **Mặc định: có.**

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
