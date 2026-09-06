import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'
import type { SoloTeacher } from '../fillSoloGenerator/soloTeacher'
import { TUYEN_SOLO, gocTuyen, type OSolo } from './tuyenSolo'

/**
 * Giai điệu tay phải đoạn dạo — **ghép mảnh từ những ô nhịp có thật**.
 *
 * ## Đường đi tới đây
 *
 * | bản | cách làm | vì sao bỏ |
 * |---|---|---|
 * | 1 | sáu mẫu gõ tay, bậc theo hợp âm | 3,8-5,0 nốt/ô, bài trưởng chỉ 4 bậc |
 * | 2 | chép mười ô nhịp thật, vẫn theo hợp âm | đủ mật độ, nhưng mười ô rời nhau |
 * | 3 | một đường nốt neo lấy từ Đừng Xa | sang vòng hợp âm khác thì ra nốt lỗi |
 * | 4 | ghép NGUYÊN một tuyến vào bài | nốt đều thật, nhưng vòng hoà thanh của bài không được đếm xỉa |
 *
 * Bản 4 dán cả câu Biển Tình lên một bài có vòng hoà thanh khác hẳn. Người dùng đòi
 * bậc tiếp: *"đã đọc được tuyến giai điệu vậy bạn có thể tư duy như Linh Nhi để tạo ra
 * tuyến giai điệu từ những vòng hoà thanh khác nhau không... được quyền hoà trộn các
 * tuyến giọng trưởng với nhau và giọng thứ cũng vậy."*
 *
 * ## Tư duy tạo tuyến, viết thành ba phép chọn
 *
 * Mỗi ô của bài đang mở được ghép bằng **một ô nhịp có thật** trong bảy câu dạo, chọn
 * theo ba tiêu chí xếp thứ tự:
 *
 * 1. **Cùng bậc hợp âm.** Ô đứng trên bậc IV thì chỉ lấy ô cũng đứng trên bậc IV.
 *    Không có bậc khớp thì hạ xuống cùng CHỨC NĂNG (chủ · hạ át · át).
 * 2. **Nối được giọng.** Nốt đầu ô mới phải gần nốt cuối ô trước. Đây là chỗ giữ cho
 *    tám ô thành MỘT câu chứ không phải tám mảnh dán cạnh nhau — đúng lỗi của bản 2.
 * 3. **Ở lại cùng một bài càng lâu càng tốt.** Nhảy bài giữa câu là đứt hơi, nên đổi
 *    nguồn phải trả giá. Nhờ điểm phạt này mà ghép vào đúng vòng hoà thanh của một bản
 *    ký âm thì ra lại nguyên câu của chính bài ấy.
 *
 * Thêm hai luật vị trí đo được từ bản ký âm: ô đầu ưu tiên lấy ô ĐẦU của một câu, ô
 * cuối ưu tiên lấy ô CUỐI — ô cuối là ô "cửa" thưa hẳn ra để ca sĩ vào hát.
 *
 * KHÔNG có bước nào nắn cao độ cho vừa hợp âm. Nắn là quay lại kiểu soạn nốt theo luật
 * đã bị bác ba lần. Ngoại lệ duy nhất là nốt cảm bậc V, có số đo riêng bên dưới.
 *
 * ## Trưởng ra trưởng, thứ ra thứ
 *
 * `locO()` lọc `t.thu === thu` trước mọi thứ khác, nên ô của bài trưởng không bao giờ
 * lọt vào bài thứ. Giọng lấy từ `key` mà bước tái hoà thanh đã xác định; `ScaleType`
 * chỉ có hai giá trị `major | minor` nên không có ngả thứ ba.
 */

/**
 * NÂNG NỐT CẢM TRÊN HỢP ÂM BẬC V.
 *
 * Đo hai chỗ: Đừng Xa ô 7 (hợp âm A7, chị đánh C#) và Một Cõi ô 8 (D7, đánh C#) — bậc
 * 7 THĂNG chứ không phải ♭7 của gam thứ tự nhiên. Cỡ mẫu **n=2**, nên chỉ nâng khi hợp
 * âm đang vang CHỨA THẬT nốt ấy, không nâng theo bậc.
 */
const NOT_CAM = true

/**
 * MỨC BÁM HỢP ÂM của bản ký âm — tỉ lệ nốt giai điệu nằm trên hợp âm đang vang.
 *
 * Đo bảy bản ký âm Linh Nhi, tách theo giọng và theo đoạn. Hai giọng **đi ngược chiều** về
 * phía cuối câu, đó là chỗ đáng nhớ nhất trong bảng:
 *
 * | | dạo | giang | kết |
 * |---|---|---|---|
 * | **trưởng** | 68% | 68% | **75%** — siết dần lại |
 * | **thứ** | 69% | 59% | **50%** — càng về cuối càng rời |
 *
 * Gộp cả bài: trưởng **70,2%**, thứ **59,9%** (n=406 và 601).
 *
 * Người dùng nêu rằng câu giọng trưởng nghe **tươi sáng** hơn, và số đo nói cái tai nghe
 * ra ấy chính là **sự chắc chắn** — nốt nằm trên hợp âm, bước đi nhỏ, càng về kết càng
 * chắc. Cách đọc này người dùng đã xác nhận. Xem `linh-nhi-piano.md` mục 6b.
 *
 * ĐO TRÊN SHEET LINH NHI. Cà Pháo và Tôn Hùng chưa đo mức này theo đoạn; hai thầy ấy dùng
 * tạm bảng này cho tới khi có số riêng.
 */
