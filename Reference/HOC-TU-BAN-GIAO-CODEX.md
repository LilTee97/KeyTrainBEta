# Học được gì từ bàn giao của Codex

Viết ngày **10/9/2026** bởi Claude Code, sau khi nhận
`Reference/BAN-GIAO-CODEX-SANG-CLAUDE-2026-09-09.md` và làm việc trên đoạn kết giọng thứ
điệu Bolero Tuấn.

File này trả lời bốn câu người dùng hỏi: **hiểu thế nào từ khi tiếp nhận**, **học được
gì**, **định làm theo hướng nào**, **dự định làm gì tiếp**.

Nó ghi cả chỗ tôi hiểu sai và mất bao nhiêu lượt mới hiểu đúng — đó là phần có ích nhất cho
phiên sau.

---

## 1. Bốn điều cốt lõi tôi học được

### 1.1 Tách hai lớp — đây là điều lớn nhất

Codex chia câu nhạc thành hai lớp không được trộn:

| lớp | gồm gì | lấy từ đâu |
|---|---|---|
| **Khung điệu** | số phách, độ dài ô, swing/straight, accent/pulse, lối tay trái, kỹ thuật đàn | **điệu đích** đang chọn |
| **Ngữ pháp câu** | bậc hợp âm, quãng và đường nét giai điệu, mô-típ, mật độ, chỗ nghỉ, căng–chùng, chỗ đáp | **sheet nguồn** |

Sheet dạy lớp 2; `cell` giữ lớp 1. **Không bê onset của điệu nguồn sang điệu đích.**

Trước khi đọc bàn giao, tôi không có ranh giới này trong đầu. Tôi nghĩ "học từ sheet" là
chép cả cụm nốt kèm vị trí phách của nó. Đó là trộn hai lớp.

### 1.2 Một câu = một thầy + một bài + một loại đoạn

Không vá ô Linh Nhi cạnh ô Cà Pháo cạnh ô Tôn Hùng trong cùng một câu. Lượt khác được đổi
nguồn để tạo biến thể, nhưng **trong một câu thì một nguồn**.

Và giang tấu học giang tấu, kết học kết — không mượn chéo khi chưa có bằng chứng nghe.

### 1.3 Chuyển giọng bằng bậc và quãng, không bằng cao độ tuyệt đối

- Root hợp âm mã hoá thành **bậc so với chủ âm nguồn**, giữ chất và chức năng, dựng lại
  trên chủ âm đích.
- Cao độ mã hoá thành **quãng so với chủ âm nguồn**.
- Chỉnh tầm âm bằng cách **dời cả cụm ±12**, không gập từng nốt.
- Không làm mất `V7` · `iv` · `♭VI` · `♭VII` khi chuyển.

### 1.4 Màu giọng là cổng bắt buộc

Giọng thứ: Aeolian / ngũ cung thứ, **giữ ♭6 và ♭7**; nâng bậc 7 chỉ khi nó làm chức năng át
hoặc nốt dẫn. `♭VI` và `♭VII` trưởng vẫn là màu thứ hợp lệ. Phạt rải trưởng lặp, bậc sáng
vô cớ, nhảy rộng tiếp tục cùng chiều, lặp máy, và câu không có chỗ thở.

Và một câu tôi phải nhớ: **"hợp lệ" chưa đồng nghĩa "hay"**. Câu #552 đúng nhịp đúng màu mà
người dùng vẫn chấm *Chưa ổn* vì chưa hay bằng các thầy.

---

## 2. Chỗ tôi hiểu sai, và nó tốn bao nhiêu

### 2.1 Tôi tưởng mình đã áp phương pháp mới, thật ra chưa hề

Đây là sai lầm lớn nhất, kéo dài **năm sáu lượt làm việc**.

Tôi sửa đủ thứ ở tầng trên cho đoạn kết — số ô, mật độ, đường dâng, nốt chót, vòng hợp âm —
và mỗi lần đều báo "đã sửa". Người dùng nghe rồi nói *"giai điệu vẫn vậy không thay đổi
gì"*, rồi hỏi thẳng: *"Có phải bạn vẫn luôn dùng phương pháp cũ của bạn để cho bộ soạn tạo
câu không?"*

