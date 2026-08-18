---
name: licky
description: Generate Licky fills and finger runs — clone phrases from lick docs or create variations. Use when editing fill/run generators, Licky Fills/Runs UI, ingesting new lick documents, or replacing classic fill/run buttons.
---

# Licky

Sổ câu fill + chạy ngón. Sau này thay nút tạo fill / chạy ngón cũ.

## Khi nào

- Sửa `src/reharm/licky/` hoặc nút **Licky Fills** / **Licky Runs**
- User đưa tài liệu lick mới vào `Reference/`
- Câu fill/chạy ngón nghe sai, lệch hợp âm, hoặc không clone được

## Não

| Nguồn | Việc |
|---|---|
| `Reference/52 Piano Jazz Blues Licks.mxl` | Clone hình nốt tay phải → `src/reharm/licky/phrases.json` |
| `Reference/phongcachdemhatkhabu.md` | Fill cuối ô, nốt dẫn, dim7 |
| `Reference/pianoimprovnotes.md` | Phrasing, ngũ cung, blues |
| `src/reharm/fillSoloGenerator/` | Fill/run cũ — dùng khi tắt Licky |

Không scrape web. Không chép nhãn thương mại ra UI. Clone = interval + nhịp, dịch theo hợp âm đang vang.

## Clone vs sáng tạo

- **Thuộc câu** (`clone`): đúng hình nốt tài liệu, transpose theo gốc hợp âm
- **Sáng tạo** (`create`): đảo hình / dịch bậc 3 / đảo thời gian, nốt cuối kéo về nốt hợp âm

Fill = cắt đuôi câu cho vừa khe cuối ô. Run = cả câu, co nếu dài hơn ô.

## Tài liệu mới

1. Thả file vào `Reference/` (`.mxl` / MusicXML / markdown có nốt).
2. Giải `.mxl` (zip) → `score.xml`. Lấy **staff 1**, bỏ tay trái / hợp âm đệm.
3. Cắt câu theo nhãn `#…` / `lick` hoặc nghỉ ≥ 2 phách.
4. Ghi interval + `at` + `dur` vào `src/reharm/licky/phrases.json`.
5. Cập nhật `src/reharm/licky/docs.ts`.

**Không đọc được hoặc chỉ đọc một phần** → ghi `unread` / `partial` trong `docs.ts` và nói rõ cho user để họ đổi file. Đừng im.

PDF, ảnh chụp, file DRM, MXL hỏng, bài hát không nhãn lick = `unread` hoặc `partial`.

## Code

- `src/reharm/licky/generate.ts` — `placeLick`
- `src/reharm/fillSoloGenerator/soloGenerator.ts` — `lickyFills` / `lickyRuns` / `extraFills`
- Chuột phải: mọi hợp âm **đủ phách** có mục Thêm/Bỏ fill

## Không làm

- Không thay solo giang tấu trừ khi user bảo
- Không commit file nguồn có bản quyền dưới tên tác giả; chỉ interval pattern
