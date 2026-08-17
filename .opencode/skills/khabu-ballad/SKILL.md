---
name: khabu-ballad
description: Accompaniment styles come from OneMotion (family + variants). Khá Bự is only for rests/fills/passing chords, not groove cells. Use when editing style library, StylePicker, or OneMotion catalog.
---

# Khá Bự — đệm ballad

Nguồn: `reference/ballad kha bu.md` — chỉ còn cho fill / ngắt nghỉ, không còn groove cell.

## Groove = OneMotion

`VERIFIED_STYLES` = catalog OneMotion (`onemotion.ts`). Alias bài cũ: `ballad` → `pop-1`, `bossa-nova` → `bossa-nova-1`, `valse` → `waltz-1`, `swing` → `swing-1`.

Đã xóa `ballad.ts` / `bossaNova.ts` / `valse.ts` / `swing.ts` (pattern Wikipedia + Khá Bự).

## Space-filling

Ca sĩ hát → đệm tối giản. Ca sĩ nghỉ / ngân → fill. Fill do skill `khabu-fill-solo`.

## Kiểm

`styleLibrary.test.ts`, `patternRenderer.test.ts`, `balladPush.test.ts`, `accompanimentOverPassingChords.test.ts`.
