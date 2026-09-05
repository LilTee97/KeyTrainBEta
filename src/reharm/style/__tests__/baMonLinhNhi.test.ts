import { describe, expect, it } from 'vitest'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import { scaleForChord } from '../../brain/chordScale'
import { parseChordInput } from '../../input/chordInputParser'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  BA MÓN ĐO ĐƯỢC TRÊN BẢN KÝ ÂM MÀ CODE TỪNG KHÔNG CÓ.

  Cả ba đều đo trên bảy sheet Linh Nhi trong `PianoBrain/video/Linh_Nhi/`, và cả ba đều
  từng nằm ở mục "đã đo nhưng code chưa có" của `knowledge/teachers/linh-nhi-piano.md`.
*/

const THU = 'Dm | C | Bb | F | Gm | Dm | A7 | Dm'
const TRUONG = 'C | Am | Dm | G | C | F | G7 | C'

const doan = (kind: 'intro' | 'outro', txt: string, tonic: number, minor: boolean) => {
  const key = { tonic: tonic as PitchClass, scale: minor ? ('minor' as const) : ('major' as const) }
  const chords = parseChordInput(txt).chords
  return buildPhraseSection({
    kind,
    key,
    style: getStyle('bolero-linh-nhi-3')!,
    thay: 'linh-nhi',
    beatsPerChord: 4,
    dropRoot: true,
    take: 0,
    songChords: chords,
    opening: chords[0]!,
    solo: (c) =>
      soloToTimeline(
        generateSolo(c, {
          beatsPerChord: 4,
          density: 'dense',
          key,
          take: 0,
          noteSource: 'storeScale',
          interlude: true,
          storeScale: scaleForChord,
        }),
      ),
  })!
}

const mocMoiO = (d: ReturnType<typeof doan>, tay: 'left' | 'right') => {
  const o = Math.max(1, Math.round(d.lengthBeats / 4))
  return new Set(d.events.filter((e) => e.hand === tay).map((e) => e.startBeat)).size / o
}

describe('MÓN 1 — giang tấu lấy lại câu dạo', () => {
  /*
    Đo sáu bài có giang tấu: tuyến nốt neo của giang tấu trùng **78%** tuyến đoạn dạo
    (Mùa Xuân 100% · Biển Tình 89% · Đừng Xa 89% · Lá Thư 67% · Đường Xưa 62% · Một Cõi
    60%). Ba bài trên 89% là CÙNG MỘT CÂU, chỉ thêm một ô mở ở đầu.

    Trước đó giang tấu dùng `raiLinhNhi` — tay phải bám mốc tay trái và sinh nốt riêng —
    nên hai đoạn ra hai câu khác nhau, ngược bản ký âm.
  */
  const neo = (ev: ReturnType<typeof giaiDieuDaoLinhNhi>) => {
    const per = new Map<number, number[]>()
    for (const e of ev) {
      const o = Math.floor(e.startBeat / 4)
      per.set(o, [...(per.get(o) ?? []), e.notes[0]!])
    }
    return [...per.keys()]
      .sort((a, b) => a - b)
      .map((o) => {
        const dem = new Map<number, number>()
        for (const n of per.get(o)!) dem.set(n, (dem.get(n) ?? 0) + 1)
        return [...dem.entries()].sort((x, y) => y[1] - x[1])[0]![0]
      })
  }
  const chung = (a: number[], b: number[]) => {
    const m = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
    for (let i = 0; i < a.length; i += 1)
      for (let j = 0; j < b.length; j += 1)
        m[i + 1]![j + 1] = a[i] === b[j] ? m[i]![j]! + 1 : Math.max(m[i]![j + 1]!, m[i + 1]![j]!)
    return m[a.length]![b.length]!
  }

  it('cùng lượt thì giang tấu ra ĐÚNG câu dạo', () => {
    /*
      Vòng hợp âm của hai đoạn vốn đã trùng 77%, nên chỉ cần cùng `take` là ra cùng câu.
      Từng thử thêm phép lệch một ô cho khớp chỗ Biển Tình thêm ô mở ở đầu giang tấu,
      nhưng lệch ô làm hợp âm và vị trí ô không còn khớp nhau, bộ lọc bậc phá mất phép
      căn và tỉ lệ trùng tụt xuống 50%.
    */
    for (const [txt, tonic, minor] of [
      [THU, 2, true],
      [TRUONG, 0, false],
    ] as const) {
      const P = {
        left: [],
        chords: parseChordInput(txt).chords,
        beatsPerChord: 4,
        barBeats: 4,
        range: { low: 57, high: 95 },
        tonic: tonic as PitchClass,
        minor,
      }
      for (const take of [0, 3]) {
        const dao = neo(giaiDieuDaoLinhNhi({ ...P, take }))
        const giang = neo(giaiDieuDaoLinhNhi({ ...P, take }))
        const khac = neo(giaiDieuDaoLinhNhi({ ...P, take: take + 1 }))
        expect(chung(dao, giang) / dao.length, `${txt} lượt ${take}`).toBe(1)
        /* Lượt khác thì phải khác — nếu không thì phép đổi lượt hỏng. */
        expect(chung(dao, khac) / dao.length).toBeLessThan(1)
      }
    }
  })
})

