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

/**
 * Bao nhiêu phần ô nhịp có tay phải GIỮ một nốt dài, tay trái đi tiếp.
 *
 * Người dùng đề nghị "đảo vai": tay phải giữ hợp âm, tay trái chạy. Đo thì
 * thấy NỬA ĐÚNG NỬA SAI, và phần đúng lại thường xuyên hơn tôi tưởng:
 *
 *   tay phải giữ nốt dài, tay trái đi tiếp   CÓ — 5/10 ô giang tấu, 23/72 cả bài
 *   tay trái CHẠY                            gần như không — 3 ô, và đó là cặp
 *                                            móc kép sẵn có của mẫu
 *
 * Nên cài phần đo được, bỏ phần tự nghĩ. Đo kỹ chỗ ấy:
 *
 *   trường độ đúng 2,0 phách — nửa ô, không hơn
 *   vào ở phách 1 (5 lần) hoặc phách 3 (4 lần), tức đầu một nửa ô
 *   tay trái vẫn gõ 3,6 nốt trong lúc giữ
 *
 * Bộ sinh trước KHÔNG BAO GIỜ giữ nốt — trường độ luôn bám tới cú gõ kế. Đó là
 * một lý do nữa khiến nó nghe dày và không có chỗ thở.
 */
const GIU_NUA_O = 0.5

/**
 * CHUỖI LIỀN BẬC — câu chạy scale, và nó THƯỜNG XUYÊN hơn tôi tưởng nhiều.
 *
 * Người dùng nghe ra tay phải "quá đơn sơ và thiếu câu chạy scale". Đúng, và
 * nguyên nhân là một phép đo hỏng của tôi.
 *
 * Số đầu tiên tôi báo — 57% nhảy xa, 16% liền bậc — tính theo từng cặp nốt liền
 * nhau TRONG MẢNG, nên nốt CHỒNG (cùng một chỗ gõ, thấp hơn vài bậc) bị đếm
 * thành một bước. Tôi đã tìm ra lỗi ấy khi đo bộ sinh nhưng KHÔNG áp lại cho
 * bản gốc. Đo lại đường trên cùng, bỏ các cặp cùng chỗ gõ:
 *
 *   liền bậc 39% · quãng ba 19% · quãng 4-5 9% · nhảy xa 33%
 *
 * Và trong mười ô có 5 CHUỖI liền bậc từ 3 nốt trở lên, dài [3, 3, 4, 7, 3] —
 * tức cứ hai ô lại có một câu chạy, và có chuỗi tới bảy nốt.
 *
 * Thử mỗi ô một lần (`CHUOI_MOI_O` = 1) chứ không phải nửa số ô: chuỗi nào dài
 * hơn số cú gõ còn lại trong ô thì bị bỏ, nên tỉ lệ thử phải cao hơn tỉ lệ
 * thành. Để 0,5 thì đo ra 2,5 chuỗi mỗi đoạn thay vì 5.
 *
 * Độ dài nghiêng về 3-4: bản gốc ra [3, 3, 4, 7, 3] — bốn trên năm chuỗi là
 * ngắn, chuỗi bảy nốt là ngoại lệ. Rút thăm đều 3-7 thì chuỗi dài hay không
 * vừa ô rồi bị bỏ, và tổng số chuỗi tụt.
 */
const CHUOI_MOI_O = 1

/**
 * Bao nhiêu phần ô có thêm một câu chạy móc kép ngắn.
 *
 * Người dùng bảo "không nghe thấy câu chạy ngón nào nữa". Đo ra thì CÓ — sáu
 * nốt ở ô áp chót — nhưng đúng một lần trên cả đoạn mười ô, và nó bị nốt thấp
 * ngay sau đó chôn mất. Một lần thì tai không kịp nhận ra.
 *
 * Thêm câu chạy ngắn rải trong đoạn. Bản gốc chỉ chạy một lần trên CẢ BÀI, nên
 * đây là LỰA CHỌN PHỐI KHÍ theo yêu cầu người dùng, không phải số đo.
 */
const CHAY_THEM = 0.35
const CHUOI_NGAN = 3
const CHUOI_DAI = 7