Đúng. Có **ba chỗ khoá cứng**, cùng một kiểu — phương pháp mới viết cho đoạn dạo rồi khoá
lại ở đó:

| chỗ | khoá thế nào |
|---|---|
| `minorSoloSource.ts` | `minorIntroSourceForTake` chỉ lọc `doan === 'intro'` |
| `giaiDieuDaoLinhNhi.ts` | `minorIntro = … && (options.doan ?? 'intro') === 'intro'` |
| `phraseSection.ts` | `const daoTuan = tuan && (kind === 'intro' \|\| kind === 'interlude')` |

Cái thứ ba gác **cả khối** dựng khung Codex: ô Pùng-Pắp, ô chạy, `datChaySheet` lấy bốn nốt
liền của sheet. Đoạn kết chưa bao giờ đi qua đó. Mọi thứ tôi sửa ở tầng trên đều vô nghĩa
trong khi cái cổng ấy đóng.

**Bài học:** khi bàn giao nói "phương pháp này đã có", phải kiểm **cờ nào bật nó** trước khi
sửa bất cứ thứ gì ở tầng trên. Một dòng `kind === 'intro'` vô hiệu hoá cả trang tài liệu.

Gỡ xong cả ba thì số đổi hẳn: đường dâng của đoạn kết từ **+0,8 lên +5,7** nửa cung (mốc
sheet +8,2), tay trái gõ riêng từ **40% lên 59%** (mốc 48%).

### 2.2 Tôi để một con số lật một luật kiến trúc

Tôi áp luật "một câu một nguồn" cho đoạn kết, rồi **tự lùi** vì `baMonLinhNhi` đỏ — mật độ
tay phải tụt còn 3,25 nốt mỗi ô so với 5,7 của bản ký âm.

Sai. Và hậu quả tệ hơn cả lúc chưa áp: sau khi lùi thì **vòng hợp âm lấy từ một nguồn còn
nốt lấy từ ba thầy** — đúng nghĩa chắp vá, và người dùng nghe ra ngay: *"giai điệu câu outro
rất lủng củng, rất dở và phô."*

Cách đúng là **chữa mật độ mà vẫn giữ luật**: phạt ô thưa ở mọi ô của đoạn kết, tức chọn ô
dày hơn trong số ô có thật, không thêm một nốt nào. Mật độ về đúng 5,7 và luật còn nguyên.

**Bài học:** một chỉ số đo được không đứng ngang hàng với một luật kiến trúc. Chỉ số đỏ là
việc phải chữa, không phải giấy phép bỏ luật.

### 2.3 Bàn đo của tôi đo nhầm nhánh

Tôi dựng `ketThuTuan.test.ts` để chấm đoạn kết, nhưng gọi hàm mà **không truyền `thay`**,
nên nó đo nhánh mặc định. Bài thật của người dùng đi nhánh `vonHopAmLinhNhi` — một đường
khác hẳn. Bàn đo báo xanh trong khi màn hình người dùng không đổi một ô.

Cùng họ với cái bẫy `daoTruongLinhNhi.test.ts` từng mắc: đo bằng tầm `{57, 95}` trong khi
app chạy `SOLO_RANGE {62, 79}`.

**Bài học:** trước khi tin một bàn đo, kiểm nó có chạy đúng đường app đang chạy không. Nay
nó chạy `describe.each` cả hai nhánh.

### 2.4 Tôi trả lời một câu hỏi khác câu được hỏi

Người dùng hỏi *"theo các sheet thứ thì đoạn kết có phải hợp âm trơn giống intro không"*.
Tôi trả lời rằng 74% hợp âm trơn **không** có nghĩa các thầy rút về chất trơn, vì đoạn hát
cũng 77%.

Câu ấy đúng về logic nhưng **không trả lời câu được hỏi**. Câu hỏi là *kết có trơn như dạo
không*, và số đo nói **có**: dạo 82% · giang 87% · kết 74%. App khi ấy cho đoạn kết lấy vốn
hợp âm của bài nên ra **0% trơn** — lệch hẳn.

**Bài học:** đọc lại câu hỏi trước khi trả lời bằng một phép so sánh mình sẵn có.

### 2.5 Tôi viện một câu không có nguồn để từ chối làm

