import { chordTonesStrict, ladderOf } from './soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from '../style/types'

/**
 * Dựng một câu nhạc bằng cách **đặt nhịp trước, đặt nốt sau**.
 *
 * ## Vì sao không dựng từ cao độ nữa
 *
 * Bản trước đóng cọc theo cú gõ của điệu rồi nối giữa hai cọc, và số nốt nối
 * tính theo một mật độ cố định — nên khe nào cũng bị chia ĐỀU. Nó đạt 16 trên
 * 24 chỉ số của cái thước rồi bị tai người dùng bác thẳng: "nghe loạn quá".
 *
 * Đo lại mới thấy chỗ hỏng, vì cái thước lúc ấy chưa có mắt nhìn nhịp:
 *
 * |               | cỡ nhịp | móc đơn | im lặng |
 * |---------------|---------|---------|---------|
 * | người thật    | 7-22    | 25-74%  | có      |
 * | sổ mẫu Licky  | 6-10    | 0-38%   | 6-8%    |
 * | bản chia đều  | 3-4     | 14-39%  | **0%**  |
 *
 * Ba tới bốn cỡ nhịp trên cả đoạn, và **không một chỗ nghỉ nào**. Chỗ "thở"
 * của bản ấy chỉ bỏ một nốt nối, còn cọc vẫn gõ đều nên khe không bao giờ đủ
 * rộng để tai nghe ra chỗ ngắt. Câu đúng hoà âm từ đầu tới cuối mà không có
 * hình dáng thì đúng là loạn.
 *
 * ## Cách dựng
 *
 * Đảo tiếp một lần nữa: **nhịp quyết định trước, cao độ tính sau.**
 *
 * 1. **Ô nhịp điệu** — rút một hình trong vốn đo được của người thật, ghép
 *    tiếp nhau cho đầy câu. Nhịp không còn là hệ quả của phép chia.
 * 2. **Chỗ nghỉ** — cuối mỗi câu để trống một khe thật, từ 1,5 nốt đen.
 * 3. **Câu đáp lặp lại hình nhịp của câu hỏi**, chỉ đổi cao độ. Đây mới là
 *    motif thật; bản trước đo ra 60% "lặp hình" nhưng con số ấy chỉ phản ánh
 *    việc nó có mỗi ba cỡ nhịp.
 * 4. **Cao độ** — chỗ nào rơi vào cú gõ mạnh của điệu thì là cọc, lấy nốt hợp
 *    âm đang vang; chỗ còn lại đi bằng bậc của gam về phía cọc kế tiếp.
 */

export interface LineNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  /** Nốt cọc — chỗ câu phải có mặt. Nốt còn lại là nốt nối. */
  anchor: boolean
}

export interface LineOptions {
  chords: readonly ParsedChord[]
  beatsPerChord: number
  /** Độ dài một ô nhịp, tính bằng nốt đen. */
  barBeats: number
  /** Chỗ neo trong một ô nhịp — cú gõ mạnh của điệu. */
  anchors: readonly number[]
  /** Ao nốt: gam đã chọn, lớp cao độ tuyệt đối. */
  scale: readonly PitchClass[]
  range: { low: number; high: number }
  /** Lượt chơi — đổi đường đi mà không đổi luật. */
  take?: number
  /**
   * RẢI MỞ RỘNG — lối tay phải ở đoạn giang tấu, thay cho câu chạy bước hẹp.
   *
   * Đo trên mười ô giang tấu bản ký âm Linh Nhi, và nó ngược hẳn dự đoán: đoạn
   * giang tấu KHÔNG phải chạy ngón nhanh.
   *
   * |                | phiên khúc | giang tấu |
   * |----------------|-----------|-----------|
   * | bước nhảy xa   | 16%       | **57%**   |
   * | liền bậc       | 34%       | 16%       |
   * | quãng ba       | 34%       | 17%       |
   * | móc kép        | 30%       | **6%**    |
   * | cú gõ chồng nốt| 17%       | **36%**   |
   * | tầm            | 52-83     | **57-95** |
   *
   * Móc kép GIẢM năm lần, thay vào đó là nhảy quãng rộng và chồng nhiều nốt,
   * trải hơn hai quãng tám. Đây là rải hợp âm mở rộng, không phải câu chạy.
   */
  moRong?: boolean
}

