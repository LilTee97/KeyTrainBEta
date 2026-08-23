import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Câu quay đầu (turnaround) ở cuối đoạn giang tấu.
 *
 * Giang tấu chạy hết vòng hợp âm rồi phải **trả bài lại cho người hát**. Chạy
 * hết vòng xong quay thẳng về đoạn sau thì không có gì báo hiệu, người hát
 * không biết khi nào vào — nên ô nhịp cuối được đổi thành một cụm hợp âm hút
 * mạnh về **hợp âm đầu tiên của đoạn kế tiếp**.
 *
 * Cụm dùng ở đây lấy thẳng từ `phongcachdemhatkhabu.md`:
 *
 * - Phần 8 gọi **vòng 2-5-1 lướt** là *"công thức mẹ"* — mượn cặp hợp âm bậc
 *   hai và bậc năm của một hợp âm bất kỳ rồi chèn ngay trước nó. Câu quay đầu
 *   chính là trường hợp riêng của nó: hợp âm đích là đoạn sắp vào.
 * - Phần 15 ghi lại đúng một câu quay đầu Khá Bự dạy — `Dm7 → G9sus4 → CM7 →
 *   C7` — trong đó **bậc năm mang màu 9sus4** rồi mới giải quyết. Đó là lý do
 *   ở đây bậc năm dùng `9sus4` chứ không dùng hợp âm bảy trơn: hợp âm treo là
 *   một trong năm kỹ thuật lõi của phong cách, và nó nghe "mềm" hơn đúng kiểu
 *   đệm hát nhạc Việt.
 * - Phần 11 (nguyên lý gốc) đòi voice leading mượt, nên cụm quay đầu đi theo
 *   quãng bốn xuống — bậc hai xuống bậc năm xuống hợp âm đích — là đường đi
 *   ngắn nhất.
 *
 * Với hợp âm đích **thứ**, cặp mượn đổi thành `iiø7 → V7♭9` đúng như phần 7
 * mô tả: nửa-giảm làm bậc hai của vòng 2-5-1 thứ, còn bậc năm mang ♭9 để nhấn
 * màu thứ. Hợp âm treo không dùng ở đây vì nó xoá mất quãng ba, tức xoá luôn
 * cái làm nên màu thứ của chỗ sắp về.
 *
 * ## Chơi đủ vòng, kể cả hợp âm đích
 *
 * Cụm gồm **ba** hợp âm: bậc hai, bậc năm, rồi chính hợp âm đích. Bản đầu chỉ
 * chơi hai hợp âm đầu rồi để đoạn sau tự vào ở hợp âm đích — nghe như câu nói
 * bỏ lửng, vì vòng hai-năm-một chưa được đóng lại.
 *
 * Hợp âm đích **vang hai lần**: một lần khép vòng ở đây, một lần nữa ở phách
 * mạnh đầu đoạn mới. Trùng lặp ấy không phải lỗi — đó đúng là cách người ta
 * chốt một câu rồi bắt đầu câu tiếp theo trên cùng hợp âm.
 *
 * ## Khi vòng đã kết sẵn ở bậc năm
 *
 * Nhiều bài kết đoạn ngay ở bậc năm — điệp khúc kết `G7` rồi vào lại `Cadd9`
 * chẳng hạn. Lúc đó **giữ nguyên hợp âm đang có, chỉ chèn thêm bậc hai phía
 * trước**: `G7` đã có quãng ba nên hút mạnh hơn `G9sus4`, thay nó bằng hợp âm
 * treo là làm yếu đi đúng cái mình đang muốn mạnh lên. Ô nhịp quá ngắn để chèn
 * thêm gì thì thôi không đụng vào — chỗ đó tự nó đã hút rồi.
 */

/** Dựng một hợp âm từ nốt gốc và định danh tính chất. */
function makeChord(root: PitchClass, qualityId: string): ParsedChord | null {
  const quality = getChordQuality(qualityId)
  if (!quality) return null

  const symbol = `${pitchClassName(root)}${quality.symbol}`
  return { root, quality, source: symbol, symbol }
}

/** Hợp âm này có tính chất thứ không. */
function isMinorish(chord: ParsedChord): boolean {
  return chord.quality.intervals.includes(3)
}

/**
 * Ô cuối của vòng đã là bậc năm của đoạn sau chưa.
 *
 * Đã là rồi thì nó tự hút về, việc còn lại chỉ là dọn đường cho nó bằng bậc
 * hai — không thay nó bằng hợp âm khác.
 */
