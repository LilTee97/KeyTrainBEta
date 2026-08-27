import type { MidiNote } from '../../shared/musicTheory/types'
import {
  LEFT_HAND_HIGH,
  LEFT_HAND_LOW,
  clampToHandRegister,
  settleHands,
  type TwoHandVoicing,
} from '../voicingGenerator/handSplitVoicing'
import type { HitVoice, RhythmCell, StylePattern, TimelineEvent } from './types'

/**
 * Biến chuỗi thế bấm hai tay thành dòng thời gian các tiếng đàn.
 *
 * - Điệu có `cell`: lặp mẫu cố định (ballad Khá Bự, bossa, valse, swing).
 * - renderBlockChords chỉ còn cho trường hợp cell=null.
 */

/** Lực nhấn chuẩn của tiếng đàn trong phần đệm. */
const BASE_VELOCITY = 80

/** Tay trái đánh nhẹ hơn tay phải để giai điệu và hợp âm nổi lên trên. */
const LEFT_HAND_SCALE = 0.85

export interface RenderOptions {
  /** Số phách mỗi hợp âm chiếm. Mặc định trọn một ô nhịp. */
  beatsPerChord?: number
  /**
   * Số phách của **từng** hợp âm, khi chúng không dài bằng nhau.
   *
   * Cần cho hợp âm lướt: chúng mượn nửa sau ô nhịp của hợp âm đứng trước chứ
   * không chiếm trọn một ô như hợp âm chính. Bỏ trống thì mọi hợp âm dài bằng
   * `beatsPerChord`.
   */
  beatsEach?: readonly number[]
  /** Cắt bớt độ ngân để hai hợp âm liền nhau không chồng tiếng. */
  releaseRatio?: number
  /**
   * Các hợp âm mà **ô nhịp cuối** của chúng không quạt hợp âm nữa.
   *
   * Dùng cho ô nối sang đoạn mới: ô đó dành trọn cho một câu chạy ngón, nên
   * phần đệm phải im hẳn — cả hợp âm lẫn nốt bass — không thì câu chạy vừa bị
   * lấp vừa nghe dày.
   *
    * Lọc sau khi dựng chứ không cài vào từng nhánh dựng, để **mọi điệu đều
    * theo**: điệu có mẫu tiết tấu cố định cũng phải nhường ô đó như ballad.
    *
    * `Map` thì value là số phách đầu ô nối **vẫn đệm** (hợp âm chơi rồi mới
    * chạy ngón). `Set` = im cả ô.
    */
  barsWithoutComping?: ReadonlySet<number> | ReadonlyMap<number, number>
  /** Im đệm trong các khoảng phách này — cắt cả nốt ngân sang. */
  muteWindows?: readonly { from: number; to: number }[]
  /** Đổi mẫu theo từng ô nhịp (ballad Khá Bự: verse/pre/chorus). */
  cellAt?: (beat: number) => RhythmCell
  /**
   * Những mốc phách **bắt buộc mở ô nhịp mới**, thường là chỗ vào đoạn mới.
   *
   * Không có nó thì một ô nhịp dài tràn qua ranh giới đoạn, và mẫu của đoạn sau
   * phải chờ hết ô mới được vào — với ô nhịp bốn ô thì trễ tới bốn nhịp, nghe ra
   * đúng là đổi nhầm chỗ. Có nó thì ô đang chạy bị cắt đúng vạch, phần thừa bỏ
   * đi, và đoạn mới mở ô của mình từ đầu.
   */
  cellBreaks?: readonly number[]
}

function clampVelocity(value: number): number {
  return Math.max(1, Math.min(127, Math.round(value)))
}

/**
 * Chọn nốt cho một tiếng đàn: cả hợp âm, hay chỉ nốt trên cùng hoặc dưới cùng.
 *
 * Điệu swing cần lấy riêng nốt trên cùng cho những tiếng ở chỗ nảy — đó chính
 * là phần "nốt đơn" xen kẽ giữa các hợp âm.
 */
function pickTone(
  notes: readonly MidiNote[],
  toneIndex: number,
  semitones = 0,
): MidiNote {
  const index = ((toneIndex % notes.length) + notes.length) % notes.length
  return (notes[index] + semitones) as MidiNote
}