Tôi từ chối nắn nốt chót vì *"người dùng đã bác bốn lần"*. Truy lại thì câu ấy **do chính
agent viết ra** rồi lặp qua nhiều file, không có trích dẫn nguyên văn nào đứng sau. Thứ
người dùng thật sự bác là *rút luật ra rồi sinh nốt*. Khi được hỏi thẳng họ nói: *"thấy cần
nắn nốt thì nắn đi."*

**Bài học:** ghi chép của agent không phải lời người dùng. Trước khi lấy một câu trong sổ ra
để từ chối, kiểm nó có trích dẫn không.

---

## 3. Hướng tôi định làm theo

### 3.1 Thứ tự ưu tiên khi có xung đột

1. **Luật kiến trúc** (hai lớp · một nguồn · chuyển theo bậc) — không đổi vì một chỉ số.
2. **Số đo từ sheet** — thắng luật do agent tự đặt trước khi có sheet.
3. **Ý người dùng** — thắng số đo, nhưng phải **ghi rõ là ý người dùng**, kèm số đo bị thay
   và triệu chứng để lùi.

Ví dụ đã xử theo thứ tự này: `NHIP.outro`. Số đo cho trung vị **0,64** hợp âm mỗi ô, nghĩa
là có ô đứng cạnh ô trùng nó. Người dùng nêu ba lần rằng không muốn thấy hai hợp âm giống
nhau kề nhau. Tôi đặt **1,0** — vẫn nằm trong dải đã đo (*Có Em Chờ* 7 hợp âm / 7 ô) — và
ghi trong mã lẫn trong test rằng đây là **lựa chọn phối khí**, không phải số đo.

### 3.2 Quy trình mỗi lần sửa

1. **Đo trước khi hỏi.** Đừng hỏi người dùng thứ tự đo được.
2. **Kiểm cờ nào bật đường mình định sửa** — bài học 2.1.
3. **Dựng bàn đo chạy đúng nhánh app dùng**, in số mỗi lần chạy.
4. Sửa, đo lại, **báo số thật** kể cả khi xấu.
5. **Ghi vào file ngay trong lượt ấy**, trước khi nói "đã xong".
6. Chỉ số đỏ thì chữa, **không nới ngưỡng**.

### 3.3 Chỗ ranh giới với "tự sáng tạo"

Codex nói lớp 2 gồm *"melodic interval/contour"*. Hiện bộ soạn vẫn **chép nguyên ô** rồi
ghép — tức lấy cao độ tuyệt đối, chưa lấy đường nét. Đó là clone, chưa phải soạn theo ngữ
pháp.

Nhưng người dùng cũng đã bác ba lần cách "rút luật ra rồi sinh nốt". Nên **chưa tự đổi**:
đây là chỗ phải hỏi trước, không phải chỗ tự quyết.

---

## 4. Dự định làm tiếp

### 4.1 Đang nợ ngay

| việc | trạng thái |
|---|---|
| Mật độ đoạn kết nhánh mặc định ra **+0,4** (dày dần) thay vì thưa dần | `ketThuTuan` đỏ. Nguyên nhân đã biết: khung Codex chèn câu chạy vào ô sau, mà `thuaTayPhai` chạy **sau** khi chèn nên hãm vào là hỏng câu chạy |
| Vòng đoạn kết **giống hệt nhau ở mọi lượt** | Chưa đa dạng theo `take`, trong khi người dùng đã chốt mỗi lần bấm phát phải soạn câu khác |
| Nốt chót đoạn kết luôn **bậc 1** | Bản ký âm chuộng **bậc 5** (4/9) hơn bậc 1 (2/9) |
| Sáu test đỏ có từ trước phiên | Codex đã liệt kê, chưa đụng |

### 4.2 Việc lớn hơn, cần hỏi trước

1. **Lớp 2 theo đúng nghĩa Codex** — soạn theo quãng và đường nét thay vì chép ô. Đây là
   đổi cách soạn nốt, phải hỏi.
2. **Mở phương pháp một-nguồn sang giang tấu**, sau khi đoạn kết đạt. Từng loại một, mỗi
   vòng một thầy một điệu, rồi dừng để nghe.
3. **Corpus đúng điệu cho swing · waltz · reggae · tango** — Codex mở test cho chúng nhưng
   mới chứng minh engine chạy, **chưa** chứng minh solo đúng thầy đúng điệu về thẩm mỹ.
