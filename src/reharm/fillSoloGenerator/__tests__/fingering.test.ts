import { describe, expect, it } from 'vitest'
import { assignFingers, capStack, nextFinger } from '../fingering'
import { generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'
import { BALLAD_SOLO_RANGE } from '../../style/balladFamily'
import type { MidiNote } from '../../../shared/musicTheory/types'

/**
 * Câu chạy phải **ra ngón**, không chỉ ra nốt.
 *
 * Trước đây `SoloNote` có cao độ, phách, trường độ — và không có gì nói tay đặt
 * ở đâu. Người tập nhìn piano roll rồi tự đoán ngón, đoán sai liên tục.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

const line = (take: number, range?: { low: number; high: number }) =>
  generateSolo(parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords, {
    beatsPerChord: 4,
    density: 'dense',
    key: KEY,
    take,
    noteSource: 'storeScale',
    interlude: true,
    storeScale: scaleForChord,
    ...(range ? { range: range as { low: MidiNote; high: MidiNote } } : {}),
  })

describe('luật ngón', () => {
  it('đi từng bậc thì đổi một ngón', () => {
    expect(nextFinger(1, 2)).toEqual({ finger: 2, shift: false })
    expect(nextFinger(3, -1)).toEqual({ finger: 2, shift: false })
  })

  it('quãng ba thì nhảy hai ngón, vẫn trong một vị trí tay', () => {
    expect(nextFinger(1, 4)).toEqual({ finger: 3, shift: false })
    expect(nextFinger(5, -3)).toEqual({ finger: 3, shift: false })
  })

  it('đi lên hết ngón 5 thì luồn ngón cái', () => {
    const step = nextFinger(5, 2)
    expect(step.finger).toBe(1)
    expect(step.shift, 'luồn ngón cái là một lần đổi vị trí tay').toBe(true)
  })

  it('đi xuống hết ngón 1 thì vắt ngón 3', () => {
    const step = nextFinger(1, -2)
    expect(step.finger).toBe(3)
    expect(step.shift).toBe(true)
  })

  it('nhảy xa hơn quãng bốn thì nhấc tay đặt lại', () => {
    expect(nextFinger(3, 9)).toEqual({ finger: 1, shift: true })
    expect(nextFinger(3, -9)).toEqual({ finger: 5, shift: true })
  })

  it('không ngón nào ra ngoài 1-5, dù đi bao xa', () => {
    let finger = 3 as 1 | 2 | 3 | 4 | 5
    for (const interval of [2, 2, 2, 2, 2, 2, 2, -1, -1, -1, -1, -1, -1, 11, -11, 4, 4, 4]) {
      finger = nextFinger(finger, interval).finger
      expect(finger).toBeGreaterThanOrEqual(1)
      expect(finger).toBeLessThanOrEqual(5)
    }
  })
})

describe('gán ngón cho cả câu', () => {
  it('mọi nốt tay phải đều có ngón', () => {
    for (let take = 0; take < 8; take += 1) {
      for (const note of line(take)) {
        expect(note.finger, `phách ${note.startBeat}`).toBeGreaterThanOrEqual(1)
        expect(note.finger).toBeLessThanOrEqual(5)
      }
    }
  })

  it('hai nốt liền nhau cùng ngón thì phải cùng cao độ', () => {
    // Cùng một ngón bấm hai phím khác nhau liền nhau là chuyện không làm được.
    for (let take = 0; take < 8; take += 1) {
      const notes = line(take).filter((n) => !n.isGrace)
      for (let at = 1; at < notes.length; at += 1) {
        if (notes[at].finger !== notes[at - 1].finger) continue
        if (Math.abs(notes[at].startBeat - notes[at - 1].startBeat) < 1e-6) continue
        expect(
          notes[at].note,
          `lượt ${take} @ phách ${notes[at].startBeat}: ngón ${notes[at].finger} bấm hai phím`,
        ).toBe(notes[at - 1].note)
      }
    }
  })

  it('nốt chồng cùng phách không dùng chung một ngón', () => {
    const plan = assignFingers([
      { note: 60 as MidiNote, startBeat: 0 },
      { note: 72 as MidiNote, startBeat: 0 },
    ])
    expect(plan.notes[0].finger).not.toBe(plan.notes[1].finger)
    // Nốt cao hơn thì ngón lớn hơn.
    expect(plan.notes[1].finger).toBeGreaterThan(plan.notes[0].finger)
  })

  it('đếm được số lần đổi vị trí tay', () => {
    const gam = [60, 62, 64, 65, 67, 69, 71, 72].map((note, at) => ({
      note: note as MidiNote,
      startBeat: at * 0.5,
    }))
    const plan = assignFingers(gam)
    // Gam trưởng một quãng tám: đúng một lần luồn ngón cái.
    expect(plan.shifts).toBe(1)
    expect(plan.notes.map((n) => n.finger)).toEqual([3, 4, 5, 1, 2, 3, 4, 5])
  })
})

describe('không chồng ba nốt tay phải một phách', () => {
  it('cụm ba nốt bị cắt còn hai, giữ nốt ngoài cùng', () => {
    const kept = capStack([
      { note: 60 as MidiNote, startBeat: 0 },
      { note: 64 as MidiNote, startBeat: 0 },
      { note: 67 as MidiNote, startBeat: 0 },
      { note: 72 as MidiNote, startBeat: 0 },
    ])
    expect(kept.map((n) => n.note)).toEqual([60, 72])
  })

  it('nốt tay trái không bị tính vào cụm tay phải', () => {
    const kept = capStack([
      { note: 40 as MidiNote, startBeat: 0, hand: 'left' as const },
      { note: 44 as MidiNote, startBeat: 0, hand: 'left' as const },
      { note: 47 as MidiNote, startBeat: 0, hand: 'left' as const },
      { note: 72 as MidiNote, startBeat: 0 },
    ])
    expect(kept).toHaveLength(4)
  })

  it('câu thật không bao giờ có ba nốt tay phải cùng phách', () => {
    for (let take = 0; take < 8; take += 1) {
      const byBeat = new Map<number, number>()
      for (const note of line(take)) {
        const key = Number(note.startBeat.toFixed(4))
        byBeat.set(key, (byBeat.get(key) ?? 0) + 1)
      }
      for (const [beat, count] of byBeat) {
        expect(count, `lượt ${take} @ phách ${beat}`).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('tầm ballad', () => {
  it('trần hạ xuống Fa quãng tám 5', () => {
    expect(BALLAD_SOLO_RANGE).toEqual({ low: 55, high: 77 })
  })

  it('câu ballad nằm trọn trong Sol quãng tám 3 tới Fa quãng tám 5', () => {
    for (let take = 0; take < 8; take += 1) {
      for (const note of line(take, BALLAD_SOLO_RANGE)) {
        expect(note.note, `lượt ${take} @ phách ${note.startBeat}`).toBeGreaterThanOrEqual(55)
        expect(note.note, `lượt ${take} @ phách ${note.startBeat}`).toBeLessThanOrEqual(77)
      }
    }
  })
})
