import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { scaleTones } from '../reharmEngine/keyDetection'
import type { TimelineEvent } from '../style/types'
import { beatsOf, chordStarts, mainChordSpans, totalBeatsOf } from '../chordTiming'
import type { ParsedChord } from '../types'
import type { ApproachDirection, OrnamentDensity } from './graceNoteOrnamenter'
import { densityOption, stepInScale } from './graceNoteOrnamenter'
import { arpeggioRun } from './leadIn'
import type { Lick } from './soloVocabulary'
import {
  chordBlues,
  chordMaterial,
  chordPentatonic,
  fallbackLick,
  licksFor,
  resolvesUpFourth,
} from './soloVocabulary'

/**
 * Sinh câu solo hoặc câu dạo theo phong cách.
 *
 * **Đây là phần mô phỏng, không phải chép công thức.** Nhưng khác bản trước,
 * mọi mẫu câu dùng ở đây đều **truy được về một chỗ cụ thể** trong tài liệu
 * hoặc trong hai bản ký âm tham khảo — xem `soloVocabulary.ts`.
 *
 * Nguyên tắc cốt lõi, và cũng là chỗ bản trước làm sai: **mỗi hợp âm được một
 * mẫu câu riêng, chất liệu lấy từ chính hợp âm đang vang**. Bản trước chọn bộ
 * nốt theo hợp âm *cuối câu* rồi dùng cho cả câu, nên nửa đầu câu lệch hoà âm;
 * và khi chọn nguồn ngũ cung thì nó dùng ngũ cung của *giọng bài hát* cố định
 * suốt đoạn, không bám hợp âm chút nào.
 */

/** Sai số cho phép khi so mốc phách, tránh lỗi làm tròn số thực. */
const EPSILON = 1e-6

/** Tầm giai điệu của đoạn giang tấu, và các mức nâng. */
const SOLO_LOW: MidiNote = 62
const SOLO_HIGH: MidiNote = 90
/** Nâng cho câu lẻ trong cùng một lượt. */
const PHRASE_LIFT = 5
/** Trần tuyệt đối, để lượt sau không leo hết bàn phím. */
const SOLO_CEILING: MidiNote = 96

/** Khoảng nghỉ lấy hơi ở cuối mỗi câu nhạc, tính bằng phách. */
const REST_BEATS = 1

/** Tầm giai điệu, cao hơn hẳn phần đệm để nghe tách bạch. */
const MELODY_LOW: MidiNote = 67
const MELODY_HIGH: MidiNote = 88


/**
 * Nguồn nốt để dựng câu solo.
 *
 * `pianoimprovnotes.md` mục 3.1 nêu hai lối chọn nốt: *scale-based* và *chord
 * tone*. Điểm mấu chốt là **cả hai đều phải dựng trên hợp âm đang vang**, chứ
 * không phải trên giọng của bài. Bản trước dựng ngũ cung trên chủ âm rồi giữ
 * nguyên suốt đoạn — đó chính là chỗ nghe "không hợp vòng hợp âm".
 */
export type SoloNoteSource =
  /** Nốt của chính hợp âm đang vang: 1, 3, 5, 7, 9. */
  | 'chordTone'
  /** Ngũ cung dựng trên nốt gốc hợp âm, trưởng hay thứ tuỳ tính chất hợp âm. */
  | 'chordPentatonic'
  /** Ngũ cung của hợp âm cộng nốt blue ở quãng năm giảm. */
  | 'blues'

export interface NoteSourceOption {
  id: SoloNoteSource
  label: string
  description: string
}

export const NOTE_SOURCE_OPTIONS: readonly NoteSourceOption[] = [
  {
    id: 'chordTone',
    label: 'Nốt hợp âm',
    description:
      'Bậc 1, 3, 5, 7 và 9 của hợp âm đang vang. Chắc chắn khớp hoà âm nhất.',
  },
  {
    id: 'chordPentatonic',
    label: 'Ngũ cung của hợp âm',
    description:
      'Ngũ cung dựng trên nốt gốc hợp âm, trưởng hay thứ theo tính chất hợp âm. Thoáng hơn nốt hợp âm mà vẫn bám hoà âm.',
  },
  {
    id: 'blues',
    label: 'Màu blues',
    description:
      'Ngũ cung của hợp âm cộng nốt blue ở quãng năm giảm, tạo cảm giác căng rồi giải toả.',
  },
]

