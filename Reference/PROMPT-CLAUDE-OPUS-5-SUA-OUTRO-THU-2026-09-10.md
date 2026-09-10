# Prompt cho Claude Opus 5 — sửa kiến trúc outro thứ Bolero

Ngày 10/9/2026. Dùng cho repo `D:\KeyTrain`, branch `thuoc-cham-cau-solo`.

## Vai trò và quyền ưu tiên

Hãy làm công việc này với tư duy của Codex trong bản chẩn đoán mới nhất: kiểm tra đường chạy
thật từ UI đến MIDI, bác bỏ giả định bằng mã và dữ liệu, sửa nguyên nhân gốc, và không dùng
test thống kê để thay thế tai nghe của người dùng.

Yêu cầu mới nhất của người dùng trong file này **cao hơn** nhận định cũ trong Sổ tay, bàn
giao và comment mã. Những câu cũ như “người dùng muốn chép nguyên ô” không còn được dùng để
chặn mục tiêu hiện tại. Mục tiêu đã chốt là: KT tự soạn câu nhạc hay dựa trên điều đã học từ
sheet, không sao chép nguyên bài và không ghép chắp vá từng ô.

Không tự nhận mình là Codex và không bảo đảm kết quả sẽ hay trước khi người dùng nghe. Hãy
áp dụng đúng phương pháp dưới đây.

## Nhiệm vụ duy nhất của vòng này

Sửa **outro giọng thứ, điệu Bolero Tuấn**. Không sửa intro, interlude, giọng trưởng hay điệu
khác trong vòng này, trừ một helper dùng chung bắt buộc phải sửa ở gốc và có test chống hồi
quy cho các caller liên quan.

Một vòng train này chỉ dùng:

    teacher = linh-nhi
    genre   = bolero
    section = outro
    mode    = minor

Lý do: Tuấn hiện có 0 sheet solo; trong corpus outro thứ, chỉ Linh Nhi có đúng điệu Bolero.
Cà Pháo đang có Bossa/Ballad; Tôn Hùng đang có Ballad; Linh Nhi còn có Slow Rock. Không được
đưa các nguồn sai điệu ấy vào vòng Bolero này.

## Đọc trước khi sửa

Đọc đầy đủ:

1. `D:\KeyTrain\AGENTS.md`
2. `D:\KeyTrain\Reference\HOC-TU-BAN-GIAO-CODEX.md`
3. `D:\KeyTrain\Reference\BAN-GIAO-CODEX-SANG-CLAUDE-2026-09-09.md`
4. `D:\KeyTrain\Reference\SO-TAY.md`, các mục từ 9–10/9 về intro/outro thứ
5. `D:\PianoBrain\knowledge\LUAT-SOAN-NOT.md`, Luật 14
6. `D:\PianoBrain\knowledge\teachers\tuan-luu-piano.md`
7. Toàn bộ JSON thỏa đúng bốn điều kiện Linh Nhi + Bolero + outro + thứ trong
   `D:\PianoBrain\data\sheet-solos\`
8. Các caller thật của `buildPhraseSection`, `giaiDieuDaoLinhNhi`,
   `minorSoloSourceForTake`, `vonHopAmLinhNhi` và `datChaySheet`.

Trước khi sửa, ghi ngắn gọn đường chạy thật của nút phát outro trên bài
*Để Nhớ Một Thời Ta Đã Yêu*. Không suy từ tên hàm hay comment.

Workspace đang có nhiều thay đổi chưa commit. Không reset, checkout, stash, xóa hoặc ghi đè
thay đổi hiện có. Không commit nếu người dùng chưa yêu cầu.

## Chín sửa chữa bắt buộc

### 1. Lọc đúng corpus

Thay bộ chọn chỉ lọc `teacher/section/minor` bằng bộ chọn có đủ:

    teacher + genre + section + mode

Vòng này chỉ nhận `linh-nhi + bolero + outro + minor`. Nếu không có nguồn phù hợp, trả về
trạng thái không có candidate; không âm thầm rơi sang thầy, điệu hay loại đoạn khác.

Không sửa tay `tuyenSolo.ts` nếu đó là file sinh. Nếu cần thêm metadata hoặc index, sửa bộ
sinh `tools/tuyen_o.py` rồi tái sinh và kiểm tra.

### 2. Giữ câu nguồn ở cấp toàn đoạn

“Một nguồn” không chỉ có nghĩa là cùng `source.id`. Phải giữ **trật tự thời gian và đường
cung toàn câu** của nguồn.

Được phép:

- dùng cả đoạn nguồn;
- dùng một cửa sổ liên tiếp của đoạn nguồn;
- co giãn cấu trúc ở ranh giới phrase đã đo được.

Không được chọn độc lập ô tốt nhất cho từng hợp âm rồi tạo thứ tự như `1 → 6 → 2 → 5`.
Không dùng bộ xếp hạng từng ô hiện tại cho nhánh này. Motif, lấy đà, cao trào, khoảng nghỉ và
cadence phải còn nhận ra ở cấp toàn đoạn.

### 3. Chuyển hòa âm theo chức năng

Mã hóa vòng nguồn thành bậc so với chủ âm nguồn, giữ nguyên chất và chức năng (`i`, `iv`,
`V7`, `♭VI`, `♭VII`…), rồi dựng trên chủ âm bài đích.

Không dùng “gốc gần nhất theo bán cung” làm thay thế. `ganNhat()` không phải phép tương
đương chức năng. Nếu vốn hợp âm bài không chứa chức năng cần thiết, hãy bỏ candidate/source
đó trong vòng này. Không vá bằng một hợp âm nghe gần nhưng làm đổi hướng hòa thanh.

Hợp âm và giai điệu phải lấy từ cùng source và cùng vị trí cấu trúc. Một chromatic note chỉ
được giữ khi hợp âm đích còn tạo đúng chỗ dựa hoặc nó là nốt căng có lời giải rõ.

### 4. Tách contour khỏi onset nguồn

Không dùng trực tiếp `source.at` làm `startBeat` ở điệu đích.

Trước tiên rút onset nguồn thành vai trò:

- downbeat;
- offbeat;
- pickup;
- syncopation;
- held landing;
- rest/breath.

Sau đó đặt các vai trò lên pulse/accent hợp lệ của **cell Bolero Tuấn**. Tìm và tái dùng
helper feel/pulse hiện có trước khi viết helper mới. Giữ contour và quan hệ mật độ của câu;
không bê timing Bossa, Ballad hoặc Slow Rock vào Bolero.

### 5. Dựng cú pháp outro riêng

Không mở nguyên khối `daoTuan` dành cho intro sang outro. Outro cần cấu trúc kết bài riêng:

    xác lập → phát triển → căng/nâng → cadence → khoảng trống/cú kết

Pùng-Pắp là khung đệm Bolero, không phải lý do thay nguyên ô giai điệu bằng bố cục A/B của
intro. Không dùng quy tắc “ô 1 melody, ô 2 Pùng-Pắp” của intro làm luật outro.

Không ép mọi outro phải tăng đúng `+8,2` hoặc giảm đúng `−3,4`: đó là số gộp nhiều thầy và
nhiều điệu. Chỉ rút luật từ tập Linh Nhi + Bolero của vòng này; cỡ mẫu nhỏ thì ghi là quan
sát, không biến thành hằng số cứng.

### 6. Khóa mọi vật liệu theo đúng `source.id`

Thân câu, câu chạy, hợp âm, cadence và mọi fragment phải cùng source đã chọn. Trong
`datChaySheet`, lọc theo `source.id`, không chỉ theo `source.thay`.

Nếu source không có run phù hợp thì không tự mượn run của bài khác và không bịa pentatonic
run. Có thể giữ chỗ đó thưa; khoảng nghỉ đúng còn tốt hơn một câu chạy không cùng cú pháp.

### 7. Bỏ chuỗi hậu xử lý phá câu

Nhánh mới không được đồng thời:

- xóa nốt bằng `thuaTayPhai`;
- nâng nửa câu bằng `dangCuoi`;
- chèn run ngoài câu;
- đổi nốt cuối bằng `dapChot`;
- gập từng nốt về tầm.

Ưu tiên chọn hoặc chuyển một câu nguồn phù hợp ngay từ đầu. Chỉ cho phép hai biến đổi sau
trong vòng đầu:

1. chuyển chủ âm/chức năng;
2. dời **toàn phrase** ±12 để vừa tầm.

Nếu cả phrase không vừa tầm, loại candidate. Không cứu một candidate xấu bằng nhiều lớp
heuristic. Nốt cuối và cadence lấy từ source phù hợp; không đổi một nốt của voicing mà vẫn
giữ nhãn hợp âm cũ.

### 8. Thêm test kiểm đúng nguyên nhân

Test mới tối thiểu phải thất bại trên mã cũ và kiểm được:

1. mọi source của vòng này là `linh-nhi + bolero + outro + minor`;
2. các ô/phrase nguồn giữ đúng thứ tự liên tiếp;
3. không event nào đến từ source khác;
4. onset đầu ra nằm trên pulse hợp lệ của Bolero Tuấn;
5. chuyển Dm → Am giữ đúng bậc và chất hợp âm;
6. nốt căng trên trọng âm hoặc được hợp âm đỡ, hoặc giải liền bậc có kiểm chứng;
7. không có per-note octave folding;
8. cùng input/take cho kết quả tất định; take khác chỉ đổi sang source/cửa sổ hợp lệ.

Giữ `ketThuTuan.test.ts` như bàn đo phụ, nhưng không dùng số ô/cao độ/mật độ để tuyên bố
nhạc đã hay. Test cấu trúc xanh chỉ chứng minh không phá luật.

### 9. Một vòng nhỏ rồi dừng cho người dùng nghe

Sau khi test và build đạt:

- khởi động/giữ server ở `http://localhost:5173`;
- mở bài *Để Nhớ Một Thời Ta Đã Yêu*;
- tạo tối đa ba outro, mỗi outro khóa một source/cửa sổ hợp lệ;
- chỉ rõ mỗi câu dùng source nào;
- dừng lại để người dùng nghe và bình luận.

