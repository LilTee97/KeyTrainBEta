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

### "Man mác buồn" — chốt 7/9/2026, chiều ngược của tươi sáng

Cùng ba trục, **giong của BÀI**. Cỡ mẫu thứ: Linh Nhi 4 bài · Cà Pháo **1** · Tôn Hùng 2 (0 trưởng).

Không phải chọn `♭3` — gam ép, cùng bẫy với tươi sáng.

| trục | đo được | ai |
|---|---|---|
| vốn hợp âm | bài thứ **át nhiều hơn** trưởng (LN 6% vs 2% n=70/65; CP 26% vs 9% n=27/100). Gốc thứ: i–iv–V; Tôn Hùng thêm **♭VI 19% · ♭VII 22%** | hai thầy có bài trưởng: cùng chiều |
| tầm | CP thấp hơn 2,3 nửa cung; LN lệch 1,4 — **không hạ chị** | chỉ Cà Pháo |
| bám nốt | LN rời 59,9% vs 70,2%, kết 50%, nhảy+8va 52%. CP n=1 **bám 83,6%** — ngược | không chung ba thầy |

> **Người dùng chốt:** tươi sáng = **chắc chắn**. Man mác buồn = **không chắc + chỗ kéo**.
> Kéo = át, vòng i · iv · V/V7 · ♭VI · ♭VII. Không chắc = rời/nhảy/lặp (chỉ chắc khi soạn Linh Nhi).

Soạn thứ: **đừng siết như trưởng**. Luật rời/nhảy không áp Cà Pháo. Chi tiết số: `PianoBrain/knowledge/LUAT-SOAN-NOT.md`.

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

### Bộ soạn ra 32 câu khác nhau trên 32 lượt — không cần "làm nó đa dạng hơn"

Câu hỏi người dùng đặt: có phải sửa quy trình tạo intro để đủ câu so sánh không. Đo trên
vòng bài *Hoa Trinh Nữ* (`Cadd2 · Dm11 · Em7 · Fadd2 · G9sus4 · C · Am9 · G9sus4 · G`),
`take` chạy 0–31: **32 câu khác nhau, không câu nào trùng câu nào**, dài 40–54 nốt.

Cộng thêm hai thứ đã có sẵn trong app: `playSpin` nhích mỗi lần bấm phát
(`ReharmHome.tsx:3088`) nên mỗi lượt là một câu mới, và `luuCauDao` ghi từng câu vào
`Nguon.json` (`ReharmHome.tsx:3545`).

Nên `Nguon.json` chỉ có **hai** câu của bài ấy là vì bài mới được bấm phát hai lần, **không
phải vì quy trình chặn**. Đừng sửa `giaiDieuDaoLinhNhi()` để tăng đa dạng — nó đã đa dạng,
và sửa là đổi lối chơi, phải qua ô tick nghe thử.

Hai nhu cầu đừng lẫn: **đủ câu để ĐO** thì gọi bộ soạn nhiều `take` trong một bài kiểm, không
cần app; **đủ câu để NGƯỜI DÙNG CHẤM BẰNG TAI** thì chỉ có một đường là họ bấm phát thêm N
lần, agent không thay được.

### Tám câu dạo *Hoa Trinh Nữ* so với ba đoạn dạo trưởng của Linh Nhi

Đo 6/9/2026. App: 8 `take` cùng vòng 9 ô, `SOLO_RANGE` 62–79, điệu `bolero-linh-nhi-2`,
406 nốt tuyến. Chị: 3 bài (Biển Tình · Đường Xưa · Mùa Xuân), 141 nốt tuyến. Bàn đo
`hoaTrinhNuVsLinhNhi.test.ts` in số mỗi lần chạy. Kết luận **chỉ nói về vòng này**.

| trục | app 8 câu | chị 3 dạo trưởng | đọc |
|---|---|---|---|
| 1 vòng bậc | `I ii iii IV V I vi V V` | vi–iii–ii–I · IV–ii–I–vi · I–vi–iii–V | app đi bậc 1→2→3→4, chị không |
| 1 độ dày | **4,33** nốt · ba trơn 22% | **3,09** nốt · ba trơn 91% | bảng màu (`Cadd2 · Dm11 · G9sus4`), không phải bộ soạn |
| 2 tâm RH | **72,1** · min–max 62–79 | **75,2** · min 57 max **91** | app đụng cả hai tường `SOLO_RANGE`; chị *Mùa Xuân* chạm 91 |
| 2 bước | 27·28·17·16·12 | 32·24·13·25·6 | lien·ba·45·nhảy·lặp |
| 3 LH hình | xen **72/72** ô | xen 19 / lên 3 / một 3 (n=25 ô) | app không có ô đi lên |
| 3 LH quãng / tầm | 6,6 nc · 36–64 | 5,6·6,7·5,4 · 33–69 | trần app 64 = `SOLO_LEFT_TOP` |
| 4 RH nốt/ô | **5,6** | **5,6** (tuyến; mọi nốt RH = 6,8) | cùng mẫu số tuyến thì khớp |
| 4 LH mốc/ô | **9,0** | **6,8** | dạo trưởng không hãm → nguyên mẫu 9 cú |
| 4 LH một mình | **49%** | **49%** | khớp; 41% là số giọng **thứ**, đừng dùng |
| 5 bội số | **1,273** | **1,561** (1,36–1,71) | chênh 0,29 vs trung bình; vẫn trong khoảng 1,16–1,91 |
| 5 bước nhỏ | **56%** | **56%** | khớp |

**Cái bẫy mẫu số, đã sập một lần rồi tránh:** so RH nốt/ô bằng *mọi nốt tay phải* của chị
(6,8) với *tuyến giai điệu* của app (5,6) thì ra app thưa. Cùng tuyến: 141/25 ô = 5,6.

**Không kết luận "kém tươi sáng".** 1,273 thấp hơn trung bình chị 0,29 (vượt ngưỡng 0,20)
nhưng **không ra ngoài khoảng** ba bài của chị nới 0,20. Đúng lỗi đã rút ở mục bàn giao
số 5.

**Không mở `SOLO_RANGE`.** Số đo nốt cao nhất sheet trưởng: **91** (*Mùa Xuân*, n=1 bài;
hai bài kia 83 và 84). Trần cũ 79. Chưa đổi — chờ người dùng chốt trần mới.

Chưa sửa bộ soạn. Ô tick siết vẫn mặc định tắt.

### Bàn giao phải có mục "chưa đo", không chỉ mục "đã biết"

Người dùng vặn: *"Sao tôi kêu bạn đưa hết thông tin và tri thức của dự án qua cho OpenCode
mà vẫn nói nó có chỗ còn thiếu?"* — sau khi OpenCode phải hỏi người dùng chọn trần tầm âm.

Con số nó thiếu (**22,7% nốt của Linh Nhi nằm trên 79**) **chưa từng tồn tại** trong kho
trước ngày 6/9/2026, nên đó không phải thứ bị bỏ sót khi bàn giao. Nhưng bản bàn giao
**thiếu mục "chưa đo"**, trong khi mọi file md của từng thầy đều có mục ấy. Agent nhận bàn
giao vì thế không phân biệt được *"đã đo và chốt"* với *"chưa ai đo"* — nên nó hỏi người
dùng một câu dựng trên **max = 91**, mà 91 là đúng một nốt.

Đã thêm mục 11b vào `BAN-GIAO-OPENCODE.md`: bảy lỗ còn trống, kèm **cách đo đúng** cho
những cái bẫy hay gặp, và dặn xoá dòng khỏi bảng khi đo xong.

**Cái bẫy đáng nhớ nhất trong đó: chọn một NGƯỠNG thì đo PHÂN VỊ, đừng đo MAX.** Ba đoạn dạo
giọng trưởng của chị có max 91, nhưng 90 và 91 mỗi cao độ đúng một nốt, cùng một bài. Phân
vị mới dùng được: p50 76 · p75 **79** · p90 83 · p95 86 · p99 88. Trần app đúng bằng p75 của
chị, tức nó cắt 22,7% vốn nốt và cắt đúng phần trên — đó là lời giải cho tâm app 72,1 so với
75,3 của chị. Bộ đo: `PianoBrain/tools/sheet/tran_am.py`.

### Ô tick trần 84 — mặc định tắt; trần cần nhưng chưa đủ

Người dùng chốt: tick trần **84**, mặc định **TẮT**. Cũ **79**. 84 phủ 94,3% nốt dạo trưởng
Linh Nhi (n=141); 79 chỉ 77,3% (= p75, cắt 22,7%). 90 và 91 mỗi cái 1 nốt — không lấy.

Triệu chứng lùi 79: tâm ~72, câu đụng trần, ô bị gập xuống quãng tám.

`boiSoTuoiSang` **trước = sau = 1,522** / bước nhỏ 55,3% (64 câu · 3074 nốt) — mặc định vẫn
79 nên bội số không đổi.

Tâm, cùng 10 vòng `daoTruongLinhNhi` (n=2765 nốt mỗi trần):

    79 → 72,1    84 → 74,1    chị 75,3

Cùng chiều trên *Hoa Trinh Nữ* 8 câu: 72,1 → 74,1. Lên **2,0**, còn thiếu **1,2** tới 75,3.
Trần là điều kiện cần, chưa đủ — chỗ còn lại ở phép dời quãng tám.

`daoTruongLinhNhi.test.ts` đã chuyển sang `SOLO_RANGE` (62–79). Test CAO ĐỘ **đỏ**: tầm 72,1
cách 75,3 là 3,2 > 1,5. **Không hạ ngưỡng.** Ô tick: *Trần 84 (nghe thử)*, cạnh siết bám hợp âm.

### Gập theo ô, không gập từng nốt

Tai người dùng trên trần 84: *«bị gập nhiều chỗ»*. `gap()` từng nốt phá đường đi trong ô —
nốt cao giữ, nốt lệch tầm ±12. Cũ đã biết lỗi này (bản 1) rồi vẫn để `gap()` từng nốt vì
vài nốt trầm Đừng Xa (MIDI 52) từng kéo cả câu +12 (tâm 80,7).

Nay mỗi ô một k ∈ {-12,0,12}: hết nốt ngoài tầm nếu ô vừa khoảng; ô rộng hơn mới gập nốt
biên. Trần **giữ 79**. Tick 84 vẫn tắt.

Cũ: tâm 72,1 (n=2765). Mới: **71,3**. Bội số **1,522** không đổi (64 câu). Tâm hơi tụt vì
ô thấp được dời cả khối xuống thay vì chỉ gập một nốt lên. Triệu chứng lùi: câu gãy trong
ô — nốt lên xuống một quãng tám giữa cụm.

### Ô tick vòng dạo giống sheet trưởng — mặc định tắt

Cũ: xoay vốn hợp âm bài từ chủ âm → *Hoa Trinh Nữ* ra **I-ii-iii-IV**. Ba đoạn dạo trưởng
của chị (n=3) không bài nào đi dãy ấy: Mùa Xuân I-vi-iii-V · Biển Tình vi-iii-ii-I ·
Đường Xưa IV-ii-I-vi.

Tick bật + intro + major: lấy một trong ba mẫu (theo `tonic % 3`), hợp âm vẫn từ vốn bài,
ô cuối vẫn bậc V. Giọng thứ không đổi. Cũ để lùi: intro lại leo gam I-ii-iii-IV.

Ô: *Vòng dạo giống sheet trưởng (nghe thử)*, cạnh trần 84. `npx tsc` sạch. Vitest **2448
đạt / 3 hỏng** (2 sẵn có + `daoTruong` tầm 71,3 — không hạ ngưỡng).

Tick ấy lúc đầu chỉ đổi bậc, chất vẫn lấy vốn bài (`Am7 · Em7 · G7`). Sheet trưởng solo
**90% ba nốt trơn** (n=72 ô, 3 bài), add=0, maj7=0. Nay bật tick thì rút về tam âm; tắt
giữ màu bài. Cũ để lùi: intro lại `Am7/Em7/G9sus4`. Mặc định vẫn tắt.

### Intro điệu bolero Tuấn chơi Pùng-Pắp hai tay, không rải Linh Nhi

Cũ: chọn Bolero 1 (Tuấn) thì `kieuChoSolo` / nút Linh Nhi đẩy intro sang `bolero-linh-nhi-2`
— LH rải 9 cú, RH giai điệu ghép ô. Tuấn là loài khác: LH phách 1+3, RH đảo phách 7 điểm,
hai tay đã cài trong cell.

Nay intro Tuấn xen hai loại ô, suy từ sheet (không phải mọi ô cùng một việc):

- Linh Nhi intro **n=59 ô / 7 bài**: gd+rải 49% · gd+bass 25% · đệm đủ 17%
- Cà Pháo intro **n=34 ô / 3 bài** (thiếu file Hồng Kông 1): đệm đủ 38% · gd+rải 29% · gd+bass 15%

Tuấn không có rải. Còn **A = Pùng-Pắp hai tay**, **B = LH bass + RH giai điệu** (giữ đủ nốt
bộ soạn, không tỉa 4 cú Pắp). ~1/3 ô A. Ô B: thêm **1 câu chạy 4 nốt** (gam, móc kép, nửa
sau ô) — Linh Nhi 0,09 chuỗi/ô nên không chạy mọi ô. Hút bậc V cuối vòng **giữ**, kể cả khi
tick trơn chất / intro Tuấn. Cũ: lưới mất dòng `G (hút)`.

Ô B từ ô **3**: mọi ô giai điệu có LH Pắp (không xáo). Ô 1–2 không. Sheet 65/69 (94%).

### Intro Bolero Tuấn — trưởng và thứ (chốt 7/9/2026)

Khung chung: A Pùng-Pắp / B LH bass+RH giai điệu · Pắp LH từ ô 3 · 8 ô + hút V · chạy **4 nốt** (không 10 nốt lên — sheet intro trưởng n=6 và thứ n=7: **0** chuỗi ≥5). Tuấn 0 sheet.

| | trưởng (tươi sáng = chắc chắn) | thứ (man mác buồn = không chắc + kéo) |
|---|---|---|
| vòng | xoay vốn bài; tick `daoTruong` = mẫu n=3 Linh Nhi, trơn, cửa V | **luôn** mẫu n=3 thầy i–♭VII–♭VI / i–♭VII–♭III / i–♭VI–♭VII, trơn, cửa V |
| nốt | vốn intro trưởng, Ionian | vốn intro thứ, gam tự nhiên; 7 chỉ khi V |
| chạy | 2×4 | 1×4 xuống |
| phạt thêm | chuỗi lên ≥5 (chung) | + rải trưởng lặp, gãy luật 4, lặp <8%, bậc 3/6 trưởng; Cà Pháo thứ xếp sau |

