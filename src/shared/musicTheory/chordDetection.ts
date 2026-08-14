import {
  CHORD_QUALITIES,
  chordPitchClasses,
} from './chordDefinitions'
import { normalizePitchClass, pitchClassName, pitchClassOf } from './pitch'
import type {
  AccidentalStyle,
  ChordQuality,
  MidiNote,
  PitchClass,
} from './types'

/**
 * Nhận diện hợp âm từ tập nốt đang bấm.
 *
 * Cùng một tập nốt có thể đọc thành nhiều tên hợp âm khác nhau — {C E G A}
 * vừa là C6 vừa là Am7, chỉ khác nhau ở nốt nào nằm dưới cùng. Vì vậy hàm
 * này trả về **danh sách ứng viên có xếp hạng**, không phải một đáp án duy
 * nhất, để phần gọi tự quyết định mức chặt chẽ cần thiết.
 */

/** Số lớp cao độ tối thiểu để bắt đầu đoán hợp âm. */
export const MIN_NOTES_FOR_DETECTION = 3

/**
 * Trọng số chấm điểm. Các con số này quyết định cách KeyTrain chọn giữa
 * nhiều cách đọc cùng hợp lệ, nên chỉnh chúng là chỉnh cảm nhận nhạc lý.
 */
const WEIGHTS = {
  /** Mỗi nốt bấm đúng nốt của hợp âm. */
  matchedNote: 10,
  /**
   * Nốt của hợp âm mà người chơi không bấm. Phạt nhẹ, vì thế bấm rút gọn
   * (shell voicing) bỏ bớt nốt là chuyện bình thường trong jazz.
   */
  missingNote: -3,
  /**
   * Nốt bấm không thuộc hợp âm. Phạt nặng, vì đây là dấu hiệu rõ nhất
   * rằng cách đọc này sai.
   */
  extraNote: -8,
  /** Hợp âm có vang nốt gốc — cách đọc chắc chắn hơn hẳn. */
  rootPresent: 5,
  /** Nốt gốc nằm dưới cùng, tức thế nguyên vị. */
  rootInBass: 4,
} as const

export interface ChordMatch {
  root: PitchClass
  quality: ChordQuality
  /** Lớp cao độ của nốt thấp nhất đang bấm. */
  bass: PitchClass
  /**
   * Thế đảo: 0 là nguyên vị, 1 là thế đảo 1…
   * Bằng null khi nốt bass không thuộc hợp âm (hợp âm chồng trên bass lạ).
   */
  inversion: number | null
  /** Tên đầy đủ để hiển thị, ví dụ 'Cmaj7' hoặc 'C/E'. */
  symbol: string
  score: number
  /** Độ tin cậy 0-1, tiện để hiển thị và đặt ngưỡng. */
  confidence: number
  /** Nốt của hợp âm mà người chơi chưa bấm. */
  missingNotes: PitchClass[]
  /** Nốt người chơi bấm nhưng không thuộc hợp âm. */
  extraNotes: PitchClass[]
}

export interface DetectChordsOptions {
  /** Số ứng viên trả về nhiều nhất. Mặc định 5. */
  maxResults?: number
  /** Cách ghi tên nốt trong ký hiệu hợp âm. */
  accidentalStyle?: AccidentalStyle
  /** Bỏ qua các ứng viên có độ tin cậy thấp hơn ngưỡng này. */
  minConfidence?: number
}

/**
 * Ghép tên hợp âm từ nốt gốc, tính chất và nốt bass.
 * Bass khác nốt gốc thì viết theo kiểu gạch chéo, ví dụ 'C/E'.
 */
export function formatChordSymbol(
  root: PitchClass,
  quality: ChordQuality,
  bass: PitchClass = root,
  style: AccidentalStyle = 'sharp',
): string {
  const base = `${pitchClassName(root, style)}${quality.symbol}`
  return normalizePitchClass(bass) === normalizePitchClass(root)
    ? base
    : `${base}/${pitchClassName(bass, style)}`
}

