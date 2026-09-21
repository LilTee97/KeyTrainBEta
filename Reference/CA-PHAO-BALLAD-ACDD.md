# Ballad ACDD: dặm hai tay, xen rải tám tiếng

Ngày 21/9/2026. Bản sửa theo mẫu F#m7b5 người dùng thích; **chờ nghe duyệt bản phối mới**.
Không lấy ô 1–8 làm nền chính. Không sửa Bossa/solo CP đã chốt, không huấn luyện PianoBrain.

## Mẫu Chính Được Chọn

Ảnh phiên khúc có vòng `Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4`, lặp hai lần.
Với cấu hình mỗi hợp âm một ô 4 phách, F#m7b5 ở vị trí 7 và 15 rơi vào cử chỉ
ô 40 trong chu kỳ cũ. Đây là căn cứ chọn mẫu, không phải suy ra tiết tấu chỉ từ tên hợp âm.
Chưa xác minh lại cấu hình bài đang mở trong Chrome; ảnh không thể hiện trường độ hợp âm.

Giữ nguyên cử chỉ ấy làm `ACDD_MAIN`, chuyển bậc theo hợp âm đầu vào. Trên Eb7 của sheet:

| Offset nốt đen | Tay trái | Tay phải |
|---|---|---|
| 0 | Eb2 | G4/Db5 |
| .5 | Eb3, giữ tới 2 | |
| 1 | | Bb3/Db4/G4 |
| 1.5 | | G4/Db5 |
| 2 | Eb3 | G4/Db5 |
| 2.5 | Bb3 | Bb4; bỏ Eb5 melody |
| 2.75 | | G4/Db5/F5, nối tới 3.5 |
| 3 | G3/Db4, giữ tới hết ô | không đánh lại cụm đang ngân |

Giữ onset, trường độ sau nối tie và số nốt của các cụm đã chọn, không rút mọi cụm RH
thành một nốt. Cao độ trong bộ phát là bản chuyển bậc/tầm tay, không clone tuyệt đối
octave của sheet. Danh sách nguồn nằm trong `arrangement.selectedRight[40]` của
[JSON đối chiếu](CA-PHAO-BALLAD-ACDD.json).

Ô 11 cũng có bè G3/Db4 và cụm G4/Db5/F5 nhưng đổi thời điểm hai tay vào trước/sau.
Đó là bằng chứng lặp cách chồng bè 3/7 và màu 9, không phải hai ô có tiết tấu giống hệt.

## Câu Tám Tiếng Xen Kẽ

`ACDD_EIGHT` giữ lưới phối hợp hai tay ở đầu ô 10, **không giữ đường giai điệu**
Db4–F4–Ab4–Db5 của bản dựng bị người dùng bác. Tay phải chuyển thành hình bậc hợp âm
5–3–5–(3+5), trong một quãng tám; trên hợp âm không có bậc 3, dùng luật tìm bậc
của bộ phát hiện tại. Nửa sau về bass và cụm 3/7, không chép câu hát ACDD.

- Tám vị trí tại `0, .25, .5, .75, 1, 1.25, 1.5, 1.75`: bốn tiếng trái rồi bốn tiếng phải.
- Nhấn tiếng **1, 5, 8** theo yêu cầu nghe của người dùng; các tiếng còn lại nhẹ.
  Đây là trọng âm của mẫu biên soạn, không tuyên bố tiếng thứ 8 là phách mạnh mặc định của 4/4.
- Mỗi tiếng trong chuỗi giữ `.27` phách, gối `.02` sang tiếng kế; `releaseRatio=1`.
  Nửa sau có tiếng ngân tới cú kế tiếp và hết ô. Đổi hợp âm/đổi đoạn vẫn cắt đúng biên.
- Tám tiếng này là tám vị trí móc kép trong **hai phách đen đầu**, không phải tám phách đen.
  Toàn ô vẫn 4/4. Sheet có những ô cố ý bỏ một vị trí, ví dụ ô 13 nghỉ tại `.25`.
  Bản xen hiện tại là câu tám tiếng đầy đủ người dùng yêu cầu, không chép nguyên ô 13.

Chu kỳ phiên 8 ô: **dặm, dặm, tám tiếng, dặm, dặm, tám tiếng, dặm, dặm**.
Tỷ lệ 6/2 là lựa chọn phối để mẫu người dùng thích chiếm ưu thế, **không phải tỷ lệ đo được
trong cách đàn CP**. Hai lần F#m7b5 trong vòng ảnh vẫn dùng mẫu dặm. Không thêm nút biến thể.

## Điệp Khúc

