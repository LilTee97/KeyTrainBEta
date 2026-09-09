# Bàn giao KeyTrain cho session Codex mới — 09/09/2026

## Prompt dùng ngay

```text
Tiếp tục dự án KeyTrain trên phiên bản mới nhất tại D:\KeyTrain, nhánh thuoc-cham-cau-solo. Đọc AGENTS.md và Reference/BAN-GIAO-CODEX-SESSION-MOI-2026-09-09.md trước. Không dùng D:\Coding Piano app. Kiểm tra git status và commit mới nhất trước khi sửa. Tiếp tục từ vòng nghe thử intro giọng thứ; không tự tinh chỉnh vòng hai cho đến khi tôi gửi đánh giá nghe. Không làm mất Nguon.json vì đây là dữ liệu chấm câu cục bộ và đang được gitignore.
```

## Trạng thái bàn giao

- Workspace đúng: `D:\KeyTrain`.
- Nhánh: `thuoc-cham-cau-solo`.
- Repo cũ `D:\Coding Piano app` không dùng.
- `Nguon.json` được gitignore; dữ liệu câu đã nghe/chấm vẫn nằm cục bộ, không có trong commit.
- Ponytail đang dùng mức `full`: ưu tiên sửa đúng nguyên nhân với thay đổi nhỏ nhất.

## Việc đã làm trong đợt này

1. Thêm sổ `Nguon.json` và giao diện lưu, phát lại, đánh giá, bình luận câu dạo/giang.
2. Bổ sung và kiểm tra Bolero Tuấn/Linh Nhi, vòng hợp âm dạo thứ/trưởng, câu chạy và ghép tuyến sheet.
3. Đối chiếu các intro trưởng đã ổn `#472`, `#480`, `#484` với các intro thứ chưa ổn tối 08/09; giữ `#386`, `#406`, `#432`, `#436` làm đối chứng thứ đã được duyệt.
4. Intro thứ Bolero Tuấn dùng khung xen ô đệm/giai điệu gần nhóm trưởng đã duyệt; chừa ô đầu và cuối cho tuyến giai điệu.
5. Không còn xoay xuống ứng viên điểm kém chỉ để tạo khác biệt. Chọn đúng gốc, chất hợp âm, kiểu chia ô và tầm tay; vẫn đổi câu theo `take`.
6. Không đổi yêu cầu `Em`/`E7` thành `E` chỉ vì bài có hợp âm cùng gốc.
7. Câu chạy mặc định lấy cụm bốn nốt liên tiếp có thật trong sheet thứ, chuyển theo chủ âm và dời nguyên cụm theo quãng tám; không bẻ riêng từng cao độ.
8. Bỏ việc xóa nốt lướt/nốt treo sau khi đã chọn tuyến vì nó làm câu bị thủng.
9. Đưa *Nỗi Buồn Hoa Phượng* vào vốn bốn phách bằng cách tách ô tám phách thành hai nửa mà không tăng tốc. Tôn trọng mốc người dùng xác nhận: intro ô 5 từ phách 5 là hát; outro ô 71 trước phách 4 là mô phỏng lời hát.
10. `tools/tuyen_o.py` là nguồn sinh `src/reharm/style/tuyenSolo.ts`; không sửa bảng sinh bằng tay. `tools/audit_minor_sheets.py` đọc lại các sheet thứ của ba thầy.

Phân tích chi tiết nằm ở `Reference/DOI-CHIEU-INTRO-THU-2026-09-09.md`.

## Kiểm tra đã chạy

- `minorIntroFrame.test.ts`: 6/6 đạt.
- Kiểm tra mới bao phủ 12 giọng × 24 lượt: không trắng ô, mở trên chủ âm thứ, không vượt trần Sol5 và vẫn có biến thể.
- 48 cụm chạy trong 24 lượt La thứ khớp hình và tiết tấu tương đối của cụm bốn nốt trong nguồn sheet.
- Hash 24 lượt intro trưởng được khóa để tránh làm đổi các câu trưởng đang ổn.
- TypeScript và bản production đã build thành công.
- Lần chạy toàn kho gần nhất: 2.474 đạt, 6 chưa đạt trên 2.480 kiểm tra. Không nới ngưỡng để làm xanh.

Sáu kiểm tra còn đỏ:

1. `phraseAcrossBar.test.ts`: tỉ lệ nốt trong hơi dài 47,4%, yêu cầu 50%.
2. `daoTruongLinhNhi.test.ts`: tầm trưởng 71,3, mục tiêu 75,3. Đây là lỗi đã biết trước vòng sửa thứ.
3. `handSplitAudit.test.ts`: ô 3 giang chưa có bước nửa cung.
4. `sietHopAm.test.ts`: bật siết chưa làm đoạn kết trưởng bám hợp âm hơn.
5. `tuyenSolo.test.ts`: tâm Cà Pháo trưởng 72,6 lệch neo 70,8.
6. `tuyenSolo.test.ts`: tâm Cà Pháo thứ 74,0 lệch neo 68,0 hơn ngưỡng rất ít.

## Việc tiếp theo

Việc ưu tiên là để người dùng nghe 3–5 intro mới của bài *Để Nhớ Một Thời Ta Đã Yêu*, La thứ, Bolero Tuấn, chọn `— soạn mới —`.

- Không cần tick `Vòng dạo giống sheet thứ` để nghe bản sửa mặc định. Checkbox đó chỉ đổi vòng hòa âm thử nghiệm.
- Theo skill `train-teacher-solo`, đây mới là vòng sửa đầu. Chờ nhận xét nghe rồi mới tách tiếp ba mặt: tiết tấu, vòng hợp âm, chọn nốt/giai điệu.
- Người dùng cũng báo nút `Phát cả bài` có lúc không phát. Session trước chỉ xác nhận engine mở khóa âm thanh được trên một trang sạch; chưa tái hiện với bài đã lưu vì dữ liệu IndexedDB của trình duyệt thử không có bài. Chưa có bản sửa cho lỗi này. Khi làm tiếp, hỏi/quan sát đúng trạng thái nút, dòng `Bật âm thanh trước đã`, lựa chọn `— soạn mới —`, và checkbox `Nhạc gốc nền`; phân biệt không phát tiếng đàn với không phát file nhạc gốc.
- Sau khi người dùng duyệt bằng tai, cập nhật `Reference/SO-TAY.md` theo quyết định đã chốt; không ghi kết luận “đã hay” chỉ dựa vào test.

## Lệnh kiểm tra nhanh

```powershell
cd D:\KeyTrain
node node_modules/vitest/vitest.mjs run src/reharm/style/__tests__/minorIntroFrame.test.ts
npm run build
git status --short
```
