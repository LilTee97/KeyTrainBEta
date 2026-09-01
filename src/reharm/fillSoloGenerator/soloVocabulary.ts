import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import { scaleTones } from '../reharmEngine/keyDetection'

/**
 * Vốn từ vựng câu ngẫu hứng — mỗi mẫu câu lấy từ một chỗ cụ thể trong tài liệu.
 *
 * Đây là bản thay cho hệ "ba mức khó" trước đó. Hệ cũ hỏng ở gốc: nó chọn nốt
 * theo **hợp âm cuối câu** rồi dùng bộ nốt đó cho cả câu, nên khi một câu trải
 * qua hai hợp âm thì nửa đầu chơi sai hoà âm; chọn nguồn ngũ cung thì còn tệ
 * hơn, cả đoạn dùng một bộ nốt cố định theo giọng của bài và không bám hợp âm
 * chút nào. Nghe ra là "không hợp vòng hợp âm" đúng như vậy.
 *
 * Bản này đảo lại nguyên tắc: **mỗi hợp âm được một mẫu câu riêng, chất liệu
 * lấy từ chính hợp âm đang vang**. Đó là *chord tone soloing* ở mục 3.1 của
 * `pianoimprovnotes.md` — tài liệu nói thẳng cách này *"luôn khớp hòa âm"*.
 *
 * Mỗi mẫu câu bên dưới đều ghi rõ nguồn. Không có mẫu nào do tôi tự nghĩ ra.
 *
 * ## Thêm một mẫu câu mới
 *
 * Sửa **đúng file này**, không phải sửa nơi nào khác:
 *
 * 1. Viết một hằng kiểu `Lick`, khai `roles` (mở câu / giữa câu / kết câu /
 *    nghỉ), `minBeats`, và `source` trích rõ nguồn.
 * 2. Đặt `inRotation: false` — mẫu mới chưa được nghe duyệt thì chưa cho vào
 *    vòng xoay. Bật cả loạt cùng lúc thì hỏng cũng không biết cái nào gây ra,
 *    và chuyện đó đã xảy ra một lần.
 * 3. Thêm vào mảng `LICKS`. **Vị trí trong mảng chính là thứ tự xoay**, nên
 *    chèn vào giữa sẽ đổi âm thanh của những mẫu đứng sau.
 * 4. Nghe thử, ưng thì đổi `inRotation: true`.
 *
 * Không phải nhớ thêm vào danh sách nào bên `soloGenerator.ts` nữa: danh sách
 * cho từng vị trí được **suy ra** từ chính mảng này qua `licksFor`.
 *
 * Hai bất biến khó nhất đã có hàm bọc `bounded` lo giúp, mẫu mới không phải
 * tự xử: **không nốt nào tràn qua hợp âm sau**, và **mọi nốt rơi đúng lưới móc
 * kép**. Mẫu nào cố ý chơi ngoài lưới thì khai `offGrid: true`.
 */

export interface LickNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  /** Nốt tô điểm, đánh nhẹ hơn nốt chính. */
  soft: boolean
}

export interface LickContext {
  /** Hợp âm đang vang. Chất liệu chính lấy từ đây. */
  chord: ParsedChord
  /** Hợp âm kế tiếp, để chọn nốt dẫn sang. */
  next: ParsedChord | null
  startBeat: number
  beats: number
  /** Nốt cuối của mẫu câu trước, để nối cho liền. */
  from: MidiNote
  low: MidiNote
  high: MidiNote
  /** Thang âm của giọng, dùng cho nốt nối ngoài hợp âm. */
  scaleTones: ReadonlySet<PitchClass>
  /** Đường nét mẫu câu trước, tính theo bậc trong bậc thang nốt. */
  previousShape: readonly number[]
  /** Số nốt mỗi phách, do mật độ người dùng chọn quyết định. */
  notesPerBeat: number
  /** Chất liệu chính: nốt hợp âm, hay ngũ cung dựng trên hợp âm. */
  material: readonly PitchClass[]
}

export interface LickResult {
  notes: LickNote[]
  /** Đường nét của chính mẫu câu này, để câu sau nhắc lại được. */
  shape: number[]
}

/**
 * Vị trí trong câu nhạc mà một mẫu câu dùng được.
 *
 * Khai ngay trong mẫu chứ không để thành danh sách riêng ở nơi khác. Bản trước
 * giữ hai danh sách `OPENERS`/`MIDDLES` bên `soloGenerator.ts`, tách rời khỏi
 * chỗ định nghĩa mẫu — nên thêm mẫu mà quên thêm vào danh sách là mẫu đó không
 * bao giờ được chọn. Chuyện đó đã xảy ra: có lúc **nửa vốn từ vựng nằm chết**
 * mà không ai biết, cho tới khi in kết quả ra đọc.
 */
export type LickRole =
  /** Mở câu — nên là mẫu dứt khoát, tạo đà cho cả câu. */
  | 'opener'
  /** Giữa câu — chỗ triển khai, tô điểm. */
  | 'middle'
  /** Kết câu — bắt buộc kết ở nốt ổn định để câu nhạc đậu lại. */
  | 'ending'
  /** Nghỉ lấy hơi. */
  | 'rest'

export interface Lick {
  id: string
  label: string
  /** Trích nguồn — chỗ nào trong tài liệu hoặc bản nhạc sinh ra mẫu này. */
  source: string
  /** Số phách tối thiểu mới chơi được mẫu này. */
  minBeats: number
  /** Dùng được ở những vị trí nào trong câu nhạc. */
  roles: readonly LickRole[]
  /**
   * Đã đưa vào vòng xoay chưa.
   *
   * Mẫu mới viết xong nên để `false` cho tới khi nghe duyệt. Bật cả loạt cùng
   * lúc thì hỏng cũng không biết cái nào gây ra — đã một lần như vậy.
   */
  inRotation: boolean
  /**
   * Mẫu này cố ý chơi ngoài lưới móc kép.
   *
   * Chỉ chùm ba cần tới, vì ba nốt đều nhau trong một phách thì không nốt nào
   * rơi vào móc kép được.
   */
  offGrid?: boolean
  build: (context: LickContext) => LickResult
}

/*
  ── Chất liệu ──────────────────────────────────────────────────────────────
*/

/** Quãng của các nốt ổn định để kết câu: gốc, quãng ba, quãng năm. */
const STABLE_INTERVALS = [0, 3, 4, 7]

/**
 * Nốt dùng được của một hợp âm: **1, 3, 5, 7 và thêm bậc chín**.
 *
 * Đúng danh sách mục 3.1 của `pianoimprovnotes.md`: *"gốc (1), quãng 3, quãng
 * 5, quãng 7, quãng 9"*. Bậc chín thêm vào vì nó là nốt màu rẻ nhất mà vẫn
 * chắc chắn khớp hoà âm.
 */
export type SongKey = { tonic: PitchClass; scale: ScaleType }

/** Giữ lại các lớp cao độ nằm trong giọng. */
export function keepInKey(
  pitches: readonly PitchClass[],
  key?: SongKey | null,
): PitchClass[] {
  if (!key) return [...pitches]
  const scale = scaleTones(key.tonic, key.scale)
  return pitches.filter((pitch) => scale.has(pitch))
}

/**
 * Nốt hợp âm đã lọc nốt ngoài giọng.
 *
 * Ít hơn 3 nốt thì lấy tam giác diatonic gần gốc nhất — đủ để chạy câu mà
 * không phải dùng C# trên B9sus4 trong giọng Mi thứ.
 */
export function inKeyMaterial(
  chord: ParsedChord,
  key?: SongKey | null,
): PitchClass[] {
  const kept = keepInKey(chordMaterial(chord), key)
  if (kept.length >= 3 || !key) return kept.length > 0 ? kept : chordMaterial(chord)

  const scale = scaleTones(key.tonic, key.scale)
  let base = chord.root
  for (let step = 0; step <= 6; step += 1) {
    const up = ((chord.root + step) % 12) as PitchClass
    const down = ((chord.root - step + 12) % 12) as PitchClass
    if (scale.has(up)) {
      base = up
      break
    }
    if (scale.has(down)) {
      base = down
      break
    }
  }
  return [0, 3, 4, 7]
    .map((interval) => ((base + interval) % 12) as PitchClass)
    .filter((pitch, index, all) => scale.has(pitch) && all.indexOf(pitch) === index)
}

