import { describe, expect, it } from 'vitest'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { reStruck } from './playableOutput.test'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import { scaleForChord } from '../../brain/chordScale'
import { parseChordInput } from '../../input/chordInputParser'
import type { TimelineEvent } from '../types'

/**
 * Luật của **bàn tay** áp lên đoạn đã ráp xong, không phải lên riêng phần đệm.
 *
 * Bộ lưới cũ kiểm `renderPattern` — tức chỉ phần đệm. Nhưng thứ tai nghe ở đoạn
 * dạo đầu và đoạn kết là phần đệm **cộng** câu ngẫu hứng **cộng** hợp âm báo,
 * sau khi đã ráp lại. Đúng khe hở ấy để lọt một lỗi thật: đoạn kết phát đồng
 * thời phần đệm tay phải và câu ngẫu hứng cũng của tay phải, nên Đô quãng 4 bị
 * gõ bốn lần trong khi nó còn đang ngân — Mi và Sol cũng vậy.
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

const doan = (kind: 'intro' | 'outro', styleId: string, take = 0) =>
  buildPhraseSection({
    kind,
    key: KEY,
    style: getStyle(styleId)!,
    beatsPerChord: 4,
    dropRoot: true,
    opening: parseChordInput('Cmaj7').chords[0]!,
    solo: (chords) =>
      soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take,
          noteSource: 'storeScale',
          interlude: true,
          storeScale: scaleForChord,
          endWithRun: kind !== 'outro',
        }),
      ),
    rollCue: styleId.includes('ballad') || styleId.includes('slow'),
  })!

const phai = (events: readonly TimelineEvent[]) =>
  events.filter((event) => event.hand === 'right' && !event.grace)

describe('đoạn dạo đầu và đoạn kết, sau khi đã ráp', () => {
  it('không nốt nào bị gõ lại khi chính nó còn đang ngân', () => {
    for (const styleId of STYLES) {
      for (const kind of ['intro', 'outro'] as const) {
        for (let take = 0; take < 3; take += 1) {
          const bad = reStruck(doan(kind, styleId, take).events)
          expect(bad, `${styleId}/${kind}/lượt ${take}: ${bad[0]}`).toHaveLength(0)
        }
      }
    }
  })

  const cungPhach = (kind: 'intro' | 'outro', styleId: string) => {
    const dem = new Map<number, number>()
    for (const note of phai(doan(kind, styleId).events)) {
      const mocPhach = Number(note.startBeat.toFixed(4))
      dem.set(mocPhach, (dem.get(mocPhach) ?? 0) + note.notes.length)
    }
    return dem
  }

  it('đoạn kết: không quá hai nốt tay phải cùng một phách', () => {
    /*
      Hai là luật của **dòng đơn**, và ở đoạn kết tay phải đúng là một dòng đơn:
      nó chỉ ngẫu hứng, không quạt nữa. Đây là chỗ luật ấy áp được.
    */
    for (const styleId of STYLES) {
      for (const [mocPhach, soNot] of cungPhach('outro', styleId)) {
        expect(soNot, `${styleId} @ phách ${mocPhach}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('đoạn dạo đầu: không quá năm nốt tay phải cùng một phách', () => {
    /*
      Ở dạo đầu tay phải **vừa quạt vừa chạy** — hợp âm ba nốt cộng một nốt câu
      là bốn, và đó là chuyện bình thường của một bàn tay. Ép xuống hai là ép bỏ
      phần quạt, thứ không ai yêu cầu và làm đoạn dạo mỏng hẳn đi.

      Luật đúng ở đây là luật đếm ngón: **năm**. Quá năm thì không phải chuyện
      chọn lối chơi nữa, mà là hai tầng nốt chồng lên nhau.
    */
    for (const styleId of STYLES) {
      for (const [mocPhach, soNot] of cungPhach('intro', styleId)) {
        expect(soNot, `${styleId} @ phách ${mocPhach}`).toBeLessThanOrEqual(5)
      }
    }
  })

  it('đoạn kết: tay phải chỉ còn câu ngẫu hứng, không còn cụm quạt', () => {
    /*
      Nhận ra cụm quạt bằng **số nốt cùng phách**: câu ngẫu hứng là một dòng đơn,
      mỗi phách một nốt. Hợp âm quạt thì hai ba nốt chồng nhau cùng lúc.
    */
    for (const styleId of STYLES) {
      for (const note of phai(doan('outro', styleId).events)) {
        expect(
          note.notes.length,
          `${styleId} @ phách ${note.startBeat}: tay phải quạt ${note.notes.length} nốt`,
        ).toBe(1)
      }
    }
  })

  it('đoạn kết kết bằng roll hợp âm chủ', () => {
    for (const styleId of STYLES) {
      const events = phai(doan('outro', styleId).events)
      const last = Math.max(...events.map((e) => e.startBeat))
      const roll = events.filter((e) => last - e.startBeat < 0.3)
      expect(roll.length, styleId).toBeGreaterThanOrEqual(2)
      const starts = roll.map((e) => e.startBeat).sort((a, b) => a - b)
      for (let at = 1; at < starts.length; at += 1) {
        expect(starts[at], styleId).toBeGreaterThan(starts[at - 1])
      }
    }
  })

  it('đoạn kết vẫn còn tay trái đỡ bên dưới', () => {
    // Bỏ tay phải mà bỏ luôn tay trái thì không nghe ra "bài hết", nghe ra "máy dừng".
    for (const styleId of STYLES) {
      const trai = doan('outro', styleId).events.filter((e) => e.hand === 'left')
      expect(trai.length, `${styleId}: đoạn kết mất hẳn tay trái`).toBeGreaterThan(0)
    }
  })
})
