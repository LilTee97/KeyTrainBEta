import type { RhythmCell, StylePattern } from '../types'
import { cellFromArps } from './arpToCell'
import { ONEMOTION_STYLES } from './onemotion'

/**
 * Mười lăm tiết điệu **Tập 6 của thầy Hải Joseph**, dựng lại từ kho PianoBrain.
 *
 * Đây là điệu *thêm vào* cạnh bộ OneMotion, không thay điệu nào: id riêng, nhóm
 * riêng, nhãn "(Hải)" để trên bảng chọn phân biệt được ngay "Pop 1" của
 * OneMotion với "Pop Ballad (Hải)" của thầy. Không điệu OneMotion nào bị xoá
 * hay bị ghi đè, kể cả những điệu thầy dạy trùng tên.
 *
 * Groove vẫn chạy qua `patternRenderer` và Tone.js sẵn có — ô nhịp dưới đây
 * cùng một định dạng với mọi điệu khác, không có bộ phát tiếng thứ hai.
 *
 * ## Ô nhịp lấy từ đâu
 *
 * Hai đường, và mỗi điệu ghi rõ mình đi đường nào:
 *
 * - **`map`** — mượn nguyên ô nhịp của một điệu OneMotion đã có, khi điệu đó
 *   vốn đã đúng thứ thầy dạy. Không chép mã, chỉ trỏ sang `cell` của nó, nên
 *   sửa bên kia là bên này theo.
 * - **`chord` + `bass`** — ô nhịp dựng mới từ mô tả trong kho.
 *
 * Điệu nào cũng ghi id item đã pin hình tiết tấu ấy. Chỗ nào kho tả chung chung
 * mà không pin từng phách thì `note` nói thẳng đoạn đó là cách đọc của KeyTrain
 * chứ không phải thầy dạy — cùng luật chống bịa mà PianoBrain đang giữ.
 *
 * Ký hiệu ô nhịp: `1` gốc, `1f` gốc cộng quãng năm, `1+` gốc lên quãng tám,
 * `11f` bấm cùng lúc gốc và quãng năm, `x` cả hợp âm, `.` nghỉ, `!` nhấn,
 * `s` ngắt ngắn. Xem `arpToCell.ts`.
 */
interface HaiDef {
  id: string
  name: string
  family: string
  familyName: string
  variant: number
  bar?: number
  ts?: string
  bpm: number
  feel?: StylePattern['feel']
  /** Mượn ô nhịp của điệu OneMotion này thay vì dựng mới. */
  map?: string
  cStep?: number
  bStep?: number
  chord?: string
  bass?: string
  /**
   * Item trong kho PianoBrain đã pin hình tiết tấu này.
   *
   * Bỏ trống **chỉ khi** `variation` bật: lúc đó ô nhịp do KeyTrain soạn nên
   * không có item nào của thầy để dẫn, và dẫn bừa một id là bịa.
   */
  from: string[]
  /**
   * Ô nhịp này là **biến tấu do KeyTrain soạn**, không phải bản ghi lại thầy
   * Hải chơi.
   *
   * Đánh dấu tường minh chứ không suy từ việc `from` rỗng, để lỡ ai sau này
   * thêm một điệu mà quên dẫn nguồn thì bài kiểm bắt được ngay, chứ không lặng
   * lẽ biến thành "biến tấu".
   */
  variation?: true
  note: string
}

/** Một phần ba phách, để viết được chùm ba nốt của điệu March. */
const TRIPLET = 1 / 3

