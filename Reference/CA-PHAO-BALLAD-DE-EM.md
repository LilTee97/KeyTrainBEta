# Ballad Để em: Cà Pháo, *Để Em Rời Xa*

Bản 1 (`059b4f1`, 25/9/2026) bị người dùng chê *"còn dở quá"*. **Bản 2** soạn lại trên mốc gõ của
**Ballad DERX** do Codex dựng ([BALLAD-DERX.md](BALLAD-DERX.md)). Người dùng nghe DERX: *"bám gần với
tiết tấu đệm trong sheet gốc. Tuy nhiên nó vẫn có cảm giác bị thiếu tiếng và đứt quãng"*. **Chờ nghe duyệt.**
Mã: `styleLibrary/caPhaoBalladSongs.ts` (`deEm`, `deEmChorus`). Số đo: `python -B scripts/audit_cp_de_em.py`.

Nguồn: `D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl`, SHA-256
`c4d780b7b37c89b1e7891daca40bc13fbca5ffba8c5600cf25ea04350aaaba4b`, ♩=85.
Mốc đoạn lấy theo `PianoBrain/tools/sheet/corpus.json` (người dùng chốt): phiên 4–19 · điệp 20–27 ·
phiên 2 32–47 · điệp 2 48–55 · điệp nâng tông 56–63.

## Bẫy: vạch nhịp ký âm lệch nhạc đúng một phách

Sheet ghi 4/4, nhưng bass (nốt ≤ D3) rơi ở **offset 1** của ô XML trong **68/70 ô** (ô 1–70).
Pha ấy giữ nguyên cả sau các ô lẻ 10 (2/4), 11 (3/4), 23 (6/4). Tức phách 1 thật = phách 2 ký âm,
và ký hiệu hợp âm cũng lệch theo: ô 6 ghi `C` ở 0 và `Bb` ở 3, trong khi bass thật là Bb1 ở 1, C2 ở 2.75.
Vì vậy mọi phép đo dưới đây làm trên **ô thật k = [ô XML k offset 1, ô XML k+1 offset 1)**.

Hai hệ quả, **chưa sửa**:
- `CA-PHAO-BALLAD.md` ghi Để Em Rời Xa "51/53 ô có LH ở phách 1" và "lưới 0, 1, 3.25, 3.5, 3.75".
  Hai số này đo trên lưới XML, tức đo lệch pha.
- Kho solo `caPhaoFullSolos.json` của bài này đứng trên lưới XML. Ở giang tấu, bass rơi phổ biến
  nhất ở pha 1 (4/14 nốt). Nút mới vì thế **không gắn `cpSoloSong`**.

## Hai tay lúc hát

**Tay phải là giai điệu lời.** Nốt đỉnh hai lượt phiên trùng nhau từng nốt ở ô thật 5↔33, 6↔36,
8↔34, 9↔37. Cú gõ tay phải **không** mang giai điệu (nằm dưới nốt giai điệu đang ngân, hoặc hụt
≥ 9 nửa cung so với cả hai nốt giai điệu kề bên) chỉ có **19/454**, toàn là nốt đơn:

| đoạn | ô | cú tay phải | không phải giai điệu | có bè dưới giai điệu |
|---|---:|---:|---:|---:|
| phiên 1 | 14 | 125 | 4 | 59 |
| điệp 1 | 7 | 59 | 6 | 32 |
| phiên 2 | 16 | 140 | 4 | 76 |
| điệp 2 | 8 | 66 | 4 | 45 |
| điệp nâng tông | 8 | 64 | 1 | 40 |

**Cách hai tay phối hợp:** bè hoà âm tay phải chêm dưới giai điệu ưu tiên chỗ tay trái trống.
Bảng dưới đếm trên 30 ô phiên đủ 4 phách:

| vị trí trong ô thật | 0 | 0.5 | 1 | 1.75 | 2.5 | 2.75 | 3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| tay trái gõ | 30 | 15 | 9 | 12 | 19 | 8 | 29 |
| cú tay phải có bè / cú tay phải | 18/23 | 7/19 | 18/21 | 15/17 | 4/10 | 14/21 | 11/25 |

Tay trái giữ 1 · 3& · 4. Bè tay phải lấp phách 2 và hai nghịch phách 1.75 · 2.75.
Tay trái tự gánh cả bass lẫn nốt hợp âm (cụm ≥ 2 nốt 18/87 cú ở phiên 1).
Bè tay phải **luôn gõ cùng lúc một nốt giai điệu**, không có nhịp riêng: đó là cách chơi bản độc
tấu, không phải một lớp đệm tách được.

## Bản 2: vì sao DERX "thiếu tiếng, đứt quãng", và sửa gì

Đo số nốt đang vang ở từng móc kép. Phát trên đúng hợp âm và độ dài của sheet: phiên
Bbmaj7/C/Dm7 = 1.75/2.25/4, điệp Bb/C/A/Dm7 = 2/2/1.75/2.25. Mỗi dòng đo hai vòng, 64 móc kép.

| | nốt vang TB | ≤1 nốt vang | móc kép im hẳn |
|---|---:|---:|---:|
| sheet phiên, đủ hai tay (30 ô) | 3,00 | 8% | 2/480 |
| sheet phiên, bỏ giai điệu | 2,09 | 34% | 17/480 |
| sheet cửa sổ 4–5, đủ hai tay | 3,22 | – | 0/32 |
| DERX phiên | 2,50 | 19% | 2/64, ở 1.5–1.75 |
| bản 1 phiên (ô 8–9) | 1,59 | 59% | 2/64 |
| **bản 2 phiên** | **3,44** | **0%** | **0** |
| sheet điệp, đủ hai tay (23 ô) | 2,79 | 11% | 3/368 |
| DERX điệp = bản 1 điệp | 2,19 | 28% | 2/64, ở móc kép cuối |
| **bản 2 điệp** | **2,81** | **0%** | **0** |

Chỗ đứt của DERX nằm đúng chỗ giai điệu lời lấp trong sheet:
- Phách 1.5–1.75 im hẳn: cụm tay trái hết ở 1.5, tay phải đã nghỉ từ 0.5.
- Tay phải trống 0.5→1.75 và 3.25→5.
- Móc kép cuối ô điệp: tay trái hết ở 7.75, tay phải hết ở 7.5.

Bỏ giai điệu mà không lấp gì thì thành lỗ. Sheet không ghi pedal (0 dấu), nên không có số đo độ ngân thật.

**Bản 2 giữ nguyên mốc gõ hai tay của DERX** (phiên cửa sổ 4–5, điệp 24–25, bass đầu điệp theo 52),
cùng cao độ bậc của DERX, `leftHandTop` 59, `rightHandRegister` {55, 60, 74}, không bật
`cpBalladChordLeads`, và có trong `KEEP_RH_RESTS`. Chỉ đổi hai thứ, không thêm cú gõ nào:

1. **Ngân nối.** Mỗi nốt ngân tới cú gõ kế của cùng tay. Renderer cắt ở chỗ đổi hợp âm.
   Đây là biên soạn thay cho pedal; độ ngân sheet ghi cạnh từng cú trong mã (`sheet d`).
   Ở tay phải phiên, **chỉ nốt dưới (bè) ngân nối**, nốt trên giữ độ ngân sheet. Ngân cả hai thì
   dày 3,72 nốt, hơn chính sheet, vì giữa các cú sheet chỉ có một nốt tay phải là giai điệu.
2. **Trả đủ quãng đôi tay phải** ở những cú mà sheet là cụm hai nốt: D4+F4 · E4+C5 · G4+C5 ·
   G4+C5 · F4+C5 ×3 (phiên), F4+D5 ×2 (điệp). DERX rút các cụm này còn nốt dưới. Nốt trên là
   cao độ giai điệu tại chỗ ấy, nhưng chỉ nằm ở cú có bè, nên không chép nhịp giai điệu. Nốt trên
   74 vẫn bỏ (F5, E5, G5).

*Triệu chứng để lùi:*
- Nghe lẫn giai điệu hoặc chỏi giọng hát → bỏ nốt trên của quãng đôi, về đúng tay phải DERX.
- Nghe ù, dính tiếng → trả độ ngân về `sheet d` từng cú.

