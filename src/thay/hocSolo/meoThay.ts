import type { ThayChay } from './cauThay'

/*
  MẸO & QUY TẮC THEO TỪNG THẦY — người dùng 11/10/2026: "Mục Mẹo và quy tắc thì bạn hãy phân tích theo từng thầy, sau đó làm mẹo riêng để
  học cách soạn nốt của từng thầy".

  Không đo mới. Mọi số chép từ md đã chốt — Cà Pháo: `PianoBrain/knowledge/teachers/ca-phao.md` (mục 2, 4, 5b); Linh Nhi:
  `linh-nhi-piano.md` (Luật soạn nốt, mục 4, 5, 6, 6b, 7, 13c); Blues: `PianoBrain/knowledge/BLUES-CHON-HOP-AM-VA-NOT.md` (mục 3, 4, 7) —
  cùng cỡ mẫu md ghi. Chỉ so hai thầy ở chỗ md ghi là đo cùng một cách. Thử đo lại ba thầy cùng một cách trên vốn ô của game (11/10) thì
  bỏ: bảng ô gộp chất hợp âm về ba nhãn (mất maj7 · m7) và giữ đuôi nốt nối thành cú riêng — Cà Pháo ra 46 % nốt hợp âm so với 70,8 %
  của md, sai vì cách lấy dữ liệu chứ không vì thầy.
  Lời "chân dung" và "mẹo" là lời gia sư của Claude viết trên số đo ấy; "(Claude suy)" đánh dấu chỗ không có số đo đứng sau.
*/

export interface MucThay {
  ten: string
  cau: string
  coSo: string
}

export interface PhanTichThay {
  id: ThayChay
  ten: string
  nguon: string
  chanDung: string
  soDo: readonly { muc: string; so: string }[]
  quyTac: readonly MucThay[]
  meo: readonly MucThay[]
}