const DICH_HOP = {
  truong: { intro: 0.68, interlude: 0.68, outro: 0.75 },
  thu: { intro: 0.69, interlude: 0.59, outro: 0.5 },
} as const

/** Bậc của gam trưởng so với chủ âm — dùng để bắt nốt lạc khi ghép bài giọng trưởng. */
const GAM_TRUONG = new Set([0, 2, 4, 5, 7, 9, 11])

/**
 * Tầm tuyệt đối của đoạn dạo — cao độ trung bình tay phải, tính bằng MIDI, THEO TỪNG THẦY.
 *
 * Đo riêng **đoạn dạo** của từng thầy, tách trưởng/thứ:
 *
 * | thầy | trưởng | thứ |
 * |---|---|---|
 * | Linh Nhi | **75,3** — Biển Tình 75,2 · Đường Xưa 74,5 · Mùa Xuân 76,0 (n=141) | **73,2** — Đừng Xa 70,8 · Lá Thư 76,1 · Một Cõi 72,7 · Rừng Lá 73,6 (n=239) |
 * | Cà Pháo | **70,8** — Hồng Kông 70,7 · Có Em Chờ 71,5 · Ngày Mai 70,4 (n=263) | **68,0** — một bài (n=62) |
 * | Tôn Hùng | *(không có bài giọng trưởng)* | **75,8** — Chiếc Lá 74,4 · Tình Em 76,9 (n=97) |
 *
 * **Cà Pháo thấp hơn Linh Nhi 4,5 nửa cung ở giọng trưởng và 5,2 ở giọng thứ.** Dùng neo
 * của Linh Nhi cho anh ấy thì câu cao hơn thầy thật gần nửa quãng tám.
 *
 * **Số cũ:** một hằng số **73,6** dùng chung cho mọi thầy mọi giọng, lấy trung bình bảy
 * đoạn dạo Linh Nhi. Rồi tách thành `TAM_TRUONG = 75.3` / `TAM_THU = 73.2` — vẫn là số của
 * riêng Linh Nhi, áp cho cả ba thầy.
 *
 * **Đừng lấy con số 67 trong `ca-phao.md`.** Đó là tâm gộp cả ba đoạn solo (dạo · giang ·
 * kết) trên 828 nốt; riêng đoạn dạo là 70,8. Hai mẫu số khác nhau.
 *
 * **Cỡ mẫu mỏng:** Cà Pháo giọng thứ chỉ có **một bài**. Nghe thấy sai thì kiểm số này
 * trước. Triệu chứng để lùi: đặt cao hơn thì câu chạm trần tầm tay phải và phép gập quãng
 * tám bẻ nốt biên xuống, nghe ra chỗ gãy giữa câu.
 */
const TAM: Record<Exclude<SoloTeacher, null>, { truong: number; thu: number }> = {
  'linh-nhi': { truong: 75.3, thu: 73.2 },
  'ca-phao': { truong: 70.8, thu: 68.0 },
  /* Tôn Hùng không có bản ký âm giọng trưởng — cột ấy lấy số của giọng thứ. */
  'ton-hung': { truong: 75.8, thu: 75.8 },
}

/*
  ĐÃ THỬ RỒI BỎ: phép chuộng ô đủ dày cho tay phải.

  Bản ký âm cho tay phải **6,9 nốt/ô ở giọng thứ** và **5,5 ở giọng trưởng**; app ra 5,6
  và 5,4. Vốn ô trong bảng thừa sức đạt — trung bình 7,1 (thứ) và 5,7 (trưởng).

  Đã thêm một số hạng phạt theo khoảng cách mật độ, quét trọng số 0,5 · 0,6 · 1,2 · 1,5 ·
  2 · 3. Giọng thứ **đứng yên ở 5,6 với mọi trọng số** trừ mức 3, mà mức 3 lại đẩy giọng
  trưởng từ 5,4 lên 6,4 — hỏng chỗ đang đúng.

  Lý do: vòng hợp âm đoạn dạo do `vonHopAmLinhNhi` rút ra, và bộ lọc CÙNG BẬC thường chỉ
  còn một ô ứng cử mỗi chỗ. Không còn gì để chọn thì cho điểm kiểu nào cũng vô nghĩa.

  Muốn nâng mật độ tay phải giọng thứ thì phải nới bộ lọc bậc — tức đổi hoà thanh lấy mật
  độ. Chưa làm, vì hoà thanh là thứ đã đo chắc còn mật độ mới lệch một phần năm.
*/

/**
 * Chức năng hoà thanh của từng bậc — dùng khi không có ô nào cùng bậc.
 *
 * Thà lấy ô cùng chức năng còn hơn lấy bừa: ô đứng trên một bậc hạ át nghe vẫn xuôi ở
 * chỗ hạ át khác, còn lấy ô bậc át đặt vào chỗ chủ âm là hỏng hướng câu.
 */
function chuc(bac: number, thu: boolean): 'chu' | 'ha' | 'at' {
  if (thu) {
    if (bac === 0 || bac === 3) return 'chu'
    if (bac === 5 || bac === 8 || bac === 10) return 'ha'
    return 'at'
  }
  if (bac === 0 || bac === 9 || bac === 4) return 'chu'
  if (bac === 5 || bac === 2) return 'ha'
  return 'at'
}

