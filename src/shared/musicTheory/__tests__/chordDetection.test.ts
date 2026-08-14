import { describe, expect, it } from 'vitest'
import {
  MIN_NOTES_FOR_DETECTION,
  detectChord,
  detectChords,
  formatChordSymbol,
} from '../chordDetection'
import { getChordQuality } from '../chordDefinitions'
import { nameToMidi } from '../pitch'

/** Dựng tập nốt MIDI từ danh sách tên nốt, để test đọc cho dễ. */
function notes(...names: string[]): number[] {
  return names.map((name) => {
    const note = nameToMidi(name)
    if (note === null) throw new Error(`Tên nốt sai: '${name}'`)
    return note
  })
}

/** Tên hợp âm đoán ra tốt nhất. */
function topSymbol(...names: string[]): string | null {
  return detectChord(notes(...names))?.symbol ?? null
}

describe('không đủ dữ liệu để đoán', () => {
  it('không bấm nốt nào thì không có ứng viên', () => {
    expect(detectChords([])).toEqual([])
  })

  it('ít hơn ba lớp cao độ thì chưa đoán', () => {
    expect(detectChords(notes('C4'))).toEqual([])
    expect(detectChords(notes('C4', 'E4'))).toEqual([])
    expect(MIN_NOTES_FOR_DETECTION).toBe(3)
  })

  it('cùng một nốt ở nhiều quãng tám vẫn chỉ tính là một', () => {
    // C3 C4 C5 chỉ là một lớp cao độ, chưa đủ để đoán
    expect(detectChords(notes('C3', 'C4', 'C5'))).toEqual([])
  })
})

describe('hợp âm ba cơ bản', () => {
  it('nhận ra hợp âm trưởng', () => {
    expect(topSymbol('C4', 'E4', 'G4')).toBe('C')
    expect(topSymbol('F4', 'A4', 'C5')).toBe('F')
  })

  it('nhận ra hợp âm thứ', () => {
    expect(topSymbol('A3', 'C4', 'E4')).toBe('Am')
    expect(topSymbol('D4', 'F4', 'A4')).toBe('Dm')
  })

  it('nhận ra hợp âm giảm và hợp âm tăng', () => {
    expect(topSymbol('B3', 'D4', 'F4')).toBe('Bdim')
    expect(topSymbol('C4', 'E4', 'G#4')).toBe('Caug')
  })

  it('nhận ra hợp âm treo', () => {
    expect(topSymbol('C4', 'F4', 'G4')).toBe('Csus4')
    expect(topSymbol('C4', 'D4', 'G4')).toBe('Csus2')
  })
})

describe('hợp âm bảy và hợp âm mở rộng', () => {
  it('nhận ra bảy trưởng, bảy át và bảy thứ', () => {
    expect(topSymbol('C4', 'E4', 'G4', 'B4')).toBe('Cmaj7')
    expect(topSymbol('C4', 'E4', 'G4', 'A#4')).toBe('C7')
    expect(topSymbol('A3', 'C4', 'E4', 'G4')).toBe('Am7')
  })

  it('nhận ra nửa giảm và bảy giảm', () => {
    expect(topSymbol('B3', 'D4', 'F4', 'A4')).toBe('Bm7b5')
    expect(topSymbol('B3', 'D4', 'F4', 'G#4')).toBe('Bdim7')
  })

  it('nhận ra các hợp âm mở rộng mà phong cách này hay dùng', () => {
    // D9sus4 = D G A C E
    expect(topSymbol('D4', 'G4', 'A4', 'C5', 'E5')).toBe('D9sus4')
    // Am11 = A C E G B D
    expect(topSymbol('A3', 'C4', 'E4', 'G4', 'B4', 'D5')).toBe('Am11')
  })

  it('nhận ra hợp âm chín', () => {
    expect(topSymbol('C4', 'E4', 'G4', 'B4', 'D5')).toBe('Cmaj9')
    expect(topSymbol('C4', 'E4', 'G4', 'A#4', 'D5')).toBe('C9')
  })
})

