import { describe, expect, it } from 'vitest'
import {
  addChordPair,
  beatsOf,
  chordDurations,
  chordIndexAt,
  chordStarts,
  isPaired,
  mainChordSpans,
  pairedChordBeats,
  removeChordPair,
  splitBeats,
  totalBeatsOf,
} from '../chordTiming'
import { parseChordInput } from '../input/chordInputParser'
import {
  generateFillLine,
  generateSolo,
} from '../fillSoloGenerator/soloGenerator'
import {
  applySuggestions,
  suggestPassingChords,
} from '../reharmEngine/passingChordRules'
import { reharmonize } from '../reharmEngine/reharmPipeline'

const chords = (text: string) => parseChordInput(text).chords

describe('thời lượng từng hợp âm', () => {
  it('hợp âm không ghi thời lượng thì lấy nhịp chung của vòng', () => {
    const [chord] = chords('C')
    expect(beatsOf(chord, 4)).toBe(4)
    expect(beatsOf({ ...chord, beats: 2 }, 4)).toBe(2)
  })

  it('mốc bắt đầu tính dồn theo thời lượng thật', () => {
    const list = chords('C Am F')
    list[0].beats = 2
    list[1].beats = 2

    expect(chordStarts(list, 4)).toEqual([0, 2, 4])
    expect(chordDurations(list, 4)).toEqual([2, 2, 4])
    expect(totalBeatsOf(list, 4)).toBe(8)
  })

  it('tra được hợp âm đang vang tại một thời điểm', () => {
    const list = chords('C Am F')
    list[0].beats = 2
    list[1].beats = 2

    expect(chordIndexAt(list, 4, 0)).toBe(0)
    expect(chordIndexAt(list, 4, 1.9)).toBe(0)
    expect(chordIndexAt(list, 4, 2)).toBe(1)
    expect(chordIndexAt(list, 4, 5)).toBe(2)
  })
})

describe('chia đôi ô nhịp cho hợp âm lướt', () => {
  /*
    Theo `phongcachdemhatkhabu.md` mục 14.2: hợp âm chủ giữ nửa đầu ô nhịp,
    các hợp âm lướt chia nhau nửa sau.
  */
  it('hợp âm chủ giữ nửa đầu, hai hợp âm lướt chia nửa sau', () => {
    expect(splitBeats(4, 2)).toEqual({ host: 2, passing: [1, 1] })
  })

  it('một hợp âm lướt thì lấy trọn nửa sau', () => {
    expect(splitBeats(4, 1)).toEqual({ host: 2, passing: [2] })
  })

  it('không có hợp âm lướt thì giữ nguyên', () => {
    expect(splitBeats(4, 0)).toEqual({ host: 4, passing: [] })
  })

  it('ô nhịp quá chật thì chia đều cho tất cả, không cố giữ nửa đầu', () => {
    // Nửa sau của 2 phách chia cho 2 hợp âm chỉ còn nửa phách mỗi cái
    expect(splitBeats(2, 2)).toEqual({
      host: 2 / 3,
      passing: [2 / 3, 2 / 3],
    })
  })
})

describe('chèn hợp âm lướt không làm dài thêm vòng', () => {
  /*
    Đây là lỗi được người dùng chỉ ra: vòng `C Am F G` bốn ô nhịp, sau khi chèn
    ba vòng hai-năm lướt, phình thành mười ô nhịp — phá cả cấu trúc bài.
  */
  const list = chords('C Am F G')
  const iiV = suggestPassingChords(list, {}).filter(
    (suggestion) => suggestion.technique === 'secondary-ii-V',
  )

  it('tổng độ dài vòng giữ nguyên', () => {
    const before = totalBeatsOf(list, 4)
    const after = totalBeatsOf(applySuggestions(list, iiV, 4), 4)

    expect(before).toBe(16)
    expect(after).toBe(16)
  })

  it('có thêm hợp âm nhưng vòng vẫn bốn ô nhịp', () => {
    const after = applySuggestions(list, iiV, 4)

    expect(after.length).toBeGreaterThan(list.length)
    expect(totalBeatsOf(after, 4) / 4).toBe(4)
  })

  it('hợp âm lướt ngắn hơn hợp âm chính', () => {
    const after = applySuggestions(list, iiV, 4)
    const inserted = after.filter((chord) => chord.beats !== undefined)

    expect(inserted.length).toBeGreaterThan(0)
    for (const chord of inserted) {
      expect(beatsOf(chord, 4)).toBeLessThanOrEqual(2)
    }
  })

  it('hợp âm đích vẫn rơi đúng đầu ô nhịp', () => {
    const after = applySuggestions(list, iiV, 4)
    const starts = chordStarts(after, 4)

    // Các hợp âm gốc phải nằm ở phách 0, 4, 8, 12
    const originalStarts = after
      .map((chord, index) => ({ chord, start: starts[index] }))
      .filter((entry) => entry.chord.beats === undefined)
      .map((entry) => entry.start)

    for (const start of originalStarts) expect(start % 4).toBe(0)
  })

  it('không chấp nhận gợi ý nào thì vòng y nguyên', () => {
    expect(applySuggestions(list, [], 4)).toEqual(list)
  })
})

