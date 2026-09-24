# Bàn giao cho phiên mới — KeyTrain, tính tới 24/9/2026

Đọc file này đầu phiên là nắm được KeyTrain đang ở đâu. Nó **không thay** `SO-TAY.md`
(3.185 dòng, nhật ký kỹ thuật đầy đủ) — nó là bản đồ chỉ vào đúng chỗ cần đọc, cộng
danh sách việc đang dở và những lỗ chưa đo.

Ngày viết: 24/9/2026. Người viết: Claude Opus 5 (phiên trước). Nhánh
`thuoc-cham-cau-solo`, **đi trước `origin` 54 commit** — chưa push.

---

## 1. Ba luật của người dùng, đứng trên mọi thứ khác

1. **Chỉ dẫn mới của Codex thắng cách soạn cũ.** Người dùng chạy ba agent trên hai repo
   (`D:\KeyTrain`, `D:\PianoBrain`): Claude Code, OpenCode, Codex. Codex đưa phương pháp
   soạn; Claude thi hành. Prompt/bàn giao **mới nhất** của Codex đứng trên mọi ghi chép cũ
   — kể cả `SO-TAY.md`, các file bàn giao và comment trong mã. Ghi chép cũ chỏi với chỉ
   dẫn mới thì **nói ra chỗ chỏi rồi làm theo cái mới**, đừng viện sổ để từ chối.
2. **Câu solo là thứ được SOẠN, không sinh bằng xúc xắc.** Soạn theo tư duy của thầy, rút
   từ bản ký âm của chính thầy ấy. "Tất định theo take" ≠ "đã soạn": hàm băm dùng thay
   xúc xắc vẫn là bốc thăm. Hỏi mỗi nốt: *nốt này đến từ đâu?* Trả lời được bằng "ô số mấy
   của bản ký âm nào" thì là soạn.
3. **Dừng để người dùng nghe.** Làm đúng phạm vi được giao — một vòng train, một thầy,
   một điệu, một loại đoạn. Không tự chạy vòng thứ hai, không sửa tiếp vì một chỉ số chưa
   đẹp, và **không nói "đã xong" trước lượt nghe**. Mọi mốc "đã duyệt" trong tài liệu là
   xác nhận bằng tai của người dùng, không phải suy từ test xanh.

Kèm theo: mỗi lần commit phải cập nhật `Reference/SO-TAY.md` (mục `###`, ghi cái bẫy và
số đo, hằng số thì ghi giá trị cũ + triệu chứng để lùi); `git add` từng file, không `git add .`.

---

## 2. Trạng thái hiện tại — hai bộ soạn Cà Pháo

Toàn bộ công việc gần đây xoay quanh **thầy Cà Pháo**. Hai nhánh tách bạch, đừng trộn:

### Bossa CP cải tiến — ĐÃ DUYỆT, ĐÓNG BĂNG

- Điệu `ca-phao-bossa-improved`, khung đệm **11 tiếng / 8 phách** (duyệt 13/9).
- Bộ ba solo giọng thứ (intro · giang · outro) người dùng duyệt bằng tai **12/9**.
  Giang: `Am9 | Bm7b5 E7 | Am11 | Bm7b5 E7 | Am9 | Bm7b5 E7 | Am11 | ii–V về đích`.
  Outro: `Am11 | Bb9 E7b13 | Am9 | Bm7b5 E7 | Am9 | Am`.
- **Không sửa gì ở đây** trừ khi người dùng nêu rõ chỗ lệch thuộc *tiết tấu*, *hòa âm* hay
  *giai điệu* — và chỉ đổi một mặt mỗi lần.
- Đọc: `CA-PHAO.md` mục "Bossa CP cải tiến", `CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md`.

### Ballad CP — ĐANG TRAIN, chưa duyệt

- 6 điệu trong `styleLibrary/caPhaoBallad.ts`: `short-arp`, `syncopated`, `sparse`,
  `sixteenths`, `late-arp`, `signature`; cộng các bản theo bài (`co-em-cho`,
  `ngay-mai-em-di`, `acdd`) và bản điệp khúc riêng.
- Bộ soạn: `style/cpBalladComposition.ts` (578 dòng), `cpBalladConnections.ts`,
  dữ liệu `cpBalladSolos.json`.
- Vòng train gần nhất (24/9, `1074066`): sửa **bố trí mẫu giang tấu** theo phản hồi #1348
  — khi mẫu trước có ≤10 điểm gõ RH/8 phách thì tăng chi phí chọn mẫu tiếp cũng ≤10.
  Là ưu tiên mềm, không loại mẫu khỏi kho, không thêm nốt để lấp nghỉ.