export function alreadyLeadsInto(
  last: ParsedChord | undefined,
  target: ParsedChord,
): boolean {
  if (!last) return false
  return last.root === normalizePitchClass(target.root + 7)
}

export interface TurnaroundPlan {
  /** Các hợp âm sẽ chơi, xếp theo thứ tự. */
  chords: ParsedChord[]
  /** Mô tả ngắn cho giao diện, ví dụ `Dm7 → G9sus4`. */
  label: string
}

/**
 * Cụm hợp âm hút về `target`, gói trong `slots` khe hợp âm.
 *
 * `slots` là số hợp âm được phép dùng — một ô nhịp chia đôi thì được hai, ô
 * quá ngắn thì chỉ được một. Hai khe thì dùng đủ cặp bậc hai – bậc năm; một
 * khe thì bỏ bậc hai, giữ bậc năm, vì **bậc năm mới là chỗ tạo sức hút**, bậc
 * hai chỉ dọn đường cho nó.
 */
export function turnaroundInto(
  target: ParsedChord,
  slots: number,
  /** Hợp âm đang nằm ở ô cuối, nếu có — để biết vòng đã tự hút chưa. */
  last?: ParsedChord,
): TurnaroundPlan | null {
  if (slots < 1) return null

  const minor = isMinorish(target)
  const settled = alreadyLeadsInto(last, target)

  // Bậc năm của hợp âm đích: lên quãng năm đúng, tức bảy nửa cung.
  const dominantRoot = normalizePitchClass(target.root + 7) as PitchClass
  const dominant = settled ? last! : makeChord(dominantRoot, minor ? '7b9' : '9sus4')
  if (!dominant) return null

  if (slots < 2) {
    // Đang là bậc năm sẵn rồi mà không còn khe để chèn thêm thì khỏi đụng vào.
    return settled
      ? null
      : { chords: [dominant, target], label: `${dominant.symbol} → ${target.symbol}` }
  }

  // Bậc hai của hợp âm đích: lên một cung.
  const supertonicRoot = normalizePitchClass(target.root + 2) as PitchClass
  const supertonic = makeChord(supertonicRoot, minor ? 'm7b5' : 'm7')
  if (!supertonic) {
    return settled
      ? null
      : { chords: [dominant, target], label: `${dominant.symbol} → ${target.symbol}` }
  }

  const chords = [supertonic, dominant, target]
  return { chords, label: chords.map((chord) => chord.symbol).join(' → ') }
}


/**
 * Hợp âm **rải** chơi sau khi cụm hai-năm-một đã khép vòng.
 *
 * Cụm quay đầu đóng lại ở hợp âm đích, tức nó vừa *kết thúc* một câu. Nhưng
 * ngay sau đó đoạn hát vào, và chỗ nối ấy cần một cú mở cửa chứ không phải một
 * dấu chấm. Một hợp âm rải mang sức hút về đúng hợp âm sắp chơi làm việc đó:
 * nó không đứng yên như hợp âm khối, mà chạy lên và bỏ lửng giữa chừng.
 *
 * Chọn **bậc năm của hợp âm đích** — cách phổ biến nhất, và cũng là chỗ hút
 * mạnh nhất theo mọi luật khác trong `phongcachdemhatkhabu.md`.
 *
 * ## Màu phải khác màu vừa nghe
 *
 * Bậc năm vừa vang trong chính cụm quay đầu, nên rải lại đúng màu ấy thì nghe
 * như đánh lặp chứ không như một cú mở cửa. Phần 12.2 của tài liệu nói thẳng
 * nguyên tắc này qua chuỗi `C → CM7 → C6 → CM7`: cùng một gốc thì **đổi màu
 * mỗi lần** để tránh đơn điệu.
 *
 * Bảng màu ở đây lấy từ đúng những màu tài liệu dùng cho bậc năm:
 *
 * - `9sus4` — màu chữ ký của phong cách, phần 15 ghi lại `Dm7 → G9sus4 → CM7`.
 *   Mềm, hợp nhạc Việt, và vì thiếu quãng ba nên nó *treo* chứ không chốt.
 * - `13` — bậc năm nới rộng, phần 12.2 gọi là biến hoá màu trên cùng một gốc.
 * - `7b9` — bậc năm căng, phần 7 dùng cho chỗ dẫn về hợp âm thứ.
 */
/*
  Bảng màu **quay đầu giữa bài**: đi tiếp, không phải đẩy ai vào.

  Hợp âm đích thứ thì bỏ hẳn màu treo: treo xoá mất quãng ba, tức xoá luôn cái
  làm nên màu thứ của chỗ sắp về.
*/
const PULL_PALETTE = {
  minor: ['7b9', '7#5', '13'],
  major: ['9sus4', '13', '7b9'],
} as const

