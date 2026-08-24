import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { scaleTones } from '../reharmEngine/keyDetection'
import { assignFingers, capStack } from './fingering'
import { applyFeel, type SoloFeel } from './soloFeel'
import type { TimelineEvent } from '../style/types'
import { beatsOf, chordStarts, mainChordSpans, totalBeatsOf } from '../chordTiming'
import type { ParsedChord } from '../types'
import type { ApproachDirection, OrnamentDensity } from './graceNoteOrnamenter'
import { densityOption, ornamentLine, stepInScale } from './graceNoteOrnamenter'
import { arpeggioRun, octaveRun } from './leadIn'
import type { LickyMode } from '../licky/types'
import { placeLick } from '../licky/generate'
import type { Lick } from './soloVocabulary'
import {
  chordBlues,
  chordMaterial,
  chordPentatonic,
  chordTonesStrict,
  fallbackLick,
  getLick,
  inKeyMaterial,
  interludeMaterial,
  keepInKey,
  ladderOf,
  licksFor,
  nearestStep,
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

/**
 * Tầm giai điệu của đoạn giang tấu, và các mức nâng.
 *
 * Trần đặt ở **La quãng tám 5**, không phải Sol quãng tám 6 như bản đầu. Đây là
 * app đệm hát: cây đàn nâng giọng người, nên câu solo giang tấu vẫn phải nằm
 * trong tầm một người đệm với tới. Sol quãng tám 6 là tầm của người độc tấu —
 * nghe ra ngay là hai người chơi hai bài khác nhau.
 *
 * Dòng nhạc nào cần câu solo lên cao thì vẫn lên được: bên gọi truyền `range`
 * riêng, và mọi chỗ dựng nốt đều đi theo tầm ấy.
 */
const SOLO_LOW: MidiNote = 62
const SOLO_HIGH: MidiNote = 79
/** Nâng cho câu lẻ trong cùng một lượt. */
const PHRASE_LIFT = 5
/** Trần tuyệt đối, để lượt sau không leo hết bàn phím. */
const SOLO_CEILING: MidiNote = 81

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
  /**
   * Thang âm jazz lấy từ kho PianoBrain, theo đúng chất hợp âm đang vang.
   *
   * Chỉ có tác dụng ở **đoạn không lời**. Câu lót chen giữa lời không đọc nguồn
   * nốt này — chỗ đó giọng hát là giai điệu, thêm #11 và b9 vào là giành chỗ
   * của người hát.
   */
  | 'storeScale'

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

/*
  `jazzScale` **cố ý không có** trong danh sách trên.

  Ba nguồn nốt kia là ba cách dựng nốt từ chính hợp âm, ngang hàng nhau, chọn
  một trong ba. Gam jazz thì khác hẳn: nó đọc kho PianoBrain, nó chỉ có tác dụng
  ở đoạn không lời, và mọi item của nó còn ở trạng thái draft. Xếp nó thành mục
  thứ tư trong cùng một hàng nút là nói với người dùng rằng bốn thứ này cùng
  loại — trong khi ba thứ đầu luôn có tiếng, còn thứ tư im lặng trên phần lớn
  hợp âm nhạc pop vì kho chưa có gam cho chúng.

  Nó nằm riêng thành một công tắc, và `ReharmHome` bật nó bằng cách đổi
  `noteSource` sang giá trị này.
*/

/**
 * Mật độ nốt láy, tách hẳn khỏi mật độ nốt của câu nhạc.
 *
 * Trước đây một ô chỉnh làm hai việc, nên muốn thưa nốt láy thì buộc phải thưa
 * luôn cả câu solo — không có cách nào giữ câu chạy dày mà bớt láy. `'none'`
 * để tắt hẳn, vì có người chỉ muốn nghe đúng nốt của hợp âm.
 */
export type GraceDensity = OrnamentDensity | 'none'

export interface SoloOptions {
  /** Số phách mỗi hợp âm chiếm. */
  beatsPerChord: number
  /** Số nốt đích mỗi hợp âm. */
  notesPerChord?: number
  direction?: ApproachDirection
  density?: OrnamentDensity
  /** Mật độ nốt láy, tách riêng khỏi mật độ nốt của câu nhạc. */
  graceDensity?: GraceDensity
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
  /** Hợp âm cuối vòng: chạy ngón trên đúng hợp âm đó. */
  endWithRun?: boolean
  /**
   * Trần và sàn cao độ của câu solo.
   *
   * Mặc định là tầm giang tấu rộng — câu solo lúc ấy là giọng chính, chơi cao
   * hơn hẳn phần đệm để nghe tách bạch, lên tới quãng tám thứ sáu.
   *
   * Nhưng ở **họ ballad** thì tầm ấy sai chỗ: đệm ballad là đàn nâng giọng hát,
   * và một câu vọt lên Si quãng tám 6 nghe như hai người chơi hai bài. Bên gọi
   * hạ trần xuống cho khớp tay người đệm. Xem `style/balladFamily.ts`.
   */
  range?: { low: MidiNote; high: MidiNote }
  /**
   * Đang dựng câu cho **đoạn không lời** (giang tấu, dạo đầu, dạo giữa).
   *
   * Bật thì nốt đi theo bậc ưu tiên riêng: nốt hợp âm trước, rồi ngũ cung, rồi
   * thang âm của giọng — xem `interludeMaterial`. Mặc định bật, vì hàm này sinh
   * ra chỉ để chơi ở đoạn không lời; câu lót chen giữa lời là việc của
   * `generateFillLine` và hàm đó không đọc cờ này.
   */
  interlude?: boolean
  /**
   * Hỏi thang âm cho một hợp âm — cửa duy nhất để gam jazz của kho vào câu nhạc.
   *
   * **Mặc định không có.** Gam là một lựa chọn của người đệm, không phải thứ
   * bật ngầm — bên gọi phải chủ động đưa hàm này vào. Phần lọc "đã có người rà
   * hay chưa" nằm bên trong hàm ấy, xem `../brain/chordScale.ts`.
   *
   * Trả `null` cho hợp âm kho chưa có gam; khi đó câu chạy quay về nốt hợp âm
   * như cũ. Xem `../brain/chordScale.ts`.
   */
  storeScale?: (chord: ParsedChord) => readonly PitchClass[] | null
  /**
   * Cách chia thời gian của câu chạy, theo điệu đang chọn.
   *
   * Bỏ trống là móc đơn đều — đúng bản cũ, và đúng cho ballad. Xem `soloFeel.ts`.
   */
  feel?: SoloFeel
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
  /**
   * Nốt **tô điểm của mẫu câu** — nốt kẹp nửa cung, nốt dẫn.
   *
   * Khác nốt láy: nốt láy vuốt sát ngay trước nốt chính và cách đúng một bậc,
   * còn nốt tô điểm là một bậc thật của câu nhạc, chỉ nằm ngoài hoà âm. Chúng
   * được miễn khỏi bước ép về nốt hợp âm — ép thì cả cụm bao vây biến thành
   * một nốt đánh ba lần.
   */
  ornament?: boolean
  /** Tay nào chơi; bỏ trống thì mặc định tay phải. */
  hand?: 'left' | 'right'
  /**
   * Ngón bấm, 1 là ngón cái. Quy ước soạn của KeyTrain, xem `fingering.ts` —
   * kho chưa có thế ngón của thầy nào cho gam bebop hay gam biến âm.
   */
  finger?: 1 | 2 | 3 | 4 | 5
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
    if (chords[index].passing) continue
    mainIndex += 1

    if (breaths) {
      const atBreath = breaths.has(mainIndex)
      if (!atBreath && !always?.has(mainIndex)) continue
      if (atBreath) breathCount += 1
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
    const forced = always?.has(mainIndex) === true
    if (!forced && beatsOf(chords[index], beatsPerChord) < beatsPerChord) {
      continue
    }

    const next = chords[(index + 1) % chords.length]
    if (next === chords[index]) continue

    if (!forced && skip?.has(mainIndex)) continue

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
  /** Hợp âm chơi bấy nhiêu phách ở ô nối rồi mới chạy ngón. 0 = chạy ngay. */
  delayBeats?: number
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
     * Ô nào ca sĩ **đang hát**, tính theo vòng hợp âm chính.
     *
     * `'full'` nghĩa là hát kín cả bài. Bỏ trống nghĩa là chưa biết — lúc đó
     * `breaths` và mật độ quyết định như cũ.
     *
     * Khác `breaths` ở chỗ nhìn ngược: `breaths` đánh dấu chỗ **hết câu hát**,
     * còn đây đánh dấu chỗ **giọng đang vang**. Chỗ giọng đang vang thì cây đàn
     * im, vì câu lót vốn để lấp khoảng trống chứ không phải để chen vào giọng.
     */
    vocal?: 'full' | ReadonlySet<number>
    /**
     * Các hợp âm là **mốc chuyển đoạn**, kèm cách chơi ô nối của từng chỗ.
     *
     * Chỗ này câu fill đổi hình hẳn — xem ghi chú trong thân hàm.
     */
    sectionEnds?: ReadonlyMap<number, TransitionRun>
    /**
     * Lượt phát thứ mấy, để câu fill không lặp y nguyên giữa các lượt.
     *
     * Cùng lý do với đoạn giang tấu: nghe một bài hai lần mà câu chêm giống
     * hệt nhau thì lộ ra ngay là máy đánh. Lượt chỉ đổi **hướng đi** của câu
     * fill chứ không đổi nốt đích — nốt đích là chỗ hoà âm đòi hỏi, không phải
     * chỗ để biến tấu.
     */
    take?: number
    /** Câu fill lấy từ sổ Licky thay vì đi liền bậc. */
    lickyFills?: boolean
    /** Câu chạy ngón lấy từ sổ Licky thay vì hợp âm rải. */
    lickyRuns?: boolean
    lickyMode?: LickyMode
    /** Hợp âm người dùng tự chêm fill, mật độ không gạt. */
    extraFills?: ReadonlySet<number>
    extraRuns?: ReadonlySet<number>
    /**
     * Hỏi bộ não PianoBrain hình câu lót ở một chỗ, thay cho câu ba nốt đi liền
     * bậc dựng sẵn ở đây.
     *
     * Chỗ chêm vẫn do bên này quyết (`fillPositions`, `breaths`) — não chỉ
     * được hỏi *chơi cái gì*, không được hỏi *chêm ở đâu*. Trả `null` là não
     * không có luật nào khớp, và câu fill cũ của KeyTrain chạy tiếp như thường,
     * nên bật hay tắt cũng không làm hỏng bài.
     */
    brainFill?: (request: {
      chord: ParsedChord
      next: ParsedChord
      chordStartBeat: number
      take?: number
    }) => readonly SoloNote[] | null
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
    take = 0,
    lickyMode = 'clone',
    extraFills,
    extraRuns,
    brainFill,
    vocal,
  } = options

  if (chords.length < 2) return []

  /*
    Hát kín cả bài thì **không lót câu nào**.

    Đây là luật của thầy Kingsley trong kho: ca sĩ hát kín thì chỉ giữ nền, đàn
    không chen. Trả mảng rỗng ngay ở đây chứ không lọc từng chỗ, vì lọc từng chỗ
    thì chỗ chuyển đoạn (`sectionEnds`) vẫn lọt qua — mà chen vào giữa câu hát ở
    chỗ chuyển đoạn cũng là chen.
  */
  if (vocal === 'full') return []

  const tones = key ? scaleTones(key.tonic, key.scale) : new Set<PitchClass>()
  const fillStarts = chordStarts(chords, beatsPerChord)

  const result: SoloNote[] = []

  /** Ô này ca sĩ đang hát, nên đàn không được lót vào. */
  const singingAt = (mainIndex: number): boolean =>
    vocal !== undefined && vocal.has(mainIndex)

  for (const { index, mainIndex } of fillPositions(chords, {
    density,
    skip: skipFills,
    breaths,
    beatsPerChord,
    // Chỗ chuyển đoạn luôn được chêm, mật độ không gạt đi được.
    always: new Set([
      ...(sectionEnds?.keys() ?? []),
      ...(extraFills ?? []),
      ...(extraRuns ?? []),
    ]),
  })) {
    // Biết ca sĩ đang hát ở ô này thì bỏ qua, kể cả chỗ chuyển đoạn.
    if (singingAt(mainIndex)) continue

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
      let total = beatsOf(chords[index], beatsPerChord)
      for (let next = index + 1; next < chords.length; next += 1) {
        if (!chords[next].passing) break
        total += beatsOf(chords[next], beatsPerChord)
      }
      const delay = Math.min(transition.delayBeats ?? 0, Math.max(0, total - 1))
      const rest = Math.min(
        transition.restBeats,
        Math.max(0, total - delay - Math.min(2, total)),
      )
      const runEnd = fillStarts[index] + total - rest
      const runBeats = total - rest - delay
      const fromBeat = fillStarts[index] + delay

      for (const note of arpeggioRun({
        chord: chords[index],
        octaves: transition.octaves,
        endBeat: runEnd,
        maxBeats: runBeats,
        fromBeat,
      })) {
        result.push({ ...note, isGrace: false })
      }

      continue
    }

    const start =
      chordEnd - Math.min(fillBeats, beatsOf(chords[index], beatsPerChord) / 2)

    if (extraRuns?.has(mainIndex)) {
      const runBeats = Math.min(2, beatsOf(chords[index], beatsPerChord))
      result.push(
        ...placeLick({
          chord: chords[index],
          next,
          startBeat: chordEnd - runBeats,
          beats: runBeats,
          take: mainIndex + take,
          mode: lickyMode,
          kind: 'run',
        }),
      )
      continue
    }

    if (extraFills?.has(mainIndex)) {
      result.push(
        ...placeLick({
          chord: chords[index],
          next,
          startBeat: start,
          beats: Math.min(fillBeats, beatsOf(chords[index], beatsPerChord) / 2),
          take: mainIndex + take,
          mode: lickyMode,
          kind: 'fill',
          key,
        }),
      )
      continue
    }

    if (brainFill) {
      const fromBrain = brainFill({
        chord: chords[index],
        next,
        chordStartBeat: fillStarts[index],
        take,
      })
      if (fromBrain) {
        result.push(...fromBrain)
        continue
      }
    }

    /*
      Kết ở **nốt dẫn của hợp âm đang chơi** nếu có, để nó tự giải quyết sang
      hợp âm sau. Không có thì lùi về cách cũ: kết ngay cạnh nốt đặc trưng của
      hợp âm kế tiếp.
    */
    const guide = guideToneInto(chords[index], next)
    const [targetClass] = targetPitchClasses(next, 1)
    let landClass = guide ?? targetClass
    if (tones.size > 0 && !tones.has(landClass)) {
      const allowed = [...tones]
      landClass = allowed.reduce((best, tone) =>
        Math.abs(tone - landClass) < Math.abs(best - landClass) ? tone : best,
      )
    }
    const landing = nearestNote(landClass, MELODY_LOW + 7)

    /*
      Ba nốt là đủ để nghe ra hướng đi mà không lấn sang phần hát.
    */
    /*
      Hướng đi đổi theo **lượt phát và vị trí chỗ chêm**, khi người dùng để
      `mixed`. Chọn hướng cố định thì mọi câu fill trong bài đều đi cùng chiều
      và mọi lượt phát giống hệt nhau.
    */
    const approachFrom =
      direction === 'above'
        ? 'down'
        : direction === 'below'
          ? 'up'
          : ((mainIndex + take) * 5 + 3) % 2 === 0
            ? 'up'
            : 'down'
    /*
      Số nốt dẫn vào nốt đích: 2 hoặc 3, tức câu fill dài 3 hoặc 4 nốt. Dài hơn
      là lấn vào chỗ người hát — xem `guideToneFill.test.ts`.

      Bản trước viết `((mainIndex + take) * 3) % 3`: nhân ba rồi chia lấy dư ba
      thì **luôn bằng không**, nên số nốt đứng im ở 2 và lượt phát chỉ đổi được
      mỗi hướng đi. Bốn lượt liên tiếp vì thế chỉ ra hai câu khác nhau.

      Đổi **hai lượt một lần**, chứ không đổi mỗi lượt: hướng đi vốn đã lật theo
      chẵn lẻ của lượt, nên cho số nốt lật cùng nhịp thì hai thứ dính nhau và
      vẫn chỉ ra hai hình. Lệch nhịp thì bốn lượt ra đủ bốn hình.
    */
    const steps = 2 + (Math.floor((mainIndex + take) / 2) % 2)
    const line: MidiNote[] = [landing]
    for (let step = 0; step < steps; step += 1) {
      line.unshift(stepInScale(line[0], approachFrom === 'up' ? 'down' : 'up', tones))
    }

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
    graceDensity = 'none',
    direction = 'mixed',
    noteSource = 'chordTone',
    chordsPerPhrase = 2,
    take = 0,
    endWithRun = false,
    interlude = true,
    range,
    storeScale,
    feel = 'straight',
  } = options

  const soloLow = range?.low ?? SOLO_LOW
  const soloHigh = range?.high ?? SOLO_HIGH
  const soloCeiling = range?.high ?? SOLO_CEILING

  if (chords.length === 0) return []

  const tones = new Set<PitchClass>()
  for (const chord of chords) {
    if (chord.passing) continue
    /*
      Vùng nốt chung của cả đoạn cũng phải theo bậc ưu tiên giang tấu, vì nó là
      bộ lọc cuối cùng: để `chordMaterial` dựng vùng này thì bậc chín lọt vào từ
      cửa sau, dù từng ô đã lọc sạch.
    */
    const source =
      interlude && noteSource === 'storeScale'
        ? /*
             Vùng chung phải mở theo đúng gam đang dùng.

             Nó là bộ lọc CUỐI: dựng nó bằng nốt hợp âm rồi mới cắt gam jazz qua
             nó thì đúng những nốt làm nên chất jazz — Fa thăng của Lydian, bậc
             chín giáng của gam altered — bị chặn ở cửa sau, và câu chạy quay về
             y hệt bản nốt hợp âm.
          */
          (storeScale?.(chord) ?? chordTonesStrict(chord))
        : interlude && noteSource === 'chordTone'
          ? chordTonesStrict(chord)
          : chordMaterial(chord)
    for (const tone of source) tones.add(tone)
  }
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
  const bossaPack = interlude && feel === 'bossa'
  const notesPerBeat =
    (density === 'sparse'
      ? 0.8
      : density === 'dense'
        ? interlude
          ? 1.5
          : 2.2
        : 1.4) + (bossaPack ? 0.6 : 0)

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
  let from: MidiNote = Math.min(
    soloCeiling,
    soloLow + 8 + ((Math.imul(round + 3, 2654435761) >>> 0) % 17),
  ) as MidiNote
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
    const low = soloLow + lift
    const high = Math.min(soloCeiling, soloHigh + lift)

    /*
      Nghỉ lấy hơi ở cuối mỗi câu. `pianoimprovnotes.md` mục 4 nói thẳng: cần
      khoảng nghỉ để lấy hơi giữa các câu.
    */
    const playBeats =
      isPhraseEnd && !interlude
        ? Math.max(chordBeats / 2, chordBeats - REST_BEATS)
        : chordBeats

    if (endWithRun && index === spans.length - 1 && interlude) {
      const room = Math.max(1.5, playBeats)
      const run = arpeggioRun({
        chord,
        octaves: 2,
        endBeat: start + room,
        maxBeats: room,
        fromBeat: start,
        noteChoices: [0.25, 0.125],
        rightHandOnly: true,
      })
      const cap = Math.max(8, Math.min(14, Math.round(room * 4)))
      const line = run.length > cap ? run.slice(0, cap) : run
      for (const note of line) {
        let pitch = note.note
        while (pitch > soloCeiling) pitch -= 12
        while (pitch < soloLow) pitch += 12
        result.push({
          note: pitch as MidiNote,
          startBeat: note.startBeat,
          durationBeats: note.durationBeats,
          isGrace: false,
          hand: 'right',
        })
      }
      positionInPhrase += 1
      continue
    }

    if (endWithRun && index === spans.length - 1 && !interlude) {
      /*
        Dựng câu chạy NGAY TRONG khung tầm, đừng dựng ra rồi gập lại.

        `octaveRun` vốn dựng từ quãng tám thứ ba lên hai quãng tám. Bước ép tầm
        ở cuối hàm này rồi kéo mọi nốt lọt ra ngoài về quãng tám gần nhất — nên
        một câu leo đều C4 lên C6 ra thành D5 E5 rồi tụt xuống E4 leo tiếp, và
        tới G5 lại rơi ngược về A4. Nghe như câu bị gãy hai chỗ, mà không tầng
        nào cố ý gãy nó.

        Trừ hai nửa cung mỗi đầu cho khớp `bounds` phía dưới: khớp rồi thì bước
        ép tầm không còn gì để sửa, và câu giữ nguyên đường leo.
      */
      for (const note of octaveRun({
        chord,
        startBeat: start,
        beats: chordBeats,
        scale: tones,
        range: { low: (soloLow + 2) as MidiNote, high: (soloCeiling - 2) as MidiNote },
      })) {
        result.push({
          note: note.note,
          startBeat: note.startBeat,
          durationBeats: note.durationBeats,
          isGrace: false,
          hand: note.hand,
        })
      }
      positionInPhrase += 1
      continue
    }

    if (positionInPhrase === 0 && index !== spans.length - 1) {
      /*
        Ô mở câu **luân phiên hai ngón**, không phải lúc nào cũng quét.

        Trước đây chỗ này gọi thẳng cú quét, bỏ qua hẳn bộ chọn mẫu — nên ô 1 và
        ô 3 của mọi vòng giang tấu đều ra cùng một ngón, nghe hai lần một câu.
        Ô 1 quét ngũ cung (Cà Pháo, Hồng Kông 1 ô 51-52); ô 3 kẹp nửa cung, tức
        chạm nốt trên rồi nốt dưới mới vào nốt đích — ngón chromatic nghe rõ
        nhất mà nốt đích vẫn là nốt hợp âm nên hoà âm không lung lay.
      */
      /*
        Bốn ngón mở câu thay phiên nhau, không phải hai.

        Bản trước viết cứng đúng hai mẫu — cú quét và cụm bao vây — nên hai mẫu
        thêm sau này **không bao giờ chạy ở chỗ mở câu**: `chooseLick` chỉ được
        gọi tới ở ô kết câu, mà ô kết câu thì luôn lấy mẫu vai `ending`. Đo ra
        mới thấy: `scale-run` và `bebop-pair` nằm trong vòng xoay mà không lần
        nào được chọn.

        Xoay theo **số cặp ô cộng số lượt**. Chỉ ô chẵn đi vào nhánh này, nên
        lấy `index % 4` thì mãi mãi chỉ ra hai giá trị; và một vòng giang tấu
        bốn ô chỉ có hai ô mở câu, nên xoay theo riêng số ô thì hai mẫu mới vẫn
        không tới lượt. Cộng số lượt vào thì lượt sau đổi ngón — đúng cách một
        người đệm thật chơi lại cùng một vòng.

        Lượt đầu giữ nguyên thứ tự cũ (quét rồi bao vây) để đoạn giang tấu nghe
        lần đầu vẫn đúng như đã nghe duyệt.

        Mẫu nào tự rút lui — `bebop-pair` trên hợp âm không phải át, `scale-run`
        trên bậc thang nốt hợp âm — thì lùi về cú quét, rồi mới tới câu rải.
      */
      const openerOrder = [
        'sweep',
        'sweep',
        'enclosure',
        'sweep',
        'scale-run',
        'bebop-pair',
      ] as const
      const wanted =
        interlude && index === 0
          ? 'sweep'
          : openerOrder[(Math.floor(index / 2) + round) % openerOrder.length]
      const context = {
        chord,
        next: spans[index + 1]?.chord ?? null,
        startBeat: start,
        beats: playBeats,
        from,
        low,
        high,
        scaleTones: tones,
        previousShape,
        notesPerBeat: interlude && index === 0 ? (bossaPack ? 8 : 6) : notesPerBeat,
        material: materialFor(chord, noteSource, null, [], tones, interlude, storeScale),
      }
      const swept =
        [getLick(wanted), getLick('sweep')]
          .map((lick) => lick?.build(context))
          .find((built) => built && built.notes.length > 0) ?? undefined
      const line =
        swept && swept.notes.length > 0
          ? swept.notes.map((note) => ({
              note: note.note,
              startBeat: note.startBeat,
              durationBeats: note.durationBeats,
              isGrace: false,
              ...(note.soft ? { ornament: true } : {}),
              /*
                Câu solo **luôn là tay phải**, kể cả nốt thấp.

                Bản trước chia tay theo cao độ: nốt dưới Đô quãng tám 4 bị dán
                nhãn tay trái. Trên piano roll thành mấy nốt xanh nằm lẫn giữa
                câu solo hồng, mà tay trái lúc ấy đang bận giữ bass — người xem
                tưởng phải bắt chéo tay, còn thật ra đó vẫn là một tuyến giai
                điệu của tay phải.
              */
              hand: 'right' as const,
            }))
          : arpeggioRun({
              chord,
              octaves: 2,
              endBeat: start + playBeats,
              maxBeats: playBeats,
              fromBeat: start,
            }).map((note) => ({
              note: note.note,
              startBeat: note.startBeat,
              durationBeats: note.durationBeats,
              isGrace: false,
              hand: note.hand,
            }))
      result.push(...line)
      positionInPhrase += 1
      continue
    }

    if (positionInPhrase === 2 && index !== spans.length - 1) {
      /*
        Ô 3 giang tấu: chạy chromatic hoặc tự do, kín ô.
        Chỗ khác: vài nốt rồi nghỉ.
      */
      if (interlude) {
        const pick = round % 2 === 0 ? 'enclosure' : 'scale-run'
        const context = {
          chord,
          next: spans[index + 1]?.chord ?? null,
          startBeat: start,
          beats: playBeats,
          from,
          low,
          high,
          scaleTones: tones,
          previousShape,
          notesPerBeat: bossaPack ? 7 : 5,
          material: materialFor(
            chord,
            noteSource,
            null,
            [],
            tones,
            interlude,
            storeScale,
          ),
        }
        const built =
          [getLick(pick), getLick('scale-run'), getLick('enclosure')]
            .map((lick) => lick?.build(context))
            .find((line) => line && line.notes.length >= 5) ?? undefined
        const line =
          built && built.notes.length >= 5
            ? built.notes.map((note) => ({
                note: note.note,
                startBeat: note.startBeat,
                durationBeats: note.durationBeats,
                isGrace: false,
                hand: 'right' as const,
              }))
            : placeLick({
                chord,
                next: spans[index + 1]?.chord,
                startBeat: start,
                beats: playBeats,
                take: round + index + 5,
                kind: 'run',
              }).map((note) => ({
                note: note.note,
                startBeat: note.startBeat,
                durationBeats: note.durationBeats,
                isGrace: false,
                hand: 'right' as const,
              }))
        result.push(...line)
        if (line.length > 0) from = line[line.length - 1]!.note
        positionInPhrase += 1
        continue
      }
      const runBeats = Math.min(2, playBeats)
      for (const note of placeLick({
        chord,
        next: spans[index + 1]?.chord,
        startBeat: start,
        beats: runBeats,
        take: round + index + 5,
        kind: 'fill',
      })) {
        result.push({
          note: note.note,
          startBeat: note.startBeat,
          durationBeats: note.durationBeats,
          isGrace: false,
          hand: 'right',
        })
      }
      positionInPhrase += 1
      continue
    }

    const lick = chooseLick({
      chordIndex: index,
      phrase,
      positionInPhrase,
      isPhraseEnd,
      playBeats,
      hasMotif: previousShape.length > 0,
      density,
      take: round,
      resolving: resolvesUpFourth(chord, spans[index + 1]?.chord ?? null),
      interlude,
    })

    const context = {
      chord,
      next: spans[index + 1]?.chord ?? null,
      startBeat: start,
      beats: playBeats,
      from,
      low,
      high,
      scaleTones: tones,
      previousShape,
      notesPerBeat: interlude && isPhraseEnd ? 0.7 : notesPerBeat,
      material: materialFor(
        chord,
        noteSource,
        null,
        [
          spans[index + 1]?.chord,
          spans[index - 1]?.chord,
        ].filter((entry): entry is ParsedChord => entry !== undefined),
        tones,
        interlude,
        storeScale,
      ),
    }

    /*
      Mẫu trả về rỗng thì **lùi về mẫu nền tảng**, đừng để trống ô nhịp.

      Chỉ mẫu nghỉ mới được phép im. Các mẫu khác có điều kiện riêng — `echo`
      cần một mô-típ đủ dài để nhắc lại chẳng hạn — và khi điều kiện không thoả
      thì chúng trả về rỗng. Bản trước bỏ qua luôn ô đó, nên ở mật độ thưa có
      lúc **hai trên bốn ô nhịp im lặng**: một ô nghỉ đúng ý, một ô im vì hỏng.
    */
    let built = lick.build(context)
    if (built.notes.length === 0 && !lick.roles.includes('rest')) {
      built = fallbackLick().build(context)
    }
    const safe = ladderOf(context.material, low, high)
    if (safe.length > 0) {
      built = {
        ...built,
        notes: built.notes.map((note) => ({
          ...note,
          note: safe[nearestStep(safe, note.note)] ?? note.note,
          soft: false,
        })),
      }
    }
    if (positionInPhrase === 2 && !isPhraseEnd && built.notes.length > 0) {
      const slot = playBeats / built.notes.length
      built = {
        ...built,
        notes: built.notes.map((note, index) => ({
          ...note,
          startBeat: start + index * slot,
          durationBeats: slot * 0.85,
        })),
      }
    }

    /*
      Đếm vị trí **trước** khi có cơ hội bỏ qua ô nhịp này.

      Mẫu nghỉ cố ý trả về rỗng, mà bản trước nhảy thẳng tới hợp âm sau bằng
      `continue` — nên dòng tăng vị trí không chạy, hợp âm sau lại rơi đúng vị
      trí "nghỉ" và cũng im nốt. Ở mật độ thưa nó kẹt luôn hai ô nhịp liền:
      một ô nghỉ đúng ý, một ô im vì bộ đếm đứng yên.
    */
    positionInPhrase += 1

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
  }

  const lockedFrom = endWithRun
    ? (spans[spans.length - 1]?.start ?? Number.POSITIVE_INFINITY)
    : Number.POSITIVE_INFINITY
  const locked = (beat: number) => beat + 1e-6 >= lockedFrom

  const ordered = result.sort((a, b) => a.startBeat - b.startBeat)
  const mains = ordered.filter((note) => !note.isGrace)
  for (let index = 1; index < mains.length; index += 1) {
    const prev = mains[index - 1]!
    const curr = mains[index]!
    if (locked(curr.startBeat)) continue
    while (curr.note - prev.note > 14) curr.note = (curr.note - 12) as MidiNote
    while (prev.note - curr.note > 14) curr.note = (curr.note + 12) as MidiNote
  }

  /*
    Lượt sau dịch cả câu lên mấy bậc, để nghe lại không ra y hệt.

    Dịch trên **bậc thang của chính hợp âm đang vang**, không phải trên bậc thang
    gộp của cả đoạn. Bản trước gộp, và gộp là hỏng: vùng chung của vòng
    `C Am F G` chính là cả gam Đô trưởng, nên dịch xong thì ô hợp âm Đô ra nốt
    Fa và Si — hai nốt không nằm trong ngũ cung Đô mà thầy dạy. Gam chọn cho
    từng hợp âm bị xoá sạch ở bước cuối, sau khi mọi tầng trên đã chọn đúng.

    Đo trên vòng `C Am F G`, lượt 2: nốt chính ô 1 ra `C E F G B` trong khi ngũ
    cung là `C D E G A`.
  */
  if (round > 0) {
    for (const note of ordered) {
      if (locked(note.startBeat)) continue

      const span = spans.find(
        (entry) =>
          note.startBeat + 1e-6 >= entry.start && note.startBeat < entry.start + entry.beats,
      )
      const pool = span
        ? materialFor(span.chord, noteSource, null, [], tones, interlude, storeScale)
        : [...tones]
      const ladder = ladderOf(pool.length > 0 ? pool : [...tones], soloLow, soloCeiling)
      if (ladder.length <= 1) continue

      const at = nearestStep(ladder, note.note)
      note.note = ladder[(at + round) % ladder.length]!
    }
  }

  if (tones.size > 0) {
    for (const note of ordered) {
      if (locked(note.startBeat)) continue
      /*
        Nốt tô điểm được giữ nguyên, kể cả khi nó nằm ngoài hoà âm.

        Mẫu kẹp nửa cung và mẫu nốt dẫn **cố ý** chạm nốt trên và nốt dưới rồi
        mới vào nốt chính — đó là cả ngón đàn. Ép chúng về nốt hợp âm gần nhất
        thì hai nốt kẹp biến thành chính nốt đích, ngón bao vây mất sạch, và cả
        đoạn giang tấu không còn một nốt nửa cung nào. Đo trên tám lượt trước
        khi sửa: 232 nốt, 0 nốt ngoài giọng.

        Chúng mang cờ `isGrace` vì mẫu câu đánh dấu `soft` — nốt mềm, đi kèm
        nốt chính chứ không phải một bậc của câu nhạc.
      */
      if (note.isGrace || note.ornament) continue
      const pitch = ((note.note % 12) + 12) % 12 as PitchClass
      if (tones.has(pitch)) continue
      const span = spans.find(
        (entry) =>
          note.startBeat + 1e-6 >= entry.start &&
          note.startBeat < entry.start + entry.beats,
      )
      const pool = span
        ? materialFor(span.chord, noteSource, null, [], tones, interlude, storeScale).filter((tone) =>
            tones.has(tone),
          )
        : [...tones]
      /*
        Dùng tầm bên gọi đưa vào, không phải hằng số mặc định.

        Chỗ này là câu chạy cuối câu nhạc. Bỏ sót nó thì hạ trần cho điệu ballad
        xong câu chạy vẫn leo lên quãng tám thứ sáu — đúng chỗ người dùng nghe
        thấy phi thực tế.
      */
      const ladder = ladderOf(pool.length > 0 ? pool : [...tones], soloLow, soloCeiling)
      note.note = ladder[nearestStep(ladder, note.note)] ?? note.note
    }
  }


  /*
    Nối hơi qua chỗ giáp ô — và hạ cánh vào nốt hợp âm của ô mới.

    Mỗi ô hợp âm tự chọn mẫu câu và tự dựng nốt trong phạm vi ô mình, nên chỗ
    nối hai ô là chỗ hướng đi bị đặt lại. Đo trước khi sửa: câu bẻ hướng ngay
    vạch nhịp 55 %, trong khi ở giữa ô chỉ 30 % — vạch nhịp gần gấp đôi chỗ khác
    về khả năng làm câu quay đầu. Người đàn thật không thế: câu bebop chạy lên
    năm sáu nốt, vắt qua vạch nhịp, rơi vào nốt hợp âm của ô sau rồi mới quay.

    Sửa ở đây chứ không sửa trong từng mẫu câu. Mẫu kẹp nửa cung và mẫu bao vây
    **cố ý** quay đầu — chúng chạm nốt trên rồi nốt dưới rồi mới vào nốt đích,
    đó là cả ngón đàn. Ép hướng vào lúc dựng thì mất sạch ngón ấy. Chỗ giáp ô
    thì khác: không mẫu nào cố ý bẻ hướng ở đó, nó bẻ chỉ vì mẫu sau không biết
    mẫu trước vừa đi đường nào.

    Hai nốt bị động tới, không hơn: nốt rơi đúng phách đầu ô sau, và nốt liền
    sau nó. Số nốt không đổi, chỗ nghỉ không đổi — chỉ cao độ đổi.
  */
  {
    const CHAN_BUOC = 4
    const QUANG_TAM = 12
    const seamNotes = ordered.filter((note) => !note.isGrace && !note.ornament)

    /*
      Bắt đầu từ ô THỨ HAI. Ô đầu bài không có chỗ giáp nào để nối, nên động vào
      nó là thừa — và không phải vô hại: ô mở câu có hình riêng của nó (rải lên
      rồi gam xuống), dịch cả cụm trên bậc thang gam thì hình rải bị san phẳng.
    */
    for (let index = 1; index < spans.length; index += 1) {
      const { chord, start, beats } = spans[index]
      if (locked(start)) continue

      const at = seamNotes.findIndex((note) => note.startBeat + 1e-6 >= start)
      if (at < 0 || at >= seamNotes.length) continue

      const dau = seamNotes[at]!
      if (dau.startBeat >= start + beats) continue

      /*
        Hướng để nối tiếp lấy từ hai nốt cuối ô trước. Ô đầu bài thì chưa có gì
        để nối, và đuôi ô trước lặp lại một nốt thì cũng không nói lên hướng nào
        — hai trường hợp ấy vẫn phải hạ cánh, chỉ là hạ cánh không kèm hướng.
      */
      const huong = at >= 2 ? Math.sign(seamNotes[at - 1]!.note - seamNotes[at - 2]!.note) : 0
      const moc = at >= 1 ? seamNotes[at - 1]!.note : dau.note

      /*
        Không có hướng quá khứ thì lấy hướng tương lai.

        Đuôi ô trước kết bằng nốt lặp thì không nói lên hướng nào. Nhưng vẫn hạ
        cánh được — nhìn xem câu sắp tới đi lên hay đi xuống, rồi đặt nốt hạ cánh
        **lùi về phía ngược lại**, để câu ấy còn đường mà chạy. Đặt bừa một nốt
        hợp âm gần nhất thì nốt hạ cánh đứng chắn ngay trước mặt câu sau: đo được
        hạ cánh lên 83 % mà câu bẻ hướng ở vạch nhịp tăng từ 20 % lên 37 %.
      */
      const sapToi = seamNotes[at + 1]
      const huongSau =
        sapToi && sapToi.startBeat < start + beats ? Math.sign(sapToi.note - dau.note) : 0
      const chieuTim = huong !== 0 ? huong : -huongSau
      if (chieuTim === 0) continue

      const pool = materialFor(chord, noteSource, null, [], tones, interlude, storeScale)
      const ladder = ladderOf(pool.length > 0 ? pool : [...tones], soloLow, soloCeiling)
      if (ladder.length <= 1) continue

      /*
        Nốt hạ cánh: đi tiếp theo hướng cũ tới nốt hợp âm đầu tiên của ô MỚI.

        Giới hạn bốn bậc thang. Xa hơn thì không còn là nối hơi mà là nhảy quãng,
        và cú nhảy ấy phá luôn thế ngón mà `assignFingers` vừa xếp.

        Xếp sẵn nhiều ứng viên chứ không chốt một cái: cú dịch phải kéo được cả ô
        đi theo, mà không phải chỗ nào cũng còn đủ bậc thang để kéo. Ứng viên đầu
        không kê được thì thử cái sau, thay vì bỏ luôn cả ô.
      */
      const chordTones = new Set<number>(chordToneNames(chord))
      const from = nearestStep(ladder, moc)
      const ungVien: MidiNote[] = []
      const gom = (chieu: number, chan: number) => {
        if (chieu === 0) return
        for (let step = 1; step <= chan; step += 1) {
          const to = from + chieu * step
          if (to < 0 || to >= ladder.length) return
          const pitch = ((ladder[to]! % 12) + 12) % 12
          if (chordTones.has(pitch) && !ungVien.includes(ladder[to]!)) ungVien.push(ladder[to]!)
        }
      }
      /*
        Đang có đà thì KHÔNG được quay phía kia.

        Ứng viên phía ngược chỉ dành cho chỗ vốn không có đà — đuôi ô trước lặp
        nốt, chẳng có hơi nào để giữ. Cho nó dùng cả ở chỗ đang có đà thì hạ cánh
        đẹp lên nhưng câu bẻ hướng ngay vạch nhịp vọt lên 50 %: máy chọn cú quay
        đầu chỉ vì phía ấy tình cờ có nốt hợp âm gần hơn. Đó đúng là thứ cần chữa.
      */
      gom(chieuTim, CHAN_BUOC)
      if (huong === 0) gom(-chieuTim, 2)
      if (ungVien.length === 0) continue

      /*
        Thử cú dịch NHẸ NHẤT trước.

        Ứng viên vốn xếp theo khoảng cách tới nốt mốc — tức theo chỗ hạ cánh nghe
        thuận nhất. Nhưng thứ quyết định cú dịch có kê được hay không là **quãng
        đường cả ô phải đi**, mà quãng ấy tính từ nốt đầu ô chứ không từ nốt mốc.
        Xếp theo khoảng cách tới mốc thì 37 trên 63 cú dịch bị loại vì đuôi ô
        trượt khỏi bậc thang — loại oan, vì một ứng viên khác cùng hướng chỉ cần
        dịch một hai bậc là vừa.
      */
      const goc = nearestStep(ladder, dau.note)
      ungVien.sort(
        (a, b) =>
          Math.abs(nearestStep(ladder, a) - goc) - Math.abs(nearestStep(ladder, b) - goc),
      )

      for (const landing of ungVien) {
        const buoc = nearestStep(ladder, landing) - nearestStep(ladder, dau.note)
        if (buoc === 0) break

        /*
          Thử trước, nhận sau — và nhận thì nhận **cả cụm**.

          Dịch nửa cụm là tự tay bẻ hình mẫu câu. Nên dựng cả bộ nốt mới trước,
          kiểm hai đầu nối, rồi mới ghi đè.
        */
        const bac: number[] = []
        let tron = true
        for (let k = at; k < seamNotes.length; k += 1) {
          const note = seamNotes[k]!
          if (note.startBeat >= start + beats) break
          if (locked(note.startBeat)) {
            tron = false
            break
          }
          bac.push(nearestStep(ladder, note.note))
        }
        if (!tron || bac.length === 0) continue

        /*
          Cả cụm dịch **cùng một quãng đường**, và quãng ấy bị bậc thang bó lại.

          Bản trước để nốt nào trượt khỏi thang thì đứng yên tại chỗ. Nửa cụm dịch
          nửa cụm đứng là tự tay bẻ hình mẫu câu, và nó đẻ ra đúng cú nhảy 15 nửa
          cung đo được ở tầm ballad — tầm ấy chỉ rộng 22 nửa cung nên thang ngắn,
          trượt thang là chuyện thường.

          Bó biên độ lại thì hình giữ nguyên từng bước một; chỉ có điều nốt hạ
          cánh có thể không tới được đúng nốt hợp âm đã chọn. Ứng viên sau lo
          việc ấy — còn hình mẫu câu thì không ứng viên nào cứu lại được.
        */
        /*
          Nốt nào trượt khỏi bậc thang thì đứng yên — nhưng chỉ khi cụm vẫn đàn
          được. Tầm ballad chỉ rộng 22 nửa cung nên thang ngắn, trượt thang là
          chuyện thường; nửa cụm dịch nửa cụm đứng thì hình mẫu câu méo đi và
          giữa cụm mọc ra một bước nhảy. Nên kiểm ngay dưới đây, méo quá thì thôi.
        */
        const moi = bac.map((b, i) => {
          const to = b + buoc
          return to < 0 || to >= ladder.length ? seamNotes[at + i]!.note : ladder[to]!
        })

        /*
          Không bước nào trong cụm mới, kể cả hai đầu nối, được vượt một quãng
          tám. Đây là luật của bàn tay, không phải của điệu nào — `playableOutput`
          và `interludeSoloPlayable` đều canh nó.
        */
        let nhay = Math.abs(moi[0]! - seamNotes[at - 1]!.note) > QUANG_TAM
        for (let i = 1; i < moi.length && !nhay; i += 1) {
          nhay = Math.abs(moi[i]! - moi[i - 1]!) > QUANG_TAM
        }
        if (nhay) continue

        /*
          Đầu ra kiểm luôn, không chờ ô sau.

          Bản trước chỉ kiểm khi nốt kế tiếp bị khoá, tin rằng ô sau đi qua đây
          rồi sẽ tự nhích lại cho vừa. Nó không phải lúc nào cũng nhích được —
          bậc thang của ô sau có thể đã cạn — và chỗ ấy để lại một bước 15 nửa
          cung. Cụm nào tạo ra bước nhảy thì không nhận, dù nhận được thì hạ cánh
          đẹp hơn: tay không với tới thì hạ cánh đẹp cũng vô nghĩa.
        */
        const keTiep = seamNotes[at + moi.length]
        if (keTiep && Math.abs(keTiep.note - moi[moi.length - 1]!) > QUANG_TAM) continue

        for (let k = 0; k < moi.length; k += 1) seamNotes[at + k]!.note = moi[k]!
        break
      }
    }

    /*
      Lưới an toàn: không bước nào quá một quãng tám.

      Dịch cả cụm giữ được hình bên trong ô nhưng có thể giãn chỗ nối ra quá tầm
      tay. Kéo bằng quãng tám nên lớp cao độ không đổi — nốt hạ cánh vẫn đúng là
      nốt hợp âm nó vừa chọn. Kéo nốt nào **dời được**: nốt khoá thì phải kéo nốt
      bên kia.
    */
    for (let k = 1; k < seamNotes.length; k += 1) {
      const truoc = seamNotes[k - 1]!
      const nay = seamNotes[k]!
      for (let lan = 0; lan < 3 && Math.abs(nay.note - truoc.note) > QUANG_TAM; lan += 1) {
        const len = nay.note < truoc.note
        const dich = (note: SoloNote, buoc: number) => {
          const to = (note.note + buoc) as MidiNote
          if (to < soloLow || to > soloCeiling) return false
          note.note = to
          return true
        }
        const xong = locked(nay.startBeat)
          ? dich(truoc, len ? -QUANG_TAM : QUANG_TAM)
          : dich(nay, len ? QUANG_TAM : -QUANG_TAM)
        if (!xong) break
      }
    }

  }

  /*
    Gom về **một dòng giai điệu** rồi mới thêm nốt láy.

    Hai đường dựng nốt — câu nhạc thường và câu chạy cuối câu — có thể cùng đặt
    nốt vào một mốc phách. Trên piano roll thành hai nốt chồng cách nhau một
    quãng tám: tai nghe tiếng đúp, tay không biết bấm nốt nào.

    Làm trước khi thêm nốt láy, vì nốt láy tính theo nốt chính; sửa nốt chính
    sau thì nốt láy trỏ sai chỗ.
  */
  const single: SoloNote[] = []
  let previous: MidiNote | null = null
  for (const note of [...ordered].sort((a, b) => a.startBeat - b.startBeat)) {
    const clash = single.find(
      (kept) => Math.abs(kept.startBeat - note.startBeat) < 1e-6,
    )
    if (!clash) {
      single.push(note)
      previous = note.note
      continue
    }
    // Giữ nốt gần nốt vừa chơi nhất, để câu đi liền mạch.
    if (previous !== null && Math.abs(note.note - previous) < Math.abs(clash.note - previous)) {
      single[single.indexOf(clash)] = note
    }
  }

  /*
    Kéo nốt về trong tầm, và khép lại bước nhảy quá một quãng tám.

    Chỉ động vào nốt **thật sự cần**: ra ngoài tầm, hoặc cách nốt trước hơn một
    quãng tám. Kéo mọi nốt về quãng tám gần nhất thì đường giai điệu bị ép
    phẳng, đo ra ba nốt giống hệt nhau liên tiếp — câu đứng im.

    Bước gộp ở trên bỏ bớt nốt, mà nốt bị bỏ có khi đang làm bậc bắc cầu; nên
    lượt này chạy cả khi bên gọi không nói tầm.
  */
  const asked = range ?? { low: soloLow, high: soloCeiling }
  /*
    Chừa hai nửa cung ở hai đầu cho nốt láy.

    Nốt láy được thêm **sau** bước này và nằm cách nốt chính một bậc. Ép nốt
    chính sát trần thì nốt láy của nó vọt ra ngoài tầm, mà dời riêng nốt láy lại
    hỏng quan hệ một bậc với nốt chính.
  */
  const bounds = { low: asked.low + 2, high: asked.high - 2 }
  let anchor: MidiNote | null = null
  const bounded = single.map((note) => {
    if (locked(note.startBeat)) {
      anchor = note.note
      return note
    }
    const outside = note.note < bounds.low || note.note > bounds.high
    const leap = anchor !== null && Math.abs(note.note - anchor) > 12
    if (!outside && !leap) {
      anchor = note.note
      return note
    }

    let best: number | null = null
    for (let pitch = bounds.low; pitch <= bounds.high; pitch += 1) {
      if (((pitch - note.note) % 12 + 12) % 12 !== 0) continue
      const from = anchor ?? note.note
      if (best === null || Math.abs(pitch - from) < Math.abs(best - from)) best = pitch
    }
    if (best === null) {
      anchor = note.note
      return note
    }
    anchor = best as MidiNote
    return best === note.note ? note : { ...note, note: best as MidiNote }
  })


  /*
    Không đánh **cùng một nốt hai lần liền nhau**.

    Cú quét lặp một ô bốn nốt lên qua từng quãng tám; tới trần thì tầng cuối bị
    cắt và nốt còn lại trùng đúng nốt vừa chơi — nghe thành gõ hai lần một nốt
    chứ không phải câu chạy. Đẩy nốt sau sang bậc kế tiếp trong cùng bộ nốt của
    hợp âm, nên hoà âm không đổi, chỉ hết chỗ đứng im.

    Nốt tô điểm **có tính**. Nó vốn nằm sát nốt chính, nhưng "sát" nghĩa là kề
    một bậc chứ không phải trùng: một nốt tô điểm cùng cao độ với nốt chính thì
    không tô điểm gì cả, nó chỉ là một lần gõ lại. Bản trước miễn hẳn cho nó,
    nên chuỗi *nốt chính - tô điểm - nốt chính* cùng cao độ lọt lưới trọn vẹn.
  */
  const ordered2 = [...bounded].sort((a, b) => a.startBeat - b.startBeat)
  let lastPlayed: SoloNote | null = null
  const noRepeat = ordered2.map((note) => {
    /*
      So với nốt đã **sửa xong**, không phải nốt gốc.

      Ba nốt trùng liên tiếp thì cách cũ sửa nốt thứ hai rồi lại đem nốt thứ ba
      so với nốt thứ hai *chưa sửa* — hết một cặp, còn nguyên một cặp.
    */
    if (note.isGrace) return note
    const before = lastPlayed
    lastPlayed = note
    if (!before || before.note !== note.note) return note

    /*
      Đẩy sang bậc kế tiếp **trong đúng chất liệu của hợp âm đang vang**, không
      phải trong bộ nốt chung của cả vòng. Lấy bộ chung thì nốt nhảy sang một
      hợp âm khác — hết lặp nhưng lạc hoà âm, đổi một lỗi lấy một lỗi.
    */
    const span = spans.find(
      (entry) =>
        note.startBeat + 1e-6 >= entry.start &&
        note.startBeat < entry.start + entry.beats,
    )
    if (!span) return note

    const pool = materialFor(span.chord, noteSource, null, [], tones, interlude, storeScale)
    const ladder = ladderOf(pool, bounds.low, bounds.high)
    const step = ladder.indexOf(note.note)
    const next = step >= 0 ? ladder[step + 1] ?? ladder[step - 1] : undefined
    if (next === undefined) return note
    const moved = { ...note, note: next }
    lastPlayed = moved
    return moved
  })

  /*
    Sửa giai điệu xong **rồi mới tô điểm**, không phải ngược lại.

    Nốt láy được gắn theo nốt chính và cách nốt chính đúng một bậc trong giọng.
    Tô điểm trước rồi mới đẩy nốt chính sang bậc khác thì nốt láy ở lại chỗ cũ —
    nó không còn là nốt láy của ai nữa.
  */
  const free = noRepeat.filter((note) => !locked(note.startBeat))
  const run = noRepeat.filter((note) => locked(note.startBeat))
  const withGrace = [
    ...addGraceNotes(free, {
      direction,
      density: interlude ? 'none' : graceDensity,
      tones,
    }),
    ...run,
  ]

  /*
    Feel áp **sau khi cao độ đã chốt, trước khi gán ngón**: nó chỉ dời chỗ nốt
    rơi, mà số ngón thì đọc theo thứ tự thời gian — gán trước rồi mới dời là số
    ngón kể sai thứ tự.
  */
  const lined = applyFeel(capStack(withGrace), feel).sort(
    (a, b) => a.startBeat - b.startBeat,
  )

  /*
    Kéo lại bước nào vượt một quãng tám — **sau cùng**, khi không còn ai bỏ nốt nữa.

    Chỗ nối hơi qua vạch nhịp bên trên đã tự kiểm để không đẻ ra bước nhảy. Nhưng
    hai bước sau nó — `noRepeat` bỏ nốt lặp, `capStack` cắt cụm ba nốt còn hai —
    **bỏ đi nốt ở giữa**, và hai nốt còn lại thành hàng xóm của nhau. Đo được một
    bước 15 nửa cung sinh ra đúng như vậy: không tầng nào đặt nó xuống, nó lộ ra
    khi tầng khác dọn chỗ.

    Kéo bằng quãng tám nên lớp cao độ không đổi: nốt hạ cánh vẫn đúng nốt hợp âm
    nó đã chọn. Nốt khoá — câu chạy kết bài — thì kéo nốt bên kia.
  */
  const chinh = lined.filter((note) => !note.isGrace && !note.ornament)
  for (let k = 1; k < chinh.length; k += 1) {
    const truoc = chinh[k - 1]!
    const nay = chinh[k]!
    for (let lan = 0; lan < 3 && Math.abs(nay.note - truoc.note) > 12; lan += 1) {
      const doi = locked(nay.startBeat) ? truoc : nay
      const huong = doi === nay ? (nay.note < truoc.note ? 12 : -12) : nay.note < truoc.note ? -12 : 12
      const to = (doi.note + huong) as MidiNote
      if (to < soloLow || to > soloCeiling) break
      doi.note = to
    }
  }

  const clipped = lined.map((note) => {
    let duration = note.durationBeats
    for (const other of lined) {
      const room = other.startBeat - note.startBeat
      if (room > 1e-6 && duration > room) duration = room
    }
    return duration === note.durationBeats ? note : { ...note, durationBeats: duration }
  })

  // Ngón gán sau cùng, khi cao độ đã chốt — gán trước thì mọi bước sửa nốt
  // phía trên đều làm số ngón nói dối.
  return assignFingers(clipped).notes
}

