# Bàn giao từ OpenCode (Grok) sang Claude Code

Viết ngày **8/9/2026** (cuối phiên, giờ máy ~21:30). Người viết: OpenCode, model grok-4.6, chạy trên máy này, cwd `D:\KeyTrain`.
Người nhận: **Claude Code**, cùng máy, cùng hai repo.

Đọc hết file này trước khi gõ lệnh. Nó nói: **phiên này đã làm gì (thật, kể cả chỗ làm rồi rút)**, **chốt gì**, **còn dở gì**, và **chỗ lần trước Claude từ chối / bỏ sót — lần này phải xử đủ**.

File bàn giao *ngược chiều* cũ: `Reference/BAN-GIAO-OPENCODE.md` (Claude → OpenCode, 6/9/2026). File này là chiều OpenCode → Claude sau phiên 8/9.

---

## 0. Lần trước Claude từ chối / bỏ sót — lần này phải làm đủ

Người dùng nhắc đúng chỗ này. **Đừng lặp.**

### 0.1 Skill `y-kien-intro` — không được chỉ chép rồi viết «chưa sửa code»

**Luật cũ (Claude từng theo, OpenCode cũng theo rồi bị mắng):** skill nói *chỉ chuyển chữ, hỏi trước khi train, n=1*. Khi người dùng gõ «gửi bình luận / gửi ý kiến», agent chép `Nguon.json` → `linh-nhi-piano.md` rồi **dừng**, ghi «Chưa train — n=1».

**Luật mới, người dùng chốt nguyên văn 8/9/2026:**

> *"sau này trong các bình luận có yêu train hay bất kỳ yêu cầu gì thì cứ gửi đi và sau đó thực hiện yêu cầu trong bình luận."*

Thứ tự bắt buộc:

1. Chép sổ (bảng + bộ ba).
2. Nếu lời bình có việc (train, đối chiếu sheet, sửa bộ soạn, đổi vòng, tiết tấu, **bất kỳ**) thì **làm luôn trong cùng lượt**. Không hỏi. Không «chưa sửa code».
3. Đã ổn không lời = chỉ mẫu.

File skill trên đĩa **đã sửa**: `C:\Users\Tin PC\.claude\skills\y-kien-intro\SKILL.md` (mục 5 + description + trigger «gửi bình luận»). **Cảnh báo:** tool `skill` trong phiên OpenCode **vẫn trả bản cũ** (mục 5 «Không tự sửa code»). Claude phải **đọc file trên đĩa**, đừng tin bản cache/tool.

### 0.2 Đừng chừa thư mục / đừng bỏ nửa việc OpenCode

Bàn giao 6/9 đã ghi: Claude từng không đọc hết `.opencode/`, không xử hết việc OpenCode để lại. Người dùng đã cấm. Lần này: **mọi file OpenCode đụng trong phiên 8/9 đều là việc của bạn** — `phraseSection.ts`, `vonHopAmLinhNhi.ts`, `giaiDieuDaoLinhNhi.ts`, `ReharmHome.tsx`, `nguon.ts`, `OBinhLuan.tsx`, `linh-nhi-piano.md` §16, skill `y-kien-intro`. Không bỏ «phần Grok làm» vì khác agent.

### 0.3 Vite / khung bình luận

OpenCode có lúc bảo «phải bấm phát mới hiện khung» trong khi người dùng **đang phát**. Nguyên nhân thật: Vite chết → `POST /__nguon/cau` fail → `OBinhLuan` `if (!cau) return null`. Đã vá `stt<=0` hiện lỗi. **Đừng kết luận UI thiếu khi chưa kiểm Vite 5173.**

---

## 1. Hai repo — không đổi kiến trúc

