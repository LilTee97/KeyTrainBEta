# Twist: số đo solo từ sheet Boogie Woogie

Ngày đối chiếu trực tiếp: 27/9/2026. Tài liệu nguồn để **soạn câu Blues mới riêng cho Twist** theo yêu cầu người dùng; đây không phải phê duyệt âm thanh hay yêu cầu chép nguyên solo.

## Nguồn và cách đọc

- File gốc: `D:\PianoBrain\video\Linh_Nhi\boogie woogie-Linh Nhi.mxl`; member MusicXML `score.xml`.
- SHA-256: `862e1a4b87a07579945ec360abce52cd3fd942f31c70bc8aa807c311f504100b`.
- Tiêu đề XML: **Boogie Woogie Basics**; credit in trong sheet: **Boogie Woogie Piano — Marco Brandt**. Tên file/thư mục là Linh Nhi; chưa xác minh vai trò tác giả/biểu diễn của Linh Nhi. Không ghi các câu này thành phong cách do Linh Nhi sáng tác.
- Nhịp 4/4; divisions=2; nốt đen=180; có chữ **Swing**. Không có swing ratio, tuplet, dynamics, pedal hoặc dữ liệu vận tốc riêng từng nốt. Tỷ lệ 2:1, gate, velocity và thời gian grace khi phát đều là quyết định diễn giải.
- Bảng dùng số ô trong XML, **gồm ô lấy đà 1**. Ô 1 chỉ dài **1,5 phách**, dù file không khai `implicit=yes`; không cộng nó thành 4 phách khi lập thời gian tuyệt đối.
- Bộ trích đọc tuần tự `backup`/`forward`; `<chord>` dùng onset của nốt trước và không tăng cursor; grace có duration=0; hai staff tách riêng. Không cộng trường độ các nốt trong một cụm.
- `onset/duration:[MIDI...]` tính bằng nốt đen, offset đầu ô=0. `R` là nghỉ; `g` là grace; `T+` bắt đầu tie, `T-` tiếp tục/kết tie, **không đánh lại**; `stacc` và `fermata` là dấu thật trong XML. Duration trong bảng là ký âm thẳng trước khi swing. MIDI60=C4.
- Bảng giữ nguyên các đoạn tie tách tại vạch ô; khi phát phải gộp theo pitch/staff trước hoặc sau khi warp thời gian nhất quán. Dấu luyến grace không phải tie. Ô17 có hai slur trùng trên cùng grace; chỉ có một grace attack.

## Bảng sự kiện đầy đủ cho dạo, lấy đà nối, solo và kết