/**
 * Nốt láy dài bao nhiêu.
 *
 * Đủ ngắn để nghe ra là **cái vuốt vào nốt chính**, không phải một nốt riêng.
 * Nốt kép là ranh giới: dài hơn thì tai đếm nó thành một nốt của câu nhạc và
 * câu nhạc nghe như bị thêm nốt thừa.
 */
const GRACE_BEATS = 0.125

/**
 * Nốt phải dài ít nhất chừng này mới đáng láy.
 *
 * Nốt láy là đồ trang trí cho **nốt tai dừng lại ở đó**. Gắn nó vào từng nốt
 * của một câu chạy nhanh thì câu nhạc nhoè đi, và đó chính là cảm giác "láy
 * nhiều quá" nghe thấy khi đo được 76% số nốt có láy ở mức dày.
 */
const GRACE_MIN_NOTE = 0.5

/**
 * Nốt đứng trước phải còn lại ít nhất chừng này sau khi bị cắt để nhường chỗ.
 *
 * Cắt ngắn hơn nữa thì nó không kịp vang, nghe thành tiếng gõ chứ không phải
 * một nốt của câu nhạc.
 */
const GRACE_MIN_ROOM = 0.125

/**
 * Gắn nốt láy vào câu nhạc — kỹ thuật số 4 trong năm kỹ thuật của phong cách.
 *
 * `graceNoteOrnamenter.ts` đã dựng sẵn luật chọn nốt láy từ lâu nhưng **chưa
 * ai gọi tới**: ô "Mật độ nốt láy" trên giao diện thật ra chỉ điều khiển mật
 * độ nốt của câu solo. Chỗ này nối lại cho đúng cái tên.
 *
 * ## Nốt láy vang **trước** phách, không đẩy nốt chính đi
 *
 * Đây là chỗ bản đầu làm sai. Nó cắt đoạn đầu của nốt chính cho nốt láy, nên
 * nốt chính bị dời sang phách 0,125 — cả câu nhạc trôi khỏi lưới nốt kép và
 * nghe lệch với nhịp đệm.
 *
 * Đúng ra nốt láy là **cái vuốt vào phách**: nó vang ở khe ngay trước, còn nốt
 * chính vẫn rơi đúng chỗ của nó. Chỗ cho nốt láy lấy từ **đuôi nốt đứng
 * trước** — trên đàn thật thì ngón vừa nhả nốt cũ ra là vuốt luôn vào nốt mới.
 */