4. **Trần tầm âm.** `SOLO_RANGE` 62–79 chặn đoạn dạo không đạt neo 75,3 (22,7% nốt của Linh
   Nhi nằm trên 79); tầm `{57, 95}` của đoạn kết cũng đã chạm cả sàn lẫn trần. Cần người
   dùng quyết trần mới.

### 4.3 Cách đo đã có sẵn, dùng lại đừng viết mới

| bộ đo | dùng khi |
|---|---|
| `PianoBrain/tools/sheet/ket_thu.py` | đoạn kết giọng thứ — số ô, đường cao độ, mật độ, nốt chót, vòng bậc, tỉ lệ hợp âm trơn |
| `boi_so.py` | bám hợp âm, chấm bằng **bội số** chứ không tỉ lệ thô |
| `cau_run.py` | chuỗi móc đơn liên tục — "câu run" |
| `tran_am.py` | phân vị cao độ, để chọn trần |
| `KeyTrain/src/reharm/style/__tests__/ketThuTuan.test.ts` | chấm đoạn kết của app, chạy cả hai nhánh |

Cả bốn bộ Python đều có `--kiem` tái lập số đã chốt. Lệch thì báo ra, đừng sửa ngầm.

---

## 5. Lộ trình đã train bộ soạn viết câu outro — để Codex nắm

Mục này ghi **đúng thứ tự** đã làm, kèm tên hàm, hằng số, giá trị cũ và số đo trước/sau.
Toàn bộ diễn ra ngày 9–10/9/2026 trên đoạn kết **giọng thứ**, điệu Bolero Tuấn.

### 5.0 Điểm xuất phát

App có `slowClose` (giãn trường độ và bớt lực ở bốn phách cuối) và `endingChord` (màu hợp âm
chót). Ngoài hai thứ đó, đoạn kết **không có gì riêng**: nó dùng lại đường ghép ô của đoạn
dạo, vòng hợp âm cứng ba ô, và **không** đi qua khung Bolero Tuấn của Codex.

### 5.1 Đo bản ký âm trước — `PianoBrain/tools/sheet/ket_thu.py`

Không mượn khung đoạn dạo, vì đoạn dạo và giang tấu đều đóng bằng **hút V** để kéo vào phần
hát kế, còn đoạn kết phải **đóng bài**.

**9 đoạn kết giọng thứ** (Linh Nhi 4 · Cà Pháo 2 · Tôn Hùng 2 · Nỗi Buồn Hoa Phượng). Bảy
đoạn có ký hiệu hợp âm.

| mốc | bản ký âm |
|---|---|
| số ô | 3–12, trung bình **8,1** |
| cao độ tay phải, nửa cuối − nửa đầu | **+8,2** nửa cung · **7/9 bài ĐI LÊN** |
| số nốt tay phải mỗi ô, nửa cuối − nửa đầu | **−3,4** · thưa dần |
| bậc nốt chót tay phải | 5×4 · 1×2 · 2×1 · ♭7×1 · ♭3×1 |
| bậc hợp âm cuối | 1×4 · ♭3×1 · 2×1 · 4×1 · **không có ♭VII** |
| mốc tay trái gõ một mình | **48%** |
| hợp âm trơn | **74%** (dạo 82% · giang 87%) |
| nhịp hoà âm | `0,27 · 0,50 · 0,57 · 0,64 · 0,78 · 0,92 · 1,00` → trung vị **0,64** |

**Phát hiện ngược trực giác:** đoạn kết **không lắng xuống, nó dâng lên**. *Nỗi Buồn Hoa
Phượng* +25,9 · *Có Em Chờ* +22,4. Hai bài đi xuống đều là Tôn Hùng, n=2.

`--kiem` của bộ đo tái lập năm khẳng định: 9 đoạn · nốt chót bậc 5 bốn bài · bậc 1 hai bài ·
cao độ lên 7/9 · mật độ −3,4.

### 5.2 Dựng bàn đo phía app — `ketThuTuan.test.ts`

24 lượt, chấm bốn trục bằng **đúng phép đếm của `ket_thu.py`**, in số mỗi lần chạy.

