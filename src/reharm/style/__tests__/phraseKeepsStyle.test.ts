import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
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
 * Không phải bảng bậc tay trái của ô nhịp: ở đoạn không lời, tay phải bỏ phần
 * quạt để lên chạy giai điệu và **tay trái gánh trọn mẫu đệm** — cả phần tay
 * phải để lại. Xem `soloLeftHand.ts`. Trước đây test này so với riêng bảng bậc
 * tay trái, tức khoá đúng cái kết cấu mà người dùng vừa bảo là quá thưa: bolero
 * hai cú gõ mỗi ô, đi vỏn vẹn bảy nửa cung.
 *
 * Thứ phải giữ vẫn nguyên: nhịp lấy từ CHÍNH điệu đang chọn, không mượn điệu
 * khác. Đó là điều test này canh, và nó không đổi.
 */
function cellLeftBeats(styleId: string): number[] {
  return patternOnsets(getStyle(styleId)!)
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
