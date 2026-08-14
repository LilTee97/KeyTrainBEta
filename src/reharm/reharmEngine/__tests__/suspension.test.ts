import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { renderPattern } from '../../style/patternRenderer'
import { BALLAD, VALSE } from '../../style/styleLibrary'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { reharmonize } from '../reharmPipeline'

function chords(input: string) {
  return parseChordInput(input).chords
}

describe('gắn nốt treo cho hợp âm', () => {
  it('mặc định không gắn', () => {
    const result = reharmonize(chords('C Am F G'))
    for (const chord of result.colored) {
      expect(chord.suspension).toBeUndefined()
    }
  })

  it('chế độ chỉ chủ âm thì chỉ chủ âm có nốt treo', () => {
    const result = reharmonize(chords('C Am F G'), { suspendMajor: 'tonic' })

    expect(result.colored[0].suspension).toBeDefined()
    expect(result.colored[2].suspension).toBeUndefined()
  })

  it('chế độ mọi hợp âm trưởng thì cả bậc bốn cũng có', () => {
    const result = reharmonize(chords('C Am F G'), {
      suspendMajor: 'allMajor',
    })

    expect(result.colored[0].suspension).toBeDefined()
    expect(result.colored[2].suspension).toBeDefined()
  })

  it('không gắn cho hợp âm thứ', () => {
    const result = reharmonize(chords('C Am F G'), {
      suspendMajor: 'allMajor',
    })
    expect(result.colored[1].suspension).toBeUndefined()
  })

  it('không gắn cho bậc năm', () => {
    // Bậc năm có luật riêng, và hợp âm treo bậc năm đã có tuỳ chọn khác
    const result = reharmonize(chords('C Am F G'), {
      suspendMajor: 'allMajor',
    })
    expect(result.colored[3].suspension).toBeUndefined()
  })

  it('nốt treo là hợp âm treo bậc bốn', () => {
    const result = reharmonize(chords('C Am F G'), { suspendMajor: 'tonic' })
    expect(result.colored[0].suspension?.id).toBe('sus4')
  })

  it('không đụng tới màu đã chọn của hợp âm', () => {
    const result = reharmonize(chords('C Am F G'), {
      suspendMajor: 'tonic',
      tonicColor: '6',
    })

    expect(result.colored[0].symbol).toBe('C6')
    expect(result.colored[0].suspension).toBeDefined()
  })

  it('vẫn gắn nốt treo cả khi hợp âm đã dày hơn màu đề xuất', () => {
    // Người dùng nhập Cmaj9 mà chọn màu maj7 thì hợp âm giữ nguyên Cmaj9,
    // nhưng nốt treo không được im lặng biến mất theo
    const result = reharmonize(chords('Cmaj9 Am F G'), {
      key: { tonic: 0, scale: 'major' },
      suspendMajor: 'tonic',
      tonicColor: 'maj7',
    })

    expect(result.colored[0].symbol).toBe('Cmaj9')
    expect(result.colored[0].suspension).toBeDefined()
  })
})

describe('thế bấm của nốt treo', () => {
  it('dựng thế bấm riêng cho nốt treo', () => {
    const result = reharmonize(chords('C Am F G'), { suspendMajor: 'tonic' })
    const [tonic] = voiceLeadTwoHands(result.colored)

    expect(tonic.suspendedRight).toBeDefined()
    expect(tonic.suspendedRight!.length).toBeGreaterThan(0)
  })

  it('thế bấm nốt treo có bậc bốn, thế đã giải quyết thì không', () => {
    const result = reharmonize(chords('C Am F G'), {
      suspendMajor: 'tonic',
      tonicColor: 'maj7',
    })
    const [tonic] = voiceLeadTwoHands(result.colored)

    const susClasses = new Set(tonic.suspendedRight!.map((note) => note % 12))
    const resolvedClasses = new Set(tonic.right.map((note) => note % 12))

    // Nốt Fa là bậc bốn của Đô
    expect(susClasses.has(5)).toBe(true)
    expect(resolvedClasses.has(5)).toBe(false)
    // Nốt Mi là bậc ba, chỉ có ở thế đã giải quyết
    expect(resolvedClasses.has(4)).toBe(true)
  })

  it('hợp âm không có nốt treo thì không dựng thế bấm thừa', () => {
    const [voicing] = voiceLeadTwoHands(chords('C'))
    expect(voicing.suspendedRight).toBeUndefined()
  })
})

