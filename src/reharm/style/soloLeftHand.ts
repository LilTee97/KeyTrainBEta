import { LEFT_HAND_LOW } from '../voicingGenerator/handSplitVoicing'
import type { MidiNote } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'

/**
 * Tay trái **gánh trọn mẫu đệm** ở đoạn không lời.
 *
 * Ở đoạn có lời, tay trái chỉ đặt nền còn tay phải quạt hợp âm — hai tay chia
 * nhau mẫu đệm. Đoạn không lời thì tay phải bỏ hẳn phần quạt để lên chạy giai
 * điệu, nên nếu tay trái vẫn chơi đúng phần cũ thì mẫu đệm mất một nửa và cả
 * đoạn nghe rỗng. Người dùng nghe ra trước khi đo: "tay trái chơi bass khá ít
 * nên tạo ra cảm giác solo khá đơn điệu."
 *
 * Đo trên bảy bản ký âm của Cà Pháo (`tools/sheet/profile.py` bên PianoBrain),
 * tay trái ở đoạn giang tấu:
 *
 * | | mốc gõ mỗi ô | tầm đi | nốt mỗi lần gõ |
 * |---|---|---|---|
 * | Cà Pháo | 4,9 - 6,0 | **23 - 40 nửa cung** | 1,04 - 1,20 |
 * | KeyTrain, bolero | 2,0 | **7** | 1,00 |
 * | KeyTrain, bossa | 4,0 | 12 | 1,00 |
 * | KeyTrain, slow rock | 3,0 | 16 | 1,00 |
 *
 * Hai chỗ lệch, và chúng khác nhau:
 *
 * - **Số cú gõ**: bolero chỉ hai lần một ô nhịp. Đó là phần bass của một mẫu
 *   đệm hai tay, không phải cả mẫu đệm.
 * - **Tầm đi**: tay trái người thật chạy hai tới ba quãng tám. Tay trái của app
 *   quanh quẩn một quãng năm tới một quãng tám — nó ĐẶT nốt chứ không ĐI.
 *
 * ## Cách dựng
 *
 * Chỗ gõ lấy từ **hợp cả hai tay của chính ô nhịp điệu ấy**. Đây là điểm phải
 * giữ: người dùng đã ra luật đoạn không lời phải chơi đúng điệu đang chọn, và
 * luật ấy vẫn nguyên — tay trái nhận thêm phần tay phải bỏ lại, chứ không mượn
 * tiết tấu của điệu khác. Slow rock sáu phách thì tay trái gõ đủ sáu; bolero
 * thì gõ đủ hình Pùng-Pắp; bossa thì giữ chỗ đảo phách của chính nó.
 *
 * Cao độ đi theo **hình rải lên rồi về**, trải trên tầm đã cho. Đi lên rồi về
 * chứ không đi lên mãi, vì nốt cuối ô phải đứng cạnh nốt gốc ô sau — không thì
 * mỗi vạch nhịp là một cú nhảy. Tài liệu `Reference/pianoimprovnotes.md` ghi
 * đúng hai điều này: rải hợp âm dùng được cho cả tay trái, và phải "thay đổi
 * quãng âm — lúc cao lúc thấp — để tạo kịch tính".
 */

/**
 * Trần tay trái khi nó gánh mẫu đệm.
 *
 * Luật cũ của app: tay trái không chạm Đô quãng tám 4. Người dùng bỏ luật ấy,
 * và số đo đứng về phía họ — trên bản ký âm của Cà Pháo, hai tay CHỒNG TẦM ở
 * đoạn giang tấu: trần tay trái cao hơn sàn tay phải 3 tới 12 nửa cung ở bốn
 * trên sáu bài.
 *
 * | | trần tay trái | sàn tay phải |
 * |---|---|---|
 * | Hồng Kông 1 | 64 | 60 |
 * | Người hãy quên | 62 | 57 |
 * | Bèo dạt mây trôi | 63 | 60 |
 * | Kém duyên | 70 | 58 |
 *
 * Ràng buộc thật của người chơi là **hai tay không cùng bấm một phím một lúc**,
 * không phải hai tầm rời hẳn nhau. Bàn tay người chia nhau khoảng giữa đàn.
 *
 * 64 là trung vị hơi lệch lên của số đo trên. Cho tầm đi 28 nửa cung, nằm giữa
 * khoảng 23-40 của người thật, thay vì 23 khi còn bị Đô quãng tám 4 chặn.
 */
const SOLO_LEFT_TOP = 64