| Ô XML | RH / staff1 | LH / staff2 |
|---|---|---|
| 1 | `0/0:[63]g; 0/0.5:[64]; 0.5/0.5:[67]; 1/0.5:[69]` | `0/1:R; 1/0.5:R` |
| 2 | `0/0.5:[64,67,69,72]; 0.5/0.5:[64,67,69,72]; 1/0.5:[64,67,69,72]; 1.5/0.5:[64,67,69,72]; 2/0.5:[64,67,69,72]; 2.5/0:[63]g; 2.5/0.5:[64]; 3/0.5:[67]; 3.5/0.5:[69]` | `0/0.5:[36,48]; 0.5/0.5:[36,48]; 1/0.5:[36,48]; 1.5/0.5:[36,48]; 2/0.5:[36,48]; 2.5/0.5:R; 3/1:R` |
| 3 | `0/0.5:[63,67,69,72]; 0.5/0.5:[63,67,69,72]; 1/0.5:[63,67,69,72]; 1.5/0.5:[63,67,69,72]; 2/0.5:[63,67,69,72]; 2.5/0:[63]g; 2.5/0.5:[64]; 3/0.5:[67]; 3.5/0.5:[69]` | `0/0.5:[29,41]; 0.5/0.5:[29,41]; 1/0.5:[29,41]; 1.5/0.5:[29,41]; 2/0.5:[29,41]; 2.5/0.5:R; 3/1:R` |
| 4 | `0/0.5:[64,67,72]; 0.5/0.5:[64,67,72]; 1/0.5:[64,67,70]; 1.5/0.5:[64,67,70]; 2/0.5:[65,69]; 2.5/0.5:[65,69]; 3/0.5:[65,68]; 3.5/0.5:[65,68]` | `0/1:[36,48]; 1/1:[40,52]; 2/1:[41,53]; 3/1:[42,54]` |
| 5 | `0/0.5:[62,65,67]; 0.5/0.5:[65]; 1/0.5:[66]; 1.5/0.5:[62,65,67,71] T+; 2/1:[62,65,67,71] T-; 3/1:R` | `0/0.5:[43,55]; 0.5/0.5:R; 1/0.5:R; 1.5/0.5:[31,43] T+; 2/1:[31,43] T-; 3/1:R` |
| 17 | `0/1:[64,67,69,72]; 1/1:R; 2/0.5:R; 2.5/0:[63]g; 2.5/0.5:[64]; 3/0.5:[67]; 3.5/0.5:[69]` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:R; 3/1:R` |
| 18 | `0/0.5:[64,67,69,72]; 0.5/0.5:[64,67,69,72]; 1/0.5:[64,67,69,72]; 1.5/0.5:[64,67,69,72]; 2/0.5:[64,67,69,72]; 2.5/0:[63]g; 2.5/0.5:[64]; 3/0.5:[67]; 3.5/0.5:[69]` | `0/0.5:[36,48]; 0.5/0.5:[36,48]; 1/0.5:[36,48]; 1.5/0.5:[36,48]; 2/0.5:[36,48]; 2.5/0.5:R; 3/1:R` |
| 19 | `0/0.5:[63,67,69,72]; 0.5/0.5:[63,67,69,72]; 1/0.5:[63,67,69,72]; 1.5/0.5:[63,67,69,72]; 2/0.5:[63,67,69,72]; 2.5/0:[63]g; 2.5/0.5:[64]; 3/0.5:[67]; 3.5/0.5:[69]` | `0/0.5:[29,41]; 0.5/0.5:[29,41]; 1/0.5:[29,41]; 1.5/0.5:[29,41]; 2/0.5:[29,41]; 2.5/0.5:R; 3/1:R` |
| 20 | `0/0.5:[64,67,72]; 0.5/0.5:[64,67,72]; 1/0.5:[64,67,70]; 1.5/0.5:[64,67,70]; 2/0.5:[65,69]; 2.5/0.5:[65,69]; 3/0.5:[65,68]; 3.5/0.5:[65,68]` | `0/1:[36,48]; 1/1:[40,52]; 2/1:[41,53]; 3/1:[42,54]` |
| 21 | `0/0.5:[62,65,67]; 0.5/0.5:[65]; 1/0.5:[66]; 1.5/0.5:[62,65,67,71] T+; 2/1:[62,65,67,71] T-; 3/1:R` | `0/0.5:[43,55]; 0.5/0.5:R; 1/0.5:R; 1.5/0.5:[31,43] T+; 2/1:[31,43] T-; 3/1:R` |
| 22 | `0/1:[67,72]; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 23 | `0/0.5:R; 0.5/0.5:[67,72]; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/0.5:R; 3.5/0.5:[67,72] T+` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 24 | `0/1:[67,72] T-; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 25 | `0/0.5:R; 0.5/0.5:[60]; 1/0.5:[64,67]; 1.5/0.5:[65,69]; 2/0:[63,66]g; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/0.5:R; 3.5/0.5:[67,72] T+` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 26 | `0/1:[67,72] T-; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[41]; 0.5/0.5:[41]; 1/0.5:[44]; 1.5/0.5:[45]; 2/0.5:[48]; 2.5/0.5:[41]; 3/0.5:[50]; 3.5/0.5:[48]` |
| 27 | `0/0.5:R; 0.5/0.5:[67,72]; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/0.5:R; 3.5/0.5:[67,72] T+` | `0/0.5:[41]; 0.5/0.5:[41]; 1/0.5:[44]; 1.5/0.5:[45]; 2/0.5:[48]; 2.5/0.5:[41]; 3/0.5:[50]; 3.5/0.5:[48]` |
| 28 | `0/1:[67,72] T-; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 29 | `0/0.5:R; 0.5/0.5:[60]; 1/0.5:[64,67]; 1.5/0.5:[65,69]; 2/0:[63,66]g; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/0.5:R; 3.5/0.5:[67,72] T+` | `0/0.5:[36]; 0.5/0.5:[36]; 1/0.5:[39]; 1.5/0.5:[40]; 2/0.5:[43]; 2.5/0.5:[36]; 3/0.5:[45]; 3.5/0.5:[43]` |
| 30 | `0/1:[67,72] T-; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[43]; 0.5/0.5:[43]; 1/0.5:[46]; 1.5/0.5:[47]; 2/0.5:[50]; 2.5/0.5:[43]; 3/0.5:[52]; 3.5/0.5:[50]` |
| 31 | `0/0.5:R; 0.5/0.5:[67,72]; 1/0.5:[65,69]; 1.5/0.5:[63,66]; 2/0.5:[64,67]; 2.5/0.5:[60]; 3/1:R` | `0/0.5:[41]; 0.5/0.5:[41]; 1/0.5:[44]; 1.5/0.5:[45]; 2/0.5:[48]; 2.5/0.5:[41]; 3/0.5:[50]; 3.5/0.5:[48]` |
| 32 | `0/0.5:R; 0.5/0.5:[72]; 1/1:[70]; 2/1:[69]; 3/1:[68]` | `0/0.5:[36]; 0.5/0.5:[40] T+; 1/1:[40] T-; 2/1:[41] stacc; 3/1:[42] stacc` |
| 33 | `0/0.5:[67]; 0.5/0.5:[65]; 1/0.5:[63]; 1.5/0.5:[60]; 2/1:R; 3/1:[52,55,58,62] T+` | `0/0.5:[43]; 0.5/0.5:[45]; 1/0.5:[47]; 1.5/0.5:[48]; 2/1:R; 3/1:[36,48] T+` |
| 34 | `0/4:[52,55,58,62] T- fermata` | `0/4:[36,48] T-` |

