# Giang tấu thứ Bolero Tuấn — vòng nghe thử 10/9/2026

## Yêu cầu đang thực hiện

Tự soạn giang tấu từ kiến thức solo thứ: giai điệu có thể dùng hình tiết tấu khác
phần hát, nhưng giữ nhịp, số phách trong ô và chỗ trở vào hát. Không áp máy móc
khung A/B của intro, không ghép từng ô từ nhiều thầy rồi chèn run để che mối nối.

## Đối chiếu nguồn thật

Đã đọc MusicXML bằng `tools/tuyen_o.py` → `doc_bai`, đối chiếu:

- Linh Nhi, *Nỗi Buồn Hoa Phượng*, giang tấu ô 37–41: mỗi ô nguồn dài 8 phách,
  quy về 10 ô 4 phách. Có mở thưa/ngân, rồi mô-típ rải móc đơn nhắc lại.
- Linh Nhi, *Đừng Xa Em Đêm Nay*, ô 48–57: 4 phách/ô; ngân, lấy đà móc kép,
  chấm dôi/đảo phách, chuyển giữa rải và tuyến nốt. Không phải chỉ một lưới Pắp.
- Tôn Hùng, *Chiếc Lá Mùa Đông*, ô 58–67: nốt đen/ngân xen móc đơn và nhảy quãng.
- Cà Pháo, *Người Hãy Quên Em Đi*, ô 41–48: có đảo phách, hợp âm mở rộng,
  iiø–V. Dữ liệu có nhiều lớp RH; nốt cao nhất ở mỗi onset chưa chắc là một bè hát.

Hai nguồn sau dùng để so sánh cách tổ chức, KHÔNG lấy từng ô chèn vào câu Hoa Phượng.
Ledger đã đọc: `D:/PianoBrain/data/sheet-solos/linh-nhi-noi-buon-hoa-phuong-linh-nhi-interlude.json`
(Linh Nhi, bolero, interlude, 104 sự kiện hai tay). Cao độ/hòa âm kiểm lại bằng XML.

Cảnh báo trích xuất: Hoa Phượng ô 39 phách 2 là **Edim**, không phải Em;
Đừng Xa ô 53 phách 2 cũng là Edim. Bảng `chat` ba loại của KT mất chất diminished.
Vòng này không dùng những ô đó làm mẫu hòa âm, không sửa hàng loạt bảng nguồn.

## Bộ soạn hiện thực sự làm gì

`planMinorInterlude` trong `minorSoloSource.ts` học mô-típ ô 38 nửa sau Hoa Phượng:
trên Bb ở nguồn Dm, tuyến F–Bb–D–E–F biểu hiện **5–1–3–#4–5**.
Rút ba vai trò ổn định 5–1–3 và chức năng nốt nối giải vào lần nhắc tiếp theo.
Không dán dấu #4 vào mọi hợp âm và không dán MIDI Rê thứ sang bài La thứ.

KT xây câu tám ô: mở ngắn có nghỉ → nhắc/triển khai → đổi hòa âm → đáp/thở →
tái hiện → phát triển → về i → dẫn sang đoạn tiếp theo. Giãn hình móc đơn thành
nốt đen ở câu mở, giữ móc đơn ở câu phát triển, có biến thể vào lệch nửa phách.
Ba vị trí bắt đầu của cùng mô-típ × hai cách vào câu nhắc = sáu biến thể, tất định theo lượt.

Vòng chức năng: `i i iv VI | iv V7 i V7/đích`. Thiếu VI trong vốn bài thì kéo dài
iv (rút gọn hòa âm có chủ ý), không thay bằng bậc gần nhất. Giữ màu add2/add9/m9
đã nhập nếu chứa đúng bộ ba. V treo của phần hát có thể giải sang V7 ở solo;
không tự biến v thứ thành V. Thiếu i/iv/V tương thích hoặc không vừa tầm thì báo
không soạn được, không phát đường ghép cũ. Nếu không còn đoạn hát sau, ô cuối về i.

