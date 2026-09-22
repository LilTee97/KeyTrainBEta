import sources from './caPhaoFullSolos.json'
import { renderCpFullSolo, type FullSolo } from './caPhaoSolo'
import type { PhraseSection, PhraseSectionOptions } from './phraseSection'

// No cross-sheet donor passed the accompaniment audit. Genre/mode are not enough.
const own = sources.sections.filter(s => s.song === 'Co Em Cho' && s.genre === 'ballad')
const phrase = (kind: PhraseSectionOptions['kind']): FullSolo => structuredClone(own.find(s => s.kind === kind)!)

export function coEmChoFramework(kind: PhraseSectionOptions['kind']): FullSolo {
  const source = phrase(kind)
  if (kind === 'intro') {
    // User-marked C5/D5 at 8:3.5/3.75 are vocal pickups, not a solo motif.
    source.events = source.events.filter(e => e.hand !== 'right' || e.at < 31.5)
  } else if (kind === 'interlude') {
    source.events = source.events.filter(e => e.hand !== 'right' || e.at >= .25)
    // The cadence continues into 56:0/1, before the key lift and vocal entry.
    // Sustain the resolution to finish a 4/4 bar; do not import that modulation.
    const event = (at: number, tones: number[], gates: number[], hand: string) => ({
      at, tones, gates, hand, carry: false, parallelMajor: false, arpeggiate: false, articulations: [],
    })
    source.events.push(
      event(32, [55, 62], [1, 1], 'right'), // Bb3/F4 minus Eb tonic
      event(33, [55, 60], [3, 3], 'right'), // Bb3/Eb4; last two beats are KT sustain
      event(32, [36], [2 / 3], 'left'),
      event(32 + 2 / 3, [43], [.5], 'left'),
      event(33.25, [48], [.25], 'left'),
      event(33.5, [52], [2.5], 'left'),
    )
    source.harmony.push({ at: 32, root: 0, suffix: 'maj9', bass: null })
    source.barLengths.push(4)
    source.lengthBeats = 36
  }
  // Printed ii/V symbols in 7/55 and 67 disagree with bass + RH. Describe the
  // sounding progression; these labels never generate a replacement bass loop.
  const replaceHarmony = (start: number, end: number, changes: FullSolo['harmony']) => {
    source.harmony = source.harmony.filter(h => h.at < start || h.at >= end).concat(changes)
  }
  if (kind === 'intro' || kind === 'interlude') {
    const start = kind === 'intro' ? 24 : 28
    replaceHarmony(start, start + 4, [
      { at: start, root: 2, suffix: 'm7', bass: null },
      { at: start + 1.75, root: 7, suffix: '9sus4', bass: null },
      { at: start + (kind === 'intro' ? 2.25 : 3.25), root: 7, suffix: '9', bass: null },
    ])
  } else {
    replaceHarmony(0, 4, [
      { at: 0, root: 0, suffix: '', bass: null },
      { at: 1.75, root: 9, suffix: 'm7', bass: null },
    ])
    for (const at of [4, 12]) replaceHarmony(at, at + 4, [
      { at, root: 2, suffix: 'm9', bass: null },
      { at: at + 1.75, root: 7, suffix: '13', bass: null },
    ])
  }
  source.harmony.sort((a, b) => a.at - b.at)
  source.events.sort((a, b) => a.at - b.at)
  return source
}

/** Source-first variation, deliberately limited until another groove is verified. */
export function composeCoEmChoSolo(options: PhraseSectionOptions): PhraseSection {
  const empty = (unavailableReason: string): PhraseSection =>
    ({ events: [], chords: [], beatsEach: [], lengthBeats: 0, unavailableReason })
  if (!options.key || !['major', 'minor'].includes(options.key.scale))
    return empty('Solo Có Em Chờ cần xác định giọng trưởng hoặc thứ.')
  if (options.key.scale !== 'major')
    return empty('Khung solo Có Em Chờ đã kiểm chứng là giọng trưởng. Chưa có bản giọng thứ tương thích được duyệt; không tự trộn solo bài khác.')
  if (options.style.family !== 'ca-phao-ballad-co-em-cho' || options.style.beatsPerMeasure !== 4)
    return empty('Khung này chỉ dành cho Ballad Có Em Chờ 4/4.')
  const source = coEmChoFramework(options.kind)
  const take = Number.isFinite(options.take) ? Math.abs(Math.trunc(options.take!)) : 0
  const traces: NonNullable<PhraseSection['compositionSources']> = source.barLengths.map((length, i) => ({
    bar: i + 1, start: i * 4, end: i * 4 + length,
    harmony: `${source.id}:bar:${source.fromBar + i}`,
    melody: `${source.id}:bar:${source.fromBar + i}`,
    rhythm: `${source.id}:both-hands:bar:${source.fromBar + i}`,
    donorGenre: 'ballad', mode: 'major', sourceKind: source.kind,
  }))
  // CP recalls the IVmaj7 rising gesture at 5/53. Exchange the WHOLE two-hand
  // cell only: same harmonic function, no ties across either cut, same next iii7.
  if (take % 2 && options.kind !== 'outro') {
    const donor = phrase(options.kind === 'intro' ? 'interlude' : 'intro')
    const start = options.kind === 'intro' ? 16 : 20
    const from = options.kind === 'intro' ? 20 : 16
    source.events = source.events.filter(e => e.at < start || e.at >= start + 4)
    source.events.push(...donor.events.filter(e => e.at >= from && e.at < from + 4)
      .map(e => ({ ...e, at: start + e.at - from })))
    traces[start / 4].melody = `${donor.id}:bar:${donor.fromBar + from / 4}`
    traces[start / 4].rhythm = `${donor.id}:both-hands:bar:${donor.fromBar + from / 4}`
  }
  const made = renderCpFullSolo(source, options)
  if (made.unavailableReason) return made
  return { ...made, compositionSources: traces,
    sourcePhrase: { ...made.sourcePhrase!, method: 'source-variation' },
    adaptationNote: [
      'Biến thể bám khung Có Em Chờ: giữ câu, hòa âm và đối đáp hai tay; không ghép solo khác bài. Dạo/giang chỉ đổi cử chỉ IVmaj7 ô 5/53 giữa hai lượt; kết giữ nguyên khung.',
      options.kind === 'interlude' ? 'Giang giữ hai tiếng dẫn đầu ô 56, ngân thêm hai phách để khép ô; không mang phần nâng giọng/lời hát vào solo.' : '',
      made.adaptationNote,
    ].filter(Boolean).join(' ') }
}
