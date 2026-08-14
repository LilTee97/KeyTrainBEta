import { useMemo, useState } from 'react'
import {
  playChord,
  playChordSequence,
  startAudio,
  useAudioStore,
} from '../shared/audio/audioEngine'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { chordNotes } from '../shared/musicTheory/chordDefinitions'
import { midiToName, pitchClassName } from '../shared/musicTheory/pitch'
import type { MidiNote } from '../shared/musicTheory/types'
import { fitToKeyboard } from '../shared/musicTheory/voicing'
import { parseChordInput } from './input/chordInputParser'
import {
  plainSequence,
  totalMovement,
} from './reharmEngine/voiceLeadingOptimizer'
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

  const [input, setInput] = useState('Am11 D9sus4 E9sus4 Em7')
  const [pickerQuality, setPickerQuality] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  /** Bật dẫn bè hay để thế bấm mộc, dùng để nghe đối chiếu. */
  const [smoothVoicing, setSmoothVoicing] = useState(true)
  const [dropRoot, setDropRoot] = useState(true)

  const sequence = useMemo(() => parseChordInput(input), [input])

  /** Thế bấm hai tay đã dẫn bè. */
  const twoHands = useMemo(
    () =>
      voiceLeadTwoHands(sequence.chords, {
        dropRootFromRightHand: dropRoot,
      }),
    [sequence.chords, dropRoot],
  )

  /** Thế bấm mộc, chỉ xếp chồng từ nốt gốc — để đối chiếu. */
  const plain = useMemo(
    () => plainSequence(sequence.chords),
    [sequence.chords],
  )

  /** Nốt để phát, theo chế độ đang chọn. */
  const playbackNotes = useMemo(
    () =>
      smoothVoicing
        ? twoHands.map(flattenHands)
        : sequence.chords.map((chord, index) => [
            // Thế mộc vẫn có nốt bass tay trái để so sánh công bằng
            twoHands[index]?.left[0] ?? chord.root + 40,
            ...plain[index],
          ]),
    [smoothVoicing, twoHands, plain, sequence.chords],
  )

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
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40"
          >
            ♪ Nghe cả vòng
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

      <OnScreenPiano
        highlightNotes={
          selectedIndex !== null
            ? (playbackNotes[selectedIndex] ??
              (selected ? notesForChord(selected) : undefined))
            : undefined
        }
      />

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