## Từ điển cao độ để đọc bảng

`29=F1, 31=G1, 36=C2, 39=Eb2, 40=E2, 41=F2, 42=F#2, 43=G2, 44=Ab2, 45=A2, 46=Bb2, 47=B2, 48=C3, 50=D3, 52=E3, 53=F3, 54=F#3, 55=G3, 58=Bb3, 60=C4, 62=D4, 63=Eb4, 64=E4, 65=F4, 66=Gb4/F#4, 67=G4, 68=Ab4/G#4, 69=A4, 70=Bb4, 71=B4, 72=C5`.

Cách viết trong file cần giữ khi dẫn nguồn: ô5/21 dùng **F#4**, motif22–31 dùng **Gb4**, ô4/20 dùng **Ab4**, ô32 dùng **G#4**. Các cặp tương ứng trùng MIDI nhưng không nên âm thầm gọi là cùng cách ký âm.

## Khung hòa âm và cách phối hợp hai tay

Sheet không có ký hiệu hợp âm; các tên dưới là phân tích từ nốt và bass.

- Ô6–17: `C C C C | F F | C C | G F | C C`, đủ 12 ô. Ô17 chuyển sang lấy đà từ 3&.
- Ô22–33: cùng khung 12 ô ở cấp chức năng; 22–31 là mười ô đầu `C C C C F F C C G F`, 32–33 thay hai ô cuối bằng câu kết có bass chuyển động. Không gán một hợp âm tĩnh C cho mọi nốt của hai ô kết.
- LH22–31 giữ cell tám móc đơn: root, root, b3, 3, 5, root, 6, 5; C=`36 36 39 40 43 36 45 43`; F=`41 41 44 45 48 41 50 48`; G=`43 43 46 47 50 43 52 50`. Không tie/nghỉ/grace trong LH mười ô này.
- RH6–16 là đệm chặn hai lần tại 1 và 3&, cùng LH root. Sang 22–31, **RH đảm nhiệm giai điệu bè đôi trên LH bass**; không chồng thêm hai hit RH đệm cũ vào mọi câu solo nếu muốn giữ tổ chức hai tay nguồn.
- RH solo bám vật liệu C xuyên đổi bass C/F/G. Chẳng hạn ô26 và30 vẫn kết motif tại C4 dù bass lần lượt F và G. Transpose cả câu theo từng root hoặc ép mọi attack thành chord tone sẽ thay đổi cách xây câu nguồn.

## Motif, nhịp câu và số đo RH ô22–31

