import { describe, expect, it } from 'vitest'
import type { TimelineEvent } from '../types'
import {
  SECTION_LABELS,
  SONG_FORMS,
  buildSongTimeline,
  getSongForm,
} from '../songStructure'

/** Một sự kiện đánh dấu, để nhận ra nó đến từ nhóm nào. */
function marker(
  label: string,
  startBeat: number,
  hand: TimelineEvent['hand'] = 'right',
  notes: number[] = [60],
): TimelineEvent {
  return {
    notes,
    startBeat,
    durationBeats: 1,
    hand,
    // Dùng lực nhấn làm nhãn nhận dạng trong test
    velocity: label === 'accompaniment' ? 10 : label === 'fill' ? 20 : 30,
  }
}

/*
  Phần đệm có cả hai tay, vì điểm mấu chốt của đoạn giang tấu là **bỏ tay phải
  và giữ tay trái** — không tách hai tay ra thì không kiểm được điều đó.
*/
const ACCOMPANIMENT = [
  marker('accompaniment', 0, 'left', [48]),
  marker('accompaniment', 2, 'right', [64, 67]),
]
const FILLS = [marker('fill', 3)]
const SOLO = [marker('solo', 0), marker('solo', 1), marker('solo', 2)]

/*
  Câu solo nhận số lượt: mỗi lượt giang tấu phải khác lượt trước. Ở đây dùng
  cao độ làm dấu để nhận ra lượt nào là lượt nào.
*/
const soloFor = (take: number) =>
  SOLO.map((event) => ({ ...event, notes: [60 + take] }))

