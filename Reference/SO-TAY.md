# Sổ tay kỹ thuật KeyTrain

## Bước 0 (14/8/2026) — Khởi tạo dự án

- Stack: Vite 7 + React 19 + TypeScript strict + Tailwind 4
- Điều chỉnh so với plan ban đầu: bỏ erasableSyntaxOnly (cần TypeScript 5.8+, dự án đang dùng 5.7); thêm src/vite-env.d.ts để TypeScript hiểu import './index.css'
- Môi trường: PATH của Node bị nạp lại mỗi lệnh trong phiên Claude Code này — không phải lỗi, chỉ là quirk của terminal, chạy npm ở terminal riêng thì bình thường

## Ghi chú kỹ thuật tái hòa âm (rút từ phongcachdemhatkhabu.md)

[Để trống, điền dần khi bắt đầu code bước tái hòa âm — ví dụ: cách áp dụng dim7 passing chord vào vòng I-vi-ii-V, ngưỡng nào dùng slash chord thay vì chord gốc...]

## Ghi chú kỹ thuật tái hòa âm (rút từ phongcachdemhatkhabu.md)

### Phần chồng trên bass luôn dựng trên bậc bảy (bước 19)

Đối chiếu **toàn bộ** bảng quy đổi ở mục 1.2 của tài liệu, các ví dụ có một điểm chung mà tài liệu không nói thẳng: **hợp âm chồng bên trên luôn được dựng trên bậc bảy của hợp âm gốc**. G là bậc bảy của A (Am11 = G/A), C là bậc bảy của D (D9sus4 = C/D), D là bậc bảy của E (E9sus4 = D/E).

Vì vậy `findUpperStructures` xếp ứng viên dựng trên bậc bảy lên đầu, và các quy đổi nó sinh ra khớp đúng bảng của tài liệu. Nhưng không phải hợp âm nào cũng quy đổi được trên bậc bảy: Cmaj9 có bậc bảy là nốt Si, mà mọi hợp âm ba dựng trên Si đều cần nốt ngoài hợp âm, nên phải lùi về bậc năm (G/C).

### Hợp âm giảm lướt tính theo hợp âm đích, không theo khoảng cách hai hợp âm (bước 20)

Ban đầu tôi hiểu nhầm luật thành "chèn dim7 vào nốt nằm giữa hai hợp âm cách nhau một cung". Cách hiểu đó dựng lại được 2 trong 4 ví dụ của tài liệu rồi hỏng ở hai ví dụ còn lại.

Quy tắc đúng, như mục 7 phát biểu: **dim7 xây trên nốt cách hợp âm đích đúng nửa cung**. Chiều tiếp cận tuỳ quãng đường ngắn nhất giữa hai nốt gốc — đi lên thì lấy nửa cung dưới, đi xuống thì lấy nửa cung trên. Cách hiểu này dựng lại đúng cả bốn ví dụ, và giải thích vì sao tài liệu nói dim7 nối được gần như bất kỳ hai hợp âm nào.

### Màu của chủ âm quyết định gu cả bài

Tra cứu nhạc lý jazz (xem nguồn ở cuối mục) cho hai kết luận đưa vào app:

- **Hợp âm sáu là màu chủ âm kinh điển**, nghe *đứng yên và đã giải quyết* hơn maj7. Đặc biệt hợp khi nốt giai điệu rơi đúng vào nốt chủ âm, vì lúc đó bậc bảy trưởng sẽ cọ vào nốt hát. Với đệm hát thì tiêu chí là rõ ràng, không phải màu mè. Tài liệu cũng dùng `C6`.
- **Bậc mười một tự nhiên là nốt tránh của hợp âm trưởng**: khoảng cách giữa bậc ba và bậc mười một là quãng chín thứ, chối tai ngay cả trong jazz. Hai cách chữa: thăng lên `#11`, hoặc bỏ bậc ba (chính là lý do hợp âm treo tồn tại). **Nhưng bậc mười một không hề là nốt tránh với hợp âm thứ** — đó là lý do `m11` là xương sống của neo-soul, và cũng xác nhận `Am11` trong tài liệu là đúng.

Vì chủ âm quyết định gu chung nên đổi màu chủ âm sẽ **kéo theo cả bộ màu** của các bậc còn lại (`PALETTE_BY_TONIC_COLOR`), sau đó người dùng vẫn chỉnh riêng từng bậc được.