Motif chính (MIDI): `[67,72] → [65,69] → [63,66] → [64,67] → [60]`, tức bè trên **C5–A4–Gb4–G4–C4**. Tính theo tâm C: **1–6–b5–5–1**; bè dưới đi **5–4–b3–3–1**. Chuyển `[Eb,Gb] → [E,G]` nâng cả đôi một nửa cung; đây là nét phân biệt, không chỉ là rải hợp âm.

| Ô | Vai trò / cách biến thể | Onset RH đánh mới, không tính grace và tie-stop | Kết/nghỉ |
|---|---|---|---|
| 22 | Trình bày motif | 0,1,1.5,2,2.5 | C4 tại3&, nghỉ phách4 |
| 23 | Dời đầu câu sang1&, nối pickup cuối | .5,1,1.5,2,2.5,3.5 | nghỉ1 và4 mỗi chỗ nửa phách; `[G,C]` tại4& nối24 |
| 24 | Motif có đầu ngân từ23 | 1,1.5,2,2.5 | không đánh lại đầu ô; nghỉ phách4 |
| 25 | Đảo hướng đầu motif + grace đôi | .5,1,1.5,2,2.5,3.5 | C→[E,G]→[F,A], grace[Eb,Gb]→[E,G]; pickup nối26 |
| 26 | Cùng motif trên bass F | 1,1.5,2,2.5 | đầu ô là tie-stop; nghỉ phách4 |
| 27 | Lặp nguyên hình23 trên bass F | .5,1,1.5,2,2.5,3.5 | pickup nối28 |
| 28 | Cùng motif về bass C | 1,1.5,2,2.5 | đầu ô là tie-stop; nghỉ phách4 |
| 29 | Lặp nguyên hình25 | .5,1,1.5,2,2.5,3.5 | grace đôi; pickup nối30 |
| 30 | Cùng motif trên bass G | 1,1.5,2,2.5 | đầu ô là tie-stop; nghỉ phách4 |
| 31 | Đầu lệch1&, bỏ pickup để chuẩn bị kết | .5,1,1.5,2,2.5 | nghỉ phách4; tổng nghỉ1,5 phách |

Số đo trực tiếp, đếm các cụm đồng thời thành một attack và không đếm tie-stop:

- **50 attack**: 38 bè đôi + 12 nốt đơn; **76%** attack là bè đôi. Có thêm **2 grace-dyads** ở ô25/29, gồm4 nốt grace. Không phải 54 attack: bốn đầu ô24/26/28/30 là nốt nối.
- Attack theo offset: `0:1; .5:5; 1:10; 1.5:10; 2:10; 2.5:10; 3.5:4`. Không có attack mới tại phách4 (offset3).
- **10,5/40 phách nghỉ RH =26,25%** theo ký âm. Khi swing2:1 thì khoảng nghỉ bắt đầu/đóng tại nửa phách cũng bị warp; không giữ tỷ lệ26,25% như số đo thời gian bản thu.
- Bốn pickup `[G4,C5]` nối qua ô: 23→24,25→26,27→28,29→30. Mỗi cặp dài **1,5 phách ký âm**; nếu swing2:1 thì onset4&→cuối phách1 ôsau dài4/3 phách, không reattack ở đầu ô.
- Âm vực RH C4–C5. Các pitch class có trong core: **C,Eb,E,F,Gb,G,A**. **Không có Bb trong RH22–31**. Bè trên chỉ C,Gb,G,A; Eb và E nằm ở bè dưới. Bb xuất ở dạo và kết, không nên quy số lần Bb cho đoạn solo core.
- Mật độ nốt ghi trên giấy: một attack đen tại đầu22, các attack khác móc đơn; bốn móc đơn cuối ô nối thêm một nốt đen ôsau. Không có chuỗi móc kép đều trong core.

Cách gọi “câu hỏi–đáp” là **diễn giải hình thức**: mẫu ổn định kết sớm và có khoảng thở, rồi biến thể lệch nhịp/pickup mở sang câu tiếp; không có nhãn question/answer trong file. Dữ liệu cho thấy lặp có biến thể rõ ràng, không phải mười ô vật liệu mới độc lập.

## Tâm C và root cục bộ: số đo quan hệ cao độ

Bảng là khoảng cách pitch class modulo12, không phải nhãn hợp âm in sẵn. Nó giải thích vì sao không thể lấy một câu rồi đổi root mỗi khi bass thay hợp âm mà vẫn gọi là nguyên lý nguồn.

