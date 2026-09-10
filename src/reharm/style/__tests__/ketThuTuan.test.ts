import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import type { PitchClass } from '../../../shared/musicTheory/types'

/*
  ĐOẠN KẾT GIỌNG THỨ, điệu Bolero Tuấn — chấm bằng cùng thước với bản ký âm.

  ## Vì sao đoạn kết KHÔNG mượn được khung đoạn dạo

  Đoạn dạo và giang tấu đều đóng bằng **hút V** (`hutDungXa`) để kéo vào phần hát kế.
  Đoạn kết thì ngược lại: nó phải **đóng bài**. Nên không chép khung dạo sang rồi đổi mỗi
  ô cuối — phải đo xem các thầy đóng bài thế nào.

  ## Bốn mốc từ bản ký âm

  Đo `PianoBrain/tools/sheet/ket_thu.py` ngày 9/9/2026 — **9 đoạn kết giọng thứ**, cả ba
  thầy (Linh Nhi 4 · Cà Pháo 2 · Tôn Hùng 2, cộng Nỗi Buồn Hoa Phượng).

  | | bản ký âm |
  |---|---|
  | cao độ tay phải, nửa cuối trừ nửa đầu | **+8,2** nửa cung — **7/9 bài ĐI LÊN** |
  | số nốt tay phải mỗi ô, nửa cuối trừ nửa đầu | **−3,4** — thưa dần |
  | bậc nốt cuối tay phải | **bậc 5** ×4 · bậc 1 ×2 · khác ×3 |
  | mốc tay trái gõ một mình | **48%** |
  | số ô | 3 → 12, trung bình **8,1** |

  ## Chỗ NGƯỢC VỚI TRỰC GIÁC — đọc kỹ trước khi "sửa cho hợp lý"

  Trong mẫu này bảy trên chín bài vọt cao ở nửa sau; đây KHÔNG phải luật cho mọi outro. Có bài
  lên tới +25,9 (*Nỗi Buồn Hoa Phượng*) và +22,4 (*Có Em Chờ*). Hai bài đi xuống đều là
  **Tôn Hùng** — n=2, quá mỏng để thành lối riêng.

  Người dùng đã nói đúng chỗ này khi trả lời phiếu chia đoạn: *"vì đó là kết bài nên chị
  Nhi muốn kéo dài câu hát ra giống như các ca sĩ vẫn hay làm khi biểu diễn."*

  Và nó **không mâu thuẫn** với `slowClose` trong `phraseCue.ts`: hàm ấy chỉ giãn trường độ
  và bớt lực ở **ô chót** (4 phách cuối), không đụng cao độ. Hai thang khác nhau — đoạn dâng
  lên qua cả đoạn, rồi ô chót mới chậm lại.

  ## Bài kiểm này KHÔNG bắt app phải giống hệt

  Cỡ mẫu bản ký âm là 9 đoạn, gộp nhiều thầy/điệu và độ lệch rất lớn (−11,9 tới +25,9).
  Không đủ cơ sở bắt cả DẤU của một tiểu cú Bolero phải giống trung bình này.
  Giữ số đo để quan sát; kiểm hồi quy bằng nguồn, thời gian và cadence cụ thể.
*/

const STYLE = 'bolero-tu-n-improv-bai-04-00001'

/*
  BÀN ĐO PHẢI CHẠY ĐÚNG NHÁNH APP DÙNG — bẫy đã sập một lần ở chính file này.

  Bản đầu chỉ gọi không truyền `thay`, nên nó đo nhánh mặc định trong `phraseChords`.
  Nhưng bài thật của người dùng đi nhánh **`vonHopAmLinhNhi`** — một đường hoàn toàn
  khác, vốn đã dài 8 ô từ trước. Kết quả: bàn đo báo "đã sửa xong" trong khi vòng hợp
  âm người dùng nhìn thấy trên màn hình không đổi một ô nào.

  Cùng họ với cái bẫy `daoTruongLinhNhi.test.ts` từng mắc (đo bằng tầm `{57,95}` trong
  khi app chạy `SOLO_RANGE`). Nên từ đây đo **cả hai nhánh**.
*/

type Thay = 'linh-nhi' | 'ca-phao' | null

/** Một đoạn kết giọng thứ do app soạn, ở La thứ. */
function ketThu(take: number, tonic: PitchClass = 9, thay: Thay = null) {
  const delta = tonic - 9
  const chords = parseChordInput('Am Dm G C F E E7 Em').chords.map((c) =>
    delta === 0
      ? c
      : {
          ...c,
          root: ((c.root + delta + 12) % 12) as PitchClass,
          symbol:
            pitchClassName(((c.root + delta + 12) % 12) as PitchClass) + c.quality.symbol,
        },
  )
  return buildPhraseSection({
    kind: 'outro',
    key: { tonic, scale: 'minor' },
    style: getStyle(STYLE)!,
    beatsPerChord: 4,
    dropRoot: true,
    opening: chords[0]!,
    songChords: chords,
    solo: () => [],
    take,
    daoTruong: false,
    ...(thay ? { thay } : {}),
  })!
}

