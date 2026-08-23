import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import { stepInScale } from './graceNoteOrnamenter'
import { chordPentatonic, keepInKey, type SongKey } from './soloVocabulary'

/**
 * Câu báo hiệu vào hát — chạy ngón lên ngay trước khi đoạn mới bắt đầu.
 *
 * Đây là thứ bản đầu thiếu hẳn: giang tấu hết vòng rồi im, đoạn hát vào không
 * có gì dẫn nên nghe như nhảy cóc. Người đệm thật luôn đánh một câu lấy đà ở
 * phách cuối để người hát biết đường vào.
 *
 * Cách dựng lấy đúng ba nguyên tắc câu fill đã ghi trong `soloGenerator.ts`,
 * vốn rút ra từ tài liệu:
 *
 * 1. Nằm ở **cuối** khoảng thời gian, không trải đều.
 * 2. **Kết thúc ngay cạnh** nốt đích, cách một bậc — tai bị kéo sang chỗ mới.
 * 3. Đi **liền bậc theo âm giai của bài**, không nhảy quãng.
 *
 * Câu này cố ý **không chạm vào nốt đích**: nốt đích để dành cho phách mạnh
 * đầu đoạn mới, do phần đệm của đoạn đó đánh. Chạm trước là mất chỗ nhấn.
 *
 * Hướng đi lên vì đi lên nghe như một câu hỏi mở, kéo tai về phía trước; đi
 * xuống nghe như kết thúc, đúng ngược cái đang cần.
 */
export function leadInNotes(options: {
  /** Nốt gốc của hợp âm đầu tiên ở đoạn sắp vào. */
  target: PitchClass
  /** Các nốt thuộc âm giai của bài; rỗng thì đi từng nửa cung. */
  tones: ReadonlySet<PitchClass>
  /** Phách bắt đầu của câu, tính trong dòng thời gian của cụm quay đầu. */
  startBeat: number
  /** Câu dài bao nhiêu phách. */
  beats: number
  /** Bao nhiêu nốt; ít quá không nghe ra hướng, nhiều quá thành câu solo. */
  count?: number
  /**
   * Nốt Đô làm tâm quãng âm; câu sẽ nằm quanh đó.
   *
   * Phải là một nốt Đô vì cách chọn quãng tám bên dưới cộng thẳng nốt gốc vào.
   * Mặc định là Đô quãng tám thứ năm. Chỗ nào phần đệm còn chạy bên dưới thì
   * đẩy tâm lên một quãng tám, không thì câu chạy nằm chồng lên hợp âm đệm và
   * bị lấp mất.
   */
  anchor?: MidiNote
}): { note: MidiNote; startBeat: number; durationBeats: number }[] {
  const { target, tones, startBeat, beats, count = 4, anchor = 72 } = options
  if (beats <= 0 || count < 1) return []

  /*
    Neo quanh nốt Đô được chỉ định — vùng người ta chạy câu dẫn, nghe rõ mà
    không lấn xuống chỗ tay trái.

    Phải **chọn quãng tám gần tâm nhất** chứ không cộng thẳng nốt gốc vào: cộng
    thẳng thì đích Đô cho câu ở C5 còn đích Si cho câu ở B5, chênh nhau gần cả
    quãng tám, nên cùng một bài mà mỗi lần vào hát câu báo hiệu lại nằm một
    tầm khác. Nốt gốc quá nửa quãng tám thì hạ xuống tầng dưới cho gần tâm.
  */
  const pitchClass = ((target % 12) + 12) % 12
  const landing =
    pitchClass <= 6 ? anchor + pitchClass : anchor - 12 + pitchClass

  // Dựng ngược từ nốt kết rồi lật lại, vì chỗ neo là điểm kết chứ không phải điểm đầu.
  const line: MidiNote[] = [stepInScale(landing, 'down', tones)]
  while (line.length < count) {
    line.unshift(stepInScale(line[0], 'down', tones))
  }

  const each = beats / line.length

  return line.map((note, index) => ({
    note,
    startBeat: startBeat + index * each,
    // Hở một chút giữa các nốt để nghe ra từng bước chân, không thành vệt liền.
    durationBeats: each * 0.85,
  }))
}

/** Chỗ chia tay trái với tay phải: dưới Đô quãng tám thứ tư là tay trái. */
const HAND_SPLIT = 60

