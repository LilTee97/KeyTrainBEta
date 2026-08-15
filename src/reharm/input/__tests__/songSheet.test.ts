import { describe, expect, it } from 'vitest'
import { reharmonize } from '../../reharmEngine/reharmPipeline'
import {
  SECTION_KIND_LABELS,
  buildSongSheet,
  flattenLines,
  layoutAnchors,
  resectionSheet,
  sectionChordRanges,
} from '../songSheet'
import { parseSongText } from '../songTextParser'

const TEXT = [
  '[Phiên khúc]',
  '   C            Am',
  'Ánh nắng chiều nay rơi xuống phố',
  '[Điệp khúc]',
  '   F            G',
  'Em vẫn đi về trên con đường',
].join('\n')

describe('gắn hợp âm đã tái hoà âm lên lời', () => {
  const song = parseSongText(TEXT)
  const reharm = reharmonize(song.chords, {})
  const sheet = buildSongSheet(song, reharm.colored)

  it('giữ nguyên cấu trúc đoạn và lời', () => {
    expect(sheet.sections.map((section) => section.name)).toEqual([
      'Phiên khúc',
      'Điệp khúc',
    ])
    expect(sheet.sections[0].lines[0].lyric).toBe(
      'Ánh nắng chiều nay rơi xuống phố',
    )
  })

  it('thay ký hiệu bằng hợp âm đã tái hoà âm', () => {
    const symbols = sheet.sections
      .flatMap((section) => section.lines)
      .flatMap((line) => line.anchors)
      .map((anchor) => anchor.symbol)

    expect(symbols).toEqual(reharm.colored.map((chord) => chord.symbol))
    // Và phải khác vòng gốc, nếu không thì tái hoà âm chẳng làm gì
    expect(symbols).not.toEqual(['C', 'Am', 'F', 'G'])
  })

  it('giữ nguyên vị trí neo trên dòng lời', () => {
    const [line] = sheet.sections[0].lines
    expect(line.anchors.map((anchor) => anchor.charOffset)).toEqual([3, 16])
  })

  it('đánh số hợp âm liên tục xuyên các đoạn', () => {
    const indices = sheet.sections
      .flatMap((section) => section.lines)
      .flatMap((line) => line.anchors)
      .map((anchor) => anchor.chordIndex)

    expect(indices).toEqual([0, 1, 2, 3])
    expect(sheet.chordCount).toBe(4)
  })
})

describe('cụm không đọc được', () => {
  const song = parseSongText('Lời [Am7]ở [Xyz]đây')
  const reharm = reharmonize(song.chords, {})
  const sheet = buildSongSheet(song, reharm.colored)

  it('vẫn hiện nhưng bị đánh dấu', () => {
    const anchors = sheet.sections[0].lines[0].anchors

    expect(anchors[1].symbol).toBe('Xyz')
    expect(anchors[1].broken).toBe(true)
    expect(anchors[1].chordIndex).toBeNull()
  })

  it('không chiếm mất số thứ tự của hợp âm thật', () => {
    const anchors = sheet.sections[0].lines[0].anchors
    expect(anchors[0].chordIndex).toBe(0)
  })
})

describe('lệch số lượng thì giữ hợp âm gốc', () => {
  it('không gán bừa khi vòng tái hoà âm khác số lượng', () => {
    /*
      Gán lệch một chỗ là lệch hết phần còn lại của bài, nên thà giữ nguyên
      hợp âm gốc còn hơn.
    */
    const song = parseSongText('   C   Am\nLời ở đây')
    const sheet = buildSongSheet(song, [])

    const symbols = sheet.sections[0].lines[0].anchors.map((a) => a.symbol)
    expect(symbols).toEqual(['C', 'Am'])
  })
})