Không tự chạy vòng train thứ hai, không chuyển sang giang tấu, không sửa tiếp vì một chỉ số
chưa đẹp. Nếu người dùng nói Chưa ổn, tách phản hồi thành: tiết tấu, hòa âm, giai điệu và
chỉ sửa đúng mặt được chỉ ra.

## Những cách làm cũ phải bỏ ở nhánh này

- Không coi “cùng thầy” là “cùng nguồn”.
- Không trộn genre để tăng cỡ mẫu.
- Không ghép câu theo ô độc lập.
- Không bê onset sheet thẳng vào Bolero Tuấn.
- Không dùng `ganNhat()` để thay chức năng hòa thanh.
- Không dùng toàn bộ bố cục intro A/B cho outro.
- Không thêm một heuristic mới cho mỗi triệu chứng nghe.
- Không hạ ngưỡng test và không viết test chỉ lặp lại implementation.
- Không nói “đã xong” trước lượt nghe của người dùng.

## Bằng chứng lỗi hiện tại cần tái lập

Trước khi sửa, xác nhận bằng mã:

- `minorSoloSourceForTake` chưa lọc genre;
- `giaiDieuDaoLinhNhi` chọn từng ô độc lập và phát trực tiếp `n.at`;
- `datChaySheet` lọc cùng thầy thay vì cùng `source.id`;
- `daoTuan` đang mở nguyên khối intro cho outro;
- `vonHopAmLinhNhi` dùng `ganNhat()` khi thiếu bậc;
- outro đang qua `thuaTayPhai → dangCuoi → dapChot`;
- `ketThuTuan` hiện còn đỏ ở mật độ nhánh mặc định và không kiểm phô/motif/source.

Nếu một phát hiện không còn đúng vì workspace đã đổi, báo bằng dòng mã hiện tại và điều
chỉnh kế hoạch; không sửa một lỗi đã biến mất.

## Tiêu chuẩn bàn giao lại

Khi dừng cho người dùng nghe, báo ngắn gọn:

1. nguyên nhân gốc đã bỏ;
2. source chính xác của từng outro;
3. file đã đổi;
4. test mới chứng minh tám bất biến nào;
5. test/build đã chạy và lỗi còn lại;
6. đường dẫn localhost để nghe.

Chưa cập nhật Sổ tay thành “đã học được” trước khi người dùng đánh dấu Đã ổn. Sau khi được
duyệt mới ghi kiến thức đã xác nhận và mới cân nhắc commit.
