import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { vonHopAmLinhNhi, nhipVong } from '../vonHopAmLinhNhi'
import { minorIntroSourceForTake } from '../minorSoloSource'
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
    Ý NGƯỜI DÙNG THẮNG SỐ ĐO Ở CHỖ NÀY — ghi rõ để phiên sau đừng "sửa lại cho đúng".

    Khẳng định cũ: *đoạn kết đổi hợp âm chậm hơn hẳn* — `rieng(ket) < rieng(dao) * 0,7`.
    Nó có **số đo thật** đứng sau: bảy đoạn kết giọng thứ của bản ký âm cho nhịp hoà âm
    `0,27 · 0,50 · 0,57 · 0,64 · 0,78 · 0,92 · 1,00`, trung vị **0,64**, trong khi đoạn dạo
    và giang tấu ≈ 1,0. Đoạn kết chậm lại bằng cách **giữ mỗi hợp âm nhiều ô**.

    Nhưng giữ nhiều ô nghĩa là **có ô đứng cạnh một ô trùng nó**, và người dùng nêu ba lần
    liền rằng họ không muốn thấy điều đó: *"lại bị hiện tượng 2 hợp âm kề nhau"* · *"sao kết
    bài còn nguyên vẫn 2 hợp âm giống nhau đứng kế bên nhau"*. Hai điều ấy không dung hoà
    được — "chậm" chính là "giữ lâu", mà "giữ lâu" chính là "lặp liền".

    Người dùng chọn không lặp. `NHIP.outro` thành **1,0**, một đầu của dải đã đo (*Có Em
    Chờ* đúng 7 hợp âm trên 7 ô), nên vẫn nằm trong bằng chứng — chỉ là không còn ở trung vị.

    Đây là **lựa chọn phối khí**, không phải số đo. Đổi lại thì mất đặc trưng hoà âm chậm ở
    đoạn kết. Triệu chứng để lùi: đoạn kết đổi hợp âm quá gấp, nghe không kịp lắng.
  */
  it('đoạn kết không có hai ô liền cùng hợp âm, mà vẫn đủ số ô', () => {
    const dao = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI })
    const ket = vonHopAmLinhNhi({ kind: 'outro', key: AM, songChords: BAI })
    expect(ket.length).toBe(dao.length)
    const keTrung = ket.filter((c, i) => i > 0 && c.root === ket[i - 1]!.root).length
    expect(keTrung, `${keTrung} cặp kề trùng`).toBe(0)
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

  it('MẶC ĐỊNH vòng dạo bài C đi I-ii-iii — xoay vốn bài', () => {
    const C = { tonic: 0 as PitchClass, scale: 'major' as const }
    const bai = parseChordInput('Cadd2 | Dm11 | Em7 | Fadd2 | G9sus4 | C | Am9 | G9sus4').chords
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: C, songChords: bai })
    const bac = (c: { root: number }) => ((c.root % 12) + 12) % 12
    expect([bac(ra[0]!), bac(ra[1]!), bac(ra[2]!)]).toEqual([0, 2, 4])
  })

  it('TICK daoTruong: mẫu Mùa Xuân I-vi-iii, không I-ii-iii-IV (n=3 bài trưởng)', () => {
    const C = { tonic: 0 as PitchClass, scale: 'major' as const }
    const bai = parseChordInput('Cadd2 | Dm11 | Em7 | Fadd2 | G9sus4 | C | Am9 | G9sus4').chords
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: C, songChords: bai, daoTruong: true })
    const bac = (c: { root: number }) => ((c.root % 12) + 12) % 12
    expect([bac(ra[0]!), bac(ra[1]!), bac(ra[2]!)]).toEqual([0, 9, 4])
    expect(bac(ra[ra.length - 1]!)).toBe(7)
    expect(ra.map((c) => c.symbol)).toEqual(['C', 'Am', 'Em', 'G', 'C', 'Em', 'C', 'G'])
  })

  it('daoThu (Bolero Tuấn thứ, luôn bật): mẫu Đừng Xa i-♭VII-♭VI, cửa V (n=8 sheet thứ, take 0)', () => {
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI, daoThu: true })
    const bac = (c: { root: number }) => (((c.root - 9) % 12) + 12) % 12
    expect([bac(ra[0]!), bac(ra[1]!), bac(ra[2]!)]).toEqual([0, 10, 8])
    expect(bac(ra[ra.length - 1]!)).toBe(7)
  })

  it('daoThu take xoay sang Cà Pháo — Người Hãy Quên Em Đi i–iv–i', () => {
    const ra = vonHopAmLinhNhi({
      kind: 'intro',
      key: AM,
      songChords: BAI,
      daoThu: true,
      take: 1,
    })
    const bac = (c: { root: number }) => (((c.root - 9) % 12) + 12) % 12
    expect(minorIntroSourceForTake(1)?.thay).toBe('ca-phao')
    expect([bac(ra[0]!), bac(ra[1]!), bac(ra[2]!)]).toEqual([0, 5, 0])
    expect(bac(ra[ra.length - 1]!)).toBe(7)
  })

  it('daoThu lấy bậc và chất hợp âm trực tiếp từ sheet thứ đã chọn', () => {
    const chat = (c: { quality: { intervals: readonly number[] } }) =>
      c.quality.intervals.includes(3) ? 'm' : c.quality.intervals.includes(10) ? '7' : ''
    for (let take = 0; take < 6; take += 1) {
      const source = minorIntroSourceForTake(take)!
      const bars = source.phach === 8 && source.o4 ? source.o4 : source.o
      const expected = bars.filter((o) => o.bac !== null).slice(0, 7)
        .map((o, i) => [i === 0 ? 0 : o.bac, i === 0 ? 'm' : o.chat === 'm' ? 'm' : o.chat === '7' ? '7' : ''])
      const actual = vonHopAmLinhNhi({
        kind: 'intro', key: AM, songChords: BAI, daoThu: true, take,
      }).slice(0, expected.length).map((c) => [((c.root - 9 + 12) % 12), chat(c)])
      expect(actual, `${source.ten} — ${source.thay}`).toEqual(expected)
    }
  })

  it('daoThu intro thứ: luôn xác lập i thứ; cho phép ♭VI/♭VII trưởng đúng sheet Tôn Hùng', () => {
    for (let take = 0; take < 6; take += 1) {
      const ra = vonHopAmLinhNhi({
        kind: 'intro',
        key: AM,
        songChords: BAI,
        daoThu: true,
        take,
      })
      expect(lop(ra[0]!.root), `take ${take}`).toBe(9)
      expect(ra[0]!.quality.intervals).toContain(3)
      expect(ra.some((c) => lop(c.root) === 9 || lop(c.root) === 2), `take ${take}`).toBe(true)
    }
  })

  it('intro thứ daoThu: giữ cả hợp âm lặp qua hai ô khi sheet viết như vậy', () => {
    let coLap = false
    for (let take = 0; take < 6; take += 1) {
      const ra = vonHopAmLinhNhi({
        kind: 'intro',
        key: AM,
        songChords: BAI,
        daoThu: true,
        take,
      })
      const g = ra.map((c) => lop(c.root))
      if (g.some((x, i) => i > 0 && x === g[i - 1])) coLap = true
    }
    expect(coLap).toBe(true)
  })

  // 1/10/2026: bỏ test "TICK giangThu" — ô tick vòng giang giống sheet thứ đã gỡ (khôi phục: commit 54b3463).

  it('vòng solo Am giữ được ii thật của Nỗi Buồn Hoa Phượng; luôn mở chủ âm', () => {
    let coBacHai = false
    for (let take = 0; take < 6; take += 1) {
      const ra = vonHopAmLinhNhi({
        kind: 'intro',
        key: AM,
        songChords: BAI,
        daoThu: true,
        take,
      })
      expect(lop(ra[0]!.root), `take ${take}`).toBe(9)
      if (ra.some((c) => lop(c.root) === 11)) coBacHai = true
    }
    expect(coBacHai).toBe(true)
  })

  it('daoTruong xoay theo take, vẫn mở I', () => {
    const C = { tonic: 0 as PitchClass, scale: 'major' as const }
    const bai = parseChordInput('Cadd2 | Dm11 | Em7 | Fadd2 | G9sus4 | C | Am9 | G9sus4').chords
    const a = vonHopAmLinhNhi({ kind: 'intro', key: C, songChords: bai, daoTruong: true, take: 0 })
    const b = vonHopAmLinhNhi({ kind: 'intro', key: C, songChords: bai, daoTruong: true, take: 1 })
    expect(((a[0]!.root % 12) + 12) % 12).toBe(0)
    expect(((b[0]!.root % 12) + 12) % 12).toBe(0)
    expect(a.map((c) => c.symbol).join()).not.toBe(b.map((c) => c.symbol).join())
  })

  it('giữ đúng trật tự hợp âm của bài, chỉ xoay vòng', () => {
    const ra = vonHopAmLinhNhi({ kind: 'intro', key: AM, songChords: BAI })
    /* Bài mở bằng Am nên không phải xoay; hai hợp âm đầu phải là Am rồi Dm. */
    expect([lop(ra[0]!.root), lop(ra[1]!.root)]).toEqual([9, 2])
  })

  describe('ô chia đôi theo đoạn hát', () => {
    /*
      Đo bảy bản ký âm, đếm ô có từ hai hợp âm khác nhau:

      | bài | đoạn hát | đoạn dạo |
      |---|---|---|
      | Biển Tình | 19% | 11% |
      | Đừng Xa | 25% | 11% |
      | Lá Thư | 40% | 33% |
      | Một Cõi | 1% | 0% |
      | Đường Xưa | 13% | 0% |
      | Mùa Xuân | 20% | 12% |
      | Rừng Lá | 39% | 11% |

      **7/7 bài đều có đoạn dạo chia thưa hơn hoặc bằng đoạn hát.** Hai bài mà đoạn hát
      chia dưới 15% có đoạn dạo không chia ô nào.
    */
    const kho = parseChordInput('Dm | Gm | C | F | Bb | A7 | Am | Eb').chords
    const chay = (tiLeChiaHat: number) => {
      const vong = vonHopAmLinhNhi({
        kind: 'intro',
        key: { tonic: 2 as PitchClass, scale: 'minor' },
        songChords: kho,
        soO: 8,
        tiLeChiaHat,
      })
      const nhip = nhipVong(vong, 4)
      return { vong, nhip, soChia: nhip.filter((x) => x === 2).length / 2 }
    }

    it('đoạn hát chia dưới ngưỡng thì đoạn dạo không chia ô nào', () => {
      /* Một Cõi 1% và Đường Xưa 13% — cả hai có đoạn dạo 0 ô chia. */
      expect(chay(0.01).soChia).toBe(0)
      expect(chay(0.13).soChia).toBe(0)
    })

    it('đoạn hát chia nhiều thì đoạn dạo chia nhiều hơn', () => {
      expect(chay(0.2).soChia).toBeGreaterThan(0)
      expect(chay(0.4).soChia).toBeGreaterThan(chay(0.2).soChia)
    })

    it('đoạn dạo LUÔN chia thưa hơn đoạn hát — 7/7 bài trong bản ký âm', () => {
      for (const hat of [0.2, 0.25, 0.39, 0.4, 0.6]) {
        expect(chay(hat).soChia / 8, `đoạn hát ${hat}`).toBeLessThan(hat)
      }
    })

    it('chia ô KHÔNG làm đoạn dạo dài ra', () => {
      /*
        Ô chia đôi dài nửa ô. Quên chỗ này thì mỗi ô chia cộng thêm một ô trọn và cả
        đoạn dạo dôi ra đúng bằng số ô đã chia.
      */
      for (const hat of [0, 0.2, 0.4, 0.6]) {
        const { nhip } = chay(hat)
        expect(nhip.reduce((a, b) => a + b, 0), `đoạn hát ${hat}`).toBe(32)
      }
    })

    it('dấu nửa ô dính ĐÚNG hai nửa ấy, không dính mọi ô cùng hợp âm', () => {
      /*
        Vòng tám ô rút từ vốn sáu hợp âm thì cùng một `A7` xuất hiện ở nhiều ô. Đánh dấu
        thẳng lên đối tượng hợp âm là mọi ô chứa `A7` cùng bị coi là nửa ô, và đoạn dạo
        co lại còn một nửa độ dài. Vì thế hai nửa của ô chia phải là đối tượng riêng.
      */
      const { vong, nhip } = chay(0.4)
      const nua = vong.filter((_, i) => nhip[i] === 2).map((c) => c.symbol)
      const tron = vong.filter((_, i) => nhip[i] !== 2).map((c) => c.symbol)
      /* Có ký hiệu vừa xuất hiện ở nửa ô vừa ở ô trọn — đó chính là ca dễ sai. */
      expect(nua.some((k) => tron.includes(k))).toBe(true)
    })

    it('ô cuối không bị chia — đó là cửa bậc V cho ca sĩ vào hát', () => {
      const { nhip } = chay(0.6)
      expect(nhip[nhip.length - 1]).toBe(4)
    })
  })
})