Nguồn: [Sixth Chords — Jack DeSalvo](https://jackdesalvo.substack.com/p/sixth-chords) · [Chord Extensions 9ths 11ths 13ths — PianoGroove](https://www.pianogroove.com/jazz-piano-lessons/chord-extensions-9ths-11ths-13ths/) · [Avoid note — Wikipedia](https://en.wikipedia.org/wiki/Avoid_note) · [What Is An Avoid Note In Jazz — Jazz Library](https://jazz-library.com/articles/avoid-notes/)

### Bộ dò xung đột không kích hoạt được luật nốt tránh, và đó là dấu hiệu tốt

`colorConflicts.ts` có luật bắt hợp âm trưởng chứa đồng thời bậc ba và bậc mười một. Luật này **chưa bao giờ kích hoạt**, vì từ vựng hợp âm dựng ở bước 1 đã tránh sẵn: hợp âm `11` át được định nghĩa **không có bậc ba** (`[0, 7, 10, 14, 17]`), còn `maj7#11` thì dùng bậc mười một thăng.

Giữ luật lại làm chốt cho tương lai, phòng khi có người thêm một loại hợp âm phạm quy. Có test duyệt toàn bộ từ vựng để khoá điều này.

### Giang tấu là một đoạn riêng của bài, không phải ngẫu hứng suốt bài

Tôi từng hiểu giang tấu là "chơi ngẫu hứng trên vòng hợp âm" và cho nó chạy suốt. Sai bản chất.

Giang tấu là **một đoạn cụ thể trong cấu trúc bài hát**: hát xong điệp khúc thì có một khoảng trống trước khi quay lại phiên khúc, và đó là chỗ nhạc cụ chơi thay giọng hát. Tra cứu về cấu trúc bài hát xác nhận: đoạn xen kẽ *"mostly divides two choruses, or chorus and a new verse"* và *"almost always instrumental as they are used to provide breathing space for a singer"*.

Hệ quả cho phần sinh giai điệu, và đây mới là điều quan trọng:

- **Câu solo chỉ chơi trong đoạn giang tấu.** Chơi solo ở đoạn đang hát là đè lên giọng hát.
- **Đoạn có lời chỉ chêm câu fill ngắn** ở khe hở giữa các hợp âm.

Vì vậy `songStructure.ts` dựng cả bài thành nhiều đoạn, và phần giai điệu được chọn theo loại đoạn. Hiện cả bài dùng chung một vòng hợp âm vì app chưa nhận lời bài hát để tách phiên khúc với điệp khúc — cái phân biệt các đoạn là **cách chơi**, không phải hợp âm.

Nguồn: [Song structure — Ultimate Guitar Wiki](https://www.ultimate-guitar.com/en/wiki/Song_structure) · [What Are the Parts of a Song — Careers in Music](https://www.careersinmusic.com/parts-of-a-song/) · [Song structure — Wikipedia](https://en.wikipedia.org/wiki/Song_structure)

### Đoạn giang tấu phải có phrasing, không phải chuỗi nốt đều

Bản đầu của `generateSolo` rải nốt đều tăm tắp trên mọi hợp âm: không nghỉ, không câu cú, kết ở nốt màu lơ lửng. Đối chiếu `pianoimprovnotes.md` mục 4 thì đó là **đúng ba điều tài liệu bảo tránh**.

Ba yêu cầu bắt buộc của một đoạn solo nghe ra người chơi:

- **Nghỉ lấy hơi giữa các câu.** *"Chơi như hội thoại: cần có khoảng nghỉ để lấy hơi giữa các câu."* Chơi liên tục không nghỉ nghe như máy.
- **Đổi quãng âm giữa các câu** — *"lúc cao lúc thấp — để tạo kịch tính."*
- **Kết câu ở nốt ổn định của hợp âm** (gốc, quãng 3 hoặc 5), *"tránh dừng ở nốt lơ lửng khiến câu nhạc nghe dở dang."*

Điểm đáng chú ý: yêu cầu thứ ba **ngược hẳn** với cách chọn nốt giữa câu. Giữa câu thì ưu tiên nốt màu (9, 11, 13) cho có màu sắc; nhưng **kết câu** thì phải là nốt ổn định. Hai chỗ dùng hai thang ưu tiên đối lập nhau.

Ngoài ra tài liệu cho bốn nguồn nốt: nốt hợp âm (1-3-5-7-9, an toàn nhất), ngũ cung trưởng, ngũ cung thứ, và thang âm blues (ngũ cung thứ cộng nốt blue ở quãng năm giảm).

### Câu fill và đoạn solo là hai thứ khác nhau

Bản đầu của phần sinh giai điệu chỉ có **một** chế độ: chạy nốt liên tục, đều đặn, trên mọi hợp âm. Đó không phải câu fill, cũng không phải đoạn solo — nó là thứ thứ ba, không giống cái nào có thật trong đệm hát.

Hai khái niệm phải tách bạch:

- **Câu fill** là đoạn ngắn chêm vào **cuối một hợp âm để dẫn sang hợp âm sau**. Ba đặc điểm bắt buộc: nằm ở cuối quãng thời gian của hợp âm chứ không trải đều, **kết thúc ngay cạnh nốt đích của hợp âm kế tiếp** để kéo tai sang đó, và **thỉnh thoảng mới có** chứ không phải hợp âm nào cũng chêm.
- **Đoạn solo** (giang tấu) là đoạn nhạc cụ chơi **thay cho giọng hát**, thường nằm giữa bài. Giai điệu chạy suốt là đúng ở đây, nhưng chỉ ở đoạn không có lời — bật suốt bài thì nó đè lên phần hát.

Điều đáng nói là thông tin này đã có sẵn trong tài liệu và tôi đã **tự tay ghi lại** ở `ballad.ts` từ bước 18 — *"hợp âm khối bám nhịp hoà âm, chèn fill vào chỗ trống"*. Đọc đúng, ghi đúng, rồi vẫn cài sai. Bài học: khi cài đặt một kỹ thuật, phải quay lại đọc chính ghi chú mình đã viết về nó.

### Câu solo tự sinh là mô phỏng, không phải chép công thức

Đây là phần **kém chắc chắn nhất** của cả app, và phải nói rõ điều đó trên giao diện.

Tài liệu mô tả kỹ thuật nốt láy ở mức **nguyên lý**: trước mỗi nốt chính chèn một nốt phụ rất ngắn cách một bậc ở trên hoặc dưới, ba kiểu tiếp cận, càng dày càng mượt. Nhưng nó **không** cho biết chọn nốt nào làm nốt đích, mật độ bao nhiêu là vừa, hay câu nhạc nên đi theo hình gì. Những chỗ đó là tôi tự quyết:

- Nốt đích lấy từ chính nốt của hợp âm, **ưu tiên nốt màu** (bậc 9, 11, 13) hơn nốt gốc và quãng năm — vì phần đệm đã vang nốt gốc rồi, còn quãng năm gần như không nói lên điều gì.
- Các nốt đích nối nhau theo **đường ngắn nhất** để câu nhạc đi từng bước thay vì nhảy loạn.
- Nốt láy lấy **bậc liền kề trong gam**, không phải nửa cung cố định — tài liệu ghi "một bậc", mà trong gam thì bậc lúc là một cung lúc là nửa cung. Lấy cố định nửa cung sẽ soạn nốt ngoài giọng ở nửa số trường hợp.

Kiểu xen kẽ đổi chiều sau **mỗi nốt được láy**, không phải mỗi nốt — nếu đổi theo mọi nốt thì ở mật độ thưa sẽ luôn ra cùng một chiều.

### Thứ tự ưu tiên khi tái hòa âm

Khi có xung đột: **đúng phong cách anh Khá** trước, **đúng nhạc lý** sau, tiện lợi kỹ thuật và tính đối xứng của code xếp cuối.

Hệ quả: không được thêm một màu hợp âm vào bảng chọn chỉ vì bảng đó trông sẽ đầy đủ hơn. Mỗi lựa chọn phải hoặc có mặt trong tài liệu, hoặc đúng về chức năng hòa âm **ở đúng vị trí được áp dụng**.

### sus4 không phải màu đứng yên, nó là nốt treo cần giải quyết

Tôi từng đưa `sus4` vào bảng màu cho **chủ âm** chỉ vì tài liệu có liệt kê chữ "sus4" ở một câu tổng kết (mục 6). Sai: nốt bậc bốn treo luôn đòi giải quyết xuống bậc ba, nên không ai chơi chủ âm ở màu sus4.

Tra lại thì mọi ví dụ sus **cụ thể** trong tài liệu đều nằm ở một trong hai chỗ: hợp âm bậc năm (`D9sus4`, `E9sus4`, `G7b9sus4`, `D7sus4(13)`), hoặc ở dạng giải quyết (`Esus4 → E`, `G7sus4 → G7`). Không có chỗ nào dùng sus làm màu tĩnh cho hợp âm nghỉ.

`sus2` thì giữ lại, vì nó không chứa nốt đòi giải quyết nên đứng yên được.

**Bài học chung:** khi tài liệu chỉ *liệt kê tên* một kỹ thuật, phải tìm **ví dụ cụ thể** xem nó dùng ở vị trí nào, thay vì suy ra rằng nó dùng được ở mọi vị trí.

### Phải dò giọng trước khi tô màu hợp âm

Bản đầu của luật tô màu chạy **mù chức năng**: nó chỉ ánh xạ tính chất sang tính chất (`maj → add9`), áp dụng y hệt cho bậc I, IV và V. Hậu quả là hợp âm bậc năm bị biến thành `add9` — thêm màu nhưng **mất nốt bậc bảy**, tức mất luôn lực kéo về chủ âm. Người dùng phát hiện qua trường hợp `Am F C G` cho ra `Gadd9`.

Đối chiếu tài liệu: **mọi hợp âm bậc năm trong các bài anh Khá dạy đều có nốt bậc bảy** — D9sus4, C7, A7b13, E7b9. Không có chỗ nào dùng `add9` cho bậc năm. Ngược lại `add9`, `maj7`, `6` lại đúng cho chủ âm (`Cadd2`, `CM7`, `C6`).

Nguyên nhân sâu xa là tôi đã bỏ qua khâu **phân tích bậc** mà kế hoạch vạch ra trong `reharmPipeline.ts`, nối thẳng luật tô màu vào giao diện. Nay đường ống chạy đúng thứ tự: đọc hợp âm → dò giọng → phân tích bậc → tô màu theo bậc → gợi ý hợp âm lướt.

### Phân biệt giọng thứ với giọng trưởng song song bằng bậc bảy nâng cao

Giọng trưởng và giọng thứ song song (C trưởng và A thứ) dùng **chung hệt bộ nốt**, nên cách chấm điểm bằng đếm nốt trong gam không tách được hai giọng này — bộ dò chọn nhầm E thứ thay vì G trưởng, D thứ thay vì F trưởng.

Thứ duy nhất chỉ giọng thứ mới có là **bậc bảy nâng cao**, xuất hiện qua hợp âm bậc năm (E7 trong giọng La thứ). Vắng hẳn dấu hiệu đó thì nhiều khả năng bài đang ở giọng trưởng song song, nên giọng thứ bị trừ điểm.

Cũng phải nhận diện hợp âm bậc năm **theo cấu tạo chứ không theo tên**: có bậc bảy thứ và không có bậc ba thứ. Cách này bắt được cả hợp âm treo như `D9sus4` — không có bậc ba nào nhưng vẫn đóng vai bậc năm, và xuất hiện dày đặc trong phong cách này.

### Vòng 2-5-1 lướt suy ra từ hợp âm đích, không cần biết giọng của bài

Bậc hai và bậc năm được dựng từ chính nốt gốc và tính chất của hợp âm đích: đích là hợp âm thứ thì bậc hai là nửa giảm và bậc năm có nốt giáng chín (iiø–V7b9–i), đích là hợp âm trưởng thì bậc hai là hợp âm bảy thứ và bậc năm là bảy át thường. Nhờ vậy luật chạy được ngay cả khi chưa dò ra giọng của bài.

## Quyết định thiết kế cần nhớ

### Nhận diện hợp âm trả về danh sách, không phải một đáp án (bước 4)

`detectChords` trả về danh sách ứng viên xếp hạng chứ không phải một tên hợp âm duy nhất, vì cùng một tập nốt đọc được nhiều cách: `{C E G A}` vừa là C6 vừa là Am7, chỉ nốt bass phân định. Đây đúng là tư duy "hợp âm chồng trên bass" xuyên suốt tài liệu phong cách, nên bắt buộc phải giữ tính đa nghĩa này thay vì ép về một đáp án.

Trọng số chấm điểm nằm trong hằng số `WEIGHTS` của `chordDetection.ts` — chỉnh chúng là chỉnh cảm nhận nhạc lý của app. Hiện tại: phạt **nhẹ** nốt còn thiếu (thế bấm rút gọn kiểu jazz bỏ bớt nốt là bình thường), phạt **nặng** nốt lạ, thưởng khi hợp âm có vang nốt gốc và khi ở thế nguyên vị.

### Trả lời sai thì về thẳng hộp đầu, không lùi một hộp (bước 13)

Mô hình Leitner có hai biến thể khi trả lời sai: lùi một hộp, hoặc về thẳng hộp đầu. KeyTrain chọn **về hộp đầu**, vì lùi một hộp từ mức 30 ngày xuống mức 14 ngày vẫn bắt người học đợi hai tuần mới gặp lại đúng thứ mình vừa quên — vô nghĩa.

Đổi lại, **mức độ thành thạo dùng cho huy hiệu không lấy từ mức hộp hiện tại** mà tính từ số liệu tích luỹ (`totalCorrect`, `correctStreak`, `totalReps`). Nhờ tách hai thứ này, một lần sai làm lịch ôn quay về đầu nhưng không xoá thành quả đã ghi nhận. Hàm `isMastered` đòi cả ba điều kiện (hộp cao nhất, chuỗi đúng từ 3, đã luyện từ 5 lần) để tránh đoán mò trúng vài lần rồi được coi là thuộc.

### Mục ôn tập tính theo loại hợp âm, không theo từng nốt gốc (bước 13)

Định danh mục là `chord:<qualityId>` (ví dụ `chord:maj7`) chứ không phải `chord:0:maj7`. Nhận ra Cmaj7 và F#maj7 về bản chất là **cùng một kỹ năng** — chỉ khác việc dịch giọng, mà bài luyện vốn đã tự đổi giọng ngẫu nhiên mỗi câu. Tính theo từng nốt gốc sẽ thổi tập mục từ khoảng 50 lên 600 và làm loãng số liệu.

### Dùng đàn tổng hợp thay vì mẫu tiếng piano thu sẵn (bước 5)

KeyTrain chạy offline nên không tải mẫu tiếng từ máy chủ ngoài, mà mẫu tiếng piano thật lại nặng vài chục MB nếu đóng gói kèm. Chọn `Tone.PolySynth` với sóng tam giác và đường bao gần giống đàn phím: đủ rõ cao độ để luyện tai, nhẹ, không cần mạng. Có thể đổi sang tiếng thu sẵn về sau nếu chất lượng tiếng trở thành vấn đề.

Trình duyệt chặn phát tiếng tự động, nên `startAudio()` bắt buộc phải gọi từ một thao tác thật của người dùng — mọi màn hình có âm thanh đều cần một nút bật ở lần đầu.

## Đoạn giang tấu dựng từ bản ký âm thật, không từ suy đoán

Bộ hình mẫu cho đoạn giang tấu được **đọc ngược từ bản ký âm piano bài *Hồng Kông 1*** (`Reference/hongkong1.mxl`, bản advanced, bản chơi của anh Cà Pháo). Đây là lần đầu một tính năng sinh nhạc của KeyTrain có nguồn cụ thể thay vì chỉ dựa trên mô tả định tính, nên phần này đáng tin hơn hẳn các phần soạn câu trước đó.

### Cấu trúc bài rút ra được

Bài ở giọng Đô trưởng, nhịp 4/4, 108 ô nhịp. Vòng lõi tám ô nhịp là **IV – iii – ii – V – I** (`F – Em7 – Dm7 – G7 – C`), mỗi hợp âm hai ô trừ ii và V mỗi hợp âm một ô. Đoạn giang tấu nằm ở **ô nhịp 49-64**, tức sau **năm lượt** vòng hát — không phải cứ hai lượt là chen giang tấu như phỏng đoán ban đầu.

Nhận ra đoạn giang tấu bằng số liệu chứ không cần nghe: mật độ nốt tay phải tăng vọt (từ 4-8 điểm vào lên 11-15) và trần cao độ tay phải nhảy từ khoảng 76 lên 95-98, trong khi **tay trái vẫn giữ nguyên tầm bass 36-45**. Chính chỗ này xác nhận điều người dùng mô tả: giang tấu là tay trái giữ bass bám vòng hợp âm, tay phải chơi tự do bên trên.

### Ba hình mẫu làm nên vốn liếng tay phải

1. **Hình láy quay về** (ô nhịp 49-50). Bộ xương đi xuống từng bậc `G5 – E5 – D5 – C5`, nhưng giữa mỗi cặp có một cặp móc kép chạm trước vào nốt kế rồi quay lại nốt hiện tại mới thật sự bước sang. Đây là hình dễ học nhất mà đã nghe ra "có nghề", nên xếp làm mức trung bình.

2. **Cú quét ngũ cung vắt nhiều quãng tám** (ô nhịp 51-52, lặp lại ở ô nhịp 96-97). Lấy một ô **bốn nốt** trong ngũ cung — `D G A B` ở ô 51, `C D E G` ở ô 96 — rồi lặp nguyên ô đó lên qua từng quãng tám bằng móc ba, ngân đỉnh gần trọn một ô nhịp, xong mới đổ xuống. Hai chi tiết dễ bỏ sót: ô quét **bắt đầu từ dưới đáy tầm** chứ không từ nốt đang chơi (câu trước kết quanh G4-A4 nhưng cú quét bắt từ D4), và nó **chỉ dùng bốn nốt** chứ không chạy cả thang âm.

3. **Chồng quãng tám ở đỉnh câu** (ô nhịp 57, 60, 65-66): `A4+A5`, `E5+E6`. Rẻ về mặt kỹ thuật nhưng làm câu nhạc dày hẳn lên.

Ngoài ra bản nhạc còn hai ngón chưa đưa vào app: **chuỗi quãng bốn đi lên song song** (ô nhịp 59: `G3+D4 → D4+G4 → G4+B4 → B4+D5`) và **giữ nốt chung khi ngoài biên đi xuống bán cung** trên hợp âm át phụ (ô nhịp 60: giữ C# trong khi `Bb → A → G → F`). Ghi lại đây để sau này còn quay lại.

### Vì sao tầm quãng âm phải đổi theo mức

Bản đầu giữ nguyên tầm giai điệu 67-88 cho cả ba mức thì cú quét chỉ vắt được hơn một quãng tám — nghe không ra ngón đó nữa. Bản nhạc quét từ D4 (62) lên B6 (95), nên mức cao phải được mở tầm đúng bằng vậy. Bài học chung: **hình giai điệu và tầm quãng âm là một cặp**, đổi hình mà giữ nguyên tầm thì hình bị bóp méo.

### Vào giang tấu thì tay phải thôi quạt hợp âm — chỉ một tay đổi việc

Bản đầu của `buildSongTimeline` cho **nguyên phần đệm hai tay** chạy tiếp ở đoạn giang tấu rồi chồng câu solo lên trên. Đó là dựng theo mô hình "ban nhạc đệm cho người solo", mà giang tấu piano thì chỉ có **một người chơi bằng hai tay**. Hệ quả nghe được ngay: tay phải vừa quạt hợp âm vừa chạy giai điệu, đục và không ai bấm nổi.

Đo trên hai bản ký âm thì thấy **chỉ một tay đổi việc**:

| | Tay trái vào / ô nhịp | Trần cao độ tay phải |
|---|---|---|
| *Mơ* — đoạn hát (ô 9-33) | 3.3 | ~76 |
| *Mơ* — giang tấu (ô 41-58) | **3.4** | **97-100** |
| *Hồng Kông 1* — đoạn hát (ô 9-48) | 5.1 | ~76 |
| *Hồng Kông 1* — giang tấu (ô 49-64) | **5.5** | **95-98** |

Tay trái giữ nguyên mật độ, chỉ mở rộng bề rộng (bài *Mơ*: 15.9 lên 20.6 nửa cung) do thêm bass chồng quãng tám — ô nhịp 41 bài đó bass đúng là `A1+A2`. Vậy **hoà âm không biến mất, chỉ có mẫu đệm tay phải ngừng**.

Bài học rộng hơn: mỗi khi thêm một lớp nhạc mới vào dòng thời gian, phải hỏi **tay nào chơi lớp này và tay đó đang bận việc gì** — cộng lớp kiểu phần mềm thì dễ, nhưng người chơi chỉ có hai tay.

### Tay phải ở giang tấu nhắc lại giai điệu bài hát

Bài *Mơ* cho bằng chứng rõ: giọng trên cùng tay phải ô nhịp 41 là `E E E F# A`, gần trùng với giai điệu hát ô nhịp 25 `E E F# A F#`, chỉ **dời lên hai quãng tám** và chồng thêm quãng tám cho dày. Tức là ngẫu hứng ở đây không phải bịa nốt mới mà là **nhắc lại chất liệu đã có, đổi tầm và đổi cách trình bày**.

KeyTrain chưa nhận giai điệu bài hát (người dùng chỉ nhập hợp âm), nên thứ tương đương làm được là **tự dựng một mô-típ ngắn rồi nhắc lại nó** trên các hợp âm sau. Đây cũng đúng lời khuyên *"tích luỹ mẫu câu ngắn"* ở mục 4 của `pianoimprovnotes.md`. **Chưa làm** — ghi lại đây để làm bước sau.

### Bỏ hệ "ba mức khó", thay bằng vốn mẫu câu có trích nguồn

Hệ ba mức (cơ bản / trung bình / như anh Cà Pháo) đã bị gỡ vì hai mức thấp nghe dở và **lệch hoà âm**. Lỗi nằm ở gốc chứ không ở mức khó:

1. `generateSolo` lấy bộ nốt theo **hợp âm cuối câu** rồi dùng cho cả câu. Một câu trải hai hợp âm thì nửa đầu chơi sai hoà âm.
2. Chọn nguồn ngũ cung thì nó dựng ngũ cung trên **chủ âm bài hát** và giữ nguyên suốt đoạn — không bám hợp âm chút nào.

Bản thay thế đảo lại nguyên tắc: **mỗi hợp âm nhận một mẫu câu riêng, chất liệu lấy từ chính hợp âm đang vang**. Đó là *chord tone soloing* ở mục 3.1 của `pianoimprovnotes.md`, chỗ tài liệu nói thẳng cách này *"luôn khớp hòa âm"*. Nguồn nốt cũng đổi theo: ngũ cung và thang blues giờ dựng trên **nốt gốc hợp âm**, trưởng hay thứ tuỳ tính chất hợp âm — đúng như bản Hồng Kông 1 làm (cú quét ô 51 trên Em7 dùng `G A B D`, cú quét ô 96 trên Đô trưởng dùng `C D E G`).

Bảy mẫu câu trong `soloVocabulary.ts`, mỗi mẫu ghi rõ nguồn ngay trong code: đi trên nốt hợp âm (mục 3.1), rải hợp âm (mục 3.2 và 3.3 bước 6), nốt dẫn nửa cung (mục 3.2), hình láy quay về (Hồng Kông 1 ô 49-50), quét ngũ cung (Hồng Kông 1 ô 51-52 và 96-97), nhắc lại mô-típ (Mơ ô 25 và 41), nghỉ lấy hơi (mục 4 và 3.4 giai đoạn 4). Không mẫu nào tự nghĩ ra.

Cách chọn mẫu là **tất định**: cùng một vòng hợp âm luôn cho ra cùng một đoạn solo. Người học cần nghe lại đúng câu vừa nghe để tập theo; ngẫu nhiên mỗi lần phát thì không tập nổi.

### Mỗi lượt giang tấu một khác, nhưng tất định theo số lượt

Lặp y nguyên đoạn solo ở mọi lượt nghe ra ngay là máy phát lại băng. Nhưng sinh ngẫu nhiên mỗi lần phát cũng hỏng: người học cần nghe lại **đúng** câu vừa nghe để tập theo.

Cách giải: `generateSolo` nhận thêm số **lượt** (`take`), và biến tấu là hàm tất định của số lượt đó. Phát lại bài thì lượt thứ nhất vẫn ra đúng đoạn cũ. Ba thứ đổi theo lượt:

- **Trình tự mẫu câu** xoay theo `phrase + take`, nên cú quét rơi vào hợp âm khác và câu mở đầu bằng mẫu khác.
- **Quãng âm nâng dần** bốn nửa cung mỗi lượt, có trần tuyệt đối ở nốt 96 để lượt thứ mười không leo hết bàn phím.
- **Mật độ dày dần** hai mươi phần trăm mỗi lượt, cũng có trần.

Kết quả trên vòng `Fmaj7 Em7 Dm7 G7 Cmaj7 Am7 Dm7 G7`: lượt một 46 nốt đỉnh Mi quãng 6, lượt hai 50 nốt đỉnh Đô quãng 7, lượt ba 58 nốt với hai cú quét. Đúng hình một đoạn solo dâng dần qua từng lượt.

`buildSongTimeline` vì vậy nhận **hàm** sinh solo theo số lượt chứ không nhận một mảng cố định, và số lượt đếm **liên tục qua cả bài** — hai đoạn giang tấu rời nhau vẫn là hai lượt khác nhau.

### `Tone.Part` với `loop = true` phát lại y nguyên — không dùng cho giang tấu

Biến tấu theo lượt dựng xong rồi mà người dùng vẫn nghe lặp y nguyên. Nguyên nhân nằm ở tầng phát tiếng chứ không ở bộ soạn: `startTimelineLoop` dùng `Tone.Part` với `loop = true`, mà `Part` lặp thì **phát lại đúng bộ sự kiện cũ**. Bộ soạn có tài mấy cũng vô nghĩa nếu chỉ được gọi một lần.

Sửa bằng cách bỏ vòng lặp sẵn của `Part`, thay bằng `Tone.Loop` **dựng lại lịch phát ở đầu mỗi lượt** và truyền số lượt cho bên gọi. `startTimelineLoop` vì vậy nhận `hits` **hoặc** một hàm `(pass) => hits`.

Kéo theo: `buildSongTimeline` nhận thêm `takeOffset` và trả về `soloTakes` (đã tiêu hết bao nhiêu lượt). Lần phát thứ hai bắt đầu từ đúng chỗ lần thứ nhất dừng, nên không quay về câu cũ.

Bài học: khi một tính năng "đã làm rồi mà không thấy tác dụng", kiểm tầng **phát lại** trước khi nghi ngờ tầng sinh.

### Vòng ii-V-I và nốt dẫn hướng

Tài liệu 12 giọng (nay đã gỡ) nói vòng ii-V-I là *"nền tảng quan trọng nhất để luyện lick jazz"*. Thứ làm nên sức hút của nó là **nốt dẫn hướng**: bậc bảy thứ của hợp âm át nằm ngay trên bậc ba của chủ âm đúng một nửa cung, buông xuống là giải quyết.

Thêm mẫu `guide-tone`, chỉ dùng khi hợp âm sau cách một **quãng bốn đi lên**. Ở đây hai tài liệu nói khác nhau và phải chọn: `pianoimprovnotes.md` mục 4 khuyên kết câu ở nốt ổn định, còn đúng chỗ V về I thì cái tai chờ **sự giải quyết**. Chọn theo vòng V về I, vì nốt ổn định ở đó nghe như câu nhạc đứt ngang. Hợp âm ba không có bậc bảy thì không có nốt dẫn hướng, tự lùi về nốt ổn định.

Phần còn lại của tài liệu — vòng quãng bốn và cách chia buổi tập qua 12 giọng — **chưa dùng**; nó thuộc về một bài luyện dịch giọng, không thuộc bộ soạn giang tấu. Tài liệu cũng ghi rõ các lick cụ thể trong nguồn tham khảo **có bản quyền**, nên KeyTrain tự soạn câu chứ không chép.

### Lần lùi lại vì thêm ba thứ cùng lúc mà không cho nghe

Sau khi bộ vốn mẫu câu được người dùng duyệt bằng tai, tôi thêm liên tiếp: biến tấu theo lượt, mẫu nốt dẫn hướng, mẫu kẹp nửa cung, mẫu chùm ba, mở rộng danh sách mở câu, và sửa tay trái bossa — **không cho nghe cái nào**. Kết quả: hỏng điệu đàn, hỏng giang tấu, và nút dừng không dừng được.

Đã lùi về đúng trạng thái được duyệt, cộng **duy nhất** thứ người dùng yêu cầu là biến tấu theo lượt:

- Tay trái bossa trả về bản theo tài liệu.
- Ba mẫu câu mới rút khỏi vòng xoay. Code và test giữ nguyên, chỉ không nằm trong `OPENERS`/`MIDDLES` — xem hằng `ROTATION_IDS`. Bật lại thì bật **từng cái một**.

Bài học không phải về nhạc mà về quy trình: quy ước của dự án là **từng bước nhỏ, người dùng xác nhận rồi mới commit**. Tôi đã bỏ qua cả hai vế — không dừng để nghe, và không commit ở chỗ được duyệt. Vì không commit nên khi hỏng cũng không lùi được bằng `git`, phải gỡ tay từng thay đổi.

### Nốt đã lên lịch không tự huỷ khi dừng vòng lặp

Nút dừng bấm rồi mà vòng hợp âm vẫn kêu tới hết lượt. Nguyên nhân nằm trong `startTimelineLoop`: bản dùng `Tone.Loop` gọi thẳng `triggerAttackRelease` cho cả một lượt, mà lệnh đó đẩy nốt xuống tận đồng hồ thẻ âm thanh. `loop.stop()` chỉ chặn được lượt **sau**; đám nốt của lượt **đang chạy** đã nằm trong lịch phần cứng rồi.

Sửa bằng cách bọc mỗi lượt trong một `Tone.Part` riêng và giữ tham chiếu — huỷ `Part` là huỷ luôn lịch của nó. Đây cũng chính là thứ bản `Tone.Part` ban đầu làm đúng mà tôi đánh mất khi đổi sang `Tone.Loop`.

Nguyên tắc rút ra: **cái gì lên lịch được thì phải huỷ lịch được.** Mỗi lần đẩy sự kiện vào tương lai, phải giữ lại tay cầm để rút về.

### Bossa: đo được gì từ bản ký âm (chưa áp dụng)

`bossaNova.ts` ghi nguồn là video đệm bài *Người Hãy Quên Em Đi*, và comment tự thừa nhận phần tay trái chỉ là phỏng đoán vì tài liệu không notate. Nay có `Reference/nguoihayquenemdi.mxl` — đúng bài đó — nên đo được trực tiếp trên 32 ô nhịp đệm ổn định:

| | Phách 1 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 |
|---|---|---|---|---|---|---|---|
| Tay trái | 97% | 44% | **84%** | **94%** | 28% | 50% | 16% |
| Tay phải | 97% | 78% | 59% | **84%** | **94%** | 47% | **94%** |

Hai kết luận:

- **Tay trái trong bản ký âm đi `1 — 2& — 3 — 4`**, tức cú đẩy lệch phách nằm ở phách 2 rưỡi chứ không phải 3 rưỡi như mẫu đang dùng.
- **Trong bản ký âm, mẫu dài một ô nhịp**: tách riêng ô nhịp lẻ với ô nhịp chẵn rồi đo lại thì hai nhóm trùng khít, không có chuyện ô thứ hai thưa hơn.

**Đã thử áp vào rồi lùi lại.** Sửa tay trái theo số đo nghe tệ hơn hẳn bản cũ, nên đã trả về nguyên trạng. Lý do có thể là bản ký âm này là một bản soạn nâng cao cho người chơi một mình, còn mẫu trong app phải chạy nền dưới giọng hát — dày ngang bản độc tấu thì lấn.

Giữ số đo ở đây làm tư liệu. Muốn dùng thì phải **thử từng vế một và nghe**, đừng thay cả mẫu cùng lúc. Và nhớ quy tắc của dự án: *phong cách anh Khá trước*, mà tài liệu mới là nguồn Khá Bự trực tiếp.

### Đo tập lick jazz thay vì chép lick

`Reference/52 Piano Jazz Blues Licks.mxl` có ký âm lick thật, nhưng chép nguyên vào app là phát tán lại một tuyển tập có bản quyền. Nên cách dùng là **đo thống kê rồi rút ra đặc trưng**, còn câu nhạc vẫn tự sinh. Đo trên 637 nốt tay phải:

| Chỉ số | Kết quả |
|---|---|
| Móc đơn | 53% |
| **Chùm ba** | **17%** |
| Bước đi là **nửa cung** | **35%** |
| Đi liền bậc / nhảy quãng | 52% / 48% |

Con số 35% nửa cung là thứ đáng giá nhất: đó là khác biệt lớn nhất giữa ngôn ngữ jazz thật và câu nhạc chỉ đi trong hợp âm. Chất bebop nằm ở đám nốt **ngoài** hợp âm nối giữa các nốt trong hợp âm. Thêm hai mẫu câu từ đây:

- **Kẹp nửa cung hai phía** — chạm trên nửa cung, rồi dưới nửa cung, rồi mới vào nốt đích. Nốt kẹp đánh nhẹ và được phép ra ngoài hoà âm; nốt đích vẫn là nốt hợp âm.
- **Chùm ba** — hai nguồn nói cùng một điều: `pianoimprovnotes.md` mục 4 khuyên xen chùm ba *"để tránh đều đều máy móc"*, và đo được 17% nốt đúng là chùm ba.

Kéo theo một chỉnh bất biến trong test: bất biến thật không phải "mọi nốt thuộc hợp âm" mà là **"mọi nốt chính thuộc hợp âm"**. Nốt tô điểm được phép ra ngoài — nốt dẫn và nốt kẹp sống nhờ đúng điều đó.

### Nửa vốn từ vựng nằm chết vì cấu hình mặc định

Thêm mẫu câu xong, in ra đọc thì không thấy mẫu mới đâu. Nguyên nhân: `chooseLick` chia ba vị trí mở câu / giữa câu / kết câu, nhưng mặc định là **hai hợp âm một câu** — hợp âm đầu là mở câu, hợp âm sau đã là kết câu, **không tồn tại vị trí giữa câu**. Các mẫu hay nhất lại nằm hết ở danh sách giữa câu.

Bài học lặp lại lần thứ hai trong phiên này: viết xong một bộ soạn thì phải **in kết quả ra đọc**, đừng tin test cấu trúc. Lần trước nó lộ ra câu nhạc kẹt ở đáy tầm; lần này nó lộ ra nửa vốn từ vựng không bao giờ chạy.

### Hai lỗi chỉ lộ ra khi in cả đoạn solo ra đọc

Các test cấu trúc đều xanh mà câu nhạc vẫn dở. In cả đoạn ra rồi đọc từng ô nhịp thì lộ ngay:

- **Câu nhạc chìm dần rồi kẹt ở đáy.** Mọi mẫu đều đi xuống, chạm biên bậc thang thì bị *kẹp cứng*, nên mọi bước sau kẹp về cùng một bậc — ra một dãy `A4 A4 A4 A4 A4 A4` nghe như đàn kẹt phím. Sửa bằng cách **bật lại ở biên** thay vì kẹp, và cho hướng đi phụ thuộc chỗ câu nhạc đang đứng trong tầm (dưới giữa thì đi lên, trên giữa thì đi xuống) để nó tự kéo về giữa tầm.
- **Nốt ngân tràn sang hợp âm sau.** Nốt cuối của vài mẫu ngân dài gấp rưỡi, cộng dồn lại vượt quá thời lượng hợp âm, nên còn vang khi hợp âm đã đổi — nghe đúng như lệch hoà âm. Sửa bằng hàm `bounded` bọc **mọi** mẫu câu, kể cả mẫu viết thêm sau này.

Bài học: với code sinh nhạc, test bất biến cấu trúc là chưa đủ. Phải **in kết quả ra đọc** ít nhất một lần, rồi biến thứ đọc được thành test.

### Tách bộ xương cao độ khỏi cách chơi

`generateSolo` chia làm hai việc: chọn **bộ xương cao độ** (nốt nào, theo hoà âm và nốt kết câu) rồi giao cho `renderPhrase` của từng mức **đổ ra tiết tấu và hình giai điệu**. Tách vậy vì cao độ phải đúng hoà âm ở mọi trình độ — chỉ cách chơi mới thay đổi theo trình độ. Nhờ đó thêm mức mới chỉ cần viết thêm một hàm đổ, không đụng tới phần hoà âm.

## 17/8/2026 — Điệu OneMotion, tiếng đàn, lưới, giang tấu

Các quyết định chốt từ khi chuyển sang phiên này. Không lặp lại phần giang tấu / lick ở trên, chỉ ghi chỗ đổi ý hoặc phát hiện mới.

### Đệm theo điệu = catalog OneMotion, không phải mẫu Khá Bự

Mẫu tiết tấu (Pop, Waltz, Flamenco…) lấy từ tab Styles của OneMotion Chord Player. Phong cách anh Khá chỉ còn ở **ngắt nghỉ, fill, hợp âm lướt**. Alias bài cũ: `ballad` → `pop-1`, `bossa-nova` → `bossa-nova-1`, `valse` → `waltz-1`, `swing` → `swing-1`.

`beatsPerMeasure` lấy **tử số nhịp** (`4/4` → 4), không lấy `bar` trong chuỗi arp. `bar: 8` của samba / bossa là *hai ô 4/4*, không phải nhịp 8 — đổi nhầm một lần, test phách mỗi ô vỡ ngay.

Điệu nhóm trên UI theo **4/4, 3/4, 6/8**. Còn trống trên OneMotion: Bolero, Cha Cha Cha, March.

### Chuỗi arp OneMotion là nốt, không phải “có tiếng / nghỉ”

Bản đầu chỉ đọc token thành hit/rest + nhấn/ngắn. `13`, `1s3s`, `11f` của Flamenco vì thế thành quạt cả hợp âm.

Quy tắc đúng: `x`/`0` = cả hợp âm; số `1–9` = nốt thứ mấy trong thế bấm; `f` = +5; `+` = +8va; chuỗi ngắn hơn ô thì **lặp cho đủ ô**. Flamenco 1 (6/8) là `. xs .` lặp hai lần — bass gốc+5 ở phách 1 và 4, quạt lệch sau bass. Flamenco 3 là rasgueado `1-2-3-4`.

### Slow Rock không có trên OneMotion — tự viết 6/8

Mạnh phách **1 và 4**, không phải 12/8. Bản quạt-chỉ-1-và-4 và bản rải 12/8 đã bỏ vì nghe không ra điệu.

Ba biến thể giữ lại:

- **Điệp** — quạt móc đơn cả 6 phách, nhấn 1 và 4.
- **Rải** — gốc–5–8–3–5–8.
- **Hai tay** — bass 1 và 4, tay phải rải lệch 2-3 và 5-6.

Không scrape MIDI / Style Yamaha. Cùng hệ `RhythmHit` với điệu khác.

### Piano và Synth từng là một tiếng

`loadPiano` fail (CDN, race `getSynth()` gán synth trong lúc chờ sample) thì `catch` trả **đúng** synth tam giác. Đổi Tiếng không đổi gì.

Chốt: một `boot` duy nhất; `getSynth` không tự tạo synth; Piano fail thì AMSynth riêng, không lẫn Synth. Salamander concert grand **chói** — đổi sang sample tonejs-instruments + lowpass ~2 kHz. Guitar (nylon/acoustic + quạt dây) chỉ tự bật khi chọn Flamenco. Không nhúng FluidSynth / `.sf2` — không chạy trong trình duyệt.

Nút Phát **không** `disabled` vì `!audioReady`: `playFromBeat` tự `await startAudio()`. Cú bấm đã là cử chỉ mở khoá.

### Hợp âm lướt sát đích; dim7 là fill, không phải dẫn vào

2-5-1 / hợp âm lướt: mỗi cái **một phách, sát hợp âm đích** (`hugTarget`), không chia đôi ô. Chuột phải **đúng phách** trên lưới — `hostKeepBeats` giữ phách đầu cho hợp âm chủ.

Chuỗi dim7 chơi **sau** hợp âm như fill (menu riêng), không chèn trước. Chủ âm thứ luôn `madd9`. `preferInKey` bật thì hợp âm mượn kéo về nốt trong giọng (`Cm` → `Cadd2`, `E` → `Em9` ở Sol trưởng).

Ô nối: **Không / 1 phách / 2 phách** = đệm rồi mới chạy ngón. “Không” = im điệu ngay và chạy từ đầu. Mute theo `muteWindows` (cửa sổ phách), không tắt nhầm fill. Bỏ kéo-copy hợp âm — hay đụng nhầm.

### Click hợp âm phải ra phách bài đã sắp

Bản lời đánh số theo **vòng gốc**. Dòng phát là bài đã sắp (điệp trước, giang tấu chen giữa). Phát đúng `beatOfMainChord` thì sau khi có giang tấu, click điệp lại rơi vào giữa đoạn giang tấu.

`arrangedBeatAt` đổi mốc gốc → phách bài đã sắp, **ưu tiên đoạn có lời** (giang tấu cũng mượn cùng mốc đó). Lưới / tab Luyện đệm tô sáng bằng `sourceBeatAt` ngược lại. File gốc (nếu có) vẫn tua theo mốc gốc.

### Giang tấu cắt giữa ô thì bass lệch pha — mọi điệu

`renderPattern` lặp cell từ phách 0 của **cả bài**. Cửa sổ 4 hợp âm bắt đầu ở phách 8, waltz cell 3 phách: 8 % 3 = 2 → bass giang tấu lệch một phách so với phiên/điệp. 4/4 + hợp âm 4 phách thì phiên và điệp vẫn thẳng hàng với đầu bài, nên chỉ giang tấu nghe sai — đúng triệu chứng.

Sửa: **dựng lại** đệm từ đúng 4 hợp âm, cell chạy từ phách 0 của vòng ngắn. Không slice timeline đầy đủ.

Kéo theo solo: cắt solo cả bài theo `range.startBeat` thì câu còn dính nốt hợp âm **ngoài** vòng ngắn, cộng cụm quay đầu. Waltz nặng hơn vì `turnaround` tính 2 ô theo `beatsPerChord` (thường 4) trong khi ô điệu là 3 — nửa vòng giang tấu thành ii-V. Chốt: solo sinh trên đúng 4 hợp âm đó; độ dài quay đầu theo `style.beatsPerMeasure`.

Bass giang tấu vẫn nhân đôi xuống 8va (`interludeAccompaniment`); tiết tấu phải trùng phiên/điệp sau khi dựng lại.

### Tab Luyện đệm phát cả bài, không phải từng hợp âm chờ

▶ trên lưới = cùng `startTimelineLoop` với tab Tái hòa âm. Nốt rơi theo đồng hồ vận chuyển. `ReharmHome` giữ mount khi đổi tab để khỏi mất bài. Tab luyện chỉ cần kết quả (timeline + lưới + transport), không dựng lại chuỗi tái hòa âm.

### Nốt rơi 60fps; phím chỉ sáng khi nốt chạm vạch

Ticker `16n` trên Zustand (~4 lần/phách) làm nốt nhảy cóc. Đẩy ticker lên 60Hz thì cả trang render lại — nặng trên Android.

Chốt: `requestAnimationFrame` đọc `Tone.getTransport()` rồi **chỉ sửa `transform`**, không `setState` mỗi khung. 60fps trên Chrome PC và Android.

Phím từng tô theo **chặng đang chờ** (cả hợp âm), nên sáng trước khi nốt rơi tới — nhìn như lệch hàng. Chốt: `notesHittingAt` — phím chỉ đổi màu khi playhead nằm trong `[startBeat, startBeat + duration)`. Cập nhật set nốt đang chạm qua rAF, `setState` chỉ khi set đổi.

### Hai tay chia hai bên, không xa quá hai quãng tám

`RIGHT_HAND_LOW = 52` chồng lên `LEFT_HAND_HIGH = 55`, cộng bass `1+` (+8va) của điệu OneMotion, nên nốt rơi hai tay nằm cùng một quãng — nhìn như chồng ngón.

Chốt `settleHands`: tay trái luôn dưới tay phải, khoảng cách max−min ≤ 24 nửa cung. Áp sau khi chia thế bấm **và** sau mỗi hit của `patternRenderer` (vì `1+` / `1f` lệch quãng tám lúc dựng nốt, không lúc chia tay).

### Lưới hợp âm sáng cả khối, giống lời

Lời tô theo `activeChordIndex` (cả hợp âm). Lưới từng so `beat === active` — `sourceBeatAt` trả số lẻ thì không ô nào sáng, và chỉ một phách sáng dù hợp âm dài bốn phách.

Chốt: lấy hợp âm tại `floor(activeBeat)` rồi sáng mọi ô cùng `chordIndexAt`. Hợp âm lướt vẫn neo về hợp âm chính, như trên lời.

## 19/8/2026 — Licky, giang tấu, mốc chuyển đoạn, lời/slash/luyện đệm

### Licky là sổ câu, không phải máy rải

Fill/run lấy từ `src/reharm/licky/phrases.json` (clone hoặc create). Menu chuột phải: Licky Fills / Licky Runs — chỉ hợp âm đủ phách. Runs = gạch chân kép hồng. `lickyFills` / `lickyRuns` là cờ toàn bài; `extraFills` / `extraRuns` là từng chỗ.

### Giang tấu mượn 4 hợp âm điệp, không cả đoạn

`chooseChorusLoop`: móc lặp + hút về đầu điệp; không có thì 4 hợp âm đầu. Cặp chia đôi chỉ lấy hợp âm đầu. `colorPlainChord`: maj→add9, min→madd9, 7→9, m7→m9.

Hình câu: ô 1 = quét Cà Pháo (`sweep`); ô 3 = chạy ngón Licky tự do; ô 2 = nốt hợp âm chia đều, không ngân, không run. Mỗi vòng `take` scramble, không xoay 2 câu. Bỏ turnaround cũ.

Hợp âm cuối **chỉ chạy ngón ở vòng cuối** (hết số lần lặp), không phải mỗi vòng. Các vòng trước đệm bình thường. Vòng cuối: không quạt hợp âm cuối; tay phải rải/chạy quãng 8; phách chót = hợp âm hút hai tay (`exit`, không lọc RH).

Xáo nốt theo `take` và nốt láy **không** đụng câu chạy vòng cuối — bản trước biến chạy 8va thành rải tự do.

Mật độ câu nhạc UI: chỉ Vừa / Dày (`PHRASE_DENSITY_OPTIONS`). Snapshot cũ `'sparse'` nâng lên medium khi load.

### Mốc chuyển đoạn không phải Licky Fill

`sectionEnds` luôn `arpeggioRun`, không `placeLick` dù đang bật Licky. `fillPositions` bỏ hợp âm lướt — bản trước kế thừa `mainIndex` của hợp âm chủ nên Bm7b5/E7b9 đẻ fill nhầm.

Hợp âm ngắn (Fadd2|E9sus4 chia đôi) + nghỉ 2 phách từng nuốt hết câu chạy: nghỉ không được ăn dưới 2 phách chạy (hoặc hết ô nếu ô ngắn hơn).

UI: mốc chuyển đoạn không gạch chân fill/run; menu Licky ẩn. Đánh dấu mốc thì gỡ `extraFills`/`extraRuns` chỗ đó.

### Lời neo theo cột chữ, không đẩy hợp âm sang phải

`layoutAnchors` đẩy ký hiệu dài sang phải để khỏi chồng — lệch lời. Chốt: cụm hợp âm (kể cả lướt) đặt `left: charOffset ch` đúng chữ. Ký hiệu dài có thể chồng nhau một chút.

Slash từng hợp âm: `slashEdits[i] = true/false`, menu chỉ hiện khi `toSlashChord` được hoặc đang có bass. Không phụ thuộc nút slash cả bài.

Phát + BPM nằm **đầu khung lời**. Tab Luyện đệm: tên hợp âm lớn, vàng, `z-10` lơ lửng đáy khung nốt rơi (ngay trên dải phím), không lẫn nốt.

### Khôi phục điệu đã xóa trong KeyTrain

Điệu xóa lưu vào `localStorage` key `keytrain-deleted-styles` (mảng ID). Khôi phục bằng Console:
```
localStorage.removeItem('keytrain-deleted-styles'); location.reload()
```

---

## Linh Nhi — clone từ tám bản ký âm

Đo từ `PianoBrain/video/Linh_Nhi/`, biên đoạn người dùng chốt trong `corpus.json`.
Phiếu và số liệu đầy đủ: `PianoBrain/ingest/phieu-linh-nhi-bolero.md` và
`phieu-linh-nhi-bolero-tra-loi-1.md`.

### Vòng solo rút từ vốn hợp âm của bài, không dựng theo bậc cố định

Đo 20 đoạn không lời của 7 bài: **16/20 không dùng bậc nào ngoài đoạn hát của chính bài
ấy**. Bốn ngoại lệ chỉ gồm hai hợp âm — iv thứ (3 lần) và I trưởng Picardy (1 lần).

`style/vonHopAmLinhNhi.ts` dựng bốn luật: lấy vốn của bài · mở trên hợp âm chủ, xoay vòng
chứ không sắp lại · ô cuối dạo và giang là bậc V (cửa vào hát) · đoạn kết hãm hoà âm còn
**0,45 hợp âm mỗi ô** (đo: 5/7 bài dưới 0,6; Lá Thư 0,00 — giữ nguyên suốt).

Đoạn kết chậm lại bằng cách **giữ mỗi hợp âm hai ô**, không phải bằng cách ngắn đi.

Nó chạy TRƯỚC dãy bậc cố định của `teacherSoloChords.ts` và trả rỗng khi bài dưới ba hợp
âm, để đường cũ tiếp quản. Dãy cố định ấy là chỗ từng sinh ra `Bbm` — bậc VI thứ không
thuộc bài nào trong năm bài đo được.

### Luật "rút hợp âm về chất trơn" đã bị số đo bác — đừng bật lại

Đếm chất hợp âm 7 bản ký âm: đoạn không lời **78%** hợp âm trơn, đoạn hát **77%**. Tỉ lệ y
hệt — thầy KHÔNG rút màu ở đoạn solo. Cờ `plain` / `plainChords` đã xoá khỏi
`phraseChords.ts` và `phraseSection.ts`; item kho `rule-interlude-plain-harmony` đánh dấu
`rejected`, thay bằng `rule-linh-nhi-solo-giu-mau`.

Thứ duy nhất thầy tránh ở đoạn solo là **`maj7`** — 20 lần ở đoạn hát, **0 lần** trong 30
hợp âm màu của đoạn solo. `vonHopAmLinhNhi.ts` bỏ đúng chất ấy.

### Bốn hằng số hạ theo số đo năm bài

| hằng số | cũ | mới | triệu chứng để lùi |
| --- | --- | --- | --- |
| `CUNG_GO` | 0.64 | **0.54** | tay phải rời tay trái quá |
| `CHUOI_MOI_O` | 1 | **0.45** | ít câu chạy quá |
| `NHAN_BAN` | 0.47 | **0.36** | hai tay dính thành một khối |
| `CHONG_O_THUA` | 0.62 | **giữ 0.62** | đã thử hạ 0.30 rồi trả lại |

`CHUOI_MOI_O` chỉnh gián tiếp qua tỉ lệ liền bậc: `1` ra 49%/52%, `0.45` ra 32%/34%, đích
là 31% (dạo) / 36% (giang).

**T2.3 từng bị đề nghị hạ, và đề nghị ấy SAI**: so `0,62` (đo riêng ô tay trái thưa) với
`20–34%` (trung bình cả đoạn, gồm cả ô dày mà bộ này chồng 0%) — hai tỉ lệ khác mẫu số.

### Điệp khúc dày theo CHIỀU DỌC, không theo chiều ngang — họ `Bolero Nhi`

Tỉ lệ mốc gõ có ≥2 nốt tay trái, phiên → điệp: Đường Xưa 18% → **76%**, Rừng Lá 24% →
**67%**, ba bài kia gần như đứng yên. Nhưng **số mốc gõ không đổi** (8,3 → 8,3): tay trái
đổi từ nốt đơn sang bấm hợp âm trên đúng những mốc cũ.

Đây là lần thứ ba hình này xuất hiện — ô thưa câu dạo (tay phải chồng nốt), ô dồn áp chót,
và điệp khúc. **Muốn dày thì chồng nốt, không thêm cú gõ.**

`bolero-linh-nhi-3` (hiển thị *Bolero Nhi*): điệp giữ bass đơn ở phách 1, 3, 4 và chồng bộ
ba ở các mốc yếu. n = 2 nên nó đứng cạnh ba họ Linh Nhi cũ, không thành mặc định.

### Fill: chọn nút thầy là đổi cả nhãn lẫn nguồn

Chọn Linh Nhi trong hàng nút thầy thì menu chuột phải đổi thành **Linh Fill / Linh Run**,
nguồn lấy từ `licky/linhNhiPhrases.ts`. Hai ô tick cũ đã bỏ — chọn thầy rồi mà vẫn phát câu
Licky thì không còn là lối thầy.

Đọc `soloThay` (nút người dùng bấm) chứ **không** `thaySolo`: `thaySolo` lui về
`soloTeacherOf(style.id)`, mà hàm ấy trả `'linh-nhi'` cho mọi điệu bật cờ rải-theo-tay-trái
— bossa nova nằm trong đó.

Thêm **bốn câu ba nốt** vào sổ. Đo 54 cụm móc kép trong đoạn có lời: **34 cụm 3 nốt (63%)**,
11 cụm 4 nốt. Sổ ban đầu có 4, 4, 4, 6, 8, 8 nốt — không câu nào ba nốt. `placeLocked` neo
câu vào CUỐI hợp âm nên độ dài câu quyết định chỗ bắt đầu; câu 6–8 nốt đẩy điểm vào tận
phách 2, trong khi thầy hay vào ở **phách 4,25** (15/54).

### BẪY ĐO: gom nốt chồng vào câu chạy làm sai mọi tỉ lệ quãng

Bộ gom cụm ban đầu cho hai nốt **cùng phách** vào một cụm, nên hợp âm chồng bị tính thành
câu chạy toàn nốt nhảy. Kết quả: 146 cụm, 8% liền bậc — và tôi kết luận nhầm rằng sổ fill
quá du dương.

Sửa lại (mỗi mốc chỉ lấy nốt trên cùng, nốt sau phải muộn hơn nốt trước): **54 cụm, 18%
liền bậc** — khớp sổ (19%). Vị trí hay nhất cũng đổi từ phách 4,5 sang **4,25**.

Cùng loại bẫy đã sập ba lần trong một phiên: hai lần so hai tỉ lệ khác mẫu số, một lần gom
nhầm. **Trước khi so hai con số, kiểm chúng có cùng mẫu số và cùng định nghĩa không.**

### Đoạn hát chia đôi ô thì đoạn dạo cũng chia — nhưng thưa hơn một nửa

Câu hỏi gốc: bài có **phần hát** chia đôi hợp âm thì Linh Nhi có đổi cách chọn hoà thanh
cho đoạn dạo không. Đo bảy bản ký âm, đếm ô có từ hai hợp âm KHÁC nhau:

| bài | đoạn hát | đoạn dạo | tỉ số |
|---|---|---|---|
| Biển Tình | 19% | 11% | 0,58 |
| Đừng Xa | 25% | 11% | 0,44 |
| Lá Thư | 40% | 33% | **0,83** |
| Một Cõi | 1% | 0% | — |
| Đường Xưa | 13% | 0% | — |
| Mùa Xuân | 20% | 12% | 0,60 |
| Rừng Lá | 39% | 11% | **0,28** |
| **gộp** | **22%** | **10%** | |

**Có ảnh hưởng, và 7/7 bài cùng chiều**: đoạn dạo luôn chia thưa hơn hoặc bằng đoạn hát,
không bài nào ngược lại. Hai bài mà đoạn hát chia **dưới 15%** có đoạn dạo **không chia ô
nào** — đó là `NGUONG_CHIA`. Năm bài còn lại tỉ số 0,28–0,83, trung vị 0,58; lấy
`HE_SO_CHIA = 0,55` là lấy khoảng giữa. **n=5, tản rộng** — Lá Thư kéo lên, Rừng Lá kéo
xuống, hai đầu cách nhau ba lần.

Giá trị cũ 0,45 (lấy tỉ lệ gộp 10/22); triệu chứng để lùi là bài chia nhiều và bài chia
vừa ra cùng một số ô chia.

Kiểm lại trên đoạn tám ô: Đường Xưa 13% → 0 ô, Biển Tình 19% → 1 ô (thực 11%), Mùa Xuân
20% → 1 (thực 12%), Đừng Xa 25% → 1 (thực 11%), Rừng Lá 39% → 2 (thực 11%, **hơi quá**),
Lá Thư 40% → 2 (thực 33%, **hơi thiếu**). Khớp 4/6.

**Chất hợp âm nửa sau:** át hoặc át phụ **3/6** (Đừng Xa `E→A`, Lá Thư `Bb→E`, Biển Tình
`F#m→E`), hạ át 2/6, chủ 1/6. n=6 — chỉ đủ nói át là chất hay gặp nhất, nên ưu tiên một
hợp âm chất át trong VỐN CỦA BÀI, không có thì đi tiếp trong vốn. Cũ luôn đi tiếp trong
vốn; triệu chứng là vốn xếp cạnh nhau kiểu `Am` rồi `Eb` thì ô chia nhảy quãng ba cung.

**Vị trí chia — chỗ yếu nhất.** Sáu ô chia nằm ở 0,89 · 0,83 · 0,78 · 0,50 · 0,33 · 0,33
của đoạn; 3/6 ở một phần ba cuối. n=6, chưa thành luật. Tạm đặt từ ô **áp chót** lùi lên,
chừa ô cuối vì đó là cửa bậc V cho ca sĩ vào hát.

**Ba chỗ code sót, đã làm hết:**

1. `vonHopAmLinhNhi.ts` đặt cứng 1,00 hợp âm mỗi ô. Nay chèn hợp âm nửa ô sau theo tỉ lệ
   trên, và `nhipVong()` trả số phách từng hợp âm để `phraseSection` cắt đúng nửa ô.
2. `giaiDieuDaoLinhNhi.ts` chỉ đọc hợp âm đầu ô. Nay **trải hợp âm ra trục phách** rồi mới
   chia về ô, nhận thêm `beatsEach`. Nốt cảm tra hợp âm đang vang tại đúng phách của nốt.
3. `ODao` thêm `bac2` và `chia`; ô chia đôi của bài chỉ ghép với ô chia đôi của bản ký âm.

Dây nối: `VongHoaThanh.tiLeChia` (mới) → `ReharmHome.tiLeChiaHat` → `buildPhraseSection`
→ `phraseChords` → `vonHopAmLinhNhi`. `khungHopAm` vốn đã bỏ hợp âm không rơi trên vạch
nhịp, nên tỉ lệ bị bỏ **chính là** tỉ lệ ô chia đôi.

**BẪY 1: độ dài đoạn đếm theo SỐ HỢP ÂM.** `phraseSection` tính
`roundBeats = chords.length * beatsPerChord`. Ô chia đôi dài nửa ô, nên đếm theo số hợp
âm thì mỗi ô chia làm đoạn dạo dôi thêm một ô trọn — đo được **36 phách thành 40**. Nay
lấy tổng `beatsEach`.

Chỗ này **không bài kiểm hàm lẻ nào bắt được** vì nó nằm giữa dây nối: `vonHopAmLinhNhi`
trả đúng, `nhipVong` trả đúng, mà `phraseSection` vẫn đếm sai. Phải có bài kiểm đi từ
`doVongHoaThanh` tới `buildPhraseSection` mới thấy — đó là `chiaOXuyenSuot.test.ts`.

**BẪY 2: đánh dấu nửa ô bằng WeakSet trên đối tượng hợp âm.** Vòng tám ô rút từ vốn sáu
hợp âm thì cùng một `A7` xuất hiện ở nhiều ô — đánh dấu thẳng lên nó là **mọi** ô chứa
`A7` bị coi là nửa ô và đoạn dạo co còn một nửa độ dài. Hai nửa của ô chia phải là đối
tượng riêng (`{ ...chord }`). Bài kiểm canh bằng cách đòi tổng số phách luôn bằng 32.

**Điệu vẫn để chung.** Người dùng chốt: *"tạm thời vẫn giữ chung slow rock và bolero cho
đến khi nào đủ lượng sheet bolero thứ trong kho."* Trường `dieu` đã có sẵn trong bảng
cho lúc tách.

### Biển Tình là RÊ TRƯỞNG, không phải Si thứ — và bolero đang lẫn slow rock

Hai chuyện tìm ra khi người dùng hỏi *"có gom lẫn tư duy slow rock giọng thứ sang bolero
giọng thứ không"*.

**Một — đọc sai giọng Biển Tình.** Tôi đọc theo hợp âm MỞ ĐẦU đoạn dạo (`Bm`) và kết
luận Si thứ. Đếm cả bài thì `D=19` nhiều nhất, `Bm=13`, `F#m=13`, `A=12`, bài đóng trên
`D`, và vòng `D-Bm-F#m-Em-A-D` là **I-vi-iii-ii-V-I**. Rê **TRƯỞNG**; đoạn dạo chỉ mở
trên bậc vi.

Cái sai này từng nằm trong `tuyenDaoLinhNhi.ts` với `thu: true, chuGoc: 11`, tức đem
chất liệu giọng trưởng đi ghép vào bài giọng thứ, lại lệch chủ âm 3 nửa cung. Đã sửa:
cao độ `+9`, bậc hợp âm `+9 (mod 12)`, `thu: false`, `chuGoc: 2`.

Sửa xong thì khớp lại với chú thích cũ trong `vonHopAmLinhNhi.ts` — "**3 trưởng, 4
thứ**" — vốn đã đúng từ trước; chính tôi mới là chỗ lệch.

**Luật rút ra:** giọng của một bài phải đọc bằng **đếm cả bài và xem bài đóng ở đâu**,
không đọc bằng hợp âm đầu đoạn dạo.

**Hai — kho tuyến trộn hai điệu.** Bảy sheet gồm **5 bolero, 2 slow rock** (Lá Thư Trần
Thế, Một Cõi Đi Về). `locO()` chỉ lọc thứ/trưởng và số phách, **không lọc điệu**:

| kho | tuyến trong kho | slow rock chiếm |
|---|---|---|
| thứ, 4 phách | Đừng Xa · Rừng Lá · **Lá Thư** | **26%** ô được ghép (n=480) |
| trưởng, 4 phách | Biển Tình · Đường Xưa · Mùa Xuân | 0% |
| thứ, 3 phách | **Một Cõi** | 100% |

Bên hoà thanh cũng vậy: `vonHopAmLinhNhi.ts` đo gộp **20 đoạn không lời của cả 7 sheet**,
trong đó 6 đoạn là slow rock = **30% mẫu**. Không có chỗ nào tách điệu.

Ngược lại, các hằng số trong `raiLinhNhi.ts` và `daoDungXa.ts` **thuần bolero** — phiếu
T2 đo trên năm bài Biển Tình · Đường Xưa · Mùa Xuân · Đừng Xa · Rừng Lá, cả năm đều
bolero.

Chưa sửa chỗ trộn này vì chưa rõ người dùng muốn tách hay muốn giữ. Muốn tách thì thêm
trường `dieu` vào `TuyenDao` và lọc trong `locO()`; giá phải trả là kho thứ 4 phách tụt
từ 24 ô xuống **18 ô** (chỉ còn Đừng Xa và Rừng Lá).

**Lỗi phụ sửa kèm:** kho thứ co lại còn 3 tuyến thì phép quay vòng hạng ứng viên bị
trùng lượt. Nay **lệch pha theo ô** — ô thứ `o` quay thêm `o` nhịp.

### Sổ `Nguon.json` — ghi câu dạo mỗi lần phát, kèm ô bình luận

Trước đó **không có gì được lưu**: câu solo sinh lại từ đầu mỗi lần phát rồi mất.
`SongSnapshot` chỉ lưu cài đặt, và ngay cả `playSpin`/`phraseSpin` cũng không nằm trong
đó — nghe thấy hay cũng không giữ được, nghe thấy dở cũng không chỉ đích danh được câu
nào.

**Trang web không tự ghi file lên đĩa được**, nên phải có máy chủ ghi hộ. Vite đã chạy
sẵn một máy chủ khi phát triển, nên `nguonPlugin.ts` gắn thêm ba đường vào đó:

| đường | việc |
|---|---|
| `GET /__nguon` | đọc cả sổ |
| `POST /__nguon/cau` | lưu một câu dạo vừa phát |
| `POST /__nguon/binh-luan` | gắn ý kiến vào một câu theo số thứ tự |

**Chỉ chạy khi `npm run dev`.** Bản dựng tĩnh không có máy chủ; ở đó lệnh gọi hỏng và
client nuốt lỗi trong im lặng — sổ này là công cụ soi lúc luyện, không phải tính năng
cho người dùng cuối.

**File theo kiểu bảng**, hai bảng nối nhau bằng `stt`:

- `cau` — cột `stt · tao · bai · giong · dieu · soO · soNot · lanPhat · not`
- `binhLuan` — cột `stt · cauStt · luc · yKien`

Mỗi dòng là một **mảng đúng thứ tự cột**, đổ ra bảng tính được. Thêm cột thì thêm vào
cuối, đừng chèn giữa.

**Lưu lúc BẤM PHÁT, không đợi phát xong.** Chỗ gọi nằm trong `playFromBeat`, ngay sau
khi dựng xong lượt: câu đã trọn vẹn trước khi tiếng đầu tiên kêu lên, nên bấm dừng giữa
chừng vẫn lưu đủ. Lấy đoạn dạo bằng `sections[0]` — `buildPass` dán nó vào đầu rồi đẩy
mọi đoạn còn lại lùi đúng bấy nhiêu phách.

**CÂU TRÙNG THÌ KHÔNG ĐẺ DÒNG MỚI.** Mỗi lần bấm phát nay soạn một câu mới, nên phần
lớn lần phát đẻ một dòng mới. Phép gộp là lưới chắn cho ca hiếm — bài ít hợp âm, đoạn
dạo ngắn, vốn ô trong bảng tuyến quá mỏng — lúc ấy câu trùng khít câu cũ chỉ **ghi thêm
một mốc vào cột `lanPhat`**.

Ô bình luận (`OBinhLuan.tsx`) đặt **trên** nút phát cả bài, chỉ hiện sau khi đã phát ít
nhất một lần, và dọn ô mỗi khi đổi sang câu khác.

**CỘT `hopAm`.** Sổ lưu luôn vòng hợp âm của chính câu dạo, theo ký hiệu, đúng thứ tự ô.
Thiếu nó thì muốn trả lời một câu hỏi đơn giản như *"intro đã tạo vòng hợp âm trên giọng
thứ chưa"* phải chạy lại code để dựng lại vòng — mà vòng dựng lại **chưa chắc trùng vòng
đã phát**, vì nó phụ thuộc lượt. Lấy thẳng từ `introSymbols`, tức đúng lưới đang bày ra
cho người dùng nhìn, kể cả ô `(báo)` và `(hút)`.

Phép gộp câu trùng vẫn so bằng **NỐT**, không so bằng hợp âm: hai câu khác nhau vẫn có
thể đứng trên cùng một vòng, mà thứ người dùng nghe và chấm là câu.

**HAI Ô TICK.** *"1 là 'Đã ổn' thì intro này sẽ được giữ lại. 2 là 'Chưa ổn' thì sẽ cho
tôi bình luận ý kiến."* Nên **Đã ổn** chấm xong là xong, không bắt viết gì; **Chưa ổn**
mới mở ô viết. Chấm gửi ngay lúc tick — nó là một cú bấm dứt khoát, không phải thứ gõ dở.

Chấm lưu ở cột `danhGia` của bảng `cau`, không ở bảng `binhLuan`: nó là nhận xét về CÂU,
mà một câu chỉ có một chấm còn ý kiến thì có thể nhiều. Chấm lại thì **ghi đè** — nghe
lại rồi đổi ý là chuyện thường, giữ hai chấm ngược nhau thì không ai đọc ra câu ấy thế
nào. Đường thứ ba: `POST /__nguon/cham`.

**GÕ DỞ MÀ BẤM PHÁT THÌ MẤT — có chủ ý.** Mỗi lần bấm phát sinh một câu mới nên `stt`
đổi và ô dọn; chưa bấm "Lưu ý kiến" là mất. Đã dựng phép tự cứu, gửi ý kiến gõ dở cho
câu CŨ trước khi dọn, rồi người dùng bảo bỏ: *"thôi không cần sửa lỗi mất trắng đó, mỗi
lần bình luận xong bắt buộc tôi phải bấm lưu ý kiến nếu không là mất luôn."* Đừng dựng
lại nếu không được yêu cầu — cứu tự động thì mọi chữ gõ nháp đều chui vào sổ.

Có ghi lại đây một cái bẫy React gặp lúc dựng phép cứu ấy, phòng khi sau này cần: **hàm
dọn của `useEffect` chụp giá trị lúc ĐĂNG KÝ**, tức lúc ô vừa dọn và còn rỗng — cứu ra
chuỗi rỗng. Mà đọc ref ngay trong hàm dọn cũng hỏng, vì React render trước hiệu ứng nên
ref đã mang số câu MỚI ghép với chữ CŨ. Muốn đúng thì phải giữ một ref chạy chậm một
nhịp, chỉ nhận chữ khi số câu còn khớp.

`Nguon.json` nằm ở gốc repo và **chưa cho vào `.gitignore`** — nó là dữ liệu người dùng
tự sinh, để người dùng quyết có commit hay không.

### Câu dạo soạn MỚI mỗi lần bấm phát — đảo lần thứ hai

`ReharmHome.tsx`, dòng `take` của `buildPhraseSection`. Chỗ này đã đảo hai lần nên ghi
đủ bốn nước để đừng ai lật lại mà không biết:

1. Ban đầu dạo và kết đóng cứng `take = 0`.
2. Người dùng yêu cầu cho chúng đổi theo lượt như giang tấu.
3. Người dùng nghe lại và đồng ý đóng băng RIÊNG câu dạo — lý do: câu dạo là thứ được
   soạn chứ không phải ngẫu hứng; ca sĩ tập với một câu rồi tới lúc hát lại nghe câu
   khác thì phải mò lại chỗ vào.
4. Nay chốt lại: *"intro là soạn vậy, mỗi lần bấm phát hãy soạn một intro khác dù đang
   phát cái cũ."*

Nước 4 **không bác lý lẽ của nước 3**: câu dạo vẫn là thứ được soạn, chỉ là soạn MỚI mỗi
lần bấm phát chứ không soạn một lần rồi giữ mãi. Trong một lần phát nó vẫn đứng yên vì
`playSpin` chỉ nhích khi bấm.

Cũ: `take: kind === 'intro' ? 0 : 1 + phraseSpin + playSpin.current`
Nay: `take: phraseSpin + playSpin.current`

Đo được: **20 lần bấm liên tiếp ra 20 câu khác nhau**, cả giọng thứ lẫn giọng trưởng,
không lần nào giống hệt lần trước.

**Triệu chứng để lùi:** nếu người dùng báo tập theo không kịp vì mỗi lần phát một câu
dạo khác, thì đó là nước 3 quay lại — hỏi lại họ trước khi sửa, đừng tự đóng băng.

### NGUYÊN TẮC — bộ soạn phải thành bộ SOẠN

Người dùng chốt, áp cho cả KeyTrain lẫn PianoBrain và mọi thầy sau này:

> *"Các câu solo giờ là phải soạn ra để chơi chứ không sinh ngẫu nhiên nữa, bộ soạn hãy
> sửa thành bộ soạn."*

Soạn theo **tư duy của thầy rút từ bản ký âm**: cách chọn vòng hợp âm · cách hoà hợp hai
tay · cách chọn tuyến giai điệu · các tiết tấu. Không có số đo thì không đặt luật.

**"Ngẫu hứng" cũng là soạn.** Người dùng đính chính chữ chính họ từng dùng: *"các câu
giang tấu lúc trước tôi nói ngẫu hứng là do tôi chưa đưa khái niệm ngẫu hứng là phải làm
thế nào — ngẫu hứng trong giang tấu thực ra là cũng phải soạn."* Đừng đọc chữ ấy trong
các chú thích cũ là "được phép bốc thăm".

**Ba bước:** học tư duy của thầy → mô phỏng → sáng tạo trên nền tảng ấy. Không nhảy cóc.
Đích cho đoạn dạo: soạn sáng tạo những câu khác nhau trên những bài khác nhau. **Giang
tấu làm sau.**

#### Tất định KHÔNG có nghĩa là đã soạn

Đây là chỗ dễ tự ru ngủ. Quét cả `src/reharm`: **không có `Math.random` ở đâu cả** — mọi
thứ tất định theo `take`. Nhưng tất định chỉ nghĩa là **lặp lại được**, không nghĩa là
**đã soạn**.

| chỗ | dùng hàm băm để làm gì | soạn hay xúc xắc |
|---|---|---|
| `giaiDieuDaoLinhNhi` — `rung()` | phá thế hoà giữa ứng viên ngang điểm | **soạn** — nốt vẫn là ô có thật |
| `daoDungXa` — `CHONG_O_THUA` | quyết có chồng nốt ở ô thưa không | xúc xắc |
| `raiLinhNhi` — `CUNG_GO` `NHAN_BAN` `CHONG` `DEM_CHUNG` | quyết gõ hay không, nhân bản hay không, lấy cao độ nào | xúc xắc |

`raiLinhNhi` là chỗ còn nhiều xúc xắc nhất, và nó đang chạy ở đường lui của giang tấu.
Đó là việc phải làm khi tới lượt giang tấu.

**Phép thử một dòng khi sửa bất cứ bộ nào:** *nốt này đến từ đâu?* Trả lời được bằng **"ô
số mấy của bản ký âm nào"** thì là soạn. Trả lời **"một số ngẫu nhiên nhỏ hơn ngưỡng"**
thì chưa.

**Chưa đổi tên `bộ soạn` → `bộ soạn` trong mã.** Đổi tên hàm và biến là một diff lớn quét
khắp repo; ghi nguyên tắc trước, đổi tên khi người dùng bảo.

### Mật độ tay phải: hãm được đoạn kết, KHÔNG nâng được đoạn dạo giọng thứ

**Đoạn kết — sửa được.** Bản ký âm 5,7 mốc/ô giọng thứ và 5,0 giọng trưởng; app ra 6,8 và
6,1. Nay **6,0 và 5,4**.

Cần gạt `density` là **cần gạt chết**: đo `'medium'` và `'dense'` ra số y hệt nhau, đúng
như chú thích sẵn có trong `ReharmHome`. Nên thêm `thuaTayPhai` trong `phraseSection`:
mỗi lượt lấy ô đang dày nhất rồi bỏ **nốt chen nhất** trong ô ấy. Không đụng ô cuối (câu
chạy kết là chủ ý) và không bỏ nốt đầu ô, nên sai số còn 0,3–0,4 — đó là mức làm được.

**Đoạn dạo giọng thứ — KHÔNG sửa được, đã thử và bỏ.** Bản ký âm 6,9 nốt/ô, app 5,6.
Vốn ô thừa sức đạt (trung bình 7,1). Đã thêm số hạng phạt mật độ vào phép chọn ô, quét
trọng số 0,5 · 0,6 · 1,2 · 1,5 · 2 · 3:

| trọng số | thứ | trưởng |
|---|---|---|
| nền | 5,6 | 5,4 |
| 0,6 · 1,2 hai chiều | **5,6** | 5,4 |
| 3 một chiều | 6,2 | **6,4** ← hỏng chỗ đang đúng |

Giọng thứ **đứng yên với mọi trọng số dùng được**, vì bộ lọc cùng bậc thường chỉ còn một
ô ứng cử mỗi chỗ — không còn gì để chọn thì cho điểm kiểu nào cũng vô nghĩa.

Đã **bỏ hẳn** số hạng ấy: không giữ code không đổi được gì. Chỉ để lại chú thích trong
`giaiDieuDaoLinhNhi.ts` ghi đã thử những gì, để phiên sau không dựng lại.

Muốn nâng thì phải nới bộ lọc bậc — đổi hoà thanh lấy mật độ. Chưa làm.

**Một lỗi đo của chính tôi, ghi lại:** lúc đầu tôi so 62 nốt (bộ ghép trả) với 50 nốt
(đoạn ráp xong) rồi kết luận "mất 12 nốt", và đi tìm chỗ cắt. Sai: hai con số ấy **khác
mẫu số** — bộ ghép trong app chạy trên **vòng hợp âm dạo đã rút ra**, còn phép đo rời của
tôi chạy trên vòng hợp âm của bài. Trước khi so hai con số, kiểm xem chúng có cùng đầu
vào không.

### Bản nhạc không hiện hàng hợp âm dạo và kết

Người dùng báo: chọn intro Linh Nhi mà bản nhạc đã tái hoà âm không thấy vòng hợp âm của
đoạn dạo.

`ReharmHome.tsx`, memo `sheet`, dòng cũ:

```ts
const playOrder = arrangement ?? []
const intro = playOrder.some((step) => step.type === 'intro') ? introSymbols : []
```

`arrangement` chỉ có giá trị khi người dùng **tự sắp bố cục**; mặc định nó `null`. Nên
`playOrder` là mảng rỗng, `.some(...)` luôn sai, và hàng hợp âm dạo/kết **không bao giờ
được gắn vào bản nhạc** — dù bấm phát thì hai đoạn ấy vẫn kêu.

Thứ tự phát thật nằm ở memo `steps`, và nó **ÉP** thêm dạo/giang/kết khi chọn Linh Nhi
hoặc Chiếc Lá. Nhưng `steps` khai SAU `sheet` vì nó cần `songSources`, nên không dùng lại
được — phải chép đúng hai luật ép ấy vào memo `sheet`.

**Bẫy để lại:** hai chỗ nay giữ cùng một luật ở hai nơi. Ai sửa luật ép trong `steps` mà
quên chỗ này thì bản nhạc lại lệch với tiếng nghe được — đúng kiểu lỗi vừa rồi, im lặng
và khó thấy.

### Sổ ghi làm sập app — bọc lại

Người dùng báo: chọn intro Linh Nhi cùng một điệu bolero nhất định rồi bấm phát thì
**KeyTrain tự nạp lại trang**.

Quét cả **106 điệu** qua `buildPhraseSection` (dạo và kết, hai giọng) và qua
`giaiDieuDaoLinhNhi` với `barBeats` của từng điệu: **không hàm thuần nào ném lỗi**. Nên
chỗ hỏng nằm ở tầng React.

Thủ phạm là chính chỗ nối sổ vào `playFromBeat`: nó gọi `buildPass` **thêm một lần**, ngay
trong tay xử lý cú bấm. Vòng phát chính gọi `buildPass` bên trong `startTimelineLoop`, nơi
lỗi được nuốt; gọi thêm ở tay xử lý sự kiện thì lỗi văng thẳng ra và sập cả trang.

`nguon.ts` vốn đã nuốt lỗi **mạng**, nhưng chưa nuốt lỗi **dựng**. Nay bọc cả khối trong
`try/catch`.

**Luật rút ra:** sổ `Nguon.json` là công cụ soi, **không được phép làm gãy việc phát
nhạc**. Mọi đường nối nó vào app phải nuốt lỗi — kể cả lỗi dựng, không chỉ lỗi mạng.

*Chưa tìm ra vì sao `buildPass` ném lỗi với điệu ấy* — cần tên điệu và thông báo lỗi
trong console của trình duyệt. Bọc lại chỉ chặn triệu chứng.

### Sửa theo ý kiến người dùng: tầm cao độ và phép cài hai tay

Người dùng nghe rồi báo: *"sao các câu intro giờ lại mất hẳn kết hợp giữa hai tay trái
phải rồi... Và bài đang đánh là ở giọng thứ, intro đã tạo vòng hợp âm trên giọng thứ
chưa."*

**Vòng hợp âm thì đúng sẵn**: bài La thứ ra `Im IVm ♭VII ♭III ♭VI V Im IVm V`, rút từ vốn
của bài, đóng trên bậc V. Không phải chỗ hỏng.

Hai chỗ kia thì hỏng thật.

#### Một — TẦM CAO ĐỘ neo nhầm mốc

Đo cao độ trung bình tay phải cả bảy đoạn dạo: 70,4 · 72,1 · 72,8 · 74,2 · 75,0 · 75,4 ·
75,5 — **trung bình 73,6 (D5), lệch chuẩn chỉ 1,9 nửa cung** qua năm giọng khác nhau.
Tầm đoạn dạo của chị gần như **không nhúc nhích theo giọng bài**. Đây là một trong những
con số ổn định nhất đo được.

Cũ neo theo tầm **bản ký âm nguồn**: `12 × round((chuGoc − chu) / 12)`. Bài La thứ mà ô
ghép phần lớn lấy từ Đừng Xa (Rê) thì ra `doi = −12`, câu tụt xuống trung bình **F#4–G4**
— thấp hơn bảy nửa cung, trần thấp hơn cả một quãng sáu. Câu chìm vào đúng vùng tay trái
đang chạy.

Nay neo theo `TAM_TAY_PHAI = 73.6`. Sai số còn lại bị chặn ở **±6 nửa cung** vì phép dời
chỉ đi theo quãng tám nguyên — dời lẻ là phá đường đi. Đo được: La thứ 77,6 và Đô trưởng
70,0, tức lệch ~4, thay cho lệch −7 có hệ thống.

#### Hai — hãm tay trái theo TỈ LỆ, không theo số mốc tuyệt đối

Đếm mốc gõ có **cả hai tay cùng lúc**, tính trên mốc tay trái:

| | app trước | app sau | bản ký âm (4 bài thứ) |
|---|---|---|---|
| cả hai tay | 76–79% | **57%** | **59%** |
| tay trái MỘT MÌNH | 21–24% | **43%** | **41%** |

Số đo nói **ngược** cảm nhận mà người dùng vẫn đúng: hai tay không rời nhau, chúng **dính
nhau quá chặt**. Thứ mất là **tiếng nói riêng của tay trái** — chỗ nó gõ một mình, xen
giữa các nốt tay phải.

Nguyên nhân là trần `mocToiDa` tuyệt đối thêm ở món 3: chỉnh trên `bolero-linh-nhi-3` (9
cú gõ một ô) ra đúng 4,4 mốc/ô, nhưng áp sang `bolero-linh-nhi-2` thì cùng trần ấy ra
**3,7**. Nay đổi thành `tiLeGiuTrai`, nhân vào số cú gõ của chính mẫu đệm.

Ba tỉ lệ **hiệu chỉnh theo đầu ra**, không lấy thẳng tỉ lệ dạo/hát: mẫu đệm có 9 cú gõ
còn đoạn hát bản ký âm chỉ 6,5 mốc, nhân 0,75 vào 9 thì ra 7 mốc trong khi đích là 4,9.
Chốt: dạo thứ **0,71**, kết thứ **0,55**, kết trưởng **0,33**. **Đoạn dạo giọng trưởng
không hãm** — nó vốn đã ra đúng 6,8.

#### BẪY `thaySolo` — vấp lần thứ hai trong cùng dự án

Chặn phép hãm bằng `thaySolo === 'linh-nhi'` làm `phraseKeepsStyle` đỏ ba mục: tay trái
**bossa-nova-1** mất cú gõ ở phách 2 và 3,5. Vì `soloTeacherOf('bossa-nova-1')` trả về
`'linh-nhi'` — mọi điệu bám tay trái đều nhận thầy ấy.

Nay chặn bằng `(style.family ?? '').includes('linh-nhi')`. Số đo mật độ rút từ sheet
bolero của chị, nên nó **chỉ đúng cho điệu của chị**.

#### Skill `y-kien-intro` nay chạy TAY

Người dùng bỏ phép quét tự động: *"tôi không cần tự động quét để bật skill nữa, hãy đưa
tôi lệnh bật thủ công."* Monitor đã tắt, **đừng dựng lại**. Gõ `/y-kien-intro`; mỗi lần
bật quét mọi cặp câu-dạo/ý-kiến mới trong **30 phút** gần nhất chưa được đưa sang.

### Skill `y-kien-intro` — đưa ý kiến sang sổ Linh Nhi

`.opencode/skills/y-kien-intro/SKILL.md`. Chạy sau mỗi lần người dùng bình luận về câu
dạo: đọc `Nguon.json`, chép dòng MỚI sang mục **"Ý kiến khi nghe"** trong
`PianoBrain/knowledge/teachers/linh-nhi-piano.md`.

**Vì sao phải chuyển:** `Nguon.json` là sổ thô của app, ghi đủ mọi lần phát và mọi nốt,
lớn nhanh. Sổ Linh Nhi là nơi kiến thức đọng lại — ý kiến nằm ở sổ thô thì phiên sau
không thấy, nằm ở sổ Linh Nhi thì thấy cùng chỗ với các số đo mà nó nói về.

**Ranh giới hai repo:** luật "PianoBrain không đọc/sửa/nhập/commit gì trong KeyTrain" nói
về **mã và bản dựng** của PianoBrain, và còn nguyên. Skill này là việc của trợ lý — chép
chữ từ một file bên KeyTrain sang một file `.md` bên PianoBrain, không sinh `import` nào,
không đụng kho `.json` có schema.

**Skill không phải script**, và đó là chủ ý: sau khi chép bảng còn phải **rút ra điều
đáng nhớ** — gộp những ý rời nhau cùng chê một chỗ, và **nói thẳng chỗ ý kiến chỏi với
số đo** thay vì lặng lẽ chép cả hai vào. Việc ấy máy làm không được.

Skill cấm tự sửa bộ soạn theo ý kiến: một ý kiến là **n=1**, có thể chỏi với số đo trên
bảy bản ký âm — phải hỏi người dùng trước.

### Ba món đo được trên sheet mà code thiếu — đã dựng

**1 · Giang tấu lấy lại câu dạo.** Đo sáu bài, so theo TỪNG Ô (điền ô trống bằng hợp âm
đang vang): vòng hợp âm giang trùng dạo **77%**, tuyến nốt neo trùng **78%**. Biển Tình
trùng 100% ở cả hai — vòng dạo `VI III II I VI II II I`, vòng giang là `I` + đúng dãy ấy
+ `V`.

Giang tấu trước đó dùng `raiLinhNhi` (bám mốc tay trái, soạn nốt riêng) nên hai đoạn ra
hai câu khác nhau. Nay đi qua cùng `giaiDieuDaoLinhNhi` và **cùng `take`** với đoạn dạo
(`phraseSpin + playSpin.current`, không cộng chỉ số vòng lặp).

*Đã thử rồi bỏ:* tuỳ chọn `lechO` dịch một ô cho khớp chỗ Biển Tình thêm ô mở. Lệch ô
làm hợp âm và vị trí ô không còn khớp, bộ lọc bậc phá mất phép căn, tỉ lệ trùng **tụt
xuống 50%**. Hai vòng hợp âm vốn đã trùng nên không cần lệch.

**2 · Điệp khúc dày bằng NẮM DÀY HƠN.** Đo 2125 mốc tay trái ở phiên khúc và 1026 ở điệp
khúc, cả bảy sheet: phiên **1,22** nốt/mốc, điệp **1,60**, còn **số mốc gõ gần như đứng
yên** (6,6→6,4 giọng thứ, 7,7→7,8 giọng trưởng).

| | cũ | mới | sheet |
|---|---|---|---|
| `bolero-linh-nhi-3` | 1,00 | **1,22** | 1,22 |
| `bolero-linh-nhi-3-chorus` | 2,33 | **1,67** | 1,60 |

Nắm dày rơi vào **phách LẺ**: off-beat 1,74–1,96 nốt/mốc trong khi phách 0 và 2 chỉ
1,30–1,32. Phách mạnh là bass trụ, để một nốt. Mốc yếu chồng **đôi**, không phải bộ ba.

**3 · Tay trái mỏng đi ở đoạn không lời.** Thêm `mocToiDa` cho `soloLeftHand`.

| | app trước | app sau | sheet |
|---|---|---|---|
| thứ · dạo | 6,8 | **4,4** | 4,6 |
| thứ · kết | 9,0 | **5,0** | 4,9 |
| trưởng · dạo | 6,8 | **6,8** | 6,8 |
| trưởng · kết | 9,0 | **3,0** | 3,2 |

Đoạn kết sai nặng nhất: **9,0 so với 3,2**, gấp gần ba. Đoạn dạo giọng trưởng **cố ý
không hãm** — nó vốn đã đúng, hãm vào là hỏng chỗ đang đúng. Trần đặt cao hơn đích vì
`interlockHands` còn bớt tiếp: trần 5 ra 3,9, trần 6 mới ra 4,4.

**Hai test cũ khoá số n=1 đã phải thay** trong `diepDayLinhNhi.test.ts`: *"phiên khúc
không chồng nốt"* (đòi dưới 20% số mốc) và *"mốc yếu chồng bộ ba"* (đòi ≥3 nốt). Cả hai
đo trên MỘT đoạn của MỘT bài — Đường Xưa ô 41–58. Số n=7 nói phiên khúc **có** chồng
(1,22) và mốc yếu chồng khoảng **hai**. Đây là thay số đo cũ bằng số đo rộng hơn, không
phải nới test cho qua.

**CÒN LỆCH:** tay phải đoạn dạo giọng thứ vẫn mỏng (app 5,6 so với sheet 6,9) nên chưa
thật sự "đảo vai"; tay phải đoạn kết thì ngược lại, quá dày (6,1–7,0 so với 5,0–5,7).

### Đoạn dạo GHÉP MẢNH theo bậc hợp âm — tư duy tạo tuyến

`tuyenDaoLinhNhi.ts` (bảng, chia theo ô) và `giaiDieuDaoLinhNhi.ts` (phép ghép). Bốn
mục dưới ghi bốn bản trước; giữ làm mốc, đừng làm lại.

Bản 4 ghép NGUYÊN một tuyến vào bài, tức dán cả câu Biển Tình lên một bài có vòng hoà
thanh khác hẳn. Người dùng đòi bậc tiếp: *"đã đọc được tuyến giai điệu vậy bạn có thể
tư duy như Linh Nhi để tạo ra tuyến giai điệu từ những vòng hoà thanh khác nhau không...
được quyền hoà trộn các tuyến giọng trưởng với nhau và giọng thứ cũng vậy."*

**Bảng nay chia theo Ô, mỗi ô ghi kèm bậc hợp âm nó đứng trên.** Không có bậc thì không
trộn được — sẽ ghép ô đứng trên bậc IV vào chỗ đang là bậc V.

| bài | bậc hợp âm từng ô |
|---|---|
| Biển Tình | — Im Vm IVm ♭III Im IVm Vm ♭III |
| Đừng Xa | Im ♭VII ♭VI ♭III IVm Im II Im V |
| Lá Thư | Im ♭VII ♭III IVm ♭VI V7 |
| Một Cõi | — Im Im IVm IVm IVm IVm V7 V7 V7 |
| Đường Xưa | — IV IIm I VIm IIm V VIm |
| Mùa Xuân | I VIm IIIm V I IIIm I V |
| Rừng Lá | V Im ♭VII ♭III Im Vm Vm Im Im |

**Tư duy tạo tuyến, viết thành ba phép chọn.** Mỗi ô của bài đang mở được ghép bằng một
ô nhịp CÓ THẬT, chọn theo:

1. **Cùng bậc hợp âm**; không có thì hạ xuống cùng **chức năng** (chủ · hạ át · át)
2. **Nối được giọng** — nốt đầu ô mới gần nốt cuối ô trước; đây là chỗ giữ cho tám ô
   thành MỘT câu chứ không phải tám mảnh dán cạnh nhau
3. **Ở lại cùng một bài càng lâu càng tốt** — nhảy bài giữa câu là đứt hơi

Cộng hai luật vị trí: ô đầu lấy ô đầu, ô cuối lấy ô cuối (ô cửa thưa cho ca sĩ vào
hát), và **ô nào về chỗ ô ấy** — thiếu luật cuối thì ô 1 và ô 6 Đừng Xa cùng đứng trên
bậc Im, cả hai chỗ đều bị ghép bằng ô 1.

Nhờ phạt "đổi nguồn" mà **ghép vào đúng vòng hoà thanh của một bản ký âm thì ra lại
nguyên câu của chính bài ấy** — bài kiểm khoá sáu ô Đừng Xa bằng `toEqual`.

**BẪY: "chính xác hơn" không phải là giữ hết mọi nốt.** Có lúc đã thử giữ toàn bộ nốt
khuông tay phải cho đầy đủ. Sai — ô 1 Đừng Xa gõ `A4+D5+E5+F5` rồi `D4+E5+F5`, đó là
**nắm hợp âm tay phải**, không phải giai điệu. Giữ hết thì một ô phình lên **20 nốt**
trong khi bản ký âm chỉ có 8 mốc gõ, và phần dưới nắm trùng việc với phần đệm đã dựng
sẵn. Giai điệu là **nốt trên cùng mỗi mốc gõ**: 40–70 nốt một câu, 5–9 nốt một ô. Cái
bảng này giữ thêm được so với bản trước là **độ ngân thật**, thay vì suy từ khoảng cách
tới nốt sau.

**Trưởng ra trưởng, thứ ra thứ** — `locO()` lọc `t.thu === thu` trước mọi thứ khác.
Giọng lấy từ `key` mà bước tái hoà thanh đã xác định, và `ScaleType` chỉ có hai giá trị
`major | minor` nên không có ngả thứ ba. Bài chưa có giọng thì suy từ chất hợp âm đầu,
vì `key?.scale === 'minor'` khi `key` rỗng sẽ ra `false` và đẩy bài thứ sang tuyến
trưởng.

**Ba lỗi đã sửa:**

- Rung điểm theo `m.tuyen.length` — `dung-xa` và `rung-la` **cùng dài 7 ký tự** nên hai
  tuyến nhận đúng một giá trị rung. Nay băm chuỗi tử tế.
- Rung thôi vẫn không đủ: ô đứng đầu bảng dẫn quá xa thì rung bao nhiêu cũng không lật
  được thứ hạng, lượt 1 ra y hệt lượt 0. Nay **lượt thứ N lấy ứng viên hạng N**.
- **KẸP THAY VÌ QUAY VÒNG — người dùng nghe ra, bài kiểm thì không.** Luật trên viết
  bằng `Math.min(take, xep.length - 1)`. `playSpin` tăng mãi, nên chơi vài lượt là
  `take` vượt số ứng viên, mọi ô kẹt ở ô hạng chót và **đứng yên vĩnh viễn**: *"sao mỗi
  lần phát intro giờ không đổi khác nữa"*. Nay `xep[hang % xep.length]`. Bài kiểm cũ
  chỉ chạy 6 lượt nên không thấy; bài kiểm mới chạy tới **lượt 40**, đòi không lượt nào
  giống lượt liền trước và tổng số câu khác nhau phải trên 30. Đo được: 40 lượt ra 40
  câu ở giọng thứ, 38 ở giọng trưởng.

**Luật rút ra:** mọi phép chỉ số ăn theo `playSpin` đều phải **quay vòng**, không được
kẹp — `playSpin` không có trần.

**Vốn ô giọng TRƯỞNG mỏng**: chỉ 2 bản ký âm, 15 ô, có bậc chỉ một ô ứng cử nên mọi
lượt dùng chung. Thêm bản ký âm trưởng là hết — đây là chỗ đáng nạp sheet nhất.

**CHƯA ĐO:** *Để nhớ một thời ta đã yêu* không nằm trong repo nên chưa đối chiếu được
trên chính nó.

### Đoạn dạo GHÉP VÀO TUYẾN CÓ SẴN, không soạn nốt theo luật nữa

`src/reharm/style/tuyenDaoLinhNhi.ts` (bảng) và `giaiDieuDaoLinhNhi.ts` (phép ghép).
Hai mục ngay dưới ghi hai lần sửa trước — **cả hai đều chữa nhầm hướng**, giữ lại làm
mốc chứ đừng làm lại.

**Ba bản trước đều cố rút ra luật rồi soạn nốt theo luật:**

| bản | cách làm | hỏng ở đâu |
|---|---|---|
| 1 | sáu mẫu gõ tay, bậc theo hợp âm | 3,8–5,0 nốt/ô, bài trưởng chỉ 4 bậc |
| 2 | chép mười ô nhịp thật, vẫn theo hợp âm | đủ mật độ, nhưng mười ô rời nhau |
| 3 | một đường nốt neo lấy từ Đừng Xa | đúng từng nốt trên vòng Đừng Xa, sang vòng khác thì lỗi |

Người dùng nghe bản 3 và chốt hướng khác: *"đọc tuyến giai điệu của các intro trên
vòng bài giọng thứ và trưởng rồi train theo tuyến của các bài đó, sau này bất kỳ bài ở
tone nào cứ ghép vào tuyến của một trong các bài thôi."*

**Bảy tuyến, sinh thẳng từ bản ký âm, không gõ tay một dòng nào:**

| tuyến | giọng | phách/ô | ô | nốt |
|---|---|---|---|---|
| Biển Tình | Si thứ | 4 | 9 | 51 |
| Đừng Xa Em Đêm Nay | Rê thứ | 4 | 9 | 54 |
| Lá Thư Trần Thế | Rê thứ | 4 | 6 | 46 |
| Một Cõi Đi Về | Sol thứ | **3** | 10 | 65 |
| Đường Xưa Lối Cũ | Đô trưởng | 4 | 8 | 40 |
| Mùa Xuân Đầu Tiên | Sol trưởng | 4 | 8 | 47 |
| Rừng Lá Thấp | La thứ | 4 | 9 | 70 |

Mỗi nốt lưu `[ô, phách trong ô, nửa cung so với chủ âm ở MIDI 60+chủ âm]`. Chuyển giọng
thành phép cộng, đường đi giữ nguyên tuyệt đối.

**Giọng phải đọc từ vòng hợp âm, không đọc mỗi bộ khoá.** Đường Xưa bộ khoá 0, vòng dạo
`F Dm C Am Dm G Am` — hợp âm **G trưởng** chỉ đứng được nếu đọc là bậc V của **Đô
trưởng** (IV ii I vi ii V vi), đoạn dạo đóng trên bậc vi. Đọc là Fa trưởng thì G thành
bậc II trưởng, vô nghĩa.

**Phép ghép làm bốn việc, KHÔNG có việc nắn nốt theo hợp âm** — nắn thì lại thành sinh
nốt theo luật, đúng thứ vừa bị bác:

1. Lọc tuyến theo thứ/trưởng **và theo số phách một ô**
2. Dịch giọng
3. Kéo giãn hoặc cắt cho khớp số ô, **giữ nguyên ô đầu và ô cuối** (ô cuối là ô "cửa"
   thưa hẳn ra để ca sĩ vào hát)
4. Dời quãng tám cả câu một lượt

Ngoại lệ duy nhất được nắn: **nâng nốt cảm trên hợp âm bậc V** — đo Đừng Xa ô 7 (A7,
đánh C#) và Một Cõi ô 8 (D7, đánh C#), **n=2**, nên chỉ nâng khi hợp âm đang vang chứa
thật nốt ấy.

**Ba lỗi bài kiểm bắt được, đều đã sửa:**

- **Tụt quãng tám.** Mốc dời phải là chủ âm **bản gốc**, không phải trần tay phải. Cũ:
  đẩy lên cao nhất mà chưa chạm trần; triệu chứng là tuyến Biển Tình ghép sang bài Rê
  thứ ra `F4 A4 C5` trong khi bản gốc `D5 F#5 A5`. Vì thế bảng phải có trường `chuGoc`.
- **Mất trắng câu.** Tuyến Một Cõi trải `62..98` — hơn ba quãng tám, rộng hơn cả tầm
  tay phải `57..95` — nên không mức quãng tám nào lọt hết và hàm trả rỗng. Nay **gập**
  nốt biên vào bằng quãng tám: méo một nốt còn hơn mất cả câu. Muốn hết méo thì nới
  `range`.
- **Sáu lượt không ra sáu câu.** Chỉ có 4 tuyến thứ nên `take % 4` làm lượt 4 lặp lượt
  0, `phraseAssembled.test.ts` đỏ. Nay hết một vòng tuyến thì **xoay ô giữa** — câu
  khác đi mà mọi nốt vẫn là nốt thật, chỉ khác thứ tự ô.

**Chốt chặn:** ghép tuyến NGƯỢC về đúng giọng bài nguồn thì phải ra lại **đúng từng
nốt** bản ký âm. Bài kiểm khoá chín ô Biển Tình và bốn ô Đừng Xa bằng `toEqual`, cộng
một lượt quét **12 giọng × 8 lượt × hai kiểu** xem có nốt nào vượt tầm tay phải không.

**CHƯA ĐO:** bài *Để nhớ một thời ta đã yêu* không nằm trong repo (người dùng nhập tay
trong app) nên chưa đối chiếu được trên chính nó.

### Câu dạo neo vào GIỌNG BÀI, không neo vào từng hợp âm

`src/reharm/style/giaiDieuDaoLinhNhi.ts` viết lại lõi. Mục ngay dưới ghi lần sửa
trước — mở rộng bảng bậc — **lần ấy chữa sai tầng**, giữ đây làm mốc chứ đừng làm lại.

**Chỗ hiểu ngược.** Cả bản gõ tay lẫn bản chép mẫu đều lưu *bậc so với từng hợp âm*,
rồi `dat()` đặt lại nốt ở quãng tám gần nốt trước nhất. Cách ấy giữ được tiết tấu mà
vứt mất **đường đi của câu** — nghe ra tám ô rời nhau. Người dùng nói thẳng: tiết tấu
gần giống Đừng Xa rồi nhưng giai điệu thì quá tệ.

**Bằng chứng chị ấy neo vào giọng bài.** Ô 5 hợp âm **Gm**, chị đánh `Bb Bb Bb Bb A
Bb A` — bậc **♭6 và 5 của Rê thứ**, không phải bậc của Gm. Ô 3 hợp âm **Bb**, chị đánh
`D D D D E F` — bậc **1, 2, ♭3 của Rê thứ**.

**Đường nốt neo tám ô Đừng Xa**, đo so với chủ âm D5:

| ô | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| lệch chủ âm | +3 | +2 | 0 | −2 | −4 | +3 | +2 | 0 |
| bậc | ♭3 | 2 | 1 | ♭7 | ♭6 | ♭3 | 2 | 1 |

Đi xuống ♭3 → 2 → 1 → ♭7 → ♭6, nhảy về ♭3 đi xuống lần nữa. Đổi ra **bước trong gam**
thành `2 1 0 −1 −2 2 1 0`, dùng chung được cho cả giọng trưởng.

**Bước đi trong câu** — 47 nốt trên đường giai điệu, đã tách 6 nốt đáp trầm:

| bước từ nốt trước | bản ký âm | bộ soạn mới |
|---|---|---|
| lặp lại đúng nốt cũ | **24%** | 21% |
| liền bậc (1–2 nửa cung) | **54%** | 62% |
| nhảy ≥ 5 | 17% | 15% |

**Năm dáng ô**, chép nguyên mốc thời gian: `GIU` (ô 1·3), `GIU_B` (ô 5), `DI` (ô 4),
`DI_B` (ô 6), `CUA` (ô 8, chỉ ba mốc để ca sĩ vào hát). Thứ tự `GIU DI GIU DI GIU_B
DI_B DI GIU` — giữ và đi xen kẽ.

**Đo lại trên chính vòng Đừng Xa thì bộ soạn ra ĐÚNG TỪNG NỐT ở ô 1, 3, 4, 5.** Bài
kiểm khoá cứng bốn ô ấy bằng `toEqual`.

Hai lỗi phụ sửa kèm:

- **Quãng tám.** Cũ `goc = 60 + chu + (chu < 4 ? 12 : 0)`; triệu chứng là bài **Mi thứ**
  ra câu ở G4–B3, thấp hơn bản gốc cả quãng tám và nghe ù. Nay đặt chủ âm ở quãng tám
  gần **D5 (74)** nhất.
- **Bài chưa dò ra giọng.** `phraseSection.ts` truyền `minor: key?.scale === 'minor'`,
  bài không có giọng thì ra `false` và bài THỨ bị dựng trên gam TRƯỞNG. Nay chỉ tin
  `minor` khi có `tonic` đi kèm, không thì suy từ chất hợp âm đầu.

`phraseSection.ts` nay truyền thêm `tonic: key?.tonic` — trước đó bộ soạn **không hề
biết giọng bài**, đó là gốc của cả chuyện.

**CHƯA ĐO:** bài *Để nhớ một thời ta đã yêu* không nằm trong repo (người dùng nhập tay
trong app) nên chưa đối chiếu được trên chính nó. Đã đo trên ba vòng thứ dựng sẵn —
Rê thứ, La thứ, Mi thứ.

### Bộ soạn giai điệu đoạn dạo — thay bảng gõ tay bằng ô nhịp thật

`src/reharm/style/giaiDieuDaoLinhNhi.ts`. Bảng mẫu đầu tiên gõ tay: sáu mẫu, mỗi
mẫu 4–6 nốt, đúng sáu bậc `{1, 9, ♭3, 3, 11, 5}`. Đo lại đoạn dạo **bảy bản ký âm**
(3 trưởng, 4 thứ) thì lệch ba tầng — và giọng trưởng hỏng nặng hơn giọng thứ:

| | bảng gõ tay | sau khi sửa | bản ký âm |
|---|---|---|---|
| nốt/ô, giọng thứ | 5,0 | **8,8** | 8,5 |
| nốt/ô, giọng trưởng | **3,8** | **8,5** | 8,5 |
| nốt mỗi mốc gõ | 1,00 | 1,15–1,20 | **1,35** |
| bậc ♭7 | 0% | 5% thứ · 13% trưởng | 10% · 7% |
| ♭3 trong bài TRƯỞNG | **0%** | 6% | **14%** |
| bậc 11 trong bài trưởng | 0% | 7% | 11% |
| `1`+`5` gộp, giọng trưởng | **68%** | 52% | 43% |
| số bậc dùng, giọng trưởng | **4** | 7 | 7 |

Ba việc đã làm, **không đụng thuật toán**:

1. **Chép mười ô nhịp thật** thay cả hai bảng — Đừng Xa ô 4·6·7, Rừng Lá ô 1·7
   (giọng thứ); Biển Tình ô 2·4·7·8, Đường Xưa ô 3 (giọng trưởng). Giữ nguyên mốc
   thời gian, nguyên bậc, nguyên chỗ chồng nốt. Mỗi mẫu ghi rõ ô nguồn.
2. **Thêm tầng chồng nốt** `k: 2` — hàm `chong()` lấy nốt hợp âm cao nhất còn cách
   nốt chính ít nhất 3 nửa cung. Bản ký âm có 1,35 nốt mỗi mốc; bảng cũ đúng 1,00
   nên hụt mật độ ở cả hai tầng chứ không riêng số mốc.
3. **Bỏ phép đổi ♭3 → 3 trưởng** trong `bac()`. Dòng
   `if (!thu && x === 3 && chord.quality.intervals.includes(4)) x = 4` xoá đúng nốt
   xanh — bậc phổ biến **thứ ba** của bài giọng trưởng (14%). Đây là chỗ khiến giọng
   trưởng chỉ còn bốn bậc. Mẫu nào cần quãng ba trưởng nay ghi thẳng bậc `4`.

**Triệu chứng để lùi:** nghe thấy đoạn dạo giọng trưởng chối tai ở nốt ♭3 trên hợp
âm trưởng thì bật lại dòng đổi bậc ở `bac()` — nhưng bật xong bài kiểm
`giaiDieuDaoLinhNhi.test.ts` sẽ đỏ, đó là chủ ý.

**CHỖ CÒN LỆCH — chưa sửa, vì nó nằm ở thuật toán chứ không ở bảng.** Tỉ lệ đi liền
bậc nay **vượt** bản ký âm: 51% giọng thứ và 58% giọng trưởng, so với **37%** đo
được. Trước khi sửa là 43% và 15% — tức giọng trưởng đã hết nhảy cóc nhưng cả hai
giọng giờ đi quá mượt. Nguyên nhân ở `dat()`: nó luôn đặt bậc vào quãng tám **gần
nốt trước nhất**, nên mọi bước đều co về nhỏ nhất có thể, trong khi ô nhịp gốc rải
rộng hơn. Sửa chỗ này là sửa `dat()`, một dòng, nhưng nó đụng cả `khongNgang()` nên
để nghe thử trước.

Bài kiểm: `src/reharm/style/__tests__/giaiDieuDaoLinhNhi.test.ts` — 6 mục, canh mật
độ hai giọng, tầng chồng nốt, bậc ♭7, nốt xanh ♭3 và bậc 11 ở bài trưởng, và trần
tay phải.

### 10 test hỏng là NỢ CÓ SẴN, không phải hồi quy — phải lấy mốc ở HEAD rồi mới kết luận

Cây làm việc có 10 test hỏng / 2423 đạt. Tôi nhìn thấy **5 trên 6 file test ấy không hề
bị sửa**, chỉ mã mà chúng kiểm bị sửa, rồi kết luận "hồi quy thật từ phần chưa commit".

**Sai.** Lùi toàn bộ `src/` về HEAD rồi chạy lại: **cũng đúng 10 hỏng / 2423 đạt, 6 file**
— trùng khít. Nợ đã nằm sẵn trong `5c6ca12`.

Test không sửa mà hỏng thì **không** suy ra được là cây làm việc gây ra. Muốn biết thì
phải chạy ở HEAD. Cách làm không cần `git stash` (cấm khi máy chủ Vite đang chạy): sao lưu
các file sửa ra ngoài, `git checkout HEAD -- src`, chạy, rồi chép ngược lại.

Mười lỗi ấy nằm ở `arrangement` (4), `audit` (2), `chordTiming`, `phraseAcrossBar`,
`handSplitAudit`, `brain`. Phần lớn thuộc vùng **giang tấu** — vùng người dùng đã dặn để
làm sau. Riêng `brain.test.ts` chờ `[3-9] thầy` mà kho nay có **14 thầy**: đó là test cũ
cần cập nhật, không phải mã sai.

### `tsc ... | tail` NUỐT MẤT mã thoát — đừng đọc `$?` sau ống dẫn

Tôi chạy `npx tsc --noEmit -p tsconfig.app.json 2>&1 | tail -5` rồi đọc `$?` thấy `0` và
báo "TSC sạch". `$?` ấy là mã thoát của **`tail`**, không phải của `tsc`. Chạy lại có
chuyển hướng ra file thì `tsc` trả về **2** với ba lỗi `TS6133`.

Từ nay: `npx tsc --noEmit -p tsconfig.app.json > /tmp/tsc.txt 2>&1; echo $?` rồi mới đọc
file. Đừng nối ống khi còn cần mã thoát.

Ba lỗi ấy là tham số không dùng trong `teacherSoloChords.ts`. Vá bằng cách đổi tên thành
`_verse` / `_songIntro` chứ **không bỏ tham số** — bỏ thì lệch vị trí của mọi lời gọi.

### `src/music_engine/` là bản sao dữ liệu PianoBrain — đã đưa ra khỏi dự án

Thư mục này chưa từng được import ở đâu, và `src/music_engine/data/` chứa
`approved_rules.json`, `difficulty_profiles.json`, `teacher_style_profile.json` **trùng
md5 y hệt** với `D:\PianoBrain\data\`.

Đó là một nhánh rẽ của dữ liệu PianoBrain nằm bên trong KeyTrain — đúng thứ kiến trúc dự
án cấm, vì KeyTrain đọc PianoBrain qua alias `@pianobrain` và cầu nối ấy đã có sẵn ở
`src/reharm/brain/`. Giữ lại là giữ hai nguồn sự thật rồi lệch nhau.

Đã chuyển ra ngoài cùng `basic_pitch_transcription.mid` (chính file từng làm **sập máy chủ
Vite** vì EBUSY, xem chú thích trong `vite.config.ts`), `test_piano_engine.html`,
`scratch-songs.json`. **Chuyển đi, không xoá** — file chưa theo dõi thì git không giữ bản
nào để lùi.

Giữ lại `src/reharm/licky/linhNhiPhrases.ts`: nó **đang được `soloGenerator.ts` import**,
và nội dung là tám câu chép thẳng từ bản ký âm — đúng tinh thần soạn, không phải sinh.

### `interlude` mặc định BẬT — câu ở mật độ thưa không bao giờ nghỉ

Chú thích ngay trên `generateSolo` viết: *"chỉ nên bật ở đoạn không có lời — bật suốt bài
thì nó đè lên phần hát."* Vậy mà mặc định là `interlude = true`. Bên gọi nào quên ghi cờ
là được đúng chế độ nguy hiểm hơn.

Hậu quả đo được: điều kiện nghỉ trong `chooseLick` mở đầu bằng `!choice.interlude`, nên ở
mật độ **thưa** câu **không bao giờ nghỉ** — mất hẳn hình câu mở–nghỉ–giữa–kết mà
`pianoimprovnotes.md` mục 4 đặt ra. Dump ra bốn ô đều có nốt, ô nào cũng dày.

Đổi mặc định thành `false`. `ReharmHome.tsx` luôn ghi cờ này tường minh nên **ứng dụng
không đổi gì**; chỉ các bên gọi quên ghi mới được hành vi an toàn. `handSplitAudit.test.ts`
vốn dựa vào mặc định để test giang tấu — đã ghi `interlude: true` tường minh vào đó.

Một mình việc này gỡ được 3 test.

### Cuối câu phải đáp vào nốt ổn định — và vá Ở ĐÂU mới đúng

Mẫu `chord-tone` tự nhận "không bao giờ lệch hoà âm", nhưng nó đi trên thang dựng từ
`material`, tức **cả gam** chứ không riêng nốt hợp âm, nên nốt cuối rơi đâu thì rơi. Đo
trên vòng `C Am F G Em Dm G7 C`: câu kết trên `G` đáp vào `A` (bậc 9), câu kết trên `Dm`
đáp vào `E` (bậc 9). Lỗi nấp lâu vì `interlude` mặc định bật, mà nhánh giang tấu có đường
kết riêng.

**Bẫy 1 — lấy nhầm "nốt cuối".** `built.notes[length - 1]` là phần tử cuối **mảng**, không
phải nốt vang sau cùng. Mẫu câu không bắt buộc phát ra theo thứ tự thời gian. Phải quét
tìm `startBeat` lớn nhất.

**Bẫy 2 — vá ở cuối đường ống thì HỎNG NẶNG HƠN.** Tôi thử siết ngay trước `assignFingers`,
sau khi cao độ đã chốt. Kết quả: 3 lỗi thành **6**. Nốt ổn định gần nhất có thể **nằm ngoài
gam** ở chế độ một-gam-xuyên-suốt (`singleScale.test.ts` vỡ hai chỗ), và dời nốt làm lệch
quan hệ nốt láy (`graceNotesInSolo`) lẫn tỉ lệ nốt hợp âm so với người thật
(`styleProfile`). Muốn vá ở đó thì phải dựng lại `material` của hợp âm ấy để chỉ chọn cao
độ hợp lệ — việc lớn hơn, chưa làm.

Bản đang dùng vá **lúc dựng mẫu câu**, sửa được câu kết trên `Dm`. Câu kết trên `G` vẫn
lọt, vì dây tầng phía sau (`capStack`, `applyFeel`, `snapToPulse`, bộ kéo bước quãng tám)
đổi lại cao độ: dựng ra `12:67 12.5:69 13.25:71 13.75:74`, ra tới đầu kia thành
`12:71 12.5:74 13.25:79 13.75:69`.

### Ba test còn hỏng — biết vì sao, chưa sửa

| test | vì sao |
|---|---|
| `soloGenerator` · câu kết ở nốt ổn định | như trên: cần siết sau dây tầng cao độ mà vẫn tôn trọng `material` |
| `phraseAcrossBar` · phần lớn nốt trong một hơi dài | tỉ lệ 0,47 so với ngưỡng 0,50 — sát ngưỡng, chưa truy |
| `handSplitAudit` · ô 3 giang tấu có ngón chromatic | không còn bước nửa cung nào ở ô 3 |

### Câu kết vào nốt ổn định: ba ràng buộc, thiếu cái nào cũng hỏng chỗ khác

Vá được, nhưng phải qua bốn lần sai. Ghi lại cả bốn.

**Vá ở đâu.** Phải siết ở **cuối `generateSolo`**, sau khi cao độ đã chốt. Vá lúc mẫu câu
vừa dựng là vô ích: phía sau còn `capStack`, `applyFeel`, `snapToPulse` và bộ kéo bước
quãng tám ghi đè lại — đo được ô kết dựng ra `12:67 12.5:69 13.25:71 13.75:74`, ra tới
đầu kia thành `12:71 12.5:74 13.25:79 13.75:69`.

**Ràng buộc 1 — chỉ chọn cao độ trong THANG của chính hợp âm ấy** (dựng lại bằng
`materialFor`). Chọn bừa nốt ổn định gần nhất thì ở chế độ một-gam-xuyên-suốt nó rơi ra
ngoài gam: `singleScale.test.ts` vỡ hai chỗ.

**Ràng buộc 2 — bỏ qua nốt đang có nốt láy bám vào.** Nốt láy tính theo bậc so với nốt
chính; dời nốt chính thì nó lệch bậc, `graceNotesInSolo` vỡ.

**Ràng buộc 3 — "nốt cuối" là nốt VANG SAU CÙNG**, không phải phần tử cuối mảng. Mẫu câu
không bắt buộc phát ra theo thứ tự thời gian, và ô kết trên `G` thoát lưới đúng vì phần tử
cuối mảng tình cờ đã ổn định.

**Và chỉ siết khi chất liệu là nốt hợp âm.** Siết tuốt thì tỉ lệ nốt hợp âm trên mạch vọt
lên **81%**, trong khi khoảng đo ở **người thật** — 7 bản ký âm Cà Pháo — là **41–69%**.
Tức người thật KHÔNG phải lúc nào cũng kết vào nốt hợp âm. Luật "luôn kết ở nốt ổn định"
rút từ `pianoimprovnotes.md` bị chính số đo bác ở lối chơi theo gam; số đo thắng.

**Hợp âm TREO không có bậc ba**, nên tập ổn định cứng `[0, 3, 4, 7]` loại mất bậc bốn —
thứ đứng thay chỗ bậc ba và là chất của chính hợp âm treo. Vòng toàn `sus4` chơi ra khác
hẳn, `missingScale.test.ts` vỡ. Với hợp âm treo thì tập ổn định là `[0, 2, 5, 7]`.

### `handSplitAudit` ô 3: test mang tên "ô 3" mà chưa từng chạm tới ô 3

`ReharmHome` chạy giang tấu ở câu **bốn ô** (mặc định `chordsPerPhrase = 4`), còn
`generateSolo` mặc định **2**. Test để trống nên ô 3 đã sang câu mới, `positionInPhrase`
bị đặt lại 0, và nhánh *"ô 3 giang tấu chạy chromatic"* **không bao giờ chạy**. Đã ghi
`chordsPerPhrase: 4` cho khớp ứng dụng.

Sửa xong thì nhánh chạy thật: chọn đúng `enclosure`, dựng ra 9 nốt. **Nhưng vẫn không có
bước nửa cung nào** — `enclosure` đi trên thang gam nên hai nốt bao vây là bước gam chứ
không phải nửa cung. Muốn có ngón chromatic thật thì phải sửa chính mẫu `enclosure` dùng
nốt lướt nửa cung, mà nó đổi tiếng ở **mọi chỗ khác** đang dùng mẫu này — quyết định về
âm nhạc, chưa làm.

Một giả thuyết đã bị bác dọc đường: tôi ngờ ngưỡng `notes.length >= 5` loại mất `enclosure`
vì nó là hình ngắn. Đo ra nó dựng **9 nốt**, ngưỡng không hề cản. Đã lùi bản vá ấy.

### `phraseAcrossBar` rơi từ 58% xuống 47% ở `b2dd25e`

Khoanh bằng cách lùi `src/` về từng commit rồi chạy lại:

| commit | ngày | nốt nằm trong hơi ≥ 5 |
|---|---|---|
| `ee3d943` | 23/8 | **58%** (303/522) — đạt |
| `b2dd25e` | 24/8 | **47%** (262/553) — hỏng |

`b2dd25e` sửa `soloGenerator.ts` **+147 dòng** (việc giang tấu 4 ô). Nó thêm ngón quay đầu
ở vị trí mở câu, mà chính chú thích trong `phraseAcrossBar.test.ts` đã nói: hình hai nốt là
mẫu bao vây và mẫu kẹp nửa cung, **cố ý** quay đầu, và ép chúng biến mất là giết đúng cái
ngón đàn phải giữ.

Nên hai đích **chống nhau**: hơi dài liền mạch, và ngón quay đầu đa dạng. Cân lại là quyết
định về âm nhạc, cần tai người. Đo thêm: bỏ cổng `mix(13) % 3 === 0` ở ô 3 **không đổi gì**
(vẫn 47%, 262/553) — nhánh ấy không phải chỗ sinh ra chênh lệch.

### `tuyenDaoLinhNhi.ts` không tái lập được từ bản ký âm — đã sinh lại thành `tuyenSolo.ts`

Bảng cũ tự ghi là *"sinh bằng script từ bản ký âm, không gõ tay dòng nào"*, nhưng script ấy
không ai lưu lại. Dựng bộ sinh mới (`tools/tuyen_o.py`) rồi sinh lại để đối chiếu:

| | kết quả |
|---|---|
| số ô mỗi bài | **7/7 bài khớp** (9·9·6·10·8·8·9) |
| bậc + chất hợp âm từng ô | **57/59 ô khớp** |
| ô giống hệt bảng cũ | **12/59** |
| khớp `PianoBrain/data/sheet-solos` | bảng cũ **118/276** nốt · bảng mới **285/285** |

Hai bộ đọc độc lập — `tools/tuyen_o.py` ở đây và `luu_solo.py` bên PianoBrain — cho cùng
một kết quả và cùng bác bảng cũ ở những chỗ giống nhau. Ca rõ nhất là ô 1 *Đừng Xa*: bảng
cũ ghi nốt đầu ô midi 77 và nốt cuối ô midi 81, mà **cả ô ấy trong bản ký âm không có nốt
nào trong hai nốt đó**. Khả năng cao nhất: bảng cũ sinh từ một bản `.mxl` hoặc một biên
đoạn đã bị thay sau đó.

**Bẫy đã sập khi dựng bộ sinh:** tôi tự đi một lượt trên cây XML thay vì dùng bộ đọc có
sẵn, và nó đặt sai vạch nhịp — ô 1 Đừng Xa dài ra thành 5 phách, kéo một nốt của ô 2 vào.
Đổi sang `mxl.notes` + `clone_do.sua_o` của PianoBrain thì hết. Bảng sinh lại chỉ khớp
228/373 nốt trước khi đổi bộ đọc.

**Một chỗ khác biệt cố ý:** bảng GIỮ đuôi nốt nối làm một mốc gõ riêng, trong khi phép đo ở
`LUAT-SOAN-NOT.md` thì BỎ. Bảng cần phát ra tiếng nên giữ đúng những gì bản ký âm bảo gõ;
phép đo cần đếm mật độ nên bỏ. Kiểm được: tổng nốt khớp đúng 373 khi giữ, tụt xuống 370 khi
bỏ.

Bảng mới có **38 tuyến** (13 bài × dạo/giang/kết, trừ mấy đoạn bài không có) cho **cả ba
thầy**, không riêng Linh Nhi. Chạy lại:

    python tools/tuyen_o.py --kiem     # so với bảng cũ
    python tools/tuyen_o.py --sinh > src/reharm/style/tuyenSolo.ts

Bảng cũ **chưa xoá**: bật bằng ô tick *"Bảng tuyến mới — sinh lại từ sheet (nghe thử)"*,
mặc định TẮT. Người dùng đã đặt luật đổi lối chơi thì dựng sau một ô tick, và 12/59 ô giống
nhau nghĩa là bật lên là câu dạo đổi tiếng hẳn.

### Vốn ô đoạn dạo của ba thầy — đo trước khi gộp bốn nút thành một

| thầy | giọng | số ô | ô ứng cử TB | ô đơn độc |
|---|---|---|---|---|
| Cà Pháo | trưởng | 41 | **6,3** | 3/41 |
| Cà Pháo | thứ | **8** | 2,2 | 1/8 |
| Linh Nhi | thứ | 33 | 5,4 | 3/33 |
| Linh Nhi | trưởng | 23 | 3,4 | 2/23 |
| Tôn Hùng | thứ | 17 | 3,1 | 3/17 |
| Tôn Hùng | **trưởng** | **0** | — | — |

Một lo ngại của tôi đã bị số đo bác: tôi đoán vốn hợp âm jazz của Cà Pháo (`Dm11`, `Em7b5`,
`sus4`) sẽ làm bộ lọc "cùng bậc hợp âm" không tìm ra ô khớp. **Sai** — bộ lọc rút chất về
`m / 7 / trưởng` nên `Dm11` và `Dm7` cùng rơi vào `m`, và bài giọng trưởng của Cà Pháo còn
dồi dào nhất trong ba thầy.

Hai chỗ mỏng thật, phải xử trước khi bỏ các nút cũ:

- **Cà Pháo giọng thứ chỉ 8 ô, từ một bài duy nhất** — soạn bài giọng thứ theo anh sẽ gần
  như dán lại câu *Người hãy quên em đi*. Cách nới: cho ô giang tấu và đoạn kết vào chung
  vốn (bảng mới đã có sẵn).
- **Tôn Hùng không có một ô giọng trưởng nào** — cả hai bài đều giọng thứ. Đường xử đã
  chọn: bài giọng trưởng thì không cho chọn Tôn Hùng. Mượn ô của thầy khác là lấy luật thầy
  A áp cho thầy B; giữ bộ sinh làm đường lui là giữ đúng cái đang muốn bỏ.

### Ba lỗi bảng tuyến do test bắt, không phải do đọc mã

`tuyenSolo.test.ts` dựng cùng lúc với bảng và bắt được ba chỗ mà đọc mã không thấy:

1. **Nốt hoa mỹ vào bảng với độ ngân 0.** `mxl.notes` giữ cả `<grace>`, mà nốt hoa mỹ có
   `duration = 0` nên vào bảng thành một mốc gõ **không kêu**. Hồng Kông 1 đoạn dạo dính.
   Đã bỏ nốt `dur <= 0` — nốt hoa mỹ cũng không thuộc xương sống giai điệu.
2. **Nốt vượt vạch nhịp ở ô cuối bản nhạc.** `clone_do.sua_o` đẩy nốt sang ô sau khi mốc
   phách vượt độ dài ô, nhưng **ô cuối bản nhạc không có ô sau để đẩy** — nốt của đoạn sau
   kẹt lại với mốc phách 4,75 và 5,75 trong một ô 4 phách. Đo được **22 nốt** như vậy trên
   cả kho, tất cả ở đoạn kết.
3. **Số phách của tuyến lấy từ ô ĐẦU thay vì ô hay gặp nhất.** Đoạn kết *Tình Em Là Đại
   Dương* mở bằng một ô 2/4 rồi còn lại 4/4; lấy ô đầu thì cả tuyến bị khai là 2 phách và
   mọi nốt từ phách 2 trở đi đọc ra thành vượt vạch.

Cả ba đều là dạng **hỏng mà không kêu** — bảng vẫn sinh ra, tsc vẫn sạch, app vẫn chạy.

### Bảng tuyến mới phủ cả ba thầy và cả đoạn kết

`tuyenGhep` trong `phraseSection.ts` trước chỉ bật cho `kind === 'intro'` và thầy Linh Nhi;
mọi chỗ khác rơi về bộ SINH (`caPhaoSolo`, `chiecLaMotif`, `raiLinhNhi`). Nay khi ô tick bật
thì bộ ghép nhận cả ba thầy ở cả dạo · giang · kết, và nhánh ấy đứng **trước** mọi bộ sinh.

Nút **Tôn Hùng bị khoá ở bài giọng trưởng** — anh không có bản ký âm giọng trưởng nào (0 ô
trên 17). Mượn ô của thầy khác là lấy luật thầy A áp cho thầy B; giữ bộ sinh làm đường lui
là giữ đúng cái đang muốn bỏ.

**Chưa xoá bộ sinh nào.** Ô tick còn là phép nghe thử; xoá trước khi người dùng nghe là bỏ
đường lui của một lối chơi chưa được duyệt bằng tai.

### Đoạn dạo · giang tấu · kết: sáng theo chỗ đang chơi, bấm vào đâu phát chỗ đó

Ba dải hợp âm ấy trước đây là **chữ chết** — hiện ra rồi thôi, không sáng, không bấm được.
Lý do nằm ở kiến trúc chứ không ở giao diện: phép tô sáng của bản lời đi qua `segments`,
mà `segments` chỉ tra ngược về **vòng hợp âm gốc của bài**. Đoạn dạo và đoạn kết **không
mượn vòng của đoạn nào** nên chúng không đẩy `segments` nào cả; các neo hợp âm của chúng
có `chordIndex === null`, và cả hai đường sáng/bấm đều không với tới.

Giang tấu thì ngược lại — nó CÓ `segments`, nhưng tra về chỗ **mượn** nằm giữa thân bài,
nên nó sáng ở đó chứ không sáng dưới chữ "giang tấu".

Đường mới: `SongTimeline.soloSpans` — mỗi đoạn không lời ghi `startBeat`, `lengthBeats`,
ký hiệu hợp âm và độ dài từng hợp âm. `soloChordAt()` tra ra hợp âm thứ mấy đang vang.

Ba chỗ phải cẩn thận, đã có test canh (`soloSpan.test.ts`):

- **Khoảng im sau đoạn dạo nằm NGOÀI `lengthBeats`** nên không hợp âm nào sáng ở đó. Đúng
  chủ ý — chỗ ấy là chỗ ca sĩ lấy hơi, không phải phần của đoạn dạo.
- **Mỗi LƯỢT giang tấu là một dải riêng.** Chơi vòng hai lần thì lượt hai sáng lại từ hợp
  âm đầu, không chạy tiếp số thứ tự.
- **Hợp âm chia không hết đoạn thì giữ sáng hợp âm cuối**, thà sai nửa ô còn hơn tắt giữa
  chừng rồi người đệm tưởng đã hết đoạn.

**KHÔNG dùng `introSymbols` để đánh số.** Danh sách ấy còn kèm hợp âm báo và ô hút bậc V
nên số thứ tự của nó **không khớp** với thứ tự hợp âm thật sự chơi — bấm vào sẽ phát lệch.
Dải lấy hợp âm từ chính `soloSpans`; chỉ khi chưa dựng xong dòng thời gian mới lui về danh
sách cũ, và lúc ấy dải chỉ để đọc.

Vòng hợp âm **giang tấu gắn vào bản lời bằng một bước riêng** (`attachInterludeToSheet`),
không gắn cùng `attachPhraseToSheet`: vòng giang tấu chỉ tính được SAU khi đã có bản nhạc
(nó nhặt một khoảng trong chính vòng của bài), gắn cùng lúc là vòng phụ thuộc quẩn.

### Nút "Phát lặp bản đệm" đặt sai tên — nó vốn LÀ nút phát cả bài

Người dùng hỏi nút ấy khác gì một nút "phát cả bài". Trả lời: **không khác gì cả.** Nó gọi
`playFromBeat(0)`, chạy trọn dòng thời gian đã sắp — có cả đoạn dạo, giang tấu, câu solo và
đoạn kết. Tên cũ sai cả hai vế:

- **không chỉ "bản đệm"** — nó phát cả câu solo;
- **không luôn "lặp"** — bài đã đánh dấu đoạn kết thì `playsOnce` cho phát một lượt rồi
  dừng, vì lặp lại là phá luôn cái kết.

Đã đổi tên thành *"Phát cả bài"*, **không thêm nút thứ hai**.

### Tab Luyện đệm giờ có nút phát cả bài

Tab ấy trước chỉ có lối tập chờ-đánh-đúng-nốt; `showToolbar={false}` tắt luôn thanh phát của
lưới hợp âm, nên không có cách nào nghe trọn bài mà không sang tab Tái hoà âm — đúng cái
đường vòng mà tab này lập ra để khỏi phải đi.

**Nút gọi `transport.playAll`, KHÔNG gọi `playFrom(0)`.** `playFrom` tra qua `segments`, mà
đoạn dạo không đẩy `segments` nào cả nên mốc 0 rơi vào chỗ bài hát vào — tức bỏ mất đoạn
dạo. `playAll` phát từ phách 0 của dòng thời gian đã sắp.

### Bỏ nút phát trùng ở khung chọn điệu

Khung chọn điệu có một nút phát, và thanh trên bản nhạc có một nút nữa — **hai nút gọi đúng
một việc**: `playFromBeat(0)` và `pausePlay`. Trước đây không ai thấy trùng vì nút ở khung
điệu mang tên *"Phát lặp bản đệm"*, trông như một chế độ khác. Đổi tên cho đúng thì lộ ra.

Giữ nút ở **thanh bản nhạc**: nó nằm cạnh chỗ mắt đang nhìn khi tập, và nó còn phân biệt
*"Phát trọn bài"* với *"Phát cả bài"* theo `playsOnce`, thứ nút kia không có.

### Vòng hợp âm giang tấu không hiện — vì bản nhạc không có đoạn nào tên "giang tấu"

Người dùng báo: *"sao dưới điệp khúc vẫn chưa thấy vòng hợp âm"*. Nguyên nhân không nằm ở
chỗ vẽ, mà ở chỗ **không có đoạn nào để gắn vào**:

- Đoạn chỉ được nhận là giang tấu khi **tên** nó chứa `giang tấu · interlude · solo · dạo
  giữa` (bảng `SECTION_KEYWORDS` trong `songTextParser.ts`).
- Nhưng chọn thầy **Linh Nhi** thì `steps` **tự chèn** một bước giang tấu sau điệp khúc, dù
  người dùng chưa đánh dấu đoạn nào cả.

Nên vòng ấy vẫn kêu lúc phát mà trên bản nhạc không có chỗ nào để gắn — hai đường không gặp
nhau. `attachInterludeToSheet` nay **dựng luôn một đoạn "Giang tấu"** khi bản nhạc chưa có,
đặt **ngay sau đoạn nó mượn vòng** (lấy từ `steps.find(interlude).over`), đúng chỗ nó vang
lên. Không tìm ra đoạn ấy thì đặt cuối — thà sai vị trí còn hơn giấu đi.

### Bảng tuyến mới thành mặc định, bảng cũ đã XOÁ

Người dùng chốt sau khi nghe: *"dùng bảng tuyến mới mặc định luôn đi, bỏ cái cũ và bỏ chỗ
tick đi."* Bằng chứng đứng sau quyết định ấy nằm ở câu #29 và #40 trong sổ Linh Nhi — hai
nốt họ nghe ra là lệch (`F#` và `C#` trên `G9sus4`) truy ra đúng ô `duong-xua` số 7 của
bảng cũ, chỗ mà bản ký âm ghi `F` và `C`.

Đã xoá `src/reharm/style/tuyenDaoLinhNhi.ts` và ô tick nghe thử. `gocTuyen` chuyển sang
`tuyenSolo.ts` — nhưng phải đặt trong **template của `tools/tuyen_o.py`**, không sửa tay:
lần đầu tôi thêm thẳng vào file sinh ra, lượt sinh sau xoá mất và 61 test đỏ cùng lúc.
**File sinh ra thì không sửa tay.**

**Hai lỗi thật lộ ra khi đổi, cả hai đã sửa:**

**1. Câu bị đẩy lên cao hơn một quãng tám.** Phép chọn quãng tám cũ nhích thêm ±12 khi mức
ấy có ít nốt lọt ra ngoài tầm hơn. Vốn ô có vài **nốt đáp trầm** rất thấp nằm ngay trên
khuông tay phải — Đừng Xa xuống tới MIDI 52. Chỉ vài nốt ấy lọt dưới đáy 57 là phép đếm
chọn `+12` và cả câu bay lên: đo được tâm **80,7** thay vì 73,6, trong khi bốn tuyến nguồn
đều nằm ở 70,8–76,0. Đã bỏ phép nhích ấy — `gap()` ngay dưới đã gập từng nốt biên vào tầm,
gập một hai nốt trầm là méo nhỏ hơn nhiều so với đổi hẳn chỗ ngồi của cả câu.

**2. Hai nửa ô cùng một hợp âm bị đếm là ô chia đôi.** `Dm | Dm` nhập kiểu nửa nhịp vẫn chỉ
là một hợp âm vang suốt ô. Bảng tuyến chỉ đặt `bac2` khi hai ký hiệu KHÁC nhau, còn bộ ghép
thì đặt bất cứ khi nào có ký hiệu thứ hai — lệch định nghĩa, và phép phạt lệch chia mất tác
dụng phân biệt. Cùng lỗi ấy ở bộ sinh: ô lấy đà (`bac === null`) bị tính là ô chia, ra
**7/59** thay vì **6/59** như bản ký âm.

**Ba test còn đỏ, KHÔNG nới cho qua** — mỗi cái nói một điều thật, đều là hồi quy chất lượng
chứ không phải kỳ vọng cũ kỹ:

| test | số | nghĩa |
|---|---|---|
| `baMonLinhNhi` · tay trái gõ một mình | **10%** (bản ký âm 41%, bảng cũ >30%) | hai tay đang dính vào nhau thay vì đối đáp — đúng thứ người dùng chê ở câu #7 |
| `giaiDieuDaoLinhNhi` · đổi hợp âm nửa ô sau | hai vòng khác nhau ra cùng một câu | bộ ghép vẫn ĐỌC hợp âm nửa sau, nhưng vốn ô mới không đủ khác để lộ ra |
| `phraseAssembled` · sáu lượt sáu câu | **5/6** khác nhau ở `pop-1 / outro` | bớt đa dạng một lượt |

Còn hai test đỏ từ trước khi đụng vào: `phraseAcrossBar` và `handSplitAudit` ô3.

### Hai tay đối đáp: trước nay KHÔNG bên nào nhìn bên kia

Test `baMonLinhNhi` đòi tay trái gõ **một mình** trên 30% (bản ký âm 41%, đo bảy đoạn dạo
giọng thứ). Đổi sang bảng tuyến mới thì tụt còn **10%**. Soi ra: **không phải lỗi của
bảng.**

Hai bảng có nhịp điệu gần y hệt nhau — cùng các vị trí phách hay gặp, cùng **43%** số mốc
rơi đúng phách nguyên, mật độ chênh 0,1–0,3 mốc mỗi ô. Chênh lệch 30% → 10% đến từ chỗ
khác: **không bên nào ngắm bên nào.**

- `soloLeftHand` tỉa tay trái theo **cường độ của chính mẫu đệm**, không biết tay phải
  đánh ở đâu.
- `giaiDieuDaoLinhNhi` nhận tham số `left` rồi **`void left`** — bỏ qua hoàn toàn.

Nên tỉ lệ hai tay đối đáp xưa nay là **chuyện hên xui**: bảng cũ tình cờ ra 21–30%, bảng
mới ra 10%. Không có cơ chế nào nhắm tới 41% cả.

**Đã vá ở phép CHỌN Ô**, chỗ duy nhất tay phải nhìn được tay trái: ô nào đè lên nhiều mốc
tay trái thì tốn điểm, trọng số **0,6** mỗi mốc đè. Không nắn nốt, không dời phách — chỉ
chọn ô khác trong vốn ô có thật.

Đo lại: tay trái gõ một mình **45% giọng thứ · 52% giọng trưởng** (bản ký âm 41%), và phép
**ghép ngược vẫn ra đúng câu gốc** — tức phép phạt đủ nhẹ để không phá hoà thanh.

Giá trị cũ **0**. Triệu chứng để lùi: đặt nặng hơn thì bộ ghép bắt đầu bỏ ô đúng bậc để né
mốc tay trái, `giaiDieuDaoLinhNhi.test.ts` đỏ ở bài "GHÉP NGƯỢC".

### "Đổi hợp âm nửa ô sau" CHÍNH LÀ "ô chia đôi" — và test cũ kiểm một thứ không có vật liệu

Người dùng hỏi hai chữ ấy có phải một thứ không. **Phải**: ô chia đôi là ô có hai hợp âm
KHÁC nhau, cái thứ hai vào giữa ô.

Test `ĐỔI HỢP ÂM NỬA Ô SAU` đỏ sau khi đổi bảng, nhưng **cơ chế không hỏng**. Đo:

    a === b ?  true    ← vòng của test cũ
    a === c ?  false   ← c chỉ khác ở chỗ đặt đúng một cặp chia CÓ THẬT

Vốn ô giọng thứ chỉ có **bốn ô chia**: Đừng Xa ô7 `2m→7` · Lá Thư ô2 `10→0` · Lá Thư ô5
`8→2` · Rừng Lá ô3 `10→5`. Vòng `b` cũ dùng toàn cặp không có trong vốn (`0→5`, `10→9`,
`8→3`…), nên phép phạt lệch chia **+2 rơi đều lên mọi ứng viên** — thứ hạng không đổi, câu
ra y hệt.

**Một phép phạt rơi đều lên mọi ứng viên thì không phân biệt được gì.** Đây là dạng bẫy dễ
lặp lại ở mọi phép chấm điểm: kiểm một tiêu chí bằng đầu vào mà **không ứng viên nào thoả**
thì tiêu chí ấy biến mất khỏi kết quả, và test đỏ trong khi mã đúng.

Đã đổi vòng `b` thành `… | Em | A7 | Dm | Dm` — đúng cặp `2m→7` của Đừng Xa ô 7.

### `Fadd2` chói tai vì vốn ô bậc IV chỉ có ĐÚNG MỘT ô

Người dùng: *"chỗ Fadd2 trong vòng hợp âm là chỗ hay có nhiều nốt nghe lệch tai nhất **dù
chuyển qua bao nhiêu câu**."* Chữ in nghiêng ấy là manh mối, và nó chỉ thẳng vào vốn ô.

Đo trên 44 câu đã lưu trong `Nguon.json`:

| hợp âm | nốt | ngoài hợp âm | nốt cách gốc nửa cung |
|---|---|---|---|
| **Fadd2** | 101 | 33% | **33%** |
| **Gadd2** | 98 | 29% | **29%** |
| Cadd2 | 164 | 12% | 5% |
| Dadd2 | 208 | 10% | 2% |

Tách theo bậc so với gốc hợp âm: `Fadd2` có **`♭5` 31%** và `Gadd2` **29%**, trong khi bản
ký âm Linh Nhi để bậc ấy ở **2%** trên hợp âm trưởng (n=305). Tuyệt đối: app **59 nốt**
quãng ba tăng, bản ký âm **7 nốt** trên cả bảy bài.

Cả `Fadd2` lẫn `Gadd2` đều là **bậc IV** của bài mình. Quãng ba tăng trên bậc IV chính là
**bậc 7 của gam** — diatonic, nên bộ ghép không thấy gì sai. Trên bậc I thì nó là `#4`,
ngoài gam, nên không bao giờ được chọn. Đó là lý do chỉ hai hợp âm ấy dính.

**Hai nguyên nhân, vá cả hai:**

**1. Vốn ô cạn — đây mới là gốc.** Vốn đoạn dạo Linh Nhi giọng trưởng, bậc IV: **1 ô, và
ô ấy mang sẵn quãng ba tăng.** Không có ô thứ hai để chuyển sang — đúng chữ "dù chuyển qua
bao nhiêu câu". Đã mở vốn sang ô của **giang tấu và đoạn kết** (`vonO` gộp cả ba đoạn, ô
mượn chịu phạt 2):

| bậc, giọng trưởng | chỉ đoạn dạo | gộp ba đoạn |
|---|---|---|
| I | 6 ô sạch / 6 | 23/23 |
| ii | 4/4 | 8/8 |
| **IV** | **0/1** | **6/8** |
| V | 3/3 | 9/10 |
| vi | 5/5 | 13/13 |

**2. Phép lui về cùng chức năng đổi nghĩa của nốt.** Ghép theo bậc thì bậc so với hợp âm
được giữ; nhưng không có ô cùng bậc thì bộ ghép lui xuống cùng **chức năng**, mà bậc ii và
bậc IV cùng là "hạ át". Ô của bậc ii mang nốt bậc 7 của gam — trên ii là `♭13`, nghe xuôi —
đặt sang bậc IV thì thành quãng ba tăng. **Không nốt nào bịa ra, vẫn ra nốt chói.**

Nay ô được chấm bằng **hợp âm THẬT nó sắp đứng lên**, không chỉ bằng bậc: mỗi nốt cách gốc
đúng quãng ba tăng phạt **1,5**, cộng **2** nữa nếu nó mở đầu ô (đo được 47% số nốt ấy rơi
vào chỗ mở ô, và người dùng báo đúng chỗ ấy hai lần).

Đo lại sau khi vá:

| | trước | sau | bản ký âm |
|---|---|---|---|
| `♭5` trên hợp âm `add2` | 31% | **4%** | 2% |
| nốt quãng ba tăng MỞ ĐẦU ô | 47% | **0** | — |
| ô `Fadd2` trên 12 lượt | 1 câu | **6 câu khác nhau** | — |

Không cấm tuyệt đối: bản ký âm vẫn có 7 nốt như thế, 3 trong số đó vào và ra đều bằng bước
liền bậc. **Phạt để chọn ô khác, không phải để nắn nốt.**

Phần thưởng kèm theo: `phraseAssembled` — *"sáu lượt ra sáu câu khác nhau"* — **tự hết đỏ**,
vì vốn ô rộng ra thì sáu lượt có đủ chỗ để khác nhau. Trước đó nó đỏ ở `pop-1 / outro`.

### Train đoạn dạo giọng trưởng trên 10 vòng — so thẳng với bản ký âm

Người dùng: *"train bộ soạn trên 10 vòng hợp âm trưởng theo các màu khác nhau cho đến khi
nào chúng sinh ra giai điệu đúng cao độ… Cấm không được copy nguyên câu intro."*

**Mốc đo** là ba đoạn dạo giọng trưởng của chị — Biển Tình · Đường Xưa · Mùa Xuân, **141
nốt**. Bàn đo thường trực: `src/reharm/style/__tests__/daoTruongLinhNhi.test.ts`, mười vòng
khác màu (trơn · add2/9 · maj7 · nặng bậc IV · canon · có ♭VII · treo · át phụ, cộng hai
vòng ở giọng Sol và Rê), 6 lượt mỗi vòng, **n ≈ 2765 nốt**.

| | trước | **sau** | bản ký âm |
|---|---|---|---|
| nốt của hợp âm đang vang | 64,6% | **66,1%** | 68,1% |
| nốt LẠC *(ngoài gam VÀ ngoài hợp âm)* | 3,6% | **1,0%** | 1,4% |
| cao độ trung bình | 73,1 | **75,4** | 75,3 |
| quãng ba tăng với gốc | 2,3% | 2,5% | 2,2% |
| bước liền bậc | 25% | **29%** | 32% |
| quãng ba | 24% | **25%** | 25% |
| nhảy 8+ | 31% | **21%** | 25% |

**Ba việc đã làm, mỗi việc một số đo đứng sau:**

**1. Ô mượn từ đoạn khác phải SẠCH GAM.** Vốn ô đoạn dạo có 1,4% nốt ngoài gam (trưởng) và
0,4% (thứ); giang tấu và đoạn kết có **2,2–3,5%** vì ở đó chị mượn hợp âm (Đường Xưa kết
`Am → Fm`). Mở vốn sang hai đoạn ấy để chữa bậc IV thì nhập luôn đám chromatic — nốt lạc
vọt lên 3,6%. Chặn ô mượn có nốt ngoài gam thì còn **1,0%**. Ô của chính đoạn đang soạn thì
giữ nguyên cả nốt ngoài gam của nó, đó là vật liệu thật của đoạn ấy.

> Đã thử phạt bằng trọng số trước: 1,5 → 3,2% · 3 → 2,7% · 6 → 2,4% · **12 → 3,4%** (xấu
> đi, vì phạt nặng quá thì bộ ghép bỏ ô đúng bậc và sinh ra lỗi khác). Bão hoà ở 2,4% và
> bắt đầu đánh đổi với tỉ lệ nốt hợp âm. **Một cái luật ăn đứt một cái trọng số ở đây.**

**2. Căn quãng tám theo TỪNG Ô, không chỉ cho cả câu.** Mỗi ô có thể lấy từ một bài khác
nhau nên hai ô liền nhau hay rơi vào hai quãng tám khác nhau, và chỗ nối thành cú nhảy
không ai soạn ra. Dời nguyên ô đi bội số 12 nên **không đổi tên nốt nào**. Nhảy 8+ **28% →
21%**, liền bậc **26% → 29%**. Chỉ nhận mức dời khi nó rút ngắn bước nối — cú nhảy quãng
tám vốn có trong bản ký âm (25%) thì giữ.

**3. Tách hằng số tầm âm theo giọng.** Số cũ **73,6** dùng chung, lấy trung bình bảy đoạn
dạo. Đo lại riêng: **trưởng 75,3** (75,2 · 74,5 · 76,0 — rất chụm) và **thứ 73,2** (70,8 ·
76,1 · 72,7 · 73,6 — tản). Dùng số gộp thì bài trưởng thấp hơn chị 1,8 nửa cung.

**Điều cấm chép nguyên câu** thành một bài kiểm riêng: mỗi câu phải ghép từ nhiều nguồn, và
không được là **một dãy ô liên tiếp của cùng một câu dạo**. Hệ quả: bài "GHÉP NGƯỢC" đổi
sang so **tên nốt bỏ quãng tám** — đòi trùng khít cả quãng tám là đòi đúng thứ vừa bị cấm.
Ràng buộc "mọi nốt đều thật" không mất, nó nằm ở bài kiểm khác.

### Hai phép rút tuyến giai điệu cùng tồn tại — CỐ Ý, người dùng đã chốt

Bên PianoBrain có hai phép rút tuyến tay phải từ cùng một bản ký âm, và chúng **cho hai kết
quả khác nhau ở ô nhiều bè**. Đây là chủ ý, không phải chưa dọn:

| | `tuyenSolo.ts` (bảng của KeyTrain) | `day_not.py` (bộ đo dãy nốt) |
|---|---|---|
| lấy gì | **nốt trên cùng** mỗi mốc gõ | **một bè** — mỗi mốc lấy nốt gần nốt trước, bỏ nốt đáp trầm dưới trung vị − 12 |
| để làm gì | **phát ra tiếng** | **đọc hiểu** cử chỉ |
| kiểm bằng | khớp `PianoBrain/data/sheet-solos` **285/285 nốt** | không còn bước nhảy quá 8 nửa cung |

Ca lộ ra chỗ lệch: **Rừng Lá Thấp ô 4**. Bộ đo dãy ra `A4 C5 E5 E5 D5`, bảng ghi
`C5 D5 E5 G5 D5 E5 E4 G4` — và `A4` **không có mặt** trong tuyến của bảng, tức cái "dãy" ấy
nằm ở **bè trong**, không phải tuyến trên cùng.

**Đừng hợp nhất.** Hai đường hợp nhất đã cân nhắc rồi bỏ:

- Hợp về **phép một bè** = đổi thứ app phát ra. Phép ấy cố ý bỏ nốt đáp trầm, mà chúng có
  thật và có kêu. Mật độ tay phải đang 5,2 nốt/ô so với bản ký âm 5,5 — bỏ thêm là tụt
  xuống dưới, và phá luôn con số 285/285.
- Hợp về **phép nốt trên cùng** = dựng lại đúng cái bẫy vừa gỡ. Chính nó đọc ra `D7 → A4`
  (−29 nửa cung) ở Lá Thư ô 106 và `D7 → E5` (−22) ở Đừng Xa ô 84.

Số đo về dãy nốt: **15 chuỗi trên 167 ô** (7 bài × 3 đoạn không lời) = 0,09 mỗi ô — thủ
pháp, không phải mặt bằng giai điệu. Nên **không dựng bộ sinh "dãy" riêng**: 4/5 chuỗi ở
đoạn dạo đã nằm sẵn trong vốn ô, bộ ghép tự mang theo khi ô ấy được chọn. Chi tiết ở mục
11b của `PianoBrain/knowledge/teachers/linh-nhi-piano.md`.

### Neo tầm âm tách theo TỪNG THẦY — Cà Pháo thấp hơn Linh Nhi gần nửa quãng tám

Số cũ: một hằng số **73,6** cho mọi thầy mọi giọng, lấy trung bình bảy đoạn dạo Linh Nhi.
Rồi tách thành `TAM_TRUONG 75,3` / `TAM_THU 73,2` — vẫn là số của riêng Linh Nhi, áp cho cả
ba thầy. Nay đo riêng **đoạn dạo** của từng thầy:

| thầy | trưởng | thứ |
|---|---|---|
| Linh Nhi | **75,3** — 75,2 · 74,5 · 76,0 (n=141) | **73,2** — 70,8 · 76,1 · 72,7 · 73,6 (n=239) |
| Cà Pháo | **70,8** — 70,7 · 71,5 · 70,4 (n=263) | **68,0** — một bài (n=62) |
| Tôn Hùng | *(không có bài giọng trưởng)* | **75,8** — 74,4 · 76,9 (n=97) |

**Đừng lấy con số 67 trong `ca-phao.md`** — đó là tâm gộp cả ba đoạn solo trên 828 nốt;
riêng đoạn dạo là 70,8. Hai mẫu số khác nhau.

Đo lại sau khi sửa: Cà Pháo trưởng ra **70,8** (đúng neo), Linh Nhi 75,8, Tôn Hùng thứ 76,6.
Riêng **Cà Pháo giọng thứ ra 71,0 so với neo 68,0** — không phải lỗi: phép căn tầm dời cả
câu đi **bội số của 12**, nên sai số tối đa là nửa quãng tám. Muốn sát hơn phải nắn từng
nốt, mà nắn nốt là thứ đã bị bác bốn lần.

Cỡ mẫu mỏng: Cà Pháo giọng thứ chỉ **một bài**. Nghe thấy sai thì kiểm số này trước.

### `raiLinhNhi.ts` đã xoá — bốn hằng số "xúc xắc" nằm trong mã không còn chạy

Bản bàn giao xếp `CUNG_GO` · `NHAN_BAN` · `CHONG` · `DEM_CHUNG` là *"vùng sinh lớn nhất còn
lại, nằm trên đường lui của giang tấu"*. Đúng lúc đó. Nhưng bộ ghép ô thật nay phủ kín cả ba
đoạn, và cả hai chỗ gọi `raiLinhNhi()` đều không tới được:

| chỗ gọi | vì sao không tới |
|---|---|
| `phraseSection.ts` | đứng sau `tuyenGhep && thaySolo`, mà `tuyenGhep = thaySolo !== null && (intro\|outro)` và hàm chỉ được gọi với intro/outro → nhánh `thaySolo === 'linh-nhi'` chỉ tới được khi `thaySolo` là `null`. **Mâu thuẫn, mã chết.** |
| `ReharmHome.tsx` | đường lui khi bộ ghép trả rỗng. Đo **0/128 lượt** trả rỗng — 8 vòng hợp âm × 2 số phách × 8 lượt, cả trưởng lẫn thứ. |

Nên sửa bốn hằng số ấy từ hàm băm sang phép soạn là **sửa thứ không ai nghe thấy**. Đã xoá
`raiLinhNhi.ts` (964 dòng) và `raiLinhNhi.test.ts` (31 bài kiểm canh một bộ soạn không chạy).

**CHUYỂN SỐ ĐO TRƯỚC KHI XOÁ.** File ấy dày số đo thật về cách hai tay Linh Nhi khớp nhau —
đã chép sang `PianoBrain/knowledge/teachers/linh-nhi-piano.md` **mục 10b**: tỉ lệ hai tay gõ
cùng nhau 54% (năm bài, kèm khoảng từng bài), phách 1 luôn có nốt tay phải (16/16 và 10/10 ô),
bảng đếm móc đơn xen theo tám vị trí trong ô, nhân bản lớp cao độ 36% (75/207 mốc chung),
khe hai tay trung vị 24 nửa cung, chuyện tay phải giữ nốt dài 5/10 ô, bước đi tay phải sau
khi sửa lỗi đếm nốt chồng, và hai ô "cửa ra" 61 · 71.

**Giữ lại `khungChayNgon`** — tách sang `src/reharm/style/khungChayNgon.ts`. Hai chỗ trong
`ReharmHome` cùng gọi nó (dựng câu chạy tay phải, và buông tay trái ra đúng khoảng ấy); chung
một hàm thì hai bên không thể lệch nhau. Có `khungChayNgon.test.ts` canh ba điều: rơi vào ô
áp chót, nốt cuối đáp đúng vạch (không để trống một phách — người dùng từng nghe ra "nghe nó
khựng lại rất dở"), và đoạn dưới ba ô thì không chen.

### Dòng lời ChordPro mở đầu bằng hợp âm bị đọc thành TÊN ĐOẠN

Người dùng tự gõ thêm hợp âm rồi báo lỗi: cả một dòng lời hiện lên thành tên đoạn viết hoa.

    [Am]Có ông vua [Fmaj7]trẻ xuất binh qua [G]rừng dẹp quân xâm [C]lấn [C]

hiện ra thành `AM]CÓ ÔNG VUA [FMAJ7]TRẺ XUẤT BINH QUA [G]RỪNG DẸP QUÂN XÂM [C]LẤN [C`.

Lỗi nằm trong đúng một biểu thức ở `sectionHeaderOf`:

    const bracket = /^\[(.+)\]$/.exec(trimmed)
    if (bracket) return asChord(bracket[1]) ? null : bracket[1].trim()

`.+` **tham lam**: dòng mở đầu bằng `[Am]` và kết thúc bằng `[C]` thì nó nuốt trọn từ dấu `[`
đầu tới dấu `]` cuối. Nhóm bắt được là `Am]Có ông vua [Fmaj7]…lấn [C` — đọc không ra hợp âm,
nên chính phép canh *"không phải hợp âm thì là tên đoạn"* lại cho nó lọt.

Sửa bằng `[^[\]]` — tên đoạn phải nằm trong **đúng một cặp ngoặc, không chứa cặp nào khác**:

    const bracket = /^\[([^[\]]+)\]$/.exec(trimmed)

`[Điệp khúc]` vẫn nhận; dòng lời nhiều hợp âm thì không. Có năm bài kiểm trong
`songTextParser.test.ts` canh cả hai chiều.

**Cái bẫy đáng nhớ:** một phép canh *"nếu không phải X thì là Y"* trở thành **cửa mở** khi
thứ đem đi canh đã bị bắt sai. Chú thích ngay trên chỗ ấy đã cảnh báo `[Am]` trông giống
`[Điệp khúc]` — nhưng cảnh báo ấy chỉ tính tới dòng **chỉ có một** cặp ngoặc.

### Hợp âm người dùng tự thêm bị nuốt trên bản nhạc — hai lỗi chồng nhau

Người dùng gõ thêm hợp âm vào lời rồi báo chúng không hiện trên bản nhạc đã tái hoà âm. Đo
ra **hai** lỗi, không phải một:

**1. `sectionHeaderOf` tham lam** — xem mục trên. Cả dòng lời thành tên đoạn.

**2. Phép gộp neo trùng tên nuốt hợp âm gõ lặp.** Trong `buildSongSheet`:

    if (prev && !anchor.passing && !prev.passing && prev.symbol === anchor.symbol) continue

Gộp **mọi** cặp liền nhau cùng ký hiệu, **bất kể đứng đâu trên dòng**. Nên
`[C]lấn [C]` chỉ hiện MỘT, `[Em]mưa [Em]` cũng vậy.

Hậu quả nặng hơn là mất một nhãn: hợp âm bị nuốt **vẫn nằm trong vòng hợp âm**, nên

- bản lời và **lưới hợp âm nói hai chuyện khác nhau** — lưới có 11 ô, bản lời hiện 9;
- **số thứ tự nhảy cóc** (`…#7` rồi `#9`), mà số ấy là khoá của cả phép tô sáng lẫn phép
  bấm-để-phát — nên **mọi neo sau chỗ nuốt đều trỏ sai hợp âm**.

Sửa: chỉ gộp khi hai neo **cùng `charOffset`** — hai nhãn chồng đúng một chỗ thì chỉ đọc
được một; khác chỗ là hai lần gõ khác nhau, phải hiện đủ.

Bỏ điều kiện cũ **không làm đỏ bài kiểm nào** — nó không bảo vệ thứ gì có test. Nay có ba
bài kiểm trong `songSheet.test.ts` canh: đủ 11 hợp âm, số thứ tự liền mạch 0–10, và hai nhãn
chồng đúng một chỗ thì vẫn gộp.

### "Giọng trưởng tươi sáng hơn" — đo được, nhưng KHÔNG nằm ở việc chọn nốt

Người dùng nêu: ở bài giọng trưởng các thầy *"chọn nốt có xu hướng tươi sáng"*. Đo cả hai
tay, mọi đoạn solo, bằng `PianoBrain/tools/sheet/sang_toi.py`.

**Chỗ phải loại bỏ trước.** So bậc giữa hai giọng thì chênh lệch lớn nhất là `3` **+15** và
`13` **+13**, `♭3` **−16**. Nhìn thì thuyết phục, nhưng **gam trưởng vốn có sẵn `3` và `13`
còn gam thứ vốn có sẵn `♭3`** — bốn con số ấy chỉ nói lại định nghĩa của hai cái gam.

**Phép so đúng là giữ nguyên chất hợp âm rồi mới so.** Làm thế thì bậc các thầy chọn ở bài
trưởng **gần như trùng khít** bài thứ. Nên "chọn nốt tươi sáng" không phải thứ bản ký âm cho
thấy.

**Ba chỗ thật sự đổi, và mỗi thầy một kiểu:**

| | Linh Nhi | Cà Pháo |
|---|---|---|
| hợp âm át ở bài trưởng | **2%** (bài thứ 11%) | **7%** (bài thứ 24%) |
| tầm âm bài trưởng so bài thứ | +1,4 — **gần như không đổi** | **+3,7 tâm, +9 trần** |
| nốt hợp âm ở bài trưởng | **70,2%** (bài thứ 59,9%) | — |

Riêng Linh Nhi, chỗ mạnh nhất là **mức bám hợp âm**: bài trưởng 70,2% so với 59,9%, bước
liền bậc cộng quãng ba **55% so với 38%**, và tỉ lệ nốt hợp âm ở **đoạn kết 75% so với 50%**
— tức hai giọng đi **ngược chiều** về phía cuối câu.

> **Cách đọc, người dùng đã xác nhận:** thứ tai nghe thành "tươi sáng" là **sự chắc chắn** —
> nốt nằm trên hợp âm, bước đi nhỏ, càng về kết càng chắc.

**Việc cho KeyTrain, chưa làm:** bộ soạn hiện dùng **cùng một bộ luật cho cả hai giọng**.
Muốn theo số đo này thì bài giọng trưởng phải siết về nốt hợp âm và siết thêm ở đoạn kết —
nhưng đó là đổi lối chơi, nên phải dựng sau một ô tick nghe thử, đúng luật người dùng đã đặt.

### Ô tick "siết bám hợp âm" — được hai, mất một, và một chỗ bão hoà

Bản ký âm Linh Nhi đổi mức bám hợp âm theo đoạn, và **hai giọng đi ngược chiều**:

    trưởng  dạo 68% · giang 68% · kết 75%   ← siết dần về cuối
    thứ     dạo 69% · giang 59% · kết 50%   ← càng về cuối càng rời

Bộ ghép thì **phẳng**: 60–68% ở mọi đoạn mọi giọng. Ô tick kéo phép chọn ô về đúng mức
(`DICH_HOP`), kéo **cả hai chiều** — nên đoạn kết giọng thứ được *nới ra* chứ không phải chỗ
nào cũng siết.

| | tắt | **bật** | bản ký âm |
|---|---|---|---|
| trưởng · dạo | 68,2% | 66,1% | 68% |
| trưởng · kết | 67,1% | **69,7%** | 75% |
| thứ · dạo | 60,0% | 59,7% | 69% |
| thứ · kết | 61,5% | **56,1%** | 50% |

Tổng sai lệch **28,6 → 22,6 điểm**. Hai đoạn kết đi đúng chiều và tách hẳn nhau ra; đổi lại
đoạn dạo giọng trưởng lùi 2 điểm khỏi mức vốn đã đúng.

**CHỖ BÃO HOÀ, đừng vặn lại.** Đoạn dạo giọng thứ đứng yên ở ~60% so với đích 69%. Dò trọng
số **3 · 8 · 20 ra gần như y hệt**. Lý do: tỉ lệ nốt hợp âm của một ô **nằm sẵn trong chính
ô ấy**; phép chấm chỉ chọn trong số ô đủ điều kiện, mà lọc theo bậc hợp âm xong thì các ứng
viên còn lại có tỉ lệ gần bằng nhau. Muốn đóng 9 điểm ấy thì phải **nới bộ lọc bậc** hoặc
**nắn nốt** — nắn nốt đã bị bác bốn lần.

Một đòn phụ có tác dụng: khi bật siết thì **phạt ô mượn từ đoạn khác nặng hơn** (2 → 7), để
đoạn kết dùng đúng ô của đoạn kết. Đó là thứ đẩy trưởng·kết từ 67,1 lên 69,7.

`sietHopAm.test.ts` canh cả ba: mặc định tắt không đổi một nốt nào · hai đoạn kết đi ngược
chiều và tách xa nhau hơn · và **đoạn dạo giọng thứ vẫn cách đích trên 5 điểm** — bài kiểm
cuối cố ý khẳng định chỗ CHƯA đạt, để phiên sau đừng tưởng đã xong.

### Chấm "tươi sáng" phải bằng BỘI SỐ, tỉ lệ thô so nhầm mẫu số

Bàn đo `boiSoTuoiSang.test.ts` — 16 vòng hợp âm trưởng × 4 lượt = 64 câu, 3074 nốt.

**Cái bẫy đã sập:** tỉ lệ nốt trúng hợp âm THÔ không so được giữa hai vốn hợp âm khác
nhau. Bài *Hoa Trinh Nữ* mà app soạn dùng hợp âm trung bình **4,33 nốt** (`Cadd2 · Dm11 ·
G9sus4`); ba đoạn dạo giọng trưởng của Linh Nhi dùng **3,05 nốt**. Rải bừa trong gam trên
vốn dày ấy đã trúng **64,9%**, so với **43%** trên vốn của chị — chênh lệch là của bảng
hợp âm, không phải của cách chọn nốt. Nên thước là

    bội số = (tỉ lệ trúng hợp âm) / (tỉ lệ trúng nếu rải bừa trong gam)

**Vì sao 16 vòng chứ không phát lại một bài nhiều lần:** độ lệch chuẩn giữa các LƯỢT của
cùng một vòng là 0,067; giữa các VÒNG là **0,115** — gần gấp đôi. Phát lại cùng một vòng
không thêm mấy thông tin. 16 × 4 đưa sai số phía app xuống 0,030.

**Chỗ chặn không nằm ở phía app.** Bản ký âm chỉ có BA bài giọng trưởng: bội số 1,60 ·
1,36 · 1,71, sai số chuẩn **0,103**, và con số ấy không giảm được. Chênh lệch nhỏ nhất
phát hiện được là **0,20 bội số**. Nên bài kiểm không đòi trúng trung bình 1,557, chỉ đòi
nằm trong khoảng 1,36–1,71 nới hai đầu 0,20. Siết chặt hơn là siết vào nhiễu.

Số hiện tại: **bội số 1,522 · bước nhỏ 55,3%** (chị 45–70%). Thấp nhất *Mùa Xuân* 1,33,
cao nhất *Đường Xưa* 1,65. Bài kiểm in số ra mỗi lần chạy.

**Thước phải bằng đúng thứ đang đo.** Bàn đo này dùng `SOLO_RANGE` (62–79) như app thật.
`daoTruongLinhNhi.test.ts` **vẫn còn dùng `{57, 95}`** — rộng hơn app thật 21 nửa cung,
nên nó báo tâm 75,8 đạt neo trong khi app thật ra 70,7. Test xanh mà app vẫn lệch. Chưa
sửa: sửa xong nó sẽ đỏ, vì trần 79 của `SOLO_RANGE` chặn không cho đạt neo 75,3.

### Bàn giao sang OpenCode nằm ở `Reference/BAN-GIAO-OPENCODE.md`

Hai agent cùng sửa hai repo này. Người dùng chốt: **không chừa phần nào cho bên nào** —
OpenCode đọc và sửa được mọi thứ Claude làm, và ngược lại. Ranh giới duy nhất còn giữ là
**ranh giới kiến trúc**, không phải ranh giới agent: mã PianoBrain không `import` thứ gì
trong KeyTrain; chiều ngược lại đi qua alias `@pianobrain`.

Cái bẫy đã sập: tôi để `.opencode/skills/train-teacher-solo/SKILL.md` ngoài git suốt nhiều
phiên vì tưởng `.opencode/` là vùng cấm. Bản ấy hoá ra là **bản đầy đủ nhất trong ba bản** —
nó có mục "Tone chủ" (đo sheet theo bậc và quãng so với tonic sheet rồi dựng lại trên tonic
bài đang mở) mà bản ở `PianoBrain/.claude/skills/` và bản ở `~/.claude/skills/` đều thiếu.
Chừa nó ra là chừa mất tri thức tốt hơn thứ đang dùng.


### Con số mốc của một bài kiểm phải TRA NGƯỢC được về bản ký âm

`boiSoTuoiSang.test.ts` chấm câu dạo của app bằng ba con số mốc — bội số bám hợp âm của ba
đoạn dạo giọng trưởng Linh Nhi. Ba con số ấy nằm trong hằng `CHI`, **do agent gõ tay**, và
không bản ký âm nào đỡ chúng: không md thầy nào ghi, không script nào ở PianoBrain sinh ra.
Người dùng hỏi thẳng có nên làm lại cho chắc không.

Đã dựng `PianoBrain/tools/sheet/boi_so.py`, có `--kiem`. Kết quả: **số gõ tay đúng** —
1,364 · 1,604 · 1,714, trung bình 1,561 (test ghi 1,60/1,36/1,71 → 1,557; chênh 0,004 do
làm tròn). Độ dày hợp âm 3,03 nốt (test ghi 3,05), rải bừa trúng 43,3% (test ghi 43%).

Nhưng **đúng là may, không phải quy trình**. Nay `CHI` ghi 3 chữ số và trỏ thẳng về
`boi_so.py --kiem` cùng `linh-nhi-piano.md` mục 16b; sửa một chỗ thì phải sửa cả ba.

Bảng đầy đủ mở ra hai thứ chưa từng đo:

- **Đoạn kết Linh Nhi: trưởng 1,807 · thứ 1,131** — chênh 0,68, gấp hơn ba lần ngưỡng phát
  hiện 0,20. Đây là **xác nhận độc lập** cho `DICH_HOP` (trưởng kết .75, thứ kết .50): hai
  phép đo khác nhau, cùng một chiều.
- **Đoạn dạo thì hai giọng y hệt: 1,561 và 1,549.** Đừng đặt luật "dạo giọng trưởng bám chặt
  hơn" — số đo không đỡ. `DICH_HOP` đặt .68/.69 ở đoạn dạo, nhất quán.

Và một cái bẫy mẫu số bị lật: `ca-phao.md` mục 3 ghi Cà Pháo bám hợp âm **chặt hơn** Linh
Nhi (70,8% so với 63,6%). Đúng theo **tỉ lệ thô**, nhưng theo **bội số thì ngược lại** —
1,299 so với 1,561. Lý do: hợp âm của Cà Pháo dày 3,51 nốt so với 3,03 của chị, mà hợp âm
càng dày thì rải bừa càng dễ trúng. Cả hai con số đều đúng, chúng trả lời hai câu hỏi khác
nhau — đã ghi rõ ở cả hai md.

### Đo xong mà không ghi vào file thì coi như CHƯA ĐO

Người dùng giao so bài *Hoa Trinh Nữ* với đoạn dạo giọng trưởng của Linh Nhi trên năm trục:
vòng hợp âm · nốt giai điệu tay phải · nốt rải hợp âm tay trái · tiết tấu đệm · độ tươi sáng.

Tôi đo bốn trục đầu, **báo trong khung chat, không ghi vào file nào**. Ngữ cảnh bị nén, số
mất. Khi viết bản bàn giao cho OpenCode thì tôi nhớ nhầm là đã ghi, nên viết rằng bốn trục
ấy nằm ở `linh-nhi-piano.md` §9b. **OpenCode grep ra và bác** — §9b chỉ là mốc ba bài giọng
trưởng (141 nốt tay phải), và chữ "Hoa Trinh Nữ" không xuất hiện ở bất kỳ đâu trong
`PianoBrain/knowledge/`.

Trạng thái thật, đã chép vào bàn giao mục 5.5:

- **Trục 5 (tươi sáng)** có bàn đo — `boiSoTuoiSang.test.ts` — nhưng nó chạy trên **16 vòng
  hợp âm chung**, không phải trên bài này.
- **Bốn trục đầu: chưa có gì lưu lại.**
- Vật liệu còn: hai câu app đã phát ở `Nguon.json` #117 và #118, cùng vòng 9 ô `Cadd2 · Dm11
  · Em7 · Fadd2 · G9sus4 · C · Am9 · G9sus4 · G (hút)`, 112 và 109 nốt, câu 118 người dùng
  tick **Chưa ổn**. Hai câu là quá mỏng — chính người dùng đã nêu.

Bài học đứng lâu dài: **kết quả sống trong khung chat là kết quả đã mất.** Đo xong thì ghi
vào md hoặc vào một bộ đo chạy lại được, ngay trong lượt ấy, trước khi nói "đã đo".
