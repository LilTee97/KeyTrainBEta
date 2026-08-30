import type { MidiNote } from '../../shared/musicTheory/types'

/**
 * Mô tả một điệu đệm.
 *
 * Theo phân loại ở Reference/phongcachdemhatkhabu.md mục 19, nhịp là điều kiện
 * cần chứ không đủ: ballad, bossa nova và swing đều là nhịp 4/4 nhưng cách chia
 * phách khác hẳn nhau. Vì vậy phải tra theo **hai trục**: nhịp và feel.
 */
export type Feel =
  /** Hợp âm khối bám nhịp đổi hợp âm. */
  | 'straight-block-chord'
  /** Lệch phách kiểu bossa, chu kỳ 3+3+2. */
  | 'syncopated-3-3-2'
  /** Móc đơn chia chùm ba, tỉ lệ dài ngắn 2:1. */
  | 'swing'
  /** Bùm chát chát của điệu valse. */
  | 'waltz-oom-pah-pah'

/**
 * Chơi cả hợp âm hay chỉ một nốt trong đó.
 *
 * Điệu swing cần cái này: tay phải đánh xen kẽ hợp âm rơi vào phách và một nốt
 * đơn ở chỗ nảy ngay sau.
 */
export type HitVoice = 'chord' | 'top' | 'bottom'

/** Một tiếng đàn trong mẫu tiết tấu. */
export interface RhythmHit {
  /** Vị trí trong mẫu, tính bằng phách từ 0. */
  beat: number
  durationBeats: number
  /**
   * Hệ số cường độ, 1 là mức chuẩn.
   * Phách mạnh để cao hơn để mẫu tiết tấu nghe có sức nặng.
   */
  velocityScale?: number
  /** Mặc định đánh cả hợp âm. */
  voice?: HitVoice
    /**
     * Nốt thứ mấy trong thế bấm (0 = nốt thấp nhất). Có thì chỉ đánh một nốt —
     * dùng cho mẫu rải Basic / Arp của OneMotion.
     */
    toneIndex?: number
    /**
     * Nhiều nốt (1, 13, 1f…) — OneMotion ghi số thứ tự nốt hợp âm.
     *
     * `fromRoot` đổi cách hiểu con số: thay vì "nốt thứ mấy trong thế bấm", nó
     * lấy **nốt gốc của hợp âm** rồi đặt vào tầm của thế bấm ấy. Cần cờ này vì
     * thế bấm sắp theo cao độ, không theo bậc: hợp âm La thứ bấm thể đảo thành
     * Đô - Mi - La thì nốt thấp nhất là Đô, và câu rải mở bằng "nốt thứ nhất"
     * sẽ mở bằng bậc ba chứ không phải nốt gốc.
     */
    tones?: readonly {
      toneIndex: number
      semitones?: number
      fromRoot?: boolean
    }[]
  }

/** Mẫu tiết tấu lặp lại của một điệu. */
export interface RhythmCell {
  /** Độ dài mẫu tính bằng phách, có thể dài hơn một ô nhịp. */
  lengthBeats: number
  right: RhythmHit[]
  left: RhythmHit[]
}