| | |
|---|---|
| `D:\PianoBrain\` | đo + tri thức. **Không** `import` KeyTrain. Agent được chép chữ `.md`. |
| `D:\KeyTrain\` | app. Vite 7 + React 19 + TS strict + Tailwind 4. |

Tiếng Việt với người dùng. Mọi kết luận kèm **cỡ mẫu**. Số đo sheet thắng luật bịa. Solo = ghép ô sheet, **không nắn nốt** (đã bác ≥4 lần). `tuyenSolo.ts` chỉ sinh `python tools/tuyen_o.py --sinh`. Trần mặc định 79. Không nới test đỏ sẵn (`daoTruongLinhNhi` CAO ĐỘ).

**Không commit** trừ khi người dùng bảo commit.

---

## 2. Việc đang làm (bối cảnh nhận bàn giao)

Phiên nhận từ Claude: soạn **intro/giang Bolero Tuấn** (và Linh Nhi) đúng sheet + luật; tô màu theo thầy; chuyển Đã ổn / ý kiến từ `Nguon.json` sang `linh-nhi-piano.md`.

Tuấn **0 sheet**. Nút Bolero Tuấn = `bolero-tu-n-improv-bai-04-00001`; `bolero-1` cũng `laBoleroTuan`. Intro Tuấn: A Pùng-Pắp / B LH bass+RH giai điệu; 8 ô + hút V.

Màu 7/9/2026: trưởng = tươi = chắc; thứ = man mác = không chắc + kéo. Không chọn `3`/`♭3` làm màu chủ.

Vite: `vite.config.ts` `server.host: true`, port **5173**. `npm run dev` vẫn `--host 0.0.0.0` (IPv6 localhost từng ECONNREFUSED). Dev hay chết — `node node_modules/vite/bin/vite.js --host --port 5173`.

---

## 3. Việc OpenCode làm trong phiên 8/9/2026 — trung thực, kể cả rút

Làm **theo tai người dùng**, nhiều lần đảo. Đừng giữ bản overlay đã bỏ.

### 3.1 Khung bình luận biến mất

- `OBinhLuan` chỉ hiện khi `cau` khác null; `luuCauDao` fail im lặng.
- Vite 5173 **chết** lúc người dùng đang phát (SPA/PWA vẫn kêu).
- Vá: `luuCauDao` fail → `{ stt: 0 }`; `OBinhLuan` hiện «Không ghi được — sổ chỉ chạy khi mở bằng npm run dev».
- Bật lại Vite v4+v6 **200**.

File: `src/reharm/nguon/nguon.ts`, `OBinhLuan.tsx`.

### 3.2 Tiết tấu intro thứ — **ba lần đổi, lần cuối hoàn tác overlay**

| lần | nguồn nhịp | trạng thái |
|---|---|---|
| 1 | Intro trưởng Đã ổn n=3 (#157 #160 #163 Hoa Trinh Nữ, Linh Nhi) | Người dùng bảo sai nguồn |
| 2 | Intro thứ Đã ổn ≥#207 n=11 (Tuấn) | Pùng-Pắp 0,5/1,5/2,5/3,5 |
| 3 | Solo thứ Cà Pháo n=4 | Người dùng: không giống khung Tuấn trưởng |
| **cuối** | **Xóa overlay.** Nhịp = ô sheet + khung A/B Pùng-Pắp Tuấn | **đang chạy** |

Hằng `TIET_TAU_CA_PHAO_THU` **đã xóa**. `giaiDieuDaoLinhNhi` không còn dán mốc Cà Pháo.

Intro thứ Tuấn: **2/3 ô A** Pùng-Pắp (`laOPap`, `nhieuPap`). **Ô 1 không A** (#426: sheet 7/8 gõ phách 0; Pùng-Pắp bắt 0,5 = nghỉ đầu).

### 3.3 Vòng hợp âm intro thứ

Người dùng: lúc nào cũng `Am G F C Dm Am E E` (Đừng Xa, khóa `tonic%3`).

Đã: xoay mẫu theo `take`; bỏ ostinato i–iv (Người hãy quên, ping2=6, n=1/24 solo thứ); bỏ Am Am sát (#395 Lá Thư giang `im im`); bỏ **Bm / ii** (bài La thứ n=2: **0** ô ii; ii chỉ Rê thứ → Em).

**Đang chạy `MAU_DAO_THU` (6 mẫu, luôn mở i, không bac=2):**

1. Đừng Xa dạo — i ♭VII ♭VI ♭III iv i (C/Bb/F như ảnh sheet)
2. Rừng Lá — i ♭VII ♭III i v i
3. Một Cõi — i iv V7…
4. Hoa Phượng — **mở i** rồi iv ♭VI V7 (cũ mở iv — đã sửa)
5. Lá Thư giang — i ♭III iv v… (**bỏ ii**)
6. Chiếc Lá giang — i V7 iv i ♭vii iv

Pad thiếu ô bằng **i/iv**, không xoay thêm trưởng. Trưởng trơn ≤~44% (Linh Nhi dạo **30%** 11/37 ô n=5; Đừng Xa **44%**).

**Mọi vòng solo mở chủ âm** (`moChu`). Giang thứ xoay về mở i (test giangThu: `[0, 7, 10]` không còn `[10, 8, 3]`).

**Trưởng:** `MAU_DAO_TRUONG` xoay theo `take` (cũ `tonic%3` = một vòng mãi). Ba mẫu đều mở I.

Tuấn thứ **luôn** dùng mẫu sheet (`phraseChords` `daoThu` khi `tuan && minor`) — tick UI vẫn tắt mặc định nhưng code ép cho Tuấn.

### 3.4 Train theo ý kiến (sau khi đổi luật «gửi rồi làm»)

| # | ý | code |
|---|---|---|
| 191 / 337 | tươi, rải 1-3-5 trưởng trong bài thứ | phạt `raiT≥0,7` — **trước phiên**, Claude/OpenCode cũ |
| 393 | đầu câu C–G–E (♭III) | phạt ô1 mở đủ {3,7,10}. Sheet intro thứ **0/8** |
| 395 | sau E lặp/lủng; giữ tiết tấu đầu | ô2+ phạt lap>25% / ≥3 nốt trùng. Sheet ô2+ lap tb **9,4%** n=56 |
| 411 | E (V) đúng màu thứ; G/C phô | **không phạt V**; ♭VII/♭III rải nặng hơn. Sheet ♭VII rai 50–67%, ♭III 57–75%; #411 G 80% C 83% |
| 412 | ô sau thưa | ô2+ `<5` nốt phạt. Sheet ô2 min 5, ô3 min 7 n=8 |
| 426 | màu thứ đạt; Dm đầu nghỉ lâu | ô1 không Pùng-Pắp |

Đã ổn mẫu Tuấn thứ trong sổ: **#386 #406** (cùng bài *Để Nhớ Một Thời Ta Đã Yêu*).

### 3.5 UI nghe lại Đã ổn

Không phải tick xoay tự động (bản đầu — người dùng bác). **`<select>`** cạnh nút phát: chọn `#stt` → phát đúng câu, không soạn mới. `— soạn mới —` = phát bình thường. `layCauOn` + `suKienTuNot` trong `nguon.ts`.

