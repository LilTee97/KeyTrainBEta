import { describe, expect, it } from 'vitest'
import { generateSolo, soloToTimeline } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { BALLAD_SOLO_RANGE } from '../../style/balladFamily'
import type { TimelineEvent } from '../../style/types'

/**
 * Câu solo đoạn giang tấu phải **đàn được**: một dòng giai điệu, tầm tay với
 * tới, không leo lên quãng tám thứ sáu.
 *
 * Đo trên nhiều lượt vì hình câu xoay theo lượt — lỗi chỉ hiện ở vài lượt thì
 * chạy một lượt sẽ không thấy.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const TAKES = 8

function takes(range?: { low: number; high: number }): TimelineEvent[][] {
  const chords = parseChordInput('C Am F G').chords
  return Array.from({ length: TAKES }, (_, take) =>
    soloToTimeline(
      generateSolo(chords, {
        beatsPerChord: 4,
        density: 'dense',
        key: KEY,
        take,
        ...(range ? { range } : {}),
      }),
    ),
  )
}

/** Nốt chính của tay phải — bỏ nốt láy, vì nó vốn đứng trước nốt chính. */
const mainNotes = (events: readonly TimelineEvent[]) =>
  events.filter((event) => event.hand === 'right' && !event.grace)

describe('một dòng giai điệu, không chồng nốt', () => {
  it('mỗi mốc phách chỉ một nốt chính', () => {
    for (const [take, events] of takes(BALLAD_SOLO_RANGE).entries()) {
      const byBeat = new Map<number, number[]>()
      for (const event of mainNotes(events)) {
        const key = Number(event.startBeat.toFixed(3))
        byBeat.set(key, [...(byBeat.get(key) ?? []), ...event.notes])
      }
      for (const [beat, notes] of byBeat) {
        expect(notes.length, `lượt ${take} @ phách ${beat}: ${notes.join(',')}`).toBe(1)
      }
    }
  })

  it('luật này đúng cả khi không hạ trần', () => {
    for (const [take, events] of takes().entries()) {
      const byBeat = new Map<number, number>()
      for (const event of mainNotes(events)) {
        const key = Number(event.startBeat.toFixed(3))
        byBeat.set(key, (byBeat.get(key) ?? 0) + event.notes.length)
      }
      for (const [beat, count] of byBeat) {
        expect(count, `lượt ${take} @ phách ${beat}`).toBe(1)
      }
    }
  })
})

describe('tầm tay đệm hát', () => {
  it('điệu ballad: không nốt nào vượt Fa quãng tám 5', () => {
    for (const [take, events] of takes(BALLAD_SOLO_RANGE).entries()) {
      for (const event of events) {
        for (const note of event.notes) {
          expect(note, `lượt ${take} @ phách ${event.startBeat}`).toBeLessThanOrEqual(
            BALLAD_SOLO_RANGE.high,
          )
          expect(note, `lượt ${take} @ phách ${event.startBeat}`).toBeGreaterThanOrEqual(
            BALLAD_SOLO_RANGE.low,
          )
        }
      }
    }
  })

  it('điệu ballad: không chạm quãng tám thứ sáu', () => {
    const notes = takes(BALLAD_SOLO_RANGE).flatMap((events) =>
      events.flatMap((event) => event.notes),
    )
    // Si quãng tám 5 là 83 — chỗ người dùng nghe ra ngay là phi thực tế.
    expect(notes.filter((note) => note >= 83)).toHaveLength(0)
    expect(Math.max(...notes)).toBeLessThan(90)
  })

  it('KHÔNG hạ trần cũng vẫn nằm trong tầm người đệm', () => {
    /*
      Trần mặc định hạ từ Sol quãng tám 6 xuống La quãng tám 5.

      Đây là app đệm hát: cây đàn nâng giọng người. Câu solo lên tới quãng tám
      thứ sáu là tầm của người độc tấu, nghe ra ngay là hai người chơi hai bài
      khác nhau. Dòng nhạc nào cần cao hơn thì bên gọi truyền `range` riêng.
    */
    const notes = takes().flatMap((events) => events.flatMap((e) => e.notes))
    expect(Math.max(...notes)).toBeLessThanOrEqual(81)
    expect(notes.filter((note) => note >= 83)).toHaveLength(0)
  })

  it('truyền tầm rộng thì vẫn lên cao được — luật chỉ là mặc định', () => {
    const wide = takes({ low: 55, high: 96 })
    const notes = wide.flatMap((events) => events.flatMap((e) => e.notes))
    expect(Math.max(...notes)).toBeGreaterThan(81)
  })

  it('câu chạy cuối câu cũng theo tầm, không lọt ra ngoài', () => {
    /*
      Câu chạy cuối câu dựng bằng một đường riêng, và đường đó từng đọc thẳng
      hằng số mặc định thay vì tầm bên gọi đưa vào — nên hạ trần xong nó vẫn
      leo. `endWithRun` bật đúng nhánh ấy.
    */
    const chords = parseChordInput('C Am F G').chords
    for (let take = 0; take < TAKES; take += 1) {
      const events = soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take,
          endWithRun: true,
          range: BALLAD_SOLO_RANGE,
        }),
      )
      for (const event of events) {
        for (const note of event.notes) {
          expect(note, `lượt ${take} @ ${event.startBeat}`).toBeLessThanOrEqual(
            BALLAD_SOLO_RANGE.high,
          )
        }
      }
    }
  })
})

describe('câu đi liền mạch', () => {
  it('trong một ô, không bước nào quá một quãng tám', () => {
    for (const [take, events] of takes(BALLAD_SOLO_RANGE).entries()) {
      const notes = mainNotes(events).sort((a, b) => a.startBeat - b.startBeat)
      for (let bar = 0; bar < 4; bar += 1) {
        const inBar = notes
          .filter((e) => e.startBeat >= bar * 4 && e.startBeat < (bar + 1) * 4)
          .map((e) => e.notes[0])
        for (let at = 1; at < inBar.length; at += 1) {
          expect(
            Math.abs(inBar[at] - inBar[at - 1]),
            `lượt ${take} ô ${bar + 1}: bước ${at}`,
          ).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('cụm nốt trong một ô nằm gọn trong hai quãng tám', () => {
    for (const [take, events] of takes(BALLAD_SOLO_RANGE).entries()) {
      const notes = mainNotes(events)
      for (let bar = 0; bar < 4; bar += 1) {
        const inBar = notes
          .filter((e) => e.startBeat >= bar * 4 && e.startBeat < (bar + 1) * 4)
          .flatMap((e) => e.notes)
        if (inBar.length < 2) continue
        expect(
          Math.max(...inBar) - Math.min(...inBar),
          `lượt ${take} ô ${bar + 1}`,
        ).toBeLessThanOrEqual(24)
      }
    }
  })
})