Một nút **Ballad ACDD**, 63 BPM, tự chuyển sang chu kỳ 4 ô lấy từ **17–20** khi đến
đoạn được đánh dấu Điệp khúc. Rời điệp mở lại phiên. Không có nhãn đoạn thì chơi mẫu phiên.

- Ô 17: bass thấp/cao đan xen, giữ bè trong ở offset 3, bỏ đường melody nhân octave.
- Ô 18/20: bass vào sớm tại 1.75, RH đáp lệch phách; không biến mọi ô thành tám tiếng đều.
- Điệp không đơn giản là nhiều lần gõ hơn. Ô 9–12 và 17–20 lần lượt có 32 và 29 onset LH.
  Toàn phiên 1/điệp 1 có 42/77 cụm RH, nhưng RH nguồn **gồm cả melody**: không được
  lấy tỷ lệ ấy làm số đo riêng của bè đệm.
- Ô 46/47/49 lặp một phần cử chỉ điệp trước, không lặp toàn bộ. Ô 54/55 vẫn có câu rải.

Các mẫu Có Em Chờ/Ngày mai em đi cũng chỉ hiện một nút chính; biến thể điệp là nội bộ.
ID điệp của bài cũ vẫn dùng được. Không phục hồi các nút chính người dùng đã ẩn.

## Chuyển Đoạn B9sus4

Trước đây nền bị mute theo cấu hình câu chạy chuyển đoạn, kể cả khi `vocal='full'`
khiến câu chạy trả mảng rỗng. Kết quả có thể là cả ô không có tiếng.

Với ACDD, không tạo cửa sổ mute nền chỉ vì có mốc chuyển đoạn. Fill tự sinh chỉ được
giữ nếu nguyên câu vừa khoảng trống của tay chơi; không chuyển RH nền sang LH để nhường fill.
Do đó B9sus4 vẫn có bass/cụm dặm khi câu chạy không phát. Khoảng nghỉ người dùng đặt riêng
ngoài mốc chuyển đoạn vẫn được tôn trọng. CP Lick do người dùng bật là chế độ phối riêng,
không thay đổi trong lần sửa này. Các điệu khác giữ hành vi chuyển đoạn cũ.

## Nguồn Và Kiểm Tra

- Nguồn: `D:/PianoBrain/video/Ca_Phao/Anh Cu Di Di- Ca Phao.mxl`, 69 measure 0–68;
  ô 0 lấy đà; tempo 63. SHA256:
  `a52e7265359638d9d807f91a391b4c87b38f203445c573e49b1c1364b93cdba4`.
- Phạm vi đối chiếu phần hát: 9–32, 38–61. Giữ nguyên ranh giới đã duyệt 33:1.5,
  37:2.5, 62:.75 trong [phiếu phân đoạn](ANH-CU-DI-DI-CP-PHAN-DOAN.md).
- `jointAttacks` ghi cả hai tay; `joinedAttacks` nối tie cùng nốt/voice/staff trong ô,
  loại grace/incoming tie khỏi số lần gõ. Trường độ ký âm không phải độ ngân pedal thực tế.
- Không có ô 9–16 nào lặp nguyên lưới LH ở các ô hát khác. Có lặp cử chỉ đầu ô
  9/11/54, 10/14/55 và cách chồng bè 11/40; không suy từ LH thành toàn bộ tiết tấu hai tay.
- RH ACDD neo gốc từ MIDI 48, tầm 55–84. Ở mẫu phiên mới, bậc 7 dùng bậc có trong
  hợp âm; thiếu thì lùi về bậc 5 theo luật hiện có, không tự biến Gadd2/Cadd2 thành
  hợp âm bảy át. Các màu 7 ghi rõ trong mẫu điệp vẫn giữ fallback riêng từ nguồn.
  Các điệu khác không nhận cấu hình riêng này.

```powershell
python -B scripts/audit_cp_acdd.py --output Reference/CA-PHAO-BALLAD-ACDD.json
npx vitest run src/reharm/style/__tests__/caPhaoBalladSongs.test.ts
```

Kiểm thử đối chiếu onset/trường độ LH và các cụm RH đã chọn với MusicXML; giữ nguyên
cử chỉ ô 40; kiểm 12 giọng, trọng âm 1/5/8, nối tám tiếng, slash/ô ngắn, chuyển điệp giữa
chu kỳ, fill không phá nền, F#m7b5 vị trí 7/15 và B9sus4 vị trí 16 trong vòng ảnh.
Kiểm thử kỹ thuật không thay thế nghe duyệt mức độ giống CP hoặc độ thoải mái khi hát.