Hợp âm/nốt dùng chung một kế hoạch. Chọn quãng tám cho cả mô-típ trước khi phát,
không gập từng nốt; các nốt nối ngắn giải bằng bước hẹp. Tầm 62–79 chạy được với
bài Am hiện tại; tầm hẹp có thể từ chối một số giọng/đích. Kiểm chuyển 12 chủ âm
trong tầm 57–84, không tuyên bố mọi tầm đều khả thi.

Tay trái giữ pha cell Tuấn. Tay phải đệm chỉ đáp trong nghỉ thật, không đè lên
giai điệu. Không A/B, chenChay, cắt mất phách cuối hay cộng ô hút của intro.
`arrangement.composed` giữ nguyên hai tay đã soạn khi ráp vào bài, không nhân bass
hoặc cài tay lần nữa. Dải hợp âm hiển thị lấy từ timeline thật, không tự soạn lại
với `opening=null`. Chỉ mở nhánh giang tấu thứ Tuấn trong app; không thay intro/outro.

## Mẫu nghe và giới hạn

Đã thử đường phát từ giang tấu trên Chrome localhost:5173, bài *Để Nhớ Một Thời Ta Đã Yêu*;
app lưu **Giang tấu #628** vào Nguon.json và hiện hai lựa chọn bình luận. Đã dừng phát,
không tự đánh dấu Đã ổn. Bài quay lại điệp bằng F nên câu này chốt C7 dẫn F, không E7.

Đây là **bộ phát triển mô-típ có luật, một họ nguồn**, không phải fine-tune trọng số AI,
không phải chép nguyên đoạn sheet, cũng chưa là bộ sáng tác mọi điệu. Test kiểm cấu trúc,
hòa âm, nốt nối, tầm, thời gian và việc ráp bài; không chứng minh câu nghe hay.
Giữ vòng này để lấy nhận xét về giai điệu, tiết tấu và chỗ nối trước khi mở thêm họ mô-típ.

Kiểm chứng: build thành công; 14 test riêng nhánh mới đạt. Toàn bộ 2.528 test:
2.522 đạt, còn sáu lỗi đã có ở phraseAcrossBar, daoTruongLinhNhi, handSplitAudit,
sietHopAm và hai kiểm tầm Cà Pháo trong tuyenSolo. Không hạ ngưỡng các lỗi này.
Kiểm cũ đòi giang dài hơn intro và bắt đầu Am–Dm được thay bằng tám ô/nguồn mô-típ
theo yêu cầu mới; kiểm giữ Fadd2 và kiểm nốt phô vẫn giữ. Sau xem dữ liệu #628,
loại nốt trùng trong cùng cú bass của nhánh mới, không sửa lại các câu đã lưu.

## Vòng 2 — thêm chạy vừa/dài và ô hút chờ ca sĩ

Người dùng nghe và đánh giá câu tương đối ổn, nhưng còn thưa, thiếu chạy ngón;
yêu cầu học kỹ thuật Cà Pháo và thêm hút/nghỉ như intro. Mục này thay yêu cầu
“không cộng ô hút” ở vòng 1; các mô-típ chính và bộ soạn intro/outro giữ nguyên.

Đối chiếu XML + ledger *Người Hãy Quên Em Đi* (Cà Pháo, bossa nova, Rê thứ):
ô 47→48 có chuỗi 10 onset cách 0,25 phách, lướt chromatic xen rải rồi đáp ở ô kế.
Không suy từ đó rằng mọi giang tấu đều dày nhất: đoạn này có 18 khoảng nhanh/57
onset, intro 21/66. Chỉ học kỹ thuật nối/đáp, không chép cell bossa hoặc dán ô
Cà Pháo vào giữa nguồn Hoa Phượng. Đây là sáng tác KT phát triển từ mô-típ cũ,
vận dụng kỹ thuật người dùng vừa yêu cầu, không tuyên bố là câu nguyên bản một thầy.

