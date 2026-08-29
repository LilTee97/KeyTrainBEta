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

/**
 * Phần đệm giả cho phiên khúc: một tiếng mỗi phách suốt mười sáu phách.
 *
 * Bài giả ban đầu để `accompaniment: []`, nên phiên khúc không có nốt nào — đo
 * khoảng lặng bằng nốt thì ra vô cực. Muốn đo bằng thứ tai nghe được thì phải có
 * tiếng để nghe.
 */
const COMP: TimelineEvent[] = Array.from({ length: 16 }, (_, beat) => ({
  notes: [48],
  startBeat: beat,
  durationBeats: 0.5,
  hand: 'left' as const,
  velocity: 70,
  grace: false,
}))

const build = (restAfter?: number) =>
  buildArrangedSong({
    accompaniment: COMP,
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
  it('mặc định nghỉ bốn phách trước khi bài hát vào', () => {
    const verse = build().sections.find((s) => s.kind === 'verse')
    expect(verse?.startBeat).toBe(8)
  })

  it('chọn nghỉ một phách thì bài hát lùi đúng một phách', () => {
    const verse = build(1).sections.find((s) => s.kind === 'verse')
    expect(verse?.startBeat).toBe(5)
  })

  it('chọn nghỉ hai phách thì im đúng hai phách, đo bằng NỐT', () => {
    /*
      Nửa ô nhịp: đủ để ca sĩ lấy hơi mà chưa đứt mạch.

      Đo bằng khoảng trống giữa **nốt cuối của đoạn dạo** và **nốt đầu của phiên
      khúc**, không đọc `startBeat` của đoạn. Con số trong `sections` có thể đúng
      trong khi tiếng đàn vẫn tràn sang — mà thứ ca sĩ nghe là tiếng đàn.
    */
    for (const rest of [0, 1, 2, 3, 4]) {
      const song = build(rest)
      const verse = song.sections.find((s) => s.kind === 'verse')!
      const truoc = song.events.filter((e) => e.startBeat < verse.startBeat)
      const cuoiDao = Math.max(
        ...truoc.map((e) => e.startBeat + e.durationBeats),
        0,
      )
      const dauHat = Math.min(
        ...song.events
          .filter((e) => e.startBeat + 1e-6 >= verse.startBeat)
          .map((e) => e.startBeat),
      )
      // Đoạn dạo giả chỉ có một tiếng ở phách 0, dài 1 phách; vòng dài 4 phách.
      expect(dauHat - cuoiDao, `nghỉ ${rest} phách`).toBeCloseTo(3 + rest, 6)
    }
  })

  it('bỏ trống thì giống nghỉ bốn phách', () => {
    expect(build().sections.find((s) => s.kind === 'verse')?.startBeat).toBe(
      build(4).sections.find((s) => s.kind === 'verse')?.startBeat,
    )
  })

  it('chỗ nghỉ nằm NGOÀI đoạn dạo, không kéo dài nó', () => {
    /*
      Nghỉ là khoảng im giữa hai đoạn. Cộng nó vào độ dài đoạn dạo thì đoạn dạo
      dài ra trên mọi thứ đọc `sections` — thanh tiến độ, chỗ tua, nhãn đoạn.
    */
    for (const rest of [0, 1, 2, 3, 4]) {
      const intro = build(rest).sections[0]
      expect(intro.lengthBeats, `nghỉ ${rest}`).toBe(4)
    }
  })

  it('tiếng đàn của đoạn dạo không xê dịch theo chỗ nghỉ', () => {
    expect(build(1).events[0].startBeat).toBe(build(0).events[0].startBeat)
  })
})