### 3.6 Câu chạy intro thứ

Người dùng: thêm Pùng-Pắp + chạy Cà Pháo → OpenCode gắn **10 nốt móc ba** (`motCauChayDai`) trên intro thứ → **bác**.

**Đang chạy:**

- Mặc định: chép sheet — ngắn 4 (Cà Pháo intro thứ, bậc −4,0,3,7) + vừa 6 (Linh Nhi Một Cõi dạo, 2,3,2,0,−1,−4). `datChaySheet`, vào phách 1,5.
- Tick **Câu chạy tự soạn (nghe thử)** (mặc định tắt): `motCauChay` 4 hoặc 6 nốt móc kép, **không** 10 nốt móc ba.
- Giang vẫn được `motCauChayDai` (không đụng trong yêu cầu intro).

### 3.7 File đã đụng

| file | việc |
|---|---|
| `src/reharm/style/vonHopAmLinhNhi.ts` | mẫu + take + moChu + bỏ ii + pad i/iv |
| `src/reharm/style/phraseSection.ts` | `laOPap` / `nhieuPap` / `datChaySheet` / `chayNgan` |
| `src/reharm/style/giaiDieuDaoLinhNhi.ts` | phạt #393 #395 #411 #412; **xóa overlay nhịp** |
| `src/reharm/ReharmHome.tsx` | select Đã ổn; tick chạy tự soạn; `daoThu` ép Tuấn thứ trên lưới |
| `src/reharm/nguon/nguon.ts` | `layCauOn`, `suKienTuNot`, fail → stt 0 |
| `src/reharm/nguon/OBinhLuan.tsx` | hiện lỗi khi không ghi sổ |
| `src/reharm/style/__tests__/vonHopAmLinhNhi.test.ts` | Bm, mở chủ, daoTruong xoay take |
| `src/reharm/style/__tests__/boleroLinhNhi.test.ts` | chạy thứ; tick chayNgan |
| `src/reharm/style/__tests__/giaiDieuDaoLinhNhi.test.ts` | #393 không mở C–E–G |
| `PianoBrain/.../linh-nhi-piano.md` | bảng 16 + bộ ba #373 #386 #393 #395 #406 #411 #412 #426 |
| `~/.claude/skills/y-kien-intro/SKILL.md` | gửi rồi **làm** |

