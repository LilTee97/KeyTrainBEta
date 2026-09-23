import { laBossaCP } from './styleLibrary/caPhaoBossa'
import { chordTonesStrict } from '../fillSoloGenerator/soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'
import { parseChordInput } from '../input/chordInputParser'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { renderPattern } from './patternRenderer'
import { scaleTones } from '../reharmEngine/keyDetection'
import { cpGenre, cpPhrases } from '../licky/cpLick'
import fullSolos from './caPhaoFullSolos.json'
export type FullSolo = Omit<typeof fullSolos.sections[number], 'harmony'> & {
  harmony: { at: number; root: number; suffix: string; bass: number | null }[]
}

export function caPhaoFullSources(style: PhraseSectionOptions['style'], key: PhraseSectionOptions['key'], simulate = false) {
  const genre = cpGenre(style)
  return [...new Set(fullSolos.sections.filter(s => s.mode === key?.scale &&
    (s.genre === 'bossa nova' ? 'bossa' : s.genre) === genre &&
    (!simulate || !style.cpSoloSong || s.song === style.cpSoloSong)).map(s => s.song))]
}

/** Develop melodic notes, keeping written chord gestures, rests, tuplets and cadences.
 * Vocabulary comes only from complete CP sections of this genre AND mode.
 * Source accidentals and their immediate resolutions stay intact, not scale-snapped.
 */
function developFullSolo(source: FullSolo, take: number) {
  if (!take) return source
  const pc = (n: number) => ((n % 12) + 12) % 12
  const vocabulary = new Set(fullSolos.sections.filter(s => s.genre === source.genre && s.mode === source.mode)
    .flatMap(s => s.events.filter(e => e.hand === 'right').flatMap(e => e.tones.map(pc))))
  const events = source.events.map(e => ({ ...e, tones: [...e.tones] }))
  const right = events.filter(e => e.hand === 'right').sort((a, b) => a.at - b.at)
  const allowedAt = (at: number) => {
    const h = source.harmony.findLast(h => h.at <= at)!
    const chord = parseChordInput(pitchClassName(h.root as PitchClass) + h.suffix).chords[0]
    const allowed = new Set<number>(scaleTones(0, source.mode as 'minor' | 'major'))
    if (chord) {
      chord.quality.intervals.forEach(n => allowed.add(pc(h.root + n)))
      if (chord.quality.intervals.includes(3)) allowed.delete(pc(h.root + 4))
      else if (chord.quality.intervals.includes(4)) allowed.delete(pc(h.root + 3))
    }
    return allowed
  }
  let point = 0
  for (let i = 0; i < right.length; i++) {
    const e = right[i], old = e.tones[0]
    if (e.tones.length !== 1 || e.carry || e.at >= source.lengthBeats - source.barLengths.at(-1)! ||
      source.graces.some(g => g.hand === e.hand && Math.abs(g.at - e.at) < 1e-5)) continue
    const before = right[i - 1], after = right[i + 1]
    const allowed = allowedAt(e.at)
    if (!allowed.has(pc(old))) continue
    // Do not detach a written chromatic approach from its target.
    if ([before, after].some(n => n?.tones.length === 1 && Math.abs(n.tones[0] - old) === 1)) continue
    const candidates = Array.from({ length: 9 }, (_, n) => old - 4 + n).filter(n =>
      allowed.has(pc(n)) && vocabulary.has(pc(n)) &&
      (!before || before.tones.length !== 1 || Math.sign(n - before.tones[0]) === Math.sign(old - before.tones[0])) &&
      (!after || after.tones.length !== 1 || Math.sign(after.tones[0] - n) === Math.sign(after.tones[0] - old)) &&
      !events.some(l => l.hand === 'left' && l.at < e.at + e.gates[0] - 1e-5 &&
        e.at < l.at + Math.max(...l.gates) - 1e-5 && l.tones.some(t => Math.abs(t - n) <= 1)))
    if (candidates.length < 2) continue
    candidates.sort((a, b) => Math.abs(a - old) - Math.abs(b - old) || a - b)
    e.tones[0] = candidates[Math.floor(take / 2 ** (point % 10)) % candidates.length]
    point++
  }
  return { ...source, events }
}

/** User-marked vocal pickups in Bossa bars 8/48 are not instrumental melody.
 * Keep the half-beat paired gesture, but end on V's 3rd/5th into the actual next chord.
 * This is KT's CP-derived lead-in, not a verbatim transcription of the vocal pickup.
 */
function leadFullSoloInto(source: FullSolo, options: PhraseSectionOptions): FullSolo {
  if (source.vocalPickupAt === null || !options.key) return source
  const at = source.vocalPickupAt
  const target = options.opening ?? parseChordInput(pitchClassName(options.key.tonic) +
    (options.key.scale === 'minor' ? 'm' : '')).chords[0]
  const shift = ((target.root - options.key.tonic + 18) % 12) - 6
  const cadenceAt = source.harmony.at(-2)!.at // intro iv starts at 27.5; interlude ii at 28
  const pc = (n: number) => ((n % 12) + 12) % 12
  const third = target.quality.intervals.includes(3) ? 3 : 4
  const events = source.events.filter(e => e.hand !== 'right' || e.at < at).map(e => ({ ...e,
    tones: e.tones.map(n => {
      const h = source.harmony.findLast(h => h.at <= e.at)!
      const fifth = e.at >= cadenceAt && third === 4 && h.suffix === 'm7b5' && pc(n-h.root) === 6 ? 1 : 0
      return n + fifth + (e.at >= cadenceAt ? shift : 0)
    }),
    gates: e.gates.map(g => e.hand === 'right' ? Math.min(g, at - e.at) : g),
  }))
  const previous = events.filter(e => e.hand === 'right').at(-1)!
  const root = 12 * Math.round((Math.max(...previous.tones) - shift) / 12) + shift
  const pairs = [[2, 5], [0, third], [-1, 2]] // V:5/b7 → target:1/3 → V:3/5
  pairs.forEach((pair, i) => events.push({ ...previous, at: at + i * .5,
    tones: pair.map(n => root + n), gates: [.5, .5], carry: false,
    arpeggiate: false, articulations: [], parallelMajor: false }))
  const harmony = source.harmony.map(h => h.at < cadenceAt ? h : ({ ...h,
    root: pc(h.root + shift), bass: h.bass === null ? null : pc(h.bass + shift),
    // Source interlude iiø–V11: major destinations use ii7, not iiø7.
    suffix: h.suffix === 'm7b5' && third === 4 ? 'm7' : h.suffix,
  }))
  const graces = source.graces.map(g => ({ ...g, tone: g.tone + (g.at >= cadenceAt ? shift : 0) }))
  return { ...source, events, harmony, graces }
}

/** Keep whole phrases. Fit the chosen keyboard by moving gestures, never deleting notes.
 * A narrow keyboard may require register resets, explicitly reported to the player.
 */
