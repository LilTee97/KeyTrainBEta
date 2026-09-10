import { describe, expect, it } from 'vitest'
import { planMinorOutro } from '../minorSoloSource'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { TUYEN_SOLO } from '../tuyenSolo'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'

const style = getStyle('bolero-tu-n-improv-bai-04-00001')!
const songChords = parseChordInput('Am Dm G C F E E7 Em').chords
const range = { low: 62, high: 79 }
const plan = (take = 0) => planMinorOutro({ tonic: 9, take, range, songChords })!
const melody = (take = 0) => {
  const p = plan(take)
  return giaiDieuDaoLinhNhi({ outroPlan: p, left: [], chords: p.chords,
    beatsPerChord: 4, barBeats: 4, range })
}

describe('outro thứ: giữ tiểu cú nguồn thay vì vá từng ô', () => {
  it('có mẫu nghe trong đúng tầm thực tế của app, không phải chỉ tầm test 57–95', () => {
    expect(plan()).toBeDefined()
    console.log('OUTRO KIỂM CHỨNG', { source: plan().sourceId, fromBar: plan().fromBar,
      bars: plan().bars.length, chords: plan().chords.map((c) => c.symbol), beats: plan().beatsEach })
  })

  it.each([0, 1, 2, 8, 24])('lượt %i: nguồn, nghỉ, thứ tự, onset và quãng đều còn nguyên', (take) => {
    const p = plan(take)
    const source = TUYEN_SOLO.find((s) => s.id === p.sourceId)!
    expect([source.thay, source.dieu, source.doan, source.thu]).toEqual(['linh-nhi', 'bolero', 'outro', true])
    expect(p.bars).toEqual((source.o4 ?? source.o).slice(p.fromBar, p.fromBar + p.bars.length))
    const expected = p.bars.flatMap((bar, i) => bar.n.map(([at, pitch]) => [i * 4 + at, p.pitchBase + pitch]))
    const events = melody(take)
    expect(events.map((e) => [e.startBeat, e.notes[0]])).toEqual(expected)
    expect(events.every((e) => e.notes[0]! >= range.low && e.notes[0]! <= range.high)).toBe(true)
    expect(p.beatsEach.reduce((a, b) => a + b, 0)).toBe(p.bars.length * 4)
    expect(p.chords.at(-1)!.symbol).toBe('Am')
    expect([0, 3, 7]).toContain((events.at(-1)!.notes[0]! - 9 + 120) % 12)
  })

  it('bảo toàn mốc đổi hợp âm giữa ô của Hoa Phượng', () => {
    const p = plan()
    expect(p.sourceId).toBe('noi-buon-hoa-phuong-outro')
    expect(p.chords.map((c) => c.symbol)).toEqual(['Dm', 'G', 'F', 'F', 'Am'])
    expect(p.beatsEach).toEqual([4, 2.5, 1.5, 4, 4])
  })

  it('không lấy nguồn khác/đổi bậc gần nhất khi vốn bài không khớp', () => {
    expect(planMinorOutro({ tonic: 9, take: 0, range, songChords: parseChordInput('Am E7').chords })).toBeUndefined()
  })

  it('không gập nốt khi tầm quá hẹp', () => {
    expect(planMinorOutro({ tonic: 9, take: 0, range: { low: 70, high: 72 }, songChords })).toBeUndefined()
  })

  it('không có nguồn: báo lý do, không ném lỗi làm sập bài hoặc phát nguồn dự phòng', () => {
    const section = buildPhraseSection({ kind: 'outro', key: { tonic: 9, scale: 'minor' },
      style, beatsPerChord: 4, dropRoot: true, opening: songChords[0]!, songChords,
      range: { low: 70, high: 72 }, take: 0, solo: () => { throw new Error('Không được fallback') } })!
    expect(section.events).toEqual([])
    expect(section.unavailableReason).toContain('bỏ qua outro')
  })

  it('12 chủ âm: nguồn khớp thì giữ nguyên bậc, không dán MIDI giọng sheet', () => {
    for (let tonic = 0; tonic < 12; tonic += 1) {
      const p = planMinorOutro({ tonic: tonic as PitchClass, take: 0,
        range: { low: 48, high: 108 }, songChords: [] })!
      expect(p).toBeDefined()
      expect(p.chords.at(-1)!.root).toBe(tonic)
      expect((p.pitchBase - tonic) % 12).toBe(0)
    }
  })

  it('sau ráp: không mất nốt nguồn, không A/B, không chèn run; kết trên i', () => {
    const section = buildPhraseSection({ kind: 'outro', key: { tonic: 9, scale: 'minor' },
      style, beatsPerChord: 4, dropRoot: true, opening: songChords[0]!, songChords,
      range, take: 0, thay: 'linh-nhi', solo: () => [] })!
    expect(section.sourcePhrase?.id).toBe(plan().sourceId)
    for (const m of melody()) {
      expect(section.events.some((e) => e.hand === 'right' && e.startBeat === m.startBeat &&
        e.notes.length === 1 && e.notes[0] === m.notes[0])).toBe(true)
    }
    expect(section.chords.at(-1)).toBe('Am')
    const pulse = style.cell!.left.map((hit) => hit.beat)
    expect(section.events.filter((e) => e.hand === 'left').every((e) =>
      pulse.includes(e.startBeat % 4))).toBe(true)
    expect(section.events.every((e) => e.durationBeats > 0 &&
      e.startBeat + e.durationBeats <= section.lengthBeats + 1e-6)).toBe(true)
  })
})