describe('hai hợp âm chia nhau một ô nhịp', () => {
  /*
    Chia đôi phải làm theo **cặp**. Ô nhịp là đơn vị cố định của bài: thêm một
    hợp âm vào ô thì hai hợp âm chia nhau thời gian của ô đó, còn **số ô nhịp
    không đổi**. Đây đúng là điều tra cứu về harmonic rhythm nói: nhịp hoà âm
    là tốc độ đổi hợp âm, không phải độ dài bài.
  */
  const list = chords('C Am F G')

  it('cặp chia đôi thì mỗi bên nửa ô nhịp', () => {
    const table = pairedChordBeats([0], 4, 4)
    expect(table).toEqual({ 0: 2, 1: 2 })
  })

  it('KHÔNG CÒN Ô NHỊP LẺ DỞ', () => {
    /*
      Đây là bất biến quan trọng nhất của cả tính năng, và là lý do phải chia
      theo cặp. Cắt lẻ một hợp âm còn nửa ô thì bài dôi ra nửa ô — hát tới đó
      là hụt nhịp. Ghép cặp thì hai hợp âm lấp trọn một ô, bài ngắn đi đúng
      **một ô nguyên**.
    */
    const paired = reharmonize(list, {
      beatsPerChord: 4,
      chordBeats: pairedChordBeats([0], 4, 4),
    })

    const total = totalBeatsOf(paired.harmonic, 4)
    expect(total % 4).toBe(0)
    expect(total / 4).toBe(3)
  })

  it('cắt lẻ một hợp âm mới là thứ để lại ô nhịp dở', () => {
    // Giữ lại để thấy rõ vì sao phải chia theo cặp
    const lopsided = reharmonize(list, {
      beatsPerChord: 4,
      chordBeats: { 0: 2 },
    })

    expect(totalBeatsOf(lopsided.harmonic, 4) % 4).not.toBe(0)
  })

  it('mọi hợp âm đều bắt đầu đúng phách, không cái nào vắt qua vạch nhịp', () => {
    const paired = reharmonize(list, {
      beatsPerChord: 4,
      chordBeats: pairedChordBeats([0, 2], 4, 4),
    })

    const starts = chordStarts(paired.harmonic, 4)
    const durations = chordDurations(paired.harmonic, 4)

    for (let index = 0; index < starts.length; index += 1) {
      const from = starts[index]
      const to = from + durations[index]
      // Không hợp âm nào được bắt đầu ở ô này mà kết thúc ở ô sau
      expect(Math.floor(from / 4)).toBe(Math.floor((to - 0.001) / 4))
    }
  })

  it('chia nhiều cặp thì mỗi ô vẫn đủ hai hợp âm', () => {
    const paired = reharmonize(list, {
      beatsPerChord: 4,
      chordBeats: pairedChordBeats([0, 2], 4, 4),
    })

    expect(chordDurations(paired.harmonic, 4)).toEqual([2, 2, 2, 2])
    expect(totalBeatsOf(paired.harmonic, 4) % 4).toBe(0)
  })

  it('hợp âm cuối không ghép được vì không có hợp âm nào phía sau', () => {
    expect(pairedChordBeats([3], 4, 4)).toEqual({})
  })

  it('không chỉ định gì thì mọi hợp âm chơi đủ nhịp', () => {
    const reharm = reharmonize(list, { beatsPerChord: 4 })
    expect(chordDurations(reharm.harmonic, 4)).toEqual([4, 4, 4, 4])
  })
})

describe('quản lý các cặp chia đôi', () => {
  /*
    Hai cặp không được chồng nhau: một hợp âm không thể vừa là nửa sau của ô
    này vừa là nửa đầu của ô kia.
  */
  const list = chords('C Am F G')

  it('ghép cặp mới thì gỡ cặp chồng lên nó', () => {
    expect([...addChordPair(new Set([0]), 1)]).toEqual([1])
    expect([...addChordPair(new Set([2]), 1)]).toEqual([1])
  })

  it('cặp không chồng nhau thì giữ nguyên cả hai', () => {
    expect([...addChordPair(new Set([0]), 2)].sort()).toEqual([0, 2])
  })

  it('gỡ được cặp dù bấm vào nửa đầu hay nửa sau', () => {
    expect([...removeChordPair(new Set([0]), 0)]).toEqual([])
    expect([...removeChordPair(new Set([0]), 1)]).toEqual([])
  })

  it('nhận ra hợp âm đang trong cặp, ở cả hai vị trí', () => {
    const pairs = new Set([2])

    expect(isPaired(pairs, 2)).toBe(true)
    expect(isPaired(pairs, 3)).toBe(true)
    expect(isPaired(pairs, 1)).toBe(false)
    expect(isPaired(pairs, 4)).toBe(false)
  })

  it('hợp âm lướt mượn nửa của phần còn lại, không mượn của cả ô', () => {
    /*
      Thứ tự áp quan trọng: hợp âm chủ bị chia đôi rồi thì hợp âm lướt phải
      tính trên hai phách còn lại, không phải trên bốn phách ban đầu.
    */
    const first = reharmonize(list, { beatsPerChord: 4 })
    const iiV = first.passingSuggestions.filter(
      (suggestion) => suggestion.technique === 'secondary-ii-V',
    )

    const reharm = reharmonize(list, {
      beatsPerChord: 4,
      chordBeats: { 0: 2 },
      acceptedPassing: iiV.filter((s) => s.insertBeforeIndex === 1),
    })

    // Hợp âm chủ hai phách, chia đôi cho hai hợp âm lướt thì mỗi cái nửa phách
    const durations = chordDurations(reharm.harmonic, 4)
    expect(durations[0]).toBeLessThanOrEqual(2)
    expect(totalBeatsOf(reharm.harmonic, 4)).toBe(14)
  })
})