/**
 * CỬA RA — ô cuối đoạn, hợp âm chồng dày để hút sang đoạn kế.
 *
 * Người dùng muốn cuối giang tấu có câu chạy ngón cộng một hợp âm hút mạnh,
 * rải như đoạn kết, để báo sang phần sau. Đo bản gốc thì thấy hai việc ấy nằm
 * ở HAI Ô KHÁC NHAU, và ô cuối giang tấu KHÔNG chạy ngón:
 *
 *   ô 61, cuối giang tấu, hợp âm A (bậc V):
 *     16 nốt tay phải — dày nhất bài — chồng 4 · 4 · 5 nốt ở phách 1&, 2, 3
 *     trải 17 nửa cung, tay trái vẫn gõ 11 nốt
 *
 *   ô 71, áp chót đoạn kết, hợp âm D7:
 *     ngân 1,5 phách → chồng 3 nốt → 6 móc kép chạy lên → hạ cánh
 *
 * Nên cửa ra là CHỒNG HỢP ÂM chứ không phải chạy ngón, và nó rơi vào ô CUỐI.
 * Câu chạy giữ nguyên chỗ cũ — ô áp chót — nên hai cử chỉ nối tiếp nhau đúng
 * như bản gốc: chạy rồi mới chồng.
 *
 * Cả hai ô đều đứng trên hợp âm hút (bậc V và bậc V7). Chỗ ấy là của vòng hợp
 * âm, không phải của bộ này — bộ này chỉ dày lên đúng chỗ vòng đã hút sẵn.
 */
/**
 * Cửa ra: MỘT cú dặm rồi ngân, không lặp ba khối giống hệt.
 *
 * Bản đầu chồng đúng bốn nốt ấy ba lần ở phách 1, 1&, 2 rồi im tới phách 3&.
 * Nghe ra là một khối tĩnh lặp lại rồi tắt — đúng cái người dùng gọi là "dặm
 * hợp âm rồi nghỉ". Cử chỉ báo hiệu phải là MỘT cú, đủ dày, rồi để nó vang.
 */
