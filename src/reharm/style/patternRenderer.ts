import type { MidiNote } from '../../shared/musicTheory/types'
import type { TwoHandVoicing } from '../voicingGenerator/handSplitVoicing'
import type { HitVoice, StylePattern, TimelineEvent } from './types'

/**
 * Biến chuỗi thế bấm hai tay thành dòng thời gian các tiếng đàn.
 *
 * Có hai nhánh, đúng theo cách tài liệu nguồn phân loại điệu:
 *
 * - Điệu **có mẫu tiết tấu cố định** (bossa, valse, swing): lặp lại mẫu đó
 *   bất kể hợp âm là gì.
 * - Điệu **không có mẫu** (ballad): tiết tấu bám theo nhịp đổi hợp âm của
 *   từng bài, nốt dài khi hợp âm ngân lâu và ngắn khi hợp âm đổi dày.
 */

/** Lực nhấn chuẩn của tiếng đàn trong phần đệm. */
const BASE_VELOCITY = 80

/** Tay trái đánh nhẹ hơn tay phải để giai điệu và hợp âm nổi lên trên. */
const LEFT_HAND_SCALE = 0.85

export interface RenderOptions {
  /** Số phách mỗi hợp âm chiếm. Mặc định trọn một ô nhịp. */
  beatsPerChord?: number
  /** Cắt bớt độ ngân để hai hợp âm liền nhau không chồng tiếng. */
  releaseRatio?: number
}

function clampVelocity(value: number): number {
  return Math.max(1, Math.min(127, Math.round(value)))
}

/**
 * Chọn nốt cho một tiếng đàn: cả hợp âm, hay chỉ nốt trên cùng hoặc dưới cùng.
 *
 * Điệu swing cần lấy riêng nốt trên cùng cho những tiếng ở chỗ nảy — đó chính
 * là phần "nốt đơn" xen kẽ giữa các hợp âm.
 */
function notesForVoice(
  notes: readonly MidiNote[],
  voice: HitVoice = 'chord',
): MidiNote[] {
  if (notes.length === 0) return []

  switch (voice) {
    case 'top':
      return [notes[notes.length - 1]]
    case 'bottom':
      return [notes[0]]
    default:
      return [...notes]
  }
}

/**
 * Nhánh ballad: hợp âm khối, hai tay đánh cùng lúc theo nhịp đổi hợp âm.
 *
 * Khi một hợp âm chiếm trọn từ một ô nhịp trở lên, hợp âm được đánh lại ở giữa
 * quãng đó thay vì ngân suốt — đúng với giá trị nốt trắng quan sát được trong
 * các bản notate của tài liệu, và giữ cho phần đệm khỏi chết lặng.
 */
function renderBlockChords(
  voicings: readonly TwoHandVoicing[],
  beatsPerChord: number,
  beatsPerMeasure: number,
  releaseRatio: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  voicings.forEach((voicing, index) => {
    const chordStart = index * beatsPerChord

    // Hợp âm ngân từ một ô nhịp trở lên thì chia đôi để đánh lại.
    const strikeCount = beatsPerChord >= beatsPerMeasure ? 2 : 1
    const strikeLength = beatsPerChord / strikeCount

    for (let strike = 0; strike < strikeCount; strike += 1) {
      const startBeat = chordStart + strike * strikeLength
      const durationBeats = strikeLength * releaseRatio

      // Lần đánh lại nhẹ hơn lần đầu, để nghe ra đâu là chỗ đổi hợp âm.
      const emphasis = strike === 0 ? 1 : 0.8

      events.push({
        notes: voicing.right,
        startBeat,
        durationBeats,
        hand: 'right',
        velocity: clampVelocity(BASE_VELOCITY * emphasis),
      })

      events.push({
        notes: voicing.left,
        startBeat,
        durationBeats,
        hand: 'left',
        velocity: clampVelocity(BASE_VELOCITY * emphasis * LEFT_HAND_SCALE),
      })
    }
  })

  return events
}

/**
 * Nhánh điệu có mẫu tiết tấu cố định: lặp mẫu, mỗi lần lặp lấy thế bấm của hợp
 * âm đang vang tại thời điểm đó.
 */
function renderWithCell(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  beatsPerChord: number,
  releaseRatio: number,
): TimelineEvent[] {
  const cell = pattern.cell
  if (!cell) return []

  const totalBeats = voicings.length * beatsPerChord
  const events: TimelineEvent[] = []

  for (let offset = 0; offset < totalBeats; offset += cell.lengthBeats) {
    for (const hand of ['right', 'left'] as const) {
      const hits = hand === 'right' ? cell.right : cell.left

      for (const hit of hits) {
        const startBeat = offset + hit.beat
        if (startBeat >= totalBeats) continue

        // Hợp âm nào đang vang tại thời điểm này.
        const voicing = voicings[Math.floor(startBeat / beatsPerChord)]
        if (!voicing) continue

        const source = hand === 'right' ? voicing.right : voicing.left
        const notes = notesForVoice(source, hit.voice)
        const handScale = hand === 'left' ? LEFT_HAND_SCALE : 1

        events.push({
          notes,
          startBeat,
          durationBeats: hit.durationBeats * releaseRatio,
          hand,
          velocity: clampVelocity(
            BASE_VELOCITY * (hit.velocityScale ?? 1) * handScale,
          ),
        })
      }
    }
  }

  return events
}

/** Dựng dòng thời gian cho cả đoạn. */
export function renderPattern(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  options: RenderOptions = {},
): TimelineEvent[] {
  const {
    beatsPerChord = pattern.beatsPerMeasure,
    releaseRatio = 0.92,
  } = options

  if (voicings.length === 0) return []

  const events = pattern.cell
    ? renderWithCell(voicings, pattern, beatsPerChord, releaseRatio)
    : renderBlockChords(
        voicings,
        beatsPerChord,
        pattern.beatsPerMeasure,
        releaseRatio,
      )

  return events.sort((a, b) => a.startBeat - b.startBeat)
}

/** Tổng độ dài của dòng thời gian, tính bằng phách. */
export function timelineLengthBeats(events: readonly TimelineEvent[]): number {
  let last = 0
  for (const event of events) {
    last = Math.max(last, event.startBeat + event.durationBeats)
  }
  return last
}

/** Lọc theo tay, dùng cho chế độ luyện tay trái hoặc tay phải riêng. */
export function eventsForHand(
  events: readonly TimelineEvent[],
  hand: 'left' | 'right' | 'both',
): TimelineEvent[] {
  if (hand === 'both') return [...events]
  return events.filter((event) => event.hand === hand)
}
