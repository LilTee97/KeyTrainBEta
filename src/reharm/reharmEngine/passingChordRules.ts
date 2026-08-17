import { suggestDim7ChainFills } from '../fillSoloGenerator/fillGenerator'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import { scaleTones } from './keyDetection'
import { beatsOf, splitBeats } from '../chordTiming'
import type { ParsedChord } from '../types'

/**
 * Kỹ thuật 2 của phong cách: chèn hợp âm nối giữa hai hợp âm chính.
 *
 * Tài liệu nguồn xếp đây là **kỹ thuật lõi, đáng học kỹ nhất** nếu muốn nhái
 * phong cách. Có hai họ luật, và họ thứ hai là công thức mẹ giải thích cho
 * họ thứ nhất:
 *
 * 1. **Hợp âm giảm lướt** — chèn một hợp âm bảy giảm vào khe nửa cung giữa hai
 *    hợp âm cách nhau một cung, tạo chuyển động bán cung mượt.
 * 2. **Vòng 2-5-1 lướt** — mượn cặp hợp âm bậc hai và bậc năm của một hợp âm
 *    bất kỳ rồi chèn ngay trước nó, tạo cảm giác chuyển giọng thoáng qua.
 *
 * Mọi luật ở đây chỉ **đề xuất**, không tự áp dụng: người chơi quyết định chèn
 * chỗ nào, vì chèn hết mọi chỗ có thể sẽ làm bài nhạc rối và mất hướng.
 */

export type PassingTechnique =
  | 'dim7-passing'
  | 'secondary-dominant'
  | 'secondary-ii-V'
  /** Câu nối bằng chuỗi hợp âm giảm, xem `../fillSoloGenerator/fillGenerator.ts`. */
  | 'dim7-chain-fill'

export interface PassingSuggestion {
  /** Vị trí chèn: đứng ngay trước hợp âm thứ `insertBeforeIndex`. */
  insertBeforeIndex: number
  /** Các hợp âm sẽ được chèn vào. */
  chords: ParsedChord[]
  technique: PassingTechnique
  /** Giải thích ngắn cho người chơi hiểu vì sao chèn được ở đây. */
  explanation: string
  /** Host giữ bấy nhiêu phách rồi mới tới hợp âm lướt. Bỏ trống = chia đôi ô. */
  hostKeepBeats?: number
}

