import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../chordInputParser'
import { parseSongText } from '../songTextParser'
import { breathChords, buildSongSheet } from '../songSheet'
import { fillPositions } from '../../fillSoloGenerator/soloGenerator'

/**
 * Chỗ chêm câu fill do **lời bài hát** quyết định, không do một con số đếm đều.
 *
 * `phongcachdemhatkhabu.md` phần 15 định nghĩa câu fill là "những câu nhạc chơi
 * để lấp vào khoảng trống lúc ca sĩ ngắt nghỉ lấy hơi", và bản ký âm
 * `reference/nguoi ay.mxl` xác nhận: 15 dấu lặng trên 28 ô nhịp, rơi đúng vào
 * chỗ hết câu hát chứ không rải đều.
 */

const SONG = `[Phiên khúc]
C           G
Hôm qua anh thấy người ấy
Am          Em
Đang trong tay với cô nào đấy`

const sheetOf = (text: string) => {
  const song = parseSongText(text)
  return { sheet: buildSongSheet(song, song.chords, song.chords) }
}

describe('chỗ ca sĩ lấy hơi', () => {
  it('lấy hợp âm cuối mỗi dòng lời', () => {
    // Khoảng trống nằm ở đuôi dòng: hát hết chữ cuối rồi mới nghỉ
    const { sheet } = sheetOf(SONG)

    expect([...breathChords(sheet)].sort((a, b) => a - b)).toEqual([1, 3])
  })

  it('không lấy hợp âm giữa dòng', () => {
    const { sheet } = sheetOf(SONG)
    const found = breathChords(sheet)

    expect(found.has(0)).toBe(false)
    expect(found.has(2)).toBe(false)
  })

  it('dòng không có lời thì bỏ qua', () => {
    /*
      Dòng chỉ ghi hợp âm thì không có ai hát, nên không có hơi nào để lấy.
    */
    const { sheet } = sheetOf(`[Phiên khúc]
C           G

Am          Em
Đang trong tay với cô nào đấy`)

    expect(breathChords(sheet).has(1)).toBe(false)
  })

  it('bài rỗng thì không có chỗ nào', () => {
    const { sheet } = sheetOf('')

    expect(breathChords(sheet).size).toBe(0)
  })
})

describe('bộ chêm fill bám theo chỗ lấy hơi', () => {
  const chords = parseChordInput('C G Am Em F C Dm G').chords

  it('chỉ chêm vào đúng những chỗ đã chỉ ra', () => {
    const found = fillPositions(chords, {
      density: 'dense',
      breaths: new Set([1, 5]),
    })

    expect(found.map((position) => position.mainIndex)).toEqual([1, 5])
  })

  it('không chêm vào giữa câu hát', () => {
    const found = fillPositions(chords, {
      density: 'dense',
      breaths: new Set([3]),
    })

    for (const position of found) expect(position.mainIndex).toBe(3)
  })

  it('mật độ thưa dần trên danh sách chỗ ngắt, không trên cả vòng', () => {
    /*
      Chêm vào mọi chỗ ca sĩ lấy hơi thì cây đàn nói suốt; còn đếm đều trên
      vòng hợp âm thì lại rơi vào giữa câu hát.
    */
    const all = new Set([1, 3, 5, 7])

    const dense = fillPositions(chords, { density: 'dense', breaths: all })
    const sparse = fillPositions(chords, { density: 'sparse', breaths: all })

    expect(sparse.length).toBeLessThan(dense.length)
    for (const position of sparse) expect(all.has(position.mainIndex)).toBe(true)
  })

  it('người dùng tắt chỗ nào thì chỗ đó biến mất', () => {
    const found = fillPositions(chords, {
      density: 'dense',
      breaths: new Set([1, 5]),
      skip: new Set([1]),
    })

    expect(found.map((position) => position.mainIndex)).toEqual([5])
  })

  it('không có lời thì lùi về cách đếm đều như cũ', () => {
    // Luồng gõ vòng hợp âm trơn không có ai hát để mà biết họ nghỉ ở đâu
    const withoutLyrics = fillPositions(chords, { density: 'dense' })

    expect(withoutLyrics.length).toBeGreaterThan(0)
  })
})
