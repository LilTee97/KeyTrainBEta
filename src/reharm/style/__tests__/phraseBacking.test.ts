import { describe, expect, it } from 'vitest'
import { cueChord, phraseChords } from '../phraseChords'
import { cueStrike, slowClose } from '../phraseCue'
import { parseChordInput } from '../../input/chordInputParser'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { resolveStyleForSection } from '../sectionStyles'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { brainPhrase } from '../../brain/phrase'
import type { ParsedChord } from '../../types'
import type { TimelineEvent } from '../types'

/**
 * Đoạn dạo đầu và đoạn kết chơi **cùng điệu với thân bài**.
 *
 * Bộ não chỉ soạn nốt tay phải. Phát mỗi bấy nhiêu thì đoạn dạo là một dòng nốt
 * bay lơ lửng, không bass đỡ — nghe như tập gam. Phần đệm phải quạt điệu đang
 * chọn trên đúng vòng hợp âm mà não dùng.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

/** Dựng đúng như `ReharmHome` làm, để kiểm cùng một đường đi. */
function play(kind: 'intro' | 'outro', styleId: string) {
  const chords: ParsedChord[] = phraseChords(kind, KEY)
  const style = getStyle(resolveStyleForSection(styleId, 'verse'))!
  const backing = renderPattern(voiceLeadTwoHands(chords), style, {
    beatsPerChord: 4,
    beatsEach: chords.map(() => 4),
  })
  const melody = brainPhrase({ kind, key: KEY, beatsPerMeasure: 4 })
  const events: TimelineEvent[] = [...backing, ...(melody?.events ?? [])]
  return { chords, backing, melody, events }
}

describe('vòng hợp âm đoạn dạo', () => {
  it('dạo đầu đi I - V - vi - IV; kết bài dẫn từ bậc V về bậc I', () => {
    expect(phraseChords('intro', KEY).map((c) => c.symbol)).toEqual([
      'C',
      'G',
      'Am',
      'F',
    ])
    // Ô bậc V đứng trước là chỗ dẫn về, để câu kết không rơi đột ngột.
    expect(phraseChords('outro', KEY).map((c) => c.symbol)).toEqual([
      'G',
      'C',
      'C',
    ])
  })

  it('vòng dạo đầu vẫn đúng bốn ô — hợp âm báo không nằm trong vòng', () => {
    expect(phraseChords('intro', KEY)).toHaveLength(4)
  })

  it('hợp âm báo là át của hợp âm mở bài', () => {
    const opening = parseChordInput('C').chords[0]
    // Hợp âm át của Đô: nốt gốc Sol.
    expect(cueChord(opening)?.root).toBe(7)
    // Không biết bài mở bằng gì thì không có hợp âm báo, không đoán.
    expect(cueChord(null)).toBeNull()
  })

  it('dặm một lượt: cả hợp âm vang cùng một phách', () => {
    const struck = cueStrike([60, 64, 67], 16, { roll: false })
    expect(struck).toHaveLength(1)
    expect(struck[0].notes).toEqual([60, 64, 67])
    expect(struck[0].startBeat).toBe(16)
  })

  it('rải ngón: nốt rơi lần lượt, nốt trên cùng rơi đúng phách', () => {
    const rolled = cueStrike([60, 64, 67], 16, { roll: true })

    expect(rolled).toHaveLength(3)
    // Đi từ dưới lên, và nốt chót đúng vạch phách.
    expect(rolled.map((e) => e.notes[0])).toEqual([60, 64, 67])
    expect(rolled[2].startBeat).toBe(16)
    for (let at = 1; at < rolled.length; at += 1) {
      expect(rolled[at].startBeat).toBeGreaterThan(rolled[at - 1].startBeat)
      // To dần: nốt trên cùng là nốt tai bám vào để vào nhịp.
      expect(rolled[at].velocity).toBeGreaterThan(rolled[at - 1].velocity)
    }
    // Cả cụm vẫn tắt cùng nhau, không kéo lệch đuôi.
    const ends = rolled.map((e) => e.startBeat + e.durationBeats)
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThan(0.01)
  })

  it('kết bài giãn dần và bớt lực ở ô chót', () => {
    const events = [
      { notes: [60], startBeat: 0, durationBeats: 1, hand: 'right' as const, velocity: 80, grace: false },
      { notes: [64], startBeat: 8, durationBeats: 1, hand: 'right' as const, velocity: 80, grace: false },
      { notes: [67], startBeat: 10, durationBeats: 1, hand: 'right' as const, velocity: 80, grace: false },
    ]
    const closed = slowClose(events, 12)

    // Ô đầu không đụng tới.
    expect(closed[0]).toEqual(events[0])
    // Ô chót: giãn ra và nhẹ đi.
    expect(closed[2].durationBeats).toBeGreaterThan(events[2].durationBeats)
    expect(closed[2].velocity).toBeLessThan(events[2].velocity)
    // Tiếng chót ngân trọn phần còn lại của đoạn.
    expect(closed[2].startBeat + closed[2].durationBeats).toBeGreaterThanOrEqual(12)
  })

  it('khớp đúng vòng não dùng — hai tay không chơi hai hợp âm khác nhau', () => {
    const chords = phraseChords('intro', KEY)
    const melody = brainPhrase({ kind: 'intro', key: KEY, beatsPerMeasure: 4 })!

    for (const event of melody.events) {
      const bar = Math.floor(event.startBeat / 4)
      const chord = chords[bar]
      if (!chord) continue
      const tones = new Set(
        chord.quality.intervals.map((step) => (chord.root + step) % 12),
      )
      const pitch = ((event.notes[0] % 12) + 12) % 12
      /*
        Nốt sus và nốt dẫn cố ý nằm ngoài hợp âm — chúng là cả ngón của thầy
        Kingsley. Chỉ canh hai nốt mở mỗi ô, chỗ tai nhận ra đang ở hợp âm nào.
      */
      if (event.startBeat - bar * 4 >= 1) continue
      expect(tones, `ô ${bar + 1} @ phách ${event.startBeat}`).toContain(pitch)
    }
  })

  it('giọng thứ quy về giọng trưởng song song', () => {
    const minor = phraseChords('intro', { tonic: 9, scale: 'minor' })
    expect(minor.map((c) => c.symbol)).toEqual(['C', 'G', 'Am', 'F'])
  })

  it('chưa biết giọng thì trả rỗng, không đoán bừa', () => {
    expect(phraseChords('intro', null)).toEqual([])
  })
})

