import { normalizePitchClass as pc, pitchClassName } from '../../shared/musicTheory/pitch'
import { beatsOf, chordStarts } from '../chordTiming'
import { parseChordInput } from '../input/chordInputParser'
import { colorBluesHarmony } from '../reharmEngine/bluesHarmony'
import type { ParsedChord } from '../types'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { bluesCodexPass, colorBluesCodexBacking } from './bluesCodex'
import { renderPattern } from './patternRenderer'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import type { TimelineEvent } from './types'

type LineOptions = Pick<PhraseSectionOptions, 'key' | 'beatsPerChord' | 'take' | 'range'>

// Cao độ tương đối với TÂM GIỌNG, không đổi gam Blues mỗi khi đổi hợp âm.
// Rockhouse 35/45/47; Robert 31/82/129. Trường độ dưới đây do Codex soạn lại cho 6/8.
const WORDS = [
  [7, 8, 9, 12], [14, 12, 14, 12, 9, 7],
  [12, 14, 10, 7, 10, 7], [15, 14, 10, 5, 4],
  [3, 4, 5, 3, 0, -5],
]

/** Câu 4–6 nốt / hai ô; láy nhẹ, bè đôi ở đích và khoảng thở. */
export function composeBluesCodexLine(chords: readonly ParsedChord[], options: LineOptions): TimelineEvent[] {
  if (!chords.length || !options.key) return []
  const { tonic, scale } = options.key
  const { low = 60, high = 84 } = options.range ?? {}
  const starts = chordStarts(chords, options.beatsPerChord)
  const total = starts.at(-1)! + beatsOf(chords.at(-1)!, options.beatsPerChord)
  const take = Math.abs(Math.floor(options.take ?? 0))
  const events: TimelineEvent[] = []
  const notesInRange = Array.from({ length: Math.max(0, high - low + 1) }, (_, i) => low + i)
  const nearest = (notes: number[], target: number) => notes.reduce((best, n) =>
    Math.abs(n - target) < Math.abs(best - target) ? n : best, notes[0])
  if (!notesInRange.length) return []
  for (let start = 0, phrase = 0; start < total; start += 6, phrase++) {
    // Nhắc câu hỏi rồi đổi đuôi đáp; lượt sau đổi hạt nhân, không chạy ngẫu nhiên từng nốt.
    const word = WORDS[(take + Math.floor(phrase / 2) * 2 + phrase % 2) % WORDS.length]
    const begin = start + (phrase % 2 ? 1 : 0.5)
    const until = Math.min(start + 6, total)
    const count = Math.min(word.length, Math.floor((until - begin) / 0.5))
    for (let i = 0; i < count; i++) {
      const at = begin + i * 0.5
      const ci = starts.findLastIndex(b => b <= at + 1e-6)
      const chord = chords[ci]
      const tones = chord.quality.intervals.map(n => pc(n + chord.root))
      const chordNotes = notesInRange.filter(n => tones.includes(pc(n)))
      if (!chordNotes.length) continue
      let step = word[i]
      if (scale === 'minor' && pc(step) === 4) step -= 1
      if (scale === 'minor' && pc(step) === 9) step += 1
      const samePitch = notesInRange.filter(n => pc(n) === pc(tonic + step))
      let note = nearest(samePitch.length ? samePitch : chordNotes, 60 + tonic + step)
      const last = i === count - 1
      const local = chord.quality.intervals.map(pc)
      const ordinary = local.includes(7) && (local.includes(3) || local.includes(4)) &&
        !local.includes(1) && !(local.includes(3) && local.includes(4))
      const bluesFunction = [0, 5, 7].includes(pc(chord.root - tonic))
      // Đích câu, đầu ô, sus/dim/altered và hòa âm ngoài I–IV–V bám nốt thật của hợp âm.
      // Tránh giữ 3 trưởng của I thành maj7 trên IV7; b3/3 vẫn là nét lướt ngắn.
      if (last || at % 3 === 0 || !ordinary || !bluesFunction ||
          (local.includes(10) && pc(note - chord.root) === 11) ||
          (local.includes(3) && !local.includes(4) && pc(note - chord.root) === 4)) {
        note = nearest(chordNotes, note)
      }
      const end = Math.min(at + (last ? 1.15 : 0.48), until, starts[ci + 1] ?? total)
      if (end <= at) continue
      // Láy là lựa chọn biểu diễn Codex; không gọi đây là ngón/pedal đã đo của Ray.
      const crush = phrase % 2 === 1 && last && local.includes(4) &&
        pc(note - chord.root) === 4 && note - 1 >= low
      if (crush) events.push({ notes: [note - 1], startBeat: at, durationBeats: 0.035,
        velocity: 45, hand: 'right', grace: true })
      const support = last && phrase % 2 === 0
        ? chordNotes.filter(n => n < note && note - n >= 3 && note - n <= 7).at(-1) : undefined
      const delay = crush ? 0.045 : 0
      events.push({ notes: support === undefined ? [note] : [support, note],
        startBeat: at + delay, durationBeats: end - at - delay,
        velocity: last ? 83 : i === 0 ? 80 : 75, hand: 'right' })
    }
  }
  return events
}