/**
 * Phân bố cỡ bước của lối rải mở rộng, đo trên bản ký âm.
 *
 * Ngưỡng cộng dồn: dưới 0,57 là nhảy xa, dưới 0,74 là quãng ba, dưới 0,90 là
 * liền bậc, còn lại là quãng bốn / quãng năm. Con số lấy thẳng từ số đo chứ
 * không nắn cho tròn.
 */
const MO_RONG = { xa: 0.57, ba: 0.74, lien: 0.9 }

/** Trần tầm khi rải mở rộng. Bản ký âm lên tới 95; ngoài chế độ này giữ nguyên. */
const MO_RONG_TRAN = 95

/** Bao nhiêu phần cú gõ được chồng thêm một nốt. Đo ra 36%. */
const MO_RONG_CHONG = 0.36

/**
 * Vốn ô nhịp điệu, đo trên bảy bản ký âm của Cà Pháo.
 *
 * Mỗi hình là ba khoảng liền nhau, tính bằng nốt đen; `weight` là tần suất phần
 * trăm đo được. Đếm trong phạm vi MỘT câu, không cho hình vắt qua chỗ nghỉ.
 *
 * Một phần ba số hình là móc đơn đều — nhưng hai phần ba còn lại thì không, và
 * đó mới là chỗ câu nhạc có hình dáng. Bản trước sống trọn trong một phần ba
 * ấy. Số liệu đầy đủ ở PianoBrain, item `ca-phao-cau-solo-tren-vong-hop-am`,
 * số đo 7.
 */
const CELLS: readonly { readonly gaps: readonly number[]; readonly weight: number }[] = [
  { gaps: [0.5, 0.5, 0.5], weight: 32 },
  { gaps: [1, 0.5, 0.5], weight: 8.4 },
  { gaps: [0.5, 0.5, 1], weight: 8.3 },
  { gaps: [0.5, 1, 0.5], weight: 6.4 },
  { gaps: [0.25, 0.25, 0.25], weight: 5.7 },
  { gaps: [1 / 6, 1 / 6, 1 / 6], weight: 4.9 },
  { gaps: [0.5, 1, 1], weight: 3.1 },
  { gaps: [1, 1, 0.5], weight: 2.7 },
  { gaps: [0.25, 0.25, 0.5], weight: 2.2 },
  { gaps: [0.5, 0.25, 0.25], weight: 2.2 },
  { gaps: [0.25, 0.5, 0.5], weight: 1.8 },
  { gaps: [1, 1, 1], weight: 1.6 },
]

const CELL_WEIGHT = CELLS.reduce((sum, cell) => sum + cell.weight, 0)

/** Một câu dài bấy nhiêu ô nhịp — độ dài một hơi hát. */
const PHRASE_BARS = 4

/**
 * Chỗ nghỉ cuối câu rộng ít nhất ngần này.
 *
 * Đúng bằng ngưỡng `BREATH_GAP` mà cái thước dùng để gọi một khe là chỗ nghỉ.
 * Hẹp hơn thì tai không nghe ra chỗ ngắt, và bản trước hỏng đúng ở đây.
 */
const REST_MIN = 1.5

/** Nốt rơi cách cú gõ mạnh trong ngần này thì coi như đứng vào chỗ ấy. */
const ANCHOR_PULL = 0.35

/**
 * Nốt ngân dài nhất bấy nhiêu.
 *
 * Không có nắp thì nốt cuối câu ngân trùm qua chỗ nghỉ, và chỗ nghỉ mất tác
 * dụng — cái thước vẫn đếm ra khe vì nó đo chỗ GÕ, nhưng tai thì nghe liền.
 */
const HOLD_MAX = 1.2

