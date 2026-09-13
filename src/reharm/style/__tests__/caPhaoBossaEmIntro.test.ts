import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { soloRange } from '../../fillSoloGenerator/soloGenerator'

/*
  Người dùng 13/9/2026: bài Mi thứ (Am7 B7 Em7), Bossa CP cải tiến, bật dạo/giang/kết mà
  không hiện vòng hợp âm, không phát. Gốc: intro chọn đúng MỘT vị trí quãng tám cho nét và
  cho câu hút, chạm tay trái là bỏ cuộc. Nay thử lần lượt các vị trí hợp lệ (dịch nguyên nét,
  không gập từng nốt). Kỳ vọng: 8/12 giọng thứ lọt tầm app 62–79 đều ra đủ ba đoạn; 4 giọng
  F/F#/G/Ab nét không lọt tầm → báo rõ, cần Trần mở (chủ ý Codex, không gập).
*/
describe('Bossa CP cải tiến — tầm app 62–79', () => {
  const build = (tonic: number, kind: 'intro' | 'interlude' | 'outro', take = 0) => {
    const chords = parseChordInput('Am7 B7 Em7 Em7').chords
    return buildPhraseSection({ kind, key: { tonic, scale: 'minor' }, style: getStyle('ca-phao-bossa-improved')!,
      thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: chords[0]!, songChords: chords,
      solo: () => [], take, range: soloRange(false) })
  }
  it('Mi thứ ra đủ intro/giang/outro (trước sửa: intro rỗng vì va chạm tay trái)', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const r = build(4, kind)
      expect(r?.unavailableReason, kind).toBeUndefined()
      expect(r?.events.length ?? 0, kind).toBeGreaterThan(0)
    }
  })
  it('8/12 giọng thứ lọt tầm app đều ra intro; 4 giọng ngoài tầm báo rõ, không gập', () => {
    const ok: number[] = [], khong: number[] = []
    for (let tonic = 0; tonic < 12; tonic++) {
      const r = build(tonic, 'intro')
      ;(r && r.events.length > 0 ? ok : khong).push(tonic)
      if (r && r.events.length === 0) expect(r.unavailableReason).toMatch(/Tầm nốt quá hẹp/)
    }
    expect(ok).toEqual([0, 1, 2, 3, 4, 9, 10, 11])
    expect(khong).toEqual([5, 6, 7, 8])
  })
})
