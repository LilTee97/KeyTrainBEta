# Ballad cứ đi — đệm rải hai tay của Cà Pháo (*Anh Cứ Đi Đi*, từ ô 9)

29/9/2026. **ĐÃ NGHE DUYỆT — mặc định 30/9/2026**: mỗi hợp âm một lượt 8 tiếng · solo · lick · run Cà Pháo khớp sóng rải · câu fill
Cà Pháo (bảy kỹ thuật xoay vòng, hợp âm lướt). Mọi ô tick của nút đã gỡ. Nút riêng `ca-phao-ballad-cu-di` trong nhóm Ballad, ♩ 63. Khác nút **Ballad ACDD** của Codex
(nền dặm ô 40, xen "câu tám tiếng" ô 10 ở 2/8 ô — `CA-PHAO-BALLAD-ACDD.md`): ở đây rải hai tay là nền của mọi ô.

Người dùng: *"hãy phân tích kỹ lại sheet Anh cứ đi đi của Cà Pháo để trích tiết tấu đệm rải ballad (từ ô 9 trở đi). Từ đoạn đó thì
CP đệm bằng kỹ thuật rải hợp âm kết hợp 2 tay và về sau có thể có thêm một số kỹ thuật khác. Tạo thành nút Ballad cứ đi"*.

## Nguồn và cách đo

- `D:/PianoBrain/video/Ca_Phao/Anh Cu Di Di- Ca Phao.mxl` (SHA-256 `a52e7265…cdba4`); đoạn theo `ANH-CU-DI-DI-CP-PHAN-DOAN.md`
  (cửa lời 33 · 37 · 62 đã chốt; ô chứa ranh giới không đo).
- `python -B scripts/audit_cp_acdd_rai.py` (bảng theo đoạn) · `--o 9 16` (chuỗi rải từng ô). Lưới móc kép, nối dấu nối trong ô, bỏ
  nốt láy (`joined_attacks` của `audit_cp_acdd.py`). **0 cú lệch lưới** ở mọi đoạn.
- **Giọng Fa thứ**: hoá biểu 4 giáng; hợp âm cuối Fm7; hay gặp nhất Bbm7 (10) · Fm (7) · Db (7).
- **Pha vạch nhịp đúng**: bass đầu ô là gốc hợp âm in ở 8/8 · 8/8 · 16/16 · 8/8 · 16/16 ô (khác *Để Em Rời Xa* lệch một phách).
- **Lúc hát nốt đỉnh tay phải là giai điệu lời**: 48/62 nốt đỉnh ô 9–16 trùng phiên 2 (38–45). Nhưng nốt tay phải trong CHUỖI RẢI
  cũng lặp ở mọi lượt phiên (ô 2 · 10 · 39: Db4 F4 Db5 ở phách 2–2¾) — so hai lượt nhận nhầm chúng là giai điệu. Nên phân loại:
  nốt tay phải nằm trong chuỗi rải nối tiếp tay trái = ĐỆM; nốt đỉnh ngoài chuỗi = giai điệu.

## Số đo

**Chuỗi rải hai tay** = móc kép liền nhau đều có tiếng, cao độ đi lên (tay trái: nốt của cú; tay phải: nốt thấp nhất), dài ≥ 4,
có cả hai tay.

| đoạn | ô có chuỗi rải hai tay | chỗ chuyển tay trái → phải |
|---|---|---|
| phiên 1a (1–8) | 3/8 | — (tay trái rải móc ĐƠN: F2 C3 G3 Ab3) |
| **phiên 1b (9–16)** | **7/8** | phách 2¼: 4 · 2: 2 · 3½: 2 · 4: 2 · 4¾: 1 |
| điệp 1 (17–32) | 2/16 | — |
| phiên 2 (38–45) | 5/8 | phách 2¼: 3 |
| điệp 2 (46–61) | 6/16 | — |

→ Rải hai tay là lối của **phiên** từ ô 9. Điệp là "kỹ thuật khác": tay phải giai điệu quãng tám (ô 17: Ab4+Ab5 · G4+G5 …), dặm cụm
ba nốt (ô 18 · 47: Ab4+Db5+Ab5), tay trái rải nửa vời xen bass quãng tám — **chưa dựng vào nút**.

**Ô 9–16, từng ô** (bậc so gốc hợp âm in; T = trái, P = phải):
- ô 9 Fm: T1 T5 T8 T9 Tb10 → P12 P15 P19 (F2 C3 F3 G3 Ab3 | C4 F4 C5), rồi T8 Tb10 T12 → P15 ở nửa sau;
- ô 10 Bbm: T1 T5 T8 T9 → Pb10 P12 Pb14 Pb17 (Bb2 F3 Bb3 C4 | Db4 F4 Ab4 Db5);
- ô 11 Eb7: T1 T5 T8 T10 T12 → Pb7 Pb7; ô 14 Bbm: T1 T5 T9 Tb10 → P12;
- ô 13 Db · ô 15 G7→Db7: chuỗi bắt đầu ở phách 1&; ô 12 Ab: tay trái rải móc đơn, không chuỗi; ô 16 C7: câu tay trái lên rồi xuống vào điệp.

Tay trái theo vị trí (ô 9–16, /8 ô): phách 1: 8 · 1¼: 4 · 1&: 8 · 1¾: 6 · 2: 6 · **3: 7 · 3¼: 7** · 4: 3 · **4&: 6**. Tay phải ĐỆM
(không tính giai điệu) nhiều nhất ở **phách 4: 4/8** — cặp 3+b7 (Eb7, Db7) · 3+5 (Ab).

## Khuôn trong KeyTrain (`styleLibrary/caPhaoBalladSongs.ts`, `cuDi`)

Một ô 4 phách, lặp theo hợp âm. Ví dụ Fm (= ô 9):

| tiếng | vị trí | tay · nốt | ngân | nguồn |
|---|---|---|---|---|
| Bùm | phách 1 | trái F2 | 2 phách | sheet (ngân: Claude) |
| câu rải | phách 1¼ → 2¾ | trái C3 F3 G3 Ab3 → phải C4 F4 C5 | tới phách 3; G3 ¼; Ab3 1; C5 1 | sheet ô 9 từng nốt |
| bùm | phách 3 | trái F2 | 2 | sheet 7/8 ô |
| bum | phách 3¼ | trái C3 | 1¼ | sheet 7/8 ô (bậc 5) |
| chát | phách 4 | phải C4+Ab4 (bậc 7 — hợp âm ba lùi bậc 5 — + 10) | 1 | sheet 4/8 ô; chọn bậc: Claude |
| bum | phách 4& | trái F3 | ½ | sheet 6/8 ô (bậc: Claude) |

- Tay trái 1–5–8–9–10 rồi tay phải 12–15–19 ở MỌI hợp âm (ô 10 thật ra chuyển tay sớm một móc kép và tay phải lên b7 — không chép).
- Tay phải rải mang cờ `raiNoi`; sàn gốc tay phải C3 (48) như Slow Rock Lá thư hai tay → gốc tay phải cao đúng một quãng tám trên
  gốc tay trái (C2–B2), sóng liền ở mọi hợp âm. Kiểm 12 gốc × 6 loại hợp âm: chuỗi 8 tiếng đi lên liền 72/72.
- `autoFills: false` như Ballad Để em (bỏ 30/9 khi câu fill Cà Pháo thành mặc định); `cpSoloSong: 'Anh Cu Di Di'` cho câu solo Cà Pháo.
- **Biên soạn của Claude** (sheet không ghi pedal): nốt rải ngân tới hết nửa ô như giữ pedal, riêng bậc 9 ngắn (móc kép) cho khỏi
  cọ bậc 10; lực bass .85 · .8, rải .5–.62, đỉnh sóng .7, chát .6.

