# Phương pháp soạn câu OUTRO — trình bày cho Codex

**Ngày 10/9/2026 · Claude Opus 5 · repo `D:\KeyTrain`**

Tài liệu này trả lời đúng một câu hỏi: *câu kết bài giọng thứ điệu Bolero Tuấn được sinh ra
bằng cách nào.* Viết cho Codex đọc, nên nó nói **mã thật ở dòng nào**, chứ không nói ý định.

Ba loại phát biểu được đánh dấu tách nhau, theo luật của người dùng:

- **[đo]** — số đếm được, kèm cỡ mẫu
- **[suy]** — suy đoán của tôi, chưa có số đứng sau
- **[ý]** — người dùng chọn thế, dù số đo nói khác

---

> ## ⚠ TÀI LIỆU NÀY ĐÃ BỊ THAY THẾ MỘT PHẦN — đọc mục 9 trước
>
> Chiều 10/9/2026 Codex đọc lại mã, **sửa một vòng trong `D:\KeyTrain`**, và viết
> `Reference/DANH-GIA-VA-SUA-OUTRO-THU-2026-09-10.md`. Người dùng nghe rồi chốt:
> *"Codex đã soạn intro và outro thứ hay và đúng ý tôi muốn… từ nay về sau chỉ dùng theo
> phương pháp và luật soạn của codex, không dùng những luật soạn cũ của bạn nữa."*
>
> Codex nhận xét thẳng về chính tài liệu này: nó **mô tả mức hoàn thiện cao hơn mã thật**.
> Nhận xét ấy đúng, và tôi để nguyên phần cũ làm hồ sơ chứ không xoá.
>
> **Mục 9 là danh sách những gì đã bị bác.** Chỗ nào trong mục 3–5 dưới đây chỏi với mục 9
> thì **mục 9 thắng**. Nguồn sự thật cuối cùng là file `DANH-GIA-…` của Codex, không phải
> file này.

---

## 0. Cổng chặn — ĐÃ MỞ ngày 10/9/2026

> **Mục này viết lúc cổng còn đóng, rồi người dùng bảo *"áp luôn đi"*. Phần chẩn đoán giữ
> nguyên vì nó là bằng chứng; trạng thái sau khi sửa ở cuối mục và ở mục 5.**

**Phương pháp mô tả ở mục 3 có thật trong mã, chạy được, đo được — nhưng app KHÔNG dẫn đoạn
kết vào nó.** Người dùng bấm Phát thì đoạn kết đi một đường khác hẳn.

