import { useMemo, useState } from 'react'
import { parseChordInput } from './chordInputParser'
import { analyzeAudioFile } from './analyzeAudio'
import { beatsToGrid, mergeBeatChords } from './chromaMatch'
import type { ImportedTrack } from './importedTrack'
import {
  parseChordGrid,
  parseSidecarTrack,
  titleFromSource,
  trackToSongText,
} from './importedTrack'

interface SongImportProps {
  onImport: (track: ImportedTrack) => void
  onSourceFile?: (file: File | null) => void
}

export function SongImport({ onImport, onSourceFile }: SongImportProps) {
  const [url, setUrl] = useState('')
  const [grid, setGrid] = useState('')
  const [bpm, setBpmValue] = useState(72)
  const [meter, setMeter] = useState<3 | 4>(4)
  const [fileName, setFileName] = useState<string | null>(null)
  const [bpmHint, setBpmHint] = useState<string | null>(null)

  const chords = useMemo(() => parseChordGrid(grid, meter), [grid, meter])
  const readable = chords.filter(
    (entry) => parseChordInput(entry.symbol).chords.length > 0,
  )

  const push = (track: ImportedTrack) => {
    onImport(track)
  }

  const apply = () => {
    if (readable.length === 0) return
    push({
      title:
        (url.trim() ? titleFromSource(url.trim()) : null) ??
        fileName ??
        'Bài nhập',
      sourceUrl: url.trim() || undefined,
      bpm,
      beatsPerMeasure: meter,
      chords: readable,
    })
  }

  return (
    <section className="rounded-xl border border-line bg-white/3 p-4">
      <h3 className="mb-1 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Nhập bài từ link hoặc file
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-dim">
        Chọn file nhạc hoặc JSON — lưới hợp âm (đã tái hòa âm) hiện bên dưới.
        Link chỉ lấy tên.
      </p>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-black/25 px-3 py-1.5 text-xs text-cream placeholder:text-dim/50"
        />
        <label className="cursor-pointer rounded-lg border border-line bg-white/4 px-3 py-1.5 text-xs text-dim hover:bg-white/8">
          Chọn nhạc / JSON
          <input
            type="file"
            accept="audio/*,.json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const title = titleFromSource(file.name)
              setFileName(title)
              if (file.name.toLowerCase().endsWith('.json')) {
                void file.text().then((text) => {
                  try {
                    const parsed = JSON.parse(text) as { perBeat?: string[] }
                    const track = parseSidecarTrack(parsed)
                    if (!track) {
                      setBpmHint('JSON sidecar không hợp lệ.')
                      return
                    }
                    setBpmValue(track.bpm)
                    setMeter(track.beatsPerMeasure)
                    setGrid(
                      beatsToGrid(
                        Array.isArray(parsed.perBeat)
                          ? parsed.perBeat
                          : track.chords.flatMap((entry) =>
                              Array.from(
                                {
                                  length: Math.max(1, Math.round(entry.beats)),
                                },
                                () => entry.symbol,
                              ),
                            ),
                        track.beatsPerMeasure,
                      ),
                    )
                    setBpmHint(
                      `Sidecar ${track.bpm} BPM · ${track.key ?? '?'}`,
                    )
                    push({ ...track, title: track.title || title })
                  } catch {
                    setBpmHint('Không đọc được JSON.')
                  }
                })
                return
              }
              onSourceFile?.(file)
              setBpmHint('Đang đọc BPM và hợp âm…')
              void analyzeAudioFile(file, meter).then((result) => {
                if (!result) {
                  setBpmHint('Không đọc được file. Dán lưới hợp âm tay.')
                  return
                }
                setBpmValue(result.bpm)
                setGrid(beatsToGrid(result.perBeat, meter))
                setBpmHint(`Ước ${result.bpm} BPM · đã nạp vào lưới`)
                push({
                  title,
                  bpm: result.bpm,
                  beatsPerMeasure: meter,
                  chords: mergeBeatChords(result.perBeat),
                })
              })
            }}
          />
        </label>
      </div>

      {fileName && (
        <p className="mb-2 font-mono text-[11px] text-dim">
          File: <span className="text-cream">{fileName}</span>
          {bpmHint ? ` · ${bpmHint}` : ''}
        </p>
      )}

      <textarea
        value={grid}
        onChange={(event) => setGrid(event.target.value)}
        rows={3}
        spellCheck={false}
        placeholder={'Hoặc dán lưới: | C | Am | F | G |'}
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
