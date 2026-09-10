# Bàn giao Codex → Claude — KeyTrain solo composer — 9/9/2026

## Prompt mở session mới

> Tiếp tục dự án KeyTrain tại `D:\KeyTrain`, branch `thuoc-cham-cau-solo`. Đọc lần lượt
> `AGENTS.md`, `Reference/KE-HOACH.md`, `Reference/SO-TAY.md`,
> `D:\PianoBrain\knowledge\LUAT-SOAN-NOT.md`,
> `D:\PianoBrain\knowledge\teachers\tuan-luu-piano.md` và file bàn giao này. Giữ nguyên
> các thay đổi chưa commit; không reset/checkout đè. Mục tiêu là phát triển bộ soạn intro,
> giang tấu và outro tự tạo câu nhạc hay cho mọi điệu: giữ khung tiết tấu/kỹ thuật của điệu
> đích, học vòng theo bậc và đường nét giai điệu từ đúng một nguồn thầy/điệu/đoạn, chuyển
> theo chủ âm bài, giữ màu trưởng/thứ, không ghép ô chắp vá. Một vòng train chỉ dùng một
> thầy + một điệu + một loại đoạn, sau đó dừng để người dùng nghe. Xem #550 là benchmark
> intro thứ Đã ổn, không sao chép cứng và không tự nhận là machine learning.

## Trạng thái workspace

- Repo: `D:\KeyTrain`
- Branch: `thuoc-cham-cau-solo` (đang ahead remote 19 commit tại lúc bàn giao).
- Có thay đổi code và test **chưa commit**. Không xoá chúng.
- `Nguon.json` là dữ liệu phản hồi nghe tại máy, đang được gitignore; phải đọc trực tiếp,
  không giả định nó đã nằm trong commit.
- Dev server `http://localhost:5173` trả HTTP 200 ở lần kiểm cuối.

Các file code đang thay đổi:

- `src/reharm/ReharmHome.tsx`
- `src/reharm/fillSoloGenerator/lineBuilder.ts`
- `src/reharm/fillSoloGenerator/soloFeel.ts`
- `src/reharm/style/minorSoloSource.ts` (mới)
- `src/reharm/style/giaiDieuDaoLinhNhi.ts`
- `src/reharm/style/vonHopAmLinhNhi.ts`
- `src/reharm/style/phraseSection.ts`
- `src/reharm/style/phraseScale.ts`
- các test liên quan trong cùng thư mục.

## Những gì đã làm được

### 1. Intro thứ Bolero Tuấn

- `minorSoloSource.ts` chọn một nguồn duy nhất theo take và luân phiên Linh Nhi/Cà Pháo/
  Tôn Hùng; một intro không đổi nguồn theo ô.
- Vòng hợp âm lấy hợp âm chính theo từng ô nguồn, chuyển theo bậc sang giọng bài, mở i và
  kết V.
- Giai điệu lấy đúng một sheet source và chuyển pitch tương đối theo tonic.
- `phraseSection.ts` dùng cùng nguồn với vòng: ô 1 melody, ô 2 luôn Pùng-Pắp; không trộn
  Pùng-Pắp và câu chạy trong cùng ô.
- Mốc #550, La thứ, đã được đánh dấu **Đã ổn**:
  `Am–Dm–Am–Dm–Am–Dm–Am–E`, nguồn Cà Pháo *Người Hãy Quên Em Đi* ở Rê thứ. Chỉ lấy vòng/
  contour; timing và đệm vẫn là Bolero Tuấn.

Đừng viết rằng #550 học từ solo Tuấn: file thầy Tuấn có **0 sheet solo**. Đây là luật app
ghép khung đệm Tuấn với bằng chứng solo của thầy khác.

### 2. Nền cho mọi điệu

- `buildLine` nhận `feel`, đưa rhythm track học từ sheet qua accent/pulse của style đích
  trước khi dựng pitch.
- Bài mới mặc định bật tuyến solo; bài đã lưu chỉ tắt nếu người dùng từng tắt rõ ràng.
- Mặc định một gam nhất quán cho mọi style hợp lệ; người dùng vẫn có thể chọn nhiều gam
  khi hoà thanh jazz đổi nhanh.
- Sửa ánh xạ feel: reggae/funk/salsa không còn bị phát như Bossa chỉ vì cùng nhãn
  `syncopated-3-3-2`; Bossa/Samba mới dùng timing Bossa, các style khác theo `cell` riêng.
- Test đã mở cho pop, rock, swing, waltz, reggae, salsa, tango và flamenco.

Điều chưa được phép kết luận: chưa có corpus đủ đúng điệu cho swing/waltz/reggae/tango,
nên mới chứng minh engine chạy và giữ pulse khác nhau, chưa chứng minh solo “đúng thầy,
đúng điệu” về thẩm mỹ.

## Luật kiến trúc phải giữ

### Hai lớp

1. **Khung điệu đích:** time signature, bar length, swing/straight, accent/pulse, left-hand
   pattern và kỹ thuật đàn của style đang chọn.
