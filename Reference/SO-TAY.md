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