describe('tự chia đoạn bằng đánh dấu của người dùng', () => {
  const song = parseSongText(
    ['Am7', 'Dòng một', 'D7', 'Dòng hai', 'G7', 'Dòng ba', 'C', 'Dòng bốn'].join(
      '\n',
    ),
  )
  const base = buildSongSheet(song, reharmonize(song.chords, {}).colored)

  it('trải phẳng và đánh số dòng liên tục xuyên các đoạn', () => {
    const flat = flattenLines(base)
    expect(flat.map((entry) => entry.index)).toEqual([0, 1, 2, 3])
  })

  it('không đánh dấu gì thì giữ nguyên cách chia của bộ đọc', () => {
    expect(resectionSheet(base, [])).toBe(base)
  })

  it('khoảng được đánh dấu thành một đoạn riêng, đúng tên', () => {
    const marked = resectionSheet(base, [
      { from: 0, to: 1, kind: 'verse' },
      { from: 2, to: 3, kind: 'chorus' },
    ])

    expect(marked.sections.map((section) => section.name)).toEqual([
      'Phiên khúc',
      'Điệp khúc',
    ])
    expect(marked.sections.map((section) => section.lines.length)).toEqual([2, 2])
  })

  it('dòng liền nhau cùng nhãn gom lại thành một đoạn', () => {
    const marked = resectionSheet(base, [
      { from: 0, to: 0, kind: 'verse' },
      { from: 1, to: 1, kind: 'verse' },
    ])

    expect(marked.sections[0].name).toBe('Phiên khúc')
    expect(marked.sections[0].lines).toHaveLength(2)
  })

  it('quét đè lên thì đánh dấu sau thắng, khỏi phải xoá trước', () => {
    const marked = resectionSheet(base, [
      { from: 0, to: 3, kind: 'verse' },
      { from: 2, to: 3, kind: 'interlude' },
    ])

    expect(marked.sections.map((section) => section.kind)).toEqual([
      'verse',
      'interlude',
    ])
  })

  it('không làm mất dòng nào', () => {
    const marked = resectionSheet(base, [{ from: 1, to: 2, kind: 'chorus' }])
    const total = marked.sections.reduce(
      (sum, section) => sum + section.lines.length,
      0,
    )

    expect(total).toBe(4)
  })

  it('giữ nguyên số hợp âm để phần tô sáng không lệch', () => {
    const marked = resectionSheet(base, [{ from: 0, to: 3, kind: 'chorus' }])
    expect(marked.chordCount).toBe(base.chordCount)
  })

  it('mọi loại đoạn đều có tên tiếng Việt', () => {
    for (const label of Object.values(SECTION_KIND_LABELS)) {
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('mỗi đoạn chiếm những hợp âm nào', () => {
  /*
    Đây là cầu nối giữa lời bài hát và dòng thời gian: đoạn chia theo dòng lời,
    còn nhạc chạy theo hợp âm.
  */
  const song = parseSongText(
    [
      '[Phiên khúc]',
      'Am7  D7',
      'Dòng một',
      '[Giang tấu]',
      'G7  C',
      'Dòng hai',
    ].join('\n'),
  )
  const sheet = buildSongSheet(song, reharmonize(song.chords, {}).colored)

  it('cho đúng khoảng hợp âm của từng đoạn', () => {
    expect(sectionChordRanges(sheet)).toEqual([
      { kind: 'verse', name: 'Phiên khúc', from: 0, to: 1 },
      { kind: 'interlude', name: 'Giang tấu', from: 2, to: 3 },
    ])
  })

  it('theo được cách chia đoạn do người dùng đánh dấu', () => {
    const marked = resectionSheet(sheet, [{ from: 0, to: 1, kind: 'chorus' }])
    const ranges = sectionChordRanges(marked)

    expect(ranges).toHaveLength(1)
    expect(ranges[0].kind).toBe('chorus')
    expect(ranges[0].from).toBe(0)
    expect(ranges[0].to).toBe(3)
  })

  it('đoạn không có hợp âm nào thì bỏ qua', () => {
    const plain = parseSongText('[Dạo đầu]\nChỉ có lời\n[Phiên khúc]\nAm7\nLời')
    const built = buildSongSheet(plain, reharmonize(plain.chords, {}).colored)

    expect(sectionChordRanges(built).map((range) => range.name)).toEqual([
      'Phiên khúc',
    ])
  })
})

describe('xếp cột cho ký hiệu hợp âm', () => {
  it('giữ đúng cột khi không chồng nhau', () => {
    const placed = layoutAnchors([
      { symbol: 'C', charOffset: 0, chordIndex: 0, broken: false },
      { symbol: 'Am', charOffset: 10, chordIndex: 1, broken: false },
    ])

    expect(placed.map((entry) => entry.column)).toEqual([0, 10])
  })

  it('đẩy sang phải khi ký hiệu dài đè lên nhau', () => {
    /*
      Hợp âm sau khi tái hoà âm thường dài hơn hợp âm gốc, ví dụ C thành
      Cadd9, nên hai ký hiệu gần nhau có thể dính vào nhau.
    */
    const placed = layoutAnchors([
      { symbol: 'Cadd9', charOffset: 0, chordIndex: 0, broken: false },
      { symbol: 'Am9', charOffset: 3, chordIndex: 1, broken: false },
    ])

    // Cadd9 dài 5, cộng một khoảng trắng, nên ký hiệu sau bắt đầu ở cột 6
    expect(placed.map((entry) => entry.column)).toEqual([0, 6])
  })

  it('không ký hiệu nào chồng lên ký hiệu trước', () => {
    const placed = layoutAnchors([
      { symbol: 'Cmaj7', charOffset: 0, chordIndex: 0, broken: false },
      { symbol: 'Am11', charOffset: 1, chordIndex: 1, broken: false },
      { symbol: 'D9sus4', charOffset: 2, chordIndex: 2, broken: false },
    ])

    for (let index = 1; index < placed.length; index += 1) {
      const previous = placed[index - 1]
      expect(placed[index].column).toBeGreaterThan(
        previous.column + previous.anchor.symbol.length - 1,
      )
    }
  })
})