- **Chưa nghe duyệt.** Đọc: `CP-BALLAD-COMPOSER-2026-09-23.md`, `CA-PHAO.md` ba mục đầu.

### CP Lick / CP Run — đã duyệt 14/9, đóng băng ở `bcddfd0`

`licky/cpLick.ts` + `cpPhrases.json` (đo từ 9 sheet Cà Pháo bằng `tools/cp_lick_corpus.py`).
Chọn màu **Cà Pháo** là tự dùng CP Lick/Run thay Licky. Ngoại lệ đã được phép: câu
fill/run/nối được phối lại đệm cục bộ theo hai tay của sheet — **không** mở rộng ngoại lệ
này sang khung Bossa đã duyệt.

---

## 3. Vòng phản hồi: `Nguon.json`

Sổ câu đã phát, ở gốc repo. Cấu trúc: `cau.cot` + `cau.dong` (bảng), `binhLuan.cot/dong`.

- **1.355 câu**, 65 bình luận. Đánh giá: 51 `on` · 72 `chua-on` · còn lại trống.
- Bình luận mới nhất **#1348** (Có Em Chờ, G trưởng, giang 12 ô): *"Từ chỗ Gadd2 đầu tiên
  trở về cuối câu thì tiết tấu bị khựng lại và ngắt quãng quá nhiều"* — đã xử ở `1074066`.
- #1350, #1353 (dạo), #1354 (giang) được chấm **đã ổn** — giữ nguyên câu lưu làm đối chiếu,
  **không tái soạn đè**. SHA-256 của bốn câu này ghi trong `CP-BALLAD-COMPOSER-2026-09-23.md`.
- Quy trình: người dùng bấm phát → câu tự lưu vào sổ → họ chấm ổn/chưa ổn + ghi ý kiến →
  phiên sau đọc sổ, xử đúng bình luận chưa xử lý. **Không sửa dòng sổ nào.**

---

## 4. Test và build — số thật, đo ngày 24/9

`npx vitest run`: **2.745 qua / 7 đỏ** (171 file, 6 file đỏ).

Sáu đỏ **có từ trước**, cố ý chưa sửa (đừng nới ngưỡng cho xanh — người dùng đã cấm):
`phraseAcrossBar`, `daoTruongLinhNhi` (CAO ĐỘ), `handSplitAudit`, `sietHopAm`,
`tuyenSolo` (2 test NEO TẦM ÂM).

Một đỏ **mới, chưa ai ghi trong sổ**: `leftArpeggioAboveRoot.test.ts > ca-phao-ballad-late-arp`
— *"C phách 2: expected 36 to be greater than or equal to 48"*, tức câu rải tay trái tụt
xuống dưới nốt gốc ở điệu `ca-phao-ballad-late-arp` (thêm ở `b73428c`, 20/9). Luật này do
commit `3ed4f33` đặt ra. **Chưa xác định** là lỗi của điệu mới hay luật cần nới cho điệu
này — hỏi người dùng trước khi sửa.

`npx tsc --noEmit -p tsconfig.app.json` sạch. Production build qua, còn cảnh báo bundle >500 kB.

---

## 5. Dev server

`npm run dev` → http://localhost:5173/ (LAN http://192.168.1.150:5173/).

**Chạy nền trong phiên Claude là nó chết theo phiên** — đã lặp 7 lần. Cách đúng: chạy
tách hẳn bằng `Start-Process` (PowerShell), hoặc bảo người dùng nháy đôi
`D:\KeyTrain\chay-dev.cmd` (file này **chưa commit**, đang là untracked duy nhất).

Trang phụ: `tools/bossa-intro.html` — nghe riêng intro/giang/outro theo giọng và bản 1–4,
dùng chính `buildPhraseSection` và audio engine thật, không ghi vào bài đã lưu.

---

## 6. Kho bên cạnh: PianoBrain

`D:\PianoBrain` là kho tri thức; KeyTrain là app. Sheet Cà Pháo ở `video/Ca_Phao/`, mốc
đoạn ở `tools/sheet/corpus.json`, hồ sơ thầy ở `knowledge/teachers/<id>.md`.

**Luật: file md của thầy CHÍNH LÀ thầy ấy** — nói "trong vai <thầy>" thì đọc file md đó
trước khi trả lời. Đã có `linh-nhi-piano.md`, `ca-phao.md`, `ton-hung.md`.