function addGraceNotes(
  line: readonly SoloNote[],
  options: {
    direction: ApproachDirection
    density: GraceDensity
    tones: ReadonlySet<PitchClass>
  },
): SoloNote[] {
  const { direction, density, tones } = options
  if (density === 'none') return [...line]

  // Chỉ láy nốt chính; nốt mềm sẵn có của mẫu câu thì để yên.
  const main = line.filter((note) => !note.isGrace)
  const ornamented = ornamentLine(
    main.map((note) => note.note),
    { direction, density, scaleTones: tones },
  )

  const result: SoloNote[] = line.filter((note) => note.isGrace)
  const kept: SoloNote[] = []

  main.forEach((note, index) => {
    const { grace } = ornamented[index]
    const graceStart = note.startBeat - GRACE_BEATS
    const previous = kept[kept.length - 1]

    /*
      Không láy khi không có chỗ: nốt đầu câu chưa có gì phía trước để mượn,
      còn nốt đứng trước quá ngắn thì cắt nữa là mất luôn.
    */
    const room =
      graceStart >= 0 &&
      note.durationBeats >= GRACE_MIN_NOTE &&
      (previous === undefined ||
        graceStart - previous.startBeat >= GRACE_MIN_ROOM)

    /*
      Nốt láy trùng cao độ với nốt vừa đánh thì bỏ.

      Nó không còn là nốt láy nữa mà thành đánh lại đúng nốt cũ — nghe ra là
      lắp bắp, và đủ để tạo ba tiếng cùng cao độ liên tiếp trong câu.
    */
    const repeats = previous !== undefined && previous.note === grace

    if (grace === null || !room || repeats) {
      kept.push(note)
      return
    }

    // Nốt trước còn vang tới chỗ nốt láy thì cắt đuôi nó đi.
    if (previous && previous.startBeat + previous.durationBeats > graceStart) {
      previous.durationBeats = graceStart - previous.startBeat
    }

    result.push({
      note: grace,
      startBeat: graceStart,
      durationBeats: GRACE_BEATS,
      isGrace: true,
    })

    // Nốt chính giữ nguyên mốc phách — đó là điểm mấu chốt.
    kept.push({ ...note })
  })

  return [...result, ...kept].sort((a, b) => a.startBeat - b.startBeat)
}

