import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { MidiNote } from '../../shared/musicTheory/types'
import {
  inKeyMaterial,
  keepInKey,
  ladderOf,
  nearestStep,
} from '../fillSoloGenerator/soloVocabulary'
import type { ParsedChord } from '../types'
import { brainLickPhrases } from '../brain/lickyPhrases'
import library from './phrases.json'
import type { LickPhrase, PlaceOptions, PlacedNote } from './types'

const ANCHOR = 72
const LOW = 55
const HIGH = 93
const HAND_SPLIT = 60
const FILL_GRID = 0.25
const RUN_GRID = 0.25

const phrases = (library as { phrases: LickPhrase[] }).phrases

/**
 * Sổ câu: câu trong `phrases.json` **cộng thêm** câu của thầy Kingsley lấy từ
 * bộ não PianoBrain.
 *
 * Nối lúc chạy chứ không ghi vào tệp, để `phrases.json` giữ nguyên nguồn gốc
 * của nó. Kho không cho phép câu nào thì phần thêm rỗng và sổ y như cũ.
 */
export function lickyPhrases(): readonly LickPhrase[] {
  return [...phrases, ...brainLickPhrases()]
}

function scramble(take: number): number {
  return Math.imul(take + 1, 2654435761) >>> 0
}

function pick(kind: PlaceOptions['kind'], take: number): LickPhrase {
  const book = lickyPhrases()
  const pool =
    kind === 'run'
      ? book.filter((phrase) => phrase.notes.length >= 6)
      : book
  return pool[scramble(take) % pool.length] ?? phrases[0]!
}

function gridOf(kind: PlaceOptions['kind']): number {
  return kind === 'run' ? RUN_GRID : FILL_GRID
}

function noteCount(kind: PlaceOptions['kind'], beats: number): number {
  const packed = Math.max(1, Math.round(beats / gridOf(kind)))
  return kind === 'fill'
    ? Math.max(3, Math.min(6, packed))
    : Math.max(4, Math.min(12, packed))
}

/** Lấy hình interval, cắt/nối cho đủ số nốt. */
function shape(phrase: LickPhrase, count: number, take: number): number[] {
  const src = phrase.notes
  if (src.length === 0) return Array.from({ length: count }, () => 0)

  const origin = scramble(take) % src.length

  const slice = Array.from(
    { length: Math.min(count, src.length) },
    (_, index) => src[(origin + index) % src.length]!,
  )
  const zero = slice[0]!.interval
  const intervals = slice.map((note) => note.interval - zero)

  while (intervals.length < count) {
    const last = intervals[intervals.length - 1] ?? 0
    const prev = intervals[intervals.length - 2] ?? last - 2
    const delta = last - prev || 2
    intervals.push(last + delta)
  }
  return intervals
}

function stepLadder(
  ladder: readonly MidiNote[],
  from: MidiNote,
  delta: number,
): MidiNote {
  if (ladder.length === 0) return from
  if (delta === 0) {
    const stay = ladder[nearestStep(ladder, from)]
    return stay ?? from
  }

  const want = from + delta
  const dir = Math.sign(delta)
  let best = from
  let bestDist = 99
  for (const note of ladder) {
    if (dir > 0 && note < from) continue
    if (dir < 0 && note > from) continue
    const dist = Math.abs(note - want)
    if (dist < bestDist) {
      best = note
      bestDist = dist
    }
  }

  if (best === from) {
    const index = nearestStep(ladder, from)
    const next = ladder[index + dir]
    if (next !== undefined) return next
  }
  return best
}

function paint(
  intervals: readonly number[],
  ladder: readonly MidiNote[],
  start: MidiNote,
): MidiNote[] {
  if (ladder.length === 0) return []
  const line: MidiNote[] = [ladder[nearestStep(ladder, start)] ?? start]
  for (let index = 1; index < intervals.length; index += 1) {
    const delta = intervals[index]! - intervals[index - 1]!
    line.push(stepLadder(ladder, line[index - 1]!, delta))
  }
  return line
}

function land(
  chord: ParsedChord,
  next: ParsedChord | undefined,
  near: MidiNote,
  key?: PlaceOptions['key'],
): MidiNote {
  const stables = new Set(
    keepInKey(
      chord.quality.intervals
        .filter((step) => step < 12)
        .map((step) => normalizePitchClass(chord.root + step)),
      key,
    ),
  )
  if (next) {
    const third = normalizePitchClass(
      next.root + (next.quality.intervals.includes(3) ? 3 : 4),
    )
    const approach = normalizePitchClass(third + 1)
    if (stables.has(approach)) stables.add(approach)
  }
  const classes =
    stables.size > 0 ? [...stables] : inKeyMaterial(chord, key)
  const ladder = ladderOf(classes, LOW, HIGH)
  return ladder[nearestStep(ladder, near)] ?? near
}