export function caPhaoFullSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (why: string): PhraseSection => ({ events: [], lengthBeats: 0,
    chords: [], beatsEach: [], unavailableReason: why })
  const key = options.key
  if (!key || !['major', 'minor'].includes(key.scale)) return empty('CP full cần xác định giọng trưởng hoặc thứ.')
  const genre = cpGenre(options.style)
  const namedSong = options.caPhaoSimulate ? options.style.cpSoloSong : undefined
  if (namedSong && !caPhaoFullSources(options.style, key, true).includes(namedSong))
    return empty(`Không có câu mô phỏng ${namedSong} đúng giọng ${key.scale === 'minor' ? 'thứ' : 'trưởng'}. Không thay bằng sheet khác; chọn Soạn câu mới để chuyển thể theo giọng bài.`)
  const pool = fullSolos.sections.filter(s => s.kind === options.kind && s.mode === key.scale &&
    (s.genre === 'bossa nova' ? 'bossa' : s.genre) === genre && (!namedSong || s.song === namedSong))
    .sort((a, b) => b.lengthBeats - a.lengthBeats || a.id.localeCompare(b.id))
  if (!pool.length) return empty(`Chưa có solo Cà Pháo full đúng họ điệu và giọng ${key.scale === 'minor' ? 'thứ' : 'trưởng'} này; không ghép nguồn khác điệu hoặc đổi màu giọng.`)
  const take = Number.isFinite(options.take) ? Math.abs(Math.trunc(options.take!)) : 0
  // Source length must not change during playback/repeats or chord-click seeking.
  // Change source explicitly; each play develops notes on that full structure.
  const selected = namedSong ? pool[0] : pool.find(s => s.song === options.caPhaoFullSource) ?? pool[0]
  if (options.caPhaoSimulate && !namedSong && options.caPhaoFullSource && selected.song !== options.caPhaoFullSource)
    return empty(`Không có đoạn mô phỏng từ ${options.caPhaoFullSource} đúng điệu/giọng; không tự thay nguồn.`)
  const reference = options.caPhaoSimulate ? {...selected,harmony:selected.writtenHarmony} : leadFullSoloInto(selected, options)
  // Outro Người hãy quên kết D trưởng. Giữ câu nhưng chuyển bậc 3/6/7
  // của hai ô kết về thứ, không đưa F# trưởng vào câu kết của bài thứ.
  const tone = (n: number, parallel: boolean) => {
    const degree = (n % 12 + 12) % 12
    return !options.caPhaoSimulate && parallel && [4, 9, 11].includes(degree) ? n - 1 : n
  }
  const source = developFullSolo({ ...reference,
    events: reference.events.map(e => ({ ...e, tones: e.tones.map(n => tone(n, e.parallelMajor)), parallelMajor: false })),
    graces: reference.graces.map(g => ({ ...g, tone: tone(g.tone, g.parallelMajor), parallelMajor: false })),
  }, options.caPhaoSimulate ? 0 : take)
  return renderCpFullSolo(source, options)
}

/** Shared realization; callers select/transform a measured phrase before rendering. */
export function renderCpFullSolo(source: FullSolo, options: PhraseSectionOptions): PhraseSection {
  const empty = (why: string): PhraseSection => ({ events: [], lengthBeats: 0,
    chords: [], beatsEach: [], unavailableReason: why })
  const key = options.key
  if (!key) return empty('CP full cần xác định giọng.')
  const tone = (n: number, parallel: boolean) => {
    const degree = (n % 12 + 12) % 12
    return !options.caPhaoSimulate && parallel && [4, 9, 11].includes(degree) ? n - 1 : n
  }
  const range = options.caPhaoKeyboardRange ?? { low: 36, high: 96 }
  if (!Number.isInteger(range.low) || !Number.isInteger(range.high) ||
    range.low < 0 || range.high > 127 || range.high - range.low < 24)
    return empty('Tầm đàn CP full không hợp lệ; cần ít nhất hai quãng tám và hai đầu nằm trong MIDI 0–127.')
  const octaves = Array.from({ length: 21 }, (_, i) => (i - 10) * 12)
  const pitchesOf = (e: typeof source.events[number]) => [...e.tones.map(n => tone(n, e.parallelMajor)),
    ...source.graces.filter(g => g.hand === e.hand && Math.abs(g.at - e.at) < 1e-5).map(g => tone(g.tone, g.parallelMajor))]
  const fits = (pitches: number[]) => octaves.filter(o =>
    pitches.every(n => n + key.tonic + o >= range.low && n + key.tonic + o <= range.high))
  const whole = fits(source.events.flatMap(pitchesOf))
    .sort((a, b) => Math.abs(key.tonic - source.tonic + a) - Math.abs(key.tonic - source.tonic + b))
  const shifts = new Map<typeof source.events[number], number>()
  const occupied: { start: number; end: number; notes: number[] }[] = []
  let barEnd = 0
  const barEnds = source.barLengths.map(length => (barEnd += length))
  const barAt = (at: number) => barEnds.findIndex(end => at < end - 1e-5)
  let resetCount = 0
  // Preserve an entire hand if it fits; otherwise split at actual rests / barlines.
  // Only split a still-too-wide gesture when the keyboard physically cannot hold it.
  for (const hand of ['right', 'left']) {
    const groups = source.events.filter(e => e.hand === hand).sort((a, b) => a.at - b.at)
    let previousTop: number | undefined
    let previousShift: number | undefined
    for (let i = 0; i < groups.length;) {
      let stop = groups.length
      let candidates = whole.length ? whole : fits(groups.slice(i).flatMap(pitchesOf))
      if (!candidates.length) {
        stop = i + 1
        while (stop < groups.length && barAt(groups[stop].at) === barAt(groups[i].at) &&
          groups[stop].at <= groups[stop - 1].at + Math.max(...groups[stop - 1].gates) + .25 &&
          fits(groups.slice(i, stop + 1).flatMap(pitchesOf)).length) stop++
        candidates = fits(groups.slice(i, stop).flatMap(pitchesOf))
      }
      if (!candidates.length) return empty('Một thế hợp âm full rộng hơn tầm đàn đã chọn; hãy mở tầm. Không bỏ nốt để giả làm câu đầy đủ.')
      const chunk = groups.slice(i, stop)
      const target = range.low + (range.high - range.low) * (hand === 'right' ? .68 : .25)
      const score = (o: number) => {
        const pitches = chunk.flatMap(e => e.tones.map(n => tone(n, e.parallelMajor) + key.tonic + o))
        const clashes = hand === 'left' ? chunk.reduce((sum, e) => sum + occupied.filter(r =>
          r.start < e.at + Math.max(...e.gates) - 1e-5 && e.at < r.end - 1e-5 &&
          e.tones.some(n => r.notes.includes(tone(n, e.parallelMajor) + key.tonic + o))).length, 0) : 0
        const firstTop = Math.max(...chunk[0].tones.map(n => tone(n, chunk[0].parallelMajor))) + key.tonic + o
        return clashes * 1000 + Math.abs(pitches.reduce((a, b) => a + b, 0) / pitches.length - target) +
          (previousTop === undefined ? 0 : Math.abs(firstTop - previousTop) * 2) +
          (previousShift === undefined || o === previousShift ? 0 : 8)
      }
      const chosen = whole.length ? whole[0] : candidates.sort((a, b) => score(a) - score(b))[0]
      if (previousShift !== undefined && chosen !== previousShift) resetCount++
      for (const e of chunk) {
        shifts.set(e, key.tonic + chosen)
        if (hand === 'right') occupied.push({ start: e.at, end: e.at + Math.max(...e.gates),
          notes: e.tones.map(n => tone(n, e.parallelMajor) + key.tonic + chosen) })
      }
      const last = chunk.at(-1)!
      previousTop = Math.max(...last.tones.map(n => tone(n, last.parallelMajor))) + key.tonic + chosen
      previousShift = chosen
      i = stop
    }
  }
  const events: TimelineEvent[] = []
  for (const e of source.events) {
    const shift = shifts.get(e)!
    const graces = source.graces.filter(g => g.hand === e.hand && Math.abs(g.at - e.at) < 1e-5)
    // Grace has no duration in XML. Borrow at most 1/4 of the principal gate,
    // without moving the barline; this realization is KT's, not measured audio.
    const graceStep = Math.min(1 / 16, Math.min(...e.gates) / (4 * Math.max(1, graces.length)))
    const lead = graces.length * graceStep
    graces.forEach((g, i) => events.push({ hand: g.hand as 'left' | 'right',
      notes: [tone(g.tone, g.parallelMajor) + shift], startBeat: e.at + i * graceStep,
      durationBeats: graceStep, velocity: 58 }))
    e.tones.forEach((n, i) => {
      const roll = e.arpeggiate ? Math.min(.035, Math.min(...e.gates) / (4 * e.tones.length)) * i : 0
      const duration = (e.gates[i] - lead - roll) * (e.articulations.includes('staccato') ? .5 : 1)
      events.push({ notes: [tone(n, e.parallelMajor) + shift], hand: e.hand as 'left' | 'right',
        startBeat: e.at + lead + roll, durationBeats: duration,
        velocity: e.articulations.includes('accent') ? 80 : e.hand === 'left' ? 64 : 72 })
    })
  }
  const pc = (n: number) => ((n % 12 + 12) % 12) as PitchClass
  const chords = source.harmony.map(h => pitchClassName(pc(key.tonic + h.root)) + h.suffix +
    (h.bass === null ? '' : '/' + pitchClassName(pc(key.tonic + h.bass))))
  return { events: events.sort((a, b) => a.startBeat - b.startBeat), lengthBeats: source.lengthBeats,
    chords, beatsEach: source.harmony.map((h, i) => (source.harmony[i + 1]?.at ?? source.lengthBeats) - h.at),
    sourcePhrase: { id: source.id, song: source.song, fromBar: source.fromBar,
      barCount: source.barLengths.length, method: 'full-sheet' },
    adaptationNote: whole.length ? undefined : `Đã đặt lại quãng âm hai tay cho tầm MIDI ${range.low}–${range.high}${resetCount ? `, ${resetCount} chỗ đổi quãng theo cụm` : ''}; giữ số nốt, độ dài và tiết tấu nguồn.` }
}