/*
  Bảng màu **hút mạnh**: dùng ở chỗ có đúng một việc là đẩy người hát vào.

  Hợp âm ở đó phải đủ **quãng ba trưởng và quãng bảy thứ** — cặp tam cung ấy mới
  là lực kéo — rồi mới tính tới màu. Đo trên bậc năm là Sol:

    G9sus4 = G C D F A     KHÔNG có B  -> mất nốt cảm, không hút
    G7b9   = G B D F Ab    đủ cả hai, cộng sức căng
    G7     = G B D F       đủ cả hai, trơn
    G7#5   = G B Eb F      đủ cả hai, Eb báo trước màu thứ
    G13    = G B D F A     đủ cả hai nhưng nghe đã yên vị

  `7b9` đứng đầu cả hai: nó giữ nguyên quãng năm nên vẫn đứng vững như một hợp âm
  át thật, đủ nốt cảm và tam cung, cộng b9 làm sức căng.

  Đích **thứ** cho `7#5` đứng nhì, vì nốt Eb trong G7#5 chính là quãng ba thứ của
  chỗ sắp về — nó báo trước màu thứ. Đích **trưởng** thì Eb ấy đâm vào quãng ba
  trưởng của đích, nên đẩy `7#5` xuống cuối và để `7` trơn làm cái đỡ sạch sẽ.

  `13` không có mặt: về lý nó vẫn hút, nhưng nốt 13 làm hợp âm nghe **đã yên vị
  rồi** — đúng thứ không nên có ở chỗ phải đẩy người ta đi.
*/
const STRONG_PALETTE = {
  minor: ['7b9', '7#5', '7'],
  major: ['7b9', '7', '7#5'],
} as const

export interface PullOptions {
  /** Hợp âm bậc năm vừa vang trong cụm; tránh trùng màu với nó. */
  avoid?: ParsedChord | null
  /**
   * Lấy bảng màu hút mạnh thay vì bảng quay đầu.
   *
   * Hai công việc khác nhau nên hai bảng, còn phần dựng thì chung: cùng dựng
   * trên bậc năm, cùng né màu vừa nghe, cùng chạy hết bảng rồi trả null. Tách
   * thành hai hàm là hai chỗ phải sửa mỗi lần bộ dựng hợp âm đổi.
   */
  strong?: boolean
}

export function pullChordFor(
  target: ParsedChord,
  options: PullOptions = {},
): ParsedChord | null {
  const { avoid, strong } = options
  const root = normalizePitchClass(target.root + 7) as PitchClass
  const minor = isMinorish(target)

  const table = strong ? STRONG_PALETTE : PULL_PALETTE
  const palette = minor ? table.minor : table.major
  const used = avoid?.root === root ? avoid.quality.id : null

  for (const id of palette) {
    if (id === used) continue

    const chord = makeChord(root, id)
    if (chord) return chord
  }

  return null
}

const REPEATABLE = new Set(['verse', 'chorus', 'prechorus'])

export interface RepeatSectionRange {
  kind: string
  from: number
  to: number
}

/**
 * Đổi hợp âm kết trên **lời** ở lượt 2+ của cùng loại đoạn.
 *
 * Playback đã đổi lúc phát (`repeatEnding`). Bản nhạc thì lấy vòng `colored`
 * nên vẫn ghi màu lượt đầu. Hàm này sửa vòng đó: phiên khúc 2 kết `E7b9`
 * thay vì `Em7` khi đoạn sau vào `Am`.
 *
 * Đoạn cuối bài bỏ qua — không còn chỗ để hút. Chỉ đụng verse / chorus /
 * prechorus: intro, bridge, giang tấu không "lặp câu" theo nghĩa tài liệu.
 */
export function varyRepeatEndings(
  chords: readonly ParsedChord[],
  ranges: readonly RepeatSectionRange[],
): ParsedChord[] {
  if (ranges.length < 2) return [...chords]

  const seen = new Map<string, number>()
  const next = [...chords]

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index]
    const count = (seen.get(range.kind) ?? 0) + 1
    seen.set(range.kind, count)

    if (!REPEATABLE.has(range.kind) || count < 2) continue
    if (index === ranges.length - 1) continue

    const last = next[range.to]
    const target = next[ranges[index + 1].from]
    if (!last || !target) continue

    const pull = pullChordFor(target, { avoid: last })
    if (!pull || pull.symbol === last.symbol) continue

    next[range.to] = pull
  }

  return next
}
