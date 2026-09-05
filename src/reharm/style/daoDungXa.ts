import { chordTonesStrict } from '../fillSoloGenerator/soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

/**
 * Tiết tấu câu dạo *Đừng Xa Em Đêm Nay* — Linh Nhi, Rê thứ, ô 1–9.
 *
 * ## Vì sao là một vòng cung chứ không phải một cell
 *
 * Đoạn dạo hiện tại quạt đúng một mẫu chín cú gõ suốt cả chín ô. Đo bản ký âm
 * thì tay trái KHÔNG giữ một mật độ:
 *
 * | ô   | cú gõ tay trái | hình                                            |
 * |-----|----------------|-------------------------------------------------|
 * | 1–2 | 5–7            | thưa; bậc 5 ở 0,5 **ngân 1,5 phách**            |
 * | 3–7 | 8–9            | vào mẫu đủ, có cặp móc kép 0,5 / 0,75           |
 * | 8   | **16**         | dày nhất, chồng bè; tay phải ngược lại còn 4 nốt |
 * | 9   | 2              | hai cú dặm ngân dài trên bậc V                   |
 *
 * Hai điều đáng giữ nhất:
 *
 * 1. Ô 1–2 KHÔNG có cặp móc kép. Chữ ký của hai ô mở là nốt bậc 5 gõ ở phách
 *    1& rồi **ngân qua phách 2** — mẫu chín cú gõ đúng chỗ ấy lại chặt nó
 *    thành móc kép, tức là mở đoạn bằng thứ đáng ra để dành cho giữa đoạn.
 * 2. Ô 8 hai tay **đổi vai**: tay trái dồn lên 16 nốt trong khi tay phải rút
 *    còn 4. Đó là chỗ lấy đà cho ô hút, và nếu cả hai tay cùng dày thì không
 *    còn chỗ nào để dồn tới.
 *
 * ## Ô hút — bậc V ngân dài
 *
 * Ô 9 trên hợp âm La (bậc V của Rê thứ), đo từng nốt:
 *
 * ```
 * phách 1  tay trái La1 = 33          ngân 3 phách
 *          tay phải Mi3 = 52          ngân 3 phách      ← chỉ gốc + bậc 5
 * phách 4  tay trái La2 = 45          ngân 3 phách
 *          tay phải La3 = 57, Đô#4 = 61, ngân 3 phách   ← hợp âm đủ
 *          tay trái Sol#3 = 56 (3,25) rồi La3 = 57 (3,5)
 * ```
 *
 * Ba điều rút ra:
 *
 * 1. **Dặm hai lần, không phải một.** Cú đầu để trống bậc 3 — chỉ gốc và bậc 5
 *    — nên nó vang mà chưa hút. Bậc 3 (Đô#, nốt cảm âm của Rê) mãi cú thứ hai
 *    mới vào, và đó mới là chỗ tai nghe ra "sắp về chủ âm".
 * 2. **Ngân 3 phách, tràn qua vạch nhịp.** Cú thứ hai rơi ở phách 4 mà ngân ba
 *    phách, tức nó còn kêu hai phách sau khi người hát đã vào. Cắt nó đúng
 *    vạch thì mất luôn cái hút.
 * 3. **Cú vuốt Sol#→La** ở 3,25 / 3,5 — nốt cảm âm của chính hợp âm V đẩy vào
 *    gốc nó. Nhỏ, nhưng đó là thứ làm cú dặm thứ hai nghe ra là một cử chỉ chứ
 *    không phải một khối hợp âm rơi xuống.
 *
 * Bộ này KHÔNG soạn nốt. Nó nắn lại thứ `soloLeftHand` và `raiLinhNhi` đã dựng,
 * nên mọi luật của hai bộ ấy còn nguyên — thứ đổi là mật độ theo ô và cái đuôi.
 */

/** Ô thưa: chỉ giữ bấy nhiêu mốc, tính theo ô bốn phách. */
const MOC_MO = [0, 0.5, 2, 3, 3.5] as const

/** Cặp ô mở luôn thưa — người dùng khen đúng chỗ này. */
const O_MO = 2

/** Thân bài chạy chu kỳ dày, dày, thưa. */
const CHU_KY = 3

