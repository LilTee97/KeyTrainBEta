import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

// Vốn câu mới, theo cách phát triển bè đôi/nhắc–đáp của ô 22–31.
// Quãng tính từ TONIC bài, không đổi theo từng root bass. Xem TWIST-SOLO-SOURCE.md.
const calls = [
  [[7, 12], [4, 7], [5, 9], [3, 6], [4, 7]],
  [[7, 12], [5, 9], [4, 7], [3, 6], [4, 7]],
  [[7, 12], [4, 7], [3, 6], [4, 7], [0]],
  [[7, 12], [3, 6], [4, 7], [5, 9], [4, 7]],
] as const
const answers = [
  [[0], [5, 9], [4, 7], [3, 6], [4, 7]],
  [[4, 7], [5, 9], [7, 12], [4, 7], [0]],
  [[7, 12], [5, 9], [3, 6], [4, 7], [0]],
  [[0], [3, 6], [4, 7], [5, 9], [4, 7]],
] as const

// Warp cả onset lẫn endpoint: tie qua vạch ô vẫn là MỘT tiếng.
const swing = (beat: number) => {
  const whole = Math.floor(beat)
  const fraction = beat - whole
  return whole + (fraction <= .5 ? fraction * 4 / 3 : 2 / 3 + (fraction - .5) * 2 / 3)
}