Cũ để lùi: intro thứ chạy C–D–E–F–G (#191, 1 chuỗi ≥5 vs sheet 0) và rải G trưởng; intro trưởng 10 nốt lên. Tai: Đã ổn Tuấn La thứ 13 câu / ~20 phút sau lần cắt chuỗi. Đừng chồng heuristic nữa trên intro — nghe take. Chi tiết màu: `LUAT-SOAN-NOT.md`. Giang: nốt lấy **ô giang** 3 thầy, không ô intro (Chiếc Lá dạo từng lọt).

## 9/9/2026 — Từ câu mẫu sang bộ soạn solo mọi điệu

### Mục tiêu thật

KT không chỉ chép cho giống sheet và cũng không chỉ soạn Bolero. Đích là tự tạo intro,
giang tấu và outro có câu nhạc nghe hay, đúng tiết tấu điệu, đúng màu trưởng/thứ và vẫn
nhận ra ảnh hưởng của từng thầy mà không vá từng ô từ nhiều nguồn.

Hiện tại đây là **bộ soạn theo luật + thống kê từ kho sheet + phản hồi nghe**, chưa phải mô
hình máy học. Vì thế chỉ được nói đã tổng quát hoá kỹ thuật; chưa được nói đã “thành thạo”
một điệu khi chưa có sheet đúng điệu và lượt nghe xác nhận.

### Hai lớp phải tách

1. **Khung điệu:** số phách, độ dài ô, swing/straight, điểm nhấn của `cell`, kỹ thuật tay
   trái và kiểu đệm của điệu đang chọn. Khung này không được thay bằng nhịp của sheet nguồn.
2. **Ngữ pháp câu nhạc:** vòng theo bậc, đường nét cao độ, mật độ, chỗ nghỉ, mô-típ,
   cách lấy đà và đáp xuống nốt ổn định. Lớp này được học từ sheet và phản hồi Đã ổn/Chưa ổn.

Ví dụ #550 lấy vòng và đường nét tương đối từ một nguồn Cà Pháo Bossa Nova nhưng vẫn
chơi trong khung Bolero Tuấn; không mang tiết tấu Bossa vào Bolero.

### Một câu, một nguồn nhất quán

- Mỗi lần soạn chọn đúng **một thầy + một điệu + một đoạn nguồn** cho cả câu/đoạn.
- Không ghép ô Linh Nhi với ô Cà Pháo rồi ô Tôn Hùng trong cùng một câu.
- Lần soạn khác được đổi nguồn để tạo biến thể.
- Vòng nguồn đổi sang **bậc so với chủ âm**; giai điệu đổi sang khoảng cách so với chủ âm,
  rồi dựng lại ở giọng bài. Giữ đúng chức năng và chất hợp âm: V7 không được biến thành V
  chỉ vì cùng gốc.
- Khi chỉnh quãng, dời cả câu/cụm theo quãng tám; tránh gập từng nốt làm gãy đường nét.

### Màu trưởng/thứ là cổng bắt buộc

- Trưởng: Ionian/ngũ cung trưởng, sáng nhưng vẫn có nốt ngoài hợp âm để thành giai điệu;
  đáp ở chord tone tại điểm mạnh.
- Thứ: Aeolian/ngũ cung thứ, giữ ♭6 và ♭7; chỉ nâng bậc 7 khi làm leading tone/át. ♭VI và
  ♭VII trưởng vẫn là màu hợp lệ của giọng thứ. Phạt rải tam âm trưởng lặp, đường nhảy rộng
  cùng chiều và mô-típ sáng vô cớ.

### Mốc nghe #550 và bài học từ #552

#550, La thứ, Bolero Tuấn, đã được đánh dấu **Đã ổn**. Tám ô chính đi
`Am–Dm–Am–Dm–Am–Dm–Am–E`, tức i–iv lặp rồi cửa V; sau đó là ô hút. Nguồn nhất quán là
Cà Pháo — *Người Hãy Quên Em Đi* ở Rê thứ, chuyển theo bậc/chủ âm sang La thứ. Ô 1 là
giai điệu, ô 2 là Pùng-Pắp; không trộn Pùng-Pắp và tuyến giai điệu tự sinh trong cùng ô.
Khung tiết tấu và tay trái vẫn là Bolero Tuấn.

Đo 8 ô đầu: 66 điểm khởi phát = 8,25/ô; tâm khoảng MIDI 70,5; bước nhỏ ≤2 bán cung 55%;
nhảy ≥7 bán cung 12%; lặp nốt 12%; mật độ từng ô 9–4–10–10–4–10–9–10. Đây là **một
mốc nghe n=1**, không phải công thức phải ép mọi câu theo.

#552 được đánh dấu **Chưa ổn**, dù bình luận xác nhận đã đúng tinh thần tự soạn, đúng tiết
tấu và màu thứ; phần còn thiếu là độ hay như câu thầy. Điều đó bác bỏ giả định “đúng luật
= hay”: vòng, gam và nhịp chỉ là điều kiện cần, còn phải học mô-típ, độ căng–nhả, khoảng
nghỉ và hình dáng toàn câu.

### Vòng học tiếp theo

Mỗi vòng chỉ dùng một thầy + một điệu, sinh một nhóm nhỏ rồi dừng để nghe. So sánh câu
Đã ổn và Chưa ổn có cùng điệu/giọng/vòng; giữ cả nốt, hợp âm và bình luận trong `Nguon.json`.
Chỉ đưa khác biệt có bằng chứng vào luật và test. Khi điệu chưa có sheet đúng loại (swing,
waltz, reggae, tango…), dùng ngữ pháp chung trên `cell` hiện tại nhưng phải ghi là bản tổng
quát, chưa phải mô phỏng xác thực của thầy/điệu đó.

Mã hiện tại đã đưa feel/pulse của từng style vào tuyến sheet, bật tuyến solo mặc định cho
bài mới, ưu tiên một gam nhất quán và không còn coi reggae/funk/salsa là Bossa chỉ vì cùng
nhãn đảo phách. Đây là nền kỹ thuật; chất lượng nghe vẫn phải qua vòng phản hồi trên.


### Ô tick "siết bám hợp âm" nay ĐI NGƯỢC — nền đã tự tốt lên, ô tick thành có hại

Đo lại 9/9/2026 sau khi Codex sửa bộ soạn intro thứ (`minorSoloSource.ts`, `phraseScale.ts`,
`vonHopAmLinhNhi.ts`, `giaiDieuDaoLinhNhi.ts`).

| đoạn kết giọng trưởng | tắt siết | bật siết |
|---|---|---|
| số cũ, 6/9/2026 | 67,1% | **69,7%** ← tăng, đúng chiều |
| số nay, 9/9/2026 | **70,1%** | **68,0%** ← giảm, SAI CHIỀU |

Đọc cho đúng: **nền tự tốt lên**. Khi tắt ô tick, bộ soạn nay đạt 70,1% thay vì 67,1% — gần
đích 75% của bản ký âm hơn 3 điểm mà không cần ô tick nào. Nhưng phép chấm của ô tick vẫn kéo
theo `DICH_HOP` cũ, nên bật lên lại **kéo tụt xuống 68,0%**.

`sietHopAm.test.ts` bắt đúng chỗ này và đang đỏ. **Đừng hạ ngưỡng.** Ba đường xử, chưa chọn:

1. **Bỏ ô tick** — nền đã đạt gần đích, ô tick không còn việc. Rẻ nhất, nhưng mất một nút
   nghe thử người dùng có thể còn muốn.
2. **Đo lại `DICH_HOP`** trên bộ soạn mới rồi chỉnh phép chấm — giữ ô tick nhưng cho nó kéo
   đúng chiều.
3. **Để nguyên, tắt mặc định** — ô tick vốn đã mặc định tắt nên tiếng hiện tại không bị ảnh
   hưởng; chỉ là một nút bấm vào thì tệ đi.

Phải hỏi người dùng vì đây là **đổi lối chơi**, không phải sửa lỗi.

### `daoTruongLinhNhi.test.ts` đã sửa sang `SOLO_RANGE` — và nó đỏ, đúng như dự đoán

Bàn giao 6/9/2026 ghi test này còn dùng `range {57, 95}` nên xanh giả ở tâm 75,8 trong khi
app thật ra 70,7, và ghi *"sửa xong nó sẽ đỏ, và cái đỏ ấy là thật"*. Codex đã sửa; nay nó
dùng `SOLO_RANGE` và báo **tâm 71,3** so với neo 75,3 của Linh Nhi.

Nên việc 5.4(2) của bàn giao **đã xong**, và cái đỏ còn lại là việc 5.4(1) — trần `SOLO_RANGE`
= 62–79 chặn không cho đạt neo. Số phân vị đã đo: **22,7% nốt của chị nằm trên 79**, trần 84
phủ 94,3%. Người dùng chưa quyết mở trần.


### Đoạn kết KHÔNG lắng xuống — nó dâng lên. Và app đang làm ngược

Đo 9 đoạn kết giọng thứ của ba thầy (`PianoBrain/tools/sheet/ket_thu.py`, có `--kiem`) để
soạn outro cho điệu Bolero Tuấn. Kết quả ngược với trực giác, nên ghi kỹ.

| | bản ký âm (n=9) | app | |
|---|---|---|---|
| số ô | 3–12, tb **8,1** | **3** | `DEGREES.outro = [5,1,1]` |
| cao độ nửa sau − nửa đầu | **+8,2** · lên 7/9 bài | **−3,7** · lên 7/24 | **ngược dấu** |
| mật độ nốt RH mỗi ô | **−3,4** | **+0,6** | **ngược dấu** |
| bậc nốt chót | 5×4 · 1×2 | 1×24 | cứng |
| LH gõ một mình | 48% | 36% | chấp nhận được |

**Đoạn kết vọt lên cao rồi mới đóng**, không lắng dần như tôi tưởng. *Nỗi Buồn Hoa Phượng*
+25,9 nửa cung, *Có Em Chờ* +22,4. Hai bài đi xuống đều của Tôn Hùng, n=2.

Không mâu thuẫn với `slowClose` trong `phraseCue.ts` — hàm ấy chỉ giãn trường độ và bớt lực
ở **4 phách cuối**, không đụng cao độ. Đoạn dâng qua cả đoạn, ô chót mới chậm lại.

### ĐÃ SỬA 9/9/2026 — ba thay đổi, người dùng chọn sửa ngay dù Codex đang làm dở

Tôi đã nêu nguy cơ giẫm chân lên cụm chưa commit của Codex; người dùng chọn sửa ngay.

**1. `DEGREES.outro`: `[5, 1, 1]` → tám ô.** Luật ba ô đặt trước khi có sheet. Trong
`borrowedChords`, đoạn kết nay là `[ô dẫn, …sáu ô mượn từ chính bài, hợp âm chủ]` — dùng
`chooseInterludeWindow` như đoạn dạo, để đoạn kết không kêu ra một vòng lạ so với bài.
Số đo chỉ nói **độ dài**, không nói vòng nào; dãy `V–I–IV` trong `DEGREES` chỉ là đường lui
khi bài không có vòng để mượn, **chưa có bằng chứng từ sheet**.

**2. `thuaTayPhai` mở cho mọi thầy ở đoạn kết, và hãm theo DỐC.** Trước đó chỉ Linh Nhi được
hãm, và hãm về một mức **phẳng** — nó gỡ nốt ở ô đông nhất và cố ý chừa ô chót ra, nên không
ra dốc. Nay thêm tham số `doc` (mặc định `0`, giữ nguyên hành vi cũ cho đoạn dạo): hạn mức
giảm tuyến tính từ ô đầu tới ô cuối, và khi có dốc thì ô chót cũng bị gỡ — chặn dưới hai nốt
vẫn giữ cho ô không bỏ trắng. Đoạn kết truyền `doc = 3.4`.

**3. Thêm `dangCuoi`** — dời **cả cụm** nửa sau lên một quãng tám khi còn vừa tầm. Dời cả cụm
chứ không gập từng nốt, đúng luật chuyển giọng đã chốt. Không vừa tầm thì để nguyên.

| | trước | sau | bản ký âm |
|---|---|---|---|
| số ô | 3 | **8** | 8,1 |
| cao độ nửa sau − nửa đầu | −3,7 · lên 7/24 | **+2,2 · lên 17/24** | +8,2 · lên 7/9 |
| mật độ nốt RH mỗi ô | +0,6 | **−0,8** | −3,4 |
| LH gõ một mình | 36% | 31% | 48% |
| bậc nốt chót | 1×24 | 1×24 | 5×4 · 1×2 |

**Bậc nốt chót chưa làm.** Bản ký âm đậu bậc 5 nhiều hơn bậc 1 (4/9 so với 2/9), app vẫn luôn
bậc 1. Đổi nốt chót là chạm vào câu đáp — để sau khi nghe thử.

Ba test cũ khẳng định hình ba ô đã được **viết lại**, không phải nới ngưỡng:
`phraseBacking` và `phraseChordsBorrow` ×2 nay nói tám ô, ô đầu là ô dẫn, ô cuối đậu hợp âm
chủ **của chính bài**. Cùng lối với mục "ĐÃ XOÁ HAI LƯỚI rút hợp âm về chất cơ bản" trong
chính file test ấy.

`npx tsc` sạch. vitest **2492 đạt / 6 hỏng** trên 2498 — đúng sáu cái Codex đã liệt kê, không
thêm cái nào; bốn bài kiểm mới của `ketThuTuan.test.ts` đều xanh.

**Chưa ai nghe.** Ba thay đổi trên đổi tiếng của mọi đoạn kết, và chúng **không** nằm sau ô
tick — người dùng chọn sửa thẳng. Luật soạn đầy đủ ở
`PianoBrain/knowledge/teachers/tuan-luu-piano.md` mục 3c.

### Đoạn kết giọng thứ không hề dùng 9 tuyến kết có sẵn — khoá cứng ở một chữ

Người dùng chỉ rõ chỗ tôi làm sai hướng: *"tôi chỉ yêu cầu bạn dựa vào tiết tấu intro chứ
không phải soạn giai điệu theo khung của intro. Hãy đối chiếu với các câu solo trong các
sheet thứ rồi soạn giai điệu cho outro."*

`giaiDieuDaoLinhNhi.ts` có một dòng khoá cứng:

    const minorIntro = thu && options.gopThay === true && (options.doan ?? 'intro') === 'intro'

Nên đường **một nguồn nhất quán** — mượn nguyên một họ câu của một thầy thay vì vá ô từ ba
thầy — chỉ chạy cho đoạn dạo. Đoạn kết giọng thứ rơi về vốn ô **gộp ba thầy**, dù
`TUYEN_SOLO` có sẵn **9 tuyến đoạn kết giọng thứ**: Linh Nhi 5 · Cà Pháo 2 · Tôn Hùng 2.

Đã mở cho `outro`: `minorIntroSourceForTake` thành `minorSoloSourceForTake(take, doan)` (tên
cũ giữ làm lối tắt cho hai chỗ chỉ cần đoạn dạo), và cờ đổi tên `minorIntro` → `minorNguon`
vì bốn chỗ dùng nó đều là luật chọn ô của đường một-nguồn, không phải luật riêng đoạn dạo.

| | trước | sau | bản ký âm |
|---|---|---|---|
| LH gõ riêng · nhánh Linh Nhi | 28% | **44%** | 48% |
| LH gõ riêng · nhánh mặc định | 31% | **42%** | 48% |
| mật độ · nhánh Linh Nhi | −0,8 | **−1,0** | −3,4 |
| cao độ · nhánh Linh Nhi | +1,6 | **+2,8** | +8,2 |

Con số đáng chú ý là **tay trái gõ riêng**: lấy giai điệu từ tuyến kết thật kéo nó từ 28% lên
44%, gần mốc 48% của bản ký âm. Hai tay đối đáp đúng lối hơn, mà không phải nắn một nốt nào.

**Bàn đo phải chạy đúng nhánh app dùng.** Bản đầu của `ketThuTuan.test.ts` chỉ gọi không
truyền `thay`, tức đo nhánh mặc định, trong khi bài thật đi nhánh `vonHopAmLinhNhi`. Nó báo
xanh trong khi màn hình người dùng không đổi một ô. Nay chạy `describe.each` cả hai nhánh.
Cùng họ với bẫy `daoTruongLinhNhi.test.ts` từng mắc.

### Nốt chót đoạn kết: đã nắn, và đính chính hai chỗ tôi ghi sai

Nốt tay phải chót của nhánh Linh Nhi trước đây là **♭7 ở cả 24 lượt**. Bản ký âm chót ở bậc
**5 ×4 · 1 ×2 · 2 ×1 · ♭7 ×1 · ♭3 ×1** — sáu trên chín đáp xuống bậc 1 hoặc 5.

**Đính chính 1.** Tôi từng viết "không đoạn nào chót ở ♭7". Sai — có **một** (Chiếc Lá Mùa
Đông). Con số "không đoạn nào" là của **hợp âm cuối**, không phải nốt chót.

**Đính chính 2.** Tôi từ chối nắn nốt vì "người dùng đã bác bốn lần". Câu ấy do chính agent
viết ra rồi lặp qua nhiều file, **không có trích dẫn nguyên văn nào** đứng sau. Thứ người
dùng thật sự bác là *rút luật ra rồi sinh nốt*. Khi được hỏi thẳng họ nói: *"thấy cần nắn nốt
thì nắn đi."* Đã sửa lại câu ấy trong `PianoBrain/knowledge/teachers/ca-phao.md`.

**Chỗ nốt chót thật sự nằm ở đâu.** Nắn trên giai điệu không ăn, vì nốt cuối cùng người nghe
nghe nằm trong **cụm rải kết** chứ không trong giai điệu: đo một lượt thật thì ba tiếng chót
là `C4 E4 G4` — cụm rải của hợp âm `C` (bậc ♭III, một màu kết hợp lệ, sheet có 1/7), và `G`
chính là ♭7 của La thứ. Nên `dapChot` chạy **sau khi đã ráp cue**.

Nắn nốt **trên cùng** của cụm rải cũng là đổi thế bấm chứ không phá hợp âm: `C4 E4 G4` thành
`C4 E4 A4` là `Am/C`, vẫn nằm trong vốn hợp âm của bài.

Ranh giới của phép nắn này, ghi để đừng nới rộng: **một** nốt cuối cùng của **đoạn kết**, dời
**tối thiểu** về bậc 1 hoặc 5 gần nhất. Mọi nốt khác vẫn đến từ một ô có thật của bản ký âm.

Kết quả: **♭7×24 → bậc 1×24** ở cả hai nhánh. Chưa khớp tỉ lệ sheet — bản ký âm chuộng bậc 5
(4/9) hơn bậc 1 (2/9), app nay toàn bậc 1 vì dời tối thiểu từ ♭7 tới bậc 1 chỉ hai nửa cung
còn tới bậc 5 là ba. Và 3/9 đoạn sheet đáp ở bậc 2 · ♭7 · ♭3 thì app không còn màu ấy.
Triệu chứng để lùi: đoạn kết nghe quá "đóng", thiếu chỗ lửng.

### Vòng kết trơn theo mẫu sheet — được hợp âm, mất mật độ tay phải

Người dùng hỏi hai lần: *"sao intro thứ dùng các hợp âm giống trong sheet thứ nhưng outro
lại dùng hợp âm ngoài"* rồi *"sao outro vẫn còn vòng hợp âm add9 vậy"*. Đã làm theo.

Bật `theoSheet` cho `kind === 'outro' && thu` trong `vonHopAmLinhNhi.ts`. Cờ ấy kéo theo hai
việc: vòng chép theo **mẫu của sheet** thay vì xoay vốn bài, và kho hợp âm đi qua `tronBa`.

    trước:  Am(add9) Am(add9) Fadd2 Fadd2 Dm9 Dm9 Am(add9) Am(add9)
    sau:    Am       Am       E     E     Bm  Bm  Am       Am

**Số đo đứng sau việc này, đo 9/9/2026 trên đoạn không lời giọng thứ của ba thầy:**

| đoạn | số hợp âm | trơn |
|---|---|---|
| dạo | 61 | **82%** |
| giang tấu | 55 | **87%** |
| **kết** | 43 | **74%** |

Ba đoạn cùng một khoảng; đoạn kết chỉ kém đoạn dạo 8 điểm. Riêng Linh Nhi gần như tuyệt đối
trơn ở cả hai. App trước đây cho đoạn kết lấy thẳng vốn hợp âm của bài, nên bài dùng màu thì
đoạn kết ra **0% trơn** — lệch hẳn khỏi 74–82% của bản ký âm.

Lần đầu người dùng hỏi, tôi trả lời rằng 74% không có nghĩa các thầy *rút* về chất trơn vì
đoạn hát cũng 77%. Đúng về logic nhưng **không trả lời câu được hỏi** — câu hỏi là đoạn kết
có trơn như đoạn dạo không, và số đo nói **có**.

**GIÁ PHẢI TRẢ, chưa chữa được:** mật độ tay phải đoạn kết giọng thứ tụt còn **3,25 nốt mỗi
ô**, bản ký âm đo **5,7** (gộp 4 bài Linh Nhi). `baMonLinhNhi` MÓN 5 đỏ hai khẳng định, và
`ketThuTuan` nhánh Linh Nhi mất đường dâng.

Khoanh nguyên nhân bằng phép thử tắt/bật: tắt `theoSheet` cho outro thì `baMonLinhNhi` xanh
13/13, bật thì đỏ. Nên **vòng trơn là nguyên nhân**, không phải thứ khác. Vòng trơn làm ứng
viên ô bị lọc hẹp hơn theo bậc và chất, nên bộ ghép chọn phải những ô thưa.

**Đã thử và LÙI:** mở đường một-nguồn (`minorSoloSourceForTake(take, 'outro')`) cho đoạn kết.
Nó không chữa được mật độ, mà còn làm mỏng thêm vốn ô. Đoạn kết nay giữ **vốn ô gộp ba
thầy** — đúng chữ người dùng dùng, *"các sheet thứ"*, số nhiều. Cái đi theo mẫu sheet là
**vòng hợp âm**, không phải phép chọn ô.

**Một chỗ suýt phá luật có bằng chứng:** mẫu sheet đòi bậc II mà bài La thứ không có, thế là
`hopBac` dựng ra `Bm` từ hư không — `vonHopAmLinhNhi.test.ts` bắt đúng ("KHÔNG sinh bậc nào
ngoài bài", đo 7 bản ký âm, 16/20 đoạn). Đã chặn, nhưng **chỉ chặn cho `outro`**: chặn cả
đoạn dạo thì hai bài kiểm khác đỏ, vì đoạn dạo cần dựng chất mới trên bậc đã có.

### Đã chữa mật độ, và đã KHÔI PHỤC luật một-nguồn sau khi tự lùi khỏi nó

Người dùng nghe và nói: *"giai điệu câu outro rất lủng củng, rất dở và phô"*, rồi hỏi thẳng
tôi có học được luật của Codex không — *học từ thầy nào phải lấy cả vòng hợp âm của thầy đó
và soạn nốt trên đó, không chắp vá mỗi ô một thầy*.

**Tôi đã áp luật ấy cho đoạn kết, rồi tự lùi khỏi nó** vì `baMonLinhNhi` MÓN 5 đỏ (mật độ tay
phải 3,25 nốt mỗi ô so với 5,7 của bản ký âm). Đó là **sai thứ tự ưu tiên**: một con số mật
độ không được phép lật một luật kiến trúc. Tệ hơn, sau khi lùi thì **vòng hợp âm lấy từ một
nguồn còn nốt lấy từ ba thầy** — đúng nghĩa chắp vá, và tai người dùng bắt được ngay.

Đã khôi phục, và chữa mật độ bằng cách đúng: **chọn ô dày hơn**, không phải thêm nốt. Luật
phạt ô thưa vốn có (`m.o.n.length < 5`) chỉ chạy khi gộp thầy và **chừa ô cuối ra** — vì đoạn
dạo cần ô cuối thưa để nhường chỗ vào hát. Đoạn kết không có chỗ nào để nhường, nên phạt ở
**mọi ô**. Mọi nốt vẫn đến từ một ô có thật của bản ký âm.

`dangCuoi` cũng phải mở thêm hai đường, vì câu dày lên thì nốt cao lên: không nâng được nửa
sau thì **hạ nửa đầu** −12, không được nữa thì thử cụm **một phần tư cuối**. Vẫn là dời cả
cụm theo bội số 12, không gập từng nốt.

| | trước | sau | bản ký âm |
|---|---|---|---|
| mật độ tay phải · `baMonLinhNhi` | 3,25 nốt/ô | **5,7** ✓ | 5,7 |
| đi lên · nhánh mặc định | 17/24 | **20/24** | 7/9 |
| đi lên · nhánh Linh Nhi | 10/24 | 10/24 | 7/9 |

**Chỗ TRẦN ÂM chặn, không chữa bằng logic được.** Câu đoạn kết nhánh Linh Nhi trải từ **57
tới 93** — chạm cả sàn lẫn trần của tầm `{57, 95}`, trung bình cao 89,6 và thấp 59,5. Nên
không còn chỗ nào để dời quãng tám, cả ba đường của `dangCuoi` đều bí. Cùng loại với chuyện
`SOLO_RANGE` 62–79 chặn đoạn dạo không đạt neo 75,3.

Trạng thái: **2495 đạt / 7 hỏng** trên 2502 — sáu cái sẵn có của Codex cộng **một** cái của
bàn đo đoạn kết (đường dâng ở nhánh Linh Nhi). Cái đỏ ấy phơi ra giới hạn tầm âm, **đừng nới
ngưỡng để nó xanh**.

### Đoạn kết chưa bao giờ đi qua phương pháp của Codex — chặn ở một dòng

Người dùng hỏi thẳng: *"Có phải bạn vẫn luôn dùng phương pháp cũ của bạn để cho bộ soạn tạo
câu không? Những phương pháp mới được codex đưa ra và ghi vào bàn giao bạn phải làm theo,
không được mãi giữ cái của bạn nữa."*

Đúng. Và chỗ chặn là **một dòng** trong `phraseSection.ts`:

    const daoTuan = tuan && (kind === 'intro' || kind === 'interlude')

Cờ ấy gác **cả khối** dựng khung của Codex — ô Pùng-Pắp (`laOPap`, `oXenPap`), ô chạy
(`oChayCac`), và `datChaySheet` lấy bốn nốt liền của sheet thay vì dán arpeggio. Đoạn kết
không nằm trong danh sách nên chạy đường ghép ô cũ từ đầu tới cuối, bất kể tôi sửa gì ở
tầng trên.

Cùng họ với hai chỗ khoá cứng đã gỡ trước đó trong cùng phiên: `minorIntroSourceForTake` chỉ
lọc `doan === 'intro'`, và `minorIntro` trong `giaiDieuDaoLinhNhi.ts` cũng vậy. Ba chỗ, cùng
một kiểu: phương pháp mới viết cho đoạn dạo rồi khoá lại ở đó.

Đã mở cả ba, và cho `datChaySheet` nhận `doan` để đoạn kết học đúng 9 tuyến kết giọng thứ.

| | trước | sau | bản ký âm |
|---|---|---|---|
| cao độ dâng · nhánh Linh Nhi | +0,8 · lên 10/24 | **+5,7 · lên 20/24** | +8,2 · lên 7/9 |
| cao độ dâng · nhánh mặc định | +3,9 · lên 20/24 | **+4,1 · lên 20/24** | |
| tay trái gõ riêng | 40% | **59%** | 48% |
| mật độ nốt/ô | −0,8 | −0,1 | −3,4 |

**Còn một đỏ, và nó thật:** mật độ nhánh mặc định ra **+0,4**, tức dày dần chứ không thưa
dần. Khung Codex chèn câu chạy vào những ô sau, mà `thuaTayPhai` chạy **sau** khi chèn nên
hãm vào chính câu chạy thì hỏng câu. Chưa có cách chữa không phá câu chạy — đừng nới ngưỡng
để nó xanh.

Trạng thái: **2495 đạt / 7 hỏng** trên 2502 — sáu cái sẵn có của Codex cộng đúng một cái này.

### Đoạn kết thứ Bolero — làm theo chỉ dẫn Codex 10/9/2026, bốn mục đầu

Người dùng chốt: *"Bỏ đi những cách soạn cũ của bạn và hãy làm theo codex, từ nay mỗi lần
nhận chỉ dẫn của codex thì hãy làm theo và bỏ cách soạn cũ của bạn."*

**#1 Lọc đủ bốn điều kiện.** `TUYEN_SOLO` vốn **đã có** trường `dieu` từ bộ sinh, không phải
đụng `tuyen_o.py`. Thêm `nguonTheoKhoa` lọc `thầy + điệu + đoạn + màu giọng`, và
`nguonKetThuBolero` khoá cứng `linh-nhi + bolero`. Không có nguồn thì trả `undefined`, không
rơi ngầm sang thầy khác.

Bắt được lỗi thật: trong tám đoạn kết của Linh Nhi, **hai đoạn là `slow rock`** — *Lá Thư
Trần Thế* và *Một Cõi Đi Về* — mà chúng vẫn lọt vào vòng train Bolero. Lọc xong còn **ba**
tuyến: *Đừng Xa* · *Rừng Lá Thấp* · *Nỗi Buồn Hoa Phượng*.

**#3 Bỏ `ganNhat()`.** Thay bậc theo bán cung gần nhất **không phải** tương đương chức năng;
một `II` bị thay bằng `♭III` là đổi hẳn hướng hoà thanh. Nay nguồn nào đòi chức năng vốn bài
không có thì **loại cả nguồn** rồi thử nguồn kế. Kiểm được ngay: *Đừng Xa* cần bậc **II** mà
bài La thứ của người dùng không có → bị loại đúng.

**#6 Khoá theo `source.id`.** `datChaySheet` từng lọc `t.thay` — gom mọi bài của thầy ấy kể
cả khác điệu khác bài rồi cắt bốn nốt liền ở đâu cũng được, đúng nghĩa vá câu từ nhiều nguồn.

**#2 Cửa sổ ô LIÊN TIẾP thay cho chọn từng ô độc lập.** Đây là mục cho kết quả mạnh nhất.
Bộ xếp hạng cũ chấm từng ô theo bậc hợp âm và phép nối giọng — giữ được quan hệ hai ô liền
nhau nhưng **không** giữ đường cung cả câu: ô 5 của một bài có thể đứng trước ô 2 của chính
bài ấy. Người dùng nghe ra là *"lủng củng"*.

| trục | trước | sau | mốc Linh Nhi + Bolero (n=3) |
|---|---|---|---|
| cao độ dâng | +4,1 · lên 20/24 | **+9,5 · lên 24/24** | +14,2 · lên 3/3 |
| mật độ nốt/ô | +0,4 | **−0,6** | −3,4 |
| tay trái gõ riêng | 59% | **61%** | 45% |

**Mốc phải đo lại theo đúng tập.** Số cũ (+8,2 · lên 7/9) gộp chín đoạn của ba thầy và nhiều
điệu. Lọc đúng `Linh Nhi + Bolero + outro + thứ` còn ba bài: **+14,2 · lên 3/3 · mật độ −3,4
· LH riêng 45%**. Đường dâng mạnh hơn hẳn. **n=3 — là quan sát, không phải hằng số.**

**Một lỗi tự gây, đã sửa:** dùng `chon.length === 0` làm điều kiện `for` khiến vòng dừng ngay
sau ô đầu tiên với **mọi** đoạn — 24 test đỏ. Thay bằng cờ `dungCuaSo` riêng.

**Khử cặp hợp âm kề trùng** — ý người dùng, nêu bốn lần. Ô trùng ô trước thì thay bằng hợp âm
khác **đã có trong chính vòng ấy**; trùng ở cuối thì đổi ô áp chót chứ không đổi ô chót, vì ô
chót phải đậu hợp âm chủ. Bản ký âm CÓ giữ một hợp âm qua hai ô — đây là lựa chọn phối khí,
không phải số đo.

**Còn ba mục chưa làm:** #4 tách contour khỏi onset nguồn (sau khi lọc `dieu`, nguồn đã cùng
điệu Bolero với đích nên rủi ro giảm hẳn, nhưng cell Tuấn vẫn có pulse riêng) · #5 dựng cú
pháp outro riêng · #7 bỏ chuỗi hậu xử lý `thuaTayPhai → dangCuoi → dapChot`.

`npx tsc` sạch. vitest **2496 đạt / 6 hỏng** — đúng sáu cái sẵn có của Codex.

### Tiết tấu đoạn kết lệch vì onset lấy thẳng từ sheet nguồn — đặt lại vào lưới cell

Người dùng nghe và tách được đúng hai lớp: *"giai điệu đã gần ổn rồi nhưng mà tiết tấu thì
lệch với bolero Tuấn quá."*

Đúng chỉ dẫn #4 của Codex. Câu lấy từ sheet Bolero của **Linh Nhi**, còn khung đang phát là
cell Bolero của **Tuấn** — cùng họ điệu nhưng khác lưới gõ, mà `giaiDieuDaoLinhNhi.ts` phát
thẳng `n.at` của nguồn làm `startBeat`.

Lưới của `bolero-tu-n-improv-bai-04-00001`, đọc thẳng từ `cell` chứ không chép tay:

    tay trái (Pùng)  0 · 2 · 3
    tay phải (Pắp)   0,5 · 1,5 · 2,5 · 3,5
    gộp              0 · 0,5 · 1,5 · 2 · 2,5 · 3 · 3,5      ← đúng "lưới 7 điểm" trong md Tuấn

`datVaoLuoi()` đặt mỗi nốt về điểm lưới **gần nhất trong ô của nó**; hai nốt trùng điểm thì
nốt sau lùi sang điểm còn trống kế tiếp — giữ thứ tự, không chồng. Hết chỗ thì để nguyên
offset gốc, vì mất một nốt còn tệ hơn lệch nửa phách. **Không đổi cao độ, không thêm bớt
nốt** — contour và số nốt mỗi ô giữ nguyên.

| | trước | sau | bản ký âm |
|---|---|---|---|
| nốt tay phải rơi đúng lưới | — | **93%** (303/326) | — |
| tay trái gõ một mình | 59–62% | **51–52%** | 45% |

Tay trái gõ riêng tụt về gần mốc là dấu hiệu hai tay **khớp lưới với nhau** thay vì mỗi tay
một nhịp. 7% nốt còn lệch là các ô có nhiều nốt hơn 7 điểm lưới — đúng thiết kế.

`npx tsc` sạch. vitest **2496 đạt / 6 hỏng** — đúng sáu cái sẵn có của Codex.

Đã làm **6 trên 9** mục: #1 lọc corpus · #2 cửa sổ liên tiếp · #3 bỏ `ganNhat` · #4 đặt onset
vào lưới · #6 khoá `source.id` · #7 bỏ chuỗi hậu xử lý. Còn #5 (cú pháp outro riêng) và #8
(test tám bất biến).

---

## 10/9/2026 — Chuyển soạn outro thứ Tuấn: sửa nền trước khi gọi là tự sáng tác

Đánh giá lại sau khi nghe phản hồi “phô và lủng củng”: phần hướng dẫn cũ đúng ở chỗ phải giữ
nguồn và màu giọng, nhưng mã còn làm trái nó. Hợp âm có thể lấy nguồn khác giai điệu, cửa sổ
có thể quay từ cuối nguồn về đầu, `datVaoLuoi()` có thể đảo thứ tự onset, và `gap()` gập từng
nốt. Vì vậy test thống kê không chứng minh câu nhạc đã đúng.

### Quy tắc hiện hành cho **outro thứ · Bolero Tuấn**

1. Chọn **một tiểu cú liên tiếp** từ cùng một `source.id`, đúng `linh-nhi + bolero + outro +
   thứ`; không ghép ô của nhiều bài/thầy, không quay vòng nguồn.
2. Hợp âm và nốt phải lấy từ **cùng kế hoạch nguồn**. Chuyển về chủ âm bài đích theo bậc và
   chất; không có hợp âm tương thích trong vốn bài thì loại ứng viên, không thay bằng bậc
   gần nhất.
3. Tiểu cú phải đóng ở `i` và nốt cuối thuộc `1/b3/5`. Đây là điều kiện lọc cho vòng thử,
   không phải tuyên bố mọi outro hay đều chỉ có một kiểu cadence.
4. Giữ nghỉ, thứ tự, chia nhỏ phách và tension–resolution trong câu nguồn. **Không** ép mọi
   onset solo vào bảy mốc Pùng-Pắp; các mốc này là xương sống phần đệm, không phải lưới cấm
   của giai điệu.
5. Đệm chạy đúng cell Bolero Tuấn suốt đoạn, không khởi động lại cell mỗi lần hợp âm đổi giữa
   ô. RH Pắp chỉ trả lời ở khoảng trống thật của melody; không dùng lịch A/B hay câu chạy của
   intro để thay nguyên ô outro.
6. Chỉ được chuyển chủ âm và dời **cả tiểu cú** theo quãng tám khi vừa tầm. Không dùng
   `gap()` từng nốt, `thuaTayPhai`, `dangCuoi`, `dapChot` hay nâng nửa câu để ép số đo.
7. Không có ứng viên đúng tầm/hòa âm thì bỏ outro ở lượt ấy và báo lý do; không ngầm rơi về
   nguồn khác, không tạo câu dự phòng nghe có vẻ hợp lệ.

Mẫu kiểm chứng hiện tại là tiểu cú `noi-buon-hoa-phuong-outro`, `o4` index 1–4, chuyển Dm
sang Am: `Dm | G → F | F | Am`, thời lượng `4, 2.5, 1.5, 4, 4`. Dùng `o4` vì nguồn có ô
8 phách; không được dùng `o` đã làm mất nửa ô. *Đừng Xa Em Đêm Nay* tạm loại: bảng hiện rút
ô 6 phách về 4 và làm mất chất `Edim`, chưa đủ tin cậy để làm mẫu sinh.

### Phân biệt intro thứ đã ổn và outro thứ đang kiểm chứng

| | Intro thứ #550 | Outro thứ mới |
|---|---|---|
| mục đích | báo/mở phần hát | đóng bài |
| khung Tuấn | xen ô A Pùng-Pắp và ô B melody; hút V cuối | cell đệm xuyên suốt; Pắp chỉ đáp trong khoảng nghỉ; không hút V |
| nguồn cao độ | một câu thứ nhất quán, chuyển theo chủ âm | một tiểu cú outro Bolero liên tiếp, hợp âm và nốt chung source |
| tiết tấu melody | bỏ groove nguồn, đặt vai trò lên khung Tuấn | giữ onset/chia nhỏ phách câu nguồn; Tuấn nằm ở phần đệm |
| hậu xử lý | không chồng Pùng-Pắp và melody cùng ô | không gập/xóa/nâng/đổi nốt để ép số đo |
| trạng thái | #550 đã được người dùng chấm Đã ổn | mới qua kiểm chứng kỹ thuật, **chưa được người dùng chấm hay** |

Không được gọi cả hai là “machine learning” hay “đã tự sáng tác xong”. Đây là **chuyển soạn
có kiểm soát**. Bước sáng tác thực sự về sau phải rút motif, nốt neo, chỗ thở và giải tension
từ nhiều solo cùng màu, rồi tạo tiểu cú mới có dấu vết biến đổi — không vá ô hay chép MIDI.

### Sổ bình luận cho cả ba đoạn solo

`Nguon.json` và ô `OBinhLuan` nay phân biệt `intro | interlude | outro`. Khi phát trọn bài,
mỗi đoạn có span được lưu độc lập; ô Câu dạo, Giang tấu, Kết bài đều gắn đánh giá/bình luận
vào đúng `stt` của câu vừa nghe. Nếu outro không sinh được vì thiếu ứng viên, không có câu để
chấm và app hiện cảnh báo thay vì ghi nhầm câu khác.

Kiểm tra của vòng này: `coherentMinorOutro.test.ts` kiểm source, onset, tầm, hợp âm chia và
cadence; `nguon.test.ts` kiểm lưu ba loại đoạn. Build thành công. Toàn suite vẫn còn sáu lỗi
cũ ngoài phạm vi vòng outro; không báo toàn bộ xanh.

### Đoạn kết phát xong lại nhảy về đoạn dạo — hai lỗ ở tầng phát, không ở bộ soạn

Người dùng nghe 10/9/2026: *"outro đang phát thì tự nhảy lên intro, hoặc thậm chí không
thể phát khi đến outro, KT bỏ qua outro để phát intro và cứ lặp mà không kết bài."*

Truy đường chạy từ nút phát (`playFromBeat`) tới `startTimelineLoop`, ra hai lỗ, cả hai
trong `ReharmHome.tsx`:

1. **`playsOnce` không tính bước `outro`.** Nó chỉ nhìn `section.ending`, còn bước
   `{ type: 'outro' }` do `steps` tự thêm (Linh Nhi / giang thứ Tuấn) thì bỏ qua → bài có
   đoạn kết vẫn chạy `once = false` → hết đoạn kết là vòng quay về đoạn dạo, lặp mãi.
2. **`loopLengthBeats` lấy từ `song` — lượt của lần render trước.** `song` dựng ở pass 0
   với take cũ; lượt phát dựng bằng `base + pass` sau khi `playSpin` đã tăng. Đo n=12 take,
   Am · Bolero Tuấn: đoạn kết dài **21 · 17 · 25** phách tuỳ take (đoạn dạo cố định 36). Lệch
   tới 8 phách → vòng quấn về đoạn dạo giữa đoạn kết, hoặc lệnh dừng (`passLength + 4`) cắt
   ngang nó — đúng hai triệu chứng người dùng tả.

Sửa: `playsOnce` nhận cả `step.type === 'outro'`; `playFromBeat` dựng lượt 0 một lần
(`luotThu`), truyền `luotThu(0).totalBeats` cho engine và cho `buildPlaybackPass` dùng lại
chính bản dựng ấy (câu lưu vào `Nguon.json` và câu phát vẫn là một).

Chưa đụng: `song.totalBeats` vẫn dùng cho chỗ **sáng chữ hợp âm** (`% song.totalBeats` ở
ba chỗ) và effect đổi điệu giữa chừng — vẫn lệch cùng kiểu, nhưng chỉ sai hiển thị/đổi điệu
lúc đang phát, không sai tiếng. Để lùi: trả `playsOnce` về `section.ending` và
`loopLengthBeats` thay cho `luotThu(0).totalBeats`; triệu chứng lùi là bài lặp lại từ đầu
sau đoạn kết.

Test: 2543/2549 xanh; 6 đỏ có sẵn trước khi sửa (đối chiếu bằng stash trên mã đã commit:
4 đỏ y hệt; 2 còn lại sổ đã ghi là đỏ có chủ ý). **Chưa commit — chờ người dùng nghe.**

### Bản nhạc phải lấy vòng của lượt audio thật, không dùng vòng minh hoạ

Người dùng thấy dòng **Kết bài** hiện tám hợp âm (`Am C G C Am Em G Am`) nhưng tiếng dừng
sau khoảng bốn ô. Đây không phải mặc định outro chỉ có bốn hợp âm và cũng không phải audio
tự ý cắt một vòng tám ô. Lỗi là **hai nguồn dữ liệu khác nhau**:

- `outroSymbols` là vòng ước lượng để dựng giao diện trước đây.
- `buildPhraseSection()` / `planMinorOutro()` dựng câu thật theo lượt. Câu nguồn có thể có
  bốn ô, năm ký hiệu vì có ô chia (ví dụ `Dm | G → F | F | Am`, thời lượng
  `4, 2.5, 1.5, 4, 4`), và độ dài các lượt không nhất thiết giống nhau.

Vì vậy không được dùng `phraseChords()`/`outroSymbols` làm sự thật cho bản nhạc, tô sáng hay
nút bấm. `SoloSpan` của chính `SongTimeline` là nguồn duy nhất: `{ kind, startBeat,
lengthBeats, chords, beatsEach }`.

`ReharmHome` nay giữ `playingTimeline` khi `startTimelineLoop` dựng lượt 0 (và mỗi lượt sau),
rồi dùng nó cho dòng Dạo đầu/Kết bài, hợp âm đang sáng, nút bấm phát từ hợp âm solo và dải
Giang tấu khi đang phát. Khi không phát, giao diện dùng `song` xem trước; khi phát, nó phải
dùng đúng lượt audio. Không gắn dạo/kết ước lượng vào `sheet` đầu vào của `songSources`: vừa
tạo vòng phụ thuộc, vừa có thể cho người dùng một bản nhạc khác tiếng họ nghe. Bản để hiển thị
chỉ được ráp từ `baseSheet` sau khi timeline đã dựng.

Kiểm: `songSheet.test.ts` giữ nguyên cả năm ký hiệu của một outro có ô chia;
`coherentMinorOutro.test.ts` kiểm nguồn, thời lượng chia, cadence và tầm. Build đạt.

### Quét để đánh dấu đoạn: phải lấy cả hai dòng biên

`Range.intersectsNode()` của trình duyệt có thể không tính phần tử nằm đúng mép vùng bôi.
Do đó người dùng bôi từ câu đầu đến câu cuối nhưng nhãn **Phiên khúc** đôi khi bắt đầu ở câu
thứ hai. Đây không phải parser làm mất lời.

`SongSheetView` nay gộp các dòng giao với `Range` **và** dòng chứa `startContainer` /
`endContainer`; sau đó lấy `min..max`. Vẫn giữ cách bôi chữ native của trình duyệt, không dựng
cơ chế kéo thả riêng. Đánh dấu cũ không thể đoán ý định để tự sửa, nên người dùng cần xoá dấu
cũ và bôi lại một lần; các dấu mới nhận đúng cả dòng đầu/cuối. Test `songSheetView.test.ts`
canh trường hợp hai dòng biên bị `intersectsNode()` bỏ qua.

### Hồng Kông 1 là ballad, không phải bossa nova — người dùng sửa 10/9/2026

Nhãn `bossa nova` của Hồng Kông 1 đi từ lúc nạp kho PianoBrain (`1891a73`), không có căn cứ
đo. Số đo nghiêng hẳn về ballad và đã nằm sẵn trong mã: `bossaCaPhao.test.ts` ghi *"tay trái
Hồng Kông 1 gõ gần như móc đơn đều"* và loại bài này khỏi mẫu đệm bossa; hợp âm của bài là
`major`×14 · `sus4`×9. Nên mẫu `bossa-ca-phao` **không đổi** — nó dựng từ *Người hãy quên em
đi*, bài bossa duy nhất còn lại của Cà Pháo.

Đã đổi `dieu` của ba tuyến `hong-kong-1-*` trong `tuyenSolo.ts` sang `'ballad'` và sửa bảng
comment ở `hoDieu.ts`, `caPhaoSolo.ts`. Trường `dieu` hiện chỉ lọc ở nhánh Linh Nhi bolero
(`minorSoloSource.ts`), nên Hồng Kông 1 đổi nhãn không đổi tiếng. Để lùi: đặt lại `'bossa
nova'` ở ba tuyến ấy. PianoBrain đã sửa cùng lúc ở `328a5de`.

### Bossa CP cải tiến: học từ sheet, biên soạn theo tai nghe — 11/9/2026

**Cập nhật 13/9/2026:** phần khung đệm của mốc này đã được thay thế bằng
“Khung đệm chính thức Bossa CP cải tiến” ở cuối sổ và bảng đầy đủ trong
`Reference/CA-PHAO.md`. Giữ phần dưới làm lịch sử phương pháp, không dùng
mô tả “nửa A giữ mô hình sheet” để phục hồi đè lên khung mới.

Mẫu nền Bossa Cà Pháo được rút từ hai ô 9–10 của MusicXML *Người hãy quên em
đi* và đối chiếu với lần lặp 17–18. `Bossa CP cải tiến` không phải bản chép
nguyên xi: đó là bản **biên soạn KeyTrain** trên mẫu nền ấy, được người dùng
nghe nhiều lượt và xác nhận là hay. Phải giữ ranh giới này trong cả tên UI,
tài liệu và mã nguồn: “dựa trên Cà Pháo” là đúng; gán mọi tiếng của bản cải tiến
cho Cà Pháo là sai. Hồng Kông 1 vẫn là ballad/pop nhấn lệch, không phải corpus
cho bossa.

Mẫu CP cải tiến dài hai ô 4/4. Bản chính thức 13/9 giữ onset nửa A nhưng đã
thêm quãng tám Bùm 1, bass đỡ chát 2/chát 5, tăng lực chát 2 và Bùm 3.
Không còn dùng nửa A nguyên trạng của sheet làm khung chính thức. Chi tiết
cả 11 tiếng, bass dẫn và độ ngân thực phát nằm ở mục chốt mới bên dưới.

Điểm phương pháp quan trọng nhất: tách **lúc tiếng kế tiếp vào** khỏi **tiếng
trước ngân bao lâu**. Mỗi nốt/sự kiện phải có ít nhất onset, duration,
velocity và vai trò hoà âm. Khi chỉnh groove, đổi từng quan hệ một (onset,
độ ngân/khoảng nghỉ hoặc lực nhấn), rồi nghe lại. Di chuyển onset và duration
cùng lúc theo cảm giác làm mất nguyên nhân của thay đổi. Test xanh chỉ chứng
minh lịch nốt/invariant đúng; không chứng minh tiết tấu nghe hay.

Mẫu hai ô phải reset về nửa A tại đầu mọi đoạn nhạc. Nếu để cell 8 phách chạy
liên tục, phiên khúc mới sau số ô lẻ sẽ rơi vào nửa B và nghe như bị đổi điệu.
Đó là lỗi căn chỉnh chu kỳ, không phải biến thể biểu diễn. Kiểm bằng test đầu
đoạn 4, 6, 12, 14, 20 phách và bằng nghe thực tế qua nhiều đoạn.

### Quy trình rút điệu có thể dùng cho mọi sheet

1. Ghi corpus trước: thầy, bài, nhãn điệu đang là giả thuyết, file nguồn, ô
   dùng để dựng và ô dùng để đối chiếu. Không kết luận điệu chỉ từ tên bài hay
   một sheet.
2. Chuyển sheet thành timeline theo phách. Nốt có `chord` là cùng onset; `tie`
   là ngân, không phải re-attack; tôn trọng `backup`/`forward` trong MusicXML.
3. Tách bass, hợp âm đỡ, giai điệu/rải và nốt dẫn. Đàn piano solo có thể trộn
   chúng trong cùng một tay nên không được coi mọi nốt chồng là pattern đệm.
4. So các ô cùng chức năng hoà âm để tìm cell lặp 1–n ô. Giữ A/B khác nhau,
   không bình quân hoá làm mất nhấn–nhả, câu hỏi–đáp và khoảng thở.
5. Tách **khung điệu** (nhịp, mật độ, điểm nhấn, khoảng nghỉ, vai trò) khỏi
   **chất liệu** (bậc nốt, voicing, chromatic, voice-leading). Khi tái dùng ở
   tông khác, chuyển chất liệu theo bậc/chức năng của hợp âm, không bê cao độ
   tuyệt đối.
6. Gắn nhãn bằng chứng: *nguồn đo được*, *candidate cần thêm corpus*, hoặc
   *biên soạn KT đã được người dùng nghe duyệt*. Chỉ cái đầu mới được phát biểu
   là thủ pháp của thầy.
7. Kiểm bằng tai trên cả vòng, ranh giới đoạn và nhiều bài; test phải kiểm
   timeline/tổng phách/đích hoà âm/điều kiện biên. Khi tai và test mâu thuẫn,
   đo lại hoặc xem lại giả định — không dùng test để áp đặt một groove chưa ổn.

### Mốc đã duyệt: bộ ba solo thứ cho Bossa CP cải tiến — 12/9/2026

**Trạng thái sau quyết định 13/9/2026:** bộ ba này là tham chiếu lịch sử,
đang tạm ngưng phát theo yêu cầu dựng lại đệm. Không tự bật lại solo khi
chốt điệu. Khi người dùng yêu cầu làm solo tiếp, tuyệt đối không thay khung
đệm hát chính thức 13/9 để phục vụ solo.

Người dùng đã nghe và duyệt **cả intro, giang tấu và outro giọng thứ** của
`Bossa CP cải tiến`. Đây là mốc chất lượng đã chốt, không phải chỉ “test phát
được”. Khi sửa về sau phải so sánh lại với bộ ba này theo ba mặt độc lập:
khung tiết tấu, vòng/cadence và đường nét giai điệu; không đổi cả ba cùng lúc.

- Intro giữ nguyên bản đã duyệt; không áp template voicing mới ngược vào intro.
- Giang: 8 ô, mô-típ gọi–đáp và chạy ngón, hai vòng thì chỉ vòng cuối mới hút
  ii–V về hợp âm đầu của phần hát. Vòng trước giải về chỗ lặp, tránh tạo cảm
  giác câu nào cũng chấm dứt.
- Outro: 6 ô, giảm mật độ về cuối và ngân i thứ trọn ô cuối. Nguồn *Người hãy
  quên em đi* thực tế kết D trưởng; kết thứ trong KT là biên soạn đã được người
  dùng duyệt, không được ghi là nguyên văn Cà Pháo.
- Nút Cà Pháo dùng màu theo ngữ cảnh và voicing có nguồn đo, nhưng chưa có dữ
  liệu giai điệu hát để khẳng định mọi tension hợp mọi bài. Giữ các màu người
  dùng đã nhập và bass đảo; bấm lại cùng ngữ cảnh phải cho cùng kết quả.

Hồ sơ nguồn, phần KT biên soạn và invariant phát nằm ở
`Reference/CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md`. Chỉ cải tiến vòng tiếp
theo khi người dùng nêu rõ chỗ lệch thuộc tiết tấu, hòa âm hay giai điệu.

### Cách rút hợp âm Cà Pháo từ sheet để tái hòa âm — 12/9/2026

Mục tiêu không phải đếm xem Cà Pháo dùng bao nhiêu `m9` rồi ép nó lên mọi
hợp âm thứ. Phải rút **quyết định hòa âm theo chức năng và ngữ cảnh**, sau đó
mới chuyển sang bài đích.

1. **Chọn corpus đúng thầy, đúng giọng, đúng điệu.** Bossa thứ Cà Pháo hiện chỉ
   dựa vào *Người hãy quên em đi*; không mượn Ballad Hồng Kông 1 làm luật Bossa. Các
   sheet trưởng/ballad chỉ là bằng chứng cho màu hay voicing cùng vai trò, không cho phép
   chép tiết tấu sang Bossa.
2. **Đọc nội dung tại chỗ, không tin mù quáng nhãn hợp âm.** Tại mỗi ô, ghi bass, chùm RH,
   onset, tie và nốt nối. Nốt có thẻ `chord` chung onset; `tie` là ngân, không là gõ lại. Ví dụ
   ô 9 *Người hãy quên em đi* có nhãn XML D9add#11, nhưng C–E–F–A trên bass D cho
   bằng chứng Dm9 trong ngữ cảnh này.
3. **Tách ba lớp:** (a) hợp âm gốc/bass hoặc slash, (b) màu tension thực sự vang trong voicing,
   (c) nốt dẫn hay giai điệu. Bass chromatic tiếp cận, nốt qua hoặc nốt hát không tự động
   biến hợp âm thành mode/tension khác.
4. **Gán chức năng trước khi gán màu.** Phân biệt `v` thứ với `V7`: v thứ có thể giữ m7,
   còn V7 phải có bậc 7 trưởng để kéo về i. Hợp âm trưởng chỉ coi là át phụ khi
   đường đi thực sự giải quyết (ví dụ G→C); bVII không giải quyết không bị ép thành 7.
5. **Chuyển theo bậc/chức năng, không chép cao độ.** Đo root và tension so với tonic của
   sheet, rồi dựng lại trên tonic bài đích. Giữ nốt bass đảo nếu có; không thay bậc không
   tương thích bằng bậc gần nhất. Không có chức năng vốn bài thì loại candidate.
6. **Áp bảng màu có bằng chứng, rồi mới chọn thế bấm.** Bossa thứ: triad i→m9, iv→m11;
   Ballad thứ thiên m7; trưởng I/IV→maj7; át→7. Màu tập hợp này chỉ được áp khi hợp
   âm gốc là triad. Hợp âm đã ghi màu, slash hoặc tension trong lời nhập phải được giữ nguyên.
7. **Voicing là bằng chứng riêng.** Giữ cụm nốt có nguồn trong tầm vừa tay (ví dụ m9
   = b7–9–b3–5, m11 = b7–9–b3–11, maj9 = 7–9–3); LH giữ bass thật. RH có thể lược nốt,
   nhưng vốn nốt hòa âm đầy đủ vẫn phải còn để bass/rải đọc đúng bậc 5, 7, 9, 11.
8. **Kiểm giai điệu hát là giới hạn bắt buộc.** KT chưa có melody hát phân tích đầu vào,
   vì vậy không được khẳng định mọi tension đều hợp nốt hát. Giữ màu người dùng ghi và
   để màu có nguy cơ va chạm thành candidate/nghe thử, không coi là luật chung.

Kiểm cuối: cùng đầu vào/ngữ cảnh phải ra cùng vòng và voicing; nghe trên cả câu hát,
không chỉ nghe hợp âm rời. Ghi rõ nguồn đo được, suy luận hay biên soạn KT đã duyệt.

### Nút "Bossa test 1" — bản dựng lại Bossa CP cải tiến, tách riêng để nghe đối chiếu (12/9/2026)

**Phạm vi lịch sử:** các so sánh “giống bản đã duyệt” dưới đây nói về bản
12/9 tại thời điểm tạo nút, không phải khung chính thức 13/9. `Bossa test 1`
là nút độc lập; không ép CP cải tiến hiện tại trở lại giống test 1.

Người dùng yêu cầu: từ ba file ghi chép ở commit `64496ba` (`CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md`,
`CA-PHAO.md`, `SO-TAY.md`) tạo lại điệu Bossa CP cải tiến thành **một nút riêng**, không chồng lên nút cũ.

- `CA_PHAO_BOSSA_TEST_1` (`caPhaoBossa.ts`): id `ca-phao-bossa-test-1`, họ riêng nên `StylePicker` ra nút
  mới "Bossa test 1". Cell **viết thẳng từ lời mô tả** trong ghi chép (ô A: bass 1½ · tiếp cận dưới bậc 5
  ở 2& · bậc 5 ở 3; RH chát 2, 3&, 4& — ô B: bùm 7 · chát 8 ngân 1 · bùm 9 · chát 10 ngân 1 · chát 11 ½ ·
  bass dẫn ½), không spread từ bản cũ. Kết quả: **cùng tập sự kiện với bản đã duyệt** (khác thứ tự mảng
  tay trái, tiếng dựng ra y hệt — `bossaTest1.test.ts` kiểm cả hai). Cố ý: đây là bản tái tạo để đối
  chiếu; muốn thử gì thì sửa ở test 1, bản đã duyệt đứng yên.
- **Gom mười chỗ so cứng** `style.id === 'ca-phao-bossa-improved'` (ReharmHome ×6, caPhaoSolo ×2,
  phraseSection, sectionStyles) về `laBossaCP()` + `BOSSA_CP_IDS`. Trước đây thêm một nút thử là phải
  sửa mười chỗ, sót một chỗ là nút mới mất intro/giang/outro thứ. `hoDieu` cũng nhận họ mới vào nhóm
  bossa và `SOLO_TU_DO`.
- Kiểm: intro/giang/outro thứ của test 1 `toEqual` nút cũ cùng take (Am, thầy Cà Pháo). tsc sạch;
  2597/2603, 6 đỏ cũ. **Chưa nghe** — chờ người dùng.

Để lùi: bỏ `CA_PHAO_BOSSA_TEST_1` khỏi `VERIFIED_STYLES` và hai danh sách trong `hoDieu.ts`; `laBossaCP`
vẫn đúng với một id.

### Khung đệm chính thức Bossa CP cải tiến — người dùng duyệt 13/9/2026

Người dùng xác nhận “điệu đã ổn” và yêu cầu lấy khung hiện tại làm chính thức,
**thay thế khung cũ**. Mốc này ưu tiên hơn mọi mô tả khung CP cải tiến trước
đó, kể cả `64496ba` và các bản dựng thử. Đây là biên soạn KT dựa trên Bossa
Cà Pháo mới (ô XML 9–10 *Người hãy quên em đi*, đối chiếu 17–18), không phải
bản chép nguyên sheet. Chỉ chốt nút `ca-phao-bossa-improved`, không đổi mẫu
nguồn hoặc nút riêng `Bossa test 1`.

**Bùm₁ – chát₂ – Bùm₃-bum₄ – chát₅ – chát₆ | bùm₇ – chát₈ – bùm₉ – chát₁₀ – CHÁT₁₁ → bass dẫn.**

Hai ô 4/4, 8 phách, mặc định 110 BPM. Onset từ đầu cell (đếm từ 0):
`0, 1, 1.5, 2, 2.5, 3.5 | 4, 4.5, 5.5, 6, 7`; bass dẫn phụ ở `7.5`.

| Tiếng | Cách đánh đã chốt | Ngân (phách) | Lực RH / LH |
| --- | --- | --- | --- |
| Bùm 1 | LH bass gốc + quãng tám cùng lúc | 1½ | — / .90 |
| Chát 2 | RH hợp âm, thêm LH bậc 5 đỡ | ½ | .85 / .55 |
| Bùm 3 | LH dưới bậc 5 nửa cung, rõ hơn bum 4 | ½ | — / .85 |
| Bum 4 | LH bậc 5 | ½ thực phát tới tiếng 5 | — / .75 |
| Chát 5 | RH hợp âm + LH nhắc nhẹ cùng bass tiếng 4 | RH 1; LH 1½ | .72 / .50 |
| Chát 6 | RH hợp âm | ½ | .55 / — |
| Bùm 7 | LH bass gốc | ½ | — / .65 |
| Chát 8 | RH hợp âm + LH cụm 5–8–10 theo hợp âm | 1 | .60 / .45 |
| Bùm 9 | Như Bùm 7 | ½ | — / .65 |
| Chát 10 | Như chát 8 | 1 | .60 / .45 |
| CHÁT 11 | RH hợp âm, nhấn | ½ | .90 / — |
| Bass dẫn | LH trên bass hợp âm kế tiếp nửa cung | ½ | — / .45 |

Lực trên là `velocityScale`; ranh giới hợp âm/đoạn có thể cắt ngân theo
renderer. Bass ở chát 5 đánh cùng chát, không thêm tiếng chính thứ 12.
Duration thô của bum 4 trong cell là 2 nhưng `holdUntilStruckAgain` nhả tại
offset 2.5 để bass tiếng 5 gõ lại; LH tiếng 5 ngân đến 4. Không khôi phục
ngân bum 4 chồng lên lần gõ lại. Chát 8 nối ngay bùm 9, không nghỉ; bass dẫn
đánh **sau** CHÁT 11, không cùng lúc. Chỉ thêm bass dẫn nếu hợp âm kế tiếp
bắt đầu đúng đầu ô sau, không ở cuối bài. Đầu mỗi đoạn hát mở lại nửa A.

**Ràng buộc cho mọi phát triển solo/fill về sau:**

- Tuyệt đối không thay đổi cấu trúc khung này trong phần đệm hát: không mất,
  thêm hay dời tiếng; không đổi ngân, nhấn, vai trò tay hoặc chu kỳ để nhường
  chỗ cho câu solo/fill. Soạn mới mỗi lượt chỉ được thay câu solo, không được
  làm phần hát của cùng đầu vào đổi theo take/seed.
- Dạo/giang/kết là đoạn riêng. Quay lại phần hát phải trả đúng khung chính
  thức. Fill không vừa khe thì bỏ hoặc soạn lại fill, không sửa đệm.
- Hiện vẫn **chỉ đệm**, không tự bật lại dạo/giang/kết/fill; các câu cũ chỉ
  giữ để tham chiếu. Chỉ mở lại khi người dùng yêu cầu tiếp.
- Khi làm solo trở lại, phải kiểm timeline đệm hát trước/sau qua nhiều lượt,
  nhiều giọng và ranh giới đoạn. Không đổi kỳ vọng test để hợp thức hóa một
  khung chưa duyệt. Muốn đổi chính khung phải xin duyệt riêng theo phản hồi cụ thể.

Thông số tái tạo đầy đủ, phân biệt duration thô/thực phát và các mốc velocity
ở [MD Cà Pháo](CA-PHAO.md), mục “Khung đệm chính thức”. Mã gốc là
`CA_PHAO_BOSSA_IMPROVED` trong `src/reharm/style/styleLibrary/caPhaoBossa.ts`.
`buildBossaRhythmOnly` ráp phần hát không sửa event đệm và không xóa bài/câu
solo đã lưu. Các kiểm hồi quy liên quan: `bossaRhythmOnly.test.ts`,
`caPhaoBossaSheet.test.ts`, `caPhaoBossaSections.test.ts`, `timelineLoop.test.ts`.
Đánh giá “đã ổn” ở mốc này do người dùng nghe duyệt, không suy ra từ test xanh.

Kiểm khi chốt: 47/47 test liên quan đạt; production build đạt. Snapshot của
`bossaRhythmOnly.test.ts` khóa nguyên cell chính thức. `bossaTest1.test.ts`
đối chiếu mốc lịch sử 12/9, không còn ép nút chính thức giống bản thử cũ.
Toàn suite: 2.601 đạt / 2.607, còn đúng 6 lỗi đã bàn giao ở `phraseAcrossBar`,
`daoTruongLinhNhi`, `handSplitAudit`, `sietHopAm`, `tuyenSolo` (2 lỗi);
không nới các ngưỡng này và không sửa thêm âm thanh sau khi người dùng duyệt.

### Đã bỏ nút "Bossa test 1" (13/9/2026)

Người dùng yêu cầu xoá. Bản dựng lại hoá ra **trùng hệt** bản đã duyệt (cùng tập sự kiện, tiếng y hệt),
nên nút thử không cho nghe ra gì mới. Gỡ `CA_PHAO_BOSSA_TEST_1`, họ `ca-phao-bossa-test-1` khỏi
`hoDieu.ts`, và `bossaTest1.test.ts`. **Giữ** `laBossaCP()` / `BOSSA_CP_IDS` — mười chỗ so id đã gom về
một hàm là đúng dù chỉ còn một id; muốn thêm nút thử sau này chỉ cần thêm id vào tập ấy.

### Bossa CP cải tiến ở Mi thứ: intro rỗng → cả ba đoạn "không hiện, không phát" (13/9/2026)

Người dùng: bài Mi thứ (Am7 B7 Em7), bật dạo/giang/kết trong Thứ tự chơi mà bản nhạc không hiện vòng
hợp âm câu solo, cũng không phát. Hợp âm trên bản nhạc lấy từ `timelineHien.soloSpans` — chính thứ bộ
phát dùng — nên hai triệu chứng chung một gốc: bộ soạn trả rỗng.

Đo: `buildPhraseSection` với tầm app `soloRange(false)` = 62–79, hợp âm mở Am7: **Mi thứ intro rỗng**
("va chạm hai tay"), giang/kết vẫn ra nốt; La thứ ra đủ. Gốc trong `caPhaoBossaMinorIntro`: lấy đúng
`bases[0]` (quãng tám của nét) và `cadenceBases[0]` (vị trí cụm hút) rồi chạm tay trái là bỏ cuộc. Mi thứ
trong tầm 62–79 chỉ có một base (E4), cụm hút B7 rơi 63/66, chạm nốt E4 của cú chát LH.

Sửa: thử lần lượt mọi cặp (base × cadence) hợp lệ, lấy cặp đầu không chạm — vẫn dịch **nguyên nét** theo
quãng tám, không gập từng nốt (đúng luật Codex). Quét 12 giọng thứ × 3 đoạn × 2 take với tầm app: Mi thứ
qua; **F, F#, G, Ab thứ vẫn rỗng cả ba đoạn** vì nét 5…15 không lọt cửa sổ base [57,64] — chủ ý Codex
("tầm hẹp thì báo, không gập"), app có ô Trần mở (84) cho các giọng ấy; không đụng.
`caPhaoBossaEmIntro.test.ts` khoá: Mi thứ đủ ba đoạn; 8/12 giọng ra intro, 4 giọng báo "Tầm nốt quá hẹp".

Chưa xác nhận được vì sao giang/kết cũng không phát ở máy người dùng — engine ra nốt cho Mi thứ. Nếu
sau sửa vẫn mất giang/kết thì xem thầy solo đang chọn (cổng `thaySolo === 'ca-phao'`) và bảng cảnh báo
`phraseWarnings` dưới nút Phát.

**`caPhaoSolo.ts` để trong working tree, chưa commit riêng được**: file đang mang thay đổi dở của Codex
(`developBossaMelody`, import `licky/cpLick` chưa track). Commit riêng file này sẽ gãy build. Sửa của tôi
nằm ở khối "THỬ LẦN LƯỢT CÁC VỊ TRÍ QUÃNG TÁM"; ai commit `caPhaoSolo.ts` kế tiếp mang theo nó.

## 14/9/2026 — Chốt bộ soạn CP Lick và CP Run đã được duyệt

Người dùng xác nhận: **“bộ soạn CP Lick và CP Run đã ổn”**, yêu cầu ghi cách hoạt
động vào sổ tay và MD Cà Pháo. Giữ bộ soạn hiện tại làm mốc; không tự đổi tiết
tấu, lực đánh hay cách phối sau khi ghi nhận. Mốc này duyệt fill/run, không tự
duyệt mọi biến thể solo dạo/giang/kết hoặc xác nhận các sheet còn thiếu dữ liệu.

### Nguồn và đường đi của bộ soạn

1. `tools/cp_lick_corpus.py` đo MusicXML Cà Pháo ở `D:/PianoBrain`, xuất
   `src/reharm/licky/cpPhrases.json` (version 2). Đã đo 9 sheet; 7 sheet xuất
   697 mảnh, trong đó 294 mảnh có `supportComplete` trước các bộ lọc runtime.
   Các cửa nguồn có thể chồng nhau, không gọi là 697 câu độc lập. Kém duyên và
   Yêu xa chưa xuất câu vì còn thiếu xác nhận; xem phiếu hỏi bên dưới.
2. Ballad lấy từ Hồng Kông 1, Có Em Chờ, Ngày mai em đi, Để Em Rời Xa,
   Chưa Bao Giờ và Chúng Ta Không Thuộc Về Nhau. Bossa lấy từ Người hãy quên em
   đi, giọng D thứ. Giữ cử chỉ đúng họ điệu; không lấy run ballad nhét vào
   bossa chỉ vì đủ số phách. Run có ít nhất 4 attack đơn nốt ở tay chạy;
   chùm hợp âm cùng onset không được tách ra để gọi là run.
3. `planCpLicks` trong `src/reharm/licky/cpLick.ts` nhận hợp âm, thời lượng,
   giọng, điệu, timeline đệm, nhãn lời/nghỉ/cuối đoạn, yêu cầu thủ công và take.
   Chỉ xét hợp âm chính. Tự chọn cuối dòng lời hoặc mốc nối đoạn; thiếu nhãn
   nghỉ thì gợi ý mỗi hợp âm chính thứ 4. Bỏ chỗ có lời trừ yêu cầu thủ công;
   `skip` luôn thắng. Chế độ `vocal === 'full'` chặn cả yêu cầu thủ công.
4. Hai vị trí tự chọn cách nhau ít nhất 2 ô, đo giữa cuối hai hợp âm chứa câu.
   Cuối dòng chọn fill; cuối đoạn thử run rồi fill. CP Run thủ công chỉ tìm
   run; không vừa thì báo chưa chèn, không âm thầm đổi sang fill.
5. Lọc theo họ điệu, số phách/ô, phần hỗ trợ hai tay đầy đủ; ưu tiên kho cùng
   mode. Chỉ khi kho cùng mode rỗng mới dùng mode kia và soạn lại nốt. Bossa
   trưởng hiện biên soạn từ nguồn thứ, chưa có kho bossa trưởng riêng.
   Xoay kho theo `abs(trunc(take)*37 + mainIndex*7) % pool.length`.
6. Chọn mảnh đầu đặt được trong tối đa 2 phách cuối hợp âm, không dài hơn
   hợp âm đó. Tìm điểm vào lùi từng ¼ phách, giữ cùng vị trí phách trong ô như
   nguồn. Giữ onset tương đối, nghỉ và gate cả hai tay: không nén câu, không
   tăng BPM để nhét. Loại ứng viên nếu hai tay đụng cùng phím hoặc đệm giao
   cửa còn ngân vượt điểm kết của cửa.
7. `placeCpPhrase` dịch cao độ theo chủ âm, dời nguyên nét theo octave vào
   LH 36–60/RH 60–84; không vừa thì bỏ. Take chẵn có thể giữ nguyên nốt khi
   cùng mode, toàn bộ nốt hợp gam/hợp âm, đầu/cuối thuộc hợp âm. Trường hợp
   khác soạn nốt gần nét nguồn: phách nguyên ưu tiên chord tone, phách lẻ
   theo gam cộng nốt hợp âm; cuối câu ưu tiên nốt chung với hợp âm kế.
   Loại bậc ba trái tính chất hợp âm. Approach nửa cung chỉ giữ khi nguồn
   có bước đơn nốt ấy, ở phách lẻ, gate ≤¼ phách và tới nốt hợp lệ trong
   ≤½ phách. Không biến mọi nốt ngoài gam thành luật chromatic tùy ý.
8. Kết quả gồm câu, đệm đã phối, vị trí/nguồn/cửa từng câu và lý do bỏ qua.
   `ReharmHome.buildPass` dùng **cùng một kế hoạch** cho cả nốt và cửa đệm.
   Lượt phát mới đổi take để xoay nguồn/soạn nốt; lặp đoạn trong cùng lượt
   giữ kế hoạch. Cùng đầu vào + take tái tạo cùng kết quả; không hứa mọi lần
   đều khác nhau khi chỉ có ít ứng viên phù hợp.

### Ngoại lệ phối đệm và những điều phải giữ

- Người dùng đã cho phép thay đệm cục bộ trong câu fill/run/nối theo hai tay
  của sheet. **Ngoại lệ này thay lệnh cấm tuyệt đối với CP Lick/Run ở mốc cũ**,
  không thay bảng khung Bossa CP cải tiến đã duyệt.
- `cpBacking` thay event bắt đầu trong `[start, end)` bằng câu và tay hỗ trợ
  nguồn; nốt đệm ngân từ trước được nhả tại đầu cửa. Không tự gõ lại ở cuối
  cửa. Các event không giao cửa giữ nguyên. Ngoài cửa CP vẫn đúng khung
  11 tiếng/8 phách, BPM không đổi, đầu đoạn hát mở lại nửa A. Không áp thêm
  cách nhường tay của Licky/Kingsley lên kế hoạch CP.
- Velocity câu là 52, nhóm cuối 58: lựa chọn biên soạn KT, không phải đo lực
  từ audio sheet. Solo dài là bộ riêng, không đánh đồng với CP Lick/Run.
- Ô **CP Lick** mặc định tắt, được lưu theo bài. Bật thì thay bộ fill/run cũ;
  menu chuột phải dùng **CP Lick / CP Run**. Tắt thì quay về bộ cũ, riêng
  Bossa CP cải tiến tắt câu chêm nhưng không tắt solo thứ đã bật lại.
- Giữ sửa hiệu năng `2a45131`: memo hóa thống kê số nốt, ổn định tham chiếu
  tầm solo. Không gọi bộ soạn chỉ để cập nhật con trỏ hoặc thống kê mỗi tick.
  Không sửa khung/BPM để che lỗi gửi nốt trễ trên luồng giao diện.
- Chỗ nghỉ lấy từ cấu trúc lời, chưa phải timestamp giọng hát thực. Thiếu
  nguồn đúng điệu hoặc không đặt vừa thì báo thiếu/bỏ câu, không bịa nguồn.

Chi tiết thuật toán và quy tắc bảo toàn: [CA-PHAO.md](CA-PHAO.md), mục “CP Lick
và CP Run”. Bảng nguồn, cách đo và kiểm hồi quy: [CP-LICK.md](CP-LICK.md).
[Phiếu hỏi nguồn còn thiếu](PHIEU-HOI-CP-LICK-2026-09-13.md) vẫn để ngỏ;
duyệt bộ soạn không có nghĩa đã trả lời các câu hỏi nguồn.

**Phạm vi lưu mốc:** mục này mô tả mã đang chạy trong working tree ngày 14/9.
Commit tài liệu không đồng nghĩa đã commit toàn bộ triển khai CP: `cpLick.ts`,
`cpPhrases.json`, `tools/cp_lick_corpus.py`, test CP và các thay đổi tích hợp
đang có trong working tree phải được giữ và đóng gói cùng nhau khi commit mã.
Không phục dựng bộ soạn chỉ bằng một file solo hoặc commit tài liệu này.

Kiểm tại lượt ghi tài liệu: `npm test -- cpLick playbackRenderCost bossaRhythmOnly`
đạt 12/12 test (3 file). Lượt này chỉ sửa tài liệu, không đổi mã hoặc dữ liệu nhạc.

## 19/9/2026 — Chốt solo Cà Pháo đã duyệt; tách sửa giọng khỏi chuyển tông

### Mốc âm nhạc phải giữ nguyên

Người dùng xác nhận **“các câu solo hiện tại đã đạt rồi, giữ nguyên ngay mức
này và đừng sửa thêm gì nữa mà hãy commit luôn”**. Đã đóng gói triển khai CP
hiện hành vào **`bcddfd0`** (`feat: freeze user-approved CP solo and lick
composition`), gồm mã, dữ liệu nguồn, tích hợp UI/phát và test liên quan;
không còn tình trạng chỉ commit tài liệu nhưng bỏ triển khai trong working
tree như ghi chú 14/9 phía trên.

- Dừng train tại mốc này. Giữ nguyên tiết tấu, bố cục kỹ thuật, vòng hợp âm,
  giai điệu, phối tay/bass, dặm/cú giật và dẫn intro/giang sang đoạn kế tiếp.
  Không tự “cải thiện” thêm nếu chưa có phản hồi cụ thể mới.
- Khung hát Bossa CP cải tiến vẫn 11 tiếng/8 phách ngoài cửa CP Lick/Run
  được cho phép phối lại. Solo full/rút gọn, mô phỏng và cách soạn hiện có
  được giữ; chỉ Phát trọn bài sinh lượt mới, click hợp âm khi phát không sinh lại.
- Giữ cách chọn nốt theo ngữ cảnh hòa âm trong `cpComposition.ts`, không
  quay lại nắn nốt đơn lẻ bằng `refineBossaPitches`. Kiểm chromatic có chuẩn
  bị/giải theo nguồn; tránh hai bước nhảy liên tiếp ≥5 bán âm trong nhóm
  ba mốc nhanh cùng hợp âm, giọng thứ, tối đa hai bè/mốc. Đây là luật đã có
  ở mốc duyệt, không phải đề xuất train mới.
- Chọn màu **Cà Pháo** tự dùng CP Lick/Run thay Licky, kể cả bài cũ lưu ô CP
  Lick tắt. Mô tả ô tick ở ngày 14/9 là trạng thái lịch sử; mã hiện hành dùng
  `intensity === 'caPhao' || cpLickSelected`.
- “Đã duyệt” là xác nhận của người dùng về mức bộ soạn vừa nghe, không phải
  suy từ test xanh hoặc đã nghe mọi take/mọi giọng. Các ghi chú chờ nghe của
  ngày 17–18/9 được thay bằng xác nhận này, không phải lý do tiếp tục sửa.

Chi tiết nguồn và ràng buộc: [CA-PHAO.md](CA-PHAO.md), mục “Mốc hiện hành đã
duyệt và đóng băng”. Khi phục dựng phải lấy triển khai cùng commit, không chỉ
một file solo. Commit không lưu một lần phát ngẫu nhiên cụ thể: đối chiếu đúng
câu cần cả bài, cấu hình và take/seed. Không reset rộng để tìm lại câu nghe hay.

### Sửa dò C trưởng và cho phép sửa giọng thủ công

Commit riêng **`e47147a`** (`fix: detect major turnarounds and allow independent
key correction`), không đổi thuật toán/dữ liệu solo ở `bcddfd0`.

Lỗi báo cáo: *Thôi em đừng đi* là C trưởng nhưng dò Dm, danh sách lại chỉ hiện
giọng thứ. Bộ dò đã đánh giá quá mạnh A7→Dm trong vòng
`Dm7 G7 Em7 A7 / Dm7 G7 Cmaj7 A7`; A7 có thể dẫn phụ về ii, không đủ để kết
luận chủ âm Dm. Sửa `keyDetection.ts` nhận thêm ii–V–I/iii ở đầu bài, hạn chế
điểm cộng khi phiên khúc đã thiết lập giọng thứ tương đối. Hồi quy bảo vệ
*Cánh hồng phai* ở Em và vòng thật sự Dm vẫn qua.

Quy ước giao diện hiện hành trong `ReharmHome.tsx`:

- **Giọng**: đủ 24 lựa chọn trưởng/thứ + Tự dò, dùng xác định/sửa chủ âm và
  mode, giữ cao độ hợp âm đang có. `onChange={setManualKey}`.
- **Tone −/+**: chuyển tông toàn bài; `effectiveTranspose = transpose`.
  Không suy khoảng chuyển tông từ giọng tự dò sang giọng người dùng sửa.
- Chọn C trưởng không tự đổi Dm7 G7 thành Cm7 F7, cũng không ép mọi hợp âm
  thành hợp âm trưởng. Bộ soạn nhận giọng đã xác định, không cần train lại.

Đã kiểm trực tiếp bài trong KT: tự dò C; chọn C giữ nguyên hợp âm; tăng nửa
cung sang Db, hạ lại C. Chưa lưu đè bài trong thư viện thay người dùng.
**333/333 test liên quan ở 17 file** qua (engine, transpose, persistence,
CP composition); production build qua, còn cảnh báo bundle >500 kB.
Không tuyên bố toàn suite dự án đã qua. Các file solo đối chiếu với `bcddfd0`
không khác. Lượt ghi sổ này chỉ thay hai tài liệu, không đổi nhạc hoặc mã.

### Bàn giao cho phiên mới (24/9/2026)

`Reference/BAN-GIAO-PHIEN-MOI-2026-09-24.md` gom trạng thái dự án tới hôm nay: ba luật người
dùng, ranh giới giữa **Bossa CP đã duyệt/đóng băng** và **Ballad CP đang train**, vòng phản hồi
`Nguon.json` (1.355 câu · 65 bình luận · #1348 vừa xử ở `1074066`), số test thật, việc đang dở
và mục **chưa đo**. `CLAUDE.md` trỏ vào nó ngay đầu mục đọc.

Số đo tại lượt ghi: `npx vitest run` → **2.745 qua / 7 đỏ**. Sáu đỏ cũ đã biết; **một đỏ mới
chưa ai ghi sổ**: `leftArpeggioAboveRoot > ca-phao-ballad-late-arp` — câu rải tay trái tụt dưới
nốt gốc (36 < 48) ở điệu thêm tại `b73428c`, trong khi luật này do `3ed4f33` đặt. Chưa quyết là
lỗi của điệu mới hay luật cần nới cho điệu ấy; **hỏi người dùng trước khi sửa**, không nới
ngưỡng cho xanh.

### Slow Rock Lá thư: sheet ghi 4/4 nhưng nhạc là 12/8, và nền đệm là tay trái một mình

Nút mới **Slow Rock Lá thư** (họ Slow Rock, hàng 6/8), rút từ bản ký âm Linh Nhi *Lá Thư
Trần Thế* (`PianoBrain/video/Linh_Nhi/La Thư Tran The-Linh Nhi.mxl`, SHA-256 `b45d3f75…`).
Mã và nguồn từng mốc: `styleLibrary/linhNhiSlowRock.ts`. **Chưa nghe duyệt.**

**Cái bẫy: vạch nhịp của sheet không phải vạch nhịp của nhạc.** Sheet ghi 4/4 ♩=86, nhưng
nốt trầm nhất mỗi ô rơi đều cả bốn phách (24 · 25 · 21 · 20, n=92 ô hát) — đệm có bass
phách 1–3 thì phải dồn vào 0 và 2. Tay trái đi từng cụm **6 móc đơn cho một hợp âm**: bass
(cực tiểu địa phương) rơi cùng một pha chu kỳ 6 móc đơn ở **75/98** lần, không trôi từ dạo
tới kết; khoảng cách hai bass hay gặp nhất là 6 móc đơn (36 lần), rồi 3 (16), 12 (12). Tức
móc đơn ký âm = móc đơn chùm ba thật, nhạc là **slow rock 12/8, ♩. ≈ 57**. Mọi số đo cũ của
Lá Thư theo "ô nhịp" hay "phách trong ô" (kể cả trong `linh-nhi-piano.md`) đều đo trên lưới
sai — **chưa đo lại**.

**Hai tay**, đếm trên ô 6 móc đơn đã cắt lại theo pha ấy:

| | ô | tay phải nốt đơn | tay trái rải | tay trái dập hợp âm | tay phải dập hợp âm |
|---|---:|---:|---:|---:|---:|
| phiên khúc | 94 | 253/396 lần gõ (64%) | 62/91 | 5/91 | 12/94 ô, toàn cuối câu |
| điệp khúc | 30 | 70/115 (61%) | 15/30 | **5/30** | 3/30 |

Tay phải phiên khúc là giai điệu lời (nốt đơn ngân 3–4 móc đơn) và fill ở quãng cao; điệp
khúc chồng thêm nốt bè chạy theo đúng nhịp giai điệu. Nên **nền đệm lặp lại là tay trái một
mình**, và nút để trống tay phải. Hai tay chỉ cùng đệm ở cử chỉ cuối câu (c7, c22–23, c39:
tay phải dập hợp âm ở tiếng 2 · 2½ · 3 · 4, tay trái quãng tám bass rồi đi xuống) — **chưa
đưa vào nút**, vì nó phụ thuộc vị trí câu.

Ô đại diện (số "c" = ô 6 móc đơn theo pha trên, không phải số ô sheet):

- **Phiên — c15–c16** (Bb → C, ô sheet 12 phách 3 → 14 phách 1): rải 1–3–5–8–5–3, sáu móc
  đơn đều. Nhịp 6 móc đơn đều là nhịp tay trái nhiều nhất bài (25 ô); c15 lặp y hệt ở c87.
- **Điệp — c41–c42** (D7 → Gm, ô sheet 32 phách 1 → 33 phách 3): bass, dập cụm hợp âm ở
  tiếng 2 · 2½ · 3 · 4 · 5, bass lại tiếng 6. Cùng cử chỉ ở c45–c46; cao trào c106, c109 lặp lại.

Lựa chọn biên soạn, ghi để lùi được: cụm dập trên D7 khai gốc+8 · bậc 3 · bậc 7 (sheet có cả
A3 lẫn C4; bỏ A3 để hợp âm ba nốt tự lùi bậc 7 về bậc 5, không đẻ nốt trùng); bỏ D2 đầu c42
(gốc D7 ngân sang); `releaseRatio` 1. Lực là **số đo**: `velocityScale` = `dynamics` của nốt
trong sheet ÷ 80; c15 lấy trung bình với c87.

**Hai sửa ở `patternRenderer.ts`, cần cho nút này:**

1. Ô do `cellAt` trả (bản phiên/điệp khi bài gắn đoạn) trước không co theo `gridUnit` — điệu
   `gridUnit` 0,5 có bản điệp khúc sẽ phát dài gấp đôi hễ bài có nhãn đoạn. Giờ co cùng hàm
   với ô chính. Mọi cặp `CHORUS_PAIRS` cũ đều `gridUnit` 1 nên không đổi tiếng.
2. `missingChordHits` chêm hợp âm khối tay phải vào mọi hợp âm khi ô để trống tay phải. Thêm
   họ `slow-rock-la-thu` vào `KEEP_RH_RESTS` cạnh ACDD. **Triệu chứng để lùi:** nghe thấy tay
   phải trống trơn khó chịu → bỏ họ khỏi `KEEP_RH_RESTS`. Ba điệu Bolero Linh Nhi (khai
   "tay phải trống") vẫn bị chêm ở tầng `renderPattern` — đường tai đã nghe, không đụng.

Test chung `styleLibrary.test.ts` đòi mọi điệu có tay phải: miễn đích danh họ này, kèm lý do;
`laThuSlowRock.test.ts` khoá điều ngược lại. Toàn suite: **2.755 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư đổi sang hai tay: bỏ nốt giai điệu, không bỏ cả tay phải

Người dùng bác bản `ca7ae4c`: *"học cách đệm phối hợp 2 tay đi chứ sao có mỗi tay trái vậy"*.
Cái sai của bản ấy: thấy 64% cú gõ tay phải là nốt đơn giai điệu nên để trống **cả** tay phải.
"Tránh nốt giai điệu" nghĩa là bỏ đúng nốt giai điệu, rồi giữ phần tay phải còn lại.

**Luật tách** (đo lại trên ô 6 móc đơn): cú gõ ≥3 nốt, đỉnh ≤ Bb4 = hợp âm đệm; cú gõ 2 nốt =
giai điệu + bè (giữ bè nếu cách ≥3 nửa cung, ≤ A4, không nhân quãng tám — loại nốt láy nửa cung
như Ab4 dưới A4); nốt đơn = giai điệu, trừ khi gõ lại đúng nốt bè vừa giữ. Sau khi bỏ giai
điệu, tay phải còn đệm ở **39/94 ô phiên** (44 hợp âm · 35 bè · 10 ngón cái) và **19/30 ô điệp**
(25 bè · 6 hợp âm · 6 ngón cái). Tiếng tay phải đệm trùng mốc tay trái 56 lần, chen khe 33 lần.

**Phiên — c22** (A7, ô sheet 17 phách 2), tay phải lặp y hệt ở c93. Lõi nhịp tay phải
{2, 2½, 3, 4} có ở c7, c22, c23, c39, c70, c93, c105 — cử chỉ hai tay lặp nhiều nhất bài.
Tay trái A2/A3 · A2 · A2/A3 · A2 · E2/E3 · A2/A3; tay phải A3/C#4/E4/A4 ở 2 · 2½, rồi
C#4/E4/A4 ở 3 · 4 — **bỏ nốt gốc đúng lúc tay trái gõ quãng tám**, hai tay không trùng phím.
Tay phải khai bậc (không dùng thế bấm app) chính vì chỗ này: thế bấm app trên A7 là
A3/C#4/E4/G4, trùng phím A3 với tay trái ở tiếng 3; `holdUntilStruckAgain` chỉ xét trùng
phím trong một tay.

**Điệp — c41–c42** giữ tay trái cũ, thêm bè ngón cái: A4 ngân từ tiếng 1 · D4 vào ở 5½ ·
D4 tiếng 1 ô sau · D4 gõ lại ở 2½. Bỏ giai điệu D5 · C5 · Bb4 · A4 · G4 phía trên. c45–c46
cùng mốc.

Biên soạn, ghi để lùi: tiếng 5 phiên khai E3 đơn thay E2/E3 (bậc 5 dưới gốc rơi dưới sàn 36
ở giọng Đô–Mi, gập thành nốt trùng); `rightHandRegister` gốc từ 55 — gốc Đô–Fa thăng thì hợp
âm tay phải lên 72–78, cao hơn vùng A3–A4 của sheet (sheet chỉ có A và G ở cử chỉ này).

**Giá trị cũ** (`ca7ae4c`): phiên = c15–c16, tay trái rải 1–3–5–8–5–3 sáu móc đơn đều (Bb2 D3
F3 Bb3 F3 D3), tay phải trống; điệp tay phải trống. **Triệu chứng để lùi:** nghe phiên dồn dập
quá / mất tiếng rải → c15–c16 là tay trái lúc chị vừa đàn vừa HÁT giai điệu bằng tay phải.
`KEEP_RH_RESTS` giữ họ này: khe giữa các tiếng tay phải là chỗ của giai điệu. Test chung
`styleLibrary.test.ts` không còn miễn trừ. Toàn suite **2.757 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư: nền phiên khúc là tay trái rải, tay phải ngân từ tiếng 1

Người dùng nghe bản `594e7f7` trên bài *Đêm nguyện cầu*: fill (ô gạch chân) *"chơi rất hay"*,
nhưng *"tiết tấu đệm ko còn nghe giống như trong sheet"*. Cái sai: lấy c22 — cử chỉ hai tay
**cuối câu**, chỗ lời nghỉ — làm mẫu lặp ở mọi hợp âm.

Đo lại trên **46 ô phiên tay trái rải** (bỏ các ô dập cuối câu): tay phải có tiếng ở tiếng 1
trong **42/46** ô, **32/42** lần ngân ≥2 móc đơn, **trung vị ngân 3 móc đơn** (phân bố: 4 móc
đơn 13 lần, 2 móc đơn 10, 3 và 1½ mỗi thứ 7). Tay trái đi từng móc đơn, tay phải đặt một tiếng
đầu ô rồi ngân — đó là cách hai tay phối hợp suốt phiên khúc. Cú dập 2 · 2½ · 3 chỉ có ở c22,
c23, c94.

Phiên bây giờ: tay trái c15–c16 (y như `ca7ae4c`), tay phải **một hợp âm ở tiếng 1, ngân 3
móc đơn** — thế bấm dẫn giọng của app, vùng A3–A4 như sheet (Dm A3/D4/F4 = c40, C C4/E4/G4 =
c63), không mang nốt giai điệu. Tay phải nhả đúng lúc tay trái lên quãng tám ở tiếng 4, không
đè phím. Lực = lực tiếng 1 tay phải của c15 (trung bình với c87) và c16: 0,9 · 0,86.
Điệp giữ nguyên `594e7f7`.

**Giá trị cũ** (`594e7f7`): phiên = c22 — tay trái A2/A3 · A2 · A2/A3 · A2 · E3 · A2/A3, tay
phải 1–3–5–8 ở 2 · 2½ rồi 3–5–8 ở 3 · 4. **Triệu chứng để lùi:** thấy tay phải phiên mỏng quá
→ c22 vẫn là cử chỉ thật của chị, nhưng thuộc về cuối câu; đưa nó vào cuối câu, đừng đưa lại
vào vòng lặp. Toàn suite **2.757 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư: lúc hát tay trái một mình, hai tay ở ô có fill (`fillCell`)

Người dùng nghe `5cfcb1e`: *"trong sheet lá thư trần thế ko đệm 2 tay như vậy và câu fill hãy
trả lại như bản đầu tiên bạn soạn chứ bản hiện tại quá tệ"*.

**Tay phải lúc hát là giai điệu lời.** Phiên 1 và phiên 3 cùng giai điệu khác lời; tay phải
tách/gộp nốt đúng theo âm tiết (c11 E4 · E4 gõ lại, c83 E4 ngân liền; c10 D4 dưới F#4, c82 chỉ
D4). Nên đem nhịp tay phải lúc hát làm nhịp đệm (bản `5cfcb1e`) là chép nhịp giai điệu.

**Fill hay hay dở là do phần đệm quanh nó, không do nốt fill.** Dựng lại trên
`Em(add9) Em(add9) Am9 Em(add9)`, cùng take: nốt fill ba bản giống hệt (nhịp /8 → 80% fill ở
bè trầm, móc kép từ tiếng 4). Khác ở tay phải lúc fill chạy:

| bản | tay phải lúc bè trầm chạy fill |
|---|---|
| `ca7ae4c` | im |
| `594e7f7` (fill "chơi rất hay") | giữ G3/B3/E4 từ tiếng 4, ngân 2 móc đơn |
| `5cfcb1e` (fill "quá tệ") | hợp âm nhả đúng lúc fill bắt đầu |

Nên "bản đầu tiên" mà người dùng khen fill là `594e7f7`: `ca7ae4c` cho fill chạy trơ trọi y như
`5cfcb1e`. Cử chỉ c22 của `594e7f7` chính là cử chỉ sheet ở chỗ lời nghỉ — đúng chỗ app chêm fill.

**Sửa:**

- `StylePattern.fillCell` (mới, tùy chọn): ô đệm cho hợp âm có câu fill. `ReharmHome` dựng thêm
  bản đệm bằng ô ấy; `swapAtFills` (patternRenderer) lấy nó cho hợp âm nào có fill bắt đầu,
  TRƯỚC `giveCompingToLeft`/`yieldToFill`, ở cả hai chỗ ghép fill. Điệu không khai → y như cũ.
- Lá thư: `cell` phiên = tay trái c15–c16 (y `ca7ae4c`), tay phải trống; `cell` điệp = tay trái
  c41–c42, tay phải trống; `fillCell` = c22 đúng số của `594e7f7`.
- Test chung `styleLibrary.test.ts`: điệu có `fillCell` có tay phải được để trống tay phải ở `cell`.

**Giá trị cũ:** `5cfcb1e` phiên có hợp âm tay phải ở tiếng 1 ngân 3 móc đơn; `594e7f7`/`5cfcb1e`
điệp có bè ngón cái A4 · D4 · D4 · D4. **Triệu chứng để lùi:** fill lại nghe trơ → kiểm
`swapAtFills` có chạy không (bài phải có ô có fill); tay phải lúc hát trống quá → đó là chỗ của
giọng hát theo sheet, hỏi người dùng trước khi thêm.

**Bẫy tự gây, đã sửa:** sửa file bằng Python trên Windows ghi CRLF; `caPhaoFullSolo.test.ts` đọc
thẳng `ReharmHome.tsx` và dò chuỗi có `
` nên đỏ. Trả các file đã đụng về LF.
Toàn suite **2.759 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Bộ soạn câu solo Slow Rock Linh Nhi — một nguồn thật, tách trưởng / thứ

Ô tick mới *"Câu solo Slow Rock Linh Nhi — dạo · giang · kết (nghe thử)"*, chỉ hiện ở điệu Slow
Rock Lá thư. Mã: `style/slowRockLinhNhiSolo.ts`; bảng nguồn `style/slowRockLinhNhiNguon.ts`
**sinh bằng** `tools/slow_rock_linh_nhi.py --sinh` (23 đoạn solo của 8 bài Linh Nhi). Số đo đầy
đủ: `PianoBrain/knowledge/teachers/linh-nhi-piano.md` mục **13c**. **Chưa nghe duyệt.**

**Đo trên lưới đúng từng bài.** Lá Thư cắt ô 6 móc đơn pha 2 (12/8 ghi thành 4/4); Một Cõi ghi
đúng 6/8; bolero ô 4/4; Nỗi Buồn ô 8 phách tách hai. **Ký hiệu hợp âm hai bài slow rock không
dùng được**: gốc khớp nốt 6/12 (Lá Thư), 4/13 (Một Cõi) — nên đọc hợp âm bằng tay theo tay trái
(`HOP_AM_TAY`, mỗi ô kèm nốt bằng chứng). Bolero trưởng tin được (24/24 · 15/17 · 18/24).

**Phương pháp (Codex):** mỗi đoạn lấy MỘT đoạn solo thật cùng giọng trưởng/thứ, cùng loại đoạn;
chuyển giọng nguyên khối cả hai tay; chỉ dời cả tay phải một quãng tám để vào tầm, không thì
`unavailableReason`. Chọn nguồn: slow rock gốc khớp ≥ nửa vốn hợp âm bài đứng trước; không có
thì nguồn khớp vốn bài nhất (md: 16/20 đoạn solo của chị chỉ dùng bậc có sẵn trong bài). Giọng
trưởng **không có sheet slow rock** → lấy bolero trưởng, đổi 4/4 → 12/8: phách giữ chỗ, móc đơn
thẳng thành dài–ngắn chùm ba, tay trái theo mẫu rải của điệu — **biên soạn, không phải số đo**.
Ô 6 phách (Đừng Xa kết ô 82) thành ba ô 6/8, không cắt nốt.

**Ba chỗ mở/đổi trong app, chỉ khi ô tick bật và đúng điệu:**
- `buildPhraseSection` có cờ `slowRockLinhNhi`: trả thẳng đoạn của bộ soạn.
- `coChiDanCodex` (cổng ẩn dạo/giang/kết chưa có chỉ dẫn Codex) **mở riêng** cho bộ soạn này —
  người dùng yêu cầu trực tiếp 24/9/2026; các đường khác vẫn ẩn.
- Giang tấu bài có cấu trúc đi qua `interludeRange` riêng (`composed: true`); không soạn được thì
  lượt ấy bỏ giang kèm cảnh báo, không lui về đường cũ.
- Tầm: **88 phím** (21–108), như chế độ mô phỏng Cà Pháo "không bẻ quãng theo tầm đàn" — tầm
  câu solo 62–79 sẽ loại gần hết (dạo Lá Thư A4–E6, dạo Một Cõi lên D7).

**Tự kiểm:** ghép ngược về giọng gốc ra **đúng từng nốt cả hai tay** ở sáu đoạn slow rock; 23 nguồn
× 12 giọng đều đọc được hợp âm, đủ độ dài, không rơi nốt; trưởng chỉ lấy nguồn trưởng, thứ chỉ lấy
nguồn thứ. Toàn suite **2.765 qua / 7 đỏ** — đúng 7 đỏ cũ.

**Chưa đo:** chưa có sheet slow rock trưởng; bảng hợp âm đọc tay chưa ai duyệt; lực đánh chưa đưa
vào (tay phải 76, tay trái 62 — biên soạn); ô tick chưa lưu vào bài.

### Màu hợp âm Linh Nhi đo từ sheet, và chọn màu ấy thì soạn luôn câu solo cho điệu đang chơi

**Màu** (`reharmEngine/linhNhiHarmony.ts`, số đo `tools/hop_am_linh_nhi.py`, md Linh Nhi mục
**13d**). Đo phần hát 8 bài; màu lấy từ **nốt đệm thật** (tay trái + nốt dưới nốt đỉnh tay phải),
không từ ký hiệu. Chị để **trơn** phần lớn: trưởng I 30/61 · V 25/42 (V7 chỉ 7/42) · vi 25/34 ·
IV 18/24. Màu đứng vững: **trưởng II7** (♭7 10/10, 3 bài); **thứ V7** (17/24, 4 bài) ·
**ii° m7b5** (10/16, 4 bài) · **I7 kéo về iv** (6/6, 4 bài); **điệp khúc thứ ♭VI maj7** (13/21, 3
bài; phiên 8/25) · **iv add9** (7/10, 3 bài). Chỉ tô hợp âm ba trơn, giữ màu/bass người dùng ghi,
**không tự chèn hợp âm** — hợp âm chen lặp ở ≥ 2 bài chỉ ≤ 5 lần. Pipeline truyền `diepAt` từ
`sectionRanges` để biết hợp âm nào trong điệp khúc. v7 thứ (12/16) chỉ có ở 1 bài → không thành luật.

**Bẫy đo đã sập:** lấy bậc ba chỉ từ tay trái — rải 1–5–8 không có bậc ba nên hoà điểm và ra "I
trưởng" 54 lần trong bài thứ. Đo bậc ba từng đoạn thì không đoạn nào của 5 bài thứ chuyển trưởng
(cao nhất 30%). Sửa: gốc từ tay trái, bậc ba từ mọi nốt đang vang.

**Giá trị cũ** (bảng tĩnh, không số đo): trưởng I/IV maj7 · ii/iii/vi m7 · V7 · vii m7b5; thứ i m7
· III/VI maj7 · iv m7 · V7 · VII7, và ép v thứ thành V7. **Triệu chứng để lùi:** nghe hợp âm
"nhạt" — đó là chỗ chị để trơn; màu của chị nằm ở nốt rải tay trái (bậc 9 trên i, iv).

**Solo theo màu** (`style/linhNhiSolo.ts`, thay `slowRockLinhNhiSolo.ts` và bỏ ô tick slow rock):
chọn màu Linh Nhi thì dạo · giang · kết lấy nguyên một đoạn solo thật của chị cho **điệu đang
chơi**: điệu 6/8 · 12/8 ưu tiên slow rock gốc (bolero đổi dài–ngắn chùm ba); điệu 4/4 ưu tiên
bolero gốc (slow rock đổi ô 12/8 → 4/4 giữ chùm ba); 3/4 · 2/4 báo chưa có nguồn. Nguồn cùng nhịp
thì lấy cả tay trái của chị. **Giữ hai đường tai đã duyệt:** dạo họ Bolero (bộ ghép ô Linh Nhi) và
giang/kết thứ Bolero Tuấn. Ghép ngược đúng từng nốt hai tay: slow rock trên 6/8, bolero trên 4/4.

Toàn suite **2.769 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Câu solo Linh Nhi chỉ lấy vật liệu từ sheet cùng điệu — slow rock soạn mới từ 49 ô của chị

**Người dùng bác khi nghe** (24/9/2026) bản đổi nhịp của mục trên: *"đừng lấy những phần từ câu solo
của điệu khác rồi dồn ép vào, nghe quá tệ"*; được lấy phần của sheet khác rồi chỉnh **nếu cùng điệu**;
quy luật soạn nốt học từ mọi sheet; câu *"ko bị phô, bị trùng lặp hoặc ngắt quãng"*.

**Nay** (`style/linhNhiSolo.ts`): họ Slow Rock → `style/soanSlowRockLinhNhi.ts`; họ Bolero → chép
nguyên một đoạn bolero thật (như cũ, không còn nhận nguồn slow rock); họ khác → `unavailableReason`.
`ReharmHome`: `lnDao` chỉ họ Slow Rock, `lnSau` họ Slow Rock + Bolero (trừ thứ Bolero Tuấn) — pop,
ballad… đi lại đường trước khi có nút màu Linh Nhi.

**Bộ soạn slow rock:** vật liệu nốt chỉ 49 ô solo slow rock (Lá Thư, Một Cõi). Mỗi ô **chuyển bậc theo
gam** lên hợp âm đích, nốt bậc 3 · 5 · 7 lệch nửa cung do gam về nốt hợp âm; dời cả ô ± quãng tám.
Vòng hợp âm = vòng solo thật cùng giọng (slow rock trước; **trưởng mượn vòng bolero trưởng**, chỉ hoà
âm). Ô kết = cử chỉ kết thật giữ hợp âm của nó. Ô giữa chọn bằng điểm phạt theo quy luật đo ở
`tools/quy_luat_not_linh_nhi.py` (md Linh Nhi **13e**); hệ số phạt là biên soạn. Điệu 6/8 không
`gridUnit` (slow-rock-2/3/4, Hải) có ô 6 phách → co giãn theo `oDieu`.

**Số đo** trên 432 câu soạn (3 đoạn × 2 giọng × 12 giọng × 6 lượt) so với 6 đoạn sheet slow rock:
nốt hợp âm phách mạnh 90–100% (sheet 67/81 = 83%) · phách nhẹ 83–89% (sheet 165/194 = 85%) · ô thưa
≤ 2 cú gõ 0–7% (sheet 4/49) · ô trống giữa đoạn 0 · ô lặp hình ô trước 0 (sheet 0/49) · 6 lượt ra 6 câu
khác nhau ở giọng Rê (test khoá ≥ 4). Test khoá các ngưỡng ấy theo số sheet.

**Bẫy đã sập khi dựng:** (1) ô kết Picardy Lá Thư c142–c143 **không gõ tay phải mới** và c142 trải 37
nửa cung (F#4–G7) — lọc "ô phải có nốt" và tầm 55–98 làm hỏng 15/72 câu kết; nay ô kết được rỗng, tầm
48–103. (2) Hợp âm sus: nốt bậc ba không nắn được (cách bậc 4 hai nửa cung) → phạt thay vì nắn.
(3) Bài không có vốn hợp âm thì mọi vòng hoà điểm → vòng bolero chen vào giọng thứ dù có vòng slow rock;
nay xếp hạng slow rock trước.

**Giá trị cũ** (71de0c5): 6/8 chép một đoạn nguyên khối, bolero đổi sang 12/8 bằng `chumBa`; 4/4 nhận
cả slow rock đổi sang 4/4; `lnDao` mọi họ trừ Bolero, `lnSau` mọi họ. **Triệu chứng để lùi:** câu slow
rock nghe vụn, như ghép mảnh — kiểm hệ số phạt nối ô (`phatNoi`) và tầm (`0.15`) trước khi bỏ bộ soạn.

**Chưa đo:** chưa có sheet slow rock trưởng — giọng trưởng là ô thứ chuyển gam, chưa đối chiếu được;
hệ số phạt chưa đo; lực đánh vẫn 76 / 62.

Toàn suite **2.769 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư: dạo · giang · kết luôn đi bộ soạn mới, kể cả khi chọn thầy Linh Nhi

**Người dùng** (24/9/2026): *"mỗi lần tôi bấm nút Phát cả bài thì ko soạn câu mới, chỉ lặp lại đúng
một câu trong sheet … ưu tiên phải soạn câu solo mới trên tiết tấu điệu Slow rock Lá Thư"*.

**Bẫy:** dạo và kết truyền `styleSolo` chứ không phải điệu của bài. Chọn thầy Linh Nhi cho câu solo
thì `styleSolo` = `LINH_NHI_RAI` = `bolero-linh-nhi-2` → `linhNhiSolo` đi nhánh bolero, chép nguyên
một đoạn bolero. Đo (Mi thứ, lượt 100–103): dạo Đừng Xa 4/4 lượt, kết Nỗi Buồn 4/4 lượt — cùng một
câu, lại là điệu khác. Giang tấu truyền `style` nên không dính. Không màu, không thầy: dạo đi luật cũ,
kết bị ẩn. Bộ soạn thì không bê câu gốc: 20 lượt ra 20 câu, ô giữa trùng ô gốc cùng chỗ 16/150 (dạo)
· 18/150 (giang) · 5/130 (kết).

**Sửa:** `slowRockSoanLinhNhi` (`style/linhNhiSolo.ts`) — họ Slow Rock soạn bằng bộ soạn Linh Nhi khi
chọn màu Linh Nhi, chọn thầy Linh Nhi, hoặc điệu Slow Rock Lá thư khi chưa chọn thầy nào; thầy khác
thì nhường. Khi ấy dạo · kết truyền `style` của bài. Họ Bolero giữ nguyên (chỉ theo màu Linh Nhi).

**Giá trị cũ:** `lnDao`/`lnSau` chỉ bật theo màu Linh Nhi; dạo · kết luôn `styleSolo` trừ Bolero Tuấn.
**Triệu chứng để lùi:** chọn Tôn Hùng / Cà Pháo mà vẫn nghe câu Linh Nhi → kiểm `soloThay`.

Toàn suite **2.771 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Bộ soạn slow rock: nắn nhịp Một Cõi, vòng hợp âm ghép mới mỗi lượt, giai điệu bolero trên tiết tấu slow rock

**Người dùng** (24/9/2026, sau khi nghe): 4/4 câu Chưa ổn chê *"bóp nhanh … lệch tiết tấu"* ở đầu câu
(#1374 · #1376 · #1377 · #1378, md Linh Nhi **16S** — mục riêng cho Slow Rock); *"Vòng hợp âm phải được
đổi mới … hãy tận dụng"* hợp âm và giai điệu bolero; được quyền nắn giai điệu cho khớp tiết tấu.

**Bẫy:** cả bốn câu mở bằng ô 1 Một Cõi — bản ký âm Một Cõi hỏng nhịp: 31 mốc tay phải lệch lưới 6/8
trong 14/29 ô (ba nốt nhét vào chỗ hai móc đơn; cả ô trượt 0,375 phách); Lá Thư 0/20 ô. Bảng quy luật
13e đã đếm cả mốc hỏng ấy.

**Sửa** (`style/soanSlowRockLinhNhi.ts`):
- `nanNhip`: ô hỏng dời mốc về móc đơn, móc kép chỉ trong câu chạy liền, bỏ nốt dư (hoa mỹ trước).
  Nắn 14/49 ô, bỏ 17/275 mốc. Ô sạch chỉ bỏ nốt hoa mỹ lệch lưới.
- `vongMoi`: đầu vòng thật + đuôi vòng thật cùng loại đoạn, nối ở hợp âm chung; slow rock + bolero cùng
  giọng. Loại vòng trùng/cắt ngắn vòng có sẵn (so sau khi gộp hợp âm liền); mở bằng hợp âm chị từng mở;
  dạo/giang ≥ 5 hợp âm khác, 7–12 ô (đo 23 vòng thật). Nối vào ô kết theo bước gốc đã có.
- Ô lai: cao độ ô bolero cùng giọng trên tiết tấu ô slow rock gần số mốc nhất.
- `SO_O_KET` Lá Thư kết **2 → 4** (trọn Isus4 Isus4 → I I). Triệu chứng để lùi: kết Lá Thư dài lê thê.
- Ba ô liền một hợp âm chỉ xét phần vòng + ô kết đầu — trước đó cử chỉ i i i của Một Cõi tự loại mọi vòng.
- Sổ `Nguon.json`: câu slow rock ghi đúng điệu của bài (trước ghi `bolero-linh-nhi-2`).

**Số đo** (432 câu): mốc lệch lưới 0/20.248; nốt hợp âm phách mạnh 93–100%, nhẹ 81–85% (sheet 83/85%);
nối ô ≤ 4 nửa cung hoặc quãng 8: 100%; ô thưa ≤ 5,6% (sheet 4/49); ô lai 47–71%. Vòng khác nhau / 40
lượt ở Mi: thứ 35 · 33 · 31, trưởng 38 · 28 · **2** (chị có 3 đoạn kết trưởng).

**Giá trị cũ:** một vòng thật giữ nguyên (xoay giữa 2 vòng slow rock); ô Một Cõi dùng nguyên nhịp hỏng;
chỉ ô slow rock làm giai điệu. **Triệu chứng để lùi:** câu nghe vụn/lạ hơn sheet → tắt ô lai (chỉ kho
`O_SLOW`) trước khi bỏ vòng ghép.

Toàn suite **2.772 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư: hợp âm chia đôi thì rải; giang tấu nhiều vòng mỗi vòng dài theo câu; cú dặm V7 sau ô dập

**1. Hợp âm chia đôi ô thì RẢI** — người dùng: *"khi chia đôi hợp âm đừng đánh kiểu dặm hợp âm mà hãy theo
kiểu rải"*. Bẫy: dặm tới từ HAI lớp — `generateFillLine` gõ hai cú hợp âm ba nốt ở hợp âm ngắn (nhịp /8
tự có `fillBassChance` 0,8), rồi `swapAtFills` coi cú ấy là fill và đổi đệm của hợp âm ngắn sang ô fill
c22 (tay phải c22 cũng dặm hợp âm). Sửa: điệu khai `raiHopAmChiaDoi` (mới, chỉ Lá thư) → ba nốt rải lên,
mỗi nốt một phần ba hợp âm ngắn (ô 6/8 chia đôi: ba móc đơn), ngân tới hết hợp âm; `swapAtFills(…,
minBeats = chordBeats)` bỏ qua hợp âm ngắn. Fill lời nghỉ (594e7f7) không đổi — chúng vốn không rơi vào
hợp âm ngắn. Giá trị cũ: không khai → hai cú dặm + c22. Triệu chứng để lùi: chỗ đổi hợp âm giữa ô mờ.

**2. Giang tấu lặp nhiều vòng** — người dùng: *"Câu giang tấu bị lỗi ko soạn mới sau mỗi lần bấm phát"*.
Sổ `Nguon.json` ghi giang khác nhau mỗi lần bấm (lanPhat 1 ở mọi dòng), nhưng dựng lại đường chạy
(`buildArrangedSong`, `loops: 2`, 4 lần bấm) thì vòng hai bị ép theo độ dài vòng một: câu 30 phách vào
ô 33 (lặng 3), 24 vào 21 (cụt ô kết), 21 vào 33 (lặng 12). Sửa `arrangement.ts`: range `composed` thì
mỗi vòng dài theo câu của nó; `sections`, `segments`, `soloSpans` theo đó. Đường khác giữ một độ dài.
**Chưa chắc** đây là cái người dùng nghe ra — đã hỏi lại.

**3. Cú dặm V7 sau ô dập Lá Thư** — ý kiến #70 (câu #1403): *"ở E7 cuối thì nên thêm 1 cú dặm hợp âm E7
nữa rồi mới vào phiên khúc … nếu sau này có soạn lại câu theo khung này thì nhớ làm tương tự"*. Dạo/giang
kết bằng ô dập V7 Lá Thư (c7 · c80) thì thêm một ô: V7 đủ bốn nốt dưới nốt đỉnh cú dập đầu ô kết, tay trái
quãng tám gốc, ngân nửa ô rồi tắt (luật cũ: hút tắt trước chỗ ca sĩ vào). Ô c80 mở bằng 5–7–1 thiếu nốt
cảm nên không mượn nốt ô ấy. Kết Một Cõi không thêm. Ngân nửa ô là biên soạn.

Ý kiến ghi vào md Linh Nhi mục **16S** (lượt nghe 2: #1382 Đã ổn, #1403 Chưa ổn).

Toàn suite **2.775 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Giang tấu slow rock "không đổi câu": nốt có đổi, nhưng đầu câu và đuôi câu lặp — xoay ô mở, soạn ô trước ô kết

**Người dùng** (24/9/2026, lần hai): *"Giang tấu vẫn ko đổi câu mới sau mỗi lần bấm phát"*.

**Bẫy:** sổ `Nguon.json` ghi câu giang khác nhau mỗi lượt (#1413 · 1416 · 1419 · 1422 khác vòng, khác số
nốt; trùng ô chỉ ở đuôi) và bộ phát phát đúng `luot` đã ghi — nên "không đổi" không phải lỗi dựng. Đo 20
lượt liền (Am): **10/20 câu giang mở bằng cùng một ô** (giai điệu dạo Đừng Xa ô 1 trên tiết tấu slow rock),
câu dạo 9/20 cũng mở bằng ô ấy; đuôi luôn là một trong hai cử chỉ kết của sheet (luân phiên 10/10), Một Cõi
chiếm 2 ô. Đầu và đuôi cố định thì tai nghe ra một câu. Nguyên do: chọn trong nhóm cách tốt nhất ≤ 1 điểm,
và ô mở hợp tầm nhất gần như luôn thắng.

**Sửa** (`soanSlowRockLinhNhi.ts`): ô mở xoay theo lượt qua mọi ô mở cách tốt nhất ≤ 3 điểm, dạo/giang lệch
nửa vòng; ô giữa xoay bước 7 (cũ 1); `SO_O_KET` Một Cõi dạo/giang **2 → 1** (chỉ giữ ô ngân V, ô chạy V7
soạn mới). Đo lại 20 lượt: ô mở nhiều nhất 3–4/20 (6–7 ô khác nhau), lượt liền nhau mở trùng **0/19**, ô giang
trùng lượt trước 7/203, dạo–giang cùng lượt mở trùng 3/20. Ngưỡng 3 điểm và bước 7 là biên soạn.
**Triệu chứng để lùi:** ô mở nghe lạc hợp âm → hạ ngưỡng 3 về 2; kết Một Cõi thiếu lực → `SO_O_KET` về 2.

Toàn suite **2.776 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Giang tấu soạn sẵn hiện đúng vòng vừa soạn; Linh Run slow rock soạn từ câu chạy của chị, chơi cả khi đang hát

**1. Dòng hợp âm giang tấu** — người dùng: *"tại sao giang tấu vẫn ko đổi hợp âm mỗi lần phát giống như intro
hay outro"*. Bẫy: tiếng giang đã đổi vòng mỗi lượt (sổ #1413 · 1416 · 1419 · 1422 bốn vòng khác nhau), nhưng
`interludeSymbols` — dòng chữ hiện dưới nhãn Giang tấu và ghi vào tab Luyện — lấy `interludeWindow(over)`
(đuôi điệp khúc cố định); dạo/kết thì lấy `soloSpans` nên đổi. Sửa: `lnSau` cũng lấy từ `soloSpans` như
nhánh CP / Tuấn thứ. Cũ: chỉ CP và Tuấn thứ.

**2. Linh Run** — người dùng: *"Sao chọn Linh Run thì ko hề có gì cả. Dựa vào các sheet Linh Nhi hãy soạn
Linh Run cho điệu đang được chơi"*. Hai bẫy: (a) `generateFillLine` bỏ qua ô đang hát **kể cả ô người dùng
tự chọn** — bài có lời gần như mọi ô nên chọn đâu cũng rỗng (tái hiện: ô E7 có lời → rỗng); `vocal ===
'full'` còn trả rỗng từ đầu hàm. (b) sổ Linh Run chỉ 2 câu bolero 4/4 dịch nửa cung — trên E7 láy G5–B5
(G thường chỏi G#). Sửa: ô tự chọn Fill/Run chơi cả khi đang hát (câu lót tự động vẫn nhường ca sĩ);
`chayLinhNhi` (`soanSlowRockLinhNhi.ts`) cho họ Slow Rock khi chọn thầy Linh Nhi: 8 câu chạy slow rock của
chị (ô đã nắn) + cao độ câu chạy bolero cùng giọng trên tiết tấu câu chạy slow rock, chuyển bậc theo gam
lên hợp âm, kết đúng cuối hợp âm, tâm gần 76. Đo 12 giọng thứ × 6 hợp âm × 30 lượt: ≥ 15 câu khác nhau mỗi
hợp âm, 0 nốt ngoài gam và ngoài hợp âm; 12 giọng trưởng 600 lượt: 0 rỗng, 0/3060 nốt lạ.

**3.** `swapAtFills` chỉ nhận fill **tay trái**: câu tay phải (Linh Run, câu lót giai điệu) không đổi đệm
sang ô c22, để ba nốt dặm tay phải của c22 không đè câu chạy. Cú fill bè trầm được khen (594e7f7) giữ
nguyên. Cũ: mọi fill đều đổi.

Toàn suite **2.778 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Mốc chuyển đoạn đáp đúng vạch; Linh Run slow rock là câu dẫn vào hợp âm sau; kiểu thử đệm hai tay 1·4 / 2·3·5·6

**1. Mốc chuyển đoạn** — người dùng (Slow Rock Lá thư, đặt 2 quãng tám · đệm 2 phách · im 0): *"vẫn ko hề đánh
đệm mà chạy nốt luôn và chạy xong vẫn nghỉ phách"*. Dựng lại cả chuỗi đệm (ô chuyển đoạn 6 phách): phách 0–2 là
ô fill **c22** (câu chạy có nốt tay trái nên `swapAtFills` đổi đệm), câu chạy 2–4, phách 4–6 **lặng** (tắt đệm từ
`delay` tới hết ô, câu chạy dừng sớm vì `arpeggioRun` bắt đầu đúng `fromBeat`). Ô 3 phách: câu 2 quãng tám dồn vào
1 nốt đen, móc tam. Sửa: `transitionRunNotes` (soloGenerator) — có `delay` thì câu chạy KẾT ĐÚNG vạch (`datCuoi`),
dùng chung cho câu chạy và `transitionMuteWindows` (đệm tới đúng lúc câu chạy vào); câu chạy mốc chuyển đoạn không
đổi sang c22; `transitionsDieu` nhân `gridUnit` (Lá thư đếm phách = móc đơn — người dùng: *"phách mạnh là phách 1
và 4"*). Không đặt `delay` thì giữ lối cũ ở mọi điệu. Cũ: bắt đầu ở `delay`, phách = nốt đen.
**Triệu chứng để lùi**: câu chạy vào quá muộn ở ô ngắn → bỏ `datCuoi`.

**2. Linh Run slow rock làm lại** — người dùng: *"phân tích thật kỹ cách Linh Nhi tạo câu run … Linh Run hiện tại
quá dở"*. `tools/chay_ngon_slow_rock.py` (cả bài, hai tay, bỏ 41 hình rải đệm): 67 câu chạy; lúc hát câu chạy ở
**tay trái** 42/48 — dẫn bè trầm từ tiếng 4, nốt thứ tư rơi đúng vạch vào gốc hợp âm sau; tay phải chạy ở solo
14/20; đáp nốt hợp âm của hợp âm sau 56/64. Bẫy của bản trước: câu rải kết ở cuối hợp âm, không dẫn vào đâu.
Nay: 27 khuôn "dẫn vào hợp âm sau" (`slowRockChayNgon.ts`, sinh bằng `--sinh`), tính ngược từ vạch; liền bậc thì
giữ khoảng bậc tới nốt đáp (= cùng bậc trên hợp âm sau), rải thì chuyển bậc lên hợp âm đang vang; V trong giọng
thứ đi gam hoà âm. `linhRun` nhận thêm `next` và tay của từng nốt. Đo La thứ 162 câu: đáp nốt hợp âm sau 85%
(sheet 88%), nốt dẫn lạ 0/612.

**3. Kiểu thử đệm hai tay** — người dùng: *"phách mạnh là phách 1 và 4, còn lại là phách nhẹ. Hãy chia đều ra để
đánh đệm phối hợp 2 tay"*. Family riêng `slow-rock-la-thu-hai-tay` (nút riêng, cạnh nút cũ — luật nghe thử;
test của Codex khoá nhãn nút Lá thư không có số kiểu): tay trái tiếng 1 gốc · tiếng 4 gốc+8; tay phải bậc 3·5·8
(thế c22) ở tiếng 2 · 3 · 5 · 6; điệp: tay trái quãng tám, tay phải thêm gốc. Nghe ổn thì thay hẳn rồi xoá kiểu thử.

Codex đã thêm nút **Slow Rock LT** riêng (38ae124) — không đụng tới.

Toàn suite **2.798 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Nút thử "Slow Rock Lá thư hai tay": sóng rải vắt hai tay, không dặm hợp âm

**Người dùng** (25/9/2026) bác bản dặm tay phải 2 · 3 · 5 · 6: *"Chia 2 tay để đánh rải chứ ko phải để dặm hợp âm,
và ko nhất thiết phải là chia đều. Trong vai một nhạc sĩ đệm piano chuyên nghiệp bạn hãy soạn lại cách đánh"*.

**Nay** (biên soạn, không phải số đo): một làn sóng móc đơn liền — rải c15 của chị mở ra hai quãng tám. Tay trái
tiếng 1 · 2 · 3: gốc (ngân suốt ô, nhấn mạnh nhất) – 5 – 8 (ngân một móc đơn); tay phải tiếng 4 · 5 · 6: 10 – 12 – 10
(ô 1) rồi 12 – 10 – 8 (ô 2, trả sóng về bè trầm); tiếng 4 là đỉnh sóng, nhấn thứ hai. Vd C: C2 G2 C3 | E3 G3 E3;
E7: E2 B2 E3 | G#3 B3 G#3; G (ô 2): G2 D3 G3 | D4 B3 G3. Điệp: gốc tay trái kèm quãng tám (quãng tám trên nhả sau
hai móc đơn), đỉnh sóng kèm quãng tám trên (thủ pháp tay phải chính của chị, 45% cú hai nốt).

**Ba bẫy khi dựng** (đo trên bản dựng): (1) sàn gốc tay phải chung G3 làm tay phải nhảy theo gốc hợp âm (Dm lên A4,
cách D3 tay trái 19 nửa cung) → nút thử khai `rightHandRegister.rootFloor` 48: gốc tay phải luôn cao đúng một
quãng tám trên gốc tay trái. (2) `settleHands` dãn tay phải theo THẾ BẤM tay trái (bóng, không phải tiếng đang
kêu) → E3 của sóng trên C bị đẩy lên E4, sóng lộn (E4 G3 E4). Thêm `RhythmHit.raiNoi`: nốt rải tay phải nối tay
trái thì không dãn — cùng lý do ngoại lệ câu rải tay trái. (3) nhánh không dãn trả NGUYÊN thế bấm tay phải (thành
dặm hợp âm) → nốt `raiNoi` lấy đúng nốt đã chọn. Chỉ nút thử gắn `raiNoi`; c22 và mọi điệu khác không đổi nốt.

Nghe ổn thì thay hẳn nút Lá thư cũ rồi xoá nút thử. Toàn suite **2.798 qua / 7 đỏ** — đúng 7 đỏ cũ.

### Slow Rock Lá thư ĐÃ ĐẠT — hai điệu đệm và câu solo; đường đã duyệt, đừng đổi nốt

**Người dùng** (25/9/2026): *"điệu Slow Rock Lá Thư và Slow rock hai tay Lá Thư đều đã đạt, các câu solo cũng đã đạt"*.
Giữ cả hai nút; nút hai tay bỏ nhãn "(thử)", ghi chú điệu đổi "Chờ nghe duyệt" → "Đã nghe duyệt 25/9/2026".

| đã duyệt | file |
|---|---|
| Slow Rock Lá thư: phiên c15–c16 · điệp c41–c42 · fill c22 · hợp âm chia đôi thì rải (`raiHopAmChiaDoi`) | `style/styleLibrary/linhNhiSlowRock.ts` |
| Slow Rock Lá thư hai tay: sóng rải vắt hai tay (`raiNoi`), family `slow-rock-la-thu-hai-tay` | cùng file |
| Câu solo dạo · giang · kết slow rock Linh Nhi | `style/soanSlowRockLinhNhi.ts` (+ `slowRockLinhNhiNguon.ts`) |

Chưa được duyệt riêng: Linh Run (`chayLinhNhi`), mốc chuyển đoạn đáp vạch (`transitionRunNotes`).

**Bộ soạn solo làm gì — tóm tắt** (đầy đủ, kèm số đo và bảng điểm phạt: md Linh Nhi **13h**):
1. **Học từ sheet** (số đo): nhịp thật (Lá Thư 12/8), ký hiệu hợp âm không tin được → đọc tay; quy luật nốt ở câu
   solo (nốt hợp âm phách mạnh 83% · nhẹ 85%, nối ô ≤ 2 nửa cung 23/43, không lặp hình ô 0/49, ít nghỉ, ít ô thưa);
   bản ký âm Một Cõi hỏng nhịp 14/29 ô; câu chạy dẫn vào hợp âm sau.
2. **Hợp âm** (`vongMoi`): ghép khúc đầu một vòng solo thật cùng giọng với khúc đuôi một vòng thật cùng loại đoạn, nối
   ở hợp âm chung; giới hạn độ dài / số hợp âm / hợp âm mở theo 23 vòng thật; bỏ vòng trùng hoặc cắt ngắn vòng có
   sẵn; xếp theo độ khớp vốn hợp âm bài; một hợp âm mỗi ô 6/8; mấy ô cuối là cử chỉ kết thật.
3. **Nốt**: mỗi ô là ô thật của chị (hoặc cao độ ô bolero cùng giọng trên tiết tấu ô slow rock). **Scale chỉ làm
   thước bậc**: dời cả ô theo bậc gam (thứ tự nhiên / trưởng) từ hợp âm nguồn sang hợp âm đích; nốt bậc 3·5·7 lệch
   nửa cung thì về nốt hợp âm (hợp âm thắng gam); nốt hoá của chị giữ khi không dời bậc. Chọn ô bằng điểm phạt theo
   quy luật đo. Không ngũ cung, không thang tự sinh, không bốc ngẫu nhiên.
4. **Giải thích được**: mỗi ô đã ghi `compositionSources` (vòng từ đâu · giai điệu từ ô nào, dời mấy bậc · tiết tấu ô
   nào). Chưa ghi nhãn từng nốt và điểm phạt — cần thêm khi dựng chức năng giải thích.

### Ballad Có Em Chờ đã nghe duyệt - 25/09/2026

**Người dùng:** "điệu ballad Có em chờ đã ổn hãy commit và gửi vào md sổ tay và md Cà Pháo".
Chốt mức hiện tại của **Ballad Có Em Chờ**, không tự train hoặc chỉnh âm nhạc thêm.
Đây là duyệt bằng tai, không suy từ kiểm thử. Các ghi chú chờ nghe trước mốc này là lịch sử.

Mốc mã trước commit tài liệu: `04cbaa5a5e02f3022f3040595723fee93fb655f7`, nhánh
`thuoc-cham-cau-solo`. Chuỗi thay đổi CP liên quan: `be8373e` sửa mô phỏng nguyên câu;
`219b805` kiểm kho 9 sheet/25 đoạn, giữ carry/dynamics/grace; `1074066` điều chỉnh mật độ
giang theo #1348. Không thay các quy tắc này trong lượt chốt.

Giữ family `ca-phao-ballad-co-em-cho` trong `src/reharm/style/styleLibrary/caPhaoBalladSongs.ts`:
mẫu phiên/điệp, tự đổi theo đoạn, phách dẫn khi phối màu Cà Pháo + solo full. Giữ đường soạn
`cpBalladComposition.ts`, nối `cpBalladConnections.ts`, mô phỏng `caPhaoSolo.ts` và dữ liệu
`cpBalladSolos.json`/`caPhaoFullSolos.json`. Chỉ sửa ghi chú hai mẫu từ chờ duyệt sang đã duyệt;
không đổi nốt, thời điểm, độ ngân, lực đánh, hòa âm, thuật toán hay câu lưu trong `Nguon.json`.

**Phạm vi:** không tự coi ACDD, Ngày mai em đi, mọi take/giọng/chế độ solo hoặc mọi kỹ thuật
trong kho đều được nghe duyệt. Không tác động Bossa/Linh Nhi. Khi có phản hồi mới, xác định
đúng điệu, câu, đoạn và mặt chưa ổn (tiết tấu/hòa âm/giai điệu) rồi mới mở phạm vi sửa.

**Bẫy tái tạo:** commit bảo toàn mã/dữ liệu nhưng không lưu một lượt ngẫu nhiên đã nghe.
Nghe đúng câu cũ cần câu đã lưu hoặc cấu hình + take; không thay câu đã duyệt bằng câu mới
cùng vòng hợp âm. Chi tiết và lịch sử train ở `CA-PHAO.md` và `CP-BALLAD-COMPOSER-2026-09-23.md`.

Kiểm lượt chốt: 16/16 test của `caPhaoBalladSongs` và `cpBalladBacking` đạt; so với HEAD,
file mẫu chỉ đổi hai chuỗi ghi chú, định nghĩa âm nhạc không đổi. Không chạy lại toàn suite/build.

### Ballad Để em: vạch nhịp sheet lệch một phách; tay phải lúc hát là giai điệu, bè hoà âm lấp chỗ tay trái trống

Nút mới **Ballad Để em** (`ca-phao-ballad-de-em-roi-xa` + `-chorus`, ♩=85), rút từ *Để Em Rời Xa* của
Cà Pháo. Số đo và lựa chọn biên soạn: `Reference/CA-PHAO-BALLAD-DE-EM.md`; tái tạo bằng
`python -B scripts/audit_cp_de_em.py`. **Chờ nghe duyệt.**

**Bẫy: vạch nhịp ký âm lệch nhạc đúng một phách.** Bass ở offset 1 của ô XML trong **68/70 ô**, giữ pha
cả sau các ô lẻ 2/4, 3/4, 6/4. Ký hiệu hợp âm lệch theo. Nên đo trên *ô thật* = [ô XML k phách 2, ô k+1
phách 2). Hai chỗ cũ đo lệch pha, **chưa sửa**: số "51/53 ô có LH ở phách 1" của bài này trong
`CA-PHAO-BALLAD.md`, và kho solo `caPhaoFullSolos.json` của bài (giang tấu: bass pha 1 phổ biến nhất,
4/14). Nút mới vì thế không gắn `cpSoloSong`.

**Hai tay:** tay phải lúc hát là giai điệu lời (nốt đỉnh hai lượt phiên trùng từng nốt, 4 cặp ô).
Cú tay phải không mang giai điệu chỉ 19/454. Cà Pháo phối hai tay bằng bè hoà âm chêm dưới giai điệu,
đúng chỗ tay trái trống. Trên 30 ô phiên, tay trái gõ phách 1 (30) · 3& (19) · 4 (29), còn bè tay phải
dày nhất ở phách 2 (18/21) · 1.75 (15/17) · 2.75 (14/21). Nút giữ bè ấy, bỏ nốt đỉnh.

Ô chọn: phiên = ô thật 8–9 (đối chiếu 36–37); điệp = 24–25 (đối chiếu 52–53, nửa đầu tay trái lấy ô 52
vì ô 24 vượt trần). Nối: mảng riêng `CP_BALLAD_DE_EM_STYLES`, không nhập vào `CP_BALLAD_SONG_STYLES`.
Lý do: test sáu điệu của Codex khoá cứng số lượng, và nút do Claude soạn không mang màu Codex.
`CP_BALLAD_SONG_IDS` gồm cả hai (họ Ballad, renderer giữ bè đã chọn). `CHORUS_PAIRS` và `hoDieu` thêm một dòng.

Hằng số mới, kèm triệu chứng để lùi:
- `leftHandTop` **60** (họ CP khác 67). Tay trái hai cặp ô cao nhất Bb3. Ở 67 thì trên Bb tay trái lên
  Bb3/F4, trùng phím F4 tay phải. *Lùi khi* tay trái nghe đục, cụm bị gập thấp.
- `rightHandRegister` **{55, 55, 74}**. Bè sheet nằm 58–73. Không khai thì C4/F4 trên Rê thứ lên C5/F5,
  đè tầm hát. *Lùi khi* bè tay phải nghe trầm, dính tay trái.

Test `caPhaoBalladDeEm.test.ts` khoá đầu ra vào đúng MIDI ô thật 9, 24, 25. Toàn suite **2.808 qua /
7 đỏ**, đúng 7 đỏ cũ. tsc sạch.

### Ballad Để em soạn lại trên mốc gõ DERX: chỗ "thiếu tiếng, đứt quãng" là lỗ giai điệu để lại

Người dùng chê bản 1 (`059b4f1`) *"còn dở quá"*. Họ nghe Ballad DERX của Codex (cùng sheet): *"bám gần
với tiết tấu đệm trong sheet gốc. Tuy nhiên nó vẫn có cảm giác bị thiếu tiếng và đứt quãng"*.
Soạn lại nút Ballad Để em trên mốc gõ DERX. Bảng đo đầy đủ: `Reference/CA-PHAO-BALLAD-DE-EM.md`.
**Chờ nghe duyệt.**

**Cái bẫy:** bỏ giai điệu lời mà không lấp gì thì phần đệm thủng đúng chỗ giai điệu từng lấp. Đo số nốt
đang vang từng móc kép (`scripts/audit_cp_de_em.py`; app phát trên đúng hợp âm và độ dài sheet):

| | phiên: nốt vang TB · móc kép im | điệp: nốt vang TB · móc kép im |
|---|---|---|
| sheet đủ hai tay | 3,00 · 2/480 | 2,79 · 3/368 |
| sheet bỏ giai điệu | 2,09 · 17/480 | 1,95 · 7/368 |
| DERX | 2,50 · 2/64 (1.5–1.75) | 2,19 · 2/64 (móc kép cuối) |
| bản 1 | 1,59 · 2/64 | = DERX |
| **bản 2** | **3,44 · 0** | **2,81 · 0** |

Bản 1 mỏng gần gấp đôi DERX, nên "dở". DERX im hẳn ở 1.5–1.75 và bỏ trống tay phải 0.5→1.75 và 3.25→5.

**Bản 2** giữ nguyên mốc gõ hai tay và bậc của DERX: phiên cửa sổ 4–5 (tay phải ngân F4 trên câu chạy
trái A2–D3–E3–F3–E3–D3–C3), điệp 24–25. Cũng giữ `leftHandTop` 59, `rightHandRegister` {55, 60, 74},
không bật `cpBalladChordLeads`, và thêm vào `KEEP_RH_RESTS` như DERX. Hai sửa, không thêm cú gõ:
(1) **ngân nối** — mỗi nốt ngân tới cú kế của cùng tay, renderer cắt ở chỗ đổi hợp âm; tay phải phiên
chỉ nốt dưới ngân nối, vì ngân cả hai thì 3,72 nốt, dày hơn sheet;
(2) **trả đủ quãng đôi tay phải** ở cú mà sheet là cụm hai nốt (D4+F4, E4+C5, G4+C5, F4+C5, F4+D5), bỏ nốt
trên 74. Sheet không ghi pedal (0 dấu), nên độ ngân nối là biên soạn; `sheet d` ghi cạnh từng cú.

**Giá trị cũ** (bản 1): phiên ô thật 8–9, tay phải chỉ bè dưới giai điệu, `leftHandTop` 60, tầm tay phải
{55, 55, 74}, `cpBalladChordLeads` bật, không ngân nối.
**Triệu chứng để lùi:** nghe lẫn giai điệu, chỏi giọng → bỏ nốt trên của quãng đôi; nghe ù → trả về `sheet d`.

Test `caPhaoBalladDeEm.test.ts` khoá: mốc gõ trùng DERX; trên vòng sheet không móc kép nào dưới hai nốt vang
(DERX không qua được điều này); cao độ khớp MIDI sheet.

### Bậc 7 trong cụm tay trái Ballad Để em: hợp âm ba thì BỎ, không lùi về bậc 5

Kiểm khung tiếng thì thấy trên hợp âm ba (Bb, Dm không có 7) cụm tay trái đầu ô gõ **trùng một phím hai lần**.
Đo trên Bb: Bb2 + F3 + F3. Nguyên do: `tone(3)` không tìm thấy bậc 7 nên lùi về bậc 5 (`DEGREE_CHAIN[3]`),
đúng phím bậc 5 đã có trong cụm. Nút Ballad DERX cũng bị y như vậy; tôi **không sửa DERX** vì là nút của Codex.

**Sửa:** thêm cờ `optional` cho từng bậc trong `RhythmHit.tones` (`types.ts`). Hợp âm không có bậc ấy thì
`notesForVoice` bỏ luôn tiếng đó, không lùi bậc. Chỉ hai cụm tay trái của Ballad Để em khai cờ này (`bay7()`).
Nay trên Bb · Dm cụm ra Bb2+F3 · D3+A3; trên Bbmaj7 · Dm7 vẫn Bb2+F3+A3 · C3+D3+A3 như sheet.

**Không gộp nốt trùng cho cả engine**, vì như thế đổi tiếng các nút đã duyệt. Có Em Chờ có cụm
`tone(1), tone(2), tone(3)`: trên hợp âm ba, bậc 5 của nó hiện đang gõ đôi.
**Giá trị cũ:** bậc 7 luôn lùi về bậc 5. **Triệu chứng để lùi:** cụm đầu ô trên hợp âm ba nghe mỏng quá → bỏ `optional`.

Test `caPhaoBalladDeEm.test.ts`: 12 giọng × 5 loại hợp âm × 2 ô, không cú nào gõ trùng phím.

### Ballad Để em: lấp khoảng trống sau Bùm bằng hai tiếng chát có trong sheet

Người dùng nghe bản 2 thấy sau tiếng Bùm đầu ô 1 và Bùm mạnh ô 2 của phiên là "khoảng nghỉ". Họ muốn thêm
tiếng chát "khớp tiết tấu đang chơi". Khoảng trống thật: ô 1 phách 1→2¾ (1¾ phách không có cú mới),
ô 2 phách 1→2.

Chọn tiếng lấp theo những gì Cà Pháo đánh ở đúng chỗ ấy, ngoài giai điệu, trên 6 cửa sổ phiên mỗi kiểu:
- ô Bb→C, phách 2: bè tay phải Bb3+F4 **4/6** → thêm chát tay phải phách 2 (ra F4+Bb4 vì sàn tay phải 60);
- ô Dm, phách 1&: tay trái gõ **3/6** → thêm chát tay trái C3+D3 của cửa sổ 9, cụm đầu ô vẫn ngân.

Chi tiết: `Reference/CA-PHAO-BALLAD-DE-EM.md` mục "Bản 3".
**Giá trị cũ:** không có hai cú. **Triệu chứng để lùi:** phiên dồn, mất chỗ thở → bỏ cú phách 2 trước.
Test khoá mốc gõ = DERX + hai cú, cùng cao độ F4+Bb4 và C3+D3 trên vòng sheet.

### Ballad Để em: phiên khúc theo khung tiếng người dùng — 1 Bùm … 2 chát … 3 bùm … 4 chát–5 bùm 6 chát … 7 bùm 8 chát 9 bùm

Người dùng giữ tiếng 1–3, thay từ tiếng 4 bằng khung của họ, bỏ chát trái 1& vừa thêm ở bản 3. Chỗ
"4 chát–5 bùm" họ muốn *"giật nảy từ chát rồi giật vào bùm"*.

Vị trí do Claude đặt, chưa chốt:
- 4 chát: ô 1 phách 4&, ngắn ¼, lực .8 (chát khác .65).
- 5 bùm: ô 2 phách 1, lực .85.
- 6 chát: phách 2.
- 7 · 8 · 9: phách 3 · 3& · 4. Bùm 7 là D2, bùm 9 là D3.

Nốt chát lấy bè sheet sẵn có (G4+C5, F4+C5). Mọi tiếng ngân tới cú kế cùng tay; test vẫn khoá ≥2 nốt vang
trên vòng sheet. Chi tiết: `Reference/CA-PHAO-BALLAD-DE-EM.md` mục "Bản 4".

**Mất theo khung:** câu chạy tay trái 7 nốt của DERX (tiếng 7–8–9 nằm đúng chỗ ấy).
**Giá trị cũ:** bản 3.
**Triệu chứng để lùi:** giật nghe cụt → chát 4 về phách 4¾ hoặc bỏ nhấn. Điệp khúc không đổi.

### Ballad Để em: trả câu chạy tay trái 7 nốt; bùm 7 – chát 8 – bùm 9 ở phách 2& · 2¾ · 3 ô 2

Người dùng đòi trả câu chạy (bản 4 mất vì 7–8–9 chiếm chỗ) và dời 7–8–9 cho khớp tiết tấu. Nay 7–8–9 đứng
trước câu chạy, giữ đúng thứ tự khung:
- bùm 7 = D2 ở 2&;
- chát 8 = F4+C5 ở 2¾, chỗ bè tay phải dày nhất phiên (15/17); F4 ngân trên câu chạy như sheet cửa sổ 5;
- bùm 9 = D3 ở phách 3, câu chạy vào liền ở 3¼.

Bùm 7 ở 2& là biên soạn (sheet 1/6). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 5".
**Giá trị cũ:** bản 4. **Triệu chứng để lùi:** 7–8–9 nghe dồn → bỏ bùm 7 trước.

### Câu chạy ngẫu nhiên người dùng nghe trong điệu KHÔNG nằm trong ô đệm — cờ `autoFills: false`

Người dùng muốn thay "câu chạy ngón ngẫu nhiên" sau tiếng bùm 3 của Ballad Để em bằng 4 chát 5 bùm 6 bum 7 chát.
**Cái bẫy:** ô đệm không có câu chạy nào ở đó. Câu ấy là câu lót tự động của app: `generateFillLine`, hoặc
`planCpLicks` khi màu Cà Pháo. Nó chèn theo mật độ (`fillPositions`), không theo chỗ trống của ô, nên thêm tiếng
vào ô không chặn được nó. Còn `yieldToFill` thì bắt phần đệm nhường chỗ cho câu lót.

**Sửa:** thêm cờ điệu `StylePattern.autoFills` (`false` = ô tự lấp chỗ trống). `ReharmHome` dựng `fillSkip` bằng
`autoFillSkip(count, muted, forced)`: tắt mọi ô trừ ô người dùng tự chọn Fill/Run và chỗ chuyển đoạn; ô đã tắt
vẫn tắt. Dùng cho `planCpLicks.skip`, `generateFillLine.skipFills`, và lọc `fillEligible` (gạch chân ô fill).
Cần làm thế vì hai nhánh xử lý khác nhau: `planCpLicks` cho `skip` thắng cả ô tự chọn, còn `fillPositions` cho
ô tự chọn thắng `skip`.

**Không dùng `bossaFillsInGaps`** (lối của các nút CP có `cpBalladChordLeads`): đệm ngân kín thì nó bỏ luôn ô
người dùng tự chọn. Người dùng từng bực đúng chuyện này ở Linh Run.

Ô phiên bản 6 (số đo trên 6 cửa sổ Bb→C, chi tiết `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 6"):
- 4 chát 3¼ (bè tay phải 3/6);
- 5 bùm G3 3& (tay trái 6/6);
- 6 bum C3 4 (tay trái 6/6);
- 7 chát 4& (sheet 0/6, biên soạn);
- ô 2 trả 3 chát liền 2 · 2¼ · 2¾ + bùm 3 + câu chạy.

**Giá trị cũ:** bản 5; mọi điệu có câu lót tự động.
**Triệu chứng để lùi:** muốn lại câu lót tự động → bỏ `autoFills: false`.

### Ballad Để em: khung phiên 1Bùm 2chát 3bùm 4chát 5bùm 6chát 7bùm 8bum 9chát 10bum

Người dùng đổi tiếng 6 thành chát và đặt lại khung từ tiếng 6, giữ 3 chát liền và câu chạy ở ô 2. Vị trí do Claude
đặt, chi tiết ở `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 7":
- 6 chát ở ô 1 phách 4 — tay trái sheet gõ đây 6/6, nên giữ phách ấy có tiếng;
- 7 bùm ô 2 phách 1;
- 8 bum D2 ở 1& (tay trái 3/6 cửa sổ Dm);
- 9 chát là 3 cú F4+C5 ở 2 · 2¼ · 2¾;
- 10 bum D3 ở phách 3, rồi câu chạy.

Khung 10 tiếng = 12 cú vì tiếng 9 có 3 cú.
**Giá trị cũ:** bản 6. **Triệu chứng để lùi:** phách 4 nghe lạc → trả bum tay trái ở phách 4.

### Ballad Để em: 3 chát liền làm mất tiếng bum — bỏ, còn một chát; bum 10 tách khỏi câu chạy

Người dùng không nghe được tiếng 8 trở đi. Ba cú F4+C5 dồn ở 2 · 2¼ · 2¾ đè hai tiếng bum; bum 10 ở phách 3 dính
câu chạy ¼ phách sau; hai bum lực .65 nằm dưới cụm đang ngân.

**Sửa:** bỏ 3 chát, còn chát 9 ở phách 2. Bum 10 dời về 2¾ (D2, cửa sổ 9 · 37). Bum 8 · 10 lực .8. Cụm bùm 7 nhả ở phách 2.
**Giá trị cũ:** bản 7. **Triệu chứng để lùi:** bum nghe nặng → lực .65.
Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 8".

### Ballad Để em: tiếng 7–10 "không nghe thấy" dù bộ dựng đệm có đủ ô 2 — trả 3 chát, chưa rõ nguyên do

Người dùng chỉ nghe 6 tiếng ô 1; bỏ 3 chát (bản 8) không cứu được, nên trả về bản 7. Đã loại trừ:
- `renderPattern` có đủ ô 2 (test khoá);
- mở mẫu lại chỉ ở đầu đoạn và ở hợp âm chia đôi của điệu `SPLIT_AWARE` (điệu này không có);
- `cpBacking` của CP Lick/Run chỉ xoá từ phách 3 ô 2 (Run) hoặc 3¾ (Fill), không chạm tiếng 7–9.

Nghi về tai, chưa kiểm: bùm 7 là cụm C3+D3+A3 không có gốc trầm; hai bum lực .65 dưới cụm đang ngân.
Chờ người dùng cho biết cách nghe. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 9".

### Ballad Để em: bùm 7 thêm gốc trầm D2, hai bum lực .8 để nghe ra khung ô 2

Theo nghi vấn về tai ở bản 9, người dùng bảo làm. Bùm 7 = D2 + cụm C3+D3+A3 (cửa sổ 9 có D2 đầu ô).
Bum 8 (D2, 1&) · bum 10 (D3, phách 3) lực .8, cũ .65. 3 chát giữ nguyên. **Bẫy:** `holdUntilStruckAgain` cắt **cả cú** khi một phím
trong cú bị đánh lại. Để D2 chung cú với cụm thì bum 8 (D2) tắt luôn cụm C3+D3+A3 — nên D2 là cú riêng cùng mốc.
**Giá trị cũ:** không D2, bum .65. **Triệu chứng để lùi:** ô 2 đục/nặng → bỏ D2 hoặc lực về .65.

### Hợp âm treo làm "bậc 3 + bậc 7" thành hai nốt trùng — nguyên do Ballad Để em mất khung ô 2

Người dùng xuất bài đang nghe. Màu át 9sus4 biến mọi D thành **D9sus4**, và ô 2 rơi vào D9sus4 ở 2/4 chu kỳ.
**Cái bẫy:** `tone(1)` trên hợp âm không có bậc 3 lùi theo `DEGREE_CHAIN[1]` về bậc 7, trùng `tone(3)`. Chát ô 2 thành
C5+C5 (một nốt gõ trùng phím), câu chạy F3 thành C3. Mọi test trước đều dựng trên hợp âm trơn hoặc hợp âm bảy, nên không bắt được.

**Sửa:** `ba3()` = bậc 3 với `fallbackInterval: 5`: thiếu bậc 3 thì lấy nốt treo. Chỉ hai ô Ballad Để em (13 chỗ); không đổi
`DEGREE_CHAIN` chung, vì Có Em Chờ đã duyệt cũng dùng `tone(1)`.
**Giá trị cũ:** lùi về bậc 7. Test chống trùng phím thêm `sus4`, `9sus4`, cộng test riêng cho D9sus4.
**Bài học:** thử trên vòng đã tái hòa âm với cài đặt màu của người dùng, không chỉ trên hợp âm trơn.

### Ballad Để em: khung phiên 11 tiếng + (chát chát chát) → câu chạy; dẫn bass ở bùm nối bum

Khung người dùng: 1Bùm 2chát 3bùm 4chát-5bùm 6bum 7chát 8bùm-9bum 10chát 11bùm (chát chát chát) → chạy. Vị trí do Claude đặt
(chi tiết `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 12"):
- 4→5 giật hơn: chát 4 dài .15, lực .9 (cũ ¼, .8).
- **bum 6 dẫn bass**: `som` + `requireNextChord` + `tone(0, -2)` — gốc hợp âm sau hạ một cung; hợp âm không đổi ở vạch thì
  bỏ cú, không dẫn sai chỗ.
- ô 2: 8 bùm D2 (¼) · 9 bum E2 (1¼) · 10 chát 1& · 11 bùm F2 (1¾) — bass 1-2-3. 3 chát ở 2 · 2¼ · 2¾, câu chạy 3¼ mở bằng bậc 5.

**Giá trị cũ:** bản 11. **Triệu chứng để lùi:** phách 1 ô 2 dồn → bỏ chát 10.

### "Bùm" là bass CÙNG hợp âm tay phải, không phải chỉ bass

Người dùng sửa: *"Bùm ko phải là chỉ đánh bass. Tiếng Bùm 1 còn có cả tay phải cùng đánh"*.
Nghĩa đúng:
- bùm = hai tay cùng đánh;
- chát = tay phải không bass;
- bum = bass nhẹ (dẫn).

Ballad Để em bản 12 có bùm 5 · 8 · 11 chỉ tay trái; nay thêm tay phải (E4+C5 · F4+A4 · F4+A4). Test khoá vai
từng tiếng. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 13".
**Giá trị cũ:** bản 12. **Triệu chứng để lùi:** ô 2 dồn → bỏ tay phải ở bùm 11.

### "Bum" cũng là bass cùng hợp âm; tiếng chính nào cũng phải rõ — lực ba mức

Người dùng: bum là chỗ dẫn nhưng *"cũng phải là đánh bass cùng với hợp âm"*; tiếng chính *"dù có tiếng mạnh tiếng nhẹ
... phải rõ rệt"*.
- Ballad Để em: bum 6 · 9 thêm hợp âm tay phải nhẹ.
- Lực tiếng chính: NHẤN .9 · THƯỜNG .8 · NHẸ .7 (hằng `NHAN/THUONG/NHE` cạnh ô phiên).

**Giá trị cũ:** tay phải mặc định .65, bùm 3 tay trái .65. **Triệu chứng để lùi:** nặng tay → THƯỜNG .7.
Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 14".

### Bass tiếng chính phải dày — nhưng "nốt + quãng tám" chạm sàn/trần tay trái thì gập thành trùng phím

Người dùng: bum không kèm hợp âm; bùm và bum *"nếu chỉ đánh 1 nốt bass thì nghe quá mờ nhạt"*, phải dày. Ballad Để em: bass mọi
bùm/bum nay là hai–ba nốt (bậc 5 + 8, dẫn + quãng 5, bậc 2 + 5, bậc 3 + 8).

**Cái bẫy:** `tone(0, -2)` + `tone(0, 10)` dẫn vào Đô ra Bb1 → gập lên Bb2 trùng nốt kia. Quãng tám của bậc 3/bậc 5 ở gốc cao
vượt trần 59 rồi gập xuống trùng. Chọn cặp luôn nằm trong 36–59.
**Giá trị cũ:** bản 14. **Triệu chứng để lùi:** bass đục → bỏ nốt trên của cặp ở bum 9.
Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 15".

### Bass dày ở C2–G2 không rõ; giai điệu thấp nốt đơn ở tầm câu chạy (A2–F3) mới rõ

Người dùng: bum đánh bass dày vẫn không rõ, trong khi nốt thấp của câu chạy nghe rõ, nên bảo cho bùm/bum đánh giai điệu thấp.
Ballad Để em: bùm 5 · bum 6 · bùm 8 · bum 9 · bùm 11 nay là nốt đơn G3 → C3 → D3 → E3 → F3 (vòng sheet), nối liền bậc vào câu
chạy. Suy đoán, chưa đo: vùng C2–G2 của piano đục nên dày thêm không rõ hơn.
Giới hạn: gốc từ G# trở lên thì gập xuống (Bm7: B3 → C#3), giống câu chạy DERX.
**Giá trị cũ:** bản 15. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 16".

### Nốt dẫn bị chìm khi hợp âm tiếng trước ngân đè lên nó và nó tụt xuống tầm thấp

Người dùng: tiếng 6 (bum) của Ballad Để em *"bị đánh chìm xuống dưới"*, trong khi 5 và 7 rõ; tiếng 6 là tiếng dẫn từ 5 qua 7.
Bản 16 để hợp âm tay phải của 5 (lực .9) ngân qua 6, và 6 là C3 tay trái đứng dưới G3 của 5.
**Nay:** 6 là nốt đơn tay phải lực .9, thấp hơn một nốt của chát 7 đúng một cung (Đô: E4 → F4 → G4); hợp âm của 5 nhả khi 6 vào.
**Bẫy:** viết "bậc 4" thì trên Sol bị đảo quãng, vì sàn tay phải 60 đẩy bậc 3 lên Si4. Viết "bậc 5 hạ 2 nửa cung" mới luôn liền bậc.
**Giá trị cũ:** bản 16 (6 = C3 tay trái dẫn vào ô 2). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 17".

### Ballad Để em: thêm tiếng dẫn nửa cung sau tiếng 6 (E4 → F4 → F#4 → G4)

Người dùng muốn một tiếng nữa sau tiếng 6 để 5 → 7 nối liền bậc, giống dáng đầu ô 2. Tiếng mới ở ô 1 phách 4¼, tay phải, lực .85:
một cung rồi nửa cung dưới nốt của chát kế (Đô: F4 → F#4 → G4). Khung nay 12 tiếng.
**Giá trị cũ:** bản 17. **Triệu chứng để lùi:** nửa cung lạ giọng → tiếng mới lặp nốt tiếng 6.
Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 18".

### Câu chạy của sheet có thể là HAI TAY ĐAN nhau — quét từng tay sẽ không thấy

Người dùng: sau tiếng 3 của Ballad Để em phải là câu chạy 7 nốt như câu chạy ô 2; đối chiếu lại sheet.
Quét từng tay thì ô 1 không có câu chạy nào; câu 7 nốt một tay chỉ ở cửa sổ 5. **Ghép hai tay** thì 3¼ → 4¾ có 7 mốc móc kép liền,
`P T P TP P T P`, ở 4/6 cửa sổ Bb→C (6, 8, 34, 36), cùng mốc với câu chạy ô 2. Các bản trước bỏ C4 · E4 · C4 tay phải vì coi
là giai điệu lấy đà, rồi lấp chỗ ấy bằng chát/bùm dính sát tiếng 3.
**Nay:** ô 1 = Bùm · chát · bùm → A4 · G3 · C5 · C4+G3 · E4 · G3 · C4 (cửa sổ 8).
**Giá trị cũ:** bản 18. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 19".

### Ballad Để em: câu chạy một thành khung bùm/chát — "Chát-bùm bum chát bùm chát bùm bum" (thử cách 1)

Người dùng định nghĩa lại:
- bùm = giai điệu (có thể thấp) kèm bass;
- chát = hợp âm;
- bùm–bum = đánh dẫn.

Khung 8 tiếng / 7 mốc. Người dùng chọn thử "Chát-bùm cùng một cú" trước, nghe rồi mới chốt. Nay 3¼ → 4¾:
C3+E4A4 · G3 · G4C5 · G3+C4 · E4G4 · C3+E3 · C#3 (→ D3). Bum vang một mình, không bị hợp âm đè.
**Giá trị cũ:** bản 19. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 20".

### Ballad Để em: câu chạy một bằng hợp âm — bùm = bass gốc + hợp âm, chát = hợp âm, bum = bass bậc 5

Người dùng tạm giữ khung "Chát-bùm bum chát bùm chát bùm bum", nhưng *"đừng cho chạy nốt ngẫu nhiên nữa mà hãy tạo tiếng bùm chát
bằng hợp âm"*. Nay ô 1 phách 3¼ → 4¾ chỉ dùng nốt của hợp âm (Đô):
C3+E4G4C5 · G3 · E4G4C5 · C3+E4G4C5 · E4G4C5 · C3+E4G4C5 · G3.
Câu chạy tay trái ô 2 giữ nguyên.
**Giá trị cũ:** bản 20. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 21".

### Ballad Để em: chát đi theo đỉnh giai điệu của sheet, bum là hai nốt bass

Người dùng muốn chát *"linh hoạt chọn nốt giai điệu trong hợp âm … học từ sheet để chọn nốt ko bị chói tai"* và bum
*"đánh 2 nốt bass"*. Đỉnh tay phải của sheet ở ba mốc chát (4 cửa sổ 6 · 8 · 34 · 36) là A4 → C5 → E4. A4 nằm ngoài hợp âm,
và trên hợp âm thứ nó thành nốt ngoài giọng, nên đổi về G4; hai nốt kia giữ đúng sheet.
Đô: E4G4 · (C3+G3) · G4C5 · C4+G3 · C4E4 · G4+G3 · (E3+G3).
**Giá trị cũ:** bản 21, khối E4G4C5 dặm lặp và bum một nốt G3.
**Triệu chứng để lùi:** chát mỏng quá → thêm nốt thứ ba. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 22".

### Ballad Để em: bum là bass dẫn — cờ `danVao` bước liền bậc vào nốt bass của tiếng kế

Người dùng: *"tiếng bum phải là dẫn bass qua tiếng kế tiếp"*. Cờ mới `RhythmHit.danVao`: `tones` là nốt đích, đặt theo hợp âm
vang lúc tiếng hết; bộ vẽ lùi một cung nếu còn trong gam hợp âm đang vang, không thì nửa cung.
**Bẫy:** phải gập nốt đích vào tầm tay trái TRƯỚC khi lùi. Nếu không, đích C4 (60) của bùm trên Fa lùi thành Bb3 (58), trong khi
bùm thật đã bị kẹp cuối gập xuống C3 (48), cách nhau 10 nửa cung. Cặp quãng tám gập trùng phím thì đẩy sang quãng tám còn chỗ.
Nốt dưới của cặp tụt dưới gốc hợp âm đang vang (Db: C2 < Db2, đỏ `leftArpeggioAboveRoot`) thì đánh chính nốt gốc làm nền.
Số đo: sheet C4 → D (2/6 cửa sổ); gam là suy đoán. Vòng sheet: bum F2+F3 → G3, C2+C3 → D3.
**Giá trị cũ:** bum C3+G3 · E3+G3 (bản 22). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 23".

### Ballad Để em: bum câu chạy một có giai điệu thấp tay phải, dẫn liền bậc vào tay phải tiếng kế

Người dùng muốn bum thêm *"nốt giai điệu thấp ở tay phải … cũng tuân thủ chức năng làm tiếng dẫn"*. `danVao` nay chạy cả tay
phải. **Bẫy:** tay phải lùi xuống dưới sàn 60 thì bộ kẹp cuối đẩy lên một quãng tám, nên dẫn từ trên xuống.
Vòng sheet: bum 3& F4 → G4 (chát), bum 4¾ E4 → F4 (bùm ô 2). Sheet không có tay phải ở 3& (6/6 cửa sổ) — đây là ý người dùng.
**Giá trị cũ:** bum chỉ tay trái (bản 23). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 24".

### Ballad Để em: nốt dẫn tay phải phải thuận tai với tay trái cùng mốc — dựng tay trái trước

Người dùng nghe chói ở bum. Trên bài của họ (G D Em Bm C G Am D, add9/9sus4): 1/8 tiếng bum chói — Gadd9 → D9sus4, tay trái
G2+C3 dưới tay phải F#4. **Bẫy:** bộ vẽ dựng tay phải TRƯỚC tay trái, nên nốt dẫn tay phải không biết tay trái đang dẫn gì. Nay
ô có `danVao` tay phải thì dựng tay trái trước; tay phải chọn nốt dẫn trong gam, không quãng 2 thứ / 7 trưởng / tăng 4 với tay
trái. Quãng 9 và 7 thứ cho qua (màu add9, 9sus4). Nay G4 → A4.
**Giá trị cũ:** bản 24. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 25".

### Ballad Để em: bum là walking bass — một nốt tay trái đi tiếp chiều bè trầm, bỏ giai điệu tay phải

Người dùng: *"tôi muốn Bum là kiểu Walking Bass chứ ko phải giai điệu như vậy, nghe nó ko hay"*, cho mọi hợp âm. Bỏ nốt tay phải
và cặp quãng tám ở bum (bản 24–25; trên Fadd2 ra ba nốt Bb). `danVao` nay chỉ tay trái, một nốt, nhận nốt bass trước
(`near`): nốt trước cao hơn đích thì dẫn từ trên, thấp hơn thì từ dưới; trùng nốt trước thì đổi phía. Bài người dùng
Fadd2 → G9: F3 → D3 → C3 → C3 → F3 → G3. Đã gỡ đường tay phải của `danVao` và lượt dựng tay trái trước (không còn ai dùng).
**Giá trị cũ:** bản 25. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 26".

### Ballad Để em: 3& → 4¾ là một dòng walking bass soạn cùng lúc, chấm điểm chứ không xúc xắc

Người dùng: *"làm luôn đi"* (đổi cả bass hai bùm cho dòng đi liền bậc). Cờ `danVao` nay đánh dấu một DÒNG: các tiếng tay trái
mang cờ liền nhau được `walkingBass` soạn cùng lúc — thử mọi dòng bước 1–2 nửa cung, phạt nốt ngoài gam / bùm lệch hợp âm / đổi
chiều / tới lui / chói tay phải, lấy dòng ít điểm nhất. Fadd2 → G9: F3 G3 A3 Bb3 A3 → G3.
**Bẫy:** đích xa đúng 10–11 nửa cung (Cm → Bm, Dbm → Bm) thì không có dòng hoặc bị ép toàn cung — so thêm đích ở quãng tám kề,
tiếng kế đánh theo. Trọng số là suy đoán, không có sheet.
**Giá trị cũ:** bản 26 (hai bùm G3 G3 theo sheet). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 27".

### Ballad Để em: câu chạy một sang cách 2 — "Chát bùm bum chát bùm chát bùm bum" từ phách 3

Người dùng nghe "Chát-bùm" (một cú hai tay ở 3¼) *"như nuốt mất tiếng bùm"*, chọn phương án 2: chát lên phách 3 một mình, bùm 3¼
đứng riêng (bass gốc + giai điệu thấp bậc 1). Bùm 3 nhả tay phải sau ¼ (cũ ½). **Đính chính:** nhãn "bắt đầu từ phách 4" ghi
trong câu hỏi và bản 20 là sai — sơ đồ bắt đầu từ phách 3.
**Giá trị cũ:** cách 1. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 28".

### Ballad Để em: câu chạy một cách 3 — tiếng 1–3 không đụng, bum cuối gộp vào phách 1 ô 2

Người dùng: tiếng 1–3 *"phải để nguyên ko chạm tới"*; cách 2 đã rút tay phải bùm 3 (sai). Nay 8 tiếng từ 3¼, bum cuối gộp với
bùm đầu ô 2 (giữ bass gốc, bỏ tay phải F4+A4). Walking bass đi từ bùm 3.
**Bẫy:** đầu dòng phải thử mọi nốt tay trái của tiếng trước, không chỉ `near`; hạ cánh quãng tám kề phạt +6; chói tay phải +10.
**Giá trị cũ:** cách 2 (bản 28). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 29".

### Ballad Để em: trở lại cách 1 — chát 4 lướt ⅛ phách trước bùm 5, bùm 5 là tiếng chính

Người dùng nghe cách 3 *"thiếu phách"*, bảo dùng lại cách 1 nhưng chát 4 *"là tiếng phụ chơi lướt ngang"*, bùm 5 *"là chính và ko
được lướt bỏ"*. Nay chát 4 là cú tay phải nhẹ (.5) dài ⅛ phách ngay trước 3¼; bùm 5 (bass gốc + giai điệu bậc 1, lực .9) đứng
đúng 3¼. Walking bass và bùm đầu ô 2 trả như bản 27.
**Bẫy:** tiếng lướt chồng ⅛ đuôi bùm 3 — trùng phím thì đuôi bị cắt sớm (Fadd2: 0.375 thay vì 0.5).
**Giá trị cũ:** cách 3 (bản 29). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 30".

### Ballad Để em: chát 4 trả về bình thường — tiếng lướt trước phách nghe lệch tiết tấu

Người dùng: *"khôi phục tiếng chát 4 như bình thường chứ đánh lướt nghe lệch tiết tấu"*. Chát 4 lại đúng 3¼, ¼ phách, lực .8,
cùng cú với bùm 5 (bass + giai điệu bậc 1, lực .9). **Bài học:** muốn một tiếng "phụ" thì hạ lực, đừng dời nó khỏi lưới móc kép
— dời ⅛ phách là tai nghe lệch nhịp.
**Giá trị cũ:** bản 30 (lướt ⅛ trước 3¼, lực .5). Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 31".

### Ballad Để em: chát 4 một mình ở 3¼, bùm 5 giật vào ở 3& — cú chung nghe như tiếng 3 đánh lại

Người dùng: tiếng sau bùm 3 *"nghe giống hệt tiếng 3 … đánh rất gần"*; tiếng 4 *"nên cách tiếng 3 ra một chút và giật về tiếng
5"*. Cú chát 4 + bùm 5 ở 3¼ (Fadd2: F3 + F4 A4 C5) chứa gần hết tiếng 3 (F3 C3 + A4 F4). Nay chát 4 chỉ tay phải ở 3¼, bùm 5 ở 3&
(giật ¼), các tiếng sau lùi ¼, bum cuối nhập bùm đầu ô 2 (giữ hợp âm). Walking bass gồm cả bùm 5, đi từ bùm 3.
**Giá trị cũ:** bản 31. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 32".

### Ballad Để em: bum 6 lực 1.2 — một nốt tay trái ¼ phách sau cú bùm hai tay thì chìm

Người dùng không nghe ra bum 6 (A3, lực 61, ¼ phách sau bùm 5 G3 61 + F4 72). Nay `BUM = 1.2` → lực 82. Định nghĩa người dùng
chốt 26/9: bùm = tiếng thấp, chát = tiếng cao, bum đứng sát bùm = tiếng dẫn vào / nối tiếp bùm.
**Giá trị cũ:** NHAN .9. **Lùi:** bum lộ → 1.05. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 33".

### Ballad Để em: bum 6 chơi như bùm 5 — một nốt tay trái sát sau cú hai tay thì tăng lực cũng không nổi

Người dùng vẫn không nghe ra bum 6 dù lực 82 (bản 33), bảo *"hãy chơi tiếng đó như bùm 5"*. Nay bum 6 = bass walking + giai điệu
bậc 3 tay phải, lực .9. **Bài học:** tiếng chìm vì thế đứng thì tăng lực không cứu được — phải thêm tay.
**Giá trị cũ:** một nốt tay trái. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 34".

### Ballad Để em: bỏ ba chát cuối ô 2 — câu đệm dừng ở 11 bùm (khung gốc) rồi chạy nốt

Người dùng: *"bỏ 3 tiếng chát ở cuối đi, điều chỉnh thành câu đệm 11 tiếng rồi chạy nốt"*. Bỏ chát chát chát ở ô 2 phách 2 · 2¼ ·
2¾; bùm 11 (phách 1¾) ngân lấp tới câu chạy — tay phải bậc 3 giữ suốt câu chạy như chát cuối cũ.
**Bẫy đếm:** "11 tiếng" là khung gốc người dùng; bảng của Claude đánh số 14 vì câu chạy một có 7 tiếng.
**Giá trị cũ:** ba chát F4+C5. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 35".

### Ballad Để em: hai tay ĐAN nhau như sheet — cú hai tay chỉ ở phách 1 và 4; lấp chỗ ba chát bằng đoạn đan tay

Người dùng: định nghĩa bùm/chát của họ *"quá cứng nhắc làm cho câu đệm mất hay"*, xin phân tích lại sheet, rồi xin soạn lấp chỗ ba
chát đã bỏ. Số đo (`scripts/audit_cp_de_em_bum_chat.py`, 30 ô phiên): hai tay gõ cùng lúc ở phách 1 (23/30) và phách 4 (24/30),
chỗ khác đan nhau; tay phải đứng riêng thường một nốt giai điệu. Ô 1 từ tiếng 4: phải · trái · phải · hai tay · phải · trái · phải.
Ô 2 phách 2 → 3¼: phải · trái · phải · trái · phải (chát cuối ngân suốt câu chạy).
**Bẫy walking bass:** phải xét nốt tay phải đang vang suốt thời gian nốt bass ngân; cho nhảy quãng 3 khi liền bậc buộc phải chói;
không đổi quãng tám hạ cánh khi còn dòng khác (hỏng dáng câu chạy A2 → D3).
**Giá trị cũ:** bản 34–35. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md` mục "Bản 36".

### Ballad Để em ĐÃ NGHE DUYỆT 26/9/2026 — bản chốt (bản 36)

Người dùng: *"điệu ballad Để em đã ổn hãy lưu lại"*. Bản chốt `89a8a82`, cả hai nút (phiên + điệp). Phiên trên vòng sheet
Bbmaj7 | C | Dm7:

| tiếng | vị trí | tay trái | tay phải | nguồn |
|---|---|---|---|---|
| 1 Bùm | ô 1 phách 1 | Bb2 F3 A3 (1¾) | D4 (1¾) · F4 (½) | sheet cửa sổ 4 |
| 2 chát | ô 1 phách 2 | — | F4+Bb4 (¾) | sheet cửa sổ 4 |
| 3 bùm | ô 1 phách 2¾ | C3 (½) · G3 (¾) | E4+C5 (½) | sheet cửa sổ 4 |
| 4 chát | ô 1 phách 3¼ | — | E4+G4 (½) | sheet E4/A4 (A4 ngoài hợp âm → G4) |
| 5 bum | ô 1 phách 3& | A3 (walking) | — | đan tay: sheet; walking: ý người dùng |
| 6 chát | ô 1 phách 3¾ | — | G4+C5 | sheet 6/6 cửa sổ |
| 7 bùm | ô 1 phách 4 | G3 (walking) | C4 | sheet 5/6 (cú hai tay duy nhất nửa sau ô) |
| 8 chát | ô 1 phách 4¼ | — | E4 (½) | sheet 6/6 |
| 9 bum | ô 1 phách 4& | E3 (walking) | — | đan tay: sheet |
| 10 chát | ô 1 phách 4¾ | — | C4 | sheet C4 hoặc F4 (2/6 mỗi thứ) |
| 11 bùm | ô 2 phách 1 | D3 | F4+A4 (½) | khung người dùng ("8bùm-9bum") |
| 12 bum | ô 2 phách 1¼ | E3 | — | khung người dùng |
| 13 chát | ô 2 phách 1& | — | F4+C5 | khung người dùng |
| 14 bùm | ô 2 phách 1¾ | F3 | F4+A4 | khung người dùng |
| lấp | ô 2 phách 2 → 3 | D3 · Bb2 (walking) | A4+D5 · F4 · F4+C5 (ngân suốt câu chạy) | ý Claude, đan tay như sheet ô 9 · 37 |
| câu chạy | ô 2 phách 3¼ → 4¾ | A2 D3 E3 F3 E3 D3 C3 | (F4+C5 còn ngân) | sheet cửa sổ 5 |

Ba điều rút ra sau 36 bản, để lần sau khỏi đi vòng:
- **Đo cách hai tay phối hợp trước khi đặt luật tiếng.** Cà Pháo đan hai tay: cú hai tay gần như chỉ ở phách 1 (23/30) và 4
  (24/30); tay phải đứng riêng thường một nốt giai điệu. Luật "bùm phải có cả tay phải · chát luôn hai nốt" (bản 13–34) làm câu
  đệm nặng; người dùng tự rút lại: *"định nghĩa về bùm chát của tôi đã quá cứng nhắc"*.
- **Tiếng tay trái đứng riêng phải nằm giữa hai tiếng tay phải.** Đứng sát sau một cú có tay trái thì chìm — tăng lực (1.2) không
  cứu được (bản 27 "Chát-bùm nuốt bùm", bản 32–33 bum 6).
- **Tiếng "phụ" thì hạ lực, không dời khỏi lưới móc kép** — tiếng lướt ⅛ phách (bản 30) nghe *"lệch tiết tấu"*.
Walking bass (`walkingBass` trong `patternRenderer.ts`): soạn cả dòng một lần, chấm điểm (ngoài gam, bùm lệch hợp âm, đổi chiều,
nhảy quãng 3, chói với tay phải đang vang), không xúc xắc. Chi tiết: `CA-PHAO-BALLAD-DE-EM.md`.


### Để Em Rời Xa lệch vạch nhịp một phách ở CẢ HAI kho solo — nắn ở `tools/cp_full_solos.py` (`PHASE` · `BASS_HARMONY`)

Bẫy: kho bộ soạn (`cpBalladSolos.json`) và kho mô phỏng (`caPhaoFullSolos.json`) đặt ô theo vạch ký âm, mà bass của bài rơi ở
phách 2 ô XML (68/70 ô); hợp âm in đặt sớm một phách và đảo ở ô 30 · 66 · 68. Hệ quả: bộ soạn chưa chọn cử chỉ nào của bài (0/72
lượt thử; sau nắn 23/72); mô phỏng dạo 15,25 phách (cắt mất cụm cuối) · giang 17 · kết 39 → nay 16 · 16 · 38. Một bảng chung
(`PHASE = {'De Em': 1}`, hợp âm dựng từ bass thật) ở `cp_full_solos.py`, `cp_ballad_solos.py` import; 22 đoạn bài khác giữ nguyên
từng byte. Test đổi: `cpBalladComposition` bỏ khẳng định `bars[0].length 3.25` (lưới ký âm) → ô thật + bass đầu ô;
`caPhaoFullSolo` Để Em dạo/giang 16 phách (cũ 15.25 / 17).
**Lan sang Bossa CP**: `cpComposition.ts` học chuyển hợp âm/đường nét từ cả đoạn ballad cùng giọng → 49/240 lượt Bossa (thứ) đổi
hợp âm/nốt, 4/240 đổi thứ tự cử chỉ (dòng số bốc thăm dùng chung với bước chọn hợp âm; vẫn toàn cử chỉ Bossa gốc). Snapshot
"approved Bossa rhythm" đỏ vì test dặn không ghi lại sau khi đổi; người dùng quyết 26/9: *"làm như bạn khuyên đi"* → **đã ghi lại snapshot**, chỉ một khoá đổi (`minor/true/intro/3`, hash cũ `e5962d2c…`); 23 khoá khác giữ nguyên. Triệu chứng để lùi: nghe Bossa thứ
full dạo lượt 3 khác hẳn bản đã duyệt → so với hash cũ.

### Mô phỏng câu solo phải khai bài gốc — thiếu `cpSoloSong` thì lấy đoạn dài nhất cùng điệu

Người dùng: nút Để em bấm mô phỏng Cà Pháo full *"lại lấy câu của sheet Có bao giờ"*. `caPhaoFullSolo` không có `cpSoloSong` thì
chọn đoạn dài nhất cùng điệu · cùng giọng → Chưa Bao Giờ. Khai `cpSoloSong: 'Để Em Rời Xa'`. Bẫy kèm: `cpSoloSong` cũng là khoá
`ownSong` của bộ soạn — khai nó là bật nhánh "mượn tiết tấu bài một khung khi khác giọng" → nốt chạy dạo tụt còn 4%. Không dùng
nhánh ấy; tiết tấu bài gốc đi bằng cờ riêng `cpSoloOwnRhythm`.

### Solo Ballad Để em: tiết tấu từ solo bài gốc, giai điệu · hợp âm · kỹ thuật từ mọi sheet ballad CP

Bốn lớp, đều chỉ ở nút Để em (`caPhaoBalladSongs.ts`), điệu khác không đổi:
- `soloCell` — tay trái dưới solo chép khuôn giang ô 28–29 của bài. Cũ: lấy tay trái từ ô đệm hát → ô 2 thành 12 tiếng gõ lặp gốc.
- `cpSoloSheetTexture` — người dùng: *"quá nhiều chỗ dặm hợp âm, còn ít chỗ chạy nốt"*. Thân câu dạo lấy 34/72 ô từ ĐOẠN KẾT
  (phạt khác loại đoạn chỉ .15). Nay dạo/giang không lấy cử chỉ đoạn kết + chấm độ lệch khỏi mức sheet cùng loại đoạn
  (`cpSheetTextureCost`). Dặm 38 · 21 · 53% → 12 · 6 · 28% (sheet 14 · 10 · 34). Lượt thử chỉ thưởng chạy/giật thì vọt quá
  (dặm 2%, chạy 55%) — phải chấm cả thừa lẫn thiếu.
- `cpSoloOwnRhythm` — người dùng: *"còn quá rời rạc và ko khớp với tiết tấu điệu"*. Tiết tấu mọi khung hai ô từ solo bài gốc
  (dạo/giang ← dạo/giang, kết ← kết); tiếng đơn ngân ≥ ½ phách nhận bè/quãng tám/cụm của câu nguồn (nhận cả nốt ngắn thì bè 3/6
  vọt 28–37%); bè quãng 4/5 của bài giữ đúng quãng (`fourth-dyad`; cũ: bộ giải đổi thành quãng 3). Người dùng chấm 7/10.
- `cpBalladThu` (ô tick lượt 4) — xem mục dưới.
Đo: `__tests__/cpSoloTexture.probe.ts` (dặm · quãng tám · câu chạy · bè · phách giật), `scripts/audit_cp_ballad_solo_hoc.py`.

### Solo Ballad Để em ĐÃ NGHE DUYỆT 26/9/2026 — lượt 4: nốt màu theo vai nốt nguồn, khép câu bằng câu đóng của bài

Người dùng: *"ô tick Solo lượt 4 đã soạn ra các câu solo nghe rất hay, hãy giữ tick đó lại"*, rồi *"điệu Ballad Để em đã ổn và cả
các câu solo cũng đã hay"*. Ô tick lượt 4 bật sẵn, lưu theo bài (`songSnapshot.cpBalladThu`, bài cũ → bật); engine không cờ vẫn
là lượt 3 cho test và điệu khác. **Giữ ô tick** — người dùng dặn lượt sau làm ô tick riêng chồng lên, không gộp khi chưa bảo.
- Cú dẫn / đóng kết (giọng thứ): câu đóng của chính bài bVI → bVII | i. Cũ (Codex, vẫn là mặc định): ii–V của hợp âm hát kế
  (La thứ Gm7 · C7 → F) / V7–i. Số đo: 0/6 đoạn dạo/giang thứ của CP dẫn bằng ii–V; 0/3 đoạn kết thứ đóng V7–i.
- Nốt màu: nốt được mang bậc 9 · 11 · 13 cả ở trọng âm khi nốt nguồn cùng vị trí mang đúng vai ấy trên cùng chất hợp âm, trong
  gam, không nốt tránh; không ép giải liền bậc. Cũ (Codex): trọng âm/nốt dài chỉ nốt hợp âm → bậc 9 đúng phách 1 · 2 · 0%
  (sheet ~16%); nay 5 · 11 · 3%. Vết `color-tone`.
- Triệu chứng để lùi: nghe câu nói "chỏi" ở trọng âm hay khép câu lạc giọng → bỏ tick lượt 4 (về lượt 3).
**Lượt 5 BỊ BÁC** (*"ko hay như lượt 4"*), đã gỡ: giữ vai nốt nguồn theo bậc + thưởng giữ vai −2,4 (cũ −1,6) → nốt gốc đúng
phách dạo 22 → 11%, sát số đo hơn mà nghe kém hơn. Đừng dựng lại. Đính chính kèm: quãng tám kết 8–9% (bài 2%) không phải lệch —
đó là cụm C3+F3+C4 của chính câu đóng kết, bài đánh một lần, bộ soạn dùng câu đóng mọi lượt.
Giải thích cách chọn hợp âm và nốt (cho chức năng giải thích sau này): md Cà Pháo, mục "Bộ soạn solo Ballad Để em lượt 4 ĐÃ DUYỆT".


### Slow rock: ô tick "mỗi hợp âm 6 phách rồi chuyển" — `chordBeats` = MỘT ô của điệu

Người dùng: *"có nhiều bài slow rock mà mỗi hợp âm chỉ đánh 6 phách là chuyển qua hợp âm khác. Tôi muốn tạo ô tick để chơi
6 phách để chuyển hợp âm chứ ko phải 2 lần 6 phách"*. Điệu `gridUnit` 0,5 (Lá thư, LT, Đức Thịnh): `chordBeats` =
(beatsPerChord/4) × beatsPerMeasure = 6 nốt đen = HAI ô 6 móc đơn. Ô tick `slowRockMotO` (họ slow rock, lưu theo bài) →
`chordBeats` = beatsPerMeasure × gridUnit (3 nốt đen); ô chọn "Mỗi hợp âm" bị khoá. Ô đệm trải theo thời gian nên mỗi hợp
âm một ô vẫn nhận trọn một ô rải trên gốc của nó. Bộ soạn solo Slow Rock Linh Nhi không đọc `chordBeats` → câu solo đã
duyệt không đổi. **Bẫy:** lượt đầu tôi dựng ngưỡng `splitBelow` "coi hợp âm ghép đôi là trọn một ô" — hiểu sai, đã gỡ hẳn.

### Mốc chuyển đoạn: nghỉ ĐÚNG N phách, ĐÔN RA thêm vào ô nối; nút "4" → "Mặc định" theo sheet

Người dùng (Slow Rock Lá thư hai tay, đệm "Không" · im 3): *"tôi chọn nghỉ phách sau khi chạy ngón mà ko thấy nghỉ"*. Bẫy:
đệm 0 thì câu chạy bắt đầu ngay đầu ô ở tốc độ cố định → lặng = phần ô còn thừa, không theo số chọn (ô 4 phách: chọn
2 · 3 · 4 đều lặng 1¾); trần giữ chỗ 2 nốt đen còn cắt chỗ nghỉ ở ô 6 móc đơn. Ba lượt sửa:
1. `transitionRunNotes`: câu chạy luôn kết ĐÚNG chỗ nghỉ (`datCuoi` mọi mức đệm) — người dùng chọn "nghỉ đúng N phách" thay
   luật 17/8 (`50c9596`) "Không = im điệu chạy ngón ngay từ đầu ô"; "Không" nay = không bắt buộc đệm trước. Test cũ "không
   đệm thì chạy ngay từ đầu hợp âm" viết lại.
2. *"đừng dồn câu chạy lại chơi nhanh hơn. Nghỉ bao nhiêu phách thì đôn ra bấy nhiêu phách"*: `nghiDonRaTheoMoc`
   (sectionStyles) cộng số phách nghỉ (× gridUnit) vào hợp âm ở mốc (`halvedBeats`); câu chạy giữ móc kép, kết ở vạch cũ.
   Không đôn: mốc 0 quãng tám; ACDD / màu Cà Pháo (câu chạy CP không đọc số nghỉ); "Mặc định" ở điệu chưa đo sheet. Bản thử
   hạ trần giữ chỗ 2 → 1 nốt đen (móc kép đôi) bị bác — trần giữ 2.
3. Nút "4" → **"Mặc định"** (`restTheoSheet`) = *"tuân theo cách mà trong sheet đã làm ở mốc chuyển đoạn"*; mốc mới mặc định
   chọn nó. Số đo 14 mốc hai sheet slow rock Linh Nhi (lặng cả hai tay trước vạch, móc đơn): Lá Thư 0 ×4 · 0,5 ×3; Một Cõi
   0 ×4 · 0,25 ×1 · 1,5–1,75 ×2 → `StylePattern.transitionRest: 0` ở Lá thư và LT. Điệu không khai → 2 phách trong ô (cũ).
**Triệu chứng để lùi**: mốc chuyển đoạn nghe hụt đệm trước câu chạy ở ô dài → xem lại (1); bài dài ra khó chịu → (2).

### Hợp âm dài lẻ làm ô fill và ô đệm lệch pha — mở lại ô ở đầu hợp âm

Người dùng sau khi đôn ra: *"sao từ lúc đôn phách ra thì các chỗ gạch dưới đều bị thay đổi tiết tấu"* (gạch chấm = chỗ có
fill). Bẫy: `renderPattern` trải ô liên tục từ đầu bài; hợp âm ở mốc dài thêm 2–3 móc đơn → mọi hợp âm sau lệch pha với ô.
c22 gõ đều nửa phách nên MỐC GÕ không đổi — cái lệch là cú quãng tám / nốt đơn / độ ngân rơi sai tiếng (test phải so cả
hình cú, không chỉ mốc). Sửa: `fillBacking` mở lại ô fill ở đầu mỗi hợp âm (`cellBreaks`); ô đệm mở lại ở hợp âm ngay sau
mốc được đôn ra. "Nghỉ ở chỗ fill" (`fillRests`, có từ trước) vốn cũng kéo dài hợp âm → cùng lỗi, nay hết theo.

### Slow Rock Lá thư hai tay ĐÃ NGHE DUYỆT LẠI 26/9/2026

Người dùng: *"Điệu slow rock lá thư 2 tay đã ổn"*. Duyệt cùng các sửa trên (ô tick 6 phách, mốc chuyển đoạn nghỉ đúng N phách đôn ra + "Mặc
định" theo sheet, ô fill mở lại). Sóng rải hai tay không đổi nốt (bản 25/9). Ghi vào md Linh Nhi **mục 13i** (mục slow
rock) — người dùng dặn điệu nào ghi vào mục điệu ấy trong md thầy, áp cho mọi thầy. Toàn suite **2.835 qua / 7 đỏ** — đúng
7 đỏ cũ.


### Nút "Mặc định" = im 0 và nghỉ đôn ra — áp cho MỌI điệu (kể cả màu Cà Pháo)

Người dùng: *"nút nghỉ phách mặc định và cơ chế đôn phách mà vẫn giữ gìn tiết tấu hãy áp dụng cho mọi điệu"*. Đo mốc chuyển
đoạn cả kho (18 sheet có chia đoạn; Hồng Kông 1 không đọc được), lặng cả hai tay trước vạch đầu đoạn mới, nốt đen:

| thầy · điệu | mốc | lặng 0 | ≤ ½ | dài hơn |
|---|---|---|---|---|
| Cà Pháo ballad (7 bài) | 40 | 40 | 0 | 0 |
| Cà Pháo bossa (1) | 6 | 6 | 0 | 0 |
| Tôn Hùng ballad (2) | 14 | 14 | 0 | 0 |
| Linh Nhi bolero (6) | 36 | 29 | 4 | 3 |
| Linh Nhi slow rock (2) | 16 | 11 | 3 | 2 |

Riêng tay trái (tiếng đệm) trung vị 0 ở mọi thầy. Tái lập: `tools/moc_chuyen_doan.py` (`--trai`). → `NGHI_MAC_DINH = 0` (sectionStyles) cho mọi điệu, bỏ trường
`StylePattern.transitionRest` (Lá thư · LT khai 0 — nay chung). Cũ: điệu không khai → 2 phách trong ô, đo trên
`reference/nguoi ay.mxl` — đó là khoảng lặng của GIỌNG HÁT, không phải người đệm. `nghiDonRaTheoMoc` đôn ra ở mọi điệu, chỉ
trừ mốc 0 quãng tám và ACDD (menu ACDD không có số phách nghỉ). Màu Cà Pháo: `planCpLicks` nhận `transitionRests` — câu chạy
CP kết ở vạch cũ (`exit`), khung placement trùm chỗ nghỉ nên `cpBacking` tắt đệm ở đó. Cũ: màu Cà Pháo bỏ qua số phách
nghỉ và không tắt đệm. Ô đệm / ô fill mở lại sau hợp âm dài lẻ đã chung mọi điệu từ mục trên. Số đo từng thầy ghi vào md
thầy ấy, đúng mục điệu (Cà Pháo mục ballad · Tôn Hùng mục 4 · Linh Nhi 10c bolero, 13i slow rock).
**Triệu chứng để lùi**: bài cũ ở điệu khác nghe mốc chuyển đoạn vào quá gấp (không còn 2 phách cất giọng) → người dùng chọn
số ở menu, hoặc đổi `NGHI_MAC_DINH`. Toàn suite **2.836 qua / 7 đỏ** — đúng 7 đỏ cũ.
**ĐÃ NGHE DUYỆT 26/9/2026** — người dùng: *"đã ổn"*. Duyệt cả chuỗi mốc chuyển đoạn trong ngày: nghỉ đúng N phách · đôn
ra không dồn câu chạy · "Mặc định" = im 0 · ô đệm / ô fill mở lại sau hợp âm dài lẻ · áp mọi điệu kể cả màu Cà Pháo.

## Bước — Nút "Blues Đức Thịnh" (27/9/2026), tách khỏi "Blues ĐT" của Codex

Người dùng: soạn được câu solo/lick/run Blues theo **hướng A** (biên soạn theo lý thuyết Blues phổ
thông — xem hội thoại 25/9/2026 về khoá "The Ultimate Blues Piano Course": khoá chủ yếu là video/mp3
tôi không xem/nghe được, không đủ để soạn kiểu "đo từ sheet" như Linh Nhi), lấy tiết tấu đệm từ video
thầy Đức Thịnh, và đặt tên **tách hẳn** khỏi nút "Blues ĐT" Codex đang dựng song song (không chung id,
family, hay alias — cùng lối "Slow Rock LT" (Codex) đứng cạnh "Slow Rock Lá thư" (Claude)).

**Tiết tấu**: `style/styleLibrary/bluesDucThinh.ts` (family `blues-duc-thinh`, đứng NGOÀI `hoDieu.ts`
để không dính cổng màu/solo Linh Nhi của họ `slow-rock`) — copy nguyên `cell` của `slow-rock-duc-thinh-3`
(`testerStyles.json`, đã rà bằng tai, nguồn video kOwriZhpo6Y 06:45-10:43), **không đổi một cú gõ**.
Lý do: thầy nói nguyên văn ở 10:07-10:28 (PianoBrain `duc-thinh-not-blues-la-bac-5-giang`, validated):
*"Thực ra đó là điệu Blues nhưng mà nó không đánh nốt Blues thôi. Nốt Blues là nốt bậc 5 giáng."* — tức
tiết tấu đã là Blues, chỉ thiếu một CAO ĐỘ ở bè giai điệu, không phải tiết tấu khác.

**Câu dạo tự động đổi gam Blues — không cần thêm code**: `phraseScale.ts` `prefersBlues()` đã bắt mọi
family có chữ "blues"; family mới trùng điều kiện đó nên `autoPhraseScale` tự chọn `bluesChoice(key)`
(C: C Eb F Gb G Bb — `Reference/pianoimprovnotes.md` mục 1.2) cho đoạn dạo. Đã KIỂM (không chỉ suy):
gọi thẳng `generateSolo` với `singleScale` như `phraseSolo` gọi thật — 28 nốt, 0 nốt ngoài gam.

**Lick/run** (`style/blueDucThinhLicks.ts`, hook `linhRun` — cùng cơ chế Linh Nhi dùng): 6 câu **soạn
tay** (không sinh xúc xắc), mỗi câu ghi rõ lấy từ quy tắc nào trong `pianoimprovnotes.md` — nốt xanh
vào bậc 5 (đúng lời thầy) · turnaround b7-5-b3-gốc · groove rồi rải · vòng b3-4-b5-5-b3 · rải hợp âm
bảy chen nốt xanh · approach nửa cung. Nốt hạ cánh cuối câu (2/6 câu) được ngân qua vạch nhịp sang hợp
âm sau — đúng quy ước `chayLinhNhi`, không phải lỗi tràn ô. Cho phép bậc ba trưởng của hợp âm chen vào
(chord-tone soloing, mục 3.1) nên KHÔNG phải mọi nốt đều nằm trong gam Blues thuần — đã kiểm rõ trong
test, đừng siết lại thành "chỉ 6 nốt gam Blues".

**Chưa có / chưa đo**: đoạn kết (outro) hiện trống — cổng `coChiDanCodex` (10/9/2026) chỉ mở outro cho
Bolero Tuấn thứ và Bossa CP thứ, Blues Đức Thịnh cũng bị chặn như MỌI style mới khác, không phải lỗi
riêng của nút này. Giang tấu chưa có vòng ngắn riêng, đi lối mượn nguyên đoạn mặc định. Giọng trưởng
của Blues Đức Thịnh chưa có gì từ thầy — gam Blues áp cho giọng trưởng là suy rộng theo lý thuyết, chưa
đối chiếu. Vòng hợp âm I7-IV7-V7 không tự sinh — người dùng gõ hợp âm bài như mọi điệu khác.

Toàn suite **2.864 qua / 7 đỏ** — đúng 7 đỏ cũ.

## Bước — Blues Đức Thịnh: ô fill/run TỰ ĐỘNG cũng phải mang màu Blues (27/9/2026)

Người dùng nghe bản đầu: *"khi đệm tiết tấu Blues thì ngoài khung tiếng ra thì thầy Đức Thịnh cũng có
chêm vào các câu fill và các câu chạy nốt theo giai điệu màu Blues. Sao ko thấy bạn chơi như vậy."*

**Bẫy**: `chayBlueDucThinh` hôm trước chỉ được nối vào `linhRun` — hook CHỈ được hỏi ở ô người dùng tự
bấm nút Run. Ô fill không đánh dấu gì (phần lớn cả bài) đi qua đường khác: mọi điệu `timeSignature`
kết thúc bằng "/8" mặc định `fillBassChance` 0,8 (quy ước riêng cho lối rải bass slow rock của Linh
Nhi) → 80% ô fill tự động thành chạy bè trầm TAY TRÁI, 20% còn lại rơi vào sổ Licky chung — không câu
nào mang màu Blues nếu không tự bấm từng ô. Đo trước khi sửa (12 hợp âm, density mặc định): **36/36 sự
kiện tự động đều là tay trái**, 0 sự kiện tay phải.

**Sửa**: thêm tuỳ chọn `autoFillRun` (`fillSoloGenerator/soloGenerator.ts`) — cùng chữ ký `linhRun`
nhưng được hỏi ở CẢ ô fill tự động lẫn ô fill tự chêm (`extraFills`), trước cả `drawsBass`/sổ Licky.
Tách hẳn tên khỏi `linhRun`/`linhNhiFills` để **không đụng đường Linh Nhi đã duyệt** — chỉ nối cho
`blues-duc-thinh` (`style.family === 'blues-duc-thinh' → { linhRun: chayBlueDucThinh, autoFillRun:
chayBlueDucThinh }`). `bluesDucThinh.ts` thêm `fillBassChance: 0` để tắt hẳn mặc định 0,8 kế thừa từ
nhịp kép. Đo sau khi sửa: **16/16 sự kiện tự động đều là tay phải**, lấy từ sổ 6 lick đã soạn.

**Giá trị cũ**: chỉ `linhRun`, không `autoFillRun`; không khai `fillBassChance` (thừa hưởng 0,8 mặc
định). **Triệu chứng để lùi**: bài không lời rơi vào bè trầm tay trái ở mọi chỗ nối ô, không nghe câu
tay phải nào ngoài phần đệm.

Toàn suite **2.867 qua / 7 đỏ** — đúng 7 đỏ cũ.

## Bước — Sửa lỗi chia đoạn: dòng dạo đầu chiếm mất số của dòng lời đầu tiên (27/9/2026)

Người dùng gửi ảnh chụp: quét chọn "Phiên khúc" cho một bài đã có dạo đầu (đã sinh hợp âm) và điệp
khúc đánh dấu sẵn, nhưng dòng lời ĐẦU TIÊN của khoảng vừa quét bị rớt lại đoạn "Dạo đầu" cũ thay vì
vào "Phiên khúc". Người dùng xác nhận: đánh dấu bằng quét chuột bôi đen rồi bấm chọn loại đoạn (không
phải gõ ngoặc/`:` trong text).

**Bẫy**: `SongSheetView` đánh số dòng (`data-line-index`, dùng cho `SectionMark.from/to`) trên
`sheetHien` — bản nhạc ĐÃ gắn dòng dạo đầu/giang tấu/kết (`attachPhraseToSheet`/
`attachInterludeToSheet`, mỗi dòng KHÔNG LỜI này chiếm một số như mọi dòng khác). Nhưng
`resectionSheet` (áp đánh dấu) lại chạy trên `baseSheet` ở `ReharmHome.tsx` — bản CHƯA gắn các dòng
đó, cố ý tách ra để tránh vòng lặp phụ thuộc với hợp âm dạo đầu (`introSymbols` cần biết biên đoạn,
biên đoạn lại cần `baseSheet` dựng trước `attachPhraseToSheet`). Dòng dạo đầu chiếm số 0 ở bản có,
không tồn tại ở bản không có → mọi dòng lời phía sau lệch đúng 1 số. Quét trên bản có (đánh số dòng
lời đầu tiên là 1) rồi áp lên bản không có (dòng ấy giờ mang số 0) là chệch đúng ô đó.

**Sửa**: `flattenLines` (`input/songSheet.ts`) không cấp số cho dòng có `line.solo` nữa — luôn trả về
`-1`. Số của dòng lời chỉ đếm dòng lời, không đếm dòng KHÔNG LỜI xen giữa, nên giống nhau dù bản có
hay không có dạo đầu/giang tấu. `resectionSheet` không đụng gì thêm: mốc quét luôn `>= 0`, dòng `-1`
tự động không khớp mốc nào — dòng dạo đầu vì vậy cũng hết bị đổi tên nhầm nếu người dùng lỡ quét đè
lên nó (hiệu ứng phụ đúng hướng, không nằm trong yêu cầu ban đầu).

**Giá trị cũ**: `index: flat.length` (đếm mọi dòng kể cả dòng `solo`). **Triệu chứng để lùi**: quét
chọn đoạn cho bài đã có dạo đầu/giang tấu thì dòng lời đầu của khoảng vừa quét rớt lại đoạn liền trước.

Test mới: `input/__tests__/songSheet.test.ts` — "dòng dạo đầu (không lời) không chiếm số...", dựng cả
hai bản (có/không dạo đầu) rồi so số dòng lời phải khớp nhau, và mô phỏng đúng luồng quét-trên-bản-có
rồi áp-lên-bản-không-có.

Toàn suite **2.875 qua / 7 file đỏ (8 test đỏ)** — đúng 7 file đỏ cũ (`tuyenSolo.test.ts` có 2 test đỏ).

## Bước — Slow Blues ĐÃ NGHE DUYỆT 29/9/2026; xoá ba điệu Blues còn lại

Người dùng: *"Điệu Blues Sun đã ổn, hãy lưu lại và đổi tên nút thành Điệu Slow Blues và ghi vào md sổ tay, và ghi vào md
Điệu Blues. Xóa những điệu Blues khác cũng như là nút của chúng"*.

**Nút còn lại: Slow Blues** — tên hiện (`name` · `familyName` trong `styleLibrary/bluesClaude.ts`) đổi từ "Blue Sun"; **id
`blue-sun` / `blue-sun-chorus` và mọi tên trường lưu bài giữ nguyên** để bài đã lưu mở lại đúng điệu. Nội dung (hồ sơ đầy đủ:
`Reference/BLUES-CLAUDE.md`, số đo ba sheet: `PianoBrain/knowledge/BLUES-CHON-HOP-AM-VA-NOT.md`):
- đệm 6/8 mẫu *The House of the Rising Sun*: tay trái bass phách 1 · hợp âm phách 4 · bass dẫn nửa cung phách 6; tay phải chạy
  ngón (`chayBlueSun`); mỗi hợp âm 6 móc đơn; ♩ 92;
- bấm nút là tô màu Blues TRONG GIỌNG (`reharmEngine/mauBlueSun.ts` bản 2);
- dạo · giang · kết: `bluesClaudeSolo`;
- ô tick: "Bản Blues rút gọn" (bản 3 — mục dưới), "Bộ Soạn Blues lượt 6", "Slow Blues: hợp âm lướt Blues ở cuối đoạn".
Chưa rõ người dùng nghe duyệt với ô tick nào bật — các ô tick giữ nguyên, mặc định tắt. Đây là lần đầu toàn bộ phần Blues của
Claude (lượt 1–12, màu Blues, hợp âm lướt) vào git.

**Đã xoá** (nút + mã chỉ nút ấy dùng):
- **Blues Claude** (`blues-claude`, `blues-claude-chorus`) — cell lượt 4 CHƯA TỪNG COMMIT; định nghĩa còn ở `BLUES-CLAUDE.md`
  mục "Điệu" và chú thích đầu `styleLibrary/bluesClaude.ts`.
- **Blues Đức Thịnh** (`blues-duc-thinh`): `styleLibrary/bluesDucThinh.ts`, `style/blueDucThinhLicks.ts` và test — khôi phục từ
  commit 4926973 · 2787246.
- **Blues Codex 1** (`blues-codex-1`): `styleLibrary/bluesCodex.ts`, `style/bluesCodex.ts`, `style/bluesCodexSolo.ts`,
  `reharmEngine/bluesHarmony.ts` (`harmonyStyle: 'blues'`), mọi nhánh `isBluesCodex` trong `ReharmHome.tsx` (cổng CP Lick ·
  `cpComposeOn` · `cpFullOn`, dòng gam solo, thứ tự chơi, lời chú thích dưới nút), `CODEX_STYLE_IDS`, test — khôi phục từ commit
  27aa6df · 2cdd2c5 · 43e564f · 7d62e6f.

**Giữ**: `chayBluesClaude` + kho nửa ô Rockhouse (`bluesClaudeO.json`) — ô tick "chêm lick Blues" của họ Slow Rock còn dùng
(`bluesLick` giờ = `laSlowRock && bluesLickSR`); `autoFillRun` của `generateFillLine` (sinh cho Blues Đức Thịnh, nay lick Blues ô
tick slow rock dùng). Nhánh nửa ô Ray trong `bluesClaudeSolo` (điệu khác `blue-sun`) còn trong mã nhưng không nút nào gọi — để
nguyên cho khỏi đụng đường Slow Blues vừa duyệt.

**Bài đã lưu với điệu đã xoá**: `getStyle` trả `undefined` → lùi về `BALLAD` (`style = getStyle(...) ?? BALLAD`), không lỗi.

**Bẫy**: nhiều file mã nửa CRLF nửa LF, và `grep -c $'\r'` của Git Bash báo 0 cả khi file CRLF — thay chuỗi nhiều dòng phải chuẩn
hoá `\r\n` trước khi so.

**Test**: bỏ 3 test chỉ đo solo nửa ô Ray của Blues Claude (khung AAB · luật bậc ba blue · "không phô" theo thước nốt láy của
Ray) và 2 test cell Blues Claude. Chạy 3 test ấy trên Slow Blues thì đỏ — ghi làm số đo, CHƯA sửa (người dùng vừa duyệt): dạo Đô
thứ lượt 0 ô 4 (Cm7) có nốt lạc giọng theo thước của Ray; trên F7 giọng Đô trưởng có E (bậc 3 trưởng của chủ trên IV); khung AAB
0,43 < 0,5 (không áp — Slow Blues không theo khung của Ray). Test "mọi ô thân" chuyển sang Slow Blues, trần tay phải 88 → 96 (tầm
`chayBlueSun`).

Toàn suite **2.906 qua / 7 đỏ** — 7 trong 8 đỏ cũ; `cpComposition` "CP color owns every fill/run route" hết đỏ vì cổng `cpLick`
không còn nhánh Blues Codex.

### Bản Blues rút gọn: nốt "trong giọng" vẫn chói nếu đè nửa cung lên nốt hợp âm đang vang

Người dùng (bài "Thành phố buồn", ô D9 hết câu): *"Khi tick vào ô Blues rút gọn thì chỗ D9 chơi nghe chói tai hơn"*. Bản 2 chỉ
đòi nốt nối tay trái nằm trong giọng — G thuộc Mi thứ nhưng G3 trên D9 là bậc 11, đè nửa cung lên F#, ở bè trầm. Tay phải đáp
C5+E5 trên Em9 (bộ lọc chỉ xét nốt đỉnh). Sửa (`boSoanBlues.ts`): nốt nối tay trái không cách nốt hợp âm đang vang nửa cung
(`satNuaCung`) và không chồng nửa cung lên tay phải; tay phải ở phách 1 · 4, nốt ngân, nốt cuối nhóm không là nốt tránh
(`tranhVang`); cú đáp toàn nốt hợp âm mới. Đo hai vòng × 6 lượt: nốt nối chói 15/90 · 12/90 → 0/77 · 0/82; thời điểm có cặp nửa
cung 11/525 · 10/529 → 0. **Giá trị cũ**: chỉ xét "trong giọng", đáp chỉ xét nốt đỉnh. **Triệu chứng để lùi**: "tay trái nối ít,
nghe đều đều" (13/90 · 8/90 chỗ đổi hợp âm mất nốt nối) → bỏ điều kiện chồng nửa cung với tay phải trước.

## Bước — Twist: Bộ Soạn Blues soạn câu solo và câu chạy lúc đệm hát, thành MẶC ĐỊNH (29/9/2026)

Người dùng: *"Làm một nút nhỏ trong điệu Twist để: dùng bộ soạn Blues để soạn các câu solo và các câu fill cho điệu Twist … điều
chỉnh câu cho khớp tiết tấu của điệu nút Twist … học từ điệu Slow Blues để chèn các câu chạy nốt vào lúc đệm hát … Các câu chạy
nốt nên ít nốt hơn trong Slow Blues nhưng vẫn giữ đủ kết cấu … chủ yếu đặt ở cuối câu hát và nên có nốt dẫn qua hợp âm kế tiếp …
chèn những kỹ thuật khác của Blues vào tiết tấu đệm hát"*. Dựng làm ô tick "Twist: Bộ Soạn Blues (nghe thử)"; cùng ngày: *"Hãy biến
nút Twist: bộ soạn Blues (như trong ảnh) thành mặc định cho điệu Twist"* → gỡ ô tick, cờ `twistBlues` và trường lưu bài (bài lưu
trong lúc có ô tick còn trường ấy — bộ đọc bỏ qua).

**Đổi gì:**
- `boSoanBlues.ts` — `chayTwistBlues`: câu chạy cuối câu hát, láy blues vào cú chặn, đi bass cuối đoạn; trả cả phần đệm đã nhường
  chỗ. `soanCauBlues` thêm `chiNguon` · `noiBuoc` · `notToiDa` · `lapMoiNhom` — Slow Blues không truyền cái nào, hành vi giữ nguyên.
- `twistSolo.ts` — dạo · giang · kết: khung Twist giữ nguyên, tay phải ô câu nhạc do `soanCauBlues` soạn. Bộ mô-típ 27/9 (`calls` /
  `answers` / `motif` / `grace`) đã XOÁ.
- `ReharmHome.tsx` — nhánh Twist của `buildPass`: phần đệm = `chayTwistBlues(...).backing`, câu fill = `.events` (trước đây Twist
  không đi đường câu fill nào trừ CP Lick). CP Lick bật thì CP Lick thắng như cũ.
- Hồ sơ: `Reference/TWIST-BOOGIE.md` mục 7 (tóm tắt), `Reference/TWIST-SOLO-SOURCE.md` mục "Bộ Soạn Blues — MẶC ĐỊNH của Twist"
  (số đo đủ), `Reference/BLUES-CLAUDE.md` (tuỳ chọn mới của bộ soạn).

**Khớp nhịp — số đo:** một nhóm ba = MỘT PHÁCH swing của Twist (móc = ⅓ phách). Rockhouse là 4/4 lưới chùm ba: 735/810 cú đúng
lưới. Rising Sun chép theo thời gian thật: 25/185 cú đúng lưới → không dùng (`chiNguon: 'ray'`).

**Số đo đầu ra** (test `twistBlues.test.ts`; 4 bài × 6 lượt, 96 câu chạy; Slow Blues = Bản Blues rút gọn cùng bài, cùng cách đếm):
cú mỗi câu chạy trung vị 4 (2–7) · Slow Blues 6 (4–13); tổng nốt 610 · 840; cú đáp vào phách 1 hợp âm sau 72/72, nốt cuối câu cách
cú đáp 1–2 nửa cung; riff lặp 16/96 câu; láy 108/168 chỗ đổi hợp âm. Solo Đô trưởng 4 lượt: 6,4 cú mỗi ô (sheet ô 22–31: 5), nhóm
lặp liền 5/188.

### Đòi nốt dẫn thì không được thưởng câu kết ĐÚNG nốt hợp âm mới

Luật cũ của `soanCauBlues` (lượt 11) cộng +1 khi nốt cuối câu là nốt của hợp âm mới. Hợp âm ba không có hai nốt cách nhau 1–2 nửa
cung (F–A–C), nên câu kết đúng nốt hợp âm mới thì KHÔNG còn cú đáp nào đạt bước 1–2 → cú đáp trống. Bản đầu (bước 0–2) thì ngược
lại: nhiều câu kết bằng chính nốt đáp (81 → 81) — vào sớm, không phải nốt dẫn. Sửa: khi `noiBuoc[0]` ≥ 1, thưởng nốt cách một nốt
hợp âm mới 1–2 nửa cung mà không phải chính nốt ấy (+2, không thì −2). **Giá trị cũ**: `noiBuoc` là một số (trần 5), sàn 0.

### Riff chùm hợp âm của Ray không phải "câu chạy nốt"; riff ở solo thì nhàm

Bản đầu lấy cả nhóm riff chùm 4 nốt của Ray (76+79+81+84 đánh 4 lần) — nghe như đệm dày. `notToiDa: 2` giữ 141/163 nhóm nốt đơn ·
60/80 bè đôi, còn 15/141 nhóm riff chùm. Riff kiểu Slow Blues (Rising Sun E–G ×3) là HÌNH NGẮN LẶP LẠI → `lapMoiNhom` cho mọi nhóm
lặp liền tối đa 2 lần — CHỈ ở câu chạy lúc đệm hát. Bật ở solo thì gần như ô nào cũng một nhóm ×3 → bỏ ở solo.

### Test solo Twist quá 5 giây khi chạy chung

144 lần soạn (12 giọng × 3 đoạn × 4 lượt): chạy riêng 1,8 s, chạy chung cả bộ quá 5 s → `{ timeout: 30_000 }` như các test Blues.
Khẳng định riêng của bộ mô-típ cũ (một nét dời nguyên qua 12 giọng, bè đôi > 60%, pickup nối ô 3/5/7/9, ô 2 = ô 6) đã bỏ khỏi
`twistSolo.test.ts`.

**Test**: 2.914 qua / 7 đỏ — đúng 7 đỏ cũ (`phraseAcrossBar`, `daoTruongLinhNhi`, `handSplitAudit`, `leftArpeggioAboveRoot`,
`sietHopAm`, 2 × `tuyenSolo`). `tsc` sạch.

**Triệu chứng để lùi:** "láy nhiều quá" → chỉ láy ở hợp âm sau câu chạy; "đi bass cuối đoạn nghe phô" → bỏ ba nốt nửa cung, giữ mẫu
boogie; "câu chạy cụt" → nâng mức 1–3 cú mỗi phách; "riff lặp nhàm" → tắt `lapMoiNhom`; muốn về Twist cũ (không câu chạy, solo
mô-típ bè đôi) → khôi phục `twistSolo.ts` và nhánh Twist của `buildPass` từ commit 291d555.

**Chưa đo:** chưa nghe trên bài có lời thật (chỗ `breaths` của app); đoạn lặp lại trong Thứ tự chơi dùng cùng một bản câu chạy trong
một lượt phát; khi thứ tự chơi không theo thứ tự nguồn, cú đáp của câu chạy cuối đoạn có thể rơi vào đầu đoạn NGUỒN kế tiếp chứ không
phải đoạn thật sự phát sau (Claude suy từ cách `buildArrangedSong` cắt câu fill theo đoạn nguồn — chưa đo).

## Bước — Nút Kim: tiết tấu đệm đo từ bản thu ASIA "Kim" (29/9/2026)

Người dùng: *"bạn có thể tạo tiết tấu đệm như trong video Kim ở trên và cho nó vào nút Kim ko"* (video `fjG-uQVhPqI`, Công Thành &
Lynn, ASIA 1; bài Kim — Y Vũ, sheet ghi "Rock", khung 12 ô blues). Hồ sơ đầy đủ: `Reference/KIM.md`; tái lập: `tools/kim_ban_thu.py`.

**Mẫu** (`styleLibrary/kim.ts`, nút Kim nhóm 4/4, ♩ 152 đo): tay trái 1 1 3 3 5 5 6 5 móc đơn thẳng (34/44 ô đủ 8 nốt); tay phải
chặn hợp âm cả 8 móc đơn; nhấn tay phải 2 · 2& · 4 theo snare (0,91 · 1,00 · 0,90; 98 ô) — chuyển dụng, tay đệm của ban nhạc gõ đều;
nốt ¼ phách (đo trung vị 0,17, tứ phân vị trên 0,25). **Khác Twist:** Twist là swing 2:1 từ sheet Boogie; Kim đo ra thẳng (đỉnh tiếng
gõ thứ hai 0,50 phách, 592 phách).

**Bẫy đã sập:**
- Bè bass của demucs **gần như im** (RMS 0,0–0,4 so với bè "khác" 1,5–4,1): bass bản 1993 nằm trong bè "khác". Dò cao độ trên bè bass
  (pyin, rồi CQT cộng hoạ âm) chỉ đủ 8 nốt ở 7–8/146 ô. Đúng đường: chép nốt bè "khác", tách nốt dưới MIDI 50 làm tay trái.
- Đổi trường độ sang phách bằng khoảng lưới ĐẦU TIÊN (`grid[1] − grid[0]`) ra 0,13 phách — sai; phải chia khoảng lưới trung vị (0,17).
- Phép đếm hình 1–3–5–6 tự động bằng CQT trên cả bản trộn bắt 0,2 cụm/100 phách ngay trên chính bài Kim — không dùng được để lọc
  video khác.

**Chưa làm:** ngừng ở ô V của khung 12 ô (ban nhạc đánh một cú phách 1 rồi lặng — 7+ lần trong bài), hình 1 1 5 5 ♭7 ♭7 8 8 (6/44 ô),
câu dạo · giang · kết riêng. **Chưa nghe duyệt.**

**Triệu chứng để lùi:** tay phải nặng → bỏ cú chặn 1& · 3& · 4&; mất phách 2–4 → nhấn 1,15 → 1,3; đục → trường độ ¼ → ⅛.

Toàn suite **2.937 qua / 7 đỏ** — đúng 7 đỏ cũ. `tsc` sạch.

## Bước — Nút "Ballad cứ đi": đệm rải hai tay Cà Pháo (*Anh Cứ Đi Đi*), solo · lick · run · câu fill Cà Pháo — ĐÃ NGHE DUYỆT làm mặc định (29–30/9/2026)

Người dùng (29/9): *"hãy phân tích kỹ lại sheet Anh cứ đi đi của Cà Pháo để trích tiết tấu đệm rải ballad (từ ô 9 trở đi) … Tạo
thành nút Ballad cứ đi"*. Mỗi lối chơi dựng sau một ô tick nghe thử, rồi người dùng chốt: *"tick chêm tiếng nối hợp âm sau đã ổn, hãy
đặt ô tick đó làm mặc định"* (29/9) → *"2 chỗ tôi chọn hãy đặt làm mặc định … Ô giai điệu dẫn vào hợp âm sau hãy bỏ"* (30/9: mỗi hợp
âm 8 phách · solo · lick · run) → *"hãy biến ô tick câu fill Cà Pháo làm mặc định"* (30/9). Mọi ô tick và trường lưu bài của nút đã gỡ
(`balladCuDiNoi` · `balladCuDiDan` · `balladCuDiMotLuot` · `balladCuDiSolo` · `balladCuDiFill` — bài lưu còn trường ấy, bộ đọc bỏ qua).
Hồ sơ đầy đủ (mọi lượt sửa, lời người dùng, số đo): `Reference/CA-PHAO-BALLAD-CU-DI.md`; md thầy: mục "Điệu Ballad cứ đi" trong
`PianoBrain/knowledge/teachers/ca-phao.md`.

**Đổi gì:**
- `styleLibrary/caPhaoBalladSongs.ts` — nút `cuDi` (♩ 63): khuôn `CU_DI_MOT_LUOT_CELL` = mỗi hợp âm MỘT lượt 8 móc kép (2 phách máy):
  tay trái 1 · 5 · 8 · 9 · 10 rồi tay phải bắt tiếp 12 · 15 · 19, nhấn tiếng 1 · 5 · 8 có tay phải (Fm: F2 C3 F3 G3 Ab3 | C4 F4 C5 —
  đúng ô 9). `CU_DI_NOI_CELL` (hai lượt mỗi ô nhịp, lượt hai 3 tiếng chêm walking — mặc định 29/9) giữ để lùi; `CU_DI_SOLO_LEFT` (tay
  trái dưới solo). Cờ điệu: `soloCell` · `cpSoloOwnRhythm` · `cpSoloSheetTexture` · `cpDanSong` · `giuTamTay` · `tayTraiLenCao`; bỏ
  `autoFills: false`.
- `ReharmHome.tsx` — `chordBeats` của Ballad cứ đi = độ dài ô (ô chọn "Mỗi hợp âm" khoá); câu fill `cuDiFillTheoThu` ở cả đường fill
  thường (`autoFillRun`) lẫn CP Lick (`datFill`); đệm nhường câu fill bằng `danFillVaoSong`.
- `style/cuDiFill.ts` (mới) — câu fill Cà Pháo: bảy kỹ thuật xoay vòng theo THỨ TỰ CHỖ FILL (leo · tay trái dẫn · mở · bass đi · sóng
  lên xuống · câu đơn · chuyển quãng tám), hợp âm lướt `chonHopAmLuot`.
- `licky/cpLick.ts` — `cpDanSong`: câu lick CP đan vào sóng rải (câu chỉ thay tay phải; tay kia giữ tiếng ngân, nhường tiếng trùng;
  câu hai tay thì mỗi tay nhường khoảng tay ấy chiếm). Mốc chuyển đoạn = câu chạy tay trái ô 16 (`acddRunPitches`). `datFill`.
- `cpBalladComposition.ts` — chỉ khi điệu có `soloCell` + `tayTraiLenCao` (Ballad cứ đi): trần tay trái theo nốt tay phải LÚC GÕ, tay
  phải vào thấp sau thì cắt ngân; tay phải không vang thì trần `leftHandTop`; bậc 9 móc kép giữ (ngoài giọng → nốt trong giọng sát
  dưới); bỏ bè trong thấp hơn đỉnh trong ½ phách quá quãng tám. Kho tiết tấu bài gốc chỉ một khung → thêm khung (dạo/giang + kết
  63–64; kết + 67–68).
- `patternRenderer.ts` — `danVao` chạy cả hai tay, đích ở ô sau; `som` + `giuKhiKhongDoi`; hậu kỳ `giuTamTay`; cờ `giuTay`; `rootForced`
  so với min(ô nhịp, độ dài ô). `songStructure.ts` — `fixHandByRegister` bỏ qua tiếng `giuTay`.
- Script đo: `scripts/audit_cp_acdd_rai.py` (rải hai tay Anh Cứ Đi Đi), `scripts/audit_cp_noi_hop_am.py` (Cà Pháo nối hợp âm).

**Số đo** (Anh Cứ Đi Đi: vạch nhịp đúng pha, 0 cú lệch lưới móc kép): chuỗi rải vắt hai tay ô 9–16 **7/8** ô · phiên 2 5/8 · điệp
2/16 · 6/16. Tay trái dưới câu solo vẫn là sóng rải (n = 11 ô). Chỗ chuyển đoạn: 1/4 là câu chạy đàn (ô 16). Câu fill: 5 cửa người
dùng đã xác nhận (Để Em 40 · 59, Chưa Bao Giờ 22 · 50→51 · 75→76) — 4/5 ôm vạch nhịp, 4/5 thế bấm leo 1–3 quãng tám, 4/5 kết cú ngân.
Hợp âm lướt (5 bài đúng pha, 288 chỗ đổi hợp âm phần hát): ghi ký hiệu 19 (7%) · ngầm trong tay trái 16 (6%); luật chọn khớp 10/11
chỗ soi tận nốt.

### Tầm tay phải phải đo SAU `fixHandByRegister` — bậc 10 tay trái trên C4 bị dán nhãn tay phải

Hai lần báo "0 chỗ vượt quãng tám" mà người dùng vẫn gửi ảnh tay phải xa. Lần 1: test chỉ dựng vòng hai hợp âm thứ/trưởng/bảy — chỗ
vượt thật ở hợp âm treo (bậc 3 thiếu → lùi bậc 7, A5 + Gb5) và ở chỗ nối hai ô (71/3538 cú → 0/3620 sau `som` + `giuTamTay`). Lần 2:
`fixHandByRegister` (cuối `buildArrangedSong`) đổi nhãn cụm tay trái nằm hết trên C4 sang tay phải — C#4 của sóng trên A thành "tay
phải" cùng C#5+E5 (15 nửa cung); test đo thẳng đầu ra bộ dựng nên không thấy. Sửa bằng cờ `tayTraiLenCao` → `giuTay` (chỉ nhãn, âm
thanh không đổi): tắt cờ 44/223 cú vượt, bật 0/192. Test tầm tay nay quét vòng dài × độ dài hợp âm 2 · 4 · 6 · 8 phách, qua
`fixHandByRegister`.

### Ô ngắn hơn một ô nhịp: `rootForced` ép bass — ngưỡng "hợp âm ngắn" = min(ô nhịp, độ dài ô)

Khuôn một lượt dài 2 phách → hợp âm 2 phách nào cũng "ngắn hơn ô nhịp" → tiếng bass đầu bị ép lên nốt thấp nhất của thế bấm: Fm ra F3
thay F2, sóng mở F3 rồi xuống C3. **Cũ:** so với ô nhịp (`beatsPerMeasure × gridUnit`). Mọi ô của các điệu khác dài ≥ một ô nhịp →
không đổi (toàn bộ test: vẫn đúng 7 đỏ cũ).

### "Phách" ở Ballad cứ đi = tiếng móc kép của sóng rải

*"mỗi hợp âm chơi 8 phách rồi chuyển"* — hỏi lại mới rõ: 8 phách = một lượt 8 TIẾNG (2 nốt đen máy), không phải 8 nốt đen. Người dùng
gọi "phách 5" cho tiếng thứ 5 của lượt rải (như Slow rock đếm móc đơn).

### Hợp âm lướt Cà Pháo: đếm KÝ HIỆU thì hiếm, đếm NỐT thì ~1/8 chỗ đổi hợp âm

md Cà Pháo từng ghi hợp âm lướt "hiếm — 2 chỗ trên hơn 400 ký hiệu". Đo trên nốt tay trái: át 7 của hợp âm sau với bass là nốt cảm
âm (F7/A → Bbm), bII7 nửa cung trên hợp âm đích (Db7 → C7), bII7 hàng xóm rồi về (Db7 trong ô C7 trước Fm) — không in tên. Luật "cho
bass đi gần nhất" bản đầu chỉ khớp 7/11 và ra Gb7 cho C7 → Fm (sheet: Db7 hàng xóm) → bỏ.

### Câu chêm Anh Cứ Đi Đi ô 21 · 29 · 50 · 58: vai CHƯA XÁC NHẬN

Ghi 29/9 như số đo "câu chêm lúc hát" — thật ra suy từ hình nốt; sheet không có lời, người dùng chưa chốt cửa lời trong phần hát.
md Cà Pháo đã cảnh báo đúng bẫy ấy ("không suy vai từ hình nốt"). Sửa 30/9 ở cả ba chỗ ghi.

### Python ghi file ở chế độ văn bản trên Windows đổi LF → CRLF — test đọc mã nguồn đỏ

`open(p, 'w')` dịch `\n` thành `\r\n`: ReharmHome.tsx thành 6 307 dòng CRLF, `caPhaoFullSolo.test.ts` (đọc chuỗi trong mã) đỏ. Repo bật
`core.autocrlf` nên `git diff` không lộ. Ghi file bằng `newline=''` (hoặc công cụ sửa), đếm `\r\n` sau khi ghi.

**Test**: `caPhaoBalladCuDi.test.ts` 24 test (khuôn · nhấn · tầm tay trên vòng dài · solo tiết tấu bài gốc · sóng tay trái dưới solo
· chất liệu · lick đan · câu chạy ô 16 · nghỉ đôn ra · hợp âm lướt 11 chỗ sheet · bảy kỹ thuật fill × 12 gốc × 4 bước × 6 cặp loại · 7
chỗ fill liền nhau ra 7 câu khác nhau); `handRegisterGuard.test.ts` thêm ca `giuTay`. Toàn bộ **2.947 qua / 7 đỏ** — đúng 7 đỏ cũ
(`phraseAcrossBar`, `daoTruongLinhNhi`, `handSplitAudit`, `leftArpeggioAboveRoot`, `sietHopAm`, 2 × `tuyenSolo`; đỏ y hệt trên HEAD sạch,
đã chạy thử bằng worktree tạm). `tsc` sạch.

**Triệu chứng để lùi:**
- "8 tiếng mỗi hợp âm, đổi hợp âm vội" → `cell: CU_DI_NOI_CELL` và bỏ nhánh `laCuDi` ở `chordBeats` (mặc định 29/9).
- "nhấn nghe giật, nặng tay" → `NHAN_T` · `NHAN_P` 1 · 0,9 → 0,85 · 0,8. Lực trước khi nhấn: tiếng 1 · 5 · 8 = 58 · 42 · 56.
- "fill dày / chen lời" → trả `autoFills: false` (chỉ fill ô tự bấm) hoặc hạ mật độ fill; "một kỹ thuật fill không hợp" → bỏ khỏi
  `KIEU_FILL`; "hợp âm lướt chói" → cho `chonHopAmLuot` trả null (leo/mở không hợp âm lướt như bản đầu). Đỉnh câu fill `DINH` 86 (mới).
- "lick lấn sóng rải" → bỏ `cpDanSong` (về `cpBacking`: tắt cả hai tay trong khung câu, bè trầm của sheet nguồn).
- "solo khác chất" → bỏ bốn cờ `soloCell` · `cpSoloOwnRhythm` · `cpSoloSheetTexture` · `cpDanSong` khỏi `cuDi`.

**Chưa đo:** chưa nghe trên bài có lời thật (chỗ `breaths`) — không lời thì hợp âm 2 phách + mật độ "Vừa" ≈ mỗi 4 phách một câu fill;
vai câu chêm Anh Cứ Đi Đi; kho CP Lick chưa có Anh Cứ Đi Đi (câu lick mượn Để Em · Chưa Bao Giờ · Chúng Ta · Hồng Kông); luật hợp âm
lướt lệch Có Em Chờ 44→45 (sheet A7, luật Eb7/G); điệp khúc Anh Cứ Đi Đi (giai điệu quãng tám, dặm cụm) chưa dựng; dạo/giang đóng bằng
ii–V của Codex (kho chưa có câu đóng đáng tin của bài).

## Bước — Dọn bảng chọn còn chín nút · nhập bài chỉ bằng lưới · Twist 140 BPM, một lượt, trong tầm tay (30/9/2026)

Làm chiều–tối 30/9, commit 1/10. Mục này ghi lại từ diff và chú thích code — lời người dùng chọn chín nút không còn nguyên văn; các
câu trích dưới đây chép từ chú thích code ghi lúc làm.

**Bảng chọn — chín nút** (`styleLibrary/index.ts` › `PICKER_STYLES`, thứ tự cũ): Bossa CP cải tiến · Ballad Có em chờ (phiên · điệp)
· Ballad Để em · Ballad cứ đi · Slow Rock Lá thư 2 tay (phiên · điệp) · Slow Blues (+ điệp) · Twist · Bolero Tuấn · Tango Tuấn (hai
nút cuối là điệu tester trong `testerStyles.json`).
- **Xoá hẳn — mã, nút, test:** OneMotion (`onemotion.ts` + Pop · Rock · Swing · Waltz · Reggae · Salsa · Tango · Flamenco 1 …), thầy
  Hải (`haiStyles.ts`), Ballad CP sáu kiểu (`caPhaoBallad.ts`), Ballad ACDD cùng câu nối ACDD (`acddConnections`) và nút
  "Câu chuyển đoạn CP" (cờ `cpBalladTransition`), Ngày mai em đi, DERX (`balladDerx.ts`), Bolero 1 Tuấn Lưu (`bolero-1`), Bolero trữ
  tình Linh Nhi (`bolero-linh-nhi`), Bolero Nhi (`bolero-linh-nhi-3`), nút Bolero rải, Slow Rock Lá thư một tay (`slow-rock-la-thu`),
  Slow Rock LT (`slowRockLT.ts`), Slow Rock Đức Thịnh 1 · 3 (tester), Kim (`kim.ts` — chưa từng nghe duyệt), bossa CP cũ
  (`bossa-ca-phao-som`), Twist điệp khúc (dựng rồi xoá cùng ngày — `TWIST-BOOGIE.md` mục 8). Khôi phục bất kỳ điệu nào: commit c58be15.
- **Khuôn ngầm** (`INTERNAL_STYLES`: không nút, `getStyle` vẫn thấy, bia mộ `localStorage` không chôn được): `bolero-linh-nhi-2` (+
  vòm cao) — nguồn nốt solo Linh Nhi; bốn khuôn Tôn Hùng — dạo · giang · kết của nút thầy Tôn Hùng; `CA_PHAO_BOSSA` (sheet ô 9–10) —
  nút thầy Cà Pháo và gốc của Bossa CP cải tiến.
- **Điệu mặc định** = Ballad cứ đi (`DEFAULT_STYLE`). Cũ: `pop-1`. Bài lưu mang điệu đã xoá hay khuôn ngầm → `styleIdOrDefault` trả về
  Ballad cứ đi.
- Code chỉ phục vụ điệu đã xoá gỡ theo: `isSplitAwareStyle` / `SPLIT_AWARE`, `INTERLUDE_AS_CHORUS`, nhánh `ca-phao-ballad-acdd` ở
  ReharmHome, các family đã xoá trong `KEEP_RH_RESTS` · `hoDieu` · `nhipCuaDieu` · `soloTeacherOf`.
- Test máy chung (renderer, phát theo nốt, bù hợp âm lướt, cảm nhịp solo) cần ô đệm đơn giản → `__tests__/mauThu.ts`: bốn khuôn chép
  NGUYÊN số liệu Pop 1 · Bossa Nova 1 · Waltz 1 · Swing 1 tại c58be15, đổi id (`mau-*`) cho khỏi lẫn với điệu thật. Hồ sơ các điệu đã
  xoá vẫn nằm trong `Reference/` (KIM.md, SLOW-ROCK-LT.md, BALLAD-DERX.md, CA-PHAO-BALLAD*.md …) — là tài liệu cũ, không còn nút.

**Nhập bài chỉ còn lưới hợp âm** (`SongImport.tsx`, `importedTrack.ts`): bỏ nhập từ link và từ file trên máy (nhạc / JSON sidecar),
bỏ phát kèm audio gốc (`shared/audio/sourceAudio.ts`, ô bật/âm lượng nguồn). Xoá theo: `analyzeAudio` · `chromaMatch` · `chordNet` ·
`estimateBpm`, `parseSidecarTrack`, `titleFromSource`. `expandToBeats` chuyển sang `importedTrack.ts`.

**Twist** (chi tiết: `TWIST-BOOGIE.md` mục 5 · 8):
- ♩ 140 — *"Tempo mặc định giảm xuống còn 140 thôi"*. **Cũ: 180** (sheet Boogie Woogie). Lùi khi: nghe lê, mất độ nảy.
- Ô tick mỗi hợp âm MỘT lần mẫu hai tay (4 phách) **mặc định bật** — *"hãy đưa ô tick mỗi hợp âm đánh một lần rồi chuyển làm mặc
  định"*. Cũ: tắt (8 phách). Bài lưu trước khi có trường `twistSinglePass` → bật.
- Giang tấu Blues tự chèn và nút "+ Giang tấu" chơi MỘT lượt 12 ô (`bossaSoloSteps(…, 1)`, `interludeLoops: 1`). Cũ: 2 lượt (24 ô).
  Bossa CP giữ 2.
- **Tầm tay** — *"thế bấm dặm hợp âm quá xa tay người ko thể đánh được"* (ảnh Dm11: cú chặn C4 E4 G4 cùng lúc câu đáp A5). Luật: mọi
  nốt tay phải gõ cách nhau dưới ½ phách nằm trong một quãng tám. Ba chỗ sửa:
  1. `soanCauBlues` thêm `tamTay` + `tayPhaiCo`: câu chạy chọn quãng tám sao cho với tới cú chặn đầu hợp âm, nốt láy, nhóm trước.
     Không khai → không xét (Slow Blues không đổi). Đo trước khi sửa, câu chạy lúc đệm hát (12 giọng × trưởng/thứ × 5 vòng × hợp âm
     4 · 8 phách × có/không bỏ gốc × 3 lượt): **4 226 / 109 552** cú tay phải vượt, xa nhất 31 nửa cung.
  2. Dạo · giang · kết (`twistSolo.ts`) cũng khai `tamTay: 12` với tay phải ô đi bass · ô báo · hợp âm kết. Trước khi sửa: 952 chỗ vượt.
  3. Chỗ nối câu hát ↔ dạo · giang · kết: hai lớp soạn riêng nên không biết nhau — sau 1 và 2 còn **142 / 108 316** cú vượt, cả 142 ở
     chỗ nối (câu chạy ⅓ phách trước vạch đoạn). `noiCauVaoSolo` bỏ nốt tay phải ngoài đoạn solo vượt tầm với nốt solo → câu solo thay.
  Cú chặn còn sót mà nốt câu chạy gõ sát vượt tầm → nhường câu chạy. Để lùi: bỏ `tamTay` ở hai chỗ khai và bỏ `noiCauVaoSolo`.
- Nhả phím `nha` (`chayTwistBlues`): lớp nào gõ lại phím lớp kia đang ngân thì tiếng đang ngân nhả đúng lúc ấy. Hợp âm 4 · 8 phách
  (144 bài) **226 → 0**; hợp âm 2 phách (72 bài) **18 → 0**. Triệu chứng để lùi: cú chặn đầu hợp âm nghe hụt tiếng lúc câu chạy vào.

**Slow Rock Lá thư 2 tay:** ô tick "mỗi hợp âm một ô 6 phách" **mặc định bật** — *"Điệu Slow rock lá thư 2 tay cũng đặt ô tick trong
ảnh làm mặc định"*. Cũ: tắt (mỗi hợp âm 2 lần 6 phách). Bài lưu trước khi có trường → bật. Lùi khi: hợp âm đổi quá nhanh ở bài 2 ô
một hợp âm → `useState(false)` và `?? false` lúc nạp bài.

**Kiểm (chạy 1/10):** `tsc` sạch. Toàn suite **2 516 qua / 5 đỏ** (2 521 test, 172 file) — cả 5 thuộc 7 đỏ cũ: `phraseAcrossBar`,
`daoTruongLinhNhi`, `sietHopAm`, 2 × `tuyenSolo`. Hai đỏ cũ còn lại: `handSplitAudit` xoá cùng điệu; `leftArpeggioAboveRoot` nay qua
21/21 — **chưa xem vì sao** (đoán: vế đỏ nằm ở điệu đã xoá). Số test giảm 2 954 → 2 521 vì test của điệu đã xoá đi theo. Test mới:
`styleLibrary` (chín họ đúng thứ tự · khuôn ngầm không nút · điệu đã xoá → Ballad cứ đi), `StylePicker` (khuôn ngầm không hiện, bia mộ
trên khuôn ngầm không làm hỏng nguồn solo), `twistBlues` (tầm tay mọi nốt tay phải ≤ 12 nửa cung · không gõ lại phím đang ngân,
hợp âm 2 · 4 · 8 phách), `bossaRhythmOnly` (giang tấu Bossa CP 2 lượt, Twist 1).

**Chưa đo:** chín nút chưa nghe lại sau khi gỡ code dùng chung (chỉ có test máy); Twist đệm hai tay vẫn **chưa nghe duyệt**; tầm tay
Twist mới đo trên vòng mẫu, chưa trên bài có lời thật; Bolero Tuấn · Tango Tuấn chưa có ghi chép duyệt.

## Bước — Twist ĐÃ NGHE DUYỆT (1/10/2026)

Người dùng: *"Điệu Twist đã ổn hãy ghi vào sổ tay và thêm MD Twist rồi ghi vào"*. Bản được duyệt = commit 2f7bf1a, không đổi nốt
nào: đệm hai tay sheet Boogie Woogie ô 6–16 (bass 1–1–♭3–3–5–1–6–5, hai cú chặn cùng bass gốc ở phách 1 và 3⅔, swing 2:1) · ♩ 140
· mỗi hợp âm một mẫu 4 phách · giang tấu Blues một lượt 12 ô · Bộ Soạn Blues soạn câu solo và câu chạy lúc đệm hát · tầm tay một
quãng tám · nhả phím đang ngân.

**Ghi ở đâu:**
- `PianoBrain/knowledge/TWIST.md` (MỚI) — tài liệu dạy lại cả điệu: nguồn, khung tiếng bùm – chát kèm độ dài phách, mặc định đã
  duyệt (cũ ↔ mới), chọn hợp âm, chọn nốt, tầm tay, bảng triệu chứng để lùi, đã thử rồi bỏ, chưa đo. Số đo chép từ hai hồ sơ dưới —
  hồ sơ là nguồn, sửa số thì sửa ở hồ sơ trước.
- `Reference/TWIST-BOOGIE.md` — dòng trạng thái đổi "chưa nghe duyệt" → đã duyệt 1/10, trỏ sang TWIST.md.
- `PianoBrain/knowledge/BLUES-CHON-HOP-AM-VA-NOT.md` mục 9 — ghi duyệt, trỏ sang TWIST.md.
- `styleLibrary/twist.ts` — `note` của nút: "Chờ nghe duyệt" → "Đã nghe duyệt 1/10/2026 (đệm + Bộ Soạn Blues)". Không đổi hành vi.

**Không ghi vào md Linh Nhi:** sheet mang tên Linh Nhi nhưng credit trong file là Marco Brandt (*Boogie Woogie Basics*) — chưa
xác định Linh Nhi soạn hay chỉ chép, nên Twist không phải số đo phong cách của chị ấy.

**Chưa đo (giữ nguyên từ trước):** chưa nghe trên bài có lời thật (chỗ `breaths`); tầm tay mới đo trên vòng mẫu; hợp âm treo /
giảm / biến âm / slash chưa kiểm mẫu bass.

## Bước — Gỡ hai ô tick vòng thứ (mức 2: cả mã lẫn nút); giữ bốn ô còn lại (1/10/2026)

Người dùng hỏi sáu ô "nghe thử" dưới nút thầy (Siết · Trần 84 · Vòng dạo giống sheet trưởng · Vòng dạo giống sheet thứ · Vòng
giang tấu giống sheet thứ · Câu chạy tự soạn — dựng 6–10/9, mặc định tắt, KHÔNG lưu theo bài) còn cần không, rồi chốt: *"những phần
nên giữ thì hãy giữ lại … 2 phần cần bỏ thì hãy bỏ và bỏ ở mức 2"*.

**Đo tác dụng trước khi quyết** — gọi thẳng bộ dựng dạo · giang · kết như ReharmHome gọi (mô phỏng định tuyến, không qua giao
diện), vòng 4 hợp âm × 12 giọng × trưởng/thứ × 2 lượt = 48 ca mỗi đoạn, đếm ca đầu ra khác khi bật một ô (lối mặc định):

| ô | ca đổi khi bật |
|---|---|
| Siết | dạo Có em chờ 36/48 · Để em 36/48 · Ballad cứ đi 48/48 · Bolero Tuấn 24/48 |
| Trần 84 | Bossa CP dạo 46/48 · giang 47/48 · kết 45/48; Bolero Tuấn dạo 43/48 · giang 24/24 · kết 8/24 |
| Vòng dạo trưởng / thứ | dạo ba ballad CP 48/48 · Bolero Tuấn 24/48 · Tango Tuấn 48/48 |
| Vòng giang thứ | **0 ca ở mọi nút** — `phrase` chỉ gọi dạo/kết, giang thứ Tuấn đi `planMinorInterlude` |
| Câu chạy tự soạn | Bolero Tuấn dạo giọng thứ 24/48 |

Slow Rock Lá thư 2 tay, Slow Blues: cả sáu ô 0/48 (bộ soạn riêng không đọc). Twist: ô ẩn.

**Bẫy suýt sập — ô "Vòng dạo giống sheet trưởng" ĐÃ ĐƯỢC DUYỆT, chỉ là không ai ghi.** `Nguon.json` không ghi trạng thái ô tick,
nên tôi đã báo nhầm "các lần duyệt nhiều khả năng lúc ô tắt". Dựng lại vòng hợp âm: cả **6/6** câu dạo trưởng chấm "Đã ổn" — Linh
Nhi #157 #160 #163 (đêm 6/9, `C Am Em G …` = I–vi–iii–V mẫu *Mùa Xuân*) và Bolero Tuấn #472 #480 #484 (8/9, `C Am Dm G Am F Dm G` ·
`C Am Dm Em Am Dm Em G`) — đi vòng mẫu sheet trưởng; code 1/10 với vốn `C Am Dm G Em F`: ô bật khớp 16/24 lượt, tắt 0/24. Bài học:
trước khi gọi một ô tick là "chưa ai nghe", dựng lại đầu ra của các câu "Đã ổn" (vòng hợp âm có trong `hopAm`) xem ô ấy có bật không.

**Giữ:** Vòng dạo giống sheet trưởng (đã duyệt — như trên) · Trần 84 (ở trần 79: kết thứ Bolero Tuấn soạn không ra 6/24, giang +
kết Bossa CP khi đổi màu khỏi Cà Pháo 16/48 — đúng Fa · Fa♯ · Sol · Sol♯ thứ; trần 84: 0/24 · 0/48; hai câu báo lỗi trỏ về ô này) ·
Siết · Câu chạy tự soạn (nhật ký không chứng minh được chưa từng bật lúc duyệt; Siết: đo 9/9 bật thì kéo SAI chiều — chưa đo lại).

**Gỡ (mức 2):**
- `ReharmHome.tsx` — hai ô, `daoThu` · `giangThu` (state), chỗ truyền cờ, dòng "Không cần bật ô …" dưới Bolero Tuấn.
- `phraseSection.ts` — bỏ tuỳ chọn ngoài `daoThu` · `giangThu`; `(nhieuPap || !daoThu)` bỏ (cờ ngoài luôn tắt → luôn đúng);
  `daoThu` nội bộ cho Bolero Tuấn giọng thứ **giữ** (`tuan && minor`).
- `vonHopAmLinhNhi.ts` — bỏ `giangThu`, nhánh giang theo mẫu và `MAU_GIANG_THU` (chỉ ô ấy tới được); `daoThu` nội bộ giữ.
- Test: bỏ "TICK giangThu" (`vonHopAmLinhNhi.test.ts`); `boleroLinhNhi.test.ts` thôi truyền `daoThu` (Tuấn thứ vốn luôn bật).

**Đo tương đương:** chụp đầu ra trước/sau trên 30 528 ca — bộ dựng dạo · giang · kết (8 nút × không thầy / Linh Nhi / Tôn Hùng ×
3 đoạn × 24 giọng × 2 lượt × 5 bộ ô còn giữ) + vòng hợp âm dạo/kết (`phraseChords`) + vốn hợp âm Linh Nhi; chạy lại khi chưa sửa:
lệch 0 (tất định). Sau khi sửa: **khác 0 / 30 528**. Toàn suite **2 515 qua / 5 đỏ** (2 520 test — bớt 1 test giangThu), đúng 5 đỏ
cũ; `tsc` sạch.

**Khôi phục:** commit 54b3463 (hai ô, nhánh giang theo mẫu, test).

**Chưa đo:** đo tác dụng là mô phỏng định tuyến của app, không qua giao diện; ô Câu chạy tự soạn có từng bật lúc duyệt 5 câu
Tuấn thứ ngày 9/9 hay không — chưa xác định (chuỗi 6 nốt móc kép có ở 2/5 câu, nhưng cũng có ở câu 7/9 khi chưa có ô).

## Bước — Kế hoạch Lộ trình tập: cửa đạt, không game, không app riêng (1/10/2026)

Người dùng muốn biến KeyTrain thành app cắm đàn MIDI tập theo bậc tới thuần thục — ba mục: điệu (chín nút), kỹ thuật (Cà Pháo,
Linh Nhi, Blues, Twist), lý thuyết (không MIDI). Hỏi có nên làm thành app game mới; trả lời hai câu quyết định: *"App này là để
tôi tự tập"* · *"Sau khi có app rồi thì tôi sẽ tập mỗi ngày"*. Kế hoạch đủ ở `Reference/KE-HOACH-LUYEN-TAP.md`. Chưa viết dòng
code nào.

**Chốt:** làm trong KeyTrain (tab "Lộ trình"), không app riêng · cửa đạt hai mức — "Đã qua" (trong buổi) và "Đã thuộc" (lượt nguội
ở buổi khác ngày, kiểm lại theo Leitner sẵn có) · không điểm, sao, huy hiệu, bảng xếp hạng, chuỗi ngày · bậc cuối tắt nốt rơi ·
chế độ theo nhịp đánh sai không dừng · bài tập là bản đóng băng (ghi commit nguồn, test báo khi điệu đổi).

**Bẫy — Claude tự sửa trong ngày:** đề xuất đầu lấy "đạt hai lượt liền" làm cửa đạt — đo phong độ ngay sau khi tập lặp, không đo
cái đã thuộc (guidance hypothesis, Salmoni, Schmidt & Walter 1984). Và "tắt nốt rơi" từng để thành câu hỏi tuỳ chọn — nay bắt buộc.

**Đo trong code (1/10):** đường dựng điệu nằm trong `ReharmHome.tsx` (6 201 dòng, 147 dòng có hook); tab Luyện đệm nhờ nó dựng
(`ReharmHome.tsx:3917`) — lý do chính không tách app. `midiStore` đóng dấu thời gian bằng `performance.now()` lúc xử lý (dòng 73,
104), chưa dùng `timeStamp` của sự kiện MIDI. Không chỗ nào trong `reharm/playback` · `shared/audio` câm theo tay.

`KE-HOACH.md` thêm ngoại lệ: Lộ trình lưu tiến độ bậc (cửa đạt), vẫn không game hoá. `CLAUDE.md` thêm file kế hoạch vào danh sách
đọc.

**Chưa đo:** độ trễ đàn + loa trên máy người dùng; ngưỡng cửa đạt (≥ 90% · ≤ 40 ms là đoán); người dùng có tập đều không — nhật ký
lượt tập trả lời sau 3 tuần, khi đó mới xét chuỗi ngày.

## Bước — Lộ trình tập GĐ 0: chế độ chơi THEO NHỊP ở tab Luyện đệm (1/10/2026)

Người dùng trả lời bốn câu GĐ 0 · GĐ 1: *"làm 9 điệu"* · *"Tập trên vòng bạn soạn từ các bộ soạn của Cà Pháo, Linh Nhi và bộ soạn
Blues, làm vòng vừa phải đừng dài quá"* · câu bậc 7 *"tôi chưa rõ câu hỏi của bạn"* (giải thích lại, không chặn GĐ 0) · thứ tự điệu
*"làm như bạn đề xuất"*. Ghi ở `KE-HOACH-LUYEN-TAP.md` mục 4. **Chờ người dùng tập thử bằng đàn** — chưa ai chơi chế độ này.

**Dùng:** tab Luyện đệm → nút **Theo nhịp** (cạnh *Chờ đúng nốt*). Chọn tay, nhịp độ 60 · 80 · 100 % nhịp bài; lần đầu bấm **Đo
độ trễ** (gõ một phím theo click: 4 tiếng nghe + 16 tiếng gõ, 80 BPM). Bắt đầu: một ô click đếm vào, máy chơi phần tay KHÔNG tập
(tay đang tập im), đánh sai không dừng, hết bài chấm: đúng nốt x/y · lệch trung vị tuyệt đối · thói quen sớm/muộn · phím thừa.

**Mã:** `playback/timedScoring.ts` (hàm thuần: `expectedNotesOf` bỏ nốt láy như chế độ chờ; `scoreTimed` ghép cặp lệch ít nhất
trước — ghép lần lượt theo thời gian thì hai nốt cùng phím sát nhau giành nhau một phím bấm; `latencyFromTaps`) ·
`playback/TimedPractice.tsx` · `playback/luyenTapPlugin.ts` (máy chủ dev ghi `LuyenTap.json`, hai bảng `luot` · `doTre`, gitignore
như `Nguon.json`) · `audioEngine.beatAtPerformanceTime` · `startMetronome(bpmOverride)` · cài đặt `latencyMs` (null = chưa đo →
chưa cho bắt đầu) · `midiStore.noteOn/noteOff(…, time)` + `midiInput` truyền `event.timeStamp`.

**Hằng số — MỚI, tất cả là ĐOÁN, chưa đo:** `MATCH_WINDOW_MS` 150 (cửa sổ ghép phím ↔ nốt; lùi khi móc kép cùng phím lặp sát nhau
bị ghép chéo → thu hẹp, hay đánh đúng mà báo trượt ở nhịp chậm → nới) · `PASS_HIT_RATIO` 0,9 · `PASS_MEDIAN_ABS_MS` 40 · đo độ trễ
80 BPM, 4 + 16 tiếng, `MIN_TAPS` 8, quy lần gõ về [−¼, +¾) phách quanh tiếng click (80 BPM: −187 … +562 ms — tai nghe không dây
vẫn lọt) · đếm vào = `meter` phách.

**Bẫy:**
- **Không có `getOutputTimestamp`.** Tone bọc AudioContext qua standardized-audio-context, lớp ấy không lộ hàm này (grep cả gói: 0
  chỗ). Đổi giờ bấm → phách bằng `currentTime`, mà `currentTime` nhảy theo khối âm thanh → nhiễu vài–10 ms mỗi tiếng (ghi
  `ponytail:` tại chỗ). Trễ loa + trễ đàn + thói quen sớm/muộn gộp vào một số đo bằng tay — không tách được trễ đàn từ trình duyệt.
- **`Loop.stop()` không đối số xoá SẠCH trạng thái** (`ToneEvent.stop` → `cancel(-Infinity)`, đọc nguồn Tone 15.1.22) — nên tắt rồi
  bật lại máy đếm nhịp click đúng từ phách 0. Tôi đã ngờ nó im giữa chừng ở lượt sau; đọc nguồn thì không.
- **Thứ tự:** `startTimelineLoop` (đặt đồng hồ về 0, khởi động) TRƯỚC, `startMetronome` SAU — `startMetronome` đặt lại nhịp độ
  bằng nhịp đã lưu nếu không truyền `bpmOverride`, tức xoá 60 · 80 %.
- **Tập hai tay không còn tiếng nào để phát** → `startTimelineLoop` không chạy với danh sách rỗng; thêm mốc rỗng ở cuối bài.
- `midiInput`: `timeStamp` bằng 0, ở tương lai hay cũ hơn 1 giây → lấy `performance.now()`.
- Sửa kèm, có từ trước: `FallingNotes` trả `null` TRƯỚC các hook → danh sách chặng đổi rỗng ↔ có (đổi tay tập) là lệch thứ tự hook.
  Dời xuống sau hook; hành vi không đổi.

**Kiểm (1/10):** `timedScoring.test.ts` 14 test. Toàn suite **2 529 qua / 5 đỏ** (2 534 test, 173 file) — đúng 5 đỏ cũ. `tsc` app +
node sạch; `eslint` các file đổi sạch; `vite build` qua. Máy chủ dev tạm ở cổng 5199: POST `/__luyen-tap/luot` · `/do-tre` ghi
đúng cột, GET đọc lại, `TimedPractice.tsx` · `PracticeHome.tsx` biên dịch 200 — xoá file thử, tắt máy chủ.

**Chưa đo:** chưa ai chơi bằng đàn thật — độ trễ thật, nhiễu `currentTime` thật, ngưỡng đạt đều chờ `LuyenTap.json`; giao diện
`TimedPractice` không có test tự động (chỉ biên dịch); bài dài có dạo · giang · kết thì tập cả câu solo — GĐ 0 chưa cắt đoạn.

### Bậc 7 chấm theo hợp âm + bass + khung — người dùng chọn (b) (1/10/2026)

*"câu 3 chọn b"*: bậc cuối (tắt nốt rơi) nhận thế bấm khác miễn đúng nốt của hợp âm, đúng bass, đúng khung bùm – chát; bậc 1–6
vẫn đúng từng phím. Chấm bằng lớp cao độ (`scoreTimed` + `ignoreOctave` đã có), GĐ 1 thêm kiểm **nốt thấp nhất** quanh tiếng bass —
thiếu thì tay phải bấm La4 cũng thành "bass La". Bỏ nốt màu (Am thay Am9) tính là thiếu nốt. Chưa viết mã — thuộc GĐ 1
(`KE-HOACH-LUYEN-TAP.md` mục 4).

## Bước — Trễ khi nghe phím bấm: bỏ 100 ms lookAhead; đo trễ MIDI trong trình duyệt (2/10/2026)

Người dùng tập vài lượt Theo nhịp, thấy *"độ trễ âm thanh khi tôi đeo tai nghe galaxy bud 2 là quá lớn"*, nhờ đo trễ từ lúc bấm
phím MIDI tới lúc app nhận.

**Số đo — `LuyenTap.json` 2/10 (bài "test", 38 BPM = 60 % của 63):**
- Đo độ trễ: #2 −50 ms, dao động ±91 (n = 17) — trôi đều +220 → −170 ms, tay chưa bám click, bỏ · #3 **278 ms** ±49 (n = 15) ·
  #4 **251 ms** ±49 (n = 16).
- 7 lượt: trúng **0–2 / 20–43** nốt. Phím thừa nằm trong bài (0–7,2 phách), nốt trúng lệch −68 … +137 ms → phép quy phách KHÔNG
  hỏng. Nốt bấm khác nốt bài: tay trái điệu rải C2 G2 C3 D3 E3 móc kép, người dùng bấm C3 G3 B3 A3 … hay G2 A2 B2 C3.
- **Dòng `stt` 1 ở cả hai bảng là dòng thử của Claude 1/10 (bài "THU")** — tưởng đã xoá file thử, nó vẫn còn. Loại khỏi mọi phân
  tích; không sửa dòng sổ.

**Tìm trong mã:** `attackNote` / `releaseNote` (chỉ `useLiveSound` gọi) dùng `Tone.now()` = `currentTime + lookAhead`; lookAhead
mặc định Tone 15.1.22 = 0,1 s, app không chỉnh → **mọi phím bấm kêu muộn thêm 100 ms** trên mọi loa. Sửa: `Tone.immediate()`. Cũ:
`Tone.now()`. Lùi khi: tiếng phím bấm nứt, mất hay bị cắt lúc nhạc nền đang phát (Tone khuyên không trộn `now` / `immediate` cho
tiếng cần khớp nhau; phím bấm không xếp lịch cùng nhạc nền).

**Phép chấm không dính 100 ms ấy:** nhạc nền xếp đúng giờ đồng hồ âm thanh, phím bấm quy theo giờ ấy — nên 251–278 ms = trễ ra tai
nghe + trễ MIDI + thói quen tay. Chấm đúng nếu đo độ trễ bằng chính tai nghe đang dùng; đổi tai nghe không đo lại thì lệch cả lượt.

**Thêm đo:** `xuLyMs` = lúc app xử lý − `timeStamp` của sự kiện MIDI (trình duyệt nhận → app), từng phím; cột mới CUỐI bảng
(`luot`: `phim` = mọi phím [phách, nốt, lực] · `xuLyMs`; `doTre`: `xuLyMs`); tiêu đề file cũ cập nhật theo mã. Màn hình đo độ trễ
hiện trung vị. Đoạn phím → USB → Windows → trình duyệt: phần mềm không đo được.

**Nghiên cứu:** Pfordresher & Palmer 2002 (*Psychological Research* 66) — phản hồi thính giác trễ làm rối nhịp người chơi piano;
người chơi tự chọn chậm lại tới khoảng cách nốt ≈ 2 × độ trễ.

**Kiểm:** `tsc` app + node sạch, `eslint` sạch, 378 test `playback` + `shared` qua; máy chủ dev 5173 đã nạp cột mới (GET).

**Chưa đo:** phần Bluetooth riêng (cần một lần đo với tai nghe dây / loa để so với Buds) · `xuLyMs` thật · `Tone.immediate()` có
làm nứt tiếng không — chờ người dùng nghe. Chưa đẩy lên GitHub Pages.

## Bước — Nốt rơi dài theo độ ngân, tự thu phóng, có nốt láy · phím ghi tên · nút trái/phải đúng bên (2/10/2026)

Người dùng: *"Nếu nốt nào ngân dài thì hãy kéo dài hình nốt rơi trên app cho tương xứng"* · *"Các phím trên app cũng nên để tên
nốt"* · *"Nút tay trái để qua bên trái còn nút tay phải thì qua phải"* · *"Đối với các kỹ thuật đánh giật hay đánh nhanh thì tôi
yêu cầu các nốt rơi cũng phải thể hiện thật chính xác và khớp hình với tiếng"*.

**Nốt rơi (`FallingNotes`):** vẽ từ TIẾNG (`TimelineEvent`) của tay đang tập, không từ chặng — kể cả nốt láy (mờ, không ghi tên,
vẫn không chấm). Khối cao = độ ngân × px/phách − 2 px khe, tối thiểu 5 px; đáy chạm vạch đúng lúc tiếng vào, khối trôi qua vạch
suốt độ ngân. Thu phóng `pxPerBeatFor`: khoảng cách hai tiếng liền nhau ở bách phân vị 10 (bỏ nốt láy) được 18 px, kẹp 24–160
px/phách; khung cao 220 px. **Cũ:** khối cao cố định 20 px, 8 phách trên 180 px (22,5 px/phách) — móc kép cách nhau 5,6 px mà
khối cao 20 px nên chồng nhau; nốt láy không vẽ. Lùi khi: nhìn trước quá ít ở bài có câu chạy dày → hạ `MIN_SPACING_PX` hay nâng
`HEIGHT`.

**Phím sáng:** `notesSoundingAt` — từ lúc tiếng vào tới hết ngân, tắt sớm ≤ 0,05 phách để nốt lặp cùng phím còn nháy. **Cũ:**
`notesHittingAt` sáng 0,05 phách TRƯỚC tiếng tới 0,2 phách sau, bất kể độ ngân.

**Hình khớp tiếng:** mặc định bù lệch = lookAhead + `latencyMs` đã đo (nếu có). **Cũ:** lookAhead + `outputLatency` máy báo — với
Galaxy Buds 2 máy báo ~0 trong khi đo ra 251–278 ms, hình chạy trước tiếng cả phần tư giây. `setSyncOffsetMs(null)` = tự tính mỗi
lần đọc; khung Chờ đúng nốt đẩy `null` khi chưa dò tay (cũ: đẩy con số lúc mở khung, đo độ trễ xong vẫn dùng số cũ). Bù theo số đo
lẫn thói quen tay → hình có thể sớm vài chục ms; thanh trượt vẫn chỉnh được.

**Tên nốt trên phím (`OnScreenPiano`):** phím trắng rộng ≥ 20 px ghi đủ (D4), 9–20 px chỉ chữ cái (phím Đô vẫn kèm quãng tám), phím
đen rộng ≥ 13 px ghi (C#). Chữ phím trắng thường `text-ink/35` → `/55`. **Cũ:** chỉ phím Đô.

**Nút tay:** Tay trái · Hai tay · Tay phải ở Luyện đệm (cả hai chế độ), Tái hòa âm, Học hợp âm. **Cũ:** phải · trái · hai tay (Chờ
đúng nốt) · hai tay · trái · phải (Tái hòa âm) · trái · phải · hai tay (Học hợp âm, Theo nhịp).

**Kiểm:** 5 test mới (`notesSoundingAt` × 3, `pxPerBeatFor` × 2). Toàn suite **2 534 qua / 5 đỏ** (2 539) — đúng 5 đỏ cũ. `tsc`,
`eslint` sạch; `vite build` qua; máy chủ dev 5173 biên dịch 4 file đổi (200).

**Chưa đo:** chưa ai nhìn trên màn hình — độ phóng có vừa mắt, nốt láy mờ có rõ, tên phím đen có tràn (chưa thử trên điện thoại);
khối tối thiểu 5 px làm nốt cực ngắn trông dài hơn thật. Chưa đẩy lên GitHub Pages.

### Phím đang bấm đậm theo lực nhấn (2/10/2026)

Người dùng: đàn có cảm ứng lực, *"khi chạm nhẹ thì phím hiển thị mờ và rõ dần khi mạnh hơn"*. Lực nhấn vốn đã vào app
(`midiStore.velocities`, tiếng đàn đã theo lực qua `attackNote`) — chỉ bàn phím chưa vẽ theo.

`OnScreenPiano`: phím đang bấm phủ một lớp màu, độ mờ = 0,15 + 0,85 × velocity / 127 (tuyến tính; bàn phím ảo, phím máy tính bấm
lực 90 → 0,75). Màu lớp phủ giữ nghĩa cũ: xanh ngọc = trúng nốt hợp âm, cam = không; nền dưới vẫn là màu tay / gợi ý. Phím đen bấm
mạnh (lớp ≥ 0,5) thì chữ tên nốt đổi tối cho đọc được. **Cũ:** phím đang bấm tô màu đặc, không theo lực. Lùi khi: chạm nhẹ khó
thấy → nâng `PRESS_MIN_OPACITY` (0,15).

**Kiểm:** `tsc`, `eslint` sạch; 394 test `shared` + `playback` + `chordDrill` qua; máy chủ dev biên dịch 200.

**Chưa đo:** đường lực của Casio ("Touch Response" Light / Normal / Heavy đổi dải velocity gửi ra) — chưa biết chạm nhẹ của người
dùng ra velocity bao nhiêu; ánh xạ tuyến tính là đoán. Tắt cảm ứng lực trên đàn thì mọi cú bấm cùng một lực.

## Bước — Luyện đệm: khung rộng, bàn phím to, nút TOÀN MÀN HÌNH xoay ngang; số quãng tám mọi phím; lực nhấn đậm hơn (2/10/2026)

Người dùng: *"chạm nhẹ quá mờ, chạm mạnh cũng mờ"* · *"các phím C đã có đánh số, hãy cho các phím còn lại cũng đánh số"* · *"khung
phím đàn còn quá bé, có thể tăng diện tích hiển thị của cả tab Luyện đệm để tăng khung phím. Hãy làm cho khung phím nút fullscreen
để hiển thị full màn và xoay ngang. Làm cho cả phần android cũng có thể fullscreen"*.

- **Lực nhấn:** độ mờ lớp phủ = 0,45 + 0,55 × min(1, velocity / 96). **Cũ (cùng ngày):** 0,15 + 0,85 × velocity / 127. ĐOÁN —
  `LuyenTap.json` chưa có lượt nào ghi lực (cột `phim` thêm sau các lượt người dùng tập). Lùi khi: nhẹ với mạnh trông như nhau.
- **Số trên phím:** mọi phím tên kèm quãng tám. Phím trắng ≥ 20 px một dòng (D4), hẹp hơn chữ trên số dưới; phím đen ≥ 9 px chữ
  trên số dưới (C# / 4). Cỡ chữ theo bề ngang phím (trắng 8–14 px, đen 7–12 px). **Cũ:** phím trắng hẹp chỉ chữ cái, phím đen
  ≥ 13 px chỉ C#, chữ cố định 9 · 8 px.
- **Khung rộng:** tab Luyện đệm rộng tối đa 1800 px (`AppShell`), tab khác giữ 768 px. Bàn phím cao theo bề ngang phím trắng ×
  4,2, kẹp 110–240 px. **Cũ:** mọi tab 768 px, bàn phím 150 px.
- **Toàn màn hình (`PracticeStage`, dùng ở cả hai chế độ):** nút ⛶ góc khung nốt rơi → Fullscreen API trên khung nốt rơi + bàn phím
  + dòng hợp âm, rồi `screen.orientation.lock('landscape')` (Android chỉ cho khi đang toàn màn hình; máy tính từ chối — bỏ qua).
  Lúc toàn màn hình: thanh nút gọn ở trên (Chờ đúng nốt: Phát cả bài · Bắt đầu / tiến độ / Nghe chặng / Bỏ qua / Dừng; Theo nhịp:
  Bắt đầu / Dừng · kết quả lượt vừa chơi), nốt rơi lấp chỗ trống (`FallingNotes fill`, đo chiều cao thật bằng ResizeObserver),
  bàn phím 38 % chiều cao màn (112–320 px). Thoát toàn màn hình thì trả chiều xoay về tự do. PWA giữ `display: standalone`.

**Bẫy — khi chụp kiểm bằng Chrome chạy ngầm:** tab Tái hoà âm luôn được giữ ẩn trong cây (`hidden`), và nó cũng có một bàn phím
ảo — `querySelector` tìm "phím E4" bắt phải phím của bàn phím ẩn (khung 0 × 0, toạ độ 0,0). Lọc `getClientRects().length > 0`.

**Kiểm:** chụp bằng Chrome chạy ngầm qua giao thức DevTools (script trong thư mục nháp của phiên): máy tính 1600 × 1000 toàn màn
hình, điện thoại ngang 800 × 360 toàn màn hình, điện thoại dọc 390 × 844 — bố cục lọt, phím bấm (bàn phím ảo, lực 90) hiện cam
đậm, tên + số mọi phím. Toàn suite **2 534 qua / 5 đỏ** (đúng 5 đỏ cũ); `tsc`, `eslint` sạch; `vite build` qua.

**Chưa đo:** chưa thử trên điện thoại thật (khoá xoay ngang chỉ kiểm được trên Android thật); lực nhấn thật của đàn người dùng.