/** Source contour only: the approved Bossa rhythm, chords and cadence stay in charge.
 * Takes 0–3 retain the archived four versions for exact comparison.
 * Each later section develops ONE song/section; never imports a ballad LH cell or timing.
 */
function developBossaMelody(melody: TimelineEvent[], backing: readonly TimelineEvent[],
  chords: readonly ParsedChord[], beatsEach: readonly number[], options: PhraseSectionOptions) {
  const take = Number.isFinite(options.take) ? Math.max(0, Math.floor(options.take!)) : 0
  const key = options.key!
  const range = options.range ?? { low: 62, high: 84 }
  const traces: NonNullable<PhraseSection['developmentSources']> = []
  if (take < 4) return { melody, traces }
  const pc = (n: number) => (n % 12 + 12) % 12
  const eligible = cpPhrases.filter(p => p.hand === 'right' && p.evidence === `instrumental-${options.kind}` &&
    p.notes.length >= 4 && Math.max(...p.notes.map(n => n.tones.at(-1)!)) - Math.min(...p.notes.map(n => n.tones.at(-1)!)) <= range.high - range.low)
  const songs = [...new Set(eligible.map(p => p.song))]
  const song = songs[Math.floor((take - 4) / 4) % songs.length]
  const book = eligible.filter(p => p.song === song)
  let cursor = 0
  const harmony = chords.map((chord, i) => {
    const start = cursor
    cursor += beatsEach[i]
    return { chord, start, end: cursor }
  })
  const result = [...melody]
  // Preserve cadential bars, the bII–V outro gesture and the explicit chromatic approach.
  const bars = options.kind === 'intro' ? [0, 1, 2, 3, 4, 5]
    : options.kind === 'outro' ? [0, 2, 4] : [0, 2, 4, 5]
  for (const bar of bars) {
    const indices = melody.map((event, i) => ({ event, i })).filter(({ event }) =>
      event.notes.length === 1 && event.startBeat >= bar * 4 && event.startBeat < (bar + 1) * 4)
    if (indices.length < 3) continue
    const pool = book.filter(p => p.notes.length >= indices.length)
    if (!pool.length) continue
    const offset = ((take - 4) * 7 + bar % 4) % pool.length
    for (let attempt = 0; attempt < pool.length; attempt++) {
      const source = pool[(offset + attempt) % pool.length]
      const contour = source.notes.slice(0, indices.length).map(n => n.tones.at(-1)!)
      const originalFirst = indices[0].event.notes[0]
      const shift = originalFirst - contour[0]
      // Move the whole source contour; reject broad gestures rather than fold their peaks.
      const wanted = contour.map(n => n + shift)
      if (Math.min(...wanted) < range.low || Math.max(...wanted) > range.high) continue
      const made: TimelineEvent[] = []
      for (const [j, { event }] of indices.entries()) {
        const chord = harmony.find(h => h.start <= event.startBeat && event.startBeat < h.end)!.chord
        const stable = new Set(chord.quality.intervals.map(n => pc(chord.root + n)))
        const allowed = new Set([...scaleTones(key.tonic, key.scale), ...stable])
        if (chord.quality.intervals.includes(4)) allowed.delete(pc(chord.root + 3))
        else if (chord.quality.intervals.includes(3)) allowed.delete(pc(chord.root + 4))
        const landing = j === indices.length - 1
        const ladder = Array.from({ length: range.high - range.low + 1 }, (_, i) => range.low + i)
          .filter(n => (landing ? stable : allowed).has(pc(n)))
          .filter(n => !backing.some(b => b.hand === 'left' &&
            b.startBeat < event.startBeat + event.durationBeats - 1e-6 &&
            event.startBeat < b.startBeat + b.durationBeats - 1e-6 && b.notes.some(l => Math.abs(l - n) <= 1)))
          .filter(n => !j || Math.sign(n - made[j - 1].notes[0]) === Math.sign(contour[j] - contour[j - 1]) || n === made[j - 1].notes[0])
        if (!ladder.length) break
        ladder.sort((a, b) => Math.abs(a - wanted[j]) - Math.abs(b - wanted[j]) || a - b)
        made.push({ ...event, notes: [ladder[0] as MidiNote] })
      }
      if (made.length !== indices.length || new Set(made.map(n => n.notes[0])).size < 3) continue
      if (made.every((e, i) => e.notes[0] === indices[i].event.notes[0])) continue
      indices.forEach(({ i }, j) => { result[i] = made[j] })
      traces.push({ id: source.id, song: source.song, genre: source.genre, mode: source.mode,
        sourceBar: source.bar, targetBar: bar + 1, method: 'contour-on-bossa-rhythm' })
      break
    }
  }
  return { melody: result, traces }
}

/**
 * Một vòng thử, học NGUYÊN intro Người hãy quên em đi (XML 1–8, Dm).
 * Không dùng TUYEN_SOLO cũ: dữ liệu đó tách sai chùm/tie và làm mất màu m9/m11.
 * KT phát triển nét 9–1–b7–5, đáp iv, nhắc lại, rồi iv–V; không chép cả câu.
 * Timing là biên soạn trên cell CP cải tiến, KHÔNG dùng feel/snap Bolero hay
 * mô hình ngũ cung Hongkong 1. Giữ nguyên onset/gate của LH, RH đệm chỉ đáp ở khe.
 */
