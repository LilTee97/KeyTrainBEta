import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { brainFill } from '../fillFromBrain'
import { brainPhrase } from '../phrase'
import { brainPassingSuggestions } from '../passing'
import { walkingBassLine } from '../walkingBass'
import { itemMaySound, maySound, teachersOf } from '../gate'
import { GENERIC_BADGE, KEYTRAIN_BADGE, teacherBadge } from '../badge'
import { brain } from '../index'

const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }
const chordsOf = (text: string) => parseChordInput(text).chords

describe('1. đàn không đè lên giọng hát', () => {
  it('ca sĩ hát kín cả bài thì tay phải không lót câu nào', () => {
    const notes = generateFillLine(chordsOf('C Am F G'), {
      beatsPerChord: 4,
      density: 'dense',
      key: C_MAJOR,
      vocal: 'full',
    })
    expect(notes).toEqual([])
  })

  it('hát kín thì cả chỗ chuyển đoạn cũng im', () => {
    const notes = generateFillLine(chordsOf('C Am F G'), {
      beatsPerChord: 4,
      density: 'dense',
      key: C_MAJOR,
      vocal: 'full',
      sectionEnds: new Map([[3, { restBeats: 0, octaves: 1 }]]),
    })
    expect(notes).toEqual([])
  })

  it('ô nào giọng đang vang thì bỏ ô đó, ô nghỉ vẫn lót', () => {
    const args = {
      beatsPerChord: 4,
      density: 'dense' as const,
      key: C_MAJOR,
      breaths: new Set([0, 2]),
    }
    const all = generateFillLine(chordsOf('C Am F G'), args)
    const some = generateFillLine(chordsOf('C Am F G'), {
      ...args,
      vocal: new Set([0]),
    })
    expect(all.length).toBeGreaterThan(0)
    expect(some.length).toBeGreaterThan(0)
    expect(some.length).toBeLessThan(all.length)
    // Ô 0 đang hát: không nốt nào rơi vào bốn phách đầu.
    expect(some.every((note) => note.startBeat >= 4)).toBe(true)
  })

  it('chưa dán lời thì giữ nguyên cách cũ, không im thêm', () => {
    const args = { beatsPerChord: 4, density: 'dense' as const, key: C_MAJOR }
    expect(generateFillLine(chordsOf('C Am F G'), args).length).toBe(
      generateFillLine(chordsOf('C Am F G'), { ...args, vocal: undefined }).length,
    )
  })
})

describe('2. walking bass 1-2-3-5 của Pianote', () => {
  it('hợp âm trưởng đi C-D-E-G, hợp âm thứ đi A-B-C-E', () => {
    const walk = walkingBassLine({
      chords: chordsOf('C Am'),
      beatsPerChord: 4,
    })
    expect(walk).not.toBeNull()
    const midis = walk!.events.map((event) => event.notes[0])
    // Chỉ khác nhau ở bậc 3: trưởng lấy 4 nửa cung, thứ lấy 3.
    expect(midis.slice(0, 4).map((m) => m - midis[0])).toEqual([0, 2, 4, 7])
    expect(midis.slice(4, 8).map((m) => m - midis[4])).toEqual([0, 2, 3, 7])
  })

  it('bốn nốt đen đều nhau, tất cả ở tay trái', () => {
    const walk = walkingBassLine({ chords: chordsOf('C'), beatsPerChord: 4 })!
    expect(walk.events.map((e) => e.startBeat)).toEqual([0, 1, 2, 3])
    expect(walk.events.every((e) => e.hand === 'left')).toBe(true)
  })

  it('ô bị chia ngắn thì bỏ qua, không nhồi nốt kép', () => {
    const walk = walkingBassLine({
      chords: chordsOf('C Am'),
      beatsPerChord: 4,
      beatsEach: [1, 4],
    })!
    expect(walk.events.every((e) => e.startBeat >= 1)).toBe(true)
  })

  it('mang tên Pianote, không nhận vơ sang thầy khác', () => {
    expect(walkingBassLine({ chords: chordsOf('C'), beatsPerChord: 4 })!.teachers).toEqual([
      'pianote',
    ])
  })

  it('kho không cho phép thì trả null, tay trái cũ giữ nguyên', () => {
    expect(
      walkingBassLine({ chords: chordsOf('C'), beatsPerChord: 4, mode: 'validated' }),
    ).toBeNull()
  })
})

describe('3. huy hiệu thầy', () => {
  it('đề xuất của não mang tên thầy đứng sau nó', () => {
    const out = brainPassingSuggestions({ chords: chordsOf('C F Am G'), key: C_MAJOR })
    const intoAm = out.find((s) => s.insertBeforeIndex === 2)!
    expect(teacherBadge(intoAm.authorizedBy)).toBe('Thầy Hải')
  })

  it('luật của chính app thì ghi KeyTrain, không mượn tên thầy', () => {
    expect(teacherBadge(undefined)).toBe(KEYTRAIN_BADGE)
  })

  it('não nói nhưng không thầy nào đứng sau thì ghi là suy luận chung', () => {
    const seed = brain().items.find((item) => item.origin !== 'extracted')
    expect(seed, 'kho phải có ít nhất một item không phải extracted').toBeTruthy()
    expect(teacherBadge([seed!.id])).toBe(GENERIC_BADGE)
    expect(teachersOf([seed!.id])).toEqual([])
  })
})

describe('4. mặc định chỉ nốt extracted mới thành tiếng', () => {
  it('item invented hoặc derived không qua được cửa', () => {
    const kb = brain()
    const invented = kb.items.filter((item) => item.origin !== 'extracted')
    expect(invented.length).toBeGreaterThan(0)
    for (const item of invented) {
      expect(itemMaySound(item), item.id).toBe(false)
      expect(maySound([item.id]), item.id).toBe(false)
    }
  })

  it('không có ai đứng sau cũng là không được phát', () => {
    expect(maySound([])).toBe(false)
    expect(maySound(['không-có-item-nào'])).toBe(false)
  })

  it('siết xuống validated thì câu lót Kingsley tắt tiếng', () => {
    const chords = chordsOf('C Am')
    const args = { chord: chords[0], next: chords[1], chordStartBeat: 0, key: C_MAJOR }
    // Mặc định: có tiếng, vì luật Kingsley là extracted.
    expect(brainFill(args)).not.toBeNull()
    /*
      Siết thêm một nấc thì im — cả 11 item Kingsley trong kho đang là
      `extracted` + `draft`, chưa ai rà lại. Đây là bằng chứng cho chỗ đã báo
      lại với người dùng, không phải lỗi.
    */
    expect(brainFill({ ...args, mode: 'validated' })).toBeNull()
    expect(brainPhrase({ kind: 'intro', key: C_MAJOR, mode: 'validated' })).toBeNull()
  })

  it('hợp âm lướt 7b9 vẫn qua cả hai mức, vì item của thầy Hải đã rà', () => {
    for (const mode of ['extracted', 'validated'] as const) {
      const out = brainPassingSuggestions({ chords: chordsOf('C F Am G'), key: C_MAJOR, mode })
      expect(out.length, mode).toBeGreaterThan(0)
    }
  })
})
