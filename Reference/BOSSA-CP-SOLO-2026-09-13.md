# Bossa CP cải tiến — mở lại solo thứ và phát triển câu

13/9/2026. Triển khai theo yêu cầu mới, **chờ người dùng nghe duyệt**, chưa commit.
Không thay khung đệm 11 tiếng đã duyệt. Không ghi đè quyết định trong SO-TAY.

## Phạm vi

- Chọn `Bossa CP cải tiến`, thầy solo `Cà Pháo`, giọng thứ: có intro 8 ô,
  giang 8 ô/lượt, outro 6 ô. Giọng trưởng và thầy khác vẫn chỉ đệm, không lùi
  sang bộ solo cũ hoặc gán câu thứ thành câu trưởng.
- Dùng lại bộ ba đã duyệt ở mốc 12/9, phối với cell đệm chính thức 13/9.
  Tay trái dùng `renderPattern` của chính điệu; tay phải đệm chỉ đáp trong khe
  giai điệu. Phần hát không bị `yieldToFill`, generic ending hoặc solo sửa nhịp.
- Bảo toàn thứ tự các đoạn hát đã lưu. Nếu thiếu thì thêm dạo đầu, giang hai
  lượt sau điệp đầu (không có điệp thì sau đoạn hát cuối), kết bài; không tự
  thêm một lần hát điệp. Nếu bài đã có giang thì giữ số lượt người dùng lưu.
- CP Lick là tùy chọn riêng: được thay hai tay đúng cửa chêm theo sheet,
  không ảnh hưởng cấu trúc đệm ngoài cửa đó.

## Nguồn đã đọc và giới hạn

Đã đo đủ 9 sheet MusicXML/MXL đang hoạt động bằng `tools/cp_lick_corpus.py`.
Bảng tên bài, giọng, chuyển giọng, số ô, số mảnh và bằng chứng ở
[CP-LICK.md §1](CP-LICK.md). File nguồn PianoBrain không thay đổi.

7 bài đủ điều kiện: Hồng Kông 1, Người hãy quên em đi, Có Em Chờ, Ngày mai em đi,
Để Em Rời Xa, Chưa Bao Giờ, Chúng Ta Không Thuộc Về Nhau. Kém duyên và Yêu xa
đã đo nhưng chưa đưa vào soạn vì thiếu xác nhận giọng/cửa lời. Các câu hỏi
gom ở [phiếu CP Lick](PHIEU-HOI-CP-LICK-2026-09-13.md); không đoán câu dày là fill.

Ledger `data/sheet-solos/ca-phao-nguoihayquenemdi-*.json` còn nhóm chùm/onset
cũ sai và outro ghi vượt chiều dài file. Không dùng nguyên ledger để phát;
giữ bộ ba đã đối chiếu raw XML và các cửa đàn xác nhận của kho CP mới.
Outro D trưởng của Người hãy quên em đi không thành mẫu kết thứ tự động.

## Cách soạn mới có thể tái tạo

Trong `src/reharm/style/caPhaoSolo.ts`, take 0–3 giữ bản lưu trữ nguyên dạng.
Take >= 4 gọi `developBossaMelody` trên cùng khung nhịp/hòa âm/cadence:

1. Chọn các mảnh RH `instrumental-intro/interlude/outro` đúng loại đoạn.
   Mỗi đoạn phát triển một bài nguồn, không bốc mỗi ô từ một bài khác.
2. Chỉ lấy **đường nét cao độ** từ ballad/trưởng/thứ; không mang nhịp ballad
   hay tiếng đệm ballad sang Bossa. Giữ onset, gate, lực và chỗ nghỉ Bossa.
3. Dời toàn nét vào tầm tay; không gập đỉnh. Chọn nốt theo gam đích và hợp âm
   đang vang; bỏ bậc ba xung đột với trưởng/thứ của hợp âm, kết tiểu cú ở nốt
   hợp âm. Giữ hướng đi lên/xuống hoặc nhắc nốt; loại va cùng phím/nửa cung
   với LH đang ngân. Không có mảnh hợp lệ thì giữ nét Bossa tham chiếu.
4. Giữ nguyên cadence và khoảng thở cuối intro/giang, cú Bb9–E7b13 của outro,
   cùng ô cuối LH chủ âm + RH 5–1–b3 ngân 4 phách. Vòng giang cuối hút đúng
   hợp âm sắp hát; vòng trước về tonic.
5. `developmentSources` ghi bài, ô nguồn, ô đích và phương pháp
   `contour-on-bossa-rhythm`. Đây là KT phát triển nét CP, không phải chép nguyên sheet.
6. Đường phát tăng take mỗi lần bấm; cùng đầu vào/take tái tạo cùng câu.
   Kho hữu hạn: không hứa vô hạn lượt chưa từng lặp. Không chỉ xoay bốn bản cũ.

## Nghe và kiểm

- Bài mẫu đã mở: **Để Nhớ Một Thời Ta Đã Yêu**, Am, CP cải tiến + thầy Cà Pháo.
  Không lưu đè bài thư viện. Đã thử hai lần Phát trọn bài rồi dừng.
  `Nguon.json` ghi dạo/giang/kết #799–801 và #802–804; cả ba cặp có dữ liệu
  nốt khác nhau, cùng độ dài 8/8/6 ô. Đây là kiểm đường phát, không phải duyệt thẩm âm.
- Trang nghe riêng `/tools/bossa-intro.html`: chọn đoạn/giọng/Bản; bật “Soạn mới
  mỗi lần phát”, hoặc tắt và chọn 0–3 để đối chiếu bản cũ. Trang không sửa bài lưu.

```powershell
python -X utf8 tools/cp_lick_corpus.py --check
npm test -- caPhaoBossa cpLick bossaRhythmOnly
npm run build
```

Kiểm tự động so 12 giọng thứ × 3 đoạn × 24 lượt: cùng nhịp, LH, hòa âm,
cadence với khung lưu trữ tương ứng; kiểm nốt mới theo gam/hợp âm/tầm tay,
không va LH, lượt liên tiếp khác nhau, trên bốn biến thể, có nguồn truy lại.
Kiểm thêm thứ tự hát lặp và đoạn dài lẻ ô vẫn giữ pha A/B.
Không cập nhật snapshot câu cũ để che sai khác. Chờ nghe duyệt rồi mới chốt sổ tay.

Kết quả cuối: 2.606 test đạt / 6 lỗi cũ (`phraseAcrossBar`, `daoTruongLinhNhi`,
`handSplitAudit`, `sietHopAm`, `tuyenSolo` ×2), không còn lỗi Bossa mới.
TypeScript + production build đạt; ESLint phần solo/playback sửa không lỗi,
ReharmHome còn 8 cảnh báo hook. Snapshot bộ ba lưu trữ giữ nguyên hash.
Test thêm 24 lần phát với take lớn đúng bước tăng của app trong tầm Am D4–G5.