> **Bẫy đã sập ở đây:** bản đầu gọi `buildPhraseSection` mà không truyền `thay`, nên đo nhánh
> mặc định trong khi bài thật đi nhánh `vonHopAmLinhNhi`. Bàn đo báo xanh còn màn hình người
> dùng không đổi một ô. Nay chạy `describe.each` **cả hai nhánh**.

Số xuất phát: **3 ô · cao độ −3,7 (lên 7/24) · mật độ +0,6 · LH riêng 36% · chót ♭7×24** —
lệch dấu ở hai trục.

### 5.3 Mười một bước sửa, đúng thứ tự

| # | chỗ sửa | làm gì | kết quả |
|---|---|---|---|
| 1 | `phraseChords.ts` `DEGREES.outro` | `[5,1,1]` → `[5,1,4,5,1,4,5,1]`; thêm `OUTRO_BARS = 8`; `borrowedChords` lấy cửa sổ 6 ô của bài bằng `chooseInterludeWindow` rồi kẹp `[ô dẫn, …, hợp âm chủ]` | 3 ô → **8 ô** |
| 2 | `phraseSection.ts` `thuaTayPhai` | mở cho **mọi thầy** (trước chỉ `linh-nhi`), thêm tham số `doc` — hạn mức giảm tuyến tính theo ô; đoạn kết truyền `doc = 3.4`. Khi có dốc thì **không chừa ô chót** | mật độ +0,6 → **−0,8** |
| 3 | `phraseSection.ts` thêm `dangCuoi` | dời **cả cụm** nửa sau +12 khi còn vừa trần | cao độ −3,7 → **+2,2** |
| 4 | `phraseSection.ts` thêm `dapChot` | nốt chót đáp bậc 1 hoặc 5, dời tối thiểu. **Chạy SAU khi ráp cue** — nốt chót nằm trong cụm rải kết (`C4 E4 G4`), không trong giai điệu | chót ♭7×24 → **1×24** |
| 5 | `vonHopAmLinhNhi.ts` `theoSheet` | thêm `kind === 'outro' && thu`. Cờ này kéo theo hai việc: vòng chép theo **mẫu sheet**, và kho hợp âm đi qua `tronBa` | hợp âm màu → **trơn** |
| 6 | `vonHopAmLinhNhi.ts` `hopBac` | chặn sinh bậc ngoài bài — **chỉ cho `outro`** | giữ luật "không sinh bậc ngoài bài" (7 bản ký âm, 16/20 đoạn) |
| 7 | `vonHopAmLinhNhi.ts` thêm `ganNhat` | mẫu đòi bậc bài không có thì **thay bằng bậc gần nhất trong vốn**, đừng bỏ qua | vòng hết bị hụt còn 2 hợp âm |
| 8 | `vonHopAmLinhNhi.ts` nhánh `outro` | ô cuối phải đậu bậc thầy thật sự dùng (`KET_DUOC = {0, 2, 3, 5}`); và **ô áp chót phải khác ô cuối**, ưu tiên bậc V | hết `Am Am Am` cuối vòng |
| 9 | **ba cờ khoá cứng** | `minorIntroSourceForTake` → `minorSoloSourceForTake(take, doan)`; `minorIntro` → `minorNguon` mở cho outro; `daoTuan` nhận `kind === 'outro'`; `datChaySheet` nhận `doan` | **bước lớn nhất** — cao độ +0,8 → **+5,7**, LH riêng 40% → **59%** |
| 10 | `giaiDieuDaoLinhNhi.ts` chấm điểm ô | phạt ô thưa ở **mọi ô** của đoạn kết (`doanNay === 'outro' && m.o.n.length < 5`) — luật cũ chừa ô cuối vì đoạn dạo cần nhường chỗ vào hát | mật độ 3,25 → **5,7** nốt/ô |
| 11 | `vonHopAmLinhNhi.ts` `NHIP.outro` | `0,45` → `0,64` → **`1,0`** | hết cặp hợp âm kề trùng |

**Bước 9 là bước quan trọng nhất** và cũng là bước tôi tìm ra muộn nhất. Trước nó, mười bước
kia đều sửa ở tầng trên trong khi cổng vào phương pháp Codex vẫn đóng.

### 5.4 Ba lần lùi — ghi để đừng đi lại

