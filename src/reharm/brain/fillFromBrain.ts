import { generateFill } from './index'
import { maySound } from './gate'
import type { SoundMode } from './gate'
import { brain } from './index'
import { degreeOf } from '../reharmEngine/degreeAnalysis'
import type { ParsedChord } from '../types'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { SoloNote } from '../fillSoloGenerator/soloGenerator'

/**
 * Hỏi bộ não PianoBrain xem **câu lót ở chỗ này thầy Kingsley chơi thế nào**.
 *
 * Não trả lời theo bậc La Mã và luật đã rút từ video, chứ không theo cảm tính:
 * `1-7-5-3` chỉ bắn khi ô ngay trước bậc vi đúng là bậc I, còn G sang Am thì
 * lùi về `preceding 3-2-1`. KeyTrain không nhắc lại mấy luật đó — nó chỉ hỏi.
 *
 * Hỏi từng chỗ một, mỗi lần đúng hai ô (ô đang chơi và ô đích), nên vị trí câu
 * lót do KeyTrain quyết (`fillPositions`, `breaths`), còn **hình câu** do não
 * quyết. Chỗ nào não không có luật khớp thì trả `null` và KeyTrain giữ nguyên
 * câu fill cũ của mình — thiếu thì nói thiếu, không bịa ra công thức mới.
 */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** Bậc La Mã trơn, không kèm hậu tố tính chất — đúng thứ PianoBrain đọc được. */
function plainRoman(chord: ParsedChord, tonic: PitchClass, scale: ScaleType): string | null {
  const degree = degreeOf(chord.root, tonic, scale)
  if (degree === null) return null
  const numeral = ROMAN[degree - 1]
  return chord.quality.intervals.includes(3) ? numeral.toLowerCase() : numeral
}

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/**
 * Não đọc bậc theo **giọng trưởng**, nên bài giọng thứ phải quy về giọng
 * trưởng song song trước khi hỏi.
 *
 * Không phải mẹo cho xong: La thứ và Đô trưởng dùng chung bộ nốt, nên vòng
 * Am - F - C - G của bài giọng thứ chính là vi - IV - I - V của Đô trưởng —
 * đúng thứ luật Kingsley nói tới. Quy về xong thì `1-7-5-3` vẫn chỉ bắn khi ô
 * trước bậc vi thật sự là bậc I, y như ở bài giọng trưởng.
 *
 * Trước đây chỗ này truyền thẳng "Am" sang não. Não chỉ hiểu tên nốt nên nó
 * ném lỗi, và vì câu lót chạy trong lúc dựng giao diện, cả trang trắng theo.
 */
const relativeMajor = (key: { tonic: PitchClass; scale: ScaleType }): PitchClass =>
  key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic

/** "1/16" -> 0,25 phách. Não ghi trường độ theo nốt, KeyTrain đếm theo phách. */
const beatsOfDur = (dur: string): number => {
  const [, denominator] = dur.split('/')
  const n = Number(denominator)
  return Number.isFinite(n) && n > 0 ? 4 / n : 0.5
}

export interface BrainFillRequest {
  chord: ParsedChord
  next: ParsedChord
  /** Phách bắt đầu của ô đang chơi, tính từ đầu vòng. */
  chordStartBeat: number
  key: { tonic: PitchClass; scale: ScaleType } | null
  /** Mức nguồn gốc tối thiểu để được thành tiếng. Xem `gate.ts`. */
  mode?: SoundMode
}

export function brainFill(request: BrainFillRequest): SoloNote[] | null {
  const { chord, next, chordStartBeat, key, mode } = request
  if (!key) return null

  const tonic = relativeMajor(key)
  const here = plainRoman(chord, tonic, 'major')
  const there = plainRoman(next, tonic, 'major')
  // Hợp âm ngoài giọng thì luật bậc của não không áp được. Trả về cho KeyTrain lo.
  if (!here || !there) return null

  /*
    Hỏi đúng hai ô, không đưa `vocal`. Chỗ ca sĩ nghỉ đã được `fillPositions`
    và `breaths` cân nhắc xong rồi; đưa thêm vào đây thì não lại đi chọn chỗ
    lần nữa trong cái cửa sổ hai ô này, tức là hai bên cùng quyết một việc.
  */
  /*
    Não hỏng thì câu fill cũ của KeyTrain chạy tiếp, chứ không được kéo sập cả
    trang. Câu lót là đồ trang trí; bài hát vẫn phải đệm được khi nó hụt.
  */
  let plan
  try {
    plan = generateFill(
      { key: NOTE_NAMES[tonic], progression: [here, there] },
      brain(),
    )
  } catch {
    return null
  }
  // Không có luật nào của Kingsley khớp: `bars` rỗng, `missing` nói rõ vì sao.
  if (!plan || plan.bars.length === 0 || plan.authorized_by.length === 0) return null
  /*
    Cửa chặn nguồn gốc: chỉ luật rút từ bài giảng có thật mới được thành tiếng.
    Suy luận chung hay câu tự soạn thì đọc được trong tab chat, nhưng không phát.
  */
  if (!maySound(plan.authorized_by, mode)) return null

  const notes: SoloNote[] = []
  for (const rh of plan.bars[0].rh) {
    if (rh.midi === undefined || rh.note === null) continue
    const duration = beatsOfDur(rh.dur)
    // `beat` của não đếm từ 1 trong ô nhịp; KeyTrain đếm từ đầu vòng.
    const startBeat = chordStartBeat + rh.beat - 1
    if (rh.grace !== undefined) {
      /*
        Nốt hoa mỹ nửa cung đi ngay trước nốt chính, mượn một chút thời gian của
        nó. Não ghi tên nốt (Bb4) chứ không ghi số, mà nó luôn thấp hơn nốt
        chính đúng một nửa cung, nên trừ một là ra.
      */
      notes.push({
        note: rh.midi - 1,
        startBeat: Math.max(0, startBeat - 0.125),
        durationBeats: 0.125,
        isGrace: true,
      })
    }
    notes.push({ note: rh.midi, startBeat, durationBeats: duration * 0.9, isGrace: false })
  }

  return notes.length > 0 ? notes : null
}