/**
 * Thế đảo tương ứng với nốt bass: vị trí của bass trong chuỗi nốt hợp âm
 * xếp từ gốc lên. Trả về null nếu bass không phải nốt của hợp âm.
 */
function inversionOf(
  root: PitchClass,
  quality: ChordQuality,
  bass: PitchClass,
): number | null {
  const ordered = quality.intervals.map((interval) =>
    normalizePitchClass(root + interval),
  )
  const index = ordered.indexOf(normalizePitchClass(bass))
  return index === -1 ? null : index
}

/**
 * Đoán các hợp âm khớp với tập nốt đang bấm, xếp theo độ tin cậy giảm dần.
 *
 * Nốt trùng nhau ở các quãng tám khác nhau được gộp làm một; riêng nốt thấp
 * nhất được giữ lại làm bass vì nó quyết định thế đảo và cách đọc tên.
 */
export function detectChords(
  notes: readonly MidiNote[],
  options: DetectChordsOptions = {},
): ChordMatch[] {
  const {
    maxResults = 5,
    accidentalStyle = 'sharp',
    minConfidence = 0,
  } = options

  if (notes.length === 0) return []

  const played = new Set(notes.map(pitchClassOf))
  if (played.size < MIN_NOTES_FOR_DETECTION) return []

  const bass = pitchClassOf(Math.min(...notes))
  const playedCount = played.size

  // Điểm cao nhất có thể đạt: khớp trọn vẹn, đủ nốt, đúng thế nguyên vị.
  const maxPossibleScore =
    playedCount * WEIGHTS.matchedNote +
    WEIGHTS.rootPresent +
    WEIGHTS.rootInBass

  const matches: ChordMatch[] = []

  for (let root = 0; root < 12; root += 1) {
    for (const quality of CHORD_QUALITIES) {
      const chordSet = new Set(chordPitchClasses(root, quality))

      const missingNotes: PitchClass[] = []
      for (const pitchClass of chordSet) {
        if (!played.has(pitchClass)) missingNotes.push(pitchClass)
      }

      const extraNotes: PitchClass[] = []
      for (const pitchClass of played) {
        if (!chordSet.has(pitchClass)) extraNotes.push(pitchClass)
      }

      const matched = chordSet.size - missingNotes.length
      // Không có lấy một nốt chung thì không đáng gọi là ứng viên.
      if (matched === 0) continue

      const rootPresent = played.has(root)
      const score =
        matched * WEIGHTS.matchedNote +
        missingNotes.length * WEIGHTS.missingNote +
        extraNotes.length * WEIGHTS.extraNote +
        (rootPresent ? WEIGHTS.rootPresent : 0) +
        (bass === root ? WEIGHTS.rootInBass : 0)

      const confidence = Math.max(0, Math.min(1, score / maxPossibleScore))
      if (confidence < minConfidence) continue

      matches.push({
        root,
        quality,
        bass,
        inversion: inversionOf(root, quality, bass),
        symbol: formatChordSymbol(root, quality, bass, accidentalStyle),
        score,
        confidence,
        missingNotes: missingNotes.sort((a, b) => a - b),
        extraNotes: extraNotes.sort((a, b) => a - b),
      })
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Điểm bằng nhau thì chọn cách đọc đơn giản hơn — ít nốt hơn thường
    // là tên gọi tự nhiên hơn với người chơi.
    return a.quality.intervals.length - b.quality.intervals.length
  })

  return matches.slice(0, maxResults)
}

/** Ứng viên tốt nhất, hoặc null nếu chưa đủ nốt để đoán. */
export function detectChord(
  notes: readonly MidiNote[],
  options: DetectChordsOptions = {},
): ChordMatch | null {
  return detectChords(notes, { ...options, maxResults: 1 })[0] ?? null
}