/**
 * Nốt **theo bậc hợp âm**, đặt vào đúng tầm của thế bấm đang chơi.
 *
 * Đây là chỗ sửa một lỗi nghe rất rõ. Con số trong ô nhịp vốn nghĩa là "nốt thứ
 * mấy **trong thế bấm**", mà thế bấm sắp theo cao độ và đã được tô màu. Trên
 * hợp âm `Cadd2` thế bấm là `C4 D4 E4 G4`, nên `2` ra nốt Rê — bậc chín — chứ
 * không phải bậc ba. Câu rải định đi 1-3-5 hoá ra đi Đô - Rê - Mi, một chùm
 * liền bậc đập vào nốt màu; đó chính là tiếng chói người dùng nghe thấy. Trên
 * `Am9` bấm `E3 G3 B3` còn tệ hơn: `1` ra nốt Mi, câu rải không chạm nốt La lần
 * nào.
 *
 * Hậu tố `r` đổi con số sang **bậc của hợp âm**: 1 gốc, 2 bậc ba, 3 bậc năm, 4
 * bậc bảy. Bậc được dò trong chính các nốt đang vang, nên hợp âm thứ ra bậc ba
 * thứ, hợp âm át ra bậc bảy thứ, không phải đoán.
 *
 * Bậc cần tìm không có mặt trong thế bấm — ví dụ đòi bậc bảy trên hợp âm ba nốt
 * — thì lùi về nốt gốc, chứ không lấy bừa một nốt bên cạnh.
 */
/**
 * Quãng của từng bậc, và **đường lùi** khi bậc ấy không có trong thế bấm.
 *
 * Thế bấm rút gọn hay thiếu bậc: `Am9` thường bấm `E G B` — bậc năm, bậc bảy,
 * bậc chín, **không có bậc ba**. Đòi bậc ba ở đó mà lùi về nốt gốc thì cả câu
 * rải đập đúng một nốt; đo ra "La - La - Mi - La", nghe như đàn hỏng phím.
 *
 * Nên bậc ba thiếu thì lùi về **bậc bảy** chứ không về bậc năm: bậc năm đã có
 * chỗ của nó ở con số kế tiếp, lùi vào đó là hai con số ra cùng một nốt.
 */
const DEGREE_CHAIN: Readonly<Record<number, readonly (readonly number[])[]>> = {
  // Bậc ba: quãng ba trưởng hoặc thứ, lùi về bậc bảy, rồi bậc năm.
  1: [[4, 3], [10, 11], [7, 6, 8]],
  // Bậc năm: đúng hoặc giảm hoặc tăng, lùi về bậc bảy, rồi bậc ba.
  2: [[7, 6, 8], [10, 11], [4, 3]],
  // Bậc bảy: thứ hoặc trưởng, lùi về bậc năm.
  3: [[10, 11], [7, 6, 8]],
}

const LEFT_ARPEGGIO_LOW = 36
const LEFT_ARPEGGIO_HIGH = 60