Trong kế hoạch chung `planMinorInterlude`, ô 3 có 8 nốt móc kép trong hai phách;
ô 6 có 12 nốt trong ba phách. Tính thêm nốt đáp đầu ô kế là câu 9 và 13 nốt.
Đích lấy từ mô-típ kế đã soạn. Tìm đường nguyên câu trong tầm, có hướng phát triển,
nốt tựa trên phách nguyên và nốt lướt ngắn giải bằng bước hẹp; không gập từng nốt,
không thêm run ở khâu ráp sau cùng, không biến toàn đoạn thành chạy gam.

Nếu còn phần hát sau: thêm ô thứ 9 hút về hợp âm mở của phần đó. Dùng lại cử chỉ
`hutDungXa`, ngân hai phách rồi im hai phách. Cả đoạn 36 phách; phần hát trở vào
đúng vạch tiếp theo. Khoảng nghỉ nằm trong ô hút; không sửa lựa chọn nghỉ thêm
của người dùng trong Thứ tự chơi. Không còn đoạn hát sau thì không thêm ô hút.

Đã phát kiểm tra và lưu **#633**, bài *Để Nhớ Một Thời Ta Đã Yêu*, rồi dừng.
Đọc lại Nguon.json xác nhận: 9 ô; 8 nốt chạy vừa, 12 nốt chạy dài; ô hút C ở
phách 32, cả hai tay nhả ở phách 34, nghỉ đến 36 để vào F. Không ghi đè #628,
không tự đánh dấu Đã ổn. Kiểm chứng: 21 test nhánh mới đạt, build đạt;
toàn bộ 2.535 test có 2.529 đạt và đúng sáu lỗi cũ nêu trên. Chưa commit.

## Vòng 3 — ii–V dặm, giải vào phần hát

Yêu cầu tiếp theo: cuối giang có thể hút bằng nhiều cách, thử vòng 2–5–1 dặm
hợp âm. Không thay toàn bộ câu giang hoặc chạy ngón đã tương đối ổn.

Đối chiếu trực tiếp MusicXML qua `tools/tuyen_o.py::doc_bai`:

- Cà Pháo, *Người hãy quên em đi*, Dm, bossa nova: ô 48 phách nội bộ 0 là
  E half-diminished, phách 2 là A dominant-11; ô 49 phách 0 vào D minor-9.
  Đây là iiø–V–i qua ranh giới giang/hát. Tay phải ô 48 là tuyến nốt chạy,
  **không phải** chứng cứ cho đúng nhịp dặm hai hợp âm mà KT dùng bên dưới.
- Linh Nhi, *Nỗi buồn hoa phượng*, Dm, Bolero: A7 ở ô 40 → Dm ô 41,
  kết giang trên i trước phần tiếp theo. Là một cách V–i khép câu, không phải
  tất cả sheet đều để V treo tới lúc hát.
- Tôn Hùng, *Chiếc Lá Mùa Đông*, Gm, ballad: D7 ô 65 → Gm ô 67,
  rồi F ô 68. Không được suy ngược rằng V ấy là át của F sắp hát.
- Cuối giang *Đừng Xa* có ký hiệu Bbmaj7/Bm7 ở chỗ nối, chưa đủ rõ để lấy làm
  mẫu cadence chuẩn; không ép dữ liệu này thành ii–V–i cho khớp giả thuyết.

Quyết định nghe thử: học **chức năng hòa âm** ở ví dụ Cà Pháo, không chép cell
bossa vào Bolero. Nhịp dặm là KT chuyển soạn theo đề xuất người dùng, không
gán thành lối đánh nguyên bản của thầy. Giữ nguồn mô-típ Hoa Phượng của tám ô
đầu; đây là kỹ thuật nối đoạn riêng, không ghép ô giai điệu của các thầy.