/**
 * Nốt của hợp âm, **đúng những nốt hợp âm có**, không cộng thêm gì.
 *
 * Khác `chordMaterial` ở chỗ không tự thêm bậc chín. Dùng cho đoạn giang tấu:
 * ở đó không có ai hát, cây đàn tự chạy câu, nên nốt màu chồng vào làm câu chạy
 * nghe lạc — xem `interludeMaterial`.
 */
export function chordTonesStrict(chord: ParsedChord): PitchClass[] {
  return [...new Set(chordPitchClasses(chord.root, chord.quality))]
}

/**
 * Chất liệu nốt cho **đoạn giang tấu**, xếp theo bậc ưu tiên.
 *
 * Đoạn có lời thì giọng hát là đường giai điệu, hợp âm dày lên nghe đầy, và nốt
 * bậc chín của `chordMaterial` đúng chỗ. Giang tấu thì ngược lại: câu chạy
 * *chính là* giai điệu, nên nó cần chỗ tựa chắc chứ không cần màu.
 *
 * Ba tầng, lấy tầng hẹp nhất còn đủ nốt để dựng câu:
 *
 * 1. **Nốt hợp âm** 1-3-5-7. Chắc chắn khớp hoà âm, và câu kết rơi vào đây.
 * 2. **Ngũ cung** dựng trên nốt gốc hợp âm, khi tầng một quá ít nốt.
 * 3. **Thang âm của giọng**, khi hai tầng trên bị bộ lọc giọng cắt gần hết.
 *
 * `extra` là thang âm jazz do bên gọi đưa vào. Có nó thì nó **đứng đầu**, và nó
 * **không đi qua bộ lọc giọng**. Hai điều đó đi liền nhau:
 *
 * - Đứng đầu, vì tầng nốt hợp âm luôn đủ ba nốt nên mọi tầng dưới không bao giờ
 *   tới lượt. Đặt gam jazz xuống dưới là viết một tầng chết. Gam mà bộ chọn bên
 *   PianoBrain trả về đã được kiểm là **chứa đủ nốt của hợp âm**, nên nó là tập
 *   rộng hơn nốt hợp âm chứ không phải tập khác — lấy nó không mất chỗ tựa nào.
 * - Không lọc giọng, vì thứ làm câu jazz ra chất chính là nốt ngoài giọng: #11
 *   của Lydian, b9 và #9 của gam altered, nốt bậc 7 tự nhiên của bebop. Lọc
 *   xong thì còn lại đúng thang âm của giọng, tức là không dùng gam nào cả.
 *
 * Bên gọi không đưa `extra` thì hàm chạy y như cũ, từng nốt một — đó là đường
 * mặc định của điệu ballad và của mọi bài chưa bật gam jazz.
 */
export function interludeMaterial(
  chord: ParsedChord,
  key?: SongKey | null,
  extra?: readonly PitchClass[],
): PitchClass[] {
  const enough = (pitches: readonly PitchClass[]) => pitches.length >= 3

  if (extra && extra.length >= 3) return [...new Set(extra)]

  /*
    Nốt của chính hợp âm **không** đi qua bộ lọc giọng.

    Bộ lọc từng cắt cả nốt hợp âm, và trên hợp âm mượn thì nó cắt gần hết: một
    Ebmaj7 trong bài giọng Đô bị bỏ mất Mi giáng, Si giáng lẫn Rê, tụt xuống
    tầng ngũ cung rồi trả về Fa Sol Đô — câu chạy không còn một nốt nào của hợp
    âm đang vang. Hợp âm là hoà âm đang kêu dưới tay trái; nó không cần xin phép
    giọng của bài.
  */
  const tones = chordTonesStrict(chord)
  if (enough(tones)) return tones

  const pentatonic = keepInKey(chordPentatonic(chord), key)
  if (enough(pentatonic)) return pentatonic

  const diatonic = inKeyMaterial(chord, key)
  if (enough(diatonic)) return diatonic

  // Cạn đường: thà trả nốt hợp âm còn hơn trả rỗng rồi im tiếng.
  return tones.length > 0 ? tones : chordTonesStrict(chord)
}

export function chordMaterial(chord: ParsedChord): PitchClass[] {
  const tones = new Set(chordPitchClasses(chord.root, chord.quality))
  if (allowsNaturalNinth(chord)) {
    tones.add(((chord.root + 2) % 12) as PitchClass)
  }
  return [...tones]
}

/**
 * Hợp âm này có nhận thêm bậc chín tự nhiên không.
 *
 * Bản đầu cộng bậc chín vào **mọi** hợp âm, và đó là nguồn xung đột người dùng
 * nghe thấy khi bật hợp âm lướt — vì hai loại hợp âm bị hại nhất lại đúng là
 * hai loại mà vòng hai-năm lướt sinh ra:
 *
 * - **Hợp âm át có bậc chín giáng** (`E7b9`): bản thân hợp âm đã vang nốt giáng
 *   chín, cộng thêm bậc chín tự nhiên là hai nốt cách nhau nửa cung cùng vang —
 *   chối tai ngay.
 * - **Hợp âm nửa giảm** (`Bm7b5`): bậc chín tự nhiên của nó nằm **ngoài giọng**
 *   trong vòng hai-năm về hợp âm thứ. Ví dụ `Bm7b5 → E7b9 → Am` trong giọng Đô
 *   trưởng: bậc chín tự nhiên của Si là Đô thăng, trong khi giọng chỉ có Đô.
 *
 * Các hợp âm còn lại vẫn nhận bậc chín, vì đó là nốt màu rẻ nhất mà chắc chắn
 * khớp hoà âm — đúng danh sách 1-3-5-7-9 ở mục 3.1 của `pianoimprovnotes.md`.
 */
function allowsNaturalNinth(chord: ParsedChord): boolean {
  const intervals = chord.quality.intervals.map((interval) => interval % 12)

  // Đã có bậc chín giáng thì thêm bậc chín tự nhiên là chồng nửa cung.
  if (intervals.includes(1)) return false

  // Hợp âm nửa giảm: quãng ba thứ cộng quãng năm giảm.
  if (intervals.includes(3) && intervals.includes(6)) return false

  return true
}

/**
 * Ngũ cung dựng **trên chính nốt gốc hợp âm**, không phải trên giọng của bài.
 *
 * Bản Hồng Kông 1 làm đúng vậy: cú quét ô nhịp 51 nằm trên Em7 và dùng bộ
 * `G A B D` (ngũ cung Mi thứ), còn cú quét ô nhịp 96 nằm trên Đô trưởng và
 * dùng `C D E G`. Tức bộ nốt đi theo hợp âm chứ không đứng yên theo giọng.
 */
export function chordPentatonic(chord: ParsedChord): PitchClass[] {
  const isMinor = chord.quality.intervals.some(
    (interval) => interval % 12 === 3,
  )
  const steps = isMinor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]
  return steps.map((step) => ((chord.root + step) % 12) as PitchClass)
}

/**
 * Ngũ cung của hợp âm cộng **nốt blue** ở quãng năm giảm.
 *
 * `pianoimprovnotes.md` mục 1.2: thang blues là ngũ cung thứ thêm một nốt ở
 * quãng năm giảm, và kỹ thuật là *"nhấn vào nốt blue rồi giải quyết về"* nốt
 * bên cạnh. Dựng trên nốt gốc hợp âm chứ không trên chủ âm bài hát.
 */
export function chordBlues(chord: ParsedChord): PitchClass[] {
  const steps = [0, 3, 5, 6, 7, 10]
  return steps.map((step) => ((chord.root + step) % 12) as PitchClass)
}

