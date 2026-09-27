# Blues Codex 1

Cập nhật 27/09/2026 từ yêu cầu học Rockhouse/Robert. Bản nghe thử, chưa được người dùng chốt âm nhạc.

## Nguồn

Nút riêng `blues-codex-1`, màu hồng, nhóm 6/8. Giữ khung bass và mốc nhắp 1,45 nốt đen của **Blues Đức Thịnh do Claude soạn**. Mô-típ mới là Codex biên soạn từ sheet, không phải phiên âm mới video của thầy.

Xem [phân tích hai tay và khung tiếng](BLUES-ROCKHOUSE-ROBERT.md) và [số đo tái lập](BLUES-SHEETS-EVIDENCE.json).

## Cách chơi

- Giai điệu trong từng ô, không đợi fill: nốt đơn → cụm có bè giai điệu → đáp/bè đôi. Bốn ô: hỏi, nhắc, đáp, thở.
- Ô thường: RH ở 0; 0,5; 1,45; 2,5, ngân 0,35; 0,35; 0,55; 0,35 nốt đen. Ô thở: RH ở 0 ngân 0,85 và 1,45 ngân 0,55. Ngoài phần ngân là nghỉ thật.
- LH ở 0 ngân 1; 1 ngân 0,45; 2,5 ngân 0,5. Walking Bass là lựa chọn riêng.
- Cụm RH trưởng 3–5–6, dominant 3–5–b7, thứ b3–5–b7, maj7 giữ 7. Sus/dim/altered được bảo toàn. Nốt theo hợp âm thực ở từng thời điểm.
- Không tự chồng run cuối hợp âm. Fill/Run tự chọn và chuyển đoạn vẫn dùng được, thay RH trong cửa sổ tương ứng, có láy nhẹ/bè đôi/nốt blue.
- Fill/Run bước 0,5 nốt đen. Thiếu chỗ thì bớt nốt, dưới 0,5 thì bỏ. Fill tối đa 3 tiếng chính/1,5 phách; Run tối đa 6/3 phách. Giữ nghỉ, delay và mốc mở ô.
- Tắt fill không tắt mô-típ trong ô. Mật độ fill không làm nền nhanh lên. Mô-típ nền cố định; Fill/Run có thể đổi theo lượt.

## Nghe thử

Chọn **6/8 → Blues Codex 1**, thử `C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7`, mỗi hợp âm 3 phách nốt đen. Không cần đánh dấu Fill/Run. Nghe ô thứ tư nhả đuôi và qua F/G đổi màu.

Đây là vòng nhập, không phải bộ tự nhận dạng/ép mọi bài thành 12-bar. Phân biệt nhịp 4/4 của sheet với nền 6/8 của nút. Chưa thay bộ dạo/giang/kết dài bằng bộ mô phỏng Ray/Robert.

## Kiểm tra

`npx vitest run src/reharm/style/__tests__/bluesCodex.test.tsx`: nút riêng, bass, màu hợp âm, mô-típ không cần fill, tốc độ, 12 giọng, nghỉ/đổi hợp âm/đoạn lẻ, Fill/Run và hai đường ráp bài. Xem báo cáo phân tích để biết kết quả rộng hơn và giới hạn chưa nghe duyệt.