function degreeTone(
  notes: readonly MidiNote[],
  rootPc: number,
  toneIndex: number,
  semitones = 0,
  near?: MidiNote,
  soundingNotes: readonly MidiNote[] = notes,
  register?: { low: number; high: number },
): MidiNote {
  const floor = notes[0]
  const sounding = new Set(soundingNotes.map((note) => ((note % 12) + 12) % 12))

  /*
    Nốt gốc **không bao giờ lùi**. Nó có thể vắng mặt ở tay phải — thế bấm rút
    gọn hay bỏ nó cho tay trái giữ — nhưng nó vẫn là nốt gốc của hợp âm, và câu
    rải mở bằng nó mới nghe ra đã vào hợp âm.
  */
  let pitchClass = rootPc

  if (toneIndex > 0) {
    let found: number | null = null
    for (const group of DEGREE_CHAIN[toneIndex] ?? []) {
      for (const step of group) {
        if (sounding.has((rootPc + step) % 12)) {
          found = (rootPc + step) % 12
          break
        }
      }
      if (found !== null) break
    }
    const ideal = DEGREE_CHAIN[toneIndex]?.[0]?.[0] ?? 0
    pitchClass = found ?? (rootPc + ideal) % 12
  }

  const baseFloor = register?.low ?? floor
  const step = (((pitchClass - (baseFloor % 12)) % 12) + 12) % 12
  const placed = baseFloor + step + semitones

  /*
    Bè trầm **đi lên từ nốt gốc**, không bám quãng tám gần nốt vừa chơi.

    Luật "quãng tám gần nhất" ở dưới viết cho câu rải tay phải, nơi cái cần là
    hai nốt liền nhau đừng nhảy cóc. Áp nó cho bè trầm thì hỏng hoà âm: từ La
    quãng tám 2, bậc năm Mi có hai chỗ đứng — Mi trầm hơn (cách 5 nửa cung) và
    Mi cao hơn (cách 7). Luật gần nhất chọn Mi TRẦM, tức bậc năm nằm **dưới**
    nốt gốc. Tai nghe ra hợp âm đã đảo, như đổi sang hợp âm khác, chứ không nghe
    ra bè trầm của hợp âm cũ. Đo trên Am: A2(45) ra E2(40), đi xuống quãng bốn.

    Thế 1-5-8-10 của đệm hát đi **lên**: gốc, rồi bậc năm trên gốc, rồi quãng
    tám, rồi bậc mười. Đã đối chiếu với video Slow Rock bài 9 của thầy Đức Thịnh
    (nguồn `duc-thinh-bai-09-slow-rock` bên PianoBrain): bè trầm đi lên một quãng
    năm, không đi xuống một quãng bốn.

    `floor` là nốt bass thật của thế bấm, nên nó là mốc neo. Chọn quãng tám thấp
    nhất còn **nằm trên** mốc ấy. Chỉ áp khi có `register` — tức chỉ tay trái;
    tay phải giữ nguyên luật cũ.
  */
  if (register && toneIndex > 0) {
    let above: number | null = null
    for (let octave = -4; octave <= 4; octave += 1) {
      const candidate = placed - semitones + octave * 12
      if (candidate <= floor || candidate > register.high) continue
      if (above === null || candidate < above) above = candidate
    }
    if (above !== null) return (above + semitones) as MidiNote
  }

  if (near === undefined) return placed as MidiNote

  /*
    Đặt nốt vào quãng tám **gần nốt vừa chơi nhất**.

    Không có bước này thì mọi nốt bị neo vào đáy thế bấm, và thế bấm nằm thấp
    là câu rải nhảy cóc: đo trên `Fadd2` bấm `A2 C3 F3 G3` ra một bước chín nửa
    cung giữa hai nốt liền nhau — tay phải với hụt. Câu rải là để một bàn tay
    chơi liền mạch, nên nốt sau phải rơi cạnh nốt trước.

    Ký hiệu `+` vẫn giữ nghĩa "cao hơn một quãng tám": nó được cộng vào **sau**
    khi đã chọn quãng tám gần nhất, nên câu vẫn với lên được khi cần.
  */
  /*
    Chỉ chọn trong tầm tay phải.

    Chọn xong mới để `clampToHandRegister` kéo lên thì hỏng đúng thứ vừa làm:
    nốt La quãng tám 3 nằm dưới sàn nên bị đẩy lên La quãng tám 4, và bước đang
    là quãng ba đi xuống hoá thành bước chín nửa cung đi lên. Lọc sẵn ở đây thì
    không có gì để kéo.
  */
  const low = register?.low ?? RIGHT_ARPEGGIO_LOW
  const high = register?.high ?? RIGHT_ARPEGGIO_HIGH
  const target = near ?? placed
  const base = placed - semitones
  let best: number | null = null
  for (let octave = -4; octave <= 4; octave += 1) {
    const candidate = base + octave * 12
    if (candidate < low || candidate > high) continue
    if (best === null || Math.abs(candidate - target) < Math.abs(best - target)) {
      best = candidate
    }
  }
  return ((best ?? base) + semitones) as MidiNote
}

/*
  Tầm câu rải tay phải. Trùng với tầm `clampToHandRegister` cho tay phải, để
  chọn xong là dùng được luôn, không bị kéo lệch.
*/
const RIGHT_ARPEGGIO_LOW = 60
const RIGHT_ARPEGGIO_HIGH = 79