/** Chấm một đoạn theo đúng bốn mốc của bản ký âm. */
function cham(take: number, tonic: PitchClass = 9, thay: Thay = null) {
  const s = ketThu(take, tonic, thay)
  const phai = s.events.filter((e) => e.hand === 'right')
  const trai = s.events.filter((e) => e.hand === 'left')
  if (phai.length === 0) return null

  const soO = Math.max(1, Math.round(s.lengthBeats / 4))
  const nua = Math.floor(soO / 2) || 1
  const trong = (a: number, b: number) =>
    phai.filter((e) => e.startBeat >= a * 4 && e.startBeat < b * 4)

  const dau = trong(0, nua)
  const cuoi = trong(soO - nua, soO)
  const tb = (v: typeof phai) =>
    v.length === 0 ? null : v.reduce((a, e) => a + Math.max(...e.notes), 0) / v.length

  const caoDau = tb(dau)
  const caoCuoi = tb(cuoi)

  /* Mốc tay trái gõ MỘT MÌNH — cùng phép đếm với `ket_thu.py`. */
  const mocPhai = new Set(phai.map((e) => e.startBeat.toFixed(3)))
  const mocTrai = new Set(trai.map((e) => e.startBeat.toFixed(3)))
  let rieng = 0
  for (const m of mocTrai) if (!mocPhai.has(m)) rieng += 1

  const chot = phai.reduce((a, e) => (e.startBeat > a.startBeat ? e : a), phai[0]!)

  return {
    soO,
    caoDoi: caoDau === null || caoCuoi === null ? null : caoCuoi - caoDau,
    matDoi: cuoi.length / nua - dau.length / nua,
    bacChot: (((chot.notes[0]! - tonic) % 12) + 12) % 12,
    rieng: mocTrai.size === 0 ? 0 : rieng / mocTrai.size,
  }
}

const LUOT = 24

describe.each([
  ['nhánh mặc định', null as Thay],
  ['nhánh Linh Nhi', 'linh-nhi' as Thay],
])('đoạn kết giọng thứ — Bolero Tuấn · %s', (_ten, thay) => {
  const cac = Array.from({ length: LUOT }, (_, t) => cham(t, 9, thay)).filter(
    (x): x is NonNullable<typeof x> => x !== null,
  )

  it('soạn ra đoạn kết ở mọi lượt, và in số để đối chiếu', () => {
    const tb = (f: (r: (typeof cac)[number]) => number | null) => {
      const v = cac.map(f).filter((x): x is number => x !== null)
      return v.length === 0 ? NaN : v.reduce((a, b) => a + b, 0) / v.length
    }
    const len = cac.filter((r) => r.caoDoi !== null && r.caoDoi > 0).length
    const bac = new Map<number, number>()
    for (const r of cac) bac.set(r.bacChot, (bac.get(r.bacChot) ?? 0) + 1)
    const TEN = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']

    console.log(
      [
        '',
        `  ${cac.length} lượt · ${cac[0]!.soO} ô mỗi đoạn   (bản ký âm: 3–12 ô, trung bình 8,1)`,
        `  CAO ĐỘ   ${tb((r) => r.caoDoi).toFixed(1)}   đi lên ${len}/${cac.length} lượt` +
          `   (bản ký âm +8,2 · lên 7/9)`,
        `  MẬT ĐỘ   ${tb((r) => r.matDoi).toFixed(1)} nốt/ô   (bản ký âm −3,4)`,
        `  LH RIÊNG ${(100 * tb((r) => r.rieng)).toFixed(0)}%   (bản ký âm 48%)`,
        `  BẬC CHÓT ${[...bac.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([b, n]) => `${TEN[b]}×${n}`)
          .join(' · ')}   (bản ký âm: 5×4 · 1×2)`,
      ].join('\n'),
    )
    expect(cac.length).toBe(LUOT)
  })

  it('cadence về chủ thứ ở mọi lượt, không đổi nửa câu để ép trung bình cao độ', () => {
    for (let take = 0; take < LUOT; take += 1) {
      const section = ketThu(take, 9, thay)
      expect(section.sourcePhrase).toBeDefined()
      expect(section.chords.at(-1)).toBe('Am')
    }
  })

  it('độ dài đúng nguồn cộng phách chốt; không xoá nốt để ép mật độ', () => {
    for (let take = 0; take < LUOT; take += 1) {
      const section = ketThu(take, 9, thay)
      expect(section.lengthBeats).toBe(section.sourcePhrase!.barCount * 4 + 1)
      expect(section.events.every((e) => e.durationBeats > 0 &&
        e.startBeat + e.durationBeats <= section.lengthBeats + 1e-6)).toBe(true)
    }
  })

  it('HAI TAY ĐỐI ĐÁP — mốc tay trái gõ một mình, bản ký âm 48%', () => {
    /*
      Nới rộng: chín đoạn bản ký âm trải từ 30% tới 79%. Bắt khi hai tay dính hẳn vào nhau
      (dưới 20%) hoặc rời hẳn ra (trên 90%).
    */
    const v = cac.map((r) => r.rieng)
    const tb = v.reduce((a, b) => a + b, 0) / v.length
    expect(tb, `LH gõ riêng ${(100 * tb).toFixed(0)}%`).toBeGreaterThan(0.2)
    expect(tb, `LH gõ riêng ${(100 * tb).toFixed(0)}%`).toBeLessThan(0.9)
  })
})