/** Chất liệu nốt của một hợp âm theo nguồn người dùng chọn. */
function materialFor(
  chord: ParsedChord,
  noteSource: SoloNoteSource,
  key?: { tonic: PitchClass; scale: ScaleType } | null,
  alts: readonly ParsedChord[] = [],
  pool?: ReadonlySet<PitchClass>,
  interlude = false,
  storeScale?: (chord: ParsedChord) => readonly PitchClass[] | null,
): PitchClass[] {
  /*
    Giang tấu đi theo bậc ưu tiên riêng: nốt hợp âm trước, rồi mới ngũ cung, rồi
    mới thang âm của giọng — và **không** tự thêm bậc chín. Người dùng tự chọn
    ngũ cung hay màu blues thì tôn lựa chọn ấy, không ép về nốt hợp âm.
  */
  if (interlude && (noteSource === 'chordTone' || noteSource === 'storeScale')) {
    /*
      Gam jazz chỉ vào khi người dùng chọn đúng nguồn nốt ấy. Đưa nó vào ngầm là
      để một tầng kiến thức còn draft tự thành tiếng đàn — xem `../brain/gate.ts`.
    */
    const extra = noteSource === 'storeScale' ? (storeScale?.(chord) ?? undefined) : undefined
    const layered = interludeMaterial(chord, key, extra)
    const clipped = pool ? layered.filter((tone) => pool.has(tone)) : layered
    if (clipped.length >= 3) return clipped
    if (layered.length > 0) return layered
  }

  const raw =
    noteSource === 'chordPentatonic'
      ? chordPentatonic(chord)
      : noteSource === 'blues'
        ? chordBlues(chord)
        : chordMaterial(chord)
  const clip = (pitches: readonly PitchClass[]) => {
    const keyed = keepInKey(pitches, key)
    if (!pool || pool.size === 0) return keyed
    return keyed.filter((tone) => pool.has(tone))
  }
  const kept = clip(raw)
  if (kept.length >= 3 || (!key && !pool)) return kept.length > 0 ? kept : raw
  for (const alt of alts) {
    const other = clip(
      noteSource === 'chordPentatonic'
        ? chordPentatonic(alt)
        : noteSource === 'blues'
          ? chordBlues(alt)
          : chordMaterial(alt),
    )
    if (other.length >= 3) return other
  }
  const fallback = inKeyMaterial(chord, key)
  const clipped = pool ? fallback.filter((tone) => pool.has(tone)) : fallback
  return clipped.length > 0 ? clipped : kept.length > 0 ? kept : raw
}