type Manh = {
  tuyen: string
  chuGoc: PitchClass
  i: number
  cuoi: boolean
  o: OSolo
  /** Ô này lấy từ đoạn khác (giang tấu · kết) chứ không phải đoạn đang soạn. */
  muon: boolean
}

type NguonTuyen = {
  id: string
  thu: boolean
  phach: number
  chuGoc: PitchClass
  o: readonly OSolo[]
  muon: boolean
}

/**
 * VỐN Ô của một lượt soạn — lấy từ `tuyenSolo.ts`, sinh lại bằng `tools/tuyen_o.py`.
 *
 * BẢNG CŨ `tuyenDaoLinhNhi.ts` ĐÃ XOÁ. Nó chỉ khớp `data/sheet-solos` của PianoBrain
 * **118/276 nốt** trong khi bảng này khớp **285/285**, và người dùng nghe ra chỗ sai
 * bằng tai trước khi đo: ô `duong-xua` số 7 trong bảng cũ ghi `F#` và `C#` ở hai chỗ mà
 * bản ký âm ghi `F` và `C` — cả hai đều là nốt của chính hợp âm `G9sus4` đang vang. Xem
 * mục "Ý kiến khi nghe", câu #29 và #40 trong `knowledge/teachers/linh-nhi-piano.md`.
 */
export function vonO(
  thay: Exclude<SoloTeacher, null>,
  doan: 'intro' | 'interlude' | 'outro',
): readonly NguonTuyen[] {
  /*
    VỐN Ô GỘP CẢ BA ĐOẠN, ô của đoạn khác chịu một điểm phạt.

    Lấy riêng đoạn đang soạn thì vốn mỏng tới mức có bậc chỉ còn MỘT ô. Đo trên vốn của
    Linh Nhi, giọng trưởng, bậc IV: **1 ô, và ô ấy mang sẵn quãng ba tăng** — nên mọi
    bài giọng trưởng đều nghe cùng một nốt chói ở chỗ ấy, đổi bao nhiêu lượt cũng vậy.
    Đúng như người dùng báo: *"chỗ Fadd2 nghe nhiều nốt lệch nhất dù chuyển qua bao
    nhiêu câu"*.

    | bậc (giọng trưởng) | chỉ đoạn dạo | gộp ba đoạn |
    |---|---|---|
    | I | 6 ô sạch / 6 | 23/23 |
    | ii | 4/4 | 8/8 |
    | **IV** | **0/1** | **6/8** |
    | V | 3/3 | 9/10 |
    | vi | 5/5 | 13/13 |

    "Sạch" = không có nốt nào cách gốc hợp âm một quãng ba tăng.
  */
  return TUYEN_SOLO.filter((t) => t.thay === thay).map((t) => ({
    ...t,
    muon: t.doan !== doan,
  }))
}

/** Bậc của gam THỨ, gộp cả ba gam — xem luật 6 trong `LUAT-SOAN-NOT.md`. */
const GAM_THU = new Set([0, 2, 3, 5, 7, 8, 9, 10, 11])

/**
 * Ô này có nốt nào nằm ngoài gam của bài không.
 *
 * Cao độ trong bảng ghi theo nửa cung so với chủ âm BẢN GỐC, mà phép ghép dịch cả ô theo
 * chủ âm bài mới — nên bậc so với gam giữ nguyên, kiểm ngay trên số trong bảng được.
 */
const coNotLa = (o: OSolo, thu: boolean) => {
  const gam = thu ? GAM_THU : GAM_TRUONG
  return o.n.some(([, cao]) => !gam.has((((cao % 12) + 12) % 12)))
}

/** Mọi ô dùng được cho bài này: cùng thứ/trưởng, cùng số phách, và có hợp âm. */
function locO(thu: boolean, phach: number, von: readonly NguonTuyen[]): Manh[] {
  const hop = von.filter((t) => t.thu === thu && t.phach === phach)
  /*
    Không có bản ký âm nào cùng nhịp thì hạ điều kiện nhịp xuống — thà lệch phách còn
    hơn trả rỗng và mất câu. Chỉ xảy ra với bài 3 phách giọng trưởng: bảng chưa có.
  */
  const dung = hop.length > 0 ? hop : von.filter((t) => t.thu === thu)
  const ra: Manh[] = []
  for (const t of dung) {
    t.o.forEach((o, i) => {
      /* Ô lấy đà chưa có hợp âm thì không ghép theo bậc được — bỏ. */
      if (o.bac === null || o.n.length === 0) return
      /*
        Ô MƯỢN TỪ ĐOẠN KHÁC PHẢI SẠCH GAM.

        Đo vốn ô Linh Nhi: đoạn dạo có **1,4%** nốt ngoài gam (trưởng) và **0,4%** (thứ),
        còn giang tấu và đoạn kết có **2,2–3,5%** — vì ở đó chị mượn hợp âm (Đường Xưa kết
        `Am → Fm`). Nốt ấy đúng trên hợp âm mượn của chính bài nó, nhưng ghép sang một ô
        diatonic của bài khác thì thành nốt lạc.

        Mở vốn sang hai đoạn kia là để chữa chỗ bậc IV chỉ có một ô (xem `vonO`); không
        phải để nhập thêm chromatic. Nên ô mượn phải sạch, còn ô của CHÍNH đoạn đang soạn
        thì giữ nguyên cả nốt ngoài gam của nó — đó là vật liệu thật của đoạn ấy.

        Đo lại sau khi thêm luật này: nốt lạc trên 10 vòng trưởng **3,6% → 1,6%**, bản ký
        âm 1,4%. Chỉ một phép phạt bằng trọng số thì bão hoà ở 2,4% và bắt đầu đánh đổi
        với tỉ lệ nốt hợp âm.
      */
      if (t.muon && coNotLa(o, thu)) return
      ra.push({
        tuyen: t.id,
        chuGoc: t.chuGoc,
        i,
        cuoi: i === t.o.length - 1,
        o,
        muon: t.muon,
      })
    })
  }
  return ra
}

