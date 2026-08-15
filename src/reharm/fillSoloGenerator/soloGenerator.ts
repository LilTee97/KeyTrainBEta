import { chordPitchClasses } from '../../shared/musicTheory/chordDefinitions'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { scaleTones } from '../reharmEngine/keyDetection'
import type { TimelineEvent } from '../style/types'
import { chordStarts, beatsOf } from '../chordTiming'
import type { ParsedChord } from '../types'
import type { ApproachDirection, OrnamentDensity } from './graceNoteOrnamenter'
import { densityOption, stepInScale } from './graceNoteOrnamenter'
import type { Lick } from './soloVocabulary'
import {
  LICKS,
  chordBlues,
  chordMaterial,
  chordPentatonic,
  getLick,
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
export function generateFillLine(
  chords: readonly ParsedChord[],
  options: SoloOptions & { fillBeats?: number },
): SoloNote[] {
  const {
    beatsPerChord,
    fillBeats = Math.min(1.5, beatsPerChord / 2),
    direction = 'mixed',
    density = 'medium',
    key = null,
  } = options

  if (chords.length < 2) return []

  const tones = key ? scaleTones(key.tonic, key.scale) : new Set<PitchClass>()
  // Mật độ ở đây quyết định **bao lâu chêm một câu**, không phải bao nhiêu nốt láy.
  const { everyNth } = densityOption(density)
  const fillStarts = chordStarts(chords, beatsPerChord)

  const result: SoloNote[] = []

  for (let index = 0; index < chords.length; index += 1) {
    if (index % everyNth !== 0) continue

    // Hợp âm cuối dẫn về hợp âm đầu, vì vòng được chơi lặp lại.
    const next = chords[(index + 1) % chords.length]
    if (next === chords[index]) continue

    // Nốt đích: nốt đặc trưng nhất của hợp âm kế tiếp.
    const [targetClass] = targetPitchClasses(next, 1)
    const landing = nearestNote(targetClass, MELODY_LOW + 7)

    /*
      Dựng câu fill đi liền bậc **kết thúc ngay cạnh** nốt đích. Ba nốt là đủ
      để nghe ra hướng đi mà không lấn sang phần hát.
    */
    const approachFrom = direction === 'above' ? 'down' : 'up'
    const line: MidiNote[] = [landing]
    for (let step = 0; step < 2; step += 1) {
      line.unshift(stepInScale(line[0], approachFrom === 'up' ? 'down' : 'up', tones))
    }

    const chordEnd = fillStarts[index] + beatsOf(chords[index], beatsPerChord)
    const start = chordEnd - Math.min(fillBeats, beatsOf(chords[index], beatsPerChord) / 2)
    const noteLength = fillBeats / line.length

    line.forEach((note, position) => {
      result.push({
        note,
        startBeat: start + position * noteLength,
        durationBeats: noteLength * 0.9,
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

  // Hợp âm lướt ngắn hơn hợp âm chính, nên phải lấy mốc và thời lượng riêng.
  const starts = chordStarts(chords, beatsPerChord)

  const result: SoloNote[] = []
  let from: MidiNote = SOLO_LOW + 12
  let previousShape: number[] = []

  for (let index = 0; index < chords.length; index += 1) {
    const chord = chords[index]
    const chordBeats = beatsOf(chord, beatsPerChord)
    const phrase = Math.floor(index / phraseChords)
    const positionInPhrase = index % phraseChords
    const isPhraseEnd = positionInPhrase === phraseChords - 1

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
      resolving: resolvesUpFourth(chord, chords[index + 1] ?? null),
    })

    const built = lick.build({
      chord,
      next: chords[index + 1] ?? null,
      startBeat: starts[index],
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
/*
  Vốn mẫu câu **đang dùng thật**.

  Trong `soloVocabulary.ts` còn ba mẫu nữa — nốt dẫn hướng, kẹp nửa cung, chùm
  ba — đã viết xong và có test, nhưng **cố ý chưa đưa vào đây**. Lý do: chúng
  được thêm cả ba cùng một lúc rồi bật lên luôn, và kết quả nghe tệ hơn hẳn bộ
  bảy mẫu đã được duyệt bằng tai. Bật lại thì bật **từng cái một** để còn biết
  cái nào hỏng.
*/
const OPENERS = ['arpeggio', 'chord-tone', 'sweep'] as const

/** Chỉ dùng khi một câu dài từ ba hợp âm trở lên. */
const MIDDLES = ['turn', 'approach', 'echo'] as const

/** Các mẫu câu thật sự được chọn — dùng cho phần hiển thị trên giao diện. */
export const ROTATION_IDS: readonly string[] = [
  ...new Set([...OPENERS, ...MIDDLES, 'chord-tone', 'breath']),
]

/**
 * Chọn mẫu câu cho một hợp âm.
 *
 * Đây là chỗ dựng "câu chuyện" của đoạn solo, theo mục 4 của
 * `pianoimprovnotes.md` — *chơi như hội thoại*. Cách chọn là **tất định**, tức
 * cùng một vòng hợp âm luôn cho ra cùng một đoạn solo: người học cần nghe lại
 * được đúng câu vừa nghe để tập theo, ngẫu nhiên mỗi lần phát thì không tập nổi.
 */
function chooseLick(choice: LickChoice): Lick {
  const {
    phrase,
    positionInPhrase,
    isPhraseEnd,
    playBeats,
    hasMotif,
    density,
    take,
  } = choice

  const pick = (id: string): Lick => {
    const lick = getLick(id)
    // Không đủ chỗ cho mẫu đã chọn thì lùi về mẫu nền tảng, đừng chơi dở dang.
    if (!lick || lick.minBeats > playBeats) {
      return getLick('chord-tone') ?? LICKS[0]
    }
    return lick
  }

  /*
    Kết câu luôn dùng mẫu đi trên nốt hợp âm, vì chỉ mẫu đó kết ở nốt ổn định —
    mục 4: *"tránh dừng ở nốt lơ lửng khiến câu nhạc nghe dở dang"*.
  */
  /*
    Kết câu ở nốt ổn định — mục 4: *"tránh dừng ở nốt lơ lửng khiến câu nhạc
    nghe dở dang"*.

    Có một mẫu `guide-tone` buông nốt dẫn hướng ở đúng chỗ V về I, hợp lý về
    nhạc lý, nhưng chưa được nghe duyệt nên tạm để ngoài.
  */
  if (isPhraseEnd) return pick('chord-tone')

  // Mật độ thưa thì thỉnh thoảng nghỉ hẳn một hợp âm cho câu nhạc thoáng.
  if (density === 'sparse' && positionInPhrase === 1) return pick('breath')

  // Số lượt cộng vào chỗ xoay, nên lượt sau đổi hẳn trình tự mẫu câu.
  const rotation = phrase + take

  if (positionInPhrase === 0) return pick(OPENERS[rotation % OPENERS.length])

  const middle = MIDDLES[(rotation + positionInPhrase) % MIDDLES.length]
  // Chưa có mô-típ nào để nhắc lại thì lùi về hình láy.
  return pick(middle === 'echo' && !hasMotif ? 'turn' : middle)
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
    hand: 'right' as const,
    // Nốt láy đánh nhẹ hơn hẳn, nó chỉ là cái vuốt vào nốt chính.
    velocity: Math.round(note.isGrace ? velocity * 0.6 : velocity),
  }))
}

/** Các nốt của hợp âm, dùng cho phần hiển thị. */
export function chordToneNames(chord: ParsedChord): PitchClass[] {
  return chordPitchClasses(chord.root, chord.quality)
}

export { densityOption }