export interface SoloLeftHandOptions {
  chords: readonly ParsedChord[]
  /** Số phách mỗi hợp âm chiếm, theo đúng thứ tự hợp âm. */
  beatsEach: readonly number[]
  style: StylePattern
  /** Trần tay trái. Bỏ trống là hai quãng tám kể từ sàn. */
  top?: number
}

export interface Strike {
  /** Chỗ gõ trong một ô nhịp, quy về nốt đen. */
  beat: number
  durationBeats: number
  /** Hệ số cường độ của chính ô nhịp điệu ấy. */
  velocityScale: number
  /** Nốt chèn thêm để lấp phách trống, không phải cú gõ của điệu. */
  filler: boolean
}

/** Chỗ gõ nào gần nhau hơn ngần này thì coi là một — đừng gõ chồng. */
const SAME_HIT = 0.2

/**
 * Một bàn tay trái gõ nhiều nhất bấy nhiêu lần mỗi ô nhịp.
 *
 * Đo trên bản ký âm của Cà Pháo, đoạn giang tấu: **3,4 tới 5,8** cú gõ mỗi ô.
 * Gộp cả hai tay của ô nhịp bossa ra tám — gấp rưỡi người thật, và tám cú gõ
 * kín hết tám móc đơn thì giai điệu không còn khe nào để lách: đo ra 79% nốt
 * tay phải đè đúng tiếng bass, trong khi người thật chỉ 32-73%.
 *
 * Sáu là trần: vừa đủ cho nhịp kép sáu phách, vừa sát mép trên của số đo.
 */
const MAX_STRIKES = 6

/**
 * Cú gõ của mẫu đệm trong một ô nhịp, **gộp cả hai tay, giữ nguyên tính cách**.
 *
 * Giữ nguyên nghĩa là giữ cả ba thứ: chỗ rơi, trường độ, và độ nhấn. Bản trước
 * chỉ lấy danh sách chỗ rơi rồi làm phẳng hai thứ kia — và với nhịp kép còn
 * thay hẳn bằng một lưới đều tăm tắp. Trên mẫu Slow Rock 3 của thầy Đức Thịnh
 * thì đó là xoá mất đúng cái làm nên mẫu ấy:
 *
 *   ô nhịp thật    0 (ngân 1,0)  ·  1 (0,45)  ·  1,45 (1,55)  ·  2,5 (0,5)
 *   bản trước      0 · 0,5 · 1 · 1,5 · 2 · 2,5   — mất 1,45, trường độ phẳng
 *
 * Phách 4 vào SỚM ở 1,45 chính là chỗ giật cục của mẫu; đẩy nó về 1,5 là biến
 * mẫu ấy thành một cái máy đếm nhịp. Người dùng nghe ra ngay: "tay trái vẫn
 * chưa đánh được giống tiết tấu của điệu như khi đánh hai tay."
 *
 * NỐT CHÈN. Nhịp kép cần nghe đủ sáu phách ở đoạn không lời — hai phách mẫu
 * đệm bỏ trống vốn là chỗ nghỉ dành cho giọng hát, mà ở đây không có ai hát.
 * Nhưng chèn là **thêm vào chỗ còn trống**, không phải thay cả hàng: chỗ nào
 * đã có cú gõ thật thì để yên, kể cả khi nó lệch lưới như 1,45. Nốt chèn đánh
 * nhẹ hẳn để cú gõ của điệu vẫn nổi lên trên.
 */
export function patternStrikes(style: StylePattern, hands: 'both' | 'left' = 'both'): Strike[] {
  if (!style.cell) return []
  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid

  const out: Strike[] = []
  const source = hands === 'left' ? style.cell.left : [...style.cell.left, ...style.cell.right]
  for (const hit of source) {
    const beat = Number(((((hit.beat * grid) % bar) + bar) % bar).toFixed(3))
    const already = out.find((other) => Math.abs(other.beat - beat) < SAME_HIT)
    const strike: Strike = {
      beat,
      durationBeats: Math.max(0.05, hit.durationBeats * grid),
      velocityScale: hit.velocityScale ?? 1,
      filler: false,
    }
    // Hai tay cùng gõ một chỗ thì giữ cú nặng hơn — tay trái chỉ chơi một nốt.
    if (!already) out.push(strike)
    else if (strike.velocityScale > already.velocityScale) {
      Object.assign(already, strike)
    }
  }

  if (style.timeSignature.endsWith('/8')) {
    for (let at = 0; at < style.beatsPerMeasure; at += 1) {
      const beat = Number((at * grid).toFixed(3))
      if (out.some((strike) => Math.abs(strike.beat - beat) < SAME_HIT)) continue
      out.push({ beat, durationBeats: grid, velocityScale: 0.45, filler: true })
    }
  }

  /*
    Quá dày thì bỏ bớt cú NHẸ nhất — giữ hình tiết tấu, bỏ chỗ đệm thêm. Hoà
    mức nhấn thì cú muộn hơn bị bỏ trước, vì chỗ sớm trong ô nhịp là chỗ tai
    bám vào.
  */
  const tran = style.soloMaxStrikes ?? MAX_STRIKES
  const kept =
    out.length <= tran
      ? out
      : [...out]
          .sort((a, b) => b.velocityScale - a.velocityScale || a.beat - b.beat)
          .slice(0, tran)

  return kept.sort((a, b) => a.beat - b.beat)
}