export function caPhaoBossaMinorIntro(options: PhraseSectionOptions): PhraseSection {
  const unavailable = (why: string): PhraseSection => ({
    events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason: why,
  })
  const { key, style } = options
  if (!key || key.scale !== 'minor' || !laBossaCP(style) ||
    style.beatsPerMeasure !== 4 || (style.gridUnit ?? 1) !== 1) {
    return unavailable('Intro thử chỉ dành cho Bossa CP cải tiến, giọng thứ, nhịp 4/4.')
  }
  const pc = (n: number) => ((n % 12 + 12) % 12) as PitchClass
  const chord = (root: number, suffix: string) =>
    parseChordInput(pitchClassName(pc(root)) + suffix).chords[0]!
  const i = chord(key.tonic, 'm9'), iv = chord(key.tonic + 5, 'm11')
  const opening = options.opening ?? chord(key.tonic, 'm')
  const dominant = chord(opening.root + 7, '7')
  // Màu mở rộng là lựa chọn intro, không sửa hòa âm phần hát. Giữ đủ 8 ô.
  const chords = [i, iv, chord(key.tonic, 'm11'), iv, i, iv,
    chord(key.tonic, 'm11'), chord(key.tonic + 5, 'm7'), dominant]
  const beatsEach = [4, 4, 4, 4, 4, 4, 3.5, 2, 2.5]
  const range = options.range ?? { low: 60, high: 84 }
  if (!Number.isFinite(range.low) || !Number.isFinite(range.high) || range.low > range.high) {
    return unavailable('Tầm nốt intro không hợp lệ.')
  }
  // Đặt TOÀN đường nét (5…15 so với tonic) vào tầm trước khi phát; không gập từng nốt.
  const bases = Array.from({ length: 11 }, (_, octave) => key.tonic + octave * 12)
    .filter(base => base + 5 >= range.low && base + 15 <= range.high)
    .sort((a, b) => Math.abs(a + 10 - (range.low + range.high) / 2) -
      Math.abs(b + 10 - (range.low + range.high) / 2))
  if (bases[0] === undefined) return unavailable('Tầm nốt quá hẹp cho đường nét intro Bossa thứ; thử mở khoảng C4–C6.')
  // Bốn khung lưu trữ; take >= 4 phát triển thêm cao độ từ kho contour phía trên.
  const take = Number.isFinite(options.take) ? Math.max(0, Math.floor(options.take!)) % 4 : 0
  const call = take % 2 ? [12, 14, 10, 7] : [14, 12, 10, 7]
  const callTimes = take < 2 ? [0, 1, 2.5, 3.5] : [0.5, 1, 2.5, 3.5]
  // [onset, cao độ tương đối, gate]: gate độc lập với onset tiếng kế.
  type Note = [number, number, number]
  const phrases: Note[][] = [
    call.map((n, index) => [callTimes[index]!, n, [0.45, 1.25, 0.75, 0.45][index]!] as Note),
    [[0.5, 8, 0.9], [1.5, 12, 0.45], [2, 10, 0.45], [2.5, 7, 0.45], [3, 5, 0.5]],
    [[0, 14, 0.45], [0.5, 15, 0.45], [1, 14, 1.25], [2.5, 10, 0.75], [3.5, 7, 0.45]],
    [[0.5, 7, 0.22], [0.75, 8, 0.22], [1, 12, 0.22], [1.25, 15, 0.22],
      [1.5, 12, 0.45], [2, 10, 0.75], [3, 5, 0.5]],
    call.map((n, index) => [callTimes[index]!, n, [0.45, 1.25, 0.75, 0.45][index]!] as Note),
    [[0.5, 7, 0.45], [1, 8, 0.45], [1.5, 10, 0.45], [2, 8, 0.45], [2.5, 7, 0.45], [3, 5, 0.5]],
    [[0, 5, 0.22], [0.25, 6, 0.22], [0.5, 7, 0.45], [1, 14, 1.25], [2.5, 12, 0.45], [3, 10, 0.45]],
    [[0.5, 8, 0.45], [1, 12, 0.45]],
  ]
  if (take >= 2) {
    // Phát triển cùng nguồn: thay nét hồi đáp, không đổi thầy hoặc bốc từng ô từ kho.
    phrases[2] = [[0, 12, 0.9], [1, 14, 0.45], [1.5, 15, 0.45], [2.5, 14, 0.45], [3, 10, 0.45]]
  }
  // Cần biết đích thật để bass 31.5 giải xuống đầu phần hát; không xuất thêm ô hát này.
  const backing = renderPattern(voiceLeadTwoHands([...chords, opening], {
    dropRootFromRightHand: options.dropRoot,
  }), style, { beatsPerChord: 4, beatsEach: [...beatsEach, 4] })
    .filter(event => event.startBeat < 32)
  const overlap = (a: TimelineEvent, b: TimelineEvent) =>
    a.startBeat < b.startBeat + b.durationBeats - 1e-6 && b.startBeat < a.startBeat + a.durationBeats - 1e-6
  /*
    THỬ LẦN LƯỢT CÁC VỊ TRÍ QUÃNG TÁM — sửa 13/9/2026.

    Bản trước lấy `bases[0]` và `cadenceBases[0]` rồi va chạm tay trái là bỏ cuộc. Mi thứ
    trong tầm app 62–79 chỉ có một base (E4), câu hút B7 rơi vào 63/66 và chạm nốt E4 của cú
    chát LH → intro rỗng cho MỌI bài Mi thứ (người dùng: "bật câu solo mà không thấy vòng
    hợp âm, cũng không phát"). La thứ tình cờ không chạm nên không ai thấy.

    Vẫn đúng luật Codex: dịch NGUYÊN cả nét theo quãng tám (base) và nguyên cụm hút (cadence),
    không gập từng nốt. Chỉ khi mọi cặp đều chạm mới báo không soạn được.
  */
  const cadenceCandidates = (base: number) => Array.from({ length: 11 }, (_, octave) => dominant.root + octave * 12)
    .filter(root => root + 4 >= range.low && root + 7 <= range.high)
    .sort((a, b) => Math.abs(a + 4 - (base + 12)) - Math.abs(b + 4 - (base + 12)))
  if (cadenceCandidates(bases[0]).length === 0) return unavailable('Không đặt được câu hút về hợp âm mở bài trong tầm nốt này.')
  for (const base of bases) for (const cadenceBase of cadenceCandidates(base)) {
    let melody: TimelineEvent[] = phrases.flatMap((bar, index) => bar.map(([at, n, dur]) => ({
      startBeat: index * 4 + at, notes: [(base + n) as MidiNote], durationBeats: dur,
      hand: 'right' as const, velocity: index % 2 && at === 3 ? 82 : dur < 0.25 ? 62 : 74,
    })))
    ;[4, 7, 4].forEach((interval, index) => melody.push({
      startBeat: 29.5 + index * 0.5, durationBeats: 0.45,
      notes: [(cadenceBase + interval) as MidiNote], hand: 'right', velocity: 70 - index * 4,
    }))
    const developed = developBossaMelody(melody, backing, chords, beatsEach, options)
    melody = developed.melody
    // Giữ bass/cú chát LH của đúng cell. RH chỉ chèn khi CẢ trường độ nằm trong khe giai điệu.
    // Ô chót chừa phách cuối cho ca sĩ, bass dẫn vẫn còn nửa phách riêng.
    const events = backing.filter(e => e.hand === 'left' ||
      (e.startBeat + e.durationBeats <= 31 && !melody.some(m => overlap(m, e))))
    const clash = melody.some(m => events.some(e => e.hand === 'left' && overlap(e, m) &&
      e.notes.some(n => Math.abs(n - m.notes[0]!) <= 1)))
    if (clash) continue
    return { events: [...events, ...melody].sort((a, b) => a.startBeat - b.startBeat),
      lengthBeats: 32, chords: chords.map(c => c.symbol), beatsEach,
      sourcePhrase: { id: 'nguoi-hay-quen-em-di-intro', fromBar: 1, barCount: 8, method: 'motif-development' },
      ...(developed.traces.length ? { developmentSources: developed.traces } : {}),
    }
  }
  return unavailable('Intro thử va chạm hai tay ở mọi vị trí quãng tám trong tầm hiện tại. Chưa phát câu sửa gập nốt; hãy đổi tầm nốt.')
}

