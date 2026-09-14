# CP Lick — vốn câu và bộ chêm câu Cà Pháo

Triển khai 13/9/2026; **người dùng duyệt CP Lick và CP Run ngày 14/9/2026**:
“bộ soạn CP Lick và CP Run đã ổn”. Quy trình chính thức được chốt ở
[MD Cà Pháo](CA-PHAO.md), mục “CP Lick và CP Run”,
và phần cuối [Sổ tay](SO-TAY.md). Giữ nguyên bộ soạn, chỉ sửa theo phản hồi cụ thể.
CP Lick bật fill/run bằng ô tick riêng, độc lập với dạo/giang/kết.
Yêu cầu tiếp theo ngày 13/9 đã mở lại solo thứ Bossa CP; xem
[hồ sơ Cà Pháo](CA-PHAO.md). Việc duyệt CP Lick/Run không tự duyệt solo mới.
**Cập nhật theo cho phép mới của người dùng:** được thay tiếng đệm tại câu fill/run/nối,
nhưng phải theo cách phối trong sheet Cà Pháo. Khung 11 tiếng trong [MD Cà Pháo](CA-PHAO.md)
giữ nguyên **ngoài cửa câu chêm**. Giới hạn “không sửa bất kỳ tiếng đệm nào” của bản nháp đầu đã bỏ.

## 1. Phạm vi thực sự đã đọc

Đo timeline MusicXML/MXL của toàn bộ **9 bài Cà Pháo đang hoạt động** trong
`D:/PianoBrain/tools/sheet/corpus.json`. Không đồng nghĩa đã học xong mọi file Cà Pháo:
hai bài còn thiếu xác nhận giọng/cửa lời, bốn bài đang để sau hoặc đã bỏ.
File gốc không bị sửa. SHA-256, tên nguồn và số đo được lưu trong `cpPhrases.json`.

| Sheet | Điệu | Giọng dùng để chuyển nốt | Số ô trong file | Mảnh câu xuất dùng |
|---|---|---|---:|---:|
| Hồng Kông 1 | Ballad | C trưởng | 108 | 104 |
| Người hãy quên em đi | Bossa nova | D thứ; không lấy outro chuyển D trưởng | 101 | 103 |
| Có Em Chờ | Ballad | Eb trưởng; E trưởng từ ô 56 | 73 | 98 |
| Ngày mai em đi | Ballad | Eb trưởng, theo xác nhận, không tin riêng bộ dấu hóa | 92 | 91 |
| Kém duyên | Ballad | Chưa chốt | 79 | 0 |
| Yêu xa | Ballad | Chưa chốt mốc chuyển giọng | 112 | 0 |
| Để Em Rời Xa | Ballad | D thứ; Eb thứ từ ô 56 | 74 | 91 |
| Chưa Bao Giờ | Ballad | F thứ | 81 | 115 |
| Chúng Ta Không Thuộc Về Nhau | Ballad | A thứ | 77 | 95 |

**697 mảnh câu ngắn** từ 7 bài đủ điều kiện, không phải 697 câu fill nguyên bản khác nhau.
Có cửa sổ chồng lấn của cùng một câu nguồn. Ballad trưởng: 192 fill / 101 run;
ballad thứ: 192 / 109; bossa thứ: 63 / 40. Chưa có kho bossa trưởng độc lập.
Khi thay đệm, chỉ chọn mảnh `supportComplete`: có toàn bộ hai tay trong cửa nguồn,
không nốt ngân vượt cửa hoặc grace chưa có thời lượng. Các mảnh còn lại chỉ để phân tích,
không đủ điều kiện thay cả hai tay. Số ứng viên hợp lệ còn phụ thuộc giọng/hợp âm/tầm tay.
Không gán nhãn “bossa trưởng học từ sheet” cho câu bossa thứ được KT soạn lại sang trưởng.
Ở mốc duyệt 14/9, có **294/697 mảnh `supportComplete`** trước lọc điệu/giọng/tầm.

Các nguồn bổ sung đã đối chiếu:

- `D:/PianoBrain/ingest/phieu-bo-sung-ca-phao-3-bai-cu-2026-09-11.md`.
- `D:/PianoBrain/ingest/phieu-chia-doan-ca-phao-3-bai-moi.md`.
- `D:/PianoBrain/ingest/phieu-cua-loi-yeu-xa-kem-duyen.md` — còn chỗ trống, không coi là đã xác nhận.

Sai lệch nguồn cần lưu ý: manifest ghi Người hãy quên em đi 104 ô/outro 96–104,
nhưng file `nguoihayquenemdi.mxl` hiện có 101 ô. Không tự bịa ô 102–104.

## 2. Kỹ thuật lặp lại và mức bằng chứng

