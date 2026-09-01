import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { raiTheoTayTrai } from '../hoDieu'
import { patternOnsets } from '../soloLeftHand'

/*
  Dạo đầu, kết bài và giang tấu chơi **đúng điệu đang chọn** — mọi điệu.

  Ca hỏng đã báo: chọn slow rock, tới ba đoạn ấy thì tay trái đổi sang câu rải
  ballad. Nó đến từ một luật cũ trong `interludeBass.ts`: điệu nào thuộc họ
  ballad thì giang tấu thay tay trái bằng hình rải gốc-5-8-5 của *Hồng Kông 1*
  — mà họ ballad có cả `slow-rock-2` lẫn `hai-slow-rock`. Luật ấy đã bỏ.

  Test đo **chỗ gõ của tay trái trong một ô nhịp**, so với chính ô nhịp của điệu.
  Đo cao độ thì không bắt được: hai điệu khác tiết tấu vẫn có thể dùng chung nốt.
*/

const SONG = 'Am Dm G C F G Em Am'
const KEY = { tonic: 9, scale: 'minor' } as const

const STYLES = [
  'pop-1',
  'bossa-nova-1',
  'swing-1',
  'waltz-1',
  'slow-rock-2',
  'hai-slow-rock',
  'hai-pop-ballad',
  'slow-rock-duc-thinh-3',
] as const

/**
 * Chỗ gõ tay trái mà điệu đòi ở ĐOẠN KHÔNG LỜI.
 *
 * Phần TAY TRÁI của ô nhịp, cộng nốt chèn cho nhịp kép. Đã có một lượt gộp cả
 * phần tay phải vào đây, vì tay trái chơi riêng phần mình thì thưa; người dùng
 * bác lối ấy — để tay trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo là
 * không đúng. Chỗ thưa ra được lấp bằng luật mật độ, xem `interlockHands`.
 *
 * Thứ phải giữ vẫn nguyên: nhịp lấy từ CHÍNH điệu đang chọn, không mượn điệu
 * khác. Đó là điều test này canh, và nó không đổi.
 */
function cellLeftBeats(styleId: string): number[] {
  return patternOnsets(getStyle(styleId)!, 'left')
}

function phraseLeftBeats(styleId: string, kind: 'intro' | 'outro'): number[] {
  const style = getStyle(styleId)!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const chords = parseChordInput(SONG).chords
  const built = buildPhraseSection({
    kind,
    key: KEY,
    style,
    beatsPerChord: bar,
    dropRoot: true,
    opening: chords[0]!,
    solo: () => [],
    songChords: chords,
  })!
  return [
    ...new Set(
      built.events
        .filter((event) => event.hand === 'left')
        .map((event) => Number((event.startBeat % bar).toFixed(3))),
    ),
  ].sort((a, b) => a - b)
}

describe('đoạn không lời chơi đúng điệu đã chọn', () => {
  it.each(STYLES)('%s: dạo đầu gõ tay trái đúng ô nhịp của điệu', (styleId) => {
    expect(phraseLeftBeats(styleId, 'intro')).toEqual(cellLeftBeats(styleId))
  })

  it.each(STYLES)('%s: kết bài gõ tay trái đúng ô nhịp của điệu', (styleId) => {
    expect(phraseLeftBeats(styleId, 'outro')).toEqual(cellLeftBeats(styleId))
  })

  /*
    Chốt lại đúng ca người dùng báo: điệu slow và điệu ballad phải cho hai kết
    quả KHÁC nhau. Nếu chúng bằng nhau thì luật thay điệu đã lẻn về.
  */
  it('slow rock không gõ giống ballad', () => {
    expect(phraseLeftBeats('slow-rock-duc-thinh-3', 'intro')).not.toEqual(
      phraseLeftBeats('pop-1', 'intro'),
    )
    expect(phraseLeftBeats('hai-slow-rock', 'intro')).not.toEqual(
      phraseLeftBeats('hai-pop-ballad', 'intro'),
    )
  })
})

/*
  BOSSA DÙNG LỐI BÁM TAY TRÁI CỦA LINH NHI, NHƯNG TAY TRÁI VẪN LÀ BOSSA.

  Người dùng hỏi mở cơ chế ghép hai tay của Linh Nhi cho bossa. Đo trước khi
  mở: bắt chéo 0, phách 1 100%, mốc chung 32% (bolero 44% — lỏng hơn đúng theo
  tỉ lệ tay trái thưa hơn, 4 mốc mỗi ô so với 9).

  Thứ phải khoá là luật cũ vẫn đứng: đổi cách dựng TAY PHẢI thì được, tay trái
  vẫn phải gõ đúng ô nhịp của điệu đã chọn.
*/
describe('bossa bật lối bám tay trái mà không mất chất điệu', () => {
  it('họ bossa có bật cờ bám tay trái', () => {
    for (const id of ['bossa-nova-1', 'bossa-nova-2', 'hai-bossa-nova']) {
      expect(raiTheoTayTrai(id), id).toBe(true)
    }
  })

  it('tay trái bossa vẫn đúng ô nhịp của điệu ở cả dạo đầu lẫn kết bài', () => {
    for (const id of ['bossa-nova-1', 'hai-bossa-nova']) {
      for (const kind of ['intro', 'outro'] as const) {
        expect(phraseLeftBeats(id, kind), `${id} / ${kind}`).toEqual(cellLeftBeats(id))
      }
    }
  })
})

describe('Tôn Hùng hai tay', () => {
  it('dạo: LH chỉ phách 1', () => {
    const style = getStyle('ton-hung-ballad')!
    const chords = parseChordInput(SONG).chords
    const built = buildPhraseSection({
      kind: 'intro',
      key: KEY,
      style,
      thay: 'ton-hung',
      beatsPerChord: 4,
      dropRoot: true,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    expect([
      ...new Set(
        built.events
          .filter((event) => event.hand === 'left')
          .map((event) => Number((event.startBeat % 4).toFixed(3))),
      ),
    ]).toEqual([0])
  })
})
