import { beatsOf, chordStarts } from '../chordTiming'
import { fillPositions, type generateFillLine } from '../fillSoloGenerator/soloGenerator'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'
import { applyMuteWindows } from './patternRenderer'

type FillOptions = Parameters<typeof generateFillLine>[1]
type PhraseRequest = {
  chord: ParsedChord; next: ParsedChord; endBeat: number; beats: number; take: number
  key?: FillOptions['key']
}
const pc = (note: number) => ((note % 12) + 12) % 12
const intervals = (chord: ParsedChord) => chord.quality.intervals.map(pc)

/** Thế nhắp 3–5–6/b7/7: nốt cao nhất nối tiếp motif. Giữ sus/dim/altered. */
export function colorBluesCodexBacking(backing: readonly TimelineEvent[], chords: readonly ParsedChord[], beatsPerChord: number): TimelineEvent[] {
  const starts = chordStarts(chords, beatsPerChord)
  return backing.map(event => {
    if (event.hand === 'left') return event
    const index = starts.findLastIndex(start => start <= event.startBeat + 1e-6)
    const chord = chords[index]
    if (!chord) return event
    const tones = intervals(chord)
    const third = tones.includes(4) ? 4 : tones.includes(3) ? 3 : null
    // Không tự thêm 9 tự nhiên lên b9/#9, đổi sus thành trưởng, hoặc sửa quãng 5 biến âm.
    if (third === null || !tones.includes(7) || tones.includes(1) || (tones.includes(3) && tones.includes(4))) return event
    const seventh = tones.includes(11) ? 11 : tones.includes(10) ? 10 : tones.includes(9) ? 9 : third === 3 ? 10 : 9
    const root = 60 + chord.root
    return { ...event, notes: [root + third, root + 7, root + seventh],
      durationBeats: Math.min(event.durationBeats, 0.55), velocity: Math.min(72, event.velocity) }
  })
}

/** Giai điệu là một phần ô đệm: hỏi, nhắc, đáp, thở; không đợi mốc fill.
 * Rockhouse 103–107 gợi ý motif 5–6–b7; Robert 56–79 gợi ý ngân/nghỉ.
 * Đây là biên soạn trên lưới Đức Thịnh 6/8, không chép timing 4/4 của sheet. */
export function weaveBluesCodexBacking(
  backing: readonly TimelineEvent[], chords: readonly ParsedChord[], beatsPerChord: number,
  options: { cellBreaks?: readonly number[]; muteWindows?: readonly { from: number; to: number }[] } = {},
): TimelineEvent[] {
  if (!chords.length) return [...backing]
  const starts = chordStarts(chords, beatsPerChord)
  const total = starts.at(-1)! + beatsOf(chords.at(-1)!, beatsPerChord)
  const colored = colorBluesCodexBacking(backing, chords, beatsPerChord)
  const right = colored.filter(e => e.hand === 'right')
  const chordAt = (beat: number) => starts.findLastIndex(start => start <= beat + 1e-6)
  let phrase = 0
  for (let start = 0; start < total - 1e-6; phrase++) {
    const nextBreak = Math.min(...(options.cellBreaks ?? []).filter(b => b > start + 1e-6), total)
    const until = Math.min(start + 3, nextBreak)
    const variant = phrase % 4
    for (const at of variant === 3 ? [0] : [0, 0.5, 2.5]) {
      const beat = start + at
      if (beat >= until - 1e-6) continue
      const index = chordAt(beat), chord = chords[index], tones = intervals(chord)
      const third = tones.includes(4) ? 4 : tones.includes(3) ? 3 : 0
      const fifth = tones.includes(7) ? 7 : tones.includes(6) ? 6 : tones.includes(8) ? 8 : 0
      const normal = third !== 0 && fifth === 7 && !tones.includes(1) && !(tones.includes(3) && tones.includes(4))
      const color = tones.includes(11) ? 11 : tones.includes(10) ? 10 : tones.includes(9) ? 9 : third === 3 ? 10 : 9
      // Trưởng: 5–6–b7/6; thứ giữ b3/b7 và dùng 5 thay 6 tự thêm.
      const step = !normal ? (at === 0 ? fifth : third) : variant === 3 ? third :
        at === 0 ? (variant === 2 ? color : fifth) : at === 0.5 ? (variant === 2 || third === 3 ? fifth : 9) : (variant === 2 ? third : fifth)
      const root = 60 + chord.root
      const notes = normal && variant === 1 && at === 2.5 ? [root + third, root + fifth] : [root + step]
      const end = Math.min(beat + (variant === 3 ? 0.85 : 0.35), until, starts[index + 1] ?? total)
      if (end - beat < 0.12) continue
      right.push({ notes, startBeat: beat, durationBeats: end - beat, hand: 'right', velocity: at === 0 ? 68 : 62 })
    }
    start = until
    if (until === nextBreak) phrase = -1
  }
  // Cắt cả nốt ngân vào vùng nghỉ; không tái sinh giai điệu trong chỗ người dùng đã cho nghỉ.
  const muted = applyMuteWindows(right, options.muteWindows ?? []).sort((a, b) => a.startBeat - b.startBeat)
  const spaced: TimelineEvent[] = []
  for (const event of muted) {
    const previous = spaced.at(-1)
    // Ranh giới đoạn lẻ có thể đặt hai tiếng sát nhau: giữ câu trước, bỏ tiếng dư.
    if (previous && event.startBeat - previous.startBeat < 0.45 - 1e-6) continue
    if (previous) previous.durationBeats = Math.min(previous.durationBeats, event.startBeat - previous.startBeat - 0.04)
    spaced.push({ ...event })
  }
  return [...backing.filter(e => e.hand === 'left'), ...spaced].sort((a, b) => a.startBeat - b.startBeat)
}