interface LickChoice {
  /** Hợp âm thứ mấy trong vòng — ô 1 quét, ô 3 chạy nửa cung. */
  chordIndex: number
  phrase: number
  interlude?: boolean
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
  const endings = licksFor('ending')

  const {
    chordIndex,
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
    Số lượt cộng vào chỗ xoay, nên lượt sau đổi hẳn trình tự mẫu câu.

    Mở câu và kết câu quay như **hai bánh xe của đồng hồ đo**: bánh kết chỉ
    nhích một nấc khi bánh mở đã quay hết một vòng. Nhờ vậy mọi tổ hợp đều xuất
    hiện trước khi lặp lại, tức số câu khác nhau bằng tích hai danh sách chứ
    không bằng cái dài hơn.

    Bản trước cộng thẳng cùng một số vào cả hai chỗ, nên hai bánh quay cùng tốc
    độ và chu kỳ co lại còn đúng bốn — nghe vài lượt là bắt đầu lặp.
  */
  const mix = (salt: number) => Math.imul(take + 1 + salt + phrase * 17, 2654435761) >>> 0
  const rotation = mix(3)
  const laps = Math.floor(rotation / Math.max(1, openers.length))

  /*
    Kết câu ở nốt ổn định — mục 4: *"tránh dừng ở nốt lơ lửng khiến câu nhạc
    nghe dở dang"*. Cả hai mẫu kết đều làm được điều đó, nên chúng thay phiên.

    Bản trước gọi thẳng mẫu lùi ở đây, tức bỏ qua hẳn danh sách mẫu kết — mẫu
    `guide-tone` đã bật vào vòng xoay mà không bao giờ được chọn.
  */
  if (isPhraseEnd) {
    return fit(
      endings.length > 0 ? endings[laps % endings.length] : fallbackLick(),
    )
  }

  // Thưa: nghỉ một hợp âm. Giang tấu ô 2 chơi tự do, không nghỉ.
  if (
    !choice.interlude &&
    (density === 'sparse' || (density === 'medium' && !choice.resolving)) &&
    positionInPhrase === 1
  ) {
    return fit(licksFor('rest')[0])
  }

  const sweep = openers.find((lick) => lick.id === 'sweep')
  const runners = openers.filter((lick) => lick.id !== 'chord-tone')

  /*
    Hai ô mở câu của đoạn giang tấu **chơi hai ngón khác nhau**.

    Câu 1 mở bằng cú quét ngũ cung của anh Cà Pháo; câu 2 mở bằng một câu chạy
    nửa cung (bao vây hoặc nốt dẫn). Trước đây cả hai ô đều bốc trúng cú quét
    bốn lần trên năm, nên bốn ô giang tấu nghe ra hai lần cùng một ngón.

    Đây cũng là chỗ vốn từ vựng có sẵn mà chưa dùng tới: `enclosure` và
    `approach` đều đã ghi nguồn, chỉ chưa bao giờ được gọi ở vị trí mở câu.
  */
  const chromatic = [...openers, ...middles].filter(
    (lick) => lick.id === 'enclosure' || lick.id === 'approach',
  )

  if (positionInPhrase === 0 && runners.length > 0) {
    /*
      Bám thẳng **số thứ tự ô** chứ không bám số câu.

      Ô 1 quét, ô 3 chạy nửa cung, và cứ bốn ô lại lặp. Cách cũ chia theo chẵn
      lẻ của câu nhạc, mà cách đánh số câu còn phụ thuộc mấy thứ khác — đo ra
      cả ô 1 lẫn ô 3 đều bốc trúng cú quét, tức bốn ô nghe hai lần một ngón.
    */
    const opening = chordIndex % 4
    if ((opening === 0 || opening === 1) && sweep) return fit(sweep)
    if (opening === 2 && chromatic.length > 0 && mix(13) % 3 === 0) {
      return fit(chromatic[mix(13) % chromatic.length])
    }
    if (sweep && mix(9) % 3 !== 0) return fit(sweep)
    return fit(runners[mix(11) % runners.length])
  }
  if (positionInPhrase === 2) {
    const giua = middles.filter((lick) => lick.id !== 'echo')
    if (giua.length > 0) return fit(giua[mix(19) % giua.length])
    return fit(openers.find((lick) => lick.id === 'chord-tone') ?? fallbackLick())
  }

  if (middles.length === 0) {
    return fit(openers[rotation % openers.length])
  }

  /*
    Bật lại mẫu **kẹp nửa cung**, giữ nguyên chỗ chặn mẫu nốt dẫn.

    Ghi chú phía trên dặn rõ: ba mẫu này từng được bật cả loạt và nghe tệ hơn
    hẳn, nên bật lại thì bật từng cái để còn biết cái nào hỏng. Đây là cái đầu
    tiên, chọn nó vì nó là ngón chromatic nghe ra rõ nhất — hai nốt kẹp trên và
    dưới rồi mới vào nốt đích, mà nốt đích vẫn là nốt hợp âm nên hoà âm không
    lung lay.

    Trước khi bật: tám lượt giang tấu, 232 nốt, **không một nốt nửa cung nào**.
  */
  const inKey = middles.filter((lick) => lick.id !== 'approach')
  const pool = inKey.length > 0 ? inKey : middles
  const middle = pool[mix(13 + positionInPhrase) % pool.length]
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
    grace: note.isGrace,
  }))
}

/** Các nốt của hợp âm, dùng cho phần hiển thị. */
export function chordToneNames(chord: ParsedChord): PitchClass[] {
  return chordPitchClasses(chord.root, chord.quality)
}

export { densityOption }
