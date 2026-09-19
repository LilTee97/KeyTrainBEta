# CP solo full — bản triển khai chờ nghe duyệt, 14/09/2026

Không thay thế các câu solo thường hoặc khung đệm Bossa CP cải tiến đã duyệt.
Chưa ghi chế độ full là đã duyệt bằng tai trong Sổ tay / MD Cà Pháo.

## Cách dùng

- Tick **Câu solo Cà Pháo full** ở khung Câu fill và đoạn giang tấu; KT chọn thầy Cà Pháo.
- Chọn **Nguồn solo full** theo bài, hoặc ưu tiên đoạn dài nhất trong đúng họ điệu và trưởng/thứ.
- Chọn tầm đàn 37 / 49 / 61 / 76 / 88 phím, hoặc nhập hai đầu MIDI. Mặc định 61 phím C2–C7, không phải 88 phím.
- Mỗi lần bấm phát phát triển nốt mới trên cùng cấu trúc nguồn. Đổi nguồn bằng ô chọn, không ngẫu nhiên đổi độ dài giữa lúc phát hoặc giữa hai lượt giang.
- Bỏ tick trả về đường soạn solo hiện có. Tùy chọn full, nguồn và tầm phím được lưu trong snapshot bài.

## Dữ liệu đo lại

Đọc đủ 9 sheet đang hoạt động trong corpus Cà Pháo từ MusicXML/MXL gốc. Chỉ xuất
21 đoạn dạo/giang/kết của 7 sheet đã xác nhận giọng; Kém duyên và Yêu xa đã đo
nhưng vẫn chờ xác nhận giọng, không tự gán trưởng/thứ rồi đưa vào phát.
Không lấy đoạn hát làm solo. Không bật lại các sheet đang bị loại/hoãn trong corpus.

| Sheet | Họ điệu / màu nguồn | Dạo (ô / phách) | Giang (ô / phách) | Kết (ô / phách) |
| --- | --- | --- | --- | --- |
| Hồng Kông 1 | Ballad, C trưởng | 1–15 / 60 | 47–65 / 76 | 100–107 / 16 |
| Người hãy quên em đi | Bossa, D thứ | 1–8 / 32 | 41–48 / 32 | 96–101 / 24 |
| Có Em Chờ | Ballad, Eb trưởng; kết E trưởng | 1–8 / 32 | 48–55 / 32 | 66–72 / 28 |
| Ngày mai em đi | Ballad, Eb trưởng | 1–18 / 72 | 51–54 / 16 | 87–91 / 20 |
| Để Em Rời Xa | Ballad, D thứ; kết Eb thứ | 0–3 / 16 | 28–31 / 16 | 64–73 / 39 |
| Chưa Bao Giờ | Ballad, F thứ | 0–8 / 35 | 35–43 / 36 | 79–80 / 8 |
| Chúng Ta Không Thuộc Về Nhau | Ballad, A thứ | 1–8 / 32 | 33–48 / 64 | 65–77 / 52 |

Độ dài là độ dài thực trong XML, gồm ô lấy đà/ô đổi nhịp. Ví dụ kết Hồng Kông 1
có ô 2/4, không nhân mọi ô với 4. Giang Người hãy quên **vẫn là 8 ô như KT cũ**;
khác biệt là bản full giữ đủ nội dung hai tay ô 41–48 thay vì chỉ phát triển phần
cuối: cụm hợp âm, nốt ngân nối, đối đáp, chùm ba, chạy bán cung, nốt láy.

Ledger sheet-solos cũ không phải dữ liệu phát trực tiếp: ranh giới kết Bossa cũ
vượt quá số ô thực và một số cụm/nốt nối không còn đúng. Export mới có SHA256 nguồn,
số ô, độ dài từng ô, nốt tương đối với chủ âm, gate từng nốt, tay, grace, arpeggiate,
articulation, hòa âm và ghi chú kỹ thuật để đối chiếu.

## Đường soạn và các giới hạn có chủ ý

`buildPhraseSection` → nhánh full trong `caPhaoSolo.ts` → bộ ghép arrangement và
bộ phát sẵn có. Không có audio engine mới. Phần đệm hát và CP Lick/Run không đổi.

1. Lọc nguồn đúng Cà Pháo + họ điệu + trưởng/thứ + loại đoạn. Hiện chưa có nguồn
   Bossa full trưởng được xác nhận: báo thiếu nguồn, không tráo Ballad trưởng vào Bossa.
