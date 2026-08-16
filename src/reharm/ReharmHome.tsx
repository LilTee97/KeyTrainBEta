import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LOOP_PASSES,
  startTimelineLoop,
  stopTimelineLoop,
  useAudioStore,
  usePlaybackStore,
} from '../shared/audio/audioEngine'
import { setBpm, useMetronomeStore } from '../shared/audio/metronome'
import { usePracticeStore } from './playback/practiceStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { chordNotes } from '../shared/musicTheory/chordDefinitions'
import type { MidiNote } from '../shared/musicTheory/types'
import { fitToKeyboard } from '../shared/musicTheory/voicing'
import {
  addSimilarChordPairs,
  chordDurations,
  chordIndexAt,
  mainChordSpans,
  addChordPair,
  pairedChordBeats,
  removeChordPair,
  removeSimilarChordPairs,
  similarChordPairs,
  totalBeatsOf,
} from './chordTiming'
import { parseChordInput } from './input/chordInputParser'
import { transposeChords, transposeLabel } from './transpose'
import { SongTextInput } from './input/SongTextInput'
import { SongSheetView } from './input/SongSheetView'
import type { SectionMark } from './input/songSheet'
import {
  breathChords,
  buildSongSheet,
  resectionSheet,
  sectionChordRanges,
} from './input/songSheet'
import type { ParsedSong } from './input/songTextParser'
import { parseSongText } from './input/songTextParser'
import type { SongSnapshot } from './persistence/songSnapshot'
import { PROGRESSION_PRESETS } from './input/progressionPresets'
import { SongLibrary } from './persistence/SongLibrary'
import { SaveSongButton } from './persistence/SaveSongButton'
import { SongFileButtons } from './persistence/SongFileButtons'
import type {
  ApproachDirection,
  OrnamentDensity,
} from './fillSoloGenerator/graceNoteOrnamenter'
import { DENSITY_OPTIONS } from './fillSoloGenerator/graceNoteOrnamenter'
import type {
  GraceDensity,
  SoloNoteSource,
  TransitionRun,
} from './fillSoloGenerator/soloGenerator'
import {
  NOTE_SOURCE_OPTIONS,
  fillPositions,
  generateFillLine,
  generateSolo,
  soloToTimeline,
} from './fillSoloGenerator/soloGenerator'
import {
  TECHNIQUE_LABELS,
  groupPassingSuggestions,
  groupsAtSlot,
} from './reharmEngine/passingChordRules'
import { keyLabel, orderedKeys } from './reharmEngine/keyDetection'
import { reharmonize } from './reharmEngine/reharmPipeline'
import type {
  ColorIntensity,
  ColorOptionBase,
  DominantChordColor,
  MajorChordColor,
  MinorChordColor,
} from './reharmEngine/staticVoicingRules'
import { conflictsByIndex } from './reharmEngine/colorConflicts'
import {
  DOMINANT_COLOR_OPTIONS,
  MAJOR_COLOR_OPTIONS,
  MINOR_COLOR_OPTIONS,
  PALETTE_BY_TONIC_COLOR,
  bestUpperStructure,
} from './reharmEngine/staticVoicingRules'
import {
  plainSequence,
  totalMovement,
} from './reharmEngine/voiceLeadingOptimizer'
import {
  eventsForHand,
  renderPattern,
} from './style/patternRenderer'
import {
  SONG_FORMS,
  buildSongTimeline,
  sourceBeatAt,
} from './style/songStructure'
import type { ArrangementStep, SourceSection } from './style/arrangement'
import {
  DEFAULT_REST_AFTER,
  buildArrangedSong,
  defaultArrangement,
} from './style/arrangement'
import { pullChordFor, turnaroundInto } from './style/turnaround'
import type { EndingMode } from './style/endingChord'
import { endingChordFor } from './style/endingChord'
import { chooseInterludeWindow } from './style/interludeLoop'
import { arpeggioRun } from './fillSoloGenerator/leadIn'

/**
 * Giang tấu chạy trên bốn hợp âm nhặt từ vòng của bài.
 *
 * Bốn là độ dài tai nhận ra được một vòng tuần hoàn mà chưa kịp chán — mượn
 * trọn cả đoạn thì giang tấu dài lê thê.
 */
const INTERLUDE_CHORDS = 4


/**
 * Cách chơi ô nối mặc định: hợp âm rải hai quãng tám, im hai phách.
 *
 * Hai phách đo từ bản ký âm `reference/nguoi ay.mxl` — chỗ người hát cất giọng
 * trước phách mạnh. Người dùng chỉnh lại được từng chỗ bằng chuột phải.
 */
const DEFAULT_TRANSITION: TransitionRun = { octaves: 2, restBeats: 2 }

/**
 * Bốn mức nốt láy, thêm mức tắt hẳn.
 *
 * Có người chỉ muốn nghe đúng nốt của hợp âm, và ở câu chạy nhanh thì nốt láy
 * làm câu nhạc nhoè đi chứ không đẹp thêm.
 */
const GRACE_OPTIONS: readonly {
  id: GraceDensity
  label: string
  description: string
}[] = [
  { id: 'none', label: 'Không', description: 'Chỉ nốt của câu nhạc, không tô điểm gì.' },
  ...DENSITY_OPTIONS.map((option) => ({
    id: option.id as GraceDensity,
    label: option.label,
    description: option.description,
  })),
]
import { ArrangementEditor } from './style/ArrangementEditor'
import {
  ALL_STYLES,
  BALLAD,
  getStyle,
  isPlayable,
} from './style/styleLibrary'
import type { ParsedChord } from './types'
import { voiceLeadTwoHands } from './voicingGenerator/handSplitVoicing'

/** Quãng tám đặt hợp âm khi nghe thử. */
const BASE_OCTAVE_NOTE: MidiNote = 60

interface ColorPickerProps<T extends string> {
  title: string
  hint: string
  options: readonly (ColorOptionBase & { id: T })[]
  value: T
  onChange: (value: T) => void
  /** Có hiện cả những màu không thấy trong tài liệu không. */
  allowJazz: boolean
}

/**
 * Hàng nút chọn màu hợp âm.
 *
 * Màu ngoài tài liệu được viền khác hẳn và có dấu chấm, để người học luôn biết
 * mình đang nghe phong cách anh Khá hay đang nghe gu jazz nói chung.
 */
function ColorPicker<T extends string>({
  title,
  hint,
  options,
  value,
  onChange,
  allowJazz,
}: ColorPickerProps<T>) {
  const visible = options.filter(
    (option) => allowJazz || option.source === 'khaBu',
  )
  const active = options.find((option) => option.id === value)

  return (
    <div>
      <h4
        className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase"
        title={hint}
      >
        {title}
      </h4>

      <div className="flex flex-wrap gap-2">
        {visible.map((option) => {
          const isJazz = option.source === 'jazz'
          const isActive = value === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              title={option.description}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                isActive
                  ? isJazz
                    ? 'border-teal-key bg-teal-key/15 text-teal-key'
                    : 'border-amber-key bg-amber-key/15 text-amber-key'
                  : isJazz
                    ? 'border-teal-key/40 border-dashed bg-white/4 text-dim hover:bg-white/8'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              {option.label}
              {isJazz && <span className="ml-1 opacity-60">·</span>}
            </button>
          )
        })}
      </div>

      {active && (
        <p className="mt-2 text-xs leading-relaxed text-dim">
          {active.description}
        </p>
      )}
    </div>
  )
}

/**
 * Nốt để phát một hợp âm đã đọc được.
 *
 * Đây mới là cách bấm mộc: xếp chồng từ nốt gốc, thêm nốt bass xuống dưới nếu
 * là hợp âm chồng trên bass. Việc chọn thế bấm mượt theo nguyên tắc dẫn bè là
 * việc của bước sau.
 */
function notesForChord(chord: ParsedChord): MidiNote[] {
  const rootNote = BASE_OCTAVE_NOTE + chord.root
  const notes = chordNotes(rootNote, chord.quality)

  if (chord.bass === undefined) return fitToKeyboard(notes)

  // Nốt bass đặt dưới hẳn một quãng tám để nghe rõ vai trò bass.
  const bassNote = BASE_OCTAVE_NOTE - 12 + chord.bass
  return fitToKeyboard([bassNote, ...notes])
}

/**
 * Ô chọn giọng của bài.
 *
 * Tách riêng vì nó xuất hiện ở hai chỗ tuỳ luồng đang dùng: gắn vào khung bản
 * nhạc khi có lời bài hát, còn khi chỉ gõ vòng hợp âm trơn thì nằm ở khung kết
 * quả tái hoà âm.
 */