/** Câu tự soạn theo motif, không gọi là câu đo từ Đức Thịnh. Đơn vị: nốt đen. */
export function composeBluesCodexPhrase(request: PhraseRequest, run = false): TimelineEvent[] {
  if (request.beats < 0.5) return []
  const { chord, next } = request
  const steps = intervals(chord)
  const third = steps.includes(4) ? 4 : steps.includes(3) ? 3 : 0
  const fifth = steps.includes(7) ? 7 : steps.includes(6) ? 6 : steps.includes(8) ? 8 : 0
  const normal = third !== 0 && fifth === 7 && !steps.includes(1) && !(steps.includes(3) && steps.includes(4))
  const root = 60 + chord.root
  const variant = ((Math.floor(request.take) % 4) + 4) % 4
  const nextPcs = new Set(intervals(next).map(step => pc(next.root + step)))
  const target = [third, fifth, 0].find(step => nextPcs.has(pc(chord.root + step))) ?? third
  const span = Math.min(request.beats, run ? 3 : 1.5)
  const start = request.endBeat - span
  const color = steps.includes(11) ? 11 : steps.includes(10) ? 10 : steps.includes(9) ? 9 : third === 3 ? 10 : 9
  // Cố định một móc đơn / lần đánh. Thiếu chỗ thì bớt nốt, KHÔNG chia span cho số nốt.
  const count = Math.floor(span / 0.5)
  const call = variant % 2 === 0 ? [fifth, third === 3 ? color : 9, color, fifth, third, target]
    : [color, fifth, third, fifth, third, target]
  const motif = !normal ? [fifth, third, target] : run ? call :
    variant === 0 ? [third, fifth - 1, fifth] : variant === 1 ? [fifth, fifth, target] :
      variant === 2 ? [color, fifth, target] : [third, fifth, target]
  const events: TimelineEvent[] = []
  for (let i = 0; i < count; i++) {
    const at = i * 0.5
    const step = i === count - 1 ? (normal && !run && variant === 0 && count === 3 ? fifth : target) : motif[i % motif.length]
    const crush = normal && variant === 0 && i === 0 && count > 1 && step === third
    if (crush) events.push({ notes: [root + third - 1], startBeat: start + at, durationBeats: 0.035,
      hand: 'right', velocity: 46, grace: true })
    const delay = crush ? 0.045 : 0
    const notes = normal && i === 0 && !run && (variant === 0 || variant === 3)
      ? [root + step, root + (variant === 0 ? fifth : color)] : [root + step]
    events.push({ notes, startBeat: start + at + delay,
      durationBeats: Math.min(i === count - 1 ? 0.4 : 0.32, span - at - delay - 0.035),
      hand: 'right', velocity: i === count - 1 ? 74 : 66 })
  }
  return events
}