/** Đô quãng tám thứ năm — đỉnh của mọi câu chạy nối đoạn. */
const TOP_OCTAVE = 72

export interface RunNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  hand: 'left' | 'right'
}

/**
 * Câu chạy ngón bằng **hợp âm rải**, dùng cho ô nhịp nối sang đoạn mới.
 *
 * Ô nối không quạt hợp âm như những ô khác — nó dành trọn cho một câu chạy.
 *
 * ## Công thức
 *
 * Chạy **từ nốt gốc của hợp âm lên đúng nốt ấy ở quãng tám trên**, hai hoặc ba
 * quãng tám. Hợp âm `G7` chạy hai quãng tám thì đi `G3 B3 D4 F4 G4 B4 D5 F5
 * G5` — mở ở nốt Sol, đóng cũng ở nốt Sol.
 *
 * Mở và đóng cùng một nốt là điều làm câu chạy nghe **trọn vẹn**: tai nhận ra
 * ngay nó đã đi hết một vòng. Bản trước cho câu chạy kết ở nốt gốc của *đoạn
 * sắp tới* — nghe như câu chưa nói xong đã bị cắt, vì nó bỏ dở hợp âm đang
 * vang để với sang một hợp âm chưa tới.
 *
 * Chất liệu chỉ lấy **bốn nốt lõi** — gốc, ba, năm, bảy. Nốt màu (chín, mười
 * một, mười ba) nằm ở quãng từ 12 nửa cung trở lên trong bảng hợp âm; gộp
 * chúng vào thì mỗi quãng tám có sáu nốt và câu chạy nghe ra thành thang âm
 * chứ không còn là hợp âm rải.
 *
 * Đỉnh câu chạy luôn nằm ở **quãng tám thứ năm**, bất kể hợp âm gì — nhờ vậy
 * mọi chỗ chuyển đoạn trong bài đều lên tới cùng một tầm, không chỗ chói chỗ
 * lụt. Số quãng tám chỉ kéo dài **chân** câu chạy xuống thấp thêm.
 *
 * Chạy đủ dài thì nó vắt qua cả hai tay, đúng như người ta chơi thật: tay trái
 * ôm nửa dưới, tay phải bắt nửa trên.
 */
export function arpeggioRun(options: {
  /** Hợp âm đang vang; nốt lõi của nó là chất liệu của câu chạy. */
  chord: ParsedChord
  /** Chạy mấy quãng tám. */
  octaves: number
  /** Nốt cuối rơi vào phách nào. */
  endBeat: number
  /** Các giá trị nốt được phép dùng, ưu tiên chậm trước. */
  noteChoices?: readonly number[]
  /** Câu chạy được phép dài tối đa bao nhiêu phách. */
  maxBeats: number
  /** Bắt đầu từ phách này thay vì dồn vào cuối ô. */
  fromBeat?: number
  /**
   * Dồn cả câu về tay phải.
   *
   * Chạy nối hai đoạn hát thì **vắt qua cả hai tay** — đó là cách người ta chơi
   * thật. Nhưng câu kết dạo đầu và câu kết giang tấu thì tay trái đã nghỉ hẳn
   * để nhường chỗ, nên để nó thò xuống nửa trái bàn phím là hai tay tranh nhau
   * một câu.
   */
  rightHandOnly?: boolean
  key?: SongKey | null
}): RunNote[] {
  const {
    chord,
    octaves,
    endBeat,
    noteChoices = [0.25, 0.125],
    maxBeats,
    fromBeat,
    key = null,
  } = options

  if (octaves < 1 || maxBeats <= 0) return []

  /*
    Chỉ lấy bốn nốt lõi: gốc, ba, năm, bảy. Nốt màu nằm từ quãng 12 nửa cung
    trở lên, gộp vào thì câu chạy thành thang âm chứ không còn là hợp âm rải.
  */
  const classes = new Set(
    chord.quality.intervals
      .filter((step) => step < 12)
      .map((step) => normalizePitchClass(chord.root + step)),
  )
  if (classes.size < 4) {
    for (const tone of chordPentatonic(chord)) {
      classes.add(tone)
      if (classes.size >= 4) break
    }
  }
  if (key) {
    const allowed = new Set(keepInKey([...classes], key))
    if (allowed.size >= 2) {
      for (const tone of [...classes]) {
        if (!allowed.has(tone)) classes.delete(tone)
      }
    }
  }

  const top = TOP_OCTAVE + normalizePitchClass(chord.root)
  const bottom = top - 12 * octaves

  const line: MidiNote[] = []
  for (let note = bottom; note <= top; note += 1) {
    if (classes.has(normalizePitchClass(note))) line.push(note)
  }

  if (line.length < 2) return []

  const gaps = line.length - 1
  const room =
    fromBeat !== undefined
      ? Math.max(0.125, endBeat - fromBeat)
      : maxBeats
  const noteBeats =
    noteChoices.find((choice) => choice * gaps <= room) ??
    noteChoices[noteChoices.length - 1]

  const packed = endBeat - gaps * noteBeats
  const start = fromBeat !== undefined ? fromBeat : packed
  const step = noteBeats

  return line.map((note, index) => ({
    note,
    startBeat: start + index * step,
    durationBeats: step * 0.9,
    hand:
      options.rightHandOnly || note >= HAND_SPLIT
        ? ('right' as const)
        : ('left' as const),
  }))
}

