import type { StylePattern } from '../types'
import { ONEMOTION_STYLES, styleFamilies } from './onemotion'
import { HAI_STYLES } from './haiStyles'
import { TON_HUNG_STYLES } from './tonHungStyles'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED } from './caPhaoBossa'
import { CA_PHAO_BALLAD } from './caPhaoBallad'
import { CP_BALLAD_SONG_STYLES } from './caPhaoBalladSongs'
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
  /*
    HỌ BOLERO LINH NHI 3 — ĐIỆP KHÚC DÀY THEO CHIỀU DỌC.

    Đo năm bản ký âm bolero Linh Nhi, tính tỉ lệ mốc gõ có TỪ HAI NỐT TAY TRÁI
    TRỞ LÊN, tách phiên khúc và điệp khúc:

    | bài                | phiên | điệp    | mốc gõ phiên → điệp |
    |--------------------|-------|---------|---------------------|
    | Đường xưa lối cũ   | 18%   | **76%** | 8,3 → 8,3           |
    | Rừng lá thấp       | 24%   | **67%** | 7,4 → 8,7           |
    | Mùa xuân đầu tiên  | 22%   | 32%     | 7,4 → 6,8           |
    | Đừng Xa            | 14%   | 16%     | 5,7 → 5,2           |
    | Biển Tình          |  2%   |  5%     | 8,0 → 8,3           |

    HAI bài đổi, ba bài không. Và chỗ đáng học nằm ở cột cuối: **số mốc gõ gần
    như không đổi**. Điệp khúc không dày thêm theo THỜI GIAN mà dày theo CHIỀU
    DỌC — tay trái đổi từ nốt đơn sang bấm hợp âm trên đúng những mốc cũ.

    Đây là lần thứ ba hình ấy xuất hiện trong phong cách này: ô thưa của câu dạo
    (tay phải chồng nốt, số mốc giữ nguyên), ô dồn áp chót câu dạo, và giờ là
    điệp khúc. **Muốn dày thì chồng nốt, không thêm cú gõ.**

    Đo Đường xưa ô 41-58, vị trí nào giữ bass và vị trí nào chồng:

      giữ bass đơn : 0 · 2 · 3          (phách mạnh)
      chồng hợp âm : 0,5 · 0,75 · 1 · 1,5 · 2,5 · 3,5

    Thế chồng hay gặp nhất là `(0, 4, 7)` — bộ ba sát nhau, đặt trên bass một
    quãng tám; sau đó là `(0, 7, 12, 15)` trải rộng.

    PHIÊN KHÚC DÙNG LẠI LƯỚI CHÍN CÚ GÕ của `bolero-linh-nhi-2`, vì đo ra đúng
    như vậy — Đường xưa, Biển Tình và Mùa xuân cùng một lưới. Khác biệt của họ
    này nằm TRỌN ở điệp khúc.

    CỠ MẪU n = 2. Theo ngưỡng trong `KHUNG-HOI-THAY.md`, n = 2 chưa tách được
    "phong cách của thầy" khỏi "bài này thầy chơi vậy". Nên đây là một họ điệu
    ĐỨNG CẠNH, người dùng tự chọn — không phải mặc định của Linh Nhi.

    Rừng lá thấp cũng dày ở điệp nhưng dồn vào ĐUÔI ô (2,5 · 2,75 · 3 · 3,5)
    thay vì giữa ô, và lưới phiên khúc của nó có 2,75 thay cho 0,75. Chưa dựng:
    cao độ tay trái bài ấy không thành một mẫu cố định, dựng ra là bịa.
  */
  {
    id: 'bolero-linh-nhi-3',
    name: 'Bolero Nhi — phiên khúc',
    family: 'bolero-linh-nhi-3',
    familyName: 'Bolero Nhi',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: [
      'Bay ban ky am Linh Nhi, doan phien khuc: 2125 moc go tay trai, 1,22 not/moc',
    ],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 0.5, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 0.75, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        {
          beat: 2,
          durationBeats: 0.5,
          velocityScale: 0.75,
          tones: [
            { toneIndex: 2, fromRoot: true },
            { toneIndex: 0, fromRoot: true, semitones: 12 },
          ],
        },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 0, fromRoot: true }] },
        {
          beat: 3.5,
          durationBeats: 0.5,
          velocityScale: 0.7,
          tones: [
            { toneIndex: 2, fromRoot: true },
            { toneIndex: 0, fromRoot: true, semitones: 12 },
          ],
        },
      ],
      right: [],
    },
    note: 'Phien khuc: dung lai luoi chin cu go cua bolero-linh-nhi-2 — do ra Duong Xua, Bien Tinh va Mua Xuan cung mot luoi. Khac biet cua ho nay nam tron o diep khuc.',
    leftHandTop: 67,
    soloMaxStrikes: 9,
  },
  {
    id: 'bolero-linh-nhi-3-chorus',
    name: 'Bolero Nhi — điệp khúc',
    family: 'bolero-linh-nhi-3',
    familyName: 'Bolero Nhi',
    variant: 2,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: [
      'Bay ban ky am Linh Nhi, doan diep khuc: 1026 moc go tay trai, 1,60 not/moc',
    ],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        {
          beat: 0.5, durationBeats: 0.25, velocityScale: 0.6,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
        {
          beat: 0.75, durationBeats: 0.25, velocityScale: 0.6,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
        {
          beat: 1, durationBeats: 0.5, velocityScale: 0.7,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
        {
          beat: 1.5, durationBeats: 0.5, velocityScale: 0.65,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 0, fromRoot: true }] },
        {
          beat: 2.5, durationBeats: 0.5, velocityScale: 0.65,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 0, fromRoot: true }] },
        {
          beat: 3.5, durationBeats: 0.5, velocityScale: 0.6,
          tones: [
            { toneIndex: 0, fromRoot: true, semitones: 12 },
            { toneIndex: 2, fromRoot: true, semitones: 12 },
          ],
        },
      ],
      right: [],
    },
    note: 'Diep khuc: bass don o phach 1, 3 va 4; sau bo ba (0,4,7) tren bass mot quang tam o cac moc yeu. Cung luoi chin cu go voi phien khuc — day theo chieu doc, khong them cu go.',
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
  // Bản cũ chỉ giữ để mở bài đã lưu. Các số đo cũ sai onset/tie; không dùng
  // làm nguồn train. Bản mới CA_PHAO_BOSSA có báo cáo đo lại riêng.
  {
    id: 'bossa-ca-phao-som',
    name: 'Bossa Cà Pháo — bản cũ (đã bị bác)',
    family: 'bossa-ca-phao',
    familyName: 'Bossa Cà Pháo (cũ)',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 110,
    feel: 'syncopated-3-3-2',
    verified: true,
    sourceVideos: ['Bản cũ — không dùng số đo này làm bằng chứng ký âm'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 1.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 2, durationBeats: 1, velocityScale: 0.9, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 1, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
      ],
      right: [
        { beat: 0, durationBeats: 1, velocityScale: 0.8, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.55, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 2.5, durationBeats: 1, velocityScale: 0.6, tones: [{ toneIndex: 1 }, { toneIndex: 2 }, { toneIndex: 3 }] },
        { beat: 3.5, durationBeats: 1, velocityScale: 0.85, som: true, tones: [{ toneIndex: 2 }, { toneIndex: 3 }] },
      ],
    },
    note: 'Bản cũ đã bị bác; giữ tương thích bài lưu. Hãy chọn Bossa Nova Cà Pháo (mới) để nghe bản rút gọn ô 9–10.',
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
  ...TON_HUNG_STYLES,
  CA_PHAO_BOSSA,
  CA_PHAO_BOSSA_IMPROVED,
  ...CA_PHAO_BALLAD,
  ...CP_BALLAD_SONG_STYLES,
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