describe('MÓN 2 — điệp khúc dày bằng NẮM DÀY HƠN', () => {
  /*
    Đo 2125 mốc gõ tay trái ở phiên khúc và 1026 ở điệp khúc, cả bảy sheet:

    | | mốc gõ | nốt mỗi mốc |
    |---|---|---|
    | phiên khúc | không đổi | **1,22** |
    | điệp khúc | không đổi | **1,60** |

    Số mốc gõ gần như đứng yên (6,6→6,4 giọng thứ, 7,7→7,8 giọng trưởng); thứ tăng là số
    NỐT mỗi mốc. Thêm mốc cho điệp khúc thì ra tiếng dồn dập chứ không ra tiếng dày.

    Và nắm dày rơi vào PHÁCH LẺ: off-beat 1,74-1,96 nốt/mốc trong khi phách 0 và 2 chỉ
    1,30-1,32. Phách mạnh là chỗ bass trụ, chị ấy để một nốt.
  */
  /* Đọc thẳng ô nhịp của điệu — `patternStrikes` không giữ số nốt mỗi mốc. */
  const trai = (styleId: string) => getStyle(styleId)!.cell?.left ?? []
  const dayCua = (styleId: string) => {
    const c = trai(styleId)
    const not = c.reduce((a, x) => a + (x.tones ?? []).length, 0)
    return { moc: c.length, not, tren: not / c.length }
  }

  it('phiên khúc 1,22 và điệp khúc 1,60 nốt mỗi mốc', () => {
    const phien = dayCua('bolero-linh-nhi-3')
    const diep = dayCua('bolero-linh-nhi-3-chorus')
    /* Cũ: phiên 1,00 (quá mỏng) và điệp 2,33 (quá dày). */
    expect(phien.tren).toBeGreaterThan(1.1)
    expect(phien.tren).toBeLessThan(1.35)
    expect(diep.tren).toBeGreaterThan(1.45)
    expect(diep.tren).toBeLessThan(1.75)
  })

  it('điệp khúc KHÔNG gõ nhiều mốc hơn phiên khúc', () => {
    /* Đây là chỗ dễ làm sai nhất. Số mốc phải bằng nhau, chỉ nốt mỗi mốc mới tăng. */
    expect(dayCua('bolero-linh-nhi-3-chorus').moc).toBe(dayCua('bolero-linh-nhi-3').moc)
  })

  it('phách mạnh của điệp khúc vẫn để MỘT nốt', () => {
    /* Đo: phách 0 là 1,32 và phách 2 là 1,30 nốt/mốc — mỏng hơn hẳn off-beat. */
    const c = trai('bolero-linh-nhi-3-chorus')
    for (const beat of [0, 2]) {
      const cu = c.find((x) => Math.abs(x.beat - beat) < 1e-6)
      expect(cu, `phách ${beat}`).toBeDefined()
      expect((cu!.tones ?? []).length, `phách ${beat}`).toBe(1)
    }
  })
})

