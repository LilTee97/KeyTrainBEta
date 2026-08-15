import { describe, expect, it } from 'vitest'
import type { TimelineEvent } from '../types'
import {
  SECTION_LABELS,
  SONG_FORMS,
  buildSongTimeline,
  getSongForm,
} from '../songStructure'

/** Một sự kiện đánh dấu, để nhận ra nó đến từ nhóm nào. */
function marker(label: string, startBeat: number): TimelineEvent {
  return {
    notes: [60],
    startBeat,
    durationBeats: 1,
    hand: 'right',
    // Dùng lực nhấn làm nhãn nhận dạng trong test
    velocity: label === 'accompaniment' ? 10 : label === 'fill' ? 20 : 30,
  }
}

const ACCOMPANIMENT = [marker('accompaniment', 0), marker('accompaniment', 2)]
const FILLS = [marker('fill', 3)]
const SOLO = [marker('solo', 0), marker('solo', 1), marker('solo', 2)]

const build = (formId: string) =>
  buildSongTimeline({
    accompaniment: ACCOMPANIMENT,
    fills: FILLS,
    solo: SOLO,
    loopLengthBeats: 4,
    form: getSongForm(formId)!,
  })

describe('danh sách cấu trúc dựng sẵn', () => {
  it('mọi định danh đều duy nhất', () => {
    const ids = SONG_FORMS.map((form) => form.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi cấu trúc đều có mô tả', () => {
    for (const form of SONG_FORMS) {
      expect(form.description.length).toBeGreaterThan(0)
      expect(form.sections.length).toBeGreaterThan(0)
    }
  })

  it('mọi đoạn đều có tên tiếng Việt', () => {
    expect(SECTION_LABELS.verse).toBe('Phiên khúc')
    expect(SECTION_LABELS.chorus).toBe('Điệp khúc')
    expect(SECTION_LABELS.interlude).toBe('Giang tấu')
  })

  it('đoạn giang tấu luôn đứng sau một đoạn có lời', () => {
    // Giang tấu là khoảng trống sau khi hát xong, không thể mở đầu bài
    for (const form of SONG_FORMS) {
      const first = form.sections[0]
      expect(first.kind).not.toBe('interlude')
    }
  })

  it('có ít nhất một cấu trúc không giang tấu và một cấu trúc có', () => {
    const withInterlude = SONG_FORMS.filter((form) =>
      form.sections.some((section) => section.kind === 'interlude'),
    )
    expect(withInterlude.length).toBeGreaterThan(0)
    expect(withInterlude.length).toBeLessThan(SONG_FORMS.length)
  })
})

describe('buildSongTimeline', () => {
  it('đoạn có lời nhận câu fill, không nhận câu solo', () => {
    // Đây là điểm mấu chốt: chơi solo ở đoạn đang hát là đè lên giọng hát
    const song = build('two-then-interlude')

    const sungSections = song.sections.filter(
      (section) => section.kind !== 'interlude',
    )

    for (const section of sungSections) {
      const inSection = song.events.filter(
        (event) =>
          event.startBeat >= section.startBeat &&
          event.startBeat < section.startBeat + section.lengthBeats,
      )

      expect(inSection.some((event) => event.velocity === 20)).toBe(true)
      expect(inSection.some((event) => event.velocity === 30)).toBe(false)
    }
  })

  it('đoạn giang tấu nhận câu solo, không nhận câu fill', () => {
    const song = build('two-then-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const inSection = song.events.filter(
      (event) =>
        event.startBeat >= interlude.startBeat &&
        event.startBeat < interlude.startBeat + interlude.lengthBeats,
    )

    expect(inSection.some((event) => event.velocity === 30)).toBe(true)
    expect(inSection.some((event) => event.velocity === 20)).toBe(false)
  })

  it('phần đệm có mặt ở mọi đoạn', () => {
    const song = build('full-pop')

    for (const section of song.sections) {
      const inSection = song.events.filter(
        (event) =>
          event.startBeat >= section.startBeat &&
          event.startBeat < section.startBeat + section.lengthBeats,
      )
      expect(inSection.some((event) => event.velocity === 10)).toBe(true)
    }
  })

  it('các đoạn nối tiếp nhau không hở không chồng', () => {
    const song = build('full-pop')

    let expected = 0
    for (const section of song.sections) {
      expect(section.startBeat).toBe(expected)
      expected += section.lengthBeats
    }
    expect(song.totalBeats).toBe(expected)
  })

  it('đoạn nhiều lượt thì dài gấp bấy nhiêu lần', () => {
    const song = build('long-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    expect(interlude.lengthBeats).toBe(8)
  })

  it('đoạn nhiều lượt lặp phần đệm đủ số lần', () => {
    const song = build('long-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const accompanimentHits = song.events.filter(
      (event) =>
        event.velocity === 10 &&
        event.startBeat >= interlude.startBeat &&
        event.startBeat < interlude.startBeat + interlude.lengthBeats,
    )

    // Hai lượt, mỗi lượt hai tiếng
    expect(accompanimentHits).toHaveLength(4)
  })

  it('sự kiện xếp theo thời gian tăng dần', () => {
    const song = build('full-pop')

    for (let index = 1; index < song.events.length; index += 1) {
      expect(song.events[index].startBeat).toBeGreaterThanOrEqual(
        song.events[index - 1].startBeat,
      )
    }
  })

  it('cấu trúc chỉ lặp vòng thì không có đoạn giang tấu nào', () => {
    const song = build('loop-only')

    expect(
      song.sections.some((section) => section.kind === 'interlude'),
    ).toBe(false)
    expect(song.events.some((event) => event.velocity === 30)).toBe(false)
  })

  it('không có câu fill và câu solo thì vẫn dựng được phần đệm', () => {
    const song = buildSongTimeline({
      accompaniment: ACCOMPANIMENT,
      fills: [],
      solo: [],
      loopLengthBeats: 4,
      form: getSongForm('full-pop')!,
    })

    expect(song.events.length).toBeGreaterThan(0)
    expect(song.events.every((event) => event.velocity === 10)).toBe(true)
  })
})
