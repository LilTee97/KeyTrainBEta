import { brain, generateIntro, generateOutro } from './index'
import { maySound } from './gate'
import type { SoundMode } from './gate'
import type { TimelineEvent } from '../style/types'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'

/**
 * Đoạn dạo đầu và đoạn kết, do bộ não soạn.
 *
 * Phân vai giữ đúng như mọi chỗ khác: **KeyTrain mở chỗ** — nó biết bài bắt đầu
 * ở đâu, đoạn kết dài mấy ô, và nó chèn đoạn vào thứ tự chơi; **não chọn vòng
 * hợp âm và nốt**. Não không biết gì về Tone.js, cũng không tự đặt đoạn dạo vào
 * bài.
 *
 * Luật thì nằm bên kho, không chép lại ở đây: intro dùng sus2 hoặc sus4 giải về
 * bậc ba và **không** treo ở bậc IV, outro rải ngược add2. Kho không có item
 * Kingsley nào cho phép thì `generateIntro` / `generateOutro` trả `null`, hàm
 * dưới đây trả mảng rỗng, và KeyTrain không chèn đoạn nào — thiếu thì nói
 * thiếu, không tự chế một đoạn dạo.
 */
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/** Vòng hợp âm mặc định cho đoạn dạo: I - V - vi - IV, bốn ô như đoạn giang tấu. */
const DEFAULT_PROGRESSION = ['I', 'V', 'vi', 'IV']

/** "1/16" -> 0,25 phách. */
const beatsOfDur = (dur: string): number => {
  const denominator = Number(dur.split('/')[1])
  return Number.isFinite(denominator) && denominator > 0 ? 4 / denominator : 1
}

export interface PhraseRequest {
  kind: 'intro' | 'outro'
  key: { tonic: PitchClass; scale: ScaleType } | null
  /** Số phách một ô nhịp, để xếp các ô của não nối tiếp nhau. */
  beatsPerMeasure?: number
  progression?: string[]
  /** Mức nguồn gốc tối thiểu để được thành tiếng. Xem `gate.ts`. */
  mode?: SoundMode
}

export interface BrainPhrase {
  events: TimelineEvent[]
  lengthBeats: number
  /** Item Kingsley cho phép đoạn này. Rỗng thì không được dán nhãn thầy. */
  authorizedBy: string[]
  /** Chỗ kho chưa có, nói thẳng cho người học. */
  missing: string[]
}

export function brainPhrase(request: PhraseRequest): BrainPhrase | null {
  const { kind, key, beatsPerMeasure = 4, progression = DEFAULT_PROGRESSION, mode } = request
  if (!key) return null

  /*
    Giọng thứ quy về giọng trưởng song song, cùng lý do như câu lót: kho của
    thầy đánh số bậc theo giọng trưởng.
  */
  const tonic: PitchClass =
    key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic

  let plan
  try {
    const input = { key: NOTE_NAMES[tonic], progression }
    plan = kind === 'intro' ? generateIntro(input, brain()) : generateOutro(input, brain())
  } catch {
    return null
  }
  if (!plan || plan.bars.length === 0 || plan.authorized_by.length === 0) return null
  // Cùng cửa chặn như câu lót: chỉ luật của thầy thật mới được thành tiếng.
  if (!maySound(plan.authorized_by, mode)) return null

  const events: TimelineEvent[] = []

  plan.bars.forEach((bar, index) => {
    const barStart = index * beatsPerMeasure

    /*
      Tay trái của não ghi bằng chữ ("C2 + G2, quãng 1-5, ngân cả ô") chứ không
      ghi số, nên chỗ này không đoán lại nốt trầm. Tay trái vẫn do phần đệm của
      KeyTrain lo; đoạn dạo chỉ đóng góp tuyến tay phải.
    */
    for (const rh of bar.rh) {
      if (rh.midi === undefined || rh.note === null) continue
      const startBeat = barStart + rh.beat - 1
      const durationBeats = beatsOfDur(rh.dur)

      if (rh.grace !== undefined) {
        // Nốt hoa mỹ nửa cung, luôn thấp hơn nốt chính đúng một nửa cung.
        events.push({
          notes: [(rh.midi - 1) as MidiNote],
          startBeat: Math.max(0, startBeat - 0.125),
          durationBeats: 0.125,
          hand: 'right',
          velocity: 62,
          grace: true,
        })
      }

      events.push({
        notes: [rh.midi as MidiNote],
        startBeat,
        durationBeats: durationBeats * 0.9,
        hand: 'right',
        velocity: 82,
        grace: false,
      })
    }
  })

  if (events.length === 0) return null

  return {
    events,
    lengthBeats: plan.bars.length * beatsPerMeasure,
    authorizedBy: plan.authorized_by,
    missing: plan.missing,
  }
}
