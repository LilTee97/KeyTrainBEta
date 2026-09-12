# Cà Pháo: hòa âm, voicing, nối câu và intro thứ Bossa CP cải tiến

Ngày 12/9/2026. Phân tích theo MusicXML và các ranh lời–đàn người dùng đã xác nhận; **không phải kết luận sau khi nghe video**. Intro mới là bản thử để nghe, chưa được duyệt.

## 1. Phạm vi và độ chắc chắn

Đối chiếu sâu bảy sheet trong `D:/PianoBrain/video/Ca_Phao`:

| Nhóm | Bài | Chủ âm / lưu ý |
|---|---|---|
| Trưởng, ballad | Hongkong 1 | C; không coi là Bossa |
| Trưởng, ballad | Có Em Chờ | Eb, nâng E; đoạn cuối không phải C# thứ chỉ vì mở bằng C#m7 |
| Trưởng, ballad | Ngày Mai Em Đi | Eb; không nâng ở điệp 2 |
| Thứ, bossa | Người Hãy Quên Em Đi | Dm; **nguồn duy nhất dùng cho intro Bossa thử lần này** |
| Thứ, ballad | Để Em Rời Xa | Dm → Ebm từ ô 56 |
| Thứ, ballad | Chưa Bao Giờ | Fm |
| Thứ, ballad | Chúng Ta Không Thuộc Về Nhau | Am |

Đây không phải thống kê toàn bộ sáng tác Cà Pháo. Các sheet khác/chưa phân loại không được tự đưa vào lần soạn này. Chỉ có một bài Bossa được xác nhận trong nhóm: chưa thể tách hoàn toàn đặc điểm riêng bài này khỏi phong cách Bossa nói chung của anh.

Ba cấp bằng chứng:

1. **Chắc về ký âm:** cao độ, thời điểm, trường độ, bass, nhãn hợp âm có trong file.
2. **Vai trò đã xác nhận:** lấy từ phiếu lời–đàn, không suy từ độ dày RH. Nguồn bổ sung ba bài trưởng: `D:/PianoBrain/ingest/phieu-bo-sung-ca-phao-3-bai-cu-2026-09-11.md` và `tools/sheet/corpus.json`.
3. **Diễn giải:** chức năng hòa âm, tension, tên thang âm; ghi rõ suy luận, không coi là tuyên bố về ý nghĩ của người chơi.

Ô trong báo cáo là số XML. Offset `0` là đầu ô; `1.5` là phách 2 và nửa. Không lẫn với cách ghi phách bắt đầu từ 1 trên phiếu.

## 2. Giọng trưởng: không chỉ thêm maj7 vào mọi hợp âm

### Hòa âm và thế bấm

