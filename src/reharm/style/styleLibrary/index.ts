import type { StylePattern } from '../types'
import { ONEMOTION_STYLES, styleFamilies } from './onemotion'
import { HAI_STYLES } from './haiStyles'
import testerStylesJson from './testerStyles.json'

const DELETED_KEY = 'keytrain-deleted-styles'

/*
  `localStorage` KHÔNG phải lúc nào cũng có.

  Đọc thẳng nó ở thân module thì file này ném lỗi ngay lúc **nạp** — không phải
  lúc gọi hàm. Bộ test chạy môi trường node, không có localStorage, nên 38 bộ
  test không nạp nổi file và tắt luôn, chứ không đỏ từng test một. Trình duyệt ẩn
  danh hoặc thiết lập chặn cookie cũng ném y như vậy.

  App phải chạy được kể cả khi không nhớ được gì: không đọc được thì coi như chưa
  xoá điệu nào, không ghi được thì lần sau mở lại hiện đủ điệu.
*/
function readDeleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

const deletedIds = new Set<string>(readDeleted())

function persistDeleted(): void {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]))
  } catch {
    // Không nhớ được thì thôi; trong phiên này vẫn xoá đúng.
  }
}

/**
 * Thư viện điệu: OneMotion Styles + Basic (rải) + Arp + điệu video.
 *
 * Đệm không còn theo pattern Khá Bự. Phong cách anh Khá chỉ còn ở
 * ngắt nghỉ / fill / hợp âm lướt.
 */

/**
 * Bolero / Rumba trích từ video Tuấn Lưu Piano (Improv_Bai_04).
 * Bass trái phách 1 (Root) và 3 (Fifth); tay phải dập hợp âm đảo phách
 * 1-and / 2 / 3-and / 4-and — đếm 7 điểm Pùng-Pắp.
 */