export interface StylePattern {
  id: string
  name: string
  /** Nhóm trên UI, ví dụ `rock` → nút Rock rồi chọn Rock 1/2/3. */
  family: string
  familyName: string
  /** 1, 2, 3… trong cùng họ. */
  variant: number
  timeSignature: string
  beatsPerMeasure: number
  /** BPM mặc định trên OneMotion. Bài hát ghi đè. */
  bpm: number
  feel: Feel
  /**
   * Một ô lưới của mẫu đáng **mấy nốt đen**. Bỏ trống là 1.
   *
   * Đây là cần gạt tách **tốc độ mẫu đệm** khỏi **tốc độ mọi thứ khác**. Kéo BPM
   * thì câu fill, câu solo, câu lick nhanh lên theo — nhiều khi không muốn vậy.
   * `gridUnit` chỉ co ô nhịp của mẫu; fill và solo dựng ở `fillSoloGenerator` và
   * `phraseSection`, tính bằng nốt đen, nên đứng yên.
   *
   * Nhịp mẫu số 8 về lý thuyết là 0.5 (một ô lưới = móc đơn). Nhưng nó là số
   * thực, chỉnh được tự do — đó mới là chỗ dùng được: dò cho khớp video mà không
   * phải đụng tới BPM.
   *
   * Vì sao là tuỳ chọn chứ không suy từ `timeSignature`: mấy điệu 6/8 có sẵn
   * (Flamenco, Slow Rock 6/8 của thầy Hải) vốn soạn theo quy ước nốt đen và BPM
   * của chúng đã chọn để bù. Suy tự động là phá cả ba.
   */
  gridUnit?: number
  /**
   * Câu lót chiếm mấy **nốt đen** cuối mỗi hợp âm. Bỏ trống thì
   * `generateFillLine` tự chọn `min(1.5, beatsPerChord / 2)`.
   *
   * Mặc định ấy hợp với 4/4. Với nhịp kép nó ăn quá rộng: ô nhịp 6/8 dài 3 nốt
   * đen thì fill chiếm 1.5 — tức **ba ô lưới cuối**, bắt đầu ngay từ phách 4.
   * Slow rock thì câu lót thuộc về **phách 6**, một ô lưới thôi, để nó là câu
   * dẫn qua vạch nhịp chứ không phải nửa ô nhịp.
   *
   * Điệu tự khai con số của nó, không suy hộ điệu khác — Flamenco và Slow Rock
   * 6/8 của thầy Hải không khai nên giữ nguyên hành vi cũ.
   */
  fillBeats?: number
  /**
   * Câu lót nhiều nhất mấy nốt. Bỏ trống thì `placeLick` tự chọn 3-6.
   *
   * Nhịp kép chia nhỏ dày, nên nhồi 5-6 nốt vào một ô lưới là câu chạy nghe gấp
   * gáp và tranh chỗ với giọng hát, thay vì dẫn êm vào ô nhịp sau.
   */
  fillMaxNotes?: number
  /**
   * Tỉ lệ câu lót chạy ở **bè trầm** thay vì bè giai điệu, 0 tới 1.
   *
   * Bỏ trống thì suy từ nhịp: **0.8 cho nhịp mẫu số 8**, 0 cho còn lại. Slow
   * rock và các điệu 6/8 khác đều thế: nửa sau ô nhịp tay phải còn giữ hợp âm
   * ngân, bè trầm mới là bè còn chỗ trống — nên câu lót thuộc về bè trầm.
   *
   * Là tỉ lệ chứ không phải công tắc, vì đệm hát mà câu lót nào cũng y một kiểu
   * thì thành máy. Hai phần mười còn lại vẫn ra câu lót giai điệu, đủ để tai
   * không đoán trước được. Điệu nào muốn chắc chắn thì tự khai 1 hoặc 0.
   */
  fillBassChance?: number
  /**
   * Trần tay trái của riêng điệu này, tính bằng số MIDI. Bỏ trống là trần chung.
   *
   * Trần chung là Son quãng tám 3 (55): hai tay không dùng chung quãng, tay trái
   * không trèo lên chỗ tay phải. Luật ấy đúng cho thế bấm, và đúng cho gần hết
   * điệu — kể cả điệu bè trầm có dấu quãng tám, vì bậc 8 của chúng vẫn bị kẹp
   * xuống và không ai thấy thiếu.
   *
   * Thế **1-5-8-10** thì không lọt: bậc mười tự nó đã cao hơn nốt gốc mười lăm
   * nửa cung, mà cửa sổ từ sàn tay trái tới trần chung chỉ rộng mười chín — nên
   * chỉ vài giọng vừa, còn Fa, Si giáng, Si thì bậc đỉnh bị gấp xuống một quãng
   * tám và câu rải đang đi lên thì sụp.
   *
   * Là khai báo của từng điệu chứ không phải luật mới, vì nới trần cho mọi điệu
   * có dấu quãng tám là đổi tiếng của cả thư viện OneMotion — bè trầm Pop 1
   * đang chơi nốt gốc hai lần sẽ hoá thành nốt gốc rồi bậc 8.
   */
  leftHandTop?: number