/** Dựng một hợp âm từ nốt gốc và định danh tính chất. */
function makeChord(
  root: PitchClass,
  qualityId: string,
): ParsedChord | null {
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
 * Khoảng cách đi lên từ `from` tới `to`, tính bằng nửa cung, 0-11.
 */
function ascendingDistance(from: PitchClass, to: PitchClass): number {
  return normalizePitchClass(to - from)
}

/**
 * Luật 1 — hợp âm giảm lướt.
 *
 * Quy tắc như tài liệu phát biểu ở mục 7: **chèn một hợp âm bảy giảm xây trên
 * nốt cách hợp âm đích đúng nửa cung**, để bass lướt bán cung vào hợp âm đích.
 * Chọn nửa cung dưới hay nửa cung trên là tuỳ chiều đi tới: đang đi lên thì
 * lấy nửa cung dưới, đang đi xuống thì lấy nửa cung trên.
 *
 * Bốn ví dụ trong tài liệu đều khớp quy tắc này:
 * - C → C#dim7 → Dm7 (đi lên, nửa cung dưới nốt Rê)
 * - Em7 → D#dim7 → Dm7 (đi xuống, nửa cung trên nốt Rê)
 * - Em7 → G#dim7 → Am7 (đi lên, nửa cung dưới nốt La)
 * - Bdim7 → C#dim7 → Dm7 (đi lên, nửa cung dưới nốt Rê)
 *
 * Hợp âm giảm nối được gần như bất kỳ hai hợp âm nào vì cấu tạo toàn quãng ba
 * thứ, không mang cảm giác chủ âm rõ ràng nên nghe trung tính.
 */
export function suggestDim7Passing(
  chords: readonly ParsedChord[],
): PassingSuggestion[] {
  const suggestions: PassingSuggestion[] = []

  for (let index = 1; index < chords.length; index += 1) {
    const previous = chords[index - 1]
    const target = chords[index]

    const up = ascendingDistance(previous.root, target.root)
    if (up === 0) continue

    const goingUp = up <= 6
    const passingRoot = normalizePitchClass(target.root + (goingUp ? -1 : 1))
    if (passingRoot === previous.root) continue

    const passing = makeChord(passingRoot, 'dim7')
    if (!passing) continue

    suggestions.push({
      insertBeforeIndex: index,
      chords: [passing],
      technique: 'dim7-passing',
      explanation: `Lướt bán cung sau ${previous.symbol} vào ${target.symbol}: bass đi ${pitchClassName(previous.root)} → ${pitchClassName(passingRoot)} → ${pitchClassName(target.root)}.`,
    })
  }

  return suggestions
}

/**
 * Hợp âm bậc năm của một hợp âm đích.
 *
 * Hợp âm đích mang tính chất thứ thì dùng bậc năm có nốt giáng chín, đúng như
 * tài liệu ghi ở mục 2.2 (A7b9 kéo về Dm9) — nốt b9 làm lực kéo mạnh hơn hẳn.
 */
function dominantOf(target: ParsedChord): ParsedChord | null {
  const root = normalizePitchClass(target.root + 7)
  return makeChord(root, isMinorish(target) ? '7b9' : '7')
}

/**
 * Hợp âm bậc hai của một hợp âm đích.
 * Đích là hợp âm thứ thì bậc hai là hợp âm nửa giảm, đúng vòng iiø-V7-i.
 */
function supertonicOf(target: ParsedChord): ParsedChord | null {
  const root = normalizePitchClass(target.root + 2)
  return makeChord(root, isMinorish(target) ? 'm7b5' : 'm7')
}

/** Hợp âm này đã là bậc năm của hợp âm kia chưa. */
function alreadyResolves(
  previous: ParsedChord,
  target: ParsedChord,
): boolean {
  return normalizePitchClass(previous.root + 5) === target.root
}

/**
 * Luật 2 — bậc năm phụ.
 *
 * Bản rút gọn của vòng 2-5-1 lướt: chỉ chèn hợp âm bậc năm ngay trước hợp âm
 * đích. Tốn ít chỗ hơn nên dùng được cả khi mỗi hợp âm chỉ chiếm nửa ô nhịp.
 */
export function suggestSecondaryDominants(
  chords: readonly ParsedChord[],
): PassingSuggestion[] {
  const suggestions: PassingSuggestion[] = []

  for (let index = 1; index < chords.length; index += 1) {
    const previous = chords[index - 1]
    const target = chords[index]

    // Đã có sẵn quan hệ bậc năm về đích thì không cần chèn thêm.
    if (alreadyResolves(previous, target)) continue

    const dominant = dominantOf(target)
    if (!dominant) continue

    suggestions.push({
      insertBeforeIndex: index,
      chords: [dominant],
      technique: 'secondary-dominant',
      explanation: `${dominant.symbol} là bậc năm của ${target.symbol}, tạo lực kéo về hợp âm đích.`,
    })
  }

  return suggestions
}

/**
 * Luật 3 — vòng 2-5-1 lướt.
 *
 * Tài liệu gọi đây là **công thức mẹ** giải thích cho mọi ví dụ hợp âm giảm và
 * hợp âm át biến âm khác. Mượn cặp bậc hai và bậc năm của hợp âm đích rồi chèn
 * ngay trước nó, tạo cảm giác chuyển giọng tạm thời rồi quay lại.
 *
 * Chèn hai hợp âm nên tốn chỗ; chỉ dùng khi hợp âm đích được ngân đủ lâu.
 */
export function suggestSecondaryIiV(
  chords: readonly ParsedChord[],
): PassingSuggestion[] {
  const suggestions: PassingSuggestion[] = []

  for (let index = 1; index < chords.length; index += 1) {
    const previous = chords[index - 1]
    const target = chords[index]

    if (alreadyResolves(previous, target)) continue

    const supertonic = supertonicOf(target)
    const dominant = dominantOf(target)
    if (!supertonic || !dominant) continue

    suggestions.push({
      insertBeforeIndex: index,
      chords: [supertonic, dominant],
      technique: 'secondary-ii-V',
      explanation: `Mượn vòng hai năm một của ${target.symbol}: ${supertonic.symbol} → ${dominant.symbol} → ${target.symbol}.`,
    })
  }

  return suggestions
}

/**
 * Lọc bớt gợi ý cho hợp giọng của bài và hợp với những gì đã chèn.
 *
 * Hai luật, và cả hai đều là luật **nhạc** chứ không phải luật kỹ thuật:
 *
 * 1. **Hợp âm đích phải nằm trong giọng của bài.** Vòng hai-năm phụ và bậc năm
 *    phụ là để *"mượn"* sức hút của một bậc **có sẵn trong giọng**; mượn vào
 *    một hợp âm vốn đã ngoài giọng thì nghe như lạc sang bài khác. Bản thân
 *    hợp âm lướt được phép ngoài giọng — đó chính là chỗ hay của nó — nhưng
 *    hợp âm nó dẫn tới thì không.
 *
 * 2. **Chèn một chỗ rồi thì hai chỗ sát bên không chèn nữa.** Hợp âm lướt mượn
 *    nửa ô nhịp của hợp âm đứng trước, nên chèn ở hai khe liền nhau sẽ làm hợp
 *    âm ở giữa vừa bị cắt còn nửa ô vừa bị kẹp giữa hai cụm hợp âm lướt — nghe
 *    thành một dải hợp âm chạy liên miên, không còn ra vòng hợp âm nữa. Chèn
 *    thưa mới nghe ra chỗ nhấn.
 *
 * Riêng khe **đã chèn** thì vẫn giữ lại đúng gợi ý đang dùng — bỏ nó đi thì
 * người dùng không còn đường nào để gỡ ra. Chỉ các kỹ thuật *khác* ở cùng khe
 * mới bị ẩn, vì một khe chỉ chèn được một thứ.
 */
export function compatibleSuggestions(
  suggestions: readonly PassingSuggestion[],
  chords: readonly ParsedChord[],
  accepted: readonly PassingSuggestion[],
  key: { tonic: PitchClass; scale: ScaleType } | null,
): PassingSuggestion[] {
  const tones = key ? scaleTones(key.tonic, key.scale) : null

  // Hai khe sát bên khe đã chèn.
  const blocked = new Set<number>()
  /** Khe đã chèn rồi, và chèn bằng kỹ thuật nào. */
  const taken = new Map<number, PassingTechnique>()

  for (const item of accepted) {
    blocked.add(item.insertBeforeIndex - 1)
    blocked.add(item.insertBeforeIndex + 1)
    taken.set(item.insertBeforeIndex, item.technique)
  }

  return suggestions.filter((suggestion) => {
    const slot = suggestion.insertBeforeIndex

    // Khe đã chèn: chỉ giữ đúng gợi ý đang dùng, để còn gỡ ra được.
    const used = taken.get(slot)
    if (used !== undefined) return used === suggestion.technique

    if (blocked.has(slot)) return false

    const target = targetOf(chords, slot)
    if (!target) return false

    return tones === null || tones.has(target.root)
  })
}

/**
 * Một hợp âm lướt và **mọi chỗ trong bài đặt được nó**.
 *
 * Đây mới là đơn vị thao tác đúng, không phải từng khe một. Một bài lặp đi lặp
 * lại vài hợp âm, nên cùng một hợp âm lướt đặt được ở nhiều chỗ; bày ra thành
 * nhiều thẻ giống hệt nhau vừa rối vừa vô nghĩa, vì bấm thẻ nào cũng ra cùng
 * một kết quả.
 */
export interface PassingGroup {
  /** Khoá ổn định: kỹ thuật cộng hợp âm đích. */
  id: string
  technique: PassingTechnique
  /** Các hợp âm sẽ chèn — giống nhau ở mọi chỗ trong nhóm. */
  chords: ParsedChord[]
  explanation: string
  /** Các khe sẽ chèn, đã bỏ những khe sát nhau. */
  slots: number[]
}

/**
 * Gom gợi ý thành nhóm theo **kỹ thuật và hợp âm đích**.
 *
 * Cùng nhóm nghĩa là cùng hợp âm lướt: hợp âm lướt được dựng từ chính tính chất
 * của hợp âm đích, nên dẫn vào `Am7` và dẫn vào `Am9` cho ra hai hợp âm lướt
 * khác nhau dù cùng nốt gốc.
 *
 * Trong mỗi nhóm, khe nào **sát ngay** một khe đã chọn thì bỏ: hai khe liền
 * nhau cùng chèn sẽ làm hợp âm ở giữa vừa bị cắt còn nửa ô vừa bị kẹp giữa hai
 * cụm hợp âm lướt.
 *
 * Nhóm không còn khe nào thì biến mất — đó chính là những hợp âm lướt đã xung
 * đột với chỗ vừa chèn, không còn đặt được nữa.
 */
export function groupPassingSuggestions(
  suggestions: readonly PassingSuggestion[],
  chords: readonly ParsedChord[],
): PassingGroup[] {
  const groups = new Map<string, PassingGroup>()

  for (const suggestion of [...suggestions].sort(
    (a, b) => a.insertBeforeIndex - b.insertBeforeIndex,
  )) {
    const target = targetOf(chords, suggestion.insertBeforeIndex)
    if (!target) continue

    const id = `${suggestion.technique}:${target.root}:${target.quality.id}`
    const existing = groups.get(id)

    if (!existing) {
      groups.set(id, {
        id,
        technique: suggestion.technique,
        chords: suggestion.chords,
        explanation: suggestion.explanation,
        slots: [suggestion.insertBeforeIndex],
      })
      continue
    }

    const last = existing.slots[existing.slots.length - 1]
    if (suggestion.insertBeforeIndex - last <= 1) continue
    existing.slots.push(suggestion.insertBeforeIndex)
  }

  return [...groups.values()].filter((group) => group.slots.length > 0)
}

/** Hợp âm đích của một khe — khe = hết vòng thì đích là hợp âm đầu. */
export function targetOf(
  chords: readonly ParsedChord[],
  insertBefore: number,
): ParsedChord | undefined {
  if (insertBefore === chords.length) return chords[0]
  return chords[insertBefore]
}

/** Nhóm nào đặt được ngay trước hợp âm thứ `index`. */
export function groupsAtSlot(
  groups: readonly PassingGroup[],
  index: number,
): PassingGroup[] {
  return groups.filter((group) => group.slots.includes(index))
}

export interface SuggestOptions {
  dim7Passing?: boolean
  secondaryDominant?: boolean
  secondaryIiV?: boolean
  /** Câu nối bằng chuỗi hợp âm giảm giữa bậc năm và hợp âm đích. */
  dim7ChainFill?: boolean
}

/**
 * Gom mọi đề xuất áp dụng được cho một vòng hợp âm.
 *
 * Cùng một khe có thể nhận nhiều đề xuất khác nhau; phần gọi tự chọn dùng cái
 * nào, vì áp dụng chồng lên nhau sẽ ra kết quả rối.
 */
export function suggestPassingChords(
  chords: readonly ParsedChord[],
  options: SuggestOptions = {},
): PassingSuggestion[] {
  const {
    dim7Passing = true,
    secondaryDominant = true,
    secondaryIiV = true,
    dim7ChainFill = true,
  } = options

  const suggestions: PassingSuggestion[] = []

  // Câu nối xếp trước vì nó lấp trọn quãng, đáng cân nhắc hơn việc chèn lẻ.
  if (dim7ChainFill) suggestions.push(...suggestDim7ChainFills(chords))
  if (dim7Passing) suggestions.push(...suggestDim7Passing(chords))
  if (secondaryIiV) suggestions.push(...suggestSecondaryIiV(chords))
  if (secondaryDominant) suggestions.push(...suggestSecondaryDominants(chords))

  return suggestions.sort(
    (a, b) => a.insertBeforeIndex - b.insertBeforeIndex,
  )
}

/**
 * Chèn các đề xuất đã chọn vào vòng hợp âm.
 *
 * Mỗi khe chỉ nhận một đề xuất — đề xuất đứng trước trong danh sách thắng. Chèn
 * từ cuối về đầu để các vị trí phía trước không bị lệch.
 */
export function applySuggestions(
  chords: readonly ParsedChord[],
  suggestions: readonly PassingSuggestion[],
  /** Nhịp đổi hợp âm của vòng, để chia thời gian cho hợp âm lướt. */
  beatsPerChord = 4,
): ParsedChord[] {
  const chosen = new Map<number, PassingSuggestion>()
  for (const suggestion of suggestions) {
    if (!chosen.has(suggestion.insertBeforeIndex)) {
      chosen.set(suggestion.insertBeforeIndex, suggestion)
    }
  }

  const result = [...chords]
  const positions = [...chosen.keys()].sort((a, b) => b - a)

  for (const position of positions) {
    const inserted = chosen.get(position)!.chords

    const hostIndex = position === 0 ? result.length - 1 : position - 1
    const host = result[hostIndex]
    if (!host) continue

    const suggestion = chosen.get(position)!
    const total = beatsOf(host, beatsPerChord)
    const keep = suggestion.hostKeepBeats
    const { host: hostBeats, passing } =
      keep !== undefined && keep > 0 && keep < total
        ? {
            host: keep,
            passing: Array.from(
              { length: inserted.length },
              () => (total - keep) / inserted.length,
            ),
          }
        : splitBeats(total, inserted.length)

    result[hostIndex] = { ...host, beats: hostBeats }
    result.splice(
      position,
      0,
      ...inserted.map((chord, index) => ({
        ...chord,
        beats: passing[index],
        passing: true,
      })),
    )
  }

  return result
}

/** Tên gọi tiếng Việt của từng kỹ thuật, dùng để hiển thị. */
export const TECHNIQUE_LABELS: Record<PassingTechnique, string> = {
  'dim7-passing': 'Hợp âm giảm lướt',
  'secondary-dominant': 'Bậc năm phụ',
  'secondary-ii-V': 'Vòng 2-5-1 lướt',
  'dim7-chain-fill': 'Câu nối chuỗi hợp âm giảm',
}