/**
 * Ô nào thưa.
 *
 * ĐÂY LÀ CHỌN CỦA TAI NGƯỜI DÙNG, KHÔNG PHẢI SỐ ĐO. Bản ký âm dồn đều một
 * chiều — 5, 7, 8, 8, 9, 9, 9, rồi 16 — không hề xen kẽ. Người dùng nghe bản
 * dựng theo đúng số đo ấy rồi bảo xen kẽ thưa với dày.
 *
 * Lượt sửa đầu cho xen kẽ đều một dày một thưa. Người dùng bác: "2 ô dày nối
 * tiếp nhau rồi tới thưa" — chu kỳ BA, không phải hai.
 *
 * Có một lượt giữa chừng cho chỗ thưa ấy chỉ xảy ra 60% số lượt chơi, theo câu
 * "tần suất thưa xuất hiện cũng thỉnh thoảng thôi". Người dùng nghe rồi bỏ:
 * "thôi ô 5 cho thưa 100% đi." Nên chỗ thưa là CỐ ĐỊNH, và vòng dạo phát lại
 * giống nhau mọi lượt ở mặt mật độ — phần đổi theo lượt đã có `raiLinhNhi` lo
 * ở tay phải rồi.
 *
 * Ô áp chót luôn là ô dồn, không bao giờ thưa: nó là chỗ lấy đà cho ô hút.
 *
 * Ghi rõ nguồn gốc ở đây vì phiên sau đo lại bản ký âm sẽ thấy lệch, và sẽ
 * tưởng là lỗi.
 */
const thuaO = (bar: number, don: number) => {
  if (bar >= don) return false
  if (bar < O_MO) return true
  return (bar - O_MO) % CHU_KY === CHU_KY - 1
}

/** Nốt bậc 5 ở phách 1& ngân qua phách 2 — chữ ký ô thưa. */
const NGAN_MO = 1.5

/** Ô áp chót tay phải rút còn bấy nhiêu nốt, nhường chỗ tay trái dồn. */
const RH_DON = 4

/**
 * Ô THƯA THÌ TAY PHẢI CHỒNG NỐT — bù đúng chỗ tay trái vừa nhường.
 *
 * Người dùng nghe ô 5 rồi bảo tay trái thưa thì thêm nốt cho tay phải. Bản ký
 * âm nói đúng như vậy, và nói cả CÁCH làm:
 *
 * | ô   | LH mốc | RH nốt mỗi mốc | RH mốc chồng ≥2 |
 * |-----|--------|----------------|------------------|
 * | 1   | 5      | **2,25**       | **62%**          |
 * | 2   | 7      | **1,75**       | **62%**          |
 * | 3–7 | 8–9    | 1,00–1,33      | 0–33%, TB ~15%   |
 *
 * Chỗ dễ làm hỏng nằm ở chỗ SỐ MỐC GÕ TAY PHẢI GẦN NHƯ KHÔNG ĐỔI: 8, 8, 7, 7,
 * 7, 6, 8 qua bảy ô. Tay phải không thêm nốt theo THỜI GIAN, nó chồng thêm nốt
 * trên CÙNG một cú gõ. Thêm mốc thì lấp mất đúng khoảng trống tay trái vừa
 * nhường, và ô thưa hết thưa — mất luôn thứ người dùng vừa khen.
 */
/*
  GIỮ 0,62. ĐÃ THỬ HẠ XUỐNG 0,30 RỒI TRẢ LẠI — hạ là sai, và sai vì SO NHẦM MẪU SỐ.

  Phiếu T2.3 từng đề nghị hạ, lấy lý do "0,62 đo từ ô 1–2 Đừng Xa, còn mức chung năm bài
  chỉ 20–34%". Hai con số ấy KHÔNG so được với nhau:

  - **0,62** đo trên RIÊNG ô tay trái thưa
  - **20–34%** là trung bình CẢ ĐOẠN, gộp cả ô dày — mà bộ này chồng 0% ở ô dày

  Hằng số này chỉ chạy ở ô thưa. Vòng dạo tám ô có ba ô thưa, nên 0,62 sinh ra khoảng
  **23% cả đoạn** — đúng bằng trung bình năm bài (Biển Tình 8% · Đường Xưa 13% · Mùa Xuân
  22% · Đừng Xa 31% · Rừng Lá 36%, trung bình 22%). Hạ xuống 0,30 thì còn ~11%, thấp hơn
  mọi bài trừ Biển Tình, và ô 5 mất sạch nốt chồng — đúng cái ô người dùng đã chỉ đích danh
  khi yêu cầu thêm nốt cho tay phải.

  Bài học: trước khi so hai tỉ lệ, kiểm xem chúng có cùng mẫu số không.
*/
const CHONG_O_THUA = 0.62