/**
 * Ngũ cung của **giọng bài hát**, giữ nguyên xuyên suốt mọi hợp âm.
 *
 * Phù hợp khi mọi hợp âm cùng giọng (pop, rock, blues). Trưởng thì ngũ cung
 * trưởng, thứ thì ngũ cung thứ — không phụ thuộc hợp âm đang vang.
 */
export function keyPentatonic(
  key: { tonic: PitchClass; scale: ScaleType },
): PitchClass[] {
  const isMinor = key.scale === 'minor'
  const steps = isMinor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]
  return steps.map((step) => ((key.tonic + step) % 12) as PitchClass)
}

/**
 * Gam blues của **giọng bài hát** — ngũ cung thứ cộng nốt blue (quãng 5 giảm).
 *
 * Dùng xuyên suốt bài blues, rock, pop có chất blues.
 */
export function keyBlues(
  key: { tonic: PitchClass; scale: ScaleType },
): PitchClass[] {
  const steps = [0, 3, 5, 6, 7, 10]
  return steps.map((step) => ((key.tonic + step) % 12) as PitchClass)
}

/** Bậc thang mọi nốt dùng được trong tầm, xếp tăng dần. */
export function ladderOf(
  pitchClasses: readonly PitchClass[],
  low: MidiNote,
  high: MidiNote,
): MidiNote[] {
  const allowed = new Set(pitchClasses)
  const ladder: MidiNote[] = []
  for (let note = low; note <= high; note += 1) {
    if (allowed.has((note % 12) as PitchClass)) ladder.push(note)
  }
  return ladder
}

/** Vị trí trong bậc thang gần một nốt nhất. */
export function nearestStep(ladder: readonly MidiNote[], target: MidiNote): number {
  let best = 0
  for (let index = 1; index < ladder.length; index += 1) {
    if (Math.abs(ladder[index] - target) < Math.abs(ladder[best] - target)) {
      best = index
    }
  }
  return best
}

/** Nốt ổn định của hợp âm, để kết câu cho "chốt". */
export function stableToneOf(chord: ParsedChord): PitchClass {
  const available = chord.quality.intervals.filter((interval) =>
    STABLE_INTERVALS.includes(interval % 12),
  )
  const preferred =
    available.find((interval) => interval === 3 || interval === 4) ??
    available[0] ??
    0
  return ((chord.root + preferred) % 12) as PitchClass
}

export type StrongBeatStyle = 'ca-phao' | 'linh-nhi' | 'ton-hung'

/** Nốt đích phách mạnh — ao riêng từng thầy (đo 2 bài). */
export function strongBeatPcs(
  chord: ParsedChord,
  style: StrongBeatStyle = 'ca-phao',
): PitchClass[] {
  const fromRoot = (pc: PitchClass) => (pc - chord.root + 12) % 12
  const rankOf = (pc: PitchClass): number => {
    const d = fromRoot(pc)
    if (style === 'linh-nhi') {
      if (d === 3 || d === 4) return 0
      if (d === 0) return 1
      if (d === 7) return 2
      return 9
    }
    if (style === 'ton-hung') {
      if (d === 0) return 0
      if (d === 3 || d === 4) return 1
      if (d === 7) return 2
      if (d === 10 || d === 11) return 3
      return 9
    }
    if (d === 2 || d === 1 || d === 5 || d === 9 || d === 8 || d === 6) return 0
    if (d === 10 || d === 11) return 1
    if (d === 3 || d === 4) return 2
    return 3
  }
  const pool = style === 'linh-nhi' ? chordTonesStrict(chord) : chordMaterial(chord)
  return pool.filter((pc) => rankOf(pc) < 9).sort((a, b) => rankOf(a) - rankOf(b))
}

/** Giữ một vị trí nằm trong bậc thang. */
const clampStep = (ladder: readonly MidiNote[], step: number) =>
  Math.max(0, Math.min(ladder.length - 1, step))

/**
 * Đi từng bậc theo một dãy bước, **bật lại khi chạm biên** thay vì kẹp cứng.
 *
 * Kẹp cứng là cách làm đầu tiên và nó hỏng thấy rõ: khi câu nhạc đi xuống tới
 * đáy tầm thì mọi bước sau đều kẹp về cùng một bậc, cho ra một dãy nốt trùng
 * nhau (`A4 A4 A4 A4 A4 A4`) nghe như đàn kẹt phím. Bật lại giữ câu nhạc luôn
 * chuyển động, và cũng đúng lời khuyên *"thay đổi quãng âm, lúc cao lúc thấp"*
 * ở mục 4 của `pianoimprovnotes.md`.
 */
function walkSteps(
  ladder: readonly MidiNote[],
  start: number,
  deltas: readonly number[],
): number[] {
  const top = ladder.length - 1
  const steps = [clampStep(ladder, start)]
  let sign = 1

  for (const delta of deltas) {
    const current = steps[steps.length - 1]
    let next = current + delta * sign

    if (next < 0 || next > top) {
      sign = -sign
      next = current + delta * sign
    }

    steps.push(clampStep(ladder, next))
  }

  return steps
}

/**
 * Hướng đi của câu nhạc theo chỗ nó đang đứng trong tầm.
 *
 * Nằm dưới giữa tầm thì đi lên, trên giữa tầm thì đi xuống. Nhờ vậy câu nhạc
 * tự kéo mình về giữa tầm thay vì trôi mãi một chiều rồi dính biên.
 */
function directionFrom(from: MidiNote, low: MidiNote, high: MidiNote): 1 | -1 {
  return from < (low + high) / 2 ? 1 : -1
}

/** Đổi danh sách nốt thành các nốt có tiết tấu chia đều. */
function evenNotes(
  notes: readonly MidiNote[],
  startBeat: number,
  beats: number,
  options: { lastLonger?: boolean } = {},
): LickNote[] {
  if (notes.length === 0) return []

  const { lastLonger = true } = options
  const slots = notes.length + (lastLonger ? 1 : 0)
  const step = beats / slots

  return notes.map((note, index) => ({
    note,
    startBeat: startBeat + index * step,
    durationBeats:
      (index === notes.length - 1 && lastLonger ? step * 2 : step) * 0.9,
    soft: false,
  }))
}

/**
 * Cắt mọi nốt cho nằm gọn trong khoảng thời gian của hợp âm.
 *
 * Bắt buộc, không phải cho gọn: một nốt ngân quá phần thời gian của hợp âm sẽ
 * còn vang khi hợp âm đã đổi, và nghe ra đúng như lệch hoà âm. Đây là lỗi hai
 * mẫu câu mắc phải khi mới viết, do cộng dồn phần ngân dài của nốt cuối.
 */
function fitWithin(
  notes: readonly LickNote[],
  startBeat: number,
  beats: number,
): LickNote[] {
  const end = startBeat + beats

  return notes
    .filter((note) => note.startBeat < end)
    .map((note) => ({
      ...note,
      durationBeats: Math.max(
        0.05,
        Math.min(note.durationBeats, end - note.startBeat),
      ),
    }))
}

/**
 * Đổi nốt cuối của một dãy bậc thành nốt có lớp cao độ mong muốn.
 *
 * Từ chối nốt trùng đúng nốt liền trước — nếu không thì câu nhạc kết bằng hai
 * nốt giống hệt nhau, nghe như bấm hụt. Không tìm được nốt nào hợp lệ thì giữ
 * nguyên, thà kết ở nốt cũ còn hơn kết ở nốt trùng.
 */