**Giá trị cũ, bản 1 (`059b4f1`):**
- Phiên = ô thật 8–9: tay trái Bb2 · F3 · gốc@1.75 · G3 ×3 / D2 · C3+D3 · A3 …; tay phải chỉ bè
  dưới giai điệu ở 1 · 1.75 · 2.25 · 2.75 / 1 · 3.
- `leftHandTop` 60, `rightHandRegister` {55, 55, 74}, `cpBalladChordLeads` bật.
- Điệp giống DERX, không ngân nối.

## Bản 3: lấp hai khoảng trống sau Bùm của phiên khúc

Người dùng nghe bản 2: *"sau tiếng Bùm đầu tiên là khoảng nghỉ và tiếng Bùm mạnh thứ 2 … cũng là khoảng
nghỉ. Tôi muốn thêm các tiếng chát để lấp khoảng trống đó một cách hợp lý khớp tiết tấu đang chơi"*.
Hai khoảng: ô 1 phách 1 → 2¾ (1¾ phách không có cú mới), ô 2 phách 1 → 2 (1 phách).

Sheet ở chính các khoảng ấy, không tính giai điệu (đếm trên 6 cửa sổ phiên mỗi kiểu):

| khoảng | có trong sheet | thêm vào nút |
|---|---|---|
| ô kiểu Bb→C, phách 2 (cửa sổ 4, 6, 8, 32, 34, 36) | bè tay phải Bb3+F4 dưới giai điệu **4/6** (6, 8, 34, 36); tay trái gõ ở phách 2: 0/6 | chát tay phải phách 2, gốc+5 (Bb3 dưới sàn 60 nên ra F4+Bb4), ngân ¾ |
| ô kiểu Dm, phách 1& (cửa sổ 5, 7, 9, 33, 35, 37) | tay trái gõ **3/6** (7 D2+D3, 9 C3+D3, 35 A3); bè tay phải 1/6 | chát tay trái phách 1&, C3+D3 của cửa sổ 9, ngân tới câu chạy |

Cụm tay trái đầu ô 2 vẫn ngân. C3 và D3 đánh lại ở 1&, A3 kêu tiếp.
**Giá trị cũ:** bản 2 không có hai cú này.
**Triệu chứng để lùi:** phiên nghe dồn, mất chỗ thở cho giọng → bỏ cú phách 2 trước, vì cú ô 2 có bằng chứng mỏng hơn.
Mốc gõ nay = DERX + hai cú này.

## Bản 4: phiên khúc theo khung tiếng người dùng

Người dùng: *"bỏ tiếng chát 8 mà tôi vừa kêu thêm vào … khung tiếng chính ổn từ tiếng 1 đến tiếng 3, bắt
đầu từ tiếng 4 thì thay … 1Bùm... 2chát...3bùm...4chát-5bùm 6chát... 7bùm 8chát 9bùm … Chỗ 4 chát- 5 bùm …
đánh cho tiếng có cảm giác giật nảy từ chát rồi giật vào bùm … khớp với tiết tấu của điệu ballad đang chơi"*.

| tiếng | vị trí | tay · nốt trên vòng sheet | ngân |
|---|---|---|---|
| 1 Bùm | ô 1 phách 1 | trái Bb2+F3+A3 · phải D4 (+F4 ½) | 1¾ |
| 2 chát | ô 1 phách 2 | phải F4+Bb4 | ¾ |
| 3 bùm | ô 1 phách 2¾ | trái C3+G3 · phải E4+C5 | tới tiếng sau |
| 4 chát | ô 1 phách 4& | phải G4+C5, **ngắn ¼, nhấn** | ¼ |
| 5 bùm | ô 2 phách 1 | trái C3+D3+A3, nhấn | 2 |
| 6 chát | ô 2 phách 2 | phải F4+C5 | 1½ |
| 7 bùm | ô 2 phách 3 | trái D2 | 1 |
| 8 chát | ô 2 phách 3& | phải F4+C5 | 1½ |
| 9 bùm | ô 2 phách 4 | trái D3 | 1 |

Thứ tự và kiểu tiếng là **ý người dùng**. Vị trí 4–9 là **Claude đặt**, người dùng chưa chốt:
- 4–5: chát ngắn và nhấn ½ phách trước vạch, giật vào bùm đầu ô 2.
- 6: đối xứng với tiếng 2.
- 7–8–9: đi đều phách 3 · 3& · 4. Bùm 9 lên quãng tám; tay trái sheet ở phách 4 ô Dm là D3 ở 3/6 cửa sổ.

Nốt chát dùng lại bè sheet đã có: G4+C5 của cửa sổ 4, F4+C5 của cửa sổ 5.
**Bỏ theo khung:** câu chạy tay trái 7 nốt cuối ô 2 (của DERX); chát ở 2¼ · 2¾ · 3¼; chát trái ô 2 phách 1&;
tay trái G3 ở 3& ô 1.
**Giá trị cũ:** bản 3.
**Triệu chứng để lùi:** "giật" nghe cụt → dời chát 4 về phách 4¾ (sát bùm hơn) hoặc bỏ nhấn.
Muốn lại câu chạy → phải dời 7–8–9.

## Bản 5: trả câu chạy tay trái, dời bùm 7 – chát 8 – bùm 9 lên trước nó

Người dùng: *"trả lại câu chạy tay trái 7 nốt cuối và dời 3 tiếng 7 8 9 cho khớp với tiết tấu điệu đang chơi"*.

| tiếng | vị trí | tay · nốt trên vòng sheet | ngân |
|---|---|---|---|
| 5 bùm | ô 2 phách 1 | trái C3+D3+A3 | 1½ |
| 6 chát | ô 2 phách 2 | phải F4+C5 | ¾ |
| 7 bùm | ô 2 phách 2& | trái D2 | ½ |
| 8 chát | ô 2 phách 2¾ | phải F4 (ngân trên câu chạy) + C5 | F4 2¼ · C5 1¼ |
| 9 bùm | ô 2 phách 3 | trái D3 | ¼ |
| câu chạy | ô 2 phách 3¼ → 4¾ | trái A2 D3 E3 F3 E3 D3 C3 | ¼ mỗi nốt |

Vị trí 7–9 do Claude đặt:
- Chát 8 ở phách 2¾ là chỗ bè tay phải dày nhất phiên khúc sheet (15/17 cú có bè). Đó cũng là chát F4+C5 của
  cửa sổ 5, với F4 ngân 2 phách trên câu chạy.
- Bùm 9 ở phách 3: trong sheet, cụm tay trái ngân tới phách 3 rồi câu chạy mới vào (cửa sổ 5).
- Bùm 7 ở phách 2&: để còn khoảng "…" sau chát 6 như khung người dùng. Chỗ này sheet mỏng (tay trái ở 2&
  của ô Dm 1/6), là lựa chọn biên soạn.

**Giá trị cũ:** bản 4 (7–8–9 ở phách 3 · 3& · 4, không câu chạy).
**Triệu chứng để lùi:** đoạn 7–8–9 nghe dồn → bỏ bùm 7 trước.

## Bản 6: 4 chát 5 bùm 6 bum 7 chát thay câu chạy ngẫu nhiên; ô 2 trả 3 chát liền

Người dùng: *"sau tiếng 3 bùm thì nên thay câu chạy ngón ngẫu nhiên bằng 4chát 5bùm 6bum 7chát … (đôn tiếng 7 8 9
cũ lên) … ban đầu ở ô 2 bạn có đánh 3 tiếng chát rồi mới chạy ngón vậy hãy khôi phục chỗ đó, nếu cần thì hãy
thay thế các tiếng ở chỗ cần thiết"*.

**Câu chạy ngẫu nhiên không nằm trong ô đệm.** Đó là câu lót tự động của app (bộ fill thường, hoặc CP Lick/Run
khi màu Cà Pháo), chèn theo mật độ và vị trí hợp âm, không theo chỗ trống của ô. Nên thêm cờ điệu
`autoFills: false`: tắt câu lót tự động cho điệu này, còn ô người dùng tự chọn Fill/Run và chỗ chuyển đoạn vẫn chêm.
Ô đã tắt vẫn tắt. Một danh sách dùng chung (`autoFillSkip`) cho cả hai nhánh câu lót và phần gạch chân ô fill.