Đếm trên **ô có attack tay phải**, mỗi kỹ thuật tối đa một lần/ô; nốt nối không đếm lại.
Mẫu số dưới đây bao gồm cả phần hát nên đây là dấu hiệu trong bản phối,
**không phải tỷ lệ các câu fill**, và chưa đủ chứng minh nét độc quyền của Cà Pháo.
Không có nhóm đối chứng các thầy khác để kết luận “chỉ anh ấy dùng”.

| Sheet | Ô RH | Đánh lệch phách | Chùm nhiều nốt | Quãng rải 3–7 bán âm | Nối nửa cung | Chuyển quãng ≥ octave | Chia nhỏ hơn móc đơn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hồng Kông 1 | 107 | 104 | 78 | 48 | 32 | 15 | 40 |
| Người hãy quên em đi | 101 | 100 | 87 | 22 | 69 | 8 | 30 |
| Có Em Chờ | 72 | 71 | 70 | 56 | 31 | 36 | 71 |
| Ngày mai em đi | 91 | 89 | 87 | 37 | 42 | 28 | 68 |
| Kém duyên | 78 | 70 | 65 | 31 | 8 | 10 | 4 |
| Yêu xa | 110 | 109 | 103 | 63 | 49 | 62 | 76 |
| Để Em Rời Xa | 73 | 73 | 73 | 50 | 51 | 29 | 71 |
| Chưa Bao Giờ | 80 | 76 | 73 | 46 | 33 | 45 | 72 |
| Chúng Ta Không Thuộc Về Nhau | 77 | 77 | 77 | 50 | 15 | 34 | 66 |

Định nghĩa đo: lệch phách = onset không nguyên phách; chia nhỏ = onset không thuộc
lưới nửa phách (gồm móc kép/chùm ba); quãng rải = ít nhất hai bước quãng 3–7 bán âm
giữa đỉnh hai chùm liên tiếp. Nối nửa cung có thể vẫn là nốt trong gam, không tự gọi
mọi nửa cung là chromatic. Quãng rải không chứng minh arpeggio của hợp âm nếu chưa đọc bass.

Khung thực hành rút ra:

- **Vốn chung:** câu ngắn có khoảng thở; xen một nốt với chùm hợp âm; chuyển vị trí
  bàn tay theo hình quãng; vào lệch phách. Chọn hình có bằng chứng trong đúng điệu,
  không ép mọi câu phải có đủ tất cả thủ pháp.
- **Bossa:** ưu tiên cell ngắn và nhịp lệch, đường nối nửa cung. Một nguồn bossa hiện
  có ít chuyển octave hơn nhóm ballad; không lấy run ballad dày lấp đầy các tiếng chát.
- **Ballad:** vốn chuyển register, hợp âm rải/chùm và chia nhỏ phong phú hơn trong
  nhiều sheet. Chỉ dùng chỗ có khoảng đàn, không suy mọi chuỗi nốt dày là fill.
- **Kỹ thuật ít/khó xác nhận:** grace, glissando, pedal, nhấn–nhả thật, chuỗi hợp âm
  thay thế kiểu dim/át biến âm chưa thành luật tự động CP Lick. Ví dụ Bossa có 53
  nốt grace ký âm nhưng không được bịa trường độ cho nốt không có duration.

Ví dụ cửa đàn **đã được người dùng xác nhận**, không phải máy đoán:

- Để Em Rời Xa ô 32: C5–G4–F4–E4 đầu ô là đàn, lời D4 trở lại phách 2.
  Dùng được hình ngắn đi xuống trước cửa lời, không lấy cả ô làm fill.
- Chưa Bao Giờ ô 22: các nhóm hợp âm đi lên/rồi xuống là fill. Hai nhóm đầu
  Ab3–C4–Eb4 → F4–Ab4–C5 cách nhau ¼ phách; đoạn kế nhấc nguyên hợp âm lên octave.
  Đây là chùm hợp âm nhiều nốt, không phải chạy tuần tự từng nốt trong chùm.
- Chúng Ta Không Thuộc Về Nhau ô 32: lời kết ở phách 2; D4 → B3 → C4/G4
  từ phách 3 là câu nối. Cửa trước lời trở lại phải giữ đúng, không gom lời vào kho.
- Chưa Bao Giờ ô 50–51, 75–76; Để Em Rời Xa ô 40 và 59: có cửa fill được ghi
  trong phiếu cũ. Chỉ mảnh nào đủ gate, đủ tầm, không chồng voice mới xuất dùng;
  một đoạn đã xác nhận không có nghĩa mọi nốt của đoạn đều phù hợp runtime này.

## 3. Bộ khung soạn và đặt câu CP Lick

1. **Chọn nguồn đúng điệu.** Dùng họ điệu hiện có của KT. Chưa có nguồn đúng họ →
   báo thiếu và không sinh; không âm thầm dùng Licky hoặc lấy ballad thế bossa.
