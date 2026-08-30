import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LOOP_PASSES,
  setInstrument,
  setVolumeDb,
  startAudio,
  startTimelineLoop,
  stopTimelineLoop,
  useAudioStore,
  usePlaybackStore,
} from '../shared/audio/audioEngine'
import {
  loadSourceFile,
  pauseSource,
  stopSource,
  setSourceEnabled,
  setSourceNativeBpm,
  setSourceVolume,
  startSourceAtBeat,
  syncSourceRate,
} from '../shared/audio/sourceAudio'
import { setBpm, useMetronomeStore } from '../shared/audio/metronome'
import { usePracticeStore } from './playback/practiceStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { chordNotes } from '../shared/musicTheory/chordDefinitions'
import type { MidiNote } from '../shared/musicTheory/types'
import { fitToKeyboard } from '../shared/musicTheory/voicing'
import {
  addSimilarChordPairs,
  beatsOf,
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
import {
  semitonesToKey,
  shiftKeyId,
  transposeChords,
  transposeLabel,
} from './transpose'
import { SongImport } from './input/SongImport'
import { ChordOverview } from './input/ChordOverview'
import { accentBeats, soloLeftHand } from './style/soloLeftHand'
import { buildLine, lineToTimeline } from './fillSoloGenerator/lineBuilder'
import { expandToBeats } from './input/chromaMatch'
import { listToBeatTable } from './input/importedTrack'
import { SongTextInput } from './input/SongTextInput'
import { SongSheetView } from './input/SongSheetView'
import type { SectionMark } from './input/songSheet'
import {
  breathChords,
  singingChords,
  buildSongSheet,
  resectionSheet,
  sectionChordRanges,
  attachPhraseToSheet,
} from './input/songSheet'
import type { ParsedSong } from './input/songTextParser'
import { insertChordAfter, parseSongText } from './input/songTextParser'
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
  SOLO_RANGE,
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
import {
  accidentalStyleFor,
  bestKey,
  keyLabel,
  orderedKeys,
} from './reharmEngine/keyDetection'
import { normalizePitchClass, pitchClassName } from '../shared/musicTheory/pitch'
import { bluesChoice, prefersBlues, prefersSingleScale, suggestScales } from './style/phraseScale'
import {
  LONG_INTERLUDE_BARS,
  interludeDensity,
  pulseForStyle,
} from './fillSoloGenerator/soloFeel'

/** Mục "mỗi hợp âm một gam" trong khung chọn gam đoạn không lời. */
const MULTI_SCALE = 'multi'
import { reharmonize } from './reharmEngine/reharmPipeline'
import type {
  ColorIntensity,
  ColorOptionBase,
  DominantChordColor,
  MajorChordColor,
  MinorChordColor,
} from './reharmEngine/staticVoicingRules'
import { haiPalette } from './brain/haiPalette'
import { brainFill } from './brain/fillFromBrain'
import { brainInterludeWindow } from './brain/interlude'
import { brainPassingSuggestions } from './brain/passing'
import { brainPhrase } from './brain/phrase'
import { walkingBassLine } from './brain/walkingBass'
import { teacherBadge } from './brain/badge'
import { scaleForChord, scaleGaps, scaleLabelForChord } from './brain/chordScale'
import { soloFeelFor } from './fillSoloGenerator/soloFeel'
import { BALLAD_SOLO_RANGE, isBalladStyle } from './style/balladFamily'
import { plainForInterlude } from './style/interludeChords'
import { cueChord, phraseChords } from './style/phraseChords'
import { buildPhraseSection } from './style/phraseSection'
import {
  hasChorusVariant,
  isSplitAwareStyle,
  hasTonicVariant,
  resolveStyleForChord,
  resolveStyleForSection,
} from './style/sectionStyles'
import { kieuChoSolo } from './style/hoDieu'
import { conflictsByIndex } from './reharmEngine/colorConflicts'
import {
  DOMINANT_COLOR_OPTIONS,
  MAJOR_COLOR_OPTIONS,
  MINOR_COLOR_OPTIONS,
  PALETTE_BY_TONIC_COLOR,
  bestUpperStructure,
  compatibleColorIds,
  nextColorId,
  withQuality,
  toSlashChord,
} from './reharmEngine/staticVoicingRules'
import {
  plainSequence,
  totalMovement,
} from './reharmEngine/voiceLeadingOptimizer'
import {
  eventsForHand,
  giveCompingToLeft,
  yieldToFill,
  renderPattern,
} from './style/patternRenderer'
import {
  SONG_FORMS,
  buildSongTimeline,
  arrangedBeatAt,
  sourceBeatAt,
} from './style/songStructure'
import type { SectionKind } from './style/songStructure'
import type { ArrangementStep, SourceSection } from './style/arrangement'
import {
  DEFAULT_REST_AFTER,
  buildArrangedSong,
  defaultArrangement,
} from './style/arrangement'
import { pullChordFor } from './style/turnaround'
import { chooseChorusLoop } from './style/interludeLoop'
import type { EndingMode } from './style/endingChord'
import { endingChordFor } from './style/endingChord'
import type { LickyMode } from './licky/types'


/**
 * Giang tấu chạy trên bốn hợp âm nhặt từ vòng của bài.
 *
 * Bốn là độ dài tai nhận ra được một vòng tuần hoàn mà chưa kịp chán — mượn
 * trọn cả đoạn thì giang tấu dài lê thê.
 */
/**
 * Giang tấu mượn mấy hợp âm của bài. Mặc định **bốn** — không đổi.
 *
 * Bốn là con số người dùng chọn bằng tai sau khi bác bản mượn nguyên vòng:
 * "dài lê thê, và hết vòng thì đoạn hát nhảy vào đột ngột chẳng có gì báo
 * trước" — xem `style/interludeLoop.ts`. Nên đây là mặc định GIỮ NGUYÊN, còn
 * các mức dài hơn là lựa chọn để nghe thử, không phải để thay.
 *
 * Vì sao có mức dài: đo trên bảy bản ký âm của Cà Pháo thì đoạn từ 18 ô trở
 * lên mới được viết thành một bản độc tấu, còn từ 11 ô trở xuống anh ấy coi là
 * cầu nối và đi qua bằng chính kết cấu đoạn hát. Bốn hợp âm ra 4-8 ô nhịp —
 * luôn ở phía cầu nối, nên luật `interludeDensity` không bao giờ có chỗ nói.
 *
 * Lưu ý điều đã học lần trước: nếu đoạn dài vẫn nghe lê thê thì rất có thể
 * không phải tại độ dài, mà tại câu solo bị dập từ hình lick có sẵn nên không
 * có hình dáng đi đâu về đâu. Chỗ ấy là việc của bộ sinh câu, không sửa ở đây.
 */
const INTERLUDE_LENGTHS = [4, 8, 12, 16] as const
const DEFAULT_INTERLUDE_CHORDS = 4


/**
 * Cách chơi ô nối mặc định: hợp âm rải hai quãng tám, im hai phách.
 *
 * Hai phách đo từ bản ký âm `reference/nguoi ay.mxl` — chỗ người hát cất giọng
 * trước phách mạnh. Người dùng chỉnh lại được từng chỗ bằng chuột phải.
 */
const DEFAULT_TRANSITION: TransitionRun = { octaves: 2, restBeats: 2 }

function shiftRecord<T>(
  table: Record<number, T>,
  at: number,
  delta: 1 | -1,
): Record<number, T> {
  const next: Record<number, T> = {}
  for (const [key, value] of Object.entries(table)) {
    const index = Number(key)
    if (delta < 0 && index === at) continue
    next[index >= at ? index + delta : index] = value
  }
  return next
}

function shiftIndexSet(
  values: ReadonlySet<number>,
  at: number,
  delta: 1 | -1,
): Set<number> {
  const next = new Set<number>()
  for (const index of values) {
    if (delta < 0 && index === at) continue
    next.add(index >= at ? index + delta : index)
  }
  return next
}

function shiftSlotKeys(
  keys: readonly string[],
  at: number,
  delta: 1 | -1,
): string[] {
  return keys.flatMap((key) => {
    const cut = key.indexOf(':')
    const index = Number(key.slice(0, cut))
    if (delta < 0 && index === at) return []
    return [`${index >= at ? index + delta : index}${key.slice(cut)}`]
  })
}

function shiftSlotRecord(
  table: Record<string, number>,
  at: number,
  delta: 1 | -1,
): Record<string, number> {
  const next: Record<string, number> = {}
  for (const [key, value] of Object.entries(table)) {
    const cut = key.indexOf(':')
    const index = Number(key.slice(0, cut))
    if (delta < 0 && index === at) continue
    next[`${index >= at ? index + delta : index}${key.slice(cut)}`] = value
  }
  return next
}

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
} from './style/styleLibrary'
import { StylePicker } from './style/StylePicker'
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
  scaleFilter,
}: {
  value: string
  onChange: (value: string) => void
  /** Giọng **app tự dò ra**, không phải giọng đang chọn. */
  detectedLabel: string | undefined
  /** Chỉ hiện các giọng cùng tính chất (major/minor) với bài hiện tại. */
  scaleFilter?: 'major' | 'minor' | null
}) {
  const keys = scaleFilter
    ? orderedKeys().filter((k) => k.scale === scaleFilter)
    : orderedKeys()

  return (
    <label className="flex items-center gap-2 text-xs text-dim">
      Giọng
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        title="Đổi cả bài sang giọng này. Chọn Tự dò nếu muốn để app đoán lại."
        className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream"
      >
        <option value="">
          Tự dò{detectedLabel ? ` (${detectedLabel})` : ''}
        </option>
        {keys.map(({ tonic, scale }) => (
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
  const volumeDb = useAudioStore((state) => state.volumeDb)
  const setPracticeSong = usePracticeStore((state) => state.setSong)
  const setPracticeTransport = usePracticeStore((state) => state.setTransport)
  const setPracticeGrid = usePracticeStore((state) => state.setGrid)
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
  /** Phách từng hợp âm khi nhập từ lưới / file — đè lên nhịp đổi hợp âm chung. */
  const [importedBeats, setImportedBeats] = useState<Record<number, number>>({})
  /** Có bài (file/lưu) thì giữ BPM bài, không đổi theo điệu. */
  const [lockSongBpm, setLockSongBpm] = useState(false)
  const [hasSource, setHasSource] = useState(false)
  const [sourceOn, setSourceOn] = useState(false)
  const [sourceVol, setSourceVol] = useState(45)
  /**
   * Các chỗ người dùng đã tắt câu fill, tính theo vòng hợp âm chính.
   *
   * Chỉ ghi những chỗ **bị tắt**; chỗ không có trong đây thì cứ theo mật độ
   * chung. Ghi kiểu này thì đổi mật độ vẫn giữ được lựa chọn của người dùng.
   */
  const [mutedFills, setMutedFills] = useState<ReadonlySet<number>>(new Set())
  const [extraFills, setExtraFills] = useState<ReadonlySet<number>>(new Set())
  const [extraRuns, setExtraRuns] = useState<ReadonlySet<number>>(new Set())
  const [fillRests, setFillRests] = useState<Record<number, number>>({})
  const [lickyFills, setLickyFills] = useState(true)
  const [lickyRuns, setLickyRuns] = useState(false)
  const [lickyMode, setLickyMode] = useState<LickyMode>('clone')
  const [phraseSpin, setPhraseSpin] = useState(0)
  const [colorEdits, setColorEdits] = useState<Record<number, string>>({})
  const [mutedHeld, setMutedHeld] = useState<ReadonlySet<number>>(new Set())
  const [slashEdits, setSlashEdits] = useState<Record<number, boolean>>({})
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  /** Bật dẫn bè hay để thế bấm mộc, dùng để nghe đối chiếu. */
  const [smoothVoicing, setSmoothVoicing] = useState(true)
  const [dropRoot, setDropRoot] = useState(true)
  /** Số phách mỗi hợp âm chiếm — chính là nhịp đổi hợp âm của bài. */
  const [beatsPerChord, setBeatsPerChord] = useState(4)
  const [styleId, setStyleId] = useState('pop-1')
  /** Mức thêm màu cho hợp âm. */
  const [intensity, setIntensity] = useState<ColorIntensity>('full')
  const [susDominant, setSusDominant] = useState(true)
  /** Màu của chủ âm — quyết định gu chung của cả vòng. */
  const [tonicColor, setTonicColor] = useState<MajorChordColor>('add9')
  /*
    Đang chơi gu thầy Hải hay gu anh Khá. Mặc định vẫn là Khá — bảng màu của
    thầy Hải là thứ *thêm vào*, bấm mới có, không tự chiếm chỗ.
  */
  const [haiGu, setHaiGu] = useState(false)
  const paletteHai = haiPalette()
  const [majorColor, setMajorColor] = useState<MajorChordColor>('add9')
  const [minorColor, setMinorColor] = useState<MinorChordColor>('auto')
  const [dominantColor, setDominantColor] =
    useState<DominantChordColor>('9sus4')
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
  const [passingKeep, setPassingKeep] = useState<Record<string, number>>({})
  /**
   * Chiều nốt láy cố định là **xen kẽ**.
   *
   * Ô chọn đã bỏ: láy toàn từ dưới lên hay toàn từ trên xuống nghe ra ngay là
   * máy đánh, nên không ai đổi khỏi xen kẽ.
   */
  const soloDirection: ApproachDirection = 'mixed'
  /**
   * Mật độ **chỗ chêm câu fill**, tách hẳn khỏi mật độ nốt câu nhạc.
   *
   * Hai thứ này ở hai chỗ khác nhau của bài: câu fill chêm vào đoạn **có lời**,
   * câu solo chạy ở đoạn **giang tấu**. Gộp làm một ô thì để câu solo thưa cho
   * thoáng là đoạn hát cũng mất luôn phần lớn chỗ chêm.
   */
  const [fillDensity, setFillDensity] = useState<OrnamentDensity>('medium')
  /*
    Câu lót lấy hình từ bộ não PianoBrain (luật thầy Kingsley) thay vì câu ba
    nốt đi liền bậc của KeyTrain. Mặc định tắt: đây là thứ thêm vào, không phải
    thứ thay chỗ cách chơi cũ. Não không có luật khớp thì tự lùi về cách cũ.
  */
  const [brainFills, setBrainFills] = useState(false)
  /*
    Tay trái đi walking bass 1-2-3-5 theo Pianote thay vì tuyến trầm của ô nhịp.
    Mặc định tắt: đây là thứ thêm vào, không phải thứ thay cách đệm sẵn có.
  */
  const [walkingBass, setWalkingBass] = useState(false)

  /*
    Điệu đang chọn có thuộc họ ballad không.

    Walking 1-2-3-5 và câu lót Kingsley đều rút từ bài giảng đệm ballad, đem
    sang swing hay bossa là dùng sai chỗ — nên hai công tắc ấy chỉ hiện ở họ
    ballad. Xem `style/balladFamily.ts`.
  */
  const ballad = isBalladStyle(styleId)

  /*
    Chặn walking chạy ngầm.

    Người dùng bật walking ở ballad rồi đổi sang swing thì ô tick biến mất,
    nhưng biến trạng thái vẫn còn `true`. Lấy giá trị đã nhân với `ballad` chứ
    không đọc thẳng biến kia, nên đổi điệu là tuyến trầm cũ quay lại ngay, không
    phụ thuộc vào việc dọn trạng thái có kịp chạy hay không.
  */
  const walkingOn = walkingBass && ballad
  const brainFillsOn = brainFills && ballad

  /*
    Rời họ ballad thì tắt hẳn hai công tắc, đừng để chúng nhớ lựa chọn cũ.

    Phần phát tiếng đã an toàn nhờ `walkingOn` ở trên; effect này lo phần còn
    lại: quay về ballad sau khi ghé qua swing thì ô tick phải trống, chứ không
    bật sẵn lại một thứ người dùng không chọn lần này.
  */
  useEffect(() => {
    if (ballad) return
    setWalkingBass(false)
    setBrainFills(false)
  }, [ballad])
  /** Mật độ nốt láy — giang tấu mặc định tắt, câu chạy đã đủ dày. */
  const [graceDensity, setGraceDensity] = useState<GraceDensity>('none')
  const [noteSource, setNoteSource] = useState<SoloNoteSource>('chordTone')
  /**
   * Lấy thang âm jazz từ kho PianoBrain cho đoạn không lời.
   *
   * Nằm riêng chứ không phải mục thứ tư của hàng "lấy nốt từ đâu": ba nguồn kia
   * dựng nốt từ chính hợp âm và luôn có tiếng, còn công tắc này đọc kho, chỉ
   * chạy ở đoạn không lời, và im lặng trên hợp âm nào kho chưa có gam.
   *
   * Mặc định **bật**. Hợp âm nào kho chưa có gam thì báo dưới ô tick, và chỗ
   * đó giữ nốt hợp âm.
   */
  const [storeScales, setStoreScales] = useState(true)
  /** Nguồn nốt thật sự đưa cho bộ sinh câu: công tắc gam jazz đè lên lựa chọn kia. */
  const soloNoteSource: SoloNoteSource = storeScales ? 'storeScale' : noteSource
  /**
   * Gam cho **đoạn không lời**: dạo đầu, kết bài, giang tấu.
   *
   * `null` là lối **nhiều gam** — mỗi hợp âm một gam, đổi theo hoà âm, đúng lối
   * jazz và đúng hành vi cũ. Chọn một mục là chuyển sang lối **một gam**: một
   * thang âm chạy suốt cả vòng, mặc kệ hợp âm đổi, đúng lối pop / rock / blues.
   *
   * Hai lối không thay được nhau nên không gộp thành một thanh trượt. Đề xuất
   * gam nằm ở `style/phraseScale.ts`, chấm điểm theo chính vòng hợp âm của bài.
   */
  const [phraseScaleId, setPhraseScaleId] = useState<string | null>(null)
  /**
   * Rút hợp âm đoạn không lời về chất cơ bản trước khi dựng câu.
   *
   * Bật sẵn: giang tấu vốn đã rút gọn từ trước, và đoạn dạo giờ mượn hợp âm của
   * bài nên thừa hưởng đúng vấn đề ấy — chồng `add9`, `9sus4`, `13` lên nền solo
   * thì nốt ngoài giọng nhiều tới mức câu chạy nghe lạc. Tắt được, vì có bài
   * người ta muốn giữ nguyên bảng màu.
   */
  const [plainPhrase, setPlainPhrase] = useState(true)
  /** Giang tấu mượn mấy hợp âm của bài. Xem `INTERLUDE_LENGTHS`. */
  const [interludeChords, setInterludeChords] = useState<number>(
    DEFAULT_INTERLUDE_CHORDS,
  )
  /**
   * Dựng câu solo đoạn không lời bằng **cọc và nối** thay cho sổ mẫu Licky.
   *
   * Chấm bằng `styleProfile` trên corpus Cà Pháo, mười sáu lượt, bốn điệu: bộ
   * mới ra 16 trên 24 chỉ số nằm trong khoảng người thật, sổ mẫu ra 4. Slow
   * rock và pop vào hẳn khoảng hình câu; bolero còn lệch vì có cặp cọc cách
   * nhau nửa phách.
   *
   * MẶC ĐỊNH TẮT. Người dùng nghe thử và bác: "các đoạn solo giờ nghe loạn quá."
   *
   * Số liệu nói nó gần người thật hơn ở ba chỉ số bề mặt, nhưng ba chỉ số ấy đo
   * CHẤT LIỆU chứ không đo CẤU TRÚC. Đo tiếp thì thấy chỗ hỏng: câu của bộ này
   * chỉ có **3 cỡ nhịp khác nhau**, trong khi người thật dùng 7 tới 22 và sổ mẫu
   * Licky dùng 6. Mọi quyết định trong bộ này là về cao độ; nhịp thì luôn chia
   * đều khoảng trống giữa hai cọc. Một dòng nốt đều tăm tắp thì tai không tách
   * được câu, và đó là thứ nghe ra thành "loạn".
   *
   * Giữ lại để so, không bỏ: phần đóng cọc theo hoà âm và nhịp của điệu vẫn
   * đúng. Thứ thiếu là nhịp của chính câu nhạc.
   */
  const [lineSolo, setLineSolo] = useState(false)
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
  const playSpin = useRef(0)

  /** Bài đang mở từ kho; rỗng nghĩa là bài chưa lưu lần nào. */
  const [songId, setSongId] = useState<string | null>(null)
  const [songTitle, setSongTitle] = useState<string | null>(null)
  /** Tăng lên mỗi lần lưu, để danh sách bài đọc lại kho. */
  const [saveCount, setSaveCount] = useState(0)

  const bpm = useMetronomeStore((state) => state.bpm)

  const parsed = useMemo(() => parseChordInput(input), [input])

  /** Giọng của bản dán, trước khi nâng hạ tone. */
  const chartKey = useMemo(() => bestKey(parsed.chords), [parsed.chords])

  const lockedKey = useMemo(() => {
    if (!manualKey) return null
    const [tonic, scale] = manualKey.split(':')
    return {
      tonic: Number(tonic),
      scale: scale as 'major' | 'minor',
    }
  }, [manualKey])

  /**
   * Ô Giọng đang chọn thì tone phải khớp giọng đó — không để kẹt
   * "E thứ" mà hợp âm vẫn ở G.
   */
  const effectiveTranspose =
    lockedKey && chartKey
      ? semitonesToKey(chartKey.tonic, lockedKey.tonic)
      : transpose

  const soundingStyle = chartKey
    ? accidentalStyleFor(
        normalizePitchClass(chartKey.tonic + effectiveTranspose),
        lockedKey?.scale ?? chartKey.scale,
      )
    : 'sharp'

  /** Vòng hợp âm sau khi nâng hạ tone — mọi thứ phía sau đều dựa trên đây. */
  const sequence = useMemo(
    () => ({
      ...parsed,
      chords: transposeChords(parsed.chords, effectiveTranspose, soundingStyle),
    }),
    [parsed, effectiveTranspose, soundingStyle],
  )

  const duplicateChord = useCallback(
    (index: number, beats: 2 | 4) => {
      const source = parsed.chords[index]
      if (!source) return
      const copy = { ...source }
      const list = [
        ...parsed.chords.slice(0, index + 1),
        copy,
        ...parsed.chords.slice(index + 1),
      ]
      const from = index + 1
      setInput(list.map((chord) => chord.symbol).join(' '))
      setPastedSong((song) =>
        song ? insertChordAfter(song, index, copy) : song,
      )
      setImportedBeats((table) => {
        const next = shiftRecord(table, from, 1)
        next[from] = beats
        return next
      })
      setPairedChords((set) => {
        const next = shiftIndexSet(set, from, 1)
        next.delete(index)
        return next
      })
      setMutedFills((set) => shiftIndexSet(set, from, 1))
      setExtraFills((set) => shiftIndexSet(set, from, 1))
      setExtraRuns((set) => shiftIndexSet(set, from, 1))
      setFillRests((table) => shiftRecord(table, from, 1))
      setMutedHeld((set) => shiftIndexSet(set, from, 1))
      setColorEdits((table) => shiftRecord(table, from, 1))
      setSlashEdits((table) => shiftRecord(table, from, 1))
      setTransitionEdits((table) => shiftRecord(table, from, 1))
      setAcceptedPassing((keys) => shiftSlotKeys(keys, from, 1))
      setPassingKeep((table) => shiftSlotRecord(table, from, 1))
    },
    [parsed.chords],
  )

  /** Khoá định danh một gợi ý, để nhớ người dùng đã bật cái nào. */
  const keyOf = (index: number, technique: string) => `${index}:${technique}`


  /**
   * Chạy cả đường ống tái hòa âm: dò giọng → phân tích bậc → thêm màu → gợi ý
   * hợp âm lướt. Thứ tự này quan trọng, xem ghi chú trong reharmPipeline.ts.
   */
  const style = getStyle(styleId) ?? BALLAD

  /*
    Kiểu dùng cho CÂU SOLO — dạo đầu, giang tấu, kết bài.

    Một họ điệu chứa nhiều kiểu đệm, và người chơi thật hay để phần hát một kiểu
    còn câu solo một kiểu khác. Người dùng chưa chọn thì `kieuChoSolo` lấy kiểu
    ưu tiên của họ; với Bolero đó là bản rải của Linh Nhi.

    Luật cũ còn nguyên: `kieuChoSolo` chỉ trả về kiểu TRONG CÙNG HỌ, nên app
    không bao giờ tự bước sang họ khác sau lưng người dùng. Xem `hoDieu.ts`.
  */
  const styleSolo = getStyle(kieuChoSolo(style.id)) ?? style

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
  const rawSectionRanges = useMemo(() => {
    if (!pastedSong) return []

    return sectionChordRanges(
      resectionSheet(buildSongSheet(pastedSong, sequence.chords), sectionMarks),
    )
  }, [pastedSong, sequence.chords, sectionMarks])

  const sectionEnds = useMemo(
    () =>
      rawSectionRanges.length === 0
        ? undefined
        : new Set(rawSectionRanges.slice(0, -1).map((range) => range.to)),
    [rawSectionRanges],
  )

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
      ...importedBeats,
      ...pairedChordBeats(pairedChords, sequence.chords.length, chordBeats),
    }

    return table
  }, [importedBeats, pairedChords, sequence.chords.length, chordBeats])

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
      varyOnRepeat,
      sectionRanges: rawSectionRanges,
      beatsPerMeasure: style.beatsPerMeasure,
      key: parsedKey,
      skipHeldAt: mutedHeld,
    })

    /*
      Gợi ý của bộ não nối vào **cuối** danh sách của anh Khá, không chen vào
      giữa và không thay cái nào. Nó cũng đi qua đúng bộ lọc `acceptedPassing`
      như mọi gợi ý khác, nên mặc định không có gì vào bài.
    */
    const fromBrain = brainPassingSuggestions({
      chords: sequence.chords,
      key: parsedKey ?? firstPass.key,
    })

    const chosen = [...firstPass.passingSuggestions, ...fromBrain]
      .filter((suggestion) =>
        acceptedPassing.includes(
          keyOf(suggestion.insertBeforeIndex, suggestion.technique),
        ),
      )
      .map((suggestion) => {
        const keep =
          passingKeep[keyOf(suggestion.insertBeforeIndex, suggestion.technique)]
        return keep === undefined
          ? suggestion
          : { ...suggestion, hostKeepBeats: keep }
      })

    const result = reharmonize(sequence.chords, {
      intensity,
      susDominant,
      tonicColor,
      majorColor,
      minorColor,
      dominantColor,
      useSlashChords,
      varyOnRepeat,
      sectionRanges: rawSectionRanges,
      beatsPerMeasure: style.beatsPerMeasure,
      key: parsedKey,
      acceptedPassing: chosen,
      beatsPerChord: chordBeats,
      chordBeats: halvedBeats,
      skipHeldAt: mutedHeld,
    })

    return {
      ...result,
      passingSuggestions: [...result.passingSuggestions, ...fromBrain],
    }
  }, [
    sequence.chords,
    intensity,
    susDominant,
    tonicColor,
    majorColor,
    minorColor,
    dominantColor,
    useSlashChords,
    varyOnRepeat,
    rawSectionRanges,
    style.beatsPerMeasure,
    manualKey,
    acceptedPassing,
    passingKeep,
    chordBeats,
    halvedBeats,
    mutedHeld,
  ])

  const recolored = useMemo(
    () =>
      reharm.colored.map((chord, index) => {
        const painted = colorEdits[index]
          ? withQuality(chord, colorEdits[index])
          : chord
        if (slashEdits[index] === true) return toSlashChord(painted) ?? painted
        return painted
      }),
    [reharm.colored, colorEdits, slashEdits],
  )
  const passingSuggestions = reharm.passingSuggestions

  /** Tính chất giọng hiện tại (để lọc ô Giọng chỉ hiện trưởng hoặc thứ). */
  const currentKeyScale: 'major' | 'minor' | null = manualKey
    ? (manualKey.split(':')[1] as 'major' | 'minor')
    : (reharm.key?.scale ?? reharm.keyCandidates[0]?.scale ?? null)

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

  const afterSlotOf = (index: number) => {
    const count = sequence.chords.length
    return count === 0 ? index : index === count - 1 ? count : index + 1
  }

  const isDim7After = (technique: string) =>
    technique === 'dim7-chain-fill' || technique === 'dim7-passing'

  const passingOptionsForChord = (
    chordIndex: number,
    otherSlot: number,
  ) => {
    const tail = afterSlotOf(chordIndex)
    const dim7 = groupsAtSlot(passingGroups, tail).filter((group) =>
      isDim7After(group.technique),
    )
    const other = groupsAtSlot(passingGroups, otherSlot).filter(
      (group) => !isDim7After(group.technique),
    )
    return [
      ...other.map((group) => ({
        id: group.id,
        slotId: keyOf(otherSlot, group.technique),
        technique: TECHNIQUE_LABELS[group.technique],
        // Nhóm không có `authorizedBy` là luật của chính KeyTrain, không qua kho.
        teacher: teacherBadge(group.authorizedBy),
        chords: group.chords.map((chord) => chord.symbol).join(' → '),
        places: group.slots.length,
        applied: isGroupOn(group),
        appliedHere: acceptedPassing.includes(
          keyOf(otherSlot, group.technique),
        ),
        after: false,
      })),
      ...dim7.map((group) => ({
        id: group.id,
        slotId: keyOf(tail, group.technique),
        technique: TECHNIQUE_LABELS[group.technique],
        // Nhóm không có `authorizedBy` là luật của chính KeyTrain, không qua kho.
        teacher: teacherBadge(group.authorizedBy),
        chords: group.chords.map((chord) => chord.symbol).join(' → '),
        places: group.slots.length,
        applied: isGroupOn(group),
        appliedHere: acceptedPassing.includes(keyOf(tail, group.technique)),
        after: true,
      })),
    ]
  }

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
  const withPassing = useMemo(() => {
    let main = -1
    const painted = reharm.final.map((chord) => {
      if (chord.passing) return chord
      main += 1
      const next = colorEdits[main]
        ? withQuality(chord, colorEdits[main])
        : chord
      if (slashEdits[main] === true) return toSlashChord(next) ?? next
      if (slashEdits[main] === false) {
        const base = reharm.colored[main]
        if (!base) return next
        return colorEdits[main] ? withQuality(base, colorEdits[main]) : base
      }
      return next
    })
    if (Object.keys(fillRests).length === 0) return painted
    main = -1
    return painted.map((chord) => {
      if (chord.passing) return chord
      main += 1
      const rest = fillRests[main] ?? 0
      if (rest <= 0) return chord
      return { ...chord, beats: beatsOf(chord, chordBeats) + rest }
    })
  }, [reharm.final, reharm.colored, colorEdits, slashEdits, fillRests, chordBeats])

  /*
    Hợp âm nào trong bài mà kho chưa có gam.

    Bật công tắc gam jazz rồi nghe không khác gì thì người dùng tưởng app hỏng,
    chứ không đoán được là kho thiếu. Đếm ra rồi in thẳng dưới ô tick.
  */
  const missingScales = useMemo(
    () => (storeScales ? scaleGaps(withPassing, reharm.key) : []),
    [storeScales, withPassing, reharm.key],
  )

  /*
    Hỏi não kèm **giọng của bài**.

    Não cần giọng để chọn bậc thể cho hợp âm ba nốt mở rộng: trong giọng Đô thì
    `Am(add9)` chạy La thứ tự nhiên còn `Dm(add9)` chạy Rê Dorian. Cùng một chất
    hợp âm, hai nốt gốc, hai gam khác nhau — cái quyết định là bậc của hợp âm
    trong giọng, thứ chỉ bên này biết. Không nói thì não đành im, vì im còn hơn
    kêu lạc giọng.
  */
  const storeScaleInKey = useCallback(
    (chord: ParsedChord) => scaleForChord(chord, reharm.key),
    [reharm.key],
  )

  /**
   * Từ phách delay trở đi không quạt điệu — chạy ngón thay thế, không chờ hết ô.
   */
  const muteWindows = useMemo(() => {
    const spans = mainChordSpans(withPassing, chordBeats)
    const windows: { from: number; to: number }[] = []
    for (const [main, run] of transitions) {
      if (run.octaves <= 0) continue
      const span = spans[main]
      if (!span) continue
      const from = span.start + (run.delayBeats ?? 0)
      const to = span.start + span.beats
      if (from < to) windows.push({ from, to })
    }
    for (const [key, rest] of Object.entries(fillRests)) {
      if (rest <= 0) continue
      const main = Number(key)
      if (transitions.has(main)) continue
      const span = spans[main]
      if (!span) continue
      const from = span.start + span.beats - rest
      if (from < span.start + span.beats) {
        windows.push({ from, to: span.start + span.beats })
      }
    }
    return windows
  }, [transitions, withPassing, chordBeats, fillRests])

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

  /**
   * Vòng hợp âm **chính**, đã gỡ hết hợp âm lướt.
   *
   * Mỗi hợp âm lấy lại trọn khoảng thời gian của mình, kể cả phần đã nhường
   * cho hợp âm lướt, nên tổng độ dài vòng không đổi.
   */
  const reharmPerBeat = useMemo(
    () => expandToBeats(withPassing, chordBeats),
    [withPassing, chordBeats],
  )

  /** Bản nhạc: lời bài hát với hợp âm đã tái hoà âm ghi trên đầu. */
  /** Vòng hợp âm chính của bài — bỏ hợp âm lướt, chúng mượn phách chứ không có ô riêng. */
  const mainSongChords = useMemo(
    () => recolored.filter((chord) => !chord.passing),
    [recolored],
  )

  /**
   * Gam đề xuất, chấm điểm theo **chính vòng hợp âm của bài**.
   *
   * Không phải một danh sách gam chung chung: mỗi mục kèm tỉ lệ nốt hợp âm của
   * vòng mà gam ấy phủ được, nên người đệm thấy ngay gam nào ít va vào hoà âm.
   */
  const scaleChoices = useMemo(
    () => suggestScales(mainSongChords, reharm.key),
    [mainSongChords, reharm.key],
  )

  /**
   * Gam mặc định của điệu đang chọn.
   *
   * Họ slow rock lấy **gam Blues**. Thầy Đức Thịnh nói mẫu đệm slow rock của
   * thầy "thực ra là điệu Blues nhưng không đánh nốt Blues", và nốt còn thiếu
   * là bậc năm giáng — item `duc-thinh-not-blues-la-bac-5-giang` bên PianoBrain.
   * Tiết tấu đã là Blues sẵn; đoạn không lời là chỗ bè giai điệu rảnh nhất để
   * nốt blue ấy vào. Người dùng chọn gam khác thì lựa chọn của người dùng thắng.
   */
  const autoPhraseScale = useMemo(() => {
    if (prefersBlues(style)) return bluesChoice(reharm.key)
    /*
      Bốn họ slow rock / bolero / bossa / ballad mặc định ngẫu hứng trên **một
      gam**, lấy gam khớp nhất với vòng của bài.

      Trước đây chúng rơi về nguồn nốt `chordTone`, tức nốt hợp âm ở mọi chỗ. Đo
      trên bốn bản ký âm của Cà Pháo thì lối ấy lệch hẳn: người thật đặt nốt hợp
      âm khoảng 52-67% số lần ở phách mạnh, còn app đặt 100% — và app rải hợp âm
      thuần 35-60% số câu trong khi người thật chỉ 5%. Xem `phraseScale.ts`.
    */
    if (!prefersSingleScale(style)) return null
    return scaleChoices[0] ?? null
  }, [style, reharm.key, scaleChoices])

  /** Gam thật sự đưa cho bộ sinh câu. `null` là lối nhiều gam. */
  const phraseScale = useMemo(() => {
    // `'multi'` là lối nhiều gam do người dùng chọn tay, khác với `null` là để tự.
    if (phraseScaleId === MULTI_SCALE) return null
    if (phraseScaleId === null) return autoPhraseScale
    return (
      scaleChoices.find((choice) => choice.id === phraseScaleId) ??
      bluesChoice(reharm.key)
    )
  }, [phraseScaleId, autoPhraseScale, scaleChoices, reharm.key])

  /*
    Đoạn không lời có nguồn nốt RIÊNG, không dùng chung với câu solo thân bài.

    Thân bài chạy dưới giọng hát, nên nó phải nhường: nốt hợp âm là đủ. Đoạn
    không lời thì nhạc cụ là giai điệu chính, và đó mới là chỗ một gam xuyên
    suốt nghe ra câu nhạc.
  */
  const phraseNoteSource: SoloNoteSource = phraseScale
    ? 'keyPentatonic'
    : soloNoteSource

  /*
    Mạch của điệu, cho câu solo đoạn không lời neo vào.

    Ba họ slow rock / bolero / bossa nova có tiết tấu **là** danh tính của điệu:
    nghe hai phách là nhận ra. Trước đây câu solo ba đoạn không lời chạy móc đơn
    đều xuyên qua chúng — tay phải đi một đằng, tay trái gõ một nẻo, nên không
    ra một câu solo có bass và giai điệu mà ra hai người chơi hai bài.

    Lấy chỗ gõ từ chính `cell` của điệu, không dựng bảng riêng: điệu chép từ
    video về sau là tự có mạch, không phải nhớ cập nhật thêm chỗ nào.
  */
  const phrasePulse = useMemo(() => pulseForStyle(styleId), [styleId])
  const phrasePulseBar = style.beatsPerMeasure * (style.gridUnit ?? 1)

  /**
   * Câu solo đoạn không lời dựng bằng **cọc và nối**, nếu bật và có gam.
   *
   * Trả `null` khi chưa đủ điều kiện, để bên gọi lui về sổ mẫu như cũ. Bộ này
   * cần MỘT gam để làm ao nốt; lối "mỗi hợp âm một gam" thì không có ao chung
   * nào, và đó là lúc sổ mẫu vẫn là đường duy nhất.
   */
  const builtLine = useCallback(
    (list: readonly ParsedChord[], spin: number) => {
      if (!lineSolo || !phraseScale) return null
      const anchors = accentBeats(styleSolo)
      if (anchors.length === 0) return null
      const line = buildLine({
        chords: list,
        beatsPerChord: chordBeats,
        barBeats: phrasePulseBar,
        anchors,
        scale: phraseScale.pitchClasses,
        range: ballad ? BALLAD_SOLO_RANGE : SOLO_RANGE,
        take: spin + phraseSpin + playSpin.current,
      })
      return line.length > 0 ? lineToTimeline(line) : null
    },
    [lineSolo, phraseScale, styleSolo, chordBeats, phrasePulseBar, ballad, phraseSpin],
  )


  /*
    Ký hiệu hợp âm đoạn dạo, tính **một lần** rồi dùng cho cả bản lời lẫn lưới.

    Trước đây bản lời và lưới hợp âm mỗi bên tự gọi `phraseChords` một lượt. Hai
    chỗ gọi thì có ngày lệch nhau — và đã lệch thật: bản lời đổi sang hợp âm mượn
    của bài còn lưới vẫn kêu vòng dựng theo bậc, cùng một đoạn dạo mà hai chỗ ghi
    hai vòng khác nhau.
  */
  const phraseOpening = useMemo(
    () => recolored.find((chord) => !chord.passing) ?? null,
    [recolored],
  )

  const introSymbols = useMemo(() => {
    const cue = cueChord(phraseOpening)
    return [
      ...phraseChords('intro', reharm.key, {
        songChords: mainSongChords,
        plain: plainPhrase,
      }).map((chord) => chord.symbol),
      ...(cue ? [`${cue.symbol} (báo)`] : []),
    ]
  }, [reharm.key, mainSongChords, plainPhrase, phraseOpening])

  const outroSymbols = useMemo(
    () =>
      phraseChords('outro', reharm.key, {
        songChords: mainSongChords,
        plain: plainPhrase,
      }).map((chord) => chord.symbol),
    [reharm.key, mainSongChords, plainPhrase],
  )

  const sheet = useMemo(() => {
    if (!pastedSong) return null
    const base = resectionSheet(
      buildSongSheet(pastedSong, recolored, withPassing),
      sectionMarks,
    )
    const playOrder = arrangement ?? []
    const intro = playOrder.some((step) => step.type === 'intro') ? introSymbols : []
    const outro = playOrder.some((step) => step.type === 'outro') ? outroSymbols : []
    return attachPhraseToSheet(base, intro, outro)
  }, [pastedSong, recolored, withPassing, sectionMarks, arrangement, reharm.key])

  /** Dòng thời gian phần đệm theo điệu đang chọn. */

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
  const accompaniment = useMemo(() => {
    const beatsEach = chordDurations(withPassing, chordBeats)

    /*
      Vào điệp khúc thì đổi sang bản điệp khúc của chính điệu đang chọn.

      Người dùng chỉ bấm một điệu trên bảng chọn; chuyện phiên khúc chơi khác
      điệp khúc là việc của phần đệm, không bắt họ canh giữa bài mà bấm tay.
      Điệu không có bản điệp khúc thì `resolveStyleForSection` trả về chính nó,
      `cellAt` luôn ra cùng một ô nhịp, và cả bài chạy như trước.

      `cellBreaks` là mốc vào đoạn: không có nó thì ô nhịp đang chạy tràn qua
      vạch, và bản điệp khúc phải chờ hết ô mới vào — với ô nhịp bốn ô thì trễ
      tới bốn nhịp.
    */
    const kindAt = (beat: number): SectionKind => {
      const found = songSources?.find(
        (source) =>
          beat >= source.startBeat - 0.001 &&
          beat < source.startBeat + source.lengthBeats - 0.001,
      )
      return found?.kind ?? 'verse'
    }

    /** Hợp âm đang vang ở một mốc phách. */
    const chordAt = (beat: number) => {
      let at = 0
      for (let index = 0; index < withPassing.length; index += 1) {
        at += beatsEach[index] ?? chordBeats
        if (beat < at - 0.001) return withPassing[index]
      }
      return withPassing[withPassing.length - 1]
    }

    /*
      HAI PHÉP ĐỔI ĐIỆU, chạy nối tiếp nhau, và chúng khác bản chất:

      1. THEO ĐOẠN — quyết định phối khí của người dùng. Vào điệp khúc thì đổi
         sang bản điệp khúc của chính điệu đang chọn. Người dùng chỉ bấm một
         điệu; chuyện phiên khúc chơi khác điệp khúc là việc của phần đệm.

      2. THEO HOÀ ÂM — thói quen ĐO ĐƯỢC của người soạn. Trên bản ký âm Linh
         Nhi, vòm tay trái mở rộng đúng trên chủ âm: 12 trên 19 ô vòm cao rơi
         vào hợp âm Rê, còn vòm thấp dồn vào Fa thăng thứ và Si thứ.

      Thứ tự này có chủ ý: phép đổi theo đoạn chạy TRƯỚC, và nếu nó đã chọn bản
      cao trào rồi thì phép theo hoà âm không đụng vào nữa (điệu cao trào không
      có tên trong bảng chủ âm). Ý người dùng thắng thói quen của người soạn —
      họ đang phối bài của họ, không phải chép lại bài của người khác.
    */
    const cellFor = (beat: number) => {
      const theoDoan = resolveStyleForSection(style.id, kindAt(beat))
      const goc = reharm.key?.tonic
      const chord = chordAt(beat)
      const chon =
        goc !== undefined && goc !== null && chord
          ? resolveStyleForChord(theoDoan, chord.root, goc)
          : theoDoan
      return getStyle(chon)?.cell ?? style.cell
    }

    const swaps =
      (hasChorusVariant(style.id) || hasTonicVariant(style.id)) && songSources !== null

    /*
      Hợp âm chia đôi: mở ô nhịp mới ngay giữa ô.

      Không làm vậy thì hợp âm thứ hai rơi vào mốc "nhẹ ở giữa ô" của hợp âm
      thứ nhất — nốt gốc của nó không được nhấn lần nào, nghe như đánh nhờ nhịp
      của hợp âm trước. Cắt ở đây thì mỗi nửa có phách mạnh của chính nó.
    */
    const chordStarts: number[] = []
    let running = 0
    for (const beats of beatsEach) {
      chordStarts.push(running)
      running += beats
    }
    const splitStarts = isSplitAwareStyle(style.id)
      ? chordStarts.filter((_, index) => beatsEach[index] < chordBeats)
      : []

    const breaks = [
      ...(swaps ? songSources!.map((source) => source.startBeat) : []),
      ...splitStarts,
    ]

    const played = renderPattern(twoHands, style, {
      beatsPerChord: chordBeats,
      beatsEach,
      muteWindows,
      ...(swaps ? { cellAt: (beat: number) => cellFor(beat) ?? style.cell! } : {}),
      ...(breaks.length > 0 ? { cellBreaks: breaks } : {}),
    })

    if (!walkingOn) return played

    /*
      Walking bass thay **tuyến trầm** của ô nhịp, không thay cả phần đệm: tay
      phải vẫn quạt đúng điệu đang chọn. Tắt công tắc là quay về y như cũ, kể cả
      Pop 1 — nhánh trên trả về trước khi đụng tới gì.
    */
    const walk = walkingBassLine({
      chords: withPassing,
      beatsPerChord: chordBeats,
      beatsEach,
    })
    if (!walk) return played

    return [...played.filter((event) => event.hand !== 'left'), ...walk.events]
  }, [twoHands, style, chordBeats, withPassing, muteWindows, walkingOn, songSources])

  /**
   * Vòng ngắn: bốn hợp âm cuối Điệp khúc; cặp chia đôi chỉ lấy hợp âm đầu.
   */
  const interludeWindow = useCallback(
    (over: SourceSection, _next: SourceSection | null) => {
      const spans = mainChordSpans(withPassing, chordBeats)
      const verse =
        songSources?.find((source) => /điệp\s*khúc/i.test(source.name)) ??
        over
      const end = verse.startBeat + verse.lengthBeats

      /*
        Giang tấu lấy **vòng hợp âm gốc**, không lấy bản đã tô màu.

        Vòng đang vang là `withPassing` — đã qua tái hòa âm của anh Khá nên đầy
        add9, 9, dim7. Màu ấy đúng chỗ khi có người hát: giọng hát là đường
        giai điệu, hợp âm dày lên thì nghe đầy. Nhưng giang tấu không có ai hát;
        cây đàn tự chạy câu, và nốt màu chồng lên nền solo làm câu chạy nghe
        lạc.

        Nên chỗ này lần ngược về `sequence.chords` theo số thứ tự hợp âm chính,
        rồi rút nốt về tính chất cơ bản. Xem `style/interludeChords.ts` và item
        `rule-interlude-plain-harmony` trong kho.
      */
      const chorus: { span: (typeof spans)[number]; main: number }[] = []
      let main = -1
      for (const chord of withPassing) {
        if (chord.passing) continue
        main += 1
        const span = spans[main]
        if (!span) continue
        if (span.start < verse.startBeat - 0.001 || span.start >= end - 0.001) {
          continue
        }
        if (pairedChords.has(main - 1)) continue
        chorus.push({ span, main })
      }

      /*
        Hợp âm gốc của một ô, rút về màu cơ bản **nếu người dùng còn bật**.

        Trước đây bước rút gọn là bắt buộc. Nó đúng cho phần lớn bài, nhưng có
        bài người ta cố ý muốn giang tấu giữ nguyên bảng màu — nên nó thành một
        ô tick, chung với đoạn dạo, để ba đoạn không lời cùng theo một luật.
      */
      const plainAt = (mainIndex: number, fallback: ParsedChord): ParsedChord => {
        const raw = sequence.chords[mainIndex] ?? fallback
        return plainPhrase ? plainForInterlude(raw) : raw
      }
      if (chorus.length === 0) return null

      /*
        Hỏi não trước, heuristic cũ đỡ sau.

        Não chỉ trả lời khi bốn hợp âm ấy nằm trong một vòng hòa âm thầy Hải đã
        chỉ đích danh là dùng được cho đoạn dạo. Không có căn cứ thì nó im, và
        `chooseChorusLoop` chọn như trước — không mất gì.
      */
      const nextFirst = _next
        ? spans.find((span) => Math.abs(span.start - _next.startBeat) < 0.001)
        : undefined
      const loopChords = chorus.map((entry) => plainAt(entry.main, entry.span.chord))
      const fromBrain = brainInterludeWindow({
        chords: loopChords,
        key: reharm.key,
        nextChord: nextFirst?.chord,
        size: interludeChords,
      })
      const window = fromBrain ?? chooseChorusLoop(loopChords, interludeChords)
      const picked = (
        window
          ? chorus.slice(window.from, window.to + 1)
          : chorus.slice(0, interludeChords)
      ).map((entry) => ({ ...entry.span, chord: plainAt(entry.main, entry.span.chord) }))
      const first = picked[0]
      const last = picked[picked.length - 1]
      if (!first || !last) return null

      // Đã rút về màu cơ bản ở trên; **không** tô thêm màu cho giang tấu.
      const windowChords = picked.map((span) => span.chord)
      const runBeats = Math.max(0.5, last.beats - 1)
      const lastLoopChords = windowChords.map((chord, index) =>
        index === windowChords.length - 1
          ? { ...chord, beats: runBeats }
          : chord,
      )
      const pull = nextFirst
        ? pullChordFor(nextFirst.chord, { avoid: last.chord, strong: true })
        : null
      const pullHit = pull
        ? renderPattern(
            voiceLeadTwoHands([pull], { dropRootFromRightHand: dropRoot }),
            style,
            { beatsPerChord: 1, beatsEach: [1] },
          )
        : []

      const head = picked.slice(0, -1)
      const headChords = windowChords.slice(0, -1)

      /*
        Đoạn giang tấu dài bao nhiêu Ô NHỊP — con số quyết định câu solo dày hay
        thưa. Xem `interludeDensity`.

        KHÔNG nhân với số lượt lặp: chạy lại đúng bốn ô ấy lần thứ hai vẫn là
        cùng một cầu nối nghe hai lần, không thành một bản độc tấu.
      */
      const interludeBars =
        (last.start + last.beats - first.start) / Math.max(1, phrasePulseBar)

      return {
        startBeat: first.start,
        lengthBeats: last.start + last.beats - first.start,
        chords: picked,
        /*
          Giang tấu chơi **đúng điệu đang chọn**, cả hai tay, không thay gì.

          Bản trước thay tay trái bằng một câu rải ballad (hình gốc-5-8-5 của
          *Hồng Kông 1*) cho mọi điệu thuộc họ ballad — mà họ ấy có cả
          `slow-rock-2` và `hai-slow-rock`. Kết quả: chọn slow rock, tới giang
          tấu thì tay trái chuyển sang rải ballad, nghe ra một điệu khác. Người
          dùng bác thẳng: đoạn dạo đầu, kết bài và giang tấu bắt buộc chơi theo
          điệu đã chọn, áp dụng cho mọi điệu.

          Nhưng CHIA VIỆC giữa hai tay thì đổi: tay phải bỏ hẳn phần quạt để
          lên chạy giai điệu, và tay trái gánh trọn mẫu đệm thay nó — trải hai
          quãng tám thay vì quanh quẩn một quãng năm. Nhịp vẫn lấy từ chính ô
          nhịp của điệu đang chọn, nên luật ở trên còn nguyên; thứ đổi là AI
          chơi phần nào, không phải chơi điệu gì. Xem `style/soloLeftHand.ts`.
        */
        events: soloLeftHand({
          chords: windowChords,
          beatsEach: picked.map((span) => span.beats),
          style: styleSolo,
        }),
        lastEvents: soloLeftHand({
          chords: headChords,
          beatsEach: head.map((span) => span.beats),
          style: styleSolo,
        }),
        exit: pullHit,
        solo: (take: number, lastLoop?: boolean) =>
          builtLine(lastLoop ? lastLoopChords : windowChords, take) ??
          soloToTimeline(
            generateSolo(lastLoop ? lastLoopChords : windowChords, {
              beatsPerChord: chordBeats,
              direction: soloDirection,
              /*
                Độ dài đoạn chọn mật độ — xem `interludeDensity`. LƯU Ý: ở nhánh
                giang tấu, `density` hiện chưa có tác dụng (đo ra `sparse` và
                `medium` cho từng nốt trùng khít). Vẫn truyền vào để ngày lever
                ấy được sửa thì luật có hiệu lực ngay, không phải nhớ nối lại.
              */
              density: interludeDensity(interludeBars),
              graceDensity,
              key: reharm.key,
              noteSource: phraseNoteSource,
              ...(phraseScale ? { singleScale: phraseScale.pitchClasses } : {}),
              ...(phrasePulse.length > 0
                ? { pulse: phrasePulse, pulseBar: phrasePulseBar }
                : {}),
              chordsPerPhrase,
              take: take + phraseSpin + playSpin.current,
              endWithRun: lastLoop === true,
              // Đoạn giang tấu: nốt theo bậc ưu tiên riêng, không lấy màu Khá.
              interlude: true,
              // Chỉ có tác dụng khi người dùng chọn nguồn nốt "gam jazz của kho".
              storeScale: storeScaleInKey,
              // Câu chạy chia nhịp theo điệu: swing cho jazz, đảo phách cho bossa.
              feel: soloFeelFor(styleId),
              // Điệu ballad thì hạ trần câu solo cho khớp tay người đệm.
              ...(ballad ? { range: BALLAD_SOLO_RANGE } : {}),
            }),
          ),
      }
    },
    [
      withPassing,
      chordBeats,
      pairedChords,
      songSources,
      dropRoot,
      style,
      styleSolo,
      soloDirection,
      graceDensity,
      reharm.key,
      plainPhrase,
      interludeChords,
      lineSolo,
      builtLine,
      phraseNoteSource,
      phraseScale,
      phrasePulse,
      phrasePulseBar,
      soloNoteSource,
      chordsPerPhrase,
      phraseSpin,
    ],
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
   * Chỗ giọng hát đang vang — đàn không lót vào.
   *
   * Chưa dán lời thì bỏ trống, và bộ chêm fill giữ nguyên cách cũ: chỉ lót ở
   * cuối câu theo mật độ, chứ không tự cho mình quyền chêm khắp nơi.
   */
  const singing = useMemo(
    () => (sheet ? singingChords(sheet) : undefined),
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
          always: new Set([...transitionAt, ...extraFills, ...extraRuns]),
        }).map((position) => position.mainIndex),
      ),
    [withPassing, fillDensity, breaths, transitionAt, extraFills, extraRuns, chordBeats],
  )

  /**
   * Chỗ này đang có fill không.
   *
   * Rỗng nghĩa là **không chêm được** — mật độ không rơi vào, hoặc ô nhịp đã bị
   * chia đôi cho hợp âm lướt. Lúc đó giao diện không bày mục bật tắt ra, vì bày
   * một nút không làm gì chỉ gây hiểu nhầm.
   */
  const fullMeasureAt = useCallback(
    (chordIndex: number) => {
      let main = -1
      for (const chord of withPassing) {
        if (chord.passing) continue
        main += 1
        if (main === chordIndex) {
          return beatsOf(chord, chordBeats) >= chordBeats
        }
      }
      return false
    },
    [withPassing, chordBeats],
  )

  const fillAt = useCallback(
    (chordIndex: number) => {
      if (transitions.has(chordIndex)) return null
      if (extraFills.has(chordIndex)) return true
      if (extraRuns.has(chordIndex)) {
        return fullMeasureAt(chordIndex) ? false : null
      }
      if (fillEligible.has(chordIndex)) return !mutedFills.has(chordIndex)
      if (fullMeasureAt(chordIndex)) return false
      return null
    },
    [transitions, extraFills, extraRuns, fillEligible, mutedFills, fullMeasureAt],
  )

  const runAt = useCallback(
    (chordIndex: number) => {
      if (transitions.has(chordIndex)) return null
      if (extraRuns.has(chordIndex)) return true
      if (fullMeasureAt(chordIndex)) return false
      return null
    },
    [extraRuns, fullMeasureAt, transitions],
  )

  const toggleFill = useCallback((chordIndex: number) => {
    if (transitions.has(chordIndex)) return
    setPhraseSpin((spin) => spin + 1)
    const on =
      extraFills.has(chordIndex) ||
      (fillEligible.has(chordIndex) && !mutedFills.has(chordIndex))
    setExtraRuns((current) => {
      if (!current.has(chordIndex)) return current
      const next = new Set(current)
      next.delete(chordIndex)
      return next
    })
    setExtraFills((current) => {
      const next = new Set(current)
      if (on) next.delete(chordIndex)
      else next.add(chordIndex)
      return next
    })
    setMutedFills((current) => {
      const next = new Set(current)
      if (on) next.add(chordIndex)
      else next.delete(chordIndex)
      return next
    })
    if (on) {
      setFillRests((current) => {
        if (!(chordIndex in current)) return current
        const next = { ...current }
        delete next[chordIndex]
        return next
      })
    }
  }, [transitions, extraFills, fillEligible, mutedFills])

  const cycleColor = useCallback(
    (chordIndex: number) => {
      const painted = reharm.colored[chordIndex]
      if (!painted) return
      const currentId = colorEdits[chordIndex] ?? painted.quality.id
      const next = nextColorId(painted, reharm.key, currentId)
      setColorEdits((current) => {
        if (next === painted.quality.id) {
          if (!(chordIndex in current)) return current
          const copy = { ...current }
          delete copy[chordIndex]
          return copy
        }
        return { ...current, [chordIndex]: next }
      })
    },
    [reharm.colored, reharm.key, colorEdits],
  )

  const colorHintAt = useCallback(
    (chordIndex: number) => {
      const painted = reharm.colored[chordIndex]
      if (!painted) return null
      if (compatibleColorIds(painted, reharm.key).length < 2) return null
      const currentId = colorEdits[chordIndex] ?? painted.quality.id
      return withQuality(
        painted,
        nextColorId(painted, reharm.key, currentId),
      ).symbol
    },
    [reharm.colored, reharm.key, colorEdits],
  )

  const slashHintAt = useCallback(
    (chordIndex: number) => {
      const painted = reharm.colored[chordIndex]
      if (!painted) return null
      const base = colorEdits[chordIndex]
        ? withQuality(painted, colorEdits[chordIndex])
        : painted
      const slashed = toSlashChord(base)
      const showing =
        slashEdits[chordIndex] === true ||
        (slashEdits[chordIndex] !== false && base.bass !== undefined)
      if (showing) return base.symbol
      return slashed?.symbol ?? null
    },
    [reharm.colored, colorEdits, slashEdits],
  )

  const toggleHeldMute = useCallback((chordIndex: number) => {
    setMutedHeld((current) => {
      const next = new Set(current)
      if (next.has(chordIndex)) next.delete(chordIndex)
      else next.add(chordIndex)
      return next
    })
  }, [])

  const toggleSlash = useCallback((chordIndex: number) => {
    setSlashEdits((current) => {
      const painted = reharm.colored[chordIndex]
      if (!painted) return current
      const base = colorEdits[chordIndex]
        ? withQuality(painted, colorEdits[chordIndex])
        : painted
      const slashed = toSlashChord(base)
      const showing =
        current[chordIndex] === true ||
        (current[chordIndex] !== false && base.bass !== undefined)
      if (showing) return { ...current, [chordIndex]: false }
      if (!slashed) return current
      return { ...current, [chordIndex]: true }
    })
  }, [reharm.colored, colorEdits])

  const markTransition = useCallback((chordIndex: number) => {
    const on = transitions.has(chordIndex)
    setTransitionEdits((current) => ({
      ...current,
      [chordIndex]: on ? null : DEFAULT_TRANSITION,
    }))
    if (on) return
    setExtraFills((current) => {
      if (!current.has(chordIndex)) return current
      const next = new Set(current)
      next.delete(chordIndex)
      return next
    })
    setExtraRuns((current) => {
      if (!current.has(chordIndex)) return current
      const next = new Set(current)
      next.delete(chordIndex)
      return next
    })
    setFillRests((current) => {
      if (!(chordIndex in current)) return current
      const next = { ...current }
      delete next[chordIndex]
      return next
    })
  }, [transitions])

  const toggleRun = useCallback((chordIndex: number) => {
    if (transitions.has(chordIndex)) return
    setPhraseSpin((spin) => spin + 1)
    setExtraFills((current) => {
      if (!current.has(chordIndex)) return current
      const next = new Set(current)
      next.delete(chordIndex)
      return next
    })
    setExtraRuns((current) => {
      const next = new Set(current)
      if (next.has(chordIndex)) next.delete(chordIndex)
      else next.add(chordIndex)
      return next
    })
    if (extraRuns.has(chordIndex)) {
      setFillRests((current) => {
        if (!(chordIndex in current)) return current
        const next = { ...current }
        delete next[chordIndex]
        return next
      })
    }
  }, [transitions, extraRuns])

  const fillRestAt = useCallback(
    (chordIndex: number) => fillRests[chordIndex] ?? 0,
    [fillRests],
  )

  const setFillRest = useCallback((chordIndex: number, beats: number) => {
    setFillRests((current) => {
      if (beats <= 0) {
        if (!(chordIndex in current)) return current
        const next = { ...current }
        delete next[chordIndex]
        return next
      }
      if (current[chordIndex] === beats) return current
      return { ...current, [chordIndex]: beats }
    })
  }, [])

  /** Câu fill dùng cho đoạn có lời — ngắn, chỉ chêm ở khe hở. */
  const fills = useCallback(
    (take: number) =>
      soloToTimeline(
        generateFillLine(withPassing, {
          breaths,
          sectionEnds: transitions,
          beatsPerChord: chordBeats,
          // Điệu nào khai chỗ đứng của câu lót thì theo nó; không khai thì để
          // `generateFillLine` tự chọn như cũ.
          ...(style.fillBeats !== undefined ? { fillBeats: style.fillBeats } : {}),
          ...(style.fillMaxNotes !== undefined ? { fillMaxNotes: style.fillMaxNotes } : {}),
          /*
            Nhịp mẫu số 8 — slow rock và họ hàng — thì câu lót thuộc về bè trầm.
            Suy từ nhịp chứ không bắt điệu tự khai, vì đây là luật của cả họ nhịp
            kép, không phải sở thích của một điệu. Điệu nào muốn khác thì khai
            `fillBassChance` để đè lên.
          */
          fillBassChance:
            style.fillBassChance ??
            (style.timeSignature.endsWith('/8') ? 0.8 : 0),
          direction: soloDirection,
          density: fillDensity,
          key: reharm.key,
          skipFills: mutedFills,
          extraFills: new Set(
            [...extraFills].filter((index) => !transitions.has(index)),
          ),
          extraRuns: new Set(
            [...extraRuns].filter((index) => !transitions.has(index)),
          ),
          fillRests: new Map(
            Object.entries(fillRests)
              .filter(([, beats]) => beats > 0)
              .map(([index, beats]) => [Number(index), beats]),
          ),
          lickyFills,
          lickyRuns,
          lickyMode,
          take: take + phraseSpin + playSpin.current,
          vocal: singing,
          brainFill: brainFillsOn
            ? (request) =>
                brainFill({
                  ...request,
                  key: reharm.key,
                  take: playSpin.current,
                })
            : undefined,
        }),
      ),
    [
      withPassing,
      chordBeats,
      soloDirection,
      fillDensity,
      brainFillsOn,
      singing,
      reharm.key,
      mutedFills,
      extraFills,
      extraRuns,
      fillRests,
      lickyFills,
      lickyRuns,
      lickyMode,
      phraseSpin,
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
      density: 'medium' as const,
      graceDensity,
      key: reharm.key,
      noteSource: soloNoteSource,
      chordsPerPhrase,
    }

    return (take: number) =>
      generateSolo(withPassing, {
        ...args,
        take: take + phraseSpin + playSpin.current,
        // Câu solo chỉ chơi ở đoạn không lời, nên đi theo bậc ưu tiên giang tấu.
        interlude: true,
        // Chỉ có tác dụng khi người dùng chọn nguồn nốt "gam jazz của kho".
        storeScale: storeScaleInKey,
        // Câu chạy chia nhịp theo điệu: swing cho jazz, đảo phách cho bossa.
        feel: soloFeelFor(styleId),
        ...(ballad ? { range: BALLAD_SOLO_RANGE } : {}),
      })
  }, [
    withPassing,
    chordBeats,
    soloDirection,
    graceDensity,
    soloNoteSource,
    chordsPerPhrase,
    reharm.key,
    phraseSpin,
    ballad,
    // Đổi điệu là đổi cách chia nhịp câu chạy — phải dựng lại.
    styleId,
  ])

  /**
   * Sinh câu cho **một vòng hợp âm bất kỳ** — dùng đúng cách của đoạn giang tấu.
   *
   * Đoạn dạo đầu và đoạn kết trước đây lấy nốt từ `brainPhrase`: một câu ngắn
   * do luật Kingsley soạn, hay nhưng chỉ có mấy hình cố định, và không đi qua
   * gam của kho. Người dùng nghe đoạn giang tấu rồi bảo áp dụng cùng cách sinh
   * nốt cho hai đoạn kia — nên chúng gọi chung một hàm với thân bài: cùng gam,
   * cùng mẫu câu, cùng cách chia nhịp theo điệu.
   *
   * `endWithRun` bật sẵn: cả hai đoạn đều kết bằng một câu chạy tay phải leo
   * lên phía phải đàn, đúng chỗ tai người nghe chờ một cú đẩy trước khi vào.
   */
  const phraseSolo = useCallback(
    (chords: readonly ParsedChord[], spin: number, endWithRun = true) =>
      builtLine(chords, spin) ??
      soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: chordBeats,
          direction: soloDirection,
          density: 'medium',
          graceDensity,
          key: reharm.key,
          noteSource: phraseNoteSource,
          ...(phraseScale ? { singleScale: phraseScale.pitchClasses } : {}),
          ...(phrasePulse.length > 0
            ? { pulse: phrasePulse, pulseBar: phrasePulseBar }
            : {}),
          chordsPerPhrase,
          take: spin + phraseSpin + playSpin.current,
          endWithRun,
          interlude: true,
          storeScale: storeScaleInKey,
          feel: soloFeelFor(styleId),
          ...(ballad ? { range: BALLAD_SOLO_RANGE } : {}),
        }),
      ),
    [
      chordBeats,
      soloDirection,
      graceDensity,
      reharm.key,
      phraseNoteSource,
      phraseScale,
      phrasePulse,
      phrasePulseBar,
      chordsPerPhrase,
      phraseSpin,
      ballad,
      styleId,
      builtLine,
    ],
  )

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
      transpose: effectiveTranspose,
      manualKey,
      sectionMarks,
      arrangement,
      transitionEdits,
      pairedChords: [...pairedChords],
      mutedFills: [...mutedFills],
      extraFills: [...extraFills],
      extraRuns: [...extraRuns],
      fillRests,
      colorEdits,
      slashEdits,
      lickyFills,
      lickyRuns,
      lickyMode,
      acceptedPassing,
      styleId,
      beatsPerChord,
      chordDurations:
        Object.keys(importedBeats).length > 0
          ? sequence.chords.map(
              (_, index) => importedBeats[index] ?? beatsPerChord,
            )
          : undefined,
      bpm,
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
      soloDensity: 'medium',
      fillDensity,
      graceDensity,
      noteSource,
      jazzScales: storeScales,
      phraseScaleId,
      plainPhrase,
      interludeChords,
      chordsPerPhrase,
    }),
    [
      sourceText,
      effectiveTranspose,
      manualKey,
      sectionMarks,
      arrangement,
      transitionEdits,
      pairedChords,
      mutedFills,
      extraFills,
      extraRuns,
      fillRests,
      colorEdits,
      slashEdits,
      lickyFills,
      lickyRuns,
      lickyMode,
      acceptedPassing,
      styleId,
      beatsPerChord,
      importedBeats,
      sequence.chords,
      bpm,
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
      fillDensity,
      graceDensity,
      noteSource,
      storeScales,
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
    setExtraFills(new Set(saved.extraFills ?? []))
    setExtraRuns(new Set(saved.extraRuns ?? []))
    setFillRests(saved.fillRests ?? {})
    setColorEdits(saved.colorEdits ?? {})
    setSlashEdits(saved.slashEdits ?? {})
    setLickyFills(saved.lickyFills ?? true)
    setLickyRuns(saved.lickyRuns ?? false)
    setLickyMode((saved.lickyMode as LickyMode | undefined) ?? 'clone')
    setAcceptedPassing(saved.acceptedPassing)

    setStyleId(saved.styleId)
    setBeatsPerChord(saved.beatsPerChord)
    setImportedBeats(listToBeatTable(saved.chordDurations) ?? {})
    if (saved.bpm !== undefined) {
      setBpm(saved.bpm)
      setLockSongBpm(true)
    } else {
      setLockSongBpm(false)
      const styleBpm = getStyle(saved.styleId)?.bpm
      if (styleBpm) setBpm(styleBpm)
    }
    loadSourceFile(null)
    setHasSource(false)
    setSourceOn(false)
    setSourceEnabled(false)
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

    // Bài lưu từ trước khi tách thì câu fill dùng chung mật độ với câu nhạc.
    setFillDensity((saved.fillDensity ?? saved.soloDensity) as OrnamentDensity)
    // Bài lưu từ trước khi tách ô chỉnh thì chưa có mục này.
    setGraceDensity((saved.graceDensity ?? 'none') as GraceDensity)
    setNoteSource(saved.noteSource as SoloNoteSource)
    // Bài lưu từ trước khi có công tắc này thì mặc định tắt, đúng luật draft.
    // Khoá lưu giữ tên cũ `jazzScales` để bài lưu từ trước vẫn đọc được.
    setStoreScales(saved.jazzScales !== false)
    /*
      Bài lưu từ trước không có hai khoá này. `undefined` phải rơi về ĐÚNG mặc
      định của bản mới — để tự, và có rút gọn — chứ không phải về `null` nghĩa
      khác: bài cũ mở ra vẫn nghe như bài cũ.
    */
    setPhraseScaleId(saved.phraseScaleId ?? null)
    setPlainPhrase(saved.plainPhrase !== false)
    setInterludeChords(saved.interludeChords ?? DEFAULT_INTERLUDE_CHORDS)
    setLineSolo(saved.lineSolo === true)
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
    setManualKey('')
    setPairedChords(new Set())
    setImportedBeats({})
    setLockSongBpm(false)
    const styleBpm = getStyle(styleId)?.bpm
    if (styleBpm) setBpm(styleBpm)
    setMutedFills(new Set())
    setExtraFills(new Set())
    setExtraRuns(new Set())
    setFillRests({})
    setColorEdits({})
    setPhraseSpin(0)
    setTransitionEdits({})
    setAcceptedPassing([])

    setInput(parsed.chords.map((chord) => chord.symbol).join(' '))
    setSelectedIndex(null)
  }, [styleId])

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

      /*
        Hợp âm kết cũng phải theo mẫu của đoạn nó đóng lại: kết một đoạn điệp
        khúc mà lùi về mẫu phiên khúc thì nghe như tụt lực ngay nốt cuối.
      */
      const closingStyle =
        getStyle(
          resolveStyleForSection(
            style.id,
            source.kind === 'chorus' ? 'chorus' : 'verse',
          ),
        ) ?? style

      return {
        events: renderPattern(hands, closingStyle, {
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

      const pull = pullChordFor(target.chord, { avoid: last.chord })
      if (!pull) return null

      /*
        Hợp âm kết vốn đã là bậc năm của chỗ sau thì thôi: đổi nữa cũng ra đúng
        cái đang có, mà mất công dựng lại.
      */
      if (pull.symbol === last.chord.symbol) return null

      const hands = voiceLeadTwoHands([pull], {
        dropRootFromRightHand: dropRoot,
      })

      /*
        Hợp âm kết cũng phải theo mẫu của đoạn nó đóng lại: kết một đoạn điệp
        khúc mà lùi về mẫu phiên khúc thì nghe như tụt lực ngay nốt cuối.
      */
      const closingStyle =
        getStyle(
          resolveStyleForSection(
            style.id,
            source.kind === 'chorus' ? 'chorus' : 'verse',
          ),
        ) ?? style

      return {
        events: renderPattern(hands, closingStyle, {
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
          accompaniment: yieldToFill(
            giveCompingToLeft(accompaniment, fills(pass), style.beatsPerMeasure),
            fills(pass),
          ),
          fills: (take) => fills(take + pass * 11),
          solo: (take) => soloToTimeline(soloTake(take + pass * takesPerPass)),
          sources: songSources,
          steps,
          turnaround: undefined,
          interludeRange: interludeWindow,
          /*
            Nốt đoạn dạo hỏi não ngay lúc dựng dòng thời gian. Não im thì bước
            dạo chiếm 0 phách, bài chạy y như không có nó.
          */
          /*
            Đoạn dạo đầu và đoạn kết chơi **cùng điệu với thân bài**.

            Câu tay phải dựng bằng cùng bộ sinh nốt với đoạn giang tấu. Nếu chỉ
            phát bấy nhiêu thì đoạn dạo là một dòng nốt bay lơ lửng, không có
            bass đỡ bên dưới, nghe như ai đó tập gam. Nên chỗ này quạt điệu đang
            chọn trên đúng vòng hợp âm ấy, rồi mới chồng câu lên trên.
          */
          phrase: (kind) => {
            /*
              Phần ráp nằm ở `style/phraseSection.ts`.

              Trước đây nó nằm ngay trong đây, tức trong thân một component React
              — không test nào gọi tới được. Và chính chỗ ấy sinh ra lỗi đè nốt ở
              đoạn kết mà không lưới nào bắt: bộ test cũ chỉ kiểm phần đệm, còn
              thứ tai nghe là phần đệm cộng câu ngẫu hứng cộng hợp âm báo, sau
              khi đã ráp.
            */
            const built = buildPhraseSection({
              kind,
              key: reharm.key,
              style: styleSolo,
              beatsPerChord: chordBeats,
              dropRoot,
              opening: recolored.find((chord) => !chord.passing) ?? null,
              songChords: mainSongChords,
              plainChords: plainPhrase,
              solo: (chords) =>
                phraseSolo(chords, kind === 'outro' ? 1 : 0, kind !== 'outro'),
              rollCue: kind === 'outro' || ballad,
            })
            if (!built) return brainPhrase({ kind, key: reharm.key })
            return built
          },
          restAfterInterlude: DEFAULT_REST_AFTER,
          beatsPerMeasure: style.beatsPerMeasure,
          styleId: styleSolo.id,
          ending: buildEnding,
          repeatEnding: varyOnRepeat ? buildRepeatEnding : undefined,
        })
      }

      return buildSongTimeline({
        accompaniment: yieldToFill(
          giveCompingToLeft(accompaniment, fills(pass), style.beatsPerMeasure),
          fills(pass),
        ),
        fills,
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
      fills,
      soloTake,
      oneLoopBeats,
      songSources,

      interludeWindow,
      // Dạo đầu và kết bài dựng bằng hàm này; đổi mật độ hay đổi điệu là phải
      // dựng lại, không thì hai đoạn ấy giữ nguyên câu của lần chọn trước.
      phraseSolo,
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

  const soloScaleLabel = useMemo(() => {
    const idx = activeChordIndex ?? selectedIndex
    if (idx === null) return null
    const chord = recolored.filter((item) => !item.passing)[idx]
    if (!chord) return null
    return scaleLabelForChord(chord, reharm.key)
  }, [activeChordIndex, selectedIndex, recolored, reharm.key])


  const timeline = song.events
  const loopLengthBeats = song.totalBeats

  /**
   * Ký hiệu hợp âm đoạn giang tấu, để hiện thành dải trên lưới.
   *
   * Gọi thẳng `interludeWindow` — đúng hàm mà dòng thời gian dùng — chứ không
   * dựng lại phép chọn khoảng. Ba bản sao của phép tính hợp âm đoạn dạo vừa
   * lệch nhau một lần rồi; không đẻ thêm bản thứ hai của phép này.
   *
   * `interludeWindow` tự tìm đoạn điệp khúc bên trong, nên truyền đoạn nào vào
   * cũng ra cùng một khoảng khi bài có điệp khúc.
   */
  const interludeSymbols = useMemo(() => {
    if (!songSources || songSources.length === 0) return []
    if (!steps.some((step) => step.type === 'interlude')) return []
    const over =
      songSources.find((source) => /điệp\s*khúc/i.test(source.name)) ??
      songSources[0]!
    return (
      interludeWindow(over, null)?.chords.map((span) => span.chord.symbol) ?? []
    )
  }, [songSources, steps, interludeWindow])

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
      perBeat: reharmPerBeat,
      meter: style.beatsPerMeasure === 3 ? 3 : 4,
      leadIn: steps.some((step) => step.type === 'intro')
        ? { label: 'Dạo đầu', chords: introSymbols }
        : undefined,
      leadOut: steps.some((step) => step.type === 'outro')
        ? { label: 'Kết bài', chords: outroSymbols }
        : undefined,
      ...(interludeSymbols.length > 0
        ? { interlude: { label: 'Giang tấu', chords: interludeSymbols } }
        : {}),
    })
  }, [
    setPracticeSong,
    songId,
    songTitle,
    timeline,
    twoHands,
    chordBeats,
    reharmPerBeat,
    style.beatsPerMeasure,
    steps,
    reharm.key,
    recolored,
    introSymbols,
    outroSymbols,
    interludeSymbols,
  ])

  useEffect(() => {
    setPracticeGrid({
      chordIndexAt: (beat) => {
        const index = chordIndexAt(withPassing, chordBeats, beat)
        let mainIndex = -1
        for (let position = 0; position <= index; position += 1) {
          if (!withPassing[position]?.passing) mainIndex += 1
        }
        return mainIndex >= 0 ? mainIndex : null
      },
      chordCount: sequence.chords.length,
      pairedChords,
      pairPlacesAt: (chordIndex) =>
        similarChordPairs(recolored, chordIndex).length,
      passingOptionsFor: (chordIndex) =>
        passingOptionsForChord(chordIndex, afterSlotOf(chordIndex)),
      onSetChordSpan: (chordIndex, span, scope) =>
        setPairedChords((current) => {
          if (scope === 'here') {
            return span === 'half'
              ? addChordPair(current, chordIndex)
              : removeChordPair(current, chordIndex)
          }
          return span === 'half'
            ? addSimilarChordPairs(current, recolored, chordIndex)
            : removeSimilarChordPairs(current, recolored, chordIndex)
        }),
      onTogglePassing: togglePassingGroup,
      onAddPassingHere: (slotId, hostKeepBeats) => {
        setAcceptedPassing((current) =>
          current.includes(slotId) ? current : [...current, slotId],
        )
        setPassingKeep((current) => {
          if (hostKeepBeats === undefined) {
            if (!(slotId in current)) return current
            const next = { ...current }
            delete next[slotId]
            return next
          }
          return { ...current, [slotId]: hostKeepBeats }
        })
      },
      onRemovePassingHere: (slotId) => {
        setAcceptedPassing((current) =>
          current.filter((entry) => entry !== slotId),
        )
        setPassingKeep((current) => {
          if (!(slotId in current)) return current
          const next = { ...current }
          delete next[slotId]
          return next
        })
      },
      fillAt,
      onToggleFill: toggleFill,
      runAt,
      onToggleRun: toggleRun,
      fillRestAt,
      onSetFillRest: setFillRest,
      colorHintAt,
      onCycleColor: cycleColor,
      slashHintAt,
      onToggleSlash: toggleSlash,
      transitionAt: (chordIndex) => transitions.get(chordIndex) ?? null,
      onToggleTransition: markTransition,
      onSetTransition: (chordIndex, run) =>
        setTransitionEdits((current) => ({ ...current, [chordIndex]: run })),
      onDuplicateChord: duplicateChord,
      onRemoveChord: (index) => {
        const list = parsed.chords.filter((_, i) => i !== index)
        if (list.length === 0) return
        setInput(list.map((chord) => chord.symbol).join(' '))
        setPastedSong((song) => (song ? { ...song, chords: list } : song))
        setImportedBeats((table) => shiftRecord(table, index, -1))
        setPairedChords((set) => shiftIndexSet(set, index, -1))
        setMutedFills((set) => shiftIndexSet(set, index, -1))
        setExtraFills((set) => shiftIndexSet(set, index, -1))
        setExtraRuns((set) => shiftIndexSet(set, index, -1))
        setFillRests((table) => shiftRecord(table, index, -1))
        setColorEdits((table) => shiftRecord(table, index, -1))
        setSlashEdits((table) => shiftRecord(table, index, -1))
        setTransitionEdits((table) => shiftRecord(table, index, -1))
        setAcceptedPassing((keys) =>
          keys.flatMap((key) => {
            const cut = key.indexOf(':')
            const at = Number(key.slice(0, cut))
            if (at === index) return []
            const rest = key.slice(cut)
            return [`${at > index ? at - 1 : at}${rest}`]
          }),
        )
      },
    })
  }, [
    setPracticeGrid,
    withPassing,
    chordBeats,
    sequence.chords.length,
    pairedChords,
    recolored,
    fillAt,
    toggleFill,
    runAt,
    toggleRun,
    fillRestAt,
    setFillRest,
    colorHintAt,
    cycleColor,
    slashHintAt,
    toggleSlash,
    markTransition,
    transitions,
    parsed.chords,
    acceptedPassing,
    passingKeep,
    passingGroups,
    duplicateChord,
  ])

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
      return buildPass(playRound.current + pass, song.soloTakes).events
    },
    [buildPass, song.soloTakes],
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

  const playFromBeat = useCallback(
    async (beat: number, sourceBeat = beat) => {
      await startAudio()
      stopTimelineLoop()
      pauseSource()
      playSpin.current += 1
      setPhraseSpin((spin) => spin + 1)
      const base = playSpin.current * 31 + 7
      startTimelineLoop(
        (pass) =>
          eventsForHand(
            buildPass(base + pass, song.soloTakes).events,
            hand,
          ),
        bpm,
        loopLengthBeats,
        beat,
        playsOnce,
      )
      startSourceAtBeat(sourceBeat, bpm, !playsOnce)
      advanceRound()
    },
    [buildPass, song.soloTakes, hand, bpm, loopLengthBeats, playsOnce, advanceRound],
  )

  const playFromSourceBeat = useCallback(
    (sourceBeat: number) => {
      const at =
        arrangedBeatAt(song.segments, sourceBeat, song.sections) ?? sourceBeat
      void playFromBeat(at, sourceBeat)
    },
    [song.segments, song.sections, playFromBeat],
  )

  const pausePlay = useCallback(() => {
    stopTimelineLoop()
    pauseSource()
  }, [])

  const stopPlay = useCallback(() => {
    stopTimelineLoop()
    stopSource()
  }, [])

  useEffect(() => {
    setPracticeTransport({
      playFrom: playFromSourceBeat,
      pause: pausePlay,
      stop: stopPlay,
      onTone: (delta) => setTranspose((value) => value + delta),
      toneLabel: transposeLabel(transpose),
      sourceBeat: (arranged) =>
        sourceBeatAt(song.segments, arranged % Math.max(1, song.totalBeats)),
    })
  }, [
    setPracticeTransport,
    playFromSourceBeat,
    pausePlay,
    stopPlay,
    transpose,
    song.segments,
    song.totalBeats,
  ])

  useEffect(() => {
    if (looping) syncSourceRate(bpm)
  }, [bpm, looping])

  const playingStyle = useRef(styleId)
  useEffect(() => {
    if (playingStyle.current === styleId) return
    playingStyle.current = styleId
    if (!usePlaybackStore.getState().looping) return

    const length = Math.max(1, loopLengthBeats)
    const from = usePlaybackStore.getState().positionBeats % length
    stopTimelineLoop()
    pauseSource()
    startTimelineLoop(
      (pass) => eventsForHand(passAt(pass), hand),
      bpm,
      loopLengthBeats,
      from,
      playsOnce,
    )
    startSourceAtBeat(from, bpm, !playsOnce)
  }, [styleId, passAt, hand, bpm, loopLengthBeats, playsOnce])

  /**
   * Đổi màu chủ âm thì đặt lại cả bộ màu cho ăn khớp.
   *
   * Chủ âm quyết định gu chung, nên để nó lệch pha với các bậc còn lại sẽ ra
   * một mớ chắp vá. Sau khi đặt lại, người dùng vẫn chỉnh riêng từng hàng được.
   */
  const applyTonicColor = (color: MajorChordColor) => {
    const palette = PALETTE_BY_TONIC_COLOR[color]

    setHaiGu(false)
    setTonicColor(color)
    setMajorColor(palette.major)
    setMinorColor(palette.minor)
    setDominantColor(palette.dominant)
    setSusDominant(palette.susDominant)
  }

  /**
   * Đổi sang bảng màu đọc từ kho thầy Hải.
   *
   * Không đụng `PALETTE_BY_TONIC_COLOR`: bảng của anh Khá còn nguyên, bấm màu
   * chủ âm bất kỳ là quay về gu Khá ngay.
   */
  const applyHaiGu = () => {
    if (!paletteHai) return
    setHaiGu(true)
    setTonicColor(paletteHai.major)
    setMajorColor(paletteHai.major)
    setMinorColor(paletteHai.minor)
    setDominantColor(paletteHai.dominant)
    setSusDominant(paletteHai.susDominant)
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
        <button
          type="button"
          onClick={() => {
            document.getElementById('song-library')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
            document.getElementById('song-library-search')?.focus()
          }}
          className="rounded-lg border border-amber-key/50 bg-amber-key/10 px-2.5 py-1 text-xs font-semibold text-amber-key hover:bg-amber-key/20"
        >
          Bài đã lưu
        </button>
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

      {soloScaleLabel && (
        <p className="text-sm font-semibold text-amber-key">
          Gam giang tấu: {soloScaleLabel}
        </p>
      )}

      {reharmPerBeat.length > 0 && (
        <ChordOverview
          perBeat={reharmPerBeat}
          /*
            Hợp âm đoạn dạo chỉ hiện khi thứ tự chơi **thật sự có** bước đó —
            bày sẵn một dải cho đoạn chưa chèn thì người dùng tưởng bài đã có
            dạo đầu rồi.
          */
          leadIn={
            steps.some((step) => step.type === 'intro')
              ? { label: 'Dạo đầu', chords: introSymbols }
              : undefined
          }
          interlude={
            interludeSymbols.length > 0
              ? { label: 'Giang tấu', chords: interludeSymbols }
              : undefined
          }
          leadOut={
            steps.some((step) => step.type === 'outro')
              ? {
                  label: 'Kết bài',
                  chords: outroSymbols,
                }
              : undefined
          }
          meter={style.beatsPerMeasure === 3 ? 3 : 4}
          bpm={bpm}
          onBpm={setBpm}
          showToolbar
          playEnabled={timeline.length > 0}
          toneLabel={transposeLabel(transpose)}
          onTone={(delta) => setTranspose((value) => value + delta)}
          activeBeat={
            looping
              ? sourceBeatAt(
                  song.segments,
                  positionBeats % Math.max(1, loopLengthBeats),
                )
              : null
          }
          onPlay={() => void playFromBeat(0)}
          onPause={pausePlay}
          onStop={stopPlay}
          onSeekBeat={(beat) => {
            const index = chordIndexAt(withPassing, chordBeats, beat)
            let mainIndex = -1
            for (let position = 0; position <= index; position += 1) {
              if (!withPassing[position]?.passing) mainIndex += 1
            }
            setSelectedIndex(mainIndex >= 0 ? mainIndex : null)
            playFromSourceBeat(beat)
          }}
          chordIndexAt={(beat) => {
            const index = chordIndexAt(withPassing, chordBeats, beat)
            let mainIndex = -1
            for (let position = 0; position <= index; position += 1) {
              if (!withPassing[position]?.passing) mainIndex += 1
            }
            return mainIndex >= 0 ? mainIndex : null
          }}
          chordCount={sequence.chords.length}
          pairedChords={pairedChords}
          pairPlacesAt={(chordIndex) =>
            similarChordPairs(recolored, chordIndex).length
          }
          passingOptionsFor={(chordIndex) =>
            passingOptionsForChord(chordIndex, afterSlotOf(chordIndex))
          }
          onTogglePassing={togglePassingGroup}
          onAddPassingHere={(slotId, hostKeepBeats) => {
            setAcceptedPassing((current) =>
              current.includes(slotId) ? current : [...current, slotId],
            )
            setPassingKeep((current) => {
              if (hostKeepBeats === undefined) {
                if (!(slotId in current)) return current
                const next = { ...current }
                delete next[slotId]
                return next
              }
              return { ...current, [slotId]: hostKeepBeats }
            })
          }}
          onRemovePassingHere={(slotId) => {
            setAcceptedPassing((current) =>
              current.filter((entry) => entry !== slotId),
            )
            setPassingKeep((current) => {
              if (!(slotId in current)) return current
              const next = { ...current }
              delete next[slotId]
              return next
            })
          }}
          transitionAt={(chordIndex) => transitions.get(chordIndex) ?? null}
          onToggleTransition={markTransition}
          onSetTransition={(chordIndex, run) =>
            setTransitionEdits((current) => ({ ...current, [chordIndex]: run }))
          }
          fillAt={fillAt}
          onToggleFill={toggleFill}
          runAt={runAt}
          onToggleRun={toggleRun}
          fillRestAt={fillRestAt}
          onSetFillRest={setFillRest}
          colorHintAt={colorHintAt}
          onCycleColor={cycleColor}
          heldMutedAt={(chordIndex) => mutedHeld.has(chordIndex)}
          heldBusyAt={(chordIndex) =>
            Boolean(reharm.colored[chordIndex]?.heldLabel)
          }
          onToggleHeldMute={toggleHeldMute}
          slashHintAt={slashHintAt}
          onToggleSlash={toggleSlash}
          onSetChordSpan={(chordIndex, span, scope) =>
            setPairedChords((current) => {
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
          onDuplicateChord={duplicateChord}
          onRemoveChord={(index) => {
            const list = parsed.chords.filter((_, i) => i !== index)
            if (list.length === 0) return
            setInput(list.map((chord) => chord.symbol).join(' '))
            setPastedSong((song) =>
              song ? { ...song, chords: list } : song,
            )
            setImportedBeats((table) => shiftRecord(table, index, -1))
            setPairedChords((set) => shiftIndexSet(set, index, -1))
            setMutedFills((set) => shiftIndexSet(set, index, -1))
            setExtraFills((set) => shiftIndexSet(set, index, -1))
            setExtraRuns((set) => shiftIndexSet(set, index, -1))
            setColorEdits((table) => shiftRecord(table, index, -1))
            setTransitionEdits((table) => shiftRecord(table, index, -1))
            setAcceptedPassing((keys) =>
              keys.flatMap((key) => {
                const cut = key.indexOf(':')
                const at = Number(key.slice(0, cut))
                if (at === index) return []
                const rest = key.slice(cut)
                return [`${at > index ? at - 1 : at}${rest}`]
              }),
            )
            setPassingKeep((table) => {
              const next: Record<string, number> = {}
              for (const [key, value] of Object.entries(table)) {
                const cut = key.indexOf(':')
                const at = Number(key.slice(0, cut))
                if (at === index) continue
                const rest = key.slice(cut)
                next[`${at > index ? at - 1 : at}${rest}`] = value
              }
              return next
            })
          }}
        />
      )}

      <SongImport
        onSourceFile={(file) => {
          loadSourceFile(file)
          setHasSource(!!file)
        }}
        onImport={(track) => {
          const text = track.chords.map((entry) => entry.symbol).join(' ')
          loadSong(parseSongText(text), text)
          setImportedBeats(
            Object.fromEntries(
              track.chords.map((entry, index) => [index, entry.beats]),
            ),
          )
          setBeatsPerChord(track.beatsPerMeasure)
          if (track.beatsPerMeasure === 3) setStyleId('waltz-1')
          setBpm(track.bpm)
          setLockSongBpm(true)
          setSourceNativeBpm(track.bpm)
          setSongTitle(track.title)
          if (track.key) setManualKey(track.key)
        }}
      />

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

      {/* Đệm theo điệu */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Đệm theo điệu
          </h3>
          <span className="font-mono text-[10px] text-teal-key">
            {style.timeSignature} · {style.bpm} BPM ·{' '}
            {style.sourceVideos?.[0] ?? 'chưa có nguồn'}
          </span>
        </div>

        <div className="mb-3">
          <StylePicker
            styles={ALL_STYLES}
            selectedId={styleId}
            onSelect={(id) => {
              setStyleId(id)
              const next = getStyle(id)
              if (next?.family === 'flamenco') void setInstrument('guitar')
              if (!lockSongBpm && next) setBpm(next.bpm)
            }}
          />
        </div>

        <p className="mb-3 text-xs leading-relaxed text-dim">{style.note}</p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              looping ? pausePlay() : void playFromBeat(0)
            }
            disabled={timeline.length === 0}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
              looping
                ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                : 'bg-amber-key text-ink hover:brightness-110'
            }`}
          >
            {looping ? '■ Dừng' : '▶ Phát lặp bản đệm'}
          </button>

          {/*
            Nhịp độ nằm ngay trong khung chọn điệu, vì hai thứ này luôn đi cùng
            nhau: đổi sang Boston hay Waltz là tempo phải đổi theo, mà mỗi điệu
            lại mang sẵn một mức riêng. Để cách nhau thì đổi điệu xong còn phải
            đi tìm chỗ chỉnh nhịp.

            Khung này đứng trên bản nhạc nên đang tập vẫn với tới được, không
            phải cuộn xuống đáy trang.
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
                onClick={() => {
                  const next = Math.max(-6, effectiveTranspose - 1)
                  const applied = next - effectiveTranspose
                  if (applied === 0) return
                  setTranspose(next)
                  setManualKey((key) => shiftKeyId(key, applied))
                }}
                disabled={effectiveTranspose <= -6}
                aria-label="Hạ tone nửa cung"
                title="Hạ nửa cung"
                className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream hover:bg-white/12 disabled:opacity-30"
              >
                −
              </button>
              <span
                className={`w-10 text-center font-mono text-xs ${
                  effectiveTranspose === 0 ? 'text-dim' : 'text-amber-key'
                }`}
              >
                {reharm.key
                  ? pitchClassName(
                      reharm.key.tonic,
                      accidentalStyleFor(reharm.key.tonic, reharm.key.scale),
                    )
                  : transposeLabel(effectiveTranspose)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(6, effectiveTranspose + 1)
                  const applied = next - effectiveTranspose
                  if (applied === 0) return
                  setTranspose(next)
                  setManualKey((key) => shiftKeyId(key, applied))
                }}
                disabled={effectiveTranspose >= 6}
                aria-label="Nâng tone nửa cung"
                title="Nâng nửa cung"
                className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream hover:bg-white/12 disabled:opacity-30"
              >
                +
              </button>
              {effectiveTranspose !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setManualKey('')
                    setTranspose(0)
                  }}
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
              onChange={(value) => {
                setManualKey(value)
                if (!value || !chartKey) {
                  if (!value) setTranspose(0)
                  return
                }
                setTranspose(
                  semitonesToKey(chartKey.tonic, Number(value.split(':')[0])),
                )
              }}
              detectedLabel={reharm.keyCandidates[0]?.label}
              scaleFilter={currentKeyScale}
            />
          </div>

          {reharm.keyAmbiguous && reharm.keySource === 'detected' && (
            <p className="mb-2 rounded-lg border border-teal-key/30 bg-teal-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
              App chưa chắc chắn về giọng — {reharm.keyCandidates[0]?.label} và{' '}
              {reharm.keyCandidates[1]?.label} đều khớp gần như nhau. Nếu tô màu
              nghe chưa đúng thì chọn giọng bằng tay.
            </p>
          )}

          {sheet &&
            sheet.sections.some((section) =>
              section.lines.some((line) => line.lyric.trim().length > 0),
            ) && (
          <SongSheetView
            sheet={sheet}
            activeIndex={activeChordIndex}
            pairedChords={pairedChords}
            passingOptionsFor={(chordIndex) =>
              passingOptionsForChord(chordIndex, chordIndex)
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
            onToggleTransition={markTransition}
            onSetTransition={(chordIndex, run) =>
              setTransitionEdits((current) => ({ ...current, [chordIndex]: run }))
            }
            fillAt={fillAt}
            onToggleFill={toggleFill}
            runAt={runAt}
            onToggleRun={toggleRun}
            fillRestAt={fillRestAt}
            onSetFillRest={setFillRest}
            colorHintAt={colorHintAt}
            onCycleColor={cycleColor}
            heldMutedAt={(chordIndex) => mutedHeld.has(chordIndex)}
            heldBusyAt={(chordIndex) =>
              Boolean(reharm.colored[chordIndex]?.heldLabel)
            }
            onToggleHeldMute={toggleHeldMute}
            slashHintAt={slashHintAt}
            onToggleSlash={toggleSlash}
            toolbar={
              <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-line pb-3">
                <button
                  type="button"
                  onClick={() =>
                    looping ? pausePlay() : void playFromBeat(0)
                  }
                  disabled={timeline.length === 0}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                    looping
                      ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                      : 'bg-amber-key text-ink hover:brightness-110'
                  }`}
                >
                  {looping
                    ? '■ Dừng'
                    : playsOnce
                      ? '▶ Phát trọn bài'
                      : '▶ Phát cả bài'}
                </button>
              </div>
            }
            onDuplicateChord={duplicateChord}
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
              setSelectedIndex(chordIndex)
              playFromSourceBeat(beatOfMainChord(chordIndex))
            }}
          />
            )}

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
            <span className="text-rose-300 underline decoration-double decoration-2 underline-offset-4">
              Licky Runs
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
              title="Dạo đầu, kết bài và giang tấu là đoạn không có lời — nhạc cụ là giai điệu chính, nên chúng có nguồn nốt riêng, không dùng chung với câu solo chạy dưới giọng hát."
            >
              Gam cho dạo đầu / kết bài / giang tấu
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPhraseScaleId(MULTI_SCALE)}
                title="Mỗi hợp âm một gam, đổi theo hoà âm. Lối jazz."
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  phraseScale === null
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                Nhiều gam
              </button>
              {autoPhraseScale && (
                <button
                  type="button"
                  onClick={() => setPhraseScaleId(null)}
                  title="Điệu slow rock lấy gam Blues: thầy Đức Thịnh nói mẫu đệm slow rock thực ra là điệu Blues, chỉ thiếu nốt blue ở bậc năm giáng."
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    phraseScaleId === null
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  Tự động — {autoPhraseScale.label}
                </button>
              )}
            </div>

            {phraseScale !== null && (
              <div className="mt-2">
                <p className="mb-1 text-[10px] text-dim">
                  Một gam chạy suốt cả vòng. Đề xuất chấm theo chính vòng hợp âm
                  của bài — số phần trăm là phần nốt hợp âm mà gam ấy phủ được.
                </p>
                <div className="flex flex-wrap gap-2">
                  {scaleChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setPhraseScaleId(choice.id)}
                      title={
                        choice.missing.length > 0
                          ? `Không có nốt: ${choice.missing.join(' ')}`
                          : 'Phủ trọn mọi nốt hợp âm của vòng'
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        phraseScale.id === choice.id
                          ? 'border-amber-key bg-amber-key/15 text-amber-key'
                          : 'border-line bg-white/4 text-dim hover:bg-white/8'
                      }`}
                    >
                      {choice.label}{' '}
                      <span className="text-dim">
                        {Math.round(choice.fit * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <h4 className="mb-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Giang tấu mượn mấy hợp âm
              </h4>
              <p className="mb-1 text-[10px] text-dim">
                Đo trên bản ký âm người thật: đoạn từ <b>18 ô trở lên</b> mới
                được viết thành một bản độc tấu; từ 11 ô trở xuống là cầu nối,
                đi qua bằng chính kết cấu đoạn hát.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {INTERLUDE_LENGTHS.map((count) => {
                  const bars = Math.round(
                    (count * chordBeats) / Math.max(1, phrasePulseBar),
                  )
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setInterludeChords(count)}
                      title={
                        bars >= LONG_INTERLUDE_BARS
                          ? `${bars} ô — đủ dài cho một bản độc tấu`
                          : `${bars} ô — vẫn là một cầu nối`
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        interludeChords === count
                          ? 'border-amber-key bg-amber-key/15 text-amber-key'
                          : 'border-line bg-white/4 text-dim hover:bg-white/8'
                      }`}
                    >
                      {count} hợp âm{' '}
                      <span className="text-dim">
                        ≈{bars} ô{bars >= LONG_INTERLUDE_BARS ? ' · độc tấu' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
              {interludeChords !== DEFAULT_INTERLUDE_CHORDS && (
                <p className="mt-1 text-[10px] text-dim">
                  Mặc định là 4. Bản mượn nguyên vòng từng bị bác vì nghe lê thê
                  — nếu vẫn thấy vậy thì nhiều khả năng do câu solo, không do độ dài.
                </p>
              )}
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-dim">
              <input
                type="checkbox"
                checked={lineSolo}
                onChange={(event) => setLineSolo(event.target.checked)}
                disabled={!phraseScale}
              />
              <span
                title={
                  phraseScale
                    ? 'Dựng nhịp trước: rút hình nhịp trong vốn đo được của Cà Pháo, để chỗ nghỉ cuối mỗi câu, câu đáp lặp lại hình nhịp câu hỏi; xong mới đặt cao độ. Thay cho việc bốc một hình quãng có sẵn trong sổ mẫu.'
                    : 'Cần chọn MỘT gam thì mới dựng được — lối nhiều gam không có ao nốt chung.'
                }
              >
                Dựng câu bằng nhịp trước{' '}
                <span className="text-dim">
                  {phraseScale ? '(thay sổ mẫu Licky)' : '— cần chọn một gam'}
                </span>
              </span>
            </label>

            <label className="mt-2 flex items-center gap-2 text-xs text-dim">
              <input
                type="checkbox"
                checked={plainPhrase}
                onChange={(event) => setPlainPhrase(event.target.checked)}
              />
              <span title="Rút add9, 9sus4, 13, hợp âm giảm về chất cơ bản trước khi dựng câu. Màu hợp âm là thứ của đoạn có lời; đoạn ngẫu hứng cần nền trơn để câu chạy không nghe lạc.">
                Rút gọn hợp âm đoạn không lời
              </span>
            </label>
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
            Bỏ ô chọn mật độ nốt giang tấu. Ô 1 / ô 3 / ô 4 tự quyết mật độ.
          */}

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

            {/*
              Gam jazz đứng RIÊNG, dưới hàng nút chứ không nằm trong hàng nút.

              Ba nút trên là ba cách dựng nốt từ chính hợp âm, chọn một trong ba,
              và cách nào cũng ra tiếng. Công tắc này khác loại: nó đọc kho
              PianoBrain, chỉ chạy ở đoạn không lời, và im lặng trên hợp âm nào
              kho chưa có gam — mà đó là phần lớn hợp âm nhạc pop.

              Không khoá theo họ ballad như hai công tắc dưới: gam jazz dùng được
              ở mọi điệu, và thật ra ballad là chỗ ít cần nó nhất.
            */}
            <label
              className="mt-2 flex items-center gap-2 text-xs text-dim"
              title="Đoạn không lời chạy đúng thang âm của chất hợp âm, lấy từ kho PianoBrain. Hợp âm bảy jazz: Lydian cho maj7, Bebop Dominant cho hợp âm át, Altered cho át biến âm, Melodic Minor cho m(maj7), Whole Tone cho 7#5, Diminished cho dim7 — 13 bài giảng jazz, đã đối chiếu video. Hợp âm ba nốt trưởng và thứ: ngũ cung thầy Hải dạy ở Tập 1 bài 9, dựng trên chính nốt gốc hợp âm nên không lạc giọng. Còn sus4, m6 thì kho chưa có gam — giữ nguyên nốt hợp âm. Câu lót chen giữa lời không đổi."
            >
              <input
                type="checkbox"
                checked={storeScales}
                onChange={(event) => setStoreScales(event.target.checked)}
                className="accent-teal-key"
              />
              Gam của kho
            </label>

            {storeScales && (
              <p className="mt-1 text-[10px] leading-snug text-dim/80">
                Chỉ đổi đoạn không lời. Hợp âm bảy jazz lấy gam của nguồn Jazz
                Scales; hợp âm ba nốt lấy ngũ cung thầy Hải dạy ở Tập 1 bài 9.
                {missingScales.length > 0 && (
                  <>
                    {' '}
                    <span className="text-amber-key/80">
                      Kho chưa có gam cho {missingScales.length} hợp âm trong bài (
                      {missingScales.slice(0, 6).join(', ')}
                      {missingScales.length > 6 ? '…' : ''}) — mấy hợp âm đó giữ
                      nguyên nốt hợp âm.
                    </span>
                  </>
                )}
              </p>
            )}

            {/*
              Hai công tắc này chỉ có nghĩa ở họ ballad, nên điệu khác thì không
              bày ra. Bày một lựa chọn không dùng được ở đó chỉ khiến người học
              tưởng walking 1-2-3-5 hợp với mọi điệu.
            */}
            {ballad && (
              <>
                <label
                  className="mt-2 flex items-center gap-2 text-xs text-dim"
                  title="Hình câu lót lấy từ luật thầy Kingsley trong kho PianoBrain: 1-7-5-3 chỉ khi ô trước bậc vi đúng là bậc I, còn lại lùi về preceding 3-2-1. Chỗ nào kho không có luật thì giữ nguyên câu fill cũ."
                >
                  <input
                    type="checkbox"
                    checked={brainFills}
                    onChange={(event) => setBrainFills(event.target.checked)}
                    className="accent-teal-key"
                  />
                  Câu lót theo thầy Kingsley
                </label>

                <label
                  className="mt-1.5 flex items-center gap-2 text-xs text-dim"
                  title="Tay trái đi bốn nốt đen 1-2-3-5 theo Pianote: hợp âm trưởng đi C-D-E-G, hợp âm thứ đi A-B-C-E. Tay phải giữ nguyên điệu đang chọn. Tắt thì tuyến trầm chạy đúng ô nhịp như cũ."
                >
                  <input
                    type="checkbox"
                    checked={walkingBass}
                    onChange={(event) => setWalkingBass(event.target.checked)}
                    className="accent-teal-key"
                  />
                  Tay trái walking 1-2-3-5 (Pianote)
                </label>

                <p className="mt-1 font-mono text-[10px] text-teal-key/70">
                  Chỉ có ở họ ballad
                </p>
              </>
            )}
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
            <label className="flex items-center gap-2 text-xs text-dim">
              Đệm
              <input
                type="range"
                min={-24}
                max={0}
                value={volumeDb}
                onChange={(event) => setVolumeDb(Number(event.target.value))}
                aria-label="Âm lượng tiếng đệm"
                className="w-24 accent-amber-key"
              />
            </label>

            <label
              className={`flex items-center gap-1.5 text-xs ${hasSource ? 'text-dim' : 'text-dim/40'}`}
              title={
                hasSource
                  ? 'Phát file nhạc đã chọn làm nền'
                  : 'Chọn file nhạc ở khung nhập bài trước'
              }
            >
              <input
                type="checkbox"
                checked={sourceOn}
                disabled={!hasSource}
                onChange={(event) => {
                  const on = event.target.checked
                  setSourceOn(on)
                  setSourceEnabled(on)
                  if (on && looping) {
                    startSourceAtBeat(positionBeats, bpm, !playsOnce)
                  } else {
                    pauseSource()
                  }
                }}
                className="accent-amber-key"
              />
              Nhạc gốc nền
            </label>

            {hasSource && (
              <label className="flex items-center gap-2 text-xs text-dim">
                Nền
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sourceVol}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setSourceVol(value)
                    setSourceVolume(value / 100)
                  }}
                  aria-label="Âm lượng nhạc gốc"
                  className="w-20 accent-amber-key"
                />
              </label>
            )}

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
            title="Lượt hai của cùng loại đoạn: hợp âm cuối đổi thành bậc năm của chỗ sắp vào, ghi luôn trên lời. Ví dụ Em7 → E7b9"
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
                  {haiGu && paletteHai
                    ? paletteHai.styleName
                    : PALETTE_BY_TONIC_COLOR[tonicColor].styleName}
                </span>
                . Đổi màu chủ âm sẽ đặt lại các hàng bên dưới cho ăn khớp, sau
                đó bạn vẫn chỉnh riêng từng hàng được.
              </p>

              {paletteHai && (
                <button
                  type="button"
                  onClick={applyHaiGu}
                  aria-pressed={haiGu}
                  title="Bảng màu đếm ra từ 70 bài giảng của thầy Hải trong kho PianoBrain. Bấm một màu chủ âm ở trên là quay lại gu anh Khá."
                  className={`mt-2 rounded-lg border px-3 py-1.5 text-xs ${
                    haiGu
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line text-dim hover:bg-white/5'
                  }`}
                >
                  Gu thầy Hải ({paletteHai.major} · {paletteHai.minor} ·{' '}
                  {paletteHai.dominant})
                </button>
              )}
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
              hint="Áp cho bậc ii, iii, vi và iv. Chủ âm thứ luôn m(add9), không lấy m7. Chọn m hoặc m(add9) nếu muốn bớt nốt ngoài giọng. dim/dim7 chỉ đổi hợp âm vốn đã giảm."
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