function notesForVoice(
  notes: readonly MidiNote[],
  voice: HitVoice = 'chord',
  toneIndex?: number,
  tones?: readonly {
    toneIndex: number
    semitones?: number
    fromRoot?: boolean
  }[],
  rootPc?: number,
  near?: MidiNote,
  soundingNotes?: readonly MidiNote[],
  register?: { low: number; high: number },
): MidiNote[] {
  if (notes.length === 0) return []
  if (tones?.length) {
    let here = near
    return tones.map((spec) => {
      const note =
        spec.fromRoot && rootPc !== undefined
          ? degreeTone(
              notes,
              rootPc,
              spec.toneIndex,
              spec.semitones ?? 0,
              here,
              soundingNotes ?? notes,
              register,
            )
          : pickTone(notes, spec.toneIndex, spec.semitones ?? 0)
      here = note
      return note
    })
  }
  if (toneIndex !== undefined) {
    return [pickTone(notes, toneIndex)]
  }

  switch (voice) {
    case 'top':
      return [notes[notes.length - 1]]
    case 'bottom':
      return [notes[0]]
    default:
      return [...notes]
  }
}

/** Cú đẩy nằm cách vạch nhịp sau **nửa phách**, tức phách 4,5 của ô bốn bốn. */
const PUSH_BEFORE_BAR = 0.5

/**
 * Nhánh block chords (dùng khi style.cell === null).
 */
function renderBlockChords(
  voicings: readonly TwoHandVoicing[],
  durations: readonly number[],
  starts: readonly number[],
  beatsPerMeasure: number,
  releaseRatio: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  /** Một tiếng hai tay cùng lúc, dùng cho hợp âm ngắn hơn một ô nhịp. */
  const strikeBoth = (
    voicing: TwoHandVoicing,
    at: number,
    beats: number,
    emphasis: number,
  ) => {
    events.push({
      notes: voicing.right,
      startBeat: at,
      durationBeats: beats * releaseRatio,
      hand: 'right',
      velocity: clampVelocity(BASE_VELOCITY * emphasis),
    })

    events.push({
      notes: voicing.left,
      startBeat: at,
      durationBeats: beats * releaseRatio,
      hand: 'left',
      velocity: clampVelocity(BASE_VELOCITY * emphasis * LEFT_HAND_SCALE),
    })
  }

  voicings.forEach((voicing, index) => {
    const chordStart = starts[index]
    const chordBeats = durations[index]
    const measures = Math.floor(chordBeats / beatsPerMeasure)

    /*
      Hợp âm ngắn hơn một ô nhịp — ô đã chia đôi cho hợp âm lướt chẳng hạn —
      thì chỉ một tiếng. Chỗ đó vốn đã dày vì hợp âm đổi nhanh, nhồi đủ ba
      tiếng vào chỉ thành rối.
    */
    if (measures === 0) {
      strikeBoth(voicing, chordStart, chordBeats, 1)
      return
    }

    const half = beatsPerMeasure / 2

    for (let measure = 0; measure < measures; measure += 1) {
      const barStart = chordStart + measure * beatsPerMeasure

      // Nốt thấp nhất của tay trái, đánh trơ một mình ở đầu ô.
      events.push({
        notes: [voicing.left[0]],
        startBeat: barStart,
        durationBeats: half * releaseRatio,
        hand: 'left',
        velocity: clampVelocity(BASE_VELOCITY * LEFT_HAND_SCALE),
      })

      // Hoà âm mở ra ở giữa ô nhịp.
      strikeBoth(voicing, barStart + half, half, 0.85)

      events.push({
        notes: voicing.right,
        startBeat: barStart + beatsPerMeasure - PUSH_BEFORE_BAR,
        durationBeats: PUSH_BEFORE_BAR * releaseRatio,
        hand: 'right',
        // Nhẹ hơn hẳn hai tiếng chính: nó bắc cầu, không phải chỗ nhấn.
        velocity: clampVelocity(BASE_VELOCITY * 0.6),
      })
    }

    // Phần dư không đủ một ô nhịp thì đánh một tiếng cho khỏi trống.
    const tail = chordBeats - measures * beatsPerMeasure
    if (tail > 0) {
      strikeBoth(voicing, chordStart + measures * beatsPerMeasure, tail, 0.85)
    }
  })

  return events
}

/**
 * Nhánh điệu có mẫu tiết tấu cố định: lặp mẫu, mỗi lần lặp lấy thế bấm của hợp
 * âm đang vang tại thời điểm đó.
 */
function inMuteWindow(
  beat: number,
  windows: readonly { from: number; to: number }[] | undefined,
): boolean {
  if (!windows?.length) return false
  return windows.some(
    (window) => beat >= window.from - EPSILON && beat < window.to - EPSILON,
  )
}