function KeySelect({
  value,
  onChange,
  detectedLabel,
}: {
  value: string
  onChange: (value: string) => void
  /** Giọng **app tự dò ra**, không phải giọng đang chọn. */
  detectedLabel: string | undefined
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-dim">
      Giọng
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        title="Cho app biết bài đang ở giọng nào, để nó tô màu hợp âm theo đúng bậc. Đây không phải nút đổi tone — muốn dịch cả bài sang giọng khác thì dùng nút TONE."
        className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream"
      >
        <option value="">
          Tự dò{detectedLabel ? ` (${detectedLabel})` : ''}
        </option>
        {/*
          Bày theo vòng quãng năm, ghép cặp trưởng với thứ song song. Trước đây
          bày theo thứ tự `detectKey` trả về — tức xếp theo điểm khớp — nhìn
          như xếp lung tung và không tìm được giọng mình muốn.
        */}
        {orderedKeys().map(({ tonic, scale }) => (
          <option key={`${tonic}:${scale}`} value={`${tonic}:${scale}`}>
            {keyLabel(tonic, scale)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ReharmHome() {
  const audioReady = useAudioStore((state) => state.ready)
  const setPracticeSong = usePracticeStore((state) => state.setSong)
  const openRequest = usePracticeStore((state) => state.request)
  const clearOpenRequest = usePracticeStore((state) => state.clearRequest)
  const looping = usePlaybackStore((state) => state.looping)
  const positionBeats = usePlaybackStore((state) => state.positionBeats)

  // Cố ý để một vòng pop trơn, chưa có màu gì — như vậy tác dụng của phần tái
  // hòa âm nhìn ra ngay. Để sẵn một vòng đã đầy màu thì trông như app không
  // làm gì cả.
  const [input, setInput] = useState('C Am F G')
  /** Bài hát đã dán vào, giữ lại để dựng bản nhạc có hợp âm tái hoà âm. */
  const [pastedSong, setPastedSong] = useState<ParsedSong | null>(null)
  /**
   * Nâng hạ tone cả bài, tính bằng nửa cung.
   *
   * Ca sĩ mỗi người một quãng giọng nên cùng một bài phải chơi được ở nhiều
   * tone — đây là việc người đệm hát làm thường xuyên nhất.
   */
  const [transpose, setTranspose] = useState(0)
  /** Cách chia đoạn do người dùng tự quét, đè lên cách bộ đọc tự nhận. */
  const [sectionMarks, setSectionMarks] = useState<SectionMark[]>([])
  /**
   * Thứ tự chơi do người dùng sắp.
   *
   * Rỗng nghĩa là chưa sắp gì, lúc đó lấy thứ tự mặc định — mỗi đoạn một lượt
   * theo đúng thứ tự trên lời.
   */
  const [arrangement, setArrangement] = useState<ArrangementStep[] | null>(null)
  /**
   * Các hợp âm **mở đầu** một ô nhịp dùng chung với hợp âm ngay sau nó.
   *
   * Chia đôi làm theo cặp chứ không cắt lẻ: ô nhịp là đơn vị cố định của bài,
   * thêm một hợp âm vào ô thì hai hợp âm chia nhau thời gian của ô đó và **số
   * ô nhịp không đổi**. Cắt lẻ thì bài ngắn đi, tức đổi luôn cấu trúc bài.
   */
  /**
   * Người dùng tự chỉnh mốc chuyển đoạn: `null` là gỡ mốc app tự dò ra.
   *
   * Lưu riêng phần chỉnh tay thay vì lưu cả bảng, để mốc tự dò vẫn theo kịp
   * khi người dùng quét lại cách chia đoạn.
   */
  const [transitionEdits, setTransitionEdits] = useState<
    Record<number, TransitionRun | null>
  >({})

  const [pairedChords, setPairedChords] = useState<ReadonlySet<number>>(
    new Set(),
  )
  /**
   * Các chỗ người dùng đã tắt câu fill, tính theo vòng hợp âm chính.
   *
   * Chỉ ghi những chỗ **bị tắt**; chỗ không có trong đây thì cứ theo mật độ
   * chung. Ghi kiểu này thì đổi mật độ vẫn giữ được lựa chọn của người dùng.
   */
  const [mutedFills, setMutedFills] = useState<ReadonlySet<number>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  /** Bật dẫn bè hay để thế bấm mộc, dùng để nghe đối chiếu. */
  const [smoothVoicing, setSmoothVoicing] = useState(true)
  const [dropRoot, setDropRoot] = useState(true)
  /** Số phách mỗi hợp âm chiếm — chính là nhịp đổi hợp âm của bài. */
  const [beatsPerChord, setBeatsPerChord] = useState(4)
  const [styleId, setStyleId] = useState('ballad')
  /** Mức thêm màu cho hợp âm. */
  const [intensity, setIntensity] = useState<ColorIntensity>('full')
  const [susDominant, setSusDominant] = useState(false)
  /** Màu của chủ âm — quyết định gu chung của cả vòng. */
  const [tonicColor, setTonicColor] = useState<MajorChordColor>('add9')
  const [majorColor, setMajorColor] = useState<MajorChordColor>('add9')
  const [minorColor, setMinorColor] = useState<MinorChordColor>('auto')
  const [dominantColor, setDominantColor] =
    useState<DominantChordColor>('auto')
  /** Bấm theo lối hợp âm chồng trên bass cho dễ. */
  const [useSlashChords, setUseSlashChords] = useState(false)

  /**
   * Đổi hợp âm kết ở lượt lặp lại của một đoạn — kỹ thuật thứ năm của phong
   * cách (tài liệu §11 mục 5). Bật sẵn vì đây là thói quen thường trực của
   * phong cách này chứ không phải một lựa chọn phối khí thêm thắt.
   */
  const [varyOnRepeat, setVaryOnRepeat] = useState(true)
  /** Cho phép dùng cả những màu jazz không thấy trong tài liệu. */
  const [allowJazzColors, setAllowJazzColors] = useState(false)
  /** Các gợi ý hợp âm lướt người dùng đã chấp nhận, theo khoá vị trí + kỹ thuật. */
  const [acceptedPassing, setAcceptedPassing] = useState<string[]>([])
  /**
   * Chiều nốt láy cố định là **xen kẽ**.
   *
   * Ô chọn đã bỏ: láy toàn từ dưới lên hay toàn từ trên xuống nghe ra ngay là
   * máy đánh, nên không ai đổi khỏi xen kẽ.
   */
  const soloDirection: ApproachDirection = 'mixed'
  /**
   * Mật độ nốt câu nhạc, mặc định **thưa**.
   *
   * Đi cùng câu dài bốn hợp âm bên dưới: ở mức thưa, vị trí thứ hai của câu tự
   * thành chỗ nghỉ, nên hình câu ra `mở → nghỉ → giữa → kết` — đúng phrasing
   * `pianoimprovnotes.md` mục 4 mô tả.
   */
  const [soloDensity, setSoloDensity] = useState<OrnamentDensity>('sparse')

  /**
   * Mật độ **chỗ chêm câu fill**, tách hẳn khỏi mật độ nốt câu nhạc.
   *
   * Hai thứ này ở hai chỗ khác nhau của bài: câu fill chêm vào đoạn **có lời**,
   * câu solo chạy ở đoạn **giang tấu**. Gộp làm một ô thì để câu solo thưa cho
   * thoáng là đoạn hát cũng mất luôn phần lớn chỗ chêm.
   */
  const [fillDensity, setFillDensity] = useState<OrnamentDensity>('medium')
  /** Mật độ nốt láy, tách riêng khỏi mật độ nốt của câu nhạc. */
  const [graceDensity, setGraceDensity] = useState<GraceDensity>('sparse')
  const [noteSource, setNoteSource] = useState<SoloNoteSource>('chordTone')
  /** Số hợp âm mỗi câu nhạc. Hết câu thì nghỉ lấy hơi. */
  /**
   * Độ dài câu nhạc, mặc định **bốn hợp âm**.
   *
   * Câu hai hợp âm chỉ có chỗ mở và chỗ kết, nên năm mẫu giữa câu không bao
   * giờ được chọn. Đo trên mười sáu lượt: câu bốn hợp âm cho 35 hình câu khác
   * nhau, câu hai hợp âm chỉ cho 21.
   */
  const [chordsPerPhrase, setChordsPerPhrase] = useState(4)
  /** Giọng do người dùng chỉ định. Rỗng nghĩa là để app tự dò. */
  const [manualKey, setManualKey] = useState('')
  /** Tay nào được phát, để nghe riêng từng tay. */
  const [hand, setHand] = useState<'both' | 'left' | 'right'>('both')

  /** Lời gốc đúng như người dùng dán vào, để lưu lại và phân tích lại. */
  const [sourceText, setSourceText] = useState('')
  /** Khung bản nhạc, để cuộn tới sau khi nạp một bài mới. */
  const sheetRef = useRef<HTMLDivElement>(null)

  /** Lần bấm phát thứ mấy, để câu giang tấu không lặp lại giữa các lần phát. */
  const playRound = useRef(0)

  /** Bài đang mở từ kho; rỗng nghĩa là bài chưa lưu lần nào. */
  const [songId, setSongId] = useState<string | null>(null)
  const [songTitle, setSongTitle] = useState<string | null>(null)
  /** Tăng lên mỗi lần lưu, để danh sách bài đọc lại kho. */
  const [saveCount, setSaveCount] = useState(0)

  const bpm = useMetronomeStore((state) => state.bpm)

  const parsed = useMemo(() => parseChordInput(input), [input])

  /** Vòng hợp âm sau khi nâng hạ tone — mọi thứ phía sau đều dựa trên đây. */
  const sequence = useMemo(
    () => ({
      ...parsed,
      chords: transposeChords(parsed.chords, transpose),
    }),
    [parsed, transpose],
  )

  /** Khoá định danh một gợi ý, để nhớ người dùng đã bật cái nào. */
  const keyOf = (index: number, technique: string) => `${index}:${technique}`


  /**
   * Chạy cả đường ống tái hòa âm: dò giọng → phân tích bậc → thêm màu → gợi ý
   * hợp âm lướt. Thứ tự này quan trọng, xem ghi chú trong reharmPipeline.ts.
   */
  const style = getStyle(styleId) ?? BALLAD

  /**
   * Số phách mỗi hợp âm chiếm.
   *
   * Điệu nhịp ba bốn thì một ô nhịp chỉ có ba phách, nên phải quy đổi lựa chọn
   * của người dùng theo nhịp của điệu chứ không giữ nguyên con số.
   */
  const chordBeats = useMemo(() => {
    const measures = beatsPerChord / 4
    return Math.max(1, measures * style.beatsPerMeasure)
  }, [beatsPerChord, style.beatsPerMeasure])

  /**
   * Hợp âm kết mỗi đoạn, trừ đoạn cuối bài.
   *
   * Dựng từ **bản nhạc thô** — lời đã chia đoạn ghép với vòng hợp âm chưa tái
   * hoà âm — chứ không từ bản nhạc hoàn chỉnh. Bắt buộc phải vậy: chỗ chuyển
   * đoạn quyết định thời lượng hợp âm, mà thời lượng lại là đầu vào của đường
   * ống tái hoà âm dựng ra bản nhạc hoàn chỉnh. Đọc từ bản hoàn chỉnh là vòng
   * tròn. Cách chia đoạn chỉ phụ thuộc lời và dấu người dùng quét, nên bản thô
   * cho đúng cùng một kết quả.
   *
   * Đoạn cuối bài không tính: hết bài rồi thì không còn ai phải vào đâu nữa.
   */
  const sectionEnds = useMemo(() => {
    if (!pastedSong) return undefined

    const raw = resectionSheet(
      buildSongSheet(pastedSong, sequence.chords),
      sectionMarks,
    )
    const ranges = sectionChordRanges(raw)

    return new Set(ranges.slice(0, -1).map((range) => range.to))
  }, [pastedSong, sequence.chords, sectionMarks])

  /**
   * Mốc chuyển đoạn thật sự dùng: chỗ app tự dò, sau đó áp phần người dùng chỉnh.
   */
  const transitions = useMemo(() => {
    const map = new Map<number, TransitionRun>()
    for (const index of sectionEnds ?? []) map.set(index, DEFAULT_TRANSITION)

    for (const [key, value] of Object.entries(transitionEdits)) {
      const index = Number(key)
      if (value === null) map.delete(index)
      else map.set(index, value)
    }

    return map
  }, [sectionEnds, transitionEdits])

  /** Chỉ các số thứ tự, cho những chỗ chỉ cần biết có mốc hay không. */
  const transitionAt = useMemo(() => new Set(transitions.keys()), [transitions])

  /**
   * Những ô nối **nhường chỗ cho câu chạy**, tức phần đệm im hẳn ở đó.
   *
   * Chọn không chạy quãng tám nào thì ô nối vẫn được thêm vào cho người hát
   * ngân hết câu, nhưng nó đệm bình thường — bỏ đệm mà không có câu chạy thay
   * vào thì ô đó câm hẳn.
   */
  const runningBars = useMemo(
    () =>
      new Set(
        [...transitions.entries()]
          /*
            Nghỉ trọn ô nhịp thì câu chạy không còn chỗ nào để đứng, nên ô đó
            cũng phải đệm bình thường — không thì nó câm hẳn.
          */
          .filter(([, run]) => run.octaves > 0 && run.restBeats < chordBeats)
          .map(([index]) => index),
      ),
    [transitions, chordBeats],
  )

  /**
   * Bảng thời lượng đưa vào đường ống.
   *
   * Cặp chia đôi thì mỗi bên nửa ô nhịp. Hợp âm **cuối mỗi đoạn** được cấp
   * thêm trọn một ô nhịp, để người hát ngân cho hết câu rồi mới vào đoạn sau.
   *
   * Vì sao cả một ô mà không phải một phách: ô nhịp là đơn vị nguyên, thêm một
   * phách là đẻ ra ô năm phách. Đo trên `reference/nguoi ay.mxl` thì từ chữ
   * hát cuối tới lúc đoạn mới vào, bản ký âm cho 1,5 đến 3 phách — một ô là
   * hơi rộng, nhưng bản ký âm rộng rãi được là nhờ câu hát kết sớm trong ô,
   * còn ở đây không ép người hát ngừng sớm được.
   */
  const halvedBeats = useMemo(() => {
    const table = {
      ...pairedChordBeats(pairedChords, sequence.chords.length, chordBeats),
    }

    for (const index of transitionAt) {
      table[index] = (table[index] ?? chordBeats) + chordBeats
    }

    return table
  }, [pairedChords, transitionAt, sequence.chords.length, chordBeats])

  const reharm = useMemo(() => {
    const parsedKey = manualKey
      ? {
          tonic: Number(manualKey.split(':')[0]),
          scale: manualKey.split(':')[1] as 'major' | 'minor',
        }
      : null

    // Chạy vòng đầu để lấy danh sách gợi ý, rồi lọc ra những cái đã chấp nhận.
    const firstPass = reharmonize(sequence.chords, {
      intensity,
      susDominant,
      tonicColor,
      majorColor,
      minorColor,
      dominantColor,
      useSlashChords,
      key: parsedKey,
    })

    const chosen = firstPass.passingSuggestions.filter((suggestion) =>
      acceptedPassing.includes(
        keyOf(suggestion.insertBeforeIndex, suggestion.technique),
      ),
    )

    return reharmonize(sequence.chords, {
      intensity,
      susDominant,
      tonicColor,
      majorColor,
      minorColor,
      dominantColor,
      useSlashChords,
      key: parsedKey,
      acceptedPassing: chosen,
      beatsPerChord: chordBeats,
      chordBeats: halvedBeats,
    })
  }, [
    sequence.chords,
    intensity,
    susDominant,
    tonicColor,
    majorColor,
    minorColor,
    dominantColor,
    useSlashChords,
    manualKey,
    acceptedPassing,
    chordBeats,
    halvedBeats,
  ])

  const recolored = reharm.colored
  const passingSuggestions = reharm.passingSuggestions

  /**
   * Bật tắt một hợp âm lướt, **áp cho mọi chỗ có cùng hợp âm đích**.
   *
   * Một bài lặp đi lặp lại vài hợp âm; đã quyết định dẫn vào `Am7` bằng vòng
   * hai-năm thì thường muốn làm vậy ở mọi chỗ có `Am7`, chứ không đi chèn thủ
   * công từng chỗ rồi bỏ sót.
   *
   * Dùng chung cho cả menu chuột phải trên bản nhạc lẫn khung Hợp âm lướt bên
   * dưới, để hai chỗ không bao giờ cư xử khác nhau.
   */
  /** Các hợp âm lướt đặt được, mỗi loại một mục thay vì mỗi khe một mục. */
  const passingGroups = useMemo(
    () => groupPassingSuggestions(passingSuggestions, recolored),
    [passingSuggestions, recolored],
  )

  /** Khoá từng khe của một nhóm, để lưu vào danh sách đã chấp nhận. */
  const keysOfGroup = (group: { technique: string; slots: number[] }) =>
    group.slots.map((slot) => keyOf(slot, group.technique))

  /** Nhóm này đã được chèn chưa. */
  const isGroupOn = (group: { technique: string; slots: number[] }) =>
    keysOfGroup(group).some((key) => acceptedPassing.includes(key))

  const togglePassingGroup = (groupId: string) =>
    setAcceptedPassing((current) => {
      const group = passingGroups.find((entry) => entry.id === groupId)
      if (!group) return current

      const keys = keysOfGroup(group)
      const on = keys.some((key) => current.includes(key))

      return on
        ? current.filter((entry) => !keys.includes(entry))
        : [...current, ...keys.filter((key) => !current.includes(key))]
    })

  /** Vòng hợp âm về mặt cách bấm — thứ tay thật sự chơi. */
  const withPassing = reharm.final

  /** Thế bấm hai tay đã dẫn bè. */
  const twoHands = useMemo(
    () =>
      voiceLeadTwoHands(withPassing, {
        dropRootFromRightHand: dropRoot,
      }),
    [withPassing, dropRoot],
  )

  /** Thế bấm mộc, chỉ xếp chồng từ nốt gốc — để đối chiếu. */
  const plain = useMemo(() => plainSequence(withPassing), [withPassing])


  /** Dòng thời gian phần đệm theo điệu đang chọn. */
  const accompaniment = useMemo(
    () =>
      renderPattern(twoHands, style, {
        beatsPerChord: chordBeats,
        beatsEach: chordDurations(withPassing, chordBeats),
        // Ô nối sang đoạn mới dành trọn cho câu chạy ngón.
        barsWithoutComping: runningBars,
      }),
    [twoHands, style, chordBeats, withPassing, runningBars],
  )

  /**
   * Vòng hợp âm **chính**, đã gỡ hết hợp âm lướt.
   *
   * Mỗi hợp âm lấy lại trọn khoảng thời gian của mình, kể cả phần đã nhường
   * cho hợp âm lướt, nên tổng độ dài vòng không đổi.
   */
  const mainChords = useMemo(
    () =>
      mainChordSpans(withPassing, chordBeats).map((span) => ({
        ...span.chord,
        beats: span.beats,
      })),
    [withPassing, chordBeats],
  )

  /**
   * Phần đệm cho **đoạn giang tấu**, dựng trên vòng chính không hợp âm lướt.
   *
   * Câu solo đã bám vòng chính; nếu tay đệm vẫn chơi hợp âm lướt thì hai tay
   * đánh nhau. Và hợp âm lướt vốn là đồ trang trí cho đoạn hát — vào giang tấu
   * thì phần đệm rút về khung hoà âm gốc để nhường chỗ cho ngẫu hứng.
   */
  const interludeBacking = useMemo(() => {
    const hands = voiceLeadTwoHands(mainChords, {
      dropRootFromRightHand: dropRoot,
    })
    return renderPattern(hands, style, {
      beatsPerChord: chordBeats,
      beatsEach: chordDurations(mainChords, chordBeats),
    })
  }, [mainChords, style, chordBeats, dropRoot])

  /** Bản nhạc: lời bài hát với hợp âm đã tái hoà âm ghi trên đầu. */
  const sheet = useMemo(() => {
    if (!pastedSong) return null
    return resectionSheet(
      buildSongSheet(pastedSong, reharm.colored, withPassing),
      sectionMarks,
    )
  }, [pastedSong, reharm.colored, withPassing, sectionMarks])

  /**
   * Cấu trúc thật của bài, suy ra từ cách chia đoạn trên bản nhạc.
   *
   * Có cấu trúc thật thì không phải đoán bằng mẫu dựng sẵn nữa, và đoạn giang
   * tấu rơi đúng chỗ người dùng đánh dấu. Rỗng nghĩa là chưa dán lời, lúc đó
   * vẫn dùng mẫu dựng sẵn như cũ.
   */
  const songSources = useMemo((): SourceSection[] | null => {
    if (!sheet) return null

    const spans = mainChordSpans(withPassing, chordBeats)
    const ranges = sectionChordRanges(sheet)
    if (ranges.length === 0) return null

    const sources = ranges.map((range, index): SourceSection | null => {
      const first = spans[range.from]
      const last = spans[range.to]
      if (!first || !last) return null

      return {
        name: range.name || `Đoạn ${index + 1}`,
        // Chỉ giang tấu mới khác; các đoạn còn lại đều là đoạn có lời.
        kind:
          range.kind === 'interlude'
            ? ('interlude' as const)
            : ('verse' as const),
        startBeat: first.start,
        lengthBeats: last.start + last.beats - first.start,
      }
    })

    const clean = sources.filter(
      (source): source is SourceSection => source !== null,
    )
    return clean.length > 0 ? clean : null
  }, [sheet, withPassing, chordBeats])

  /**
   * Dựng câu quay đầu cuối giang tấu, hút về đoạn ngay sau nó.
   *
   * Ở đây mới dựng được vì chỗ này là chỗ duy nhất biết **hợp âm thật**: khung
   * thứ tự chơi chỉ làm việc với mốc phách, còn muốn biết hút về đâu thì phải
   * đọc được hợp âm đầu tiên của đoạn kế tiếp.
   */
  /**
   * Vòng ngắn mà giang tấu chạy trên đó, nhặt từ đoạn được mượn.
   *
   * Mượn trọn cả đoạn thì giang tấu dài lê thê, nên chỉ lấy bốn hợp âm — chọn
   * sao cho hợp âm cuối hút mạnh nhất về đoạn sắp vào. Xem `interludeLoop.ts`.
   */
  const interludeWindow = useCallback(
    (over: SourceSection, next: SourceSection | null) => {
      const spans = mainChordSpans(withPassing, chordBeats)
      const end = over.startBeat + over.lengthBeats

      const inside = spans.filter(
        (span) =>
          span.start >= over.startBeat - 0.001 && span.start < end - 0.001,
      )
      if (inside.length === 0) return null

      const target = next
        ? spans.find((span) => Math.abs(span.start - next.startBeat) < 0.001)
        : undefined

      const window = chooseInterludeWindow(
        inside.map((span) => span.chord),
        // Không có đoạn nào sau thì không có gì để hút về; lấy khoảng cuối.
        target?.chord ?? inside[inside.length - 1].chord,
        INTERLUDE_CHORDS,
      )
      if (!window) return null

      const first = inside[window.from]
      const last = inside[window.to]

      return {
        startBeat: first.start,
        lengthBeats: last.start + last.beats - first.start,
        chords: inside.slice(window.from, window.to + 1),
      }
    },
    [withPassing, chordBeats],
  )

  /**
   * Dựng câu quay đầu cuối giang tấu, hút về đoạn ngay sau nó.
   *
   * Ở đây mới dựng được vì chỗ này là chỗ duy nhất biết **hợp âm thật**: khung
   * thứ tự chơi chỉ làm việc với mốc phách, còn muốn biết hút về đâu thì phải
   * đọc được hợp âm đầu tiên của đoạn kế tiếp.
   */
  const buildTurnaround = useCallback(
    (over: SourceSection, next: SourceSection) => {
      const spans = mainChordSpans(withPassing, chordBeats)

      const target = spans.find(
        (span) => Math.abs(span.start - next.startBeat) < 0.001,
      )
      // Ô cuối của **vòng giang tấu**, không phải ô cuối của cả đoạn.
      const tail = interludeWindow(over, next)?.chords.at(-1)
      if (!target || !tail) return null

      /*
        Cụm quay đầu chiếm **hai ô nhịp** cuối vòng giang tấu.

        Nhồi cả cụm hai-năm-một lẫn câu rải vào một ô thì mỗi hợp âm chỉ được
        một phách và câu rải chỉ được một phách — đánh vội tới mức không nghe
        ra hợp âm gì. Hai ô cho mỗi thứ một chỗ đứng riêng.
      */
      const bar = chordBeats
      const window = interludeWindow(over, next)
      const beats = Math.min(bar * 2, window?.lengthBeats ?? bar)

      const plan = turnaroundInto(target.chord, bar >= 2 ? 2 : 1, tail.chord)
      if (!plan) return null

      /*
        **Ô thứ nhất** là cụm hai-năm-một khép vòng.

        Hợp âm đích chiếm nửa ô, mấy hợp âm dẫn chia nhau nửa còn lại: bậc hai
        và bậc năm là chỗ *đi*, hợp âm đích là chỗ *đậu lại*. Ba hợp âm ra
        1 · 1 · 2 phách, hai hợp âm ra 2 · 2 — cả hai đều đúng lưới. Chia đều
        ba hợp âm trong một ô thì ra 1,33 phách, lệch khỏi mọi lưới nhịp.
      */
      const approach = plan.chords.slice(0, -1)
      const lead = approach.length > 0 ? bar / 2 / approach.length : 0
      const beatsEach = [...approach.map(() => lead), bar / 2]

      const hands = voiceLeadTwoHands(plan.chords, {
        dropRootFromRightHand: dropRoot,
      })

      const events = renderPattern(hands, style, {
        beatsPerChord: bar / 2,
        beatsEach,
      })

      /*
        **Ô thứ hai** là hợp âm rải rồi nghỉ.

        Cụm hai-năm-một vừa *kết thúc* một câu; chỗ nối sang đoạn hát cần một
        cú mở cửa chứ không phải một dấu chấm. Hợp âm rải chạy lên rồi bỏ lửng,
        nên nó đẩy tai về phía trước thay vì chốt lại.

        Rải chiếm nửa đầu ô, nửa sau để trống — đó là chỗ người hát lấy hơi
        trước khi vào.
      */
      const pull = pullChordFor(target.chord, plan.chords.at(-2))
      const spread =
        pull && beats > bar
          ? arpeggioRun({
              chord: pull,
              octaves: 2,
              endBeat: bar + bar / 2,
              maxBeats: bar / 2,
            }).map((note) => ({
              startBeat: note.startBeat,
              durationBeats: note.durationBeats,
              notes: [note.note],
              hand: note.hand,
              /*
                Nhấn hơn phần đệm để nghe ra đây là lời mời vào hát.

                Thang này là **MIDI 0-127**, không phải 0-1. Bản đầu để 0.9 nên
                nó phát ở 0,7% âm lượng — nghe như không có. Phần đệm dùng 80.
              */
              velocity: 92,
            }))
          : []

      return { events: [...events, ...spread], beats }
    },
    [withPassing, chordBeats, dropRoot, style, interludeWindow],
  )

  /**
   * Chỗ ca sĩ ngắt nghỉ lấy hơi, suy ra từ chỗ kết thúc mỗi dòng lời.
   *
   * Chưa dán lời thì rỗng, và bộ chêm fill lùi về cách đếm đều — không có lời
   * thì không có ai hát để mà biết họ nghỉ ở đâu.
   */
  const breaths = useMemo(
    () => (sheet ? breathChords(sheet) : undefined),
    [sheet],
  )

  /**
   * Những chỗ **chêm được** câu fill, chưa tính lựa chọn tắt của người dùng.
   *
   * Tính sẵn một lần thay vì hỏi lại cho từng hợp âm lúc vẽ: bản nhạc gọi hàm
   * này cho mọi hợp âm, mà mỗi lần gọi lại duyệt cả vòng thì bài dài sẽ ì.
   */
  const fillEligible = useMemo(
    () =>
      new Set(
        fillPositions(withPassing, {
          density: fillDensity,
          breaths,
          beatsPerChord: chordBeats,
          always: transitionAt,
        }).map((position) => position.mainIndex),
      ),
    [withPassing, fillDensity, breaths, transitionAt, chordBeats],
  )

  /**
   * Chỗ này đang có fill không.
   *
   * Rỗng nghĩa là **không chêm được** — mật độ không rơi vào, hoặc ô nhịp đã bị
   * chia đôi cho hợp âm lướt. Lúc đó giao diện không bày mục bật tắt ra, vì bày
   * một nút không làm gì chỉ gây hiểu nhầm.
   */
  const fillAt = useCallback(
    (chordIndex: number) => {
      if (!fillEligible.has(chordIndex)) return null
      return !mutedFills.has(chordIndex)
    },
    [fillEligible, mutedFills],
  )

  /** Câu fill dùng cho đoạn có lời — ngắn, chỉ chêm ở khe hở. */
  const fills = useCallback(
    (take: number) =>
      soloToTimeline(
        generateFillLine(withPassing, {
          breaths,
          sectionEnds: transitions,
          beatsPerChord: chordBeats,
          direction: soloDirection,
          density: fillDensity,
          key: reharm.key,
          skipFills: mutedFills,
          take,
        }),
      ),
    [
      withPassing,
      chordBeats,
      soloDirection,
      fillDensity,
      reharm.key,
      mutedFills,
      breaths,
      transitions,
    ],
  )

  /**
   * Giai điệu tự sinh cho **một lượt giang tấu**.
   *
   * Là hàm theo số lượt chứ không phải một đoạn cố định, để lượt sau không lặp
   * lại lượt trước.
   */
  const soloTake = useMemo(() => {
    const args = {
      beatsPerChord: chordBeats,
      direction: soloDirection,
      density: soloDensity,
      graceDensity,
      key: reharm.key,
      noteSource,
      chordsPerPhrase,
    }

    return (take: number) => generateSolo(withPassing, { ...args, take })
  }, [
    withPassing,
    chordBeats,
    soloDirection,
    soloDensity,
    graceDensity,
    noteSource,
    chordsPerPhrase,
    reharm.key,
  ])

  /**
   * Độ dài một lượt vòng hợp âm, tính theo **số hợp âm** chứ không theo nốt
   * cuối cùng.
   *
   * Nếu lấy theo nốt cuối thì hợp âm cuối vòng bị cắt ngắn hoặc thừa ra tuỳ
   * việc nốt cuối ngân bao lâu, và vòng lặp nghe lệch nhịp.
   */
  const oneLoopBeats = useMemo(
    () => Math.max(1, totalBeatsOf(withPassing, chordBeats)),
    [withPassing, chordBeats],
  )

  /**
   * Phách bắt đầu của hợp âm chính thứ `mainIndex`.
   *
   * Bản nhạc đánh số theo vòng **chính**, còn dòng thời gian chạy trên vòng đã
   * chèn hợp âm lướt — nên phải đếm qua các hợp âm lướt để tìm đúng mốc.
   */
  const beatOfMainChord = useCallback(
    (mainIndex: number) =>
      mainChordSpans(withPassing, chordBeats)[mainIndex]?.start ?? 0,
    [withPassing, chordBeats],
  )

  /**
   * Gói toàn bộ lựa chọn của người dùng lại để lưu xuống kho.
   *
   * Cố ý liệt kê từng trường thay vì gom cả `state` — thêm một lựa chọn mới mà
   * quên thêm vào đây thì `tsc` báo ngay, còn gom cả cục thì nó lặng lẽ lưu
   * thiếu và chỉ phát hiện khi người dùng mở lại bài thấy mất.
   */
  const snapshot = useCallback(
    (): SongSnapshot => ({
      version: 1,
      sourceText,
      transpose,
      manualKey,
      sectionMarks,
      arrangement,
      transitionEdits,
      pairedChords: [...pairedChords],
      mutedFills: [...mutedFills],
      acceptedPassing,
      styleId,
      beatsPerChord,
      smoothVoicing,
      dropRoot,
      useSlashChords,
      varyOnRepeat,
      allowJazzColors,
      intensity,
      susDominant,
      tonicColor,
      majorColor,
      minorColor,
      dominantColor,
      soloDensity,
      fillDensity,
      graceDensity,
      noteSource,
      chordsPerPhrase,
    }),
    [
      sourceText,
      transpose,
      manualKey,
      sectionMarks,
      arrangement,
      transitionEdits,
      pairedChords,
      mutedFills,
      acceptedPassing,
      styleId,
      beatsPerChord,
      smoothVoicing,
      dropRoot,
      useSlashChords,
      varyOnRepeat,
      allowJazzColors,
      intensity,
      susDominant,
      tonicColor,
      majorColor,
      minorColor,
      dominantColor,
      soloDensity,
      fillDensity,
      graceDensity,
      noteSource,
      chordsPerPhrase,
    ],
  )

  /**
   * Đặt lại toàn bộ trang theo một ảnh chụp đã lưu.
   *
   * Phân tích lại lời từ `sourceText` chứ không lưu kết quả phân tích: bộ đọc
   * lời còn sửa tiếp, và bài lưu hôm nay phải hưởng được bản sửa ngày mai.
   */
  const applySnapshot = useCallback((saved: SongSnapshot) => {
    const parsed = parseSongText(saved.sourceText)

    setSourceText(saved.sourceText)
    setPastedSong(parsed)
    setInput(parsed.chords.map((chord) => chord.symbol).join(' '))
    setSelectedIndex(null)

    setTranspose(saved.transpose)
    setManualKey(saved.manualKey)
    setSectionMarks(saved.sectionMarks)
    setArrangement(saved.arrangement)
    setTransitionEdits(saved.transitionEdits)
    setPairedChords(new Set(saved.pairedChords))
    setMutedFills(new Set(saved.mutedFills))
    setAcceptedPassing(saved.acceptedPassing)

    setStyleId(saved.styleId)
    setBeatsPerChord(saved.beatsPerChord)
    setSmoothVoicing(saved.smoothVoicing)
    setDropRoot(saved.dropRoot)
    setUseSlashChords(saved.useSlashChords)
    // Bài lưu từ trước khi có mục này thì theo mặc định của phong cách.
    setVaryOnRepeat(saved.varyOnRepeat ?? true)

    setAllowJazzColors(saved.allowJazzColors)
    setIntensity(saved.intensity as ColorIntensity)
    setSusDominant(saved.susDominant)
    setTonicColor(saved.tonicColor as MajorChordColor)
    setMajorColor(saved.majorColor as MajorChordColor)
    setMinorColor(saved.minorColor as MinorChordColor)
    setDominantColor(saved.dominantColor as DominantChordColor)

    setSoloDensity(saved.soloDensity as OrnamentDensity)
    // Bài lưu từ trước khi tách thì câu fill dùng chung mật độ với câu nhạc.
    setFillDensity((saved.fillDensity ?? saved.soloDensity) as OrnamentDensity)
    // Bài lưu từ trước khi tách ô chỉnh thì chưa có mục này.
    setGraceDensity((saved.graceDensity ?? 'sparse') as GraceDensity)
    setNoteSource(saved.noteSource as SoloNoteSource)
    setChordsPerPhrase(saved.chordsPerPhrase)
  }, [])

  /**
   * Nạp một bài mới vào trang — dán lời hay chọn vòng dựng sẵn đều qua đây.
   *
   * Bài mới thì **bỏ mọi lựa chọn đã dựng**, và thôi gắn với bài đang mở trong
   * kho: không thì bấm Lưu sẽ ghi đè bài cũ bằng một bài khác hẳn.
   */
  const loadSong = useCallback((parsed: ParsedSong, text: string) => {
    /*
      Cuộn tới bản nhạc sau khi nạp.

      Nút chọn vòng dựng sẵn và ô dán lời nằm ở đầu trang, còn bản nhạc nằm
      dưới ô dán lời và khung Bài đã lưu — tức ngoài tầm nhìn. Bấm xong mà màn
      hình không đổi gì thì tưởng nút hỏng, dù nó đã chạy đúng.
    */
    window.requestAnimationFrame(() => {
      sheetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    setPastedSong(parsed)
    setSourceText(text)
    setSongId(null)
    setSongTitle(null)

    setSectionMarks([])
    setArrangement(null)
    setTranspose(0)
    setPairedChords(new Set())
    setMutedFills(new Set())
    setTransitionEdits({})
    setAcceptedPassing([])

    setInput(parsed.chords.map((chord) => chord.symbol).join(' '))
    setSelectedIndex(null)
  }, [])

  /**
   * Hợp âm cuối của đoạn kết bài, đã đổi màu.
   *
   * Chỉ đụng vào **một hợp âm cuối cùng**: vòng hợp âm của đoạn vẫn chạy
   * nguyên vẹn, vì đổi cả đoạn thì không còn là kết bài mà là tái hoà âm lại.
   */
  const buildEnding = useCallback(
    (source: SourceSection, mode: EndingMode) => {
      const spans = mainChordSpans(withPassing, chordBeats)
      const end = source.startBeat + source.lengthBeats
      const last = spans.filter((span) => span.start < end - 0.001).at(-1)
      if (!last) return null

      const closing = endingChordFor(last.chord, mode)
      if (!closing) return null

      const hands = voiceLeadTwoHands([closing], {
        dropRootFromRightHand: dropRoot,
      })

      return {
        events: renderPattern(hands, style, {
          beatsPerChord: last.beats,
          beatsEach: [last.beats],
        }),
        beats: last.beats,
      }
    },
    [withPassing, chordBeats, dropRoot, style],
  )

  /**
   * Hợp âm kết đổi màu ở **lượt lặp lại** của một đoạn.
   *
   * Kỹ thuật thứ năm của phong cách (tài liệu §11 mục 5, §1): *"đổi hợp âm kết
   * ở mỗi lượt lặp câu nhạc (vd Em7 → E7b9) để tránh nhàm chán"*.
   *
   * Cách đổi lấy đúng theo ví dụ ấy: hợp âm kết thành **bậc năm của hợp âm
   * ngay sau nó**. Trong giọng Đô, đoạn kết ở Em7 mà chỗ sau vào Am thì bậc
   * năm của Am là E — hoá ra đúng E7b9 mà tài liệu ghi. §15 cho thêm một ví dụ
   * cùng lối: lượt lặp kết bằng C7, tức V7/IV, hút về FM7 ở đầu vòng.
   *
   * Không đổi cả câu nhạc, chỉ đổi **hợp âm cuối**: đổi nhiều hơn thì lượt sau
   * thành một đoạn khác chứ không còn là đoạn cũ chơi lại.
   */
  const buildRepeatEnding = useCallback(
    (source: SourceSection, next: SourceSection) => {
      const spans = mainChordSpans(withPassing, chordBeats)

      const end = source.startBeat + source.lengthBeats
      const last = spans.filter((span) => span.start < end - 0.001).at(-1)
      const target = spans.find(
        (span) => Math.abs(span.start - next.startBeat) < 0.001,
      )
      if (!last || !target) return null

      const pull = pullChordFor(target.chord, last.chord)
      if (!pull) return null

      /*
        Hợp âm kết vốn đã là bậc năm của chỗ sau thì thôi: đổi nữa cũng ra đúng
        cái đang có, mà mất công dựng lại.
      */
      if (pull.symbol === last.chord.symbol) return null

      const hands = voiceLeadTwoHands([pull], {
        dropRootFromRightHand: dropRoot,
      })

      return {
        events: renderPattern(hands, style, {
          beatsPerChord: last.beats,
          beatsEach: [last.beats],
        }),
        beats: last.beats,
      }
    },
    [withPassing, chordBeats, dropRoot, style],
  )

  /** Thứ tự đang dùng: do người dùng sắp, hoặc mặc định từng đoạn một lượt. */
  const steps = useMemo(
    () => arrangement ?? (songSources ? defaultArrangement(songSources) : []),
    [arrangement, songSources],
  )

  /**
   * Dựng cả bài cho **lần phát thứ mấy**.
   *
   * Là hàm chứ không phải một dòng thời gian cố định, vì mỗi lần phát lại phải
   * đổi câu giang tấu. Mốc lượt nối tiếp qua từng lần phát nên lần thứ hai
   * không quay về đúng câu của lần thứ nhất.
   */
  const buildPass = useCallback(
    (pass: number, takesPerPass: number) => {
      // Có cấu trúc thật thì chơi đúng thứ tự đó, không lặp mẫu dựng sẵn.
      if (songSources && steps.length > 0) {
        return buildArrangedSong({
          accompaniment,
          interlude: interludeBacking,
          // Câu chêm cũng đổi theo lượt, không riêng đoạn giang tấu.
          fills: fills(pass),
          solo: (take) => soloToTimeline(soloTake(take + pass * takesPerPass)),
          sources: songSources,
          steps,
          turnaround: buildTurnaround,
          interludeRange: interludeWindow,
          restAfterInterlude: DEFAULT_REST_AFTER,
          beatsPerMeasure: style.beatsPerMeasure,
          ending: buildEnding,
          repeatEnding: varyOnRepeat ? buildRepeatEnding : undefined,
        })
      }

      return buildSongTimeline({
        accompaniment,
        interlude: interludeBacking,
        fills: fills(pass),
        solo: (take) => soloToTimeline(soloTake(take)),
        loopLengthBeats: oneLoopBeats,
        /*
          Luồng gõ vòng hợp âm trơn không có cấu trúc thật nào, nên cứ lặp
          vòng đều. Các mẫu dựng sẵn khác đã bỏ: có lời bài hát thì thứ tự
          chơi do người dùng sắp ở khung Thứ tự chơi.
        */
        form: SONG_FORMS[0],
        takeOffset: pass * takesPerPass,
      })
    },
    [
      accompaniment,
      interludeBacking,
      fills,
      soloTake,
      oneLoopBeats,
      songSources,
      buildTurnaround,
      interludeWindow,
      buildEnding,
      buildRepeatEnding,
      varyOnRepeat,
      style.beatsPerMeasure,
      steps,
    ],
  )

  /** Lần phát đầu — dùng cho hiển thị và cho các nút phát một lượt. */
  const song = useMemo(() => buildPass(0, 0), [buildPass])

  /**
   * Hợp âm đang vang, quy về số thứ tự trên bản nhạc.
   *
   * Ba lần quy đổi:
   *
   * 1. Vị trí đang phát nằm trên **dòng thời gian đã sắp lại**, nên phải tra
   *    bản đồ mảnh để biết nó ứng với chỗ nào trên vòng hợp âm gốc. Bản đầu
   *    bỏ qua bước này, chỉ lấy vị trí chia dư cho độ dài vòng — nên đang chơi
   *    giang tấu hay điệp khúc mà chữ vẫn sáng ở phiên khúc, vì một đoạn chơi
   *    hai lần ở hai chỗ khác nhau còn giang tấu thì chỉ mượn bốn hợp âm.
   * 2. Từ mốc phách gốc tra ra hợp âm thứ mấy trong vòng **đã chèn hợp âm
   *    lướt**.
   * 3. Từ đó đếm ngược ra hợp âm thứ mấy trong vòng **chính** — vì chỉ hợp âm
   *    chính mới có chữ để neo vào. Đang chơi hợp âm lướt thì giữ sáng hợp âm
   *    chính đứng trước nó.
   */
  const activeChordIndex = useMemo(() => {
    if (!looping || !sheet) return null

    const total = song.totalBeats
    if (total <= 0) return null

    const sourceBeat = sourceBeatAt(
      song.segments,
      positionBeats % total,
    )
    if (sourceBeat === null) return null

    const index = chordIndexAt(withPassing, chordBeats, sourceBeat)

    let mainIndex = -1
    for (let position = 0; position <= index; position += 1) {
      if (!withPassing[position]?.passing) mainIndex += 1
    }

    return mainIndex >= 0 ? mainIndex : null
  }, [looping, sheet, positionBeats, song, withPassing, chordBeats])


  const timeline = song.events
  const loopLengthBeats = song.totalBeats

  /*
    Đăng bài đang mở lên kho dùng chung, để tab Luyện đệm lấy về.

    Khung luyện tập đã tách sang tab riêng vì nó là **việc khác hẳn**: bên này
    dựng bài, bên kia tập đàn. Gộp chung một trang thì lúc tập phải cuộn qua cả
    chục khung chỉnh sửa mới tới, mà lúc dựng lại vướng một khung to chẳng dùng
    tới.
  */
  useEffect(() => {
    setPracticeSong({
      id: songId,
      title: songTitle ?? 'Bài chưa đặt tên',
      timeline,
      voicings: twoHands,
      beatsPerChord: chordBeats,
    })
  }, [setPracticeSong, songId, songTitle, timeline, twoHands, chordBeats])

  /*
    Nhận lời nhờ mở bài từ tab Luyện đệm.

    Bên kia chỉ có ảnh chụp, mà ảnh chụp chỉ ghi **lựa chọn** của người dùng —
    dòng thời gian phải dựng lại từ đó qua cả chuỗi luật tái hoà âm, sinh
    voicing và sinh câu fill, và chuỗi ấy nằm ở đây. Nên bên kia nhờ, bên này
    dựng rồi đăng lại; chép chuỗi dựng sang đó thì có hai bản và hai bản sẽ
    lệch nhau ngay lần sửa luật kế tiếp.

    Làm được vì tab này ở lại trong cây khi người dùng sang tab khác, chỉ ẩn
    đi. Tháo ra là mất sạch bài đang dựng, nên vốn đã phải giữ.
  */
  useEffect(() => {
    if (!openRequest) return

    applySnapshot(openRequest.snapshot)
    setSongId(openRequest.id)
    setSongTitle(openRequest.title)
    clearOpenRequest()
  }, [openRequest, applySnapshot, clearOpenRequest])


  /**
   * Dòng thời gian của lần phát thứ `pass`, dùng cho nút phát lặp.
   *
   * `pass` đếm **liên tục qua từng lần bấm phát**, không đếm lại từ 0.
   *
   * Bộ phát dựng sẵn ba lượt rồi lặp lại đúng ba lượt ấy, nên trong một lần
   * phát thì ba lượt giang tấu đã khác nhau. Nhưng bấm phát lần nữa lại dựng
   * từ lượt 0, tức lần nào cũng mở đầu bằng đúng một câu — không đúng yêu cầu
   * "mỗi lần giang tấu là một cái gì mới khác nhau".
   *
   * Dùng ref chứ không dùng state: con số này chỉ đọc lúc dựng lịch phát, đổi
   * nó không cần vẽ lại gì cả.
   */
  const passAt = useCallback(
    (pass: number) => {
      const round = playRound.current + pass
      return round === 0 ? timeline : buildPass(round, song.soloTakes).events
    },
    [buildPass, timeline, song.soloTakes],
  )

  /** Đếm số lượt đã dựng, để lần bấm phát sau nối tiếp chứ không lặp lại. */
  const advanceRound = useCallback(() => {
    playRound.current += LOOP_PASSES
  }, [])

  /**
   * Bài đã có đoạn kết bài thì **phát một lượt rồi dừng**.
   *
   * Lặp lại là phá luôn cái kết: vừa nghe hợp âm kết đọng xuống thì bài đã bắt
   * đầu lại từ đầu. Bài chưa đánh dấu kết thì vẫn lặp, vì lúc đó nó là vòng để
   * tập chứ không phải một bài trọn vẹn.
   */
  const playsOnce = useMemo(
    () => steps.some((step) => step.type === 'section' && step.ending),
    [steps],
  )

  /**
   * Đổi màu chủ âm thì đặt lại cả bộ màu cho ăn khớp.
   *
   * Chủ âm quyết định gu chung, nên để nó lệch pha với các bậc còn lại sẽ ra
   * một mớ chắp vá. Sau khi đặt lại, người dùng vẫn chỉnh riêng từng hàng được.
   */
  const applyTonicColor = (color: MajorChordColor) => {
    const palette = PALETTE_BY_TONIC_COLOR[color]

    setTonicColor(color)
    setMajorColor(palette.major)
    setMinorColor(palette.minor)
    setDominantColor(palette.dominant)
    setSusDominant(palette.susDominant)
  }

  /** Xung đột nhạc lý, gom theo vị trí hợp âm để hiện ngay cạnh nó. */
  const conflictMap = useMemo(
    () => conflictsByIndex(reharm.conflicts),
    [reharm.conflicts],
  )

  /** Tổng quãng đường tay phải phải đi, để thấy con số cụ thể. */
  const movement = useMemo(
    () => ({
      smooth: totalMovement(twoHands.map((voicing) => voicing.right)),
      plain: totalMovement(plain),
    }),
    [twoHands, plain],
  )

  const selected =
    selectedIndex !== null ? sequence.chords[selectedIndex] : undefined

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Tái hòa âm</h2>
        <p className="text-sm leading-relaxed text-dim">
          Nhập vòng hợp âm bất kỳ. Ở bước này KeyTrain mới đọc và phát lại đúng
          những gì bạn nhập — phần tái hòa âm theo phong cách sẽ thêm dần.
        </p>
      </div>

      {/*
        Vòng dựng sẵn đi chung một đường với việc dán lời: bộ đọc nhận cả dòng
        chỉ toàn hợp âm, nên không cần luồng riêng.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
          Vòng dựng sẵn
        </span>
        {PROGRESSION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => loadSong(parseSongText(preset.chords), preset.chords)}
            title={preset.note}
            className="rounded-lg border border-line bg-white/4 px-2.5 py-1 font-mono text-xs text-dim hover:bg-white/8 hover:text-cream"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <SongTextInput onUseSong={loadSong} />

      <SongLibrary
        currentId={songId}
        reloadKey={saveCount}
        onOpen={(saved, id, title) => {
          applySnapshot(saved)
          setSongId(id)
          setSongTitle(title)
        }}
      />

      {sheet && (
        <div ref={sheetRef} className="scroll-mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] tracking-[0.08em] text-amber-key uppercase">
              Bản nhạc đã tái hoà âm
            </h3>

            <SaveSongButton
              snapshot={snapshot}
              currentId={songId}
              currentTitle={songTitle}
              onSaved={(id, title) => {
                setSongId(id)
                setSongTitle(title)
                setSaveCount((count) => count + 1)
              }}
            />

            <SongFileButtons
              snapshot={snapshot}
              title={songTitle}
              onOpen={(saved, title) => {
                applySnapshot(saved)
                setSongTitle(title)
                /*
                  Mở từ file thì **chưa gắn với bài nào trong kho**, nên bấm
                  Lưu sau đó tạo bản mới chứ không đè lên một bài sẵn có.
                */
                setSongId(null)
              }}
            />

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Tone
              </span>
              <button
                type="button"
                onClick={() => setTranspose((value) => Math.max(-6, value - 1))}
                disabled={transpose <= -6}
                aria-label="Hạ tone nửa cung"
                title="Hạ nửa cung"
                className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream hover:bg-white/12 disabled:opacity-30"
              >
                −
              </button>
              <span
                className={`w-10 text-center font-mono text-xs ${
                  transpose === 0 ? 'text-dim' : 'text-amber-key'
                }`}
              >
                {transposeLabel(transpose)}
              </span>
              <button
                type="button"
                onClick={() => setTranspose((value) => Math.min(6, value + 1))}
                disabled={transpose >= 6}
                aria-label="Nâng tone nửa cung"
                title="Nâng nửa cung"
                className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream hover:bg-white/12 disabled:opacity-30"
              >
                +
              </button>
              {transpose !== 0 && (
                <button
                  type="button"
                  onClick={() => setTranspose(0)}
                  aria-label="Về tone gốc"
                  title="Về tone gốc"
                  className="rounded-md border border-line px-2 py-0.5 text-[10px] text-dim hover:bg-white/8"
                >
                  ↺
                </button>
              )}
            </div>

            <KeySelect
              value={manualKey}
              onChange={setManualKey}
              detectedLabel={reharm.keyCandidates[0]?.label}
            />
          </div>

          {reharm.keyAmbiguous && reharm.keySource === 'detected' && (
            <p className="mb-2 rounded-lg border border-teal-key/30 bg-teal-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
              App chưa chắc chắn về giọng — {reharm.keyCandidates[0]?.label} và{' '}
              {reharm.keyCandidates[1]?.label} đều khớp gần như nhau. Nếu tô màu
              nghe chưa đúng thì chọn giọng bằng tay.
            </p>
          )}

          <SongSheetView
            sheet={sheet}
            activeIndex={activeChordIndex}
            pairedChords={pairedChords}
            passingOptionsFor={(chordIndex) =>
              groupsAtSlot(passingGroups, chordIndex).map((group) => {
                const slotId = keyOf(chordIndex, group.technique)

                return {
                  id: group.id,
                  slotId,
                  technique: TECHNIQUE_LABELS[group.technique],
                  chords: group.chords.map((chord) => chord.symbol).join(' → '),
                  // Chọn một chỗ là áp cho mọi chỗ có cùng hợp âm đích.
                  places: group.slots.length,
                  applied: isGroupOn(group),
                  appliedHere: acceptedPassing.includes(slotId),
                }
              })
            }
            onTogglePassing={togglePassingGroup}
            onAddPassingHere={(slotId) =>
              setAcceptedPassing((current) =>
                current.includes(slotId) ? current : [...current, slotId],
              )
            }
            onRemovePassingHere={(slotId) =>
              setAcceptedPassing((current) =>
                current.filter((entry) => entry !== slotId),
              )
            }
            transitionAt={(chordIndex) => transitions.get(chordIndex) ?? null}
            onToggleTransition={(chordIndex) =>
              setTransitionEdits((current) => ({
                ...current,
                // Đang có mốc thì gỡ; chưa có thì thêm với cách chơi mặc định.
                [chordIndex]: transitions.has(chordIndex)
                  ? null
                  : DEFAULT_TRANSITION,
              }))
            }
            onSetTransition={(chordIndex, run) =>
              setTransitionEdits((current) => ({ ...current, [chordIndex]: run }))
            }
            fillAt={fillAt}
            onToggleFill={(chordIndex) =>
              setMutedFills((current) => {
                const next = new Set(current)
                if (next.has(chordIndex)) next.delete(chordIndex)
                else next.add(chordIndex)
                return next
              })
            }
            onSetChordSpan={(chordIndex, span, scope) =>
              setPairedChords((current) => {
                // Chỉ chỗ vừa bấm, hay mọi chỗ trong bài có cùng cặp hợp âm.
                if (scope === 'here') {
                  return span === 'half'
                    ? addChordPair(current, chordIndex)
                    : removeChordPair(current, chordIndex)
                }

                return span === 'half'
                  ? addSimilarChordPairs(current, recolored, chordIndex)
                  : removeSimilarChordPairs(current, recolored, chordIndex)
              })
            }
            pairPlacesAt={(chordIndex) =>
              similarChordPairs(recolored, chordIndex).length
            }
            onMark={(mark) => setSectionMarks((marks) => [...marks, mark])}
            onClearMarks={() => setSectionMarks([])}
            hasMarks={sectionMarks.length > 0}
            onSeek={(chordIndex) => {
              // Bàn phím đàn phía dưới chỉ thế bấm của đúng hợp âm vừa bấm.
              setSelectedIndex(chordIndex)
              if (!audioReady) return

              // Đang phát thì dừng hẳn rồi phát lại, cho khỏi chồng hai vòng.
              stopTimelineLoop()
              startTimelineLoop(
                (pass) => eventsForHand(passAt(pass), hand),
                bpm,
                loopLengthBeats,
                beatOfMainChord(chordIndex),
                playsOnce,
              )
              advanceRound()
            }}
          />

          {/*
            Nói thẳng ra cử chỉ mở bảng lựa chọn.

            Trước đây chỉ có chú thích hiện khi rê chuột, mà trên điện thoại
            không có chuột để mà rê — người dùng cảm ứng không có cách nào biết
            rằng hợp âm bấm giữ được, tức là mất gần hết phần chỉnh bài.
          */}
          <p className="mt-2 text-[11px] leading-relaxed text-dim">
            Bấm một hợp âm để phát từ đó.{' '}
            <span className="text-cream">Chuột phải</span> — hoặc{' '}
            <span className="text-cream">nhấn giữ</span> nếu dùng cảm ứng — để
            đổi thời lượng, chèn hợp âm lướt, bật tắt câu fill hay đặt mốc
            chuyển đoạn.
          </p>

          <p className="mt-2 text-xs leading-relaxed text-dim">
            Bấm vào một hợp âm để{' '}
            <span className="text-cream">phát lại từ đúng chỗ đó</span>, chuột
            phải để đổi nhịp, chèn hợp âm lướt hay tắt câu fill.
            {!audioReady && ' Bật âm thanh trước đã.'}
          </p>

          <p className="mt-1 font-mono text-[10px] text-dim">
            <span className="text-amber-key">hợp âm chính</span> ·{' '}
            <span className="text-teal-key italic">hợp âm lướt</span> ·{' '}
            <span className="underline decoration-dotted underline-offset-4">
              có câu fill
            </span>{' '}
            ·{' '}
            <span className="overline decoration-1">chia đôi ô nhịp</span>
          </p>
        </div>
      )}

      {songSources && (
        <ArrangementEditor
          sources={songSources}
          steps={steps}
          onChange={setArrangement}
        />
      )}

      {/*
        Câu fill và đoạn giang tấu.

        Chỉ còn nút chỉnh, không còn đoạn mô tả nào: người dùng đã tự chỉ ra
        chỗ nào là giang tấu trên bản nhạc, nên phần này không cần giải thích
        giang tấu là gì nữa. Các mẫu cấu trúc dựng sẵn cũng bỏ hẳn — thứ tự
        chơi thật đã được sắp ở khung Thứ tự chơi.

        Dải chip vẽ bản đồ các đoạn cũng bỏ nốt: nó vẽ lại đúng cái thứ tự đã
        bày rõ ràng ở khung Thứ tự chơi, mà lại vẽ sai — mọi đoạn có lời đều bị
        ghi chung một nhãn "Phiên khúc" vì bộ dựng chỉ phân biệt *có lời* với
        *giang tấu*, nên bài Phiên khúc → Tiền điệp khúc → Điệp khúc hiện ra
        thành ba ô "Phiên khúc" giống hệt nhau. Hai chỗ nói về cùng một thứ mà
        một chỗ nói sai thì bỏ chỗ sai.

        Ngẫu hứng ở giang tấu và chêm fill ở đoạn hát là **mặc định**, không
        hỏi nữa: bật tắt từng chỗ đã làm được bằng chuột phải trên bản nhạc.
      */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Câu fill và đoạn giang tấu
          </h3>
          <span className="rounded border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">
            thử nghiệm · mô phỏng phong cách
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              Lấy nốt từ đâu
            </h4>
            <div className="flex flex-wrap gap-2">
              {NOTE_SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setNoteSource(option.id)}
                  title={option.description}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    noteSource === option.id
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase"
              title="Hết mỗi câu thì nghỉ lấy hơi, và câu sau đổi quãng âm. Câu ngắn thì thoáng nhưng chỉ dùng được mẫu mở và mẫu kết; câu dài mới có chỗ cho mẫu giữa câu."
            >
              Độ dài mỗi câu nhạc
            </h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  title={
                    count < 3
                      ? 'Câu ngắn: chỉ có chỗ mở câu và kết câu'
                      : 'Câu dài: có thêm chỗ cho mẫu giữa câu, nhiều hình câu hơn hẳn'
                  }
                  onClick={() => setChordsPerPhrase(count)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    chordsPerPhrase === count
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {count} hợp âm
                </button>
              ))}
            </div>
          </div>

          {/*
            Bỏ ô chọn "Chiều nốt láy". Xen kẽ là mặc định và cũng là lựa chọn
            đúng gần như mọi lúc — láy toàn từ dưới lên hay toàn từ trên xuống
            nghe ra ngay là máy đánh. Giữ lại một ô mà ai cũng để nguyên chỉ
            làm khung điều khiển dài thêm.
          */}

          <div>
            <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              Mật độ nốt câu nhạc
            </h4>
            <div className="flex flex-wrap gap-2">
              {DENSITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSoloDensity(option.id)}
                  title={option.description}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    soloDensity === option.id
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase"
              title="Chêm câu fill vào bao nhiêu chỗ ca sĩ lấy hơi trong đoạn có lời"
            >
              Mật độ câu fill
            </h4>
            <div className="flex flex-wrap gap-2">
              {DENSITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFillDensity(option.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    fillDensity === option.id
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/*
            Nốt láy tách hẳn khỏi mật độ nốt câu nhạc.

            Một ô chỉnh làm hai việc thì muốn thưa nốt láy phải thưa luôn cả câu
            solo — không có cách nào giữ câu chạy dày mà bớt láy đi.
          */}
          <div>
            <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              Nốt láy
            </h4>
            <div className="flex flex-wrap gap-2">
              {GRACE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setGraceDensity(option.id)}
                  title={option.description}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    graceDensity === option.id
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {hand === 'left' && (
            <p className="rounded-lg border border-amber-key/30 bg-amber-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
              Mục Đệm theo điệu đang để{' '}
              <span className="text-cream">Tay trái</span>. Giai điệu do tay
              phải chơi nên sẽ không nghe thấy — đổi sang Hai tay hoặc Tay phải.
            </p>
          )}
        </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <button
              type="button"
              onClick={() =>
                looping
                  ? stopTimelineLoop()
                  : (startTimelineLoop(
                      (pass) => eventsForHand(passAt(pass), 'both'),
                      bpm,
                      loopLengthBeats,
                      0,
                      playsOnce,
                    ),
                    advanceRound())
              }
              disabled={!audioReady || timeline.length === 0}
              /*
                Lúc đang phát, nút phải đọc ra ngay là "dừng lại". Bản cũ dùng
                nền trắng mờ với chữ kem — trên nền tối thì gần như chỉ còn
                chữ nổi lơ lửng, không ra hình cái nút.
              */
              className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                looping
                  ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-amber-key text-ink hover:brightness-110'
              }`}
            >
              {looping ? '■ Dừng' : playsOnce ? '▶ Phát trọn bài' : '▶ Phát cả bài'}
            </button>

            {/*
              Nhịp độ đặt ngay cạnh nút phát: chậm bài lại là việc làm nhiều
              nhất khi tập, và đổi được ngay cả lúc đang phát vì phần đệm ghi
              theo số phách chứ không theo giây.
            */}
            <label className="flex items-center gap-2 text-xs text-dim">
              <input
                type="range"
                min={40}
                max={160}
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
                aria-label="Nhịp độ, số phách mỗi phút"
                title="Nhịp độ"
                className="w-32 accent-amber-key"
              />
              <span className="w-16 font-mono text-cream">{bpm} BPM</span>
            </label>

            <span className="font-mono text-[11px] text-dim">
              {loopLengthBeats} phách · giang tấu {soloTake(0).length} nốt ·{' '}
              {fills(0).length} nốt fill
            </span>

            {!audioReady && (
              <span className="text-xs text-dim">Bật âm thanh trước đã.</span>
            )}
          </div>
      </div>

      {/*
        Thêm màu hợp âm — đặt ngay dưới khung câu fill và giang tấu.

        Ba khung này cùng nói về **thứ sẽ nghe thấy khi bấm phát**: hoà âm nghe
        ra sao, chêm câu ở đâu, chơi theo thứ tự nào. Để chúng cạnh nhau ngay
        dưới bản nhạc thì chỉnh xong là nghe được luôn, không phải cuộn qua
        mấy khung nói về chuyện khác rồi cuộn ngược lên bấm phát.
      */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Thêm màu hợp âm
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-dim">
          Chữ ký số một của phong cách: không dùng hợp âm ba trơn, luôn thêm
          màu bằng sus, add9, 9, 11.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1">
            {(
              [
                ['off', 'Giữ nguyên'],
                ['light', 'Nhẹ'],
                ['full', 'Đậm'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setIntensity(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  intensity === value
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label
            className="flex items-center gap-2 text-xs text-dim"
            title="Bỏ bậc ba của hợp âm bảy át, đổi thành hợp âm treo — lối D9sus4, E9sus4 rất hay gặp trong phong cách này"
          >
            <input
              type="checkbox"
              checked={susDominant}
              onChange={(event) => setSusDominant(event.target.checked)}
              className="accent-amber-key"
            />
            Hợp âm át thành treo
          </label>

          <label
            className="flex items-center gap-2 text-xs text-dim"
            title="Tay phải bấm một hợp âm ba quen thuộc, tay trái giữ nốt bass khác — cách bấm hòa âm phức tạp mà không cần thuộc công thức"
          >
            <input
              type="checkbox"
              checked={useSlashChords}
              onChange={(event) => setUseSlashChords(event.target.checked)}
              className="accent-amber-key"
            />
            Bấm kiểu chồng trên bass
          </label>

          <label
            className="flex items-center gap-2 text-xs text-dim"
            title="Đoạn nào chơi lại lượt hai thì hợp âm cuối đổi thành bậc năm của chỗ sắp vào — kỹ thuật thứ năm của phong cách, ví dụ Em7 đổi thành E7b9"
          >
            <input
              type="checkbox"
              checked={varyOnRepeat}
              onChange={(event) => setVaryOnRepeat(event.target.checked)}
              className="accent-amber-key"
            />
            Đổi hợp âm kết khi lặp đoạn
          </label>
        </div>

        {useSlashChords && (
          <p className="mt-3 rounded-lg border border-teal-key/30 bg-teal-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
            Tay phải bấm hợp âm ba đơn giản, tay trái giữ nốt bass. Cách bấm
            này <span className="text-cream">bỏ bớt nốt</span> so với hợp âm
            đầy đủ — đó là chủ ý của kỹ thuật, người chơi thật cũng chỉ bấm
            bấy nhiêu.
          </p>
        )}

        {/* Màu cho từng nhóm bậc */}
        {intensity === 'full' && (
          <div className="mt-4 flex flex-col gap-4">
            <label
              className="flex items-center gap-2 text-xs text-dim"
              title="Các màu jazz hợp lệ nhưng không thấy trong tài liệu phân tích phong cách anh Khá"
            >
              <input
                type="checkbox"
                checked={allowJazzColors}
                onChange={(event) => setAllowJazzColors(event.target.checked)}
                className="accent-teal-key"
              />
              Cho dùng màu jazz ngoài tài liệu
              <span className="font-mono text-[10px] text-teal-key">
                (viền nét đứt)
              </span>
            </label>

            <div>
              <ColorPicker
                title="Màu cho chủ âm"
                hint="Chủ âm là chỗ nghỉ của cả bài. Đổi màu chủ âm sẽ kéo theo các bậc khác đổi cho ăn khớp."
                options={MAJOR_COLOR_OPTIONS}
                value={tonicColor}
                onChange={applyTonicColor}
                allowJazz={allowJazzColors}
              />

              <p className="mt-2 rounded-lg border border-teal-key/30 bg-teal-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
                Gu hiện tại:{' '}
                <span className="text-teal-key">
                  {PALETTE_BY_TONIC_COLOR[tonicColor].styleName}
                </span>
                . Đổi màu chủ âm sẽ đặt lại các hàng bên dưới cho ăn khớp, sau
                đó bạn vẫn chỉnh riêng từng hàng được.
              </p>
            </div>

            <ColorPicker
              title="Màu cho các bậc trưởng khác"
              hint="Áp cho bậc I và IV của giọng trưởng, bậc III và VI của giọng thứ. Bậc V không nằm trong nhóm này vì cần bậc bảy để kéo về chủ âm."
              options={MAJOR_COLOR_OPTIONS}
              value={majorColor}
              onChange={setMajorColor}
              allowJazz={allowJazzColors}
            />

            <ColorPicker
              title="Màu cho hợp âm thứ"
              hint="Áp cho bậc ii, iii, vi của giọng trưởng và bậc i, iv của giọng thứ. Bậc nửa giảm không nằm trong nhóm này."
              options={MINOR_COLOR_OPTIONS}
              value={minorColor}
              onChange={setMinorColor}
              allowJazz={allowJazzColors}
            />

            <div>
              <ColorPicker
                title="Màu cho bậc năm"
                hint="Mọi lựa chọn đều giữ nốt bậc bảy để không mất lực kéo về chủ âm."
                options={DOMINANT_COLOR_OPTIONS}
                value={dominantColor}
                onChange={setDominantColor}
                allowJazz={allowJazzColors}
              />

            </div>
          </div>
        )}

        {/* Đối chiếu trước và sau */}
        {sequence.chords.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            {sequence.chords.map((original, index) => {
              const after = recolored[index]
              const changed = after && after.symbol !== original.symbol
              const upper = after ? bestUpperStructure(after) : null

              return (
                <div
                  key={`${original.symbol}-${index}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                >
                  <span className="w-20 font-mono text-xs text-dim">
                    {original.symbol}
                  </span>
                  <span
                    className="w-16 font-mono text-[10px] text-teal-key"
                    title="Bậc trong giọng — quyết định hợp âm được tô màu thế nào"
                  >
                    {reharm.analyzed[index]?.degree
                      ? reharm.analyzed[index].roman
                      : reharm.analyzed[index]?.actsAsDominant
                        ? 'V phụ'
                        : 'ngoài giọng'}
                  </span>
                  <span className="text-dim">→</span>
                  <span
                    className={`w-24 font-serif text-base ${
                      changed ? 'text-amber-key' : 'text-dim'
                    }`}
                  >
                    {after?.symbol ?? original.symbol}
                  </span>

                  {upper && (
                    <span
                      className="font-mono text-[11px] text-teal-key"
                      title="Cách bấm dễ hơn: tay phải bấm hợp âm đơn giản này, tay trái giữ nốt bass"
                    >
                      = {upper.label}
                    </span>
                  )}

                  {/* Cảnh báo xung đột nhạc lý cho đúng hợp âm này */}
                  {(conflictMap.get(index) ?? []).map((conflict) => (
                    <span
                      key={conflict.kind}
                      className={`w-full text-[11px] leading-relaxed ${
                        conflict.severity === 'warning'
                          ? 'text-rose-300'
                          : 'text-dim'
                      }`}
                    >
                      {conflict.severity === 'warning' ? '⚠ ' : '· '}
                      {conflict.message}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/*
        Đã bỏ: ô gõ vòng hợp âm, dãy thẻ hợp âm đọc được, và ba nút nghe thử.

        Cả ba đều là di sản của luồng cũ — gõ một vòng hợp âm rời rồi nghe. Từ
        khi dán được lời bài hát thì bản nhạc bên trên đã bày đủ hợp âm ngay
        trên đầu từng chữ, bấm vào là phát từ đó, và nút Phát cả bài nghe được
        trọn vẹn cả điệu lẫn câu fill.

        Ô nhập biến mất nhưng **trạng thái `input` thì không**: nó vẫn là nguồn
        vòng hợp âm cho cả trang, và được nạp từ bài hát vừa dán vào.
      */}

      <div>
        <OnScreenPiano
          leftHandNotes={
            selectedIndex !== null ? twoHands[selectedIndex]?.left : undefined
          }
          rightHandNotes={
            selectedIndex !== null ? twoHands[selectedIndex]?.right : undefined
          }
          highlightNotes={
            selectedIndex !== null && !twoHands[selectedIndex]
              ? (selected ? notesForChord(selected) : undefined)
              : undefined
          }
        />

        <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[10px] text-dim">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-left-hand" />
            tay trái
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-right-hand" />
            tay phải
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-key" />
            đang bấm
          </span>
        </div>
      </div>

      {/* Dẫn bè */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Dẫn bè
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-dim">
          Nguyên lý gốc của phong cách: chọn thế bấm sao cho các nốt di chuyển
          ít nhất giữa hai hợp âm. Tắt đi để nghe cách bấm mộc, luôn xếp chồng
          từ nốt gốc.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSmoothVoicing(true)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                smoothVoicing
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              Có dẫn bè
            </button>
            <button
              type="button"
              onClick={() => setSmoothVoicing(false)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                !smoothVoicing
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              Thế mộc
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-dim">
            <input
              type="checkbox"
              checked={dropRoot}
              onChange={(event) => setDropRoot(event.target.checked)}
              className="accent-amber-key"
            />
            Bỏ nốt gốc ở tay phải
          </label>
        </div>

        {sequence.chords.length > 1 && (
          <p className="mt-3 border-t border-line pt-3 font-mono text-[11px] text-dim">
            Quãng đường tay phải phải đi:{' '}
            <span className="text-teal-key">{movement.smooth}</span> nửa cung
            khi có dẫn bè, so với{' '}
            <span className="text-rose-300">{movement.plain}</span> khi bấm
            mộc.
          </p>
        )}
      </div>

      {/*
        Khung "Hợp âm lướt" đã bỏ.

        Mọi việc của nó — xem gợi ý đặt được ở đâu, chèn cả loạt hay chèn lẻ
        một chỗ, gỡ ra — giờ nằm trong menu chuột phải ngay trên bản nhạc. Chuột
        phải hơn hẳn ở chỗ nó **gắn với đúng hợp âm đang bàn tới**, còn khung
        này bày một danh sách rời rồi bắt người dùng tự dò xem nó nói về chỗ
        nào. Bày cả hai thì vừa dài vừa dễ lệch nhau.
      */}

      {/* Đệm theo điệu */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Đệm theo điệu
          </h3>
          <span className="font-mono text-[10px] text-teal-key">
            {style.timeSignature} · đã xác nhận từ video
          </span>
        </div>

        {/* Chọn điệu */}
        <div className="mb-3 flex flex-wrap gap-2">
          {ALL_STYLES.map((entry) => {
            const playable = isPlayable(entry)

            return (
              <button
                key={entry.id}
                type="button"
                disabled={!playable}
                onClick={() => setStyleId(entry.id)}
                title={
                  playable
                    ? entry.note
                    : 'Chưa có mẫu tiết tấu xác thực từ nguồn, nên KeyTrain không đoán bừa.'
                }
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  !playable
                    ? 'cursor-not-allowed border-line/50 bg-white/2 text-dim/40'
                    : styleId === entry.id
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {entry.name}
                <span className="ml-1.5 font-mono text-[9px] opacity-60">
                  {entry.timeSignature}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mb-3 text-xs leading-relaxed text-dim">{style.note}</p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              looping
                ? stopTimelineLoop()
                : (startTimelineLoop(
                    (pass) => eventsForHand(passAt(pass), hand),
                    bpm,
                    loopLengthBeats,
                    0,
                    playsOnce,
                  ),
                  advanceRound())
            }
            disabled={!audioReady || timeline.length === 0}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
              looping
                ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                : 'bg-amber-key text-ink hover:brightness-110'
            }`}
          >
            {looping ? '■ Dừng' : '▶ Phát lặp bản đệm'}
          </button>

          <div className="flex gap-1">
            {(
              [
                ['both', 'Hai tay'],
                ['left', 'Tay trái'],
                ['right', 'Tay phải'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setHand(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  hand === value
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-5">
          {/*
            Ô nhịp độ đã chuyển lên cạnh nút Phát cả bài. Đang tập mà thấy
            nhanh quá thì phải với tới được ngay, không phải cuộn xuống đáy
            trang đi tìm.
          */}

          <label className="flex items-center gap-2 text-xs text-dim">
            Mỗi hợp âm
            <select
              value={beatsPerChord}
              onChange={(event) =>
                setBeatsPerChord(Number(event.target.value))
              }
              className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream"
            >
              <option value={8}>2 ô nhịp</option>
              <option value={4}>1 ô nhịp</option>
              <option value={2}>nửa ô nhịp</option>
              <option value={1}>1 phách</option>
            </select>
          </label>
        </div>
      </div>

      {/*
        Khung "Chia hai tay" liệt kê nốt của từng tay cho từng hợp âm đã bỏ.

        Nó dài bằng cả vòng hợp âm mà không nói thêm được gì: bàn phím đàn phía
        trên đã chỉ đúng thế bấm bằng màu riêng cho mỗi tay, và chế độ chờ đánh
        đúng nốt cũng hiện nốt đang chờ. Đọc tên nốt dạng chữ là cách xem kém
        nhất trong ba cách, mà lại chiếm chỗ nhiều nhất.
      */}

      {/*
        Đã bỏ: bảng chọn tính chất và lưới chạm nốt gốc để thêm hợp âm.

        Chúng dùng để **dựng từng hợp âm bằng cách bấm**, tức phục vụ đúng cái ô
        nhập vừa bỏ đi. Không còn ô nhập thì chúng không ghi vào đâu được nữa.
      */}
    </section>
  )
}