/** Giang: phát triển cửa sổ 45–48 Người hãy quên (hai câu 4 ô).
 * Kết: 96–101, giữ hướng bII–V–i, chuyển hai ô kết trưởng nguồn về thứ.
 * KT biên soạn trên pulse CP cải tiến; không đổi intro đã nghe duyệt.
 */
export function caPhaoBossaMinorSolo(options: PhraseSectionOptions): PhraseSection {
  const { key, style } = options
  const empty = (why: string): PhraseSection => ({ events: [], chords: [], beatsEach: [],
    lengthBeats: 0, unavailableReason: why })
  if (!key || key.scale !== 'minor' || !laBossaCP(style))
    return empty('Câu mới cần Bossa CP cải tiến và giọng thứ.')
  const outro = options.kind === 'outro'
  const pc = (n: number) => ((n % 12 + 12) % 12) as PitchClass
  const chord = (offset: number, suffix: string): ParsedChord => ({
    ...parseChordInput(pitchClassName(pc(key.tonic + offset)) + suffix).chords[0]!, voicingStyle: 'ca-phao',
  })
  const opening = options.opening ?? chord(0, 'm')
  const nextRoot = pc(opening.root - key.tonic)
  const chords = outro
    ? [chord(0, 'm11'), chord(1, '9'), chord(7, '7b13'), chord(0, 'm9'),
      chord(2, 'm7b5'), chord(7, '7'), chord(0, 'm9'), chord(0, 'm')]
    : [chord(0, 'm9'), chord(2, 'm7b5'), chord(7, '7'), chord(0, 'm11'),
      chord(2, 'm7b5'), chord(7, '7'), chord(0, 'm9'), chord(2, 'm7b5'),
      chord(7, '7'), chord(0, 'm11'), chord(nextRoot + 2, opening.quality.intervals.includes(3) ? 'm7b5' : 'm7'),
      chord(nextRoot + 7, '7')]
  const beatsEach = outro ? [4, 2, 2, 4, 2, 2, 4, 4] : [4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2]
  const lengthBeats = outro ? 24 : 32
  const range = options.range ?? { low: 62, high: 84 }
  const bases = Array.from({ length: 11 }, (_, octave) => key.tonic + octave * 12)
    .filter(base => base + 5 >= range.low && base + 15 <= range.high)
    .sort((a, b) => Math.abs(a + 10 - (range.low + range.high) / 2) - Math.abs(b + 10 - (range.low + range.high) / 2))
  const base = bases[0]
  if (base === undefined) return empty('Tầm câu quá hẹp; bật Trần 84 để giữ nguyên đường nét Bossa.')
  const take = Number.isFinite(options.take) ? Math.abs(Math.floor(options.take!)) % 4 : 0
  type Note = [number, number | number[], number]
  const call: Note[] = take % 2
    ? [[0.5, 12, .45], [1, 14, .9], [2.5, 10, .45], [3.5, 7, .45]]
    : [[0, 14, .9], [1.5, 12, .45], [2.5, 10, .75], [3.5, 7, .45]]
  const dominantAnswer: Note[] = [[.5, 12, .45], [1, 8, .45], [1.5, 5, .45],
    [2, 11, .45], [2.5, 14, .45], [3, 11, .5]]
  const run = (pitches: number[], at: number): Note[] => pitches.map((pitch, index) =>
    [at + index * .25, pitch, index === pitches.length - 1 ? .45 : .22])
  // Nét rải cùng họ hợp âm, bước liền và điểm đáp — không gam ngũ cung cố định.
  const bars: Note[][] = outro ? [
    [[0, [7, 12, 15], .75], [1.5, 14, .45], [2.5, 12, .75]],
    [[.5, [5, 11, 15], .45], [1.25, 15, .22], [2, [5, 11, 15], .75], [3, 14, .45], [3.5, 11, .45]],
    call,
    dominantAnswer,
    [...run(take % 2 ? [7, 10, 12, 14, 15, 14, 12] : [15, 14, 12, 10, 7, 10, 12], .5), [3, 7, .5]],
    [[0, [7, 12, 15], 4]],
  ] : [
    call,
    dominantAnswer,
    [[0, [7, 10, 15], .75], ...run([7, 10, 12, 14, 15, 14, 12, 10], 1.5)],
    [[.5, 12, .45], [1, 8, .45], [1.5, 5, .45], [2, 11, .9], [3, 14, .45]],
    call,
    [[0, 12, .45], [.5, 8, .22], [.75, 5, .22], [1, 8, .22], [1.25, 12, .22],
      [1.5, 8, .22], [1.75, 5, .22], [2, 11, .45], [2.5, 14, .45], [3, 11, .5]],
    [[0, 5, .22], [.25, 6, .22], [.5, 7, .45], [1, 14, .75],
      ...run(take >= 2 ? [15, 14, 12, 10, 7] : [7, 10, 12, 14, 15], 2)],
    [], // ii–V về ĐÍCH thật, dựng dưới đây.
  ]
  if (outro && take >= 2) {
    bars[0] = [[.5, [7, 12, 15], .75], [2, 14, .45], [3, 12, .75]]
  }
  let melody: TimelineEvent[] = bars.flatMap((notes, bar) => notes.map(([at, notes, gate]) => ({
    startBeat: bar * 4 + at, durationBeats: gate,
    notes: (Array.isArray(notes) ? notes : [notes]).map(n => (base + n) as MidiNote),
    hand: 'right' as const, velocity: outro && bar >= 4 ? 62 : gate < .3 ? 61 : 75,
  })))
  if (!outro) {
    const ending = [chords.at(-2)!, chords.at(-1)!]
    for (const [index, c] of ending.entries()) {
      const tones = index === 0 ? [3, 7 - (c.quality.id === 'm7b5' ? 1 : 0), 10] : [4, 7, 4]
      const roots = Array.from({ length: 10 }, (_, octave) => c.root + 12 * octave)
        .filter(root => root + Math.min(...tones) >= range.low && root + Math.max(...tones) <= range.high)
        .sort((a, b) => Math.abs(a + tones[0]! - (base + 12)) - Math.abs(b + tones[0]! - (base + 12)))
      if (roots[0] === undefined) return empty('Câu hút chưa vừa tầm nốt; bật Trần 84.')
      tones.forEach((tone, at) => melody.push({ notes: [roots[0]! + tone], hand: 'right',
        startBeat: 28 + index * 2 + at * .25, durationBeats: at === 2 ? .45 : .22, velocity: 65 }))
    }
  }
  const harmony = [...chords, ...(!outro ? [opening] : [])]
  const backing = renderPattern(voiceLeadTwoHands(harmony), style, {
    beatsPerChord: 4, beatsEach: [...beatsEach, ...(!outro ? [4] : [])],
  }).filter(e => e.startBeat < lengthBeats && (!outro || e.startBeat < 20))
  const developed = developBossaMelody(melody, backing, chords, beatsEach, options)
  melody = developed.melody
  const overlap = (a: TimelineEvent, b: TimelineEvent) =>
    a.startBeat < b.startBeat + b.durationBeats - 1e-6 && b.startBeat < a.startBeat + a.durationBeats - 1e-6
  const events = backing.filter(e => e.hand === 'left' ||
    ((!outro ? e.startBeat + e.durationBeats <= 31 : true) && !melody.some(m => overlap(m, e))))
  if (outro) {
    const tonicBass = voiceLeadTwoHands([chords.at(-1)!])[0]!.left[0]!
    events.push({ notes: [tonicBass], hand: 'left', startBeat: 20, durationBeats: 4, velocity: 58 })
  }
  return { events: [...events, ...melody].sort((a, b) => a.startBeat - b.startBeat), lengthBeats,
    chords: chords.map(c => c.symbol), beatsEach,
    ...(developed.traces.length ? { developmentSources: developed.traces } : {}),
    sourcePhrase: { id: 'nguoi-hay-quen-em-di-' + (outro ? 'outro' : 'interlude'),
      fromBar: outro ? 96 : 45, barCount: outro ? 6 : 4, method: 'motif-development' } }
}