function renderWithCell(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  durations: readonly number[],
  starts: readonly number[],
  releaseRatio: number,
  cellAt?: (beat: number) => RhythmCell,
  muteWindows?: readonly { from: number; to: number }[],
  cellBreaks?: readonly number[],
): TimelineEvent[] {
  const fallback = pattern.cell
  if (!fallback && !cellAt) return []

  const totalBeats = starts[starts.length - 1] + durations[durations.length - 1]
  const events: TimelineEvent[] = []

  /** Hợp âm thứ mấy đang vang tại một thời điểm, khi chúng dài ngắn khác nhau. */
  const indexAt = (beat: number) => {
    for (let index = starts.length - 1; index >= 0; index -= 1) {
      if (beat >= starts[index] - 0.0001) return index
    }
    return 0
  }
  const voicingAt = (beat: number) => voicings[indexAt(beat)]

  /*
    Hợp âm **ngắn hơn một ô nhịp** phải nghe ra được nốt gốc của nó.

    Đó gần như luôn là hợp âm lướt: nó chen vào giữa hai hợp âm chính và cả lý
    do nó tồn tại là **bước đi của bè trầm**. Mẫu tiết tấu thì không biết chuyện
    ấy — nó cứ chạy theo ô của mình, và nếu ô rơi trúng chỗ đánh quãng năm thì
    hợp âm lướt chỉ vang lên bằng quãng năm. Đo trên `pop-1` với vòng có chèn
    ii-V phụ: hợp âm lướt gốc Mi chỉ phát ra nốt Si, tức bước bass biến mất và
    người nghe không hiểu vì sao có hợp âm ấy.

    Chỉ ép **tiếng bass đầu tiên** của ô ngắn. Mấy tiếng sau vẫn theo mẫu, nên
    tiết tấu của điệu không suy suyển.
  */
  const rootForced = new Set<number>()

  /*
    Bước nhảy lấy theo **ô nhịp đang dùng**, không phải theo ô nhịp mặc định.

    Trước đây bước nhảy cố định bằng độ dài `pattern.cell`. Lúc mọi ô nhịp dài
    như nhau thì không sao, nhưng khi `cellAt` trả về ô nhịp khác cho đoạn điệp
    khúc — và bản điệp khúc thường ngắn hơn bản phiên khúc — thì phần dôi ra bị
    bỏ trống, đoạn điệp khúc mất tiếng.

    `cellBreaks` là mốc **bắt buộc mở ô mới**, thường là chỗ vào một đoạn mới.
    Không có nó thì ô nhịp cũ tràn qua ranh giới đoạn, và bản điệp khúc phải chờ
    hết ô mới được vào — chậm mất mấy nhịp, nghe như đổi nhầm chỗ.
  */
  const nextBreak = (after: number): number => {
    let soonest = Infinity
    for (const mark of cellBreaks ?? []) {
      if (mark > after + EPSILON && mark < soonest) soonest = mark
    }
    return soonest
  }

  for (let offset = 0; offset < totalBeats; ) {
    const cell = cellAt?.(offset) ?? fallback
    if (!cell) break

    const until = Math.min(offset + cell.lengthBeats, nextBreak(offset))

    for (const hand of ['right', 'left'] as const) {
      const hits = hand === 'right' ? cell.right : cell.left
      /*
        Nốt vừa chơi của bàn tay này, để nốt kế tiếp rơi cạnh nó thay vì nhảy về
        đáy thế bấm. Đặt lại ở mỗi ô nhịp: mở ô mới là mở câu mới.
      */
      let near: MidiNote | undefined

      for (const hit of hits) {
        const startBeat = offset + hit.beat
        if (startBeat >= totalBeats) continue
        // Ô bị cắt ngắn ở ranh giới đoạn: phần thừa thuộc về đoạn sau, bỏ đi.
        if (startBeat >= until - EPSILON) continue
        if (inMuteWindow(startBeat, muteWindows)) continue

        const voicing = voicingAt(startBeat)
        if (!voicing) continue

        const source = hand === 'right' ? voicing.right : voicing.left
        /*
          Nốt gốc lấy từ nốt bass của tay trái: đó là nốt đáy của hợp âm, kể cả
          khi tay phải đang bấm thể đảo.
        */
        const rootPc =
          voicing.left.length > 0
            ? ((Math.min(...voicing.left) % 12) + 12) % 12
            : undefined
        const raw = notesForVoice(
          source,
          hit.voice,
          hit.toneIndex,
          hit.tones,
          rootPc,
          near,
          [...voicing.left, ...voicing.right],
          hand === 'left'
            ? { low: LEFT_ARPEGGIO_LOW, high: LEFT_ARPEGGIO_HIGH }
            : undefined,
        )
        const split = settleHands(
              hand === 'left' ? raw : voicing.left,
              hand === 'right' ? raw : voicing.right,
            )
        let notes = hand === 'left' ? split.left : split.right

        if (hand === 'left') {
          const index = indexAt(startBeat)
          // Ngắn hơn ô nhịp của chính mẫu đang chạy, chứ không phải một con số cứng.
          const short = durations[index] < (cellAt?.(startBeat) ?? fallback!).lengthBeats - EPSILON
          if (short && !rootForced.has(index)) {
            rootForced.add(index)
            const bass = voicing.left.length > 0 ? Math.min(...voicing.left) : undefined
            if (bass !== undefined && !notes.includes(bass)) notes = [bass]
          }
        }
        const handScale = hand === 'left' ? LEFT_HAND_SCALE : 1

        if (notes.length > 0) near = notes[notes.length - 1]

        events.push({
          notes,
          startBeat,
          durationBeats: hit.durationBeats * releaseRatio,
          hand,
          velocity: clampVelocity(
            BASE_VELOCITY * (hit.velocityScale ?? 1) * handScale,
          ),
        })
      }
    }

    offset = until
  }

  return [
    ...events,
    ...missingChordHits(events, voicings, starts, releaseRatio).filter(
      (event) => !inMuteWindow(event.startBeat, muteWindows),
    ),
  ]
}

