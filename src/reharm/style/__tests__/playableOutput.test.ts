import { describe, expect, it } from 'vitest'
import { chordDurations } from '../../chordTiming'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import { soloFeelFor } from '../../fillSoloGenerator/soloFeel'
import { scaleForChord } from '../../brain/chordScale'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { phraseChords } from '../phraseChords'
import { slowClose } from '../phraseCue'
import type { TimelineEvent } from '../types'

/**
 * Luật của **cây đàn**, không phải của một điệu nào.
 *
 * Mấy luật dưới đây đúng với mọi tầng tiếng — đệm thân bài, dạo đầu, kết bài,
 * bass giang tấu, câu solo — nên chúng được kiểm một chỗ cho tất cả, thay vì
 * mỗi tầng tự nhớ lấy.
 *
 * Hai lỗi thật đã bắt được bằng bộ này, và cả hai đều chỉ lộ ra khi đo hàng
 * loạt chứ không lộ ra khi nhìn một bài:
 *
 * - `slowClose` giãn nốt ô cuối tới mức gõ lại chính phím đang ngân — dính
 *   bossa, slow rock và bossa của thầy Hải.
 * - Điệu valse cho tiếng "pah" phách 1 ngân 1,29 phách trong khi "pah" sau rơi
 *   đúng phách 2 — chồng ở **mọi ô nhịp của mọi bài valse**.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const STYLES = [
  'pop-1',
  'bossa-nova-1',
  'swing-1',
  'slow-rock-2',
  'waltz-1',
  'hai-slow-rock',
  'hai-pop-ballad',
  'hai-bossa-nova',
] as const

const backing = (source: string, styleId: string) => {
  const chords = parseChordInput(source).chords
  return renderPattern(voiceLeadTwoHands(chords, { dropRootFromRightHand: true }), getStyle(styleId)!, {
    beatsPerChord: 4,
    beatsEach: chordDurations(chords, 4),
  })
}

/** Tiếng nào còn đang ngân mà chính phím ấy bị gõ lại. */
export function reStruck(events: readonly TimelineEvent[]): string[] {
  const order = [...events].sort((a, b) => a.startBeat - b.startBeat)
  const bad: string[] = []
  for (const event of order) {
    for (const other of order) {
      if (other === event || other.hand !== event.hand) continue
      const room = other.startBeat - event.startBeat
      if (room <= 1e-6 || room >= event.durationBeats - 1e-6) continue
      const shared = other.notes.filter((note) => event.notes.includes(note))
      if (shared.length > 0) {
        bad.push(`nốt ${shared[0]} @${event.startBeat} còn ngân tới ${other.startBeat}`)
      }
    }
  }
  return bad
}

describe('không gõ lại phím đang ngân', () => {
  it('đệm thân bài, mọi điệu', () => {
    for (const styleId of STYLES) {
      const bad = reStruck(backing('C Am F G Em Dm G7 C', styleId))
      expect(bad, `${styleId}: ${bad[0]}`).toHaveLength(0)
    }
  })

  it('dạo đầu và kết bài, mọi điệu', () => {
    for (const styleId of STYLES) {
      for (const kind of ['intro', 'outro'] as const) {
        const chords = phraseChords(kind, KEY)
        const events = renderPattern(
          voiceLeadTwoHands(chords, { dropRootFromRightHand: true }),
          getStyle(styleId)!,
          { beatsPerChord: 4, beatsEach: chordDurations(chords, 4) },
        )
        const bad = reStruck(events)
        expect(bad, `${styleId}/${kind}: ${bad[0]}`).toHaveLength(0)
      }
    }
  })

  it('kết chậm — chỗ giãn nốt là chỗ dễ chồng nhất', () => {
    for (const styleId of STYLES) {
      const chords = phraseChords('outro', KEY)
      const events = renderPattern(
        voiceLeadTwoHands(chords, { dropRootFromRightHand: true }),
        getStyle(styleId)!,
        { beatsPerChord: 4, beatsEach: chordDurations(chords, 4) },
      )
      const bad = reStruck(slowClose(events, 12))
      expect(bad, `${styleId}: ${bad[0]}`).toHaveLength(0)
    }
  })

  it('câu solo giang tấu, mọi điệu mọi nguồn nốt', () => {
    for (const styleId of ['pop-1', 'bossa-nova-1', 'swing-1'] as const) {
      for (const noteSource of ['chordTone', 'chordPentatonic', 'blues', 'storeScale'] as const) {
        for (let take = 0; take < 4; take += 1) {
          const events = soloToTimeline(
            generateSolo(parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords, {
              beatsPerChord: 4,
              density: 'dense',
              key: KEY,
              take,
              noteSource,
              interlude: true,
              storeScale: scaleForChord,
              feel: soloFeelFor(styleId),
            }),
          )
          const bad = reStruck(events)
          expect(bad, `${styleId}/${noteSource}/lượt ${take}: ${bad[0]}`).toHaveLength(0)
        }
      }
    }
  })
})

describe('mọi tiếng đều đàn được', () => {
  const layers = (): [string, TimelineEvent[]][] => {
    const out: [string, TimelineEvent[]][] = []
    for (const styleId of STYLES) {
      out.push([`${styleId} thân bài`, backing('C Am F G Em Dm G7 C', styleId)])
    }
    for (const styleId of STYLES) {
      out.push([`${styleId} giang tấu`, backing('Dm7 G7 Cmaj7 Cmaj7', styleId)])
    }
    return out
  }

  it('nốt nằm trong 88 phím, lực trong 1-127, trường độ dương', () => {
    for (const [label, events] of layers()) {
      for (const event of events) {
        for (const note of event.notes) {
          expect(note, `${label} @${event.startBeat}`).toBeGreaterThanOrEqual(21)
          expect(note, `${label} @${event.startBeat}`).toBeLessThanOrEqual(108)
        }
        expect(event.velocity, `${label} @${event.startBeat}`).toBeGreaterThan(0)
        expect(event.velocity, `${label} @${event.startBeat}`).toBeLessThanOrEqual(127)
        expect(event.durationBeats, `${label} @${event.startBeat}`).toBeGreaterThan(0)
      }
    }
  })

  /*
    Giang tấu giờ chơi đúng mẫu của điệu, nên luật này áp cho tay trái của CHÍNH
    điệu ấy — không còn một tuyến trầm riêng để đo.
  */
  it('tay trái đoạn giang tấu không leo lên vùng tay phải', () => {
    for (const styleId of STYLES) {
      const bass = backing('Dm7 G7 Cmaj7 Cmaj7 Ebmaj7 Bbm7', styleId).filter(
        (event) => event.hand === 'left',
      )
      expect(bass.length, styleId).toBeGreaterThan(0)
      for (const event of bass) {
        for (const note of event.notes) {
          expect(note, `${styleId} bass @${event.startBeat}`).toBeLessThan(60)
        }
      }
    }
  })
})