const build = (formId: string) =>
  buildSongTimeline({
    accompaniment: ACCOMPANIMENT,
    fills: FILLS,
    solo: soloFor,
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

  it('vào giang tấu thì tay phải thôi quạt hợp âm', () => {
    /*
      Không ai vừa quạt hợp âm vừa chạy giai điệu bằng cùng một tay. Đây là
      điểm phân biệt lớn nhất giữa đoạn hát và đoạn giang tấu.
    */
    const song = build('two-then-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const inSection = song.events.filter(
      (event) =>
        event.startBeat >= interlude.startBeat &&
        event.startBeat < interlude.startBeat + interlude.lengthBeats,
    )

    // Không còn sự kiện đệm nào của tay phải
    expect(
      inSection.some((event) => event.velocity === 10 && event.hand === 'right'),
    ).toBe(false)
    // Nhưng tay trái vẫn giữ nền hoà âm
    expect(
      inSection.some((event) => event.velocity === 10 && event.hand === 'left'),
    ).toBe(true)
  })

  it('đoạn có lời vẫn giữ đủ phần đệm hai tay', () => {
    const song = build('two-then-interlude')
    const sung = song.sections.filter((section) => section.kind !== 'interlude')

    for (const section of sung) {
      const inSection = song.events.filter(
        (event) =>
          event.velocity === 10 &&
          event.startBeat >= section.startBeat &&
          event.startBeat < section.startBeat + section.lengthBeats,
      )

      expect(inSection.some((event) => event.hand === 'right')).toBe(true)
      expect(inSection.some((event) => event.hand === 'left')).toBe(true)
    }
  })

  /*
    NHÂN ĐÔI BASS CHỈ KHI MỘT BÀN TAY VỚI ĐƯỢC.

    Số đo đứng sau phép nhân đôi là thật: bài *Mơ* bề rộng tay trái 15,9 lên
    20,6 nửa cung ở giang tấu, ô 41 bass đúng là chồng quãng tám `A1+A2`. Nhưng
    bản trước áp nó cho MỌI điệu, và người dùng chụp màn hình đoạn solo bolero
    rồi bác: "đừng để bass đôi như hình, vậy sẽ khó đánh lắm".

    Lý do vật lý: thế tay quãng tám là khuôn cố định, mẫu RẢI bắt khuôn ấy nhảy
    cao độ ở từng cú gõ. Đo cả thư viện — mẫu rải khe giữa 0,50 phách, mọi mẫu
    bass khác >= 1,00, không điệu nào nằm giữa.
  */
  it('bass thưa thì VẪN nhân đôi xuống một quãng tám', () => {
    const song = build('two-then-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const bass = song.events.find(
      (event) =>
        event.velocity === 10 &&
        event.hand === 'left' &&
        event.startBeat >= interlude.startBeat,
    )!

    expect(bass.notes).toEqual([36, 48])
  })

  it('nốt bass quá trầm thì không nhân đôi nữa cho khỏi đục', () => {
    const song = buildSongTimeline({
      accompaniment: [marker('accompaniment', 0, 'left', [30])],
      fills: [],
      solo: soloFor,
      loopLengthBeats: 4,
      form: getSongForm('two-then-interlude')!,
    })
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const bass = song.events.find(
      (event) => event.hand === 'left' && event.startBeat >= interlude.startBeat,
    )!

    expect(bass.notes).toEqual([30])
  })

  /* Mẫu RẢI: tám cú gõ cách nhau nửa phách, đúng hình bolero Linh Nhi. */
  const rai = () =>
    buildSongTimeline({
      accompaniment: Array.from({ length: 8 }, (_, at) =>
        marker('accompaniment', at * 0.5, 'left', [48 + at]),
      ),
      fills: [],
      solo: soloFor,
      loopLengthBeats: 4,
      form: getSongForm('two-then-interlude')!,
    })

  it('mẫu rải thì KHÔNG nhân đôi — một bàn tay không với nổi', () => {
    const song = rai()
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const trong = song.events.filter(
      (event) =>
        event.hand === 'left' &&
        event.startBeat >= interlude.startBeat &&
        event.startBeat < interlude.startBeat + interlude.lengthBeats,
    )
    expect(trong.length).toBeGreaterThan(0)
    for (const event of trong) expect(event.notes.length).toBe(1)
  })

  /*
    Và với mẫu rải, tay trái giang tấu phải ra ĐÚNG tay trái đoạn hát — đây là
    ý "giống như khi phiên/điệp khúc" của người dùng, đo thẳng chứ không suy.
  */
  it('mẫu rải: tay trái giang tấu trùng khớp tay trái đoạn hát', () => {
    const song = rai()
    const doan = (kind: string) => {
      const section = song.sections.find((one) => one.kind === kind)!
      return song.events
        .filter(
          (event) =>
            event.hand === 'left' &&
            event.startBeat >= section.startBeat &&
            event.startBeat < section.startBeat + section.lengthBeats,
        )
        .map(
          (event) =>
            `${(event.startBeat - section.startBeat).toFixed(3)}:${event.notes.join(',')}`,
        )
    }
    expect(doan('interlude')).toEqual(doan('verse'))
  })

  it('mỗi lượt giang tấu chơi một đoạn khác nhau', () => {
    /*
      Lặp y nguyên nghe ra ngay là máy phát lại băng. Số lượt đếm liên tục qua
      cả bài nên lượt nào cũng nhận một số riêng.
    */
    const song = build('long-interlude')
    const interlude = song.sections.find(
      (section) => section.kind === 'interlude',
    )!

    const soloNotes = song.events
      .filter(
        (event) =>
          event.velocity === 30 &&
          event.startBeat >= interlude.startBeat &&
          event.startBeat < interlude.startBeat + interlude.lengthBeats,
      )
      .map((event) => event.notes[0])

    // Hai lượt, mỗi lượt ba nốt, và hai lượt phải khác cao độ
    expect(new Set(soloNotes).size).toBe(2)
  })

  it('số lượt đếm liên tục qua cả bài, không đếm lại từ đầu mỗi đoạn', () => {
    const song = buildSongTimeline({
      accompaniment: ACCOMPANIMENT,
      fills: FILLS,
      solo: soloFor,
      loopLengthBeats: 4,
      form: {
        id: 'test',
        name: 'test',
        description: 'test',
        sections: [
          { kind: 'verse', loops: 1 },
          { kind: 'interlude', loops: 1 },
          { kind: 'chorus', loops: 1 },
          { kind: 'interlude', loops: 1 },
        ],
      },
    })

    const takes = song.events
      .filter((event) => event.velocity === 30)
      .map((event) => event.notes[0])

    // Hai đoạn giang tấu rời nhau vẫn phải là hai lượt khác nhau
    expect(new Set(takes)).toEqual(new Set([60, 61]))
  })

  it('báo lại đã dùng hết bao nhiêu lượt giang tấu', () => {
    expect(build('long-interlude').soloTakes).toBe(2)
    expect(build('two-then-interlude').soloTakes).toBe(1)
    // Không có đoạn giang tấu thì không tiêu lượt nào
    expect(build('loop-only').soloTakes).toBe(0)
  })

  it('phát lại cả bài thì nối tiếp số lượt, không đếm lại từ đầu', () => {
    /*
      Đây là chỗ người dùng nghe ra lỗi: vòng hợp âm lặp lại mà câu solo y
      nguyên. Nguyên nhân là mỗi lần phát lại đều dựng bài với lượt bắt đầu
      từ 0.
    */
    const form = getSongForm('two-then-interlude')!
    const options = {
      accompaniment: ACCOMPANIMENT,
      fills: FILLS,
      solo: soloFor,
      loopLengthBeats: 4,
      form,
    }

    const first = buildSongTimeline(options)
    const second = buildSongTimeline({
      ...options,
      takeOffset: first.soloTakes,
    })

    const soloNotesOf = (song: typeof first) =>
      song.events
        .filter((event) => event.velocity === 30)
        .map((event) => event.notes[0])

    expect(soloNotesOf(second)).not.toEqual(soloNotesOf(first))
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

    // Hai lượt, mỗi lượt chỉ còn tiếng tay trái vì tay phải đã nhường cho solo
    expect(accompanimentHits).toHaveLength(2)
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
      solo: () => [],
      loopLengthBeats: 4,
      form: getSongForm('full-pop')!,
    })

    expect(song.events.length).toBeGreaterThan(0)
    expect(song.events.every((event) => event.velocity === 10)).toBe(true)
  })
})
