import { describe, expect, it } from 'vitest'
import { displayedSoloSpan, soloChordAt, type SoloSpan } from '../songStructure'
import { attachInterludeToSheet } from '../../input/songSheet'
import type { SongSheet } from '../../input/songSheet'

/*
  ĐOẠN KHÔNG LỜI PHẢI SÁNG THEO CHỖ ĐANG CHƠI.

  Vì sao cần đường riêng: `segments` chỉ tra ngược về vòng hợp âm GỐC của bài, mà đoạn
  dạo và đoạn kết KHÔNG mượn vòng của đoạn nào — chúng không đẩy `segments` nào cả. Nên
  trước đây ba dải hợp âm dạo · giang · kết chỉ là chữ chết.
*/

const dai = (
  kind: SoloSpan['kind'],
  startBeat: number,
  chords: string[],
  beatsEach: number[],
): SoloSpan => ({
  kind,
  startBeat,
  lengthBeats: beatsEach.reduce((a, b) => a + b, 0),
  chords,
  beatsEach,
})

describe('soloChordAt — hợp âm nào đang vang', () => {
  it('shows the current interlude take including chords beyond the first take length (#1330)', () => {
    const first = dai('interlude', 32, ['Am7', 'D7', 'Gmaj7'], [4, 4, 4])
    const second = dai('interlude', 44, ['Cmaj7', 'Bm7', 'Em7', 'Am7', 'D9sus4', 'D7'], [4, 4, 4, 4, 2, 2])
    const spans = [first, second]
    const active = soloChordAt(spans, 62)!
    const shown = displayedSoloSpan(spans, 'interlude', active.span)!
    expect(active.index).toBe(5)
    expect(shown.chords[active.index]).toBe('D7')
    expect(shown.startBeat + shown.beatsEach.slice(0, active.index).reduce((a, b) => a + b, 0)).toBe(62)
    expect(displayedSoloSpan(spans, 'interlude')).toBe(first)
    expect(displayedSoloSpan(spans, 'outro', second)).toBeNull()
  })
  const spans = [
    dai('intro', 0, ['Dm', 'Gm', 'A7', 'Dm'], [4, 4, 4, 4]),
    dai('interlude', 32, ['F', 'C'], [4, 4]),
    dai('interlude', 40, ['F', 'C'], [4, 4]),
  ]

  it('tra đúng hợp âm theo mốc phách', () => {
    expect(soloChordAt(spans, 0)?.index).toBe(0)
    expect(soloChordAt(spans, 3.9)?.index).toBe(0)
    expect(soloChordAt(spans, 4)?.index).toBe(1)
    expect(soloChordAt(spans, 15.5)?.index).toBe(3)
  })

  it('khoảng im giữa hai đoạn thì không sáng gì', () => {
    /* Chỗ nghỉ sau đoạn dạo nằm NGOÀI `lengthBeats` — xem `arrangement.ts`. */
    expect(soloChordAt(spans, 16)).toBeNull()
    expect(soloChordAt(spans, 31)).toBeNull()
  })

  it('mỗi LƯỢT giang tấu là một dải riêng, sáng lại từ đầu', () => {
    expect(soloChordAt(spans, 32)?.index).toBe(0)
    expect(soloChordAt(spans, 36)?.index).toBe(1)
    /* Lượt hai: sáng lại hợp âm đầu chứ không chạy tiếp số thứ tự. */
    const luotHai = soloChordAt(spans, 40)
    expect(luotHai?.index).toBe(0)
    expect(luotHai?.span.startBeat).toBe(40)
  })

  it('hợp âm chia không hết đoạn thì giữ sáng hợp âm cuối', () => {
    /* Thà sáng sai nửa ô còn hơn tắt giữa chừng rồi người đệm tưởng đã hết đoạn. */
    const thieu = [dai('outro', 0, ['Dm', 'A7'], [4, 2])]
    expect(soloChordAt(thieu, 5.9)?.index).toBe(1)
  })
})

describe('attachInterludeToSheet — dòng hợp âm dưới nhãn giang tấu', () => {
  const sheet: SongSheet = {
    chordCount: 2,
    sections: [
      { name: 'Phiên khúc', kind: 'verse', lines: [{ lyric: 'lời', anchors: [] }] },
      { name: 'Giang tấu', kind: 'interlude', lines: [] },
    ],
  }

  it('gắn vào ĐOẠN giang tấu, không đụng đoạn có lời', () => {
    const ra = attachInterludeToSheet(sheet, ['F', 'C'])
    expect(ra.sections[0]!.lines).toHaveLength(1)
    expect(ra.sections[0]!.lines[0]!.solo).toBeUndefined()
    const dong = ra.sections[1]!.lines[0]!
    expect(dong.solo).toBe('interlude')
    expect(dong.anchors.map((a) => a.symbol)).toEqual(['F', 'C'])
    /* Hợp âm giang tấu không thuộc vòng của thân bài nên không có số thứ tự. */
    expect(dong.anchors.every((a) => a.chordIndex === null)).toBe(true)
  })

  it('gọi hai lần không chồng thành hai dòng', () => {
    const mot = attachInterludeToSheet(sheet, ['F', 'C'])
    const hai = attachInterludeToSheet(mot, ['F', 'C'])
    expect(hai.sections[1]!.lines).toHaveLength(1)
  })

  it('không có hợp âm giang tấu thì trả nguyên bản nhạc', () => {
    expect(attachInterludeToSheet(sheet, [])).toBe(sheet)
  })

  /*
    BẢN NHẠC KHÔNG CÓ ĐOẠN GIANG TẤU vẫn phải hiện được vòng hợp âm.

    Chọn thầy Linh Nhi thì `steps` TỰ chèn một bước giang tấu dù người dùng không đánh
    dấu đoạn nào là giang tấu. Vòng ấy vẫn kêu lúc phát, nên phải có chỗ để nhìn — nếu
    không thì đúng như người dùng báo: "sao dưới điệp khúc vẫn chưa thấy vòng hợp âm".
  */
  const khongCoGiang: SongSheet = {
    chordCount: 2,
    sections: [
      { name: 'Phiên khúc', kind: 'verse', lines: [{ lyric: 'a', anchors: [] }] },
      { name: 'Điệp khúc', kind: 'chorus', lines: [{ lyric: 'b', anchors: [] }] },
      { name: 'Kết bài', kind: 'outro', lines: [] },
    ],
  }

  it('chưa có đoạn giang tấu thì dựng một đoạn, đặt ngay sau đoạn nó mượn', () => {
    const ra = attachInterludeToSheet(khongCoGiang, ['F', 'C'], 'Điệp khúc')
    expect(ra.sections.map((one) => one.name)).toEqual([
      'Phiên khúc',
      'Điệp khúc',
      'Giang tấu',
      'Kết bài',
    ])
    expect(ra.sections[2]!.kind).toBe('interlude')
    expect(ra.sections[2]!.lines[0]!.solo).toBe('interlude')
  })

  it('không tìm ra đoạn nó mượn thì đặt cuối, không giấu đi', () => {
    const ra = attachInterludeToSheet(khongCoGiang, ['F', 'C'], 'Đoạn không có')
    expect(ra.sections.at(-1)!.name).toBe('Giang tấu')
  })
})
