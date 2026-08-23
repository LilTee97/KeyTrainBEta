import { describe, expect, it } from 'vitest'
import { LICKS } from '../soloVocabulary'
import { generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'
import type { MidiNote, PitchClass } from '../../../shared/musicTheory/types'
import type { SoloNote } from '../soloGenerator'

/**
 * Câu giang tấu phải **đi được như một câu nhạc**, không phải bước đi ngẫu nhiên.
 *
 * Đo trên bản cũ, 12 lượt trên vòng `Dm7 G7 Cmaj7 Cmaj7`:
 *
 * | | cũ | mới |
 * |---|---|---|
 * | mạch đi một chiều, trung bình | 1,7 nốt | 2,4 nốt |
 * | bước liền bậc (<= 2 nửa cung)  | 29 %    | 63 %    |
 * | bước từ quãng 4 trở lên        | 34 %    | 26 %    |
 *
 * Mạch 1,7 nốt nghĩa là **hơn nửa số lần đổi hướng ngay sau một nốt**. Không thế
 * ngón nào đặt vừa một đường như vậy, và đó đúng là chỗ người chơi trượt ngón.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const TAKES = 12

function line(noteSource: 'chordTone' | 'chordPentatonic' | 'storeScale', take: number): SoloNote[] {
  return generateSolo(parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords, {
    beatsPerChord: 4,
    density: 'dense',
    key: KEY,
    take,
    noteSource,
    interlude: true,
    storeScale: scaleForChord,
  }).filter((note) => !note.isGrace && !note.ornament)
}

/** Độ dài trung bình của một mạch đi liền một chiều, tính theo số nốt. */
function averageRun(noteSource: Parameters<typeof line>[0]): number {
  const runs: number[] = []
  for (let take = 0; take < TAKES; take += 1) {
    const pitches = line(noteSource, take).map((note) => note.note)
    let run = 1
    for (let at = 1; at < pitches.length; at += 1) {
      const step = Math.sign(pitches[at] - pitches[at - 1])
      const before = at > 1 ? Math.sign(pitches[at - 1] - pitches[at - 2]) : step
      if (step !== 0 && step === before) run += 1
      else {
        runs.push(run)
        run = 1
      }
    }
    runs.push(run)
  }
  return runs.reduce((a, b) => a + b, 0) / runs.length
}

function stepShare(noteSource: Parameters<typeof line>[0], keep: (gap: number) => boolean): number {
  const gaps: number[] = []
  for (let take = 0; take < TAKES; take += 1) {
    const pitches = line(noteSource, take).map((note) => note.note)
    for (let at = 1; at < pitches.length; at += 1) gaps.push(Math.abs(pitches[at] - pitches[at - 1]))
  }
  return gaps.filter(keep).length / gaps.length
}

describe('mẫu câu chạy dọc gam', () => {
  const scaleRun = LICKS.find((lick) => lick.id === 'scale-run')

  it('có mặt trong vốn từ vựng và đang được dùng', () => {
    expect(scaleRun, 'chưa có mẫu chạy dọc gam').toBeDefined()
    expect(scaleRun!.inRotation).toBe(true)
    expect(scaleRun!.roles).toContain('opener')
    expect(scaleRun!.roles).toContain('middle')
  })

  const context = (material: PitchClass[]) => ({
    chord: parseChordInput('Cmaj7').chords[0],
    next: parseChordInput('Dm7').chords[0],
    startBeat: 0,
    beats: 4,
    from: 64 as MidiNote,
    low: 55 as MidiNote,
    high: 81 as MidiNote,
    scaleTones: new Set<PitchClass>([0, 2, 4, 5, 7, 9, 11] as PitchClass[]),
    previousShape: [],
    notesPerBeat: 2,
    material,
  })

  it('trên thang âm: đi liền bậc, một chiều, không nhảy', () => {
    // C Lydian.
    const pitches = scaleRun!.build(context([0, 2, 4, 6, 7, 9, 11] as PitchClass[])).notes.map((n) => n.note)
    expect(pitches.length).toBeGreaterThanOrEqual(4)

    const gaps = pitches.slice(1).map((note, at) => note - pitches[at])
    for (const gap of gaps) expect(Math.abs(gap), `bước ${gaps.join(',')}`).toBeLessThanOrEqual(2)
    // Nhiều nhất một lần quay đầu: một lần là câu nhạc, hai lần trở lên là loạn.
    const turns = gaps.filter((gap, at) => at > 0 && Math.sign(gap) !== Math.sign(gaps[at - 1]))
    expect(turns.length).toBeLessThanOrEqual(1)
    // Sải gọn trong một quãng tám — quá thì tay phải nhấc lên đặt lại.
    expect(Math.max(...pitches) - Math.min(...pitches)).toBeLessThanOrEqual(12)
  })

  it('hạ cánh vào nốt hợp âm, và hạ cánh bằng một bước chứ không phải một cú nhảy', () => {
    /*
      Bài 5 của nguồn Jazz Scales dựng hẳn gam Bebop 8 nốt chỉ để nốt hợp âm rơi
      vào phách mạnh. Ở đây làm bằng cách dịch cả câu dọc bậc thang — bẻ riêng
      nốt cuối là đúng thứ đẻ ra cú nhảy quãng tám mà bản cũ mắc phải.
    */
    const pitches = scaleRun!.build(context([0, 2, 4, 6, 7, 9, 11] as PitchClass[])).notes.map((n) => n.note)
    const last = pitches[pitches.length - 1]
    expect([0, 4, 7, 11]).toContain(((last % 12) + 12) % 12)
    expect(Math.abs(last - pitches[pitches.length - 2])).toBeLessThanOrEqual(2)
  })

  it('trên bậc thang nốt hợp âm thì tự rút lui, không giả vờ chạy gam', () => {
    // Bốn nốt hợp âm: "đi từng bậc" trên đó chính là rải hợp âm, đã có mẫu riêng.
    expect(scaleRun!.build(context([0, 4, 7, 11] as PitchClass[])).notes).toHaveLength(0)
  })
})

describe('đường nét cả đoạn giang tấu', () => {
  it('mạch đi một chiều dài hơn hẳn bản cũ', () => {
    // Bản cũ: 1,7 nốt cho cả ba nguồn nốt.
    expect(averageRun('storeScale')).toBeGreaterThan(2.2)
    expect(averageRun('chordPentatonic')).toBeGreaterThan(2.0)
  })

  it('gam jazz: quá nửa số bước là liền bậc', () => {
    // Bản cũ 29 % trên nốt hợp âm, 55 % trên gam jazz.
    expect(stepShare('storeScale', (gap) => gap <= 2)).toBeGreaterThan(0.6)
  })

  it('không bước nào quá một quãng tám', () => {
    /*
      Đo trên **nốt tay thật bấm**, tức tính cả nốt tô điểm.

      Bản đo trước lọc bỏ nốt tô điểm rồi đếm khoảng cách giữa hai nốt còn lại,
      ra 0,3 % số bước vượt quãng tám — và kết luận sai. Nốt tô điểm là một
      tiếng đàn thật, nó nằm giữa hai nốt chính và chính nó bắc cầu cho tay:
      Fa4 rồi Sol5 nghe như nhảy mười bốn nửa cung, nhưng tay đi qua một nốt ở
      giữa. Đếm trên dãy đã lọc là đếm một câu nhạc không có thật.

      Chỉ nốt láy được bỏ ra: nó vuốt sát ngay trước nốt chính, cùng một ngón.
    */
    let over = 0
    let total = 0
    let worst = 0
    for (const source of ['chordTone', 'chordPentatonic', 'storeScale'] as const) {
      for (let take = 0; take < TAKES; take += 1) {
        const notes = generateSolo(parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take,
          noteSource: source,
          interlude: true,
          storeScale: scaleForChord,
        }).filter((note) => !note.isGrace)

        for (let at = 1; at < notes.length; at += 1) {
          const sameBar =
            Math.floor(notes[at].startBeat / 4) === Math.floor(notes[at - 1].startBeat / 4)
          if (!sameBar) continue
          const gap = Math.abs(notes[at].note - notes[at - 1].note)
          total += 1
          if (gap > worst) worst = gap
          if (gap > 12) over += 1
        }
      }
    }
    expect(over, `${over}/${total} bước vượt quãng tám, xa nhất ${worst}`).toBe(0)
  })
})