Vị trí, đếm trên 6 cửa sổ Bb→C (4, 6, 8, 32, 34, 36):

| tiếng | vị trí | sheet | nốt trên vòng sheet |
|---|---|---|---|
| 4 chát (ngắn, nhấn) | ô 1 phách 3¼ | bè tay phải 3/6 | G4+C5 (cửa sổ 4) |
| 5 bùm (nhấn) | ô 1 phách 3& | tay trái 6/6 | G3 (cửa sổ 4) |
| 6 bum | ô 1 phách 4 | tay trái 6/6 | C4 → gập C3 (cửa sổ 4) |
| 7 chát | ô 1 phách 4& | tay phải **0/6** — biên soạn | G4+C5 |
| 8 bùm | ô 2 phách 1 | cửa sổ 5 | C3+D3+A3 |
| 9 · 10 · 11 chát | ô 2 phách 2 · 2¼ · 2¾ | cửa sổ 5 đúng mốc | F4+C5 (F4 thứ ba ngân trên câu chạy) |
| 12 bùm | ô 2 phách 3 | | D3 |
| câu chạy | ô 2 phách 3¼ → 4¾ | cửa sổ 5 | A2 D3 E3 F3 E3 D3 C3 |

Khung người dùng ghi 10 tiếng. Khôi phục đủ 3 chát liền ở ô 2 thì thay bùm 2& cũ bằng chát 2¼ và thêm chát
phách 2, nên ra 12 cú.

Sau cú chát giật, tay phải buông hẳn để "nảy"; tay trái ngân từng phím tới khi phím ấy được đánh lại (C3 của
bùm 3 tới bum 6, G3 của bùm 5 tới vạch), nên lúc bùm–bum còn hai nốt trầm vang.

**Giá trị cũ:** bản 5.
**Triệu chứng để lùi:**
- 7 chát nghe lạc (sheet không có) → bỏ.
- Muốn có lại câu lót tự động → bỏ `autoFills: false`.

## Bản 7: khung 1Bùm 2chát 3bùm 4chát 5bùm 6chát 7bùm 8bum 9chát 10bum

Người dùng: *"đáng ra ở tiếng 6 phải là chát và từ tiếng 6 trở đi thì thay đổi theo khung này … vẫn giữ 3 tiếng chát
và chạy nốt"*. Tiếng 1–5 giữ nguyên bản 6.

| tiếng | vị trí | sheet | nốt trên vòng sheet |
|---|---|---|---|
| 6 chát | ô 1 phách 4 | tay trái gõ phách 4 ở 6/6 cửa sổ Bb→C, tay phải 0/6 | G4+C5 (biên soạn) |
| 7 bùm | ô 2 phách 1 | cửa sổ 5 | C3+D3+A3 |
| 8 bum (nhẹ) | ô 2 phách 1& | tay trái gõ 1& ở 3/6 cửa sổ Dm | D2 (cửa sổ 7) |
| 9 chát = 3 cú liền | ô 2 phách 2 · 2¼ · 2¾ | cửa sổ 5 đúng mốc | F4+C5, cú ba F4 ngân trên câu chạy |
| 10 bum (nhẹ) | ô 2 phách 3 | | D3, câu chạy vào liền |

Bỏ: bum C3 ở phách 4 và chát ở 4& của bản 6. C3 của bùm 3 nay ngân tới vạch vì không còn bị đánh lại.
**Giá trị cũ:** bản 6.
**Triệu chứng để lùi:** phách 4 nghe lạc tay phải → trả bum tay trái ở phách 4.

## Bản 8: bỏ 3 chát liền để nghe đủ khung

Người dùng: *"do 3 tiếng chát cuối đã làm mất khung (ko nghe từ tiếng 8 trở đi) vậy thì hãy bỏ 3 tiếng chát cuối để
chơi đủ tiếng của khung"*.

Nguyên do nghe mất:
- ba cú F4+C5 ở 2 · 2¼ · 2¾ đè đúng quãng của bum 8 và bum 10;
- bum 10 (phách 3) dính liền câu chạy ¼ phách sau, nên nghe thành nốt đầu câu chạy;
- hai bum đánh nhẹ (.65) dưới cụm bùm 7 đang ngân.

**Sửa (ô 2):**
- còn một chát 9 ở phách 2 (F4+C5 cửa sổ 5; F4 ngân trên câu chạy như sheet);
- bum 10 dời phách 3 → **2¾**, D2 (cửa sổ 9, 37 có D2 ở đây), cách câu chạy ½ phách;
- bum 8 D2 ở 1&; hai bum lực .8;
- cụm bùm 7 nhả ở phách 2 (cũ ngân 2).

**Giá trị cũ:** bản 7.
**Triệu chứng để lùi:** bum 8/10 nghe nặng → hạ lực về .65.

## Bản 9: trả 3 chát (về bản 7); tiếng 7–10 không nghe thấy — chưa rõ nguyên do

Người dùng: *"tôi chỉ nghe thấy Bùm chát bùm chát bùm chát … ko nghe từ tiếng 7 trở đi … ko phải do 3 tiếng chát,
hãy mang chúng trở lại"*. Ô phiên lấy lại nguyên bản 7 (`5e5504b`).

Đã kiểm, chưa ra nguyên do:
- Bộ dựng đệm (`renderPattern`, gọi một lần cho cả bài ở `ReharmHome`) **có đủ ô 2**; test khoá đủ từng cú.
- Chỉ mở lại mẫu ở đầu đoạn và ở hợp âm chia đôi của điệu "biết chia đôi" (điệu này không thuộc loại ấy).
- CP Lick/Run (`cpBacking`) xoá đệm trong cửa sổ câu. Có đánh dấu Run ở hợp âm ô 2 thì cửa sổ là phách 3 → 4¾
  (ô 2 còn 6/14 cú); Fill là 3¾ → 4¾. Cả hai **không** chạm tiếng 7 · 8 · 9 (phách 1 → 2¾).
- Khả năng về tai, chưa kiểm: bùm 7 là cụm C3+D3+A3 không có gốc trầm, nghe giống chát; bum 8 · 10 lực .65
  nằm dưới cụm đang ngân. Cần người dùng cho biết cách đang nghe (màu hợp âm, ô Fill/Run, độ dài hợp âm, tab).

## Bản 10: bùm 7 có gốc trầm D2, hai bum lực .8

Người dùng đồng ý thử hướng "về tai" của bản 9: *"làm đi"*.
- Bùm 7 = D2 + C3+D3+A3. Cửa sổ 9 có D2 ở đầu ô. Bum 8 đánh lại D2 ở 1&.
- D2 phải là **cú riêng**: renderer cắt cả cú khi một phím trong đó bị đánh lại, nên để chung một cú thì cụm
  tắt ngay ở bum 8 (bẫy đã sập khi dựng — test độ phủ bắt được).
- Bum 8 · 10 lực **.8** (cũ .65).
- 3 chát giữ nguyên.

**Triệu chứng để lùi:** ô 2 nghe nặng/đục → bỏ D2 ở bùm 7, hoặc lực bum về .65.

## Bản 11: nguyên do "không nghe tiếng 7 trở đi" — hợp âm treo D9sus4 làm chát ô 2 thành một nốt

Người dùng xuất bài đang nghe (`Bài chưa đặt tên.keytrain.json`, 25/9 16:28). Cài đặt của bài:
- lời 4 khổ, mỗi dòng một hợp âm, mỗi hợp âm 4 phách, một đoạn duy nhất;
- không có Fill/Run, không đặt nghỉ, CP Lick tắt;
- màu át **9sus4**.

Dựng lại đúng đường chạy (đọc lời → tái hòa âm → dựng đệm): vòng là Gadd2 **D9sus4** Em9 Bm7 Cadd2 Gadd2 Am11 **D9sus4**.
Ô 2 rơi vào D9sus4 ở **2/4 chu kỳ**. Trên hợp âm treo:
- `tone(1)` không có bậc 3 nên lùi về bậc 7, trùng `tone(3)`. Chát "bậc 3 + bậc 7" thành **C5+C5**, tức một nốt gõ trùng
  phím, ba lần.
- Câu chạy F3 thành C3.

Bùm, bum vẫn có, nhưng mất chát thì khung không nghe ra.