  /**
   * Trần số cú gõ tay trái ở đoạn solo, nếu điệu này cần nới.
   *
   * Mặc định 6, đo trên đoạn giang tấu của Cà Pháo (3,4-5,8 cú mỗi ô). Trần ấy
   * để giai điệu còn khe mà lách. Bản ĐỘC TẤU thì khác: tay trái gánh cả phần
   * đệm nên chín cú mỗi ô là thật, và cắt xuống sáu là cắt mất chữ ký — trên
   * Bolero rải, phép cắt bỏ đúng cặp móc kép vì cặp ấy nhẹ nhất.
   *
   * Nới được vì chỗ giai điệu đã có `interlockHands` lo theo mật độ, tinh hơn
   * hẳn một cái trần cứng.
   */
  soloMaxStrikes?: number
  /**
   * Phần trường độ thật sự kêu. Bỏ trống thì dùng mặc định 0.92.
   *
   * Trên 1 là **chồng tiếng**, cố ý: giữ phím cũ quá nốt mới một chút, đúng cách
   * tay người đàn legato. Khít bằng 0 vẫn nghe ra khe vì nhả đúng khoảnh khắc
   * gõ thì đàn có một cái hụt. Không sợ nhoè: `holdUntilStruckAgain` vẫn cắt
   * chỗ cùng tay cùng cao độ, `clipToChords` vẫn cắt ở chỗ đổi hợp âm.
   *
   * `renderPattern` xén bớt độ ngân của mọi tiếng để hai hợp âm liền nhau không
   * chồng tiếng. Con số ấy vốn chỉ là tuỳ chọn lúc dựng, nên **không đi theo
   * điệu**: điệu soạn ở PatternTester nghe liền mạch, xuất sang đây lại hở một
   * khoảng nhỏ trước mỗi tiếng kế. Điệu nào cần nối sát thì tự mang con số của
   * nó. Điệu cũ không có trường này nên nghe y như trước.
   */
  releaseRatio?: number
  /**
   * Điệu này đã được xác nhận trực tiếp từ video của kênh hay chưa.
   *
   * Tài liệu nguồn tự phân biệt rõ điệu đã xem tận mắt với điệu chỉ liệt kê
   * theo kiến thức nhạc lý phổ thông. Giữ lại phân biệt đó để KeyTrain không
   * bao giờ bịa ra mẫu tiết tấu cho một điệu chưa kiểm chứng.
   */
  verified: boolean
  /** Tên video nguồn, chỉ có với điệu đã xác nhận. */
  sourceVideos?: string[]
  /**
   * Mẫu tiết tấu cố định, hoặc null nếu điệu này không có mẫu dùng chung.
   *
   * Ballad là trường hợp null: tài liệu mục 13-16 kết luận ballad **không có**
   * một mẫu tiết tấu chuyển giao được giữa các bài, mà chơi hợp âm khối bám
   * theo nhịp đổi hợp âm của từng bài.
   */
  cell: RhythmCell | null
  /** Giải thích ngắn cho người dùng. */
  note: string
}

/** Một tiếng đàn đã được xếp vào dòng thời gian, sẵn sàng để phát. */
export interface TimelineEvent {
  notes: MidiNote[]
  /** Thời điểm bắt đầu, tính bằng phách từ đầu đoạn. */
  startBeat: number
  durationBeats: number
  hand: 'left' | 'right'
  /** Lực nhấn theo thang MIDI 0-127. */
  velocity: number
  /**
   * Nốt láy — cái vuốt vào nốt chính, không phải một nốt của câu nhạc.
   *
   * Cần đánh dấu vì chế độ chờ đánh đúng nốt phải bỏ qua chúng: nốt láy vang
   * trước nốt chính đúng một nốt kép, nên nếu tính thành chặng riêng thì người
   * tập phải bấm nó, chờ, rồi mới bấm nốt chính — mà nốt láy vốn là một cú
   * vuốt liền tay, không phải hai lần bấm.
   */
  grace?: boolean
}