function landOn(
  ladder: readonly MidiNote[],
  steps: number[],
  pitchClass: PitchClass,
): void {
  const target = steps[steps.length - 1]
  const before = steps[steps.length - 2]

  let landing = target
  let best = Number.POSITIVE_INFINITY

  ladder.forEach((note, index) => {
    if (note % 12 !== pitchClass || index === before) return
    const distance = Math.abs(index - target)
    /*
      Hạ cánh phải **trong tầm với**, không được nhảy tới.

      Bản trước lấy nốt ổn định gần nhất bất kể xa bao nhiêu, nên câu nhạc chạy
      liền mạch xong bị bẻ một cú **quãng tám** ngay ở nốt cuối — đo được bước
      12 nửa cung ở mẫu `chord-tone` và `guide-tone`. Không có bậc ổn định nào
      trong hai bậc thì thà đậu ở nốt câu tự đi tới: một nốt hơi lơ lửng nghe
      còn hơn một cú nhảy không đàn nổi.
    */
    if (distance > 2) return
    if (distance < best) {
      best = distance
      landing = index
    }
  })

  steps[steps.length - 1] = landing
}

/** Lưới nhịp nhỏ nhất: nốt móc kép, tức một phần tư phách. */
const GRID = 0.25

/**
 * Kéo mọi nốt về đúng lưới nhịp, rồi tính lại độ ngân cho khít.
 *
 * Đây là chỗ gây cảm giác lệch nhịp. Mỗi mẫu câu chia quãng thời gian được cấp
 * thành `n` phần đều nhau, mà `n` thì tuỳ mật độ và tuỳ độ dài hợp âm — chia 4
 * phách cho 7 phần ra bước 0.571 phách, chia cho 5 ra 0.8. Những giá trị đó
 * không rơi vào phách nào cả. Đo trên một vòng có hợp âm lướt: **36 trên 47
 * nốt nằm ngoài lưới móc kép**.
 *
 * Chuyện này có sẵn từ trước, nhưng chỉ lộ rõ khi hợp âm lướt làm các quãng
 * thời gian dài ngắn khác nhau, nên cùng một mẫu câu ra những bước lẻ khác nhau
 * ở mỗi hợp âm.
 *
 * Đặt ở đây, cùng chỗ với `fitWithin`, vì đây là bất biến của cả module: mẫu
 * nào cũng phải rơi vào lưới, kể cả mẫu viết thêm sau này. Mẫu nào cố ý chơi
 * ngoài lưới — như chùm ba — thì tự khai `offGrid`.
 *
 * Độ ngân tính lại theo khoảng cách tới nốt kế tiếp, nên vừa khít vừa bỏ được
 * mấy công thức nhân chia lẻ của từng mẫu.
 */
function snapToGrid(
  notes: readonly LickNote[],
  startBeat: number,
  beats: number,
): LickNote[] {
  if (notes.length === 0) return []

  const end = startBeat + beats
  const snapped: LickNote[] = []

  let previousSource = Number.NaN
  let previousPlaced = -Infinity

  for (const note of notes) {
    // Nốt chồng cùng thời điểm phải giữ nguyên chồng, đừng tách chúng ra.
    const stacked = Math.abs(note.startBeat - previousSource) < 1e-6

    let at = stacked
      ? previousPlaced
      : startBeat +
        Math.round((note.startBeat - startBeat) / GRID) * GRID

    // Hai nốt dồn vào cùng một ô lưới thì đẩy nốt sau sang ô kế.
    if (!stacked && at <= previousPlaced) at = previousPlaced + GRID
    if (at >= end - 1e-6) continue

    previousSource = note.startBeat
    previousPlaced = at
    snapped.push({ ...note, startBeat: at })
  }

  // Độ ngân bằng khoảng cách tới nốt kế tiếp, chừa một chút cho khỏi dính tiếng.
  return snapped.map((note, index) => {
    let next = end
    for (let ahead = index + 1; ahead < snapped.length; ahead += 1) {
      if (snapped[ahead].startBeat > note.startBeat + 1e-6) {
        next = snapped[ahead].startBeat
        break
      }
    }

    return {
      ...note,
      durationBeats: Math.max(0.05, (next - note.startBeat) * 0.9),
    }
  })
}

/** Đường nét: chênh lệch bậc giữa các nốt liền nhau. */
function shapeOf(steps: readonly number[]): number[] {
  const shape: number[] = []
  for (let index = 1; index < steps.length; index += 1) {
    shape.push(steps[index] - steps[index - 1])
  }
  return shape
}

/*
  ── Các mẫu câu ────────────────────────────────────────────────────────────
*/

/**
 * Đi trên nốt hợp âm.
 *
 * `pianoimprovnotes.md` mục 3.1 — *chord tone soloing*: xây giai điệu thẳng
 * trên nốt của chính hợp âm đang vang. Mẫu nền tảng nhất, và là mẫu bảo đảm
 * không bao giờ lệch hoà âm.
 */
const chordTonePath: Lick = {
  id: 'chord-tone',
  label: 'Đi trên nốt hợp âm',
  source: 'pianoimprovnotes.md mục 3.1 — chord tone soloing',
  minBeats: 1,
  roles: ['opener', 'ending'],
  inRotation: true,
  build: ({ chord, startBeat, beats, from, low, high, material, notesPerBeat }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    const count = Math.max(2, Math.min(6, Math.round(beats * notesPerBeat)))
    const sign = directionFrom(from, low, high)

    const steps = walkSteps(
      ladder,
      nearestStep(ladder, from),
      Array.from({ length: count - 1 }, () => sign),
    )

    /*
      Thay nốt cuối bằng **nốt ổn định gần nhất** — mục 4 của tài liệu: kết câu
      ở nốt gốc, quãng ba hoặc quãng năm, tránh dừng ở nốt lơ lửng.
    */
    landOn(ladder, steps, stableToneOf(chord))

    return {
      notes: evenNotes(steps.map((step) => ladder[step]), startBeat, beats),
      shape: shapeOf(steps),
    }
  },
}

/**
 * Rải hợp âm.
 *
 * `pianoimprovnotes.md` mục 3.2 và bước 6 của khung mục 3.3 — *arpeggios*.
 * Khác mẫu trên ở chỗ đi thẳng một mạch lên, không quanh quẩn, nên nghe dứt
 * khoát và mở câu tốt.
 */
const arpeggio: Lick = {
  id: 'arpeggio',
  label: 'Rải hợp âm đi lên',
  source: 'pianoimprovnotes.md mục 3.2 và 3.3 bước 6 — arpeggios',
  minBeats: 1.5,
  roles: ['opener'],
  inRotation: true,
  build: ({ chord, startBeat, beats, from, low, high, notesPerBeat }) => {
    const ladder = ladderOf(
      chordPitchClasses(chord.root, chord.quality),
      low,
      high,
    )
    if (ladder.length === 0) return { notes: [], shape: [] }

    const count = Math.max(3, Math.min(7, Math.round(beats * notesPerBeat)))

    // Rải đi lên, nhưng chạm trần thì bật xuống chứ không dồn cục ở nốt cao nhất.
    const steps = walkSteps(
      ladder,
      nearestStep(ladder, from),
      Array.from({ length: count - 1 }, () => 1),
    )

    return {
      notes: evenNotes(steps.map((step) => ladder[step]), startBeat, beats, {
        lastLonger: false,
      }),
      shape: shapeOf(steps),
    }
  },
}

/**
 * Nốt dẫn nửa cung.
 *
 * `pianoimprovnotes.md` mục 3.2 — *approach note*: chèn một nốt nửa cung dưới
 * ngay trước nốt hợp âm đích để "dẫn" vào nốt đó, tạo màu jazz. Nốt dẫn đánh
 * nhẹ hơn vì nó chỉ là cái vuốt vào nốt chính.
 */
const approachNotes: Lick = {
  id: 'approach',
  label: 'Nốt dẫn nửa cung',
  source: 'pianoimprovnotes.md mục 3.2 — passing/approach note',
  minBeats: 2,
  roles: ['middle'],
  inRotation: true,
  build: ({ startBeat, beats, from, low, high, material }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    const sign = directionFrom(from, low, high)
    const targets = walkSteps(ladder, nearestStep(ladder, from), [
      2 * sign,
      1 * sign,
    ])

    const notes: LickNote[] = []
    const step = beats / (targets.length * 2)

    targets.forEach((target, index) => {
      const at = startBeat + index * step * 2
      // Nốt dẫn nằm ngay dưới nốt đích một nửa cung.
      notes.push({
        note: ladder[target] - 1,
        startBeat: at,
        durationBeats: step * 0.8,
        soft: true,
      })
      notes.push({
        note: ladder[target],
        startBeat: at + step,
        durationBeats: step * (index === targets.length - 1 ? 1.8 : 0.9),
        soft: false,
      })
    })

    return { notes, shape: shapeOf(targets) }
  },
}

