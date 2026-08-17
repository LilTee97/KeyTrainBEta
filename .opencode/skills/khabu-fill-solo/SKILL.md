---
name: khabu-fill-solo
description: Generate Khá Bự fills, interlude solos, and grace-note ornament. Use when editing fill/solo generators, phrasing, grace notes, lead-in runs, or deciding where melody plays vs stays silent.
---

# Khá Bự — fill, solo, nốt láy

Nguồn: `reference/phongcachdemhatkhabu.md` (mục 4–5), `reference/pianoimprovnotes.md` (mục 4). Chốt: `reference/SO-TAY.md`.

## Fill ≠ solo

| | Fill | Solo (giang tấu) |
|---|---|---|
| Chỗ | Đoạn **có lời**, khe ca sĩ nghỉ | Chỉ đoạn **giang tấu** |
| Dài | Ngắn, cuối hợp âm | Cả đoạn, có phrasing |
| Việc | Dẫn sang hợp âm sau | Thay giọng hát |
| File | `fillSoloGenerator/fillGenerator.ts` + `soloGenerator.ts` (`fillPositions`) | `soloGenerator.ts` + `songStructure.ts` |

Không chạy giai điệu đều trên mọi hợp âm. Solo suốt bài = đè giọng hát.

## Câu fill — 3 điều bắt buộc

1. Nằm **cuối** thời lượng hợp âm, không trải đều.
2. Kết **cạnh nốt đích** của hợp âm kế (approach / guide tone).
3. **Thỉnh thoảng** — mật độ `fillDensity`, chỗ tắt `mutedFills`. Có lời thì chêm ở hơi thở (`breaths`), không lời thì đếm đều.

Chuỗi dim7 nối V–I (mục 5 tài liệu): `A7 → Bdim7 → C#dim7 → Dm7` — bass đi bộ, không phải 1 dim lẻ. `suggestDim7ChainFills`.

## Solo — 3 điều phrasing

Từ `pianoimprovnotes.md` mục 4. Bản đầu `generateSolo` sai cả ba:

1. Nghỉ lấy hơi giữa câu. Liên tục = máy.
2. Đổi quãng âm (register) giữa câu.
3. **Kết câu ở 1 / 3 / 5** của hợp âm đang vang. Giữa câu ưu tiên nốt màu (9/11/13); kết câu thì ngược lại.

Hình câu mặc định: `mở → nghỉ → giữa → kết`.

Nguồn nốt (an toàn → màu): chord tone 1-3-5-7-9 → ngũ cung trưởng → ngũ cung thứ → blues (thêm ♭5).

## Nốt láy — `graceNoteOrnamenter.ts`

Công thức: trước nốt chính, 1 nốt rất ngắn **cách 1 bậc trong gam** (không cố định nửa cung — nửa cung sinh nốt ngoài giọng).

3 kiểu: lên / xuống / xen kẽ. Xen kẽ đổi chiều sau **mỗi nốt được láy**, không phải mọi nốt.

Chọn nốt đích và mật độ là quyết định app (tài liệu chỉ cho nguyên lý) — ghi rõ trên UI, đừng giả là công thức Khá Bự.

`graceDensity` tách khỏi `soloDensity` / `fillDensity`.

## Lead-in

`leadIn.ts` `arpeggioRun`: pre-chorus có thể vuốt lên trên sus rồi **tacet** trước chorus. Không bịa pattern mới nếu đã có hàm.

## Kiểm

Sửa generator thì chạy `src/reharm/fillSoloGenerator/__tests__/` + `npx tsc --noEmit`.
