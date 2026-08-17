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
- Nốt láy lấy **bậc liền kề trong gam**, không phải nửa cung cố định — tài liệu ghi "một bậc", mà trong gam thì bậc lúc là một cung lúc là nửa cung. Lấy cố định nửa cung sẽ sinh nốt ngoài giọng ở nửa số trường hợp.

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

Bộ hình mẫu cho đoạn giang tấu được **đọc ngược từ bản ký âm piano bài *Hồng Kông 1*** (`Reference/hongkong1.mxl`, bản advanced, bản chơi của anh Cà Pháo). Đây là lần đầu một tính năng sinh nhạc của KeyTrain có nguồn cụ thể thay vì chỉ dựa trên mô tả định tính, nên phần này đáng tin hơn hẳn các phần sinh câu trước đó.

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

Biến tấu theo lượt dựng xong rồi mà người dùng vẫn nghe lặp y nguyên. Nguyên nhân nằm ở tầng phát tiếng chứ không ở bộ sinh: `startTimelineLoop` dùng `Tone.Part` với `loop = true`, mà `Part` lặp thì **phát lại đúng bộ sự kiện cũ**. Bộ sinh có tài mấy cũng vô nghĩa nếu chỉ được gọi một lần.

Sửa bằng cách bỏ vòng lặp sẵn của `Part`, thay bằng `Tone.Loop` **dựng lại lịch phát ở đầu mỗi lượt** và truyền số lượt cho bên gọi. `startTimelineLoop` vì vậy nhận `hits` **hoặc** một hàm `(pass) => hits`.

Kéo theo: `buildSongTimeline` nhận thêm `takeOffset` và trả về `soloTakes` (đã tiêu hết bao nhiêu lượt). Lần phát thứ hai bắt đầu từ đúng chỗ lần thứ nhất dừng, nên không quay về câu cũ.

Bài học: khi một tính năng "đã làm rồi mà không thấy tác dụng", kiểm tầng **phát lại** trước khi nghi ngờ tầng sinh.

### Vòng ii-V-I và nốt dẫn hướng

Tài liệu 12 giọng (nay đã gỡ) nói vòng ii-V-I là *"nền tảng quan trọng nhất để luyện lick jazz"*. Thứ làm nên sức hút của nó là **nốt dẫn hướng**: bậc bảy thứ của hợp âm át nằm ngay trên bậc ba của chủ âm đúng một nửa cung, buông xuống là giải quyết.

Thêm mẫu `guide-tone`, chỉ dùng khi hợp âm sau cách một **quãng bốn đi lên**. Ở đây hai tài liệu nói khác nhau và phải chọn: `pianoimprovnotes.md` mục 4 khuyên kết câu ở nốt ổn định, còn đúng chỗ V về I thì cái tai chờ **sự giải quyết**. Chọn theo vòng V về I, vì nốt ổn định ở đó nghe như câu nhạc đứt ngang. Hợp âm ba không có bậc bảy thì không có nốt dẫn hướng, tự lùi về nốt ổn định.

Phần còn lại của tài liệu — vòng quãng bốn và cách chia buổi tập qua 12 giọng — **chưa dùng**; nó thuộc về một bài luyện dịch giọng, không thuộc bộ sinh giang tấu. Tài liệu cũng ghi rõ các lick cụ thể trong nguồn tham khảo **có bản quyền**, nên KeyTrain tự sinh câu chứ không chép.

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

Bài học lặp lại lần thứ hai trong phiên này: viết xong một bộ sinh thì phải **in kết quả ra đọc**, đừng tin test cấu trúc. Lần trước nó lộ ra câu nhạc kẹt ở đáy tầm; lần này nó lộ ra nửa vốn từ vựng không bao giờ chạy.

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