/**
 * Hình láy quay về.
 *
 * Đọc từ bản Hồng Kông 1, ô nhịp 49-50: bộ xương đi xuống từng bậc, và giữa
 * mỗi cặp có một cặp móc kép chạm trước vào nốt kế rồi quay lại nốt hiện tại
 * mới thật sự bước sang. Ở đây bậc thang là **nốt hợp âm**, nên hình láy luôn
 * nằm trong hoà âm.
 */
const neighborTurn: Lick = {
  id: 'turn',
  label: 'Hình láy quay về',
  source: 'Hồng Kông 1, ô nhịp 49-50',
  minBeats: 2,
  roles: ['middle'],
  inRotation: true,
  build: ({ startBeat, beats, from, low, high, material }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length < 2) return { notes: [], shape: [] }

    const count = Math.max(3, Math.min(6, Math.round(beats * 1.2)))
    const sign = directionFrom(from, low, high)

    const steps = walkSteps(
      ladder,
      nearestStep(ladder, from),
      Array.from({ length: count - 1 }, () => sign),
    )

    const notes: LickNote[] = []
    const slot = beats / count

    steps.forEach((step, index) => {
      const at = startBeat + index * slot
      const next = steps[index + 1]
      const isLast = index === steps.length - 1

      if (isLast || next === undefined) {
        notes.push({
          note: ladder[step],
          startBeat: at,
          durationBeats: slot * 1.6,
          soft: false,
        })
        return
      }

      notes.push({
        note: ladder[step],
        startBeat: at,
        durationBeats: slot * 0.45,
        soft: false,
      })
      notes.push({
        note: ladder[next],
        startBeat: at + slot * 0.5,
        durationBeats: slot * 0.22,
        soft: true,
      })
      notes.push({
        note: ladder[step],
        startBeat: at + slot * 0.75,
        durationBeats: slot * 0.22,
        soft: false,
      })
    })

    return { notes, shape: shapeOf(steps) }
  },
}

/**
 * Bậc thang này có đi được từng bước không, hay mỗi bước là một cú nhảy.
 *
 * Bậc thang dựng từ **nốt hợp âm** có hai bậc kề cách nhau quãng ba: đi "từng
 * bậc" trên đó chính là rải hợp âm, và mẫu rải đã có riêng. Bậc thang dựng từ
 * một thang âm hay ngũ cung thì bước là quãng hai hoặc quãng ba thứ — đó mới là
 * chỗ câu chạy dọc gam có nghĩa.
 *
 * Đo bằng phần bước nhỏ chứ không bằng bước lớn nhất: ngũ cung có hai chỗ nhảy
 * quãng ba thứ mà vẫn là gam để chạy, còn Cmaj7 có đúng một bước nửa cung
 * (Si-Đô) mà vẫn là hợp âm rải.
 */
function isStepwiseLadder(ladder: readonly MidiNote[]): boolean {
  if (ladder.length < 5) return false
  let small = 0
  for (let at = 1; at < ladder.length; at += 1) {
    if (ladder[at] - ladder[at - 1] <= 2) small += 1
  }
  return small / (ladder.length - 1) >= 0.5
}

/**
 * Câu chạy **dọc gam**, một chiều, hạ cánh vào nốt hợp âm.
 *
 * Đây là mẫu câu mà đoạn giang tấu vốn thiếu hẳn. Đo trên bản cũ: mạch đi một
 * chiều trung bình **1,7 nốt**, hơn nửa số lần quay đầu ngay sau một nốt — tức
 * không phải câu nhạc mà là bước đi ngẫu nhiên, và không thế ngón nào đặt vừa.
 *
 * Ba luật, cả ba đều lấy từ kho chứ không tự đặt:
 *
 * 1. **Đi liền một chiều 4-8 nốt.** Bài 6 của nguồn Jazz Scales (`02:25-03:42`,
 *    Pattern Type 1) dạy đúng khuôn bốn nốt liền một chiều rồi mới đổi.
 * 2. **Nốt hợp âm rơi vào chỗ đậu.** Đó là lý do gam Bebop Dominant tồn tại —
 *    bài 5 (`03:05-03:57`): thêm một nốt thành gam 8 nốt để nốt hợp âm rơi vào
 *    phách mạnh. Ở đây làm bằng cách **dịch cả câu** dọc bậc thang cho nốt cuối
 *    trúng nốt hợp âm, chứ không bẻ riêng nốt cuối: bẻ nốt cuối là đúng thứ tạo
 *    ra cú nhảy quãng tám mà bản cũ đang mắc.
 * 3. **Sải không quá một quãng tám.** Một vị trí tay là năm ngón, thêm một lần
 *    luồn ngón cái là tới quãng tám. Chạm mép thì quay đầu **một lần duy nhất**,
 *    và một lần quay đầu là câu nhạc, hai lần trở lên là loạn.
 *
 * Bậc thang thưa (nốt hợp âm) thì mẫu này **tự rút lui**, trả về rỗng để bộ
 * chọn lấy mẫu khác — chạy "dọc gam" trên bốn nốt hợp âm chỉ là rải hợp âm, mà
 * việc đó `arpeggio` đã làm.
 */
const scaleRun: Lick = {
  id: 'scale-run',
  label: 'Câu chạy dọc gam',
  source: 'Jazz Scales bài 6 02:25-03:42 (bốn nốt liền một chiều) và bài 5 03:05-03:57 (nốt hợp âm vào phách mạnh)',
  minBeats: 2,
  roles: ['opener', 'middle'],
  inRotation: true,
  build: ({ chord, startBeat, beats, from, low, high, material, notesPerBeat }) => {
    const ladder = ladderOf(material, low, high)
    if (!isStepwiseLadder(ladder)) return { notes: [], shape: [] }

    const cap = notesPerBeat >= 3 ? 12 : 8
    const count = Math.max(
      4,
      Math.min(cap, ladder.length, Math.round(beats * notesPerBeat)),
    )
    if (count < 4) return { notes: [], shape: [] }

    const top = ladder.length - 1
    const start = clampStep(ladder, nearestStep(ladder, from))
    let dir: 1 | -1 = directionFrom(from, low, high)

    const steps: number[] = [start]
    let turned = false
    while (steps.length < count) {
      const current = steps[steps.length - 1]
      let next = current + dir
      // Chạm mép tầm, hoặc sải quá một quãng tám tính từ nốt đầu: quay một lần.
      const tooWide = next >= 0 && next <= top && Math.abs(ladder[next] - ladder[start]) > 12
      if (next < 0 || next > top || tooWide) {
        if (turned) break
        turned = true
        dir = -dir as 1 | -1
        next = current + dir
        if (next < 0 || next > top) break
      }
      steps.push(next)
    }
    if (steps.length < 3) return { notes: [], shape: [] }

    /*
      Dịch cả câu để nốt cuối trúng nốt hợp âm.

      Dịch chứ không bẻ: bẻ riêng nốt cuối về nốt ổn định gần nhất là cách bản
      cũ làm, và nó đẻ ra cú nhảy quãng tám ngay ở chỗ câu nhạc đang cần đậu.
    */
    const tones = new Set(chordPitchClasses(chord.root, chord.quality))
    const last = steps[steps.length - 1]
    let shift = 0
    for (let offset = 0; offset <= 3; offset += 1) {
      const candidates = offset === 0 ? [0] : [offset, -offset]
      const found = candidates.find((delta) => {
        const landing = last + delta
        if (landing < 0 || landing > top) return false
        if (!tones.has((ladder[landing] % 12) as PitchClass)) return false
        return steps.every((step) => step + delta >= 0 && step + delta <= top)
      })
      if (found !== undefined) {
        shift = found
        break
      }
    }

    const shifted = steps.map((step) => step + shift)
    return {
      notes: evenNotes(shifted.map((step) => ladder[step]), startBeat, beats),
      shape: shapeOf(shifted),
    }
  },
}

