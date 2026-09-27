# Blues Codex 1

Ngày 27/09/2026. Bản biên soạn để nghe duyệt, chưa được người dùng chốt âm nhạc.

## Nguồn và phạm vi

- Nút riêng `blues-codex-1`, màu hồng Codex, nhóm 6/8. Lấy khung `blues-duc-thinh` của Claude làm nền.
- Giữ vị trí đánh và bass của khung gốc; rút ngắn ngân hợp âm tay phải. Màu hợp âm và câu chêm bên dưới do Codex biên soạn.
- Không phải bản phiên âm mới từ video `KN9JEiQXAHs`. Thông tin video kế thừa trong style là nguồn khung Claude đã ghi, không chứng minh những câu chêm mới là của thầy.

## Khung tiếng khi chưa chêm câu đáp

Một ô 6/8 dài **3 phách nốt đen** trong engine. Vị trí trong bảng đếm từ 0; một đơn vị móc đơn = 0,5 phách.

| Tiếng | Tay | Vị trí | Ngân (phách nốt đen) |
| --- | --- | ---: | ---: |
| BÙM — gốc/bass theo thế bấm | Trái | 0 | 1 |
| bùm — nốt thứ năm | Trái | 1 | 0,45 |
| chát — hợp âm nhắp | Phải | 1,45 | 0,6 |
| bùm — nốt thứ năm | Trái | 2,5 | 0,5 |

Các khoảng ngoài độ ngân là nghỉ thực. Tay phải nhả phần đệm trước khi chơi câu đáp; không đẩy cả cụm hợp âm sang tay trái. Cú nhắp bị cắt còn dưới 0,12 phách được bỏ.

## Phần thêm

- Thế nhắp ba nốt: trưởng thường dùng 3–6–9; dominant dùng 3–b7–9; thứ dùng b3–b7–9; maj7 giữ 7 trưởng. Hợp âm 6 giữ bậc 6; sus/dim/altered giữ thế bấm đầu vào.
- Lick có nốt láy b3→3 trên hợp âm trưởng, 2→b3 trên hợp âm thứ, b5→5, bè đôi, nhắc nốt, ngắt câu và lực nhấn khác nhau. Run lên/xuống kết về nốt hợp âm hiện tại, ưu tiên nốt chung với hợp âm sau.
- Tự chêm ở cuối hợp âm theo mật độ/chỗ nghỉ đã có; một trong ba lượt motif là run ngắn. Fill tự động dài tối đa nửa hợp âm và 1,5 phách; Run tự chọn hoặc chuyển đoạn tối đa 3 phách.
- Giữ lựa chọn tắt fill, chỗ đang hát, nghỉ cuối và đệm trước rồi chạy. CP Lick không thay câu chêm riêng của điệu này.
- Một lượt phát dùng chung câu chêm và phần đệm đã nhả tương ứng. Bấm phát lại có thể đổi motif; chưa phải bản nghe được đóng băng.

## Nghe thử

Chọn **6/8 → Blues Codex 1**. Có thể thử vòng 12 ô `C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7`, đặt mỗi hợp âm **3 phách** để mỗi hợp âm chiếm một ô 6/8. Đây là vòng người dùng nhập; nút không ép bài hát khác thành 12 ô hoặc tự nhận diện cấu trúc 12-bar.

Các vị trí nghỉ dựa trên dữ liệu lời/cài đặt, chưa biết chính xác giai điệu hát. Cần nghe duyệt mức độ chêm và tốc độ run. Thay đổi này tập trung vào đệm và fill/run, không thay bộ soạn dạo/giang/kết thành một bộ Blues mới.

Kiểm tra: `npx vitest run src/reharm/style/__tests__/bluesCodex.test.tsx` và `npm run build`. Bộ kiểm tra bao gồm các giọng trưởng/thứ/7/maj7, quyền chọn fill/run, hai đường ráp bài, chỗ nhả tay phải và nút chọn riêng.