## Ô tick "Ballad cứ đi: chêm tiếng nối hợp âm sau" (29/9/2026) — ĐÃ THÀNH MẶC ĐỊNH

**Mặc định từ 29/9/2026.** Người dùng: *"tiết tấu ballad cứ đi khi có tick chêm tiếng nối hợp âm sau đã ổn, hãy đặt ô tick đó làm mặc
định cho Ballad anh cứ"*. `cuDi.cell = CU_DI_NOI_CELL`; ô tick và cờ `balladCuDiNoi` (ReharmHome, songSnapshot) đã gỡ. Khuôn gốc cũ
(chưa từng commit) ghi trong comment cạnh `cell` để lùi. Mục "Khuôn trong KeyTrain" ở trên tả khuôn gốc cũ ấy.

Người dùng nghe nút: *"tiết tấu ballad cứ đi nghe ổn nhưng tôi muốn bạn hãy thêm vào mấy tiếng nữa cho đủ phách nối đến hợp âm kế
tiếp luôn. Sau 8 tiếng đầu bạn chơi thêm 2 tiếng nữa rồi nghỉ, nhưng tôi muốn bạn chêm thêm tiếng ở khoảng nghỉ đó để nối vào hợp âm
kế tiếp … căn cứ vào tiết tấu đệm Ballad cứ đi rồi phát triển thêm tiếng, nhớ phải khớp với tiết tấu điệu. Hãy làm ô tick riêng"*.

`CU_DI_NOI_CELL` (lưu theo bài `balladCuDiNoi`; tắt = khuôn trên, không đổi). Nửa đầu giữ nguyên; nửa sau thành 8 móc kép liền như
nửa đầu — sóng lên rồi xuống vào hợp âm sau (lối sheet ô 9: tay trái F3 Ab3 C4 lên, tay phải F4, Ab3 xuống; ô 16: Db3 F3 Ab3 B3
lên, Bb3 G3 E3 C3 xuống vào Fm). Ví dụ Fm → Bbm:

| tiếng | vị trí | tay · nốt | |
|---|---|---|---|
| bùm | phách 3 | trái F2 | cũ |
| bum | phách 3¼ | trái C3 | cũ |
| lên | phách 3& · 3¾ | trái F3 · G3 (8 · 9) | mới |
| chát | phách 4 | phải C4+Ab4 | cũ — đỉnh sóng |
| walking | phách 4¼ · 4& · 4¾ | trái F3 · Eb3 · C3 → Bb2 đầu ô sau | mới (4& là bum cũ, đổi nốt) |

- Walking bass (`danVao`, bộ soạn dòng của Ballad Để em): dòng đi liền bậc từ nốt 9 xuống bass hợp âm sau. Renderer thêm: dòng chạm
  cuối ô thì nhắm tiếng tay trái ĐẦU Ô SAU (cũ: chỉ tiếng trong cùng ô) — Để em không đổi (dòng của nó luôn có đích trong ô).
- Bản đầu (bỏ trước khi đưa nghe): nốt dẫn cố định = gốc hợp âm sau + 1 cung (`som`) — đúng bước vào bass nhưng nằm ở quãng tám 2
  ngay sau bậc 8 quãng tám 3 → nhảy 13–17 nửa cung ở 4/8 chỗ đổi hợp âm của vòng ô 9–16.
- Đo (test `caPhaoBalladCuDi.test.ts`): 180 chỗ đổi hợp âm (12 gốc × 5 bước × 3 cặp loại) — đủ 16 móc kép liền trong ô, nốt 4¾ cách
  bass ô sau 1–2 nửa cung 180/180. Vòng ô 9–16: Fm G3 | F3 Eb3 C3 → Bb2 · Bbm C4 | Bb3 A3 Ab3 → G2 · C7 D3 | C3 Ab2 G2 → F2. Có nốt
  lướt ngoài giọng khi các bậc liền bậc chói với cặp chát tay phải: Eb7 → Ab đi Eb3 B2 Bb2; G7 → C7 đi G3 Eb3 D3.
- Hợp âm ngân 8 phách: dòng ô đầu đi về chính gốc của nó; hợp âm cuối bài: theo `tones` (10 · 8 · 5).
- **Để lùi:** tắt ô tick. "Dòng xuống nghe lạc giọng" → phạt nốt ngoài gam nặng hơn trong `walkingBass`, hoặc bỏ luật tránh chói với
  tay phải cho riêng điệu này. "Dày quá" → bỏ 3& · 3¾, giữ walking.

### Sửa ô tick nối (29/9/2026): nhấn tiếng 1 · 5 · 8, tiếng 5 nhóm 2 là một nốt

Người dùng: *"khi chơi 8 tiếng thì tiếng 1 5 và 8 là phách mạnh hãy đánh rõ. Tới 8 tiếng lần 2 tôi nghe thấy bạn có dặm hợp âm ở tiếng
thứ 5, nhưng đừng đánh vậy mà hãy để tiếng 5 chơi một cách hòa hợp với 8 tiếng, nhưng mà vẫn tuân thủ phách 1 5 8 mạnh"*.

- Mỗi nửa ô là một nhóm 8 móc kép; tiếng 1 · 5 · 8 = phách 1 · 2 · 2¾ và 3 · 4 · 4¾. **Nhấn** (ý người dùng, cùng mức câu tám tiếng
  ACDD): tay trái hệ số 1,0 → lực 68, tay phải 0,9 → 72; tiếng khác 34–44. Chỉ trong ô tick — nút gốc không đổi. Cũ: nhóm 1 = 58 ·
  42 · 56; nhóm 2 = 54 · cặp chát 48 · walking 41.
- **Tiếng 5 nhóm 2 = một nốt bậc 10 tay trái**, như tiếng 5 nhóm 1 — sóng Fm: F2 C3 F3 G3 **Ab3** rồi walking G3 Eb3 C3 → Bb2. Cũ:
  cặp chát tay phải bậc 7 (hợp âm ba: 5) + 10 ngân 1 phách (C4+Ab4) — người dùng nghe là "dặm hợp âm".
- Ô tick giai điệu dẫn: tiếng 5 nhóm 2 là MỘT nốt tay phải = nốt trên của cặp chát cũ (Ab4 trên Fm) để dòng dẫn còn đi từ tầm tay
  phải. Đặt bậc 10 tay trái như ô tick nối thì dòng dẫn đi từ đỉnh sóng 2¾ — đã sát đích — và vòng qua nốt ngoài giọng (Fm C5 D5 →
  Db5 · Bbm F5 Gb5 → G5 · C7 G4 A4 → Ab4, đo khi sửa). Tiếng 8 nhóm 2 (nốt vào sớm) cũng nhấn (cũ 0,75).
- **Để lùi:** "nhấn nghe giật, nặng tay" → hạ `NHAN_T` · `NHAN_P` về 0,85 · 0,8.

### Sửa tiếp (29/9/2026): thêm tay phải ở tiếng nhấn

Người dùng: *"nhấn 1 5 8 chưa rõ, sao ko thêm nốt bên tay phải"*. Tăng lực chưa đủ: 5/6 tiếng nhấn chỉ có một nốt tay trái (lực × 0,85,
bè trầm).

