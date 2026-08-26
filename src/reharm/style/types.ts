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