const dauO = (m: Manh) => m.o.n[0]![1]
const cuoiO = (m: Manh) => m.o.n[m.o.n.length - 1]![1]

/** Rải đều, tất định — cùng một lượt thì ra cùng một câu. */
const rung = (n: number) => ((Math.imul(n + 1, 2654435761) >>> 0) % 1000) / 1000

/**
 * Băm tên tuyến thành số.
 *
 * Cũ dùng thẳng `id.length`, mà `dung-xa` và `rung-la` cùng dài 7 ký tự nên hai tuyến
 * nhận đúng một giá trị rung — sáu lượt chỉ ra bốn câu khác nhau và
 * `phraseAssembled.test.ts` đỏ.
 */
const bam = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return h >>> 0
}

export function giaiDieuDaoLinhNhi(options: {
  left: readonly TimelineEvent[]
  chords: readonly ParsedChord[]
  beatsPerChord: number
  barBeats: number
  range: { low: number; high: number }
  take?: number
  minor?: boolean
  tonic?: PitchClass
  /**
   * Số phách của TỪNG hợp âm, khi bài có ô chia đôi.
   *
   * Thiếu nó thì mọi hợp âm coi như dài `beatsPerChord` bằng nhau, và hợp âm nửa ô sau
   * biến mất khỏi mọi phép tính. Đo được: đổi toàn bộ hợp âm nửa ô sau của một bài 8 ô
   * mà giai điệu ra y hệt, không đổi một nốt.
   */
  beatsEach?: readonly number[]
  /**
   * SIẾT VỀ NỐT HỢP ÂM theo đúng mức bản ký âm — ô tick nghe thử.
   *
   * Mặc định `false`: bản đang phát không đổi tiếng cho tới khi người dùng bật và nghe.
   */
  siet?: boolean
  /** Thầy lấy vốn ô. Bỏ trống thì lấy Linh Nhi. */
  thay?: Exclude<SoloTeacher, null>
  /** Đoạn lấy vốn ô. Bỏ trống thì lấy đoạn dạo. */
  doan?: 'intro' | 'interlude' | 'outro'
}): TimelineEvent[] {
  const { left, chords, beatsPerChord, barBeats, range } = options
  const take = options.take ?? 0
  if (chords.length === 0) return []

  /*
    MỐC GÕ TAY TRÁI, quy về vị trí trong ô — dùng để chọn ô cho tay phải.

    Trước đây hàm này nhận `left` rồi `void left`, tức **bỏ qua hoàn toàn**. Bên kia,
    `soloLeftHand` tỉa tay trái theo cường độ của chính mẫu đệm, cũng không nhìn tay
    phải. Hai bè không bên nào biết bên nào — nên tỉ lệ tay trái gõ MỘT MÌNH là chuyện
    hên xui: bảng tuyến cũ tình cờ ra >30%, bảng mới ra **10%**, trong khi bản ký âm là
    **41%** (đo bảy đoạn dạo giọng thứ).

    Hai bảng có nhịp điệu gần y hệt nhau — 43% mốc rơi đúng phách nguyên ở cả hai — nên
    chênh lệch ấy KHÔNG do bảng. Nó do không ai ngắm ai.
  */
  const mocTrai = new Set(
    left.map((e) => Math.round(((e.startBeat % barBeats) + barBeats) % barBeats * 1000)),
  )

  /*
    Bài chưa dò ra giọng thì suy cả chủ âm lẫn thứ/trưởng từ hợp âm đầu.
    `phraseSection.ts` truyền `minor: key?.scale === 'minor'`; bài không có giọng thì vế
    ấy ra `false` và bài THỨ bị ghép ô của bài TRƯỞNG — sai hẳn màu.
  */
  const dau = chords[0]!
  const chu = options.tonic ?? ((((dau.root % 12) + 12) % 12) as PitchClass)
  const thu =
    options.tonic === undefined
      ? dau.quality.intervals.includes(3) && !dau.quality.intervals.includes(4)
      : options.minor !== false

  const kho = locO(
    thu,
    barBeats,
    vonO(options.thay ?? 'linh-nhi', options.doan ?? 'intro'),
  )
  if (kho.length === 0) return []
  const goc = gocTuyen(chu)

  /*
    TRẢI HỢP ÂM RA TRỤC PHÁCH rồi mới chia về từng ô. Bản cũ tra thẳng
    `chords[floor(o * barBeats / beatsPerChord)]`, tức giả định mọi hợp âm dài bằng
    nhau — bài có ô chia đôi thì hợp âm nửa sau không bao giờ được đọc.
  */
  const dai = options.beatsEach ?? chords.map(() => beatsPerChord)
  const moc: { tu: number; den: number; chord: ParsedChord }[] = []
  let chay = 0
  chords.forEach((chord, i) => {
    const d = dai[i] ?? beatsPerChord
    moc.push({ tu: chay, den: chay + d, chord })
    chay += d
  })
  const soO = Math.max(1, Math.round(chay / barBeats))
  /** Các hợp âm vang trong ô `o`, theo thứ tự thời gian. */
  const hopAmO = (o: number) => {
    const tu = o * barBeats
    const den = tu + barBeats
    const ra = moc.filter((m) => m.den > tu + 1e-6 && m.tu < den - 1e-6)
    return ra.length > 0 ? ra : moc.slice(-1)
  }

  const chon: { m: Manh; chord: ParsedChord }[] = []
  let truoc: Manh | null = null
  for (let o = 0; o < soO; o += 1) {
    const trongO = hopAmO(o)
    const chord = trongO[0]!.chord
    const bac = ((chord.root % 12) - chu + 12) % 12
    /*
      Ô của BÀI có chia đôi không, và nửa sau đứng trên bậc nào.

      HAI NỬA CÙNG MỘT HỢP ÂM THÌ KHÔNG PHẢI Ô CHIA. `Dm | Dm` viết thành hai ô nửa
      nhịp vẫn chỉ là một hợp âm vang suốt ô, và bảng tuyến cũng chỉ đặt `bac2` khi hai
      ký hiệu KHÁC nhau — xem `tools/tuyen_o.py`. Đếm nó là ô chia thì mọi ô của mọi bài
      nhập kiểu nửa nhịp đều thành "chia", và phép phạt lệch chia mất hết tác dụng phân
      biệt.
    */
    const sau = trongO.length > 1 ? trongO[1]! : null
    const bacSau = sau ? (((sau.chord.root % 12) - chu + 12) % 12) : null
    const bac2 = bacSau !== null && bacSau !== bac ? bacSau : null
    const cuoi = o === soO - 1

    /* Cùng bậc trước; không có thì cùng chức năng; vẫn không có thì lấy cả kho. */
    const dungBac = kho.filter((m) => m.o.bac === bac)
    const dungChuc = kho.filter((m) => chuc(m.o.bac!, thu) === chuc(bac, thu))
    const ung = dungBac.length > 0 ? dungBac : dungChuc.length > 0 ? dungChuc : kho

    /*
      LƯỢT THỨ N LẤY ỨNG VIÊN HẠNG N.

      Chỉ rung điểm thì chưa đủ: khi ô đứng đầu bảng dẫn quá xa, rung bao nhiêu cũng
      không lật được thứ hạng, và lượt 1 ra y hệt lượt 0 — `phraseAssembled.test.ts`
      đòi sáu lượt ra sáu câu khác nhau nên đỏ. Đi thẳng xuống hạng thứ `take` thì chắc
      chắn khác, mà vẫn là một ô nhịp CÓ THẬT và vẫn qua đủ ba phép chọn.

      QUAY VÒNG chứ đừng kẹp. Viết `Math.min(take, xep.length - 1)` thì chơi vài lượt
      là `take` vượt số ứng viên, mọi ô kẹt ở ô hạng chót và ĐỨNG YÊN VĨNH VIỄN — người
      dùng nghe ra ngay: "sao mỗi lần phát intro giờ không đổi khác nữa". `playSpin`
      tăng mãi nên mọi phép chỉ số ở đây bắt buộc phải quay vòng.

      Mỗi ô có số ứng viên khác nhau nên chúng quay lệch pha nhau, ra được nhiều tổ hợp
      hơn hẳn số lượt.

      Lượt 0 giữ nguyên hạng nhất và không rung, để phép ghép ngược còn đứng.
    */
    const hangGoc = take
    const xep = ung
      .map((m) => {
        /*
          Nối giọng: nốt đầu ô mới cách nốt cuối ô trước bao nhiêu nửa cung, quy về
          trong một quãng tám — dời quãng tám là việc của khâu sau, không phải lỗi nối
          câu.
        */
        let d = truoc ? Math.abs(((((dauO(m) - cuoiO(truoc)) % 12) + 18) % 12) - 6) : 0
        /* Ở lại cùng một bài: đổi nguồn giữa câu là đứt hơi. */
        if (truoc && m.tuyen !== truoc.tuyen) d += 5
        /* Ô đầu lấy ô đầu, ô cuối lấy ô cuối — hai đầu mang tính chất riêng. */
        if (o === 0 && m.i !== 0) d += 4
        if (cuoi !== m.cuoi) d += 6
        /*
          Ô nào về chỗ ô ấy. Thiếu luật này thì ô 1 và ô 6 Đừng Xa cùng đứng trên bậc
          Im, cả hai chỗ đều bị ghép bằng ô 1, và phép ghép ngược không còn ra đúng câu
          gốc. Phạt nhẹ, chỉ đủ phá thế hoà.
        */
        if (m.i !== o) d += 1.5
        /*
          Ô CHIA ĐÔI ĐI VỚI Ô CHIA ĐÔI.

          Đo bảy đoạn dạo: 6/59 ô có hai hợp âm khác nhau. Ô chia đôi có hình tiết tấu
          riêng vì tay phải phải kịp đổi màu giữa ô, nên ghép ô liền vào chỗ chia (hoặc
          ngược lại) là lệch. Khớp được cả BẬC của nửa sau thì thưởng thêm.

          Phạt vừa phải: vốn ô chia đôi chỉ có 6, ép quá thì bài nào chia nhiều cũng
          chỉ quanh quẩn sáu ô ấy.
        */
        const mChia = m.o.bac2 !== null
        if (mChia !== (bac2 !== null)) d += 2
        else if (mChia && bac2 !== null && m.o.bac2 !== bac2) d += 1
        /*
          HAI TAY ĐỐI ĐÁP, KHÔNG NÓI CÙNG LÚC.

          Đo bảy đoạn dạo giọng thứ: **41% mốc gõ tay trái không có tay phải đi kèm**.
          Đây là chỗ duy nhất trong cả bộ ghép mà tay phải nhìn tay trái, nên phép chọn
          ô phải gánh luôn việc ấy: ô nào đè lên nhiều mốc tay trái thì tốn điểm.

          KHÔNG nắn nốt, không dời phách — chỉ **chọn ô khác** trong vốn ô có thật. Nắn
          là quay lại kiểu soạn nốt theo luật đã bị bác bốn lần.

          Trọng số **0,6** mỗi mốc đè: đủ để phân biệt giữa các ô ngang điểm, nhưng nhẹ
          hơn hẳn phép phạt đổi bài (5) và phép phạt lệch chỗ đầu/cuối (4 và 6) — hơi câu
          liền mạch vẫn đứng trên.

          **Giá trị cũ: 0** (không có phép phạt này). Đo lại sau khi thêm: tay trái gõ
          một mình **45% giọng thứ · 52% giọng trưởng**, so với bản ký âm **41%** và so
          với **10%** lúc chưa có. Triệu chứng để lùi: đặt nặng hơn thì bộ ghép bắt đầu
          bỏ ô đúng bậc để né mốc tay trái, và phép ghép ngược không còn ra đúng câu gốc
          — `giaiDieuDaoLinhNhi.test.ts` sẽ đỏ ở bài "GHÉP NGƯỢC".
        */
        const de = m.o.n.reduce(
          (a, [at]) => a + (mocTrai.has(Math.round(at * 1000)) ? 1 : 0),
          0,
        )
        d += de * 0.6
        /*
          QUÃNG BA TĂNG VỚI GỐC HỢP ÂM — chỗ chói tai nhất, người dùng chỉ đích danh.

          *"chỗ Fadd2 nghe nhiều nốt lệch quá"* — và đo trên 44 câu đã lưu thì đúng:
          trên `Fadd2` có **31%** số nốt là bậc `♭5` so với gốc, `Gadd2` **29%**, trong
          khi bản ký âm Linh Nhi để bậc ấy ở **2%** trên hợp âm trưởng (n=305). Đếm
          tuyệt đối: app 59 nốt quãng ba tăng, bản ký âm **7 nốt trên cả bảy bài**.

          RÒ RỈ Ở PHÉP LUI VỀ CÙNG CHỨC NĂNG. Ghép theo bậc thì bậc so với hợp âm được
          giữ nguyên; nhưng không có ô cùng bậc thì bộ ghép lui xuống cùng chức năng
          (`chuc()`), và bậc 5 với bậc 2 cùng là "hạ át". Ô của bậc ii mang nốt bậc 7
          của gam — trên ii nó là `♭13`, nghe xuôi — đặt sang bậc IV thì chính nốt ấy
          thành **quãng ba tăng với gốc**. Không nốt nào bịa ra, vẫn ra nốt chói.

          Nên phải chấm ô bằng **hợp âm thật nó sắp đứng lên**, không chỉ bằng bậc.

          Trọng số: 1,5 mỗi nốt, cộng 2 nữa nếu nó MỞ ĐẦU ô. Người dùng báo hai lần về
          đúng nốt đầu ô (*"nốt cuối câu chạy, đồng thời là nốt đầu của Fadd2"*), và đo
          được **47%** số nốt quãng ba tăng của app rơi vào chỗ mở ô.

          KHÔNG cấm tuyệt đối: bản ký âm vẫn có 7 nốt như thế, 3 trong số đó đi vào và
          ra đều bằng bước liền bậc. Phạt để chọn ô khác, không phải để nắn nốt.
        */
        /*
          NỐT LẠC — ngoài gam của bài VÀ ngoài hợp âm đang vang.

          Ô của giang tấu và đoạn kết mang **2–3,5% nốt ngoài gam** (chị ấy mượn hợp âm ở
          đó — Đường Xưa kết `Am → Fm`), so với **1,4%** ở đoạn dạo. Mở vốn sang hai đoạn
          ấy để chữa chỗ Fadd2 thì nhập luôn đám chromatic này: đo trên 10 vòng trưởng ra
          **3,6% nốt lạc**, gấp 2,5 lần bản ký âm.

          Nốt ngoài gam mà THUỘC hợp âm đang vang thì không phạt — vòng có `Bb` hay `A7`
          thì nốt ấy đúng chứ không lạc.
        */
        const tapHop = new Set(
          chord.quality.intervals.map((iv) => ((((chord.root + iv - chu) % 12) + 12) % 12)),
        )
        /*
          SIẾT VỀ ĐÚNG MỨC BÁM HỢP ÂM CỦA BẢN KÝ ÂM — chỉ khi ô tick bật.

          Bộ ghép hiện chọn ô **phẳng**: tỉ lệ nốt hợp âm ra 60–68% ở mọi đoạn, mọi giọng.
          Bản ký âm thì không phẳng chút nào, và hai giọng còn **đi ngược chiều** về phía
          cuối câu — xem `DICH_HOP` ngay dưới.

          Phép chấm không đẩy một chiều mà kéo về ĐÚNG mức: ô nào có tỉ lệ nốt hợp âm lệch
          xa mức đích thì tốn điểm, dù lệch cao hay lệch thấp. Nhờ vậy đoạn kết giọng thứ
          được **nới ra** đúng như chị chơi, chứ không phải chỗ nào cũng siết.
        */
        let keo = 0
        if (options.siet === true) {
          const dich = DICH_HOP[thu ? 'thu' : 'truong'][options.doan ?? 'intro']
          const trong = m.o.n.reduce(
            (a, [, cao]) => a + (tapHop.has((((cao % 12) + 12) % 12)) ? 1 : 0),
            0,
          )
          keo = Math.abs(trong / m.o.n.length - dich) * 3
        }

        const chan = m.o.n.reduce((a, [at, cao], k) => {
          void at
          const soHop = (((cao - bac) % 12) + 12) % 12
          const soGam = (((cao % 12) + 12) % 12)
          let p = 0
          /* Quãng ba tăng với gốc — chỗ chói nhất, người dùng chỉ đích danh ở `Fadd2`. */
          if (soHop === 6) p += 1.5 + (k === 0 ? 2 : 0)
          if (!GAM_TRUONG.has(soGam) && !tapHop.has(soGam) && !thu) p += 1.5
          return a + p
        }, 0)
        d += chan + keo
        /*
          Ô MƯỢN TỪ ĐOẠN KHÁC chịu một điểm phạt vừa phải.

          Ô của đoạn dạo vẫn được chuộng — hai đầu câu có tính chất riêng, xem hai phép
          phạt vị trí ở trên. Nhưng khi đoạn đang soạn không có ô nào sạch cho một bậc,
          thà mượn ô thật của giang tấu còn hơn dùng ô duy nhất mang quãng ba tăng.

          Trọng số 2: nhẹ hơn phép phạt đổi bài (5), nặng hơn phép phạt lệch chỗ (1,5).
        */
        if (m.muon) d += options.siet === true ? 7 : 2
        d += take === 0 ? 0 : rung(take * 977 + o * 31 + m.i * 7 + bam(m.tuyen)) * 9
        return { m, d }
      })
      .sort((x, y) => x.d - y.d)
    /*
      Lệch pha theo ô: ô thứ `o` quay thêm `o` nhịp. Không có nó thì mọi ô cùng nhảy
      một nhịp mỗi lượt, và khi kho mỏng (giọng thứ 4 phách chỉ còn 3 tuyến / 24 ô) hai
      lượt khác nhau lại chọn trùng cả tám ô — `phraseAssembled.test.ts` đỏ.

      Lượt 0 vẫn lấy hạng nhất ở MỌI ô, nên phép ghép ngược còn đứng.
    */
    const n = xep.length
    const hang = hangGoc === 0 ? 0 : 1 + ((hangGoc - 1 + o) % Math.max(1, n - 1))
    const tot = xep[hang % n]?.m ?? null
    if (!tot) return []
    chon.push({ m: tot, chord })
    truoc = tot
  }

  /*
    DỜI QUÃNG TÁM CẢ CÂU MỘT LƯỢT — dời từng nốt là phá đường đi, đúng lỗi của bản 1.

    Mốc là **TẦM TUYỆT ĐỐI** chị ấy đánh, không phải tầm của bản ký âm nguồn. Đo cao độ
    trung bình tay phải của cả bảy đoạn dạo:

    | bài | chủ âm | trung bình |
    |---|---|---|
    | Biển Tình | D | E5 (75,5) |
    | Đừng Xa | D | Bb4 (70,4) |
    | Lá Thư | D | Eb5 (75,4) |
    | Một Cõi | G | C5 (72,1) |
    | Đường Xưa | C | D5 (74,2) |
    | Mùa Xuân | G | Eb5 (75,0) |
    | Rừng Lá | A | C#5 (72,8) |

    **Trung bình 73,6 — đúng D5 — lệch chuẩn chỉ 1,9 nửa cung**, qua năm giọng khác nhau.
    Tầm ấy gần như không nhúc nhích theo giọng bài; đoạn dạo của chị luôn nằm ở đó.

    CŨ: `12 × round((chuGoc − chu) / 12)`, tức bám tầm bản nguồn. Triệu chứng là bài La
    thứ mà ô ghép phần lớn lấy từ Đừng Xa (Rê) thì ra `doi = −12`, câu tụt xuống trung
    bình **F#4–G4** — thấp hơn bản ký âm bảy nửa cung, trần thấp hơn cả một quãng sáu.
    Người dùng nghe ra ngay: câu chìm vào đúng vùng tay trái đang chạy.
  */
  /*
    CĂN QUÃNG TÁM CHO TỪNG Ô, không chỉ cho cả câu.

    Bảng ghi cao độ so với chủ âm BẢN GỐC, mà mỗi ô có thể lấy từ một bài khác nhau —
    hai ô liền nhau vì thế hay rơi vào hai quãng tám khác nhau, và chỗ nối thành một cú
    nhảy không ai soạn ra cả. Đo trên 10 vòng trưởng: **nhảy 8+ chiếm 28%** trong khi
    bản ký âm chỉ **25%**, còn bước liền bậc **26%** so với **32%**.

    Phép căn chỉ dời NGUYÊN ô đi bội số 12, nên **không đổi tên nốt nào** — cùng thứ
    phép mà bước căn tầm ngay dưới vẫn làm cho cả câu, chỉ khác là làm theo từng ô.

    KHÔNG ép về sát nhau: chỉ nhận mức dời khi nó rút ngắn được bước nối, còn cú nhảy
    quãng tám vốn có trong bản ký âm (25%) thì giữ — ép hết là giết đúng nét ấy.
  */
  const dichO: number[] = []
  let cuoiTruoc: number | null = null
  chon.forEach(({ m }, o) => {
    const dau = goc + m.o.n[0]![1]
    let k = 0
    if (cuoiTruoc !== null) {
      for (const thu of [-12, 12]) {
        if (Math.abs(dau + thu - cuoiTruoc) < Math.abs(dau + k - cuoiTruoc)) k = thu
      }
    }
    dichO[o] = k
    cuoiTruoc = goc + m.o.n[m.o.n.length - 1]![1] + k
  })

  const moi = chon.flatMap(({ m }, o) =>
    m.o.n.map(([at, d, du]) => ({ o, at, du, note: goc + d + dichO[o]! })),
  )
  if (moi.length === 0) return []

  const ngoai = (k: number) =>
    moi.reduce((a, n) => a + (n.note + k > range.high || n.note + k < range.low ? 1 : 0), 0)
  const tam = moi.reduce((a, n) => a + n.note, 0) / moi.length
  const neo = TAM[options.thay ?? 'linh-nhi']
  const doi = 12 * Math.round(((thu ? neo.thu : neo.truong) - tam) / 12)
  void ngoai
  /*
    ĐÃ BỎ: phép nhích thêm ±12 khi mức ấy có ÍT nốt lọt ra ngoài tầm hơn.

    Nó lật ngược thứ tự ưu tiên. Vốn ô lấy từ bản ký âm có vài **nốt đáp trầm** rất thấp
    nằm ngay trên khuông tay phải — Đừng Xa xuống tới MIDI 52. Chỉ vài nốt ấy lọt dưới
    đáy 57 là phép đếm chọn mức `+12`, và **cả câu bị đẩy lên một quãng tám**: đo được
    tâm **80,7** thay vì 73,6, tức lệch 8,3 nửa cung — trong khi cả bốn tuyến nguồn đều
    nằm ở 70,8–76,0.

    Không cần phép nhích ấy nữa vì `gap()` ngay dưới đã GẬP từng nốt biên vào tầm. Gập
    một hai nốt trầm là méo nhỏ; đẩy cả câu lên một quãng tám là đổi hẳn chỗ ngồi của
    câu — đúng thứ người dùng nghe ra và chê ở các câu #3 và #7.
  */

  /*
    ponytail: nốt nào vẫn lọt ra ngoài thì GẬP vào bằng quãng tám. Ô của Một Cõi trải
    rộng hơn cả tầm tay phải 57..95 nên không mức nào lọt hết; gập một nốt biên là méo
    nhỏ hơn nhiều so với mất cả câu. Muốn hết méo thì phải nới `range`.
  */
  const gap = (n: number) => {
    let v = n
    while (v > range.high) v -= 12
    while (v < range.low) v += 12
    return v
  }

  const out: TimelineEvent[] = []
  for (const n of moi) {
    /*
      Nốt cảm phải tra hợp âm ĐANG VANG tại đúng phách của nốt, không tra hợp âm đầu ô.
      Bài đặt bậc V ở nửa ô sau — Đừng Xa ô 7 là `E` rồi `A` — mà chỉ tra đầu ô thì mất
      sạch nốt cảm ở đúng chỗ cần nó nhất.
    */
    const tai = n.o * barBeats + n.at
    const trong = hopAmO(n.o)
    const chord = [...trong].reverse().find((m) => m.tu <= tai + 1e-6)?.chord ?? chon[n.o]!.chord
    let note = gap(n.note + doi)
    if (NOT_CAM && thu) {
      const cam = new Set(chord.quality.intervals.map((iv) => (chord.root + iv) % 12))
      if (((note % 12) + 12) % 12 === (chu + 10) % 12 && cam.has((chu + 11) % 12)) note = gap(note + 1)
    }
    out.push({
      notes: [note as MidiNote],
      startBeat: n.o * barBeats + n.at,
      /* Độ ngân chép từ bản ký âm, không suy từ khoảng cách tới nốt sau như bản trước. */
      durationBeats: Math.min(Math.max(n.du, 0.25), barBeats) * 0.9,
      hand: 'right',
      velocity: n.at < 0.1 ? 78 : 66,
    })
  }
  return out
}
