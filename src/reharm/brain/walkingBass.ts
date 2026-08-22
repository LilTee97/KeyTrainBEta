import { maySound, teachersOf } from './gate'
import type { SoundMode } from './gate'
import type { TimelineEvent } from '../style/types'
import type { ParsedChord } from '../types'
import type { MidiNote } from '../../shared/musicTheory/types'

/**
 * Tay trái đi **walking bass 1-2-3-5**, theo Pianote.
 *
 * Đây là tuỳ chọn *thêm vào*, mặc định tắt. Tắt thì không có gì đổi: phần đệm
 * chạy đúng ô nhịp OneMotion như cũ, kể cả Pop 1. Bật thì tuyến trầm của ô nhịp
 * được thay bằng bốn nốt đen đi bộ, còn tay phải giữ nguyên.
 *
 * ## Luật, và chỗ nó khác nhau giữa trưởng và thứ
 *
 * Kho ghi rõ hai dòng: trên hợp âm trưởng tay trái đi gốc, bậc 2 trưởng, bậc 3
 * trưởng, bậc 5 đúng; trên hợp âm thứ thì **chỉ khác đúng bậc 3** — bậc 3 thứ.
 * Ví dụ trong kho: C đi C-D-E-G, Am đi A-B-C-E.
 *
 * Không có item Pianote nào qua được cửa chặn nguồn gốc thì hàm trả `null`, và
 * bên gọi giữ nguyên tay trái cũ — không tự chế một đường bass.
 */
const NEEDED = [
  'pianote-wb-formula-1235',
  'pianote-wb-major-walk',
  'pianote-wb-minor-walk',
]

/** Nốt gốc gần nhất **không cao hơn** trần, để tuyến trầm khỏi trèo lên giữa đàn. */
const CEILING = 52

function bassRoot(pitchClass: number): number {
  let midi = pitchClass
  while (midi + 12 <= CEILING) midi += 12
  return midi
}

export interface WalkingBassRequest {
  chords: readonly ParsedChord[]
  /** Số phách mỗi hợp âm chiếm; `beatsEach` ghi đè cho từng hợp âm một. */
  beatsPerChord: number
  beatsEach?: readonly number[]
  mode?: SoundMode
}

export interface WalkingBass {
  events: TimelineEvent[]
  /** Thầy nào đứng sau, để gắn huy hiệu. */
  teachers: string[]
  authorizedBy: string[]
}

export function walkingBassLine(
  request: WalkingBassRequest,
): WalkingBass | null {
  const { chords, beatsPerChord, beatsEach, mode } = request
  if (chords.length === 0) return null
  if (!maySound(NEEDED, mode)) return null

  const events: TimelineEvent[] = []
  let cursor = 0

  for (const [index, chord] of chords.entries()) {
    const beats = beatsEach?.[index] ?? beatsPerChord
    /*
      Hợp âm bị chia ngắn hơn hai phách thì không đủ chỗ cho bốn bước đi — giữ
      im chỗ đó, để tuyến trầm khỏi thành một chuỗi nốt kép lộn xộn.
    */
    if (beats < 2) {
      cursor += beats
      continue
    }

    // Bậc 3 là chỗ duy nhất trưởng và thứ khác nhau, đúng như kho ghi.
    const third = chord.quality.intervals.includes(3) ? 3 : 4
    const steps = [0, 2, third, 7]
    const root = bassRoot(chord.root)
    const stepBeats = beats / steps.length

    steps.forEach((semitones, step) => {
      events.push({
        notes: [(root + semitones) as MidiNote],
        startBeat: cursor + step * stepBeats,
        durationBeats: stepBeats * 0.9,
        hand: 'left',
        velocity: step === 0 ? 84 : 72,
        grace: false,
      })
    })

    cursor += beats
  }

  if (events.length === 0) return null

  return { events, teachers: teachersOf(NEEDED), authorizedBy: NEEDED }
}