/** Chỗ gõ, chỉ lấy vị trí — để lưới test so mạch. */
export function patternOnsets(style: StylePattern, hands: 'both' | 'left' = 'both'): number[] {
  return patternStrikes(style, hands).map((strike) => strike.beat)
}

/**
 * Chỗ gõ **MẠNH** của điệu — nơi giai điệu tay phải neo vào.
 *
 * Tay phải không neo vào mọi cú gõ, chỉ neo vào những cú nặng. Đo trên bản ký
 * âm của Cà Pháo, đoạn giang tấu: chỉ **32-73%** số nốt tay phải rơi trúng một
 * cú gõ tay trái, quá nửa còn lại rơi vào khe giữa hai cú.
 *
 * Đó là chỗ khác nhau giữa hai tay CÀI VÀO NHAU và hai tay GÕ CHỒNG. Tay trái
 * giữ mạch, tay phải hát qua các khe — nghe thoáng dù nhiều nốt hơn. Đo trên
 * app trước khi sửa: 51-99% nốt tay phải đè đúng tiếng bass, bossa tới 99%,
 * tức mỗi nốt giai điệu nhân đôi một cú gõ. Người dùng nghe ra là "dồn nốt rối
 * tai" và tưởng do quá nhiều nốt — thật ra tay phải của app còn thưa hơn người
 * thật một nửa; cái sai nằm ở CHỖ RƠI, không ở số lượng.
 *
 * Lấy những cú từ trung vị độ nhấn trở lên, và không lấy nốt chèn — nốt chèn
 * sinh ra để lấp phách trống, nó không phải chỗ tai chờ đợi.
 */
export function accentBeats(style: StylePattern): number[] {
  const strikes = patternStrikes(style).filter((strike) => !strike.filler)
  if (strikes.length === 0) return []

  /*
    Lấy NỬA MẠNH NHẤT, không lấy "từ trung vị trở lên".

    Nhiều điệu lặp lại đúng một mức nhấn cho phần lớn cú gõ — bolero là 1 · 0,7 ·
    0,7 · 0,9 · 0,7 · 0,7, nên trung vị rơi vào 0,7 và "từ trung vị trở lên" giữ
    lại cả sáu, tức không cắt được gì. Lấy nửa trên thì luôn cắt đúng một nửa.

    Hoà mức nhấn thì cú đứng trước thắng: chỗ sớm hơn trong ô nhịp bao giờ cũng
    là chỗ tai bám vào trước.
  */
  const strong = [...strikes]
    .sort((a, b) => b.velocityScale - a.velocityScale || a.beat - b.beat)
    .slice(0, Math.max(2, Math.ceil(strikes.length / 2)))

  return strong.map((strike) => strike.beat).sort((a, b) => a - b)
}

/**
 * Thang nốt của hợp âm trong tầm tay trái, xếp tăng dần.
 *
 * Chỉ nốt của chính hợp âm — tay trái đang giữ hoà âm, không phải chỗ để chèn
 * nốt ngoài. Nốt màu là việc của tay phải.
 */
function ladder(chord: ParsedChord, low: number, high: number): MidiNote[] {
  const tones = new Set(chordPitchClasses(chord.root, chord.quality))
  tones.add((((chord.bass ?? chord.root) % 12) + 12) % 12)

  const out: MidiNote[] = []
  for (let note = low; note <= high; note += 1) {
    if (tones.has((((note % 12) + 12) % 12) as never)) out.push(note as MidiNote)
  }
  return out
}

