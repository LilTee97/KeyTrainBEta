import { normalizePitchClass, pitchClassName } from '../../shared/musicTheory/pitch'
import { parseChordInput } from '../input/chordInputParser'
import type { ParsedChord } from '../types'
import { soanCauBlues } from './boSoanBlues'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

// Warp cả onset lẫn endpoint: tie qua vạch ô vẫn là MỘT tiếng.
const swing = (beat: number) => {
  const whole = Math.floor(beat)
  const fraction = beat - whole
  return whole + (fraction <= .5 ? fraction * 4 / 3 : 2 / 3 + (fraction - .5) * 2 / 3)
}

/*
  Dạo · giang · kết Twist. MẶC ĐỊNH từ 29/9/2026 (người dùng: "Hãy biến nút Twist: bộ soạn Blues … thành mặc định cho điệu Twist"):
  khung Twist (bass boogie, ô đi bass ngược chiều, ô báo, hợp âm kết) + tay phải các ô câu nhạc do Bộ Soạn Blues soạn (`soanCauBlues`).
  Cũ (27/9 – 29/9): bốn cặp mô-típ bè đôi nhắc–đáp dựng tay (`calls` / `answers`) — khôi phục từ commit 291d555.
*/
export function twistSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (reason: string): PhraseSection => ({
    events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason: reason,
  })
  if (!options.key) return empty('Twist Blues cần xác định giọng trước khi soạn solo.')
  const { tonic, scale } = options.key
  const minor = scale === 'minor'
  const { kind } = options
  const take = Math.abs(Math.trunc(options.take ?? 0))
  // Hai biến thể đường giảm tay phải ở ô đi bass và câu kết, đổi theo lượt.
  const lech = take % 2
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
  const bass = (bar: number, degree: number) => {
    const root = 36 + normalizePitchClass(tonic + degree)
    const third = minor && degree === 0 ? 3 : 4
    const line = [0, 0, third - 1, third, 7, 0, 9, 7]
    for (let i = 0; i < 8; i++) emit('left', bar * 4 + i / 2, .5, [root + line[i]!], i % 2 ? 68 : 76)
  }
  const harmony = (degree: number) => `${name(tonic + degree)}${degree === 0 ? minor ? 'm6' : '6' : degree === 5 ? '9' : '7'}`
  const barChord = (symbol: string, beats = 4) => { chords.push(symbol); beatsEach.push(beats) }
  // Ô câu nhạc: bass boogie đủ 8 tiếng; tay phải gom lại cho `soanCauBlues` soạn ở cuối hàm.
  const soan: { chord: ParsedChord; start: number; beats: number }[] = []
  const oCau = (bar: number, degree: number) => {
    barChord(harmony(degree))
    bass(bar, degree)
    const chord = parseChordInput(harmony(degree)).chords[0]
    if (chord) soan.push({ chord, start: bar * 4, beats: 4 })
  }
  const walk = (bar: number) => {
    // Chuyển động ngược RH giảm/LH tăng từ ô 4,32; nhịp và đuôi được soạn lại.
    const top = lech ? [12, 9, 10, 8] : [12, 10, 9, 8]
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
    oCau(0, 0)
    oCau(1, 5)
    walk(2)
    // Slash names follow the chromatic bass; never label the whole walk tonic.
    for (const degree of [0, minor ? 3 : 4, 5, 6]) barChord(`${name(tonic)}${minor ? 'm7' : '7'}/${name(tonic + degree)}`, 1)
    cue(3)
  } else if (kind === 'interlude') {
    // Khung 12 ô Boogie: I I I I | IV IV | I I | V IV | I | báo.
    [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0].forEach((degree, bar) => oCau(bar, degree))
    cue(11)
  } else {
    oCau(0, 0)
    walk(1)
    for (const degree of [0, minor ? 3 : 4, 5, 6]) barChord(`${name(tonic)}${minor ? 'm7' : '7'}/${name(tonic + degree)}`, 1)
    const upper = lech ? [9, 7, 5, 0] : [7, 5, 3, 0]
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
  /*
    Tay phải ô câu nhạc: nhóm ba Rockhouse, một nhóm = một phách swing (móc = ⅓ phách — Rockhouse là 4/4 lưới chùm ba, 735/810 cú
    đúng lưới). Mỗi cú tối đa 2 nốt (nốt đơn · bè đôi như sheet Twist). Khuôn nhắc – đáp theo sheet ô 22–31 (câu nhắc thở ở phách 4;
    câu đáp chạy nửa sau ô sang ô kế): ô chẵn và ô cuối — phách 1–3 câu thưa 1–2 cú, phách 4 nghỉ; ô lẻ — phách 1–2 thưa, phách 3–4
    câu chạy 2–3 cú mỗi phách. Mức cú là biên soạn của Claude — đo Đô trưởng 4 lượt: 6,4 cú mỗi ô (sheet: 50 cú / 10 ô = 5).
    Solo KHÔNG lặp mọi nhóm như riff (`lapMoiNhom` chỉ cho câu chạy lúc đệm hát): bản thử có lặp thì gần như ô nào cũng một nhóm ×3.
  */
  let iTruoc = -1, k = 0
  const r = soanCauBlues(soan, {
    key: options.key, take, mocDon: 1 / 3, uuTien: 'ray', chiNguon: 'ray', tam: [range.low, range.high], day: () => false, notToiDa: 2,
    loai: (_, i) => {
      k = i === iTruoc ? k + 1 : 0
      iTruoc = i
      if (i % 2 === 0 || i === soan.length - 1) return k === 3 ? 'nghi' : 'thua'
      return k >= 2 ? 'day' : 'thua'
    },
    muc: { thua: [1, 2], day: [2, 3] }, luc: (manh, n) => (manh ? 90 : n >= 3 ? 84 : 80),
    bamHop: true, noiHop: true, doiLuot: 2.5,
  })
  events.push(...r.events)
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
    sourcePhrase: { id: 'twist-bo-soan-blues', song: 'Rockhouse · Bộ Soạn Blues', fromBar: 1, barCount: soan.length, method: 'source-variation' },
    adaptationNote: `Twist · Bộ Soạn Blues: nhóm ba Rockhouse, một nhóm = một phách swing · nhóm: ${r.nguon.map(x => x.replace('Rockhouse:', '')).join(' ')}.` +
      (minor ? ' Giọng thứ là chuyển dụng: câu Rockhouse đặt ở giọng trưởng tương đối.' : ''),
  }
}