Nguyên nhân là **một điều kiện, một dòng** — [ReharmHome.tsx:3089](src/reharm/ReharmHome.tsx#L3089):

```ts
style: kind === 'intro' && laBoleroTuan(style) ? style : styleSolo,
```

`kind === 'intro' &&` — nên **chỉ đoạn dạo** nhận điệu Bolero Tuấn. Đoạn kết nhận `styleSolo`,
và `styleSolo` cho họ Bolero là **`bolero-linh-nhi-2`**
([hoDieu.ts:66](src/reharm/style/hoDieu.ts#L66), trường `soloUuTien`).

Hai điệu ấy khác nhau ở đúng chỗ đang bàn:

| | `bolero-tu-n-improv-bai-04-00001` | `bolero-linh-nhi-2` |
|---|---|---|
| `family` | `bolero-tu-n` | `bolero-linh-nhi-2` |
| `laBoleroTuan()` | **true** | **false** |
| `cell.left` (Pùng) | `0 · 2 · 3` | `0 · 0,5 · 0,75 · 1 · 1,5 · 2 · 2,5 · 3 · 3,5` |
| `cell.right` (Pắp) | `0,5 · 1,5 · 2,5 · 3,5` | **rỗng** |

`laBoleroTuan` chỉ nhận hai family `bolero` và `bolero-tu-n`
([hoDieu.ts:104](src/reharm/style/hoDieu.ts#L104)), nên điệu rải của Linh Nhi trượt. Và cell
của nó **không có tay phải nào** — không có Pắp để mà quạt.

### Dây chuyền đổ theo

`tuan` ([phraseSection.ts:657](src/reharm/style/phraseSection.ts#L657)) là `laBoleroTuan(style)`.
Nó `false` thì **năm thứ tắt cùng lúc**:

| tắt cái gì | dòng | hậu quả |
|---|---|---|
| `daoTuan` | [phraseSection.ts:704](src/reharm/style/phraseSection.ts#L704) | cả khối khung Pùng-Pắp bị bỏ qua — không `laOPap`, không `oXenPap`, không `chenChay`, không `datChaySheet` |
| `gopThay` không được truyền | [phraseSection.ts:850](src/reharm/style/phraseSection.ts#L850) | → `minorNguon = false` ([giaiDieuDaoLinhNhi.ts:387](src/reharm/style/giaiDieuDaoLinhNhi.ts#L387)) |
| `minorSource` | giaiDieuDaoLinhNhi.ts:401 | `undefined` — không khoá nguồn theo `(thầy, điệu, đoạn, giọng)` |
| `dungCuaSo` | [giaiDieuDaoLinhNhi.ts:462](src/reharm/style/giaiDieuDaoLinhNhi.ts#L462) | `false` — **không lấy cửa sổ ô liên tiếp**, quay về chấm điểm từng ô độc lập |
| `ketMotNguon` | [phraseSection.ts:1234](src/reharm/style/phraseSection.ts#L1234) | `false` — **chuỗi hậu xử lý cũ chạy lại**: `thuaTayPhai` + `dangCuoi` + `dapChot`; và `datVaoLuoi` không chạy |

Tức là chỉ dẫn **#1** (lọc điệu), **#2** (cửa sổ liên tiếp), **#4** (đặt vào lưới), **#6**
(khoá `source.id`) và **#7** (bỏ hậu xử lý) của Codex đều **inert** trên đường app. Tôi đã
dựng đủ cả năm, và cả năm nằm sau một cái cổng đóng.

### Số chứng minh — [đo], La thứ, `thay='linh-nhi'`, take 0–2

Dựng đoạn bằng `buildPhraseSection`, đếm cú gõ tay phải, đếm cú gõ **nhiều nốt** (chùm =
tiếng quạt = Pắp), và đo bao nhiêu phần trăm onset rơi đúng lưới 7 điểm của Bolero Tuấn
(`0 · 0,5 · 1,5 · 2 · 2,5 · 3 · 3,5`):

| đường | số ô | RH cú gõ | **chùm** | trên lưới 7 điểm |
|---|---|---|---|---|
| INTRO · điệu Bolero Tuấn — *app dùng* | 9 | 45 · 59 · 38 | **13 · 9 · 13** | 71% · 66% · 95% |
| OUTRO · điệu Bolero Tuấn — *bàn đo dùng* | 8 | 38 · 57 · 26 | **12 · 8 · 12** | 95% · 93% · 92% |
| OUTRO · điệu rải Linh Nhi — **app dùng** | 8 | 48 · 48 · 48 | **0 · 0 · 0** | 69% · 69% · 71% |

Ba con `48 · 48 · 48` giống hệt nhau nói thêm một điều: trên đường app, `take` gần như không
đổi được câu kết.

Khớp đúng câu người dùng nói: *"outro vẫn không hề có tiết tấu Pùng Pắp của bolero Tuấn
trong khi intro có và đánh rất đúng."* Họ nói đúng, và tôi đã sửa nhầm tầng bốn lượt liền
trước khi tìm ra dòng này.

### Bẫy đã sập lần thứ ba

`ketThuTuan.test.ts` truyền thẳng `getStyle('bolero-tu-n-improv-bai-04-00001')`. Nên bàn đo
đo **hàng 2** của bảng trên, còn tai người dùng nghe **hàng 3**. Bàn đo báo xanh, màn hình
không đổi.

Cùng họ với hai lần trước:

1. `daoTruongLinhNhi.test.ts` đo bằng tầm `{57, 95}` trong khi app chạy `SOLO_RANGE`.
2. `ketThuTuan.test.ts` bản đầu không truyền `thay`, nên đo nhánh mặc định trong khi app đi
   `vonHopAmLinhNhi`. Sửa bằng `describe.each` hai nhánh.
3. **Lần này:** truyền đúng `thay` rồi, nhưng truyền **sai `style`**.

Bài học cho bàn đo về sau: **tham số của bài kiểm phải lấy từ chính biểu thức ở chỗ gọi
trong `ReharmHome.tsx`**, không dựng lại bằng tay.

### Cách sửa — một dòng · **ĐÃ ÁP**

Tôi nêu lo ngại trước khi làm: đây là đổi lối chơi người dùng đang nghe, mà luật của họ là
đổi lối chơi thì dựng sau ô tick nghe thử, và prompt Codex bảo dừng cho người dùng nghe
trước khi chạy vòng sau. Người dùng trả lời **"áp luôn đi"** — nên áp thẳng, không dựng ô
tick.

[ReharmHome.tsx:3089](src/reharm/ReharmHome.tsx#L3089), nay là:

```ts
style:
  laBoleroTuan(style) && (kind === 'intro' || kind === 'outro')
    ? style
    : styleSolo,
```

Chỉ bỏ chữ `kind === 'intro' &&` và thêm `kind === 'outro'`. Đoạn giang tấu không đụng tới —
nó vốn đã có cổng `laBoleroTuan(style)` riêng ở chỗ dựng đoạn giang (dòng 1879) và vốn đã
truyền đúng `style`. Nay **dạo · giang · kết cùng nhận điệu đang chọn**.

Triệu chứng để lùi, ghi ngay cạnh chỗ sửa: *đoạn kết nghe ra điệu Bolero Tuấn thay vì lối
rải Linh Nhi mà người dùng quen* — lúc ấy trả điều kiện về `kind === 'intro' &&
laBoleroTuan(style)`.

Năm cờ ở bảng trên **bật hết** theo: `daoTuan` · `gopThay` · `minorSource` · `dungCuaSo` ·
`ketMotNguon`. Số đo sau khi áp ở **mục 5**.

---

## 1. Đường chạy thật, từ nút Phát tới tiếng ra

Truy bằng cách đọc mã, không suy từ tên hàm.

```
[nút Phát]
   ↓
ReharmHome.tsx   phrase: (kind) => …                                    ← dòng 3077
   ↓   style = laBoleroTuan(style) && (kind==='intro'||kind==='outro')
   ↓           ? style : styleSolo                                 ← 3089  ★ CỔNG (đã mở)
   ↓   thay = thaySolo · take = phraseSpin + playSpin
   ↓   songChords = hopAmChoDoan('outro')   (kết bài mượn hợp âm ĐIỆP KHÚC)
   ↓
phraseSection.ts   buildPhraseSection()                                 ← 634
   │
   ├─ 1. VÒNG HỢP ÂM     vonHopAmLinhNhi()   qua phraseChords           ← 671
   ├─ 2. NỐT GIAI ĐIỆU   giaiDieuDaoLinhNhi()                           ← 837
   ├─ 3. KHUNG ĐIỆU      khối `daoTuan && style.cell`                   ← 968–1050
   ├─ 4. HẬU XỬ LÝ       thuaTayPhai · dangCuoi · dapChot                ← 1222–1250
   └─ 5. RÁP + ĐÓNG BÀI  avoidMelodyClash · slowClose · cueStrike
                         · holdUntilStruckAgain
```

Hai chỗ gọi `buildPhraseSection` khác trong `ReharmHome.tsx` **không** dựng đoạn kết: dòng
1879 là giang tấu (có cổng `laBoleroTuan(style)` riêng và truyền đúng `style`), dòng 3180 là
câu dạo motif Chiếc Lá.

---

## 2. Đo bản ký âm trước khi soạn — cơ sở của mọi hằng số

Bộ đo: `PianoBrain/tools/sheet/ket_thu.py`, có `--kiem` tái lập năm khẳng định.

**Cỡ mẫu: 9 đoạn kết giọng thứ** — Linh Nhi 4 · Cà Pháo 2 · Tôn Hùng 2 · Nỗi Buồn Hoa
Phượng 1. Bảy đoạn có ký hiệu hợp âm.

| mốc | **[đo]** bản ký âm |
|---|---|
| số ô | 3–12, trung bình **8,1** |
| cao độ tay phải, nửa cuối − nửa đầu | **+8,2** nửa cung · **7/9 bài ĐI LÊN** |
| số nốt tay phải mỗi ô, nửa cuối − nửa đầu | **−3,4** — thưa dần |
| bậc nốt chót tay phải | 5×4 · 1×2 · 2×1 · ♭7×1 · ♭3×1 |
| bậc hợp âm cuối | 1×4 · ♭3×1 · 2×1 · 4×1 — **không có ♭VII** |
| mốc tay trái gõ một mình | **48%** |
| hợp âm trơn | **74%** (so: dạo 82% · giang 87%) |
| nhịp hoà âm (hợp âm/ô) | `0,27 · 0,50 · 0,57 · 0,64 · 0,78 · 0,92 · 1,00` → trung vị **0,64** |

**Vì sao không mượn khung đoạn dạo:** đoạn dạo và giang tấu đều đóng bằng **hút V**
(`hutDungXa`) để kéo vào phần hát kế. Đoạn kết phải **đóng bài**. Chép khung dạo sang rồi
đổi mỗi ô cuối là sai từ gốc.

**Phát hiện ngược trực giác [đo]:** đoạn kết **không lắng xuống, nó dâng lên**. *Nỗi Buồn
Hoa Phượng* +25,9 · *Có Em Chờ* +22,4. Hai bài đi xuống đều là Tôn Hùng (n=2, quá mỏng để
thành lối riêng). Người dùng giải thích khớp: *"vì đó là kết bài nên chị Nhi muốn kéo dài
câu hát ra giống như các ca sĩ vẫn hay làm khi biểu diễn."*

Không mâu thuẫn với `slowClose`: hàm ấy chỉ giãn trường độ và bớt lực ở **bốn phách cuối**,
không đụng cao độ. Đoạn dâng lên qua cả đoạn, rồi ô chót mới chậm lại.

---

## 3. Phương pháp — năm tầng

Nói theo hai lớp của Codex: **khung điệu** lấy từ điệu ĐÍCH (Bolero Tuấn), **ngữ pháp câu**
lấy từ sheet NGUỒN (bản ký âm Linh Nhi). Không bao giờ mang onset của nguồn sang điệu đích.

### Tầng 1 — Vòng hợp âm · `vonHopAmLinhNhi.ts`

Cờ mở: `theoSheet` gồm `kind === 'outro' && thu`
([dòng 281](src/reharm/style/vonHopAmLinhNhi.ts#L281)). Cờ này kéo theo **hai** việc chứ
không một: vòng chép theo **mẫu ô của sheet**, và kho hợp âm đi qua `tronBa`.

| bước | làm gì | cơ sở |
|---|---|---|
| vốn hợp âm | chỉ lấy **hợp âm có thật trong bài**; `tronBa` rút về ba nốt trơn | **[đo]** kết 74% trơn, n=7 |
| số hợp âm | `soO × NHIP.outro` = `8 × 1,0` = 8 | **[ý]** — xem dưới |
| mẫu vòng | chép **bậc từng ô** của đúng một tuyến sheet; `nguonKhaThi()` thử 3 nguồn, chỉ nhận nguồn mà **mọi bậc của nó đều có trong vốn bài** ([dòng 396](src/reharm/style/vonHopAmLinhNhi.ts#L396)) | Codex #6 |
| bậc ngoài bài | `hopBac` **chặn sinh bậc bài không có — chỉ cho `outro`** | **[đo]** 16/20 đoạn, 7 bản ký âm |
| ô cuối | phải đậu bậc thầy thật sự dùng: `KET_DUOC = {0, 2, 3, 5}` | **[đo]** bậc hợp âm cuối, n=7 |
| trùng kề | `khongKeTrung` xoá cặp kề trùng — **chỉ cho `outro`**; trùng ở cuối thì đổi **ô áp chót**, không đổi ô cuối | **[ý]** |

`NHIP.outro = 1,0` là **[ý]**, không phải **[đo]**. Lịch sử ba con số: `0,45` (mẫu chọn lệch,
tự khai *"trung vị của năm bài dưới ngưỡng 0,6"*) → `0,64` (trung vị đủ bảy đoạn) → `1,0`. Ở
0,64 thì tám ô chỉ có năm hợp âm nên **luôn có ô đứng cạnh ô trùng nó**; người dùng nêu ba
lần liền. `1,0` vẫn nằm **trong dải đã đo** (*Có Em Chờ* 1,00) — chọn một đầu của dải, không
bịa số ngoài dải. **Mất:** đặc trưng hoà âm chậm của đoạn kết.

### Tầng 2 — Nốt giai điệu · `giaiDieuDaoLinhNhi.ts`

**Khoá nguồn.** `nguonKetThuBolero(take)` → `nguonTheoKhoa({thay:'linh-nhi', dieu:'bolero',
doan:'outro', thu:true})`. Lọc đủ **bốn** điều kiện, đúng **3 tuyến**: *Đừng Xa Em Đêm Nay*
(Rê thứ) · *Rừng Lá Thấp* (La thứ) · *Nỗi Buồn Hoa Phượng* (Rê thứ).

Trước đó chỉ lọc `thầy + đoạn + giọng`, và trong tám đoạn kết của Linh Nhi có **hai đoạn
`slow rock`** (*Lá Thư Trần Thế*, *Một Cõi Đi Về*) lọt vào vòng train Bolero, mang theo cú
pháp của một điệu khác — Codex chỉ dẫn #1. Không khớp khoá thì trả `undefined`, **không rơi
ngầm sang thầy khác**: rơi ngầm là chỗ câu mất cú pháp mà không bao giờ nổi lên thành lỗi.

**Cửa sổ ô liên tiếp** — Codex #2. *(Bản của tôi dưới đây **không còn là đường đoạn kết**:
Codex thay bằng `planMinorOutro`; xem mục 9.2 và 9.3. `dungCuaSo` giờ chỉ còn là đường dự bị.)*

```ts
const dungCuaSo = doanNay === 'outro' && minorSource !== undefined && kho.length > 0
if (dungCuaSo) {
  const day = [...kho].sort((a, b) => a.i - b.i)
  const batDau = day.length > soO ? take % (day.length - soO + 1) : 0
  for (let o = 0; o < soO; o += 1) {
    const m = day[(batDau + o) % day.length]!
    chon.push({ m, chord: hopAmO(o)[0]!.chord })
  }
}
```

Bộ xếp hạng từng ô vẫn còn cho đoạn dạo, nhưng đoạn kết **không dùng** nó. Lý do: xếp hạng
giữ được quan hệ hai ô liền nhau nhưng **không giữ được đường cung của cả câu** — ô 5 của
một bài có thể đứng trước ô 2 của chính bài ấy. Người dùng nghe ra là *"lủng củng"*. Cửa sổ
liên tiếp giữ nguyên trật tự thời gian, nên motif · lấy đà · cao trào · chỗ nghỉ · cadence
còn nguyên. `take` chỉ **dịch điểm bắt đầu trong cùng một nguồn**. Nguồn ngắn hơn số ô cần
thì vòng lại từ đầu — vẫn là ô của đúng nguồn ấy.

**Một câu một nguồn.** Không vá mỗi ô một thầy. Tôi **đã từng lùi** khỏi luật này vì
`baMonLinhNhi` đỏ (mật độ 3,25 so với 5,7 nốt/ô) — và kết quả tệ hơn: hợp âm của một nguồn,
nốt của ba thầy. Người dùng: *"giai điệu câu outro rất lủng củng, rất dở và phô."* Đã khôi
phục luật, và chữa mật độ bằng cách đúng: phạt ô thưa ở **mọi ô** của đoạn kết
(`doanNay === 'outro' && m.o.n.length < 5` → `d += 8`,
[dòng 561](src/reharm/style/giaiDieuDaoLinhNhi.ts#L561)). **Một con số không lật một luật
kiến trúc.**

**Phép biến đổi được phép — đúng hai:** chuyển theo **bậc/chức năng** (không theo cao độ
tuyệt đối), và dời **cả phrase** ±12. Cấm gập từng nốt về tầm.

**Cổng giọng thứ:** Aeolian / ngũ cung thứ, giữ ♭6 và ♭7; chỉ nâng bậc 7 khi nó mang chức
năng dominant. ♭VI và ♭VII trưởng là màu thứ hợp lệ.

### Tầng 3 — Khung điệu · khối `daoTuan && style.cell`, `phraseSection.ts` 968–1050

Đây là chỗ tiết tấu Bolero Tuấn được áp. Chia ô thành **hai loại**:

| loại ô | chọn bởi | tay trái | tay phải |
|---|---|---|---|
| **ô Pùng-Pắp** | `laOPap(o, take, nhieuPap)` | `cell.left` `0 · 2 · 3` | `cell.right` `0,5 · 1,5 · 2,5 · 3,5` — **cú gõ hợp âm** |
| **ô giai điệu** | phần còn lại | mẫu đệm + (nếu `oXenPap`) Pắp **hạ xuống tay trái, −12** | câu từ tầng 2 |

`laOPap` ([dòng 358](src/reharm/style/phraseSection.ts#L358)): ô 0 **không** Pắp (sheet 7/8 gõ
phách 0), ô 1 **vào Pắp ngay**, còn lại `(o + take) % 3 === 2`. Ô chót không Pắp — chỗ ấy
dành cho cú rải hợp âm chủ đứng một mình.

**Câu chạy** — `chenChay` chèn vào ô do `oChayCac` chọn, và `datChaySheet` lấy **bốn nốt liền
nhau của đúng `source.id`** ([dòng 451](src/reharm/style/phraseSection.ts#L451)), không dán
một arpeggio bậc i lên mọi ô. Lọc theo `t.thay` là cách cũ — nó gom mọi bài của thầy ấy kể cả
khác điệu khác bài, đúng nghĩa vá câu từ nhiều nguồn.

**~~Đặt vào lưới — `datVaoLuoi`~~ · ĐÃ BỊ BÁC VÀ ĐÃ XOÁ KHỎI MÃ.** Xem mục 9.1.

Tôi từng kéo mỗi nốt về điểm gần nhất trong bảy mốc của cell, và báo thành tích *"92–95% onset
trên lưới 7 điểm"*. Codex xoá hẳn hàm ấy: phép greedy nearest-free **có thể đảo thứ tự nốt**,
và **cell đệm không phải toàn bộ tiết tấu giai điệu**. Câu nguồn giữ nguyên onset, chia nhỏ
phách và chỗ nghỉ; chỉ **phần đệm** giữ cell Tuấn.

Người dùng nói *"tiết tấu thì lệch với bolero Tuấn quá"* là đúng, nhưng cách chữa của tôi sai
chỗ: phải cho **phần đệm** đúng cell chứ không nắn **giai điệu** vào cell.

### Tầng 4 — Hậu xử lý: **TẮT** cho nhánh này

`ketMotNguon = kind === 'outro' && key?.scale === 'minor' && tuan`
([dòng 1234](src/reharm/style/phraseSection.ts#L1234)) tắt cả ba lớp:

| lớp | làm gì | vì sao tắt |
|---|---|---|
| `thuaTayPhai` | xoá bớt nốt theo dốc −3,4 | Codex #7 |
| `dangCuoi` | dời nửa sau +12 | " |
| `dapChot` | nắn nốt chót về bậc 1 hoặc 5 | " |

Codex chốt: nhánh mới *"không được đồng thời xóa nốt bằng `thuaTayPhai`, nâng nửa câu bằng
`dangCuoi`, chèn run ngoài câu, đổi nốt cuối bằng `dapChot`, gập từng nốt về tầm."*

Lý do nghe được: từ khi đoạn kết lấy **một dải ô liên tiếp có thật**, câu đã có sẵn motif,
lấy đà, cao trào và chỗ nghỉ. Ba lớp chồng lên chính là thứ phá những nét ấy — mỗi lớp chữa
một triệu chứng, cộng lại làm câu rời rạc.

Ba lớp **giữ nguyên** cho đoạn dạo, giang tấu và đoạn kết giọng trưởng.

### Tầng 5 — Ráp và đóng bài

`avoidMelodyClash` (tay trái nhường phím khi trùng giai điệu) → `slowClose` (giãn trường độ,
bớt lực bốn phách cuối) → `cueStrike(rollVoicing, roundBeats, {roll:true, beats:1})` (cú rải
hợp âm chủ) → `holdUntilStruckAgain` (cắt đuôi nốt còn ngân, **chỉ khi cùng tay và trùng cao
độ** — hai tay chồng nhau là hoà âm, hai cao độ khác nhau chồng nhau là legato).

`lengthBeats = roundBeats + 1` — cái đuôi một phách ấy chính là chỗ bài đậu xuống. Đoạn dạo
**không** có đuôi này; ở đó hợp âm báo rơi vào phách cuối của chính vòng.

`interlockHands` **bị bỏ hẳn** cho `daoTuan` và cho cả ba thầy: nó dựng theo Cà Pháo (tay
phải cài vào khe tay trái) nên chồng lên lối bám tay trái là nắn lại chính cái vừa dùng làm
gốc. Cờ `khongTiaTayTrai` không cứu được — nó chỉ tắt luật tỉa, luật chèn nốt lấp khe vẫn chạy.

---

## 4. Sửa hôm nay — chừa ô Pùng-Pắp khỏi phép rút chùm

Trước khi tìm ra cổng ở mục 0, tôi tìm ra một cổng **thứ hai**, nhỏ hơn nhưng có thật, ở
[phraseSection.ts:1158](src/reharm/style/phraseSection.ts#L1158).

Luật cũ của đoạn kết: *rút chùm nốt còn MỘT nốt*. Gốc của nó là một lỗi thật người dùng nghe
ra — tay phải vừa quạt hợp âm vừa chạy giai điệu, *"không ai chơi vậy được, và nghe cũng
đục."*

Nhưng **Pắp chính là cú gõ hợp âm tay phải**. Luật ấy rút Pắp còn một nốt: vẫn đúng phách,
mất hẳn tiếng quạt.

**Sửa:** thêm `oPapChum` ([dòng 967](src/reharm/style/phraseSection.ts#L967)) — vòng lặp tầng
3 vốn đã chia ô làm hai loại, nên ghi lại danh sách ô loại một và chừa đúng chúng ra. Mọi ô
khác vẫn rút chùm như cũ. Lo ngại cũ không tái diễn: ô Pùng-Pắp và ô giai điệu không bao giờ
là cùng một ô.

**[đo]** La thứ, nhánh Linh Nhi, take 0–2, **với `style` = Bolero Tuấn**:

| | trước | sau |
|---|---|---|
| cú gõ chùm ở đoạn kết | 0 · 0 · 0 | **12 · 8 · 12** |
| phách rơi | — | **0,5 · 1,5 · 2,5 · 3,5** |
| ô có chùm | — | 1,2,5 · 1,4 · 1,3,6 |

Đối chiếu đoạn dạo cùng lượt: 13 · 9 · 13 chùm. Đoạn kết ít hơn đúng một ô vì ô chót không
quạt Pắp.

`npx tsc --noEmit -p tsconfig.app.json` sạch · `npx vitest run` **2496 xanh / 6 đỏ** — đúng
sáu bài đỏ có sẵn từ trước (phraseAcrossBar · daoTruong · handSplitAudit · sietHopAm ·
tuyenSolo ×2), không phát sinh cái nào.

Lúc viết bản đầu của tài liệu này, sửa trên **chưa có tác dụng gì trên đường app**: `daoTuan`
còn `false` nên `oPapChum` luôn rỗng. Sau khi cổng ở mục 0 mở thì nó mới thật sự chạy — hai
lần sửa phải đi cùng nhau, một mình cái nào cũng không đủ.

---

## 5. Trạng thái sau khi áp — đo lại

### 5.1 Bài kiểm

`npx tsc --noEmit -p tsconfig.app.json` sạch. `npx vitest run` → **2496 xanh / 6 đỏ**, đúng
sáu bài đỏ có sẵn từ trước (`phraseAcrossBar` · `daoTruong` · `handSplitAudit` · `sietHopAm` ·
`tuyenSolo` ×2). **Không phát sinh bài đỏ nào.**

### 5.2 Năm số của đoạn kết — `ketThuTuan.test.ts`, 24 lượt mỗi nhánh

| trục | nhánh mặc định | nhánh Linh Nhi | **[đo]** bản ký âm |
|---|---|---|---|
| số ô | 8 | 8 | 8,1 |
| cao độ nửa sau − nửa đầu | **+4,3** · lên **21/24** | **+3,4** · lên **21/24** | +8,2 · lên 7/9 |
| mật độ nốt/ô | **−0,5** | **−0,5** | −3,4 |
| mốc tay trái gõ riêng | **51%** | **52%** | 48% |
| bậc nốt chót | 1×24 | 1×24 | 5×4 · 1×2 |

Bốn trục đúng **dấu**. `LH gõ riêng` là trục sát bản ký âm nhất (51–52% so với 48%). Hai trục
còn lệch: độ lớn của cao độ và mật độ chưa tới mức bản ký âm, và **bậc nốt chót vẫn luôn là
bậc 1** trong khi bản ký âm chuộng bậc 5 (4/9 so với 2/9).

> **Hai assertion tôi đặt trên bảng này — "đi lên" và "thưa dần" — ĐÃ BỊ CODEX THAY.** Chín
> đoạn bản ký âm gồm nhiều điệu, độ dài, tầm đàn và biên đoạn khác nhau, nên áp **dấu của
> trung bình** ấy lên mọi câu là sai. Nay là cadence / time / source invariants. Xem mục 9.7.

### 5.3 Một điều phải nói cho rõ, kẻo đọc nhầm

**Năm số ở 5.2 KHÔNG đổi vì cú sửa ở mục 0.** `ketThuTuan.test.ts` tự dựng `style` của nó chứ
không đi qua `ReharmHome.tsx`, nên nó vốn đã đo nhánh Bolero Tuấn từ trước. Cái đổi là **app
nay đi đúng nhánh mà bàn đo vẫn đang đo** — trước đó hai bên đo hai thứ khác nhau.

Nói cách khác: cú sửa mục 0 không cải thiện con số nào trong bảng 5.2; nó làm cho bảng ấy
**bắt đầu có nghĩa**.

Hệ quả phụ: cái bẫy ở mục 0 (“bẫy đã sập lần thứ ba”) **tự tan** vì hai bên nay cùng nhận
điệu Bolero Tuấn. Tôi vẫn để nguyên phần ghi bẫy, vì bài học về **cách chọn tham số cho bàn
đo** còn giá trị cho mọi bàn đo sau.

### 5.4 Cặp số có trước/sau thật sự

Chỉ hai phép đo dưới đây có đủ cặp trước/sau đo trong cùng một phiên; mọi con khác ở tài liệu
này là số một thời điểm.

| phép đo | trước | sau | do cú sửa nào |
|---|---|---|---|
| cú gõ chùm ở đoạn kết (take 0–2) | 0 · 0 · 0 | **12 · 8 · 12** | mục 4 — `oPapChum` |
| ~~onset trên lưới 7 điểm~~ | ~~69–71%~~ | ~~92–95%~~ | **RÚT LẠI** — `datVaoLuoi` đã bị bác và xoá, xem mục 9.1 |

### 5.5 Hai cú sửa phải đi cùng nhau

| | sửa ở đâu | một mình thì sao |
|---|---|---|
| mục 4 · `oPapChum` | `phraseSection.ts` 967 · 1158 | vô tác dụng — `daoTuan` còn `false` nên tập luôn rỗng |
| mục 0 · cổng điệu | `ReharmHome.tsx` 3089 | Pắp có mặt nhưng **bị rút còn một nốt**, mất hẳn tiếng quạt |

Đây cũng là lý do tôi mất bốn lượt: mỗi lần sửa một cái rồi nghe thấy không đổi, tôi đi tìm
tầng khác thay vì hỏi *"nốt này đến từ đâu"* cho tới cùng.

### 5.6 Chưa ai nghe

Mọi con số trên là **số đếm trên dữ liệu sinh ra**, không phải đánh giá thẩm mỹ. Server ở
`localhost:5173`, Vite đã nhận thay đổi. Bước tiếp theo là người dùng nghe — theo chỉ dẫn #9
của Codex, dừng ở đây.

---

## 6. Ba lần lùi — ghi để đừng đi lại

| lùi cái gì | vì sao lùi | cách xử đúng |
|---|---|---|
| luật **một câu một nguồn** cho đoạn kết | `baMonLinhNhi` đỏ, mật độ 3,25 so với 5,7 | khôi phục luật, chữa mật độ bằng phép phạt ô thưa |
| chặn **sinh bậc ngoài bài** cho cả đoạn dạo | hai bài `daoThu` đỏ — đoạn dạo **cần** dựng chất mới trên bậc đã có | chỉ chặn cho `outro` |
| chặn **trùng liền kề** cho cả đoạn dạo | `intro thứ daoThu: giữ cả hợp âm lặp qua hai ô` đỏ — đó là thời lượng hoà âm | chỉ chặn cho `outro` |

Ba lần cùng một hình: **một luật đúng cho đoạn kết không tự động đúng cho đoạn dạo.** Mở luật
mới thì mặc định giới hạn ở đoạn đang sửa.

Một lỗi khác loại, cùng phiên: tôi viện câu *"người dùng đã bác nắn nốt bốn lần"* để từ chối
nắn nốt chót — **câu ấy do chính tôi viết, không có trích dẫn nào đứng sau**. Người dùng:
*"sao lại bác 4 lần nhỉ, thấy cần nắn nốt thì nắn đi."*

Và một lỗi nữa: một cú `for (let o = 0; chon.length === 0 && o < soO; o += 1)` — điều kiện
dừng đặt sai — làm vòng lặp ngắt sau ô đầu ở **mọi** đoạn, 24 bài kiểm đỏ. Nay tách cờ
`dungCuaSo` riêng.

---

## 7. Chưa đo — lỗ còn lại

- **Chưa ai nghe** đoạn kết kể từ lần sửa cuối. Mọi con số ở trên là số đếm trên dữ liệu sinh
  ra, **không phải đánh giá thẩm mỹ**.
- **Vòng hợp âm giống hệt nhau ở mọi `take`** — chưa đa dạng.
- **Nốt chót luôn bậc 1** trên đường bàn đo; bản ký âm chuộng **bậc 5** (4/9 so với 2/9).
  `dapChot` dời tối thiểu nên từ ♭7 nó tới bậc 1 (hai nửa cung) trước khi tới bậc 5 (ba).
- **Mật độ nhánh mặc định +0,4** (dày dần thay vì thưa dần) — `ketThuTuan` đỏ ở nhánh ấy.
- **Cỡ mẫu nguồn chỉ 3 tuyến** cho khoá `linh-nhi + bolero + outro + thứ`. Ba là ít.
- ~~Chưa đo bậc nốt chót và đường cao độ trên đường app~~ — **hết hạn 10/9/2026**: sau cú sửa
  ở mục 0, đường app và đường bàn đo là **một**, nên bảng 5.2 chính là số của đường app.
- **Thầy Tuấn có 0 sheet solo.** Khung điệu là của Tuấn, ngữ pháp câu là của Linh Nhi — đó là
  ghép hai người, và **[suy]** tôi chưa có cách kiểm nó có đúng lối Tuấn không.

---

## 8. Việc của prompt Codex còn nợ

| # | nội dung | trạng thái |
|---|---|---|
| 1 | lọc điệu ở khoá nguồn | **xong · đã chạy** |
| 2 | cửa sổ ô liên tiếp | **xong · đã chạy** |
| 3 | bỏ `ganNhat` | xong |
| 4 | đặt onset vào lưới cell | **xong · đã chạy** |
| 5 | **cú pháp riêng cho outro** (xem 9.13 mục 3) — `xác lập → phát triển → căng/nâng → cadence → khoảng trống/cú kết`; **không** được lấy bố cục A/B của intro làm luật | **chưa làm** |
| 6 | khoá `source.id` | xong |
| 7 | bỏ chuỗi hậu xử lý | **xong · đã chạy** |
| 8 | **bài kiểm tám bất biến** | **Codex đã làm** — `coherentMinorOutro.test.ts`, 90 dòng |
| 9 | giữ server 5173, sinh tối đa ba câu, nói rõ nguồn mỗi câu, rồi **dừng cho người dùng nghe** | server 200 · **đang chờ người dùng nghe** |

Tám bất biến của #8, ghi lại để khỏi tra lại: mọi nguồn là `linh-nhi + bolero + outro + thứ` ·
ô nguồn liên tiếp · không có sự kiện từ nguồn khác · onset nằm trên pulse hợp lệ của Bolero
Tuấn · phép chuyển Dm→Am giữ bậc và chất · nốt căng được đỡ hoặc được giải · không gập từng
nốt về tầm · cùng input và `take` thì ra cùng kết quả.

Cổng ở mục 0 **đã mở**, nên #5 và #8 nay làm được thật. Trước khi mở nó thì mọi tầng dựng
thêm đều nằm sau một cánh cửa đóng — đúng cái tôi đã làm bốn lượt liền.

Thứ tự đề nghị: **nghe trước** (chỉ dẫn #9), rồi #8 (bài kiểm chốt lại những gì vừa dựng),
rồi mới #5 (cú pháp riêng cho outro). Làm #5 trước khi có #8 là dựng tiếp trên nền chưa neo.

---

*Đối chiếu thêm: `Reference/HOC-TU-BAN-GIAO-CODEX.md` (những gì học được từ bàn giao Codex,
kèm lộ trình 11 bước) · `Reference/SO-TAY.md` (nhật ký kỹ thuật) ·
`PianoBrain/tools/sheet/ket_thu.py` (bộ đo, có `--kiem`).*

---

## 9. Codex đã bác những gì — danh sách chốt

Nguồn: `Reference/DANH-GIA-VA-SUA-OUTRO-THU-2026-09-10.md`, đối chiếu với mã thật trong
`minorSoloSource.ts` · `giaiDieuDaoLinhNhi.ts` · `phraseSection.ts`. Người dùng đã nghe và
duyệt vòng này.

**Kết luận của Codex về chính tài liệu này, chép nguyên:** *"`PHUONG-PHAP-SOAN-OUTRO.md` mô
tả mức hoàn thiện cao hơn mã thực tế: trước lượt này, câu vẫn có thể lệch nguồn hoà âm/giai
điệu, quay vòng nguồn, mất nghỉ, bị đảo onset và bị gập từng nốt. Không thể gọi đó là đã học
đúng cách soạn outro."* Cả năm điểm đều đúng.

### 9.1 Cell đệm KHÔNG phải toàn bộ tiết tấu giai điệu

`datVaoLuoi` **đã bị xoá khỏi mã**. Phép greedy nearest-free có thể **đảo thứ tự nốt**. Nay
câu nguồn giữ nguyên onset · chia nhỏ phách · chỗ nghỉ; **phần đệm** giữ cell Tuấn qua
`outroComping` ([phraseSection.ts:774](src/reharm/style/phraseSection.ts#L774)) và nhánh
`if (outroPlan && style.cell)` ở [dòng 943](src/reharm/style/phraseSection.ts#L943).

Được phép ở giai điệu: móc kép, chia ba, đảo phách, nghỉ — khi **nguồn có chủ đích** như vậy.

### 9.2 Một kế hoạch, chọn một lần — `planMinorOutro`

Trước: vòng hợp âm chọn nguồn bằng `nguonKhaThi`, giai điệu chọn bằng `nguonKetThuBolero` —
**hai bên lệch nhau mà không báo lỗi**. Nay `planMinorOutro`
([minorSoloSource.ts:23](src/reharm/style/minorSoloSource.ts#L23)) trả một `MinorOutroPlan`
gồm `sourceId · fromBar · bars · chords · beatsEach · pitchBase`, dùng chung cho cả hai.

Giai điệu phát thẳng từ kế hoạch ấy
([giaiDieuDaoLinhNhi.ts:330](src/reharm/style/giaiDieuDaoLinhNhi.ts#L330)):
`notes: [plan.pitchBase + pitch]` · `startBeat: i * 4 + at` · `durationBeats` từ nguồn. Không
qua bộ chấm điểm ô nào.

### 9.3 Slice liên tiếp thật — không modulo, không bỏ ô nghỉ

`day[(batDau + o) % day.length]` của tôi **quay từ cuối về đầu**, tức nối hai đầu một câu lại
với nhau; và `kho` của tôi đã lọc bỏ ô rỗng. Ô rỗng là **chỗ nghỉ có chủ đích**.

Nay `bars.slice(start, end)`, dài 3–8 ô, và **không bắt đầu giữa khoảng ngân của tiểu cú
trước** (`phrase[0].n[0][0] > 0.5` thì loại).

### 9.4 Hoà âm xét theo CHỨC NĂNG, và không có ứng viên thì BÁO

Kiểm cả root **và các thành phần hợp âm**, không chỉ root. Bỏ hẳn `ganNhat` / *"bậc gần nhất
trong vốn bài"*.

Không có ứng viên → app trả `unavailableReason`
([phraseSection.ts:620](src/reharm/style/phraseSection.ts#L620)) và **bỏ đoạn outro ở lượt
đó**. Không vá, không ngầm rơi về brain hay nguồn khác. Mở trần 84 chỉ giúp điều kiện **tầm**,
không chữa được thiếu hợp âm tương thích.

### 9.5 Điều kiện cadence, không phải "kết cao"

Ô cuối của slice phải là **bậc i chất `m`**, không chia đôi, và **nốt giai điệu cuối thuộc
{1, ♭3, 5}**. Giữ **phách chót vốn có** của nguồn — không ép nốt nguồn cuối thành chủ âm.

`slowClose` chỉ đổi **trường độ và lực**, **không đổi onset** — nên nó **không phải**
ritardando. Trước tôi đã ghi nhầm chỗ này.

### 9.6 Chỉ hai phép biến đổi — mọi hậu xử lý từng nốt đều cấm

Cấm: `thuaTayPhai` · `dangCuoi` · `dapChot` · `gap()` gập từng nốt · nearest-chord-tone ·
nâng từng ô.

Cho phép: **chuyển chủ âm/chức năng**, và **dời quãng tám cả tiểu cú** — một `pitchBase` duy
nhất, chọn sao cho cả câu vừa tầm **62–79**.

Ví dụ Codex đưa: `B` ngắn trên `F` đi về `A` trên `F` — **không xoá `B` chỉ vì nó không thuộc
hợp âm ba**.

### 9.7 Trung bình số đo KHÔNG dùng làm assertion

Chín đoạn kết gồm nhiều điệu, độ dài, tầm đàn và biên đoạn khác nhau. Áp **dấu** của trung
bình `+8,2` và `−3,4` lên mọi câu là sai. Hai assertion của tôi đã bị thay bằng
cadence / time / source invariants; thống kê vẫn in ra để **quan sát**, không để chấm.

### 9.8 Ba phân biệt phải giữ trong đầu

| | |
|---|---|
| **chuyển soạn** ≠ **tự sáng tác** | Giữ nguyên + transpose chỉ tạo được **chuyển soạn**. Khoá `source.id` xong **không** có nghĩa đã đạt mục tiêu sáng tác. Muốn sáng tác cần kế hoạch mô-típ · nốt neo · đường đi tới điểm giải quyết · biến thể có kiểm soát. |
| **một nguồn** ≠ **chỉ học từ outro** | Học mô-típ từ solo thứ ở intro/interlude của cùng thầy là được — nhưng phải **tách kiến thức cao độ khỏi nhịp nguồn**, nêu rõ nguồn, và thiết kế lại cú pháp kết. Vẫn cấm ghép mỗi ô một thầy. |
| **test xanh** ≠ **nghe được** | Test qua không chứng minh không phô ở mọi vị trí, không chứng minh hợp thị hiếu, và **không thay quyền chấm của người dùng**. |

### 9.9 Dữ liệu sheet không mặc nhiên sạch

Ba lỗi trích xuất Codex tìm ra — nên **đừng coi `TUYEN_SOLO` là chân lý**:

| bài | lỗi |
|---|---|
| *Đừng Xa Em Đêm Nay* | ô 82 dài **6 phách** nhưng bảng khai 4 và **cắt nốt** (`tuyen_o.py` lấy số phách phổ biến của đoạn rồi loại nốt offset ≥ 4). `Edim` bị rút về nhãn `m`, **mất quãng năm giảm**. → nguồn này **đã bị loại** khỏi vòng kiểm chứng |
| *Nỗi Buồn Hoa Phượng* | outro có ô 71–73 dài **8 phách**, các ô sau dài 4 → phải dùng **`o4`**, không dùng `o`. Outro thật bắt đầu ô 71 **phách 4**; nửa đầu ô là mô phỏng lời hát, **không lấy vào câu học** |
| *Rừng Lá Thấp* | ký hiệu cuối đọc được là **`Dm7`** trong khi giọng `Am`. **Không được** gọi đó là kết trên chủ âm chỉ vì nốt cuối `E` là bậc 5 của giọng |

Bảng cũng **chưa ghi chất hợp âm thứ hai** của ô chia đôi; chỉ nhận khi trong cùng nguồn có
đúng một chất cho bậc đó, mơ hồ thì loại.

Sửa bộ trích xuất là **một vòng riêng**, có test hồi quy cho các câu intro người dùng đã
duyệt — đổi nó có thể làm hỏng intro đang ổn.

### 9.10 Một lỗi kỹ thuật đáng nhớ

`soloLeftHand` **khởi động lại mẫu đệm theo từng hợp âm**. Hợp âm đổi ở phách 2,5 thì **pha
nhịp lệch**. Dùng `renderPattern` để giữ pha cell trên **toàn đoạn**, rồi tra hợp âm đang vang
tại từng mốc gõ.

### 9.11 Mẫu kiểm chứng Codex đưa — La thứ, vốn `Am Dm G C F E E7 Em`, tầm 62–79, take 0

| | |
|---|---|
| nguồn | `noi-buon-hoa-phuong-outro`, `o4` index **1–4** |
| tương ứng | ô 71 nửa sau · ô 72 hai nửa · ô 73 nửa đầu — một tiểu cú đi về i |
| hoà âm | `Dm ǀ G – F ǀ F ǀ Am` |
| thời lượng | `4 · 2,5 · 1,5 · 4 · 4` phách — **không dồn/chia đều lại** |
| tay phải theo ô | `D D D G D ǀ C C D B ǀ A ngân ǀ A – E B E` |
| kết | giai điệu ở `E` trên `Am`, sau đó phách chót `Am` |
| chuyển giọng | `Dm` nguồn → `Am`, **cùng một phép dịch cho cả câu và hợp âm** |

Codex nói rõ đây là **chuyển soạn một tiểu cú để nghe kiểm chứng**, không phải thành tựu tự
sáng tác. Ở tầm hẹp và vốn hợp âm này có thể chỉ còn rất ít ứng viên; **đổi `take` không bảo
đảm có câu khác**, và chọn lại cùng một tiểu cú **không phải "sáng tạo thêm"**.

### 9.12 Trạng thái kiểm — tôi tự chạy lại, không lấy báo cáo làm chuẩn

`npx tsc --noEmit -p tsconfig.app.json` sạch. `npx vitest run` → **2508 xanh · 6 đỏ / 2514**,
đúng sáu bài đỏ có sẵn từ trước (`phraseAcrossBar` · `daoTruong` · `handSplitAudit` ·
`sietHopAm` · `tuyenSolo` ×2). Khớp đúng con số Codex báo. **Không tuyên bố toàn suite xanh.**

### 9.13 Hướng tiếp theo Codex đặt, theo thứ tự

1. **Sửa dữ liệu:** thời lượng thật từng ô · chất và mốc của mọi hợp âm · nốt nối · nguồn gốc
   từng sự kiện. Cách ly thay đổi khỏi intro đã ổn.
2. **Đánh dấu biên tiểu cú và cadence đã thẩm định.** Slice liền mạch kết ở i chỉ là **điều
   kiện lọc kỹ thuật**, chưa chứng minh mọi slice là câu nhạc hay.
3. **Rút mô-típ · nốt neo · tension-resolution** từ các solo thứ cùng nguồn; rút cú pháp tiết
   tấu từ outro. Thiết kế câu mới **ở cấp tiểu cú**, không vá từng ô.
4. Cần đổi contour cho vừa tầm thì làm **một biến thể mô-típ có chủ đích** và **lưu phép biến
   đổi** — không khôi phục `gap()` từng nốt hay nearest-chord-tone.
5. Sinh **một lô nhỏ**, giữ dấu vết, cho người dùng nghe. Chỉ mở sang thầy/điệu khác **sau khi
   biết mặt nào đã đạt**: nhịp · hoà âm · đường nét · hay kỹ thuật đàn.

### 9.14 Điều Codex tự sửa trong hướng dẫn CỦA CHÍNH NÓ

Ghi lại vì nó giải thích vì sao vài chỗ tôi làm đúng chỉ dẫn cũ mà vẫn ra kết quả dở:

> *"Hướng dẫn cũ của Codex thiếu hợp đồng dữ liệu xuyên suốt, quá cứng về lưới onset, và chưa
> phân biệt đủ rõ **chuyển soạn câu nguồn** với **tự sáng tác từ kiến thức rút ra từ nguồn**.
> Không thể chỉ yêu cầu Claude 'đóng vai Codex' rồi coi chất lượng sẽ tự được bảo đảm."*

Nên chỉ dẫn #4 cũ (*"đặt các vai trò lên pulse/accent hợp lệ của cell"*) — thứ tôi đã thi hành
thành `datVaoLuoi` — là chỗ **chính Codex nhận đã viết quá cứng**.