/**
 * Rải bốn nốt ghép với bốn nốt gam đi ngược chiều — hình câu bebop kinh điển.
 *
 * Kho PianoBrain mô tả hình này bằng lời, bài 6 của nguồn Jazz Scales:
 *
 * > *"Pattern Type 1: rải bốn nốt đi lên (bắt đầu từ bậc 3, 5 hoặc 7) rồi bốn
 * > nốt gam Dominant Bebop đi xuống. Nhấn nốt cao nhất của mỗi cụm rải để lấy
 * > chất swing."* (`02:25-03:42`)
 * > *"Pattern Type 2: đảo chiều — bốn nốt gam đi xuống trước, đậu vào một nốt
 * > hợp âm, rồi rải bốn nốt đi lên."* (`03:43-04:46`)
 *
 * Ba cụm rải mẫu cũng có sẵn, trên G7: từ bậc 3 là `B-D-F-A`, từ bậc 5 là
 * `D-F-A-C`, từ bậc 7 là `F-A-C-E` (`00:41-02:24`).
 *
 * **Vì sao đúng tám nốt**: gam bebop có tám bậc, nên chạy móc đơn thì nốt hợp
 * âm rơi đúng vào phách mạnh — chính là lý do gam ấy được dựng ra. Ghép 4 + 4
 * là một ô nhịp trọn vẹn của móc đơn.
 *
 * Phần khái quát từ "trên G7" lên "trên mọi hợp âm át, mọi giọng" là **suy
 * luận**, không phải lời thầy — xem `rule-bebop-arpeggio-scale-pair` bên
 * PianoBrain, `origin: "derived"`, không gán cho thầy nào.
 *
 * Mẫu tự rút lui khi hợp âm không phải hợp âm át, hoặc khi chất liệu không phải
 * một thang âm: chồng quãng ba của hình này dựng trên hợp âm át, và bốn nốt "đi
 * xuống theo gam" cần một cái gam để đi.
 */
const bebopPair: Lick = {
  id: 'bebop-pair',
  label: 'Rải lên rồi gam xuống',
  source: 'Jazz Scales bài 6, 02:25-03:42 và 03:43-04:46 — qua luật rule-bebop-arpeggio-scale-pair',
  minBeats: 2,
  roles: ['opener', 'middle'],
  inRotation: true,
  build: ({ chord, startBeat, beats, from, low, high, material, notesPerBeat }) => {
    const intervals = chord.quality.intervals
    const isDominant = intervals.includes(4) && intervals.includes(10)
    if (!isDominant) return { notes: [], shape: [] }

    const ladder = ladderOf(material, low, high)
    if (!isStepwiseLadder(ladder) || ladder.length < 9) return { notes: [], shape: [] }

    /*
      Điểm xuất phát: bậc 3, bậc 5 hoặc bậc 7 của hợp âm — đúng ba chỗ bài giảng
      nêu. Chọn cái gần nốt vừa chơi nhất, để câu trước nối vào câu này không
      phải nhảy.
    */
    const starts = [4, 7, 10]
      .map((interval) => ((chord.root + interval) % 12) as PitchClass)
      .flatMap((pitchClass) =>
        ladder
          .map((note, index) => ({ note, index }))
          .filter((entry) => ((entry.note % 12) + 12) % 12 === pitchClass),
      )
    if (starts.length === 0) return { notes: [], shape: [] }

    /*
      Cụm rải chiếm khoảng một quãng tám rưỡi tính từ nốt mở. Chọn chỗ mở còn đủ
      chỗ trèo lên, nếu không thì mẫu leo tới trần rồi tắt giữa chừng.
    */
    const roomy = starts.filter((entry) => entry.note + 17 <= high)
    const pool = roomy.length > 0 ? roomy : starts
    const begin = pool.reduce((best, entry) =>
      Math.abs(entry.note - from) < Math.abs(best.note - from) ? entry : best,
    )

    /*
      Cụm rải là **chồng quãng ba**, dựng từ chính bậc thang chứ không cộng bừa
      ba nửa cung: quãng ba trong gam lúc là ba nửa cung, lúc là bốn. Bước qua
      nốt kề rồi lấy nốt sau nó, và bỏ nốt nào chỉ cách một nửa cung — đó là nốt
      lướt thêm vào của gam bebop, không phải một bậc của chồng quãng ba.
    */
    const arpeggio: number[] = [begin.index]
    while (arpeggio.length < 4) {
      const current = arpeggio[arpeggio.length - 1]
      let next = current + 1
      while (next < ladder.length && ladder[next] - ladder[current] < 3) next += 1
      if (next >= ladder.length) break
      arpeggio.push(next)
    }
    if (arpeggio.length < 3) return { notes: [], shape: [] }

    /*
      Type 1 rải lên trước, Type 2 gam xuống trước. Chọn theo chỗ nốt vừa chơi
      đứng trong tầm: đang ở dưới thì đi lên trước cho câu mở ra, đang ở trên
      thì buông xuống trước — cùng một cách chọn hướng như mọi mẫu khác.
    */
    const typeOne = directionFrom(from, low, high) > 0

    if (typeOne) {
      // Bốn nốt gam đi xuống, tiếp ngay từ đỉnh cụm rải.
      const down: number[] = []
      let step = arpeggio[arpeggio.length - 1]
      while (down.length < 4 && step - 1 >= 0) {
        step -= 1
        down.push(step)
      }
      return finish([...arpeggio, ...down])
    }

    /*
      Type 2: bốn nốt gam đi xuống **đậu vào nốt hợp âm mở cụm rải**, rồi mới rải
      lên từ chính nốt ấy. Đó là chỗ chữ "landing on a target chord tone" trong
      bài giảng: câu đi xuống không rơi tự do, nó nhắm sẵn chỗ đậu.
    */
    const top = begin.index + 4
    if (top >= ladder.length) return { notes: [], shape: [] }
    const down = [top, top - 1, top - 2, top - 3]
    const steps = [...down, ...arpeggio]

    return finish(steps)

    function finish(line: readonly number[]): LickResult {
      const room = Math.max(4, Math.min(8, Math.round(beats * notesPerBeat)))
      const picked = line.slice(0, room)

    /*
      Nhấn nốt cao nhất của cụm rải — bài giảng nói thẳng, và đó là chỗ chất
      swing nằm. Ở đây đánh dấu bằng cách để nốt ấy KHÔNG mềm, còn mấy nốt gam
      đi xuống thì mềm hơn.
    */
      return {
        notes: evenNotes(picked.map((index) => ladder[index]), startBeat, beats),
        shape: shapeOf(picked),
      }
    }
  },
}

/**
 * Cú quét ngũ cung vắt nhiều quãng tám.
 *
 * Hồng Kông 1 ô nhịp 51-52 và 96-97: lấy một ô **bốn nốt** trong ngũ cung rồi
 * lặp nguyên ô đó lên qua từng quãng tám bằng nốt rất ngắn, ngân đỉnh, xong
 * mới thôi. Ngũ cung ở đây dựng trên **nốt gốc hợp âm** nên cú quét vẫn khớp
 * hoà âm dù chạy rất nhanh.
 */