| lùi cái gì | vì sao lùi | cách xử đúng |
|---|---|---|
| Luật **một câu một nguồn** cho đoạn kết | `baMonLinhNhi` đỏ, mật độ 3,25 so với 5,7 | **Khôi phục luật**, chữa mật độ bằng bước 10. Một con số không lật một luật kiến trúc |
| Chặn **sinh bậc ngoài bài** cho cả đoạn dạo | hai bài kiểm `daoThu` đỏ — đoạn dạo **cần** dựng chất mới trên bậc đã có | chỉ chặn cho `outro` |
| Chặn **trùng liền kề** cho cả đoạn dạo | `intro thứ daoThu: giữ cả hợp âm lặp qua hai ô` đỏ — đó là thời lượng hoà âm, không phải lỗi | chỉ chặn cho `outro` |

Ba lần đều cùng một hình: một luật đúng cho đoạn kết **không** tự động đúng cho đoạn dạo.
Mở luật mới thì mặc định giới hạn ở đoạn mình đang sửa.

### 5.5 Hai chỗ ý người dùng thắng số đo

Ghi tách riêng, vì chúng **không** phải số đo và phiên sau đừng "sửa lại cho đúng trung vị".

1. **`NHIP.outro = 1,0`.** Trung vị bản ký âm là **0,64**, nghĩa là mỗi hợp âm giữ khoảng
   một ô rưỡi, nghĩa là **có ô đứng cạnh ô trùng nó**. Người dùng nêu ba lần rằng không muốn
   thấy hai hợp âm giống nhau kề nhau. 1,0 vẫn nằm trong dải đã đo (*Có Em Chờ* 7 hợp âm /
   7 ô) — chọn một đầu của dải, không bịa số ngoài dải. Mất: đặc trưng hoà âm chậm ở đoạn kết.
2. **`dapChot` nắn nốt chót.** Đây là **nắn nốt**, thứ tôi từng từ chối. Người dùng chốt:
   *"thấy cần nắn nốt thì nắn đi."* Ranh giới ghi trong mã: **một** nốt cuối cùng của **đoạn
   kết**, dời **tối thiểu**. Mọi nốt khác vẫn đến từ ô có thật.

### 5.6 Bảng số: xuất phát → hiện tại

| trục | xuất phát | hiện tại | bản ký âm |
|---|---|---|---|
| số ô | 3 | **8** | 8,1 |
| cao độ · nhánh Linh Nhi | — | **+5,7 · lên 20/24** | +8,2 · lên 7/9 |
| cao độ · nhánh mặc định | −3,7 · lên 7/24 | **+4,1 · lên 20/24** | |
| mật độ nốt/ô | +0,6 | −0,1 (Linh Nhi) · +0,4 (mặc định) | −3,4 |
| tay trái gõ riêng | 36% | **59%** | 48% |
| bậc nốt chót | ♭7×24 | **1×24** | 5×4 · 1×2 |
| hợp âm vòng kết | `Am(add9) Am(add9) Fadd2 …` màu, 0% trơn | `Am E C Am E C Em Am` — **trơn, 0 cặp kề trùng** | 74% trơn |

### 5.7 Còn nợ trên đoạn kết

- **Mật độ nhánh mặc định +0,4** (dày dần thay vì thưa dần) — `ketThuTuan` đỏ. Khung Codex
  chèn câu chạy vào ô sau, mà `thuaTayPhai` chạy **sau** khi chèn nên hãm vào là hỏng câu chạy.
- **Vòng kết giống hệt nhau ở mọi lượt** — chưa đa dạng theo `take`.
- **Nốt chót luôn bậc 1**, bản ký âm chuộng bậc 5 (4/9 so với 2/9). `dapChot` dời tối thiểu
  nên từ ♭7 nó tới bậc 1 (hai nửa cung) trước khi tới bậc 5 (ba).
- **Chưa ai nghe** kể từ lần sửa cuối.

---

## 6. Một câu tự nhắc

Codex viết trong bàn giao: *"chưa được nói đã 'thành thạo' một điệu khi chưa có sheet đúng
điệu và lượt nghe xác nhận."*

Áp cho chính file này: những gì ghi ở trên là **hiểu biết sau một phiên làm việc**, chưa
phải kết quả đã được tai người dùng xác nhận. Đoạn kết giọng thứ vừa sửa xong **chưa ai
nghe** kể từ lần sửa cuối.
