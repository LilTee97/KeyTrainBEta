# Blues Codex 1

Cập nhật 27/09/2026 từ yêu cầu học Rockhouse/Robert. Bản nghe thử, chưa được người dùng chốt âm nhạc.

## Nguồn

Nút riêng `blues-codex-1`, màu hồng, nhóm 6/8. Giữ khung bass và mốc nhắp 1,45 nốt đen của **Blues Đức Thịnh do Claude soạn**. Mô-típ mới là Codex biên soạn từ sheet, không phải phiên âm mới video của thầy.

Xem [phân tích hai tay và khung tiếng](BLUES-ROCKHOUSE-ROBERT.md) và [số đo tái lập](BLUES-SHEETS-EVIDENCE.json).

## Cách chơi — sửa sau phản hồi chỉ nghe dặm

- RH xen cụm đệm với **câu chạy liền 4–6 nốt trong hai ô**, có câu qua vạch ô. Nguồn hướng câu: Rockhouse 35/45/47, Robert 31/82; không dùng Boogie Woogie.
- Bước câu cố định 0,5 nốt đen; nốt giữa ngân 0,48, nốt kết tối đa 0,85, lực 74–80. Có nghỉ trước/sau cả câu, không chặt vụn từng nốt thành tiếng dặm.
- Cụm RH tại 1,45 mỗi ô nhả khi nằm trong câu chạy; sau câu có thể trở lại. LH giữ 0 ngân 1; 1 ngân 0,45; 2,5 ngân 0,5. Walking Bass vẫn là tùy chọn riêng.
- C7: câu đầu G4–Ab4–A4–C5 ở 2; 2,5; 3; 3,5. Câu tiếp D5–C5–D5–C5–A4–G4 ở 6,5 đến 9. Mẫu phản hồi Robert dùng câu xuống, nhắc nốt rồi hạ cánh.
- Không cần bật Fill/Run. Fill/Run tự chọn thay câu RH trong cửa sổ đó, không chồng thêm lớp. Giữ vùng nghỉ và ranh giới đoạn; thiếu chỗ thì bớt nốt, không tăng tốc.
- Vòng một ô vẫn có câu chạy; dưới ba tiếng ở bước 0,5 thì giữ đệm. Thứ/maj7/sus/dim/altered theo màu thực; đổi hòa âm giữa câu chọn nốt gần để giữ đường đi.
- Bản cũ 2cdd2c5 có 3 nốt ngắn rời quanh cụm hợp âm, chưa tạo cảm giác chạy; không dùng số lần RH/ô để kết luận đã có câu chạy.

## Nghe thử

Chọn **6/8 → Blues Codex 1**, thử `C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7`, mỗi hợp âm 3 phách nốt đen. Không cần đánh dấu Fill/Run. Chọn Hai tay; nghe câu đầu đi qua đầu ô thứ hai, rồi cụm đệm trở lại. Chuyển sang chỉ tay phải có thể giúp nghe riêng đường giai điệu.

Đây là vòng nhập, không phải bộ tự nhận dạng/ép mọi bài thành 12-bar. Phân biệt nhịp 4/4 của sheet với nền 6/8 của nút. Chưa thay bộ dạo/giang/kết dài bằng bộ mô phỏng Ray/Robert.

## Kiểm tra

`npx vitest run src/reharm/style/__tests__/bluesCodex.test.tsx`: nút riêng, bass, màu hợp âm, mô-típ không cần fill, tốc độ, 12 giọng, nghỉ/đổi hợp âm/đoạn lẻ, Fill/Run và hai đường ráp bài. Xem báo cáo phân tích để biết kết quả rộng hơn và giới hạn chưa nghe duyệt.