export const PHAN_TICH_THAY: readonly PhanTichThay[] = [
  {
    id: 'ca-phao',
    ten: 'Cà Pháo',
    nguon:
      'md Cà Pháo: 4 bài chia đoạn (3 ballad · 1 bossa nova; 3 trưởng · 1 thứ) — 828 nốt giai điệu ở dạo · giang · kết (mục 2, 4, 5b). Kết cấu tay phải đo trên 20 đoạn · 7 sheet ballad (26/9/2026). Cú hai nốt đo cùng cách với Linh Nhi và Blues (3/10/2026).',
    chanDung:
      'Nghe anh Cà Pháo solo như nghe một người kể chuyện giọng trầm ấm. Câu nằm thấp, quanh Sol giữa đàn. Trên hợp âm trưởng anh hay đặt nốt 9 và 13 — nghe sang và mơ màng như nhạc phim. Thỉnh thoảng anh chen một nốt "xanh" (blue) ngoài gam, như một tiếng thở dài. Giữa bài (giang tấu) anh chạy dày nhất; cuối bài thì buông: thưa, thấp, bấm cụm nốt cho lắng.',
    soDo: [
      { muc: 'Nốt của hợp âm đang vang', so: '70,8 % (n=828) — Linh Nhi 63,6 % (n=1045), đo cùng cách' },
      { muc: 'Nốt ngoài gam', so: '4,7 % — nhiều nhất ba thầy (Linh Nhi 1,8 %, Tôn Hùng 1,0 %); 38 nốt dồn vào ♭7 ×10 · ♭5 ×9 · ♭9 ×7 · ♭3 ×7 — nốt blue' },
      { muc: 'Trên hợp âm trưởng', so: '3: 20 % · 5: 19 % · 9: 15 % · 7: 12 % · 1: 12 % · 13: 10 % · 11: 5 % (n=422)' },
      { muc: 'Trên hợp âm thứ', so: '♭3: 20 % · 5: 19 % · ♭7: 19 % · 11: 13 % · 1: 8 % · 9: 8 % (n=282)' },
      { muc: 'Trên hợp âm át', so: '5: 21 % · 3: 17 % · 11: 12 % · ♭7: 11 % · ♭13: 9 % (n=66 — mẫu mỏng)' },
      { muc: 'Bước đi', so: 'lặp nốt 5 % · liền bậc 31 % · nhảy từ 3 nửa cung trở lên 65 % (n=828)' },
      { muc: 'Sau một nốt ngoài hợp âm', so: '58,3 % về ngay nốt hợp âm (n=276); nốt ngoài gam có bước liền bậc cả hai bên chỉ 36,8 %' },
      { muc: 'Tầm tay phải', so: 'tâm Sol 4 (MIDI 67, gộp 828 nốt); riêng đoạn dạo: trưởng 70,8 · thứ 68,0 — thấp hơn Linh Nhi 4,5 (trưởng) · 5,2 (thứ) nửa cung' },
      { muc: 'Bài trưởng so với bài thứ', so: 'tâm 70,0 so với 66,3; trần trung bình 94 so với 85 — nét riêng của anh (Linh Nhi gần như không đổi)' },
      { muc: 'Độ dày tay phải theo đoạn', so: 'tay phải: giang tấu dày nhất ở 3/4 bài (8,7 · 10,4 · 8,2 nốt/ô so với dạo 5,7 · 8,8 · 6,2); đoạn kết: tay trái thưa hơn hoặc bằng đoạn dạo và tâm thấp hơn đoạn dạo, 4/4 bài' },
      { muc: 'Kết cấu tay phải (ballad, 20 đoạn · 7 sheet)', so: 'dặm cụm ≥ 3 nốt: dạo 14 % · giang 10 % · kết 34 %; nốt trong câu chạy: 17 % · 45 % · 23 %; phách có nhịp lệch (chấm dôi + móc kép, móc kép lệch): 32 % · 44 % · 49 %' },
      { muc: 'Cú hai nốt', so: 'quãng 4–5 38 % · quãng 3–6 31 % (Blues quãng 3–6 51 %, đo cùng cách)' },
    ],
    quyTac: [
      {
        ten: 'Hợp âm trưởng: tô 9 và 13, tránh 11',
        cau: 'Một phần tư số nốt trên hợp âm trưởng là 9 và 13. Bậc 11 — nốt đứng sát trên bậc 3 — anh gần như tránh.',
        coSo: '9: 15 % + 13: 10 % so với 11: 5 % (n=422). Linh Nhi 9: 11 % · 13: 6 %.',
      },
      {
        ten: 'Hợp âm thứ: đi lên ♭7 và 11',
        cau: 'Anh chơi hợp âm thứ như m7, m11: ngoài ♭3 và 5, hai nốt hay dùng nhất là ♭7 và 11.',
        coSo: '♭7: 19 % · 11: 13 % (n=282) — 11 cao nhất ba thầy, khớp vốn hợp âm Dm11 · Gm11 của anh (md mục 3).',
      },
      {
        ten: 'Hợp âm át: lướt ♭13',
        cau: 'Trên hợp âm 7 anh thả ♭13 — màu căng (altered) muốn về nhà.',
        coSo: '♭13: 9 % trên hợp âm át (n=66 — mẫu mỏng); Linh Nhi 5 %.',
      },
      {
        ten: 'Nốt ngoài gam là nốt blue, vào bằng bước nhảy',
        cau: 'Anh dám ra ngoài gam, chủ yếu bằng các nốt blue — và không chỉ dùng chúng làm nốt lướt: gần hai phần ba vào hay ra bằng một bước nhảy.',
        coSo: '4,7 % ngoài gam (n=828): ♭7 ×10 · ♭5 ×9 · ♭9 ×7 · ♭3 ×7; liền bậc cả hai bên 36,8 %.',
      },
      {
        ten: 'Rời hợp âm rồi về ngay',
        cau: 'Nốt ngoài hợp âm thường được trả về một nốt hợp âm ngay ở nốt kế tiếp.',
        coSo: '58,3 % (n=276 nốt ngoài hợp âm).',
      },
      {
        ten: 'Nhảy nhiều hơn đi liền',
        cau: 'Hai phần ba số bước của anh từ quãng ba thứ trở lên — câu có nhiều góc cạnh, ít bò từng bậc.',
        coSo: 'nhảy ≥ 3 nửa cung 65 % · liền bậc 31 % · lặp 5 % (n=828).',
      },
      {
        ten: 'Giang tấu chạy, đoạn kết dặm và buông',
        cau: 'Giữa bài là chỗ anh chạy nốt nhiều nhất; cuối bài anh bấm cụm nốt, thưa và thấp dần.',
        coSo: 'ballad 20 đoạn · 7 sheet: nốt trong câu chạy ở giang 45 %, dặm ở kết 34 %; dày nhất ở giang 3/4 bài; kết thấp hơn dạo 4/4 bài.',
      },
      {
        ten: 'Tầm thấp, bài trưởng thì nâng lên',
        cau: 'Câu nằm quanh Sol 4. Bài trưởng anh đẩy tầm lên cho sáng, bài thứ giữ thấp — anh làm sáng bằng TẦM chứ không đổi nốt.',
        coSo: 'tâm 67 (n=828); bài trưởng 70,0 · trần 94, bài thứ 66,3 · trần 85 (md mục 4).',
      },
    ],
    meo: [
      {
        ten: 'Thay Đô – Mi – Sol bằng Rê và La',
        cau: 'Trên hợp âm C, thử đặt Rê (9) hay La (13) ở phách mạnh rồi đi về Mi hoặc Sol. Nghe sang hẳn — đó là "màu Cà Pháo".',
        coSo: '9 + 13 = 25 % số nốt trên hợp âm trưởng (n=422).',
      },
      {
        ten: 'Hợp âm thứ: bốn nốt, thêm Rê',
        cau: 'Trên Am đừng dừng ở ba nốt La – Đô – Mi: Sol (♭7) và Rê (11) cho câu buồn mà mềm.',
        coSo: '♭7: 19 % · 11: 13 % (n=282).',
      },
      {
        ten: 'Muốn sáng thì lên cao',
        cau: 'Bài giọng trưởng, cho câu đứng quanh La 4 – Si♭4 và vươn hẳn lên cao (trần trung bình Si♭6); bài giọng thứ giữ quanh Fa♯4 – Sol 4, trần thấp hơn chín nửa cung.',
        coSo: 'tâm bài trưởng 70,0 so với bài thứ 66,3; trần 94 so với 85 (md mục 4).',
      },
      {
        ten: 'Giữa bài thì chạy, cuối bài thì dặm',
        cau: 'Giang tấu: chạy móc kép liền tay. Đoạn kết: bấm cụm 3–4 nốt, ngân cho lắng, thấp dần.',
        coSo: 'câu chạy ở giang 45 % · dặm ở kết 34 % (20 đoạn ballad).',
      },
      {
        ten: 'Nhịp lệch cho câu có nhún',
        cau: 'Dùng hình chấm dôi rồi móc kép ("Đô – o – o Rê"), và móc kép lệch phách: câu nghe nhún nhảy chứ không đều như máy. Đây là chỗ BẤM lệch phách — khác "đánh giật" (giật ngón, nhấc ngón ngay); giật ngón của anh chưa đo.',
        coSo: 'phách có nhịp lệch 32–49 % tùy đoạn (20 đoạn · 7 sheet ballad).',
      },
      {
        ten: 'Một nốt blue như tiếng thở dài',
        cau: 'Thỉnh thoảng chen Mi♭ (♭3) hay Si♭ (♭7) của giọng Đô: nhảy vào, rồi rơi ngay về một nốt hợp âm.',
        coSo: 'ngoài gam 4,7 % (n=828); 58,3 % nốt ngoài hợp âm về nốt hợp âm ngay sau (n=276).',
      },
      {
        ten: 'Muốn dày thì bè quãng 4 – 5',
        cau: 'Chồng hai nốt cách quãng 4 hay quãng 5 (Rê + Sol, Mi + La) — tiếng jazz-pop của anh.',
        coSo: 'quãng 4–5 = 38 % cú hai nốt (đo cùng cách với Linh Nhi và Blues).',
      },
      {
        ten: 'Trên G7, lướt Mi♭ trước khi về',
        cau: 'Trước khi về C, thả Mi♭ (♭13 của G7) rồi xuống Rê — tiếng căng muốn về nhà.',
        coSo: '♭13: 9 % trên hợp âm át (n=66 — mẫu mỏng, thử bằng tai).',
      },
    ],
  },
  {
    id: 'linh-nhi',
    ten: 'Linh Nhi',
    nguon:
      'md Linh Nhi: 7 bản ký âm bolero · slow rock — 1045 nốt giai điệu ở các đoạn solo; câu dạo 354 nốt · 347 bước (mục Luật soạn nốt); tách trưởng 406 · thứ 601 nốt (mục 6b); 8 bài · 23 đoạn solo (mục 13c).',
    chanDung:
      'Chị Linh Nhi hát bằng tay phải. Câu đi từng bước nhỏ, đứng yên trên một nốt rồi mới bước — như người hát bolero ngân chữ. Chị neo tai vào giọng bài chứ không chạy theo từng hợp âm. Bài trưởng chị bám chặt nốt hợp âm nên nghe chắc, tươi; bài thứ chị rời hợp âm, nhảy và lặp nốt nên nghe man mác. Chị ít chạy ngón — muốn câu đầy thì nhân quãng tám chứ không chạy.',
    soDo: [
      { muc: 'Nốt của hợp âm đang vang', so: '63,6 % (n=1045) — lỏng nhất ba thầy; bài trưởng 70,2 % (n=406), bài thứ 59,9 % (n=601)' },
      { muc: 'Chọn nốt hợp âm hơn mức tình cờ (bội số)', so: 'đoạn dạo 1,561 — Cà Pháo 1,299 (đo cùng cách; hợp âm của anh dày hơn nên tỉ lệ thô của anh cao hơn)' },
      { muc: 'Nốt trong gam bài', so: '98,2 % (câu dạo 99,0 %); ngoài gam 1,8 % (n=1045)' },
      { muc: 'Bước đi (câu dạo)', so: 'lặp 10,7 % · liền bậc 33,7 % · quãng ba 24,5 % · quãng 4–5 12,1 % · từ 8 nửa cung 19,0 % — phần lớn là đổi quãng tám (n=347 bước)' },
      { muc: 'Trên hợp âm trưởng', so: 'bài trưởng — 1: 28 % · 3: 26 % · 5: 21 % — ba trụ 75 % (n=155); bài thứ: trụ 53 %, thêm 9 · 13 (n=150)' },
      { muc: 'Trên hợp âm thứ', so: 'bài trưởng: trụ 67 % (n=207); bài thứ — 5: 21 % · 1: 19 % · ♭3: 14 % · 9: 13 % · ♭7: 11 % — trụ 54 % (n=355)' },
      { muc: 'Trưởng khác thứ', so: 'giọng trưởng dùng 13 (12–16 %), gần như bỏ ♭3 và 11; giọng thứ dùng ♭3 (14–19 %) và 11 (9–11 %), lặp nốt gấp ba (14–17 % so với 5–8 %)' },
      { muc: 'Hướng câu', so: 'đi xuống chiếm ưu thế ở dạo 5/7 · giang 4/6 · kết 1/6 đoạn' },
      { muc: 'Giang tấu nhắc câu dạo', so: '78 % tuyến nốt neo trùng (n=6 bài); đoạn kết chỉ ~43 %' },
      { muc: 'Đoạn kết', so: '1 + 5 gộp: thứ 51 % · trưởng 47 % (dạo 40 % · 36 %); lặp + liền bậc giảm (trưởng 48 % → 34 %)' },
      { muc: 'Tầm tay phải', so: 'tâm đoạn dạo trưởng 75,3 · thứ 73,2 (MIDI) — cao hơn Cà Pháo 4,5 · 5,2 nửa cung' },
      { muc: 'Kỹ thuật tay phải (8 bài · 23 đoạn)', so: 'nốt đơn 68–75 %; slow rock: quãng tám 45 % cú hai nốt; bolero thứ: quãng 4–5 33 %; chuỗi chạy ≥ 4 nốt chỉ 0,20–0,23 mỗi ô' },
      { muc: 'Hai tay ở solo giọng thứ', so: 'tay phải 5,0 → 6,5 mốc/ô, tay trái 6,5 → 4,6 — hai tay đảo vai' },
    ],
    quyTac: [
      {
        ten: 'Neo vào giọng bài, không vào hợp âm đang vang',
        cau: 'Chị chọn nốt theo gam của bài, không đổi theo từng hợp âm — hợp âm Gm mà chị vẫn đánh Si♭ – La của Rê thứ.',
        coSo: '98,2 % nốt trong gam (n=1045); ví dụ Đừng Xa ô 5 (md mục 7).',
      },
      {
        ten: 'Bước nhỏ, đứng yên rồi mới bước',
        cau: 'Gần một nửa số bước là lặp nốt hay liền bậc; bước xa phần lớn chỉ là đổi quãng tám.',
        coSo: 'lặp + liền bậc 44 %, không quá quãng ba 69 % (n=347 bước câu dạo).',
      },
      {
        ten: 'Dạo và giang đi xuống, kết thì không',
        cau: 'Câu dạo và giang tấu mở cao rồi đi xuống; đoạn kết đứng lại quanh chủ âm.',
        coSo: 'đoạn đi xuống: dạo 5/7 · giang 4/6 · kết 1/6.',
      },
      {
        ten: 'Giang tấu nhắc lại câu dạo',
        cau: 'Giang tấu thường là câu dạo thêm một ô mở ở đầu.',
        coSo: '78 % tuyến nốt neo (n=6 bài); 3 bài trên 89 %.',
      },
      {
        ten: 'Bài trưởng bám trụ, bài thứ rời trụ',
        cau: 'Đứng trên cùng một hợp âm: bài trưởng gần như chỉ ba nốt trụ; bài thứ rải sang 9, ♭7, 13.',
        coSo: 'trụ 75 % (n=155) so với 53–54 % (n=150, 355).',
      },
      {
        ten: 'Giọng trưởng tô 13; giọng thứ dùng ♭3 · ♭7 · 11 và lặp nốt',
        cau: 'Đây là chỗ chọn nốt thật sự khác giữa hai giọng — không do gam ép.',
        coSo: '13: 12–16 % giọng trưởng; 11: 9–11 % giọng thứ — giọng trưởng 3 % ở đoạn kết, không lọt sáu bậc đầu ở dạo và giang; lặp 14–17 % so với 5–8 % (md mục 6).',
      },
      {
        ten: 'Đoạn kết là câu khác, co về chủ âm',
        cau: 'Kết nhảy nhiều hơn, đi liền ít hơn, và dồn về 1 và 5.',
        coSo: '1 + 5: 51 % · 47 %; trùng tuyến với đoạn dạo ~43 % (md mục 5–6).',
      },
      {
        ten: 'Nốt cảm trên V ở giọng thứ',
        cau: 'Trên V7 của giọng thứ chị dùng bậc 7 thăng (Sol♯ trong La thứ), thường sau ii°.',
        coSo: '12 nốt ở dạo · 12 ở giang (8 bài, md mục 13c); ii° → V7 ở 4/5 bài thứ.',
      },
      {
        ten: 'Ít chạy, dày bằng quãng tám',
        cau: 'Chuỗi chạy rất hiếm; muốn đầy thì nhân giai điệu ở quãng tám (slow rock) hay quãng 4–5 (bolero thứ).',
        coSo: 'chuỗi ≥ 4 nốt 0,20–0,23/ô; quãng tám 45 % cú hai nốt slow rock; quãng 4–5 33 % bolero thứ.',
      },
    ],
    meo: [
      {
        ten: 'Hát trong đầu rồi mới đánh',
        cau: 'Ngân nga câu bằng miệng trước: bước từng bậc, đứng yên trên một nốt 2–3 lần rồi mới bước. Tay chỉ chép lại câu hát ấy.',
        coSo: '44 % lặp hoặc liền bậc (n=347 bước).',
      },
      {
        ten: 'Đi xuống như thở ra',
        cau: 'Mở câu dạo hay giang ở nốt cao rồi đi dần xuống; đến đoạn kết thì cho câu đứng lại.',
        coSo: 'dạo 5/7 · giang 4/6 đi xuống; kết 1/6.',
      },
      {
        ten: 'Bài trưởng: ba trụ + La',
        cau: 'Trên C gần như chỉ Đô – Mi – Sol, thêm La (13) cho ngọt. Đừng rắc nốt lạ — chắc chắn chính là "tươi sáng".',
        coSo: 'ba trụ 75 % (n=155); 13 = 12–16 %. Cách đọc "tươi sáng = chắc chắn" người dùng đã xác nhận (md mục 6b).',
      },
      {
        ten: 'Bài thứ: rời trụ cho câu man mác',
        cau: 'Trên Am thêm Si (9), Sol (♭7), Rê (11), và lặp một nốt vài lần.',
        coSo: 'trụ 54 % (n=355); lặp 14–17 %.',
      },
      {
        ten: 'Giữ tai ở chủ âm',
        cau: 'Đổi hợp âm mà nốt vẫn trong gam bài. Trên hợp âm át, đánh thẳng chủ âm của bài cũng được.',
        coSo: '98,2 % trong gam; trên hợp âm át chủ âm (đọc ra bậc 11) 27 %, 25/25 nốt là chủ âm (n=93).',
      },
      {
        ten: 'Giang tấu = câu dạo + một ô mở',
        cau: 'Soạn giang tấu khỏi nghĩ câu mới: lấy câu dạo, thêm một ô mở đầu.',
        coSo: '78 % tuyến nốt neo (n=6 bài).',
      },
      {
        ten: 'Kết về Đô hay Sol',
        cau: 'Đoạn kết dừng ở chủ âm hoặc bậc 5 của bài.',
        coSo: '1 + 5 = 51 % (thứ) · 47 % (trưởng) ở đoạn kết.',
      },
      {
        ten: 'Sol♯ trên E7 (La thứ)',
        cau: 'Trước khi về Am, đi Bdim → E7 và đánh Sol♯ — nốt cảm kéo về La.',
        coSo: '12 + 12 nốt cảm (md mục 13c); ii° → V7 ở 4/5 bài.',
      },
      {
        ten: 'Dày bằng quãng tám, đừng chạy',
        cau: 'Muốn câu đầy, nhân đôi giai điệu ở quãng tám (slow rock) hay quãng 4–5 (bolero thứ) thay vì chạy ngón.',
        coSo: 'quãng tám 45 % cú hai nốt slow rock; bolero thứ quãng 4–5 33 %; chuỗi chạy ≥ 4 nốt ~0,2 mỗi ô.',
      },
    ],
  },
  {
    id: 'blues',
    ten: 'Blues',
    nguon:
      'Tài liệu Blues (PianoBrain BLUES-CHON-HOP-AM-VA-NOT.md): ba sheet — Rockhouse của Ray Charles (Sol trưởng, 810 nốt), Robert (Đô trưởng, 330), The House of the Rising Sun (Mi thứ, 170 nốt — một bài, mẫu nhỏ); tiết tấu đệm từ video thầy Đức Thịnh. Mục 7 đo ba sheet cùng một cách.',
    chanDung:
      'Blues là hỏi – đáp. Tay trái "bùm" ở phách 1, "chát" ở phách 4; tay phải chen câu ngắn vào chỗ trống, như người hát đáp lại cây đàn. Nốt lấy từ MỘT rổ nốt của chủ âm — ngũ cung cộng nốt blue — dùng suốt vòng. Nốt blue không bao giờ đứng yên: nó trượt nửa cung về nốt gần, như tiếng rên.',
    soDo: [
      { muc: 'Rổ nốt của chủ âm', so: '81 % nốt câu lick thuộc ngũ cung trưởng của chủ (Rockhouse, n=503); ♭3: 6 % · 4: 4 % · ♭7: 3 % · ♭5: 1 %' },
      { muc: 'Phách 1 · 4 là nốt hợp âm', so: '(1 · 3/♭3 · 5 · ♭7) Rockhouse 73 % (n=304) · Rising Sun 77 % (n=26) · Robert 69 % (n=164)' },
      { muc: 'Bậc ba blue trên IV', so: '3 trưởng của chủ 3 lần, ♭3 31 lần (Rockhouse, 199 nốt); Robert 0 / 25' },
      { muc: 'Nốt blue đi đâu', so: '♭3 → 2: 29 % · 3: 26 % · 1: 20 % (n=35); ♭7 → 5: 62 % (n=26); giọng thứ ♭5 → 5: 77 % (n=13)' },
      { muc: 'Dáng câu', so: 'đỉnh nằm ở phần đầu câu: 58 % · 60 % · 68 % (ba sheet, câu ≥ 4 cú)' },
      { muc: 'Câu vào', so: 'Ray vào câu ở phách 3 · phách 6 (ngay trước phách 4 và phách 1) 47 %' },
      { muc: 'Câu chạy (Rockhouse, 45 câu)', so: 'ngắn 4–6 nốt 34/45; đi xuống 19 · lên 10 · quanh 16; đáp đúng phách 1 / 4 20/45; chạy thẳng vào hợp âm mới 21/45' },
      { muc: 'Kết câu', so: '1: 34 % · 5: 17 % · ♭3: 14 % · 3: 12 % (Rockhouse, n=118)' },
      { muc: 'Mật độ tay phải', so: 'cú mỗi ô 6/8: Rockhouse 4 · Robert 3 · Rising Sun 9; câu chạy Rising Sun 7,8 nốt/giây' },
      { muc: 'Kết cấu của Ray (212 nửa ô)', so: 'nốt đơn 90 · riff hợp âm 73 · bè đôi 43 · nghỉ 6; giữ một kết cấu vài ô rồi mới đổi' },
      { muc: 'Cú hai nốt', so: 'bè quãng 3/6 51 % (1452 cú, ba sheet) — Cà Pháo 31 %, Linh Nhi 27–40 % (đo cùng cách)' },
      { muc: 'Giọng thứ (Rising Sun, trên i)', so: '♭3: 33 % · 1: 29 % · 4: 18 % · 5: 8 % · ♭7: 8 % (n=49) — âm giai blues thứ' },
    ],
    quyTac: [
      {
        ten: 'Một âm giai của chủ cho cả vòng',
        cau: 'Không đổi gam theo từng hợp âm: ngũ cung trưởng của chủ thêm ♭3, dùng suốt I · IV · V.',
        coSo: '81 % ngũ cung trưởng của chủ (n=503); câu bám chủ âm rõ nhất ở Rising Sun (md mục 3, 7).',
      },
      {
        ten: 'Sang IV thì bậc 3 thành ♭3',
        cau: 'Trên hợp âm IV, bậc 3 trưởng của chủ chính là bậc 7 trưởng của IV — chỏi với ♭7 của hợp âm, nên đổi thành ♭3.',
        coSo: '3 lần so với 31 (Rockhouse); 0 so với 25 (Robert).',
      },
      {
        ten: 'Phách 1 · 4 là nốt hợp âm, giữa phách là nốt blue',
        cau: 'Chỗ chắc đặt nốt hợp âm; nốt blue, nốt lướt nằm giữa phách.',
        coSo: '69–77 % ở ba sheet (mục 7b).',
      },
      {
        ten: 'Nốt blue phải đi tiếp',
        cau: '♭3 rơi xuống 2 hay 1, hoặc trượt lên 3; ♭7 về 5; giọng thứ ♭5 trượt lên 5.',
        coSo: '♭3 → 2 · 3 · 1 (n=35); ♭7 → 5: 62 % (n=26); ♭5 → 5: 77 % (n=13).',
      },
      {
        ten: 'Câu lên đỉnh sớm rồi đi xuống',
        cau: 'Đỉnh câu nằm ở phần đầu; nửa sau câu đi xuống.',
        coSo: '58–68 % câu ≥ 4 cú (ba sheet).',
      },
      {
        ten: 'Câu ngắn — hỏi bằng hợp âm, đáp bằng câu',
        cau: 'Ray đệm trước rồi đáp câu sau; nhiều "câu" chỉ là một cú riff hợp âm.',
        coSo: '197 câu Rockhouse, 40 % chỉ một cú, dài trung vị 2 móc; câu vào nửa sau ô 29/49.',
      },
      {
        ten: 'Câu chạy ngắn, đi xuống, đáp phách',
        cau: 'Câu chạy 4–6 nốt trên ngũ cung của chủ, đi xuống, rơi vào phách 1 / 4 hoặc đúng lúc đổi hợp âm.',
        coSo: '34/45 câu ngắn; 19 xuống · 10 lên; 20/45 đáp phách; 21/45 vào chỗ đổi hợp âm (Rockhouse).',
      },
      {
        ten: 'Kết câu về chủ âm hay bậc 5',
        cau: 'Câu dừng ở chủ âm cho trọn ý, hoặc treo ở bậc 5 để câu sau còn phải trả lời.',
        coSo: '1: 34 % · 5: 17 % (Rockhouse, n=118).',
      },
      {
        ten: 'Giọng thứ = mượn câu của giọng trưởng tương đối',
        cau: 'Ngũ cung Đô trưởng = ngũ cung La thứ; ♭3 của Đô (Mi♭) = ♭5 của La — câu blues trưởng đặt vào thành blues thứ, không sửa nốt. (Claude suy; Rising Sun xác nhận tập nốt.)',
        coSo: 'Rising Sun trên i: ♭3: 33 % · 1: 29 % · 4: 18 % (n=49 — một bài).',
      },
    ],
    meo: [
      {
        ten: 'Một rổ nốt cho cả vòng',
        cau: 'Blues Đô: Đô Rê Mi Sol La + Mi♭. Đánh suốt C7 – F7 – G7, khỏi đổi gam.',
        coSo: '81 % ngũ cung trưởng của chủ (n=503).',
      },
      {
        ten: 'Trên F7, đổi Mi thành Mi♭',
        cau: 'Sang hợp âm IV, Mi nghe chỏi — dùng Mi♭.',
        coSo: '3 lần so với 31 (Rockhouse, 199 nốt).',
      },
      {
        ten: 'Láy Mi♭ → Mi',
        cau: 'Bấm Mi♭ rồi trượt ngay lên Mi (hay bấm cả hai cùng lúc) — tiếng "rên" của blues. Chỉ lướt, đừng ngân Mi♭ ở phách mạnh.',
        coSo: '♭3 → 3: 26 % (n=35); láy chồng nửa cung 13 cặp trong 12/74 câu.',
      },
      {
        ten: 'Phách 1 và 4 là nhà',
        cau: 'Đặt Đô, Mi, Sol, Si♭ (nốt hợp âm C7) đúng phách 1 và 4; nốt blue để giữa phách.',
        coSo: '69–77 % ở ba sheet.',
      },
      {
        ten: 'Lấy đà ngay trước phách',
        cau: 'Vào câu ở phách 3 hoặc phách 6 — ngay trước phách 4 và phách 1 — câu như bật lên.',
        coSo: 'Ray 47 % câu vào ở hai chỗ ấy.',
      },
      {
        ten: 'Lên rồi xuống',
        cau: 'Mở câu bằng nốt cao trong nửa đầu, rồi đi xuống.',
        coSo: 'đỉnh ở phần đầu câu 58–68 %.',
      },
      {
        ten: 'Câu chạy 4–6 nốt, rơi vào phách',
        cau: 'Chạy ngũ cung đi xuống; nốt cuối rơi đúng phách 1 / 4 hoặc đúng lúc đổi hợp âm.',
        coSo: '34/45 câu ngắn; 20/45 đáp phách; 21/45 vào chỗ đổi hợp âm.',
      },
      {
        ten: 'Muốn dày thì bè quãng 3 hay 6',
        cau: 'Chồng hai nốt cách quãng 3 hoặc quãng 6 (Mi + Sol, Sol + Mi).',
        coSo: '51 % cú hai nốt (1452 cú, ba sheet).',
      },
      {
        ten: 'Kết câu về Đô hay Sol',
        cau: 'Dừng câu ở chủ âm, hoặc treo ở bậc 5.',
        coSo: '1: 34 % · 5: 17 % (n=118).',
      },
      {
        ten: 'Bài thứ: dùng rổ nốt của giọng trưởng tương đối',
        cau: 'La thứ blues = rổ nốt Đô trưởng blues: La Đô Rê Mi Sol + Mi♭.',
        coSo: 'Rising Sun trên i: ♭3: 33 % · 1: 29 % · 4: 18 % (n=49, một bài) — cách mượn là Claude suy.',
      },
    ],
  },
]
