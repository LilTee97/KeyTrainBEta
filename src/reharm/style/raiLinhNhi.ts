import { chordTonesStrict } from '../fillSoloGenerator/soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

/**
 * Tay phải đoạn giang tấu, **suy ra từ tay trái** thay vì sinh độc lập.
 *
 * ## Vì sao phải đảo kiến trúc
 *
 * Bộ sinh trước cho tay phải bốc nốt từ thang gam mà **không hề biết tay trái
 * đang giữ nốt gì ở thời điểm ấy**, rồi mới để `interlockHands` xen vào tỉa
 * bớt. Hai luồng xa lạ ghép lại. Người dùng nghe ra ngay: "tay phải quá rời
 * rạc với tay trái".
 *
 * Đo mười ô giang tấu bản ký âm Linh Nhi thì thấy ngược hẳn dự đoán:
 *
 * |                          | phiên khúc | giang tấu |
 * |--------------------------|-----------|-----------|
 * | mốc gõ có CẢ HAI tay     | 45%       | **55%**   |
 * | chỉ tay trái             | 43%       | 31%       |
 * | chỉ tay phải             | 11%       | 13%       |
 * | nốt TRÙNG LỚP CAO ĐỘ     | 31%       | **47%**   |
 * | khe hai tay (trung vị)   | 19        | **24**    |
 * | tay phải xuống dưới trái | 0%        | **0%**    |
 * | hai tay cùng hướng       | 72%       | 52%       |
 *
 * Ba điều rút ra:
 *
 * 1. Vào giang tấu hai tay gõ CÙNG NHAU NHIỀU HƠN, không ít hơn.
 * 2. Gần một nửa số mốc chung, tay phải chơi lại chính lớp cao độ tay trái đang
 *    giữ — nó **nhân bản nốt tay trái lên cao**, không đi tìm nốt riêng.
 * 3. Khe cố định quanh hai quãng tám và **không bao giờ bắt chéo**.
 *
 * Còn hướng đi thì độc lập — 52/48, gần như ngẫu nhiên. Hai tay khoá nhau ở
 * NHỊP và LỚP CAO ĐỘ, còn đường nét để tự do.
 *
 * ## Chỗ này thay gì
 *
 * Đây là bản sao lối Linh Nhi, nên nó **không** dùng `interlockHands` — luật ấy
 * dựng theo Cà Pháo, nơi chỉ 32-73% nốt tay phải trùng cú gõ tay trái, tức "cài
 * vào khe". Linh Nhi làm ngược. Trộn hai phong cách là hỏng cả hai.
 */

/** Bao nhiêu phần cú gõ tay trái được tay phải gõ cùng. Đo: 55 trên 55+31. */
const CUNG_GO = 0.64

/**
 * PHÁCH 1 LUÔN CÓ NỐT TAY PHẢI. Đây là luật cứng, không phải xác suất.
 *
 * Đếm trên bản ký âm: 16/16 ô ở phiên khúc và 10/10 ô ở giang tấu đều có nốt
 * tay phải rơi ĐÚNG phách 1. Không sót một ô nào.
 *
 * Người dùng nhận ra trước khi tôi đo, và ví von rất đúng: ca sĩ luôn biết chọn
 * điểm rơi của mẫu đệm mà vào. Bỏ phách 1 thì câu solo mất chỗ bám, và đó là
 * một phần lý do bản trước nghe rời rạc — nó chỉ gõ chung 64% số mốc, nên cứ ba
 * ô lại có một ô vào trống phách 1.
 */
const PHACH_MOT = 0.03

/**
 * Móc đơn XEN ở nửa đầu ô thì thưa. Đếm trên mười ô giang tấu:
 *
 *   phách 1 → 10   1& → 5    phách 2 → 10   2& → 5
 *   phách 3 → 15   3& → 15   phách 4 → 13   4& → 14
 *
 * Đọc kỹ mới thấy: KHÔNG phải "nửa đầu thưa". Các PHÁCH đều 100% cả bốn; chỉ
 * những móc đơn XEN ở nửa đầu mới rơi xuống 50%. Nửa sau thì cả phách lẫn móc
 * đơn xen đều đầy, và còn chồng thêm nốt (15 với 14 trên mười ô).
 *
 * Bản đầu tôi bóp cả nửa đầu ô, kể cả phách 2 — làm mật độ tụt từ 8,9 xuống
 * 6,3 nốt mỗi ô và ba test khác đỏ theo. Mô hình sai thì chữa được một chỉ số
 * mà hỏng ba cái.
 */
