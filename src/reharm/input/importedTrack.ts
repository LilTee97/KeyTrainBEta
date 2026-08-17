/**
 * Nhập bài (lưới hợp âm kiểu Chordify) thành vòng + số phách từng hợp âm.
 *
 * Không gọi mạng, không đọc audio ở đây. File/URL chỉ cho tên bài; BPM và lưới
 * do người dùng dán hoặc ước ở UI rồi đưa vào `ImportedTrack`.
 */

export interface ImportedChord {
  symbol: string
  /** Số phách hợp âm này chiếm. */
  beats: number
}

export interface ImportedTrack {
  title: string
  sourceUrl?: string
  bpm: number
  beatsPerMeasure: 3 | 4
  /** Giọng ước từ sidecar, ví dụ `G` / `Em`. */
  key?: string
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * JSON từ `tools/analyze_song.py`.
 * Nhận `chords: [{symbol,beats}]` hoặc `[{chord,time}]`.
 */
export function parseSidecarTrack(raw: unknown): ImportedTrack | null {
  const data = asRecord(raw)
  if (!data) return null
  const bpm = Number(data.bpm)
  if (!Number.isFinite(bpm) || bpm < 20 || bpm > 300) return null
  const meter = data.beatsPerMeasure === 3 ? 3 : 4
  const title =
    typeof data.title === 'string' && data.title.trim()
      ? data.title.trim()
      : 'Bài nhập'
  const key = typeof data.key === 'string' && data.key.trim() ? data.key.trim() : undefined
  const sourceUrl =
    typeof data.sourceUrl === 'string' ? data.sourceUrl : undefined

  if (!Array.isArray(data.chords) || data.chords.length === 0) return null

  const chords: ImportedChord[] = []
  const first = asRecord(data.chords[0])
  const timed = first && ('time' in first || 't' in first)

  if (timed) {
    const stamps = data.chords
      .map((entry) => {
        const row = asRecord(entry)
        if (!row) return null
        const symbol = String(row.chord ?? row.symbol ?? '').trim()
        const time = Number(row.time ?? row.t)
        if (!symbol || !Number.isFinite(time)) return null
        return { symbol, time }
      })
      .filter((row): row is { symbol: string; time: number } => row !== null)
    if (stamps.length === 0) return null
    for (let index = 0; index < stamps.length; index += 1) {
      const next = stamps[index + 1]?.time
      const duration =
        next !== undefined
          ? ((next - stamps[index].time) * bpm) / 60
          : meter
      chords.push({
        symbol: stamps[index].symbol,
        beats: Math.max(0.25, Math.round(duration * 4) / 4),
      })
    }
  } else {
    for (const entry of data.chords) {
      const row = asRecord(entry)
      if (!row) continue
      const symbol = String(row.symbol ?? row.chord ?? '').trim()
      const beats = Number(row.beats)
      if (!symbol || !Number.isFinite(beats) || beats <= 0) continue
      chords.push({ symbol, beats })
    }
  }

  if (chords.length === 0) return null
  return { title, sourceUrl, bpm, beatsPerMeasure: meter, key, chords }
}

export function titleFromSource(urlOrName: string): string {
  try {
    const url = new URL(urlOrName)
    const slug = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
    const cleaned = decodeURIComponent(slug)
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim()
    if (!cleaned) return url.hostname.replace(/^www\./, '')
    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase())
  } catch {
    const base = urlOrName.replace(/\.[a-z0-9]+$/i, '').trim()
    return base || 'Bài nhập'
  }
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