/**
 * CÂU SOLO TỰ DO KIỂU CÀ PHÁO — NHÁNH CŨ.
 * Cảnh báo audit 12/9/2026: các thống kê dưới là mô tả lịch sử, không phải
 * luật tổng quát đã xác nhận. Nhánh này từng trộn Hongkong (ballad) và Người
 * hãy quên (bossa). Intro thứ CP cải tiến ở trên không dùng nó. Xem báo cáo
 * Reference/CA-PHAO-HOA-AM-VOICING-INTRO-BOSSA-2026-09-12.md trước khi mở rộng.
 *
 * Người dùng đọc hai bản ký âm rồi kết luận, và số đo đứng về phía họ từng ý
 * một: ở đoạn solo, người soạn này **không chơi mẫu đệm bossa nữa**. Anh biến
 * hoá tay phải và chơi tự do TRÊN NỀN NHỊP của bài.
 *
 * ## Ba số đo dựng nên bộ này
 *
 * **1. Câu chạy sống ở giang tấu, không ở đoạn hát.** Đếm chuỗi nốt tay phải
 * chạy liên tiếp trong *Hồng Kông 1*:
 *
 * | đoạn | số câu chạy |
 * |------|-------------|
 * | phiên khúc | 0 |
 * | điệp khúc | 0 |
 * | **giang tấu** | **8** trong 19 ô |
 *
 * **2. Hai bài dùng HAI thủ pháp khác nhau** cho cùng một việc:
 *
 * |                                  | mốc 1 nốt | mốc nhiều nốt | tay trái xen khe |
 * |----------------------------------|-----------|---------------|------------------|
 * | Hồng Kông 1 — chạy ngón          | 132       | 45            | 23%              |
 * | Người hãy quên em đi — chùm nốt  | 26        | 31 (19 chùm ba) | 43%            |
 *
 * Bài đầu là bè đơn chạy; bài sau là chùm hợp âm dặm dồn dập với bass xen kẽ.
 * Bộ này giữ CẢ HAI và đổi thủ pháp theo từng ô.
 *
 * **3. Không bao giờ rời nền nhịp.** Đếm độ dài ô trên cả hai bản: *Hồng Kông
 * 1* có 99 ô nhịp 4/4 và 9 ô nhịp 2/4; *Người hãy quên em đi* 101 ô toàn 4/4.
 * **Không một ô 3/4 hay 6/8 nào.** Tự do nằm ở tay phải chứ không ở nhịp — nên
 * bộ này chỉ chia nhỏ TRONG ô, không bao giờ đụng tới trọng số phách.
 *
 * ## Vốn câu, chép từ bản ký âm
 *
 * Ô 51 *Hồng Kông 1* — câu chạy đắt nhất bài, và đúng câu người dùng chụp lại:
 *
 * ```
 * D4 G4 A4 B4 D5 G5 A5 B5 D6 G6 A6 B6
 * bước [+5 +2 +2 +3] lặp — hình BỐN nốt tương thích ngũ cung, nốt móc ba
 * vào ở offset 1,625 (lệch phách), đáp xuống phách 4 bằng một nốt dài
 * ```
 *
 * Bước ấy khớp đúng histogram đo trên cả tám câu: +2 gặp 12 lần, rồi -2 (8),
 * -1 (6), +3 (5), +5 (5), -5 (5).
 */

/** Thang NGŨ CUNG trưởng, tính bằng nửa cung từ nốt gốc. */
const NGU_CUNG = [0, 2, 4, 7, 9]

/**
 * Chỗ VÀO câu, đo trên tám câu chạy của giang tấu Hồng Kông 1: 0,5 · 1,5 · 1,5
 * · 1,5 · 1,625 · 2,75 · 3 · 3,5.
 *
 * Sáu trên tám vào LỆCH phách. Vào đúng vạch thì câu chạy nghe như một bài tập
 * gam; vào lệch thì nó nghe như một câu nói chen vào.
 */
const CHO_VAO = [1.5, 1.5, 1.5, 0.5, 2.75, 3.5]

/** Trường độ đo được: 47 nốt móc kép và 11 nốt móc ba. */
const MOC_KEP = 0.25
const MOC_BA = 0.125

/**
 * Độ dài câu, đo được: 4 · 4 · 4 · 5 · 10 · 10 · 10 · 11 nốt.
 *
 * Hai cụm tách bạch, không có gì ở giữa: câu NGẮN 4-5 nốt và câu DÀI 10-11.
 * Nên chọn một trong hai cụm, chứ không rút một số bất kỳ trong khoảng 4-11.
 */
const CAU_NGAN = [4, 5]
const CAU_DAI = [10, 11]

/** Bước của câu chạy móc kép, theo histogram đo được. */
const BUOC_LEN = [2, 2, 1, 3, 2, 5]
const BUOC_XUONG = [-2, -1, -2, -5, -1, -3]

/** Ba trên tám câu đi lên, năm đi xuống — hai chiều, khác hẳn lối Linh Nhi. */
const TI_LE_LEN = 3 / 8

/** Chùm nốt kiểu Người hãy quên em đi: 19 trên 57 mốc là chùm ĐÚNG BA nốt. */
const CHUM_SO_NOT = 3

/**
 * Khe tối thiểu giữa hai tay — ĐO TRÊN CHÍNH CÀ PHÁO, không mượn của ai.
 *
 * Bản đầu của bộ này lấy 7 "theo `raiLinhNhi` cho nhất quán". Sai nguyên tắc:
 * người dùng đặt luật mỗi lần học một thầy thì phải tách hết khỏi thầy khác,
 * và một hằng số chỉnh trên bản ký âm của người này không thuộc về bộ của
 * người kia. Đo lại thì nó cũng sai cả về số:
 *
 * | | khe trung vị | hẹp nhất |
 * |---|---|---|
 * | Linh Nhi, giang tấu Biển Tình | 24 nửa cung | 9 |
 * | Cà Pháo, giang tấu sáu bài | 12-17 | 0 · 2 · 2 · 3 · 5 · 6 |
 *
 * Hai tay Cà Pháo đứng GẦN NHAU hơn hẳn, và có lúc gần như chạm. Ép khe 7 là
 * ép anh chơi rộng như Linh Nhi — đúng thứ làm mất chỗ khác nhau giữa hai
 * người. Lấy trung vị của sáu số hẹp nhất ấy: 3.
 */
const KHE_HEP = 3