export interface SoloOptions {
  /** Số phách mỗi hợp âm chiếm. */
  beatsPerChord: number
  /** Số nốt đích mỗi hợp âm. */
  notesPerChord?: number
  direction?: ApproachDirection
  density?: OrnamentDensity
  key?: { tonic: PitchClass; scale: ScaleType } | null
  noteSource?: SoloNoteSource
  /** Số hợp âm mỗi câu nhạc. Hết câu thì nghỉ lấy hơi. */
  chordsPerPhrase?: number
  /**
   * Lượt giang tấu thứ mấy, đếm từ 0.
   *
   * Mỗi lượt cho một đoạn solo khác lượt trước bằng cách **xoay thứ tự mẫu
   * câu** — cú quét rơi vào hợp âm khác, câu mở đầu bằng mẫu khác. Chỉ đổi
   * chất liệu, **không** đổi quãng âm hay mật độ: thử cho lượt sau cao dần và
   * dày dần rồi, kết quả là ba lượt sau đội trần bàn phím và nghe chói.
   *
   * Vẫn **tất định** theo số lượt: phát lại bài thì lượt thứ nhất vẫn ra đúng
   * đoạn cũ, nên người học tập theo được. Ngẫu nhiên mỗi lần phát thì không.
   */
  take?: number
}

/**
 * Xếp hạng nốt của hợp âm theo mức đáng làm nốt đích.
 *
 * Nốt màu xếp trên nốt gốc và quãng năm: nốt gốc thì phần đệm đã vang rồi, còn
 * quãng năm gần như không nói lên điều gì. Bậc ba và bậc bảy xếp giữa vì chúng
 * quyết định tính chất hợp âm.
 */
function targetPriority(interval: number): number {
  const folded = interval % 12
  if (folded === 0) return 3
  if (folded === 7) return 4
  if (folded === 3 || folded === 4) return 1
  if (folded === 10 || folded === 11) return 1
  // Nốt màu: bậc chín, mười một, mười ba
  return 0
}

/** Chọn các lớp cao độ đáng làm nốt đích cho một hợp âm. */
function targetPitchClasses(chord: ParsedChord, count: number): PitchClass[] {
  return [...chord.quality.intervals]
    .sort((a, b) => targetPriority(a) - targetPriority(b))
    .slice(0, Math.max(1, count))
    .map((interval) => (chord.root + interval) % 12)
}

/**
 * Đưa một lớp cao độ về nốt cụ thể gần nốt trước nhất.
 * Nhờ vậy câu nhạc đi từng bước thay vì nhảy quãng xa.
 */
function nearestNote(
  pitchClass: PitchClass,
  previous: MidiNote,
  low: MidiNote = MELODY_LOW,
  high: MidiNote = MELODY_HIGH,
): MidiNote {
  let best = low + ((pitchClass - (low % 12) + 12) % 12)

  for (let note = best; note <= high; note += 12) {
    if (Math.abs(note - previous) < Math.abs(best - previous)) best = note
  }

  return best
}

export interface SoloNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  /** Nốt láy hay nốt chính. */
  isGrace: boolean
  /** Tay nào chơi; bỏ trống thì mặc định tay phải. */
  hand?: 'left' | 'right'
}

/**
 * Câu fill — đoạn ngắn chêm vào **cuối một hợp âm để dẫn sang hợp âm sau**.
 *
 * Đây mới đúng nghĩa chữ "fill": nó lấp chỗ trống giữa hai hợp âm và kéo tai
 * người nghe sang hợp âm kế tiếp, chứ không chạy suốt bài. Tài liệu mô tả
 * điệu ballad chính là "hợp âm khối bám nhịp hoà âm, **chèn fill vào chỗ
 * trống**" — tức fill chỉ xuất hiện ở khe hở, không phải ở mọi lúc.
 *
 * Ba điểm làm nên một câu fill đúng:
 *
 * 1. Nằm ở **cuối** quãng thời gian của hợp âm, không phải trải đều.
 * 2. **Kết thúc ngay cạnh** nốt đích của hợp âm kế tiếp, cách một bậc — nhờ
 *    vậy tai nghe được kéo sang hợp âm mới.
 * 3. **Thỉnh thoảng mới có**, không phải hợp âm nào cũng chêm.
 */
/** Một chỗ chêm được câu fill. */
export interface FillPosition {
  /** Chỉ số trong mảng hợp âm đã truyền vào, kể cả hợp âm lướt. */
  index: number
  /**
   * Chỉ số trong **vòng hợp âm chính**.
   *
   * Giao diện neo theo số này: bản nhạc đánh số hợp âm theo vòng chính, nên
   * muốn cho người dùng bật tắt fill ở một chỗ thì phải nói cùng ngôn ngữ.
   */
  mainIndex: number
}

