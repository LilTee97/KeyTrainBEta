# Ballad Để em: Cà Pháo, *Để Em Rời Xa*

Ngày 25/9/2026. Claude soạn theo yêu cầu người dùng. **Chờ nghe duyệt.**
Mã: `styleLibrary/caPhaoBalladSongs.ts` (`deEm`, `deEmChorus`). Số đo: `python -B scripts/audit_cp_de_em.py`.

Nguồn: `D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl`, SHA-256
`c4d780b7b37c89b1e7891daca40bc13fbca5ffba8c5600cf25ea04350aaaba4b`, ♩=85.
Mốc đoạn lấy theo `PianoBrain/tools/sheet/corpus.json` (người dùng chốt): phiên 4–19 · điệp 20–27 ·
phiên 2 32–47 · điệp 2 48–55 · điệp nâng tông 56–63.

## Bẫy: vạch nhịp ký âm lệch nhạc đúng một phách

Sheet ghi 4/4, nhưng bass (nốt ≤ D3) rơi ở **offset 1** của ô XML trong **68/70 ô** (ô 1–70).
Pha ấy giữ nguyên cả sau các ô lẻ 10 (2/4), 11 (3/4), 23 (6/4). Tức phách 1 thật = phách 2 ký âm,
và ký hiệu hợp âm cũng lệch theo: ô 6 ghi `C` ở 0 và `Bb` ở 3, trong khi bass thật là Bb1 ở 1, C2 ở 2.75.
Vì vậy mọi phép đo dưới đây làm trên **ô thật k = [ô XML k offset 1, ô XML k+1 offset 1)**.

Hai hệ quả, **chưa sửa**:
- `CA-PHAO-BALLAD.md` ghi Để Em Rời Xa "51/53 ô có LH ở phách 1" và "lưới 0, 1, 3.25, 3.5, 3.75".
  Hai số này đo trên lưới XML, tức đo lệch pha.
- Kho solo `caPhaoFullSolos.json` của bài này đứng trên lưới XML. Ở giang tấu, bass rơi phổ biến
  nhất ở pha 1 (4/14 nốt). Nút mới vì thế **không gắn `cpSoloSong`**.

## Hai tay lúc hát

**Tay phải là giai điệu lời.** Nốt đỉnh hai lượt phiên trùng nhau từng nốt ở ô thật 5↔33, 6↔36,
8↔34, 9↔37. Cú gõ tay phải **không** mang giai điệu (nằm dưới nốt giai điệu đang ngân, hoặc hụt
≥ 9 nửa cung so với cả hai nốt giai điệu kề bên) chỉ có **19/454**, toàn là nốt đơn:

| đoạn | ô | cú tay phải | không phải giai điệu | có bè dưới giai điệu |
|---|---:|---:|---:|---:|
| phiên 1 | 14 | 125 | 4 | 59 |
| điệp 1 | 7 | 59 | 6 | 32 |
| phiên 2 | 16 | 140 | 4 | 76 |
| điệp 2 | 8 | 66 | 4 | 45 |
| điệp nâng tông | 8 | 64 | 1 | 40 |

**Cách hai tay phối hợp:** bè hoà âm tay phải chêm dưới giai điệu ưu tiên chỗ tay trái trống.
Bảng dưới đếm trên 30 ô phiên đủ 4 phách:

| vị trí trong ô thật | 0 | 0.5 | 1 | 1.75 | 2.5 | 2.75 | 3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| tay trái gõ | 30 | 15 | 9 | 12 | 19 | 8 | 29 |
| cú tay phải có bè / cú tay phải | 18/23 | 7/19 | 18/21 | 15/17 | 4/10 | 14/21 | 11/25 |

Tay trái giữ 1 · 3& · 4. Bè tay phải lấp phách 2 và hai nghịch phách 1.75 · 2.75.
Tay trái tự gánh cả bass lẫn nốt hợp âm (cụm ≥ 2 nốt 18/87 cú ở phiên 1).
Bè tay phải **luôn gõ cùng lúc một nốt giai điệu**, không có nhịp riêng: đó là cách chơi bản độc
tấu, không phải một lớp đệm tách được.