const THUA_MOC_XEN = 0.5

/**
 * Bao nhiêu phần nốt tay phải xuống sát tay trái để ĐỆM CHUNG thay vì hát.
 *
 * Người dùng hỏi đúng chỗ có thật, nhưng đo ra nó HIẾM: chỉ 10% số nốt tay phải
 * nằm trong 12 nửa cung của trần tay trái, trung vị cả đoạn là 20. Nên đây là
 * một màu điểm xuyết, không phải kết cấu thường trực.
 *
 * CHƯA ĐẠT, VÀ CHƯA BIẾT VÌ SAO. Bản dựng đo ra 1% chứ không phải 10%. Đã thử
 * ba cách và không cách nào nhúc nhích con số:
 *
 *   1. chọn lớp cao độ nào đặt được xuống thấp, thay vì giữ nốt đã bốc
 *   2. cho nốt đệm xuống dưới sàn tầm giai điệu
 *   3. nới sàn riêng cho nhánh này
 *
 * Ghi ra đây thay vì vặn tiếp: đây là màu chiếm một phần mười, còn ba luật
 * chính — phách 1, trọng số nửa ô, khoá hai tay — đều đã đạt. Vặn mò một chỗ
 * nhỏ mà không hiểu nguyên nhân thì dễ làm hỏng ba chỗ lớn.
 */
const DEM_CHUNG = 0.1

/** Trong những mốc chung, bao nhiêu phần tay phải lấy lại lớp cao độ tay trái. */
const NHAN_BAN = 0.47

/** Bao nhiêu mốc là tay phải gõ MỘT MÌNH, chen giữa hai cú gõ tay trái. */
const RIENG = 0.2

/**
 * Bao nhiêu phần cú gõ tay phải có từ hai nốt trở lên. Đo trên bản gốc: 36%.
 *
 * Đặt cao hơn 0,36 có chủ ý, vì hai chỗ làm loãng nó: phép chồng chỉ chạy ở
 * mốc CHUNG (chừng 57% số cú gõ), và ở nửa đầu ô nó còn bị hạ xuống một phần
 * ba. Đo ra 0,36 thẳng thì chỉ còn 20%.
 *
 * Chồng nốt cũng chính là thứ làm nửa sau ô dày lên: bản gốc có 14-15 nốt trên
 * mười ô ở các vị trí cuối, tức HƠN một nốt mỗi ô.
 */
const CHONG = 0.85

/** Khe giữa hai tay: trung vị 24 nửa cung, hẹp nhất 9. */
const KHE_VUA = 24
const KHE_HEP = 9

const hash = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const lop = (note: number) => (((note % 12) + 12) % 12) as PitchClass

/**
 * Đặt một lớp cao độ vào quãng tám gần `muon` nhất, nhưng không thấp hơn `san`.
 *
 * `san` là trần tay trái cộng khe hẹp nhất — đây là chỗ giữ luật "không bao giờ
 * bắt chéo", và số đo cho 0% nên nó là luật cứng chứ không phải xu hướng.
 */
function datNot(pc: PitchClass, muon: number, san: number, tran: number): MidiNote | null {
  let note = Math.round((muon - pc) / 12) * 12 + pc
  while (note < san) note += 12
  while (note > tran) note -= 12
  return note >= san && note <= tran ? (note as MidiNote) : null
}

export interface RaiLinhNhiOptions {
  /** Tay trái đã dựng xong — bộ này bám vào nó. */
  left: readonly TimelineEvent[]
  chords: readonly ParsedChord[]
  beatsPerChord: number
  /** Độ dài một ô nhịp, để biết đâu là phách 1 và đâu là nửa sau ô. */
  barBeats?: number
  range: { low: number; high: number }
  /** Lượt chơi — đổi đường đi mà không đổi luật. */
  take?: number
}

