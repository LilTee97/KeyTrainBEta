/**
 * Nhập bài (lưới hợp âm kiểu Chordify) thành vòng + số phách từng hợp âm.
 *
 * Chỉ từ lưới người dùng dán. 30/9/2026 người dùng bỏ nhập từ link và từ file trên máy (nhạc / JSON sidecar) —
 * `parseSidecarTrack`, `titleFromSource` và bộ dò hợp âm từ audio (`analyzeAudio`, `chromaMatch`, `chordNet`) xoá theo.
 */

export interface ImportedChord {
  symbol: string
  /** Số phách hợp âm này chiếm. */
  beats: number
}

export interface ImportedTrack {
  title: string
  bpm: number
  beatsPerMeasure: 3 | 4
  chords: ImportedChord[]
}

const SKIP = /^(N\.?C\.?|NC|-|x)$/i
const REPEAT = /^%$/

function pushCell(
  cell: string,
  barBeats: number,
  into: ImportedChord[],
  last: { symbol: string | null },
): void {
  const tokens = cell.split(/[\s,]+/).filter(Boolean)
  const kept: string[] = []

  for (const token of tokens) {
    if (SKIP.test(token)) continue
    if (REPEAT.test(token)) {
      if (last.symbol) kept.push(last.symbol)
      continue
    }
    kept.push(token)
    last.symbol = token
  }

  if (kept.length === 0) return

  const each = barBeats / kept.length
  for (const symbol of kept) into.push({ symbol, beats: each })
}

/** Đọc lưới `| C | Am F | G |` hoặc `C Am F G` (mỗi cụm một ô). */
export function parseChordGrid(
  text: string,
  beatsPerMeasure: 3 | 4 = 4,
): ImportedChord[] {
  const chords: ImportedChord[] = []
  const last = { symbol: null as string | null }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || /^https?:\/\//i.test(line)) continue

    if (line.includes('|')) {
      for (const cell of line.split('|')) {
        if (cell.trim().length === 0) continue
        pushCell(cell.trim(), beatsPerMeasure, chords, last)
      }
      continue
    }

    for (const token of line.split(/[\s,]+/).filter(Boolean)) {
      pushCell(token, beatsPerMeasure, chords, last)
    }
  }

  return chords
}

export function trackToSongText(track: ImportedTrack): string {
  return track.chords.map((entry) => entry.symbol).join(' ')
}

/** Bảng phách theo số thứ tự hợp âm, để đổ vào `chordBeats` của đường ống. */
export function trackToBeatTable(
  track: ImportedTrack,
): Record<number, number> {
  const table: Record<number, number> = {}
  track.chords.forEach((entry, index) => {
    table[index] = entry.beats
  })
  return table
}

export function beatTableToList(
  table: Record<number, number> | undefined,
  length: number,
): number[] | undefined {
  if (!table) return undefined
  const list = Array.from({ length }, (_, index) => table[index]).filter(
    (beats): beats is number => beats !== undefined,
  )
  return list.length === length ? list : undefined
}

export function listToBeatTable(
  list: readonly number[] | undefined,
): Record<number, number> | undefined {
  if (!list || list.length === 0) return undefined
  const table: Record<number, number> = {}
  list.forEach((beats, index) => {
    table[index] = beats
  })
  return table
}

/** Bung hợp âm ra từng phách (hợp âm không ghi số phách thì lấy `fallbackBeats`). */
export function expandToBeats(
  chords: readonly { symbol: string; beats?: number }[],
  fallbackBeats: number,
): string[] {
  const beats: string[] = []
  for (const chord of chords) {
    const length = Math.max(1, Math.round(chord.beats ?? fallbackBeats))
    for (let index = 0; index < length; index += 1) beats.push(chord.symbol)
  }
  return beats
}
