import { describe, expect, it } from 'vitest'
import { insertChordAfter, parseSongText } from '../songTextParser'

describe('nhận diện định dạng', () => {
  it('hợp âm trong ngoặc vuông giữa dòng là ChordPro', () => {
    const song = parseSongText('Ánh nắng [Am7]chiều nay [D7]rơi')
    expect(song.format).toBe('chordpro')
  })

  it('dòng hợp âm nằm trên dòng lời là hai dòng canh cột', () => {
    const song = parseSongText('   Am7      D7\nÁnh nắng chiều nay rơi')
    expect(song.format).toBe('two-line')
  })

  it('chỉ có hợp âm không có lời thì báo đúng vậy', () => {
    expect(parseSongText('Am7 D7 Gmaj7').format).toBe('chords-only')
  })
})

describe('định dạng hai dòng canh cột', () => {
  const text = [
    '[Phiên khúc]',
    '   Am7          D7',
    'Ánh nắng chiều nay rơi xuống phố',
    '',
    '[Điệp khúc]',
    'Gmaj7',
    'Em vẫn đi về',
  ].join('\n')

  it('tách đúng số đoạn và giữ nguyên tên đoạn', () => {
    const song = parseSongText(text)

    expect(song.sections.map((section) => section.name)).toEqual([
      'Phiên khúc',
      'Điệp khúc',
    ])
  })

  it('nhận ra loại đoạn từ tên tiếng Việt', () => {
    const song = parseSongText(text)
    expect(song.sections.map((section) => section.kind)).toEqual([
      'verse',
      'chorus',
    ])
  })

  it('ghép dòng hợp âm với dòng lời ngay dưới', () => {
    const song = parseSongText(text)
    const [line] = song.sections[0].lines

    expect(line.lyric).toBe('Ánh nắng chiều nay rơi xuống phố')
    expect(line.chords.map((anchor) => anchor.source)).toEqual(['Am7', 'D7'])
  })

  it('neo hợp âm đúng cột của nó trên dòng lời', () => {
    const song = parseSongText(text)
    const [line] = song.sections[0].lines

    // Am7 ở cột 3, D7 ở cột 16
    expect(line.chords.map((anchor) => anchor.charOffset)).toEqual([3, 16])
  })

  it('cột vượt quá độ dài dòng lời thì kẹp về cuối', () => {
    const song = parseSongText('                    Am7\nNgắn')
    const [line] = song.sections[0].lines

    expect(line.chords[0].charOffset).toBe('Ngắn'.length)
  })

  it('dòng hợp âm không có lời phía dưới thì để lời rỗng', () => {
    const song = parseSongText('[Giang tấu]\nAm7   D7\n\n[Điệp khúc]\nGmaj7\nLời')
    const [line] = song.sections[0].lines

    expect(line.lyric).toBe('')
    expect(line.chords).toHaveLength(2)
  })

  it('dòng lời không có hợp âm vẫn được giữ', () => {
    const song = parseSongText('Ánh nắng chiều nay')
    expect(song.sections[0].lines[0].lyric).toBe('Ánh nắng chiều nay')
    expect(song.sections[0].lines[0].chords).toHaveLength(0)
  })
})

describe('định dạng ChordPro', () => {
  const text = '[Phiên khúc]\nÁnh nắng [Am7]chiều nay [D7]rơi xuống phố'

  it('gỡ hợp âm ra khỏi lời', () => {
    const song = parseSongText(text)
    expect(song.sections[0].lines[0].lyric).toBe('Ánh nắng chiều nay rơi xuống phố')
  })

  it('neo hợp âm vào đúng chữ nó đứng trước', () => {
    const song = parseSongText(text)
    const anchors = song.sections[0].lines[0].chords

    expect(anchors[0].charOffset).toBe('Ánh nắng '.length)
    expect(anchors[1].charOffset).toBe('Ánh nắng chiều nay '.length)
  })

  it('tên đoạn trong ngoặc vuông không bị đọc thành hợp âm', () => {
    /*
      Đây là chỗ hai định dạng đụng nhau: tên đoạn và hợp âm ChordPro cùng nằm
      trong ngoặc vuông. Phân biệt bằng việc thử đọc thành hợp âm trước.
    */
    const song = parseSongText(text)
    expect(song.sections).toHaveLength(1)
    expect(song.sections[0].name).toBe('Phiên khúc')
  })

  it('ngoặc vuông không đóng thì giữ nguyên làm lời', () => {
    const song = parseSongText('Ánh nắng [Am7 chiều nay')
    expect(song.sections[0].lines[0].lyric).toContain('[Am7 chiều nay')
  })
})