/**
 * Hình đi lên rồi về, đúng `count` bước, trải hết thang.
 *
 * Trải hết chứ không đi từng bậc liền: thang một hợp âm trong hai quãng tám có
 * chừng bảy tám bậc, mà một ô nhịp chỉ có bốn tới tám cú gõ — đi từng bậc thì
 * chỉ bò được nửa dưới và tầm đi teo lại đúng chỗ đang muốn mở ra.
 *
 * Đi lên rồi VỀ chứ không lên mãi: nốt cuối ô phải đứng cạnh nốt gốc ô sau, nếu
 * không thì mỗi vạch nhịp là một cú nhảy.
 */
function upAndBack(steps: number, count: number): number[] {
  if (count <= 1) return [0]
  const out: number[] = []
  // Đỉnh rơi vào khoảng hai phần ba câu: lên thong thả, về nhanh hơn.
  const peak = Math.max(1, Math.round((count - 1) * 0.66))
  for (let at = 0; at < count; at += 1) {
    const ratio =
      at <= peak ? at / peak : (count - 1 - at) / Math.max(1, count - 1 - peak)
    out.push(Math.round(ratio * (steps - 1)))
  }
  return out
}

export function soloLeftHand(options: SoloLeftHandOptions): TimelineEvent[] {
  const { chords, beatsEach, style } = options
  /*
    CHỈ phần tay trái của mẫu đệm, không gộp cả phần tay phải.

    Có một lượt trước đây gộp cả hai tay, vì tay trái chơi riêng phần mình thì
    thưa quá — bolero hai cú gõ mỗi ô. Người dùng nghe rồi bác: để tay trái đảm
    nhiệm toàn bộ pattern điệu đệm trong lúc solo là không đúng.

    Chỗ thưa ra được lấp bằng luật 2 của `interlockHands` — tay trái chèn nốt
    rải vào đúng những khe tay phải đang ngân dài hoặc đang nghỉ. Lấp theo tay
    phải thì hai bè nhường nhau; lấp bằng cách gõ luôn phần tay phải của mẫu
    đệm thì hai bè cùng nói một lúc.

    Nốt chèn cho nhịp kép vẫn còn: slow rock ở đoạn không lời phải nghe đủ sáu
    phách bên tay trái, đó là yêu cầu riêng và nó không đổi.
  */
  const strikes = patternStrikes(style, 'left')
  if (strikes.length === 0 || chords.length === 0) return []

  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid
  const top = options.top ?? SOLO_LEFT_TOP
  const events: TimelineEvent[] = []
  let cursor = 0

  chords.forEach((chord, index) => {
    const beats = beatsEach[index] ?? bar
    const steps = ladder(chord, LEFT_HAND_LOW, top)
    if (steps.length === 0) {
      cursor += beats
      return
    }

    /*
      Ô nhịp ngắn hơn một ô của điệu thì chỉ lấy những cú gõ còn nằm trong nó —
      hợp âm chia đôi vẫn phải nghe ra là nửa ô, không phải một ô bị bóp.
    */
    const hits: Strike[] = []
    for (let at = 0; at < beats - 1e-6; at += bar) {
      for (const strike of strikes) {
        if (at + strike.beat < beats - 1e-6) {
          hits.push({ ...strike, beat: at + strike.beat })
        }
      }
    }
    if (hits.length === 0) hits.push({ ...strikes[0]!, beat: 0 })

    const shape = upAndBack(steps.length, hits.length)
    hits.forEach((strike, at) => {
      /*
        Trường độ giữ theo ô nhịp của điệu, nhưng không thò qua cú gõ kế —
        tay trái chỉ có một ngón cho một nốt.
      */
      const next = hits[at + 1]?.beat ?? beats
      events.push({
        notes: [steps[Math.min(steps.length - 1, shape[at]!)]!],
        startBeat: cursor + strike.beat,
        durationBeats: Math.max(
          0.05,
          Math.min(strike.durationBeats, next - strike.beat) * 0.95,
        ),
        hand: 'left',
        // Độ nhấn của chính ô nhịp điệu ấy, không phải một con số phẳng.
        velocity: Math.max(28, Math.min(110, Math.round(88 * strike.velocityScale))),
      })
    })

    cursor += beats
  })

  return events
}

/** Từ ngần này nốt mỗi phách trở lên là tay phải đang chạy dày (móc kép). */
const DENSE_RIGHT = 4
/** Nốt tay phải ngân từ ngần này trở lên là chỗ tay trái được lấp vào. */
const LONG_RIGHT = 2
/** Nốt tay phải rơi trong ngần này quanh vạch nhịp thì kéo về đúng vạch. */
const DOWNBEAT_PULL = 0.25