describe('đoạn dạo có bass, không để tay trái trống', () => {
  for (const styleId of ['pop-1', 'hai-pop-ballad', 'hai-pop-ballad-free']) {
    it(`${styleId}: dạo đầu có tiếng tay trái ở mọi ô`, () => {
      const { backing } = play('intro', styleId)
      expect(backing.length).toBeGreaterThan(0)

      for (let bar = 0; bar < 4; bar += 1) {
        const inBar = backing.filter(
          (e) =>
            e.hand === 'left' &&
            e.startBeat >= bar * 4 &&
            e.startBeat < (bar + 1) * 4,
        )
        expect(inBar.length, `${styleId} ô ${bar + 1} trống tay trái`).toBeGreaterThan(0)
      }
    })

    it(`${styleId}: kết bài cũng có bass`, () => {
      const { backing } = play('outro', styleId)
      expect(backing.some((e) => e.hand === 'left')).toBe(true)
    })
  }

  it('bass đi theo đúng hợp âm từng ô', () => {
    const { chords, backing } = play('intro', 'hai-pop-ballad')
    for (const event of backing.filter((e) => e.hand === 'left')) {
      const chord = chords[Math.min(3, Math.floor(event.startBeat / 4))]
      const tones = new Set(
        chord.quality.intervals.map((step) => (chord.root + step) % 12),
      )
      for (const note of event.notes) {
        expect(tones, `@ phách ${event.startBeat}`).toContain(((note % 12) + 12) % 12)
      }
    }
  })
})

describe('nốt não chồng lên đệm, không thay bass', () => {
  it('vẫn còn nốt tay phải của não, và có item Kingsley cho phép', () => {
    const { melody } = play('intro', 'hai-pop-ballad')
    expect(melody).not.toBeNull()
    expect(melody!.events.length).toBeGreaterThanOrEqual(24)
    expect(melody!.authorizedBy).toContain('kingsley-sus2-to-3')
    expect(melody!.authorizedBy).toContain('kingsley-sus4-to-3')
  })

  it('giai điệu não nằm cao hơn bass', () => {
    const { backing, melody } = play('intro', 'hai-pop-ballad')
    const bass = backing.filter((e) => e.hand === 'left').flatMap((e) => e.notes)
    const rh = melody!.events.flatMap((e) => e.notes)
    expect(Math.min(...rh)).toBeGreaterThan(Math.max(...bass))
  })

  it('não im thì vẫn còn nguyên phần đệm, không mất tiếng cả đoạn', () => {
    const { backing } = play('intro', 'pop-1')
    // Đây là thứ phát ra khi `brainPhrase` trả null: chỉ còn đệm, và vẫn kêu.
    expect(backing.length).toBeGreaterThan(0)
    expect(backing.some((e) => e.hand === 'left')).toBe(true)
  })
})