const CUA_RA_CHONG = [5]
/*
  Chồng ngay TỪ VẠCH NHỊP. Bản gốc chồng ở phách 1&, 2, 3 — nhưng ở đó ô trước
  vẫn đang chạy tiếp vào, còn bản dựng thì câu chạy vừa đáp xuống đúng vạch.
  Để trống phách 1 thì có một khe ngay giữa hai cử chỉ, và đó là chỗ khựng.
*/
const CUA_RA_PHACH = [0]

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
  /**
   * Gam để chạy chuỗi liền bậc.
   *
   * Bỏ trống thì chỉ dùng nốt hợp âm, và lúc ấy không chạy chuỗi được — nốt hợp
   * âm cách nhau quãng ba, đi liền bậc trên chúng là bất khả.
   */
  scale?: readonly PitchClass[]
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
        /*
          DẪN GIỌNG: đặt nốt gần NỐT TRƯỚC, không phải luôn ở trần tay trái
          cộng hai quãng tám.

          Bản đầu luôn nhắm `tranTrai + KHE_VUA`, nên mỗi nốt nhảy tới chỗ tay
          trái đang ở — mà tay trái thì rải lên xuống suốt. Đo ra bước trung
          bình 7,1 nửa cung, tức mỗi bước một quãng năm, trên 65 cú gõ. Người
          dùng nghe ra ngay: "quá lạc quẻ, sai về mặt giai điệu".

          Nay nhắm vào chỗ giữa nốt trước và mốc cũ, nghiêng hẳn về nốt trước
          (bốn phần một). Giai điệu đi liền được, mà vẫn bị kéo về đúng tầng so
          với tay trái. Đo lại: bước trung bình 7,1 xuống còn quanh 4,5.
        */
        const moc2 = (truoc * 4 + (tranTrai + KHE_VUA)) / 5
        note = datNot(pc, moc2, san, range.high)
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
  /*
    GIỮ NỬA Ô: tay phải ngân một nốt trọn nửa ô, tay trái đi tiếp bên dưới.

    Làm sau cùng, trên kết quả đã dựng: giữ nốt ĐẦU của nửa ô ấy rồi bỏ những
    nốt còn lại trong nửa ấy. Cách này không đụng vào phép chọn cao độ, nên mọi
    luật khoá hai tay ở trên vẫn nguyên — kể cả luật phách 1 luôn có nốt, vì
    nốt được giữ chính là nốt phách 1.
  */
  /*
    CHUỖI LIỀN BẬC. Làm trước phép giữ nửa ô, vì chuỗi cần chuỗi nốt liền nhau
    còn nguyên; giữ nốt thì chỉ đổi trường độ nên hai việc không đụng nhau.

    Chọn một chỗ mở chuỗi trong ô rồi kéo 3-7 nốt liền bậc trên gam. Đi lên hay
    xuống rút thăm — bản gốc có cả hai.
  */
  const gam = options.scale
  if (gam && gam.length >= 5) {
    const thang: MidiNote[] = []
    for (let note = range.low; note <= range.high; note += 1) {
      if (gam.includes(lop(note))) thang.push(note as MidiNote)
    }
    const soO = Math.ceil((chords.length * beatsPerChord) / barBeats)
    for (let o = 0; o < soO; o += 1) {
      if (hash(take * 83 + o * 19) >= CHUOI_MOI_O) continue
      const trong = out
        .filter((e) => e.startBeat >= o * barBeats && e.startBeat < (o + 1) * barBeats)
        .sort((a, b) => a.startBeat - b.startBeat)
      // Nghiêng về chuỗi ngắn: bình phương phép rút thăm dồn kết quả về đầu dãy.
      const thuoc = hash(take * 89 + o * 7) ** 2
      const dai = CHUOI_NGAN + Math.floor(thuoc * (CHUOI_DAI - CHUOI_NGAN + 1))
      if (trong.length < dai) continue
      const tu = Math.floor(hash(take * 97 + o * 11) * (trong.length - dai + 1))
      const len = hash(take * 101 + o * 3) < 0.5 ? 1 : -1

      let bac = 0
      for (let at = 0; at < thang.length; at += 1) {
        if (Math.abs(thang[at]! - trong[tu]!.notes[0]!) < Math.abs(thang[bac]! - trong[tu]!.notes[0]!)) bac = at
      }
      for (let at = 0; at < dai; at += 1) {
        const buoc = Math.max(0, Math.min(thang.length - 1, bac + len * at))
        trong[tu + at]!.notes = [thang[buoc]!]
      }
    }
  }

  const tong = chords.length * beatsPerChord
  const nuaO = barBeats / 2
  for (let o = 0; o * barBeats < tong - 1e-6; o += 1) {
    if (hash(take * 61 + o * 13) >= GIU_NUA_O) continue
    const nua = hash(take * 71 + o * 7) < 0.55 ? 0 : 1
    const tu = o * barBeats + nua * nuaO
    const den = tu + nuaO
    const trong = out
      .filter((e) => e.startBeat >= tu - 1e-6 && e.startBeat < den - 1e-6)
      .sort((a, b) => a.startBeat - b.startBeat)
    /*
      Chỉ ngân khi nửa ô ấy CÓ nốt rơi đúng đầu nửa. Bản gốc vào ở phách 1 hoặc
      phách 3, tức đầu một nửa ô — không có lần nào ngân từ giữa nửa. Không đòi
      chỗ ấy thì nốt ngân trôi vào offset 3 và mất luôn cảm giác "mở nửa ô".
    */
    if (trong.length < 2 || Math.abs(trong[0]!.startBeat - tu) > 1e-6) continue
    /*
      NGÂN, KHÔNG XOÁ. Đây là chỗ tôi làm sai lần đầu.

      Bản đầu bỏ hết nốt còn lại trong nửa ô ấy, và mật độ tụt từ 8,9 xuống 6,8
      nốt mỗi ô. Đo lại bản gốc thì thấy vô lý ngay: ô 53 có 10 nốt tay phải VÀ
      2 nốt giữ cùng lúc, mà cả đoạn vẫn 9,3 nốt mỗi ô.

      Nốt giữ là MỘT NGÓN ngân — các ngón khác vẫn chạy tiếp bên trên. Đó cũng
      đúng lời người dùng: "tay phải giữ hợp âm", giữ chứ không ngừng.
    */
    trong[0]!.durationBeats = nuaO * 0.98
  }

  /*
    CỬA RA: ô cuối đoạn dày lên bằng hợp âm chồng, hút sang đoạn kế.

    ĐẶT TRƯỚC khối chạy ngón, không phải sau. Lần đầu tôi để nó sau và nó thành
    code chết: nhánh chạy ngón thoát ra bằng `return con.sort(...)` nên không
    bao giờ chạy tới đây. Đo ra 0 nốt cửa ra, và nếu không lần theo `velocity`
    riêng thì tưởng là thuật toán sai chứ không phải luồng sai.
  */
  const oCuoi = Math.floor((tong - 1e-6) / barBeats) * barBeats
  if (tong >= barBeats * 2) {
    const chord = hopAm(oCuoi)
    const tones = chordTonesStrict(chord)
    const traiCuoi = mocs.filter((m) => m >= oCuoi)
    const tranTrai =
      traiCuoi.length > 0 ? Math.max(...traiCuoi.flatMap((m) => moc.get(m)!)) : range.low
    const san = Math.max(range.low, tranTrai + KHE_HEP)

    CUA_RA_PHACH.forEach((phach, at) => {
      const luc = oCuoi + phach
      if (luc >= tong) return
      const soNot = CUA_RA_CHONG[at]!
      // Xếp chồng từ dưới lên, mỗi nốt một bậc hợp âm — trải như bản gốc.
      let duoiCung = san
      for (let lop2 = 0; lop2 < soNot; lop2 += 1) {
        const pc = tones[lop2 % tones.length]!
        const note = datNot(pc, duoiCung, duoiCung, range.high)
        if (note === null) break
        out.push({
          notes: [note],
          startBeat: luc,
          // Ngân dài: đây là chỗ đáp của câu chạy, không phải một cú dặm rồi tắt.
          durationBeats: barBeats * 0.9,
          hand: 'right',
          velocity: 88,
          grace: false,
        })
        duoiCung = note + 1
      }
    })
  }

  /*
    CÂU CHẠY NGẮN rải trong đoạn, ngoài câu chạy ở cửa ra.

    Bốn móc kép vào nửa sau ô, cùng hình đi lên với câu chạy chính. Đặt sau
    phép chuỗi liền bậc nên nó đè lên, và đó là chủ ý: chạy móc kép nghe rõ hơn
    chuỗi móc đơn.
  */
  if (gam && gam.length >= 5) {
    const soO2 = Math.ceil(tong / barBeats)
    for (let o = 1; o < soO2 - 2; o += 1) {
      if (hash(take * 107 + o * 23) >= CHAY_THEM) continue
      const tuChay = o * barBeats + barBeats / 2
      const truocDo = out
        .filter((e) => e.startBeat < tuChay)
        .sort((a, b) => b.startBeat - a.startBeat)[0]
      const batDau = truocDo ? Math.min(...truocDo.notes) : range.low + 12
      const chord2 = hopAm(tuChay)
      const thu2 = !chordTonesStrict(chord2).includes(((chord2.root + 4) % 12) as PitchClass)
      const con2 = out.filter(
        (e) => e.startBeat < tuChay - 1e-6 || e.startBeat >= tuChay + 1 - 1e-6,
      )
      out.length = 0
      out.push(...con2, ...chayNgon(tuChay, batDau as MidiNote, thu2, range.high).slice(0, 4))
    }
  }

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
/**
 * Câu chạy HẠ CÁNH ĐÚNG VẠCH NHỊP của ô cuối, không dừng trước đó.
 *
 * Bản đầu đặt chạy từ offset 1,5 tới 3,0 rồi để trống một phách, sau đó cửa ra
 * mới vào ở phách 1&. Người dùng nghe ra ngay: "dặm hợp âm rồi nghỉ rồi đánh
 * thêm hợp âm báo vào, nghe nó khựng lại rất dở". Đúng — giữa hai cử chỉ có
 * một phách trống, và một phách trống ở chỗ ấy nghe như hụt chân.
 *
 * Nay chạy chiếm 1,5 phách CUỐI ô áp chót, nốt cuối rơi ngay trước vạch, và
 * hợp âm báo đứng ĐÚNG vạch. Thành một cử chỉ liền: chạy lên rồi đáp.
 */
const CHAY_LUI = 1.5

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
  // Lùi từ vạch nhịp ô cuối, để nốt cuối câu chạy đáp ngay vào hợp âm báo.
  const vach = (soO - 1) * barBeats
  return { tu: vach - CHAY_LUI, den: vach }
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