const DEFS: HaiDef[] = [
  {
    /*
      Bài 01. Kho: "Tay trái giữ nhịp cơ bản với nốt BASS chính ở phách 1 và
      phách 3, kết hợp tiết tấu đảo phách đơn giản ở tay phải để tạo cảm giác
      chugging nhẹ nhàng." Tay phải chỉ được tả là "đảo phách đơn giản", không
      có vị trí từng nốt — chỗ chêm nốt kép dưới đây là cách đọc của KeyTrain.
    */
    id: 'hai-16-beat',
    name: '16 Beat (Hải)',
    family: 'hai-16-beat',
    familyName: '16 Beat (Hải)',
    variant: 1,
    bpm: 95,
    cStep: 0.25,
    bStep: 0.5,
    chord: 'x! . . xs . . xs . x . . xs . . xs .',
    bass: '1 . . . 1 . . .',
    from: ['tap-06-bai-01-tap-06-bai-01-item-003', 'tap-06-bai-01-rule-16beat-001'],
    note: '16 Beat của thầy Hải — tay trái bass phách 1 và 3 (kho ghi rõ). Vị trí từng nốt tay phải kho chỉ ghi "đảo phách đơn giản", nên chỗ chêm nốt kép là cách đọc của KeyTrain.',
  },
  {
    /*
      Bài 02, Mẫu 1 (phiên khúc). Kho: "Tay trái đi các nốt gốc - bậc 5 -
      octave (1-5-8) đập rải chậm, kết hợp tay phải chèn hợp âm ở các phách
      nhẹ." Tempo 65-75 BPM; khung tay trái ưu tiên 1-5-8.
    */
    id: 'hai-pop-ballad',
    name: 'Pop Ballad (Hải) — phiên khúc',
    family: 'hai-pop-ballad',
    familyName: 'Pop Ballad (Hải)',
    variant: 1,
    bpm: 70,
    cStep: 1,
    bStep: 1,
    chord: '. x . x',
    bass: '1 1f 1+ .',
    from: [
      'tap-06-bai-02-hai-piano-course-001-tap-06-bai-02-002',
      'tap-06-bai-02-rule-pop-ballad-lh-open-voicing',
      'tap-06-bai-02-rule-pop-ballad-tempo-range',
    ],
    note: 'Pop Ballad của thầy Hải, mẫu phiên khúc — tay trái rải chậm gốc, quãng 5, quãng 8; tay phải chèn hợp âm vào phách nhẹ. 65-75 BPM.',
  },
  {
    /*
      Bài 02, Mẫu 3 (điệp khúc). Kho: "Mật độ nhịp rải dày, tay phải dậm hợp âm
      nhịp nhàng phối hợp đảo phách linh hoạt với tay trái."
    */
    id: 'hai-pop-ballad-chorus',
    name: 'Pop Ballad (Hải) — điệp khúc',
    family: 'hai-pop-ballad',
    familyName: 'Pop Ballad (Hải)',
    variant: 2,
    bpm: 70,
    cStep: 0.5,
    bStep: 0.5,
    chord: 'x . x xs . x xs .',
    bass: '1 . 1f . 1+ . 1f .',
    from: [
      'tap-06-bai-02-hai-piano-course-001-tap-06-bai-02-004',
      'tap-06-bai-02-rule-ballad-intensity-layering',
    ],
    note: 'Pop Ballad của thầy Hải, mẫu điệp khúc — rải dày hơn mẫu phiên khúc, tay phải dậm hợp âm đảo phách để đẩy cao trào.',
  },
  {
    /*
      **Biến tấu của KeyTrain**, không phải bản ghi lại thầy Hải chơi.

      Lấy khung ballad của `hai-pop-ballad` — 4/4 chậm, tay trái 1-5-8, tay phải
      chèn vào phách nhẹ — rồi đổi cách chơi tay phải: thay vì dậm hợp âm nguyên
      khối, các nốt **rơi lần lượt** thành câu rải.

      Ô nhịp dài 8 phách (hai ô 4/4) chứ không phải 4, vì cả ý đồ nằm ở chỗ hai ô
      **không giống nhau**: ô đầu rải đủ phách, ô sau rải rồi buông hẳn hai phách
      cuối. Viết trong 4 phách thì mỗi ô đều như nhau, nghe ra máy đánh chứ không
      ra người đệm.

      Tay phải đọc theo **nốt của thế bấm đang vang**: `2` là nốt thứ hai của
      thế bấm tay phải, `3` nốt thứ ba, `1+` nốt gốc lên quãng tám. Nhờ vậy hợp
      âm nào cũng chỉ rải nốt của chính nó — đổi sang Am hay G7 thì rải theo Am,
      theo G7, không có nốt nào ngoài hợp âm lọt vào. Không có `x` nào — `x` là
      bấm cả hợp âm cùng lúc, đúng thứ cần tránh ở đây.

      ## Mọi con số đều mang hậu tố `r`: đếm theo BẬC, không theo thế bấm

      Không có `r` thì con số nghĩa là "nốt thứ mấy trong thế bấm", mà thế bấm
      sắp theo cao độ và đã được tô màu. Trên `Cadd2` thế bấm là `C4 D4 E4 G4`
      nên `2` ra nốt Rê — bậc chín — và câu rải định đi 1-3-5 hoá ra đi
      Đô - Rê - Mi, một chùm liền bậc đập vào nốt màu. Trên `Am9` bấm `E3 G3 B3`
      thì `1` ra nốt Mi, câu không chạm nốt La lần nào.

      Với `r`: 1 gốc, 2 bậc ba, 3 bậc năm, 4 bậc bảy — dò trong chính các nốt
      đang vang, nên hợp âm thứ ra bậc ba thứ, hợp âm át ra bậc bảy thứ. Câu rải
      giữ đúng hình 1-3-5-8 dù người dùng tô màu gì.

      Mỗi ô — và mỗi **nửa ô** khi hợp âm chia đôi — đều mở bằng `1r`, vì ô nhịp
      được dựng lại từ đầu ở mỗi nửa.

      ## Mỗi bước không quá quãng năm

      Câu rải là để **một bàn tay** chơi liền mạch, nên hai nốt kề nhau không
      được cách quá quãng năm. Bản trước đi `... 1r+ 2r ...`, tức Đô quãng tám 5
      rơi thẳng xuống Mi quãng tám 4 — quãng sáu thứ, tay phải nhảy hụt. Giờ lên
      1-3-5-8 rồi xuống 8-5-3-1, không chỗ nào hở quá quãng năm.

      ## Không viết `2+` hay `3+`

      Ký hiệu `+` chỉ ăn ở nốt gốc. Nâng nốt thứ hai lên quãng tám thì khoảng
      cách hai tay rộng quá và `settleHands` kéo nó về đúng chỗ cũ — nghe y hệt
      `2`, nhưng người đọc mã lại tưởng câu rải với lên tận quãng tám trên. Viết
      thẳng `2` cho khớp thứ thật sự kêu.

      ## Rải sao cho không chói

      Bản trước dồn tiếng vào một dải hẹp và đập trúng một nốt tới ba lần trong
      tám tiếng; nghe ra tiếng gõ chứ không ra câu rải. Bản này trải đủ quãng tám
      C4-C5 và không nốt nào chiếm quá ba phần tám, cũng không có hai tiếng liền
      nhau trùng cao độ.

      ## Khung phách mạnh - phách nhẹ

      Ô ballad chia tám nửa phách. Tay trái phải chạm **cả hai** mốc trong mọi ô:
      phách mạnh ở vị trí 1 (đầu ô) và phách nhẹ ở vị trí 5 (giữa ô). Không ô nào
      được đánh một tiếng bass rồi im, vì lúc đó nửa sau ô mất điểm tựa và người
      hát hết chỗ bám nhịp.

      ## Vì sao chu kỳ dài bốn ô

      Tay phải rải **đủ tám tiếng** ở ba ô, ô thứ ba thả xuống năm tiếng rồi rải
      tiếp. Chu kỳ hai ô không diễn được nhịp thở ấy: hai ô thì "đủ" và "thưa"
      chia đôi năm mươi - năm mươi, nghe thành một cặp đối đáp máy móc. Bốn ô cho
      phép ô thưa là **chỗ hụt hơi giữa câu**, đúng cách người ta đệm ballad.

      Không ô nào xuống dưới năm tiếng. Rải hai ba tiếng rồi bỏ trống cả ô thì
      tay phải hết vai trò giữ dòng chảy, phần đệm rơi lại thành hợp âm rời.
    */
    id: 'hai-pop-ballad-free',
    name: 'Pop Ballad rải tự do (Hải*)',
    family: 'hai-pop-ballad-free',
    familyName: 'Pop Ballad rải tự do (Hải*)',
    variant: 1,
    bpm: 70,
    cStep: 0.5,
    bStep: 0.5,
    bar: 16,
    chord:
      '1r 2r 3r 1r+ 3r 2r 1r 2r ' +
      '1r 3r 1r+ 3r 2r 1r 2r 3r ' +
      '1r 3r 1r+ . . 3r . 2r ' +
      '1r 2r 3r 1r+ 3r 1r+ 3r 2r',
    bass:
      '1 . . . 1f . . . ' +
      '1 . . . 1f . . . ' +
      '1 . . . 1f . . . ' +
      '1 . . . 1f . . .',
    from: [],
    variation: true,
    note: 'Biến tấu của KeyTrain dựng từ Pop Ballad (Hải) — KHÔNG phải sheet thầy Hải nguyên văn. Phiên khúc: tay trái giữ khung phách mạnh ở đầu ô và phách nhẹ ở giữa ô (vị trí 1 và 5), tay phải rải lần lượt từng nốt rồi buông trống phần sau phách nhẹ.',
  },
  {
    /*
      **Biến tấu của KeyTrain**, cặp điệp khúc của điệu trên.

      Mãnh liệt hơn phiên khúc mà vẫn là ballad: lưới nốt kép, dậm hai nốt một
      (`23` là bậc ba cộng bậc năm) rơi lệch phách, tay trái giật chồm.

      Cố ý **không** chép hình tay phải của 16 Beat: điệu kia dậm sáu tiếng theo
      một hình khác hẳn và chạy ở 95 BPM. Ở đây 76 — nhanh hơn phiên khúc, còn
      chậm hơn 16 Beat, đúng chỗ ở giữa mà người đệm cần khi vào điệp khúc.

      Khung phách mạnh - phách nhẹ giữ y như phiên khúc: bass ở vị trí 1 và 5.
      Mấy tiếng `1s` chen vào nửa sau phách là **thêm** vào khung ấy chứ không
      thay nó — bỏ chúng đi thì vẫn còn đủ mạnh và nhẹ.

      Tay phải dày hơn phiên khúc ở cả hai ô, không ô nào có ô thưa để thở: điệp
      khúc là chỗ đẩy tới, hụt một ô là tụt lực.

      Mãnh liệt ở đây là **nhiều tiếng hơn và lệch phách hơn**, không phải nốt
      lạ: vẫn đúng kho nốt của thế bấm đang vang, y như phiên khúc. Bản trước
      dậm cụm hai nốt `23` không có nốt gốc, nghe rỗng và gắt; giờ rơi từng nốt
      một, trải đủ quãng tám thay vì dồn vào quãng sáu.
    */
    id: 'hai-pop-ballad-free-chorus',
    name: 'Pop Ballad rải tự do (Hải*) — điệp khúc',
    family: 'hai-pop-ballad-free',
    familyName: 'Pop Ballad rải tự do (Hải*)',
    variant: 2,
    bpm: 76,
    cStep: 0.25,
    bStep: 0.5,
    bar: 8,
    chord:
      '1r . 2r 3r . 1r+ . 3r . 2r 3r . 1r+ . 3r . ' +
      '1r . 3r 1r+ . 3r 2r . . 3r 1r+ . 3r 2r . 1r',
    bass: '1 . . 1s 1f . . 1s 1 . . 1s 1f . 1s .',
    from: [],
    variation: true,
    note: 'Biến tấu của KeyTrain dựng từ Pop Ballad (Hải) — KHÔNG phải sheet thầy Hải nguyên văn. Điệp khúc: vẫn giữ khung phách mạnh - phách nhẹ ở vị trí 1 và 5, thêm hai nhịp bass giật chồm; sau phách nhẹ tay phải dậm tiếp chứ không nghỉ. Nhanh hơn phiên khúc nhưng chậm hơn 16 Beat.',
  },
  {
    /*
      Bài 03. Kho: nhịp 6/8, sáu phách móc đơn chia hai cụm, phách 1 mạnh nhất
      và phách 4 mạnh vừa. Mẫu 1 rải tay trái theo bậc 1-5-8-9-10-9.

      Mượn ô nhịp `slow-rock-2` của OneMotion, đúng khung 6/8 nhấn 1 và 4 ấy.
      Bậc 9 và 10 của thầy thì ô nhịp không viết được: `toneIndex` đếm theo nốt
      của hợp âm (gốc, ba, năm, bảy) chứ không đếm theo bậc thang âm, nên không
      trỏ tới bậc 9 được. Ghi ra đây để sau này ai mở rộng định dạng ô nhịp thì
      biết chỗ còn thiếu.
    */
    id: 'hai-slow-rock',
    name: 'Slow Rock (Hải)',
    family: 'hai-slow-rock',
    familyName: 'Slow Rock (Hải)',
    variant: 1,
    ts: '6/8',
    bar: 6,
    bpm: 66,
    map: 'slow-rock-2',
    from: [
      'tap-06-bai-03-rule-slow-rock-meter-6-8',
      'tap-06-bai-03-hai-piano-course-001-lesson-03-003',
    ],
    note: 'Slow Rock 6/8 của thầy Hải — mượn ô nhịp Slow Rock có sẵn (nhấn phách 1 và 4). Mẫu rải 1-5-8-9-10-9 của thầy chưa viết được: ô nhịp chỉ trỏ được tới nốt trong hợp âm, không tới bậc 9 và 10.',
  },
  {
    /*
      Bài 04. Kho: "nhịp 2/4 nhanh"; Mẫu 1 "Tay trái đánh nốt Bass ở phách 1 và
      phách 2 (nốt đen legato), tay phải đánh hợp âm nảy staccato ở các tiết
      phách ngắt quãng (Bùm - Chát - Bùm - Chát)"; luật riêng ghi tay trái đi
      gốc rồi quãng 5.
    */
    id: 'hai-fox',
    name: 'Fox (Hải)',
    family: 'hai-fox',
    familyName: 'Fox (Hải)',
    variant: 1,
    ts: '2/4',
    bar: 2,
    bpm: 128,
    cStep: 0.5,
    bStep: 1,
    chord: '. xs . xs',
    bass: '1 1f',
    from: [
      'tap-06-bai-04-tap-06-bai-04-003',
      'tap-06-bai-04-rule-fox-rhythm-staccato-accompaniment',
    ],
    note: 'Fox 2/4 của thầy Hải — bùm chát bùm chát: tay trái gốc rồi quãng 5 vào hai phách, tay phải nảy hợp âm staccato ở nửa sau mỗi phách.',
  },
  {
    /*
      Bài 05. Kho: "Tiết tấu Boston Kiểu A trong nhịp 3/4: mô hình Bum - Chát -
      Chát. Phách 1 đánh nốt Bass (Mạnh), phách 2 và 3 tay phải đệm hợp âm
      Nonlegato. Tay trái bấm bậc 1 và 5 giữ nền ngân vang." Tempo 63-70 BPM,
      chậm hơn Waltz.
    */
    id: 'hai-boston',
    name: 'Boston (Hải)',
    family: 'hai-boston',
    familyName: 'Boston (Hải)',
    variant: 1,
    ts: '3/4',
    bar: 3,
    bpm: 65,
    feel: 'waltz-oom-pah-pah',
    cStep: 1,
    bStep: 1,
    chord: '. x x',
    bass: '11f . .',
    from: [
      'tap-01-bai-10-hai-piano-c001-l010-006',
      'tap-06-bai-05-lesson-tap06-bai05-001',
    ],
    note: 'Boston 3/4 của thầy Hải — bum chát chát, tay trái giữ quãng 1-5 ở phách 1, tay phải đệm nhẹ phách 2 và 3. Chậm hơn Waltz (63-70 BPM).',
  },
  {
    /*
      Bài 06. Kho: Mẫu 1 "Tay trái chơi nốt Bass luân phiên (Root - Nốt bậc 5)
      theo nét legato, tay phải dập hợp âm chát (non-legato)"; Slow Bossa
      110-125 BPM.

      Mượn ô nhịp `bossa-nova-1` của OneMotion — đúng khung đảo phách Latin ấy,
      và tay trái của nó cũng đi gốc rồi quãng 5.
    */
    id: 'hai-bossa-nova',
    name: 'Bossa Nova (Hải)',
    family: 'hai-bossa-nova',
    familyName: 'Bossa Nova (Hải)',
    variant: 1,
    bpm: 118,
    map: 'bossa-nova-1',
    from: [
      'tap-06-bai-06-hai-piano-course-001-lesson-006-003',
      'tap-06-bai-06-rule-bossa-nova-tempo-001',
      'tap-06-bai-06-rule-bossa-nova-articulation-001',
    ],
    note: 'Bossa Nova của thầy Hải — mượn ô nhịp Bossa Nova có sẵn, tay trái luân phiên gốc và quãng 5 liền tiếng, tay phải dập chát gọn. Slow Bossa 110-125 BPM theo kho.',
  },
  {
    /*
      Bài 07. Kho: "Mẫu 1 - Tiết tấu Rumba cơ bản: Tay trái đi nốt Bass nền và
      các nốt rải hợp âm (Fa - La - Do - Mi đối với Fmaj7), tay phải giậm hợp âm
      vào các phách phụ (lặng - chát - lặng - chát)."
    */
    id: 'hai-rumba',
    name: 'Rumba (Hải)',
    family: 'hai-rumba',
    familyName: 'Rumba (Hải)',
    variant: 1,
    bpm: 100,
    cStep: 1,
    bStep: 1,
    chord: '. x . x',
    bass: '1 2 3 4',
    from: ['tap-06-bai-07-lesson-07-00002'],
    note: 'Rumba của thầy Hải — tay trái rải bốn nốt hợp âm, tay phải giậm phách phụ: lặng chát lặng chát. Kho không nói tốc độ, 100 BPM là mức KeyTrain chọn.',
  },
  {
    /*
      Bài 08. Kho: "Mẫu 1 - Medium Swing cơ bản: Tay trái giữ nốt Bass ở phách
      chính, Tay phải đệm chát/dập hợp âm rơi vào phách nhẹ/nghịch phách"; luật
      riêng: tay phải không dập vào đầu phách mạnh.

      Mượn ô nhịp `swing-1` của OneMotion, vốn đã mang `feel: 'swing'` để bộ
      phát tiếng kéo nhịp lệch đúng kiểu jazz.
    */
    id: 'hai-swing',
    name: 'Swing (Hải)',
    family: 'hai-swing',
    familyName: 'Swing (Hải)',
    variant: 1,
    bpm: 130,
    feel: 'swing',
    map: 'swing-1',
    from: [
      'tap-06-bai-08-hai-piano-course-001-t06-b08-003',
      'tap-06-bai-08-r-swing-offbeat-accent',
    ],
    note: 'Swing của thầy Hải — mượn ô nhịp Swing có sẵn: tay trái giữ bass phách chính, tay phải chát vào nghịch phách, không dập đầu phách mạnh.',
  },
  {
    /*
      Bài 09. Kho: Waltz nhịp 3/4, 110-120 BPM, nhanh hơn Boston.

      Mượn ô nhịp `waltz-1` của OneMotion cho khung 3/4 chuẩn; chỗ phân biệt với
      Boston nằm ở tốc độ, đúng như luật `rule-waltz-tempo-distinction`.
    */
    id: 'hai-waltz',
    name: 'Waltz (Hải)',
    family: 'hai-waltz',
    familyName: 'Waltz (Hải)',
    variant: 1,
    ts: '3/4',
    bar: 3,
    bpm: 115,
    feel: 'waltz-oom-pah-pah',
    map: 'waltz-1',
    from: [
      'tap-06-bai-09-lesson-id-00036',
      'tap-06-bai-09-rule-waltz-tempo-distinction',
    ],
    note: 'Waltz 3/4 của thầy Hải — mượn ô nhịp Waltz có sẵn, chạy ở 110-120 BPM. Cùng khung nhịp với Boston nhưng nhanh hơn hẳn, đó là chỗ kho bảo phải phân biệt.',
  },
  {
    /*
      Bài 10. Kho: "Mẫu 1 Ballad Dân Ca: Tiết điệu đệm cơ bản nhịp 4/4 với tay
      trái giữ nốt Bass/Quãng 8 và tay phải đánh hợp âm đệm nhẹ ngắt nhịp
      (bùm-chát)."
    */
    id: 'hai-ballad-dan-ca',
    name: 'Ballad Dân Ca (Hải)',
    family: 'hai-ballad-dan-ca',
    familyName: 'Ballad Dân Ca (Hải)',
    variant: 1,
    bpm: 72,
    cStep: 1,
    bStep: 1,
    chord: '. xs . xs',
    bass: '1 . 1+ .',
    from: ['tap-06-bai-10-hai-piano-001-t06-b10-002'],
    note: 'Ballad Dân Ca của thầy Hải — bùm chát: tay trái giữ nốt bass rồi quãng 8, tay phải đệm hợp âm nhẹ ngắt nhịp. Kho không nói tốc độ, 72 BPM là mức KeyTrain chọn.',
  },
  {
    /*
      Bài 11. Kho: "Mẫu 1 đệm Pop Rock: Tay trái đánh nốt Bass ở phách 1 và đảo
      phách nhẹ (đúp bass / chồm phách). Tay phải dậm hợp âm ngắn/gọn vào phách
      2 và 4 (phách nhẹ)."
    */
    id: 'hai-pop-rock',
    name: 'Pop Rock (Hải)',
    family: 'hai-pop-rock',
    familyName: 'Pop Rock (Hải)',
    variant: 1,
    bpm: 110,
    cStep: 1,
    bStep: 0.5,
    chord: '. xs . xs',
    bass: '1 . . 1s 1 . . .',
    from: ['tap-06-bai-11-tap-06-bai-11-00004'],
    note: 'Pop Rock của thầy Hải — tay trái bass phách 1 kèm một nhịp chồm phách, tay phải dậm hợp âm gọn vào phách 2 và 4.',
  },
  {
    /*
      Bài 12. Kho: "Tango Mẫu 2 (Nốt đen đều đặn & Chồm phách 4)"; luật riêng:
      cả hai tay đều nhả phím nhanh (staccato).

      Mượn ô nhịp `tango-1` của OneMotion cho hình tango dứt khoát, giữ đúng
      tính nhịp bước khiêu vũ mà kho nói tới.
    */
    id: 'hai-tango',
    name: 'Tango (Hải)',
    family: 'hai-tango',
    familyName: 'Tango (Hải)',
    variant: 1,
    bpm: 120,
    map: 'tango-1',
    from: [
      'tap-06-bai-12-tap-06-bai-12-004',
      'tap-06-bai-12-rule-tango-rhythm-staccato-001',
    ],
    note: 'Tango của thầy Hải — mượn ô nhịp Tango có sẵn. Kho nhấn mạnh cả hai tay đều nhả phím nhanh để giữ độ nảy của nhịp bước khiêu vũ.',
  },
  {
    /*
      Bài 13. Kho: "Mẫu 1: Mẫu tiết tấu Cha Cha Cha đệm 2 tay quãng xa octave.
      Hai tay chơi tiết tấu đồng bộ nhưng lệch quãng rộng, nhấn vào các phách
      nhẹ và đảo phách."

      Hai tay đi đồng bộ nên ô nhịp hai bên giống nhau, chỉ lệch quãng tám. Hình
      cha-cha-cha (phách 1, 2, 3, rồi phách 4 tách đôi) là hình chuẩn của điệu
      này; kho không đánh số từng phách nên phần chia phách là cách đọc của
      KeyTrain.
    */
    id: 'hai-cha-cha',
    name: 'Cha Cha Cha (Hải)',
    family: 'hai-cha-cha',
    familyName: 'Cha Cha Cha (Hải)',
    variant: 1,
    bpm: 120,
    cStep: 0.5,
    bStep: 0.5,
    chord: 'x . x . x . xs xs',
    bass: '1 . 1 . 1 . 1s 1+s',
    from: ['tap-06-bai-13-hai-piano-course-001-tap-06-bai-13-002'],
    note: 'Cha Cha Cha của thầy Hải — hai tay đi đồng bộ, cách nhau quãng tám. Kho không đánh số từng phách, nên hình chát tách đôi ở phách 4 là cách đọc của KeyTrain.',
  },
  {
    /*
      Bài 14. Kho: "Mẫu 1 (Reggae cơ bản): Tay trái đánh nốt Bass ở phách 1 và
      phách 3 (nốt gốc và nốt bậc 5). Tay phải giật hợp âm staccato sắc nét vào
      các phách lẻ/sau phách (off-beat)."
    */
    id: 'hai-reggae',
    name: 'Reggae (Hải)',
    family: 'hai-reggae',
    familyName: 'Reggae (Hải)',
    variant: 1,
    bpm: 80,
    cStep: 0.5,
    bStep: 1,
    chord: '. xs . xs . xs . xs',
    bass: '1 . 1f .',
    from: [
      'tap-06-bai-14-hai-piano-course-001-tap-06-bai-14-003',
      'tap-06-bai-14-rule-reggae-rh-offbeat-staccato',
    ],
    note: 'Reggae của thầy Hải — tay trái bass gốc ở phách 1 và quãng 5 ở phách 3, tay phải giật staccato đúng vào sau phách.',
  },
  {
    /*
      Bài 15. Kho: "Mẫu 1: Hai tay bấm hợp âm giữ nhịp MARCH. Nhịp 4/4 gồm các
      nốt đen kết hợp chùm 3 (triplet) ở phách cuối"; luật riêng: chùm ba nằm ở
      nửa sau phách để mô phỏng tiếng trống hành khúc, và tay trái đi quãng 8.

      Chùm ba là lý do ô nhịp này bước theo một phần ba phách chứ không theo nốt
      kép như các điệu khác.
    */
    id: 'hai-march',
    name: 'March (Hải)',
    family: 'hai-march',
    familyName: 'March (Hải)',
    variant: 1,
    bpm: 112,
    cStep: TRIPLET,
    bStep: TRIPLET,
    chord: 'x! . . x . . x . . x x x',
    bass: '11+ . . 11+ . . 11+ . . 11+ . .',
    from: [
      'tap-06-bai-15-lesson-15-00002',
      'tap-06-bai-15-r-march-001',
      'tap-06-bai-15-r-march-octave-bass',
    ],
    note: 'March của thầy Hải — nốt đen dậm rõ từng phách, chùm ba ở phách cuối cho ra tiếng trống hành khúc; tay trái đi quãng 8 cho dày.',
  },
]

