import { describe, expect, it } from 'vitest'
import {
  expandToBeats,
  parseChordGrid,
  trackToBeatTable,
  trackToSongText,
} from '../importedTrack'

describe('parseChordGrid', () => {
  it('mỗi cụm không vạch là một ô nhịp', () => {
    expect(parseChordGrid('C Am F G')).toEqual([
      { symbol: 'C', beats: 4 },
      { symbol: 'Am', beats: 4 },
      { symbol: 'F', beats: 4 },
      { symbol: 'G', beats: 4 },
    ])
  })

  it('trong một ô vạch, nhiều hợp âm chia đều ô', () => {
    expect(parseChordGrid('| C Am | F | G |')).toEqual([
      { symbol: 'C', beats: 2 },
      { symbol: 'Am', beats: 2 },
      { symbol: 'F', beats: 4 },
      { symbol: 'G', beats: 4 },
    ])
  })

  it('% lặp hợp âm trước, N.C. bỏ qua', () => {
    expect(parseChordGrid('| C | % | N.C. | G |').map((entry) => entry.symbol)).toEqual(
      ['C', 'C', 'G'],
    )
  })

  it('nhịp 3/4 thì mỗi ô 3 phách', () => {
    expect(parseChordGrid('C G', 3)).toEqual([
      { symbol: 'C', beats: 3 },
      { symbol: 'G', beats: 3 },
    ])
  })
})

describe('đổ sang vòng KeyTrain', () => {
  const track = {
    title: 'Người Ấy',
    bpm: 72,
    beatsPerMeasure: 4 as const,
    chords: parseChordGrid('| C Am | F | G |'),
  }

  it('chuỗi hợp âm đưa vào parseSongText', () => {
    expect(trackToSongText(track)).toBe('C Am F G')
  })

  it('bảng phách khớp số thứ tự', () => {
    expect(trackToBeatTable(track)).toEqual({ 0: 2, 1: 2, 2: 4, 3: 4 })
  })
})

describe('bung hợp âm ra từng phách', () => {
  it('hợp âm không ghi số phách thì lấy số phách mặc định', () => {
    expect(expandToBeats([{ symbol: 'Cadd2', beats: 2 }, { symbol: 'G' }], 4)).toEqual(
      ['Cadd2', 'Cadd2', 'G', 'G', 'G', 'G'],
    )
  })
})
