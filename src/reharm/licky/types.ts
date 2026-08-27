import type { MidiNote } from '../../shared/musicTheory/types'
import type { SongKey } from '../fillSoloGenerator/soloVocabulary'
import type { ParsedChord } from '../types'

export type LickyMode = 'clone' | 'create'
export type LickyKind = 'fill' | 'run'

export interface LickNote {
  interval: number
  dur: number
  at: number
}

export interface LickPhrase {
  id: string
  label: string
  kind: LickyKind
  span: number
  notes: LickNote[]
}

export interface PlacedNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  isGrace: false
  hand?: 'left' | 'right'
}

export interface PlaceOptions {
  chord: ParsedChord
  next?: ParsedChord
  startBeat: number
  beats: number
  take?: number
  mode?: LickyMode
  kind: LickyKind
  key?: SongKey | null
  /**
   * Trần số nốt của câu. Bỏ trống thì theo `noteCount` như cũ.
   *
   * Nhịp kép chia nhỏ dày, nên cùng một quãng thời gian mà nhồi 5-6 nốt là câu
   * chạy nghe gấp gáp, tranh chỗ với giọng hát thay vì dẫn vào ô nhịp sau.
   */
  maxNotes?: number
  /**
   * Tầm cao độ đặt câu. Bỏ trống thì dùng tầm tay phải.
   *
   * Câu lót slow rock là **chạy bass**: ở nửa sau ô nhịp tay phải còn giữ hợp âm
   * ngân, bè trầm mới là bè còn chỗ trống.
   */
  register?: { low: number; high: number }
  /**
   * Đi thẳng một đường bè trầm: **từ nốt gốc hợp âm đang chơi bò tới nốt gốc
   * hợp âm kế tiếp**, chia đều số nốt trên thang.
   *
   * Khác hẳn cách dựng câu mặc định. Mặc định lấy một hình interval trong sổ
   * Licky, xáo trộn chỗ bắt đầu, rồi cho nốt cuối hạ cánh vào **bậc ba** hợp âm
   * sau — hợp cho câu lót giai điệu. Câu chạy bass thì không phải câu, nó là
   * một đường dẫn: người nghe phải nhận ra nó đang bò từ đâu tới đâu, nên chỗ
   * bắt đầu và chỗ kết đều phải chắc, không xáo.
   */
  bassWalk?: boolean
}
