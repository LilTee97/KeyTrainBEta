---
name: train-teacher-solo
description: Train KeyTrain solo generator to clone a teacher's intro/interlude/outro from PianoBrain sheet-solos (rhythm + melody). Use when the user says train solo, clone teacher phrases, mô phỏng câu dạo/giang/kết, or load sheet-solos into generateSolo. Works in OpenCode and Claude.
---

# Train teacher solo from sheets

**Solo = đúng 3 loại, không hơn:** `intro` (dạo) · `interlude` (giang tấu) · `outro` (kết).

**Một lần train = một thầy + một điệu** (`ballad`, `bolero`, `bossa nova`, `slow rock`…). Cà Pháo ballad ≠ Cà Pháo bossa. Không trộn cell/hợp âm/mật độ giữa hai điệu của cùng thầy. Thể loại lấy từ `genre` trong ledger / corpus (người dùng đã xác nhận). User không nói điệu thì **hỏi**, đừng đoán.

Ledger chỉ lưu ba `section` đó. Phiên / điệp / tiền điệp = hát (RH = giọng ca) — **không** train từ sổ này. Fill Licky ≠ solo.

PianoBrain stores phrases. KeyTrain plays them. Do not mix teachers.

## Tone chủ — bắt buộc mỗi lần train

Sheet thầy có giọng riêng. Bài đang mở có giọng khác. **Không dán hợp âm/MIDI tuyệt đối.**

Ví dụ: Đừng Xa = **Dm**. Để nhớ một thời ta đã yêu = **Am**.

1. Đo sheet theo **bậc** (`i iv V7 bVI…`) và **quãng so với tonic sheet** (`midi - tonic_sheet`).
2. Dựng lại trên **tonic bài đang mở**: `chordAtDegree(tonic_bài, scale, bậc)`.
3. Nốt: `pc_bài = (pc_sheet - tonic_sheet + tonic_bài) % 12`.
4. Kiểm: Đừng Xa `i = Dm` → bài Am thì ô 1 dạo = **Am**, không phải Dm. Bài G thì `i = Gm`.

Sai điển hình: copy `Dm Am A7` từ sheet sang bài Am (nghe như vẫn ở giọng Đừng Xa).

## Bài mặc định mỗi lần train

**Để nhớ một thời ta đã yêu** — user đã chia phiên / điệp và lưu trong KeyTrain.

Mỗi lần train:

1. Mở bài đó (thư viện KeyTrain / snapshot), **không** đổi thứ tự phiên–điệp.
2. **Tự chèn vào Thứ tự chơi** nếu chưa có (đừng xóa bước hát):
   - `intro` — đầu bài (`ArrangementEditor` + Dạo đầu)
   - `interlude` — sau điệp, `over` = đoạn điệp, `loops: 2`
   - `outro` — cuối bài
   Đã có bước đó thì giữ, không nhân đôi.
3. Chỉ dạy **dạo / giang / kết** từ `sheet-solos` của **một** thầy.
4. Bài không có trong `corpus.json` thì **đừng** bịa file `.mxl`. Dùng bài đã lưu ở app.

## Ledger (PianoBrain)

Path: `D:\PianoBrain\data\sheet-solos\` (not `knowledge/` — KeyTrain brain does not auto-load these).

```
python D:\PianoBrain\tools\sheet\luu_solo.py          # save from corpus
python D:\PianoBrain\tools\sheet\luu_solo.py lietke
python D:\PianoBrain\tools\sheet\luu_solo.py xoa <id>
python D:\PianoBrain\tools\sheet\luu_solo.py xoa-thay <teacher>
python D:\PianoBrain\tools\sheet\luu_solo.py xoa-het
```

`clone_do.py` also saves after measuring a song.

Each JSON: `teacher`, `section` (intro|interlude|outro), `bars`, `notes[]` of `{h, midi, at, dur}`. `h`: 1 = right, 2 = left. `at` = beats from section start.

## When training KeyTrain

1. `lietke` — pick **one teacher + one genre**. Filter JSON by `teacher` and `genre`. Never copy Ca Pháo ballad into Ca Pháo bossa, or into Tôn Hùng.
2. Read that teacher's JSON. Per section, measure:
   - LH onsets per bar (groove)
   - RH density (notes/beat), land tone (last note vs chord)
   - Interval shapes (like Licky: subtract first midi)
3. Patch **existing** KeyTrain paths — do not add a second generator:
   - Chords: `src/reharm/style/teacherSoloChords.ts`
   - LH cell: `src/reharm/style/styleLibrary/tonHungStyles.ts` or teacher style file
   - RH density / lick: `src/reharm/fillSoloGenerator/soloGenerator.ts`, `soloTeacher.ts`
   - Intro motif: `src/reharm/style/chiecLaMotif.ts` pattern
4. Sung sections: RH = vocal (user rule). Only train intro / interlude / outro from this ledger.
5. Two songs, two interlude jobs → two buttons, not one averaged cell.
6. Verify: `npx vitest run` on teacher/solo tests. Do not commit unless asked.
7. **Một vòng rồi dừng.** User nghe xong. Nếu họ nói **chưa được** / sai / chưa giống:
   - So sheet-solos (đúng thầy + đúng điệu) với thứ app vừa phát, **tách 3 mặt** — đừng gộp một câu “nghe lệch”:
     1. **Tiết tấu** — LH mốc gõ, mật độ, phách 1, show vs cầu
     2. **Vòng hợp âm** — dạo/giang/kết có copy hát không, passing, nâng tone
     3. **Chọn nốt / giai điệu** — đáp cuối ô, rải vs pent, chùm có nốt lời, RH = giọng lúc hát
   - Ghi ô / chỗ lệch, hỏi user mặt nào ưu tiên. **Chờ trả lời.** Không tự sửa vòng 2 cho đến khi họ nói chạy tiếp.

## Do not

- Put sheet-solos JSON into `knowledge/` (bloats the brain plugin).
- Train fills/Licky from these files unless the user says so.
- Invent pentatonic runs when the sheet is chord-tone / arpeggio.
