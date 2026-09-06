import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { SOLO_RANGE } from '../../fillSoloGenerator/soloGenerator'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  BỘI SỐ TƯƠI SÁNG — chấm câu dạo giọng trưởng bằng cùng thước với bản ký âm.

  ## Vì sao KHÔNG chấm bằng phần trăm thô

  Người dùng chốt cách đọc: *"tươi sáng"* = **sự chắc chắn** — nốt nằm trên hợp âm, bước đi
  nhỏ, càng về kết càng chắc.

  Nhưng tỉ lệ nốt hợp âm THÔ không so được giữa hai vốn hợp âm khác nhau. Đo trên bài *Hoa
  Trinh Nữ* mà app soạn: hợp âm trung bình **4,33 nốt** (`Cadd2 · Dm11 · G9sus4`), còn ba
  đoạn dạo giọng trưởng của Linh Nhi dùng **3,05 nốt** — gần như toàn hợp âm ba trơn. Rải
  bừa trong gam trên vốn dày ấy đã trúng **64,9%** rồi, so với **43%** trên vốn của chị.

  Nên thước là **BỘI SỐ so với ngẫu nhiên**:

      bội số = (tỉ lệ nốt trúng hợp âm) / (tỉ lệ trúng nếu rải bừa trong gam)

  Mức của Linh Nhi, ba đoạn dạo giọng trưởng: **1,60 · 1,36 · 1,71** — trung bình 1,557.

  ## Vì sao 16 vòng × 4 lượt

  Đo phương sai thật của bộ soạn:

  | | độ lệch chuẩn |
  |---|---|
  | giữa các LƯỢT của cùng một vòng (24 lượt) | 0,067 |
  | giữa các VÒNG hợp âm (6 vòng) | **0,115** |

  Chênh giữa vòng lớn gần gấp đôi giữa lượt — nên **phải đổi vòng**, phát lại một bài nhiều
  lần không giúp mấy. 16 vòng × 4 lượt đưa sai số phía app xuống **0,030**.

  ## CHỖ CHẶN KHÔNG NẰM Ở PHÍA APP — đọc kỹ trước khi siết ngưỡng

  Bản ký âm chỉ có **BA** bài giọng trưởng: 1,60 · 1,36 · 1,71, độ lệch 0,179, **sai số
  chuẩn 0,103**. Con số ấy không giảm được.

  > **Chênh lệch nhỏ nhất phát hiện được là 0,20 bội số**, kể cả khi phía app đo hoàn hảo.

  Nên bài kiểm này **không** đòi app trúng trung bình 1,557. Nó đòi app nằm **trong khoảng
  của chị**, và bắt khi app rơi ra ngoài quá xa. Siết chặt hơn là siết vào nhiễu.

  ## Tầm âm phải đúng tầm app thật

  Dùng `SOLO_RANGE` (62–79). Bài kiểm cũ `daoTruongLinhNhi.test.ts` dùng `{57, 95}` — rộng
  hơn app thật 21 nửa cung, nên nó báo tâm 75,8 đạt neo trong khi app thật ra 70,7. Test
  xanh mà app vẫn lệch: **thước phải bằng đúng thứ đang đo.**
*/

/**
 * Mười sáu vòng hợp âm giọng trưởng, **toàn hợp âm ba nốt trơn**.
 *
 * Ba vòng đầu là chính vòng của ba đoạn dạo Linh Nhi, dịch về Đô/Rê/Sol. Mười ba vòng còn
 * lại giữ đúng lối ấy — mở trên bậc `vi` hoặc `IV` là chính, đi xuống nhiều hơn đi lên —
 * và trải qua sáu giọng để không bám một chủ âm.
 */
const VONG: readonly (readonly [string, number, string])[] = [
  ['Bm | F#m | Em | D | Bm | Em | F#m | D', 2, 'Biển Tình'],
  ['F | Dm | C | Am | Dm | G | Am | C', 0, 'Đường Xưa'],
  ['G | Em | Bm | D | Am | G | Bm | D', 7, 'Mùa Xuân'],
  ['Am | Em | Dm | C | Am | Dm | G | C', 0, 'vi mở, xuống'],
  ['Em | Bm | Am | G | Em | Am | D | G', 7, 'vi mở, Sol'],
  ['Bm | F#m | Em | A | D | Bm | Em | A', 2, 'vi mở, Rê'],
  ['F | C | Dm | Am | Bb | F | C | F', 5, 'IV mở, Fa'],
  ['Eb | Bb | Cm | Gm | Ab | Eb | Bb | Eb', 3, 'IV mở, Mi giáng'],
  ['D | A | Bm | F#m | G | D | A | D', 2, 'I vòng canon'],
  ['C | G | Am | Em | F | C | F | G', 0, 'canon Đô'],
  ['Dm | C | F | Am | Dm | G | C | C', 0, 'ii mở'],
  ['Am | F | C | G | Am | Dm | G | C', 0, 'vi–IV–I–V'],
  ['G | D | Em | Bm | C | G | C | D', 7, 'canon Sol'],
  ['Bb | F | Gm | Dm | Eb | Bb | F | Bb', 10, 'canon Si giáng'],
  ['A | E | F#m | C#m | D | A | E | A', 9, 'canon La'],
  ['C | Am | F | G | Em | Am | Dm | G', 0, 'xuống bậc ba'],
]

const GAM = [0, 2, 4, 5, 7, 9, 11]
const LUOT = 4