/**
 * Thỉnh thoảng phá nhịp luân phiên, để đường nối không nghe ra máy dệt.
 *
 * Dò bằng cái thước chứ không chọn theo cảm tính. Rút thăm độc lập cho từng
 * bước — thử ở 0,38 rồi 0,5 — đều cho kết quả lệch hẳn về một phía: 0,38 ra
 * 57-68% câu gam thuần, 0,5 ra 39-46% gam nhưng rải vọt lên 19-30%. Một câu
 * sáu nốt thì may rủi quyết định, không phải tỉ lệ. Luân phiên thì mọi cửa sổ
 * bốn nốt đều có cả hai cỡ bước; nhiễu chỉ để nó không đều tăm tắp.
 */
const JITTER = 0.22

/**
 * Hai cọc liền nhau cách nhau nhiều nhất bấy nhiêu nửa cung trước khi bị phạt.
 *
 * Bốn nửa cung là một quãng ba trưởng — vẫn nằm trong hai cỡ bước mà người thật
 * dùng. Xa hơn thì thành bước nhảy, và bước nhảy kéo câu ra khỏi vùng pha trộn.
 */
const MAX_ANCHOR_LEAP = 4


const hash = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Bậc thang gần một cao độ nhất. */
function nearest(ladder: readonly MidiNote[], target: number): number {
  let best = 0
  for (let at = 1; at < ladder.length; at += 1) {
    if (Math.abs(ladder[at]! - target) < Math.abs(ladder[best]! - target)) best = at
  }
  return best
}

/** Rút một ô nhịp, nặng tay với hình người thật dùng nhiều. */
function drawCell(seed: number): readonly number[] {
  let ticket = hash(seed) * CELL_WEIGHT
  for (const cell of CELLS) {
    ticket -= cell.weight
    if (ticket <= 0) return cell.gaps
  }
  return CELLS[0]!.gaps
}

/**
 * Hình nhịp của một câu: ghép ô nhịp cho tới gần đầy, rồi để trống phần đuôi.
 *
 * Trả về chỗ gõ tính từ đầu câu. Phần đuôi bỏ trống chính là chỗ thở — và nó
 * phải là khe THẬT, không phải một nốt bị bỏ giữa dòng nốt đều.
 */
function phraseRhythm(beats: number, seed: number): number[] {
  const rest = REST_MIN + hash(seed * 31 + 7)
  const play = Math.max(1, beats - rest)
  const out: number[] = []
  let at = 0

  for (let draw = 0; at < play - 1e-6; draw += 1) {
    for (const gap of drawCell(seed * 100 + draw)) {
      if (at >= play - 1e-6) break
      out.push(at)
      at += gap
    }
  }
  return out
}

/**
 * Nhịp của cả đoạn: mỗi câu rút một hình mới.
 *
 * KHÔNG cho câu đáp lặp lại hình nhịp của câu hỏi, dù luật ấy nghe rất có lý.
 * Đo trên bảy bản ký âm thì không có: hai câu liền nhau giống nhau 42%, mà hai
 * câu BẤT KỲ trong bài cũng đã giống nhau 44% — vốn ô nhịp hẹp nên phép so
 * trùng nào cũng ra số cao. Thử ở bốn cỡ cửa sổ, không cỡ nào tách khỏi nền.
 *
 * Bản trước lặp y nguyên hình câu trước, tức làm mạnh hơn hẳn mọi thứ đo được
 * — và chỗ mạnh quá ấy tự nó thành đều đều. Rút mới mỗi câu thì mức trùng tự
 * rơi về đúng chỗ người thật, vì nó cùng một vốn ô nhịp.
 */
function rhythmTrack(total: number, barBeats: number, take: number): number[] {
  const phraseBeats = Math.max(barBeats, barBeats * PHRASE_BARS)
  const onsets: number[] = []

  for (let phrase = 0; phrase * phraseBeats < total - 1e-6; phrase += 1) {
    const start = phrase * phraseBeats
    const shape = phraseRhythm(Math.min(phraseBeats, total - start), take * 53 + phrase)
    for (const at of shape) {
      if (start + at < total - 1e-6) onsets.push(start + at)
    }
  }
  return onsets
}

/** Cửa sổ để đo cân bằng — cỡ một hơi của người thật. */
const WINDOW = 5
/**
 * Khe rộng hơn ngần này thì sang câu khác.
 *
 * Đúng bằng `BREATH` của cái thước. Thước cắt câu ở đây rồi mới chấm từng câu
 * là gam, là rải hay pha trộn — nên chỗ nắn cũng phải cắt ở đúng chỗ ấy.
 */