**Sửa:** `ba3()` = bậc 3, hợp âm thiếu bậc 3 thì lấy **nốt treo** (bậc 4, `fallbackInterval` 5). Thay cho mọi `tone(1)` trong hai ô
của nút (13 chỗ). Hợp âm có bậc 3 không đổi. Trên D9sus4 nay chát = G4+C5; câu chạy A2 D3 E3 **G3** E3 D3 C3.
Test chống trùng phím nay quét cả `sus4`, `9sus4` (trước chỉ '', m, 7, maj7, m7, nên không bắt được).

**Giá trị cũ:** `tone(1)` lùi về bậc 7 rồi bậc 5.
**Bài học:** thử trên vòng đã tái hòa âm với màu của người dùng, không chỉ trên hợp âm trơn.

## Bản 12: khung 11 tiếng + (chát chát chát) → chạy; bùm nối bum thì dẫn bass

Người dùng: *"3 tiếng chát nên để ra cuối khung … 1Bùm 2chát 3bùm 4chát-5bùm 6bum 7chát 8bùm-9bum 10chát 11bùm (chát chát chát) …
tiếng 4 qua 5 thì hơi giật hơn chút chỗ tiếng 8 qua 9 cũng đánh giật; chỗ Bùm mà nối tiếp bum thì nên chơi dẫn bass"*.

| tiếng | vị trí | nốt trên vòng sheet |
|---|---|---|
| 1–3 | ô 1 phách 1 · 2 · 2¾ | như cũ |
| 4 chát | ô 1 phách 3¼ | G4+C5, **dài .15 (cũ ¼), lực .9 (cũ .8)** |
| 5 bùm | ô 1 phách 3& | G3, lực .9 |
| 6 bum — dẫn bass | ô 1 phách 4 | gốc hợp âm sau hạ một cung (`som` + `requireNextChord`): C2 → D2 |
| 7 chát | ô 1 phách 4& | G4+C5 |
| 8 bùm | ô 2 phách 1 | D2 ngắn ¼ + cụm C3+D3+A3 |
| 9 bum — dẫn bass | ô 2 phách 1¼ | E2 (bậc 2) |
| 10 chát | ô 2 phách 1& | F4+C5 |
| 11 bùm | ô 2 phách 1¾ | F2 (bậc 3; hợp âm treo lấy nốt treo) |
| chát chát chát | ô 2 phách 2 · 2¼ · 2¾ | F4+C5, cú ba F4 ngân trên câu chạy (cửa sổ 5) |
| câu chạy | ô 2 phách 3¼ → 4¾ | A2 D3 E3 F3 E3 D3 C3 |

Vị trí do Claude đặt:
- Câu chạy 7 nốt phải vào ở 3¼ để kết đúng vạch, nên 3 chát giữ mốc cửa sổ 5 và 8–11 dồn trong phách 1 ô 2.
- Đường bass ô 2 đi 1 · 2 · 3 rồi câu chạy mở bằng bậc 5.
- Bum 6 cùng lối "bậc dưới bass sau" của phách dẫn Có Em Chờ. Hạ đúng một cung (không theo gam), vì mẫu không biết giọng.
  Hợp âm không đổi ở vạch thì bỏ cú.

Trên bài người dùng: G→D9sus4 ra bum 6 C2; Em9→Bm7 ra A2.
**Giá trị cũ:** bản 11.
**Triệu chứng để lùi:** phách 1 ô 2 nghe dồn → bỏ chát 10.

## Bản 13: mọi "bùm" có cả tay phải

Người dùng: *"Bùm ko phải là chỉ đánh bass. Tiếng Bùm 1 còn có cả tay phải cùng đánh. Các tiếng bùm chát là các tiếng chính của
khung nên phải thể hiện rõ"*.

Nghĩa đúng:
- **bùm** = bass + hợp âm tay phải cùng lúc;
- **chát** = hợp âm tay phải không bass;
- **bum** = bass nhẹ (dẫn).

Bản 12 có ba bùm chỉ tay trái. Nay thêm tay phải:
- bùm 5 (ô 1 phách 3&): E4+C5, như bùm 3;
- bùm 8 (ô 2 phách 1): F4+A4 (bậc 3+5);
- bùm 11 (ô 2 phách 1¾): F4+A4.

Chát giữ quãng đôi riêng (G4+C5 · F4+C5), nên tai phân biệt được bùm với chát. Test khoá vai từng tiếng: bùm hai tay, bum chỉ
tay trái, chát chỉ tay phải.
**Giá trị cũ:** bản 12.
**Triệu chứng để lùi:** ô 2 dồn quá → bỏ tay phải ở bùm 11 trước.

## Bản 14: bum cũng có hợp âm; lực tiếng chính ba mức

Người dùng: *"Bum là chỗ dẫn nhưng cũng phải là đánh bass cùng với hợp âm. Các tiếng chính trong khung đều phải có tiếng rõ rệt,
dù có tiếng mạnh tiếng nhẹ nhưng khi đã là tiếng chính thì phải rõ rệt"*.

**Hợp âm cho bum:**
- bum 6 (ô 1 phách 4): E4+G4 nhẹ, trên bass dẫn;
- bum 9 (ô 2 phách 1¼): F4+A4 nhẹ, trên E2.

**Lực tiếng chính** (biên soạn, không phải số đo):
- NHẤN .9: Bùm 1, chát 4, bùm 5, bùm 8.
- THƯỜNG .8: chát 2 · 7 · 10, 3 chát cuối, bùm 3 · 11.
- NHẸ .7: tay phải của bum 6 · 9.

**Giá trị cũ:** tay phải mặc định .65, bùm 3 tay trái .65 (sau hệ số tay trái còn khoảng .55); bum chỉ có bass.
**Triệu chứng để lùi:** nghe nặng tay → THƯỜNG về .7.
Test khoá: bùm và bum đủ hai tay, chát chỉ tay phải, lực tay phải mọi cú chính ≥ .7.

## Bản 15: bum không hợp âm; bass của mọi bùm/bum dày hai–ba nốt

Người dùng: *"chỗ Bum đừng đánh hợp âm kèm theo nữa; các chỗ Bùm và bum nếu chỉ đánh 1 nốt bass thì nghe quá mờ nhạt, tiếng chính
của khung thì cho dù là bass cũng phải đánh rõ và dày lên để tách biệt"*.

| tiếng | bass mới | trên vòng sheet |
|---|---|---|
| 3 bùm | gốc + gốc quãng tám + bậc 5 | C2+C3+G3 |
| 5 bùm | bậc 5 + gốc quãng tám | G2+C3 |
| 6 bum (dẫn, bỏ tay phải) | gốc hợp âm sau hạ một cung + quãng 5 của nó | C2+G2 → D |
| 8 bùm | D2 + cụm, cụm ngắn ¼ cho giật sang bum 9 | D2 + C3+D3+A3 |
| 9 bum (dẫn, bỏ tay phải) | bậc 2 + bậc 5 | E2+A2 |
| 11 bùm | bậc 3 + gốc quãng tám | F2+D3 |

**Bẫy khi dựng:** kiểu "nốt + quãng tám của nó" chạm sàn (36) hoặc trần tay trái (59) thì bị gập về trùng phím. Dẫn vào Đô, nốt
Bb1 gập lên Bb2 trùng Bb2; bậc 5 hay bậc 3 quãng tám ở gốc cao cũng vượt 59. Nên chọn cặp luôn nằm gọn trong 36–59. Test quét
12 gốc × 7 loại hợp âm, không cú nào trùng phím.

**Giá trị cũ:** bản 14 (bum có hợp âm tay phải nhẹ; bass bùm 5 · bum 6 · bum 9 · bùm 11 một nốt).
**Triệu chứng để lùi:** bass đục/nặng → bỏ nốt trên của cặp ở bum 9 trước.

## Bản 16: bùm/bum 5–11 thành giai điệu thấp nốt đơn cùng tầm câu chạy

Người dùng: *"tiếng Bum đánh bass dày cũng ko hiện rõ được tiếng, tôi nghe ở câu chạy nốt có những nốt thấp vậy bạn thử cho Bùm
và Bum đánh giai điệu thấp giống như trong câu chạy nốt đi"*.

