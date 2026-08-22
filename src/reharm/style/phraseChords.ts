import { chordAtDegree } from '../../shared/musicTheory/scales'
import { pullChordFor } from './turnaround'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Vòng hợp âm của đoạn dạo đầu và đoạn kết.
 *
 * Bộ não soạn **nốt tay phải** cho hai đoạn này trên vòng bậc `I - V - vi - IV`
 * (dạo đầu) và `I` (kết bài). Nhưng nó chỉ trả về nốt, không trả về hợp âm — mà
 * phần đệm thì cần hợp âm thật để quạt theo điệu đang chọn.
 *
 * Không có bước này thì đoạn dạo chỉ có một dòng nốt tay phải bay lơ lửng,
 * không có bass đỡ bên dưới: nghe như ai đó tập gam chứ không như một đoạn dạo.
 *
 * Vòng phải khớp **đúng** vòng não dùng, nếu không hai tay chơi hai hợp âm khác
 * nhau — xem `DEFAULT_PROGRESSION` trong `../brain/phrase.ts`.
 */
const DEGREES: Readonly<Record<'intro' | 'outro', readonly number[]>> = {
  intro: [1, 5, 6, 4],
  /*
    Kết bài dài **ba** ô: một ô dẫn ở bậc V rồi hai ô đậu lại ở bậc I.

    Bộ não soạn câu rải ngược trên bậc I, chiếm hai ô. Ô bậc V đứng trước là
    phần của KeyTrain — nó là chỗ *dẫn về*, để câu kết không rơi đột ngột từ
    đoạn hát thẳng vào hợp âm chủ. Nốt não vì thế phải dời sang sau một ô.
  */
  outro: [5, 1, 1],
}

/** Ô đầu của đoạn kết là ô dẫn, nốt của não bắt đầu từ ô sau. */
export const OUTRO_LEAD_BARS = 1

/**
 * Dựng hợp âm cho đoạn dạo, theo giọng của bài.
 *
 * Giọng thứ quy về giọng trưởng song song, cùng lý do như mọi chỗ khác dùng bậc
 * của kho: các bậc `I - V - vi - IV` được đánh số theo giọng trưởng.
 */
export function phraseChords(
  kind: 'intro' | 'outro',
  key: { tonic: PitchClass; scale: ScaleType } | null,
): ParsedChord[] {
  if (!key) return []

  const tonic: PitchClass =
    key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic

  const out: ParsedChord[] = []
  for (const degree of DEGREES[kind]) {
    const chord = chordAtDegree(tonic, 'major', degree)
    if (!chord) continue
    out.push({
      root: chord.root,
      quality: chord.quality,
      ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
      source: chord.symbol,
      symbol: chord.symbol,
    })
  }

  return out
}

/**
 * Hợp âm **báo**: một phách hút mạnh về hợp âm mở bài, đánh sau khi vòng dạo
 * đầu đã chạy trọn.
 *
 * Vòng I - V - vi - IV kết ở bậc IV, mà bậc IV thì đưa đẩy chứ không kéo — ca
 * sĩ nghe xong không biết mình vào ở đâu. Một phách hợp âm át của **chính hợp
 * âm mở bài** thì chỗ vào rõ hẳn: tai đã quen chờ hợp âm át giải quyết.
 *
 * Một phách thôi, không phải một ô. Kéo dài cả ô thì nó thành một hợp âm của
 * vòng, và cái vòng bốn ô vốn đã trọn vẹn lại bị đèo thêm một đuôi.
 */
export function cueChord(target: ParsedChord | null | undefined) {
  return target ? pullChordFor(target) : null
}