/** Số ngẫu nhiên tất định — cùng `take` thì cùng một câu. */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export interface CaPhaoSoloOptions {
  chords: readonly ParsedChord[]
  beatsPerChord: number
  barBeats: number
  range: { low: MidiNote; high: MidiNote }
  take: number
  /** Tay trái đang chơi, để tay phải không bao giờ chui xuống dưới nó. */
  left?: readonly TimelineEvent[]
  /**
   * Nghiêng về thủ pháp nào. Bỏ trống thì trộn.
   *
   * Đo giang tấu sáu bài của Cà Pháo, tỉ lệ mốc gõ là nốt nhanh:
   *
   * | bài | thể loại | | |
   * |---|---|---|---|
   * | Bèo dạt mây trôi | ballad | 58% nhanh | **chạy** |
   * | Hồng Kông 1 | ballad (người dùng sửa 10/9/2026, trước ghi bossa) | | **chạy** |
   * | Yêu xa | ballad | 42% | trộn |
   * | Mơ | slow rock | 9% nhanh, 6 chùm ba + 28 đôi | **chùm** |
   * | Kém duyên | ballad | 0% nhanh, 35 chùm ba + 18 đôi | **chùm** |
   * | Người hãy quên em đi | bossa | | **chùm** |
   *
   * Chỗ nghiêng là chuyện của TỪNG BÀI, không phải của thể loại: họ ballad
   * chứa cả hai cực. Nên mặc định là trộn, và chỉ nghiêng khi bằng chứng của
   * một họ chỉ có một chiều — slow rock hiện chỉ có *Mơ*, và nó nghiêng chùm.
   */
  thienVe?: 'chay' | 'chum'
}

/** Đặt một lớp cao độ vào khoảng cho trước, thấp nhất có thể. */
function datNot(pc: PitchClass, san: number, tran: number): MidiNote | null {
  let note = Math.ceil((san - pc) / 12) * 12 + pc
  if (note < san) note += 12
  return note <= tran ? (note as MidiNote) : null
}

/**
 * THANG NGŨ CUNG TRÈO — câu chạy đắt nhất, chép hình ô 51.
 *
 * Dựng lại thang ngũ cung từ nốt gốc hợp âm rồi trèo, thay vì đóng cứng dãy
 * bước [+5,+2,+2,+3]: trên hợp âm trưởng thì ra đúng hình ấy, còn trên hợp âm
 * khác thì vẫn nằm trong hoà âm thay vì chỏi. Bản gốc chỉ chạy MỘT lần và trên
 * MỘT chất hợp âm, nên chỗ này là suy rộng có ý thức, không phải số đo.
 */
function thangNguCung(
  tu: number,
  goc: PitchClass,
  san: number,
  tran: number,
  soNot: number,
  len = true,
): TimelineEvent[] {
  const bac: number[] = []
  for (let oct = 0; oct < 4; oct += 1) {
    for (const b of NGU_CUNG) bac.push(b + oct * 12)
  }
  /*
    Thang trèo XUỐNG cũng phải có. Đo tám câu chạy: 3 đi lên, 5 đi xuống. Bản
    đầu của bộ này chỉ cho thang đi lên, mà thang lại là câu DÀI nhất — nên nó
    kéo tỉ lệ chung lệch hẳn sang đi lên (đo ra 18 lên / 7 xuống, trong khi bản
    ký âm là 3 lên / 5 xuống).
  */
  const dau = len
    ? datNot(goc, san, tran)
    : datNot(goc, Math.max(san, tran - bac[soNot - 1]! - 12), tran)
  if (dau === null) return []
  const moc = len ? dau : dau + (bac[soNot - 1] ?? 0)

  const out: TimelineEvent[] = []
  for (let at = 0; at < soNot; at += 1) {
    const note = len ? moc + bac[at]! : moc - bac[at]!
    if (note < san) break
    if (note > tran) break
    out.push({
      notes: [note as MidiNote],
      startBeat: tu + at * MOC_BA,
      durationBeats: MOC_BA * 0.9,
      hand: 'right',
      velocity: 66 + Math.min(24, at * 2),
      grace: false,
    })
  }
  return out
}

/** Câu chạy móc kép, đi lên hoặc đi xuống theo bước đo được. */
function chayMocKep(
  tu: number,
  dau: MidiNote,
  len: boolean,
  soNot: number,
  san: number,
  tran: number,
  seed: number,
): TimelineEvent[] {
  const buoc = len ? BUOC_LEN : BUOC_XUONG
  const out: TimelineEvent[] = []
  let note: number = dau
  for (let at = 0; at < soNot; at += 1) {
    if (note < san || note > tran) break
    out.push({
      notes: [note as MidiNote],
      startBeat: tu + at * MOC_KEP,
      durationBeats: MOC_KEP * 0.9,
      hand: 'right',
      velocity: 70 + (at % 4 === 0 ? 10 : 0),
      grace: false,
    })
    note += buoc[Math.floor(hash(seed + at * 7) * buoc.length)]!
  }
  return out
}

/** Chùm ba nốt dặm — thủ pháp của Người hãy quên em đi. */
function chumNot(
  tu: number,
  tones: readonly PitchClass[],
  san: number,
  tran: number,
  seed: number,
): TimelineEvent[] {
  const notes: MidiNote[] = []
  let duoi = san
  for (let at = 0; at < CHUM_SO_NOT; at += 1) {
    const pc = tones[(at + Math.floor(hash(seed) * tones.length)) % tones.length]!
    const note = datNot(pc, duoi, tran)
    if (note === null) break
    notes.push(note)
    duoi = note + 1
  }
  if (notes.length === 0) return []
  return [
    {
      notes,
      startBeat: tu,
      durationBeats: 0.45,
      hand: 'right',
      velocity: 78,
      grace: false,
    },
  ]
}

/**
 * ĐƯỜNG GIAI ĐIỆU nền — thứ lấp những ô không phải ô chạy, ô chùm.
 *
 * Bản đầu của bộ này để ô còn lại TRỐNG, và đo ra 4,1 nốt mỗi ô trong khi bản
 * ký âm có 12,5 (Hồng Kông 1) và 14,6 (Người hãy quên em đi). Chỗ hụt nằm
 * đúng ở đây: ngoài tám câu chạy, tay phải bản gốc vẫn có 132 mốc một nốt
 * trên 19 ô — tức khoảng 7 nốt mỗi ô của một đường giai điệu chạy liên tục.
 * Bỏ nó đi thì "tự do" hoá ra "thưa thớt".
 */
function duongNet(
  dauO: number,
  barBeats: number,
  tones: readonly PitchClass[],
  san: number,
  tran: number,
  seed: number,
): TimelineEvent[] {
  const out: TimelineEvent[] = []
  const dau = datNot(tones[0]!, Math.max(san, (san + tran) / 2 - 6), tran)
  if (dau === null) return []
  let near: MidiNote = dau

  const buoc = [...BUOC_LEN, ...BUOC_XUONG]

  /*
    Lưới MÓC ĐƠN, và mỗi phách có thể tách đôi thành móc kép.

    Lưới móc đơn trơn ra 6 nốt mỗi ô, còn bản ký âm đo được 12,5 và 14,6. Chỗ
    hụt là những cặp móc kép rải rác trong đường nét — tay phải bản gốc không
    đi đều một trường độ, nó chạy nhanh chậm xen nhau. Bỏ bớt vài mốc cho câu
    còn chỗ thở, nếu không thì thành máy gõ chứ không thành câu.
  */
  for (let at = 0; at < barBeats - 1e-6; at += 0.5) {
    if (hash(seed + at * 17) < 0.18) continue
    const doi = hash(seed + at * 41) < 0.45 ? [0, MOC_KEP] : [0]
    for (const lech of doi) {
      const pc = tones[Math.floor(hash(seed + (at + lech) * 23) * tones.length)]!
      const buocNay = buoc[Math.floor(hash(seed + (at + lech) * 29) * buoc.length)]!
      const goi = datNot(pc, Math.max(san, near + buocNay - 6), tran)
      if (goi === null) continue
      near = goi
      out.push({
        notes: [goi],
        startBeat: dauO + at + lech,
        durationBeats: lech > 0 || doi.length > 1 ? MOC_KEP * 0.9 : 0.45,
        hand: 'right',
        velocity: Math.abs(at % 1) < 1e-6 && lech === 0 ? 76 : 66,
        grace: false,
      })
    }
  }
  return out
}