Suy đoán (chưa đo): câu chạy nghe rõ vì nằm ở A2–F3 (≈ 45–53), nốt đơn đi liền bậc. Cặp bass dày bản 15 nằm ở C2–G2
(36–43), vùng đục của piano, nên dày thêm cũng không rõ hơn.

**Nay** tay trái của bùm 5 · bum 6 · bùm 8 · bum 9 · bùm 11 là một nốt, đi liền bậc vào câu chạy:
- vòng sheet: **G3 → C3 (dẫn) → D3 → E3 → F3** → câu chạy A2 D3 E3 F3 E3 D3 C3;
- bài người dùng G → D9sus4: D3 → C3 → D3 → E3 → G3 → câu chạy.

Bùm vẫn có hợp âm tay phải; hợp âm của bùm 5 · 8 ngân qua bum 6 · 9, để lúc bum vang không chỉ một nốt.
Bùm 1 · 3 trả về như cũ (Bb2+F3+A3, C3+G3).

**Giới hạn đã biết:** gốc từ G# trở lên, nốt vượt trần tay trái 59 bị gập xuống một quãng tám. Ví dụ Bm7: B3 → **C#3** → D3.
Câu chạy DERX cũng gập như vậy. Sửa phải nới tầm tay trái riêng cho điệu, và việc đó đổi cả Bùm 1.
**Giá trị cũ:** bản 15 (cặp bass G2+C3 · C2+G2 · D2+cụm · E2+A2 · F2+D3).
**Triệu chứng để lùi:** giai điệu thấp nghe lẫn với câu chạy → trả bùm 8 về cụm cửa sổ 5.

## Bản 17: tiếng 6 là nốt dẫn rõ từ 5 qua 7

Người dùng: *"vấn đề ở đây là tiếng Bum 6 bị đánh chìm xuống dưới; tiếng 5 nghe vẫn rõ và tiếng 7 nghe cũng rõ. Phải đánh tiếng 6
nghe rõ như tiếng 5 và 7 và tiếng 6 là tiếng dẫn từ 5 qua 7"*.

Hai nguyên do (suy từ mã, chưa đo tiếng):
- Bản 16 cho hợp âm tay phải của tiếng 5 (lực .9) ngân đè lên tiếng 6.
- Tiếng 6 là một nốt tay trái C3, tụt dưới G3 của tiếng 5, trong khi 5 và 7 nghe rõ nhờ phần tay phải E4–C5.

**Nay:**
- Tiếng 6 là **nốt đơn tay phải, lực .9**, thấp hơn một nốt của chát 7 đúng một cung rồi bước lên nó. Trên Đô: E4 → **F4** → G4;
  trên Sol: C4 → D4.
- Hợp âm tay phải của 5 nhả đúng lúc 6 vào. Bass G3 của 5 ngân đỡ tới vạch.

Viết theo "bậc 5 hạ 2 nửa cung", không theo "bậc 4": sàn tay phải 60 đẩy bậc 3 của Sol lên Si4, nên "bậc 4" sẽ nhảy xuống.
Test kiểm liền bậc trên 12 hợp âm.
**Mất:** tiếng 6 không còn dẫn bass vào ô 2 (C3 → D3).
**Giá trị cũ:** bản 16.
**Triệu chứng để lùi:** 6 nghe lạc khỏi vai "bum" → trả về dẫn bass tay trái, nhưng không để hợp âm của 5 đè lên.

## Bản 18: thêm một tiếng sau tiếng 6 — dẫn nửa cung vào chát

Người dùng: *"cần thêm một tiếng sau tiếng 6 nữa để nối liền bậc từ tiếng 5 vào 7. Có vẻ như giống với cấu trúc câu chạy từ sau tiếng
7 vậy"*.

Hiểu là lặp dáng "bùm 8 – bum 9 – chát 10" của đầu ô 2 (hai nốt cách ¼ phách rồi vào chát). Nên:
- tiếng mới ở ô 1 phách **4¼**, tay phải, lực .85, cao hơn tiếng 6 nửa cung và thấp hơn một nốt của chát kế nửa cung;
- tiếng 6 ngắn lại còn ¼.

Trên Đô: **E4 → F4 → F#4 → G4**; Sol: C4 → C#4 → D4; Mi thứ: A4 → A#4 → B4. Test kiểm trên 12 hợp âm.
Khung nay 12 tiếng: Bùm chát bùm chát–bùm bum dẫn chát | bùm–bum chát bùm (chát chát chát) → câu chạy.
**Giá trị cũ:** bản 17.
**Triệu chứng để lùi:** nửa cung F#4 nghe lạ giọng → đổi tiếng mới thành nốt lặp lại tiếng 6.

## Bản 19: sau tiếng 3 là câu chạy 7 nốt đan hai tay — đúng như sheet

Người dùng: *"có vẻ như vấn đề là sau tiếng 3 thì phải là một câu chạy 7 nốt giống như sau tiếng 7. Ko phải là tiếng 4 dính liền với
tiếng 3. Hãy đối chiếu lại với sheet để em rời xa và điều chỉnh"*.

**Đối chiếu sheet** (`scripts/audit_cp_de_em.py`, dòng "cau chay o 1"):
- Trong các cửa sổ Bb→C của phiên, ghép hai tay từ **3¼ → 4¾** có **7 mốc móc kép liền**, hai tay đan nhau
  `P T P TP P T P`. Đủ 7 ở **4/6 cửa sổ** (6, 8, 34, 36); cửa sổ 4 và 32 có 5 mốc rồi giai điệu ngân.
- Cùng mốc với câu chạy tay trái 7 nốt của ô 2 (cửa sổ 5).
- Không có câu chạy một tay nào ở ô 1: quét cả phần hát, câu 7 nốt một tay chỉ có ở cửa sổ 5.

**Bẫy của các bản trước:** tay phải C4 · E4 · C4 ở 4 · 4¼ · 4¾ bị coi là giai điệu lấy đà nên bỏ. Chỗ trống được lấp bằng chát 4 ·
bùm 5 · bum 6 · dẫn · chát, dính sát tiếng 3, và dáng câu chạy mất.

**Nay** (cửa sổ 8): Bùm 1 · chát 2 · bùm 3 → **A4 · G3 · C5 · C4+G3 · E4 · G3 · C4**. Tay phải lấy nốt đỉnh của cụm sheet
(E4/A4 → A4, G4/C5 → C5), tay trái G3 ×3. Khung: Bùm chát bùm → câu chạy đan | bùm–bum chát bùm (chát ×3) → câu chạy tay trái.
**Giá trị cũ:** bản 18.
**Triệu chứng để lùi:** câu chạy ô 1 nghe lộ giai điệu → lấy nốt dưới của cụm (E4 thay A4, G4 thay C5).

## Bản 20: câu chạy một thành khung "Chát-bùm bum chát bùm chát bùm bum" (thử cách 1)

Người dùng: *"hãy chỉnh cấu trúc câu chạy một thành khung bùm chát … Chát-bùm bum chát bùm chát bùm bum. Tiếng bùm ko phải là chỉ đánh
bass mà là đánh các giai điệu (có thể là giai điệu thấp) và kèm với bass; bùm bum thì là đánh dẫn"*.

Khung 8 tiếng mà câu chạy có 7 mốc. Người dùng chọn **thử cách 1** (nghe rồi mới chốt): "Chát-bùm" là một cú hai tay. Hai cách còn
lại để dành:
- 8 cú bắt đầu từ phách 3 (nhãn trong câu hỏi lúc ấy ghi nhầm "phách 4", xem bản 28);
- 8 cú, bum cuối rơi vào đầu ô 2.

| mốc | tiếng | tay trái | tay phải |
|---|---|---|---|
| 3¼ | Chát-bùm | C3 | E4+A4 (cửa sổ 8) |
| 3& | bum dẫn | G3 (cửa sổ 8) | — |
| 3¾ | chát | — | G4+C5 (cửa sổ 8) |
| 4 | bùm | G3 (cửa sổ 8) | C4 giai điệu (cửa sổ 8) |
| 4¼ | chát | — | E4+G4 (sheet E4 + G4) |
| 4& | bùm dẫn | C3 + E3 giai điệu thấp | — |
| 4¾ | bum dẫn | C#3: nửa cung dưới gốc hợp âm sau (`som`) → D3 đầu ô 2 | — |

