import { describe, expect, it } from 'vitest'
import { planMinorInterlude } from '../minorSoloSource'
import { buildPhraseSection } from '../phraseSection'
import { buildArrangedSong } from '../arrangement'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { getStyle } from '../styleLibrary'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import { createPhraseTakeSequence } from '../../playback/phraseTakes'

const range = { low: 62, high: 79 }
const chords = parseChordInput('Am Dm G C F E7').chords
const style = getStyle('bolero-tu-n-improv-bai-04-00001')!
const plan = (take = 0, opening = chords[0]!) => planMinorInterlude({
  tonic: 9, take, range, songChords: chords, opening,
})!
const section = (take = 0) => buildPhraseSection({ kind: 'interlude', key: { tonic: 9, scale: 'minor' },
  style, range, take, opening: chords[0]!, songChords: chords, beatsPerChord: 4, dropRoot: true,
  solo: () => { throw new Error('Không được phát câu cũ') },
})!

describe('giang tấu thứ Tuấn: phát triển một mô-típ, giữ nhịp không ép tiết tấu', () => {
  it('một nguồn, tám ô; hoà âm và nốt dùng chung kế hoạch', () => {
    const p = plan()
    expect(p.sourceId).toBe('noi-buon-hoa-phuong-interlude')
    expect(p.method).toBe('motif-development')
    expect(p.chords.map((c) => c.symbol)).toEqual(['Am', 'Am', 'Dm', 'F', 'Dm', 'E7', 'Am', 'E7'])
    expect(p.beatsEach).toEqual(Array(8).fill(4))
    const built = section()
    expect(built.chords).toEqual([...p.chords.map((c) => c.symbol), 'E'])
    expect(built.lengthBeats).toBe(36) // Yêu cầu vòng 2: thêm ô hút + nghỉ chờ.
    expect(built.sourcePhrase?.method).toBe('motif-development')
  })

  it.each([0, 1, 2, 3, 4, 5, 100000001])('lượt %i: nhịp, tầm, motif và tension–resolution', (take) => {
    const p = plan(take)
    expect(p).toBeDefined()
    const all = p.bars.flatMap((b) => b.n)
    expect(all.every(([at, n, dur]) => at >= 0 && at + dur <= 4 && dur > 0 && n >= 62 && n <= 79)).toBe(true)
    for (let bar = 0; bar < p.bars.length; bar += 1) {
      const b = p.bars[bar]!, c = p.chords[bar]!
      const pcs = c.quality.intervals.map((n) => (c.root + n) % 12)
      // Nốt trên phách nguyên là điểm tựa. Nốt ngoài hợp âm chỉ là nốt nối ngắn,
      // giải ngay bằng bước hẹp tới nốt ổn định, không sửa cả câu sau khi sinh.
      for (let n = 0; n < b.n.length; n += 1) {
        const [at, pitch, duration] = b.n[n]!
        if (Number.isInteger(at)) expect(pcs).toContain(pitch % 12)
        if (!pcs.includes(pitch % 12)) {
          const next = b.n[n + 1] ?? p.bars[bar + 1]?.n[0]
          expect(next).toBeDefined()
          expect(duration).toBeLessThanOrEqual(0.5)
          expect(Math.abs(next![1] - pitch)).toBeLessThanOrEqual(2)
          const nextChord = b.n[n + 1] ? c : p.chords[bar + 1]!
          expect(nextChord.quality.intervals.map((n) => (nextChord.root + n) % 12)).toContain(next![1] % 12)
        }
      }
    }
    // Giữ VAI TRÒ mô-típ khi đổi hòa âm: bậc 3 phải đổi trưởng/thứ theo hợp âm,
    // không đòi giữ nguyên 3 nửa cung trên cả hợp âm trưởng như kiểm cũ.
    const motif = (bar: number) => p.bars[bar]!.n.slice(0, 3).map((n) =>
      [0, p.chords[bar]!.quality.intervals.includes(3) ? 3 : 4, 7]
        .indexOf((n[1] - p.chords[bar]!.root + 120) % 12))
    expect(motif(0)).toEqual(motif(1))
    expect(motif(0)).toEqual(motif(4))
    expect(p.bars[0]!.n.at(-1)![0] + p.bars[0]!.n.at(-1)![2]).toBeLessThan(4)
    expect(p.bars[7]!.n.at(-1)![1] % 12).toBe(8) // G# dẫn về Am của phần hát
  })

  it('tất định cùng lượt; sáu biến thể thực, không chỉ đổi ID hoặc hợp âm', () => {
    expect(plan(4)).toEqual(plan(4))
    expect(new Set(Array.from({ length: 6 }, (_, take) => JSON.stringify(plan(take).bars))).size).toBe(6)
    const beats = new Set(plan(3).bars.flatMap((b) => b.n.map((n) => n[0])))
    expect(beats.has(0.5)).toBe(true)
    expect(plan(9).bars[4]!.n[0]![0]).toBe(0.5) // lượt mô-típ 3 sau ba đường hòa âm
    expect(new Set(plan().bars.map((b) => b.n.map((n) => n[0]).join(','))).size).toBeGreaterThanOrEqual(4)
  })

  it('12 chủ âm: chuyển theo bậc, không giữ MIDI của Rê thứ nguồn', () => {
    for (let tonic = 0; tonic < 12; tonic += 1) {
      const root = tonic as PitchClass
      const target = parseChordInput(pitchClassName(root) + 'm').chords[0]!
      const p = planMinorInterlude({ tonic: root, take: 0, range: { low: 57, high: 84 },
        songChords: [], opening: target })!
      expect(p).toBeDefined()
      expect(p.chords[0]!.root).toBe(tonic)
      expect(p.chords[0]!.quality.intervals).toContain(3)
      expect(p.bars.at(-1)!.n.at(-1)![1] % 12).toBe((tonic + 11) % 12)
    }
  })

  it('dẫn vào hợp âm tiếp theo thực, không luôn hút về chủ âm toàn bài', () => {
    const p = plan(0, parseChordInput('C').chords[0]!)
    expect(p.chords.at(-1)!.symbol).toBe('G7')
    expect(p.bars.at(-1)!.n.at(-1)![1] % 12).toBe(11)
    const terminal = planMinorInterlude({ tonic: 9, take: 0, range, songChords: chords, opening: null })!
    expect(terminal.chords.at(-1)!.symbol).toBe('Am')
    expect(terminal.bars.at(-1)!.n.at(-1)![1] % 12).toBe(9)
  })

  it('vốn thiếu VI thì kéo dài iv; thiếu chức năng cơ bản/tầm quá hẹp thì không fallback', () => {
    const basic = planMinorInterlude({ tonic: 9, take: 0, range,
      songChords: parseChordInput('Am Dm E').chords, opening: chords[0]! })!
    expect(basic.chords.map((c) => c.symbol)).toEqual(['Am', 'Am', 'Dm', 'Dm', 'Dm', 'E7', 'Am', 'E7'])
    expect(planMinorInterlude({ tonic: 9, take: 0, range,
      songChords: parseChordInput('Am Em').chords, opening: chords[0]! })).toBeUndefined()
    expect(planMinorInterlude({ tonic: 9, take: 0, range: { low: 70, high: 72 },
      songChords: chords, opening: chords[0]! })).toBeUndefined()
  })

  it('ráp section giữ run đã soạn, không A/B hay chèn run lần hai', () => {
    const p = plan(), built = section()
    const melody = giaiDieuDaoLinhNhi({ interludePlan: p, left: [], chords: p.chords,
      beatsPerChord: 4, barBeats: 4, range })
    for (const note of melody) {
      expect(built.events.some((e) => e.hand === 'right' && e.startBeat === note.startBeat &&
        JSON.stringify(e.notes) === JSON.stringify(note.notes))).toBe(true)
    }
    const bassPulse = style.cell!.left.map((hit) => hit.beat)
    expect(built.events.filter((e) => e.hand === 'left').every((e) => bassPulse.includes(e.startBeat % 4))).toBe(true)
    expect(built.events.every((e) => e.durationBeats > 0 && e.startBeat + e.durationBeats <= 34)).toBe(true)
    expect(built.events.filter((e) => e.startBeat >= 32).map((e) => e.durationBeats)).toEqual([2, 2])
    expect(built.events.every((e) => new Set(e.notes).size === e.notes.length)).toBe(true)
  })

  it('dòng thời gian giữ hai tay, ô hút và hai phách nghỉ; hát trở vào vạch 36', () => {
    const built = section()
    const song = buildArrangedSong({ accompaniment: [], fills: [], solo: () => [],
      sources: [{ name: 'Điệp khúc', kind: 'chorus', startBeat: 0, lengthBeats: 8 }],
      steps: [{ type: 'interlude', over: 0, loops: 1, restAfter: 0 }, { type: 'section', source: 0 }],
      styleId: style.id,
      interludeRange: () => ({ startBeat: 0, lengthBeats: built.lengthBeats, composed: true,
        events: built.events.filter((e) => e.hand === 'left'),
        solo: () => built.events.filter((e) => e.hand === 'right'),
        kyHieu: built.chords, kyHieuBeats: built.beatsEach }),
    })
    const normalize = (events: typeof built.events) => events.map((e) => JSON.stringify(e)).sort()
    expect(normalize(song.events)).toEqual(normalize(built.events))
    expect(song.sections[1]!.startBeat).toBe(36)
    expect(song.soloSpans[0]!.chords).toEqual(built.chords)
    expect(song.soloSpans[0]!.beatsEach.reduce((a, b) => a + b, 0)).toBe(36)
  })

  it.each([0, 1, 2, 3, 4, 5])('lượt %i: có câu vừa 8+1 và câu dài 12+1, nối vào mô-típ kế', (take) => {
    const p = plan(take)
    for (const [bar, from, count] of [[2, 2, 8], [5, 1, 12]] as const) {
      const run = p.bars[bar]!.n.filter((n) => n[0] >= from)
      expect(run).toHaveLength(count)
      expect(run.map((n) => n[0])).toEqual(Array.from({ length: count }, (_, i) => from + i * 0.25))
      expect(run.every((n) => n[2] === 0.25)).toBe(true)
      const pitches = [...run.map((n) => n[1]), p.bars[bar + 1]!.n[0]![1]]
      expect(new Set(pitches).size).toBeGreaterThanOrEqual(4)
      expect(Math.abs(pitches.at(-1)! - pitches.at(-2)!)).toBeLessThanOrEqual(7)
    }
    // Hai câu mở/nhắc vẫn nhận ra được, không kéo toàn đoạn thành chạy gam.
    expect(p.bars[0]!.n).toHaveLength(3)
    expect(p.bars[4]!.n).toHaveLength(3)
  })

  it('ô hút theo đích F, và không dựng ô hút khi không còn đoạn hát sau', () => {
    const opts = { kind: 'interlude' as const, key: { tonic: 9 as const, scale: 'minor' as const },
      style, range, take: 0, songChords: chords, beatsPerChord: 4, dropRoot: true, solo: () => [] }
    const pull = buildPhraseSection({ ...opts, opening: parseChordInput('F').chords[0]! })!
    expect(pull.chords.at(-1)).toBe('C')
    expect(pull.events.filter((e) => e.startBeat === 32).flatMap((e) => e.notes.map((n) => n % 12)))
      .toEqual([0, 0, 4])
    const end = buildPhraseSection({ ...opts, opening: null })!
    expect(end.lengthBeats).toBe(32)
    expect(end.chords.at(-1)).toBe('Am')
  })

  it.each(['F', 'Am'])('dặm ii–V theo đích %s, giữ câu chạy và nghỉ chờ hát', (symbol) => {
    const opening = parseChordInput(symbol).chords[0]!
    const opts = { kind: 'interlude' as const, key: { tonic: 9 as const, scale: 'minor' as const },
      style, range, take: 0, opening, songChords: chords, beatsPerChord: 4,
      dropRoot: true, solo: () => [] }
    const old = buildPhraseSection(opts)!
    const built = buildPhraseSection({ ...opts, interludeCadence: 'ii-v' })!
    const expected = symbol === 'F' ? ['Gm7', 'C7'] : ['Bm7b5', 'E7']
    expect(built.chords.slice(-2)).toEqual(expected)
    expect(built.beatsEach).toEqual([...Array(8).fill(4), 1, 3])
    expect(built.lengthBeats).toBe(36)
    expect(built.events.filter((e) => e.startBeat < 32)).toEqual(old.events.filter((e) => e.startBeat < 32))
    expect(built.events.every((e) => e.startBeat + e.durationBeats <= 34)).toBe(true)
    for (let i = 0; i < 2; i += 1) {
      const hits = built.events.filter((e) => e.startBeat === 32 + i)
      expect(hits.map((e) => e.hand)).toEqual(['left', 'right'])
      expect(hits.find((e) => e.hand === 'right')!.notes.length).toBeGreaterThanOrEqual(3)
      const c = parseChordInput(expected[i]!).chords[0]!
      expect([...new Set(hits.flatMap((e) => e.notes.map((n) => n % 12)))].sort((a, b) => a - b))
        .toEqual(c.quality.intervals.map((n) => (c.root + n) % 12).sort((a, b) => a - b))
    }
    const song = buildArrangedSong({
      accompaniment: [{ notes: [opening.root + 60], startBeat: 0, durationBeats: 1,
        velocity: 80, hand: 'right', grace: false }], fills: [], solo: () => [],
      sources: [{ name: 'Điệp khúc', kind: 'chorus', startBeat: 0, lengthBeats: 8 }],
      steps: [{ type: 'interlude', over: 0, loops: 1, restAfter: 0 }, { type: 'section', source: 0 }],
      styleId: style.id,
      interludeRange: () => ({ startBeat: 0, lengthBeats: built.lengthBeats, composed: true,
        events: built.events.filter((e) => e.hand === 'left'),
        solo: () => built.events.filter((e) => e.hand === 'right'),
        kyHieu: built.chords, kyHieuBeats: built.beatsEach }),
    })
    expect(song.sections[1]!.startBeat).toBe(36)
    expect(song.events.filter((e) => e.startBeat === 36).flatMap((e) => e.notes)).toContain(opening.root + 60)
    expect(song.events.some((e) => e.startBeat >= 34 && e.startBeat < 36)).toBe(false)
    expect(song.soloSpans[0]!.chords).toEqual(built.chords)
    expect(song.soloSpans[0]!.beatsEach).toEqual(built.beatsEach)
  })

  it('ii–V chuyển đúng 12 đích trưởng và thứ; không bám chủ âm Am toàn bài', () => {
    for (let tonic = 0; tonic < 12; tonic += 1) {
      for (const minor of [false, true]) {
        const opening = parseChordInput(pitchClassName(tonic as PitchClass) + (minor ? 'm' : '')).chords[0]!
        const built = buildPhraseSection({ kind: 'interlude', key: { tonic: 9, scale: 'minor' },
          style, range: { low: 57, high: 84 }, take: 0, opening, songChords: chords,
          beatsPerChord: 4, dropRoot: true, solo: () => [], interludeCadence: 'ii-v' })!
        expect(built.lengthBeats).toBe(36)
        const cadence = built.chords.slice(-2).map((s) => parseChordInput(s).chords[0]!)
        expect(cadence.map((c) => c.root)).toEqual([(tonic + 2) % 12, (tonic + 7) % 12])
        expect(cadence[0]!.quality.id).toBe(minor ? 'm7b5' : 'm7')
        expect(cadence[1]!.quality.id).toBe('7')
        expect(built.events.every((e) => e.durationBeats > 0 && e.startBeat + e.durationBeats <= 34)).toBe(true)
      }
    }
  })

  it('chọn ii–V nhưng không còn đoạn hát sau thì không thêm vòng hút', () => {
    const built = buildPhraseSection({ kind: 'interlude', key: { tonic: 9, scale: 'minor' },
      style, range, take: 0, opening: null, songChords: chords, beatsPerChord: 4,
      dropRoot: true, solo: () => [], interludeCadence: 'ii-v' })!
    expect(built.lengthBeats).toBe(32)
    expect(built.chords.at(-1)).toBe('Am')
  })

  it('144 cặp vòng/câu khác thật; nốt luôn theo hòa âm đã chọn, không chỉ đổi nhãn', () => {
    const sequence = createPhraseTakeSequence()
    const fingerprints = new Set<string>()
    const rhythms = new Set<string>()
    for (let click = 0; click < 144; click += 1) {
      const play = sequence.start()
      const take = play(0)
      const p = plan(take)
      expect(plan(play(0))).toEqual(p) // lưu và phát không bốc hai câu khác nhau
      fingerprints.add(JSON.stringify(p.bars))
      rhythms.add(JSON.stringify(p.bars.map((b) => b.n.map(([at, , dur]) => [at, dur]))))
      for (let bar = 0; bar < p.bars.length; bar += 1) {
        const b = p.bars[bar]!, c = p.chords[bar]!
        const pcs = c.quality.intervals.map((n) => (c.root + n) % 12)
        for (let i = 0; i < b.n.length; i += 1) {
          const [at, note, dur] = b.n[i]!
          expect(note >= range.low && note <= range.high && at >= 0 && dur > 0 && at + dur <= 4).toBe(true)
          if (Number.isInteger(at)) expect(pcs).toContain(note % 12)
          if (!pcs.includes(note % 12)) {
            const next = b.n[i + 1] ?? p.bars[bar + 1]?.n[0]
            expect(next).toBeDefined()
            expect(dur).toBeLessThanOrEqual(0.5)
            expect(Math.abs(next![1] - note)).toBeLessThanOrEqual(2)
          }
        }
      }
      const built = section(take)
      expect(built.events.every((e) => e.startBeat + e.durationBeats <= 34)).toBe(true)
      expect(built.lengthBeats).toBe(36)
    }
    expect(fingerprints.size).toBe(144)
    expect(rhythms.size).toBeGreaterThanOrEqual(8)
  })

  it('hai vòng giang trong bài: dựng lại cả hai tay với hai lượt khác, không lặp events cũ', () => {
    const seen: number[] = []
    const song = buildArrangedSong({ accompaniment: [], fills: [], solo: () => [],
      sources: [{ name: 'Điệp khúc', kind: 'chorus', startBeat: 0, lengthBeats: 8 }],
      steps: [{ type: 'interlude', over: 0, loops: 2, restAfter: 0 }, { type: 'section', source: 0 }],
      styleId: style.id,
      interludeRange: (_over, _next, take) => {
        seen.push(take)
        const built = section(take)
        return { startBeat: 0, lengthBeats: built.lengthBeats, composed: true,
          events: built.events.filter((e) => e.hand === 'left'),
          solo: () => built.events.filter((e) => e.hand === 'right'),
          kyHieu: built.chords, kyHieuBeats: built.beatsEach }
      },
    })
    expect(seen).toEqual([0, 1])
    for (let take = 0; take < 2; take += 1) {
      const actual = song.events.filter((e) => e.startBeat >= take * 36 && e.startBeat < (take + 1) * 36)
        .map((e) => ({ ...e, startBeat: e.startBeat - take * 36 }))
      const normalize = (es: typeof actual) => es.map((e) => JSON.stringify(e)).sort()
      expect(normalize(actual)).toEqual(normalize(section(take).events))
    }
    expect(song.sections[1]!.startBeat).toBe(72)
  })

  it('ba đường liền mạch, mô-típ gắn đúng nguồn; không lặp hòa âm ngay lượt trước', () => {
    const expected = [
      ['Am', 'Am', 'Dm', 'F', 'Dm', 'E7', 'Am', 'E7'],
      ['Am', 'Dm', 'F', 'F', 'E7', 'E7', 'Am', 'E7'],
      ['Am', 'G', 'F', 'C', 'Dm', 'Am', 'E7', 'E7'],
    ]
    for (let take = 0; take < 9; take += 1) {
      const p = plan(take)
      expect(p.chords.map((c) => c.symbol)).toEqual(expected[take % 3])
      expect(p.sourceId).toBe(take % 3 === 2 ? 'dung-xa-em-dem-nay-intro' : 'noi-buon-hoa-phuong-interlude')
      if (take) expect(p.chords).not.toEqual(plan(take - 1).chords)
      const built = section(take)
      expect(built.chords.slice(0, 8)).toEqual(expected[take % 3])
      for (const event of built.events.filter((e) => e.hand === 'left' && e.startBeat < 32)) {
        const chord = p.chords[Math.floor(event.startBeat / 4)]!
        for (const note of event.notes) {
          expect(chord.quality.intervals.map((n) => (chord.root + n) % 12)).toContain(note % 12)
        }
      }
    }
    const roles = (take: number) => plan(take).bars[0]!.n.map((n) => (n[1] - 9 + 120) % 12)
    expect(roles(0)).toEqual([7, 0, 3]) // Hoa Phượng 5–1–3
    expect(roles(2)).toEqual([7, 3, 0]) // Đừng Xa 5–3–1, không dán mô-típ Hoa Phượng
  })

  it('loại nguyên đường thiếu VII/III, không thế bằng bậc gần nhất; giữ màu hợp âm nhập', () => {
    for (let take = 0; take < 8; take += 1) {
      const p = planMinorInterlude({ tonic: 9, take, range,
        songChords: parseChordInput('Am(add9) Dm Fadd2 E7').chords, opening: chords[0]! })!
      expect(p.sourceId).toBe('noi-buon-hoa-phuong-interlude')
      expect(p.harmonyId).toBe(take % 2 ? 'hoa-phuong-cadence' : 'hoa-phuong-reprise')
      expect(p.chords[0]!.symbol).toBe('Am(add9)')
      expect(p.chords.some((c) => c.symbol === 'Fadd2')).toBe(true)
    }
  })

  it('mọi đường chuyển theo bậc ở 12 giọng thứ; đích hút F không bị đổi theo vòng', () => {
    for (let tonic = 0; tonic < 12; tonic += 1) {
      const target = parseChordInput(pitchClassName(tonic as PitchClass) + 'm').chords[0]!
      for (let take = 0; take < 3; take += 1) {
        const p = planMinorInterlude({ tonic: tonic as PitchClass, take,
          range: { low: 57, high: 84 }, songChords: [], opening: target })!
        expect(p).toBeDefined()
        expect(p.chords.map((c) => (c.root - tonic + 12) % 12))
          .toEqual(plan(take).chords.map((c) => (c.root - 9 + 12) % 12))
        expect(p.chords[0]!.quality.intervals).toContain(3)
      }
    }
    for (let take = 0; take < 3; take += 1) {
      const built = buildPhraseSection({ kind: 'interlude', key: { tonic: 9, scale: 'minor' },
        style, range, take, opening: parseChordInput('F').chords[0]!, songChords: chords,
        beatsPerChord: 4, dropRoot: true, solo: () => [], interludeCadence: 'ii-v' })!
      expect(built.chords.slice(-3)).toEqual(['C7', 'Gm7', 'C7'])
      expect(built.lengthBeats).toBe(36)
      expect(built.events.every((e) => e.startBeat + e.durationBeats <= 34)).toBe(true)
    }
  })
})
