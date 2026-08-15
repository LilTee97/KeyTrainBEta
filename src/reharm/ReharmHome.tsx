import { useMemo, useState } from 'react'
import {
  playChord,
  playChordSequence,
  playTimeline,
  startAudio,
  useAudioStore,
} from '../shared/audio/audioEngine'
import { setBpm, useMetronomeStore } from '../shared/audio/metronome'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { chordNotes } from '../shared/musicTheory/chordDefinitions'
import { midiToName, pitchClassName } from '../shared/musicTheory/pitch'
import type { MidiNote } from '../shared/musicTheory/types'
import { fitToKeyboard } from '../shared/musicTheory/voicing'
import { parseChordInput } from './input/chordInputParser'
import type {
  ApproachDirection,
  OrnamentDensity,
} from './fillSoloGenerator/graceNoteOrnamenter'
import { DENSITY_OPTIONS } from './fillSoloGenerator/graceNoteOrnamenter'
import {
  generateFillLine,
  generateSolo,
  soloToTimeline,
} from './fillSoloGenerator/soloGenerator'
import { NoteGatedPractice } from './playback/NoteGatedPractice'
import type { PassingTechnique } from './reharmEngine/passingChordRules'
import { TECHNIQUE_LABELS } from './reharmEngine/passingChordRules'
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
  ALL_STYLES,
  BALLAD,
  getStyle,
  isPlayable,
} from './style/styleLibrary'
import type { ParsedChord } from './types'
import { flattenHands, voiceLeadTwoHands } from './voicingGenerator/handSplitVoicing'

/**
 * Bảng chọn nhanh: chạm tính chất rồi chạm nốt gốc để thêm hợp âm.
 * Các tính chất ở đây chọn theo mức hay dùng trong phong cách đang mô hình hoá.
 */
const PICKER_QUALITIES = [
  { suffix: '', label: 'trưởng' },
  { suffix: 'm', label: 'thứ' },
  { suffix: 'maj7', label: 'maj7' },
  { suffix: '7', label: '7' },
  { suffix: 'm7', label: 'm7' },
  { suffix: 'm7b5', label: 'ø' },
  { suffix: 'dim7', label: 'dim7' },
  { suffix: 'sus4', label: 'sus4' },
  { suffix: '9', label: '9' },
  { suffix: 'm9', label: 'm9' },
  { suffix: 'm11', label: 'm11' },
  { suffix: '9sus4', label: '9sus4' },
  { suffix: 'add9', label: 'add9' },
  { suffix: '6', label: '6' },
  { suffix: '7b9', label: '7b9' },
]

const ROOT_NAMES = Array.from({ length: 12 }, (_, pitchClass) =>
  pitchClassName(pitchClass),
)

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