Hợp âm tay phải nhả đúng lúc tiếng bum vào, nên hai tiếng bum vang một mình (test độ phủ cho phép riêng hai mốc ấy một nốt).
**Giá trị cũ:** bản 19 (A4 · G3 · C5 · C4+G3 · E4 · G3 · C4).
**Triệu chứng để lùi:** cách 1 chưa ổn → thử cách 2 hoặc 3.

## Bản 21: câu chạy một — tiếng bùm/chát bằng hợp âm, không nốt chạy lẻ

Người dùng: *"tạm dùng cấu trúc câu chạy này đi nhưng đừng cho chạy nốt ngẫu nhiên nữa mà hãy tạo tiếng bùm chát bằng hợp âm"*.
Giữ khung cách 1 "Chát-bùm bum chát bùm chát bùm bum" (mốc 3¼ → 4¾). Chỉ dùng nốt của hợp âm:
- **chát** = hợp âm ba nốt tay phải (Đô: E4+G4+C5);
- **bùm** = bass gốc C3 + hợp âm ấy;
- **bum (dẫn)** = bass bậc 5 G3, vang một mình.

Bùm gốc – bum bậc 5 là bass luân phiên.

| mốc | 3¼ | 3& | 3¾ | 4 | 4¼ | 4& | 4¾ |
|---|---|---|---|---|---|---|---|
| tiếng | Chát-bùm | bum | chát | bùm | chát | bùm | bum |
| tay trái | C3 | G3 | — | C3 | — | C3 | G3 |
| tay phải | E4 G4 C5 | — | E4 G4 C5 | E4 G4 C5 | E4 G4 C5 | E4 G4 C5 | — |

