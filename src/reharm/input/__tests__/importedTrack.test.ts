import { describe, expect, it } from 'vitest'
import {
  parseChordGrid,
  parseSidecarTrack,
  titleFromSource,
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

describe('parseSidecarTrack', () => {
  it('đọc JSON {symbol, beats}', () => {
    expect(
      parseSidecarTrack({
        title: 'Sai Nguoi',
        bpm: 72,
        beatsPerMeasure: 4,
        key: 'G',
        chords: [
          { symbol: 'G', beats: 4 },
          { symbol: 'D', beats: 2 },
        ],
      }),
    ).toEqual({
      title: 'Sai Nguoi',
      bpm: 72,
      beatsPerMeasure: 4,
      key: 'G',
      sourceUrl: undefined,
      chords: [
        { symbol: 'G', beats: 4 },
        { symbol: 'D', beats: 2 },
      ],
    })
  })

  it('đổi {chord, time} ra số phách', () => {
    const track = parseSidecarTrack({
      bpm: 60,
      chords: [
        { chord: 'G', time: 0 },
        { chord: 'D', time: 4 },
      ],
    })
    expect(track?.chords[0]).toEqual({ symbol: 'G', beats: 4 })
    expect(track?.chords[1].symbol).toBe('D')
  })

  it('JSON hỏng thì null', () => {
    expect(parseSidecarTrack({ bpm: 72 })).toBeNull()
    expect(parseSidecarTrack(null)).toBeNull()
  })
})

describe('titleFromSource', () => {
  it('lấy slug từ đường dẫn Chordify', () => {
    expect(
      titleFromSource(
        'https://chordify.net/chords/nguoi-ay-trinh-thang-binh-official-pops-music',
      ),
    ).toBe('Nguoi Ay Trinh Thang Binh Official Pops Music')
  })

  it('file thì bỏ đuôi', () => {
    expect(titleFromSource('nguoi-ay.mp3')).toBe('nguoi-ay')
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
