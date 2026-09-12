# Cà Pháo: màu, voicing, giang tấu và outro Bossa cải tiến

Ngày 12/9/2026. Nối tiếp `CA-PHAO-HOA-AM-VOICING-INTRO-BOSSA-2026-09-12.md`.
Intro đã được người dùng duyệt; hai câu mới dưới đây CHƯA được duyệt bằng tai.

## Nút Cà Pháo thực hiện gì

- Không còn bảng đổi mọi hợp âm thứ thành m9 và mọi át thành 9. Giữ v thứ khác V7; G→C có thể thành G7, nhưng G không đi về C không tự bị ép thành át.
- Bossa thứ: triad i→m9, iv→m11. Ballad thứ giữ thiên hướng m7. Trưởng: I/IV→maj7, hợp âm thứ→m7; hợp âm trưởng có chức năng át→7. Chức năng át phụ suy từ hợp âm kế tiếp, không phải nghe giai điệu hát.
- Giữ màu đã ghi rõ trong đầu vào và bass đảo. Đây là lựa chọn dựa trên ngữ cảnh hợp âm, KHÔNG phải bảo đảm tension phù hợp mọi nốt hát: KT chưa có giai điệu hát đầu vào để kiểm điều đó.
- Cùng đầu vào/ngữ cảnh thì bấm lại cho cùng kết quả; nút màu không bốc hợp âm ngẫu nhiên mỗi lần.
- Voicing đi qua `voicingStyle: ca-phao` tới bộ phát. RH giữ hình bấm, chọn quãng tám gần thế trước; LH giữ bass. Renderer không được cắt mất nốt màu chỉ vì cell chát cũ ghi hai/ba nốt.
- Vốn nốt hợp âm đầy đủ được giữ riêng (`harmonicNotes`): RH bỏ bậc 5 không có nghĩa bass mất bậc 5. Test Dm11 ở tiếng bass phách 3 phải là A.
- Một số thế là rút gọn/biên soạn của KT, không phải mọi thế đều chép nguyên văn: m9 = b7–9–b3–5 (Người hãy quên ô 9: C–E–F–A/D); m11 = b7–9–b3–11 (ô 43 có C–E–G/D, KT thêm b3); maj9 = 7–9–3 (Có em chờ ô 1: G–Bb–C/Ab); 7b13 = b7–3–b13 (Người hãy quên ô 97: G–C#–F/A). Những màu chưa có mẫu riêng vẫn dùng voicing chung.

## Nguồn và những chỗ KT chủ động thay đổi

Nguồn chính: `D:/PianoBrain/video/Ca_Phao/nguoihayquenemdi.mxl`. Số ô tính theo XML. Đọc bằng `scripts/audit_ca_phao.py`, đối chiếu riêng bass, chùm RH, onset, tie và gate. Không chỉ tin nhãn hợp âm XML: ô 9 ghi D9add#11 nhưng cụm C–E–F–A/D thể hiện Dm9; G# bass tiếp cận A không chứng minh D Lydian.

Giang lấy cửa sổ liên tục 45–48: Dm9, Em7b5, Am, Dm11, Em7b5, A11. Ô 47 có bước liền/chromatic và vươn lên, ô 48 thu về vùng át. KT phát triển thành hai câu bốn ô, chuyển v của ô 46 sang V7 để làm đáp căng–giải; đây là thay đổi có chủ ý, không được gọi là nguyên bản Cà Pháo.

Outro lấy nguyên cửa sổ 96–101: Dm11 → Eb9/A7b13 → Dm → vùng C11/E–A7 → Dmaj9 → kết D trưởng. Hai ô 100–101 THỰC SỰ kết trưởng (có F#). Theo yêu cầu outro thứ, KT giữ hướng thu câu/ngân kết nhưng chuyển hai ô cuối về i thứ. Vùng ô 99 được KT biên soạn thành iiø–V, không khẳng định XML ghi đúng iiø. File có 101 ô, không lấy phần 102–104 không tồn tại dù nhãn corpus cũ ghi rộng hơn.

## Hai câu đã triển khai

Giang 32 phách / 8 ô, ở Am:

`Am9 | Bm7b5 E7 | Am11 | Bm7b5 E7 | Am9 | Bm7b5 E7 | Am11 | ii–V của hợp âm sắp hát`.

Hai câu có mô-típ gọi–đáp, rải cụm cùng họ hợp âm, chạy móc kép vừa/dài, tiếp cận chromatic 4–#4–5 ngắn rồi giải. Ô cuối nhường RH từ phách 31 đến 32, bass dẫn ở 31.5 về đích thật. Nếu lặp hai vòng: vòng đầu hút về chủ âm để lặp, vòng cuối mới hút về hợp âm đầu đoạn hát (ví dụ Dm → Em7b5–A7). Không ghép ô riêng lẻ từ nhiều thầy.

Outro 24 phách / 6 ô, ở Am:

`Am11 | Bb9 E7b13 | Am9 | Bm7b5 E7 | Am9 | Am`.

UI hiện có thể viết Bb thành A# theo bộ đặt tên chung. Cụm 3–b7–9 của bII nối sang b7–3–b13 của V, rồi giải về i. Mật độ giảm ở gần kết, ô cuối LH chủ âm + RH 5–1–b3 ngân đủ bốn phách; không thêm bass chromatic hút sang một ô không tồn tại.

Mỗi loại có bốn biến thể có chủ ý (đổi hướng đáp, chỗ vào và câu chạy). Đây là vòng biên soạn hữu hạn, KHÔNG phải bộ học tự động vô hạn. Vòng hợp âm hiện cố định theo nguồn, trừ đích ii–V; không tuyên bố mỗi lượt đổi toàn bộ vòng.

## Kỹ thuật học từ sheet trưởng và thứ

Sheet trưởng như Có em chờ có rải upper-structure cùng họ hợp âm và lặp/phát triển mô-típ; Hongkong 1 có chuyển vùng âm. Sheet thứ Người hãy quên có m9/m11, chromatic tiếp cận, chùm hợp âm nghịch phách, câu chạy rồi thu về át. KT dùng các nguyên lý cụm hợp âm, rải, nhắc–đáp, bước liền/chromatic và khoảng nghỉ phù hợp tầm tay. Không nhập tiết tấu Ballad của các bài trưởng vào Bossa, không mặc định mọi run là ngũ cung hoặc gán mode cả bài chỉ từ một nốt ngoài giọng. Chưa mô phỏng mọi kỹ thuật (ví dụ run leo nhiều quãng tám) trong tầm solo hiện tại.

Giữ cell 8 phách CP cải tiến đã duyệt; onset và gate độc lập. Bass/cú chát LH vẫn có nhịp, RH đệm chỉ xuất hiện khi toàn trường độ nằm trong khe giai điệu. Các đoạn mới không chạy qua chuỗi sửa nốt/gập từng ô của bộ solo cũ. Intro dùng nguyên hàm đã duyệt và voicing cũ của chính intro, không áp các template mới lên nó.

## Tích hợp, kiểm chứng và giới hạn

- Nút màu Cà Pháo chọn cả thầy solo, điệu Bossa CP cải tiến vẫn do người dùng chọn. Main app mở đủ intro/interlude/outro thứ; thêm các bước còn thiếu, không nhân đôi bước đã có. Bộ ráp báo vòng giang cuối để hút đúng đích.
- Bài kiểm tra trên Chrome: Để Nhớ Một Thời Ta Đã Yêu, chọn Bossa CP cải tiến và Cà Pháo. Thứ tự có intro, phiên, điệp, giang ×2, điệp, outro. Không lưu đè bài gốc.
- Trang `http://localhost:5173/tools/bossa-intro.html` dùng chính `buildPhraseSection` và audio engine thật; chọn riêng intro/giang/outro, giọng và bản 1–4. Không ghi vào bài đã lưu.
- Test giang/outro: 12 chủ âm ×4 bản, độ dài, cuối thứ, nghỉ RH trước hát, câu chạy, không va nửa cung cùng vùng giữa hai tay; test ráp hai vòng + phần hát + outro ngân hết. Test intro cũ vẫn qua. Đây là kiểm kỹ thuật, không phải bằng chứng câu nghe hay.
- Build production thành công. Toàn bộ suite: 2587 qua, 6 lỗi cũ còn lại ở phraseAcrossBar, daoTruongLinhNhi, handSplitAudit, sietHopAm, tuyenSolo (2). Không sửa ngưỡng để làm xanh suite.
- Tầm quá hẹp không chứa cả nét câu thì báo không soạn được, không gập từng nốt để cố phát. Trần 84 cho phép kiểm mọi giọng; Am cũng cần được kiểm với trần 79 của app.
- Sau vòng này chờ người dùng nghe giang/outro: phân biệt phản hồi về tiết tấu, vòng hợp âm và giai điệu. Chưa tự chạy vòng cải tiến thứ hai. Chỉ ghi Sổ tay khi người dùng yêu cầu.