/** Dạo/giang/kết riêng, cùng nền hai tay Blues Codex 1. Không lấy Boogie Woogie. */
export function bluesCodexSolo(options: PhraseSectionOptions): PhraseSection {
  const { key, kind, style, beatsPerChord, opening } = options
  if (!key) return { events: [], lengthBeats: 0, chords: [], beatsEach: [],
    unavailableReason: 'Chọn giọng bài để soạn solo Blues Codex 1.' }
  const low = options.range?.low ?? 60, high = options.range?.high ?? 84
  if (high - low < 12) return { events: [], lengthBeats: 0, chords: [], beatsEach: [],
    unavailableReason: 'Solo Blues cần tầm tay phải ít nhất một quãng tám.' }
  const minor = key.scale === 'minor'
  const chord = (degree: number, quality: string) =>
    parseChordInput(`${pitchClassName(pc(key.tonic + degree))}${quality}`).chords[0]!
  const tonic = chord(0, minor ? 'm7' : '7')
  const sub = chord(5, minor ? 'm7' : '9')
  const dominant = chord(7, '9')
  const borrowed = kind === 'intro' ? options.songIntro ?? options.songChords : options.songChords
  // Vòng có sẵn giữ chức năng và thời lượng. 12 ô chỉ là phương án khi chưa có vòng bài.
  let chords = kind === 'outro' ? [sub, tonic, dominant, chord(0, minor ? 'm6' : '6/9')]
    : borrowed?.length ? [...borrowed.slice(0, kind === 'intro' ? 4 : 8)]
      : kind === 'intro' ? [tonic, sub, tonic, dominant]
        : [tonic, tonic, tonic, tonic, sub, sub, tonic, tonic, dominant, sub, tonic, dominant]
  if (kind === 'interlude' && !borrowed?.length) chords = chords.map(c => ({ ...c, beats: 3 }))
  chords = colorBluesHarmony(chords, key)
  if (kind !== 'outro' && opening && chords.length) {
    const pull = parseChordInput(`${pitchClassName(pc(opening.root + 7))}7`).chords[0]!
    chords[chords.length - 1] = { ...pull, beats: chords.at(-1)!.beats }
  }
  const beatsEach = chords.map(c => beatsOf(c, beatsPerChord))
  const lengthBeats = beatsEach.reduce((a, b) => a + b, 0)
  const backing = colorBluesCodexBacking(renderPattern(voiceLeadTwoHands(chords, {
    dropRootFromRightHand: options.dropRoot,
  }), style, { beatsPerChord, beatsEach }), chords, beatsPerChord).map(e => {
    if (e.hand === 'left') return e
    const notes = e.notes.map(n => {
      while (n < low) n += 12
      while (n > high) n -= 12
      return n
    }).sort((a, b) => a - b)
    if (notes.at(-1)! - notes[0] > 12) notes[0] += 12
    return { ...e, notes: notes.sort((a, b) => a - b) }
  })
  let line = composeBluesCodexLine(chords, options)
  let base = backing
  if (kind === 'outro') {
    // Thưa dần và chốt ngân: không để mẫu bass tiếp tục gõ dưới tiếng kết.
    const close = lengthBeats - Math.min(3, beatsEach.at(-1)!)
    const clip = (events: TimelineEvent[]) => events.filter(e => e.startBeat < close)
      .map(e => ({ ...e, durationBeats: Math.min(e.durationBeats, close - e.startBeat) }))
    line = clip(line)
    base = clip(base)
    let root = 60 + key.tonic
    while (root + 9 > high) root -= 12
    while (root + (minor ? 3 : 4) < low) root += 12
    const notes = (minor ? [3, 7, 9] : [2, 4, 7, 9]).map(step => {
      let n = root + step
      while (n < low) n += 12
      while (n > high) n -= 12
      return n
    }).sort((a, b) => a - b)
    if (notes.every(n => n >= low && n <= high)) line.push({ notes, startBeat: close,
      durationBeats: lengthBeats - close, hand: 'right', velocity: 78 })
    base.push({ notes: [36 + key.tonic], startBeat: close, durationBeats: lengthBeats - close, hand: 'left', velocity: 74 })
  }
  const plan = bluesCodexPass(base, line)
  return { events: [...plan.backing, ...line].sort((a, b) => a.startBeat - b.startBeat),
    lengthBeats, chords: chords.map(c => c.symbol), beatsEach,
    sourcePhrase: { id: 'blues-codex-rockhouse-robert', song: 'Rockhouse + Robert',
      fromBar: 35, barCount: lengthBeats / 3, method: 'motif-development' },
    adaptationNote: 'Câu mới từ Rockhouse 35/45/47 và Robert 31/82/129: hỏi–đáp, chromatic, bè đôi, láy nhẹ; bước 0,5 nốt đen trên nền 6/8. ' +
      (minor ? 'Giọng thứ là chuyển dụng do Codex soạn; hai nguồn có tâm trưởng.' : 'Hòa âm theo bài, không ép phần hát thành vòng 12 ô.'),
  }
}
