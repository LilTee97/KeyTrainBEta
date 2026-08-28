import { chordTonesStrict, ladderOf } from './soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from '../style/types'

/**
 * Dựng một câu nhạc bằng cách **đóng cọc rồi nối**, thay cho dập hình có sẵn.
 *
 * ## Vì sao không dùng sổ mẫu nữa
 *
 * Cơ chế cũ (`licky/generate.ts`) bốc một hình quãng trong sổ 39 mẫu bằng cách
 * băm số lượt, tô nó lên thang nốt, rồi mới sửa **đúng nốt cuối** cho rơi vào
 * nốt dẫn. Hoà âm chỉ được hỏi ý ở một chỗ duy nhất, sau khi hình đã chốt.
 *
 * Ba triệu chứng đo được, cùng một gốc ấy:
 *
 * - Nguồn nốt mặc định ra **33-59% câu rải hợp âm thuần**, người thật 2-11%.
 *   Không phải chọn tồi — nốt hợp âm cách nhau quãng ba, nên câu chỉ gồm nốt
 *   hợp âm BẮT BUỘC thành rải.
 * - Mật độ chỉ điều khiển được **4%**: số nốt là của hình lick, không phải một
 *   tham số. Đổi `sparse` sang `medium` ở đoạn giang tấu từng ra từng nốt trùng
 *   khít.
 * - Hình câu lệch: **83-93% pha trộn** so với 68-82% của người thật, và câu gam
 *   thuần chỉ 2-10% so với 6-22%.
 *
 * ## Cách dựng
 *
 * Đảo ngược thứ tự: **hoà âm và nhịp quyết định trước, đường đi tính sau.**
 *
 * 1. **Cọc** — câu phải có mặt ở đâu, và là nốt gì. Chỗ lấy từ cú gõ mạnh của
 *    chính điệu đang chơi; nốt lấy từ nốt hợp âm đang vang.
 * 2. **Nối** — giữa hai cọc đi bằng bậc của gam đã chọn, số nốt tính theo thời
 *    gian còn trống.
 *
 * Hình câu không cần ép: nó là **hệ quả** của việc đi từ cọc này tới cọc kia
 * trong một cái ao có sẵn. Hai cọc gần nhau thì đường nối ra liền bậc; xa nhau
 * thì phải bước quãng ba trở lên. Đó chính là chỗ tỉ lệ 19% gam / 5% rải / 74%
 * pha trộn của người thật sinh ra một cách tự nhiên, không phải một con số phải
 * nhắm vào.
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
}

/**
 * Câu chạy dày cỡ này, tính bằng nốt mỗi nốt đen.
 *
 * Đo trên bản ký âm của Cà Pháo, đoạn giang tấu: 9,4-14,9 nốt mỗi ô nhịp 4/4,
 * tức khoảng 2,4-3,7 nốt mỗi nốt đen. Lấy mép dưới, vì đây là câu đệm chứ
 * không phải một bản độc tấu jazz.
 */
const NOTES_PER_BEAT = 2.4

/**
 * Một hơi dài bao nhiêu nốt thì phải nghỉ.
 *
 * Người thật: câu chạy dài trung vị **6 nốt**. Không phải vì họ đếm, mà vì
 * người ta thở — và câu nhạc không có chỗ thở thì nghe như đọc một câu văn
 * không dấu chấm. Nghỉ ở đây là khe THẬT, đủ rộng để tai nghe ra chỗ ngắt.
 */
const BREATH_AFTER = 6
/** Khe nghỉ phải rộng hơn ngần này thì mới ra một chỗ ngắt. */
const REST_GAP = 0.75


/**
 * Thỉnh thoảng phá nhịp luân phiên, để câu không nghe ra máy dệt.
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

/**
 * Hình vòm của cả đoạn: lên tới đỉnh rồi về.
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

/** Cửa sổ để đo cân bằng — cỡ một hơi của người thật. */
const WINDOW = 5
/**
 * Nghiêng quá mức này về một cỡ bước thì nắn.
 *
 * Thấp hơn ngưỡng 0,6 mà bộ đo dùng để gọi một câu là "thuần", để có biên. Nắn
 * đúng ở 0,6 thì mọi câu nằm sát mép và một chút may rủi là rơi qua phía kia.
 */
const TILT = 0.5

const sizeOf = (gap: number) => (gap === 0 ? 'lap' : gap <= 2 ? 'buoc' : gap <= 4 ? 'ba' : 'xa')

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
 * Không nắn nốt đầu: nó là chỗ câu bắt đầu, không có bước nào trước nó.
 */
