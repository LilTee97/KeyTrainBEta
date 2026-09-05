import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'
import { TUYEN_DAO, gocTuyen, type ODao } from './tuyenDaoLinhNhi'

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
 * Tầm tuyệt đối của đoạn dạo — cao độ trung bình tay phải, tính bằng MIDI.
 *
 * Đo bảy đoạn dạo: 70,4 · 72,1 · 72,8 · 74,2 · 75,0 · 75,4 · 75,5 — trung bình **73,6**
 * (đúng D5), **lệch chuẩn 1,9 nửa cung** qua năm giọng khác nhau. Đây là một trong những
 * con số ổn định nhất đo được về chị ấy.
 */
const TAM_TAY_PHAI = 73.6

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

type Manh = { tuyen: string; chuGoc: PitchClass; i: number; cuoi: boolean; o: ODao }

/** Mọi ô dùng được cho bài này: cùng thứ/trưởng, cùng số phách, và có hợp âm. */
function locO(thu: boolean, phach: number): Manh[] {
  const hop = TUYEN_DAO.filter((t) => t.thu === thu && t.phach === phach)
  /*
    Không có bản ký âm nào cùng nhịp thì hạ điều kiện nhịp xuống — thà lệch phách còn
    hơn trả rỗng và mất câu. Chỉ xảy ra với bài 3 phách giọng trưởng: bảng chưa có.
  */
  const dung = hop.length > 0 ? hop : TUYEN_DAO.filter((t) => t.thu === thu)
  const ra: Manh[] = []
  for (const t of dung) {
    t.o.forEach((o, i) => {
      /* Ô lấy đà chưa có hợp âm thì không ghép theo bậc được — bỏ. */
      if (o.bac === null || o.n.length === 0) return
      ra.push({ tuyen: t.id, chuGoc: t.chuGoc, i, cuoi: i === t.o.length - 1, o })
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
}): TimelineEvent[] {
  const { left, chords, beatsPerChord, barBeats, range } = options
  const take = options.take ?? 0
  if (chords.length === 0) return []
  void left

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

  const kho = locO(thu, barBeats)
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
    /* Ô của BÀI có chia đôi không, và nửa sau đứng trên bậc nào. */
    const sau = trongO.length > 1 ? trongO[1]! : null
    const bac2 = sau ? (((sau.chord.root % 12) - chu + 12) % 12) : null
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
  const moi = chon.flatMap(({ m }, o) => m.o.n.map(([at, d, du]) => ({ o, at, du, note: goc + d })))
  if (moi.length === 0) return []

  const ngoai = (k: number) =>
    moi.reduce((a, n) => a + (n.note + k > range.high || n.note + k < range.low ? 1 : 0), 0)
  const tam = moi.reduce((a, n) => a + n.note, 0) / moi.length
  let doi = 12 * Math.round((TAM_TAY_PHAI - tam) / 12)
  for (const k of [doi - 12, doi + 12]) if (ngoai(k) < ngoai(doi)) doi = k

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