export function raiLinhNhi(options: RaiLinhNhiOptions): TimelineEvent[] {
  const { left, chords, beatsPerChord, range } = options
  const barBeats = options.barBeats ?? beatsPerChord
  const take = options.take ?? 0
  if (left.length === 0 || chords.length === 0) return []

  /* Gom tay trái theo mốc gõ: một mốc có thể nhiều nốt. */
  const moc = new Map<number, MidiNote[]>()
  for (const event of left) {
    const at = Number(event.startBeat.toFixed(3))
    moc.set(at, [...(moc.get(at) ?? []), ...event.notes])
  }
  const mocs = [...moc.keys()].sort((a, b) => a - b)

  const hopAm = (beat: number) =>
    chords[Math.min(chords.length - 1, Math.floor(beat / beatsPerChord))]!

  const out: TimelineEvent[] = []
  let truoc = (range.low + range.high) / 2

  const them = (beat: number, note: MidiNote, manh: boolean, den: number) => {
    out.push({
      notes: [note],
      startBeat: beat,
      durationBeats: Math.max(0.05, den * 0.9),
      hand: 'right',
      velocity: manh ? 78 : 66,
      grace: false,
    })
    truoc = note
  }

  mocs.forEach((beat, index) => {
    const sau = mocs[index + 1] ?? beat + 0.5
    const keo = sau - beat
    const duoi = moc.get(beat)!
    const tranTrai = Math.max(...duoi)
    const san = Math.max(range.low, tranTrai + KHE_HEP)
    const chord = hopAm(beat)
    const tones = chordTonesStrict(chord)

    /*
      Phách 1 thì LUÔN gõ. Nửa sau ô dày hơn nửa đầu — xem `THUA_NUA_DAU`.
    */
    const trongO = ((beat % barBeats) + barBeats) % barBeats
    const laPhachMot = Math.min(trongO, barBeats - trongO) < PHACH_MOT
    const laPhach = Math.abs(trongO - Math.round(trongO)) < PHACH_MOT
    const nuaSau = trongO >= barBeats / 2
    // Phách thì luôn có; chỉ móc đơn XEN ở nửa đầu mới thưa.
    const nguong = laPhachMot || laPhach || nuaSau ? CUNG_GO : CUNG_GO * THUA_MOC_XEN

    if (laPhachMot || hash(take * 17 + index * 5) < nguong) {
      /*
        MỐC CHUNG. Gần một nửa số lần lấy lại chính lớp cao độ tay trái đang
        giữ — đây là chỗ hai tay dính vào nhau. Còn lại lấy một nốt hợp âm khác,
        để đường trên không thành bản sao y nguyên.
      */
      /*
        Không nhân bản thì phải bốc nốt KHÔNG có trong tay trái.

        Bản đầu bốc từ cả bộ nốt hợp âm, mà tay trái cũng đang chơi nốt hợp âm —
        nên nó vô tình trùng thêm, và tỉ lệ trùng lớp đo ra 66% thay vì 47%. Cái
        núm 0,47 không điều khiển được gì cả khi nhánh còn lại cũng trùng.
      */
      const dangGiu = new Set(duoi.map(lop))
      const nhanBan = hash(take * 29 + index * 11) < NHAN_BAN
      const khac = tones.filter((pc) => !dangGiu.has(pc))
      const kho = nhanBan || khac.length === 0 ? duoi.map(lop) : khac
      const pc = kho[Math.floor(hash(take * 7 + index * 13) * kho.length) % kho.length]!
      /*
        Thỉnh thoảng tay phải xuống sát tay trái ĐỆM CHUNG thay vì hát — đúng
        thứ người dùng hỏi. Nhưng chỉ 10%: đo ra vậy, và cài dày hơn là dựng ra
        một bản khác hẳn bản gốc.
      */
      const demChung = !laPhachMot && hash(take * 53 + index * 17) < DEM_CHUNG

      /*
        Đệm chung thì phải CHỌN lớp cao độ nào đặt được xuống thấp, chứ không
        giữ nốt đã bốc.

        Bản đầu giữ nguyên `pc` rồi chỉ hạ mốc mong muốn xuống. Nhưng một lớp
        cao độ chỉ có quãng tám rơi vào khe 9-12 nửa cung chừng một phần tư số
        lần, nên 10% nhân với một phần tư ra 1% — cái núm không điều khiển được
        gì. Chọn trong cả bộ nốt hợp âm thì luôn có một nốt vừa chỗ.
      */
      let note: MidiNote | null
      if (demChung) {
        /*
          Nốt đệm chung được xuống DƯỚI sàn tầm giai điệu.

          Sàn ấy (`range.low`) là để câu hát không tụt xuống vùng đệm. Nhưng nốt
          này CHÍNH LÀ nốt đệm — nó đứng thấp là đúng vai của nó. Giữ sàn thì
          khe không bao giờ nhỏ hơn 12 được: trần tay trái nhiều chỗ chỉ 45, mà
          sàn là 57. Đo ra 1% thay vì 10%, và cái núm không điều khiển được gì.

          Vẫn giữ `KHE_HEP`: không bao giờ chạm hay vượt qua tay trái.
        */
        const sanDem = tranTrai + KHE_HEP
        const thap = kho
          .map((one) => datNot(one, sanDem, sanDem, range.high))
          .filter((one): one is MidiNote => one !== null)
          .sort((x, y) => x - y)
        note = thap[0] ?? datNot(pc, tranTrai + KHE_VUA, san, range.high)
      } else {
        note = datNot(pc, tranTrai + KHE_VUA, san, range.high)
      }
      if (note !== null) them(beat, note, !demChung, keo)

      // Chồng nốt dồn về nửa sau ô: đó là chỗ bản gốc dày lên, không phải đầu ô.
      if (note !== null && hash(take * 3 + index * 41) < (nuaSau ? CHONG : CHONG * 0.3)) {
        // Chồng thêm một nốt hợp âm phía dưới, vẫn trên trần tay trái.
        const duoiPc = tones[Math.floor(hash(take * 19 + index * 23) * tones.length) % tones.length]!
        const them2 = datNot(duoiPc, note - 5, san, note - 1)
        if (them2 !== null) {
          out.push({
            notes: [them2],
            startBeat: beat,
            durationBeats: Math.max(0.05, keo * 0.9),
            hand: 'right',
            velocity: 60,
            grace: false,
          })
        }
      }
    }

    /*
      MỐC RIÊNG của tay phải, chen vào giữa hai cú gõ tay trái. Đo ra 13% số
      mốc; nó là chỗ tay phải nhô ra khỏi khung của tay trái.
    */
    // Chặn 0,3 chứ không 0,4: mẫu rải này gõ dày nên khe 0,375 rất hay gặp,
    // chặn ở 0,4 thì mốc riêng bị bóp còn 8% thay vì 13%.
    if (keo >= 0.3 && hash(take * 37 + index * 3) < RIENG) {
      const pc = tones[Math.floor(hash(take * 43 + index * 7) * tones.length) % tones.length]!
      const note = datNot(pc, truoc, san, range.high)
      if (note !== null) them(beat + keo / 2, note, false, keo / 2)
    }
  })

  /*
    CHEN CHẠY NGÓN vào ô áp chót, và dọn chỗ cho nó.

    Bỏ mọi nốt tay phải rơi trong khoảng chạy: chạy ngón là một hơi liền, có
    thêm nốt rải chen vào giữa thì nó không còn là một hơi nữa.
  */
  const khung = khungChayNgon(chords.length * beatsPerChord, barBeats)
  if (khung) {
    const con = out.filter((e) => e.startBeat < khung.tu - 1e-6 || e.startBeat >= khung.den - 1e-6)
    const chord = hopAm(khung.tu)
    const traiLucAy = mocs.filter((m) => m <= khung.tu)
    const tranTrai = traiLucAy.length > 0 ? Math.max(...moc.get(traiLucAy[traiLucAy.length - 1]!)!) : range.low
    /*
      Bắt đầu đủ thấp để trèo trọn 14 nửa cung mà không đụng trần, và vẫn trên
      tay trái. Bản gốc chạy từ 74 lên 88 trong tầm trần 95.
    */
    const dau = datNot(lop(chord.root), range.high - 16, Math.max(range.low, tranTrai + KHE_HEP), range.high)
    if (dau !== null) {
      const thu = !chordTonesStrict(chord).includes(((chord.root + 4) % 12) as PitchClass)
      con.push(...chayNgon(khung.tu, dau, thu, range.high))
      return con.sort((a, b) => a.startBeat - b.startBeat)
    }
  }

  return out.sort((a, b) => a.startBeat - b.startBeat)
}