describe('nốt treo trong dòng thời gian', () => {
  it('vang ở tiếng đầu rồi giải quyết ở tiếng sau', () => {
    const result = reharmonize(chords('C'), {
      suspendMajor: 'tonic',
      tonicColor: 'maj7',
    })
    const voicings = voiceLeadTwoHands(result.colored)
    const events = renderPattern(voicings, BALLAD, { beatsPerChord: 4 })

    const rightHits = events
      .filter((event) => event.hand === 'right')
      .sort((a, b) => a.startBeat - b.startBeat)

    expect(rightHits.length).toBeGreaterThanOrEqual(2)
    expect(rightHits[0].notes).toEqual(voicings[0].suspendedRight)
    expect(rightHits[1].notes).toEqual(voicings[0].right)
  })

  it('hợp âm ngắn cũng được chia đôi để nốt treo có chỗ giải quyết', () => {
    const result = reharmonize(chords('C'), { suspendMajor: 'tonic' })
    const voicings = voiceLeadTwoHands(result.colored)

    // Nửa ô nhịp: bình thường chỉ một tiếng, nhưng có nốt treo thì phải hai
    const events = renderPattern(voicings, BALLAD, { beatsPerChord: 2 })
    const rightHits = events.filter((event) => event.hand === 'right')

    expect(rightHits).toHaveLength(2)
  })

  it('không có nốt treo thì hợp âm ngắn vẫn chỉ một tiếng', () => {
    const voicings = voiceLeadTwoHands(chords('C'))
    const events = renderPattern(voicings, BALLAD, { beatsPerChord: 2 })

    expect(events.filter((event) => event.hand === 'right')).toHaveLength(1)
  })

  it('điệu có mẫu tiết tấu chỉ treo ở tiếng đầu của mỗi hợp âm', () => {
    // Chỉ định giọng để cả hai hợp âm đều là bậc trưởng đứng yên; để app tự
    // dò thì vòng C F ra giọng F trưởng, lúc đó C thành bậc năm.
    const result = reharmonize(chords('C F'), {
      key: { tonic: 0, scale: 'major' },
      suspendMajor: 'allMajor',
      tonicColor: 'maj7',
      majorColor: 'maj7',
    })
    const voicings = voiceLeadTwoHands(result.colored)
    const events = renderPattern(voicings, VALSE, { beatsPerChord: 3 })

    const rightHits = events
      .filter((event) => event.hand === 'right')
      .sort((a, b) => a.startBeat - b.startBeat)

    // Điệu valse tay phải đánh hai tiếng mỗi ô nhịp, nghỉ phách một.
    // Tiếng đầu của mỗi hợp âm là nốt treo, tiếng sau đã giải quyết.
    expect(rightHits[0].notes).toEqual(voicings[0].suspendedRight)
    expect(rightHits[1].notes).toEqual(voicings[0].right)
    expect(rightHits[2].notes).toEqual(voicings[1].suspendedRight)
    expect(rightHits[3].notes).toEqual(voicings[1].right)
  })

  it('nốt treo không lặp mãi mà không giải quyết', () => {
    const result = reharmonize(chords('C F C F'), {
      key: { tonic: 0, scale: 'major' },
      suspendMajor: 'allMajor',
    })
    const voicings = voiceLeadTwoHands(result.colored)
    const events = renderPattern(voicings, VALSE, { beatsPerChord: 3 })

    const rightHits = events.filter((event) => event.hand === 'right')
    const susHits = rightHits.filter((event) =>
      voicings.some(
        (voicing) =>
          voicing.suspendedRight &&
          JSON.stringify(voicing.suspendedRight) ===
            JSON.stringify(event.notes),
      ),
    )

    // Mỗi hợp âm chỉ treo đúng một lần, không treo ở mọi tiếng
    expect(susHits.length).toBeLessThan(rightHits.length)
  })
})