Thêm lựa chọn `interludeCadence` vào nhánh giang thứ Tuấn. Giao diện mặc định
“ii–V dặm → vào hát”, có thể chọn lại “V ngân (cách trước)”. API bỏ tùy chọn
vẫn giữ cách V ngân để không đổi các đường gọi cũ. Dùng lại `turnaroundInto`
để tính ii và V theo **hợp âm thật đầu đoạn hát sau**, không theo chủ âm cả bài.
Đích trưởng dùng m7–7; đích thứ dùng m7b5–7. Bậc V7 đang có trong kế hoạch được
giữ; không tự đổi sang treo hoặc thêm b9 chỉ để làm nhiều màu.

Ô thứ 9: hai tay dặm ii ở phách 1, V ở phách 2, mỗi cú dài 0,95 phách;
phách 3–4 im để lấy hơi. I/i thuộc phần hát ở vạch 36, **không** chơi thêm I
trước khoảng nghỉ rồi hút lần nữa. Đây là một lựa chọn bố cục, không phải luật
cấm mọi cách khép V–i trước khi hát. Không có phần hát sau thì không thêm ô hút.
Dẫn bè dùng bộ voicing hai tay sẵn có; dải ký hiệu lấy đúng hợp âm và độ dài
trên timeline (ii 1 phách, V 3 phách kể cả nghỉ), không ghi một nẻo phát một nẻo.
Không sửa intro/outro, không thay nốt trong tám ô hoặc xóa câu cũ đã lưu.

Kiểm chứng: 25 test giang thứ đạt, gồm 12 đích trưởng + 12 đích thứ, nghe đủ
nốt hợp âm dặm, giữ nguyên events trước phách 32, hai tay nhả trước 34, phần hát
vào đúng 36, và không thêm cadence khi không có đoạn sau. Build đạt. Toàn bộ
2.539 test: 2.533 đạt, đúng sáu lỗi cũ của vòng trước; không sửa ngưỡng cho xanh.

Đã kiểm đường phát trên localhost:5173, lưu **Giang tấu #635** cho *Để Nhớ Một
Thời Ta Đã Yêu*, rồi dừng. Nguon.json xác nhận Gm7 ở phách 32 (bass G2,
tay phải Bb3–D4–F4), C7 ở phách 33 (bass C3, tay phải Bb3–E4–G4), đều dài
0,95 phách; phần hát tiếp theo vào F. Câu có chín ô với hai hợp âm trong ô hút.
Chưa tự đánh giá bằng tai hoặc đánh dấu Đã ổn. Test không chứng minh câu hay;
chờ người dùng nghe so với cách V ngân. Chưa commit.

## Vòng 4 — sửa lặp câu ở “soạn mới”

Người dùng báo mỗi lượt nghe giống nhau và yêu cầu sửa. Đọc Nguon.json xác nhận
#635, #636, #638 khác nốt nhưng đều bị phát lại. Có hai vấn đề độc lập:
nhánh giang cộng `phraseSpin + playSpin.current`, cả hai tăng mỗi cú bấm nên
chỉ đi ba trong sáu biến thể; `interludeWindow` không nhận pass/take của lượt
giang nên vòng tự động/bước giang kế dùng lại events đã dựng. Test cũ chỉ gọi
bộ soạn với 0..5, không kiểm đường chọn lượt thực tế — thiếu sót của Codex.

Sửa: bộ đếm `playback/phraseTakes.ts` dành riêng cho giang, cấp một lượt cho
mỗi câu. Cùng pass được hỏi lại khi lưu/hiển thị không tiêu thêm lượt. Lần bấm
sau đi tiếp sau lượt cuối đã dùng, kể cả trước đó đã tự chạy nhiều vòng.
`buildPass` truyền lượt này vào `interludeWindow`; `arrangement` truyền số take
và dựng lại hai tay cho mỗi vòng giang, không thay RH mà giữ đệm đáp sai câu.
Không thay cách chọn intro/outro. Nhánh nghe câu đã lưu vẫn giữ nguyên nốt.