/**
 * Những chỗ sẽ được chêm câu fill.
 *
 * Tách riêng khỏi phần dựng nốt để giao diện biết **chỗ nào đang có fill** mà
 * không phải đoán từ dòng thời gian. Hai bên dùng chung đúng một luật chọn chỗ,
 * nên không thể lệch nhau.
 *
 * ## Chỗ ngắt của lời quyết định, không phải mật độ
 *
 * Bản đầu rải fill theo mật độ: cứ `n` hợp âm chêm một câu. Đối chiếu bản ký
 * âm `reference/nguoi ay.mxl` thì thấy luật đó sai hẳn về nguyên tắc —
 * `phongcachdemhatkhabu.md` phần 15 định nghĩa câu fill là *"những câu nhạc
 * chơi để lấp vào khoảng trống lúc ca sĩ ngắt nghỉ lấy hơi"*, nên chỗ chêm
 * fill do **ca sĩ** quyết định chứ không do một con số đếm đều.
 *
 * Đếm trên bản ký âm: 15 dấu lặng trên 28 ô nhịp, và chúng không rải đều —
 * chúng rơi đúng vào chỗ hết một câu hát. Đưa `breaths` vào thì danh sách chỗ
 * chêm bám theo lời; không đưa (luồng gõ vòng hợp âm trơn, không có lời) thì
 * lùi về cách đếm đều như cũ.
 */
export function fillPositions(
  chords: readonly ParsedChord[],
  options: {
    density?: OrnamentDensity
    /** Các chỗ người dùng đã tắt fill, tính theo vòng hợp âm chính. */
    skip?: ReadonlySet<number>
    /**
     * Các hợp âm mà câu hát kết thúc ở đó, tính theo vòng hợp âm chính.
     *
     * Rỗng nghĩa là chưa dán lời nên chưa biết ca sĩ nghỉ ở đâu.
     */
    breaths?: ReadonlySet<number>
    /**
     * Các chỗ **luôn được chêm**, mật độ không gạt đi được.
     *
     * Dành cho chỗ chuyển đoạn: câu chạy ở đó là chuyện cấu trúc bài, không
     * phải đồ trang trí. Đo trên chính bài người dùng đang dựng thì thấy ở mức
     * mật độ Thưa và Vừa, bộ lọc gạt đúng chỗ cuối tiền điệp khúc — tức chỗ
     * duy nhất bắt buộc phải có.
     */
    always?: ReadonlySet<number>
    /** Độ dài mặc định một hợp âm, để biết ô nhịp nào đã bị chia ngắn. */
    beatsPerChord?: number
  } = {},
): FillPosition[] {
  const {
    density = 'medium',
    skip,
    breaths,
    always,
    beatsPerChord = 4,
  } = options
  const { everyNth } = densityOption(density)

  const positions: FillPosition[] = []
  let mainIndex = -1
  /*
    Mật độ vẫn có việc khi đã biết chỗ ngắt, nhưng nó thưa **trên danh sách
    chỗ ngắt** chứ không trên cả vòng hợp âm: chêm vào mọi chỗ ca sĩ lấy hơi
    thì cây đàn nói suốt, còn đếm đều trên vòng thì lại rơi vào giữa câu hát.
  */
  let breathCount = -1

  for (let index = 0; index < chords.length; index += 1) {
    if (!chords[index].passing) mainIndex += 1

    if (breaths) {
      if (!breaths.has(mainIndex)) continue
      breathCount += 1
      if (!always?.has(mainIndex) && breathCount % everyNth !== 0) continue
    } else if (index % everyNth !== 0 && !always?.has(mainIndex)) continue

    /*
      **Chỉ chêm fill vào ô nhịp chưa bị chia ngắn.**

      Câu fill sinh ra để lấp chỗ trống ở cuối một hợp âm. Nhưng chỗ trống đó
      chính là chỗ hợp âm lướt đã chiếm: khi một ô nhịp bị chia đôi cho vòng
      hai-năm lướt, nửa sau không còn trống nữa. Nhét fill vào đó thì hai thứ
      chồng lên nhau và cùng bị bóp ngắn lại — nghe ra là lệch nhịp.

      So theo **độ dài thật**, không phải theo việc hợp âm có ghi thời lượng
      riêng hay không. Hợp âm cuối đoạn cũng ghi thời lượng riêng — nhưng là
      ghi **dài thêm** một ô nhịp, và đó chính là ô dành cho câu chạy. Bản đầu
      loại nó cùng một rọ với hợp âm bị chia đôi, nên câu chạy chuyển đoạn
      không bao giờ được sinh ra.
    */
    if (beatsOf(chords[index], beatsPerChord) < beatsPerChord) continue

    // Hợp âm cuối dẫn về hợp âm đầu, vì vòng được chơi lặp lại.
    const next = chords[(index + 1) % chords.length]
    if (next === chords[index]) continue

    if (skip?.has(mainIndex)) continue

    positions.push({ index, mainIndex })
  }

  return positions
}