2. Chuyển nốt/hợp âm bằng quãng so với chủ âm sheet sang chủ âm bài. Chuyển giọng
   trong nguồn Có Em Chờ / Để Em Rời Xa dùng chủ âm của chính đoạn kết.
3. Ngoại lệ được ghi rõ: hai ô cuối Bossa gốc về D trưởng; bản full dành cho bài
   thứ hạ các bậc 3/6/7 về thứ. Nhãn F#aug/Eb ô 42 mâu thuẫn với nốt thực, nên mô tả
   hòa âm đo được là Eb9 → A7; không đổi các nốt thực của cụm đó.
4. Lượt 0 là câu nền. Lượt sau thay các nốt giai điệu đơn có thể phát triển bằng
   vốn pitch class từ những đoạn đầy đủ **cùng họ điệu và cùng trưởng/thứ**; kiểm
   theo gam + hợp âm đang vang, loại bậc ba đối nghịch với tính chất hợp âm.
   Giữ hướng nét nhạc, cụm hợp âm, ô kết, grace và cặp bán cung dẫn–giải quyết.
   Không ép mọi nốt chromatic của sheet vào gam tự nhiên, vì như vậy mất kỹ thuật nguồn.
   Đây là phát triển nốt trên câu full, không tuyên bố mỗi lượt là sáng tác mới hoàn toàn;
   vốn hữu hạn có thể lặp về sau.
5. Giữ onset, gate, khoảng nghỉ, chùm nốt và số ô khi đổi lượt. Tie đã gộp thành
   nốt ngân; nốt ngân từ trước ranh giới đoạn được đánh lại một lần ở đầu đoạn.
   Grace mượn tối đa 1/16 phách mỗi nốt và tối đa 1/4 gate chính; arpeggio rải tối đa
   0,035 phách mỗi nốt. Đây là cách diễn tấu của KT, không phải thời gian đo từ audio.
6. Đặt cả câu vào tầm đàn bằng chuyển quãng tám trước. Nếu không vừa, chuyển cả
   tuyến tay/cụm theo chỗ nghỉ và vạch nhịp thực (kể cả 2/4 hoặc ô lấy đà), không xóa
   nốt cho vừa. Có thể phải đổi quãng giữa cụm trên đàn nhỏ; UI báo số chỗ thích nghi.
   Một thế hợp âm rộng hơn tầm cho phép thì báo không thể dựng đầy đủ, không phát bản
   thiếu nốt. Tầm tùy chỉnh phải hợp lệ MIDI 0–127 và rộng ít nhất hai quãng tám.
7. Trong solo full giữ nhãn tay của sheet, không phân lại mọi nốt trên C4 sang tay
   phải. Phần hát vẫn dùng cách phân tay cũ. Hai lượt giang dùng cùng nguồn và độ dài
   để tránh bộ ghép cắt hoặc kéo câu lượt thứ hai.

## Kiểm chứng

- `python -X utf8 tools/cp_full_solos.py --check`: tái sinh đúng 21 đoạn, 9 sheet được đo.
- `python -X utf8 tools/cp_lick_corpus.py --check`: kho CP Lick 697 câu không đổi.
- Nhóm kiểm thử full/Bossa/CP Lick/render-cost/persistence/arrangement: **63/63 qua**.
- Production build và TypeScript qua; ESLint các file liên quan không có lỗi,
  còn 8 cảnh báo hook cũ. Build còn cảnh báo kích thước bundle trên 500 kB.
- Bao phủ cả 21 đoạn × 12 chủ âm × 5 tầm phím; đủ số nốt, đúng độ dài, gate nằm trong câu.
- 20 lượt liên tiếp trên từng đoạn: nốt thay đổi, timing/hòa âm giữ nguyên; nốt thay
  mới thuộc vốn nguồn đúng mode và tập nốt hợp lệ theo hòa âm. OFF bằng đường cũ.
- UI thử riêng, không sửa bài lưu của người dùng: Em Bossa full 152 phách, giang
  210 nốt tay phải qua hai lượt; chọn 37 phím vẫn giữ độ dài. Hai lần phát thực
  đổi cả dạo/giang/kết, mọi nốt trong MIDI 48–84. Nguon ghi lượt nền #853–855 và
  lượt phát triển #867–869; chưa chấm duyệt những câu thử này.