2. **Chọn trưởng/thứ.** Ưu tiên kho cùng mode; nếu cùng điệu chỉ có mode kia, giữ
   hình nhịp rồi soạn lại cao độ theo giọng đích. Không chuyển toàn bài chỉ dựa dấu hóa.
3. **Tìm chỗ đặt.** Ưu tiên cuối dòng lời, mốc chuyển đoạn; tránh hợp âm còn lời.
   Không có lời thì dùng cuối mỗi nhóm 4 hợp âm chính làm gợi ý, cách ít nhất hai ô.
   Đây là **heuristic KT**, không phải máy đã biết chính xác ca sĩ nghỉ ở phách nào.
   Chuột phải yêu cầu thủ công có thể vượt nhãn lời ước lượng, nhưng không vượt kiểm khe đệm.
4. **Chọn câu vừa cửa.** Mỗi mảnh 2/3/4/6/8 attack, dài tối đa 2 phách; giữ toàn bộ
   onset tương đối, khoảng nghỉ, gate từng nốt. Dời cả câu vào hai phách cuối hợp âm,
   không nén nhanh run để nhét. Giữ cả vị trí trong ô nhịp nguồn (ví dụ phách 4 không
   dời sang phách 3) và số phách mỗi ô. Run là ít nhất 4 attack đơn nốt ở tay chạy,
   không phải chùm hợp âm; tay còn lại có thể đánh hợp âm đỡ theo sheet.
5. **Soạn cao độ.** Có thể chuyển nguyên câu nếu nốt phù hợp gam/hợp âm. Nếu không,
   chọn nốt gần hình gốc: phách nguyên bám hợp âm, phách lẻ theo gam và màu hợp âm;
   cuối câu ưu tiên nốt chung với hợp âm tiếp, nếu không có thì nốt hợp âm hiện tại.
   E7 trong Am vẫn có G#, không ép thành Em. Nốt chromatic chỉ giữ vai trò approach
   ngắn, yếu, đi nửa cung tới nốt hợp lệ tiếp theo; không để treo nốt ngoài gam tùy tiện.
6. **Tầm tay.** RH C4–C6, LH C2–C4; dời nguyên cử chỉ theo octave, không gấp riêng
   đỉnh câu xuống thấp. Nếu không vừa tầm hoặc nhiều nốt bị dồn vào cùng phím thì bỏ mẫu.
7. **Phối hai tay theo nguồn — quy tắc mới đã được cho phép.** Trong cửa câu chêm,
   thay đệm bằng cả tay câu chính và tay hỗ trợ đo từ sheet; nguồn nghỉ tay nào thì
   giữ đúng khoảng nghỉ tay ấy. Tiếng đệm đang ngân từ trước được nhả ở đầu cửa.
   Không tự thêm/bớt bass để “nghe cho hay” nếu không có cử chỉ nguồn tương ứng.
   Nếu nốt đệm sẽ ngân vượt cuối cửa thì tìm mẫu/cửa khác; không làm mất phần ngân
   bên ngoài hoặc bịa cú gõ lại ở điểm ra. Giữ mọi event không giao cửa; tổng phách
   không đổi. Hai tay không được chồng cùng phím MIDI. Run không đủ dữ liệu đúng
   nhịp thì báo chưa chèn; tự chọn cuối đoạn có thể lùi về fill ngắn.
8. **Mỗi lượt phát.** Xoay thứ tự mảnh nguồn và chuyển/soạn nốt theo take; cố định cùng
   đầu vào/take thì tái tạo được. Không hứa mọi lượt đều khác nếu chỉ một mẫu vừa khe.

Âm lượng fill hiện là 52, cuối câu 58: **biên soạn KT**, chưa phải động lực học đo từ audio.
Không dùng bộ cắt đệm chung của Licky khi CP bật: cửa thay đệm và cả hai tay đi cùng
một kế hoạch CP, cùng take. Solo dài Bossa thứ đi theo bộ soạn riêng. Lặp đoạn trong một lượt giữ
cùng kế hoạch hai tay; phát lượt mới mới xoay lựa chọn, không ghép fill take khác vào cửa cắt cũ.
Không đưa ra bảo đảm “không chèn lên giọng hát” khi chưa có timestamp lời chính xác.

## 4. Giao diện và cách nghe thử

- Ô **CP Lick** ở khung “Câu fill và đoạn giang tấu”, mặc định tắt; lưu theo bản nhạc.
- Bật: CP thay bộ fill/run, ưu tiên hơn Licky/Linh/Kingsley; các bộ solo dài khác
  không bị thay. Menu đổi thành **CP Lick / CP Run**, không thêm nút nới nghỉ sau fill.