/**
 * Nốt căng của hợp âm hiện tại, giải quyết xuống quãng ba của hợp âm sau.
 *
 * Đây là thứ tạo sức hút thật sự ở chỗ chuyển đoạn, đo được trên bản ký âm
 * `reference/nguoi ay.mxl`: vào điệp khúc, tuyến giai điệu ngân **F** suốt hai
 * phách cuối trên hợp âm G, rồi buông xuống **E** — quãng ba của C — ngay đầu
 * ô nhịp sau. F là quãng bảy của G7; hai nốt cách nhau đúng nửa cung.
 *
 * Cặp nốt đó gọi là **nốt dẫn** (guide tone), và nó là bộ khung của mọi vòng
 * hai-năm-một mà `phongcachdemhatkhabu.md` phần 8 gọi là công thức mẹ:
 *
 * - `G7 → C` — F (bảy của G7) xuống E (ba của C)
 * - `Dm7 → G7` — C (bảy của Dm7) xuống B (ba của G7)
 * - `F → C` — F (gốc của F) xuống E (ba của C)
 *
 * Nên câu fill phải kết ở **nốt của hợp âm đang chơi**, không phải ở nốt của
 * hợp âm sắp tới. Bản đầu làm ngược: nó kết ngay trên nốt đích, tức đánh trước
 * mất cái nốt đáng lẽ để dành cho phách mạnh của ô sau — nghe hết cả bất ngờ.
 *
 * Rỗng nghĩa là hai hợp âm này không có cặp nốt dẫn nào; lúc đó quay về cách
 * cũ là đi liền bậc về phía nốt đích.
 */
function guideToneInto(
  current: ParsedChord,
  next: ParsedChord,
): PitchClass | null {
  const third = normalizePitchClass(
    next.root + (next.quality.intervals.includes(3) ? 3 : 4),
  )

  const tones = current.quality.intervals.map((step) =>
    normalizePitchClass(current.root + step),
  )

  /*
    Ưu tiên nốt cách quãng ba ấy **đúng nửa cung phía trên**: nửa cung là bước
    giải quyết chặt nhất, cả cung thì lỏng hơn nhưng vẫn nghe ra hướng đi
    xuống. Xét theo thứ tự đó rồi mới tới nốt nằm dưới một nửa cung, vốn giải
    quyết đi lên.
  */
  for (const gap of [1, 2, -1]) {
    const wanted = normalizePitchClass(third + gap)
    if (tones.includes(wanted)) return wanted
  }

  return null
}

/**
 * Cách chơi ô nhịp nối sang đoạn mới.
 *
 * Hai con số này người dùng chỉnh được ở menu chuột phải, vì chúng phụ thuộc
 * vào **bài hát** chứ không suy ra được: câu hát của mỗi bài cất giọng sớm
 * muộn khác nhau, và người đệm mỗi người thích câu chạy dài ngắn khác nhau.
 */
export interface TransitionRun {
  /** Hợp âm rải chạy mấy quãng tám. */
  octaves: number
  /**
   * Im hẳn mấy phách trước vạch nhịp.
   *
   * Đây là chỗ người hát cất giọng. Trong rất nhiều bài, chữ đầu câu của đoạn
   * mới **không** rơi vào phách mạnh — người ta hát trước vài chữ rồi mới rơi
   * vào đó. Bản ký âm `reference/nguoi ay.mxl` là ví dụ: năm chữ *"Người ấy có
   * tốt với"* nằm trên ô nhịp hợp âm G, chữ *"em"* mới rơi đúng phách mạnh của
   * hợp âm C. Chạy sát tới vạch nhịp là đè lên đúng lúc người hát cần cất
   * giọng, và đẩy cả đoạn hát lệch đi.
   */
  restBeats: number
}