describe('ưu tiên cách đọc đơn giản', () => {
  it('ba nốt đô mi sol đọc là đô trưởng, không phải hợp âm bảy thiếu nốt', () => {
    const [best] = detectChords(notes('C4', 'E4', 'G4'))
    expect(best.quality.id).toBe('maj')
    expect(best.missingNotes).toEqual([])
    expect(best.extraNotes).toEqual([])
  })

  it('khớp trọn vẹn luôn xếp trên khớp thiếu nốt', () => {
    const results = detectChords(notes('C4', 'E4', 'G4'), { maxResults: 10 })
    const exact = results.filter((match) => match.missingNotes.length === 0)
    const partial = results.filter((match) => match.missingNotes.length > 0)

    for (const good of exact) {
      for (const worse of partial) {
        expect(good.score).toBeGreaterThan(worse.score)
      }
    }
  })
})

describe('nốt bass quyết định cách đọc khi có nhiều cách cùng đúng', () => {
  // {C E G A} vừa là C6 vừa là Am7 — chỉ nốt dưới cùng phân định.
  it('bass là đô thì đọc là C6', () => {
    expect(topSymbol('C4', 'E4', 'G4', 'A4')).toBe('C6')
  })

  it('bass là la thì đọc là Am7', () => {
    expect(topSymbol('A3', 'C4', 'E4', 'G4')).toBe('Am7')
  })
})

describe('thế đảo', () => {
  it('nhận ra thế nguyên vị', () => {
    const match = detectChord(notes('C4', 'E4', 'G4'))
    expect(match?.inversion).toBe(0)
    expect(match?.symbol).toBe('C')
  })

  it('nhận ra thế đảo 1 và ghi theo kiểu gạch chéo', () => {
    const match = detectChord(notes('E4', 'G4', 'C5'))
    expect(match?.root).toBe(0)
    expect(match?.inversion).toBe(1)
    expect(match?.symbol).toBe('C/E')
  })

  it('nhận ra thế đảo 2', () => {
    const match = detectChord(notes('G3', 'C4', 'E4'))
    expect(match?.inversion).toBe(2)
    expect(match?.symbol).toBe('C/G')
  })

  it('thế nguyên vị được ưu tiên hơn thế đảo khi các mặt khác ngang nhau', () => {
    const rootPosition = detectChord(notes('C4', 'E4', 'G4'))!
    const inverted = detectChord(notes('E4', 'G4', 'C5'))!
    expect(rootPosition.score).toBeGreaterThan(inverted.score)
  })
})

describe('thế bấm rút gọn và nốt thừa', () => {
  it('vẫn đoán được khi bỏ bớt nốt, nhưng ghi rõ nốt còn thiếu', () => {
    // Cmaj9 bỏ nốt sol — kiểu thế bấm rút gọn quen thuộc trong jazz
    const match = detectChord(notes('C4', 'E4', 'B4', 'D5'))
    expect(match?.root).toBe(0)
    expect(match?.missingNotes.length).toBeGreaterThan(0)
  })

  it('nốt lạ bị phạt nặng nên độ tin cậy tụt xuống', () => {
    const clean = detectChord(notes('C4', 'E4', 'G4'))!
    const withWrongNote = detectChord(notes('C4', 'E4', 'G4', 'C#5'))!
    expect(withWrongNote.confidence).toBeLessThan(clean.confidence)
  })

  it('nốt tưởng là lạ nhưng lại thuộc một hợp âm biến âm thì vẫn đọc ra', () => {
    // {C E G Db} chính là C7b9 bỏ nốt bảy — không phải nốt sai.
    const match = detectChord(notes('C4', 'E4', 'G4', 'C#5'))!
    expect(match.quality.id).toBe('7b9')
    expect(match.extraNotes).toEqual([])
  })

  it('chùm nốt liền bậc thì buộc phải có nốt lạ', () => {
    const cluster = notes('C4', 'C#4', 'D4', 'D#4', 'E4')
    const match = detectChord(cluster)!
    expect(match.extraNotes.length).toBeGreaterThan(0)
  })

  it('nốt lạ đúng bằng phần nốt đã bấm mà hợp âm không có', () => {
    const results = detectChords(notes('C4', 'C#4', 'D4', 'D#4', 'E4'), {
      maxResults: 10,
    })
    const playedClasses = new Set([0, 1, 2, 3, 4])

    for (const match of results) {
      const chordClasses = new Set(
        match.quality.intervals.map((interval) => (match.root + interval) % 12),
      )
      const expected = [...playedClasses]
        .filter((pitchClass) => !chordClasses.has(pitchClass))
        .sort((a, b) => a - b)

      expect(match.extraNotes).toEqual(expected)
    }
  })
})