const BOLERO_STYLES: StylePattern[] = [
  {
    id: 'bolero-1',
    name: 'Bolero 1',
    family: 'bolero',
    familyName: 'Bolero',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 85,
    feel: 'syncopated-3-3-2',
    verified: true,
    sourceVideos: ['CÁCH ĐỆM HÁT BOLERO TRÊN ĐÀN PIANO (RUMBA) — Tuấn Lưu Piano'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 1, velocityScale: 1 },
        { beat: 2, durationBeats: 1, velocityScale: 0.9 },
      ],
      right: [
        { beat: 0.5, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7 },
      ],
    },
    note: 'Bolero/Rumba Tuấn Lưu: bass trái phách 1 (Root) & 3 (Fifth), tay phải dập hợp âm đảo phách 1-and/2/3-and/4-and.',
  },

  /*
    Bolero / Rumba TRỮ TÌNH — kết cấu rải, đứng CẠNH bolero-1 chứ không thay.

    `bolero-1` là lối Pùng-Pắp của Tuấn Lưu: tay trái hai cú bass, tay phải dập
    hợp âm đảo phách. Hai điệu này khác nhau về loài, không phải hai biến thể
    của một thứ — nên thêm vào, không sửa đè.

    Đặc tả đọc từ video *Đừng Xa Em Đêm Nay — Linh Nhi Piano Solo* (Gemini,
    lần 2). Bản độc tấu: tay phải giữ giai điệu, ô nhịp không có tay phải.

    Verse: 1 (đen) · 5 (đen) · 8+10 giữ hai phách. Gemini gọi đó là mẫu chủ đạo
    ("bấm giữ phách 3-4"). Ô hai hợp âm chơi đúng nửa đầu — 1 rồi 5 — nhờ
    `isSplitAwareStyle`. Bậc 9 là nốt màu từng ô, không nhét vào cell.

    CHƯA ĐỐI CHIẾU BẰNG TAI.
  */
  {
    id: 'bolero-linh-nhi',
    name: 'Bolero trữ tình — rải 1-5-8+10',
    family: 'bolero-linh-nhi',
    familyName: 'Bolero trữ tình',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 72,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['uAWjGj9bHyE @ 00:23-01:03 — Đừng Xa Em Đêm Nay, Linh Nhi Piano Solo'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 1, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 1, durationBeats: 1, velocityScale: 0.65, tones: [{ toneIndex: 2, fromRoot: true }] },
        {
          beat: 2,
          durationBeats: 2,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2,
          durationBeats: 2,
          velocityScale: 0.75,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
      ],
      right: [],
    },
    note: 'Bolero trữ tình (Linh Nhi): tay trái 1-5 rồi 8+10 giữ phách 3-4. Bản độc tấu, không dập hợp âm tay phải.',
    /*
      Nới trần tay trái, đúng cửa mà `patternRenderer` mở cho thế 1-5-8-10.

      Trần chung của app là Son quãng tám 3 (55). Thế này vượt qua: bậc 10 cách
      nốt gốc 15 nửa cung, bậc 5 nâng quãng tám cách 19. Không khai thì
      `clampToHandRegister` kéo tụt xuống — đo ra bậc 5 ở phách 4 rơi về đúng
      chỗ bậc 5 ở phách 2, tức phách 4 mất hẳn đường đi lên. 64 là con số mẫu
      Slow Rock 1 của thầy Đức Thịnh đang dùng cho cùng thế bấm ấy.
    */
    leftHandTop: 64,
  },

  /*
    Cao trào — điệp khúc VÀ giang tấu. Gemini lần 2: tám móc đơn một ô, sóng
    1-5-8-10-12-10-8-5, quãng tám bass chỉ phách 1. Nốt 9/11 trong video là
    nốt lót theo hợp âm, cell giữ nốt hợp âm cho mọi giọng.

    Ô hai hợp âm: nửa đầu đúng 1-5-8-10, nhờ `isSplitAwareStyle`.
  */
  {
    id: 'bolero-linh-nhi-chorus',
    name: 'Bolero trữ tình — cao trào (arpeggio 8 nốt)',
    family: 'bolero-linh-nhi',
    familyName: 'Bolero trữ tình',
    variant: 2,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 72,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['uAWjGj9bHyE @ 02:02-02:24 — Đừng Xa Em Đêm Nay, Linh Nhi Piano Solo'],
    cell: {
      lengthBeats: 4,
      left: [
        {
          beat: 0,
          durationBeats: 0.5,
          velocityScale: 1,
          tones: [
            { toneIndex: 0, fromRoot: true },
            { toneIndex: 0, fromRoot: true, semitones: 12 },
          ],
        },
        { beat: 0.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
        {
          beat: 1,
          durationBeats: 0.5,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 1.5,
          durationBeats: 0.5,
          velocityScale: 0.8,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2,
          durationBeats: 0.5,
          velocityScale: 0.85,
          tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2.5,
          durationBeats: 0.5,
          velocityScale: 0.8,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 3,
          durationBeats: 0.5,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
      ],
      right: [],
    },
    note: 'Bolero trữ tình cao trào (Linh Nhi): tám móc đơn 1-5-8-10-12-10-8-5, octave bass phách 1. Điệp khúc và giang tấu.',
    /*
      Trần 67 chứ không 64 như bản phiên khúc.

      Sóng cao trào lên tới bậc 12, cách nốt gốc 19 nửa cung. Nốt gốc đặt trong
      khoảng 36-47 tuỳ giọng, nên đỉnh sóng chạm 66 ở giọng Si. Để trần 64 thì
      đúng HAI giọng gãy — Si giáng cần 65, Si cần 66 — và chỗ gãy không phải
      một nốt sai lạc mà là đỉnh sóng gấp ngược xuống, nghe ra ngay.

      Phiên khúc giữ 64: đỉnh nó chỉ tới bậc 10, cao nhất là 62.

      67 chồng lên tầm giai điệu, và điều đó chấp nhận được ở đây: ô nhịp này
      không có phần tay phải, còn va chạm với câu solo thì `avoidMelodyClash` lo.
      Đo trên bản ký âm của Cà Pháo, trần tay trái đoạn giang tấu là 62-70.
    */
    leftHandTop: 67,
  },

  /*
    BOLERO RAI, do tu BAN KY AM THAT — khong phai tu loi mo ta.

    Nguồn: bản piano do Linh Nhi soạn, người dùng đưa vào. 72 ô nhịp 4/4, và có
    sẵn 80 ký hiệu hợp âm. Đây là hạng cao nhất kho từng có: hai tay tách sẵn
    trên hai khuông, phách là số hữu tỉ chính xác, hoà âm cho trước chứ không
    phải suy ngược từ tay trái như bảy bản Cà Pháo.

    Đứng CẠNH cặp `bolero-linh-nhi` ở trên, không thay. Cặp ấy dựng từ một bản
    đặc tả do Gemini viết sau khi xem video; cặp này có bản ký âm chống lưng.
    Hai mức tin cậy khác nhau thì để người học thấy cả hai, đừng trộn.

    MẪU ĐO ĐƯỢC — chín cú gõ mỗi ô, chữ ký nằm ở CẶP MÓC KÉP phách 1&:

        phách 1     bậc 1    móc đơn
        phách 1&    bậc 5    móc kép  ┐  hai nốt này làm nên mẫu
        phách 1&½   bậc 8    móc kép  ┘
        phách 2     bậc 10   móc đơn

    Ba nốt đầu giống nhau ở mọi ô. Từ phách 2 rẽ làm HAI VÒM, và mỗi vòm giữ
    riêng thành một điệu:

        vòm THẤP  lên bậc 10 rồi về gốc         21 trên 70 ô
        vòm CAO   trèo tới bậc 15 rồi hạ dần    13 trên 70 ô

    Đếm chỗ gõ trên cả bài: phách 1 có ở 70/70 ô, phách 1& ở 69, cặp móc kép ở
    49, phách 2 ở 70; phần đuôi ô thưa dần còn 55-66 ô.

    Ô nhịp không có phần tay phải — bản độc tấu, tay phải giữ giai điệu.
  */
  {
    id: 'bolero-linh-nhi-2',
    name: 'Bolero rai — vom thap (1-5-8-10)',
    family: 'bolero-linh-nhi-2',
    familyName: 'Bolero rai (ban ky am)',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['bien-tinh-linh-nhi-piano.mxl — ban ky am piano do Linh Nhi soan'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 0.5, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 0.75, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.75, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
      ],
      right: [],
    },
    note: 'Bolero rai vom thap: 1-5-8-10 roi ve goc. Cap moc kep bac 5 va bac 8 o phach 1& la chu ky cua mau. Do tren 21/70 o cua ban ky am.',
    leftHandTop: 67,
    soloMaxStrikes: 9,
  },
  {
    id: 'bolero-linh-nhi-2-chorus',
    name: 'Bolero rai — vom cao (len bac 15)',
    family: 'bolero-linh-nhi-2',
    familyName: 'Bolero rai (ban ky am)',
    variant: 2,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['bien-tinh-linh-nhi-piano.mxl — ban ky am piano do Linh Nhi soan'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 0.5, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 0.75, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.9, tones: [{ toneIndex: 0, fromRoot: true, semitones: 24 }] },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
      ],
      right: [],
    },
    note: 'Bolero rai vom cao: cung ba not dau voi vom thap, tu phach 2 treo len bac 15 roi ha dan. Do tren 13/70 o cua ban ky am.',
    leftHandTop: 74,
    soloMaxStrikes: 9,
  },
  /*
    BOSSA NOVA CÀ PHÁO — bản dựng lại, sau khi bản đầu bị người dùng bác.

    Bản đầu trộn TRUNG BÌNH hai bài rồi bỏ mất cử chỉ chính. Lần này đo kỹ hơn
    ở ba chỗ, và cả ba đều đổi kết luận.

    1. HAI BÀI KHÔNG GIỐNG NHAU, đừng trộn.
       Tay trái *Hồng Kông 1* gõ gần như móc đơn đều (phiên khúc 0 · 0,5 · 1 ·
       1,5 · 2 · 2,5 · 3, đều trên 0,5 lần mỗi ô). *Người hãy quên em đi* mới
       có đảo phách thật: 0 · 1,5 · 2 · 3. Trộn hai cái thành một là ra một
       mẫu không phải của bài nào. Bản này lấy *Người hãy quên em đi*.

    2. TÁCH ĐƯỢC PHẦN QUẠT KHỎI GIAI ĐIỆU.
       Bản đầu ghi "tay phải không đo được" rồi lấy hình quạt bossa chung. Sai:
       bản ký âm không tách bè, NHƯNG có nốt chồng — mốc gõ từ hai nốt trở lên
       là quạt hợp âm, mốc một nốt là giai điệu. Tách ra thì phần quạt phiên
       khúc hiện rõ: 0 · 1 · 1,5 · 2 · 2,5 · 3,5, mạnh nhất ở 3,5.

    3. CỬ CHỈ LÀM NÊN CHẤT BOSSA LÀ NỐT VÀO SỚM, VÀ BẢN ĐẦU ĐÃ GIẾT NÓ.
       Đếm số lần một tiếng ngân VƯỢT HẲN vạch nhịp, theo từng vị trí:

         mốc 3,5   12/13 (phiên khúc)   5/11 (điệp khúc)
         mốc 3      0/3                  0/5
         mốc 2,5    0/9                  0/10
         mốc 0      0/12                 0/12

       Chỉ mốc 3,5 làm việc ấy, và làm gần như mọi ô. Bản đầu có mốc 3,5 nhưng
       để `durationBeats: 0.5` — dứt ĐÚNG vạch nhịp. Thành thêm một cú gõ chứ
       không kéo hoà âm tới sớm. Nay nó mang cờ `som`: đánh thế bấm của hợp âm
       KẾ TIẾP và không bị `clipToChords` cắt.
  */
  {
    /*
      ID KHÁC bản đầu, và có lý do chứ không phải để né.

      Bản `bossa-ca-phao` đầu tiên bị người dùng nghe rồi bác — "nghe không ra
      chất bossa nova" — và họ xoá nó trong app. Phép xoá ấy ghi id vào
      `localStorage` làm bia mộ vĩnh viễn, nên bản dựng lại mang đúng id cũ thì
      không bao giờ hiện lên, im lặng, không thông báo gì.

      Bản này cũng thật sự là một điệu KHÁC: ô mẫu lấy từ một bài chứ không
      trộn hai, phần quạt tách được khỏi giai điệu, và có thêm cử chỉ nốt vào
      sớm mà bản đầu không có. Mang id riêng là ghi đúng chuyện đó.
    */
    id: 'bossa-ca-phao-som',
    name: 'Bossa Ca Phao — bass dao phach, hop am vao som',
    family: 'bossa-ca-phao',
    familyName: 'Bossa Nova (ban ky am Ca Phao)',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 110,
    feel: 'syncopated-3-3-2',
    verified: true,
    sourceVideos: ['nguoihayquenemdi.mxl — Nguoi hay quen em di, phien khuc o 9-24'],
    cell: {
      lengthBeats: 4,
      /*
        Tay trái: mốc gõ đo được 1,00 · 0,94 · 1,00 · 0,69 lần mỗi ô, độ ngân
        1,5 · 0,5 · 1 · 1. Quãng so với nốt trầm nhất trong ô: gốc · bậc 5 ·
        quãng tám · quãng tám cộng bậc 5 — bass đi gốc-năm trèo lên hai quãng
        tám, không dập một chỗ.
      */
      left: [
        { beat: 0, durationBeats: 1.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 2, durationBeats: 1, velocityScale: 0.9, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 1, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
      ],
      /*
        Quạt hợp âm: 0 · 1 · 2 · 2,5 rồi NỐT VÀO SỚM ở 3,5 ngân qua vạch. Đo
        được 4,4 cú quạt mỗi ô, mỗi cú 2-3 nốt.
      */
      right: [
        { beat: 0, durationBeats: 1, velocityScale: 0.8, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.55, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 2.5, durationBeats: 1, velocityScale: 0.6, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        /*
          Nốt vào sớm MỎNG hơn cú quạt phách 1, và đó là số đo: 20 cặp đo được,
          cặp hay gặp nhất là (2 nốt vào sớm, 3 nốt ở phách 1), và 0/10 lần ở
          phiên khúc trùng đúng thế bấm — người soạn đổi thế chứ không gõ lại y
          hệt. Cùng tầm, lệch cao độ trung vị 0.
        */
        { beat: 3.5, durationBeats: 1, velocityScale: 0.85, som: true, tones: [{ toneIndex: 2 }, { toneIndex: 3 }] },
      ],
    },
    note: 'Bass 1 · 2& · 3 · 4 di goc-nam len hai quang tam. Quat 1 · 2 · 3 · 3& roi HOP AM VAO SOM o 4&, ngan qua vach nhip — do duoc 12/13 o phien khuc Nguoi hay quen em di, va la vi tri DUY NHAT co tieng ngan vuot vach.',
    leftHandTop: 64,
  },
]

/*
  Điệu của thầy Hải nối vào sau bộ OneMotion, không chen vào giữa: thứ tự này
  là thứ tự hiện trên bảng chọn, nên bộ cũ giữ nguyên chỗ đứng của nó.
*/
const TESTER_STYLES = testerStylesJson as StylePattern[]

export const VERIFIED_STYLES: readonly StylePattern[] = [
  ...ONEMOTION_STYLES,
  ...HAI_STYLES,
  ...BOLERO_STYLES,
  ...TESTER_STYLES,
]

export const UNVERIFIED_STYLES: readonly StylePattern[] = []

export const ALL_STYLES: readonly StylePattern[] = VERIFIED_STYLES

const ALIAS: Record<string, string> = {
  ballad: 'pop-1',
  'ballad-pre': 'pop-1',
  'ballad-chorus': 'pop-1',
  'bossa-nova': 'bossa-nova-1',
  valse: 'waltz-1',
  swing: 'swing-1',
  bolero: 'bolero-1',
  'slow-rock': 'slow-rock-2',
  'slow-rock-1': 'slow-rock-2',
  /*
    Hai điệu ballad của thầy Hải từng mang tên khác lúc mới thêm. Bài đã lưu
    trước đó còn giữ id cũ trong máy người dùng, nên phải trỏ tiếp.
  */
  'hai-pop-ballad-1': 'hai-pop-ballad',
  'hai-pop-ballad-3': 'hai-pop-ballad-chorus',
}

/** Điệu tester vừa xoá trong phiên này — file đã bỏ nó, bộ nhớ thì chưa. */
const removedThisSession = new Set<string>()

/*
  Bia mộ trong `localStorage` chỉ có nghĩa với điệu **không xoá khỏi file được**
  — điệu dựng sẵn trong mã nguồn.

  Điệu tester thì xoá được thật: `/__kt/delete` gỡ nó khỏi `testerStyles.json`.
  Nên nếu id đó **vẫn còn trong file**, nghĩa là nó vừa được xuất lại — phải
  hiện lên. Giữ bia mộ ở đây làm điệu xuất lại **trùng tên cũ** biến mất vĩnh
  viễn: xuất bao nhiêu lần cũng không thấy, mà không có lấy một thông báo nào.
*/
function hidden(id: string): boolean {
  if (removedThisSession.has(id)) return true
  return deletedIds.has(id) && !TESTER_IDS.has(id)
}

export function getStyle(id: string): StylePattern | undefined {
  if (hidden(id)) return undefined
  return ALL_STYLES.find((style) => style.id === (ALIAS[id] ?? id))
}

export function getVisibleStyles(): readonly StylePattern[] {
  return ALL_STYLES.filter((style) => !hidden(style.id))
}

/**
 * Điệu DỰNG SẴN đang bị bia mộ chôn — để giao diện còn có đường hiện lại.
 *
 * Bia mộ là vĩnh viễn và im lặng: xoá một điệu dựng sẵn rồi thì không có nút
 * nào, không có thông báo nào đưa nó về. Đã cắn thật — người dùng xoá điệu
 * bossa Cà Pháo, tôi dựng lại điệu ấy với ĐÚNG id cũ, và nó không bao giờ hiện
 * lên. Người dùng phải tự hỏi "sao chưa thấy" chứ app không nói gì.
 *
 * Chỉ tính điệu có thật trong `ALL_STYLES`: id lạ trong `localStorage` — điệu
 * tester đã gỡ khỏi file, hay điệu đổi tên — không phải thứ hiện lại được.
 */
export function hiddenBuiltIns(): StylePattern[] {
  return ALL_STYLES.filter(
    (style) => !removedThisSession.has(style.id) && deletedIds.has(style.id) && !TESTER_IDS.has(style.id),
  )
}

/** Bỏ bia mộ cho những điệu dựng sẵn, hiện lại tất cả. */
export function restoreHiddenStyles(): void {
  for (const style of hiddenBuiltIns()) deletedIds.delete(style.id)
  persistDeleted()
}

export async function removeStyle(id: string): Promise<boolean> {
  if (TESTER_IDS.has(id)) {
    try {
      const res = await fetch('http://localhost:5174/__kt/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        // Đã gỡ khỏi file. Chỉ cần giấu nốt phiên này, không ghi nhớ.
        removedThisSession.add(id)
        return true
      }
    } catch {
      /* không nối được máy chủ tester — rơi xuống nhánh ghi nhớ */
    }
  }
  deletedIds.add(id)
  persistDeleted()
  return true
}

export function isPlayable(style: StylePattern): boolean {
  return style.verified && style.cell !== null
}

export const BALLAD = getStyle('pop-1')!
export const BOSSA_NOVA = getStyle('bossa-nova-1')!
export const VALSE = getStyle('waltz-1')!
export const SWING = getStyle('swing-1')!

const TESTER_IDS = new Set(TESTER_STYLES.map((style) => style.id))

export function isTesterStyle(id: string): boolean {
  return TESTER_IDS.has(id)
}

export { ONEMOTION_STYLES, styleFamilies }