/** Sai số khi so mốc phách, tránh lỗi làm tròn số thực. */
const EPSILON = 0.001

/**
 * Bù tiếng đàn cho những hợp âm mà mẫu tiết tấu bỏ sót.
 *
 * Mẫu tiết tấu cố định đánh vào **vị trí cố định trong ô nhịp**, còn hợp âm
 * lướt thì đổi ở giữa ô. Hai thứ không biết nhau, nên hợp âm lướt có thể trôi
 * qua mà không được đánh tiếng nào.
 *
 * Đo trên vòng `C Am F G` sau khi chèn ba vòng hai-năm lướt: điệu swing đánh
 * bass ở phách 0, 4, 8, 12 trong khi hợp âm đổi ở phách 0, 2, 3, 4, 6, 7, 8,
 * 10, 11, 12 — **sáu trên mười hợp âm không có nốt bass nào**. Người dùng nghe
 * ra đúng là mất tiếng bass.
 *
 * Bù một tiếng ngay tại chỗ đổi hợp âm cho tay nào đang bị bỏ sót. Hợp âm được
 * chèn vào là để **nghe thấy**; không đánh tiếng nào thì chèn làm gì.
 */
function missingChordHits(
  events: readonly TimelineEvent[],
  voicings: readonly TwoHandVoicing[],
  starts: readonly number[],
  releaseRatio: number,
): TimelineEvent[] {
  const extra: TimelineEvent[] = []

  voicings.forEach((voicing, index) => {
    const chordStart = starts[index]
    const chordEnd = starts[index + 1] ?? Number.POSITIVE_INFINITY

    for (const hand of ['right', 'left'] as const) {
      const covered = events.some(
        (event) =>
          event.hand === hand &&
          event.startBeat >= chordStart - EPSILON &&
          event.startBeat < chordEnd - EPSILON,
      )
      if (covered) continue

      const notes = hand === 'right' ? voicing.right : voicing.left
      if (notes.length === 0) continue

      // Ngân tới hết phần thời gian của hợp âm, hoặc tới tiếng kế tiếp.
      const nextHit = events
        .filter((event) => event.startBeat > chordStart + EPSILON)
        .reduce(
          (soonest, event) => Math.min(soonest, event.startBeat),
          Number.POSITIVE_INFINITY,
        )
      const until = Math.min(chordEnd, nextHit)

      extra.push({
        notes,
        startBeat: chordStart,
        durationBeats:
          Math.max(0.25, until - chordStart) * releaseRatio,
        hand,
        velocity: clampVelocity(
          BASE_VELOCITY * (hand === 'left' ? LEFT_HAND_SCALE : 1),
        ),
      })
    }
  })

  return extra
}