`tuan-luu-piano.md` **lệch code**: vẫn ghi intro thứ 1×4 xuống, A-bar 1/3, mẫu n=3. **Chưa cập nhật.** Claude nên sửa cho khớp mục 3.2–3.6.

---

## 4. Việc định làm tiếp — Claude nắm rồi làm

Không phải backlog bịa. Đây là chỗ phiên dừng khi người dùng bảo viết bàn giao.

1. **Cập nhật `tuan-luu-piano.md` §3–3.2** cho khớp code (2/3 Pùng-Pắp trừ ô1; vòng 6 mẫu mở i không ii; chạy sheet mặc định; tick tự soạn; trưởng xoay take).
2. **Đồng bộ skill `y-kien-intro`** nếu Claude/Cursor còn bản cũ ở `PianoBrain/.claude/skills/` hoặc `.opencode/skills/` — lấy bản `C:\Users\Tin PC\.claude\skills\y-kien-intro\SKILL.md`.
3. **Nghe lại #426** sau khi ô1 không Pùng-Pắp — người dùng bảo giữ màu, chỉ nghỉ đầu. Nếu còn nghỉ: đo at0 ô1 trên câu mới.
4. **Select Đã ổn** không lọc giọng/điệu — trộn Linh Nhi trưởng #157 với Tuấn thứ. Lọc theo `giong` + Bolero Tuấn nếu người dùng kêu.
5. **`npm run dev` vẫn `--host 0.0.0.0`** trong `package.json` trong khi `vite.config` `host: true`. IPv6 localhost vẫn có thể chết. Nên thống nhất `--host`.
6. **Test full:** phiên này chạy từng file (`vonHopAm`, `giaiDieuDao`, `boleroLinhNhi`, `nguon`). **Chưa** `npx vitest run` cả repo lúc bàn giao. Test đỏ sẵn cũ (`daoTruongLinhNhi` CAO ĐỘ) **đừng nới**.
7. **Giang tấu** ít đụng hơn intro. #347 Đã ổn giang (ảnh UI) — kiểm đã vào sổ 16c chưa; cửa 30 phút có thể đã trượt.
8. Người dùng có thể tiếp «gửi ý kiến» — **chép + train trong một lượt**.

---

## 5. Luật kỹ thuật đừng phá

- Không nắn cao độ ô sheet. Phạt = chọn ô khác.
- `gopThay` chỉ Tuấn; GHÉP NGƯỢC (`giaiDieuDaoLinhNhi.test.ts`) không `gopThay`.
- Kết luận = cỡ mẫu. Khác mẫu số thì không so.
- PianoBrain không import KeyTrain.
- `Nguon.json` gitignore — đừng commit.

---

## 6. Câu Đã ổn / Chưa ổn phiên này (sổ Linh Nhi)

Đã ổn Tuấn thứ: **#386 #406** (*Để Nhớ Một Thời Ta Đã Yêu*).

Chưa ổn đã chép + phần lớn đã train: **#373 #393 #395 #411 #412 #426** (cùng bài, La thứ, Bolero Tuấn).

Trước phiên (Claude): #191 #329 #333 #337 intro; #262 #272 #278 #290 giang; Đã ổn trưởng #157 #160 #163; thứ Linh Nhi #182.

---

## 7. Lệnh người dùng hay gõ

| gõ | làm |
|---|---|
| gửi ý kiến / gửi bình luận | skill y-kien-intro: chép 30 phút **rồi train/sửa** |
| train đi / soạn lại / đối chiếu sheet | sửa generator, không chỉ chép |
| phát lại | không commit |

Vite: `node node_modules/vite/bin/vite.js --host --port 5173` — kiểm `http://127.0.0.1:5173` **và** `http://[::1]:5173`.

---

Hết. Làm tiếp từ mục 4. Đừng bỏ việc OpenCode vì «không phải Claude viết».
