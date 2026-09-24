# Slow Rock LT: đối chiếu Lá Thư Trần Thế

Ngày 25/9/2026. Theo yêu cầu tách rõ hai bản của người dùng:

- **Slow Rock Lá thư (Claude)**: giữ nguyên file `linhNhiSlowRock.ts`,
  ID `slow-rock-la-thu` và `slow-rock-la-thu-chorus`, màu nút cũ.
- **Slow Rock LT (Codex)**: file riêng `slowRockLT.ts`, ID `slow-rock-lt`
  và `slow-rock-lt-chorus`, family riêng, nút màu hồng.

Lần đầu Codex đã hiểu sai và đổi tên nút Claude trong worktree cổng 5175.
Bản sửa này khôi phục nút cũ, thêm nút độc lập và đưa vào bản chính cổng 5173.

## Nguồn và cách đo

- File: `D:/PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl`.
- SHA-256: `b45d3f754cccd7eb87f279f91e3909b96caf4b8d4e65528b26e3a0df6a8019d0`.
- Đọc bằng `D:/PianoBrain/tools/sheet/mxl.py`: nhóm nốt cùng onset,
  tách hai khuông, bỏ tie-stop khỏi các lần gõ mới.
- Sheet ghi **4/4, nốt đen = 86**. Mẫu đệm lặp theo nhóm sáu móc đơn,
  thường đi qua vạch nhịp ký âm. Lưới biên soạn của app là 6/8,
  `gridUnit = 0.5`, BPM 86: mỗi tiếng cách nhau nửa nốt đen.
- Ký hiệu `cN` là nhóm bắt đầu ở `1 + 3*N` nốt đen từ đầu file,
  dài 3 nốt đen. Đây là lưới phân tích lại, **không phải số ô XML**.
  Cách nghe/nhóm thành slow rock nhịp kép là diễn giải từ mẫu đệm;
  không được nói số chỉ nhịp in trên sheet là 6/8 hay 12/8.

## Tiết tấu rút ra

| Vị trí | Tay trái đo trực tiếp | Cách dùng |
| --- | --- | --- |
| c15, Bb; XML 12 phách 3 | Bb2 D3 F3 Bb3 F3 D3, sáu móc đơn đều | Phiên khúc: 1-3-5-8-5-3 |
| c16, C; XML 13 phách 2 | C3 E3 G3 C3+C4 G3 E3 | Biến thể tiếng 4 thêm gốc dưới quãng tám |
| c41, D7; XML 32 phách 1 | Bass tiếng 1; cụm ở tiếng 2, 2.5, 3, 4, 5; nốt F#3 ở 3.5; bass tiếng 6 | Điệp khúc dày hơn, có chia đôi tiếng |
| c42, Gm; XML 32 phách 4 | Bass quãng tám, cụm hợp âm từ tiếng 2 tới 5, bass tiếng 6 | Ô thứ hai của mẫu điệp |
| c22, A7; XML 17 phách 4 | A2+A3, A2, A2+A3, A2, E2+E3, A2+A3 | Cử chỉ đệm khi có fill bè trầm |

Tay phải c15-c16 là nốt giai điệu ngân rồi chuyển nốt cuối nhóm, nên không
lặp lại như hợp âm đệm. c22 có cụm A3-C#4-E4-A4 ở tiếng 2 và 2.5,
bỏ A3 ở tiếng 3, rồi ngân C#4-E4-A4 từ tiếng 4 trong hai tiếng.
App dùng cử chỉ này qua `fillCell`, được thay vào ở vị trí fill phù hợp.

Đối chiếu lặp: tay trái c87 trùng c15. c93 có cùng onset hợp âm tay phải
với c22 nhưng cụm ngân tiếng 4 **có thêm A3**; tay trái c93 cũng khác
trường độ. Vì vậy không coi toàn bộ hai ô là bản chép giống hệt.

## Phần biên soạn của Slow Rock LT

- Mẫu hát để trống tay phải để dành chỗ cho giọng hát.
- Khi chuyển hợp âm, dùng tầm bass của app (gốc C ở C2); không giữ cố định
  quãng tám của từng hợp âm trong bản chép gốc.
- c22 bỏ E4 giai điệu đầu nhóm, và dùng E3 thay cặp E2+E3 ở tiếng 5
  để chuyển giọng trong tầm tay trái của app.
- Phiên lặp mẫu sáu tiếng c15 cho mỗi hợp âm; điệp lặp c42. Đây là cách
  tổng quát hóa từ các ô cụ thể, không phải bản chép toàn bài.
- c42 bỏ D2 thuộc lớp hòa âm D7 trước đó.
- Hợp âm chia đôi dùng cách rải đã có theo phản hồi người dùng.
- Bản Claude vẫn dùng c15-c16 và c41-c42 luân phiên như trước. LT có dữ liệu
  riêng, không sao chép đối tượng hoặc alias sang ID Claude. Nhịp rải giống
  nhau ở c15 là do cùng nguồn sheet, không phải bằng chứng về tác giả mã.

Màu hồng dùng cho Bossa/Ballad Cà Pháo do Codex biên soạn và Slow Rock LT.
Không gán màu Codex cho Bolero Linh Nhi hay Slow Rock Lá thư chỉ vì có nguồn sheet.
Màu không biểu thị đã nghe duyệt.
Đối chiếu nốt và test kỹ thuật không thay thế việc người dùng nghe thử.