describe('cụm không đọc được thì cảnh báo chứ không nuốt', () => {
  it('báo tên cụm sai ở định dạng ChordPro', () => {
    // Có ít nhất một hợp âm đọc được thì mới chắc đây là ChordPro
    const song = parseSongText('Lời [Am7]ở [Xyz]đây')

    expect(song.warnings).toHaveLength(1)
    expect(song.warnings[0]).toContain('Xyz')
    expect(song.sections[0].lines[0].chords[1].chord).toBeNull()
  })

  it('ngoặc vuông không phải hợp âm thì không bị coi là ChordPro', () => {
    /*
      Sheet hợp âm hay có ghi chú trong ngoặc vuông như `[x2]` hoặc
      `[Guitar solo]`. Nhận bừa chúng thành hợp âm còn tệ hơn là bỏ qua, nên
      chỉ nhận ChordPro khi có **ít nhất một** cụm đọc được thành hợp âm.
    */
    const song = parseSongText('Ánh nắng chiều nay [x2]')

    expect(song.format).not.toBe('chordpro')
    expect(song.warnings).toEqual([])
  })

  it('vòng hợp âm chỉ gồm những hợp âm đọc được', () => {
    const song = parseSongText('Lời [Am7]ở [Xyz]đây [D7]nhé')
    expect(song.chords.map((chord) => chord.symbol)).toEqual(['Am7', 'D7'])
  })

  it('không có lỗi thì không có cảnh báo nào', () => {
    expect(parseSongText('Lời [Am7]ở đây').warnings).toHaveLength(0)
  })
})

describe('gom hợp âm để nạp vào phần tái hoà âm', () => {
  it('theo đúng thứ tự xuất hiện, xuyên các đoạn', () => {
    const song = parseSongText(
      ['[Phiên khúc]', 'Am7  D7', 'Lời một', '[Điệp khúc]', 'Gmaj7  C7', 'Lời hai'].join('\n'),
    )

    expect(song.chords.map((chord) => chord.symbol)).toEqual([
      'Am7',
      'D7',
      'Gmaj7',
      'C7',
    ])
  })
})

describe('những kiểu text lộn xộn hay gặp', () => {
  it('xuống dòng kiểu Windows vẫn đọc được', () => {
    const song = parseSongText('   Am7\r\nÁnh nắng')
    expect(song.sections[0].lines[0].lyric).toBe('Ánh nắng')
  })

  it('tên đoạn viết kèm dấu hai chấm cũng nhận ra', () => {
    const song = parseSongText('Điệp khúc:\nAm7\nLời')
    expect(song.sections[0].kind).toBe('chorus')
  })

  it('tên đoạn lạ thì giữ nguyên tên, xếp vào loại khác', () => {
    const song = parseSongText('[Đoạn lạ]\nAm7\nLời')

    expect(song.sections[0].name).toBe('Đoạn lạ')
    expect(song.sections[0].kind).toBe('other')
  })

  it('dòng trống bị bỏ qua, không thành dòng lời rỗng', () => {
    const song = parseSongText('Am7\nLời\n\n\nD7\nLời hai')
    expect(song.sections[0].lines).toHaveLength(2)
  })

  it('text rỗng cho bài rỗng, không ném lỗi', () => {
    const song = parseSongText('')

    expect(song.sections).toEqual([])
    expect(song.chords).toEqual([])
    expect(song.warnings).toEqual([])
  })
})

describe('nhân đôi hợp âm', () => {
  it('chèn bản sao ngay sau chỗ chọn', () => {
    const song = parseSongText('C Am F G')
    const copy = song.chords[0]!
    const next = insertChordAfter(song, 0, copy)
    expect(next.chords.map((chord) => chord.symbol)).toEqual([
      'C',
      'C',
      'Am',
      'F',
      'G',
    ])
    const anchors = next.sections[0]!.lines[0]!.chords
    expect(anchors).toHaveLength(5)
    expect(anchors[0]!.source).toBe(anchors[1]!.source)
  })
})