/**
 * Hai tay **cài vào nhau theo mật độ**, thay vì tay trái gánh trọn mẫu đệm.
 *
 * Bản trước cho tay trái chơi đủ mọi cú gõ của mẫu đệm suốt đoạn solo. Người
 * dùng bác: để tay trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo là
 * không đúng. Đúng là vậy — đoạn solo không phải đoạn đệm bị úp thêm một giai
 * điệu lên trên; hai tay phải nhường nhau chứ không cùng nói một lúc.
 *
 * Ba luật, quyết theo từng khe giữa hai cú gõ tay trái:
 *
 * 1. **Tay phải chạy dày** (từ 4 nốt mỗi phách, tức móc kép) -> tay trái BỎ cú
 *    gõ ấy và để nốt trước ngân dài. Hai bè cùng dày thì đục dải tần.
 * 2. **Tay phải ngân dài hoặc nghỉ** -> tay trái CHÈN thêm nốt rải lấp chỗ
 *    trống, lấy luôn cao độ của cú gõ kế tiếp nên vẫn là nốt của hợp âm.
 * 3. **Vạch nhịp** -> cú gõ tay trái không bao giờ bị bỏ, và nốt giai điệu rơi
 *    sát vạch được kéo về đúng vạch để hai tay gõ cùng lúc. Đây là chỗ neo
 *    nhịp; mọi thứ khác nhường nhau được, chỗ này thì không.
 *
 * Luật "đoạn không lời chơi đúng điệu đã chọn" vẫn nguyên: chỗ gõ, trường độ và
 * độ nhấn vẫn của chính điệu ấy. Cái đổi là BAO NHIÊU phần trong đó thực sự
 * kêu lên, tuỳ tay phải đang bận tới đâu.
 */
export function interlockHands(
  left: readonly TimelineEvent[],
  melody: readonly TimelineEvent[],
  barBeats: number,
  khongTia = false,
): { left: TimelineEvent[]; melody: TimelineEvent[] } {
  /*
    Không có tay phải thì không có gì để nhường. "Tay phải nghỉ" ở luật 2 nghĩa
    là nghỉ GIỮA một câu đang chạy, không phải cả đoạn không có ai chơi — đoạn
    dạo đầu tắt câu solo thì mẫu đệm phải kêu nguyên vẹn.
  */
  if (left.length === 0 || melody.length === 0) {
    return { left: [...left], melody: [...melody] }
  }

  const hits = [...left].sort((a, b) => a.startBeat - b.startBeat)
  const onDownbeat = (beat: number) => {
    const rel = ((beat % barBeats) + barBeats) % barBeats
    return Math.min(rel, barBeats - rel) < 0.05
  }

  /* Luật 3 — kéo nốt giai điệu sát vạch về đúng vạch. */
  const pulled = melody.map((note) => {
    if (onDownbeat(note.startBeat)) return note
    const bar = Math.round(note.startBeat / barBeats) * barBeats
    if (Math.abs(note.startBeat - bar) > DOWNBEAT_PULL) return note
    if (melody.some((other) => onDownbeat(other.startBeat) && Math.abs(other.startBeat - bar) < 0.05)) {
      return note
    }
    return { ...note, startBeat: bar }
  })

  const kept: { event: TimelineEvent; held: boolean; fill: boolean }[] = []
  hits.forEach((event, index) => {
    const next = hits[index + 1]?.startBeat ?? event.startBeat + barBeats
    const room = Math.max(0.25, next - event.startBeat)
    const inside = pulled.filter(
      (note) => note.startBeat >= event.startBeat - 1e-6 && note.startBeat < next - 1e-6,
    )

    if (onDownbeat(event.startBeat)) {
      kept.push({ event, held: false, fill: false })
      return
    }
    /*
      `khongTia` TẮT luật 1, và nó đến từ số đo chứ không từ cảm tính.

      Đo đoạn giang tấu bản ký âm Linh Nhi: tay phải vọt từ 6,8 lên 9,3 nốt mỗi
      ô — dày nhất bài — còn tay trái GIỮ NGUYÊN 8,0, tầm y hệt 33-62. Người
      soạn không rút tay trái lại chút nào.

      RANH GIỚI PHẢI SẮC. Người dùng từng bác lối "tay trái đảm nhiệm toàn bộ
      pattern điệu đệm trong lúc solo" — cái bị bác là tay trái gánh CẢ PHẦN TAY
      PHẢI của mẫu đệm. Cờ này chỉ nói: đừng tỉa phần của CHÍNH tay trái. Hai
      việc khác nhau, và `soloLeftHand` vẫn chỉ lấy `cell.left` như cũ.
    */
    if (!khongTia && inside.length / room >= DENSE_RIGHT) return // luật 1
    const airy =
      inside.length === 0 || inside.some((note) => note.durationBeats >= LONG_RIGHT)
    kept.push({ event, held: false, fill: airy }) // luật 2
  })

  const out: TimelineEvent[] = []
  kept.forEach((slot, index) => {
    const next = kept[index + 1]
    const until = next?.event.startBeat ?? slot.event.startBeat + slot.event.durationBeats
    const room = until - slot.event.startBeat
    /*
      Cú gõ bị bỏ vì tay phải dày thì nốt trước phải NGÂN bù vào, không thì chỗ
      ấy hoá ra im lặng. Luật của người dùng là "giữ một nốt bass", không phải
      "bỏ tay trái".
    */
    const dropped = next !== undefined && room > slot.event.durationBeats + 1e-6
    out.push({
      ...slot.event,
      durationBeats: Math.max(
        0.05,
        dropped ? room * 0.98 : Math.min(slot.event.durationBeats, room),
      ),
    })

    if (!slot.fill || next === undefined || room < 1) return
    /*
      RẢI vào chỗ trống, không chỉ một nốt.

      Luật của người dùng ghi là "trigger arpeggio fill-in". Khe rộng bao nhiêu
      thì chèn bấy nhiêu nốt, nhiều nhất ba — quá ba thì chính tay trái lại thành
      bè dày, đúng thứ luật 1 đang tránh.

      Cao độ lấy luân phiên hai cú gõ ở hai đầu khe: cả hai đã là nốt của hợp âm
      và đã nằm trong hình rải, nên chèn vào giữa là kéo dài chính hình ấy chứ
      không đẻ ra một tầng mới. Đánh nhẹ hơn để cú gõ thật vẫn nổi lên trên.
    */
    const count = Math.min(3, Math.floor(room))
    for (let step = 1; step <= count; step += 1) {
      const from = step % 2 === 1 ? next.event : slot.event
      out.push({
        ...from,
        startBeat: slot.event.startBeat + (room * step) / (count + 1),
        durationBeats: Math.max(0.05, (room / (count + 1)) * 0.9),
        velocity: Math.max(24, Math.round(from.velocity * 0.7)),
      })
    }
  })

  return { left: out.sort((a, b) => a.startBeat - b.startBeat), melody: pulled }
}

