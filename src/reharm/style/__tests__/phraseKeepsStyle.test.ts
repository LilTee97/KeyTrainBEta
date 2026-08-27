import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'

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
 * Chỗ gõ tay trái mà chính ô nhịp của điệu khai, quy về **một ô nhịp**.
 *
 * Chia dư cho độ dài ô nhịp vì có điệu khai ô nhịp dài hơn một ô: bossa dài hai
 * ô (`lengthBeats` 8 trên nhịp 4/4), nên bảng bậc của nó liệt kê tới phách 7,5.
 * Không chia dư thì so một tập bốn chỗ với một tập tám chỗ, mà thật ra chúng là
 * cùng một tiết tấu lặp hai lượt.
 */
function cellLeftBeats(styleId: string): number[] {
  const style = getStyle(styleId)!
  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid
  return [
    ...new Set(
      style.cell!.left.map((hit) => Number(((hit.beat * grid) % bar).toFixed(3))),
    ),
  ].sort((a, b) => a - b)
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