2. **Ngữ pháp câu nguồn:** chord degree, melodic interval/contour, motif, density, rest,
   tension–release và landing.

Sheet nguồn dạy lớp 2; `cell` hiện tại giữ lớp 1. Không bê nguyên onset của điệu nguồn sang
điệu đích.

### Nhất quán nguồn

- Một phrase/section = một teacher + một source style + một source song + đúng loại
  intro/interlude/outro.
- Không vá ô từ nhiều thầy. Take khác có thể đổi nguồn.
- Giang học giang, outro học outro; không dùng intro thay nếu chưa có bằng chứng nghe.

### Chuyển giọng và hoà thanh

- Mã hoá root hợp âm thành bậc so với tonic nguồn, giữ quality/function, dựng lại trên
  tonic/gam đích.
- Mã hoá pitch class thành offset so với tonic nguồn.
- Điều chỉnh register bằng cách dời cả phrase/cell ±12, không fold từng nốt.
- Không làm mất `V7`, `iv`, `♭VI`, `♭VII` khi chuyển.

### Cổng trưởng/thứ

- Trưởng: Ionian/major pentatonic, chord-tone landing ở trọng âm nhưng không triad hoá mọi
  nốt.
- Thứ: Aeolian/minor pentatonic, giữ ♭6/♭7; raised 7 chỉ có chức năng dominant/leading
  tone. ♭VI/♭VII major là màu thứ hợp lệ.
- Phạt rải trưởng lặp, bậc sáng vô cớ, bước nhảy rộng tiếp tục cùng chiều, lặp máy và câu
  không có chỗ thở.

## Dữ liệu phản hồi phải đọc đúng

`Nguon.json` có hai bảng `cau` và `binhLuan`; bình luận nối bằng `binhLuan.cauStt`.

- #544: Đã ổn.
- #546: Chưa ổn — đúng màu/nhịp nhưng sơ sài, thiếu độ phong phú/câu chạy.
- #550: Đã ổn.
- #552: **Chưa ổn** — bình luận nói đúng tinh thần tự soạn, nhịp và màu thứ nhưng chưa
  hay bằng các thầy.

Không được đổi lời bình #552 thành nhãn Đã ổn. Bài học là “hợp lệ” chưa đồng nghĩa “hay”.
Khi train, ghép câu Đã ổn/Chưa ổn gần nhau về style, key và progression, rồi tìm khác biệt
ở motif, contour, rests, density, leap recovery và tension resolution. Không tối ưu chỉ theo
một mẫu #550.

## Kiểm thử đã chạy

- Nhóm test intro thứ: **132/132 đạt**.
- Nhóm test tuyến/feel đa điệu: **120/120 đạt**.
- Build đạt.
- Full suite: **2488 đạt / 6 hỏng**. Sáu lỗi đã biết:
  1. `phraseAcrossBar`: long-breath 47,4% < 50%.
  2. `daoTruong`: tâm Linh Nhi 71,3 thay vì 75,3.
  3. `handSplitAudit`: bar 3 thiếu chromatic semitone.
  4. `sietHopAm`: major outro tightening chưa cải thiện.
  5. `tuyenSolo`: Cà Pháo major center 72,6 so với 70,8.
  6. `tuyenSolo`: Cà Pháo minor center 74,0 so với 68,0, vừa quá ngưỡng.

Không hạ ngưỡng chỉ để xanh. Ưu tiên lỗi nghe được trước.

## Hướng làm tiếp

1. Giữ #550 làm benchmark; nghe thêm 3–5 intro thứ mới và lưu đầy đủ nhận xét.
2. Viết bộ trích xuất đánh giá từ `Nguon.json`, nhóm theo thầy/điệu/giọng/loại đoạn, ghép
   Đã ổn với Chưa ổn có điều kiện gần nhau.
3. Chỉ thêm quality scorer nếu dữ liệu cho thấy các luật hiện có không đủ; xếp hạng nhiều
   candidate, không sửa timing sau khi sinh đến mức phá khung điệu.
4. Bổ sung corpus đúng điệu cho swing/waltz/reggae/tango trước khi tuyên bố xác thực.
5. Mở phương pháp nguồn nhất quán sang giang tấu rồi outro, từng loại một. Mỗi vòng một
   thầy + một điệu, dừng để nghe.
6. Sửa sáu audit còn đỏ bằng bằng chứng, không chồng heuristic tuỳ tiện.
7. Sau mỗi bước lớn: cập nhật `SO-TAY.md`, `LUAT-SOAN-NOT.md`, file thầy liên quan; commit
   khi người dùng yêu cầu hoặc khi bước lớn được chốt theo quy ước repo.

## Tài liệu vừa cập nhật

- `D:\KeyTrain\Reference\SO-TAY.md`
- `D:\PianoBrain\knowledge\LUAT-SOAN-NOT.md`
- `D:\PianoBrain\knowledge\teachers\tuan-luu-piano.md`

Ba file này là nguồn chi tiết; file bàn giao chỉ giúp session mới vào đúng hướng.
