import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { vonHopAmLinhNhi } from '../vonHopAmLinhNhi'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  RÚT TỪ VỐN HỢP ÂM CỦA CHÍNH BÀI.

  Đo bảy bản ký âm Linh Nhi, so bậc của hai mươi đoạn không lời với bậc của các
  đoạn có lời trong CÙNG bài: **16/20 đoạn không dùng bậc nào ngoài đoạn hát**.

  Bốn ngoại lệ chỉ gồm hai hợp âm — iv thứ (3 lần) và I trưởng Picardy (1 lần).
*/

const AM = { tonic: 9 as PitchClass, scale: 'minor' as const }
const BAI = parseChordInput('Am Dm G C F Dm E7 Am').chords
const lop = (n: number) => ((n % 12) + 12) % 12
const goc = (cs: readonly { root: number }[]) => new Set(cs.map((c) => lop(c.root)))

describe('vốn hợp âm rút từ bài', () => {
  it('KHÔNG sinh bậc nào ngoài bài — trừ bậc V ở ô cuối', () => {
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const ra = vonHopAmLinhNhi({ kind, key: AM, songChords: BAI })
      const ngoai = [...goc(ra)].filter((pc) => !goc(BAI).has(pc))
      /* Bậc V của La thứ = Mi = 4. Bài đã có E7 nên không có bậc lạ nào. */
      expect(ngoai, kind).toEqual([])
    }
  })

  it('bài KHÔNG có bậc V thì chỉ được dựng thêm đúng bậc ấy', () => {
    const khongV = parseChordInput('Am Dm F C').chords
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: khongV })
    const ngoai = [...goc(ra)].filter((pc) => !goc(khongV).has(pc))
    expect(ngoai).toEqual([4]) // Mi = bậc V của La thứ
  })

  /* Đo được ở Biển Tình, Mùa Xuân và Đừng Xa — cửa vào hát. */
  it('ô cuối đoạn dạo và giang là bậc V', () => {
    for (const kind of ['intro', 'interlude'] as const) {
      const ra = vonHopAmLinhNhi({ kind, key: AM, songChords: BAI })
      expect(lop(ra[ra.length - 1]!.root), kind).toBe(4)
    }
  })

  /* Ba bài đậu chủ âm, ba bài không — chưa thành luật, nên không ép. */
  it('đoạn kết KHÔNG bị ép về bậc V', () => {
    const ra = vonHopAmLinhNhi({ kind: 'outro', key: AM, songChords: BAI })
    expect(ra.length).toBeGreaterThan(0)
  })

  /*
    Nhịp hoà âm: dạo và giang ≈ 1,0 hợp âm mỗi ô; kết ≈ 0,45. Đoạn kết chậm lại
    bằng cách GIỮ mỗi hợp âm nhiều ô, không phải bằng cách ngắn đi.
  */
  it('đoạn kết đổi hợp âm chậm hơn hẳn, mà vẫn đủ số ô', () => {
    const dao = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI })
    const ket = vonHopAmLinhNhi({ kind: 'outro', key: AM, songChords: BAI })
    expect(ket.length).toBe(dao.length)
    const rieng = (cs: readonly { root: number }[]) =>
      cs.filter((c, i) => i === 0 || c.root !== cs[i - 1]!.root).length
    expect(rieng(ket)).toBeLessThan(rieng(dao) * 0.7)
  })

  it('mở trên hợp âm chủ khi bài có', () => {
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI })
    expect(lop(ra[0]!.root)).toBe(9)
  })

  /* Dưới ba hợp âm thì không đủ vốn — trả rỗng để đường dãy-bậc-cố-định tiếp quản. */
  it('bài quá ít hợp âm thì trả rỗng, không lặp hai hợp âm', () => {
    expect(vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: parseChordInput('Am E7').chords }))
      .toEqual([])
    expect(vonHopAmLinhNhi({ kind: 'intro', key: null, songChords: BAI })).toEqual([])
  })

  it('giữ đúng trật tự hợp âm của bài, chỉ xoay vòng', () => {
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI })
    /* Bài mở bằng Am nên không phải xoay; hai hợp âm đầu phải là Am rồi Dm. */
    expect([lop(ra[0]!.root), lop(ra[1]!.root)]).toEqual([9, 2])
  })
})