- UI Ballad trưởng: ưu tiên nguồn dài có hai lượt giang Hồng Kông 1, mỗi lượt 76
  phách; đổi nguồn Có Em Chờ được hai lượt 32 phách. Tắt full trở lại solo thường.
- Bài mặc định của skill không có trong thư viện tab thử riêng; dùng vòng có lời
  thử Em/C 8 hợp âm, không giả là đã kiểm trên bài Để nhớ một thời ta đã yêu.

Chờ người dùng nghe duyệt một vòng. Chưa commit chế độ full trong đợt này.

## Sửa theo bốn ảnh người dùng — đuôi solo và run chuyển đoạn (14/9)

Mục này cập nhật bản nghe thử phía trên, **không phải xác nhận đã duyệt bằng tai**.

- Ảnh 1: ô 8, A11 bắt đầu offset 1,5; hai nốt xanh F4/D5 tại offset 2,5 là
  lời hát, tiếp theo G4/E5 và A4/F5. Ảnh 2: ô 48, Em7b5 → A11; D5 xanh tại
  offset 2,5 bắt đầu lời hát. Export đánh dấu `vocalPickupAt: 30.5` cho cả hai đoạn.
- `leadFullSoloInto` bỏ RH từ ranh giới lời hát đó và đặt ba cặp dẫn, vẫn cách nhau
  nửa phách. Tính tương đối với hợp âm đích: `[2,5] → [0,3 hoặc 4] → [-1,2]`;
  cặp cuối là bậc 3/5 của V, dẫn bán cung lên chủ âm đích và bậc 3 của đích.
  Đây là **biên soạn KT theo cử chỉ cặp nốt và cách chọn át của CP**, không phải câu
  instrumental được chép nguyên từ chỗ lời hát. Không sửa phần đầu hoặc outro.
- Đổi cả cụm hòa âm cuối theo hợp âm mở đoạn thực: intro iv–V11 từ beat 27,5;
  giang iiø–V11 từ beat 28 (đích trưởng chuyển iiø thành ii7 và sửa bậc 5 tương ứng).
  Nốt hai tay và grace trong cụm cùng chuyển đích, không chỉ thay nhãn hợp âm.
  Mặc định chưa có đích thì dẫn về chủ âm. Lặp giang: lượt trước về chủ âm để lặp,
  lượt cuối theo đầu đoạn hát kế. Test bài Em → phần hát Am: B11 rồi E11 ở hai lượt.
- Ảnh 3 khớp ô 39: RH 12 attack từ offset 1 đến 3,75, bước 1/4 phách, A3 đến D6.
  Ảnh 4 khớp ô 64: RH 22 attack từ offset 1 đến 3,875, có bước 1/8 phách,
  D4 đến Bb5. Tay trái giữ cách nâng bass/rải/hỗ trợ của cửa nguồn; RH tie trên
  phách đầu là phần hát trước đó, không được đưa vào câu chạy.
- Kho short CP Lick **697 mảnh giữ nguyên**; thêm `transitions` gồm 19 cửa dài
  3–4 phách, từ các cửa instrumental đủ điều kiện và hai ô được chỉ đích danh.
  Hai mẫu 39/64 được ưu tiên ở Bossa. Kho cũ loại chúng vì trần 2 phách, trần
  quãng RH 24 bán cung và ranh giới vocal chưa xác nhận.
- Nút màu Cà Pháo giờ bật CP Lick. `fullTransitions` chỉ bật khi đang dùng màu
  Cà Pháo; phần short fill vẫn dùng thuật toán đã duyệt. Có thể bỏ tick CP Lick.
  CP Run dài chỉ đặt ở mốc chuyển đoạn còn hợp âm tiếp theo; tôn trọng skip,
  delay/disable và không sinh khi `vocal === 'full'`. Không tự thêm ô vào bài.
- Ưu tiên nguồn cùng điệu/mode; fallback khác điệu theo yêu cầu mới chỉ khi cùng
  meter và câu vừa nguyên cửa, cùng vị trí phách. Soạn nốt theo gam/hợp âm đích,
  giữ cặp bán cung có giải quyết. Không kéo nhanh để nhét câu rộng vào cửa hẹp.
  Chưa hỗ trợ chuyển một câu 4/4 sang 3/4 hoặc 6/8 một cách tự động.