/**
 * Dựng câu solo tự do cho cả đoạn.
 *
 * Mỗi ô chọn MỘT thủ pháp. Không trộn hai thủ pháp trong cùng một ô: đo trên
 * bản ký âm thì mỗi ô hoặc là ô chạy, hoặc là ô chùm, không ô nào vừa chạy vừa
 * dặm chùm.
 */
export function caPhaoSolo(options: CaPhaoSoloOptions): TimelineEvent[] {
  const { chords, beatsPerChord, barBeats, range, take, left, thienVe } = options
  if (chords.length === 0 || barBeats <= 0) return []

  const tong = chords.length * beatsPerChord
  const soO = Math.max(1, Math.floor(tong / barBeats))
  const hopAm = (beat: number) =>
    chords[Math.min(chords.length - 1, Math.floor(beat / beatsPerChord))]!

  /** Trần tay trái quanh một mốc, để tay phải luôn nằm trên. */
  const tranTrai = (beat: number): number => {
    if (!left || left.length === 0) return range.low
    const truoc = left.filter((e) => e.startBeat <= beat + 1e-6)
    if (truoc.length === 0) return range.low
    const cuoi = Math.max(...truoc.map((e) => e.startBeat))
    return Math.max(
      ...truoc.filter((e) => e.startBeat === cuoi).flatMap((e) => e.notes),
    )
  }

  const out: TimelineEvent[] = []

  for (let o = 0; o < soO; o += 1) {
    const dauO = o * barBeats
    const seed = take * 97 + o * 31
    const chord = hopAm(dauO)
    const tones = chordTonesStrict(chord)
    if (tones.length === 0) continue
    const vao = dauO + CHO_VAO[Math.floor(hash(seed) * CHO_VAO.length)]!
    const san = Math.max(range.low, tranTrai(vao) + KHE_HEP)

    /*
      Ba thủ pháp, tần suất theo số đo: giang tấu Hồng Kông 1 có 8 câu chạy
      trên 19 ô, tức khoảng 42% số ô là ô chạy. Phần còn lại chia cho ô chùm
      nốt và chỗ NGHỈ — bản ký âm cũng không lấp kín mọi ô, và chỗ nghỉ là chỗ
      câu thở.
    */
    /*
      ĐƯỜNG GIAI ĐIỆU CHẠY SUỐT, câu chạy chỉ là chỗ DỒN LÊN trên nền ấy.

      Bản trước coi đường giai điệu là một nhánh thay thế — ô nào không chạy,
      không dặm chùm thì mới có nó. Đo ra 5,8 nốt mỗi ô, vẫn xa 12,5 và 14,6
      của bản ký âm. Sai ở kiến trúc chứ không ở tần suất: tay phải bản gốc
      hoạt động LIÊN TỤC suốt giang tấu, và tám câu chạy là chỗ nó dồn lên,
      không phải chỗ nó bắt đầu chơi.
    */
    out.push(...duongNet(dauO, barBeats, tones, san, range.high, seed))

    /** Dọn chỗ cho thủ pháp sắp chèn: nền không được chồng lên nó. */
    const donCho = (tu: number, den: number) => {
      for (let at = out.length - 1; at >= 0; at -= 1) {
        const e = out[at]!
        if (e.startBeat >= tu - 1e-6 && e.startBeat < den - 1e-6) out.splice(at, 1)
      }
    }

    /*
      Ngưỡng chọn thủ pháp. Bản trộn: 18% thang ngũ cung, 24% câu chạy móc kép,
      24% chùm nốt, phần còn lại chỉ đường giai điệu nền.
    */
    const nguong =
      thienVe === 'chum'
        ? { thang: 0.04, chay: 0.1, chum: 0.72 }
        : thienVe === 'chay'
          ? { thang: 0.26, chay: 0.62, chum: 0.74 }
          : { thang: 0.18, chay: 0.42, chum: 0.66 }

    const chon = hash(seed + 3)
    if (chon < nguong.thang) {
      donCho(vao, vao + 12 * MOC_BA)
      out.push(
        ...thangNguCung(
          vao,
          chord.root as PitchClass,
          san,
          range.high,
          12,
          hash(seed + 5) < TI_LE_LEN,
        ),
      )
    } else if (chon < nguong.chay) {
      const len = hash(seed + 5) < TI_LE_LEN
      const soNot = (hash(seed + 7) < 0.5 ? CAU_NGAN : CAU_DAI)[
        Math.floor(hash(seed + 11) * 2)
      ]!
      const dau = len
        ? datNot(tones[0]!, san, range.high)
        : datNot(tones[0]!, Math.max(san, range.high - 18), range.high)
      if (dau !== null) {
        donCho(vao, vao + soNot * MOC_KEP)
        out.push(...chayMocKep(vao, dau, len, soNot, san, range.high, seed))
      }
    } else if (chon < nguong.chum) {
      for (const at of [0, 1.5, 2.5]) {
        if (at >= barBeats - 1e-6) continue
        if (hash(seed + at * 13) < 0.35) continue
        donCho(dauO + at, dauO + at + 0.5)
        out.push(...chumNot(dauO + at, tones, san, range.high, seed + at))
      }
    }
    // Còn lại: chỉ đường giai điệu nền, và đó là chỗ câu thở.
  }

  /*
    ĐÁP XUỐNG. Câu chạy trong bản ký âm luôn kết bằng một nốt DÀI ở phách mạnh
    — ô 51 trèo tới B6 rồi ngân trọn phách 4. Thiếu nó thì câu chạy dừng giữa
    không trung, nghe như bị cắt ngang.
  */
  for (let o = 0; o < soO; o += 1) {
    const trongO = out.filter(
      (e) =>
        e.startBeat >= o * barBeats - 1e-6 && e.startBeat < (o + 1) * barBeats - 1e-6,
    )
    if (trongO.length < 4) continue
    const cuoi = trongO.reduce((a, b) => (b.startBeat > a.startBeat ? b : a))
    cuoi.durationBeats = Math.max(cuoi.durationBeats, 0.75)
    cuoi.velocity = Math.min(110, cuoi.velocity + 12)
  }

  /*
    SÀN TAY TRÁI, kiểm lại ở TỪNG NỐT chứ không chỉ ở chỗ vào câu.

    Bản trước tính sàn một lần tại chỗ câu chạy vào, rồi dùng chung cho cả ô —
    mà đường giai điệu nền bắt đầu từ ĐẦU ô, trước chỗ ấy. Nửa đầu ô vì thế
    dùng sàn của nửa sau, và đo ra va chạm thật: tay phải rơi đúng cao độ 64 mà
    tay trái đang giữ. Luật "không bao giờ chui xuống dưới tay trái" là luật
    cứng, nên chặn ở chỗ mọi nốt đổ về.
  */
  return out
    .map((e) => {
      const tran = tranTrai(e.startBeat)
      let notes = e.notes
      while (Math.min(...notes) <= tran + KHE_HEP - 1 && Math.max(...notes) + 12 <= range.high) {
        notes = notes.map((n) => (n + 12) as MidiNote)
      }
      return notes === e.notes ? e : { ...e, notes }
    })
    .filter((e) => Math.min(...e.notes) > tranTrai(e.startBeat))
    .sort((a, b) => a.startBeat - b.startBeat)
}