## Ô được chọn

| | ô thật | đối chiếu | tay trái | tay phải giữ (đã bỏ nốt đỉnh giai điệu) |
|---|---|---|---|---|
| phiên | 8–9 | 36–37 | Bb2 · F3 · C3@1.75 · G3 G3 G3 / D2 · C3+D3 · A3 · D2@1.75 · D3 D3 A3 | Bb3/F4@1 · E4@1.75 · E4@2.25 · G4@2.75 / C4/F4@1 · C4/F4@3 |
| điệp | 24–25 | 52–53 | (Bb2 F3 Bb3 theo ô 52) · C2 · C3/G3 · C3/G3 / A · A3 · D2@1.75 · D2 · D2 | F4 · F4 · F4/Bb4@1⅓ · E4/C5 · C4 · D4/G4 · E4 · C4 / A4/C#5 · A4 · A4 · E4 · C#5 · C4 |

Mốc tay trái lõi lặp ở lượt kia: phiên {0, 1.75, 2.5, 3, 3.5} có ở ô 6, 8, 36; {0, 1.75, 2.5, 3, 3.25}
có ở ô 9, 37. Điệp {0, .5, 1, 2, 2.5, 3} có ở 5/6 ô Bb→C của hai lượt điệp. Ô 24 và ô 52 trùng hẳn
mốc tay phải ở 2 (E4/C5) · 3 (D4/G4) · 3.25 (E4).

## Chỗ biên soạn (không phải số đo)

- **Bỏ:** nốt đỉnh giai điệu; F4/Bb4 ở 9:3.75 (lấy đà sang hợp âm sau); C4-E4-C4 cuối ô 8
  (giai điệu lấy đà câu sau).
- **Giữ như đệm:** C4 · D4/G4 · E4 · C4 ở 24:2.75–3.5. Chúng thấp hơn giai điệu E5 16 nửa cung,
  nằm ở khe lời, và ô 52 lặp D4/G4 · E4.
- **Điệp nửa đầu lấy tay trái ô 52** (gốc–5–8). Ô 24 là Bb1-Bb2-Bb3 (+24 nửa cung), vượt trần tay trái.
- **C#3 ô 25 (A/C#) đổi thành gốc.** Không ép thể đảo lên mọi vòng, giống Ngày mai em đi ô 36.
- **`leftHandTop` 60** (họ khác 67). Tay trái hai cặp ô cao nhất Bb3 (58). Để 67 thì trên Bb tay trái
  lên Bb3/F4, trùng phím F4 tay phải. *Triệu chứng để lùi:* tay trái nghe đục, cụm hợp âm bị gập
  xuống thấp.
- **`rightHandRegister` {rootFloor 55, low 55, high 74}.** Bè tay phải hai cặp ô nằm Bb3–C#5 (58–73).
  Không khai thì C4/F4 trên Rê thứ lên C5/F5, đè tầm giai điệu. *Triệu chứng để lùi:* bè tay phải
  nghe trầm, dính tay trái.
- Lực đánh dùng mặc định họ CP (bass .85, còn lại .65), **không** lấy `dynamics` của sheet. Sheet cho
  bass ~95 và tay trái khác ~75, tỉ lệ .79, gần .76 của mặc định.
- Hợp âm không có bậc 7 thì bậc 7 lùi về bậc 5 theo cơ chế sẵn có.

## Chưa đo

- Chưa đo phần đoạn solo (dạo · giang · kết) trên ô thật. Kho solo của bài vẫn đang lệch pha.
- Chưa đo điệp nâng tông (56–63) riêng. Ô chọn chỉ lấy từ điệp 1 và 2.
- Ô lẻ 10–11 (5 phách giữa hai bass) chưa rõ là rubato ký âm hay ô lẻ thật của bản phối.