/**
 * Đặt câu Licky: hình nốt từ sổ, cao độ bám hợp âm đang vang, đủ nốt theo phách.
 */
/**
 * Đường bè trầm từ nốt gốc hợp âm này tới nốt gốc hợp âm kế, chia đều `count` nốt.
 *
 * Ưu tiên **bò lên**: tìm chỗ đứng của nốt đích ở phía trên chỗ xuất phát. Không
 * còn chỗ nào trên thang thì mới lùi xuống chỗ gần nhất bên dưới.
 */
function bassWalk(
  ladder: readonly MidiNote[],
  fromPc: number,
  toPc: number,
  count: number,
): MidiNote[] {
  const at = (pc: number, from: number, step: number) => {
    for (let i = from; i >= 0 && i < ladder.length; i += step) {
      if (ladder[i]! % 12 === pc) return i
    }
    return -1
  }
  const start = at(fromPc, 0, 1)
  if (start < 0) return []
  let end = at(toPc, start + 1, 1)
  if (end < 0) end = at(toPc, start - 1, -1)
  if (end < 0) return []

  const out: MidiNote[] = []
  for (let k = 0; k < count; k += 1) {
    const t = count === 1 ? 0 : k / (count - 1)
    out.push(ladder[Math.round(start + (end - start) * t)]!)
  }
  return out
}

export function placeLick(options: PlaceOptions): PlacedNote[] {
  const {
    chord,
    next,
    startBeat,
    beats,
    take = 0,
    mode = 'clone',
    kind,
    key = null,
    maxNotes,
    register,
    bassWalk: walk,
  } = options
  if (beats <= 0) return []

  const count = maxNotes
    ? Math.max(1, Math.min(maxNotes, noteCount(kind, beats)))
    : noteCount(kind, beats)
  const low = register?.low ?? LOW
  const high = register?.high ?? HIGH
  let intervals = shape(
    pick(kind, mode === 'create' ? take + 19 : take),
    count,
    take,
  )
  if (mode === 'create') {
    intervals = intervals.map((interval) => -interval)
  }

  const material = [...new Set(inKeyMaterial(chord, key))]
  const ladder = ladderOf(material, low, high)
  const root = (ANCHOR + normalizePitchClass(chord.root)) as MidiNote
  const startAt =
    ladder[
      (nearestStep(ladder, root > 78 ? ((root - 12) as MidiNote) : root) +
        (scramble(take + 3) % Math.max(1, Math.min(4, ladder.length)))) %
        Math.max(1, ladder.length)
    ] ?? root
  if (scramble(take + 5) % 2 === 1) {
    intervals = intervals.map((interval) => -interval)
  }
  /*
    Đường bass có **thang riêng**: chất liệu hợp âm đang chơi **cộng nốt gốc hợp
    âm kế**. Thang chung dựng từ mỗi hợp âm đang chơi, nên nốt đích thường không
    nằm trong đó — La sang Rê thì Rê vắng mặt, và đường dẫn không có chỗ để kết.
  */
  const walked = walk && next
    ? bassWalk(
        ladderOf(
          [...new Set([...material, normalizePitchClass(next.root)])],
          low,
          high,
        ),
        normalizePitchClass(chord.root),
        normalizePitchClass(next.root),
        count,
      )
    : []
  const pitches = walked.length > 0 ? walked : paint(intervals, ladder, startAt)
  // Đường bè trầm đã kết đúng nốt gốc hợp âm sau rồi, không cho `land` đổi nữa.
  if (walked.length === 0 && pitches.length > 0) {
    pitches[pitches.length - 1] = land(
      chord,
      next,
      pitches[pitches.length - 1]!,
      key,
    )
  }

  /*
    Khai `maxNotes` thì **giãn đều số nốt ấy trên cả khung**, không dùng lưới cố
    định nữa.

    `FILL_GRID` cố định 0.25 nốt đen là lưới của câu lót giai điệu, nơi cái cần
    là nốt chạy dày. Câu chạy bass thì ngược: hai nốt bass, mỗi nốt một ô lưới,
    rơi đúng hai phách cuối. Ép chúng vào lưới 0.25 là dồn cả hai vào nửa ô đầu
    rồi bỏ trống nửa sau.
  */
  const grid = maxNotes && pitches.length > 0 ? beats / pitches.length : gridOf(kind)
  return pitches.map((note, index) => {
    const at = startBeat + index * grid
    const last = index === pitches.length - 1
    return {
      note,
      startBeat: at,
      durationBeats: last
        ? Math.max(grid, startBeat + beats - at) * 0.95
        : grid * 0.9,
      isGrace: false as const,
      hand: note < HAND_SPLIT ? ('left' as const) : ('right' as const),
    }
  })
}