- Tắt: trở về bộ cũ. Riêng Bossa CP cải tiến tắt câu chêm, không tắt solo thứ đã mở lại.
- Trạng thái cho biết số chỗ chèn được, thiếu nguồn/giọng hoặc chưa có cell hai tay khớp nhịp.
- So sánh cùng vòng hợp âm, BPM và các lựa chọn khác: nghe CP tắt/bật, qua ranh giới
  hai ô và vòng lặp. Kiểm mã không thay thế duyệt âm nhạc bằng tai.

## 5. Tái tạo và kiểm hồi quy

Mã chính: `src/reharm/licky/cpLick.ts`; dữ liệu `cpPhrases.json`; bộ đo
`tools/cp_lick_corpus.py`. Tái dùng parser MusicXML hiện có trong PianoBrain, không thêm thư viện.

```powershell
python -X utf8 tools/cp_lick_corpus.py --check
npm test -- cpLick bossaRhythmOnly caPhaoBossa timelineLoop songSnapshot songSheetView playbackRenderCost
npm run build
```

`PIANOBRAIN_ROOT` tùy chọn thay đường dẫn nguồn, mặc định `D:/PianoBrain`.
Chỉ chạy `python -X utf8 tools/cp_lick_corpus.py --write` khi chủ động cập nhật
nguồn đã xác nhận; không tái xuất đè corpus đã duyệt chỉ vì sang phiên làm việc mới.
`--check` kiểm tie/chùm/gate/chuyển giọng và tái sinh phải trùng hoàn toàn dữ liệu đã lưu.
Xuất dữ liệu chỉ nội thất dạo/giang/kết hoặc cửa đàn đã xác nhận; bỏ ô ranh giới
chưa chắc, tie ngân vượt cửa, grace không trường độ, overlapping voice và giọng chưa chốt.
Giới hạn 32 hình khác nhau cho từng bài/mode/tay/loại, ưu tiên cửa đủ cả hai tay,
sau đó cửa fill đã xác nhận. Dữ liệu v2 có `support`, `supportComplete`, `meter`;
không gộp hai mẫu cùng tay chạy nhưng khác tay hỗ trợ thành một mẫu.

Test Bossa qua 12 giọng × 2 mode × 6 take, có lặp đoạn; mọi event đệm ngoài cửa
giữ nguyên, chỉ cửa có mẫu hai tay được thay. Snapshot khung 11 tiếng cũ không đổi.
Test thêm giữ gate/onset cả hai tay, màu E7/Am, không trùng phím, chỗ lời/nghỉ, menu và lưu bản nhạc.
Chưa triển khai bộ nhận diện cửa hát bằng audio; chưa học “tất cả sheet” ngoài phạm vi bảng trên.
Những xác nhận còn thiếu tập trung ở [Phiếu hỏi CP Lick](PHIEU-HOI-CP-LICK-2026-09-13.md).

Kiểm lịch sử tại mốc triển khai 13/9: 62/62 test liên quan đạt; TypeScript và production build đạt.
Toàn suite: 2.602 đạt, 6 lỗi tại các kiểm cũ `phraseAcrossBar`, `daoTruongLinhNhi`,
`handSplitAudit`, `sietHopAm`, `tuyenSolo` (2). Không nới kỳ vọng các kiểm cũ.
ESLint các file sửa: không lỗi, còn 10 cảnh báo hook/fast-refresh hiện có.
Đã thử ô tick, menu CP Run, trạng thái chèn và tắt về chỉ đệm trong tab riêng;
đó là kiểm giao diện của agent, không phải thẩm âm trên đàn/MIDI thật.
Ngày 14/9 người dùng đã duyệt bộ CP Lick/Run; không còn chờ duyệt bộ hiện tại.
Các câu hỏi nguồn chưa được trả lời vẫn giữ nguyên, không tự điền theo lời duyệt chung.

### Bảo toàn đường phát sau khi duyệt

Giữ commit `2a45131`: không gọi `soloTake(0)`/`fills(0)` trực tiếp trong JSX để
đếm nốt mỗi lần con trỏ cập nhật; dùng memo và giữ tham chiếu tầm solo ổn định
cả khi bật Trần 84. Như vậy vẫn soạn lượt mới khi phát, nhưng không soạn liên tục
trong từng nhịp chỉ để hiển thị. Đo ở phiên kiểm thử bài 52 hợp âm, 110 BPM, CP bật:
trước sửa có gửi nốt trễ; sau sửa chạy hết 769 lượt phát tiếng không có lượt gửi
trễ. Đây là số đo một ca kiểm thử, không bảo đảm mọi máy đều không thể giật.
70 kiểm liên quan và build đã qua ở lượt sửa đó; không sửa note/onset/gate/BPM
hay snapshot âm nhạc để chữa lỗi tính toán.