- Dùng tầm đàn đã chọn (mặc định C2–C7) cho run dài, đặt nguyên nét theo quãng tám.
  Nếu LH chạm phím với run RH, thử đặt lại nguyên tuyến LH phía dưới. Không vừa
  hoặc không tránh chạm thì thử mẫu khác/câu ngắn hơn; không âm thầm cắt đỉnh run.
  Chỉ thay đệm trong cửa câu; ngoài cửa vẫn giữ nguyên 11 tiếng Bossa.
- UI có dấu vết nguồn **lượt xem trước** (số hợp âm, sheet, ô, số attack, phách).
  Lượt bấm phát được soạn mới nên không hứa trùng nguồn xem trước. Chưa có timestamp
  giọng hát: cửa tự chọn là ước lượng từ nhãn đoạn, cần nghe và chỉnh delay nếu run
  chạm câu hát; không gọi mọi cuối đoạn là khoảng im lặng đã đo.

Kiểm đợt sửa: 67 test liên quan qua (thêm kiểm đích dẫn thật sau hai lượt giang,
run 39/64, 12 giọng trưởng/thứ và tầm 37/61 phím); kiểm tái sinh hai kho; build.
UI trong tab thử riêng: chọn màu tự tick CP Lick, hiện run ô 64 ở hợp âm số 4,
Em mở Am hiện E11 cuối intro; phát/dừng được. Nguon ghi câu thử #883–885,
không đánh dấu duyệt và không lưu đè bài người dùng. Không tự ghi Sổ tay/MD Cà Pháo
là đã duyệt; chờ nghe phản hồi.

## CP Run chuyển đoạn — bản advanced nghe thử (15/9)

Người dùng đổi yêu cầu từ trung bình sang **advanced** trong lúc triển khai.
Mục này thay cách phát run chuyển đoạn dài ở mục trên; chưa phải duyệt bằng tai.

- `advancedCpRuns` lấy nét liên tiếp 8–12 nốt từ kho 19 cửa nguồn, ưu tiên cùng
  điệu/mode và hai ô 39/64 của Người hãy quên em đi. Giữ hướng chạy/đổi hướng,
  không cắt rời cặp tiếp cận bán cung. Soạn lại nốt theo gam và hợp âm thực,
  kiểm lại hướng từng bước sau khi soạn; không chỉ phát nguyên nốt sheet.
- Độ dài thay đổi theo lượt, khoảng 2–4 phách; bước nhanh nhất 1/4 phách
  (móc kép ở 4/4), không giữ tốc độ móc tam dày của ô 64. Khoảng nghỉ lớn hơn
  trong nguồn giữ trên lưới 1/4 phách. Đây là biên soạn KT, không chép nguyên tiết tấu.
- Quãng RH tối đa 24 bán cung, bước nhảy tối đa 12; nằm trong tầm đàn đã chọn.
  LH dùng một bass nguồn giữ dưới nét RH, kiểm tránh đè cùng phím giữa hai tay.
  Advanced ở đây là mức biên soạn, không phải chứng nhận trình độ; độ khó còn tùy BPM.
- Xáo trộn có seed theo lượt; cùng lượt tái tạo được. Neo cuối run đúng mốc
  đoạn kế, chỉ thay tiếng đệm trong cửa run. Nếu không đủ ít nhất 2 phách hoặc
  không vừa tầm đàn/hòa âm thì bỏ qua và báo; không tăng tốc để nhét câu.
- Màu Cà Pháo + tick CP Lick dùng run advanced thay bản trung bình 4–6 nốt.
  Không đổi solo thường/full, thuật toán short fill, hoặc khung 11 tiếng ngoài cửa run.
  Kho JSON nguồn vẫn giữ nguyên, không mất bản đầy đủ.
- Kiểm: 68/68 test liên quan qua; 24 lượt kiểm nguồn, độ dài và giai điệu thay đổi;
  96 trường hợp 12 giọng trưởng/thứ × tầm 37/61 phím × Bossa/Ballad.
  UI tab thử riêng hiện run advanced ô 39, 8 nốt/2 phách; phát được từ hợp âm có run.
  Chờ người dùng nghe; không ghi Sổ tay/MD Cà Pháo thành khung đã duyệt, chưa commit.
