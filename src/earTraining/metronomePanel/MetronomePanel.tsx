import {
  MAX_BPM,
  MIN_BPM,
  setBeatsPerMeasure,
  setBpm,
  toggleMetronome,
  useMetronomeStore,
} from '../../shared/audio/metronome'

/** Các loại nhịp hay gặp trong nhạc pop và jazz Việt Nam. */
const TIME_SIGNATURES = [
  { beats: 2, label: '2/4', hint: 'march, polka' },
  { beats: 3, label: '3/4', hint: 'valse' },
  { beats: 4, label: '4/4', hint: 'ballad, bossa, swing' },
  { beats: 6, label: '6/8', hint: 'slow rock' },
]

/** Vài mốc nhịp độ để nhảy nhanh, khỏi phải kéo thanh trượt. */
const TEMPO_PRESETS = [60, 80, 100, 120, 140, 180]

export function MetronomePanel() {
  const running = useMetronomeStore((state) => state.running)
  const bpm = useMetronomeStore((state) => state.bpm)
  const beatsPerMeasure = useMetronomeStore((state) => state.beatsPerMeasure)
  const currentBeat = useMetronomeStore((state) => state.currentBeat)
  const currentMeasure = useMetronomeStore((state) => state.currentMeasure)

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Máy đếm nhịp</h2>

      {/* Đèn báo phách */}
      <div className="flex items-center gap-3">
        {Array.from({ length: beatsPerMeasure }, (_, beat) => {
          const isCurrent = running && currentBeat === beat
          const isAccent = beat === 0

          return (
            <span
              key={beat}
              className={`h-10 w-10 rounded-full border-2 transition-colors ${
                isCurrent
                  ? isAccent
                    ? 'border-amber-key bg-amber-key'
                    : 'border-teal-key bg-teal-key'
                  : isAccent
                    ? 'border-amber-key/50 bg-transparent'
                    : 'border-line bg-transparent'
              }`}
            />
          )
        })}

        <span className="ml-2 font-mono text-xs text-dim">
          {running ? `ô nhịp ${currentMeasure + 1}` : 'đang dừng'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggleMetronome}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${
            running
              ? 'border border-line bg-white/6 text-cream hover:bg-white/12'
              : 'bg-amber-key text-ink hover:brightness-110'
          }`}
        >
          {running ? 'Dừng' : 'Bắt đầu'}
        </button>

        <span className="font-serif text-3xl font-semibold text-amber-key">
          {bpm}
          <span className="ml-1 font-mono text-xs font-normal text-dim">
            BPM
          </span>
        </span>
      </div>

      {/* Nhịp độ */}
      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Nhịp độ
        </h3>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBpm(bpm - 1)}
            className="rounded-md border border-line bg-white/6 px-3 py-1.5 text-cream hover:bg-white/12"
          >
            −
          </button>

          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            className="flex-1 accent-amber-key"
          />

          <button
            type="button"
            onClick={() => setBpm(bpm + 1)}
            className="rounded-md border border-line bg-white/6 px-3 py-1.5 text-cream hover:bg-white/12"
          >
            +
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPO_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setBpm(preset)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                bpm === preset
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Loại nhịp */}
      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Loại nhịp
        </h3>

        <div className="flex flex-wrap gap-2">
          {TIME_SIGNATURES.map(({ beats, label, hint }) => (
            <button
              key={label}
              type="button"
              onClick={() => setBeatsPerMeasure(beats)}
              className={`rounded-lg border px-3 py-2 text-left ${
                beatsPerMeasure === beats
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              <span className="block font-mono text-sm">{label}</span>
              <span className="block text-[10px] opacity-70">{hint}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
