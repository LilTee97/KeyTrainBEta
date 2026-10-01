import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { patternOnsets } from '../soloLeftHand'
import type { StylePattern } from '../types'
import { MAU_BALLAD, MAU_BOSSA, MAU_SWING, MAU_VALSE } from './mauThu'

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

/*
  30/9/2026: điệu cũ (Pop 1, Bossa Nova 1, Swing 1, Waltz 1, Slow Rock 2, Slow Rock · Pop Ballad Hải, Đức Thịnh 3) đã
  xoá. Kiểm trên khuôn mẫu riêng cho test + điệu còn giữ đi đường dạo / kết chung. Đo 30/9/2026 (13 khuôn): ba điệu còn
  giữ KHÔNG vào đây vì đi đường riêng đã có test khác — Bossa CP cải tiến (ô hai ô A–B, dạo gõ thêm 3,5 của ô B), Slow
  Blues (bộ soạn Blues: dạo 0 · 1,5 · 2,5) và Bolero Tuấn dạo (Pùng-Pắp hai tay có câu chạy, `boleroLinhNhi.test`).
*/
const STYLES: readonly (StylePattern | string)[] = [
  MAU_BALLAD,
  MAU_BOSSA,
  MAU_SWING,
  MAU_VALSE,
  'ca-phao-ballad-cu-di',
  'ca-phao-ballad-co-em-cho',
  'ca-phao-ballad-de-em-roi-xa',
  'slow-rock-la-thu-hai-tay',
  'twist',
  'tango-tu-n-improv-bai-04-00004',
]
const styleOf = (style: StylePattern | string) => typeof style === 'string' ? getStyle(style)! : style
const CASES = STYLES.map((style) => [styleOf(style).id, styleOf(style)] as const)

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
function cellLeftBeats(styleOrId: StylePattern | string): number[] {
  return patternOnsets(styleOf(styleOrId), 'left')
}

function phraseLeftBeats(styleOrId: StylePattern | string, kind: 'intro' | 'outro'): number[] {
  const style = styleOf(styleOrId)
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
  it.each(CASES)('%s: dạo đầu gõ tay trái đúng ô nhịp của điệu', (_id, style) => {
    expect(phraseLeftBeats(style, 'intro')).toEqual(cellLeftBeats(style))
  })

  it.each(CASES)('%s: kết bài gõ tay trái đúng ô nhịp của điệu', (_id, style) => {
    expect(phraseLeftBeats(style, 'outro')).toEqual(cellLeftBeats(style))
  })

  /*
    Chốt lại đúng ca người dùng báo: điệu slow và điệu ballad phải cho hai kết
    quả KHÁC nhau. Nếu chúng bằng nhau thì luật thay điệu đã lẻn về.
  */
  it('slow rock không gõ giống ballad', () => {
    expect(phraseLeftBeats('slow-rock-la-thu-hai-tay', 'intro')).not.toEqual(
      phraseLeftBeats('ca-phao-ballad-cu-di', 'intro'),
    )
    expect(phraseLeftBeats('slow-rock-la-thu-hai-tay', 'intro')).not.toEqual(
      phraseLeftBeats(MAU_BALLAD, 'intro'),
    )
  })
})

// 30/9/2026: bỏ nhóm "bossa bật lối bám tay trái" — hai điệu bossa còn lại (Cà Pháo) đi lối solo tự do Cà Pháo,
// không bám tay trái; ba điệu bossa từng mang cờ ấy (Bossa Nova 1 · 2, Hải) đã xoá.

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