Mở rộng phát triển mô-típ trong `planMinorInterlude`: vị trí bắt đầu × chiều
trình bày vai trò × bốn cách vào câu/đáp × cách vào lệch phách ở lần nhắc.
Kiểm được **48 biến thể khác nốt/tiết tấu** với bài Am, tầm 62–79. Giữ nguyên
vòng chức năng, nguồn mô-típ Hoa Phượng, vị trí chạy vừa/dài và cadence đã chọn.
Các nhịp biến tấu là KT phát triển có luật, không phải vừa thu nạp thêm 48 câu
sheet. Đây vẫn là một họ mô-típ hữu hạn: với cùng đầu vào, chu kỳ 48 có thể
lặp lại; không tuyên bố sáng tác vô hạn câu chưa từng xuất hiện hay 48 câu đều hay.

Phần phát/lưu nay dùng cùng bản dựng cho từng vòng, để thẻ bình luận theo câu
mới của vòng đó. Phát tự động còn có lỗi lịch: tại đầu lượt kế lại đặt Part
lùi một lượt vào quá khứ. Đã sửa offset; onset 0 phát bằng giờ AudioContext
callback, các onset sau xếp theo phách Transport. Không đưa giờ callback vào
Part.start. Có test đồng hồ giả kiểm qua bốn vòng và kiểm nghe một lần không
tự soạn vòng mới; chưa dùng test đó để khẳng định chất lượng âm thanh thực.

Kiểm: 31 test gồm giang, bộ đếm và lịch phát đạt; build đạt. Toàn bộ 2.545 test:
2.539 đạt, còn đúng sáu lỗi cũ. Không nới ngưỡng các lỗi cũ. Thử bảy lần bấm
đầu giang trong Chrome localhost:5173, bài mặc định, “soạn mới”: lưu #641,
#643, #644, #645, #646, #647, #648. Đối chiếu Nguon.json có bảy timeline nốt
khác nhau, mỗi câu một lượt; đã dừng nhạc, không tự đánh dấu Đã ổn hoặc ghi đè
câu cũ. Chưa commit. Chờ nghe duyệt rồi mới chốt vào Sổ tay.

### Kiểm chứng tiếp — vòng tự động trên app (10/9, 17:01 giờ địa phương)

Theo yêu cầu tiếp tục, không mở vòng chỉnh nhạc mới: phát từ hợp âm cuối bài
để kiểm ranh giới sang lượt tiếp theo, không thay thứ tự phiên/điệp. App lưu
giang #649 ở 10:01:26 UTC rồi #636 ở 10:01:27 UTC khi tự chuyển vòng. Thẻ giang
đổi sang #636; đã dừng bằng nút Dừng. Đọc Nguon.json xác nhận hai timeline nốt
khác nhau, cùng vòng hòa âm. #636 là câu có sẵn, không phải một ID mới: bộ
đếm đã tiến đúng nhưng họ 48 biến thể vẫn hữu hạn, không tránh mọi câu từng lưu.
Đây là kiểm chứng chuyển vòng/lưu/thẻ bình luận, không phải nghe duyệt chất
lượng toàn câu hoặc xác nhận mọi nốt âm thanh đầu ra. Chạy lại 31 test nhánh
sửa: đều đạt. Không đổi mã sản xuất, không đánh dấu Đã ổn, chưa commit.

## Vòng 5 — đổi cả đường hòa âm, không chỉ đổi nốt

Người dùng chỉ ra 48 biến thể vẫn cùng vòng hợp âm, yêu cầu thực hiện phần còn
thiếu. Nguyên nhân là `const chords = [...]` cố định trong `planMinorInterlude`.
Vòng này chọn một đường hòa âm trước, rồi dựng mô-típ, nốt nối, chạy ngón và
hai tay trên cùng kế hoạch. Không đổi nhãn hợp âm sau khi nốt đã được soạn.

### Nguồn và phép chuyển soạn có giới hạn

Chỉ dùng Linh Nhi / Bolero trong vòng này; đọc ledger và XML qua bộ đọc hiện có:

- *Nỗi buồn hoa phượng*, Dm, giang ô 37–41: ô 38 có Gm rồi Bb, ô 39–40
  đi qua A7/Edim rồi A7, ô 41 về Dm. Hai đường KT giữ cùng nguồn mô-típ
  5–1–3 đã dùng, phát triển/rút gọn chức năng thành tám ô; **không** khai rằng
  từng hợp âm/thời lượng KT là bản chép nguyên văn, nhất là chỗ bỏ tiểu tiết ii°.
- *Đừng xa em đêm nay*, Dm, **intro ô 1–6** có chuỗi liền mạch
  `Dm C Bb F Gm Dm` = `i VII VI III iv i`. Mô-típ lấy từ chính ô 1:
  tuyến trên A–F–F–D, rút nốt lặp thành vai trò **5–3–1**. Ledger xác nhận
  RH ô đầu tám onset, LH năm onset; không chép mật độ đó nguyên xi vào Tuấn.
  KT học một ý nhạc solo rồi phát triển thành giang, không giả là chép giang
  nguồn. Không dùng đoạn cuối giang Đừng Xa với ký hiệu Bbmaj7/Bm7 còn mơ hồ.
  Chỉ lấy trọn chuỗi sáu ô nêu trên; hai ô sau là cadence KT nối thêm, không
  ép ô 7 ii°/V của nguồn thành hợp âm gần nhất để khớp vốn bài.

Ba đường tám ô, viết trên bài Am và đích hát F:

1. `Am Am Dm F | Dm E7 Am C7` — Hoa Phượng, giữ đường cũ để so sánh.
2. `Am Dm F F | E7 E7 Am C7` — Hoa Phượng, nhấn VI rồi kéo dài V trước khi về i.
3. `Am G F C | Dm Am E7 C7` — Đừng Xa, giữ đường đi sáu ô nguồn, nối cadence.

Mỗi đường luôn đi cùng sourceId/mô-típ của chính nó. Màu mở rộng có sẵn như
Am(add9), Fadd2 được giữ khi chứa bộ ba cần thiết. Thiếu VII/III thì loại
nguyên đường Đừng Xa, không thay G/C bằng hợp âm gần nhất. Với vốn bài quá ít,
có thể chỉ còn một đường phù hợp — không hứa mỗi lượt đổi vòng khi không đủ
vốn. Nhánh rút gọn VI→kéo dài iv của đường cũ vẫn giữ như đã ghi ở vòng 1.

Số lượt xoay qua các đường **sau khi lọc** rồi mới tiến biến thể mô-típ; tránh
việc ba đường chỉ nhận mỗi đường một phần trong 48 biến thể. Kiểm trên bài Am,
tầm 62–79: 144 cặp đường/giai điệu khác nhau. Đây vẫn là ba đường đã thiết kế
có căn cứ và các phép phát triển có luật, chưa là học/sáng tác hòa âm tự động
không giới hạn từ mọi sheet.

Giữ nhịp tay trái Tuấn, hai cửa sổ run ở ô 3/6, ô hút 9 và hai phách nghỉ.
Đích F vẫn có ô 8 C7, ô 9 Gm7–C7 rồi F khi phần hát vào. Đường hòa âm mới
không được đổi đích sang Am chỉ vì bài mang giọng Am. Không sửa intro/outro.

### Phát, hiển thị và kiểm chứng

Thêm `interludeDisplayTake` để khi bài tự sang vòng mới, bản nhạc được dựng
theo đúng lượt giang đang phát. Trước đây nó cứ dựng lại pass 0: chưa lộ khi
mọi lượt chung hòa âm, nhưng sẽ hiển thị sai ngay khi vòng bắt đầu thay đổi.
Phần lưu vẫn lấy trực tiếp events/chords của bản dựng đã dùng phát.