Câu chạy tay trái ô 2 (cửa sổ 5) giữ nguyên: người dùng đã đòi trả lại, và nó là câu có thật trong sheet.
**Giá trị cũ:** bản 20 (C3+E4A4 · G3 · G4C5 · G3+C4 · E4G4 · C3+E3 · C#3).
**Triệu chứng để lùi:** nghe dặm đều quá, mất chất ballad → cho chát nhẹ hơn bùm, hoặc chát hai nốt.

## Bản 22: chát chọn nốt giai điệu theo đỉnh của sheet, bum hai nốt bass

Người dùng: *"tiếng chát hãy linh hoạt chọn nốt giai điệu trong hợp âm để đánh chứ đừng chỉ dặm hợp âm, nhớ học từ sheet để chọn
nốt ko bị chói tai; tiếng Bum thì hãy đánh 2 nốt bass hoặc đánh thêm giai điệu nghe cho rõ ràng so với các tiếng xung quanh nó"*.

**Số đo (tay phải sheet ở mốc chát, 4 cửa sổ 6 · 8 · 34 · 36, `scripts/audit_cp_de_em.py`):** 3¼ A4 (có khi kèm E4) · 3¾ C5
(kèm G4 ở 3/4 cửa sổ) · 4¼ E4. Đỉnh đi lên rồi xuống. Chỉ A4 nằm ngoài hợp âm Đô (bậc 6).
**Suy đoán của Claude:** trên hợp âm thứ (Em, Am) nốt ở vị trí ấy thành nốt ngoài giọng (C# trên Em), nên đổi về nốt hợp âm
gần nhất G4. Hai nốt còn lại giữ đúng sheet.

| mốc | 3¼ | 3& | 3¾ | 4 | 4¼ | 4& | 4¾ |
|---|---|---|---|---|---|---|---|
| tiếng | Chát-bùm | bum | chát | bùm | chát | bùm | bum |
| tay trái | C3 | **C3+G3** | — | G3 | — | G3 | **E3+G3** |
| tay phải | **E4+G4** | — | **G4+C5** | **C4** | **C4+E4** | **G4** | — |

- chát: hai nốt, đỉnh G4 → C5 → E4 (sheet A4 → C5 → E4).
- bùm: một nốt giai điệu tay phải (C4, G4 — sheet có C4 ở phách 4) cùng bass G3 (sheet có G3 ở 4 và 4&).
- bum: hai nốt bass, không có tay phải. Bum cuối E3+G3 đi xuống gốc D3 đầu ô 2.

**Giá trị cũ:** bản 21 (mọi chát/bùm dặm cùng một khối E4G4C5; bum một nốt G3; bass bùm C3 · C3 · C3).
**Triệu chứng để lùi:**
- chát hai nốt nghe mỏng hơn tiếng bùm quanh nó → thêm nốt thứ ba dưới đỉnh;
- bum hai nốt vẫn chìm → thêm một nốt giai điệu thấp tay phải (cách thứ hai người dùng nêu).

## Bản 23: bum là bass dẫn liền bậc vào tiếng kế

Người dùng: *"tiếng bum phải là dẫn bass qua tiếng kế tiếp"*.

Bản 22 cho bum hai nốt đứng (C3+G3, E3+G3), không bước vào đâu. Nay mỗi bum là **một nốt bass dẫn, đánh cặp quãng tám** (giữ
"2 nốt bass" của bản 22), cách nốt bass của tiếng kế một cung hoặc nửa cung, bên dưới:

| mốc | tiếng | tay trái (vòng sheet C → Dm7) | đi vào |
|---|---|---|---|
| 3& | bum | **F2+F3** | G3 của bùm phách 4 |
| 4¾ | bum | **C2+C3** | D3 của bùm đầu ô 2 |

**Số đo:** sheet dẫn vào ô 2 bằng C4 → D (2/6 cửa sổ 6 · 8 · 34 · 36; còn lại 2/6 là F4 giai điệu, 2/6 để trống). Ở phách 3&
sheet KHÔNG dẫn: tay trái G3 (4/6) hoặc C3 (2/6) sau C3, tức nhảy quãng 5. Bum 3& là ý người dùng, không phải sheet.

**Cơ chế** (`RhythmHit.danVao`, `danVao` trong `patternRenderer.ts`): `tones` ghi nốt ĐÍCH theo hợp âm vang lúc bum hết, rồi lùi
một cung nếu nốt ấy còn trong gam của hợp âm đang vang, không thì nửa cung.
**Suy đoán của Claude (chưa có sheet):** gam = trưởng (bảy thứ nếu hợp âm có b7) cho hợp âm trưởng/treo, thứ tự nhiên cho hợp âm
thứ. Ra: G → C dẫn B · C → F dẫn E · A → Dm dẫn C# · C → G dẫn F · C → Dm dẫn C (khớp sheet). Test kiểm liền bậc trên 12 gốc × 4
loại vòng.

**Bẫy đã sập:** nốt dưới của cặp quãng tám dẫn nằm dưới nốt gốc hợp âm đang vang (Db → Db: C2 dưới Db2), làm đỏ
`leftArpeggioAboveRoot`. Nay nốt nào tụt dưới gốc thì đánh chính nốt gốc ấy làm nền: Db2+C3, A → Dm là A2+C#3. Nốt trên vẫn dẫn.

**Giá trị cũ:** bản 22 (bum C3+G3 · E3+G3).
**Triệu chứng để lùi:**
- cặp quãng tám ở C2–F2 nghe đục → bỏ nốt dưới, giữ một nốt dẫn ở quãng tám 3;
- dẫn nửa cung nghe lạ giọng ở một vòng nào → đổi luật gam cho loại hợp âm ấy.

## Bản 24: bum câu chạy một thêm giai điệu thấp tay phải — cũng là tiếng dẫn

Người dùng: *"tiếng Bum trong câu chạy đầu tiên vẫn mờ nhạt vậy hãy thêm nốt giai điệu thấp ở tay phải, nhưng tất nhiên là
giai điệu đó cũng tuân thủ chức năng làm tiếng dẫn"*.

Mỗi bum của câu chạy một có thêm **một nốt tay phải** bước liền bậc vào một nốt tay phải của tiếng kế. Cùng cờ `danVao`, cùng
luật gam như bass dẫn.

| mốc | tiếng | tay trái | tay phải (mới) | tay phải đi vào |
|---|---|---|---|---|
| 3& | bum | F2+F3 → G3 | **F4** | G4 của chát 3¾ |
| 4¾ | bum | C2+C3 → D3 | **E4** | F4 của bùm đầu ô 2 (Dm7) |

**Số đo:** sheet KHÔNG có nốt tay phải ở 3& (6/6 cửa sổ 4 · 6 · 8 · 32 · 34 · 36). Ở 4¾ sheet có C4 (2/6) hoặc F4 (2/6), rồi
nhảy lên C5/F5, không bước liền bậc. Cả hai nốt tay phải là ý người dùng, không phải sheet.
**Bẫy tay phải:** nốt dẫn lùi xuống dưới sàn tay phải (60) thì bộ kẹp cuối đẩy lên một quãng tám, mất bước liền bậc. Khi ấy dẫn
từ TRÊN xuống (một cung nếu còn trong gam, không thì nửa cung). Test kiểm tay phải liền bậc trên 12 gốc × 4 loại vòng.
Ô 2 bum (phách 1¼) không đổi — người dùng chỉ nói câu chạy đầu tiên.

**Giá trị cũ:** bản 23 (bum chỉ tay trái).
**Triệu chứng để lùi:** bum 3& ba nốt Fa (F2 F3 F4) nghe như bass nặng chứ không ra giai điệu → nhắm nốt trên của chát (dẫn B4 →
C5) thay vì nốt dưới.

## Bản 25: nốt dẫn tay phải không chói với tay trái cùng mốc

Người dùng nghe bản 24: *"nghe chưa ổn"*, chọn lý do "nốt dẫn nghe lạ, chói".

**Đo trên bài người dùng đang thử** (file xuất `Bài chưa đặt tên.keytrain.json`, 25/9 16:28): vòng G D Em Bm C G Am D,
màu trưởng add9, át 9sus4. Dựng lại 8 tiếng bum mỗi vòng: **1/8 chói** — ô 1 phách 4¾ trên Gadd9 → D9sus4, tay trái G2+C3, tay
phải F#4 (bảy trưởng với G2, tăng bốn với C3). 7 tiếng còn lại không có quãng 2 thứ / 7 trưởng / tăng 4.
**Nguyên do:** tay phải chọn nốt dẫn một mình, không biết tay trái đang dẫn nốt gì (bộ vẽ dựng tay phải trước).

**Nay:**
- Ô nhịp có tiếng dẫn tay phải thì dựng tay trái trước; tay phải đọc nốt tay trái cùng mốc.
- `tones` tay phải của bum ghi mọi nốt của tiếng kế. Bộ vẽ chọn MỘT nốt dẫn liền bậc vào một trong số đó, trong gam, không
  quãng 2 thứ / 7 trưởng / tăng 4 với tay trái. Thử bước từ dưới của mọi nốt đích trước, rồi mới bước từ trên.
- Quãng 9 (add9) và 7 thứ (9sus4) vẫn cho — là màu người dùng đang dùng. Luật chặt hơn (chỉ 1 · 3 · 6 · 5) làm Db → Db không
  còn nốt nào đi được.

Bài người dùng: ô 1 bum 4¾ F#4 → **G4 → A4**; 7 tiếng còn lại giữ nguyên. Vòng sheet giữ nguyên (F4 → G4, E4 → F4).
Test: 12 gốc × 6 loại vòng (thêm add9 → D9sus4, m → Bm), tay phải không quãng chói với tay trái.

**Giá trị cũ:** bản 24 (tay phải nhắm riêng nốt dưới của tiếng kế).
**Triệu chứng để lùi:** vẫn nghe lạ ở tiếng khác → đem vòng hợp âm chỗ đó ra dựng lại, xem quãng giữa hai tay.

## Bản 26: bum là walking bass — một nốt tay trái, đi tiếp chiều bè trầm

Người dùng (bài Fadd2 G9 Am(add9)): *"chỗ Fadd2 tuy là tiếng Bum đã hết lạ tai nhưng tôi muốn Bum là kiểu Walking Bass chứ ko
phải giai điệu như vậy, nghe nó ko hay. Sửa áp dụng cho các hợp âm khác chứ ko riêng Fadd2"*.

Bản 25 trên Fadd2 → G9: bum 3& là Bb2+Bb3 + Bb4 (ba nốt Si giáng), bum 4¾ là F2+F3 + A4 — nghe ra giai điệu.

**Nay:**
- Bỏ nốt tay phải ở bum (bản 24–25) và bỏ cặp quãng tám. Bum là **một** nốt tay trái, vang một mình.
- Nốt ấy bước một cung / nửa cung vào bass của tiếng kế (luật gam như bản 23) và **đi tiếp chiều** của bè trầm: nốt bass trước
  cao hơn đích thì dẫn từ trên xuống, thấp hơn thì từ dưới lên. Trùng đúng nốt trước (bè đứng yên) thì đổi phía; phía trên
  vượt trần 59 thì lấy bước còn lại phía dưới (Dm → Bm: A3 → Bb3 → B3).

| vòng | tay trái 3¼ → bum 3& → bùm 4 → bùm 4& → bum 4¾ → ô 2 |
|---|---|
| Fadd2 → G9 (bài người dùng) | F3 → **D3** → C3 → C3 → **F3** → G3 |
| Am(add9) → Fadd2 | A3 → **F3** → E3 → E3 → **G3** → F3 |
| G9 → Am(add9) | G3 → **E3** → D3 → D3 → **G3** → A3 |
| C → Dm7 (sheet) | C3 → **F3** → G3 → G3 → **E3** → D3 |

Vòng sheet: bum 4¾ nay là E3 (dẫn từ trên), sheet dẫn C4 → D (từ dưới, 2/6 cửa sổ) — theo ý người dùng, không theo sheet.
Luật gam và luật chiều là suy đoán của Claude. Test: 12 gốc × 6 loại vòng — một nốt, không tay phải, cách đích 1–2 nửa cung,
không trùng nốt bass trước.

**Giới hạn đã biết:** bùm 4 và bùm 4& cùng đứng ở bậc 5 (sheet G3 ×2), nên trước bum 4¾ bè trầm nhảy một quãng 4 (C3 → F3 trên
Fadd2). Bum chỉ có một chỗ nên không lấp được. Muốn cả dòng đi liền bậc thì phải đổi bass của hai bùm ấy.
**Giá trị cũ:** bản 25 (bum = cặp quãng tám + nốt giai điệu tay phải).
**Triệu chứng để lùi:** một nốt bass lại nghe mờ → tăng lực bum; đừng thêm lại nốt tay phải (người dùng đã bác).

## Bản 27: cả dòng 3& → 4¾ là walking bass soạn cùng lúc

Người dùng, sau khi được báo bản 26 còn nhảy quãng 4 trước bum 4¾ vì hai bùm đứng bậc 5: *"làm luôn đi"*.

**Nay:** bum 3& · bùm 4 · bùm 4& · bum 4¾ là MỘT dòng tay trái, soạn cùng lúc (`walkingBass` trong `patternRenderer.ts`), đi
liền bậc từ bass Chát-bùm (3¼) tới gốc đầu ô 2. Mỗi bước một cung hoặc nửa cung. Bộ soạn thử mọi dòng (4⁴ = 256), chọn dòng ít
điểm phạt nhất:
- nốt ngoài gam hợp âm đang vang +3 (nốt cuối dẫn chromatic nửa cung vào đích chỉ +1);
- tiếng bùm không trúng nốt hợp âm +2;
- đổi chiều +2; đi tới lui +1;
- chói với tay phải cùng mốc (quãng 2 thứ / 7 trưởng / tăng 4) +3.
Hoà điểm thì dòng tìm thấy trước thắng (bước đầu về phía đích, một cung trước nửa cung). Không xúc xắc.
Cả luật chấm điểm là **suy đoán của Claude**, không có sheet đứng sau: sheet Để em ở hai bùm này là G3 G3 (bậc 5, cửa sổ 6 · 8 ·
34 · 36) — đã bỏ theo ý người dùng.

| vòng | 3¼ → bum → bùm → bùm → bum → ô 2 |
|---|---|
| Fadd2 → G9 (bài người dùng) | F3 → G3 → A3 → Bb3 → A3 → G3 |
| Am(add9) → Fadd2 | A3 → Bb3 → B3 → A3 → G3 → F3 |
| G9 → Am(add9) | G3 → F3 → E3 → F3 → G3 → A3 |
| Gadd9 → D9sus4 (bài trước) | G3 → F#3 → E3 → D3 → C3 → D3 |
| Em → Bm | E3 → F#3 → G3 → A3 → Bb3 → B3 |
| C → Dm7 (sheet) | C3 → D3 → E3 → F3 → E3 → D3 |
| C → C | C3 → D3 → E3 → D3 → C#3 → C3 |

**Hạ cánh:** thử cả gốc đích cùng quãng tám lẫn quãng tám kề, lấy dòng ít điểm hơn (hoà thì giữ quãng tám cũ); tiếng bùm đầu
ô 2 đánh đúng nốt hạ cánh. Hai bẫy đã sập:
- Cm → Bm: C3 → B3 là 11 nửa cung, 5 bước chỉ đi được 10 — không có dòng nào; trước khi sửa, bộ vẽ lùi về `tones` (G3 G3 G3).
- Dbm → Bm: vừa đủ 10 nên bị ép thành dòng toàn cung Db Eb F G A, G3 chói với Ab4 tay phải.
Test: 12 gốc × 6 loại vòng — một nốt mỗi tiếng, mỗi bước 1–2 nửa cung, bum không tay phải, bùm không chói với tay phải.

**Giá trị cũ:** bản 26 (bum một nốt dẫn; hai bùm G3 G3 như sheet; Fadd2: F3 D3 C3 C3 F3 → G3).
**Triệu chứng để lùi:**
- dòng nghe lạ ở một vòng → đem vòng ấy ra dựng lại, xem nốt nào ngoài gam; chỉnh trọng số chứ đừng thêm xúc xắc;
- người dùng muốn giữ chất sheet ở hai bùm → bỏ cờ `danVao` ở mốc 3 và 3.5 (trở lại G3 G3).

## Bản 28: câu chạy một sang cách 2 — 8 tiếng từ phách 3, chát tách khỏi bùm

Người dùng: *"tiếng 1 Chát-bùm tôi nghe thấy ko ổn, nó như nuốt mất tiếng bùm rồi. Lúc nãy tôi có nói xài tạm khung này nếu ko
ổn thì sẽ qua các đáp án khác mà bạn đề xuất, giờ hãy đưa tôi qua phương án 2 lúc nãy đi"*.

**Đính chính:** mục "Bản 20" và câu hỏi lúc ấy ghi nhãn cách 2 là "bắt đầu từ phách 4". Sai: sơ đồ và mô tả của chính câu hỏi
đặt tiếng đầu ở **phách 3** (sớm hơn cách 1 ¼ phách). Làm theo sơ đồ.

| mốc | 3 | 3¼ | 3& | 3¾ | 4 | 4¼ | 4& | 4¾ |
|---|---|---|---|---|---|---|---|---|
| tiếng | chát | bùm | bum | chát | bùm | chát | bùm | bum |
| tay trái | — | gốc (đầu dòng walking) | walking | — | walking | — | walking | walking |
| tay phải (Đô) | E4+G4 | C4 | — | G4+C5 | C4 | C4+E4 | G4 | — |

- Chát phách 3 dùng lại hợp âm của Chát-bùm cũ (bậc 3 + bậc 5). Bùm 3¼ nay là giai điệu thấp C4 (bậc 1) cùng bass gốc C3.
  Nốt này là **ý của Claude**: sheet ở 3¼ có E4/A4 hoặc A4 (đỉnh A4, 5/6 cửa sổ). Chọn bậc 1 để khác cả chát trước (E4+G4)
  lẫn chát sau (G4+C5).
- Sheet không có tay phải ở phách 3 (6/6 cửa sổ 4 · 6 · 8 · 32 · 34 · 36). Tay trái có C3 ở 2/6 (32, 34). Chát phách 3 là ý
  người dùng.
- Bùm 3 (phách 2¾) nhả tay phải sau ¼ (cũ ½), để chát phách 3 không bị bùm 3 đè.
- Walking bass 3& → 4¾ giữ nguyên (bản 27).

**Rủi ro đã báo người dùng trước khi làm:** chát phách 3 chỉ cách bùm 3 đúng ¼ phách. Bản 19 người dùng từng nói *"ko phải là
tiếng 4 dính liền với tiếng 3"*.
**Giá trị cũ:** cách 1 (bản 21–27) — Chát-bùm một cú hai tay ở 3¼, tay phải E4+G4; bùm 3 tay phải ngân ½.
**Triệu chứng để lùi:** chát phách 3 dính vào bùm 3 → thử cách 3 (8 tiếng giữ 3¼, bum cuối vào đầu ô 2) hoặc trả về cách 1.

## Bản 29: cách 3 — tiếng 1–3 để nguyên, 8 tiếng từ 3¼, bum cuối gộp vào phách 1 ô 2

Người dùng: *"tiếng 1 2 3 là phải để nguyên ko chạm tới, bắt đầu câu chạy từ tiếng 4, phương án 2 đã phạm vào tiếng 3 hãy sửa
lại"*. Được báo giữ tiếng 3 thì từ 3¼ chỉ còn 7 mốc cho 8 tiếng; chọn *"thử phương án 3 nếu ko ổn thì đổi tiếp"*.

**Tiếng 3 trả nguyên:** bùm 2¾, tay phải E4+C5 ngân ½ (bản 28 đã rút còn ¼ — người dùng bác).

| mốc | 3¼ | 3& | 3¾ | 4 | 4¼ | 4& | 4¾ | 1 (ô 2) |
|---|---|---|---|---|---|---|---|---|
| tiếng | Chát | bùm | bum | chát | bùm | chát | bùm | bum |
| tay trái (C → Dm7 sheet) | — | F3 | E3 | — | D3 | — | C3 | D3 |
| tay phải | E4+G4 | C4 | — | G4+C5 | E4 | C4+E4 | G4 | — |

- **Gộp ở phách 1 ô 2:** bum cuối trùng bùm đầu ô 2. Giữ bass gốc D3 (dòng walking hạ cánh), bỏ hợp âm tay phải F4+A4 ở đó.
  Khung ô 2 thành "bum–bum chát bùm (chát ×3)".
- Ba chát giữ ba hợp âm cũ theo thứ tự (đỉnh G4 → C5 → E4). Giai điệu bùm: C4 (ý Claude — sheet không có tay phải ở 3&) · E4
  (sheet 4¼, 6/6 cửa sổ) · G4 (ý Claude; sheet 4¾ có C4 hoặc F4, 2/6 mỗi thứ).
- **Walking bass** bùm 3& · bum 3¾ · bùm 4¼ · bùm 4¾ → gốc ô 2. Bài người dùng Fadd2 → G9: F3 → G3 A3 G3 F3 → G3.

**Ba bẫy đã sập khi dựng:**
- Đầu dòng lấy `near` (nốt ghi sau cùng của bùm 3 = bậc 5) → Gadd9 → D9sus4 đi D3 … D3 qua Bb2. Đổi thứ tự ghi hai nốt thì vướng
  luật ép bass hợp âm ngắn (vòng sheet thành C3+C3). Nay thử MỌI nốt tay trái của tiếng trước làm đầu dòng.
- Hạ cánh quãng tám kề không bị phạt → G9 → Am hạ A2 rồi bum ô 2 nhảy B3 (14 nửa cung). Nay phạt +6.
- Chói với tay phải chỉ +3 → Fm → Bm ra F#3 dưới F4. Nay +10.

**Giá trị cũ:** bản 28 (cách 2, chát phách 3, bùm 3 tay phải ¼).
**Triệu chứng để lùi:** phách 1 ô 2 thiếu hợp âm, nghe hụt → trả tay phải F4+A4 về phách 1 ô 2 (thành bùm như cũ), hoặc thử lại
cách 1 / cách 2.

## Chưa đo

- Chưa nghe bản 2. Độ ngân nối là biên soạn, không có số đo pedal.
- Chưa đo phần đoạn solo (dạo · giang · kết) trên cửa sổ đã căn pha. Kho solo của bài vẫn lệch pha.
- Chưa đo điệp nâng tông (56–63) riêng.
- Ô lẻ 10–11 (5 phách giữa hai bass) chưa rõ là rubato ký âm hay ô lẻ thật của bản phối.
