import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  Ô TICK "SIẾT BÁM HỢP ÂM" — và cả CHỖ NÓ KHÔNG LÀM ĐƯỢC.

  Bản ký âm Linh Nhi, tỉ lệ nốt giai điệu nằm trên hợp âm đang vang:

      trưởng  dạo 68% · giang 68% · kết 75%   ← siết dần về cuối
      thứ     dạo 69% · giang 59% · kết 50%   ← càng về cuối càng rời

  Bộ ghép thì PHẲNG. Ô tick kéo lựa chọn ô về đúng mức ấy — kéo cả hai chiều, nên đoạn kết
  giọng thứ được NỚI RA chứ không phải chỗ nào cũng siết.

  Bài kiểm này ghi lại **cả phần được lẫn phần không được**, để phiên sau đừng tưởng ô tick
  đã đưa mọi con số về đích.
*/

const TRUONG: [string, number][] = [
  ['C | Am | Dm | G | C | Am | Dm | G', 0],
  ['Cadd2 | Am9 | Dm11 | Fadd2 | Em7 | G9sus4 | Cadd2 | G9sus4', 0],
  ['Cmaj7 | Am7 | Dm7 | G7 | Cmaj7 | Fmaj7 | Dm7 | G7', 0],
  ['C | F | C | F | Dm | G | C | F', 0],
  ['G | Em | C | D | G | Bm | C | D', 7],
]
const THU: [string, number][] = [
  ['Am | Dm | G | C | F | Bdim | E7 | Am', 9],
  ['Dm | C | Bb | F | Gm | Dm | A7 | Dm', 2],
  ['Cm | Ab | Fm | Bb | Eb | Cm | G7 | Cm', 0],
  ['Em | C | G | D | Am | Em | B7 | Em', 4],
  ['Bm | G | A | F#m | Bm | Em | F#7 | Bm', 11],
]

const tiLe = (
  ds: readonly [string, number][],
  minor: boolean,
  doan: 'intro' | 'outro',
  siet: boolean,
) => {
  let n = 0
  let hop = 0
  for (const [txt, tonic] of ds) {
    const chords = parseChordInput(txt).chords
    for (let take = 0; take < 6; take += 1) {
      const ev = giaiDieuDaoLinhNhi({
        left: [],
        chords,
        beatsPerChord: 4,
        barBeats: 4,
        range: { low: 57, high: 95 },
        tonic: tonic as PitchClass,
        minor,
        take,
        thay: 'linh-nhi',
        doan,
        ...(siet ? { siet: true } : {}),
      })
      for (const e of ev) {
        const ch = chords[Math.min(chords.length - 1, Math.floor(e.startBeat / 4))]!
        n += 1
        const rel = (((e.notes[0]! - ch.root) % 12) + 12) % 12
        if (ch.quality.intervals.includes(rel)) hop += 1
      }
    }
  }
  return hop / n
}

describe('siết bám hợp âm — ô tick nghe thử', () => {
  it('MẶC ĐỊNH TẮT: không bật thì không đổi một nốt nào', () => {
    const a = giaiDieuDaoLinhNhi({
      left: [], chords: parseChordInput(TRUONG[0]![0]).chords, beatsPerChord: 4,
      barBeats: 4, range: { low: 57, high: 95 }, tonic: 0 as PitchClass,
      minor: false, take: 0, thay: 'linh-nhi', doan: 'intro',
    })
    const b = giaiDieuDaoLinhNhi({
      left: [], chords: parseChordInput(TRUONG[0]![0]).chords, beatsPerChord: 4,
      barBeats: 4, range: { low: 57, high: 95 }, tonic: 0 as PitchClass,
      minor: false, take: 0, thay: 'linh-nhi', doan: 'intro', siet: false,
    })
    expect(a.map((e) => e.notes[0])).toEqual(b.map((e) => e.notes[0]))
  })

  it('ĐOẠN KẾT đi đúng chiều — trưởng siết lại, thứ nới ra', () => {
    /*
      Đây là điều duy nhất ô tick làm được rõ, và nó là điều đáng giá nhất: hai giọng đi
      NGƯỢC CHIỀU ở đoạn kết. Bản chưa bật thì cả hai đều quanh 67% và 61%.
    */
    const truongTat = tiLe(TRUONG, false, 'outro', false)
    const truongBat = tiLe(TRUONG, false, 'outro', true)
    const thuTat = tiLe(THU, true, 'outro', false)
    const thuBat = tiLe(THU, true, 'outro', true)

    expect(truongBat, `trưởng ${(100 * truongBat).toFixed(1)}%`).toBeGreaterThan(truongTat)
    expect(thuBat, `thứ ${(100 * thuBat).toFixed(1)}%`).toBeLessThan(thuTat)
    /* Và hai giọng phải TÁCH NHAU ra, không còn dính quanh một mức. */
    expect(truongBat - thuBat).toBeGreaterThan(truongTat - thuTat)
  })

  it('CHƯA ĐẠT: đoạn dạo giọng thứ vẫn cách đích 9 điểm', () => {
    /*
      Bản ký âm 69%, bộ ghép ra ~60% dù bật hay tắt. Dò trọng số 3 · 8 · 20 đều ra như
      nhau — **bão hoà**. Lý do: tỉ lệ nốt hợp âm của một ô đã nằm sẵn trong chính ô ấy;
      phép chấm chỉ chọn được trong số ô đủ điều kiện, mà lọc theo bậc hợp âm xong thì các
      ứng viên còn lại có tỉ lệ gần bằng nhau.

      Muốn đóng nốt 9 điểm ấy thì phải đụng vào chỗ khác — hoặc nới bộ lọc bậc, hoặc nắn
      nốt. Nắn nốt đã bị bác bốn lần. Ghi lại để phiên sau đừng vặn lại trọng số.
    */
    const bat = tiLe(THU, true, 'intro', true)
    expect(Math.abs(bat - 0.69), `thứ · dạo ${(100 * bat).toFixed(1)}%`).toBeGreaterThan(0.05)
  })
})
