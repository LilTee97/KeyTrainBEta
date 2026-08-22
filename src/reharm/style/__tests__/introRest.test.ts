import { describe, expect, it } from 'vitest'
import { buildArrangedSong } from '../arrangement'
import type { SourceSection } from '../arrangement'
import type { TimelineEvent } from '../types'

/**
 * Hết đoạn dạo đầu thì **vào ngay hay nghỉ một phách** — hai lối đệm đều có
 * người dùng thật, nên để người chơi chọn thay vì chốt hộ.
 */
const SOURCES: SourceSection[] = [
  { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 16 },
]

/** Đoạn dạo giả: bốn phách, một tiếng ở phách đầu. */
const phrase = () => ({
  events: [
    {
      notes: [60],
      startBeat: 0,
      durationBeats: 1,
      hand: 'right' as const,
      velocity: 80,
      grace: false,
    },
  ] as TimelineEvent[],
  lengthBeats: 4,
})

const build = (restAfter?: number) =>
  buildArrangedSong({
    accompaniment: [],
    fills: [],
    solo: () => [],
    sources: SOURCES,
    steps: [
      { type: 'intro', ...(restAfter === undefined ? {} : { restAfter }) },
      { type: 'section', source: 0 },
    ],
    phrase,
  })

describe('chỗ nghỉ sau đoạn dạo đầu', () => {
  it('mặc định vào ngay: bài hát bắt đầu ngay sau đoạn dạo', () => {
    const verse = build().sections.find((s) => s.kind === 'verse')
    expect(verse?.startBeat).toBe(4)
  })

  it('chọn nghỉ một phách thì bài hát lùi đúng một phách', () => {
    const verse = build(1).sections.find((s) => s.kind === 'verse')
    expect(verse?.startBeat).toBe(5)
  })

  it('chọn 0 phách thì giống hệt mặc định', () => {
    expect(build(0).sections.find((s) => s.kind === 'verse')?.startBeat).toBe(
      build().sections.find((s) => s.kind === 'verse')?.startBeat,
    )
  })

  it('chỗ nghỉ nằm NGOÀI đoạn dạo, không kéo dài nó', () => {
    /*
      Nghỉ là khoảng im giữa hai đoạn. Cộng nó vào độ dài đoạn dạo thì đoạn dạo
      dài ra trên mọi thứ đọc `sections` — thanh tiến độ, chỗ tua, nhãn đoạn.
    */
    for (const rest of [0, 1]) {
      const intro = build(rest).sections[0]
      expect(intro.lengthBeats, `nghỉ ${rest}`).toBe(4)
    }
  })

  it('tiếng đàn của đoạn dạo không xê dịch theo chỗ nghỉ', () => {
    expect(build(1).events[0].startBeat).toBe(build(0).events[0].startBeat)
  })
})