/**
 * Tay trái **nhường một quãng tám** khi trùng phím với giai điệu.
 *
 * Bỏ luật "tay trái không chạm Đô quãng tám 4" thì hai tầm chồng nhau, và chồng
 * tầm là chuyện bình thường — người chơi thật vẫn vậy. Thứ KHÔNG bình thường là
 * hai tay cùng bấm một phím vào cùng một lúc: trên đàn thật thì một ngón chặn
 * ngón kia, trong MIDI thì tiếng trước bị cắt ngang hoặc kẹt luôn.
 *
 * Giai điệu thắng, vì nó là thứ người nghe đang theo. Tay trái là nốt rải nên
 * hạ một quãng tám vẫn đúng cao độ của hợp âm, chỉ đổi tầng — không mất gì.
 *
 * CHƯA PHỦ ĐOẠN GIANG TẤU. Đoạn dạo đầu và kết bài ráp cả hai bè trong
 * `buildPhraseSection` nên gọi được hàm này; giang tấu thì phần đệm và câu solo
 * đi hai đường rồi mới gặp nhau trong `buildArrangedSong`, chỗ ấy chưa có móc
 * để chen vào. Đo ra 1 va chạm trên 32 lượt — thấp, nhưng không phải không.
 */
export function avoidMelodyClash(
  left: readonly TimelineEvent[],
  melody: readonly TimelineEvent[],
  low = LEFT_HAND_LOW,
): TimelineEvent[] {
  if (melody.length === 0) return [...left]

  return left.map((event) => {
    const busy = new Set(
      melody
        .filter((line) => Math.abs(line.startBeat - event.startBeat) < 0.02)
        .flatMap((line) => line.notes),
    )
    if (busy.size === 0 || !event.notes.some((note) => busy.has(note))) return event

    const moved = event.notes.map((note) => {
      const down = note - 12
      return (down >= low && !busy.has(down as MidiNote) ? down : note) as MidiNote
    })
    return { ...event, notes: moved }
  })
}