const pentatonicSweep: Lick = {
  id: 'sweep',
  label: 'Quét ngũ cung',
  source: 'Hồng Kông 1, ô nhịp 51-52 và 96-97',
  minBeats: 2,
  roles: ['opener'],
  inRotation: true,
  build: ({ startBeat, beats, low, high, material, scaleTones, notesPerBeat }) => {
    const pad = [...material]
    for (const tone of scaleTones) {
      if (pad.length >= 4) break
      if (!pad.includes(tone)) pad.push(tone)
    }
    const ladder = ladderOf(pad, low, high)
    if (ladder.length < 4) return { notes: [], shape: [] }

    /*
      Ô tính từ đáy tầm, đúng như bản nhạc bắt cú quét từ dưới lên.

      **Độ dài ô bằng số bậc trong một quãng tám của chính bậc thang đang dùng**,
      chứ không cố định bốn nốt. Ô bốn nốt đúng cho ngũ cung — bốn bậc ngũ cung
      gần trọn một quãng tám nên hai ô liền nhau khép lại mượt. Trên thang âm bảy
      nốt thì bốn bậc mới đi được một quãng năm, nên chỗ nối sang ô sau hụt mất
      một quãng năm: đo được một cú nhảy **7 nửa cung nằm giữa một chuỗi móc kép**
      — tay không với kịp, và đó đúng là chỗ người chơi trượt ngón.
    */
    const perOctave = ladder.findIndex((note) => note >= ladder[0] + 12)
    const cellSize = perOctave > 0 ? Math.min(perOctave, 8) : 4
    const sweep: MidiNote[] = []
    for (let octave = 0; octave < 6; octave += 1) {
      for (let index = 0; index < cellSize; index += 1) {
        const note = ladder[index + octave * cellSize]
        if (note === undefined || note > high) break
        sweep.push(note)
      }
    }
    if (sweep.length === 0) return { notes: [], shape: [] }

    const want = Math.max(sweep.length, Math.round(beats * notesPerBeat))
    let tip = sweep[sweep.length - 1]!
    while (sweep.length < want) {
      const next = ladder.find((note) => note > tip)
      if (next === undefined || next > high) break
      sweep.push(next)
      tip = next
    }

    const runBeats = notesPerBeat >= 3 ? beats * 0.95 : beats * 0.8
    const holdBeats = beats - runBeats
    const step = runBeats / sweep.length

    const notes: LickNote[] = sweep.map((note, index) => ({
      note,
      startBeat: startBeat + index * step,
      durationBeats: step * 0.95,
      soft: false,
    }))

    // Ngân đỉnh, chồng thêm quãng tám dưới cho dày — Hồng Kông 1 ô nhịp 57.
    const peak = sweep[sweep.length - 1]
    notes.push({
      note: peak,
      startBeat: startBeat + runBeats,
      durationBeats: holdBeats * 0.95,
      soft: false,
    })
    if (peak - 12 >= low) {
      notes.push({
        note: peak - 12,
        startBeat: startBeat + runBeats,
        durationBeats: holdBeats * 0.95,
        soft: true,
      })
    }

    return { notes, shape: [] }
  },
}

/**
 * Nhắc lại mô-típ câu trước.
 *
 * Bản *Mơ* cho bằng chứng trực tiếp: giọng trên cùng tay phải ở đoạn giang tấu
 * ô nhịp 41 (`E E E F# A`) gần trùng giai điệu hát ô nhịp 25 (`E E F# A F#`),
 * chỉ dời lên hai quãng tám. Ngẫu hứng ở đây là **nhắc lại chất liệu đã có**
 * chứ không bịa nốt mới.
 *
 * Vì KeyTrain chưa nhận giai điệu bài hát, thứ được nhắc lại là mô-típ do
 * chính câu trước sinh ra — vẫn đúng tinh thần *"tích luỹ mẫu câu ngắn"* ở
 * mục 4 của `pianoimprovnotes.md`. Đường nét giữ nguyên nhưng bậc thang là
 * nốt của **hợp âm mới**, nên câu nhắc lại tự động đổi màu theo hoà âm.
 */
const motifEcho: Lick = {
  id: 'echo',
  label: 'Nhắc lại mô-típ',
  source: 'Mơ, ô nhịp 25 và 41 — giai điệu được nhắc lại ở tầm cao hơn',
  minBeats: 1.5,
  roles: ['middle'],
  inRotation: true,
  build: ({ startBeat, beats, from, low, high, previousShape, material }) => {
    if (previousShape.length === 0) return { notes: [], shape: [] }

    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    // Bật lại ở biên chứ không kẹp, kẻo mô-típ nhắc lại thành một dãy nốt trùng.
    const steps = walkSteps(ladder, nearestStep(ladder, from), previousShape)

    return {
      notes: evenNotes(steps.map((step) => ladder[step]), startBeat, beats),
      shape: shapeOf(steps),
    }
  },
}

/**
 * Buông nốt dẫn hướng để giải quyết về hợp âm sau.
 *
 * vòng ii-V-I (mục 2 của tài liệu 12 giọng, nay đã gộp vào `52 Piano Jazz Blues Licks.mxl`) nói vòng ii-V-I là *"nền tảng quan trọng nhất để
 * luyện lick jazz — hầu hết lick jazz kinh điển đều được xây dựng trên
 * progression này"*. Thứ làm nên sức hút của vòng đó là **nốt dẫn hướng**: bậc
 * bảy thứ của hợp âm át nằm ngay trên bậc ba của chủ âm đúng một nửa cung, nên
 * chỉ cần buông xuống là giải quyết.
 *
 * Mẫu này đi xuống rồi **kết đúng ở nốt bậc bảy**, để nốt mở đầu của hợp âm
 * sau rơi thẳng vào bậc ba. Chỉ dùng khi hợp âm kế tiếp cách một quãng bốn đi
 * lên — tức đúng chỗ V về I.
 */
const guideTone: Lick = {
  id: 'guide-tone',
  label: 'Buông nốt dẫn hướng về hợp âm sau',
  source: 'Vòng ii-V-I — nốt dẫn hướng, xác nhận lại bằng 52 Piano Jazz Blues Licks.mxl',
  minBeats: 1.5,
  /*
    Chỉ dùng ở **cuối câu**, nên nó không tranh chỗ với các mẫu chạy giữa câu.
    Đó cũng là chỗ nó có nghĩa: nốt dẫn hướng chỉ đáng buông khi ngay sau nó có
    một hợp âm để giải quyết vào.
  */
  roles: ['ending'],
  inRotation: true,
  build: ({ chord, startBeat, beats, from, low, high, material, notesPerBeat }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    /*
      Bậc bảy của hợp âm — thứ hay trưởng đều được. Hợp âm ba không có bậc bảy
      thì cũng không có nốt dẫn hướng, nên lùi về kết ở nốt ổn định như thường.
    */
    const seventh = chord.quality.intervals.find((interval) =>
      [10, 11].includes(interval % 12),
    )
    const guide =
      seventh === undefined
        ? stableToneOf(chord)
        : (((chord.root + seventh) % 12) as PitchClass)

    const count = Math.max(2, Math.min(5, Math.round(beats * notesPerBeat)))
    const steps = walkSteps(
      ladder,
      nearestStep(ladder, from),
      Array.from({ length: count - 1 }, () => -1),
    )

    landOn(ladder, steps, guide)

    return {
      notes: evenNotes(steps.map((step) => ladder[step]), startBeat, beats),
      shape: shapeOf(steps),
    }
  },
}

/**
 * Kẹp nốt đích từ hai phía rồi rơi vào giữa.
 *
 * Đo trên `Reference/52 Piano Jazz Blues Licks.mxl` (637 nốt tay phải) cho một
 * con số bất ngờ: **35% mọi bước đi trong tập lick đó là nửa cung**. Đó là
 * khác biệt lớn nhất giữa ngôn ngữ jazz thật và câu nhạc chỉ đi trong hợp âm —
 * chất bebop nằm ở đám nốt ngoài hợp âm nối giữa các nốt trong hợp âm.
 *
 * Mẫu này dùng cách kẹp kinh điển: chạm **trên nửa cung**, rồi **dưới nửa
 * cung**, rồi mới vào nốt đích. Hai nốt kẹp đánh nhẹ hơn vì chúng chỉ dẫn
 * đường; nốt đích vẫn là nốt của hợp âm nên hoà âm không bị lung lay.
 */