/**
 * Khe hẹp nhất cho nốt chồng thêm ở ô thưa, tính bằng nửa cung.
 *
 * `raiLinhNhi` ép khe tối thiểu 9 — số đo từ giang tấu Biển Tình. Nhưng ở ô 1
 * Đừng Xa tay phải với xuống 62 trong khi tay trái đang giữ 57: khe **5**. Ô
 * tay trái thưa chính là chỗ hai tay xích lại gần nhau nhất, và đó là một phần
 * lý do ô ấy nghe đầy dù ít nốt.
 *
 * Vẫn là sàn cứng, không phải bắt chéo: nốt chồng không bao giờ chạm hay chui
 * xuống dưới tay trái.
 */
const KHE_O_THUA = 5

/**
 * Ô hút chừa lại bấy nhiêu phách cuối cho ca sĩ lấy hơi, tính theo ô bốn phách.
 *
 * Bản ký âm dặm HAI lần và cú sau ngân tràn hai phách sang câu hát. Dựng đúng
 * vậy rồi thì người dùng bác: "đừng dặm 2 lần E tràn qua ô hát ca sĩ khó vào
 * hát." Nên còn một cú, và nó tắt trước vạch nhịp.
 *
 * Bỏ cú thứ hai thì cú còn lại phải mang bậc 3 — bản gốc để dành bậc 3 cho cú
 * sau, nhưng bậc 3 mới là nốt cảm âm kéo về chủ âm, không có nó thì ô này
 * chẳng hút gì cả.
 */
const HOI = 0.5

/* Rút thăm cố định theo ô và thứ tự nốt — câu dạo đã đóng băng nên không cần
   `take`; cùng một bài luôn ra cùng một chỗ chồng. */
const hash = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const nearOct = (pc: number, target: number): MidiNote =>
  Math.round((target - pc) / 12) * 12 + pc

const barOf = (beat: number, barBeats: number) =>
  Math.floor(beat / barBeats + 1e-6)

/**
 * Vòng cung mật độ: hai ô mở thưa, ô áp chót đổi vai hai tay.
 *
 * `bars` là số ô của vòng dạo, KHÔNG kể ô hút — ô hút do `hutDungXa` dựng
 * riêng vì nó không còn là mẫu đệm nữa.
 */
