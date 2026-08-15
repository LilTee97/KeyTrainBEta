import type { ParsedChord } from './types'

/**
 * Thời lượng của từng hợp âm trong vòng.
 *
 * Trước đây mọi hợp âm được cấp cùng một số phách, và hợp âm lướt chèn vào cũng
 * được cấp trọn một ô nhịp như hợp âm chính. Hệ quả đo được: vòng
 * `C Am F G` bốn ô nhịp, sau khi chèn ba vòng hai-năm lướt, phình thành **mười
 * ô nhịp**. Không chỉ hợp âm lướt sai thời lượng — cả cấu trúc bài bị phá, bài
 * bốn ô thành bài mười ô, không hát theo được nữa.
 *
 * Cách làm đúng, theo `phongcachdemhatkhabu.md`:
 *
 * - Mục 14.2 — ô nhịp `Am7 → Gm9 → C13♭9`: Am7 ngân nửa đầu, còn vòng hai-năm
 *   `Gm9 → C13♭9` nằm ở **nửa sau ô nhịp**. Hợp âm đích vẫn rơi đúng đầu ô sau.
 * - Mục 14.3 — `Am7 → Gm7 → C7`: ba hợp âm trong **một** ô nhịp, giá trị nốt
 *   rút xuống nốt đen.
 * - Mục 14.4 — nguyên tắc chung: *"nốt càng dài khi hợp âm ngân lâu, nốt càng
 *   ngắn khi hợp âm đổi dày"*.
 *
 * Nên hợp âm lướt **mượn thời gian của hợp âm đứng trước**, không thêm ô nhịp
 * mới. Tổng độ dài vòng giữ nguyên.
 */

/** Số phách của một hợp âm; chưa ghi thì lấy mặc định của vòng. */
export function beatsOf(chord: ParsedChord, fallback: number): number {
  return chord.beats ?? fallback
}

/** Thời lượng từng hợp âm, theo thứ tự. */
export function chordDurations(
  chords: readonly ParsedChord[],
  fallback: number,
): number[] {
  return chords.map((chord) => beatsOf(chord, fallback))
}

/** Phách bắt đầu của từng hợp âm, tính dồn từ đầu vòng. */
export function chordStarts(
  chords: readonly ParsedChord[],
  fallback: number,
): number[] {
  const starts: number[] = []
  let cursor = 0

  for (const chord of chords) {
    starts.push(cursor)
    cursor += beatsOf(chord, fallback)
  }

  return starts
}

/** Tổng độ dài một lượt vòng hợp âm, tính bằng phách. */
export function totalBeatsOf(
  chords: readonly ParsedChord[],
  fallback: number,
): number {
  return chords.reduce((sum, chord) => sum + beatsOf(chord, fallback), 0)
}

/** Một hợp âm chính cùng khoảng thời gian nó chiếm trên dòng thời gian. */
export interface ChordSpan {
  chord: ParsedChord
  start: number
  beats: number
}

/**
 * Khung thời gian của **vòng hợp âm chính**, bỏ qua hợp âm lướt.
 *
 * Phần giai điệu dùng khung này chứ không dùng cả mảng: hợp âm lướt là việc
 * của tay đệm, còn câu solo vẫn bám vòng hợp âm chính. Chạy theo từng hợp âm
 * lướt dài một phách thì câu nhạc bị băm vụn, và đó không phải cách người ta
 * ngẫu hứng trên một vòng có hợp âm nối.
 *
 * Mỗi hợp âm chính vì vậy **lấy lại trọn** khoảng thời gian của mình, kể cả
 * phần đã nhường cho hợp âm lướt đứng sau nó.
 */
export function mainChordSpans(
  chords: readonly ParsedChord[],
  fallback: number,
): ChordSpan[] {
  const starts = chordStarts(chords, fallback)
  const total = totalBeatsOf(chords, fallback)

  const main = chords
    .map((chord, index) => ({ chord, index }))
    .filter((entry) => !entry.chord.passing)

  // Toàn hợp âm lướt là chuyện không xảy ra, nhưng đừng trả về khung rỗng.
  if (main.length === 0) {
    return chords.map((chord, index) => ({
      chord,
      start: starts[index],
      beats: beatsOf(chord, fallback),
    }))
  }

  return main.map((entry, position) => {
    const next = main[position + 1]
    const end = next ? starts[next.index] : total

    return {
      chord: entry.chord,
      start: starts[entry.index],
      beats: end - starts[entry.index],
    }
  })
}

/** Hợp âm nào đang vang tại một thời điểm. */
export function chordIndexAt(
  chords: readonly ParsedChord[],
  fallback: number,
  beat: number,
): number {
  const starts = chordStarts(chords, fallback)

  for (let index = starts.length - 1; index >= 0; index -= 1) {
    if (beat >= starts[index]) return index
  }

  return 0
}

/**
 * Chia thời gian của một hợp âm cho những hợp âm lướt chèn ngay sau nó.
 *
 * Hợp âm chủ giữ **nửa đầu**, các hợp âm lướt chia đều **nửa sau** — đúng hình
 * ô nhịp `Am7 → Gm9 → C13♭9` của tài liệu. Nếu nửa sau chia ra ngắn hơn một
 * phách thì lùi về chia đều cả ô cho tất cả, vì lúc đó giữ nửa đầu cho hợp âm
 * chủ chỉ làm mấy hợp âm lướt dồn cục nghe không ra tiếng.
 */
export function splitBeats(
  hostBeats: number,
  passingCount: number,
): { host: number; passing: number[] } {
  if (passingCount <= 0) return { host: hostBeats, passing: [] }

  const half = hostBeats / 2
  const share = half / passingCount

  if (share >= 1) {
    return {
      host: half,
      passing: Array.from({ length: passingCount }, () => share),
    }
  }

  // Quá chật để giữ nửa đầu: chia đều cho hợp âm chủ và các hợp âm lướt.
  const even = hostBeats / (passingCount + 1)
  return {
    host: even,
    passing: Array.from({ length: passingCount }, () => even),
  }
}