/** Bội số và tỉ lệ bước nhỏ của MỘT câu. */
function chamMotCau(txt: string, tonic: number, take: number) {
  const chords = parseChordInput(txt).chords
  const ev = giaiDieuDaoLinhNhi({
    left: [],
    chords,
    beatsPerChord: 4,
    barBeats: 4,
    range: SOLO_RANGE,
    tonic: tonic as PitchClass,
    minor: false,
    take,
    thay: 'linh-nhi',
    doan: 'intro',
  })
  const notes = ev.map((e) => ({ o: Math.floor(e.startBeat / 4), m: e.notes[0]! }))
  if (notes.length === 0) return null

  let trung = 0
  let ngau = 0
  for (const { o, m } of notes) {
    const ch = chords[Math.min(chords.length - 1, o)]!
    const pcs = new Set(
      ch.quality.intervals.map((iv) => ((((ch.root + iv) % 12) + 12) % 12)),
    )
    if (pcs.has((((m % 12) + 12) % 12))) trung += 1
    /* Rải bừa TRONG GAM thì trúng bao nhiêu — mẫu số của bội số. */
    let co = 0
    for (const g of GAM) if (pcs.has(((((tonic + g) % 12) + 12) % 12))) co += 1
    ngau += co / 7
  }

  let nho = 0
  let buoc = 0
  for (let i = 1; i < notes.length; i += 1) {
    const d = Math.abs(notes[i]!.m - notes[i - 1]!.m)
    buoc += 1
    if (d >= 1 && d <= 4) nho += 1
  }

  return {
    boi: trung / ngau,
    nho: buoc === 0 ? 0 : nho / buoc,
    soNot: notes.length,
  }
}

function chamHet() {
  const theoVong: { ten: string; boi: number; nho: number }[] = []
  let tongNot = 0
  for (const [txt, tonic, ten] of VONG) {
    const v: { boi: number; nho: number }[] = []
    for (let take = 0; take < LUOT; take += 1) {
      const r = chamMotCau(txt, tonic, take)
      if (r) {
        v.push(r)
        tongNot += r.soNot
      }
    }
    if (v.length === 0) continue
    theoVong.push({
      ten,
      boi: v.reduce((a, x) => a + x.boi, 0) / v.length,
      nho: v.reduce((a, x) => a + x.nho, 0) / v.length,
    })
  }
  const boi = theoVong.reduce((a, x) => a + x.boi, 0) / theoVong.length
  const nho = theoVong.reduce((a, x) => a + x.nho, 0) / theoVong.length
  return { theoVong, boi, nho, tongNot, soCau: theoVong.length * LUOT }
}

/** Ba đoạn dạo giọng trưởng của Linh Nhi — mốc để so. */
const CHI = { boi: [1.6, 1.36, 1.71], nho: [0.7, 0.54, 0.45] }
const CHI_THAP = Math.min(...CHI.boi)
const CHI_CAO = Math.max(...CHI.boi)

describe('bội số tươi sáng — 16 vòng × 4 lượt', () => {
  const r = chamHet()

  it('cỡ mẫu đủ như đã tính: 64 câu', () => {
    /*
      In số mỗi lần chạy — bàn đo mà không thấy số thì không dùng để sửa được.

      Ghép bằng `join` chứ không dùng dấu xuống dòng thoát: mỗi dòng một phần tử, đọc rõ
      hơn và không vướng chuyện thoát ký tự.
    */
    const xep = [...r.theoVong].sort((a, b) => a.boi - b.boi)
    const ten = (v: { ten: string; boi: number }) => `${v.ten} ${v.boi.toFixed(2)}`
    console.log(
      [
        '',
        `  ${r.soCau} câu · ${r.tongNot} nốt`,
        `  BỘI SỐ   ${r.boi.toFixed(3)}   (Linh Nhi 1,36–1,71 · trung bình 1,557)`,
        `  BƯỚC NHỎ ${(100 * r.nho).toFixed(1)}%   (Linh Nhi 45–70%)`,
        `  thấp nhất: ${xep.slice(0, 3).map(ten).join(' · ')}`,
        `  cao nhất : ${xep.slice(-3).map(ten).join(' · ')}`,
      ].join('\n'),
    )
    expect(r.soCau, `${r.soCau} câu, ${r.tongNot} nốt`).toBe(64)
    expect(r.tongNot).toBeGreaterThan(2000)
  })

  it('BỘI SỐ nằm trong khoảng của chị — 1,36 tới 1,71', () => {
    /*
      KHÔNG đòi trúng trung bình 1,557. Với ba bài mẫu, sai số chuẩn phía bản ký âm là
      0,103 và chênh lệch nhỏ nhất phát hiện được là 0,20 — siết chặt hơn là siết vào nhiễu.
      Nới hai đầu 0,20 đúng bằng ngưỡng ấy.
    */
    expect(r.boi, `bội số ${r.boi.toFixed(3)}`).toBeGreaterThan(CHI_THAP - 0.2)
    expect(r.boi, `bội số ${r.boi.toFixed(3)}`).toBeLessThan(CHI_CAO + 0.2)
  })

  it('không vòng nào rơi hẳn ra ngoài — bắt vòng hỏng riêng lẻ', () => {
    /*
      Trung bình che được một vòng hỏng. Ngưỡng rộng hơn ở đây (0,35) vì mỗi vòng chỉ 4
      lượt, sai số riêng của nó lớn hơn.
    */
    for (const v of r.theoVong) {
      expect(v.boi, `${v.ten}: ${v.boi.toFixed(2)}`).toBeGreaterThan(CHI_THAP - 0.35)
    }
  })

  it('BƯỚC NHỎ — liền bậc cộng quãng ba, chị đạt 45–70%', () => {
    expect(r.nho, `bước nhỏ ${(100 * r.nho).toFixed(1)}%`).toBeGreaterThan(0.35)
  })

  it('mọi vòng đều soạn ra câu, không vòng nào trả rỗng', () => {
    expect(r.theoVong).toHaveLength(VONG.length)
  })
})