/**
 * CHẠY NGÓN: khuôn lấy nguyên từ lần chạy DUY NHẤT trong bản ký âm.
 *
 * Cả 72 ô chỉ có một ô chạy móc kép — ô 71, tức áp chót bài. Nên đây không
 * phải thói quen thường xuyên của người soạn; nó là một cử chỉ hiếm. Người
 * dùng muốn chen vào giang tấu thì cài, nhưng cài đúng HÌNH của lần ấy và đúng
 * TẦN SUẤT một lần mỗi đoạn, chứ không rải khắp nơi.
 *
 * Đo lần chạy ấy:
 *
 *   6 nốt móc kép, bắt đầu đúng NỬA SAU ô (offset 1,5), kết ở offset 2,75
 *   bước [2, 2, 3, 5, 2] — 60% liền bậc, đi LÊN, trèo 14 nửa cung
 *   TAY TRÁI: 0 nốt trong suốt lúc chạy
 *
 * Chỗ cuối là thứ người dùng nhận ra trước: tay trái buông hẳn để nhường.
 */
const CHAY_SO_NOT = 6
const CHAY_MOC = 0.25
/** Chạy bắt đầu ở nửa sau ô, đúng chỗ bản gốc đặt. */
const CHAY_VAO = 1.5

/**
 * Dãy bước của lần chạy gốc, và một biến thể cho hợp âm thứ.
 *
 * Đặt từ nốt gốc thì [2,2,3,5,2] ra bậc 1-2-3-5-8-9 — nghe sạch trên hợp âm
 * trưởng. Trên hợp âm thứ thì bậc 3 trưởng chỏi, nên đổi bước thứ hai còn 1 để
 * ra 1-2-b3-5-8-9. Đây là CHỖ TÔI SỬA, không phải số đo: bản gốc chỉ chạy một
 * lần và lần ấy trên một chất hợp âm.
 */