export function arcDungXa(options: {
  left: readonly TimelineEvent[]
  melody: readonly TimelineEvent[]
  barBeats: number
  bars: number
  /** Hợp âm từng ô, để chọn nốt chồng — bỏ trống thì không chồng. */
  chords?: readonly ParsedChord[]
  beatsPerChord?: number
}): { left: TimelineEvent[]; melody: TimelineEvent[] } {
  const { left, melody, barBeats, bars } = options
  const don = bars - 1
  const nhip = barBeats / 4

  const giu = new Set(MOC_MO.map((at) => Number((at * nhip).toFixed(3))))

  const trai: TimelineEvent[] = []
  for (const event of left) {
    const bar = barOf(event.startBeat, barBeats)
    const trongO = Number((event.startBeat - bar * barBeats).toFixed(3))

    if (thuaO(bar, don)) {
      if (!giu.has(trongO)) continue
      trai.push(
        trongO === Number((0.5 * nhip).toFixed(3))
          ? { ...event, durationBeats: NGAN_MO * nhip }
          : { ...event },
      )
      continue
    }

    /*
      Ô dồn: chồng thêm một bè ở nửa sau ô. Bản ký âm chồng 2–3 nốt từ phách 2&
      trở đi (53+57, 57+62, 45+57, 41+53+57), còn nửa đầu vẫn một nốt.
    */
    if (bar === don && trongO >= barBeats / 2 && event.notes.length > 0) {
      const day = Math.max(...event.notes)
      trai.push({ ...event, notes: [...event.notes, day + 7] })
      continue
    }

    trai.push({ ...event })
  }

  /*
    Trần tay trái đang vang tại một mốc — lấy mốc tay trái gần nhất về trước,
    đúng cách `raiLinhNhi` làm, để nốt chồng không chui xuống dưới bè trầm.
  */
  const mocTrai = [...new Set(left.map((e) => Number(e.startBeat.toFixed(3))))].sort(
    (a, b) => a - b,
  )
  const tranTraiTai = (beat: number): number => {
    let tran = -Infinity
    for (const at of mocTrai) {
      if (at > beat + 1e-6) break
      const cao = left
        .filter((e) => Math.abs(e.startBeat - at) < 1e-6)
        .flatMap((e) => e.notes)
      if (cao.length > 0) tran = Math.max(...cao)
    }
    return tran
  }

  /* Tay phải rút ở ô dồn — hai tay đổi vai, xem chú thích đầu tệp. */
  const oDon = melody.filter((event) => barOf(event.startBeat, barBeats) === don)
  const boQua = new Set(
    oDon
      .slice()
      .sort((a, b) => a.startBeat - b.startBeat)
      .slice(RH_DON),
  )
  const phai = melody.filter((event) => !boQua.has(event)).map((event) => ({ ...event }))

  /*
    Chồng nốt ở ô thưa. Làm SAU phép rút ô dồn để không chồng vào những nốt vừa
    bị bỏ, và chỉ đụng ô thưa nên ô dày giữ nguyên mật độ đo được.
  */
  if (options.chords && options.beatsPerChord) {
    const { chords, beatsPerChord } = options
    phai.forEach((event, order) => {
      const bar = barOf(event.startBeat, barBeats)
      if (!thuaO(bar, don)) return
      if (event.notes.length !== 1) return
      if (hash(bar * 13 + order * 7) >= CHONG_O_THUA) return

      const chord = chords[Math.min(chords.length - 1, Math.floor(event.startBeat / beatsPerChord))]
      if (!chord) return
      const san = tranTraiTai(event.startBeat) + KHE_O_THUA
      const tren = event.notes[0]!

      /* Nốt hợp âm CAO NHẤT còn nằm dưới nốt giai điệu và trên sàn. */
      let chon: MidiNote | null = null
      for (const pc of chordTonesStrict(chord)) {
        for (let note = pc; note <= 108; note += 12) {
          if (note < tren && note >= san && (chon === null || note > chon)) chon = note as MidiNote
        }
      }
      if (chon !== null) event.notes = [chon, tren]
    })
  }

  return { left: trai, melody: phai }
}

/**
 * Ô hút — hai cú dặm ngân dài trên bậc V, đặt ở phách `at`.
 *
 * `hut` là lớp cao độ của hợp âm V. Bậc 3 của nó là nốt cảm âm của giọng bài,
 * nên đây là hợp âm trưởng kể cả khi bài ở giọng thứ.
 */
export function hutDungXa(options: {
  at: number
  hut: PitchClass
  barBeats: number
}): TimelineEvent[] {
  const { at, hut, barBeats } = options
  const ngan = barBeats - HOI * (barBeats / 4)

  /*
    Giữ đúng thế bấm cú dặm SAU của bản ký âm — La2 tay trái, La3 + Đô#4 tay
    phải — chứ không phải cú đầu. Cú đầu là thế trống bậc 3; nó chỉ đứng được
    khi còn cú sau để hoàn thành câu.
  */
  const trai = nearOct(hut, 45)
  const phaiGoc = nearOct(hut, 57)
  const phaiBa = nearOct((hut + 4) % 12, 61)

  return [
    { notes: [trai], startBeat: at, durationBeats: ngan, hand: 'left', velocity: 80 },
    {
      notes: [phaiGoc, phaiBa],
      startBeat: at,
      durationBeats: ngan,
      hand: 'right',
      velocity: 78,
    },
  ]
}
