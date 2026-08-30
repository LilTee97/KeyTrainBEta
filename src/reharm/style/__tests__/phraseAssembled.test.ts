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
    take,
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

/*
  HỢP ÂM BÁO KHÔNG ĐÈO THÊM MỘT PHÁCH VÀO ĐOẠN DẠO.

  Bản trước cộng một phách sau vòng để dặm hợp âm báo, nên đoạn dạo dài bốn ô
  LẺ MỘT PHÁCH. Người dùng nghe ra cái lẻ ấy: "ở intro có một nhịp dặm hợp âm
  trước khi kết đoạn nghe có vẻ bị dư".

  Đoạn kết thì giữ: ở đó cái đuôi chính là chỗ bài đậu xuống, không phải thứ
  chen vào giữa hai đoạn.
*/
describe('đoạn dạo giữ đúng số ô', () => {
  const VONG = 4
  const PHACH = 4

  it('dạo đầu dài đúng một vòng, không lẻ phách nào', () => {
    for (const styleId of STYLES) {
      const built = doan('intro', styleId)
      expect(built.lengthBeats, styleId).toBe(VONG * PHACH)
      expect(built.lengthBeats % PHACH, styleId).toBe(0)
    }
  })

  it('hợp âm báo nằm TRONG vòng, không rơi ra ngoài', () => {
    for (const styleId of STYLES) {
      const built = doan('intro', styleId)
      for (const event of built.events) {
        expect(event.startBeat, styleId).toBeLessThan(built.lengthBeats)
      }
    }
  })

  /*
    Đoạn kết mượn BA hợp âm — dẫn, chủ, chủ — chứ không phải bốn như đoạn dạo,
    nên đừng khoá bằng con số tuyệt đối. Thứ phải giữ là phần LẺ: đúng một
    phách đậu xuống sau khi vòng chạy trọn.
  */
  /*
    Hợp âm báo RẢI, không dặm — và với mọi điệu, không riêng ballad.

    Đo trên `pop-1` bản trước: một khối ba nốt rơi đúng phách áp chót rồi đoạn
    còn chạy tiếp một phách, nên nó nghe ra cú gõ chen vào giữa chứ không phải
    tiếng báo hết đoạn. Rải thì mỗi nốt đi một mình, nên không còn khối nào.
  */
  /*
    NARROW LẠI so với bản đầu, và vì số đo chứ không vì test đỏ.

    Bản đầu cấm MỌI cú gõ nhiều nốt trong đoạn dạo. Nó viết khi cú gõ nhiều nốt
    duy nhất là chính hợp âm báo. Nhưng lối solo tự do Cà Pháo có chùm ba nốt,
    và đo trên bản ký âm thì đoạn dạo của anh CÓ chùm ấy thật: Bèo dạt 0,6 chùm
    mỗi ô, Yêu xa 0,6, Mơ 0,7 — ngang với giang tấu của chính chúng.

    Cái người dùng bác là cú dặm CẠNH TRANH với tiếng báo, không phải chùm nốt
    giữa câu. Nên luật đúng là: ô CHÓT sạch chùm, để tiếng báo đứng một mình.
  */
  it('ô chót đoạn dạo sạch chùm nốt, để tiếng báo đứng một mình', () => {
    const PHACH = 4
    for (const styleId of STYLES) {
      const built = doan('intro', styleId)
      for (const event of built.events) {
        if (event.hand !== 'right') continue
        if (event.startBeat < built.lengthBeats - PHACH) continue
        expect(event.notes.length, `${styleId} @ ${event.startBeat}`).toBe(1)
      }
    }
  })

  it('tiếng báo là thứ CUỐI CÙNG của đoạn dạo, không sớm hơn', () => {
    for (const styleId of STYLES) {
      const built = doan('intro', styleId)
      const cuoi = Math.max(...built.events.map((e) => e.startBeat))
      // Nằm trong phách chót của vòng, không phải một phách chen ở giữa.
      expect(cuoi, styleId).toBeGreaterThan(built.lengthBeats - PHACH)
      expect(cuoi, styleId).toBeLessThan(built.lengthBeats)
    }
  })

  it('đoạn kết vẫn giữ một phách đậu xuống', () => {
    for (const styleId of STYLES) {
      expect(doan('outro', styleId).lengthBeats % PHACH, styleId).toBe(1)
    }
  })
})

/*
  DẠO ĐẦU VÀ KẾT BÀI ĐỔI CÂU MỖI LẦN CHƠI, Y NHƯ GIANG TẤU.

  Lối bám tay trái ở hai đoạn này trước đây không nhận `take`, nên nó lấy mặc
  định 0: giang tấu thì mỗi lượt một câu, còn dạo đầu và kết bài phát lại đúng
  một câu mãi. Đường sinh câu độc lập đã tự xoay theo lượt từ trước, nên chỉ
  nhánh bám tay trái bị kẹt — và đó đúng là nhánh của họ bolero.
*/
describe('đoạn dạo và đoạn kết đổi theo lượt', () => {
  const van = (kind: 'intro' | 'outro', styleId: string, take: number) =>
    doan(kind, styleId, take)
      .events.filter((event) => event.hand === 'right')
      .map((event) => `${event.startBeat.toFixed(3)}:${event.notes.join(',')}`)
      .join('|')

  it('sáu lượt ra sáu câu khác nhau, mọi điệu', () => {
    for (const styleId of [...STYLES, 'bolero-linh-nhi-2']) {
      for (const kind of ['intro', 'outro'] as const) {
        const thay = new Set<string>()
        for (let take = 0; take < 6; take += 1) thay.add(van(kind, styleId, take))
        expect(thay.size, `${styleId} / ${kind}`).toBe(6)
      }
    }
  })

  it('cùng một lượt thì ra đúng một câu — đổi mới chứ không ngẫu nhiên', () => {
    for (const styleId of [...STYLES, 'bolero-linh-nhi-2']) {
      expect(van('intro', styleId, 3), styleId).toBe(van('intro', styleId, 3))
    }
  })
})
