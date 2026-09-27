import { beatsOf, chordStarts } from '../chordTiming'
import { fillPositions, type generateFillLine } from '../fillSoloGenerator/soloGenerator'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

type FillOptions = Parameters<typeof generateFillLine>[1]
type PhraseRequest = {
  chord: ParsedChord; next: ParsedChord; endBeat: number; beats: number; take: number
  key?: FillOptions['key']
}
const pc = (note: number) => ((note % 12) + 12) % 12
const intervals = (chord: ParsedChord) => chord.quality.intervals.map(pc)

/** Các thế nhắp 3 nốt, đủ một tay. Giữ sus/dim/altered theo hợp âm gốc. */
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
    let root = 60 + chord.root
    while (root + 14 > 77) root -= 12
    return { ...event, notes: [root + third, root + seventh, root + 14], velocity: Math.min(78, event.velocity) }
  })
}

/** Câu tự soạn theo motif, không gọi là câu đo từ Đức Thịnh. Đơn vị: nốt đen. */
export function composeBluesCodexPhrase(request: PhraseRequest, run = false): TimelineEvent[] {
  if (request.beats < 0.25) return []
  const { chord, next, key } = request
  const steps = intervals(chord)
  const third = steps.includes(4) ? 4 : steps.includes(3) ? 3 : null
  const fifth = steps.includes(7) ? 7 : steps.includes(6) ? 6 : steps.includes(8) ? 8 : 0
  const normal = third !== null && fifth === 7 && !steps.includes(1) && !(steps.includes(3) && steps.includes(4))
  const root = 60 + chord.root
  const variant = ((Math.floor(request.take) % 4) + 4) % 4
  // Nốt chốt vẫn thuộc hợp âm HIỆN TẠI, ưu tiên gần hợp âm sau; không đánh hợp âm sau sớm.
  const nextPcs = new Set(intervals(next).map(step => pc(next.root + step)))
  const targetStep = [third ?? 0, fifth, 0].find(step => nextPcs.has(pc(chord.root + step))) ?? third ?? 0
  const target = root + targetStep
  const span = Math.min(request.beats, run ? 3 : 1.5)
  const start = request.endBeat - span
  const events: TimelineEvent[] = []
  const add = (at: number, length: number, notes: number[], velocity = 72, grace = false) => {
    const durationBeats = Math.min(length, span - at - 0.035)
    if (at < 0 || durationBeats <= 0) return
    events.push({ notes, startBeat: start + at, durationBeats, hand: 'right', velocity, ...(grace ? { grace } : {}) })
  }
  if (span < 0.65) {
    // Cửa sổ hẹp: một cú nhấn–nhả có đích, không nén cả câu thành nốt cực nhanh.
    add(span * 0.2, span * 0.65, [target], 69)
    return events
  }
  if (!normal) {
    // Sus/dim/altered: giữ đúng màu đã ghi, dùng câu hỏi–đáp bằng nốt hợp âm.
    add(0, span * 0.22, [root + fifth], 69)
    add(span * 0.5, span * 0.4, [target], 77)
    return events
  }
  const thirdNote = root + third!
  const crush = thirdNote - 1 // b3→3 trưởng; 2→b3 thứ.
  const fifthNote = root + fifth
  const minor = third === 3
  const color = root + (steps.includes(11) ? 11 : steps.includes(10) ? 10 : steps.includes(9) ? 9 : minor ? 10 : 9)
  const unit = span / (run ? 12 : 6)
  // Cử chỉ láy ngắn cố định, không áp swing lần hai lên lưới 6/8.
  const graceLength = Math.min(0.065, unit * 0.4)
  if (!run && variant === 0) {
    add(0, graceLength, [crush], 48, true)
    add(graceLength, unit * 1.2, [thirdNote, fifthNote], 79)
    add(unit * 3, unit * 0.7, [fifthNote - 1], 58)
    add(unit * 4, unit * 1.4, [fifthNote], 74)
  } else if (!run && variant === 1) {
    add(0, unit * 0.8, [fifthNote], 72)
    add(unit * 2, unit * 0.8, [fifthNote], 65)
    add(unit * 4, unit * 1.5, [target], 78)
  } else if (!run && variant === 2) {
    add(0, unit * 0.8, [color], 72)
    add(unit, unit * 0.8, [fifthNote], 69)
    add(unit * 2, graceLength, [crush], 47, true)
    add(unit * 2 + graceLength, unit * 0.8, [thirdNote], 73)
    add(unit * 4, unit * 1.5, [target], 76)
  } else if (!run) {
    add(0, unit * 1.2, [thirdNote, color], 75)
    add(unit * 3, graceLength, [fifthNote - 1], 47, true)
    add(unit * 3 + graceLength, unit * 0.8, [fifthNote], 70)
    add(unit * 5, unit * 0.7, [target], 76)
  } else {
    // Câu lên/xuống theo bộ phận; không đổi toàn bộ gam Blues mỗi khi đổi hợp âm.
    const tonic = key?.tonic ?? chord.root
    const tonicMinor = key?.scale === 'minor' || (!key && minor)
    const tonicSteps = tonicMinor || steps.includes(10) ? [0, 3, 5, 6, 7, 10] : [0, 2, 3, 4, 7, 9]
    const palette = new Set([...steps, ...tonicSteps.map(step => pc(tonic + step - chord.root))])
    // Trên hợp âm thứ/maj7, không giữ bậc 3 trưởng/b7 trái với màu đang vang.
    if (minor) palette.delete(4)
    if (steps.includes(11)) palette.delete(10)
    if (steps.includes(10)) palette.delete(11)
    const ladder = [...palette].sort((a, b) => a - b).map(step => root + step)
    const notes = variant % 2 === 0 ? [...ladder].reverse() : ladder
    // Sáu nốt trong một phách lớn chùm ba; sau đó nghỉ rồi đáp bằng chord tone.
    notes.slice(0, 6).forEach((note, index) => add(index * unit, unit * 0.84, [note], index === 0 ? 78 : 64 + index * 2))
    add(unit * 8, graceLength, [crush], 48, true)
    add(unit * 8 + graceLength, unit * 0.8, [thirdNote, fifthNote], 76)
    add(unit * 10, unit * 1.5, [target], 80)
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
    if (!manual && (options.vocal === 'full' || options.vocal?.has(mainIndex))) continue
    const transition = options.sectionEnds?.get(mainIndex)
    if (transition && transition.octaves <= 0) continue
    const length = beatsOf(chords[index], options.beatsPerChord)
    const rest = Math.min(transition?.restBeats ?? options.fillRests?.get(mainIndex) ?? 0, Math.max(0, length - 0.25))
    const room = Math.max(0, length - rest - (transition?.delayBeats ?? 0))
    // Một trong ba lượt motif là câu chạy ngắn; vị trí fill vẫn do mật độ/lời quyết định.
    const take = Math.floor(mainIndex / 2) + (options.take ?? 0)
    const run = !!transition || !!options.extraRuns?.has(mainIndex) || (!options.extraFills?.has(mainIndex) && take % 3 === 2)
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
    // Cú nhắp bị cắt còn vài mili giây sẽ thành tiếng cụt ngay trước nốt láy: bỏ nó.
    return end - event.startBeat >= 0.12 ? [{ ...event, durationBeats: end - event.startBeat }] : []
  })
  return { backing: arranged, events: [...fills] }
}