/**
 * Cắt độ ngân để không tiếng nào vang sang hợp âm sau.
 *
 * Cùng lý do: mẫu tiết tấu ghi độ ngân theo ô nhịp, không biết hợp âm đổi giữa
 * chừng. Bass của hợp âm cũ ngân đè lên hợp âm mới vừa làm đục vừa sai hoà âm.
 */
function clipToChords(
  events: readonly TimelineEvent[],
  starts: readonly number[],
): TimelineEvent[] {
  return events.map((event) => {
    const nextStart = starts.find((start) => start > event.startBeat + EPSILON)
    if (nextStart === undefined) return event

    const room = nextStart - event.startBeat
    return event.durationBeats <= room
      ? event
      : { ...event, durationBeats: Math.max(0.05, room) }
  })
}

/** Dựng dòng thời gian cho cả đoạn. */
export function renderPattern(
  voicings: readonly TwoHandVoicing[],
  pattern: StylePattern,
  options: RenderOptions = {},
): TimelineEvent[] {
  const grid = pattern.gridUnit ?? 1
  const {
    beatsPerChord = pattern.beatsPerMeasure * grid,
    beatsEach,
    releaseRatio = pattern.releaseRatio ?? 0.92,
    barsWithoutComping,
    muteWindows,
    cellAt,
    cellBreaks,
  } = options

  if (voicings.length === 0) return []

  /*
    Quy ô nhịp của mẫu về **nốt đen** trước khi dựng. Mọi thứ hạ nguồn — mốc hợp
    âm, cắt độ ngân, xếp lịch — đều tính bằng nốt đen.

    Co ở đây, không co ở `cellAt`: `cellAt` trả về ô nhịp của điệu khác khi đổi
    đoạn, mà điệu ấy có `gridUnit` riêng. Chưa gặp trường hợp đó nên chưa đi trước.
  */
  const scaled: StylePattern =
    grid === 1 || !pattern.cell
      ? pattern
      : {
          ...pattern,
          cell: {
            lengthBeats: pattern.cell.lengthBeats * grid,
            left: pattern.cell.left.map((h) => ({
              ...h,
              beat: h.beat * grid,
              durationBeats: h.durationBeats * grid,
            })),
            right: pattern.cell.right.map((h) => ({
              ...h,
              beat: h.beat * grid,
              durationBeats: h.durationBeats * grid,
            })),
          },
        }

  // Thời lượng từng hợp âm, và phách bắt đầu tính dồn từ đó.
  const durations = voicings.map(
    (_, index) => beatsEach?.[index] ?? beatsPerChord,
  )
  const starts: number[] = []
  let cursor = 0
  for (const beats of durations) {
    starts.push(cursor)
    cursor += beats
  }

  const events = scaled.cell || cellAt
    ? renderWithCell(
        voicings,
        scaled,
        durations,
        starts,
        releaseRatio,
        cellAt,
        muteWindows,
        cellBreaks,
      )
    : renderBlockChords(
        voicings,
        durations,
        starts,
        pattern.beatsPerMeasure,
        releaseRatio,
      )

  const dropped = barsWithoutComping?.size
    ? dropLastMeasure(
        events,
        durations,
        starts,
        pattern.beatsPerMeasure,
        barsWithoutComping,
      )
    : events
  const muted = muteWindows?.length ? applyMuteWindows(dropped, muteWindows) : dropped

  return holdUntilStruckAgain(
    clipToChords(muted, starts).map((event) => ({
      ...event,
      notes: event.notes.map((note) => clampToHandRegister(note, event.hand)),
    })),
  ).sort((a, b) => a.startBeat - b.startBeat)
}

/**
 * Không tiếng nào được **còn ngân khi chính phím ấy bị gõ lại**.
 *
 * Trên đàn thật, gõ lại một phím đang giữ thì búa chưa về chỗ và phím không kêu
 * lại; trong MIDI thì tiếng trước bị cắt ngang hoặc kẹt luôn. Đây là luật của
 * cây đàn, không phải của một điệu nào, nên nó đứng ở đây — sau khi mọi ô nhịp
 * đã dựng xong — chứ không phải sửa trong từng mẫu tiết tấu.
 *
 * Đo ra trên điệu valse: ô `oom-pah-pah` cho tiếng "pah" phách 1 ngân 1,29
 * phách trong khi "pah" sau rơi đúng phách 2 — chồng 0,29 phách, lần nào cũng
 * chồng, ở mọi ô nhịp của mọi bài valse.
 *
 * Chỉ cắt khi **cùng một tay** và **trùng cao độ**. Hai tay chồng nhau là hoà
 * âm; hai cao độ khác nhau chồng nhau là legato. Cả hai đều đúng, không đụng.
 */