/** Tái dùng bộ chọn CHỖ fill, giữ các lựa chọn nghỉ/tắt/hát; tự soạn nhạc riêng. */
export function generateBluesCodexFills(chords: readonly ParsedChord[], options: FillOptions): TimelineEvent[] {
  if (chords.length === 0) return []
  const starts = chordStarts(chords, options.beatsPerChord)
  const result: TimelineEvent[] = []
  for (const { index, mainIndex } of fillPositions(chords, {
    density: options.density, breaths: options.breaths, skip: options.skipFills,
    beatsPerChord: options.beatsPerChord,
    always: new Set([...(options.extraFills ?? []), ...(options.extraRuns ?? []), ...(options.sectionEnds?.keys() ?? [])]),
  })) {
    const manual = options.extraFills?.has(mainIndex) || options.extraRuns?.has(mainIndex)
    if (!manual && !options.sectionEnds?.has(mainIndex)) continue
    if (!manual && (options.vocal === 'full' || options.vocal?.has(mainIndex))) continue
    const transition = options.sectionEnds?.get(mainIndex)
    if (transition && transition.octaves <= 0) continue
    const length = beatsOf(chords[index], options.beatsPerChord)
    const rest = Math.min(transition?.restBeats ?? options.fillRests?.get(mainIndex) ?? 0, Math.max(0, length - 0.25))
    const room = Math.max(0, length - rest - (transition?.delayBeats ?? 0))
    // Giai điệu thường xuyên nằm trong ô đệm; ở đây chỉ thêm Fill/Run tự chọn hoặc chuyển đoạn.
    const take = Math.floor(mainIndex / 2) + (options.take ?? 0)
    const run = !!transition || !!options.extraRuns?.has(mainIndex)
    const beats = Math.min(room, run && (transition || options.extraRuns?.has(mainIndex)) ? 3 : options.fillBeats ?? 1.5, length / (manual || transition ? 1 : 2))
    result.push(...composeBluesCodexPhrase({ chord: chords[index], next: chords[(index + 1) % chords.length],
      endBeat: starts[index] + length - rest, beats, take, key: options.key }, run))
  }
  return result
}

/** RH nhả trước câu đáp; LH tiếp tục bass, không phải ôm thêm hợp âm từ tay phải. */
export function bluesCodexPass(backing: readonly TimelineEvent[], fills: readonly TimelineEvent[]) {
  const right = fills.filter(event => event.hand === 'right').sort((a, b) => a.startBeat - b.startBeat)
  const windows: { from: number; to: number }[] = []
  for (const event of right) {
    const last = windows.at(-1)
    if (last && event.startBeat <= last.to + 0.3) last.to = Math.max(last.to, event.startBeat + event.durationBeats)
    else windows.push({ from: event.startBeat, to: event.startBeat + event.durationBeats })
  }
  const arranged = backing.flatMap(event => {
    if (event.hand === 'left') return [event]
    let end = event.startBeat + event.durationBeats
    for (const window of windows) {
      if (window.to <= event.startBeat || window.from >= end) continue
      if (window.from <= event.startBeat + 1e-6) return []
      end = Math.min(end, window.from - 0.02)
    }
    // Không đặt tiếng đệm sát đầu/cuối câu Fill/Run dù hai trường độ không chồng nhau.
    if (right.some(note => !note.grace && Math.abs(note.startBeat - event.startBeat) < 0.45 - 1e-6)) return []
    // Cú nhắp bị cắt còn vài mili giây sẽ thành tiếng cụt ngay trước nốt láy: bỏ nó.
    return end - event.startBeat >= 0.12 ? [{ ...event, durationBeats: end - event.startBeat }] : []
  })
  return { backing: arranged, events: [...fills] }
}
