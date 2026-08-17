---
name: khabu-ballad
description: Apply Khá Bự ballad accompaniment density by section (verse sparse, pre driving, chorus arpeggio). Use when editing ballad style cells, patternRenderer cellAt, section density, or other accompaniment styles (bossa/valse/swing).
---

# Khá Bự — đệm ballad

Nguồn: `reference/ballad kha bu.md`, `reference/phongcachdemhatkhabu.md` mục 13–16. Code: `src/reharm/style/styleLibrary/ballad.ts`.

## Ballad không phải 1 groove cell dùng chung

Bossa / valse / swing = 1 cell cố định cả bài. Ballad = **hợp âm khối bám harmonic rhythm + fill chỗ trống**, mật độ đổi theo đoạn.

Không thêm style `ballad-pre` / `ballad-chorus`. Một id `'ballad'`. `getStyle('ballad-pre'|'ballad-chorus')` trả về `BALLAD` (snapshot cũ).

Điệu Thầy Hải (`dieu ballad thay hai.md`) đã bỏ — đừng khôi phục.

## Density theo đoạn

`balladDensityOf` / `balladCellFor`:

| kind | density | Cell |
|---|---|---|
| intro / verse / outro / khác | `verse` | `BALLAD_VERSE` — LH+RH phách 1 và 3, ngân 2 |
| `prechorus` | `pre` | `BALLAD_PRE` — móc đơn |
| `chorus` / `bridge` | `chorus` | `BALLAD_CHORUS` — LH 1-5-8, RH rải |

`patternRenderer.renderPattern` nhận `cellAt?: (beat) => RhythmCell`. `ReharmHome` accompaniment (sau khi có `sheet`) truyền `cellAt` khi `style.id === 'ballad'` và có `sectionChordRanges`.

## Space-filling

Ca sĩ hát → đệm tối giản. Ca sĩ nghỉ / ngân → fill hoặc rải. Fill do skill `khabu-fill-solo`, không nhét vào rhythm cell.

## Style khác

`VERIFIED_STYLES` = 4: BALLAD, BOSSA_NOVA, VALSE, SWING. Điệu chưa `verified` thì không bịa cell.

Schema: `timeSignature` + `feel` — 4/4 ballad / bossa / swing là 3 feel khác nhau.

## Kiểm

`styleLibrary.test.ts`, `patternRenderer.test.ts`, `balladPush.test.ts`, `accompanimentOverPassingChords.test.ts`.