export function generateFillLine(
  chords: readonly ParsedChord[],
  options: SoloOptions & {
    fillBeats?: number
    /** Các chỗ người dùng đã tắt fill, tính theo vòng hợp âm chính. */
    skipFills?: ReadonlySet<number>
    /** Các hợp âm mà câu hát kết thúc ở đó; xem `fillPositions`. */
    breaths?: ReadonlySet<number>
    /**
     * Các hợp âm là **mốc chuyển đoạn**, kèm cách chơi ô nối của từng chỗ.
     *
     * Chỗ này câu fill đổi hình hẳn — xem ghi chú trong thân hàm.
     */
    sectionEnds?: ReadonlyMap<number, TransitionRun>
  },
): SoloNote[] {
  const {
    beatsPerChord,
    fillBeats = Math.min(1.5, beatsPerChord / 2),
    direction = 'mixed',
    density = 'medium',
    key = null,
    skipFills,
    breaths,
    sectionEnds,
  } = options

  if (chords.length < 2) return []

  const tones = key ? scaleTones(key.tonic, key.scale) : new Set<PitchClass>()
  const fillStarts = chordStarts(chords, beatsPerChord)

  const result: SoloNote[] = []

  for (const { index, mainIndex } of fillPositions(chords, {
    density,
    skip: skipFills,
    breaths,
    beatsPerChord,
    // Chỗ chuyển đoạn luôn được chêm, mật độ không gạt đi được.
    always: sectionEnds ? new Set(sectionEnds.keys()) : undefined,
  })) {
    const next = chords[(index + 1) % chords.length]
    const chordEnd = fillStarts[index] + beatsOf(chords[index], beatsPerChord)

    /*
      Cuối một đoạn thì thay câu fill bằng một **câu chạy ngón** vào đoạn mới.

      Chỗ này khác hẳn chỗ ngắt giữa đoạn, và đó là chỗ hai bản trước làm sai:

      - Bản Hướng B ngân nốt dẫn suốt phách cuối — đứng yên một chỗ, không dẫn
        ai đi đâu cả.
      - Bản sau đó im suốt rồi hất hai nốt kép, vì tôi đọc dấu lặng trong bản
        ký âm thành "chỗ trống phải chừa ra".

      Tài liệu về đệm hát phân biệt rõ hai tình huống mà tôi đã gộp làm một:
      chêm fill vào chỗ ca sĩ **lấy hơi**, và chêm vào chỗ ca sĩ **ngân dài**.
      Cuối phiên khúc là trường hợp thứ hai — người hát ngân nốt cuối chờ vào
      điệp khúc — nên chỗ đó không phải chừa trống, mà là chỗ để chạy một câu.
      Cùng nguồn cũng ghi câu chạy giữa hai đoạn là công cụ chuyển đoạn, và
      hợp với ballad hơn cả.

      Câu chạy còn làm một việc thực dụng: **đếm nhịp hộ người hát**. Một chuỗi
      nốt đều dẫn thẳng tới vạch nhịp thì vào đúng phách dễ hơn hẳn so với việc
      đếm thầm trong khoảng lặng.
    */
    const transition = sectionEnds?.get(mainIndex)
    if (transition) {
      /*
        Câu chạy chiếm ô nhịp cuối của hợp âm, và ô đó không quạt hợp âm nữa —
        xem `renderPattern`, tham số `barsWithoutComping`.

        Hợp âm cuối đoạn được cấp thêm một ô nhịp để người hát ngân cho hết
        câu; ô thêm ấy chính là ô này.
      */
      const barBeats = Math.min(
        beatsPerChord,
        beatsOf(chords[index], beatsPerChord),
      )
      const rest = Math.min(transition.restBeats, barBeats - 0.5)

      for (const note of arpeggioRun({
        chord: chords[index],
        octaves: transition.octaves,
        endBeat: chordEnd - rest,
        maxBeats: barBeats - rest,
      })) {
        result.push({ ...note, isGrace: false })
      }

      continue
    }

    /*
      Kết ở **nốt dẫn của hợp âm đang chơi** nếu có, để nó tự giải quyết sang
      hợp âm sau. Không có thì lùi về cách cũ: kết ngay cạnh nốt đặc trưng của
      hợp âm kế tiếp.
    */
    const guide = guideToneInto(chords[index], next)
    const [targetClass] = targetPitchClasses(next, 1)
    const landing = nearestNote(guide ?? targetClass, MELODY_LOW + 7)

    /*
      Ba nốt là đủ để nghe ra hướng đi mà không lấn sang phần hát.
    */
    const approachFrom = direction === 'above' ? 'down' : 'up'
    const line: MidiNote[] = [landing]
    for (let step = 0; step < 2; step += 1) {
      line.unshift(stepInScale(line[0], approachFrom === 'up' ? 'down' : 'up', tones))
    }

    const start =
      chordEnd - Math.min(fillBeats, beatsOf(chords[index], beatsPerChord) / 2)

    /*
      Mấy nốt chạy đi nhanh, **nốt kết ngân dài** phần còn lại.

      Bản ký âm cho thấy sức căng đến từ chỗ *giữ lâu* chứ không từ chỗ đánh
      đúng lúc chót: nốt F được ngân suốt hai phách cuối rồi mới buông. Chia
      đều ba nốt thì nốt dẫn trôi qua mất, không kịp căng.

      Độ dài nốt chạy phải **rơi đúng lưới nốt kép**. Lấy thẳng một phần tư
      quãng fill thì ra 0,375 phách — không phải nốt kép cũng chẳng phải nốt
      móc, nghe lệch hẳn khỏi nhịp đệm. Nên làm tròn xuống bội của nốt kép rồi
      dồn phần dư cho nốt kết.
    */
    const GRID = 0.25
    let runLength = Math.max(
      GRID,
      Math.floor(fillBeats / (line.length + 1) / GRID) * GRID,
    )
    let holdLength = fillBeats - runLength * (line.length - 1)

    // Quãng fill quá ngắn để giữ được nốt nào: chia đều, thà đều còn hơn hụt.
    if (holdLength < runLength) {
      runLength = fillBeats / line.length
      holdLength = runLength
    }

    line.forEach((note, position) => {
      const last = position === line.length - 1
      const length = last ? holdLength : runLength

      result.push({
        note,
        startBeat: start + position * runLength,
        // Nốt kết ngân trọn, để nó còn vang lúc hợp âm sau vào và giải quyết.
        durationBeats: last ? length : length * 0.9,
        isGrace: false,
      })
    })
  }

  return result
}

