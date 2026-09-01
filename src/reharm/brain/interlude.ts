import { brain } from './index'
import { degreeOf } from '../reharmEngine/degreeAnalysis'
import { pullStrength } from '../style/interludeLoop'
import type { ParsedChord } from '../types'
import type { KnowledgeItem } from './index'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'

/**
 * Não chọn bốn hợp âm cho đoạn giang tấu.
 *
 * KeyTrain vẫn là bên mở chỗ trống: nó biết đoạn nào là điệp khúc, ô nào bị
 * chia đôi, đoạn sau bắt đầu bằng hợp âm gì. Não chỉ được hỏi **lấy bốn hợp âm
 * nào**, và chỉ trả lời khi trong kho có một vòng hòa âm mà thầy Hải đã nói rõ
 * là dùng được cho Intro / Dạo giữa / Kết bài. Không có thì trả `null` và
 * `chooseChorusLoop` cũ của KeyTrain chạy tiếp như thường.
 *
 * Vì sao đáng hỏi: cách cũ chấm điểm theo "khoảng nào lặp lại nhiều" cộng sức
 * hút của hợp âm cuối. Đúng về mặt máy móc nhưng không biết vòng nào *nghe ra
 * một đoạn dạo*. Kho thì biết — thầy chỉ đích danh vài vòng cho việc này, ví dụ
 * I-IV-ii-V-I và 1-6-4-5-1.
 */
const FOR_INTERLUDE =
  /intro|outro|giang t[aấ]u|interlude|d[aạ]o gi[uữ]a|d[aạ]o [dđ][aầ]u|k[eế]t b[aà]i/i

/*
  Bắt buộc có chữ "vòng hòa âm" hoặc "tiến trình" ở gần.

  Không có bộ lọc này thì `1-3-5-7` (bậc của hợp âm) và `1-5-1-3` (mẫu rải tay
  trái) cũng lọt vào, mà chúng không phải vòng hợp âm — dùng chúng để chọn đoạn
  giang tấu là hiểu sai kho.
*/
const IS_PROGRESSION = /v[oò]ng\s+h[oò]a?\s*[aâ]m|ti[eế]n tr[iì]nh|v[oò]ng\s+h[oà]a/i

const ROMAN_VALUE: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
}

/** "IV" -> 4, "6" -> 6. Không đọc được thì `null`. */
function degreeValue(token: string): number | null {
  if (/^[1-7]$/.test(token)) return Number(token)
  const value = ROMAN_VALUE[token.toLowerCase()]
  return value ?? null
}

export interface EndorsedProgression {
  degrees: number[]
  /** Item của thầy đã cho phép dùng vòng này làm đoạn dạo. */
  from: string
}

const CHAIN = /\b((?:[IVXivx]{1,4}|[1-7])(?:\s*[-–>]+\s*(?:[IVXivx]{1,4}|[1-7])){2,})/g

/** Những vòng hòa âm thầy Hải nói rõ là dùng được cho đoạn dạo. */
export function endorsedProgressions(
  items: readonly KnowledgeItem[],
): EndorsedProgression[] {
  const out: EndorsedProgression[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (item.origin !== 'extracted') continue
    if (item.source?.teacher_id !== 'hai-joseph') continue

    const text = `${item.name} ${item.note_vi ?? ''}`
    if (!FOR_INTERLUDE.test(text) || !IS_PROGRESSION.test(text)) continue

    CHAIN.lastIndex = 0
    for (let m = CHAIN.exec(text); m; m = CHAIN.exec(text)) {
      const degrees = m[1]
        .split(/\s*[-–>]+\s*/)
        .map(degreeValue)
        .filter((d): d is number => d !== null)
      if (degrees.length < 3) continue

      const key = `${item.id}:${degrees.join('-')}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ degrees, from: item.id })
    }
  }

  return out
}

let cached: EndorsedProgression[] | null = null
const progressions = (): EndorsedProgression[] =>
  (cached ??= endorsedProgressions(brain().items))

/** `needle` nằm gọn trong `hay` theo đúng thứ tự liền nhau. */
function contains(hay: readonly number[], needle: readonly number[]): boolean {
  if (needle.length === 0 || needle.length > hay.length) return false
  for (let at = 0; at + needle.length <= hay.length; at += 1) {
    let all = true
    for (let i = 0; i < needle.length; i += 1) {
      if (hay[at + i] !== needle[i]) {
        all = false
        break
      }
    }
    if (all) return true
  }
  return false
}

export interface InterludeChoice {
  from: number
  to: number
  /** Vì sao chọn chỗ này, để nói lại cho người học. */
  why: string
  /** Item của thầy cho phép lựa chọn này. Rỗng thì không được dán nhãn. */
  authorizedBy: string[]
}

export interface InterludeRequest {
  chords: readonly ParsedChord[]
  key: { tonic: PitchClass; scale: ScaleType } | null
  /** Hợp âm đầu tiên của đoạn ngay sau giang tấu, để đoạn cuối hút về đó. */
  nextChord?: ParsedChord | null
  size?: number
}

export function brainInterludeWindow(
  request: InterludeRequest,
): InterludeChoice | null {
  const { chords, key, nextChord, size = 4 } = request
  if (!key || chords.length < size) return null

  /*
    Giọng thứ quy về giọng trưởng song song trước khi tra bậc — cùng lý do như
    câu lót: kho của thầy đánh số bậc theo giọng trưởng.
  */
  const tonic: PitchClass =
    key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic
  const degrees = chords.map((chord) => degreeOf(chord.root, tonic, 'major'))

  const endorsed = progressions()
  let best: (InterludeChoice & { score: number }) | null = null

  for (let from = 0; from + size <= chords.length; from += 1) {
    const to = from + size - 1
    const window = degrees.slice(from, to + 1)
    // Có hợp âm ngoài giọng thì không tra bậc được, bỏ qua khoảng này.
    if (window.some((d) => d === null)) continue

    const matched = endorsed.filter((p) =>
      contains(p.degrees, window as number[]),
    )
    if (matched.length === 0) continue

    const pull = nextChord ? pullStrength(chords[to], nextChord) : 0
    const score = matched.length + pull
    if (best && score <= best.score) continue

    best = {
      from,
      to,
      score,
      why: `vòng ${(window as number[]).join('-')} nằm trong vòng hòa âm thầy Hải chỉ dùng cho đoạn dạo`,
      authorizedBy: [...new Set(matched.map((p) => p.from))].slice(0, 3),
    }
  }

  if (!best) return null
  const { score: _score, ...choice } = best
  return choice
}