function balanceSteps(line: LineNote[], ladder: readonly MidiNote[]): LineNote[] {
  if (line.length < 3 || ladder.length < 3) return line

  const out = [...line]
  const recent: string[] = []

  for (let at = 1; at < out.length; at += 1) {
    const previous = out[at - 1]!
    const note = out[at]!
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

  const ladder = ladderOf(scale, range.low, range.high)
  if (ladder.length < 3) return []

  /* Bước 1 — đóng cọc: chỗ nào, hợp âm nào. */
  const posts: { beat: number; chord: ParsedChord }[] = []
  chords.forEach((chord, index) => {
    const start = index * beatsPerChord
    for (let at = 0; at < beatsPerChord - 1e-6; at += barBeats) {
      for (const anchor of anchors) {
        if (at + anchor < beatsPerChord - 1e-6) {
          posts.push({ beat: start + at + anchor, chord })
        }
      }
    }
  })
  if (posts.length === 0) return []

  /*
    Bước 2 — chọn cao độ cho từng cọc.

    Nốt hợp âm, và là nốt hợp âm gần chỗ hình vòm đang đi tới nhất. Không chọn
    nốt gần nốt trước nhất: làm vậy thì câu bò tại chỗ và cả đoạn phẳng lì.
  */
  const pitchedSoFar: { beat: number; chord: ParsedChord; note: MidiNote }[] = []
  const pitched = posts.map((post, index) => {
    const tones = new Set(chordTonesStrict(post.chord))
    const inChord = ladder.filter((note) =>
      tones.has((((note % 12) + 12) % 12) as PitchClass),
    )
    /*
      Hình vòm dựng theo TỪNG CÂU, không trải cả đoạn.

      Bản đầu trải một vòm duy nhất trên cả đoạn: với bốn tám cọc thì mỗi cọc
      chỉ nhích chừng nửa cung so với cọc trước, nên bước nào cũng liền bậc và
      đo ra 86-92% câu gam thuần — người thật 6-22%. Vòm theo câu thì trong mỗi
      câu bốn ô nhịp, đường đi trải gần hết tầm, và bước quãng ba tự xuất hiện.

      Bốn ô nhịp một câu là độ dài một hơi hát; nó cũng khớp `chordsPerPhrase`
      mặc định của bộ sinh cũ.
    */
    const perPhrase = Math.max(2, anchors.length * 4)
    const height = arc(index % perPhrase, perPhrase, take + Math.floor(index / perPhrase))
    const want = range.low + height * (range.high - range.low)

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
    const wantsColour = hash(take * 17 + index * 5) < 0.45 && outside.length > 0
    const pool = wantsColour ? outside : inChord.length > 0 ? inChord : ladder

    /*
      Cọc theo vòm, NHƯNG không nhảy cóc khỏi cọc trước.

      Chọn thuần theo vòm thì hai cọc liền nhau cách trung bình 3,7 nửa cung và
      một nửa số bước là nhảy xa — đo trên chính bộ này. Bước nhảy xa không phải
      liền bậc mà cũng không phải quãng ba, nên nó kéo câu ra khỏi vùng "pha
      trộn" mà người thật ở (68-82%).

      Phạt phần vượt quá một quãng ba: vòm vẫn dẫn hướng, nhưng chỗ nào vòm đòi
      nhảy quá xa thì lấy nốt gần hơn trong cùng ao. Phạt chứ không cấm — cả câu
      không có một bước rộng nào thì lại phẳng.
    */
    const previous = pitchedSoFar[pitchedSoFar.length - 1]
    let best = pool[0]!
    let bestCost = Infinity
    for (const note of pool) {
      const leap = previous === undefined ? 0 : Math.abs(note - previous.note)
      const cost = Math.abs(note - want) + 1.6 * Math.max(0, leap - MAX_ANCHOR_LEAP)
      if (cost < bestCost) {
        bestCost = cost
        best = note
      }
    }
    const chosen = { ...post, note: best }
    pitchedSoFar.push(chosen)
    return chosen
  })

  /*
    Bước 3 — nối giữa hai cọc bằng bậc của gam.

    Số nốt nối tính theo thời gian còn trống, rồi trải đều khoảng cách cao độ
    trên bấy nhiêu bước. Khoảng cách chia cho số bước chính là thứ quyết định
    câu ra liền bậc hay ra quãng ba — không ép, để nó tự ra.
  */
  const out: LineNote[] = []
  const total = chords.length * beatsPerChord
  /** Bao nhiêu nốt đã chạy liền kể từ chỗ nghỉ gần nhất. */
  let since = 0

  pitched.forEach((post, index) => {
    const next = pitched[index + 1]
    since += 1
    out.push({
      note: post.note,
      startBeat: post.beat,
      durationBeats: 0,
      anchor: true,
    })
    if (!next) return

    const gap = next.beat - post.beat

    /*
      NGHỈ LẤY HƠI. Hơi dài quá thì bỏ trống trọn khe này.

      Người thật chạy trung vị sáu nốt một hơi. Bản đầu không có chỗ nghỉ nào
      nên cả đoạn dính làm một hơi dài mười bảy tới hai mươi hai nốt — nghe như
      đọc một câu văn không dấu chấm. Khe phải đủ rộng thì tai mới nghe ra chỗ
      ngắt, nên chỉ nghỉ ở khe từ `REST_GAP` trở lên.
    */
    if (since >= BREATH_AFTER && gap >= REST_GAP) {
      since = 0
      return
    }

    // Số nốt nối tính theo MẬT ĐỘ, không theo một lưới cố định — điệu nào cọc
    // thưa thì nối nhiều, cọc dày thì nối ít, và mật độ chung giữ nguyên.
    const room = Math.max(0, Math.round(gap * NOTES_PER_BEAT) - 1)
    if (room === 0) return

    /*
      Đường nối ĐI LANG THANG, không đi thẳng.

      Nội suy tuyến tính giữa hai cọc thì mỗi bước đúng một bậc thang, tức bước
      nào cũng liền bậc — đo ra 71-95% câu gam thuần, người thật 6-22%. Người
      ta không đi thẳng từ nốt này tới nốt kia: họ nhích một bậc, vọt một quãng
      ba, lùi lại, rồi mới tới.

      Nên mỗi bước chọn đi **một bậc hay hai bậc**, hướng theo chỗ còn phải đi,
      và cứ khoảng một phần ba số bước thì đi hai. Hai bậc thang là một quãng
      ba — đúng thứ làm nên 68-82% câu pha trộn.

      Không cần tới đúng nốt đích: cọc kế tiếp được đặt thẳng vào chỗ của nó,
      nên đường nối chỉ cần đi về phía ấy.
    */
    const from = nearest(ladder, post.note)
    const to = nearest(ladder, next.note)
    const slot = gap / (room + 1)
    let at = from

    for (let step = 1; step <= room; step += 1) {
      const movesLeft = room + 1 - step
      const need = (to - at) / Math.max(1, movesLeft)
      const dir = need === 0 ? (hash(take + index + step) < 0.5 ? 1 : -1) : Math.sign(need)
      /*
        Bề rộng bước KHÔNG phụ thuộc còn phải đi bao xa.

        Bản trước ép đi hai bậc mỗi khi khoảng cách còn lớn, nên khe nào xa thì
        cả khe toàn quãng ba (34% câu rải thuần) và khe nào gần thì cả khe liền
        bậc (43-65% câu gam thuần) — hai thái cực, không có ở giữa. Người thật
        thì 68-82% số câu là PHA TRỘN.

        Khoảng cách chỉ quyết định HƯỚNG. Bề rộng rút thăm, và cọc kế tiếp được
        đặt thẳng vào chỗ của nó nên đường nối không tới đúng cũng không sao —
        chỗ hụt lại thành một bước rộng, cũng là một màu của câu.
      */
      /*
        LUÂN PHIÊN bước hẹp và bước rộng, không rút thăm từng bước.

        Rút thăm độc lập thì một câu sáu nốt rất dễ lệch hẳn về một phía do may
        rủi: để 0,38 ra 57-68% câu gam thuần, nâng lên 0,5 thì gam xuống còn
        39-46% nhưng rải vọt lên 19-30% — đổi thái cực này lấy thái cực kia,
        phần PHA TRỘN vẫn chỉ 23-43%. Người thật 68-82% pha trộn, nghĩa là câu
        nào của họ cũng có cả hai cỡ bước, đều đặn.

        Luân phiên thì mọi cửa sổ bốn nốt đều có cả hai. Thêm chút nhiễu để nó
        không thành một cái máy dệt.
      */
      const turn = (step + index) % 2 === 0
      const wide = hash(take * 7 + index * 13 + step * 3) < JITTER ? !turn : turn
      at = Math.max(0, Math.min(ladder.length - 1, at + dir * (wide ? 2 : 1)))
      out.push({
        note: ladder[at]!,
        startBeat: post.beat + step * slot,
        durationBeats: 0,
        anchor: false,
      })
      since += 1
    }
  })

  /* Trường độ: ngân tới nốt kế, nốt cuối ngân tới hết đoạn. */
  const sorted = balanceSteps(out.sort((a, b) => a.startBeat - b.startBeat), ladder)
  return sorted.map((note, index) => {
    const next = sorted[index + 1]?.startBeat ?? total
    return { ...note, durationBeats: Math.max(0.05, (next - note.startBeat) * 0.92) }
  })
}

/** Số nốt liền nhau nhiều nhất trước khi câu cần một chỗ nghỉ. */
export const LONGEST_BREATH = BREATH_AFTER

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