export function ReharmHome() {
  const audioReady = useAudioStore((state) => state.ready)

  // Cố ý để một vòng pop trơn, chưa có màu gì — như vậy tác dụng của phần tái
  // hòa âm nhìn ra ngay. Để sẵn một vòng đã đầy màu thì trông như app không
  // làm gì cả.
  const [input, setInput] = useState('C Am F G')
  const [pickerQuality, setPickerQuality] = useState('')
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
  /** Cho phép dùng cả những màu jazz không thấy trong tài liệu. */
  const [allowJazzColors, setAllowJazzColors] = useState(false)
  /** Các gợi ý hợp âm lướt người dùng đã chấp nhận, theo khoá vị trí + kỹ thuật. */
  const [acceptedPassing, setAcceptedPassing] = useState<string[]>([])
  /** Chỉ hiện gợi ý thuộc kỹ thuật này. Rỗng nghĩa là hiện hết. */
  const [techniqueFilter, setTechniqueFilter] = useState<string | null>(null)
  /**
   * Chế độ giai điệu tự sinh:
   * - `off`: không có gì
   * - `fill`: câu ngắn chêm ở cuối hợp âm để dẫn sang hợp âm sau
   * - `solo`: chơi liên tục suốt vòng, dùng cho đoạn giang tấu
   */
  const [melodyMode, setMelodyMode] = useState<'off' | 'fill' | 'solo'>('off')
  const playSolo = melodyMode !== 'off'
  const [soloDirection, setSoloDirection] =
    useState<ApproachDirection>('mixed')
  const [soloDensity, setSoloDensity] = useState<OrnamentDensity>('medium')
  /** Giọng do người dùng chỉ định. Rỗng nghĩa là để app tự dò. */
  const [manualKey, setManualKey] = useState('')
  /** Tay nào được phát, để nghe riêng từng tay. */
  const [hand, setHand] = useState<'both' | 'left' | 'right'>('both')

  const bpm = useMetronomeStore((state) => state.bpm)

  const sequence = useMemo(() => parseChordInput(input), [input])

  /** Khoá định danh một gợi ý, để nhớ người dùng đã bật cái nào. */
  const keyOf = (index: number, technique: string) => `${index}:${technique}`

  /**
   * Chạy cả đường ống tái hòa âm: dò giọng → phân tích bậc → thêm màu → gợi ý
   * hợp âm lướt. Thứ tự này quan trọng, xem ghi chú trong reharmPipeline.ts.
   */
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
  ])

  const recolored = reharm.colored
  const passingSuggestions = reharm.passingSuggestions
  /** Vòng về mặt hòa âm — thứ ghi lên bản nhạc. */
  const harmonic = reharm.harmonic
  /** Vòng về mặt cách bấm — thứ tay thật sự chơi. */
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

  /** Nốt để phát, theo chế độ đang chọn. */
  const playbackNotes = useMemo(
    () =>
      smoothVoicing
        ? twoHands.map(flattenHands)
        : withPassing.map((chord, index) => [
            // Thế mộc vẫn có nốt bass tay trái để so sánh công bằng
            twoHands[index]?.left[0] ?? chord.root + 40,
            ...plain[index],
          ]),
    [smoothVoicing, twoHands, plain, withPassing],
  )

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

  /** Dòng thời gian phần đệm theo điệu đang chọn. */
  const accompaniment = useMemo(
    () => renderPattern(twoHands, style, { beatsPerChord: chordBeats }),
    [twoHands, style, chordBeats],
  )

  /** Giai điệu tự sinh, phát chồng lên phần đệm. */
  const solo = useMemo(() => {
    if (melodyMode === 'off') return []

    const args = {
      beatsPerChord: chordBeats,
      direction: soloDirection,
      density: soloDensity,
      key: reharm.key,
    }

    return melodyMode === 'fill'
      ? generateFillLine(withPassing, args)
      : generateSolo(withPassing, args)
  }, [melodyMode, withPassing, chordBeats, soloDirection, soloDensity, reharm.key])

  const timeline = useMemo(
    () =>
      playSolo
        ? [...accompaniment, ...soloToTimeline(solo)].sort(
            (a, b) => a.startBeat - b.startBeat,
          )
        : accompaniment,
    [accompaniment, solo, playSolo],
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

  /** Số gợi ý của từng kỹ thuật, để hiện trên nút lọc. */
  const techniqueCounts = useMemo(() => {
    const counts = new Map<PassingTechnique, number>()
    for (const suggestion of passingSuggestions) {
      counts.set(
        suggestion.technique,
        (counts.get(suggestion.technique) ?? 0) + 1,
      )
    }
    return [...counts.entries()]
  }, [passingSuggestions])

  const visibleSuggestions = useMemo(
    () =>
      techniqueFilter === null
        ? passingSuggestions
        : passingSuggestions.filter(
            (suggestion) => suggestion.technique === techniqueFilter,
          ),
    [passingSuggestions, techniqueFilter],
  )

  /** Xung đột nhạc lý, gom theo vị trí hợp âm để hiện ngay cạnh nó. */
  const conflictMap = useMemo(
    () => conflictsByIndex(reharm.conflicts),
    [reharm.conflicts],
  )

  /** Vòng hợp âm không đổi gì sau khi tái hòa âm — cần báo cho người dùng biết. */
  const isUnchanged = useMemo(() => {
    if (withPassing.length !== sequence.chords.length) return false
    return withPassing.every(
      (chord, index) => chord.symbol === sequence.chords[index]?.symbol,
    )
  }, [withPassing, sequence.chords])

  /** Tổng quãng đường tay phải phải đi, để thấy con số cụ thể. */
  const movement = useMemo(
    () => ({
      smooth: totalMovement(twoHands.map((voicing) => voicing.right)),
      plain: totalMovement(plain),
    }),
    [twoHands, plain],
  )

  const appendChord = (rootName: string) => {
    const next = `${rootName}${pickerQuality}`
    setInput((current) => (current.trim() ? `${current.trim()} ${next}` : next))
  }

  const removeLast = () => {
    const tokens = input.trim().split(/\s+/).filter(Boolean)
    setInput(tokens.slice(0, -1).join(' '))
  }

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

      {/* Ô nhập */}
      <div>
        <label
          htmlFor="chord-input"
          className="mb-2 block font-mono text-[11px] tracking-[0.08em] text-dim uppercase"
        >
          Vòng hợp âm
        </label>
        <input
          id="chord-input"
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setSelectedIndex(null)
          }}
          placeholder="Ví dụ: Dm7 G7 Cmaj7"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-line bg-white/6 px-4 py-3 font-mono text-base text-cream outline-none focus:border-amber-key"
        />
      </div>

      {/* Kết quả đọc được */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        {sequence.chords.length === 0 && sequence.errors.length === 0 ? (
          <p className="text-sm text-dim">Chưa có hợp âm nào.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {sequence.chords.map((chord, index) => (
                <button
                  key={`${chord.symbol}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(index)
                    if (audioReady) {
                      playChord(playbackNotes[index] ?? notesForChord(chord))
                    }
                  }}
                  className={`rounded-lg border px-3 py-2 font-serif text-lg transition-colors ${
                    selectedIndex === index
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-cream hover:bg-white/8'
                  }`}
                >
                  {chord.symbol}
                </button>
              ))}
            </div>

            {sequence.errors.length > 0 && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-rose-300">
                Không đọc được:{' '}
                {sequence.errors.map((error) => error.source).join(', ')}
              </p>
            )}

            {selected && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-dim">
                <span className="text-cream">{selected.symbol}</span> ·{' '}
                {selected.quality.label}
                {selected.bass !== undefined && (
                  <> · bass {pitchClassName(selected.bass)}</>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Kết quả tái hòa âm — đặt ngay đây để thấy tác dụng mà không phải kéo xuống */}
      {sequence.chords.length > 0 && (
        <div className="rounded-xl border border-amber-key/40 bg-amber-key/5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] tracking-[0.08em] text-amber-key uppercase">
              Sau khi tái hòa âm
            </h3>

            <label className="flex items-center gap-2 text-xs text-dim">
              Giọng
              <select
                value={manualKey}
                onChange={(event) => setManualKey(event.target.value)}
                className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream outline-none"
              >
                <option value="">
                  Tự dò
                  {reharm.key && ` (${reharm.key.label})`}
                </option>
                {reharm.keyCandidates.map((candidate) => (
                  <option
                    key={`${candidate.tonic}:${candidate.scale}`}
                    value={`${candidate.tonic}:${candidate.scale}`}
                  >
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {reharm.keyAmbiguous && reharm.keySource === 'detected' && (
            <p className="mb-3 rounded-lg border border-teal-key/30 bg-teal-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
              App chưa chắc chắn về giọng — {reharm.keyCandidates[0]?.label} và{' '}
              {reharm.keyCandidates[1]?.label} đều khớp gần như nhau. Nếu tô màu
              nghe chưa đúng thì chọn giọng bằng tay.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="w-16 font-mono text-[10px] text-dim">gốc</span>
              <span className="font-mono text-sm text-dim">
                {sequence.chords.map((chord) => chord.symbol).join('  ')}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="w-16 font-mono text-[10px] text-amber-key">
                đã đổi
              </span>
              <span className="font-serif text-lg text-amber-key">
                {harmonic.map((chord) => chord.symbol).join('  ')}
              </span>
            </div>

            {/* Cách bấm chỉ hiện khi nó khác với tên hợp âm */}
            {useSlashChords && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className="w-16 font-mono text-[10px] text-teal-key"
                  title="Bản nhạc ghi tên hợp âm ở dòng trên, còn đây là cách đặt tay để bấm nó"
                >
                  bấm thành
                </span>
                <span className="font-serif text-lg text-teal-key">
                  {withPassing.map((chord) => chord.symbol).join('  ')}
                </span>
              </div>
            )}
          </div>

          {isUnchanged && (
            <p className="mt-3 border-t border-amber-key/20 pt-3 text-xs leading-relaxed text-dim">
              Vòng này vốn đã đủ màu nên không có gì để thêm. Thử gõ một vòng
              trơn như <span className="font-mono text-cream">C Am F G</span> để
              thấy rõ tác dụng.
            </p>
          )}

          <p className="mt-3 border-t border-amber-key/20 pt-3 text-xs leading-relaxed text-dim">
            Tái hòa âm chạy tự động. Chỉnh mức độ ở mục{' '}
            <span className="text-cream">Thêm màu hợp âm</span>, chèn hợp âm nối
            ở mục <span className="text-cream">Hợp âm lướt</span> phía dưới.
          </p>
        </div>
      )}

      {/* Nghe thử */}
      <div className="flex flex-wrap items-center gap-3">
        {!audioReady ? (
          <button
            type="button"
            onClick={() => void startAudio()}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
          >
            Bật âm thanh
          </button>
        ) : (
          <button
            type="button"
            onClick={() => playChordSequence(playbackNotes, 1.4)}
            disabled={sequence.chords.length === 0}
            title="Chỉ nghe hợp âm khối để kiểm tra hoà âm — không có điệu, không có câu fill hay solo. Muốn nghe đầy đủ thì dùng nút ở mục Đệm theo điệu."
            className="rounded-lg border border-line bg-white/6 px-4 py-2 text-sm text-cream hover:bg-white/12 disabled:opacity-40"
          >
            ♪ Nghe hợp âm trơn
          </button>
        )}

        <button
          type="button"
          onClick={removeLast}
          className="rounded-lg border border-line px-3 py-2 text-xs text-dim hover:bg-white/6"
        >
          ← Xoá hợp âm cuối
        </button>
        <button
          type="button"
          onClick={() => setInput('')}
          className="rounded-lg border border-line px-3 py-2 text-xs text-dim hover:bg-white/6"
        >
          Xoá hết
        </button>
      </div>

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

      {/* Thêm màu hợp âm */}
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

      {/* Hợp âm lướt */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Hợp âm lướt
          </h3>
          {acceptedPassing.length > 0 && (
            <button
              type="button"
              onClick={() => setAcceptedPassing([])}
              className="font-mono text-[10px] text-dim hover:text-cream"
            >
              bỏ hết
            </button>
          )}
        </div>

        <p className="mb-3 text-xs leading-relaxed text-dim">
          Chèn hợp âm nối vào giữa hai hợp âm chính. Tài liệu xếp đây là kỹ
          thuật lõi, đáng học kỹ nhất của phong cách. Chọn từng chỗ, đừng chèn
          hết — chèn dày quá thì bài mất hướng.
        </p>

        {passingSuggestions.length === 0 ? (
          <p className="text-sm text-dim">
            Vòng này chưa có chỗ nào chèn được.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Lọc theo kỹ thuật — danh sách dài thì khó tìm đúng loại cần */}
            <div className="mb-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTechniqueFilter(null)}
                className={`rounded-lg border px-3 py-1 text-[11px] ${
                  techniqueFilter === null
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                Tất cả ({passingSuggestions.length})
              </button>

              {techniqueCounts.map(([technique, count]) => (
                <button
                  key={technique}
                  type="button"
                  onClick={() =>
                    setTechniqueFilter(
                      techniqueFilter === technique ? null : technique,
                    )
                  }
                  className={`rounded-lg border px-3 py-1 text-[11px] ${
                    techniqueFilter === technique
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/4 text-dim hover:bg-white/8'
                  }`}
                >
                  {TECHNIQUE_LABELS[technique]} ({count})
                </button>
              ))}
            </div>

            {visibleSuggestions.map((suggestion) => {
              const key = keyOf(
                suggestion.insertBeforeIndex,
                suggestion.technique,
              )
              const isOn = acceptedPassing.includes(key)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setAcceptedPassing((current) =>
                      isOn
                        ? current.filter((entry) => entry !== key)
                        : [...current, key],
                    )
                  }
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    isOn
                      ? 'border-amber-key bg-amber-key/15'
                      : 'border-line bg-white/4 hover:bg-white/8'
                  }`}
                >
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`font-mono text-[10px] ${
                        isOn ? 'text-amber-key' : 'text-dim'
                      }`}
                    >
                      {TECHNIQUE_LABELS[suggestion.technique]}
                    </span>
                    <span className="font-serif text-base text-cream">
                      {suggestion.chords
                        .map((chord) => chord.symbol)
                        .join(' → ')}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-dim">
                    {suggestion.explanation}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {acceptedPassing.length > 0 && (
          <p className="mt-3 border-t border-line pt-3">
            <span className="font-mono text-[10px] text-dim">
              Vòng sau khi chèn:{' '}
            </span>
            <span className="font-serif text-sm text-amber-key">
              {withPassing.map((chord) => chord.symbol).join(' · ')}
            </span>
          </p>
        )}
      </div>

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
              playTimeline(eventsForHand(timeline, hand), bpm)
            }
            disabled={!audioReady || timeline.length === 0}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40"
          >
            ♪ Nghe bản đệm đầy đủ
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
          <label className="flex items-center gap-3 text-xs text-dim">
            Nhịp độ
            <input
              type="range"
              min={40}
              max={160}
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
              className="accent-amber-key"
            />
            <span className="w-16 font-mono text-cream">{bpm} BPM</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-dim">
            Mỗi hợp âm
            <select
              value={beatsPerChord}
              onChange={(event) =>
                setBeatsPerChord(Number(event.target.value))
              }
              className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream outline-none"
            >
              <option value={8}>2 ô nhịp</option>
              <option value={4}>1 ô nhịp</option>
              <option value={2}>nửa ô nhịp</option>
              <option value={1}>1 phách</option>
            </select>
          </label>
        </div>
      </div>

      <NoteGatedPractice
        timeline={timeline}
        voicings={twoHands}
        beatsPerChord={chordBeats}
      />

      {/* Câu solo tự sinh */}
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Câu fill và đoạn solo
          </h3>
          <span className="rounded border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">
            thử nghiệm · mô phỏng phong cách
          </span>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-dim">
          Tài liệu mô tả cách chơi giai điệu ở mức{' '}
          <span className="text-cream">nguyên lý</span> — nốt láy quanh nốt
          đích, nốt đích lấy trong hợp âm — chứ không cho thuật toán sinh câu.
          Phần này là một cách hiện thực hoá nguyên lý đó, đáng nghe thử và
          chỉnh, không phải chuẩn mực.
        </p>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['off', 'Không có', 'Chỉ phần đệm.'],
              [
                'fill',
                'Câu fill',
                'Đoạn ngắn chêm ở cuối hợp âm, kết thúc ngay cạnh nốt của hợp âm sau để kéo tai sang đó. Thỉnh thoảng mới có, không phải hợp âm nào cũng chêm.',
              ],
              [
                'solo',
                'Đoạn giang tấu',
                'Giai điệu chạy liên tục thay cho giọng hát. Chỉ dùng ở đoạn không có lời, bật suốt bài thì nó đè lên phần hát.',
              ],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMelodyMode(value)}
              title={hint}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                melodyMode === value
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {melodyMode !== 'off' && (
          <p className="mt-2 text-xs leading-relaxed text-dim">
            {melodyMode === 'fill'
              ? 'Đoạn ngắn chêm ở cuối hợp âm, kết thúc ngay cạnh nốt của hợp âm sau để kéo tai sang đó. Thỉnh thoảng mới có, không phải hợp âm nào cũng chêm.'
              : 'Giai điệu chạy liên tục thay cho giọng hát. Chỉ dùng ở đoạn không có lời, bật suốt bài thì nó đè lên phần hát.'}
          </p>
        )}

        {playSolo && (
          <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
            <div>
              <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Chiều nốt láy
              </h4>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['below', 'Từ dưới lên'],
                    ['above', 'Từ trên xuống'],
                    ['mixed', 'Xen kẽ'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSoloDirection(value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      soloDirection === value
                        ? 'border-amber-key bg-amber-key/15 text-amber-key'
                        : 'border-line bg-white/4 text-dim hover:bg-white/8'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                {melodyMode === 'fill' ? 'Bao lâu chêm một câu' : 'Mật độ nốt láy'}
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
              <p className="mt-2 text-xs leading-relaxed text-dim">
                {
                  DENSITY_OPTIONS.find((option) => option.id === soloDensity)
                    ?.description
                }
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => playTimeline(eventsForHand(timeline, 'both'), bpm)}
                disabled={!audioReady || timeline.length === 0}
                className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40"
              >
                ♪ Nghe kèm phần đệm
              </button>

              <span className="font-mono text-[11px] text-dim">
                {melodyMode === 'fill'
                  ? `${solo.length} nốt trong ${Math.round(solo.length / 3)} câu fill`
                  : `${solo.filter((note) => !note.isGrace).length} nốt chính · ${solo.filter((note) => note.isGrace).length} nốt láy`}
              </span>
            </div>

            {hand === 'left' && (
              <p className="rounded-lg border border-amber-key/30 bg-amber-key/5 px-3 py-2 text-xs leading-relaxed text-dim">
                Mục Đệm theo điệu đang để{' '}
                <span className="text-cream">Tay trái</span>. Giai điệu do tay
                phải chơi nên sẽ không nghe thấy — đổi sang Hai tay hoặc Tay
                phải.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Thế bấm hai tay */}
      {twoHands.length > 0 && (
        <div className="rounded-xl border border-line bg-black/25 p-4">
          <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Chia hai tay
          </h3>

          <div className="flex flex-col gap-2">
            {twoHands.map((voicing, index) => (
              <div
                key={`${voicing.symbol}-${index}`}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line/50 pb-2 last:border-0"
              >
                <span className="w-20 font-serif text-base text-cream">
                  {voicing.symbol}
                </span>
                <span className="font-mono text-[11px] text-dim">
                  tay trái{' '}
                  <span className="text-teal-key">
                    {voicing.left.map((note) => midiToName(note)).join(' ')}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-dim">
                  tay phải{' '}
                  <span className="text-amber-key">
                    {voicing.right.map((note) => midiToName(note)).join(' ')}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng chọn nhanh */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Chọn tính chất
          </h3>
          <div className="flex flex-wrap gap-2">
            {PICKER_QUALITIES.map((quality) => (
              <button
                key={quality.suffix}
                type="button"
                onClick={() => setPickerQuality(quality.suffix)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                  pickerQuality === quality.suffix
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-dim hover:bg-white/8'
                }`}
              >
                {quality.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Chạm nốt gốc để thêm hợp âm
          </h3>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {ROOT_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => appendChord(name)}
                className="rounded-lg border border-line bg-white/5 py-3 font-mono text-sm font-semibold text-cream hover:bg-amber-key hover:text-ink"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