| Cụm RH | Theo C | Theo F | Theo G |
|---|---|---|---|
| G–C | 7,0 | 2,7 | 0,5 |
| F–A | 5,9 | 0,4 | 10,2 |
| Eb–Gb | 3,6 | 10,1 | 8,11 |
| E–G | 4,7 | 11,2 | 9,0 |
| C | 0 | 7 | 5 |

Core có cả Eb→E và Gb→G cùng A tự nhiên. Vì vậy “Blues” trong yêu cầu nên được hiểu là hướng soạn nhạc, không thể mô tả toàn bộ sheet như chỉ dùng tập minor-blues `C Eb F Gb G Bb`. Dùng tập Blues làm vật liệu mới và thêm nốt đích/tiếp cận là quyết định sáng tác, phải tách khỏi số đo nguồn.

## Dạo và nối: ô1–5 /17–21

- Ô1 lấy đà1,5 phách: grace Eb4→E4 rồi G4,A4; LH nghỉ. Grace không có thời lượng được đo. Khi chuẩn hóa về ô4/4, có thể đặt ba móc ở3&,4,4& để dẫn vào ô2; đó là cách căn lại timeline, không phải thêm2,5 phách vào độ dài file.
- Ô2/18: hai tay đồng thời chặn5 móc đầu ô; RH C6 `[64,67,69,72]`, LH octave C. Từ3& LH nghỉ và RH trở lại grace Eb→E–G–A.
- Ô3/19: giữ hình tiết tấu, đổi LH octave F và RH `[63,67,69,72]` (F9 bỏ root); câu lấy đà vẫn E–G–A theo C.
- Ô4/20: RH bè trên C5,C5,Bb4,Bb4,A4,A4,Ab4,Ab4; LH octave C,E,F,F#. Đây là chuyển động ngược giữa bè trên giảm và bass tăng, không phải lặp cell bass core.
- Ô5/21: RH `[D,F,G]`, F, F#, rồi `[D,F,G,B]` ở2& nối qua phách3; LH octave G cùng hit1 và2&. Cả hai nghỉ phách4. Cụm2& dài1,5 phách ký âm, không đánh lại ở3.
- Ô17: hit C6 đầu ô, nghỉ RH1→2,5; LH chạy năm nốt đầu rồi nghỉ. RH lấy đà bắt đầu3& trước vạch kép sang18. Khi trích đoạn nối, cần nhận lấy đà17 là phần dẫn vào18.
- So sánh toàn bộ pitch/onset/duration/rest/tie cho cả hai staff xác nhận **2=18,3=19,4=20,5=21**.

## Câu kết chính xác: ô32–34

- Ô32 RH nghỉ móc đầu, C5 ở1&, Bb4 ở2, A4 ở3, **G#4** ở4. LH C2 móc đầu; E2 tại1& nối qua phách2; F2 phách3 và F#2 phách4 đều có **staccato** thật trong nguồn.
- Ô33 RH giảm `G4 F4 Eb4 C4` trên bốn móc đầu; LH tăng `G2 A2 B2 C3` cùng onset. Hai tay **cùng nghỉ phách3** (offset2→3).
- Phách4 ô33: RH `[E3,G3,Bb3,D4]`, LH `[C2,C3]`: tổng là C9, cùng đánh rồi nối suốt ô34. **Ô34 không có attack mới**. Tổng trường độ viết từ phách4 ô33 tới hết34 là5 phách, thêm fermata ở RH E3.
- Không mô tả đoạn này là cadence V–I đơn thuần: có chromatic walk-up LH, đường RH giảm, khoảng nghỉ chung rồi hợp âm tonicC9 ngân. Chức năng kết được suy từ cách dừng và trọng tâm C.

## Ranh giới khi soạn mới riêng Twist

Những đặc điểm có thể chuyển thành ràng buộc sáng tác: LH boogie ổn định; RH có bè đôi; câu có khoảng thở; lặp motif rồi đổi điểm bắt đầu/đuôi; blues approach b3→3 và b5→5; pickup có tie qua ô; kết giảm/bass tăng rồi nghỉ chung và ngân đích. Giữ vai trò **RH solo thay RH chặn đệm** trong đoạn không lời, LH tiếp tục đồng hành.