- **Hongkong 1, ô 1, Fmaj7:** LH F3–C4–E4, RH A4 ở đầu ô. Hai tay chia root–5–7 và bậc 3; không phải RH luôn bấm hợp âm đủ từ gốc. Các tiếng tiếp có G và C, thêm màu 9 và chuyển động bè trên.
- **Có Em Chờ, ô 1:** nhãn XML là **Abmaj7**. RH G4–Bb4–C5, LH Ab rồi Eb/Bb: tổng thể gợi Abmaj9, với RH giữ 7–9–3. Không được biến cách diễn giải cũ “Eb/Ab” thành tên nguyên văn của sheet.
- **Có Em Chờ, ô 2–4:** Gm7 → Fm7/Bbsus4 → Ebmaj7. Đọc theo Eb là iii–ii–V treo–I. Có chuyển động chức năng, không chỉ một bộ màu dán lên vòng cũ.
- **Ngày Mai Em Đi, ô 3–4:** Bbm7/Db → C7. Bbm7/Db có màu ngoài Eb trưởng và bass đi xuống; nó chiếm cả ô, không phải vì “nối” mà gọi là hợp âm lướt rất ngắn. C7 gợi át của F/Fm, phải xét đích tiếp theo trước khi chốt chức năng.
- **Ngày Mai, ô 35–37:** Eb → Bb/D → Cm7 cho bass Eb–D–C. Tại ô 35, nhãn thật là Eb, không phải Bbsus4/Eb như một diễn giải cũ. Melodic F có thể tạo màu 9 ở thời điểm ấy; không cần thay tên toàn hợp âm.
- **Có Em Chờ, ô 58:** Abm7 nằm cả ô trong vùng E trưởng (đồng âm G#m7, bậc iii7). Không dùng nó làm bằng chứng “passing chord chớp nhoáng”.

Phương pháp học voicing: ghi **bass thực + bè trong + nốt trên cùng**, phân biệt các nốt thực sự cùng vang với những nốt chỉ lần lượt xuất hiện. Giữ bậc 3/7 nhận diện màu khi cần, bỏ gốc RH nếu LH đã nêu gốc; không bắt mọi màu phải chứa đủ 5–6 nốt cùng lúc.

### Chạy ngón / thang âm

- **Hongkong 1, ô 51**, offset 1.625 đến 3: D4–G4–A4–B4 rồi lặp hình lên các quãng tám, đáp B6 dài. Chỉ có **bốn pitch-class D/G/A/B**. Nó tương thích G major pentatonic / E minor pentatonic nhưng **thiếu E**, nên không đủ chứng minh một thang ngũ cung trọn vẹn hoặc mode cho cả bài. Bass đầu đoạn còn E, không được coi toàn câu là “G major pentatonic trên hợp âm G”.
- **Có Em Chờ, ô 5:** cụm C–Eb–G–Bb mở ra nhiều quãng tám trên nền Ab. Đây là rải/chuyển cụm upper structure: so với Ab, C/Eb/G/Bb là 3/5/7/9. Đặc điểm đáng học là giữ một họ nốt và hướng đi liên tục, chứ không ghép từng ô của nhiều thầy.

Chưa có đủ bằng chứng để tuyên bố anh dùng Dorian/Lydian/Mixolydian như luật mặc định. Nhìn một nốt #4, 6 hay b7 không đủ; cần trọng tâm câu, chỗ nhấn/ngân, bass và cách giải ở cả đoạn.

## 3. Giọng thứ: giữ màu thứ nhưng không khóa mọi nốt vào một gam

### Các lựa chọn hòa âm khác nhau

- **Người Hãy Quên Em Đi, intro 1–8:** Dm9/Gm11/Dm11/Gm11/Dm9/Gm11, rồi Dm11 → Gm7 sớm ở ô 7 offset 3.5, A11 ở ô 8 offset 1.5. Khung i–iv là một lựa chọn có thật, không bắt buộc intro phải chạy i–bVII–bVI… cho đủ đa dạng.
- **Để Em Rời Xa:** Bb–C–Dm là bVI–bVII–i; có D7 hướng Gm. D7 là màu át cục bộ, không phải cứ thấy F# là đổi toàn bài sang D trưởng.
- **Chưa Bao Giờ:** Dbmaj7–Cm7–Bbm7–Abmaj7 cho bVI–v–iv–bIII trong Fm (quy ước bậc so với gam trưởng cùng chủ âm). Có **v thứ** lẫn những chỗ C7 át trưởng. Đừng ép mọi Cm7 thành C7 hoặc rải E tự nhiên trên mọi ô Fm.
- **Chúng Ta Không Thuộc Về Nhau:** F–G–Am–Em, các mở rộng m7/9/11 và bè trong. Vòng bVI–bVII–i–v mang màu thứ dù không có leading tone ở mọi vòng.

### Voicing có bằng chứng trực tiếp

- **Người Hãy Quên, ô 9:** LH D2, bass G#2 ngắn tiến A2; RH lặp **C4–E4–F4–A4**. Với D làm gốc, RH là **b7–9–b3–5**, một voicing Dm9 bỏ gốc.
- **Cảnh báo dữ liệu:** chính ô này XML ghi D9 và add #11, nhưng cụm RH có F tự nhiên, không có F#. Không lấy nhãn đó để dạy bộ soạn “D dominant/Lydian dominant”. G# ở LH là tiếng ngắn dẫn A, không tự chứng minh một mode ổn định.
- **Người Hãy Quên, ô 48:** Em7b5 có LH E3–Bb3–D4; sau đó A với G và C#; về Dm9 ở ô 49. Đây là bằng chứng cụ thể cho **iiø–V–i**, trong đó C# tạo lực hút về D.
- **Chúng Ta, ô 3:** LH nêu A/G/C, RH E/C và D/G. Có b3, b7, 11; D là tension 11 của Am, không phải bằng chứng riêng cho A Dorian.

### Câu chạy và chromatic

- **Người Hãy Quên, ô 1:** nét trên E–D–C–A–F của Dm: 9–1–b7–5–b3. Nốt màu 9 có thể mở câu; không bắt mọi câu bắt đầu bằng gốc hoặc bậc 3.
- **Ô 7:** G–G#–A là tiếp cận chromatic ngắn. **Ô 47–48:** có G–G#–A và F–F#→G qua vạch nhịp. Học đích giải và vị trí ngắn/dài; đừng thêm nốt ngoài gam ngẫu nhiên cho “jazzy”.
- **Chưa Bao Giờ, ô 22**, đã xác nhận là fill: chuỗi chùm Ab/C/Eb → F/Ab/C qua các quãng tám rồi hạ xuống. Đây là phát triển thế hợp âm và đổi âm khu; không phải một gam đơn chạy đều. Bass cũng chuyển F→Eb→Db, nên nhãn Db không mô tả hết mọi thời điểm.
- **Để Em Rời Xa, ô 59** sau nâng Ebm: các cụm D#–F#–G#–A#–C# cho đầy đủ tập nốt **Ebm pentatonic** ở đoạn này. Có bằng chứng cục bộ thật về ngũ cung, nhưng dưới dạng cụm/rải; không suy ra toàn bộ bài dùng duy nhất ngũ cung.
- **Để Em, ô 40:** đầu ô có D–F#–A trong câu fill, khác với cách đọc máy chỉ bám nhãn A13. Phải đối chiếu nốt và bass trước khi gán scale; chưa chốt tên mode tại đây.

## 4. Anh nối khoảng trống bằng gì? Có passing chords không?

**Có**, nhưng nhiều khoảng nối không phải đổi hợp âm:

| Thủ pháp | Ví dụ / dấu hiệu | KT nên học |
|---|---|---|
| LH chuyển động khi RH ngân | Chúng Ta, ô 23→24, đã được người dùng giải thích | Đây có thể là bè đệm đối đáp, không tự nhận là “ca sĩ nghỉ” |
| Đón hợp âm trước vạch ô | Người Hãy Quên, Gm7 tại 7/3.5 nối sang 8 | Lưu thời điểm đổi thật; không ép mọi hợp âm vào phách đầu |
| Bass tiếp cận nửa cung | G#→A tại Người Hãy Quên ô 9 | Một tiếng bass dẫn, không đổi cả hợp âm RH thành #11 |
| Rải/nối nốt của cùng màu hòa âm | Có Em ô 5; Chưa Bao ô 22 | Giữ hình và âm đích, không đổi hợp âm ở mỗi tiếng chạy |
| Hòa âm chromatic ngắn | Người Hãy Quên ô 34: Gm→Gb→Fsus; bass G→F#→F, Bb giữ chung | Có chuyển hòa âm thật; Gb trên sheet được voicing thiếu quãng 5, không bịa thêm nốt |
| Lướt cả thế bấm rồi trở lại | Người Hãy Quên ô 36: Fmaj7→Emaj7 (0.5 phách)→Fmaj7; LH F/E→E/D#, RH E/A→D#/G# | Đây là ví dụ rõ về màu chromatic lướt/sideslip, khác hợp âm ở cả ô |
| Tạo lực hút chức năng | Người Hãy Quên 48→49: Em7b5→A→Dm | iiø–V–i là một lựa chọn, không chèn bắt buộc vào mọi khe |

Không thể báo một tỉ lệ chính xác “anh chỉ dùng passing X lần/Y ô” khi nhãn hợp âm và ranh hát–đàn còn sai. Đặc biệt, ô 24 và ô 56 của Chúng Ta có nét giống nhau nhưng **vai trò lời khác nhau**: không được gắn nhãn bằng so khớp hình nốt đơn thuần. Bass Eb2 ô 77 đã được người dùng xác nhận có chủ ý, nhưng chưa đủ để chốt tên thủ pháp hòa âm; giữ đánh dấu cần đối chiếu video.

## 5. Bản intro Bossa thứ đã đưa vào KT lần này

### Phần học từ nguồn và phần KT tự soạn

- Một nguồn nhất quán: **intro Người Hãy Quên Em Đi, XML 1–8**; học chuỗi i/iv mở rộng, nét 9–1–b7–5, câu đáp iv, chromatic dẫn bậc 5 và đón iv→V.
- **KT tự biên soạn lại giai điệu và timing** trên cell Bossa CP cải tiến; không tuyên bố là chép nguyên intro thầy. Không lấy câu chạy Hongkong rồi đổi tên thành Bossa.
- Không chép MIDI Dm tuyệt đối: hợp âm và nốt tính theo tonic bài. Ví dụ Am: Am9–Dm11–Am11–Dm11–Am9–Dm11–Am11–Dm7–E7.
- Thời lượng hợp âm: `[4,4,4,4,4,4,3.5,2,2.5]`, tổng **32 phách = 8 ô**. Dm7 ở đây kéo qua vạch ô; hiển thị 9 ký hiệu không có nghĩa 9 ô.
- Ô 1–2 mở–đáp; 3–4 phát triển với một câu chạy ngắn; 5–6 nhắc nét có biến đổi; 7–8 dẫn về phần hát. Có nghỉ, không chạy suốt cả câu.
- Ô cuối dùng V7 của **hợp âm mở bài thật** và nét 3–5–3 trên V. Đây là giản lược của KT so với A11 và phần nốt cuối nguồn, **không chép nguyên cách kết của Cà Pháo**. RH dừng trước phách cuối, LH còn bass tiếp cận ở 31.5 để dẫn về đầu hát.
- Bốn biến thể có chủ ý theo `take`; vòng hòa âm hiện cố định theo nguồn. Đây là **một thử nghiệm motif-based**, chưa phải mô hình học tự động nhiều sheet hay khả năng sáng tác vô hạn. Không hứa mỗi lượt mãi mãi là câu hoàn toàn mới.

### Giữ tiết tấu và tách onset khỏi gate

Không sửa cell `ca-phao-bossa-improved` đã nghe duyệt. Mọi tiếng LH lấy nguyên từ `renderPattern` của cell ấy. Nửa B của chu kỳ vẫn có các mốc 4, 4.5, 5.5, 6, 7, 7.5 (mốc RH/LH tùy tiếng).

RH giai điệu thay một phần cú chát; RH đệm chỉ giữ nếu **toàn trường độ** nằm trong khe giai điệu. Vì vậy bản solo không phải phát đủ mọi cú RH đệm rồi chồng thêm nốt lên trên. Chỉ kiểm giữ LH chưa chứng minh người nghe vẫn nhận rõ groove: đây là điều phải nghe duyệt.

`startBeat` và `durationBeats` độc lập: rút tiếng trước không tự kéo tiếng sau sớm; khe nghỉ hay ngân qua phải là quyết định rõ ràng. Nốt chromatic ngắn có đích giải, không có chuỗi hậu xử lý “xóa nốt → gập nốt → nâng nửa câu → chèn run” sau khi soạn.

Chọn âm khu cho cả đường nét theo bội số 12. Nếu tầm quá hẹp không chứa được câu, trả cảnh báo thay vì gập từng nốt. Với D4–C6 đã kiểm 12 chủ âm; trần 79 mặc định đã kiểm Am, không cam kết mọi giọng vừa tầm hẹp này. Thế bấm đệm còn dùng bộ dẫn bè hai tay hiện hữu của KT: **chưa nhập đầy đủ các voicing đặc thù vừa phân tích**.

### Phạm vi mã và nghe thử

- `src/reharm/style/caPhaoSolo.ts`: nhánh intro thứ Bossa CP cải tiến.
- `src/reharm/style/phraseSection.ts`: gọi nhánh đó khi đúng điệu, giọng thứ, thầy Cà Pháo/theo đệm, không có motif chọn riêng.
- Không thay intro trưởng, Bolero Tuấn, interlude/outro, màu hợp âm phần hát hay dữ liệu bình luận.
- Trang nghe: `http://localhost:5173/tools/bossa-intro.html` dùng **cùng hàm ráp và audio engine với app**, một lượt rồi dừng. Có thêm một ô chủ âm để nghe chỗ vào hát. Trang không lưu đè bài nào.
- Thư viện trong tab in-app kiểm tra lúc này không có “Để nhớ một thời ta đã yêu”; vì thế chưa thử trên chính bản bài đã lưu của người dùng. Không kết luận các bài ở Chrome bị mất chỉ vì kho của tab này trống.

## 6. Kiểm chứng và giới hạn

`scripts/audit_ca_phao.py` đọc rootfile MXL, backup/forward, chùm cùng onset, trường độ, nốt láy, tie, bass và degree của nhãn hợp âm. `--self-check` kiểm các trường hợp này bằng dữ liệu nhỏ. Khóa `attacks` là tên lịch sử và **vẫn chứa nốt nối tie**: không dùng độ dài danh sách làm số lần gõ. Đây là dụng cụ audit piano score-partwise, không phải parser MusicXML phổ dụng.

Cao độ MusicXML đã mang quãng tám phát ra; `octave-shift` dịch cách ký âm, không cộng thêm 12 lần nữa. Đã đối chiếu [đặc tả MusicXML của W3C](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/octave-shift/).

Test riêng `caPhaoBossaMinorIntro.test.ts` kiểm bản ráp đủ 32 phách, đúng nguồn, chuyển chủ âm, 4 biến thể, LH giữ nguyên mẫu, bass cuối 31.5, RH nghỉ chờ, tầm hẹp có cảnh báo và đích mở bài khác tonic. **Test không chứng minh giai điệu hay hoặc bàn tay thật chơi thoải mái.**

Kết quả kiểm ngày 12/9: 16 test riêng qua; `npm run build` qua (còn cảnh báo bundle lớn). Lần chạy toàn bộ trước khi thêm test cách ly cuối: **2580 qua, 6 lỗi**. Đã xuất HEAD cũ vào thư mục kiểm tạm, chạy lại với cùng PianoBrain: **2565 qua, đúng cùng 6 lỗi**. Sáu lỗi thuộc câu chạy vắt ô, tầm intro Linh Nhi, chromatic giang cũ, siết hợp âm kết và hai phép đo tầm Cà Pháo; không sửa/làm yếu các test đó để che lỗi. Trình duyệt đã xác nhận trạng thái “Intro · ô 1/8”, phát một lượt rồi dừng, không có lỗi console. Việc âm thanh hợp gu vẫn cần người dùng nghe.

Hướng tiếp theo sau nghe duyệt: nếu groove yếu, sửa vị trí/độ nhấn RH trước; nếu màu phô, xem nốt đang ngân cùng bass và hòa âm thực; nếu câu lủng củng, sửa quan hệ mở–đáp/đích đáp. Chỉ sau đó mới mở rộng thêm voicing, nguồn câu và vòng hòa âm. Không tự train vòng 2 trước khi người dùng nhận xét ba mặt: **tiết tấu – hòa âm – giai điệu**.