const CHAY_BUOC_TRUONG = [2, 2, 3, 5, 2]
const CHAY_BUOC_THU = [2, 1, 4, 5, 2]

/**
 * Ô nào trong đoạn được chen chạy ngón, tính bằng phách tuyệt đối.
 *
 * Lấy ô ÁP CHÓT, đúng chỗ bản gốc đặt — ô 71 trên 72. Nó rơi ngay trước lúc
 * đoạn kết thúc, nên nghe ra là một câu dẫn chứ không phải một cú chen ngang.
 *
 * Bên dựng tay trái gọi chính hàm này để buông tay ra đúng khoảng ấy, nên hai
 * bên không thể lệch nhau.
 */
export function khungChayNgon(
  tongPhach: number,
  barBeats: number,
): { tu: number; den: number } | null {
  const soO = Math.floor(tongPhach / barBeats)
  if (soO < 3) return null
  const dauO = (soO - 2) * barBeats
  return { tu: dauO + CHAY_VAO, den: dauO + CHAY_VAO + CHAY_SO_NOT * CHAY_MOC }
}

/** Sáu nốt móc kép đi lên, hình lấy từ lần chạy gốc. */
export function chayNgon(
  tu: number,
  batDau: MidiNote,
  thu: boolean,
  tran: number,
): TimelineEvent[] {
  const buoc = thu ? CHAY_BUOC_THU : CHAY_BUOC_TRUONG
  const out: TimelineEvent[] = []
  let note = batDau
  for (let at = 0; at < CHAY_SO_NOT; at += 1) {
    if (note > tran) break
    out.push({
      notes: [note],
      startBeat: tu + at * CHAY_MOC,
      durationBeats: CHAY_MOC * 0.9,
      hand: 'right',
      // Nhẹ dần lên đỉnh thì nghe ra một hơi, không phải sáu cú gõ rời.
      velocity: 62 + at * 3,
      grace: false,
    })
    note = (note + (buoc[at] ?? 2)) as MidiNote
  }
  return out
}