Cà Pháo hiện có **9 sheet trong kho, 7 đã chia đoạn đủ**: Hồng Kông 1 (Đô trưởng), Có Em
Chờ (Mi giáng trưởng), Ngày mai em đi (Mi giáng trưởng), Người hãy quên em đi (**bossa**,
Rê thứ), Để Em Rời Xa (Rê thứ → Mi giáng thứ), Chưa Bao Giờ (Fa thứ), Chúng Ta Không
Thuộc Về Nhau (La thứ). Tức **ballad: 3 trưởng · 3 thứ**.

Bẫy đo đã sập trong bộ đọc sheet (`tools/sheet/README.md` mục 5, sửa 11/9): nốt `<chord>`
từng bị gán sai thời điểm và nốt nối bị đếm như nốt mới → **đếm đầu nốt ≠ đếm lần gõ**.
Mọi số "nốt/ô" đo trước 11/9 ở ô có hợp âm bấm đều có thể lệch.

---

## 7. Đang dở — cần xử trước khi làm việc mới

| việc | chỗ | trạng thái |
|---|---|---|
| Nghe duyệt ballad CP sau `1074066` | app, điệu ballad Có Em Chờ | chờ người dùng nghe |
| Test đỏ mới `ca-phao-ballad-late-arp` | `leftArpeggioAboveRoot.test.ts` | chưa ai ghi sổ, chưa quyết hướng |
| `chay-dev.cmd` chưa commit | gốc repo | hỏi người dùng có giữ không |
| 54 commit chưa push | nhánh `thuoc-cham-cau-solo` | chưa hỏi người dùng |
| Kém duyên · Yêu xa chưa xác nhận giọng | PianoBrain corpus | nên chỉ dùng **thời gian**, không dùng cao độ/hòa âm hai bài này |
| Phiếu hỏi nguồn CP Lick | `PHIEU-HOI-CP-LICK-2026-09-13.md` | để ngỏ |
| Bốn giọng thứ F·F#·G·Ab | Bossa CP intro | nét không lọt tầm app 62–79 → báo "Tầm nốt quá hẹp", cần bật ô **Trần mở** (84). Chủ ý Codex: tầm hẹp thì báo, **không gập nốt** |

---

## 8. Chưa đo — lỗ còn lại

Ghi thẳng để phiên sau không tưởng là đã biết:

- **Không có timestamp giọng hát thật.** Chỗ nghỉ để chêm câu suy từ cấu trúc lời, không
  phải từ bản thu. Mọi câu "fill rơi đúng chỗ ca sĩ nghỉ" là suy luận, chưa đo.
- **Không có giai điệu hát đầu vào**, nên không khẳng định được tension của màu hợp âm hợp
  với mọi nốt hát trong mọi bài.
- **Velocity câu CP (52, nhóm cuối 58)** là lựa chọn biên soạn của KeyTrain, **không** đo
  lực từ audio sheet.
- **Chưa truy được seed/source của câu #1348**: sổ không lưu seed, nguồn, hay thời lượng
  từng hợp âm. Các ứng viên khớp hình nhịp nêu trong tài liệu là đối chiếu hình, không phải
  truy vết chính xác.
- **Bossa trưởng chưa có kho riêng** — hiện biên soạn từ nguồn giọng thứ.
- **"Tay trái điệp dày hơn phiên" ở Ngày mai em đi**: người dùng nghe thấy vậy, chưa đo.
- Toàn suite chưa được chạy lại sau mỗi commit train gần đây; các con số test trong tài
  liệu 23–24/9 là **test liên quan** (93–121 test), không phải toàn bộ.

---

## 9. Đọc gì, theo thứ tự

1. File này.
2. `CLAUDE.md` (34 dòng) — kiến trúc, 4 tính năng nền tảng, quy ước.
3. `Reference/CA-PHAO.md` — ba mục đầu là mốc 24/9; mục "Bossa CP cải tiến" là phần đóng băng.
4. `Reference/SO-TAY.md` — **đọc từ cuối lên**; các mục 13–19/9 là mốc đang có hiệu lực.
5. Khi chạm bộ soạn ballad: `CP-BALLAD-COMPOSER-2026-09-23.md`.
6. Khi chạm Bossa: `CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md` + `PHUONG-PHAP-SOAN-OUTRO.md`.

Đừng đọc hết 25 file trong `Reference/` — phần lớn là mốc đã bị mốc sau thay.