/**
 * Đoạn solo — chơi liên tục suốt cả vòng, dùng cho **đoạn giang tấu**.
 *
 * Khác hẳn câu fill: đây là đoạn nhạc cụ chơi thay cho giọng hát, thường nằm
 * giữa bài, nên giai điệu chạy suốt chứ không chỉ chêm vào khe hở. Chỉ nên bật
 * ở đoạn không có lời — bật suốt bài thì nó đè lên phần hát.
 */
export function generateSolo(
  chords: readonly ParsedChord[],
  options: SoloOptions,
): SoloNote[] {
  const {
    beatsPerChord,
    density = 'medium',
    key = null,
    noteSource = 'chordTone',
    chordsPerPhrase = 2,
    take = 0,
  } = options

  if (chords.length === 0) return []

  const tones = key ? scaleTones(key.tonic, key.scale) : new Set<PitchClass>()
  const phraseChords = Math.max(1, chordsPerPhrase)
  const round = Math.max(0, Math.floor(take))

  /*
    Mật độ và quãng âm **không đổi theo lượt**.

    Bản trước cho lượt sau vừa dày hơn vừa cao hơn, tưởng là đoạn solo "dâng
    dần" cho có kịch tính. Đo lại thì hỏng: lượt đầu đỉnh ở nốt 88, còn cả ba
    lượt sau đều **đội trần ở nốt 96** — tức chúng không dâng dần mà đỗ luôn ở
    đỉnh bàn phím, và ở tầm đó tiếng đàn tổng hợp nghe chói. Ba trên bốn lượt
    nghe tệ hơn hẳn lượt đầu.

    Cái người dùng yêu cầu là *"mỗi lần giang tấu một cái gì mới khác nhau"* —
    tức đổi **chất liệu câu nhạc**, không phải đổi độ cao và độ dày. Việc đó
    danh sách mẫu câu xoay theo lượt đã làm đủ.
  */
  const notesPerBeat =
    density === 'sparse' ? 0.8 : density === 'dense' ? 2.2 : 1.4

  /*
    Câu solo chạy trên **vòng hợp âm chính**, bỏ qua hợp âm lướt.

    Hợp âm lướt là việc của tay đệm. Cho giai điệu chạy theo từng hợp âm lướt
    dài một phách thì câu nhạc bị băm vụn, và chất liệu bị đổi liên tục theo
    những hợp âm chỉ thoáng qua. Mỗi hợp âm chính vì vậy lấy lại trọn khoảng
    thời gian của mình, kể cả phần đã nhường cho hợp âm lướt.
  */
  const spans = mainChordSpans(chords, beatsPerChord)
  const totalBeats = totalBeatsOf(chords, beatsPerChord)

  /*
    Câu nhạc chia theo **phách**, không theo số hợp âm.

    Đây là chỗ hỏng khi hợp âm lướt biết chia đôi ô nhịp: chia theo số hợp âm
    thì một câu gồm hai hợp âm lướt chỉ còn hai phách thay vì tám, nên chỗ nghỉ
    lấy hơi và chỗ đổi quãng âm rơi lung tung — nghe ra là lệch nhịp. Độ dài
    một câu phải là một đại lượng **thời gian**, không phải số món.
  */
  const phraseBeats = Math.max(1, phraseChords * beatsPerChord)
  const phraseAt = (beat: number) => Math.floor((beat + EPSILON) / phraseBeats)

  const result: SoloNote[] = []
  let from: MidiNote = SOLO_LOW + 12
  let previousShape: number[] = []
  let positionInPhrase = 0
  let currentPhrase = -1

  for (let index = 0; index < spans.length; index += 1) {
    const { chord, start, beats: chordBeats } = spans[index]

    const phrase = phraseAt(start)
    if (phrase !== currentPhrase) {
      currentPhrase = phrase
      positionInPhrase = 0
    }

    // Cuối câu là hợp âm cuối cùng còn nằm trong câu này.
    const nextStart = spans[index + 1]?.start ?? totalBeats
    const isPhraseEnd =
      index === spans.length - 1 || phraseAt(nextStart) !== phrase

    /*
      Đổi quãng âm giữa các câu để tạo kịch tính — `pianoimprovnotes.md` mục 4:
      *"thay đổi quãng âm, lúc cao lúc thấp"*. Câu chẵn ở tầm dưới, câu lẻ nâng
      lên. Nâng bằng quãng năm chứ không phải quãng tám, để hai câu vẫn nghe
      như cùng một người chơi.
    */
    const lift = phrase % 2 === 0 ? 0 : PHRASE_LIFT
    const low = SOLO_LOW + lift
    const high = Math.min(SOLO_CEILING, SOLO_HIGH + lift)

    /*
      Nghỉ lấy hơi ở cuối mỗi câu. `pianoimprovnotes.md` mục 4 nói thẳng: cần
      khoảng nghỉ để lấy hơi giữa các câu.
    */
    const playBeats = isPhraseEnd
      ? Math.max(chordBeats / 2, chordBeats - REST_BEATS)
      : chordBeats

    const lick = chooseLick({
      phrase,
      positionInPhrase,
      isPhraseEnd,
      playBeats,
      hasMotif: previousShape.length > 0,
      density,
      take: round,
      resolving: resolvesUpFourth(chord, spans[index + 1]?.chord ?? null),
    })

    const built = lick.build({
      chord,
      next: spans[index + 1]?.chord ?? null,
      startBeat: start,
      beats: playBeats,
      from,
      low,
      high,
      scaleTones: tones,
      previousShape,
      notesPerBeat,
      material: materialFor(chord, noteSource),
    })

    if (built.notes.length === 0) continue

    for (const note of built.notes) {
      result.push({
        note: note.note,
        startBeat: note.startBeat,
        durationBeats: note.durationBeats,
        isGrace: note.soft,
      })
    }

    // Nối câu sau vào đúng chỗ câu trước dừng, cho liền mạch.
    from = built.notes[built.notes.length - 1].note
    if (built.shape.length > 0) previousShape = built.shape
    positionInPhrase += 1
  }

  return result.sort((a, b) => a.startBeat - b.startBeat)
}