const RUN_GAP = 0.5
/**
 * Nghiêng quá mức này về một cỡ bước thì nắn.
 *
 * Thấp hơn ngưỡng 0,6 mà bộ đo dùng để gọi một câu là "thuần", để có biên. Nắn
 * đúng ở 0,6 thì mọi câu nằm sát mép và một chút may rủi là rơi qua phía kia.
 */
const TILT = 0.5

const sizeOf = (gap: number) => (gap === 0 ? 'lap' : gap <= 2 ? 'buoc' : gap <= 4 ? 'ba' : 'xa')

/**
 * Hình vòm của một câu: lên tới đỉnh rồi về.
 *
 * Câu nhạc phải **đi đâu đó** rồi quay lại, không thì nó chỉ là một chuỗi nốt
 * đúng hoà âm. Tài liệu `Reference/pianoimprovnotes.md` ghi cùng ý: đổi quãng
 * âm, lúc cao lúc thấp, để tạo kịch tính; và kết câu ở một nốt ổn định.
 */
function arc(at: number, total: number, take: number): number {
  if (total <= 1) return 0.5
  const peak = 0.55 + hash(take + 3) * 0.25
  const ratio = at / (total - 1)
  return ratio <= peak ? ratio / peak : (1 - ratio) / Math.max(0.01, 1 - peak)
}

/**
 * Nắn cho **mỗi cửa sổ năm bước đều có cả hai cỡ**.
 *
 * Phép phân loại của cái thước chấm theo CỬA SỔ, không theo đoạn: một câu được
 * gọi là gam thuần khi từ 60% số bước trở lên là liền bậc. Nắn ở mức từng đoạn
 * nối thì không đủ, vì câu chạy vắt qua nhiều cọc và những bước quanh cọc không
 * ai nắn — đo ra cọc sang cọc trung bình 3,7 nửa cung, một nửa là nhảy xa.
 *
 * Nên nắn ở mức từng NỐT: đi tới đâu ngó lại năm bước vừa qua, nghiêng hẳn về
 * một cỡ thì kéo bước tới về cỡ kia. Chỉ dịch MỘT bậc thang, và chỉ khi nốt mới
 * vẫn nằm trong gam — nên câu không đổi hướng, chỉ đổi bề rộng bước.
 *
 * Không nắn nốt CỌC: cọc là chỗ hoà âm đã chốt, đụng vào là hỏng chỗ tựa.
 */
function balanceSteps(line: LineNote[], ladder: readonly MidiNote[]): LineNote[] {
  if (line.length < 3 || ladder.length < 3) return line

  const out = [...line]
  let recent: string[] = []

  for (let at = 1; at < out.length; at += 1) {
    const previous = out[at - 1]!
    const note = out[at]!

    /*
      Quên hết mỗi khi sang CÂU MỚI.

      Cái thước cắt câu ở khe rộng hơn `RUN_GAP` rồi mới chấm từng câu một. Nhớ
      vắt qua chỗ nghỉ thì mình nắn theo một cửa sổ mà thước không hề nhìn thấy
      — và câu ngắn thì chỉ vài bước, lệch một bước là đổi hẳn tên gọi.
    */
    if (note.startBeat - previous.startBeat > RUN_GAP + 1e-6) {
      recent = []
      continue
    }
    const share = (kind: string) =>
      recent.length === 0 ? 0 : recent.filter((one) => one === kind).length / recent.length

    const size = sizeOf(Math.abs(note.note - previous.note))

    /*
      Chỉ nắn khi cửa sổ NGHIÊNG HẲN về một cỡ. Nghiêng về liền bậc thì kéo một
      bước sang quãng ba, và ngược lại.

      Đã thử kéo luôn cả bước NHẢY XA về quãng ba — nghe có lý vì bước nhảy
      không thuộc cỡ nào và nó cắt câu làm đôi. Đo ra tệ hơn hẳn: 16 trên 24 chỉ
      số tụt xuống 9, vì mọi bước nhảy hoá thành quãng ba và tỉ lệ rải vọt lên
      19-44%. Bước nhảy thưa thớt hoá ra là thứ giữ cho hai cỡ kia không chiếm
      hết chỗ. Để nguyên.
    */
    const want =
      size === 'buoc' && share('buoc') >= TILT
        ? 'ba'
        : size === 'ba' && share('ba') >= TILT
          ? 'buoc'
          : null

    if (want !== null) {
      const rung = ladder.indexOf(note.note)
      for (const move of [1, -1]) {
        const candidate = ladder[rung + move]
        if (candidate === undefined) continue
        if (sizeOf(Math.abs(candidate - previous.note)) !== want) continue
        out[at] = { ...note, note: candidate }
        break
      }
    }

    recent.push(sizeOf(Math.abs(out[at]!.note - previous.note)))
    if (recent.length > WINDOW) recent.shift()
  }

  return out
}

