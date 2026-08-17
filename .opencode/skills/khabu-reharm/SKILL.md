---
name: khabu-reharm
description: Apply Khá Bự reharmonization rules (voice leading, colors, slash/upper-structure, dim7 passing, secondary ii-V, turnaround). Use when editing reharm pipeline, chord colors, passing chords, slash voicings, palettes, or turnarounds.
---

# Khá Bự — tái hòa âm

Nguồn: `reference/phongcachdemhatkhabu.md`. Quyết định đã chốt: `reference/SO-TAY.md`. Việc cố ý chưa làm: `reference/DE-DANH-SAU.md`.

Ưu tiên xung đột: **đúng phong cách anh Khá** → nhạc lý → tiện code.

## Pipeline (đừng đảo thứ tự)

`src/reharm/reharmEngine/reharmPipeline.ts`: đọc hợp âm → dò giọng → phân tích bậc → tô màu theo bậc → gợi ý hợp âm lướt → voice lead.

Tô màu mù chức năng (`maj → add9` cho mọi bậc) sẽ biến bậc năm thành `add9` và **mất nốt bậc bảy**. Mọi bậc năm trong tài liệu đều giữ bậc bảy (`D9sus4`, `C7`, `E7b9`).

## 5 kỹ thuật → file

1. **Voicing / màu** — `staticVoicingRules.ts`
   - Không triad trơn. Chủ âm: `add2` (id vẫn `add9`, symbol `add2`), `maj7`, `6`. Không `sus4` làm màu tĩnh chủ âm.
   - Bậc năm: giữ bậc bảy. Pop ballad mặc định `9sus4` + `susDominant`. `sus4` chỉ ở bậc năm hoặc chuỗi giải (`Esus4 → E`).
   - `PALETTE_BY_TONIC_COLOR` kéo cả bài khi đổi màu chủ âm. Màu ngoài tài liệu phải có `source: 'jazz'`.
2. **Slash / upper-structure** — `findUpperStructures`, `toSlashChord`
   - Phần chồng trên bass ưu tiên **bậc bảy** của hợp âm gốc (`Am11 = G/A`). Không được thì lùi bậc năm.
3. **Dim7 lướt** — `passingChordRules.ts` `suggestDim7Passing`
   - Dim7 xây trên nốt **cách hợp âm đích nửa cung**, không phải "nốt giữa hai gốc".
4. **2-5-1 lướt** — `suggestSecondaryIiV`
   - Suy từ hợp âm đích, không cần giọng bài: đích thứ → iiø–V7b9–i; đích trưởng → ii7–V7–I.
5. **Đổi màu mỗi lượt lặp**
   - **Cấp câu (đã làm, hiện trên lời):** `varyOnRepeat` (mặc định bật) + `sectionRanges` vào `reharmonize` → `varyRepeatEndings` (`turnaround.ts`) đổi hợp âm cuối lượt 2+ của verse/chorus/prechorus thành bậc năm của chỗ sắp vào (`pullChordFor`). Phiên khúc 2 ghi `E7b9` trên lời, không chỉ lúc phát.
   - Cùng một đoạn chơi lại lần nữa (cùng `source` trong thứ tự chơi): `arrangement.ts` `repeatEnding` / `buildRepeatEnding` vẫn đổi lúc phát.
   - Cần bài đã chia đoạn. Vòng trơn không có đoạn → không đổi. Đoạn cuối bài không đổi.
   - **Cấp ô nhịp** (`C → CM7 → C6 → CM7`) chưa làm — xem `DE-DANH-SAU.md`. Đừng tự thêm.

Turnaround: `src/reharm/style/turnaround.ts` (vd `Dm7 → G9sus4 → C`).

## Voice leading

`voiceLeadingOptimizer.ts`: chọn đảo sao khoảng cách nốt ngắn nhất. Mọi kỹ thuật trên chỉ là cách đạt điều này.

## Kiểm

Sửa luật hòa âm thì chạy test của đúng file đó + `npx tsc --noEmit`. Đọc `SO-TAY.md` trước khi "sửa cho đối xứng".