Các lựa chọn không được coi là số đo nguồn: tỷ lệ swing2:1; tốc độ grace; velocity/gate; biến thể mới; form/độ dài dạo–giang–kết trong app; chuyển sang giọng khác hoặc giọng thứ; ép/đổi target theo vòng hợp âm người dùng; tỷ lệ bè đôi và khoảng nghỉ dùng làm mục tiêu thống kê. Không cần sao chép nguyên câu C5–A4–Gb4–G4–C4 để giữ những nguyên tắc này.

Phạm vi thay đổi mong muốn: một đường soạn Blues **chỉ cho Twist**; giữ các điệu và các trạng thái âm nhạc đã duyệt ngoài Twist. Tài liệu này ghi nguồn và ranh suy luận, không chứng nhận đầu ra ngẫu hứng đã được nghe duyệt.

## Bản soạn trong KeyTrain — 27/9/2026

`src/reharm/style/twistSolo.ts`, gọi từ đầu `buildPhraseSection` riêng family `twist`.
Đây là bốn cặp motif mới có nhắc–đáp, chọn xác định theo lượt phát; không phải vô hạn câu ngẫu nhiên và không phải chép cả đoạn nguồn.

- **Dạo 4 ô:** hai ô gợi motif trên I/IV, bass dừng sau tiếng thứ năm để nhường đuôi RH có grace; ô ba RH giảm/LH tăng; ô bốn báo bằng át của hợp âm sắp hát, cả hai nghỉ phách4.
- **Giang 12 ô mỗi lượt:** `I I I I | IV IV | I I | V IV | I V/đích`. Major dùng I6, IV9, V7. RH giữ tâm giọng qua đổi bass, nhắc motif và phát triển ở hai ô V/IV. Bốn pickup nối qua đầu ô3/5/7/9, không gõ lại. Ô cuối là câu báo, thay vì câu đóng của nguồn. Nếu Thứ tự chơi đặt ×2 thì tổng giang là24 ô.
- **Kết 4 ô:** nhắc một motif, một ô RH giảm/LH tăng, bốn tiếng hai tay ngược chiều, nghỉ chung phách3; tonic9 ở phách4 ngân5 phách đến hết ô cuối. Fermata không đo được bằng giây nên bản app dùng độ dài cố định này.
- **Chuyển dụng giọng thứ:** i6–IV9–V7, thiên Dorian Blues; `2→b3` thay `b3→3`, vẫn giữ6 tự nhiên như cell bass Twist. Đây là quyết định phối mới, không phải dữ liệu giọng thứ lấy từ sheet.
- Swing2:1 warp cả đầu/cuối tiếng. Grace=.12 phách; lực nhấn/bass gate của câu mới là diễn giải. RH không chồng hai cú chặn của phần đệm hát lên giai điệu.
- Tonic lấy theo giọng đang nghe; khóa Giọng cộng Tone đúng một lần. Chuyển cả contour theo quãng tám trong tầm C4–C6, không gập từng nốt. Thiếu giọng/tầm không chứa được câu thì có thông báo.
- Solo dùng ô4 phách; tick `twistSinglePass` chỉ đổi đệm hát8↔4 phách/hợp âm. Tên hợp âm và độ dài hiển thị lấy từ câu thực sự phát. Các slash trên đoạn bass chạy là nhãn chuyển dụng theo nền tonic7; không nhận là ký hiệu in trong nguồn.
- App dùng bộ ráp đoạn hiện có `buildBossaSoloSong` (tên lịch sử); một bản soạn sở hữu cả hai tay. Có đủ dạo/giang/kết kể cả nhập vòng trơn. Bài có lời giữ thứ tự phần hát; chỉ bổ sung loại đoạn solo còn thiếu.

Kiểm hồi quy: `twistSolo.test.ts` kiểm12 giọng,4 lượt,3 loại đoạn, tính tái lập, nốt nối/khoảng nghỉ, không gõ đè phím đang ngân, cadence vào hợp âm thật, chuyển dụng thứ, cùng đường ráp cả bài và hai chế độ đệm8/4 phách. `twist.test.tsx` giữ kiểm lỗi hợp âm chuyển sớm. Kiểm thử kỹ thuật không thay cho nghe duyệt.