/** Chạy ngón một–hai quãng 8: đi liền bậc từ gốc lên, không rải. */
export function octaveRun(options: {
  chord: ParsedChord
  startBeat: number
  beats: number
  scale?: ReadonlySet<PitchClass>
  /** Tầm tay phải được phép chạy. Bỏ trống thì lấy Đô quãng 4 tới Đô quãng 6. */
  range?: { low: MidiNote; high: MidiNote }
}): RunNote[] {
  const { chord, startBeat, beats, scale, range } = options
  if (beats <= 0) return []

  const cores = new Set(
    chord.quality.intervals
      .filter((step) => step < 12)
      .map((step) => normalizePitchClass(chord.root + step)),
  )
  const pool =
    scale && scale.size > 0 ? scale : cores
  if (pool.size === 0) return []

  /*
    Câu chạy kết đoạn là **của tay phải**, và nó leo lên phía phải bàn phím.

    Bản trước dựng từ `48 + nốt gốc` — tức quanh Đô quãng 3 — rồi chia tay theo
    cao độ, nên nửa đầu câu rơi xuống tay trái. Nghe ra là hai tay tranh nhau
    một câu, mà tay trái lúc ấy đã nghỉ hẳn để nhường chỗ. Trên piano roll thì
    thấy rõ: một chuỗi nốt xanh (tay trái) nối vào một chuỗi nốt hồng.

    Người đệm thật kết đoạn bằng cách đẩy câu **lên**, về phía phải đàn, để nó
    hở ra rồi ca sĩ vào. Nên dựng từ đáy tầm tay phải và leo hết hai quãng tám
    còn lại, không đụng tới nửa trái bàn phím.
  */
  const bottom = range?.low ?? (60 as MidiNote)
  const ceiling = range?.high ?? (84 as MidiNote)

  /*
    Dùng TRỌN khung, không bắt câu khởi từ nốt gốc.

    Khởi từ nốt gốc nghe gọn hơn, nhưng nốt gốc gần nhất trong khung có khi nằm
    cao gần trần — trên hợp âm Đô với trần Sol quãng 5 thì câu chỉ còn quãng
    năm để leo, mà việc của nó là leo hẳn một quãng tám về phía phải. Bắt đầu từ
    đáy khung thì lúc nào cũng đủ đường.
  */
  const low = bottom
  const high = Math.min(low + 24, ceiling) as MidiNote

  const line: MidiNote[] = []
  for (let note = low; note <= high; note += 1) {
    if (pool.has(normalizePitchClass(note))) line.push(note)
  }
  if (line.length < 2) return []

  const step = line.length * 0.25 <= beats ? 0.25 : 0.125
  const count = Math.min(line.length, Math.floor(beats / step))
  if (count < 2) return []

  return line.slice(0, count).map((note, index) => ({
    note,
    startBeat: startBeat + index * step,
    durationBeats: step * 0.9,
    // Tay phải, không xét cao độ: câu chạy kết đoạn là của tay phải theo
    // định nghĩa, và lúc ấy tay trái đã nghỉ hẳn để nhường chỗ.
    hand: 'right' as const,
  }))
}