/** Câu Blues mới; LH boogie và RH solo cùng một bản soạn, không chồng RH đệm. */
export function twistSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (reason: string): PhraseSection => ({
    events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason: reason,
  })
  if (!options.key) return empty('Twist Blues cần xác định giọng trước khi soạn solo.')
  const { tonic, scale } = options.key
  const minor = scale === 'minor'
  const { kind } = options
  const take = Math.abs(Math.trunc(options.take ?? 0))
  const variant = take % calls.length
  const range = options.range ?? { low: 60, high: 84 }
  // Chuyển cả câu theo quãng tám, không bẻ từng nốt làm hỏng nét đi bè đôi.
  const bases = Array.from({ length: 10 }, (_, i) => 12 * i + tonic)
    .filter(base => base >= range.low && base + 12 <= range.high)
  const base = bases.sort((a, b) => Math.abs(a - (60 + tonic)) - Math.abs(b - (60 + tonic)))[0]
  if (base === undefined) return empty('Tầm tay phải quá hẹp để giữ nguyên câu Blues một quãng tám của giọng này.')
  const events: TimelineEvent[] = []
  const chords: string[] = []
  const beatsEach: number[] = []
  const name = (pc: number) => pitchClassName(normalizePitchClass(pc), 'flat')
  // Giọng thứ là chuyển dụng: 2→b3 thay b3→3, giữ 6 tự nhiên như bass Twist.
  const color = (offset: number) => minor && offset === 4 ? 3 : minor && offset === 3 ? 2 : offset
  const emit = (hand: 'left' | 'right', at: number, duration: number, notes: readonly number[], velocity = 82) => {
    events.push({ hand, startBeat: swing(at), durationBeats: swing(at + duration) - swing(at), notes: [...notes], velocity })
  }
  const right = (at: number, duration: number, offsets: readonly number[], velocity = 88) =>
    emit('right', at, duration, offsets.map(n => base + color(n)), velocity)
  const grace = (at: number) => {
    const end = swing(at)
    events.push({ hand: 'right', startBeat: end - .12, durationBeats: .12,
      notes: [base + color(3), base + 6], velocity: 67, grace: true })
  }
  const bass = (bar: number, degree: number, count = 8) => {
    const root = 36 + normalizePitchClass(tonic + degree)
    const third = minor && degree === 0 ? 3 : 4
    const line = [0, 0, third - 1, third, 7, 0, 9, 7]
    for (let i = 0; i < count; i++) emit('left', bar * 4 + i / 2, .5, [root + line[i]!], i % 2 ? 68 : 76)
  }
  const harmony = (degree: number) => `${name(tonic + degree)}${degree === 0 ? minor ? 'm6' : '6' : degree === 5 ? '9' : '7'}`
  const barChord = (symbol: string, beats = 4) => { chords.push(symbol); beatsEach.push(beats) }
  const motif = (bar: number, answer: boolean, tiedIn: boolean, pickup: boolean, development = 0) => {
    const index = (variant + development) % calls.length
    const notes = answer ? answers[index]! : calls[index]!
    const times = [answer ? .5 : 0, 1, 1.5, 2, 2.5]
    notes.forEach((pair, i) => {
      if (i === 0 && tiedIn) return
      if (i === 0 && answer && pair[0] === 4) grace(bar * 4 + times[i]!)
      right(bar * 4 + times[i]!, i === 0 && !answer ? 1 : .5, pair, answer ? 84 : 90)
    })
    if (pickup) right(bar * 4 + 3.5, 1.5, [7, 12], 85)
  }
  const walk = (bar: number) => {
    // Chuyển động ngược RH giảm/LH tăng từ ô 4,32; nhịp và đuôi được soạn lại.
    const top = variant % 2 ? [12, 9, 10, 8] : [12, 10, 9, 8]
    const low = [0, minor ? 3 : 4, 5, 6]
    for (let i = 0; i < 4; i++) {
      emit('left', bar * 4 + i, i > 1 ? .65 : 1, [36 + tonic + low[i]!], 77)
      right(bar * 4 + i + (i === 0 ? .5 : 0), i === 0 ? .5 : 1, [top[i]!], 86 - i * 2)
    }
  }
  const cue = (bar: number) => {
    const target = options.opening?.root ?? tonic
    const root = normalizePitchClass(target + 7)
    const fit = (offsets: number[]) => {
      let notes = offsets.map(n => 60 + root + n)
      while (Math.max(...notes) > range.high) notes = notes.map(n => n - 12)
      while (Math.min(...notes) < range.low) notes = notes.map(n => n + 12)
      return notes
    }
    // Hợp âm át của hợp âm vào hát; hai tay dừng phách 4 để báo vào.
    const voicing = fit([0, 4, 10])
    emit('left', bar * 4, .5, [36 + root], 81)
    emit('right', bar * 4, .5, voicing, 91)
    emit('right', bar * 4 + .5, .5, fit([10]), 79)
    emit('right', bar * 4 + 1, .5, fit([3]), 78)
    emit('left', bar * 4 + 1.5, 1.5, [36 + root], 84)
    emit('right', bar * 4 + 1.5, 1.5, voicing, 91)
    barChord(`${name(root)}7`)
  }

  if (kind === 'intro') {
    for (let bar = 0; bar < 2; bar++) {
      const degree = bar === 0 ? 0 : 5
      barChord(harmony(degree))
      bass(bar, degree, 5)
      const word = bar === 0 ? calls[variant]! : answers[variant]!
      for (let i = 0; i < 3; i++) right(bar * 4 + i, i === 2 ? .4 : .5, word[i]!)
      grace(bar * 4 + 2.5)
      const tail = variant % 2 ? [4, 9, 7] : [4, 7, 9]
      tail.forEach((n, i) => right(bar * 4 + 2.5 + i / 2, .5, [n], 80 + i * 3))
    }
    walk(2)
    // Slash names follow the chromatic bass; never label the whole walk tonic.
    for (const degree of [0, minor ? 3 : 4, 5, 6]) barChord(`${name(tonic)}${minor ? 'm7' : '7'}/${name(tonic + degree)}`, 1)
    cue(3)
  } else if (kind === 'interlude') {
    const roots = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5]
    roots.forEach((degree, bar) => {
      barChord(harmony(degree))
      bass(bar, degree)
      // Nhắc rồi đáp: cùng hạt nhân trên I/IV, phát triển sang biến thể khác ở V/IV.
      motif(bar, bar % 2 === 1, bar > 0 && bar % 2 === 0, bar % 2 === 1 && bar < 8, bar >= 8 ? 1 : 0)
    })
    barChord(harmony(0))
    bass(10, 0)
    motif(10, false, false, false, 2)
    cue(11)
  } else {
    barChord(harmony(0))
    bass(0, 0)
    motif(0, false, false, false)
    walk(1)
    for (const degree of [0, minor ? 3 : 4, 5, 6]) barChord(`${name(tonic)}${minor ? 'm7' : '7'}/${name(tonic + degree)}`, 1)
    const upper = variant % 2 ? [9, 7, 5, 0] : [7, 5, 3, 0]
    const lower = [7, 9, 11, 12]
    for (let i = 0; i < 4; i++) {
      right(8 + i / 2, .5, [upper[i]!], 84 - i * 3)
      emit('left', 8 + i / 2, .5, [36 + tonic + lower[i]!], 76)
      barChord(`${name(tonic)}${minor ? 'm7' : '7'}/${name(tonic + lower[i]!)}`, .5)
    }
    barChord('Nghỉ', 1)
    // Nghỉ chung phách 3; tiếng chốt phách 4 nối trọn ô cuối, không gõ lại.
    emit('left', 11, 5, [36 + tonic, 48 + tonic], 76)
    emit('right', 11, 5, [2, minor ? 3 : 4, 7, minor ? 9 : 10].map(n => base + n), 84)
    barChord(`${name(tonic)}${minor ? 'm6/9' : '9'}`, 5)
  }
  if (events.some(e => e.hand === 'right' && e.notes.some(n => n < range.low || n > range.high))) {
    return empty('Tầm tay phải không đủ cho thế bấm báo vào của giọng này.')
  }
  events.sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand))
  let chordEnd = 0
  const swungBeatsEach = beatsEach.map(duration => {
    const start = chordEnd
    chordEnd += duration
    return swing(chordEnd) - swing(start)
  })
  return {
    events, chords, beatsEach: swungBeatsEach, lengthBeats: kind === 'interlude' ? 48 : 16,
    sourcePhrase: { id: 'twist-boogie-blues', song: 'Boogie Woogie Basics',
      fromBar: kind === 'intro' ? 2 : kind === 'interlude' ? 22 : 32,
      barCount: kind === 'intro' ? 4 : kind === 'interlude' ? 10 : 3, method: 'motif-development' },
    adaptationNote: `Twist Blues · câu mới ${variant + 1}/4 từ bè đôi, nhắc–đáp và khoảng nghỉ Boogie Woogie; swing 2:1.${minor ? ' Giọng thứ là chuyển dụng Dorian Blues, nguồn chỉ có tâm C trưởng.' : ''}`,
  }
}