export function buildLine(options: LineOptions): LineNote[] {
  const { chords, beatsPerChord, barBeats, anchors, scale, range } = options
  const take = options.take ?? 0
  if (chords.length === 0 || anchors.length === 0 || scale.length === 0) return []

  const tran = options.moRong ? Math.max(range.high, MO_RONG_TRAN) : range.high
  const ladder = ladderOf(scale, range.low, tran)
  if (ladder.length < 3) return []

  const total = chords.length * beatsPerChord

  /* Bước 1 — nhịp trước: chỗ nào có tiếng, chỗ nào để trống. */
  const onsets = rhythmTrack(total, barBeats, take)
  if (onsets.length === 0) return []

  /*
    Bước 2 — chỗ nào là CỌC.

    Cọc là chỗ nhịp gặp cú gõ mạnh của điệu. Không dời nốt về cho khớp cú gõ:
    dời thì hỏng chính cái hình nhịp vừa dựng. Nốt nào rơi đủ gần thì nhận vai
    cọc; cú gõ nào không có nốt nào gần thì thôi — im lặng ở phách mạnh cũng là
    một cách nói.

    ponytail: quét cả dãy cho từng cú gõ, O(n²) trên vài trăm nốt. Đổi sang
    quét một lượt nếu có ngày đoạn dài lên hàng nghìn nốt.
  */
  const marks = new Set<number>()
  for (let bar = 0; bar < total - 1e-6; bar += barBeats) {
    for (const anchor of anchors) {
      const want = bar + anchor
      if (want >= total) continue
      let best = -1
      let bestGap = ANCHOR_PULL
      onsets.forEach((at, index) => {
        const gap = Math.abs(at - want)
        if (gap <= bestGap) {
          bestGap = gap
          best = index
        }
      })
      if (best >= 0) marks.add(best)
    }
  }
  const anchorIndexes = [...marks].sort((a, b) => a - b)
  if (anchorIndexes.length === 0) return []

  /*
    Bước 3 — cao độ của cọc.

    Nốt hợp âm, và là nốt hợp âm gần chỗ hình vòm đang đi tới nhất. Không chọn
    nốt gần nốt trước nhất: làm vậy thì câu bò tại chỗ và cả đoạn phẳng lì.
  */
  const perPhrase = Math.max(2, anchors.length * PHRASE_BARS)
  const anchorNote = new Map<number, MidiNote>()
  let previousAnchor: MidiNote | null = null

  anchorIndexes.forEach((index, order) => {
    const beat = onsets[index]!
    const chord = chords[Math.min(chords.length - 1, Math.floor(beat / beatsPerChord))]!
    const tones = new Set(chordTonesStrict(chord))
    const inChord = ladder.filter((note) => tones.has((((note % 12) + 12) % 12) as PitchClass))

    /*
      Hình vòm dựng theo TỪNG CÂU, không trải cả đoạn.

      Bản đầu trải một vòm duy nhất trên cả đoạn: với bốn tám cọc thì mỗi cọc
      chỉ nhích chừng nửa cung so với cọc trước, nên bước nào cũng liền bậc và
      đo ra 86-92% câu gam thuần — người thật 6-22%. Vòm theo câu thì trong mỗi
      câu bốn ô nhịp, đường đi trải gần hết tầm, và bước quãng ba tự xuất hiện.
    */
    const height = arc(order % perPhrase, perPhrase, take + Math.floor(order / perPhrase))
    const want = range.low + height * (tran - range.low)

    /*
      Cọc KHÔNG phải lúc nào cũng là nốt hợp âm.

      Đo trên người thật: chỉ **41-69%** số nốt rơi vào phách mạnh là nốt hợp
      âm. Bản đầu của hàm này cho cọc luôn là nốt hợp âm và đo ra 100% — nghe
      ra là mọi chỗ đều thuận tai từ đầu tới cuối, tức không còn chỗ nào căng
      để giải toả. Nốt treo rơi vào phách mạnh rồi giải xuống là một trong
      những thứ làm nên câu nhạc, không phải một lỗi hoà âm.

      Cọc ngoài hợp âm luôn nằm CẠNH một nốt hợp âm trong thang, nên nốt nối
      ngay sau nó giải quyết được.
    */
    const outside = ladder.filter((note) => !inChord.includes(note))
    const wantsColour = hash(take * 17 + order * 5) < 0.45 && outside.length > 0
    const pool = wantsColour ? outside : inChord.length > 0 ? inChord : ladder

    /*
      Cọc theo vòm, NHƯNG không nhảy cóc khỏi cọc trước.

      Chọn thuần theo vòm thì hai cọc liền nhau cách trung bình 3,7 nửa cung và
      một nửa số bước là nhảy xa. Bước nhảy xa không phải liền bậc mà cũng không
      phải quãng ba, nên nó kéo câu ra khỏi vùng "pha trộn" mà người thật ở.

      Phạt phần vượt quá một quãng ba: vòm vẫn dẫn hướng, nhưng chỗ nào vòm đòi
      nhảy quá xa thì lấy nốt gần hơn trong cùng ao. Phạt chứ không cấm — cả câu
      không có một bước rộng nào thì lại phẳng.
    */
    let best = pool[0]!
    let bestCost = Infinity
    for (const note of pool) {
      /*
        Mở rộng thì cọc cũng được nhảy. Phạt cọc-sang-cọc ở bốn nửa cung là luật
        của đoạn có lời; giữ nó ở đây thì một phần ba số bước bị ghim hẹp, và
        phân bố không bao giờ với tới 57%.
      */
      const nguong = options.moRong ? 12 : MAX_ANCHOR_LEAP
      const leap = previousAnchor === null ? 0 : Math.abs(note - previousAnchor)
      const cost = Math.abs(note - want) + 1.6 * Math.max(0, leap - nguong)
      if (cost < bestCost) {
        bestCost = cost
        best = note
      }
    }
    /*
      MỞ RỘNG: dời cọc đi một quãng tám.

      Đây mới là chỗ quyết định, và tôi tìm sai hai lần trước khi thấy. Hình vòm
      đặt cọc trôi êm nên hai cọc liền nhau luôn gần nhau về cao độ — mà bước ĐI
      VÀO cọc chiếm một phần ba số bước, nên dù đường nối có nhảy xa cỡ nào thì
      tổng vẫn bị ghìm quanh 34%.

      Bản gốc làm đúng thứ này: cùng những nốt hợp âm ấy nhưng ném sang quãng
      tám khác. Nốt vẫn đúng hoà âm, chỉ đổi tầng.
    */
    let dat = best
    if (options.moRong && hash(take * 37 + order * 11) < 0.55) {
      const len = dat + 12
      const xuong = dat - 12
      if (len <= tran) dat = len as MidiNote
      else if (xuong >= range.low) dat = xuong as MidiNote
    }
    previousAnchor = dat
    anchorNote.set(index, dat)
  })

  /*
    Bước 4 — nốt còn lại đi bằng bậc của gam về phía cọc kế tiếp.

    Đường nối ĐI LANG THANG, không đi thẳng. Nội suy tuyến tính giữa hai cọc thì
    mỗi bước đúng một bậc thang, tức bước nào cũng liền bậc — đo ra 71-95% câu
    gam thuần, người thật 6-22%. Người ta không đi thẳng từ nốt này tới nốt kia:
    họ nhích một bậc, vọt một quãng ba, lùi lại, rồi mới tới.

    Không cần tới đúng nốt đích: cọc kế tiếp được đặt thẳng vào chỗ của nó, nên
    đường nối chỉ cần đi về phía ấy.
  */
  const out: LineNote[] = []
  let rung = nearest(ladder, anchorNote.get(anchorIndexes[0]!)!)
  let ahead = 0
  /** Đếm bước nối kể từ cọc gần nhất, để luân phiên hẹp / rộng. */
  let alt = 0

  onsets.forEach((beat, index) => {
    while (ahead < anchorIndexes.length && anchorIndexes[ahead]! <= index) ahead += 1
    const previous = onsets[index - 1]
    if (previous === undefined || beat - previous > RUN_GAP + 1e-6) alt = 0

    const here = anchorNote.get(index)
    if (here !== undefined) {
      rung = nearest(ladder, here)
      alt = 0
      out.push({ note: here, startBeat: beat, durationBeats: 0, anchor: true })
      // Cọc cũng được chồng nốt: đo ra 36% cú gõ có từ hai nốt, cọc không ngoại lệ.
      if (options.moRong && hash(take * 3 + index * 41) < MO_RONG_CHONG) {
        const duoi = rung >= 2 ? ladder[rung - 2] : ladder[rung + 2]
        if (duoi !== undefined && duoi !== ladder[rung]) {
          out.push({ note: duoi, startBeat: beat, durationBeats: 0, anchor: false })
        }
      }
      return
    }

    const target = anchorIndexes[ahead]
    const to = target === undefined ? rung : nearest(ladder, anchorNote.get(target)!)
    const movesLeft = target === undefined ? 2 : Math.max(1, target - index)
    const need = (to - rung) / movesLeft
    const dir = need === 0 ? (hash(take + index) < 0.5 ? 1 : -1) : Math.sign(need)

    if (options.moRong) {
      /*
        RẢI MỞ RỘNG: chọn CỠ BƯỚC trước, rồi mới tìm nốt.

        Lối thường đi ngược — bước một hai bậc thang rồi cỡ bước ra sao thì ra.
        Cách ấy không bao giờ ra được 57% nhảy xa, vì hai bậc thang trên gam bảy
        nốt nhiều nhất là bốn nửa cung.

        Nên ở đây rút cỡ bước từ chính phân bố đo được, rồi tìm nốt gần cỡ ấy
        nhất trong thang. Nhảy xa lấy 7-19 nửa cung: một quãng năm tới hơn một
        quãng tám rưỡi, đúng tầm trải của bản gốc.
      */
      const thuoc = hash(take * 11 + index * 7)
      const co =
        thuoc < MO_RONG.xa
          ? 7 + Math.floor(hash(take * 23 + index * 3) * 13)
          : thuoc < MO_RONG.ba
            ? 3 + Math.floor(hash(take * 5 + index * 19) * 2)
            : thuoc < MO_RONG.lien
              ? 1 + Math.floor(hash(take * 31 + index) * 2)
              : 5 + Math.floor(hash(take * 13 + index * 29) * 2)

      const dich = ladder[rung]! + dir * co
      let chon = nearest(ladder, dich)
      // Đụng mép thì quay đầu, đừng dồn cục ở đầu này hay đầu kia của tầm.
      if (chon === rung) chon = nearest(ladder, ladder[rung]! - dir * co)
      rung = chon
      out.push({ note: ladder[rung]!, startBeat: beat, durationBeats: 0, anchor: false })

      /*
        Chồng thêm một nốt. Đo ra 36% cú gõ có từ hai nốt trở lên, dày nhất năm.
        Lấy nốt hợp âm dưới nốt vừa chọn — chồng lên trên thì át mất đường trên.
      */
      if (hash(take * 3 + index * 41) < MO_RONG_CHONG) {
        // Xuống hai bậc; sát đáy thì lên hai bậc, đừng bỏ cú chồng vì hết chỗ.
        const duoi = rung >= 2 ? ladder[rung - 2] : ladder[rung + 2]
        if (duoi !== undefined && duoi !== ladder[rung]) {
          out.push({ note: duoi, startBeat: beat, durationBeats: 0, anchor: false })
        }
      }
      return
    }

    /*
      LUÂN PHIÊN bước hẹp và bước rộng, và **đếm lại từ đầu sau mỗi cọc**.

      Rút thăm độc lập từng bước thì một câu sáu nốt rất dễ lệch hẳn về một phía
      do may rủi: để 0,38 ra 57-68% câu gam thuần, nâng lên 0,5 thì gam xuống
      còn 39-46% nhưng rải vọt lên 19-30% — đổi thái cực này lấy thái cực kia.
      Người thật 68-82% pha trộn, tức câu nào của họ cũng có cả hai cỡ bước.

      Đếm theo cả đoạn cũng không được: câu bây giờ chỉ dài bốn tới bảy nốt, mỗi
      lần sang câu mới thì pha luân phiên rơi vào đâu là do may rủi, và câu bốn
      nốt lệch pha một bước là ba trên bốn bước cùng cỡ — thước gọi ngay là
      "thuần".

      Cọc chọn nốt hợp âm, mà nốt hợp âm cách nhau quãng ba, nên bước cọc-sang-
      cọc gần như luôn rộng. Đếm lại từ cọc thì bước ngay sau cọc luôn hẹp.

      KHÔNG ngả thêm về nốt hợp âm được nữa, dù nốt nối của bộ này chỉ 40-45% là
      nốt hợp âm còn người thật 49-62%. Trên gam bảy nốt, một bậc thang LUÔN là
      1-2 nửa cung và hai bậc LUÔN là 3-4 — đã kiểm. Nghĩa là trong một cỡ bước
      chỉ có đúng một nốt, không có gì để chọn. Muốn kéo tỉ lệ ấy lên thì phải
      trả bằng cỡ bước, mà cỡ bước thì đang nằm trong khoảng người thật.
    */
    alt += 1
    const turn = alt % 2 === 0
    const wide = hash(take * 7 + index * 13) < JITTER ? !turn : turn
    rung = Math.max(0, Math.min(ladder.length - 1, rung + dir * (wide ? 2 : 1)))
    out.push({ note: ladder[rung]!, startBeat: beat, durationBeats: 0, anchor: false })
  })

  /*
    Trường độ: ngân tới nốt kế, nhưng có NẮP.

    Không có nắp thì nốt cuối câu ngân trùm qua chỗ nghỉ và chỗ nghỉ mất tác
    dụng: thước vẫn đếm ra khe vì nó đo chỗ gõ, còn tai thì nghe liền một mạch.
  */
  /*
    RẢI MỞ RỘNG thì KHÔNG nắn cân bằng bước.

    `balanceSteps` kéo mỗi cửa sổ năm bước về chỗ có cả hai cỡ, vì người thật ở
    đoạn có lời chơi 68-82% câu pha trộn. Đoạn giang tấu thì ngược hẳn: 57% nhảy
    xa. Nắn ở đây là kéo kết quả về đúng chỗ vừa cố thoát ra — đo ra nhảy xa chỉ
    còn 33% thay vì 57%, và quãng ba phình lên 31%.
  */
  const sorted = options.moRong ? out : balanceSteps(out, ladder)
  return sorted.map((note, index) => {
    const next = sorted[index + 1]?.startBeat ?? total
    const room = (next - note.startBeat) * 0.92
    return { ...note, durationBeats: Math.max(0.05, Math.min(room, HOLD_MAX)) }
  })
}

/**
 * Đổi câu dựng được thành tiếng đàn.
 *
 * Nốt CỌC đánh nặng hơn nốt nối: cọc là chỗ câu phải có mặt, nối chỉ là đường
 * đi tới đó. Chênh lệch nhỏ thôi — nghe ra hình câu, không nghe ra hai lớp.
 */
export function lineToTimeline(
  line: readonly LineNote[],
  velocity = 72,
): TimelineEvent[] {
  return line.map((note) => ({
    notes: [note.note],
    startBeat: note.startBeat,
    durationBeats: note.durationBeats,
    hand: 'right' as const,
    velocity: Math.round(note.anchor ? velocity * 1.08 : velocity * 0.9),
    grace: false,
  }))
}
