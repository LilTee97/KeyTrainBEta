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
