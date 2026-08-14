# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dự án

KeyTrain — app luyện tập piano offline, lấy cảm hứng từ mikebwilliams.com/chords/ (drill nhận diện hợp âm) nhưng bổ sung tính năng tái hòa âm theo phong cách đệm hát của anh Khá.

## Kiến trúc

- Vite 7 + React 19 + TypeScript (strict) + Tailwind CSS 4
- Bảng màu tạm lấy theo tông của TungaStyle
- MIDI: dùng Web MIDI API, chỉ cần chạy trên Chrome/Edge (Windows + Android qua cáp OTG), không cần hỗ trợ Safari/iOS

## 4 tính năng nền tảng

1. Nhập hợp âm/vòng hợp âm/lời bài hát có hợp âm → tạo backing track theo nhịp/điệu tùy chọn để luyện đệm
2. Tái hòa âm theo phong cách đệm hát của anh Khá + pattern đệm theo style đó
3. Tự sinh câu fill và đoạn solo dựa trên kiến thức từ phongcachdemhatkhabu.md
4. Chế độ chờ đánh đúng nốt mới cho qua nốt tiếp theo; luyện tay trái/tay phải riêng biệt

## File tham khảo

- reference/KE-HOACH.md — kế hoạch xây dựng: kiến trúc, thiết kế gamification, mô hình dữ liệu, và lộ trình 30 bước nhỏ. Đọc file này trước khi làm tính năng mới.
- reference/SO-TAY.md — sổ tay kỹ thuật: các quyết định thiết kế đã chốt và lý do, ghi thêm sau mỗi bước lớn
- reference/DE-DANH-SAU.md — các ý tưởng đã bàn nhưng cố ý chưa làm. Đừng tự ý làm chúng, chờ người dùng chủ động quay lại
- reference/phongcachdemhatkhabu.md — nguyên lý voice leading + 5 kỹ thuật (voicing sus/9/11, slash chord, dim7 passing, vòng 2-5-1, nốt láy/fill) + phân loại theo điệu (ballad/bossa/valse/swing)
- reference/TungaStyle-6-drop2_5.html — engine tái hòa âm cũ, tham khảo cấu trúc code, không phải code sản xuất cho dự án này

## Quy ước

- Code + biến/hàm bằng tiếng Anh, comment giải thích nhạc lý bằng tiếng Việt nếu cần
- Mỗi bước lớn xong phải commit trước khi sang bước tiếp theo
