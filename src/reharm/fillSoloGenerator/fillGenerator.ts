import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { PassingSuggestion } from '../reharmEngine/passingChordRules'
import type { ParsedChord } from '../types'

/**
 * Sinh câu nối lấp khoảng trống giữa hai hợp âm bằng chuỗi dim7.
 *
 * Tài liệu mục 5: bass đi bộ, mỗi bậc một dim7. Ví dụ nguyên văn V→I:
 *
 *     A7 → Bdim7 → C#dim7 → Dm7
 *
 * Cùng khuôn (bước 2 nửa cung) áp cho mọi cặp bass cách 3–7 nửa cung — chỗ
 * ca sĩ nghỉ / hợp âm ngân dài. Quãng 4 đúng (5) ra đúng 2 dim7 như tài liệu.
 */

const MIN_GAP = 3
const MAX_GAP = 7

/** Dựng một hợp âm bảy giảm trên nốt cho trước. */
function dim7On(root: PitchClass): ParsedChord | null {
  const quality = getChordQuality('dim7')
  if (!quality) return null

  const symbol = `${pitchClassName(root)}${quality.symbol}`
  return { root, quality, source: symbol, symbol }
}

/** Các nốt dim7 trên đường bass từ `from` tới `to`, chọn nhánh ngắn hơn. */
function walkRoots(from: PitchClass, to: PitchClass): PitchClass[] {
  const up = normalizePitchClass(to - from)
  const down = normalizePitchClass(from - to)
  const pick =
    up >= MIN_GAP && up <= MAX_GAP && down >= MIN_GAP && down <= MAX_GAP
      ? up <= down
        ? up
        : -down
      : up >= MIN_GAP && up <= MAX_GAP
        ? up
        : down >= MIN_GAP && down <= MAX_GAP
          ? -down
          : 0
  if (pick === 0) return []
  const step = pick > 0 ? 2 : -2
  const span = Math.abs(pick)
  const roots: PitchClass[] = []
  for (let distance = 2; distance < span; distance += 2) {
    roots.push(normalizePitchClass(from + (step < 0 ? -distance : distance)))
  }
  return roots
}

/**
 * Tìm các chỗ chèn được câu nối bằng chuỗi hợp âm giảm.
 */
export function suggestDim7ChainFills(
  chords: readonly ParsedChord[],
  options: { includeTurnaround?: boolean } = {},
): PassingSuggestion[] {
  const { includeTurnaround = true } = options
  if (chords.length < 2) return []

  const suggestions: PassingSuggestion[] = []

  function tryPair(
    host: ParsedChord,
    target: ParsedChord,
    insertBeforeIndex: number,
    isTurnaround: boolean,
  ): void {
    const roots = walkRoots(host.root, target.root)
    if (roots.length === 0) return

    const chain = roots
      .map((root) => dim7On(root))
      .filter((chord): chord is ParsedChord => chord !== null)
    if (chain.length !== roots.length) return

    const walk = [host.root, ...chain.map((chord) => chord.root), target.root]
      .map((pitch) => pitchClassName(pitch))
      .join(' → ')

    suggestions.push({
      insertBeforeIndex,
      chords: chain,
      technique: 'dim7-chain-fill',
      explanation: isTurnaround
        ? `Câu quay đầu: nối ${host.symbol} cuối vòng về ${target.symbol} đầu vòng, bass đi bộ ${walk}.`
        : `Câu nối lấp khoảng trống giữa ${host.symbol} và ${target.symbol}: bass đi bộ ${walk}.`,
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