/** Chất liệu nốt của một hợp âm theo nguồn người dùng chọn. */
function materialFor(
  chord: ParsedChord,
  noteSource: SoloNoteSource,
): PitchClass[] {
  if (noteSource === 'chordPentatonic') return chordPentatonic(chord)
  if (noteSource === 'blues') return chordBlues(chord)
  return chordMaterial(chord)
}

interface LickChoice {
  phrase: number
  positionInPhrase: number
  isPhraseEnd: boolean
  playBeats: number
  hasMotif: boolean
  density: OrnamentDensity
  take: number
  /** Hợp âm sau nằm quãng bốn đi lên — chỗ V về I. */
  resolving: boolean
}

/**
 * Thực đơn mẫu câu cho vị trí mở câu và vị trí giữa câu.
 *
 * Xoay theo cả số câu lẫn số lượt, nên hai lượt giang tấu liền nhau không bao
 * giờ dùng cùng một trình tự mẫu câu. Ba phần tử mỗi thực đơn là đủ: nhiều hơn
 * thì hai lượt cách nhau quá xa, nghe như hai người khác nhau chơi.
 */
interface LickChoice {
  phrase: number
  positionInPhrase: number
  isPhraseEnd: boolean
  playBeats: number
  hasMotif: boolean
  density: OrnamentDensity
  take: number
  /** Hợp âm sau nằm quãng bốn đi lên — chỗ V về I. */
  resolving: boolean
}

