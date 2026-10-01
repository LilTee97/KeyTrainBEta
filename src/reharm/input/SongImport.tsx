import { useMemo, useState } from 'react'
import { parseChordInput } from './chordInputParser'
import type { ImportedTrack } from './importedTrack'
import { parseChordGrid, trackToSongText } from './importedTrack'

interface SongImportProps {
  onImport: (track: ImportedTrack) => void
}

/** Nhập bài bằng lưới hợp âm. Người dùng 30/9/2026 bỏ nhập từ link và từ file trên máy — chỉ giữ lưới. */
export function SongImport({ onImport }: SongImportProps) {
  const [grid, setGrid] = useState('')
  const bpm = 72
  const [meter, setMeter] = useState<3 | 4>(4)

  const chords = useMemo(() => parseChordGrid(grid, meter), [grid, meter])
  const readable = chords.filter(
    (entry) => parseChordInput(entry.symbol).chords.length > 0,
  )

  const apply = () => {
    if (readable.length === 0) return
    onImport({
      title: 'Bài nhập',
      bpm,
      beatsPerMeasure: meter,
      chords: readable,
    })
  }

  return (
    <section className="rounded-xl border border-line bg-white/3 p-4">
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Nhập bài bằng lưới hợp âm
      </h3>

      <textarea
        value={grid}
        onChange={(event) => setGrid(event.target.value)}
        rows={3}
        spellCheck={false}
        placeholder={'Dán lưới: | C | Am | F | G |'}
        className="w-full rounded-lg border border-line bg-black/25 p-3 font-mono text-xs leading-relaxed text-cream placeholder:text-dim/50"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-dim">
          Nhịp
          <select
            value={meter}
            onChange={(event) => setMeter(Number(event.target.value) as 3 | 4)}
            className="rounded border border-line bg-black/25 px-1.5 py-0.5 font-mono text-cream"
          >
            <option value={4}>4/4</option>
            <option value={3}>3/4</option>
          </select>
        </label>
        <button
          type="button"
          disabled={readable.length === 0}
          onClick={apply}
          className="rounded-lg bg-amber-key px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
        >
          Dùng {readable.length} hợp âm này
        </button>
        {chords.length > 0 && (
          <span className="font-mono text-[11px] text-dim">
            {trackToSongText({
              title: '',
              bpm,
              beatsPerMeasure: meter,
              chords: readable,
            })}
          </span>
        )}
      </div>
    </section>
  )
}