describe('MÓN 3 — tay trái mỏng đi ở đoạn không lời', () => {
  /*
    Mốc gõ tay trái mỗi ô, đo bảy sheet:

    | | phần hát | dạo | kết |
    |---|---|---|---|
    | giọng thứ | 6,5 | **4,6** | **4,9** |
    | giọng trưởng | 7,7 | **6,8** | **3,2** |

    App trước đó ra 6,8 ở đoạn dạo (đúng cho giọng trưởng, quá dày cho giọng thứ) và
    **9,0 ở cả hai đoạn kết** — gấp đôi tới gấp ba bản ký âm.
  */
  const DICH: [string, 'intro' | 'outro', string, number, boolean, number][] = [
    ['thứ · dạo', 'intro', THU, 2, true, 4.6],
    ['thứ · kết', 'outro', THU, 2, true, 4.9],
    ['trưởng · dạo', 'intro', TRUONG, 0, false, 6.8],
    ['trưởng · kết', 'outro', TRUONG, 0, false, 3.2],
  ]

  it('bốn chỗ đều nằm trong sai số 1 mốc so với bản ký âm', () => {
    for (const [ten, kind, txt, tonic, minor, dich] of DICH) {
      const thuc = mocMoiO(doan(kind, txt, tonic, minor), 'left')
      expect(Math.abs(thuc - dich), `${ten}: ra ${thuc.toFixed(1)}, sheet ${dich}`).toBeLessThan(1)
    }
  })

  it('ĐOẠN KẾT mỏng hơn đoạn dạo ở giọng trưởng', () => {
    /* 3,2 so với 6,8 — chưa bằng một nửa. Đây là chỗ sai nặng nhất của bản cũ. */
    const dao = mocMoiO(doan('intro', TRUONG, 0, false), 'left')
    const ket = mocMoiO(doan('outro', TRUONG, 0, false), 'left')
    expect(ket).toBeLessThan(dao * 0.6)
  })

  it('đoạn dạo giọng TRƯỞNG không bị hãm — nó vốn đã đúng', () => {
    /*
      6,8 mốc/ô là đúng bằng bản ký âm. Hãm thêm vào là hỏng chỗ đang đúng, nên
      `phraseSection` cố ý để `mocToiDa` rỗng cho ca này.
    */
    expect(mocMoiO(doan('intro', TRUONG, 0, false), 'left')).toBeGreaterThan(6)
  })
})