describe('tra mốc phách của hợp âm chính', () => {
  /*
    Dùng cho việc bấm vào một hợp âm trên bản nhạc rồi phát lại từ đúng chỗ đó.
    Bản nhạc đánh số theo vòng **chính**, còn dòng thời gian chạy trên vòng đã
    chèn hợp âm lướt, nên phải đếm qua các hợp âm lướt để tìm đúng mốc.
  */
  const plain = chords('C Am F G')
  const iiV = suggestPassingChords(plain, {}).filter(
    (suggestion) => suggestion.technique === 'secondary-ii-V',
  )
  const split = applySuggestions(plain, iiV, 4)

  it('mốc của hợp âm chính không bị hợp âm lướt làm lệch', () => {
    const starts = mainChordSpans(split, 4).map((span) => span.start)
    expect(starts).toEqual([0, 4, 8, 12])
  })

  it('vòng chưa chèn gì thì mốc vẫn y như vậy', () => {
    const starts = mainChordSpans(plain, 4).map((span) => span.start)
    expect(starts).toEqual([0, 4, 8, 12])
  })

  it('số thứ tự vượt quá số hợp âm thì không có mốc', () => {
    expect(mainChordSpans(split, 4)[99]).toBeUndefined()
  })
})

describe('chia đôi ô nhịp không làm lệch nhịp giai điệu', () => {
  const plain = chords('C Am F G Em Dm G7 C')
  const iiV = suggestPassingChords(plain, {}).filter(
    (suggestion) => suggestion.technique === 'secondary-ii-V',
  )
  const split = applySuggestions(plain, [iiV[0]], 4)

  const soloOptions = {
    beatsPerChord: 4,
    key: { tonic: 0 as const, scale: 'major' as const },
    chordsPerPhrase: 2,
  }

  it('câu solo chia câu theo phách, không theo số hợp âm', () => {
    /*
      Chia theo số hợp âm thì một câu gồm hai hợp âm lướt chỉ còn hai phách
      thay vì tám, nên chỗ nghỉ lấy hơi rơi lung tung — nghe ra là lệch nhịp.
    */
    const solo = generateSolo(split, soloOptions)
    const phraseBeats = 8

    // Mỗi câu tám phách phải có đúng một khoảng nghỉ đáng kể ở cuối
    const gaps: number[] = []
    for (let index = 1; index < solo.length; index += 1) {
      const previous = solo[index - 1]
      const gap = solo[index].startBeat - (previous.startBeat + previous.durationBeats)
      if (gap > 0.5) gaps.push(previous.startBeat + previous.durationBeats)
    }

    expect(gaps.length).toBeGreaterThan(0)
    // Chỗ nghỉ phải nằm gần cuối một câu, không rơi vào giữa câu
    for (const at of gaps) {
      const intoPhrase = at % phraseBeats
      expect(intoPhrase).toBeGreaterThan(phraseBeats / 2)
    }
  })

  it('mọi nốt solo nằm trong độ dài thật của vòng', () => {
    const solo = generateSolo(split, soloOptions)
    const total = totalBeatsOf(split, 4)

    for (const note of solo) {
      expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(
        total + 0.001,
      )
    }
  })

  it('câu fill chỉ chêm vào ô nhịp chưa bị chia đôi', () => {
    // Nửa sau ô nhịp đã chia là chỗ của hợp âm lướt, không còn trống cho fill
    const fills = generateFillLine(split, { ...soloOptions, density: 'dense' })
    const starts = chordStarts(split, 4)

    for (const note of fills) {
      const index = split.findIndex(
        (_, position) =>
          note.startBeat >= starts[position] &&
          note.startBeat <
            starts[position] + beatsOf(split[position], 4) + 0.001,
      )
      expect(split[index].beats).toBeUndefined()
    }
  })

  it('vòng chưa chia thì câu fill vẫn chêm như cũ', () => {
    const fills = generateFillLine(plain, { ...soloOptions, density: 'dense' })
    expect(fills.length).toBeGreaterThan(0)
  })
})
