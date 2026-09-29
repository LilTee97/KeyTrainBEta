# Kim — mẫu đệm đo từ bản thu ASIA

Ngày dựng: 29/9/2026. Người dùng: *"bạn có thể tạo tiết tấu đệm như trong video Kim ở trên và cho nó vào nút Kim ko"*.
Trạng thái: **đã dựng để nghe thử, chưa nghe duyệt.**

## 1. Nguồn

- Bài **Kim**, nhạc sĩ **Y Vũ** (em ruột Y Vân). Sheet (Hợp Âm Việt) ghi **"Rock"**, 4/4, Sol trưởng; điệp khúc là khung 12 ô blues
  I I I I | IV IV | I I | V IV | I I, giai điệu có nốt blue Sib · Fa bình.
- Bản thu: Công Thành & Lynn, ASIA 1 — YouTube `fjG-uQVhPqI`, 243 giây. Bản này ở **Si trưởng** (bass phách 1: Si 34 lần).
- Không có sheet phần đệm: mọi số dưới đây đo từ AUDIO, không phải ký âm.

## 2. Cách đo (tái lập: `tools/kim_ban_thu.py`)

1. Tách bốn bè bằng demucs `htdemucs`. **Bè bass gần như im** (RMS 0,0–0,4 so với bè "khác" 1,5–4,1, khối 10 giây) — bass của bản
   này nằm trong bè "khác". Hai lần dò cao độ trên bè bass (pyin, CQT cộng hoạ âm) chỉ bắt đủ 8 nốt ở 7–8/146 ô → bỏ.
2. Chép nốt bè "khác" bằng `piano_transcription_inference` (2.366 nốt). Nốt dưới MIDI 50 = tay trái, còn lại = tay phải.
3. Lưới phách từ librosa trên trống + bass + khác: 589 phách, ♩ trung vị **152**. Pha ô: snare nổi ở phách lẻ (59 so với 22) →
   phách 1 ở phách chẵn; trong hai pha chẵn, nốt bass phách 1 ra Si (34) ở pha 2, Fa# (16) ở pha 0 → pha 2.
4. Móc đơn **thẳng**: tiếng gõ thứ hai trong phách đỉnh ở 0,50 phách (shuffle sẽ ở ~0,67), độ nổi 4,0; ở vị trí móc kép bè "khác"
   chỉ 0,11–0,14 so với móc đơn 0,57–1,00 (53 ô có giọng hát).

## 3. Số đo

| mặt | số đo | mẫu |
|---|---|---|
| tay trái | **1 1 3 3 5 5 6 5** móc đơn, mỗi nốt gõ hai lần — 34/44 ô đủ 8 nốt; 1 1 5 5 ♭7 ♭7 8 8 — 6/44; 4 ô lẻ | 44 ô |
| tay phải | cú chặn (≥ 2 nốt) rải cả 8 móc đơn: 31–54 cú mỗi vị trí trên 143 ô; móc kép 0–2 | 143 ô |
| dải 400–4000 Hz bè "khác" | 8 móc đơn 0,65–1,00, móc kép TB 0,38 | 53 ô hát |
| hợp âm tay phải | trên I (Si): 1 · 3 · 5 = 27 · 23 · 23 %, 6 chỉ 5 %, ♭7 4 % → hợp âm ba trơn; trên IV (Mi): ♭7 20 % → **Mi7**; trên V: 6 nốt, không kết luận | 81 · 31 · 10 ô |
| trường độ | tay trái trung vị 0,17 phách (tứ phân vị 0,14–0,25); tay phải 0,18 (0,04–0,27) → **nốt ngắt** | 98 ô đủ mẫu |
| lực tay đệm | tay trái 58 → 72 (lên dần theo dòng bass); tay phải 57–64, **không có nhấn** | 98 ô |
| trống | kick cả 4 phách (0,84 · 1,00 · 0,74 · 0,89); **snare 2 · 2& · 4** = 0,91 · 1,00 · 0,90, móc khác ≤ 0,36 | 98 ô |

**Bố cục mỗi vòng 12 ô** (bản đồ cả bài, `kimmap`): ô 1–8 đệm đủ mẫu (6–8 nốt bass); **ô 9 (V) chỉ một cú phách 1 rồi ngừng** —
ban nhạc dừng cho ca sĩ hát (ô 12 · 24 · 48 · 60 · 72 · 96 · 132 của bài: 1 nốt); ô 10–11 thưa (2–4 nốt); ô 12 đi lại vào vòng.

## 4. Chuyển vào KeyTrain

`src/reharm/style/styleLibrary/kim.ts`, `id/family = kim`, nút **Kim** ở nhóm 4/4, ♩ 152, `feel: 'straight-block-chord'`.

- **Đo:** tay trái `1 1 3 3 5 5 6 5` ở 8 móc đơn; tay phải chặn hợp âm ở cả 8 móc đơn; móc đơn thẳng; ♩ 152.
- **Chuyển dụng của Claude:**
  - nhấn tay phải `velocityScale` 1,15 ở 2 · 2& · 4, 0,9 ở các móc khác — dời nhấn của **trống** sang tay phải để piano một mình
    còn phách 2–4 (tay đệm của ban nhạc gõ đều);
  - trường độ ¼ phách cả hai tay (tứ phân vị trên của số đo, cho hợp âm kịp vang);
  - bậc 3 · 5 · 6 lấy theo hợp âm người dùng gõ; hợp âm thứ dùng ♭3 và giữ 6 trưởng như Twist — **bản thu không có hợp âm thứ**;
  - tay phải dùng thế bấm của hợp âm bài, không tự đổi IV thành 7 (Mi7 là số đo — người dùng tự gõ F7/E7 nếu muốn).
- `leftHandTop: 60` như Twist, để bậc 6 ở giọng cao không bị gập xuống dưới gốc. `autoFills: false`: giữ mẫu ở chỗ fill tự động.
- Không đụng `hoDieu.ts`: Kim không thuộc họ nào, câu solo / điệp khúc dùng chính nó.

## 5. Chưa làm · chưa đo

- **Ngừng ở ô V** (cú phách 1 rồi lặng) — chưa dựng: cell lặp theo hợp âm không biết ô nào là ô 9 của khung 12 ô.
- **Hình 1 1 5 5 ♭7 ♭7 8 8** (6/44 ô) — chưa dựng.
- Dạo · giang · kết: đi đường mặc định của app, chưa có câu solo riêng cho Kim.
- Chưa nghe duyệt. Test `kim.test.tsx` chỉ kiểm mẫu đúng số đo, không phải xác nhận bằng tai.

**Triệu chứng để lùi:** "tay phải nặng / dồn" → bỏ cú chặn ở 1& · 3& · 4& (giữ 1 · 2 · 2& · 3 · 4); "không nghe phách 2–4" → nâng
`velocityScale` nhấn 1,15 → 1,3; "đục, dính" → trường độ ¼ → ⅛ phách; "khô quá" → ¼ → ⅜.