const enclosure: Lick = {
  id: 'enclosure',
  label: 'Kẹp nửa cung hai phía',
  source: '52 Piano Jazz Blues Licks — 35% bước đi là nửa cung',
  minBeats: 2,
  roles: ['middle'],
  inRotation: true,
  build: ({ startBeat, beats, from, low, high, material, notesPerBeat }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    const sign = directionFrom(from, low, high)
    const walked = walkSteps(ladder, nearestStep(ladder, from), [
      2 * sign,
      1 * sign,
    ])

    /*
      Bớt nốt ĐÍCH khi câu cần thưa, đừng bớt ba nốt của chính hình kẹp.

      Hình này là ba nốt cho một đích: trên, dưới, rồi vào đích. Cắt trong ba
      nốt ấy là hỏng hình — nó không còn kẹp nữa. Chỗ co giãn được là SỐ ĐÍCH:
      một đích vẫn là một câu kẹp đàng hoàng, ba đích là một chuỗi.

      Trước đây `build` không nhận `notesPerBeat` một lần nào, nên lick này ra
      đúng chín nốt bất kể mật độ. Nó chạy ở nhánh giang tấu, và đó chính là lý
      do nút chỉnh mật độ ở đoạn giang tấu không có tác dụng gì: đo ra `sparse`,
      `medium` và `dense` cho ra từng nốt trùng khít.

      Chia đôi để mức `medium` giữ nguyên ba đích như cũ — bài đang chạy không
      đổi một nốt nào; chỉ `sparse` mới rút bớt.
    */
    const room = Math.round((beats * notesPerBeat) / 2)
    const targets = walked.slice(0, Math.max(1, Math.min(walked.length, room)))

    const notes: LickNote[] = []
    // Mỗi nốt đích chiếm ba suất: trên, dưới, rồi chính nó.
    const slot = beats / (targets.length * 3)

    targets.forEach((target, index) => {
      const note = ladder[target]
      const at = startBeat + index * slot * 3
      const isLast = index === targets.length - 1

      notes.push({
        note: note + 1,
        startBeat: at,
        durationBeats: slot * 0.85,
        soft: true,
      })
      notes.push({
        note: note - 1,
        startBeat: at + slot,
        durationBeats: slot * 0.85,
        soft: true,
      })
      notes.push({
        note,
        startBeat: at + slot * 2,
        durationBeats: slot * (isLast ? 2.5 : 0.9),
        soft: false,
      })
    })

    return { notes, shape: shapeOf(targets) }
  },
}

/**
 * Chùm ba — ba nốt đều nhau trong một phách.
 *
 * Hai nguồn nói cùng một điều. `pianoimprovnotes.md` mục 4: *"đa dạng hình
 * nốt: xen kẽ móc đơn đều và chùm ba để tránh đều đều máy móc"*. Và đo trên
 * tập 52 lick thì **17% số nốt có độ dài đúng một phần ba phách** — chùm ba
 * là hình nốt phổ biến thứ hai sau móc đơn (53%).
 *
 * Đây là mẫu duy nhất phá khung chia đều, nên nó là thứ làm đoạn solo bớt
 * cảm giác máy móc nhất.
 */
const tripletRun: Lick = {
  id: 'triplet',
  label: 'Chùm ba',
  source:
    'pianoimprovnotes.md mục 4, và 17% nốt trong 52 Piano Jazz Blues Licks là chùm ba',
  minBeats: 2,
  roles: ['opener', 'middle'],
  inRotation: true,
  // Ba nốt đều nhau trong một phách thì không nốt nào rơi vào lưới móc kép.
  offGrid: true,
  build: ({ startBeat, beats, from, low, high, material }) => {
    const ladder = ladderOf(material, low, high)
    if (ladder.length === 0) return { notes: [], shape: [] }

    const sign = directionFrom(from, low, high)
    // Mỗi phách một chùm ba, chừa phách cuối cho nốt kết ngân dài.
    const groups = Math.max(1, Math.floor(beats) - 1)
    // `walkSteps` trả về số bước cộng một, nên bớt một để tổng chia hết cho ba.
    const steps = walkSteps(
      ladder,
      nearestStep(ladder, from),
      Array.from({ length: groups * 3 - 1 }, () => sign),
    )

    const notes: LickNote[] = []
    const third = 1 / 3

    steps.forEach((step, index) => {
      const isLast = index === steps.length - 1
      notes.push({
        note: ladder[step],
        startBeat: startBeat + index * third,
        durationBeats: (isLast ? beats - index * third : third) * 0.9,
        soft: false,
      })
    })

    return { notes, shape: shapeOf(steps) }
  },
}

/**
 * Nghỉ lấy hơi — một "mẫu câu" không có nốt nào.
 *
 * `pianoimprovnotes.md` mục 4 gọi đây là chơi như hội thoại, và mục 3.4 xếp
 * *"cho phép chèn khoảng lặng"* thành hẳn một giai đoạn luyện tập. Coi khoảng
 * nghỉ là một mẫu câu ngang hàng với các mẫu khác thì nó mới được chọn đều
 * đặn, thay vì chỉ còn là chỗ thừa ở cuối câu.
 */
const breath: Lick = {
  id: 'breath',
  label: 'Nghỉ lấy hơi',
  source: 'pianoimprovnotes.md mục 4 và 3.4 giai đoạn 4',
  minBeats: 1,
  roles: ['rest'],
  inRotation: true,
  build: () => ({ notes: [], shape: [] }),
}

/**
 * Bọc một mẫu câu để bảo đảm nó không tràn khỏi thời lượng của hợp âm.
 *
 * Đặt ở đây chứ không để từng mẫu tự lo, vì đây là bất biến của cả module: mẫu
 * nào cũng phải tuân, kể cả mẫu viết thêm sau này.
 */
function bounded(lick: Lick): Lick {
  return {
    ...lick,
    build: (context) => {
      const built = lick.build(context)
      const placed = lick.offGrid
        ? built.notes
        : snapToGrid(built.notes, context.startBeat, context.beats)

      return {
        ...built,
        notes: fitWithin(placed, context.startBeat, context.beats),
      }
    },
  }
}

/**
 * Toàn bộ vốn từ vựng, **theo đúng thứ tự xoay**.
 *
 * Thứ tự trong mảng này quyết định thứ tự các mẫu được chọn qua từng câu và
 * từng lượt giang tấu. Đây là chỗ duy nhất cần sửa khi thêm mẫu mới: khai vai
 * trò và cờ `inRotation` ngay trong mẫu, không phải nhớ thêm vào danh sách nào
 * khác nữa.
 */
export const LICKS: readonly Lick[] = [
  arpeggio,
  chordTonePath,
  scaleRun,
  bebopPair,
  pentatonicSweep,
  neighborTurn,
  approachNotes,
  motifEcho,
  guideTone,
  enclosure,
  tripletRun,
  breath,
].map(bounded)

/**
 * Các mẫu đang dùng được ở một vị trí trong câu nhạc.
 *
 * Suy ra từ chính `LICKS`, nên không thể lệch với định nghĩa mẫu.
 */
export function licksFor(role: LickRole): Lick[] {
  return LICKS.filter((lick) => lick.inRotation && lick.roles.includes(role))
}

/** Mẫu dùng làm chỗ lùi khi mẫu đã chọn không vừa chỗ. */
export function fallbackLick(): Lick {
  return licksFor('ending')[0] ?? LICKS[0]
}

/**
 * Hợp âm sau có nằm quãng bốn đi lên không — tức chỗ V về I.
 *
 * Đây là bước đi trung tâm của hoà âm jazz: vòng quãng bốn (mục 1 của tài liệu 12 giọng đã gỡ) giải thích
 * luôn cả việc nên luyện theo vòng quãng bốn thay vì theo nửa cung, *"vì phần
 * lớn hòa âm jazz di chuyển theo quãng 4"*.
 */
export function resolvesUpFourth(
  chord: ParsedChord,
  next: ParsedChord | null,
): boolean {
  if (!next) return false
  return (next.root - chord.root + 12) % 12 === 5
}

export function getLick(id: string): Lick | undefined {
  return LICKS.find((lick) => lick.id === id)
}