/**
 * Thực đơn mẫu câu cho vị trí mở câu và vị trí giữa câu.
 *
 * Xoay theo cả số câu lẫn số lượt, nên hai lượt giang tấu liền nhau không bao
 * giờ dùng cùng một trình tự mẫu câu. Ba phần tử mỗi thực đơn là đủ: nhiều hơn
 * thì hai lượt cách nhau quá xa, nghe như hai người khác nhau chơi.
 */
/*
  Vốn mẫu câu **đang dùng thật**.

  Trong `soloVocabulary.ts` còn ba mẫu nữa — nốt dẫn hướng, kẹp nửa cung, chùm
  ba — đã viết xong và có test, nhưng **cố ý chưa đưa vào đây**. Lý do: chúng
  được thêm cả ba cùng một lúc rồi bật lên luôn, và kết quả nghe tệ hơn hẳn bộ
  bảy mẫu đã được duyệt bằng tai. Bật lại thì bật **từng cái một** để còn biết
  cái nào hỏng.
*/
/**
 * Chọn mẫu câu cho một hợp âm.
 *
 * Đây là chỗ dựng "câu chuyện" của đoạn solo, theo mục 4 của
 * `pianoimprovnotes.md` — *chơi như hội thoại*. Cách chọn là **tất định**, tức
 * cùng một vòng hợp âm luôn cho ra cùng một đoạn solo: người học cần nghe lại
 * được đúng câu vừa nghe để tập theo, ngẫu nhiên mỗi lần phát thì không tập nổi.
 */
function chooseLick(choice: LickChoice): Lick {
  /*
    Danh sách mẫu cho từng vị trí **suy ra từ `soloVocabulary.ts`**, không còn
    viết tay ở đây nữa. Bản trước giữ hai mảng `OPENERS`/`MIDDLES` tại chỗ này,
    tách rời khỏi chỗ định nghĩa mẫu — thêm mẫu mà quên thêm vào mảng là mẫu đó
    không bao giờ được chọn, và đã có lần nửa vốn từ vựng nằm chết vì vậy.
  */
  const openers = licksFor('opener')
  const middles = licksFor('middle')

  const {
    phrase,
    positionInPhrase,
    isPhraseEnd,
    playBeats,
    hasMotif,
    density,
    take,
  } = choice

  // Không đủ chỗ cho mẫu đã chọn thì lùi về mẫu nền tảng, đừng chơi dở dang.
  const fit = (lick: Lick | undefined): Lick =>
    lick && lick.minBeats <= playBeats ? lick : fallbackLick()

  /*
    Kết câu luôn dùng mẫu đi trên nốt hợp âm, vì chỉ mẫu đó kết ở nốt ổn định —
    mục 4: *"tránh dừng ở nốt lơ lửng khiến câu nhạc nghe dở dang"*.
  */
  /*
    Kết câu ở nốt ổn định — mục 4: *"tránh dừng ở nốt lơ lửng khiến câu nhạc
    nghe dở dang"*.
  */
  if (isPhraseEnd) return fit(fallbackLick())

  // Mật độ thưa thì thỉnh thoảng nghỉ hẳn một hợp âm cho câu nhạc thoáng.
  if (density === 'sparse' && positionInPhrase === 1) {
    return fit(licksFor('rest')[0])
  }

  // Số lượt cộng vào chỗ xoay, nên lượt sau đổi hẳn trình tự mẫu câu.
  const rotation = phrase + take

  if (positionInPhrase === 0 || middles.length === 0) {
    return fit(openers[rotation % openers.length])
  }

  const middle = middles[(rotation + positionInPhrase) % middles.length]
  // Chưa có mô-típ nào để nhắc lại thì lùi về mẫu giữa câu khác.
  if (middle.id === 'echo' && !hasMotif) {
    return fit(middles.find((lick) => lick.id !== 'echo') ?? middle)
  }
  return fit(middle)
}




/** Đổi câu solo thành dòng thời gian để phát cùng phần đệm. */
export function soloToTimeline(
  solo: readonly SoloNote[],
  velocity = 72,
): TimelineEvent[] {
  return solo.map((note) => ({
    notes: [note.note],
    startBeat: note.startBeat,
    durationBeats: note.durationBeats,
    hand: note.hand ?? ('right' as const),
    // Nốt láy đánh nhẹ hơn hẳn, nó chỉ là cái vuốt vào nốt chính.
    velocity: Math.round(note.isGrace ? velocity * 0.6 : velocity),
  }))
}

/** Các nốt của hợp âm, dùng cho phần hiển thị. */
export function chordToneNames(chord: ParsedChord): PitchClass[] {
  return chordPitchClasses(chord.root, chord.quality)
}

export { densityOption }