describe('độ tin cậy', () => {
  it('khớp hoàn hảo ở thế nguyên vị cho độ tin cậy tối đa', () => {
    expect(detectChord(notes('C4', 'E4', 'G4'))?.confidence).toBe(1)
  })

  it('luôn nằm trong khoảng 0 tới 1', () => {
    const results = detectChords(notes('C4', 'C#4', 'D4', 'D#4'), {
      maxResults: 20,
    })
    for (const match of results) {
      expect(match.confidence).toBeGreaterThanOrEqual(0)
      expect(match.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('lọc được ứng viên yếu bằng ngưỡng tin cậy', () => {
    const all = detectChords(notes('C4', 'E4', 'G4'), { maxResults: 20 })
    const strong = detectChords(notes('C4', 'E4', 'G4'), {
      maxResults: 20,
      minConfidence: 0.9,
    })
    expect(strong.length).toBeLessThan(all.length)
    for (const match of strong) {
      expect(match.confidence).toBeGreaterThanOrEqual(0.9)
    }
  })
})

describe('xếp hạng', () => {
  it('kết quả luôn xếp theo điểm giảm dần', () => {
    const results = detectChords(notes('C4', 'E4', 'G4', 'B4'), {
      maxResults: 10,
    })
    for (let index = 1; index < results.length; index += 1) {
      expect(results[index - 1].score).toBeGreaterThanOrEqual(
        results[index].score,
      )
    }
  })

  it('tôn trọng số lượng kết quả tối đa', () => {
    expect(detectChords(notes('C4', 'E4', 'G4'), { maxResults: 3 })).toHaveLength(
      3,
    )
  })
})

describe('cách ghi dấu hoá', () => {
  it('mặc định dùng dấu thăng', () => {
    expect(topSymbol('F#3', 'A#3', 'C#4')).toBe('F#')
  })

  it('ghi được bằng dấu giáng', () => {
    const match = detectChord(notes('F#3', 'A#3', 'C#4'), {
      accidentalStyle: 'flat',
    })
    expect(match?.symbol).toBe('Gb')
  })
})

describe('formatChordSymbol', () => {
  const maj = getChordQuality('maj')!
  const m7 = getChordQuality('m7')!

  it('bỏ hậu tố với hợp âm ba trưởng', () => {
    expect(formatChordSymbol(0, maj)).toBe('C')
  })

  it('ghép hậu tố cho các tính chất khác', () => {
    expect(formatChordSymbol(9, m7)).toBe('Am7')
  })

  it('ghi kiểu gạch chéo khi bass khác nốt gốc', () => {
    expect(formatChordSymbol(0, maj, 4)).toBe('C/E')
  })

  it('không ghi gạch chéo khi bass trùng nốt gốc', () => {
    expect(formatChordSymbol(0, maj, 12)).toBe('C')
  })
})

describe('nhận diện ổn định khi dịch giọng', () => {
  it('cùng một thế bấm dịch lên mọi giọng đều ra đúng tính chất', () => {
    for (let offset = 0; offset < 12; offset += 1) {
      const match = detectChord([60 + offset, 64 + offset, 67 + offset])
      expect(match?.quality.id).toBe('maj')
      expect(match?.root).toBe(offset % 12)
    }
  })
})