30 test giang đạt: 144 cặp vòng/câu, nốt tựa đúng hợp âm, tension giải hẹp,
tầm/trường độ, bass đúng vòng hiển thị, nguồn mô-típ nhất quán, loại đường
thiếu vốn, ba đường chuyển đủ 12 giọng thứ, cadence theo F và giữ nghỉ. Kiểm
mô-típ cũ đòi cùng số nửa cung được sửa thành cùng **vai trò 1/3/5**: trên
hợp âm trưởng bậc ba phải là 4 nửa cung, không ép 3 nửa cung cho giống ô thứ.
Không nới kiểm nốt phô, thời gian hoặc các lỗi cũ. Build đạt. Toàn bộ 2.548
test: 2.542 đạt, vẫn đúng sáu lỗi đã có trước vòng này.

Thử Chrome localhost:5173 trên *Để Nhớ Một Thời Ta Đã Yêu*: #660 dùng đường 2,
#661 đường 3, #663 đường 1. UI và Nguon.json khớp cả ba vòng, nốt lần lượt
107/107/105. Thử thêm ranh giới vòng tự động: thẻ #665 hiển thị đúng đường 3
`Am G F C Dm Am E7 C7 Gm7 C7`. Đã dừng nhạc, không đánh dấu Đã ổn, không sửa
câu cũ. Các phép kiểm không thay việc người dùng nghe duyệt. Chưa commit;
sau khi được duyệt cần chốt quyết định vào Sổ tay theo quy trình dự án.

---

## Khung soạn solo Bolero Tuấn giọng thứ

Phạm vi: **intro · giang tấu · outro không lời**. Phiên/điệp là giọng hát, không lấy làm
corpus solo. Mục tiêu là tự tạo câu có nhịp Bolero Tuấn, màu thứ, logic giai điệu và truy được
nguồn học của cả câu.

### Chuẩn bị một lượt soạn

1. Khoá corpus theo `(thầy, bolero, đoạn, giọng thứ)`; không trộn Ballad/Bossa hoặc nhiều
   thầy trong một câu.
2. Chọn **một nguồn hoặc tiểu cú liên tiếp** trước khi chọn nốt. Nguồn giữ contour, chỗ thở,
   tension–resolution và khi dùng thì cả vòng hoà âm; không ghép ô nhiều bài rồi thêm run.
3. Quy về chức năng so với chủ âm sheet (`i, iv, V7, bVI…`) và khoảng so với tonic, rồi dựng
   lại ở tonic bài đích. Không dán `Dm`/MIDI Rê thứ sang bài La thứ.
4. Chỉ nhận ứng viên tương thích vốn hợp âm bài. Thiếu chức năng thì bỏ cả ứng viên, không
   thay bằng “bậc gần nhất”; `V7` không được hạ thành `V`.
5. Chọn quãng tám cho **cả cụm**. Không vừa tầm thì loại, không gập từng nốt để ép trần.

### Hai lớp phải tách nhưng phối hợp

| Lớp | Giữ từ đâu | Không được làm |
|---|---|---|
| Khung điệu | cell Tuấn: LH Pùng `0, 2, 3`; RH Pắp `0.5, 1.5, 2.5, 3.5` | bê nhịp Bossa/Ballad của sheet vào |
| Câu melody | mô-típ, mật độ, nghỉ, hướng đi, cách giải của một solo Bolero thứ | ép mọi onset melody trùng Pùng-Pắp |
| Hoà âm | chức năng và màu từ cùng kế hoạch nguồn/vốn bài đích | lấy vòng nguồn A, nốt nguồn B |

Pùng-Pắp là xương sống **đệm**. Melody được phép móc kép, lấy đà, nốt lướt và nghỉ ngoài
bảy mốc nếu giữ thứ tự, độ dài và cách giải của câu nguồn. RH Pắp chỉ đáp ở khe trống thật,
không chồng lên run hoặc tuyến melody.

### Khung intro thứ đã nghe ổn

Các intro thứ được duyệt từ #544 trở đi, đặc biệt #550, dùng hai vai trò ô luân phiên:

- **Ô A — melody:** LH nền/bass, RH nói mô-típ ngắn theo nốt hợp âm và gam thứ, có chỗ thở.
- **Ô B — Pùng-Pắp:** cell Tuấn trả lời; không nhét thêm run vào cùng ô.
- **Cadence:** cuối câu dẫn về phần hát bằng V hoặc vòng hút tương thích, rồi chừa chỗ ca sĩ vào.

Mốc #550 ở La thứ có hình `i–iv` lặp rồi mở cửa V. Phải học vai trò hoà âm và đối đáp A/B,
không chép tên hợp âm/MIDI. Giữ màu thứ bằng `i/iv`, b6/b7 khi hợp lý; bậc 7 chỉ nâng khi thật
sự làm leading tone. Tránh rải tam âm trưởng lặp và chuỗi đi lên cùng chiều dài vô cớ.

### Khung giang tấu thứ

Giang tấu không phải intro A/B kéo dài. Nó có thể rời nhịp lời nhưng phải giữ nhịp/pulse
Bolero. Chọn một đường hoà âm-mô-típ cùng nguồn rồi phát triển xuyên 8 ô; mỗi lượt đổi **cả**
đường nguồn để tạo câu khác. Phân pha: mở có khoảng thở → nhắc/biến mô-típ → run vừa → run dài
có đích → cadence và nghỉ chờ ca sĩ.

Run phải nối nốt cuối hiện có sang nốt đầu ô kế, có đường đi hợp âm/gam và giải hẹp; không dán
arpeggio ngẫu nhiên. Cuối giang có thể hút V ngân hoặc `ii–V` dặm theo hợp âm sắp hát; I/i để
phần hát đánh ở vạch vào. Không có đoạn sau thì không tạo cú hút giả. Hợp âm, `beatsEach`,
bass, melody và dải hiển thị phải cùng một `SoloSpan`; ô chia đôi giữ đúng số phách.

### Khung outro thứ

Outro là câu đóng bài, không bê bố cục intro. Nó cần một tiểu cú liên tiếp về `i`; nốt cuối
ưu tiên `1/b3/5`, rồi có thể rải hợp âm chủ để chốt. Nhánh kiểm chứng hiện dùng một tiểu cú
outro Bolero thứ cùng nguồn; ví dụ *Nỗi Buồn Hoa Phượng* chuyển về La thứ:
`Dm | G → F | F | Am`, nhịp `4, 2.5, 1.5, 4, 4`.

Giữ chia phách, nghỉ và tension–resolution của nguồn; đệm chạy cell Tuấn xuyên đoạn, Pắp chỉ
đáp lúc melody nghỉ. Không dùng chuỗi hậu xử lý vừa xoá nốt, nâng nửa câu, chèn run và đổi nốt
chót. Không có nguồn vừa hoà âm/tầm thì bỏ lượt, báo lý do, không fallback ngầm.

Đây là chuyển soạn một nguồn có kiểm soát, **chưa được gọi là outro đã hay** trước khi người
dùng nghe và đánh dấu. Bước sau là rút nhiều mô-típ đã duyệt cùng ngữ pháp để tạo biến thể mới,
vẫn giữ một nguồn nhất quán trong từng câu.

### Vòng kiểm trước khi nghe

Kiểm riêng ba mặt: (1) nhịp — pulse Tuấn, chỗ thở, run có đích; (2) hoà âm — chuyển đúng
chức năng/chủ âm, không trộn nguồn; (3) melody — nốt mạnh bám chord tone khi cần, tension giải
hẹp, contour không gập, kết đủ ổn định hay lửng theo mục đích. Chỉ sinh nhóm nhỏ, lưu đúng
events + `chords` + `beatsEach` vào `Nguon.json`, rồi dừng cho người dùng nghe. “Đúng màu,
đúng tiết tấu” là điều kiện cần; “hay như câu thầy” chỉ xác nhận sau phản hồi nghe.
