import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { PassingSuggestion } from '../reharmEngine/passingChordRules'
import type { ParsedChord } from '../types'

/**
 * Sinh câu nối giữa hợp âm bậc năm và hợp âm đích.
 *
 * Tài liệu mô tả ở mục 5: một **chuỗi hợp âm bảy giảm** bắc cầu cho nốt bass
 * đi bộ lên từ hợp âm bậc năm tới hợp âm đích. Ví dụ nguyên văn:
 *
 *     A7 → Bdim7 → C#dim7 → Dm7
 *
 * Nốt bass đi A → B → C# → D, tức **hai cung rồi nửa cung**. Cùng khuôn đó áp
 * cho G7 → C sẽ ra G → A → B → C. Hai ví dụ khớp nhau nên đây là công thức
 * chung, không phải trường hợp lẻ.
 *
 * Khác với hợp âm lướt ở `passingChordRules.ts` vốn chỉ chèn **một** hợp âm
 * vào một khe, câu nối ở đây lấp trọn quãng giữa hai hợp âm bằng nhiều bước.
 */

/** Bước đi của nốt bass trong câu nối, tính bằng nửa cung từ hợp âm bậc năm. */
const BASS_WALK_STEPS = [2, 4] as const

/** Quãng từ hợp âm bậc năm lên hợp âm đích: một quãng bốn đúng. */
const RESOLUTION_INTERVAL = 5

/** Dựng một hợp âm bảy giảm trên nốt cho trước. */
function dim7On(root: PitchClass): ParsedChord | null {
  const quality = getChordQuality('dim7')
  if (!quality) return null

  const symbol = `${pitchClassName(root)}${quality.symbol}`
  return { root, quality, source: symbol, symbol }
}

/**
 * Hợp âm này có đang làm chức năng bậc năm không.
 *
 * Nhận theo cấu tạo chứ không theo tên: có bậc bảy thứ và không có bậc ba thứ.
 * Cách này bắt được cả hợp âm treo như `D9sus4` — không có bậc ba nào nhưng
 * vẫn đóng vai bậc năm.
 */
function actsAsDominant(chord: ParsedChord): boolean {
  const intervals = chord.quality.intervals
  return intervals.includes(10) && !intervals.includes(3)
}

/**
 * Tìm các chỗ chèn được câu nối bằng chuỗi hợp âm giảm.
 *
 * Chỉ áp khi hợp âm bậc năm giải quyết lên đúng một quãng bốn — đó là chuyển
 * động mà công thức trong tài liệu dựa vào.
 */
export function suggestDim7ChainFills(
  chords: readonly ParsedChord[],
  options: { includeTurnaround?: boolean } = {},
): PassingSuggestion[] {
  const { includeTurnaround = true } = options
  if (chords.length < 2) return []

  const suggestions: PassingSuggestion[] = []

  /** Dựng đề xuất cho một cặp bậc năm và hợp âm đích, nếu áp được. */
  function tryPair(
    dominant: ParsedChord,
    target: ParsedChord,
    insertBeforeIndex: number,
    isTurnaround: boolean,
  ): void {
    if (!actsAsDominant(dominant)) return
    if (
      normalizePitchClass(target.root - dominant.root) !== RESOLUTION_INTERVAL
    ) {
      return
    }

    const chain = BASS_WALK_STEPS.map((step) =>
      dim7On(normalizePitchClass(dominant.root + step)),
    ).filter((chord): chord is ParsedChord => chord !== null)

    if (chain.length !== BASS_WALK_STEPS.length) return

    const walk = [
      dominant.root,
      ...chain.map((chord) => chord.root),
      target.root,
    ]
      .map((pitch) => pitchClassName(pitch))
      .join(' → ')

    suggestions.push({
      insertBeforeIndex,
      chords: chain,
      technique: 'dim7-chain-fill',
      explanation: isTurnaround
        ? `Câu quay đầu: nối ${dominant.symbol} cuối vòng về ${target.symbol} đầu vòng, bass đi bộ ${walk}.`
        : `Câu nối lấp quãng giữa ${dominant.symbol} và ${target.symbol}: bass đi bộ ${walk}.`,
    })
  }

  for (let index = 0; index < chords.length - 1; index += 1) {
    tryPair(chords[index], chords[index + 1], index + 1, false)
  }

  /*
    Vòng hợp âm được chơi lặp lại, nên hợp âm cuối vòng thực ra kéo về hợp âm
    đầu vòng. Đây chính là chỗ **vòng quay đầu** mà tài liệu nói tới, và cũng
    là chỗ đặt câu nối tự nhiên nhất — nếu chỉ xét các cặp liền nhau bên trong
    thì bỏ sót hẳn nó.
  */
  if (includeTurnaround) {
    tryPair(chords[chords.length - 1], chords[0], chords.length, true)
  }

  return suggestions
}