- Ô tick nối: tay phải NHÂN QUÃNG TÁM nốt tay trái ở tiếng nhấn, không thêm hoà âm (người dùng không muốn "dặm hợp âm"): tiếng 1 = gốc
  +2 quãng tám (F2 → **F4**), tiếng 5 = bậc 10 quãng tám trên (Ab3 → **Ab4**, nhấn rồi nhả ¼ phách), tiếng 8 nhóm 1 = tay phải sẵn
  (C5), tiếng 8 nhóm 2 = một nốt tay phải đi liền bậc vào gốc hợp âm sau (`danVao` tay phải). Fm → Bbm: F4 · Ab4 · C5 | F4 · Ab4 ·
  **C5** → Bb4. Vòng ô 9–16: nốt ấy là bậc 5 của hợp âm đang vang (C5 · F5 · Bb4 · Eb5 · Ab4 · F5 · D5 · G4) — trên gốc hợp âm sau một
  cung ở vòng quãng 5 xuống.
- Bộ soạn dòng: tay phải dùng thước GIAI ĐIỆU — nốt ngoài gam +6 (cũ +3, nửa cung vào đích +1), nhảy quãng 3 +1 (cũ +4). Thước walking
  bass cho giai điệu ra nốt lướt ngoài giọng ở tiếng nhấn (Fm → Bbm Ab4 **A4** → Bb4; Ab → Db C5 **D5** → Db5). Tay trái giữ thước cũ.
- Tiếng 5 tay phải nhả ngay (¼): ngân ¾ thì đè lên walking tay trái, tay trái né chói → Eb7 đi Eb3 **B2 A2**.
- Ô tick giai điệu dẫn: tiếng 1 · 8 nhóm 1 có tay phải như ô tick nối; tiếng 5 nhóm 2 CHỈ tay phải Ab4 (giữ Ab3 tay trái thì walking 4&
  không lên Ab3 được → A3 ngoài giọng). Tay trái 4& vòng ô 9–16: Ab3 · Bb3 · G3 · Ab3 · C3 · Ab3 · G3 · E3 (C7 → Fm cũ Gb3).
- Test: mọi tiếng nhấn có tay phải; tiếng 5 nhóm 2 một cao độ; tay phải tiếng 8 nhóm 2 cách gốc hợp âm sau 1–2 nửa cung (180/180).

### Sửa tiếp (29/9/2026): tiếng 5 dày hơn — quãng tám kép

Người dùng: *"phách 5 đánh dày hơn nữa"*. Lượt trước người dùng bác tiếng 5 là cặp hợp âm (C4+Ab4, "dặm hợp âm") → làm dày bằng QUÃNG
TÁM, không thêm nốt hợp âm khác: tiếng 5 hai nhóm = bậc 10 tay trái + tay phải quãng tám kép (Fm: Ab3 + **Ab4+Ab5**). Căn cứ: sheet ô 9
nốt dẫn Db4+Db5 là quãng tám; điệp Slow Rock Lá thư hai tay (người dùng duyệt) làm dày đỉnh sóng bằng quãng tám trên. Cũ: Ab3 + Ab4.
- Trần tay phải của điệu 84 → **88**: gốc A · Bb · B, quãng tám trên vượt C6 bị gập thành nốt trùng (Db5+Db5). Nút gốc cao nhất F#5 —
  không đổi. Cao nhất nay D#6 (gốc B).
- Dòng tay phải (`danVao`) thử MỌI nốt của tiếng trước, không chỉ nốt đỉnh: chỉ nốt đỉnh thì dòng đi từ Ab5 vọt lên C6. Hoà điểm → đích
  quãng tám gần thắng; các dòng về như lượt trước (Fm → Bbm: nối C5 → Bb4; dẫn Ab4 C5 → Db5).
- Để lùi: "tiếng 5 chói, cao quá" → bỏ `tone(1, 24)` ở tiếng 5 (về Ab3 + Ab4).

### Sửa tiếp (29/9/2026): tiếng 5 dày nhưng ĐÁNH ĐƯỢC — trong thế tay chuỗi rải

Người dùng: *"sao tay phải đánh phách 5 mà các nốt xa nhau vậy, tay người sao mà đánh được"*. Bản quãng tám kép (mục trên) sai ở cú
liền sau: móc kép kế tiếp tay phải phải xuống C4 cho chuỗi rải — Ab5 → C4 = 20 nửa cung trong ¼ phách (♩ 63 ≈ 0,24 giây).

- Tiếng 5 hai nhóm = tay trái bậc 10 + tay phải **bậc 10 + 12** ngay trong thế tay chuỗi rải (Fm: Ab3 / **Ab4+C5**; chuỗi C4 F4 C5 —
  ngón 1 · 2/3 · 4 · 5 một thế tay C4–C5). Vẫn ba nốt. Cũ: Ab3 / Ab4+Ab5.
- Trần tay phải về 84 (bỏ nới 88 của mục trên).
- Test mới: nút gốc · ô tick nối · ô tick dẫn, 180 chỗ đổi hợp âm — mọi nốt cùng tay gõ trong ½ phách (một cú + các móc kép liền sau)
  nằm trong một quãng tám: 0 chỗ vượt (bản quãng tám kép vượt ở mọi hợp âm).

### Sửa tiếp (29/9/2026): tay phải tiếng 5 sát dưới chuỗi rải; hợp âm treo lấy nốt treo

Người dùng: *"nốt ở tay phải vẫn xa nhau"*. Đo trên đúng vòng bài người dùng (Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4):
- **B9sus4**: bậc 3 thiếu → renderer lùi về bậc 7 (`DEGREE_CHAIN`) → tiếng 5 tay phải **A5 + Gb5**, móc kép sau xuống Gb4 = 15 nửa cung.
  Test tầm tay trước chỉ thử hợp âm thứ · trưởng · bảy nên bỏ sót.
- Bậc 10 + 12 nằm TRÊN chuỗi rải → cụm ½ phách căng đủ quãng tám.

Sửa: tiếng 5 tay phải = **bậc 8 + 10, sát dưới chuỗi rải** (Fm: F4+Ab4 rồi C4 F4 C5 — cụm ½ phách 8 nửa cung; Em(add9): E4+G4 rồi
B3 E4). Bậc 3 thiếu lấy **nốt treo** (`ba3`, như Ballad Để em) ở tiếng 5 hai tay và nốt dẫn ô tick giai điệu dẫn — B9sus4: B4+E5.
Test tầm tay thêm hợp âm treo · 9sus4 · add9 · m9 · m7b5 · maj7. Cũ: bậc 10 + 12 (Ab4+C5).

Chuỗi rải tay phải của khuôn gốc (sheet ô 9: C4 F4 C5 trong ¾ phách) vẫn trải đủ một quãng tám — lối của sheet, chưa đổi.

### Sửa tiếp (29/9/2026): tiếng 5 là giai điệu nhô lên — người dùng chọn cách 1

Người dùng: *"tay phải đã gần nhau hơn rồi nhưng tôi muốn phách 5 phải là giai điệu hơi cao lên chứ ko phải ngang với các phách còn
lại"*. Vướng: ngay sau tiếng 5 tay phải chạy chuỗi rải sheet C4 F4 C5 (bắt thấp) — tiếng 5 cao thì tay lại mở. Hỏi ba cách:
1. tiếng 5 lên C5, giữ chuỗi rải sheet (tay mở một quãng tám C4–C5 như chính chuỗi rải) — **người dùng chọn**;
2. tiếng 5 lên C5, chuỗi rải sau bắt cao F4 Ab4 C5 (tay gọn 7 nửa cung, lệch sheet ô 9);
3. tiếng 5 cao nhất ô F5 (tay nhảy 17 nửa cung).

Người dùng dặn thêm: *"nếu tôi nhắn ko ổn thì đưa ra các phương án khác để chọn lại"* — còn cách 2 · 3.