export function holdUntilStruckAgain(events: readonly TimelineEvent[]): TimelineEvent[] {
  const order = [...events].sort((a, b) => a.startBeat - b.startBeat)

  return order.map((event) => {
    let duration = event.durationBeats
    for (const other of order) {
      if (other === event || other.hand !== event.hand) continue
      const room = other.startBeat - event.startBeat
      if (room <= EPSILON || room >= duration) continue
      if (other.notes.some((note) => event.notes.includes(note))) duration = room
    }
    return duration === event.durationBeats ? event : { ...event, durationBeats: duration }
  })
}

function applyMuteWindows(
  events: readonly TimelineEvent[],
  windows: readonly { from: number; to: number }[],
): TimelineEvent[] {
  return events.flatMap((event) => {
    const start = event.startBeat
    const end = start + event.durationBeats
    if (windows.some((window) => start >= window.from - EPSILON && start < window.to - EPSILON)) {
      return []
    }
    let until = end
    for (const window of windows) {
      if (start < window.from && end > window.from) {
        until = Math.min(until, window.from)
      }
    }
    const durationBeats = until - start
    if (durationBeats <= 0.05) return []
    return durationBeats === event.durationBeats
      ? [event]
      : [{ ...event, durationBeats }]
  })
}

/** Bỏ các tiếng đàn rơi vào ô nhịp cuối của những hợp âm được chỉ định. */
function dropLastMeasure(
  events: readonly TimelineEvent[],
  durations: readonly number[],
  starts: readonly number[],
  beatsPerMeasure: number,
  chords: ReadonlySet<number> | ReadonlyMap<number, number>,
): TimelineEvent[] {
  const windows: { from: number; to: number }[] = []
  const keep =
    chords instanceof Map
      ? chords
      : new Map([...chords].map((index) => [index, 0]))

  for (const [index, lead] of keep) {
    const start = starts[index]
    const beats = durations[index]
    if (start === undefined || beats < beatsPerMeasure) continue

    const from = start + beats - beatsPerMeasure + Math.max(0, lead)
    if (from >= start + beats) continue
    windows.push({ from, to: start + beats })
  }

  if (windows.length === 0) return [...events]

  return events.filter(
    (event) =>
      !windows.some(
        (window) =>
          event.startBeat >= window.from - 0.001 &&
          event.startBeat < window.to - 0.001,
      ),
  )
}

/** Tổng độ dài của dòng thời gian, tính bằng phách. */
export function timelineLengthBeats(events: readonly TimelineEvent[]): number {
  let last = 0
  for (const event of events) {
    last = Math.max(last, event.startBeat + event.durationBeats)
  }
  return last
}

/** Lọc theo tay, dùng cho chế độ luyện tay trái hoặc tay phải riêng. */
export function eventsForHand(
  events: readonly TimelineEvent[],
  hand: 'left' | 'right' | 'both',
): TimelineEvent[] {
  if (hand === 'both') return [...events]
  return events.filter((event) => event.hand === hand)
}

function overlaps(
  event: TimelineEvent,
  from: number,
  to: number,
): boolean {
  return event.startBeat < to - 0.001 && event.startBeat + event.durationBeats > from + 0.001
}

/**
 * Khi tay phải đang chạy fill / improvise / chạy ngón: bỏ quạt hợp âm tay phải,
 * chuyển khối đó sang tay trái (hạ vào dải bass).
 */
export function giveCompingToLeft(
  accompaniment: readonly TimelineEvent[],
  melody: readonly TimelineEvent[],
  _beatsPerMeasure = 4,
): TimelineEvent[] {
  if (melody.length === 0) return [...accompaniment]

  return accompaniment.map((event) => {
    if (event.hand !== 'right') return event
    const busy = melody.some((line) =>
      overlaps(event, line.startBeat, line.startBeat + line.durationBeats),
    )
    if (!busy) return event

    const notes = event.notes.map((note) => {
      let pitch = note
      while (pitch > LEFT_HAND_HIGH) pitch -= 12
      while (pitch < LEFT_HAND_LOW) pitch += 12
      return pitch as MidiNote
    })
    return { ...event, hand: 'left' as const, notes }
  })
}