describe('MÓN 4 — hai tay CÀI vào nhau, và câu nằm đúng tầm', () => {
  /*
    Người dùng nghe rồi báo: *"sao các câu intro giờ lại mất hẳn kết hợp giữa hai tay
    trái phải rồi."*

    Đo thì hai tay KHÔNG rời nhau — chúng dính nhau quá chặt: 76-79% mốc tay trái gõ cùng
    tay phải, so với **59%** của bốn bản ký âm giọng thứ. Thứ mất là **tiếng nói riêng
    của tay trái**: bản ký âm để 41% mốc tay trái gõ MỘT MÌNH, xen giữa các nốt tay phải;
    app chỉ còn 21-24%.

    Nguyên nhân: trần tay trái đặt theo SỐ MỐC TUYỆT ĐỐI. Chỉnh trên `bolero-linh-nhi-3`
    (9 cú gõ một ô) ra đúng 4,4 mốc/ô, nhưng áp sang `bolero-linh-nhi-2` thì cùng trần ấy
    ra 3,7. Nay đặt theo TỈ LỆ.

    Bài học ghi lại: *"hai tay không ăn nhau"* có thể là **quá dính**, không chỉ quá rời.
  */
  const doiTay = (kind: 'intro' | 'outro', txt: string, tonic: number, minor: boolean, styleId: string) => {
    const d = (() => {
      const key = { tonic: tonic as PitchClass, scale: minor ? ('minor' as const) : ('major' as const) }
      const chords = parseChordInput(txt).chords
      return buildPhraseSection({
        kind,
        key,
        style: getStyle(styleId)!,
        thay: 'linh-nhi',
        beatsPerChord: 4,
        dropRoot: true,
        take: 0,
        songChords: chords,
        opening: chords[0]!,
        solo: (c) =>
          soloToTimeline(
            generateSolo(c, {
              beatsPerChord: 4,
              density: 'dense',
              key,
              take: 0,
              noteSource: 'storeScale',
              interlude: true,
              storeScale: scaleForChord,
            }),
          ),
      })!
    })()
    const trai = new Set(d.events.filter((e) => e.hand === 'left').map((e) => e.startBeat))
    const phai = new Set(d.events.filter((e) => e.hand === 'right').map((e) => e.startBeat))
    const ca = [...trai].filter((b) => phai.has(b)).length
    const not = d.events.filter((e) => e.hand === 'right').flatMap((e) => e.notes)
    return {
      moc: trai.size / Math.max(1, Math.round(d.lengthBeats / 4)),
      motMinh: 1 - ca / Math.max(1, trai.size),
      tam: not.reduce((a, b) => a + b, 0) / Math.max(1, not.length),
    }
  }

  it('tay trái vẫn còn mốc gõ MỘT MÌNH — bản ký âm 41%', () => {
    for (const sid of ['bolero-linh-nhi-2', 'bolero-linh-nhi-3']) {
      const r = doiTay('intro', THU, 9, true, sid)
      /* Cũ: 21-24%, tức tay trái gần như không bao giờ nói một mình. */
      expect(r.motMinh, `${sid}: ${(r.motMinh * 100).toFixed(0)}%`).toBeGreaterThan(0.3)
    }
  })

  it('TỈ LỆ chứ không phải số mốc — hai mẫu đệm khác nhau ra cùng mật độ', () => {
    /*
      Chốt chặn của cách đặt theo tỉ lệ. Trần tuyệt đối thì `bolero-linh-nhi-2` ra 3,7
      còn `bolero-linh-nhi-3` ra 4,4 — lệch nhau nửa mốc trên cùng một bài.
    */
    const a = doiTay('intro', THU, 9, true, 'bolero-linh-nhi-2').moc
    const b = doiTay('intro', THU, 9, true, 'bolero-linh-nhi-3').moc
    expect(Math.abs(a - b)).toBeLessThan(0.5)
    expect(Math.abs(a - 4.6)).toBeLessThan(0.6)
  })

  it('đoạn dạo giọng TRƯỞNG vẫn không bị hãm', () => {
    /* 6,8 mốc/ô là đúng bản ký âm; đặt tỉ lệ 0,88 vào thì tụt còn 6,2. */
    expect(doiTay('intro', TRUONG, 0, false, 'bolero-linh-nhi-2').moc).toBeGreaterThan(6.4)
  })

  it('câu nằm quanh tầm tuyệt đối D5, không tụt xuống vùng tay trái', () => {
    /*
      Đo bảy đoạn dạo: cao độ trung bình tay phải 70,4 · 72,1 · 72,8 · 74,2 · 75,0 · 75,4
      · 75,5 — trung bình **73,6 (D5)**, lệch chuẩn chỉ **1,9** qua năm giọng khác nhau.

      Cũ neo theo tầm bản ký âm NGUỒN, nên bài La thứ ghép ô của Đừng Xa (Rê) ra
      `doi = −12` và câu tụt xuống F#4-G4 — thấp hơn bảy nửa cung.

      Phép dời chỉ đi theo quãng tám nguyên (dời lẻ là phá đường đi), nên sai số còn lại
      bị chặn ở ±6 nửa cung. Đòi trong khoảng ấy là đòi hết mức làm được.
    */
    for (const [txt, tonic, minor] of [
      [THU, 9, true],
      [TRUONG, 0, false],
      [THU, 2, true],
      [TRUONG, 7, false],
    ] as const) {
      const tam = doiTay('intro', txt, tonic, minor, 'bolero-linh-nhi-2').tam
      expect(Math.abs(tam - 73.6), `chủ âm ${tonic}: tầm ${tam.toFixed(1)}`).toBeLessThanOrEqual(6)
    }
  })
})