/** Ô nhịp của một điệu OneMotion, để điệu của thầy mượn lại. */
function borrowedCell(oneMotionId: string): RhythmCell | null {
  return ONEMOTION_STYLES.find((style) => style.id === oneMotionId)?.cell ?? null
}

export const HAI_STYLES: readonly StylePattern[] = DEFS.map((def) => ({
  id: def.id,
  name: def.name,
  family: def.family,
  familyName: def.familyName,
  variant: def.variant,
  timeSignature: def.ts ?? '4/4',
  beatsPerMeasure: Number((def.ts ?? '4/4').split('/')[0]),
  bpm: def.bpm,
  feel: def.feel ?? 'straight-block-chord',
  verified: true,
  /*
    Biến tấu của KeyTrain ghi thẳng là biến tấu, không mượn id item của thầy.
    Dẫn một id `PianoBrain:` ở đây nghĩa là "chỗ này thầy dạy đúng như vậy" —
    nói thế cho một ô nhịp mình tự soạn là bịa.
  */
  sourceVideos: def.variation
    ? ['KeyTrain: biến tấu dựng từ Pop Ballad (Hải), không phải sheet thầy Hải']
    : def.from.map((id) => `PianoBrain: ${id}`),
  cell: def.map
    ? borrowedCell(def.map)
    : cellFromArps(
        def.chord ?? '',
        def.bass ?? '',
        def.cStep ?? 0.25,
        def.bStep ?? 0.25,
        def.bar ?? 4,
      ),
  note: def.note,
}))

/** Điệu nào mượn ô nhịp của điệu OneMotion nào. Rỗng nghĩa là ô nhịp dựng mới. */
export const HAI_BORROWED_CELLS: Readonly<Record<string, string>> =
  Object.fromEntries(
    DEFS.filter((def) => def.map).map((def) => [def.id, def.map as string]),
  )