Tiếng 5 tay phải hai nhóm = **bậc 10 + 12** (đỉnh bậc 5): Fm Ab4+C5 · Am9 C5+E5 · B9sus4 E5+F#5 (nốt treo + 5). Test: đỉnh tiếng 5
cao hơn tiếng 1 và hai nốt rải liền sau (12 gốc × 10 loại hợp âm); tầm tay ½ phách ≤ quãng tám vẫn đạt. Cũ: 8 + 10 (F4+Ab4).

### Sửa tiếp (29/9/2026): chỗ nối hai ô / hai hợp âm — giữ tầm tay phải

Người dùng chốt cách 1 (tiếng 5 nhô lên C5) là ổn, rồi gửi ảnh màn hình rơi nốt (ô Aadd2): *"tay phải phần lớn tầm các nốt đã gần
nhau nhưng vẫn còn sót chỗ mà tầm nốt xa như trong hình. Tay người ko thể đánh như trong ảnh được"* — C#4 (hồng = tay phải) gõ gần như
cùng lúc C#5+E5.

Quét 4 vòng dài (có vòng bài người dùng) × 6 cách chia độ dài hợp âm (4 · 8 · 2+2+4 · 4+2+2 · 6+2 · 8+4): **71/3538 cú** tay phải có
cụm ½ phách vượt quãng tám. Hai dạng:
- **tiếng 8 cuối ô → tiếng 1 ô sau** (dòng tay phải lên F#5 trên Bm, ô sau E vào E4 = 14 nửa cung / ¼ phách): tầm tay phải đặt gốc theo
  tên nốt (sàn C3) → gốc cao A · Bb · B lệch gốc thấp C · D · E gần một quãng tám. Sửa: tiếng 8 nhóm 2 (ô tick nối) = nốt trên GỐC
  HỢP ÂM SAU một cung (`som`, trong tầm tay phải ô sau) — luôn cách tiếng 1 ô sau 2 nửa cung; không đổi hợp âm → theo hợp âm đang vang
  (cờ mới `giuKhiKhongDoi`). Dòng tay phải có đích ở ô sau hạ cánh đúng nốt đích (không đổi quãng tám). → còn 16/3620.
- **ô hai hợp âm 2 phách**: đỉnh sóng hợp âm trước (1¾) liền tiếng 1 hợp âm sau (2). Sửa: bước **giữ tầm tay** cuối bộ dựng (`giuTamTay`,
  chỉ điệu này): tiếng tay phải mà cùng các nốt tay phải trong ½ phách trước vượt quãng tám → dời cả tiếng một quãng tám về phía chúng.
  Aadd2 · C#m7 (2 + 2): E5 → C#4 thành E5 → **C#5**. → **0/3620**.
- Ô tick giai điệu dẫn: tiếng 4¾ nay đánh cả khi hợp âm không đổi (bậc 3 của hợp âm đang vang); cũ: bỏ tiếng.
- Cái giá: ô hai hợp âm, tiếng 1 bị dời lên có thể cao hơn tiếng 5 của chính hợp âm ấy (C#m7: C#5 rồi E4+G#4).
- Test tầm tay thêm vòng dài × độ dài hợp âm khác nhau (nút gốc · hai ô tick).

### Sửa tiếp (29/9/2026): nhãn tay — bậc 10 tay trái trên C4 bị app dán nhãn tay phải

Người dùng gửi ảnh thứ hai (ô Aadd2): *"vẫn có chỗ tay phải đánh bị xa khó đánh"* — màn hình tô C#4 HỒNG (tay phải) cùng lúc C#5+E5,
trong khi phím B3 ngay trước tô xanh (tay trái). Bộ dựng ghi C#4 là tay trái (bậc 10 sóng rải 1–5–8–9–10 trên A). Thủ phạm:
`fixHandByRegister` (`songStructure.ts`, gọi ở cuối `buildArrangedSong`) — lưới an toàn chung: cụm tay trái nằm hết trên C4 (> 60) thì
đổi nhãn sang tay phải (sinh ra từ một ảnh người dùng trước: nốt tay trái Sol 4 giữa câu solo). Sóng tay trái Ballad cứ đi trên gốc
A · Bb · B lên C#4 · D4 · D#4 (sheet Cà Pháo cũng thế: ô 14 tay trái Db4, ô 11 G3+Db4) → bị dán nhãn tay phải → "tay phải" C#4 + C#5 + E5
= 15 nửa cung. Test tầm tay của tôi đo thẳng đầu ra bộ dựng nên không thấy.

- Sửa: cờ điệu `tayTraiLenCao` → bộ dựng gắn `giuTay` vào tiếng tay trái; `fixHandByRegister` bỏ qua tiếng mang `giuTay`. Chỉ Ballad cứ đi
  (nút gốc và hai ô tick). ÂM THANH KHÔNG ĐỔI — chỉ nhãn tay (màn hình · chế độ tập). Luật chung giữ nguyên cho mọi điệu khác.
- Đo SAU `fixHandByRegister`, ô tick nối, 3 vòng: tắt cờ 44/223 cú tay phải vượt quãng tám trong ½ phách; bật cờ 0/192.
- Test tầm tay giờ chạy qua `fixHandByRegister`, thêm vòng giọng Si trưởng và Sib trưởng; `handRegisterGuard.test.ts` thêm ca `giuTay`.

## Ô tick "Ballad cứ đi: giai điệu dẫn vào hợp âm sau" (29/9/2026) — ĐÃ GỠ 30/9

**Gỡ 30/9/2026** theo người dùng: *"Ô giai điệu dẫn vào hợp âm sau hãy bỏ"* — `CU_DI_DAN_CELL`, trường lưu `balladCuDiDan` và các test đã
xoá. Dòng `danVao` tay phải trong renderer vẫn còn (không điệu nào dùng). Nội dung dưới giữ để tra.

Người dùng nghe ô tick nối: *"tiết tấu đã đúng ý tôi rồi nhưng tôi muốn giai điệu chơi kiểu dẫn vào hợp âm kế tiếp"*.

**Số đo** (ô hát 9–32 · 38–61, 48 chỗ đổi hợp âm ở vạch ô; mọi nốt gõ ở phách cuối ô cũ và nốt cuối trước vạch):
- nốt CUỐI trước vạch: **tay phải 43/48**, tầm **≥ C4 43/48** — Cà Pháo dẫn bằng giai điệu bè trên, không bằng bass;
- loại nốt cuối: nốt chung 17 · **vào sớm** (nốt hợp âm mới) 13 · nốt hợp âm cũ 10 · nốt dẫn cách nốt hợp âm mới 1–2 nửa cung 8;
- mọi nốt gõ ở phách cuối (245): nốt hợp âm cũ 102 · nốt chung 70 · nốt dẫn 47 · vào sớm 26;
- ô 9 đúng lối: phách 4 tay phải F4 · 4¼ tay phải C4+F4 · 4& tay trái Ab3 · **4¾ tay phải Db4+Db5 = bậc 3 của Bbm** (hợp âm sau).

**Khuôn** (`CU_DI_DAN_CELL`, lưu theo bài `balladCuDiDan`; bật thì thắng ô tick nối): **cùng mọi mốc gõ** ô tick nối; ba tiếng cuối theo
lối ô 9 — 4¼ tay phải đi liền bậc từ nốt đỉnh cặp chát · 4& tay trái một nốt walking vào bass hợp âm sau · 4¾ tay phải **bậc 3 của hợp
âm sau**, vào sớm (`som` + `requireNextChord`). Ví dụ vòng ô 9–16:

| chỗ đổi | chát → 4¼ → 4¾ (tay phải) | 4& (tay trái) |
|---|---|---|
| Fm → Bbm | C4+Ab4 → C5 → **Db5** | Ab3 (như ô 9) |
| Bbm → Eb7 | F4+Db5 → F5 → **G5** | Bb3 |
| Eb7 → Ab | Db4+G4 → Bb4 → **C5** | A3 |
| Db → Bbm | Ab3+F4 → Eb4 → **Db4** | C3 |
| G7 → C7 | F4+B4 → D5 → **E5** | G3 |
| C7 → Fm | Bb3+E4 → G4 → **Ab4** | Gb3 |

- Renderer: dòng `danVao` nay chạy được ở TAY PHẢI — đi từ nốt đỉnh tiếng trước, trong tầm tay phải của điệu, ưu tiên nốt hợp âm
  (như tiếng bùm; nốt đỉnh Cà Pháo là nốt hợp âm 63%), chọn quãng tám ít điểm phạt nhất; đích là tiếng vào sớm thì lấy thế bấm hợp
  âm SAU. Bản đầu chưa ưu tiên nốt hợp âm: C7 → Fm đi E4 **Gb4** Ab4 (Gb ngoài giọng).
- Chọn bậc 3 (không phải gốc / bậc 5) là biên soạn của Claude: ô 9 dùng bậc 3, và bậc 3 nói rõ hợp âm sau trưởng hay thứ.
- Đo (test, 180 chỗ đổi hợp âm): 4¾ là bậc 3 hợp âm sau 180/180; 4¼ → 4¾ liền bậc 180/180; tầm ≥ C4 176/180 (sheet 43/48).
- Tay trái 4& có lúc là nốt dẫn nửa cung từ trên ngoài giọng (Eb7 → Ab: A3; C7 → Fm: Gb3) — nốt liền bậc khác đều chói với cặp
  chát đang ngân.
- Giữa hợp âm ngân 8 phách và ở hợp âm cuối bài: không có tiếng 4¾ (không có hợp âm sau vào đúng vạch); 4¼ theo `tones` (bậc 8).
- **Để lùi:** tắt ô tick này → về ô tick nối. "Dẫn nghe cao / chói" → đổi đích 4¾ từ bậc 3 sang gốc hợp âm sau (`tone(0, 12)`).

## Câu fill Cà Pháo (30/9/2026) — ĐÃ THÀNH MẶC ĐỊNH 30/9

**Mặc định 30/9/2026** (người dùng: *"hãy biến ô tick câu fill Cà Pháo làm mặc định cho điệu Ballad Cứ đi"*): bỏ `autoFills: false`
của điệu — điệu tự lót fill ở chỗ ca sĩ nghỉ (theo lời đã dán, không có lời thì theo mật độ fill); ô tick và trường lưu `balladCuDiFill`
đã gỡ. Để lùi: trả `autoFills: false` (chỉ còn fill ở ô người dùng tự bấm).

Người dùng: *"hãy phân tích cách Cà Pháo đặt những câu fill và kết hợp với tư duy của bạn để đưa vào trong điệu Ballad Cứ đi"*.

**Số đo** (5 cửa fill lúc hát người dùng đã xác nhận trên phiếu — Để Em 40 · 59, Chưa Bao Giờ 22 · 50→51 · 75→76; 0/9 sheet Cà Pháo
có thẻ lời nên không đo thêm được; Anh Cứ Đi Đi chưa có cửa fill nào xác nhận; chi tiết trong md Cà Pháo):
- 4/5 ôm lấy vạch nhịp sau chỗ lời dứt (mở 4¼ rồi rơi phách 1, hoặc mở ngay phách 1); cả 4 chỗ cùng một hợp âm hai bên vạch;
- 4/5 thế bấm leo 1–3 quãng tám; 3–8 cú móc kép; 4/5 kết bằng cú ngân ½–1 phách ở đỉnh;
- tay trái: 3/5 chỉ giữ một cú ngân, 1/5 đi tiếp khuôn thưa, 1/5 đáp khi tay phải ngân.
- Kho CP Lick (`cpPhrases.json`) phần lớn là mảnh cắt từ dạo/giang/kết, không phải câu fill lúc hát; và luật đặt câu cũ của CP Lick
  ("hai phách cuối hợp âm, kết ở vạch") là heuristic KT — sheet cho thấy câu fill hay VƯỢT qua vạch.

**Lượt 3 — xoay vòng bảy kỹ thuật (30/9/2026).** Người dùng: *"fill là phải chơi đa dạng các kỹ thuật mình có chứ ko phải lặp lại
đúng 1 kiểu"* (lượt 2 chỉ có hai hình luân phiên theo LƯỢT PHÁT — cả lượt nghe cùng một hình). Nay `cuDiFillTheoThu` đếm chỗ fill theo thứ
tự trong bài và xoay vòng danh mục `KIEU_FILL`; lượt phát sau lệch điểm xuất phát; kiểu không hợp chỗ ấy thì sang kiểu kế. Mọi kiểu nằm
trong [phách trước chỗ đổi hợp âm, phách sau) — không mở sớm hơn để khỏi đè chữ cuối câu hát. Ví dụ Fm → Bbm (tay trái · tay phải):
1. **leo** + hợp âm lướt (Chưa Bao Giờ 50→51 · Anh Cứ Đi Đi 53): A2+Eb3 · A4+Eb5+A5 → C5+Eb5 · Eb5+F5 · F5+A5 → F5+Bb5+Db6.
2. **tay trái dẫn** (Anh Cứ Đi Đi ô 16 nửa sau): C4 Ab3 G3 F3 · C5+C6 giữ. (C7 → Fm: Bb3 G3 E3 C3 · G4+G5 — đúng ô 16.)
3. **mở** + hợp âm lướt (Để Em 40): A2+Eb3 · A4+Eb5+A5 (1 phách) → Bb4 · Db5+F5+Bb5 · Db6.
4. **bass đi** nửa cung (Có Em Chờ 20→21 · 22): Gb2 G2 Ab2 A2 → Bb · C5+C6 giữ. Cần bass cách ≥ 3 nửa cung.
5. **sóng lên xuống** (Chưa Bao Giờ 22): F4+Ab4+C5 · Ab4+C5+F5 · C5+F5+Ab5 · Ab4+C5+F5 → F4+Bb4+Db5.
6. **câu đơn** (Chưa Bao Giờ 75→76): C5 Ab5 F5 C5 → Db5 (nốt dẫn nửa cung vào bậc 3).
7. **chuyển quãng tám** (Để Em 59): F4+G4+Ab4+C5 → F5+G5+Ab5+C6 (móc đơn) → Bb5+Db6+F6. Giãn móc kép thành móc đơn — tầm tay.
Test: bảy kiểu × 12 gốc × 4 bước × 6 cặp loại — trong khung, nốt đúng hợp âm (trừ bass đi nửa cung và nốt dẫn là chủ ý), tay trái dưới tay
phải, ≥ C4, mỗi tay trong ½ phách ≤ quãng tám; mỗi kiểu ra câu ≥ 250/288 chỗ (bass đi ≥ 100); 7 chỗ fill liền nhau → 7 câu khác nhau.

**Lượt 2 — hợp âm lướt (30/9/2026).** Người dùng nghe bản đầu: *"sao quá đơn giản, sao ko có những kỹ thuật để dẫn nối giữa các hợp âm mà
cà pháo hay dùng, Cà Pháo có dùng passing chord để nối hợp âm ko"*. Đo (`scripts/audit_cp_noi_hop_am.py`, 5 sheet có vạch đúng pha —
Để Em 19% · Chưa Bao Giờ 13% pha đúng nên loại; phần hát 288 chỗ đổi hợp âm):
- hợp âm lướt GHI ký hiệu 19/288 (7%; 9 là át 7 của hợp âm sau); NGẦM trong nốt tay trái 16/288 (6%): át 7 của hợp âm sau với bass là
  nốt cảm âm 7 · bII7 nửa cung trên hợp âm đích 4 · bII7 hàng xóm 3 · bass đi 3 nốt 2. Cộng lại ~1/8 chỗ đổi hợp âm.
- bass cú tay trái cuối trước chỗ đổi (n = 199): liền bậc vào gốc sau 65 (33%: nửa cung 31 · cả cung 34) · bậc 5 của hợp âm sau 41 (21%)
  · đã về gốc sau 34 (17%); 55/199 (28%) là nốt ngoài hợp âm đang vang.
- tay phải cú cuối (n = 206): nốt chung 65 · nốt vào sớm của hợp âm sau 64 · nốt hợp âm cũ 46 · nốt ngoài 31; đi liền bậc vào nốt
  đầu hợp âm sau 76 (37%).
- Anh Cứ Đi Đi dùng hai lối: F7/A → Bbm (ô 17→18 · 46→47) và Db7 → C7 (ô 15 ghi · 44→45 · 53 ngầm: tay trái Db3+B3 → C3+Bb3, tay phải
  F4+B4+F5).
Luật chọn hợp âm lướt (`chonHopAmLuot`, Claude rút từ 11 chỗ soi tận nốt, khớp 10/11 — lệch: Có Em Chờ 44→45): hợp âm sau là 7 trội →
bII7; thứ → thứ đi xuống một cung → bII7; hợp âm cũ là át 7 của hợp âm sau → bII7 hàng xóm rồi về lại; còn lại → át 7 bass cảm âm. Bass
cũ đã cách gốc sau nửa cung / trùng gốc → không chèn. Luật trước (lối cho bass đi gần nhất) chỉ khớp 7/11 và ra Gb7 cho C7 → Fm (sheet:
Db7 hàng xóm) — bỏ.

Câu fill lượt 2: phách cuối hợp âm cũ = hợp âm lướt — tay trái "vỏ" hai nốt (bass + bậc 7, hoặc bass cảm âm + quãng 3 cung), tay
phải cú ba nốt bậc 3 · 7 · 3 quãng tám (như Anh Cứ Đi Đi 53), nhấn; "leo" 3 cặp nốt leo trên hợp âm lướt (hàng xóm: 1 cặp trên bII7 rồi
2 cặp trên át 7) rơi phách 1 hợp âm sau; "mở" mỗi đoạn một cú ba nốt ngân hết đoạn rồi "mở" trên hợp âm sau. Ví dụ (tay trái · tay phải):
- Fm → Bbm: A2+Eb3 · A4+Eb5+A5 → C5+Eb5 · Eb5+F5 · F5+A5 → F5+Bb5+Db6.
- G7 → C7: Db2+B2 · F4+B4+F5 → Ab4+B4 · B4+Db5 · Db5+F5 → E5+G5+C6.
- C7 → Fm: Db2+B2 → C2+Bb2 · F4+B4+F5 → Ab4+B4 · Bb4+C5 · C5+E5 → F5+Ab5+C6.
Tay trái sóng nhường trọn phách hợp âm lướt (`cpDanSong` nay xử câu hai tay: mỗi tay nhường khoảng mà tay ấy của câu chiếm; bass cũ đang
ngân cắt ở đó). Test: 11 chỗ sheet (10 khớp + chỗ lệch ghi rõ); 12 gốc × 4 bước × 6 cặp loại × 2 hình — nốt đúng hợp âm từng đoạn, bass
lướt cách gốc sau nửa cung, tay trái dưới tay phải, đỉnh leo lên, ≥ C4, đỉnh câu 78–94, mỗi tay trong ½ phách ≤ quãng tám.
Mật độ: không dán lời thì fill theo mật độ fill trên hợp âm — hợp âm nay 2 phách nên mức "Vừa" ra fill mỗi 4 phách; thưa hơn thì hạ mật
độ hoặc dán lời để fill theo chỗ lấy hơi.

**Khuôn bản đầu** (`style/cuDiFill.ts`, `fillCuDi`; nay chỉ dùng khi không chèn được hợp âm lướt), hai hình lấy đúng nhịp hai cửa
đã xác nhận, luân phiên theo lượt:
- **"leo"** (Chưa Bao Giờ 50→51): 3 móc kép cuối hợp âm (4¼ · 4½ · 4¾) cặp hai nốt của hợp âm ĐANG VANG leo thế đảo, rồi phách 1
  hợp âm sau thế bấm ba nốt ngân ¾. Eb → Cm: G4+Bb4 · Bb4+Eb5 · Eb5+G5 | G5+C6+Eb6.
- **"mở"** (Để Em 40): phách 1 hợp âm sau — nốt đơn · thế bấm ba nốt · nốt đỉnh ngân ½. Cm: C5 · Eb5+G5+C6 · Eb6.
- **Biên soạn của Claude:** leo THẾ ĐẢO (mỗi cú lên một nốt hợp âm) thay vì nhảy nguyên thế bấm lên quãng tám như sheet — giữ luật
  người dùng "nốt phải đánh được bằng tay người" (mọi nốt trong ½ phách ≤ quãng tám); đỉnh câu quanh D6 (±5) — sheet lên tới D7 · F7;
  "leo" đổi hợp âm ở vạch (cú leo hợp âm đang vang, cú rơi hợp âm sau) vì bài hát thường đổi hợp âm ở vạch, trong khi 4/4 cửa sheet
  cùng hợp âm hai bên vạch; lực 60–76.
- Đan vào sóng rải (`danFillVaoSong` → `cpDanSong`): tay phải sóng nhường suốt câu; tay trái giữ bass và các tiếng ngân, nhường tiếng
  móc kép trùng câu → "leo" bỏ ba tiếng chêm walking, chỉ còn bậc 10 ngân (như 3/5 cửa sheet).
- Chỗ đặt: chỗ ca sĩ nghỉ theo lời đã dán (`breaths`), chưa dán lời thì theo mật độ fill; điệu vốn `autoFills: false` — bật ô tick thì
  cho tự lót. Ô fill bật/tắt tay dùng như cũ. Màu Cà Pháo: CP Lick hỏi `datFill` trước kho câu ở chỗ fill (run và chuyển đoạn giữ nguyên).
- Đo (test): 12 gốc × 4 bước × 6 cặp loại (sus · m7b5 · 9sus4 · add9 …) × 2 hình — nốt hợp âm đúng chỗ, đỉnh leo lên từng cú, ≥ E4,
  đỉnh D6 ± 5, trong ½ phách ≤ quãng tám; vòng Fa thứ 16 hợp âm × 2 khuôn (2 lượt / 1 lượt) × 4 lượt sau `fixHandByRegister`: không chéo
  tay, tay phải sóng không gõ trong lúc câu vang, bass phách 1 còn.
- **Rủi ro chưa đo:** cú rơi phách 1 có thể chồng lên câu hát sau nếu ca sĩ vào ngay phách 1 (sheet: lời trở lại phách 3¼–4 ô rơi) —
  cú rơi ở quãng cao hơn giọng hát. Hình trong một lượt phát thường giống nhau (chọn theo lượt + số hợp âm).
- **Để lùi:** tắt ô tick. "Leo nghe nhỏ quá" → cho nhảy quãng tám như sheet (cần người dùng cho phép vì tầm tay). "Chồng lời" → chỉ dùng
  hình "leo" và cắt cú rơi còn ½ phách.

## "Mỗi hợp âm 8 phách rồi chuyển" (30/9/2026) — ĐÃ THÀNH MẶC ĐỊNH 30/9

**Mặc định 30/9/2026** (người dùng tick nghe rồi: *"2 chỗ tôi chọn hãy đặt làm mặc định cho điệu Ballad cứ đi"*): `cuDi.cell =
CU_DI_MOT_LUOT_CELL`; `chordBeats` của Ballad cứ đi = độ dài ô (2 phách máy), ô chọn "Mỗi hợp âm" khoá; ô tick và trường lưu
`balladCuDiMotLuot` đã gỡ. Để lùi: `cell: CU_DI_NOI_CELL` và bỏ nhánh `laCuDi` ở `chordBeats` (ReharmHome).

Người dùng: *"ở điệu Ballad cứ đi thì mỗi hợp âm chơi 8 phách rồi chuyển, hãy điều chỉnh lại"*. Hỏi lại, người dùng chọn: **"phách" =
tiếng móc kép của sóng rải**, mỗi hợp âm MỘT lượt 8 tiếng rồi chuyển (thay cho hai lượt mỗi ô nhịp — như ô tick Slow rock "6 phách rồi
chuyển"); 8 tiếng = **sóng lên trọn** (cách 1); làm ô tick. Người dùng dặn: nghe chưa ổn thì qua cách 2 — 5 tiếng lên + 3 tiếng chêm
nối (lượt hai của khuôn mặc định).

- Khuôn `CU_DI_MOT_LUOT_CELL` (2 nốt đen) = lượt đầu khuôn mặc định: tay trái gốc · 5 · 8 · 9 · 10, tay phải bắt tiếp 12 · 15 · 19;
  nhấn 1 · 5 · 8 (tiếng 1 và 5 có tay phải). Nốt ngân quá lượt cắt ở cuối lượt. Không còn tiếng chêm nối.
- Bật ô tick: mỗi hợp âm = 2 nốt đen, bỏ qua ô chọn "Mỗi hợp âm" (khoá lại như Slow rock); thắng ô tick "giai điệu dẫn". Lưu theo bài
  (`balladCuDiMotLuot`). Hợp âm mang độ dài riêng (nhập theo bài) vẫn theo độ dài riêng — lượt 8 tiếng lặp lại trong đó.
- Renderer (`rootForced`, luật chung): hợp âm ngắn hơn một ô nhịp bị ép tiếng bass đầu lên nốt thấp nhất của thế bấm. Với ô 2 phách
  mọi hợp âm đều "ngắn" → Fm ra F3 thay F2, sóng mở F3 rồi xuống C3 (đo: Fm · Eb ở đầu ô nhịp). Nay ngưỡng "ngắn" = min(ô nhịp, độ dài
  ô điệu); mọi ô của các điệu khác dài ≥ một ô nhịp → như cũ (toàn bộ test: vẫn đúng 7 lỗi cũ).
- Đo (test): Fm Bbm Eb Ab — mỗi hợp âm đúng 8 móc kép, tay trái 5 tiếng rồi tay phải 3 tiếng, đi lên liền; tiếng 1 · 5 · 8 mạnh hơn
  mọi tiếng khác. Tầm tay trên 5 vòng dài × độ dài 2 · 2-2-4 · 4 phách, sau `fixHandByRegister`: mỗi tay trong ½ phách ≤ quãng tám.
- **Để lùi:** tắt ô tick. Cách 2 nếu người dùng bảo: đổi khuôn thành lượt hai của `CU_DI_NOI_CELL` (phách 2–4, dời về 0) — bass · 5 · 8
  · 9 · 10 rồi 3 tiếng walking.

## "Solo · lick · run Cà Pháo khớp sóng rải" (29/9/2026) — ĐÃ THÀNH MẶC ĐỊNH 30/9

**Mặc định 30/9/2026** (cùng câu người dùng ở trên): bốn cờ `soloCell` · `cpSoloOwnRhythm` · `cpSoloSheetTexture` · `cpDanSong` nằm
thẳng trên `cuDi`; ô tick, `CU_DI_SOLO` và trường lưu `balladCuDiSolo` đã gỡ. Với khuôn một lượt, trong khung câu lick tay phải sóng
nhường trọn khung nên chỗ câu nghỉ không có tiếng gõ mới — nhưng không móc kép nào im (bass ngân); test đổi theo.

Người dùng: *"Sau khi đã đặt tick làm mặc định thì dùng bộ soạn ballad Cà Pháo và kết hợp với tư duy của bạn hãy soạn ra các câu solo
và các lick, run và mốc chuyển đoạn chơi theo phong cách Cà Pháo … phải soạn cho khớp với tiết tấu điệu ballad anh cứ sau khi đã đặt
ô tick chêm tiếng nối hợp âm sau"*. Ô tick `balladCuDiSolo` (lưu theo bài) gắn `CU_DI_SOLO` vào điệu. **Chỉ nghe được ở màu Cà Pháo**
(bộ soạn solo CP và CP Lick chỉ chạy ở đó). Tắt ô tick = như trước.

**Số đo sheet** (Anh Cứ Đi Đi, `scripts/audit_ca_phao.py`; giang ô 33–37 · kết ô 62–68 trong `cpBalladSolos.json`):
- Tay trái DƯỚI SOLO (n = 11 ô có tay trái): rải gốc · 5 · 8 (· 9) · 10 móc kép rồi ngân — ô 33 F2 C3 F3 G3 Ab3 đúng sóng của điệu;
  phách 4–4¾ gõ nốt hợp âm đang vang (ô 62 G3 → Eb3, ô 35 D3 → F3), không đi bass sang hợp âm sau.
- Solo chính bài đủ điều kiện làm khung hai ô: giang 34–35 (chạy liền) · 35–36 (nghỉ 1½ phách đầu, cụm vút lên C6+Eb6+G6); kết
  63–64 (chạy liền) · 67–68 (rải vút lên Bb6). Chất liệu sheet: giang dặm 19% · nốt chạy 31%; kết 6% · 50%.
- Chỗ chuyển đoạn (4 chỗ: ô 16 · 32 · 45 · 61, cộng ô 37 lấy đà): **1/4 là câu chạy đàn** — ô 16 vào điệp, tay trái 8 móc kép phách
  3–4 Db3 F3 Ab3 B3 | Bb3 G3 E3 C3, tay phải giữ G4+G5 · F4+F5 · G4+G5. Ô 32 · 61: nửa đầu sóng rải, nửa sau tay trái giữ hợp âm C7,
  tay phải giai điệu lấy đà (ô 32: F5+G5 · F5 · E5). Ô 45: tay trái Db3+B3 · C3+Bb3 (quãng hai tay), không chạy.
- Nghi là câu chêm lúc hát — **VAI CHƯA XÁC NHẬN** (ô 21 · 29 · 50 · 58): tay phải 4–6 móc kép từ phách 3½ hoặc 3¾ tới 4¾ (có quãng
  tám), tay trái MỘT nốt ngân 1–1½ phách. Suy đoán của Claude từ hình nốt: sheet không có lời, người dùng chưa chốt cửa lời trong phần
  hát. Bản 29/9 ghi như số đo là sai (sửa 30/9).

**Dạo · giang · kết** (bộ soạn ballad CP, `cpBalladComposition.ts`):
- Tiết tấu tay phải mọi khung từ solo chính bài (`cpSoloOwnRhythm`), giai điệu · hợp âm · kỹ thuật từ mọi sheet ballad CP, chấm chất
  liệu theo sheet (`cpSoloSheetTexture`) — như Ballad Để em.
- Bài chỉ có MỘT khung chạy liền mỗi loại đoạn → thêm khung: dạo/giang thêm kết 63–64 (đường đơn); kết thêm câu đóng 67–68. Đã thử
  thêm giang 35–36 cho dạo/giang: dặm 29–30% · nốt chạy 5–7% → bỏ (người dùng từng chê thân dạo/giang Để em nhiều dặm, ít chạy).
- Tay trái dưới câu solo = `CU_DI_SOLO_LEFT`: đúng 13 mốc gõ tay trái của khuôn mặc định (kể cả ba tiếng chêm 4¼ · 4½ · 4¾), ba tiếng
  chêm là nốt hợp âm đang vang 10 · 8 · 5 (không walking) — theo số đo tay trái dưới solo ở trên.
- Bộ soạn, chỉ khi `soloCell` + `tayTraiLenCao` (điệu khác và nút này khi tắt ô tick: như cũ):
  · trần tay trái tính theo nốt tay phải đang vang LÚC GÕ, tay phải vào thấp sau đó thì cắt ngân tay trái (cũ: Bbm Bb2 F3 **Bb2** C3 Db3);
  · tay phải không vang thì trần là `leftHandTop` 67 (cũ: Bb3 — gốc A · Bb · B mất bậc 9 · 10);
  · bậc 9 móc kép giữ nguyên; ngoài giọng (C7 · Gm7b5 ở Fa thứ) thì lấy nốt trong giọng sát dưới = b9 như ô 16 (cũ: nắn về gốc, F3 F3);
  · bè trong thấp hơn nốt đỉnh cao nhất trong ½ phách quanh nó quá quãng tám thì bỏ (cũ: Đô trưởng giang 33/1330 cú mở > 12 nửa cung).
- Đo (Fa thứ · La thứ · Đô trưởng, 12 lượt mỗi loại): dặm dạo 14 · 14 · 17%, giang 13 · 13 · 12%, kết 15 · 15 · 18%; nốt chạy dạo 23 · 27
  · 31%, giang 30 · 34 · 32%, kết 47 · 42 · 27%; tay phải mở > quãng tám trong ½ phách 0; hai tay chéo khi đang vang 0; tay trái gõ
  một nốt ≥ nốt tay phải vào trong ½ phách sau 0–10 / ~940 (≤ 1,1%) — còn để; ô đủ 13 tiếng sóng tay trái ≥ 95%.

**Lick · run lúc hát** (`cpDanSong` trong `licky/cpLick.ts`, cờ điệu `cpDanSong`): câu lick CP chỉ thay TAY PHẢI, bỏ bè trầm của sheet
nguồn; tay trái của điệu giữ tiếng ngân ≥ 1 phách (gốc, bậc 10 phách 2) và mọi tiếng câu không gõ trùng; nhường tiếng móc kép gõ cùng lúc
với câu và tiếng chéo / trùng phím. Câu dày → tay trái chỉ còn nốt ngân (như ô 21 · 29 sheet); câu thưa → sóng rải lấp chỗ nghỉ. Cũ
(cắt cả hai tay, bè trầm của bài khác): 39/243 móc kép trong khung câu không có tiếng; nay 0/196 (vòng Fa thứ 16 hợp âm, 8 lượt).
Câu chêm vẫn chỉ lấy câu sheet ghi đủ hai tay — mở cả mẩu thiếu bè thì TB 2,9 nốt · 1 phách (vụn) thay vì 4,0 nốt.
Cách đan (giữ ngân · nhường tiếng trùng) là **ghép của Claude**, không phải số đo.

**Mốc chuyển đoạn** (màu Cà Pháo): thay câu chạy CP của bài khác bằng câu chạy ô 16 của chính bài — tay trái 8 móc kép kết ở vạch
(`acddRunPitches`: C7 → Fm đúng Db3 F3 Ab3 B3 Bb3 G3 E3 C3; hợp âm khác: màu · 3 · 5 · 7 · 5 · 3 · màu · gốc), đúng chỗ 8 tiếng nửa sau
sóng rải; tay phải giữ tiếng phách 3, không gõ thêm. Thiếu chỗ (hợp âm ngắn / người dùng dời chỗ vào) thì lấy đuôi câu 4–7 tiếng; < 4
thì bỏ. Nghỉ đôn ra: câu kết ở vạch cũ, im cả hai tay suốt chỗ nghỉ. Chọn ô 16 (1/4 chỗ chuyển đoạn của sheet) là **lựa chọn của
Claude** — ba chỗ còn lại là giai điệu lấy đà, không phải câu đàn.

- **Để lùi:** tắt ô tick. Nghe "solo lặp tiết tấu" → kho khung chỉ có 2 mỗi loại đoạn (xem trên). "Lick bị sóng rải lấn" → trong
  `cpDanSong` nhường thêm tiếng tay trái (cũ: cắt cả hai tay). "Chuyển đoạn đơn điệu" → mọi mốc đều ô 16; muốn đổi thì mở lại câu chạy
  CP bài khác (`advancedCpRuns`) cho điệu này.

## Còn lệch — chưa sửa

- Nút gốc trên HỢP ÂM TREO (sus4, 9sus4): bậc 10 của chuỗi rải lùi về bậc 7 (`DEGREE_CHAIN`) → chuỗi không còn đi lên liền (Csus4:
  tiếng 6 tay phải G3 bằng tiếng trước). Hai ô tick đã dùng nốt treo (`ba3`); nút gốc (người dùng nghe ổn) chưa đụng.

- Hợp âm ngắn hơn một ô đứng ĐẦU ô (vd C7 2 phách): renderer ép bass lên nốt thấp nhất của thế bấm (C3) trong khi bậc 5 vẫn G2 →
  chuỗi mở C3 → G2 đi xuống. Luật chung cho mọi điệu (`rootForced` trong `patternRenderer.ts`) — với khuôn 4 phách vẫn còn; chỉ ô
  tick "mỗi hợp âm 8 phách" (ô 2 phách) đã hết (30/9).
- Hợp âm 2 phách ở NỬA SAU ô (vd Db7 sau G7) chơi nửa sau khuôn (bass · 5 · chát · 8), không rải chuỗi — sheet ô 15 có chuỗi ngắn
  T1 Tb7 → P3 Pb5 ở đó.

## Chưa đo

- Chưa nghe. Điệp chưa có biến thể riêng (xem số đo điệp ở trên). Pedal · lực thật: sheet không ghi. Một bài — chưa đối chiếu
  rải hai tay ở các sheet ballad Cà Pháo khác.
- Ô tick solo · lick · run: chưa nghe. Chưa đo câu chêm của CHÍNH bài (ô 21 · 29 · 50 · 58) thành kho câu lick — `cpPhrases.json`
  không có Anh Cứ Đi Đi, câu lick mượn Để Em · Chưa Bao Giờ · Chúng Ta · Hồng Kông. Chưa kiểm đường chạy trong app (chỉ test).

## Kiểm

`npx vitest run src/reharm/style/__tests__/caPhaoBalladCuDi.test.ts` — ô 9 đúng từng nốt, 72 hợp âm rải đi lên liền, nửa sau ô,
nút trong nhóm Ballad; ô tick solo · lick · run: tiết tấu nguồn, sóng tay trái, chéo tay, chất liệu, lick đan, câu chạy ô 16, nghỉ đôn ra.
